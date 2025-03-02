"use client";

import React, { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Link, RotateCw,Inspect } from "lucide-react";
import * as esbuild from "esbuild-wasm";
import { injectConsoleLogging } from "@/lib/utils";
import { fetchPackages, getGlobalVarName } from "@/lib/packageFetcher";

export default function PreviewWindow({
    type,
    files,
    newPackages
}: {
    type: string;
    files: Array<{
        id: string;
        name: string;
        type: string;
        content: string;
        saved: boolean;
    }>;
    newPackages: any;
}) {
    const ref = useRef<HTMLIFrameElement>(null);
    const [iframeKey, setIframeKey] = useState(0);
    const [srcDoc, setSrcDoc] = useState<string>("");
    const [esbuildInitialized, setEsbuildInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    //Console logs
    const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

    const toggleDevTools = () => {
        setIsDevToolsOpen(!isDevToolsOpen);
        if (!isDevToolsOpen) {
            setConsoleLogs([]);
        }
    };

    const initializeEsbuild = async () => {
        if (!esbuildInitialized && !isInitializing) {
            setIsInitializing(true);
            try {
                const wasmURL = '/esbuild.wasm';
                
                const wasmResponse = await fetch(wasmURL);
                if (!wasmResponse.ok) {
                    throw new Error('Failed to load esbuild.wasm');
                }

                await esbuild.initialize({
                    worker: true,
                    wasmURL,
                    wasmModule: await WebAssembly.compileStreaming(wasmResponse),
                });
                
                setEsbuildInitialized(true);
            } catch (error) {
                console.error("Failed to initialize esbuild:", error);
                toast.error("Failed to initialize esbuild. Please check console for details.");
            } finally {
                setIsInitializing(false);
            }
        }
    };

    const buildReactBundle = async () => {
        if (!esbuildInitialized) {
            toast.error("esbuild is not initialized yet");
            return;
        }
    
        try {
            const entryFile = files.find((file) => file.name === "main.jsx");
            if (!entryFile) {
                toast.error("main.jsx file is missing.");
                return;
            }
    
            const fileMap = files.reduce((acc, file) => {
                // Store files both with and without extension for flexible resolution
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                acc[file.name] = file.content;
                acc[nameWithoutExt] = file.content;
                acc[`/${file.name}`] = file.content; 
                return acc;
            }, {} as Record<string, string>);

            // External pacakges
            let newPackages:any = files.find((file) => file.name === "package.json");
            if (!newPackages) {
                toast.error("package.json file is missing.");
                return;
            }
            newPackages = JSON.parse(newPackages.content).dependencies;
            newPackages = Object.keys(newPackages).map((pkg) => ({name: pkg, version: newPackages[pkg]}));
            const externalPackages = await newPackages.filter((pkg:any) => pkg.name !== 'react' && pkg.name !== 'react-dom').reduce(async (accPromise:any, pkg:any) => {
                const acc = await accPromise;
                const results = await fetchPackages(pkg.name);
                acc[pkg.name] = `https://unpkg.com/${pkg.name}@${pkg.version}/${results[0].main}`;
                return acc;
            }, Promise.resolve({}));
    
            // Build the bundle
            const result = await esbuild.build({
                stdin: {
                    contents: entryFile.content,
                    loader: "jsx",
                    sourcefile: "main.jsx",
                },
                bundle: true,
                write: false,
                format: 'iife',
                target: ['es2015'],
                jsxFactory: 'React.createElement',
                jsxFragment: 'React.Fragment',
                define: {
                    'process.env.NODE_ENV': '"development"',
                },
                plugins: [
                    {
                        name: "file-resolver",
                        setup(build) {
                            // Handle external pacakges
                            build.onResolve({ filter: /^(\w|-)+$/ }, (args) => {
                                const importPath = args.path.startsWith('/') ? args.path.slice(1) : args.path;
                                if (importPath === 'react' || importPath === 'react-dom') {
                                    return;
                                }
                                if (externalPackages[importPath]) {
                                  return {path: importPath, namespace: 'external-import'};
                                }
                                return { path: importPath, external: true };
                            });
                            // Handle bare imports (react, react-dom, etc)
                            build.onResolve({ filter: /^react(-dom)?$/ }, (args) => {
                                return { path: args.path, namespace: 'external-import' };
                            });
    
                            // Handle CSS imports
                            build.onResolve({ filter: /\.css$/ }, (args) => {
                                const importPath = args.path.startsWith('/') ? args.path.slice(1) : args.path;
                                return {
                                    path: importPath,
                                    namespace: 'style-handling'
                                };
                            });
    
                            // Handle relative imports
                            build.onResolve({ filter: /^\.+\// }, (args) => {
                                const importPath = args.path.replace(/^\.\//, '');
                                const possiblePaths = [
                                    importPath,
                                    `${importPath}.jsx`,
                                    `${importPath}.js`,
                                    `${importPath}/index.jsx`,
                                    `${importPath}/index.js`
                                ];
    
                                const existingPath = possiblePaths.find(path => fileMap[path]);
                                
                                if (!existingPath) {
                                    throw new Error(`Could not resolve ${args.path}. Tried: ${possiblePaths.join(', ')}`);
                                }
                                return {
                                    path: existingPath,
                                    namespace: 'local-file'
                                };
                            });
    
                            // Load files from our virtual file system
                            build.onLoad({ filter: /.*/, namespace: 'local-file' }, (args) => {
                                const content = fileMap[args.path];
                                if (!content) {
                                    throw new Error(`Could not find file ${args.path}`);
                                }                       
                                const loader = args.path.endsWith('.jsx') ? 'jsx' : 'jsx';
                                return { contents: content, loader };
                            });
    
                            // Handle CSS files
                            build.onLoad({ filter: /.*/, namespace: 'style-handling' }, (args) => {
                                const content = fileMap[args.path];
                                if (!content) {
                                    throw new Error(`Could not find CSS file ${args.path}`);
                                }
                                const jsContent = `
                                    const style = document.createElement('style');
                                    style.textContent = ${JSON.stringify(content)};
                                    document.head.appendChild(style);
                                `;
                                
                                return {
                                    contents: jsContent,
                                    loader: 'js'
                                };
                            });
    
                            // Handle external imports
                            build.onLoad({ filter: /.*/, namespace: 'external-import' }, (args) => {
                                if (args.path === 'react') {
                                    return {
                                        contents: 'module.exports = window.React;',
                                        loader: 'js',
                                    };
                                }
                                if (args.path === 'react-dom') {
                                    return {
                                        contents: 'module.exports = window.ReactDOM;',
                                        loader: 'js',
                                    };
                                }
                                if (externalPackages[args.path]) {
                                    return {
                                      contents: `module.exports = window.${getGlobalVarName(args.path)};`,
                                      loader: 'js',
                                    };
                                }
                            });
                        },
                    },
                ],
            });
            const bundledCode = result.outputFiles[0].text;
            const htmlFile = files.find((file) => file.name === "index.html");

            const cdnScriptTags = Object.values(externalPackages).map((link: any) => 
                `<script crossorigin src="${link}"></script>`
              ).join('\n');
            if (htmlFile) {
                const combinedHTML = injectConsoleLogging(htmlFile.content.replace(
                    "</body>",
                    `
                    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
                    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
                    ${cdnScriptTags}
                    <script>${bundledCode}</script>
                    </body>
                    `
                ));
                setSrcDoc(combinedHTML);
            }
        } catch (error) {
            console.error("Error bundling React files:", error);
        }
    };

    const runReactApp = async () => {
        try {
            await initializeEsbuild();
            if (esbuildInitialized) {
                await buildReactBundle();
            }
        } catch (error) {
            console.error("Error running React app:", error);
            toast.error("Failed to run React app.");
        }
    };

    useEffect(() => {
        const handleConsoleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data && event.data.type === 'console-log') {
                const logEntry = `[${event.data.level}] ${event.data.args.map((arg:any) => 
                    typeof arg === 'object' ? JSON.stringify(arg) : arg
                ).join(' ')}`;
                
                setConsoleLogs(prev => [...prev, logEntry]);
            }
        };

        window.addEventListener('message', handleConsoleMessage);
        return () => window.removeEventListener('message', handleConsoleMessage);
    }, []);

    useEffect(() => {
        if (type === "html-css" || type === "html-css-js") {
            const htmlFile = files.find((file) => file.name === "index.html");
            const cssFile = files.find((file) => file.name === "style.css");
            const jsFiles = files.filter((file) => file.name.endsWith(".js"));

            if (htmlFile && cssFile) {
                let combinedHTML = htmlFile.content.replace(
                    "</head>",
                    `<style>${cssFile.content}</style></head>`
                );

                if (jsFiles.length > 0) {
                    const scriptTags = jsFiles
                        .map((jsFile) => {
                            const isModule = jsFile.name.endsWith(".module.js");
                            return `<script ${
                                isModule ? "type='module'" : ""
                            } data-filename="${jsFile.name}">
                                    ${jsFile.content}
                                   </script>`;
                        })
                        .join("\n");
                    combinedHTML = combinedHTML.replace("</body>", `${scriptTags}\n</body>`);
                }

                setSrcDoc(combinedHTML);
            }
        } else if (type === "react") {
            runReactApp();
        }
    }, [files, type, esbuildInitialized, newPackages]);

    return (
        <>
            <div className="h-10 select-none w-full flex gap-2">
                <div className="flex items-center w-full justify-between h-8 rounded-md px-3 bg-secondary">
                    <div className="text-xs">Preview</div>
                    <div className="flex space-x-1 translate-x-1">
                        <PreviewButton
                            onClick={() => {
                                navigator.clipboard.writeText(`http://localhost:5173`);
                                toast.info("Copied preview link to clipboard");
                            }}
                        >
                            <Link className="w-4 h-4" />
                        </PreviewButton>

                        <PreviewButton
                            onClick={() => {
                                setIframeKey((prev) => prev + 1);
                                runReactApp(); // Re-run the app when refreshing
                            }}
                        >
                            <RotateCw className="w-4 h-4" />
                        </PreviewButton>

                        <PreviewButton onClick={toggleDevTools}>
                            <Inspect className="w-4 h-4" />
                        </PreviewButton>

                    </div>
                </div>
            </div>
            <div className="w-full grow rounded-md bg-foreground">
                <iframe
                    key={iframeKey}
                    ref={ref}
                    width="100%"
                    height={isDevToolsOpen ? "70%" : "100%"}
                    srcDoc={srcDoc || "<h1>Loading...</h1>"}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                />
            </div>
            {isDevToolsOpen && (
                    <div className="w-full h-[30%] bg-black text-white p-2 overflow-auto">
                        <div className="font-bold mb-2">Console Logs</div>
                        {consoleLogs.map((log, index) => (
                            <div 
                                key={index} 
                                className="text-xs font-mono whitespace-pre-wrap"
                            >
                                {log}
                            </div>
                        ))}
                    </div>
                )}
        </>
    );
}

function PreviewButton({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <div
            className="p-0.5 h-5 w-5 ml-0.5 flex items-center justify-center transition-colors bg-transparent hover:bg-muted-foreground/25 cursor-pointer rounded-sm"
            onClick={onClick}
        >
            {children}
        </div>
    );
}
"use client";

import React, { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Link, RotateCw } from "lucide-react";
import * as esbuild from "esbuild-wasm";

export default function PreviewWindow({
    type,
    files,
}: {
    type: string;
    files: Array<{
        id: string;
        name: string;
        type: string;
        content: string;
        saved: boolean;
    }>;
}) {
    console.log("files", files);
    const ref = useRef<HTMLIFrameElement>(null);
    const [iframeKey, setIframeKey] = useState(0);
    const [srcDoc, setSrcDoc] = useState<string>("");
    const [esbuildInitialized, setEsbuildInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

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
                return acc;
            }, {} as Record<string, string>);
            // console.log("fileMap", fileMap);

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
                            // Handle bare imports (react, react-dom, etc)
                            build.onResolve({ filter: /^react(-dom)?$/ }, (args) => {
                                return { path: args.path, namespace: 'external-import' };
                            });

                            // Handle relative imports
                            build.onResolve({ filter: /^\.+\// }, (args) => {
                                const importPath = args.path.replace(/^\.\//, '');
                                
                                // Try different possible file paths
                                const possiblePaths = [
                                    importPath,
                                    `${importPath}.jsx`,
                                    `${importPath}.js`,
                                    `${importPath}/index.jsx`,
                                    `${importPath}/index.js`
                                ];


                                const existingPath = possiblePaths.find((path) => {
                                    if (path === 'App') {
                                        return 'App.jsx'
                                    }
                                    return fileMap[path];
                                });
                                
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
                                // const loader = 'jsx';                            
                                return { contents: content, loader };
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
                            });
                        },
                    },
                ],
            });   
            const bundledCode = result.outputFiles[0].text;
            const htmlFile = files.find((file) => file.name === "index.html");
            
            if (htmlFile) {
                // Include React and ReactDOM from CDN before the bundle
                const combinedHTML = htmlFile.content.replace(
                    "</body>",
                    `
                    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
                    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
                    <script>${bundledCode}</script>
                    </body>
                    `
                );
                setSrcDoc(combinedHTML);
            }
        } catch (error:any) {
            console.error("Error bundling React files:", error);
            toast.error("Failed to bundle React files: " + error.message);
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
    }, [files, type, esbuildInitialized]);

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
                    </div>
                </div>
            </div>
            <div className="w-full grow rounded-md bg-foreground">
                <iframe
                    key={iframeKey}
                    ref={ref}
                    width="100%"
                    height="100%"
                    srcDoc={srcDoc || "<h1>Loading...</h1>"}
                    sandbox="allow-scripts allow-same-origin allow-forms"
                />
            </div>
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
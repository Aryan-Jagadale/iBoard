"use client";

import React, { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Link, RotateCw } from "lucide-react";
import { io, Socket } from "socket.io-client";


export default function PreviewWindow({
    type,
    files,
    newPackages,
    servervboxId
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
    servervboxId: string;
}) {
    const ref = useRef<HTMLIFrameElement>(null);
    const [iframeKey, setIframeKey] = useState(0);
    const [srcDoc, setSrcDoc] = useState<string>("");
    const socketRef = useRef<Socket | null>(null);

    const runReactApp = async (data:any) => {
        try {
            let styleTag = document.querySelector("#dynamic-style");
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = "dynamic-style";
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = data?.cssFiles;

        const reactAppHTML = `
            <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>React App Preview</title>
                    <style>${data?.cssFiles}</style> 
                </head>
                <body>
                    <div id="root"></div>
                    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
                    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
                    <script>${data?.bundle}</script>
                </body>
                </html>`;
        setSrcDoc(reactAppHTML);

        } catch (error) {
            console.error("Error running React app:", error);
            toast.error("Failed to run React app.");
        }
    };

    useEffect(() => {
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000");
        socketRef.current.on("connect", () => {
          console.log("WebSocket connected:", socketRef.current?.id);
        });
        socketRef.current.on("disconnect", () => {
          console.log("WebSocket disconnected");
        });

        socketRef.current.on("build_complete", (data) => {
            console.log("Build complete:");
            runReactApp(data);
        })

        return () => {
            socketRef.current?.off("build_complete");
            socketRef.current?.disconnect()};
    }, [iframeKey]);

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
        }
    }, [files, type,newPackages]);

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
                    height={"100%"}
                    srcDoc={srcDoc || "<h1>Start typing in editor...</h1>"}
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
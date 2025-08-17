"use client";

import React, { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Link, RotateCw } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { saveBuildToIndexedDB } from "@/lib/db";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { reactAppHTML, tailwindReactAppHTML } from "@/lib/react-syntax";
import { htmlCSSJSSyntax } from "@/lib/html-css-js-sytax";


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
    const storePreview = useMutation(api.virtualBoxes.storePreview);

    const runReactApp = async (data: any) => {
    try {
        if (data?.virtualboxType === 'react-tailwind') {
            if (!data.indexHtml) {
                throw new Error("index.html content missing in build data");
            }

            const htmlTailwindReact = tailwindReactAppHTML(data)

            await storePreview({
                vbId: data.vbId,
                indexHtml: data.indexHtml,
                bundle: data.bundle,  // ensure this is not undefined
                cssFiles: data.cssFiles,
                virtualboxType: data.virtualboxType,
                isCompressed: data.isCompressed
            });
            setSrcDoc(htmlTailwindReact);
        } else if (data?.virtualboxType === 'react') {
            let reactHTML  = reactAppHTML(data);
            await storePreview({
                vbId: data.vbId,
                indexHtml: data.indexHtml,
                bundle: data.bundle,  // ensure this is not undefined
                cssFiles: data.cssFiles,
                virtualboxType: data.virtualboxType,
                isCompressed: data.isCompressed
            });

            setSrcDoc(reactHTML);

        }
        
    } catch (error) {
        console.error("Error running React app:", error);
        toast.error("Failed to run React app.");
    }
};

    useEffect(() => {
        socketRef.current = io(process.env.NEXT_PUBLIC_BUILD_SOCKET_URL);
        socketRef.current.on("connect", () => {
            if (socketRef.current) {
                socketRef.current.emit('join_build', { vbId: servervboxId });
                console.log("WebSocket connected:", socketRef.current?.id);
            }
        });
        socketRef.current.on("disconnect", () => {
          console.log("WebSocket disconnected");
        });

        socketRef.current.on("build_complete",async (data) => {
            if (data?.vbId === servervboxId) {
                console.log("Build complete:");
                console.log("Received data:", data);
                runReactApp(data);
                console.log("No build found in indexedDB, saving new build");
                // await saveBuildToIndexedDB(data?.vbId, data?.bundle, data?.cssFiles); 
            }
        })

        return () => {
            socketRef.current?.off("build_complete");
            socketRef.current?.disconnect();
        };
    }, [iframeKey,servervboxId]);

    useEffect(() => {
        const updatePreview = async () => {
            if (type === "html-css" || type === "html-css-js") {
                const combinedHTML = htmlCSSJSSyntax(files);

                await storePreview({
                    vbId: servervboxId,
                    indexHtml: combinedHTML,
                    bundle: new ArrayBuffer(0),
                    cssFiles: "",
                    virtualboxType: type,
                    isCompressed: false
                });
                
                setSrcDoc(combinedHTML);
            }
        };
        
        updatePreview();
    }, [files, type, newPackages, storePreview, servervboxId]);

    return (
        <>
            <div className="h-10 select-none w-full flex gap-2">
                <div className="flex items-center w-full justify-between h-8 rounded-md px-3 bg-secondary">
                    <div className="text-xs">Preview</div>
                    <div className="flex space-x-1 translate-x-1">
                        <PreviewButton
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/code/${servervboxId}/preview`);
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
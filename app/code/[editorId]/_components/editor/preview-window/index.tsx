"use client";

import React, { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Link, RotateCw } from "lucide-react";

export default function PreviewWindow({
    type,
    files,
}: {
    type: string;
    files: Array<any>; // Replace with a proper type for your file structure
}) {
    const ref = useRef<HTMLIFrameElement>(null);
    const [iframeKey, setIframeKey] = useState(0);
    const [srcDoc, setSrcDoc] = useState<string>("");
    useEffect(() => {
        const htmlFile = files.find((file) => file.name === "index.html");
        const cssFile = files.find((file) => file.name === "style.css");
        if (htmlFile && cssFile) {
            const combinedHTML = htmlFile.content.replace(
                '</head>',
                `<style>${cssFile.content}</style></head>`
            );

            setSrcDoc(combinedHTML);
        }
    }, [files]);
    

    

    return (
        <>
            <div
                className={` h-10 select-none w-full flex gap-2`}
            >
                <div className="flex items-center w-full justify-between h-8 rounded-md px-3 bg-secondary">
                    <div className="text-xs">Preview</div>
                    <div className="flex space-x-1 translate-x-1">
                        <>
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
                                    setIframeKey((prev) => prev + 1); // Force iframe reload
                                }}
                            >
                                <RotateCw className="w-4 h-4" />
                            </PreviewButton>
                        </>
                    </div>
                </div>
            </div>
            <div className="w-full grow rounded-md bg-foreground">
                <iframe
                    key={iframeKey}
                    ref={ref}
                    width={"100%"}
                    height={"100%"}
                    srcDoc={srcDoc}
                    sandbox="allow-scripts allow-same-origin"
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

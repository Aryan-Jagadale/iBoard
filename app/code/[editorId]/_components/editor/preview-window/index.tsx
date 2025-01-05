"use client";

import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Link, RotateCw } from "lucide-react";

export default function PreviewWindow({
    type,
    files,
}: {
    type: string;
    files: Array<any>; // Replace with a proper type for your file structure
}) {
    const ref = useRef<HTMLIFrameElement>(null);
    const [iframeKey, setIframeKey] = useState(0);

    const generateHTMLContent = () => {
        const htmlFile = files.find((file) => file.name === "index.html")?.content || "";
        const cssFile = files.find((file) => file.name === "style.css")?.content || "";
        const jsFiles = files
            .flatMap((file) => (file.type === "folder" ? file.children : file))
            .filter((file) => file.name.endsWith(".js"))
            .map((file) => file.content)
            .join("\n");

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Preview</title>
                <style>${cssFile}</style>
            </head>
            <body>
                ${htmlFile}
                <script>${jsFiles}</script>
            </body>
            </html>
        `;
    };

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
                    srcDoc={generateHTMLContent()} // Dynamically inject content
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

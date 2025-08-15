'use client'
import { useQuery } from 'convex/react';
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from 'react';
import { reactAppHTML, tailwindReactAppHTML } from '@/lib/react-syntax';

const PreviewScreen = () => {
    const params = useParams();
    const [srcDoc, setSrcDoc] = useState<string>("");

    const editorId = params.editorId as string;

    const previewResponse = useQuery(api.virtualBoxes.getPreview, {
        vbId: editorId,
    });

    useEffect(() => {
        if (!previewResponse) {
            setSrcDoc("<h1>Project not found</h1>");
            return;
        };

        if (previewResponse.virtualboxType === 'react-tailwind') {
            if (!previewResponse.indexHtml) {
                console.error("index.html content missing in build data");
                return;
            }
            const html = tailwindReactAppHTML(previewResponse)
            setSrcDoc(html);
            return;
        }else if(previewResponse.virtualboxType === "html-css-js" || previewResponse.virtualboxType === "html-css") {
            setSrcDoc(previewResponse.indexHtml ?? "<h1>Start typing in editor...</h1>");
            return;
        }
        const htmlReactAppHTML = reactAppHTML(previewResponse);
        setSrcDoc(htmlReactAppHTML);
    }, [previewResponse]);

    return (
        <>
            <iframe 
                srcDoc={srcDoc || "<h1>Start typing in editor...</h1>"}
                sandbox="allow-scripts allow-same-origin" 
                className="w-full h-full" 
            />
        </>
    );
}

export default PreviewScreen;

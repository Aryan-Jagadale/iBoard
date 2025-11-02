'use client'
import { useQuery } from 'convex/react';
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from 'react';
import { reactAppHTML, tailwindReactAppHTML } from '@/lib/react-syntax';
import { CustomSidebar } from '@/components/custom-sidebar';
import { FloatingButton } from '@/components/floating-button';

const PreviewScreen = () => {
    const params = useParams();
    const [srcDoc, setSrcDoc] = useState<string>("");
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

    const editorId = params.editorId as string;

    const previewResponse = useQuery(api.virtualBoxes.getPreview, {
        vbId: editorId,
    });

    useEffect(() => {
        if (!previewResponse) {
            setSrcDoc("<h1>Loading....</h1>");
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

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="w-full h-full flex">
            {/* Main Preview Content */}
            <div 
                className="flex-1 relative transition-all duration-300 ease-in-out"
                style={{
                    marginRight: isSidebarOpen ? '0px' : '0px'
                }}
            >
                <iframe 
                    srcDoc={srcDoc || "<h1>Start typing in editor...</h1>"}
                    sandbox="allow-scripts allow-same-origin" 
                    className="w-full h-full" 
                />
                
                {/* Floating Button */}
                <FloatingButton 
                    onClick={toggleSidebar}
                    isOpen={isSidebarOpen}
                />
            </div>

            {/* Custom Sidebar */}
            <CustomSidebar
                isOpen={isSidebarOpen}
                onClose={closeSidebar}
                title="Preview Tools"
                width={320}
            >
               <p>Moew</p>
            </CustomSidebar>
        </div>
    );
}

export default PreviewScreen;

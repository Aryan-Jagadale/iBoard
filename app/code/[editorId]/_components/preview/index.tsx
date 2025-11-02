'use client'
import { useQuery } from 'convex/react';
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from 'react';
import { reactAppHTML, tailwindReactAppHTML } from '@/lib/react-syntax';
import { CustomSidebar } from '@/components/custom-sidebar';
import { FloatingButton } from '@/components/floating-button';
import { ContentEditableEditor } from './ContentEditableEditor';


const PreviewScreen = () => {
    const params = useParams();
    const [srcDoc, setSrcDoc] = useState<string>("");
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingHTML, setEditingHTML] = useState<string>('');

    const iframeRef = useRef<HTMLIFrameElement>(null);

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
        } else if (previewResponse.virtualboxType === "html-css-js" || previewResponse.virtualboxType === "html-css") {
            setSrcDoc(previewResponse.indexHtml ?? "<h1>Start typing in editor...</h1>");
            return;
        }
        const htmlReactAppHTML = reactAppHTML(previewResponse);
        setSrcDoc(htmlReactAppHTML);
    }, [previewResponse]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const sendUpdate = (id: string, html: string) => {
        console.log("id",id);
        console.log("html",html);
        
        
        iframeRef.current?.contentWindow?.postMessage(
            { type: 'UPDATE_TEXT', id, html },
            '*'
        );
    };

    const closeSidebar = () => {
        // Send close message to iframe
        iframeRef.current?.contentWindow?.postMessage(
            { type: 'CLOSE_EDITOR' },
            '*'
        );
        setIsSidebarOpen(false);
        setEditingId(null);
    };

    useEffect(() => {
        const handler = (ev: MessageEvent) => {
            if (ev.source !== iframeRef.current?.contentWindow) return;
            const { type, id, html } = ev.data ?? {};
            console.log("type",type);
            

            if (type === 'OPEN_EDITOR') {
                setEditingId(id);
                setEditingHTML(html);
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    console.log("editingId",editingId);
    console.log("editing",editingHTML);
    
    

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
                    ref={iframeRef}
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
                {editingId ? (
                    <ContentEditableEditor
                        initialHTML={editingHTML}
                        onSave={(newHtml) => {
                            sendUpdate(editingId, newHtml);
                            closeSidebar();
                        }}
                    />
                ) : (
                    <div className="p-4">
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Preview Editor</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>• <strong>Double-click</strong> any text to edit</p>
                            <p>• <strong>Single-click</strong> to see editable areas</p>
                            <p>• Changes are updated in real-time</p>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <p className="text-sm text-blue-700">
                                💡 Tip: Hover over text elements to see which ones are editable
                            </p>
                        </div>
                    </div>
                )}
            </CustomSidebar>
        </div>
    );
}

export default PreviewScreen;

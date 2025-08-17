"use client";
import Editor, { BeforeMount,OnMount } from '@monaco-editor/react';
import * as monacoTypes from "monaco-editor";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useEffect, useRef, useState } from 'react';
import monaco from "monaco-editor";
import Sidebar from './sidebar/index';
import { useClerk } from "@clerk/nextjs";
import Tab from "@/components/ui/tab";
import { cleanSanitizeContent, processFileType, truncateContent } from '@/lib/utils';
import PreviewWindow from './preview-window';
import { getVirualBoxRequest } from '@/lib/axios';
import dynamic from 'next/dynamic';
const EditorTerminal = dynamic(() => import('./terminal'), {
    ssr: false // Disable server-side rendering
});
import { io, Socket } from "socket.io-client";
import { useDebounce } from '@/hooks/useDebounce';
import { draculaTheme } from '@/lib/dracula-theme';
import { useAuth } from "@clerk/nextjs";
import { SelectionData } from '@/types/selection-data';
import { toast } from 'sonner';
import { AiSuggestionModal } from './ai-suggestion-modal';

const CodeEditor = () => {
    const editorRef = useRef<null | monaco.editor.IStandaloneCodeEditor>(null);
    const monacoRef = useRef<typeof monacoTypes | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    const [editorLanguage, setEditorLanguage] = useState<string | undefined>(
        undefined
    );
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string>("");
    const [tabs, setTabs] = useState<any[]>([]);
    const [serverFiles, setServerFiles] = useState<any[]>([]);
    const [serverFileType, setServerFileType] = useState<"react" | "html-css" | "html-css-js" | "react-tailwind">("react");
    const [servervboxId, setServerVboxId] = useState("");
    const [serverS3path, setServerS3path] = useState<any[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const [newPackages, setNewPackages] = useState([]);
    const [selectedData, setSelectedData] = useState<SelectionData | null>(null);
    const [prompt, setPrompt] = useState<string>("");
    const { getToken, isSignedIn, userId } = useAuth();

    // const [aiStream, setAiStream] = useState<string>("");
    const [aiStreaming, setAiStreaming] = useState<boolean>(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [showSuggestion, setShowSuggestion] = useState<boolean>(false);

    const clerk = useClerk();

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        editor.onDidChangeCursorSelection((e) => {
            const selection = editor.getSelection();
            if (selection) {
                const selectedText: string = editor.getModel()?.getValueInRange(selection) ?? "";
                const cleanedContent = cleanSanitizeContent(selectedText);
                const finalContent = truncateContent(cleanedContent);

                const newSelectionData: SelectionData = {
                    range: {
                      startLineNumber: selection.startLineNumber,
                      startColumn: selection.startColumn,
                      endLineNumber: selection.endLineNumber,
                      endColumn: selection.endColumn,
                    },
                    content: finalContent,
                };
                setSelectedData(newSelectionData);
            }
        });

        window.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
            }
        });
    };

    const selectFile = (tab: any) => {
        if (tab.id === activeId) return;
        const exists = tabs.find((t) => t.id === tab.id);
        setTabs((prev) => {
            if (exists) {
                setActiveId(exists.id);
                return prev;
            }
            return [...prev, {...tab,saved:true}];
        });

        setEditorLanguage(processFileType(tab.name));
        const file = serverFiles.find((file) => file.id === tab.id);
        if (file) {
            setActiveFile(file.content);
        }
        setActiveId(tab.id);
    };

    const closeTab = (id: string) => {
        const numTabs = tabs.length;
        const index = tabs.findIndex((t) => t.id === id);
        if (index === -1) return;
        const nextId =
          activeId === id
            ? numTabs === 1
              ? null
              : index < numTabs - 1
              ? tabs[index + 1].id
              : tabs[index - 1].id
            : activeId;
    
        setTabs((prev) => prev.filter((t) => t.id !== id));
    
        if (!nextId) {
          setActiveId("");
          setActiveFile(null);
        } else {
          const nextTab = tabs.find((t) => t.id === nextId);
          if (nextTab) selectFile(nextTab);
        }
    };


    const sendDatatoBackednLLM = async () => {
        try {
        console.log("Sending selection to backend:", selectedData);
            
          if(selectedData && selectedData.content.length > 10){
            const { range, content } = selectedData;
            const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
            const fileId = activeId;
            const fileName = serverFiles.find((file) => file.id === activeId)?.name;
            const bucketPath = serverS3path.find((file) => file.id === activeId)?.bucketPath;
            const virtualboxId = servervboxId;

            let payload = {
                type:'ai-assist',
                selection: {
                    startLineNumber,
                    startColumn,
                    endLineNumber,
                    endColumn,
                },
                code:content,
                prompt:prompt,
                fileId,
                fileName,
                virtualboxId,
                virtualboxType: serverFileType,
                llmType:"groq"
            }
            setAiSuggestion("");
            setAiStreaming(false);
            socketRef.current?.emit("send-to-ai-msg", payload);
          }else{
            toast.error("Please select a valid code snippet");
            return;
          }
        } catch (error) {
          console.error("Error sending selection to backend:", error);
        }
    }

    const debouncedFileUpdate = useDebounce((fileId: string, content: string,virtualboxId:string,bucketPath:string,fileName:string) => {
   
        socketRef.current?.emit("fileUpdate", {
            fileId,
            content,
            virtualboxId,
            bucketPath,
            fileName,
            virtualboxType: serverFileType,
        });
    }, { delay: 1000 });


    const handleEditorWillMount: BeforeMount = (monaco) => {
        monaco.editor.defineTheme('dracula', draculaTheme);
        monaco.editor.addKeybindingRules([
          {
            keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG,
            command: "null",
          },
        ]);
    };

    useEffect(() => {
        if (!socketRef.current) return;

        const handleFileUpdatedBroadcast = (data: { fileId: string; content: string }) => {
            console.log("Received fileUpdatedBroadcast:", data); // Debug log
            const updatedFiles = serverFiles.map((file) => {
                if (file.id === data.fileId) {
                    return { ...file, content: data.content, saved: true };
                }
                return file;
            });
            setServerFiles(updatedFiles);
            // Update activeFile if the updated file is active
            if (data.fileId === activeId) {
                setActiveFile(data.content);
                setTabs((prev) =>
                    prev.map((tab) =>
                        tab.id === activeId ? { ...tab, saved: true } : tab
                    )
                );
            }
        };
        socketRef.current.on("fileUpdatedBroadcast", handleFileUpdatedBroadcast);
        return () => {
            socketRef.current?.off("fileUpdatedBroadcast", handleFileUpdatedBroadcast);
        };
    }, [serverFiles, activeId, activeFile]);

    useEffect(() => {

        if (!editorRef.current || !monacoRef.current) return;
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        editor.addCommand(monaco?.KeyMod.CtrlCmd | monaco?.KeyCode.KeyS, () => {
            const value = editor.getValue();
            console.log("tabs", tabs);
            console.log("Active ID:", activeId);
            console.log("Server VBox ID:", servervboxId);
            if (activeId && servervboxId) {
                const file = serverFiles.find((file) => file.id === activeId);
                console.log("File:", file);

                if (!file) {
                    console.error("File not found for activeId:", activeId);
                    toast.error("Cannot save: File not found");
                    return;
                }
                console.log("value", value);

                debouncedFileUpdate(activeId, value, servervboxId, file.bucketPath, file.name);
                setTabs((prev) =>
                    prev.map((tab) =>
                        tab.id === activeId ? { ...tab, saved: true } : tab
                    )
                );
            } else {
                console.error("Active ID or server VBox ID is not set.");
            }
        });

    }, [tabs, activeId, servervboxId])

    useEffect(() => {
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL,{
            transports: ["websocket",'polling'],
            auth: async (cb) => {
                if (isSignedIn) {
                    const token = await getToken();
                    cb({ token });
                } else {
                    cb({ token: null });
                }
            },
        });
        socketRef.current.on("connect", () => {
          console.log("WebSocket connected:", socketRef.current?.id);
        });
        socketRef.current.on("disconnect", () => {
          console.log("WebSocket disconnected");
        });
        return () => {
          socketRef.current?.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!socketRef.current) return;
        socketRef.current.on("ai-stream", (chunk: string) => {
            setAiSuggestion((prev) => (prev ?? "") + chunk);
            setShowSuggestion(true);
        });

        // Listen for AI stream end
        socketRef.current.on("ai-stream-end", () => {
            console.log("AI stream ended------");
            setAiStreaming(false);
        });

        // Cleanup listeners on unmount
        return () => {
            socketRef.current?.off("ai-stream");
            socketRef.current?.off("ai-stream-end");
        };
    }, []);

    useEffect(() => {
        async function fetchData() {
            const editorId = window.location.pathname.split("/")[2];
            const responseVB:any = await getVirualBoxRequest(`/api/getVirtualBoxData?virtualboxId=${editorId}`);
            if(!responseVB.data) return;
            if (responseVB.status === 200) {
                if (responseVB.data && responseVB.data && responseVB.data.type) {
                    // setServerFiles(JSON.parse(responseVB.data.virtualBoxFiles));
                    socketRef.current?.emit("initializeFiles", {
                        virtualboxId: responseVB.data.virtualboxId,
                        files: JSON.parse(responseVB.data.virtualBoxFiles),
                    });
                    socketRef.current?.on("virtualBoxInitialized", (data) => {
                        setServerFiles(data?.files);
                    })
                    setServerFileType(responseVB.data.type)
                    setServerVboxId(responseVB.data.virtualboxId)
                    setServerS3path(responseVB.data.filess3Path)
                } 
            }
        }
        fetchData();
    },[]);

    return (
        <>
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel
                    maxSize={20}
                    minSize={15}
                    defaultSize={15}
                    className="flex flex-col p-2"
                >
                    <Sidebar prompt={prompt} setPrompt={setPrompt} sendDatatoBackednLLM={sendDatatoBackednLLM} serverFileType={serverFileType} newPackages={newPackages} setNewPackages={setNewPackages}  data={serverFiles} setData={setServerFiles} socketRef={socketRef} servervboxId={servervboxId} selectFile={selectFile} activeId={activeId}/>

                </ResizablePanel>
                <ResizableHandle withHandle />

                <ResizablePanel
                    maxSize={80}
                    minSize={30}
                    defaultSize={60}
                    className="flex flex-col p-2"
                >
                    <div className="h-[2.8rem] w-full flex gap-[0.10rem] overflow-scroll">
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.id}
                                saved={tab.saved}
                                onClick={() => selectFile(tab)}
                                selected={activeId === tab.id}
                                onClose={() => closeTab(tab.id)}
                            >
                                {tab.name}
                            </Tab>
                        ))}
                    </div>

                    <div
                        ref={editorContainerRef}
                        className="grow w-full overflow-hidden relative"
                    >
                        <AiSuggestionModal
                            isOpen={showSuggestion}
                            onClose={() => setShowSuggestion(false)}
                            suggestion={aiSuggestion ?? ""}
                            // onAccept={handleAcceptSuggestion}
                            // onReject={handleRejectSuggestion}
                        />           
                        {
                            clerk.loaded ? (
                                <Editor
                                    height={"90vh"}
                                    defaultLanguage="typescript"
                                    theme="dracula"
                                    onMount={handleEditorMount}
                                    beforeMount={handleEditorWillMount}
                                    onChange={(value) => {
                                        if (value === activeFile) {
                                          setTabs((prev) =>
                                            prev.map((tab) =>
                                              tab.id === activeId ? { ...tab, saved: true } : tab
                                            )
                                          );
                                        } else {
                                          setTabs((prev) =>
                                            prev.map((tab) =>
                                              tab.id === activeId ? { ...tab, saved: false } : tab
                                            )
                                          );
                                        }
                                    }}
                                    options={{
                                        minimap: {
                                            enabled: false,
                                        },
                                        padding: {
                                            bottom: 4,
                                            top: 4,
                                        },
                                        scrollBeyondLastLine: false,
                                        fixedOverflowWidgets: true,
                                        fontFamily: "var(--font-geist-mono)",
                                        fontSize: 12,
                                        lineHeight: 1.6,
                                        letterSpacing: 0.4,
                                        fontLigatures: true,
                                        fontWeight: '400',
                                        renderWhitespace: 'none',
                                        cursorWidth: 2,
                                        cursorBlinking: 'smooth',
                                        smoothScrolling: true,
                                        contextmenu: true,
                                        mouseWheelScrollSensitivity: 1.5,
                                        lineNumbers: 'on',
                                        glyphMargin: false,
                                        renderLineHighlight: 'line',
                                        wrappingIndent: "indent",
                                        wordWrap: "wordWrapColumn",
	                                    wordWrapColumn: 500,
                                    }}
                                    language={editorLanguage}
                                    value={activeFile ?? ""}
                                />
                            ) : null
                        }

                    </div>

                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={50} minSize={20} collapsedSize={4} collapsible  className="p-2 flex flex-col">

                        <PreviewWindow
                            type={serverFileType}
                            files={serverFiles}
                            newPackages={newPackages}
                            servervboxId={servervboxId}
                        />
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={50} maxSize={55} minSize={10} className="p-2 flex flex-col">
                            <div className='w-full relative grow h-full overflow-hidden rounded-lg bg-secondary'>
                                <EditorTerminal files={serverFiles} type={serverFileType} servervboxId={servervboxId}/>
                            </div>
                        </ResizablePanel>

                    </ResizablePanelGroup>
                </ResizablePanel>

            </ResizablePanelGroup>
        </>
    )
}

export default CodeEditor
"use client";
import Editor, { BeforeMount,OnMount } from '@monaco-editor/react';
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
import { processFileType } from '@/lib/utils';
import PreviewWindow from './preview-window';
import { getVirualBoxRequest } from '@/lib/axios';
import EditorTerminal from './terminal';
import { io, Socket } from "socket.io-client";
import { useDebounce } from '@/hooks/useDebounce';
import { draculaTheme } from '@/lib/dracula-theme';

const CodeEditor = () => {
    const editorRef = useRef<null | monaco.editor.IStandaloneCodeEditor>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    const [editorLanguage, setEditorLanguage] = useState<string | undefined>(
        undefined
    );
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string>("");
    const [tabs, setTabs] = useState<any[]>([]);
    const [serverFiles, setServerFiles] = useState<any[]>([]);
    const [serverFileType, setServerFileType] = useState<"react" | "html-css" | "html-css-js">("react");
    const [servervboxId, setServerVboxId] = useState("");
    const [serverS3path, setServerS3path] = useState<any[]>([]);
    const socketRef = useRef<Socket | null>(null);
    const [newPackages, setNewPackages] = useState([]);

    const clerk = useClerk();

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
    };

    const selectFile = (tab: any) => {
        if (tab.id === activeId) return;
        const exists = tabs.find((t) => t.id === tab.id);
        setTabs((prev) => {
            if (exists) {
                setActiveId(exists.id);
                return prev;
            }
            return [...prev, tab];
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


    const debouncedFileUpdate = useDebounce((fileId: string, content: string,virtualboxId:string,bucketPath:string,fileName:string) => {
        socketRef.current?.emit("fileUpdate", {
            fileId,
            content,
            virtualboxId,
            bucketPath,
            fileName
        });
    }, { delay: 10000 });

    const handleEditorChange = (value: string | undefined) => {
        if (activeId && value !== undefined) {
            const {bucketPath,name} = serverFiles.find((file) => file.id === activeId);
            debouncedFileUpdate(activeId, value, servervboxId,bucketPath,name);
            socketRef.current?.on("fileUpdatedBroadcast", (data) => {
                const updatedFiles:any[] = serverFiles.map((fileOrFolder:any) => {
                    if (fileOrFolder.id === data.fileId) {
                        return { ...fileOrFolder, content: data.content, saved: true };
                    }
                    return fileOrFolder;
                });
                console.log("updatedFiles::>",updatedFiles);
                setServerFiles(updatedFiles);
            });
        }
    };

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
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4001");
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
                    <Sidebar serverFileType={serverFileType} newPackages={newPackages} setNewPackages={setNewPackages}  data={serverFiles} setData={setServerFiles} socketRef={socketRef} servervboxId={servervboxId} selectFile={selectFile} activeId={activeId}/>

                </ResizablePanel>
                <ResizableHandle />

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
                                saved={true}
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
                        {
                            clerk.loaded ? (
                                <Editor
                                    height={"100vh"}
                                    defaultLanguage="typescript"
                                    theme="dracula"
                                    onMount={handleEditorMount}
                                    beforeMount={handleEditorWillMount}
                                    onChange={(value) => {
                                        handleEditorChange(value)
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
                                        wordWrap: 'on',
                                        lineNumbers: 'on',
                                        glyphMargin: false,
                                        renderLineHighlight: 'line',
                                    }}
                                    language={editorLanguage}
                                    value={activeFile ?? ""}
                                />
                            ) : null
                        }

                    </div>

                </ResizablePanel>
                <ResizableHandle />
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
                        <ResizablePanel defaultSize={50} minSize={20} className="p-2 flex flex-col">
                            <div className='w-full relative grow h-full overflow-hidden rounded-lg bg-secondary'>
                                <EditorTerminal files={serverFiles} />
                            </div>
                        </ResizablePanel>

                    </ResizablePanelGroup>
                </ResizablePanel>

            </ResizablePanelGroup>
        </>
    )
}

export default CodeEditor
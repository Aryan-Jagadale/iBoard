"use client";
import Editor, { OnMount } from '@monaco-editor/react';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import monaco from "monaco-editor";
import Sidebar from './sidebar/index';
import { useClerk } from "@clerk/nextjs";
import Tab from "@/components/ui/tab";
import { processFileType } from '@/lib/utils';
import PreviewWindow from './preview-window';

// Will be received from the server
const dummyFolder = [
    {
        id: 1,
        name: 'index.html',
        type: 'file',
        content: '<h1>Hello World!</h1>',
        saved: true,
    },
    {
        id: 2,
        name: 'style.css',
        type: 'file',
        content: 'body { background-color: red; }',
        saved: true,
    },
    {
        id: 3,
        name: 'js',
        type: 'folder',
        children: [
            {
                id: 4,
                name: 'script.js',
                type: 'file',
                content: 'console.log("Hello World")',
                saved: true,
            },
            {
                id: 5,
                name: 'js',
                type: 'folder',
                children: [
                    {
                        id: 6,
                        name: 'script.js',
                        type: 'file',
                        content: 'console.log("Hello World")',
                        saved: true,

                    },
                    {
                        id: 7,
                        name: 'script.js',
                        type: 'file',
                        content: 'console.log("Hello World")',
                        saved: true,
                    },
                    {
                        id: 8,
                        name: 'utils',
                        type: 'folder',
                        children: [
                            {
                                id: 9,
                                name: 'math.js',
                                type: 'file',
                                content: 'export const add = (a, b) => a + b',
                                saved: true,

                            },
                            {
                                id: 10,
                                name: 'string.js',
                                type: 'file',
                                saved: true,
                                content: 'export const capitalize = (str) => str.toUpperCase()',
                            }
                        ]
                    }
                ]
            }
        ]
    }
]

const CodeEditor = () => {
    const editorRef = useRef<null | monaco.editor.IStandaloneCodeEditor>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    const [editorLanguage, setEditorLanguage] = useState<string | undefined>(
        undefined
    );
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string>("");
    const [tabs, setTabs] = useState<any[]>([]);
    const [serverFiles, setServerFiles] = useState(dummyFolder);

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
        setActiveFile(tab.content);
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

        // Update the file content dynamically
        const updateFileContent = (id: string, newContent: string, folder = serverFiles): any[] => {
        return folder.map(( fileOrFolder:any )  => {
                if (fileOrFolder.id === Number(id)) {
                    return { ...fileOrFolder, content: newContent, saved: false };
                }
                if (fileOrFolder.type === "folder") {
                    return { ...fileOrFolder, children: updateFileContent(id, newContent, fileOrFolder.children) };
                }
                return fileOrFolder;
            });
        };

    const handleEditorChange = (value: string | undefined) => {
        if (activeId && value !== undefined) {
            const updatedFiles = updateFileContent(activeId, value);
            setServerFiles(updatedFiles);
        }
    };

      

    return (
        <>
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel
                    maxSize={40}
                    minSize={0}
                    defaultSize={15}
                    className="flex flex-col p-2"
                >
                    <Sidebar data={dummyFolder} selectFile={selectFile} activeId={activeId}/>

                </ResizablePanel>
                <ResizableHandle />

                <ResizablePanel
                    maxSize={80}
                    minSize={30}
                    defaultSize={60}
                    className="flex flex-col p-2"
                >
                    <div className="h-9 w-full flex gap-1 overflow-scroll">
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.id}
                                saved={tab.saved ?? false}
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
                                    theme="vs-dark"
                                    onMount={handleEditorMount}
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
                            type={"html-css-js"}
                            files={serverFiles}
                        />
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={50} minSize={20} className="p-2 flex flex-col">
                            <div className='h-10 w-full flex gap-2 shrink-0 overflow-auto tab-scroll'>
                                <Tab selected>Node</Tab>
                                <Tab>Terminal</Tab>
                            </div>
                            <div className='w-full relative grow h-full overflow-hidden rounded-lg bg-secondary'></div>


                        </ResizablePanel>

                    </ResizablePanelGroup>
                </ResizablePanel>

            </ResizablePanelGroup>
        </>
    )
}

export default CodeEditor
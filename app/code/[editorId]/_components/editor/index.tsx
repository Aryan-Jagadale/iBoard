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


const CodeEditor = () => {
    const editorRef = useRef<null | monaco.editor.IStandaloneCodeEditor>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const generateWidgetRef = useRef<HTMLDivElement>(null);
    const [disableAccess, setDisableAccess] = useState({
        isDisabled: false,
        message: "",
    });
    const [tabs, setTabs] = useState<any[]>([{
        id: 1,
        name: 'index.html',
    },{
        id: 2,
        name: 'style.css',
    }]);

    const clerk = useClerk();

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
    };

    return (
        <>
            <Sidebar />
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel
                    maxSize={80}
                    minSize={30}
                    defaultSize={60}
                    className="flex flex-col p-2"
                >
                    <div className="h-10 w-full flex gap-2">
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.id}
                                // saved={tab.saved}
                                // selected={activeId === tab.id}
                                onClick={() => {}}
                                // onClose={() => {}}
                            >
                                {tab.name}
                            </Tab>
                        ))}
                    </div>

                    <div
                        ref={editorContainerRef}
                        className="grow w-full overflow-hidden rounded-lg relative"
                    >
                        {
                            clerk.loaded ? (
                                <Editor
                                    height={"100vh"}
                                    defaultLanguage="typescript"
                                    theme="vs-dark"
                                    onMount={handleEditorMount}
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
                                />
                            ) : null
                        }

                    </div>

                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={40}>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={50} minSize={20} className="p-2 flex flex-col">
                            <div className='h-10 w-full flex gap-2 shrink-0 overflow-auto tab-scroll'>
                                <Button variant='secondary' size={'sm'} className='min-w-20 justify-between'>
                                    localhost
                                </Button>
                            </div>
                            <div className='w-full relative grow h-full overflow-hidden rounded-lg bg-secondary'></div>


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
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



const CodeEditor = () => {
    const editorRef = useRef<null | monaco.editor.IStandaloneCodeEditor>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const generateWidgetRef = useRef<HTMLDivElement>(null);
    const [disableAccess, setDisableAccess] = useState({
        isDisabled: false,
        message: "",
    });

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
    }
    return (
        <>
            <Sidebar/>
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel
                    maxSize={80}
                    minSize={30}
                    defaultSize={60}
                    className="flex flex-col p-2"
                >
                    <div className="h-10 w-full flex gap-2">
                        <Button variant='secondary' size={'sm'} className='min-w-20 justify-between'>
                            index.html
                        </Button>
                        <Button variant='secondary' size={'sm'} className='min-w-20 justify-between'>
                            style.css
                        </Button>
                    </div>

                    <div
                        ref={editorContainerRef}
                        className="grow w-full overflow-hidden rounded-lg relative"
                    >
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
                                <Button variant='secondary' size={'sm'} className='min-w-20 justify-between'>
                                    Terminal
                                </Button>
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
"use client"

import {
    useHistory,
    useCanUndo,
    useCanRedo,
    useMutation,
    useStorage,
    useOthersMapped,
    useSelf,
} from "@/liveblocks.config";

import Info from "./info"
import Participants from "./participants"
import Toolbar from "./toolbar"
import { useState } from "react";
import { CanvasMode, CanvasState } from "@/types/canvas";

interface CanvasProps {
    boardId: string;
};

const Canvas = ({
    boardId,
}: CanvasProps) => {

    const info = useSelf((me) => me.info);

    const [canvasState, setcanvasState] = useState<CanvasState>({
        mode: CanvasMode.None
    });

    const history = useHistory();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();



    return (
        <main className="h-full w-full relative bg-neutral-100 touch-none">
            <Info boardId={boardId} />
            <Participants />
            <Toolbar
                canvasState={canvasState}
                setCanvasState={setcanvasState}
                canRedo={canRedo}
                canUndo={canUndo}
                undo={history.undo}
                redo={history.redo}

            />
        </main>
    )
}

export default Canvas
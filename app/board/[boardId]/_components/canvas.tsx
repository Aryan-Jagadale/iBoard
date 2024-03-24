"use client";
import { LiveObject } from "@liveblocks/client";
import { nanoid } from "nanoid";
import {
    useHistory,
    useCanUndo,
    useCanRedo,
    useMutation,
    useStorage,
    useOthersMapped,
    useSelf,
} from "@/liveblocks.config";

import Info from "./info";
import Participants from "./participants";
import Toolbar from "./toolbar";
import React, { useCallback, useMemo, useState } from "react";
import {
    Camera,
    CanvasMode,
    CanvasState,
    Color,
    LayerType,
    Point,
} from "@/types/canvas";
import CursorsPresence from "./cursors-presence";
import { connectionIdToColor, pointerEventToCanvasPoint } from "@/lib/utils";
import { LayerPreview } from "./layer-preview";

const MAX_LAYERS = 100;

interface CanvasProps {
    boardId: string;
}

const Canvas = ({ boardId }: CanvasProps) => {
    const layerIds = useStorage((root) => root.layerIds);

    const info = useSelf((me) => me.info);

    const [canvasState, setcanvasState] = useState<CanvasState>({
        mode: CanvasMode.None,
    });

    const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
    const [lastUsedColor, setLastUsedColor] = useState<Color>({
        r: 0,
        g: 0,
        b: 0,
    });

    const history = useHistory();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();

    const insertLayer = useMutation(
        (
            { storage, setMyPresence },
            layerType:
                | LayerType.Ellipse
                | LayerType.Rectangle
                | LayerType.Text
                | LayerType.Note,
            position: Point
        ) => {
            const livelayer = storage.get("layers");
            if (livelayer.size >= MAX_LAYERS) {
                return;
            }
            const liveLayerIds = storage.get("layerIds");

            const layerId = nanoid();
            const layer = new LiveObject({
                type: layerType,
                x: position.x,
                y: position.y,
                height: 100,
                width: 100,
                fill: lastUsedColor,
            });
            liveLayerIds.push(layerId);
            livelayer.set(layerId, layer);

            setMyPresence({ selection: [layerId] }, { addToHistory: true });
            setcanvasState({ mode: CanvasMode.None });
        },
        [lastUsedColor]
    );

    const onPointerUp = useMutation(
        ({ }, e) => {
            const point = pointerEventToCanvasPoint(e, camera);

            if (canvasState.mode === CanvasMode.Inserting) {
                insertLayer(canvasState.layerType, point);
            } else {
                setcanvasState({
                    mode: CanvasMode.None,
                });
            }
            history.resume();
        },
        [camera, canvasState, history, insertLayer]
    );

    const onPointMouse = useMutation(
        ({ setMyPresence }, e: React.PointerEvent) => {
            e.preventDefault();
            const current = pointerEventToCanvasPoint(e, camera);
            setMyPresence({
                cursor: current,
            });
        },
        []
    );

    const onPointerLeave = useMutation(
        ({ setMyPresence }, e: React.PointerEvent) => {
            e.preventDefault();

            setMyPresence({
                cursor: null,
            });
        },
        []
    );

    const onWheel = useCallback((e: React.WheelEvent) => {
        setCamera((camera) => ({
            x: camera.x - e.deltaX,
            y: camera.y - e.deltaY,
        }));
    }, []);

    const selections = useOthersMapped((other) => other.presence.selection);
    const layerIdsToColorSelection = useMemo(() => {
        const layerIdsToColorSelection: Record<string, string> = {};
        for (const user of selections) {
            const [connectionId, selection] = user;
            for (const layerId of selection) {
                layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
            }
        }
        return layerIdsToColorSelection;
    }, [selections]);

    const onLayerPointerDown = useMutation((
        { self, setMyPresence },
        e: React.PointerEvent,
        layerId: string,
    ) => {
        if (
            canvasState.mode === CanvasMode.Pencil ||
            canvasState.mode === CanvasMode.Inserting
        ) {
            return;
        }

        history.pause();
        e.stopPropagation();

        const point = pointerEventToCanvasPoint(e, camera);

        if (!self.presence.selection.includes(layerId)) {
            setMyPresence({ selection: [layerId] }, { addToHistory: true });
        }
        setcanvasState({ mode: CanvasMode.Translating, current: point });
    },
        [
            setcanvasState,
            camera,
            history,
            canvasState.mode,
        ]);

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
            <svg
                className="h-[100vh] w-[100vw] bg-slate-700"
                onWheel={onWheel}
                onPointerMove={onPointMouse}
                onPointerLeave={onPointerLeave}
                onPointerUp={onPointerUp}
            >
                <g
                    style={{
                        transform: `transalte ${camera.x}px, ${camera.y}px `,
                    }}
                >
                    {layerIds.map((layerId) => (
                        <LayerPreview
                            key={layerId}
                            id={layerId}
                            onLayerPointerDown={onLayerPointerDown}
                            selectionColor={layerIdsToColorSelection[layerId]}
                        />
                    ))}
                    <CursorsPresence />
                </g>
            </svg>
        </main>
    );
};

export default Canvas;

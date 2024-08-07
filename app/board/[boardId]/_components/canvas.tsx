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
    useBroadcastEvent,
    useEventListener,
    useMyPresence,
    useOthers,
} from "@/liveblocks.config";

import { Smile } from 'lucide-react';
import Info from "./info";
import Participants from "./participants";
import Toolbar from "./toolbar";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
    Camera,
    CanvasMode,
    CanvasState,
    Color,
    LayerType,
    Point,
    Side,
    XYWH,
} from "@/types/canvas";
import {
    Reaction,
    CursorState,
    CursorMode,
    ReactionEvent
} from "@/types/reaction"

import CursorsPresence from "./cursors-presence";
import { connectionIdToColor, pointerEventToCanvasPoint, resizeBounds, findIntersectingLayersWithRectangle, penPointsToPathLayer, colorToCss } from "@/lib/utils";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Path } from "./path";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import useInterval from "@/hooks/useInterval";
import FlyingReaction from "./reactions/FlyingReaction";
import ReactionSelector from "./reactions/ReactionSelector";
import { Hint } from "@/components/hint";

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];
const MAX_LAYERS = 100;

interface CanvasProps {
    boardId: string;
}

const Canvas = ({ boardId }: CanvasProps) => {
    const layerIds = useStorage((root) => root.layerIds);

    const info = useSelf((me) => me.info);
    const pencilDraft = useSelf((me) => me.presence.pencilDraft);

    const [canvasState, setcanvasState] = useState<CanvasState>({
        mode: CanvasMode.None
    });

    //Reaction Code Setup start --->
    const others = useOthers();
    const [{ cursor }, updateMyPresence] = useMyPresence();
    const broadcast = useBroadcastEvent();
    const [state, setState] = useState<CursorState>({ mode: CursorMode.Hidden });
    const [reactions, setReactions] = useState<Reaction[]>([]);

    const setReaction = useCallback((reaction: string) => {
        setState({ mode: CursorMode.Reaction, reaction, isPressed: false });
    }, []);

    useInterval(() => {
        if (state.mode === CursorMode.Reaction && state.isPressed && cursor) {
            setReactions((reactions) =>
                reactions.concat([
                    {
                        point: { x: cursor.x, y: cursor.y },
                        value: state.reaction,
                        timestamp: Date.now(),
                    },
                ])
            );
            broadcast({
                x: cursor.x,
                y: cursor.y,
                value: state.reaction,
            });
        }
    }, 150);

    useEffect(() => {

        function onKeyUp(e: KeyboardEvent) {
            if (e.key === "Escape") {
                updateMyPresence({ message: "" });
                setState({ mode: CursorMode.Hidden });
            }
            // else if (e.key === "e") {
            //     setState({ mode: CursorMode.ReactionSelector });
            // }
        }

        window.addEventListener("keyup", onKeyUp);

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "/") {
                e.preventDefault();
            }
        }

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [updateMyPresence]);

    useEventListener((eventData) => {
        const event = eventData.event as ReactionEvent;

        setReactions((reactions) =>
            reactions.concat([
                {
                    point: { x: event.x, y: event.y },
                    value: event.value,
                    timestamp: Date.now(),
                },
            ])
        );
    });

    //Reaction Code Setup end --->

    const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
    const [lastUsedColor, setLastUsedColor] = useState<Color>({
        r: 0,
        g: 0,
        b: 0,
    });
    useDisableScrollBounce()
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
                height: layerType === 4 ? 256 : 100,
                width: layerType === 4 ? 400 : 100,
                fill: lastUsedColor,
            });
            liveLayerIds.push(layerId);
            livelayer.set(layerId, layer);

            setMyPresence({ selection: [layerId] }, { addToHistory: true });
            setcanvasState({ mode: CanvasMode.None });
        },
        [lastUsedColor]
    );

    const unselectLayers = useMutation((
        { self, setMyPresence }
    ) => {
        if (self.presence.selection.length > 0) {
            setMyPresence({ selection: [] }, { addToHistory: true });
        }
    }, []);

    const insertPath = useMutation((
        { storage, self, setMyPresence }
    ) => {
        const liveLayers = storage.get("layers");
        const { pencilDraft } = self.presence;

        if (
            pencilDraft == null ||
            pencilDraft.length < 2 ||
            liveLayers.size >= MAX_LAYERS
        ) {
            setMyPresence({ pencilDraft: null });
            return;
        }

        const id = nanoid();
        liveLayers.set(
            id,
            new LiveObject(penPointsToPathLayer(
                pencilDraft,
                lastUsedColor,
            )),
        );

        const liveLayerIds = storage.get("layerIds");
        liveLayerIds.push(id);

        setMyPresence({ pencilDraft: null });
        setcanvasState({ mode: CanvasMode.Pencil });
    }, [lastUsedColor]);


    const onPointerUp = useMutation(
        ({ }, e) => {
            const point = pointerEventToCanvasPoint(e, camera);
            if (
                canvasState.mode === CanvasMode.None ||
                canvasState.mode === CanvasMode.Pressing
            ) {
                unselectLayers()
                setcanvasState({
                    mode: CanvasMode.None,
                });
            } else if (canvasState.mode === CanvasMode.Pencil) {
                insertPath();
            } else if (canvasState.mode === CanvasMode.Inserting) {
                insertLayer(canvasState.layerType, point);
            } else {
                setcanvasState({
                    mode: CanvasMode.None,
                });
            }
            history.resume();
        },
        [camera, canvasState, history, insertLayer, insertPath]
    );

    const onResizeHandlePointerDown = useCallback((
        corner: Side,
        initialBounds: XYWH
    ) => {
        history.pause()

        setcanvasState({
            mode: CanvasMode.Resizing,
            initialBounds,
            corner
        })



    }, [history]);

    const startDrawing = useMutation((
        { setMyPresence },
        point: Point,
        pressure: number,
    ) => {
        setMyPresence({
            pencilDraft: [[point.x, point.y, pressure]],
            penColor: lastUsedColor,
        })
    }, [lastUsedColor]);

    const onPointerDown = useCallback((
        e: React.PointerEvent,
    ) => {
        const point = pointerEventToCanvasPoint(e, camera);

        if (canvasState.mode === CanvasMode.Inserting) {
            return;
        }
        if (canvasState.mode === CanvasMode.Pencil) {
            startDrawing(point, e.pressure);
            return;
        }

        setcanvasState({ origin: point, mode: CanvasMode.Pressing });
    }, [camera, canvasState.mode, setcanvasState, startDrawing]);

    const resizeSelectedLayer = useMutation(({ storage, self },
        point: Point,) => {
        if (canvasState.mode !== CanvasMode.Resizing) {
            return;
        }

        const bounds = resizeBounds(
            canvasState.initialBounds,
            canvasState.corner,
            point,
        );

        const liveLayers = storage.get("layers");

        const layer = liveLayers.get(self.presence.selection[0]);
        if (layer) {
            layer.update(bounds);
        };

    }, [canvasState]);

    const translateSelectedLayers = useMutation((
        { storage, self },
        point: Point,
    ) => {
        if (canvasState.mode !== CanvasMode.Translating) {
            return;
        }

        const offset = {
            x: point.x - canvasState.current.x,
            y: point.y - canvasState.current.y,
        };

        const liveLayers = storage.get("layers");

        for (const id of self.presence.selection) {
            const layer = liveLayers.get(id);
            if (layer) {
                layer.update({
                    x: layer.get("x") + offset.x,
                    y: layer.get("y") + offset.y,
                });
            }
        }

        setcanvasState({ mode: CanvasMode.Translating, current: point });
    },
        [
            canvasState,
        ]);

    const startMultiSelection = useCallback((
        current: Point,
        origin: Point,
    ) => {
        if (
            Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5
        ) {
            setcanvasState({
                mode: CanvasMode.SelectionNet,
                origin,
                current,
            });
        }
    }, []);

    const updateSelectionNet = useMutation((
        { storage, setMyPresence },
        current: Point,
        origin: Point,
    ) => {
        const layers = storage.get("layers").toImmutable();
        setcanvasState({
            mode: CanvasMode.SelectionNet,
            origin,
            current,
        });

        const ids = findIntersectingLayersWithRectangle(
            layerIds,
            layers,
            origin,
            current,
        );

        setMyPresence({ selection: ids });
    }, [layerIds]);

    const continueDrawing = useMutation((
        { self, setMyPresence },
        point: Point,
        e: React.PointerEvent,
    ) => {
        const { pencilDraft } = self.presence;

        if (
            canvasState.mode !== CanvasMode.Pencil ||
            e.buttons !== 1 ||
            pencilDraft == null
        ) {
            return;
        }

        setMyPresence({
            cursor: point,
            pencilDraft:
                pencilDraft.length === 1 &&
                    pencilDraft[0][0] === point.x &&
                    pencilDraft[0][1] === point.y
                    ? pencilDraft
                    : [...pencilDraft, [point.x, point.y, e.pressure]],
        });
    }, [canvasState.mode]);

    const onPointMouse = useMutation(
        ({ setMyPresence }, e: React.PointerEvent) => {
            e.preventDefault();
            const current = pointerEventToCanvasPoint(e, camera);
            if (canvasState.mode === CanvasMode.Pressing) {
                startMultiSelection(current, canvasState.origin);
            } else if (canvasState.mode === CanvasMode.SelectionNet) {
                updateSelectionNet(current, canvasState.origin);
            } else if (canvasState.mode === CanvasMode.Translating) {
                translateSelectedLayers(current);
            } else if (canvasState.mode === CanvasMode.Resizing) {
                resizeSelectedLayer(current);
            } else if (canvasState.mode === CanvasMode.Pencil) {
                continueDrawing(current, e);
            }

            setMyPresence({
                cursor: current,
            });
        },
        [canvasState, resizeSelectedLayer, translateSelectedLayers]
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

    const deleteLayers = useDeleteLayers();


    const handleFullScreen = useFullScreenHandle();

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            switch (e.key) {
                case "Delete":
                    deleteLayers();
                    break;
                case "z": {
                    if (e.ctrlKey || e.metaKey) {
                        if (e.shiftKey) {
                            history.redo();
                        } else {
                            history.undo();
                        }
                        break;
                    }
                }
            }
        }

        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [deleteLayers, history]);


    return (
        <main className="h-full w-full relative bg-neutral-100 touch-none">
            <Info boardId={boardId} />

            <Participants handleFullScreen={handleFullScreen} />
            <Toolbar
                canvasState={canvasState}
                setCanvasState={setcanvasState}
                canRedo={canRedo}
                canUndo={canUndo}
                undo={history.undo}
                redo={history.redo}
            />
            <SelectionTools
                camera={camera}
                setLastUsedColor={setLastUsedColor}
            />

            <FullScreen handle={handleFullScreen}>
                <svg
                    className="h-[100vh] w-[100vw] overflow-auto bg-slate-100"
                    onWheel={onWheel}
                    onPointerMove={onPointMouse}
                    onPointerLeave={onPointerLeave}
                    onPointerUp={onPointerUp}
                    onPointerDown={onPointerDown}
                >
                    <pattern id="pattern-circles" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                        <circle id="pattern-circle" cx="10" cy="10" r="1.1" fill="lightgray"></circle>
                    </pattern>

                    <rect id="rect" x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)"></rect>
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
                        <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />
                        {canvasState.mode === CanvasMode.SelectionNet && canvasState.current != null && (
                            <rect
                                className="fill-blue-500/5 stroke-blue-500 stroke-1"
                                x={Math.min(canvasState.origin.x, canvasState.current.x)}
                                y={Math.min(canvasState.origin.y, canvasState.current.y)}
                                width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                                height={Math.abs(canvasState.origin.y - canvasState.current.y)}
                            />
                        )}
                        <CursorsPresence />
                        {pencilDraft != null && pencilDraft.length > 0 && (
                            <Path
                                points={pencilDraft}
                                fill={colorToCss(lastUsedColor)}
                                x={0}
                                y={0}
                            />
                        )}
                    </g>

                </svg>



                {/*Reaction Components UI */}
                <div className="absolute bottom-3 left-[45%] flex flex-col bg-transparent gap-y-4 ">
                    <div className="max-w-sm text-center ">

                        <ul className="mt-4 flex items-center justify-center space-x-2" >
                            <Hint label="Emojis" side="left">
                                <li className="flex items-center space-x-2 rounded-md bg-white shadow-md py-2 px-3 text-sm" onClick={() => {
                                    setState({ mode: CursorMode.ReactionSelector });
                                }}
                                >
                                    <span className="block rounded text-xs font-medium uppercase text-gray-500">
                                        <Smile height={"16px"} />
                                    </span>
                                </li>
                            </Hint>
                            <Hint label="Press esc to stop emojis" side="right">
                                <li className="flex items-center space-x-2 rounded-md bg-white shadow-md py-2 px-3 text-sm" onClick={() => {
                                    updateMyPresence({ message: "" });
                                    setState({ mode: CursorMode.Hidden });
                                }}>
                                    <span className="block rounded border border-gray-300 px-1 text-xs font-medium uppercase text-gray-500">
                                        esc
                                    </span>
                                </li>

                            </Hint>

                        </ul>
                    </div>
                </div>
                <div
                    onPointerMove={(event) => {
                        event.preventDefault();
                        console.log("on pointermove");
                        if (cursor == null || state.mode !== CursorMode.ReactionSelector) {
                            console.log("on pointermove in if");
                            updateMyPresence({
                                cursor: {
                                    x: Math.round(event.clientX),
                                    y: Math.round(event.clientY),
                                },
                            });
                        }
                    }}
                    onPointerLeave={() => {
                        setState({
                            mode: CursorMode.Hidden,
                        });
                        updateMyPresence({
                            cursor: null,
                        });
                    }}
                    onPointerDown={(event) => {
                        updateMyPresence({
                            cursor: {
                                x: Math.round(event.clientX),
                                y: Math.round(event.clientY),
                            },
                        });
                        setState((state) =>
                            state.mode === CursorMode.Reaction
                                ? { ...state, isPressed: true }
                                : state
                        );
                    }}
                    onPointerUp={() => {
                        setState((state) =>
                            state.mode === CursorMode.Reaction
                                ? { ...state, isPressed: false }
                                : state
                        );
                    }}
                >
                    {reactions.map((reaction) => {
                        return (
                            <FlyingReaction
                                key={reaction.timestamp.toString()}
                                x={reaction.point.x}
                                y={reaction.point.y}
                                timestamp={reaction.timestamp}
                                value={reaction.value}
                            />
                        );
                    })}



                    {state.mode === CursorMode.ReactionSelector && (
                        <ReactionSelector
                            setReaction={(reaction) => {
                                setReaction(reaction);
                            }}
                        />
                    )}



                </div>
            </FullScreen>
        </main>
    );
};



export default Canvas;

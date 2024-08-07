"use client"

import { memo } from "react";
import { BringToFront, SendToBack, Trash2 } from "lucide-react";

import { Hint } from "@/components/hint";
import { Camera, Color } from "@/types/canvas";
import { Button } from "@/components/ui/button";
import { useMutation, useSelf } from "@/liveblocks.config";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { useSelectionBounds } from "@/hooks/use-selection-bounds";
import { ColorPicker } from "./color-picker";


interface SelectionToolsProps {
    camera: Camera;
    setLastUsedColor: (color: Color) => void;
};

export const SelectionTools = memo(({
    camera,
    setLastUsedColor,
}: SelectionToolsProps) => {
    const selection = useSelf((me) => me.presence.selection);
    const moveToFront = useMutation((
        { storage }
    ) => {
        const liveLayerIds = storage.get("layerIds");
        const indices: number[] = [];

        const arr = liveLayerIds.toImmutable();

        for (let i = 0; i < arr.length; i++) {
            if (selection.includes(arr[i])) {
                indices.push(i);
            }
        }

        for (let i = indices.length - 1; i >= 0; i--) {
            liveLayerIds.move(
                indices[i],
                arr.length - 1 - (indices.length - 1 - i)
            );
        }
    }, [selection]);

    const moveToBack = useMutation((
        { storage }
    ) => {
        const liveLayerIds = storage.get("layerIds");
        const indices: number[] = [];

        const arr = liveLayerIds.toImmutable();

        for (let i = 0; i < arr.length; i++) {
            if (selection.includes(arr[i])) {
                indices.push(i);
            }
        }

        for (let i = 0; i < indices.length; i++) {
            liveLayerIds.move(indices[i], i);
        }
    }, [selection]);

    const setFill = useMutation((
        { storage },
        fill: Color,
    ) => {
        const liveLayers = storage.get("layers");
        setLastUsedColor(fill);

        selection.forEach((id) => {
            liveLayers.get(id)?.set("fill", fill);
        })
    }, [selection, setLastUsedColor]);
    
    const deleteLayers = useDeleteLayers();

    const selectionBounds = useSelectionBounds();

    if (!selectionBounds) {
      return null;
    }

    console.log(selectionBounds);
    console.log("camera",camera);
    
    const x = selectionBounds.width / 2 + selectionBounds.x + 0;
    const y = selectionBounds.y + 0;
    const [offsetX, offsetY] = [50, 100];
    
    const checkPosition = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      let newX = x;
      let newY = y;
      
      if (x - offsetX < 0) newX = offsetX;
      if (x + offsetX > windowWidth) newX = windowWidth - offsetX;
      if (y - offsetY < 0) newY = offsetY;
      if (y + offsetY > windowHeight) newY = windowHeight - offsetY;
      
      return [newX, newY];
    };
    
    const [adjustedX, adjustedY] = checkPosition();

    return (
        <div
          className="absolute p-3 rounded-xl bg-white shadow-sm border flex select-none"
          style={{
            transform: `translate(
              calc(${adjustedX}px - 50%),
              calc(${adjustedY -16}px - 100%)
            )`
          }}
        >
          <ColorPicker
            onChange={setFill}
          />
          <div className="flex flex-col gap-y-0.5">
            <Hint label="Bring to front">
              <Button
                onClick={moveToFront}
                variant="board"
                size="icon"
              >
                <BringToFront />
              </Button>
            </Hint>
            <Hint label="Send to back" side="bottom">
              <Button
                onClick={moveToBack}
                variant="board"
                size="icon"
              >
                <SendToBack />
              </Button>
            </Hint>
          </div>
          <div className="flex items-center pl-2 ml-2 border-l border-neutral-200">
            <Hint label="Delete">
              <Button
                variant="board"
                size="icon"
                onClick={deleteLayers}
              >
                <Trash2 />
              </Button>
            </Hint>
          </div>
        </div>
      );

})

SelectionTools.displayName = "SelectionTools";

"use client"
import { memo } from "react"
import {
    useOthersConnectionIds,
    useOthersMapped
} from "@/liveblocks.config";
import { Cursor } from "./cursor";

const Cursors = () => {
    const ids = useOthersConnectionIds();
    console.log("ids", ids);
    return (
        <>
        {
            ids?.map((connectionId)=>(
                <Cursor
                key={connectionId}
                connectionId={connectionId}

                />
            ))
        }
        
        </>
    )
}

const CursorsPresence = memo(() => {
    {/*TODO: Draft pencil */}

    return (
        <><Cursors/></>
    )
})

CursorsPresence.displayName = "CursorsPresence"

export default CursorsPresence
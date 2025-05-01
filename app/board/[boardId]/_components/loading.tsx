"use client"

import { Loader } from "lucide-react";

export const Loading = () => {
    return (
        <main
            className="h-full w-full relative bg-neutral-100 touch-none flex items-center justify-center"
        >
            <Loader className="h-6 w-6 text-muted-foreground animate-spin" />
            <div
                className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md w-[300px]"
            />
            <div className="absolute h-12 top-2 right-2 bg-white rounded-md p-3 flex items-center shadow-md w-[100px]" />
            <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 bg-white h-[360px] w-[52px] shadow-md rounded-md" />
        </main>
    );
};
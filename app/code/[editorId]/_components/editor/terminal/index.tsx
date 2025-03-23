"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "./xterm.css";
import { io, Socket } from "socket.io-client";

export default function EditorTerminal({ files, type,servervboxId }: { files: any[], type: string,servervboxId: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_BUILD_SOCKET_URL || "http://localhost:5000");
    socketRef.current.on("connect", () => {
      if (socketRef.current) {
        socketRef.current.emit('join_build', { vbId: servervboxId });
        console.log("WebSocket connected for terminal:", socketRef.current?.id);
      }
    });
    socketRef.current.on("disconnect", () => {
      console.log("WebSocket disconnected for terminal");
    });

    xtermRef.current = new Terminal({
      theme: { background: "#1e1e1e", foreground: "#d4d4d4" },
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    xtermRef.current.loadAddon(fitAddon);

    if (terminalRef.current) {
      xtermRef.current.open(terminalRef.current);
      fitAddon.fit();
    }
    if (xtermRef.current) {
      xtermRef.current.write("Terminal initialized\r\n");
    }
    socketRef.current?.on("build_log", ({ vbId:receivedVbId, message }) => {
      if (receivedVbId === servervboxId) {
        if (xtermRef.current) {
          xtermRef.current.write(message + "\r\n");
        }
      }
    });
    socketRef.current.on("build_complete", ({ vbId:receivedVbId, bundle, cssFiles }) => {
      if (receivedVbId === servervboxId) {
        xtermRef.current?.write("Build complete!\r\n");
      }
    });

    const handleMessage = (event: any) => {
      if (event.data?.type === "console") {
        const { method, data } = event.data;
        const logMessage = `[${method.toUpperCase()}] ${data.join(" ")}\r\n`;

        if (xtermRef.current) {
          xtermRef.current.write(logMessage);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      socketRef.current?.off("build_log");
      socketRef.current?.off("build_complete");
      window.removeEventListener("message", handleMessage);
      xtermRef.current?.dispose();
      socketRef.current?.disconnect();
    };
  }, [servervboxId]);

  return (
    <div className="w-full bg-zinc-900 overflow-hidden">
      <div className="w-full h-8 bg-zinc-800 flex items-center justify-between px-4">
        <span className="text-zinc-400 text-sm">Terminal</span>
      </div>
      <div ref={terminalRef} className="w-full h-96 p-2" />
    </div>
  );
}

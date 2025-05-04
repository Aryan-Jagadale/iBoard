"use client";

import { useEffect, useRef,useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "./xterm.css";
import { io, Socket } from "socket.io-client";

export default function EditorTerminal({ files, type,servervboxId }: { files: any[], type: string,servervboxId: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isInputMode, setIsInputMode] = useState(false);
  const inputBufferRef = useRef<string>("");

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_BUILD_SOCKET_URL);
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
      convertEol: true
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

    // Handle input request from backend
    socketRef.current?.on("request_input", ({ vbId: receivedVbId }) => {
      if (receivedVbId === servervboxId && xtermRef.current) {
        setIsInputMode(true);
        xtermRef.current.write("\r\n::> ");
        xtermRef.current.focus();
      }
    });

    xtermRef.current?.onData((data) => {
      console.log("Data received from terminal:", data);
      console.log("Is input mode:", isInputMode);
      console.log("Input buffer:", inputBufferRef.current);
      

      if (isInputMode) {
        console.log("Received input data:", data, "Buffer:", inputBufferRef.current);

        if (data === "\r") {
          socketRef.current?.emit("user_input", {
            vbId: servervboxId,
            input: inputBufferRef.current,
          });
          xtermRef.current?.write("\r\n");
          console.log("Sent input to backend:", inputBufferRef.current);
          inputBufferRef.current = "";
          setIsInputMode(false);
        } else if (data === "\b") {
          // Backspace: remove last character
          if (inputBufferRef.current.length > 0) {
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
            xtermRef.current?.write("\b \b");
          }
        } else if (data.charCodeAt(0) >= 32 && data.charCodeAt(0) <= 126) {
          // Printable characters: append to buffer and echo to terminal
          inputBufferRef.current += data;
          xtermRef.current?.write(data); // Echo input immediately
        }
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
    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      socketRef.current?.off("build_log");
      socketRef.current?.off("build_complete");
      socketRef.current?.off("request_input");
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("resize", handleResize);
      xtermRef.current?.dispose();
      socketRef.current?.disconnect();
    };
  }, [servervboxId,isInputMode]);

  return (
    <div className="w-full bg-zinc-900 overflow-hidden">
      <div className="w-full h-8 bg-zinc-800 flex items-center justify-between px-4">
        <span className="text-zinc-400 text-sm">Terminal</span>
      </div>
      <div ref={terminalRef} className="w-full h-96 p-2" />
    </div>
  );
}

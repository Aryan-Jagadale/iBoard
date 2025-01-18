"use client";

import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "./xterm.css";

export default function EditorTerminal({ files }: { files: any[] }) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const terminal = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#262626",
        foreground: "#FFFFFF",
      },
      fontSize: 14,
      fontFamily: "var(--font-geist-mono)",
      lineHeight: 1.5,
      letterSpacing: 0,
    });

    // Add fit addon
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Redirect console output to the terminal
    const originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
      terminal.writeln(args.map(String).join(" "));
      originalConsoleLog(...args); // Also log to the browser console
    };

    // Function to execute JavaScript code
    const executeScript = async (scriptContent: string, fileName: string) => {
      terminal.writeln(`\x1b[32mExecuting ${fileName}...\x1b[0m`); // Green text for the filename
      try {
        const sandbox = new Function(scriptContent);
        sandbox(); // Execute the script
      } catch (err:any) {
        terminal.writeln(`\x1b[31mError in ${fileName}: ${err.message}\x1b[0m`); // Red text for errors
      }
    };

    // Execute all JavaScript files in the list
    const executeAllScripts = async () => {
      const jsFiles = files.filter((file) => file.name.endsWith(".js"));
      if (jsFiles.length === 0) {
        terminal.writeln("\x1b[33mNo JavaScript files found to execute.\x1b[0m"); // Yellow text for warnings
        return;
      }

      for (const file of jsFiles) {
        await executeScript(file.content, file.name);
      }
    };

    // Execute all scripts
    executeAllScripts();

    // Cleanup
    return () => {
      console.log = originalConsoleLog; // Restore the original console.log
      terminal.dispose();
    };
  }, [files]);

  return (
    <div className="w-full bg-zinc-900 overflow-hidden">
      <div className="w-full h-8 bg-zinc-800 flex items-center justify-between px-4">
        <span className="text-zinc-400 text-sm">Terminal</span>
      </div>
      <div ref={terminalRef} className="w-full h-64 p-2" />
    </div>
  );
}

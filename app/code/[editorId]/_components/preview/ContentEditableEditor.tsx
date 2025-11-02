// components/ContentEditableEditor.tsx
import { useRef, useEffect } from 'react';

interface Props {
  initialHTML: string;
  onSave: (html: string) => void;
}

export const ContentEditableEditor = ({ initialHTML, onSave }: Props) => {
  const divRef = useRef<HTMLDivElement>(null);

  // Load initial content
  useEffect(() => {
    if (divRef.current) divRef.current.innerHTML = initialHTML;
  }, [initialHTML]);

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    divRef.current?.focus();
  };

  const handleSave = () => {
    onSave(divRef.current?.innerHTML ?? '');
  };

  return (
    <div className="p-4">
      {/* Toolbar */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => exec('bold')}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => exec('italic')}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 italic"
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => exec('underline')}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 underline"
          title="Underline"
        >
          U
        </button>
      </div>

      {/* Editable area */}
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        className="border rounded p-3 min-h-[120px] prose prose-sm max-w-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ whiteSpace: 'pre-wrap' }}
      />

      {/* Save */}
      <button
        onClick={handleSave}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save
      </button>
    </div>
  );
};
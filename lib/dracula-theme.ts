import * as monaco from 'monaco-editor';

export const draculaTheme: monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272A4' },
      { token: 'string', foreground: 'F1FA8C' },
      { token: 'keyword', foreground: 'FF79C6' },
      { token: 'number', foreground: 'BD93F9' },
      { token: 'operator', foreground: 'FF79C6' },
      { token: 'function', foreground: '50FA7B' },
      { token: 'variable', foreground: 'F8F8F2' },
      { token: 'type', foreground: '8BE9FD' }
    ].map(rule => ({ ...rule, fontStyle: '' })),
    colors: {
      'editor.background': '#282A36',
      'editor.foreground': '#F8F8F2',
      'editor.lineHighlightBackground': '#44475A',
      'editor.selectionBackground': '#44475A',
      'editor.inactiveSelectionBackground': '#44475A70',
      'editorCursor.foreground': '#F8F8F2',
      'editorWhitespace.foreground': '#44475A',
      'editorLineNumber.foreground': '#6272A4'
    }
  };
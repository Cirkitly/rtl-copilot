import React, { useRef } from 'react';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import { setupMonaco, updateDiagnostics, registerSnippetAction } from '../../lib/editor/monaco';

interface VerilogEditorProps {
    value: string;
    onChange?: (value: string | undefined) => void;
    readOnly?: boolean;
    height?: string;
}

const VerilogEditor: React.FC<VerilogEditorProps> = ({ value, onChange, readOnly = false, height = "100%" }) => {
    const editorRef = useRef<any>(null);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        // Register actions
        registerSnippetAction(editor, monaco);

        // Initial linting
        updateDiagnostics(monaco, editor.getModel());

        // Lint on change
        editor.onDidChangeModelContent(() => {
            updateDiagnostics(monaco, editor.getModel());
        });
    };

    const handleBeforeMount: BeforeMount = (monaco) => {
        // Setup language features (completion, etc)
        setupMonaco(monaco);

        // Ensure verilog language is registered (Monaco has built-in basic support, but good to ensure)
        monaco.languages.register({ id: 'verilog' });

        // Define a custom dark theme tailored for Verilog
        monaco.editor.defineTheme('verilog-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' }, // Control keywords (pink)
                { token: 'type', foreground: '4EC9B0' }, // Types (wire, reg) (teal)
                { token: 'identifier', foreground: '9CDCFE' }, // Signals (light blue)
                { token: 'number', foreground: 'B5CEA8' }, // Numbers (light green)
                { token: 'string', foreground: 'CE9178' }, // Strings (orange)
                { token: 'comment', foreground: '6A9955' }, // Comments (green)
                { token: 'operator', foreground: 'D4D4D4' }, // Operators (white)
            ],
            colors: {
                'editor.background': '#1E1E1E',
                'editor.foreground': '#D4D4D4',
            }
        });
    };

    return (
        <Editor
            height={height}
            defaultLanguage="verilog"
            theme="verilog-dark"
            value={value}
            onChange={onChange}
            onMount={handleEditorDidMount}
            beforeMount={handleBeforeMount}
            options={{
                readOnly,
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
            }}
        />
    );
};

export default VerilogEditor;

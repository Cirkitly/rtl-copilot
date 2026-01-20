
import { Monaco } from '@monaco-editor/react';
import { getCompletions } from './autocomplete';
import { getSuggestions } from './suggestions';

let isConfigured = false;

export const setupMonaco = (monaco: Monaco) => {
    if (isConfigured) return;

    // 1. Register Completion Item Provider
    monaco.languages.registerCompletionItemProvider('verilog', {
        provideCompletionItems: (model: any, position: any) => {
            const code = model.getValue();
            // getCompletions expects 1-based line/col (standard), Monaco provides 1-based.
            const completions = getCompletions(code, position.lineNumber, position.column);

            const suggestions = completions.map(item => ({
                label: item.label,
                kind: mapKind(monaco, item.kind),
                insertText: item.label,
                detail: item.detail,
                documentation: `Verilog ${item.kind}: ${item.label}`
            }));

            return { suggestions } as any;
        }
    });

    isConfigured = true;
};

export const updateDiagnostics = (monaco: Monaco, model: any) => {
    const code = model.getValue();
    const suggestions = getSuggestions(code);

    const markers = suggestions.map(s => ({
        severity: s.severity === 'error' ? monaco.MarkerSeverity.Error :
            s.severity === 'warning' ? monaco.MarkerSeverity.Warning :
                monaco.MarkerSeverity.Info,
        message: s.message,
        startLineNumber: s.startLine,
        startColumn: s.startColumn,
        endLineNumber: s.endLine || s.startLine,
        endColumn: s.endColumn || (s.startColumn + 1), // Fallback length
        source: s.source
    }));

    monaco.editor.setModelMarkers(model, 'verilog-linter', markers);
};


export const registerSnippetAction = (editor: any, monaco: Monaco) => {
    editor.addAction({
        id: 'insert_instantiation',
        label: 'Insert Module Instantiation',
        contextMenuGroupId: '1_modification',
        run: (ed: any) => {
            const position = ed.getPosition();
            const text = '// TODO: Select module to instantiate\n';
            ed.executeEdits('insert-snippet', [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: text,
                forceMoveMarkers: true
            }]);
        }
    });
};

const mapKind = (monaco: Monaco, kind: string) => {
    switch (kind) {
        case 'keyword': return monaco.languages.CompletionItemKind.Keyword;
        case 'signal': return monaco.languages.CompletionItemKind.Variable;
        case 'port': return monaco.languages.CompletionItemKind.Interface; // Or Field
        case 'module': return monaco.languages.CompletionItemKind.Module; // Usually Class or Module
        default: return monaco.languages.CompletionItemKind.Text;
    }
};

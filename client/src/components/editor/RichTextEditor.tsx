import { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { HashtagNode } from "@lexical/hashtag";
import { TRANSFORMERS } from "@lexical/markdown";
import type { EditorState, LexicalEditor } from "lexical";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ToolbarPlugin } from "./ToolbarPlugin";
import { AutoLinkPlugin } from "./AutoLinkPlugin";

// Plugin to initialize editor with plain text content (legacy migration)
function InitialContentPlugin({ initialContent }: { initialContent?: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!initialContent) return;

    editor.update(() => {
      const root = $getRoot();
      
      // Only set content if editor has no meaningful content (handles Lexical's default empty paragraph)
      const textContentSize = root.getTextContentSize();
      
      if (textContentSize === 0) {
        // Clear default empty paragraph node
        root.clear();
        
        // Split by double newlines for paragraphs, preserve single newlines
        const paragraphs = initialContent.split(/\n\n+/);
        
        paragraphs.forEach((paragraphText) => {
          if (paragraphText.trim()) {
            const paragraph = $createParagraphNode();
            
            // Handle single line breaks within paragraphs
            const lines = paragraphText.split('\n');
            lines.forEach((line, lineIndex) => {
              if (lineIndex > 0) {
                // Add line break for single newlines
                const text = $createTextNode('\n' + line);
                paragraph.append(text);
              } else {
                const text = $createTextNode(line);
                paragraph.append(text);
              }
            });
            
            root.append(paragraph);
          }
        });
      }
    });
  }, [editor, initialContent]);

  return null;
}

interface RichTextEditorProps {
  initialContent?: string;
  initialEditorState?: string;
  onChange?: (editorState: EditorState, editor: LexicalEditor) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  editable?: boolean;
  className?: string;
}

const editorTheme = {
  paragraph: "mb-2 text-base leading-relaxed",
  quote: "border-l-4 border-muted pl-4 italic my-4",
  heading: {
    h1: "text-3xl font-bold mb-4",
    h2: "text-2xl font-bold mb-3",
    h3: "text-xl font-bold mb-2",
    h4: "text-lg font-semibold mb-2",
    h5: "text-base font-semibold mb-1",
  },
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal ml-4 my-2",
    ul: "list-disc ml-4 my-2",
    listitem: "mb-1",
  },
  link: "text-primary hover:underline cursor-pointer",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "bg-muted px-1 py-0.5 rounded font-mono text-sm",
  },
  code: "bg-muted p-4 rounded-lg font-mono text-sm my-4 block overflow-x-auto",
  codeHighlight: {
    atrule: "text-purple-600",
    attr: "text-blue-600",
    boolean: "text-orange-600",
    builtin: "text-cyan-600",
    cdata: "text-gray-500",
    char: "text-green-600",
    class: "text-yellow-600",
    "class-name": "text-yellow-600",
    comment: "text-gray-500 italic",
    constant: "text-orange-600",
    deleted: "text-red-600",
    doctype: "text-gray-500",
    entity: "text-orange-600",
    function: "text-blue-600",
    important: "text-red-600 font-bold",
    inserted: "text-green-600",
    keyword: "text-purple-600",
    namespace: "text-yellow-600",
    number: "text-orange-600",
    operator: "text-gray-700",
    prolog: "text-gray-500",
    property: "text-blue-600",
    punctuation: "text-gray-700",
    regex: "text-green-600",
    selector: "text-green-600",
    string: "text-green-600",
    symbol: "text-orange-600",
    tag: "text-red-600",
    url: "text-blue-600",
    variable: "text-orange-600",
  },
  hashtag: "text-primary font-medium"
};

export function RichTextEditor({
  initialContent,
  initialEditorState,
  onChange,
  onTextChange,
  placeholder = "Start typing...",
  autoFocus = false,
  editable = true,
  className = "",
}: RichTextEditorProps) {
  
  const initialConfig = {
    namespace: "DedwenEditor",
    theme: editorTheme,
    onError: (error: Error) => {
      console.error("Lexical Editor Error:", error);
    },
    editable,
    editorState: initialEditorState,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
      CodeHighlightNode,
      HashtagNode,
    ],
  };

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    if (onChange) {
      onChange(editorState, editor);
    }

    if (onTextChange) {
      editorState.read(() => {
        const root = editorState._nodeMap.get("root");
        if (root) {
          const textContent = root.getTextContent();
          onTextChange(textContent);
        }
      });
    }
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`relative border rounded-lg overflow-hidden bg-background ${className}`}>
        {editable && <ToolbarPlugin />}
        
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className={`
                  min-h-[200px] max-h-[500px] overflow-y-auto
                  px-4 py-3 outline-none
                  prose prose-sm max-w-none
                  dark:prose-invert
                  ${!editable ? 'cursor-default' : ''}
                `}
                data-testid="rich-text-content-editable"
              />
            }
            placeholder={
              <div className="absolute top-3 left-4 text-muted-foreground pointer-events-none select-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
        {autoFocus && <AutoFocusPlugin />}
        <ListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <InitialContentPlugin initialContent={initialContent} />
      </div>
    </LexicalComposer>
  );
}

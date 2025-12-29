'use client';

import { $convertFromMarkdownString } from '@lexical/markdown';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { useEffect } from 'react';
import NotionLikeEditorNodes from '@/components/editor/nodes/NotionLikeEditorNodes';
import { HorizontalRulePlugin } from '@/components/editor/plugins/HorizontalRulePlugin';
import ImagesPlugin from '@/components/editor/plugins/ImagesPlugin';
import { PLAYGROUND_TRANSFORMERS } from '@/components/editor/plugins/MarkdownTransformers';
import { TableContext } from '@/components/editor/plugins/TablePlugin';
import NotionLikeViewerTheme from '@/components/editor/themes/NotionLikeViewerTheme';
import '@/components/editor/core/Editor.css';

interface HelpContentProps {
  markdown: string;
}

function MarkdownLoader({ markdown }: { markdown: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(markdown, PLAYGROUND_TRANSFORMERS, undefined, true);
    });
  }, [editor, markdown]);

  return null;
}

function HelpContentInner({ markdown }: { markdown: string }) {
  return (
    <>
      <MarkdownLoader markdown={markdown} />
      <div className="editor-container">
        <RichTextPlugin
          contentEditable={
            <div className="editor-scroller">
              <div className="editor">
                <ContentEditable className="outline-none" />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      <ListPlugin />
      <CheckListPlugin />
      <TablePlugin hasCellMerge hasCellBackgroundColor />
      <HorizontalRulePlugin />
      <ImagesPlugin />
    </>
  );
}

export function HelpContent({ markdown }: HelpContentProps) {
  const initialConfig = {
    namespace: 'HelpContent',
    nodes: NotionLikeEditorNodes,
    theme: NotionLikeViewerTheme,
    editable: false,
    onError: (error: Error) => console.error('Lexical error:', error),
  };

  return (
    <div className="notion-like-editor help-content">
      {/* イメージのスタイル調整 for Help Content */}
      <style>{`
        .help-content .editor-image img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 0.5rem;
          border: 1px solid var(--color-gray-500) !important;
        }
      `}</style>
      <LexicalComposer initialConfig={initialConfig}>
        <TableContext>
          <HelpContentInner markdown={markdown} />
        </TableContext>
      </LexicalComposer>
    </div>
  );
}

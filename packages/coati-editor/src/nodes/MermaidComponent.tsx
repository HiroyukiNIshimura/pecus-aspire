import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $getNodeByKey, type NodeKey } from 'lexical';
import { type ChangeEvent, type JSX, useEffect, useMemo, useRef, useState } from 'react';

import { $isMermaidNode } from './MermaidNode';
import './MermaidNode.css';

function getIsDark(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

type MermaidComponentProps = {
  code: string;
  nodeKey: NodeKey;
};

const RENDER_DELAY_MS = 180;

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Mermaid diagram rendering failed.';
}

export default function MermaidComponent({ code, nodeKey }: MermaidComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [source, setSource] = useState(code);
  const [svg, setSvg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRendering, setIsRendering] = useState(false);

  const hasSource = useMemo(() => source.trim().length > 0, [source]);

  const [isDark, setIsDark] = useState(getIsDark);
  const renderCountRef = useRef(0);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(getIsDark());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setSource(code);
  }, [code]);

  useEffect(() => {
    if (!hasSource) {
      setSvg('');
      setErrorMessage('');
      setIsRendering(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsRendering(true);
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDark ? 'dark' : 'default',
        });

        renderCountRef.current += 1;
        const id = `mermaid-${nodeKey.replace(/[^a-zA-Z0-9_-]/g, '')}-${renderCountRef.current}`;
        const renderResult = await mermaid.render(id, source);

        if (!cancelled) {
          setSvg(renderResult.svg);
          setErrorMessage('');
        }
      } catch (error) {
        if (!cancelled) {
          setSvg('');
          setErrorMessage(normalizeError(error));
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    }, RENDER_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hasSource, source, nodeKey, isDark]);

  const handleSourceChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setSource(nextValue);

    if (!isEditable) {
      return;
    }

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isMermaidNode(node)) {
        node.setCode(nextValue);
      }
    });
  };

  return (
    <div className="editor-mermaid-container" data-lexical-mermaid-node="true">
      {isEditable && (
        <div className="editor-mermaid-input-area">
          <label htmlFor={`mermaid-source-${nodeKey}`} className="editor-mermaid-label">
            Mermaid
          </label>
          <textarea
            id={`mermaid-source-${nodeKey}`}
            className="editor-mermaid-textarea"
            value={source}
            onChange={handleSourceChange}
            spellCheck={false}
            aria-label="Mermaid source"
            placeholder="flowchart TD\n  A[Start] --> B[End]"
          />
        </div>
      )}

      <div className="editor-mermaid-preview-area">
        {isRendering && <div className="editor-mermaid-status">Rendering diagram...</div>}
        {!hasSource && isEditable && <div className="editor-mermaid-status">Write Mermaid syntax to preview.</div>}
        {!!errorMessage && <div className="editor-mermaid-error">{errorMessage}</div>}
        {!errorMessage && hasSource && !isRendering && (
          <div
            className="editor-mermaid-preview"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid renders SVG string from editor source by design
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </div>
  );
}

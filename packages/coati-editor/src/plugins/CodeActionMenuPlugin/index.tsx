/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from 'react';

import './index.css';

import { $isCodeNode, CodeNode, getCodeLanguageOptions, normalizeCodeLang } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNearestNodeFromDOMNode, isHTMLElement } from 'lexical';
import type * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CopyButton } from './components/CopyButton';
import { canBePrettier, PrettierButton } from './components/PrettierButton';
import { useDebounce } from './utils';

const CODE_PADDING = 8;

// サポートする言語リスト（@lexical/code からフィルタリング）
const SUPPORTED_LANGUAGES: [string, string][] = getCodeLanguageOptions().filter((option) =>
  [
    'c',
    'clike',
    'cpp',
    'css',
    'html',
    'java',
    'js',
    'javascript',
    'markdown',
    'objc',
    'objective-c',
    'plain',
    'powershell',
    'py',
    'python',
    'rust',
    'sql',
    'swift',
    'typescript',
    'xml',
  ].includes(option[0]),
);

interface Position {
  top: string;
  right: string;
}

function CodeActionMenuContainer({
  anchorElem,
  showOnlyCopy = false,
}: {
  anchorElem: HTMLElement;
  showOnlyCopy?: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const [lang, setLang] = useState('');
  const [isShown, setShown] = useState<boolean>(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({
    right: '0',
    top: '0',
  });
  const codeSetRef = useRef<Set<string>>(new Set());
  const codeDOMNodeRef = useRef<HTMLElement | null>(null);

  function getCodeDOMNode(): HTMLElement | null {
    return codeDOMNodeRef.current;
  }

  const debouncedOnMouseMove = useDebounce(
    (event: MouseEvent) => {
      const { codeDOMNode, isOutside } = getMouseInfo(event);
      if (isOutside) {
        setShown(false);
        return;
      }
      if (!codeDOMNode) {
        return;
      }

      codeDOMNodeRef.current = codeDOMNode;

      let codeNode: CodeNode | null = null;
      let _lang = '';

      editor.update(() => {
        const maybeCodeNode = $getNearestNodeFromDOMNode(codeDOMNode);

        if ($isCodeNode(maybeCodeNode)) {
          codeNode = maybeCodeNode;
          _lang = codeNode.getLanguage() || '';
        }
      });

      if (codeNode) {
        const { y: editorElemY, right: editorElemRight } = anchorElem.getBoundingClientRect();
        const { y, right } = codeDOMNode.getBoundingClientRect();
        setLang(_lang);
        setShown(true);
        setPosition({
          right: `${editorElemRight - right + CODE_PADDING}px`,
          top: `${y - editorElemY}px`,
        });
      }
    },
    50,
    1000,
  );

  useEffect(() => {
    if (!shouldListenMouseMove) {
      return;
    }

    document.addEventListener('mousemove', debouncedOnMouseMove);

    return () => {
      setShown(false);
      debouncedOnMouseMove.cancel();
      document.removeEventListener('mousemove', debouncedOnMouseMove);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove]);

  useEffect(() => {
    return editor.registerMutationListener(
      CodeNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            switch (type) {
              case 'created':
                codeSetRef.current.add(key);
                break;

              case 'destroyed':
                codeSetRef.current.delete(key);
                break;

              default:
                break;
            }
          }
        });
        setShouldListenMouseMove(codeSetRef.current.size > 0);
      },
      { skipInitialization: false },
    );
  }, [editor]);

  const normalizedLang = normalizeCodeLang(lang);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value;
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }

    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);
      if ($isCodeNode(codeNode)) {
        codeNode.setLanguage(newLang);
      }
    });
  };

  return (
    <>
      {isShown ? (
        <div className="notion-like-editor code-action-menu-container" style={{ ...position }}>
          {!showOnlyCopy && (
            <select
              className="select select-xs max-w-sm"
              value={lang}
              onChange={handleLanguageChange}
              aria-label="コードブロックの言語を選択"
            >
              {SUPPORTED_LANGUAGES.map(([value, name]) => (
                <option key={value} value={value}>
                  {name}
                </option>
              ))}
            </select>
          )}
          <CopyButton editor={editor} getCodeDOMNode={getCodeDOMNode} />
          {!showOnlyCopy && canBePrettier(normalizedLang) ? (
            <PrettierButton editor={editor} getCodeDOMNode={getCodeDOMNode} lang={normalizedLang} />
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function getMouseInfo(event: MouseEvent): {
  codeDOMNode: HTMLElement | null;
  isOutside: boolean;
} {
  const target = event.target;

  if (isHTMLElement(target)) {
    // Editor と Viewer 両方のテーマに対応
    const codeDOMNode =
      target.closest<HTMLElement>('code.NotionLikeEditorTheme__code') ||
      target.closest<HTMLElement>('code.NotionLikeViewerTheme__code');
    const isOutside = !(codeDOMNode || target.closest<HTMLElement>('div.code-action-menu-container'));

    return { codeDOMNode, isOutside };
  } else {
    return { codeDOMNode: null, isOutside: true };
  }
}

export default function CodeActionMenuPlugin({
  anchorElem = document.body,
  showOnlyCopy = false,
}: {
  anchorElem?: HTMLElement;
  showOnlyCopy?: boolean;
}): React.ReactPortal | null {
  return createPortal(<CodeActionMenuContainer anchorElem={anchorElem} showOnlyCopy={showOnlyCopy} />, anchorElem);
}

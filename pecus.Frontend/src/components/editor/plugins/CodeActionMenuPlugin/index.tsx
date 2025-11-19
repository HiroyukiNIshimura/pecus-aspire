"use client";

import type { JSX } from "react";

import { $isCodeNode, CodeNode } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNearestNodeFromDOMNode, isHTMLElement } from "lexical";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CopyButton } from "./CopyButton";
import { PrettierButton } from "./PrettierButton";
import { LanguageSelector } from "./LanguageSelector";
import styles from "../../PecusEditor.module.css";

const CODE_PADDING = 8;

interface Position {
  top: string;
  right: string;
}

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number | null = null;

  const debouncedFn = function (...args: Parameters<T>) {
    const currentTime = Date.now();

    if (timeoutId) clearTimeout(timeoutId);

    if (maxWait !== undefined) {
      if (lastCallTime === null) {
        lastCallTime = currentTime;
      }

      if (maxWaitTimeoutId) clearTimeout(maxWaitTimeoutId);

      const timeSinceLastCall = currentTime - lastCallTime;
      if (timeSinceLastCall >= maxWait) {
        lastCallTime = currentTime;
        fn(...args);
        return;
      }

      maxWaitTimeoutId = setTimeout(() => {
        lastCallTime = null;
        fn(...args);
      }, maxWait - timeSinceLastCall);
    }

    timeoutId = setTimeout(() => {
      lastCallTime = null;
      fn(...args);
    }, ms);
  };

  (debouncedFn as any).cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (maxWaitTimeoutId) clearTimeout(maxWaitTimeoutId);
    timeoutId = null;
    maxWaitTimeoutId = null;
    lastCallTime = null;
  };

  return debouncedFn as ((...args: Parameters<T>) => void) & {
    cancel: () => void;
  };
}

function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number,
) {
  const funcRef = useRef<T | null>(null);
  funcRef.current = fn;

  return useMemo(
    () =>
      debounce(
        ((...args: Parameters<T>) => {
          if (funcRef.current) {
            funcRef.current(...args);
          }
        }) as T,
        ms,
        maxWait,
      ),
    [ms, maxWait],
  );
}

function CodeActionMenuContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const [lang, setLang] = useState("");
  const [isShown, setShown] = useState<boolean>(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] =
    useState<boolean>(false);
  const [position, setPosition] = useState<Position>({
    right: "0",
    top: "0",
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
      let _lang = "";

      editor.update(() => {
        const maybeCodeNode = $getNearestNodeFromDOMNode(codeDOMNode);

        if ($isCodeNode(maybeCodeNode)) {
          codeNode = maybeCodeNode;
          _lang = codeNode.getLanguage() || "";
        }
      });

      if (codeNode) {
        const { y: editorElemY, right: editorElemRight } =
          anchorElem.getBoundingClientRect();
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

    document.addEventListener("mousemove", debouncedOnMouseMove);

    return () => {
      setShown(false);
      debouncedOnMouseMove.cancel();
      document.removeEventListener("mousemove", debouncedOnMouseMove);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove]);

  useEffect(() => {
    return editor.registerMutationListener(
      CodeNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            switch (type) {
              case "created":
                codeSetRef.current.add(key);
                break;

              case "destroyed":
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

  // 言語変更を検知して表示を更新
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const codeDOMNode = getCodeDOMNode();
      if (!codeDOMNode || !isShown) return;

      editorState.read(() => {
        const maybeCodeNode = $getNearestNodeFromDOMNode(codeDOMNode);
        if ($isCodeNode(maybeCodeNode)) {
          const currentLang = maybeCodeNode.getLanguage() || "";
          if (currentLang !== lang) {
            setLang(currentLang);
          }
        }
      });
    });
  }, [editor, isShown, lang]);

  return (
    <>
      {isShown ? (
        <div
          data-code-action-menu="true"
          style={{
            position: "absolute",
            top: position.top,
            right: position.right,
            height: "35.8px",
            fontSize: "10px",
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            userSelect: "none",
            backgroundColor: "var(--color-base-100)",
            borderRadius: "0.375rem",
            padding: "0.25rem",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            zIndex: 10,
          }}
        >
          <LanguageSelector
            editor={editor}
            currentLanguage={lang}
            getCodeDOMNode={getCodeDOMNode}
            onLanguageChange={(newLang) => setLang(newLang)}
          />
          <div className="flex items-center gap-1">
            <PrettierButton editor={editor} getCodeDOMNode={getCodeDOMNode} />
            <CopyButton editor={editor} getCodeDOMNode={getCodeDOMNode} />
          </div>
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
    // コピーボタンのコンテナの上にいる場合は、直前の状態を維持
    // data-code-action-menu 属性でマークする
    const isOnMenu = target.closest('[data-code-action-menu="true"]');
    if (isOnMenu) {
      return { codeDOMNode: null, isOutside: false };
    }

    // CSS Modules で変換されたクラス名を使用
    const codeDOMNode = target.closest<HTMLElement>(
      `code.${styles.editorCode}`,
    );

    // エディタのコンテナ内にあるかチェック
    if (codeDOMNode) {
      const editorContainer = codeDOMNode.closest('[contenteditable="true"]');
      if (!editorContainer) {
        // エディタ外の code 要素（DevTools等）なので無視
        return { codeDOMNode: null, isOutside: true };
      }
    }

    const isOutside = !codeDOMNode;

    return { codeDOMNode, isOutside };
  } else {
    return { codeDOMNode: null, isOutside: true };
  }
}

export default function CodeActionMenuPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): React.ReactPortal | null {
  return createPortal(
    <CodeActionMenuContainer anchorElem={anchorElem} />,
    anchorElem,
  );
}

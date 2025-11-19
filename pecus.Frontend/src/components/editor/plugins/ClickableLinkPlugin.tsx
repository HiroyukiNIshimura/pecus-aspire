"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export default function ClickableLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "A") {
        const href = target.getAttribute("href");
        if (href) {
          // Ctrl/Cmd + クリック、または中クリックの場合は新しいタブで開く
          if (event.metaKey || event.ctrlKey || event.button === 1) {
            event.preventDefault();
            window.open(href, "_blank", "noopener,noreferrer");
          } else {
            // 通常のクリックの場合は現在のタブで開く
            event.preventDefault();
            window.location.href = href;
          }
        }
      }
    };

    const handleAuxClick = (event: MouseEvent) => {
      if (event.button === 1) {
        // 中クリック
        handleClick(event);
      }
    };

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener("click", handleClick);
      rootElement.addEventListener("auxclick", handleAuxClick);

      return () => {
        rootElement.removeEventListener("click", handleClick);
        rootElement.removeEventListener("auxclick", handleAuxClick);
      };
    }
  }, [editor]);

  return null;
}

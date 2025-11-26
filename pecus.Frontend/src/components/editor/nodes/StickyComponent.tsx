/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LexicalEditor, NodeKey } from "lexical";
import type { JSX } from "react";

import "./StickyNode.css";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { calculateZoomLevel } from "@lexical/utils";
import { $getNodeByKey } from "lexical";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useSharedHistoryContext } from "../context/SharedHistoryContext";
import StickyEditorTheme from "../themes/StickyEditorTheme";
import ContentEditable from "../ui/ContentEditable";
import { $isStickyNode } from "./StickyNode";

type Positioning = {
  isDragging: boolean;
  offsetX: number;
  offsetY: number;
  rootElementRect: null | ClientRect;
  x: number;
  y: number;
};

function positionSticky(stickyElem: HTMLElement, positioning: Positioning): void {
  const style = stickyElem.style;
  // .editor-scroller 内での相対位置で配置
  style.top = `${positioning.y}px`;
  style.left = `${positioning.x}px`;
}

export default function StickyComponent({
  x,
  y,
  nodeKey,
  color,
  caption,
}: {
  caption: LexicalEditor;
  color: "pink" | "yellow";
  nodeKey: NodeKey;
  x: number;
  y: number;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const stickyContainerRef = useRef<null | HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const positioningRef = useRef<Positioning>({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    rootElementRect: null,
    x: 0,
    y: 0,
  });

  // エディターのスクロールコンテナを取得（.editor-scroller）
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (rootElement) {
      // .editor-scroller を探す（エディターの親要素）
      const scrollerContainer = rootElement.closest(".editor-scroller");
      if (scrollerContainer) {
        setPortalContainer(scrollerContainer as HTMLElement);
      } else {
        // フォールバック: rootElement の親要素
        setPortalContainer(rootElement.parentElement);
      }
    }
  }, [editor]);

  // FlyonUI との競合を防ぐため、バブリングフェーズでのイベント伝播を止める
  useEffect(() => {
    const stickyContainer = stickyContainerRef.current;
    if (!stickyContainer) return;

    const stopFlyonuiEvents = (e: Event) => {
      // FlyonUI の dropdown/popover が反応しないようにする
      e.stopPropagation();
    };

    // FlyonUI が監視するイベントをキャプチャ
    stickyContainer.addEventListener("focusin", stopFlyonuiEvents);
    stickyContainer.addEventListener("focusout", stopFlyonuiEvents);

    return () => {
      stickyContainer.removeEventListener("focusin", stopFlyonuiEvents);
      stickyContainer.removeEventListener("focusout", stopFlyonuiEvents);
    };
  }, []);

  useEffect(() => {
    const position = positioningRef.current;
    position.x = x;
    position.y = y;

    const stickyContainer = stickyContainerRef.current;
    if (stickyContainer !== null) {
      positionSticky(stickyContainer, position);
    }
  }, [x, y]);

  useLayoutEffect(() => {
    const position = positioningRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const { target } = entry;
        position.rootElementRect = target.getBoundingClientRect();
        const stickyContainer = stickyContainerRef.current;
        if (stickyContainer !== null) {
          positionSticky(stickyContainer, position);
        }
      }
    });

    const removeRootListener = editor.registerRootListener((nextRootElem, prevRootElem) => {
      if (prevRootElem !== null) {
        resizeObserver.unobserve(prevRootElem);
      }
      if (nextRootElem !== null) {
        resizeObserver.observe(nextRootElem);
      }
    });

    const handleWindowResize = () => {
      const rootElement = editor.getRootElement();
      const stickyContainer = stickyContainerRef.current;
      if (rootElement !== null && stickyContainer !== null) {
        position.rootElementRect = rootElement.getBoundingClientRect();
        positionSticky(stickyContainer, position);
      }
    };

    // スクロール時に rootElementRect を更新して位置を再計算
    const handleScroll = () => {
      const rootElement = editor.getRootElement();
      const stickyContainer = stickyContainerRef.current;
      if (rootElement !== null && stickyContainer !== null) {
        position.rootElementRect = rootElement.getBoundingClientRect();
        positionSticky(stickyContainer, position);
      }
    };

    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("scroll", handleScroll, true); // capture phase でスクロールを検知

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("scroll", handleScroll, true);
      removeRootListener();
    };
  }, [editor]);

  useEffect(() => {
    const stickyContainer = stickyContainerRef.current;
    if (stickyContainer !== null) {
      // Delay adding transition so we don't trigger the
      // transition on load of the sticky.
      setTimeout(() => {
        stickyContainer.style.setProperty("transition", "top 0.3s ease 0s, left 0.3s ease 0s");
      }, 500);
    }
  }, []);

  const handlePointerMove = (event: PointerEvent) => {
    const stickyContainer = stickyContainerRef.current;
    const positioning = positioningRef.current;
    const rootElementRect = positioning.rootElementRect;
    const zoom = calculateZoomLevel(stickyContainer);
    if (stickyContainer !== null && positioning.isDragging && rootElementRect !== null && portalContainer !== null) {
      // portalContainer (.editor-scroller) の位置を基準に計算
      const portalRect = portalContainer.getBoundingClientRect();

      // 新しい位置を計算（portalContainer に対する相対座標）
      // offsetX/offsetY は付箋内のクリック位置（ビューポート座標での差分）
      let newX = (event.clientX - portalRect.left) / zoom - positioning.offsetX;
      let newY = (event.clientY - portalRect.top) / zoom - positioning.offsetY;

      // StickyComponent のサイズを取得
      const stickyRect = stickyContainer.getBoundingClientRect();
      const stickyWidth = stickyRect.width / zoom;
      const stickyHeight = stickyRect.height / zoom;

      // rootElement の範囲内に制限
      const maxX = rootElementRect.width - stickyWidth;
      const maxY = rootElementRect.height - stickyHeight;

      // 境界チェック（0 以上、最大値以下に制限）
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      positioning.x = newX;
      positioning.y = newY;
      positionSticky(stickyContainer, positioning);
    }
  };

  const handlePointerUp = (_event: PointerEvent) => {
    const stickyContainer = stickyContainerRef.current;
    const positioning = positioningRef.current;
    if (stickyContainer !== null) {
      positioning.isDragging = false;
      stickyContainer.classList.remove("dragging");
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isStickyNode(node)) {
          node.setPosition(positioning.x, positioning.y);
        }
      });
    }
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };

  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isStickyNode(node)) {
        node.remove();
      }
    });
  };

  const handleColorChange = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isStickyNode(node)) {
        node.toggleColor();
      }
    });
  };

  useSharedHistoryContext();

  const stickyContent = (
    <div ref={stickyContainerRef} className="sticky-note-container">
      <div
        className={`sticky-note ${color}`}
        onPointerDown={(event) => {
          const stickyContainer = stickyContainerRef.current;
          if (stickyContainer == null || event.button === 2 || event.target !== stickyContainer.firstChild) {
            // Right click or click on editor should not work
            return;
          }
          const stickContainer = stickyContainer;
          const positioning = positioningRef.current;
          if (stickContainer !== null && portalContainer !== null) {
            const portalRect = portalContainer.getBoundingClientRect();
            const zoom = calculateZoomLevel(stickContainer);
            // クリック位置から現在の付箋位置を引いてオフセットを計算
            positioning.offsetX = (event.clientX - portalRect.left) / zoom - positioning.x;
            positioning.offsetY = (event.clientY - portalRect.top) / zoom - positioning.y;
            positioning.isDragging = true;
            stickContainer.classList.add("dragging");
            document.addEventListener("pointermove", handlePointerMove);
            document.addEventListener("pointerup", handlePointerUp);
            event.preventDefault();
          }
        }}
      >
        <button type="button" onClick={handleDelete} className="delete" aria-label="Delete sticky note" title="Delete">
          X
        </button>
        <button
          type="button"
          onClick={handleColorChange}
          className="color"
          aria-label="Change sticky note color"
          title="Color"
        >
          <i className="bucket" />
        </button>
        <LexicalNestedComposer initialEditor={caption} initialTheme={StickyEditorTheme}>
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                placeholder="What's up?"
                placeholderClassName="StickyNode__placeholder"
                className="StickyNode__contentEditable"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </LexicalNestedComposer>
      </div>
    </div>
  );

  // portalContainer がまだ設定されていない場合は null を返す
  if (!portalContainer) {
    return null;
  }

  return createPortal(stickyContent, portalContainer);
}

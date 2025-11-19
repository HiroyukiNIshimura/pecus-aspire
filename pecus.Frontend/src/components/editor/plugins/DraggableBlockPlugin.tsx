"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import {
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $setSelection,
} from "lexical";
import { useRef, useState } from "react";
import type { JSX } from "react";
import styles from "../PecusEditor.module.css";

const DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

/**
 * ドラッグ可能なブロックプラグイン
 * ブロック左側に＋アイコンとドラッグハンドルを表示
 */
export default function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
    null,
  );

  function insertBlock(e: React.MouseEvent) {
    if (!draggableElement || !editor) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableElement);
      if (!node) {
        return;
      }

      const pNode = $createParagraphNode();

      // Alt/Ctrl+クリックで上に、通常クリックで下に追加
      if (e.altKey || e.ctrlKey) {
        node.insertBefore(pNode);
      } else {
        node.insertAfter(pNode);
      }

      // 新しいノードを選択してフォーカス
      pNode.select();
    });

    // エディタにフォーカスを戻してから "/" を挿入
    setTimeout(() => {
      editor.focus();
      editor.update(() => {
        const selection = $getSelection();
        if (selection) {
          selection.insertText("/");
        }
      });
    }, 0);
  }

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className={styles.draggableBlockMenu}>
          <button
            type="button"
            title="クリックでブロック追加メニューを表示（Alt/Ctrl+クリックで上に追加）"
            className={styles.iconPlus}
            onClick={insertBlock}
            aria-label="ブロックを追加"
          />
          <div className={styles.iconDrag} aria-label="ドラッグして移動" />
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className={styles.draggableBlockTargetLine} />
      }
      isOnMenu={isOnMenu}
      onElementChanged={setDraggableElement}
    />
  );
}

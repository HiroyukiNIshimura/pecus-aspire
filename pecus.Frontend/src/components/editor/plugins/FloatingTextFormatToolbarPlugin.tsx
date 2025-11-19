"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $findMatchingParent } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  getDOMSelection,
  type LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  $getNodeByKey,
} from "lexical";
import { $patchStyleText } from "@lexical/selection";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { JSX } from "react";
import styles from "../PecusEditor.module.css";
import { OPEN_LINK_EDITOR_COMMAND } from "./FloatingLinkEditorPlugin";

function getSelectedNode(selection: any) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isTextNode(focus) ? focusNode : focusNode;
  } else {
    return $isTextNode(anchor) ? anchorNode : anchorNode;
  }
}

function setFloatingElemPosition(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
): void {
  const scrollerElem = anchorElem.parentElement;

  if (targetRect === null || !scrollerElem) {
    floatingElem.style.opacity = "0";
    floatingElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }

  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const editorScrollerRect = scrollerElem.getBoundingClientRect();

  let top = targetRect.top - floatingElemRect.height - 8;
  let left =
    targetRect.left - floatingElemRect.width / 2 + targetRect.width / 2;

  if (top < editorScrollerRect.top) {
    top = targetRect.bottom + 8;
  }

  if (left < editorScrollerRect.left) {
    left = editorScrollerRect.left;
  }

  if (left + floatingElemRect.width > editorScrollerRect.right) {
    left = editorScrollerRect.right - floatingElemRect.width;
  }

  top -= anchorElementRect.top;
  left -= anchorElementRect.left;

  floatingElem.style.opacity = "1";
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

function getDOMRangeRect(
  nativeSelection: Selection,
  rootElement: HTMLElement,
): DOMRect | null {
  const range = nativeSelection.getRangeAt(0);

  let rect: DOMRect | null = null;

  if (nativeSelection.anchorNode === rootElement) {
    let inner: Element | Text | null = rootElement;
    while (inner.firstElementChild != null) {
      inner = inner.firstElementChild;
    }
    rect = inner.getBoundingClientRect();
  } else {
    rect = range.getBoundingClientRect();
  }

  return rect;
}

function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  isBold,
  isItalic,
  isUnderline,
  isStrikethrough,
  isCode,
  isLink,
  textColor,
  backgroundColor,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  isLink: boolean;
  textColor: string;
  backgroundColor: string;
}): JSX.Element {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [editor],
  );

  const onTextColorChange = useCallback(
    (color: string) => {
      applyStyleText({ color });
      setShowTextColorPicker(false);
    },
    [applyStyleText],
  );

  const onBgColorChange = useCallback(
    (color: string) => {
      applyStyleText({ "background-color": color });
      setShowBgColorPicker(false);
    },
    [applyStyleText],
  );

  const predefinedColors = [
    { name: "デフォルト", value: "" },
    { name: "黒", value: "#000000" },
    { name: "グレー", value: "#6B7280" },
    { name: "赤", value: "#EF4444" },
    { name: "オレンジ", value: "#F97316" },
    { name: "黄色", value: "#EAB308" },
    { name: "緑", value: "#10B981" },
    { name: "青", value: "#3B82F6" },
    { name: "紫", value: "#8B5CF6" },
    { name: "ピンク", value: "#EC4899" },
  ];

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection();

    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    const nativeSelection = getDOMSelection(editor._window);

    if (popupCharStylesEditorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement);

      setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem);
    }
  }, [editor, anchorElem]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar();
      });
    };

    window.addEventListener("resize", update);
    if (scrollerElem) {
      scrollerElem.addEventListener("scroll", update);
    }

    return () => {
      window.removeEventListener("resize", update);
      if (scrollerElem) {
        scrollerElem.removeEventListener("scroll", update);
      }
    };
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar();
    });
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateTextFormatFloatingToolbar]);

  return (
    <div
      ref={popupCharStylesEditorRef}
      className={styles.floatingTextFormatPopup}
    >
      {editor.isEditable() && (
        <>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            }}
            className={`${styles.popupItem} ${styles.spaced} ${isBold ? styles.active : ""}`}
            title="太字 (⌘B)"
            aria-label="太字"
          >
            <i className={styles.iconBold} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            }}
            className={`${styles.popupItem} ${styles.spaced} ${isItalic ? styles.active : ""}`}
            title="斜体 (⌘I)"
            aria-label="斜体"
          >
            <i className={styles.iconItalic} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            }}
            className={`${styles.popupItem} ${styles.spaced} ${isUnderline ? styles.active : ""}`}
            title="下線 (⌘U)"
            aria-label="下線"
          >
            <i className={styles.iconUnderline} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
            }}
            className={`${styles.popupItem} ${styles.spaced} ${isStrikethrough ? styles.active : ""}`}
            title="取り消し線"
            aria-label="取り消し線"
          >
            <i className={styles.iconStrikethrough} />
          </button>
          <div className={styles.divider} />
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
            }}
            className={`${styles.popupItem} ${styles.spaced} ${isCode ? styles.active : ""}`}
            title="コード"
            aria-label="コード"
          >
            <i className={styles.iconCode} />
          </button>
          <div className={styles.divider} />
          <button
            type="button"
            onClick={() => {
              if (isLink) {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
              } else {
                editor.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined);
              }
            }}
            className={`${styles.popupItem} ${styles.spaced} ${isLink ? styles.active : ""}`}
            title="リンク"
            aria-label="リンク"
          >
            <i className={styles.iconLink} />
          </button>
          <div className={styles.divider} />
          <div className={styles.colorPickerWrapper}>
            <button
              type="button"
              onClick={() => {
                setShowTextColorPicker(!showTextColorPicker);
                setShowBgColorPicker(false);
              }}
              className={`${styles.popupItem} ${styles.spaced}`}
              title="文字色"
              aria-label="文字色"
            >
              <i
                className={styles.iconTextColor}
                style={{ color: textColor || "currentColor" }}
              />
            </button>
            {showTextColorPicker && (
              <div className={styles.colorPicker}>
                {predefinedColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onTextColorChange(c.value)}
                    className={styles.colorOption}
                    style={{
                      backgroundColor: c.value || "transparent",
                      border: c.value
                        ? "1px solid var(--color-base-300)"
                        : "1px solid var(--color-base-content)",
                    }}
                    title={c.name}
                    aria-label={c.name}
                  />
                ))}
              </div>
            )}
          </div>
          <div className={styles.colorPickerWrapper}>
            <button
              type="button"
              onClick={() => {
                setShowBgColorPicker(!showBgColorPicker);
                setShowTextColorPicker(false);
              }}
              className={`${styles.popupItem} ${styles.spaced}`}
              title="背景色"
              aria-label="背景色"
            >
              <i
                className={styles.iconBgColor}
                style={{ backgroundColor: backgroundColor || "transparent" }}
              />
            </button>
            {showBgColorPicker && (
              <div className={styles.colorPicker}>
                {predefinedColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onBgColorChange(c.value)}
                    className={styles.colorOption}
                    style={{
                      backgroundColor: c.value || "transparent",
                      border: c.value
                        ? "1px solid var(--color-base-300)"
                        : "1px solid var(--color-base-content)",
                    }}
                    title={c.name}
                    aria-label={c.name}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
): JSX.Element | null {
  const [isText, setIsText] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [textColor, setTextColor] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = getDOMSelection(editor._window);
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);

      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      // Update link state
      const linkParent = $findMatchingParent(node, $isLinkNode);
      setIsLink(linkParent !== null);

      // Update colors from inline styles
      if ($isTextNode(node)) {
        const style = node.getStyle();
        const colorMatch = style.match(/color:\s*([^;]+)/);
        const bgColorMatch = style.match(/background-color:\s*([^;]+)/);
        setTextColor(colorMatch ? colorMatch[1].trim() : "");
        setBackgroundColor(bgColorMatch ? bgColorMatch[1].trim() : "");
      }

      if (selection.getTextContent() !== "") {
        setIsText($isTextNode(node));
      } else {
        setIsText(false);
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, "");
      if (!selection.isCollapsed() && rawTextContent === "") {
        setIsText(false);
        return;
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener("selectionchange", updatePopup);
    return () => {
      document.removeEventListener("selectionchange", updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      }),
    );
  }, [editor, updatePopup]);

  if (!isText) {
    return null;
  }

  return createPortal(
    <TextFormatFloatingToolbar
      editor={editor}
      anchorElem={anchorElem}
      isBold={isBold}
      isItalic={isItalic}
      isUnderline={isUnderline}
      isStrikethrough={isStrikethrough}
      isCode={isCode}
      isLink={isLink}
      textColor={textColor}
      backgroundColor={backgroundColor}
    />,
    anchorElem,
  );
}

/**
 * フローティングテキストフォーマットツールバープラグイン
 * テキスト選択時に太字・斜体などのフォーマットツールバーを表示
 */
export default function FloatingTextFormatToolbarPlugin({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingTextFormatToolbar(editor, anchorElem);
}

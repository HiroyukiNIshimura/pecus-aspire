"use client";

import type { JSX } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import {
  $getTableAndElementByKey,
  $getTableColumnIndexFromTableCellNode,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableNode,
  getTableElement,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $getNearestNodeFromDOMNode,
  type EditorThemeClasses,
  isHTMLElement,
  type NodeKey,
} from "lexical";
import { useEffect, useMemo, useRef, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";

import { useDebounce } from "../utils/useDebounce";

const BUTTON_WIDTH_PX = 20;

function TableHoverActionsContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): JSX.Element | null {
  const [editor, { getTheme }] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [isShownRow, setShownRow] = useState<boolean>(false);
  const [isShownColumn, setShownColumn] = useState<boolean>(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] =
    useState<boolean>(false);
  const [position, setPosition] = useState({});
  const tableSetRef = useRef<Set<NodeKey>>(new Set());
  const tableCellDOMNodeRef = useRef<HTMLElement | null>(null);

  const debouncedOnMouseMove = useDebounce(
    (event: MouseEvent) => {
      const { isOutside, tableDOMNode } = getMouseInfo(event, getTheme);

      if (isOutside) {
        setShownRow(false);
        setShownColumn(false);
        return;
      }

      if (!tableDOMNode) {
        return;
      }

      tableCellDOMNodeRef.current = tableDOMNode;

      let hoveredRowNode: TableCellNode | null = null;
      let hoveredColumnNode: TableCellNode | null = null;
      let tableDOMElement: HTMLElement | null = null;

      editor.getEditorState().read(
        () => {
          const maybeTableCell = $getNearestNodeFromDOMNode(tableDOMNode);

          if ($isTableCellNode(maybeTableCell)) {
            const table = $findMatchingParent(maybeTableCell, (node) =>
              $isTableNode(node),
            );
            if (!$isTableNode(table)) {
              return;
            }

            tableDOMElement = getTableElement(
              table,
              editor.getElementByKey(table.getKey()),
            );

            if (tableDOMElement) {
              const rowCount = table.getChildrenSize();
              const colCount = (
                table.getChildAtIndex(0) as TableRowNode
              )?.getChildrenSize();

              const rowIndex =
                $getTableRowIndexFromTableCellNode(maybeTableCell);
              const colIndex =
                $getTableColumnIndexFromTableCellNode(maybeTableCell);

              if (rowIndex === rowCount - 1) {
                hoveredRowNode = maybeTableCell;
              } else if (colIndex === colCount - 1) {
                hoveredColumnNode = maybeTableCell;
              }
            }
          }
        },
        { editor },
      );

      if (tableDOMElement) {
        const {
          width: tableElemWidth,
          y: tableElemY,
          right: tableElemRight,
          left: tableElemLeft,
          bottom: tableElemBottom,
          height: tableElemHeight,
        } = (tableDOMElement as HTMLTableElement).getBoundingClientRect();

        const anchorRect = anchorElem.getBoundingClientRect();
        const { y: editorElemY, left: editorElemLeft } = anchorRect;

        if (hoveredRowNode) {
          setShownColumn(false);
          setShownRow(true);
          setPosition({
            height: BUTTON_WIDTH_PX,
            left: tableElemLeft - editorElemLeft,
            top: tableElemBottom - editorElemY + 5,
            width: tableElemWidth,
          });
        } else if (hoveredColumnNode) {
          setShownColumn(true);
          setShownRow(false);
          setPosition({
            height: tableElemHeight,
            left: tableElemRight - editorElemLeft + 5,
            top: tableElemY - editorElemY,
            width: BUTTON_WIDTH_PX,
          });
        }
      }
    },
    50,
    250,
  );

  const tableResizeObserver = useMemo(() => {
    return new ResizeObserver(() => {
      setShownRow(false);
      setShownColumn(false);
    });
  }, []);

  useEffect(() => {
    if (!shouldListenMouseMove) {
      return;
    }

    document.addEventListener("mousemove", debouncedOnMouseMove);

    return () => {
      setShownRow(false);
      setShownColumn(false);
      debouncedOnMouseMove.cancel();
      document.removeEventListener("mousemove", debouncedOnMouseMove);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove]);

  useEffect(() => {
    return mergeRegister(
      editor.registerMutationListener(
        TableNode,
        (mutations) => {
          editor.getEditorState().read(
            () => {
              let resetObserver = false;
              for (const [key, type] of mutations) {
                switch (type) {
                  case "created": {
                    tableSetRef.current.add(key);
                    resetObserver = true;
                    break;
                  }
                  case "destroyed": {
                    tableSetRef.current.delete(key);
                    resetObserver = true;
                    break;
                  }
                  default:
                    break;
                }
              }
              if (resetObserver) {
                tableResizeObserver.disconnect();
                for (const tableKey of tableSetRef.current) {
                  const { tableElement } = $getTableAndElementByKey(tableKey);
                  tableResizeObserver.observe(tableElement);
                }
                setShouldListenMouseMove(tableSetRef.current.size > 0);
              }
            },
            { editor },
          );
        },
        { skipInitialization: false },
      ),
    );
  }, [editor, tableResizeObserver]);

  const insertAction = (insertRow: boolean) => {
    editor.update(() => {
      if (tableCellDOMNodeRef.current) {
        const maybeTableNode = $getNearestNodeFromDOMNode(
          tableCellDOMNodeRef.current,
        );
        maybeTableNode?.selectEnd();
        if (insertRow) {
          $insertTableRowAtSelection();
          setShownRow(false);
        } else {
          $insertTableColumnAtSelection();
          setShownColumn(false);
        }
      }
    });
  };

  if (!isEditable) {
    return null;
  }

  return (
    <>
      {isShownRow && (
        <button
          type="button"
          className="absolute bg-base-content/10 hover:bg-primary/20 border border-base-300 rounded cursor-pointer flex items-center justify-center transition-colors z-10"
          style={{ ...position }}
          onClick={() => insertAction(true)}
          title="行を追加"
        >
          <span className="iconify mdi--plus text-base-content" />
        </button>
      )}
      {isShownColumn && (
        <button
          type="button"
          className="absolute bg-base-content/10 hover:bg-primary/20 border border-base-300 rounded cursor-pointer flex items-center justify-center transition-colors z-10"
          style={{ ...position }}
          onClick={() => insertAction(false)}
          title="列を追加"
        >
          <span className="iconify mdi--plus text-base-content" />
        </button>
      )}
    </>
  );
}

function getMouseInfo(
  event: MouseEvent,
  getTheme: () => EditorThemeClasses | null | undefined,
): {
  tableDOMNode: HTMLElement | null;
  isOutside: boolean;
} {
  const target = event.target;

  if (isHTMLElement(target)) {
    // テーブルセルを探す（クラス名ではなく、要素タイプで判定）
    const tableDOMNode = target.closest<HTMLElement>("td, th");

    const isOutside = !(
      tableDOMNode ||
      target.closest<HTMLElement>("button") ||
      target.closest<HTMLElement>("div.TableCellResizer__resizer")
    );

    return { isOutside, tableDOMNode };
  }
  return { isOutside: true, tableDOMNode: null };
}

export default function TableHoverActionsPlugin({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): React.ReactPortal | null {
  const isEditable = useLexicalEditable();

  return isEditable && anchorElem
    ? createPortal(
        <TableHoverActionsContainer anchorElem={anchorElem} />,
        anchorElem,
      )
    : null;
}

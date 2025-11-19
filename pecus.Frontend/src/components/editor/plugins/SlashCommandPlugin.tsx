"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
  type TextNode,
} from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { $createCodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { JSX } from "react";
import styles from "../PecusEditor.module.css";
import { openYouTubeModal } from "./YouTubePlugin";

class ComponentPickerOption extends MenuOption {
  title: string;
  icon?: JSX.Element;
  keywords: string[];
  onSelect: (queryString: string) => void;

  constructor(
    title: string,
    options: {
      icon?: JSX.Element;
      keywords?: string[];
      onSelect: (queryString: string) => void;
    },
  ) {
    super(title);
    this.title = title;
    this.icon = options.icon;
    this.keywords = options.keywords || [];
    this.onSelect = options.onSelect.bind(this);
  }
}

function getBaseOptions(editor: LexicalEditor) {
  return [
    new ComponentPickerOption("段落", {
      icon: <i className="text-lg">¶</i>,
      keywords: ["paragraph", "p", "text", "normal"],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode());
          }
        }),
    }),
    ...([1, 2, 3] as const).map(
      (n) =>
        new ComponentPickerOption(`見出し${n}`, {
          icon: <i className="font-bold text-lg">H{n}</i>,
          keywords: ["heading", "header", `h${n}`],
          onSelect: () =>
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode(`h${n}`));
              }
            }),
        }),
    ),
    new ComponentPickerOption("箇条書きリスト", {
      icon: <i className="text-lg">•</i>,
      keywords: ["bulleted list", "unordered list", "ul"],
      onSelect: () =>
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption("番号付きリスト", {
      icon: <i className="text-lg">1.</i>,
      keywords: ["numbered list", "ordered list", "ol"],
      onSelect: () =>
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption("チェックリスト", {
      icon: <i className="text-lg">☑</i>,
      keywords: ["check list", "todo list", "checkbox"],
      onSelect: () =>
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption("引用", {
      icon: <i className="text-lg">"</i>,
      keywords: ["quote", "blockquote"],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode());
          }
        }),
    }),
    new ComponentPickerOption("コードブロック", {
      icon: <i className="text-lg">&lt;/&gt;</i>,
      keywords: ["code", "codeblock", "javascript", "python"],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createCodeNode());
          }
        }),
    }),
    new ComponentPickerOption("YouTube", {
      icon: <i className="text-lg">▶</i>,
      keywords: ["youtube", "video", "embed"],
      onSelect: () => {
        console.log("YouTube option selected, dispatching command");
        openYouTubeModal(editor);
      },
    }),
  ];
}

/**
 * スラッシュコマンドメニュープラグイン（Notion風）
 * `/` を入力するとブロックタイプ選択メニューを表示
 */
export default function ComponentPickerMenuPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const options = useMemo(() => {
    const baseOptions = getBaseOptions(editor);

    if (!queryString) {
      return baseOptions;
    }

    const regex = new RegExp(queryString, "i");
    return baseOptions.filter(
      (option) =>
        regex.test(option.title) ||
        option.keywords.some((keyword: string) => regex.test(keyword)),
    );
  }, [editor, queryString]);

  const onSelectOption = useCallback(
    (
      selectedOption: ComponentPickerOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string,
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
        selectedOption.onSelect(matchingString);
        closeMenu();
      });
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (anchorElementRef.current == null || options.length === 0) {
          return null;
        }

        return createPortal(
          <div
            className={styles.typeaheadPopover}
            style={{
              position: "absolute",
              zIndex: 1000,
            }}
          >
            <ul>
              {options.map((option, i: number) => (
                <li
                  key={option.key}
                  tabIndex={-1}
                  className={selectedIndex === i ? styles.selected : ""}
                  ref={option.setRefElement}
                  role="option"
                  aria-selected={selectedIndex === i}
                  id={"typeahead-item-" + i}
                  onMouseEnter={() => {
                    setHighlightedIndex(i);
                  }}
                  onClick={() => {
                    setHighlightedIndex(i);
                    selectOptionAndCleanUp(option);
                  }}
                >
                  <span className={styles.icon}>{option.icon}</span>
                  <span className={styles.text}>{option.title}</span>
                </li>
              ))}
            </ul>
          </div>,
          anchorElementRef.current,
        );
      }}
    />
  );
}

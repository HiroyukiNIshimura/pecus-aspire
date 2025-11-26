/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

"use client";

import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { CAN_USE_DOM } from "@lexical/utils";
import { useEffect, useState } from "react";
import { useSettings } from "./context/SettingsContext";
import CodeActionMenuPlugin from "./plugins/CodeActionMenuPlugin";
import CodeHighlightPrismPlugin from "./plugins/CodeHighlightPrismPlugin";
import CodeHighlightShikiPlugin from "./plugins/CodeHighlightShikiPlugin";
import CollapsiblePlugin from "./plugins/CollapsiblePlugin";
import EquationsPlugin from "./plugins/EquationsPlugin";
import FigmaPlugin from "./plugins/FigmaPlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import { LayoutPlugin } from "./plugins/LayoutPlugin/LayoutPlugin";
import LinkPlugin from "./plugins/LinkPlugin";
import PageBreakPlugin from "./plugins/PageBreakPlugin";
import SpecialTextPlugin from "./plugins/SpecialTextPlugin";
import TabFocusPlugin from "./plugins/TabFocusPlugin";
import TableCellResizer from "./plugins/TableCellResizer";
import TableOfContentsPlugin from "./plugins/TableOfContentsPlugin";
import TwitterPlugin from "./plugins/TwitterPlugin";
import YouTubePlugin from "./plugins/YouTubePlugin";

export default function Viewer() {
  const {
    settings: {
      isCodeHighlighted,
      isCodeShiki,
      hasLinkAttributes,
      hasNestedTables: hasTabHandler,
      showTableOfContents,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      shouldAllowHighlightingWithBrackets,
      listStrictIndent,
    },
  } = useSettings();
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState<boolean>(false);
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  return (
    <div className="editor-container">
      <RichTextPlugin
        contentEditable={
          <div className="editor-scroller">
            <div className="editor" ref={onRef}>
              <ContentEditable />
            </div>
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      {isCodeHighlighted && (isCodeShiki ? <CodeHighlightShikiPlugin /> : <CodeHighlightPrismPlugin />)}
      <ListPlugin hasStrictIndent={listStrictIndent} />
      <CheckListPlugin />
      <TablePlugin
        hasCellMerge={tableCellMerge}
        hasCellBackgroundColor={tableCellBackgroundColor}
        hasHorizontalScroll={tableHorizontalScroll}
        hasTabHandler={hasTabHandler}
      />
      <TableCellResizer />
      <ImagesPlugin />
      <LinkPlugin hasLinkAttributes={hasLinkAttributes} />
      <TwitterPlugin />
      <YouTubePlugin />
      <FigmaPlugin />
      <ClickableLinkPlugin disabled={false} />
      <HorizontalRulePlugin />
      <EquationsPlugin />
      <TabFocusPlugin />
      <TabIndentationPlugin maxIndent={7} />
      <CollapsiblePlugin />
      <PageBreakPlugin />
      <LayoutPlugin />
      {floatingAnchorElem && <CodeActionMenuPlugin anchorElem={floatingAnchorElem} showOnlyCopy={true} />}
      <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
      {shouldAllowHighlightingWithBrackets && <SpecialTextPlugin />}
    </div>
  );
}

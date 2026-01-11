/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export const DEFAULT_SETTINGS = {
  autoFocus: true,
  codeShikiTheme: 'github-light',
  disableBeforeInput: false,
  emptyEditor: false,
  hasLinkAttributes: false,
  hasNestedTables: false,
  isAutocomplete: true,
  isCharLimit: false,
  isCharLimitUtf8: false,
  isCodeHighlighted: true,
  isCodeShiki: false,
  isMaxLength: false,
  listStrictIndent: false,
  measureTypingPerf: true,
  selectionAlwaysOnDisplay: false,
  shouldAllowHighlightingWithBrackets: false,
  shouldPreserveNewLinesInMarkdown: false,
  shouldUseLexicalContextMenu: false,
  showNestedEditorTreeView: false,
  showTableOfContents: false,
  showTreeView: true,
  showToolbar: true,
  tableCellBackgroundColor: true,
  tableCellMerge: true,
  tableHorizontalScroll: true,
} as const;

export type SettingName = keyof typeof DEFAULT_SETTINGS;

// Mutable version of DEFAULT_SETTINGS type for runtime use
export type Settings = {
  -readonly [K in keyof typeof DEFAULT_SETTINGS]: (typeof DEFAULT_SETTINGS)[K] extends boolean
    ? boolean
    : (typeof DEFAULT_SETTINGS)[K] extends string
      ? string
      : (typeof DEFAULT_SETTINGS)[K];
};

export type SettingValue<K extends SettingName> = Settings[K];

// These are mutated in setupEnv
export const INITIAL_SETTINGS: Settings = {
  ...DEFAULT_SETTINGS,
};

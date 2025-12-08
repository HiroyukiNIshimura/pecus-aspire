/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AutoLinkPlugin, createLinkMatcherWithRegExp } from '@lexical/react/LexicalAutoLinkPlugin';
import type { JSX } from 'react';
import { useMemo } from 'react';
import { useEditorContext } from '../../context/SettingsContext';

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))((localhost(:\d+)?)|[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

/**
 * アイテムコードの正規表現
 * - # + 1-9で始まる数字（先頭ゼロは除外）
 * - 数字の後は空白文字または文字列末尾が必要
 * - URLパス内（/や=の後）の#にはマッチしない（無限ループ防止）
 *
 * 例:
 * - #36 → マッチ（後ろにスペースまたは末尾）
 * - #1 → マッチ
 * - #36abc → マッチしない（後ろに文字）
 * - #036 → マッチしない（先頭ゼロ）
 * - #0 → マッチしない（0のみ）
 * - /path#36, ?itemCode=36 → マッチしない
 */
const ITEM_CODE_REGEX = /(?<![/=])#[1-9][0-9]*(?=\s|$)/;

const BASE_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith('http') ? text : `https://${text}`;
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  }),
];

export default function LexicalAutoLinkPlugin(): JSX.Element {
  const { baseUrl, workspaceId } = useEditorContext();

  const matchers = useMemo(() => {
    if (!baseUrl || !workspaceId) {
      return BASE_MATCHERS;
    }

    const itemCodeMatcher = createLinkMatcherWithRegExp(ITEM_CODE_REGEX, (text) => {
      const itemCode = text.replace('#', '');
      return `${baseUrl}/workspaces/${workspaceId}?itemCode=${itemCode}`;
    });

    return [...BASE_MATCHERS, itemCodeMatcher];
  }, [baseUrl, workspaceId]);

  return <AutoLinkPlugin matchers={matchers} />;
}

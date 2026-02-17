/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

//import { $isCodeNode } from '@lexical/code';
import { AutoLinkPlugin, createLinkMatcherWithRegExp } from '@lexical/react/LexicalAutoLinkPlugin';
import type { JSX } from 'react';
import { useMemo } from 'react';
import { useCustomLinkMatchers } from '../../context/AutoLinkContext';

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))((localhost(:\d+)?)|[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const BASE_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith('http') ? text : `https://${text}`;
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  }),
];

//const EXCLUDE_PARENTS = [$isCodeNode];

export default function LexicalAutoLinkPlugin(): JSX.Element {
  const customMatchers = useCustomLinkMatchers();

  const matchers = useMemo(() => {
    if (customMatchers.length === 0) {
      return BASE_MATCHERS;
    }
    return [...BASE_MATCHERS, ...customMatchers];
  }, [customMatchers]);

  //TODO exclude code nodes and other nodes that should not be auto-linked
  return <AutoLinkPlugin matchers={matchers} />;
}

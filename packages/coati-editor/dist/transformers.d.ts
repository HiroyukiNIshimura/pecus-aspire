import { TextMatchTransformer, ElementTransformer, Transformer } from '@lexical/markdown';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

declare const HR: ElementTransformer;
declare const IMAGE: TextMatchTransformer;
declare const EMOJI: TextMatchTransformer;
declare const EQUATION: TextMatchTransformer;
declare const TWEET: ElementTransformer;
declare const TABLE: ElementTransformer;
declare const PLAYGROUND_TRANSFORMERS: Array<Transformer>;

export { EMOJI, EQUATION, HR, IMAGE, PLAYGROUND_TRANSFORMERS, TABLE, TWEET };

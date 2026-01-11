/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useDebouncedCallback } from 'use-debounce';

export function useDebounce<T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T, ms: number, maxWait?: number) {
  return useDebouncedCallback(fn, ms, { maxWait });
}

/**
 * ComponentPickerContext
 *
 * ComponentPickerPluginに追加オプションを提供するためのContext
 */
'use client';

import type { LexicalEditor } from 'lexical';
import { createContext, useContext, type ReactNode, type JSX } from 'react';

export interface ComponentPickerOptionConfig {
  title: string;
  icon?: JSX.Element;
  keywords?: Array<string>;
  keyboardShortcut?: string;
  onSelect: (queryString: string) => void;
}

export type ExtraOptionsProvider = (editor: LexicalEditor) => ComponentPickerOptionConfig[];

interface ComponentPickerContextValue {
  extraOptions?: ExtraOptionsProvider;
}

const ComponentPickerContext = createContext<ComponentPickerContextValue>({});

export function ComponentPickerProvider({
  children,
  extraOptions,
}: {
  children: ReactNode;
  extraOptions?: ExtraOptionsProvider;
}) {
  return <ComponentPickerContext.Provider value={{ extraOptions }}>{children}</ComponentPickerContext.Provider>;
}

export function useComponentPickerContext() {
  return useContext(ComponentPickerContext);
}

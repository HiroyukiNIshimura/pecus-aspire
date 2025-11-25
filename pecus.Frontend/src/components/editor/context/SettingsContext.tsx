/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SettingName, EditorContextSettings } from "../appSettings";
import type { JSX } from "react";

import * as React from "react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_SETTINGS,
  INITIAL_SETTINGS,
  DEFAULT_EDITOR_CONTEXT_SETTINGS,
} from "../appSettings";

type SettingsContextShape = {
  setOption: (name: SettingName, value: boolean) => void;
  settings: Record<SettingName, boolean>;
  /** エディタコンテキスト設定（画像アップロード用の workspaceId/itemId 等） */
  editorContext: EditorContextSettings;
};

const Context: React.Context<SettingsContextShape> = createContext({
  setOption: (name: SettingName, value: boolean) => {
    return;
  },
  settings: INITIAL_SETTINGS,
  editorContext: DEFAULT_EDITOR_CONTEXT_SETTINGS,
});

export const SettingsContext = ({
  children,
  initialSettings,
  editorContext,
}: {
  children: ReactNode;
  initialSettings?: Partial<Record<SettingName, boolean>>;
  editorContext?: EditorContextSettings;
}): JSX.Element => {
  const [settings, setSettings] = useState(() => ({
    ...INITIAL_SETTINGS,
    ...initialSettings,
  }));

  const editorContextValue = useMemo(
    () => ({
      ...DEFAULT_EDITOR_CONTEXT_SETTINGS,
      ...editorContext,
    }),
    [editorContext],
  );

  const setOption = useCallback((setting: SettingName, value: boolean) => {
    setSettings((options) => ({
      ...options,
      [setting]: value,
    }));
    setURLParam(setting, value);
  }, []);

  const contextValue = useMemo(() => {
    return { setOption, settings, editorContext: editorContextValue };
  }, [setOption, settings, editorContextValue]);

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export const useSettings = (): SettingsContextShape => {
  return useContext(Context);
};

/**
 * エディタコンテキスト設定を取得するフック（画像アップロード用）
 */
export const useEditorContext = (): EditorContextSettings => {
  const { editorContext } = useContext(Context);
  return editorContext;
};

function setURLParam(param: SettingName, value: null | boolean) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  if (value !== DEFAULT_SETTINGS[param]) {
    params.set(param, String(value));
  } else {
    params.delete(param);
  }
  url.search = params.toString();
  window.history.pushState(null, "", url.toString());
}

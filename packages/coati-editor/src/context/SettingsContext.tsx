/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type * as React from 'react';
import type { JSX } from 'react';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { SettingName, Settings, SettingValue } from '../core/appSettings';

import { DEFAULT_SETTINGS, INITIAL_SETTINGS } from '../core/appSettings';

type SettingsContextShape = {
  setOption: <K extends SettingName>(name: K, value: SettingValue<K>) => void;
  settings: Settings;
};

const Context: React.Context<SettingsContextShape> = createContext<SettingsContextShape>({
  setOption: <K extends SettingName>(_name: K, _value: SettingValue<K>) => {
    return;
  },
  settings: INITIAL_SETTINGS,
});

export const SettingsContext = ({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings?: Partial<Settings>;
}): JSX.Element => {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...INITIAL_SETTINGS,
    ...initialSettings,
  }));

  const setOption = useCallback(<K extends SettingName>(setting: K, value: SettingValue<K>) => {
    setSettings((options) => ({
      ...options,
      [setting]: value,
    }));
    setURLParam(setting, value);
  }, []);

  const contextValue = useMemo(() => {
    return { setOption, settings };
  }, [setOption, settings]);

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export const useSettings = (): SettingsContextShape => {
  return useContext(Context);
};

function setURLParam<K extends SettingName>(param: K, value: SettingValue<K> | null) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  if (value !== DEFAULT_SETTINGS[param]) {
    params.set(param, String(value));
  } else {
    params.delete(param);
  }
  url.search = params.toString();
  window.history.pushState(null, '', url.toString());
}

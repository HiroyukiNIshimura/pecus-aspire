import { useEffect, useState } from 'react';

type ThemeType = 'light' | 'dark' | 'auto';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeType>('auto');
  const [mounted, setMounted] = useState(false);
  // 実際に適用されているテーマ（auto の場合はシステム設定を反映）
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const getResolvedTheme = (selectedTheme: ThemeType): 'light' | 'dark' => {
    if (selectedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return selectedTheme;
  };

  const applyTheme = (selectedTheme: ThemeType) => {
    const html = document.documentElement;
    const resolved = getResolvedTheme(selectedTheme);
    html.setAttribute('data-theme', resolved);
    setResolvedTheme(resolved);
  };

  // マウント時に localStorage から復元
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as ThemeType | null;
    if (storedTheme && ['light', 'dark', 'auto'].includes(storedTheme)) {
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } else {
      // デフォルトは auto
      setTheme('auto');
      applyTheme('auto');
    }
    setMounted(true);
  }, []);

  // システム設定の変更を監視（auto モードの場合）
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      applyTheme('auto');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const changeTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const currentTheme = (): 'light' | 'dark' => {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    return current as 'light' | 'dark';
  };

  return { theme, changeTheme, mounted, currentTheme, resolvedTheme };
}

import { useEffect, useState, useSyncExternalStore } from 'react';

type ThemeType = 'light' | 'dark' | 'auto';

const getDataTheme = (): 'light' | 'dark' => {
  if (typeof document === 'undefined') return 'light';
  const current = document.documentElement.getAttribute('data-theme');
  return current === 'dark' ? 'dark' : 'light';
};

let dataThemeListeners: Array<() => void> = [];

const subscribeToDataTheme = (callback: () => void) => {
  dataThemeListeners.push(callback);
  return () => {
    dataThemeListeners = dataThemeListeners.filter((l) => l !== callback);
  };
};

const notifyDataThemeChange = () => {
  for (const listener of dataThemeListeners) {
    listener();
  }
};

if (typeof window !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        notifyDataThemeChange();
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeType>('auto');
  const [mounted, setMounted] = useState(false);

  const resolvedTheme = useSyncExternalStore(subscribeToDataTheme, getDataTheme, () => 'light' as const);

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
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as ThemeType | null;
    if (storedTheme && ['light', 'dark', 'auto'].includes(storedTheme)) {
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } else {
      setTheme('auto');
      applyTheme('auto');
    }
    setMounted(true);
  }, []);

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

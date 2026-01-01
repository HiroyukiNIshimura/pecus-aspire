'use client';

import { useTheme } from '@/hooks/useTheme';

/**
 * テーマ切り替えドロップダウン (Client Component)
 * useTheme フックでテーマ状態を管理するため Client Component
 */
export default function ThemeToggle() {
  const { theme, changeTheme, mounted, resolvedTheme: _resolvedTheme } = useTheme();

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    changeTheme(newTheme);
    // ドロップダウンを閉じる
    setTimeout(() => {
      const themeDropdown = document.querySelector('.navbar-end > .dropdown:first-of-type') as HTMLElement;
      if (themeDropdown && window.HSDropdown) {
        const instance = window.HSDropdown.getInstance(themeDropdown, true) as {
          element?: { close: () => void };
        } | null;
        if (instance?.element) {
          instance.element.close();
        }
      }
    }, 0);
  };

  if (!mounted) {
    // マウント前は空のプレースホルダーを表示（レイアウトシフト防止）
    return <div className="w-10 h-10" />;
  }

  return (
    <div className="dropdown [--auto-close:inside] [--offset:10] [--placement:bottom-end]">
      <button type="button" className="dropdown-toggle btn btn-text btn-circle">
        {theme === 'light' && <span className="icon-[mdi--white-balance-sunny] size-6" aria-hidden="true" />}
        {theme === 'dark' && <span className="icon-[mdi--moon-and-stars] size-6" aria-hidden="true" />}
        {theme === 'auto' && <span className="icon-[mdi--brightness-auto] size-6" aria-hidden="true" />}
      </button>
      <ul className="dropdown-menu dropdown-open:opacity-100 hidden min-w-32">
        <li>
          <button
            type="button"
            className={`dropdown-item ${theme === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            <span className="icon-[mdi--white-balance-sunny] size-4" aria-hidden="true" />
            ライト
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`dropdown-item ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            <span className="icon-[mdi--moon-and-stars] size-4" aria-hidden="true" />
            ダーク
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`dropdown-item ${theme === 'auto' ? 'active' : ''}`}
            onClick={() => handleThemeChange('auto')}
          >
            <span className="icon-[mdi--brightness-auto] size-4" aria-hidden="true" />
            自動
          </button>
        </li>
      </ul>
    </div>
  );
}

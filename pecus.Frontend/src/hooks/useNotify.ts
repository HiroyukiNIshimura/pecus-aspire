import { Notyf } from 'notyf';
import { useEffect, useRef } from 'react';
import 'notyf/notyf.min.css';

/**
 * Notyf通知を使用するためのカスタムフック
 * FlyonUI のドキュメントに基づいた実装
 * https://flyonui.com/docs/third-party-plugins/notyf/
 */
export function useNotify() {
  const notyfRef = useRef<Notyf | null>(null);

  useEffect(() => {
    // クライアントサイドでのみ初期化
    if (typeof window !== 'undefined' && !notyfRef.current) {
      notyfRef.current = new Notyf({
        duration: 3000,
        position: {
          x: 'right',
          y: 'top',
        },
        types: [
          {
            type: 'success',
            background: 'var(--color-success)',
            icon: {
              className: 'icon-[tabler--check] !text-success',
              tagName: 'span',
            },
          },
          {
            type: 'error',
            background: 'var(--color-error)',
            icon: {
              className: 'icon-[tabler--x] !text-error',
              tagName: 'span',
            },
          },
          {
            type: 'warning',
            background: 'var(--color-warning)',
            icon: {
              className: 'icon-[tabler--alert-triangle] !text-warning',
              tagName: 'span',
            },
          },
          {
            type: 'info',
            background: 'var(--color-info)',
            icon: {
              className: 'icon-[tabler--info-circle] !text-info',
              tagName: 'span',
            },
          },
        ],
      });
    }

    return () => {
      // クリーンアップ
      if (notyfRef.current) {
        notyfRef.current.dismissAll();
      }
    };
  }, []);

  const success = (message: string) => {
    notyfRef.current?.success(message);
  };

  const error = (message: string) => {
    notyfRef.current?.error(message);
  };

  const warning = (message: string) => {
    notyfRef.current?.open({
      type: 'warning',
      message,
    });
  };

  const info = (message: string) => {
    notyfRef.current?.open({
      type: 'info',
      message,
    });
  };

  return {
    success,
    error,
    warning,
    info,
  };
}

import { Notyf } from 'notyf';
import { useEffect, useRef } from 'react';

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
        dismissible: true,
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

  /**
   * エラー通知を表示
   * @param message エラーメッセージ
   * @param persistent true の場合、クリックするまで表示し続ける（デフォルト: false）
   */
  const error = (message: string, persistent = false) => {
    if (persistent) {
      notyfRef.current?.open({
        type: 'error',
        message,
        duration: 0, // 手動で閉じるまで表示
        dismissible: true,
      });
    } else {
      notyfRef.current?.error(message);
    }
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchNotificationCount } from '@/actions/agenda';
import AgendaNotificationPopup from './AgendaNotificationPopup';

/**
 * ヘッダーのアジェンダアイコンボタン
 * 未読通知・未回答招待をバッジで表示し、クリックで通知ポップアップを表示
 */
export default function AgendaIconButton() {
  const [totalCount, setTotalCount] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const loadCount = useCallback(async () => {
    const result = await fetchNotificationCount();
    if (result.success) {
      // 未読通知数 + 未回答招待数の合計を表示
      setTotalCount(result.data.total ?? 0);
    }
  }, []);

  useEffect(() => {
    loadCount();

    // 1分ごとに更新
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, [loadCount]);

  const handleClick = () => {
    if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect());
    }
    setIsPopupOpen(true);
  };

  const handleClose = () => {
    setIsPopupOpen(false);
  };

  const handleCountChange = () => {
    // 通知の既読などで件数が変わった場合に再取得
    loadCount();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="btn btn-text btn-circle relative"
        aria-label="予定"
        aria-haspopup="dialog"
        aria-expanded={isPopupOpen}
      >
        <span className="icon-[tabler--calendar-event] size-6" aria-hidden="true" />
        {totalCount > 0 && (
          <span className="badge badge-error badge-xs absolute -top-1 -right-1 min-w-4 px-1">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      <AgendaNotificationPopup
        isOpen={isPopupOpen}
        onClose={handleClose}
        anchorRect={anchorRect}
        onCountChange={handleCountChange}
      />
    </>
  );
}

'use client';

interface MobileMenuButtonProps {
  onToggleSidebar: () => void;
}

/**
 * モバイル用ハンバーガーメニューボタン (Client Component)
 * onClick ハンドラーがあるため Client Component
 */
export default function MobileMenuButton({ onToggleSidebar }: MobileMenuButtonProps) {
  return (
    <div className="md:hidden">
      <button type="button" className="p-2" onClick={onToggleSidebar} title="メニューを開く">
        <span className="icon-[mdi--menu] size-5" aria-hidden="true" />
      </button>
    </div>
  );
}

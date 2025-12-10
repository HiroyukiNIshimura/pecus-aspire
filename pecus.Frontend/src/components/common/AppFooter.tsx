/**
 * アプリケーション共通フッター
 *
 * すべてのダッシュボードページで使用される共通フッターコンポーネント。
 * layout.tsxで一元的に配置し、個別ページでの配置は不要。
 */
export default function AppFooter() {
  return (
    <footer className="bg-base-200 text-base-content p-4 text-center">
      <p>&copy; 2025 Pecus. All rights reserved.</p>
    </footer>
  );
}

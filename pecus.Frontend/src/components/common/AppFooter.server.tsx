/**
 * アプリケーション共通フッター
 *
 * すべてのダッシュボードページで使用される共通フッターコンポーネント。
 * layout.tsxで一元的に配置し、個別ページでの配置は不要。
 */
export default function AppFooter() {
  return (
    //デザイン中フッターが表示されていないのに気がつかない時があるので背景色をつけて目立たせる
    <footer className="footer footer-center bg-base-200/60 px-6 py-4">
      <p>&copy; 2025 Pecus. All rights reserved.</p>
    </footer>
  );
}

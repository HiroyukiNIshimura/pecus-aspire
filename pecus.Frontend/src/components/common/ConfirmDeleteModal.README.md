# ConfirmDeleteModal

共通で使える削除確認用のモーダルダイアログコンポーネントです。FlyonUIのモーダルダイアログを使用しています。

## 機能

- 削除確認ダイアログの表示
- カスタマイズ可能なタイトル、メッセージ、ボタンテキスト
- 確認/キャンセル時のコールバック関数
- FlyonUIのアクセシビリティ機能対応

## Props

| プロパティ | 型 | デフォルト値 | 説明 |
|-----------|-----|-------------|------|
| `title` | `string` | `"削除の確認"` | モーダルのタイトル |
| `message` | `string` | `"このアイテムを削除してもよろしいですか？"` | 確認メッセージ |
| `confirmText` | `string` | `"削除"` | 確認ボタンのテキスト |
| `cancelText` | `string` | `"キャンセル"` | キャンセルボタンのテキスト |
| `onConfirm` | `() => void` | **必須** | 確認時のコールバック関数 |
| `onCancel` | `() => void` | - | キャンセル時のコールバック関数 |

## 使用方法

```tsx
import { useRef } from 'react';
import ConfirmDeleteModal, { ConfirmDeleteModalRef } from '@/components/common/ConfirmDeleteModal';

function MyComponent() {
  const modalRef = useRef<ConfirmDeleteModalRef>(null);

  const handleDelete = async () => {
    try {
      // 削除API呼び出し
      await deleteItem(itemId);
      // 成功時の処理
      console.log('削除成功');
    } catch (error) {
      console.error('削除失敗', error);
    }
  };

  return (
    <div>
      {/* 削除ボタン */}
      <button
        type="button"
        className="btn btn-error"
        onClick={() => modalRef.current?.open()}
      >
        削除
      </button>

      {/* モーダル */}
      <ConfirmDeleteModal
        ref={modalRef}
        title="アイテムの削除"
        message="このアイテムを削除すると、元に戻すことはできません。本当に削除しますか？"
        confirmText="削除する"
        cancelText="キャンセル"
        onConfirm={handleDelete}
      />
    </div>
  );
}
```

## メソッド

コンポーネントのref経由で以下のメソッドを呼び出せます：

- `open()`: モーダルを開く
- `close()`: モーダルを閉じる

## スタイリング

FlyonUIのモーダルクラスを使用しています：

- `.overlay`: オーバーレイ
- `.modal`: モーダルコンテナ
- `.modal-dialog`: ダイアログコンテナ
- `.modal-content`: コンテンツ
- `.modal-header`: ヘッダー
- `.modal-title`: タイトル
- `.modal-body`: ボディ
- `.modal-footer`: フッター

## 注意事項

- クライアントサイドでのみ動作します（`"use client"` ディレクティブ必須）
- FlyonUIのJavaScriptライブラリが必要です
- プログラム的にモーダルを制御する場合はrefを使用してください
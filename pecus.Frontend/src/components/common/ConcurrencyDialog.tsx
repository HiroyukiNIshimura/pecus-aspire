"use client";

import type { ConflictLatestData } from "@/connectors/api/ConflictDataTypes.generated";

/**
 * ConcurrencyDialog コンポーネントのプロパティ
 *
 * Server Action からの 409 Conflict レスポンスをハンドリングし、
 * ユーザーに [再試行] / [キャンセル] の選択肢を提示します。
 */
interface ConcurrencyDialogProps {
  /**
   * ユーザーに表示するエラーメッセージ
   * Server Action の ConcurrencyError.message から渡される
   */
  message: string;

  /**
   * 最新の DB データ（discriminator 型で型安全）
   * - type フィールドで各エンティティ型を判別可能
   * - data フィールドにエンティティの最新データが含まれる
   *
   * @example
   * latest = {
   *   type: 'workspace',
   *   data: { id: 1, name: 'Updated Workspace Name', ... }
   * }
   */
  latest?: ConflictLatestData;

  /**
   * [再試行] ボタンクリック時のコールバック
   * 通常: ページリロード、または最新データで再度操作を実行
   * latest データを使ったマージ処理などもここで可能
   */
  onRetry: () => void;

  /**
   * [キャンセル] ボタンクリック時のコールバック
   * 通常: 編集内容を破棄して一覧へ戻る、またはモーダルを閉じる
   */
  onCancel: () => void;
}

/**
 * 競合エラー表示ダイアログコンポーネント
 *
 * 楽観ロック（RowVersion による DB 競合）が発生した際に表示するモーダルダイアログです。
 * Server Action から返される error: "conflict" レスポンスをハンドリングします。
 *
 * @param props - コンポーネントプロパティ
 * @returns JSX 要素
 *
 * @example
 * <ConcurrencyDialog
 *   message="別のユーザーにより変更されました。"
 *   latest={{ type: 'workspace', data: { id: 1, name: 'Updated' } }}
 *   onRetry={() => window.location.reload()}
 *   onCancel={() => window.history.back()}
 * />
 */
export function ConcurrencyDialog({ message, latest, onRetry, onCancel }: ConcurrencyDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded shadow-lg max-w-lg w-full p-6">
        {/* ヘッダー */}
        <h3 className="text-lg font-semibold mb-2">競合が発生しました</h3>

        {/* エラーメッセージ */}
        <p className="mb-4 text-gray-700">{message}</p>

        {/* 説明文 */}
        <p className="mb-4 text-sm text-gray-600">
          別のユーザーが変更した可能性があります。最新データを取得して再度試してください。
        </p>

        {/*
          NOTE: latest データの表示は今後検討

          type ガード関数を使った安全なケース分岐例：

          ```typescript
          if (latest && assertConflictLatestDataType(latest, 'workspace')) {
            // latest.data は WorkspaceResponse 型に絞られている
            console.log(latest.data.name);
          }
          ```

          表示方法の候補：
          1. JSON 表示（開発者向けデバッグ）
          2. エンティティ型ごとにカスタマイズ
             - Workspace: name, code などの重要フィールド表示
             - Tag, Skill: name 表示
             - User: username, email 表示
          3. diff 表示（操作前データとの差分）
          4. 何も表示しない（現在の実装）

          onRetry 時に latest データを活用するロジック：
          - latest から新しい rowVersion を取得して再度 Server Action 実行
          - マージアルゴリズムでユーザーの変更と最新データをマージ
          - ページリロードして自動的に最新データを取得
        */}

        {/* DEBUG: latest データの内容確認用 */}
        {latest && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-gray-600">
            <p className="font-semibold mb-1">最新データ情報</p>
            <p>タイプ: {latest.type}</p>
            {/* 詳細表示は今後実装予定 */}
          </div>
        )}

        {/* ボタングループ */}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            キャンセル
          </button>
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            再試行
          </button>
        </div>
      </div>
    </div>
  );
}

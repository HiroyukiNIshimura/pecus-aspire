"use client";

import { useState } from "react";
import { PecusEditor } from "./PecusEditor";

/**
 * PecusEditor の使用例
 */
export function PecusEditorExample() {
  const [content, setContent] = useState<string>("");
  const [savedContent, setSavedContent] = useState<string>("");

  const handleSave = () => {
    setSavedContent(content);
    alert("保存しました！");
  };

  const handleLoad = () => {
    setContent(savedContent);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="prose max-w-none">
        <h1>Pecus Editor - Notion風エディタ</h1>
        <p>
          Lexicalベースのリッチテキストエディタです。以下の機能をサポートしています：
        </p>
        <ul>
          <li>太字、イタリック、下線、取り消し線</li>
          <li>コードフォーマット</li>
          <li>元に戻す / やり直し</li>
          <li>見出し、リスト、引用（今後実装予定）</li>
        </ul>
      </div>

      {/* エディタ */}
      <div className="border-2 border-primary/20 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">編集エリア</h2>
        <PecusEditor
          placeholder="ここに入力してください..."
          onChange={setContent}
          initialContent={content}
        />
      </div>

      {/* コントロールボタン */}
      <div className="flex gap-4">
        <button type="button" onClick={handleSave} className="btn btn-primary">
          保存
        </button>
        <button
          type="button"
          onClick={handleLoad}
          className="btn btn-secondary"
          disabled={!savedContent}
        >
          読み込み
        </button>
      </div>

      {/* プレビュー */}
      <div className="border-2 border-base-content/20 rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">JSON プレビュー</h2>
        <pre className="bg-base-200 p-4 rounded-lg overflow-x-auto text-sm">
          {content || "（まだコンテンツがありません）"}
        </pre>
      </div>

      {/* 読み取り専用プレビュー */}
      {savedContent && (
        <div className="border-2 border-success/20 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">
            保存済みコンテンツ（読み取り専用）
          </h2>
          <PecusEditor
            initialContent={savedContent}
            readOnly={true}
            className="bg-base-200"
          />
        </div>
      )}
    </div>
  );
}

export default PecusEditorExample;

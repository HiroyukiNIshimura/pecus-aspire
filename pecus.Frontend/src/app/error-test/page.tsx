"use client";

import { useState } from "react";
import NotFoundPage from "../404";
import ServerErrorPage from "../500";
import GatewayErrorPage from "../502";

type ErrorType = "404" | "500" | "502";

export default function ErrorTestPage() {
  const [selectedError, setSelectedError] = useState<ErrorType>("404");

  const renderErrorPage = () => {
    switch (selectedError) {
      case "404":
        return <NotFoundPage />;
      case "500":
        return <ServerErrorPage />;
      case "502":
        return <GatewayErrorPage />;
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* コントロールパネル */}
      <div className="sticky top-0 z-50 bg-base-100 border-b border-base-300 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">エラーページテスト</h1>
              <p className="text-sm text-gray-500 mt-1">
                下記からエラータイプを選択してプレビューを確認できます
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(["404", "500", "502"] as const).map((errorType) => (
                <button
                  key={errorType}
                  onClick={() => setSelectedError(errorType)}
                  className={`btn btn-sm ${
                    selectedError === errorType ? "btn-primary" : "btn-outline"
                  }`}
                >
                  {errorType} エラー
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* エラーページプレビュー */}
      <div className="min-h-[calc(100vh-120px)]">{renderErrorPage()}</div>

      {/* フッター情報 */}
      <div className="bg-base-100 border-t border-base-300 py-4 px-4">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>
            現在表示中:{" "}
            <span className="font-bold text-primary">
              {selectedError} エラーページ
            </span>
          </p>
          <p className="mt-2">
            ✅ このページはテスト用です。本番環境では存在しません。
          </p>
        </div>
      </div>
    </div>
  );
}

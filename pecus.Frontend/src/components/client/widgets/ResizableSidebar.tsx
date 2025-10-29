"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NotionEditor from "./editor";
import TreeView from "./treeView";

// ペイン幅の最小・最大値を定義
const MIN_WIDTH = 200;
const MAX_WIDTH = 500;
const INITIAL_WIDTH = 250;

export default function ResizableSidebar() {

  // サイドバーの現在の幅 (px)
  const [sidebarWidth, setSidebarWidth] = useState(INITIAL_WIDTH);
  // ドラッグ中かどうかを示すフラグ
  const isDragging = useRef(false);

  // マウスダウン（ドラッグ開始）時のイベントハンドラ
  const handleMouseDown = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    isDragging.current = true;
  };

  // マウスムーブ（ドラッグ中）時のイベントハンドラ
  // useCallbackでメモ化し、useEffectの依存配列から除外
  const handleMouseMove = useCallback((e: { clientX: number }) => {
    if (!isDragging.current) return;

    // マウスのX座標が新しいサイドバーの幅となる
    let newWidth = e.clientX;

    // 最小・最大幅の制限
    if (newWidth < MIN_WIDTH) {
      newWidth = MIN_WIDTH;
    } else if (newWidth > MAX_WIDTH) {
      newWidth = MAX_WIDTH;
    }

    setSidebarWidth(newWidth);
  }, []);

  // マウスアップ（ドラッグ終了）時のイベントハンドラ
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // グローバルなマウスイベントリスナーの設定
  useEffect(() => {
    // ドラッグ中はドキュメント全体で移動と終了を監視
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // クリーンアップ関数
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 1. 左メニューペイン (Sidebar) */}
      <div
        style={{ width: `${sidebarWidth}px` }}
        className="flex-shrink-0 transition-colors duration-100 ease-in-out"
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">左メニュー</h2>
          <TreeView />
        </div>
      </div>

      {/* 2. ドラッグハンドル (Resizer) */}
      {/* onMouseDownでドラッグを開始 */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 bg-gray-600 hover:bg-indigo-500 cursor-col-resize flex-shrink-0"
        title="幅を変更"
      ></div>

      {/* 3. メインコンテンツペイン (Main Content) */}
      {/* flex-growで残りのスペース全体を占める */}
      <div className="flex-grow p-8 overflow-auto">
        <h1 className="text-2xl font-bold mb-4">メインコンテンツエリア</h1>
        <NotionEditor />
      </div>
    </div>
  );
}

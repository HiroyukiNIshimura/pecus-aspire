'use client';

import { createContext, type ReactNode, useContext, useMemo } from 'react';

/**
 * 画像アップロード結果
 */
export interface ImageUploadResult {
  /** 画像のURL（表示用） */
  url: string;
  /** 画像の幅（取得できた場合） */
  width?: number;
  /** 画像の高さ（取得できた場合） */
  height?: number;
}

/**
 * 画像アップロードハンドラーの型
 */
export interface ImageUploadHandler {
  /**
   * 画像ファイルをアップロードする
   * @param file - アップロードするファイル
   * @returns アップロード結果（URL等）
   * @throws アップロード失敗時はエラーをスロー
   */
  uploadImage: (file: File) => Promise<ImageUploadResult>;
}

/**
 * 画像アップロードコンテキストの値
 */
interface ImageUploadContextValue {
  handler: ImageUploadHandler | null;
}

const ImageUploadContext = createContext<ImageUploadContextValue>({
  handler: null,
});

/**
 * 画像アップロードハンドラーを取得するフック
 * @returns ハンドラー（未設定の場合はnull）
 */
export function useImageUpload(): ImageUploadHandler | null {
  const context = useContext(ImageUploadContext);
  return context.handler;
}

/**
 * 画像アップロードコンテキストのプロバイダー
 */
interface ImageUploadProviderProps {
  children: ReactNode;
  handler: ImageUploadHandler | null;
}

export function ImageUploadProvider({ children, handler }: ImageUploadProviderProps) {
  const value = useMemo(() => ({ handler }), [handler]);
  return <ImageUploadContext.Provider value={value}>{children}</ImageUploadContext.Provider>;
}

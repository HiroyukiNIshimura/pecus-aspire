/**
 * 画像アップロードの結果
 */
export type ImageUploadResult = {
	/** アップロードされた画像のURL */
	url: string;
	/** サーバー側で割り当てられたID（オプション） */
	id?: string;
};

/**
 * 画像アップロード関数の型
 *
 * エディタ内で画像を挿入する際に呼び出されます。
 * 実装側で適切なAPIエンドポイントにアップロードし、結果を返してください。
 *
 * @example
 * ```typescript
 * const imageUploader: ImageUploader = async (file) => {
 *   const formData = new FormData();
 *   formData.append('file', file);
 *   const response = await fetch('/api/upload', { method: 'POST', body: formData });
 *   const data = await response.json();
 *   return { url: data.url, id: data.id };
 * };
 * ```
 */
export type ImageUploader = (file: File) => Promise<ImageUploadResult>;

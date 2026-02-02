'use server';

import { createAuthenticatedAxios, createPecusApiClients } from '@/connectors/api/PecusApiClient';
import type { WorkspaceItemAttachmentResponse } from '@/connectors/api/pecus';
import { handleApiErrorForAction } from './apiErrorPolicy';
import type { ApiResponse } from './types';

/**
 * アップロード結果の型
 */
export interface UploadAttachmentResult {
  /** プロキシURL（フロントエンド用） */
  url: string;
  /** ファイル名 */
  fileName: string;
  /** 添付ファイルID */
  id: number;
}

/**
 * ファイル名を安全なASCII互換の形式に変換
 * 非ASCII文字（日本語など）を含む場合はタイムスタンプベースの名前を生成
 */
function getSafeFileName(originalName: string): string {
  const lastDotIndex = originalName.lastIndexOf('.');
  const extension = lastDotIndex > 0 ? originalName.slice(lastDotIndex) : '';
  const baseName = lastDotIndex > 0 ? originalName.slice(0, lastDotIndex) : originalName;

  // ASCII文字のみかチェック（制御文字も除外）
  // eslint-disable-next-line no-control-regex
  const isAsciiSafe = /^[\x20-\x7E]+$/.test(baseName);

  if (isAsciiSafe) {
    return baseName.replace(/\s+/g, '_') + extension;
  }

  // 非ASCII文字を含む場合はタイムスタンプベースの名前を生成
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `upload_${timestamp}_${randomSuffix}${extension}`;
}

/**
 * Server Action: ワークスペースアイテムに添付ファイルをアップロード
 *
 * Note: OpenAPI自動生成クライアントの form-data パッケージは
 * Node.js環境でWeb APIのFile/Blobを正しく処理できないため、
 * Axiosを直接使用してFormDataを送信する
 *
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @param formData ファイルを含むFormData
 * @param taskId ワークスペースタスクID（オプション）
 */
export async function uploadWorkspaceItemAttachment(
  workspaceId: number,
  itemId: number,
  formData: FormData,
  taskId?: number,
): Promise<ApiResponse<UploadAttachmentResult>> {
  try {
    const file = formData.get('file') as File | Blob | null;
    const originalFileName = (file instanceof File ? file.name : null) || (formData.get('fileName') as string | null);

    if (!file) {
      return {
        success: false,
        error: 'validation',
        message: 'ファイルが指定されていません。',
      };
    }

    // ファイル名を安全なASCII名に変換（HTTPヘッダーで非ASCII文字はエラーになるため）
    const safeFileName = getSafeFileName(originalFileName || 'upload');

    // 認証済みAxiosインスタンスを作成
    const axios = await createAuthenticatedAxios();

    // Node.js環境用のFormDataを作成
    const FormDataNode = (await import('form-data')).default;
    const nodeFormData = new FormDataNode();

    // BlobまたはFileからArrayBufferを取得してBufferに変換
    // クライアント側で既にArrayBufferに変換されたBlobの場合も、
    // Server Actionsがシリアライズしたデータから再構築されるため問題ない
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ファイルをFormDataに追加（安全なファイル名で送信）
    nodeFormData.append('file', buffer, {
      filename: safeFileName,
      contentType: file.type || 'application/octet-stream',
    });

    // 元のファイル名を別フィールドとして送信（DBに保存される表示用ファイル名）
    nodeFormData.append('OriginalFileName', originalFileName || 'upload');

    // タスクIDが指定されている場合は追加
    if (taskId !== undefined) {
      nodeFormData.append('WorkspaceTaskId', taskId.toString());
    }

    // Axiosで直接POSTリクエスト
    const response = await axios.post(`/api/workspaces/${workspaceId}/items/${itemId}/attachments`, nodeFormData, {
      headers: nodeFormData.getHeaders(),
    });

    // バックエンドの downloadUrl からファイル名を抽出してプロキシURLを生成
    // downloadUrl 形式: /api/workspaces/{workspaceId}/items/{itemId}/attachments/download/{fileName}
    const downloadUrl = response.data.downloadUrl as string | undefined;
    let proxyUrl = '';

    if (downloadUrl) {
      // downloadUrl からファイル名部分を抽出
      const urlParts = downloadUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Next.js API Route のプロキシURLを生成
      proxyUrl = `/api/workspaces/${workspaceId}/items/${itemId}/attachments/${fileName}`;
    }

    return {
      success: true,
      data: {
        url: proxyUrl,
        fileName: response.data.fileName || '',
        id: response.data.id,
      },
    };
  } catch (error) {
    console.error('Failed to upload workspace item attachment:', error);
    return handleApiErrorForAction<UploadAttachmentResult>(error, {
      defaultMessage: '添付ファイルのアップロードに失敗しました。',
      handled: { validation: true },
    });
  }
}

/**
 * Server Action: ワークスペースアイテムの添付ファイル一覧を取得
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @param taskId ワークスペースタスクID（オプション）
 */
export async function fetchWorkspaceItemAttachments(
  workspaceId: number,
  itemId: number,
  taskId?: number,
): Promise<ApiResponse<WorkspaceItemAttachmentResponse[]>> {
  try {
    const api = createPecusApiClients();
    const response = await api.workspaceItem.getApiWorkspacesItemsAttachments(workspaceId, itemId, taskId);
    return { success: true, data: response };
  } catch (error) {
    console.error('Failed to fetch workspace item attachments:', error);
    return handleApiErrorForAction<WorkspaceItemAttachmentResponse[]>(error, {
      defaultMessage: '添付ファイル一覧の取得に失敗しました。',
      handled: { not_found: true },
    });
  }
}

/**
 * Server Action: 添付ファイルを削除
 * @param workspaceId ワークスペースID
 * @param itemId アイテムID
 * @param attachmentId 添付ファイルID
 */
export async function deleteWorkspaceItemAttachment(
  workspaceId: number,
  itemId: number,
  attachmentId: number,
): Promise<ApiResponse<void>> {
  try {
    const api = createPecusApiClients();
    await api.workspaceItem.deleteApiWorkspacesItemsAttachments(workspaceId, itemId, attachmentId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete workspace item attachment:', error);
    return handleApiErrorForAction<void>(error, {
      defaultMessage: '添付ファイルの削除に失敗しました。',
      handled: { validation: true, not_found: true },
    });
  }
}

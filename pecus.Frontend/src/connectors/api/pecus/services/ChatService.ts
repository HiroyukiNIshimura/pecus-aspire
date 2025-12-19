/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessageItem } from '../models/ChatMessageItem';
import type { ChatMessagesResponse } from '../models/ChatMessagesResponse';
import type { ChatRoomDetailResponse } from '../models/ChatRoomDetailResponse';
import type { ChatRoomItem } from '../models/ChatRoomItem';
import type { ChatRoomType } from '../models/ChatRoomType';
import type { ChatUnreadCountByCategoryResponse } from '../models/ChatUnreadCountByCategoryResponse';
import type { ChatUnreadCountResponse } from '../models/ChatUnreadCountResponse';
import type { CreateDmRoomRequest } from '../models/CreateDmRoomRequest';
import type { SendMessageRequest } from '../models/SendMessageRequest';
import type { UpdateNotificationSettingRequest } from '../models/UpdateNotificationSettingRequest';
import type { UpdateReadPositionRequest } from '../models/UpdateReadPositionRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChatService {
    /**
     * 参加しているルーム一覧を取得
     * @param type ルームタイプでフィルタ（省略時は全タイプ）
     * @returns ChatRoomItem OK
     * @throws ApiError
     */
    public static getApiChatRooms(
        type?: ChatRoomType,
    ): CancelablePromise<Array<ChatRoomItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms',
            query: {
                'type': type,
            },
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ルーム詳細を取得
     * @param roomId ルームID
     * @returns ChatRoomDetailResponse OK
     * @throws ApiError
     */
    public static getApiChatRooms1(
        roomId: number,
    ): CancelablePromise<ChatRoomDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/{roomId}',
            path: {
                'roomId': roomId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * DM ルームを作成または取得
     * @param requestBody DM ルーム作成リクエスト
     * @returns ChatRoomDetailResponse OK
     * @throws ApiError
     */
    public static postApiChatRoomsDm(
        requestBody: CreateDmRoomRequest,
    ): CancelablePromise<ChatRoomDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/dm',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * AI ルームを作成または取得
     * @returns ChatRoomDetailResponse OK
     * @throws ApiError
     */
    public static postApiChatRoomsAi(): CancelablePromise<ChatRoomDetailResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/ai',
            errors: {
                400: `Bad Request`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * グループルームを取得（組織単位のグループチャット）
     * 組織設定の GroupChatScope が Organization の場合のみ利用可能。
     * Workspace の場合は 404 を返す。
     * @returns ChatRoomDetailResponse OK
     * @throws ApiError
     */
    public static getApiChatRoomsGroup(): CancelablePromise<ChatRoomDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/group',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * システムルームを取得
     * @returns ChatRoomDetailResponse OK
     * @throws ApiError
     */
    public static getApiChatRoomsSystem(): CancelablePromise<ChatRoomDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/system',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * ワークスペースのグループルームを取得
     * 組織設定の GroupChatScope が Workspace（デフォルト）の場合のみ利用可能。
     * Organization の場合は 404 を返す。
     * @param workspaceId ワークスペースID
     * @returns ChatRoomDetailResponse OK
     * @throws ApiError
     */
    public static getApiChatRoomsWorkspaceGroup(
        workspaceId: number,
    ): CancelablePromise<ChatRoomDetailResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/workspace/{workspaceId}/group',
            path: {
                'workspaceId': workspaceId,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 通知設定を更新
     * @param roomId ルームID
     * @param requestBody 通知設定更新リクエスト
     * @returns void
     * @throws ApiError
     */
    public static putApiChatRoomsNotification(
        roomId: number,
        requestBody: UpdateNotificationSettingRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/chat/rooms/{roomId}/notification',
            path: {
                'roomId': roomId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * メッセージ一覧を取得
     * @param roomId ルームID
     * @param limit 取得件数（デフォルト: 50、最大: 100）
     * @param cursor カーソル（このメッセージIDより前のメッセージを取得）
     * @returns ChatMessagesResponse OK
     * @throws ApiError
     */
    public static getApiChatRoomsMessages(
        roomId: number,
        limit?: number,
        cursor?: number,
    ): CancelablePromise<ChatMessagesResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/{roomId}/messages',
            path: {
                'roomId': roomId,
            },
            query: {
                'Limit': limit,
                'Cursor': cursor,
            },
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * メッセージを送信
     * @param roomId ルームID
     * @param requestBody メッセージ送信リクエスト
     * @returns ChatMessageItem Created
     * @throws ApiError
     */
    public static postApiChatRoomsMessages(
        roomId: number,
        requestBody: SendMessageRequest,
    ): CancelablePromise<ChatMessageItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/{roomId}/messages',
            path: {
                'roomId': roomId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 既読位置を更新
     * @param roomId ルームID
     * @param requestBody 既読位置更新リクエスト
     * @returns void
     * @throws ApiError
     */
    public static putApiChatRoomsRead(
        roomId: number,
        requestBody: UpdateReadPositionRequest,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/chat/rooms/{roomId}/read',
            path: {
                'roomId': roomId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * 全体の未読数を取得
     * @returns ChatUnreadCountResponse OK
     * @throws ApiError
     */
    public static getApiChatUnread(): CancelablePromise<ChatUnreadCountResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/unread',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * カテゴリ別の未読数を取得
     * @returns ChatUnreadCountByCategoryResponse OK
     * @throws ApiError
     */
    public static getApiChatUnreadByCategory(): CancelablePromise<ChatUnreadCountByCategoryResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/unread/by-category',
            errors: {
                500: `Internal Server Error`,
            },
        });
    }
}

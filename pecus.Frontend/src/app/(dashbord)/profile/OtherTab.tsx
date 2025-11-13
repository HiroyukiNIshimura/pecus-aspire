"use client";

import type { UserInfo } from "@/types/userInfo";

interface OtherTabProps {
  user: UserInfo;
}

export default function OtherTab({ user }: OtherTabProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4 bg-base-100">
      {/* ユーザーID */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">ユーザーID</span>
        </label>
        <input
          type="text"
          value={user.id || ""}
          readOnly
          className="input input-bordered bg-base-200"
        />
      </div>

      {/* メールアドレス */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">メールアドレス</span>
        </label>
        <input
          type="email"
          value={user.email || ""}
          readOnly
          className="input input-bordered bg-base-200"
        />
      </div>

      {/* ロール */}
      {user.roles && user.roles.length > 0 && (
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">ロール</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <div key={role.id} className="badge badge-primary">
                {role.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 管理者ステータス */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">管理者</span>
        </label>
        <div className="badge badge-lg">
          {user.isAdmin ? "はい" : "いいえ"}
        </div>
      </div>

      {/* 作成日 */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">作成日</span>
        </label>
        <input
          type="text"
          value={formatDate(user.createdAt)}
          readOnly
          className="input input-bordered bg-base-200"
        />
      </div>



      {/* RowVersion */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">バージョン</span>
        </label>
        <input
          type="text"
          value={user.rowVersion || ""}
          readOnly
          className="input input-bordered bg-base-200 text-xs"
        />
      </div>

      {/* アバター情報 */}
      {user.identityIconUrl && (
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">アバタープレビュー</span>
          </label>
          <img
            src={user.identityIconUrl}
            alt="ユーザーアバター"
            className="w-32 h-32 rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  );
}

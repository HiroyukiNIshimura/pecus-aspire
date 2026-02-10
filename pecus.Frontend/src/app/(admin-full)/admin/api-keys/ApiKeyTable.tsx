'use client';

import type { ExternalApiKeyResponse } from '@/connectors/api/pecus';
import { formatDate } from '@/libs/utils/date';

interface Props {
  keys: ExternalApiKeyResponse[];
  onRevoke: (key: ExternalApiKeyResponse) => void;
  isSubmitting: boolean;
}

export default function ApiKeyTable({ keys, onRevoke, isSubmitting }: Props) {
  if (keys.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="text-center">
          <span className="icon-[mdi--key-outline] text-base-content/30 size-16" aria-hidden="true" />
          <p className="text-base-content/60 mt-4">APIキーはまだ発行されていません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>名前</th>
            <th>キー（先頭）</th>
            <th>状態</th>
            <th>有効期限</th>
            <th>発行者</th>
            <th>作成日</th>
            <th>失効者</th>
            <th>失効日</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => (
            <tr key={key.id}>
              <td className="font-medium">{key.name}</td>
              <td>
                <code className="bg-base-200 rounded px-2 py-0.5 text-sm">{key.keyPrefix}...</code>
              </td>
              <td>
                <StatusBadge isRevoked={key.isRevoked} isExpired={key.isExpired} />
              </td>
              <td className="text-sm">{formatDate(key.expiresAt)}</td>
              <td className="text-sm">{key.createdByUserName}</td>
              <td className="text-sm">{formatDate(key.createdAt)}</td>
              <td className="text-sm">{key.revokedByUserName ?? '—'}</td>
              <td className="text-sm">{key.revokedAt ? formatDate(key.revokedAt) : '—'}</td>
              <td>
                {!key.isRevoked && (
                  <button
                    type="button"
                    className="btn btn-error btn-sm btn-outline"
                    disabled={isSubmitting}
                    onClick={() => onRevoke(key)}
                    aria-label={`${key.name} を失効させる`}
                  >
                    失効
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ isRevoked, isExpired }: { isRevoked: boolean; isExpired: boolean }) {
  if (isRevoked) {
    return <span className="badge badge-error badge-sm">失効済み</span>;
  }
  if (isExpired) {
    return <span className="badge badge-warning badge-sm">期限切れ</span>;
  }
  return <span className="badge badge-success badge-sm">有効</span>;
}

'use client';

import type { AgendaAttendeeResponse, AttendanceStatus } from '@/connectors/api/pecus';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

interface AttendeeListProps {
  attendees: AgendaAttendeeResponse[];
  currentUserId?: number;
}

// ソート順序: Accepted > Tentative > Pending > Declined
const statusOrder: Record<AttendanceStatus, number> = {
  Accepted: 0,
  Tentative: 1,
  Pending: 2,
  Declined: 3,
};

export function AttendeeList({ attendees, currentUserId }: AttendeeListProps) {
  // ステータスでソート（参加 > 仮 > 未回答 > 不参加）
  const sortedAttendees = [...attendees].sort((a, b) => {
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // ステータス別カウント
  const counts = attendees.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    },
    {} as Record<AttendanceStatus, number>,
  );

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-lg gap-2">
          <span className="icon-[tabler--users] size-5" />
          参加者
          <span className="badge badge-neutral ml-1">{attendees.length}</span>
        </h2>

        {/* サマリー */}
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {counts.Accepted && (
            <span className="text-success">
              <span className="icon-[tabler--check] size-4 align-middle" /> {counts.Accepted}
            </span>
          )}
          {counts.Tentative && (
            <span className="text-warning">
              <span className="icon-[tabler--help] size-4 align-middle" /> {counts.Tentative}
            </span>
          )}
          {counts.Pending && (
            <span className="text-base-content/60">
              <span className="icon-[tabler--clock] size-4 align-middle" /> {counts.Pending}
            </span>
          )}
          {counts.Declined && (
            <span className="text-error">
              <span className="icon-[tabler--x] size-4 align-middle" /> {counts.Declined}
            </span>
          )}
        </div>

        <div className="divider my-2" />

        {/* 参加者リスト */}
        <ul className="space-y-2">
          {sortedAttendees.map((attendee) => {
            const isCurrentUser = attendee.userId === currentUserId;
            return (
              <li
                key={attendee.userId}
                className={`flex items-center gap-2 rounded-lg p-2 ${isCurrentUser ? 'bg-primary/10' : ''}`}
              >
                <div className="avatar shrink-0">
                  {attendee.user?.identityIconUrl ? (
                    <img
                      src={attendee.user.identityIconUrl}
                      alt={attendee.user?.username ?? ''}
                      className="size-8 rounded-full"
                    />
                  ) : (
                    <span className="bg-base-300 text-base-content rounded-full flex items-center justify-center size-8">
                      <span className="icon-[tabler--user] size-4" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-medium text-sm ${isCurrentUser ? 'text-primary' : ''}`}>
                    {attendee.user?.username ?? `ユーザー ${attendee.userId}`}
                  </p>
                  {attendee.isOptional && <p className="text-xs text-base-content/50">任意参加</p>}
                </div>
                <AttendanceStatusBadge status={attendee.status} size="sm" />
              </li>
            );
          })}
        </ul>

        {attendees.length === 0 && <p className="text-center text-base-content/50 py-4">参加者がいません</p>}
      </div>
    </div>
  );
}

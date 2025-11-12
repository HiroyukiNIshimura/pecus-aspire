"use client";

import { useState } from "react";
import type { PendingEmailChangeResponse } from "@/connectors/api/pecus";
import PasswordChangeTab from "./PasswordChangeTab";
import EmailChangeTab from "./EmailChangeTab";

interface SecurityTabProps {
  currentEmail: string;
  pendingEmailChange: PendingEmailChangeResponse | null;
  onAlert: (type: "success" | "error" | "info", message: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

type SecuritySubTab = "password" | "email";

export default function SecurityTab({
  currentEmail,
  pendingEmailChange,
  onAlert,
  isLoading,
  setIsLoading,
}: SecurityTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SecuritySubTab>("password");

  const subTabs: { id: SecuritySubTab; label: string }[] = [
    { id: "password", label: "パスワード変更" },
    { id: "email", label: "メールアドレス変更" },
  ];

  return (
    <div className="space-y-6">
      {/* サブタブナビゲーション */}
      <div className="flex border-b border-base-300">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeSubTab === tab.id
                ? "text-primary border-b-2 border-primary -mb-0.5"
                : "text-base-content/70 hover:text-base-content"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* サブタブコンテンツ */}
      <div className="pt-4">
        {activeSubTab === "password" && (
          <PasswordChangeTab
            onAlert={onAlert}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
        {activeSubTab === "email" && (
          <EmailChangeTab
            currentEmail={currentEmail}
            pendingEmailChange={pendingEmailChange}
            onAlert={onAlert}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}
      </div>
    </div>
  );
}

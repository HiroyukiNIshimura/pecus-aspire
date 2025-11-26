"use client";

import { useState } from "react";
import AppHeader from "@/components/common/AppHeader";
import type {
  MasterSkillResponse,
  PendingEmailChangeResponse,
} from "@/connectors/api/pecus";
import { useNotify } from "@/hooks/useNotify";
import type { UserInfo } from "@/types/userInfo";
import BasicInfoTab from "./BasicInfoTab";
import SkillsTab from "./SkillsTab";
import SecurityTab from "./SecurityTab";

interface ProfileSettingsClientProps {
  initialUser: UserInfo;
  initialPendingEmailChange: PendingEmailChangeResponse | null;
  masterSkills: MasterSkillResponse[];
  fetchError?: string | null;
}

type TabType = "basic" | "skills" | "security";

export default function ProfileSettingsClient({
  initialUser,
  initialPendingEmailChange,
  masterSkills,
  fetchError,
}: ProfileSettingsClientProps) {
  const notify = useNotify();
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [user, setUser] = useState<UserInfo>(initialUser);
  const [pendingEmailChange, setPendingEmailChange] =
    useState<PendingEmailChangeResponse | null>(initialPendingEmailChange);
  const [isLoading, setIsLoading] = useState(false);

  const tabs: { id: TabType; label: string }[] = [
    { id: "basic", label: "基本情報" },
    { id: "skills", label: "スキル" },
    { id: "security", label: "セキュリティ" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader
        userInfo={user}
        sidebarOpen={false}
        setSidebarOpen={() => {}}
        hideProfileMenu={true}
      />
      <main className="flex-1 p-6 bg-base-100">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">プロフィール設定</h1>
            <p className="text-base-content/70">
              アカウント情報とセキュリティ設定を管理してください
            </p>
          </div>
          <div className="mb-6">
            <div className="flex border-b border-base-300">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary -mb-0.5"
                      : "text-base-content/70 hover:text-base-content"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* タブコンテンツ */}
          <div className="bg-base-100 rounded-lg shadow-md p-8">
            {activeTab === "basic" && (
              <BasicInfoTab
                user={user}
                onUpdate={setUser}
                notify={notify}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {activeTab === "skills" && (
              <SkillsTab
                initialSkillIds={user.skills?.map((s) => s.id) || []}
                masterSkills={masterSkills}
                notify={notify}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {activeTab === "security" && (
              <SecurityTab
                currentEmail={user.email || ""}
                pendingEmailChange={pendingEmailChange}
                notify={notify}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

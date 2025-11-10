"use client";

import { useState } from "react";
import AppHeader from "@/components/common/AppHeader";
import type { UserResponse, MasterSkillResponse } from "@/connectors/api/pecus";
import BasicInfoTab from "./BasicInfoTab";
import SkillsTab from "./SkillsTab";
import SecurityTab from "./SecurityTab";
import OtherTab from "./OtherTab";

interface ProfileSettingsClientProps {
  initialUser: UserResponse;
  masterSkills: MasterSkillResponse[];
  fetchError?: string | null;
}

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
}

type TabType = "basic" | "skills" | "security" | "other";
type AlertType = "success" | "error" | "info";

interface AlertMessage {
  type: AlertType;
  message: string;
}

export default function ProfileSettingsClient({
  initialUser,
  masterSkills,
  fetchError,
}: ProfileSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("basic");
  const [user, setUser] = useState<UserResponse>(initialUser);
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const userInfo: UserInfo = {
    id: initialUser.id,
    name: initialUser.username,
    email: initialUser.email,
    isAdmin: initialUser.isAdmin || false,
  };

  const handleAlert = (type: AlertType, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "basic", label: "基本情報" },
    { id: "skills", label: "スキル" },
    { id: "security", label: "セキュリティ" },
    { id: "other", label: "その他" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader userInfo={userInfo} sidebarOpen={false} setSidebarOpen={() => {}} hideProfileMenu={true} />
      <main className="flex-1 p-6 bg-base-100">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">プロフィール設定</h1>
            <p className="text-gray-600">アカウント情報とセキュリティ設定を管理してください</p>
          </div>
          {fetchError && <div className="alert alert-error mb-4"><span>{fetchError}</span></div>}
          {alert && (
            <div className={`alert alert-${alert.type} mb-4`}>
              <span>{alert.message}</span>
              <button type="button" onClick={() => setAlert(null)} className="btn btn-sm btn-ghost">✕</button>
            </div>
          )}
          <div className="tabs tabs-bordered mb-6">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}>
                {tab.label}
              </button>
            ))}
          </div>
          {/* タブコンテンツ */}
          <div className="bg-base-100 rounded-lg shadow-md p-6">
            {activeTab === "basic" && (
              <BasicInfoTab user={user} onUpdate={setUser} onAlert={handleAlert} isLoading={isLoading} setIsLoading={setIsLoading} />
            )}
            {activeTab === "skills" && (
              <SkillsTab initialSkillIds={user.skills?.map((s) => s.id) || []} masterSkills={masterSkills} onAlert={handleAlert} isLoading={isLoading} setIsLoading={setIsLoading} />
            )}
            {activeTab === "security" && (
              <SecurityTab onAlert={handleAlert} isLoading={isLoading} setIsLoading={setIsLoading} />
            )}
            {activeTab === "other" && <OtherTab user={user} />}
          </div>
        </div>
      </main>
    </div>
  );
}

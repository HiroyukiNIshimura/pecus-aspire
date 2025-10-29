"use client";

import ResizableSidebar from "@/components/client/widgets/ResizableSidebar";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="btn btn-outline"
      >
        {loading ? 'ログアウト中...' : 'ログアウト'}
      </button>
      <ResizableSidebar />
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyEmailChange } from "@/actions/profile";

type VerificationState = "verifying" | "success" | "error";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>("verifying");
  const [message, setMessage] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setMessage("トークンが指定されていません。");
      return;
    }

    // トークン検証を実行
    const verify = async () => {
      const result = await verifyEmailChange(token);

      if (result.success) {
        setState("success");
        setMessage(result.data.message);
        setNewEmail(result.data.newEmail);
      } else {
        setState("error");
        setMessage(result.message || "メールアドレスの変更に失敗しました。");
      }
    };

    verify();
  }, [searchParams]);

  const handleBackToProfile = () => {
    router.push("/profile");
  };

  return (
    <div className="card bg-base-100 shadow-xl max-w-md w-full">
      <div className="card-body items-center text-center">
        {state === "verifying" && (
          <>
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <h2 className="card-title text-2xl mt-4">確認中...</h2>
            <p className="text-base-content/70">メールアドレス変更を確認しています。</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="text-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="card-title text-2xl mt-4 text-success">変更完了</h2>
            <p className="text-base-content/70 mt-2">{message}</p>
            {newEmail && <p className="text-base-content font-semibold mt-2">新しいメールアドレス: {newEmail}</p>}
            <div className="card-actions mt-6">
              <button type="button" onClick={handleBackToProfile} className="btn btn-primary">
                プロフィールに戻る
              </button>
            </div>
          </>
        )}

        {state === "error" && (
          <>
            <div className="text-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="card-title text-2xl mt-4 text-error">確認失敗</h2>
            <p className="text-base-content/70 mt-2">{message}</p>
            <div className="card-actions mt-6 flex-col gap-2 w-full">
              <button type="button" onClick={handleBackToProfile} className="btn btn-outline w-full">
                プロフィールに戻る
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

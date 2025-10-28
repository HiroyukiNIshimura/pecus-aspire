"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  return <LoginForm />;
}

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const callbackUrl = searchParams.get("callbackUrl") || "/";

    try {
      const response = await signIn("credentials", {
        redirect: false,
        id,
        password,
        callbackUrl,
      });

      if (response?.ok) {
        router.push(callbackUrl);
        return;
      }

      if (response?.status === 401) {
        setError(
          "ログイン認証に失敗しました。IDまたはパスワードが正しくありません。",
        );
        return;
      }

      setError("ログイン認証に失敗しました。");
      return;
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1>ログイン</h1>
        {error && (
          <div className="alert alert-soft alert-warning" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="w-96">
            <label className="label-text" htmlFor="id">
              ログインID
            </label>
            <input
              type="text"
              required
              placeholder=""
              className="input"
              id="id"
              value={id}
              onChange={(event) => setId(event.target.value)}
            />
            <span className="helper-text text-end">
              ログインIDを入力してください
            </span>
          </div>

          <div className="w-96">
            <label className="label-text" htmlFor="password">
              パスワード
            </label>
            <input
              type="password"
              required
              placeholder=""
              className="input"
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span className="helper-text text-end">
              パスワードを入力してください
            </span>
          </div>
          <button className="btn btn-accent" type="submit">
            ログイン
          </button>
        </form>
      </main>
    </div>
  );
};

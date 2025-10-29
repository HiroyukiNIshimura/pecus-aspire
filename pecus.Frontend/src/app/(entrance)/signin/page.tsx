"use client";

import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

export default function SignInPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const LoginForm = () => {
  const router = useRouter();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginIdentifier: id,
          password,
        }),
      });

      if (response.ok) {
        router.push('/');
        return;
      }

      const data = await response.json();
      setError(data.error || 'ログイン認証に失敗しました。');
    } catch (err) {
      console.error(err);
      setError('ログイン認証に失敗しました。');
    }
  };

  return (
    <div className="font-sans flex items-center justify-center min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col gap-[32px] items-center">
        <div className="card w-full max-w-lg shadow-lg bg-base-100">
          <div className="card-body">
            <h1 className="card-title text-center">ログイン</h1>
            {error && (
              <div className="alert alert-soft alert-warning" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label-text" htmlFor="id">
                  ログインID
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  className="input input-bordered w-full"
                  id="id"
                  value={id}
                  onChange={(event) => setId(event.target.value)}
                />
                <span className="helper-text text-end">
                  ログインIDを入力してください
                </span>
              </div>

              <div>
                <label className="label-text" htmlFor="password">
                  パスワード
                </label>
                <input
                  type="password"
                  required
                  placeholder=""
                  className="input input-bordered w-full"
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <span className="helper-text text-end">
                  パスワードを入力してください
                </span>
              </div>
              <button className="btn btn-accent w-full" type="submit">
                ログイン
              </button>
            </form>
            <div className="text-center mt-4">
              <a href="/forgot-password" className="link link-primary">
                パスワードを忘れた
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface PasswordRequirementIndicatorProps {
  password: string;
  requirements?: PasswordRequirements;
}

/**
 * パスワード要件を満たしているかを視覚的に表示するインジケーター
 * @param password - チェック対象のパスワード
 * @param requirements - カスタム要件（省略時は自動計算）
 */
export default function PasswordRequirementIndicator({
  password,
  requirements,
}: PasswordRequirementIndicatorProps) {
  // 要件が渡されない場合は自動計算
  const reqs = requirements ?? {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  // パスワードが入力されていない場合は何も表示しない
  if (!password) {
    return null;
  }

  return (
    <div className="label">
      <span className="label-text-alt flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className={reqs.minLength ? "text-success" : "text-error"}>
          {reqs.minLength ? "✔" : "✘"} 8文字以上
        </span>
        <span className={reqs.hasUpperCase ? "text-success" : "text-error"}>
          {reqs.hasUpperCase ? "✔" : "✘"} 大文字
        </span>
        <span className={reqs.hasLowerCase ? "text-success" : "text-error"}>
          {reqs.hasLowerCase ? "✔" : "✘"} 小文字
        </span>
        <span className={reqs.hasNumber ? "text-success" : "text-error"}>
          {reqs.hasNumber ? "✔" : "✘"} 数字
        </span>
        <span
          className={
            reqs.hasSpecialChar ? "text-success" : "text-base-content/50"
          }
        >
          {reqs.hasSpecialChar ? "✔" : "○"} 記号(任意)
        </span>
      </span>
    </div>
  );
}

/**
 * パスワード要件をチェックするユーティリティ関数
 * @param password - チェック対象のパスワード
 * @returns 各要件の充足状況
 */
export function getPasswordRequirements(
  password: string,
): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

/**
 * パスワードが必須要件を満たしているかチェック
 * @param password - チェック対象のパスワード
 * @returns 必須要件（特殊文字以外）をすべて満たしている場合true
 */
export function isPasswordValid(password: string): boolean {
  const reqs = getPasswordRequirements(password);
  return (
    reqs.minLength && reqs.hasUpperCase && reqs.hasLowerCase && reqs.hasNumber
  );
}

/**
 * テキストをクリップボードへコピーする
 *
 * Clipboard API はセキュアコンテキストでのみ利用できるため、
 * http でアクセスしている場合（開発環境のコンテナブラウザ等）は
 * 一時的な textarea でフォールバックする。
 *
 * @returns コピーに成功した場合は true
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // フォールバックへ
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

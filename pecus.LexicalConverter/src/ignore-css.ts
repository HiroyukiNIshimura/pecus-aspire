/**
 * Node.js 環境で CSS インポートを無視するためのフック
 * ts-node 実行時に読み込まれる
 */

// CSS ファイルの require を空オブジェクトで返す
const cssExtensions = ['.css'];

cssExtensions.forEach((ext) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require.extensions[ext] = () => {
    // CSS を空オブジェクトとして返す
    return {};
  };
});

export {};

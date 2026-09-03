/**
 * Node.js 環境で CSS インポートを無視するためのフック
 * node 起動時に -r で先読みされる
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

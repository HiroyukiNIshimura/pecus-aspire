/**
 * Node.js環境でLexicalのDOM操作を可能にするためのjsdom環境設定
 */

import { JSDOM } from 'jsdom';

let domInitialized = false;

/**
 * グローバルにDOM環境を初期化する
 * Lexicalのヘッドレスエディタ使用前に一度だけ呼び出す
 */
export function initializeDomEnvironment(): void {
  if (domInitialized) {
    return;
  }

  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
  });

  // グローバルオブジェクトにDOM APIを設定
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.Text = dom.window.Text;
  global.Node = dom.window.Node;

  domInitialized = true;
}

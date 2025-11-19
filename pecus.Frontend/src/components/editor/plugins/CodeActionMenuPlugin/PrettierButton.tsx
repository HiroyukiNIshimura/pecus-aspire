"use client";

import { $isCodeNode, $createCodeNode, type CodeNode } from "@lexical/code";
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $setSelection,
  $createTextNode,
  type LexicalEditor,
} from "lexical";
import { useState } from "react";

interface Props {
  editor: LexicalEditor;
  getCodeDOMNode: () => HTMLElement | null;
}

const PRETTIER_PARSER_MODULES = {
  css: async () => await import("prettier/plugins/postcss"),
  html: async () => await import("prettier/plugins/html"),
  js: async () => await import("prettier/plugins/babel"),
  markdown: async () => await import("prettier/plugins/markdown"),
  typescript: async () => await import("prettier/plugins/typescript"),
} as const;

type SupportedLanguage = keyof typeof PRETTIER_PARSER_MODULES;

const PRETTIER_SUPPORTED_LANGUAGES: readonly string[] = [
  "css",
  "html",
  "js",
  "jsx",
  "javascript",
  "json",
  "markdown",
  "md",
  "ts",
  "tsx",
  "typescript",
] as const;

/**
 * Prettierでコードをフォーマットするボタン
 */
export function PrettierButton({ editor, getCodeDOMNode }: Props) {
  const [syntaxError, setSyntaxError] = useState<string>("");
  const [isFormatting, setIsFormatting] = useState<boolean>(false);

  async function handleClick(): Promise<void> {
    const codeDOMNode = getCodeDOMNode();

    if (!codeDOMNode) {
      return;
    }

    try {
      setIsFormatting(true);
      setSyntaxError("");

      let language: string | null | undefined = null;
      let content = "";

      // コードの内容と言語を取得
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(codeDOMNode);

        if (!$isCodeNode(node)) {
          return;
        }

        language = node.getLanguage();
        content = node.getTextContent();
      });

      if (!language) {
        return;
      }

      // サポートされている言語かチェック
      if (!PRETTIER_SUPPORTED_LANGUAGES.includes(language)) {
        setSyntaxError(`"${language}" is not supported by Prettier`);
        return;
      }

      // Prettier モジュールを動的インポート
      const prettier = await import("prettier/standalone");
      const estree = await import("prettier/plugins/estree");
      const parser = await getPrettierParser(language);

      if (!parser) {
        setSyntaxError(`Failed to load parser for "${language}"`);
        return;
      }

      // フォーマット実行（estreeプラグインを必ず含める）
      const formatted = await prettier.format(content, {
        parser: getParserName(language),
        plugins: [parser, estree],
      });

      // フォーマット結果を反映（新しいupdateコンテキストで実行）
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(codeDOMNode);
        if (!$isCodeNode(node)) {
          return;
        }

        // 現在の選択状態をクリア
        $setSelection(null);

        // 新しいCodeNodeを作成
        const newCodeNode = $createCodeNode(language);
        // TextNodeを追加
        newCodeNode.append($createTextNode(formatted));
        // 古いノードと置き換え
        node.replace(newCodeNode);
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Formatting failed";
      setSyntaxError(msg);
    } finally {
      setIsFormatting(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="btn btn-xs btn-ghost"
        onClick={handleClick}
        disabled={isFormatting}
        aria-label="prettier"
        title="コードをフォーマット (Prettier)"
      >
        {isFormatting ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h8m-8 6h16"
            />
          </svg>
        )}
      </button>
      {syntaxError && (
        <span className="text-xs text-error" title={syntaxError}>
          ⚠️
        </span>
      )}
    </div>
  );
}

/**
 * 言語に対応するPrettierパーサーを取得
 */
async function getPrettierParser(language: string): Promise<unknown | null> {
  const lang = normalizeLanguage(language);

  try {
    if (lang in PRETTIER_PARSER_MODULES) {
      const module = await PRETTIER_PARSER_MODULES[lang as SupportedLanguage]();
      return module;
    }
  } catch (error) {
    return null;
  }

  return null;
}

/**
 * 言語名を正規化
 */
function normalizeLanguage(language: string): string {
  const normalized = language.toLowerCase();

  switch (normalized) {
    case "js":
    case "jsx":
    case "javascript":
    case "json":
      return "js";
    case "ts":
    case "tsx":
    case "typescript":
      return "typescript";
    case "md":
    case "markdown":
      return "markdown";
    default:
      return normalized;
  }
}

/**
 * Prettierのパーサー名を取得
 */
function getParserName(language: string): string {
  const normalized = normalizeLanguage(language);

  switch (normalized) {
    case "js":
      return "babel";
    case "typescript":
      return "typescript";
    case "markdown":
      return "markdown";
    case "html":
      return "html";
    case "css":
      return "css";
    default:
      return "babel";
  }
}

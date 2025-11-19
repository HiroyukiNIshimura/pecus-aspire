"use client";

import { $isCodeNode } from "@lexical/code";
import { $getNearestNodeFromDOMNode } from "lexical";
import type { LexicalEditor } from "lexical";
import { useState, useRef, useEffect } from "react";

const CODE_LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash" },
  { value: "powershell", label: "PowerShell" },
  { value: "", label: "Plain Text" },
];

interface LanguageSelectorProps {
  editor: LexicalEditor;
  currentLanguage: string;
  getCodeDOMNode: () => HTMLElement | null;
  onLanguageChange?: (newLanguage: string) => void;
}

export function LanguageSelector({
  editor,
  currentLanguage,
  getCodeDOMNode,
  onLanguageChange,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (newLanguage: string) => {
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      console.error("Code DOM node not found");
      return;
    }

    editor.update(() => {
      // $getNearestNodeFromDOMNodeはupdate()の中で使用する必要がある
      const maybeCodeNode = $getNearestNodeFromDOMNode(codeDOMNode);

      if ($isCodeNode(maybeCodeNode)) {
        // 書き込み可能なノードを取得して言語を設定
        maybeCodeNode.setLanguage(newLanguage);
        console.log(`Language changed to: ${newLanguage}`);

        // 親コンポーネントに言語変更を通知
        onLanguageChange?.(newLanguage);
      } else {
        console.error("Node is not a CodeNode", maybeCodeNode);
      }
    });
    setIsOpen(false);
  };

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentLabel =
    CODE_LANGUAGE_OPTIONS.find((opt) => opt.value === currentLanguage)?.label ||
    currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="text-xs opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded hover:bg-base-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="言語を選択"
        style={{ marginRight: "4px" }}
      >
        {currentLabel}
        <span className="ml-1 text-[8px]">▼</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 bg-base-100 border border-base-300 rounded shadow-lg z-50 max-h-64 overflow-y-auto"
          style={{ minWidth: "150px" }}
        >
          {CODE_LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-3 py-2 text-xs hover:bg-base-200 transition-colors ${
                option.value === currentLanguage
                  ? "bg-base-200 font-semibold"
                  : ""
              }`}
              onClick={() => handleLanguageChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import EditorJS, { OutputData } from "@editorjs/editorjs";
// @ts-ignore - @editorjs/header has type issues
import Header from "@editorjs/header";
// @ts-ignore - @editorjs/list has type issues
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
// @ts-ignore - @editorjs/quote has type issues
import Quote from "@editorjs/quote";
// @ts-ignore - @editorjs/code has type issues
import Code from "@editorjs/code";
// @ts-ignore - @editorjs/delimiter has type issues
import Delimiter from "@editorjs/delimiter";
// @ts-ignore - @editorjs/inline-code has type issues
import InlineCode from "@editorjs/inline-code";
import SimpleImage from "@editorjs/simple-image";

interface EditorJSComponentProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
  placeholder?: string;
  readOnly?: boolean;
  onInitialize?: (editorCore?: {
    destroy(): Promise<void>;
    clear(): Promise<void>;
    save(): Promise<OutputData>;
    render(data: OutputData): Promise<void>;
    dangerouslyLowLevelInstance?: EditorJS | null;
  }) => void;
}

// EditorJS は holder に element の id(string) を渡すことができるので
// 一意の id を作って渡す方式にします。さらに、同一 holder に対して
// 既に初期化中/初期化済みの Editor がある場合は再作成を避けるために
// holder -> entry を追跡する WeakMap を併用します。
const createId = () => `editorjs-${Math.random().toString(36).slice(2, 9)}`;

type HolderEntry = {
  editor?: EditorJS;
  mountNode?: HTMLElement;
  initializing?: Promise<void>;
};
const holderInstances = new WeakMap<Element, HolderEntry>();

export default function EditorJSComponent({
  data,
  onChange,
  placeholder = "本文を入力してください...",
  readOnly = false,
  onInitialize,
}: EditorJSComponentProps) {
  const editorRef = useRef<EditorJS | null>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef<boolean>(false);
  const idRef = useRef<string>(createId());

  useEffect(() => {
    if (!holderRef.current) return;

    // 初期化済みフラグ
    let isMounted = true;

    // 既存のインスタンスを破棄 / 初期化
    const initEditor = async () => {
      // 初期化済みの再入を防止 (StrictMode 等での二重実行に備える)
      if (initializedRef.current) return;

      const holder = holderRef.current!;
      // holder に既にインスタンスがある場合は初期化をスキップ
      const existing = holderInstances.get(holder);
      if (existing) {
        if (existing.editor) {
          editorRef.current = existing.editor;
          initializedRef.current = true;
          return;
        }
        if (existing.initializing) {
          // 既に初期化中なら完了を待って参照を取得
          try {
            await existing.initializing;
            if (existing.editor) {
              editorRef.current = existing.editor;
              initializedRef.current = true;
            }
          } catch (err) {
            // 初期化に失敗している可能性があるので続行して再初期化する
            console.warn("Previous editor initialization failed, retrying", err);
          }
          return;
        }
      }
      if (editorRef.current) {
        await editorRef.current.destroy();
        editorRef.current = null;
      }

      if (!isMounted) return;

      // EditorJS のコンテナをクリア（2重初期化時に DOM が残る場合があるため）
      if (holderRef.current) {
        // Editor.js が DOM を残してしまっている可能性があるので明示的に削除
        const existingEditors = holderRef.current.querySelectorAll(".codex-editor, .ce-block");
        existingEditors.forEach((el) => el.remove());
        holderRef.current.innerHTML = "";
      }

      // Editor.jsのインスタンスを作成
      // holderRef に直接マウントではなくサブコンテナを作成してマウントする
      const mountNode = document.createElement("div");
      mountNode.className = "editorjs-mount";
      // mountNode を DOM に追加して、EditorJS に直接 element を渡す
      holderRef.current!.appendChild(mountNode);
      // 初期化中フラグとして entry を登録（Promise は後で設定）
      let initResolve: (() => void) | undefined;
      const initializing = new Promise<void>((res) => {
        initResolve = res;
      });
      holderInstances.set(holderRef.current!, { mountNode, initializing });
      const editor = new EditorJS({
        // holder に直接 element を渡す（より確実）
        holder: mountNode,
        placeholder,
        readOnly,
        data: data || undefined,
        tools: {
          header: {
            // @ts-ignore - EditorJS tools type compatibility
            class: Header,
            config: {
              placeholder: "見出しを入力...",
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2,
            },
          },
          list: {
            // @ts-ignore - EditorJS tools type compatibility
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: "unordered",
            },
          },
          checklist: {
            // @ts-ignore - EditorJS tools type compatibility
            class: Checklist,
            inlineToolbar: true,
          },
          quote: {
            // @ts-ignore - EditorJS tools type compatibility
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: "引用を入力...",
              captionPlaceholder: "引用元",
            },
          },
          code: {
            // @ts-ignore - EditorJS tools type compatibility
            class: Code,
            config: {
              placeholder: "コードを入力...",
            },
          },
          // @ts-ignore - EditorJS tools type compatibility
          delimiter: Delimiter,
          inlineCode: {
            // @ts-ignore - EditorJS tools type compatibility
            class: InlineCode,
          },
          // @ts-ignore - EditorJS tools type compatibility
          image: SimpleImage,
        },
        onChange: async () => {
          if (onChange && editorRef.current) {
            try {
              const savedData = await editorRef.current.save();
              onChange(savedData);
            } catch (error) {
              console.error("EditorJS save error:", error);
            }
          }
        },
      });

      // マウント済みであれば初期化成功フラグを立てる
      editorRef.current = editor;
      // 初期化が完了したらフラグを立てる
      editor.isReady
        .then(() => {
          // holderInstances に editor を保存し、initializing を解決
          if (holderRef.current) {
            const en = holderInstances.get(holderRef.current) || {};
            en.editor = editor;
            holderInstances.set(holderRef.current, en);
          }
          if (typeof initResolve === "function") {
            initResolve();
          }
          if (isMounted) initializedRef.current = true;
          // onInitialize を呼び出す（react-editor-js の API に合わせた抽象ラッパー）
          if (onInitialize) {
            const core = {
              destroy: async () => editor.destroy(),
              clear: async () => editor.clear(),
              save: async () => editor.save(),
              render: async (d: OutputData) => editor.render(d),
              dangerouslyLowLevelInstance: typeof window !== "undefined" ? editor : null,
            };
            try {
              onInitialize(core);
            } catch (err) {
              // 呼び出し側の例外はログに留める
              console.error("onInitialize handler error:", err);
            }
          }
        })
        .catch((err) => {
          console.error("EditorJS isReady error:", err);
          initializedRef.current = false;
          // 初期化失敗時は holderInstances をクリアしておく
          if (holderRef.current && holderInstances.has(holderRef.current)) {
            holderInstances.delete(holderRef.current);
          }
        });
    };

    initEditor();

    return () => {
      isMounted = false;
      // キャッシュされたエントリがあればそれを優先して破棄する
      const toDestroy = editorRef.current;

      // 先にローカル参照をクリアしておく（他の cleanup と競合しないように）
      editorRef.current = null;
      initializedRef.current = false;

      const removeMountsAndCleanup = () => {
        // holderInstances から mountNode を取得して削除
        const holder = holderRef.current;
        const entry = holder ? holderInstances.get(holder) : undefined;
        const mount = entry?.mountNode ?? holderRef.current?.querySelector('.editorjs-mount');
        if (mount && mount.parentElement) mount.parentElement.removeChild(mount);
        // holderInstances の登録解除
        if (holder && holderInstances.has(holder)) holderInstances.delete(holder);
      };

      if (toDestroy && typeof toDestroy.destroy === "function") {
        // destroy は Promise を返すため、完了後に DOM を削除する
        try {
          const res = toDestroy.destroy();
          // destroy() が Promise を返す場合は完了を待ってからマウント削除
          if (typeof (res as any) !== "undefined" && typeof (res as any).then === "function") {
            (res as unknown as Promise<void>)
              .then(() => removeMountsAndCleanup())
              .catch((err: unknown) => {
                console.error("Error destroying editor instance:", err);
                removeMountsAndCleanup();
              });
          } else {
            // 同期的に破棄された場合は即座にマウント削除
            removeMountsAndCleanup();
          }
        } catch (err) {
          console.error("Error invoking destroy on editor instance:", err);
          removeMountsAndCleanup();
        }
      } else {
        // 破棄対象がなければ直接マウントを削除
        removeMountsAndCleanup();
      }
    };
  }, [placeholder, readOnly]);

  // データ更新時の処理
  useEffect(() => {
    if (editorRef.current && data) {
      editorRef.current.isReady
        .then(() => {
          editorRef.current?.render(data);
        })
        .catch((err) => console.error("EditorJS render error:", err));
    }
  }, [data]);

  // id を付けるとページ内に複数エディタを配置したときに
  // 競合が発生することがあるため、id は不要。
  return <div ref={holderRef} />;
}

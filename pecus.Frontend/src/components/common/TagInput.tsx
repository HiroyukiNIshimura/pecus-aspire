'use client';

import Tagify from '@yaireo/tagify';
import '@yaireo/tagify/dist/tagify.css';
import './TagInput.css';
import { useCallback, useEffect, useRef } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  allowDuplicates?: boolean;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = 'タグを入力...',
  disabled = false,
  maxTags,
  allowDuplicates = false,
}: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tagifyRef = useRef<Tagify | null>(null);

  // タグ変更時のコールバック
  const handleChange = useCallback(
    (e: CustomEvent) => {
      const newTags = e.detail.tagify.value.map((tag: { value: string }) => tag.value);
      onChange(newTags);
    },
    [onChange],
  );

  // Tagify 初期化
  useEffect(() => {
    if (!inputRef.current) return;

    // 既存インスタンスを破棄
    if (tagifyRef.current) {
      tagifyRef.current.destroy();
    }

    // Tagify インスタンス作成
    tagifyRef.current = new Tagify(inputRef.current, {
      placeholder,
      duplicates: allowDuplicates,
      maxTags: maxTags || Infinity,
      editTags: false,
      dropdown: {
        enabled: 0, // サジェストは無効化
      },
    });

    // イベントリスナー登録
    tagifyRef.current.on('change', handleChange as EventListener);

    // 初期値を設定
    if (tags.length > 0) {
      tagifyRef.current.addTags(tags);
    }

    return () => {
      if (tagifyRef.current) {
        tagifyRef.current.off('change', handleChange as EventListener);
        tagifyRef.current.destroy();
        tagifyRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder, allowDuplicates, maxTags]);

  // disabled 状態の更新
  useEffect(() => {
    if (tagifyRef.current) {
      tagifyRef.current.setDisabled(disabled);
    }
  }, [disabled]);

  // 外部からの tags 変更を反映
  useEffect(() => {
    if (!tagifyRef.current) return;

    const currentTags = tagifyRef.current.value.map((tag: { value: string }) => tag.value);
    const tagsChanged = tags.length !== currentTags.length || tags.some((tag, i) => tag !== currentTags[i]);

    if (tagsChanged) {
      tagifyRef.current.removeAllTags();
      if (tags.length > 0) {
        tagifyRef.current.addTags(tags);
      }
    }
  }, [tags]);

  return <input ref={inputRef} className="input input-bordered w-full" disabled={disabled} defaultValue="" />;
}

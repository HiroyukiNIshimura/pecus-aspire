"use client";

import { useState, useCallback } from "react";
import { WithContext as ReactTags } from "react-tag-input";
import type { Tag } from "react-tag-input";
import CloseIcon from "@mui/icons-material/Close";

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
  placeholder = "タグを入力してEnterキーを押す...",
  disabled = false,
  maxTags,
  allowDuplicates = false,
}: TagInputProps) {
  // react-tag-input用の形式に変換
  const tagObjects: Tag[] = tags.map((tag) => ({
    id: tag,
    text: tag,
    className: "",
  }));

  const handleDelete = useCallback(
    (index: number) => {
      if (disabled) return;
      const newTags = tags.filter((_, i) => i !== index);
      onChange(newTags);
    },
    [tags, onChange, disabled]
  );

  const handleAddition = useCallback(
    (tag: Tag) => {
      if (disabled) return;

      const newTagText = tag.text.trim();

      // 空のタグは追加しない
      if (!newTagText) return;

      // 重複チェック
      if (!allowDuplicates && tags.includes(newTagText)) {
        return;
      }

      // 最大タグ数チェック
      if (maxTags && tags.length >= maxTags) {
        return;
      }

      onChange([...tags, newTagText]);
    },
    [tags, onChange, disabled, allowDuplicates, maxTags]
  );

  const handleDrag = useCallback(
    (tag: Tag, currPos: number, newPos: number) => {
      if (disabled) return;

      const newTags = [...tags];
      newTags.splice(currPos, 1);
      newTags.splice(newPos, 0, tag.id);
      onChange(newTags);
    },
    [tags, onChange, disabled]
  );

  return (
    <div className="tag-input-wrapper">
      {/** react-tag-input: enable inline mode and reflect it in classes so CSS can layout inline */}
      {(() => {
        const reactTagsInline = true;

        return (
          <ReactTags
            inline={reactTagsInline}
            tags={tagObjects}
            handleDelete={handleDelete}
            handleAddition={handleAddition}
            classNames={{
              tags: reactTagsInline ? "tag-input-container tag-input-inline" : "tag-input-container",
              tagInput: "tag-input-field",
              tagInputField: disabled
                ? "input input-bordered w-full opacity-50 cursor-not-allowed"
                : "input input-bordered w-full focus:input-primary",
              selected: "tag-list",
              // Use FlyonUI utility classes so colors come from the design system
              tag: disabled
                ? "tag-item tag-item-disabled bg-base-200 text-base-content/60"
                : "tag-item bg-accent text-accent-content",
              remove: "tag-remove",
              suggestions: "tag-suggestions",
              activeSuggestion: "tag-suggestion-active",
            }}
          />
        );
      })()}

    </div>
  );
}

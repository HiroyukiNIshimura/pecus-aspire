/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";
import { useEditorContext } from "../../context/SettingsContext";
import { INSERT_IMAGE_COMMAND } from "../ImagesPlugin";

const ACCEPTABLE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export default function DragDropPaste(): null {
	const [editor] = useLexicalComposerContext();
	const { imageUploader } = useEditorContext();

	useEffect(() => {
		return editor.registerCommand(
			DRAG_DROP_PASTE,
			(files) => {
				(async () => {
					const filesResult = await mediaFileReader(files, [ACCEPTABLE_IMAGE_TYPES].flat());

					for (const { file, result } of filesResult) {
						if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
							// imageUploader が設定されている場合はそちらを使用
							if (imageUploader !== undefined) {
								try {
									const uploadResult = await imageUploader(file);
									editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
										altText: file.name,
										src: uploadResult.url,
									});
								} catch (error) {
									console.error("Failed to upload image:", error);
									// アップロード失敗時はローカルプレビュー（フォールバック）
									editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
										altText: file.name,
										src: result,
									});
								}
							}
							// imageUploader が未設定の場合はローカルプレビュー（既存動作）
							else {
								editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
									altText: file.name,
									src: result,
								});
							}
						}
					}
				})();
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, imageUploader]);

	return null;
}

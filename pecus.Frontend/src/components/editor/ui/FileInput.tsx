/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type JSX, useState } from "react";

import "./Input.css";

type Props = Readonly<{
  "data-test-id"?: string;
  accept?: string;
  label: string;
  onChange: (files: FileList | null) => void;
}>;

//ユニークなinputのID生成
function generateId(label: string): string {
  return `input-${label.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).substring(2, 11)}`;
}

export default function FileInput({ accept, label, onChange, "data-test-id": dataTestId }: Props): JSX.Element {
  const [inputId] = useState(generateId(label));

  return (
    <div className="Input__wrapper">
      <label className="Input__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="Input__input"
        onChange={(e) => onChange(e.target.files)}
        data-test-id={dataTestId}
      />
    </div>
  );
}

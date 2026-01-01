/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { type JSX, useState } from 'react';

import './Input.css';

import type { HTMLInputTypeAttribute } from 'react';

type Props = Readonly<{
  'data-test-id'?: string;
  label: string;
  onChange: (val: string) => void;
  placeholder?: string;
  value: string;
  type?: HTMLInputTypeAttribute;
}>;
//ユニークなinputのID生成
function generateId(label: string): string {
  return `input-${label.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(2, 11)}`;
}

export default function TextInput({
  label,
  value,
  onChange,
  placeholder = '',
  'data-test-id': dataTestId,
  type = 'text',
}: Props): JSX.Element {
  const [inputId, _setInputId] = useState(generateId(label));

  return (
    <div className="Input__wrapper">
      <label className="Input__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        className="Input__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        data-test-id={dataTestId}
      />
    </div>
  );
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CSSProperties, JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';

import Modal from '../ui/Modal';

export default function useModal(): [
  JSX.Element | null,
  (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
    closeOnClickOutside?: boolean,
    contentStyle?: CSSProperties,
  ) => void,
] {
  const [modalContent, setModalContent] = useState<null | {
    closeOnClickOutside: boolean;
    content: JSX.Element;
    contentStyle?: CSSProperties;
    title: string;
  }>(null);

  const onClose = useCallback(() => {
    setModalContent(null);
  }, []);

  const modal = useMemo(() => {
    if (modalContent === null) {
      return null;
    }
    const { title, content, closeOnClickOutside, contentStyle } = modalContent;
    return (
      <Modal onClose={onClose} title={title} closeOnClickOutside={closeOnClickOutside} contentStyle={contentStyle}>
        {content}
      </Modal>
    );
  }, [modalContent, onClose]);

  const showModal = useCallback(
    (
      title: string,
      // eslint-disable-next-line no-shadow
      getContent: (onClose: () => void) => JSX.Element,
      closeOnClickOutside = false,
      contentStyle?: CSSProperties,
    ) => {
      setModalContent({
        closeOnClickOutside,
        content: getContent(onClose),
        contentStyle,
        title,
      });
    },
    [onClose],
  );

  return [modal, showModal];
}

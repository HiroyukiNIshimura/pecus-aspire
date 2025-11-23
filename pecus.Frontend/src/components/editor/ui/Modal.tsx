/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from "react";

import { isDOMNode } from "lexical";
import * as React from "react";
import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import CloseIcon from "@mui/icons-material/Close";

function PortalImpl({
  onClose,
  children,
  title,
  closeOnClickOutside,
}: {
  children: ReactNode;
  closeOnClickOutside: boolean;
  onClose: () => void;
  title: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalRef.current !== null) {
      modalRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let modalOverlayElement: HTMLElement | null = null;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target;
      if (
        modalRef.current !== null &&
        isDOMNode(target) &&
        !modalRef.current.contains(target) &&
        closeOnClickOutside
      ) {
        onClose();
      }
    };
    const modelElement = modalRef.current;
    if (modelElement !== null) {
      modalOverlayElement = modelElement.parentElement;
      if (modalOverlayElement !== null) {
        modalOverlayElement.addEventListener("click", clickOutsideHandler);
      }
    }

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
      if (modalOverlayElement !== null) {
        modalOverlayElement?.removeEventListener("click", clickOutsideHandler);
      }
    };
  }, [closeOnClickOutside, onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" role="dialog"/>

      {/* モーダルコンテンツ */}
      <div className="fixed inset-0 z-60 flex items-center justify-center p-4" tabIndex={-1} ref={modalRef}>
        <div className="bg-base-100 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
        >
          {/* モーダルヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-base-300">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {title}
            </h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-circle ms-2"
              onClick={onClose}
              aria-label="閉じる"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}

export default function Modal({
  onClose,
  children,
  title,
  closeOnClickOutside = false,
}: {
  children: ReactNode;
  closeOnClickOutside?: boolean;
  onClose: () => void;
  title: string;
}): JSX.Element {
  return createPortal(
    <PortalImpl
      onClose={onClose}
      title={title}
      closeOnClickOutside={closeOnClickOutside}
    >
      {children}
    </PortalImpl>,
    document.body,
  );
}

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX } from "react";

import "react-day-picker/style.css";
import "./DateTimeNode.css";

import {
  autoUpdate,
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { setHours, setMinutes } from "date-fns";
import { $getNodeByKey, type NodeKey } from "lexical";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

import { $isDateTimeNode, type DateTimeNode } from "./DateTimeNode";

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function DateTimeComponent({
  dateTime,
  nodeKey,
}: {
  dateTime: Date | undefined;
  nodeKey: NodeKey;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const [selected, setSelected] = useState(dateTime);
  const [includeTime, setIncludeTime] = useState(() => {
    if (dateTime === undefined) {
      return false;
    }
    const hours = dateTime?.getHours();
    const minutes = dateTime?.getMinutes();
    return hours !== 0 || minutes !== 0;
  });
  const [timeValue, setTimeValue] = useState(() => {
    if (dateTime === undefined) {
      return "00:00";
    }
    const hours = dateTime?.getHours();
    const minutes = dateTime?.getMinutes();
    if (hours !== 0 || minutes !== 0) {
      return `${hours?.toString().padStart(2, "0")}:${minutes?.toString().padStart(2, "0")}`;
    }
    return "00:00";
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isNodeSelected, _setNodeSelected, _clearNodeSelection] = useLexicalNodeSelection(nodeKey);

  const { refs, floatingStyles, context } = useFloating({
    elements: {
      reference: ref.current,
    },
    middleware: [
      offset(5),
      flip({
        fallbackPlacements: ["top-start"],
      }),
      shift({ padding: 10 }),
    ],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement: "bottom-start",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
  });

  const role = useRole(context, { role: "dialog" });
  const dismiss = useDismiss(context);

  const { getFloatingProps } = useInteractions([role, dismiss]);

  useEffect(() => {
    const dateTimePillRef = ref.current as HTMLElement | null;
    function onClick(e: MouseEvent) {
      e.preventDefault();
      setIsOpen(true);
    }

    if (dateTimePillRef) {
      dateTimePillRef.addEventListener("click", onClick);
    }

    return () => {
      if (dateTimePillRef) {
        dateTimePillRef.removeEventListener("click", onClick);
      }
    };
  }, []);

  const withDateTimeNode = (cb: (node: DateTimeNode) => void, onUpdate?: () => void): void => {
    editor.update(
      () => {
        const node = $getNodeByKey(nodeKey);
        if ($isDateTimeNode(node)) {
          cb(node);
        }
      },
      { onUpdate },
    );
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    withDateTimeNode((node) => {
      if (e.target.checked) {
        setIncludeTime(true);
      } else {
        if (selected) {
          const newSelectedDate = setHours(setMinutes(selected, 0), 0);
          node.setDateTime(newSelectedDate);
        }
        setIncludeTime(false);
        setTimeValue("00:00");
      }
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    withDateTimeNode((node) => {
      const time = e.target.value;
      if (!selected) {
        setTimeValue(time);
        return;
      }
      const [hours, minutes] = time.split(":").map((str: string) => parseInt(str, 10));
      const newSelectedDate = setHours(setMinutes(selected, minutes), hours);
      setSelected(newSelectedDate);
      node.setDateTime(newSelectedDate);
      setTimeValue(time);
    });
  };

  const handleDaySelect = (date: Date | undefined) => {
    withDateTimeNode((node) => {
      if (!timeValue || !date) {
        setSelected(date);
        return;
      }
      const [hours, minutes] = timeValue.split(":").map((str) => parseInt(str, 10));
      const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
      node.setDateTime(newDate);
      setSelected(newDate);
    });
  };

  return (
    <div
      className={`dateTimePill ${isNodeSelected ? "selected" : ""}`}
      ref={ref}
      style={{ cursor: "pointer", width: "fit-content" }}
    >
      {dateTime?.toDateString() + (includeTime ? ` ${timeValue}` : "") || "Invalid Date"}
      {isOpen && (
        <FloatingPortal>
          <FloatingOverlay
            lockScroll={true}
            style={{
              zIndex: 2000,
            }}
          >
            <FloatingFocusManager context={context} initialFocus={-1}>
              <div
                className={"notion-like-editor dateTimePicker"}
                ref={refs.setFloating}
                style={{
                  ...floatingStyles,
                  zIndex: 2000,
                }}
                {...getFloatingProps()}
              >
                <DayPicker mode="single" selected={selected} onSelect={handleDaySelect} />
                <div className="includeTime">
                  <label htmlFor="includeTime">
                    <input id="includeTime" type="checkbox" checked={includeTime} onChange={handleCheckboxChange} />
                    Include time
                  </label>
                </div>
                {includeTime && (
                  <input
                    id="time"
                    type="time"
                    value={timeValue}
                    onChange={handleTimeChange}
                    style={{
                      marginTop: "8px",
                      padding: "4px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                  />
                )}
                <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>{userTimeZone}</p>
              </div>
            </FloatingFocusManager>
          </FloatingOverlay>
        </FloatingPortal>
      )}
    </div>
  );
}

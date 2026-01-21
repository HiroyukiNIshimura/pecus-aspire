var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/nodes/DateTimeNode/DateTimeNode.css
var init_DateTimeNode = __esm({
  "src/nodes/DateTimeNode/DateTimeNode.css"() {
  }
});

// src/nodes/DateTimeNode/DateTimeComponent.tsx
var DateTimeComponent_exports = {};
__export(DateTimeComponent_exports, {
  default: () => DateTimeComponent
});
import "react-day-picker/style.css";
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
  useRole
} from "@floating-ui/react";
import { useLexicalComposerContext as useLexicalComposerContext2 } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { setHours, setMinutes } from "date-fns";
import { $getNodeByKey as $getNodeByKey2 } from "lexical";
import { useEffect as useEffect3, useRef, useState as useState2 } from "react";
import { DayPicker } from "react-day-picker";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
function DateTimeComponent({
  dateTime,
  nodeKey
}) {
  const [editor] = useLexicalComposerContext2();
  const [isOpen, setIsOpen] = useState2(false);
  const ref = useRef(null);
  const [selected, setSelected] = useState2(dateTime);
  const [includeTime, setIncludeTime] = useState2(() => {
    if (dateTime === void 0) {
      return false;
    }
    const hours = dateTime?.getHours();
    const minutes = dateTime?.getMinutes();
    return hours !== 0 || minutes !== 0;
  });
  const [timeValue, setTimeValue] = useState2(() => {
    if (dateTime === void 0) {
      return "00:00";
    }
    const hours = dateTime?.getHours();
    const minutes = dateTime?.getMinutes();
    if (hours !== 0 || minutes !== 0) {
      return `${hours?.toString().padStart(2, "0")}:${minutes?.toString().padStart(2, "0")}`;
    }
    return "00:00";
  });
  const [isNodeSelected, _setNodeSelected, _clearNodeSelection] = useLexicalNodeSelection(nodeKey);
  const { refs, floatingStyles, context } = useFloating({
    elements: {
      reference: ref.current
    },
    middleware: [
      offset(5),
      flip({
        fallbackPlacements: ["top-start"]
      }),
      shift({ padding: 10 })
    ],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement: "bottom-start",
    strategy: "fixed",
    whileElementsMounted: autoUpdate
  });
  const role = useRole(context, { role: "dialog" });
  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([role, dismiss]);
  useEffect3(() => {
    const dateTimePillRef = ref.current;
    function onClick(e) {
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
  const withDateTimeNode = (cb, onUpdate) => {
    editor.update(
      () => {
        const node = $getNodeByKey2(nodeKey);
        if ($isDateTimeNode(node)) {
          cb(node);
        }
      },
      { onUpdate }
    );
  };
  const handleCheckboxChange = (e) => {
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
  const handleTimeChange = (e) => {
    withDateTimeNode((node) => {
      const time = e.target.value;
      if (!selected) {
        setTimeValue(time);
        return;
      }
      const [hours, minutes] = time.split(":").map((str) => parseInt(str, 10));
      const newSelectedDate = setHours(setMinutes(selected, minutes), hours);
      setSelected(newSelectedDate);
      node.setDateTime(newSelectedDate);
      setTimeValue(time);
    });
  };
  const handleDaySelect = (date) => {
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
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `dateTimePill ${isNodeSelected ? "selected" : ""}`,
      ref,
      style: { cursor: "pointer", width: "fit-content" },
      children: [
        dateTime?.toLocaleDateString(void 0, options) + (includeTime ? ` ${timeValue}` : "") || "Invalid Date",
        isOpen && /* @__PURE__ */ jsx2(FloatingPortal, { children: /* @__PURE__ */ jsx2(
          FloatingOverlay,
          {
            lockScroll: true,
            style: {
              zIndex: 2e3
            },
            children: /* @__PURE__ */ jsx2(FloatingFocusManager, { context, initialFocus: -1, children: /* @__PURE__ */ jsxs(
              "div",
              {
                className: "notion-like-editor dateTimePicker",
                ref: refs.setFloating,
                style: {
                  ...floatingStyles,
                  zIndex: 2e3
                },
                ...getFloatingProps(),
                children: [
                  /* @__PURE__ */ jsx2(DayPicker, { mode: "single", selected, onSelect: handleDaySelect }),
                  /* @__PURE__ */ jsx2("div", { className: "includeTime", children: /* @__PURE__ */ jsxs("label", { htmlFor: "includeTime", style: { display: "inline-flex", alignItems: "center", gap: "6px" }, children: [
                    /* @__PURE__ */ jsx2("input", { id: "includeTime", type: "checkbox", checked: includeTime, onChange: handleCheckboxChange }),
                    /* @__PURE__ */ jsx2("span", { children: "Include time" })
                  ] }) }),
                  includeTime && /* @__PURE__ */ jsx2(
                    "input",
                    {
                      id: "time",
                      type: "time",
                      value: timeValue,
                      onChange: handleTimeChange,
                      style: {
                        marginTop: "8px",
                        padding: "4px",
                        border: "1px solid #ccc",
                        borderRadius: "4px"
                      }
                    }
                  ),
                  /* @__PURE__ */ jsx2("p", { style: { fontSize: "12px", color: "#666", marginTop: "8px" }, children: userTimeZone })
                ]
              }
            ) })
          }
        ) })
      ]
    }
  );
}
var userTimeZone;
var init_DateTimeComponent = __esm({
  "src/nodes/DateTimeNode/DateTimeComponent.tsx"() {
    "use strict";
    init_DateTimeNode();
    init_DateTimeNode2();
    userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
});

// src/nodes/DateTimeNode/DateTimeNode.tsx
import {
  $getState,
  $setState,
  buildImportMap as buildImportMap2,
  createState,
  DecoratorNode
} from "lexical";
import * as React from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
function $convertDateTimeElement(domNode) {
  const dateTimeValue = domNode.getAttribute("data-lexical-datetime");
  if (dateTimeValue) {
    const node2 = $createDateTimeNode(new Date(Date.parse(dateTimeValue)));
    return { node: node2 };
  }
  const gDocsDateTimePayload = domNode.getAttribute("data-rich-links");
  if (!gDocsDateTimePayload) {
    return null;
  }
  const parsed = JSON.parse(gDocsDateTimePayload);
  const parsedDate = Date.parse(parsed?.dat_df?.dfie_dt || "");
  if (Number.isNaN(parsedDate)) {
    return null;
  }
  const node = $createDateTimeNode(new Date(parsedDate));
  return { node };
}
function $createDateTimeNode(dateTime) {
  return new DateTimeNode().setDateTime(dateTime);
}
function $isDateTimeNode(node) {
  return node instanceof DateTimeNode;
}
var DateTimeComponent2, getDateTimeText, dateTimeState, DateTimeNode;
var init_DateTimeNode2 = __esm({
  "src/nodes/DateTimeNode/DateTimeNode.tsx"() {
    "use strict";
    DateTimeComponent2 = React.lazy(() => Promise.resolve().then(() => (init_DateTimeComponent(), DateTimeComponent_exports)));
    getDateTimeText = (dateTime) => {
      if (dateTime === void 0) {
        return "";
      }
      const hours = dateTime?.getHours();
      const minutes = dateTime?.getMinutes();
      return dateTime.toDateString() + (hours === 0 && minutes === 0 ? "" : ` ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
    };
    dateTimeState = createState("dateTime", {
      parse: (v) => new Date(v),
      unparse: (v) => v.toISOString()
    });
    DateTimeNode = class extends DecoratorNode {
      $config() {
        return this.config("datetime", {
          extends: DecoratorNode,
          importDOM: buildImportMap2({
            span: (domNode) => domNode.getAttribute("data-lexical-datetime") !== null || // GDocs Support
            domNode.getAttribute("data-rich-links") !== null && JSON.parse(domNode.getAttribute("data-rich-links") || "{}").type === "date" ? {
              conversion: $convertDateTimeElement,
              priority: 2
            } : null
          }),
          stateConfigs: [{ flat: true, stateConfig: dateTimeState }]
        });
      }
      getDateTime() {
        return $getState(this, dateTimeState);
      }
      setDateTime(valueOrUpdater) {
        return $setState(this, dateTimeState, valueOrUpdater);
      }
      getTextContent() {
        const dateTime = this.getDateTime();
        return getDateTimeText(dateTime);
      }
      exportDOM() {
        const element = document.createElement("span");
        element.textContent = getDateTimeText(this.getDateTime());
        element.setAttribute("data-lexical-datetime", this.getDateTime()?.toString() || "");
        return { element };
      }
      createDOM() {
        const element = document.createElement("span");
        element.setAttribute("data-lexical-datetime", this.getDateTime()?.toString() || "");
        element.style.display = "inline-block";
        return element;
      }
      updateDOM() {
        return false;
      }
      isInline() {
        return true;
      }
      decorate() {
        return /* @__PURE__ */ jsx3(DateTimeComponent2, { dateTime: this.getDateTime(), nodeKey: this.__key });
      }
    };
  }
});

// src/nodes/EmojiNode.tsx
import { $applyNodeReplacement, TextNode as TextNode2 } from "lexical";
function $isEmojiNode(node) {
  return node instanceof EmojiNode;
}
function $createEmojiNode(className, emojiText) {
  const node = new EmojiNode(className, emojiText).setMode("token");
  return $applyNodeReplacement(node);
}
var EmojiNode;
var init_EmojiNode = __esm({
  "src/nodes/EmojiNode.tsx"() {
    "use strict";
    EmojiNode = class _EmojiNode extends TextNode2 {
      __className;
      static getType() {
        return "emoji";
      }
      static clone(node) {
        return new _EmojiNode(node.__className, node.__text, node.__key);
      }
      constructor(className, text, key) {
        super(text, key);
        this.__className = className;
      }
      createDOM(config) {
        const dom = document.createElement("span");
        const inner = super.createDOM(config);
        dom.className = this.__className;
        inner.className = "emoji-inner";
        dom.appendChild(inner);
        return dom;
      }
      updateDOM(prevNode, dom, config) {
        const inner = dom.firstChild;
        if (inner === null) {
          return true;
        }
        super.updateDOM(prevNode, inner, config);
        return false;
      }
      static importJSON(serializedNode) {
        return $createEmojiNode(serializedNode.className, serializedNode.text).updateFromJSON(serializedNode);
      }
      exportJSON() {
        return {
          ...super.exportJSON(),
          className: this.getClassName()
        };
      }
      getClassName() {
        const self = this.getLatest();
        return self.__className;
      }
    };
  }
});

// ../../node_modules/react-error-boundary/dist/react-error-boundary.js
import { createContext as l, Component as y, createElement as d, useContext as f, useState as p, useMemo as E, forwardRef as B } from "react";
function C(r = [], t = []) {
  return r.length !== t.length || r.some((e, o) => !Object.is(e, t[o]));
}
var h, c, m;
var init_react_error_boundary = __esm({
  "../../node_modules/react-error-boundary/dist/react-error-boundary.js"() {
    "use strict";
    "use client";
    h = l(null);
    c = {
      didCatch: false,
      error: null
    };
    m = class extends y {
      constructor(t) {
        super(t), this.resetErrorBoundary = this.resetErrorBoundary.bind(this), this.state = c;
      }
      static getDerivedStateFromError(t) {
        return { didCatch: true, error: t };
      }
      resetErrorBoundary(...t) {
        const { error: e } = this.state;
        e !== null && (this.props.onReset?.({
          args: t,
          reason: "imperative-api"
        }), this.setState(c));
      }
      componentDidCatch(t, e) {
        this.props.onError?.(t, e);
      }
      componentDidUpdate(t, e) {
        const { didCatch: o } = this.state, { resetKeys: n } = this.props;
        o && e.error !== null && C(t.resetKeys, n) && (this.props.onReset?.({
          next: n,
          prev: t.resetKeys,
          reason: "keys"
        }), this.setState(c));
      }
      render() {
        const { children: t, fallbackRender: e, FallbackComponent: o, fallback: n } = this.props, { didCatch: s, error: a } = this.state;
        let i = t;
        if (s) {
          const u = {
            error: a,
            resetErrorBoundary: this.resetErrorBoundary
          };
          if (typeof e == "function")
            i = e(u);
          else if (o)
            i = d(o, u);
          else if (n !== void 0)
            i = n;
          else
            throw a;
        }
        return d(
          h.Provider,
          {
            value: {
              didCatch: s,
              error: a,
              resetErrorBoundary: this.resetErrorBoundary
            }
          },
          i
        );
      }
    };
  }
});

// src/ui/EquationEditor.css
var init_EquationEditor = __esm({
  "src/ui/EquationEditor.css"() {
  }
});

// src/ui/EquationEditor.tsx
import { isHTMLElement as isHTMLElement2 } from "lexical";
import { forwardRef } from "react";
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function EquationEditor({ equation, setEquation, inline }, forwardedRef) {
  const onChange = (event) => {
    setEquation(event.target.value);
  };
  return inline && isHTMLElement2(forwardedRef) ? /* @__PURE__ */ jsxs2("span", { className: "EquationEditor_inputBackground", children: [
    /* @__PURE__ */ jsx4("span", { className: "EquationEditor_dollarSign", children: "$" }),
    /* @__PURE__ */ jsx4(
      "input",
      {
        className: "EquationEditor_inlineEditor",
        value: equation,
        onChange,
        ref: forwardedRef
      }
    ),
    /* @__PURE__ */ jsx4("span", { className: "EquationEditor_dollarSign", children: "$" })
  ] }) : /* @__PURE__ */ jsxs2("div", { className: "EquationEditor_inputBackground", children: [
    /* @__PURE__ */ jsx4("span", { className: "EquationEditor_dollarSign", children: "$$\n" }),
    /* @__PURE__ */ jsx4(
      "textarea",
      {
        className: "EquationEditor_blockEditor",
        value: equation,
        onChange,
        ref: forwardedRef
      }
    ),
    /* @__PURE__ */ jsx4("span", { className: "EquationEditor_dollarSign", children: "\n$$" })
  ] });
}
var EquationEditor_default;
var init_EquationEditor2 = __esm({
  "src/ui/EquationEditor.tsx"() {
    "use strict";
    init_EquationEditor();
    EquationEditor_default = forwardRef(EquationEditor);
  }
});

// src/ui/KatexRenderer.tsx
import katex from "katex";
import { useEffect as useEffect4, useRef as useRef2 } from "react";
import { Fragment, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function KatexRenderer({
  equation,
  inline,
  onDoubleClick
}) {
  const katexElementRef = useRef2(null);
  useEffect4(() => {
    const katexElement = katexElementRef.current;
    if (katexElement !== null) {
      katex.render(equation, katexElement, {
        displayMode: !inline,
        // true === block display //
        errorColor: "#cc0000",
        output: "html",
        strict: "warn",
        throwOnError: false,
        trust: false
      });
    }
  }, [equation, inline]);
  return (
    // We use an empty image tag either side to ensure Android doesn't try and compose from the
    // inner text from Katex. There didn't seem to be any other way of making this work,
    // without having a physical space.
    /* @__PURE__ */ jsxs3(Fragment, { children: [
      /* @__PURE__ */ jsx5(
        "img",
        {
          src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          width: "0",
          height: "0",
          alt: ""
        }
      ),
      /* @__PURE__ */ jsx5("span", { role: "button", tabIndex: -1, onDoubleClick, ref: katexElementRef }),
      /* @__PURE__ */ jsx5(
        "img",
        {
          src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          width: "0",
          height: "0",
          alt: ""
        }
      )
    ] })
  );
}
var init_KatexRenderer = __esm({
  "src/ui/KatexRenderer.tsx"() {
    "use strict";
  }
});

// src/nodes/EquationComponent.tsx
var EquationComponent_exports = {};
__export(EquationComponent_exports, {
  default: () => EquationComponent
});
import { useLexicalComposerContext as useLexicalComposerContext3 } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { mergeRegister as mergeRegister2 } from "@lexical/utils";
import {
  $getNodeByKey as $getNodeByKey3,
  $getSelection as $getSelection2,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import { useCallback as useCallback3, useEffect as useEffect5, useRef as useRef3, useState as useState3 } from "react";
import { Fragment as Fragment2, jsx as jsx6 } from "react/jsx-runtime";
function EquationComponent({ equation, inline, nodeKey }) {
  const [editor] = useLexicalComposerContext3();
  const isEditable = useLexicalEditable();
  const [equationValue, setEquationValue] = useState3(equation);
  const [showEquationEditor, setShowEquationEditor] = useState3(false);
  const inputRef = useRef3(null);
  const onHide = useCallback3(
    (restoreSelection) => {
      setShowEquationEditor(false);
      editor.update(() => {
        const node = $getNodeByKey3(nodeKey);
        if ($isEquationNode(node)) {
          node.setEquation(equationValue);
          if (restoreSelection) {
            node.selectNext(0, 0);
          }
        }
      });
    },
    [editor, equationValue, nodeKey]
  );
  useEffect5(() => {
    if (!showEquationEditor && equationValue !== equation) {
      setEquationValue(equation);
    }
  }, [showEquationEditor, equation, equationValue]);
  useEffect5(() => {
    if (!isEditable) {
      return;
    }
    if (showEquationEditor) {
      return mergeRegister2(
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          (_payload) => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem !== activeElement) {
              onHide();
            }
            return false;
          },
          COMMAND_PRIORITY_HIGH
        ),
        editor.registerCommand(
          KEY_ESCAPE_COMMAND,
          (_payload) => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem === activeElement) {
              onHide(true);
              return true;
            }
            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      );
    } else {
      return editor.registerUpdateListener(({ editorState }) => {
        const isSelected = editorState.read(() => {
          const selection = $getSelection2();
          return $isNodeSelection(selection) && selection.has(nodeKey) && selection.getNodes().length === 1;
        });
        if (isSelected) {
          setShowEquationEditor(true);
        }
      });
    }
  }, [editor, nodeKey, onHide, showEquationEditor, isEditable]);
  return /* @__PURE__ */ jsx6(Fragment2, { children: showEquationEditor && isEditable ? /* @__PURE__ */ jsx6(EquationEditor_default, { equation: equationValue, setEquation: setEquationValue, inline, ref: inputRef }) : /* @__PURE__ */ jsx6(m, { onError: (e) => editor._onError(e), fallback: null, children: /* @__PURE__ */ jsx6(
    KatexRenderer,
    {
      equation: equationValue,
      inline,
      onDoubleClick: () => {
        if (isEditable) {
          setShowEquationEditor(true);
        }
      }
    }
  ) }) });
}
var init_EquationComponent = __esm({
  "src/nodes/EquationComponent.tsx"() {
    "use strict";
    init_react_error_boundary();
    init_EquationEditor2();
    init_KatexRenderer();
    init_EquationNode();
  }
});

// src/nodes/EquationNode.tsx
import katex2 from "katex";
import { $applyNodeReplacement as $applyNodeReplacement2, DecoratorNode as DecoratorNode2 } from "lexical";
import * as React2 from "react";
import { jsx as jsx7 } from "react/jsx-runtime";
function $convertEquationElement(domNode) {
  let equation = domNode.getAttribute("data-lexical-equation");
  const inline = domNode.getAttribute("data-lexical-inline") === "true";
  equation = atob(equation || "");
  if (equation) {
    const node = $createEquationNode(equation, inline);
    return { node };
  }
  return null;
}
function $createEquationNode(equation = "", inline = false) {
  const equationNode = new EquationNode(equation, inline);
  return $applyNodeReplacement2(equationNode);
}
function $isEquationNode(node) {
  return node instanceof EquationNode;
}
var EquationComponent2, EquationNode;
var init_EquationNode = __esm({
  "src/nodes/EquationNode.tsx"() {
    "use strict";
    EquationComponent2 = React2.lazy(() => Promise.resolve().then(() => (init_EquationComponent(), EquationComponent_exports)));
    EquationNode = class _EquationNode extends DecoratorNode2 {
      __equation;
      __inline;
      static getType() {
        return "equation";
      }
      static clone(node) {
        return new _EquationNode(node.__equation, node.__inline, node.__key);
      }
      constructor(equation, inline, key) {
        super(key);
        this.__equation = equation;
        this.__inline = inline ?? false;
      }
      static importJSON(serializedNode) {
        return $createEquationNode(serializedNode.equation, serializedNode.inline).updateFromJSON(serializedNode);
      }
      exportJSON() {
        return {
          ...super.exportJSON(),
          equation: this.getEquation(),
          inline: this.__inline
        };
      }
      createDOM(_config) {
        const element = document.createElement(this.__inline ? "span" : "div");
        element.className = "editor-equation";
        return element;
      }
      exportDOM() {
        const element = document.createElement(this.__inline ? "span" : "div");
        const equation = btoa(this.__equation);
        element.setAttribute("data-lexical-equation", equation);
        element.setAttribute("data-lexical-inline", `${this.__inline}`);
        katex2.render(this.__equation, element, {
          displayMode: !this.__inline,
          // true === block display //
          errorColor: "#cc0000",
          output: "html",
          strict: "warn",
          throwOnError: false,
          trust: false
        });
        return { element };
      }
      static importDOM() {
        return {
          div: (domNode) => {
            if (!domNode.hasAttribute("data-lexical-equation")) {
              return null;
            }
            return {
              conversion: $convertEquationElement,
              priority: 2
            };
          },
          span: (domNode) => {
            if (!domNode.hasAttribute("data-lexical-equation")) {
              return null;
            }
            return {
              conversion: $convertEquationElement,
              priority: 1
            };
          }
        };
      }
      updateDOM(prevNode) {
        return this.__inline !== prevNode.__inline;
      }
      getTextContent() {
        return this.__equation;
      }
      getEquation() {
        return this.__equation;
      }
      setEquation(equation) {
        const writable = this.getWritable();
        writable.__equation = equation;
      }
      decorate() {
        return /* @__PURE__ */ jsx7(EquationComponent2, { equation: this.__equation, inline: this.__inline, nodeKey: this.__key });
      }
    };
  }
});

// src/nodes/KeywordNode.ts
import { $applyNodeReplacement as $applyNodeReplacement3, TextNode as TextNode3 } from "lexical";
function $createKeywordNode(keyword = "") {
  return $applyNodeReplacement3(new KeywordNode(keyword));
}
function $isKeywordNode(node) {
  return node instanceof KeywordNode;
}
var KeywordNode;
var init_KeywordNode = __esm({
  "src/nodes/KeywordNode.ts"() {
    "use strict";
    KeywordNode = class _KeywordNode extends TextNode3 {
      static getType() {
        return "keyword";
      }
      static clone(node) {
        return new _KeywordNode(node.__text, node.__key);
      }
      static importJSON(serializedNode) {
        return $createKeywordNode().updateFromJSON(serializedNode);
      }
      createDOM(config) {
        const dom = super.createDOM(config);
        dom.style.cursor = "default";
        dom.className = "keyword";
        return dom;
      }
      canInsertTextBefore() {
        return false;
      }
      canInsertTextAfter() {
        return false;
      }
      isTextEntity() {
        return true;
      }
    };
  }
});

// src/nodes/ImageNode.css
var init_ImageNode = __esm({
  "src/nodes/ImageNode.css"() {
  }
});

// src/context/SharedHistoryContext.tsx
import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import { createContext as createContext2, useContext as useContext2, useMemo as useMemo2 } from "react";
import { jsx as jsx9 } from "react/jsx-runtime";
var Context2, useSharedHistoryContext;
var init_SharedHistoryContext = __esm({
  "src/context/SharedHistoryContext.tsx"() {
    "use strict";
    Context2 = createContext2({});
    useSharedHistoryContext = () => {
      return useContext2(Context2);
    };
  }
});

// src/images/image-broken.svg
var image_broken_default;
var init_image_broken = __esm({
  "src/images/image-broken.svg"() {
    image_broken_default = 'data:image/svg+xml,<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->%0A<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">%0A    <path d="M22 3H2v18h20v-2h-2v-2h2v-2h-2v-2h2v-2h-2V9h2V7h-2V5h2V3zm-2 4v2h-2v2h2v2h-2v2h2v2h-2v2H4V5h14v2h2zm-6 2h-2v2h-2v2H8v2H6v2h2v-2h2v-2h2v-2h2v2h2v-2h-2V9zM6 7h2v2H6V7z" fill="%23000000"/>%0A</svg>';
  }
});

// src/plugins/EmojisPlugin/index.ts
import { useLexicalComposerContext as useLexicalComposerContext4 } from "@lexical/react/LexicalComposerContext";
import { TextNode as TextNode4 } from "lexical";
import { useEffect as useEffect6 } from "react";
function $findAndTransformEmoji(node) {
  const text = node.getTextContent();
  for (let i = 0; i < text.length; i++) {
    const emojiData = emojis.get(text[i]) || emojis.get(text.slice(i, i + 2));
    if (emojiData !== void 0) {
      const [emojiStyle, emojiText] = emojiData;
      let targetNode;
      if (i === 0) {
        [targetNode] = node.splitText(i + 2);
      } else {
        [, targetNode] = node.splitText(i, i + 2);
      }
      const emojiNode = $createEmojiNode(emojiStyle, emojiText);
      targetNode.replace(emojiNode);
      return emojiNode;
    }
  }
  return null;
}
function $textNodeTransform(node) {
  let targetNode = node;
  while (targetNode !== null) {
    if (!targetNode.isSimpleText()) {
      return;
    }
    targetNode = $findAndTransformEmoji(targetNode);
  }
}
function useEmojis(editor) {
  useEffect6(() => {
    if (!editor.hasNodes([EmojiNode])) {
      throw new Error("EmojisPlugin: EmojiNode not registered on editor");
    }
    return editor.registerNodeTransform(TextNode4, $textNodeTransform);
  }, [editor]);
}
function EmojisPlugin() {
  const [editor] = useLexicalComposerContext4();
  useEmojis(editor);
  return null;
}
var emojis;
var init_EmojisPlugin = __esm({
  "src/plugins/EmojisPlugin/index.ts"() {
    "use strict";
    init_EmojiNode();
    emojis = /* @__PURE__ */ new Map([
      [":)", ["emoji happysmile", "\u{1F642}"]],
      [":D", ["emoji veryhappysmile", "\u{1F600}"]],
      [":(", ["emoji unhappysmile", "\u{1F641}"]],
      ["<3", ["emoji heart", "\u2764"]]
    ]);
  }
});

// src/utils/url.ts
function validateUrl(url) {
  return url === "https://" || urlRegExp.test(url);
}
var urlRegExp;
var init_url = __esm({
  "src/utils/url.ts"() {
    "use strict";
    urlRegExp = new RegExp(
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
    );
  }
});

// src/plugins/LinkPlugin/index.tsx
import { LinkPlugin as LexicalLinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { jsx as jsx10 } from "react/jsx-runtime";
function LinkPlugin({ hasLinkAttributes = false }) {
  return /* @__PURE__ */ jsx10(
    LexicalLinkPlugin,
    {
      validateUrl,
      attributes: hasLinkAttributes ? {
        rel: "noopener noreferrer",
        target: "_blank"
      } : void 0
    }
  );
}
var init_LinkPlugin = __esm({
  "src/plugins/LinkPlugin/index.tsx"() {
    "use strict";
    init_url();
  }
});

// src/nodes/MentionNode.ts
import {
  $applyNodeReplacement as $applyNodeReplacement4,
  TextNode as TextNode5
} from "lexical";
function $convertMentionElement(domNode) {
  const textContent = domNode.textContent;
  const mentionName = domNode.getAttribute("data-lexical-mention-name");
  if (textContent !== null) {
    const node = $createMentionNode(typeof mentionName === "string" ? mentionName : textContent, textContent);
    return {
      node
    };
  }
  return null;
}
function $createMentionNode(mentionName, textContent) {
  const mentionNode = new MentionNode(mentionName, textContent ?? mentionName);
  mentionNode.setMode("segmented").toggleDirectionless();
  return $applyNodeReplacement4(mentionNode);
}
function $isMentionNode(node) {
  return node instanceof MentionNode;
}
var mentionStyle, MentionNode;
var init_MentionNode = __esm({
  "src/nodes/MentionNode.ts"() {
    "use strict";
    mentionStyle = "background-color: rgba(24, 119, 232, 0.2)";
    MentionNode = class _MentionNode extends TextNode5 {
      __mention;
      static getType() {
        return "mention";
      }
      static clone(node) {
        return new _MentionNode(node.__mention, node.__text, node.__key);
      }
      static importJSON(serializedNode) {
        return $createMentionNode(serializedNode.mentionName).updateFromJSON(serializedNode);
      }
      constructor(mentionName, text, key) {
        super(text ?? mentionName, key);
        this.__mention = mentionName;
      }
      exportJSON() {
        return {
          ...super.exportJSON(),
          mentionName: this.__mention
        };
      }
      createDOM(config) {
        const dom = super.createDOM(config);
        dom.style.cssText = mentionStyle;
        dom.className = "mention";
        dom.spellcheck = false;
        return dom;
      }
      exportDOM() {
        const element = document.createElement("span");
        element.setAttribute("data-lexical-mention", "true");
        if (this.__text !== this.__mention) {
          element.setAttribute("data-lexical-mention-name", this.__mention);
        }
        element.textContent = this.__text;
        return { element };
      }
      static importDOM() {
        return {
          span: (domNode) => {
            if (!domNode.hasAttribute("data-lexical-mention")) {
              return null;
            }
            return {
              conversion: $convertMentionElement,
              priority: 1
            };
          }
        };
      }
      isTextEntity() {
        return true;
      }
      canInsertTextBefore() {
        return false;
      }
      canInsertTextAfter() {
        return false;
      }
    };
  }
});

// src/plugins/MentionsPlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext5 } from "@lexical/react/LexicalComposerContext";
import { MenuOption } from "@lexical/react/LexicalNodeMenuPlugin";
import {
  LexicalTypeaheadMenuPlugin,
  useBasicTypeaheadTriggerMatch
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { useCallback as useCallback4, useEffect as useEffect7, useMemo as useMemo3, useState as useState4 } from "react";
import * as ReactDOM from "react-dom";
import { jsx as jsx11, jsxs as jsxs4 } from "react/jsx-runtime";
function useMentionLookupService(mentionString) {
  const [results, setResults] = useState4([]);
  useEffect7(() => {
    const cachedResults = mentionsCache.get(mentionString);
    if (mentionString == null) {
      setResults([]);
      return;
    }
    if (cachedResults === null) {
      return;
    } else if (cachedResults !== void 0) {
      setResults(cachedResults);
      return;
    }
    mentionsCache.set(mentionString, null);
    dummyLookupService.search(mentionString, (newResults) => {
      mentionsCache.set(mentionString, newResults);
      setResults(newResults);
    });
  }, [mentionString]);
  return results;
}
function checkForAtSignMentions(text, minMatchLength) {
  let match = AtSignMentionsRegex.exec(text);
  if (match === null) {
    match = AtSignMentionsRegexAliasRegex.exec(text);
  }
  if (match !== null) {
    const maybeLeadingWhitespace = match[1];
    const matchingString = match[3];
    if (matchingString.length >= minMatchLength) {
      return {
        leadOffset: match.index + maybeLeadingWhitespace.length,
        matchingString,
        replaceableString: match[2]
      };
    }
  }
  return null;
}
function getPossibleQueryMatch(text) {
  return checkForAtSignMentions(text, 1);
}
function MentionsTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option
}) {
  let className = "item";
  if (isSelected) {
    className += " selected";
  }
  return /* @__PURE__ */ jsxs4(
    "li",
    {
      tabIndex: -1,
      className,
      ref: option.setRefElement,
      "aria-selected": isSelected,
      id: `typeahead-item-${index}`,
      onMouseEnter,
      onClick,
      children: [
        option.picture,
        /* @__PURE__ */ jsx11("span", { className: "text", children: option.name })
      ]
    },
    option.key
  );
}
function NewMentionsPlugin() {
  const [editor] = useLexicalComposerContext5();
  const [queryString, setQueryString] = useState4(null);
  const results = useMentionLookupService(queryString);
  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0
  });
  const options = useMemo3(
    () => results.map((result) => new MentionTypeaheadOption(result, /* @__PURE__ */ jsx11("i", { className: "icon user" }))).slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results]
  );
  const onSelectOption = useCallback4(
    (selectedOption, nodeToReplace, closeMenu) => {
      editor.update(() => {
        const mentionNode = $createMentionNode(selectedOption.name);
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        mentionNode.select();
        closeMenu();
      });
    },
    [editor]
  );
  const checkForMentionMatch = useCallback4(
    (text) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor]
  );
  return /* @__PURE__ */ jsx11(
    LexicalTypeaheadMenuPlugin,
    {
      onQueryChange: setQueryString,
      onSelectOption,
      triggerFn: checkForMentionMatch,
      options,
      menuRenderFn: (anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => anchorElementRef.current && results.length ? ReactDOM.createPortal(
        /* @__PURE__ */ jsx11("div", { className: "notion-like-editor typeahead-popover mentions-menu", children: /* @__PURE__ */ jsx11("ul", { children: options.map((option, i) => /* @__PURE__ */ jsx11(
          MentionsTypeaheadMenuItem,
          {
            index: i,
            isSelected: selectedIndex === i,
            onClick: () => {
              setHighlightedIndex(i);
              selectOptionAndCleanUp(option);
            },
            onMouseEnter: () => {
              setHighlightedIndex(i);
            },
            option
          },
          option.key
        )) }) }),
        anchorElementRef.current
      ) : null
    }
  );
}
var PUNCTUATION, NAME, DocumentMentionsRegex, PUNC, TRIGGERS, VALID_CHARS, VALID_JOINS, LENGTH_LIMIT, AtSignMentionsRegex, ALIAS_LENGTH_LIMIT, AtSignMentionsRegexAliasRegex, SUGGESTION_LIST_LENGTH_LIMIT, mentionsCache, dummyMentionsData, dummyLookupService, MentionTypeaheadOption;
var init_MentionsPlugin = __esm({
  "src/plugins/MentionsPlugin/index.tsx"() {
    "use strict";
    init_MentionNode();
    PUNCTUATION = `\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'"~=<>_:;`;
    NAME = `\\b[A-Z][^\\s${PUNCTUATION}]`;
    DocumentMentionsRegex = {
      NAME,
      PUNCTUATION
    };
    PUNC = DocumentMentionsRegex.PUNCTUATION;
    TRIGGERS = ["@"].join("");
    VALID_CHARS = `[^${TRIGGERS}${PUNC}\\s]`;
    VALID_JOINS = "(?:\\.[ |$]| |[" + PUNC + "]|)";
    LENGTH_LIMIT = 75;
    AtSignMentionsRegex = new RegExp(
      `(^|\\s|\\()([${TRIGGERS}]((?:${VALID_CHARS}${VALID_JOINS}){0,${LENGTH_LIMIT}}))$`
    );
    ALIAS_LENGTH_LIMIT = 50;
    AtSignMentionsRegexAliasRegex = new RegExp(
      `(^|\\s|\\()([${TRIGGERS}]((?:${VALID_CHARS}){0,${ALIAS_LENGTH_LIMIT}}))$`
    );
    SUGGESTION_LIST_LENGTH_LIMIT = 5;
    mentionsCache = /* @__PURE__ */ new Map();
    dummyMentionsData = [
      "Aayla Secura",
      "Adi Gallia",
      "Admiral Dodd Rancit",
      "Admiral Firmus Piett",
      "Admiral Gial Ackbar",
      "Admiral Ozzel",
      "Admiral Raddus",
      "Admiral Terrinald Screed",
      "Admiral Trench",
      "Admiral U.O. Statura",
      "Agen Kolar",
      "Agent Kallus",
      "Aiolin and Morit Astarte",
      "Aks Moe",
      "Almec",
      "Alton Kastle",
      "Amee",
      "AP-5",
      "Armitage Hux",
      "Artoo",
      "Arvel Crynyd",
      "Asajj Ventress",
      "Aurra Sing",
      "AZI-3",
      "Bala-Tik",
      "Barada",
      "Bargwill Tomder",
      "Baron Papanoida",
      "Barriss Offee",
      "Baze Malbus",
      "Bazine Netal",
      "BB-8",
      "BB-9E",
      "Ben Quadinaros",
      "Berch Teller",
      "Beru Lars",
      "Bib Fortuna",
      "Biggs Darklighter",
      "Black Krrsantan",
      "Bo-Katan Kryze",
      "Boba Fett",
      "Bobbajo",
      "Bodhi Rook",
      "Borvo the Hutt",
      "Boss Nass",
      "Bossk",
      "Breha Antilles-Organa",
      "Bren Derlin",
      "Brendol Hux",
      "BT-1",
      "C-3PO",
      "C1-10P",
      "Cad Bane",
      "Caluan Ematt",
      "Captain Gregor",
      "Captain Phasma",
      "Captain Quarsh Panaka",
      "Captain Rex",
      "Carlist Rieekan",
      "Casca Panzoro",
      "Cassian Andor",
      "Cassio Tagge",
      "Cham Syndulla",
      "Che Amanwe Papanoida",
      "Chewbacca",
      "Chi Eekway Papanoida",
      "Chief Chirpa",
      "Chirrut \xCEmwe",
      "Ciena Ree",
      "Cin Drallig",
      "Clegg Holdfast",
      "Cliegg Lars",
      "Coleman Kcaj",
      "Coleman Trebor",
      "Colonel Kaplan",
      "Commander Bly",
      "Commander Cody (CC-2224)",
      "Commander Fil (CC-3714)",
      "Commander Fox",
      "Commander Gree",
      "Commander Jet",
      "Commander Wolffe",
      "Conan Antonio Motti",
      "Conder Kyl",
      "Constable Zuvio",
      "Cord\xE9",
      "Cpatain Typho",
      "Crix Madine",
      "Cut Lawquane",
      "Dak Ralter",
      "Dapp",
      "Darth Bane",
      "Darth Maul",
      "Darth Tyranus",
      "Daultay Dofine",
      "Del Meeko",
      "Delian Mors",
      "Dengar",
      "Depa Billaba",
      "Derek Klivian",
      "Dexter Jettster",
      "Dine\xE9 Ellberger",
      "DJ",
      "Doctor Aphra",
      "Doctor Evazan",
      "Dogma",
      "Dorm\xE9",
      "Dr. Cylo",
      "Droidbait",
      "Droopy McCool",
      "Dryden Vos",
      "Dud Bolt",
      "Ebe E. Endocott",
      "Echuu Shen-Jon",
      "Eeth Koth",
      "Eighth Brother",
      "Eirta\xE9",
      "Eli Vanto",
      "Ell\xE9",
      "Ello Asty",
      "Embo",
      "Eneb Ray",
      "Enfys Nest",
      "EV-9D9",
      "Evaan Verlaine",
      "Even Piell",
      "Ezra Bridger",
      "Faro Argyus",
      "Feral",
      "Fifth Brother",
      "Finis Valorum",
      "Finn",
      "Fives",
      "FN-1824",
      "FN-2003",
      "Fodesinbeed Annodue",
      "Fulcrum",
      "FX-7",
      "GA-97",
      "Galen Erso",
      "Gallius Rax",
      'Garazeb "Zeb" Orrelios',
      "Gardulla the Hutt",
      "Garrick Versio",
      "Garven Dreis",
      "Gavyn Sykes",
      "Gideon Hask",
      "Gizor Dellso",
      "Gonk droid",
      "Grand Inquisitor",
      "Greeata Jendowanian",
      "Greedo",
      "Greer Sonnel",
      "Grievous",
      "Grummgar",
      "Gungi",
      "Hammerhead",
      "Han Solo",
      "Harter Kalonia",
      "Has Obbit",
      "Hera Syndulla",
      "Hevy",
      "Hondo Ohnaka",
      "Huyang",
      "Iden Versio",
      "IG-88",
      "Ima-Gun Di",
      "Inquisitors",
      "Inspector Thanoth",
      "Jabba",
      "Jacen Syndulla",
      "Jan Dodonna",
      "Jango Fett",
      "Janus Greejatus",
      "Jar Jar Binks",
      "Jas Emari",
      "Jaxxon",
      "Jek Tono Porkins",
      "Jeremoch Colton",
      "Jira",
      "Jobal Naberrie",
      "Jocasta Nu",
      "Joclad Danva",
      "Joh Yowza",
      "Jom Barell",
      "Joph Seastriker",
      "Jova Tarkin",
      "Jubnuk",
      "Jyn Erso",
      "K-2SO",
      "Kanan Jarrus",
      "Karbin",
      "Karina the Great",
      "Kes Dameron",
      "Ketsu Onyo",
      "Ki-Adi-Mundi",
      "King Katuunko",
      "Kit Fisto",
      "Kitster Banai",
      "Klaatu",
      "Klik-Klak",
      "Korr Sella",
      "Kylo Ren",
      "L3-37",
      "Lama Su",
      "Lando Calrissian",
      "Lanever Villecham",
      "Leia Organa",
      "Letta Turmond",
      "Lieutenant Kaydel Ko Connix",
      "Lieutenant Thire",
      "Lobot",
      "Logray",
      "Lok Durd",
      "Longo Two-Guns",
      "Lor San Tekka",
      "Lorth Needa",
      "Lott Dod",
      "Luke Skywalker",
      "Lumat",
      "Luminara Unduli",
      "Lux Bonteri",
      "Lyn Me",
      "Lyra Erso",
      "Mace Windu",
      "Malakili",
      "Mama the Hutt",
      "Mars Guo",
      "Mas Amedda",
      "Mawhonic",
      "Max Rebo",
      "Maximilian Veers",
      "Maz Kanata",
      "ME-8D9",
      "Meena Tills",
      "Mercurial Swift",
      "Mina Bonteri",
      "Miraj Scintel",
      "Mister Bones",
      "Mod Terrik",
      "Moden Canady",
      "Mon Mothma",
      "Moradmin Bast",
      "Moralo Eval",
      "Morley",
      "Mother Talzin",
      "Nahdar Vebb",
      "Nahdonnis Praji",
      "Nien Nunb",
      "Niima the Hutt",
      "Nines",
      "Norra Wexley",
      "Nute Gunray",
      "Nuvo Vindi",
      "Obi-Wan Kenobi",
      "Odd Ball",
      "Ody Mandrell",
      "Omi",
      "Onaconda Farr",
      "Oola",
      "OOM-9",
      "Oppo Rancisis",
      "Orn Free Taa",
      "Oro Dassyne",
      "Orrimarko",
      "Osi Sobeck",
      "Owen Lars",
      "Pablo-Jill",
      "Padm\xE9 Amidala",
      "Pagetti Rook",
      "Paige Tico",
      "Paploo",
      "Petty Officer Thanisson",
      "Pharl McQuarrie",
      "Plo Koon",
      "Po Nudo",
      "Poe Dameron",
      "Poggle the Lesser",
      "Pong Krell",
      "Pooja Naberrie",
      "PZ-4CO",
      "Quarrie",
      "Quay Tolsite",
      "Queen Apailana",
      "Queen Jamillia",
      "Queen Neeyutnee",
      "Qui-Gon Jinn",
      "Quiggold",
      "Quinlan Vos",
      "R2-D2",
      "R2-KT",
      "R3-S6",
      "R4-P17",
      "R5-D4",
      "RA-7",
      "Rab\xE9",
      "Rako Hardeen",
      "Ransolm Casterfo",
      "Rappertunie",
      "Ratts Tyerell",
      "Raymus Antilles",
      "Ree-Yees",
      "Reeve Panzoro",
      "Rey",
      "Ric Oli\xE9",
      "Riff Tamson",
      "Riley",
      "Rinnriyin Di",
      "Rio Durant",
      "Rogue Squadron",
      "Romba",
      "Roos Tarpals",
      "Rose Tico",
      "Rotta the Hutt",
      "Rukh",
      "Rune Haako",
      "Rush Clovis",
      "Ruwee Naberrie",
      "Ryoo Naberrie",
      "Sab\xE9",
      "Sabine Wren",
      "Sach\xE9",
      "Saelt-Marae",
      "Saesee Tiin",
      "Salacious B. Crumb",
      "San Hill",
      "Sana Starros",
      "Sarco Plank",
      "Sarkli",
      "Satine Kryze",
      "Savage Opress",
      "Sebulba",
      "Senator Organa",
      "Sergeant Kreel",
      "Seventh Sister",
      "Shaak Ti",
      "Shara Bey",
      "Shmi Skywalker",
      "Shu Mai",
      "Sidon Ithano",
      "Sifo-Dyas",
      "Sim Aloo",
      "Siniir Rath Velus",
      "Sio Bibble",
      "Sixth Brother",
      "Slowen Lo",
      "Sly Moore",
      "Snaggletooth",
      "Snap Wexley",
      "Snoke",
      "Sola Naberrie",
      "Sora Bulq",
      "Strono Tuggs",
      "Sy Snootles",
      "Tallissan Lintra",
      "Tarfful",
      "Tasu Leech",
      "Taun We",
      "TC-14",
      "Tee Watt Kaa",
      "Teebo",
      "Teedo",
      "Teemto Pagalies",
      "Temiri Blagg",
      "Tessek",
      "Tey How",
      "Thane Kyrell",
      "The Bendu",
      "The Smuggler",
      "Thrawn",
      "Tiaan Jerjerrod",
      "Tion Medon",
      "Tobias Beckett",
      "Tulon Voidgazer",
      "Tup",
      "U9-C4",
      "Unkar Plutt",
      "Val Beckett",
      "Vanden Willard",
      "Vice Admiral Amilyn Holdo",
      "Vober Dand",
      "WAC-47",
      "Wag Too",
      "Wald",
      "Walrus Man",
      "Warok",
      "Wat Tambor",
      "Watto",
      "Wedge Antilles",
      "Wes Janson",
      "Wicket W. Warrick",
      "Wilhuff Tarkin",
      "Wollivan",
      "Wuher",
      "Wullf Yularen",
      "Xamuel Lennox",
      "Yaddle",
      "Yarael Poof",
      "Yoda",
      "Zam Wesell",
      "Zev Senesca",
      "Ziro the Hutt",
      "Zuckuss"
    ];
    dummyLookupService = {
      search(string, callback) {
        setTimeout(() => {
          const results = dummyMentionsData.filter((mention) => mention.toLowerCase().includes(string.toLowerCase()));
          callback(results);
        }, 500);
      }
    };
    MentionTypeaheadOption = class extends MenuOption {
      name;
      picture;
      constructor(name, picture) {
        super(name);
        this.name = name;
        this.picture = picture;
      }
    };
  }
});

// src/ui/ContentEditable.css
var init_ContentEditable = __esm({
  "src/ui/ContentEditable.css"() {
  }
});

// src/ui/ContentEditable.tsx
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { jsx as jsx12 } from "react/jsx-runtime";
function LexicalContentEditable({ className, placeholder, placeholderClassName }) {
  return /* @__PURE__ */ jsx12(
    ContentEditable,
    {
      className: className ?? "ContentEditable__root",
      "aria-placeholder": placeholder,
      placeholder: /* @__PURE__ */ jsx12("div", { className: placeholderClassName ?? "ContentEditable__placeholder", children: placeholder })
    }
  );
}
var init_ContentEditable2 = __esm({
  "src/ui/ContentEditable.tsx"() {
    "use strict";
    init_ContentEditable();
  }
});

// src/ui/ImageResizer.tsx
import { calculateZoomLevel } from "@lexical/utils";
import { useRef as useRef4 } from "react";
import { jsx as jsx13, jsxs as jsxs5 } from "react/jsx-runtime";
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function ImageResizer({
  onResizeStart,
  onResizeEnd,
  buttonRef,
  imageRef,
  maxWidth,
  editor,
  showCaption,
  setShowCaption,
  captionsEnabled
}) {
  const controlWrapperRef = useRef4(null);
  const userSelect = useRef4({
    priority: "",
    value: "default"
  });
  const positioningRef = useRef4({
    currentHeight: 0,
    currentWidth: 0,
    direction: 0,
    isResizing: false,
    ratio: 0,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0
  });
  const editorRootElement = editor.getRootElement();
  const maxWidthContainer = maxWidth ? maxWidth : editorRootElement !== null ? editorRootElement.getBoundingClientRect().width - 20 : 100;
  const maxHeightContainer = editorRootElement !== null ? editorRootElement.getBoundingClientRect().height - 20 : 100;
  const minWidth = 100;
  const minHeight = 100;
  const setStartCursor = (direction) => {
    const ew = direction === Direction.east || direction === Direction.west;
    const ns = direction === Direction.north || direction === Direction.south;
    const nwse = direction & Direction.north && direction & Direction.west || direction & Direction.south && direction & Direction.east;
    const cursorDir = ew ? "ew" : ns ? "ns" : nwse ? "nwse" : "nesw";
    if (editorRootElement !== null) {
      editorRootElement.style.setProperty("cursor", `${cursorDir}-resize`, "important");
    }
    if (document.body !== null) {
      document.body.style.setProperty("cursor", `${cursorDir}-resize`, "important");
      userSelect.current.value = document.body.style.getPropertyValue("-webkit-user-select");
      userSelect.current.priority = document.body.style.getPropertyPriority("-webkit-user-select");
      document.body.style.setProperty("-webkit-user-select", `none`, "important");
    }
  };
  const setEndCursor = () => {
    if (editorRootElement !== null) {
      editorRootElement.style.setProperty("cursor", "text");
    }
    if (document.body !== null) {
      document.body.style.setProperty("cursor", "default");
      document.body.style.setProperty("-webkit-user-select", userSelect.current.value, userSelect.current.priority);
    }
  };
  const handlePointerDown = (event, direction) => {
    if (!editor.isEditable()) {
      return;
    }
    const image = imageRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (image !== null && controlWrapper !== null) {
      event.preventDefault();
      const { width, height } = image.getBoundingClientRect();
      const zoom = calculateZoomLevel(image);
      const positioning = positioningRef.current;
      positioning.startWidth = width;
      positioning.startHeight = height;
      positioning.ratio = width / height;
      positioning.currentWidth = width;
      positioning.currentHeight = height;
      positioning.startX = event.clientX / zoom;
      positioning.startY = event.clientY / zoom;
      positioning.isResizing = true;
      positioning.direction = direction;
      setStartCursor(direction);
      onResizeStart();
      controlWrapper.classList.add("image-control-wrapper--resizing");
      image.style.height = `${height}px`;
      image.style.width = `${width}px`;
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    }
  };
  const handlePointerMove = (event) => {
    const image = imageRef.current;
    const positioning = positioningRef.current;
    const isHorizontal = positioning.direction & (Direction.east | Direction.west);
    const isVertical = positioning.direction & (Direction.south | Direction.north);
    if (image !== null && positioning.isResizing) {
      const zoom = calculateZoomLevel(image);
      if (isHorizontal && isVertical) {
        let diff = Math.floor(positioning.startX - event.clientX / zoom);
        diff = positioning.direction & Direction.east ? -diff : diff;
        const width = clamp(positioning.startWidth + diff, minWidth, maxWidthContainer);
        const height = width / positioning.ratio;
        image.style.width = `${width}px`;
        image.style.height = `${height}px`;
        positioning.currentHeight = height;
        positioning.currentWidth = width;
      } else if (isVertical) {
        let diff = Math.floor(positioning.startY - event.clientY / zoom);
        diff = positioning.direction & Direction.south ? -diff : diff;
        const height = clamp(positioning.startHeight + diff, minHeight, maxHeightContainer);
        image.style.height = `${height}px`;
        positioning.currentHeight = height;
      } else {
        let diff = Math.floor(positioning.startX - event.clientX / zoom);
        diff = positioning.direction & Direction.east ? -diff : diff;
        const width = clamp(positioning.startWidth + diff, minWidth, maxWidthContainer);
        image.style.width = `${width}px`;
        positioning.currentWidth = width;
      }
    }
  };
  const handlePointerUp = () => {
    const image = imageRef.current;
    const positioning = positioningRef.current;
    const controlWrapper = controlWrapperRef.current;
    if (image !== null && controlWrapper !== null && positioning.isResizing) {
      const width = positioning.currentWidth;
      const height = positioning.currentHeight;
      positioning.startWidth = 0;
      positioning.startHeight = 0;
      positioning.ratio = 0;
      positioning.startX = 0;
      positioning.startY = 0;
      positioning.currentWidth = 0;
      positioning.currentHeight = 0;
      positioning.isResizing = false;
      controlWrapper.classList.remove("image-control-wrapper--resizing");
      setEndCursor();
      onResizeEnd(width, height);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    }
  };
  return /* @__PURE__ */ jsxs5("div", { ref: controlWrapperRef, children: [
    !showCaption && captionsEnabled && /* @__PURE__ */ jsx13(
      "button",
      {
        type: "button",
        className: "image-caption-button",
        ref: buttonRef,
        onClick: () => {
          setShowCaption(!showCaption);
        },
        children: "Add Caption"
      }
    ),
    /* @__PURE__ */ jsx13(
      "div",
      {
        className: "image-resizer image-resizer-n",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.north);
        }
      }
    ),
    /* @__PURE__ */ jsx13(
      "div",
      {
        className: "image-resizer image-resizer-ne",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.north | Direction.east);
        }
      }
    ),
    /* @__PURE__ */ jsx13(
      "div",
      {
        className: "image-resizer image-resizer-e",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.east);
        }
      }
    ),
    /* @__PURE__ */ jsx13(
      "div",
      {
        className: "image-resizer image-resizer-se",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south | Direction.east);
        }
      }
    ),
    /* @__PURE__ */ jsx13(
      "div",
      {
        className: "image-resizer image-resizer-s",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south);
        }
      }
    ),
    /* @__PURE__ */ jsx13(
      "div",
      {
        className: "image-resizer image-resizer-sw",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south | Direction.west);
        }
      }
    ),
    /* @__PURE__ */ jsx13(
      "div",
      {
        className: "image-resizer image-resizer-w",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.west);
        }
      }
    ),
    /* @__PURE__ */ jsx13(
      "div",
      {
        className: "image-resizer image-resizer-nw",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.north | Direction.west);
        }
      }
    )
  ] });
}
var Direction;
var init_ImageResizer = __esm({
  "src/ui/ImageResizer.tsx"() {
    "use strict";
    Direction = {
      east: 1 << 0,
      north: 1 << 3,
      south: 1 << 1,
      west: 1 << 2
    };
  }
});

// src/nodes/ImageComponent.tsx
var ImageComponent_exports = {};
__export(ImageComponent_exports, {
  RIGHT_CLICK_IMAGE_COMMAND: () => RIGHT_CLICK_IMAGE_COMMAND,
  default: () => ImageComponent
});
import { useLexicalComposerContext as useLexicalComposerContext6 } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalEditable as useLexicalEditable2 } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection as useLexicalNodeSelection2 } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister as mergeRegister3 } from "@lexical/utils";
import {
  $getNodeByKey as $getNodeByKey4,
  $getRoot,
  $getSelection as $getSelection3,
  $isNodeSelection as $isNodeSelection2,
  $isRangeSelection as $isRangeSelection2,
  $setSelection as $setSelection2,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW2,
  createCommand,
  DRAGSTART_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND as KEY_ESCAPE_COMMAND2,
  SELECTION_CHANGE_COMMAND as SELECTION_CHANGE_COMMAND2
} from "lexical";
import { Suspense, useCallback as useCallback5, useEffect as useEffect8, useMemo as useMemo4, useRef as useRef5, useState as useState5 } from "react";
import { jsx as jsx14, jsxs as jsxs6 } from "react/jsx-runtime";
function DisableCaptionOnBlur({ setShowCaption }) {
  const [editor] = useLexicalComposerContext6();
  useEffect8(
    () => editor.registerCommand(
      BLUR_COMMAND,
      () => {
        if ($isCaptionEditorEmpty()) {
          setShowCaption(false);
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    )
  );
  return null;
}
function CaptionOnChangePlugin({ parentEditor, nodeKey }) {
  const [captionEditor] = useLexicalComposerContext6();
  useEffect8(() => {
    return captionEditor.registerUpdateListener(({ dirtyElements, dirtyLeaves, tags }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
        return;
      }
      if (tags.has("history-merge")) {
        return;
      }
      parentEditor.update(
        () => {
          const node = $getNodeByKey4(nodeKey);
          if ($isImageNode(node)) {
            node.getWritable();
          }
        },
        { discrete: true }
      );
    });
  }, [captionEditor, parentEditor, nodeKey]);
  return null;
}
function useSuspenseImage(src) {
  let cached = imageCache.get(src);
  if (cached && "error" in cached && typeof cached.error === "boolean") {
    return cached;
  } else if (!cached) {
    cached = new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve({
        error: false,
        height: img.naturalHeight,
        width: img.naturalWidth
      });
      img.onerror = () => resolve({ error: true });
    }).then((rval) => {
      imageCache.set(src, rval);
      return rval;
    });
    imageCache.set(src, cached);
    throw cached;
  }
  throw cached;
}
function isSVG(src) {
  return src.toLowerCase().endsWith(".svg");
}
function LazyImage({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  maxWidth,
  onError
}) {
  const isSVGImage = isSVG(src);
  const status = useSuspenseImage(src);
  useEffect8(() => {
    if (status.error) {
      onError();
    }
  }, [status.error, onError]);
  if (status.error) {
    return /* @__PURE__ */ jsx14(BrokenImage, {});
  }
  const calculateDimensions = () => {
    if (!isSVGImage) {
      return {
        height,
        maxWidth,
        width
      };
    }
    const naturalWidth = status.width;
    const naturalHeight = status.height;
    let finalWidth = naturalWidth;
    let finalHeight = naturalHeight;
    if (finalWidth > maxWidth) {
      const scale = maxWidth / finalWidth;
      finalWidth = maxWidth;
      finalHeight = Math.round(finalHeight * scale);
    }
    const maxHeight = 500;
    if (finalHeight > maxHeight) {
      const scale = maxHeight / finalHeight;
      finalHeight = maxHeight;
      finalWidth = Math.round(finalWidth * scale);
    }
    return {
      height: finalHeight,
      maxWidth,
      width: finalWidth
    };
  };
  const imageStyle = calculateDimensions();
  return /* @__PURE__ */ jsx14(
    "img",
    {
      className: className || void 0,
      src,
      alt: altText,
      ref: imageRef,
      style: imageStyle,
      onError,
      draggable: "false"
    }
  );
}
function BrokenImage() {
  return /* @__PURE__ */ jsx14(
    "img",
    {
      src: image_broken_default,
      style: {
        height: 200,
        opacity: 0.2,
        width: 200
      },
      draggable: "false",
      alt: "Broken image"
    }
  );
}
function noop() {
}
function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
  resizable,
  showCaption,
  caption,
  captionsEnabled
}) {
  const imageRef = useRef5(null);
  const buttonRef = useRef5(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection2(nodeKey);
  const [isResizing, setIsResizing] = useState5(false);
  const [editor] = useLexicalComposerContext6();
  const activeEditorRef = useRef5(null);
  const [isLoadError, setIsLoadError] = useState5(false);
  const isEditable = useLexicalEditable2();
  const isInNodeSelection = useMemo4(
    () => isSelected && editor.getEditorState().read(() => {
      const selection = $getSelection3();
      return $isNodeSelection2(selection) && selection.has(nodeKey);
    }),
    [editor, isSelected, nodeKey]
  );
  const $onEnter = useCallback5(
    (event) => {
      const latestSelection = $getSelection3();
      const buttonElem = buttonRef.current;
      if ($isNodeSelection2(latestSelection) && latestSelection.has(nodeKey) && latestSelection.getNodes().length === 1) {
        if (showCaption) {
          $setSelection2(null);
          event.preventDefault();
          caption.focus();
          return true;
        } else if (buttonElem !== null && buttonElem !== document.activeElement) {
          event.preventDefault();
          buttonElem.focus();
          return true;
        }
      }
      return false;
    },
    [caption, nodeKey, showCaption]
  );
  const $onEscape = useCallback5(
    (event) => {
      if (activeEditorRef.current === caption || buttonRef.current === event.target) {
        $setSelection2(null);
        editor.update(() => {
          setSelected(true);
          const parentRootElement = editor.getRootElement();
          if (parentRootElement !== null) {
            parentRootElement.focus();
          }
        });
        return true;
      }
      return false;
    },
    [caption, editor, setSelected]
  );
  const onClick = useCallback5(
    (payload) => {
      const event = payload;
      if (isResizing) {
        return true;
      }
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }
      return false;
    },
    [isResizing, isSelected, setSelected, clearSelection]
  );
  const onRightClick = useCallback5(
    (event) => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection3();
        const domElement = event.target;
        if (domElement.tagName === "IMG" && $isRangeSelection2(latestSelection) && latestSelection.getNodes().length === 1) {
          editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
        }
      });
    },
    [editor]
  );
  useEffect8(() => {
    return mergeRegister3(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND2,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW2
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW2
      )
    );
  }, [editor]);
  useEffect8(() => {
    let rootCleanup = noop;
    return mergeRegister3(
      editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW2),
      editor.registerCommand(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW2),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW2),
      editor.registerCommand(KEY_ESCAPE_COMMAND2, $onEscape, COMMAND_PRIORITY_LOW2),
      editor.registerRootListener((rootElement) => {
        rootCleanup();
        rootCleanup = noop;
        if (rootElement) {
          rootElement.addEventListener("contextmenu", onRightClick);
          rootCleanup = () => rootElement.removeEventListener("contextmenu", onRightClick);
        }
      }),
      () => rootCleanup()
    );
  }, [editor, $onEnter, $onEscape, onClick, onRightClick]);
  const setShowCaption = (show) => {
    editor.update(() => {
      const node = $getNodeByKey4(nodeKey);
      if ($isImageNode(node)) {
        node.setShowCaption(show);
        if (show) {
          node.__caption.update(() => {
            if (!$getSelection3()) {
              $getRoot().selectEnd();
            }
          });
        }
      }
    });
  };
  const onResizeEnd = (nextWidth, nextHeight) => {
    setTimeout(() => {
      setIsResizing(false);
    }, 200);
    editor.update(() => {
      const node = $getNodeByKey4(nodeKey);
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };
  const onResizeStart = () => {
    setIsResizing(true);
  };
  useSharedHistoryContext();
  const draggable = isInNodeSelection && !isResizing;
  const isFocused = (isSelected || isResizing) && isEditable;
  return /* @__PURE__ */ jsxs6(Suspense, { fallback: null, children: [
    /* @__PURE__ */ jsx14("div", { draggable, children: isLoadError ? /* @__PURE__ */ jsx14(BrokenImage, {}) : /* @__PURE__ */ jsx14(
      LazyImage,
      {
        className: isFocused ? `focused ${isInNodeSelection ? "draggable" : ""}` : null,
        src,
        altText,
        imageRef,
        width,
        height,
        maxWidth,
        onError: () => setIsLoadError(true)
      }
    ) }),
    showCaption && /* @__PURE__ */ jsx14("div", { className: "image-caption-container", children: /* @__PURE__ */ jsxs6(LexicalNestedComposer, { initialEditor: caption, children: [
      /* @__PURE__ */ jsx14(CaptionOnChangePlugin, { parentEditor: editor, nodeKey }),
      /* @__PURE__ */ jsx14(DisableCaptionOnBlur, { setShowCaption }),
      /* @__PURE__ */ jsx14(NewMentionsPlugin, {}),
      /* @__PURE__ */ jsx14(LinkPlugin, {}),
      /* @__PURE__ */ jsx14(EmojisPlugin, {}),
      /* @__PURE__ */ jsx14(HashtagPlugin, {}),
      /* @__PURE__ */ jsx14(
        RichTextPlugin,
        {
          contentEditable: /* @__PURE__ */ jsx14(
            LexicalContentEditable,
            {
              placeholder: "Enter a caption...",
              placeholderClassName: "ImageNode__placeholder",
              className: "ImageNode__contentEditable"
            }
          ),
          ErrorBoundary: LexicalErrorBoundary
        }
      )
    ] }) }),
    resizable && isInNodeSelection && isFocused && /* @__PURE__ */ jsx14(
      ImageResizer,
      {
        showCaption,
        setShowCaption,
        editor,
        buttonRef,
        imageRef,
        maxWidth,
        onResizeStart,
        onResizeEnd,
        captionsEnabled: !isLoadError && captionsEnabled
      }
    )
  ] });
}
var imageCache, RIGHT_CLICK_IMAGE_COMMAND;
var init_ImageComponent = __esm({
  "src/nodes/ImageComponent.tsx"() {
    "use strict";
    init_ImageNode();
    init_SharedHistoryContext();
    init_image_broken();
    init_EmojisPlugin();
    init_LinkPlugin();
    init_MentionsPlugin();
    init_ContentEditable2();
    init_ImageResizer();
    init_ImageNode2();
    imageCache = /* @__PURE__ */ new Map();
    RIGHT_CLICK_IMAGE_COMMAND = createCommand("RIGHT_CLICK_IMAGE_COMMAND");
  }
});

// src/nodes/ImageNode.tsx
import { $insertGeneratedNodes } from "@lexical/clipboard";
import { HashtagNode } from "@lexical/hashtag";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LinkNode } from "@lexical/link";
import {
  $applyNodeReplacement as $applyNodeReplacement5,
  $createRangeSelection,
  $extendCaretToRange,
  $getChildCaret,
  $getEditor,
  $getRoot as $getRoot2,
  $isElementNode as $isElementNode3,
  $isParagraphNode,
  $selectAll,
  $setSelection as $setSelection3,
  createEditor,
  DecoratorNode as DecoratorNode3,
  LineBreakNode,
  ParagraphNode,
  RootNode,
  SKIP_DOM_SELECTION_TAG,
  TextNode as TextNode6
} from "lexical";
import * as React3 from "react";
import { jsx as jsx15 } from "react/jsx-runtime";
function isGoogleDocCheckboxImg(img) {
  return img.parentElement != null && img.parentElement.tagName === "LI" && img.previousSibling === null && img.getAttribute("aria-roledescription") === "checkbox";
}
function $convertImageElement(domNode) {
  const img = domNode;
  const src = img.getAttribute("src");
  if (!src || src.startsWith("file:///") || isGoogleDocCheckboxImg(img)) {
    return null;
  }
  const { alt: altText, width, height } = img;
  const node = $createImageNode({ altText, height, src, width });
  return { node };
}
function $isCaptionEditorEmpty() {
  for (const { origin } of $extendCaretToRange($getChildCaret($getRoot2(), "next"))) {
    if (!$isElementNode3(origin)) {
      return false;
    }
  }
  return true;
}
function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  captionsEnabled,
  src,
  width,
  showCaption,
  caption,
  key
}) {
  return $applyNodeReplacement5(
    new ImageNode(src, altText, maxWidth, width, height, showCaption, caption, captionsEnabled, key)
  );
}
function $isImageNode(node) {
  return node instanceof ImageNode;
}
var ImageComponent2, ImageNode;
var init_ImageNode2 = __esm({
  "src/nodes/ImageNode.tsx"() {
    "use strict";
    init_EmojiNode();
    init_KeywordNode();
    ImageComponent2 = React3.lazy(() => Promise.resolve().then(() => (init_ImageComponent(), ImageComponent_exports)));
    ImageNode = class _ImageNode extends DecoratorNode3 {
      __src;
      __altText;
      __width;
      __height;
      __maxWidth;
      __showCaption;
      __caption;
      // Captions cannot yet be used within editor cells
      __captionsEnabled;
      static getType() {
        return "image";
      }
      static clone(node) {
        return new _ImageNode(
          node.__src,
          node.__altText,
          node.__maxWidth,
          node.__width,
          node.__height,
          node.__showCaption,
          node.__caption,
          node.__captionsEnabled,
          node.__key
        );
      }
      static importJSON(serializedNode) {
        const { altText, height, width, maxWidth, src, showCaption } = serializedNode;
        return $createImageNode({
          altText,
          height,
          maxWidth,
          showCaption,
          src,
          width
        }).updateFromJSON(serializedNode);
      }
      updateFromJSON(serializedNode) {
        const node = super.updateFromJSON(serializedNode);
        const { caption } = serializedNode;
        const nestedEditor = node.__caption;
        const editorState = nestedEditor.parseEditorState(caption.editorState);
        if (!editorState.isEmpty()) {
          nestedEditor.setEditorState(editorState);
        }
        return node;
      }
      exportDOM() {
        const imgElement = document.createElement("img");
        imgElement.setAttribute("src", this.__src);
        imgElement.setAttribute("alt", this.__altText);
        imgElement.setAttribute("width", this.__width.toString());
        imgElement.setAttribute("height", this.__height.toString());
        if (this.__showCaption && this.__caption) {
          const captionEditor = this.__caption;
          const captionHtml = captionEditor.read(() => {
            if ($isCaptionEditorEmpty()) {
              return null;
            }
            let selection = null;
            const firstChild = $getRoot2().getFirstChild();
            if ($isParagraphNode(firstChild) && firstChild.getNextSibling() === null) {
              selection = $createRangeSelection();
              selection.anchor.set(firstChild.getKey(), 0, "element");
              selection.focus.set(firstChild.getKey(), firstChild.getChildrenSize(), "element");
            }
            return $generateHtmlFromNodes(captionEditor, selection);
          });
          if (captionHtml) {
            const figureElement = document.createElement("figure");
            const figcaptionElement = document.createElement("figcaption");
            figcaptionElement.innerHTML = captionHtml;
            figureElement.appendChild(imgElement);
            figureElement.appendChild(figcaptionElement);
            return { element: figureElement };
          }
        }
        return { element: imgElement };
      }
      static importDOM() {
        return {
          figcaption: () => ({
            conversion: () => ({ node: null }),
            priority: 0
          }),
          figure: () => ({
            conversion: (node) => {
              return {
                after: (childNodes) => {
                  const imageNodes = childNodes.filter($isImageNode);
                  const figcaption = node.querySelector("figcaption");
                  if (figcaption) {
                    for (const imgNode of imageNodes) {
                      imgNode.setShowCaption(true);
                      imgNode.__caption.update(
                        () => {
                          const editor = $getEditor();
                          $insertGeneratedNodes(editor, $generateNodesFromDOM(editor, figcaption), $selectAll());
                          $setSelection3(null);
                        },
                        { tag: SKIP_DOM_SELECTION_TAG }
                      );
                    }
                  }
                  return imageNodes;
                },
                node: null
              };
            },
            priority: 0
          }),
          img: () => ({
            conversion: $convertImageElement,
            priority: 0
          })
        };
      }
      constructor(src, altText, maxWidth, width, height, showCaption, caption, captionsEnabled, key) {
        super(key);
        this.__src = src;
        this.__altText = altText;
        this.__maxWidth = maxWidth;
        this.__width = width || "inherit";
        this.__height = height || "inherit";
        this.__showCaption = showCaption || false;
        this.__caption = caption || createEditor({
          namespace: "Playground/ImageNodeCaption",
          nodes: [RootNode, TextNode6, LineBreakNode, ParagraphNode, LinkNode, EmojiNode, HashtagNode, KeywordNode]
        });
        this.__captionsEnabled = captionsEnabled || captionsEnabled === void 0;
      }
      exportJSON() {
        return {
          ...super.exportJSON(),
          altText: this.getAltText(),
          caption: this.__caption.toJSON(),
          height: this.__height === "inherit" ? 0 : this.__height,
          maxWidth: this.__maxWidth,
          showCaption: this.__showCaption,
          src: this.getSrc(),
          width: this.__width === "inherit" ? 0 : this.__width
        };
      }
      setWidthAndHeight(width, height) {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
      }
      setShowCaption(showCaption) {
        const writable = this.getWritable();
        writable.__showCaption = showCaption;
      }
      // View
      createDOM(config) {
        const span = document.createElement("span");
        const theme3 = config.theme;
        const className = theme3.image;
        if (className !== void 0) {
          span.className = className;
        }
        return span;
      }
      updateDOM() {
        return false;
      }
      getSrc() {
        return this.__src;
      }
      getAltText() {
        return this.__altText;
      }
      decorate() {
        return /* @__PURE__ */ jsx15(
          ImageComponent2,
          {
            src: this.__src,
            altText: this.__altText,
            width: this.__width,
            height: this.__height,
            maxWidth: this.__maxWidth,
            nodeKey: this.getKey(),
            showCaption: this.__showCaption,
            caption: this.__caption,
            captionsEnabled: this.__captionsEnabled,
            resizable: true
          }
        );
      }
    };
  }
});

// src/nodes/StickyNode.css
var init_StickyNode = __esm({
  "src/nodes/StickyNode.css"() {
  }
});

// src/themes/StickyEditorTheme.css
var init_StickyEditorTheme = __esm({
  "src/themes/StickyEditorTheme.css"() {
  }
});

// src/themes/NotionLikeEditorTheme.css
var init_NotionLikeEditorTheme = __esm({
  "src/themes/NotionLikeEditorTheme.css"() {
  }
});

// src/themes/NotionLikeEditorTheme.ts
var theme, NotionLikeEditorTheme_default;
var init_NotionLikeEditorTheme2 = __esm({
  "src/themes/NotionLikeEditorTheme.ts"() {
    "use strict";
    init_NotionLikeEditorTheme();
    theme = {
      autocomplete: "NotionLikeEditorTheme__autocomplete",
      blockCursor: "NotionLikeEditorTheme__blockCursor",
      characterLimit: "NotionLikeEditorTheme__characterLimit",
      code: "NotionLikeEditorTheme__code",
      codeHighlight: {
        atrule: "NotionLikeEditorTheme__tokenAttr",
        attr: "NotionLikeEditorTheme__tokenAttr",
        boolean: "NotionLikeEditorTheme__tokenProperty",
        builtin: "NotionLikeEditorTheme__tokenSelector",
        cdata: "NotionLikeEditorTheme__tokenComment",
        char: "NotionLikeEditorTheme__tokenSelector",
        class: "NotionLikeEditorTheme__tokenFunction",
        "class-name": "NotionLikeEditorTheme__tokenFunction",
        comment: "NotionLikeEditorTheme__tokenComment",
        constant: "NotionLikeEditorTheme__tokenProperty",
        deleted: "NotionLikeEditorTheme__tokenDeleted",
        doctype: "NotionLikeEditorTheme__tokenComment",
        entity: "NotionLikeEditorTheme__tokenOperator",
        function: "NotionLikeEditorTheme__tokenFunction",
        important: "NotionLikeEditorTheme__tokenVariable",
        inserted: "NotionLikeEditorTheme__tokenInserted",
        keyword: "NotionLikeEditorTheme__tokenAttr",
        namespace: "NotionLikeEditorTheme__tokenVariable",
        number: "NotionLikeEditorTheme__tokenProperty",
        operator: "NotionLikeEditorTheme__tokenOperator",
        prolog: "NotionLikeEditorTheme__tokenComment",
        property: "NotionLikeEditorTheme__tokenProperty",
        punctuation: "NotionLikeEditorTheme__tokenPunctuation",
        regex: "NotionLikeEditorTheme__tokenVariable",
        selector: "NotionLikeEditorTheme__tokenSelector",
        string: "NotionLikeEditorTheme__tokenSelector",
        symbol: "NotionLikeEditorTheme__tokenProperty",
        tag: "NotionLikeEditorTheme__tokenProperty",
        unchanged: "NotionLikeEditorTheme__tokenUnchanged",
        url: "NotionLikeEditorTheme__tokenOperator",
        variable: "NotionLikeEditorTheme__tokenVariable"
      },
      embedBlock: {
        base: "NotionLikeEditorTheme__embedBlock",
        focus: "NotionLikeEditorTheme__embedBlockFocus"
      },
      hashtag: "NotionLikeEditorTheme__hashtag",
      heading: {
        h1: "NotionLikeEditorTheme__h1",
        h2: "NotionLikeEditorTheme__h2",
        h3: "NotionLikeEditorTheme__h3",
        h4: "NotionLikeEditorTheme__h4",
        h5: "NotionLikeEditorTheme__h5",
        h6: "NotionLikeEditorTheme__h6"
      },
      hr: "NotionLikeEditorTheme__hr",
      hrSelected: "NotionLikeEditorTheme__hrSelected",
      image: "editor-image",
      indent: "NotionLikeEditorTheme__indent",
      layoutContainer: "NotionLikeEditorTheme__layoutContainer",
      layoutItem: "NotionLikeEditorTheme__layoutItem",
      link: "NotionLikeEditorTheme__link",
      list: {
        checklist: "NotionLikeEditorTheme__checklist",
        listitem: "NotionLikeEditorTheme__listItem",
        listitemChecked: "NotionLikeEditorTheme__listItemChecked",
        listitemUnchecked: "NotionLikeEditorTheme__listItemUnchecked",
        nested: {
          listitem: "NotionLikeEditorTheme__nestedListItem"
        },
        olDepth: [
          "NotionLikeEditorTheme__ol1",
          "NotionLikeEditorTheme__ol2",
          "NotionLikeEditorTheme__ol3",
          "NotionLikeEditorTheme__ol4",
          "NotionLikeEditorTheme__ol5"
        ],
        ul: "NotionLikeEditorTheme__ul",
        ol: "NotionLikeEditorTheme__ol"
      },
      mark: "NotionLikeEditorTheme__mark",
      markOverlap: "NotionLikeEditorTheme__markOverlap",
      paragraph: "NotionLikeEditorTheme__paragraph",
      quote: "NotionLikeEditorTheme__quote",
      specialText: "NotionLikeEditorTheme__specialText",
      tab: "NotionLikeEditorTheme__tabNode",
      table: "NotionLikeEditorTheme__table",
      tableAddColumns: "NotionLikeEditorTheme__tableAddColumns",
      tableAddRows: "NotionLikeEditorTheme__tableAddRows",
      tableAlignment: {
        center: "NotionLikeEditorTheme__tableAlignmentCenter",
        right: "NotionLikeEditorTheme__tableAlignmentRight"
      },
      tableCell: "NotionLikeEditorTheme__tableCell",
      tableCellActionButton: "NotionLikeEditorTheme__tableCellActionButton",
      tableCellActionButtonContainer: "NotionLikeEditorTheme__tableCellActionButtonContainer",
      tableCellHeader: "NotionLikeEditorTheme__tableCellHeader",
      tableCellResizer: "NotionLikeEditorTheme__tableCellResizer",
      tableCellSelected: "NotionLikeEditorTheme__tableCellSelected",
      tableFrozenColumn: "NotionLikeEditorTheme__tableFrozenColumn",
      tableFrozenRow: "NotionLikeEditorTheme__tableFrozenRow",
      tableRowStriping: "NotionLikeEditorTheme__tableRowStriping",
      tableScrollableWrapper: "NotionLikeEditorTheme__tableScrollableWrapper",
      tableSelected: "NotionLikeEditorTheme__tableSelected",
      tableSelection: "NotionLikeEditorTheme__tableSelection",
      text: {
        bold: "NotionLikeEditorTheme__textBold",
        capitalize: "NotionLikeEditorTheme__textCapitalize",
        code: "NotionLikeEditorTheme__textCode",
        highlight: "NotionLikeEditorTheme__textHighlight",
        italic: "NotionLikeEditorTheme__textItalic",
        lowercase: "NotionLikeEditorTheme__textLowercase",
        strikethrough: "NotionLikeEditorTheme__textStrikethrough",
        subscript: "NotionLikeEditorTheme__textSubscript",
        superscript: "NotionLikeEditorTheme__textSuperscript",
        underline: "NotionLikeEditorTheme__textUnderline",
        underlineStrikethrough: "NotionLikeEditorTheme__textUnderlineStrikethrough",
        uppercase: "NotionLikeEditorTheme__textUppercase"
      }
    };
    NotionLikeEditorTheme_default = theme;
  }
});

// src/themes/StickyEditorTheme.ts
var theme2, StickyEditorTheme_default;
var init_StickyEditorTheme2 = __esm({
  "src/themes/StickyEditorTheme.ts"() {
    "use strict";
    init_StickyEditorTheme();
    init_NotionLikeEditorTheme2();
    theme2 = {
      ...NotionLikeEditorTheme_default,
      paragraph: "StickyEditorTheme__paragraph"
    };
    StickyEditorTheme_default = theme2;
  }
});

// src/nodes/StickyComponent.tsx
var StickyComponent_exports = {};
__export(StickyComponent_exports, {
  default: () => StickyComponent
});
import { useLexicalComposerContext as useLexicalComposerContext8 } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary as LexicalErrorBoundary2 } from "@lexical/react/LexicalErrorBoundary";
import { LexicalNestedComposer as LexicalNestedComposer2 } from "@lexical/react/LexicalNestedComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { calculateZoomLevel as calculateZoomLevel2 } from "@lexical/utils";
import { $getNodeByKey as $getNodeByKey5 } from "lexical";
import { useEffect as useEffect10, useLayoutEffect, useRef as useRef6, useState as useState6 } from "react";
import { createPortal as createPortal2 } from "react-dom";
import { jsx as jsx17, jsxs as jsxs7 } from "react/jsx-runtime";
function positionSticky(stickyElem, positioning) {
  const style = stickyElem.style;
  style.top = `${positioning.y}px`;
  style.left = `${positioning.x}px`;
}
function StickyComponent({
  x,
  y: y2,
  nodeKey,
  color,
  caption
}) {
  const [editor] = useLexicalComposerContext8();
  const stickyContainerRef = useRef6(null);
  const [portalContainer, setPortalContainer] = useState6(null);
  const positioningRef = useRef6({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    rootElementRect: null,
    x: 0,
    y: 0
  });
  useEffect10(() => {
    const rootElement = editor.getRootElement();
    if (rootElement) {
      const scrollerContainer = rootElement.closest(".editor-scroller");
      if (scrollerContainer) {
        setPortalContainer(scrollerContainer);
      } else {
        setPortalContainer(rootElement.parentElement);
      }
    }
  }, [editor]);
  useEffect10(() => {
    const stickyContainer = stickyContainerRef.current;
    if (!stickyContainer) return;
    const stopFlyonuiEvents = (e) => {
      e.stopPropagation();
    };
    stickyContainer.addEventListener("focusin", stopFlyonuiEvents);
    stickyContainer.addEventListener("focusout", stopFlyonuiEvents);
    return () => {
      stickyContainer.removeEventListener("focusin", stopFlyonuiEvents);
      stickyContainer.removeEventListener("focusout", stopFlyonuiEvents);
    };
  }, []);
  useEffect10(() => {
    const position = positioningRef.current;
    position.x = x;
    position.y = y2;
    const stickyContainer = stickyContainerRef.current;
    if (stickyContainer !== null) {
      positionSticky(stickyContainer, position);
    }
  }, [x, y2]);
  useLayoutEffect(() => {
    const position = positioningRef.current;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const { target } = entry;
        position.rootElementRect = target.getBoundingClientRect();
        const stickyContainer = stickyContainerRef.current;
        if (stickyContainer !== null) {
          positionSticky(stickyContainer, position);
        }
      }
    });
    const removeRootListener = editor.registerRootListener((nextRootElem, prevRootElem) => {
      if (prevRootElem !== null) {
        resizeObserver.unobserve(prevRootElem);
      }
      if (nextRootElem !== null) {
        resizeObserver.observe(nextRootElem);
      }
    });
    const handleWindowResize = () => {
      const rootElement = editor.getRootElement();
      const stickyContainer = stickyContainerRef.current;
      if (rootElement !== null && stickyContainer !== null) {
        position.rootElementRect = rootElement.getBoundingClientRect();
        positionSticky(stickyContainer, position);
      }
    };
    const handleScroll = () => {
      const rootElement = editor.getRootElement();
      const stickyContainer = stickyContainerRef.current;
      if (rootElement !== null && stickyContainer !== null) {
        position.rootElementRect = rootElement.getBoundingClientRect();
        positionSticky(stickyContainer, position);
      }
    };
    window.addEventListener("resize", handleWindowResize);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("scroll", handleScroll, true);
      removeRootListener();
    };
  }, [editor]);
  useEffect10(() => {
    const stickyContainer = stickyContainerRef.current;
    if (stickyContainer !== null) {
      setTimeout(() => {
        stickyContainer.style.setProperty("transition", "top 0.3s ease 0s, left 0.3s ease 0s");
      }, 500);
    }
  }, []);
  const handlePointerMove = (event) => {
    const stickyContainer = stickyContainerRef.current;
    const positioning = positioningRef.current;
    const rootElementRect = positioning.rootElementRect;
    const zoom = calculateZoomLevel2(stickyContainer);
    if (stickyContainer !== null && positioning.isDragging && rootElementRect !== null && portalContainer !== null) {
      const portalRect = portalContainer.getBoundingClientRect();
      let newX = (event.clientX - portalRect.left) / zoom - positioning.offsetX;
      let newY = (event.clientY - portalRect.top) / zoom - positioning.offsetY;
      const stickyRect = stickyContainer.getBoundingClientRect();
      const stickyWidth = stickyRect.width / zoom;
      const stickyHeight = stickyRect.height / zoom;
      const maxX = rootElementRect.width - stickyWidth;
      const maxY = rootElementRect.height - stickyHeight;
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      positioning.x = newX;
      positioning.y = newY;
      positionSticky(stickyContainer, positioning);
    }
  };
  const handlePointerUp = (_event) => {
    const stickyContainer = stickyContainerRef.current;
    const positioning = positioningRef.current;
    if (stickyContainer !== null) {
      positioning.isDragging = false;
      stickyContainer.classList.remove("dragging");
      editor.update(() => {
        const node = $getNodeByKey5(nodeKey);
        if ($isStickyNode(node)) {
          node.setPosition(positioning.x, positioning.y);
        }
      });
    }
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };
  const handleDelete = () => {
    editor.update(() => {
      const node = $getNodeByKey5(nodeKey);
      if ($isStickyNode(node)) {
        node.remove();
      }
    });
  };
  const handleColorChange = () => {
    editor.update(() => {
      const node = $getNodeByKey5(nodeKey);
      if ($isStickyNode(node)) {
        node.toggleColor();
      }
    });
  };
  useSharedHistoryContext();
  const stickyContent = /* @__PURE__ */ jsx17("div", { ref: stickyContainerRef, className: "sticky-note-container", children: /* @__PURE__ */ jsxs7(
    "div",
    {
      className: `sticky-note ${color}`,
      onPointerDown: (event) => {
        const stickyContainer = stickyContainerRef.current;
        if (stickyContainer == null || event.button === 2 || event.target !== stickyContainer.firstChild) {
          return;
        }
        const stickContainer = stickyContainer;
        const positioning = positioningRef.current;
        if (stickContainer !== null && portalContainer !== null) {
          const portalRect = portalContainer.getBoundingClientRect();
          const zoom = calculateZoomLevel2(stickContainer);
          positioning.offsetX = (event.clientX - portalRect.left) / zoom - positioning.x;
          positioning.offsetY = (event.clientY - portalRect.top) / zoom - positioning.y;
          positioning.isDragging = true;
          stickContainer.classList.add("dragging");
          document.addEventListener("pointermove", handlePointerMove);
          document.addEventListener("pointerup", handlePointerUp);
          event.preventDefault();
        }
      },
      children: [
        /* @__PURE__ */ jsx17("button", { type: "button", onClick: handleDelete, className: "delete", "aria-label": "Delete sticky note", title: "Delete", children: "X" }),
        /* @__PURE__ */ jsx17(
          "button",
          {
            type: "button",
            onClick: handleColorChange,
            className: "color",
            "aria-label": "Change sticky note color",
            title: "Color",
            children: /* @__PURE__ */ jsx17("i", { className: "bucket" })
          }
        ),
        /* @__PURE__ */ jsx17(LexicalNestedComposer2, { initialEditor: caption, initialTheme: StickyEditorTheme_default, children: /* @__PURE__ */ jsx17(
          PlainTextPlugin,
          {
            contentEditable: /* @__PURE__ */ jsx17(
              LexicalContentEditable,
              {
                placeholder: "What's up?",
                placeholderClassName: "StickyNode__placeholder",
                className: "StickyNode__contentEditable"
              }
            ),
            ErrorBoundary: LexicalErrorBoundary2
          }
        ) })
      ]
    }
  ) });
  if (!portalContainer) {
    return null;
  }
  return createPortal2(stickyContent, portalContainer);
}
var init_StickyComponent = __esm({
  "src/nodes/StickyComponent.tsx"() {
    "use strict";
    init_StickyNode();
    init_SharedHistoryContext();
    init_StickyEditorTheme2();
    init_ContentEditable2();
    init_StickyNode2();
  }
});

// src/nodes/StickyNode.tsx
import { $setSelection as $setSelection4, createEditor as createEditor2, DecoratorNode as DecoratorNode5 } from "lexical";
import * as React4 from "react";
import { jsx as jsx18 } from "react/jsx-runtime";
function $isStickyNode(node) {
  return node instanceof StickyNode;
}
function $createStickyNode(xOffset, yOffset) {
  return new StickyNode(xOffset, yOffset, "yellow");
}
var StickyComponent2, StickyNode;
var init_StickyNode2 = __esm({
  "src/nodes/StickyNode.tsx"() {
    "use strict";
    StickyComponent2 = React4.lazy(() => Promise.resolve().then(() => (init_StickyComponent(), StickyComponent_exports)));
    StickyNode = class _StickyNode extends DecoratorNode5 {
      __x;
      __y;
      __color;
      __caption;
      static getType() {
        return "sticky";
      }
      static clone(node) {
        return new _StickyNode(node.__x, node.__y, node.__color, node.__caption, node.__key);
      }
      static importJSON(serializedNode) {
        return new _StickyNode(serializedNode.xOffset, serializedNode.yOffset, serializedNode.color).updateFromJSON(
          serializedNode
        );
      }
      updateFromJSON(serializedNode) {
        const stickyNode = super.updateFromJSON(serializedNode);
        const caption = serializedNode.caption;
        const nestedEditor = stickyNode.__caption;
        const editorState = nestedEditor.parseEditorState(caption.editorState);
        if (!editorState.isEmpty()) {
          nestedEditor.setEditorState(editorState);
        }
        return stickyNode;
      }
      constructor(x, y2, color, caption, key) {
        super(key);
        this.__x = x;
        this.__y = y2;
        this.__caption = caption || createEditor2();
        this.__color = color;
      }
      exportJSON() {
        return {
          ...super.exportJSON(),
          caption: this.__caption.toJSON(),
          color: this.__color,
          xOffset: this.__x,
          yOffset: this.__y
        };
      }
      createDOM(_config) {
        const div = document.createElement("div");
        div.style.display = "contents";
        return div;
      }
      updateDOM() {
        return false;
      }
      setPosition(x, y2) {
        const writable = this.getWritable();
        writable.__x = x;
        writable.__y = y2;
        $setSelection4(null);
      }
      toggleColor() {
        const writable = this.getWritable();
        writable.__color = writable.__color === "pink" ? "yellow" : "pink";
      }
      decorate(_editor, _config) {
        return /* @__PURE__ */ jsx18(
          StickyComponent2,
          {
            color: this.__color,
            x: this.__x,
            y: this.__y,
            nodeKey: this.getKey(),
            caption: this.__caption
          }
        );
      }
      isIsolated() {
        return true;
      }
    };
  }
});

// src/nodes/AutocompleteNode.tsx
import { TextNode } from "lexical";

// src/plugins/AutocompletePlugin/index.tsx
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isAtNodeEnd } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
  $addUpdateTag,
  $createTextNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  HISTORY_MERGE_TAG,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_TAB_COMMAND
} from "lexical";
import { useCallback as useCallback2, useEffect as useEffect2 } from "react";

// src/context/ToolbarContext.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { jsx } from "react/jsx-runtime";
var DEFAULT_FONT_SIZE = 15;
var INITIAL_TOOLBAR_STATE = {
  bgColor: "#fff",
  blockType: "paragraph",
  canRedo: false,
  canUndo: false,
  codeLanguage: "",
  codeTheme: "",
  elementFormat: "left",
  fontColor: "#000",
  fontFamily: "Arial",
  // Current font size in px
  fontSize: `${DEFAULT_FONT_SIZE}px`,
  // Font size input value - for controlled input
  fontSizeInputValue: `${DEFAULT_FONT_SIZE}`,
  isBold: false,
  isCode: false,
  isHighlight: false,
  isImageCaption: false,
  isItalic: false,
  isLink: false,
  isRTL: false,
  isStrikethrough: false,
  isSubscript: false,
  isSuperscript: false,
  isUnderline: false,
  isLowercase: false,
  isUppercase: false,
  isCapitalize: false,
  rootType: "root",
  listStartNumber: null
};
var Context = createContext(void 0);

// src/plugins/AutocompletePlugin/index.tsx
var uuid = Math.random().toString(36).replace(/[^a-z]+/g, "").substring(0, 5);

// src/nodes/AutocompleteNode.tsx
var AutocompleteNode = class _AutocompleteNode extends TextNode {
  /**
   * A unique uuid is generated for each session and assigned to the instance.
   * This helps to:
   * - Ensures max one Autocomplete node per session.
   * - Ensure that when collaboration is enabled, this node is not shown in
   *   other sessions.
   * See https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/AutocompletePlugin/index.tsx
   */
  __uuid;
  static clone(node) {
    return new _AutocompleteNode(node.__text, node.__uuid, node.__key);
  }
  static getType() {
    return "autocomplete";
  }
  static importDOM() {
    return null;
  }
  static importJSON(serializedNode) {
    return $createAutocompleteNode(serializedNode.text, serializedNode.uuid).updateFromJSON(serializedNode);
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      uuid: this.__uuid
    };
  }
  constructor(text, uuid2, key) {
    super(text, key);
    this.__uuid = uuid2;
  }
  updateDOM(_prevNode, _dom, _config) {
    return false;
  }
  exportDOM(_) {
    return { element: null };
  }
  excludeFromCopy() {
    return true;
  }
  createDOM(config) {
    const dom = super.createDOM(config);
    dom.classList.add(config.theme.autocomplete);
    if (this.__uuid !== uuid) {
      dom.style.display = "none";
    }
    return dom;
  }
};
function $createAutocompleteNode(text, uuid2) {
  return new AutocompleteNode(text, uuid2).setMode("token");
}

// src/plugins/CollapsiblePlugin/CollapsibleContainerNode.ts
import { IS_CHROME } from "@lexical/utils";
import {
  $getSiblingCaret,
  $isElementNode,
  $rewindSiblingCaret,
  ElementNode,
  isHTMLElement
} from "lexical";

// src/plugins/CollapsiblePlugin/CollapsibleUtils.ts
function setDomHiddenUntilFound(dom) {
  dom.hidden = "until-found";
}
function domOnBeforeMatch(dom, callback) {
  dom.onbeforematch = callback;
}

// src/plugins/CollapsiblePlugin/CollapsibleContainerNode.ts
function $convertDetailsElement(domNode) {
  const isOpen = domNode.open !== void 0 ? domNode.open : true;
  const node = $createCollapsibleContainerNode(isOpen);
  return {
    node
  };
}
var CollapsibleContainerNode = class _CollapsibleContainerNode extends ElementNode {
  __open;
  constructor(open, key) {
    super(key);
    this.__open = open;
  }
  static getType() {
    return "collapsible-container";
  }
  static clone(node) {
    return new _CollapsibleContainerNode(node.__open, node.__key);
  }
  isShadowRoot() {
    return true;
  }
  collapseAtStart(_selection) {
    const nodesToInsert = [];
    for (const child of this.getChildren()) {
      if ($isElementNode(child)) {
        nodesToInsert.push(...child.getChildren());
      }
    }
    const caret = $rewindSiblingCaret($getSiblingCaret(this, "previous"));
    caret.splice(1, nodesToInsert);
    const [firstChild] = nodesToInsert;
    if (firstChild) {
      firstChild.selectStart().deleteCharacter(true);
    }
    return true;
  }
  createDOM(_config, editor) {
    let dom;
    if (IS_CHROME) {
      dom = document.createElement("div");
      dom.setAttribute("open", "");
    } else {
      const detailsDom = document.createElement("details");
      detailsDom.open = this.__open;
      detailsDom.addEventListener("toggle", () => {
        const open = editor.getEditorState().read(() => this.getOpen());
        if (open !== detailsDom.open) {
          editor.update(() => this.toggleOpen());
        }
      });
      dom = detailsDom;
    }
    dom.classList.add("Collapsible__container");
    return dom;
  }
  updateDOM(prevNode, dom) {
    const currentOpen = this.__open;
    if (prevNode.__open !== currentOpen) {
      if (IS_CHROME) {
        const contentDom = dom.children[1];
        if (!isHTMLElement(contentDom)) {
          throw new Error("Expected contentDom to be an HTMLElement");
        }
        if (currentOpen) {
          dom.setAttribute("open", "");
          contentDom.hidden = false;
        } else {
          dom.removeAttribute("open");
          setDomHiddenUntilFound(contentDom);
        }
      } else {
        dom.open = this.__open;
      }
    }
    return false;
  }
  static importDOM() {
    return {
      details: (_domNode) => {
        return {
          conversion: $convertDetailsElement,
          priority: 1
        };
      }
    };
  }
  static importJSON(serializedNode) {
    return $createCollapsibleContainerNode(serializedNode.open).updateFromJSON(serializedNode);
  }
  exportDOM() {
    const element = document.createElement("details");
    element.classList.add("Collapsible__container");
    element.setAttribute("open", this.__open.toString());
    return { element };
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      open: this.__open
    };
  }
  setOpen(open) {
    const writable = this.getWritable();
    writable.__open = open;
  }
  getOpen() {
    return this.getLatest().__open;
  }
  toggleOpen() {
    this.setOpen(!this.getOpen());
  }
};
function $createCollapsibleContainerNode(isOpen) {
  return new CollapsibleContainerNode(isOpen);
}
function $isCollapsibleContainerNode(node) {
  return node instanceof CollapsibleContainerNode;
}

// src/plugins/CollapsiblePlugin/CollapsibleContentNode.ts
import { IS_CHROME as IS_CHROME2 } from "@lexical/utils";
import {
  ElementNode as ElementNode2
} from "lexical";
function $convertCollapsibleContentElement(_domNode) {
  const node = $createCollapsibleContentNode();
  return {
    node
  };
}
var CollapsibleContentNode = class _CollapsibleContentNode extends ElementNode2 {
  static getType() {
    return "collapsible-content";
  }
  static clone(node) {
    return new _CollapsibleContentNode(node.__key);
  }
  createDOM(_config, editor) {
    const dom = document.createElement("div");
    dom.classList.add("Collapsible__content");
    if (IS_CHROME2) {
      editor.getEditorState().read(() => {
        const containerNode = this.getParentOrThrow();
        if (!$isCollapsibleContainerNode(containerNode)) {
          throw new Error("Expected parent node to be a CollapsibleContainerNode");
        }
        if (!containerNode.__open) {
          setDomHiddenUntilFound(dom);
        }
      });
      domOnBeforeMatch(dom, () => {
        editor.update(() => {
          const containerNode = this.getParentOrThrow().getLatest();
          if (!$isCollapsibleContainerNode(containerNode)) {
            throw new Error("Expected parent node to be a CollapsibleContainerNode");
          }
          if (!containerNode.__open) {
            containerNode.toggleOpen();
          }
        });
      });
    }
    return dom;
  }
  updateDOM(_prevNode, _dom) {
    return false;
  }
  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-collapsible-content")) {
          return null;
        }
        return {
          conversion: $convertCollapsibleContentElement,
          priority: 2
        };
      }
    };
  }
  exportDOM() {
    const element = document.createElement("div");
    element.classList.add("Collapsible__content");
    element.setAttribute("data-lexical-collapsible-content", "true");
    return { element };
  }
  static importJSON(serializedNode) {
    return $createCollapsibleContentNode().updateFromJSON(serializedNode);
  }
  isShadowRoot() {
    return true;
  }
};
function $createCollapsibleContentNode() {
  return new CollapsibleContentNode();
}
function $isCollapsibleContentNode(node) {
  return node instanceof CollapsibleContentNode;
}

// src/plugins/CollapsiblePlugin/CollapsibleTitleNode.ts
import { IS_CHROME as IS_CHROME3 } from "@lexical/utils";
import {
  $createParagraphNode,
  $isElementNode as $isElementNode2,
  buildImportMap,
  ElementNode as ElementNode3
} from "lexical";
function $convertSummaryElement(_domNode) {
  const node = $createCollapsibleTitleNode();
  return {
    node
  };
}
var CollapsibleTitleNode = class extends ElementNode3 {
  /** @internal */
  $config() {
    return this.config("collapsible-title", {
      $transform(node) {
        if (node.isEmpty()) {
          node.remove();
        }
      },
      extends: ElementNode3,
      importDOM: buildImportMap({
        summary: () => ({
          conversion: $convertSummaryElement,
          priority: 1
        })
      })
    });
  }
  createDOM(_config, editor) {
    const dom = document.createElement("summary");
    dom.classList.add("Collapsible__title");
    if (IS_CHROME3) {
      dom.addEventListener("click", () => {
        editor.update(() => {
          const collapsibleContainer = this.getLatest().getParentOrThrow();
          if (!$isCollapsibleContainerNode(collapsibleContainer)) {
            throw new Error("Expected parent node to be a CollapsibleContainerNode");
          }
          collapsibleContainer.toggleOpen();
        });
      });
    }
    return dom;
  }
  updateDOM(_prevNode, _dom) {
    return false;
  }
  insertNewAfter(_, restoreSelection = true) {
    const containerNode = this.getParentOrThrow();
    if (!$isCollapsibleContainerNode(containerNode)) {
      throw new Error("CollapsibleTitleNode expects to be child of CollapsibleContainerNode");
    }
    if (containerNode.getOpen()) {
      const contentNode = this.getNextSibling();
      if (!$isCollapsibleContentNode(contentNode)) {
        throw new Error("CollapsibleTitleNode expects to have CollapsibleContentNode sibling");
      }
      const firstChild = contentNode.getFirstChild();
      if ($isElementNode2(firstChild)) {
        return firstChild;
      } else {
        const paragraph = $createParagraphNode();
        contentNode.append(paragraph);
        return paragraph;
      }
    } else {
      const paragraph = $createParagraphNode();
      containerNode.insertAfter(paragraph, restoreSelection);
      return paragraph;
    }
  }
};
function $createCollapsibleTitleNode() {
  return new CollapsibleTitleNode();
}
function $isCollapsibleTitleNode(node) {
  return node instanceof CollapsibleTitleNode;
}

// src/nodes/index.ts
init_DateTimeNode2();
init_EmojiNode();
init_EquationNode();
init_EquationComponent();

// src/nodes/FigmaNode.tsx
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import { DecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import { jsx as jsx8 } from "react/jsx-runtime";
function FigmaComponent({ className, format, nodeKey, documentID }) {
  return /* @__PURE__ */ jsx8(BlockWithAlignableContents, { className, format, nodeKey, children: /* @__PURE__ */ jsx8(
    "iframe",
    {
      width: "560",
      height: "315",
      src: `https://www.figma.com/embed?embed_host=lexical&url=        https://www.figma.com/file/${documentID}`,
      allowFullScreen: true
    }
  ) });
}
var FigmaNode = class _FigmaNode extends DecoratorBlockNode {
  __id;
  static getType() {
    return "figma";
  }
  static clone(node) {
    return new _FigmaNode(node.__id, node.__format, node.__key);
  }
  static importJSON(serializedNode) {
    return $createFigmaNode(serializedNode.documentID).updateFromJSON(serializedNode);
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      documentID: this.__id
    };
  }
  constructor(id, format, key) {
    super(format, key);
    this.__id = id;
  }
  updateDOM() {
    return false;
  }
  getId() {
    return this.__id;
  }
  getTextContent(_includeInert, _includeDirectionless) {
    return `https://www.figma.com/file/${this.__id}`;
  }
  decorate(_editor, config) {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || ""
    };
    return /* @__PURE__ */ jsx8(FigmaComponent, { className, format: this.__format, nodeKey: this.getKey(), documentID: this.__id });
  }
};
function $createFigmaNode(documentID) {
  return new FigmaNode(documentID);
}
function $isFigmaNode(node) {
  return node instanceof FigmaNode;
}

// src/nodes/index.ts
init_ImageNode2();
init_ImageComponent();
init_KeywordNode();

// src/nodes/LayoutContainerNode.ts
import { addClassNamesToElement } from "@lexical/utils";
import { ElementNode as ElementNode4 } from "lexical";
function $convertLayoutContainerElement(domNode) {
  const styleAttributes = window.getComputedStyle(domNode);
  const templateColumns = styleAttributes.getPropertyValue("grid-template-columns");
  if (templateColumns) {
    const node = $createLayoutContainerNode(templateColumns);
    return { node };
  }
  return null;
}
var LayoutContainerNode = class _LayoutContainerNode extends ElementNode4 {
  __templateColumns;
  constructor(templateColumns, key) {
    super(key);
    this.__templateColumns = templateColumns;
  }
  static getType() {
    return "layout-container";
  }
  static clone(node) {
    return new _LayoutContainerNode(node.__templateColumns, node.__key);
  }
  createDOM(config) {
    const dom = document.createElement("div");
    dom.style.gridTemplateColumns = this.__templateColumns;
    if (typeof config.theme.layoutContainer === "string") {
      addClassNamesToElement(dom, config.theme.layoutContainer);
    }
    return dom;
  }
  exportDOM() {
    const element = document.createElement("div");
    element.style.gridTemplateColumns = this.__templateColumns;
    element.setAttribute("data-lexical-layout-container", "true");
    return { element };
  }
  updateDOM(prevNode, dom) {
    if (prevNode.__templateColumns !== this.__templateColumns) {
      dom.style.gridTemplateColumns = this.__templateColumns;
    }
    return false;
  }
  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-layout-container")) {
          return null;
        }
        return {
          conversion: $convertLayoutContainerElement,
          priority: 2
        };
      }
    };
  }
  static importJSON(json) {
    return $createLayoutContainerNode().updateFromJSON(json);
  }
  updateFromJSON(serializedNode) {
    return super.updateFromJSON(serializedNode).setTemplateColumns(serializedNode.templateColumns);
  }
  isShadowRoot() {
    return true;
  }
  canBeEmpty() {
    return false;
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      templateColumns: this.__templateColumns
    };
  }
  getTemplateColumns() {
    return this.getLatest().__templateColumns;
  }
  setTemplateColumns(templateColumns) {
    const self = this.getWritable();
    self.__templateColumns = templateColumns;
    return self;
  }
};
function $createLayoutContainerNode(templateColumns = "") {
  return new LayoutContainerNode(templateColumns);
}
function $isLayoutContainerNode(node) {
  return node instanceof LayoutContainerNode;
}

// src/nodes/LayoutItemNode.ts
import { addClassNamesToElement as addClassNamesToElement2 } from "@lexical/utils";
import { $isParagraphNode as $isParagraphNode2, ElementNode as ElementNode5 } from "lexical";
function $convertLayoutItemElement() {
  return { node: $createLayoutItemNode() };
}
function $isEmptyLayoutItemNode(node) {
  if (!$isLayoutItemNode(node) || node.getChildrenSize() !== 1) {
    return false;
  }
  const firstChild = node.getFirstChild();
  return $isParagraphNode2(firstChild) && firstChild.isEmpty();
}
var LayoutItemNode = class _LayoutItemNode extends ElementNode5 {
  static getType() {
    return "layout-item";
  }
  static clone(node) {
    return new _LayoutItemNode(node.__key);
  }
  createDOM(config) {
    const dom = document.createElement("div");
    dom.setAttribute("data-lexical-layout-item", "true");
    if (typeof config.theme.layoutItem === "string") {
      addClassNamesToElement2(dom, config.theme.layoutItem);
    }
    return dom;
  }
  updateDOM() {
    return false;
  }
  collapseAtStart() {
    const parent = this.getParentOrThrow();
    if (this.is(parent.getFirstChild()) && parent.getChildren().every($isEmptyLayoutItemNode)) {
      parent.remove();
      return true;
    }
    return false;
  }
  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-layout-item")) {
          return null;
        }
        return {
          conversion: $convertLayoutItemElement,
          priority: 2
        };
      }
    };
  }
  static importJSON(serializedNode) {
    return $createLayoutItemNode().updateFromJSON(serializedNode);
  }
  isShadowRoot() {
    return true;
  }
};
function $createLayoutItemNode() {
  return new LayoutItemNode();
}
function $isLayoutItemNode(node) {
  return node instanceof LayoutItemNode;
}

// src/nodes/index.ts
init_MentionNode();

// src/nodes/PageBreakNode/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext7 } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection as useLexicalNodeSelection3 } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister as mergeRegister4 } from "@lexical/utils";
import {
  CLICK_COMMAND as CLICK_COMMAND2,
  COMMAND_PRIORITY_HIGH as COMMAND_PRIORITY_HIGH2,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW3,
  DecoratorNode as DecoratorNode4
} from "lexical";
import { useEffect as useEffect9 } from "react";
import { jsx as jsx16 } from "react/jsx-runtime";
function PageBreakComponent({ nodeKey }) {
  const [editor] = useLexicalComposerContext7();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection3(nodeKey);
  useEffect9(() => {
    return mergeRegister4(
      editor.registerCommand(
        CLICK_COMMAND2,
        (event) => {
          const pbElem = editor.getElementByKey(nodeKey);
          if (event.target === pbElem) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW3
      )
    );
  }, [clearSelection, editor, isSelected, nodeKey, setSelected]);
  useEffect9(() => {
    const pbElem = editor.getElementByKey(nodeKey);
    if (pbElem !== null) {
      pbElem.className = isSelected ? "selected" : "";
    }
  }, [editor, isSelected, nodeKey]);
  return null;
}
var PageBreakNode = class _PageBreakNode extends DecoratorNode4 {
  static getType() {
    return "page-break";
  }
  static clone(node) {
    return new _PageBreakNode(node.__key);
  }
  static importJSON(serializedNode) {
    return $createPageBreakNode().updateFromJSON(serializedNode);
  }
  static importDOM() {
    return {
      figure: (domNode) => {
        const tp = domNode.getAttribute("type");
        if (tp !== _PageBreakNode.getType()) {
          return null;
        }
        return {
          conversion: $convertPageBreakElement,
          priority: COMMAND_PRIORITY_HIGH2
        };
      }
    };
  }
  createDOM() {
    const el = document.createElement("figure");
    el.style.pageBreakAfter = "always";
    el.setAttribute("type", this.getType());
    return el;
  }
  getTextContent() {
    return "\n";
  }
  isInline() {
    return false;
  }
  updateDOM() {
    return false;
  }
  decorate() {
    return /* @__PURE__ */ jsx16(PageBreakComponent, { nodeKey: this.__key });
  }
};
function $convertPageBreakElement() {
  return { node: $createPageBreakNode() };
}
function $createPageBreakNode() {
  return new PageBreakNode();
}
function $isPageBreakNode(node) {
  return node instanceof PageBreakNode;
}

// src/nodes/SpecialTextNode.tsx
import { addClassNamesToElement as addClassNamesToElement3 } from "@lexical/utils";
import { $applyNodeReplacement as $applyNodeReplacement6, TextNode as TextNode7 } from "lexical";
var SpecialTextNode = class _SpecialTextNode extends TextNode7 {
  static getType() {
    return "specialText";
  }
  static clone(node) {
    return new _SpecialTextNode(node.__text, node.__key);
  }
  createDOM(config) {
    const dom = document.createElement("span");
    addClassNamesToElement3(dom, config.theme.specialText);
    dom.textContent = this.getTextContent();
    return dom;
  }
  updateDOM(prevNode, dom, config) {
    if (prevNode.__text.startsWith("[") && prevNode.__text.endsWith("]")) {
      const strippedText = this.__text.substring(1, this.__text.length - 1);
      dom.textContent = strippedText;
    }
    addClassNamesToElement3(dom, config.theme.specialText);
    return false;
  }
  static importJSON(serializedNode) {
    return $createSpecialTextNode().updateFromJSON(serializedNode);
  }
  isTextEntity() {
    return true;
  }
  canInsertTextAfter() {
    return false;
  }
};
function $createSpecialTextNode(text = "") {
  return $applyNodeReplacement6(new SpecialTextNode(text));
}
function $isSpecialTextNode(node) {
  return node instanceof SpecialTextNode;
}

// src/nodes/index.ts
init_StickyNode2();
init_StickyComponent();

// src/nodes/TweetNode.tsx
import { BlockWithAlignableContents as BlockWithAlignableContents2 } from "@lexical/react/LexicalBlockWithAlignableContents";
import { DecoratorBlockNode as DecoratorBlockNode2 } from "@lexical/react/LexicalDecoratorBlockNode";
import { useCallback as useCallback6, useEffect as useEffect11, useRef as useRef7, useState as useState7 } from "react";
import { jsx as jsx19, jsxs as jsxs8 } from "react/jsx-runtime";
var WIDGET_SCRIPT_URL = "https://platform.twitter.com/widgets.js";
function $convertTweetElement(domNode) {
  const id = domNode.getAttribute("data-lexical-tweet-id");
  if (id) {
    const node = $createTweetNode(id);
    return { node };
  }
  return null;
}
var isTwitterScriptLoading = true;
function TweetComponent({
  className,
  format,
  loadingComponent,
  nodeKey,
  onError,
  onLoad,
  tweetID
}) {
  const containerRef = useRef7(null);
  const previousTweetIDRef = useRef7("");
  const [isTweetLoading, setIsTweetLoading] = useState7(false);
  const createTweet = useCallback6(async () => {
    try {
      await window.twttr.widgets.createTweet(tweetID, containerRef.current);
      setIsTweetLoading(false);
      isTwitterScriptLoading = false;
      if (onLoad) {
        onLoad();
      }
    } catch (error) {
      if (onError) {
        onError(String(error));
      }
    }
  }, [onError, onLoad, tweetID]);
  useEffect11(() => {
    if (tweetID !== previousTweetIDRef.current) {
      setIsTweetLoading(true);
      if (isTwitterScriptLoading) {
        const script = document.createElement("script");
        script.src = WIDGET_SCRIPT_URL;
        script.async = true;
        document.body?.appendChild(script);
        script.onload = createTweet;
        if (onError) {
          script.onerror = onError;
        }
      } else {
        createTweet();
      }
      if (previousTweetIDRef) {
        previousTweetIDRef.current = tweetID;
      }
    }
  }, [createTweet, onError, tweetID]);
  return /* @__PURE__ */ jsxs8(BlockWithAlignableContents2, { className, format, nodeKey, children: [
    isTweetLoading ? loadingComponent : null,
    /* @__PURE__ */ jsx19("div", { style: { display: "inline-block", width: "550px" }, ref: containerRef })
  ] });
}
var TweetNode = class _TweetNode extends DecoratorBlockNode2 {
  __id;
  static getType() {
    return "tweet";
  }
  static clone(node) {
    return new _TweetNode(node.__id, node.__format, node.__key);
  }
  static importJSON(serializedNode) {
    return $createTweetNode(serializedNode.id).updateFromJSON(serializedNode);
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      id: this.getId()
    };
  }
  static importDOM() {
    return {
      div: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-tweet-id")) {
          return null;
        }
        return {
          conversion: $convertTweetElement,
          priority: 2
        };
      }
    };
  }
  exportDOM() {
    const element = document.createElement("div");
    element.setAttribute("data-lexical-tweet-id", this.__id);
    const text = document.createTextNode(this.getTextContent());
    element.append(text);
    return { element };
  }
  constructor(id, format, key) {
    super(format, key);
    this.__id = id;
  }
  getId() {
    return this.__id;
  }
  getTextContent(_includeInert, _includeDirectionless) {
    return `https://x.com/i/web/status/${this.__id}`;
  }
  decorate(_editor, config) {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || ""
    };
    return /* @__PURE__ */ jsx19(
      TweetComponent,
      {
        className,
        format: this.__format,
        loadingComponent: "Loading...",
        nodeKey: this.getKey(),
        tweetID: this.__id
      }
    );
  }
};
function $createTweetNode(tweetID) {
  return new TweetNode(tweetID);
}
function $isTweetNode(node) {
  return node instanceof TweetNode;
}

// src/nodes/YouTubeNode.tsx
import { BlockWithAlignableContents as BlockWithAlignableContents3 } from "@lexical/react/LexicalBlockWithAlignableContents";
import { DecoratorBlockNode as DecoratorBlockNode3 } from "@lexical/react/LexicalDecoratorBlockNode";
import { jsx as jsx20 } from "react/jsx-runtime";
function YouTubeComponent({ className, format, nodeKey, videoID }) {
  return /* @__PURE__ */ jsx20(BlockWithAlignableContents3, { className, format, nodeKey, children: /* @__PURE__ */ jsx20(
    "iframe",
    {
      width: "560",
      height: "315",
      src: `https://www.youtube-nocookie.com/embed/${videoID}`,
      frameBorder: "0",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      allowFullScreen: true,
      title: "YouTube video"
    }
  ) });
}
function $convertYoutubeElement(domNode) {
  const videoID = domNode.getAttribute("data-lexical-youtube");
  if (videoID) {
    const node = $createYouTubeNode(videoID);
    return { node };
  }
  return null;
}
var YouTubeNode = class _YouTubeNode extends DecoratorBlockNode3 {
  __id;
  static getType() {
    return "youtube";
  }
  static clone(node) {
    return new _YouTubeNode(node.__id, node.__format, node.__key);
  }
  static importJSON(serializedNode) {
    return $createYouTubeNode(serializedNode.videoID).updateFromJSON(serializedNode);
  }
  exportJSON() {
    return {
      ...super.exportJSON(),
      videoID: this.__id
    };
  }
  constructor(id, format, key) {
    super(format, key);
    this.__id = id;
  }
  exportDOM() {
    const element = document.createElement("iframe");
    element.setAttribute("data-lexical-youtube", this.__id);
    element.setAttribute("width", "560");
    element.setAttribute("height", "315");
    element.setAttribute("src", `https://www.youtube-nocookie.com/embed/${this.__id}`);
    element.setAttribute("frameborder", "0");
    element.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    );
    element.setAttribute("allowfullscreen", "true");
    element.setAttribute("title", "YouTube video");
    return { element };
  }
  static importDOM() {
    return {
      iframe: (domNode) => {
        if (!domNode.hasAttribute("data-lexical-youtube")) {
          return null;
        }
        return {
          conversion: $convertYoutubeElement,
          priority: 1
        };
      }
    };
  }
  updateDOM() {
    return false;
  }
  getId() {
    return this.__id;
  }
  getTextContent(_includeInert, _includeDirectionless) {
    return `https://www.youtube.com/watch?v=${this.__id}`;
  }
  decorate(_editor, config) {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || ""
    };
    return /* @__PURE__ */ jsx20(YouTubeComponent, { className, format: this.__format, nodeKey: this.getKey(), videoID: this.__id });
  }
};
function $createYouTubeNode(videoID) {
  return new YouTubeNode(videoID);
}
function $isYouTubeNode(node) {
  return node instanceof YouTubeNode;
}

// src/nodes/NotionLikeEditorNodes.ts
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HashtagNode as HashtagNode2 } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode as LinkNode2 } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
init_DateTimeNode2();
init_EmojiNode();
init_EquationNode();
init_ImageNode2();
init_KeywordNode();
init_MentionNode();
init_StickyNode2();
var NotionLikeEditorNodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HashtagNode2,
  CodeHighlightNode,
  AutoLinkNode,
  LinkNode2,
  OverflowNode,
  StickyNode,
  ImageNode,
  MentionNode,
  EmojiNode,
  EquationNode,
  AutocompleteNode,
  KeywordNode,
  HorizontalRuleNode,
  TweetNode,
  YouTubeNode,
  FigmaNode,
  MarkNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  PageBreakNode,
  LayoutContainerNode,
  LayoutItemNode,
  SpecialTextNode,
  DateTimeNode
];
var NotionLikeEditorNodes_default = NotionLikeEditorNodes;
export {
  $createAutocompleteNode,
  $createCollapsibleContainerNode,
  $createCollapsibleContentNode,
  $createCollapsibleTitleNode,
  $createDateTimeNode,
  $createEmojiNode,
  $createEquationNode,
  $createFigmaNode,
  $createImageNode,
  $createKeywordNode,
  $createLayoutContainerNode,
  $createLayoutItemNode,
  $createMentionNode,
  $createPageBreakNode,
  $createSpecialTextNode,
  $createStickyNode,
  $createTweetNode,
  $createYouTubeNode,
  $isCollapsibleContainerNode,
  $isCollapsibleContentNode,
  $isCollapsibleTitleNode,
  $isDateTimeNode,
  $isEmojiNode,
  $isEquationNode,
  $isFigmaNode,
  $isImageNode,
  $isKeywordNode,
  $isLayoutContainerNode,
  $isLayoutItemNode,
  $isMentionNode,
  $isPageBreakNode,
  $isSpecialTextNode,
  $isStickyNode,
  $isTweetNode,
  $isYouTubeNode,
  AutocompleteNode,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  DateTimeNode,
  EmojiNode,
  EquationComponent,
  EquationNode,
  FigmaNode,
  ImageComponent,
  ImageNode,
  KeywordNode,
  LayoutContainerNode,
  LayoutItemNode,
  MentionNode,
  NotionLikeEditorNodes_default as NotionLikeEditorNodes,
  PageBreakNode,
  SpecialTextNode,
  StickyComponent,
  StickyNode,
  TweetNode,
  YouTubeNode
};
//# sourceMappingURL=nodes.mjs.map
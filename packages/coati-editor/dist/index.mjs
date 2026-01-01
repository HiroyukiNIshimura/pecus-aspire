var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/context/SharedHistoryContext.tsx
import { createEmptyHistoryState } from "@lexical/react/LexicalHistoryPlugin";
import { createContext as createContext2, useContext as useContext2, useMemo as useMemo2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var Context2, SharedHistoryContext, useSharedHistoryContext;
var init_SharedHistoryContext = __esm({
  "src/context/SharedHistoryContext.tsx"() {
    "use strict";
    Context2 = createContext2({});
    SharedHistoryContext = ({ children }) => {
      const historyContext = useMemo2(() => ({ historyState: createEmptyHistoryState() }), []);
      return /* @__PURE__ */ jsx2(Context2.Provider, { value: historyContext, children });
    };
    useSharedHistoryContext = () => {
      return useContext2(Context2);
    };
  }
});

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
import { useLexicalComposerContext as useLexicalComposerContext10 } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { setHours, setMinutes } from "date-fns";
import { $getNodeByKey as $getNodeByKey2 } from "lexical";
import { useEffect as useEffect12, useRef as useRef4, useState as useState9 } from "react";
import { DayPicker } from "react-day-picker";
import { jsx as jsx18, jsxs as jsxs6 } from "react/jsx-runtime";
function DateTimeComponent({
  dateTime,
  nodeKey
}) {
  const [editor] = useLexicalComposerContext10();
  const [isOpen, setIsOpen] = useState9(false);
  const ref = useRef4(null);
  const [selected, setSelected] = useState9(dateTime);
  const [includeTime, setIncludeTime] = useState9(() => {
    if (dateTime === void 0) {
      return false;
    }
    const hours = dateTime?.getHours();
    const minutes = dateTime?.getMinutes();
    return hours !== 0 || minutes !== 0;
  });
  const [timeValue, setTimeValue] = useState9(() => {
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
  useEffect12(() => {
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
  return /* @__PURE__ */ jsxs6(
    "div",
    {
      className: `dateTimePill ${isNodeSelected ? "selected" : ""}`,
      ref,
      style: { cursor: "pointer", width: "fit-content" },
      children: [
        dateTime?.toLocaleDateString(void 0, options) + (includeTime ? ` ${timeValue}` : "") || "Invalid Date",
        isOpen && /* @__PURE__ */ jsx18(FloatingPortal, { children: /* @__PURE__ */ jsx18(
          FloatingOverlay,
          {
            lockScroll: true,
            style: {
              zIndex: 2e3
            },
            children: /* @__PURE__ */ jsx18(FloatingFocusManager, { context, initialFocus: -1, children: /* @__PURE__ */ jsxs6(
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
                  /* @__PURE__ */ jsx18(DayPicker, { mode: "single", selected, onSelect: handleDaySelect }),
                  /* @__PURE__ */ jsx18("div", { className: "includeTime", children: /* @__PURE__ */ jsxs6("label", { htmlFor: "includeTime", style: { display: "inline-flex", alignItems: "center", gap: "6px" }, children: [
                    /* @__PURE__ */ jsx18("input", { id: "includeTime", type: "checkbox", checked: includeTime, onChange: handleCheckboxChange }),
                    /* @__PURE__ */ jsx18("span", { children: "Include time" })
                  ] }) }),
                  includeTime && /* @__PURE__ */ jsx18(
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
                  /* @__PURE__ */ jsx18("p", { style: { fontSize: "12px", color: "#666", marginTop: "8px" }, children: userTimeZone })
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
import { jsx as jsx19 } from "react/jsx-runtime";
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
        return /* @__PURE__ */ jsx19(DateTimeComponent2, { dateTime: this.getDateTime(), nodeKey: this.__key });
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
import { isHTMLElement as isHTMLElement3 } from "lexical";
import { forwardRef } from "react";
import { jsx as jsx20, jsxs as jsxs7 } from "react/jsx-runtime";
function EquationEditor({ equation, setEquation, inline }, forwardedRef) {
  const onChange = (event) => {
    setEquation(event.target.value);
  };
  return inline && isHTMLElement3(forwardedRef) ? /* @__PURE__ */ jsxs7("span", { className: "EquationEditor_inputBackground", children: [
    /* @__PURE__ */ jsx20("span", { className: "EquationEditor_dollarSign", children: "$" }),
    /* @__PURE__ */ jsx20(
      "input",
      {
        className: "EquationEditor_inlineEditor",
        value: equation,
        onChange,
        ref: forwardedRef
      }
    ),
    /* @__PURE__ */ jsx20("span", { className: "EquationEditor_dollarSign", children: "$" })
  ] }) : /* @__PURE__ */ jsxs7("div", { className: "EquationEditor_inputBackground", children: [
    /* @__PURE__ */ jsx20("span", { className: "EquationEditor_dollarSign", children: "$$\n" }),
    /* @__PURE__ */ jsx20(
      "textarea",
      {
        className: "EquationEditor_blockEditor",
        value: equation,
        onChange,
        ref: forwardedRef
      }
    ),
    /* @__PURE__ */ jsx20("span", { className: "EquationEditor_dollarSign", children: "\n$$" })
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
import { useEffect as useEffect14, useRef as useRef5 } from "react";
import { Fragment as Fragment4, jsx as jsx21, jsxs as jsxs8 } from "react/jsx-runtime";
function KatexRenderer({
  equation,
  inline,
  onDoubleClick
}) {
  const katexElementRef = useRef5(null);
  useEffect14(() => {
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
    /* @__PURE__ */ jsxs8(Fragment4, { children: [
      /* @__PURE__ */ jsx21(
        "img",
        {
          src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          width: "0",
          height: "0",
          alt: ""
        }
      ),
      /* @__PURE__ */ jsx21("span", { role: "button", tabIndex: -1, onDoubleClick, ref: katexElementRef }),
      /* @__PURE__ */ jsx21(
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
import { useLexicalComposerContext as useLexicalComposerContext12 } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { mergeRegister as mergeRegister4 } from "@lexical/utils";
import {
  $getNodeByKey as $getNodeByKey3,
  $getSelection as $getSelection4,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import { useCallback as useCallback6, useEffect as useEffect15, useRef as useRef6, useState as useState10 } from "react";
import { Fragment as Fragment5, jsx as jsx22 } from "react/jsx-runtime";
function EquationComponent({ equation, inline, nodeKey }) {
  const [editor] = useLexicalComposerContext12();
  const isEditable = useLexicalEditable();
  const [equationValue, setEquationValue] = useState10(equation);
  const [showEquationEditor, setShowEquationEditor] = useState10(false);
  const inputRef = useRef6(null);
  const onHide = useCallback6(
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
  useEffect15(() => {
    if (!showEquationEditor && equationValue !== equation) {
      setEquationValue(equation);
    }
  }, [showEquationEditor, equation, equationValue]);
  useEffect15(() => {
    if (!isEditable) {
      return;
    }
    if (showEquationEditor) {
      return mergeRegister4(
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
          const selection = $getSelection4();
          return $isNodeSelection(selection) && selection.has(nodeKey) && selection.getNodes().length === 1;
        });
        if (isSelected) {
          setShowEquationEditor(true);
        }
      });
    }
  }, [editor, nodeKey, onHide, showEquationEditor, isEditable]);
  return /* @__PURE__ */ jsx22(Fragment5, { children: showEquationEditor && isEditable ? /* @__PURE__ */ jsx22(EquationEditor_default, { equation: equationValue, setEquation: setEquationValue, inline, ref: inputRef }) : /* @__PURE__ */ jsx22(m, { onError: (e) => editor._onError(e), fallback: null, children: /* @__PURE__ */ jsx22(
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
import { $applyNodeReplacement, DecoratorNode as DecoratorNode2 } from "lexical";
import * as React2 from "react";
import { jsx as jsx23 } from "react/jsx-runtime";
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
  return $applyNodeReplacement(equationNode);
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
        return /* @__PURE__ */ jsx23(EquationComponent2, { equation: this.__equation, inline: this.__inline, nodeKey: this.__key });
      }
    };
  }
});

// src/nodes/EmojiNode.tsx
import { $applyNodeReplacement as $applyNodeReplacement2, TextNode as TextNode2 } from "lexical";
function $isEmojiNode(node) {
  return node instanceof EmojiNode;
}
function $createEmojiNode(className, emojiText) {
  const node = new EmojiNode(className, emojiText).setMode("token");
  return $applyNodeReplacement2(node);
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

// src/images/image-broken.svg
var image_broken_default;
var init_image_broken = __esm({
  "src/images/image-broken.svg"() {
    image_broken_default = 'data:image/svg+xml,<?xml version="1.0" encoding="utf-8"?><!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->%0A<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">%0A    <path d="M22 3H2v18h20v-2h-2v-2h2v-2h-2v-2h2v-2h-2V9h2V7h-2V5h2V3zm-2 4v2h-2v2h2v2h-2v2h2v2h-2v2H4V5h14v2h2zm-6 2h-2v2h-2v2H8v2H6v2h2v-2h2v-2h2v-2h2v2h2v-2h-2V9zM6 7h2v2H6V7z" fill="%23000000"/>%0A</svg>';
  }
});

// src/plugins/EmojisPlugin/index.ts
import { useLexicalComposerContext as useLexicalComposerContext15 } from "@lexical/react/LexicalComposerContext";
import { TextNode as TextNode4 } from "lexical";
import { useEffect as useEffect17 } from "react";
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
  useEffect17(() => {
    if (!editor.hasNodes([EmojiNode])) {
      throw new Error("EmojisPlugin: EmojiNode not registered on editor");
    }
    return editor.registerNodeTransform(TextNode4, $textNodeTransform);
  }, [editor]);
}
function EmojisPlugin() {
  const [editor] = useLexicalComposerContext15();
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
function sanitizeUrl(url) {
  try {
    const parsedUrl = new URL(url);
    if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
      return "about:blank";
    }
  } catch {
    return url;
  }
  return url;
}
function validateUrl(url) {
  return url === "https://" || urlRegExp.test(url);
}
var SUPPORTED_URL_PROTOCOLS, urlRegExp;
var init_url = __esm({
  "src/utils/url.ts"() {
    "use strict";
    SUPPORTED_URL_PROTOCOLS = /* @__PURE__ */ new Set(["http:", "https:", "mailto:", "sms:", "tel:"]);
    urlRegExp = new RegExp(
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
    );
  }
});

// src/plugins/LinkPlugin/index.tsx
import { LinkPlugin as LexicalLinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { jsx as jsx27 } from "react/jsx-runtime";
function LinkPlugin({ hasLinkAttributes = false }) {
  return /* @__PURE__ */ jsx27(
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
import { useLexicalComposerContext as useLexicalComposerContext16 } from "@lexical/react/LexicalComposerContext";
import { MenuOption } from "@lexical/react/LexicalNodeMenuPlugin";
import {
  LexicalTypeaheadMenuPlugin,
  useBasicTypeaheadTriggerMatch
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { useCallback as useCallback9, useEffect as useEffect18, useMemo as useMemo9, useState as useState12 } from "react";
import * as ReactDOM from "react-dom";
import { jsx as jsx28, jsxs as jsxs10 } from "react/jsx-runtime";
function useMentionLookupService(mentionString) {
  const [results, setResults] = useState12([]);
  useEffect18(() => {
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
  return /* @__PURE__ */ jsxs10(
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
        /* @__PURE__ */ jsx28("span", { className: "text", children: option.name })
      ]
    },
    option.key
  );
}
function NewMentionsPlugin() {
  const [editor] = useLexicalComposerContext16();
  const [queryString, setQueryString] = useState12(null);
  const results = useMentionLookupService(queryString);
  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0
  });
  const options = useMemo9(
    () => results.map((result) => new MentionTypeaheadOption(result, /* @__PURE__ */ jsx28("i", { className: "icon user" }))).slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results]
  );
  const onSelectOption = useCallback9(
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
  const checkForMentionMatch = useCallback9(
    (text) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor]
  );
  return /* @__PURE__ */ jsx28(
    LexicalTypeaheadMenuPlugin,
    {
      onQueryChange: setQueryString,
      onSelectOption,
      triggerFn: checkForMentionMatch,
      options,
      menuRenderFn: (anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => anchorElementRef.current && results.length ? ReactDOM.createPortal(
        /* @__PURE__ */ jsx28("div", { className: "notion-like-editor typeahead-popover mentions-menu", children: /* @__PURE__ */ jsx28("ul", { children: options.map((option, i) => /* @__PURE__ */ jsx28(
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
import { jsx as jsx29 } from "react/jsx-runtime";
function LexicalContentEditable({ className, placeholder, placeholderClassName }) {
  return /* @__PURE__ */ jsx29(
    ContentEditable,
    {
      className: className ?? "ContentEditable__root",
      "aria-placeholder": placeholder,
      placeholder: /* @__PURE__ */ jsx29("div", { className: placeholderClassName ?? "ContentEditable__placeholder", children: placeholder })
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
import { useRef as useRef7 } from "react";
import { jsx as jsx30, jsxs as jsxs11 } from "react/jsx-runtime";
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
  const controlWrapperRef = useRef7(null);
  const userSelect = useRef7({
    priority: "",
    value: "default"
  });
  const positioningRef = useRef7({
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
  return /* @__PURE__ */ jsxs11("div", { ref: controlWrapperRef, children: [
    !showCaption && captionsEnabled && /* @__PURE__ */ jsx30(
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
    /* @__PURE__ */ jsx30(
      "div",
      {
        className: "image-resizer image-resizer-n",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.north);
        }
      }
    ),
    /* @__PURE__ */ jsx30(
      "div",
      {
        className: "image-resizer image-resizer-ne",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.north | Direction.east);
        }
      }
    ),
    /* @__PURE__ */ jsx30(
      "div",
      {
        className: "image-resizer image-resizer-e",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.east);
        }
      }
    ),
    /* @__PURE__ */ jsx30(
      "div",
      {
        className: "image-resizer image-resizer-se",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south | Direction.east);
        }
      }
    ),
    /* @__PURE__ */ jsx30(
      "div",
      {
        className: "image-resizer image-resizer-s",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south);
        }
      }
    ),
    /* @__PURE__ */ jsx30(
      "div",
      {
        className: "image-resizer image-resizer-sw",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south | Direction.west);
        }
      }
    ),
    /* @__PURE__ */ jsx30(
      "div",
      {
        className: "image-resizer image-resizer-w",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.west);
        }
      }
    ),
    /* @__PURE__ */ jsx30(
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
import { useLexicalComposerContext as useLexicalComposerContext17 } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalEditable as useLexicalEditable2 } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection as useLexicalNodeSelection2 } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister as mergeRegister5 } from "@lexical/utils";
import {
  $getNodeByKey as $getNodeByKey4,
  $getRoot,
  $getSelection as $getSelection5,
  $isNodeSelection as $isNodeSelection2,
  $isRangeSelection as $isRangeSelection3,
  $setSelection as $setSelection3,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR6,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW3,
  createCommand as createCommand7,
  DRAGSTART_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND as KEY_ESCAPE_COMMAND2,
  SELECTION_CHANGE_COMMAND as SELECTION_CHANGE_COMMAND2
} from "lexical";
import { Suspense, useCallback as useCallback10, useEffect as useEffect19, useMemo as useMemo10, useRef as useRef8, useState as useState13 } from "react";
import { jsx as jsx31, jsxs as jsxs12 } from "react/jsx-runtime";
function DisableCaptionOnBlur({ setShowCaption }) {
  const [editor] = useLexicalComposerContext17();
  useEffect19(
    () => editor.registerCommand(
      BLUR_COMMAND,
      () => {
        if ($isCaptionEditorEmpty()) {
          setShowCaption(false);
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR6
    )
  );
  return null;
}
function useSuspenseImage(src) {
  let cached = imageCache.get(src);
  if (cached && "error" in cached && typeof cached.error === "boolean") {
    return cached;
  } else if (!cached) {
    cached = new Promise((resolve) => {
      const img2 = new Image();
      img2.src = src;
      img2.onload = () => resolve({
        error: false,
        height: img2.naturalHeight,
        width: img2.naturalWidth
      });
      img2.onerror = () => resolve({ error: true });
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
  useEffect19(() => {
    if (status.error) {
      onError();
    }
  }, [status.error, onError]);
  if (status.error) {
    return /* @__PURE__ */ jsx31(BrokenImage, {});
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
  return /* @__PURE__ */ jsx31(
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
  return /* @__PURE__ */ jsx31(
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
  const imageRef = useRef8(null);
  const buttonRef = useRef8(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection2(nodeKey);
  const [isResizing, setIsResizing] = useState13(false);
  const [editor] = useLexicalComposerContext17();
  const activeEditorRef = useRef8(null);
  const [isLoadError, setIsLoadError] = useState13(false);
  const isEditable = useLexicalEditable2();
  const isInNodeSelection = useMemo10(
    () => isSelected && editor.getEditorState().read(() => {
      const selection = $getSelection5();
      return $isNodeSelection2(selection) && selection.has(nodeKey);
    }),
    [editor, isSelected, nodeKey]
  );
  const $onEnter = useCallback10(
    (event) => {
      const latestSelection = $getSelection5();
      const buttonElem = buttonRef.current;
      if ($isNodeSelection2(latestSelection) && latestSelection.has(nodeKey) && latestSelection.getNodes().length === 1) {
        if (showCaption) {
          $setSelection3(null);
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
  const $onEscape = useCallback10(
    (event) => {
      if (activeEditorRef.current === caption || buttonRef.current === event.target) {
        $setSelection3(null);
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
  const onClick = useCallback10(
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
  const onRightClick = useCallback10(
    (event) => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection5();
        const domElement = event.target;
        if (domElement.tagName === "IMG" && $isRangeSelection3(latestSelection) && latestSelection.getNodes().length === 1) {
          editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
        }
      });
    },
    [editor]
  );
  useEffect19(() => {
    return mergeRegister5(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND2,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW3
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
        COMMAND_PRIORITY_LOW3
      )
    );
  }, [editor]);
  useEffect19(() => {
    let rootCleanup = noop;
    return mergeRegister5(
      editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW3),
      editor.registerCommand(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW3),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW3),
      editor.registerCommand(KEY_ESCAPE_COMMAND2, $onEscape, COMMAND_PRIORITY_LOW3),
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
            if (!$getSelection5()) {
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
  return /* @__PURE__ */ jsxs12(Suspense, { fallback: null, children: [
    /* @__PURE__ */ jsx31("div", { draggable, children: isLoadError ? /* @__PURE__ */ jsx31(BrokenImage, {}) : /* @__PURE__ */ jsx31(
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
    showCaption && /* @__PURE__ */ jsx31("div", { className: "image-caption-container", children: /* @__PURE__ */ jsxs12(LexicalNestedComposer, { initialEditor: caption, children: [
      /* @__PURE__ */ jsx31(DisableCaptionOnBlur, { setShowCaption }),
      /* @__PURE__ */ jsx31(NewMentionsPlugin, {}),
      /* @__PURE__ */ jsx31(LinkPlugin, {}),
      /* @__PURE__ */ jsx31(EmojisPlugin, {}),
      /* @__PURE__ */ jsx31(HashtagPlugin, {}),
      /* @__PURE__ */ jsx31(
        RichTextPlugin,
        {
          contentEditable: /* @__PURE__ */ jsx31(
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
    resizable && isInNodeSelection && isFocused && /* @__PURE__ */ jsx31(
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
    RIGHT_CLICK_IMAGE_COMMAND = createCommand7("RIGHT_CLICK_IMAGE_COMMAND");
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
  $setSelection as $setSelection4,
  createEditor,
  DecoratorNode as DecoratorNode3,
  LineBreakNode,
  ParagraphNode,
  RootNode,
  SKIP_DOM_SELECTION_TAG,
  TextNode as TextNode6
} from "lexical";
import * as React3 from "react";
import { jsx as jsx32 } from "react/jsx-runtime";
function isGoogleDocCheckboxImg(img2) {
  return img2.parentElement != null && img2.parentElement.tagName === "LI" && img2.previousSibling === null && img2.getAttribute("aria-roledescription") === "checkbox";
}
function $convertImageElement(domNode) {
  const img2 = domNode;
  const src = img2.getAttribute("src");
  if (!src || src.startsWith("file:///") || isGoogleDocCheckboxImg(img2)) {
    return null;
  }
  const { alt: altText, width, height } = img2;
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
                          $setSelection4(null);
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
        const theme4 = config.theme;
        const className = theme4.image;
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
        return /* @__PURE__ */ jsx32(
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
import { useLexicalComposerContext as useLexicalComposerContext39 } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary as LexicalErrorBoundary2 } from "@lexical/react/LexicalErrorBoundary";
import { LexicalNestedComposer as LexicalNestedComposer2 } from "@lexical/react/LexicalNestedComposer";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { calculateZoomLevel as calculateZoomLevel5 } from "@lexical/utils";
import { $getNodeByKey as $getNodeByKey7 } from "lexical";
import { useEffect as useEffect42, useLayoutEffect, useRef as useRef19, useState as useState30 } from "react";
import { createPortal as createPortal12 } from "react-dom";
import { jsx as jsx53, jsxs as jsxs28 } from "react/jsx-runtime";
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
  const [editor] = useLexicalComposerContext39();
  const stickyContainerRef = useRef19(null);
  const [portalContainer, setPortalContainer] = useState30(null);
  const positioningRef = useRef19({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    rootElementRect: null,
    x: 0,
    y: 0
  });
  useEffect42(() => {
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
  useEffect42(() => {
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
  useEffect42(() => {
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
  useEffect42(() => {
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
    const zoom = calculateZoomLevel5(stickyContainer);
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
        const node = $getNodeByKey7(nodeKey);
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
      const node = $getNodeByKey7(nodeKey);
      if ($isStickyNode(node)) {
        node.remove();
      }
    });
  };
  const handleColorChange = () => {
    editor.update(() => {
      const node = $getNodeByKey7(nodeKey);
      if ($isStickyNode(node)) {
        node.toggleColor();
      }
    });
  };
  useSharedHistoryContext();
  const stickyContent = /* @__PURE__ */ jsx53("div", { ref: stickyContainerRef, className: "sticky-note-container", children: /* @__PURE__ */ jsxs28(
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
          const zoom = calculateZoomLevel5(stickContainer);
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
        /* @__PURE__ */ jsx53("button", { type: "button", onClick: handleDelete, className: "delete", "aria-label": "Delete sticky note", title: "Delete", children: "X" }),
        /* @__PURE__ */ jsx53(
          "button",
          {
            type: "button",
            onClick: handleColorChange,
            className: "color",
            "aria-label": "Change sticky note color",
            title: "Color",
            children: /* @__PURE__ */ jsx53("i", { className: "bucket" })
          }
        ),
        /* @__PURE__ */ jsx53(LexicalNestedComposer2, { initialEditor: caption, initialTheme: StickyEditorTheme_default, children: /* @__PURE__ */ jsx53(
          PlainTextPlugin,
          {
            contentEditable: /* @__PURE__ */ jsx53(
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
  return createPortal12(stickyContent, portalContainer);
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
import { $setSelection as $setSelection8, createEditor as createEditor2, DecoratorNode as DecoratorNode5 } from "lexical";
import * as React5 from "react";
import { jsx as jsx54 } from "react/jsx-runtime";
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
    StickyComponent2 = React5.lazy(() => Promise.resolve().then(() => (init_StickyComponent(), StickyComponent_exports)));
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
        $setSelection8(null);
      }
      toggleColor() {
        const writable = this.getWritable();
        writable.__color = writable.__color === "pink" ? "yellow" : "pink";
      }
      decorate(_editor, _config) {
        return /* @__PURE__ */ jsx54(
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

// src/core/Editor.tsx
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { CharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { useLexicalComposerContext as useLexicalComposerContext40 } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary as LexicalErrorBoundary3 } from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin as HashtagPlugin2 } from "@lexical/react/LexicalHashtagPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin as RichTextPlugin2 } from "@lexical/react/LexicalRichTextPlugin";
import { SelectionAlwaysOnDisplay } from "@lexical/react/LexicalSelectionAlwaysOnDisplay";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { useLexicalEditable as useLexicalEditable6 } from "@lexical/react/useLexicalEditable";
import { CAN_USE_DOM } from "@lexical/utils";
import { useEffect as useEffect45, useState as useState33 } from "react";

// src/context/SettingsContext.tsx
import { createContext, useCallback, useContext, useMemo, useState } from "react";

// src/core/appSettings.ts
var DEFAULT_SETTINGS = {
  autoFocus: true,
  disableBeforeInput: false,
  emptyEditor: false,
  hasLinkAttributes: false,
  hasNestedTables: false,
  isAutocomplete: true,
  isCharLimit: false,
  isCharLimitUtf8: false,
  isCodeHighlighted: true,
  isCodeShiki: false,
  isMaxLength: false,
  listStrictIndent: false,
  measureTypingPerf: true,
  selectionAlwaysOnDisplay: false,
  shouldAllowHighlightingWithBrackets: false,
  shouldPreserveNewLinesInMarkdown: false,
  shouldUseLexicalContextMenu: false,
  showNestedEditorTreeView: false,
  showTableOfContents: false,
  showTreeView: true,
  showToolbar: true,
  tableCellBackgroundColor: true,
  tableCellMerge: true,
  tableHorizontalScroll: true
};
var INITIAL_SETTINGS = {
  ...DEFAULT_SETTINGS
};

// src/context/SettingsContext.tsx
import { jsx } from "react/jsx-runtime";
var Context = createContext({
  setOption: (_name, _value) => {
    return;
  },
  settings: INITIAL_SETTINGS
});
var SettingsContext = ({
  children,
  initialSettings
}) => {
  const [settings, setSettings] = useState(() => ({
    ...INITIAL_SETTINGS,
    ...initialSettings
  }));
  const setOption = useCallback((setting, value) => {
    setSettings((options) => ({
      ...options,
      [setting]: value
    }));
    setURLParam(setting, value);
  }, []);
  const contextValue = useMemo(() => {
    return { setOption, settings };
  }, [setOption, settings]);
  return /* @__PURE__ */ jsx(Context.Provider, { value: contextValue, children });
};
var useSettings = () => {
  return useContext(Context);
};
function setURLParam(param, value) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  if (value !== DEFAULT_SETTINGS[param]) {
    params.set(param, String(value));
  } else {
    params.delete(param);
  }
  url.search = params.toString();
  window.history.pushState(null, "", url.toString());
}

// src/core/Editor.tsx
init_SharedHistoryContext();

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
import { useCallback as useCallback3, useEffect as useEffect2 } from "react";

// src/context/ToolbarContext.tsx
import { createContext as createContext3, useCallback as useCallback2, useContext as useContext3, useEffect, useMemo as useMemo3, useState as useState2 } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var MIN_ALLOWED_FONT_SIZE = 8;
var MAX_ALLOWED_FONT_SIZE = 72;
var DEFAULT_FONT_SIZE = 15;
var blockTypeToBlockName = {
  bullet: "Bulleted List",
  check: "Check List",
  code: "Code Block",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  number: "Numbered List",
  paragraph: "Normal",
  quote: "Quote"
};
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
var Context3 = createContext3(void 0);
var ToolbarContext = ({ children }) => {
  const [toolbarState, setToolbarState] = useState2(INITIAL_TOOLBAR_STATE);
  const selectionFontSize = toolbarState.fontSize;
  const updateToolbarState = useCallback2((key, value) => {
    setToolbarState((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);
  useEffect(() => {
    updateToolbarState("fontSizeInputValue", selectionFontSize.slice(0, -2));
  }, [selectionFontSize, updateToolbarState]);
  const contextValue = useMemo3(() => {
    return {
      toolbarState,
      updateToolbarState
    };
  }, [toolbarState, updateToolbarState]);
  return /* @__PURE__ */ jsx3(Context3.Provider, { value: contextValue, children });
};
var useToolbarState = () => {
  const context = useContext3(Context3);
  if (context === void 0) {
    throw new Error("useToolbarState must be used within a ToolbarProvider");
  }
  return context;
};

// src/nodes/AutocompleteNode.tsx
import { TextNode } from "lexical";
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

// src/utils/swipe.ts
var elements = /* @__PURE__ */ new WeakMap();
function readTouch(e) {
  const touch = e.changedTouches[0];
  if (touch === void 0) {
    return null;
  }
  return [touch.clientX, touch.clientY];
}
function addListener(element, cb) {
  let elementValues = elements.get(element);
  if (elementValues === void 0) {
    const listeners = /* @__PURE__ */ new Set();
    const handleTouchstart = (e) => {
      if (elementValues !== void 0) {
        elementValues.start = readTouch(e);
      }
    };
    const handleTouchend = (e) => {
      if (elementValues === void 0) {
        return;
      }
      const start = elementValues.start;
      if (start === null) {
        return;
      }
      const end = readTouch(e);
      for (const listener of listeners) {
        if (end !== null) {
          listener([end[0] - start[0], end[1] - start[1]], e);
        }
      }
    };
    element.addEventListener("touchstart", handleTouchstart);
    element.addEventListener("touchend", handleTouchend);
    elementValues = {
      handleTouchend,
      handleTouchstart,
      listeners,
      start: null
    };
    elements.set(element, elementValues);
  }
  elementValues.listeners.add(cb);
  return () => deleteListener(element, cb);
}
function deleteListener(element, cb) {
  const elementValues = elements.get(element);
  if (elementValues === void 0) {
    return;
  }
  const listeners = elementValues.listeners;
  listeners.delete(cb);
  if (listeners.size === 0) {
    elements.delete(element);
    element.removeEventListener("touchstart", elementValues.handleTouchstart);
    element.removeEventListener("touchend", elementValues.handleTouchend);
  }
}
function addSwipeRightListener(element, cb) {
  return addListener(element, (force, e) => {
    const [x, y2] = force;
    if (x > 0 && x > Math.abs(y2)) {
      cb(x, e);
    }
  });
}

// src/plugins/AutocompletePlugin/index.tsx
var HISTORY_MERGE = { tag: HISTORY_MERGE_TAG };
var uuid = Math.random().toString(36).replace(/[^a-z]+/g, "").substring(0, 5);
function $search(selection) {
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return [false, ""];
  }
  const node = selection.getNodes()[0];
  const anchor = selection.anchor;
  if (!$isTextNode(node) || !node.isSimpleText() || !$isAtNodeEnd(anchor)) {
    return [false, ""];
  }
  const word = [];
  const text = node.getTextContent();
  let i = node.getTextContentSize();
  while (i > 0) {
    i--;
    const c2 = text[i];
    if (c2 === " ") {
      break;
    }
    word.push(c2);
  }
  if (word.length === 0) {
    return [false, ""];
  }
  return [true, word.reverse().join("")];
}
function useQuery() {
  return useCallback3((searchText) => {
    const server = new AutocompleteServer();
    console.time("query");
    const response = server.query(searchText);
    console.timeEnd("query");
    return response;
  }, []);
}
function formatSuggestionText(suggestion) {
  const userAgentData = window.navigator.userAgentData;
  const isMobile = userAgentData !== void 0 ? userAgentData.mobile : window.innerWidth <= 800 && window.innerHeight <= 600;
  return `${suggestion} ${isMobile ? "(SWIPE \u2B95)" : "(TAB)"}`;
}
function AutocompletePlugin() {
  const [editor] = useLexicalComposerContext();
  const query = useQuery();
  const { toolbarState } = useToolbarState();
  useEffect2(() => {
    let autocompleteNodeKey = null;
    let lastMatch = null;
    let lastSuggestion = null;
    let searchPromise = null;
    let prevNodeFormat = 0;
    function $clearSuggestion() {
      const autocompleteNode = autocompleteNodeKey !== null ? $getNodeByKey(autocompleteNodeKey) : null;
      if (autocompleteNode?.isAttached()) {
        autocompleteNode.remove();
        autocompleteNodeKey = null;
      }
      if (searchPromise !== null) {
        searchPromise.dismiss();
        searchPromise = null;
      }
      lastMatch = null;
      lastSuggestion = null;
      prevNodeFormat = 0;
    }
    function updateAsyncSuggestion(refSearchPromise, newSuggestion) {
      if (searchPromise !== refSearchPromise || newSuggestion === null) {
        return;
      }
      editor.update(() => {
        const selection = $getSelection();
        const [hasMatch, match] = $search(selection);
        if (!hasMatch || match !== lastMatch || !$isRangeSelection(selection)) {
          return;
        }
        const selectionCopy = selection.clone();
        const prevNode = selection.getNodes()[0];
        prevNodeFormat = prevNode.getFormat();
        const node = $createAutocompleteNode(formatSuggestionText(newSuggestion), uuid).setFormat(prevNodeFormat).setStyle(`font-size: ${toolbarState.fontSize}`);
        autocompleteNodeKey = node.getKey();
        selection.insertNodes([node]);
        $setSelection(selectionCopy);
        lastSuggestion = newSuggestion;
      }, HISTORY_MERGE);
    }
    function $handleAutocompleteNodeTransform(node) {
      const key = node.getKey();
      if (node.__uuid === uuid && key !== autocompleteNodeKey) {
        $clearSuggestion();
      }
    }
    function handleUpdate() {
      editor.update(() => {
        const selection = $getSelection();
        const [hasMatch, match] = $search(selection);
        if (!hasMatch) {
          $clearSuggestion();
          return;
        }
        if (match === lastMatch) {
          return;
        }
        $clearSuggestion();
        searchPromise = query(match);
        searchPromise.promise.then((newSuggestion) => {
          if (searchPromise !== null) {
            updateAsyncSuggestion(searchPromise, newSuggestion);
          }
        }).catch((e) => {
          if (e !== "Dismissed") {
            console.error(e);
          }
        });
        lastMatch = match;
      }, HISTORY_MERGE);
    }
    function $handleAutocompleteIntent() {
      if (lastSuggestion === null || autocompleteNodeKey === null) {
        return false;
      }
      const autocompleteNode = $getNodeByKey(autocompleteNodeKey);
      if (autocompleteNode === null) {
        return false;
      }
      const textNode = $createTextNode(lastSuggestion).setFormat(prevNodeFormat).setStyle(`font-size: ${toolbarState.fontSize}`);
      autocompleteNode.replace(textNode);
      textNode.selectNext();
      $clearSuggestion();
      return true;
    }
    function $handleKeypressCommand(e) {
      if ($handleAutocompleteIntent()) {
        e.preventDefault();
        return true;
      }
      return false;
    }
    function handleSwipeRight(_force, e) {
      editor.update(() => {
        if ($handleAutocompleteIntent()) {
          e.preventDefault();
        } else {
          $addUpdateTag(HISTORY_MERGE.tag);
        }
      });
    }
    function unmountSuggestion() {
      editor.update(() => {
        $clearSuggestion();
      }, HISTORY_MERGE);
    }
    const rootElem = editor.getRootElement();
    return mergeRegister(
      editor.registerNodeTransform(AutocompleteNode, $handleAutocompleteNodeTransform),
      editor.registerUpdateListener(handleUpdate),
      editor.registerCommand(KEY_TAB_COMMAND, $handleKeypressCommand, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND, $handleKeypressCommand, COMMAND_PRIORITY_LOW),
      ...rootElem !== null ? [addSwipeRightListener(rootElem, handleSwipeRight)] : [],
      unmountSuggestion
    );
  }, [editor, query, toolbarState.fontSize]);
  return null;
}
var AutocompleteServer = class {
  DATABASE = DICTIONARY;
  LATENCY = 200;
  query = (searchText) => {
    let isDismissed = false;
    const dismiss = () => {
      isDismissed = true;
    };
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (isDismissed) {
          return reject("Dismissed");
        }
        const searchTextLength = searchText.length;
        if (searchText === "" || searchTextLength < 4) {
          return resolve(null);
        }
        const char0 = searchText.charCodeAt(0);
        const isCapitalized = char0 >= 65 && char0 <= 90;
        const caseInsensitiveSearchText = isCapitalized ? String.fromCharCode(char0 + 32) + searchText.substring(1) : searchText;
        const match = this.DATABASE.find(
          (dictionaryWord) => dictionaryWord.startsWith(caseInsensitiveSearchText) ?? null
        );
        if (match === void 0) {
          return resolve(null);
        }
        const matchCapitalized = isCapitalized ? String.fromCharCode(match.charCodeAt(0) - 32) + match.substring(1) : match;
        const autocompleteChunk = matchCapitalized.substring(searchTextLength);
        if (autocompleteChunk === "") {
          return resolve(null);
        }
        return resolve(autocompleteChunk);
      }, this.LATENCY);
    });
    return {
      dismiss,
      promise
    };
  };
};
var DICTIONARY = [
  "information",
  "available",
  "copyright",
  "university",
  "management",
  "international",
  "development",
  "education",
  "community",
  "technology",
  "following",
  "resources",
  "including",
  "directory",
  "government",
  "department",
  "description",
  "insurance",
  "different",
  "categories",
  "conditions",
  "accessories",
  "september",
  "questions",
  "application",
  "financial",
  "equipment",
  "performance",
  "experience",
  "important",
  "activities",
  "additional",
  "something",
  "professional",
  "committee",
  "washington",
  "california",
  "reference",
  "companies",
  "computers",
  "president",
  "australia",
  "discussion",
  "entertainment",
  "agreement",
  "marketing",
  "association",
  "collection",
  "solutions",
  "electronics",
  "technical",
  "microsoft",
  "conference",
  "environment",
  "statement",
  "downloads",
  "applications",
  "requirements",
  "individual",
  "subscribe",
  "everything",
  "production",
  "commercial",
  "advertising",
  "treatment",
  "newsletter",
  "knowledge",
  "currently",
  "construction",
  "registered",
  "protection",
  "engineering",
  "published",
  "corporate",
  "customers",
  "materials",
  "countries",
  "standards",
  "political",
  "advertise",
  "environmental",
  "availability",
  "employment",
  "commission",
  "administration",
  "institute",
  "sponsored",
  "electronic",
  "condition",
  "effective",
  "organization",
  "selection",
  "corporation",
  "executive",
  "necessary",
  "according",
  "particular",
  "facilities",
  "opportunities",
  "appropriate",
  "statistics",
  "investment",
  "christmas",
  "registration",
  "furniture",
  "wednesday",
  "structure",
  "distribution",
  "industrial",
  "potential",
  "responsible",
  "communications",
  "associated",
  "foundation",
  "documents",
  "communication",
  "independent",
  "operating",
  "developed",
  "telephone",
  "population",
  "navigation",
  "operations",
  "therefore",
  "christian",
  "understand",
  "publications",
  "worldwide",
  "connection",
  "publisher",
  "introduction",
  "properties",
  "accommodation",
  "excellent",
  "opportunity",
  "assessment",
  "especially",
  "interface",
  "operation",
  "restaurants",
  "beautiful",
  "locations",
  "significant",
  "technologies",
  "manufacturer",
  "providing",
  "authority",
  "considered",
  "programme",
  "enterprise",
  "educational",
  "employees",
  "alternative",
  "processing",
  "responsibility",
  "resolution",
  "publication",
  "relations",
  "photography",
  "components",
  "assistance",
  "completed",
  "organizations",
  "otherwise",
  "transportation",
  "disclaimer",
  "membership",
  "recommended",
  "background",
  "character",
  "maintenance",
  "functions",
  "trademarks",
  "phentermine",
  "submitted",
  "television",
  "interested",
  "throughout",
  "established",
  "programming",
  "regarding",
  "instructions",
  "increased",
  "understanding",
  "beginning",
  "associates",
  "instruments",
  "businesses",
  "specified",
  "restaurant",
  "procedures",
  "relationship",
  "traditional",
  "sometimes",
  "themselves",
  "transport",
  "interesting",
  "evaluation",
  "implementation",
  "galleries",
  "references",
  "presented",
  "literature",
  "respective",
  "definition",
  "secretary",
  "networking",
  "australian",
  "magazines",
  "francisco",
  "individuals",
  "guidelines",
  "installation",
  "described",
  "attention",
  "difference",
  "regulations",
  "certificate",
  "directions",
  "documentation",
  "automotive",
  "successful",
  "communities",
  "situation",
  "publishing",
  "emergency",
  "developing",
  "determine",
  "temperature",
  "announcements",
  "historical",
  "ringtones",
  "difficult",
  "scientific",
  "satellite",
  "particularly",
  "functional",
  "monitoring",
  "architecture",
  "recommend",
  "dictionary",
  "accounting",
  "manufacturing",
  "professor",
  "generally",
  "continued",
  "techniques",
  "permission",
  "generation",
  "component",
  "guarantee",
  "processes",
  "interests",
  "paperback",
  "classifieds",
  "supported",
  "competition",
  "providers",
  "characters",
  "thousands",
  "apartments",
  "generated",
  "administrative",
  "practices",
  "reporting",
  "essential",
  "affiliate",
  "immediately",
  "designated",
  "integrated",
  "configuration",
  "comprehensive",
  "universal",
  "presentation",
  "languages",
  "compliance",
  "improvement",
  "pennsylvania",
  "challenge",
  "acceptance",
  "strategies",
  "affiliates",
  "multimedia",
  "certified",
  "computing",
  "interactive",
  "procedure",
  "leadership",
  "religious",
  "breakfast",
  "developer",
  "approximately",
  "recommendations",
  "comparison",
  "automatically",
  "minnesota",
  "adventure",
  "institutions",
  "assistant",
  "advertisement",
  "headlines",
  "yesterday",
  "determined",
  "wholesale",
  "extension",
  "statements",
  "completely",
  "electrical",
  "applicable",
  "manufacturers",
  "classical",
  "dedicated",
  "direction",
  "basketball",
  "wisconsin",
  "personnel",
  "identified",
  "professionals",
  "advantage",
  "newsletters",
  "estimated",
  "anonymous",
  "miscellaneous",
  "integration",
  "interview",
  "framework",
  "installed",
  "massachusetts",
  "associate",
  "frequently",
  "discussions",
  "laboratory",
  "destination",
  "intelligence",
  "specifications",
  "tripadvisor",
  "residential",
  "decisions",
  "industries",
  "partnership",
  "editorial",
  "expression",
  "provisions",
  "principles",
  "suggestions",
  "replacement",
  "strategic",
  "economics",
  "compatible",
  "apartment",
  "netherlands",
  "consulting",
  "recreation",
  "participants",
  "favorites",
  "translation",
  "estimates",
  "protected",
  "philadelphia",
  "officials",
  "contained",
  "legislation",
  "parameters",
  "relationships",
  "tennessee",
  "representative",
  "frequency",
  "introduced",
  "departments",
  "residents",
  "displayed",
  "performed",
  "administrator",
  "addresses",
  "permanent",
  "agriculture",
  "constitutes",
  "portfolio",
  "practical",
  "delivered",
  "collectibles",
  "infrastructure",
  "exclusive",
  "originally",
  "utilities",
  "philosophy",
  "regulation",
  "reduction",
  "nutrition",
  "recording",
  "secondary",
  "wonderful",
  "announced",
  "prevention",
  "mentioned",
  "automatic",
  "healthcare",
  "maintained",
  "increasing",
  "connected",
  "directors",
  "participation",
  "containing",
  "combination",
  "amendment",
  "guaranteed",
  "libraries",
  "distributed",
  "singapore",
  "enterprises",
  "convention",
  "principal",
  "certification",
  "previously",
  "buildings",
  "household",
  "batteries",
  "positions",
  "subscription",
  "contemporary",
  "panasonic",
  "permalink",
  "signature",
  "provision",
  "certainly",
  "newspaper",
  "liability",
  "trademark",
  "trackback",
  "americans",
  "promotion",
  "conversion",
  "reasonable",
  "broadband",
  "influence",
  "importance",
  "webmaster",
  "prescription",
  "specifically",
  "represent",
  "conservation",
  "louisiana",
  "javascript",
  "marketplace",
  "evolution",
  "certificates",
  "objectives",
  "suggested",
  "concerned",
  "structures",
  "encyclopedia",
  "continuing",
  "interracial",
  "competitive",
  "suppliers",
  "preparation",
  "receiving",
  "accordance",
  "discussed",
  "elizabeth",
  "reservations",
  "playstation",
  "instruction",
  "annotation",
  "differences",
  "establish",
  "expressed",
  "paragraph",
  "mathematics",
  "compensation",
  "conducted",
  "percentage",
  "mississippi",
  "requested",
  "connecticut",
  "personals",
  "immediate",
  "agricultural",
  "supporting",
  "collections",
  "participate",
  "specialist",
  "experienced",
  "investigation",
  "institution",
  "searching",
  "proceedings",
  "transmission",
  "characteristics",
  "experiences",
  "extremely",
  "verzeichnis",
  "contracts",
  "concerning",
  "developers",
  "equivalent",
  "chemistry",
  "neighborhood",
  "variables",
  "continues",
  "curriculum",
  "psychology",
  "responses",
  "circumstances",
  "identification",
  "appliances",
  "elementary",
  "unlimited",
  "printable",
  "enforcement",
  "hardcover",
  "celebrity",
  "chocolate",
  "hampshire",
  "bluetooth",
  "controlled",
  "requirement",
  "authorities",
  "representatives",
  "pregnancy",
  "biography",
  "attractions",
  "transactions",
  "authorized",
  "retirement",
  "financing",
  "efficiency",
  "efficient",
  "commitment",
  "specialty",
  "interviews",
  "qualified",
  "discovery",
  "classified",
  "confidence",
  "lifestyle",
  "consistent",
  "clearance",
  "connections",
  "inventory",
  "converter",
  "organisation",
  "objective",
  "indicated",
  "securities",
  "volunteer",
  "democratic",
  "switzerland",
  "parameter",
  "processor",
  "dimensions",
  "contribute",
  "challenges",
  "recognition",
  "submission",
  "encourage",
  "regulatory",
  "inspection",
  "consumers",
  "territory",
  "transaction",
  "manchester",
  "contributions",
  "continuous",
  "resulting",
  "cambridge",
  "initiative",
  "execution",
  "disability",
  "increases",
  "contractor",
  "examination",
  "indicates",
  "committed",
  "extensive",
  "affordable",
  "candidate",
  "databases",
  "outstanding",
  "perspective",
  "messenger",
  "tournament",
  "consideration",
  "discounts",
  "catalogue",
  "publishers",
  "caribbean",
  "reservation",
  "remaining",
  "depending",
  "expansion",
  "purchased",
  "performing",
  "collected",
  "absolutely",
  "featuring",
  "implement",
  "scheduled",
  "calculator",
  "significantly",
  "temporary",
  "sufficient",
  "awareness",
  "vancouver",
  "contribution",
  "measurement",
  "constitution",
  "packaging",
  "consultation",
  "northwest",
  "classroom",
  "democracy",
  "wallpaper",
  "merchandise",
  "resistance",
  "baltimore",
  "candidates",
  "charlotte",
  "biological",
  "transition",
  "preferences",
  "instrument",
  "classification",
  "physician",
  "hollywood",
  "wikipedia",
  "spiritual",
  "photographs",
  "relatively",
  "satisfaction",
  "represents",
  "pittsburgh",
  "preferred",
  "intellectual",
  "comfortable",
  "interaction",
  "listening",
  "effectively",
  "experimental",
  "revolution",
  "consolidation",
  "landscape",
  "dependent",
  "mechanical",
  "consultants",
  "applicant",
  "cooperation",
  "acquisition",
  "implemented",
  "directories",
  "recognized",
  "notification",
  "licensing",
  "textbooks",
  "diversity",
  "cleveland",
  "investments",
  "accessibility",
  "sensitive",
  "templates",
  "completion",
  "universities",
  "technique",
  "contractors",
  "subscriptions",
  "calculate",
  "alexander",
  "broadcast",
  "converted",
  "anniversary",
  "improvements",
  "specification",
  "accessible",
  "accessory",
  "typically",
  "representation",
  "arrangements",
  "conferences",
  "uniprotkb",
  "consumption",
  "birmingham",
  "afternoon",
  "consultant",
  "controller",
  "ownership",
  "committees",
  "legislative",
  "researchers",
  "unsubscribe",
  "molecular",
  "residence",
  "attorneys",
  "operators",
  "sustainable",
  "philippines",
  "statistical",
  "innovation",
  "employers",
  "definitions",
  "elections",
  "stainless",
  "newspapers",
  "hospitals",
  "exception",
  "successfully",
  "indonesia",
  "primarily",
  "capabilities",
  "recommendation",
  "recruitment",
  "organized",
  "improving",
  "expensive",
  "organisations",
  "explained",
  "programmes",
  "expertise",
  "mechanism",
  "jewellery",
  "eventually",
  "agreements",
  "considering",
  "innovative",
  "conclusion",
  "disorders",
  "collaboration",
  "detection",
  "formation",
  "engineers",
  "proposals",
  "moderator",
  "tutorials",
  "settlement",
  "collectables",
  "fantastic",
  "governments",
  "purchasing",
  "appointed",
  "operational",
  "corresponding",
  "descriptions",
  "determination",
  "animation",
  "productions",
  "telecommunications",
  "instructor",
  "approaches",
  "highlights",
  "designers",
  "melbourne",
  "scientists",
  "blackjack",
  "argentina",
  "possibility",
  "commissioner",
  "dangerous",
  "reliability",
  "unfortunately",
  "respectively",
  "volunteers",
  "attachment",
  "appointment",
  "workshops",
  "hurricane",
  "represented",
  "mortgages",
  "responsibilities",
  "carefully",
  "productivity",
  "investors",
  "underground",
  "diagnosis",
  "principle",
  "vacations",
  "calculated",
  "appearance",
  "incorporated",
  "notebooks",
  "algorithm",
  "valentine",
  "involving",
  "investing",
  "christopher",
  "admission",
  "terrorism",
  "parliament",
  "situations",
  "allocated",
  "corrections",
  "structural",
  "municipal",
  "describes",
  "disabilities",
  "substance",
  "prohibited",
  "addressed",
  "simulation",
  "initiatives",
  "concentration",
  "interpretation",
  "bankruptcy",
  "optimization",
  "substances",
  "discovered",
  "restrictions",
  "participating",
  "exhibition",
  "composition",
  "nationwide",
  "definitely",
  "existence",
  "commentary",
  "limousines",
  "developments",
  "immigration",
  "destinations",
  "necessarily",
  "attribute",
  "apparently",
  "surrounding",
  "mountains",
  "popularity",
  "postposted",
  "coordinator",
  "obviously",
  "fundamental",
  "substantial",
  "progressive",
  "championship",
  "sacramento",
  "impossible",
  "depression",
  "testimonials",
  "memorabilia",
  "cartridge",
  "explanation",
  "cincinnati",
  "subsection",
  "electricity",
  "permitted",
  "workplace",
  "confirmed",
  "wallpapers",
  "infection",
  "eligibility",
  "involvement",
  "placement",
  "observations",
  "vbulletin",
  "subsequent",
  "motorcycle",
  "disclosure",
  "establishment",
  "presentations",
  "undergraduate",
  "occupation",
  "donations",
  "associations",
  "citysearch",
  "radiation",
  "seriously",
  "elsewhere",
  "pollution",
  "conservative",
  "guestbook",
  "effectiveness",
  "demonstrate",
  "atmosphere",
  "experiment",
  "purchases",
  "federation",
  "assignment",
  "chemicals",
  "everybody",
  "nashville",
  "counseling",
  "acceptable",
  "satisfied",
  "measurements",
  "milwaukee",
  "medication",
  "warehouse",
  "shareware",
  "violation",
  "configure",
  "stability",
  "southwest",
  "institutional",
  "expectations",
  "independence",
  "metabolism",
  "personally",
  "excellence",
  "somewhere",
  "attributes",
  "recognize",
  "screening",
  "thumbnail",
  "forgotten",
  "intelligent",
  "edinburgh",
  "obligation",
  "regardless",
  "restricted",
  "republican",
  "merchants",
  "attendance",
  "arguments",
  "amsterdam",
  "adventures",
  "announcement",
  "appreciate",
  "regularly",
  "mechanisms",
  "customize",
  "tradition",
  "indicators",
  "emissions",
  "physicians",
  "complaint",
  "experiments",
  "afghanistan",
  "scholarship",
  "governance",
  "supplements",
  "camcorder",
  "implementing",
  "ourselves",
  "conversation",
  "capability",
  "producing",
  "precision",
  "contributed",
  "reproduction",
  "ingredients",
  "franchise",
  "complaints",
  "promotions",
  "rehabilitation",
  "maintaining",
  "environments",
  "reception",
  "correctly",
  "consequences",
  "geography",
  "appearing",
  "integrity",
  "discrimination",
  "processed",
  "implications",
  "functionality",
  "intermediate",
  "emotional",
  "platforms",
  "overnight",
  "geographic",
  "preliminary",
  "districts",
  "introduce",
  "promotional",
  "chevrolet",
  "specialists",
  "generator",
  "suspension",
  "correction",
  "authentication",
  "communicate",
  "supplement",
  "showtimes",
  "promoting",
  "machinery",
  "bandwidth",
  "probability",
  "dimension",
  "schedules",
  "admissions",
  "quarterly",
  "illustrated",
  "continental",
  "alternate",
  "achievement",
  "limitations",
  "automated",
  "passenger",
  "convenient",
  "orientation",
  "childhood",
  "flexibility",
  "jurisdiction",
  "displaying",
  "encouraged",
  "cartridges",
  "declaration",
  "automation",
  "advantages",
  "preparing",
  "recipient",
  "extensions",
  "athletics",
  "southeast",
  "alternatives",
  "determining",
  "personalized",
  "conditioning",
  "partnerships",
  "destruction",
  "increasingly",
  "migration",
  "basically",
  "conventional",
  "applicants",
  "occupational",
  "adjustment",
  "treatments",
  "camcorders",
  "difficulty",
  "collective",
  "coalition",
  "enrollment",
  "producers",
  "collector",
  "interfaces",
  "advertisers",
  "representing",
  "observation",
  "restoration",
  "convenience",
  "returning",
  "opposition",
  "container",
  "defendant",
  "confirmation",
  "supervisor",
  "peripherals",
  "bestsellers",
  "departure",
  "minneapolis",
  "interactions",
  "intervention",
  "attraction",
  "modification",
  "customized",
  "understood",
  "assurance",
  "happening",
  "amendments",
  "metropolitan",
  "compilation",
  "verification",
  "attractive",
  "recordings",
  "jefferson",
  "gardening",
  "obligations",
  "orchestra",
  "polyphonic",
  "outsourcing",
  "adjustable",
  "allocation",
  "discipline",
  "demonstrated",
  "identifying",
  "alphabetical",
  "dispatched",
  "installing",
  "voluntary",
  "photographer",
  "messaging",
  "constructed",
  "additions",
  "requiring",
  "engagement",
  "refinance",
  "calendars",
  "arrangement",
  "conclusions",
  "bibliography",
  "compatibility",
  "furthermore",
  "cooperative",
  "measuring",
  "jacksonville",
  "headquarters",
  "transfers",
  "transformation",
  "attachments",
  "administrators",
  "personality",
  "facilitate",
  "subscriber",
  "priorities",
  "bookstore",
  "parenting",
  "incredible",
  "commonwealth",
  "pharmaceutical",
  "manhattan",
  "workforce",
  "organizational",
  "portuguese",
  "everywhere",
  "discharge",
  "halloween",
  "hazardous",
  "methodology",
  "housewares",
  "reputation",
  "resistant",
  "democrats",
  "recycling",
  "qualifications",
  "slideshow",
  "variation",
  "transferred",
  "photograph",
  "distributor",
  "underlying",
  "wrestling",
  "photoshop",
  "gathering",
  "projection",
  "mathematical",
  "specialized",
  "diagnostic",
  "indianapolis",
  "corporations",
  "criticism",
  "automobile",
  "confidential",
  "statutory",
  "accommodations",
  "northeast",
  "downloaded",
  "paintings",
  "injection",
  "yorkshire",
  "populations",
  "protective",
  "initially",
  "indicator",
  "eliminate",
  "sunglasses",
  "preference",
  "threshold",
  "venezuela",
  "exploration",
  "sequences",
  "astronomy",
  "translate",
  "announces",
  "compression",
  "establishing",
  "constitutional",
  "perfectly",
  "instantly",
  "litigation",
  "submissions",
  "broadcasting",
  "horizontal",
  "terrorist",
  "informational",
  "ecommerce",
  "suffering",
  "prospective",
  "ultimately",
  "artificial",
  "spectacular",
  "coordination",
  "connector",
  "affiliated",
  "activation",
  "naturally",
  "subscribers",
  "mitsubishi",
  "underwear",
  "potentially",
  "constraints",
  "inclusive",
  "dimensional",
  "considerable",
  "selecting",
  "processors",
  "pantyhose",
  "difficulties",
  "complexity",
  "constantly",
  "barcelona",
  "presidential",
  "documentary",
  "territories",
  "palestinian",
  "legislature",
  "hospitality",
  "procurement",
  "theoretical",
  "exercises",
  "surveillance",
  "protocols",
  "highlight",
  "substitute",
  "inclusion",
  "hopefully",
  "brilliant",
  "evaluated",
  "assignments",
  "termination",
  "households",
  "authentic",
  "montgomery",
  "architectural",
  "louisville",
  "macintosh",
  "movements",
  "amenities",
  "virtually",
  "authorization",
  "projector",
  "comparative",
  "psychological",
  "surprised",
  "genealogy",
  "expenditure",
  "liverpool",
  "connectivity",
  "algorithms",
  "similarly",
  "collaborative",
  "excluding",
  "commander",
  "suggestion",
  "spotlight",
  "investigate",
  "connecting",
  "logistics",
  "proportion",
  "significance",
  "symposium",
  "essentials",
  "protecting",
  "transmitted",
  "screenshots",
  "intensive",
  "switching",
  "correspondence",
  "supervision",
  "expenditures",
  "separation",
  "testimony",
  "celebrities",
  "mandatory",
  "boundaries",
  "syndication",
  "celebration",
  "filtering",
  "luxembourg",
  "offensive",
  "deployment",
  "colleagues",
  "separated",
  "directive",
  "governing",
  "retailers",
  "occasionally",
  "attending",
  "recruiting",
  "instructional",
  "traveling",
  "permissions",
  "biotechnology",
  "prescribed",
  "catherine",
  "reproduced",
  "calculation",
  "consolidated",
  "occasions",
  "equations",
  "exceptional",
  "respondents",
  "considerations",
  "queensland",
  "musicians",
  "composite",
  "unavailable",
  "essentially",
  "designing",
  "assessments",
  "brunswick",
  "sensitivity",
  "preservation",
  "streaming",
  "intensity",
  "technological",
  "syndicate",
  "antivirus",
  "addressing",
  "discounted",
  "bangladesh",
  "constitute",
  "concluded",
  "desperate",
  "demonstration",
  "governmental",
  "manufactured",
  "graduation",
  "variations",
  "addiction",
  "springfield",
  "synthesis",
  "undefined",
  "unemployment",
  "enhancement",
  "newcastle",
  "performances",
  "societies",
  "brazilian",
  "identical",
  "petroleum",
  "norwegian",
  "retention",
  "exchanges",
  "soundtrack",
  "wondering",
  "profession",
  "separately",
  "physiology",
  "collecting",
  "participant",
  "scholarships",
  "recreational",
  "dominican",
  "friendship",
  "expanding",
  "provincial",
  "investigations",
  "medications",
  "rochester",
  "advertiser",
  "encryption",
  "downloadable",
  "sophisticated",
  "possession",
  "laboratories",
  "vegetables",
  "thumbnails",
  "stockings",
  "respondent",
  "destroyed",
  "manufacture",
  "wordpress",
  "vulnerability",
  "accountability",
  "celebrate",
  "accredited",
  "appliance",
  "compressed",
  "scheduling",
  "perspectives",
  "mortality",
  "christians",
  "therapeutic",
  "impressive",
  "accordingly",
  "architect",
  "challenging",
  "microwave",
  "accidents",
  "relocation",
  "contributors",
  "violations",
  "temperatures",
  "competitions",
  "discretion",
  "cosmetics",
  "repository",
  "concentrations",
  "christianity",
  "negotiations",
  "realistic",
  "generating",
  "christina",
  "congressional",
  "photographic",
  "modifications",
  "millennium",
  "achieving",
  "fisheries",
  "exceptions",
  "reactions",
  "macromedia",
  "companion",
  "divisions",
  "additionally",
  "fellowship",
  "victorian",
  "copyrights",
  "lithuania",
  "mastercard",
  "chronicles",
  "obtaining",
  "distribute",
  "decorative",
  "enlargement",
  "campaigns",
  "conjunction",
  "instances",
  "indigenous",
  "validation",
  "corruption",
  "incentives",
  "cholesterol",
  "differential",
  "scientist",
  "starsmerchant",
  "arthritis",
  "nevertheless",
  "practitioners",
  "transcript",
  "inflation",
  "compounds",
  "contracting",
  "structured",
  "reasonably",
  "graduates",
  "recommends",
  "controlling",
  "distributors",
  "arlington",
  "particles",
  "extraordinary",
  "indicating",
  "coordinate",
  "exclusively",
  "limitation",
  "widescreen",
  "illustration",
  "construct",
  "inquiries",
  "inspiration",
  "affecting",
  "downloading",
  "aggregate",
  "forecasts",
  "complicated",
  "shopzilla",
  "decorating",
  "expressions",
  "shakespeare",
  "connectors",
  "conflicts",
  "travelers",
  "offerings",
  "incorrect",
  "furnishings",
  "guatemala",
  "perception",
  "renaissance",
  "pathology",
  "ordinance",
  "photographers",
  "infections",
  "configured",
  "festivals",
  "possibilities",
  "contributing",
  "analytical",
  "circulation",
  "assumption",
  "jerusalem",
  "transexuales",
  "invention",
  "technician",
  "executives",
  "enquiries",
  "cognitive",
  "exploring",
  "registrar",
  "supporters",
  "withdrawal",
  "predicted",
  "saskatchewan",
  "cancellation",
  "ministers",
  "veterinary",
  "prostores",
  "relevance",
  "incentive",
  "butterfly",
  "mechanics",
  "numerical",
  "reflection",
  "accompanied",
  "invitation",
  "princeton",
  "spirituality",
  "meanwhile",
  "proprietary",
  "childrens",
  "thumbzilla",
  "porcelain",
  "pichunter",
  "translated",
  "columnists",
  "consensus",
  "delivering",
  "journalism",
  "intention",
  "undertaken",
  "statewide",
  "semiconductor",
  "illustrations",
  "happiness",
  "substantially",
  "identifier",
  "calculations",
  "conducting",
  "accomplished",
  "calculators",
  "impression",
  "correlation",
  "fragrance",
  "neighbors",
  "transparent",
  "charleston",
  "champions",
  "selections",
  "projectors",
  "inappropriate",
  "comparing",
  "vocational",
  "pharmacies",
  "introducing",
  "appreciated",
  "albuquerque",
  "distinguished",
  "projected",
  "assumptions",
  "shareholders",
  "developmental",
  "regulated",
  "anticipated",
  "completing",
  "comparable",
  "confusion",
  "copyrighted",
  "warranties",
  "documented",
  "paperbacks",
  "keyboards",
  "vulnerable",
  "reflected",
  "respiratory",
  "notifications",
  "transexual",
  "mainstream",
  "evaluating",
  "subcommittee",
  "maternity",
  "journalists",
  "foundations",
  "volleyball",
  "liabilities",
  "decreased",
  "tolerance",
  "creativity",
  "describing",
  "lightning",
  "quotations",
  "inspector",
  "bookmarks",
  "behavioral",
  "riverside",
  "bathrooms",
  "abilities",
  "initiated",
  "nonprofit",
  "lancaster",
  "suspended",
  "containers",
  "attitudes",
  "simultaneously",
  "integrate",
  "sociology",
  "screenshot",
  "exhibitions",
  "confident",
  "retrieved",
  "officially",
  "consortium",
  "recipients",
  "delicious",
  "traditions",
  "periodically",
  "hungarian",
  "referring",
  "transform",
  "educators",
  "vegetable",
  "humanities",
  "independently",
  "alignment",
  "henderson",
  "britannica",
  "competitors",
  "visibility",
  "consciousness",
  "encounter",
  "resolutions",
  "accessing",
  "attempted",
  "witnesses",
  "administered",
  "strengthen",
  "frederick",
  "aggressive",
  "advertisements",
  "sublimedirectory",
  "disturbed",
  "determines",
  "sculpture",
  "motivation",
  "pharmacology",
  "passengers",
  "quantities",
  "petersburg",
  "consistently",
  "powerpoint",
  "obituaries",
  "punishment",
  "appreciation",
  "subsequently",
  "providence",
  "restriction",
  "incorporate",
  "backgrounds",
  "treasurer",
  "lightweight",
  "transcription",
  "complications",
  "scripting",
  "remembered",
  "synthetic",
  "testament",
  "specifics",
  "partially",
  "wilderness",
  "generations",
  "tournaments",
  "sponsorship",
  "headphones",
  "proceeding",
  "volkswagen",
  "uncertainty",
  "breakdown",
  "reconstruction",
  "subsidiary",
  "strengths",
  "encouraging",
  "furnished",
  "terrorists",
  "comparisons",
  "beneficial",
  "distributions",
  "viewpicture",
  "threatened",
  "republicans",
  "discusses",
  "responded",
  "abstracts",
  "prediction",
  "pharmaceuticals",
  "thesaurus",
  "individually",
  "battlefield",
  "literally",
  "ecological",
  "appraisal",
  "consisting",
  "submitting",
  "citations",
  "geographical",
  "mozambique",
  "disclaimers",
  "championships",
  "sheffield",
  "finishing",
  "wellington",
  "prospects",
  "bulgarian",
  "aboriginal",
  "remarkable",
  "preventing",
  "productive",
  "boulevard",
  "compliant",
  "penalties",
  "imagination",
  "refurbished",
  "activated",
  "conferencing",
  "armstrong",
  "politicians",
  "trackbacks",
  "accommodate",
  "christine",
  "accepting",
  "precipitation",
  "isolation",
  "sustained",
  "approximate",
  "programmer",
  "greetings",
  "inherited",
  "incomplete",
  "chronicle",
  "legitimate",
  "biographies",
  "investigator",
  "plaintiff",
  "prisoners",
  "mediterranean",
  "nightlife",
  "architects",
  "entrepreneur",
  "freelance",
  "excessive",
  "screensaver",
  "valuation",
  "unexpected",
  "cigarette",
  "characteristic",
  "metallica",
  "consequently",
  "appointments",
  "narrative",
  "academics",
  "quantitative",
  "screensavers",
  "subdivision",
  "distinction",
  "livestock",
  "exemption",
  "sustainability",
  "formatting",
  "nutritional",
  "nicaragua",
  "affiliation",
  "relatives",
  "satisfactory",
  "revolutionary",
  "bracelets",
  "telephony",
  "breathing",
  "thickness",
  "adjustments",
  "graphical",
  "discussing",
  "aerospace",
  "meaningful",
  "maintains",
  "shortcuts",
  "voyeurweb",
  "extending",
  "specifies",
  "accreditation",
  "blackberry",
  "meditation",
  "microphone",
  "macedonia",
  "combining",
  "instrumental",
  "organizing",
  "moderators",
  "kazakhstan",
  "standings",
  "partition",
  "invisible",
  "translations",
  "commodity",
  "kilometers",
  "thanksgiving",
  "guarantees",
  "indication",
  "congratulations",
  "cigarettes",
  "controllers",
  "consultancy",
  "conventions",
  "coordinates",
  "responding",
  "physically",
  "stakeholders",
  "hydrocodone",
  "consecutive",
  "attempting",
  "representations",
  "competing",
  "peninsula",
  "accurately",
  "considers",
  "ministries",
  "vacancies",
  "parliamentary",
  "acknowledge",
  "thoroughly",
  "nottingham",
  "identifies",
  "questionnaire",
  "qualification",
  "modelling",
  "miniature",
  "interstate",
  "consequence",
  "systematic",
  "perceived",
  "madagascar",
  "presenting",
  "troubleshooting",
  "uzbekistan",
  "centuries",
  "magnitude",
  "richardson",
  "fragrances",
  "vocabulary",
  "earthquake",
  "fundraising",
  "geological",
  "assessing",
  "introduces",
  "webmasters",
  "computational",
  "acdbentity",
  "participated",
  "handhelds",
  "answering",
  "impressed",
  "conspiracy",
  "organizer",
  "combinations",
  "preceding",
  "cumulative",
  "amplifier",
  "arbitrary",
  "prominent",
  "lexington",
  "contacted",
  "recorders",
  "occasional",
  "innovations",
  "postcards",
  "reviewing",
  "explicitly",
  "transsexual",
  "citizenship",
  "informative",
  "girlfriend",
  "bloomberg",
  "hierarchy",
  "influenced",
  "abandoned",
  "complement",
  "mauritius",
  "checklist",
  "requesting",
  "lauderdale",
  "scenarios",
  "extraction",
  "elevation",
  "utilization",
  "beverages",
  "calibration",
  "efficiently",
  "entertaining",
  "prerequisite",
  "hypothesis",
  "medicines",
  "regression",
  "enhancements",
  "renewable",
  "intersection",
  "passwords",
  "consistency",
  "collectors",
  "azerbaijan",
  "astrology",
  "occurring",
  "supplemental",
  "travelling",
  "induction",
  "precisely",
  "spreading",
  "provinces",
  "widespread",
  "incidence",
  "incidents",
  "enhancing",
  "interference",
  "palestine",
  "listprice",
  "atmospheric",
  "knowledgestorm",
  "referenced",
  "publicity",
  "proposition",
  "allowance",
  "designation",
  "duplicate",
  "criterion",
  "civilization",
  "vietnamese",
  "tremendous",
  "corrected",
  "encountered",
  "internationally",
  "surrounded",
  "creatures",
  "commented",
  "accomplish",
  "vegetarian",
  "newfoundland",
  "investigated",
  "ambassador",
  "stephanie",
  "contacting",
  "vegetation",
  "findarticles",
  "specially",
  "infectious",
  "continuity",
  "phenomenon",
  "conscious",
  "referrals",
  "differently",
  "integrating",
  "revisions",
  "reasoning",
  "charitable",
  "annotated",
  "convinced",
  "burlington",
  "replacing",
  "researcher",
  "watershed",
  "occupations",
  "acknowledged",
  "equilibrium",
  "characterized",
  "privilege",
  "qualifying",
  "estimation",
  "pediatric",
  "techrepublic",
  "institutes",
  "brochures",
  "traveller",
  "appropriations",
  "suspected",
  "benchmark",
  "beginners",
  "instructors",
  "highlighted",
  "stationery",
  "unauthorized",
  "competent",
  "contributor",
  "demonstrates",
  "gradually",
  "desirable",
  "journalist",
  "afterwards",
  "religions",
  "explosion",
  "signatures",
  "disciplines",
  "daughters",
  "conversations",
  "simplified",
  "motherboard",
  "bibliographic",
  "champagne",
  "deviation",
  "superintendent",
  "housewives",
  "influences",
  "inspections",
  "irrigation",
  "hydraulic",
  "robertson",
  "penetration",
  "conviction",
  "omissions",
  "retrieval",
  "qualities",
  "prototype",
  "importantly",
  "apparatus",
  "explaining",
  "nomination",
  "empirical",
  "dependence",
  "sexuality",
  "polyester",
  "commitments",
  "suggesting",
  "remainder",
  "privileges",
  "televisions",
  "specializing",
  "commodities",
  "motorcycles",
  "concentrate",
  "reproductive",
  "molecules",
  "refrigerator",
  "intervals",
  "sentences",
  "exclusion",
  "workstation",
  "holocaust",
  "receivers",
  "disposition",
  "navigator",
  "investigators",
  "marijuana",
  "cathedral",
  "fairfield",
  "fascinating",
  "landscapes",
  "lafayette",
  "computation",
  "cardiovascular",
  "salvation",
  "predictions",
  "accompanying",
  "selective",
  "arbitration",
  "configuring",
  "editorials",
  "sacrifice",
  "removable",
  "convergence",
  "gibraltar",
  "anthropology",
  "malpractice",
  "reporters",
  "necessity",
  "rendering",
  "hepatitis",
  "nationally",
  "waterproof",
  "specialties",
  "humanitarian",
  "invitations",
  "functioning",
  "economies",
  "alexandria",
  "bacterial",
  "undertake",
  "continuously",
  "achievements",
  "convertible",
  "secretariat",
  "paragraphs",
  "adolescent",
  "nominations",
  "cancelled",
  "introductory",
  "reservoir",
  "occurrence",
  "worcester",
  "demographic",
  "disciplinary",
  "respected",
  "portraits",
  "interpreted",
  "evaluations",
  "elimination",
  "hypothetical",
  "immigrants",
  "complimentary",
  "helicopter",
  "performer",
  "commissions",
  "powerseller",
  "graduated",
  "surprising",
  "unnecessary",
  "dramatically",
  "yugoslavia",
  "characterization",
  "likelihood",
  "fundamentals",
  "contamination",
  "endangered",
  "compromise",
  "expiration",
  "namespace",
  "peripheral",
  "negotiation",
  "opponents",
  "nominated",
  "confidentiality",
  "electoral",
  "changelog",
  "alternatively",
  "greensboro",
  "controversial",
  "recovered",
  "upgrading",
  "frontpage",
  "demanding",
  "defensive",
  "forbidden",
  "programmers",
  "monitored",
  "installations",
  "deutschland",
  "practitioner",
  "motivated",
  "smithsonian",
  "examining",
  "revelation",
  "delegation",
  "dictionaries",
  "greenhouse",
  "transparency",
  "currencies",
  "survivors",
  "positioning",
  "descending",
  "temporarily",
  "frequencies",
  "reflections",
  "municipality",
  "detective",
  "experiencing",
  "fireplace",
  "endorsement",
  "psychiatry",
  "persistent",
  "summaries",
  "looksmart",
  "magnificent",
  "colleague",
  "adaptation",
  "paintball",
  "enclosure",
  "supervisors",
  "westminster",
  "distances",
  "absorption",
  "treasures",
  "transcripts",
  "disappointed",
  "continually",
  "communist",
  "collectible",
  "entrepreneurs",
  "creations",
  "acquisitions",
  "biodiversity",
  "excitement",
  "presently",
  "mysterious",
  "librarian",
  "subsidiaries",
  "stockholm",
  "indonesian",
  "therapist",
  "promising",
  "relaxation",
  "thereafter",
  "commissioners",
  "forwarding",
  "nightmare",
  "reductions",
  "southampton",
  "organisms",
  "telescope",
  "portsmouth",
  "advancement",
  "harassment",
  "generators",
  "generates",
  "replication",
  "inexpensive",
  "receptors",
  "interventions",
  "huntington",
  "internship",
  "aluminium",
  "snowboard",
  "beastality",
  "evanescence",
  "coordinated",
  "shipments",
  "antarctica",
  "chancellor",
  "controversy",
  "legendary",
  "beautifully",
  "antibodies",
  "examinations",
  "immunology",
  "departmental",
  "terminology",
  "gentleman",
  "reproduce",
  "convicted",
  "roommates",
  "threatening",
  "spokesman",
  "activists",
  "frankfurt",
  "encourages",
  "assembled",
  "restructuring",
  "terminals",
  "simulations",
  "sufficiently",
  "conditional",
  "crossword",
  "conceptual",
  "liechtenstein",
  "translator",
  "automobiles",
  "continent",
  "longitude",
  "challenged",
  "telecharger",
  "insertion",
  "instrumentation",
  "constraint",
  "groundwater",
  "strengthening",
  "insulation",
  "infringement",
  "subjective",
  "swaziland",
  "varieties",
  "mediawiki",
  "configurations"
];

// src/plugins/AutoEmbedPlugin/index.tsx
import {
  AutoEmbedOption,
  LexicalAutoEmbedPlugin,
  URL_MATCHER
} from "@lexical/react/LexicalAutoEmbedPlugin";
import { useLexicalComposerContext as useLexicalComposerContext5 } from "@lexical/react/LexicalComposerContext";
import { useMemo as useMemo5, useState as useState5 } from "react";

// src/hooks/useModal.tsx
import { useCallback as useCallback4, useMemo as useMemo4, useState as useState3 } from "react";

// src/ui/Modal.tsx
import { isDOMNode } from "lexical";
import { useEffect as useEffect3, useRef } from "react";
import { createPortal } from "react-dom";
import { Fragment, jsx as jsx4, jsxs } from "react/jsx-runtime";
function PortalImpl({
  onClose,
  children,
  title,
  closeOnClickOutside
}) {
  const modalRef = useRef(null);
  useEffect3(() => {
    if (modalRef.current !== null) {
      modalRef.current.focus();
    }
  }, []);
  useEffect3(() => {
    let modalOverlayElement = null;
    const handler = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const clickOutsideHandler = (event) => {
      const target = event.target;
      if (modalRef.current !== null && isDOMNode(target) && !modalRef.current.contains(target) && closeOnClickOutside) {
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx4("div", { className: "notion-like-editor notion-like-modal-overlay fixed inset-0 bg-black/50 z-50", role: "dialog" }),
    /* @__PURE__ */ jsx4(
      "div",
      {
        className: "notion-like-editor notion-like-modal-content fixed inset-0 z-60 flex items-center justify-center p-4",
        tabIndex: -1,
        ref: modalRef,
        children: /* @__PURE__ */ jsxs("div", { className: "bg-base-100 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-6 border-b border-base-300", children: [
            /* @__PURE__ */ jsx4("h2", { className: "text-2xl font-bold flex items-center gap-2", children: title }),
            /* @__PURE__ */ jsx4("button", { type: "button", className: "btn btn-sm btn-circle ms-2", onClick: onClose, "aria-label": "\u9589\u3058\u308B", children: /* @__PURE__ */ jsx4("span", { className: "icon-[mdi--close] size-5", "aria-hidden": "true" }) })
          ] }),
          /* @__PURE__ */ jsx4("div", { className: "p-6", children })
        ] })
      }
    )
  ] });
}
function Modal({
  onClose,
  children,
  title,
  closeOnClickOutside = false
}) {
  return createPortal(
    /* @__PURE__ */ jsx4(PortalImpl, { onClose, title, closeOnClickOutside, children }),
    document.body
  );
}

// src/hooks/useModal.tsx
import { jsx as jsx5 } from "react/jsx-runtime";
function useModal() {
  const [modalContent, setModalContent] = useState3(null);
  const onClose = useCallback4(() => {
    setModalContent(null);
  }, []);
  const modal = useMemo4(() => {
    if (modalContent === null) {
      return null;
    }
    const { title, content, closeOnClickOutside } = modalContent;
    return /* @__PURE__ */ jsx5(Modal, { onClose, title, closeOnClickOutside, children: content });
  }, [modalContent, onClose]);
  const showModal = useCallback4(
    (title, getContent, closeOnClickOutside = false) => {
      setModalContent({
        closeOnClickOutside,
        content: getContent(onClose),
        title
      });
    },
    [onClose]
  );
  return [modal, showModal];
}

// src/utils/joinClasses.ts
function joinClasses(...args) {
  return args.filter(Boolean).join(" ");
}

// src/ui/Button.tsx
import { jsx as jsx6 } from "react/jsx-runtime";
function Button({
  "data-test-id": dataTestId,
  children,
  className,
  onClick,
  disabled,
  small,
  title
}) {
  return /* @__PURE__ */ jsx6(
    "button",
    {
      type: "button",
      disabled,
      className: joinClasses("btn btn-primary", small && "btn-sm", className),
      onClick,
      title,
      "aria-label": title,
      ...dataTestId && { "data-test-id": dataTestId },
      children
    }
  );
}

// src/ui/Dialog.tsx
import { jsx as jsx7 } from "react/jsx-runtime";
function DialogButtonsList({ children }) {
  return /* @__PURE__ */ jsx7("div", { className: "DialogButtonsList", children });
}
function DialogActions({ "data-test-id": dataTestId, children }) {
  return /* @__PURE__ */ jsx7("div", { className: "DialogActions", "data-test-id": dataTestId, children });
}

// src/plugins/FigmaPlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext2 } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { COMMAND_PRIORITY_EDITOR, createCommand } from "lexical";
import { useEffect as useEffect4 } from "react";

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

// src/plugins/FigmaPlugin/index.tsx
var INSERT_FIGMA_COMMAND = createCommand("INSERT_FIGMA_COMMAND");
function FigmaPlugin() {
  const [editor] = useLexicalComposerContext2();
  useEffect4(() => {
    if (!editor.hasNodes([FigmaNode])) {
      throw new Error("FigmaPlugin: FigmaNode not registered on editor");
    }
    return editor.registerCommand(
      INSERT_FIGMA_COMMAND,
      (payload) => {
        const figmaNode = $createFigmaNode(payload);
        $insertNodeToNearestRoot(figmaNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

// src/plugins/TwitterPlugin/index.ts
import { useLexicalComposerContext as useLexicalComposerContext3 } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot as $insertNodeToNearestRoot2 } from "@lexical/utils";
import { COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR2, createCommand as createCommand2 } from "lexical";
import { useEffect as useEffect6 } from "react";

// src/nodes/TweetNode.tsx
import { BlockWithAlignableContents as BlockWithAlignableContents2 } from "@lexical/react/LexicalBlockWithAlignableContents";
import { DecoratorBlockNode as DecoratorBlockNode2 } from "@lexical/react/LexicalDecoratorBlockNode";
import { useCallback as useCallback5, useEffect as useEffect5, useRef as useRef2, useState as useState4 } from "react";
import { jsx as jsx9, jsxs as jsxs2 } from "react/jsx-runtime";
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
  const containerRef = useRef2(null);
  const previousTweetIDRef = useRef2("");
  const [isTweetLoading, setIsTweetLoading] = useState4(false);
  const createTweet = useCallback5(async () => {
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
  useEffect5(() => {
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
  return /* @__PURE__ */ jsxs2(BlockWithAlignableContents2, { className, format, nodeKey, children: [
    isTweetLoading ? loadingComponent : null,
    /* @__PURE__ */ jsx9("div", { style: { display: "inline-block", width: "550px" }, ref: containerRef })
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
    return /* @__PURE__ */ jsx9(
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

// src/plugins/TwitterPlugin/index.ts
var INSERT_TWEET_COMMAND = createCommand2("INSERT_TWEET_COMMAND");
function TwitterPlugin() {
  const [editor] = useLexicalComposerContext3();
  useEffect6(() => {
    if (!editor.hasNodes([TweetNode])) {
      throw new Error("TwitterPlugin: TweetNode not registered on editor");
    }
    return editor.registerCommand(
      INSERT_TWEET_COMMAND,
      (payload) => {
        const tweetNode = $createTweetNode(payload);
        $insertNodeToNearestRoot2(tweetNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR2
    );
  }, [editor]);
  return null;
}

// src/plugins/YouTubePlugin/index.ts
import { useLexicalComposerContext as useLexicalComposerContext4 } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot as $insertNodeToNearestRoot3 } from "@lexical/utils";
import { COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR3, createCommand as createCommand3 } from "lexical";
import { useEffect as useEffect7 } from "react";

// src/nodes/YouTubeNode.tsx
import { BlockWithAlignableContents as BlockWithAlignableContents3 } from "@lexical/react/LexicalBlockWithAlignableContents";
import { DecoratorBlockNode as DecoratorBlockNode3 } from "@lexical/react/LexicalDecoratorBlockNode";
import { jsx as jsx10 } from "react/jsx-runtime";
function YouTubeComponent({ className, format, nodeKey, videoID }) {
  return /* @__PURE__ */ jsx10(BlockWithAlignableContents3, { className, format, nodeKey, children: /* @__PURE__ */ jsx10(
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
    return /* @__PURE__ */ jsx10(YouTubeComponent, { className, format: this.__format, nodeKey: this.getKey(), videoID: this.__id });
  }
};
function $createYouTubeNode(videoID) {
  return new YouTubeNode(videoID);
}
function $isYouTubeNode(node) {
  return node instanceof YouTubeNode;
}

// src/plugins/YouTubePlugin/index.ts
var INSERT_YOUTUBE_COMMAND = createCommand3("INSERT_YOUTUBE_COMMAND");
function YouTubePlugin() {
  const [editor] = useLexicalComposerContext4();
  useEffect7(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error("YouTubePlugin: YouTubeNode not registered on editor");
    }
    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        const youTubeNode = $createYouTubeNode(payload);
        $insertNodeToNearestRoot3(youTubeNode);
        return true;
      },
      COMMAND_PRIORITY_EDITOR3
    );
  }, [editor]);
  return null;
}

// src/plugins/AutoEmbedPlugin/index.tsx
import { Fragment as Fragment2, jsx as jsx11, jsxs as jsxs3 } from "react/jsx-runtime";
var YoutubeEmbedConfig = {
  contentName: "Youtube Video",
  exampleUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  // Icon for display.
  icon: /* @__PURE__ */ jsx11("i", { className: "icon youtube" }),
  insertNode: (editor, result) => {
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, result.id);
  },
  keywords: ["youtube", "video"],
  // Determine if a given URL is a match and return url data.
  parseUrl: async (url) => {
    const match = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);
    const id = match ? match?.[2].length === 11 ? match[2] : null : null;
    if (id != null) {
      return {
        id,
        url
      };
    }
    return null;
  },
  type: "youtube-video"
};
var TwitterEmbedConfig = {
  // e.g. Tweet or Google Map.
  contentName: "X(Tweet)",
  exampleUrl: "https://x.com/jack/status/20",
  // Icon for display.
  icon: /* @__PURE__ */ jsx11("i", { className: "icon x" }),
  // Create the Lexical embed node from the url data.
  insertNode: (editor, result) => {
    editor.dispatchCommand(INSERT_TWEET_COMMAND, result.id);
  },
  // For extra searching.
  keywords: ["tweet", "twitter", "x"],
  // Determine if a given URL is a match and return url data.
  parseUrl: (text) => {
    const match = /^https:\/\/(twitter|x)\.com\/(#!\/)?(\w+)\/status(es)*\/(\d+)/.exec(text);
    if (match != null) {
      return {
        id: match[5],
        url: match[1]
      };
    }
    return null;
  },
  type: "tweet"
};
var FigmaEmbedConfig = {
  contentName: "Figma Document",
  exampleUrl: "https://www.figma.com/file/LKQ4FJ4bTnCSjedbRpk931/Sample-File",
  icon: /* @__PURE__ */ jsx11("i", { className: "icon figma" }),
  insertNode: (editor, result) => {
    editor.dispatchCommand(INSERT_FIGMA_COMMAND, result.id);
  },
  keywords: ["figma", "figma.com", "mock-up"],
  // Determine if a given URL is a match and return url data.
  parseUrl: (text) => {
    const match = /https:\/\/([\w.-]+\.)?figma.com\/(file|proto)\/([0-9a-zA-Z]{22,128})(?:\/.*)?$/.exec(text);
    if (match != null) {
      return {
        id: match[3],
        url: match[0]
      };
    }
    return null;
  },
  type: "figma"
};
var EmbedConfigs = [TwitterEmbedConfig, YoutubeEmbedConfig, FigmaEmbedConfig];
var debounce = (callback, delay) => {
  let timeoutId;
  return (text) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(text);
    }, delay);
  };
};
function AutoEmbedDialog({
  embedConfig,
  onClose
}) {
  const [text, setText] = useState5("");
  const [editor] = useLexicalComposerContext5();
  const [embedResult, setEmbedResult] = useState5(null);
  const validateText = useMemo5(
    () => debounce((inputText) => {
      const urlMatch = URL_MATCHER.exec(inputText);
      if (embedConfig != null && inputText != null && urlMatch != null) {
        Promise.resolve(embedConfig.parseUrl(inputText)).then((parseResult) => {
          setEmbedResult(parseResult);
        });
      } else if (embedResult != null) {
        setEmbedResult(null);
      }
    }, 200),
    [embedConfig, embedResult]
  );
  const onClick = () => {
    if (embedResult != null) {
      embedConfig.insertNode(editor, embedResult);
      onClose();
    }
  };
  return /* @__PURE__ */ jsxs3("div", { style: { width: "100%", maxWidth: "600px" }, children: [
    /* @__PURE__ */ jsx11("div", { className: "Input__wrapper", children: /* @__PURE__ */ jsx11(
      "input",
      {
        type: "text",
        className: "Input__input",
        placeholder: embedConfig.exampleUrl,
        value: text,
        "data-test-id": `${embedConfig.type}-embed-modal-url`,
        onChange: (e) => {
          const { value } = e.target;
          setText(value);
          validateText(value);
        }
      }
    ) }),
    /* @__PURE__ */ jsx11(DialogActions, { children: /* @__PURE__ */ jsx11(Button, { disabled: !embedResult, onClick, "data-test-id": `${embedConfig.type}-embed-modal-submit-btn`, children: "Embed" }) })
  ] });
}
function AutoEmbedPlugin() {
  const [modal, showModal] = useModal();
  const openEmbedModal = (embedConfig) => {
    showModal(`Embed ${embedConfig.contentName}`, (onClose) => /* @__PURE__ */ jsx11(AutoEmbedDialog, { embedConfig, onClose }));
  };
  const getMenuOptions = (activeEmbedConfig, embedFn, dismissFn) => {
    return [
      new AutoEmbedOption("Dismiss", {
        onSelect: dismissFn
      }),
      new AutoEmbedOption(`Embed ${activeEmbedConfig.contentName}`, {
        onSelect: embedFn
      })
    ];
  };
  return /* @__PURE__ */ jsxs3(Fragment2, { children: [
    modal,
    /* @__PURE__ */ jsx11(
      LexicalAutoEmbedPlugin,
      {
        embedConfigs: EmbedConfigs,
        onOpenEmbedModalForConfig: openEmbedModal,
        getMenuOptions,
        menuRenderFn: (_menuProps) => {
          return null;
        }
      }
    )
  ] });
}

// src/plugins/AutoLinkPlugin/index.tsx
import { AutoLinkPlugin, createLinkMatcherWithRegExp } from "@lexical/react/LexicalAutoLinkPlugin";
import { useMemo as useMemo7 } from "react";

// src/context/AutoLinkContext.tsx
import { createContext as createContext4, useContext as useContext4, useMemo as useMemo6 } from "react";
import { jsx as jsx12 } from "react/jsx-runtime";
var AutoLinkContext = createContext4({
  customMatchers: []
});
function useCustomLinkMatchers() {
  const context = useContext4(AutoLinkContext);
  return context.customMatchers;
}
function AutoLinkProvider({ children, customMatchers = [] }) {
  const value = useMemo6(() => ({ customMatchers }), [customMatchers]);
  return /* @__PURE__ */ jsx12(AutoLinkContext.Provider, { value, children });
}

// src/plugins/AutoLinkPlugin/index.tsx
import { jsx as jsx13 } from "react/jsx-runtime";
var URL_REGEX = /((https?:\/\/(www\.)?)|(www\.))((localhost(:\d+)?)|[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;
var EMAIL_REGEX = /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
var BASE_MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith("http") ? text : `https://${text}`;
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  })
];
function LexicalAutoLinkPlugin() {
  const customMatchers = useCustomLinkMatchers();
  const matchers = useMemo7(() => {
    if (customMatchers.length === 0) {
      return BASE_MATCHERS;
    }
    return [...BASE_MATCHERS, ...customMatchers];
  }, [customMatchers]);
  return /* @__PURE__ */ jsx13(AutoLinkPlugin, { matchers });
}

// src/plugins/CodeActionMenuPlugin/index.tsx
import { $isCodeNode as $isCodeNode3, CodeNode, normalizeCodeLang } from "@lexical/code";
import { useLexicalComposerContext as useLexicalComposerContext6 } from "@lexical/react/LexicalComposerContext";
import { $getNearestNodeFromDOMNode as $getNearestNodeFromDOMNode3, isHTMLElement } from "lexical";
import { useEffect as useEffect8, useRef as useRef3, useState as useState8 } from "react";
import { createPortal as createPortal2 } from "react-dom";

// src/plugins/CodeActionMenuPlugin/components/CopyButton/index.tsx
import { $isCodeNode } from "@lexical/code";
import { $getNearestNodeFromDOMNode, $getSelection as $getSelection2, $setSelection as $setSelection2 } from "lexical";
import { useState as useState6 } from "react";

// src/plugins/CodeActionMenuPlugin/utils.ts
import { useDebouncedCallback } from "use-debounce";
function useDebounce(fn, ms, maxWait) {
  return useDebouncedCallback(fn, ms, { maxWait });
}

// src/plugins/CodeActionMenuPlugin/components/CopyButton/index.tsx
import { jsx as jsx14 } from "react/jsx-runtime";
function CopyButton({ editor, getCodeDOMNode }) {
  const [isCopyCompleted, setCopyCompleted] = useState6(false);
  const removeSuccessIcon = useDebounce(() => {
    setCopyCompleted(false);
  }, 1e3);
  async function handleClick() {
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }
    let content = "";
    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);
      if ($isCodeNode(codeNode)) {
        content = codeNode.getTextContent();
      }
      const selection = $getSelection2();
      $setSelection2(selection);
    });
    try {
      await navigator.clipboard.writeText(content);
      setCopyCompleted(true);
      removeSuccessIcon();
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }
  return /* @__PURE__ */ jsx14("button", { type: "button", className: "menu-item", onClick: handleClick, "aria-label": "copy", children: isCopyCompleted ? /* @__PURE__ */ jsx14("i", { className: "format success" }) : /* @__PURE__ */ jsx14("i", { className: "format copy" }) });
}

// src/plugins/CodeActionMenuPlugin/components/PrettierButton/index.tsx
import { $isCodeNode as $isCodeNode2 } from "@lexical/code";
import { $getNearestNodeFromDOMNode as $getNearestNodeFromDOMNode2 } from "lexical";
import { useState as useState7 } from "react";
import { jsx as jsx15, jsxs as jsxs4 } from "react/jsx-runtime";
var PRETTIER_PARSER_MODULES = {
  css: [() => import("prettier/parser-postcss")],
  html: [() => import("prettier/parser-html")],
  js: [() => import("prettier/parser-babel"), () => import("prettier/plugins/estree")],
  markdown: [() => import("prettier/parser-markdown")],
  typescript: [() => import("prettier/parser-typescript"), () => import("prettier/plugins/estree")]
};
async function loadPrettierParserByLang(lang) {
  const dynamicImports = PRETTIER_PARSER_MODULES[lang];
  const modules = await Promise.all(dynamicImports.map((dynamicImport) => dynamicImport()));
  return modules;
}
async function loadPrettierFormat() {
  const { format } = await import("prettier/standalone");
  return format;
}
var PRETTIER_OPTIONS_BY_LANG = {
  css: { parser: "css" },
  html: { parser: "html" },
  js: { parser: "babel" },
  markdown: { parser: "markdown" },
  typescript: { parser: "typescript" }
};
var LANG_CAN_BE_PRETTIER = Object.keys(PRETTIER_OPTIONS_BY_LANG);
function canBePrettier(lang) {
  return LANG_CAN_BE_PRETTIER.includes(lang);
}
function getPrettierOptions(lang) {
  const options = PRETTIER_OPTIONS_BY_LANG[lang];
  if (!options) {
    throw new Error(`CodeActionMenuPlugin: Prettier does not support this language: ${lang}`);
  }
  return options;
}
function PrettierButton({ lang, editor, getCodeDOMNode }) {
  const [syntaxError, setSyntaxError] = useState7("");
  const [tipsVisible, setTipsVisible] = useState7(false);
  async function handleClick() {
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }
    let content = "";
    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode2(codeDOMNode);
      if ($isCodeNode2(codeNode)) {
        content = codeNode.getTextContent();
      }
    });
    if (content === "") {
      return;
    }
    try {
      const format = await loadPrettierFormat();
      const options = getPrettierOptions(lang);
      const prettierParsers = await loadPrettierParserByLang(lang);
      options.plugins = prettierParsers.map((parser) => parser.default || parser);
      const formattedCode = await format(content, options);
      editor.update(() => {
        const codeNode = $getNearestNodeFromDOMNode2(codeDOMNode);
        if ($isCodeNode2(codeNode)) {
          const selection = codeNode.select(0);
          selection.insertText(formattedCode);
          setSyntaxError("");
          setTipsVisible(false);
        }
      });
    } catch (error) {
      setError(error);
    }
  }
  function setError(error) {
    console.error("Prettier format error: ", error);
    if (error instanceof Error) {
      setSyntaxError(error.message);
      setTipsVisible(true);
    } else {
      console.error("Unexpected error: ", error);
    }
  }
  function handleMouseEnter() {
    if (syntaxError !== "") {
      setTipsVisible(true);
    }
  }
  function handleMouseLeave() {
    if (syntaxError !== "") {
      setTipsVisible(false);
    }
  }
  return /* @__PURE__ */ jsxs4("div", { className: "prettier-wrapper", children: [
    /* @__PURE__ */ jsx15(
      "button",
      {
        type: "button",
        className: "menu-item",
        onClick: handleClick,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        "aria-label": "prettier",
        children: syntaxError ? /* @__PURE__ */ jsx15("i", { className: "format prettier-error" }) : /* @__PURE__ */ jsx15("i", { className: "format prettier" })
      }
    ),
    tipsVisible ? /* @__PURE__ */ jsx15("pre", { className: "code-error-tips", children: syntaxError }) : null
  ] });
}

// src/plugins/CodeActionMenuPlugin/index.tsx
import { Fragment as Fragment3, jsx as jsx16, jsxs as jsxs5 } from "react/jsx-runtime";
var CODE_PADDING = 8;
var SUPPORTED_LANGUAGES = [
  { value: "", label: "Plain Text" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "js", label: "JS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "objc", label: "Objective-C" },
  { value: "php", label: "PHP" },
  { value: "powershell", label: "PowerShell" },
  { value: "python", label: "Python" },
  { value: "py", label: "Python" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "swift", label: "Swift" },
  { value: "typescript", label: "TypeScript" },
  { value: "xml", label: "XML" }
];
function CodeActionMenuContainer({
  anchorElem,
  showOnlyCopy = false
}) {
  const [editor] = useLexicalComposerContext6();
  const [lang, setLang] = useState8("");
  const [isShown, setShown] = useState8(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState8(false);
  const [position, setPosition] = useState8({
    right: "0",
    top: "0"
  });
  const codeSetRef = useRef3(/* @__PURE__ */ new Set());
  const codeDOMNodeRef = useRef3(null);
  function getCodeDOMNode() {
    return codeDOMNodeRef.current;
  }
  const debouncedOnMouseMove = useDebounce(
    (event) => {
      const { codeDOMNode, isOutside } = getMouseInfo(event);
      if (isOutside) {
        setShown(false);
        return;
      }
      if (!codeDOMNode) {
        return;
      }
      codeDOMNodeRef.current = codeDOMNode;
      let codeNode = null;
      let _lang = "";
      editor.update(() => {
        const maybeCodeNode = $getNearestNodeFromDOMNode3(codeDOMNode);
        if ($isCodeNode3(maybeCodeNode)) {
          codeNode = maybeCodeNode;
          _lang = codeNode.getLanguage() || "";
        }
      });
      if (codeNode) {
        const { y: editorElemY, right: editorElemRight } = anchorElem.getBoundingClientRect();
        const { y: y2, right } = codeDOMNode.getBoundingClientRect();
        setLang(_lang);
        setShown(true);
        setPosition({
          right: `${editorElemRight - right + CODE_PADDING}px`,
          top: `${y2 - editorElemY}px`
        });
      }
    },
    50,
    1e3
  );
  useEffect8(() => {
    if (!shouldListenMouseMove) {
      return;
    }
    document.addEventListener("mousemove", debouncedOnMouseMove);
    return () => {
      setShown(false);
      debouncedOnMouseMove.cancel();
      document.removeEventListener("mousemove", debouncedOnMouseMove);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove]);
  useEffect8(() => {
    return editor.registerMutationListener(
      CodeNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            switch (type) {
              case "created":
                codeSetRef.current.add(key);
                break;
              case "destroyed":
                codeSetRef.current.delete(key);
                break;
              default:
                break;
            }
          }
        });
        setShouldListenMouseMove(codeSetRef.current.size > 0);
      },
      { skipInitialization: false }
    );
  }, [editor]);
  const normalizedLang = normalizeCodeLang(lang);
  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }
    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode3(codeDOMNode);
      if ($isCodeNode3(codeNode)) {
        codeNode.setLanguage(newLang);
      }
    });
  };
  return /* @__PURE__ */ jsx16(Fragment3, { children: isShown ? /* @__PURE__ */ jsxs5("div", { className: "notion-like-editor code-action-menu-container", style: { ...position }, children: [
    !showOnlyCopy && /* @__PURE__ */ jsx16(
      "select",
      {
        className: "select select-xs max-w-sm",
        value: lang,
        onChange: handleLanguageChange,
        "aria-label": "\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF\u306E\u8A00\u8A9E\u3092\u9078\u629E",
        children: SUPPORTED_LANGUAGES.map((language) => /* @__PURE__ */ jsx16("option", { value: language.value, children: language.label }, language.value))
      }
    ),
    /* @__PURE__ */ jsx16(CopyButton, { editor, getCodeDOMNode }),
    !showOnlyCopy && canBePrettier(normalizedLang) ? /* @__PURE__ */ jsx16(PrettierButton, { editor, getCodeDOMNode, lang: normalizedLang }) : null
  ] }) : null });
}
function getMouseInfo(event) {
  const target = event.target;
  if (isHTMLElement(target)) {
    const codeDOMNode = target.closest("code.NotionLikeEditorTheme__code");
    const isOutside = !(codeDOMNode || target.closest("div.code-action-menu-container"));
    return { codeDOMNode, isOutside };
  } else {
    return { codeDOMNode: null, isOutside: true };
  }
}
function CodeActionMenuPlugin({
  anchorElem = document.body,
  showOnlyCopy = false
}) {
  return createPortal2(/* @__PURE__ */ jsx16(CodeActionMenuContainer, { anchorElem, showOnlyCopy }), anchorElem);
}

// src/plugins/CodeHighlightPrismPlugin/index.ts
import { registerCodeHighlighting } from "@lexical/code";
import { useLexicalComposerContext as useLexicalComposerContext7 } from "@lexical/react/LexicalComposerContext";
import { useEffect as useEffect9 } from "react";
function CodeHighlightPrismPlugin() {
  const [editor] = useLexicalComposerContext7();
  useEffect9(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);
  return null;
}

// src/plugins/CodeHighlightShikiPlugin/index.ts
import { registerCodeHighlighting as registerCodeHighlighting2 } from "@lexical/code-shiki";
import { useLexicalComposerContext as useLexicalComposerContext8 } from "@lexical/react/LexicalComposerContext";
import { useEffect as useEffect10 } from "react";
function CodeHighlightShikiPlugin() {
  const [editor] = useLexicalComposerContext8();
  useEffect10(() => {
    return registerCodeHighlighting2(editor);
  }, [editor]);
  return null;
}

// src/plugins/CollapsiblePlugin/index.ts
import { useLexicalComposerContext as useLexicalComposerContext9 } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, $insertNodeToNearestRoot as $insertNodeToNearestRoot4, mergeRegister as mergeRegister2 } from "@lexical/utils";
import {
  $createParagraphNode as $createParagraphNode2,
  $getSelection as $getSelection3,
  $isRangeSelection as $isRangeSelection2,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW2,
  createCommand as createCommand4,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND as KEY_ARROW_RIGHT_COMMAND2,
  KEY_ARROW_UP_COMMAND
} from "lexical";
import { useEffect as useEffect11 } from "react";

// src/plugins/CollapsiblePlugin/CollapsibleContainerNode.ts
import { IS_CHROME } from "@lexical/utils";
import {
  $getSiblingCaret,
  $isElementNode,
  $rewindSiblingCaret,
  ElementNode,
  isHTMLElement as isHTMLElement2
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
        if (!isHTMLElement2(contentDom)) {
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

// src/plugins/CollapsiblePlugin/index.ts
var INSERT_COLLAPSIBLE_COMMAND = createCommand4("INSERT_COLLAPSIBLE_COMMAND");
function CollapsiblePlugin() {
  const [editor] = useLexicalComposerContext9();
  useEffect11(() => {
    if (!editor.hasNodes([CollapsibleContainerNode, CollapsibleTitleNode, CollapsibleContentNode])) {
      throw new Error(
        "CollapsiblePlugin: CollapsibleContainerNode, CollapsibleTitleNode, or CollapsibleContentNode not registered on editor"
      );
    }
    const $onEscapeUp = () => {
      const selection = $getSelection3();
      if ($isRangeSelection2(selection) && selection.isCollapsed() && selection.anchor.offset === 0) {
        const container = $findMatchingParent(selection.anchor.getNode(), $isCollapsibleContainerNode);
        if ($isCollapsibleContainerNode(container)) {
          const parent = container.getParent();
          if (parent !== null && parent.getFirstChild() === container && selection.anchor.key === container.getFirstDescendant()?.getKey()) {
            container.insertBefore($createParagraphNode2());
          }
        }
      }
      return false;
    };
    const $onEscapeDown = () => {
      const selection = $getSelection3();
      if ($isRangeSelection2(selection) && selection.isCollapsed()) {
        const container = $findMatchingParent(selection.anchor.getNode(), $isCollapsibleContainerNode);
        if ($isCollapsibleContainerNode(container)) {
          const parent = container.getParent();
          if (parent !== null && parent.getLastChild() === container) {
            const titleParagraph = container.getFirstDescendant();
            const contentParagraph = container.getLastDescendant();
            if (contentParagraph !== null && selection.anchor.key === contentParagraph.getKey() && selection.anchor.offset === contentParagraph.getTextContentSize() || titleParagraph !== null && selection.anchor.key === titleParagraph.getKey() && selection.anchor.offset === titleParagraph.getTextContentSize()) {
              container.insertAfter($createParagraphNode2());
            }
          }
        }
      }
      return false;
    };
    return mergeRegister2(
      // Structure enforcing transformers for each node type. In case nesting structure is not
      // "Container > Title + Content" it'll unwrap nodes and convert it back
      // to regular content.
      editor.registerNodeTransform(CollapsibleContentNode, (node) => {
        const parent = node.getParent();
        if (!$isCollapsibleContainerNode(parent)) {
          const children = node.getChildren();
          for (const child of children) {
            node.insertBefore(child);
          }
          node.remove();
        }
      }),
      editor.registerNodeTransform(CollapsibleTitleNode, (node) => {
        const parent = node.getParent();
        if (!$isCollapsibleContainerNode(parent)) {
          node.replace($createParagraphNode2().append(...node.getChildren()));
          return;
        }
      }),
      editor.registerNodeTransform(CollapsibleContainerNode, (node) => {
        const children = node.getChildren();
        if (children.length !== 2 || !$isCollapsibleTitleNode(children[0]) || !$isCollapsibleContentNode(children[1])) {
          for (const child of children) {
            node.insertBefore(child);
          }
          node.remove();
        }
      }),
      // When collapsible is the last child pressing down/right arrow will insert paragraph
      // below it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if trailing paragraph is accidentally deleted
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, $onEscapeDown, COMMAND_PRIORITY_LOW2),
      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND2, $onEscapeDown, COMMAND_PRIORITY_LOW2),
      // When collapsible is the first child pressing up/left arrow will insert paragraph
      // above it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if leading paragraph is accidentally deleted
      editor.registerCommand(KEY_ARROW_UP_COMMAND, $onEscapeUp, COMMAND_PRIORITY_LOW2),
      editor.registerCommand(KEY_ARROW_LEFT_COMMAND, $onEscapeUp, COMMAND_PRIORITY_LOW2),
      // Enter goes from Title to Content rather than a new line inside Title
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          const selection = $getSelection3();
          if ($isRangeSelection2(selection)) {
            const titleNode = $findMatchingParent(selection.anchor.getNode(), (node) => $isCollapsibleTitleNode(node));
            if ($isCollapsibleTitleNode(titleNode)) {
              const container = titleNode.getParent();
              if (container && $isCollapsibleContainerNode(container)) {
                if (!container.getOpen()) {
                  container.toggleOpen();
                }
                titleNode.getNextSibling()?.selectEnd();
                return true;
              }
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW2
      ),
      editor.registerCommand(
        INSERT_COLLAPSIBLE_COMMAND,
        () => {
          editor.update(() => {
            const title = $createCollapsibleTitleNode();
            const paragraph = $createParagraphNode2();
            $insertNodeToNearestRoot4(
              $createCollapsibleContainerNode(true).append(
                title.append(paragraph),
                $createCollapsibleContentNode().append($createParagraphNode2())
              )
            );
            paragraph.select();
          });
          return true;
        },
        COMMAND_PRIORITY_LOW2
      )
    );
  }, [editor]);
  return null;
}

// src/plugins/ComponentPickerPlugin/index.tsx
import { $createCodeNode } from "@lexical/code";
import { INSERT_CHECK_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { INSERT_EMBED_COMMAND } from "@lexical/react/LexicalAutoEmbedPlugin";
import { useLexicalComposerContext as useLexicalComposerContext23 } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
  LexicalTypeaheadMenuPlugin as LexicalTypeaheadMenuPlugin2,
  MenuOption as MenuOption2,
  useBasicTypeaheadTriggerMatch as useBasicTypeaheadTriggerMatch2
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { INSERT_TABLE_COMMAND as INSERT_TABLE_COMMAND2 } from "@lexical/table";
import {
  $createParagraphNode as $createParagraphNode7,
  $getSelection as $getSelection9,
  $isRangeSelection as $isRangeSelection6,
  FORMAT_ELEMENT_COMMAND
} from "lexical";
import { useCallback as useCallback12, useMemo as useMemo13, useState as useState20 } from "react";
import * as ReactDOM2 from "react-dom";

// src/context/ComponentPickerContext.tsx
import { createContext as createContext5, useContext as useContext5 } from "react";
import { jsx as jsx17 } from "react/jsx-runtime";
var ComponentPickerContext = createContext5({});
function ComponentPickerProvider({
  children,
  extraOptions
}) {
  return /* @__PURE__ */ jsx17(ComponentPickerContext.Provider, { value: { extraOptions }, children });
}
function useComponentPickerContext() {
  return useContext5(ComponentPickerContext);
}

// src/plugins/DateTimePlugin/index.tsx
init_DateTimeNode2();
import { useLexicalComposerContext as useLexicalComposerContext11 } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement, mergeRegister as mergeRegister3 } from "@lexical/utils";
import {
  $createParagraphNode as $createParagraphNode3,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR4,
  createCommand as createCommand5
} from "lexical";
import { useEffect as useEffect13 } from "react";
var INSERT_DATETIME_COMMAND = createCommand5("INSERT_DATETIME_COMMAND");
function DateTimePlugin() {
  const [editor] = useLexicalComposerContext11();
  useEffect13(() => {
    if (!editor.hasNodes([DateTimeNode])) {
      throw new Error("DateTimePlugin: DateTimeNode not registered on editor");
    }
    return mergeRegister3(
      editor.registerCommand(
        INSERT_DATETIME_COMMAND,
        (payload) => {
          const { dateTime } = payload;
          const dateTimeNode = $createDateTimeNode(dateTime);
          $insertNodes([dateTimeNode]);
          if ($isRootOrShadowRoot(dateTimeNode.getParentOrThrow())) {
            $wrapNodeInElement(dateTimeNode, $createParagraphNode3).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR4
      )
    );
  }, [editor]);
  return null;
}

// src/plugins/EquationsPlugin/index.tsx
init_EquationNode();
import "katex/dist/katex.css";
import { useLexicalComposerContext as useLexicalComposerContext14 } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement as $wrapNodeInElement2 } from "@lexical/utils";
import {
  $createParagraphNode as $createParagraphNode4,
  $insertNodes as $insertNodes2,
  $isRootOrShadowRoot as $isRootOrShadowRoot2,
  COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR5,
  createCommand as createCommand6
} from "lexical";
import { useCallback as useCallback8, useEffect as useEffect16 } from "react";

// src/ui/KatexEquationAlterer.tsx
init_react_error_boundary();
import { useLexicalComposerContext as useLexicalComposerContext13 } from "@lexical/react/LexicalComposerContext";
import { useCallback as useCallback7, useState as useState11 } from "react";
init_KatexRenderer();
import { Fragment as Fragment6, jsx as jsx24, jsxs as jsxs9 } from "react/jsx-runtime";
function KatexEquationAlterer({ onConfirm, initialEquation = "" }) {
  const [editor] = useLexicalComposerContext13();
  const [equation, setEquation] = useState11(initialEquation);
  const [inline, setInline] = useState11(true);
  const onClick = useCallback7(() => {
    onConfirm(equation, inline);
  }, [onConfirm, equation, inline]);
  const onCheckboxChange = useCallback7(() => {
    setInline(!inline);
  }, [inline]);
  return /* @__PURE__ */ jsxs9(Fragment6, { children: [
    /* @__PURE__ */ jsxs9("div", { className: "KatexEquationAlterer_defaultRow", children: [
      "Inline",
      /* @__PURE__ */ jsx24("input", { type: "checkbox", checked: inline, onChange: onCheckboxChange })
    ] }),
    /* @__PURE__ */ jsx24("div", { className: "KatexEquationAlterer_defaultRow", children: "Equation " }),
    /* @__PURE__ */ jsx24("div", { className: "KatexEquationAlterer_centerRow", children: inline ? /* @__PURE__ */ jsx24(
      "input",
      {
        onChange: (event) => {
          setEquation(event.target.value);
        },
        value: equation,
        className: "KatexEquationAlterer_textArea"
      }
    ) : /* @__PURE__ */ jsx24(
      "textarea",
      {
        onChange: (event) => {
          setEquation(event.target.value);
        },
        value: equation,
        className: "KatexEquationAlterer_textArea"
      }
    ) }),
    /* @__PURE__ */ jsx24("div", { className: "KatexEquationAlterer_defaultRow", children: "Visualization " }),
    /* @__PURE__ */ jsx24("div", { className: "KatexEquationAlterer_centerRow", children: /* @__PURE__ */ jsx24(m, { onError: (e) => editor._onError(e), fallback: null, children: /* @__PURE__ */ jsx24(KatexRenderer, { equation, inline: false, onDoubleClick: () => null }) }) }),
    /* @__PURE__ */ jsx24("div", { className: "KatexEquationAlterer_dialogActions", children: /* @__PURE__ */ jsx24(Button, { onClick, children: "Confirm" }) })
  ] });
}

// src/plugins/EquationsPlugin/index.tsx
import { jsx as jsx25 } from "react/jsx-runtime";
var INSERT_EQUATION_COMMAND = createCommand6("INSERT_EQUATION_COMMAND");
function InsertEquationDialog({
  activeEditor,
  onClose
}) {
  const onEquationConfirm = useCallback8(
    (equation, inline) => {
      activeEditor.dispatchCommand(INSERT_EQUATION_COMMAND, {
        equation,
        inline
      });
      onClose();
    },
    [activeEditor, onClose]
  );
  return /* @__PURE__ */ jsx25(KatexEquationAlterer, { onConfirm: onEquationConfirm });
}
function EquationsPlugin() {
  const [editor] = useLexicalComposerContext14();
  useEffect16(() => {
    if (!editor.hasNodes([EquationNode])) {
      throw new Error("EquationsPlugins: EquationsNode not registered on editor");
    }
    return editor.registerCommand(
      INSERT_EQUATION_COMMAND,
      (payload) => {
        const { equation, inline } = payload;
        const equationNode = $createEquationNode(equation, inline);
        $insertNodes2([equationNode]);
        if ($isRootOrShadowRoot2(equationNode.getParentOrThrow())) {
          $wrapNodeInElement2(equationNode, $createParagraphNode4).selectEnd();
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR5
    );
  }, [editor]);
  return null;
}

// src/plugins/ImagesPlugin/index.tsx
import { $isAutoLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext as useLexicalComposerContext18 } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent as $findMatchingParent2, $wrapNodeInElement as $wrapNodeInElement3, mergeRegister as mergeRegister6 } from "@lexical/utils";
import {
  $createParagraphNode as $createParagraphNode5,
  $createRangeSelection as $createRangeSelection2,
  $getSelection as $getSelection6,
  $insertNodes as $insertNodes3,
  $isNodeSelection as $isNodeSelection3,
  $isRootOrShadowRoot as $isRootOrShadowRoot3,
  $setSelection as $setSelection5,
  COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR7,
  COMMAND_PRIORITY_HIGH as COMMAND_PRIORITY_HIGH2,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW4,
  createCommand as createCommand8,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND as DRAGSTART_COMMAND2,
  DROP_COMMAND,
  getDOMSelectionFromTarget,
  isHTMLElement as isHTMLElement4
} from "lexical";
import { useEffect as useEffect20, useRef as useRef9, useState as useState16 } from "react";

// src/context/ImageUploadContext.tsx
import { createContext as createContext6, useContext as useContext6, useMemo as useMemo8 } from "react";
import { jsx as jsx26 } from "react/jsx-runtime";
var ImageUploadContext = createContext6({
  handler: null
});
function useImageUpload() {
  const context = useContext6(ImageUploadContext);
  return context.handler;
}
function ImageUploadProvider({ children, handler }) {
  const value = useMemo8(() => ({ handler }), [handler]);
  return /* @__PURE__ */ jsx26(ImageUploadContext.Provider, { value, children });
}

// src/plugins/ImagesPlugin/index.tsx
init_ImageNode2();

// src/ui/FileInput.tsx
import { useState as useState14 } from "react";
import { jsx as jsx33, jsxs as jsxs13 } from "react/jsx-runtime";
function generateId(label) {
  return `input-${label.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).substring(2, 11)}`;
}
function FileInput({ accept, label, onChange, "data-test-id": dataTestId }) {
  const [inputId] = useState14(generateId(label));
  return /* @__PURE__ */ jsxs13("div", { className: "Input__wrapper", children: [
    /* @__PURE__ */ jsx33("label", { className: "Input__label", htmlFor: inputId, children: label }),
    /* @__PURE__ */ jsx33(
      "input",
      {
        id: inputId,
        type: "file",
        accept,
        className: "Input__input",
        onChange: (e) => onChange(e.target.files),
        "data-test-id": dataTestId
      }
    )
  ] });
}

// src/ui/TextInput.tsx
import { useState as useState15 } from "react";
import { jsx as jsx34, jsxs as jsxs14 } from "react/jsx-runtime";
function generateId2(label) {
  return `input-${label.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).substring(2, 11)}`;
}
function TextInput({
  label,
  value,
  onChange,
  placeholder = "",
  "data-test-id": dataTestId,
  type = "text"
}) {
  const [inputId, _setInputId] = useState15(generateId2(label));
  return /* @__PURE__ */ jsxs14("div", { className: "Input__wrapper", children: [
    /* @__PURE__ */ jsx34("label", { className: "Input__label", htmlFor: inputId, children: label }),
    /* @__PURE__ */ jsx34(
      "input",
      {
        id: inputId,
        type,
        className: "Input__input",
        placeholder,
        value,
        onChange: (e) => {
          onChange(e.target.value);
        },
        "data-test-id": dataTestId
      }
    )
  ] });
}

// src/plugins/ImagesPlugin/index.tsx
import { Fragment as Fragment7, jsx as jsx35, jsxs as jsxs15 } from "react/jsx-runtime";
var INSERT_IMAGE_COMMAND = createCommand8("INSERT_IMAGE_COMMAND");
function InsertImageUriDialogBody({ onClick }) {
  const [src, setSrc] = useState16("");
  const [altText, setAltText] = useState16("");
  const isDisabled = src === "";
  return /* @__PURE__ */ jsxs15(Fragment7, { children: [
    /* @__PURE__ */ jsx35(
      TextInput,
      {
        label: "Image URL",
        placeholder: "i.e. https://source.unsplash.com/random",
        onChange: setSrc,
        value: src,
        "data-test-id": "image-modal-url-input"
      }
    ),
    /* @__PURE__ */ jsx35(
      TextInput,
      {
        label: "Alt Text",
        placeholder: "Random unsplash image",
        onChange: setAltText,
        value: altText,
        "data-test-id": "image-modal-alt-text-input"
      }
    ),
    /* @__PURE__ */ jsx35(DialogActions, { children: /* @__PURE__ */ jsx35(Button, { "data-test-id": "image-modal-confirm-btn", disabled: isDisabled, onClick: () => onClick({ altText, src }), children: "Confirm" }) })
  ] });
}
function InsertImageUploadedDialogBody({ onClick }) {
  const imageUploadHandler = useImageUpload();
  const [altText, setAltText] = useState16("");
  const [isUploading, setIsUploading] = useState16(false);
  const [uploadError, setUploadError] = useState16(null);
  const [selectedFile, setSelectedFile] = useState16(null);
  const [previewSrc, setPreviewSrc] = useState16("");
  const isDisabled = !selectedFile || isUploading;
  const canUpload = imageUploadHandler !== null;
  const handleFileSelect = (files) => {
    if (files?.[0]) {
      setSelectedFile(files[0]);
      setUploadError(null);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPreviewSrc(reader.result);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };
  const handleConfirm = async () => {
    if (!selectedFile) return;
    if (!canUpload) {
      if (previewSrc) {
        onClick({ altText, src: previewSrc });
      }
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await imageUploadHandler.uploadImage(selectedFile);
      onClick({
        altText,
        src: result.url,
        width: result.width,
        height: result.height
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u306B\u5931\u6557\u3057\u307E\u3057\u305F";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };
  return /* @__PURE__ */ jsxs15(Fragment7, { children: [
    /* @__PURE__ */ jsx35(
      FileInput,
      {
        label: "Image Upload",
        onChange: handleFileSelect,
        accept: "image/*",
        "data-test-id": "image-modal-file-upload"
      }
    ),
    /* @__PURE__ */ jsx35(
      TextInput,
      {
        label: "Alt Text",
        placeholder: "Descriptive alternative text",
        onChange: setAltText,
        value: altText,
        "data-test-id": "image-modal-alt-text-input"
      }
    ),
    uploadError && /* @__PURE__ */ jsx35("div", { className: "text-error text-sm mt-2", children: uploadError }),
    !canUpload && selectedFile && /* @__PURE__ */ jsx35("div", { className: "text-warning text-sm mt-2", children: "\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u30CF\u30F3\u30C9\u30E9\u30FC\u304C\u672A\u8A2D\u5B9A\u306E\u305F\u3081\u3001\u30ED\u30FC\u30AB\u30EB\u30D7\u30EC\u30D3\u30E5\u30FC\u30E2\u30FC\u30C9\u3067\u52D5\u4F5C\u3057\u307E\u3059" }),
    /* @__PURE__ */ jsx35(DialogActions, { children: /* @__PURE__ */ jsx35(Button, { "data-test-id": "image-modal-file-upload-btn", disabled: isDisabled, onClick: handleConfirm, children: isUploading ? "\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u4E2D..." : "Confirm" }) })
  ] });
}
function InsertImageDialog({
  activeEditor,
  onClose
}) {
  const [mode, setMode] = useState16(null);
  const hasModifier = useRef9(false);
  useEffect20(() => {
    hasModifier.current = false;
    const handler = (e) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, []);
  const onClick = (payload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
    onClose();
  };
  return /* @__PURE__ */ jsxs15(Fragment7, { children: [
    !mode && /* @__PURE__ */ jsxs15(DialogButtonsList, { children: [
      /* @__PURE__ */ jsx35(Button, { "data-test-id": "image-modal-option-url", onClick: () => setMode("url"), children: "URL" }),
      /* @__PURE__ */ jsx35(Button, { "data-test-id": "image-modal-option-file", onClick: () => setMode("file"), children: "File" })
    ] }),
    mode === "url" && /* @__PURE__ */ jsx35(InsertImageUriDialogBody, { onClick }),
    mode === "file" && /* @__PURE__ */ jsx35(InsertImageUploadedDialogBody, { onClick })
  ] });
}
function ImagesPlugin() {
  const [editor] = useLexicalComposerContext18();
  useEffect20(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor");
    }
    return mergeRegister6(
      editor.registerCommand(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          $insertNodes3([imageNode]);
          if ($isRootOrShadowRoot3(imageNode.getParentOrThrow())) {
            $wrapNodeInElement3(imageNode, $createParagraphNode5).selectEnd();
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR7
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND2,
        (event) => {
          return $onDragStart(event);
        },
        COMMAND_PRIORITY_HIGH2
      ),
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event);
        },
        COMMAND_PRIORITY_LOW4
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor);
        },
        COMMAND_PRIORITY_HIGH2
      )
    );
  }, [editor]);
  return null;
}
var TRANSPARENT_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
var img;
function getTransparentImage() {
  if (typeof window === "undefined") {
    throw new Error("Cannot create image on server side");
  }
  if (!img) {
    img = window.document.createElement("img");
    img.src = TRANSPARENT_IMAGE;
  }
  return img;
}
function $onDragStart(event) {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const dataTransfer = event.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  dataTransfer.setData("text/plain", "_");
  dataTransfer.setDragImage(getTransparentImage(), 0, 0);
  dataTransfer.setData(
    "application/x-lexical-drag",
    JSON.stringify({
      data: {
        altText: node.__altText,
        caption: node.__caption,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        showCaption: node.__showCaption,
        src: node.__src,
        width: node.__width
      },
      type: "image"
    })
  );
  return true;
}
function $onDragover(event) {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  if (!canDropImage(event)) {
    event.preventDefault();
  }
  return true;
}
function $onDrop(event, editor) {
  const node = $getImageNodeInSelection();
  if (!node) {
    return false;
  }
  const data = getDragImageData(event);
  if (!data) {
    return false;
  }
  const existingLink = $findMatchingParent2(
    node,
    (parent) => !$isAutoLinkNode(parent) && $isLinkNode(parent)
  );
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = $createRangeSelection2();
    if (range !== null && range !== void 0) {
      rangeSelection.applyDOMRange(range);
    }
    $setSelection5(rangeSelection);
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
    if (existingLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, existingLink.getURL());
    }
  }
  return true;
}
function $getImageNodeInSelection() {
  const selection = $getSelection6();
  if (!$isNodeSelection3(selection)) {
    return null;
  }
  const nodes = selection.getNodes();
  const node = nodes[0];
  return $isImageNode(node) ? node : null;
}
function getDragImageData(event) {
  const dragData = event.dataTransfer?.getData("application/x-lexical-drag");
  if (!dragData) {
    return null;
  }
  const { type, data } = JSON.parse(dragData);
  if (type !== "image") {
    return null;
  }
  return data;
}
function canDropImage(event) {
  const target = event.target;
  return !!(isHTMLElement4(target) && !target.closest("code, span.editor-image") && isHTMLElement4(target.parentElement) && target.parentElement.closest("div.ContentEditable__root"));
}
function getDragSelection(event) {
  let range;
  const domSelection = getDOMSelectionFromTarget(event.target);
  if (document.caretPositionFromPoint) {
    const caretPosition = document.caretPositionFromPoint(event.clientX, event.clientY);
    if (caretPosition) {
      range = document.createRange();
      range.setStart(caretPosition.offsetNode, caretPosition.offset);
      range.collapse(true);
    }
  } else if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY);
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
    range = domSelection.getRangeAt(0);
  } else {
    throw Error(`Cannot get the selection when dragging`);
  }
  return range;
}

// src/plugins/LayoutPlugin/InsertLayoutDialog.tsx
import { useState as useState18 } from "react";

// src/ui/DropDown.tsx
import { isDOMNode as isDOMNode2 } from "lexical";
import * as React4 from "react";
import { useCallback as useCallback11, useEffect as useEffect21, useMemo as useMemo11, useRef as useRef10, useState as useState17 } from "react";
import { createPortal as createPortal4 } from "react-dom";

// src/utils/focusUtils.ts
var findFirstFocusableDescendant = (startElement) => {
  const focusableSelector = "button, a[href], input, select, textarea, details, summary [tabindex], [contenteditable]";
  const focusableDescendants = startElement.querySelector(focusableSelector);
  return focusableDescendants;
};
var focusNearestDescendant = (startElement) => {
  const el = findFirstFocusableDescendant(startElement);
  el?.focus();
  return el;
};
var isKeyboardInput = (event) => {
  if ("pointerId" in event && "pointerType" in event) {
    return event.pointerId === -1 && event.pointerType === "";
  }
  return event?.detail === 0;
};

// src/ui/DropDown.tsx
import { Fragment as Fragment8, jsx as jsx36, jsxs as jsxs16 } from "react/jsx-runtime";
var DropDownContext = React4.createContext(null);
var dropDownPadding = 4;
function DropDownItem({
  children,
  className,
  onClick,
  title
}) {
  const ref = useRef10(null);
  const dropDownContext = React4.useContext(DropDownContext);
  if (dropDownContext === null) {
    throw new Error("DropDownItem must be used within a DropDown");
  }
  const { registerItem } = dropDownContext;
  useEffect21(() => {
    if (ref?.current) {
      registerItem(ref);
    }
  }, [registerItem]);
  return /* @__PURE__ */ jsx36("button", { className, onClick, ref, title, type: "button", children });
}
function DropDownItems({
  children,
  dropDownRef,
  onClose,
  autofocus
}) {
  const [items, setItems] = useState17();
  const [highlightedItem, setHighlightedItem] = useState17();
  const registerItem = useCallback11((itemRef) => {
    setItems((prev) => prev ? [...prev, itemRef] : [itemRef]);
  }, []);
  const handleKeyDown = (event) => {
    const key = event.key;
    if (key === "Escape") {
      onClose();
    }
    if (!items) {
      return;
    }
    if (["Escape", "ArrowUp", "ArrowDown", "Tab"].includes(key)) {
      event.preventDefault();
    }
    if (key === "Escape" || key === "Tab") {
      onClose();
    } else if (key === "ArrowUp") {
      setHighlightedItem((prev) => {
        if (!prev) {
          return items[0];
        }
        const index = items.indexOf(prev) - 1;
        return items[index === -1 ? items.length - 1 : index];
      });
    } else if (key === "ArrowDown") {
      setHighlightedItem((prev) => {
        if (!prev) {
          return items[0];
        }
        return items[items.indexOf(prev) + 1];
      });
    }
  };
  const contextValue = useMemo11(
    () => ({
      registerItem
    }),
    [registerItem]
  );
  useEffect21(() => {
    if (items && !highlightedItem) {
      setHighlightedItem(items[0]);
    }
    if (highlightedItem?.current) {
      highlightedItem.current.focus();
    }
  }, [items, highlightedItem]);
  useEffect21(() => {
    if (autofocus && dropDownRef.current) {
      focusNearestDescendant(dropDownRef.current);
    }
  }, [autofocus, dropDownRef]);
  return /* @__PURE__ */ jsx36(DropDownContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx36("div", { className: "notion-like-editor nle-dropdown", ref: dropDownRef, onKeyDown: handleKeyDown, children }) });
}
function DropDown({
  disabled = false,
  buttonLabel,
  buttonAriaLabel,
  buttonClassName,
  buttonIconClassName,
  children,
  stopCloseOnClickSelf
}) {
  const dropDownRef = useRef10(null);
  const buttonRef = useRef10(null);
  const [showDropDown, setShowDropDown] = useState17(false);
  const [shouldAutofocus, setShouldAutofocus] = useState17(false);
  const handleClose = () => {
    setShowDropDown(false);
    if (buttonRef?.current) {
      buttonRef.current.focus();
    }
  };
  useEffect21(() => {
    const button = buttonRef.current;
    const dropDown = dropDownRef.current;
    if (showDropDown && button !== null && dropDown !== null) {
      const { top, left } = button.getBoundingClientRect();
      dropDown.style.top = `${top + button.offsetHeight + dropDownPadding}px`;
      dropDown.style.left = `${Math.min(left, window.innerWidth - dropDown.offsetWidth - 20)}px`;
    }
  }, [showDropDown]);
  useEffect21(() => {
    const button = buttonRef.current;
    if (button !== null && showDropDown) {
      const handle = (event) => {
        const target = event.target;
        if (!isDOMNode2(target)) {
          return;
        }
        const targetIsDropDownItem = dropDownRef.current?.contains(target);
        if (stopCloseOnClickSelf && targetIsDropDownItem) {
          return;
        }
        if (!button.contains(target)) {
          setShowDropDown(false);
          if (targetIsDropDownItem && isKeyboardInput(event)) {
            button.focus();
          }
        }
      };
      document.addEventListener("click", handle);
      return () => {
        document.removeEventListener("click", handle);
      };
    }
  }, [showDropDown, stopCloseOnClickSelf]);
  useEffect21(() => {
    const handleButtonPositionUpdate = () => {
      if (showDropDown) {
        const button = buttonRef.current;
        const dropDown = dropDownRef.current;
        if (button !== null && dropDown !== null) {
          const { top } = button.getBoundingClientRect();
          const newPosition = top + button.offsetHeight + dropDownPadding;
          if (newPosition !== dropDown.getBoundingClientRect().top) {
            dropDown.style.top = `${newPosition}px`;
          }
        }
      }
    };
    document.addEventListener("scroll", handleButtonPositionUpdate);
    return () => {
      document.removeEventListener("scroll", handleButtonPositionUpdate);
    };
  }, [showDropDown]);
  const handleOnClick = (e) => {
    setShowDropDown(!showDropDown);
    setShouldAutofocus(isKeyboardInput(e));
  };
  return /* @__PURE__ */ jsxs16(Fragment8, { children: [
    /* @__PURE__ */ jsxs16(
      "button",
      {
        type: "button",
        disabled,
        "aria-label": buttonAriaLabel || buttonLabel,
        className: buttonClassName,
        onClick: handleOnClick,
        ref: buttonRef,
        children: [
          buttonIconClassName && /* @__PURE__ */ jsx36("span", { className: buttonIconClassName }),
          buttonLabel && /* @__PURE__ */ jsx36("span", { className: "text dropdown-button-text", children: buttonLabel }),
          /* @__PURE__ */ jsx36("i", { className: "chevron-down" })
        ]
      }
    ),
    showDropDown && createPortal4(
      /* @__PURE__ */ jsx36(DropDownItems, { dropDownRef, onClose: handleClose, autofocus: shouldAutofocus, children }),
      document.body
    )
  ] });
}

// src/plugins/LayoutPlugin/LayoutPlugin.tsx
import { useLexicalComposerContext as useLexicalComposerContext19 } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent as $findMatchingParent3, $insertNodeToNearestRoot as $insertNodeToNearestRoot5, mergeRegister as mergeRegister7 } from "@lexical/utils";
import {
  $createParagraphNode as $createParagraphNode6,
  $getNodeByKey as $getNodeByKey5,
  $getSelection as $getSelection7,
  $isRangeSelection as $isRangeSelection4,
  COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR8,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW5,
  createCommand as createCommand9,
  KEY_ARROW_DOWN_COMMAND as KEY_ARROW_DOWN_COMMAND2,
  KEY_ARROW_LEFT_COMMAND as KEY_ARROW_LEFT_COMMAND2,
  KEY_ARROW_RIGHT_COMMAND as KEY_ARROW_RIGHT_COMMAND3,
  KEY_ARROW_UP_COMMAND as KEY_ARROW_UP_COMMAND2
} from "lexical";
import { useEffect as useEffect22 } from "react";

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

// src/plugins/LayoutPlugin/LayoutPlugin.tsx
var INSERT_LAYOUT_COMMAND = createCommand9();
var UPDATE_LAYOUT_COMMAND = createCommand9();
function LayoutPlugin() {
  const [editor] = useLexicalComposerContext19();
  useEffect22(() => {
    if (!editor.hasNodes([LayoutContainerNode, LayoutItemNode])) {
      throw new Error("LayoutPlugin: LayoutContainerNode, or LayoutItemNode not registered on editor");
    }
    const $onEscape = (before) => {
      const selection = $getSelection7();
      if ($isRangeSelection4(selection) && selection.isCollapsed() && selection.anchor.offset === 0) {
        const container = $findMatchingParent3(selection.anchor.getNode(), $isLayoutContainerNode);
        if ($isLayoutContainerNode(container)) {
          const parent = container.getParent();
          const child = parent && (before ? parent.getFirstChild() : parent?.getLastChild());
          const descendant = before ? container.getFirstDescendant()?.getKey() : container.getLastDescendant()?.getKey();
          if (parent !== null && child === container && selection.anchor.key === descendant) {
            if (before) {
              container.insertBefore($createParagraphNode6());
            } else {
              container.insertAfter($createParagraphNode6());
            }
          }
        }
      }
      return false;
    };
    const $fillLayoutItemIfEmpty = (node) => {
      if (node.isEmpty()) {
        node.append($createParagraphNode6());
      }
    };
    const $removeIsolatedLayoutItem = (node) => {
      const parent = node.getParent();
      if (!$isLayoutContainerNode(parent)) {
        const children = node.getChildren();
        for (const child of children) {
          node.insertBefore(child);
        }
        node.remove();
        return true;
      }
      return false;
    };
    return mergeRegister7(
      // When layout is the last child pressing down/right arrow will insert paragraph
      // below it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if trailing paragraph is accidentally deleted
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND2, () => $onEscape(false), COMMAND_PRIORITY_LOW5),
      editor.registerCommand(KEY_ARROW_RIGHT_COMMAND3, () => $onEscape(false), COMMAND_PRIORITY_LOW5),
      // When layout is the first child pressing up/left arrow will insert paragraph
      // above it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if leading paragraph is accidentally deleted
      editor.registerCommand(KEY_ARROW_UP_COMMAND2, () => $onEscape(true), COMMAND_PRIORITY_LOW5),
      editor.registerCommand(KEY_ARROW_LEFT_COMMAND2, () => $onEscape(true), COMMAND_PRIORITY_LOW5),
      editor.registerCommand(
        INSERT_LAYOUT_COMMAND,
        (template) => {
          editor.update(() => {
            const container = $createLayoutContainerNode(template);
            const itemsCount = getItemsCountFromTemplate(template);
            for (let i = 0; i < itemsCount; i++) {
              container.append($createLayoutItemNode().append($createParagraphNode6()));
            }
            $insertNodeToNearestRoot5(container);
            container.selectStart();
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR8
      ),
      editor.registerCommand(
        UPDATE_LAYOUT_COMMAND,
        ({ template, nodeKey }) => {
          editor.update(() => {
            const container = $getNodeByKey5(nodeKey);
            if (!$isLayoutContainerNode(container)) {
              return;
            }
            const itemsCount = getItemsCountFromTemplate(template);
            const prevItemsCount = getItemsCountFromTemplate(container.getTemplateColumns());
            if (itemsCount > prevItemsCount) {
              for (let i = prevItemsCount; i < itemsCount; i++) {
                container.append($createLayoutItemNode().append($createParagraphNode6()));
              }
            } else if (itemsCount < prevItemsCount) {
              for (let i = prevItemsCount - 1; i >= itemsCount; i--) {
                const layoutItem = container.getChildAtIndex(i);
                if ($isLayoutItemNode(layoutItem)) {
                  layoutItem.remove();
                }
              }
            }
            container.setTemplateColumns(template);
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR8
      ),
      editor.registerNodeTransform(LayoutItemNode, (node) => {
        const isRemoved = $removeIsolatedLayoutItem(node);
        if (!isRemoved) {
          $fillLayoutItemIfEmpty(node);
        }
      }),
      editor.registerNodeTransform(LayoutContainerNode, (node) => {
        const children = node.getChildren();
        if (!children.every($isLayoutItemNode)) {
          for (const child of children) {
            node.insertBefore(child);
          }
          node.remove();
        }
      })
    );
  }, [editor]);
  return null;
}
function getItemsCountFromTemplate(template) {
  return template.trim().split(/\s+/).length;
}

// src/plugins/LayoutPlugin/InsertLayoutDialog.tsx
import { Fragment as Fragment9, jsx as jsx37, jsxs as jsxs17 } from "react/jsx-runtime";
var LAYOUTS = [
  { label: "2 columns (equal width)", value: "1fr 1fr" },
  { label: "2 columns (25% - 75%)", value: "1fr 3fr" },
  { label: "3 columns (equal width)", value: "1fr 1fr 1fr" },
  { label: "3 columns (25% - 50% - 25%)", value: "1fr 2fr 1fr" },
  { label: "4 columns (equal width)", value: "1fr 1fr 1fr 1fr" }
];
function InsertLayoutDialog({
  activeEditor,
  onClose
}) {
  const [layout, setLayout] = useState18(LAYOUTS[0].value);
  const buttonLabel = LAYOUTS.find((item) => item.value === layout)?.label;
  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_LAYOUT_COMMAND, layout);
    onClose();
  };
  return /* @__PURE__ */ jsxs17(Fragment9, { children: [
    /* @__PURE__ */ jsx37(DropDown, { buttonClassName: "toolbar-item dialog-dropdown", buttonLabel, children: LAYOUTS.map(({ label, value }) => /* @__PURE__ */ jsx37(DropDownItem, { className: "item", onClick: () => setLayout(value), children: /* @__PURE__ */ jsx37("span", { className: "text", children: label }) }, value)) }),
    /* @__PURE__ */ jsx37("div", { className: "flex justify-end mt-2", children: /* @__PURE__ */ jsx37(Button, { onClick, children: "Insert" }) })
  ] });
}

// src/plugins/PageBreakPlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext21 } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot as $insertNodeToNearestRoot6, mergeRegister as mergeRegister9 } from "@lexical/utils";
import { $getSelection as $getSelection8, $isRangeSelection as $isRangeSelection5, COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR9, createCommand as createCommand10 } from "lexical";
import { useEffect as useEffect24 } from "react";

// src/nodes/PageBreakNode/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext20 } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection as useLexicalNodeSelection3 } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister as mergeRegister8 } from "@lexical/utils";
import {
  CLICK_COMMAND as CLICK_COMMAND2,
  COMMAND_PRIORITY_HIGH as COMMAND_PRIORITY_HIGH3,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW6,
  DecoratorNode as DecoratorNode4
} from "lexical";
import { useEffect as useEffect23 } from "react";
import { jsx as jsx38 } from "react/jsx-runtime";
function PageBreakComponent({ nodeKey }) {
  const [editor] = useLexicalComposerContext20();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection3(nodeKey);
  useEffect23(() => {
    return mergeRegister8(
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
        COMMAND_PRIORITY_LOW6
      )
    );
  }, [clearSelection, editor, isSelected, nodeKey, setSelected]);
  useEffect23(() => {
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
          priority: COMMAND_PRIORITY_HIGH3
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
    return /* @__PURE__ */ jsx38(PageBreakComponent, { nodeKey: this.__key });
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

// src/plugins/PageBreakPlugin/index.tsx
var INSERT_PAGE_BREAK = createCommand10();
function PageBreakPlugin() {
  const [editor] = useLexicalComposerContext21();
  useEffect24(() => {
    if (!editor.hasNodes([PageBreakNode])) {
      throw new Error("PageBreakPlugin: PageBreakNode is not registered on editor");
    }
    return mergeRegister9(
      editor.registerCommand(
        INSERT_PAGE_BREAK,
        () => {
          const selection = $getSelection8();
          if (!$isRangeSelection5(selection)) {
            return false;
          }
          const focusNode = selection.focus.getNode();
          if (focusNode !== null) {
            const pgBreak = $createPageBreakNode();
            $insertNodeToNearestRoot6(pgBreak);
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR9
      )
    );
  }, [editor]);
  return null;
}

// src/plugins/TablePlugin.tsx
import { useLexicalComposerContext as useLexicalComposerContext22 } from "@lexical/react/LexicalComposerContext";
import { INSERT_TABLE_COMMAND, TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { createContext as createContext8, useContext as useContext8, useEffect as useEffect25, useMemo as useMemo12, useState as useState19 } from "react";
import { Fragment as Fragment10, jsx as jsx39, jsxs as jsxs18 } from "react/jsx-runtime";
var CellContext = createContext8({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {
  }
});
function TableContext({ children }) {
  const [contextValue, setContextValue] = useState19({
    cellEditorConfig: null,
    cellEditorPlugins: null
  });
  return /* @__PURE__ */ jsx39(
    CellContext.Provider,
    {
      value: useMemo12(
        () => ({
          cellEditorConfig: contextValue.cellEditorConfig,
          cellEditorPlugins: contextValue.cellEditorPlugins,
          set: (cellEditorConfig, cellEditorPlugins) => {
            setContextValue({ cellEditorConfig, cellEditorPlugins });
          }
        }),
        [contextValue.cellEditorConfig, contextValue.cellEditorPlugins]
      ),
      children
    }
  );
}
function InsertTableDialog({
  activeEditor,
  onClose
}) {
  const [rows, setRows] = useState19("5");
  const [columns, setColumns] = useState19("5");
  const [isDisabled, setIsDisabled] = useState19(true);
  useEffect25(() => {
    const row = Number(rows);
    const column = Number(columns);
    if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [rows, columns]);
  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns,
      rows
    });
    onClose();
  };
  return /* @__PURE__ */ jsxs18(Fragment10, { children: [
    /* @__PURE__ */ jsx39(
      TextInput,
      {
        placeholder: "# of rows (1-500)",
        label: "Rows",
        onChange: setRows,
        value: rows,
        "data-test-id": "table-modal-rows",
        type: "number"
      }
    ),
    /* @__PURE__ */ jsx39(
      TextInput,
      {
        placeholder: "# of columns (1-50)",
        label: "Columns",
        onChange: setColumns,
        value: columns,
        "data-test-id": "table-modal-columns",
        type: "number"
      }
    ),
    /* @__PURE__ */ jsx39(DialogActions, { "data-test-id": "table-model-confirm-insert", children: /* @__PURE__ */ jsx39(Button, { disabled: isDisabled, onClick, children: "Confirm" }) })
  ] });
}

// src/plugins/ComponentPickerPlugin/index.tsx
import { Fragment as Fragment11, jsx as jsx40, jsxs as jsxs19 } from "react/jsx-runtime";
var ComponentPickerOption = class extends MenuOption2 {
  // What shows up in the editor
  title;
  // Icon for display
  icon;
  // For extra searching.
  keywords;
  // TBD
  keyboardShortcut;
  // What happens when you select this option?
  onSelect;
  constructor(title, options) {
    super(title);
    this.title = title;
    this.keywords = options.keywords || [];
    this.icon = options.icon;
    this.keyboardShortcut = options.keyboardShortcut;
    this.onSelect = options.onSelect.bind(this);
  }
};
function ComponentPickerMenuItem({
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
  return /* @__PURE__ */ jsxs19(
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
        option.icon,
        /* @__PURE__ */ jsx40("span", { className: "text", children: option.title })
      ]
    },
    option.key
  );
}
function getDynamicOptions(editor, queryString) {
  const options = [];
  if (queryString == null) {
    return options;
  }
  const tableMatch = queryString.match(/^([1-9]\d?)(?:x([1-9]\d?)?)?$/);
  if (tableMatch !== null) {
    const rows = tableMatch[1];
    const colOptions = tableMatch[2] ? [tableMatch[2]] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(String);
    options.push(
      ...colOptions.map(
        (columns) => new ComponentPickerOption(`${rows}x${columns} Table`, {
          icon: /* @__PURE__ */ jsx40("i", { className: "icon table" }),
          keywords: ["table"],
          onSelect: () => editor.dispatchCommand(INSERT_TABLE_COMMAND2, { columns, rows })
        })
      )
    );
  }
  return options;
}
function getBaseOptions(editor, showModal) {
  return [
    new ComponentPickerOption("Paragraph", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon paragraph" }),
      keywords: ["normal", "paragraph", "p", "text"],
      onSelect: () => editor.update(() => {
        const selection = $getSelection9();
        if ($isRangeSelection6(selection)) {
          $setBlocksType(selection, () => $createParagraphNode7());
        }
      })
    }),
    ...[1, 2, 3].map(
      (n) => new ComponentPickerOption(`Heading ${n}`, {
        icon: /* @__PURE__ */ jsx40("i", { className: `icon h${n}` }),
        keywords: ["heading", "header", `h${n}`],
        onSelect: () => editor.update(() => {
          const selection = $getSelection9();
          if ($isRangeSelection6(selection)) {
            $setBlocksType(selection, () => $createHeadingNode(`h${n}`));
          }
        })
      })
    ),
    new ComponentPickerOption("Table", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon table" }),
      keywords: ["table", "grid", "spreadsheet", "rows", "columns"],
      onSelect: () => showModal("Insert Table", (onClose) => /* @__PURE__ */ jsx40(InsertTableDialog, { activeEditor: editor, onClose }))
    }),
    new ComponentPickerOption("Numbered List", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon number" }),
      keywords: ["numbered list", "ordered list", "ol"],
      onSelect: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, void 0)
    }),
    new ComponentPickerOption("Bulleted List", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon bullet" }),
      keywords: ["bulleted list", "unordered list", "ul"],
      onSelect: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, void 0)
    }),
    new ComponentPickerOption("Check List", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon check" }),
      keywords: ["check list", "todo list"],
      onSelect: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, void 0)
    }),
    new ComponentPickerOption("Quote", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon quote" }),
      keywords: ["block quote"],
      onSelect: () => editor.update(() => {
        const selection = $getSelection9();
        if ($isRangeSelection6(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      })
    }),
    new ComponentPickerOption("Code", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon code" }),
      keywords: ["javascript", "python", "js", "codeblock"],
      onSelect: () => editor.update(() => {
        const selection = $getSelection9();
        if ($isRangeSelection6(selection)) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection.insertRawText(textContent);
          }
        }
      })
    }),
    new ComponentPickerOption("Divider", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon horizontal-rule" }),
      keywords: ["horizontal rule", "divider", "hr"],
      onSelect: () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, void 0)
    }),
    new ComponentPickerOption("Page Break", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon page-break" }),
      keywords: ["page break", "divider"],
      onSelect: () => editor.dispatchCommand(INSERT_PAGE_BREAK, void 0)
    }),
    ...EmbedConfigs.map(
      (embedConfig) => new ComponentPickerOption(`Embed ${embedConfig.contentName}`, {
        icon: embedConfig.icon,
        keywords: [...embedConfig.keywords, "embed"],
        onSelect: () => editor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type)
      })
    ),
    new ComponentPickerOption("Date", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon calendar" }),
      keywords: ["date", "calendar", "time"],
      onSelect: () => {
        const dateTime = /* @__PURE__ */ new Date();
        dateTime.setHours(0, 0, 0, 0);
        editor.dispatchCommand(INSERT_DATETIME_COMMAND, { dateTime });
      }
    }),
    new ComponentPickerOption("Today", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon calendar" }),
      keywords: ["date", "calendar", "time", "today"],
      onSelect: () => {
        const dateTime = /* @__PURE__ */ new Date();
        dateTime.setHours(0, 0, 0, 0);
        editor.dispatchCommand(INSERT_DATETIME_COMMAND, { dateTime });
      }
    }),
    new ComponentPickerOption("Tomorrow", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon calendar" }),
      keywords: ["date", "calendar", "time", "tomorrow"],
      onSelect: () => {
        const dateTime = /* @__PURE__ */ new Date();
        dateTime.setDate(dateTime.getDate() + 1);
        dateTime.setHours(0, 0, 0, 0);
        editor.dispatchCommand(INSERT_DATETIME_COMMAND, { dateTime });
      }
    }),
    new ComponentPickerOption("Yesterday", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon calendar" }),
      keywords: ["date", "calendar", "time", "yesterday"],
      onSelect: () => {
        const dateTime = /* @__PURE__ */ new Date();
        dateTime.setDate(dateTime.getDate() - 1);
        dateTime.setHours(0, 0, 0, 0);
        editor.dispatchCommand(INSERT_DATETIME_COMMAND, { dateTime });
      }
    }),
    new ComponentPickerOption("Equation", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon equation" }),
      keywords: ["equation", "latex", "math"],
      onSelect: () => showModal("Insert Equation", (onClose) => /* @__PURE__ */ jsx40(InsertEquationDialog, { activeEditor: editor, onClose }))
    }),
    new ComponentPickerOption("Image", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon image" }),
      keywords: ["image", "photo", "picture", "file"],
      onSelect: () => showModal("Insert Image", (onClose) => /* @__PURE__ */ jsx40(InsertImageDialog, { activeEditor: editor, onClose }))
    }),
    new ComponentPickerOption("Collapsible", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon caret-right" }),
      keywords: ["collapse", "collapsible", "toggle"],
      onSelect: () => editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, void 0)
    }),
    new ComponentPickerOption("Columns Layout", {
      icon: /* @__PURE__ */ jsx40("i", { className: "icon columns" }),
      keywords: ["columns", "layout", "grid"],
      onSelect: () => showModal("Insert Columns Layout", (onClose) => /* @__PURE__ */ jsx40(InsertLayoutDialog, { activeEditor: editor, onClose }))
    }),
    ...["left", "center", "right", "justify"].map(
      (alignment) => new ComponentPickerOption(`Align ${alignment}`, {
        icon: /* @__PURE__ */ jsx40("i", { className: `icon ${alignment}-align` }),
        keywords: ["align", "justify", alignment],
        onSelect: () => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment)
      })
    )
  ];
}
function ComponentPickerMenuPlugin({
  extraOptions: propsExtraOptions
} = {}) {
  const [editor] = useLexicalComposerContext23();
  const [modal, showModal] = useModal();
  const [queryString, setQueryString] = useState20(null);
  const { extraOptions: contextExtraOptions } = useComponentPickerContext();
  const extraOptions = propsExtraOptions ?? contextExtraOptions;
  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch2("/", {
    allowWhitespace: true,
    minLength: 0
  });
  const options = useMemo13(() => {
    const baseOptions = getBaseOptions(editor, showModal);
    const extraOptionConfigs = extraOptions?.(editor) ?? [];
    const extraPickerOptions = extraOptionConfigs.map(
      (config) => new ComponentPickerOption(config.title, {
        icon: config.icon,
        keywords: config.keywords,
        keyboardShortcut: config.keyboardShortcut,
        onSelect: config.onSelect
      })
    );
    const allBaseOptions = [...baseOptions, ...extraPickerOptions];
    if (!queryString) {
      return allBaseOptions;
    }
    const regex = new RegExp(queryString, "i");
    return [
      ...getDynamicOptions(editor, queryString),
      ...allBaseOptions.filter(
        (option) => regex.test(option.title) || option.keywords.some((keyword) => regex.test(keyword))
      )
    ];
  }, [editor, queryString, showModal, extraOptions]);
  const onSelectOption = useCallback12(
    (selectedOption, nodeToRemove, closeMenu, matchingString) => {
      editor.update(() => {
        nodeToRemove?.remove();
        selectedOption.onSelect(matchingString);
        closeMenu();
      });
    },
    [editor]
  );
  return /* @__PURE__ */ jsxs19(Fragment11, { children: [
    modal,
    /* @__PURE__ */ jsx40(
      LexicalTypeaheadMenuPlugin2,
      {
        onQueryChange: setQueryString,
        onSelectOption,
        triggerFn: checkForTriggerMatch,
        options,
        menuRenderFn: (anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => anchorElementRef.current && options.length ? ReactDOM2.createPortal(
          /* @__PURE__ */ jsx40("div", { className: "notion-like-editor typeahead-popover component-picker-menu", children: /* @__PURE__ */ jsx40("ul", { children: options.map((option, i) => /* @__PURE__ */ jsx40(
            ComponentPickerMenuItem,
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
    )
  ] });
}

// src/plugins/ContextMenuPlugin/index.tsx
import { $isLinkNode as $isLinkNode2, TOGGLE_LINK_COMMAND as TOGGLE_LINK_COMMAND2 } from "@lexical/link";
import { useLexicalComposerContext as useLexicalComposerContext24 } from "@lexical/react/LexicalComposerContext";
import {
  NodeContextMenuOption,
  NodeContextMenuPlugin,
  NodeContextMenuSeparator
} from "@lexical/react/LexicalNodeContextMenuPlugin";
import {
  $getSelection as $getSelection10,
  $isDecoratorNode,
  $isNodeSelection as $isNodeSelection4,
  $isRangeSelection as $isRangeSelection7,
  COPY_COMMAND,
  CUT_COMMAND,
  PASTE_COMMAND
} from "lexical";
import { useMemo as useMemo14 } from "react";
import { jsx as jsx41 } from "react/jsx-runtime";
function ContextMenuPlugin() {
  const [editor] = useLexicalComposerContext24();
  const items = useMemo14(() => {
    return [
      new NodeContextMenuOption(`Remove Link`, {
        $onSelect: () => {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND2, null);
        },
        $showOn: (node) => $isLinkNode2(node.getParent()),
        disabled: false,
        icon: /* @__PURE__ */ jsx41("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon" })
      }),
      new NodeContextMenuSeparator({
        $showOn: (node) => $isLinkNode2(node.getParent())
      }),
      new NodeContextMenuOption(`Cut`, {
        $onSelect: () => {
          editor.dispatchCommand(CUT_COMMAND, null);
        },
        disabled: false,
        icon: /* @__PURE__ */ jsx41("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon page-break" })
      }),
      new NodeContextMenuOption(`Copy`, {
        $onSelect: () => {
          editor.dispatchCommand(COPY_COMMAND, null);
        },
        disabled: false,
        icon: /* @__PURE__ */ jsx41("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon copy" })
      }),
      new NodeContextMenuOption(`Paste`, {
        $onSelect: () => {
          navigator.clipboard.read().then(async (..._args) => {
            const data = new DataTransfer();
            const readClipboardItems = await navigator.clipboard.read();
            const item = readClipboardItems[0];
            const permission = await navigator.permissions.query({
              // @ts-expect-error These types are incorrect.
              name: "clipboard-read"
            });
            if (permission.state === "denied") {
              alert("Not allowed to paste from clipboard.");
              return;
            }
            for (const type of item.types) {
              const dataString = await (await item.getType(type)).text();
              data.setData(type, dataString);
            }
            const event = new ClipboardEvent("paste", {
              clipboardData: data
            });
            editor.dispatchCommand(PASTE_COMMAND, event);
          });
        },
        disabled: false,
        icon: /* @__PURE__ */ jsx41("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon paste" })
      }),
      new NodeContextMenuOption(`Paste as Plain Text`, {
        $onSelect: () => {
          navigator.clipboard.read().then(async (..._args) => {
            const permission = await navigator.permissions.query({
              // @ts-expect-error These types are incorrect.
              name: "clipboard-read"
            });
            if (permission.state === "denied") {
              alert("Not allowed to paste from clipboard.");
              return;
            }
            const data = new DataTransfer();
            const clipboardText = await navigator.clipboard.readText();
            data.setData("text/plain", clipboardText);
            const event = new ClipboardEvent("paste", {
              clipboardData: data
            });
            editor.dispatchCommand(PASTE_COMMAND, event);
          });
        },
        disabled: false,
        icon: /* @__PURE__ */ jsx41("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon" })
      }),
      new NodeContextMenuSeparator(),
      new NodeContextMenuOption(`Delete Node`, {
        $onSelect: () => {
          const selection = $getSelection10();
          if ($isRangeSelection7(selection)) {
            const currentNode = selection.anchor.getNode();
            const ancestorNodeWithRootAsParent = currentNode.getParents().at(-2);
            ancestorNodeWithRootAsParent?.remove();
          } else if ($isNodeSelection4(selection)) {
            const selectedNodes = selection.getNodes();
            selectedNodes.forEach((node) => {
              if ($isDecoratorNode(node)) {
                node.remove();
              }
            });
          }
        },
        disabled: false,
        icon: /* @__PURE__ */ jsx41("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon clear" })
      })
    ];
  }, [editor]);
  return /* @__PURE__ */ jsx41(
    NodeContextMenuPlugin,
    {
      className: "NotionLikeEditorTheme__contextMenu",
      itemClassName: "NotionLikeEditorTheme__contextMenuItem",
      separatorClassName: "NotionLikeEditorTheme__contextMenuSeparator",
      items
    }
  );
}

// src/plugins/DragDropPastePlugin/index.ts
import { useLexicalComposerContext as useLexicalComposerContext25 } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW7 } from "lexical";
import { useEffect as useEffect26 } from "react";
var ACCEPTABLE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
function DragDropPaste() {
  const [editor] = useLexicalComposerContext25();
  const imageUploadHandler = useImageUpload();
  useEffect26(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(files, [ACCEPTABLE_IMAGE_TYPES].flat());
          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              if (imageUploadHandler) {
                try {
                  const uploadResult = await imageUploadHandler.uploadImage(file);
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: uploadResult.url,
                    width: uploadResult.width,
                    height: uploadResult.height
                  });
                } catch (error) {
                  console.error("Image upload failed:", error);
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: result
                  });
                }
              } else {
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                  altText: file.name,
                  src: result
                });
              }
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW7
    );
  }, [editor, imageUploadHandler]);
  return null;
}

// src/plugins/DraggableBlockPlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext26 } from "@lexical/react/LexicalComposerContext";
import { eventFiles } from "@lexical/rich-text";
import { calculateZoomLevel as calculateZoomLevel2, isHTMLElement as isHTMLElement5, mergeRegister as mergeRegister10 } from "@lexical/utils";
import {
  $createParagraphNode as $createParagraphNode8,
  $getNearestNodeFromDOMNode as $getNearestNodeFromDOMNode4,
  $getNodeByKey as $getNodeByKey6,
  $getRoot as $getRoot3,
  COMMAND_PRIORITY_HIGH as COMMAND_PRIORITY_HIGH4,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW8,
  DRAGOVER_COMMAND as DRAGOVER_COMMAND2,
  DROP_COMMAND as DROP_COMMAND2
} from "lexical";
import { useCallback as useCallback13, useEffect as useEffect27, useRef as useRef11, useState as useState21 } from "react";
import { createPortal as createPortal6 } from "react-dom";

// src/plugins/DraggableBlockPlugin/point.ts
var Point = class {
  _x;
  _y;
  constructor(x, y2) {
    this._x = x;
    this._y = y2;
  }
  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  equals({ x, y: y2 }) {
    return this.x === x && this.y === y2;
  }
  calcDeltaXTo({ x }) {
    return this.x - x;
  }
  calcDeltaYTo({ y: y2 }) {
    return this.y - y2;
  }
  calcHorizontalDistanceTo(point) {
    return Math.abs(this.calcDeltaXTo(point));
  }
  calcVerticalDistance(point) {
    return Math.abs(this.calcDeltaYTo(point));
  }
  calcDistanceTo(point) {
    return Math.sqrt(this.calcDeltaXTo(point) ** 2 + this.calcDeltaYTo(point) ** 2);
  }
};
function isPoint(x) {
  return x instanceof Point;
}

// src/plugins/DraggableBlockPlugin/rect.ts
var Rectangle = class _Rectangle {
  _left;
  _top;
  _right;
  _bottom;
  constructor(left, top, right, bottom) {
    const [physicTop, physicBottom] = top <= bottom ? [top, bottom] : [bottom, top];
    const [physicLeft, physicRight] = left <= right ? [left, right] : [right, left];
    this._top = physicTop;
    this._right = physicRight;
    this._left = physicLeft;
    this._bottom = physicBottom;
  }
  get top() {
    return this._top;
  }
  get right() {
    return this._right;
  }
  get bottom() {
    return this._bottom;
  }
  get left() {
    return this._left;
  }
  get width() {
    return Math.abs(this._left - this._right);
  }
  get height() {
    return Math.abs(this._bottom - this._top);
  }
  equals({ top, left, bottom, right }) {
    return top === this._top && bottom === this._bottom && left === this._left && right === this._right;
  }
  contains(target) {
    if (isPoint(target)) {
      const { x, y: y2 } = target;
      const isOnTopSide = y2 < this._top;
      const isOnBottomSide = y2 > this._bottom;
      const isOnLeftSide = x < this._left;
      const isOnRightSide = x > this._right;
      const result = !isOnTopSide && !isOnBottomSide && !isOnLeftSide && !isOnRightSide;
      return {
        reason: {
          isOnBottomSide,
          isOnLeftSide,
          isOnRightSide,
          isOnTopSide
        },
        result
      };
    } else {
      const { top, left, bottom, right } = target;
      return top >= this._top && top <= this._bottom && bottom >= this._top && bottom <= this._bottom && left >= this._left && left <= this._right && right >= this._left && right <= this._right;
    }
  }
  intersectsWith(rect) {
    const { left: x1, top: y1, width: w1, height: h1 } = rect;
    const { left: x2, top: y2, width: w2, height: h2 } = this;
    const maxX = x1 + w1 >= x2 + w2 ? x1 + w1 : x2 + w2;
    const maxY = y1 + h1 >= y2 + h2 ? y1 + h1 : y2 + h2;
    const minX = x1 <= x2 ? x1 : x2;
    const minY = y1 <= y2 ? y1 : y2;
    return maxX - minX <= w1 + w2 && maxY - minY <= h1 + h2;
  }
  generateNewRect({ left = this.left, top = this.top, right = this.right, bottom = this.bottom }) {
    return new _Rectangle(left, top, right, bottom);
  }
  static fromLTRB(left, top, right, bottom) {
    return new _Rectangle(left, top, right, bottom);
  }
  static fromLWTH(left, width, top, height) {
    return new _Rectangle(left, top, left + width, top + height);
  }
  static fromPoints(startPoint, endPoint) {
    const { y: top, x: left } = startPoint;
    const { y: bottom, x: right } = endPoint;
    return _Rectangle.fromLTRB(left, top, right, bottom);
  }
  static fromDOM(dom) {
    const { top, width, left, height } = dom.getBoundingClientRect();
    return _Rectangle.fromLWTH(left, width, top, height);
  }
};

// src/plugins/DraggableBlockPlugin/index.tsx
import { Fragment as Fragment12, jsx as jsx42, jsxs as jsxs20 } from "react/jsx-runtime";
var SPACE = 4;
var TARGET_LINE_HALF_HEIGHT = 2;
var DRAG_DATA_FORMAT = "application/x-lexical-drag-block";
var TEXT_BOX_HORIZONTAL_PADDING = 28;
var Downward = 1;
var Upward = -1;
var Indeterminate = 0;
var prevIndex = Infinity;
function getCurrentIndex(keysLength) {
  if (keysLength === 0) {
    return Infinity;
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex;
  }
  return Math.floor(keysLength / 2);
}
function getTopLevelNodeKeys(editor) {
  return editor.getEditorState().read(() => $getRoot3().getChildrenKeys());
}
function getCollapsedMargins(elem) {
  const getMargin = (element, margin) => element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;
  const { marginTop, marginBottom } = window.getComputedStyle(elem);
  const prevElemSiblingMarginBottom = getMargin(elem.previousElementSibling, "marginBottom");
  const nextElemSiblingMarginTop = getMargin(elem.nextElementSibling, "marginTop");
  const collapsedTopMargin = Math.max(parseFloat(marginTop), prevElemSiblingMarginBottom);
  const collapsedBottomMargin = Math.max(parseFloat(marginBottom), nextElemSiblingMarginTop);
  return { marginBottom: collapsedBottomMargin, marginTop: collapsedTopMargin };
}
function getBlockElement(anchorElem, editor, event, useEdgeAsDefault = false) {
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const topLevelNodeKeys = getTopLevelNodeKeys(editor);
  let blockElem = null;
  editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const [firstNode, lastNode] = [
        editor.getElementByKey(topLevelNodeKeys[0]),
        editor.getElementByKey(topLevelNodeKeys[topLevelNodeKeys.length - 1])
      ];
      const [firstNodeRect, lastNodeRect] = [
        firstNode != null ? firstNode.getBoundingClientRect() : void 0,
        lastNode != null ? lastNode.getBoundingClientRect() : void 0
      ];
      if (firstNodeRect && lastNodeRect) {
        const firstNodeZoom = calculateZoomLevel2(firstNode);
        const lastNodeZoom = calculateZoomLevel2(lastNode);
        if (event.y / firstNodeZoom < firstNodeRect.top) {
          blockElem = firstNode;
        } else if (event.y / lastNodeZoom > lastNodeRect.bottom) {
          blockElem = lastNode;
        }
        if (blockElem) {
          return;
        }
      }
    }
    let index = getCurrentIndex(topLevelNodeKeys.length);
    let direction = Indeterminate;
    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index];
      const elem = editor.getElementByKey(key);
      if (elem === null) {
        break;
      }
      const zoom = calculateZoomLevel2(elem);
      const point = new Point(event.x / zoom, event.y / zoom);
      const domRect = Rectangle.fromDOM(elem);
      const { marginTop, marginBottom } = getCollapsedMargins(elem);
      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + marginBottom,
        left: anchorElementRect.left,
        right: anchorElementRect.right,
        top: domRect.top - marginTop
      });
      const {
        result,
        reason: { isOnTopSide, isOnBottomSide }
      } = rect.contains(point);
      if (result) {
        blockElem = elem;
        prevIndex = index;
        break;
      }
      if (direction === Indeterminate) {
        if (isOnTopSide) {
          direction = Upward;
        } else if (isOnBottomSide) {
          direction = Downward;
        } else {
          direction = Infinity;
        }
      }
      index += direction;
    }
  });
  return blockElem;
}
function setMenuPosition(targetElem, floatingElem, anchorElem) {
  if (!targetElem) {
    floatingElem.style.opacity = "0";
    floatingElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }
  const targetRect = targetElem.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(targetElem);
  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  let targetCalculateHeight = parseInt(targetStyle.lineHeight, 10);
  if (Number.isNaN(targetCalculateHeight)) {
    targetCalculateHeight = targetRect.bottom - targetRect.top;
  }
  const top = targetRect.top + (targetCalculateHeight - floatingElemRect.height) / 2 - anchorElementRect.top + anchorElem.scrollTop;
  const left = SPACE;
  floatingElem.style.opacity = "1";
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}
function setDragImage(dataTransfer, draggableBlockElem) {
  const { transform } = draggableBlockElem.style;
  draggableBlockElem.style.transform = "translateZ(0)";
  dataTransfer.setDragImage(draggableBlockElem, 0, 0);
  setTimeout(() => {
    draggableBlockElem.style.transform = transform;
  });
}
function setTargetLine(targetLineElem, targetBlockElem, mouseY, anchorElem) {
  const { top: targetBlockElemTop, height: targetBlockElemHeight } = targetBlockElem.getBoundingClientRect();
  const { top: anchorTop, width: anchorWidth } = anchorElem.getBoundingClientRect();
  const { marginTop, marginBottom } = getCollapsedMargins(targetBlockElem);
  let lineTop = targetBlockElemTop;
  if (mouseY >= targetBlockElemTop) {
    lineTop += targetBlockElemHeight + marginBottom / 2;
  } else {
    lineTop -= marginTop / 2;
  }
  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT + anchorElem.scrollTop;
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE;
  targetLineElem.style.transform = `translate(${left}px, ${top}px)`;
  targetLineElem.style.width = `${anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2}px`;
  targetLineElem.style.opacity = ".4";
}
function hideTargetLine(targetLineElem) {
  if (targetLineElem) {
    targetLineElem.style.opacity = "0";
    targetLineElem.style.transform = "translate(-10000px, -10000px)";
  }
}
function useDraggableBlockMenu(editor, anchorElem, menuRef, targetLineRef, isEditable, menuComponent, targetLineComponent, isOnMenu2, onElementChanged) {
  const scrollerElem = anchorElem.parentElement;
  const isDraggingBlockRef = useRef11(false);
  const [draggableBlockElem, setDraggableBlockElemState] = useState21(null);
  const setDraggableBlockElem = useCallback13(
    (elem) => {
      setDraggableBlockElemState(elem);
      if (onElementChanged) {
        onElementChanged(elem);
      }
    },
    [onElementChanged]
  );
  useEffect27(() => {
    function onMouseMove(event) {
      const target = event.target;
      if (!isHTMLElement5(target)) {
        setDraggableBlockElem(null);
        return;
      }
      if (isOnMenu2(target)) {
        return;
      }
      const _draggableBlockElem = getBlockElement(anchorElem, editor, event);
      setDraggableBlockElem(_draggableBlockElem);
    }
    function onMouseLeave() {
      setDraggableBlockElem(null);
    }
    if (scrollerElem != null) {
      scrollerElem.addEventListener("mousemove", onMouseMove);
      scrollerElem.addEventListener("mouseleave", onMouseLeave);
    }
    return () => {
      if (scrollerElem != null) {
        scrollerElem.removeEventListener("mousemove", onMouseMove);
        scrollerElem.removeEventListener("mouseleave", onMouseLeave);
      }
    };
  }, [scrollerElem, anchorElem, editor, isOnMenu2, setDraggableBlockElem]);
  useEffect27(() => {
    if (menuRef.current) {
      setMenuPosition(draggableBlockElem, menuRef.current, anchorElem);
    }
  }, [anchorElem, draggableBlockElem, menuRef]);
  useEffect27(() => {
    function onDragover(event) {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        return false;
      }
      const { pageY, target } = event;
      if (!isHTMLElement5(target)) {
        return false;
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      const targetLineElem = targetLineRef.current;
      if (targetBlockElem === null || targetLineElem === null) {
        return false;
      }
      setTargetLine(targetLineElem, targetBlockElem, pageY / calculateZoomLevel2(target), anchorElem);
      event.preventDefault();
      return true;
    }
    function $onDrop2(event) {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        return false;
      }
      const { target, dataTransfer, pageY } = event;
      const dragData = dataTransfer != null ? dataTransfer.getData(DRAG_DATA_FORMAT) : "";
      const draggedNode = $getNodeByKey6(dragData);
      if (!draggedNode) {
        return false;
      }
      if (!isHTMLElement5(target)) {
        return false;
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      if (!targetBlockElem) {
        return false;
      }
      const targetNode = $getNearestNodeFromDOMNode4(targetBlockElem);
      if (!targetNode) {
        return false;
      }
      if (targetNode === draggedNode) {
        return true;
      }
      const targetBlockElemTop = targetBlockElem.getBoundingClientRect().top;
      if (pageY / calculateZoomLevel2(target) >= targetBlockElemTop) {
        targetNode.insertAfter(draggedNode);
      } else {
        targetNode.insertBefore(draggedNode);
      }
      setDraggableBlockElem(null);
      return true;
    }
    return mergeRegister10(
      editor.registerCommand(
        DRAGOVER_COMMAND2,
        (event) => {
          return onDragover(event);
        },
        COMMAND_PRIORITY_LOW8
      ),
      editor.registerCommand(
        DROP_COMMAND2,
        (event) => {
          return $onDrop2(event);
        },
        COMMAND_PRIORITY_HIGH4
      )
    );
  }, [anchorElem, editor, targetLineRef, setDraggableBlockElem]);
  function onDragStart(event) {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer || !draggableBlockElem) {
      return;
    }
    let nodeKey = "";
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode4(draggableBlockElem);
      nodeKey = node?.getKey() ?? "";
    });
    if (!nodeKey) {
      return;
    }
    isDraggingBlockRef.current = true;
    dataTransfer.effectAllowed = "move";
    dataTransfer.dropEffect = "move";
    dataTransfer.setData("text/plain", nodeKey);
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
    setDragImage(dataTransfer, draggableBlockElem);
  }
  function onDragEnd() {
    console.log("onDragEnd");
    isDraggingBlockRef.current = false;
    hideTargetLine(targetLineRef.current);
  }
  return createPortal6(
    /* @__PURE__ */ jsxs20(Fragment12, { children: [
      /* @__PURE__ */ jsx42("div", { draggable: true, onDragStart, onDragEnd, children: isEditable && menuComponent }),
      targetLineComponent
    ] }),
    anchorElem
  );
}
function DraggableBlockPlugin_EXPERIMENTAL({
  anchorElem = document.body,
  menuRef,
  targetLineRef,
  menuComponent,
  targetLineComponent,
  isOnMenu: isOnMenu2,
  onElementChanged
}) {
  const [editor] = useLexicalComposerContext26();
  return useDraggableBlockMenu(
    editor,
    anchorElem,
    menuRef,
    targetLineRef,
    editor._editable,
    menuComponent,
    targetLineComponent,
    isOnMenu2,
    onElementChanged
  );
}
var DRAGGABLE_BLOCK_MENU_CLASSNAME = "draggable-block-menu";
function isOnMenu(element) {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}
function DraggableBlockPlugin({
  anchorElem = document.body
}) {
  const [editor] = useLexicalComposerContext26();
  const menuRef = useRef11(null);
  const targetLineRef = useRef11(null);
  const [draggableElement, setDraggableElement] = useState21(null);
  function insertBlock(e) {
    if (!draggableElement || !editor) {
      return;
    }
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode4(draggableElement);
      if (!node) {
        return;
      }
      const pNode = $createParagraphNode8();
      if (e.altKey || e.ctrlKey) {
        node.insertBefore(pNode);
      } else {
        node.insertAfter(pNode);
      }
      pNode.select();
    });
  }
  return /* @__PURE__ */ jsx42(
    DraggableBlockPlugin_EXPERIMENTAL,
    {
      anchorElem,
      menuRef,
      targetLineRef,
      menuComponent: /* @__PURE__ */ jsxs20("div", { ref: menuRef, className: "icon draggable-block-menu", children: [
        /* @__PURE__ */ jsx42("button", { type: "button", title: "Click to add below", className: "icon icon-plus", onClick: insertBlock }),
        /* @__PURE__ */ jsx42("div", { className: "icon" })
      ] }),
      targetLineComponent: /* @__PURE__ */ jsx42("div", { ref: targetLineRef, className: "draggable-block-target-line" }),
      isOnMenu,
      onElementChanged: setDraggableElement
    }
  );
}

// src/plugins/EmojiPickerPlugin/index.tsx
init_EmojiNode();
import { useLexicalComposerContext as useLexicalComposerContext27 } from "@lexical/react/LexicalComposerContext";
import { TextNode as TextNode7 } from "lexical";
import { useEffect as useEffect28 } from "react";
var emojis2 = /* @__PURE__ */ new Map([
  [":)", ["emoji happysmile", "\u{1F642}"]],
  [":D", ["emoji veryhappysmile", "\u{1F600}"]],
  [":(", ["emoji unhappysmile", "\u{1F641}"]],
  ["<3", ["emoji heart", "\u2764"]]
]);
function $findAndTransformEmoji2(node) {
  const text = node.getTextContent();
  for (let i = 0; i < text.length; i++) {
    const emojiData = emojis2.get(text[i]) || emojis2.get(text.slice(i, i + 2));
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
function $textNodeTransform2(node) {
  let targetNode = node;
  while (targetNode !== null) {
    if (!targetNode.isSimpleText()) {
      return;
    }
    targetNode = $findAndTransformEmoji2(targetNode);
  }
}
function useEmojis2(editor) {
  useEffect28(() => {
    if (!editor.hasNodes([EmojiNode])) {
      throw new Error("EmojisPlugin: EmojiNode not registered on editor");
    }
    return editor.registerNodeTransform(TextNode7, $textNodeTransform2);
  }, [editor]);
}
function EmojisPlugin2() {
  const [editor] = useLexicalComposerContext27();
  useEmojis2(editor);
  return null;
}

// src/core/Editor.tsx
init_EmojisPlugin();

// src/plugins/FloatingLinkEditorPlugin/index.tsx
import { $createLinkNode, $isAutoLinkNode as $isAutoLinkNode2, $isLinkNode as $isLinkNode3, TOGGLE_LINK_COMMAND as TOGGLE_LINK_COMMAND3 } from "@lexical/link";
import { useLexicalComposerContext as useLexicalComposerContext28 } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent as $findMatchingParent4, mergeRegister as mergeRegister11 } from "@lexical/utils";
import {
  $getSelection as $getSelection11,
  $isLineBreakNode,
  $isNodeSelection as $isNodeSelection5,
  $isRangeSelection as $isRangeSelection8,
  CLICK_COMMAND as CLICK_COMMAND3,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH as COMMAND_PRIORITY_HIGH5,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW9,
  getDOMSelection,
  KEY_ESCAPE_COMMAND as KEY_ESCAPE_COMMAND3,
  SELECTION_CHANGE_COMMAND as SELECTION_CHANGE_COMMAND3
} from "lexical";
import { useCallback as useCallback14, useEffect as useEffect29, useRef as useRef12, useState as useState22 } from "react";
import { createPortal as createPortal7 } from "react-dom";

// src/utils/getSelectedNode.ts
import { $isAtNodeEnd as $isAtNodeEnd2 } from "@lexical/selection";
function getSelectedNode(selection) {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd2(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd2(anchor) ? anchorNode : focusNode;
  }
}

// src/utils/setFloatingElemPositionForLinkEditor.ts
var VERTICAL_GAP = 10;
var HORIZONTAL_OFFSET = 5;
function setFloatingElemPositionForLinkEditor(targetRect, floatingElem, anchorElem, verticalGap = VERTICAL_GAP, horizontalOffset = HORIZONTAL_OFFSET) {
  const scrollerElem = anchorElem.parentElement;
  if (targetRect === null || !scrollerElem) {
    floatingElem.style.opacity = "0";
    floatingElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }
  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const editorScrollerRect = scrollerElem.getBoundingClientRect();
  let top = targetRect.top - verticalGap;
  let left = targetRect.left - horizontalOffset;
  if (top < editorScrollerRect.top) {
    top += floatingElemRect.height + targetRect.height + verticalGap * 2;
  }
  if (left + floatingElemRect.width > editorScrollerRect.right) {
    left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset;
  }
  top -= anchorElementRect.top;
  left -= anchorElementRect.left;
  floatingElem.style.opacity = "1";
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

// src/plugins/FloatingLinkEditorPlugin/index.tsx
init_url();
import { Fragment as Fragment13, jsx as jsx43, jsxs as jsxs21 } from "react/jsx-runtime";
function preventDefault(event) {
  event.preventDefault();
}
function FloatingLinkEditor({
  editor,
  isLink,
  setIsLink,
  anchorElem,
  isLinkEditMode,
  setIsLinkEditMode
}) {
  const editorRef = useRef12(null);
  const inputRef = useRef12(null);
  const [linkUrl, setLinkUrl] = useState22("");
  const [editedLinkUrl, setEditedLinkUrl] = useState22("https://");
  const [lastSelection, setLastSelection] = useState22(null);
  const $updateLinkEditor = useCallback14(() => {
    const selection = $getSelection11();
    if ($isRangeSelection8(selection)) {
      const node = getSelectedNode(selection);
      const linkParent = $findMatchingParent4(node, $isLinkNode3);
      if (linkParent) {
        setLinkUrl(linkParent.getURL());
      } else if ($isLinkNode3(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
      if (isLinkEditMode) {
        setEditedLinkUrl(linkUrl);
      }
    } else if ($isNodeSelection5(selection)) {
      const nodes = selection.getNodes();
      if (nodes.length > 0) {
        const node = nodes[0];
        const parent = node.getParent();
        if ($isLinkNode3(parent)) {
          setLinkUrl(parent.getURL());
        } else if ($isLinkNode3(node)) {
          setLinkUrl(node.getURL());
        } else {
          setLinkUrl("");
        }
        if (isLinkEditMode) {
          setEditedLinkUrl(linkUrl);
        }
      }
    }
    const editorElem = editorRef.current;
    const nativeSelection = getDOMSelection(editor._window);
    const activeElement = document.activeElement;
    if (editorElem === null) {
      return;
    }
    const rootElement = editor.getRootElement();
    if (selection !== null && rootElement !== null && editor.isEditable()) {
      let domRect;
      if ($isNodeSelection5(selection)) {
        const nodes = selection.getNodes();
        if (nodes.length > 0) {
          const element = editor.getElementByKey(nodes[0].getKey());
          if (element) {
            domRect = element.getBoundingClientRect();
          }
        }
      } else if (nativeSelection !== null && rootElement.contains(nativeSelection.anchorNode)) {
        domRect = nativeSelection.focusNode?.parentElement?.getBoundingClientRect();
      }
      if (domRect) {
        domRect.y += 40;
        setFloatingElemPositionForLinkEditor(domRect, editorElem, anchorElem);
      }
      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== "link-input") {
      if (rootElement !== null) {
        setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem);
      }
      setLastSelection(null);
      setIsLinkEditMode(false);
      setLinkUrl("");
    }
    return true;
  }, [anchorElem, editor, setIsLinkEditMode, isLinkEditMode, linkUrl]);
  useEffect29(() => {
    const scrollerElem = anchorElem.parentElement;
    const update = () => {
      editor.getEditorState().read(() => {
        $updateLinkEditor();
      });
    };
    window.addEventListener("resize", update);
    if (scrollerElem) {
      scrollerElem.addEventListener("scroll", update);
    }
    return () => {
      window.removeEventListener("resize", update);
      if (scrollerElem) {
        scrollerElem.removeEventListener("scroll", update);
      }
    };
  }, [anchorElem.parentElement, editor, $updateLinkEditor]);
  useEffect29(() => {
    return mergeRegister11(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateLinkEditor();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND3,
        () => {
          $updateLinkEditor();
          return true;
        },
        COMMAND_PRIORITY_LOW9
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND3,
        () => {
          if (isLink) {
            setIsLink(false);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH5
      )
    );
  }, [editor, $updateLinkEditor, setIsLink, isLink]);
  useEffect29(() => {
    editor.getEditorState().read(() => {
      $updateLinkEditor();
    });
  }, [editor, $updateLinkEditor]);
  useEffect29(() => {
    if (isLinkEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLinkEditMode]);
  useEffect29(() => {
    const editorElement = editorRef.current;
    if (editorElement === null) {
      return;
    }
    const handleBlur = (event) => {
      if (!editorElement.contains(event.relatedTarget) && isLink) {
        setIsLink(false);
        setIsLinkEditMode(false);
      }
    };
    editorElement.addEventListener("focusout", handleBlur);
    return () => {
      editorElement.removeEventListener("focusout", handleBlur);
    };
  }, [setIsLink, setIsLinkEditMode, isLink]);
  const monitorInputInteraction = (event) => {
    if (event.key === "Enter") {
      handleLinkSubmission(event);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsLinkEditMode(false);
    }
  };
  const handleLinkSubmission = (event) => {
    event.preventDefault();
    if (lastSelection !== null) {
      if (linkUrl !== "") {
        editor.update(() => {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND3, sanitizeUrl(editedLinkUrl));
          const selection = $getSelection11();
          if ($isRangeSelection8(selection)) {
            const parent = getSelectedNode(selection).getParent();
            if ($isAutoLinkNode2(parent)) {
              const linkNode = $createLinkNode(parent.getURL(), {
                rel: parent.__rel,
                target: parent.__target,
                title: parent.__title
              });
              parent.replace(linkNode, true);
            }
          }
        });
      }
      setEditedLinkUrl("https://");
      setIsLinkEditMode(false);
    }
  };
  return /* @__PURE__ */ jsx43("div", { ref: editorRef, className: "notion-like-editor link-editor", children: !isLink ? null : isLinkEditMode ? /* @__PURE__ */ jsxs21(Fragment13, { children: [
    /* @__PURE__ */ jsx43(
      "input",
      {
        ref: inputRef,
        className: "link-input",
        value: editedLinkUrl,
        onChange: (event) => {
          setEditedLinkUrl(event.target.value);
        },
        onKeyDown: (event) => {
          monitorInputInteraction(event);
        }
      }
    ),
    /* @__PURE__ */ jsxs21("div", { children: [
      /* @__PURE__ */ jsx43(
        "button",
        {
          type: "button",
          className: "link-cancel",
          tabIndex: 0,
          onMouseDown: preventDefault,
          onClick: () => {
            setIsLinkEditMode(false);
          }
        }
      ),
      /* @__PURE__ */ jsx43(
        "button",
        {
          type: "button",
          className: "link-confirm",
          tabIndex: 0,
          onMouseDown: preventDefault,
          onClick: handleLinkSubmission
        }
      )
    ] })
  ] }) : /* @__PURE__ */ jsxs21("div", { className: "link-view", children: [
    /* @__PURE__ */ jsx43("a", { href: sanitizeUrl(linkUrl), target: "_blank", rel: "noopener noreferrer", children: linkUrl }),
    /* @__PURE__ */ jsx43(
      "button",
      {
        type: "button",
        className: "link-edit",
        tabIndex: 0,
        onMouseDown: preventDefault,
        onClick: (event) => {
          event.preventDefault();
          setEditedLinkUrl(linkUrl);
          setIsLinkEditMode(true);
        }
      }
    ),
    /* @__PURE__ */ jsx43(
      "button",
      {
        type: "button",
        className: "link-trash",
        tabIndex: 0,
        onMouseDown: preventDefault,
        onClick: () => {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND3, null);
        }
      }
    )
  ] }) });
}
function useFloatingLinkEditorToolbar(editor, anchorElem, isLinkEditMode, setIsLinkEditMode) {
  const [activeEditor, setActiveEditor] = useState22(editor);
  const [isLink, setIsLink] = useState22(false);
  useEffect29(() => {
    function $updateToolbar() {
      const selection = $getSelection11();
      if ($isRangeSelection8(selection)) {
        const focusNode = getSelectedNode(selection);
        const focusLinkNode = $findMatchingParent4(focusNode, $isLinkNode3);
        const focusAutoLinkNode = $findMatchingParent4(focusNode, $isAutoLinkNode2);
        if (!(focusLinkNode || focusAutoLinkNode)) {
          setIsLink(false);
          return;
        }
        const badNode = selection.getNodes().filter((node) => !$isLineBreakNode(node)).find((node) => {
          const linkNode = $findMatchingParent4(node, $isLinkNode3);
          const autoLinkNode = $findMatchingParent4(node, $isAutoLinkNode2);
          return focusLinkNode && !focusLinkNode.is(linkNode) || linkNode && !linkNode.is(focusLinkNode) || focusAutoLinkNode && !focusAutoLinkNode.is(autoLinkNode) || autoLinkNode && (!autoLinkNode.is(focusAutoLinkNode) || autoLinkNode.getIsUnlinked());
        });
        if (!badNode) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }
      } else if ($isNodeSelection5(selection)) {
        const nodes = selection.getNodes();
        if (nodes.length === 0) {
          setIsLink(false);
          return;
        }
        const node = nodes[0];
        const parent = node.getParent();
        if ($isLinkNode3(parent) || $isLinkNode3(node)) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }
      }
    }
    return mergeRegister11(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND3,
        (_payload, newEditor) => {
          $updateToolbar();
          setActiveEditor(newEditor);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CLICK_COMMAND3,
        (payload) => {
          const selection = $getSelection11();
          if ($isRangeSelection8(selection)) {
            const node = getSelectedNode(selection);
            const linkNode = $findMatchingParent4(node, $isLinkNode3);
            if ($isLinkNode3(linkNode) && (payload.metaKey || payload.ctrlKey)) {
              window.open(linkNode.getURL(), "_blank");
              return true;
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW9
      )
    );
  }, [editor]);
  return createPortal7(
    /* @__PURE__ */ jsx43(
      FloatingLinkEditor,
      {
        editor: activeEditor,
        isLink,
        anchorElem,
        setIsLink,
        isLinkEditMode,
        setIsLinkEditMode
      }
    ),
    anchorElem
  );
}
function FloatingLinkEditorPlugin({
  anchorElem = document.body,
  isLinkEditMode,
  setIsLinkEditMode
}) {
  const [editor] = useLexicalComposerContext28();
  return useFloatingLinkEditorToolbar(editor, anchorElem, isLinkEditMode, setIsLinkEditMode);
}

// src/plugins/FloatingTextFormatToolbarPlugin/index.tsx
import { $isCodeHighlightNode } from "@lexical/code";
import { $isLinkNode as $isLinkNode4, TOGGLE_LINK_COMMAND as TOGGLE_LINK_COMMAND4 } from "@lexical/link";
import { useLexicalComposerContext as useLexicalComposerContext29 } from "@lexical/react/LexicalComposerContext";
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
import { mergeRegister as mergeRegister12 } from "@lexical/utils";
import {
  $getSelection as $getSelection12,
  $isParagraphNode as $isParagraphNode3,
  $isRangeSelection as $isRangeSelection9,
  $isTextNode as $isTextNode2,
  COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW10,
  FORMAT_TEXT_COMMAND,
  getDOMSelection as getDOMSelection2,
  SELECTION_CHANGE_COMMAND as SELECTION_CHANGE_COMMAND4
} from "lexical";
import { useCallback as useCallback15, useEffect as useEffect30, useRef as useRef14, useState as useState24 } from "react";
import { createPortal as createPortal8 } from "react-dom";

// src/ui/ColorPicker.tsx
import { calculateZoomLevel as calculateZoomLevel3 } from "@lexical/utils";
import { useMemo as useMemo15, useRef as useRef13, useState as useState23 } from "react";
import { jsx as jsx44, jsxs as jsxs22 } from "react/jsx-runtime";
var skipAddingToHistoryStack = false;
function parseAllowedColor(input) {
  return /^rgb\(\d+, \d+, \d+\)$/.test(input) ? input : "";
}
var basicColors = [
  "#d0021b",
  "#f5a623",
  "#f8e71c",
  "#8b572a",
  "#7ed321",
  "#417505",
  "#bd10e0",
  "#9013fe",
  "#4a90e2",
  "#50e3c2",
  "#b8e986",
  "#000000",
  "#4a4a4a",
  "#9b9b9b",
  "#ffffff"
];
var WIDTH = 214;
var HEIGHT = 150;
function ColorPicker({ color, onChange }) {
  const [selfColor, setSelfColor] = useState23(transformColor("hex", color));
  const [inputColor, setInputColor] = useState23(transformColor("hex", color).hex);
  const innerDivRef = useRef13(null);
  const saturationPosition = useMemo15(
    () => ({
      x: selfColor.hsv.s / 100 * WIDTH,
      y: (100 - selfColor.hsv.v) / 100 * HEIGHT
    }),
    [selfColor.hsv.s, selfColor.hsv.v]
  );
  const huePosition = useMemo15(
    () => ({
      x: selfColor.hsv.h / 360 * WIDTH
    }),
    [selfColor.hsv]
  );
  const emitOnChange = (newColor, skipRefocus = false) => {
    if (innerDivRef.current !== null && onChange) {
      onChange(newColor, skipAddingToHistoryStack, skipRefocus);
    }
  };
  const onSetHex = (hex) => {
    setInputColor(hex);
    if (/^#[0-9A-Fa-f]{6}$/i.test(hex)) {
      const newColor = transformColor("hex", hex);
      setSelfColor(newColor);
      emitOnChange(newColor.hex);
    }
  };
  const onMoveSaturation = ({ x, y: y2 }) => {
    const newHsv = {
      ...selfColor.hsv,
      s: x / WIDTH * 100,
      v: 100 - y2 / HEIGHT * 100
    };
    const newColor = transformColor("hsv", newHsv);
    setSelfColor(newColor);
    setInputColor(newColor.hex);
    emitOnChange(newColor.hex);
  };
  const onMoveHue = ({ x }) => {
    const newHsv = { ...selfColor.hsv, h: x / WIDTH * 360 };
    const newColor = transformColor("hsv", newHsv);
    setSelfColor(newColor);
    setInputColor(newColor.hex);
    emitOnChange(newColor.hex);
  };
  const onBasicColorClick = (e, basicColor) => {
    const newColor = transformColor("hex", basicColor);
    setSelfColor(newColor);
    setInputColor(newColor.hex);
    emitOnChange(newColor.hex, isKeyboardInput(e));
  };
  return /* @__PURE__ */ jsxs22("div", { className: "color-picker-wrapper", style: { width: WIDTH }, ref: innerDivRef, children: [
    /* @__PURE__ */ jsx44(TextInput, { label: "Hex", onChange: onSetHex, value: inputColor }),
    /* @__PURE__ */ jsx44("div", { className: "color-picker-basic-color", children: basicColors.map((basicColor) => /* @__PURE__ */ jsx44(
      "button",
      {
        type: "button",
        className: basicColor === selfColor.hex ? " active" : "",
        style: { backgroundColor: basicColor },
        onClick: (e) => onBasicColorClick(e, basicColor)
      },
      basicColor
    )) }),
    /* @__PURE__ */ jsx44(
      MoveWrapper,
      {
        className: "color-picker-saturation",
        style: { backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)` },
        onChange: onMoveSaturation,
        children: /* @__PURE__ */ jsx44(
          "div",
          {
            className: "color-picker-saturation_cursor",
            style: {
              backgroundColor: selfColor.hex,
              left: saturationPosition.x,
              top: saturationPosition.y
            }
          }
        )
      }
    ),
    /* @__PURE__ */ jsx44(MoveWrapper, { className: "color-picker-hue", onChange: onMoveHue, children: /* @__PURE__ */ jsx44(
      "div",
      {
        className: "color-picker-hue_cursor",
        style: {
          backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)`,
          left: huePosition.x
        }
      }
    ) }),
    /* @__PURE__ */ jsx44("div", { className: "color-picker-color", style: { backgroundColor: selfColor.hex } })
  ] });
}
function MoveWrapper({ className, style, onChange, children }) {
  const divRef = useRef13(null);
  const draggedRef = useRef13(false);
  const move = (e) => {
    if (divRef.current) {
      const { current: div } = divRef;
      const { width, height, left, top } = div.getBoundingClientRect();
      const zoom = calculateZoomLevel3(div);
      const x = clamp2(e.clientX / zoom - left, width, 0);
      const y2 = clamp2(e.clientY / zoom - top, height, 0);
      onChange({ x, y: y2 });
    }
  };
  const onMouseDown = (e) => {
    if (e.button !== 0) {
      return;
    }
    move(e);
    const onMouseMove = (_e) => {
      draggedRef.current = true;
      skipAddingToHistoryStack = true;
      move(_e);
    };
    const onMouseUp = (_e) => {
      if (draggedRef.current) {
        skipAddingToHistoryStack = false;
      }
      document.removeEventListener("mousemove", onMouseMove, false);
      document.removeEventListener("mouseup", onMouseUp, false);
      move(_e);
      draggedRef.current = false;
    };
    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("mouseup", onMouseUp, false);
  };
  return /* @__PURE__ */ jsx44("div", { ref: divRef, className, style, onMouseDown, children });
}
function clamp2(value, max, min) {
  return value > max ? max : value < min ? min : value;
}
function toHex(value) {
  if (!value.startsWith("#")) {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) {
      throw new Error("2d context not supported or canvas already initialized");
    }
    ctx.fillStyle = value;
    return ctx.fillStyle;
  } else if (value.length === 4 || value.length === 5) {
    value = value.split("").map((v, i) => i ? v + v : "#").join("");
    return value;
  } else if (value.length === 7 || value.length === 9) {
    return value;
  }
  return "#000000";
}
function hex2rgb(hex) {
  const rbgArr = (hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`).substring(1).match(/.{2}/g) || []).map((x) => parseInt(x, 16));
  return {
    b: rbgArr[2],
    g: rbgArr[1],
    r: rbgArr[0]
  };
}
function rgb2hsv({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const d2 = max - Math.min(r, g, b);
  const h2 = d2 ? (max === r ? (g - b) / d2 + (g < b ? 6 : 0) : max === g ? 2 + (b - r) / d2 : 4 + (r - g) / d2) * 60 : 0;
  const s = max ? d2 / max * 100 : 0;
  const v = max * 100;
  return { h: h2, s, v };
}
function hsv2rgb({ h: h2, s, v }) {
  s /= 100;
  v /= 100;
  const i = ~~(h2 / 60);
  const f2 = h2 / 60 - i;
  const p2 = v * (1 - s);
  const q = v * (1 - s * f2);
  const t = v * (1 - s * (1 - f2));
  const index = i % 6;
  const r = Math.round([v, q, p2, p2, t, v][index] * 255);
  const g = Math.round([t, v, v, q, p2, p2][index] * 255);
  const b = Math.round([p2, p2, t, v, v, q][index] * 255);
  return { b, g, r };
}
function rgb2hex({ b, g, r }) {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
function transformColor(format, color) {
  let hex = toHex("#121212");
  let rgb = hex2rgb(hex);
  let hsv = rgb2hsv(rgb);
  if (format === "hex") {
    const value = color;
    hex = toHex(value);
    rgb = hex2rgb(hex);
    hsv = rgb2hsv(rgb);
  } else if (format === "rgb") {
    const value = color;
    rgb = value;
    hex = rgb2hex(rgb);
    hsv = rgb2hsv(rgb);
  } else if (format === "hsv") {
    const value = color;
    hsv = value;
    rgb = hsv2rgb(hsv);
    hex = rgb2hex(rgb);
  }
  return { hex, hsv, rgb };
}

// src/ui/DropdownColorPicker.tsx
import { jsx as jsx45 } from "react/jsx-runtime";
function DropdownColorPicker({
  disabled = false,
  stopCloseOnClickSelf = true,
  color,
  onChange,
  ...rest
}) {
  return /* @__PURE__ */ jsx45(DropDown, { ...rest, disabled, stopCloseOnClickSelf, children: /* @__PURE__ */ jsx45(ColorPicker, { color, onChange }) });
}

// src/utils/getDOMRangeRect.ts
function getDOMRangeRect(nativeSelection, rootElement) {
  const domRange = nativeSelection.getRangeAt(0);
  let rect;
  if (nativeSelection.anchorNode === rootElement) {
    let inner = rootElement;
    while (inner.firstElementChild != null) {
      inner = inner.firstElementChild;
    }
    rect = inner.getBoundingClientRect();
  } else {
    rect = domRange.getBoundingClientRect();
  }
  return rect;
}

// src/utils/setFloatingElemPosition.ts
var VERTICAL_GAP2 = 10;
var HORIZONTAL_OFFSET2 = 5;
function setFloatingElemPosition(targetRect, floatingElem, anchorElem, isLink = false, verticalGap = VERTICAL_GAP2, horizontalOffset = HORIZONTAL_OFFSET2) {
  const scrollerElem = anchorElem.parentElement;
  if (targetRect === null || !scrollerElem) {
    floatingElem.style.opacity = "0";
    floatingElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }
  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const editorScrollerRect = scrollerElem.getBoundingClientRect();
  let top = targetRect.top - floatingElemRect.height - verticalGap;
  let left = targetRect.left - horizontalOffset;
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType === Node.ELEMENT_NODE || textNode.parentElement) {
      const textElement = textNode.nodeType === Node.ELEMENT_NODE ? textNode : textNode.parentElement;
      const textAlign = window.getComputedStyle(textElement).textAlign;
      if (textAlign === "right" || textAlign === "end") {
        left = targetRect.right - floatingElemRect.width + horizontalOffset;
      }
    }
  }
  if (top < editorScrollerRect.top) {
    top += floatingElemRect.height + targetRect.height + verticalGap * (isLink ? 9 : 2);
  }
  if (left + floatingElemRect.width > editorScrollerRect.right) {
    left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset;
  }
  if (left < editorScrollerRect.left) {
    left = editorScrollerRect.left + horizontalOffset;
  }
  top -= anchorElementRect.top;
  left -= anchorElementRect.left;
  floatingElem.style.opacity = "1";
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

// src/plugins/FloatingTextFormatToolbarPlugin/index.tsx
import { Fragment as Fragment14, jsx as jsx46, jsxs as jsxs23 } from "react/jsx-runtime";
function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  isLink,
  isBold,
  isItalic,
  isUnderline,
  isUppercase: isUppercase2,
  isLowercase: isLowercase2,
  isCapitalize: isCapitalize2,
  isCode,
  isStrikethrough,
  isSubscript: isSubscript2,
  isSuperscript: isSuperscript2,
  fontColor,
  bgColor,
  setIsLinkEditMode
}) {
  const popupCharStylesEditorRef = useRef14(null);
  const insertLink = useCallback15(() => {
    if (!isLink) {
      setIsLinkEditMode(true);
      editor.dispatchCommand(TOGGLE_LINK_COMMAND4, "https://");
    } else {
      setIsLinkEditMode(false);
      editor.dispatchCommand(TOGGLE_LINK_COMMAND4, null);
    }
  }, [editor, isLink, setIsLinkEditMode]);
  const applyStyleText = useCallback15(
    (styles) => {
      editor.update(() => {
        const selection = $getSelection12();
        if (selection !== null) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [editor]
  );
  const onFontColorSelect = useCallback15(
    (value) => {
      applyStyleText({ color: value });
    },
    [applyStyleText]
  );
  const onBgColorSelect = useCallback15(
    (value) => {
      applyStyleText({ "background-color": value });
    },
    [applyStyleText]
  );
  function mouseMoveListener(e) {
    if (popupCharStylesEditorRef?.current && (e.buttons === 1 || e.buttons === 3)) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== "none") {
        const x = e.clientX;
        const y2 = e.clientY;
        const elementUnderMouse = document.elementFromPoint(x, y2);
        if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
          popupCharStylesEditorRef.current.style.pointerEvents = "none";
        }
      }
    }
  }
  function mouseUpListener(_e) {
    if (popupCharStylesEditorRef?.current) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== "auto") {
        popupCharStylesEditorRef.current.style.pointerEvents = "auto";
      }
    }
  }
  useEffect30(() => {
    if (popupCharStylesEditorRef?.current) {
      document.addEventListener("mousemove", mouseMoveListener);
      document.addEventListener("mouseup", mouseUpListener);
      return () => {
        document.removeEventListener("mousemove", mouseMoveListener);
        document.removeEventListener("mouseup", mouseUpListener);
      };
    }
  }, [mouseMoveListener, mouseUpListener]);
  const $updateTextFormatFloatingToolbar = useCallback15(() => {
    const selection = $getSelection12();
    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    const nativeSelection = getDOMSelection2(editor._window);
    if (popupCharStylesEditorElem === null) {
      return;
    }
    const rootElement = editor.getRootElement();
    if (selection !== null && nativeSelection !== null && !nativeSelection.isCollapsed && rootElement !== null && rootElement.contains(nativeSelection.anchorNode)) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement);
      setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem, isLink);
    }
  }, [editor, anchorElem, isLink]);
  useEffect30(() => {
    const scrollerElem = anchorElem.parentElement;
    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar();
      });
    };
    window.addEventListener("resize", update);
    if (scrollerElem) {
      scrollerElem.addEventListener("scroll", update);
    }
    return () => {
      window.removeEventListener("resize", update);
      if (scrollerElem) {
        scrollerElem.removeEventListener("scroll", update);
      }
    };
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem]);
  useEffect30(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar();
    });
    return mergeRegister12(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND4,
        () => {
          $updateTextFormatFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW10
      )
    );
  }, [editor, $updateTextFormatFloatingToolbar]);
  return /* @__PURE__ */ jsx46("div", { ref: popupCharStylesEditorRef, className: "notion-like-editor floating-text-format-popup", children: editor.isEditable() && /* @__PURE__ */ jsxs23(Fragment14, { children: [
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        },
        className: `popup-item spaced ${isBold ? "active" : ""}`,
        title: "Bold",
        "aria-label": "Format text as bold",
        children: /* @__PURE__ */ jsx46("i", { className: "format bold" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        },
        className: `popup-item spaced ${isItalic ? "active" : ""}`,
        title: "Italic",
        "aria-label": "Format text as italics",
        children: /* @__PURE__ */ jsx46("i", { className: "format italic" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        },
        className: `popup-item spaced ${isUnderline ? "active" : ""}`,
        title: "Underline",
        "aria-label": "Format text to underlined",
        children: /* @__PURE__ */ jsx46("i", { className: "format underline" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        },
        className: `popup-item spaced ${isStrikethrough ? "active" : ""}`,
        title: "Strikethrough",
        "aria-label": "Format text with a strikethrough",
        children: /* @__PURE__ */ jsx46("i", { className: "format strikethrough" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
        },
        className: `popup-item spaced ${isSubscript2 ? "active" : ""}`,
        title: "Subscript",
        "aria-label": "Format Subscript",
        children: /* @__PURE__ */ jsx46("i", { className: "format subscript" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
        },
        className: `popup-item spaced ${isSuperscript2 ? "active" : ""}`,
        title: "Superscript",
        "aria-label": "Format Superscript",
        children: /* @__PURE__ */ jsx46("i", { className: "format superscript" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "uppercase");
        },
        className: `popup-item spaced ${isUppercase2 ? "active" : ""}`,
        title: "Uppercase",
        "aria-label": "Format text to uppercase",
        children: /* @__PURE__ */ jsx46("i", { className: "format uppercase" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "lowercase");
        },
        className: `popup-item spaced ${isLowercase2 ? "active" : ""}`,
        title: "Lowercase",
        "aria-label": "Format text to lowercase",
        children: /* @__PURE__ */ jsx46("i", { className: "format lowercase" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "capitalize");
        },
        className: `popup-item spaced ${isCapitalize2 ? "active" : ""}`,
        title: "Capitalize",
        "aria-label": "Format text to capitalize",
        children: /* @__PURE__ */ jsx46("i", { className: "format capitalize" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
        },
        className: `popup-item spaced ${isCode ? "active" : ""}`,
        title: "Insert code block",
        "aria-label": "Insert code block",
        children: /* @__PURE__ */ jsx46("i", { className: "format code" })
      }
    ),
    /* @__PURE__ */ jsx46(
      "button",
      {
        type: "button",
        onClick: insertLink,
        className: `popup-item spaced ${isLink ? "active" : ""}`,
        title: "Insert link",
        "aria-label": "Insert link",
        children: /* @__PURE__ */ jsx46("i", { className: "format link" })
      }
    ),
    /* @__PURE__ */ jsx46(
      DropdownColorPicker,
      {
        disabled: false,
        buttonClassName: "popup-item color-picker",
        buttonAriaLabel: "Formatting text color",
        buttonIconClassName: "icon font-color",
        color: fontColor,
        onChange: onFontColorSelect,
        title: "text color"
      }
    ),
    /* @__PURE__ */ jsx46(
      DropdownColorPicker,
      {
        disabled: false,
        buttonClassName: "popup-item color-picker",
        buttonAriaLabel: "Formatting background color",
        buttonIconClassName: "icon bg-color",
        color: bgColor,
        onChange: onBgColorSelect,
        title: "bg color"
      }
    )
  ] }) });
}
function useFloatingTextFormatToolbar(editor, anchorElem, setIsLinkEditMode) {
  const [isText, setIsText] = useState24(false);
  const [isLink, setIsLink] = useState24(false);
  const [isBold, setIsBold] = useState24(false);
  const [isItalic, setIsItalic] = useState24(false);
  const [isUnderline, setIsUnderline] = useState24(false);
  const [isUppercase2, setIsUppercase] = useState24(false);
  const [isLowercase2, setIsLowercase] = useState24(false);
  const [isCapitalize2, setIsCapitalize] = useState24(false);
  const [isStrikethrough, setIsStrikethrough] = useState24(false);
  const [isSubscript2, setIsSubscript] = useState24(false);
  const [isSuperscript2, setIsSuperscript] = useState24(false);
  const [isCode, setIsCode] = useState24(false);
  const [fontColor, setFontColor] = useState24("#000");
  const [bgColor, setBgColor] = useState24("#fff");
  const updatePopup = useCallback15(() => {
    editor.getEditorState().read(() => {
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection12();
      const nativeSelection = getDOMSelection2(editor._window);
      const rootElement = editor.getRootElement();
      if (nativeSelection !== null && (!$isRangeSelection9(selection) || rootElement === null || !rootElement.contains(nativeSelection.anchorNode))) {
        setIsText(false);
        return;
      }
      if (!$isRangeSelection9(selection)) {
        return;
      }
      const node = getSelectedNode(selection);
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsUppercase(selection.hasFormat("uppercase"));
      setIsLowercase(selection.hasFormat("lowercase"));
      setIsCapitalize(selection.hasFormat("capitalize"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));
      setIsCode(selection.hasFormat("code"));
      const parent = node.getParent();
      if ($isLinkNode4(parent) || $isLinkNode4(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
      setFontColor($getSelectionStyleValueForProperty(selection, "color", "#000"));
      setBgColor($getSelectionStyleValueForProperty(selection, "background-color", "#fff"));
      if (!$isCodeHighlightNode(selection.anchor.getNode()) && selection.getTextContent() !== "") {
        setIsText($isTextNode2(node) || $isParagraphNode3(node));
      } else {
        setIsText(false);
      }
      const rawTextContent = selection.getTextContent().replace(/\n/g, "");
      if (!selection.isCollapsed() && rawTextContent === "") {
        setIsText(false);
        return;
      }
    });
  }, [editor]);
  useEffect30(() => {
    document.addEventListener("selectionchange", updatePopup);
    return () => {
      document.removeEventListener("selectionchange", updatePopup);
    };
  }, [updatePopup]);
  useEffect30(() => {
    return mergeRegister12(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      })
    );
  }, [editor, updatePopup]);
  if (!isText) {
    return null;
  }
  return createPortal8(
    /* @__PURE__ */ jsx46(
      TextFormatFloatingToolbar,
      {
        editor,
        anchorElem,
        isLink,
        isBold,
        isItalic,
        isUppercase: isUppercase2,
        isLowercase: isLowercase2,
        isCapitalize: isCapitalize2,
        isStrikethrough,
        isSubscript: isSubscript2,
        isSuperscript: isSuperscript2,
        isUnderline,
        isCode,
        fontColor,
        bgColor,
        setIsLinkEditMode
      }
    ),
    anchorElem
  );
}
function FloatingTextFormatToolbarPlugin({
  anchorElem = document.body,
  setIsLinkEditMode
}) {
  const [editor] = useLexicalComposerContext29();
  return useFloatingTextFormatToolbar(editor, anchorElem, setIsLinkEditMode);
}

// src/plugins/HorizontalRulePlugin/index.tsx
import { $createHorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND as INSERT_HORIZONTAL_RULE_COMMAND2 } from "@lexical/extension";
import { useLexicalComposerContext as useLexicalComposerContext30 } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot as $insertNodeToNearestRoot7 } from "@lexical/utils";
import { $getSelection as $getSelection13, $isRangeSelection as $isRangeSelection10, COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR10 } from "lexical";
import { useEffect as useEffect31 } from "react";
function HorizontalRulePlugin() {
  const [editor] = useLexicalComposerContext30();
  useEffect31(() => {
    return editor.registerCommand(
      INSERT_HORIZONTAL_RULE_COMMAND2,
      (_type) => {
        const selection = $getSelection13();
        if (!$isRangeSelection10(selection)) {
          return false;
        }
        const focusNode = selection.focus.getNode();
        if (focusNode !== null) {
          const horizontalRuleNode = $createHorizontalRuleNode();
          $insertNodeToNearestRoot7(horizontalRuleNode);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR10
    );
  }, [editor]);
  return null;
}

// src/core/Editor.tsx
init_LinkPlugin();

// src/plugins/MarkdownPastePlugin/index.tsx
import { $convertFromMarkdownString as $convertFromMarkdownString2 } from "@lexical/markdown";
import { useLexicalComposerContext as useLexicalComposerContext31 } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode as $createParagraphNode9,
  $getSelection as $getSelection14,
  $isRangeSelection as $isRangeSelection11,
  COMMAND_PRIORITY_HIGH as COMMAND_PRIORITY_HIGH6,
  PASTE_COMMAND as PASTE_COMMAND2
} from "lexical";
import { useCallback as useCallback16, useEffect as useEffect32 } from "react";

// src/plugins/MarkdownTransformers/index.ts
init_EquationNode();
init_ImageNode2();
import { $createHorizontalRuleNode as $createHorizontalRuleNode2, $isHorizontalRuleNode, HorizontalRuleNode } from "@lexical/extension";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  MULTILINE_ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS
} from "@lexical/markdown";
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode as TableCellNode2,
  TableNode as TableNode2,
  TableRowNode as TableRowNode2
} from "@lexical/table";
import { $createTextNode as $createTextNode2, $isParagraphNode as $isParagraphNode4, $isTextNode as $isTextNode3 } from "lexical";

// src/utils/emoji-list.ts
var emoji_list_default = [
  {
    description: "grinning face",
    emoji: "\u{1F600}",
    category: "Smileys & Emotion",
    aliases: ["grinning"],
    tags: ["smile", "happy"],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F603}",
    description: "grinning face with big eyes",
    category: "Smileys & Emotion",
    aliases: ["smiley"],
    tags: ["happy", "joy", "haha"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F604}",
    description: "grinning face with smiling eyes",
    category: "Smileys & Emotion",
    aliases: ["smile"],
    tags: ["happy", "joy", "laugh", "pleased"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F601}",
    description: "beaming face with smiling eyes",
    category: "Smileys & Emotion",
    aliases: ["grin"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F606}",
    description: "grinning squinting face",
    category: "Smileys & Emotion",
    aliases: ["laughing", "satisfied"],
    tags: ["happy", "haha"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F605}",
    description: "grinning face with sweat",
    category: "Smileys & Emotion",
    aliases: ["sweat_smile"],
    tags: ["hot"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F923}",
    description: "rolling on the floor laughing",
    category: "Smileys & Emotion",
    aliases: ["rofl"],
    tags: ["lol", "laughing"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F602}",
    description: "face with tears of joy",
    category: "Smileys & Emotion",
    aliases: ["joy"],
    tags: ["tears"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F642}",
    description: "slightly smiling face",
    category: "Smileys & Emotion",
    aliases: ["slightly_smiling_face"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F643}",
    description: "upside-down face",
    category: "Smileys & Emotion",
    aliases: ["upside_down_face"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F609}",
    description: "winking face",
    category: "Smileys & Emotion",
    aliases: ["wink"],
    tags: ["flirt"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F60A}",
    description: "smiling face with smiling eyes",
    category: "Smileys & Emotion",
    aliases: ["blush"],
    tags: ["proud"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F607}",
    description: "smiling face with halo",
    category: "Smileys & Emotion",
    aliases: ["innocent"],
    tags: ["angel"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F970}",
    description: "smiling face with hearts",
    category: "Smileys & Emotion",
    aliases: ["smiling_face_with_three_hearts"],
    tags: ["love"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F60D}",
    description: "smiling face with heart-eyes",
    category: "Smileys & Emotion",
    aliases: ["heart_eyes"],
    tags: ["love", "crush"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F929}",
    description: "star-struck",
    category: "Smileys & Emotion",
    aliases: ["star_struck"],
    tags: ["eyes"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F618}",
    description: "face blowing a kiss",
    category: "Smileys & Emotion",
    aliases: ["kissing_heart"],
    tags: ["flirt"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F617}",
    description: "kissing face",
    category: "Smileys & Emotion",
    aliases: ["kissing"],
    tags: [],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u263A\uFE0F",
    description: "smiling face",
    category: "Smileys & Emotion",
    aliases: ["relaxed"],
    tags: ["blush", "pleased"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F61A}",
    description: "kissing face with closed eyes",
    category: "Smileys & Emotion",
    aliases: ["kissing_closed_eyes"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F619}",
    description: "kissing face with smiling eyes",
    category: "Smileys & Emotion",
    aliases: ["kissing_smiling_eyes"],
    tags: [],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F972}",
    description: "smiling face with tear",
    category: "Smileys & Emotion",
    aliases: ["smiling_face_with_tear"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F60B}",
    description: "face savoring food",
    category: "Smileys & Emotion",
    aliases: ["yum"],
    tags: ["tongue", "lick"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F61B}",
    description: "face with tongue",
    category: "Smileys & Emotion",
    aliases: ["stuck_out_tongue"],
    tags: [],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F61C}",
    description: "winking face with tongue",
    category: "Smileys & Emotion",
    aliases: ["stuck_out_tongue_winking_eye"],
    tags: ["prank", "silly"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F92A}",
    description: "zany face",
    category: "Smileys & Emotion",
    aliases: ["zany_face"],
    tags: ["goofy", "wacky"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F61D}",
    description: "squinting face with tongue",
    category: "Smileys & Emotion",
    aliases: ["stuck_out_tongue_closed_eyes"],
    tags: ["prank"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F911}",
    description: "money-mouth face",
    category: "Smileys & Emotion",
    aliases: ["money_mouth_face"],
    tags: ["rich"],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F917}",
    description: "hugging face",
    category: "Smileys & Emotion",
    aliases: ["hugs"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F92D}",
    description: "face with hand over mouth",
    category: "Smileys & Emotion",
    aliases: ["hand_over_mouth"],
    tags: ["quiet", "whoops"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F92B}",
    description: "shushing face",
    category: "Smileys & Emotion",
    aliases: ["shushing_face"],
    tags: ["silence", "quiet"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F914}",
    description: "thinking face",
    category: "Smileys & Emotion",
    aliases: ["thinking"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F910}",
    description: "zipper-mouth face",
    category: "Smileys & Emotion",
    aliases: ["zipper_mouth_face"],
    tags: ["silence", "hush"],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F928}",
    description: "face with raised eyebrow",
    category: "Smileys & Emotion",
    aliases: ["raised_eyebrow"],
    tags: ["suspicious"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F610}",
    description: "neutral face",
    category: "Smileys & Emotion",
    aliases: ["neutral_face"],
    tags: ["meh"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F611}",
    description: "expressionless face",
    category: "Smileys & Emotion",
    aliases: ["expressionless"],
    tags: [],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F636}",
    description: "face without mouth",
    category: "Smileys & Emotion",
    aliases: ["no_mouth"],
    tags: ["mute", "silence"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F636}\u200D\u{1F32B}\uFE0F",
    description: "face in clouds",
    category: "Smileys & Emotion",
    aliases: ["face_in_clouds"],
    tags: [],
    unicode_version: "13.1",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F60F}",
    description: "smirking face",
    category: "Smileys & Emotion",
    aliases: ["smirk"],
    tags: ["smug"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F612}",
    description: "unamused face",
    category: "Smileys & Emotion",
    aliases: ["unamused"],
    tags: ["meh"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F644}",
    description: "face with rolling eyes",
    category: "Smileys & Emotion",
    aliases: ["roll_eyes"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F62C}",
    description: "grimacing face",
    category: "Smileys & Emotion",
    aliases: ["grimacing"],
    tags: [],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F62E}\u200D\u{1F4A8}",
    description: "face exhaling",
    category: "Smileys & Emotion",
    aliases: ["face_exhaling"],
    tags: [],
    unicode_version: "13.1",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F925}",
    description: "lying face",
    category: "Smileys & Emotion",
    aliases: ["lying_face"],
    tags: ["liar"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F60C}",
    description: "relieved face",
    category: "Smileys & Emotion",
    aliases: ["relieved"],
    tags: ["whew"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F614}",
    description: "pensive face",
    category: "Smileys & Emotion",
    aliases: ["pensive"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F62A}",
    description: "sleepy face",
    category: "Smileys & Emotion",
    aliases: ["sleepy"],
    tags: ["tired"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F924}",
    description: "drooling face",
    category: "Smileys & Emotion",
    aliases: ["drooling_face"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F634}",
    description: "sleeping face",
    category: "Smileys & Emotion",
    aliases: ["sleeping"],
    tags: ["zzz"],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F637}",
    description: "face with medical mask",
    category: "Smileys & Emotion",
    aliases: ["mask"],
    tags: ["sick", "ill"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F912}",
    description: "face with thermometer",
    category: "Smileys & Emotion",
    aliases: ["face_with_thermometer"],
    tags: ["sick"],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F915}",
    description: "face with head-bandage",
    category: "Smileys & Emotion",
    aliases: ["face_with_head_bandage"],
    tags: ["hurt"],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F922}",
    description: "nauseated face",
    category: "Smileys & Emotion",
    aliases: ["nauseated_face"],
    tags: ["sick", "barf", "disgusted"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F92E}",
    description: "face vomiting",
    category: "Smileys & Emotion",
    aliases: ["vomiting_face"],
    tags: ["barf", "sick"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F927}",
    description: "sneezing face",
    category: "Smileys & Emotion",
    aliases: ["sneezing_face"],
    tags: ["achoo", "sick"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F975}",
    description: "hot face",
    category: "Smileys & Emotion",
    aliases: ["hot_face"],
    tags: ["heat", "sweating"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F976}",
    description: "cold face",
    category: "Smileys & Emotion",
    aliases: ["cold_face"],
    tags: ["freezing", "ice"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F974}",
    description: "woozy face",
    category: "Smileys & Emotion",
    aliases: ["woozy_face"],
    tags: ["groggy"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F635}",
    description: "knocked-out face",
    category: "Smileys & Emotion",
    aliases: ["dizzy_face"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F635}\u200D\u{1F4AB}",
    description: "face with spiral eyes",
    category: "Smileys & Emotion",
    aliases: ["face_with_spiral_eyes"],
    tags: [],
    unicode_version: "13.1",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F92F}",
    description: "exploding head",
    category: "Smileys & Emotion",
    aliases: ["exploding_head"],
    tags: ["mind", "blown"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F920}",
    description: "cowboy hat face",
    category: "Smileys & Emotion",
    aliases: ["cowboy_hat_face"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F973}",
    description: "partying face",
    category: "Smileys & Emotion",
    aliases: ["partying_face"],
    tags: ["celebration", "birthday"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F978}",
    description: "disguised face",
    category: "Smileys & Emotion",
    aliases: ["disguised_face"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F60E}",
    description: "smiling face with sunglasses",
    category: "Smileys & Emotion",
    aliases: ["sunglasses"],
    tags: ["cool"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F913}",
    description: "nerd face",
    category: "Smileys & Emotion",
    aliases: ["nerd_face"],
    tags: ["geek", "glasses"],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F9D0}",
    description: "face with monocle",
    category: "Smileys & Emotion",
    aliases: ["monocle_face"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F615}",
    description: "confused face",
    category: "Smileys & Emotion",
    aliases: ["confused"],
    tags: [],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F61F}",
    description: "worried face",
    category: "Smileys & Emotion",
    aliases: ["worried"],
    tags: ["nervous"],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F641}",
    description: "slightly frowning face",
    category: "Smileys & Emotion",
    aliases: ["slightly_frowning_face"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u2639\uFE0F",
    description: "frowning face",
    category: "Smileys & Emotion",
    aliases: ["frowning_face"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F62E}",
    description: "face with open mouth",
    category: "Smileys & Emotion",
    aliases: ["open_mouth"],
    tags: ["surprise", "impressed", "wow"],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F62F}",
    description: "hushed face",
    category: "Smileys & Emotion",
    aliases: ["hushed"],
    tags: ["silence", "speechless"],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F632}",
    description: "astonished face",
    category: "Smileys & Emotion",
    aliases: ["astonished"],
    tags: ["amazed", "gasp"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F633}",
    description: "flushed face",
    category: "Smileys & Emotion",
    aliases: ["flushed"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F97A}",
    description: "pleading face",
    category: "Smileys & Emotion",
    aliases: ["pleading_face"],
    tags: ["puppy", "eyes"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F626}",
    description: "frowning face with open mouth",
    category: "Smileys & Emotion",
    aliases: ["frowning"],
    tags: [],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F627}",
    description: "anguished face",
    category: "Smileys & Emotion",
    aliases: ["anguished"],
    tags: ["stunned"],
    unicode_version: "6.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F628}",
    description: "fearful face",
    category: "Smileys & Emotion",
    aliases: ["fearful"],
    tags: ["scared", "shocked", "oops"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F630}",
    description: "anxious face with sweat",
    category: "Smileys & Emotion",
    aliases: ["cold_sweat"],
    tags: ["nervous"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F625}",
    description: "sad but relieved face",
    category: "Smileys & Emotion",
    aliases: ["disappointed_relieved"],
    tags: ["phew", "sweat", "nervous"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F622}",
    description: "crying face",
    category: "Smileys & Emotion",
    aliases: ["cry"],
    tags: ["sad", "tear"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F62D}",
    description: "loudly crying face",
    category: "Smileys & Emotion",
    aliases: ["sob"],
    tags: ["sad", "cry", "bawling"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F631}",
    description: "face screaming in fear",
    category: "Smileys & Emotion",
    aliases: ["scream"],
    tags: ["horror", "shocked"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F616}",
    description: "confounded face",
    category: "Smileys & Emotion",
    aliases: ["confounded"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F623}",
    description: "persevering face",
    category: "Smileys & Emotion",
    aliases: ["persevere"],
    tags: ["struggling"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F61E}",
    description: "disappointed face",
    category: "Smileys & Emotion",
    aliases: ["disappointed"],
    tags: ["sad"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F613}",
    description: "downcast face with sweat",
    category: "Smileys & Emotion",
    aliases: ["sweat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F629}",
    description: "weary face",
    category: "Smileys & Emotion",
    aliases: ["weary"],
    tags: ["tired"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F62B}",
    description: "tired face",
    category: "Smileys & Emotion",
    aliases: ["tired_face"],
    tags: ["upset", "whine"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F971}",
    description: "yawning face",
    category: "Smileys & Emotion",
    aliases: ["yawning_face"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F624}",
    description: "face with steam from nose",
    category: "Smileys & Emotion",
    aliases: ["triumph"],
    tags: ["smug"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F621}",
    description: "pouting face",
    category: "Smileys & Emotion",
    aliases: ["rage", "pout"],
    tags: ["angry"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F620}",
    description: "angry face",
    category: "Smileys & Emotion",
    aliases: ["angry"],
    tags: ["mad", "annoyed"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F92C}",
    description: "face with symbols on mouth",
    category: "Smileys & Emotion",
    aliases: ["cursing_face"],
    tags: ["foul"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F608}",
    description: "smiling face with horns",
    category: "Smileys & Emotion",
    aliases: ["smiling_imp"],
    tags: ["devil", "evil", "horns"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F47F}",
    description: "angry face with horns",
    category: "Smileys & Emotion",
    aliases: ["imp"],
    tags: ["angry", "devil", "evil", "horns"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F480}",
    description: "skull",
    category: "Smileys & Emotion",
    aliases: ["skull"],
    tags: ["dead", "danger", "poison"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2620\uFE0F",
    description: "skull and crossbones",
    category: "Smileys & Emotion",
    aliases: ["skull_and_crossbones"],
    tags: ["danger", "pirate"],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4A9}",
    description: "pile of poo",
    category: "Smileys & Emotion",
    aliases: ["hankey", "poop", "shit"],
    tags: ["crap"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F921}",
    description: "clown face",
    category: "Smileys & Emotion",
    aliases: ["clown_face"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F479}",
    description: "ogre",
    category: "Smileys & Emotion",
    aliases: ["japanese_ogre"],
    tags: ["monster"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F47A}",
    description: "goblin",
    category: "Smileys & Emotion",
    aliases: ["japanese_goblin"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F47B}",
    description: "ghost",
    category: "Smileys & Emotion",
    aliases: ["ghost"],
    tags: ["halloween"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F47D}",
    description: "alien",
    category: "Smileys & Emotion",
    aliases: ["alien"],
    tags: ["ufo"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F47E}",
    description: "alien monster",
    category: "Smileys & Emotion",
    aliases: ["space_invader"],
    tags: ["game", "retro"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F916}",
    description: "robot",
    category: "Smileys & Emotion",
    aliases: ["robot"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F63A}",
    description: "grinning cat",
    category: "Smileys & Emotion",
    aliases: ["smiley_cat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F638}",
    description: "grinning cat with smiling eyes",
    category: "Smileys & Emotion",
    aliases: ["smile_cat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F639}",
    description: "cat with tears of joy",
    category: "Smileys & Emotion",
    aliases: ["joy_cat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F63B}",
    description: "smiling cat with heart-eyes",
    category: "Smileys & Emotion",
    aliases: ["heart_eyes_cat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F63C}",
    description: "cat with wry smile",
    category: "Smileys & Emotion",
    aliases: ["smirk_cat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F63D}",
    description: "kissing cat",
    category: "Smileys & Emotion",
    aliases: ["kissing_cat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F640}",
    description: "weary cat",
    category: "Smileys & Emotion",
    aliases: ["scream_cat"],
    tags: ["horror"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F63F}",
    description: "crying cat",
    category: "Smileys & Emotion",
    aliases: ["crying_cat_face"],
    tags: ["sad", "tear"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F63E}",
    description: "pouting cat",
    category: "Smileys & Emotion",
    aliases: ["pouting_cat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F648}",
    description: "see-no-evil monkey",
    category: "Smileys & Emotion",
    aliases: ["see_no_evil"],
    tags: ["monkey", "blind", "ignore"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F649}",
    description: "hear-no-evil monkey",
    category: "Smileys & Emotion",
    aliases: ["hear_no_evil"],
    tags: ["monkey", "deaf"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F64A}",
    description: "speak-no-evil monkey",
    category: "Smileys & Emotion",
    aliases: ["speak_no_evil"],
    tags: ["monkey", "mute", "hush"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F48B}",
    description: "kiss mark",
    category: "Smileys & Emotion",
    aliases: ["kiss"],
    tags: ["lipstick"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F48C}",
    description: "love letter",
    category: "Smileys & Emotion",
    aliases: ["love_letter"],
    tags: ["email", "envelope"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F498}",
    description: "heart with arrow",
    category: "Smileys & Emotion",
    aliases: ["cupid"],
    tags: ["love", "heart"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F49D}",
    description: "heart with ribbon",
    category: "Smileys & Emotion",
    aliases: ["gift_heart"],
    tags: ["chocolates"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F496}",
    description: "sparkling heart",
    category: "Smileys & Emotion",
    aliases: ["sparkling_heart"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F497}",
    description: "growing heart",
    category: "Smileys & Emotion",
    aliases: ["heartpulse"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F493}",
    description: "beating heart",
    category: "Smileys & Emotion",
    aliases: ["heartbeat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F49E}",
    description: "revolving hearts",
    category: "Smileys & Emotion",
    aliases: ["revolving_hearts"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F495}",
    description: "two hearts",
    category: "Smileys & Emotion",
    aliases: ["two_hearts"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F49F}",
    description: "heart decoration",
    category: "Smileys & Emotion",
    aliases: ["heart_decoration"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2763\uFE0F",
    description: "heart exclamation",
    category: "Smileys & Emotion",
    aliases: ["heavy_heart_exclamation"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F494}",
    description: "broken heart",
    category: "Smileys & Emotion",
    aliases: ["broken_heart"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2764\uFE0F\u200D\u{1F525}",
    description: "heart on fire",
    category: "Smileys & Emotion",
    aliases: ["heart_on_fire"],
    tags: [],
    unicode_version: "13.1",
    ios_version: "14.0"
  },
  {
    emoji: "\u2764\uFE0F\u200D\u{1FA79}",
    description: "mending heart",
    category: "Smileys & Emotion",
    aliases: ["mending_heart"],
    tags: [],
    unicode_version: "13.1",
    ios_version: "14.0"
  },
  {
    emoji: "\u2764\uFE0F",
    description: "red heart",
    category: "Smileys & Emotion",
    aliases: ["heart"],
    tags: ["love"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9E1}",
    description: "orange heart",
    category: "Smileys & Emotion",
    aliases: ["orange_heart"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F49B}",
    description: "yellow heart",
    category: "Smileys & Emotion",
    aliases: ["yellow_heart"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F49A}",
    description: "green heart",
    category: "Smileys & Emotion",
    aliases: ["green_heart"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F499}",
    description: "blue heart",
    category: "Smileys & Emotion",
    aliases: ["blue_heart"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F49C}",
    description: "purple heart",
    category: "Smileys & Emotion",
    aliases: ["purple_heart"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F90E}",
    description: "brown heart",
    category: "Smileys & Emotion",
    aliases: ["brown_heart"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F5A4}",
    description: "black heart",
    category: "Smileys & Emotion",
    aliases: ["black_heart"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F90D}",
    description: "white heart",
    category: "Smileys & Emotion",
    aliases: ["white_heart"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F4AF}",
    description: "hundred points",
    category: "Smileys & Emotion",
    aliases: ["100"],
    tags: ["score", "perfect"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4A2}",
    description: "anger symbol",
    category: "Smileys & Emotion",
    aliases: ["anger"],
    tags: ["angry"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4A5}",
    description: "collision",
    category: "Smileys & Emotion",
    aliases: ["boom", "collision"],
    tags: ["explode"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4AB}",
    description: "dizzy",
    category: "Smileys & Emotion",
    aliases: ["dizzy"],
    tags: ["star"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4A6}",
    description: "sweat droplets",
    category: "Smileys & Emotion",
    aliases: ["sweat_drops"],
    tags: ["water", "workout"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4A8}",
    description: "dashing away",
    category: "Smileys & Emotion",
    aliases: ["dash"],
    tags: ["wind", "blow", "fast"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F573}\uFE0F",
    description: "hole",
    category: "Smileys & Emotion",
    aliases: ["hole"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4A3}",
    description: "bomb",
    category: "Smileys & Emotion",
    aliases: ["bomb"],
    tags: ["boom"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4AC}",
    description: "speech balloon",
    category: "Smileys & Emotion",
    aliases: ["speech_balloon"],
    tags: ["comment"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F",
    description: "eye in speech bubble",
    category: "Smileys & Emotion",
    aliases: ["eye_speech_bubble"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F5E8}\uFE0F",
    description: "left speech bubble",
    category: "Smileys & Emotion",
    aliases: ["left_speech_bubble"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F5EF}\uFE0F",
    description: "right anger bubble",
    category: "Smileys & Emotion",
    aliases: ["right_anger_bubble"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4AD}",
    description: "thought balloon",
    category: "Smileys & Emotion",
    aliases: ["thought_balloon"],
    tags: ["thinking"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4A4}",
    description: "zzz",
    category: "Smileys & Emotion",
    aliases: ["zzz"],
    tags: ["sleeping"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F44B}",
    description: "waving hand",
    category: "People & Body",
    aliases: ["wave"],
    tags: ["goodbye"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F91A}",
    description: "raised back of hand",
    category: "People & Body",
    aliases: ["raised_back_of_hand"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F590}\uFE0F",
    description: "hand with fingers splayed",
    category: "People & Body",
    aliases: ["raised_hand_with_fingers_splayed"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u270B",
    description: "raised hand",
    category: "People & Body",
    aliases: ["hand", "raised_hand"],
    tags: ["highfive", "stop"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F596}",
    description: "vulcan salute",
    category: "People & Body",
    aliases: ["vulcan_salute"],
    tags: ["prosper", "spock"],
    unicode_version: "7.0",
    ios_version: "8.3",
    skin_tones: true
  },
  {
    emoji: "\u{1F44C}",
    description: "OK hand",
    category: "People & Body",
    aliases: ["ok_hand"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F90C}",
    description: "pinched fingers",
    category: "People & Body",
    aliases: ["pinched_fingers"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F90F}",
    description: "pinching hand",
    category: "People & Body",
    aliases: ["pinching_hand"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u270C\uFE0F",
    description: "victory hand",
    category: "People & Body",
    aliases: ["v"],
    tags: ["victory", "peace"],
    unicode_version: "",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F91E}",
    description: "crossed fingers",
    category: "People & Body",
    aliases: ["crossed_fingers"],
    tags: ["luck", "hopeful"],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F91F}",
    description: "love-you gesture",
    category: "People & Body",
    aliases: ["love_you_gesture"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F918}",
    description: "sign of the horns",
    category: "People & Body",
    aliases: ["metal"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F919}",
    description: "call me hand",
    category: "People & Body",
    aliases: ["call_me_hand"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F448}",
    description: "backhand index pointing left",
    category: "People & Body",
    aliases: ["point_left"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F449}",
    description: "backhand index pointing right",
    category: "People & Body",
    aliases: ["point_right"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F446}",
    description: "backhand index pointing up",
    category: "People & Body",
    aliases: ["point_up_2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F595}",
    description: "middle finger",
    category: "People & Body",
    aliases: ["middle_finger", "fu"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F447}",
    description: "backhand index pointing down",
    category: "People & Body",
    aliases: ["point_down"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u261D\uFE0F",
    description: "index pointing up",
    category: "People & Body",
    aliases: ["point_up"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F44D}",
    description: "thumbs up",
    category: "People & Body",
    aliases: ["+1", "thumbsup"],
    tags: ["approve", "ok"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F44E}",
    description: "thumbs down",
    category: "People & Body",
    aliases: ["-1", "thumbsdown"],
    tags: ["disapprove", "bury"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u270A",
    description: "raised fist",
    category: "People & Body",
    aliases: ["fist_raised", "fist"],
    tags: ["power"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F44A}",
    description: "oncoming fist",
    category: "People & Body",
    aliases: ["fist_oncoming", "facepunch", "punch"],
    tags: ["attack"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F91B}",
    description: "left-facing fist",
    category: "People & Body",
    aliases: ["fist_left"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F91C}",
    description: "right-facing fist",
    category: "People & Body",
    aliases: ["fist_right"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F44F}",
    description: "clapping hands",
    category: "People & Body",
    aliases: ["clap"],
    tags: ["praise", "applause"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F64C}",
    description: "raising hands",
    category: "People & Body",
    aliases: ["raised_hands"],
    tags: ["hooray"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F450}",
    description: "open hands",
    category: "People & Body",
    aliases: ["open_hands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F932}",
    description: "palms up together",
    category: "People & Body",
    aliases: ["palms_up_together"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F91D}",
    description: "handshake",
    category: "People & Body",
    aliases: ["handshake"],
    tags: ["deal"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F64F}",
    description: "folded hands",
    category: "People & Body",
    aliases: ["pray"],
    tags: ["please", "hope", "wish"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u270D\uFE0F",
    description: "writing hand",
    category: "People & Body",
    aliases: ["writing_hand"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F485}",
    description: "nail polish",
    category: "People & Body",
    aliases: ["nail_care"],
    tags: ["beauty", "manicure"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F933}",
    description: "selfie",
    category: "People & Body",
    aliases: ["selfie"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F4AA}",
    description: "flexed biceps",
    category: "People & Body",
    aliases: ["muscle"],
    tags: ["flex", "bicep", "strong", "workout"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9BE}",
    description: "mechanical arm",
    category: "People & Body",
    aliases: ["mechanical_arm"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9BF}",
    description: "mechanical leg",
    category: "People & Body",
    aliases: ["mechanical_leg"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9B5}",
    description: "leg",
    category: "People & Body",
    aliases: ["leg"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9B6}",
    description: "foot",
    category: "People & Body",
    aliases: ["foot"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F442}",
    description: "ear",
    category: "People & Body",
    aliases: ["ear"],
    tags: ["hear", "sound", "listen"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9BB}",
    description: "ear with hearing aid",
    category: "People & Body",
    aliases: ["ear_with_hearing_aid"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F443}",
    description: "nose",
    category: "People & Body",
    aliases: ["nose"],
    tags: ["smell"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9E0}",
    description: "brain",
    category: "People & Body",
    aliases: ["brain"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FAC0}",
    description: "anatomical heart",
    category: "People & Body",
    aliases: ["anatomical_heart"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1FAC1}",
    description: "lungs",
    category: "People & Body",
    aliases: ["lungs"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F9B7}",
    description: "tooth",
    category: "People & Body",
    aliases: ["tooth"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9B4}",
    description: "bone",
    category: "People & Body",
    aliases: ["bone"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F440}",
    description: "eyes",
    category: "People & Body",
    aliases: ["eyes"],
    tags: ["look", "see", "watch"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F441}\uFE0F",
    description: "eye",
    category: "People & Body",
    aliases: ["eye"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F445}",
    description: "tongue",
    category: "People & Body",
    aliases: ["tongue"],
    tags: ["taste"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F444}",
    description: "mouth",
    category: "People & Body",
    aliases: ["lips"],
    tags: ["kiss"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F476}",
    description: "baby",
    category: "People & Body",
    aliases: ["baby"],
    tags: ["child", "newborn"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D2}",
    description: "child",
    category: "People & Body",
    aliases: ["child"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F466}",
    description: "boy",
    category: "People & Body",
    aliases: ["boy"],
    tags: ["child"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F467}",
    description: "girl",
    category: "People & Body",
    aliases: ["girl"],
    tags: ["child"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}",
    description: "person",
    category: "People & Body",
    aliases: ["adult"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F471}",
    description: "person: blond hair",
    category: "People & Body",
    aliases: ["blond_haired_person"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}",
    description: "man",
    category: "People & Body",
    aliases: ["man"],
    tags: ["mustache", "father", "dad"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D4}",
    description: "person: beard",
    category: "People & Body",
    aliases: ["bearded_person"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D4}\u200D\u2642\uFE0F",
    description: "man: beard",
    category: "People & Body",
    aliases: ["man_beard"],
    tags: [],
    unicode_version: "13.1",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D4}\u200D\u2640\uFE0F",
    description: "woman: beard",
    category: "People & Body",
    aliases: ["woman_beard"],
    tags: [],
    unicode_version: "13.1",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9B0}",
    description: "man: red hair",
    category: "People & Body",
    aliases: ["red_haired_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9B1}",
    description: "man: curly hair",
    category: "People & Body",
    aliases: ["curly_haired_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9B3}",
    description: "man: white hair",
    category: "People & Body",
    aliases: ["white_haired_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9B2}",
    description: "man: bald",
    category: "People & Body",
    aliases: ["bald_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}",
    description: "woman",
    category: "People & Body",
    aliases: ["woman"],
    tags: ["girls"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9B0}",
    description: "woman: red hair",
    category: "People & Body",
    aliases: ["red_haired_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9B0}",
    description: "person: red hair",
    category: "People & Body",
    aliases: ["person_red_hair"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9B1}",
    description: "woman: curly hair",
    category: "People & Body",
    aliases: ["curly_haired_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9B1}",
    description: "person: curly hair",
    category: "People & Body",
    aliases: ["person_curly_hair"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9B3}",
    description: "woman: white hair",
    category: "People & Body",
    aliases: ["white_haired_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9B3}",
    description: "person: white hair",
    category: "People & Body",
    aliases: ["person_white_hair"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9B2}",
    description: "woman: bald",
    category: "People & Body",
    aliases: ["bald_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9B2}",
    description: "person: bald",
    category: "People & Body",
    aliases: ["person_bald"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F471}\u200D\u2640\uFE0F",
    description: "woman: blond hair",
    category: "People & Body",
    aliases: ["blond_haired_woman", "blonde_woman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F471}\u200D\u2642\uFE0F",
    description: "man: blond hair",
    category: "People & Body",
    aliases: ["blond_haired_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D3}",
    description: "older person",
    category: "People & Body",
    aliases: ["older_adult"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F474}",
    description: "old man",
    category: "People & Body",
    aliases: ["older_man"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F475}",
    description: "old woman",
    category: "People & Body",
    aliases: ["older_woman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F64D}",
    description: "person frowning",
    category: "People & Body",
    aliases: ["frowning_person"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F64D}\u200D\u2642\uFE0F",
    description: "man frowning",
    category: "People & Body",
    aliases: ["frowning_man"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F64D}\u200D\u2640\uFE0F",
    description: "woman frowning",
    category: "People & Body",
    aliases: ["frowning_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F64E}",
    description: "person pouting",
    category: "People & Body",
    aliases: ["pouting_face"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F64E}\u200D\u2642\uFE0F",
    description: "man pouting",
    category: "People & Body",
    aliases: ["pouting_man"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F64E}\u200D\u2640\uFE0F",
    description: "woman pouting",
    category: "People & Body",
    aliases: ["pouting_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F645}",
    description: "person gesturing NO",
    category: "People & Body",
    aliases: ["no_good"],
    tags: ["stop", "halt", "denied"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F645}\u200D\u2642\uFE0F",
    description: "man gesturing NO",
    category: "People & Body",
    aliases: ["no_good_man", "ng_man"],
    tags: ["stop", "halt", "denied"],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F645}\u200D\u2640\uFE0F",
    description: "woman gesturing NO",
    category: "People & Body",
    aliases: ["no_good_woman", "ng_woman"],
    tags: ["stop", "halt", "denied"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F646}",
    description: "person gesturing OK",
    category: "People & Body",
    aliases: ["ok_person"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F646}\u200D\u2642\uFE0F",
    description: "man gesturing OK",
    category: "People & Body",
    aliases: ["ok_man"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F646}\u200D\u2640\uFE0F",
    description: "woman gesturing OK",
    category: "People & Body",
    aliases: ["ok_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F481}",
    description: "person tipping hand",
    category: "People & Body",
    aliases: ["tipping_hand_person", "information_desk_person"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F481}\u200D\u2642\uFE0F",
    description: "man tipping hand",
    category: "People & Body",
    aliases: ["tipping_hand_man", "sassy_man"],
    tags: ["information"],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F481}\u200D\u2640\uFE0F",
    description: "woman tipping hand",
    category: "People & Body",
    aliases: ["tipping_hand_woman", "sassy_woman"],
    tags: ["information"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F64B}",
    description: "person raising hand",
    category: "People & Body",
    aliases: ["raising_hand"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F64B}\u200D\u2642\uFE0F",
    description: "man raising hand",
    category: "People & Body",
    aliases: ["raising_hand_man"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F64B}\u200D\u2640\uFE0F",
    description: "woman raising hand",
    category: "People & Body",
    aliases: ["raising_hand_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9CF}",
    description: "deaf person",
    category: "People & Body",
    aliases: ["deaf_person"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9CF}\u200D\u2642\uFE0F",
    description: "deaf man",
    category: "People & Body",
    aliases: ["deaf_man"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9CF}\u200D\u2640\uFE0F",
    description: "deaf woman",
    category: "People & Body",
    aliases: ["deaf_woman"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F647}",
    description: "person bowing",
    category: "People & Body",
    aliases: ["bow"],
    tags: ["respect", "thanks"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F647}\u200D\u2642\uFE0F",
    description: "man bowing",
    category: "People & Body",
    aliases: ["bowing_man"],
    tags: ["respect", "thanks"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F647}\u200D\u2640\uFE0F",
    description: "woman bowing",
    category: "People & Body",
    aliases: ["bowing_woman"],
    tags: ["respect", "thanks"],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F926}",
    description: "person facepalming",
    category: "People & Body",
    aliases: ["facepalm"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F926}\u200D\u2642\uFE0F",
    description: "man facepalming",
    category: "People & Body",
    aliases: ["man_facepalming"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F926}\u200D\u2640\uFE0F",
    description: "woman facepalming",
    category: "People & Body",
    aliases: ["woman_facepalming"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F937}",
    description: "person shrugging",
    category: "People & Body",
    aliases: ["shrug"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F937}\u200D\u2642\uFE0F",
    description: "man shrugging",
    category: "People & Body",
    aliases: ["man_shrugging"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F937}\u200D\u2640\uFE0F",
    description: "woman shrugging",
    category: "People & Body",
    aliases: ["woman_shrugging"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u2695\uFE0F",
    description: "health worker",
    category: "People & Body",
    aliases: ["health_worker"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u2695\uFE0F",
    description: "man health worker",
    category: "People & Body",
    aliases: ["man_health_worker"],
    tags: ["doctor", "nurse"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u2695\uFE0F",
    description: "woman health worker",
    category: "People & Body",
    aliases: ["woman_health_worker"],
    tags: ["doctor", "nurse"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F393}",
    description: "student",
    category: "People & Body",
    aliases: ["student"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F393}",
    description: "man student",
    category: "People & Body",
    aliases: ["man_student"],
    tags: ["graduation"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F393}",
    description: "woman student",
    category: "People & Body",
    aliases: ["woman_student"],
    tags: ["graduation"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F3EB}",
    description: "teacher",
    category: "People & Body",
    aliases: ["teacher"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F3EB}",
    description: "man teacher",
    category: "People & Body",
    aliases: ["man_teacher"],
    tags: ["school", "professor"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F3EB}",
    description: "woman teacher",
    category: "People & Body",
    aliases: ["woman_teacher"],
    tags: ["school", "professor"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u2696\uFE0F",
    description: "judge",
    category: "People & Body",
    aliases: ["judge"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u2696\uFE0F",
    description: "man judge",
    category: "People & Body",
    aliases: ["man_judge"],
    tags: ["justice"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u2696\uFE0F",
    description: "woman judge",
    category: "People & Body",
    aliases: ["woman_judge"],
    tags: ["justice"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F33E}",
    description: "farmer",
    category: "People & Body",
    aliases: ["farmer"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F33E}",
    description: "man farmer",
    category: "People & Body",
    aliases: ["man_farmer"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F33E}",
    description: "woman farmer",
    category: "People & Body",
    aliases: ["woman_farmer"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F373}",
    description: "cook",
    category: "People & Body",
    aliases: ["cook"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F373}",
    description: "man cook",
    category: "People & Body",
    aliases: ["man_cook"],
    tags: ["chef"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F373}",
    description: "woman cook",
    category: "People & Body",
    aliases: ["woman_cook"],
    tags: ["chef"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F527}",
    description: "mechanic",
    category: "People & Body",
    aliases: ["mechanic"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F527}",
    description: "man mechanic",
    category: "People & Body",
    aliases: ["man_mechanic"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F527}",
    description: "woman mechanic",
    category: "People & Body",
    aliases: ["woman_mechanic"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F3ED}",
    description: "factory worker",
    category: "People & Body",
    aliases: ["factory_worker"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F3ED}",
    description: "man factory worker",
    category: "People & Body",
    aliases: ["man_factory_worker"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F3ED}",
    description: "woman factory worker",
    category: "People & Body",
    aliases: ["woman_factory_worker"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F4BC}",
    description: "office worker",
    category: "People & Body",
    aliases: ["office_worker"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F4BC}",
    description: "man office worker",
    category: "People & Body",
    aliases: ["man_office_worker"],
    tags: ["business"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F4BC}",
    description: "woman office worker",
    category: "People & Body",
    aliases: ["woman_office_worker"],
    tags: ["business"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F52C}",
    description: "scientist",
    category: "People & Body",
    aliases: ["scientist"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F52C}",
    description: "man scientist",
    category: "People & Body",
    aliases: ["man_scientist"],
    tags: ["research"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F52C}",
    description: "woman scientist",
    category: "People & Body",
    aliases: ["woman_scientist"],
    tags: ["research"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F4BB}",
    description: "technologist",
    category: "People & Body",
    aliases: ["technologist"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F4BB}",
    description: "man technologist",
    category: "People & Body",
    aliases: ["man_technologist"],
    tags: ["coder"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F4BB}",
    description: "woman technologist",
    category: "People & Body",
    aliases: ["woman_technologist"],
    tags: ["coder"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F3A4}",
    description: "singer",
    category: "People & Body",
    aliases: ["singer"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F3A4}",
    description: "man singer",
    category: "People & Body",
    aliases: ["man_singer"],
    tags: ["rockstar"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F3A4}",
    description: "woman singer",
    category: "People & Body",
    aliases: ["woman_singer"],
    tags: ["rockstar"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F3A8}",
    description: "artist",
    category: "People & Body",
    aliases: ["artist"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F3A8}",
    description: "man artist",
    category: "People & Body",
    aliases: ["man_artist"],
    tags: ["painter"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F3A8}",
    description: "woman artist",
    category: "People & Body",
    aliases: ["woman_artist"],
    tags: ["painter"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u2708\uFE0F",
    description: "pilot",
    category: "People & Body",
    aliases: ["pilot"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u2708\uFE0F",
    description: "man pilot",
    category: "People & Body",
    aliases: ["man_pilot"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u2708\uFE0F",
    description: "woman pilot",
    category: "People & Body",
    aliases: ["woman_pilot"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F680}",
    description: "astronaut",
    category: "People & Body",
    aliases: ["astronaut"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F680}",
    description: "man astronaut",
    category: "People & Body",
    aliases: ["man_astronaut"],
    tags: ["space"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F680}",
    description: "woman astronaut",
    category: "People & Body",
    aliases: ["woman_astronaut"],
    tags: ["space"],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F692}",
    description: "firefighter",
    category: "People & Body",
    aliases: ["firefighter"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F692}",
    description: "man firefighter",
    category: "People & Body",
    aliases: ["man_firefighter"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F692}",
    description: "woman firefighter",
    category: "People & Body",
    aliases: ["woman_firefighter"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F46E}",
    description: "police officer",
    category: "People & Body",
    aliases: ["police_officer", "cop"],
    tags: ["law"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F46E}\u200D\u2642\uFE0F",
    description: "man police officer",
    category: "People & Body",
    aliases: ["policeman"],
    tags: ["law", "cop"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F46E}\u200D\u2640\uFE0F",
    description: "woman police officer",
    category: "People & Body",
    aliases: ["policewoman"],
    tags: ["law", "cop"],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F575}\uFE0F",
    description: "detective",
    category: "People & Body",
    aliases: ["detective"],
    tags: ["sleuth"],
    unicode_version: "7.0",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F575}\uFE0F\u200D\u2642\uFE0F",
    description: "man detective",
    category: "People & Body",
    aliases: ["male_detective"],
    tags: ["sleuth"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F575}\uFE0F\u200D\u2640\uFE0F",
    description: "woman detective",
    category: "People & Body",
    aliases: ["female_detective"],
    tags: ["sleuth"],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F482}",
    description: "guard",
    category: "People & Body",
    aliases: ["guard"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F482}\u200D\u2642\uFE0F",
    description: "man guard",
    category: "People & Body",
    aliases: ["guardsman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F482}\u200D\u2640\uFE0F",
    description: "woman guard",
    category: "People & Body",
    aliases: ["guardswoman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F977}",
    description: "ninja",
    category: "People & Body",
    aliases: ["ninja"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F477}",
    description: "construction worker",
    category: "People & Body",
    aliases: ["construction_worker"],
    tags: ["helmet"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F477}\u200D\u2642\uFE0F",
    description: "man construction worker",
    category: "People & Body",
    aliases: ["construction_worker_man"],
    tags: ["helmet"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F477}\u200D\u2640\uFE0F",
    description: "woman construction worker",
    category: "People & Body",
    aliases: ["construction_worker_woman"],
    tags: ["helmet"],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F934}",
    description: "prince",
    category: "People & Body",
    aliases: ["prince"],
    tags: ["crown", "royal"],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F478}",
    description: "princess",
    category: "People & Body",
    aliases: ["princess"],
    tags: ["crown", "royal"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F473}",
    description: "person wearing turban",
    category: "People & Body",
    aliases: ["person_with_turban"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F473}\u200D\u2642\uFE0F",
    description: "man wearing turban",
    category: "People & Body",
    aliases: ["man_with_turban"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F473}\u200D\u2640\uFE0F",
    description: "woman wearing turban",
    category: "People & Body",
    aliases: ["woman_with_turban"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F472}",
    description: "person with skullcap",
    category: "People & Body",
    aliases: ["man_with_gua_pi_mao"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D5}",
    description: "woman with headscarf",
    category: "People & Body",
    aliases: ["woman_with_headscarf"],
    tags: ["hijab"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F935}",
    description: "person in tuxedo",
    category: "People & Body",
    aliases: ["person_in_tuxedo"],
    tags: ["groom", "marriage", "wedding"],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F935}\u200D\u2642\uFE0F",
    description: "man in tuxedo",
    category: "People & Body",
    aliases: ["man_in_tuxedo"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F935}\u200D\u2640\uFE0F",
    description: "woman in tuxedo",
    category: "People & Body",
    aliases: ["woman_in_tuxedo"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F470}",
    description: "person with veil",
    category: "People & Body",
    aliases: ["person_with_veil"],
    tags: ["marriage", "wedding"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F470}\u200D\u2642\uFE0F",
    description: "man with veil",
    category: "People & Body",
    aliases: ["man_with_veil"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F470}\u200D\u2640\uFE0F",
    description: "woman with veil",
    category: "People & Body",
    aliases: ["woman_with_veil", "bride_with_veil"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F930}",
    description: "pregnant woman",
    category: "People & Body",
    aliases: ["pregnant_woman"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F931}",
    description: "breast-feeding",
    category: "People & Body",
    aliases: ["breast_feeding"],
    tags: ["nursing"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F37C}",
    description: "woman feeding baby",
    category: "People & Body",
    aliases: ["woman_feeding_baby"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F37C}",
    description: "man feeding baby",
    category: "People & Body",
    aliases: ["man_feeding_baby"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F37C}",
    description: "person feeding baby",
    category: "People & Body",
    aliases: ["person_feeding_baby"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F47C}",
    description: "baby angel",
    category: "People & Body",
    aliases: ["angel"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F385}",
    description: "Santa Claus",
    category: "People & Body",
    aliases: ["santa"],
    tags: ["christmas"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F936}",
    description: "Mrs. Claus",
    category: "People & Body",
    aliases: ["mrs_claus"],
    tags: ["santa"],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F384}",
    description: "mx claus",
    category: "People & Body",
    aliases: ["mx_claus"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9B8}",
    description: "superhero",
    category: "People & Body",
    aliases: ["superhero"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9B8}\u200D\u2642\uFE0F",
    description: "man superhero",
    category: "People & Body",
    aliases: ["superhero_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9B8}\u200D\u2640\uFE0F",
    description: "woman superhero",
    category: "People & Body",
    aliases: ["superhero_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9B9}",
    description: "supervillain",
    category: "People & Body",
    aliases: ["supervillain"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9B9}\u200D\u2642\uFE0F",
    description: "man supervillain",
    category: "People & Body",
    aliases: ["supervillain_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9B9}\u200D\u2640\uFE0F",
    description: "woman supervillain",
    category: "People & Body",
    aliases: ["supervillain_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D9}",
    description: "mage",
    category: "People & Body",
    aliases: ["mage"],
    tags: ["wizard"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D9}\u200D\u2642\uFE0F",
    description: "man mage",
    category: "People & Body",
    aliases: ["mage_man"],
    tags: ["wizard"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D9}\u200D\u2640\uFE0F",
    description: "woman mage",
    category: "People & Body",
    aliases: ["mage_woman"],
    tags: ["wizard"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DA}",
    description: "fairy",
    category: "People & Body",
    aliases: ["fairy"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DA}\u200D\u2642\uFE0F",
    description: "man fairy",
    category: "People & Body",
    aliases: ["fairy_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DA}\u200D\u2640\uFE0F",
    description: "woman fairy",
    category: "People & Body",
    aliases: ["fairy_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DB}",
    description: "vampire",
    category: "People & Body",
    aliases: ["vampire"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DB}\u200D\u2642\uFE0F",
    description: "man vampire",
    category: "People & Body",
    aliases: ["vampire_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DB}\u200D\u2640\uFE0F",
    description: "woman vampire",
    category: "People & Body",
    aliases: ["vampire_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DC}",
    description: "merperson",
    category: "People & Body",
    aliases: ["merperson"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DC}\u200D\u2642\uFE0F",
    description: "merman",
    category: "People & Body",
    aliases: ["merman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DC}\u200D\u2640\uFE0F",
    description: "mermaid",
    category: "People & Body",
    aliases: ["mermaid"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DD}",
    description: "elf",
    category: "People & Body",
    aliases: ["elf"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DD}\u200D\u2642\uFE0F",
    description: "man elf",
    category: "People & Body",
    aliases: ["elf_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DD}\u200D\u2640\uFE0F",
    description: "woman elf",
    category: "People & Body",
    aliases: ["elf_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9DE}",
    description: "genie",
    category: "People & Body",
    aliases: ["genie"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9DE}\u200D\u2642\uFE0F",
    description: "man genie",
    category: "People & Body",
    aliases: ["genie_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9DE}\u200D\u2640\uFE0F",
    description: "woman genie",
    category: "People & Body",
    aliases: ["genie_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9DF}",
    description: "zombie",
    category: "People & Body",
    aliases: ["zombie"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9DF}\u200D\u2642\uFE0F",
    description: "man zombie",
    category: "People & Body",
    aliases: ["zombie_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9DF}\u200D\u2640\uFE0F",
    description: "woman zombie",
    category: "People & Body",
    aliases: ["zombie_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F486}",
    description: "person getting massage",
    category: "People & Body",
    aliases: ["massage"],
    tags: ["spa"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F486}\u200D\u2642\uFE0F",
    description: "man getting massage",
    category: "People & Body",
    aliases: ["massage_man"],
    tags: ["spa"],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F486}\u200D\u2640\uFE0F",
    description: "woman getting massage",
    category: "People & Body",
    aliases: ["massage_woman"],
    tags: ["spa"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F487}",
    description: "person getting haircut",
    category: "People & Body",
    aliases: ["haircut"],
    tags: ["beauty"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F487}\u200D\u2642\uFE0F",
    description: "man getting haircut",
    category: "People & Body",
    aliases: ["haircut_man"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F487}\u200D\u2640\uFE0F",
    description: "woman getting haircut",
    category: "People & Body",
    aliases: ["haircut_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F6B6}",
    description: "person walking",
    category: "People & Body",
    aliases: ["walking"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F6B6}\u200D\u2642\uFE0F",
    description: "man walking",
    category: "People & Body",
    aliases: ["walking_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F6B6}\u200D\u2640\uFE0F",
    description: "woman walking",
    category: "People & Body",
    aliases: ["walking_woman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9CD}",
    description: "person standing",
    category: "People & Body",
    aliases: ["standing_person"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9CD}\u200D\u2642\uFE0F",
    description: "man standing",
    category: "People & Body",
    aliases: ["standing_man"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9CD}\u200D\u2640\uFE0F",
    description: "woman standing",
    category: "People & Body",
    aliases: ["standing_woman"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9CE}",
    description: "person kneeling",
    category: "People & Body",
    aliases: ["kneeling_person"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9CE}\u200D\u2642\uFE0F",
    description: "man kneeling",
    category: "People & Body",
    aliases: ["kneeling_man"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9CE}\u200D\u2640\uFE0F",
    description: "woman kneeling",
    category: "People & Body",
    aliases: ["kneeling_woman"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9AF}",
    description: "person with white cane",
    category: "People & Body",
    aliases: ["person_with_probing_cane"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9AF}",
    description: "man with white cane",
    category: "People & Body",
    aliases: ["man_with_probing_cane"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9AF}",
    description: "woman with white cane",
    category: "People & Body",
    aliases: ["woman_with_probing_cane"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9BC}",
    description: "person in motorized wheelchair",
    category: "People & Body",
    aliases: ["person_in_motorized_wheelchair"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9BC}",
    description: "man in motorized wheelchair",
    category: "People & Body",
    aliases: ["man_in_motorized_wheelchair"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9BC}",
    description: "woman in motorized wheelchair",
    category: "People & Body",
    aliases: ["woman_in_motorized_wheelchair"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F9BD}",
    description: "person in manual wheelchair",
    category: "People & Body",
    aliases: ["person_in_manual_wheelchair"],
    tags: [],
    unicode_version: "12.1",
    ios_version: "13.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u{1F9BD}",
    description: "man in manual wheelchair",
    category: "People & Body",
    aliases: ["man_in_manual_wheelchair"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u{1F9BD}",
    description: "woman in manual wheelchair",
    category: "People & Body",
    aliases: ["woman_in_manual_wheelchair"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F3C3}",
    description: "person running",
    category: "People & Body",
    aliases: ["runner", "running"],
    tags: ["exercise", "workout", "marathon"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F3C3}\u200D\u2642\uFE0F",
    description: "man running",
    category: "People & Body",
    aliases: ["running_man"],
    tags: ["exercise", "workout", "marathon"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F3C3}\u200D\u2640\uFE0F",
    description: "woman running",
    category: "People & Body",
    aliases: ["running_woman"],
    tags: ["exercise", "workout", "marathon"],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F483}",
    description: "woman dancing",
    category: "People & Body",
    aliases: ["woman_dancing", "dancer"],
    tags: ["dress"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F57A}",
    description: "man dancing",
    category: "People & Body",
    aliases: ["man_dancing"],
    tags: ["dancer"],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F574}\uFE0F",
    description: "person in suit levitating",
    category: "People & Body",
    aliases: ["business_suit_levitating"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F46F}",
    description: "people with bunny ears",
    category: "People & Body",
    aliases: ["dancers"],
    tags: ["bunny"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F46F}\u200D\u2642\uFE0F",
    description: "men with bunny ears",
    category: "People & Body",
    aliases: ["dancing_men"],
    tags: ["bunny"],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F46F}\u200D\u2640\uFE0F",
    description: "women with bunny ears",
    category: "People & Body",
    aliases: ["dancing_women"],
    tags: ["bunny"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9D6}",
    description: "person in steamy room",
    category: "People & Body",
    aliases: ["sauna_person"],
    tags: ["steamy"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D6}\u200D\u2642\uFE0F",
    description: "man in steamy room",
    category: "People & Body",
    aliases: ["sauna_man"],
    tags: ["steamy"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D6}\u200D\u2640\uFE0F",
    description: "woman in steamy room",
    category: "People & Body",
    aliases: ["sauna_woman"],
    tags: ["steamy"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D7}",
    description: "person climbing",
    category: "People & Body",
    aliases: ["climbing"],
    tags: ["bouldering"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D7}\u200D\u2642\uFE0F",
    description: "man climbing",
    category: "People & Body",
    aliases: ["climbing_man"],
    tags: ["bouldering"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D7}\u200D\u2640\uFE0F",
    description: "woman climbing",
    category: "People & Body",
    aliases: ["climbing_woman"],
    tags: ["bouldering"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F93A}",
    description: "person fencing",
    category: "People & Body",
    aliases: ["person_fencing"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F3C7}",
    description: "horse racing",
    category: "People & Body",
    aliases: ["horse_racing"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u26F7\uFE0F",
    description: "skier",
    category: "People & Body",
    aliases: ["skier"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3C2}",
    description: "snowboarder",
    category: "People & Body",
    aliases: ["snowboarder"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F3CC}\uFE0F",
    description: "person golfing",
    category: "People & Body",
    aliases: ["golfing"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F3CC}\uFE0F\u200D\u2642\uFE0F",
    description: "man golfing",
    category: "People & Body",
    aliases: ["golfing_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F3CC}\uFE0F\u200D\u2640\uFE0F",
    description: "woman golfing",
    category: "People & Body",
    aliases: ["golfing_woman"],
    tags: [],
    unicode_version: "",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F3C4}",
    description: "person surfing",
    category: "People & Body",
    aliases: ["surfer"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F3C4}\u200D\u2642\uFE0F",
    description: "man surfing",
    category: "People & Body",
    aliases: ["surfing_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F3C4}\u200D\u2640\uFE0F",
    description: "woman surfing",
    category: "People & Body",
    aliases: ["surfing_woman"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F6A3}",
    description: "person rowing boat",
    category: "People & Body",
    aliases: ["rowboat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F6A3}\u200D\u2642\uFE0F",
    description: "man rowing boat",
    category: "People & Body",
    aliases: ["rowing_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F6A3}\u200D\u2640\uFE0F",
    description: "woman rowing boat",
    category: "People & Body",
    aliases: ["rowing_woman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F3CA}",
    description: "person swimming",
    category: "People & Body",
    aliases: ["swimmer"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F3CA}\u200D\u2642\uFE0F",
    description: "man swimming",
    category: "People & Body",
    aliases: ["swimming_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F3CA}\u200D\u2640\uFE0F",
    description: "woman swimming",
    category: "People & Body",
    aliases: ["swimming_woman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u26F9\uFE0F",
    description: "person bouncing ball",
    category: "People & Body",
    aliases: ["bouncing_ball_person"],
    tags: ["basketball"],
    unicode_version: "5.2",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u26F9\uFE0F\u200D\u2642\uFE0F",
    description: "man bouncing ball",
    category: "People & Body",
    aliases: ["bouncing_ball_man", "basketball_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u26F9\uFE0F\u200D\u2640\uFE0F",
    description: "woman bouncing ball",
    category: "People & Body",
    aliases: ["bouncing_ball_woman", "basketball_woman"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F3CB}\uFE0F",
    description: "person lifting weights",
    category: "People & Body",
    aliases: ["weight_lifting"],
    tags: ["gym", "workout"],
    unicode_version: "7.0",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F3CB}\uFE0F\u200D\u2642\uFE0F",
    description: "man lifting weights",
    category: "People & Body",
    aliases: ["weight_lifting_man"],
    tags: ["gym", "workout"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F3CB}\uFE0F\u200D\u2640\uFE0F",
    description: "woman lifting weights",
    category: "People & Body",
    aliases: ["weight_lifting_woman"],
    tags: ["gym", "workout"],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F6B4}",
    description: "person biking",
    category: "People & Body",
    aliases: ["bicyclist"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F6B4}\u200D\u2642\uFE0F",
    description: "man biking",
    category: "People & Body",
    aliases: ["biking_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F6B4}\u200D\u2640\uFE0F",
    description: "woman biking",
    category: "People & Body",
    aliases: ["biking_woman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F6B5}",
    description: "person mountain biking",
    category: "People & Body",
    aliases: ["mountain_bicyclist"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F6B5}\u200D\u2642\uFE0F",
    description: "man mountain biking",
    category: "People & Body",
    aliases: ["mountain_biking_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F6B5}\u200D\u2640\uFE0F",
    description: "woman mountain biking",
    category: "People & Body",
    aliases: ["mountain_biking_woman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F938}",
    description: "person cartwheeling",
    category: "People & Body",
    aliases: ["cartwheeling"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F938}\u200D\u2642\uFE0F",
    description: "man cartwheeling",
    category: "People & Body",
    aliases: ["man_cartwheeling"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F938}\u200D\u2640\uFE0F",
    description: "woman cartwheeling",
    category: "People & Body",
    aliases: ["woman_cartwheeling"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F93C}",
    description: "people wrestling",
    category: "People & Body",
    aliases: ["wrestling"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F93C}\u200D\u2642\uFE0F",
    description: "men wrestling",
    category: "People & Body",
    aliases: ["men_wrestling"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F93C}\u200D\u2640\uFE0F",
    description: "women wrestling",
    category: "People & Body",
    aliases: ["women_wrestling"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F93D}",
    description: "person playing water polo",
    category: "People & Body",
    aliases: ["water_polo"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F93D}\u200D\u2642\uFE0F",
    description: "man playing water polo",
    category: "People & Body",
    aliases: ["man_playing_water_polo"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F93D}\u200D\u2640\uFE0F",
    description: "woman playing water polo",
    category: "People & Body",
    aliases: ["woman_playing_water_polo"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F93E}",
    description: "person playing handball",
    category: "People & Body",
    aliases: ["handball_person"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F93E}\u200D\u2642\uFE0F",
    description: "man playing handball",
    category: "People & Body",
    aliases: ["man_playing_handball"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F93E}\u200D\u2640\uFE0F",
    description: "woman playing handball",
    category: "People & Body",
    aliases: ["woman_playing_handball"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F939}",
    description: "person juggling",
    category: "People & Body",
    aliases: ["juggling_person"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F939}\u200D\u2642\uFE0F",
    description: "man juggling",
    category: "People & Body",
    aliases: ["man_juggling"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F939}\u200D\u2640\uFE0F",
    description: "woman juggling",
    category: "People & Body",
    aliases: ["woman_juggling"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D8}",
    description: "person in lotus position",
    category: "People & Body",
    aliases: ["lotus_position"],
    tags: ["meditation"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D8}\u200D\u2642\uFE0F",
    description: "man in lotus position",
    category: "People & Body",
    aliases: ["lotus_position_man"],
    tags: ["meditation"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D8}\u200D\u2640\uFE0F",
    description: "woman in lotus position",
    category: "People & Body",
    aliases: ["lotus_position_woman"],
    tags: ["meditation"],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F6C0}",
    description: "person taking bath",
    category: "People & Body",
    aliases: ["bath"],
    tags: ["shower"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F6CC}",
    description: "person in bed",
    category: "People & Body",
    aliases: ["sleeping_bed"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}",
    description: "people holding hands",
    category: "People & Body",
    aliases: ["people_holding_hands"],
    tags: ["couple", "date"],
    unicode_version: "12.0",
    ios_version: "13.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F46D}",
    description: "women holding hands",
    category: "People & Body",
    aliases: ["two_women_holding_hands"],
    tags: ["couple", "date"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F46B}",
    description: "woman and man holding hands",
    category: "People & Body",
    aliases: ["couple"],
    tags: ["date"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F46C}",
    description: "men holding hands",
    category: "People & Body",
    aliases: ["two_men_holding_hands"],
    tags: ["couple", "date"],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F48F}",
    description: "kiss",
    category: "People & Body",
    aliases: ["couplekiss"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}",
    description: "kiss: woman, man",
    category: "People & Body",
    aliases: ["couplekiss_man_woman"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}",
    description: "kiss: man, man",
    category: "People & Body",
    aliases: ["couplekiss_man_man"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}",
    description: "kiss: woman, woman",
    category: "People & Body",
    aliases: ["couplekiss_woman_woman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3",
    skin_tones: true
  },
  {
    emoji: "\u{1F491}",
    description: "couple with heart",
    category: "People & Body",
    aliases: ["couple_with_heart"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}",
    description: "couple with heart: woman, man",
    category: "People & Body",
    aliases: ["couple_with_heart_woman_man"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1",
    skin_tones: true
  },
  {
    emoji: "\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F468}",
    description: "couple with heart: man, man",
    category: "People & Body",
    aliases: ["couple_with_heart_man_man"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3",
    skin_tones: true
  },
  {
    emoji: "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F469}",
    description: "couple with heart: woman, woman",
    category: "People & Body",
    aliases: ["couple_with_heart_woman_woman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3",
    skin_tones: true
  },
  {
    emoji: "\u{1F46A}",
    description: "family",
    category: "People & Body",
    aliases: ["family"],
    tags: ["home", "parents", "child"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}",
    description: "family: man, woman, boy",
    category: "People & Body",
    aliases: ["family_man_woman_boy"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
    description: "family: man, woman, girl",
    category: "People & Body",
    aliases: ["family_man_woman_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    description: "family: man, woman, girl, boy",
    category: "People & Body",
    aliases: ["family_man_woman_girl_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    description: "family: man, woman, boy, boy",
    category: "People & Body",
    aliases: ["family_man_woman_boy_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    description: "family: man, woman, girl, girl",
    category: "People & Body",
    aliases: ["family_man_woman_girl_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}",
    description: "family: man, man, boy",
    category: "People & Body",
    aliases: ["family_man_man_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}",
    description: "family: man, man, girl",
    category: "People & Body",
    aliases: ["family_man_man_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F466}",
    description: "family: man, man, girl, boy",
    category: "People & Body",
    aliases: ["family_man_man_girl_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}\u200D\u{1F466}",
    description: "family: man, man, boy, boy",
    category: "People & Body",
    aliases: ["family_man_man_boy_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F467}",
    description: "family: man, man, girl, girl",
    category: "People & Body",
    aliases: ["family_man_man_girl_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}",
    description: "family: woman, woman, boy",
    category: "People & Body",
    aliases: ["family_woman_woman_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}",
    description: "family: woman, woman, girl",
    category: "People & Body",
    aliases: ["family_woman_woman_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    description: "family: woman, woman, girl, boy",
    category: "People & Body",
    aliases: ["family_woman_woman_girl_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    description: "family: woman, woman, boy, boy",
    category: "People & Body",
    aliases: ["family_woman_woman_boy_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    description: "family: woman, woman, girl, girl",
    category: "People & Body",
    aliases: ["family_woman_woman_girl_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F466}",
    description: "family: man, boy",
    category: "People & Body",
    aliases: ["family_man_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F466}\u200D\u{1F466}",
    description: "family: man, boy, boy",
    category: "People & Body",
    aliases: ["family_man_boy_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F467}",
    description: "family: man, girl",
    category: "People & Body",
    aliases: ["family_man_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F467}\u200D\u{1F466}",
    description: "family: man, girl, boy",
    category: "People & Body",
    aliases: ["family_man_girl_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F468}\u200D\u{1F467}\u200D\u{1F467}",
    description: "family: man, girl, girl",
    category: "People & Body",
    aliases: ["family_man_girl_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F466}",
    description: "family: woman, boy",
    category: "People & Body",
    aliases: ["family_woman_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    description: "family: woman, boy, boy",
    category: "People & Body",
    aliases: ["family_woman_boy_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F467}",
    description: "family: woman, girl",
    category: "People & Body",
    aliases: ["family_woman_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    description: "family: woman, girl, boy",
    category: "People & Body",
    aliases: ["family_woman_girl_boy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    description: "family: woman, girl, girl",
    category: "People & Body",
    aliases: ["family_woman_girl_girl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F5E3}\uFE0F",
    description: "speaking head",
    category: "People & Body",
    aliases: ["speaking_head"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F464}",
    description: "bust in silhouette",
    category: "People & Body",
    aliases: ["bust_in_silhouette"],
    tags: ["user"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F465}",
    description: "busts in silhouette",
    category: "People & Body",
    aliases: ["busts_in_silhouette"],
    tags: ["users", "group", "team"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAC2}",
    description: "people hugging",
    category: "People & Body",
    aliases: ["people_hugging"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F463}",
    description: "footprints",
    category: "People & Body",
    aliases: ["footprints"],
    tags: ["feet", "tracks"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F435}",
    description: "monkey face",
    category: "Animals & Nature",
    aliases: ["monkey_face"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F412}",
    description: "monkey",
    category: "Animals & Nature",
    aliases: ["monkey"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F98D}",
    description: "gorilla",
    category: "Animals & Nature",
    aliases: ["gorilla"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F9A7}",
    description: "orangutan",
    category: "Animals & Nature",
    aliases: ["orangutan"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F436}",
    description: "dog face",
    category: "Animals & Nature",
    aliases: ["dog"],
    tags: ["pet"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F415}",
    description: "dog",
    category: "Animals & Nature",
    aliases: ["dog2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9AE}",
    description: "guide dog",
    category: "Animals & Nature",
    aliases: ["guide_dog"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F415}\u200D\u{1F9BA}",
    description: "service dog",
    category: "Animals & Nature",
    aliases: ["service_dog"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F429}",
    description: "poodle",
    category: "Animals & Nature",
    aliases: ["poodle"],
    tags: ["dog"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F43A}",
    description: "wolf",
    category: "Animals & Nature",
    aliases: ["wolf"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F98A}",
    description: "fox",
    category: "Animals & Nature",
    aliases: ["fox_face"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F99D}",
    description: "raccoon",
    category: "Animals & Nature",
    aliases: ["raccoon"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F431}",
    description: "cat face",
    category: "Animals & Nature",
    aliases: ["cat"],
    tags: ["pet"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F408}",
    description: "cat",
    category: "Animals & Nature",
    aliases: ["cat2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F408}\u200D\u2B1B",
    description: "black cat",
    category: "Animals & Nature",
    aliases: ["black_cat"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F981}",
    description: "lion",
    category: "Animals & Nature",
    aliases: ["lion"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F42F}",
    description: "tiger face",
    category: "Animals & Nature",
    aliases: ["tiger"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F405}",
    description: "tiger",
    category: "Animals & Nature",
    aliases: ["tiger2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F406}",
    description: "leopard",
    category: "Animals & Nature",
    aliases: ["leopard"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F434}",
    description: "horse face",
    category: "Animals & Nature",
    aliases: ["horse"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F40E}",
    description: "horse",
    category: "Animals & Nature",
    aliases: ["racehorse"],
    tags: ["speed"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F984}",
    description: "unicorn",
    category: "Animals & Nature",
    aliases: ["unicorn"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F993}",
    description: "zebra",
    category: "Animals & Nature",
    aliases: ["zebra"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F98C}",
    description: "deer",
    category: "Animals & Nature",
    aliases: ["deer"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F9AC}",
    description: "bison",
    category: "Animals & Nature",
    aliases: ["bison"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F42E}",
    description: "cow face",
    category: "Animals & Nature",
    aliases: ["cow"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F402}",
    description: "ox",
    category: "Animals & Nature",
    aliases: ["ox"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F403}",
    description: "water buffalo",
    category: "Animals & Nature",
    aliases: ["water_buffalo"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F404}",
    description: "cow",
    category: "Animals & Nature",
    aliases: ["cow2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F437}",
    description: "pig face",
    category: "Animals & Nature",
    aliases: ["pig"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F416}",
    description: "pig",
    category: "Animals & Nature",
    aliases: ["pig2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F417}",
    description: "boar",
    category: "Animals & Nature",
    aliases: ["boar"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F43D}",
    description: "pig nose",
    category: "Animals & Nature",
    aliases: ["pig_nose"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F40F}",
    description: "ram",
    category: "Animals & Nature",
    aliases: ["ram"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F411}",
    description: "ewe",
    category: "Animals & Nature",
    aliases: ["sheep"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F410}",
    description: "goat",
    category: "Animals & Nature",
    aliases: ["goat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F42A}",
    description: "camel",
    category: "Animals & Nature",
    aliases: ["dromedary_camel"],
    tags: ["desert"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F42B}",
    description: "two-hump camel",
    category: "Animals & Nature",
    aliases: ["camel"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F999}",
    description: "llama",
    category: "Animals & Nature",
    aliases: ["llama"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F992}",
    description: "giraffe",
    category: "Animals & Nature",
    aliases: ["giraffe"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F418}",
    description: "elephant",
    category: "Animals & Nature",
    aliases: ["elephant"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9A3}",
    description: "mammoth",
    category: "Animals & Nature",
    aliases: ["mammoth"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F98F}",
    description: "rhinoceros",
    category: "Animals & Nature",
    aliases: ["rhinoceros"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F99B}",
    description: "hippopotamus",
    category: "Animals & Nature",
    aliases: ["hippopotamus"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F42D}",
    description: "mouse face",
    category: "Animals & Nature",
    aliases: ["mouse"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F401}",
    description: "mouse",
    category: "Animals & Nature",
    aliases: ["mouse2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F400}",
    description: "rat",
    category: "Animals & Nature",
    aliases: ["rat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F439}",
    description: "hamster",
    category: "Animals & Nature",
    aliases: ["hamster"],
    tags: ["pet"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F430}",
    description: "rabbit face",
    category: "Animals & Nature",
    aliases: ["rabbit"],
    tags: ["bunny"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F407}",
    description: "rabbit",
    category: "Animals & Nature",
    aliases: ["rabbit2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F43F}\uFE0F",
    description: "chipmunk",
    category: "Animals & Nature",
    aliases: ["chipmunk"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F9AB}",
    description: "beaver",
    category: "Animals & Nature",
    aliases: ["beaver"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F994}",
    description: "hedgehog",
    category: "Animals & Nature",
    aliases: ["hedgehog"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F987}",
    description: "bat",
    category: "Animals & Nature",
    aliases: ["bat"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F43B}",
    description: "bear",
    category: "Animals & Nature",
    aliases: ["bear"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F43B}\u200D\u2744\uFE0F",
    description: "polar bear",
    category: "Animals & Nature",
    aliases: ["polar_bear"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F428}",
    description: "koala",
    category: "Animals & Nature",
    aliases: ["koala"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F43C}",
    description: "panda",
    category: "Animals & Nature",
    aliases: ["panda_face"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9A5}",
    description: "sloth",
    category: "Animals & Nature",
    aliases: ["sloth"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9A6}",
    description: "otter",
    category: "Animals & Nature",
    aliases: ["otter"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9A8}",
    description: "skunk",
    category: "Animals & Nature",
    aliases: ["skunk"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F998}",
    description: "kangaroo",
    category: "Animals & Nature",
    aliases: ["kangaroo"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9A1}",
    description: "badger",
    category: "Animals & Nature",
    aliases: ["badger"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F43E}",
    description: "paw prints",
    category: "Animals & Nature",
    aliases: ["feet", "paw_prints"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F983}",
    description: "turkey",
    category: "Animals & Nature",
    aliases: ["turkey"],
    tags: ["thanksgiving"],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F414}",
    description: "chicken",
    category: "Animals & Nature",
    aliases: ["chicken"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F413}",
    description: "rooster",
    category: "Animals & Nature",
    aliases: ["rooster"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F423}",
    description: "hatching chick",
    category: "Animals & Nature",
    aliases: ["hatching_chick"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F424}",
    description: "baby chick",
    category: "Animals & Nature",
    aliases: ["baby_chick"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F425}",
    description: "front-facing baby chick",
    category: "Animals & Nature",
    aliases: ["hatched_chick"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F426}",
    description: "bird",
    category: "Animals & Nature",
    aliases: ["bird"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F427}",
    description: "penguin",
    category: "Animals & Nature",
    aliases: ["penguin"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F54A}\uFE0F",
    description: "dove",
    category: "Animals & Nature",
    aliases: ["dove"],
    tags: ["peace"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F985}",
    description: "eagle",
    category: "Animals & Nature",
    aliases: ["eagle"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F986}",
    description: "duck",
    category: "Animals & Nature",
    aliases: ["duck"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F9A2}",
    description: "swan",
    category: "Animals & Nature",
    aliases: ["swan"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F989}",
    description: "owl",
    category: "Animals & Nature",
    aliases: ["owl"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F9A4}",
    description: "dodo",
    category: "Animals & Nature",
    aliases: ["dodo"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1FAB6}",
    description: "feather",
    category: "Animals & Nature",
    aliases: ["feather"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F9A9}",
    description: "flamingo",
    category: "Animals & Nature",
    aliases: ["flamingo"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F99A}",
    description: "peacock",
    category: "Animals & Nature",
    aliases: ["peacock"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F99C}",
    description: "parrot",
    category: "Animals & Nature",
    aliases: ["parrot"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F438}",
    description: "frog",
    category: "Animals & Nature",
    aliases: ["frog"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F40A}",
    description: "crocodile",
    category: "Animals & Nature",
    aliases: ["crocodile"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F422}",
    description: "turtle",
    category: "Animals & Nature",
    aliases: ["turtle"],
    tags: ["slow"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F98E}",
    description: "lizard",
    category: "Animals & Nature",
    aliases: ["lizard"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F40D}",
    description: "snake",
    category: "Animals & Nature",
    aliases: ["snake"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F432}",
    description: "dragon face",
    category: "Animals & Nature",
    aliases: ["dragon_face"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F409}",
    description: "dragon",
    category: "Animals & Nature",
    aliases: ["dragon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F995}",
    description: "sauropod",
    category: "Animals & Nature",
    aliases: ["sauropod"],
    tags: ["dinosaur"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F996}",
    description: "T-Rex",
    category: "Animals & Nature",
    aliases: ["t-rex"],
    tags: ["dinosaur"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F433}",
    description: "spouting whale",
    category: "Animals & Nature",
    aliases: ["whale"],
    tags: ["sea"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F40B}",
    description: "whale",
    category: "Animals & Nature",
    aliases: ["whale2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F42C}",
    description: "dolphin",
    category: "Animals & Nature",
    aliases: ["dolphin", "flipper"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9AD}",
    description: "seal",
    category: "Animals & Nature",
    aliases: ["seal"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F41F}",
    description: "fish",
    category: "Animals & Nature",
    aliases: ["fish"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F420}",
    description: "tropical fish",
    category: "Animals & Nature",
    aliases: ["tropical_fish"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F421}",
    description: "blowfish",
    category: "Animals & Nature",
    aliases: ["blowfish"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F988}",
    description: "shark",
    category: "Animals & Nature",
    aliases: ["shark"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F419}",
    description: "octopus",
    category: "Animals & Nature",
    aliases: ["octopus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F41A}",
    description: "spiral shell",
    category: "Animals & Nature",
    aliases: ["shell"],
    tags: ["sea", "beach"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F40C}",
    description: "snail",
    category: "Animals & Nature",
    aliases: ["snail"],
    tags: ["slow"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F98B}",
    description: "butterfly",
    category: "Animals & Nature",
    aliases: ["butterfly"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F41B}",
    description: "bug",
    category: "Animals & Nature",
    aliases: ["bug"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F41C}",
    description: "ant",
    category: "Animals & Nature",
    aliases: ["ant"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F41D}",
    description: "honeybee",
    category: "Animals & Nature",
    aliases: ["bee", "honeybee"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAB2}",
    description: "beetle",
    category: "Animals & Nature",
    aliases: ["beetle"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F41E}",
    description: "lady beetle",
    category: "Animals & Nature",
    aliases: ["lady_beetle"],
    tags: ["bug"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F997}",
    description: "cricket",
    category: "Animals & Nature",
    aliases: ["cricket"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FAB3}",
    description: "cockroach",
    category: "Animals & Nature",
    aliases: ["cockroach"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F577}\uFE0F",
    description: "spider",
    category: "Animals & Nature",
    aliases: ["spider"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F578}\uFE0F",
    description: "spider web",
    category: "Animals & Nature",
    aliases: ["spider_web"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F982}",
    description: "scorpion",
    category: "Animals & Nature",
    aliases: ["scorpion"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F99F}",
    description: "mosquito",
    category: "Animals & Nature",
    aliases: ["mosquito"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FAB0}",
    description: "fly",
    category: "Animals & Nature",
    aliases: ["fly"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1FAB1}",
    description: "worm",
    category: "Animals & Nature",
    aliases: ["worm"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F9A0}",
    description: "microbe",
    category: "Animals & Nature",
    aliases: ["microbe"],
    tags: ["germ"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F490}",
    description: "bouquet",
    category: "Animals & Nature",
    aliases: ["bouquet"],
    tags: ["flowers"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F338}",
    description: "cherry blossom",
    category: "Animals & Nature",
    aliases: ["cherry_blossom"],
    tags: ["flower", "spring"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4AE}",
    description: "white flower",
    category: "Animals & Nature",
    aliases: ["white_flower"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3F5}\uFE0F",
    description: "rosette",
    category: "Animals & Nature",
    aliases: ["rosette"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F339}",
    description: "rose",
    category: "Animals & Nature",
    aliases: ["rose"],
    tags: ["flower"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F940}",
    description: "wilted flower",
    category: "Animals & Nature",
    aliases: ["wilted_flower"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F33A}",
    description: "hibiscus",
    category: "Animals & Nature",
    aliases: ["hibiscus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F33B}",
    description: "sunflower",
    category: "Animals & Nature",
    aliases: ["sunflower"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F33C}",
    description: "blossom",
    category: "Animals & Nature",
    aliases: ["blossom"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F337}",
    description: "tulip",
    category: "Animals & Nature",
    aliases: ["tulip"],
    tags: ["flower"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F331}",
    description: "seedling",
    category: "Animals & Nature",
    aliases: ["seedling"],
    tags: ["plant"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAB4}",
    description: "potted plant",
    category: "Animals & Nature",
    aliases: ["potted_plant"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F332}",
    description: "evergreen tree",
    category: "Animals & Nature",
    aliases: ["evergreen_tree"],
    tags: ["wood"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F333}",
    description: "deciduous tree",
    category: "Animals & Nature",
    aliases: ["deciduous_tree"],
    tags: ["wood"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F334}",
    description: "palm tree",
    category: "Animals & Nature",
    aliases: ["palm_tree"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F335}",
    description: "cactus",
    category: "Animals & Nature",
    aliases: ["cactus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F33E}",
    description: "sheaf of rice",
    category: "Animals & Nature",
    aliases: ["ear_of_rice"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F33F}",
    description: "herb",
    category: "Animals & Nature",
    aliases: ["herb"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2618\uFE0F",
    description: "shamrock",
    category: "Animals & Nature",
    aliases: ["shamrock"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F340}",
    description: "four leaf clover",
    category: "Animals & Nature",
    aliases: ["four_leaf_clover"],
    tags: ["luck"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F341}",
    description: "maple leaf",
    category: "Animals & Nature",
    aliases: ["maple_leaf"],
    tags: ["canada"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F342}",
    description: "fallen leaf",
    category: "Animals & Nature",
    aliases: ["fallen_leaf"],
    tags: ["autumn"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F343}",
    description: "leaf fluttering in wind",
    category: "Animals & Nature",
    aliases: ["leaves"],
    tags: ["leaf"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F347}",
    description: "grapes",
    category: "Food & Drink",
    aliases: ["grapes"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F348}",
    description: "melon",
    category: "Food & Drink",
    aliases: ["melon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F349}",
    description: "watermelon",
    category: "Food & Drink",
    aliases: ["watermelon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F34A}",
    description: "tangerine",
    category: "Food & Drink",
    aliases: ["tangerine", "orange", "mandarin"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F34B}",
    description: "lemon",
    category: "Food & Drink",
    aliases: ["lemon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F34C}",
    description: "banana",
    category: "Food & Drink",
    aliases: ["banana"],
    tags: ["fruit"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F34D}",
    description: "pineapple",
    category: "Food & Drink",
    aliases: ["pineapple"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F96D}",
    description: "mango",
    category: "Food & Drink",
    aliases: ["mango"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F34E}",
    description: "red apple",
    category: "Food & Drink",
    aliases: ["apple"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F34F}",
    description: "green apple",
    category: "Food & Drink",
    aliases: ["green_apple"],
    tags: ["fruit"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F350}",
    description: "pear",
    category: "Food & Drink",
    aliases: ["pear"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F351}",
    description: "peach",
    category: "Food & Drink",
    aliases: ["peach"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F352}",
    description: "cherries",
    category: "Food & Drink",
    aliases: ["cherries"],
    tags: ["fruit"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F353}",
    description: "strawberry",
    category: "Food & Drink",
    aliases: ["strawberry"],
    tags: ["fruit"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAD0}",
    description: "blueberries",
    category: "Food & Drink",
    aliases: ["blueberries"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F95D}",
    description: "kiwi fruit",
    category: "Food & Drink",
    aliases: ["kiwi_fruit"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F345}",
    description: "tomato",
    category: "Food & Drink",
    aliases: ["tomato"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAD2}",
    description: "olive",
    category: "Food & Drink",
    aliases: ["olive"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F965}",
    description: "coconut",
    category: "Food & Drink",
    aliases: ["coconut"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F951}",
    description: "avocado",
    category: "Food & Drink",
    aliases: ["avocado"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F346}",
    description: "eggplant",
    category: "Food & Drink",
    aliases: ["eggplant"],
    tags: ["aubergine"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F954}",
    description: "potato",
    category: "Food & Drink",
    aliases: ["potato"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F955}",
    description: "carrot",
    category: "Food & Drink",
    aliases: ["carrot"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F33D}",
    description: "ear of corn",
    category: "Food & Drink",
    aliases: ["corn"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F336}\uFE0F",
    description: "hot pepper",
    category: "Food & Drink",
    aliases: ["hot_pepper"],
    tags: ["spicy"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1FAD1}",
    description: "bell pepper",
    category: "Food & Drink",
    aliases: ["bell_pepper"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F952}",
    description: "cucumber",
    category: "Food & Drink",
    aliases: ["cucumber"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F96C}",
    description: "leafy green",
    category: "Food & Drink",
    aliases: ["leafy_green"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F966}",
    description: "broccoli",
    category: "Food & Drink",
    aliases: ["broccoli"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9C4}",
    description: "garlic",
    category: "Food & Drink",
    aliases: ["garlic"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9C5}",
    description: "onion",
    category: "Food & Drink",
    aliases: ["onion"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F344}",
    description: "mushroom",
    category: "Food & Drink",
    aliases: ["mushroom"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F95C}",
    description: "peanuts",
    category: "Food & Drink",
    aliases: ["peanuts"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F330}",
    description: "chestnut",
    category: "Food & Drink",
    aliases: ["chestnut"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F35E}",
    description: "bread",
    category: "Food & Drink",
    aliases: ["bread"],
    tags: ["toast"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F950}",
    description: "croissant",
    category: "Food & Drink",
    aliases: ["croissant"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F956}",
    description: "baguette bread",
    category: "Food & Drink",
    aliases: ["baguette_bread"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1FAD3}",
    description: "flatbread",
    category: "Food & Drink",
    aliases: ["flatbread"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F968}",
    description: "pretzel",
    category: "Food & Drink",
    aliases: ["pretzel"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F96F}",
    description: "bagel",
    category: "Food & Drink",
    aliases: ["bagel"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F95E}",
    description: "pancakes",
    category: "Food & Drink",
    aliases: ["pancakes"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F9C7}",
    description: "waffle",
    category: "Food & Drink",
    aliases: ["waffle"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9C0}",
    description: "cheese wedge",
    category: "Food & Drink",
    aliases: ["cheese"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F356}",
    description: "meat on bone",
    category: "Food & Drink",
    aliases: ["meat_on_bone"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F357}",
    description: "poultry leg",
    category: "Food & Drink",
    aliases: ["poultry_leg"],
    tags: ["meat", "chicken"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F969}",
    description: "cut of meat",
    category: "Food & Drink",
    aliases: ["cut_of_meat"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F953}",
    description: "bacon",
    category: "Food & Drink",
    aliases: ["bacon"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F354}",
    description: "hamburger",
    category: "Food & Drink",
    aliases: ["hamburger"],
    tags: ["burger"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F35F}",
    description: "french fries",
    category: "Food & Drink",
    aliases: ["fries"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F355}",
    description: "pizza",
    category: "Food & Drink",
    aliases: ["pizza"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F32D}",
    description: "hot dog",
    category: "Food & Drink",
    aliases: ["hotdog"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F96A}",
    description: "sandwich",
    category: "Food & Drink",
    aliases: ["sandwich"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F32E}",
    description: "taco",
    category: "Food & Drink",
    aliases: ["taco"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F32F}",
    description: "burrito",
    category: "Food & Drink",
    aliases: ["burrito"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1FAD4}",
    description: "tamale",
    category: "Food & Drink",
    aliases: ["tamale"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F959}",
    description: "stuffed flatbread",
    category: "Food & Drink",
    aliases: ["stuffed_flatbread"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F9C6}",
    description: "falafel",
    category: "Food & Drink",
    aliases: ["falafel"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F95A}",
    description: "egg",
    category: "Food & Drink",
    aliases: ["egg"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F373}",
    description: "cooking",
    category: "Food & Drink",
    aliases: ["fried_egg"],
    tags: ["breakfast"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F958}",
    description: "shallow pan of food",
    category: "Food & Drink",
    aliases: ["shallow_pan_of_food"],
    tags: ["paella", "curry"],
    unicode_version: "",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F372}",
    description: "pot of food",
    category: "Food & Drink",
    aliases: ["stew"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAD5}",
    description: "fondue",
    category: "Food & Drink",
    aliases: ["fondue"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F963}",
    description: "bowl with spoon",
    category: "Food & Drink",
    aliases: ["bowl_with_spoon"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F957}",
    description: "green salad",
    category: "Food & Drink",
    aliases: ["green_salad"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F37F}",
    description: "popcorn",
    category: "Food & Drink",
    aliases: ["popcorn"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F9C8}",
    description: "butter",
    category: "Food & Drink",
    aliases: ["butter"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9C2}",
    description: "salt",
    category: "Food & Drink",
    aliases: ["salt"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F96B}",
    description: "canned food",
    category: "Food & Drink",
    aliases: ["canned_food"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F371}",
    description: "bento box",
    category: "Food & Drink",
    aliases: ["bento"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F358}",
    description: "rice cracker",
    category: "Food & Drink",
    aliases: ["rice_cracker"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F359}",
    description: "rice ball",
    category: "Food & Drink",
    aliases: ["rice_ball"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F35A}",
    description: "cooked rice",
    category: "Food & Drink",
    aliases: ["rice"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F35B}",
    description: "curry rice",
    category: "Food & Drink",
    aliases: ["curry"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F35C}",
    description: "steaming bowl",
    category: "Food & Drink",
    aliases: ["ramen"],
    tags: ["noodle"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F35D}",
    description: "spaghetti",
    category: "Food & Drink",
    aliases: ["spaghetti"],
    tags: ["pasta"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F360}",
    description: "roasted sweet potato",
    category: "Food & Drink",
    aliases: ["sweet_potato"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F362}",
    description: "oden",
    category: "Food & Drink",
    aliases: ["oden"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F363}",
    description: "sushi",
    category: "Food & Drink",
    aliases: ["sushi"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F364}",
    description: "fried shrimp",
    category: "Food & Drink",
    aliases: ["fried_shrimp"],
    tags: ["tempura"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F365}",
    description: "fish cake with swirl",
    category: "Food & Drink",
    aliases: ["fish_cake"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F96E}",
    description: "moon cake",
    category: "Food & Drink",
    aliases: ["moon_cake"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F361}",
    description: "dango",
    category: "Food & Drink",
    aliases: ["dango"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F95F}",
    description: "dumpling",
    category: "Food & Drink",
    aliases: ["dumpling"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F960}",
    description: "fortune cookie",
    category: "Food & Drink",
    aliases: ["fortune_cookie"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F961}",
    description: "takeout box",
    category: "Food & Drink",
    aliases: ["takeout_box"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F980}",
    description: "crab",
    category: "Food & Drink",
    aliases: ["crab"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F99E}",
    description: "lobster",
    category: "Food & Drink",
    aliases: ["lobster"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F990}",
    description: "shrimp",
    category: "Food & Drink",
    aliases: ["shrimp"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F991}",
    description: "squid",
    category: "Food & Drink",
    aliases: ["squid"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F9AA}",
    description: "oyster",
    category: "Food & Drink",
    aliases: ["oyster"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F366}",
    description: "soft ice cream",
    category: "Food & Drink",
    aliases: ["icecream"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F367}",
    description: "shaved ice",
    category: "Food & Drink",
    aliases: ["shaved_ice"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F368}",
    description: "ice cream",
    category: "Food & Drink",
    aliases: ["ice_cream"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F369}",
    description: "doughnut",
    category: "Food & Drink",
    aliases: ["doughnut"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F36A}",
    description: "cookie",
    category: "Food & Drink",
    aliases: ["cookie"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F382}",
    description: "birthday cake",
    category: "Food & Drink",
    aliases: ["birthday"],
    tags: ["party"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F370}",
    description: "shortcake",
    category: "Food & Drink",
    aliases: ["cake"],
    tags: ["dessert"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9C1}",
    description: "cupcake",
    category: "Food & Drink",
    aliases: ["cupcake"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F967}",
    description: "pie",
    category: "Food & Drink",
    aliases: ["pie"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F36B}",
    description: "chocolate bar",
    category: "Food & Drink",
    aliases: ["chocolate_bar"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F36C}",
    description: "candy",
    category: "Food & Drink",
    aliases: ["candy"],
    tags: ["sweet"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F36D}",
    description: "lollipop",
    category: "Food & Drink",
    aliases: ["lollipop"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F36E}",
    description: "custard",
    category: "Food & Drink",
    aliases: ["custard"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F36F}",
    description: "honey pot",
    category: "Food & Drink",
    aliases: ["honey_pot"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F37C}",
    description: "baby bottle",
    category: "Food & Drink",
    aliases: ["baby_bottle"],
    tags: ["milk"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F95B}",
    description: "glass of milk",
    category: "Food & Drink",
    aliases: ["milk_glass"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u2615",
    description: "hot beverage",
    category: "Food & Drink",
    aliases: ["coffee"],
    tags: ["cafe", "espresso"],
    unicode_version: "4.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAD6}",
    description: "teapot",
    category: "Food & Drink",
    aliases: ["teapot"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F375}",
    description: "teacup without handle",
    category: "Food & Drink",
    aliases: ["tea"],
    tags: ["green", "breakfast"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F376}",
    description: "sake",
    category: "Food & Drink",
    aliases: ["sake"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F37E}",
    description: "bottle with popping cork",
    category: "Food & Drink",
    aliases: ["champagne"],
    tags: ["bottle", "bubbly", "celebration"],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F377}",
    description: "wine glass",
    category: "Food & Drink",
    aliases: ["wine_glass"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F378}",
    description: "cocktail glass",
    category: "Food & Drink",
    aliases: ["cocktail"],
    tags: ["drink"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F379}",
    description: "tropical drink",
    category: "Food & Drink",
    aliases: ["tropical_drink"],
    tags: ["summer", "vacation"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F37A}",
    description: "beer mug",
    category: "Food & Drink",
    aliases: ["beer"],
    tags: ["drink"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F37B}",
    description: "clinking beer mugs",
    category: "Food & Drink",
    aliases: ["beers"],
    tags: ["drinks"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F942}",
    description: "clinking glasses",
    category: "Food & Drink",
    aliases: ["clinking_glasses"],
    tags: ["cheers", "toast"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F943}",
    description: "tumbler glass",
    category: "Food & Drink",
    aliases: ["tumbler_glass"],
    tags: ["whisky"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F964}",
    description: "cup with straw",
    category: "Food & Drink",
    aliases: ["cup_with_straw"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9CB}",
    description: "bubble tea",
    category: "Food & Drink",
    aliases: ["bubble_tea"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F9C3}",
    description: "beverage box",
    category: "Food & Drink",
    aliases: ["beverage_box"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9C9}",
    description: "mate",
    category: "Food & Drink",
    aliases: ["mate"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9CA}",
    description: "ice",
    category: "Food & Drink",
    aliases: ["ice_cube"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F962}",
    description: "chopsticks",
    category: "Food & Drink",
    aliases: ["chopsticks"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F37D}\uFE0F",
    description: "fork and knife with plate",
    category: "Food & Drink",
    aliases: ["plate_with_cutlery"],
    tags: ["dining", "dinner"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F374}",
    description: "fork and knife",
    category: "Food & Drink",
    aliases: ["fork_and_knife"],
    tags: ["cutlery"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F944}",
    description: "spoon",
    category: "Food & Drink",
    aliases: ["spoon"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F52A}",
    description: "kitchen knife",
    category: "Food & Drink",
    aliases: ["hocho", "knife"],
    tags: ["cut", "chop"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3FA}",
    description: "amphora",
    category: "Food & Drink",
    aliases: ["amphora"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F30D}",
    description: "globe showing Europe-Africa",
    category: "Travel & Places",
    aliases: ["earth_africa"],
    tags: ["globe", "world", "international"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F30E}",
    description: "globe showing Americas",
    category: "Travel & Places",
    aliases: ["earth_americas"],
    tags: ["globe", "world", "international"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F30F}",
    description: "globe showing Asia-Australia",
    category: "Travel & Places",
    aliases: ["earth_asia"],
    tags: ["globe", "world", "international"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F310}",
    description: "globe with meridians",
    category: "Travel & Places",
    aliases: ["globe_with_meridians"],
    tags: ["world", "global", "international"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5FA}\uFE0F",
    description: "world map",
    category: "Travel & Places",
    aliases: ["world_map"],
    tags: ["travel"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5FE}",
    description: "map of Japan",
    category: "Travel & Places",
    aliases: ["japan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9ED}",
    description: "compass",
    category: "Travel & Places",
    aliases: ["compass"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3D4}\uFE0F",
    description: "snow-capped mountain",
    category: "Travel & Places",
    aliases: ["mountain_snow"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u26F0\uFE0F",
    description: "mountain",
    category: "Travel & Places",
    aliases: ["mountain"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F30B}",
    description: "volcano",
    category: "Travel & Places",
    aliases: ["volcano"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5FB}",
    description: "mount fuji",
    category: "Travel & Places",
    aliases: ["mount_fuji"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3D5}\uFE0F",
    description: "camping",
    category: "Travel & Places",
    aliases: ["camping"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3D6}\uFE0F",
    description: "beach with umbrella",
    category: "Travel & Places",
    aliases: ["beach_umbrella"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3DC}\uFE0F",
    description: "desert",
    category: "Travel & Places",
    aliases: ["desert"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3DD}\uFE0F",
    description: "desert island",
    category: "Travel & Places",
    aliases: ["desert_island"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3DE}\uFE0F",
    description: "national park",
    category: "Travel & Places",
    aliases: ["national_park"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3DF}\uFE0F",
    description: "stadium",
    category: "Travel & Places",
    aliases: ["stadium"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3DB}\uFE0F",
    description: "classical building",
    category: "Travel & Places",
    aliases: ["classical_building"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3D7}\uFE0F",
    description: "building construction",
    category: "Travel & Places",
    aliases: ["building_construction"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F9F1}",
    description: "brick",
    category: "Travel & Places",
    aliases: ["bricks"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FAA8}",
    description: "rock",
    category: "Travel & Places",
    aliases: ["rock"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1FAB5}",
    description: "wood",
    category: "Travel & Places",
    aliases: ["wood"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F6D6}",
    description: "hut",
    category: "Travel & Places",
    aliases: ["hut"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F3D8}\uFE0F",
    description: "houses",
    category: "Travel & Places",
    aliases: ["houses"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3DA}\uFE0F",
    description: "derelict house",
    category: "Travel & Places",
    aliases: ["derelict_house"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3E0}",
    description: "house",
    category: "Travel & Places",
    aliases: ["house"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3E1}",
    description: "house with garden",
    category: "Travel & Places",
    aliases: ["house_with_garden"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3E2}",
    description: "office building",
    category: "Travel & Places",
    aliases: ["office"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3E3}",
    description: "Japanese post office",
    category: "Travel & Places",
    aliases: ["post_office"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3E4}",
    description: "post office",
    category: "Travel & Places",
    aliases: ["european_post_office"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3E5}",
    description: "hospital",
    category: "Travel & Places",
    aliases: ["hospital"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3E6}",
    description: "bank",
    category: "Travel & Places",
    aliases: ["bank"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3E8}",
    description: "hotel",
    category: "Travel & Places",
    aliases: ["hotel"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3E9}",
    description: "love hotel",
    category: "Travel & Places",
    aliases: ["love_hotel"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3EA}",
    description: "convenience store",
    category: "Travel & Places",
    aliases: ["convenience_store"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3EB}",
    description: "school",
    category: "Travel & Places",
    aliases: ["school"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3EC}",
    description: "department store",
    category: "Travel & Places",
    aliases: ["department_store"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3ED}",
    description: "factory",
    category: "Travel & Places",
    aliases: ["factory"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3EF}",
    description: "Japanese castle",
    category: "Travel & Places",
    aliases: ["japanese_castle"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3F0}",
    description: "castle",
    category: "Travel & Places",
    aliases: ["european_castle"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F492}",
    description: "wedding",
    category: "Travel & Places",
    aliases: ["wedding"],
    tags: ["marriage"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5FC}",
    description: "Tokyo tower",
    category: "Travel & Places",
    aliases: ["tokyo_tower"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5FD}",
    description: "Statue of Liberty",
    category: "Travel & Places",
    aliases: ["statue_of_liberty"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u26EA",
    description: "church",
    category: "Travel & Places",
    aliases: ["church"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F54C}",
    description: "mosque",
    category: "Travel & Places",
    aliases: ["mosque"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6D5}",
    description: "hindu temple",
    category: "Travel & Places",
    aliases: ["hindu_temple"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F54D}",
    description: "synagogue",
    category: "Travel & Places",
    aliases: ["synagogue"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u26E9\uFE0F",
    description: "shinto shrine",
    category: "Travel & Places",
    aliases: ["shinto_shrine"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F54B}",
    description: "kaaba",
    category: "Travel & Places",
    aliases: ["kaaba"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u26F2",
    description: "fountain",
    category: "Travel & Places",
    aliases: ["fountain"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u26FA",
    description: "tent",
    category: "Travel & Places",
    aliases: ["tent"],
    tags: ["camping"],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F301}",
    description: "foggy",
    category: "Travel & Places",
    aliases: ["foggy"],
    tags: ["karl"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F303}",
    description: "night with stars",
    category: "Travel & Places",
    aliases: ["night_with_stars"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3D9}\uFE0F",
    description: "cityscape",
    category: "Travel & Places",
    aliases: ["cityscape"],
    tags: ["skyline"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F304}",
    description: "sunrise over mountains",
    category: "Travel & Places",
    aliases: ["sunrise_over_mountains"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F305}",
    description: "sunrise",
    category: "Travel & Places",
    aliases: ["sunrise"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F306}",
    description: "cityscape at dusk",
    category: "Travel & Places",
    aliases: ["city_sunset"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F307}",
    description: "sunset",
    category: "Travel & Places",
    aliases: ["city_sunrise"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F309}",
    description: "bridge at night",
    category: "Travel & Places",
    aliases: ["bridge_at_night"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2668\uFE0F",
    description: "hot springs",
    category: "Travel & Places",
    aliases: ["hotsprings"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3A0}",
    description: "carousel horse",
    category: "Travel & Places",
    aliases: ["carousel_horse"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3A1}",
    description: "ferris wheel",
    category: "Travel & Places",
    aliases: ["ferris_wheel"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3A2}",
    description: "roller coaster",
    category: "Travel & Places",
    aliases: ["roller_coaster"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F488}",
    description: "barber pole",
    category: "Travel & Places",
    aliases: ["barber"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3AA}",
    description: "circus tent",
    category: "Travel & Places",
    aliases: ["circus_tent"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F682}",
    description: "locomotive",
    category: "Travel & Places",
    aliases: ["steam_locomotive"],
    tags: ["train"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F683}",
    description: "railway car",
    category: "Travel & Places",
    aliases: ["railway_car"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F684}",
    description: "high-speed train",
    category: "Travel & Places",
    aliases: ["bullettrain_side"],
    tags: ["train"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F685}",
    description: "bullet train",
    category: "Travel & Places",
    aliases: ["bullettrain_front"],
    tags: ["train"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F686}",
    description: "train",
    category: "Travel & Places",
    aliases: ["train2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F687}",
    description: "metro",
    category: "Travel & Places",
    aliases: ["metro"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F688}",
    description: "light rail",
    category: "Travel & Places",
    aliases: ["light_rail"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F689}",
    description: "station",
    category: "Travel & Places",
    aliases: ["station"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F68A}",
    description: "tram",
    category: "Travel & Places",
    aliases: ["tram"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F69D}",
    description: "monorail",
    category: "Travel & Places",
    aliases: ["monorail"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F69E}",
    description: "mountain railway",
    category: "Travel & Places",
    aliases: ["mountain_railway"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F68B}",
    description: "tram car",
    category: "Travel & Places",
    aliases: ["train"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F68C}",
    description: "bus",
    category: "Travel & Places",
    aliases: ["bus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F68D}",
    description: "oncoming bus",
    category: "Travel & Places",
    aliases: ["oncoming_bus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F68E}",
    description: "trolleybus",
    category: "Travel & Places",
    aliases: ["trolleybus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F690}",
    description: "minibus",
    category: "Travel & Places",
    aliases: ["minibus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F691}",
    description: "ambulance",
    category: "Travel & Places",
    aliases: ["ambulance"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F692}",
    description: "fire engine",
    category: "Travel & Places",
    aliases: ["fire_engine"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F693}",
    description: "police car",
    category: "Travel & Places",
    aliases: ["police_car"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F694}",
    description: "oncoming police car",
    category: "Travel & Places",
    aliases: ["oncoming_police_car"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F695}",
    description: "taxi",
    category: "Travel & Places",
    aliases: ["taxi"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F696}",
    description: "oncoming taxi",
    category: "Travel & Places",
    aliases: ["oncoming_taxi"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F697}",
    description: "automobile",
    category: "Travel & Places",
    aliases: ["car", "red_car"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F698}",
    description: "oncoming automobile",
    category: "Travel & Places",
    aliases: ["oncoming_automobile"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F699}",
    description: "sport utility vehicle",
    category: "Travel & Places",
    aliases: ["blue_car"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6FB}",
    description: "pickup truck",
    category: "Travel & Places",
    aliases: ["pickup_truck"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F69A}",
    description: "delivery truck",
    category: "Travel & Places",
    aliases: ["truck"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F69B}",
    description: "articulated lorry",
    category: "Travel & Places",
    aliases: ["articulated_lorry"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F69C}",
    description: "tractor",
    category: "Travel & Places",
    aliases: ["tractor"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3CE}\uFE0F",
    description: "racing car",
    category: "Travel & Places",
    aliases: ["racing_car"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3CD}\uFE0F",
    description: "motorcycle",
    category: "Travel & Places",
    aliases: ["motorcycle"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6F5}",
    description: "motor scooter",
    category: "Travel & Places",
    aliases: ["motor_scooter"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F9BD}",
    description: "manual wheelchair",
    category: "Travel & Places",
    aliases: ["manual_wheelchair"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9BC}",
    description: "motorized wheelchair",
    category: "Travel & Places",
    aliases: ["motorized_wheelchair"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F6FA}",
    description: "auto rickshaw",
    category: "Travel & Places",
    aliases: ["auto_rickshaw"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F6B2}",
    description: "bicycle",
    category: "Travel & Places",
    aliases: ["bike"],
    tags: ["bicycle"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6F4}",
    description: "kick scooter",
    category: "Travel & Places",
    aliases: ["kick_scooter"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F6F9}",
    description: "skateboard",
    category: "Travel & Places",
    aliases: ["skateboard"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F6FC}",
    description: "roller skate",
    category: "Travel & Places",
    aliases: ["roller_skate"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F68F}",
    description: "bus stop",
    category: "Travel & Places",
    aliases: ["busstop"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6E3}\uFE0F",
    description: "motorway",
    category: "Travel & Places",
    aliases: ["motorway"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6E4}\uFE0F",
    description: "railway track",
    category: "Travel & Places",
    aliases: ["railway_track"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6E2}\uFE0F",
    description: "oil drum",
    category: "Travel & Places",
    aliases: ["oil_drum"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u26FD",
    description: "fuel pump",
    category: "Travel & Places",
    aliases: ["fuelpump"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6A8}",
    description: "police car light",
    category: "Travel & Places",
    aliases: ["rotating_light"],
    tags: ["911", "emergency"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6A5}",
    description: "horizontal traffic light",
    category: "Travel & Places",
    aliases: ["traffic_light"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6A6}",
    description: "vertical traffic light",
    category: "Travel & Places",
    aliases: ["vertical_traffic_light"],
    tags: ["semaphore"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6D1}",
    description: "stop sign",
    category: "Travel & Places",
    aliases: ["stop_sign"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F6A7}",
    description: "construction",
    category: "Travel & Places",
    aliases: ["construction"],
    tags: ["wip"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2693",
    description: "anchor",
    category: "Travel & Places",
    aliases: ["anchor"],
    tags: ["ship"],
    unicode_version: "4.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u26F5",
    description: "sailboat",
    category: "Travel & Places",
    aliases: ["boat", "sailboat"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6F6}",
    description: "canoe",
    category: "Travel & Places",
    aliases: ["canoe"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F6A4}",
    description: "speedboat",
    category: "Travel & Places",
    aliases: ["speedboat"],
    tags: ["ship"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6F3}\uFE0F",
    description: "passenger ship",
    category: "Travel & Places",
    aliases: ["passenger_ship"],
    tags: ["cruise"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u26F4\uFE0F",
    description: "ferry",
    category: "Travel & Places",
    aliases: ["ferry"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6E5}\uFE0F",
    description: "motor boat",
    category: "Travel & Places",
    aliases: ["motor_boat"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6A2}",
    description: "ship",
    category: "Travel & Places",
    aliases: ["ship"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2708\uFE0F",
    description: "airplane",
    category: "Travel & Places",
    aliases: ["airplane"],
    tags: ["flight"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6E9}\uFE0F",
    description: "small airplane",
    category: "Travel & Places",
    aliases: ["small_airplane"],
    tags: ["flight"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6EB}",
    description: "airplane departure",
    category: "Travel & Places",
    aliases: ["flight_departure"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6EC}",
    description: "airplane arrival",
    category: "Travel & Places",
    aliases: ["flight_arrival"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1FA82}",
    description: "parachute",
    category: "Travel & Places",
    aliases: ["parachute"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F4BA}",
    description: "seat",
    category: "Travel & Places",
    aliases: ["seat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F681}",
    description: "helicopter",
    category: "Travel & Places",
    aliases: ["helicopter"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F69F}",
    description: "suspension railway",
    category: "Travel & Places",
    aliases: ["suspension_railway"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6A0}",
    description: "mountain cableway",
    category: "Travel & Places",
    aliases: ["mountain_cableway"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6A1}",
    description: "aerial tramway",
    category: "Travel & Places",
    aliases: ["aerial_tramway"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6F0}\uFE0F",
    description: "satellite",
    category: "Travel & Places",
    aliases: ["artificial_satellite"],
    tags: ["orbit", "space"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F680}",
    description: "rocket",
    category: "Travel & Places",
    aliases: ["rocket"],
    tags: ["ship", "launch"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6F8}",
    description: "flying saucer",
    category: "Travel & Places",
    aliases: ["flying_saucer"],
    tags: ["ufo"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F6CE}\uFE0F",
    description: "bellhop bell",
    category: "Travel & Places",
    aliases: ["bellhop_bell"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F9F3}",
    description: "luggage",
    category: "Travel & Places",
    aliases: ["luggage"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u231B",
    description: "hourglass done",
    category: "Travel & Places",
    aliases: ["hourglass"],
    tags: ["time"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u23F3",
    description: "hourglass not done",
    category: "Travel & Places",
    aliases: ["hourglass_flowing_sand"],
    tags: ["time"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u231A",
    description: "watch",
    category: "Travel & Places",
    aliases: ["watch"],
    tags: ["time"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u23F0",
    description: "alarm clock",
    category: "Travel & Places",
    aliases: ["alarm_clock"],
    tags: ["morning"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u23F1\uFE0F",
    description: "stopwatch",
    category: "Travel & Places",
    aliases: ["stopwatch"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u23F2\uFE0F",
    description: "timer clock",
    category: "Travel & Places",
    aliases: ["timer_clock"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F570}\uFE0F",
    description: "mantelpiece clock",
    category: "Travel & Places",
    aliases: ["mantelpiece_clock"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F55B}",
    description: "twelve o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock12"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F567}",
    description: "twelve-thirty",
    category: "Travel & Places",
    aliases: ["clock1230"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F550}",
    description: "one o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock1"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F55C}",
    description: "one-thirty",
    category: "Travel & Places",
    aliases: ["clock130"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F551}",
    description: "two o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F55D}",
    description: "two-thirty",
    category: "Travel & Places",
    aliases: ["clock230"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F552}",
    description: "three o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock3"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F55E}",
    description: "three-thirty",
    category: "Travel & Places",
    aliases: ["clock330"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F553}",
    description: "four o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock4"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F55F}",
    description: "four-thirty",
    category: "Travel & Places",
    aliases: ["clock430"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F554}",
    description: "five o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock5"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F560}",
    description: "five-thirty",
    category: "Travel & Places",
    aliases: ["clock530"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F555}",
    description: "six o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock6"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F561}",
    description: "six-thirty",
    category: "Travel & Places",
    aliases: ["clock630"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F556}",
    description: "seven o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock7"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F562}",
    description: "seven-thirty",
    category: "Travel & Places",
    aliases: ["clock730"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F557}",
    description: "eight o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock8"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F563}",
    description: "eight-thirty",
    category: "Travel & Places",
    aliases: ["clock830"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F558}",
    description: "nine o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock9"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F564}",
    description: "nine-thirty",
    category: "Travel & Places",
    aliases: ["clock930"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F559}",
    description: "ten o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock10"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F565}",
    description: "ten-thirty",
    category: "Travel & Places",
    aliases: ["clock1030"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F55A}",
    description: "eleven o\u2019clock",
    category: "Travel & Places",
    aliases: ["clock11"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F566}",
    description: "eleven-thirty",
    category: "Travel & Places",
    aliases: ["clock1130"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F311}",
    description: "new moon",
    category: "Travel & Places",
    aliases: ["new_moon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F312}",
    description: "waxing crescent moon",
    category: "Travel & Places",
    aliases: ["waxing_crescent_moon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F313}",
    description: "first quarter moon",
    category: "Travel & Places",
    aliases: ["first_quarter_moon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F314}",
    description: "waxing gibbous moon",
    category: "Travel & Places",
    aliases: ["moon", "waxing_gibbous_moon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F315}",
    description: "full moon",
    category: "Travel & Places",
    aliases: ["full_moon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F316}",
    description: "waning gibbous moon",
    category: "Travel & Places",
    aliases: ["waning_gibbous_moon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F317}",
    description: "last quarter moon",
    category: "Travel & Places",
    aliases: ["last_quarter_moon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F318}",
    description: "waning crescent moon",
    category: "Travel & Places",
    aliases: ["waning_crescent_moon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F319}",
    description: "crescent moon",
    category: "Travel & Places",
    aliases: ["crescent_moon"],
    tags: ["night"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F31A}",
    description: "new moon face",
    category: "Travel & Places",
    aliases: ["new_moon_with_face"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F31B}",
    description: "first quarter moon face",
    category: "Travel & Places",
    aliases: ["first_quarter_moon_with_face"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F31C}",
    description: "last quarter moon face",
    category: "Travel & Places",
    aliases: ["last_quarter_moon_with_face"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F321}\uFE0F",
    description: "thermometer",
    category: "Travel & Places",
    aliases: ["thermometer"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u2600\uFE0F",
    description: "sun",
    category: "Travel & Places",
    aliases: ["sunny"],
    tags: ["weather"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F31D}",
    description: "full moon face",
    category: "Travel & Places",
    aliases: ["full_moon_with_face"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F31E}",
    description: "sun with face",
    category: "Travel & Places",
    aliases: ["sun_with_face"],
    tags: ["summer"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA90}",
    description: "ringed planet",
    category: "Travel & Places",
    aliases: ["ringed_planet"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u2B50",
    description: "star",
    category: "Travel & Places",
    aliases: ["star"],
    tags: [],
    unicode_version: "5.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F31F}",
    description: "glowing star",
    category: "Travel & Places",
    aliases: ["star2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F320}",
    description: "shooting star",
    category: "Travel & Places",
    aliases: ["stars"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F30C}",
    description: "milky way",
    category: "Travel & Places",
    aliases: ["milky_way"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2601\uFE0F",
    description: "cloud",
    category: "Travel & Places",
    aliases: ["cloud"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u26C5",
    description: "sun behind cloud",
    category: "Travel & Places",
    aliases: ["partly_sunny"],
    tags: ["weather", "cloud"],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u26C8\uFE0F",
    description: "cloud with lightning and rain",
    category: "Travel & Places",
    aliases: ["cloud_with_lightning_and_rain"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F324}\uFE0F",
    description: "sun behind small cloud",
    category: "Travel & Places",
    aliases: ["sun_behind_small_cloud"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F325}\uFE0F",
    description: "sun behind large cloud",
    category: "Travel & Places",
    aliases: ["sun_behind_large_cloud"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F326}\uFE0F",
    description: "sun behind rain cloud",
    category: "Travel & Places",
    aliases: ["sun_behind_rain_cloud"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F327}\uFE0F",
    description: "cloud with rain",
    category: "Travel & Places",
    aliases: ["cloud_with_rain"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F328}\uFE0F",
    description: "cloud with snow",
    category: "Travel & Places",
    aliases: ["cloud_with_snow"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F329}\uFE0F",
    description: "cloud with lightning",
    category: "Travel & Places",
    aliases: ["cloud_with_lightning"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F32A}\uFE0F",
    description: "tornado",
    category: "Travel & Places",
    aliases: ["tornado"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F32B}\uFE0F",
    description: "fog",
    category: "Travel & Places",
    aliases: ["fog"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F32C}\uFE0F",
    description: "wind face",
    category: "Travel & Places",
    aliases: ["wind_face"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F300}",
    description: "cyclone",
    category: "Travel & Places",
    aliases: ["cyclone"],
    tags: ["swirl"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F308}",
    description: "rainbow",
    category: "Travel & Places",
    aliases: ["rainbow"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F302}",
    description: "closed umbrella",
    category: "Travel & Places",
    aliases: ["closed_umbrella"],
    tags: ["weather", "rain"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2602\uFE0F",
    description: "umbrella",
    category: "Travel & Places",
    aliases: ["open_umbrella"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u2614",
    description: "umbrella with rain drops",
    category: "Travel & Places",
    aliases: ["umbrella"],
    tags: ["rain", "weather"],
    unicode_version: "4.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u26F1\uFE0F",
    description: "umbrella on ground",
    category: "Travel & Places",
    aliases: ["parasol_on_ground"],
    tags: ["beach_umbrella"],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u26A1",
    description: "high voltage",
    category: "Travel & Places",
    aliases: ["zap"],
    tags: ["lightning", "thunder"],
    unicode_version: "4.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2744\uFE0F",
    description: "snowflake",
    category: "Travel & Places",
    aliases: ["snowflake"],
    tags: ["winter", "cold", "weather"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2603\uFE0F",
    description: "snowman",
    category: "Travel & Places",
    aliases: ["snowman_with_snow"],
    tags: ["winter", "christmas"],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u26C4",
    description: "snowman without snow",
    category: "Travel & Places",
    aliases: ["snowman"],
    tags: ["winter"],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u2604\uFE0F",
    description: "comet",
    category: "Travel & Places",
    aliases: ["comet"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F525}",
    description: "fire",
    category: "Travel & Places",
    aliases: ["fire"],
    tags: ["burn"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4A7}",
    description: "droplet",
    category: "Travel & Places",
    aliases: ["droplet"],
    tags: ["water"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F30A}",
    description: "water wave",
    category: "Travel & Places",
    aliases: ["ocean"],
    tags: ["sea"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F383}",
    description: "jack-o-lantern",
    category: "Activities",
    aliases: ["jack_o_lantern"],
    tags: ["halloween"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F384}",
    description: "Christmas tree",
    category: "Activities",
    aliases: ["christmas_tree"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F386}",
    description: "fireworks",
    category: "Activities",
    aliases: ["fireworks"],
    tags: ["festival", "celebration"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F387}",
    description: "sparkler",
    category: "Activities",
    aliases: ["sparkler"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9E8}",
    description: "firecracker",
    category: "Activities",
    aliases: ["firecracker"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u2728",
    description: "sparkles",
    category: "Activities",
    aliases: ["sparkles"],
    tags: ["shiny"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F388}",
    description: "balloon",
    category: "Activities",
    aliases: ["balloon"],
    tags: ["party", "birthday"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F389}",
    description: "party popper",
    category: "Activities",
    aliases: ["tada"],
    tags: ["hooray", "party"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F38A}",
    description: "confetti ball",
    category: "Activities",
    aliases: ["confetti_ball"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F38B}",
    description: "tanabata tree",
    category: "Activities",
    aliases: ["tanabata_tree"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F38D}",
    description: "pine decoration",
    category: "Activities",
    aliases: ["bamboo"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F38E}",
    description: "Japanese dolls",
    category: "Activities",
    aliases: ["dolls"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F38F}",
    description: "carp streamer",
    category: "Activities",
    aliases: ["flags"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F390}",
    description: "wind chime",
    category: "Activities",
    aliases: ["wind_chime"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F391}",
    description: "moon viewing ceremony",
    category: "Activities",
    aliases: ["rice_scene"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9E7}",
    description: "red envelope",
    category: "Activities",
    aliases: ["red_envelope"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F380}",
    description: "ribbon",
    category: "Activities",
    aliases: ["ribbon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F381}",
    description: "wrapped gift",
    category: "Activities",
    aliases: ["gift"],
    tags: ["present", "birthday", "christmas"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F397}\uFE0F",
    description: "reminder ribbon",
    category: "Activities",
    aliases: ["reminder_ribbon"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F39F}\uFE0F",
    description: "admission tickets",
    category: "Activities",
    aliases: ["tickets"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3AB}",
    description: "ticket",
    category: "Activities",
    aliases: ["ticket"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F396}\uFE0F",
    description: "military medal",
    category: "Activities",
    aliases: ["medal_military"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3C6}",
    description: "trophy",
    category: "Activities",
    aliases: ["trophy"],
    tags: ["award", "contest", "winner"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3C5}",
    description: "sports medal",
    category: "Activities",
    aliases: ["medal_sports"],
    tags: ["gold", "winner"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F947}",
    description: "1st place medal",
    category: "Activities",
    aliases: ["1st_place_medal"],
    tags: ["gold"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F948}",
    description: "2nd place medal",
    category: "Activities",
    aliases: ["2nd_place_medal"],
    tags: ["silver"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F949}",
    description: "3rd place medal",
    category: "Activities",
    aliases: ["3rd_place_medal"],
    tags: ["bronze"],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u26BD",
    description: "soccer ball",
    category: "Activities",
    aliases: ["soccer"],
    tags: ["sports"],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u26BE",
    description: "baseball",
    category: "Activities",
    aliases: ["baseball"],
    tags: ["sports"],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F94E}",
    description: "softball",
    category: "Activities",
    aliases: ["softball"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3C0}",
    description: "basketball",
    category: "Activities",
    aliases: ["basketball"],
    tags: ["sports"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3D0}",
    description: "volleyball",
    category: "Activities",
    aliases: ["volleyball"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3C8}",
    description: "american football",
    category: "Activities",
    aliases: ["football"],
    tags: ["sports"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3C9}",
    description: "rugby football",
    category: "Activities",
    aliases: ["rugby_football"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3BE}",
    description: "tennis",
    category: "Activities",
    aliases: ["tennis"],
    tags: ["sports"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F94F}",
    description: "flying disc",
    category: "Activities",
    aliases: ["flying_disc"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3B3}",
    description: "bowling",
    category: "Activities",
    aliases: ["bowling"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3CF}",
    description: "cricket game",
    category: "Activities",
    aliases: ["cricket_game"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3D1}",
    description: "field hockey",
    category: "Activities",
    aliases: ["field_hockey"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3D2}",
    description: "ice hockey",
    category: "Activities",
    aliases: ["ice_hockey"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F94D}",
    description: "lacrosse",
    category: "Activities",
    aliases: ["lacrosse"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3D3}",
    description: "ping pong",
    category: "Activities",
    aliases: ["ping_pong"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3F8}",
    description: "badminton",
    category: "Activities",
    aliases: ["badminton"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F94A}",
    description: "boxing glove",
    category: "Activities",
    aliases: ["boxing_glove"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F94B}",
    description: "martial arts uniform",
    category: "Activities",
    aliases: ["martial_arts_uniform"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F945}",
    description: "goal net",
    category: "Activities",
    aliases: ["goal_net"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u26F3",
    description: "flag in hole",
    category: "Activities",
    aliases: ["golf"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u26F8\uFE0F",
    description: "ice skate",
    category: "Activities",
    aliases: ["ice_skate"],
    tags: ["skating"],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3A3}",
    description: "fishing pole",
    category: "Activities",
    aliases: ["fishing_pole_and_fish"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F93F}",
    description: "diving mask",
    category: "Activities",
    aliases: ["diving_mask"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F3BD}",
    description: "running shirt",
    category: "Activities",
    aliases: ["running_shirt_with_sash"],
    tags: ["marathon"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3BF}",
    description: "skis",
    category: "Activities",
    aliases: ["ski"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6F7}",
    description: "sled",
    category: "Activities",
    aliases: ["sled"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F94C}",
    description: "curling stone",
    category: "Activities",
    aliases: ["curling_stone"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3AF}",
    description: "bullseye",
    category: "Activities",
    aliases: ["dart"],
    tags: ["target"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA80}",
    description: "yo-yo",
    category: "Activities",
    aliases: ["yo_yo"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1FA81}",
    description: "kite",
    category: "Activities",
    aliases: ["kite"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F3B1}",
    description: "pool 8 ball",
    category: "Activities",
    aliases: ["8ball"],
    tags: ["pool", "billiards"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F52E}",
    description: "crystal ball",
    category: "Activities",
    aliases: ["crystal_ball"],
    tags: ["fortune"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA84}",
    description: "magic wand",
    category: "Activities",
    aliases: ["magic_wand"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F9FF}",
    description: "nazar amulet",
    category: "Activities",
    aliases: ["nazar_amulet"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3AE}",
    description: "video game",
    category: "Activities",
    aliases: ["video_game"],
    tags: ["play", "controller", "console"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F579}\uFE0F",
    description: "joystick",
    category: "Activities",
    aliases: ["joystick"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3B0}",
    description: "slot machine",
    category: "Activities",
    aliases: ["slot_machine"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3B2}",
    description: "game die",
    category: "Activities",
    aliases: ["game_die"],
    tags: ["dice", "gambling"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9E9}",
    description: "puzzle piece",
    category: "Activities",
    aliases: ["jigsaw"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9F8}",
    description: "teddy bear",
    category: "Activities",
    aliases: ["teddy_bear"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FA85}",
    description: "pi\xF1ata",
    category: "Activities",
    aliases: ["pinata"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1FA86}",
    description: "nesting dolls",
    category: "Activities",
    aliases: ["nesting_dolls"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u2660\uFE0F",
    description: "spade suit",
    category: "Activities",
    aliases: ["spades"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2665\uFE0F",
    description: "heart suit",
    category: "Activities",
    aliases: ["hearts"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2666\uFE0F",
    description: "diamond suit",
    category: "Activities",
    aliases: ["diamonds"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2663\uFE0F",
    description: "club suit",
    category: "Activities",
    aliases: ["clubs"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u265F\uFE0F",
    description: "chess pawn",
    category: "Activities",
    aliases: ["chess_pawn"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F0CF}",
    description: "joker",
    category: "Activities",
    aliases: ["black_joker"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F004}",
    description: "mahjong red dragon",
    category: "Activities",
    aliases: ["mahjong"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3B4}",
    description: "flower playing cards",
    category: "Activities",
    aliases: ["flower_playing_cards"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3AD}",
    description: "performing arts",
    category: "Activities",
    aliases: ["performing_arts"],
    tags: ["theater", "drama"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5BC}\uFE0F",
    description: "framed picture",
    category: "Activities",
    aliases: ["framed_picture"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3A8}",
    description: "artist palette",
    category: "Activities",
    aliases: ["art"],
    tags: ["design", "paint"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9F5}",
    description: "thread",
    category: "Activities",
    aliases: ["thread"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FAA1}",
    description: "sewing needle",
    category: "Activities",
    aliases: ["sewing_needle"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F9F6}",
    description: "yarn",
    category: "Activities",
    aliases: ["yarn"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FAA2}",
    description: "knot",
    category: "Activities",
    aliases: ["knot"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F453}",
    description: "glasses",
    category: "Objects",
    aliases: ["eyeglasses"],
    tags: ["glasses"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F576}\uFE0F",
    description: "sunglasses",
    category: "Objects",
    aliases: ["dark_sunglasses"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F97D}",
    description: "goggles",
    category: "Objects",
    aliases: ["goggles"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F97C}",
    description: "lab coat",
    category: "Objects",
    aliases: ["lab_coat"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9BA}",
    description: "safety vest",
    category: "Objects",
    aliases: ["safety_vest"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F454}",
    description: "necktie",
    category: "Objects",
    aliases: ["necktie"],
    tags: ["shirt", "formal"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F455}",
    description: "t-shirt",
    category: "Objects",
    aliases: ["shirt", "tshirt"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F456}",
    description: "jeans",
    category: "Objects",
    aliases: ["jeans"],
    tags: ["pants"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9E3}",
    description: "scarf",
    category: "Objects",
    aliases: ["scarf"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9E4}",
    description: "gloves",
    category: "Objects",
    aliases: ["gloves"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9E5}",
    description: "coat",
    category: "Objects",
    aliases: ["coat"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9E6}",
    description: "socks",
    category: "Objects",
    aliases: ["socks"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F457}",
    description: "dress",
    category: "Objects",
    aliases: ["dress"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F458}",
    description: "kimono",
    category: "Objects",
    aliases: ["kimono"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F97B}",
    description: "sari",
    category: "Objects",
    aliases: ["sari"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1FA71}",
    description: "one-piece swimsuit",
    category: "Objects",
    aliases: ["one_piece_swimsuit"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1FA72}",
    description: "briefs",
    category: "Objects",
    aliases: ["swim_brief"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1FA73}",
    description: "shorts",
    category: "Objects",
    aliases: ["shorts"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F459}",
    description: "bikini",
    category: "Objects",
    aliases: ["bikini"],
    tags: ["beach"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F45A}",
    description: "woman\u2019s clothes",
    category: "Objects",
    aliases: ["womans_clothes"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F45B}",
    description: "purse",
    category: "Objects",
    aliases: ["purse"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F45C}",
    description: "handbag",
    category: "Objects",
    aliases: ["handbag"],
    tags: ["bag"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F45D}",
    description: "clutch bag",
    category: "Objects",
    aliases: ["pouch"],
    tags: ["bag"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6CD}\uFE0F",
    description: "shopping bags",
    category: "Objects",
    aliases: ["shopping"],
    tags: ["bags"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F392}",
    description: "backpack",
    category: "Objects",
    aliases: ["school_satchel"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA74}",
    description: "thong sandal",
    category: "Objects",
    aliases: ["thong_sandal"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F45E}",
    description: "man\u2019s shoe",
    category: "Objects",
    aliases: ["mans_shoe", "shoe"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F45F}",
    description: "running shoe",
    category: "Objects",
    aliases: ["athletic_shoe"],
    tags: ["sneaker", "sport", "running"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F97E}",
    description: "hiking boot",
    category: "Objects",
    aliases: ["hiking_boot"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F97F}",
    description: "flat shoe",
    category: "Objects",
    aliases: ["flat_shoe"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F460}",
    description: "high-heeled shoe",
    category: "Objects",
    aliases: ["high_heel"],
    tags: ["shoe"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F461}",
    description: "woman\u2019s sandal",
    category: "Objects",
    aliases: ["sandal"],
    tags: ["shoe"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA70}",
    description: "ballet shoes",
    category: "Objects",
    aliases: ["ballet_shoes"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F462}",
    description: "woman\u2019s boot",
    category: "Objects",
    aliases: ["boot"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F451}",
    description: "crown",
    category: "Objects",
    aliases: ["crown"],
    tags: ["king", "queen", "royal"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F452}",
    description: "woman\u2019s hat",
    category: "Objects",
    aliases: ["womans_hat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3A9}",
    description: "top hat",
    category: "Objects",
    aliases: ["tophat"],
    tags: ["hat", "classy"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F393}",
    description: "graduation cap",
    category: "Objects",
    aliases: ["mortar_board"],
    tags: ["education", "college", "university", "graduation"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9E2}",
    description: "billed cap",
    category: "Objects",
    aliases: ["billed_cap"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FA96}",
    description: "military helmet",
    category: "Objects",
    aliases: ["military_helmet"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u26D1\uFE0F",
    description: "rescue worker\u2019s helmet",
    category: "Objects",
    aliases: ["rescue_worker_helmet"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4FF}",
    description: "prayer beads",
    category: "Objects",
    aliases: ["prayer_beads"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F484}",
    description: "lipstick",
    category: "Objects",
    aliases: ["lipstick"],
    tags: ["makeup"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F48D}",
    description: "ring",
    category: "Objects",
    aliases: ["ring"],
    tags: ["wedding", "marriage", "engaged"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F48E}",
    description: "gem stone",
    category: "Objects",
    aliases: ["gem"],
    tags: ["diamond"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F507}",
    description: "muted speaker",
    category: "Objects",
    aliases: ["mute"],
    tags: ["sound", "volume"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F508}",
    description: "speaker low volume",
    category: "Objects",
    aliases: ["speaker"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F509}",
    description: "speaker medium volume",
    category: "Objects",
    aliases: ["sound"],
    tags: ["volume"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F50A}",
    description: "speaker high volume",
    category: "Objects",
    aliases: ["loud_sound"],
    tags: ["volume"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E2}",
    description: "loudspeaker",
    category: "Objects",
    aliases: ["loudspeaker"],
    tags: ["announcement"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E3}",
    description: "megaphone",
    category: "Objects",
    aliases: ["mega"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4EF}",
    description: "postal horn",
    category: "Objects",
    aliases: ["postal_horn"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F514}",
    description: "bell",
    category: "Objects",
    aliases: ["bell"],
    tags: ["sound", "notification"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F515}",
    description: "bell with slash",
    category: "Objects",
    aliases: ["no_bell"],
    tags: ["volume", "off"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3BC}",
    description: "musical score",
    category: "Objects",
    aliases: ["musical_score"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3B5}",
    description: "musical note",
    category: "Objects",
    aliases: ["musical_note"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3B6}",
    description: "musical notes",
    category: "Objects",
    aliases: ["notes"],
    tags: ["music"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F399}\uFE0F",
    description: "studio microphone",
    category: "Objects",
    aliases: ["studio_microphone"],
    tags: ["podcast"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F39A}\uFE0F",
    description: "level slider",
    category: "Objects",
    aliases: ["level_slider"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F39B}\uFE0F",
    description: "control knobs",
    category: "Objects",
    aliases: ["control_knobs"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3A4}",
    description: "microphone",
    category: "Objects",
    aliases: ["microphone"],
    tags: ["sing"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3A7}",
    description: "headphone",
    category: "Objects",
    aliases: ["headphones"],
    tags: ["music", "earphones"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4FB}",
    description: "radio",
    category: "Objects",
    aliases: ["radio"],
    tags: ["podcast"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3B7}",
    description: "saxophone",
    category: "Objects",
    aliases: ["saxophone"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA97}",
    description: "accordion",
    category: "Objects",
    aliases: ["accordion"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F3B8}",
    description: "guitar",
    category: "Objects",
    aliases: ["guitar"],
    tags: ["rock"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3B9}",
    description: "musical keyboard",
    category: "Objects",
    aliases: ["musical_keyboard"],
    tags: ["piano"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3BA}",
    description: "trumpet",
    category: "Objects",
    aliases: ["trumpet"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3BB}",
    description: "violin",
    category: "Objects",
    aliases: ["violin"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA95}",
    description: "banjo",
    category: "Objects",
    aliases: ["banjo"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F941}",
    description: "drum",
    category: "Objects",
    aliases: ["drum"],
    tags: [],
    unicode_version: "",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1FA98}",
    description: "long drum",
    category: "Objects",
    aliases: ["long_drum"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F4F1}",
    description: "mobile phone",
    category: "Objects",
    aliases: ["iphone"],
    tags: ["smartphone", "mobile"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4F2}",
    description: "mobile phone with arrow",
    category: "Objects",
    aliases: ["calling"],
    tags: ["call", "incoming"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u260E\uFE0F",
    description: "telephone",
    category: "Objects",
    aliases: ["phone", "telephone"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4DE}",
    description: "telephone receiver",
    category: "Objects",
    aliases: ["telephone_receiver"],
    tags: ["phone", "call"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4DF}",
    description: "pager",
    category: "Objects",
    aliases: ["pager"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E0}",
    description: "fax machine",
    category: "Objects",
    aliases: ["fax"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F50B}",
    description: "battery",
    category: "Objects",
    aliases: ["battery"],
    tags: ["power"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F50C}",
    description: "electric plug",
    category: "Objects",
    aliases: ["electric_plug"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4BB}",
    description: "laptop",
    category: "Objects",
    aliases: ["computer"],
    tags: ["desktop", "screen"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5A5}\uFE0F",
    description: "desktop computer",
    category: "Objects",
    aliases: ["desktop_computer"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5A8}\uFE0F",
    description: "printer",
    category: "Objects",
    aliases: ["printer"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u2328\uFE0F",
    description: "keyboard",
    category: "Objects",
    aliases: ["keyboard"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5B1}\uFE0F",
    description: "computer mouse",
    category: "Objects",
    aliases: ["computer_mouse"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5B2}\uFE0F",
    description: "trackball",
    category: "Objects",
    aliases: ["trackball"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4BD}",
    description: "computer disk",
    category: "Objects",
    aliases: ["minidisc"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4BE}",
    description: "floppy disk",
    category: "Objects",
    aliases: ["floppy_disk"],
    tags: ["save"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4BF}",
    description: "optical disk",
    category: "Objects",
    aliases: ["cd"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4C0}",
    description: "dvd",
    category: "Objects",
    aliases: ["dvd"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9EE}",
    description: "abacus",
    category: "Objects",
    aliases: ["abacus"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3A5}",
    description: "movie camera",
    category: "Objects",
    aliases: ["movie_camera"],
    tags: ["film", "video"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F39E}\uFE0F",
    description: "film frames",
    category: "Objects",
    aliases: ["film_strip"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4FD}\uFE0F",
    description: "film projector",
    category: "Objects",
    aliases: ["film_projector"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3AC}",
    description: "clapper board",
    category: "Objects",
    aliases: ["clapper"],
    tags: ["film"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4FA}",
    description: "television",
    category: "Objects",
    aliases: ["tv"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4F7}",
    description: "camera",
    category: "Objects",
    aliases: ["camera"],
    tags: ["photo"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4F8}",
    description: "camera with flash",
    category: "Objects",
    aliases: ["camera_flash"],
    tags: ["photo"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4F9}",
    description: "video camera",
    category: "Objects",
    aliases: ["video_camera"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4FC}",
    description: "videocassette",
    category: "Objects",
    aliases: ["vhs"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F50D}",
    description: "magnifying glass tilted left",
    category: "Objects",
    aliases: ["mag"],
    tags: ["search", "zoom"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F50E}",
    description: "magnifying glass tilted right",
    category: "Objects",
    aliases: ["mag_right"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F56F}\uFE0F",
    description: "candle",
    category: "Objects",
    aliases: ["candle"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4A1}",
    description: "light bulb",
    category: "Objects",
    aliases: ["bulb"],
    tags: ["idea", "light"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F526}",
    description: "flashlight",
    category: "Objects",
    aliases: ["flashlight"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3EE}",
    description: "red paper lantern",
    category: "Objects",
    aliases: ["izakaya_lantern", "lantern"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA94}",
    description: "diya lamp",
    category: "Objects",
    aliases: ["diya_lamp"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F4D4}",
    description: "notebook with decorative cover",
    category: "Objects",
    aliases: ["notebook_with_decorative_cover"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4D5}",
    description: "closed book",
    category: "Objects",
    aliases: ["closed_book"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4D6}",
    description: "open book",
    category: "Objects",
    aliases: ["book", "open_book"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4D7}",
    description: "green book",
    category: "Objects",
    aliases: ["green_book"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4D8}",
    description: "blue book",
    category: "Objects",
    aliases: ["blue_book"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4D9}",
    description: "orange book",
    category: "Objects",
    aliases: ["orange_book"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4DA}",
    description: "books",
    category: "Objects",
    aliases: ["books"],
    tags: ["library"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4D3}",
    description: "notebook",
    category: "Objects",
    aliases: ["notebook"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4D2}",
    description: "ledger",
    category: "Objects",
    aliases: ["ledger"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4C3}",
    description: "page with curl",
    category: "Objects",
    aliases: ["page_with_curl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4DC}",
    description: "scroll",
    category: "Objects",
    aliases: ["scroll"],
    tags: ["document"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4C4}",
    description: "page facing up",
    category: "Objects",
    aliases: ["page_facing_up"],
    tags: ["document"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4F0}",
    description: "newspaper",
    category: "Objects",
    aliases: ["newspaper"],
    tags: ["press"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5DE}\uFE0F",
    description: "rolled-up newspaper",
    category: "Objects",
    aliases: ["newspaper_roll"],
    tags: ["press"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4D1}",
    description: "bookmark tabs",
    category: "Objects",
    aliases: ["bookmark_tabs"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F516}",
    description: "bookmark",
    category: "Objects",
    aliases: ["bookmark"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3F7}\uFE0F",
    description: "label",
    category: "Objects",
    aliases: ["label"],
    tags: ["tag"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4B0}",
    description: "money bag",
    category: "Objects",
    aliases: ["moneybag"],
    tags: ["dollar", "cream"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA99}",
    description: "coin",
    category: "Objects",
    aliases: ["coin"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F4B4}",
    description: "yen banknote",
    category: "Objects",
    aliases: ["yen"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4B5}",
    description: "dollar banknote",
    category: "Objects",
    aliases: ["dollar"],
    tags: ["money"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4B6}",
    description: "euro banknote",
    category: "Objects",
    aliases: ["euro"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4B7}",
    description: "pound banknote",
    category: "Objects",
    aliases: ["pound"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4B8}",
    description: "money with wings",
    category: "Objects",
    aliases: ["money_with_wings"],
    tags: ["dollar"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4B3}",
    description: "credit card",
    category: "Objects",
    aliases: ["credit_card"],
    tags: ["subscription"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F9FE}",
    description: "receipt",
    category: "Objects",
    aliases: ["receipt"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F4B9}",
    description: "chart increasing with yen",
    category: "Objects",
    aliases: ["chart"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2709\uFE0F",
    description: "envelope",
    category: "Objects",
    aliases: ["envelope"],
    tags: ["letter", "email"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E7}",
    description: "e-mail",
    category: "Objects",
    aliases: ["email", "e-mail"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E8}",
    description: "incoming envelope",
    category: "Objects",
    aliases: ["incoming_envelope"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E9}",
    description: "envelope with arrow",
    category: "Objects",
    aliases: ["envelope_with_arrow"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E4}",
    description: "outbox tray",
    category: "Objects",
    aliases: ["outbox_tray"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E5}",
    description: "inbox tray",
    category: "Objects",
    aliases: ["inbox_tray"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E6}",
    description: "package",
    category: "Objects",
    aliases: ["package"],
    tags: ["shipping"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4EB}",
    description: "closed mailbox with raised flag",
    category: "Objects",
    aliases: ["mailbox"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4EA}",
    description: "closed mailbox with lowered flag",
    category: "Objects",
    aliases: ["mailbox_closed"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4EC}",
    description: "open mailbox with raised flag",
    category: "Objects",
    aliases: ["mailbox_with_mail"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4ED}",
    description: "open mailbox with lowered flag",
    category: "Objects",
    aliases: ["mailbox_with_no_mail"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4EE}",
    description: "postbox",
    category: "Objects",
    aliases: ["postbox"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5F3}\uFE0F",
    description: "ballot box with ballot",
    category: "Objects",
    aliases: ["ballot_box"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u270F\uFE0F",
    description: "pencil",
    category: "Objects",
    aliases: ["pencil2"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2712\uFE0F",
    description: "black nib",
    category: "Objects",
    aliases: ["black_nib"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F58B}\uFE0F",
    description: "fountain pen",
    category: "Objects",
    aliases: ["fountain_pen"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F58A}\uFE0F",
    description: "pen",
    category: "Objects",
    aliases: ["pen"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F58C}\uFE0F",
    description: "paintbrush",
    category: "Objects",
    aliases: ["paintbrush"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F58D}\uFE0F",
    description: "crayon",
    category: "Objects",
    aliases: ["crayon"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4DD}",
    description: "memo",
    category: "Objects",
    aliases: ["memo", "pencil"],
    tags: ["document", "note"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4BC}",
    description: "briefcase",
    category: "Objects",
    aliases: ["briefcase"],
    tags: ["business"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4C1}",
    description: "file folder",
    category: "Objects",
    aliases: ["file_folder"],
    tags: ["directory"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4C2}",
    description: "open file folder",
    category: "Objects",
    aliases: ["open_file_folder"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5C2}\uFE0F",
    description: "card index dividers",
    category: "Objects",
    aliases: ["card_index_dividers"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4C5}",
    description: "calendar",
    category: "Objects",
    aliases: ["date"],
    tags: ["calendar", "schedule"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4C6}",
    description: "tear-off calendar",
    category: "Objects",
    aliases: ["calendar"],
    tags: ["schedule"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5D2}\uFE0F",
    description: "spiral notepad",
    category: "Objects",
    aliases: ["spiral_notepad"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5D3}\uFE0F",
    description: "spiral calendar",
    category: "Objects",
    aliases: ["spiral_calendar"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4C7}",
    description: "card index",
    category: "Objects",
    aliases: ["card_index"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4C8}",
    description: "chart increasing",
    category: "Objects",
    aliases: ["chart_with_upwards_trend"],
    tags: ["graph", "metrics"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4C9}",
    description: "chart decreasing",
    category: "Objects",
    aliases: ["chart_with_downwards_trend"],
    tags: ["graph", "metrics"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4CA}",
    description: "bar chart",
    category: "Objects",
    aliases: ["bar_chart"],
    tags: ["stats", "metrics"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4CB}",
    description: "clipboard",
    category: "Objects",
    aliases: ["clipboard"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4CC}",
    description: "pushpin",
    category: "Objects",
    aliases: ["pushpin"],
    tags: ["location"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4CD}",
    description: "round pushpin",
    category: "Objects",
    aliases: ["round_pushpin"],
    tags: ["location"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4CE}",
    description: "paperclip",
    category: "Objects",
    aliases: ["paperclip"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F587}\uFE0F",
    description: "linked paperclips",
    category: "Objects",
    aliases: ["paperclips"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F4CF}",
    description: "straight ruler",
    category: "Objects",
    aliases: ["straight_ruler"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4D0}",
    description: "triangular ruler",
    category: "Objects",
    aliases: ["triangular_ruler"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2702\uFE0F",
    description: "scissors",
    category: "Objects",
    aliases: ["scissors"],
    tags: ["cut"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5C3}\uFE0F",
    description: "card file box",
    category: "Objects",
    aliases: ["card_file_box"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5C4}\uFE0F",
    description: "file cabinet",
    category: "Objects",
    aliases: ["file_cabinet"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5D1}\uFE0F",
    description: "wastebasket",
    category: "Objects",
    aliases: ["wastebasket"],
    tags: ["trash"],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F512}",
    description: "locked",
    category: "Objects",
    aliases: ["lock"],
    tags: ["security", "private"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F513}",
    description: "unlocked",
    category: "Objects",
    aliases: ["unlock"],
    tags: ["security"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F50F}",
    description: "locked with pen",
    category: "Objects",
    aliases: ["lock_with_ink_pen"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F510}",
    description: "locked with key",
    category: "Objects",
    aliases: ["closed_lock_with_key"],
    tags: ["security"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F511}",
    description: "key",
    category: "Objects",
    aliases: ["key"],
    tags: ["lock", "password"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F5DD}\uFE0F",
    description: "old key",
    category: "Objects",
    aliases: ["old_key"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F528}",
    description: "hammer",
    category: "Objects",
    aliases: ["hammer"],
    tags: ["tool"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA93}",
    description: "axe",
    category: "Objects",
    aliases: ["axe"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u26CF\uFE0F",
    description: "pick",
    category: "Objects",
    aliases: ["pick"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u2692\uFE0F",
    description: "hammer and pick",
    category: "Objects",
    aliases: ["hammer_and_pick"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6E0}\uFE0F",
    description: "hammer and wrench",
    category: "Objects",
    aliases: ["hammer_and_wrench"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5E1}\uFE0F",
    description: "dagger",
    category: "Objects",
    aliases: ["dagger"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u2694\uFE0F",
    description: "crossed swords",
    category: "Objects",
    aliases: ["crossed_swords"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F52B}",
    description: "water pistol",
    category: "Objects",
    aliases: ["gun"],
    tags: ["shoot", "weapon"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA83}",
    description: "boomerang",
    category: "Objects",
    aliases: ["boomerang"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F3F9}",
    description: "bow and arrow",
    category: "Objects",
    aliases: ["bow_and_arrow"],
    tags: ["archery"],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6E1}\uFE0F",
    description: "shield",
    category: "Objects",
    aliases: ["shield"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1FA9A}",
    description: "carpentry saw",
    category: "Objects",
    aliases: ["carpentry_saw"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F527}",
    description: "wrench",
    category: "Objects",
    aliases: ["wrench"],
    tags: ["tool"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA9B}",
    description: "screwdriver",
    category: "Objects",
    aliases: ["screwdriver"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F529}",
    description: "nut and bolt",
    category: "Objects",
    aliases: ["nut_and_bolt"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2699\uFE0F",
    description: "gear",
    category: "Objects",
    aliases: ["gear"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5DC}\uFE0F",
    description: "clamp",
    category: "Objects",
    aliases: ["clamp"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u2696\uFE0F",
    description: "balance scale",
    category: "Objects",
    aliases: ["balance_scale"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F9AF}",
    description: "white cane",
    category: "Objects",
    aliases: ["probing_cane"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F517}",
    description: "link",
    category: "Objects",
    aliases: ["link"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u26D3\uFE0F",
    description: "chains",
    category: "Objects",
    aliases: ["chains"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1FA9D}",
    description: "hook",
    category: "Objects",
    aliases: ["hook"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F9F0}",
    description: "toolbox",
    category: "Objects",
    aliases: ["toolbox"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9F2}",
    description: "magnet",
    category: "Objects",
    aliases: ["magnet"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FA9C}",
    description: "ladder",
    category: "Objects",
    aliases: ["ladder"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u2697\uFE0F",
    description: "alembic",
    category: "Objects",
    aliases: ["alembic"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F9EA}",
    description: "test tube",
    category: "Objects",
    aliases: ["test_tube"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9EB}",
    description: "petri dish",
    category: "Objects",
    aliases: ["petri_dish"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9EC}",
    description: "dna",
    category: "Objects",
    aliases: ["dna"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F52C}",
    description: "microscope",
    category: "Objects",
    aliases: ["microscope"],
    tags: ["science", "laboratory", "investigate"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F52D}",
    description: "telescope",
    category: "Objects",
    aliases: ["telescope"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4E1}",
    description: "satellite antenna",
    category: "Objects",
    aliases: ["satellite"],
    tags: ["signal"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F489}",
    description: "syringe",
    category: "Objects",
    aliases: ["syringe"],
    tags: ["health", "hospital", "needle"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA78}",
    description: "drop of blood",
    category: "Objects",
    aliases: ["drop_of_blood"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F48A}",
    description: "pill",
    category: "Objects",
    aliases: ["pill"],
    tags: ["health", "medicine"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FA79}",
    description: "adhesive bandage",
    category: "Objects",
    aliases: ["adhesive_bandage"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1FA7A}",
    description: "stethoscope",
    category: "Objects",
    aliases: ["stethoscope"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F6AA}",
    description: "door",
    category: "Objects",
    aliases: ["door"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6D7}",
    description: "elevator",
    category: "Objects",
    aliases: ["elevator"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1FA9E}",
    description: "mirror",
    category: "Objects",
    aliases: ["mirror"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1FA9F}",
    description: "window",
    category: "Objects",
    aliases: ["window"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F6CF}\uFE0F",
    description: "bed",
    category: "Objects",
    aliases: ["bed"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F6CB}\uFE0F",
    description: "couch and lamp",
    category: "Objects",
    aliases: ["couch_and_lamp"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1FA91}",
    description: "chair",
    category: "Objects",
    aliases: ["chair"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F6BD}",
    description: "toilet",
    category: "Objects",
    aliases: ["toilet"],
    tags: ["wc"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAA0}",
    description: "plunger",
    category: "Objects",
    aliases: ["plunger"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F6BF}",
    description: "shower",
    category: "Objects",
    aliases: ["shower"],
    tags: ["bath"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6C1}",
    description: "bathtub",
    category: "Objects",
    aliases: ["bathtub"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAA4}",
    description: "mouse trap",
    category: "Objects",
    aliases: ["mouse_trap"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1FA92}",
    description: "razor",
    category: "Objects",
    aliases: ["razor"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F9F4}",
    description: "lotion bottle",
    category: "Objects",
    aliases: ["lotion_bottle"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9F7}",
    description: "safety pin",
    category: "Objects",
    aliases: ["safety_pin"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9F9}",
    description: "broom",
    category: "Objects",
    aliases: ["broom"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9FA}",
    description: "basket",
    category: "Objects",
    aliases: ["basket"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9FB}",
    description: "roll of paper",
    category: "Objects",
    aliases: ["roll_of_paper"],
    tags: ["toilet"],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FAA3}",
    description: "bucket",
    category: "Objects",
    aliases: ["bucket"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F9FC}",
    description: "soap",
    category: "Objects",
    aliases: ["soap"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1FAA5}",
    description: "toothbrush",
    category: "Objects",
    aliases: ["toothbrush"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F9FD}",
    description: "sponge",
    category: "Objects",
    aliases: ["sponge"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F9EF}",
    description: "fire extinguisher",
    category: "Objects",
    aliases: ["fire_extinguisher"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F6D2}",
    description: "shopping cart",
    category: "Objects",
    aliases: ["shopping_cart"],
    tags: [],
    unicode_version: "9.0",
    ios_version: "10.2"
  },
  {
    emoji: "\u{1F6AC}",
    description: "cigarette",
    category: "Objects",
    aliases: ["smoking"],
    tags: ["cigarette"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u26B0\uFE0F",
    description: "coffin",
    category: "Objects",
    aliases: ["coffin"],
    tags: ["funeral"],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1FAA6}",
    description: "headstone",
    category: "Objects",
    aliases: ["headstone"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u26B1\uFE0F",
    description: "funeral urn",
    category: "Objects",
    aliases: ["funeral_urn"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F5FF}",
    description: "moai",
    category: "Objects",
    aliases: ["moyai"],
    tags: ["stone"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1FAA7}",
    description: "placard",
    category: "Objects",
    aliases: ["placard"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F3E7}",
    description: "ATM sign",
    category: "Symbols",
    aliases: ["atm"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6AE}",
    description: "litter in bin sign",
    category: "Symbols",
    aliases: ["put_litter_in_its_place"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6B0}",
    description: "potable water",
    category: "Symbols",
    aliases: ["potable_water"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u267F",
    description: "wheelchair symbol",
    category: "Symbols",
    aliases: ["wheelchair"],
    tags: ["accessibility"],
    unicode_version: "4.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6B9}",
    description: "men\u2019s room",
    category: "Symbols",
    aliases: ["mens"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6BA}",
    description: "women\u2019s room",
    category: "Symbols",
    aliases: ["womens"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6BB}",
    description: "restroom",
    category: "Symbols",
    aliases: ["restroom"],
    tags: ["toilet"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6BC}",
    description: "baby symbol",
    category: "Symbols",
    aliases: ["baby_symbol"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6BE}",
    description: "water closet",
    category: "Symbols",
    aliases: ["wc"],
    tags: ["toilet", "restroom"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6C2}",
    description: "passport control",
    category: "Symbols",
    aliases: ["passport_control"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6C3}",
    description: "customs",
    category: "Symbols",
    aliases: ["customs"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6C4}",
    description: "baggage claim",
    category: "Symbols",
    aliases: ["baggage_claim"],
    tags: ["airport"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6C5}",
    description: "left luggage",
    category: "Symbols",
    aliases: ["left_luggage"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u26A0\uFE0F",
    description: "warning",
    category: "Symbols",
    aliases: ["warning"],
    tags: ["wip"],
    unicode_version: "4.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6B8}",
    description: "children crossing",
    category: "Symbols",
    aliases: ["children_crossing"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u26D4",
    description: "no entry",
    category: "Symbols",
    aliases: ["no_entry"],
    tags: ["limit"],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6AB}",
    description: "prohibited",
    category: "Symbols",
    aliases: ["no_entry_sign"],
    tags: ["block", "forbidden"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6B3}",
    description: "no bicycles",
    category: "Symbols",
    aliases: ["no_bicycles"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6AD}",
    description: "no smoking",
    category: "Symbols",
    aliases: ["no_smoking"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6AF}",
    description: "no littering",
    category: "Symbols",
    aliases: ["do_not_litter"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6B1}",
    description: "non-potable water",
    category: "Symbols",
    aliases: ["non-potable_water"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6B7}",
    description: "no pedestrians",
    category: "Symbols",
    aliases: ["no_pedestrians"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4F5}",
    description: "no mobile phones",
    category: "Symbols",
    aliases: ["no_mobile_phones"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F51E}",
    description: "no one under eighteen",
    category: "Symbols",
    aliases: ["underage"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2622\uFE0F",
    description: "radioactive",
    category: "Symbols",
    aliases: ["radioactive"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u2623\uFE0F",
    description: "biohazard",
    category: "Symbols",
    aliases: ["biohazard"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u2B06\uFE0F",
    description: "up arrow",
    category: "Symbols",
    aliases: ["arrow_up"],
    tags: [],
    unicode_version: "4.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2197\uFE0F",
    description: "up-right arrow",
    category: "Symbols",
    aliases: ["arrow_upper_right"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u27A1\uFE0F",
    description: "right arrow",
    category: "Symbols",
    aliases: ["arrow_right"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2198\uFE0F",
    description: "down-right arrow",
    category: "Symbols",
    aliases: ["arrow_lower_right"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2B07\uFE0F",
    description: "down arrow",
    category: "Symbols",
    aliases: ["arrow_down"],
    tags: [],
    unicode_version: "4.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2199\uFE0F",
    description: "down-left arrow",
    category: "Symbols",
    aliases: ["arrow_lower_left"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2B05\uFE0F",
    description: "left arrow",
    category: "Symbols",
    aliases: ["arrow_left"],
    tags: [],
    unicode_version: "4.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2196\uFE0F",
    description: "up-left arrow",
    category: "Symbols",
    aliases: ["arrow_upper_left"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2195\uFE0F",
    description: "up-down arrow",
    category: "Symbols",
    aliases: ["arrow_up_down"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2194\uFE0F",
    description: "left-right arrow",
    category: "Symbols",
    aliases: ["left_right_arrow"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u21A9\uFE0F",
    description: "right arrow curving left",
    category: "Symbols",
    aliases: ["leftwards_arrow_with_hook"],
    tags: ["return"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u21AA\uFE0F",
    description: "left arrow curving right",
    category: "Symbols",
    aliases: ["arrow_right_hook"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2934\uFE0F",
    description: "right arrow curving up",
    category: "Symbols",
    aliases: ["arrow_heading_up"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2935\uFE0F",
    description: "right arrow curving down",
    category: "Symbols",
    aliases: ["arrow_heading_down"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F503}",
    description: "clockwise vertical arrows",
    category: "Symbols",
    aliases: ["arrows_clockwise"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F504}",
    description: "counterclockwise arrows button",
    category: "Symbols",
    aliases: ["arrows_counterclockwise"],
    tags: ["sync"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F519}",
    description: "BACK arrow",
    category: "Symbols",
    aliases: ["back"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F51A}",
    description: "END arrow",
    category: "Symbols",
    aliases: ["end"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F51B}",
    description: "ON! arrow",
    category: "Symbols",
    aliases: ["on"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F51C}",
    description: "SOON arrow",
    category: "Symbols",
    aliases: ["soon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F51D}",
    description: "TOP arrow",
    category: "Symbols",
    aliases: ["top"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6D0}",
    description: "place of worship",
    category: "Symbols",
    aliases: ["place_of_worship"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u269B\uFE0F",
    description: "atom symbol",
    category: "Symbols",
    aliases: ["atom_symbol"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F549}\uFE0F",
    description: "om",
    category: "Symbols",
    aliases: ["om"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u2721\uFE0F",
    description: "star of David",
    category: "Symbols",
    aliases: ["star_of_david"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u2638\uFE0F",
    description: "wheel of dharma",
    category: "Symbols",
    aliases: ["wheel_of_dharma"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u262F\uFE0F",
    description: "yin yang",
    category: "Symbols",
    aliases: ["yin_yang"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u271D\uFE0F",
    description: "latin cross",
    category: "Symbols",
    aliases: ["latin_cross"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u2626\uFE0F",
    description: "orthodox cross",
    category: "Symbols",
    aliases: ["orthodox_cross"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u262A\uFE0F",
    description: "star and crescent",
    category: "Symbols",
    aliases: ["star_and_crescent"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u262E\uFE0F",
    description: "peace symbol",
    category: "Symbols",
    aliases: ["peace_symbol"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F54E}",
    description: "menorah",
    category: "Symbols",
    aliases: ["menorah"],
    tags: [],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F52F}",
    description: "dotted six-pointed star",
    category: "Symbols",
    aliases: ["six_pointed_star"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2648",
    description: "Aries",
    category: "Symbols",
    aliases: ["aries"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2649",
    description: "Taurus",
    category: "Symbols",
    aliases: ["taurus"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u264A",
    description: "Gemini",
    category: "Symbols",
    aliases: ["gemini"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u264B",
    description: "Cancer",
    category: "Symbols",
    aliases: ["cancer"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u264C",
    description: "Leo",
    category: "Symbols",
    aliases: ["leo"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u264D",
    description: "Virgo",
    category: "Symbols",
    aliases: ["virgo"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u264E",
    description: "Libra",
    category: "Symbols",
    aliases: ["libra"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u264F",
    description: "Scorpio",
    category: "Symbols",
    aliases: ["scorpius"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2650",
    description: "Sagittarius",
    category: "Symbols",
    aliases: ["sagittarius"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2651",
    description: "Capricorn",
    category: "Symbols",
    aliases: ["capricorn"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2652",
    description: "Aquarius",
    category: "Symbols",
    aliases: ["aquarius"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2653",
    description: "Pisces",
    category: "Symbols",
    aliases: ["pisces"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u26CE",
    description: "Ophiuchus",
    category: "Symbols",
    aliases: ["ophiuchus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F500}",
    description: "shuffle tracks button",
    category: "Symbols",
    aliases: ["twisted_rightwards_arrows"],
    tags: ["shuffle"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F501}",
    description: "repeat button",
    category: "Symbols",
    aliases: ["repeat"],
    tags: ["loop"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F502}",
    description: "repeat single button",
    category: "Symbols",
    aliases: ["repeat_one"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u25B6\uFE0F",
    description: "play button",
    category: "Symbols",
    aliases: ["arrow_forward"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u23E9",
    description: "fast-forward button",
    category: "Symbols",
    aliases: ["fast_forward"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u23ED\uFE0F",
    description: "next track button",
    category: "Symbols",
    aliases: ["next_track_button"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u23EF\uFE0F",
    description: "play or pause button",
    category: "Symbols",
    aliases: ["play_or_pause_button"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u25C0\uFE0F",
    description: "reverse button",
    category: "Symbols",
    aliases: ["arrow_backward"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u23EA",
    description: "fast reverse button",
    category: "Symbols",
    aliases: ["rewind"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u23EE\uFE0F",
    description: "last track button",
    category: "Symbols",
    aliases: ["previous_track_button"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F53C}",
    description: "upwards button",
    category: "Symbols",
    aliases: ["arrow_up_small"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u23EB",
    description: "fast up button",
    category: "Symbols",
    aliases: ["arrow_double_up"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F53D}",
    description: "downwards button",
    category: "Symbols",
    aliases: ["arrow_down_small"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u23EC",
    description: "fast down button",
    category: "Symbols",
    aliases: ["arrow_double_down"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u23F8\uFE0F",
    description: "pause button",
    category: "Symbols",
    aliases: ["pause_button"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u23F9\uFE0F",
    description: "stop button",
    category: "Symbols",
    aliases: ["stop_button"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u23FA\uFE0F",
    description: "record button",
    category: "Symbols",
    aliases: ["record_button"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u23CF\uFE0F",
    description: "eject button",
    category: "Symbols",
    aliases: ["eject_button"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3A6}",
    description: "cinema",
    category: "Symbols",
    aliases: ["cinema"],
    tags: ["film", "movie"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F505}",
    description: "dim button",
    category: "Symbols",
    aliases: ["low_brightness"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F506}",
    description: "bright button",
    category: "Symbols",
    aliases: ["high_brightness"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4F6}",
    description: "antenna bars",
    category: "Symbols",
    aliases: ["signal_strength"],
    tags: ["wifi"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4F3}",
    description: "vibration mode",
    category: "Symbols",
    aliases: ["vibration_mode"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4F4}",
    description: "mobile phone off",
    category: "Symbols",
    aliases: ["mobile_phone_off"],
    tags: ["mute", "off"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2640\uFE0F",
    description: "female sign",
    category: "Symbols",
    aliases: ["female_sign"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u2642\uFE0F",
    description: "male sign",
    category: "Symbols",
    aliases: ["male_sign"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u26A7\uFE0F",
    description: "transgender symbol",
    category: "Symbols",
    aliases: ["transgender_symbol"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u2716\uFE0F",
    description: "multiply",
    category: "Symbols",
    aliases: ["heavy_multiplication_x"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2795",
    description: "plus",
    category: "Symbols",
    aliases: ["heavy_plus_sign"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2796",
    description: "minus",
    category: "Symbols",
    aliases: ["heavy_minus_sign"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2797",
    description: "divide",
    category: "Symbols",
    aliases: ["heavy_division_sign"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u267E\uFE0F",
    description: "infinity",
    category: "Symbols",
    aliases: ["infinity"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u203C\uFE0F",
    description: "double exclamation mark",
    category: "Symbols",
    aliases: ["bangbang"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2049\uFE0F",
    description: "exclamation question mark",
    category: "Symbols",
    aliases: ["interrobang"],
    tags: [],
    unicode_version: "3.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2753",
    description: "red question mark",
    category: "Symbols",
    aliases: ["question"],
    tags: ["confused"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2754",
    description: "white question mark",
    category: "Symbols",
    aliases: ["grey_question"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2755",
    description: "white exclamation mark",
    category: "Symbols",
    aliases: ["grey_exclamation"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2757",
    description: "red exclamation mark",
    category: "Symbols",
    aliases: ["exclamation", "heavy_exclamation_mark"],
    tags: ["bang"],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u3030\uFE0F",
    description: "wavy dash",
    category: "Symbols",
    aliases: ["wavy_dash"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4B1}",
    description: "currency exchange",
    category: "Symbols",
    aliases: ["currency_exchange"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4B2}",
    description: "heavy dollar sign",
    category: "Symbols",
    aliases: ["heavy_dollar_sign"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2695\uFE0F",
    description: "medical symbol",
    category: "Symbols",
    aliases: ["medical_symbol"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u267B\uFE0F",
    description: "recycling symbol",
    category: "Symbols",
    aliases: ["recycle"],
    tags: ["environment", "green"],
    unicode_version: "3.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u269C\uFE0F",
    description: "fleur-de-lis",
    category: "Symbols",
    aliases: ["fleur_de_lis"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F531}",
    description: "trident emblem",
    category: "Symbols",
    aliases: ["trident"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4DB}",
    description: "name badge",
    category: "Symbols",
    aliases: ["name_badge"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F530}",
    description: "Japanese symbol for beginner",
    category: "Symbols",
    aliases: ["beginner"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2B55",
    description: "hollow red circle",
    category: "Symbols",
    aliases: ["o"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u2705",
    description: "check mark button",
    category: "Symbols",
    aliases: ["white_check_mark"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2611\uFE0F",
    description: "check box with check",
    category: "Symbols",
    aliases: ["ballot_box_with_check"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2714\uFE0F",
    description: "check mark",
    category: "Symbols",
    aliases: ["heavy_check_mark"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u274C",
    description: "cross mark",
    category: "Symbols",
    aliases: ["x"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u274E",
    description: "cross mark button",
    category: "Symbols",
    aliases: ["negative_squared_cross_mark"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u27B0",
    description: "curly loop",
    category: "Symbols",
    aliases: ["curly_loop"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u27BF",
    description: "double curly loop",
    category: "Symbols",
    aliases: ["loop"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u303D\uFE0F",
    description: "part alternation mark",
    category: "Symbols",
    aliases: ["part_alternation_mark"],
    tags: [],
    unicode_version: "3.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u2733\uFE0F",
    description: "eight-spoked asterisk",
    category: "Symbols",
    aliases: ["eight_spoked_asterisk"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2734\uFE0F",
    description: "eight-pointed star",
    category: "Symbols",
    aliases: ["eight_pointed_black_star"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2747\uFE0F",
    description: "sparkle",
    category: "Symbols",
    aliases: ["sparkle"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\xA9\uFE0F",
    description: "copyright",
    category: "Symbols",
    aliases: ["copyright"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\xAE\uFE0F",
    description: "registered",
    category: "Symbols",
    aliases: ["registered"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u2122\uFE0F",
    description: "trade mark",
    category: "Symbols",
    aliases: ["tm"],
    tags: ["trademark"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "#\uFE0F\u20E3",
    description: "keycap: #",
    category: "Symbols",
    aliases: ["hash"],
    tags: ["number"],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "*\uFE0F\u20E3",
    description: "keycap: *",
    category: "Symbols",
    aliases: ["asterisk"],
    tags: [],
    unicode_version: "",
    ios_version: "9.1"
  },
  {
    emoji: "0\uFE0F\u20E3",
    description: "keycap: 0",
    category: "Symbols",
    aliases: ["zero"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "1\uFE0F\u20E3",
    description: "keycap: 1",
    category: "Symbols",
    aliases: ["one"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "2\uFE0F\u20E3",
    description: "keycap: 2",
    category: "Symbols",
    aliases: ["two"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "3\uFE0F\u20E3",
    description: "keycap: 3",
    category: "Symbols",
    aliases: ["three"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "4\uFE0F\u20E3",
    description: "keycap: 4",
    category: "Symbols",
    aliases: ["four"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "5\uFE0F\u20E3",
    description: "keycap: 5",
    category: "Symbols",
    aliases: ["five"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "6\uFE0F\u20E3",
    description: "keycap: 6",
    category: "Symbols",
    aliases: ["six"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "7\uFE0F\u20E3",
    description: "keycap: 7",
    category: "Symbols",
    aliases: ["seven"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "8\uFE0F\u20E3",
    description: "keycap: 8",
    category: "Symbols",
    aliases: ["eight"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "9\uFE0F\u20E3",
    description: "keycap: 9",
    category: "Symbols",
    aliases: ["nine"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F51F}",
    description: "keycap: 10",
    category: "Symbols",
    aliases: ["keycap_ten"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F520}",
    description: "input latin uppercase",
    category: "Symbols",
    aliases: ["capital_abcd"],
    tags: ["letters"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F521}",
    description: "input latin lowercase",
    category: "Symbols",
    aliases: ["abcd"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F522}",
    description: "input numbers",
    category: "Symbols",
    aliases: ["1234"],
    tags: ["numbers"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F523}",
    description: "input symbols",
    category: "Symbols",
    aliases: ["symbols"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F524}",
    description: "input latin letters",
    category: "Symbols",
    aliases: ["abc"],
    tags: ["alphabet"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F170}\uFE0F",
    description: "A button (blood type)",
    category: "Symbols",
    aliases: ["a"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F18E}",
    description: "AB button (blood type)",
    category: "Symbols",
    aliases: ["ab"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F171}\uFE0F",
    description: "B button (blood type)",
    category: "Symbols",
    aliases: ["b"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F191}",
    description: "CL button",
    category: "Symbols",
    aliases: ["cl"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F192}",
    description: "COOL button",
    category: "Symbols",
    aliases: ["cool"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F193}",
    description: "FREE button",
    category: "Symbols",
    aliases: ["free"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u2139\uFE0F",
    description: "information",
    category: "Symbols",
    aliases: ["information_source"],
    tags: [],
    unicode_version: "3.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F194}",
    description: "ID button",
    category: "Symbols",
    aliases: ["id"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u24C2\uFE0F",
    description: "circled M",
    category: "Symbols",
    aliases: ["m"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F195}",
    description: "NEW button",
    category: "Symbols",
    aliases: ["new"],
    tags: ["fresh"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F196}",
    description: "NG button",
    category: "Symbols",
    aliases: ["ng"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F17E}\uFE0F",
    description: "O button (blood type)",
    category: "Symbols",
    aliases: ["o2"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F197}",
    description: "OK button",
    category: "Symbols",
    aliases: ["ok"],
    tags: ["yes"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F17F}\uFE0F",
    description: "P button",
    category: "Symbols",
    aliases: ["parking"],
    tags: [],
    unicode_version: "5.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F198}",
    description: "SOS button",
    category: "Symbols",
    aliases: ["sos"],
    tags: ["help", "emergency"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F199}",
    description: "UP! button",
    category: "Symbols",
    aliases: ["up"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F19A}",
    description: "VS button",
    category: "Symbols",
    aliases: ["vs"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F201}",
    description: "Japanese \u201Chere\u201D button",
    category: "Symbols",
    aliases: ["koko"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F202}\uFE0F",
    description: "Japanese \u201Cservice charge\u201D button",
    category: "Symbols",
    aliases: ["sa"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F237}\uFE0F",
    description: "Japanese \u201Cmonthly amount\u201D button",
    category: "Symbols",
    aliases: ["u6708"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F236}",
    description: "Japanese \u201Cnot free of charge\u201D button",
    category: "Symbols",
    aliases: ["u6709"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F22F}",
    description: "Japanese \u201Creserved\u201D button",
    category: "Symbols",
    aliases: ["u6307"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F250}",
    description: "Japanese \u201Cbargain\u201D button",
    category: "Symbols",
    aliases: ["ideograph_advantage"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F239}",
    description: "Japanese \u201Cdiscount\u201D button",
    category: "Symbols",
    aliases: ["u5272"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F21A}",
    description: "Japanese \u201Cfree of charge\u201D button",
    category: "Symbols",
    aliases: ["u7121"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F232}",
    description: "Japanese \u201Cprohibited\u201D button",
    category: "Symbols",
    aliases: ["u7981"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F251}",
    description: "Japanese \u201Cacceptable\u201D button",
    category: "Symbols",
    aliases: ["accept"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F238}",
    description: "Japanese \u201Capplication\u201D button",
    category: "Symbols",
    aliases: ["u7533"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F234}",
    description: "Japanese \u201Cpassing grade\u201D button",
    category: "Symbols",
    aliases: ["u5408"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F233}",
    description: "Japanese \u201Cvacancy\u201D button",
    category: "Symbols",
    aliases: ["u7a7a"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u3297\uFE0F",
    description: "Japanese \u201Ccongratulations\u201D button",
    category: "Symbols",
    aliases: ["congratulations"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u3299\uFE0F",
    description: "Japanese \u201Csecret\u201D button",
    category: "Symbols",
    aliases: ["secret"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F23A}",
    description: "Japanese \u201Copen for business\u201D button",
    category: "Symbols",
    aliases: ["u55b6"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F235}",
    description: "Japanese \u201Cno vacancy\u201D button",
    category: "Symbols",
    aliases: ["u6e80"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F534}",
    description: "red circle",
    category: "Symbols",
    aliases: ["red_circle"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F7E0}",
    description: "orange circle",
    category: "Symbols",
    aliases: ["orange_circle"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F7E1}",
    description: "yellow circle",
    category: "Symbols",
    aliases: ["yellow_circle"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F7E2}",
    description: "green circle",
    category: "Symbols",
    aliases: ["green_circle"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F535}",
    description: "blue circle",
    category: "Symbols",
    aliases: ["large_blue_circle"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F7E3}",
    description: "purple circle",
    category: "Symbols",
    aliases: ["purple_circle"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F7E4}",
    description: "brown circle",
    category: "Symbols",
    aliases: ["brown_circle"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u26AB",
    description: "black circle",
    category: "Symbols",
    aliases: ["black_circle"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u26AA",
    description: "white circle",
    category: "Symbols",
    aliases: ["white_circle"],
    tags: [],
    unicode_version: "4.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F7E5}",
    description: "red square",
    category: "Symbols",
    aliases: ["red_square"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F7E7}",
    description: "orange square",
    category: "Symbols",
    aliases: ["orange_square"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F7E8}",
    description: "yellow square",
    category: "Symbols",
    aliases: ["yellow_square"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F7E9}",
    description: "green square",
    category: "Symbols",
    aliases: ["green_square"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F7E6}",
    description: "blue square",
    category: "Symbols",
    aliases: ["blue_square"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F7EA}",
    description: "purple square",
    category: "Symbols",
    aliases: ["purple_square"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u{1F7EB}",
    description: "brown square",
    category: "Symbols",
    aliases: ["brown_square"],
    tags: [],
    unicode_version: "12.0",
    ios_version: "13.0"
  },
  {
    emoji: "\u2B1B",
    description: "black large square",
    category: "Symbols",
    aliases: ["black_large_square"],
    tags: [],
    unicode_version: "5.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u2B1C",
    description: "white large square",
    category: "Symbols",
    aliases: ["white_large_square"],
    tags: [],
    unicode_version: "5.1",
    ios_version: "6.0"
  },
  {
    emoji: "\u25FC\uFE0F",
    description: "black medium square",
    category: "Symbols",
    aliases: ["black_medium_square"],
    tags: [],
    unicode_version: "3.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u25FB\uFE0F",
    description: "white medium square",
    category: "Symbols",
    aliases: ["white_medium_square"],
    tags: [],
    unicode_version: "3.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u25FE",
    description: "black medium-small square",
    category: "Symbols",
    aliases: ["black_medium_small_square"],
    tags: [],
    unicode_version: "3.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u25FD",
    description: "white medium-small square",
    category: "Symbols",
    aliases: ["white_medium_small_square"],
    tags: [],
    unicode_version: "3.2",
    ios_version: "6.0"
  },
  {
    emoji: "\u25AA\uFE0F",
    description: "black small square",
    category: "Symbols",
    aliases: ["black_small_square"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u25AB\uFE0F",
    description: "white small square",
    category: "Symbols",
    aliases: ["white_small_square"],
    tags: [],
    unicode_version: "",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F536}",
    description: "large orange diamond",
    category: "Symbols",
    aliases: ["large_orange_diamond"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F537}",
    description: "large blue diamond",
    category: "Symbols",
    aliases: ["large_blue_diamond"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F538}",
    description: "small orange diamond",
    category: "Symbols",
    aliases: ["small_orange_diamond"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F539}",
    description: "small blue diamond",
    category: "Symbols",
    aliases: ["small_blue_diamond"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F53A}",
    description: "red triangle pointed up",
    category: "Symbols",
    aliases: ["small_red_triangle"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F53B}",
    description: "red triangle pointed down",
    category: "Symbols",
    aliases: ["small_red_triangle_down"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F4A0}",
    description: "diamond with a dot",
    category: "Symbols",
    aliases: ["diamond_shape_with_a_dot_inside"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F518}",
    description: "radio button",
    category: "Symbols",
    aliases: ["radio_button"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F533}",
    description: "white square button",
    category: "Symbols",
    aliases: ["white_square_button"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F532}",
    description: "black square button",
    category: "Symbols",
    aliases: ["black_square_button"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3C1}",
    description: "chequered flag",
    category: "Flags",
    aliases: ["checkered_flag"],
    tags: ["milestone", "finish"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F6A9}",
    description: "triangular flag",
    category: "Flags",
    aliases: ["triangular_flag_on_post"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F38C}",
    description: "crossed flags",
    category: "Flags",
    aliases: ["crossed_flags"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F3F4}",
    description: "black flag",
    category: "Flags",
    aliases: ["black_flag"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3F3}\uFE0F",
    description: "white flag",
    category: "Flags",
    aliases: ["white_flag"],
    tags: [],
    unicode_version: "7.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F3F3}\uFE0F\u200D\u{1F308}",
    description: "rainbow flag",
    category: "Flags",
    aliases: ["rainbow_flag"],
    tags: ["pride"],
    unicode_version: "6.0",
    ios_version: "10.0"
  },
  {
    emoji: "\u{1F3F3}\uFE0F\u200D\u26A7\uFE0F",
    description: "transgender flag",
    category: "Flags",
    aliases: ["transgender_flag"],
    tags: [],
    unicode_version: "13.0",
    ios_version: "14.0"
  },
  {
    emoji: "\u{1F3F4}\u200D\u2620\uFE0F",
    description: "pirate flag",
    category: "Flags",
    aliases: ["pirate_flag"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1E6}\u{1F1E8}",
    description: "flag: Ascension Island",
    category: "Flags",
    aliases: ["ascension_island"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1E6}\u{1F1E9}",
    description: "flag: Andorra",
    category: "Flags",
    aliases: ["andorra"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1EA}",
    description: "flag: United Arab Emirates",
    category: "Flags",
    aliases: ["united_arab_emirates"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1EB}",
    description: "flag: Afghanistan",
    category: "Flags",
    aliases: ["afghanistan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1EC}",
    description: "flag: Antigua & Barbuda",
    category: "Flags",
    aliases: ["antigua_barbuda"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1EE}",
    description: "flag: Anguilla",
    category: "Flags",
    aliases: ["anguilla"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F1}",
    description: "flag: Albania",
    category: "Flags",
    aliases: ["albania"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F2}",
    description: "flag: Armenia",
    category: "Flags",
    aliases: ["armenia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F4}",
    description: "flag: Angola",
    category: "Flags",
    aliases: ["angola"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F6}",
    description: "flag: Antarctica",
    category: "Flags",
    aliases: ["antarctica"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F7}",
    description: "flag: Argentina",
    category: "Flags",
    aliases: ["argentina"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F8}",
    description: "flag: American Samoa",
    category: "Flags",
    aliases: ["american_samoa"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1F9}",
    description: "flag: Austria",
    category: "Flags",
    aliases: ["austria"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1FA}",
    description: "flag: Australia",
    category: "Flags",
    aliases: ["australia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1FC}",
    description: "flag: Aruba",
    category: "Flags",
    aliases: ["aruba"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E6}\u{1F1FD}",
    description: "flag: \xC5land Islands",
    category: "Flags",
    aliases: ["aland_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1E6}\u{1F1FF}",
    description: "flag: Azerbaijan",
    category: "Flags",
    aliases: ["azerbaijan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1E6}",
    description: "flag: Bosnia & Herzegovina",
    category: "Flags",
    aliases: ["bosnia_herzegovina"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1E7}",
    description: "flag: Barbados",
    category: "Flags",
    aliases: ["barbados"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1E9}",
    description: "flag: Bangladesh",
    category: "Flags",
    aliases: ["bangladesh"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EA}",
    description: "flag: Belgium",
    category: "Flags",
    aliases: ["belgium"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EB}",
    description: "flag: Burkina Faso",
    category: "Flags",
    aliases: ["burkina_faso"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EC}",
    description: "flag: Bulgaria",
    category: "Flags",
    aliases: ["bulgaria"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1ED}",
    description: "flag: Bahrain",
    category: "Flags",
    aliases: ["bahrain"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EE}",
    description: "flag: Burundi",
    category: "Flags",
    aliases: ["burundi"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1EF}",
    description: "flag: Benin",
    category: "Flags",
    aliases: ["benin"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F1}",
    description: "flag: St. Barth\xE9lemy",
    category: "Flags",
    aliases: ["st_barthelemy"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F2}",
    description: "flag: Bermuda",
    category: "Flags",
    aliases: ["bermuda"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F3}",
    description: "flag: Brunei",
    category: "Flags",
    aliases: ["brunei"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F4}",
    description: "flag: Bolivia",
    category: "Flags",
    aliases: ["bolivia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F6}",
    description: "flag: Caribbean Netherlands",
    category: "Flags",
    aliases: ["caribbean_netherlands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F7}",
    description: "flag: Brazil",
    category: "Flags",
    aliases: ["brazil"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F8}",
    description: "flag: Bahamas",
    category: "Flags",
    aliases: ["bahamas"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1F9}",
    description: "flag: Bhutan",
    category: "Flags",
    aliases: ["bhutan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1FB}",
    description: "flag: Bouvet Island",
    category: "Flags",
    aliases: ["bouvet_island"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1E7}\u{1F1FC}",
    description: "flag: Botswana",
    category: "Flags",
    aliases: ["botswana"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1FE}",
    description: "flag: Belarus",
    category: "Flags",
    aliases: ["belarus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E7}\u{1F1FF}",
    description: "flag: Belize",
    category: "Flags",
    aliases: ["belize"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1E6}",
    description: "flag: Canada",
    category: "Flags",
    aliases: ["canada"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1E8}",
    description: "flag: Cocos (Keeling) Islands",
    category: "Flags",
    aliases: ["cocos_islands"],
    tags: ["keeling"],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1E8}\u{1F1E9}",
    description: "flag: Congo - Kinshasa",
    category: "Flags",
    aliases: ["congo_kinshasa"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1EB}",
    description: "flag: Central African Republic",
    category: "Flags",
    aliases: ["central_african_republic"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1EC}",
    description: "flag: Congo - Brazzaville",
    category: "Flags",
    aliases: ["congo_brazzaville"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1ED}",
    description: "flag: Switzerland",
    category: "Flags",
    aliases: ["switzerland"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1EE}",
    description: "flag: C\xF4te d\u2019Ivoire",
    category: "Flags",
    aliases: ["cote_divoire"],
    tags: ["ivory"],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F0}",
    description: "flag: Cook Islands",
    category: "Flags",
    aliases: ["cook_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F1}",
    description: "flag: Chile",
    category: "Flags",
    aliases: ["chile"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F2}",
    description: "flag: Cameroon",
    category: "Flags",
    aliases: ["cameroon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F3}",
    description: "flag: China",
    category: "Flags",
    aliases: ["cn"],
    tags: ["china"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F4}",
    description: "flag: Colombia",
    category: "Flags",
    aliases: ["colombia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F5}",
    description: "flag: Clipperton Island",
    category: "Flags",
    aliases: ["clipperton_island"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1E8}\u{1F1F7}",
    description: "flag: Costa Rica",
    category: "Flags",
    aliases: ["costa_rica"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FA}",
    description: "flag: Cuba",
    category: "Flags",
    aliases: ["cuba"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FB}",
    description: "flag: Cape Verde",
    category: "Flags",
    aliases: ["cape_verde"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FC}",
    description: "flag: Cura\xE7ao",
    category: "Flags",
    aliases: ["curacao"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FD}",
    description: "flag: Christmas Island",
    category: "Flags",
    aliases: ["christmas_island"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FE}",
    description: "flag: Cyprus",
    category: "Flags",
    aliases: ["cyprus"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E8}\u{1F1FF}",
    description: "flag: Czechia",
    category: "Flags",
    aliases: ["czech_republic"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E9}\u{1F1EA}",
    description: "flag: Germany",
    category: "Flags",
    aliases: ["de"],
    tags: ["flag", "germany"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1E9}\u{1F1EC}",
    description: "flag: Diego Garcia",
    category: "Flags",
    aliases: ["diego_garcia"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1E9}\u{1F1EF}",
    description: "flag: Djibouti",
    category: "Flags",
    aliases: ["djibouti"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E9}\u{1F1F0}",
    description: "flag: Denmark",
    category: "Flags",
    aliases: ["denmark"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E9}\u{1F1F2}",
    description: "flag: Dominica",
    category: "Flags",
    aliases: ["dominica"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E9}\u{1F1F4}",
    description: "flag: Dominican Republic",
    category: "Flags",
    aliases: ["dominican_republic"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1E9}\u{1F1FF}",
    description: "flag: Algeria",
    category: "Flags",
    aliases: ["algeria"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EA}\u{1F1E6}",
    description: "flag: Ceuta & Melilla",
    category: "Flags",
    aliases: ["ceuta_melilla"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1EA}\u{1F1E8}",
    description: "flag: Ecuador",
    category: "Flags",
    aliases: ["ecuador"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EA}\u{1F1EA}",
    description: "flag: Estonia",
    category: "Flags",
    aliases: ["estonia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EA}\u{1F1EC}",
    description: "flag: Egypt",
    category: "Flags",
    aliases: ["egypt"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EA}\u{1F1ED}",
    description: "flag: Western Sahara",
    category: "Flags",
    aliases: ["western_sahara"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EA}\u{1F1F7}",
    description: "flag: Eritrea",
    category: "Flags",
    aliases: ["eritrea"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EA}\u{1F1F8}",
    description: "flag: Spain",
    category: "Flags",
    aliases: ["es"],
    tags: ["spain"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1EA}\u{1F1F9}",
    description: "flag: Ethiopia",
    category: "Flags",
    aliases: ["ethiopia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EA}\u{1F1FA}",
    description: "flag: European Union",
    category: "Flags",
    aliases: ["eu", "european_union"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EB}\u{1F1EE}",
    description: "flag: Finland",
    category: "Flags",
    aliases: ["finland"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EB}\u{1F1EF}",
    description: "flag: Fiji",
    category: "Flags",
    aliases: ["fiji"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EB}\u{1F1F0}",
    description: "flag: Falkland Islands",
    category: "Flags",
    aliases: ["falkland_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EB}\u{1F1F2}",
    description: "flag: Micronesia",
    category: "Flags",
    aliases: ["micronesia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EB}\u{1F1F4}",
    description: "flag: Faroe Islands",
    category: "Flags",
    aliases: ["faroe_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EB}\u{1F1F7}",
    description: "flag: France",
    category: "Flags",
    aliases: ["fr"],
    tags: ["france", "french"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1EC}\u{1F1E6}",
    description: "flag: Gabon",
    category: "Flags",
    aliases: ["gabon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1E7}",
    description: "flag: United Kingdom",
    category: "Flags",
    aliases: ["gb", "uk"],
    tags: ["flag", "british"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1EC}\u{1F1E9}",
    description: "flag: Grenada",
    category: "Flags",
    aliases: ["grenada"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1EA}",
    description: "flag: Georgia",
    category: "Flags",
    aliases: ["georgia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1EB}",
    description: "flag: French Guiana",
    category: "Flags",
    aliases: ["french_guiana"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1EC}",
    description: "flag: Guernsey",
    category: "Flags",
    aliases: ["guernsey"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EC}\u{1F1ED}",
    description: "flag: Ghana",
    category: "Flags",
    aliases: ["ghana"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1EE}",
    description: "flag: Gibraltar",
    category: "Flags",
    aliases: ["gibraltar"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F1}",
    description: "flag: Greenland",
    category: "Flags",
    aliases: ["greenland"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F2}",
    description: "flag: Gambia",
    category: "Flags",
    aliases: ["gambia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F3}",
    description: "flag: Guinea",
    category: "Flags",
    aliases: ["guinea"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F5}",
    description: "flag: Guadeloupe",
    category: "Flags",
    aliases: ["guadeloupe"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F6}",
    description: "flag: Equatorial Guinea",
    category: "Flags",
    aliases: ["equatorial_guinea"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F7}",
    description: "flag: Greece",
    category: "Flags",
    aliases: ["greece"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F8}",
    description: "flag: South Georgia & South Sandwich Islands",
    category: "Flags",
    aliases: ["south_georgia_south_sandwich_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EC}\u{1F1F9}",
    description: "flag: Guatemala",
    category: "Flags",
    aliases: ["guatemala"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1FA}",
    description: "flag: Guam",
    category: "Flags",
    aliases: ["guam"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1FC}",
    description: "flag: Guinea-Bissau",
    category: "Flags",
    aliases: ["guinea_bissau"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EC}\u{1F1FE}",
    description: "flag: Guyana",
    category: "Flags",
    aliases: ["guyana"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F0}",
    description: "flag: Hong Kong SAR China",
    category: "Flags",
    aliases: ["hong_kong"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F2}",
    description: "flag: Heard & McDonald Islands",
    category: "Flags",
    aliases: ["heard_mcdonald_islands"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F3}",
    description: "flag: Honduras",
    category: "Flags",
    aliases: ["honduras"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F7}",
    description: "flag: Croatia",
    category: "Flags",
    aliases: ["croatia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1ED}\u{1F1F9}",
    description: "flag: Haiti",
    category: "Flags",
    aliases: ["haiti"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1ED}\u{1F1FA}",
    description: "flag: Hungary",
    category: "Flags",
    aliases: ["hungary"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EE}\u{1F1E8}",
    description: "flag: Canary Islands",
    category: "Flags",
    aliases: ["canary_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EE}\u{1F1E9}",
    description: "flag: Indonesia",
    category: "Flags",
    aliases: ["indonesia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EE}\u{1F1EA}",
    description: "flag: Ireland",
    category: "Flags",
    aliases: ["ireland"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F1}",
    description: "flag: Israel",
    category: "Flags",
    aliases: ["israel"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F2}",
    description: "flag: Isle of Man",
    category: "Flags",
    aliases: ["isle_of_man"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F3}",
    description: "flag: India",
    category: "Flags",
    aliases: ["india"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F4}",
    description: "flag: British Indian Ocean Territory",
    category: "Flags",
    aliases: ["british_indian_ocean_territory"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F6}",
    description: "flag: Iraq",
    category: "Flags",
    aliases: ["iraq"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F7}",
    description: "flag: Iran",
    category: "Flags",
    aliases: ["iran"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F8}",
    description: "flag: Iceland",
    category: "Flags",
    aliases: ["iceland"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EE}\u{1F1F9}",
    description: "flag: Italy",
    category: "Flags",
    aliases: ["it"],
    tags: ["italy"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1EF}\u{1F1EA}",
    description: "flag: Jersey",
    category: "Flags",
    aliases: ["jersey"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1EF}\u{1F1F2}",
    description: "flag: Jamaica",
    category: "Flags",
    aliases: ["jamaica"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EF}\u{1F1F4}",
    description: "flag: Jordan",
    category: "Flags",
    aliases: ["jordan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1EF}\u{1F1F5}",
    description: "flag: Japan",
    category: "Flags",
    aliases: ["jp"],
    tags: ["japan"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1F0}\u{1F1EA}",
    description: "flag: Kenya",
    category: "Flags",
    aliases: ["kenya"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F0}\u{1F1EC}",
    description: "flag: Kyrgyzstan",
    category: "Flags",
    aliases: ["kyrgyzstan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F0}\u{1F1ED}",
    description: "flag: Cambodia",
    category: "Flags",
    aliases: ["cambodia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F0}\u{1F1EE}",
    description: "flag: Kiribati",
    category: "Flags",
    aliases: ["kiribati"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F0}\u{1F1F2}",
    description: "flag: Comoros",
    category: "Flags",
    aliases: ["comoros"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F0}\u{1F1F3}",
    description: "flag: St. Kitts & Nevis",
    category: "Flags",
    aliases: ["st_kitts_nevis"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F0}\u{1F1F5}",
    description: "flag: North Korea",
    category: "Flags",
    aliases: ["north_korea"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F0}\u{1F1F7}",
    description: "flag: South Korea",
    category: "Flags",
    aliases: ["kr"],
    tags: ["korea"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1F0}\u{1F1FC}",
    description: "flag: Kuwait",
    category: "Flags",
    aliases: ["kuwait"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F0}\u{1F1FE}",
    description: "flag: Cayman Islands",
    category: "Flags",
    aliases: ["cayman_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F0}\u{1F1FF}",
    description: "flag: Kazakhstan",
    category: "Flags",
    aliases: ["kazakhstan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1E6}",
    description: "flag: Laos",
    category: "Flags",
    aliases: ["laos"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1E7}",
    description: "flag: Lebanon",
    category: "Flags",
    aliases: ["lebanon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1E8}",
    description: "flag: St. Lucia",
    category: "Flags",
    aliases: ["st_lucia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1EE}",
    description: "flag: Liechtenstein",
    category: "Flags",
    aliases: ["liechtenstein"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1F0}",
    description: "flag: Sri Lanka",
    category: "Flags",
    aliases: ["sri_lanka"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1F7}",
    description: "flag: Liberia",
    category: "Flags",
    aliases: ["liberia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1F8}",
    description: "flag: Lesotho",
    category: "Flags",
    aliases: ["lesotho"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1F9}",
    description: "flag: Lithuania",
    category: "Flags",
    aliases: ["lithuania"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1FA}",
    description: "flag: Luxembourg",
    category: "Flags",
    aliases: ["luxembourg"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1FB}",
    description: "flag: Latvia",
    category: "Flags",
    aliases: ["latvia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F1}\u{1F1FE}",
    description: "flag: Libya",
    category: "Flags",
    aliases: ["libya"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1E6}",
    description: "flag: Morocco",
    category: "Flags",
    aliases: ["morocco"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1E8}",
    description: "flag: Monaco",
    category: "Flags",
    aliases: ["monaco"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F2}\u{1F1E9}",
    description: "flag: Moldova",
    category: "Flags",
    aliases: ["moldova"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1EA}",
    description: "flag: Montenegro",
    category: "Flags",
    aliases: ["montenegro"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1EB}",
    description: "flag: St. Martin",
    category: "Flags",
    aliases: ["st_martin"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1F2}\u{1F1EC}",
    description: "flag: Madagascar",
    category: "Flags",
    aliases: ["madagascar"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1ED}",
    description: "flag: Marshall Islands",
    category: "Flags",
    aliases: ["marshall_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F0}",
    description: "flag: North Macedonia",
    category: "Flags",
    aliases: ["macedonia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F1}",
    description: "flag: Mali",
    category: "Flags",
    aliases: ["mali"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F2}",
    description: "flag: Myanmar (Burma)",
    category: "Flags",
    aliases: ["myanmar"],
    tags: ["burma"],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F3}",
    description: "flag: Mongolia",
    category: "Flags",
    aliases: ["mongolia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F4}",
    description: "flag: Macao SAR China",
    category: "Flags",
    aliases: ["macau"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F5}",
    description: "flag: Northern Mariana Islands",
    category: "Flags",
    aliases: ["northern_mariana_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F6}",
    description: "flag: Martinique",
    category: "Flags",
    aliases: ["martinique"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F7}",
    description: "flag: Mauritania",
    category: "Flags",
    aliases: ["mauritania"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F8}",
    description: "flag: Montserrat",
    category: "Flags",
    aliases: ["montserrat"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1F9}",
    description: "flag: Malta",
    category: "Flags",
    aliases: ["malta"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FA}",
    description: "flag: Mauritius",
    category: "Flags",
    aliases: ["mauritius"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FB}",
    description: "flag: Maldives",
    category: "Flags",
    aliases: ["maldives"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FC}",
    description: "flag: Malawi",
    category: "Flags",
    aliases: ["malawi"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FD}",
    description: "flag: Mexico",
    category: "Flags",
    aliases: ["mexico"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FE}",
    description: "flag: Malaysia",
    category: "Flags",
    aliases: ["malaysia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F2}\u{1F1FF}",
    description: "flag: Mozambique",
    category: "Flags",
    aliases: ["mozambique"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1E6}",
    description: "flag: Namibia",
    category: "Flags",
    aliases: ["namibia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1E8}",
    description: "flag: New Caledonia",
    category: "Flags",
    aliases: ["new_caledonia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1EA}",
    description: "flag: Niger",
    category: "Flags",
    aliases: ["niger"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1EB}",
    description: "flag: Norfolk Island",
    category: "Flags",
    aliases: ["norfolk_island"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F3}\u{1F1EC}",
    description: "flag: Nigeria",
    category: "Flags",
    aliases: ["nigeria"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1EE}",
    description: "flag: Nicaragua",
    category: "Flags",
    aliases: ["nicaragua"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1F1}",
    description: "flag: Netherlands",
    category: "Flags",
    aliases: ["netherlands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1F4}",
    description: "flag: Norway",
    category: "Flags",
    aliases: ["norway"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1F5}",
    description: "flag: Nepal",
    category: "Flags",
    aliases: ["nepal"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1F7}",
    description: "flag: Nauru",
    category: "Flags",
    aliases: ["nauru"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F3}\u{1F1FA}",
    description: "flag: Niue",
    category: "Flags",
    aliases: ["niue"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F3}\u{1F1FF}",
    description: "flag: New Zealand",
    category: "Flags",
    aliases: ["new_zealand"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F4}\u{1F1F2}",
    description: "flag: Oman",
    category: "Flags",
    aliases: ["oman"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1E6}",
    description: "flag: Panama",
    category: "Flags",
    aliases: ["panama"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1EA}",
    description: "flag: Peru",
    category: "Flags",
    aliases: ["peru"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1EB}",
    description: "flag: French Polynesia",
    category: "Flags",
    aliases: ["french_polynesia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F5}\u{1F1EC}",
    description: "flag: Papua New Guinea",
    category: "Flags",
    aliases: ["papua_new_guinea"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1ED}",
    description: "flag: Philippines",
    category: "Flags",
    aliases: ["philippines"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F0}",
    description: "flag: Pakistan",
    category: "Flags",
    aliases: ["pakistan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F1}",
    description: "flag: Poland",
    category: "Flags",
    aliases: ["poland"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F2}",
    description: "flag: St. Pierre & Miquelon",
    category: "Flags",
    aliases: ["st_pierre_miquelon"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F3}",
    description: "flag: Pitcairn Islands",
    category: "Flags",
    aliases: ["pitcairn_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F7}",
    description: "flag: Puerto Rico",
    category: "Flags",
    aliases: ["puerto_rico"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F8}",
    description: "flag: Palestinian Territories",
    category: "Flags",
    aliases: ["palestinian_territories"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1F9}",
    description: "flag: Portugal",
    category: "Flags",
    aliases: ["portugal"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1FC}",
    description: "flag: Palau",
    category: "Flags",
    aliases: ["palau"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F5}\u{1F1FE}",
    description: "flag: Paraguay",
    category: "Flags",
    aliases: ["paraguay"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F6}\u{1F1E6}",
    description: "flag: Qatar",
    category: "Flags",
    aliases: ["qatar"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F7}\u{1F1EA}",
    description: "flag: R\xE9union",
    category: "Flags",
    aliases: ["reunion"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F7}\u{1F1F4}",
    description: "flag: Romania",
    category: "Flags",
    aliases: ["romania"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F7}\u{1F1F8}",
    description: "flag: Serbia",
    category: "Flags",
    aliases: ["serbia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F7}\u{1F1FA}",
    description: "flag: Russia",
    category: "Flags",
    aliases: ["ru"],
    tags: ["russia"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1F7}\u{1F1FC}",
    description: "flag: Rwanda",
    category: "Flags",
    aliases: ["rwanda"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1E6}",
    description: "flag: Saudi Arabia",
    category: "Flags",
    aliases: ["saudi_arabia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1E7}",
    description: "flag: Solomon Islands",
    category: "Flags",
    aliases: ["solomon_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1E8}",
    description: "flag: Seychelles",
    category: "Flags",
    aliases: ["seychelles"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1E9}",
    description: "flag: Sudan",
    category: "Flags",
    aliases: ["sudan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1EA}",
    description: "flag: Sweden",
    category: "Flags",
    aliases: ["sweden"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1EC}",
    description: "flag: Singapore",
    category: "Flags",
    aliases: ["singapore"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1ED}",
    description: "flag: St. Helena",
    category: "Flags",
    aliases: ["st_helena"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F8}\u{1F1EE}",
    description: "flag: Slovenia",
    category: "Flags",
    aliases: ["slovenia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1EF}",
    description: "flag: Svalbard & Jan Mayen",
    category: "Flags",
    aliases: ["svalbard_jan_mayen"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F0}",
    description: "flag: Slovakia",
    category: "Flags",
    aliases: ["slovakia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F1}",
    description: "flag: Sierra Leone",
    category: "Flags",
    aliases: ["sierra_leone"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F2}",
    description: "flag: San Marino",
    category: "Flags",
    aliases: ["san_marino"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F3}",
    description: "flag: Senegal",
    category: "Flags",
    aliases: ["senegal"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F4}",
    description: "flag: Somalia",
    category: "Flags",
    aliases: ["somalia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F7}",
    description: "flag: Suriname",
    category: "Flags",
    aliases: ["suriname"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F8}",
    description: "flag: South Sudan",
    category: "Flags",
    aliases: ["south_sudan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1F9}",
    description: "flag: S\xE3o Tom\xE9 & Pr\xEDncipe",
    category: "Flags",
    aliases: ["sao_tome_principe"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1FB}",
    description: "flag: El Salvador",
    category: "Flags",
    aliases: ["el_salvador"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1FD}",
    description: "flag: Sint Maarten",
    category: "Flags",
    aliases: ["sint_maarten"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1FE}",
    description: "flag: Syria",
    category: "Flags",
    aliases: ["syria"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F8}\u{1F1FF}",
    description: "flag: Eswatini",
    category: "Flags",
    aliases: ["swaziland"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1E6}",
    description: "flag: Tristan da Cunha",
    category: "Flags",
    aliases: ["tristan_da_cunha"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1F9}\u{1F1E8}",
    description: "flag: Turks & Caicos Islands",
    category: "Flags",
    aliases: ["turks_caicos_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1E9}",
    description: "flag: Chad",
    category: "Flags",
    aliases: ["chad"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F9}\u{1F1EB}",
    description: "flag: French Southern Territories",
    category: "Flags",
    aliases: ["french_southern_territories"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1EC}",
    description: "flag: Togo",
    category: "Flags",
    aliases: ["togo"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1ED}",
    description: "flag: Thailand",
    category: "Flags",
    aliases: ["thailand"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1EF}",
    description: "flag: Tajikistan",
    category: "Flags",
    aliases: ["tajikistan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F0}",
    description: "flag: Tokelau",
    category: "Flags",
    aliases: ["tokelau"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F1}",
    description: "flag: Timor-Leste",
    category: "Flags",
    aliases: ["timor_leste"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F2}",
    description: "flag: Turkmenistan",
    category: "Flags",
    aliases: ["turkmenistan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F3}",
    description: "flag: Tunisia",
    category: "Flags",
    aliases: ["tunisia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F4}",
    description: "flag: Tonga",
    category: "Flags",
    aliases: ["tonga"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F7}",
    description: "flag: Turkey",
    category: "Flags",
    aliases: ["tr"],
    tags: ["turkey"],
    unicode_version: "8.0",
    ios_version: "9.1"
  },
  {
    emoji: "\u{1F1F9}\u{1F1F9}",
    description: "flag: Trinidad & Tobago",
    category: "Flags",
    aliases: ["trinidad_tobago"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1FB}",
    description: "flag: Tuvalu",
    category: "Flags",
    aliases: ["tuvalu"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1F9}\u{1F1FC}",
    description: "flag: Taiwan",
    category: "Flags",
    aliases: ["taiwan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1F9}\u{1F1FF}",
    description: "flag: Tanzania",
    category: "Flags",
    aliases: ["tanzania"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FA}\u{1F1E6}",
    description: "flag: Ukraine",
    category: "Flags",
    aliases: ["ukraine"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FA}\u{1F1EC}",
    description: "flag: Uganda",
    category: "Flags",
    aliases: ["uganda"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FA}\u{1F1F2}",
    description: "flag: U.S. Outlying Islands",
    category: "Flags",
    aliases: ["us_outlying_islands"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1FA}\u{1F1F3}",
    description: "flag: United Nations",
    category: "Flags",
    aliases: ["united_nations"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F1FA}\u{1F1F8}",
    description: "flag: United States",
    category: "Flags",
    aliases: ["us"],
    tags: ["flag", "united", "america"],
    unicode_version: "6.0",
    ios_version: "6.0"
  },
  {
    emoji: "\u{1F1FA}\u{1F1FE}",
    description: "flag: Uruguay",
    category: "Flags",
    aliases: ["uruguay"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FA}\u{1F1FF}",
    description: "flag: Uzbekistan",
    category: "Flags",
    aliases: ["uzbekistan"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FB}\u{1F1E6}",
    description: "flag: Vatican City",
    category: "Flags",
    aliases: ["vatican_city"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1FB}\u{1F1E8}",
    description: "flag: St. Vincent & Grenadines",
    category: "Flags",
    aliases: ["st_vincent_grenadines"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FB}\u{1F1EA}",
    description: "flag: Venezuela",
    category: "Flags",
    aliases: ["venezuela"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FB}\u{1F1EC}",
    description: "flag: British Virgin Islands",
    category: "Flags",
    aliases: ["british_virgin_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FB}\u{1F1EE}",
    description: "flag: U.S. Virgin Islands",
    category: "Flags",
    aliases: ["us_virgin_islands"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FB}\u{1F1F3}",
    description: "flag: Vietnam",
    category: "Flags",
    aliases: ["vietnam"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FB}\u{1F1FA}",
    description: "flag: Vanuatu",
    category: "Flags",
    aliases: ["vanuatu"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FC}\u{1F1EB}",
    description: "flag: Wallis & Futuna",
    category: "Flags",
    aliases: ["wallis_futuna"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1FC}\u{1F1F8}",
    description: "flag: Samoa",
    category: "Flags",
    aliases: ["samoa"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FD}\u{1F1F0}",
    description: "flag: Kosovo",
    category: "Flags",
    aliases: ["kosovo"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FE}\u{1F1EA}",
    description: "flag: Yemen",
    category: "Flags",
    aliases: ["yemen"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FE}\u{1F1F9}",
    description: "flag: Mayotte",
    category: "Flags",
    aliases: ["mayotte"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "9.0"
  },
  {
    emoji: "\u{1F1FF}\u{1F1E6}",
    description: "flag: South Africa",
    category: "Flags",
    aliases: ["south_africa"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FF}\u{1F1F2}",
    description: "flag: Zambia",
    category: "Flags",
    aliases: ["zambia"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F1FF}\u{1F1FC}",
    description: "flag: Zimbabwe",
    category: "Flags",
    aliases: ["zimbabwe"],
    tags: [],
    unicode_version: "6.0",
    ios_version: "8.3"
  },
  {
    emoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}",
    description: "flag: England",
    category: "Flags",
    aliases: ["england"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    description: "flag: Scotland",
    category: "Flags",
    aliases: ["scotland"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  },
  {
    emoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}",
    description: "flag: Wales",
    category: "Flags",
    aliases: ["wales"],
    tags: [],
    unicode_version: "11.0",
    ios_version: "12.1"
  }
];

// src/plugins/MarkdownTransformers/index.ts
var HR = {
  dependencies: [HorizontalRuleNode],
  export: (node) => {
    return $isHorizontalRuleNode(node) ? "***" : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode2();
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }
    line.selectNext();
  },
  type: "element"
};
var IMAGE = {
  dependencies: [ImageNode],
  export: (node) => {
    if (!$isImageNode(node)) {
      return null;
    }
    return `![${node.getAltText()}](${node.getSrc()})`;
  },
  importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
  regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
  replace: (textNode, match) => {
    const [, altText, src] = match;
    const imageNode = $createImageNode({
      altText,
      maxWidth: 800,
      src
    });
    textNode.replace(imageNode);
  },
  trigger: ")",
  type: "text-match"
};
var EMOJI = {
  dependencies: [],
  export: () => null,
  importRegExp: /:([a-z0-9_]+):/,
  regExp: /:([a-z0-9_]+):$/,
  replace: (textNode, [, name]) => {
    const emoji = emoji_list_default.find((e) => e.aliases.includes(name))?.emoji;
    if (emoji) {
      textNode.replace($createTextNode2(emoji));
    }
  },
  trigger: ":",
  type: "text-match"
};
var EQUATION = {
  dependencies: [EquationNode],
  export: (node) => {
    if (!$isEquationNode(node)) {
      return null;
    }
    return `$${node.getEquation()}$`;
  },
  importRegExp: /\$([^$]+?)\$/,
  regExp: /\$([^$]+?)\$$/,
  replace: (textNode, match) => {
    const [, equation] = match;
    const equationNode = $createEquationNode(equation, true);
    textNode.replace(equationNode);
  },
  trigger: "$",
  type: "text-match"
};
var TWEET = {
  dependencies: [TweetNode],
  export: (node) => {
    if (!$isTweetNode(node)) {
      return null;
    }
    return `<tweet id="${node.getId()}" />`;
  },
  regExp: /<tweet id="([^"]+?)"\s?\/>\s?$/,
  replace: (textNode, _1, match) => {
    const [, id] = match;
    const tweetNode = $createTweetNode(id);
    textNode.replace(tweetNode);
  },
  type: "element"
};
var TABLE_ROW_REG_EXP = /^(?:\|)(.+)(?:\|)\s?$/;
var TABLE_ROW_DIVIDER_REG_EXP = /^(\| ?:?-*:? ?)+\|\s?$/;
var TABLE = {
  dependencies: [TableNode2, TableRowNode2, TableCellNode2],
  export: (node) => {
    if (!$isTableNode(node)) {
      return null;
    }
    const output = [];
    for (const row of node.getChildren()) {
      const rowOutput = [];
      if (!$isTableRowNode(row)) {
        continue;
      }
      let isHeaderRow = false;
      for (const cell of row.getChildren()) {
        if ($isTableCellNode(cell)) {
          rowOutput.push($convertToMarkdownString(PLAYGROUND_TRANSFORMERS, cell).replace(/\n/g, "\\n").trim());
          if (cell.__headerState === TableCellHeaderStates.ROW) {
            isHeaderRow = true;
          }
        }
      }
      output.push(`| ${rowOutput.join(" | ")} |`);
      if (isHeaderRow) {
        output.push(`| ${rowOutput.map((_) => "---").join(" | ")} |`);
      }
    }
    return output.join("\n");
  },
  regExp: TABLE_ROW_REG_EXP,
  replace: (parentNode, _1, match) => {
    if (TABLE_ROW_DIVIDER_REG_EXP.test(match[0])) {
      const table2 = parentNode.getPreviousSibling();
      if (!table2 || !$isTableNode(table2)) {
        return;
      }
      const rows2 = table2.getChildren();
      const lastRow = rows2[rows2.length - 1];
      if (!lastRow || !$isTableRowNode(lastRow)) {
        return;
      }
      lastRow.getChildren().forEach((cell) => {
        if (!$isTableCellNode(cell)) {
          return;
        }
        cell.setHeaderStyles(TableCellHeaderStates.ROW, TableCellHeaderStates.ROW);
      });
      parentNode.remove();
      return;
    }
    const matchCells = mapToTableCells(match[0]);
    if (matchCells == null) {
      return;
    }
    const rows = [matchCells];
    let sibling = parentNode.getPreviousSibling();
    let maxCells = matchCells.length;
    while (sibling) {
      if (!$isParagraphNode4(sibling)) {
        break;
      }
      if (sibling.getChildrenSize() !== 1) {
        break;
      }
      const firstChild = sibling.getFirstChild();
      if (!$isTextNode3(firstChild)) {
        break;
      }
      const cells = mapToTableCells(firstChild.getTextContent());
      if (cells == null) {
        break;
      }
      maxCells = Math.max(maxCells, cells.length);
      rows.unshift(cells);
      const previousSibling2 = sibling.getPreviousSibling();
      sibling.remove();
      sibling = previousSibling2;
    }
    const table = $createTableNode();
    for (const cells of rows) {
      const tableRow = $createTableRowNode();
      table.append(tableRow);
      for (let i = 0; i < maxCells; i++) {
        tableRow.append(i < cells.length ? cells[i] : $createTableCell(""));
      }
    }
    const previousSibling = parentNode.getPreviousSibling();
    if ($isTableNode(previousSibling) && getTableColumnsSize(previousSibling) === maxCells) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }
    table.selectEnd();
  },
  type: "element"
};
function getTableColumnsSize(table) {
  const row = table.getFirstChild();
  return $isTableRowNode(row) ? row.getChildrenSize() : 0;
}
var $createTableCell = (textContent) => {
  textContent = textContent.replace(/\\n/g, "\n");
  const cell = $createTableCellNode(TableCellHeaderStates.NO_STATUS);
  $convertFromMarkdownString(textContent, PLAYGROUND_TRANSFORMERS, cell);
  return cell;
};
var mapToTableCells = (textContent) => {
  const match = textContent.match(TABLE_ROW_REG_EXP);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].split("|").map((text) => $createTableCell(text));
};
var PLAYGROUND_TRANSFORMERS = [
  TABLE,
  HR,
  IMAGE,
  EMOJI,
  EQUATION,
  TWEET,
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS
];

// src/plugins/MarkdownPastePlugin/index.tsx
var MARKDOWN_PATTERNS = {
  // ヘッダー: # Header, ## Header, ### Header
  heading: /^#{1,6}\s+.+/m,
  // 太字: **text** or __text__
  bold: /\*\*[^*]+\*\*|__[^_]+__/,
  // イタリック: *text* or _text_ (太字でないもの)
  italic: /(?<!\*)\*(?!\*)[^*]+\*(?!\*)|(?<!_)_(?!_)[^_]+_(?!_)/,
  // 箇条書きリスト: - item, * item, + item
  unorderedList: /^[\s]*[-*+]\s+.+/m,
  // 番号付きリスト: 1. item, 2. item
  orderedList: /^[\s]*\d+\.\s+.+/m,
  // コードブロック: ```code```
  codeBlock: /```[\s\S]*?```/,
  // インラインコード: `code`
  inlineCode: /`[^`]+`/,
  // リンク: [text](url)
  link: /\[([^\]]+)\]\(([^)]+)\)/,
  // 画像: ![alt](url)
  image: /!\[([^\]]*)\]\(([^)]+)\)/,
  // 引用: > quote
  blockquote: /^>\s+.+/m,
  // 水平線: ---, ***, ___
  horizontalRule: /^(---|\*\*\*|___)\s*$/m,
  // チェックリスト: - [ ] or - [x]
  checklist: /^[\s]*-\s+\[([ xX])\]\s+.+/m,
  // テーブル: | col1 | col2 |
  table: /^\|.+\|$/m
};
function isLikelyMarkdown(text) {
  if (!text || text.trim().length === 0) {
    return false;
  }
  const lines = text.split("\n");
  if (lines.length === 1 && text.length < 50) {
    const hasHeading = MARKDOWN_PATTERNS.heading.test(text);
    const hasBold = MARKDOWN_PATTERNS.bold.test(text);
    const hasItalic = MARKDOWN_PATTERNS.italic.test(text);
    const hasLink = MARKDOWN_PATTERNS.link.test(text);
    const hasInlineCode = MARKDOWN_PATTERNS.inlineCode.test(text);
    if (hasHeading || hasBold || hasItalic || hasLink || hasInlineCode) {
      return true;
    }
    return false;
  }
  let matchCount = 0;
  if (MARKDOWN_PATTERNS.heading.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.bold.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.italic.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.unorderedList.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.orderedList.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.codeBlock.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.inlineCode.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.link.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.image.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.blockquote.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.horizontalRule.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.checklist.test(text)) matchCount++;
  if (MARKDOWN_PATTERNS.table.test(text)) matchCount++;
  const hasStrongPattern = MARKDOWN_PATTERNS.heading.test(text) || MARKDOWN_PATTERNS.codeBlock.test(text) || MARKDOWN_PATTERNS.unorderedList.test(text) || MARKDOWN_PATTERNS.orderedList.test(text) || MARKDOWN_PATTERNS.blockquote.test(text) || MARKDOWN_PATTERNS.table.test(text);
  return matchCount >= 2 || hasStrongPattern;
}
function getPlainTextFromClipboard(event) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return null;
  }
  const htmlData = clipboardData.getData("text/html");
  if (htmlData && htmlData.trim().length > 0) {
    const isSimpleHtml = /<(meta|span|div|p|br)[^>]*>/i.test(htmlData) && !/<(table|img|a|ul|ol|li|h[1-6])[^>]*>/i.test(htmlData);
    if (!isSimpleHtml) {
      return null;
    }
  }
  return clipboardData.getData("text/plain");
}
function MarkdownPastePlugin() {
  const [editor] = useLexicalComposerContext31();
  const handlePaste = useCallback16(
    (event) => {
      const plainText = getPlainTextFromClipboard(event);
      if (!plainText) {
        return false;
      }
      if (!isLikelyMarkdown(plainText)) {
        return false;
      }
      event.preventDefault();
      editor.update(() => {
        const selection = $getSelection14();
        if (!$isRangeSelection11(selection)) {
          return;
        }
        selection.removeText();
        const anchorNode = selection.anchor.getNode();
        const paragraphNode = $createParagraphNode9();
        $convertFromMarkdownString2(plainText, PLAYGROUND_TRANSFORMERS, paragraphNode, true);
        const children = paragraphNode.getChildren();
        if (children.length > 0) {
          const topLevelNode = anchorNode.getTopLevelElement();
          if (topLevelNode) {
            let lastInserted = topLevelNode;
            for (const child of children) {
              lastInserted.insertAfter(child);
              lastInserted = child;
            }
            if (topLevelNode.getTextContent().trim() === "") {
              topLevelNode.remove();
            }
            lastInserted.selectEnd();
          } else {
            selection.insertNodes(children);
          }
        }
      });
      return true;
    },
    [editor]
  );
  useEffect32(() => {
    return editor.registerCommand(
      PASTE_COMMAND2,
      (event) => {
        return handlePaste(event);
      },
      COMMAND_PRIORITY_HIGH6
    );
  }, [editor, handlePaste]);
  return null;
}

// src/plugins/MarkdownShortcutPlugin/index.tsx
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { jsx as jsx47 } from "react/jsx-runtime";
function MarkdownPlugin() {
  return /* @__PURE__ */ jsx47(MarkdownShortcutPlugin, { transformers: PLAYGROUND_TRANSFORMERS });
}

// src/plugins/MaxLengthPlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext32 } from "@lexical/react/LexicalComposerContext";
import { $trimTextContentFromAnchor } from "@lexical/selection";
import { $restoreEditorState } from "@lexical/utils";
import { $getSelection as $getSelection15, $isRangeSelection as $isRangeSelection12, RootNode as RootNode2 } from "lexical";
import { useEffect as useEffect33 } from "react";
function MaxLengthPlugin({ maxLength }) {
  const [editor] = useLexicalComposerContext32();
  useEffect33(() => {
    let lastRestoredEditorState = null;
    return editor.registerNodeTransform(RootNode2, (rootNode) => {
      const selection = $getSelection15();
      if (!$isRangeSelection12(selection) || !selection.isCollapsed()) {
        return;
      }
      const prevEditorState = editor.getEditorState();
      const prevTextContentSize = prevEditorState.read(() => rootNode.getTextContentSize());
      const textContentSize = rootNode.getTextContentSize();
      if (prevTextContentSize !== textContentSize) {
        const delCount = textContentSize - maxLength;
        const anchor = selection.anchor;
        if (delCount > 0) {
          if (prevTextContentSize === maxLength && lastRestoredEditorState !== prevEditorState) {
            lastRestoredEditorState = prevEditorState;
            $restoreEditorState(editor, prevEditorState);
          } else {
            $trimTextContentFromAnchor(editor, anchor, delCount);
          }
        }
      }
    });
  }, [editor, maxLength]);
  return null;
}

// src/core/Editor.tsx
init_MentionsPlugin();

// src/plugins/ShortcutsPlugin/index.tsx
import { TOGGLE_LINK_COMMAND as TOGGLE_LINK_COMMAND5 } from "@lexical/link";
import {
  COMMAND_PRIORITY_NORMAL,
  FORMAT_ELEMENT_COMMAND as FORMAT_ELEMENT_COMMAND2,
  FORMAT_TEXT_COMMAND as FORMAT_TEXT_COMMAND2,
  INDENT_CONTENT_COMMAND,
  isModifierMatch as isModifierMatch2,
  KEY_DOWN_COMMAND,
  OUTDENT_CONTENT_COMMAND
} from "lexical";
import { useEffect as useEffect34 } from "react";
init_url();

// src/plugins/ToolbarPlugin/utils.ts
import { $createCodeNode as $createCodeNode2 } from "@lexical/code";
import { INSERT_CHECK_LIST_COMMAND as INSERT_CHECK_LIST_COMMAND2, INSERT_ORDERED_LIST_COMMAND as INSERT_ORDERED_LIST_COMMAND2, INSERT_UNORDERED_LIST_COMMAND as INSERT_UNORDERED_LIST_COMMAND2 } from "@lexical/list";
import { $isDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import {
  $createHeadingNode as $createHeadingNode2,
  $createQuoteNode as $createQuoteNode2,
  $isHeadingNode,
  $isQuoteNode
} from "@lexical/rich-text";
import { $patchStyleText as $patchStyleText2, $setBlocksType as $setBlocksType2 } from "@lexical/selection";
import { $isTableSelection } from "@lexical/table";
import { $getNearestBlockElementAncestorOrThrow } from "@lexical/utils";
import {
  $addUpdateTag as $addUpdateTag2,
  $createParagraphNode as $createParagraphNode10,
  $getSelection as $getSelection16,
  $isRangeSelection as $isRangeSelection13,
  $isTextNode as $isTextNode4,
  SKIP_DOM_SELECTION_TAG as SKIP_DOM_SELECTION_TAG2,
  SKIP_SELECTION_FOCUS_TAG
} from "lexical";
var calculateNextFontSize = (currentFontSize, updateType) => {
  if (!updateType) {
    return currentFontSize;
  }
  let updatedFontSize = currentFontSize;
  switch (updateType) {
    case 2 /* decrement */:
      switch (true) {
        case currentFontSize > MAX_ALLOWED_FONT_SIZE:
          updatedFontSize = MAX_ALLOWED_FONT_SIZE;
          break;
        case currentFontSize >= 48:
          updatedFontSize -= 12;
          break;
        case currentFontSize >= 24:
          updatedFontSize -= 4;
          break;
        case currentFontSize >= 14:
          updatedFontSize -= 2;
          break;
        case currentFontSize >= 9:
          updatedFontSize -= 1;
          break;
        default:
          updatedFontSize = MIN_ALLOWED_FONT_SIZE;
          break;
      }
      break;
    case 1 /* increment */:
      switch (true) {
        case currentFontSize < MIN_ALLOWED_FONT_SIZE:
          updatedFontSize = MIN_ALLOWED_FONT_SIZE;
          break;
        case currentFontSize < 12:
          updatedFontSize += 1;
          break;
        case currentFontSize < 20:
          updatedFontSize += 2;
          break;
        case currentFontSize < 36:
          updatedFontSize += 4;
          break;
        case currentFontSize <= 60:
          updatedFontSize += 12;
          break;
        default:
          updatedFontSize = MAX_ALLOWED_FONT_SIZE;
          break;
      }
      break;
    default:
      break;
  }
  return updatedFontSize;
};
var updateFontSizeInSelection = (editor, newFontSize, updateType, skipRefocus) => {
  const getNextFontSize = (prevFontSize) => {
    if (!prevFontSize) {
      prevFontSize = `${DEFAULT_FONT_SIZE}px`;
    }
    prevFontSize = prevFontSize.slice(0, -2);
    const nextFontSize = calculateNextFontSize(Number(prevFontSize), updateType);
    return `${nextFontSize}px`;
  };
  editor.update(() => {
    if (skipRefocus) {
      $addUpdateTag2(SKIP_DOM_SELECTION_TAG2);
    }
    if (editor.isEditable()) {
      const selection = $getSelection16();
      if (selection !== null) {
        $patchStyleText2(selection, {
          "font-size": newFontSize || getNextFontSize
        });
      }
    }
  });
};
var updateFontSize = (editor, updateType, inputValue, skipRefocus = false) => {
  if (inputValue !== "") {
    const nextFontSize = calculateNextFontSize(Number(inputValue), updateType);
    updateFontSizeInSelection(editor, `${String(nextFontSize)}px`, null, skipRefocus);
  } else {
    updateFontSizeInSelection(editor, null, updateType, skipRefocus);
  }
};
var formatParagraph = (editor) => {
  editor.update(() => {
    $addUpdateTag2(SKIP_SELECTION_FOCUS_TAG);
    const selection = $getSelection16();
    $setBlocksType2(selection, () => $createParagraphNode10());
  });
};
var formatHeading = (editor, blockType, headingSize) => {
  if (blockType !== headingSize) {
    editor.update(() => {
      $addUpdateTag2(SKIP_SELECTION_FOCUS_TAG);
      const selection = $getSelection16();
      $setBlocksType2(selection, () => $createHeadingNode2(headingSize));
    });
  }
};
var formatBulletList = (editor, blockType) => {
  if (blockType !== "bullet") {
    editor.update(() => {
      $addUpdateTag2(SKIP_SELECTION_FOCUS_TAG);
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND2, void 0);
    });
  } else {
    formatParagraph(editor);
  }
};
var formatCheckList = (editor, blockType) => {
  if (blockType !== "check") {
    editor.update(() => {
      $addUpdateTag2(SKIP_SELECTION_FOCUS_TAG);
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND2, void 0);
    });
  } else {
    formatParagraph(editor);
  }
};
var formatNumberedList = (editor, blockType) => {
  if (blockType !== "number") {
    editor.update(() => {
      $addUpdateTag2(SKIP_SELECTION_FOCUS_TAG);
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND2, void 0);
    });
  } else {
    formatParagraph(editor);
  }
};
var formatQuote = (editor, blockType) => {
  if (blockType !== "quote") {
    editor.update(() => {
      $addUpdateTag2(SKIP_SELECTION_FOCUS_TAG);
      const selection = $getSelection16();
      $setBlocksType2(selection, () => $createQuoteNode2());
    });
  }
};
var formatCode = (editor, blockType) => {
  if (blockType !== "code") {
    editor.update(() => {
      $addUpdateTag2(SKIP_SELECTION_FOCUS_TAG);
      let selection = $getSelection16();
      if (!selection) {
        return;
      }
      if (!$isRangeSelection13(selection) || selection.isCollapsed()) {
        $setBlocksType2(selection, () => $createCodeNode2());
      } else {
        const textContent = selection.getTextContent();
        const codeNode = $createCodeNode2();
        selection.insertNodes([codeNode]);
        selection = $getSelection16();
        if ($isRangeSelection13(selection)) {
          selection.insertRawText(textContent);
        }
      }
    });
  }
};
var clearFormatting = (editor, skipRefocus = false) => {
  editor.update(() => {
    if (skipRefocus) {
      $addUpdateTag2(SKIP_DOM_SELECTION_TAG2);
    }
    const selection = $getSelection16();
    if ($isRangeSelection13(selection) || $isTableSelection(selection)) {
      const anchor = selection.anchor;
      const focus = selection.focus;
      const nodes = selection.getNodes();
      const extractedNodes = selection.extract();
      if (anchor.key === focus.key && anchor.offset === focus.offset) {
        return;
      }
      nodes.forEach((node, idx) => {
        if ($isTextNode4(node)) {
          let textNode = node;
          if (idx === 0 && anchor.offset !== 0) {
            textNode = textNode.splitText(anchor.offset)[1] || textNode;
          }
          if (idx === nodes.length - 1) {
            textNode = textNode.splitText(focus.offset)[0] || textNode;
          }
          const extractedTextNode = extractedNodes[0];
          if (nodes.length === 1 && $isTextNode4(extractedTextNode)) {
            textNode = extractedTextNode;
          }
          if (textNode.__style !== "") {
            textNode.setStyle("");
          }
          if (textNode.__format !== 0) {
            textNode.setFormat(0);
          }
          const nearestBlockElement = $getNearestBlockElementAncestorOrThrow(textNode);
          if (nearestBlockElement.__format !== 0) {
            nearestBlockElement.setFormat("");
          }
          if (nearestBlockElement.__indent !== 0) {
            nearestBlockElement.setIndent(0);
          }
          node = textNode;
        } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
          node.replace($createParagraphNode10(), true);
        } else if ($isDecoratorBlockNode(node)) {
          node.setFormat("");
        }
      });
    }
  });
};

// src/plugins/ShortcutsPlugin/shortcuts.ts
import { IS_APPLE } from "@lexical/utils";
import { isModifierMatch } from "lexical";
var SHORTCUTS = Object.freeze({
  // (Ctrl|⌘) + (Alt|Option) + <key> shortcuts
  NORMAL: IS_APPLE ? "\u2318+Opt+0" : "Ctrl+Alt+0",
  HEADING1: IS_APPLE ? "\u2318+Opt+1" : "Ctrl+Alt+1",
  HEADING2: IS_APPLE ? "\u2318+Opt+2" : "Ctrl+Alt+2",
  HEADING3: IS_APPLE ? "\u2318+Opt+3" : "Ctrl+Alt+3",
  NUMBERED_LIST: IS_APPLE ? "\u2318+Shift+7" : "Ctrl+Shift+7",
  BULLET_LIST: IS_APPLE ? "\u2318+Shift+8" : "Ctrl+Shift+8",
  CHECK_LIST: IS_APPLE ? "\u2318+Shift+9" : "Ctrl+Shift+9",
  CODE_BLOCK: IS_APPLE ? "\u2318+Opt+C" : "Ctrl+Alt+C",
  QUOTE: IS_APPLE ? "\u2303+Shift+Q" : "Ctrl+Shift+Q",
  ADD_COMMENT: IS_APPLE ? "\u2318+Opt+M" : "Ctrl+Alt+M",
  // (Ctrl|⌘) + Shift + <key> shortcuts
  INCREASE_FONT_SIZE: IS_APPLE ? "\u2318+Shift+." : "Ctrl+Shift+.",
  DECREASE_FONT_SIZE: IS_APPLE ? "\u2318+Shift+," : "Ctrl+Shift+,",
  INSERT_CODE_BLOCK: IS_APPLE ? "\u2318+Shift+C" : "Ctrl+Shift+C",
  STRIKETHROUGH: IS_APPLE ? "\u2318+Shift+X" : "Ctrl+Shift+X",
  LOWERCASE: IS_APPLE ? "\u2303+Shift+1" : "Ctrl+Shift+1",
  UPPERCASE: IS_APPLE ? "\u2303+Shift+2" : "Ctrl+Shift+2",
  CAPITALIZE: IS_APPLE ? "\u2303+Shift+3" : "Ctrl+Shift+3",
  CENTER_ALIGN: IS_APPLE ? "\u2318+Shift+E" : "Ctrl+Shift+E",
  JUSTIFY_ALIGN: IS_APPLE ? "\u2318+Shift+J" : "Ctrl+Shift+J",
  LEFT_ALIGN: IS_APPLE ? "\u2318+Shift+L" : "Ctrl+Shift+L",
  RIGHT_ALIGN: IS_APPLE ? "\u2318+Shift+R" : "Ctrl+Shift+R",
  // (Ctrl|⌘) + <key> shortcuts
  SUBSCRIPT: IS_APPLE ? "\u2318+," : "Ctrl+,",
  SUPERSCRIPT: IS_APPLE ? "\u2318+." : "Ctrl+.",
  INDENT: IS_APPLE ? "\u2318+]" : "Ctrl+]",
  OUTDENT: IS_APPLE ? "\u2318+[" : "Ctrl+[",
  CLEAR_FORMATTING: IS_APPLE ? "\u2318+\\" : "Ctrl+\\",
  REDO: IS_APPLE ? "\u2318+Shift+Z" : "Ctrl+Y",
  UNDO: IS_APPLE ? "\u2318+Z" : "Ctrl+Z",
  BOLD: IS_APPLE ? "\u2318+B" : "Ctrl+B",
  ITALIC: IS_APPLE ? "\u2318+I" : "Ctrl+I",
  UNDERLINE: IS_APPLE ? "\u2318+U" : "Ctrl+U",
  INSERT_LINK: IS_APPLE ? "\u2318+K" : "Ctrl+K"
});
var CONTROL_OR_META = { ctrlKey: !IS_APPLE, metaKey: IS_APPLE };
function isFormatParagraph(event) {
  const { code } = event;
  return (code === "Numpad0" || code === "Digit0") && isModifierMatch(event, { ...CONTROL_OR_META, altKey: true });
}
function isFormatHeading(event) {
  const { code } = event;
  if (!code) {
    return false;
  }
  const keyNumber = code[code.length - 1];
  return ["1", "2", "3"].includes(keyNumber) && isModifierMatch(event, { ...CONTROL_OR_META, altKey: true });
}
function isFormatNumberedList(event) {
  const { code } = event;
  return (code === "Numpad7" || code === "Digit7") && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isFormatBulletList(event) {
  const { code } = event;
  return (code === "Numpad8" || code === "Digit8") && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isFormatCheckList(event) {
  const { code } = event;
  return (code === "Numpad9" || code === "Digit9") && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isFormatCode(event) {
  const { code } = event;
  return code === "KeyC" && isModifierMatch(event, { ...CONTROL_OR_META, altKey: true });
}
function isFormatQuote(event) {
  const { code } = event;
  return code === "KeyQ" && isModifierMatch(event, {
    ctrlKey: true,
    shiftKey: true
  });
}
function isLowercase(event) {
  const { code } = event;
  return (code === "Numpad1" || code === "Digit1") && isModifierMatch(event, { ctrlKey: true, shiftKey: true });
}
function isUppercase(event) {
  const { code } = event;
  return (code === "Numpad2" || code === "Digit2") && isModifierMatch(event, { ctrlKey: true, shiftKey: true });
}
function isCapitalize(event) {
  const { code } = event;
  return (code === "Numpad3" || code === "Digit3") && isModifierMatch(event, { ctrlKey: true, shiftKey: true });
}
function isStrikeThrough(event) {
  const { code } = event;
  return code === "KeyX" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isIndent(event) {
  const { code } = event;
  return code === "BracketRight" && isModifierMatch(event, CONTROL_OR_META);
}
function isOutdent(event) {
  const { code } = event;
  return code === "BracketLeft" && isModifierMatch(event, CONTROL_OR_META);
}
function isCenterAlign(event) {
  const { code } = event;
  return code === "KeyE" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isLeftAlign(event) {
  const { code } = event;
  return code === "KeyL" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isRightAlign(event) {
  const { code } = event;
  return code === "KeyR" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isJustifyAlign(event) {
  const { code } = event;
  return code === "KeyJ" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isSubscript(event) {
  const { code } = event;
  return code === "Comma" && isModifierMatch(event, CONTROL_OR_META);
}
function isSuperscript(event) {
  const { code } = event;
  return code === "Period" && isModifierMatch(event, CONTROL_OR_META);
}
function isInsertCodeBlock(event) {
  const { code } = event;
  return code === "KeyC" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isIncreaseFontSize(event) {
  const { code } = event;
  return code === "Period" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isDecreaseFontSize(event) {
  const { code } = event;
  return code === "Comma" && isModifierMatch(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isClearFormatting(event) {
  const { code } = event;
  return code === "Backslash" && isModifierMatch(event, CONTROL_OR_META);
}
function isInsertLink(event) {
  const { code } = event;
  return code === "KeyK" && isModifierMatch(event, CONTROL_OR_META);
}

// src/plugins/ShortcutsPlugin/index.tsx
function ShortcutsPlugin({
  editor,
  setIsLinkEditMode
}) {
  const { toolbarState } = useToolbarState();
  useEffect34(() => {
    const keyboardShortcutsHandler = (event) => {
      if (isModifierMatch2(event, {})) {
        return false;
      } else if (isFormatParagraph(event)) {
        formatParagraph(editor);
      } else if (isFormatHeading(event)) {
        const { code } = event;
        const headingSize = `h${code[code.length - 1]}`;
        formatHeading(editor, toolbarState.blockType, headingSize);
      } else if (isFormatBulletList(event)) {
        formatBulletList(editor, toolbarState.blockType);
      } else if (isFormatNumberedList(event)) {
        formatNumberedList(editor, toolbarState.blockType);
      } else if (isFormatCheckList(event)) {
        formatCheckList(editor, toolbarState.blockType);
      } else if (isFormatCode(event)) {
        formatCode(editor, toolbarState.blockType);
      } else if (isFormatQuote(event)) {
        formatQuote(editor, toolbarState.blockType);
      } else if (isStrikeThrough(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND2, "strikethrough");
      } else if (isLowercase(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND2, "lowercase");
      } else if (isUppercase(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND2, "uppercase");
      } else if (isCapitalize(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND2, "capitalize");
      } else if (isIndent(event)) {
        editor.dispatchCommand(INDENT_CONTENT_COMMAND, void 0);
      } else if (isOutdent(event)) {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, void 0);
      } else if (isCenterAlign(event)) {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND2, "center");
      } else if (isLeftAlign(event)) {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND2, "left");
      } else if (isRightAlign(event)) {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND2, "right");
      } else if (isJustifyAlign(event)) {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND2, "justify");
      } else if (isSubscript(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND2, "subscript");
      } else if (isSuperscript(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND2, "superscript");
      } else if (isInsertCodeBlock(event)) {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND2, "code");
      } else if (isIncreaseFontSize(event)) {
        updateFontSize(editor, 1 /* increment */, toolbarState.fontSizeInputValue);
      } else if (isDecreaseFontSize(event)) {
        updateFontSize(editor, 2 /* decrement */, toolbarState.fontSizeInputValue);
      } else if (isClearFormatting(event)) {
        clearFormatting(editor);
      } else if (isInsertLink(event)) {
        const url = toolbarState.isLink ? null : sanitizeUrl("https://");
        setIsLinkEditMode(!toolbarState.isLink);
        editor.dispatchCommand(TOGGLE_LINK_COMMAND5, url);
      } else {
        return false;
      }
      event.preventDefault();
      return true;
    };
    return editor.registerCommand(KEY_DOWN_COMMAND, keyboardShortcutsHandler, COMMAND_PRIORITY_NORMAL);
  }, [editor, toolbarState.isLink, toolbarState.blockType, toolbarState.fontSizeInputValue, setIsLinkEditMode]);
  return null;
}

// src/plugins/SpecialTextPlugin/index.ts
import { useLexicalComposerContext as useLexicalComposerContext33 } from "@lexical/react/LexicalComposerContext";
import { TextNode as TextNode9 } from "lexical";
import { useEffect as useEffect35 } from "react";

// src/nodes/SpecialTextNode.tsx
import { addClassNamesToElement as addClassNamesToElement3 } from "@lexical/utils";
import { $applyNodeReplacement as $applyNodeReplacement6, TextNode as TextNode8 } from "lexical";
var SpecialTextNode = class _SpecialTextNode extends TextNode8 {
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

// src/plugins/SpecialTextPlugin/index.ts
var BRACKETED_TEXT_REGEX = /\[([^[\]]+)\]/;
function $findAndTransformText(node) {
  const text = node.getTextContent();
  const match = BRACKETED_TEXT_REGEX.exec(text);
  if (match) {
    const matchedText = match[1];
    const startIndex = match.index;
    let targetNode;
    if (startIndex === 0) {
      [targetNode] = node.splitText(startIndex + match[0].length);
    } else {
      [, targetNode] = node.splitText(startIndex, startIndex + match[0].length);
    }
    const specialTextNode = $createSpecialTextNode(matchedText);
    targetNode.replace(specialTextNode);
    return specialTextNode;
  }
  return null;
}
function $textNodeTransform3(node) {
  let targetNode = node;
  while (targetNode !== null) {
    if (!targetNode.isSimpleText()) {
      return;
    }
    targetNode = $findAndTransformText(targetNode);
  }
}
function useTextTransformation(editor) {
  useEffect35(() => {
    if (!editor.hasNodes([SpecialTextNode])) {
      throw new Error("SpecialTextPlugin: SpecialTextNode not registered on editor");
    }
    return editor.registerNodeTransform(TextNode9, $textNodeTransform3);
  }, [editor]);
}
function SpecialTextPlugin() {
  const [editor] = useLexicalComposerContext33();
  useTextTransformation(editor);
  return null;
}

// src/plugins/TabFocusPlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext34 } from "@lexical/react/LexicalComposerContext";
import { $getSelection as $getSelection17, $isRangeSelection as $isRangeSelection14, $setSelection as $setSelection6, COMMAND_PRIORITY_LOW as COMMAND_PRIORITY_LOW11, FOCUS_COMMAND } from "lexical";
import { useEffect as useEffect36 } from "react";
var TAB_TO_FOCUS_INTERVAL = 100;
var lastTabKeyDownTimestamp = 0;
var hasRegisteredKeyDownListener = false;
function registerKeyTimeStampTracker() {
  window.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Tab") {
        lastTabKeyDownTimestamp = event.timeStamp;
      }
    },
    true
  );
}
function TabFocusPlugin() {
  const [editor] = useLexicalComposerContext34();
  useEffect36(() => {
    if (!hasRegisteredKeyDownListener) {
      registerKeyTimeStampTracker();
      hasRegisteredKeyDownListener = true;
    }
    return editor.registerCommand(
      FOCUS_COMMAND,
      (event) => {
        const selection = $getSelection17();
        if ($isRangeSelection14(selection)) {
          if (lastTabKeyDownTimestamp + TAB_TO_FOCUS_INTERVAL > event.timeStamp) {
            $setSelection6(selection.clone());
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW11
    );
  }, [editor]);
  return null;
}

// src/plugins/TableActionMenuPlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext35 } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable as useLexicalEditable3 } from "@lexical/react/useLexicalEditable";
import {
  $computeTableMapSkipCellCheck,
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getNodeTriplet,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode as $isTableCellNode2,
  $isTableSelection as $isTableSelection2,
  $mergeCells,
  $unmergeCell,
  getTableElement,
  getTableObserverFromTableElement,
  TableCellHeaderStates as TableCellHeaderStates2,
  TableCellNode as TableCellNode3
} from "@lexical/table";
import { mergeRegister as mergeRegister13 } from "@lexical/utils";
import {
  $getSelection as $getSelection18,
  $isElementNode as $isElementNode4,
  $isRangeSelection as $isRangeSelection15,
  $isTextNode as $isTextNode5,
  $setSelection as $setSelection7,
  COMMAND_PRIORITY_CRITICAL as COMMAND_PRIORITY_CRITICAL2,
  getDOMSelection as getDOMSelection3,
  isDOMNode as isDOMNode3,
  SELECTION_CHANGE_COMMAND as SELECTION_CHANGE_COMMAND5
} from "lexical";
import { useCallback as useCallback17, useEffect as useEffect37, useRef as useRef15, useState as useState25 } from "react";
import { createPortal as createPortal9 } from "react-dom";
import { Fragment as Fragment15, jsx as jsx48, jsxs as jsxs24 } from "react/jsx-runtime";
function computeSelectionCount(selection) {
  const selectionShape = selection.getShape();
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1
  };
}
function $canUnmerge() {
  const selection = $getSelection18();
  if ($isRangeSelection15(selection) && !selection.isCollapsed() || $isTableSelection2(selection) && !selection.anchor.is(selection.focus) || !$isRangeSelection15(selection) && !$isTableSelection2(selection)) {
    return false;
  }
  const [cell] = $getNodeTriplet(selection.anchor);
  return cell.__colSpan > 1 || cell.__rowSpan > 1;
}
function $selectLastDescendant(node) {
  const lastDescendant = node.getLastDescendant();
  if ($isTextNode5(lastDescendant)) {
    lastDescendant.select();
  } else if ($isElementNode4(lastDescendant)) {
    lastDescendant.selectEnd();
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext();
  }
}
function currentCellBackgroundColor(editor) {
  return editor.getEditorState().read(() => {
    const selection = $getSelection18();
    if ($isRangeSelection15(selection) || $isTableSelection2(selection)) {
      const [cell] = $getNodeTriplet(selection.anchor);
      if ($isTableCellNode2(cell)) {
        return cell.getBackgroundColor();
      }
    }
    return null;
  });
}
function TableActionMenu({
  onClose,
  tableCellNode: _tableCellNode,
  setIsMenuOpen,
  contextRef,
  cellMerge,
  showColorPickerModal
}) {
  const [editor] = useLexicalComposerContext35();
  const dropDownRef = useRef15(null);
  const [tableCellNode, updateTableCellNode] = useState25(_tableCellNode);
  const [selectionCounts, updateSelectionCounts] = useState25({
    columns: 1,
    rows: 1
  });
  const [canMergeCells, setCanMergeCells] = useState25(false);
  const [canUnmergeCell, setCanUnmergeCell] = useState25(false);
  const [backgroundColor, setBackgroundColor] = useState25(() => currentCellBackgroundColor(editor) || "");
  useEffect37(() => {
    return editor.registerMutationListener(
      TableCellNode3,
      (nodeMutations) => {
        const nodeUpdated = nodeMutations.get(tableCellNode.getKey()) === "updated";
        if (nodeUpdated) {
          editor.getEditorState().read(() => {
            updateTableCellNode(tableCellNode.getLatest());
          });
          setBackgroundColor(currentCellBackgroundColor(editor) || "");
        }
      },
      { skipInitialization: true }
    );
  }, [editor, tableCellNode]);
  useEffect37(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection18();
      if ($isTableSelection2(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection);
        updateSelectionCounts(computeSelectionCount(selection));
        setCanMergeCells(currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1);
      }
      setCanUnmergeCell($canUnmerge());
    });
  }, [editor]);
  useEffect37(() => {
    const menuButtonElement = contextRef.current;
    const dropDownElement = dropDownRef.current;
    const rootElement = editor.getRootElement();
    if (menuButtonElement != null && dropDownElement != null && rootElement != null) {
      const rootEleRect = rootElement.getBoundingClientRect();
      const menuButtonRect = menuButtonElement.getBoundingClientRect();
      dropDownElement.style.opacity = "1";
      const dropDownElementRect = dropDownElement.getBoundingClientRect();
      const margin = 5;
      let leftPosition = menuButtonRect.right + margin;
      if (leftPosition + dropDownElementRect.width > window.innerWidth || leftPosition + dropDownElementRect.width > rootEleRect.right) {
        const position = menuButtonRect.left - dropDownElementRect.width - margin;
        leftPosition = (position < 0 ? margin : position) + window.pageXOffset;
      }
      dropDownElement.style.left = `${leftPosition + window.pageXOffset}px`;
      let topPosition = menuButtonRect.top;
      if (topPosition + dropDownElementRect.height > window.innerHeight) {
        const position = menuButtonRect.bottom - dropDownElementRect.height;
        topPosition = position < 0 ? margin : position;
      }
      dropDownElement.style.top = `${topPosition}px`;
    }
  }, [contextRef, editor]);
  useEffect37(() => {
    function handleClickOutside(event) {
      if (dropDownRef.current != null && contextRef.current != null && isDOMNode3(event.target) && !dropDownRef.current.contains(event.target) && !contextRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [setIsMenuOpen, contextRef]);
  const clearTableSelection = useCallback17(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
        if (tableElement === null) {
          throw new Error("TableActionMenu: Expected to find tableElement in DOM");
        }
        const tableObserver = getTableObserverFromTableElement(tableElement);
        if (tableObserver !== null) {
          tableObserver.$clearHighlight();
        }
        tableNode.markDirty();
        updateTableCellNode(tableCellNode.getLatest());
      }
      $setSelection7(null);
    });
  }, [editor, tableCellNode]);
  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      const selection = $getSelection18();
      if (!$isTableSelection2(selection)) {
        return;
      }
      const nodes = selection.getNodes();
      const tableCells = nodes.filter($isTableCellNode2);
      const targetCell = $mergeCells(tableCells);
      if (targetCell) {
        $selectLastDescendant(targetCell);
        onClose();
      }
    });
  };
  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      $unmergeCell();
    });
  };
  const insertTableRowAtSelection = useCallback17(
    (shouldInsertAfter) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.rows; i++) {
          $insertTableRowAtSelection(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.rows]
  );
  const insertTableColumnAtSelection = useCallback17(
    (shouldInsertAfter) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.columns; i++) {
          $insertTableColumnAtSelection(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.columns]
  );
  const deleteTableRowAtSelection = useCallback17(() => {
    editor.update(() => {
      $deleteTableRowAtSelection();
      onClose();
    });
  }, [editor, onClose]);
  const deleteTableAtSelection = useCallback17(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      tableNode.remove();
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const deleteTableColumnAtSelection = useCallback17(() => {
    editor.update(() => {
      $deleteTableColumnAtSelection();
      onClose();
    });
  }, [editor, onClose]);
  const toggleTableRowIsHeader = useCallback17(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
      const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
      const rowCells = /* @__PURE__ */ new Set();
      const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates2.ROW;
      for (let col = 0; col < gridMap[tableRowIndex].length; col++) {
        const mapCell = gridMap[tableRowIndex][col];
        if (!mapCell?.cell) {
          continue;
        }
        if (!rowCells.has(mapCell.cell)) {
          rowCells.add(mapCell.cell);
          mapCell.cell.setHeaderStyles(newStyle, TableCellHeaderStates2.ROW);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleTableColumnIsHeader = useCallback17(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableColumnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
      const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);
      const columnCells = /* @__PURE__ */ new Set();
      const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates2.COLUMN;
      for (let row = 0; row < gridMap.length; row++) {
        const mapCell = gridMap[row][tableColumnIndex];
        if (!mapCell?.cell) {
          continue;
        }
        if (!columnCells.has(mapCell.cell)) {
          columnCells.add(mapCell.cell);
          mapCell.cell.setHeaderStyles(newStyle, TableCellHeaderStates2.COLUMN);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleRowStriping = useCallback17(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setRowStriping(!tableNode.getRowStriping());
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleFirstRowFreeze = useCallback17(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setFrozenRows(tableNode.getFrozenRows() === 0 ? 1 : 0);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleFirstColumnFreeze = useCallback17(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setFrozenColumns(tableNode.getFrozenColumns() === 0 ? 1 : 0);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const handleCellBackgroundColor = useCallback17(
    (value) => {
      editor.update(() => {
        const selection = $getSelection18();
        if ($isRangeSelection15(selection) || $isTableSelection2(selection)) {
          const [cell] = $getNodeTriplet(selection.anchor);
          if ($isTableCellNode2(cell)) {
            cell.setBackgroundColor(value);
          }
          if ($isTableSelection2(selection)) {
            const nodes = selection.getNodes();
            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];
              if ($isTableCellNode2(node)) {
                node.setBackgroundColor(value);
              }
            }
          }
        }
      });
    },
    [editor]
  );
  const formatVerticalAlign = (value) => {
    editor.update(() => {
      const selection = $getSelection18();
      if ($isRangeSelection15(selection) || $isTableSelection2(selection)) {
        const [cell] = $getNodeTriplet(selection.anchor);
        if ($isTableCellNode2(cell)) {
          cell.setVerticalAlign(value);
        }
        if ($isTableSelection2(selection)) {
          const nodes = selection.getNodes();
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if ($isTableCellNode2(node)) {
              node.setVerticalAlign(value);
            }
          }
        }
      }
    });
  };
  let mergeCellButton = null;
  if (cellMerge) {
    if (canMergeCells) {
      mergeCellButton = /* @__PURE__ */ jsx48(
        "button",
        {
          type: "button",
          className: "item",
          onClick: () => mergeTableCellsAtSelection(),
          "data-test-id": "table-merge-cells",
          children: /* @__PURE__ */ jsx48("span", { className: "text", children: "Merge cells" })
        }
      );
    } else if (canUnmergeCell) {
      mergeCellButton = /* @__PURE__ */ jsx48(
        "button",
        {
          type: "button",
          className: "item",
          onClick: () => unmergeTableCellsAtSelection(),
          "data-test-id": "table-unmerge-cells",
          children: /* @__PURE__ */ jsx48("span", { className: "text", children: "Unmerge cells" })
        }
      );
    }
  }
  return createPortal9(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    /* @__PURE__ */ jsxs24(
      "div",
      {
        className: "notion-like-editor nle-dropdown",
        ref: dropDownRef,
        onClick: (e) => {
          e.stopPropagation();
        },
        children: [
          mergeCellButton,
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => showColorPickerModal("Cell background color", () => /* @__PURE__ */ jsx48(ColorPicker, { color: backgroundColor, onChange: handleCellBackgroundColor })),
              "data-test-id": "table-background-color",
              children: /* @__PURE__ */ jsx48("span", { className: "text", children: "Background color" })
            }
          ),
          /* @__PURE__ */ jsx48("button", { type: "button", className: "item", onClick: () => toggleRowStriping(), "data-test-id": "table-row-striping", children: /* @__PURE__ */ jsx48("span", { className: "text", children: "Toggle Row Striping" }) }),
          /* @__PURE__ */ jsxs24(
            DropDown,
            {
              buttonLabel: "Vertical Align",
              buttonClassName: "item",
              buttonAriaLabel: "Formatting options for vertical alignment",
              children: [
                /* @__PURE__ */ jsx48(
                  DropDownItem,
                  {
                    onClick: () => {
                      formatVerticalAlign("top");
                    },
                    className: "item wide",
                    children: /* @__PURE__ */ jsxs24("div", { className: "icon-text-container", children: [
                      /* @__PURE__ */ jsx48("i", { className: "icon vertical-top" }),
                      /* @__PURE__ */ jsx48("span", { className: "text", children: "Top Align" })
                    ] })
                  }
                ),
                /* @__PURE__ */ jsx48(
                  DropDownItem,
                  {
                    onClick: () => {
                      formatVerticalAlign("middle");
                    },
                    className: "item wide",
                    children: /* @__PURE__ */ jsxs24("div", { className: "icon-text-container", children: [
                      /* @__PURE__ */ jsx48("i", { className: "icon vertical-middle" }),
                      /* @__PURE__ */ jsx48("span", { className: "text", children: "Middle Align" })
                    ] })
                  }
                ),
                /* @__PURE__ */ jsx48(
                  DropDownItem,
                  {
                    onClick: () => {
                      formatVerticalAlign("bottom");
                    },
                    className: "item wide",
                    children: /* @__PURE__ */ jsxs24("div", { className: "icon-text-container", children: [
                      /* @__PURE__ */ jsx48("i", { className: "icon vertical-bottom" }),
                      /* @__PURE__ */ jsx48("span", { className: "text", children: "Bottom Align" })
                    ] })
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => toggleFirstRowFreeze(),
              "data-test-id": "table-freeze-first-row",
              children: /* @__PURE__ */ jsx48("span", { className: "text", children: "Toggle First Row Freeze" })
            }
          ),
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => toggleFirstColumnFreeze(),
              "data-test-id": "table-freeze-first-column",
              children: /* @__PURE__ */ jsx48("span", { className: "text", children: "Toggle First Column Freeze" })
            }
          ),
          /* @__PURE__ */ jsx48("hr", {}),
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => insertTableRowAtSelection(false),
              "data-test-id": "table-insert-row-above",
              children: /* @__PURE__ */ jsxs24("span", { className: "text", children: [
                "Insert ",
                selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`,
                " above"
              ] })
            }
          ),
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => insertTableRowAtSelection(true),
              "data-test-id": "table-insert-row-below",
              children: /* @__PURE__ */ jsxs24("span", { className: "text", children: [
                "Insert ",
                selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`,
                " below"
              ] })
            }
          ),
          /* @__PURE__ */ jsx48("hr", {}),
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => insertTableColumnAtSelection(false),
              "data-test-id": "table-insert-column-before",
              children: /* @__PURE__ */ jsxs24("span", { className: "text", children: [
                "Insert ",
                selectionCounts.columns === 1 ? "column" : `${selectionCounts.columns} columns`,
                " left"
              ] })
            }
          ),
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => insertTableColumnAtSelection(true),
              "data-test-id": "table-insert-column-after",
              children: /* @__PURE__ */ jsxs24("span", { className: "text", children: [
                "Insert ",
                selectionCounts.columns === 1 ? "column" : `${selectionCounts.columns} columns`,
                " right"
              ] })
            }
          ),
          /* @__PURE__ */ jsx48("hr", {}),
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => deleteTableColumnAtSelection(),
              "data-test-id": "table-delete-columns",
              children: /* @__PURE__ */ jsx48("span", { className: "text", children: "Delete column" })
            }
          ),
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => deleteTableRowAtSelection(),
              "data-test-id": "table-delete-rows",
              children: /* @__PURE__ */ jsx48("span", { className: "text", children: "Delete row" })
            }
          ),
          /* @__PURE__ */ jsx48("button", { type: "button", className: "item", onClick: () => deleteTableAtSelection(), "data-test-id": "table-delete", children: /* @__PURE__ */ jsx48("span", { className: "text", children: "Delete table" }) }),
          /* @__PURE__ */ jsx48("hr", {}),
          /* @__PURE__ */ jsx48("button", { type: "button", className: "item", onClick: () => toggleTableRowIsHeader(), "data-test-id": "table-row-header", children: /* @__PURE__ */ jsxs24("span", { className: "text", children: [
            (tableCellNode.__headerState & TableCellHeaderStates2.ROW) === TableCellHeaderStates2.ROW ? "Remove" : "Add",
            " ",
            "row header"
          ] }) }),
          /* @__PURE__ */ jsx48(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => toggleTableColumnIsHeader(),
              "data-test-id": "table-column-header",
              children: /* @__PURE__ */ jsxs24("span", { className: "text", children: [
                (tableCellNode.__headerState & TableCellHeaderStates2.COLUMN) === TableCellHeaderStates2.COLUMN ? "Remove" : "Add",
                " ",
                "column header"
              ] })
            }
          )
        ]
      }
    ),
    document.body
  );
}
function TableCellActionMenuContainer({
  anchorElem,
  cellMerge
}) {
  const [editor] = useLexicalComposerContext35();
  const menuButtonRef = useRef15(null);
  const menuRootRef = useRef15(null);
  const [isMenuOpen, setIsMenuOpen] = useState25(false);
  const [tableCellNode, setTableMenuCellNode] = useState25(null);
  const [colorPickerModal, showColorPickerModal] = useModal();
  const checkTableCellOverflow = useCallback17((tableCellParentNodeDOM) => {
    const scrollableContainer = tableCellParentNodeDOM.closest(".NotionLikeEditorTheme__tableScrollableWrapper");
    if (scrollableContainer) {
      const containerRect = scrollableContainer.getBoundingClientRect();
      const cellRect = tableCellParentNodeDOM.getBoundingClientRect();
      const actionButtonRight = cellRect.right - 5;
      const actionButtonLeft = actionButtonRight - 28;
      if (actionButtonRight > containerRect.right || actionButtonLeft < containerRect.left) {
        return true;
      }
    }
    return false;
  }, []);
  const $moveMenu = useCallback17(() => {
    const menu = menuButtonRef.current;
    const selection = $getSelection18();
    const nativeSelection = getDOMSelection3(editor._window);
    const activeElement = document.activeElement;
    function disable() {
      if (menu) {
        menu.classList.remove("table-cell-action-button-container--active");
        menu.classList.add("table-cell-action-button-container--inactive");
      }
      setTableMenuCellNode(null);
    }
    if (selection == null || menu == null) {
      return disable();
    }
    const rootElement = editor.getRootElement();
    let tableObserver = null;
    let tableCellParentNodeDOM = null;
    if ($isRangeSelection15(selection) && rootElement !== null && nativeSelection !== null && rootElement.contains(nativeSelection.anchorNode)) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      if (tableCellNodeFromSelection == null) {
        return disable();
      }
      tableCellParentNodeDOM = editor.getElementByKey(tableCellNodeFromSelection.getKey());
      if (tableCellParentNodeDOM == null || !tableCellNodeFromSelection.isAttached()) {
        return disable();
      }
      if (checkTableCellOverflow(tableCellParentNodeDOM)) {
        return disable();
      }
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNodeFromSelection);
      const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
      if (tableElement === null) {
        throw new Error("TableActionMenu: Expected to find tableElement in DOM");
      }
      tableObserver = getTableObserverFromTableElement(tableElement);
      setTableMenuCellNode(tableCellNodeFromSelection);
    } else if ($isTableSelection2(selection)) {
      const anchorNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      if (!$isTableCellNode2(anchorNode)) {
        throw new Error("TableSelection anchorNode must be a TableCellNode");
      }
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(anchorNode);
      const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
      if (tableElement === null) {
        throw new Error("TableActionMenu: Expected to find tableElement in DOM");
      }
      tableObserver = getTableObserverFromTableElement(tableElement);
      tableCellParentNodeDOM = editor.getElementByKey(anchorNode.getKey());
      if (tableCellParentNodeDOM === null) {
        return disable();
      }
      if (checkTableCellOverflow(tableCellParentNodeDOM)) {
        return disable();
      }
    } else if (!activeElement) {
      return disable();
    }
    if (tableObserver === null || tableCellParentNodeDOM === null) {
      return disable();
    }
    const enabled = !tableObserver || !tableObserver.isSelecting;
    menu.classList.toggle("table-cell-action-button-container--active", enabled);
    menu.classList.toggle("table-cell-action-button-container--inactive", !enabled);
    if (enabled) {
      const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const top = tableCellRect.top - anchorRect.top;
      const left = tableCellRect.right - anchorRect.left;
      menu.style.transform = `translate(${left}px, ${top}px)`;
    }
  }, [editor, anchorElem, checkTableCellOverflow]);
  useEffect37(() => {
    let timeoutId;
    const callback = () => {
      timeoutId = void 0;
      editor.getEditorState().read($moveMenu);
    };
    const delayedCallback = () => {
      if (timeoutId === void 0) {
        timeoutId = setTimeout(callback, 0);
      }
      return false;
    };
    return mergeRegister13(
      editor.registerUpdateListener(delayedCallback),
      editor.registerCommand(SELECTION_CHANGE_COMMAND5, delayedCallback, COMMAND_PRIORITY_CRITICAL2),
      editor.registerRootListener((rootElement, prevRootElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener("pointerup", delayedCallback);
        }
        if (rootElement) {
          rootElement.addEventListener("pointerup", delayedCallback);
          delayedCallback();
        }
      }),
      () => clearTimeout(timeoutId)
    );
  });
  const prevTableCellDOM = useRef15(tableCellNode);
  useEffect37(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }
    prevTableCellDOM.current = tableCellNode;
  }, [tableCellNode]);
  return /* @__PURE__ */ jsx48("div", { className: "table-cell-action-button-container", ref: menuButtonRef, children: tableCellNode != null && /* @__PURE__ */ jsxs24(Fragment15, { children: [
    /* @__PURE__ */ jsx48(
      "button",
      {
        type: "button",
        className: "table-cell-action-button chevron-down",
        onClick: (e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        },
        ref: menuRootRef,
        children: /* @__PURE__ */ jsx48("i", { className: "chevron-down" })
      }
    ),
    colorPickerModal,
    isMenuOpen && /* @__PURE__ */ jsx48(
      TableActionMenu,
      {
        contextRef: menuRootRef,
        setIsMenuOpen,
        onClose: () => setIsMenuOpen(false),
        tableCellNode,
        cellMerge,
        showColorPickerModal
      }
    )
  ] }) });
}
function TableActionMenuPlugin({
  anchorElem = document.body,
  cellMerge = false
}) {
  const isEditable = useLexicalEditable3();
  return createPortal9(
    isEditable ? /* @__PURE__ */ jsx48(TableCellActionMenuContainer, { anchorElem, cellMerge }) : null,
    anchorElem
  );
}

// src/plugins/TableCellResizer/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext36 } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable as useLexicalEditable4 } from "@lexical/react/useLexicalEditable";
import {
  $computeTableMapSkipCellCheck as $computeTableMapSkipCellCheck2,
  $getTableNodeFromLexicalNodeOrThrow as $getTableNodeFromLexicalNodeOrThrow2,
  $getTableRowIndexFromTableCellNode as $getTableRowIndexFromTableCellNode2,
  $isTableCellNode as $isTableCellNode3,
  $isTableRowNode as $isTableRowNode2,
  getDOMCellFromTarget,
  getTableElement as getTableElement2,
  TableNode as TableNode3
} from "@lexical/table";
import { calculateZoomLevel as calculateZoomLevel4, mergeRegister as mergeRegister14 } from "@lexical/utils";
import { $getNearestNodeFromDOMNode as $getNearestNodeFromDOMNode5, isHTMLElement as isHTMLElement6, SKIP_SCROLL_INTO_VIEW_TAG } from "lexical";
import {
  useCallback as useCallback18,
  useEffect as useEffect38,
  useMemo as useMemo16,
  useRef as useRef16,
  useState as useState26
} from "react";
import { createPortal as createPortal10 } from "react-dom";
import { Fragment as Fragment16, jsx as jsx49, jsxs as jsxs25 } from "react/jsx-runtime";
var MIN_ROW_HEIGHT = 33;
var MIN_COLUMN_WIDTH = 92;
function TableCellResizer({ editor }) {
  const targetRef = useRef16(null);
  const resizerRef = useRef16(null);
  const tableRectRef = useRef16(null);
  const [hasTable, setHasTable] = useState26(false);
  const pointerStartPosRef = useRef16(null);
  const [pointerCurrentPos, updatePointerCurrentPos] = useState26(null);
  const [activeCell, updateActiveCell] = useState26(null);
  const [draggingDirection, updateDraggingDirection] = useState26(null);
  const resetState = useCallback18(() => {
    updateActiveCell(null);
    targetRef.current = null;
    updateDraggingDirection(null);
    pointerStartPosRef.current = null;
    tableRectRef.current = null;
  }, []);
  useEffect38(() => {
    const tableKeys = /* @__PURE__ */ new Set();
    return mergeRegister14(
      editor.registerMutationListener(TableNode3, (nodeMutations) => {
        for (const [nodeKey, mutation] of nodeMutations) {
          if (mutation === "destroyed") {
            tableKeys.delete(nodeKey);
          } else {
            tableKeys.add(nodeKey);
          }
        }
        setHasTable(tableKeys.size > 0);
      }),
      editor.registerNodeTransform(TableNode3, (tableNode) => {
        if (tableNode.getColWidths()) {
          return tableNode;
        }
        const numColumns = tableNode.getColumnCount();
        const columnWidth = MIN_COLUMN_WIDTH;
        tableNode.setColWidths(Array(numColumns).fill(columnWidth));
        return tableNode;
      })
    );
  }, [editor]);
  useEffect38(() => {
    if (!hasTable) {
      return;
    }
    const onPointerMove = (event) => {
      const target = event.target;
      if (!isHTMLElement6(target)) {
        return;
      }
      if (draggingDirection) {
        event.preventDefault();
        event.stopPropagation();
        updatePointerCurrentPos({
          x: event.clientX,
          y: event.clientY
        });
        return;
      }
      if (resizerRef.current?.contains(target)) {
        return;
      }
      if (targetRef.current !== target) {
        targetRef.current = target;
        const cell = getDOMCellFromTarget(target);
        if (cell && activeCell !== cell) {
          editor.getEditorState().read(
            () => {
              const tableCellNode = $getNearestNodeFromDOMNode5(cell.elem);
              if (!tableCellNode) {
                throw new Error("TableCellResizer: Table cell node not found.");
              }
              const tableNode = $getTableNodeFromLexicalNodeOrThrow2(tableCellNode);
              const tableElement = getTableElement2(tableNode, editor.getElementByKey(tableNode.getKey()));
              if (!tableElement) {
                throw new Error("TableCellResizer: Table element not found.");
              }
              targetRef.current = target;
              tableRectRef.current = tableElement.getBoundingClientRect();
              updateActiveCell(cell);
            },
            { editor }
          );
        } else if (cell == null) {
          resetState();
        }
      }
    };
    const onPointerDown = (event) => {
      const isTouchEvent = event.pointerType === "touch";
      if (isTouchEvent) {
        onPointerMove(event);
      }
    };
    const resizerContainer = resizerRef.current;
    resizerContainer?.addEventListener("pointermove", onPointerMove, {
      capture: true
    });
    const removeRootListener = editor.registerRootListener((rootElement, prevRootElement) => {
      prevRootElement?.removeEventListener("pointermove", onPointerMove);
      prevRootElement?.removeEventListener("pointerdown", onPointerDown);
      rootElement?.addEventListener("pointermove", onPointerMove);
      rootElement?.addEventListener("pointerdown", onPointerDown);
    });
    return () => {
      removeRootListener();
      resizerContainer?.removeEventListener("pointermove", onPointerMove);
    };
  }, [activeCell, draggingDirection, editor, resetState, hasTable]);
  const isHeightChanging = (direction) => {
    if (direction === "bottom") {
      return true;
    }
    return false;
  };
  const getCellNodeHeight = (cell, activeEditor) => {
    const domCellNode = activeEditor.getElementByKey(cell.getKey());
    return domCellNode?.clientHeight;
  };
  const updateRowHeight = useCallback18(
    (heightChange) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }
      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode5(activeCell.elem);
          if (!$isTableCellNode3(tableCellNode)) {
            throw new Error("TableCellResizer: Table cell node not found.");
          }
          const tableNode = $getTableNodeFromLexicalNodeOrThrow2(tableCellNode);
          const baseRowIndex = $getTableRowIndexFromTableCellNode2(tableCellNode);
          const tableRows = tableNode.getChildren();
          const isFullRowMerge = tableCellNode.getColSpan() === tableNode.getColumnCount();
          const tableRowIndex = isFullRowMerge ? baseRowIndex : baseRowIndex + tableCellNode.getRowSpan() - 1;
          if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
            throw new Error("Expected table cell to be inside of table row.");
          }
          const tableRow = tableRows[tableRowIndex];
          if (!$isTableRowNode2(tableRow)) {
            throw new Error("Expected table row");
          }
          let height = tableRow.getHeight();
          if (height === void 0) {
            const rowCells = tableRow.getChildren();
            height = Math.min(...rowCells.map((cell) => getCellNodeHeight(cell, editor) ?? Infinity));
          }
          const newHeight = Math.max(height + heightChange, MIN_ROW_HEIGHT);
          tableRow.setHeight(newHeight);
        },
        { tag: SKIP_SCROLL_INTO_VIEW_TAG }
      );
    },
    [activeCell, editor, getCellNodeHeight]
  );
  const getCellColumnIndex = (tableCellNode, tableMap) => {
    for (let row = 0; row < tableMap.length; row++) {
      for (let column = 0; column < tableMap[row].length; column++) {
        if (tableMap[row][column].cell === tableCellNode) {
          return column;
        }
      }
    }
  };
  const updateColumnWidth = useCallback18(
    (widthChange) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }
      editor.update(
        () => {
          const tableCellNode = $getNearestNodeFromDOMNode5(activeCell.elem);
          if (!$isTableCellNode3(tableCellNode)) {
            throw new Error("TableCellResizer: Table cell node not found.");
          }
          const tableNode = $getTableNodeFromLexicalNodeOrThrow2(tableCellNode);
          const [tableMap] = $computeTableMapSkipCellCheck2(tableNode, null, null);
          const columnIndex = getCellColumnIndex(tableCellNode, tableMap);
          if (columnIndex === void 0) {
            throw new Error("TableCellResizer: Table column not found.");
          }
          const colWidths = tableNode.getColWidths();
          if (!colWidths) {
            return;
          }
          const width = colWidths[columnIndex];
          if (width === void 0) {
            return;
          }
          const newColWidths = [...colWidths];
          const newWidth = Math.max(width + widthChange, MIN_COLUMN_WIDTH);
          newColWidths[columnIndex] = newWidth;
          tableNode.setColWidths(newColWidths);
        },
        { tag: SKIP_SCROLL_INTO_VIEW_TAG }
      );
    },
    [activeCell, editor, getCellColumnIndex]
  );
  const pointerUpHandler = useCallback18(
    (direction) => {
      const handler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!activeCell) {
          throw new Error("TableCellResizer: Expected active cell.");
        }
        if (pointerStartPosRef.current) {
          const { x, y: y2 } = pointerStartPosRef.current;
          if (activeCell === null) {
            return;
          }
          const zoom = calculateZoomLevel4(event.target);
          if (isHeightChanging(direction)) {
            const heightChange = (event.clientY - y2) / zoom;
            updateRowHeight(heightChange);
          } else {
            const widthChange = (event.clientX - x) / zoom;
            updateColumnWidth(widthChange);
          }
          resetState();
          document.removeEventListener("pointerup", handler);
        }
      };
      return handler;
    },
    [activeCell, resetState, updateColumnWidth, updateRowHeight, isHeightChanging]
  );
  const toggleResize = useCallback18(
    (direction) => (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }
      pointerStartPosRef.current = {
        x: event.clientX,
        y: event.clientY
      };
      updatePointerCurrentPos(pointerStartPosRef.current);
      updateDraggingDirection(direction);
      document.addEventListener("pointerup", pointerUpHandler(direction));
    },
    [activeCell, pointerUpHandler]
  );
  const getResizers = useCallback18(() => {
    if (activeCell) {
      const { height, width, top, left } = activeCell.elem.getBoundingClientRect();
      const zoom = calculateZoomLevel4(activeCell.elem);
      const zoneWidth = 16;
      const styles = {
        bottom: {
          backgroundColor: "none",
          cursor: "row-resize",
          height: `${zoneWidth}px`,
          left: `${window.scrollX + left}px`,
          top: `${window.scrollY + top + height - zoneWidth / 2}px`,
          width: `${width}px`
        },
        right: {
          backgroundColor: "none",
          cursor: "col-resize",
          height: `${height}px`,
          left: `${window.scrollX + left + width - zoneWidth / 2}px`,
          top: `${window.scrollY + top}px`,
          width: `${zoneWidth}px`
        }
      };
      const tableRect = tableRectRef.current;
      if (draggingDirection && pointerCurrentPos && tableRect) {
        if (isHeightChanging(draggingDirection)) {
          styles[draggingDirection].left = `${window.scrollX + tableRect.left}px`;
          styles[draggingDirection].top = `${window.scrollY + pointerCurrentPos.y / zoom}px`;
          styles[draggingDirection].height = "3px";
          styles[draggingDirection].width = `${tableRect.width}px`;
        } else {
          styles[draggingDirection].top = `${window.scrollY + tableRect.top}px`;
          styles[draggingDirection].left = `${window.scrollX + pointerCurrentPos.x / zoom}px`;
          styles[draggingDirection].width = "3px";
          styles[draggingDirection].height = `${tableRect.height}px`;
        }
        styles[draggingDirection].backgroundColor = "#adf";
        styles[draggingDirection].mixBlendMode = "unset";
      }
      return styles;
    }
    return {
      bottom: null,
      left: null,
      right: null,
      top: null
    };
  }, [activeCell, draggingDirection, pointerCurrentPos, isHeightChanging]);
  const resizerStyles = getResizers();
  return /* @__PURE__ */ jsx49("div", { ref: resizerRef, className: "notion-like-editor table-cell-resizer-container", children: activeCell != null && /* @__PURE__ */ jsxs25(Fragment16, { children: [
    /* @__PURE__ */ jsx49(
      "div",
      {
        className: "TableCellResizer__resizer TableCellResizer__ui",
        style: resizerStyles.right || void 0,
        onPointerDown: toggleResize("right")
      }
    ),
    /* @__PURE__ */ jsx49(
      "div",
      {
        className: "TableCellResizer__resizer TableCellResizer__ui",
        style: resizerStyles.bottom || void 0,
        onPointerDown: toggleResize("bottom")
      }
    )
  ] }) });
}
function TableCellResizerPlugin() {
  const [editor] = useLexicalComposerContext36();
  const isEditable = useLexicalEditable4();
  return useMemo16(
    () => isEditable ? createPortal10(/* @__PURE__ */ jsx49(TableCellResizer, { editor }), document.body) : null,
    [editor, isEditable]
  );
}

// src/plugins/TableHoverActionsPlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext37 } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable as useLexicalEditable5 } from "@lexical/react/useLexicalEditable";
import {
  $getTableAndElementByKey,
  $getTableColumnIndexFromTableCellNode as $getTableColumnIndexFromTableCellNode2,
  $getTableRowIndexFromTableCellNode as $getTableRowIndexFromTableCellNode3,
  $insertTableColumnAtSelection as $insertTableColumnAtSelection2,
  $insertTableRowAtSelection as $insertTableRowAtSelection2,
  $isTableCellNode as $isTableCellNode4,
  $isTableNode as $isTableNode2,
  getTableElement as getTableElement3,
  TableNode as TableNode4
} from "@lexical/table";
import { $findMatchingParent as $findMatchingParent5, mergeRegister as mergeRegister15 } from "@lexical/utils";
import { $getNearestNodeFromDOMNode as $getNearestNodeFromDOMNode6, isHTMLElement as isHTMLElement7 } from "lexical";
import { useEffect as useEffect39, useMemo as useMemo17, useRef as useRef17, useState as useState27 } from "react";
import { createPortal as createPortal11 } from "react-dom";

// src/utils/getThemeSelector.ts
function getThemeSelector(getTheme, name) {
  const className = getTheme()?.[name];
  if (typeof className !== "string") {
    throw new Error(`getThemeClass: required theme property ${name} not defined`);
  }
  return className.split(/\s+/g).map((cls) => `.${cls}`).join();
}

// src/plugins/TableHoverActionsPlugin/index.tsx
import { Fragment as Fragment17, jsx as jsx50, jsxs as jsxs26 } from "react/jsx-runtime";
var BUTTON_WIDTH_PX = 20;
function TableHoverActionsContainer({ anchorElem }) {
  const [editor, { getTheme }] = useLexicalComposerContext37();
  const isEditable = useLexicalEditable5();
  const [isShownRow, setShownRow] = useState27(false);
  const [isShownColumn, setShownColumn] = useState27(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState27(false);
  const [position, setPosition] = useState27({});
  const tableSetRef = useRef17(/* @__PURE__ */ new Set());
  const tableCellDOMNodeRef = useRef17(null);
  const debouncedOnMouseMove = useDebounce(
    (event) => {
      const { isOutside, tableDOMNode } = getMouseInfo2(event, getTheme);
      if (isOutside) {
        setShownRow(false);
        setShownColumn(false);
        return;
      }
      if (!tableDOMNode) {
        return;
      }
      tableCellDOMNodeRef.current = tableDOMNode;
      let hoveredRowNode = null;
      let hoveredColumnNode = null;
      let tableDOMElement = null;
      editor.getEditorState().read(
        () => {
          const maybeTableCell = $getNearestNodeFromDOMNode6(tableDOMNode);
          if ($isTableCellNode4(maybeTableCell)) {
            const table = $findMatchingParent5(maybeTableCell, (node) => $isTableNode2(node));
            if (!$isTableNode2(table)) {
              return;
            }
            tableDOMElement = getTableElement3(table, editor.getElementByKey(table.getKey()));
            if (tableDOMElement) {
              const rowCount = table.getChildrenSize();
              const colCount = table.getChildAtIndex(0)?.getChildrenSize();
              const rowIndex = $getTableRowIndexFromTableCellNode3(maybeTableCell);
              const colIndex = $getTableColumnIndexFromTableCellNode2(maybeTableCell);
              if (rowIndex === rowCount - 1) {
                hoveredRowNode = maybeTableCell;
              } else if (colIndex === colCount - 1) {
                hoveredColumnNode = maybeTableCell;
              }
            }
          }
        },
        { editor }
      );
      if (tableDOMElement) {
        const {
          width: tableElemWidth,
          y: tableElemY,
          right: tableElemRight,
          left: tableElemLeft,
          bottom: tableElemBottom,
          height: tableElemHeight
        } = tableDOMElement.getBoundingClientRect();
        const parentElement = tableDOMElement.parentElement;
        let tableHasScroll = false;
        if (parentElement?.classList.contains("NotionLikeEditorTheme__tableScrollableWrapper")) {
          tableHasScroll = parentElement.scrollWidth > parentElement.clientWidth;
        }
        const { y: editorElemY, left: editorElemLeft } = anchorElem.getBoundingClientRect();
        if (hoveredRowNode) {
          const isMac = /^mac/i.test(navigator.platform);
          setShownColumn(false);
          setShownRow(true);
          setPosition({
            height: BUTTON_WIDTH_PX,
            left: tableHasScroll && parentElement ? parentElement.offsetLeft : tableElemLeft - editorElemLeft,
            top: tableElemBottom - editorElemY + (tableHasScroll && !isMac ? 16 : 5),
            width: tableHasScroll && parentElement ? parentElement.offsetWidth : tableElemWidth
          });
        } else if (hoveredColumnNode) {
          setShownColumn(true);
          setShownRow(false);
          setPosition({
            height: tableElemHeight,
            left: tableElemRight - editorElemLeft + 5,
            top: tableElemY - editorElemY,
            width: BUTTON_WIDTH_PX
          });
        }
      }
    },
    50,
    250
  );
  const tableResizeObserver = useMemo17(() => {
    return new ResizeObserver(() => {
      setShownRow(false);
      setShownColumn(false);
    });
  }, []);
  useEffect39(() => {
    if (!shouldListenMouseMove) {
      return;
    }
    document.addEventListener("mousemove", debouncedOnMouseMove);
    return () => {
      setShownRow(false);
      setShownColumn(false);
      debouncedOnMouseMove.cancel();
      document.removeEventListener("mousemove", debouncedOnMouseMove);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove]);
  useEffect39(() => {
    return mergeRegister15(
      editor.registerMutationListener(
        TableNode4,
        (mutations) => {
          editor.getEditorState().read(
            () => {
              let resetObserver = false;
              for (const [key, type] of mutations) {
                switch (type) {
                  case "created": {
                    tableSetRef.current.add(key);
                    resetObserver = true;
                    break;
                  }
                  case "destroyed": {
                    tableSetRef.current.delete(key);
                    resetObserver = true;
                    break;
                  }
                  default:
                    break;
                }
              }
              if (resetObserver) {
                tableResizeObserver.disconnect();
                for (const tableKey of tableSetRef.current) {
                  const { tableElement } = $getTableAndElementByKey(tableKey);
                  tableResizeObserver.observe(tableElement);
                }
                setShouldListenMouseMove(tableSetRef.current.size > 0);
              }
            },
            { editor }
          );
        },
        { skipInitialization: false }
      )
    );
  }, [editor, tableResizeObserver]);
  const insertAction = (insertRow) => {
    editor.update(() => {
      if (tableCellDOMNodeRef.current) {
        const maybeTableNode = $getNearestNodeFromDOMNode6(tableCellDOMNodeRef.current);
        maybeTableNode?.selectEnd();
        if (insertRow) {
          $insertTableRowAtSelection2();
          setShownRow(false);
        } else {
          $insertTableColumnAtSelection2();
          setShownColumn(false);
        }
      }
    });
  };
  if (!isEditable) {
    return null;
  }
  return /* @__PURE__ */ jsxs26(Fragment17, { children: [
    isShownRow && /* @__PURE__ */ jsx50(
      "button",
      {
        type: "button",
        className: `notion-like-editor ${getTheme()?.tableAddRows}`,
        style: { ...position },
        onClick: () => insertAction(true)
      }
    ),
    isShownColumn && /* @__PURE__ */ jsx50(
      "button",
      {
        type: "button",
        className: `notion-like-editor ${getTheme()?.tableAddColumns}`,
        style: { ...position },
        onClick: () => insertAction(false)
      }
    )
  ] });
}
function getMouseInfo2(event, getTheme) {
  const target = event.target;
  const tableCellClass = getThemeSelector(getTheme, "tableCell");
  if (isHTMLElement7(target)) {
    const tableDOMNode = target.closest(`td${tableCellClass}, th${tableCellClass}`);
    const isOutside = !(tableDOMNode || target.closest(`button${getThemeSelector(getTheme, "tableAddRows")}`) || target.closest(`button${getThemeSelector(getTheme, "tableAddColumns")}`) || target.closest("div.TableCellResizer__resizer"));
    return { isOutside, tableDOMNode };
  } else {
    return { isOutside: true, tableDOMNode: null };
  }
}
function TableHoverActionsPlugin({
  anchorElem = document.body
}) {
  const isEditable = useLexicalEditable5();
  return isEditable ? createPortal11(/* @__PURE__ */ jsx50(TableHoverActionsContainer, { anchorElem }), anchorElem) : null;
}

// src/plugins/TableOfContentsPlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext38 } from "@lexical/react/LexicalComposerContext";
import { TableOfContentsPlugin as LexicalTableOfContentsPlugin } from "@lexical/react/LexicalTableOfContentsPlugin";
import { useEffect as useEffect40, useRef as useRef18, useState as useState28 } from "react";
import { jsx as jsx51, jsxs as jsxs27 } from "react/jsx-runtime";
var MARGIN_ABOVE_EDITOR = 624;
var HEADING_WIDTH = 9;
function indent(tagName) {
  if (tagName === "h2") {
    return "heading2";
  } else if (tagName === "h3") {
    return "heading3";
  }
}
function isHeadingAtTheTopOfThePage(element) {
  const elementYPosition = element?.getClientRects()[0].y;
  return elementYPosition >= MARGIN_ABOVE_EDITOR && elementYPosition <= MARGIN_ABOVE_EDITOR + HEADING_WIDTH;
}
function isHeadingAboveViewport(element) {
  const elementYPosition = element?.getClientRects()[0].y;
  return elementYPosition < MARGIN_ABOVE_EDITOR;
}
function isHeadingBelowTheTopOfThePage(element) {
  const elementYPosition = element?.getClientRects()[0].y;
  return elementYPosition >= MARGIN_ABOVE_EDITOR + HEADING_WIDTH;
}
function TableOfContentsList({ tableOfContents }) {
  const [selectedKey, setSelectedKey] = useState28("");
  const selectedIndex = useRef18(0);
  const [editor] = useLexicalComposerContext38();
  function scrollToNode(key, currIndex) {
    editor.getEditorState().read(() => {
      const domElement = editor.getElementByKey(key);
      if (domElement !== null) {
        domElement.scrollIntoView({ behavior: "smooth", block: "center" });
        setSelectedKey(key);
        selectedIndex.current = currIndex;
      }
    });
  }
  useEffect40(() => {
    function scrollCallback() {
      if (tableOfContents.length !== 0 && selectedIndex.current < tableOfContents.length - 1) {
        let currentHeading = editor.getElementByKey(tableOfContents[selectedIndex.current][0]);
        if (currentHeading !== null) {
          if (isHeadingBelowTheTopOfThePage(currentHeading)) {
            while (currentHeading !== null && isHeadingBelowTheTopOfThePage(currentHeading) && selectedIndex.current > 0) {
              const prevHeading = editor.getElementByKey(tableOfContents[selectedIndex.current - 1][0]);
              if (prevHeading !== null && (isHeadingAboveViewport(prevHeading) || isHeadingBelowTheTopOfThePage(prevHeading))) {
                selectedIndex.current--;
              }
              currentHeading = prevHeading;
            }
            const prevHeadingKey = tableOfContents[selectedIndex.current][0];
            setSelectedKey(prevHeadingKey);
          } else if (isHeadingAboveViewport(currentHeading)) {
            while (currentHeading !== null && isHeadingAboveViewport(currentHeading) && selectedIndex.current < tableOfContents.length - 1) {
              const nextHeading = editor.getElementByKey(tableOfContents[selectedIndex.current + 1][0]);
              if (nextHeading !== null && (isHeadingAtTheTopOfThePage(nextHeading) || isHeadingAboveViewport(nextHeading))) {
                selectedIndex.current++;
              }
              currentHeading = nextHeading;
            }
            const nextHeadingKey = tableOfContents[selectedIndex.current][0];
            setSelectedKey(nextHeadingKey);
          }
        }
      } else {
        selectedIndex.current = 0;
      }
    }
    let timerId;
    function debounceFunction(func, delay) {
      clearTimeout(timerId);
      timerId = setTimeout(func, delay);
    }
    function onScroll() {
      debounceFunction(scrollCallback, 10);
    }
    document.addEventListener("scroll", onScroll);
    return () => document.removeEventListener("scroll", onScroll);
  }, [tableOfContents, editor]);
  return /* @__PURE__ */ jsx51("div", { className: "table-of-contents", children: /* @__PURE__ */ jsx51("ul", { className: "headings", children: tableOfContents.map(([key, text, tag], index) => {
    if (index === 0) {
      return /* @__PURE__ */ jsxs27("div", { className: "normal-heading-wrapper", children: [
        /* @__PURE__ */ jsx51("div", { className: "first-heading", onClick: () => scrollToNode(key, index), role: "button", tabIndex: 0, children: `${text}`.length > 20 ? `${text.substring(0, 20)}...` : text }),
        /* @__PURE__ */ jsx51("br", {})
      ] }, key);
    } else {
      return /* @__PURE__ */ jsx51(
        "div",
        {
          className: `normal-heading-wrapper ${selectedKey === key ? "selected-heading-wrapper" : ""}`,
          children: /* @__PURE__ */ jsx51("div", { onClick: () => scrollToNode(key, index), role: "button", className: indent(tag), tabIndex: 0, children: /* @__PURE__ */ jsx51(
            "li",
            {
              className: `normal-heading ${selectedKey === key ? "selected-heading" : ""}
                    `,
              children: `${text}`.length > 27 ? `${text.substring(0, 27)}...` : text
            }
          ) })
        },
        key
      );
    }
  }) }) });
}
function TableOfContentsPlugin() {
  return /* @__PURE__ */ jsx51(LexicalTableOfContentsPlugin, { children: (tableOfContents) => {
    return /* @__PURE__ */ jsx51(TableOfContentsList, { tableOfContents });
  } });
}

// src/plugins/ToolbarPlugin/index.tsx
import {
  $isCodeNode as $isCodeNode4,
  getCodeLanguageOptions as getCodeLanguageOptionsPrism,
  normalizeCodeLanguage as normalizeCodeLanguagePrism
} from "@lexical/code";
import {
  getCodeLanguageOptions as getCodeLanguageOptionsShiki,
  getCodeThemeOptions as getCodeThemeOptionsShiki,
  normalizeCodeLanguage as normalizeCodeLanguageShiki
} from "@lexical/code-shiki";
import { $isLinkNode as $isLinkNode5, TOGGLE_LINK_COMMAND as TOGGLE_LINK_COMMAND6 } from "@lexical/link";
import { $isListNode, ListNode } from "@lexical/list";
import { INSERT_EMBED_COMMAND as INSERT_EMBED_COMMAND2 } from "@lexical/react/LexicalAutoEmbedPlugin";
import { INSERT_HORIZONTAL_RULE_COMMAND as INSERT_HORIZONTAL_RULE_COMMAND3 } from "@lexical/react/LexicalHorizontalRuleNode";
import { $isHeadingNode as $isHeadingNode2 } from "@lexical/rich-text";
import { $getSelectionStyleValueForProperty as $getSelectionStyleValueForProperty2, $isParentElementRTL, $patchStyleText as $patchStyleText3 } from "@lexical/selection";
import { $isTableNode as $isTableNode3, $isTableSelection as $isTableSelection3 } from "@lexical/table";
import {
  $findMatchingParent as $findMatchingParent6,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  IS_APPLE as IS_APPLE2,
  mergeRegister as mergeRegister16
} from "@lexical/utils";
import {
  $addUpdateTag as $addUpdateTag3,
  $getNodeByKey as $getNodeByKey8,
  $getRoot as $getRoot4,
  $getSelection as $getSelection19,
  $isElementNode as $isElementNode5,
  $isNodeSelection as $isNodeSelection6,
  $isRangeSelection as $isRangeSelection16,
  $isRootOrShadowRoot as $isRootOrShadowRoot4,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL as COMMAND_PRIORITY_CRITICAL3,
  FORMAT_ELEMENT_COMMAND as FORMAT_ELEMENT_COMMAND3,
  FORMAT_TEXT_COMMAND as FORMAT_TEXT_COMMAND3,
  HISTORIC_TAG,
  INDENT_CONTENT_COMMAND as INDENT_CONTENT_COMMAND2,
  OUTDENT_CONTENT_COMMAND as OUTDENT_CONTENT_COMMAND2,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND as SELECTION_CHANGE_COMMAND6,
  SKIP_DOM_SELECTION_TAG as SKIP_DOM_SELECTION_TAG3,
  SKIP_SELECTION_FOCUS_TAG as SKIP_SELECTION_FOCUS_TAG2,
  UNDO_COMMAND
} from "lexical";
import { useCallback as useCallback20, useEffect as useEffect44, useState as useState32 } from "react";

// src/context/FullscreenContext.tsx
import { createContext as createContext9, useCallback as useCallback19, useContext as useContext9, useEffect as useEffect41, useMemo as useMemo18, useState as useState29 } from "react";
import { jsx as jsx52 } from "react/jsx-runtime";
var FullscreenContext = createContext9(void 0);
function FullscreenProvider({ children }) {
  const [isFullscreen, setIsFullscreen] = useState29(false);
  const toggleFullscreen = useCallback19(() => {
    setIsFullscreen((prev) => !prev);
  }, []);
  const exitFullscreen = useCallback19(() => {
    setIsFullscreen(false);
  }, []);
  useEffect41(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);
  const value = useMemo18(
    () => ({
      isFullscreen,
      toggleFullscreen,
      exitFullscreen
    }),
    [isFullscreen, toggleFullscreen, exitFullscreen]
  );
  return /* @__PURE__ */ jsx52(FullscreenContext.Provider, { value, children });
}
function useFullscreen() {
  const context = useContext9(FullscreenContext);
  if (context === void 0) {
    throw new Error("useFullscreen must be used within a FullscreenProvider");
  }
  return context;
}

// src/plugins/ToolbarPlugin/index.tsx
init_StickyNode2();
init_url();

// src/plugins/ToolbarPlugin/fontSize.tsx
import * as React6 from "react";
import { Fragment as Fragment18, jsx as jsx55, jsxs as jsxs29 } from "react/jsx-runtime";
function parseFontSize(input) {
  const match = input.match(/^(\d+(?:\.\d+)?)(px|pt)$/);
  return match ? [Number(match[1]), match[2]] : null;
}
function normalizeToPx(fontSize, unit) {
  return unit === "pt" ? Math.round(fontSize * 4 / 3) : fontSize;
}
function isValidFontSize(fontSizePx) {
  return fontSizePx >= MIN_ALLOWED_FONT_SIZE && fontSizePx <= MAX_ALLOWED_FONT_SIZE;
}
function parseFontSizeForToolbar(input) {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return "";
  }
  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return `${fontSizePx}px`;
}
function parseAllowedFontSize(input) {
  const parsed = parseFontSize(input);
  if (!parsed) {
    return "";
  }
  const [fontSize, unit] = parsed;
  const fontSizePx = normalizeToPx(fontSize, unit);
  return isValidFontSize(fontSizePx) ? input : "";
}
function FontSize({
  selectionFontSize,
  disabled,
  editor
}) {
  const [inputValue, setInputValue] = React6.useState(selectionFontSize);
  const [inputChangeFlag, setInputChangeFlag] = React6.useState(false);
  const [isMouseMode, setIsMouseMode] = React6.useState(false);
  const handleKeyPress = (e) => {
    const inputValueNumber = Number(inputValue);
    if (e.key === "Tab") {
      return;
    }
    if (["e", "E", "+", "-"].includes(e.key) || Number.isNaN(inputValueNumber)) {
      e.preventDefault();
      setInputValue("");
      return;
    }
    setInputChangeFlag(true);
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      updateFontSizeByInputValue(inputValueNumber, !isMouseMode);
    }
  };
  const handleInputBlur = () => {
    setIsMouseMode(false);
    if (inputValue !== "" && inputChangeFlag) {
      const inputValueNumber = Number(inputValue);
      updateFontSizeByInputValue(inputValueNumber);
    }
  };
  const handleClick = (_e) => {
    setIsMouseMode(true);
  };
  const updateFontSizeByInputValue = (inputValueNumber, skipRefocus = false) => {
    let updatedFontSize = inputValueNumber;
    if (inputValueNumber > MAX_ALLOWED_FONT_SIZE) {
      updatedFontSize = MAX_ALLOWED_FONT_SIZE;
    } else if (inputValueNumber < MIN_ALLOWED_FONT_SIZE) {
      updatedFontSize = MIN_ALLOWED_FONT_SIZE;
    }
    setInputValue(String(updatedFontSize));
    updateFontSizeInSelection(editor, `${String(updatedFontSize)}px`, null, skipRefocus);
    setInputChangeFlag(false);
  };
  React6.useEffect(() => {
    setInputValue(selectionFontSize);
  }, [selectionFontSize]);
  return /* @__PURE__ */ jsxs29(Fragment18, { children: [
    /* @__PURE__ */ jsx55(
      "button",
      {
        type: "button",
        disabled: disabled || selectionFontSize !== "" && Number(inputValue) <= MIN_ALLOWED_FONT_SIZE,
        onClick: (e) => {
          updateFontSize(editor, 2 /* decrement */, inputValue, isKeyboardInput(e));
        },
        className: "toolbar-item font-decrement",
        "aria-label": "Decrease font size",
        title: `Decrease font size (${SHORTCUTS.DECREASE_FONT_SIZE})`,
        children: /* @__PURE__ */ jsx55("i", { className: "format minus-icon" })
      }
    ),
    /* @__PURE__ */ jsx55(
      "input",
      {
        type: "number",
        title: "Font size",
        value: inputValue,
        disabled,
        className: "toolbar-item font-size-input",
        min: MIN_ALLOWED_FONT_SIZE,
        max: MAX_ALLOWED_FONT_SIZE,
        onChange: (e) => setInputValue(e.target.value),
        onClick: handleClick,
        onKeyDown: handleKeyPress,
        onBlur: handleInputBlur
      }
    ),
    /* @__PURE__ */ jsx55(
      "button",
      {
        type: "button",
        disabled: disabled || selectionFontSize !== "" && Number(inputValue) >= MAX_ALLOWED_FONT_SIZE,
        onClick: (e) => {
          updateFontSize(editor, 1 /* increment */, inputValue, isKeyboardInput(e));
        },
        className: "toolbar-item font-increment",
        "aria-label": "Increase font size",
        title: `Increase font size (${SHORTCUTS.INCREASE_FONT_SIZE})`,
        children: /* @__PURE__ */ jsx55("i", { className: "format add-icon" })
      }
    )
  ] });
}

// src/plugins/ToolbarPlugin/index.tsx
import { Fragment as Fragment19, jsx as jsx56, jsxs as jsxs30 } from "react/jsx-runtime";
var CODE_LANGUAGE_OPTIONS_PRISM = getCodeLanguageOptionsPrism().filter(
  (option) => [
    "c",
    "clike",
    "cpp",
    "css",
    "html",
    "java",
    "js",
    "javascript",
    "markdown",
    "objc",
    "objective-c",
    "plain",
    "powershell",
    "py",
    "python",
    "rust",
    "sql",
    "swift",
    "typescript",
    "xml"
  ].includes(option[0])
);
var CODE_LANGUAGE_OPTIONS_SHIKI = getCodeLanguageOptionsShiki().filter(
  (option) => [
    "c",
    "clike",
    "cpp",
    "css",
    "html",
    "java",
    "js",
    "javascript",
    "markdown",
    "objc",
    "objective-c",
    "plain",
    "powershell",
    "py",
    "python",
    "rust",
    "sql",
    "typescript",
    "xml"
  ].includes(option[0])
);
var CODE_THEME_OPTIONS_SHIKI = getCodeThemeOptionsShiki().filter(
  (option) => [
    "catppuccin-latte",
    "everforest-light",
    "github-light",
    "gruvbox-light-medium",
    "kanagawa-lotus",
    "dark-plus",
    "light-plus",
    "material-theme-lighter",
    "min-light",
    "one-light",
    "rose-pine-dawn",
    "slack-ochin",
    "snazzy-light",
    "solarized-light",
    "vitesse-light"
  ].includes(option[0])
);
var FONT_FAMILY_OPTIONS = [
  ["Arial", "Arial"],
  ["Courier New", "Courier New"],
  ["Georgia", "Georgia"],
  ["Times New Roman", "Times New Roman"],
  ["Trebuchet MS", "Trebuchet MS"],
  ["Verdana", "Verdana"]
];
var FONT_SIZE_OPTIONS = [
  ["10px", "10px"],
  ["11px", "11px"],
  ["12px", "12px"],
  ["13px", "13px"],
  ["14px", "14px"],
  ["15px", "15px"],
  ["16px", "16px"],
  ["17px", "17px"],
  ["18px", "18px"],
  ["19px", "19px"],
  ["20px", "20px"]
];
var ELEMENT_FORMAT_OPTIONS = {
  center: {
    icon: "center-align",
    iconRTL: "center-align",
    name: "Center Align"
  },
  end: {
    icon: "right-align",
    iconRTL: "left-align",
    name: "End Align"
  },
  justify: {
    icon: "justify-align",
    iconRTL: "justify-align",
    name: "Justify Align"
  },
  left: {
    icon: "left-align",
    iconRTL: "left-align",
    name: "Left Align"
  },
  right: {
    icon: "right-align",
    iconRTL: "right-align",
    name: "Right Align"
  },
  start: {
    icon: "left-align",
    iconRTL: "right-align",
    name: "Start Align"
  }
};
function dropDownActiveClass(active) {
  if (active) {
    return "active dropdown-item-active";
  } else {
    return "";
  }
}
function BlockFormatDropDown({
  editor,
  blockType,
  disabled = false
}) {
  return /* @__PURE__ */ jsxs30(
    DropDown,
    {
      disabled,
      buttonClassName: "toolbar-item block-controls",
      buttonIconClassName: `icon block-type ${blockType}`,
      buttonLabel: blockTypeToBlockName[blockType],
      buttonAriaLabel: "Formatting options for text style",
      children: [
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "paragraph")}`,
            onClick: () => formatParagraph(editor),
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon paragraph" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Normal" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.NORMAL })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "h1")}`,
            onClick: () => formatHeading(editor, blockType, "h1"),
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon h1" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Heading 1" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.HEADING1 })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "h2")}`,
            onClick: () => formatHeading(editor, blockType, "h2"),
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon h2" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Heading 2" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.HEADING2 })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "h3")}`,
            onClick: () => formatHeading(editor, blockType, "h3"),
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon h3" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Heading 3" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.HEADING3 })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "number")}`,
            onClick: () => formatNumberedList(editor, blockType),
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon numbered-list" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Numbered List" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.NUMBERED_LIST })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "bullet")}`,
            onClick: () => formatBulletList(editor, blockType),
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon bullet-list" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Bullet List" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.BULLET_LIST })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "check")}`,
            onClick: () => formatCheckList(editor, blockType),
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon check-list" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Check List" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.CHECK_LIST })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "quote")}`,
            onClick: () => formatQuote(editor, blockType),
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon quote" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Quote" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.QUOTE })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "code")}`,
            onClick: () => formatCode(editor, blockType),
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon code" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Code Block" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.CODE_BLOCK })
            ]
          }
        )
      ]
    }
  );
}
function Divider() {
  return /* @__PURE__ */ jsx56("div", { className: "divider" });
}
function FontDropDown({
  editor,
  value,
  style,
  disabled = false
}) {
  const handleClick = useCallback20(
    (option) => {
      editor.update(() => {
        $addUpdateTag3(SKIP_SELECTION_FOCUS_TAG2);
        const selection = $getSelection19();
        if (selection !== null) {
          $patchStyleText3(selection, {
            [style]: option
          });
        }
      });
    },
    [editor, style]
  );
  const buttonAriaLabel = style === "font-family" ? "Formatting options for font family" : "Formatting options for font size";
  return /* @__PURE__ */ jsx56(
    DropDown,
    {
      disabled,
      buttonClassName: `toolbar-item ${style}`,
      buttonLabel: value,
      buttonIconClassName: style === "font-family" ? "icon block-type font-family" : "",
      buttonAriaLabel,
      children: (style === "font-family" ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(([option, text]) => /* @__PURE__ */ jsx56(
        DropDownItem,
        {
          className: `item ${dropDownActiveClass(value === option)} ${style === "font-size" ? "fontsize-item" : ""}`,
          onClick: () => handleClick(option),
          children: /* @__PURE__ */ jsx56("span", { className: "text", children: text })
        },
        option
      ))
    }
  );
}
function ElementFormatDropdown({
  editor,
  value,
  isRTL,
  disabled = false
}) {
  const formatOption = ELEMENT_FORMAT_OPTIONS[value || "left"];
  return /* @__PURE__ */ jsxs30(
    DropDown,
    {
      disabled,
      buttonLabel: formatOption.name,
      buttonIconClassName: `icon ${isRTL ? formatOption.iconRTL : formatOption.icon}`,
      buttonClassName: "toolbar-item spaced alignment",
      buttonAriaLabel: "Formatting options for text alignment",
      children: [
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND3, "left");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon left-align" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Left Align" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.LEFT_ALIGN })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND3, "center");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon center-align" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Center Align" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.CENTER_ALIGN })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND3, "right");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon right-align" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Right Align" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.RIGHT_ALIGN })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND3, "justify");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon justify-align" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Justify Align" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.JUSTIFY_ALIGN })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND3, "start");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ jsx56("i", { className: `icon ${isRTL ? ELEMENT_FORMAT_OPTIONS.start.iconRTL : ELEMENT_FORMAT_OPTIONS.start.icon}` }),
              /* @__PURE__ */ jsx56("span", { className: "text", children: "Start Align" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND3, "end");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ jsx56("i", { className: `icon ${isRTL ? ELEMENT_FORMAT_OPTIONS.end.iconRTL : ELEMENT_FORMAT_OPTIONS.end.icon}` }),
              /* @__PURE__ */ jsx56("span", { className: "text", children: "End Align" })
            ]
          }
        ),
        /* @__PURE__ */ jsx56(Divider, {}),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(OUTDENT_CONTENT_COMMAND2, void 0);
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: `icon ${isRTL ? "indent" : "outdent"}` }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Outdent" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.OUTDENT })
            ]
          }
        ),
        /* @__PURE__ */ jsxs30(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(INDENT_CONTENT_COMMAND2, void 0);
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ jsx56("i", { className: `icon ${isRTL ? "outdent" : "indent"}` }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Indent" })
              ] }),
              /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.INDENT })
            ]
          }
        )
      ]
    }
  );
}
function $findTopLevelElement(node) {
  let topLevelElement = node.getKey() === "root" ? node : $findMatchingParent6(node, (e) => {
    const parent = e.getParent();
    return parent !== null && $isRootOrShadowRoot4(parent);
  });
  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }
  return topLevelElement;
}
function findScrollableParent(element) {
  let parent = element.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      if (parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
    }
    parent = parent.parentElement;
  }
  return null;
}
function ToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode
}) {
  const [selectedElementKey, setSelectedElementKey] = useState32(null);
  const [modal, showModal] = useModal();
  const [isEditable, setIsEditable] = useState32(() => editor.isEditable());
  const { toolbarState, updateToolbarState } = useToolbarState();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const dispatchToolbarCommand = (command, payload = void 0, skipRefocus = false) => {
    activeEditor.update(() => {
      if (skipRefocus) {
        $addUpdateTag3(SKIP_DOM_SELECTION_TAG3);
      }
      activeEditor.dispatchCommand(command, payload);
    });
  };
  const dispatchFormatTextCommand = (payload, skipRefocus = false) => dispatchToolbarCommand(FORMAT_TEXT_COMMAND3, payload, skipRefocus);
  const $handleHeadingNode = useCallback20(
    (selectedElement) => {
      const type = $isHeadingNode2(selectedElement) ? selectedElement.getTag() : selectedElement.getType();
      if (type in blockTypeToBlockName) {
        updateToolbarState("blockType", type);
      }
    },
    [updateToolbarState]
  );
  const {
    settings: { isCodeHighlighted, isCodeShiki }
  } = useSettings();
  const $handleCodeNode = useCallback20(
    (element) => {
      if ($isCodeNode4(element)) {
        const language = element.getLanguage();
        updateToolbarState(
          "codeLanguage",
          language ? isCodeHighlighted && (isCodeShiki ? normalizeCodeLanguageShiki(language) : normalizeCodeLanguagePrism(language)) || language : ""
        );
        const theme4 = element.getTheme();
        updateToolbarState("codeTheme", theme4 || "");
        return;
      }
    },
    [updateToolbarState, isCodeHighlighted, isCodeShiki]
  );
  const $updateToolbar = useCallback20(() => {
    const selection = $getSelection19();
    if ($isRangeSelection16(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          "isImageCaption",
          !!rootElement?.parentElement?.classList.contains("image-caption-container")
        );
      } else {
        updateToolbarState("isImageCaption", false);
      }
      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);
      updateToolbarState("isRTL", $isParentElementRTL(selection));
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode5(parent) || $isLinkNode5(node);
      updateToolbarState("isLink", isLink);
      const tableNode = $findMatchingParent6(node, $isTableNode3);
      if ($isTableNode3(tableNode)) {
        updateToolbarState("rootType", "table");
      } else {
        updateToolbarState("rootType", "root");
      }
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          updateToolbarState("blockType", type);
        } else {
          $handleHeadingNode(element);
          $handleCodeNode(element);
        }
      }
      updateToolbarState("fontColor", $getSelectionStyleValueForProperty2(selection, "color", "#000"));
      updateToolbarState("bgColor", $getSelectionStyleValueForProperty2(selection, "background-color", "#fff"));
      updateToolbarState("fontFamily", $getSelectionStyleValueForProperty2(selection, "font-family", "Arial"));
      let matchingParent;
      if ($isLinkNode5(parent)) {
        matchingParent = $findMatchingParent6(
          node,
          (parentNode) => $isElementNode5(parentNode) && !parentNode.isInline()
        );
      }
      updateToolbarState(
        "elementFormat",
        $isElementNode5(matchingParent) ? matchingParent.getFormatType() : $isElementNode5(node) ? node.getFormatType() : parent?.getFormatType() || "left"
      );
    }
    if ($isRangeSelection16(selection) || $isTableSelection3(selection)) {
      updateToolbarState("isBold", selection.hasFormat("bold"));
      updateToolbarState("isItalic", selection.hasFormat("italic"));
      updateToolbarState("isUnderline", selection.hasFormat("underline"));
      updateToolbarState("isStrikethrough", selection.hasFormat("strikethrough"));
      updateToolbarState("isSubscript", selection.hasFormat("subscript"));
      updateToolbarState("isSuperscript", selection.hasFormat("superscript"));
      updateToolbarState("isHighlight", selection.hasFormat("highlight"));
      updateToolbarState("isCode", selection.hasFormat("code"));
      updateToolbarState("fontSize", $getSelectionStyleValueForProperty2(selection, "font-size", "15px"));
      updateToolbarState("isLowercase", selection.hasFormat("lowercase"));
      updateToolbarState("isUppercase", selection.hasFormat("uppercase"));
      updateToolbarState("isCapitalize", selection.hasFormat("capitalize"));
    }
    if ($isNodeSelection6(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = $getNearestNodeOfType(selectedNode, ListNode);
        if (parentList) {
          const type = parentList.getListType();
          updateToolbarState("blockType", type);
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);
          $handleCodeNode(selectedElement);
          if ($isElementNode5(selectedElement)) {
            updateToolbarState("elementFormat", selectedElement.getFormatType());
          }
        }
      }
    }
  }, [activeEditor, editor, updateToolbarState, $handleHeadingNode, $handleCodeNode]);
  useEffect44(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND6,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL3
    );
  }, [editor, $updateToolbar, setActiveEditor]);
  useEffect44(() => {
    activeEditor.getEditorState().read(
      () => {
        $updateToolbar();
      },
      { editor: activeEditor }
    );
  }, [activeEditor, $updateToolbar]);
  useEffect44(() => {
    return mergeRegister16(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          { editor: activeEditor }
        );
      }),
      activeEditor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState("canUndo", payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL3
      ),
      activeEditor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState("canRedo", payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL3
      )
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);
  const applyStyleText = useCallback20(
    (styles, skipHistoryStack, skipRefocus = false) => {
      activeEditor.update(
        () => {
          if (skipRefocus) {
            $addUpdateTag3(SKIP_DOM_SELECTION_TAG3);
          }
          const selection = $getSelection19();
          if (selection !== null) {
            $patchStyleText3(selection, styles);
          }
        },
        skipHistoryStack ? { tag: HISTORIC_TAG } : {}
      );
    },
    [activeEditor]
  );
  const onFontColorSelect = useCallback20(
    (value, skipHistoryStack, skipRefocus) => {
      applyStyleText({ color: value }, skipHistoryStack, skipRefocus);
    },
    [applyStyleText]
  );
  const onBgColorSelect = useCallback20(
    (value, skipHistoryStack, skipRefocus) => {
      applyStyleText({ "background-color": value }, skipHistoryStack, skipRefocus);
    },
    [applyStyleText]
  );
  const insertLink = useCallback20(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND6, sanitizeUrl("https://"));
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND6, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);
  const onCodeLanguageSelect = useCallback20(
    (value) => {
      activeEditor.update(() => {
        $addUpdateTag3(SKIP_SELECTION_FOCUS_TAG2);
        if (selectedElementKey !== null) {
          const node = $getNodeByKey8(selectedElementKey);
          if ($isCodeNode4(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey]
  );
  const onCodeThemeSelect = useCallback20(
    (value) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey8(selectedElementKey);
          if ($isCodeNode4(node)) {
            node.setTheme(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey]
  );
  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;
  return /* @__PURE__ */ jsxs30("div", { className: "toolbar", children: [
    /* @__PURE__ */ jsx56(
      "button",
      {
        disabled: !toolbarState.canUndo || !isEditable,
        onClick: (e) => dispatchToolbarCommand(UNDO_COMMAND, void 0, isKeyboardInput(e)),
        title: IS_APPLE2 ? "Undo (\u2318Z)" : "Undo (Ctrl+Z)",
        type: "button",
        className: "toolbar-item spaced",
        "aria-label": "Undo",
        children: /* @__PURE__ */ jsx56("i", { className: "format undo" })
      }
    ),
    /* @__PURE__ */ jsx56(
      "button",
      {
        disabled: !toolbarState.canRedo || !isEditable,
        onClick: (e) => dispatchToolbarCommand(REDO_COMMAND, void 0, isKeyboardInput(e)),
        title: IS_APPLE2 ? "Redo (\u21E7\u2318Z)" : "Redo (Ctrl+Y)",
        type: "button",
        className: "toolbar-item",
        "aria-label": "Redo",
        children: /* @__PURE__ */ jsx56("i", { className: "format redo" })
      }
    ),
    /* @__PURE__ */ jsx56(Divider, {}),
    toolbarState.blockType in blockTypeToBlockName && activeEditor === editor && /* @__PURE__ */ jsxs30(Fragment19, { children: [
      /* @__PURE__ */ jsx56(BlockFormatDropDown, { disabled: !isEditable, blockType: toolbarState.blockType, editor: activeEditor }),
      /* @__PURE__ */ jsx56(Divider, {})
    ] }),
    toolbarState.blockType === "code" && isCodeHighlighted ? /* @__PURE__ */ jsxs30(Fragment19, { children: [
      !isCodeShiki && /* @__PURE__ */ jsx56(
        DropDown,
        {
          disabled: !isEditable,
          buttonClassName: "toolbar-item code-language",
          buttonLabel: (CODE_LANGUAGE_OPTIONS_PRISM.find(
            (opt) => opt[0] === normalizeCodeLanguagePrism(toolbarState.codeLanguage)
          ) || ["", ""])[1],
          buttonAriaLabel: "Select language",
          children: CODE_LANGUAGE_OPTIONS_PRISM.map(([value, name]) => {
            return /* @__PURE__ */ jsx56(
              DropDownItem,
              {
                className: `item ${dropDownActiveClass(value === toolbarState.codeLanguage)}`,
                onClick: () => onCodeLanguageSelect(value),
                children: /* @__PURE__ */ jsx56("span", { className: "text", children: name })
              },
              value
            );
          })
        }
      ),
      isCodeShiki && /* @__PURE__ */ jsxs30(Fragment19, { children: [
        /* @__PURE__ */ jsx56(
          DropDown,
          {
            disabled: !isEditable,
            buttonClassName: "toolbar-item code-language",
            buttonLabel: (CODE_LANGUAGE_OPTIONS_SHIKI.find(
              (opt) => opt[0] === normalizeCodeLanguageShiki(toolbarState.codeLanguage)
            ) || ["", ""])[1],
            buttonAriaLabel: "Select language",
            children: CODE_LANGUAGE_OPTIONS_SHIKI.map(([value, name]) => {
              return /* @__PURE__ */ jsx56(
                DropDownItem,
                {
                  className: `item ${dropDownActiveClass(value === toolbarState.codeLanguage)}`,
                  onClick: () => onCodeLanguageSelect(value),
                  children: /* @__PURE__ */ jsx56("span", { className: "text", children: name })
                },
                value
              );
            })
          }
        ),
        /* @__PURE__ */ jsx56(
          DropDown,
          {
            disabled: !isEditable,
            buttonClassName: "toolbar-item code-language",
            buttonLabel: (CODE_THEME_OPTIONS_SHIKI.find((opt) => opt[0] === toolbarState.codeTheme) || ["", ""])[1],
            buttonAriaLabel: "Select theme",
            children: CODE_THEME_OPTIONS_SHIKI.map(([value, name]) => {
              return /* @__PURE__ */ jsx56(
                DropDownItem,
                {
                  className: `item ${dropDownActiveClass(value === toolbarState.codeTheme)}`,
                  onClick: () => onCodeThemeSelect(value),
                  children: /* @__PURE__ */ jsx56("span", { className: "text", children: name })
                },
                value
              );
            })
          }
        )
      ] })
    ] }) : /* @__PURE__ */ jsxs30(Fragment19, { children: [
      /* @__PURE__ */ jsx56(
        FontDropDown,
        {
          disabled: !isEditable,
          style: "font-family",
          value: toolbarState.fontFamily,
          editor: activeEditor
        }
      ),
      /* @__PURE__ */ jsx56(Divider, {}),
      /* @__PURE__ */ jsx56(
        FontSize,
        {
          selectionFontSize: parseFontSizeForToolbar(toolbarState.fontSize).slice(0, -2),
          editor: activeEditor,
          disabled: !isEditable
        }
      ),
      /* @__PURE__ */ jsx56(Divider, {}),
      /* @__PURE__ */ jsx56(
        "button",
        {
          disabled: !isEditable,
          onClick: (e) => dispatchFormatTextCommand("bold", isKeyboardInput(e)),
          className: `toolbar-item spaced ${toolbarState.isBold ? "active" : ""}`,
          title: `Bold (${SHORTCUTS.BOLD})`,
          type: "button",
          "aria-label": `Format text as bold. Shortcut: ${SHORTCUTS.BOLD}`,
          children: /* @__PURE__ */ jsx56("i", { className: "format bold" })
        }
      ),
      /* @__PURE__ */ jsx56(
        "button",
        {
          disabled: !isEditable,
          onClick: (e) => dispatchFormatTextCommand("italic", isKeyboardInput(e)),
          className: `toolbar-item spaced ${toolbarState.isItalic ? "active" : ""}`,
          title: `Italic (${SHORTCUTS.ITALIC})`,
          type: "button",
          "aria-label": `Format text as italics. Shortcut: ${SHORTCUTS.ITALIC}`,
          children: /* @__PURE__ */ jsx56("i", { className: "format italic" })
        }
      ),
      /* @__PURE__ */ jsx56(
        "button",
        {
          disabled: !isEditable,
          onClick: (e) => dispatchFormatTextCommand("underline", isKeyboardInput(e)),
          className: `toolbar-item spaced ${toolbarState.isUnderline ? "active" : ""}`,
          title: `Underline (${SHORTCUTS.UNDERLINE})`,
          type: "button",
          "aria-label": `Format text to underlined. Shortcut: ${SHORTCUTS.UNDERLINE}`,
          children: /* @__PURE__ */ jsx56("i", { className: "format underline" })
        }
      ),
      canViewerSeeInsertCodeButton && /* @__PURE__ */ jsx56(
        "button",
        {
          disabled: !isEditable,
          onClick: (e) => dispatchFormatTextCommand("code", isKeyboardInput(e)),
          className: `toolbar-item spaced ${toolbarState.isCode ? "active" : ""}`,
          title: `Insert code block (${SHORTCUTS.INSERT_CODE_BLOCK})`,
          type: "button",
          "aria-label": "Insert code block",
          children: /* @__PURE__ */ jsx56("i", { className: "format code" })
        }
      ),
      /* @__PURE__ */ jsx56(
        "button",
        {
          disabled: !isEditable,
          onClick: insertLink,
          className: `toolbar-item spaced ${toolbarState.isLink ? "active" : ""}`,
          "aria-label": "Insert link",
          title: `Insert link (${SHORTCUTS.INSERT_LINK})`,
          type: "button",
          children: /* @__PURE__ */ jsx56("i", { className: "format link" })
        }
      ),
      /* @__PURE__ */ jsx56(
        DropdownColorPicker,
        {
          disabled: !isEditable,
          buttonClassName: "toolbar-item color-picker",
          buttonAriaLabel: "Formatting text color",
          buttonIconClassName: "icon font-color",
          color: toolbarState.fontColor,
          onChange: onFontColorSelect,
          title: "text color"
        }
      ),
      /* @__PURE__ */ jsx56(
        DropdownColorPicker,
        {
          disabled: !isEditable,
          buttonClassName: "toolbar-item color-picker",
          buttonAriaLabel: "Formatting background color",
          buttonIconClassName: "icon bg-color",
          color: toolbarState.bgColor,
          onChange: onBgColorSelect,
          title: "bg color"
        }
      ),
      /* @__PURE__ */ jsxs30(
        DropDown,
        {
          disabled: !isEditable,
          buttonClassName: "toolbar-item spaced",
          buttonLabel: "",
          buttonAriaLabel: "Formatting options for additional text styles",
          buttonIconClassName: "icon dropdown-more",
          children: [
            /* @__PURE__ */ jsxs30(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("lowercase", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isLowercase)}`,
                title: "Lowercase",
                "aria-label": "Format text to lowercase",
                children: [
                  /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon lowercase" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Lowercase" })
                  ] }),
                  /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.LOWERCASE })
                ]
              }
            ),
            /* @__PURE__ */ jsxs30(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("uppercase", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isUppercase)}`,
                title: "Uppercase",
                "aria-label": "Format text to uppercase",
                children: [
                  /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon uppercase" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Uppercase" })
                  ] }),
                  /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.UPPERCASE })
                ]
              }
            ),
            /* @__PURE__ */ jsxs30(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("capitalize", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isCapitalize)}`,
                title: "Capitalize",
                "aria-label": "Format text to capitalize",
                children: [
                  /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon capitalize" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Capitalize" })
                  ] }),
                  /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.CAPITALIZE })
                ]
              }
            ),
            /* @__PURE__ */ jsxs30(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("strikethrough", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isStrikethrough)}`,
                title: "Strikethrough",
                "aria-label": "Format text with a strikethrough",
                children: [
                  /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon strikethrough" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Strikethrough" })
                  ] }),
                  /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.STRIKETHROUGH })
                ]
              }
            ),
            /* @__PURE__ */ jsxs30(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("subscript", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isSubscript)}`,
                title: "Subscript",
                "aria-label": "Format text with a subscript",
                children: [
                  /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon subscript" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Subscript" })
                  ] }),
                  /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.SUBSCRIPT })
                ]
              }
            ),
            /* @__PURE__ */ jsxs30(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("superscript", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isSuperscript)}`,
                title: "Superscript",
                "aria-label": "Format text with a superscript",
                children: [
                  /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon superscript" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Superscript" })
                  ] }),
                  /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.SUPERSCRIPT })
                ]
              }
            ),
            /* @__PURE__ */ jsx56(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("highlight", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isHighlight)}`,
                title: "Highlight",
                "aria-label": "Format text with a highlight",
                children: /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                  /* @__PURE__ */ jsx56("i", { className: "icon highlight" }),
                  /* @__PURE__ */ jsx56("span", { className: "text", children: "Highlight" })
                ] })
              }
            ),
            /* @__PURE__ */ jsxs30(
              DropDownItem,
              {
                onClick: (e) => clearFormatting(activeEditor, isKeyboardInput(e)),
                className: "item wide",
                title: "Clear text formatting",
                "aria-label": "Clear all text formatting",
                children: [
                  /* @__PURE__ */ jsxs30("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon clear" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Clear Formatting" })
                  ] }),
                  /* @__PURE__ */ jsx56("span", { className: "shortcut", children: SHORTCUTS.CLEAR_FORMATTING })
                ]
              }
            )
          ]
        }
      ),
      canViewerSeeInsertDropdown && /* @__PURE__ */ jsxs30(Fragment19, { children: [
        /* @__PURE__ */ jsx56(Divider, {}),
        /* @__PURE__ */ jsxs30(
          DropDown,
          {
            disabled: !isEditable,
            buttonClassName: "toolbar-item spaced",
            buttonLabel: "Insert",
            buttonAriaLabel: "Insert specialized editor node",
            buttonIconClassName: "icon plus",
            children: [
              /* @__PURE__ */ jsxs30(DropDownItem, { onClick: () => dispatchToolbarCommand(INSERT_HORIZONTAL_RULE_COMMAND3), className: "item", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon horizontal-rule" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Horizontal Rule" })
              ] }),
              /* @__PURE__ */ jsxs30(DropDownItem, { onClick: () => dispatchToolbarCommand(INSERT_PAGE_BREAK), className: "item", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon page-break" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Page Break" })
              ] }),
              /* @__PURE__ */ jsxs30(
                DropDownItem,
                {
                  onClick: () => {
                    showModal("Insert Image", (onClose) => /* @__PURE__ */ jsx56(InsertImageDialog, { activeEditor, onClose }));
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon image" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Image" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs30(
                DropDownItem,
                {
                  onClick: () => {
                    showModal("Insert Table", (onClose) => /* @__PURE__ */ jsx56(InsertTableDialog, { activeEditor, onClose }));
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon table" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Table" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs30(
                DropDownItem,
                {
                  onClick: () => {
                    showModal("Insert Columns Layout", (onClose) => /* @__PURE__ */ jsx56(InsertLayoutDialog, { activeEditor, onClose }));
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon columns" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Columns Layout" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs30(
                DropDownItem,
                {
                  onClick: () => {
                    showModal("Insert Equation", (onClose) => /* @__PURE__ */ jsx56(InsertEquationDialog, { activeEditor, onClose }));
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon equation" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Equation" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs30(
                DropDownItem,
                {
                  onClick: () => {
                    editor.update(() => {
                      $addUpdateTag3(SKIP_SELECTION_FOCUS_TAG2);
                      const root = $getRoot4();
                      let xOffset = 20;
                      let yOffset = 20;
                      const rootElement = editor.getRootElement();
                      if (rootElement) {
                        const scrollableParent = findScrollableParent(rootElement);
                        if (scrollableParent) {
                          const scrollerRect = scrollableParent.getBoundingClientRect();
                          const editorRect = rootElement.getBoundingClientRect();
                          const editorOffsetFromScroller = editorRect.top - scrollerRect.top;
                          const visibleTop = Math.max(0, -editorOffsetFromScroller);
                          yOffset = visibleTop + 20;
                          xOffset = scrollableParent.scrollLeft + 20;
                        }
                      }
                      const stickyNode = $createStickyNode(xOffset, yOffset);
                      root.append(stickyNode);
                    });
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon sticky" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Sticky Note" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs30(DropDownItem, { onClick: () => dispatchToolbarCommand(INSERT_COLLAPSIBLE_COMMAND), className: "item", children: [
                /* @__PURE__ */ jsx56("i", { className: "icon caret-right" }),
                /* @__PURE__ */ jsx56("span", { className: "text", children: "Collapsible container" })
              ] }),
              /* @__PURE__ */ jsxs30(
                DropDownItem,
                {
                  onClick: () => {
                    const dateTime = /* @__PURE__ */ new Date();
                    dateTime.setHours(0, 0, 0, 0);
                    dispatchToolbarCommand(INSERT_DATETIME_COMMAND, {
                      dateTime
                    });
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ jsx56("i", { className: "icon calendar" }),
                    /* @__PURE__ */ jsx56("span", { className: "text", children: "Date" })
                  ]
                }
              ),
              EmbedConfigs.map((embedConfig) => /* @__PURE__ */ jsxs30(
                DropDownItem,
                {
                  onClick: () => dispatchToolbarCommand(INSERT_EMBED_COMMAND2, embedConfig.type),
                  className: "item",
                  children: [
                    embedConfig.icon,
                    /* @__PURE__ */ jsx56("span", { className: "text", children: embedConfig.contentName })
                  ]
                },
                embedConfig.type
              ))
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx56(Divider, {}),
    /* @__PURE__ */ jsx56(
      ElementFormatDropdown,
      {
        disabled: !isEditable,
        value: toolbarState.elementFormat,
        editor: activeEditor,
        isRTL: toolbarState.isRTL
      }
    ),
    /* @__PURE__ */ jsx56(Divider, {}),
    /* @__PURE__ */ jsx56(
      "button",
      {
        type: "button",
        onClick: toggleFullscreen,
        className: "toolbar-item spaced",
        "aria-label": isFullscreen ? "\u5168\u753B\u9762\u30E2\u30FC\u30C9\u3092\u7D42\u4E86" : "\u5168\u753B\u9762\u30E2\u30FC\u30C9",
        title: isFullscreen ? "\u5168\u753B\u9762\u30E2\u30FC\u30C9\u3092\u7D42\u4E86 (Esc)" : "\u5168\u753B\u9762\u30E2\u30FC\u30C9",
        children: /* @__PURE__ */ jsx56("i", { className: `format ${isFullscreen ? "fullscreen-exit" : "fullscreen"}` })
      }
    ),
    modal
  ] });
}

// src/core/Editor.tsx
init_ContentEditable2();
import { Fragment as Fragment20, jsx as jsx57, jsxs as jsxs31 } from "react/jsx-runtime";
function Editor({ isFullscreen = false }) {
  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      isCodeHighlighted,
      isCodeShiki,
      isAutocomplete,
      isMaxLength,
      isCharLimit,
      autoFocus,
      hasLinkAttributes,
      hasNestedTables: hasTabHandler,
      isCharLimitUtf8,
      showTableOfContents,
      showToolbar,
      shouldUseLexicalContextMenu,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      shouldAllowHighlightingWithBrackets,
      selectionAlwaysOnDisplay,
      listStrictIndent
    }
  } = useSettings();
  const isEditable = useLexicalEditable6();
  const placeholder = "\u6587\u7AE0\u3092\u5165\u529B\u3059\u308B\u524D\u306B\u662F\u975E\u300C/\u300D\u3092\u5165\u529B\u3057\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002";
  const [floatingAnchorElem, setFloatingAnchorElem] = useState33(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState33(false);
  const [editor] = useLexicalComposerContext40();
  const [activeEditor, setActiveEditor] = useState33(editor);
  const [isLinkEditMode, setIsLinkEditMode] = useState33(false);
  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };
  useEffect45(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches;
      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);
    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);
  return /* @__PURE__ */ jsxs31(Fragment20, { children: [
    showToolbar && /* @__PURE__ */ jsx57(
      ToolbarPlugin,
      {
        editor,
        activeEditor,
        setActiveEditor,
        setIsLinkEditMode
      }
    ),
    showToolbar && /* @__PURE__ */ jsx57(ShortcutsPlugin, { editor: activeEditor, setIsLinkEditMode }),
    /* @__PURE__ */ jsxs31("div", { className: `editor-container ${isFullscreen ? "flex-1 overflow-auto" : ""}`, children: [
      isMaxLength && /* @__PURE__ */ jsx57(MaxLengthPlugin, { maxLength: 30 }),
      /* @__PURE__ */ jsx57(DragDropPaste, {}),
      autoFocus && /* @__PURE__ */ jsx57(AutoFocusPlugin, {}),
      selectionAlwaysOnDisplay && /* @__PURE__ */ jsx57(SelectionAlwaysOnDisplay, {}),
      /* @__PURE__ */ jsx57(ClearEditorPlugin, {}),
      /* @__PURE__ */ jsx57(ComponentPickerMenuPlugin, {}),
      /* @__PURE__ */ jsx57(EmojisPlugin2, {}),
      /* @__PURE__ */ jsx57(AutoEmbedPlugin, {}),
      /* @__PURE__ */ jsx57(NewMentionsPlugin, {}),
      /* @__PURE__ */ jsx57(EmojisPlugin, {}),
      /* @__PURE__ */ jsx57(HashtagPlugin2, {}),
      /* @__PURE__ */ jsx57(LexicalAutoLinkPlugin, {}),
      /* @__PURE__ */ jsx57(DateTimePlugin, {}),
      /* @__PURE__ */ jsx57(HistoryPlugin, { externalHistoryState: historyState }),
      /* @__PURE__ */ jsx57(
        RichTextPlugin2,
        {
          contentEditable: /* @__PURE__ */ jsx57("div", { className: "editor-scroller", children: /* @__PURE__ */ jsx57("div", { className: "editor", ref: onRef, children: /* @__PURE__ */ jsx57(LexicalContentEditable, { placeholder, placeholderClassName: "editor-placeholder" }) }) }),
          ErrorBoundary: LexicalErrorBoundary3
        }
      ),
      /* @__PURE__ */ jsx57(MarkdownPlugin, {}),
      /* @__PURE__ */ jsx57(MarkdownPastePlugin, {}),
      isCodeHighlighted && (isCodeShiki ? /* @__PURE__ */ jsx57(CodeHighlightShikiPlugin, {}) : /* @__PURE__ */ jsx57(CodeHighlightPrismPlugin, {})),
      /* @__PURE__ */ jsx57(ListPlugin, { hasStrictIndent: listStrictIndent }),
      /* @__PURE__ */ jsx57(CheckListPlugin, {}),
      /* @__PURE__ */ jsx57(
        TablePlugin,
        {
          hasCellMerge: tableCellMerge,
          hasCellBackgroundColor: tableCellBackgroundColor,
          hasHorizontalScroll: tableHorizontalScroll,
          hasTabHandler
        }
      ),
      /* @__PURE__ */ jsx57(TableCellResizerPlugin, {}),
      /* @__PURE__ */ jsx57(ImagesPlugin, {}),
      /* @__PURE__ */ jsx57(LinkPlugin, { hasLinkAttributes }),
      /* @__PURE__ */ jsx57(TwitterPlugin, {}),
      /* @__PURE__ */ jsx57(YouTubePlugin, {}),
      /* @__PURE__ */ jsx57(FigmaPlugin, {}),
      /* @__PURE__ */ jsx57(ClickableLinkPlugin, { disabled: isEditable }),
      /* @__PURE__ */ jsx57(HorizontalRulePlugin, {}),
      /* @__PURE__ */ jsx57(EquationsPlugin, {}),
      /* @__PURE__ */ jsx57(TabFocusPlugin, {}),
      /* @__PURE__ */ jsx57(TabIndentationPlugin, { maxIndent: 7 }),
      /* @__PURE__ */ jsx57(CollapsiblePlugin, {}),
      /* @__PURE__ */ jsx57(PageBreakPlugin, {}),
      /* @__PURE__ */ jsx57(LayoutPlugin, {}),
      floatingAnchorElem && /* @__PURE__ */ jsxs31(Fragment20, { children: [
        /* @__PURE__ */ jsx57(
          FloatingLinkEditorPlugin,
          {
            anchorElem: floatingAnchorElem,
            isLinkEditMode,
            setIsLinkEditMode
          }
        ),
        /* @__PURE__ */ jsx57(TableActionMenuPlugin, { anchorElem: floatingAnchorElem, cellMerge: true })
      ] }),
      floatingAnchorElem && !isSmallWidthViewport && /* @__PURE__ */ jsxs31(Fragment20, { children: [
        /* @__PURE__ */ jsx57(DraggableBlockPlugin, { anchorElem: floatingAnchorElem }),
        /* @__PURE__ */ jsx57(CodeActionMenuPlugin, { anchorElem: floatingAnchorElem }),
        /* @__PURE__ */ jsx57(TableHoverActionsPlugin, { anchorElem: floatingAnchorElem }),
        /* @__PURE__ */ jsx57(FloatingTextFormatToolbarPlugin, { anchorElem: floatingAnchorElem, setIsLinkEditMode })
      ] }),
      (isCharLimit || isCharLimitUtf8) && /* @__PURE__ */ jsx57(CharacterLimitPlugin, { charset: isCharLimit ? "UTF-16" : "UTF-8", maxLength: 5 }),
      isAutocomplete && /* @__PURE__ */ jsx57(AutocompletePlugin, {}),
      /* @__PURE__ */ jsx57("div", { children: showTableOfContents && /* @__PURE__ */ jsx57(TableOfContentsPlugin, {}) }),
      shouldUseLexicalContextMenu && /* @__PURE__ */ jsx57(ContextMenuPlugin, {}),
      shouldAllowHighlightingWithBrackets && /* @__PURE__ */ jsx57(SpecialTextPlugin, {})
    ] })
  ] });
}

// src/core/NotionLikeEditor.tsx
import { $generateHtmlFromNodes as $generateHtmlFromNodes2 } from "@lexical/html";
import { $convertFromMarkdownString as $convertFromMarkdownString4, $convertToMarkdownString as $convertToMarkdownString3, TRANSFORMERS } from "@lexical/markdown";
import { useLexicalComposerContext as useLexicalComposerContext43 } from "@lexical/react/LexicalComposerContext";
import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { $getRoot as $getRoot6, defineExtension } from "lexical";
import { useCallback as useCallback23, useEffect as useEffect51, useMemo as useMemo19 } from "react";
import { useDebouncedCallback as useDebouncedCallback2 } from "use-debounce";

// src/context/FlashMessageContext.tsx
import { createContext as createContext10, useCallback as useCallback21, useContext as useContext10, useEffect as useEffect46, useState as useState34 } from "react";

// src/ui/FlashMessage.tsx
import { createPortal as createPortal13 } from "react-dom";
import { jsx as jsx58 } from "react/jsx-runtime";
function FlashMessage({ children }) {
  return createPortal13(
    /* @__PURE__ */ jsx58("div", { className: "notion-like-editor FlashMessage__overlay", role: "dialog", children: /* @__PURE__ */ jsx58("p", { className: "notion-like-editor FlashMessage__alert", role: "alert", children }) }),
    document.body
  );
}

// src/context/FlashMessageContext.tsx
import { jsx as jsx59, jsxs as jsxs32 } from "react/jsx-runtime";
var Context4 = createContext10(void 0);
var INITIAL_STATE = {};
var DEFAULT_DURATION = 1e3;
var FlashMessageContext = ({ children }) => {
  const [props, setProps] = useState34(INITIAL_STATE);
  const showFlashMessage = useCallback21(
    (message, duration) => setProps(message ? { duration, message } : INITIAL_STATE),
    []
  );
  useEffect46(() => {
    if (props.message) {
      const timeoutId = setTimeout(() => setProps(INITIAL_STATE), props.duration ?? DEFAULT_DURATION);
      return () => clearTimeout(timeoutId);
    }
  }, [props]);
  return /* @__PURE__ */ jsxs32(Context4.Provider, { value: showFlashMessage, children: [
    children,
    props.message && /* @__PURE__ */ jsx59(FlashMessage, { children: props.message })
  ] });
};
var useFlashMessageContext = () => {
  const ctx = useContext10(Context4);
  if (!ctx) {
    throw new Error("Missing FlashMessageContext");
  }
  return ctx;
};

// src/core/NotionLikeEditor.tsx
init_SharedHistoryContext();

// src/nodes/NotionLikeEditorNodes.ts
import { CodeHighlightNode, CodeNode as CodeNode2 } from "@lexical/code";
import { HashtagNode as HashtagNode2 } from "@lexical/hashtag";
import { AutoLinkNode, LinkNode as LinkNode2 } from "@lexical/link";
import { ListItemNode, ListNode as ListNode2 } from "@lexical/list";
import { MarkNode } from "@lexical/mark";
import { OverflowNode } from "@lexical/overflow";
import { HorizontalRuleNode as HorizontalRuleNode2 } from "@lexical/react/LexicalHorizontalRuleNode";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode as TableCellNode4, TableNode as TableNode5, TableRowNode as TableRowNode3 } from "@lexical/table";
init_DateTimeNode2();
init_EmojiNode();
init_EquationNode();
init_ImageNode2();
init_KeywordNode();
init_MentionNode();
init_StickyNode2();
var NotionLikeEditorNodes = [
  HeadingNode,
  ListNode2,
  ListItemNode,
  QuoteNode,
  CodeNode2,
  TableNode5,
  TableCellNode4,
  TableRowNode3,
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
  HorizontalRuleNode2,
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

// src/plugins/InsertMarkdownPlugin/index.tsx
import { $convertFromMarkdownString as $convertFromMarkdownString3, $convertToMarkdownString as $convertToMarkdownString2 } from "@lexical/markdown";
import { useLexicalComposerContext as useLexicalComposerContext41 } from "@lexical/react/LexicalComposerContext";
import { $getRoot as $getRoot5, COMMAND_PRIORITY_EDITOR as COMMAND_PRIORITY_EDITOR11, createCommand as createCommand11 } from "lexical";
import { useEffect as useEffect47 } from "react";
var INSERT_MARKDOWN_COMMAND = createCommand11("INSERT_MARKDOWN_COMMAND");
function InsertMarkdownPlugin() {
  const [editor] = useLexicalComposerContext41();
  useEffect47(() => {
    return editor.registerCommand(
      INSERT_MARKDOWN_COMMAND,
      (markdown) => {
        if (!markdown || markdown.trim().length === 0) {
          return false;
        }
        editor.update(() => {
          const currentMarkdown = $convertToMarkdownString2(PLAYGROUND_TRANSFORMERS);
          const combinedMarkdown = currentMarkdown.trim() ? `${currentMarkdown.trim()}

${markdown}` : markdown;
          const root = $getRoot5();
          root.clear();
          $convertFromMarkdownString3(combinedMarkdown, PLAYGROUND_TRANSFORMERS);
          const newLastChild = root.getLastChild();
          newLastChild?.selectEnd();
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR11
    );
  }, [editor]);
  return null;
}

// src/plugins/OnChangePlugin/index.tsx
import { useLexicalComposerContext as useLexicalComposerContext42 } from "@lexical/react/LexicalComposerContext";
import { useEffect as useEffect48 } from "react";
function OnChangePlugin({
  onChange,
  ignoreHistoryMergeTagChange = true,
  ignoreSelectionChange = true
}) {
  const [editor] = useLexicalComposerContext42();
  useEffect48(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves, tags }) => {
      if (ignoreSelectionChange && dirtyElements.size === 0 && dirtyLeaves.size === 0 || ignoreHistoryMergeTagChange && tags.has("history-merge")) {
        return;
      }
      onChange(editorState, editor);
    });
  }, [editor, ignoreHistoryMergeTagChange, ignoreSelectionChange, onChange]);
  return null;
}

// src/plugins/TypingPerfPlugin/index.ts
import { useEffect as useEffect50 } from "react";

// src/hooks/useReport.ts
import { useCallback as useCallback22, useEffect as useEffect49, useRef as useRef20 } from "react";
var getElement = () => {
  let element = document.getElementById("report-container");
  if (element === null) {
    element = document.createElement("div");
    element.id = "report-container";
    element.style.position = "fixed";
    element.style.top = "50%";
    element.style.left = "50%";
    element.style.fontSize = "32px";
    element.style.transform = "translate(-50%, -50px)";
    element.style.padding = "20px";
    element.style.background = "rgba(240, 240, 240, 0.4)";
    element.style.borderRadius = "20px";
    element.style.zIndex = "2010";
    if (document.body) {
      document.body.appendChild(element);
    }
  }
  return element;
};
function useReport() {
  const timer = useRef20(null);
  const cleanup = useCallback22(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (document.body) {
      document.body.removeChild(getElement());
    }
  }, []);
  useEffect49(() => {
    return cleanup;
  }, [cleanup]);
  return useCallback22(
    (content) => {
      const element = getElement();
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
      element.innerHTML = content;
      timer.current = setTimeout(cleanup, 1e3);
      return timer.current;
    },
    [cleanup]
  );
}

// src/plugins/TypingPerfPlugin/index.ts
var validInputTypes = /* @__PURE__ */ new Set([
  "insertText",
  "insertCompositionText",
  "insertFromComposition",
  "insertLineBreak",
  "insertParagraph",
  "deleteCompositionText",
  "deleteContentBackward",
  "deleteByComposition",
  "deleteContent",
  "deleteContentForward",
  "deleteWordBackward",
  "deleteWordForward",
  "deleteHardLineBackward",
  "deleteSoftLineBackward",
  "deleteHardLineForward",
  "deleteSoftLineForward"
]);
function TypingPerfPlugin() {
  const report = useReport();
  useEffect50(() => {
    let start = 0;
    let timerId;
    let keyPressTimerId;
    let log = [];
    let invalidatingEvent = false;
    const measureEventEnd = function logKeyPress() {
      if (keyPressTimerId != null) {
        if (invalidatingEvent) {
          invalidatingEvent = false;
        } else {
          log.push(performance.now() - start);
        }
        clearTimeout(keyPressTimerId);
        keyPressTimerId = null;
      }
    };
    const measureEventStart = function measureEvent() {
      if (timerId != null) {
        clearTimeout(timerId);
        timerId = null;
      }
      keyPressTimerId = setTimeout(measureEventEnd, 0);
      timerId = setTimeout(() => {
        const total = log.reduce((a, b) => a + b, 0);
        const reportedText = `Typing Perf: ${Math.round(total / log.length * 100) / 100}ms`;
        report(reportedText);
        log = [];
      }, 2e3);
      start = performance.now();
    };
    const beforeInputHandler = function beforeInputHandler2(event) {
      if (!validInputTypes.has(event.inputType) || invalidatingEvent) {
        invalidatingEvent = false;
        return;
      }
      measureEventStart();
    };
    const keyDownHandler = function keyDownHandler2(event) {
      const key = event.key;
      if (key === "Backspace" || key === "Enter") {
        measureEventStart();
      }
    };
    const pasteHandler = function pasteHandler2() {
      invalidatingEvent = true;
    };
    const cutHandler = function cutHandler2() {
      invalidatingEvent = true;
    };
    window.addEventListener("keydown", keyDownHandler, true);
    window.addEventListener("selectionchange", measureEventEnd, true);
    window.addEventListener("beforeinput", beforeInputHandler, true);
    window.addEventListener("paste", pasteHandler, true);
    window.addEventListener("cut", cutHandler, true);
    return () => {
      window.removeEventListener("keydown", keyDownHandler, true);
      window.removeEventListener("selectionchange", measureEventEnd, true);
      window.removeEventListener("beforeinput", beforeInputHandler, true);
      window.removeEventListener("paste", pasteHandler, true);
      window.removeEventListener("cut", cutHandler, true);
    };
  }, [report]);
  return null;
}

// src/core/NotionLikeEditor.tsx
init_NotionLikeEditorTheme2();

// src/core/buildHTMLConfig.tsx
import {
  $isTextNode as $isTextNode6,
  isBlockDomNode,
  isHTMLElement as isHTMLElement8,
  ParagraphNode as ParagraphNode2,
  TextNode as TextNode10
} from "lexical";
function getExtraStyles(element) {
  let extraStyles = "";
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== "" && fontSize !== "15px") {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== "" && backgroundColor !== "rgb(255, 255, 255)") {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== "" && color !== "rgb(0, 0, 0)") {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
}
function buildImportMap3() {
  const importMap = {};
  for (const [tag, fn] of Object.entries(TextNode10.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (output === null || output.forChild === void 0 || output.after !== void 0 || output.node !== null) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode6(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              }
            };
          }
          return output;
        }
      };
    };
  }
  return importMap;
}
function buildExportMap() {
  return /* @__PURE__ */ new Map([
    [
      ParagraphNode2,
      (editor, target) => {
        const output = target.exportDOM(editor);
        if (isHTMLElement8(output.element) && output.element.tagName === "P") {
          const after = output.after;
          return {
            ...output,
            after: (generatedElement) => {
              if (after) {
                generatedElement = after(generatedElement);
              }
              if (isHTMLElement8(generatedElement) && generatedElement.tagName === "P") {
                for (const childNode of generatedElement.childNodes) {
                  if (isBlockDomNode(childNode)) {
                    const div = document.createElement("div");
                    div.setAttribute("role", "paragraph");
                    for (const attr of generatedElement.attributes) {
                      div.setAttribute(attr.name, attr.value);
                    }
                    while (generatedElement.firstChild) {
                      div.appendChild(generatedElement.firstChild);
                    }
                    return div;
                  }
                }
              }
            }
          };
        }
        return output;
      }
    ]
  ]);
}
function buildHTMLConfig() {
  return { export: buildExportMap(), import: buildImportMap3() };
}

// src/core/NotionLikeEditor.tsx
import { jsx as jsx60, jsxs as jsxs33 } from "react/jsx-runtime";
function NotionLikeEditor({
  showToolbar = true,
  autoFocus = true,
  measureTypingPerf = false,
  initialEditorState,
  initialMarkdown,
  onChange,
  onChangePlainText,
  onChangeHtml,
  onChangeMarkdown,
  debounceMs = 300,
  isCodeShiki = false,
  imageUploadHandler,
  customLinkMatchers,
  onEditorReady,
  extraPlugins,
  extraComponentPickerOptions
}) {
  const settings = useMemo19(
    () => ({
      ...INITIAL_SETTINGS,
      showToolbar,
      autoFocus,
      measureTypingPerf,
      isCodeShiki
    }),
    [showToolbar, measureTypingPerf, autoFocus, isCodeShiki]
  );
  const app = useMemo19(
    () => defineExtension({
      $initialEditorState: initialEditorState ? initialEditorState : initialMarkdown ? () => {
        $convertFromMarkdownString4(initialMarkdown, PLAYGROUND_TRANSFORMERS);
      } : void 0,
      html: buildHTMLConfig(),
      name: "pecus/NotionLikeEditor",
      namespace: "NotionLikeEditor",
      nodes: NotionLikeEditorNodes_default,
      theme: NotionLikeEditorTheme_default
    }),
    [initialEditorState, initialMarkdown]
  );
  const debouncedOnChange = useDebouncedCallback2((editorState) => {
    if (onChange) {
      const json = JSON.stringify(editorState.toJSON());
      onChange(json);
    }
  }, debounceMs);
  const debouncedOnChangePlainText = useDebouncedCallback2((editorState) => {
    if (onChangePlainText) {
      editorState.read(() => {
        const root = $getRoot6();
        const plainText = root.getTextContent();
        onChangePlainText(plainText);
      });
    }
  }, debounceMs);
  const debouncedOnChangeHtml = useDebouncedCallback2((editorState, editor) => {
    if (onChangeHtml) {
      editorState.read(() => {
        const html = $generateHtmlFromNodes2(editor);
        onChangeHtml(html);
      });
    }
  }, debounceMs);
  const debouncedOnChangeMarkdown = useDebouncedCallback2((editorState) => {
    if (onChangeMarkdown) {
      editorState.read(() => {
        const markdown = $convertToMarkdownString3(TRANSFORMERS);
        onChangeMarkdown(markdown);
      });
    }
  }, debounceMs);
  const handleChange = useCallback23(
    (editorState, editor) => {
      debouncedOnChange(editorState);
      debouncedOnChangePlainText(editorState);
      debouncedOnChangeHtml(editorState, editor);
      debouncedOnChangeMarkdown(editorState);
    },
    [debouncedOnChange, debouncedOnChangePlainText, debouncedOnChangeHtml, debouncedOnChangeMarkdown]
  );
  return /* @__PURE__ */ jsx60(FullscreenProvider, { children: /* @__PURE__ */ jsx60(
    EditorContainer,
    {
      settings,
      imageUploadHandler,
      customLinkMatchers,
      app,
      onChange,
      onChangePlainText,
      onChangeHtml,
      onChangeMarkdown,
      handleChange,
      measureTypingPerf,
      onEditorReady,
      extraPlugins,
      extraComponentPickerOptions
    }
  ) });
}
function EditorContainer({
  settings,
  imageUploadHandler,
  customLinkMatchers,
  app,
  onChange,
  onChangePlainText,
  onChangeHtml,
  onChangeMarkdown,
  handleChange,
  measureTypingPerf,
  onEditorReady,
  extraPlugins,
  extraComponentPickerOptions
}) {
  const { isFullscreen } = useFullscreen();
  return /* @__PURE__ */ jsx60("div", { className: `notion-like-editor ${isFullscreen ? "fixed inset-0 z-9999 bg-base-100 flex flex-col" : ""}`, children: /* @__PURE__ */ jsx60(FlashMessageContext, { children: /* @__PURE__ */ jsx60(SettingsContext, { initialSettings: settings, children: /* @__PURE__ */ jsx60(ImageUploadProvider, { handler: imageUploadHandler ?? null, children: /* @__PURE__ */ jsx60(AutoLinkProvider, { customMatchers: customLinkMatchers, children: /* @__PURE__ */ jsx60(LexicalExtensionComposer, { extension: app, contentEditable: null, children: /* @__PURE__ */ jsx60(ComponentPickerProvider, { extraOptions: extraComponentPickerOptions, children: /* @__PURE__ */ jsx60(SharedHistoryContext, { children: /* @__PURE__ */ jsx60(TableContext, { children: /* @__PURE__ */ jsxs33(ToolbarContext, { children: [
    /* @__PURE__ */ jsx60("div", { className: `editor-shell ${isFullscreen ? "flex-1 flex flex-col overflow-hidden" : ""}`, children: /* @__PURE__ */ jsx60(Editor, { isFullscreen }) }),
    (onChange || onChangePlainText || onChangeHtml || onChangeMarkdown) && /* @__PURE__ */ jsx60(OnChangePlugin, { onChange: handleChange }),
    measureTypingPerf && /* @__PURE__ */ jsx60(TypingPerfPlugin, {}),
    /* @__PURE__ */ jsx60(InsertMarkdownPlugin, {}),
    onEditorReady && /* @__PURE__ */ jsx60(EditorReadyPlugin, { onReady: onEditorReady }),
    extraPlugins
  ] }) }) }) }) }) }) }) }) }) });
}
function EditorReadyPlugin({ onReady }) {
  const [editor] = useLexicalComposerContext43();
  useEffect51(() => {
    onReady(editor);
  }, [editor, onReady]);
  return null;
}

// src/core/NotionLikeViewer.tsx
import { LexicalExtensionComposer as LexicalExtensionComposer2 } from "@lexical/react/LexicalExtensionComposer";
import { defineExtension as defineExtension2 } from "lexical";
import { useMemo as useMemo20 } from "react";

// src/themes/NotionLikeViewerTheme.ts
init_NotionLikeEditorTheme();
var theme3 = {
  autocomplete: "NotionLikeEditorTheme__autocomplete",
  blockCursor: "NotionLikeEditorTheme__blockCursor",
  characterLimit: "NotionLikeEditorTheme__characterLimit",
  code: "NotionLikeViewerTheme__code",
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
  table: "NotionLikeViewerTheme__table",
  tableAddColumns: "NotionLikeEditorTheme__tableAddColumns",
  tableAddRows: "NotionLikeEditorTheme__tableAddRows",
  tableAlignment: {
    center: "NotionLikeEditorTheme__tableAlignmentCenter",
    right: "NotionLikeEditorTheme__tableAlignmentRight"
  },
  tableCell: "NotionLikeViewerTheme__tableCell",
  tableCellActionButton: "NotionLikeEditorTheme__tableCellActionButton",
  tableCellActionButtonContainer: "NotionLikeEditorTheme__tableCellActionButtonContainer",
  tableCellHeader: "NotionLikeViewerTheme__tableCellHeader",
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
var NotionLikeViewerTheme_default = theme3;

// src/core/Viewer.tsx
import { CheckListPlugin as CheckListPlugin2 } from "@lexical/react/LexicalCheckListPlugin";
import { ClickableLinkPlugin as ClickableLinkPlugin2 } from "@lexical/react/LexicalClickableLinkPlugin";
import { ContentEditable as ContentEditable2 } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary as LexicalErrorBoundary4 } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin as ListPlugin2 } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin as RichTextPlugin3 } from "@lexical/react/LexicalRichTextPlugin";
import { TabIndentationPlugin as TabIndentationPlugin2 } from "@lexical/react/LexicalTabIndentationPlugin";
import { TablePlugin as TablePlugin2 } from "@lexical/react/LexicalTablePlugin";
import { CAN_USE_DOM as CAN_USE_DOM2 } from "@lexical/utils";
import { useEffect as useEffect52, useState as useState35 } from "react";
init_LinkPlugin();
import { jsx as jsx61, jsxs as jsxs34 } from "react/jsx-runtime";
function Viewer() {
  const {
    settings: {
      isCodeHighlighted,
      isCodeShiki,
      hasLinkAttributes,
      hasNestedTables: hasTabHandler,
      showTableOfContents,
      tableCellMerge,
      tableCellBackgroundColor,
      tableHorizontalScroll,
      shouldAllowHighlightingWithBrackets,
      listStrictIndent
    }
  } = useSettings();
  const [isSmallWidthViewport, setIsSmallWidthViewport] = useState35(false);
  const [floatingAnchorElem, setFloatingAnchorElem] = useState35(null);
  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };
  useEffect52(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = CAN_USE_DOM2 && window.matchMedia("(max-width: 1025px)").matches;
      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);
    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);
  return /* @__PURE__ */ jsxs34("div", { className: "editor-container", children: [
    /* @__PURE__ */ jsx61(
      RichTextPlugin3,
      {
        contentEditable: /* @__PURE__ */ jsx61("div", { className: "editor-scroller", children: /* @__PURE__ */ jsx61("div", { className: "editor", ref: onRef, children: /* @__PURE__ */ jsx61(ContentEditable2, {}) }) }),
        ErrorBoundary: LexicalErrorBoundary4
      }
    ),
    isCodeHighlighted && (isCodeShiki ? /* @__PURE__ */ jsx61(CodeHighlightShikiPlugin, {}) : /* @__PURE__ */ jsx61(CodeHighlightPrismPlugin, {})),
    /* @__PURE__ */ jsx61(ListPlugin2, { hasStrictIndent: listStrictIndent }),
    /* @__PURE__ */ jsx61(CheckListPlugin2, {}),
    /* @__PURE__ */ jsx61(
      TablePlugin2,
      {
        hasCellMerge: tableCellMerge,
        hasCellBackgroundColor: tableCellBackgroundColor,
        hasHorizontalScroll: tableHorizontalScroll,
        hasTabHandler
      }
    ),
    /* @__PURE__ */ jsx61(TableCellResizerPlugin, {}),
    /* @__PURE__ */ jsx61(ImagesPlugin, {}),
    /* @__PURE__ */ jsx61(LinkPlugin, { hasLinkAttributes }),
    /* @__PURE__ */ jsx61(LexicalAutoLinkPlugin, {}),
    /* @__PURE__ */ jsx61(TwitterPlugin, {}),
    /* @__PURE__ */ jsx61(YouTubePlugin, {}),
    /* @__PURE__ */ jsx61(FigmaPlugin, {}),
    /* @__PURE__ */ jsx61(ClickableLinkPlugin2, { disabled: false }),
    /* @__PURE__ */ jsx61(HorizontalRulePlugin, {}),
    /* @__PURE__ */ jsx61(EquationsPlugin, {}),
    /* @__PURE__ */ jsx61(TabFocusPlugin, {}),
    /* @__PURE__ */ jsx61(TabIndentationPlugin2, { maxIndent: 7 }),
    /* @__PURE__ */ jsx61(CollapsiblePlugin, {}),
    /* @__PURE__ */ jsx61(PageBreakPlugin, {}),
    /* @__PURE__ */ jsx61(LayoutPlugin, {}),
    floatingAnchorElem && /* @__PURE__ */ jsx61(CodeActionMenuPlugin, { anchorElem: floatingAnchorElem, showOnlyCopy: true }),
    /* @__PURE__ */ jsx61("div", { children: showTableOfContents && /* @__PURE__ */ jsx61(TableOfContentsPlugin, {}) }),
    shouldAllowHighlightingWithBrackets && /* @__PURE__ */ jsx61(SpecialTextPlugin, {})
  ] });
}

// src/core/NotionLikeViewer.tsx
import { jsx as jsx62 } from "react/jsx-runtime";
function NotionLikeViewer({
  initialViewerState,
  isCodeShiki = false,
  customLinkMatchers
}) {
  const settings = useMemo20(
    () => ({
      ...INITIAL_SETTINGS,
      isCodeShiki
    }),
    [isCodeShiki]
  );
  const app = useMemo20(
    () => defineExtension2({
      $initialEditorState: initialViewerState,
      html: buildHTMLConfig(),
      name: "pecus/NotionLikeViewer",
      namespace: "NotionLikeViewer",
      nodes: NotionLikeEditorNodes_default,
      theme: NotionLikeViewerTheme_default,
      editable: false
    }),
    [initialViewerState]
  );
  return /* @__PURE__ */ jsx62("div", { className: "notion-like-editor", children: /* @__PURE__ */ jsx62(SettingsContext, { initialSettings: settings, children: /* @__PURE__ */ jsx62(AutoLinkProvider, { customMatchers: customLinkMatchers, children: /* @__PURE__ */ jsx62(LexicalExtensionComposer2, { extension: app, contentEditable: null, children: /* @__PURE__ */ jsx62(TableContext, { children: /* @__PURE__ */ jsx62("div", { className: "viewer-shell", children: /* @__PURE__ */ jsx62(Viewer, {}) }) }) }) }) }) });
}

// src/index.ts
init_SharedHistoryContext();
init_ContentEditable2();
init_EquationEditor2();
init_ImageResizer();
init_KatexRenderer();

// src/ui/Select.tsx
import { useState as useState36 } from "react";
import { jsx as jsx63, jsxs as jsxs35 } from "react/jsx-runtime";
function generateId3(label) {
  return `input-${label.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).substring(2, 11)}`;
}
function Select({ children, label, className, ...other }) {
  const [selectId] = useState36(generateId3(label));
  return /* @__PURE__ */ jsxs35("div", { className: "Input__wrapper", children: [
    /* @__PURE__ */ jsx63("label", { style: { marginTop: "-1em" }, className: "Input__label", htmlFor: selectId, children: label }),
    /* @__PURE__ */ jsx63("select", { id: selectId, ...other, className: className || "select", children })
  ] });
}

// src/ui/Switch.tsx
import { useMemo as useMemo21 } from "react";
import { jsx as jsx64, jsxs as jsxs36 } from "react/jsx-runtime";
function Switch({
  checked,
  onClick,
  text,
  id
}) {
  const buttonId = useMemo21(() => `id_${Math.floor(Math.random() * 1e4)}`, []);
  return /* @__PURE__ */ jsxs36("div", { className: "switch", id, children: [
    /* @__PURE__ */ jsx64("label", { htmlFor: buttonId, children: text }),
    /* @__PURE__ */ jsx64("button", { type: "button", role: "switch", "aria-checked": checked, id: buttonId, onClick, children: /* @__PURE__ */ jsx64("span", {}) })
  ] });
}

// src/index.ts
init_url();
init_NotionLikeEditorTheme2();
init_StickyEditorTheme2();

// src/nodes/index.ts
init_DateTimeNode2();
init_EmojiNode();
init_EquationNode();
init_EquationComponent();
init_ImageNode2();
init_ImageComponent();
init_KeywordNode();
init_MentionNode();
init_StickyNode2();
init_StickyComponent();

// src/index.ts
var PACKAGE_VERSION = "0.1.0";
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
  Button,
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
  ColorPicker,
  ComponentPickerProvider,
  LexicalContentEditable as ContentEditable,
  DateTimeNode,
  DialogActions,
  DialogButtonsList,
  DropDown,
  DropDownItem,
  DropdownColorPicker,
  Editor,
  EmojiNode,
  EquationEditor_default as EquationEditor,
  EquationNode,
  FigmaNode,
  FileInput,
  FlashMessage,
  FlashMessageContext,
  FullscreenProvider,
  HorizontalRulePlugin,
  INSERT_MARKDOWN_COMMAND,
  ImageNode,
  ImageResizer,
  ImageUploadProvider,
  ImagesPlugin,
  KatexEquationAlterer,
  KatexRenderer,
  KeywordNode,
  LayoutContainerNode,
  LayoutItemNode,
  MentionNode,
  Modal,
  NotionLikeEditor,
  NotionLikeEditorNodes_default as NotionLikeEditorNodes,
  NotionLikeEditorTheme_default as NotionLikeEditorTheme,
  NotionLikeViewer,
  NotionLikeViewerTheme_default as NotionLikeViewerTheme,
  PACKAGE_VERSION,
  PLAYGROUND_TRANSFORMERS,
  PageBreakNode,
  Select,
  SettingsContext,
  SharedHistoryContext,
  SpecialTextNode,
  StickyEditorTheme_default as StickyEditorTheme,
  StickyNode,
  Switch,
  TableContext,
  TextInput,
  ToolbarContext,
  TweetNode,
  Viewer,
  YouTubeNode,
  blockTypeToBlockName,
  emoji_list_default as emojiList,
  getSelectedNode,
  joinClasses,
  sanitizeUrl,
  useComponentPickerContext,
  useFlashMessageContext,
  useFullscreen,
  useImageUpload,
  useModal,
  useReport,
  useSettings,
  useSharedHistoryContext,
  useToolbarState,
  validateUrl
};
//# sourceMappingURL=index.mjs.map
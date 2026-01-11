"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/context/SharedHistoryContext.tsx
var import_LexicalHistoryPlugin, import_react6, import_jsx_runtime7, Context3, SharedHistoryContext, useSharedHistoryContext;
var init_SharedHistoryContext = __esm({
  "src/context/SharedHistoryContext.tsx"() {
    "use strict";
    import_LexicalHistoryPlugin = require("@lexical/react/LexicalHistoryPlugin");
    import_react6 = require("react");
    import_jsx_runtime7 = require("react/jsx-runtime");
    Context3 = (0, import_react6.createContext)({});
    SharedHistoryContext = ({ children }) => {
      const historyContext = (0, import_react6.useMemo)(() => ({ historyState: (0, import_LexicalHistoryPlugin.createEmptyHistoryState)() }), []);
      return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Context3.Provider, { value: historyContext, children });
    };
    useSharedHistoryContext = () => {
      return (0, import_react6.useContext)(Context3);
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
function DateTimeComponent({
  dateTime,
  nodeKey
}) {
  const [editor] = (0, import_LexicalComposerContext10.useLexicalComposerContext)();
  const [isOpen, setIsOpen] = (0, import_react25.useState)(false);
  const ref = (0, import_react25.useRef)(null);
  const [selected, setSelected] = (0, import_react25.useState)(dateTime);
  const [includeTime, setIncludeTime] = (0, import_react25.useState)(() => {
    if (dateTime === void 0) {
      return false;
    }
    const hours = dateTime?.getHours();
    const minutes = dateTime?.getMinutes();
    return hours !== 0 || minutes !== 0;
  });
  const [timeValue, setTimeValue] = (0, import_react25.useState)(() => {
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
  const [isNodeSelected, _setNodeSelected, _clearNodeSelection] = (0, import_useLexicalNodeSelection.useLexicalNodeSelection)(nodeKey);
  const { refs, floatingStyles, context } = (0, import_react24.useFloating)({
    elements: {
      reference: ref.current
    },
    middleware: [
      (0, import_react24.offset)(5),
      (0, import_react24.flip)({
        fallbackPlacements: ["top-start"]
      }),
      (0, import_react24.shift)({ padding: 10 })
    ],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement: "bottom-start",
    strategy: "fixed",
    whileElementsMounted: import_react24.autoUpdate
  });
  const role = (0, import_react24.useRole)(context, { role: "dialog" });
  const dismiss = (0, import_react24.useDismiss)(context);
  const { getFloatingProps } = (0, import_react24.useInteractions)([role, dismiss]);
  (0, import_react25.useEffect)(() => {
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
        const node = (0, import_lexical14.$getNodeByKey)(nodeKey);
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
          const newSelectedDate = (0, import_date_fns.setHours)((0, import_date_fns.setMinutes)(selected, 0), 0);
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
      const newSelectedDate = (0, import_date_fns.setHours)((0, import_date_fns.setMinutes)(selected, minutes), hours);
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
  return /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
    "div",
    {
      className: `dateTimePill ${isNodeSelected ? "selected" : ""}`,
      ref,
      style: { cursor: "pointer", width: "fit-content" },
      children: [
        dateTime?.toLocaleDateString(void 0, options) + (includeTime ? ` ${timeValue}` : "") || "Invalid Date",
        isOpen && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_react24.FloatingPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
          import_react24.FloatingOverlay,
          {
            lockScroll: true,
            style: {
              zIndex: 2e3
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_react24.FloatingFocusManager, { context, initialFocus: -1, children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(import_react_day_picker.DayPicker, { mode: "single", selected, onSelect: handleDaySelect }),
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("div", { className: "includeTime", children: /* @__PURE__ */ (0, import_jsx_runtime22.jsxs)("label", { htmlFor: "includeTime", style: { display: "inline-flex", alignItems: "center", gap: "6px" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("input", { id: "includeTime", type: "checkbox", checked: includeTime, onChange: handleCheckboxChange }),
                    /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("span", { children: "Include time" })
                  ] }) }),
                  includeTime && /* @__PURE__ */ (0, import_jsx_runtime22.jsx)(
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
                  /* @__PURE__ */ (0, import_jsx_runtime22.jsx)("p", { style: { fontSize: "12px", color: "#666", marginTop: "8px" }, children: userTimeZone })
                ]
              }
            ) })
          }
        ) })
      ]
    }
  );
}
var import_style, import_react24, import_LexicalComposerContext10, import_useLexicalNodeSelection, import_date_fns, import_lexical14, import_react25, import_react_day_picker, import_jsx_runtime22, userTimeZone;
var init_DateTimeComponent = __esm({
  "src/nodes/DateTimeNode/DateTimeComponent.tsx"() {
    "use strict";
    import_style = require("react-day-picker/style.css");
    init_DateTimeNode();
    import_react24 = require("@floating-ui/react");
    import_LexicalComposerContext10 = require("@lexical/react/LexicalComposerContext");
    import_useLexicalNodeSelection = require("@lexical/react/useLexicalNodeSelection");
    import_date_fns = require("date-fns");
    import_lexical14 = require("lexical");
    import_react25 = require("react");
    import_react_day_picker = require("react-day-picker");
    init_DateTimeNode2();
    import_jsx_runtime22 = require("react/jsx-runtime");
    userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
});

// src/nodes/DateTimeNode/DateTimeNode.tsx
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
var import_lexical15, React, import_jsx_runtime23, DateTimeComponent2, getDateTimeText, dateTimeState, DateTimeNode;
var init_DateTimeNode2 = __esm({
  "src/nodes/DateTimeNode/DateTimeNode.tsx"() {
    "use strict";
    import_lexical15 = require("lexical");
    React = __toESM(require("react"));
    import_jsx_runtime23 = require("react/jsx-runtime");
    DateTimeComponent2 = React.lazy(() => Promise.resolve().then(() => (init_DateTimeComponent(), DateTimeComponent_exports)));
    getDateTimeText = (dateTime) => {
      if (dateTime === void 0) {
        return "";
      }
      const hours = dateTime?.getHours();
      const minutes = dateTime?.getMinutes();
      return dateTime.toDateString() + (hours === 0 && minutes === 0 ? "" : ` ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
    };
    dateTimeState = (0, import_lexical15.createState)("dateTime", {
      parse: (v) => new Date(v),
      unparse: (v) => v.toISOString()
    });
    DateTimeNode = class extends import_lexical15.DecoratorNode {
      $config() {
        return this.config("datetime", {
          extends: import_lexical15.DecoratorNode,
          importDOM: (0, import_lexical15.buildImportMap)({
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
        return (0, import_lexical15.$getState)(this, dateTimeState);
      }
      setDateTime(valueOrUpdater) {
        return (0, import_lexical15.$setState)(this, dateTimeState, valueOrUpdater);
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
        return /* @__PURE__ */ (0, import_jsx_runtime23.jsx)(DateTimeComponent2, { dateTime: this.getDateTime(), nodeKey: this.__key });
      }
    };
  }
});

// ../../node_modules/react-error-boundary/dist/react-error-boundary.js
function C(r = [], t = []) {
  return r.length !== t.length || r.some((e, o) => !Object.is(e, t[o]));
}
var import_react27, h, c, m;
var init_react_error_boundary = __esm({
  "../../node_modules/react-error-boundary/dist/react-error-boundary.js"() {
    "use strict";
    "use client";
    import_react27 = require("react");
    h = (0, import_react27.createContext)(null);
    c = {
      didCatch: false,
      error: null
    };
    m = class extends import_react27.Component {
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
            i = (0, import_react27.createElement)(o, u);
          else if (n !== void 0)
            i = n;
          else
            throw a;
        }
        return (0, import_react27.createElement)(
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
function EquationEditor({ equation, setEquation, inline }, forwardedRef) {
  const onChange = (event) => {
    setEquation(event.target.value);
  };
  return inline && (0, import_lexical17.isHTMLElement)(forwardedRef) ? /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("span", { className: "EquationEditor_inputBackground", children: [
    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "EquationEditor_dollarSign", children: "$" }),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
      "input",
      {
        className: "EquationEditor_inlineEditor",
        value: equation,
        onChange,
        ref: forwardedRef
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "EquationEditor_dollarSign", children: "$" })
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime24.jsxs)("div", { className: "EquationEditor_inputBackground", children: [
    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "EquationEditor_dollarSign", children: "$$\n" }),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)(
      "textarea",
      {
        className: "EquationEditor_blockEditor",
        value: equation,
        onChange,
        ref: forwardedRef
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime24.jsx)("span", { className: "EquationEditor_dollarSign", children: "\n$$" })
  ] });
}
var import_lexical17, import_react28, import_jsx_runtime24, EquationEditor_default;
var init_EquationEditor2 = __esm({
  "src/ui/EquationEditor.tsx"() {
    "use strict";
    init_EquationEditor();
    import_lexical17 = require("lexical");
    import_react28 = require("react");
    import_jsx_runtime24 = require("react/jsx-runtime");
    EquationEditor_default = (0, import_react28.forwardRef)(EquationEditor);
  }
});

// src/ui/KatexRenderer.tsx
function KatexRenderer({
  equation,
  inline,
  onDoubleClick
}) {
  const katexElementRef = (0, import_react29.useRef)(null);
  (0, import_react29.useEffect)(() => {
    const katexElement = katexElementRef.current;
    if (katexElement !== null) {
      import_katex.default.render(equation, katexElement, {
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
    /* @__PURE__ */ (0, import_jsx_runtime25.jsxs)(import_jsx_runtime25.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
        "img",
        {
          src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          width: "0",
          height: "0",
          alt: ""
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)("span", { role: "button", tabIndex: -1, onDoubleClick, ref: katexElementRef }),
      /* @__PURE__ */ (0, import_jsx_runtime25.jsx)(
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
var import_katex, import_react29, import_jsx_runtime25;
var init_KatexRenderer = __esm({
  "src/ui/KatexRenderer.tsx"() {
    "use strict";
    import_katex = __toESM(require("katex"));
    import_react29 = require("react");
    import_jsx_runtime25 = require("react/jsx-runtime");
  }
});

// src/nodes/EquationComponent.tsx
var EquationComponent_exports = {};
__export(EquationComponent_exports, {
  default: () => EquationComponent
});
function EquationComponent({ equation, inline, nodeKey }) {
  const [editor] = (0, import_LexicalComposerContext12.useLexicalComposerContext)();
  const isEditable = (0, import_useLexicalEditable.useLexicalEditable)();
  const [equationValue, setEquationValue] = (0, import_react30.useState)(equation);
  const [showEquationEditor, setShowEquationEditor] = (0, import_react30.useState)(false);
  const inputRef = (0, import_react30.useRef)(null);
  const onHide = (0, import_react30.useCallback)(
    (restoreSelection) => {
      setShowEquationEditor(false);
      editor.update(() => {
        const node = (0, import_lexical18.$getNodeByKey)(nodeKey);
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
  (0, import_react30.useEffect)(() => {
    if (!showEquationEditor && equationValue !== equation) {
      setEquationValue(equation);
    }
  }, [showEquationEditor, equation, equationValue]);
  (0, import_react30.useEffect)(() => {
    if (!isEditable) {
      return;
    }
    if (showEquationEditor) {
      return (0, import_utils13.mergeRegister)(
        editor.registerCommand(
          import_lexical18.SELECTION_CHANGE_COMMAND,
          (_payload) => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem !== activeElement) {
              onHide();
            }
            return false;
          },
          import_lexical18.COMMAND_PRIORITY_HIGH
        ),
        editor.registerCommand(
          import_lexical18.KEY_ESCAPE_COMMAND,
          (_payload) => {
            const activeElement = document.activeElement;
            const inputElem = inputRef.current;
            if (inputElem === activeElement) {
              onHide(true);
              return true;
            }
            return false;
          },
          import_lexical18.COMMAND_PRIORITY_HIGH
        )
      );
    } else {
      return editor.registerUpdateListener(({ editorState }) => {
        const isSelected = editorState.read(() => {
          const selection = (0, import_lexical18.$getSelection)();
          return (0, import_lexical18.$isNodeSelection)(selection) && selection.has(nodeKey) && selection.getNodes().length === 1;
        });
        if (isSelected) {
          setShowEquationEditor(true);
        }
      });
    }
  }, [editor, nodeKey, onHide, showEquationEditor, isEditable]);
  return /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(import_jsx_runtime26.Fragment, { children: showEquationEditor && isEditable ? /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(EquationEditor_default, { equation: equationValue, setEquation: setEquationValue, inline, ref: inputRef }) : /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(m, { onError: (e) => editor._onError(e), fallback: null, children: /* @__PURE__ */ (0, import_jsx_runtime26.jsx)(
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
var import_LexicalComposerContext12, import_useLexicalEditable, import_utils13, import_lexical18, import_react30, import_jsx_runtime26;
var init_EquationComponent = __esm({
  "src/nodes/EquationComponent.tsx"() {
    "use strict";
    import_LexicalComposerContext12 = require("@lexical/react/LexicalComposerContext");
    import_useLexicalEditable = require("@lexical/react/useLexicalEditable");
    import_utils13 = require("@lexical/utils");
    import_lexical18 = require("lexical");
    import_react30 = require("react");
    init_react_error_boundary();
    init_EquationEditor2();
    init_KatexRenderer();
    init_EquationNode();
    import_jsx_runtime26 = require("react/jsx-runtime");
  }
});

// src/nodes/EquationNode.tsx
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
  return (0, import_lexical19.$applyNodeReplacement)(equationNode);
}
function $isEquationNode(node) {
  return node instanceof EquationNode;
}
var import_katex2, import_lexical19, React2, import_jsx_runtime27, EquationComponent2, EquationNode;
var init_EquationNode = __esm({
  "src/nodes/EquationNode.tsx"() {
    "use strict";
    import_katex2 = __toESM(require("katex"));
    import_lexical19 = require("lexical");
    React2 = __toESM(require("react"));
    import_jsx_runtime27 = require("react/jsx-runtime");
    EquationComponent2 = React2.lazy(() => Promise.resolve().then(() => (init_EquationComponent(), EquationComponent_exports)));
    EquationNode = class _EquationNode extends import_lexical19.DecoratorNode {
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
        import_katex2.default.render(this.__equation, element, {
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
        return /* @__PURE__ */ (0, import_jsx_runtime27.jsx)(EquationComponent2, { equation: this.__equation, inline: this.__inline, nodeKey: this.__key });
      }
    };
  }
});

// src/nodes/EmojiNode.tsx
function $isEmojiNode(node) {
  return node instanceof EmojiNode;
}
function $createEmojiNode(className, emojiText) {
  const node = new EmojiNode(className, emojiText).setMode("token");
  return (0, import_lexical21.$applyNodeReplacement)(node);
}
var import_lexical21, EmojiNode;
var init_EmojiNode = __esm({
  "src/nodes/EmojiNode.tsx"() {
    "use strict";
    import_lexical21 = require("lexical");
    EmojiNode = class _EmojiNode extends import_lexical21.TextNode {
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
function $createKeywordNode(keyword = "") {
  return (0, import_lexical22.$applyNodeReplacement)(new KeywordNode(keyword));
}
function $isKeywordNode(node) {
  return node instanceof KeywordNode;
}
var import_lexical22, KeywordNode;
var init_KeywordNode = __esm({
  "src/nodes/KeywordNode.ts"() {
    "use strict";
    import_lexical22 = require("lexical");
    KeywordNode = class _KeywordNode extends import_lexical22.TextNode {
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
  (0, import_react33.useEffect)(() => {
    if (!editor.hasNodes([EmojiNode])) {
      throw new Error("EmojisPlugin: EmojiNode not registered on editor");
    }
    return editor.registerNodeTransform(import_lexical23.TextNode, $textNodeTransform);
  }, [editor]);
}
function EmojisPlugin() {
  const [editor] = (0, import_LexicalComposerContext15.useLexicalComposerContext)();
  useEmojis(editor);
  return null;
}
var import_LexicalComposerContext15, import_lexical23, import_react33, emojis;
var init_EmojisPlugin = __esm({
  "src/plugins/EmojisPlugin/index.ts"() {
    "use strict";
    import_LexicalComposerContext15 = require("@lexical/react/LexicalComposerContext");
    import_lexical23 = require("lexical");
    import_react33 = require("react");
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
function LinkPlugin({ hasLinkAttributes = false }) {
  return /* @__PURE__ */ (0, import_jsx_runtime30.jsx)(
    import_LexicalLinkPlugin.LinkPlugin,
    {
      validateUrl,
      attributes: hasLinkAttributes ? {
        rel: "noopener noreferrer",
        target: "_blank"
      } : void 0
    }
  );
}
var import_LexicalLinkPlugin, import_jsx_runtime30;
var init_LinkPlugin = __esm({
  "src/plugins/LinkPlugin/index.tsx"() {
    "use strict";
    import_LexicalLinkPlugin = require("@lexical/react/LexicalLinkPlugin");
    init_url();
    import_jsx_runtime30 = require("react/jsx-runtime");
  }
});

// src/nodes/MentionNode.ts
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
  return (0, import_lexical24.$applyNodeReplacement)(mentionNode);
}
function $isMentionNode(node) {
  return node instanceof MentionNode;
}
var import_lexical24, mentionStyle, MentionNode;
var init_MentionNode = __esm({
  "src/nodes/MentionNode.ts"() {
    "use strict";
    import_lexical24 = require("lexical");
    mentionStyle = "background-color: rgba(24, 119, 232, 0.2)";
    MentionNode = class _MentionNode extends import_lexical24.TextNode {
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
function useMentionLookupService(mentionString) {
  const [results, setResults] = (0, import_react34.useState)([]);
  (0, import_react34.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("span", { className: "text", children: option.name })
      ]
    },
    option.key
  );
}
function NewMentionsPlugin() {
  const [editor] = (0, import_LexicalComposerContext16.useLexicalComposerContext)();
  const [queryString, setQueryString] = (0, import_react34.useState)(null);
  const results = useMentionLookupService(queryString);
  const checkForSlashTriggerMatch = (0, import_LexicalTypeaheadMenuPlugin.useBasicTypeaheadTriggerMatch)("/", {
    minLength: 0
  });
  const options = (0, import_react34.useMemo)(
    () => results.map((result) => new MentionTypeaheadOption(result, /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("i", { className: "icon user" }))).slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results]
  );
  const onSelectOption = (0, import_react34.useCallback)(
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
  const checkForMentionMatch = (0, import_react34.useCallback)(
    (text) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
    import_LexicalTypeaheadMenuPlugin.LexicalTypeaheadMenuPlugin,
    {
      onQueryChange: setQueryString,
      onSelectOption,
      triggerFn: checkForMentionMatch,
      options,
      menuRenderFn: (anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => anchorElementRef.current && results.length ? ReactDOM.createPortal(
        /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("div", { className: "notion-like-editor typeahead-popover mentions-menu", children: /* @__PURE__ */ (0, import_jsx_runtime31.jsx)("ul", { children: options.map((option, i) => /* @__PURE__ */ (0, import_jsx_runtime31.jsx)(
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
var import_LexicalComposerContext16, import_LexicalNodeMenuPlugin, import_LexicalTypeaheadMenuPlugin, import_react34, ReactDOM, import_jsx_runtime31, PUNCTUATION, NAME, DocumentMentionsRegex, PUNC, TRIGGERS, VALID_CHARS, VALID_JOINS, LENGTH_LIMIT, AtSignMentionsRegex, ALIAS_LENGTH_LIMIT, AtSignMentionsRegexAliasRegex, SUGGESTION_LIST_LENGTH_LIMIT, mentionsCache, dummyMentionsData, dummyLookupService, MentionTypeaheadOption;
var init_MentionsPlugin = __esm({
  "src/plugins/MentionsPlugin/index.tsx"() {
    "use strict";
    import_LexicalComposerContext16 = require("@lexical/react/LexicalComposerContext");
    import_LexicalNodeMenuPlugin = require("@lexical/react/LexicalNodeMenuPlugin");
    import_LexicalTypeaheadMenuPlugin = require("@lexical/react/LexicalTypeaheadMenuPlugin");
    import_react34 = require("react");
    ReactDOM = __toESM(require("react-dom"));
    init_MentionNode();
    import_jsx_runtime31 = require("react/jsx-runtime");
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
    MentionTypeaheadOption = class extends import_LexicalNodeMenuPlugin.MenuOption {
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
function LexicalContentEditable({ className, placeholder, placeholderClassName }) {
  return /* @__PURE__ */ (0, import_jsx_runtime32.jsx)(
    import_LexicalContentEditable.ContentEditable,
    {
      className: className ?? "ContentEditable__root",
      "aria-placeholder": placeholder,
      placeholder: /* @__PURE__ */ (0, import_jsx_runtime32.jsx)("div", { className: placeholderClassName ?? "ContentEditable__placeholder", children: placeholder })
    }
  );
}
var import_LexicalContentEditable, import_jsx_runtime32;
var init_ContentEditable2 = __esm({
  "src/ui/ContentEditable.tsx"() {
    "use strict";
    init_ContentEditable();
    import_LexicalContentEditable = require("@lexical/react/LexicalContentEditable");
    import_jsx_runtime32 = require("react/jsx-runtime");
  }
});

// src/ui/ImageResizer.tsx
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
  const controlWrapperRef = (0, import_react35.useRef)(null);
  const userSelect = (0, import_react35.useRef)({
    priority: "",
    value: "default"
  });
  const positioningRef = (0, import_react35.useRef)({
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
      const zoom = (0, import_utils15.calculateZoomLevel)(image);
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
      const zoom = (0, import_utils15.calculateZoomLevel)(image);
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
  return /* @__PURE__ */ (0, import_jsx_runtime33.jsxs)("div", { ref: controlWrapperRef, children: [
    !showCaption && captionsEnabled && /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      "div",
      {
        className: "image-resizer image-resizer-n",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.north);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      "div",
      {
        className: "image-resizer image-resizer-ne",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.north | Direction.east);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      "div",
      {
        className: "image-resizer image-resizer-e",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.east);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      "div",
      {
        className: "image-resizer image-resizer-se",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south | Direction.east);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      "div",
      {
        className: "image-resizer image-resizer-s",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      "div",
      {
        className: "image-resizer image-resizer-sw",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south | Direction.west);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
      "div",
      {
        className: "image-resizer image-resizer-w",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.west);
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime33.jsx)(
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
var import_utils15, import_react35, import_jsx_runtime33, Direction;
var init_ImageResizer = __esm({
  "src/ui/ImageResizer.tsx"() {
    "use strict";
    import_utils15 = require("@lexical/utils");
    import_react35 = require("react");
    import_jsx_runtime33 = require("react/jsx-runtime");
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
function DisableCaptionOnBlur({ setShowCaption }) {
  const [editor] = (0, import_LexicalComposerContext17.useLexicalComposerContext)();
  (0, import_react36.useEffect)(
    () => editor.registerCommand(
      import_lexical25.BLUR_COMMAND,
      () => {
        if ($isCaptionEditorEmpty()) {
          setShowCaption(false);
        }
        return false;
      },
      import_lexical25.COMMAND_PRIORITY_EDITOR
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
  (0, import_react36.useEffect)(() => {
    if (status.error) {
      onError();
    }
  }, [status.error, onError]);
  if (status.error) {
    return /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(BrokenImage, {});
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
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
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
  const imageRef = (0, import_react36.useRef)(null);
  const buttonRef = (0, import_react36.useRef)(null);
  const [isSelected, setSelected, clearSelection] = (0, import_useLexicalNodeSelection2.useLexicalNodeSelection)(nodeKey);
  const [isResizing, setIsResizing] = (0, import_react36.useState)(false);
  const [editor] = (0, import_LexicalComposerContext17.useLexicalComposerContext)();
  const activeEditorRef = (0, import_react36.useRef)(null);
  const [isLoadError, setIsLoadError] = (0, import_react36.useState)(false);
  const isEditable = (0, import_useLexicalEditable2.useLexicalEditable)();
  const isInNodeSelection = (0, import_react36.useMemo)(
    () => isSelected && editor.getEditorState().read(() => {
      const selection = (0, import_lexical25.$getSelection)();
      return (0, import_lexical25.$isNodeSelection)(selection) && selection.has(nodeKey);
    }),
    [editor, isSelected, nodeKey]
  );
  const $onEnter = (0, import_react36.useCallback)(
    (event) => {
      const latestSelection = (0, import_lexical25.$getSelection)();
      const buttonElem = buttonRef.current;
      if ((0, import_lexical25.$isNodeSelection)(latestSelection) && latestSelection.has(nodeKey) && latestSelection.getNodes().length === 1) {
        if (showCaption) {
          (0, import_lexical25.$setSelection)(null);
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
  const $onEscape = (0, import_react36.useCallback)(
    (event) => {
      if (activeEditorRef.current === caption || buttonRef.current === event.target) {
        (0, import_lexical25.$setSelection)(null);
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
  const onClick = (0, import_react36.useCallback)(
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
  const onRightClick = (0, import_react36.useCallback)(
    (event) => {
      editor.getEditorState().read(() => {
        const latestSelection = (0, import_lexical25.$getSelection)();
        const domElement = event.target;
        if (domElement.tagName === "IMG" && (0, import_lexical25.$isRangeSelection)(latestSelection) && latestSelection.getNodes().length === 1) {
          editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
        }
      });
    },
    [editor]
  );
  (0, import_react36.useEffect)(() => {
    return (0, import_utils16.mergeRegister)(
      editor.registerCommand(
        import_lexical25.SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        import_lexical25.COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        import_lexical25.DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        import_lexical25.COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);
  (0, import_react36.useEffect)(() => {
    let rootCleanup = noop;
    return (0, import_utils16.mergeRegister)(
      editor.registerCommand(import_lexical25.CLICK_COMMAND, onClick, import_lexical25.COMMAND_PRIORITY_LOW),
      editor.registerCommand(RIGHT_CLICK_IMAGE_COMMAND, onClick, import_lexical25.COMMAND_PRIORITY_LOW),
      editor.registerCommand(import_lexical25.KEY_ENTER_COMMAND, $onEnter, import_lexical25.COMMAND_PRIORITY_LOW),
      editor.registerCommand(import_lexical25.KEY_ESCAPE_COMMAND, $onEscape, import_lexical25.COMMAND_PRIORITY_LOW),
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
      const node = (0, import_lexical25.$getNodeByKey)(nodeKey);
      if ($isImageNode(node)) {
        node.setShowCaption(show);
        if (show) {
          node.__caption.update(() => {
            if (!(0, import_lexical25.$getSelection)()) {
              (0, import_lexical25.$getRoot)().selectEnd();
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
      const node = (0, import_lexical25.$getNodeByKey)(nodeKey);
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
  return /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_react36.Suspense, { fallback: null, children: [
    /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("div", { draggable, children: isLoadError ? /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(BrokenImage, {}) : /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
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
    showCaption && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)("div", { className: "image-caption-container", children: /* @__PURE__ */ (0, import_jsx_runtime34.jsxs)(import_LexicalNestedComposer.LexicalNestedComposer, { initialEditor: caption, children: [
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(DisableCaptionOnBlur, { setShowCaption }),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(NewMentionsPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(LinkPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(EmojisPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(import_LexicalHashtagPlugin.HashtagPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
        import_LexicalRichTextPlugin.RichTextPlugin,
        {
          contentEditable: /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
            LexicalContentEditable,
            {
              placeholder: "Enter a caption...",
              placeholderClassName: "ImageNode__placeholder",
              className: "ImageNode__contentEditable"
            }
          ),
          ErrorBoundary: import_LexicalErrorBoundary.LexicalErrorBoundary
        }
      )
    ] }) }),
    resizable && isInNodeSelection && isFocused && /* @__PURE__ */ (0, import_jsx_runtime34.jsx)(
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
var import_LexicalComposerContext17, import_LexicalErrorBoundary, import_LexicalHashtagPlugin, import_LexicalNestedComposer, import_LexicalRichTextPlugin, import_useLexicalEditable2, import_useLexicalNodeSelection2, import_utils16, import_lexical25, import_react36, import_jsx_runtime34, imageCache, RIGHT_CLICK_IMAGE_COMMAND;
var init_ImageComponent = __esm({
  "src/nodes/ImageComponent.tsx"() {
    "use strict";
    init_ImageNode();
    import_LexicalComposerContext17 = require("@lexical/react/LexicalComposerContext");
    import_LexicalErrorBoundary = require("@lexical/react/LexicalErrorBoundary");
    import_LexicalHashtagPlugin = require("@lexical/react/LexicalHashtagPlugin");
    import_LexicalNestedComposer = require("@lexical/react/LexicalNestedComposer");
    import_LexicalRichTextPlugin = require("@lexical/react/LexicalRichTextPlugin");
    import_useLexicalEditable2 = require("@lexical/react/useLexicalEditable");
    import_useLexicalNodeSelection2 = require("@lexical/react/useLexicalNodeSelection");
    import_utils16 = require("@lexical/utils");
    import_lexical25 = require("lexical");
    import_react36 = require("react");
    init_SharedHistoryContext();
    init_image_broken();
    init_EmojisPlugin();
    init_LinkPlugin();
    init_MentionsPlugin();
    init_ContentEditable2();
    init_ImageResizer();
    init_ImageNode2();
    import_jsx_runtime34 = require("react/jsx-runtime");
    imageCache = /* @__PURE__ */ new Map();
    RIGHT_CLICK_IMAGE_COMMAND = (0, import_lexical25.createCommand)("RIGHT_CLICK_IMAGE_COMMAND");
  }
});

// src/nodes/ImageNode.tsx
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
  for (const { origin } of (0, import_lexical26.$extendCaretToRange)((0, import_lexical26.$getChildCaret)((0, import_lexical26.$getRoot)(), "next"))) {
    if (!(0, import_lexical26.$isElementNode)(origin)) {
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
  return (0, import_lexical26.$applyNodeReplacement)(
    new ImageNode(src, altText, maxWidth, width, height, showCaption, caption, captionsEnabled, key)
  );
}
function $isImageNode(node) {
  return node instanceof ImageNode;
}
var import_clipboard, import_hashtag, import_html, import_link, import_lexical26, React3, import_jsx_runtime35, ImageComponent2, ImageNode;
var init_ImageNode2 = __esm({
  "src/nodes/ImageNode.tsx"() {
    "use strict";
    import_clipboard = require("@lexical/clipboard");
    import_hashtag = require("@lexical/hashtag");
    import_html = require("@lexical/html");
    import_link = require("@lexical/link");
    import_lexical26 = require("lexical");
    React3 = __toESM(require("react"));
    init_EmojiNode();
    init_KeywordNode();
    import_jsx_runtime35 = require("react/jsx-runtime");
    ImageComponent2 = React3.lazy(() => Promise.resolve().then(() => (init_ImageComponent(), ImageComponent_exports)));
    ImageNode = class _ImageNode extends import_lexical26.DecoratorNode {
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
            const firstChild = (0, import_lexical26.$getRoot)().getFirstChild();
            if ((0, import_lexical26.$isParagraphNode)(firstChild) && firstChild.getNextSibling() === null) {
              selection = (0, import_lexical26.$createRangeSelection)();
              selection.anchor.set(firstChild.getKey(), 0, "element");
              selection.focus.set(firstChild.getKey(), firstChild.getChildrenSize(), "element");
            }
            return (0, import_html.$generateHtmlFromNodes)(captionEditor, selection);
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
                          const editor = (0, import_lexical26.$getEditor)();
                          (0, import_clipboard.$insertGeneratedNodes)(editor, (0, import_html.$generateNodesFromDOM)(editor, figcaption), (0, import_lexical26.$selectAll)());
                          (0, import_lexical26.$setSelection)(null);
                        },
                        { tag: import_lexical26.SKIP_DOM_SELECTION_TAG }
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
        this.__caption = caption || (0, import_lexical26.createEditor)({
          namespace: "Playground/ImageNodeCaption",
          nodes: [import_lexical26.RootNode, import_lexical26.TextNode, import_lexical26.LineBreakNode, import_lexical26.ParagraphNode, import_link.LinkNode, EmojiNode, import_hashtag.HashtagNode, KeywordNode]
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
        return /* @__PURE__ */ (0, import_jsx_runtime35.jsx)(
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
  const [editor] = (0, import_LexicalComposerContext40.useLexicalComposerContext)();
  const stickyContainerRef = (0, import_react65.useRef)(null);
  const [portalContainer, setPortalContainer] = (0, import_react65.useState)(null);
  const positioningRef = (0, import_react65.useRef)({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    rootElementRect: null,
    x: 0,
    y: 0
  });
  (0, import_react65.useEffect)(() => {
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
  (0, import_react65.useEffect)(() => {
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
  (0, import_react65.useEffect)(() => {
    const position = positioningRef.current;
    position.x = x;
    position.y = y2;
    const stickyContainer = stickyContainerRef.current;
    if (stickyContainer !== null) {
      positionSticky(stickyContainer, position);
    }
  }, [x, y2]);
  (0, import_react65.useLayoutEffect)(() => {
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
  (0, import_react65.useEffect)(() => {
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
    const zoom = (0, import_utils38.calculateZoomLevel)(stickyContainer);
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
        const node = (0, import_lexical56.$getNodeByKey)(nodeKey);
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
      const node = (0, import_lexical56.$getNodeByKey)(nodeKey);
      if ($isStickyNode(node)) {
        node.remove();
      }
    });
  };
  const handleColorChange = () => {
    editor.update(() => {
      const node = (0, import_lexical56.$getNodeByKey)(nodeKey);
      if ($isStickyNode(node)) {
        node.toggleColor();
      }
    });
  };
  useSharedHistoryContext();
  const stickyContent = /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("div", { ref: stickyContainerRef, className: "sticky-note-container", children: /* @__PURE__ */ (0, import_jsx_runtime55.jsxs)(
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
          const zoom = (0, import_utils38.calculateZoomLevel)(stickContainer);
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
        /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("button", { type: "button", onClick: handleDelete, className: "delete", "aria-label": "Delete sticky note", title: "Delete", children: "X" }),
        /* @__PURE__ */ (0, import_jsx_runtime55.jsx)(
          "button",
          {
            type: "button",
            onClick: handleColorChange,
            className: "color",
            "aria-label": "Change sticky note color",
            title: "Color",
            children: /* @__PURE__ */ (0, import_jsx_runtime55.jsx)("i", { className: "bucket" })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime55.jsx)(import_LexicalNestedComposer2.LexicalNestedComposer, { initialEditor: caption, initialTheme: StickyEditorTheme_default, children: /* @__PURE__ */ (0, import_jsx_runtime55.jsx)(
          import_LexicalPlainTextPlugin.PlainTextPlugin,
          {
            contentEditable: /* @__PURE__ */ (0, import_jsx_runtime55.jsx)(
              LexicalContentEditable,
              {
                placeholder: "What's up?",
                placeholderClassName: "StickyNode__placeholder",
                className: "StickyNode__contentEditable"
              }
            ),
            ErrorBoundary: import_LexicalErrorBoundary2.LexicalErrorBoundary
          }
        ) })
      ]
    }
  ) });
  if (!portalContainer) {
    return null;
  }
  return (0, import_react_dom11.createPortal)(stickyContent, portalContainer);
}
var import_LexicalComposerContext40, import_LexicalErrorBoundary2, import_LexicalNestedComposer2, import_LexicalPlainTextPlugin, import_utils38, import_lexical56, import_react65, import_react_dom11, import_jsx_runtime55;
var init_StickyComponent = __esm({
  "src/nodes/StickyComponent.tsx"() {
    "use strict";
    init_StickyNode();
    import_LexicalComposerContext40 = require("@lexical/react/LexicalComposerContext");
    import_LexicalErrorBoundary2 = require("@lexical/react/LexicalErrorBoundary");
    import_LexicalNestedComposer2 = require("@lexical/react/LexicalNestedComposer");
    import_LexicalPlainTextPlugin = require("@lexical/react/LexicalPlainTextPlugin");
    import_utils38 = require("@lexical/utils");
    import_lexical56 = require("lexical");
    import_react65 = require("react");
    import_react_dom11 = require("react-dom");
    init_SharedHistoryContext();
    init_StickyEditorTheme2();
    init_ContentEditable2();
    init_StickyNode2();
    import_jsx_runtime55 = require("react/jsx-runtime");
  }
});

// src/nodes/StickyNode.tsx
function $isStickyNode(node) {
  return node instanceof StickyNode;
}
function $createStickyNode(xOffset, yOffset) {
  return new StickyNode(xOffset, yOffset, "yellow");
}
var import_lexical57, React5, import_jsx_runtime56, StickyComponent2, StickyNode;
var init_StickyNode2 = __esm({
  "src/nodes/StickyNode.tsx"() {
    "use strict";
    import_lexical57 = require("lexical");
    React5 = __toESM(require("react"));
    import_jsx_runtime56 = require("react/jsx-runtime");
    StickyComponent2 = React5.lazy(() => Promise.resolve().then(() => (init_StickyComponent(), StickyComponent_exports)));
    StickyNode = class _StickyNode extends import_lexical57.DecoratorNode {
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
        this.__caption = caption || (0, import_lexical57.createEditor)();
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
        (0, import_lexical57.$setSelection)(null);
      }
      toggleColor() {
        const writable = this.getWritable();
        writable.__color = writable.__color === "pink" ? "yellow" : "pink";
      }
      decorate(_editor, _config) {
        return /* @__PURE__ */ (0, import_jsx_runtime56.jsx)(
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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  $createAutocompleteNode: () => $createAutocompleteNode,
  $createCollapsibleContainerNode: () => $createCollapsibleContainerNode,
  $createCollapsibleContentNode: () => $createCollapsibleContentNode,
  $createCollapsibleTitleNode: () => $createCollapsibleTitleNode,
  $createDateTimeNode: () => $createDateTimeNode,
  $createEmojiNode: () => $createEmojiNode,
  $createEquationNode: () => $createEquationNode,
  $createFigmaNode: () => $createFigmaNode,
  $createImageNode: () => $createImageNode,
  $createKeywordNode: () => $createKeywordNode,
  $createLayoutContainerNode: () => $createLayoutContainerNode,
  $createLayoutItemNode: () => $createLayoutItemNode,
  $createMentionNode: () => $createMentionNode,
  $createPageBreakNode: () => $createPageBreakNode,
  $createSpecialTextNode: () => $createSpecialTextNode,
  $createStickyNode: () => $createStickyNode,
  $createTweetNode: () => $createTweetNode,
  $createYouTubeNode: () => $createYouTubeNode,
  $isCollapsibleContainerNode: () => $isCollapsibleContainerNode,
  $isCollapsibleContentNode: () => $isCollapsibleContentNode,
  $isCollapsibleTitleNode: () => $isCollapsibleTitleNode,
  $isDateTimeNode: () => $isDateTimeNode,
  $isEmojiNode: () => $isEmojiNode,
  $isEquationNode: () => $isEquationNode,
  $isFigmaNode: () => $isFigmaNode,
  $isImageNode: () => $isImageNode,
  $isKeywordNode: () => $isKeywordNode,
  $isLayoutContainerNode: () => $isLayoutContainerNode,
  $isLayoutItemNode: () => $isLayoutItemNode,
  $isMentionNode: () => $isMentionNode,
  $isPageBreakNode: () => $isPageBreakNode,
  $isSpecialTextNode: () => $isSpecialTextNode,
  $isStickyNode: () => $isStickyNode,
  $isTweetNode: () => $isTweetNode,
  $isYouTubeNode: () => $isYouTubeNode,
  AutocompleteNode: () => AutocompleteNode,
  Button: () => Button,
  CollapsibleContainerNode: () => CollapsibleContainerNode,
  CollapsibleContentNode: () => CollapsibleContentNode,
  CollapsibleTitleNode: () => CollapsibleTitleNode,
  ColorPicker: () => ColorPicker,
  ComponentPickerProvider: () => ComponentPickerProvider,
  ContentEditable: () => LexicalContentEditable,
  DateTimeNode: () => DateTimeNode,
  DialogActions: () => DialogActions,
  DialogButtonsList: () => DialogButtonsList,
  DropDown: () => DropDown,
  DropDownItem: () => DropDownItem,
  DropdownColorPicker: () => DropdownColorPicker,
  Editor: () => Editor,
  EmojiNode: () => EmojiNode,
  EquationEditor: () => EquationEditor_default,
  EquationNode: () => EquationNode,
  FigmaNode: () => FigmaNode,
  FileInput: () => FileInput,
  FlashMessage: () => FlashMessage,
  FlashMessageContext: () => FlashMessageContext,
  FragmentLinkPlugin: () => FragmentLinkPlugin,
  FullscreenProvider: () => FullscreenProvider,
  HorizontalRulePlugin: () => HorizontalRulePlugin,
  INSERT_MARKDOWN_COMMAND: () => INSERT_MARKDOWN_COMMAND,
  ImageNode: () => ImageNode,
  ImageResizer: () => ImageResizer,
  ImageUploadProvider: () => ImageUploadProvider,
  ImagesPlugin: () => ImagesPlugin,
  KatexEquationAlterer: () => KatexEquationAlterer,
  KatexRenderer: () => KatexRenderer,
  KeywordNode: () => KeywordNode,
  LayoutContainerNode: () => LayoutContainerNode,
  LayoutItemNode: () => LayoutItemNode,
  MentionNode: () => MentionNode,
  Modal: () => Modal,
  NotionLikeEditor: () => NotionLikeEditor,
  NotionLikeEditorNodes: () => NotionLikeEditorNodes_default,
  NotionLikeEditorTheme: () => NotionLikeEditorTheme_default,
  NotionLikeViewer: () => NotionLikeViewer,
  NotionLikeViewerTheme: () => NotionLikeViewerTheme_default,
  PACKAGE_VERSION: () => PACKAGE_VERSION,
  PLAYGROUND_TRANSFORMERS: () => PLAYGROUND_TRANSFORMERS2,
  PageBreakNode: () => PageBreakNode,
  Select: () => Select,
  SettingsContext: () => SettingsContext,
  SharedHistoryContext: () => SharedHistoryContext,
  SpecialTextNode: () => SpecialTextNode,
  StickyEditorTheme: () => StickyEditorTheme_default,
  StickyNode: () => StickyNode,
  Switch: () => Switch,
  TableContext: () => TableContext,
  TextInput: () => TextInput,
  ToolbarContext: () => ToolbarContext,
  TweetNode: () => TweetNode,
  Viewer: () => Viewer,
  YouTubeNode: () => YouTubeNode,
  blockTypeToBlockName: () => blockTypeToBlockName,
  emojiList: () => emoji_list_default,
  getSelectedNode: () => getSelectedNode,
  joinClasses: () => joinClasses,
  sanitizeUrl: () => sanitizeUrl,
  useComponentPickerContext: () => useComponentPickerContext,
  useFlashMessageContext: () => useFlashMessageContext,
  useFullscreen: () => useFullscreen,
  useImageUpload: () => useImageUpload,
  useModal: () => useModal,
  useReport: () => useReport,
  useSettings: () => useSettings,
  useSharedHistoryContext: () => useSharedHistoryContext,
  useToolbarState: () => useToolbarState,
  validateUrl: () => validateUrl
});
module.exports = __toCommonJS(src_exports);

// src/context/ComponentPickerContext.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var ComponentPickerContext = (0, import_react.createContext)({});
function ComponentPickerProvider({
  children,
  extraOptions
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComponentPickerContext.Provider, { value: { extraOptions }, children });
}
function useComponentPickerContext() {
  return (0, import_react.useContext)(ComponentPickerContext);
}

// src/context/FlashMessageContext.tsx
var import_react2 = require("react");

// src/ui/FlashMessage.tsx
var import_react_dom = require("react-dom");
var import_jsx_runtime2 = require("react/jsx-runtime");
function FlashMessage({ children }) {
  return (0, import_react_dom.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "notion-like-editor FlashMessage__overlay", role: "dialog", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "notion-like-editor FlashMessage__alert", role: "alert", children }) }),
    document.body
  );
}

// src/context/FlashMessageContext.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var Context = (0, import_react2.createContext)(void 0);
var INITIAL_STATE = {};
var DEFAULT_DURATION = 1e3;
var FlashMessageContext = ({ children }) => {
  const [props, setProps] = (0, import_react2.useState)(INITIAL_STATE);
  const showFlashMessage = (0, import_react2.useCallback)(
    (message, duration) => setProps(message ? { duration, message } : INITIAL_STATE),
    []
  );
  (0, import_react2.useEffect)(() => {
    if (props.message) {
      const timeoutId = setTimeout(() => setProps(INITIAL_STATE), props.duration ?? DEFAULT_DURATION);
      return () => clearTimeout(timeoutId);
    }
  }, [props]);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Context.Provider, { value: showFlashMessage, children: [
    children,
    props.message && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(FlashMessage, { children: props.message })
  ] });
};
var useFlashMessageContext = () => {
  const ctx = (0, import_react2.useContext)(Context);
  if (!ctx) {
    throw new Error("Missing FlashMessageContext");
  }
  return ctx;
};

// src/context/FullscreenContext.tsx
var import_react3 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var FullscreenContext = (0, import_react3.createContext)(void 0);
function FullscreenProvider({ children }) {
  const [isFullscreen, setIsFullscreen] = (0, import_react3.useState)(false);
  const toggleFullscreen = (0, import_react3.useCallback)(() => {
    setIsFullscreen((prev) => !prev);
  }, []);
  const exitFullscreen = (0, import_react3.useCallback)(() => {
    setIsFullscreen(false);
  }, []);
  (0, import_react3.useEffect)(() => {
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
  const value = (0, import_react3.useMemo)(
    () => ({
      isFullscreen,
      toggleFullscreen,
      exitFullscreen
    }),
    [isFullscreen, toggleFullscreen, exitFullscreen]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(FullscreenContext.Provider, { value, children });
}
function useFullscreen() {
  const context = (0, import_react3.useContext)(FullscreenContext);
  if (context === void 0) {
    throw new Error("useFullscreen must be used within a FullscreenProvider");
  }
  return context;
}

// src/context/ImageUploadContext.tsx
var import_react4 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var ImageUploadContext = (0, import_react4.createContext)({
  handler: null
});
function useImageUpload() {
  const context = (0, import_react4.useContext)(ImageUploadContext);
  return context.handler;
}
function ImageUploadProvider({ children, handler }) {
  const value = (0, import_react4.useMemo)(() => ({ handler }), [handler]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ImageUploadContext.Provider, { value, children });
}

// src/context/SettingsContext.tsx
var import_react5 = require("react");

// src/core/appSettings.ts
var DEFAULT_SETTINGS = {
  autoFocus: true,
  codeShikiTheme: "github-light",
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
var import_jsx_runtime6 = require("react/jsx-runtime");
var Context2 = (0, import_react5.createContext)({
  setOption: (_name, _value) => {
    return;
  },
  settings: INITIAL_SETTINGS
});
var SettingsContext = ({
  children,
  initialSettings
}) => {
  const [settings, setSettings] = (0, import_react5.useState)(() => ({
    ...INITIAL_SETTINGS,
    ...initialSettings
  }));
  const setOption = (0, import_react5.useCallback)((setting, value) => {
    setSettings((options) => ({
      ...options,
      [setting]: value
    }));
    setURLParam(setting, value);
  }, []);
  const contextValue = (0, import_react5.useMemo)(() => {
    return { setOption, settings };
  }, [setOption, settings]);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Context2.Provider, { value: contextValue, children });
};
var useSettings = () => {
  return (0, import_react5.useContext)(Context2);
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

// src/index.ts
init_SharedHistoryContext();

// src/context/ToolbarContext.tsx
var import_react7 = require("react");
var import_jsx_runtime8 = require("react/jsx-runtime");
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
var Context4 = (0, import_react7.createContext)(void 0);
var ToolbarContext = ({ children }) => {
  const [toolbarState, setToolbarState] = (0, import_react7.useState)(INITIAL_TOOLBAR_STATE);
  const selectionFontSize = toolbarState.fontSize;
  const updateToolbarState = (0, import_react7.useCallback)((key, value) => {
    setToolbarState((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);
  (0, import_react7.useEffect)(() => {
    updateToolbarState("fontSizeInputValue", selectionFontSize.slice(0, -2));
  }, [selectionFontSize, updateToolbarState]);
  const contextValue = (0, import_react7.useMemo)(() => {
    return {
      toolbarState,
      updateToolbarState
    };
  }, [toolbarState, updateToolbarState]);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Context4.Provider, { value: contextValue, children });
};
var useToolbarState = () => {
  const context = (0, import_react7.useContext)(Context4);
  if (context === void 0) {
    throw new Error("useToolbarState must be used within a ToolbarProvider");
  }
  return context;
};

// src/core/Editor.tsx
var import_LexicalAutoFocusPlugin = require("@lexical/react/LexicalAutoFocusPlugin");
var import_LexicalCharacterLimitPlugin = require("@lexical/react/LexicalCharacterLimitPlugin");
var import_LexicalCheckListPlugin = require("@lexical/react/LexicalCheckListPlugin");
var import_LexicalClearEditorPlugin = require("@lexical/react/LexicalClearEditorPlugin");
var import_LexicalClickableLinkPlugin = require("@lexical/react/LexicalClickableLinkPlugin");
var import_LexicalComposerContext41 = require("@lexical/react/LexicalComposerContext");
var import_LexicalErrorBoundary3 = require("@lexical/react/LexicalErrorBoundary");
var import_LexicalHashtagPlugin2 = require("@lexical/react/LexicalHashtagPlugin");
var import_LexicalHistoryPlugin2 = require("@lexical/react/LexicalHistoryPlugin");
var import_LexicalListPlugin = require("@lexical/react/LexicalListPlugin");
var import_LexicalRichTextPlugin2 = require("@lexical/react/LexicalRichTextPlugin");
var import_LexicalSelectionAlwaysOnDisplay = require("@lexical/react/LexicalSelectionAlwaysOnDisplay");
var import_LexicalTabIndentationPlugin = require("@lexical/react/LexicalTabIndentationPlugin");
var import_LexicalTablePlugin = require("@lexical/react/LexicalTablePlugin");
var import_useLexicalEditable6 = require("@lexical/react/useLexicalEditable");
var import_utils42 = require("@lexical/utils");
var import_react67 = require("react");
init_SharedHistoryContext();

// src/plugins/AutocompletePlugin/index.tsx
var import_LexicalComposerContext = require("@lexical/react/LexicalComposerContext");
var import_selection = require("@lexical/selection");
var import_utils = require("@lexical/utils");
var import_lexical2 = require("lexical");
var import_react8 = require("react");

// src/nodes/AutocompleteNode.tsx
var import_lexical = require("lexical");
var AutocompleteNode = class _AutocompleteNode extends import_lexical.TextNode {
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
var HISTORY_MERGE = { tag: import_lexical2.HISTORY_MERGE_TAG };
var uuid = Math.random().toString(36).replace(/[^a-z]+/g, "").substring(0, 5);
function $search(selection) {
  if (!(0, import_lexical2.$isRangeSelection)(selection) || !selection.isCollapsed()) {
    return [false, ""];
  }
  const node = selection.getNodes()[0];
  const anchor = selection.anchor;
  if (!(0, import_lexical2.$isTextNode)(node) || !node.isSimpleText() || !(0, import_selection.$isAtNodeEnd)(anchor)) {
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
  return (0, import_react8.useCallback)((searchText) => {
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
  const [editor] = (0, import_LexicalComposerContext.useLexicalComposerContext)();
  const query = useQuery();
  const { toolbarState } = useToolbarState();
  (0, import_react8.useEffect)(() => {
    let autocompleteNodeKey = null;
    let lastMatch = null;
    let lastSuggestion = null;
    let searchPromise = null;
    let prevNodeFormat = 0;
    function $clearSuggestion() {
      const autocompleteNode = autocompleteNodeKey !== null ? (0, import_lexical2.$getNodeByKey)(autocompleteNodeKey) : null;
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
        const selection = (0, import_lexical2.$getSelection)();
        const [hasMatch, match] = $search(selection);
        if (!hasMatch || match !== lastMatch || !(0, import_lexical2.$isRangeSelection)(selection)) {
          return;
        }
        const selectionCopy = selection.clone();
        const prevNode = selection.getNodes()[0];
        prevNodeFormat = prevNode.getFormat();
        const node = $createAutocompleteNode(formatSuggestionText(newSuggestion), uuid).setFormat(prevNodeFormat).setStyle(`font-size: ${toolbarState.fontSize}`);
        autocompleteNodeKey = node.getKey();
        selection.insertNodes([node]);
        (0, import_lexical2.$setSelection)(selectionCopy);
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
        const selection = (0, import_lexical2.$getSelection)();
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
      const autocompleteNode = (0, import_lexical2.$getNodeByKey)(autocompleteNodeKey);
      if (autocompleteNode === null) {
        return false;
      }
      const textNode = (0, import_lexical2.$createTextNode)(lastSuggestion).setFormat(prevNodeFormat).setStyle(`font-size: ${toolbarState.fontSize}`);
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
          (0, import_lexical2.$addUpdateTag)(HISTORY_MERGE.tag);
        }
      });
    }
    function unmountSuggestion() {
      editor.update(() => {
        $clearSuggestion();
      }, HISTORY_MERGE);
    }
    const rootElem = editor.getRootElement();
    return (0, import_utils.mergeRegister)(
      editor.registerNodeTransform(AutocompleteNode, $handleAutocompleteNodeTransform),
      editor.registerUpdateListener(handleUpdate),
      editor.registerCommand(import_lexical2.KEY_TAB_COMMAND, $handleKeypressCommand, import_lexical2.COMMAND_PRIORITY_LOW),
      editor.registerCommand(import_lexical2.KEY_ARROW_RIGHT_COMMAND, $handleKeypressCommand, import_lexical2.COMMAND_PRIORITY_LOW),
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
var import_LexicalAutoEmbedPlugin = require("@lexical/react/LexicalAutoEmbedPlugin");
var import_LexicalComposerContext5 = require("@lexical/react/LexicalComposerContext");
var import_react15 = require("react");

// src/hooks/useModal.tsx
var import_react10 = require("react");

// src/ui/Modal.tsx
var import_lexical3 = require("lexical");
var import_react9 = require("react");
var import_react_dom2 = require("react-dom");
var import_jsx_runtime9 = require("react/jsx-runtime");
function PortalImpl({
  onClose,
  children,
  title,
  closeOnClickOutside
}) {
  const modalRef = (0, import_react9.useRef)(null);
  (0, import_react9.useEffect)(() => {
    if (modalRef.current !== null) {
      modalRef.current.focus();
    }
  }, []);
  (0, import_react9.useEffect)(() => {
    let modalOverlayElement = null;
    const handler = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const clickOutsideHandler = (event) => {
      const target = event.target;
      if (modalRef.current !== null && (0, import_lexical3.isDOMNode)(target) && !modalRef.current.contains(target) && closeOnClickOutside) {
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
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "notion-like-editor notion-like-modal-overlay fixed inset-0 bg-black/50 z-50", role: "dialog" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "div",
      {
        className: "notion-like-editor notion-like-modal-content fixed inset-0 z-60 flex items-center justify-center p-4",
        tabIndex: -1,
        ref: modalRef,
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "bg-base-100 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto", children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between p-6 border-b border-base-300", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h2", { className: "text-2xl font-bold flex items-center gap-2", children: title }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: "btn btn-sm btn-circle ms-2", onClick: onClose, "aria-label": "\u9589\u3058\u308B", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "icon-[mdi--close] size-5", "aria-hidden": "true" }) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "p-6", children })
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
  return (0, import_react_dom2.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(PortalImpl, { onClose, title, closeOnClickOutside, children }),
    document.body
  );
}

// src/hooks/useModal.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
function useModal() {
  const [modalContent, setModalContent] = (0, import_react10.useState)(null);
  const onClose = (0, import_react10.useCallback)(() => {
    setModalContent(null);
  }, []);
  const modal = (0, import_react10.useMemo)(() => {
    if (modalContent === null) {
      return null;
    }
    const { title, content, closeOnClickOutside } = modalContent;
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Modal, { onClose, title, closeOnClickOutside, children: content });
  }, [modalContent, onClose]);
  const showModal = (0, import_react10.useCallback)(
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
var import_jsx_runtime11 = require("react/jsx-runtime");
function Button({
  "data-test-id": dataTestId,
  children,
  className,
  onClick,
  disabled,
  small,
  title
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
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
var import_jsx_runtime12 = require("react/jsx-runtime");
function DialogButtonsList({ children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "DialogButtonsList", children });
}
function DialogActions({ "data-test-id": dataTestId, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "DialogActions", "data-test-id": dataTestId, children });
}

// src/plugins/FigmaPlugin/index.tsx
var import_LexicalComposerContext2 = require("@lexical/react/LexicalComposerContext");
var import_utils2 = require("@lexical/utils");
var import_lexical4 = require("lexical");
var import_react11 = require("react");

// src/nodes/FigmaNode.tsx
var import_LexicalBlockWithAlignableContents = require("@lexical/react/LexicalBlockWithAlignableContents");
var import_LexicalDecoratorBlockNode = require("@lexical/react/LexicalDecoratorBlockNode");
var import_jsx_runtime13 = require("react/jsx-runtime");
function FigmaComponent({ className, format, nodeKey, documentID }) {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_LexicalBlockWithAlignableContents.BlockWithAlignableContents, { className, format, nodeKey, children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
    "iframe",
    {
      width: "560",
      height: "315",
      src: `https://www.figma.com/embed?embed_host=lexical&url=        https://www.figma.com/file/${documentID}`,
      allowFullScreen: true
    }
  ) });
}
var FigmaNode = class _FigmaNode extends import_LexicalDecoratorBlockNode.DecoratorBlockNode {
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
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(FigmaComponent, { className, format: this.__format, nodeKey: this.getKey(), documentID: this.__id });
  }
};
function $createFigmaNode(documentID) {
  return new FigmaNode(documentID);
}
function $isFigmaNode(node) {
  return node instanceof FigmaNode;
}

// src/plugins/FigmaPlugin/index.tsx
var INSERT_FIGMA_COMMAND = (0, import_lexical4.createCommand)("INSERT_FIGMA_COMMAND");
function FigmaPlugin() {
  const [editor] = (0, import_LexicalComposerContext2.useLexicalComposerContext)();
  (0, import_react11.useEffect)(() => {
    if (!editor.hasNodes([FigmaNode])) {
      throw new Error("FigmaPlugin: FigmaNode not registered on editor");
    }
    return editor.registerCommand(
      INSERT_FIGMA_COMMAND,
      (payload) => {
        const figmaNode = $createFigmaNode(payload);
        (0, import_utils2.$insertNodeToNearestRoot)(figmaNode);
        return true;
      },
      import_lexical4.COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

// src/plugins/TwitterPlugin/index.ts
var import_LexicalComposerContext3 = require("@lexical/react/LexicalComposerContext");
var import_utils3 = require("@lexical/utils");
var import_lexical5 = require("lexical");
var import_react13 = require("react");

// src/nodes/TweetNode.tsx
var import_LexicalBlockWithAlignableContents2 = require("@lexical/react/LexicalBlockWithAlignableContents");
var import_LexicalDecoratorBlockNode2 = require("@lexical/react/LexicalDecoratorBlockNode");
var import_react12 = require("react");
var import_jsx_runtime14 = require("react/jsx-runtime");
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
  const containerRef = (0, import_react12.useRef)(null);
  const previousTweetIDRef = (0, import_react12.useRef)("");
  const [isTweetLoading, setIsTweetLoading] = (0, import_react12.useState)(false);
  const createTweet = (0, import_react12.useCallback)(async () => {
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
  (0, import_react12.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_LexicalBlockWithAlignableContents2.BlockWithAlignableContents, { className, format, nodeKey, children: [
    isTweetLoading ? loadingComponent : null,
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { style: { display: "inline-block", width: "550px" }, ref: containerRef })
  ] });
}
var TweetNode = class _TweetNode extends import_LexicalDecoratorBlockNode2.DecoratorBlockNode {
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
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
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
var INSERT_TWEET_COMMAND = (0, import_lexical5.createCommand)("INSERT_TWEET_COMMAND");
function TwitterPlugin() {
  const [editor] = (0, import_LexicalComposerContext3.useLexicalComposerContext)();
  (0, import_react13.useEffect)(() => {
    if (!editor.hasNodes([TweetNode])) {
      throw new Error("TwitterPlugin: TweetNode not registered on editor");
    }
    return editor.registerCommand(
      INSERT_TWEET_COMMAND,
      (payload) => {
        const tweetNode = $createTweetNode(payload);
        (0, import_utils3.$insertNodeToNearestRoot)(tweetNode);
        return true;
      },
      import_lexical5.COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

// src/plugins/YouTubePlugin/index.ts
var import_LexicalComposerContext4 = require("@lexical/react/LexicalComposerContext");
var import_utils4 = require("@lexical/utils");
var import_lexical6 = require("lexical");
var import_react14 = require("react");

// src/nodes/YouTubeNode.tsx
var import_LexicalBlockWithAlignableContents3 = require("@lexical/react/LexicalBlockWithAlignableContents");
var import_LexicalDecoratorBlockNode3 = require("@lexical/react/LexicalDecoratorBlockNode");
var import_jsx_runtime15 = require("react/jsx-runtime");
function YouTubeComponent({ className, format, nodeKey, videoID }) {
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(import_LexicalBlockWithAlignableContents3.BlockWithAlignableContents, { className, format, nodeKey, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
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
var YouTubeNode = class _YouTubeNode extends import_LexicalDecoratorBlockNode3.DecoratorBlockNode {
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
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(YouTubeComponent, { className, format: this.__format, nodeKey: this.getKey(), videoID: this.__id });
  }
};
function $createYouTubeNode(videoID) {
  return new YouTubeNode(videoID);
}
function $isYouTubeNode(node) {
  return node instanceof YouTubeNode;
}

// src/plugins/YouTubePlugin/index.ts
var INSERT_YOUTUBE_COMMAND = (0, import_lexical6.createCommand)("INSERT_YOUTUBE_COMMAND");
function YouTubePlugin() {
  const [editor] = (0, import_LexicalComposerContext4.useLexicalComposerContext)();
  (0, import_react14.useEffect)(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error("YouTubePlugin: YouTubeNode not registered on editor");
    }
    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        const youTubeNode = $createYouTubeNode(payload);
        (0, import_utils4.$insertNodeToNearestRoot)(youTubeNode);
        return true;
      },
      import_lexical6.COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

// src/plugins/AutoEmbedPlugin/index.tsx
var import_jsx_runtime16 = require("react/jsx-runtime");
var YoutubeEmbedConfig = {
  contentName: "Youtube Video",
  exampleUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  // Icon for display.
  icon: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("i", { className: "icon youtube" }),
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
  icon: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("i", { className: "icon x" }),
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
  icon: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("i", { className: "icon figma" }),
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
  const [text, setText] = (0, import_react15.useState)("");
  const [editor] = (0, import_LexicalComposerContext5.useLexicalComposerContext)();
  const [embedResult, setEmbedResult] = (0, import_react15.useState)(null);
  const validateText = (0, import_react15.useMemo)(
    () => debounce((inputText) => {
      const urlMatch = import_LexicalAutoEmbedPlugin.URL_MATCHER.exec(inputText);
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
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { style: { width: "100%", maxWidth: "600px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { className: "Input__wrapper", children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(DialogActions, { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(Button, { disabled: !embedResult, onClick, "data-test-id": `${embedConfig.type}-embed-modal-submit-btn`, children: "Embed" }) })
  ] });
}
function AutoEmbedPlugin() {
  const [modal, showModal] = useModal();
  const openEmbedModal = (embedConfig) => {
    showModal(`Embed ${embedConfig.contentName}`, (onClose) => /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(AutoEmbedDialog, { embedConfig, onClose }));
  };
  const getMenuOptions = (activeEmbedConfig, embedFn, dismissFn) => {
    return [
      new import_LexicalAutoEmbedPlugin.AutoEmbedOption("Dismiss", {
        onSelect: dismissFn
      }),
      new import_LexicalAutoEmbedPlugin.AutoEmbedOption(`Embed ${activeEmbedConfig.contentName}`, {
        onSelect: embedFn
      })
    ];
  };
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(import_jsx_runtime16.Fragment, { children: [
    modal,
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
      import_LexicalAutoEmbedPlugin.LexicalAutoEmbedPlugin,
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
var import_LexicalAutoLinkPlugin = require("@lexical/react/LexicalAutoLinkPlugin");
var import_react17 = require("react");

// src/context/AutoLinkContext.tsx
var import_react16 = require("react");
var import_jsx_runtime17 = require("react/jsx-runtime");
var AutoLinkContext = (0, import_react16.createContext)({
  customMatchers: []
});
function useCustomLinkMatchers() {
  const context = (0, import_react16.useContext)(AutoLinkContext);
  return context.customMatchers;
}
function AutoLinkProvider({ children, customMatchers = [] }) {
  const value = (0, import_react16.useMemo)(() => ({ customMatchers }), [customMatchers]);
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(AutoLinkContext.Provider, { value, children });
}

// src/plugins/AutoLinkPlugin/index.tsx
var import_jsx_runtime18 = require("react/jsx-runtime");
var URL_REGEX = /((https?:\/\/(www\.)?)|(www\.))((localhost(:\d+)?)|[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/;
var EMAIL_REGEX = /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
var BASE_MATCHERS = [
  (0, import_LexicalAutoLinkPlugin.createLinkMatcherWithRegExp)(URL_REGEX, (text) => {
    return text.startsWith("http") ? text : `https://${text}`;
  }),
  (0, import_LexicalAutoLinkPlugin.createLinkMatcherWithRegExp)(EMAIL_REGEX, (text) => {
    return `mailto:${text}`;
  })
];
function LexicalAutoLinkPlugin() {
  const customMatchers = useCustomLinkMatchers();
  const matchers = (0, import_react17.useMemo)(() => {
    if (customMatchers.length === 0) {
      return BASE_MATCHERS;
    }
    return [...BASE_MATCHERS, ...customMatchers];
  }, [customMatchers]);
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(import_LexicalAutoLinkPlugin.AutoLinkPlugin, { matchers });
}

// src/plugins/CodeActionMenuPlugin/index.tsx
var import_code3 = require("@lexical/code");
var import_LexicalComposerContext6 = require("@lexical/react/LexicalComposerContext");
var import_lexical9 = require("lexical");
var import_react20 = require("react");
var import_react_dom3 = require("react-dom");

// src/plugins/CodeActionMenuPlugin/components/CopyButton/index.tsx
var import_code = require("@lexical/code");
var import_lexical7 = require("lexical");
var import_react18 = require("react");

// src/plugins/CodeActionMenuPlugin/utils.ts
var import_use_debounce = require("use-debounce");
function useDebounce(fn, ms, maxWait) {
  return (0, import_use_debounce.useDebouncedCallback)(fn, ms, { maxWait });
}

// src/plugins/CodeActionMenuPlugin/components/CopyButton/index.tsx
var import_jsx_runtime19 = require("react/jsx-runtime");
function CopyButton({ editor, getCodeDOMNode }) {
  const [isCopyCompleted, setCopyCompleted] = (0, import_react18.useState)(false);
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
      const codeNode = (0, import_lexical7.$getNearestNodeFromDOMNode)(codeDOMNode);
      if ((0, import_code.$isCodeNode)(codeNode)) {
        content = codeNode.getTextContent();
      }
      const selection = (0, import_lexical7.$getSelection)();
      (0, import_lexical7.$setSelection)(selection);
    });
    try {
      await navigator.clipboard.writeText(content);
      setCopyCompleted(true);
      removeSuccessIcon();
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("button", { type: "button", className: "menu-item", onClick: handleClick, "aria-label": "copy", children: isCopyCompleted ? /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("i", { className: "format success" }) : /* @__PURE__ */ (0, import_jsx_runtime19.jsx)("i", { className: "format copy" }) });
}

// src/plugins/CodeActionMenuPlugin/components/PrettierButton/index.tsx
var import_code2 = require("@lexical/code");
var import_lexical8 = require("lexical");
var import_react19 = require("react");
var import_jsx_runtime20 = require("react/jsx-runtime");
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
  const [syntaxError, setSyntaxError] = (0, import_react19.useState)("");
  const [tipsVisible, setTipsVisible] = (0, import_react19.useState)(false);
  async function handleClick() {
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }
    let content = "";
    editor.update(() => {
      const codeNode = (0, import_lexical8.$getNearestNodeFromDOMNode)(codeDOMNode);
      if ((0, import_code2.$isCodeNode)(codeNode)) {
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
        const codeNode = (0, import_lexical8.$getNearestNodeFromDOMNode)(codeDOMNode);
        if ((0, import_code2.$isCodeNode)(codeNode)) {
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
  return /* @__PURE__ */ (0, import_jsx_runtime20.jsxs)("div", { className: "prettier-wrapper", children: [
    /* @__PURE__ */ (0, import_jsx_runtime20.jsx)(
      "button",
      {
        type: "button",
        className: "menu-item",
        onClick: handleClick,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        "aria-label": "prettier",
        children: syntaxError ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("i", { className: "format prettier-error" }) : /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("i", { className: "format prettier" })
      }
    ),
    tipsVisible ? /* @__PURE__ */ (0, import_jsx_runtime20.jsx)("pre", { className: "code-error-tips", children: syntaxError }) : null
  ] });
}

// src/plugins/CodeActionMenuPlugin/index.tsx
var import_jsx_runtime21 = require("react/jsx-runtime");
var CODE_PADDING = 8;
var SUPPORTED_LANGUAGES = (0, import_code3.getCodeLanguageOptions)().filter(
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
function CodeActionMenuContainer({
  anchorElem,
  showOnlyCopy = false
}) {
  const [editor] = (0, import_LexicalComposerContext6.useLexicalComposerContext)();
  const [lang, setLang] = (0, import_react20.useState)("");
  const [isShown, setShown] = (0, import_react20.useState)(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = (0, import_react20.useState)(false);
  const [position, setPosition] = (0, import_react20.useState)({
    right: "0",
    top: "0"
  });
  const codeSetRef = (0, import_react20.useRef)(/* @__PURE__ */ new Set());
  const codeDOMNodeRef = (0, import_react20.useRef)(null);
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
        const maybeCodeNode = (0, import_lexical9.$getNearestNodeFromDOMNode)(codeDOMNode);
        if ((0, import_code3.$isCodeNode)(maybeCodeNode)) {
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
  (0, import_react20.useEffect)(() => {
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
  (0, import_react20.useEffect)(() => {
    return editor.registerMutationListener(
      import_code3.CodeNode,
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
  const normalizedLang = (0, import_code3.normalizeCodeLang)(lang);
  const handleLanguageChange = (event) => {
    const newLang = event.target.value;
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }
    editor.update(() => {
      const codeNode = (0, import_lexical9.$getNearestNodeFromDOMNode)(codeDOMNode);
      if ((0, import_code3.$isCodeNode)(codeNode)) {
        codeNode.setLanguage(newLang);
      }
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(import_jsx_runtime21.Fragment, { children: isShown ? /* @__PURE__ */ (0, import_jsx_runtime21.jsxs)("div", { className: "notion-like-editor code-action-menu-container", style: { ...position }, children: [
    !showOnlyCopy && /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(
      "select",
      {
        className: "select select-xs max-w-sm",
        value: lang,
        onChange: handleLanguageChange,
        "aria-label": "\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF\u306E\u8A00\u8A9E\u3092\u9078\u629E",
        children: SUPPORTED_LANGUAGES.map(([value, name]) => /* @__PURE__ */ (0, import_jsx_runtime21.jsx)("option", { value, children: name }, value))
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(CopyButton, { editor, getCodeDOMNode }),
    !showOnlyCopy && canBePrettier(normalizedLang) ? /* @__PURE__ */ (0, import_jsx_runtime21.jsx)(PrettierButton, { editor, getCodeDOMNode, lang: normalizedLang }) : null
  ] }) : null });
}
function getMouseInfo(event) {
  const target = event.target;
  if ((0, import_lexical9.isHTMLElement)(target)) {
    const codeDOMNode = target.closest("code.NotionLikeEditorTheme__code") || target.closest("code.NotionLikeViewerTheme__code");
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
  return (0, import_react_dom3.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime21.jsx)(CodeActionMenuContainer, { anchorElem, showOnlyCopy }), anchorElem);
}

// src/plugins/CodeHighlightPrismPlugin/index.ts
var import_code4 = require("@lexical/code");
var import_LexicalComposerContext7 = require("@lexical/react/LexicalComposerContext");
var import_react21 = require("react");
function CodeHighlightPrismPlugin() {
  const [editor] = (0, import_LexicalComposerContext7.useLexicalComposerContext)();
  (0, import_react21.useEffect)(() => {
    return (0, import_code4.registerCodeHighlighting)(editor);
  }, [editor]);
  return null;
}

// src/plugins/CodeHighlightShikiPlugin/index.ts
var import_code5 = require("@lexical/code");
var import_code_shiki = require("@lexical/code-shiki");
var import_LexicalComposerContext8 = require("@lexical/react/LexicalComposerContext");
var import_utils7 = require("@lexical/utils");
var import_react22 = require("react");
function CodeHighlightShikiPlugin() {
  const [editor] = (0, import_LexicalComposerContext8.useLexicalComposerContext)();
  const {
    settings: { codeShikiTheme }
  } = useSettings();
  const prevThemeRef = (0, import_react22.useRef)(codeShikiTheme);
  const tokenizer = (0, import_react22.useMemo)(
    () => ({
      ...import_code_shiki.ShikiTokenizer,
      defaultTheme: codeShikiTheme
    }),
    [codeShikiTheme]
  );
  (0, import_react22.useEffect)(() => {
    if (prevThemeRef.current !== codeShikiTheme) {
      prevThemeRef.current = codeShikiTheme;
      editor.update(() => {
        for (const { node } of (0, import_utils7.$dfs)()) {
          if ((0, import_code5.$isCodeNode)(node)) {
            node.setTheme(codeShikiTheme);
          }
        }
      });
    }
  }, [editor, codeShikiTheme]);
  (0, import_react22.useEffect)(() => {
    return (0, import_code_shiki.registerCodeHighlighting)(editor, tokenizer);
  }, [editor, tokenizer]);
  return null;
}

// src/plugins/CollapsiblePlugin/index.ts
var import_LexicalComposerContext9 = require("@lexical/react/LexicalComposerContext");
var import_utils11 = require("@lexical/utils");
var import_lexical13 = require("lexical");
var import_react23 = require("react");

// src/plugins/CollapsiblePlugin/CollapsibleContainerNode.ts
var import_utils8 = require("@lexical/utils");
var import_lexical10 = require("lexical");

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
var CollapsibleContainerNode = class _CollapsibleContainerNode extends import_lexical10.ElementNode {
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
      if ((0, import_lexical10.$isElementNode)(child)) {
        nodesToInsert.push(...child.getChildren());
      }
    }
    const caret = (0, import_lexical10.$rewindSiblingCaret)((0, import_lexical10.$getSiblingCaret)(this, "previous"));
    caret.splice(1, nodesToInsert);
    const [firstChild] = nodesToInsert;
    if (firstChild) {
      firstChild.selectStart().deleteCharacter(true);
    }
    return true;
  }
  createDOM(_config, editor) {
    let dom;
    if (import_utils8.IS_CHROME) {
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
      if (import_utils8.IS_CHROME) {
        const contentDom = dom.children[1];
        if (!(0, import_lexical10.isHTMLElement)(contentDom)) {
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
var import_utils9 = require("@lexical/utils");
var import_lexical11 = require("lexical");
function $convertCollapsibleContentElement(_domNode) {
  const node = $createCollapsibleContentNode();
  return {
    node
  };
}
var CollapsibleContentNode = class _CollapsibleContentNode extends import_lexical11.ElementNode {
  static getType() {
    return "collapsible-content";
  }
  static clone(node) {
    return new _CollapsibleContentNode(node.__key);
  }
  createDOM(_config, editor) {
    const dom = document.createElement("div");
    dom.classList.add("Collapsible__content");
    if (import_utils9.IS_CHROME) {
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
var import_utils10 = require("@lexical/utils");
var import_lexical12 = require("lexical");
function $convertSummaryElement(_domNode) {
  const node = $createCollapsibleTitleNode();
  return {
    node
  };
}
var CollapsibleTitleNode = class extends import_lexical12.ElementNode {
  /** @internal */
  $config() {
    return this.config("collapsible-title", {
      $transform(node) {
        if (node.isEmpty()) {
          node.remove();
        }
      },
      extends: import_lexical12.ElementNode,
      importDOM: (0, import_lexical12.buildImportMap)({
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
    if (import_utils10.IS_CHROME) {
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
      if ((0, import_lexical12.$isElementNode)(firstChild)) {
        return firstChild;
      } else {
        const paragraph = (0, import_lexical12.$createParagraphNode)();
        contentNode.append(paragraph);
        return paragraph;
      }
    } else {
      const paragraph = (0, import_lexical12.$createParagraphNode)();
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
var INSERT_COLLAPSIBLE_COMMAND = (0, import_lexical13.createCommand)("INSERT_COLLAPSIBLE_COMMAND");
function CollapsiblePlugin() {
  const [editor] = (0, import_LexicalComposerContext9.useLexicalComposerContext)();
  (0, import_react23.useEffect)(() => {
    if (!editor.hasNodes([CollapsibleContainerNode, CollapsibleTitleNode, CollapsibleContentNode])) {
      throw new Error(
        "CollapsiblePlugin: CollapsibleContainerNode, CollapsibleTitleNode, or CollapsibleContentNode not registered on editor"
      );
    }
    const $onEscapeUp = () => {
      const selection = (0, import_lexical13.$getSelection)();
      if ((0, import_lexical13.$isRangeSelection)(selection) && selection.isCollapsed() && selection.anchor.offset === 0) {
        const container = (0, import_utils11.$findMatchingParent)(selection.anchor.getNode(), $isCollapsibleContainerNode);
        if ($isCollapsibleContainerNode(container)) {
          const parent = container.getParent();
          if (parent !== null && parent.getFirstChild() === container && selection.anchor.key === container.getFirstDescendant()?.getKey()) {
            container.insertBefore((0, import_lexical13.$createParagraphNode)());
          }
        }
      }
      return false;
    };
    const $onEscapeDown = () => {
      const selection = (0, import_lexical13.$getSelection)();
      if ((0, import_lexical13.$isRangeSelection)(selection) && selection.isCollapsed()) {
        const container = (0, import_utils11.$findMatchingParent)(selection.anchor.getNode(), $isCollapsibleContainerNode);
        if ($isCollapsibleContainerNode(container)) {
          const parent = container.getParent();
          if (parent !== null && parent.getLastChild() === container) {
            const titleParagraph = container.getFirstDescendant();
            const contentParagraph = container.getLastDescendant();
            if (contentParagraph !== null && selection.anchor.key === contentParagraph.getKey() && selection.anchor.offset === contentParagraph.getTextContentSize() || titleParagraph !== null && selection.anchor.key === titleParagraph.getKey() && selection.anchor.offset === titleParagraph.getTextContentSize()) {
              container.insertAfter((0, import_lexical13.$createParagraphNode)());
            }
          }
        }
      }
      return false;
    };
    return (0, import_utils11.mergeRegister)(
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
          node.replace((0, import_lexical13.$createParagraphNode)().append(...node.getChildren()));
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
      editor.registerCommand(import_lexical13.KEY_ARROW_DOWN_COMMAND, $onEscapeDown, import_lexical13.COMMAND_PRIORITY_LOW),
      editor.registerCommand(import_lexical13.KEY_ARROW_RIGHT_COMMAND, $onEscapeDown, import_lexical13.COMMAND_PRIORITY_LOW),
      // When collapsible is the first child pressing up/left arrow will insert paragraph
      // above it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if leading paragraph is accidentally deleted
      editor.registerCommand(import_lexical13.KEY_ARROW_UP_COMMAND, $onEscapeUp, import_lexical13.COMMAND_PRIORITY_LOW),
      editor.registerCommand(import_lexical13.KEY_ARROW_LEFT_COMMAND, $onEscapeUp, import_lexical13.COMMAND_PRIORITY_LOW),
      // Enter goes from Title to Content rather than a new line inside Title
      editor.registerCommand(
        import_lexical13.INSERT_PARAGRAPH_COMMAND,
        () => {
          const selection = (0, import_lexical13.$getSelection)();
          if ((0, import_lexical13.$isRangeSelection)(selection)) {
            const titleNode = (0, import_utils11.$findMatchingParent)(selection.anchor.getNode(), (node) => $isCollapsibleTitleNode(node));
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
        import_lexical13.COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_COLLAPSIBLE_COMMAND,
        () => {
          editor.update(() => {
            const title = $createCollapsibleTitleNode();
            const paragraph = (0, import_lexical13.$createParagraphNode)();
            (0, import_utils11.$insertNodeToNearestRoot)(
              $createCollapsibleContainerNode(true).append(
                title.append(paragraph),
                $createCollapsibleContentNode().append((0, import_lexical13.$createParagraphNode)())
              )
            );
            paragraph.select();
          });
          return true;
        },
        import_lexical13.COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);
  return null;
}

// src/plugins/ComponentPickerPlugin/index.tsx
var import_code6 = require("@lexical/code");
var import_list = require("@lexical/list");
var import_LexicalAutoEmbedPlugin2 = require("@lexical/react/LexicalAutoEmbedPlugin");
var import_LexicalComposerContext23 = require("@lexical/react/LexicalComposerContext");
var import_LexicalHorizontalRuleNode = require("@lexical/react/LexicalHorizontalRuleNode");
var import_LexicalTypeaheadMenuPlugin2 = require("@lexical/react/LexicalTypeaheadMenuPlugin");
var import_rich_text = require("@lexical/rich-text");
var import_selection2 = require("@lexical/selection");
var import_table2 = require("@lexical/table");
var import_lexical34 = require("lexical");
var import_react46 = require("react");
var ReactDOM2 = __toESM(require("react-dom"));

// src/plugins/DateTimePlugin/index.tsx
var import_LexicalComposerContext11 = require("@lexical/react/LexicalComposerContext");
var import_utils12 = require("@lexical/utils");
var import_lexical16 = require("lexical");
var import_react26 = require("react");
init_DateTimeNode2();
var INSERT_DATETIME_COMMAND = (0, import_lexical16.createCommand)("INSERT_DATETIME_COMMAND");
function DateTimePlugin() {
  const [editor] = (0, import_LexicalComposerContext11.useLexicalComposerContext)();
  (0, import_react26.useEffect)(() => {
    if (!editor.hasNodes([DateTimeNode])) {
      throw new Error("DateTimePlugin: DateTimeNode not registered on editor");
    }
    return (0, import_utils12.mergeRegister)(
      editor.registerCommand(
        INSERT_DATETIME_COMMAND,
        (payload) => {
          const { dateTime } = payload;
          const dateTimeNode = $createDateTimeNode(dateTime);
          (0, import_lexical16.$insertNodes)([dateTimeNode]);
          if ((0, import_lexical16.$isRootOrShadowRoot)(dateTimeNode.getParentOrThrow())) {
            (0, import_utils12.$wrapNodeInElement)(dateTimeNode, import_lexical16.$createParagraphNode).selectEnd();
          }
          return true;
        },
        import_lexical16.COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);
  return null;
}

// src/plugins/EquationsPlugin/index.tsx
var import_katex3 = require("katex/dist/katex.css");
var import_LexicalComposerContext14 = require("@lexical/react/LexicalComposerContext");
var import_utils14 = require("@lexical/utils");
var import_lexical20 = require("lexical");
var import_react32 = require("react");
init_EquationNode();

// src/ui/KatexEquationAlterer.tsx
var import_LexicalComposerContext13 = require("@lexical/react/LexicalComposerContext");
var import_react31 = require("react");
init_react_error_boundary();
init_KatexRenderer();
var import_jsx_runtime28 = require("react/jsx-runtime");
function KatexEquationAlterer({ onConfirm, initialEquation = "" }) {
  const [editor] = (0, import_LexicalComposerContext13.useLexicalComposerContext)();
  const [equation, setEquation] = (0, import_react31.useState)(initialEquation);
  const [inline, setInline] = (0, import_react31.useState)(true);
  const onClick = (0, import_react31.useCallback)(() => {
    onConfirm(equation, inline);
  }, [onConfirm, equation, inline]);
  const onCheckboxChange = (0, import_react31.useCallback)(() => {
    setInline(!inline);
  }, [inline]);
  return /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)(import_jsx_runtime28.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime28.jsxs)("div", { className: "KatexEquationAlterer_defaultRow", children: [
      "Inline",
      /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("input", { type: "checkbox", checked: inline, onChange: onCheckboxChange })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "KatexEquationAlterer_defaultRow", children: "Equation " }),
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "KatexEquationAlterer_centerRow", children: inline ? /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
      "input",
      {
        onChange: (event) => {
          setEquation(event.target.value);
        },
        value: equation,
        className: "KatexEquationAlterer_textArea"
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(
      "textarea",
      {
        onChange: (event) => {
          setEquation(event.target.value);
        },
        value: equation,
        className: "KatexEquationAlterer_textArea"
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "KatexEquationAlterer_defaultRow", children: "Visualization " }),
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "KatexEquationAlterer_centerRow", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(m, { onError: (e) => editor._onError(e), fallback: null, children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(KatexRenderer, { equation, inline: false, onDoubleClick: () => null }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime28.jsx)("div", { className: "KatexEquationAlterer_dialogActions", children: /* @__PURE__ */ (0, import_jsx_runtime28.jsx)(Button, { onClick, children: "Confirm" }) })
  ] });
}

// src/plugins/EquationsPlugin/index.tsx
var import_jsx_runtime29 = require("react/jsx-runtime");
var INSERT_EQUATION_COMMAND = (0, import_lexical20.createCommand)("INSERT_EQUATION_COMMAND");
function InsertEquationDialog({
  activeEditor,
  onClose
}) {
  const onEquationConfirm = (0, import_react32.useCallback)(
    (equation, inline) => {
      activeEditor.dispatchCommand(INSERT_EQUATION_COMMAND, {
        equation,
        inline
      });
      onClose();
    },
    [activeEditor, onClose]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime29.jsx)(KatexEquationAlterer, { onConfirm: onEquationConfirm });
}
function EquationsPlugin() {
  const [editor] = (0, import_LexicalComposerContext14.useLexicalComposerContext)();
  (0, import_react32.useEffect)(() => {
    if (!editor.hasNodes([EquationNode])) {
      throw new Error("EquationsPlugins: EquationsNode not registered on editor");
    }
    return editor.registerCommand(
      INSERT_EQUATION_COMMAND,
      (payload) => {
        const { equation, inline } = payload;
        const equationNode = $createEquationNode(equation, inline);
        (0, import_lexical20.$insertNodes)([equationNode]);
        if ((0, import_lexical20.$isRootOrShadowRoot)(equationNode.getParentOrThrow())) {
          (0, import_utils14.$wrapNodeInElement)(equationNode, import_lexical20.$createParagraphNode).selectEnd();
        }
        return true;
      },
      import_lexical20.COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

// src/plugins/ImagesPlugin/index.tsx
var import_link2 = require("@lexical/link");
var import_LexicalComposerContext18 = require("@lexical/react/LexicalComposerContext");
var import_utils17 = require("@lexical/utils");
var import_lexical27 = require("lexical");
var import_react39 = require("react");
init_ImageNode2();

// src/ui/FileInput.tsx
var import_react37 = require("react");
var import_jsx_runtime36 = require("react/jsx-runtime");
function generateId(label) {
  return `input-${label.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).substring(2, 11)}`;
}
function FileInput({ accept, label, onChange, "data-test-id": dataTestId }) {
  const [inputId] = (0, import_react37.useState)(generateId(label));
  return /* @__PURE__ */ (0, import_jsx_runtime36.jsxs)("div", { className: "Input__wrapper", children: [
    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)("label", { className: "Input__label", htmlFor: inputId, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime36.jsx)(
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
var import_react38 = require("react");
var import_jsx_runtime37 = require("react/jsx-runtime");
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
  const [inputId, _setInputId] = (0, import_react38.useState)(generateId2(label));
  return /* @__PURE__ */ (0, import_jsx_runtime37.jsxs)("div", { className: "Input__wrapper", children: [
    /* @__PURE__ */ (0, import_jsx_runtime37.jsx)("label", { className: "Input__label", htmlFor: inputId, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime37.jsx)(
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
var import_jsx_runtime38 = require("react/jsx-runtime");
var INSERT_IMAGE_COMMAND = (0, import_lexical27.createCommand)("INSERT_IMAGE_COMMAND");
function InsertImageUriDialogBody({ onClick }) {
  const [src, setSrc] = (0, import_react39.useState)("");
  const [altText, setAltText] = (0, import_react39.useState)("");
  const isDisabled = src === "";
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(import_jsx_runtime38.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
      TextInput,
      {
        label: "Image URL",
        placeholder: "i.e. https://source.unsplash.com/random",
        onChange: setSrc,
        value: src,
        "data-test-id": "image-modal-url-input"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
      TextInput,
      {
        label: "Alt Text",
        placeholder: "Random unsplash image",
        onChange: setAltText,
        value: altText,
        "data-test-id": "image-modal-alt-text-input"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(DialogActions, { children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Button, { "data-test-id": "image-modal-confirm-btn", disabled: isDisabled, onClick: () => onClick({ altText, src }), children: "Confirm" }) })
  ] });
}
function InsertImageUploadedDialogBody({ onClick }) {
  const imageUploadHandler = useImageUpload();
  const [altText, setAltText] = (0, import_react39.useState)("");
  const [isUploading, setIsUploading] = (0, import_react39.useState)(false);
  const [uploadError, setUploadError] = (0, import_react39.useState)(null);
  const [selectedFile, setSelectedFile] = (0, import_react39.useState)(null);
  const [previewSrc, setPreviewSrc] = (0, import_react39.useState)("");
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
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(import_jsx_runtime38.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
      FileInput,
      {
        label: "Image Upload",
        onChange: handleFileSelect,
        accept: "image/*",
        "data-test-id": "image-modal-file-upload"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(
      TextInput,
      {
        label: "Alt Text",
        placeholder: "Descriptive alternative text",
        onChange: setAltText,
        value: altText,
        "data-test-id": "image-modal-alt-text-input"
      }
    ),
    uploadError && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("div", { className: "text-error text-sm mt-2", children: uploadError }),
    !canUpload && selectedFile && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)("div", { className: "text-warning text-sm mt-2", children: "\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u30CF\u30F3\u30C9\u30E9\u30FC\u304C\u672A\u8A2D\u5B9A\u306E\u305F\u3081\u3001\u30ED\u30FC\u30AB\u30EB\u30D7\u30EC\u30D3\u30E5\u30FC\u30E2\u30FC\u30C9\u3067\u52D5\u4F5C\u3057\u307E\u3059" }),
    /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(DialogActions, { children: /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Button, { "data-test-id": "image-modal-file-upload-btn", disabled: isDisabled, onClick: handleConfirm, children: isUploading ? "\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u4E2D..." : "Confirm" }) })
  ] });
}
function InsertImageDialog({
  activeEditor,
  onClose
}) {
  const [mode, setMode] = (0, import_react39.useState)(null);
  const hasModifier = (0, import_react39.useRef)(false);
  (0, import_react39.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(import_jsx_runtime38.Fragment, { children: [
    !mode && /* @__PURE__ */ (0, import_jsx_runtime38.jsxs)(DialogButtonsList, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Button, { "data-test-id": "image-modal-option-url", onClick: () => setMode("url"), children: "URL" }),
      /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(Button, { "data-test-id": "image-modal-option-file", onClick: () => setMode("file"), children: "File" })
    ] }),
    mode === "url" && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(InsertImageUriDialogBody, { onClick }),
    mode === "file" && /* @__PURE__ */ (0, import_jsx_runtime38.jsx)(InsertImageUploadedDialogBody, { onClick })
  ] });
}
function ImagesPlugin() {
  const [editor] = (0, import_LexicalComposerContext18.useLexicalComposerContext)();
  (0, import_react39.useEffect)(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagesPlugin: ImageNode not registered on editor");
    }
    return (0, import_utils17.mergeRegister)(
      editor.registerCommand(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          (0, import_lexical27.$insertNodes)([imageNode]);
          if ((0, import_lexical27.$isRootOrShadowRoot)(imageNode.getParentOrThrow())) {
            (0, import_utils17.$wrapNodeInElement)(imageNode, import_lexical27.$createParagraphNode).selectEnd();
          }
          return true;
        },
        import_lexical27.COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        import_lexical27.DRAGSTART_COMMAND,
        (event) => {
          return $onDragStart(event);
        },
        import_lexical27.COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        import_lexical27.DRAGOVER_COMMAND,
        (event) => {
          return $onDragover(event);
        },
        import_lexical27.COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        import_lexical27.DROP_COMMAND,
        (event) => {
          return $onDrop(event, editor);
        },
        import_lexical27.COMMAND_PRIORITY_HIGH
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
  const existingLink = (0, import_utils17.$findMatchingParent)(
    node,
    (parent) => !(0, import_link2.$isAutoLinkNode)(parent) && (0, import_link2.$isLinkNode)(parent)
  );
  event.preventDefault();
  if (canDropImage(event)) {
    const range = getDragSelection(event);
    node.remove();
    const rangeSelection = (0, import_lexical27.$createRangeSelection)();
    if (range !== null && range !== void 0) {
      rangeSelection.applyDOMRange(range);
    }
    (0, import_lexical27.$setSelection)(rangeSelection);
    editor.dispatchCommand(INSERT_IMAGE_COMMAND, data);
    if (existingLink) {
      editor.dispatchCommand(import_link2.TOGGLE_LINK_COMMAND, existingLink.getURL());
    }
  }
  return true;
}
function $getImageNodeInSelection() {
  const selection = (0, import_lexical27.$getSelection)();
  if (!(0, import_lexical27.$isNodeSelection)(selection)) {
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
  return !!((0, import_lexical27.isHTMLElement)(target) && !target.closest("code, span.editor-image") && (0, import_lexical27.isHTMLElement)(target.parentElement) && target.parentElement.closest("div.ContentEditable__root"));
}
function getDragSelection(event) {
  let range;
  const domSelection = (0, import_lexical27.getDOMSelectionFromTarget)(event.target);
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
var import_react42 = require("react");

// src/ui/DropDown.tsx
var import_lexical28 = require("lexical");
var React4 = __toESM(require("react"));
var import_react40 = require("react");
var import_react_dom4 = require("react-dom");

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
var import_jsx_runtime39 = require("react/jsx-runtime");
var DropDownContext = React4.createContext(null);
var dropDownPadding = 4;
function DropDownItem({
  children,
  className,
  onClick,
  title
}) {
  const ref = (0, import_react40.useRef)(null);
  const dropDownContext = React4.useContext(DropDownContext);
  if (dropDownContext === null) {
    throw new Error("DropDownItem must be used within a DropDown");
  }
  const { registerItem } = dropDownContext;
  (0, import_react40.useEffect)(() => {
    if (ref?.current) {
      registerItem(ref);
    }
  }, [registerItem]);
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("button", { className, onClick, ref, title, type: "button", children });
}
function DropDownItems({
  children,
  dropDownRef,
  onClose,
  autofocus
}) {
  const [items, setItems] = (0, import_react40.useState)();
  const [highlightedItem, setHighlightedItem] = (0, import_react40.useState)();
  const registerItem = (0, import_react40.useCallback)((itemRef) => {
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
  const contextValue = (0, import_react40.useMemo)(
    () => ({
      registerItem
    }),
    [registerItem]
  );
  (0, import_react40.useEffect)(() => {
    if (items && !highlightedItem) {
      setHighlightedItem(items[0]);
    }
    if (highlightedItem?.current) {
      highlightedItem.current.focus();
    }
  }, [items, highlightedItem]);
  (0, import_react40.useEffect)(() => {
    if (autofocus && dropDownRef.current) {
      focusNearestDescendant(dropDownRef.current);
    }
  }, [autofocus, dropDownRef]);
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(DropDownContext.Provider, { value: contextValue, children: /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("div", { className: "notion-like-editor nle-dropdown", ref: dropDownRef, onKeyDown: handleKeyDown, children }) });
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
  const dropDownRef = (0, import_react40.useRef)(null);
  const buttonRef = (0, import_react40.useRef)(null);
  const [showDropDown, setShowDropDown] = (0, import_react40.useState)(false);
  const [shouldAutofocus, setShouldAutofocus] = (0, import_react40.useState)(false);
  const handleClose = () => {
    setShowDropDown(false);
    if (buttonRef?.current) {
      buttonRef.current.focus();
    }
  };
  (0, import_react40.useEffect)(() => {
    const button = buttonRef.current;
    const dropDown = dropDownRef.current;
    if (showDropDown && button !== null && dropDown !== null) {
      const { top, left } = button.getBoundingClientRect();
      dropDown.style.top = `${top + button.offsetHeight + dropDownPadding}px`;
      dropDown.style.left = `${Math.min(left, window.innerWidth - dropDown.offsetWidth - 20)}px`;
    }
  }, [showDropDown]);
  (0, import_react40.useEffect)(() => {
    const button = buttonRef.current;
    if (button !== null && showDropDown) {
      const handle = (event) => {
        const target = event.target;
        if (!(0, import_lexical28.isDOMNode)(target)) {
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
  (0, import_react40.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(import_jsx_runtime39.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime39.jsxs)(
      "button",
      {
        type: "button",
        disabled,
        "aria-label": buttonAriaLabel || buttonLabel,
        className: buttonClassName,
        onClick: handleOnClick,
        ref: buttonRef,
        children: [
          buttonIconClassName && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { className: buttonIconClassName }),
          buttonLabel && /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("span", { className: "text dropdown-button-text", children: buttonLabel }),
          /* @__PURE__ */ (0, import_jsx_runtime39.jsx)("i", { className: "chevron-down" })
        ]
      }
    ),
    showDropDown && (0, import_react_dom4.createPortal)(
      /* @__PURE__ */ (0, import_jsx_runtime39.jsx)(DropDownItems, { dropDownRef, onClose: handleClose, autofocus: shouldAutofocus, children }),
      document.body
    )
  ] });
}

// src/plugins/LayoutPlugin/LayoutPlugin.tsx
var import_LexicalComposerContext19 = require("@lexical/react/LexicalComposerContext");
var import_utils20 = require("@lexical/utils");
var import_lexical31 = require("lexical");
var import_react41 = require("react");

// src/nodes/LayoutContainerNode.ts
var import_utils18 = require("@lexical/utils");
var import_lexical29 = require("lexical");
function $convertLayoutContainerElement(domNode) {
  const styleAttributes = window.getComputedStyle(domNode);
  const templateColumns = styleAttributes.getPropertyValue("grid-template-columns");
  if (templateColumns) {
    const node = $createLayoutContainerNode(templateColumns);
    return { node };
  }
  return null;
}
var LayoutContainerNode = class _LayoutContainerNode extends import_lexical29.ElementNode {
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
      (0, import_utils18.addClassNamesToElement)(dom, config.theme.layoutContainer);
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
var import_utils19 = require("@lexical/utils");
var import_lexical30 = require("lexical");
function $convertLayoutItemElement() {
  return { node: $createLayoutItemNode() };
}
function $isEmptyLayoutItemNode(node) {
  if (!$isLayoutItemNode(node) || node.getChildrenSize() !== 1) {
    return false;
  }
  const firstChild = node.getFirstChild();
  return (0, import_lexical30.$isParagraphNode)(firstChild) && firstChild.isEmpty();
}
var LayoutItemNode = class _LayoutItemNode extends import_lexical30.ElementNode {
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
      (0, import_utils19.addClassNamesToElement)(dom, config.theme.layoutItem);
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
var INSERT_LAYOUT_COMMAND = (0, import_lexical31.createCommand)();
var UPDATE_LAYOUT_COMMAND = (0, import_lexical31.createCommand)();
function LayoutPlugin() {
  const [editor] = (0, import_LexicalComposerContext19.useLexicalComposerContext)();
  (0, import_react41.useEffect)(() => {
    if (!editor.hasNodes([LayoutContainerNode, LayoutItemNode])) {
      throw new Error("LayoutPlugin: LayoutContainerNode, or LayoutItemNode not registered on editor");
    }
    const $onEscape = (before) => {
      const selection = (0, import_lexical31.$getSelection)();
      if ((0, import_lexical31.$isRangeSelection)(selection) && selection.isCollapsed() && selection.anchor.offset === 0) {
        const container = (0, import_utils20.$findMatchingParent)(selection.anchor.getNode(), $isLayoutContainerNode);
        if ($isLayoutContainerNode(container)) {
          const parent = container.getParent();
          const child = parent && (before ? parent.getFirstChild() : parent?.getLastChild());
          const descendant = before ? container.getFirstDescendant()?.getKey() : container.getLastDescendant()?.getKey();
          if (parent !== null && child === container && selection.anchor.key === descendant) {
            if (before) {
              container.insertBefore((0, import_lexical31.$createParagraphNode)());
            } else {
              container.insertAfter((0, import_lexical31.$createParagraphNode)());
            }
          }
        }
      }
      return false;
    };
    const $fillLayoutItemIfEmpty = (node) => {
      if (node.isEmpty()) {
        node.append((0, import_lexical31.$createParagraphNode)());
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
    return (0, import_utils20.mergeRegister)(
      // When layout is the last child pressing down/right arrow will insert paragraph
      // below it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if trailing paragraph is accidentally deleted
      editor.registerCommand(import_lexical31.KEY_ARROW_DOWN_COMMAND, () => $onEscape(false), import_lexical31.COMMAND_PRIORITY_LOW),
      editor.registerCommand(import_lexical31.KEY_ARROW_RIGHT_COMMAND, () => $onEscape(false), import_lexical31.COMMAND_PRIORITY_LOW),
      // When layout is the first child pressing up/left arrow will insert paragraph
      // above it to allow adding more content. It's similar what $insertBlockNode
      // (mainly for decorators), except it'll always be possible to continue adding
      // new content even if leading paragraph is accidentally deleted
      editor.registerCommand(import_lexical31.KEY_ARROW_UP_COMMAND, () => $onEscape(true), import_lexical31.COMMAND_PRIORITY_LOW),
      editor.registerCommand(import_lexical31.KEY_ARROW_LEFT_COMMAND, () => $onEscape(true), import_lexical31.COMMAND_PRIORITY_LOW),
      editor.registerCommand(
        INSERT_LAYOUT_COMMAND,
        (template) => {
          editor.update(() => {
            const container = $createLayoutContainerNode(template);
            const itemsCount = getItemsCountFromTemplate(template);
            for (let i = 0; i < itemsCount; i++) {
              container.append($createLayoutItemNode().append((0, import_lexical31.$createParagraphNode)()));
            }
            (0, import_utils20.$insertNodeToNearestRoot)(container);
            container.selectStart();
          });
          return true;
        },
        import_lexical31.COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        UPDATE_LAYOUT_COMMAND,
        ({ template, nodeKey }) => {
          editor.update(() => {
            const container = (0, import_lexical31.$getNodeByKey)(nodeKey);
            if (!$isLayoutContainerNode(container)) {
              return;
            }
            const itemsCount = getItemsCountFromTemplate(template);
            const prevItemsCount = getItemsCountFromTemplate(container.getTemplateColumns());
            if (itemsCount > prevItemsCount) {
              for (let i = prevItemsCount; i < itemsCount; i++) {
                container.append($createLayoutItemNode().append((0, import_lexical31.$createParagraphNode)()));
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
        import_lexical31.COMMAND_PRIORITY_EDITOR
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
var import_jsx_runtime40 = require("react/jsx-runtime");
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
  const [layout, setLayout] = (0, import_react42.useState)(LAYOUTS[0].value);
  const buttonLabel = LAYOUTS.find((item) => item.value === layout)?.label;
  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_LAYOUT_COMMAND, layout);
    onClose();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime40.jsxs)(import_jsx_runtime40.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(DropDown, { buttonClassName: "toolbar-item dialog-dropdown", buttonLabel, children: LAYOUTS.map(({ label, value }) => /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(DropDownItem, { className: "item", onClick: () => setLayout(value), children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("span", { className: "text", children: label }) }, value)) }),
    /* @__PURE__ */ (0, import_jsx_runtime40.jsx)("div", { className: "flex justify-end mt-2", children: /* @__PURE__ */ (0, import_jsx_runtime40.jsx)(Button, { onClick, children: "Insert" }) })
  ] });
}

// src/plugins/PageBreakPlugin/index.tsx
var import_LexicalComposerContext21 = require("@lexical/react/LexicalComposerContext");
var import_utils22 = require("@lexical/utils");
var import_lexical33 = require("lexical");
var import_react44 = require("react");

// src/nodes/PageBreakNode/index.tsx
var import_LexicalComposerContext20 = require("@lexical/react/LexicalComposerContext");
var import_useLexicalNodeSelection3 = require("@lexical/react/useLexicalNodeSelection");
var import_utils21 = require("@lexical/utils");
var import_lexical32 = require("lexical");
var import_react43 = require("react");
var import_jsx_runtime41 = require("react/jsx-runtime");
function PageBreakComponent({ nodeKey }) {
  const [editor] = (0, import_LexicalComposerContext20.useLexicalComposerContext)();
  const [isSelected, setSelected, clearSelection] = (0, import_useLexicalNodeSelection3.useLexicalNodeSelection)(nodeKey);
  (0, import_react43.useEffect)(() => {
    return (0, import_utils21.mergeRegister)(
      editor.registerCommand(
        import_lexical32.CLICK_COMMAND,
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
        import_lexical32.COMMAND_PRIORITY_LOW
      )
    );
  }, [clearSelection, editor, isSelected, nodeKey, setSelected]);
  (0, import_react43.useEffect)(() => {
    const pbElem = editor.getElementByKey(nodeKey);
    if (pbElem !== null) {
      pbElem.className = isSelected ? "selected" : "";
    }
  }, [editor, isSelected, nodeKey]);
  return null;
}
var PageBreakNode = class _PageBreakNode extends import_lexical32.DecoratorNode {
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
          priority: import_lexical32.COMMAND_PRIORITY_HIGH
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
    return /* @__PURE__ */ (0, import_jsx_runtime41.jsx)(PageBreakComponent, { nodeKey: this.__key });
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
var INSERT_PAGE_BREAK = (0, import_lexical33.createCommand)();
function PageBreakPlugin() {
  const [editor] = (0, import_LexicalComposerContext21.useLexicalComposerContext)();
  (0, import_react44.useEffect)(() => {
    if (!editor.hasNodes([PageBreakNode])) {
      throw new Error("PageBreakPlugin: PageBreakNode is not registered on editor");
    }
    return (0, import_utils22.mergeRegister)(
      editor.registerCommand(
        INSERT_PAGE_BREAK,
        () => {
          const selection = (0, import_lexical33.$getSelection)();
          if (!(0, import_lexical33.$isRangeSelection)(selection)) {
            return false;
          }
          const focusNode = selection.focus.getNode();
          if (focusNode !== null) {
            const pgBreak = $createPageBreakNode();
            (0, import_utils22.$insertNodeToNearestRoot)(pgBreak);
          }
          return true;
        },
        import_lexical33.COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);
  return null;
}

// src/plugins/TablePlugin.tsx
var import_LexicalComposerContext22 = require("@lexical/react/LexicalComposerContext");
var import_table = require("@lexical/table");
var import_react45 = require("react");
var import_jsx_runtime42 = require("react/jsx-runtime");
var CellContext = (0, import_react45.createContext)({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {
  }
});
function TableContext({ children }) {
  const [contextValue, setContextValue] = (0, import_react45.useState)({
    cellEditorConfig: null,
    cellEditorPlugins: null
  });
  return /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
    CellContext.Provider,
    {
      value: (0, import_react45.useMemo)(
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
  const [rows, setRows] = (0, import_react45.useState)("5");
  const [columns, setColumns] = (0, import_react45.useState)("5");
  const [isDisabled, setIsDisabled] = (0, import_react45.useState)(true);
  (0, import_react45.useEffect)(() => {
    const row = Number(rows);
    const column = Number(columns);
    if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [rows, columns]);
  const onClick = () => {
    activeEditor.dispatchCommand(import_table.INSERT_TABLE_COMMAND, {
      columns,
      rows
    });
    onClose();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime42.jsxs)(import_jsx_runtime42.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(DialogActions, { "data-test-id": "table-model-confirm-insert", children: /* @__PURE__ */ (0, import_jsx_runtime42.jsx)(Button, { disabled: isDisabled, onClick, children: "Confirm" }) })
  ] });
}

// src/plugins/ComponentPickerPlugin/index.tsx
var import_jsx_runtime43 = require("react/jsx-runtime");
var ComponentPickerOption = class extends import_LexicalTypeaheadMenuPlugin2.MenuOption {
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
  let className = "";
  if (isSelected) {
    className = "selected";
  }
  return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(
    "li",
    {
      tabIndex: -1,
      className,
      ref: option.setRefElement,
      id: `typeahead-item-${index}`,
      onMouseEnter,
      onClick,
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      },
      children: [
        option.icon,
        /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("span", { className: "text", children: option.title })
      ]
    }
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
          icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon table" }),
          keywords: ["table"],
          onSelect: () => editor.dispatchCommand(import_table2.INSERT_TABLE_COMMAND, { columns, rows })
        })
      )
    );
  }
  return options;
}
function getBaseOptions(editor, showModal) {
  return [
    new ComponentPickerOption("Paragraph", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon paragraph" }),
      keywords: ["normal", "paragraph", "p", "text"],
      onSelect: () => editor.update(() => {
        const selection = (0, import_lexical34.$getSelection)();
        if ((0, import_lexical34.$isRangeSelection)(selection)) {
          (0, import_selection2.$setBlocksType)(selection, () => (0, import_lexical34.$createParagraphNode)());
        }
      })
    }),
    ...[1, 2, 3].map(
      (n) => new ComponentPickerOption(`Heading ${n}`, {
        icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: `icon h${n}` }),
        keywords: ["heading", "header", `h${n}`],
        onSelect: () => editor.update(() => {
          const selection = (0, import_lexical34.$getSelection)();
          if ((0, import_lexical34.$isRangeSelection)(selection)) {
            (0, import_selection2.$setBlocksType)(selection, () => (0, import_rich_text.$createHeadingNode)(`h${n}`));
          }
        })
      })
    ),
    new ComponentPickerOption("Table", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon table" }),
      keywords: ["table", "grid", "spreadsheet", "rows", "columns"],
      onSelect: () => showModal("Insert Table", (onClose) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(InsertTableDialog, { activeEditor: editor, onClose }))
    }),
    new ComponentPickerOption("Numbered List", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon number" }),
      keywords: ["numbered list", "ordered list", "ol"],
      onSelect: () => editor.dispatchCommand(import_list.INSERT_ORDERED_LIST_COMMAND, void 0)
    }),
    new ComponentPickerOption("Bulleted List", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon bullet" }),
      keywords: ["bulleted list", "unordered list", "ul"],
      onSelect: () => editor.dispatchCommand(import_list.INSERT_UNORDERED_LIST_COMMAND, void 0)
    }),
    new ComponentPickerOption("Check List", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon check" }),
      keywords: ["check list", "todo list"],
      onSelect: () => editor.dispatchCommand(import_list.INSERT_CHECK_LIST_COMMAND, void 0)
    }),
    new ComponentPickerOption("Quote", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon quote" }),
      keywords: ["block quote"],
      onSelect: () => editor.update(() => {
        const selection = (0, import_lexical34.$getSelection)();
        if ((0, import_lexical34.$isRangeSelection)(selection)) {
          (0, import_selection2.$setBlocksType)(selection, () => (0, import_rich_text.$createQuoteNode)());
        }
      })
    }),
    new ComponentPickerOption("Code", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon code" }),
      keywords: ["javascript", "python", "js", "codeblock"],
      onSelect: () => editor.update(() => {
        const selection = (0, import_lexical34.$getSelection)();
        if ((0, import_lexical34.$isRangeSelection)(selection)) {
          if (selection.isCollapsed()) {
            (0, import_selection2.$setBlocksType)(selection, () => (0, import_code6.$createCodeNode)());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = (0, import_code6.$createCodeNode)();
            selection.insertNodes([codeNode]);
            selection.insertRawText(textContent);
          }
        }
      })
    }),
    new ComponentPickerOption("Divider", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon horizontal-rule" }),
      keywords: ["horizontal rule", "divider", "hr"],
      onSelect: () => editor.dispatchCommand(import_LexicalHorizontalRuleNode.INSERT_HORIZONTAL_RULE_COMMAND, void 0)
    }),
    new ComponentPickerOption("Page Break", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon page-break" }),
      keywords: ["page break", "divider"],
      onSelect: () => editor.dispatchCommand(INSERT_PAGE_BREAK, void 0)
    }),
    ...EmbedConfigs.map(
      (embedConfig) => new ComponentPickerOption(`Embed ${embedConfig.contentName}`, {
        icon: embedConfig.icon,
        keywords: [...embedConfig.keywords, "embed"],
        onSelect: () => editor.dispatchCommand(import_LexicalAutoEmbedPlugin2.INSERT_EMBED_COMMAND, embedConfig.type)
      })
    ),
    new ComponentPickerOption("Date", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon calendar" }),
      keywords: ["date", "calendar", "time"],
      onSelect: () => {
        const dateTime = /* @__PURE__ */ new Date();
        dateTime.setHours(0, 0, 0, 0);
        editor.dispatchCommand(INSERT_DATETIME_COMMAND, { dateTime });
      }
    }),
    new ComponentPickerOption("Today", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon calendar" }),
      keywords: ["date", "calendar", "time", "today"],
      onSelect: () => {
        const dateTime = /* @__PURE__ */ new Date();
        dateTime.setHours(0, 0, 0, 0);
        editor.dispatchCommand(INSERT_DATETIME_COMMAND, { dateTime });
      }
    }),
    new ComponentPickerOption("Tomorrow", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon calendar" }),
      keywords: ["date", "calendar", "time", "tomorrow"],
      onSelect: () => {
        const dateTime = /* @__PURE__ */ new Date();
        dateTime.setDate(dateTime.getDate() + 1);
        dateTime.setHours(0, 0, 0, 0);
        editor.dispatchCommand(INSERT_DATETIME_COMMAND, { dateTime });
      }
    }),
    new ComponentPickerOption("Yesterday", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon calendar" }),
      keywords: ["date", "calendar", "time", "yesterday"],
      onSelect: () => {
        const dateTime = /* @__PURE__ */ new Date();
        dateTime.setDate(dateTime.getDate() - 1);
        dateTime.setHours(0, 0, 0, 0);
        editor.dispatchCommand(INSERT_DATETIME_COMMAND, { dateTime });
      }
    }),
    new ComponentPickerOption("Equation", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon equation" }),
      keywords: ["equation", "latex", "math"],
      onSelect: () => showModal("Insert Equation", (onClose) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(InsertEquationDialog, { activeEditor: editor, onClose }))
    }),
    new ComponentPickerOption("Image", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon image" }),
      keywords: ["image", "photo", "picture", "file"],
      onSelect: () => showModal("Insert Image", (onClose) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(InsertImageDialog, { activeEditor: editor, onClose }))
    }),
    new ComponentPickerOption("Collapsible", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon caret-right" }),
      keywords: ["collapse", "collapsible", "toggle"],
      onSelect: () => editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, void 0)
    }),
    new ComponentPickerOption("Columns Layout", {
      icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: "icon columns" }),
      keywords: ["columns", "layout", "grid"],
      onSelect: () => showModal("Insert Columns Layout", (onClose) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(InsertLayoutDialog, { activeEditor: editor, onClose }))
    }),
    ...["left", "center", "right", "justify"].map(
      (alignment) => new ComponentPickerOption(`Align ${alignment}`, {
        icon: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("i", { className: `icon ${alignment}-align` }),
        keywords: ["align", "justify", alignment],
        onSelect: () => editor.dispatchCommand(import_lexical34.FORMAT_ELEMENT_COMMAND, alignment)
      })
    )
  ];
}
function ComponentPickerMenuPlugin({
  extraOptions: propsExtraOptions
} = {}) {
  const [editor] = (0, import_LexicalComposerContext23.useLexicalComposerContext)();
  const [modal, showModal] = useModal();
  const [queryString, setQueryString] = (0, import_react46.useState)(null);
  const { extraOptions: contextExtraOptions } = useComponentPickerContext();
  const extraOptions = propsExtraOptions ?? contextExtraOptions;
  const checkForTriggerMatch = (0, import_LexicalTypeaheadMenuPlugin2.useBasicTypeaheadTriggerMatch)("/", {
    allowWhitespace: true,
    minLength: 0
  });
  const options = (0, import_react46.useMemo)(() => {
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
  const onSelectOption = (0, import_react46.useCallback)(
    (selectedOption, nodeToRemove, closeMenu, matchingString) => {
      editor.update(() => {
        nodeToRemove?.remove();
        selectedOption.onSelect(matchingString);
        closeMenu();
      });
    },
    [editor]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime43.jsxs)(import_jsx_runtime43.Fragment, { children: [
    modal,
    /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
      import_LexicalTypeaheadMenuPlugin2.LexicalTypeaheadMenuPlugin,
      {
        onQueryChange: setQueryString,
        onSelectOption,
        triggerFn: checkForTriggerMatch,
        options,
        menuRenderFn: (anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => anchorElementRef.current && options.length ? ReactDOM2.createPortal(
          /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("div", { className: "notion-like-editor typeahead-popover component-picker-menu", children: /* @__PURE__ */ (0, import_jsx_runtime43.jsx)("ul", { children: options.map((option, i) => /* @__PURE__ */ (0, import_jsx_runtime43.jsx)(
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
var import_link3 = require("@lexical/link");
var import_LexicalComposerContext24 = require("@lexical/react/LexicalComposerContext");
var import_LexicalNodeContextMenuPlugin = require("@lexical/react/LexicalNodeContextMenuPlugin");
var import_lexical35 = require("lexical");
var import_react47 = require("react");
var import_jsx_runtime44 = require("react/jsx-runtime");
function ContextMenuPlugin() {
  const [editor] = (0, import_LexicalComposerContext24.useLexicalComposerContext)();
  const items = (0, import_react47.useMemo)(() => {
    return [
      new import_LexicalNodeContextMenuPlugin.NodeContextMenuOption(`Remove Link`, {
        $onSelect: () => {
          editor.dispatchCommand(import_link3.TOGGLE_LINK_COMMAND, null);
        },
        $showOn: (node) => (0, import_link3.$isLinkNode)(node.getParent()),
        disabled: false,
        icon: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon" })
      }),
      new import_LexicalNodeContextMenuPlugin.NodeContextMenuSeparator({
        $showOn: (node) => (0, import_link3.$isLinkNode)(node.getParent())
      }),
      new import_LexicalNodeContextMenuPlugin.NodeContextMenuOption(`Cut`, {
        $onSelect: () => {
          editor.dispatchCommand(import_lexical35.CUT_COMMAND, null);
        },
        disabled: false,
        icon: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon page-break" })
      }),
      new import_LexicalNodeContextMenuPlugin.NodeContextMenuOption(`Copy`, {
        $onSelect: () => {
          editor.dispatchCommand(import_lexical35.COPY_COMMAND, null);
        },
        disabled: false,
        icon: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon copy" })
      }),
      new import_LexicalNodeContextMenuPlugin.NodeContextMenuOption(`Paste`, {
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
            editor.dispatchCommand(import_lexical35.PASTE_COMMAND, event);
          });
        },
        disabled: false,
        icon: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon paste" })
      }),
      new import_LexicalNodeContextMenuPlugin.NodeContextMenuOption(`Paste as Plain Text`, {
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
            editor.dispatchCommand(import_lexical35.PASTE_COMMAND, event);
          });
        },
        disabled: false,
        icon: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon" })
      }),
      new import_LexicalNodeContextMenuPlugin.NodeContextMenuSeparator(),
      new import_LexicalNodeContextMenuPlugin.NodeContextMenuOption(`Delete Node`, {
        $onSelect: () => {
          const selection = (0, import_lexical35.$getSelection)();
          if ((0, import_lexical35.$isRangeSelection)(selection)) {
            const currentNode = selection.anchor.getNode();
            const ancestorNodeWithRootAsParent = currentNode.getParents().at(-2);
            ancestorNodeWithRootAsParent?.remove();
          } else if ((0, import_lexical35.$isNodeSelection)(selection)) {
            const selectedNodes = selection.getNodes();
            selectedNodes.forEach((node) => {
              if ((0, import_lexical35.$isDecoratorNode)(node)) {
                node.remove();
              }
            });
          }
        },
        disabled: false,
        icon: /* @__PURE__ */ (0, import_jsx_runtime44.jsx)("i", { className: "NotionLikeEditorTheme__contextMenuItemIcon clear" })
      })
    ];
  }, [editor]);
  return /* @__PURE__ */ (0, import_jsx_runtime44.jsx)(
    import_LexicalNodeContextMenuPlugin.NodeContextMenuPlugin,
    {
      className: "NotionLikeEditorTheme__contextMenu",
      itemClassName: "NotionLikeEditorTheme__contextMenuItem",
      separatorClassName: "NotionLikeEditorTheme__contextMenuSeparator",
      items
    }
  );
}

// src/plugins/DragDropPastePlugin/index.ts
var import_LexicalComposerContext25 = require("@lexical/react/LexicalComposerContext");
var import_rich_text2 = require("@lexical/rich-text");
var import_utils23 = require("@lexical/utils");
var import_lexical36 = require("lexical");
var import_react48 = require("react");
var ACCEPTABLE_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
function DragDropPaste() {
  const [editor] = (0, import_LexicalComposerContext25.useLexicalComposerContext)();
  const imageUploadHandler = useImageUpload();
  (0, import_react48.useEffect)(() => {
    return editor.registerCommand(
      import_rich_text2.DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await (0, import_utils23.mediaFileReader)(files, [ACCEPTABLE_IMAGE_TYPES].flat());
          for (const { file, result } of filesResult) {
            if ((0, import_utils23.isMimeType)(file, ACCEPTABLE_IMAGE_TYPES)) {
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
      import_lexical36.COMMAND_PRIORITY_LOW
    );
  }, [editor, imageUploadHandler]);
  return null;
}

// src/plugins/DraggableBlockPlugin/index.tsx
var import_LexicalComposerContext26 = require("@lexical/react/LexicalComposerContext");
var import_rich_text3 = require("@lexical/rich-text");
var import_utils24 = require("@lexical/utils");
var import_lexical37 = require("lexical");
var import_react49 = require("react");
var import_react_dom5 = require("react-dom");

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
var import_jsx_runtime45 = require("react/jsx-runtime");
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
  return editor.getEditorState().read(() => (0, import_lexical37.$getRoot)().getChildrenKeys());
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
        const firstNodeZoom = (0, import_utils24.calculateZoomLevel)(firstNode);
        const lastNodeZoom = (0, import_utils24.calculateZoomLevel)(lastNode);
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
      const zoom = (0, import_utils24.calculateZoomLevel)(elem);
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
  const isDraggingBlockRef = (0, import_react49.useRef)(false);
  const [draggableBlockElem, setDraggableBlockElemState] = (0, import_react49.useState)(null);
  const setDraggableBlockElem = (0, import_react49.useCallback)(
    (elem) => {
      setDraggableBlockElemState(elem);
      if (onElementChanged) {
        onElementChanged(elem);
      }
    },
    [onElementChanged]
  );
  (0, import_react49.useEffect)(() => {
    function onMouseMove(event) {
      const target = event.target;
      if (!(0, import_utils24.isHTMLElement)(target)) {
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
  (0, import_react49.useEffect)(() => {
    if (menuRef.current) {
      setMenuPosition(draggableBlockElem, menuRef.current, anchorElem);
    }
  }, [anchorElem, draggableBlockElem, menuRef]);
  (0, import_react49.useEffect)(() => {
    function onDragover(event) {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = (0, import_rich_text3.eventFiles)(event);
      if (isFileTransfer) {
        return false;
      }
      const { pageY, target } = event;
      if (!(0, import_utils24.isHTMLElement)(target)) {
        return false;
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      const targetLineElem = targetLineRef.current;
      if (targetBlockElem === null || targetLineElem === null) {
        return false;
      }
      setTargetLine(targetLineElem, targetBlockElem, pageY / (0, import_utils24.calculateZoomLevel)(target), anchorElem);
      event.preventDefault();
      return true;
    }
    function $onDrop2(event) {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = (0, import_rich_text3.eventFiles)(event);
      if (isFileTransfer) {
        return false;
      }
      const { target, dataTransfer, pageY } = event;
      const dragData = dataTransfer != null ? dataTransfer.getData(DRAG_DATA_FORMAT) : "";
      const draggedNode = (0, import_lexical37.$getNodeByKey)(dragData);
      if (!draggedNode) {
        return false;
      }
      if (!(0, import_utils24.isHTMLElement)(target)) {
        return false;
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      if (!targetBlockElem) {
        return false;
      }
      const targetNode = (0, import_lexical37.$getNearestNodeFromDOMNode)(targetBlockElem);
      if (!targetNode) {
        return false;
      }
      if (targetNode === draggedNode) {
        return true;
      }
      const targetBlockElemTop = targetBlockElem.getBoundingClientRect().top;
      if (pageY / (0, import_utils24.calculateZoomLevel)(target) >= targetBlockElemTop) {
        targetNode.insertAfter(draggedNode);
      } else {
        targetNode.insertBefore(draggedNode);
      }
      setDraggableBlockElem(null);
      return true;
    }
    return (0, import_utils24.mergeRegister)(
      editor.registerCommand(
        import_lexical37.DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event);
        },
        import_lexical37.COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        import_lexical37.DROP_COMMAND,
        (event) => {
          return $onDrop2(event);
        },
        import_lexical37.COMMAND_PRIORITY_HIGH
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
      const node = (0, import_lexical37.$getNearestNodeFromDOMNode)(draggableBlockElem);
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
  return (0, import_react_dom5.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)(import_jsx_runtime45.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { draggable: true, onDragStart, onDragEnd, children: isEditable && menuComponent }),
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
  const [editor] = (0, import_LexicalComposerContext26.useLexicalComposerContext)();
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
  const [editor] = (0, import_LexicalComposerContext26.useLexicalComposerContext)();
  const menuRef = (0, import_react49.useRef)(null);
  const targetLineRef = (0, import_react49.useRef)(null);
  const [draggableElement, setDraggableElement] = (0, import_react49.useState)(null);
  function insertBlock(e) {
    if (!draggableElement || !editor) {
      return;
    }
    editor.update(() => {
      const node = (0, import_lexical37.$getNearestNodeFromDOMNode)(draggableElement);
      if (!node) {
        return;
      }
      const pNode = (0, import_lexical37.$createParagraphNode)();
      if (e.altKey || e.ctrlKey) {
        node.insertBefore(pNode);
      } else {
        node.insertAfter(pNode);
      }
      pNode.select();
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime45.jsx)(
    DraggableBlockPlugin_EXPERIMENTAL,
    {
      anchorElem,
      menuRef,
      targetLineRef,
      menuComponent: /* @__PURE__ */ (0, import_jsx_runtime45.jsxs)("div", { ref: menuRef, className: "icon draggable-block-menu", children: [
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("button", { type: "button", title: "Click to add below", className: "icon icon-plus", onClick: insertBlock }),
        /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { className: "icon" })
      ] }),
      targetLineComponent: /* @__PURE__ */ (0, import_jsx_runtime45.jsx)("div", { ref: targetLineRef, className: "draggable-block-target-line" }),
      isOnMenu,
      onElementChanged: setDraggableElement
    }
  );
}

// src/plugins/EmojiPickerPlugin/index.tsx
var import_LexicalComposerContext27 = require("@lexical/react/LexicalComposerContext");
var import_lexical38 = require("lexical");
var import_react50 = require("react");
init_EmojiNode();
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
  (0, import_react50.useEffect)(() => {
    if (!editor.hasNodes([EmojiNode])) {
      throw new Error("EmojisPlugin: EmojiNode not registered on editor");
    }
    return editor.registerNodeTransform(import_lexical38.TextNode, $textNodeTransform2);
  }, [editor]);
}
function EmojisPlugin2() {
  const [editor] = (0, import_LexicalComposerContext27.useLexicalComposerContext)();
  useEmojis2(editor);
  return null;
}

// src/core/Editor.tsx
init_EmojisPlugin();

// src/plugins/FloatingLinkEditorPlugin/index.tsx
var import_link4 = require("@lexical/link");
var import_LexicalComposerContext28 = require("@lexical/react/LexicalComposerContext");
var import_utils25 = require("@lexical/utils");
var import_lexical39 = require("lexical");
var import_react51 = require("react");
var import_react_dom6 = require("react-dom");

// src/utils/getSelectedNode.ts
var import_selection3 = require("@lexical/selection");
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
    return (0, import_selection3.$isAtNodeEnd)(focus) ? anchorNode : focusNode;
  } else {
    return (0, import_selection3.$isAtNodeEnd)(anchor) ? anchorNode : focusNode;
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
var import_jsx_runtime46 = require("react/jsx-runtime");
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
  const editorRef = (0, import_react51.useRef)(null);
  const inputRef = (0, import_react51.useRef)(null);
  const [linkUrl, setLinkUrl] = (0, import_react51.useState)("");
  const [editedLinkUrl, setEditedLinkUrl] = (0, import_react51.useState)("https://");
  const [lastSelection, setLastSelection] = (0, import_react51.useState)(null);
  const $updateLinkEditor = (0, import_react51.useCallback)(() => {
    const selection = (0, import_lexical39.$getSelection)();
    if ((0, import_lexical39.$isRangeSelection)(selection)) {
      const node = getSelectedNode(selection);
      const linkParent = (0, import_utils25.$findMatchingParent)(node, import_link4.$isLinkNode);
      if (linkParent) {
        setLinkUrl(linkParent.getURL());
      } else if ((0, import_link4.$isLinkNode)(node)) {
        setLinkUrl(node.getURL());
      } else {
        setLinkUrl("");
      }
      if (isLinkEditMode) {
        setEditedLinkUrl(linkUrl);
      }
    } else if ((0, import_lexical39.$isNodeSelection)(selection)) {
      const nodes = selection.getNodes();
      if (nodes.length > 0) {
        const node = nodes[0];
        const parent = node.getParent();
        if ((0, import_link4.$isLinkNode)(parent)) {
          setLinkUrl(parent.getURL());
        } else if ((0, import_link4.$isLinkNode)(node)) {
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
    const nativeSelection = (0, import_lexical39.getDOMSelection)(editor._window);
    const activeElement = document.activeElement;
    if (editorElem === null) {
      return;
    }
    const rootElement = editor.getRootElement();
    if (selection !== null && rootElement !== null && editor.isEditable()) {
      let domRect;
      if ((0, import_lexical39.$isNodeSelection)(selection)) {
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
  (0, import_react51.useEffect)(() => {
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
  (0, import_react51.useEffect)(() => {
    return (0, import_utils25.mergeRegister)(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateLinkEditor();
        });
      }),
      editor.registerCommand(
        import_lexical39.SELECTION_CHANGE_COMMAND,
        () => {
          $updateLinkEditor();
          return true;
        },
        import_lexical39.COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        import_lexical39.KEY_ESCAPE_COMMAND,
        () => {
          if (isLink) {
            setIsLink(false);
            return true;
          }
          return false;
        },
        import_lexical39.COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor, $updateLinkEditor, setIsLink, isLink]);
  (0, import_react51.useEffect)(() => {
    editor.getEditorState().read(() => {
      $updateLinkEditor();
    });
  }, [editor, $updateLinkEditor]);
  (0, import_react51.useEffect)(() => {
    if (isLinkEditMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLinkEditMode]);
  (0, import_react51.useEffect)(() => {
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
          editor.dispatchCommand(import_link4.TOGGLE_LINK_COMMAND, sanitizeUrl(editedLinkUrl));
          const selection = (0, import_lexical39.$getSelection)();
          if ((0, import_lexical39.$isRangeSelection)(selection)) {
            const parent = getSelectedNode(selection).getParent();
            if ((0, import_link4.$isAutoLinkNode)(parent)) {
              const linkNode = (0, import_link4.$createLinkNode)(parent.getURL(), {
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
  return /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("div", { ref: editorRef, className: "notion-like-editor link-editor", children: !isLink ? null : isLinkEditMode ? /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)(import_jsx_runtime46.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
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
  ] }) : /* @__PURE__ */ (0, import_jsx_runtime46.jsxs)("div", { className: "link-view", children: [
    /* @__PURE__ */ (0, import_jsx_runtime46.jsx)("a", { href: sanitizeUrl(linkUrl), target: "_blank", rel: "noopener noreferrer", children: linkUrl }),
    /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
      "button",
      {
        type: "button",
        className: "link-trash",
        tabIndex: 0,
        onMouseDown: preventDefault,
        onClick: () => {
          editor.dispatchCommand(import_link4.TOGGLE_LINK_COMMAND, null);
        }
      }
    )
  ] }) });
}
function useFloatingLinkEditorToolbar(editor, anchorElem, isLinkEditMode, setIsLinkEditMode) {
  const [activeEditor, setActiveEditor] = (0, import_react51.useState)(editor);
  const [isLink, setIsLink] = (0, import_react51.useState)(false);
  (0, import_react51.useEffect)(() => {
    function $updateToolbar() {
      const selection = (0, import_lexical39.$getSelection)();
      if ((0, import_lexical39.$isRangeSelection)(selection)) {
        const focusNode = getSelectedNode(selection);
        const focusLinkNode = (0, import_utils25.$findMatchingParent)(focusNode, import_link4.$isLinkNode);
        const focusAutoLinkNode = (0, import_utils25.$findMatchingParent)(focusNode, import_link4.$isAutoLinkNode);
        if (!(focusLinkNode || focusAutoLinkNode)) {
          setIsLink(false);
          return;
        }
        const badNode = selection.getNodes().filter((node) => !(0, import_lexical39.$isLineBreakNode)(node)).find((node) => {
          const linkNode = (0, import_utils25.$findMatchingParent)(node, import_link4.$isLinkNode);
          const autoLinkNode = (0, import_utils25.$findMatchingParent)(node, import_link4.$isAutoLinkNode);
          return focusLinkNode && !focusLinkNode.is(linkNode) || linkNode && !linkNode.is(focusLinkNode) || focusAutoLinkNode && !focusAutoLinkNode.is(autoLinkNode) || autoLinkNode && (!autoLinkNode.is(focusAutoLinkNode) || autoLinkNode.getIsUnlinked());
        });
        if (!badNode) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }
      } else if ((0, import_lexical39.$isNodeSelection)(selection)) {
        const nodes = selection.getNodes();
        if (nodes.length === 0) {
          setIsLink(false);
          return;
        }
        const node = nodes[0];
        const parent = node.getParent();
        if ((0, import_link4.$isLinkNode)(parent) || (0, import_link4.$isLinkNode)(node)) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }
      }
    }
    return (0, import_utils25.mergeRegister)(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        import_lexical39.SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          $updateToolbar();
          setActiveEditor(newEditor);
          return false;
        },
        import_lexical39.COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        import_lexical39.CLICK_COMMAND,
        (payload) => {
          const selection = (0, import_lexical39.$getSelection)();
          if ((0, import_lexical39.$isRangeSelection)(selection)) {
            const node = getSelectedNode(selection);
            const linkNode = (0, import_utils25.$findMatchingParent)(node, import_link4.$isLinkNode);
            if ((0, import_link4.$isLinkNode)(linkNode) && (payload.metaKey || payload.ctrlKey)) {
              window.open(linkNode.getURL(), "_blank");
              return true;
            }
          }
          return false;
        },
        import_lexical39.COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);
  return (0, import_react_dom6.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime46.jsx)(
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
  const [editor] = (0, import_LexicalComposerContext28.useLexicalComposerContext)();
  return useFloatingLinkEditorToolbar(editor, anchorElem, isLinkEditMode, setIsLinkEditMode);
}

// src/plugins/FloatingTextFormatToolbarPlugin/index.tsx
var import_code7 = require("@lexical/code");
var import_link5 = require("@lexical/link");
var import_LexicalComposerContext29 = require("@lexical/react/LexicalComposerContext");
var import_selection4 = require("@lexical/selection");
var import_utils27 = require("@lexical/utils");
var import_lexical40 = require("lexical");
var import_react53 = require("react");
var import_react_dom7 = require("react-dom");

// src/ui/ColorPicker.tsx
var import_utils26 = require("@lexical/utils");
var import_react52 = require("react");
var import_jsx_runtime47 = require("react/jsx-runtime");
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
  const [selfColor, setSelfColor] = (0, import_react52.useState)(transformColor("hex", color));
  const [inputColor, setInputColor] = (0, import_react52.useState)(transformColor("hex", color).hex);
  const innerDivRef = (0, import_react52.useRef)(null);
  const saturationPosition = (0, import_react52.useMemo)(
    () => ({
      x: selfColor.hsv.s / 100 * WIDTH,
      y: (100 - selfColor.hsv.v) / 100 * HEIGHT
    }),
    [selfColor.hsv.s, selfColor.hsv.v]
  );
  const huePosition = (0, import_react52.useMemo)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsxs)("div", { className: "color-picker-wrapper", style: { width: WIDTH }, ref: innerDivRef, children: [
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(TextInput, { label: "Hex", onChange: onSetHex, value: inputColor }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { className: "color-picker-basic-color", children: basicColors.map((basicColor) => /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
      "button",
      {
        type: "button",
        className: basicColor === selfColor.hex ? " active" : "",
        style: { backgroundColor: basicColor },
        onClick: (e) => onBasicColorClick(e, basicColor)
      },
      basicColor
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
      MoveWrapper,
      {
        className: "color-picker-saturation",
        style: { backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)` },
        onChange: onMoveSaturation,
        children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(MoveWrapper, { className: "color-picker-hue", onChange: onMoveHue, children: /* @__PURE__ */ (0, import_jsx_runtime47.jsx)(
      "div",
      {
        className: "color-picker-hue_cursor",
        style: {
          backgroundColor: `hsl(${selfColor.hsv.h}, 100%, 50%)`,
          left: huePosition.x
        }
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { className: "color-picker-color", style: { backgroundColor: selfColor.hex } })
  ] });
}
function MoveWrapper({ className, style, onChange, children }) {
  const divRef = (0, import_react52.useRef)(null);
  const draggedRef = (0, import_react52.useRef)(false);
  const move = (e) => {
    if (divRef.current) {
      const { current: div } = divRef;
      const { width, height, left, top } = div.getBoundingClientRect();
      const zoom = (0, import_utils26.calculateZoomLevel)(div);
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
  return /* @__PURE__ */ (0, import_jsx_runtime47.jsx)("div", { ref: divRef, className, style, onMouseDown, children });
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
var import_jsx_runtime48 = require("react/jsx-runtime");
function DropdownColorPicker({
  disabled = false,
  stopCloseOnClickSelf = true,
  color,
  onChange,
  ...rest
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(DropDown, { ...rest, disabled, stopCloseOnClickSelf, children: /* @__PURE__ */ (0, import_jsx_runtime48.jsx)(ColorPicker, { color, onChange }) });
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
var import_jsx_runtime49 = require("react/jsx-runtime");
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
  const popupCharStylesEditorRef = (0, import_react53.useRef)(null);
  const insertLink = (0, import_react53.useCallback)(() => {
    if (!isLink) {
      setIsLinkEditMode(true);
      editor.dispatchCommand(import_link5.TOGGLE_LINK_COMMAND, "https://");
    } else {
      setIsLinkEditMode(false);
      editor.dispatchCommand(import_link5.TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink, setIsLinkEditMode]);
  const applyStyleText = (0, import_react53.useCallback)(
    (styles) => {
      editor.update(() => {
        const selection = (0, import_lexical40.$getSelection)();
        if (selection !== null) {
          (0, import_selection4.$patchStyleText)(selection, styles);
        }
      });
    },
    [editor]
  );
  const onFontColorSelect = (0, import_react53.useCallback)(
    (value) => {
      applyStyleText({ color: value });
    },
    [applyStyleText]
  );
  const onBgColorSelect = (0, import_react53.useCallback)(
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
  (0, import_react53.useEffect)(() => {
    if (popupCharStylesEditorRef?.current) {
      document.addEventListener("mousemove", mouseMoveListener);
      document.addEventListener("mouseup", mouseUpListener);
      return () => {
        document.removeEventListener("mousemove", mouseMoveListener);
        document.removeEventListener("mouseup", mouseUpListener);
      };
    }
  }, [mouseMoveListener, mouseUpListener]);
  const $updateTextFormatFloatingToolbar = (0, import_react53.useCallback)(() => {
    const selection = (0, import_lexical40.$getSelection)();
    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    const nativeSelection = (0, import_lexical40.getDOMSelection)(editor._window);
    if (popupCharStylesEditorElem === null) {
      return;
    }
    const rootElement = editor.getRootElement();
    if (selection !== null && nativeSelection !== null && !nativeSelection.isCollapsed && rootElement !== null && rootElement.contains(nativeSelection.anchorNode)) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement);
      setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem, isLink);
    }
  }, [editor, anchorElem, isLink]);
  (0, import_react53.useEffect)(() => {
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
  (0, import_react53.useEffect)(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar();
    });
    return (0, import_utils27.mergeRegister)(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }),
      editor.registerCommand(
        import_lexical40.SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar();
          return false;
        },
        import_lexical40.COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, $updateTextFormatFloatingToolbar]);
  return /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("div", { ref: popupCharStylesEditorRef, className: "notion-like-editor floating-text-format-popup", children: editor.isEditable() && /* @__PURE__ */ (0, import_jsx_runtime49.jsxs)(import_jsx_runtime49.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "bold");
        },
        className: `popup-item spaced ${isBold ? "active" : ""}`,
        title: "Bold",
        "aria-label": "Format text as bold",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format bold" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "italic");
        },
        className: `popup-item spaced ${isItalic ? "active" : ""}`,
        title: "Italic",
        "aria-label": "Format text as italics",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format italic" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "underline");
        },
        className: `popup-item spaced ${isUnderline ? "active" : ""}`,
        title: "Underline",
        "aria-label": "Format text to underlined",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format underline" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "strikethrough");
        },
        className: `popup-item spaced ${isStrikethrough ? "active" : ""}`,
        title: "Strikethrough",
        "aria-label": "Format text with a strikethrough",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format strikethrough" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "subscript");
        },
        className: `popup-item spaced ${isSubscript2 ? "active" : ""}`,
        title: "Subscript",
        "aria-label": "Format Subscript",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format subscript" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "superscript");
        },
        className: `popup-item spaced ${isSuperscript2 ? "active" : ""}`,
        title: "Superscript",
        "aria-label": "Format Superscript",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format superscript" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "uppercase");
        },
        className: `popup-item spaced ${isUppercase2 ? "active" : ""}`,
        title: "Uppercase",
        "aria-label": "Format text to uppercase",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format uppercase" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "lowercase");
        },
        className: `popup-item spaced ${isLowercase2 ? "active" : ""}`,
        title: "Lowercase",
        "aria-label": "Format text to lowercase",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format lowercase" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "capitalize");
        },
        className: `popup-item spaced ${isCapitalize2 ? "active" : ""}`,
        title: "Capitalize",
        "aria-label": "Format text to capitalize",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format capitalize" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: () => {
          editor.dispatchCommand(import_lexical40.FORMAT_TEXT_COMMAND, "code");
        },
        className: `popup-item spaced ${isCode ? "active" : ""}`,
        title: "Insert code block",
        "aria-label": "Insert code block",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format code" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
      "button",
      {
        type: "button",
        onClick: insertLink,
        className: `popup-item spaced ${isLink ? "active" : ""}`,
        title: "Insert link",
        "aria-label": "Insert link",
        children: /* @__PURE__ */ (0, import_jsx_runtime49.jsx)("i", { className: "format link" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
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
  const [isText, setIsText] = (0, import_react53.useState)(false);
  const [isLink, setIsLink] = (0, import_react53.useState)(false);
  const [isBold, setIsBold] = (0, import_react53.useState)(false);
  const [isItalic, setIsItalic] = (0, import_react53.useState)(false);
  const [isUnderline, setIsUnderline] = (0, import_react53.useState)(false);
  const [isUppercase2, setIsUppercase] = (0, import_react53.useState)(false);
  const [isLowercase2, setIsLowercase] = (0, import_react53.useState)(false);
  const [isCapitalize2, setIsCapitalize] = (0, import_react53.useState)(false);
  const [isStrikethrough, setIsStrikethrough] = (0, import_react53.useState)(false);
  const [isSubscript2, setIsSubscript] = (0, import_react53.useState)(false);
  const [isSuperscript2, setIsSuperscript] = (0, import_react53.useState)(false);
  const [isCode, setIsCode] = (0, import_react53.useState)(false);
  const [fontColor, setFontColor] = (0, import_react53.useState)("#000");
  const [bgColor, setBgColor] = (0, import_react53.useState)("#fff");
  const updatePopup = (0, import_react53.useCallback)(() => {
    editor.getEditorState().read(() => {
      if (editor.isComposing()) {
        return;
      }
      const selection = (0, import_lexical40.$getSelection)();
      const nativeSelection = (0, import_lexical40.getDOMSelection)(editor._window);
      const rootElement = editor.getRootElement();
      if (nativeSelection !== null && (!(0, import_lexical40.$isRangeSelection)(selection) || rootElement === null || !rootElement.contains(nativeSelection.anchorNode))) {
        setIsText(false);
        return;
      }
      if (!(0, import_lexical40.$isRangeSelection)(selection)) {
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
      if ((0, import_link5.$isLinkNode)(parent) || (0, import_link5.$isLinkNode)(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
      setFontColor((0, import_selection4.$getSelectionStyleValueForProperty)(selection, "color", "#000"));
      setBgColor((0, import_selection4.$getSelectionStyleValueForProperty)(selection, "background-color", "#fff"));
      if (!(0, import_code7.$isCodeHighlightNode)(selection.anchor.getNode()) && selection.getTextContent() !== "") {
        setIsText((0, import_lexical40.$isTextNode)(node) || (0, import_lexical40.$isParagraphNode)(node));
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
  (0, import_react53.useEffect)(() => {
    document.addEventListener("selectionchange", updatePopup);
    return () => {
      document.removeEventListener("selectionchange", updatePopup);
    };
  }, [updatePopup]);
  (0, import_react53.useEffect)(() => {
    return (0, import_utils27.mergeRegister)(
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
  return (0, import_react_dom7.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime49.jsx)(
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
  const [editor] = (0, import_LexicalComposerContext29.useLexicalComposerContext)();
  return useFloatingTextFormatToolbar(editor, anchorElem, setIsLinkEditMode);
}

// src/plugins/FragmentLinkPlugin/index.tsx
var import_LexicalComposerContext30 = require("@lexical/react/LexicalComposerContext");
var import_rich_text4 = require("@lexical/rich-text");
var import_lexical41 = require("lexical");
var import_react54 = require("react");
function generateSlug(text) {
  return text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function normalizeText(text) {
  return text.toLowerCase().trim();
}
function FragmentLinkPlugin() {
  const [editor] = (0, import_LexicalComposerContext30.useLexicalComposerContext)();
  (0, import_react54.useEffect)(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) {
      return;
    }
    const handleClick = (event) => {
      const target = event.target;
      const anchor = target.closest("a");
      if (!anchor) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const targetFragment = decodeURIComponent(href.slice(1));
      const targetSlug = generateSlug(targetFragment);
      const targetNormalized = normalizeText(targetFragment);
      editor.getEditorState().read(() => {
        const root = (0, import_lexical41.$getRoot)();
        for (const child of root.getChildren()) {
          if ((0, import_rich_text4.$isHeadingNode)(child)) {
            const headingText = child.getTextContent();
            const headingSlug = generateSlug(headingText);
            const headingNormalized = normalizeText(headingText);
            if (headingSlug === targetSlug || headingNormalized === targetNormalized || headingNormalized.includes(targetNormalized) || targetNormalized.includes(headingNormalized)) {
              const domElement = editor.getElementByKey(child.getKey());
              if (domElement) {
                domElement.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
              }
            }
          }
        }
      });
    };
    rootElement.addEventListener("click", handleClick, true);
    return () => {
      rootElement.removeEventListener("click", handleClick, true);
    };
  }, [editor]);
  return null;
}

// src/plugins/HorizontalRulePlugin/index.tsx
var import_extension = require("@lexical/extension");
var import_LexicalComposerContext31 = require("@lexical/react/LexicalComposerContext");
var import_utils28 = require("@lexical/utils");
var import_lexical42 = require("lexical");
var import_react55 = require("react");
function HorizontalRulePlugin() {
  const [editor] = (0, import_LexicalComposerContext31.useLexicalComposerContext)();
  (0, import_react55.useEffect)(() => {
    return editor.registerCommand(
      import_extension.INSERT_HORIZONTAL_RULE_COMMAND,
      (_type) => {
        const selection = (0, import_lexical42.$getSelection)();
        if (!(0, import_lexical42.$isRangeSelection)(selection)) {
          return false;
        }
        const focusNode = selection.focus.getNode();
        if (focusNode !== null) {
          const horizontalRuleNode = (0, import_extension.$createHorizontalRuleNode)();
          (0, import_utils28.$insertNodeToNearestRoot)(horizontalRuleNode);
        }
        return true;
      },
      import_lexical42.COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

// src/core/Editor.tsx
init_LinkPlugin();

// src/plugins/MarkdownPastePlugin/index.tsx
var import_markdown3 = require("@lexical/markdown");
var import_LexicalComposerContext32 = require("@lexical/react/LexicalComposerContext");
var import_lexical45 = require("lexical");
var import_react56 = require("react");

// src/transformers/markdown-transformers.ts
var import_extension2 = require("@lexical/extension");
var import_markdown = require("@lexical/markdown");
var import_table3 = require("@lexical/table");
var import_lexical43 = require("lexical");
init_EquationNode();
init_ImageNode2();

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

// src/transformers/markdown-transformers.ts
var HR = {
  dependencies: [import_extension2.HorizontalRuleNode],
  export: (node) => {
    return (0, import_extension2.$isHorizontalRuleNode)(node) ? "***" : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = (0, import_extension2.$createHorizontalRuleNode)();
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
      textNode.replace((0, import_lexical43.$createTextNode)(emoji));
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
  dependencies: [import_table3.TableNode, import_table3.TableRowNode, import_table3.TableCellNode],
  export: (node) => {
    if (!(0, import_table3.$isTableNode)(node)) {
      return null;
    }
    const output = [];
    for (const row of node.getChildren()) {
      const rowOutput = [];
      if (!(0, import_table3.$isTableRowNode)(row)) {
        continue;
      }
      let isHeaderRow = false;
      for (const cell of row.getChildren()) {
        if ((0, import_table3.$isTableCellNode)(cell)) {
          rowOutput.push((0, import_markdown.$convertToMarkdownString)(PLAYGROUND_TRANSFORMERS, cell).replace(/\n/g, "\\n").trim());
          if (cell.__headerState === import_table3.TableCellHeaderStates.ROW) {
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
      if (!table2 || !(0, import_table3.$isTableNode)(table2)) {
        return;
      }
      const rows2 = table2.getChildren();
      const lastRow = rows2[rows2.length - 1];
      if (!lastRow || !(0, import_table3.$isTableRowNode)(lastRow)) {
        return;
      }
      lastRow.getChildren().forEach((cell) => {
        if (!(0, import_table3.$isTableCellNode)(cell)) {
          return;
        }
        cell.setHeaderStyles(import_table3.TableCellHeaderStates.ROW, import_table3.TableCellHeaderStates.ROW);
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
      if (!(0, import_lexical43.$isParagraphNode)(sibling)) {
        break;
      }
      if (sibling.getChildrenSize() !== 1) {
        break;
      }
      const firstChild = sibling.getFirstChild();
      if (!(0, import_lexical43.$isTextNode)(firstChild)) {
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
    const table = (0, import_table3.$createTableNode)();
    for (const cells of rows) {
      const tableRow = (0, import_table3.$createTableRowNode)();
      table.append(tableRow);
      for (let i = 0; i < maxCells; i++) {
        tableRow.append(i < cells.length ? cells[i] : $createTableCell(""));
      }
    }
    const previousSibling = parentNode.getPreviousSibling();
    if ((0, import_table3.$isTableNode)(previousSibling) && getTableColumnsSize(previousSibling) === maxCells) {
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
  return (0, import_table3.$isTableRowNode)(row) ? row.getChildrenSize() : 0;
}
var $createTableCell = (textContent) => {
  textContent = textContent.replace(/\\n/g, "\n");
  const cell = (0, import_table3.$createTableCellNode)(import_table3.TableCellHeaderStates.NO_STATUS);
  (0, import_markdown.$convertFromMarkdownString)(textContent, PLAYGROUND_TRANSFORMERS, cell);
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
  import_markdown.CHECK_LIST,
  ...import_markdown.ELEMENT_TRANSFORMERS,
  ...import_markdown.MULTILINE_ELEMENT_TRANSFORMERS,
  ...import_markdown.TEXT_FORMAT_TRANSFORMERS,
  ...import_markdown.TEXT_MATCH_TRANSFORMERS
];
function normalizeListIndentation(markdown) {
  const normalizedMarkdown = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedMarkdown.split("\n");
  const result = [];
  let inCodeBlock = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }
    if (inCodeBlock) {
      result.push(line);
      continue;
    }
    const listMatch = line.match(/^(\s+)([-*+]|\d+\.)(\s+\[[ xX]?\])?\s/);
    if (listMatch) {
      const leadingSpaces = listMatch[1];
      const spaceCount = (leadingSpaces.match(/ /g) || []).length;
      const tabCount = (leadingSpaces.match(/\t/g) || []).length;
      if (spaceCount > 0 && spaceCount % 2 === 0 && spaceCount % 4 !== 0) {
        const indentLevel = Math.ceil(spaceCount / 2);
        const newIndent = "	".repeat(tabCount) + "    ".repeat(indentLevel);
        result.push(newIndent + line.slice(leadingSpaces.length));
        continue;
      }
    }
    result.push(line);
  }
  return result.join("\n");
}

// src/plugins/MarkdownTransformers/index.ts
var import_extension3 = require("@lexical/extension");
var import_markdown2 = require("@lexical/markdown");
var import_table4 = require("@lexical/table");
var import_lexical44 = require("lexical");
init_EquationNode();
init_ImageNode2();
var HR2 = {
  dependencies: [import_extension3.HorizontalRuleNode],
  export: (node) => {
    return (0, import_extension3.$isHorizontalRuleNode)(node) ? "***" : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = (0, import_extension3.$createHorizontalRuleNode)();
    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }
    line.selectNext();
  },
  type: "element"
};
var IMAGE2 = {
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
var EMOJI2 = {
  dependencies: [],
  export: () => null,
  importRegExp: /:([a-z0-9_]+):/,
  regExp: /:([a-z0-9_]+):$/,
  replace: (textNode, [, name]) => {
    const emoji = emoji_list_default.find((e) => e.aliases.includes(name))?.emoji;
    if (emoji) {
      textNode.replace((0, import_lexical44.$createTextNode)(emoji));
    }
  },
  trigger: ":",
  type: "text-match"
};
var EQUATION2 = {
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
var TWEET2 = {
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
var TABLE_ROW_REG_EXP2 = /^(?:\|)(.+)(?:\|)\s?$/;
var TABLE_ROW_DIVIDER_REG_EXP2 = /^(\| ?:?-*:? ?)+\|\s?$/;
var TABLE2 = {
  dependencies: [import_table4.TableNode, import_table4.TableRowNode, import_table4.TableCellNode],
  export: (node) => {
    if (!(0, import_table4.$isTableNode)(node)) {
      return null;
    }
    const output = [];
    for (const row of node.getChildren()) {
      const rowOutput = [];
      if (!(0, import_table4.$isTableRowNode)(row)) {
        continue;
      }
      let isHeaderRow = false;
      for (const cell of row.getChildren()) {
        if ((0, import_table4.$isTableCellNode)(cell)) {
          rowOutput.push((0, import_markdown2.$convertToMarkdownString)(PLAYGROUND_TRANSFORMERS2, cell).replace(/\n/g, "\\n").trim());
          if (cell.__headerState === import_table4.TableCellHeaderStates.ROW) {
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
  regExp: TABLE_ROW_REG_EXP2,
  replace: (parentNode, _1, match) => {
    if (TABLE_ROW_DIVIDER_REG_EXP2.test(match[0])) {
      const table2 = parentNode.getPreviousSibling();
      if (!table2 || !(0, import_table4.$isTableNode)(table2)) {
        return;
      }
      const rows2 = table2.getChildren();
      const lastRow = rows2[rows2.length - 1];
      if (!lastRow || !(0, import_table4.$isTableRowNode)(lastRow)) {
        return;
      }
      lastRow.getChildren().forEach((cell) => {
        if (!(0, import_table4.$isTableCellNode)(cell)) {
          return;
        }
        cell.setHeaderStyles(import_table4.TableCellHeaderStates.ROW, import_table4.TableCellHeaderStates.ROW);
      });
      parentNode.remove();
      return;
    }
    const matchCells = mapToTableCells2(match[0]);
    if (matchCells == null) {
      return;
    }
    const rows = [matchCells];
    let sibling = parentNode.getPreviousSibling();
    let maxCells = matchCells.length;
    while (sibling) {
      if (!(0, import_lexical44.$isParagraphNode)(sibling)) {
        break;
      }
      if (sibling.getChildrenSize() !== 1) {
        break;
      }
      const firstChild = sibling.getFirstChild();
      if (!(0, import_lexical44.$isTextNode)(firstChild)) {
        break;
      }
      const cells = mapToTableCells2(firstChild.getTextContent());
      if (cells == null) {
        break;
      }
      maxCells = Math.max(maxCells, cells.length);
      rows.unshift(cells);
      const previousSibling2 = sibling.getPreviousSibling();
      sibling.remove();
      sibling = previousSibling2;
    }
    const table = (0, import_table4.$createTableNode)();
    for (const cells of rows) {
      const tableRow = (0, import_table4.$createTableRowNode)();
      table.append(tableRow);
      for (let i = 0; i < maxCells; i++) {
        tableRow.append(i < cells.length ? cells[i] : $createTableCell2(""));
      }
    }
    const previousSibling = parentNode.getPreviousSibling();
    if ((0, import_table4.$isTableNode)(previousSibling) && getTableColumnsSize2(previousSibling) === maxCells) {
      previousSibling.append(...table.getChildren());
      parentNode.remove();
    } else {
      parentNode.replace(table);
    }
    table.selectEnd();
  },
  type: "element"
};
function getTableColumnsSize2(table) {
  const row = table.getFirstChild();
  return (0, import_table4.$isTableRowNode)(row) ? row.getChildrenSize() : 0;
}
var $createTableCell2 = (textContent) => {
  textContent = textContent.replace(/\\n/g, "\n");
  const cell = (0, import_table4.$createTableCellNode)(import_table4.TableCellHeaderStates.NO_STATUS);
  (0, import_markdown2.$convertFromMarkdownString)(textContent, PLAYGROUND_TRANSFORMERS2, cell);
  return cell;
};
var mapToTableCells2 = (textContent) => {
  const match = textContent.match(TABLE_ROW_REG_EXP2);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].split("|").map((text) => $createTableCell2(text));
};
var PLAYGROUND_TRANSFORMERS2 = [
  TABLE2,
  HR2,
  IMAGE2,
  EMOJI2,
  EQUATION2,
  TWEET2,
  import_markdown2.CHECK_LIST,
  ...import_markdown2.ELEMENT_TRANSFORMERS,
  ...import_markdown2.MULTILINE_ELEMENT_TRANSFORMERS,
  ...import_markdown2.TEXT_FORMAT_TRANSFORMERS,
  ...import_markdown2.TEXT_MATCH_TRANSFORMERS
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
  const plainText = clipboardData.getData("text/plain");
  if (!plainText || plainText.trim().length === 0) {
    return null;
  }
  const htmlData = clipboardData.getData("text/html");
  if (htmlData && htmlData.trim().length > 0) {
    const hasCodeElements = /<(pre|code)[^>]*>/i.test(htmlData);
    if (hasCodeElements) {
      return plainText;
    }
    const isSimpleHtml = /<(meta|span|div|p|br)[^>]*>/i.test(htmlData) && !/<(table|img|a|ul|ol|li|h[1-6])[^>]*>/i.test(htmlData);
    if (isSimpleHtml) {
      return plainText;
    }
    return null;
  }
  return plainText;
}
function MarkdownPastePlugin() {
  const [editor] = (0, import_LexicalComposerContext32.useLexicalComposerContext)();
  const handlePaste = (0, import_react56.useCallback)(
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
        const selection = (0, import_lexical45.$getSelection)();
        if (!(0, import_lexical45.$isRangeSelection)(selection)) {
          return;
        }
        selection.removeText();
        const anchorNode = selection.anchor.getNode();
        const paragraphNode = (0, import_lexical45.$createParagraphNode)();
        const normalizedText = plainText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        (0, import_markdown3.$convertFromMarkdownString)(
          normalizeListIndentation(normalizedText),
          PLAYGROUND_TRANSFORMERS2,
          paragraphNode,
          true
        );
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
  (0, import_react56.useEffect)(() => {
    return editor.registerCommand(
      import_lexical45.PASTE_COMMAND,
      (event) => {
        return handlePaste(event);
      },
      import_lexical45.COMMAND_PRIORITY_HIGH
    );
  }, [editor, handlePaste]);
  return null;
}

// src/plugins/MarkdownShortcutPlugin/index.tsx
var import_LexicalMarkdownShortcutPlugin = require("@lexical/react/LexicalMarkdownShortcutPlugin");
var import_jsx_runtime50 = require("react/jsx-runtime");
function MarkdownPlugin() {
  return /* @__PURE__ */ (0, import_jsx_runtime50.jsx)(import_LexicalMarkdownShortcutPlugin.MarkdownShortcutPlugin, { transformers: PLAYGROUND_TRANSFORMERS2 });
}

// src/plugins/MaxLengthPlugin/index.tsx
var import_LexicalComposerContext33 = require("@lexical/react/LexicalComposerContext");
var import_selection5 = require("@lexical/selection");
var import_utils29 = require("@lexical/utils");
var import_lexical46 = require("lexical");
var import_react57 = require("react");
function MaxLengthPlugin({ maxLength }) {
  const [editor] = (0, import_LexicalComposerContext33.useLexicalComposerContext)();
  (0, import_react57.useEffect)(() => {
    let lastRestoredEditorState = null;
    return editor.registerNodeTransform(import_lexical46.RootNode, (rootNode) => {
      const selection = (0, import_lexical46.$getSelection)();
      if (!(0, import_lexical46.$isRangeSelection)(selection) || !selection.isCollapsed()) {
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
            (0, import_utils29.$restoreEditorState)(editor, prevEditorState);
          } else {
            (0, import_selection5.$trimTextContentFromAnchor)(editor, anchor, delCount);
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
var import_link6 = require("@lexical/link");
var import_lexical49 = require("lexical");
var import_react58 = require("react");
init_url();

// src/plugins/ToolbarPlugin/utils.ts
var import_code8 = require("@lexical/code");
var import_list2 = require("@lexical/list");
var import_LexicalDecoratorBlockNode4 = require("@lexical/react/LexicalDecoratorBlockNode");
var import_rich_text5 = require("@lexical/rich-text");
var import_selection6 = require("@lexical/selection");
var import_table5 = require("@lexical/table");
var import_utils30 = require("@lexical/utils");
var import_lexical47 = require("lexical");
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
      (0, import_lexical47.$addUpdateTag)(import_lexical47.SKIP_DOM_SELECTION_TAG);
    }
    if (editor.isEditable()) {
      const selection = (0, import_lexical47.$getSelection)();
      if (selection !== null) {
        (0, import_selection6.$patchStyleText)(selection, {
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
    (0, import_lexical47.$addUpdateTag)(import_lexical47.SKIP_SELECTION_FOCUS_TAG);
    const selection = (0, import_lexical47.$getSelection)();
    (0, import_selection6.$setBlocksType)(selection, () => (0, import_lexical47.$createParagraphNode)());
  });
};
var formatHeading = (editor, blockType, headingSize) => {
  if (blockType !== headingSize) {
    editor.update(() => {
      (0, import_lexical47.$addUpdateTag)(import_lexical47.SKIP_SELECTION_FOCUS_TAG);
      const selection = (0, import_lexical47.$getSelection)();
      (0, import_selection6.$setBlocksType)(selection, () => (0, import_rich_text5.$createHeadingNode)(headingSize));
    });
  }
};
var formatBulletList = (editor, blockType) => {
  if (blockType !== "bullet") {
    editor.update(() => {
      (0, import_lexical47.$addUpdateTag)(import_lexical47.SKIP_SELECTION_FOCUS_TAG);
      editor.dispatchCommand(import_list2.INSERT_UNORDERED_LIST_COMMAND, void 0);
    });
  } else {
    formatParagraph(editor);
  }
};
var formatCheckList = (editor, blockType) => {
  if (blockType !== "check") {
    editor.update(() => {
      (0, import_lexical47.$addUpdateTag)(import_lexical47.SKIP_SELECTION_FOCUS_TAG);
      editor.dispatchCommand(import_list2.INSERT_CHECK_LIST_COMMAND, void 0);
    });
  } else {
    formatParagraph(editor);
  }
};
var formatNumberedList = (editor, blockType) => {
  if (blockType !== "number") {
    editor.update(() => {
      (0, import_lexical47.$addUpdateTag)(import_lexical47.SKIP_SELECTION_FOCUS_TAG);
      editor.dispatchCommand(import_list2.INSERT_ORDERED_LIST_COMMAND, void 0);
    });
  } else {
    formatParagraph(editor);
  }
};
var formatQuote = (editor, blockType) => {
  if (blockType !== "quote") {
    editor.update(() => {
      (0, import_lexical47.$addUpdateTag)(import_lexical47.SKIP_SELECTION_FOCUS_TAG);
      const selection = (0, import_lexical47.$getSelection)();
      (0, import_selection6.$setBlocksType)(selection, () => (0, import_rich_text5.$createQuoteNode)());
    });
  }
};
var formatCode = (editor, blockType) => {
  if (blockType !== "code") {
    editor.update(() => {
      (0, import_lexical47.$addUpdateTag)(import_lexical47.SKIP_SELECTION_FOCUS_TAG);
      let selection = (0, import_lexical47.$getSelection)();
      if (!selection) {
        return;
      }
      if (!(0, import_lexical47.$isRangeSelection)(selection) || selection.isCollapsed()) {
        (0, import_selection6.$setBlocksType)(selection, () => (0, import_code8.$createCodeNode)());
      } else {
        const textContent = selection.getTextContent();
        const codeNode = (0, import_code8.$createCodeNode)();
        selection.insertNodes([codeNode]);
        selection = (0, import_lexical47.$getSelection)();
        if ((0, import_lexical47.$isRangeSelection)(selection)) {
          selection.insertRawText(textContent);
        }
      }
    });
  }
};
var clearFormatting = (editor, skipRefocus = false) => {
  editor.update(() => {
    if (skipRefocus) {
      (0, import_lexical47.$addUpdateTag)(import_lexical47.SKIP_DOM_SELECTION_TAG);
    }
    const selection = (0, import_lexical47.$getSelection)();
    if ((0, import_lexical47.$isRangeSelection)(selection) || (0, import_table5.$isTableSelection)(selection)) {
      const anchor = selection.anchor;
      const focus = selection.focus;
      const nodes = selection.getNodes();
      const extractedNodes = selection.extract();
      if (anchor.key === focus.key && anchor.offset === focus.offset) {
        return;
      }
      nodes.forEach((node, idx) => {
        if ((0, import_lexical47.$isTextNode)(node)) {
          let textNode = node;
          if (idx === 0 && anchor.offset !== 0) {
            textNode = textNode.splitText(anchor.offset)[1] || textNode;
          }
          if (idx === nodes.length - 1) {
            textNode = textNode.splitText(focus.offset)[0] || textNode;
          }
          const extractedTextNode = extractedNodes[0];
          if (nodes.length === 1 && (0, import_lexical47.$isTextNode)(extractedTextNode)) {
            textNode = extractedTextNode;
          }
          if (textNode.__style !== "") {
            textNode.setStyle("");
          }
          if (textNode.__format !== 0) {
            textNode.setFormat(0);
          }
          const nearestBlockElement = (0, import_utils30.$getNearestBlockElementAncestorOrThrow)(textNode);
          if (nearestBlockElement.__format !== 0) {
            nearestBlockElement.setFormat("");
          }
          if (nearestBlockElement.__indent !== 0) {
            nearestBlockElement.setIndent(0);
          }
          node = textNode;
        } else if ((0, import_rich_text5.$isHeadingNode)(node) || (0, import_rich_text5.$isQuoteNode)(node)) {
          node.replace((0, import_lexical47.$createParagraphNode)(), true);
        } else if ((0, import_LexicalDecoratorBlockNode4.$isDecoratorBlockNode)(node)) {
          node.setFormat("");
        }
      });
    }
  });
};

// src/plugins/ShortcutsPlugin/shortcuts.ts
var import_utils31 = require("@lexical/utils");
var import_lexical48 = require("lexical");
var SHORTCUTS = Object.freeze({
  // (Ctrl|⌘) + (Alt|Option) + <key> shortcuts
  NORMAL: import_utils31.IS_APPLE ? "\u2318+Opt+0" : "Ctrl+Alt+0",
  HEADING1: import_utils31.IS_APPLE ? "\u2318+Opt+1" : "Ctrl+Alt+1",
  HEADING2: import_utils31.IS_APPLE ? "\u2318+Opt+2" : "Ctrl+Alt+2",
  HEADING3: import_utils31.IS_APPLE ? "\u2318+Opt+3" : "Ctrl+Alt+3",
  NUMBERED_LIST: import_utils31.IS_APPLE ? "\u2318+Shift+7" : "Ctrl+Shift+7",
  BULLET_LIST: import_utils31.IS_APPLE ? "\u2318+Shift+8" : "Ctrl+Shift+8",
  CHECK_LIST: import_utils31.IS_APPLE ? "\u2318+Shift+9" : "Ctrl+Shift+9",
  CODE_BLOCK: import_utils31.IS_APPLE ? "\u2318+Opt+C" : "Ctrl+Alt+C",
  QUOTE: import_utils31.IS_APPLE ? "\u2303+Shift+Q" : "Ctrl+Shift+Q",
  ADD_COMMENT: import_utils31.IS_APPLE ? "\u2318+Opt+M" : "Ctrl+Alt+M",
  // (Ctrl|⌘) + Shift + <key> shortcuts
  INCREASE_FONT_SIZE: import_utils31.IS_APPLE ? "\u2318+Shift+." : "Ctrl+Shift+.",
  DECREASE_FONT_SIZE: import_utils31.IS_APPLE ? "\u2318+Shift+," : "Ctrl+Shift+,",
  INSERT_CODE_BLOCK: import_utils31.IS_APPLE ? "\u2318+Shift+C" : "Ctrl+Shift+C",
  STRIKETHROUGH: import_utils31.IS_APPLE ? "\u2318+Shift+X" : "Ctrl+Shift+X",
  LOWERCASE: import_utils31.IS_APPLE ? "\u2303+Shift+1" : "Ctrl+Shift+1",
  UPPERCASE: import_utils31.IS_APPLE ? "\u2303+Shift+2" : "Ctrl+Shift+2",
  CAPITALIZE: import_utils31.IS_APPLE ? "\u2303+Shift+3" : "Ctrl+Shift+3",
  CENTER_ALIGN: import_utils31.IS_APPLE ? "\u2318+Shift+E" : "Ctrl+Shift+E",
  JUSTIFY_ALIGN: import_utils31.IS_APPLE ? "\u2318+Shift+J" : "Ctrl+Shift+J",
  LEFT_ALIGN: import_utils31.IS_APPLE ? "\u2318+Shift+L" : "Ctrl+Shift+L",
  RIGHT_ALIGN: import_utils31.IS_APPLE ? "\u2318+Shift+R" : "Ctrl+Shift+R",
  // (Ctrl|⌘) + <key> shortcuts
  SUBSCRIPT: import_utils31.IS_APPLE ? "\u2318+," : "Ctrl+,",
  SUPERSCRIPT: import_utils31.IS_APPLE ? "\u2318+." : "Ctrl+.",
  INDENT: import_utils31.IS_APPLE ? "\u2318+]" : "Ctrl+]",
  OUTDENT: import_utils31.IS_APPLE ? "\u2318+[" : "Ctrl+[",
  CLEAR_FORMATTING: import_utils31.IS_APPLE ? "\u2318+\\" : "Ctrl+\\",
  REDO: import_utils31.IS_APPLE ? "\u2318+Shift+Z" : "Ctrl+Y",
  UNDO: import_utils31.IS_APPLE ? "\u2318+Z" : "Ctrl+Z",
  BOLD: import_utils31.IS_APPLE ? "\u2318+B" : "Ctrl+B",
  ITALIC: import_utils31.IS_APPLE ? "\u2318+I" : "Ctrl+I",
  UNDERLINE: import_utils31.IS_APPLE ? "\u2318+U" : "Ctrl+U",
  INSERT_LINK: import_utils31.IS_APPLE ? "\u2318+K" : "Ctrl+K"
});
var CONTROL_OR_META = { ctrlKey: !import_utils31.IS_APPLE, metaKey: import_utils31.IS_APPLE };
function isFormatParagraph(event) {
  const { code } = event;
  return (code === "Numpad0" || code === "Digit0") && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, altKey: true });
}
function isFormatHeading(event) {
  const { code } = event;
  if (!code) {
    return false;
  }
  const keyNumber = code[code.length - 1];
  return ["1", "2", "3"].includes(keyNumber) && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, altKey: true });
}
function isFormatNumberedList(event) {
  const { code } = event;
  return (code === "Numpad7" || code === "Digit7") && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isFormatBulletList(event) {
  const { code } = event;
  return (code === "Numpad8" || code === "Digit8") && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isFormatCheckList(event) {
  const { code } = event;
  return (code === "Numpad9" || code === "Digit9") && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isFormatCode(event) {
  const { code } = event;
  return code === "KeyC" && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, altKey: true });
}
function isFormatQuote(event) {
  const { code } = event;
  return code === "KeyQ" && (0, import_lexical48.isModifierMatch)(event, {
    ctrlKey: true,
    shiftKey: true
  });
}
function isLowercase(event) {
  const { code } = event;
  return (code === "Numpad1" || code === "Digit1") && (0, import_lexical48.isModifierMatch)(event, { ctrlKey: true, shiftKey: true });
}
function isUppercase(event) {
  const { code } = event;
  return (code === "Numpad2" || code === "Digit2") && (0, import_lexical48.isModifierMatch)(event, { ctrlKey: true, shiftKey: true });
}
function isCapitalize(event) {
  const { code } = event;
  return (code === "Numpad3" || code === "Digit3") && (0, import_lexical48.isModifierMatch)(event, { ctrlKey: true, shiftKey: true });
}
function isStrikeThrough(event) {
  const { code } = event;
  return code === "KeyX" && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isIndent(event) {
  const { code } = event;
  return code === "BracketRight" && (0, import_lexical48.isModifierMatch)(event, CONTROL_OR_META);
}
function isOutdent(event) {
  const { code } = event;
  return code === "BracketLeft" && (0, import_lexical48.isModifierMatch)(event, CONTROL_OR_META);
}
function isCenterAlign(event) {
  const { code } = event;
  return code === "KeyE" && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isLeftAlign(event) {
  const { code } = event;
  return code === "KeyL" && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isRightAlign(event) {
  const { code } = event;
  return code === "KeyR" && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isJustifyAlign(event) {
  const { code } = event;
  return code === "KeyJ" && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isSubscript(event) {
  const { code } = event;
  return code === "Comma" && (0, import_lexical48.isModifierMatch)(event, CONTROL_OR_META);
}
function isSuperscript(event) {
  const { code } = event;
  return code === "Period" && (0, import_lexical48.isModifierMatch)(event, CONTROL_OR_META);
}
function isInsertCodeBlock(event) {
  const { code } = event;
  return code === "KeyC" && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isIncreaseFontSize(event) {
  const { code } = event;
  return code === "Period" && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isDecreaseFontSize(event) {
  const { code } = event;
  return code === "Comma" && (0, import_lexical48.isModifierMatch)(event, { ...CONTROL_OR_META, shiftKey: true });
}
function isClearFormatting(event) {
  const { code } = event;
  return code === "Backslash" && (0, import_lexical48.isModifierMatch)(event, CONTROL_OR_META);
}
function isInsertLink(event) {
  const { code } = event;
  return code === "KeyK" && (0, import_lexical48.isModifierMatch)(event, CONTROL_OR_META);
}

// src/plugins/ShortcutsPlugin/index.tsx
function ShortcutsPlugin({
  editor,
  setIsLinkEditMode
}) {
  const { toolbarState } = useToolbarState();
  (0, import_react58.useEffect)(() => {
    const keyboardShortcutsHandler = (event) => {
      if ((0, import_lexical49.isModifierMatch)(event, {})) {
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
        editor.dispatchCommand(import_lexical49.FORMAT_TEXT_COMMAND, "strikethrough");
      } else if (isLowercase(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_TEXT_COMMAND, "lowercase");
      } else if (isUppercase(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_TEXT_COMMAND, "uppercase");
      } else if (isCapitalize(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_TEXT_COMMAND, "capitalize");
      } else if (isIndent(event)) {
        editor.dispatchCommand(import_lexical49.INDENT_CONTENT_COMMAND, void 0);
      } else if (isOutdent(event)) {
        editor.dispatchCommand(import_lexical49.OUTDENT_CONTENT_COMMAND, void 0);
      } else if (isCenterAlign(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_ELEMENT_COMMAND, "center");
      } else if (isLeftAlign(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_ELEMENT_COMMAND, "left");
      } else if (isRightAlign(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_ELEMENT_COMMAND, "right");
      } else if (isJustifyAlign(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_ELEMENT_COMMAND, "justify");
      } else if (isSubscript(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_TEXT_COMMAND, "subscript");
      } else if (isSuperscript(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_TEXT_COMMAND, "superscript");
      } else if (isInsertCodeBlock(event)) {
        editor.dispatchCommand(import_lexical49.FORMAT_TEXT_COMMAND, "code");
      } else if (isIncreaseFontSize(event)) {
        updateFontSize(editor, 1 /* increment */, toolbarState.fontSizeInputValue);
      } else if (isDecreaseFontSize(event)) {
        updateFontSize(editor, 2 /* decrement */, toolbarState.fontSizeInputValue);
      } else if (isClearFormatting(event)) {
        clearFormatting(editor);
      } else if (isInsertLink(event)) {
        const url = toolbarState.isLink ? null : sanitizeUrl("https://");
        setIsLinkEditMode(!toolbarState.isLink);
        editor.dispatchCommand(import_link6.TOGGLE_LINK_COMMAND, url);
      } else {
        return false;
      }
      event.preventDefault();
      return true;
    };
    return editor.registerCommand(import_lexical49.KEY_DOWN_COMMAND, keyboardShortcutsHandler, import_lexical49.COMMAND_PRIORITY_NORMAL);
  }, [editor, toolbarState.isLink, toolbarState.blockType, toolbarState.fontSizeInputValue, setIsLinkEditMode]);
  return null;
}

// src/plugins/SpecialTextPlugin/index.ts
var import_LexicalComposerContext34 = require("@lexical/react/LexicalComposerContext");
var import_lexical51 = require("lexical");
var import_react59 = require("react");

// src/nodes/SpecialTextNode.tsx
var import_utils33 = require("@lexical/utils");
var import_lexical50 = require("lexical");
var SpecialTextNode = class _SpecialTextNode extends import_lexical50.TextNode {
  static getType() {
    return "specialText";
  }
  static clone(node) {
    return new _SpecialTextNode(node.__text, node.__key);
  }
  createDOM(config) {
    const dom = document.createElement("span");
    (0, import_utils33.addClassNamesToElement)(dom, config.theme.specialText);
    dom.textContent = this.getTextContent();
    return dom;
  }
  updateDOM(prevNode, dom, config) {
    if (prevNode.__text.startsWith("[") && prevNode.__text.endsWith("]")) {
      const strippedText = this.__text.substring(1, this.__text.length - 1);
      dom.textContent = strippedText;
    }
    (0, import_utils33.addClassNamesToElement)(dom, config.theme.specialText);
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
  return (0, import_lexical50.$applyNodeReplacement)(new SpecialTextNode(text));
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
  (0, import_react59.useEffect)(() => {
    if (!editor.hasNodes([SpecialTextNode])) {
      throw new Error("SpecialTextPlugin: SpecialTextNode not registered on editor");
    }
    return editor.registerNodeTransform(import_lexical51.TextNode, $textNodeTransform3);
  }, [editor]);
}
function SpecialTextPlugin() {
  const [editor] = (0, import_LexicalComposerContext34.useLexicalComposerContext)();
  useTextTransformation(editor);
  return null;
}

// src/plugins/TabFocusPlugin/index.tsx
var import_LexicalComposerContext35 = require("@lexical/react/LexicalComposerContext");
var import_lexical52 = require("lexical");
var import_react60 = require("react");
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
  const [editor] = (0, import_LexicalComposerContext35.useLexicalComposerContext)();
  (0, import_react60.useEffect)(() => {
    if (!hasRegisteredKeyDownListener) {
      registerKeyTimeStampTracker();
      hasRegisteredKeyDownListener = true;
    }
    return editor.registerCommand(
      import_lexical52.FOCUS_COMMAND,
      (event) => {
        const selection = (0, import_lexical52.$getSelection)();
        if ((0, import_lexical52.$isRangeSelection)(selection)) {
          if (lastTabKeyDownTimestamp + TAB_TO_FOCUS_INTERVAL > event.timeStamp) {
            (0, import_lexical52.$setSelection)(selection.clone());
          }
        }
        return false;
      },
      import_lexical52.COMMAND_PRIORITY_LOW
    );
  }, [editor]);
  return null;
}

// src/plugins/TableActionMenuPlugin/index.tsx
var import_LexicalComposerContext36 = require("@lexical/react/LexicalComposerContext");
var import_useLexicalEditable3 = require("@lexical/react/useLexicalEditable");
var import_table6 = require("@lexical/table");
var import_utils34 = require("@lexical/utils");
var import_lexical53 = require("lexical");
var import_react61 = require("react");
var import_react_dom8 = require("react-dom");
var import_jsx_runtime51 = require("react/jsx-runtime");
function computeSelectionCount(selection) {
  const selectionShape = selection.getShape();
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1
  };
}
function $canUnmerge() {
  const selection = (0, import_lexical53.$getSelection)();
  if ((0, import_lexical53.$isRangeSelection)(selection) && !selection.isCollapsed() || (0, import_table6.$isTableSelection)(selection) && !selection.anchor.is(selection.focus) || !(0, import_lexical53.$isRangeSelection)(selection) && !(0, import_table6.$isTableSelection)(selection)) {
    return false;
  }
  const [cell] = (0, import_table6.$getNodeTriplet)(selection.anchor);
  return cell.__colSpan > 1 || cell.__rowSpan > 1;
}
function $selectLastDescendant(node) {
  const lastDescendant = node.getLastDescendant();
  if ((0, import_lexical53.$isTextNode)(lastDescendant)) {
    lastDescendant.select();
  } else if ((0, import_lexical53.$isElementNode)(lastDescendant)) {
    lastDescendant.selectEnd();
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext();
  }
}
function currentCellBackgroundColor(editor) {
  return editor.getEditorState().read(() => {
    const selection = (0, import_lexical53.$getSelection)();
    if ((0, import_lexical53.$isRangeSelection)(selection) || (0, import_table6.$isTableSelection)(selection)) {
      const [cell] = (0, import_table6.$getNodeTriplet)(selection.anchor);
      if ((0, import_table6.$isTableCellNode)(cell)) {
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
  const [editor] = (0, import_LexicalComposerContext36.useLexicalComposerContext)();
  const dropDownRef = (0, import_react61.useRef)(null);
  const [tableCellNode, updateTableCellNode] = (0, import_react61.useState)(_tableCellNode);
  const [selectionCounts, updateSelectionCounts] = (0, import_react61.useState)({
    columns: 1,
    rows: 1
  });
  const [canMergeCells, setCanMergeCells] = (0, import_react61.useState)(false);
  const [canUnmergeCell, setCanUnmergeCell] = (0, import_react61.useState)(false);
  const [backgroundColor, setBackgroundColor] = (0, import_react61.useState)(() => currentCellBackgroundColor(editor) || "");
  (0, import_react61.useEffect)(() => {
    return editor.registerMutationListener(
      import_table6.TableCellNode,
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
  (0, import_react61.useEffect)(() => {
    editor.getEditorState().read(() => {
      const selection = (0, import_lexical53.$getSelection)();
      if ((0, import_table6.$isTableSelection)(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection);
        updateSelectionCounts(computeSelectionCount(selection));
        setCanMergeCells(currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1);
      }
      setCanUnmergeCell($canUnmerge());
    });
  }, [editor]);
  (0, import_react61.useEffect)(() => {
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
  (0, import_react61.useEffect)(() => {
    function handleClickOutside(event) {
      if (dropDownRef.current != null && contextRef.current != null && (0, import_lexical53.isDOMNode)(event.target) && !dropDownRef.current.contains(event.target) && !contextRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [setIsMenuOpen, contextRef]);
  const clearTableSelection = (0, import_react61.useCallback)(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = (0, import_table6.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
        const tableElement = (0, import_table6.getTableElement)(tableNode, editor.getElementByKey(tableNode.getKey()));
        if (tableElement === null) {
          throw new Error("TableActionMenu: Expected to find tableElement in DOM");
        }
        const tableObserver = (0, import_table6.getTableObserverFromTableElement)(tableElement);
        if (tableObserver !== null) {
          tableObserver.$clearHighlight();
        }
        tableNode.markDirty();
        updateTableCellNode(tableCellNode.getLatest());
      }
      (0, import_lexical53.$setSelection)(null);
    });
  }, [editor, tableCellNode]);
  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      const selection = (0, import_lexical53.$getSelection)();
      if (!(0, import_table6.$isTableSelection)(selection)) {
        return;
      }
      const nodes = selection.getNodes();
      const tableCells = nodes.filter(import_table6.$isTableCellNode);
      const targetCell = (0, import_table6.$mergeCells)(tableCells);
      if (targetCell) {
        $selectLastDescendant(targetCell);
        onClose();
      }
    });
  };
  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      (0, import_table6.$unmergeCell)();
    });
  };
  const insertTableRowAtSelection = (0, import_react61.useCallback)(
    (shouldInsertAfter) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.rows; i++) {
          (0, import_table6.$insertTableRowAtSelection)(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.rows]
  );
  const insertTableColumnAtSelection = (0, import_react61.useCallback)(
    (shouldInsertAfter) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.columns; i++) {
          (0, import_table6.$insertTableColumnAtSelection)(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.columns]
  );
  const deleteTableRowAtSelection = (0, import_react61.useCallback)(() => {
    editor.update(() => {
      (0, import_table6.$deleteTableRowAtSelection)();
      onClose();
    });
  }, [editor, onClose]);
  const deleteTableAtSelection = (0, import_react61.useCallback)(() => {
    editor.update(() => {
      const tableNode = (0, import_table6.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
      tableNode.remove();
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const deleteTableColumnAtSelection = (0, import_react61.useCallback)(() => {
    editor.update(() => {
      (0, import_table6.$deleteTableColumnAtSelection)();
      onClose();
    });
  }, [editor, onClose]);
  const toggleTableRowIsHeader = (0, import_react61.useCallback)(() => {
    editor.update(() => {
      const tableNode = (0, import_table6.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
      const tableRowIndex = (0, import_table6.$getTableRowIndexFromTableCellNode)(tableCellNode);
      const [gridMap] = (0, import_table6.$computeTableMapSkipCellCheck)(tableNode, null, null);
      const rowCells = /* @__PURE__ */ new Set();
      const newStyle = tableCellNode.getHeaderStyles() ^ import_table6.TableCellHeaderStates.ROW;
      for (let col = 0; col < gridMap[tableRowIndex].length; col++) {
        const mapCell = gridMap[tableRowIndex][col];
        if (!mapCell?.cell) {
          continue;
        }
        if (!rowCells.has(mapCell.cell)) {
          rowCells.add(mapCell.cell);
          mapCell.cell.setHeaderStyles(newStyle, import_table6.TableCellHeaderStates.ROW);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleTableColumnIsHeader = (0, import_react61.useCallback)(() => {
    editor.update(() => {
      const tableNode = (0, import_table6.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
      const tableColumnIndex = (0, import_table6.$getTableColumnIndexFromTableCellNode)(tableCellNode);
      const [gridMap] = (0, import_table6.$computeTableMapSkipCellCheck)(tableNode, null, null);
      const columnCells = /* @__PURE__ */ new Set();
      const newStyle = tableCellNode.getHeaderStyles() ^ import_table6.TableCellHeaderStates.COLUMN;
      for (let row = 0; row < gridMap.length; row++) {
        const mapCell = gridMap[row][tableColumnIndex];
        if (!mapCell?.cell) {
          continue;
        }
        if (!columnCells.has(mapCell.cell)) {
          columnCells.add(mapCell.cell);
          mapCell.cell.setHeaderStyles(newStyle, import_table6.TableCellHeaderStates.COLUMN);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleRowStriping = (0, import_react61.useCallback)(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = (0, import_table6.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
        if (tableNode) {
          tableNode.setRowStriping(!tableNode.getRowStriping());
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleFirstRowFreeze = (0, import_react61.useCallback)(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = (0, import_table6.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
        if (tableNode) {
          tableNode.setFrozenRows(tableNode.getFrozenRows() === 0 ? 1 : 0);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleFirstColumnFreeze = (0, import_react61.useCallback)(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = (0, import_table6.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
        if (tableNode) {
          tableNode.setFrozenColumns(tableNode.getFrozenColumns() === 0 ? 1 : 0);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const handleCellBackgroundColor = (0, import_react61.useCallback)(
    (value) => {
      editor.update(() => {
        const selection = (0, import_lexical53.$getSelection)();
        if ((0, import_lexical53.$isRangeSelection)(selection) || (0, import_table6.$isTableSelection)(selection)) {
          const [cell] = (0, import_table6.$getNodeTriplet)(selection.anchor);
          if ((0, import_table6.$isTableCellNode)(cell)) {
            cell.setBackgroundColor(value);
          }
          if ((0, import_table6.$isTableSelection)(selection)) {
            const nodes = selection.getNodes();
            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];
              if ((0, import_table6.$isTableCellNode)(node)) {
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
      const selection = (0, import_lexical53.$getSelection)();
      if ((0, import_lexical53.$isRangeSelection)(selection) || (0, import_table6.$isTableSelection)(selection)) {
        const [cell] = (0, import_table6.$getNodeTriplet)(selection.anchor);
        if ((0, import_table6.$isTableCellNode)(cell)) {
          cell.setVerticalAlign(value);
        }
        if ((0, import_table6.$isTableSelection)(selection)) {
          const nodes = selection.getNodes();
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if ((0, import_table6.$isTableCellNode)(node)) {
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
      mergeCellButton = /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
        "button",
        {
          type: "button",
          className: "item",
          onClick: () => mergeTableCellsAtSelection(),
          "data-test-id": "table-merge-cells",
          children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Merge cells" })
        }
      );
    } else if (canUnmergeCell) {
      mergeCellButton = /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
        "button",
        {
          type: "button",
          className: "item",
          onClick: () => unmergeTableCellsAtSelection(),
          "data-test-id": "table-unmerge-cells",
          children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Unmerge cells" })
        }
      );
    }
  }
  return (0, import_react_dom8.createPortal)(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(
      "div",
      {
        className: "notion-like-editor nle-dropdown",
        ref: dropDownRef,
        onClick: (e) => {
          e.stopPropagation();
        },
        children: [
          mergeCellButton,
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => showColorPickerModal("Cell background color", () => /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(ColorPicker, { color: backgroundColor, onChange: handleCellBackgroundColor })),
              "data-test-id": "table-background-color",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Background color" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { type: "button", className: "item", onClick: () => toggleRowStriping(), "data-test-id": "table-row-striping", children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Toggle Row Striping" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(
            DropDown,
            {
              buttonLabel: "Vertical Align",
              buttonClassName: "item",
              buttonAriaLabel: "Formatting options for vertical alignment",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
                  DropDownItem,
                  {
                    onClick: () => {
                      formatVerticalAlign("top");
                    },
                    className: "item wide",
                    children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "icon-text-container", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("i", { className: "icon vertical-top" }),
                      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Top Align" })
                    ] })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
                  DropDownItem,
                  {
                    onClick: () => {
                      formatVerticalAlign("middle");
                    },
                    className: "item wide",
                    children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "icon-text-container", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("i", { className: "icon vertical-middle" }),
                      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Middle Align" })
                    ] })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
                  DropDownItem,
                  {
                    onClick: () => {
                      formatVerticalAlign("bottom");
                    },
                    className: "item wide",
                    children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("div", { className: "icon-text-container", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("i", { className: "icon vertical-bottom" }),
                      /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Bottom Align" })
                    ] })
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => toggleFirstRowFreeze(),
              "data-test-id": "table-freeze-first-row",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Toggle First Row Freeze" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => toggleFirstColumnFreeze(),
              "data-test-id": "table-freeze-first-column",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Toggle First Column Freeze" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("hr", {}),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => insertTableRowAtSelection(false),
              "data-test-id": "table-insert-row-above",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("span", { className: "text", children: [
                "Insert ",
                selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`,
                " above"
              ] })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => insertTableRowAtSelection(true),
              "data-test-id": "table-insert-row-below",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("span", { className: "text", children: [
                "Insert ",
                selectionCounts.rows === 1 ? "row" : `${selectionCounts.rows} rows`,
                " below"
              ] })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("hr", {}),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => insertTableColumnAtSelection(false),
              "data-test-id": "table-insert-column-before",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("span", { className: "text", children: [
                "Insert ",
                selectionCounts.columns === 1 ? "column" : `${selectionCounts.columns} columns`,
                " left"
              ] })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => insertTableColumnAtSelection(true),
              "data-test-id": "table-insert-column-after",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("span", { className: "text", children: [
                "Insert ",
                selectionCounts.columns === 1 ? "column" : `${selectionCounts.columns} columns`,
                " right"
              ] })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("hr", {}),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => deleteTableColumnAtSelection(),
              "data-test-id": "table-delete-columns",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Delete column" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => deleteTableRowAtSelection(),
              "data-test-id": "table-delete-rows",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Delete row" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { type: "button", className: "item", onClick: () => deleteTableAtSelection(), "data-test-id": "table-delete", children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("span", { className: "text", children: "Delete table" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("hr", {}),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("button", { type: "button", className: "item", onClick: () => toggleTableRowIsHeader(), "data-test-id": "table-row-header", children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("span", { className: "text", children: [
            (tableCellNode.__headerState & import_table6.TableCellHeaderStates.ROW) === import_table6.TableCellHeaderStates.ROW ? "Remove" : "Add",
            " ",
            "row header"
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
            "button",
            {
              type: "button",
              className: "item",
              onClick: () => toggleTableColumnIsHeader(),
              "data-test-id": "table-column-header",
              children: /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)("span", { className: "text", children: [
                (tableCellNode.__headerState & import_table6.TableCellHeaderStates.COLUMN) === import_table6.TableCellHeaderStates.COLUMN ? "Remove" : "Add",
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
  const [editor] = (0, import_LexicalComposerContext36.useLexicalComposerContext)();
  const menuButtonRef = (0, import_react61.useRef)(null);
  const menuRootRef = (0, import_react61.useRef)(null);
  const [isMenuOpen, setIsMenuOpen] = (0, import_react61.useState)(false);
  const [tableCellNode, setTableMenuCellNode] = (0, import_react61.useState)(null);
  const [colorPickerModal, showColorPickerModal] = useModal();
  const checkTableCellOverflow = (0, import_react61.useCallback)((tableCellParentNodeDOM) => {
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
  const $moveMenu = (0, import_react61.useCallback)(() => {
    const menu = menuButtonRef.current;
    const selection = (0, import_lexical53.$getSelection)();
    const nativeSelection = (0, import_lexical53.getDOMSelection)(editor._window);
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
    if ((0, import_lexical53.$isRangeSelection)(selection) && rootElement !== null && nativeSelection !== null && rootElement.contains(nativeSelection.anchorNode)) {
      const tableCellNodeFromSelection = (0, import_table6.$getTableCellNodeFromLexicalNode)(selection.anchor.getNode());
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
      const tableNode = (0, import_table6.$getTableNodeFromLexicalNodeOrThrow)(tableCellNodeFromSelection);
      const tableElement = (0, import_table6.getTableElement)(tableNode, editor.getElementByKey(tableNode.getKey()));
      if (tableElement === null) {
        throw new Error("TableActionMenu: Expected to find tableElement in DOM");
      }
      tableObserver = (0, import_table6.getTableObserverFromTableElement)(tableElement);
      setTableMenuCellNode(tableCellNodeFromSelection);
    } else if ((0, import_table6.$isTableSelection)(selection)) {
      const anchorNode = (0, import_table6.$getTableCellNodeFromLexicalNode)(selection.anchor.getNode());
      if (!(0, import_table6.$isTableCellNode)(anchorNode)) {
        throw new Error("TableSelection anchorNode must be a TableCellNode");
      }
      const tableNode = (0, import_table6.$getTableNodeFromLexicalNodeOrThrow)(anchorNode);
      const tableElement = (0, import_table6.getTableElement)(tableNode, editor.getElementByKey(tableNode.getKey()));
      if (tableElement === null) {
        throw new Error("TableActionMenu: Expected to find tableElement in DOM");
      }
      tableObserver = (0, import_table6.getTableObserverFromTableElement)(tableElement);
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
  (0, import_react61.useEffect)(() => {
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
    return (0, import_utils34.mergeRegister)(
      editor.registerUpdateListener(delayedCallback),
      editor.registerCommand(import_lexical53.SELECTION_CHANGE_COMMAND, delayedCallback, import_lexical53.COMMAND_PRIORITY_CRITICAL),
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
  const prevTableCellDOM = (0, import_react61.useRef)(tableCellNode);
  (0, import_react61.useEffect)(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }
    prevTableCellDOM.current = tableCellNode;
  }, [tableCellNode]);
  return /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("div", { className: "table-cell-action-button-container", ref: menuButtonRef, children: tableCellNode != null && /* @__PURE__ */ (0, import_jsx_runtime51.jsxs)(import_jsx_runtime51.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
      "button",
      {
        type: "button",
        className: "table-cell-action-button chevron-down",
        onClick: (e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        },
        ref: menuRootRef,
        children: /* @__PURE__ */ (0, import_jsx_runtime51.jsx)("i", { className: "chevron-down" })
      }
    ),
    colorPickerModal,
    isMenuOpen && /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(
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
  const isEditable = (0, import_useLexicalEditable3.useLexicalEditable)();
  return (0, import_react_dom8.createPortal)(
    isEditable ? /* @__PURE__ */ (0, import_jsx_runtime51.jsx)(TableCellActionMenuContainer, { anchorElem, cellMerge }) : null,
    anchorElem
  );
}

// src/plugins/TableCellResizer/index.tsx
var import_LexicalComposerContext37 = require("@lexical/react/LexicalComposerContext");
var import_useLexicalEditable4 = require("@lexical/react/useLexicalEditable");
var import_table7 = require("@lexical/table");
var import_utils35 = require("@lexical/utils");
var import_lexical54 = require("lexical");
var import_react62 = require("react");
var import_react_dom9 = require("react-dom");
var import_jsx_runtime52 = require("react/jsx-runtime");
var MIN_ROW_HEIGHT = 33;
var MIN_COLUMN_WIDTH = 92;
function TableCellResizer({ editor }) {
  const targetRef = (0, import_react62.useRef)(null);
  const resizerRef = (0, import_react62.useRef)(null);
  const tableRectRef = (0, import_react62.useRef)(null);
  const [hasTable, setHasTable] = (0, import_react62.useState)(false);
  const pointerStartPosRef = (0, import_react62.useRef)(null);
  const [pointerCurrentPos, updatePointerCurrentPos] = (0, import_react62.useState)(null);
  const [activeCell, updateActiveCell] = (0, import_react62.useState)(null);
  const [draggingDirection, updateDraggingDirection] = (0, import_react62.useState)(null);
  const resetState = (0, import_react62.useCallback)(() => {
    updateActiveCell(null);
    targetRef.current = null;
    updateDraggingDirection(null);
    pointerStartPosRef.current = null;
    tableRectRef.current = null;
  }, []);
  (0, import_react62.useEffect)(() => {
    const tableKeys = /* @__PURE__ */ new Set();
    return (0, import_utils35.mergeRegister)(
      editor.registerMutationListener(import_table7.TableNode, (nodeMutations) => {
        for (const [nodeKey, mutation] of nodeMutations) {
          if (mutation === "destroyed") {
            tableKeys.delete(nodeKey);
          } else {
            tableKeys.add(nodeKey);
          }
        }
        setHasTable(tableKeys.size > 0);
      }),
      editor.registerNodeTransform(import_table7.TableNode, (tableNode) => {
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
  (0, import_react62.useEffect)(() => {
    if (!hasTable) {
      return;
    }
    const onPointerMove = (event) => {
      const target = event.target;
      if (!(0, import_lexical54.isHTMLElement)(target)) {
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
        const cell = (0, import_table7.getDOMCellFromTarget)(target);
        if (cell && activeCell !== cell) {
          editor.getEditorState().read(
            () => {
              const tableCellNode = (0, import_lexical54.$getNearestNodeFromDOMNode)(cell.elem);
              if (!tableCellNode) {
                throw new Error("TableCellResizer: Table cell node not found.");
              }
              const tableNode = (0, import_table7.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
              const tableElement = (0, import_table7.getTableElement)(tableNode, editor.getElementByKey(tableNode.getKey()));
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
  const updateRowHeight = (0, import_react62.useCallback)(
    (heightChange) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }
      editor.update(
        () => {
          const tableCellNode = (0, import_lexical54.$getNearestNodeFromDOMNode)(activeCell.elem);
          if (!(0, import_table7.$isTableCellNode)(tableCellNode)) {
            throw new Error("TableCellResizer: Table cell node not found.");
          }
          const tableNode = (0, import_table7.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
          const baseRowIndex = (0, import_table7.$getTableRowIndexFromTableCellNode)(tableCellNode);
          const tableRows = tableNode.getChildren();
          const isFullRowMerge = tableCellNode.getColSpan() === tableNode.getColumnCount();
          const tableRowIndex = isFullRowMerge ? baseRowIndex : baseRowIndex + tableCellNode.getRowSpan() - 1;
          if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
            throw new Error("Expected table cell to be inside of table row.");
          }
          const tableRow = tableRows[tableRowIndex];
          if (!(0, import_table7.$isTableRowNode)(tableRow)) {
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
        { tag: import_lexical54.SKIP_SCROLL_INTO_VIEW_TAG }
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
  const updateColumnWidth = (0, import_react62.useCallback)(
    (widthChange) => {
      if (!activeCell) {
        throw new Error("TableCellResizer: Expected active cell.");
      }
      editor.update(
        () => {
          const tableCellNode = (0, import_lexical54.$getNearestNodeFromDOMNode)(activeCell.elem);
          if (!(0, import_table7.$isTableCellNode)(tableCellNode)) {
            throw new Error("TableCellResizer: Table cell node not found.");
          }
          const tableNode = (0, import_table7.$getTableNodeFromLexicalNodeOrThrow)(tableCellNode);
          const [tableMap] = (0, import_table7.$computeTableMapSkipCellCheck)(tableNode, null, null);
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
        { tag: import_lexical54.SKIP_SCROLL_INTO_VIEW_TAG }
      );
    },
    [activeCell, editor, getCellColumnIndex]
  );
  const pointerUpHandler = (0, import_react62.useCallback)(
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
          const zoom = (0, import_utils35.calculateZoomLevel)(event.target);
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
  const toggleResize = (0, import_react62.useCallback)(
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
  const getResizers = (0, import_react62.useCallback)(() => {
    if (activeCell) {
      const { height, width, top, left } = activeCell.elem.getBoundingClientRect();
      const zoom = (0, import_utils35.calculateZoomLevel)(activeCell.elem);
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
  return /* @__PURE__ */ (0, import_jsx_runtime52.jsx)("div", { ref: resizerRef, className: "notion-like-editor table-cell-resizer-container", children: activeCell != null && /* @__PURE__ */ (0, import_jsx_runtime52.jsxs)(import_jsx_runtime52.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
      "div",
      {
        className: "TableCellResizer__resizer TableCellResizer__ui",
        style: resizerStyles.right || void 0,
        onPointerDown: toggleResize("right")
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime52.jsx)(
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
  const [editor] = (0, import_LexicalComposerContext37.useLexicalComposerContext)();
  const isEditable = (0, import_useLexicalEditable4.useLexicalEditable)();
  return (0, import_react62.useMemo)(
    () => isEditable ? (0, import_react_dom9.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime52.jsx)(TableCellResizer, { editor }), document.body) : null,
    [editor, isEditable]
  );
}

// src/plugins/TableHoverActionsPlugin/index.tsx
var import_LexicalComposerContext38 = require("@lexical/react/LexicalComposerContext");
var import_useLexicalEditable5 = require("@lexical/react/useLexicalEditable");
var import_table8 = require("@lexical/table");
var import_utils36 = require("@lexical/utils");
var import_lexical55 = require("lexical");
var import_react63 = require("react");
var import_react_dom10 = require("react-dom");

// src/utils/getThemeSelector.ts
function getThemeSelector(getTheme, name) {
  const className = getTheme()?.[name];
  if (typeof className !== "string") {
    throw new Error(`getThemeClass: required theme property ${name} not defined`);
  }
  return className.split(/\s+/g).map((cls) => `.${cls}`).join();
}

// src/plugins/TableHoverActionsPlugin/index.tsx
var import_jsx_runtime53 = require("react/jsx-runtime");
var BUTTON_WIDTH_PX = 20;
function TableHoverActionsContainer({ anchorElem }) {
  const [editor, { getTheme }] = (0, import_LexicalComposerContext38.useLexicalComposerContext)();
  const isEditable = (0, import_useLexicalEditable5.useLexicalEditable)();
  const [isShownRow, setShownRow] = (0, import_react63.useState)(false);
  const [isShownColumn, setShownColumn] = (0, import_react63.useState)(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = (0, import_react63.useState)(false);
  const [position, setPosition] = (0, import_react63.useState)({});
  const tableSetRef = (0, import_react63.useRef)(/* @__PURE__ */ new Set());
  const tableCellDOMNodeRef = (0, import_react63.useRef)(null);
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
          const maybeTableCell = (0, import_lexical55.$getNearestNodeFromDOMNode)(tableDOMNode);
          if ((0, import_table8.$isTableCellNode)(maybeTableCell)) {
            const table = (0, import_utils36.$findMatchingParent)(maybeTableCell, (node) => (0, import_table8.$isTableNode)(node));
            if (!(0, import_table8.$isTableNode)(table)) {
              return;
            }
            tableDOMElement = (0, import_table8.getTableElement)(table, editor.getElementByKey(table.getKey()));
            if (tableDOMElement) {
              const rowCount = table.getChildrenSize();
              const colCount = table.getChildAtIndex(0)?.getChildrenSize();
              const rowIndex = (0, import_table8.$getTableRowIndexFromTableCellNode)(maybeTableCell);
              const colIndex = (0, import_table8.$getTableColumnIndexFromTableCellNode)(maybeTableCell);
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
  const tableResizeObserver = (0, import_react63.useMemo)(() => {
    return new ResizeObserver(() => {
      setShownRow(false);
      setShownColumn(false);
    });
  }, []);
  (0, import_react63.useEffect)(() => {
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
  (0, import_react63.useEffect)(() => {
    return (0, import_utils36.mergeRegister)(
      editor.registerMutationListener(
        import_table8.TableNode,
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
                  const { tableElement } = (0, import_table8.$getTableAndElementByKey)(tableKey);
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
        const maybeTableNode = (0, import_lexical55.$getNearestNodeFromDOMNode)(tableCellDOMNodeRef.current);
        maybeTableNode?.selectEnd();
        if (insertRow) {
          (0, import_table8.$insertTableRowAtSelection)();
          setShownRow(false);
        } else {
          (0, import_table8.$insertTableColumnAtSelection)();
          setShownColumn(false);
        }
      }
    });
  };
  if (!isEditable) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime53.jsxs)(import_jsx_runtime53.Fragment, { children: [
    isShownRow && /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
      "button",
      {
        type: "button",
        className: `notion-like-editor ${getTheme()?.tableAddRows}`,
        style: { ...position },
        onClick: () => insertAction(true)
      }
    ),
    isShownColumn && /* @__PURE__ */ (0, import_jsx_runtime53.jsx)(
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
  if ((0, import_lexical55.isHTMLElement)(target)) {
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
  const isEditable = (0, import_useLexicalEditable5.useLexicalEditable)();
  return isEditable ? (0, import_react_dom10.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime53.jsx)(TableHoverActionsContainer, { anchorElem }), anchorElem) : null;
}

// src/plugins/TableOfContentsPlugin/index.tsx
var import_LexicalComposerContext39 = require("@lexical/react/LexicalComposerContext");
var import_LexicalTableOfContentsPlugin = require("@lexical/react/LexicalTableOfContentsPlugin");
var import_react64 = require("react");
var import_jsx_runtime54 = require("react/jsx-runtime");
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
  const [selectedKey, setSelectedKey] = (0, import_react64.useState)("");
  const selectedIndex = (0, import_react64.useRef)(0);
  const [editor] = (0, import_LexicalComposerContext39.useLexicalComposerContext)();
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
  (0, import_react64.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("div", { className: "table-of-contents", children: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("ul", { className: "headings", children: tableOfContents.map(([key, text, tag], index) => {
    if (index === 0) {
      return /* @__PURE__ */ (0, import_jsx_runtime54.jsxs)("div", { className: "normal-heading-wrapper", children: [
        /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("div", { className: "first-heading", onClick: () => scrollToNode(key, index), role: "button", tabIndex: 0, children: `${text}`.length > 20 ? `${text.substring(0, 20)}...` : text }),
        /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("br", {})
      ] }, key);
    } else {
      return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
        "div",
        {
          className: `normal-heading-wrapper ${selectedKey === key ? "selected-heading-wrapper" : ""}`,
          children: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)("div", { onClick: () => scrollToNode(key, index), role: "button", className: indent(tag), tabIndex: 0, children: /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(import_LexicalTableOfContentsPlugin.TableOfContentsPlugin, { children: (tableOfContents) => {
    return /* @__PURE__ */ (0, import_jsx_runtime54.jsx)(TableOfContentsList, { tableOfContents });
  } });
}

// src/plugins/ToolbarPlugin/index.tsx
var import_code9 = require("@lexical/code");
var import_code_shiki2 = require("@lexical/code-shiki");
var import_link7 = require("@lexical/link");
var import_list3 = require("@lexical/list");
var import_LexicalAutoEmbedPlugin3 = require("@lexical/react/LexicalAutoEmbedPlugin");
var import_LexicalHorizontalRuleNode2 = require("@lexical/react/LexicalHorizontalRuleNode");
var import_rich_text6 = require("@lexical/rich-text");
var import_selection7 = require("@lexical/selection");
var import_table9 = require("@lexical/table");
var import_utils40 = require("@lexical/utils");
var import_lexical58 = require("lexical");
var import_react66 = require("react");
init_StickyNode2();
init_url();

// src/plugins/ToolbarPlugin/fontSize.tsx
var React6 = __toESM(require("react"));
var import_jsx_runtime57 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime57.jsxs)(import_jsx_runtime57.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
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
        children: /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("i", { className: "format minus-icon" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
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
    /* @__PURE__ */ (0, import_jsx_runtime57.jsx)(
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
        children: /* @__PURE__ */ (0, import_jsx_runtime57.jsx)("i", { className: "format add-icon" })
      }
    )
  ] });
}

// src/plugins/ToolbarPlugin/index.tsx
var import_jsx_runtime58 = require("react/jsx-runtime");
var CODE_LANGUAGE_OPTIONS_PRISM = (0, import_code9.getCodeLanguageOptions)().filter(
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
var CODE_LANGUAGE_OPTIONS_SHIKI = (0, import_code_shiki2.getCodeLanguageOptions)().filter(
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
var CODE_THEME_OPTIONS_SHIKI = (0, import_code_shiki2.getCodeThemeOptions)().filter(
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
  return /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
    DropDown,
    {
      disabled,
      buttonClassName: "toolbar-item block-controls",
      buttonIconClassName: `icon block-type ${blockType}`,
      buttonLabel: blockTypeToBlockName[blockType],
      buttonAriaLabel: "Formatting options for text style",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "paragraph")}`,
            onClick: () => formatParagraph(editor),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon paragraph" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Normal" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.NORMAL })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "h1")}`,
            onClick: () => formatHeading(editor, blockType, "h1"),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon h1" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Heading 1" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.HEADING1 })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "h2")}`,
            onClick: () => formatHeading(editor, blockType, "h2"),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon h2" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Heading 2" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.HEADING2 })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "h3")}`,
            onClick: () => formatHeading(editor, blockType, "h3"),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon h3" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Heading 3" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.HEADING3 })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "number")}`,
            onClick: () => formatNumberedList(editor, blockType),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon numbered-list" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Numbered List" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.NUMBERED_LIST })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "bullet")}`,
            onClick: () => formatBulletList(editor, blockType),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon bullet-list" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Bullet List" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.BULLET_LIST })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "check")}`,
            onClick: () => formatCheckList(editor, blockType),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon check-list" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Check List" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.CHECK_LIST })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "quote")}`,
            onClick: () => formatQuote(editor, blockType),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon quote" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Quote" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.QUOTE })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            className: `item wide ${dropDownActiveClass(blockType === "code")}`,
            onClick: () => formatCode(editor, blockType),
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon code" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Code Block" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.CODE_BLOCK })
            ]
          }
        )
      ]
    }
  );
}
function Divider() {
  return /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("div", { className: "divider" });
}
function FontDropDown({
  editor,
  value,
  style,
  disabled = false
}) {
  const handleClick = (0, import_react66.useCallback)(
    (option) => {
      editor.update(() => {
        (0, import_lexical58.$addUpdateTag)(import_lexical58.SKIP_SELECTION_FOCUS_TAG);
        const selection = (0, import_lexical58.$getSelection)();
        if (selection !== null) {
          (0, import_selection7.$patchStyleText)(selection, {
            [style]: option
          });
        }
      });
    },
    [editor, style]
  );
  const buttonAriaLabel = style === "font-family" ? "Formatting options for font family" : "Formatting options for font size";
  return /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
    DropDown,
    {
      disabled,
      buttonClassName: `toolbar-item ${style}`,
      buttonLabel: value,
      buttonIconClassName: style === "font-family" ? "icon block-type font-family" : "",
      buttonAriaLabel,
      children: (style === "font-family" ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(([option, text]) => /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        DropDownItem,
        {
          className: `item ${dropDownActiveClass(value === option)} ${style === "font-size" ? "fontsize-item" : ""}`,
          onClick: () => handleClick(option),
          children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: text })
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
  return /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
    DropDown,
    {
      disabled,
      buttonLabel: formatOption.name,
      buttonIconClassName: `icon ${isRTL ? formatOption.iconRTL : formatOption.icon}`,
      buttonClassName: "toolbar-item spaced alignment",
      buttonAriaLabel: "Formatting options for text alignment",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(import_lexical58.FORMAT_ELEMENT_COMMAND, "left");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon left-align" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Left Align" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.LEFT_ALIGN })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(import_lexical58.FORMAT_ELEMENT_COMMAND, "center");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon center-align" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Center Align" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.CENTER_ALIGN })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(import_lexical58.FORMAT_ELEMENT_COMMAND, "right");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon right-align" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Right Align" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.RIGHT_ALIGN })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(import_lexical58.FORMAT_ELEMENT_COMMAND, "justify");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon justify-align" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Justify Align" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.JUSTIFY_ALIGN })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(import_lexical58.FORMAT_ELEMENT_COMMAND, "start");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: `icon ${isRTL ? ELEMENT_FORMAT_OPTIONS.start.iconRTL : ELEMENT_FORMAT_OPTIONS.start.icon}` }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Start Align" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(import_lexical58.FORMAT_ELEMENT_COMMAND, "end");
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: `icon ${isRTL ? ELEMENT_FORMAT_OPTIONS.end.iconRTL : ELEMENT_FORMAT_OPTIONS.end.icon}` }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "End Align" })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Divider, {}),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(import_lexical58.OUTDENT_CONTENT_COMMAND, void 0);
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: `icon ${isRTL ? "indent" : "outdent"}` }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Outdent" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.OUTDENT })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDownItem,
          {
            onClick: () => {
              editor.dispatchCommand(import_lexical58.INDENT_CONTENT_COMMAND, void 0);
            },
            className: "item wide",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: `icon ${isRTL ? "outdent" : "indent"}` }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Indent" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.INDENT })
            ]
          }
        )
      ]
    }
  );
}
function $findTopLevelElement(node) {
  let topLevelElement = node.getKey() === "root" ? node : (0, import_utils40.$findMatchingParent)(node, (e) => {
    const parent = e.getParent();
    return parent !== null && (0, import_lexical58.$isRootOrShadowRoot)(parent);
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
  const [selectedElementKey, setSelectedElementKey] = (0, import_react66.useState)(null);
  const [modal, showModal] = useModal();
  const [isEditable, setIsEditable] = (0, import_react66.useState)(() => editor.isEditable());
  const { toolbarState, updateToolbarState } = useToolbarState();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const dispatchToolbarCommand = (command, payload = void 0, skipRefocus = false) => {
    activeEditor.update(() => {
      if (skipRefocus) {
        (0, import_lexical58.$addUpdateTag)(import_lexical58.SKIP_DOM_SELECTION_TAG);
      }
      activeEditor.dispatchCommand(command, payload);
    });
  };
  const dispatchFormatTextCommand = (payload, skipRefocus = false) => dispatchToolbarCommand(import_lexical58.FORMAT_TEXT_COMMAND, payload, skipRefocus);
  const $handleHeadingNode = (0, import_react66.useCallback)(
    (selectedElement) => {
      const type = (0, import_rich_text6.$isHeadingNode)(selectedElement) ? selectedElement.getTag() : selectedElement.getType();
      if (type in blockTypeToBlockName) {
        updateToolbarState("blockType", type);
      }
    },
    [updateToolbarState]
  );
  const {
    settings: { isCodeHighlighted, isCodeShiki }
  } = useSettings();
  const $handleCodeNode = (0, import_react66.useCallback)(
    (element) => {
      if ((0, import_code9.$isCodeNode)(element)) {
        const language = element.getLanguage();
        updateToolbarState(
          "codeLanguage",
          language ? isCodeHighlighted && (isCodeShiki ? (0, import_code_shiki2.normalizeCodeLanguage)(language) : (0, import_code9.normalizeCodeLanguage)(language)) || language : ""
        );
        const theme4 = element.getTheme();
        updateToolbarState("codeTheme", theme4 || "");
        return;
      }
    },
    [updateToolbarState, isCodeHighlighted, isCodeShiki]
  );
  const $updateToolbar = (0, import_react66.useCallback)(() => {
    const selection = (0, import_lexical58.$getSelection)();
    if ((0, import_lexical58.$isRangeSelection)(selection)) {
      if (activeEditor !== editor && (0, import_utils40.$isEditorIsNestedEditor)(activeEditor)) {
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
      updateToolbarState("isRTL", (0, import_selection7.$isParentElementRTL)(selection));
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = (0, import_link7.$isLinkNode)(parent) || (0, import_link7.$isLinkNode)(node);
      updateToolbarState("isLink", isLink);
      const tableNode = (0, import_utils40.$findMatchingParent)(node, import_table9.$isTableNode);
      if ((0, import_table9.$isTableNode)(tableNode)) {
        updateToolbarState("rootType", "table");
      } else {
        updateToolbarState("rootType", "root");
      }
      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ((0, import_list3.$isListNode)(element)) {
          const parentList = (0, import_utils40.$getNearestNodeOfType)(anchorNode, import_list3.ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          updateToolbarState("blockType", type);
        } else {
          $handleHeadingNode(element);
          $handleCodeNode(element);
        }
      }
      updateToolbarState("fontColor", (0, import_selection7.$getSelectionStyleValueForProperty)(selection, "color", "#000"));
      updateToolbarState("bgColor", (0, import_selection7.$getSelectionStyleValueForProperty)(selection, "background-color", "#fff"));
      updateToolbarState("fontFamily", (0, import_selection7.$getSelectionStyleValueForProperty)(selection, "font-family", "Arial"));
      let matchingParent;
      if ((0, import_link7.$isLinkNode)(parent)) {
        matchingParent = (0, import_utils40.$findMatchingParent)(
          node,
          (parentNode) => (0, import_lexical58.$isElementNode)(parentNode) && !parentNode.isInline()
        );
      }
      updateToolbarState(
        "elementFormat",
        (0, import_lexical58.$isElementNode)(matchingParent) ? matchingParent.getFormatType() : (0, import_lexical58.$isElementNode)(node) ? node.getFormatType() : parent?.getFormatType() || "left"
      );
    }
    if ((0, import_lexical58.$isRangeSelection)(selection) || (0, import_table9.$isTableSelection)(selection)) {
      updateToolbarState("isBold", selection.hasFormat("bold"));
      updateToolbarState("isItalic", selection.hasFormat("italic"));
      updateToolbarState("isUnderline", selection.hasFormat("underline"));
      updateToolbarState("isStrikethrough", selection.hasFormat("strikethrough"));
      updateToolbarState("isSubscript", selection.hasFormat("subscript"));
      updateToolbarState("isSuperscript", selection.hasFormat("superscript"));
      updateToolbarState("isHighlight", selection.hasFormat("highlight"));
      updateToolbarState("isCode", selection.hasFormat("code"));
      updateToolbarState("fontSize", (0, import_selection7.$getSelectionStyleValueForProperty)(selection, "font-size", "15px"));
      updateToolbarState("isLowercase", selection.hasFormat("lowercase"));
      updateToolbarState("isUppercase", selection.hasFormat("uppercase"));
      updateToolbarState("isCapitalize", selection.hasFormat("capitalize"));
    }
    if ((0, import_lexical58.$isNodeSelection)(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = (0, import_utils40.$getNearestNodeOfType)(selectedNode, import_list3.ListNode);
        if (parentList) {
          const type = parentList.getListType();
          updateToolbarState("blockType", type);
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);
          $handleCodeNode(selectedElement);
          if ((0, import_lexical58.$isElementNode)(selectedElement)) {
            updateToolbarState("elementFormat", selectedElement.getFormatType());
          }
        }
      }
    }
  }, [activeEditor, editor, updateToolbarState, $handleHeadingNode, $handleCodeNode]);
  (0, import_react66.useEffect)(() => {
    return editor.registerCommand(
      import_lexical58.SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      import_lexical58.COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, $updateToolbar, setActiveEditor]);
  (0, import_react66.useEffect)(() => {
    activeEditor.getEditorState().read(
      () => {
        $updateToolbar();
      },
      { editor: activeEditor }
    );
  }, [activeEditor, $updateToolbar]);
  (0, import_react66.useEffect)(() => {
    return (0, import_utils40.mergeRegister)(
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
        import_lexical58.CAN_UNDO_COMMAND,
        (payload) => {
          updateToolbarState("canUndo", payload);
          return false;
        },
        import_lexical58.COMMAND_PRIORITY_CRITICAL
      ),
      activeEditor.registerCommand(
        import_lexical58.CAN_REDO_COMMAND,
        (payload) => {
          updateToolbarState("canRedo", payload);
          return false;
        },
        import_lexical58.COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);
  const applyStyleText = (0, import_react66.useCallback)(
    (styles, skipHistoryStack, skipRefocus = false) => {
      activeEditor.update(
        () => {
          if (skipRefocus) {
            (0, import_lexical58.$addUpdateTag)(import_lexical58.SKIP_DOM_SELECTION_TAG);
          }
          const selection = (0, import_lexical58.$getSelection)();
          if (selection !== null) {
            (0, import_selection7.$patchStyleText)(selection, styles);
          }
        },
        skipHistoryStack ? { tag: import_lexical58.HISTORIC_TAG } : {}
      );
    },
    [activeEditor]
  );
  const onFontColorSelect = (0, import_react66.useCallback)(
    (value, skipHistoryStack, skipRefocus) => {
      applyStyleText({ color: value }, skipHistoryStack, skipRefocus);
    },
    [applyStyleText]
  );
  const onBgColorSelect = (0, import_react66.useCallback)(
    (value, skipHistoryStack, skipRefocus) => {
      applyStyleText({ "background-color": value }, skipHistoryStack, skipRefocus);
    },
    [applyStyleText]
  );
  const insertLink = (0, import_react66.useCallback)(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(import_link7.TOGGLE_LINK_COMMAND, sanitizeUrl("https://"));
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(import_link7.TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);
  const onCodeLanguageSelect = (0, import_react66.useCallback)(
    (value) => {
      activeEditor.update(() => {
        (0, import_lexical58.$addUpdateTag)(import_lexical58.SKIP_SELECTION_FOCUS_TAG);
        if (selectedElementKey !== null) {
          const node = (0, import_lexical58.$getNodeByKey)(selectedElementKey);
          if ((0, import_code9.$isCodeNode)(node)) {
            node.setLanguage(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey]
  );
  const onCodeThemeSelect = (0, import_react66.useCallback)(
    (value) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = (0, import_lexical58.$getNodeByKey)(selectedElementKey);
          if ((0, import_code9.$isCodeNode)(node)) {
            node.setTheme(value);
          }
        }
      });
    },
    [activeEditor, selectedElementKey]
  );
  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;
  return /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "toolbar", children: [
    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
      "button",
      {
        disabled: !toolbarState.canUndo || !isEditable,
        onClick: (e) => dispatchToolbarCommand(import_lexical58.UNDO_COMMAND, void 0, isKeyboardInput(e)),
        title: import_utils40.IS_APPLE ? "Undo (\u2318Z)" : "Undo (Ctrl+Z)",
        type: "button",
        className: "toolbar-item spaced",
        "aria-label": "Undo",
        children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "format undo" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
      "button",
      {
        disabled: !toolbarState.canRedo || !isEditable,
        onClick: (e) => dispatchToolbarCommand(import_lexical58.REDO_COMMAND, void 0, isKeyboardInput(e)),
        title: import_utils40.IS_APPLE ? "Redo (\u21E7\u2318Z)" : "Redo (Ctrl+Y)",
        type: "button",
        className: "toolbar-item",
        "aria-label": "Redo",
        children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "format redo" })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Divider, {}),
    toolbarState.blockType in blockTypeToBlockName && activeEditor === editor && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(BlockFormatDropDown, { disabled: !isEditable, blockType: toolbarState.blockType, editor: activeEditor }),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Divider, {})
    ] }),
    toolbarState.blockType === "code" && isCodeHighlighted ? /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
      !isCodeShiki && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        DropDown,
        {
          disabled: !isEditable,
          buttonClassName: "toolbar-item code-language",
          buttonLabel: (CODE_LANGUAGE_OPTIONS_PRISM.find(
            (opt) => opt[0] === (0, import_code9.normalizeCodeLanguage)(toolbarState.codeLanguage)
          ) || ["", ""])[1],
          buttonAriaLabel: "Select language",
          children: CODE_LANGUAGE_OPTIONS_PRISM.map(([value, name]) => {
            return /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
              DropDownItem,
              {
                className: `item ${dropDownActiveClass(value === toolbarState.codeLanguage)}`,
                onClick: () => onCodeLanguageSelect(value),
                children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: name })
              },
              value
            );
          })
        }
      ),
      isCodeShiki && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
          DropDown,
          {
            disabled: !isEditable,
            buttonClassName: "toolbar-item code-language",
            buttonLabel: (CODE_LANGUAGE_OPTIONS_SHIKI.find(
              (opt) => opt[0] === (0, import_code_shiki2.normalizeCodeLanguage)(toolbarState.codeLanguage)
            ) || ["", ""])[1],
            buttonAriaLabel: "Select language",
            children: CODE_LANGUAGE_OPTIONS_SHIKI.map(([value, name]) => {
              return /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
                DropDownItem,
                {
                  className: `item ${dropDownActiveClass(value === toolbarState.codeLanguage)}`,
                  onClick: () => onCodeLanguageSelect(value),
                  children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: name })
                },
                value
              );
            })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
          DropDown,
          {
            disabled: !isEditable,
            buttonClassName: "toolbar-item code-language",
            buttonLabel: (CODE_THEME_OPTIONS_SHIKI.find((opt) => opt[0] === toolbarState.codeTheme) || ["", ""])[1],
            buttonAriaLabel: "Select theme",
            children: CODE_THEME_OPTIONS_SHIKI.map(([value, name]) => {
              return /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
                DropDownItem,
                {
                  className: `item ${dropDownActiveClass(value === toolbarState.codeTheme)}`,
                  onClick: () => onCodeThemeSelect(value),
                  children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: name })
                },
                value
              );
            })
          }
        )
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        FontDropDown,
        {
          disabled: !isEditable,
          style: "font-family",
          value: toolbarState.fontFamily,
          editor: activeEditor
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Divider, {}),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        FontSize,
        {
          selectionFontSize: parseFontSizeForToolbar(toolbarState.fontSize).slice(0, -2),
          editor: activeEditor,
          disabled: !isEditable
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Divider, {}),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        "button",
        {
          disabled: !isEditable,
          onClick: (e) => dispatchFormatTextCommand("bold", isKeyboardInput(e)),
          className: `toolbar-item spaced ${toolbarState.isBold ? "active" : ""}`,
          title: `Bold (${SHORTCUTS.BOLD})`,
          type: "button",
          "aria-label": `Format text as bold. Shortcut: ${SHORTCUTS.BOLD}`,
          children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "format bold" })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        "button",
        {
          disabled: !isEditable,
          onClick: (e) => dispatchFormatTextCommand("italic", isKeyboardInput(e)),
          className: `toolbar-item spaced ${toolbarState.isItalic ? "active" : ""}`,
          title: `Italic (${SHORTCUTS.ITALIC})`,
          type: "button",
          "aria-label": `Format text as italics. Shortcut: ${SHORTCUTS.ITALIC}`,
          children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "format italic" })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        "button",
        {
          disabled: !isEditable,
          onClick: (e) => dispatchFormatTextCommand("underline", isKeyboardInput(e)),
          className: `toolbar-item spaced ${toolbarState.isUnderline ? "active" : ""}`,
          title: `Underline (${SHORTCUTS.UNDERLINE})`,
          type: "button",
          "aria-label": `Format text to underlined. Shortcut: ${SHORTCUTS.UNDERLINE}`,
          children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "format underline" })
        }
      ),
      canViewerSeeInsertCodeButton && /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        "button",
        {
          disabled: !isEditable,
          onClick: (e) => dispatchFormatTextCommand("code", isKeyboardInput(e)),
          className: `toolbar-item spaced ${toolbarState.isCode ? "active" : ""}`,
          title: `Insert code block (${SHORTCUTS.INSERT_CODE_BLOCK})`,
          type: "button",
          "aria-label": "Insert code block",
          children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "format code" })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
        "button",
        {
          disabled: !isEditable,
          onClick: insertLink,
          className: `toolbar-item spaced ${toolbarState.isLink ? "active" : ""}`,
          "aria-label": "Insert link",
          title: `Insert link (${SHORTCUTS.INSERT_LINK})`,
          type: "button",
          children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "format link" })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
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
      /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
        DropDown,
        {
          disabled: !isEditable,
          buttonClassName: "toolbar-item spaced",
          buttonLabel: "",
          buttonAriaLabel: "Formatting options for additional text styles",
          buttonIconClassName: "icon dropdown-more",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("lowercase", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isLowercase)}`,
                title: "Lowercase",
                "aria-label": "Format text to lowercase",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon lowercase" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Lowercase" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.LOWERCASE })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("uppercase", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isUppercase)}`,
                title: "Uppercase",
                "aria-label": "Format text to uppercase",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon uppercase" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Uppercase" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.UPPERCASE })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("capitalize", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isCapitalize)}`,
                title: "Capitalize",
                "aria-label": "Format text to capitalize",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon capitalize" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Capitalize" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.CAPITALIZE })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("strikethrough", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isStrikethrough)}`,
                title: "Strikethrough",
                "aria-label": "Format text with a strikethrough",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon strikethrough" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Strikethrough" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.STRIKETHROUGH })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("subscript", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isSubscript)}`,
                title: "Subscript",
                "aria-label": "Format text with a subscript",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon subscript" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Subscript" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.SUBSCRIPT })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("superscript", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isSuperscript)}`,
                title: "Superscript",
                "aria-label": "Format text with a superscript",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon superscript" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Superscript" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.SUPERSCRIPT })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
              DropDownItem,
              {
                onClick: (e) => dispatchFormatTextCommand("highlight", isKeyboardInput(e)),
                className: `item wide ${dropDownActiveClass(toolbarState.isHighlight)}`,
                title: "Highlight",
                "aria-label": "Format text with a highlight",
                children: /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon highlight" }),
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Highlight" })
                ] })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
              DropDownItem,
              {
                onClick: (e) => clearFormatting(activeEditor, isKeyboardInput(e)),
                className: "item wide",
                title: "Clear text formatting",
                "aria-label": "Clear all text formatting",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)("div", { className: "icon-text-container", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon clear" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Clear Formatting" })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "shortcut", children: SHORTCUTS.CLEAR_FORMATTING })
                ]
              }
            )
          ]
        }
      ),
      canViewerSeeInsertDropdown && /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(import_jsx_runtime58.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Divider, {}),
        /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
          DropDown,
          {
            disabled: !isEditable,
            buttonClassName: "toolbar-item spaced",
            buttonLabel: "Insert",
            buttonAriaLabel: "Insert specialized editor node",
            buttonIconClassName: "icon plus",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(DropDownItem, { onClick: () => dispatchToolbarCommand(import_LexicalHorizontalRuleNode2.INSERT_HORIZONTAL_RULE_COMMAND), className: "item", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon horizontal-rule" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Horizontal Rule" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(DropDownItem, { onClick: () => dispatchToolbarCommand(INSERT_PAGE_BREAK), className: "item", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon page-break" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Page Break" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
                DropDownItem,
                {
                  onClick: () => {
                    showModal("Insert Image", (onClose) => /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(InsertImageDialog, { activeEditor, onClose }));
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon image" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Image" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
                DropDownItem,
                {
                  onClick: () => {
                    showModal("Insert Table", (onClose) => /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(InsertTableDialog, { activeEditor, onClose }));
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon table" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Table" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
                DropDownItem,
                {
                  onClick: () => {
                    showModal("Insert Columns Layout", (onClose) => /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(InsertLayoutDialog, { activeEditor, onClose }));
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon columns" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Columns Layout" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
                DropDownItem,
                {
                  onClick: () => {
                    showModal("Insert Equation", (onClose) => /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(InsertEquationDialog, { activeEditor, onClose }));
                  },
                  className: "item",
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon equation" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Equation" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
                DropDownItem,
                {
                  onClick: () => {
                    editor.update(() => {
                      (0, import_lexical58.$addUpdateTag)(import_lexical58.SKIP_SELECTION_FOCUS_TAG);
                      const root = (0, import_lexical58.$getRoot)();
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
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon sticky" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Sticky Note" })
                  ]
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(DropDownItem, { onClick: () => dispatchToolbarCommand(INSERT_COLLAPSIBLE_COMMAND), className: "item", children: [
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon caret-right" }),
                /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Collapsible container" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
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
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: "icon calendar" }),
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: "Date" })
                  ]
                }
              ),
              EmbedConfigs.map((embedConfig) => /* @__PURE__ */ (0, import_jsx_runtime58.jsxs)(
                DropDownItem,
                {
                  onClick: () => dispatchToolbarCommand(import_LexicalAutoEmbedPlugin3.INSERT_EMBED_COMMAND, embedConfig.type),
                  className: "item",
                  children: [
                    embedConfig.icon,
                    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("span", { className: "text", children: embedConfig.contentName })
                  ]
                },
                embedConfig.type
              ))
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Divider, {}),
    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
      ElementFormatDropdown,
      {
        disabled: !isEditable,
        value: toolbarState.elementFormat,
        editor: activeEditor,
        isRTL: toolbarState.isRTL
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(Divider, {}),
    /* @__PURE__ */ (0, import_jsx_runtime58.jsx)(
      "button",
      {
        type: "button",
        onClick: toggleFullscreen,
        className: "toolbar-item spaced",
        "aria-label": isFullscreen ? "\u5168\u753B\u9762\u30E2\u30FC\u30C9\u3092\u7D42\u4E86" : "\u5168\u753B\u9762\u30E2\u30FC\u30C9",
        title: isFullscreen ? "\u5168\u753B\u9762\u30E2\u30FC\u30C9\u3092\u7D42\u4E86 (Esc)" : "\u5168\u753B\u9762\u30E2\u30FC\u30C9",
        children: /* @__PURE__ */ (0, import_jsx_runtime58.jsx)("i", { className: `format ${isFullscreen ? "fullscreen-exit" : "fullscreen"}` })
      }
    ),
    modal
  ] });
}

// src/core/Editor.tsx
init_ContentEditable2();
var import_jsx_runtime59 = require("react/jsx-runtime");
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
  const isEditable = (0, import_useLexicalEditable6.useLexicalEditable)();
  const placeholder = "\u6587\u7AE0\u3092\u5165\u529B\u3059\u308B\u524D\u306B\u662F\u975E\u300C/\u300D\u3092\u5165\u529B\u3057\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002";
  const [floatingAnchorElem, setFloatingAnchorElem] = (0, import_react67.useState)(null);
  const [isSmallWidthViewport, setIsSmallWidthViewport] = (0, import_react67.useState)(false);
  const [editor] = (0, import_LexicalComposerContext41.useLexicalComposerContext)();
  const [activeEditor, setActiveEditor] = (0, import_react67.useState)(editor);
  const [isLinkEditMode, setIsLinkEditMode] = (0, import_react67.useState)(false);
  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };
  (0, import_react67.useEffect)(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = import_utils42.CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches;
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
  return /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)(import_jsx_runtime59.Fragment, { children: [
    showToolbar && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(
      ToolbarPlugin,
      {
        editor,
        activeEditor,
        setActiveEditor,
        setIsLinkEditMode
      }
    ),
    showToolbar && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(ShortcutsPlugin, { editor: activeEditor, setIsLinkEditMode }),
    /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)("div", { className: `editor-container ${isFullscreen ? "flex-1 overflow-auto" : ""}`, children: [
      isMaxLength && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(MaxLengthPlugin, { maxLength: 30 }),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(DragDropPaste, {}),
      autoFocus && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalAutoFocusPlugin.AutoFocusPlugin, {}),
      selectionAlwaysOnDisplay && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalSelectionAlwaysOnDisplay.SelectionAlwaysOnDisplay, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalClearEditorPlugin.ClearEditorPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(ComponentPickerMenuPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(EmojisPlugin2, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(AutoEmbedPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(NewMentionsPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(EmojisPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalHashtagPlugin2.HashtagPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(LexicalAutoLinkPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(DateTimePlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalHistoryPlugin2.HistoryPlugin, { externalHistoryState: historyState }),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(
        import_LexicalRichTextPlugin2.RichTextPlugin,
        {
          contentEditable: /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("div", { className: "editor-scroller", children: /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("div", { className: "editor", ref: onRef, children: /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(LexicalContentEditable, { placeholder, placeholderClassName: "editor-placeholder" }) }) }),
          ErrorBoundary: import_LexicalErrorBoundary3.LexicalErrorBoundary
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(MarkdownPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(MarkdownPastePlugin, {}),
      isCodeHighlighted && (isCodeShiki ? /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(CodeHighlightShikiPlugin, {}) : /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(CodeHighlightPrismPlugin, {})),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalListPlugin.ListPlugin, { hasStrictIndent: listStrictIndent }),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalCheckListPlugin.CheckListPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(
        import_LexicalTablePlugin.TablePlugin,
        {
          hasCellMerge: tableCellMerge,
          hasCellBackgroundColor: tableCellBackgroundColor,
          hasHorizontalScroll: tableHorizontalScroll,
          hasTabHandler
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(TableCellResizerPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(ImagesPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(LinkPlugin, { hasLinkAttributes }),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(TwitterPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(YouTubePlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(FigmaPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalClickableLinkPlugin.ClickableLinkPlugin, { disabled: isEditable }),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(FragmentLinkPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(HorizontalRulePlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(EquationsPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(TabFocusPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalTabIndentationPlugin.TabIndentationPlugin, { maxIndent: 7 }),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(CollapsiblePlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(PageBreakPlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(LayoutPlugin, {}),
      floatingAnchorElem && /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)(import_jsx_runtime59.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(
          FloatingLinkEditorPlugin,
          {
            anchorElem: floatingAnchorElem,
            isLinkEditMode,
            setIsLinkEditMode
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(TableActionMenuPlugin, { anchorElem: floatingAnchorElem, cellMerge: true })
      ] }),
      floatingAnchorElem && !isSmallWidthViewport && /* @__PURE__ */ (0, import_jsx_runtime59.jsxs)(import_jsx_runtime59.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(DraggableBlockPlugin, { anchorElem: floatingAnchorElem }),
        /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(CodeActionMenuPlugin, { anchorElem: floatingAnchorElem }),
        /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(TableHoverActionsPlugin, { anchorElem: floatingAnchorElem }),
        /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(FloatingTextFormatToolbarPlugin, { anchorElem: floatingAnchorElem, setIsLinkEditMode })
      ] }),
      (isCharLimit || isCharLimitUtf8) && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_LexicalCharacterLimitPlugin.CharacterLimitPlugin, { charset: isCharLimit ? "UTF-16" : "UTF-8", maxLength: 5 }),
      isAutocomplete && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(AutocompletePlugin, {}),
      /* @__PURE__ */ (0, import_jsx_runtime59.jsx)("div", { children: showTableOfContents && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(TableOfContentsPlugin, {}) }),
      shouldUseLexicalContextMenu && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(ContextMenuPlugin, {}),
      shouldAllowHighlightingWithBrackets && /* @__PURE__ */ (0, import_jsx_runtime59.jsx)(SpecialTextPlugin, {})
    ] })
  ] });
}

// src/core/NotionLikeEditor.tsx
var import_html2 = require("@lexical/html");
var import_markdown5 = require("@lexical/markdown");
var import_LexicalComposerContext44 = require("@lexical/react/LexicalComposerContext");
var import_LexicalExtensionComposer = require("@lexical/react/LexicalExtensionComposer");
var import_lexical61 = require("lexical");
var import_react72 = require("react");
var import_use_debounce2 = require("use-debounce");
init_SharedHistoryContext();

// src/nodes/NotionLikeEditorNodes.ts
var import_code10 = require("@lexical/code");
var import_hashtag2 = require("@lexical/hashtag");
var import_link8 = require("@lexical/link");
var import_list4 = require("@lexical/list");
var import_mark = require("@lexical/mark");
var import_overflow = require("@lexical/overflow");
var import_LexicalHorizontalRuleNode3 = require("@lexical/react/LexicalHorizontalRuleNode");
var import_rich_text7 = require("@lexical/rich-text");
var import_table10 = require("@lexical/table");
init_DateTimeNode2();
init_EmojiNode();
init_EquationNode();
init_ImageNode2();
init_KeywordNode();
init_MentionNode();
init_StickyNode2();
var NotionLikeEditorNodes = [
  import_rich_text7.HeadingNode,
  import_list4.ListNode,
  import_list4.ListItemNode,
  import_rich_text7.QuoteNode,
  import_code10.CodeNode,
  import_table10.TableNode,
  import_table10.TableCellNode,
  import_table10.TableRowNode,
  import_hashtag2.HashtagNode,
  import_code10.CodeHighlightNode,
  import_link8.AutoLinkNode,
  import_link8.LinkNode,
  import_overflow.OverflowNode,
  StickyNode,
  ImageNode,
  MentionNode,
  EmojiNode,
  EquationNode,
  AutocompleteNode,
  KeywordNode,
  import_LexicalHorizontalRuleNode3.HorizontalRuleNode,
  TweetNode,
  YouTubeNode,
  FigmaNode,
  import_mark.MarkNode,
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
var import_markdown4 = require("@lexical/markdown");
var import_LexicalComposerContext42 = require("@lexical/react/LexicalComposerContext");
var import_lexical59 = require("lexical");
var import_react68 = require("react");
var INSERT_MARKDOWN_COMMAND = (0, import_lexical59.createCommand)("INSERT_MARKDOWN_COMMAND");
function InsertMarkdownPlugin() {
  const [editor] = (0, import_LexicalComposerContext42.useLexicalComposerContext)();
  (0, import_react68.useEffect)(() => {
    return editor.registerCommand(
      INSERT_MARKDOWN_COMMAND,
      (markdown) => {
        if (!markdown || markdown.trim().length === 0) {
          return false;
        }
        editor.update(() => {
          const currentMarkdown = (0, import_markdown4.$convertToMarkdownString)(PLAYGROUND_TRANSFORMERS2);
          const combinedMarkdown = currentMarkdown.trim() ? `${currentMarkdown.trim()}

${markdown}` : markdown;
          const root = (0, import_lexical59.$getRoot)();
          root.clear();
          (0, import_markdown4.$convertFromMarkdownString)(combinedMarkdown, PLAYGROUND_TRANSFORMERS2);
          const newLastChild = root.getLastChild();
          newLastChild?.selectEnd();
        });
        return true;
      },
      import_lexical59.COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);
  return null;
}

// src/plugins/OnChangePlugin/index.tsx
var import_LexicalComposerContext43 = require("@lexical/react/LexicalComposerContext");
var import_react69 = require("react");
function OnChangePlugin({
  onChange,
  ignoreHistoryMergeTagChange = true,
  ignoreSelectionChange = true
}) {
  const [editor] = (0, import_LexicalComposerContext43.useLexicalComposerContext)();
  (0, import_react69.useEffect)(() => {
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
var import_react71 = require("react");

// src/hooks/useReport.ts
var import_react70 = require("react");
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
  const timer = (0, import_react70.useRef)(null);
  const cleanup = (0, import_react70.useCallback)(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (document.body) {
      document.body.removeChild(getElement());
    }
  }, []);
  (0, import_react70.useEffect)(() => {
    return cleanup;
  }, [cleanup]);
  return (0, import_react70.useCallback)(
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
  (0, import_react71.useEffect)(() => {
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
var import_lexical60 = require("lexical");
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
  for (const [tag, fn] of Object.entries(import_lexical60.TextNode.importDOM() || {})) {
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
                if ((0, import_lexical60.$isTextNode)(textNode)) {
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
      import_lexical60.ParagraphNode,
      (editor, target) => {
        const output = target.exportDOM(editor);
        if ((0, import_lexical60.isHTMLElement)(output.element) && output.element.tagName === "P") {
          const after = output.after;
          return {
            ...output,
            after: (generatedElement) => {
              if (after) {
                generatedElement = after(generatedElement);
              }
              if ((0, import_lexical60.isHTMLElement)(generatedElement) && generatedElement.tagName === "P") {
                for (const childNode of generatedElement.childNodes) {
                  if ((0, import_lexical60.isBlockDomNode)(childNode)) {
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
var import_jsx_runtime60 = require("react/jsx-runtime");
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
  isCodeShiki = true,
  codeShikiTheme = "github-light",
  imageUploadHandler,
  customLinkMatchers,
  onEditorReady,
  extraPlugins,
  extraComponentPickerOptions
}) {
  const settings = (0, import_react72.useMemo)(
    () => ({
      ...INITIAL_SETTINGS,
      showToolbar,
      autoFocus,
      measureTypingPerf,
      isCodeShiki,
      codeShikiTheme
    }),
    [showToolbar, measureTypingPerf, autoFocus, isCodeShiki, codeShikiTheme]
  );
  const app = (0, import_react72.useMemo)(
    () => (0, import_lexical61.defineExtension)({
      $initialEditorState: initialEditorState ? initialEditorState : initialMarkdown ? () => {
        (0, import_markdown5.$convertFromMarkdownString)(initialMarkdown, PLAYGROUND_TRANSFORMERS2);
      } : void 0,
      html: buildHTMLConfig(),
      name: "pecus/NotionLikeEditor",
      namespace: "NotionLikeEditor",
      nodes: NotionLikeEditorNodes_default,
      theme: NotionLikeEditorTheme_default
    }),
    [initialEditorState, initialMarkdown]
  );
  const debouncedOnChange = (0, import_use_debounce2.useDebouncedCallback)((editorState) => {
    if (onChange) {
      const json = JSON.stringify(editorState.toJSON());
      onChange(json);
    }
  }, debounceMs);
  const debouncedOnChangePlainText = (0, import_use_debounce2.useDebouncedCallback)((editorState) => {
    if (onChangePlainText) {
      editorState.read(() => {
        const root = (0, import_lexical61.$getRoot)();
        const plainText = root.getTextContent();
        onChangePlainText(plainText);
      });
    }
  }, debounceMs);
  const debouncedOnChangeHtml = (0, import_use_debounce2.useDebouncedCallback)((editorState, editor) => {
    if (onChangeHtml) {
      editorState.read(() => {
        const html = (0, import_html2.$generateHtmlFromNodes)(editor);
        onChangeHtml(html);
      });
    }
  }, debounceMs);
  const debouncedOnChangeMarkdown = (0, import_use_debounce2.useDebouncedCallback)((editorState) => {
    if (onChangeMarkdown) {
      editorState.read(() => {
        const markdown = (0, import_markdown5.$convertToMarkdownString)(import_markdown5.TRANSFORMERS);
        onChangeMarkdown(markdown);
      });
    }
  }, debounceMs);
  const handleChange = (0, import_react72.useCallback)(
    (editorState, editor) => {
      debouncedOnChange(editorState);
      debouncedOnChangePlainText(editorState);
      debouncedOnChangeHtml(editorState, editor);
      debouncedOnChangeMarkdown(editorState);
    },
    [debouncedOnChange, debouncedOnChangePlainText, debouncedOnChangeHtml, debouncedOnChangeMarkdown]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(FullscreenProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(
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
  return /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("div", { className: `notion-like-editor ${isFullscreen ? "fixed inset-0 z-9999 bg-base-100 flex flex-col" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(FlashMessageContext, { children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(SettingsContext, { initialSettings: settings, children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(ImageUploadProvider, { handler: imageUploadHandler ?? null, children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(AutoLinkProvider, { customMatchers: customLinkMatchers, children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(import_LexicalExtensionComposer.LexicalExtensionComposer, { extension: app, contentEditable: null, children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(ComponentPickerProvider, { extraOptions: extraComponentPickerOptions, children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(SharedHistoryContext, { children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(TableContext, { children: /* @__PURE__ */ (0, import_jsx_runtime60.jsxs)(ToolbarContext, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime60.jsx)("div", { className: `editor-shell ${isFullscreen ? "flex-1 flex flex-col overflow-hidden" : ""}`, children: /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(Editor, { isFullscreen }) }),
    (onChange || onChangePlainText || onChangeHtml || onChangeMarkdown) && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(OnChangePlugin, { onChange: handleChange }),
    measureTypingPerf && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(TypingPerfPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(InsertMarkdownPlugin, {}),
    onEditorReady && /* @__PURE__ */ (0, import_jsx_runtime60.jsx)(EditorReadyPlugin, { onReady: onEditorReady }),
    extraPlugins
  ] }) }) }) }) }) }) }) }) }) });
}
function EditorReadyPlugin({ onReady }) {
  const [editor] = (0, import_LexicalComposerContext44.useLexicalComposerContext)();
  (0, import_react72.useEffect)(() => {
    onReady(editor);
  }, [editor, onReady]);
  return null;
}

// src/core/NotionLikeViewer.tsx
var import_LexicalExtensionComposer2 = require("@lexical/react/LexicalExtensionComposer");
var import_lexical62 = require("lexical");
var import_react74 = require("react");

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
var import_LexicalCheckListPlugin2 = require("@lexical/react/LexicalCheckListPlugin");
var import_LexicalClickableLinkPlugin2 = require("@lexical/react/LexicalClickableLinkPlugin");
var import_LexicalContentEditable2 = require("@lexical/react/LexicalContentEditable");
var import_LexicalErrorBoundary4 = require("@lexical/react/LexicalErrorBoundary");
var import_LexicalListPlugin2 = require("@lexical/react/LexicalListPlugin");
var import_LexicalRichTextPlugin3 = require("@lexical/react/LexicalRichTextPlugin");
var import_LexicalTabIndentationPlugin2 = require("@lexical/react/LexicalTabIndentationPlugin");
var import_LexicalTablePlugin2 = require("@lexical/react/LexicalTablePlugin");
var import_utils43 = require("@lexical/utils");
var import_react73 = require("react");
init_LinkPlugin();
var import_jsx_runtime61 = require("react/jsx-runtime");
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
  const [isSmallWidthViewport, setIsSmallWidthViewport] = (0, import_react73.useState)(false);
  const [floatingAnchorElem, setFloatingAnchorElem] = (0, import_react73.useState)(null);
  const onRef = (_floatingAnchorElem) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };
  (0, import_react73.useEffect)(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport = import_utils43.CAN_USE_DOM && window.matchMedia("(max-width: 1025px)").matches;
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
  return /* @__PURE__ */ (0, import_jsx_runtime61.jsxs)("div", { className: "editor-container", children: [
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(
      import_LexicalRichTextPlugin3.RichTextPlugin,
      {
        contentEditable: /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("div", { className: "editor-scroller", children: /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("div", { className: "editor", ref: onRef, children: /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(import_LexicalContentEditable2.ContentEditable, {}) }) }),
        ErrorBoundary: import_LexicalErrorBoundary4.LexicalErrorBoundary
      }
    ),
    isCodeHighlighted && (isCodeShiki ? /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(CodeHighlightShikiPlugin, {}) : /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(CodeHighlightPrismPlugin, {})),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(import_LexicalListPlugin2.ListPlugin, { hasStrictIndent: listStrictIndent }),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(import_LexicalCheckListPlugin2.CheckListPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(
      import_LexicalTablePlugin2.TablePlugin,
      {
        hasCellMerge: tableCellMerge,
        hasCellBackgroundColor: tableCellBackgroundColor,
        hasHorizontalScroll: tableHorizontalScroll,
        hasTabHandler
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(TableCellResizerPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(ImagesPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(LinkPlugin, { hasLinkAttributes }),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(LexicalAutoLinkPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(TwitterPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(YouTubePlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(FigmaPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(import_LexicalClickableLinkPlugin2.ClickableLinkPlugin, { disabled: false }),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(FragmentLinkPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(HorizontalRulePlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(EquationsPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(TabFocusPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(import_LexicalTabIndentationPlugin2.TabIndentationPlugin, { maxIndent: 7 }),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(CollapsiblePlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(PageBreakPlugin, {}),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(LayoutPlugin, {}),
    floatingAnchorElem && /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(CodeActionMenuPlugin, { anchorElem: floatingAnchorElem, showOnlyCopy: true }),
    /* @__PURE__ */ (0, import_jsx_runtime61.jsx)("div", { children: showTableOfContents && /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(TableOfContentsPlugin, {}) }),
    shouldAllowHighlightingWithBrackets && /* @__PURE__ */ (0, import_jsx_runtime61.jsx)(SpecialTextPlugin, {})
  ] });
}

// src/core/NotionLikeViewer.tsx
var import_jsx_runtime62 = require("react/jsx-runtime");
function NotionLikeViewer({
  initialViewerState,
  isCodeShiki = true,
  codeShikiTheme = "github-light",
  customLinkMatchers
}) {
  const settings = (0, import_react74.useMemo)(
    () => ({
      ...INITIAL_SETTINGS,
      isCodeShiki,
      codeShikiTheme
    }),
    [isCodeShiki, codeShikiTheme]
  );
  const app = (0, import_react74.useMemo)(
    () => (0, import_lexical62.defineExtension)({
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
  return /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("div", { className: "notion-like-editor", children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(SettingsContext, { initialSettings: settings, children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(AutoLinkProvider, { customMatchers: customLinkMatchers, children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(import_LexicalExtensionComposer2.LexicalExtensionComposer, { extension: app, contentEditable: null, children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(TableContext, { children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)("div", { className: "viewer-shell", children: /* @__PURE__ */ (0, import_jsx_runtime62.jsx)(Viewer, {}) }) }) }) }) }) });
}

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
init_NotionLikeEditorTheme2();
init_StickyEditorTheme2();
init_ContentEditable2();
init_EquationEditor2();
init_ImageResizer();
init_KatexRenderer();

// src/ui/Select.tsx
var import_react75 = require("react");
var import_jsx_runtime63 = require("react/jsx-runtime");
function generateId3(label) {
  return `input-${label.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).substring(2, 11)}`;
}
function Select({ children, label, className, ...other }) {
  const [selectId] = (0, import_react75.useState)(generateId3(label));
  return /* @__PURE__ */ (0, import_jsx_runtime63.jsxs)("div", { className: "Input__wrapper", children: [
    /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("label", { style: { marginTop: "-1em" }, className: "Input__label", htmlFor: selectId, children: label }),
    /* @__PURE__ */ (0, import_jsx_runtime63.jsx)("select", { id: selectId, ...other, className: className || "editor-select", children })
  ] });
}

// src/ui/Switch.tsx
var import_react76 = require("react");
var import_jsx_runtime64 = require("react/jsx-runtime");
function Switch({
  checked,
  onClick,
  text,
  id
}) {
  const buttonId = (0, import_react76.useMemo)(() => `id_${Math.floor(Math.random() * 1e4)}`, []);
  return /* @__PURE__ */ (0, import_jsx_runtime64.jsxs)("div", { className: "switch", id, children: [
    /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("label", { htmlFor: buttonId, children: text }),
    /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("button", { type: "button", role: "switch", "aria-checked": checked, id: buttonId, onClick, children: /* @__PURE__ */ (0, import_jsx_runtime64.jsx)("span", {}) })
  ] });
}

// src/index.ts
init_url();
var PACKAGE_VERSION = "0.1.0";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
  ContentEditable,
  DateTimeNode,
  DialogActions,
  DialogButtonsList,
  DropDown,
  DropDownItem,
  DropdownColorPicker,
  Editor,
  EmojiNode,
  EquationEditor,
  EquationNode,
  FigmaNode,
  FileInput,
  FlashMessage,
  FlashMessageContext,
  FragmentLinkPlugin,
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
  NotionLikeEditorNodes,
  NotionLikeEditorTheme,
  NotionLikeViewer,
  NotionLikeViewerTheme,
  PACKAGE_VERSION,
  PLAYGROUND_TRANSFORMERS,
  PageBreakNode,
  Select,
  SettingsContext,
  SharedHistoryContext,
  SpecialTextNode,
  StickyEditorTheme,
  StickyNode,
  Switch,
  TableContext,
  TextInput,
  ToolbarContext,
  TweetNode,
  Viewer,
  YouTubeNode,
  blockTypeToBlockName,
  emojiList,
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
});
//# sourceMappingURL=index.js.map
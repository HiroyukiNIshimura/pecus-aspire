var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

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
import { isHTMLElement } from "lexical";
import { forwardRef } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
function EquationEditor({ equation, setEquation, inline }, forwardedRef) {
  const onChange = (event) => {
    setEquation(event.target.value);
  };
  return inline && isHTMLElement(forwardedRef) ? /* @__PURE__ */ jsxs("span", { className: "EquationEditor_inputBackground", children: [
    /* @__PURE__ */ jsx("span", { className: "EquationEditor_dollarSign", children: "$" }),
    /* @__PURE__ */ jsx(
      "input",
      {
        className: "EquationEditor_inlineEditor",
        value: equation,
        onChange,
        ref: forwardedRef
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "EquationEditor_dollarSign", children: "$" })
  ] }) : /* @__PURE__ */ jsxs("div", { className: "EquationEditor_inputBackground", children: [
    /* @__PURE__ */ jsx("span", { className: "EquationEditor_dollarSign", children: "$$\n" }),
    /* @__PURE__ */ jsx(
      "textarea",
      {
        className: "EquationEditor_blockEditor",
        value: equation,
        onChange,
        ref: forwardedRef
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "EquationEditor_dollarSign", children: "\n$$" })
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
import { useEffect, useRef } from "react";
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function KatexRenderer({
  equation,
  inline,
  onDoubleClick
}) {
  const katexElementRef = useRef(null);
  useEffect(() => {
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
    /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsx2(
        "img",
        {
          src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          width: "0",
          height: "0",
          alt: ""
        }
      ),
      /* @__PURE__ */ jsx2("span", { role: "button", tabIndex: -1, onDoubleClick, ref: katexElementRef }),
      /* @__PURE__ */ jsx2(
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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND
} from "lexical";
import { useCallback, useEffect as useEffect2, useRef as useRef2, useState } from "react";
import { Fragment as Fragment2, jsx as jsx3 } from "react/jsx-runtime";
function EquationComponent({ equation, inline, nodeKey }) {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [equationValue, setEquationValue] = useState(equation);
  const [showEquationEditor, setShowEquationEditor] = useState(false);
  const inputRef = useRef2(null);
  const onHide = useCallback(
    (restoreSelection) => {
      setShowEquationEditor(false);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
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
  useEffect2(() => {
    if (!showEquationEditor && equationValue !== equation) {
      setEquationValue(equation);
    }
  }, [showEquationEditor, equation, equationValue]);
  useEffect2(() => {
    if (!isEditable) {
      return;
    }
    if (showEquationEditor) {
      return mergeRegister(
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
          const selection = $getSelection();
          return $isNodeSelection(selection) && selection.has(nodeKey) && selection.getNodes().length === 1;
        });
        if (isSelected) {
          setShowEquationEditor(true);
        }
      });
    }
  }, [editor, nodeKey, onHide, showEquationEditor, isEditable]);
  return /* @__PURE__ */ jsx3(Fragment2, { children: showEquationEditor && isEditable ? /* @__PURE__ */ jsx3(EquationEditor_default, { equation: equationValue, setEquation: setEquationValue, inline, ref: inputRef }) : /* @__PURE__ */ jsx3(m, { onError: (e) => editor._onError(e), fallback: null, children: /* @__PURE__ */ jsx3(
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
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import * as React from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
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
    EquationComponent2 = React.lazy(() => Promise.resolve().then(() => (init_EquationComponent(), EquationComponent_exports)));
    EquationNode = class _EquationNode extends DecoratorNode {
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
        return /* @__PURE__ */ jsx4(EquationComponent2, { equation: this.__equation, inline: this.__inline, nodeKey: this.__key });
      }
    };
  }
});

// src/nodes/EmojiNode.tsx
import { $applyNodeReplacement as $applyNodeReplacement2, TextNode } from "lexical";
function $createEmojiNode(className, emojiText) {
  const node = new EmojiNode(className, emojiText).setMode("token");
  return $applyNodeReplacement2(node);
}
var EmojiNode;
var init_EmojiNode = __esm({
  "src/nodes/EmojiNode.tsx"() {
    "use strict";
    EmojiNode = class _EmojiNode extends TextNode {
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
import { $applyNodeReplacement as $applyNodeReplacement3, TextNode as TextNode2 } from "lexical";
function $createKeywordNode(keyword = "") {
  return $applyNodeReplacement3(new KeywordNode(keyword));
}
var KeywordNode;
var init_KeywordNode = __esm({
  "src/nodes/KeywordNode.ts"() {
    "use strict";
    KeywordNode = class _KeywordNode extends TextNode2 {
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
import { createContext, useContext, useMemo } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var Context, useSharedHistoryContext;
var init_SharedHistoryContext = __esm({
  "src/context/SharedHistoryContext.tsx"() {
    "use strict";
    Context = createContext({});
    useSharedHistoryContext = () => {
      return useContext(Context);
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
import { useLexicalComposerContext as useLexicalComposerContext2 } from "@lexical/react/LexicalComposerContext";
import { TextNode as TextNode3 } from "lexical";
import { useEffect as useEffect3 } from "react";
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
  useEffect3(() => {
    if (!editor.hasNodes([EmojiNode])) {
      throw new Error("EmojisPlugin: EmojiNode not registered on editor");
    }
    return editor.registerNodeTransform(TextNode3, $textNodeTransform);
  }, [editor]);
}
function EmojisPlugin() {
  const [editor] = useLexicalComposerContext2();
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
import { jsx as jsx6 } from "react/jsx-runtime";
function LinkPlugin({ hasLinkAttributes = false }) {
  return /* @__PURE__ */ jsx6(
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
  TextNode as TextNode4
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
var mentionStyle, MentionNode;
var init_MentionNode = __esm({
  "src/nodes/MentionNode.ts"() {
    "use strict";
    mentionStyle = "background-color: rgba(24, 119, 232, 0.2)";
    MentionNode = class _MentionNode extends TextNode4 {
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
import { useLexicalComposerContext as useLexicalComposerContext3 } from "@lexical/react/LexicalComposerContext";
import { MenuOption } from "@lexical/react/LexicalNodeMenuPlugin";
import {
  LexicalTypeaheadMenuPlugin,
  useBasicTypeaheadTriggerMatch
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { useCallback as useCallback2, useEffect as useEffect4, useMemo as useMemo2, useState as useState2 } from "react";
import * as ReactDOM from "react-dom";
import { jsx as jsx7, jsxs as jsxs3 } from "react/jsx-runtime";
function useMentionLookupService(mentionString) {
  const [results, setResults] = useState2([]);
  useEffect4(() => {
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
  return /* @__PURE__ */ jsxs3(
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
        /* @__PURE__ */ jsx7("span", { className: "text", children: option.name })
      ]
    },
    option.key
  );
}
function NewMentionsPlugin() {
  const [editor] = useLexicalComposerContext3();
  const [queryString, setQueryString] = useState2(null);
  const results = useMentionLookupService(queryString);
  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0
  });
  const options = useMemo2(
    () => results.map((result) => new MentionTypeaheadOption(result, /* @__PURE__ */ jsx7("i", { className: "icon user" }))).slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results]
  );
  const onSelectOption = useCallback2(
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
  const checkForMentionMatch = useCallback2(
    (text) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor]
  );
  return /* @__PURE__ */ jsx7(
    LexicalTypeaheadMenuPlugin,
    {
      onQueryChange: setQueryString,
      onSelectOption,
      triggerFn: checkForMentionMatch,
      options,
      menuRenderFn: (anchorElementRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => anchorElementRef.current && results.length ? ReactDOM.createPortal(
        /* @__PURE__ */ jsx7("div", { className: "notion-like-editor typeahead-popover mentions-menu", children: /* @__PURE__ */ jsx7("ul", { children: options.map((option, i) => /* @__PURE__ */ jsx7(
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
import { jsx as jsx8 } from "react/jsx-runtime";
function LexicalContentEditable({ className, placeholder, placeholderClassName }) {
  return /* @__PURE__ */ jsx8(
    ContentEditable,
    {
      className: className ?? "ContentEditable__root",
      "aria-placeholder": placeholder,
      placeholder: /* @__PURE__ */ jsx8("div", { className: placeholderClassName ?? "ContentEditable__placeholder", children: placeholder })
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
import { useRef as useRef3 } from "react";
import { jsx as jsx9, jsxs as jsxs4 } from "react/jsx-runtime";
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
  const controlWrapperRef = useRef3(null);
  const userSelect = useRef3({
    priority: "",
    value: "default"
  });
  const positioningRef = useRef3({
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
  return /* @__PURE__ */ jsxs4("div", { ref: controlWrapperRef, children: [
    !showCaption && captionsEnabled && /* @__PURE__ */ jsx9(
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
    /* @__PURE__ */ jsx9(
      "div",
      {
        className: "image-resizer image-resizer-n",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.north);
        }
      }
    ),
    /* @__PURE__ */ jsx9(
      "div",
      {
        className: "image-resizer image-resizer-ne",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.north | Direction.east);
        }
      }
    ),
    /* @__PURE__ */ jsx9(
      "div",
      {
        className: "image-resizer image-resizer-e",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.east);
        }
      }
    ),
    /* @__PURE__ */ jsx9(
      "div",
      {
        className: "image-resizer image-resizer-se",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south | Direction.east);
        }
      }
    ),
    /* @__PURE__ */ jsx9(
      "div",
      {
        className: "image-resizer image-resizer-s",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south);
        }
      }
    ),
    /* @__PURE__ */ jsx9(
      "div",
      {
        className: "image-resizer image-resizer-sw",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.south | Direction.west);
        }
      }
    ),
    /* @__PURE__ */ jsx9(
      "div",
      {
        className: "image-resizer image-resizer-w",
        onPointerDown: (event) => {
          handlePointerDown(event, Direction.west);
        }
      }
    ),
    /* @__PURE__ */ jsx9(
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
import { useLexicalComposerContext as useLexicalComposerContext4 } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { LexicalNestedComposer } from "@lexical/react/LexicalNestedComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalEditable as useLexicalEditable2 } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister as mergeRegister2 } from "@lexical/utils";
import {
  $getNodeByKey as $getNodeByKey2,
  $getRoot,
  $getSelection as $getSelection2,
  $isNodeSelection as $isNodeSelection2,
  $isRangeSelection,
  $setSelection,
  BLUR_COMMAND,
  CLICK_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGSTART_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND as KEY_ESCAPE_COMMAND2,
  SELECTION_CHANGE_COMMAND as SELECTION_CHANGE_COMMAND2
} from "lexical";
import { Suspense, useCallback as useCallback3, useEffect as useEffect5, useMemo as useMemo3, useRef as useRef4, useState as useState3 } from "react";
import { jsx as jsx10, jsxs as jsxs5 } from "react/jsx-runtime";
function DisableCaptionOnBlur({ setShowCaption }) {
  const [editor] = useLexicalComposerContext4();
  useEffect5(
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
  useEffect5(() => {
    if (status.error) {
      onError();
    }
  }, [status.error, onError]);
  if (status.error) {
    return /* @__PURE__ */ jsx10(BrokenImage, {});
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
  return /* @__PURE__ */ jsx10(
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
  return /* @__PURE__ */ jsx10(
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
  const imageRef = useRef4(null);
  const buttonRef = useRef4(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState3(false);
  const [editor] = useLexicalComposerContext4();
  const activeEditorRef = useRef4(null);
  const [isLoadError, setIsLoadError] = useState3(false);
  const isEditable = useLexicalEditable2();
  const isInNodeSelection = useMemo3(
    () => isSelected && editor.getEditorState().read(() => {
      const selection = $getSelection2();
      return $isNodeSelection2(selection) && selection.has(nodeKey);
    }),
    [editor, isSelected, nodeKey]
  );
  const $onEnter = useCallback3(
    (event) => {
      const latestSelection = $getSelection2();
      const buttonElem = buttonRef.current;
      if ($isNodeSelection2(latestSelection) && latestSelection.has(nodeKey) && latestSelection.getNodes().length === 1) {
        if (showCaption) {
          $setSelection(null);
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
  const $onEscape = useCallback3(
    (event) => {
      if (activeEditorRef.current === caption || buttonRef.current === event.target) {
        $setSelection(null);
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
  const onClick = useCallback3(
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
  const onRightClick = useCallback3(
    (event) => {
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection2();
        const domElement = event.target;
        if (domElement.tagName === "IMG" && $isRangeSelection(latestSelection) && latestSelection.getNodes().length === 1) {
          editor.dispatchCommand(RIGHT_CLICK_IMAGE_COMMAND, event);
        }
      });
    },
    [editor]
  );
  useEffect5(() => {
    return mergeRegister2(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND2,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW
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
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);
  useEffect5(() => {
    let rootCleanup = noop;
    return mergeRegister2(
      editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(RIGHT_CLICK_IMAGE_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ENTER_COMMAND, $onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND2, $onEscape, COMMAND_PRIORITY_LOW),
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
      const node = $getNodeByKey2(nodeKey);
      if ($isImageNode(node)) {
        node.setShowCaption(show);
        if (show) {
          node.__caption.update(() => {
            if (!$getSelection2()) {
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
      const node = $getNodeByKey2(nodeKey);
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
  return /* @__PURE__ */ jsxs5(Suspense, { fallback: null, children: [
    /* @__PURE__ */ jsx10("div", { draggable, children: isLoadError ? /* @__PURE__ */ jsx10(BrokenImage, {}) : /* @__PURE__ */ jsx10(
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
    showCaption && /* @__PURE__ */ jsx10("div", { className: "image-caption-container", children: /* @__PURE__ */ jsxs5(LexicalNestedComposer, { initialEditor: caption, children: [
      /* @__PURE__ */ jsx10(DisableCaptionOnBlur, { setShowCaption }),
      /* @__PURE__ */ jsx10(NewMentionsPlugin, {}),
      /* @__PURE__ */ jsx10(LinkPlugin, {}),
      /* @__PURE__ */ jsx10(EmojisPlugin, {}),
      /* @__PURE__ */ jsx10(HashtagPlugin, {}),
      /* @__PURE__ */ jsx10(
        RichTextPlugin,
        {
          contentEditable: /* @__PURE__ */ jsx10(
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
    resizable && isInNodeSelection && isFocused && /* @__PURE__ */ jsx10(
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
  $isElementNode,
  $isParagraphNode,
  $selectAll,
  $setSelection as $setSelection2,
  createEditor,
  DecoratorNode as DecoratorNode2,
  LineBreakNode,
  ParagraphNode,
  RootNode,
  SKIP_DOM_SELECTION_TAG,
  TextNode as TextNode5
} from "lexical";
import * as React2 from "react";
import { jsx as jsx11 } from "react/jsx-runtime";
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
    if (!$isElementNode(origin)) {
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
    ImageComponent2 = React2.lazy(() => Promise.resolve().then(() => (init_ImageComponent(), ImageComponent_exports)));
    ImageNode = class _ImageNode extends DecoratorNode2 {
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
                          $setSelection2(null);
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
          nodes: [RootNode, TextNode5, LineBreakNode, ParagraphNode, LinkNode, EmojiNode, HashtagNode, KeywordNode]
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
        const theme = config.theme;
        const className = theme.image;
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
        return /* @__PURE__ */ jsx11(
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

// src/transformers/markdown-transformers.ts
init_EquationNode();
init_ImageNode2();
import { $createHorizontalRuleNode, $isHorizontalRuleNode, HorizontalRuleNode } from "@lexical/extension";
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
  TableCellNode,
  TableNode,
  TableRowNode
} from "@lexical/table";
import { $createTextNode, $isParagraphNode as $isParagraphNode2, $isTextNode } from "lexical";

// src/nodes/TweetNode.tsx
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import { DecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import { useCallback as useCallback4, useEffect as useEffect6, useRef as useRef5, useState as useState4 } from "react";
import { jsx as jsx12, jsxs as jsxs6 } from "react/jsx-runtime";
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
  const containerRef = useRef5(null);
  const previousTweetIDRef = useRef5("");
  const [isTweetLoading, setIsTweetLoading] = useState4(false);
  const createTweet = useCallback4(async () => {
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
  useEffect6(() => {
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
  return /* @__PURE__ */ jsxs6(BlockWithAlignableContents, { className, format, nodeKey, children: [
    isTweetLoading ? loadingComponent : null,
    /* @__PURE__ */ jsx12("div", { style: { display: "inline-block", width: "550px" }, ref: containerRef })
  ] });
}
var TweetNode = class _TweetNode extends DecoratorBlockNode {
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
    return /* @__PURE__ */ jsx12(
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
  dependencies: [HorizontalRuleNode],
  export: (node) => {
    return $isHorizontalRuleNode(node) ? "***" : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();
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
      textNode.replace($createTextNode(emoji));
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
  dependencies: [TableNode, TableRowNode, TableCellNode],
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
      if (!$isParagraphNode2(sibling)) {
        break;
      }
      if (sibling.getChildrenSize() !== 1) {
        break;
      }
      const firstChild = sibling.getFirstChild();
      if (!$isTextNode(firstChild)) {
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
export {
  EMOJI,
  EQUATION,
  HR,
  IMAGE,
  PLAYGROUND_TRANSFORMERS,
  TABLE,
  TWEET,
  normalizeListIndentation
};
//# sourceMappingURL=transformers.mjs.map
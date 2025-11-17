"use client";

import Accordion from "@yoopta/accordion";
import ActionMenuList, {
  DefaultActionMenuRender,
} from "@yoopta/action-menu-list";
import Blockquote from "@yoopta/blockquote";
import Callout from "@yoopta/callout";
import Code from "@yoopta/code";
import Divider from "@yoopta/divider";
import YooptaEditor, {
  createYooptaEditor,
  YooptaPlugin,
  type YooptaContentValue,
  type YooptaOnChangeOptions,
} from "@yoopta/editor";
import Embed from "@yoopta/embed";
import File from "@yoopta/file";
import { HeadingOne, HeadingThree, HeadingTwo } from "@yoopta/headings";
import Image from "@yoopta/image";
import Link from "@yoopta/link";
import LinkTool, { DefaultLinkToolRender } from "@yoopta/link-tool";
import { BulletedList, NumberedList, TodoList } from "@yoopta/lists";
import {
  Bold,
  CodeMark,
  Highlight,
  Italic,
  Strike,
  Underline,
} from "@yoopta/marks";
import Paragraph from "@yoopta/paragraph";
import Table from "@yoopta/table";
import Toolbar, { DefaultToolbarRender } from "@yoopta/toolbar";
import Video from "@yoopta/video";
import { useMemo, useRef, useState } from "react";

const plugins: YooptaPlugin<any, any>[] = [
  Paragraph,
  Table,
  Divider.extend({
    elementProps: {
      divider: (props) => ({
        ...props,
        color: "#007aff",
      }),
    },
  }),
  Accordion,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  Callout,
  NumberedList,
  BulletedList,
  TodoList,
  Code,
  Link,
  Embed,
  Image.extend({
    options: {
      async onUpload(file) {
        const data = {
          secure_url:
            "https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/sample.jpg",
          width: 300,
          height: 200,
        };

        return {
          src: data.secure_url,
          alt: "cloudinary",
          sizes: {
            width: data.width,
            height: data.height,
          },
        };
      },
    },
  }),
  Video.extend({
    options: {
      onUpload: async (file) => {
        const data = {
          secure_url:
            "https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/sample.jpg",
          width: 300,
          height: 200,
        };
        return {
          src: data.secure_url,
          alt: "cloudinary",
          sizes: {
            width: data.width,
            height: data.height,
          },
        };
      },
      onUploadPoster: async (file) => {
        const data = {
          secure_url:
            "https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fill/sample.jpg",
          width: 300,
          height: 200,
        };
        return data.secure_url;
      },
    },
  }),
  File.extend({
    options: {
      onUpload: async (file) => {
        const response = {
          secure_url: "https://res.cloudinary.com/demo/image/upload/sample.pdf",
          format: "pdf",
          name: "sample",
          bytes: 12345,
        };
        return {
          src: response.secure_url,
          format: response.format,
          name: response.name,
          size: response.bytes,
        };
      },
    },
  }),
];

const TOOLS = {
  ActionMenu: {
    render: DefaultActionMenuRender,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: DefaultToolbarRender,
    tool: Toolbar,
  },
  LinkTool: {
    render: DefaultLinkToolRender,
    tool: LinkTool,
  },
};

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

interface NotionEditorProps {
  onChange?: (
    newValue: YooptaContentValue,
    options: YooptaOnChangeOptions,
  ) => void;
  value?: YooptaContentValue;
}

//https://github.com/yoopta-editor/Yoopta-Editor/tree/master
export default function NotionEditor({
  onChange: onChangeFromProps,
  value: valueFromProps,
}: NotionEditorProps) {
  const [value, setValue] = useState<YooptaContentValue | undefined>(
    valueFromProps,
  );
  const editor = useMemo(() => createYooptaEditor(), []);

  const [theme, setTheme] = useState("dark");

  const onChange = (
    newValue: YooptaContentValue,
    options: YooptaOnChangeOptions,
  ) => {
    setValue(newValue);
    onChangeFromProps?.(newValue, options);
  };

  return (
    <div className={`max-w-4xl mx-auto ${theme === "dark" ? "dark" : ""}`}>
      <YooptaEditor
        editor={editor}
        plugins={plugins}
        tools={TOOLS}
        marks={MARKS}
        value={value}
        onChange={onChange}
        autoFocus
        width={800}
      />
    </div>
  );
}

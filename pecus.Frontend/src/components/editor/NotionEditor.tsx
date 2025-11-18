"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { useEffect, useMemo, useState } from "react";

interface NotionEditorProps  {
    onChange?: (value: string) => void;
    theme?: "light" | "dark";
    editable?: boolean;
    value?: string | null;
};


export default function NotionEditor({ onChange, theme, editable = true, value }: NotionEditorProps) {

    const [blocks, setBlocks] = useState<PartialBlock[] | "loading" | undefined>( "loading");

    // If caller doesn't provide a theme prop, derive it from the document
    // attribute `data-theme` so consumers don't have to implement this logic.
    const getEffectiveTheme = () => {
        const dt = document.documentElement.getAttribute("data-theme");
        return dt === "dark" ? ("dark" as const) : ("light" as const);
    };

    const [internalTheme, setInternalTheme] = useState<"light" | "dark">(() => {
        // read synchronously on first render (client-only module)
        try {
            return getEffectiveTheme();
        } catch {
            return "light";
        }
    });

    // keep internalTheme in sync with document's data-theme when theme prop
    // isn't supplied by the caller
    useEffect(() => {
        if (theme) return; // caller controls theme

        const root = document.documentElement;
        // update immediately in case theme changed since mount
        setInternalTheme(getEffectiveTheme());

        const mo = new MutationObserver((records) => {
            for (const r of records) {
                if (r.type === "attributes" && r.attributeName === "data-theme") {
                    setInternalTheme(getEffectiveTheme());
                }
            }
        });
        mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

        return () => mo.disconnect();
    }, [theme]);

    useEffect(() => {
        const initialBlocks = value ? JSON.parse(value) : undefined;
        setBlocks(initialBlocks);
    }, []);

    const editor = useMemo(() => {
        if (blocks === "loading") {
            return undefined;
        }
        return BlockNoteEditor.create({ initialContent: blocks });
    }, [blocks]);
    if (editor === undefined) {
        return "Loading content...";
    }

    const themeToPass = theme ?? internalTheme;

    return (
        <div>
            <BlockNoteView
                editor={editor}
                editable={editable}
                onChange={() => {
                    setBlocks(editor.document);
                    if (onChange) {
                        onChange(JSON.stringify(blocks));
                    }
                }}
                theme={themeToPass} />
        </div>
    );
}
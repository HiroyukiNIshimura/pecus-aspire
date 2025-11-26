"use client";

import type {
  HSAccordion,
  HSDropdown,
  HSOverlay,
  HSStaticMethods,
  HSTooltip,
} from "flyonui/flyonui";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

async function loadFlyonUI() {
  return import("flyonui/flyonui");
}

export default function FlyonuiScript() {
  const path = usePathname();

  useEffect(() => {
    const initFlyonUI = async () => {
      await loadFlyonUI();
    };

    initFlyonUI();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setTimeout(() => {
      if (
        window.HSStaticMethods &&
        typeof window.HSStaticMethods.autoInit === "function"
      ) {
        window.HSStaticMethods.autoInit();
        window.HSDropdown.autoInit();
        window.HSAccordion.autoInit();
        window.HSOverlay.autoInit();
        // HSTooltipの初期化を追加
        if (
          window.HSTooltip &&
          typeof window.HSTooltip.autoInit === "function"
        ) {
          window.HSTooltip.autoInit();
        }
      }
    }, 100);
  }, [path]);

  return null;
}

declare global {
  interface Window {
    HSStaticMethods: typeof HSStaticMethods;
    HSDropdown: typeof HSDropdown;
    HSAccordion: typeof HSAccordion;
    HSOverlay: typeof HSOverlay;
    HSTooltip: typeof HSTooltip;
  }
}

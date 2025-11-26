import { useEffect, useState } from "react";

type ThemeType = "light" | "dark" | "auto";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeType>("auto");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (selectedTheme: ThemeType) => {
    const html = document.documentElement;

    if (selectedTheme === "auto") {
      // システム設定を監視
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      html.setAttribute("data-theme", selectedTheme);
    }
  };

  // マウント時に localStorage から復元
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as ThemeType | null;
    if (storedTheme && ["light", "dark", "auto"].includes(storedTheme)) {
      setTheme(storedTheme);
      applyTheme(storedTheme);
    } else {
      // デフォルトは auto
      setTheme("auto");
      applyTheme("auto");
    }
    setMounted(true);
  }, [applyTheme]);

  const changeTheme = (newTheme: ThemeType) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const currentTheme = (): "light" | "dark" => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    return current as "light" | "dark";
  };

  return { theme, changeTheme, mounted, currentTheme };
}

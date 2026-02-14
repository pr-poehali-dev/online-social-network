import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "green" | "blue" | "crystal" | "gold";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  themes: { id: Theme; name: string; color: string }[];
}

const themes = [
  { id: "green" as Theme, name: "Тёмно-зелёная", color: "#22c55e" },
  { id: "blue" as Theme, name: "Тёмно-синяя", color: "#3b82f6" },
  { id: "crystal" as Theme, name: "Кристальная", color: "#06b6d4" },
  { id: "gold" as Theme, name: "Бело-жёлтая", color: "#eab308" },
];

const ThemeContext = createContext<ThemeCtx>({ theme: "green", setTheme: () => {}, themes });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("online_theme") as Theme) || "green";
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("online_theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-blue", "theme-crystal", "theme-gold");
    if (theme !== "green") {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // Create MUI theme with custom fonts
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
        },
        typography: {
          fontFamily: "var(--font-english)",
          h1: { fontFamily: "var(--font-english)" },
          h2: { fontFamily: "var(--font-english)" },
          h3: { fontFamily: "var(--font-english)" },
          h4: { fontFamily: "var(--font-english)" },
          h5: { fontFamily: "var(--font-english)" },
          h6: { fontFamily: "var(--font-english)" },
          body1: { fontFamily: "var(--font-english)" },
          body2: { fontFamily: "var(--font-english)" },
          button: { fontFamily: "var(--font-english)" },
          caption: { fontFamily: "var(--font-english)" },
          overline: { fontFamily: "var(--font-english)" },
          subtitle1: { fontFamily: "var(--font-english)" },
          subtitle2: { fontFamily: "var(--font-english)" },
          // Lao text will be handled via CSS :lang(lo) selector
        },
      }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
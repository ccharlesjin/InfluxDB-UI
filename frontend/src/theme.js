import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// color design tokens
export const tokens = (mode) => ({
    ...(mode === 'dark'
        ? {
            primary: {
                100: "#dae2ed",
                200: "#b5c4db",
                300: "#90a7ca",
                400: "#6b89b8",
                500: "#466ca6",
                600: "#385685",
                700: "#2a4164",
                800: "#1c2b42",
                900: "#0e1621"
            },
            whiteAccent: {
                100: "#fdfaf3",
                200: "#faf4e7",
                300: "#f8efda",
                400: "#f5e9ce",
                500: "#f3e4c2",
                600: "#c2b69b",
                700: "#928974",
                800: "#615b4e",
                900: "#312e27"
            },
            yellowAccent: {
                100: "#f6efda",
                200: "#eddfb5",
                300: "#e3ce8f",
                400: "#dabe6a",
                500: "#d1ae45",
                600: "#a78b37",
                700: "#7d6829",
                800: "#54461c",
                900: "#2a230e"
            },
            grayAccent: {
                100: "#f1f0e9",
                200: "#e4e1d3",
                300: "#d6d3be",
                400: "#c9c4a8",
                500: "#bbb592",
                600: "#969175",
                700: "#706d58",
                800: "#4b483a",
                900: "#25241d"
            }, 
        } 
        : {
            primary: {
                100: "#0e1621",
                200: "#1c2b42",
                300: "#2a4164",
                400: "#385685",
                500: "#466ca6",
                600: "#6b89b8",
                700: "#90a7ca",
                800: "#b5c4db",
                900: "#dae2ed",
            },
            // hold on command and select all contents then press shift + command 直接复制并应用上面的格式
            whiteAccent: {
                100: "#312e27",
                200: "#615b4e",
                300: "#928974",
                400: "#c2b69b",
                500: "#f3e4c2",
                600: "#f5e9ce",
                700: "#f8efda",
                800: "#faf4e7",
                900: "#fdfaf3",
            },
            yellowAccent: {
                100: "#2a230e",
                200: "#54461c",
                300: "#7d6829",
                400: "#a78b37",
                500: "#d1ae45",
                600: "#dabe6a",
                700: "#e3ce8f",
                800: "#eddfb5",
                900: "#f6efda",
            },
            grayAccent: {
                100: "#25241d",
                200: "#4b483a",
                300: "#706d58",
                400: "#969175",
                500: "#bbb592",
                600: "#c9c4a8",
                700: "#d6d3be",
                800: "#e4e1d3",
                900: "#f1f0e9",
            }, 
        }),
});

export const themeSettings = (mode) => {
    const colors = tokens(mode);

    return {
        palette: {
            mode: mode,
            ...(mode === 'dark'
                ? {
                    primary: {
                        main: colors.primary[700]
                    },
                    secondary: {
                        main: colors.whiteAccent[900]
                    },
                    neutral: {
                        dark: colors.grayAccent[700],
                        main: colors.grayAccent[500],
                        light: colors.grayAccent[100],
                    },
                    background: {
                        default: colors.primary[700],
                    }
                }
                : {
                    primary: {
                        main: colors.primary[500]
                    },
                    secondary: {
                        main: colors.whiteAccent[700]
                    },
                    neutral: {
                        dark: colors.grayAccent[700],
                        main: colors.grayAccent[500],
                        light: colors.grayAccent[100],
                    },
                    background: {
                        default: colors.whiteAccent[800],
                    },
                }),
        },
        typography: {
            fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
            fontSize: 12,
            h1: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 40, 
            },
            h2: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 32, 
            },
            h3: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 24, 
            },
            h4: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 20, 
            },
            h5: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 16, 
            },
            h6: {
                fontFamily: ['Source Sans 3', 'sans-serif'].join(','),
                fontSize: 14, 
            },
        },
    };
};


// context for color mode
export const ColorModeContext = createContext({
    toggleMode: () => {},
});

export const useMode = () => {
    const [mode, setMode] = useState('dark');

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'))
        }),
        []
    );

    const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

    return [theme, colorMode];
};


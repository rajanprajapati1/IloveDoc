import { alpha, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f1d1a",
    },
    secondary: {
      main: "#d9a441",
    },
    background: {
      default: "#ece6de",
      paper: "#fbf8f4",
    },
    text: {
      primary: "#1f1b16",
      secondary: "#6d665f",
    },
  },
  typography: {
    fontFamily: 'var(--font-manrope), "Segoe UI", sans-serif',
    button: {
      fontWeight: 800,
      letterSpacing: "0.04em",
      textTransform: "none",
    },
    overline: {
      fontFamily: 'var(--font-space-mono), "Courier New", monospace',
      fontSize: "0.68rem",
      fontWeight: 700,
      letterSpacing: "0.18em",
      lineHeight: 1.8,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(circle at top, #f9f5ef 0%, #f0eae2 45%, #e9e2d9 100%)",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          border: "1px solid #e9e1d8",
          backgroundColor: alpha("#ffffff", 0.8),
        },
        label: {
          paddingLeft: 10,
          paddingRight: 10,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          padding: 1,
          "&.Mui-checked": {
            transform: "translateX(16px)",
            color: "#ffffff",
            "& + .MuiSwitch-track": {
              opacity: 1,
              backgroundColor: "#1f1d1a",
            },
          },
        },
        thumb: {
          width: 14,
          height: 14,
          boxShadow: "none",
        },
        track: {
          opacity: 1,
          backgroundColor: "#dbd3c9",
        },
        root: {
          padding: 0,
        },
      },
    },
  },
});

export default theme;

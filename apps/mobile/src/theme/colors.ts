/**
 * Colour palette matching web app (On The List gold/black luxury theme).
 * VOID #0A0A0A, SURFACE #141414, BORDER #2a2a2a, GOLD #CEA655, GOLD LIGHT #e8d5a3, CREAM #f5f2ec
 */
export const colors = {
  bg: {
    primary: "#0A0A0A",
    secondary: "#0A0A0A",
    card: "#141414",
    surface: "#141414",
    elevated: "#1a1a1a",
    input: "#141414",
  },
  cream: "#f5f2ec",
  gold: {
    DEFAULT: "#CEA655",
    light: "#e8d5a3",
    dim: "rgba(206,166,85,0.15)",
    border: "rgba(206,166,85,0.3)",
  },
  text: {
    primary: "#f5f2ec",
    secondary: "rgba(245,242,236,0.8)",
    muted: "rgba(245,242,236,0.6)",
    dim: "rgba(245,242,236,0.4)",
  },
  border: {
    DEFAULT: "#2a2a2a",
    light: "rgba(42,42,42,0.8)",
  },
  status: {
    success: "#CEA655",
    error: "#ef4444",
    warning: "#e8d5a3",
  },
} as const;

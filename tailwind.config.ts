import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F7FB",
        ink: "#0F172A",
        muted: "#64748B",
        line: "#DCE5F2",
        primary: "#2563EB",
        danger: "#DC2626",
        difficulty: {
          basic: "#2563EB",
          classic: "#16A34A",
          medium: "#0891B2",
          hard: "#F97316",
          advanced: "#9333EA",
        },
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0 16px 40px rgba(15, 23, 42, 0.08)",
        float: "0 8px 24px rgba(37, 99, 235, 0.16)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.02)", opacity: "0.92" },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

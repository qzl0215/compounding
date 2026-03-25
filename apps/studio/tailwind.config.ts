import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./src/modules/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#f7f8fc",
        shell: "#eef3f9",
        panel: "#ffffff",
        line: "#d7e0eb",
        accent: "#0ea5e9",
        aurora: "#67e8f9",
        ember: "#f59e0b",
        success: "#10b981",
        danger: "#ef4444"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(14, 165, 233, 0.12), 0 24px 60px rgba(15, 23, 42, 0.08)"
      },
      backgroundImage: {
        "grid-shell":
          "linear-gradient(rgba(14, 165, 233, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;

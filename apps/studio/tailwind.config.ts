import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#070b14",
        shell: "#0f1728",
        panel: "#131f33",
        line: "#243655",
        accent: "#39d0ff",
        aurora: "#9bf7ff",
        ember: "#f1b157",
        success: "#67f2c4",
        danger: "#ff807d"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(57, 208, 255, 0.18), 0 24px 60px rgba(4, 11, 25, 0.45)"
      },
      backgroundImage: {
        "grid-shell":
          "linear-gradient(rgba(57, 208, 255, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(57, 208, 255, 0.09) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#6C3CF0",
          dark: "#4E2BBF",
          green: "#2FBF71",
          bg: "#F7F8FA",
          text: "#1F2937",
          lilac: "#9B7BF5",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(31, 41, 55, 0.18)",
        card: "0 8px 30px -10px rgba(31, 41, 55, 0.16)",
        glass:
          "0 8px 32px rgba(31, 41, 55, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
        glow: "0 18px 50px -12px rgba(108, 60, 240, 0.45)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #6C3CF0 0%, #4E2BBF 100%)",
        "brand-sheen":
          "linear-gradient(135deg, #7C4DFF 0%, #6C3CF0 45%, #4E2BBF 100%)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-16px)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(24px, -22px) scale(1.06)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradientMove: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.7s cubic-bezier(0.21, 0.6, 0.35, 1) both",
        "fade-in": "fadeIn 0.8s ease both",
        float: "float 6s ease-in-out infinite",
        "float-slow": "drift 13s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        gradient: "gradientMove 7s ease infinite",
        pop: "pop 0.5s cubic-bezier(0.21, 1.2, 0.4, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;

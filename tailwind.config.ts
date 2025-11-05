import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: {
          900: '#0B0D10',
          800: '#0E1116',
          700: '#12161C'
        },
        card: '#12151B',
        edge: '#1C222B',
        soft: '#97A3B6',
        acc: {
          green: '#7CF29A',
          violet: '#9B87F5',
          blue: '#66D5FF',
          amber: '#F5C461',
          red: '#FF6B6B'
        }
      },
      boxShadow: {
        soft: '0 1px 0 0 rgba(255,255,255,0.04), 0 0 0 1px rgba(255,255,255,0.04) inset',
      },
      borderRadius: {
        xl2: '14px'
      }
    },
  },
  plugins: [],
};
export default config;


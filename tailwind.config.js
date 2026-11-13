/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        deepgreen: {
          DEFAULT: "#1B5E3A",
          50: "#E7F3EC",
          100: "#CFE7D9",
          600: "#1B5E3A",
          700: "#164B2F",
          800: "#113A25",
        },
        emerald2: {
          DEFAULT: "#1F9D63",
          soft: "#DCF3E6",
        },
        warnred: {
          soft: "#FBE3E1",
          DEFAULT: "#B3261E",
        },
        inputamber: "#FFF7D6",
        settingblue: "#E8F0FA",
      },
      fontFamily: {
        bangla: ["'Noto Sans Bengali'", "'Hind Siliguri'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,21,0.06), 0 1px 1px rgba(16,24,21,0.04)",
        cardhover: "0 4px 14px rgba(16,24,21,0.10)",
      },
    },
  },
  plugins: [],
};

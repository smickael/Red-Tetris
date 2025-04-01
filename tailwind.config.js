/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      SlussenRegular: ["SlussenRegular", "sans-serif"],
      SlussenBold: ["SlussenBold", "sans-serif"],
    },
    extend: {
      colors: {
        vampireBlack: "var(--vampireBlack)",
        davysGrey: "var(--davysGrey)",
        lightDavysGrey: "var(--lightDavysGrey)",
        lotion: "var(--lotion)",
      },
    },
  },
  plugins: [],
};

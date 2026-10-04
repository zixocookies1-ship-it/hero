export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "jaggery-brown": "#5A321F",
        "ginger-terracotta": "#C87945",
        "warm-cream": "#F7F1E7",
        "natural-green": "#314C38",
        "dark-text": "#24211D",
        "white": "#FFFFFF",
      },
      fontFamily: {
        serif: ["DM Serif Display", "Playfair Display", "serif"],
        sans: ["Inter", "Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};

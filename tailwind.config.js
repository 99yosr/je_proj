/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",       // Next.js app folder
    "./pages/**/*.{js,ts,jsx,tsx}",     // pages folder
    "./components/**/*.{js,ts,jsx,tsx}" // components folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

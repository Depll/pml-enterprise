/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/AdminDashboard.tsx", // Sucht nur in deinem Dashboard nach Klassen
  ],
  corePlugins: {
    preflight: false, // Verhindert, dass deine anderen Seiten verändert werden
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
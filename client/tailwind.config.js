/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "media",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // codice colore per zona, usato in tutta l'app
        zona: {
          inbox: "#2563eb", // blu
          incorso: "#d97706", // ambra
          oggi: "#16a34a", // verde
          scadenze: "#dc2626", // rosso
        },
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

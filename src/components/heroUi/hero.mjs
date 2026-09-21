// hero.mjs
import { heroui } from "@heroui/react";

export default heroui({
  themes: {
    light: {
      colors: {
        // Reemplaza el azul de HeroUI por el acento del sistema
        focus: "#67afc3",
      },
    },
    dark: {
      extend: "light", // Use light theme colors for dark mode
      colors: {
        focus: "#67afc3",
      },
    },
  },
});

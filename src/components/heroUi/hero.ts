// hero.ts
import { heroui } from "@heroui/react";
// or import from theme package if you are using individual packages.
// import { heroui } from "@heroui/theme";
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

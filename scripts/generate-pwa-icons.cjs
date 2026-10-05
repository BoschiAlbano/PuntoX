// Compatibilidad para ejecutar el generador compartido desde CommonJS.
void (async () => {
  const { execFileSync } = await import("node:child_process");
  const { join } = await import("node:path");

  execFileSync(process.execPath, [join(__dirname, "generate-pwa-icons.mjs")], {
    stdio: "inherit",
  });
})();

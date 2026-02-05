const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const postcssConfig = path.join(__dirname, '..', 'postcss.config.mjs');
const postcssBackup = path.join(__dirname, '..', 'postcss.config.mjs.bak');

// Renombrar postcss.config.mjs temporalmente
let renamed = false;
if (fs.existsSync(postcssConfig)) {
  fs.renameSync(postcssConfig, postcssBackup);
  renamed = true;
}

try {
  // Ejecutar tests
  execSync('npx vitest --run', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} finally {
  // Restaurar postcss.config.mjs
  if (renamed && fs.existsSync(postcssBackup)) {
    fs.renameSync(postcssBackup, postcssConfig);
  }
}


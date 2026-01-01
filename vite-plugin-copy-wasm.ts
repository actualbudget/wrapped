import type { Plugin } from "vite";

import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Vite plugin to copy sql.js WASM files to public directory
 */
export function copyWasmFiles(): Plugin {
  return {
    name: "copy-wasm-files",
    buildStart() {
      const wasmSource = join(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm");
      const wasmDest = join(process.cwd(), "public/sql-wasm.wasm");

      if (existsSync(wasmSource)) {
        // Ensure public directory exists
        const publicDir = join(process.cwd(), "public");
        if (!existsSync(publicDir)) {
          mkdirSync(publicDir, { recursive: true });
        }

        copyFileSync(wasmSource, wasmDest);
        console.log("Copied sql-wasm.wasm to public directory");
      } else {
        console.warn("sql-wasm.wasm not found in node_modules, skipping copy");
      }
    },
  };
}

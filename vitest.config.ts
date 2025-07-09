import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "url";
import { dirname } from "path";

// __dirname の代替（ESM対応）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true, // expect などをグローバルで使えるように
    environment: "jsdom", // ブラウザ互換の環境を使用
    include: ["test/**/*.{test,spec}.{ts,tsx}"], // テストファイルの場所を test フォルダに変更
    root: __dirname,
  },
});

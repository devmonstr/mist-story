import js from "@eslint/js"
import globals from "globals"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import tseslint from "typescript-eslint"

const webFiles = ["apps/web/**/*.{js,mjs,cjs,ts,tsx}"]

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/generated/**",
      "**/tsconfig.tsbuildinfo",
      "apps/web/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  ...nextVitals.map((config) => ({
    ...config,
    files: webFiles,
  })),
  ...nextTs.map((config) => ({
    ...config,
    files: webFiles,
  })),
  {
    files: webFiles,
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
    },
  }
)

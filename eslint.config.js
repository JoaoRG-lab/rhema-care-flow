import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Supabase JSON and dynamic AI responses require 'any' throughout the codebase
      "@typescript-eslint/no-explicit-any": "off",
      // Empty catch blocks are intentional in several places (localStorage, stream parsing)
      "no-empty": ["error", { "allowEmptyCatch": true }],
      // Empty interfaces are acceptable for shadcn/ui component prop extension
      "@typescript-eslint/no-empty-object-type": "off",
      // @ts-expect-error is used where TS types are narrower than Supabase runtime
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
);

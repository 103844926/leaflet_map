import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  {
    ignores: ["**/*.test.js"],
  },

  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { react: pluginReact },
    extends: [js.configs.recommended, pluginReact.configs.flat.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect", // ✅ Fix React version warning
      },
    },
    rules: {
      "react/react-in-jsx-scope": "off", // ✅ Fix "React must be in scope"
      "react/prop-types": "off", // ✅ Fix all PropTypes errors
    },
  },

  eslintConfigPrettier,
]);

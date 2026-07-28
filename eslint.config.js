import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "apps/api/src/generated/prisma/**",
      "apps/api/prisma/migrations/**",
    ],
  },
  {
    files: [
      "apps/api/src/**/*.ts",
      "apps/api/prisma/seed.ts",
      "apps/api/tests/**/*.ts",
      "apps/api/vitest.config.ts",
    ],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "apps/api/prisma/seed.ts",
            "apps/api/vitest.config.ts",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
);

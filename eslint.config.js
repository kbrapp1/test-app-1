import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:storybook/recommended",
    "plugin:@typescript-eslint/recommended"
  ),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      // Custom rules for organization context pattern
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          // Don't ignore organizationId - force developers to use it for validation
          "args": "after-used",
          "ignoreRestSiblings": true
        }
      ],
      // Encourage proper error handling
      "prefer-const": "error",
      "no-var": "error",
      // React specific rules for organization context
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error"
    },
  },
  {
    // Specific rules for server actions (where organizationId comes from JWT)
    files: ["**/actions/**/*.ts", "**/actions/**/*.tsx"],
    rules: {
      // Server actions can ignore organizationId params since they use JWT
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^(organizationId|_)",
          "varsIgnorePattern": "^(organizationId|_)"
        }
      ]
    }
  },
  {
    // Specific rules for hooks that should use organization context
    files: ["**/hooks/**/*.ts", "**/hooks/**/*.tsx"],
    rules: {
      // Hooks should not ignore organizationId - they should use useOrganizationContext
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ]
    }
  },
  {
    // Special rules for components that might be in unified context architecture
    files: ["**/presentation/components/**/*.tsx", "**/components/**/*.tsx"],
    rules: {
      // More lenient for presentation layer components that might use unified context
      "@typescript-eslint/no-unused-vars": [
        "warn", // Warning instead of error for components
        {
          "argsIgnorePattern": "^(_|organizationId$|activeOrganizationId$)",
          "varsIgnorePattern": "^_"
        }
      ]
    }
  }
];

export default eslintConfig; 
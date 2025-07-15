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
  },
  {
    // Test files - significantly relaxed rules
    files: [
      "**/*.test.{js,ts,tsx}",
      "**/*.spec.{js,ts,tsx}",
      "**/__tests__/**/*.{js,ts,tsx}",
      "**/tests/**/*.{js,ts,tsx}"
    ],
    rules: {
      // TypeScript relaxations for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-require-imports": "off",
      
      // React testing relaxations
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/display-name": "off",
      
      // General test allowances
      "no-console": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "prefer-const": "off",
      
      // Allow longer test names and descriptions
      "max-len": ["warn", { "code": 120, "ignoreComments": true, "ignoreStrings": true }],
      
      // Security rules that should still be enforced in tests
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      
      // Test-specific patterns
      "no-unused-expressions": "off", // Allow expect() assertions
      "no-magic-numbers": "off", // Tests often use magic numbers
      "complexity": "off", // Tests can be complex
      "max-nested-callbacks": "off", // Tests often have nested describes/its
      
      // Allow test utilities and setup patterns
      "import/no-extraneous-dependencies": "off", // Allow test dependencies
      "global-require": "off", // Allow dynamic requires in tests
      "no-process-env": "off" // Allow process.env in tests
    }
  }
];

export default eslintConfig; 
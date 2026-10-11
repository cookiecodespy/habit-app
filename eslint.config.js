import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', '.wrangler/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, __APP_VERSION__: 'readonly' },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // The two rules that catch real breakage in this codebase: a hook called
      // conditionally, and a name that is used but never imported.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-undef': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // The domain layer never reads the system clock directly: it asks domain/clock, so
    // tests can pin time and date-dependent logic stays reproducible.
    files: ['src/domain/**/*.ts'],
    ignores: ['src/domain/clock.ts'],
    rules: {
      'no-restricted-syntax': ['error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: 'Use now() from domain/clock.' },
        { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: 'Use nowMs() from domain/clock.' },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: { 'no-undef': 'off' }, // TypeScript already checks this, with types
  },
  {
    files: ['src/sw.template.js'],
    languageOptions: { globals: { ...globals.serviceworker, __PRECACHE__: 'readonly' } },
  },
  {
    files: ['*.config.{js,ts}', 'tests/**/*.{js,ts}', 'scripts/**/*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);

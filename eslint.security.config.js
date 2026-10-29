// Security-only lint for the "Unsafe DOM/HTML patterns" CI job.
// Run it with: npm run lint:security
//
// It is a separate config from eslint.config.js on purpose: the normal lint has a lot of
// older findings (unused vars, hook rules), and mixing them in would hide the few rules
// that matter here. Only the rules below run, so a failure always means an unsafe pattern.
// Policy and false-positive handling: docs/SECURITY_CHECKS.md
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Files that already call document.write on main. Do not add to this list.
// Remove a file from it when it stops using document.write.
const DOCUMENT_WRITE_LEGACY = [
  'src/components/services/FormTemplatePreview.jsx',
  'src/components/services/RtiPreviewLetter.jsx',
  'src/components/tracking/AppellateEscalationModal.jsx',
]

const writeToDocument = [
  'CallExpression[callee.property.name=/^(write|writeln)$/]:matches([callee.object.name="document"], [callee.object.property.name="document"])',
  'document.write() parses its argument as HTML. Build DOM nodes with textContent, or escape the text first.',
]

const unsafeHtmlSelectors = [
  [
    'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
    'dangerouslySetInnerHTML injects raw HTML. Render the text as a React child, or sanitize it first and document why.',
  ],
  [
    'AssignmentExpression[left.type="MemberExpression"][left.property.name=/^(innerHTML|outerHTML)$/]',
    'Assigning innerHTML/outerHTML parses a string as HTML. Use textContent or React elements.',
  ],
  [
    'CallExpression[callee.property.name="insertAdjacentHTML"]',
    'insertAdjacentHTML parses a string as HTML. Use insertAdjacentText or React elements.',
  ],
  [
    'CallExpression[callee.property.name="createContextualFragment"]',
    'createContextualFragment parses a string as HTML (and runs scripts in it). Use DOM APIs or React elements.',
  ],
]

const toRule = (list) =>
  list.map(([selector, message]) => ({ selector, message }))

const baseRules = {
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
}

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '**/*.test.{js,jsx}']),
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // Existing eslint-disable comments in the code name rules from these two plugins.
    // They are registered (no rules turned on) so ESLint does not report "rule not found".
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    // Those comments are for the normal lint, so do not report them as unused here.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      ...baseRules,
      'no-restricted-syntax': ['error', ...toRule([...unsafeHtmlSelectors, writeToDocument])],
    },
  },
  {
    files: DOCUMENT_WRITE_LEGACY,
    rules: {
      'no-restricted-syntax': ['error', ...toRule(unsafeHtmlSelectors)],
    },
  },
])

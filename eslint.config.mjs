// ESLint Flat Config pour ESLint 9+
// Compatible avec eslint-config-next
import { FlatCompat } from '@eslint/eslintrc'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
 
const require = createRequire(import.meta.url)

const compat = new FlatCompat({
  baseDirectory: __dirname,
   
  recommendedConfig: require('eslint-config-next'),
})

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/*.md',
      '**/*.json',
      '**/*.db',
      '**/*.sqlite',
      '**/*.sqlite3',
      'data/**',
      'logs/**',
      '*.log',
      'coverage/**',
      '*.tsbuildinfo',
      'next-env.d.ts',
      'scripts/**/*',
    ],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/react-in-jsx-scope': 'off',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'error',
      'require-atomic-updates': 'warn',
      '@typescript-eslint/no-require-imports': ['warn', {
        allow: [
          'next-intl/plugin',
          'next-intl',
          'next-intl/server',
        ],
      }],
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      'no-console': 'off',
    },
  },
]

export default eslintConfig


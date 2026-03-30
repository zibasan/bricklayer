import LICENSE_TEXTS from './licenses.js';
import { ProjectAnswers } from './types.js';

// Embedded templates (inlined so builds include templates without copying files)
const staticTemplates = {
  gitignore: [
    '# Dependencies',
    'node_modules/',
    'bun.lockb',
    '',
    '# Build output',
    'dist/',
    '',
    '# Environment files',
    '.env',
    '.env.local',
    '.env.*.local',
    '',
    '# macOS',
    '.DS_Store',
    '.AppleDouble',
    '.LSOverride',
    '',
    '# IDE',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '*~',
    '',
    '# Logs',
    'logs/',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    '',
    '# Temporary files',
    '*.tmp',
    '.temp/',
    'temp/',
    '',
    '# Linter and formatter cache',
    '.eslintcache',
    '.prettier-cache',
    '',
    '# Husky',
    '.husky/_',
  ],
  prettierignore: [
    '# Dependencies',
    'node_modules',
    '',
    '# Build output',
    'dist',
    '',
    '# Lock files',
    'bun.lockb',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '',
    '# Logs',
    '*.log',
    '',
    '# Coverage',
    'coverage',
  ],
  npmignore: [
    '# Source files',
    'src/',
    'tsconfig.json',
    'eslint.config.js',
    '.prettierrc',
    '.prettierignore',
    '.editorconfig',
    '',
    '# Tests and development',
    '*.test.ts',
    '*.spec.ts',
    'coverage/',
    '.nyc_output/',
    '',
    '# Git and CI',
    '.git/',
    '.github/',
    '.gitignore',
    '.husky/',
    '',
    '# IDE',
    '.vscode/',
    '.idea/',
    '*.swp',
    '*.swo',
    '*~',
    '',
    '# Logs',
    'logs/',
    '*.log',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    '',
    '# Lock files',
    'bun.lock',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '',
    '# macOS',
    '.DS_Store',
    '.AppleDouble',
    '.LSOverride',
    '',
    '# Temporary files',
    '*.tmp',
    '.temp/',
    'temp/',
    '',
    '# Development',
    'README.dev.md',
    'CONTRIBUTING.md',
    '',
    '# Documentation',
    'docs/',
    '',
    '# Zip files',
    '*.zip',
  ],
  editorconfig: [
    '# EditorConfig is awesome: https://EditorConfig.org',
    '',
    'root = true',
    '',
    '[*]',
    'charset = utf-8',
    'end_of_line = lf',
    'insert_final_newline = true',
    'trim_trailing_whitespace = true',
    'indent_style = space',
    'indent_size = 2',
    '',
    '[*.{js,ts}]',
    'indent_style = space',
    'indent_size = 2',
    '',
    '[*.{json,yml,yaml}]',
    'indent_style = space',
    'indent_size = 2',
    '',
    '[*.md]',
    'trim_trailing_whitespace = false',
    'max_line_length = off',
    '',
  ],
} as const;

const hooksTemplates = {
  pnpm: {
    'pre-commit': ['#!/bin/sh', '. "$(dirname "$0")/_/husky.sh"', '', 'pnpm run lint-staged'],
  },
  npm: {
    'pre-commit': ['#!/bin/sh', '. "$(dirname "$0")/_/husky.sh"', '', 'npm run lint-staged'],
  },
  yarn: {
    'pre-commit': ['#!/bin/sh', '. "$(dirname "$0")/_/husky.sh"', '', 'yarn lint-staged'],
  },
  bun: {
    'pre-commit': ['#!/bin/sh', '. "$(dirname "$0")/_/husky.sh"', '', 'bun run lint-staged'],
  },
} as const;

function isBiomeSetup(answers: ProjectAnswers): boolean {
  return answers.linterFormatter === 'biome';
}

// Generate scripts object with OS-specific postbuild handling
function generateScriptsWithPermissions(
  baseScripts: Record<string, string>
): Record<string, string> {
  // Add postbuild script to handle file permissions across platforms
  // Unix-like systems: set executable permission via chmod
  // Windows: chmodSync still applies but has no effect (harmless)
  return {
    ...baseScripts,
    postbuild: "node -e \"require('fs').chmodSync('dist/index.js', 0o755)\"",
  };
}

// license texts are provided from src/create/licenses.ts
export function generatePackageJson(answers: ProjectAnswers, versions?: Record<string, string>) {
  const useBiome = isBiomeSetup(answers);
  const devDeps: Record<string, string> = {
    typescript: versions?.['typescript'] || '^5.7.2',
    'ts-node': versions?.['ts-node'] || '^10.9.1',
    '@types/node': versions?.['@types/node'] || '^22.10.5',
    '@types/cli-progress': versions?.['@types/cli-progress'] || '^3.11.6',
    'lint-staged': versions?.['lint-staged'] || '^15.2.11',
  };
  if (useBiome) {
    devDeps['@biomejs/biome'] = versions?.['@biomejs/biome'] || '^1.9.4';
  } else {
    devDeps['eslint'] = versions?.['eslint'] || '^9.39.2';
    devDeps['eslint-config-prettier'] = versions?.['eslint-config-prettier'] || '^10.1.8';
    devDeps['eslint-plugin-prettier'] = versions?.['eslint-plugin-prettier'] || '^5.5.4';
    devDeps['@typescript-eslint/parser'] = versions?.['@typescript-eslint/parser'] || '^8.52.0';
    devDeps['@typescript-eslint/eslint-plugin'] =
      versions?.['@typescript-eslint/eslint-plugin'] || '^8.52.0';
    devDeps['typescript-eslint'] = versions?.['typescript-eslint'] || '^8.52.0';
    devDeps['@eslint/json'] = versions?.['@eslint/json'] || '^0.1.1';
    devDeps['prettier'] = versions?.['prettier'] || '^3.7.4';
  }

  // Husky should only be added when requested (useHusky)
  if ((answers as ProjectAnswers).useHusky) {
    devDeps['husky'] = versions?.['husky'] || '^9.1.7';
  }

  const deps: Record<string, string> = {
    commander: versions?.['commander'] || '^11.1.0',
    inquirer: versions?.['inquirer'] || '^9.0.0',
    chalk: versions?.['chalk'] || '^5.3.0',
    'cli-progress': versions?.['cli-progress'] || '^3.12.0',
    ora: versions?.['ora'] || '^8.1.1',
    yargs: versions?.['yargs'] || '^18.0.0',
  };

  const mgr = (answers.packageManager || 'pnpm') as string;
  const pkgManagerVersions: Record<string, string> = {
    pnpm: versions?.['pnpm'] || '10.27.0',
    npm: versions?.['npm'] || '9.8.1',
    yarn: versions?.['yarn'] || '1.22.22',
    bun: versions?.['bun'] || '1.3.6',
  };
  function exactVersion(v?: string) {
    if (!v) {
      return v;
    }
    const m = v.match(/\d+\.\d+\.\d+/);
    return m ? m[0] : v.replace(/^[^\d]*/, '');
  }
  function buildCmdForManager(m: string) {
    if (m === 'yarn') {
      return 'yarn build';
    }
    if (m === 'bun') {
      return 'bun run build';
    }
    return `${m} run build`;
  }

  // When Husky is enabled, keep prepare as just 'husky' (user requested).
  const prepareScript = (answers as ProjectAnswers).useHusky ? 'husky' : buildCmdForManager(mgr);
  const baseScripts: Record<string, string> = {
    build: 'tsc -p tsconfig.json',
    prepare: prepareScript,
    prepublishOnly: buildCmdForManager(mgr),
    dev: 'ts-node --esm src/index.ts',
    start: 'node dist/index.js',
    typecheck: 'tsc --noEmit',
    'lint-staged': 'lint-staged',
  };

  const lintScripts: Record<string, string> = useBiome
    ? {
        format: 'biome format --write .',
        lint: 'biome lint --write .',
        'biome:check': 'biome check .',
        'biome:fix': 'biome check . --write',
      }
    : {
        lint: 'eslint "src/**/*.ts"',
        'lint:fix': 'eslint "src/**/*.ts" --fix',
        format: 'prettier --write "src/**/*.ts"',
        'format:check': 'prettier --check "src/**/*.ts"',
      };

  const lintStagedConfig = useBiome
    ? {
        '*.{js,jsx,ts,tsx,json,jsonc,md}': ['biome check --write'],
      }
    : {
        '*.ts': ['eslint --fix', 'prettier --write'],
      };

  return {
    name: answers.npmPackageName || answers.name,
    private: false,
    version: '0.0.0',
    description: answers.description || '',
    type: answers.moduleType === 'ESM' ? 'module' : 'commonjs',
    main: './dist/index.js',
    module: './dist/index.js',
    bin: {
      [answers.name]: './dist/index.js',
    },
    files: ['dist', 'README.md'],
    scripts: generateScriptsWithPermissions({
      ...baseScripts,
      ...lintScripts,
    }),
    keywords: ['cli', 'scaffold', 'typescript', 'generator'],
    author: answers.author,
    license: answers.license,
    repository: {
      type: 'git',
      url: `git+https://github.com/${answers.gitOwner}/${answers.gitRepo}.git`,
    },
    bugs: {
      url: `https://github.com/${answers.gitOwner}/${answers.gitRepo}/issues`,
    },
    homepage: `https://github.com/${answers.gitOwner}/${answers.gitRepo}#readme`,
    dependencies: deps,
    devDependencies: devDeps,
    'lint-staged': lintStagedConfig,
    packageManager: `${mgr}@${exactVersion(pkgManagerVersions[mgr] || '10.27.0')}`,
  };
}

export function generateTsConfig(answers: ProjectAnswers) {
  return {
    compilerOptions: {
      target: 'ES2020',
      module: answers.moduleType === 'ESM' ? 'ESNext' : 'CommonJS',
      lib: ['ES2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      moduleResolution: 'bundler',
    },
    include: ['src/**/*'],
    exclude: ['node_modules'],
  };
}

export function generateIndexTs(answers: ProjectAnswers) {
  return `#!/usr/bin/env node
import { Command } from 'commander';
import { helloCommand } from './commands/hello.js';

const program = new Command();
program.name('${answers.name}').version('0.0.0').description('${answers.description}');
program.addCommand(helloCommand());
program.parse(process.argv);
`;
}

export function generateHelloCommandTs() {
  return `import { Command } from 'commander';
import chalk from 'chalk';

export function helloCommand(): Command {
  const cmd = new Command('hello');
  cmd.description('Say hello and demonstrate separated command files');
  cmd.action(() => {
    console.log(chalk.green('Hello from your scaffolded CLI!'));
  });
  return cmd;
}
`;
}

export function generateReadme(answers: ProjectAnswers) {
  return `# ${answers.name}

${answers.description}
`;
}

export function generateGitignore() {
  return Array.isArray(staticTemplates.gitignore)
    ? staticTemplates.gitignore.join('\n')
    : staticTemplates.gitignore;
}

function pickManagerKey(mgr?: string) {
  const m = (mgr || 'pnpm').toLowerCase();
  if (m === 'npm' || m === 'yarn' || m === 'bun' || m === 'pnpm') return m;
  return 'pnpm';
}

export function generatePreCommitHook(packageManager?: string) {
  const key = pickManagerKey(packageManager);
  const hook = hooksTemplates[key]['pre-commit'];
  return Array.isArray(hook) ? hook.join('\n') : hook;
}

export function generatePrePushHook(
  packageManager?: string,
  linterFormatter: ProjectAnswers['linterFormatter'] = 'eslint+prettier'
) {
  const key = pickManagerKey(packageManager);
  const runScript =
    key === 'yarn'
      ? (script: string) => `yarn ${script}`
      : key === 'bun'
        ? (script: string) => `bun run ${script}`
        : (script: string) => `${key} run ${script}`;

  const checkCommand =
    linterFormatter === 'biome'
      ? 'pnpm run biome:check'
      : `${runScript('lint')} && ${runScript('format:check')}`;

  return ['#!/bin/sh', '. "$(dirname "$0")/_/husky.sh"', '', checkCommand].join('\n');
}

export function generatePrettierConfig() {
  return `{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
`;
}

export function generatePrettierIgnore() {
  return Array.isArray(staticTemplates.prettierignore)
    ? staticTemplates.prettierignore.join('\n')
    : staticTemplates.prettierignore;
}

export function generateNpmIgnore() {
  return Array.isArray(staticTemplates.npmignore)
    ? staticTemplates.npmignore.join('\n')
    : staticTemplates.npmignore;
}

export function generateNpmrc() {
  return `auto-install-peers=true
node-linker=hoisted
`;
}

export function generateEditorConfig() {
  return Array.isArray(staticTemplates.editorconfig)
    ? staticTemplates.editorconfig.join('\n')
    : staticTemplates.editorconfig;
}

export function generateEslintConfig() {
  return `import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.js'],
  },
];
`;
}

export function generateBiomeConfig() {
  const config = {
    $schema: 'https://biomejs.dev/schemas/2.4.9/schema.json',
    formatter: {
      enabled: true,
      indentStyle: 'space',
      indentWidth: 2,
      lineWidth: 100,
      lineEnding: 'lf',
    },
    linter: {
      enabled: true,
      rules: {
        recommended: true,
      },
    },
    javascript: {
      formatter: {
        semicolons: 'always',
        quoteStyle: 'single',
      },
    },
    files: {
      includes: ['src/**/*.ts'],
    },
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}

export async function generateLicenseText(
  license: string,
  author: string,
  year: number
): Promise<string> {
  // Try reading per-license text files (more readable than JSON storage)
  const keyMap: Record<string, string> = {
    MIT: 'MIT',
    'Apache-2.0': 'Apache-2.0',
    'GPL-3.0': 'GPL-3.0',
    'GPL-2.0': 'GPL-2.0',
    'BSD-1-Clause': 'BSD-1-Clause',
    'BSD-2-Clause': 'BSD-2-Clause',
    'BSD-3-Clause': 'BSD-3-Clause',
  };

  const key = keyMap[license] || 'MIT';
  const textTemplate = (LICENSE_TEXTS && LICENSE_TEXTS[key]) || '';
  if (!textTemplate) {
    return `MIT License\n\nCopyright (c) ${year} ${author}`;
  }

  // Common placeholder patterns to replace in license text files.
  // Support multiple variants users may paste: [year], <YEAR>, {{year}}, {yyyy}, etc.
  const yearRegex = /\[year\]|\{yyyy\}|<year>|\{\{year\}\}|\[YEAR\]|<YEAR>|\{YEAR\}/gi;
  const fullnameRegex =
    /\[fullname\]|\{name of copyright owner\}|<name>|<fullname>|\{\{fullname\}\}|\[name\]|\{name\}|<FULLNAME>|<NAME>/gi;
  const nameRegex = /\[name\]|\{name\}/gi;

  return textTemplate
    .replace(yearRegex, String(year))
    .replace(fullnameRegex, author)
    .replace(nameRegex, author);
}

import cliProgress from 'cli-progress';
import fs from 'fs/promises';
import path from 'path';
import * as templates from './templates.js';
import { ProjectAnswers } from './types.js';

export async function writeProjectFiles(
  targetDir: string,
  answers: ProjectAnswers,
  versions?: Record<string, string>
) {
  const useBiome = answers.linterFormatter === 'biome';
  const progressBar = new cliProgress.SingleBar({
    format: 'Creating files |{bar}| {percentage}% | {value}/{total} files',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  const tasks = [
    'package.json',
    'tsconfig.json',
    'src/index.ts',
    'src/commands/hello.ts',
    'README.md',
    '.gitignore',
    '.npmignore',
    '.editorconfig',
    'LICENSE',
  ];
  if (useBiome) {
    tasks.push('biome.json');
  } else {
    tasks.push('.prettierignore');
    tasks.push('.prettierrc');
    tasks.push('eslint.config.js');
  }

  // Add .npmrc when using pnpm
  const shouldAddNpmrc = answers.packageManager === 'pnpm';
  if (shouldAddNpmrc) {
    tasks.push('.npmrc');
  }

  if (answers.useHusky) {
    tasks.unshift('.husky/pre-push');
    tasks.unshift('.husky/pre-commit');
  }

  progressBar.start(tasks.length, 0);

  let completed = 0;

  await fs.mkdir(targetDir, { recursive: true });
  await fs.mkdir(path.join(targetDir, 'src', 'commands'), { recursive: true });
  if (answers.useHusky) {
    await fs.mkdir(path.join(targetDir, '.husky'), { recursive: true });
  }

  const pkg = templates.generatePackageJson(answers, versions);
  await fs.writeFile(path.join(targetDir, 'package.json'), JSON.stringify(pkg, null, 2));
  progressBar.update(++completed);

  const tsconfig = templates.generateTsConfig(answers);
  await fs.writeFile(path.join(targetDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
  progressBar.update(++completed);

  await fs.writeFile(path.join(targetDir, 'src', 'index.ts'), templates.generateIndexTs(answers));
  progressBar.update(++completed);

  await fs.writeFile(
    path.join(targetDir, 'src', 'commands', 'hello.ts'),
    templates.generateHelloCommandTs()
  );
  progressBar.update(++completed);

  await fs.writeFile(path.join(targetDir, 'README.md'), templates.generateReadme(answers));
  progressBar.update(++completed);

  await fs.writeFile(path.join(targetDir, '.gitignore'), templates.generateGitignore());
  progressBar.update(++completed);

  if (answers.useHusky) {
    await fs.writeFile(
      path.join(targetDir, '.husky', 'pre-commit'),
      templates.generatePreCommitHook(answers.packageManager)
    );
    progressBar.update(++completed);

    await fs.writeFile(
      path.join(targetDir, '.husky', 'pre-push'),
      templates.generatePrePushHook(answers.packageManager, answers.linterFormatter)
    );
    progressBar.update(++completed);
  }

  if (!useBiome) {
    await fs.writeFile(path.join(targetDir, '.prettierignore'), templates.generatePrettierIgnore());
    progressBar.update(++completed);
  }

  await fs.writeFile(path.join(targetDir, '.npmignore'), templates.generateNpmIgnore());
  progressBar.update(++completed);

  if (shouldAddNpmrc) {
    await fs.writeFile(path.join(targetDir, '.npmrc'), templates.generateNpmrc());
    progressBar.update(++completed);
  }

  await fs.writeFile(path.join(targetDir, '.editorconfig'), templates.generateEditorConfig());
  progressBar.update(++completed);

  const licenseText = await templates.generateLicenseText(
    answers.license,
    answers.author,
    new Date().getFullYear()
  );
  await fs.writeFile(path.join(targetDir, 'LICENSE'), licenseText);
  progressBar.update(++completed);

  if (useBiome) {
    await fs.writeFile(path.join(targetDir, 'biome.json'), templates.generateBiomeConfig());
    progressBar.update(++completed);
  } else {
    await fs.writeFile(path.join(targetDir, '.prettierrc'), templates.generatePrettierConfig());
    progressBar.update(++completed);

    await fs.writeFile(path.join(targetDir, 'eslint.config.js'), templates.generateEslintConfig());
    progressBar.update(++completed);
  }

  progressBar.stop();
  console.log('');
}

import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import os from 'os';
import path from 'path';
import { writeProjectFiles } from './file-writer.js';
import { installDependencies } from './installer.js';
import { getLatestVersions } from './package-versions.js';
import { promptProjectDetails } from './prompts.js';

export function createCommand(): Command {
  const cmd = new Command('create');
  cmd
    .description('Create a new TypeScript CLI project (interactive)')
    .option('-d, --destination [path]', 'Project destination directory');

  cmd.action(async (options) => {
    console.log(chalk.green('Welcome to bricklayer — TypeScript CLI scaffold generator'));

    const initSpinner = ora('Initializing project setup...').start();

    await new Promise((resolve) => setTimeout(resolve, 500));
    initSpinner.stop();

    const flagProvided = Boolean(options.destination);
    const flagHasArg = typeof options.destination === 'string';
    const askDestination = flagProvided && !flagHasArg;
    const answers = await promptProjectDetails({ skipName: flagProvided, askDestination });

    let target: string;
    if (flagHasArg) {
      const dest = (options.destination as string).replace(/^~/, os.homedir());
      target = path.resolve(dest);
      if (!answers.name) {
        answers.name = path.basename(target);
      }
    } else if (answers.destination) {
      const dest = answers.destination.replace(/^~/, os.homedir());
      target = path.resolve(dest);
      if (!answers.name) {
        answers.name = path.basename(target);
      }
    } else {
      const baseDir = process.cwd();
      target = path.resolve(baseDir, answers.name);
    }

    const versionSpinner = ora('Fetching latest package versions...').start();
    let versions: Record<string, string> | undefined;
    try {
      versions = await getLatestVersions();
      versionSpinner.succeed('Fetched latest package versions');
    } catch (err) {
      versionSpinner.warn('Failed to fetch latest versions, using defaults');
      console.debug(err);
    }

    const fileSpinner = ora('Creating project files...').start();

    try {
      await writeProjectFiles(target, answers, versions);
      fileSpinner.succeed('Project scaffold created at ' + target);

      if (answers.autoInstall) {
        await installDependencies(target, answers.packageManager);
      } else {
        console.log(chalk.yellow('Dependencies were not installed automatically.'));
      }

      console.log(chalk.blue('Next steps:'));
      console.log(`  - cd ${answers.name}`);
      const buildCmd =
        answers.packageManager === 'pnpm'
          ? 'pnpm run build'
          : answers.packageManager === 'yarn'
            ? 'yarn build'
            : answers.packageManager === 'bun'
              ? 'bun run build'
              : 'npm run build';
      console.log('  - Build: ' + buildCmd);
      if (!answers.autoInstall) {
        const installCmd =
          answers.packageManager === 'yarn' ? 'yarn install' : `${answers.packageManager} install`;
        console.log('  - Install dependencies: ' + installCmd);
      }
    } catch (err) {
      fileSpinner.fail('Failed to create project');
      console.error(err);
      process.exit(1);
    }
  });

  return cmd;
}

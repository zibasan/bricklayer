import chalk from 'chalk';
import Enquirer from 'enquirer';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';
import readline from 'readline';
import { ProjectAnswers } from './types.js';

type EnquirerChoice = { name: string; message: string };
type EnquirerSelectOptions = {
  name: string;
  message: string;
  choices: EnquirerChoice[];
  pageSize?: number;
};
type EnquirerInputOptions = {
  message: string;
  initial?: string;
};

type EnquirerSelectInstance = { run: () => Promise<string> };
type EnquirerInputInstance = { run: () => Promise<string> };

type EnquirerSelectCtor = new (options: EnquirerSelectOptions) => EnquirerSelectInstance;
type EnquirerInputCtor = new (options: EnquirerInputOptions) => EnquirerInputInstance;

type EnquirerModuleLike = {
  Select?: EnquirerSelectCtor;
  Input?: EnquirerInputCtor;
  default?: {
    Select?: EnquirerSelectCtor;
    Input?: EnquirerInputCtor;
  };
};

const enquirerModule = Enquirer as unknown as EnquirerModuleLike;
const Select = enquirerModule.Select || enquirerModule.default?.Select;
const Input = enquirerModule.Input || enquirerModule.default?.Input;

type PromptOptions = { skipName?: boolean; askDestination?: boolean };

export async function promptProjectDetails(
  opts: PromptOptions = {}
): Promise<ProjectAnswers & { destination?: string }> {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Project folder name (package name):',
      default: 'my-cli',
    },
    {
      type: 'list',
      name: 'moduleType',
      message: 'Module system:',
      choices: ['ESM', 'CommonJS'],
      default: 'ESM',
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Package manager to use:',
      choices: ['npm', 'pnpm', 'yarn', 'bun'],
      default: 'npm',
    },
    {
      type: 'list',
      name: 'linterFormatter',
      message: 'Linter / formatter setup:',
      choices: [
        { name: 'ESLint + Prettier', value: 'eslint+prettier' },
        { name: 'Biome', value: 'biome' },
      ],
      default: 'eslint+prettier',
    },
    {
      type: 'confirm',
      name: 'autoInstall',
      message: 'Automatically install dependencies after scaffold? (creates lockfile)',
      default: false,
    },
    {
      type: 'input',
      name: 'gitOwner',
      message: "Git repository owner's user id:",
      default: 'owner',
    },
    {
      type: 'input',
      name: 'gitRepo',
      message: 'Git repository name:',
      default: 'my-cli',
    },
    {
      type: 'input',
      name: 'npmPackageName',
      message: 'npm package name (scoped or unscoped):',
      default: (answers: Partial<ProjectAnswers>) => answers.name || 'my-cli',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: 'A minimal TypeScript CLI',
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author:',
      default: 'Anonymous',
    },
    {
      type: 'list',
      name: 'license',
      message: 'License:',
      choices: [
        'MIT',
        'Apache-2.0',
        'GPL-3.0',
        'GPL-2.0',
        'BSD-1-Clause',
        'BSD-2-Clause',
        'BSD-3-Clause',
      ],
      default: 'MIT',
    },
    {
      type: 'confirm',
      name: 'useHusky',
      message: 'Enable Husky git hooks (pre-commit / pre-push)?',
      default: true,
    },
  ];

  const totalQuestions = questions.length;
  const answers: Partial<ProjectAnswers & { destination?: string }> = {};

  console.log('');

  type BottomBar = { updateBottomBar: (s: string) => void; close: () => void };
  type InquirerWithUI = { ui?: { BottomBar?: new () => BottomBar } };
  const uiWith = inquirer as unknown as InquirerWithUI;
  const noop = () => {
    // Intentionally no-op when BottomBar UI is unavailable.
  };
  const bottomBar: BottomBar =
    uiWith.ui && uiWith.ui.BottomBar
      ? new uiWith.ui.BottomBar()
      : { updateBottomBar: noop, close: noop };

  const updateProgress = (n: number) => {
    const progressLine = `Project Scaffolding Progress: [${n}/${totalQuestions}]`;
    try {
      bottomBar.updateBottomBar(progressLine);
    } catch (err) {
      void err;
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(progressLine + '\n');
    }
  };

  const effectiveTotal = totalQuestions - (opts.skipName ? 1 : 0) + (opts.askDestination ? 1 : 0);
  let progressCount = 0;
  updateProgress(progressCount);

  if (opts.askDestination) {
    const chooseDirectoryInteractive = async (startDir: string) => {
      let current = startDir;
      while (true) {
        let entries: string[] = [];
        try {
          entries = fs.readdirSync(current).filter((name) => {
            try {
              return !name.startsWith('.') && fs.lstatSync(path.join(current, name)).isDirectory();
            } catch {
              return false;
            }
          });
        } catch {
          entries = [];
        }

        const choices = [
          { display: `Select this directory: ${current}`, value: '__SELECT__' },
          { display: '.. (go up)', value: '__UP__' },
          ...entries.map((e) => ({ display: e + path.sep, value: e })),
        ];

        choices.forEach((c) => {
          c.display = `◯ ${c.display}`;
        });

        if (!Select || !Input) {
          throw new Error('Enquirer Select/Input could not be resolved from the enquirer module.');
        }

        const select = new Select({
          name: 'dir',
          message: `destination: (navigate folders, Enter to choose)`,
          choices: choices.map((c) => ({ name: c.value, message: c.display })),
          pageSize: 15,
        });
        let val: string;
        try {
          val = await select.run();
        } catch (err) {
          console.error(
            'Selection aborted or failed:',
            err instanceof Error ? err.message : String(err)
          );
          throw err;
        }
        if (val === '__SELECT__') {
          while (true) {
            const input = new Input({
              message: 'destination: (edit or accept)',
              initial: current,
            });
            let proposed: string;
            try {
              proposed = (await input.run()).trim();
            } catch (err) {
              console.error('Input aborted:', err instanceof Error ? err.message : String(err));
              throw err;
            }

            const confirm = await inquirer.prompt<{ confirmSel: string }>([
              {
                type: 'list',
                name: 'confirmSel',
                message: `Create project at ${proposed}?`,
                choices: [
                  { name: 'Confirm and create here', value: 'confirm' },
                  { name: 'Re-enter destination', value: 'reenter' },
                  { name: 'Go back to folder navigation', value: 'back' },
                ],
              },
            ]);
            if (confirm.confirmSel === 'confirm') {
              return proposed;
            }
            if (confirm.confirmSel === 'reenter') {
              continue;
            }
            if (confirm.confirmSel === 'back') {
              break;
            }
          }
          continue;
        }
        if (val === '__UP__') {
          const parent = path.dirname(current);
          if (parent === current) {
            continue;
          }
          current = parent;
          continue;
        }
        current = path.join(current, val);
      }
    };

    progressCount++;
    updateProgress(progressCount);

    const dest = await chooseDirectoryInteractive(process.cwd());
    if (dest) {
      answers.destination = dest;
      console.log('→ Selected: ' + chalk.green(dest));
    }
  }

  const toAsk = opts.skipName ? questions.slice(1) : questions.slice();
  for (let i = 0; i < toAsk.length; i++) {
    const question = toAsk[i];

    progressCount++;
    updateProgress(progressCount);

    const answer = await inquirer.prompt<Record<string, unknown>>([question]);
    Object.assign(answers, answer as Record<string, unknown>);

    const key = question.name as string;
    const val = answer[key] as unknown;
    if (typeof val === 'string') {
      console.log('→ Selected: ' + chalk.green(val));
    } else if (Array.isArray(val)) {
      console.log('→ Selected: ' + val.map((v) => chalk.green(v)).join(', '));
    } else if (typeof val === 'boolean') {
      console.log('→ Selected: ' + (val ? chalk.green('yes') : chalk.yellow('no')));
    }
  }

  updateProgress(effectiveTotal);
  try {
    bottomBar.updateBottomBar(
      `Project Scaffolding Progress: [${effectiveTotal}/${effectiveTotal}] Done.`
    );
    bottomBar.close();
  } catch (err) {
    void err;
  }
  console.log('');

  return answers as ProjectAnswers;
}

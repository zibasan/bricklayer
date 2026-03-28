import { Command } from 'commander';
import { createCommand } from './create/index.js';
import { sampleCommand } from './sample.js';

const program = new Command();

program
  .name('brick')
  .description('Interactive CLI to scaffold TypeScript CLI projects')
  .version('1.0.6');

program.addCommand(createCommand());
program.addCommand(sampleCommand());

program.parseAsync(process.argv).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

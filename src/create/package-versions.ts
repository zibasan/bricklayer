import https from 'https';

export async function fetchLatestVersion(packageName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${packageName}/latest`;
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(`^${json.version}`);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

export async function getLatestVersions() {
  const packages = [
    'typescript',
    'ts-node',
    'husky',
    '@types/node',
    '@types/cli-progress',
    'eslint',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    '@typescript-eslint/parser',
    '@typescript-eslint/eslint-plugin',
    'typescript-eslint',
    '@eslint/json',
    'prettier',
    '@biomejs/biome',
    'lint-staged',
    'commander',
    'inquirer',
    'chalk',
    'cli-progress',
    'ora',
    'yargs',
    'pnpm',
    'npm',
    'yarn',
    'bun',
  ];

  const versions: Record<string, string> = {};

  try {
    await Promise.all(
      packages.map(async (pkg) => {
        try {
          versions[pkg] = await fetchLatestVersion(pkg);
        } catch (err) {
          console.warn(`Failed to fetch version for ${pkg}, using fallback:`, err);
          versions[pkg] = 'latest';
        }
      })
    );
  } catch (err) {
    console.warn('Failed to fetch some package versions', err);
  }

  return versions;
}

import { readFile } from 'fs/promises';

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url))
);

console.log(packageJson.dependencies.kerberos.endsWith(packageJson.version));

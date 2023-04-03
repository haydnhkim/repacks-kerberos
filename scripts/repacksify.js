import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import url from 'node:url';
import { readFile } from 'fs/promises';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const originPackageDir = path.resolve(
  __dirname,
  '..',
  'node_modules',
  'kerberos'
);
const repacksifyPackageDir = path.resolve(
  __dirname,
  '..',
  'packages',
  'kerberos'
);
const nativeDir = path.resolve(__dirname, '..', 'native');
const bindingFileName = 'repacks-kerberos-binding.js';
const packageName = '@repacks/kerberos';

const copyPackage = async () => {
  if (existsSync(repacksifyPackageDir)) return;
  await fs.mkdir(repacksifyPackageDir, { recursive: true });
  const files = await fs.readdir(originPackageDir);

  return Promise.all(
    files.map((file) => {
      if (['build', 'node_modules'].includes(file)) return;
      return fs
        .cp(
          path.resolve(originPackageDir, file),
          path.resolve(repacksifyPackageDir, file),
          { recursive: true }
        )
        .then(() => {})
        .catch((err) => console.error(err));
    })
  );
};

const prependReadMeMessage = async () => {
  const readMePath = path.resolve(repacksifyPackageDir, 'README.md');
  const readMeMd = await fs.readFile(readMePath, 'utf-8');

  if (readMeMd.includes(packageName)) return;

  const rootReadMeMd = await fs.readFile(
    path.resolve(__dirname, '..', 'README.md'),
    'utf-8'
  );

  const message = `${rootReadMeMd}

---

`;

  return fs.writeFile(readMePath, `${message}${readMeMd}`);
};

const moveNativeDir = async () => {
  if (!existsSync(nativeDir)) {
    console.error(`Run the \x1b[32m'pnpm download'\x1b[0m command first.`);
    throw new Error(`Native directory does not exist.`);
  }
  const repacksifyPackageNativeDir = path.resolve(
    repacksifyPackageDir,
    'src',
    'native'
  );
  if (existsSync(repacksifyPackageNativeDir)) return;
  return fs.rename(nativeDir, repacksifyPackageNativeDir);
};

const copyBindingCodeFile = async () => {
  return fs.cp(
    path.resolve(__dirname, '..', 'src', bindingFileName),
    path.resolve(repacksifyPackageDir, 'lib', bindingFileName)
  );
};

const replaceRequireCode = async () => {
  const kerberosPath = path.resolve(repacksifyPackageDir, 'lib', 'kerberos.js');
  const kerberosCode = await fs.readFile(kerberosPath, 'utf-8');

  if (kerberosCode.includes(bindingFileName)) return;

  return fs.writeFile(
    kerberosPath,
    kerberosCode.replace(
      `require('bindings')('kerberos')`,
      `require('./${bindingFileName.replace('.js', '')}')`
    )
  );
};

const replacePackageInfo = async () => {
  const packageJsonPath = path.resolve(repacksifyPackageDir, 'package.json');
  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
  packageJson.name = packageName;
  packageJson.repository.url =
    'https://github.com/haydnhkim/repacks-kerberos.git';
  packageJson.scripts.install = `echo 'install kerberos'`;
  return fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

await copyPackage();
await prependReadMeMessage();
await moveNativeDir();
await copyBindingCodeFile();
await replaceRequireCode();
await replacePackageInfo();

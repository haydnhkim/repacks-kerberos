'use strict';

const { readdirSync } = require('fs');
const { join } = require('path');

const { platform, arch } = process;

const nativeRelativePath = join('..', 'src', 'native');
const nativeDirs = readdirSync(join(__dirname, nativeRelativePath));
const nativePath = 'build/Release/kerberos.node';
let dirName = '';

const getNativeDirName = (target) => nativeDirs.find((n) => n.includes(target));

switch (platform) {
  case 'win32':
    dirName = getNativeDirName('win32');
    break;
  case 'darwin':
    switch (arch) {
      case 'x64':
        dirName = getNativeDirName('darwin-x64');
        break;
      case 'arm64':
        dirName = getNativeDirName('darwin-arm64');
        break;
      default:
        throw new Error(`Unsupported architecture on macOS: ${arch}`);
    }
    break;
  case 'linux':
    switch (arch) {
      case 'x64':
        dirName = getNativeDirName('linux-x64');
        break;
      case 'arm64':
        dirName = getNativeDirName('linux-arm64');
        break;
      default:
        throw new Error(`Unsupported architecture on Linux: ${arch}`);
    }
    break;
  default:
    throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`);
}

if (!dirName) {
  throw new Error(`Unsupported OS: ${platform}, architecture: ${arch}`);
}

let nativeBinding = null;
try {
  nativeBinding = require(`${nativeRelativePath}/${dirName}/${nativePath}`);
} catch (err) {
  console.error(
    `Use the \x1b[36m'kerberos'\x1b[0m package directly instead of \x1b[35m'@repacks/kerberos'\x1b[0m.`
  );
  throw new Error('Failed to load native binding', { cause: err });
}

module.exports = nativeBinding;

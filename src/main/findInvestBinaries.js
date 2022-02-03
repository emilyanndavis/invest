import path from 'path';
import { execFileSync } from 'child_process';

import { getLogger } from '../logger';

const logger = getLogger(__filename.split('/').slice(-1)[0]);

/**
 * Find paths to local invest executeable under dev or production environments.
 *
 * @param {boolean} isDevMode - a boolean designating dev mode or not.
 * @returns {string} invest binary path string.
 */
export default function findInvestBinaries(isDevMode) {
  try {
    // Binding to the invest server binary:
    let investExe;
    const ext = (process.platform === 'win32') ? '.exe' : '';
    const filename = `invest${ext}`;

    if (isDevMode) {
      investExe = filename; // assume an active python env w/ exe on path
    } else {
      investExe = path.join(process.resourcesPath, 'invest', filename);
      // It's likely the exe path includes spaces because it's composed of
      // app's Product Name, a user-facing name given to electron-builder.
      // Extra quotes because https://github.com/nodejs/node/issues/38490
      // Quoting depends on the shell, '/bin/sh' or 'cmd.exe'.
      if (process.platform === 'win32') {
        investExe = `""${investExe}""`;
      } else {
        investExe = `"'${investExe}'"`;
      }
    }
    // Checking that we have a functional invest exe by getting version
    // shell is necessary in dev mode when relying on an active conda env
    const investVersion = execFileSync(
      investExe, ['--version'], { shell: true }
    );
    logger.info(
      `Found invest binaries ${investExe} for version ${investVersion}`
    );
    return investExe;
  } catch (error) {
    logger.error(error.message);
    logger.error('InVEST binaries are probably missing.');
    throw error;
  }
}

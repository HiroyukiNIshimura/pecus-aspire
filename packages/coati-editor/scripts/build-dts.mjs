// tsc で出力した型定義を api-extractor でエントリ単位の 1 ファイルへロールアップする
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConsoleMessageId, Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const projectFolder = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tempTypes = join(projectFolder, '.dts-tmp');
const distFolder = join(projectFolder, 'dist');

const entries = {
  index: 'index.d.ts',
  nodes: 'nodes/index.d.ts',
  'nodes-headless': 'nodes/headless.d.ts',
  transformers: 'transformers/index.d.ts',
};

rmSync(tempTypes, { recursive: true, force: true });

execFileSync('npx', ['tsc', '--emitDeclarationOnly', '--declarationMap', 'false', '--outDir', tempTypes], {
  cwd: projectFolder,
  stdio: 'inherit',
});

let failed = false;

for (const [name, entryPath] of Object.entries(entries)) {
  const mainEntryPointFilePath = join(tempTypes, entryPath);
  if (!existsSync(mainEntryPointFilePath)) {
    throw new Error(`型定義が見つかりません: ${mainEntryPointFilePath}`);
  }

  const config = ExtractorConfig.prepare({
    configObject: {
      projectFolder,
      mainEntryPointFilePath,
      bundledPackages: [],
      compiler: { tsconfigFilePath: join(projectFolder, 'tsconfig.json') },
      apiReport: { enabled: false },
      docModel: { enabled: false },
      tsdocMetadata: { enabled: false },
      dtsRollup: {
        enabled: true,
        untrimmedFilePath: join(distFolder, `${name}.d.ts`),
      },
      messages: {
        compilerMessageReporting: { default: { logLevel: 'warning' } },
        extractorMessageReporting: {
          default: { logLevel: 'warning' },
          'ae-missing-release-tag': { logLevel: 'none' },
          'ae-forgotten-export': { logLevel: 'none' },
        },
        tsdocMessageReporting: { default: { logLevel: 'none' } },
      },
    },
    configObjectFullPath: undefined,
    packageJsonFullPath: join(projectFolder, 'package.json'),
  });

  const result = Extractor.invoke(config, {
    localBuild: true,
    showVerboseMessages: false,
    messageCallback: (message) => {
      // api-extractor 同梱 TS と本パッケージの TS のバージョン差通知は抑止する
      if (message.messageId === ConsoleMessageId.CompilerVersionNotice) {
        message.handled = true;
      }
    },
  });

  if (!result.succeeded) {
    failed = true;
    console.error(`api-extractor failed for entry "${name}"`);
  }
}

rmSync(tempTypes, { recursive: true, force: true });

if (failed) {
  process.exit(1);
}

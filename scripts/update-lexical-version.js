#!/usr/bin/env node
/**
 * @lexical / lexical パッケージのバージョンを全プロジェクトで一括更新するスクリプト
 *
 * 使い方:
 *   node scripts/update-lexical-version.js [version] [options]
 *
 * オプション:
 *   --install    npm install を各プロジェクトで実行する
 *   --build      packages/coati-editor のビルドも実行する (--install を含む)
 *   --ncu-check  ncu で更新候補を確認する
 *   --ncu-update ncu -u で package.json を更新する
 *   --ncu-filter ncu の --filter を指定する (例: --ncu-filter react,typescript)
 *   --help       ヘルプを表示する
 *
 * 例:
 *   node scripts/update-lexical-version.js 0.42.0
 *   node scripts/update-lexical-version.js 0.42.0 --install
 *   node scripts/update-lexical-version.js 0.42.0 --build
 *   node scripts/update-lexical-version.js --ncu-check
 *   node scripts/update-lexical-version.js --ncu-update --install
 *   node scripts/update-lexical-version.js 0.44.0 --ncu-update --ncu-filter react --install
 *
 * 更新対象:
 *   - package.json (ルート overrides)
 *   - packages/coati-editor/package.json
 *   - pecus.Frontend/package.json
 *   - pecus.LexicalConverter/package.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

const TARGET_FILES = [
  'package.json',
  'packages/coati-editor/package.json',
  'pecus.Frontend/package.json',
  'pecus.LexicalConverter/package.json',
];

function isLexicalKey(key) {
  return key === 'lexical' || key.startsWith('@lexical/');
}

function updateVersionInObject(obj, version) {
  let count = 0;
  for (const key of Object.keys(obj)) {
    if (isLexicalKey(key)) {
      if (obj[key] !== version) {
        obj[key] = version;
        count++;
      }
    }
  }
  return count;
}

function updatePackageJson(filePath, version) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const pkg = JSON.parse(raw);
  let totalUpdated = 0;

  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'overrides']) {
    if (pkg[section]) {
      totalUpdated += updateVersionInObject(pkg[section], version);
    }
  }

  if (totalUpdated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  }

  return totalUpdated;
}

// npm install を実行するディレクトリ (install/build オプション時)
const INSTALL_DIRS = [
  '.', // ルート (workspace install)
  'packages/coati-editor',
  'pecus.Frontend',
  'pecus.LexicalConverter',
];

function run(cmd, cwd) {
  console.log(`  $ ${cmd}  (${path.relative(ROOT_DIR, cwd) || '.'})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function showHelp() {
  console.log('使い方:');
  console.log('  node scripts/update-lexical-version.js [version] [options]');
  console.log('');
  console.log('オプション:');
  console.log('  --install      npm install を各プロジェクトで実行する');
  console.log('  --build        packages/coati-editor のビルドも実行する (--install を含む)');
  console.log('  --ncu-check    ncu で更新候補を確認する');
  console.log('  --ncu-update   ncu -u で package.json を更新する');
  console.log('  --ncu-filter   ncu の --filter を指定する (例: --ncu-filter react,typescript)');
  console.log('  --help         ヘルプを表示する');
  console.log('');
  console.log('例:');
  console.log('  node scripts/update-lexical-version.js 0.44.0 --build');
  console.log('  node scripts/update-lexical-version.js --ncu-check');
  console.log('  node scripts/update-lexical-version.js --ncu-update --install');
}

function parseArgs(rawArgs) {
  const options = {
    version: null,
    doInstall: false,
    doBuild: false,
    doNcuCheck: false,
    doNcuUpdate: false,
    ncuFilter: null,
    showHelp: false,
  };

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg === '--install') {
      options.doInstall = true;
      continue;
    }
    if (arg === '--build') {
      options.doBuild = true;
      options.doInstall = true;
      continue;
    }
    if (arg === '--ncu-check') {
      options.doNcuCheck = true;
      continue;
    }
    if (arg === '--ncu-update') {
      options.doNcuUpdate = true;
      continue;
    }
    if (arg === '--ncu-filter') {
      const value = rawArgs[i + 1];
      if (!value || value.startsWith('--')) {
        console.error('エラー: --ncu-filter の値を指定してください。');
        process.exit(1);
      }
      options.ncuFilter = value;
      i++;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      options.showHelp = true;
      continue;
    }

    if (arg.startsWith('--')) {
      console.error(`エラー: 不明なオプションです: ${arg}`);
      process.exit(1);
    }

    if (options.version) {
      console.error('エラー: バージョンは1つだけ指定してください。');
      process.exit(1);
    }
    options.version = arg;
  }

  return options;
}

function runNcu({ update, filter }) {
  const baseCmd = update ? 'npx ncu -u' : 'npx ncu';
  const cmd = filter ? `${baseCmd} --filter ${JSON.stringify(filter)}` : baseCmd;

  console.log(`\nncu (${update ? '更新' : '確認'}) を実行します...\n`);
  for (const relDir of INSTALL_DIRS) {
    const dir = path.join(ROOT_DIR, relDir);
    if (!fs.existsSync(dir)) continue;
    try {
      run(cmd, dir);
    } catch (_e) {
      console.error(`  ncu 実行失敗: ${relDir}`);
      process.exit(1);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.showHelp) {
    showHelp();
    process.exit(0);
  }

  const hasVersion = Boolean(options.version);
  const hasNcuAction = options.doNcuCheck || options.doNcuUpdate;

  if (!hasVersion && !hasNcuAction) {
    console.error('エラー: バージョンまたは ncu オプションを指定してください。');
    showHelp();
    process.exit(1);
  }

  // --- 1. package.json 更新 (@lexical) ---
  let anyUpdated = false;

  if (hasVersion) {
    if (!/^\d+\.\d+\.\d+$/.test(options.version)) {
      console.error(`エラー: バージョン形式が不正です: "${options.version}" (例: 0.42.0)`);
      process.exit(1);
    }

    console.log(`@lexical バージョンを ${options.version} に更新します...\n`);

    for (const relPath of TARGET_FILES) {
      const filePath = path.join(ROOT_DIR, relPath);

      if (!fs.existsSync(filePath)) {
        console.warn(`  スキップ (存在しない): ${relPath}`);
        continue;
      }

      const updated = updatePackageJson(filePath, options.version);

      if (updated > 0) {
        console.log(`  更新: ${relPath} (${updated} 件)`);
        anyUpdated = true;
      } else {
        console.log(`  変更なし: ${relPath}`);
      }
    }
  }

  // --- 2. ncu 実行 ---
  if (options.doNcuCheck) {
    runNcu({ update: false, filter: options.ncuFilter });
  }
  if (options.doNcuUpdate) {
    runNcu({ update: true, filter: options.ncuFilter });
  }

  // --- 3. npm install ---
  if (options.doInstall) {
    console.log('\nnpm install を実行します...\n');
    for (const relDir of INSTALL_DIRS) {
      const dir = path.join(ROOT_DIR, relDir);
      if (!fs.existsSync(dir)) continue;
      try {
        run('npm install', dir);
      } catch (_e) {
        console.error(`  npm install 失敗: ${relDir}`);
        process.exit(1);
      }
    }
  }

  // --- 4. coati-editor ビルド ---
  if (options.doBuild) {
    const editorDir = path.join(ROOT_DIR, 'packages/coati-editor');
    console.log('\ncoati-editor をビルドします...\n');
    try {
      run('npm run build', editorDir);
    } catch (_e) {
      console.error('  coati-editor ビルド失敗');
      process.exit(1);
    }
  }

  // --- 完了メッセージ ---
  console.log('');
  if (options.doNcuUpdate && !options.doInstall) {
    console.log('完了。ncu で package.json を更新しました。反映のため npm install を実行してください。');
  } else if (!options.doInstall && anyUpdated) {
    console.log('完了。@lexical 変更を反映するため npm install を実行してください。');
  } else if (!options.doInstall && !anyUpdated && hasVersion && !hasNcuAction) {
    console.log('すでに全プロジェクトが指定バージョンです。');
  } else {
    console.log('すべての処理が完了しました。');
  }
}

main();

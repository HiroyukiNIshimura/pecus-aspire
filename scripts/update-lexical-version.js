#!/usr/bin/env node
/**
 * @lexical / lexical パッケージのバージョンを全プロジェクトで一括更新するスクリプト
 *
 * 使い方:
 *   node scripts/update-lexical-version.js <version> [options]
 *
 * オプション:
 *   --install    npm install を各プロジェクトで実行する
 *   --build      packages/coati-editor のビルドも実行する (--install を含む)
 *
 * 例:
 *   node scripts/update-lexical-version.js 0.42.0
 *   node scripts/update-lexical-version.js 0.42.0 --install
 *   node scripts/update-lexical-version.js 0.42.0 --build
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

function main() {
  const args = process.argv.slice(2);
  const version = args.find((a) => !a.startsWith('--'));
  const doInstall = args.includes('--install') || args.includes('--build');
  const doBuild = args.includes('--build');

  if (!version) {
    console.error('エラー: バージョンを指定してください。');
    console.error('使い方: node scripts/update-lexical-version.js <version> [--install] [--build]');
    console.error('例:     node scripts/update-lexical-version.js 0.42.0 --build');
    process.exit(1);
  }

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error(`エラー: バージョン形式が不正です: "${version}" (例: 0.42.0)`);
    process.exit(1);
  }

  // --- 1. package.json 更新 ---
  console.log(`@lexical バージョンを ${version} に更新します...\n`);

  let anyUpdated = false;

  for (const relPath of TARGET_FILES) {
    const filePath = path.join(ROOT_DIR, relPath);

    if (!fs.existsSync(filePath)) {
      console.warn(`  スキップ (存在しない): ${relPath}`);
      continue;
    }

    const updated = updatePackageJson(filePath, version);

    if (updated > 0) {
      console.log(`  更新: ${relPath} (${updated} 件)`);
      anyUpdated = true;
    } else {
      console.log(`  変更なし: ${relPath}`);
    }
  }

  // --- 2. npm install ---
  if (doInstall) {
    console.log('\nnpm install を実行します...\n');
    for (const relDir of INSTALL_DIRS) {
      const dir = path.join(ROOT_DIR, relDir);
      if (!fs.existsSync(dir)) continue;
      try {
        run('npm install', dir);
      } catch (e) {
        console.error(`  npm install 失敗: ${relDir}`);
        process.exit(1);
      }
    }
  }

  // --- 3. coati-editor ビルド ---
  if (doBuild) {
    const editorDir = path.join(ROOT_DIR, 'packages/coati-editor');
    console.log('\ncoati-editor をビルドします...\n');
    try {
      run('npm run build', editorDir);
    } catch (e) {
      console.error('  coati-editor ビルド失敗');
      process.exit(1);
    }
  }

  // --- 完了メッセージ ---
  console.log('');
  if (!doInstall && anyUpdated) {
    console.log('完了。各プロジェクトで npm install を実行してください。');
  } else if (!doInstall && !anyUpdated) {
    console.log('すでに全プロジェクトが指定バージョンです。');
  } else {
    console.log('すべての処理が完了しました。');
  }
}

main();

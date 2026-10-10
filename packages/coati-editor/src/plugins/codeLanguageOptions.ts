import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-yaml';

import { getCodeLanguageOptions } from '@lexical/code-prism';

const ADDITIONAL_LANGUAGE_OPTIONS: [string, string][] = [
  ['json', 'JSON'],
  ['shell', 'Shell'],
  ['yaml', 'YAML'],
  ['csharp', 'C#'],
  ['kotlin', 'Kotlin'],
  ['php', 'PHP'],
  ['ruby', 'Ruby'],
];

const SUPPORTED_LANGUAGE_IDS = new Set([
  'c',
  'clike',
  'cpp',
  'css',
  'go',
  'html',
  'java',
  'js',
  'javascript',
  'json',
  'markdown',
  'objc',
  'objective-c',
  'plain',
  'powershell',
  'py',
  'python',
  'rust',
  'shell',
  'sql',
  'swift',
  'typescript',
  'xml',
  'yaml',
  'csharp',
  'kotlin',
  'php',
  'ruby',
]);

export const CODE_LANGUAGE_OPTIONS: [string, string][] = [
  ...getCodeLanguageOptions(),
  ...ADDITIONAL_LANGUAGE_OPTIONS,
].filter(
  ([id], index, options) =>
    SUPPORTED_LANGUAGE_IDS.has(id) && options.findIndex(([optionId]) => optionId === id) === index,
);

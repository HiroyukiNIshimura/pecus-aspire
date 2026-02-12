const fs = require('node:fs');
const path = require('node:path');

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function usage() {
  const scriptName = path.basename(process.argv[1]);
  console.log(`Usage: node ${scriptName} --subject "題名" --file "./doc.md"`);
  console.log(`   or: node ${scriptName} --subject "題名" --body "マークダウン本文"`);
  console.log('');
  console.log('Optional args:');
  console.log('  --workspace <id>  (env COATI_WORKSPACE_ID)');
  console.log('  --owner <id>      (env COATI_OWNER_LOGIN_ID)');
  console.log('  --base-url <url>  (env COATI_API_BASE_URL)');
  console.log('  --api-key <key>   (env COATI_API_KEY)');
}

async function main() {
  const subject = getArg('subject');
  const bodyArg = getArg('body');
  const filePath = getArg('file');

  const baseUrl = getArg('base-url') || process.env.COATI_API_BASE_URL || 'https://coati.bright-l.0am.jp/backend/api';
  const workspaceId = getArg('workspace') || process.env.COATI_WORKSPACE_ID;
  const ownerLoginId = getArg('owner') || process.env.COATI_OWNER_LOGIN_ID;
  const apiKey = getArg('api-key') || process.env.COATI_API_KEY;

  if (!subject || (!bodyArg && !filePath) || !workspaceId || !ownerLoginId || !apiKey) {
    console.error('Missing required parameters.');
    usage();
    process.exit(1);
  }

  let body = bodyArg;
  if (!body && filePath) {
    const resolved = path.resolve(filePath);
    body = fs.readFileSync(resolved, 'utf8');
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/external/workspaces/${workspaceId}/items`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      subject,
      body,
      ownerLoginId,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`Request failed: ${response.status} ${response.statusText}`);
    if (responseText) {
      console.error(responseText);
    }
    process.exit(1);
  }

  console.log(`Success: ${response.status}`);
  if (responseText) {
    console.log(responseText);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error?.message || error);
  process.exit(1);
});

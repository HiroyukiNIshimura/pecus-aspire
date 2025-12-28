import fs from 'node:fs';
import path from 'node:path';

interface HelpIndexEntry {
  slug: string;
  title: string;
  description: string;
  content: string;
  headings: string[];
  order: number;
}

function generateHelpIndex() {
  const helpDir = path.join(process.cwd(), 'src/content/help/ja');

  if (!fs.existsSync(helpDir)) {
    console.log('⚠️ Help directory not found, skipping index generation');
    return;
  }

  const files = fs.readdirSync(helpDir).filter((f) => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('⚠️ No markdown files found, skipping index generation');
    return;
  }

  const index: HelpIndexEntry[] = files.map((file) => {
    const content = fs.readFileSync(path.join(helpDir, file), 'utf-8');

    const plainText = content
      .replace(/[#*`_~[\]|]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    const headings =
      content.match(/^#{1,3}\s+.+$/gm)?.map((h) => h.replace(/^#+\s+/, '')) || [];

    const title = headings[0] || file.replace(/^\d+-/, '').replace('.md', '');
    const description = headings.slice(1, 3).join(' / ') || '';

    const orderMatch = file.match(/^(\d+)/);
    const order = orderMatch ? Number.parseInt(orderMatch[1], 10) : 999;

    return {
      slug: file.replace('.md', ''),
      title,
      description,
      content: plainText,
      headings,
      order,
    };
  });

  index.sort((a, b) => a.order - b.order);

  const outputPath = path.join(process.cwd(), 'src/content/help/search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));

  console.log(`✅ Generated help search index: ${index.length} entries`);
}

generateHelpIndex();

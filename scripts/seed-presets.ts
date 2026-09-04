import fs from 'fs';
import path from 'path';
import { TRENDING_TEMPLATES } from '../src/lib/trendingTemplates';

async function seedPresets() {
  console.log('==> Seeding Domain Preset Templates...');
  const outputDir = path.resolve(__dirname, '../src/fixtures');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'presets.json');
  fs.writeFileSync(outputPath, JSON.stringify(TRENDING_TEMPLATES, null, 2), 'utf-8');

  console.log(`✓ Successfully seeded ${TRENDING_TEMPLATES.length} domain templates to ${outputPath}`);
  TRENDING_TEMPLATES.forEach((tpl, idx) => {
    console.log(`  [${idx + 1}] ${tpl.title} (${tpl.domain} · ${tpl.targetModality})`);
  });
}

seedPresets().catch(console.error);

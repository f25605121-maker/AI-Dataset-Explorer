/**
 * Verification Test: Modality Taxonomy Expansion, Relaxed Queries & Resilient Architecture
 */

import { parseQuery, classifyModality, SupportedModality } from '../src/lib/queryParser';
import { understandQuery } from '../src/lib/search/queryUnderstanding';
import { expandQueries } from '../src/lib/search/queryExpansion';
import { fetchKaggleCandidates } from '../src/lib/search/providers/kaggle';

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 RUNNING CRYO-EM/ET TAXONOMY & RETRIEVAL RESILIENCE TESTS');
  console.log('===========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
    }
  }

  // TEST 1: Modality classification across SupportedModality variants
  console.log('--- Test Suite 1: SupportedModality Classification ---');
  assert(classifyModality('Cryo-ET macromolecular complexes') === 'Cryo-EM/ET', 'Cryo-ET classified as Cryo-EM/ET');
  assert(classifyModality('subtomogram averaging of ribosomes') === 'Cryo-EM/ET', 'subtomogram classified as Cryo-EM/ET');
  assert(classifyModality('single particle cryo-EM structure') === 'Cryo-EM/ET', 'cryo-EM classified as Cryo-EM/ET');
  assert(classifyModality('cellular electron tomography 3D') === 'Cryo-EM/ET', 'electron tomography classified as Cryo-EM/ET');
  assert(classifyModality('fluorescence confocal microscopy imaging') === 'Fluorescence', 'Confocal classified as Fluorescence');
  assert(classifyModality('whole slide histopathology biopsy') === 'Histopathology', 'Histopathology recognized');
  assert(classifyModality('4D flow cardiac MRI velocity') === 'MRI', 'MRI recognized');
  assert(classifyModality('chest CT pulmonary nodules') === 'CT', 'CT recognized');
  assert(classifyModality('pediatric chest x-ray pneumonia') === 'X-Ray', 'X-Ray recognized');
  assert(classifyModality('fetal echocardiography ultrasound') === 'Ultrasound', 'Ultrasound recognized');
  assert(classifyModality('single-cell RNA-seq gene expression tabular') === 'Genomics/Tabular', 'Genomics/Tabular recognized');
  assert(classifyModality('general machine learning classifier') === 'General', 'General fallback recognized');

  // TEST 2: parseQuery on Cryo-ET queries
  console.log('\n--- Test Suite 2: parseQuery & Domain Integrity ---');
  const parsed1 = await parseQuery('Cryo-ET macromolecule structural identification');
  assert(parsed1.constraints.modality[0] === 'Cryo-EM/ET', `Modality is Cryo-EM/ET (got ${parsed1.constraints.modality[0]})`);
  assert(
    parsed1.constraints.domain === 'Structural Biology & Microscopy',
    `Domain preserved as 'Structural Biology & Microscopy' (got ${parsed1.constraints.domain})`
  );
  assert(
    parsed1.expandedQueries.kaggleDatasetQueries.includes('cryo-et') &&
    parsed1.expandedQueries.kaggleDatasetQueries.includes('electron tomography') &&
    parsed1.expandedQueries.kaggleDatasetQueries.includes('subtomogram'),
    `Relaxed Kaggle queries generated: ${JSON.stringify(parsed1.expandedQueries.kaggleDatasetQueries)}`
  );

  // TEST 3: parseQuery on Electron Tomography
  console.log('\n--- Test Suite 3: Electron Tomography Queries ---');
  const parsed2 = await parseQuery('cellular electron tomography subtomogram segmentation');
  assert(parsed2.constraints.modality[0] === 'Cryo-EM/ET', `Electron tomography maps to Cryo-EM/ET`);
  assert(parsed2.constraints.domain === 'Structural Biology & Microscopy', `Domain not downgraded to General AI`);
  assert(parsed2.entities.kaggleQueries.length >= 5, `High-recall Kaggle queries count >= 5 (got ${parsed2.entities.kaggleQueries.length})`);

  // TEST 4: Query Understanding Engine (15-Stage Pipeline)
  console.log('\n--- Test Suite 4: 15-Stage Engine Query Understanding ---');
  const qu = understandQuery('cryo-electron tomography macromolecular complex detection');
  assert(qu.domain === 'structural_biology_microscopy', `15-stage domain is structural_biology_microscopy (got ${qu.domain})`);
  assert(qu.modality.includes('Cryo-EM/ET'), `15-stage modality contains Cryo-EM/ET`);

  const expansions = expandQueries(qu);
  assert(
    expansions.datasetQueries.some(q => q.includes('cryo') || q.includes('electron tomography')),
    `15-stage dataset queries contain relaxed microscopy queries`
  );

  // TEST 5: Kaggle Provider Fallback for Cryo queries
  console.log('\n--- Test Suite 5: Kaggle Provider Verified Fallback Candidates ---');
  const candidates = await fetchKaggleCandidates(['cryo-et'], qu);
  assert(candidates.length > 0, `Kaggle candidates returned > 0 (got ${candidates.length})`);
  assert(candidates.some(c => c.id.includes('czii') || c.id.includes('cryo')), `Verified benchmark candidate CZII present`);

  console.log('\n===========================================================');
  console.log(`SUMMARY: ${passed} / ${total} ASSERTIONS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('===========================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

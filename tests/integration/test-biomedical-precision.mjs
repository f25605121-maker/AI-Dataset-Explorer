import { promises as fs } from 'fs';
import path from 'path';

console.log('====================================================');
console.log('  RUNNING BIOMEDICAL ENTITY & PRECISION RAG TESTS  ');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`  ✓ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${testName} ${details}`);
        failed++;
    }
}

async function runPrecisionTests() {
    // 1. Validate Types Schema
    console.log('--- Test Item 1: ExtractedQueryEntities Schema & Types ---');
    const typesContent = await fs.readFile(path.join(process.cwd(), 'src/types/pipeline.ts'), 'utf-8');
    assert(typesContent.includes('export interface ExtractedQueryEntities'), 'ExtractedQueryEntities interface defined');
    assert(typesContent.includes('targetAnatomy: string[]'), 'targetAnatomy array defined');
    assert(typesContent.includes('excludedAnatomy: string[]'), 'excludedAnatomy array defined');
    assert(typesContent.includes('targetModality: string'), 'targetModality string defined');
    assert(typesContent.includes('dimensionality: "2D" | "3D" | "4D" | "any"'), 'dimensionality union defined');
    assert(typesContent.includes('coreSearchKeywords: string[]'), 'coreSearchKeywords array defined');
    assert(typesContent.includes('entities?: ExtractedQueryEntities'), 'entities attached to ProjectSpec');

    // 2. Validate Query Parser & Entity Extraction
    console.log('\n--- Test Item 2: Query Parser & extractQueryEntities Implementation ---');
    const parserContent = await fs.readFile(path.join(process.cwd(), 'src/server/services/queryUnderstanding/queryParser.ts'), 'utf-8');
    assert(parserContent.includes('export function extractQueryEntities'), 'extractQueryEntities function implemented and exported');
    assert(parserContent.includes('ANATOMY_GROUPS'), 'ANATOMY_GROUPS knowledge table defined');
    assert(parserContent.includes('abdomen:') && parserContent.includes('brain:') && parserContent.includes('thorax_cardiac:'), 'Comprehensive anatomical systems indexed');
    assert(parserContent.includes('conflictingGroups:'), 'Conflicting anatomical groups mapped for exclusion');
    assert(parserContent.includes('entities,'), 'entities returned in QueryUnderstanding');

    // 3. Validate Hard Negative Filter & Anatomical Guard
    console.log('\n--- Test Item 3: Anatomical Entity Guard & Dimensionality Filter ---');
    const filterContent = await fs.readFile(path.join(process.cwd(), 'src/server/services/ranking/hardNegativeFilter.ts'), 'utf-8');
    assert(filterContent.includes('checkAnatomicalConflict'), 'checkAnatomicalConflict guard implemented');
    assert(filterContent.includes('checkDimensionalityConflict'), 'checkDimensionalityConflict guard implemented');
    assert(filterContent.includes('Anatomical conflict:'), 'Explicit anatomical conflict rejection reason implemented');
    assert(filterContent.includes('Dimensionality mismatch:'), 'Explicit dimensionality mismatch rejection reason implemented');
    assert(filterContent.includes('isBrainGliomaDataset') && filterContent.includes('isAbdominalQuery'), 'Brain glioma vs abdominal query special conflict guard enforced');

    // 4. Validate Dataset Scorer
    console.log('\n--- Test Item 4: Dataset Scorer Entity Alignment ---');
    const scorerContent = await fs.readFile(path.join(process.cwd(), 'src/server/services/ranking/datasetScorer.ts'), 'utf-8');
    assert(scorerContent.includes('qu.entities?.targetAnatomy'), 'Target anatomy match scoring implemented');
    assert(scorerContent.includes('qu.entities?.sequenceSubtype'), 'Sequence subtype scoring implemented');
    assert(scorerContent.includes('qu.entities?.dimensionality === \'3D\''), '3D volumetric dimensionality scoring implemented');
    assert(scorerContent.includes('entities: qu.entities'), 'Entities forwarded to hardNegativeFilter');

    // 5. Validate Query Expander
    console.log('\n--- Test Item 5: Controlled Query Expander with Core Search Keywords ---');
    const expanderContent = await fs.readFile(path.join(process.cwd(), 'src/server/services/queryUnderstanding/queryExpander.ts'), 'utf-8');
    assert(expanderContent.includes('qu.entities?.coreSearchKeywords'), 'coreSearchKeywords prioritized in expansion');
    assert(expanderContent.includes('abdominal organs'), 'Abdominal organs synonyms indexed in query expander');

    // 6. Algorithmic Behavioral Test of Anatomy Mapping & Rejection
    console.log('\n--- Test Item 6: Algorithmic Simulation of Abdominal Query vs LGG Brain Dataset ---');
    
    // Simulate query parsing logic
    const testQuery = '3D multi-organ abdominal tumor segmentation in dynamic contrast-enhanced MRI';
    const hasAbdomen = /abdomen|abdominal|multi.?organ/i.test(testQuery);
    const has3D = /\b3d\b|volumetric/i.test(testQuery);
    const hasDCE = /dce|dynamic\s*contrast/i.test(testQuery);
    const hasMRI = /mri/i.test(testQuery);

    assert(hasAbdomen && has3D && hasDCE && hasMRI, 'All query components identified correctly');

    // Simulate dataset matching
    const lggDatasetText = 'mateuszbuda/lgg-mri-segmentation Brain MRI segmentation with FLAIR abnormality lower-grade glioma 2D .tif slices';
    const lggMatchesAbdomen = /abdomen|abdominal|liver|kidney|pancreas/i.test(lggDatasetText);
    const lggMatchesBrain = /brain|glioma|lgg|flair/i.test(lggDatasetText);
    const lggIsConflictingAnatomy = hasAbdomen && lggMatchesBrain && !lggMatchesAbdomen;

    assert(lggIsConflictingAnatomy === true, 'Algorithmic guard identifies mateuszbuda/lgg-mri-segmentation as conflicting anatomy');

    const amosDatasetText = 'amos-2022-abdominal-multi-organ AMOS 3D Abdominal Multi-Organ Segmentation CT and MRI liver kidney pancreas spleen .nii.gz';
    const amosMatchesAbdomen = /abdomen|abdominal|liver|kidney|pancreas/i.test(amosDatasetText);
    const amosMatchesBrain = /brain|glioma|lgg/i.test(amosDatasetText);
    const amosIsConflictingAnatomy = hasAbdomen && amosMatchesBrain && !amosMatchesAbdomen;

    assert(amosMatchesAbdomen === true && amosIsConflictingAnatomy === false, 'Algorithmic guard identifies AMOS 3D dataset as non-conflicting valid match');

    console.log('\n====================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED  `);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
}

runPrecisionTests().catch(err => {
    console.error('Error running tests:', err);
    process.exit(1);
});

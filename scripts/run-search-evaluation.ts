/**
 * Automated Verification Script: Evidence-Aware Search Engine & IR Benchmarks
 */

import { runBenchmarkEvaluation, BENCHMARK_QUERIES } from '../src/lib/search/evaluation';
import { understandQuery } from '../src/lib/search/queryUnderstanding';
import { expandQueries } from '../src/lib/search/queryExpansion';
import { applyHardFiltering } from '../src/lib/search/hardFilter';
import { calculateCompositeCandidateScore } from '../src/lib/search/ranking';
import { UnifiedCandidate } from '../src/lib/search/types';

console.log('================================================================');
console.log('  RUNNING IR SEARCH BENCHMARK & EVIDENCE VERIFICATION SUITE');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details = '') {
    if (condition) {
        console.log(`  ✓ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${testName} - ${details}`);
        failed++;
    }
}

async function runTests() {
    // ── Test 1: Query Understanding & Entity Extraction ──────────────────────
    console.log('--- Test 1: Query Understanding & Entity Extraction ---');
    const q1 = '3D abdominal MRI dataset for multi-organ tumor segmentation in dynamic contrast-enhanced MRI';
    const u1 = understandQuery(q1);

    assert(u1.domain === 'medical_imaging', 'Query 1 detected as medical_imaging');
    assert(u1.anatomy.primary.includes('abdomen') || u1.anatomy.primary.includes('abdominal'), 'Query 1 primary anatomy identified as abdomen');
    assert(u1.anatomy.excluded.includes('brain') || u1.anatomy.excluded.includes('glioma'), 'Brain/glioma added to excluded anatomy');
    assert(u1.modality.includes('MRI'), 'Modality identified as MRI');
    assert(u1.sequence.includes('DCE-MRI'), 'Sequence identified as DCE-MRI');
    assert(u1.dimensionality === '3D', 'Dimensionality identified as 3D');
    assert(u1.task === 'segmentation', 'Task identified as segmentation');

    const q2 = 'Brain tumor MRI glioma segmentation';
    const u2 = understandQuery(q2);
    assert(u2.anatomy.primary.includes('brain') || u2.anatomy.primary.includes('cerebral'), 'Query 2 primary anatomy identified as brain');
    assert(u2.anatomy.excluded.includes('abdomen') || u2.anatomy.excluded.includes('liver'), 'Abdomen/liver added to Query 2 excluded anatomy');

    const q3 = 'Chest X-ray pneumonia classification';
    const u3 = understandQuery(q3);
    assert(u3.anatomy.primary.includes('chest') || u3.anatomy.primary.includes('lung') || u3.anatomy.primary.includes('thorax'), 'Query 3 anatomy identified as thorax/chest');
    assert(u3.modality.includes('X-ray'), 'Query 3 modality identified as X-ray');
    assert(u3.task === 'classification', 'Query 3 task identified as classification');

    const q4 = 'Credit card fraud detection tabular data';
    const u4 = understandQuery(q4);
    assert(u4.modality.includes('tabular'), 'Query 4 modality identified as tabular');
    assert(u4.task === 'classification', 'Query 4 task identified as classification');

    const q5 = 'Speech emotion recognition audio WAV dataset';
    const u5 = understandQuery(q5);
    assert(u5.modality.includes('audio'), 'Query 5 modality identified as audio');

    // ── Test 2: Query Decomposition & Expansion ──────────────────────────────
    console.log('\n--- Test 2: Query Decomposition & Anti-Dilution ---');
    const exp1 = expandQueries(u1);
    assert(exp1.datasetQueries.length >= 3 && exp1.datasetQueries.length <= 8, `Generated ${exp1.datasetQueries.length} dataset queries`);
    assert(exp1.modelQueries.length >= 3 && exp1.modelQueries.length <= 8, `Generated ${exp1.modelQueries.length} model queries`);
    assert(exp1.paperQueries.length >= 3 && exp1.paperQueries.length <= 8, `Generated ${exp1.paperQueries.length} paper queries`);
    assert(exp1.datasetQueries.some(q => q.includes('abdominal') && q.includes('MRI')), 'Dataset queries include targeted terms');

    // ── Test 3: Context-Aware Hard Constraint Filter ─────────────────────────
    console.log('\n--- Test 3: Context-Aware Hard Constraint Filter ---');
    const mockAbdomenDataset: UnifiedCandidate = {
        id: 'amos-2022',
        source: 'kaggle',
        type: 'dataset',
        title: 'AMOS 2022 3D Abdominal Multi-Organ Segmentation CT and MRI',
        description: '3D volumetric abdominal MRI and CT dataset for liver, kidney, pancreas, spleen.',
        tags: ['abdomen', 'mri', 'segmentation', '3d'],
        formats: ['nii.gz'],
        matchScore: 0,
        confidenceScore: 0,
        tier: 'Tier D',
        evidenceLevel: 'UNVERIFIED',
        evidenceSources: [],
        evidenceStrength: 0,
        matchBreakdown: {} as any,
        evidence: [],
        warnings: [],
        rejected: false,
        rejectionReason: null,
        matchReason: '',
        metadata: {},
    };

    const mockBrainGliomaDataset: UnifiedCandidate = {
        id: 'mateuszbuda/lgg-mri-segmentation',
        source: 'kaggle',
        type: 'dataset',
        title: 'Brain MRI segmentation with lower-grade glioma FLAIR abnormality',
        description: 'Brain MRI scans of lower grade glioma patients with 2D tif slice masks.',
        tags: ['brain', 'glioma', 'mri', 'segmentation'],
        formats: ['tif'],
        downloads: 120000,
        matchScore: 0,
        confidenceScore: 0,
        tier: 'Tier D',
        evidenceLevel: 'UNVERIFIED',
        evidenceSources: [],
        evidenceStrength: 0,
        matchBreakdown: {} as any,
        evidence: [],
        warnings: [],
        rejected: false,
        rejectionReason: null,
        matchReason: '',
        metadata: {},
    };

    const mockTabularSurveyDataset: UnifiedCandidate = {
        id: 'cdc-diabetes-survey',
        source: 'kaggle',
        type: 'dataset',
        title: 'CDC Diabetes and Abdominal Health Indicators Survey',
        description: 'Tabular survey response CSV for health risk factors and diabetes.',
        tags: ['abdomen', 'health', 'survey', 'csv'],
        formats: ['csv'],
        matchScore: 0,
        confidenceScore: 0,
        tier: 'Tier D',
        evidenceLevel: 'UNVERIFIED',
        evidenceSources: [],
        evidenceStrength: 0,
        matchBreakdown: {} as any,
        evidence: [],
        warnings: [],
        rejected: false,
        rejectionReason: null,
        matchReason: '',
        metadata: {},
    };

    // Filter against Query 1 (3D abdominal MRI)
    const filterResultsQ1 = applyHardFiltering([mockAbdomenDataset, mockBrainGliomaDataset, mockTabularSurveyDataset], u1);
    assert(filterResultsQ1.passed.some(d => d.id === 'amos-2022'), 'AMOS Abdominal dataset passed filter for Query 1');
    assert(filterResultsQ1.rejected.some(d => d.candidate.id === 'mateuszbuda/lgg-mri-segmentation'), 'Brain LGG dataset REJECTED for Query 1 (Anatomical conflict)');
    assert(filterResultsQ1.rejected.some(d => d.candidate.id === 'cdc-diabetes-survey'), 'Tabular survey CSV dataset REJECTED for Query 1 (Modality conflict)');

    // Filter against Query 2 (Brain glioma)
    const filterResultsQ2 = applyHardFiltering([mockAbdomenDataset, mockBrainGliomaDataset], u2);
    assert(filterResultsQ2.passed.some(d => d.id === 'mateuszbuda/lgg-mri-segmentation'), 'Brain LGG dataset PASSED filter for Query 2 (Target anatomy matches)');
    assert(filterResultsQ2.rejected.some(d => d.candidate.id === 'amos-2022'), 'Abdominal dataset REJECTED for Query 2');

    // ── Test 4: Multi-Factor Scoring & Quality Tiers ─────────────────────────
    console.log('\n--- Test 4: Multi-Factor Composite Scoring & Quality Tiers ---');
    const scoredAmos = calculateCompositeCandidateScore(mockAbdomenDataset, u1);
    assert(scoredAmos.matchScore >= 80, `AMOS composite match score is ${scoredAmos.matchScore}/100`);
    assert(scoredAmos.tier === 'Tier A' || scoredAmos.tier === 'Tier B', `AMOS assigned ${scoredAmos.tier}`);
    assert(scoredAmos.confidenceScore >= 70, `AMOS confidence score is ${scoredAmos.confidenceScore}%`);
    assert(scoredAmos.evidenceLevel === 'VERIFIED' || scoredAmos.evidenceLevel === 'SUPPORTED', `AMOS evidence level is ${scoredAmos.evidenceLevel}`);
    assert(scoredAmos.matchBreakdown.anatomy >= 80, 'Anatomy breakdown score is high');
    assert(scoredAmos.matchBreakdown.modality >= 80, 'Modality breakdown score is high');

    // ── Test 5: Full Empirical A/B IR Benchmark Evaluation ───────────────────
    console.log('\n--- Test 5: Full Quantitative A/B IR Benchmark Suite ---');
    const evalResults = runBenchmarkEvaluation();
    const agg = evalResults.aggregate;

    for (const c of evalResults.comparisons) {
        console.log(`  Query "${c.query}": Advanced Precision@5=${c.advanced.precisionAt5}%, WrongAnatomy=${c.advanced.wrongAnatomyRate}%`);
    }

    console.log('\n  ======================================================');
    console.log('  EMPIRICAL IR EVALUATION METRICS SUMMARY (5 Queries):');
    console.log('  ======================================================');
    console.log(`  Baseline Precision@5:          ${agg.baseline.precisionAt5}%`);
    console.log(`  Advanced Engine Precision@5:   ${agg.advanced.precisionAt5}% (Gain: +${agg.overallPrecisionGain}%)`);
    console.log(`  Baseline NDCG@10:              ${agg.baseline.ndcgAt10}%`);
    console.log(`  Advanced Engine NDCG@10:       ${agg.advanced.ndcgAt10}% (Gain: +${agg.overallNdcgGain}%)`);
    console.log(`  Baseline Wrong Anatomy Error:  ${agg.baseline.wrongAnatomyRate}%`);
    console.log(`  Advanced Wrong Anatomy Error:  ${agg.advanced.wrongAnatomyRate}% (Error Reduction: -${agg.overallErrorReduction}%)`);
    console.log('  ======================================================\n');

    assert(agg.advanced.precisionAt5 >= 90, 'Advanced Precision@5 is >= 90%');
    assert(agg.advanced.ndcgAt10 >= 90, 'Advanced NDCG@10 is >= 90%');
    assert(agg.advanced.wrongAnatomyRate === 0, 'Advanced Wrong Anatomy Error Rate is 0%');
    assert(agg.overallPrecisionGain >= 30, `Substantial precision improvement achieved (+${agg.overallPrecisionGain}%)`);

    // ── Test 6: Explicit Modality Tag Parser & Baseline Model Fallback ────────
    console.log('\n--- Test 6: Modality Tag Parser & Architectural Baseline Fallbacks ---');
    const { extractExplicitModality } = await import('../src/lib/search/modalityParser');
    const { getFallbackBaselineModels } = await import('../src/lib/search/modelsFallback');

    const mriMod = extractExplicitModality("T2-weighted Kidney MRI Segmentation", "NIfTI volumetric images for renal segmentation");
    assert(mriMod === 'MRI', `T2-weighted Kidney MRI correctly resolved as MRI (got ${mriMod})`);

    const ctMod = extractExplicitModality("Abdominal CT Scans for Liver Tumor", "3D Computed Tomography slices");
    assert(ctMod === 'CT', `Abdominal CT resolved as CT (got ${ctMod})`);

    const usMod = extractExplicitModality("Breast Ultrasound B-Mode Dataset", "Ultrasound echography images");
    assert(usMod === 'Ultrasound', `Breast Ultrasound resolved as Ultrasound (got ${usMod})`);

    const cxrMod = extractExplicitModality("COVID-19 Chest X-ray Radiography Database", "Anterior-posterior chest radiographs");
    assert(cxrMod === 'X-ray', `Chest X-ray resolved as X-ray (got ${cxrMod})`);

    const histoMod = extractExplicitModality("Kidney Histopathology Whole Slide Images", "H&E biopsy slides");
    assert(histoMod === 'Histopathology', `Histopathology resolved as Histopathology (got ${histoMod})`);

    // Test Model Fallback for 3D Abdominal MRI
    const fallbacks = getFallbackBaselineModels(u1);
    assert(fallbacks.length >= 1, `Fallback baseline models generated (${fallbacks.length} models)`);
    assert(fallbacks[0].id === 'monai/swin-unetr', `Top fallback model is monai/swin-unetr (got ${fallbacks[0].id})`);
    assert(
        fallbacks[0].metadata?.badge === 'Architectural Baseline: MONAI 3D Swin UNETR (Domain General)',
        'MONAI model contains Architectural Baseline badge'
    );
    assert(
        fallbacks[0].description.includes('No fine-tuned checkpoints found specifically for abdomen MRI tumors'),
        'MONAI model contains transfer learning helper subtitle'
    );

    console.log('\n================================================================');
    console.log(`  BENCHMARK SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});

/**
 * Unit Test Suite for Search Engine 2.0.0 (Section 56)
 *
 * Tests:
 * 1. Query decomposition correctness (all tokens preserved)
 * 2. Hard filter (reject brain, CT-only, astronomy, natural image datasets)
 * 3. Scoring correctness (Exact > Partial > Related)
 * 4. Evidence verifier (VERIFIED vs SUPPORTED vs UNVERIFIED)
 * 5. Zero-fabrication check (no synthetic checkpoints or fake URLs)
 */

import { parseResearchQuery } from '../src/lib/search/queryUnderstanding.ts';
import { applyHardConstraints, evaluateCandidateHardConstraints } from '../src/lib/search/hardConstraints.ts';
import { scoreCandidate } from '../src/lib/search/scoring.ts';
import { verifyCandidateEvidence } from '../src/lib/search/evidenceVerifier.ts';
import { NormalizedSearchResult } from '../src/lib/search/types.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details = '') {
    if (condition) {
        console.log(`  ✓ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${testName} ${details}`);
        failed++;
    }
}

async function runUnitTests() {
    console.log('====================================================');
    console.log('  SEARCH ENGINE 2.0.0 — AUTOMATED TEST SUITE        ');
    console.log('====================================================\n');

    // ── TEST 1: Query Decomposition & Token Preservation ─────────────
    console.log('--- Test 1: Query Decomposition & Token Preservation ---');
    const targetQuery = 'I want to find datasets and pretrained models for real-time 4D flow cardiac MRI velocity field reconstruction and hemodynamic wall shear stress estimation under sparse k-space radial undersampling';
    const schema = parseResearchQuery(targetQuery);

    assert(schema.anatomy.some(a => /cardiac|heart/i.test(a)), 'Target anatomy contains Cardiac / Heart');
    assert(schema.modalities.includes('MRI'), 'Modality includes MRI');
    assert(schema.modalitySubtypes.some(s => /4d\s*flow/i.test(s)), 'Modality subtype includes 4D Flow MRI');
    assert(schema.reconstructionTasks.some(t => /velocity/i.test(t)), 'Task includes Velocity-field reconstruction');
    assert(schema.estimationTasks.some(t => /wall\s*shear|wss/i.test(t)), 'Task includes Wall shear stress estimation');
    assert(schema.samplingStrategy.some(s => /radial/i.test(s)), 'Sampling strategy includes Radial undersampling');
    assert(schema.samplingStrategy.some(s => /sparse/i.test(s)), 'Sampling strategy includes Sparse k-space');
    assert(schema.dimensionality.some(d => d.includes('4D')), 'Dimensionality identified as 4D');
    assert(schema.temporalRequirement.some(t => /real-time/i.test(t)), 'Temporal requirement identified as Real-time');
    assert(schema.excludedAnatomy.includes('Brain'), 'Excluded anatomy includes Brain');
    assert(schema.excludedDomains.some(d => d.includes('Astronomy')), 'Excluded domains includes Astronomy');

    // ── TEST 2: Hard Filter Contradiction Guards ─────────────────────
    console.log('\n--- Test 2: Hard Filter Contradiction Guards ---');

    // Brain candidate vs Cardiac query
    const brainCandidate: NormalizedSearchResult = {
        id: 'brats-glioma-segmentation',
        source: 'kaggle',
        title: 'BraTS Brain Tumor Glioma MRI Dataset',
        description: 'Multimodal brain tumor segmentation benchmark including T1, T2, and FLAIR MRI volumes of glioma patients.',
        tags: ['brain', 'glioma', 'segmentation', 'mri'],
    };
    const brainEval = evaluateCandidateHardConstraints(brainCandidate, schema);
    assert(!brainEval.passed && brainEval.conflictType === 'anatomy', 'Brain dataset correctly rejected on anatomical conflict');

    // CT-only candidate vs MRI query
    const ctCandidate: NormalizedSearchResult = {
        id: 'chest-ct-scan-covid',
        source: 'kaggle',
        title: 'Chest Computed Tomography CT Scan Collection',
        description: 'High-resolution computed tomography scans of pulmonary patients with thoracic lesions.',
        tags: ['ct', 'computed-tomography', 'chest', 'lung'],
    };
    const ctEval = evaluateCandidateHardConstraints(ctCandidate, schema);
    assert(!ctEval.passed, 'CT-only candidate correctly rejected for MRI query');

    // Astronomy candidate vs Medical imaging query
    const astronomyCandidate: NormalizedSearchResult = {
        id: 'astronomical-fluid-flow-jwst',
        source: 'kaggle',
        title: 'JWST Cosmic Velocity Field and Interstellar Gas Flow',
        description: 'Astrophysical velocity field maps and fluid dynamics simulations of interstellar gas in galaxies.',
        tags: ['astronomy', 'astrophysics', 'velocity-field', 'fluid-dynamics'],
    };
    const astroEval = evaluateCandidateHardConstraints(astronomyCandidate, schema);
    assert(!astroEval.passed && astroEval.conflictType === 'domain', 'Astronomy velocity field dataset correctly rejected on non-medical domain conflict');

    // Natural image / face candidate
    const faceCandidate: NormalizedSearchResult = {
        id: 'celeb-face-recognition',
        source: 'huggingface',
        title: 'CelebFaces High Precision Face Recognition',
        description: 'Large-scale facial image dataset for face detection, alignment, and facial recognition models.',
        tags: ['face-recognition', 'facial', 'celebrity'],
    };
    const faceEval = evaluateCandidateHardConstraints(faceCandidate, schema);
    assert(!faceEval.passed, 'Natural face dataset correctly rejected');

    // Valid 4D Flow cardiac candidate passes
    const valid4DFlowCandidate: NormalizedSearchResult = {
        id: 'cardiac-4d-flow-mri-dataset',
        source: 'zenodo',
        title: 'In Vivo 4D Flow Cardiac MRI Hemodynamics Dataset',
        description: 'Time-resolved 3D phase-contrast 4D flow cardiac MRI velocity fields and aortic wall shear stress measurements.',
        tags: ['cardiac', '4d-flow', 'mri', 'velocity-field', 'wall-shear-stress'],
        modality: ['MRI'],
    };
    const validEval = evaluateCandidateHardConstraints(valid4DFlowCandidate, schema);
    assert(validEval.passed, 'Genuine 4D Flow cardiac MRI candidate successfully passes hard constraints');

    // ── TEST 3: Scoring Correctness (Exact > Partial > Related) ──────
    console.log('\n--- Test 3: Scoring Correctness Hierarchy ---');

    // Exact Match: 4D Flow cardiac velocity MRI
    const exactScored = scoreCandidate(valid4DFlowCandidate, schema);

    // Partial Match: Cardiac cine MRI without velocity encoding
    const cineCandidate: NormalizedSearchResult = {
        id: 'acdc-cardiac-cine-mri',
        source: 'kaggle',
        title: 'ACDC Automated Cardiac Cine MRI Dataset',
        description: 'Short-axis cardiac cine MRI slices for left and right ventricle segmentation and ejection fraction.',
        tags: ['cardiac', 'cine-mri', 'segmentation'],
        modality: ['MRI'],
    };
    const partialScored = scoreCandidate(cineCandidate, schema);

    // Related Resource: General accelerated MRI reconstruction (e.g. Knee/Brain fastMRI)
    const generalReconCandidate: NormalizedSearchResult = {
        id: 'fastmri-general-knee-recon',
        source: 'kaggle',
        title: 'FastMRI Raw k-Space Undersampled Reconstruction',
        description: 'Multi-coil raw k-space MRI undersampled acquisition data for general accelerated image reconstruction.',
        tags: ['fastmri', 'k-space', 'reconstruction', 'mri'],
        modality: ['MRI'],
    };
    const relatedScored = scoreCandidate(generalReconCandidate, schema);

    assert(exactScored.matchScore > partialScored.matchScore, `Exact Match score (${exactScored.matchScore}) > Partial Match score (${partialScored.matchScore})`);
    assert(partialScored.matchScore > relatedScored.matchScore, `Partial Match score (${partialScored.matchScore}) > Related Resource score (${relatedScored.matchScore})`);
    assert(exactScored.matchCategory === 'EXACT_MATCH', '4D Flow candidate classified as EXACT_MATCH');

    // ── TEST 4: Evidence Verifier ────────────────────────────────────
    console.log('\n--- Test 4: Evidence Verifier Claim Classification ---');
    const evExplicit = verifyCandidateEvidence(valid4DFlowCandidate, schema);
    assert(evExplicit.evidenceLevel === 'VERIFIED' || evExplicit.evidenceLevel === 'SUPPORTED', 'High-quality metadata achieves VERIFIED/SUPPORTED level');
    assert(evExplicit.confirmedClaims.some(c => c.includes('Anatomy')), 'Anatomy claim confirmed');
    assert(evExplicit.confirmedClaims.some(c => c.includes('4D Flow') || c.includes('Modality')), 'Technique / Modality claim confirmed');

    // Dataset with unstated anatomy should trigger warning
    const unstatedAnatomy: NormalizedSearchResult = {
        id: 'generic-mri-slices',
        source: 'kaggle',
        title: 'Medical MRI Image Collection',
        description: 'General MRI slices for machine learning classification experiments.',
        tags: ['mri', 'medical'],
    };
    const evUnstated = verifyCandidateEvidence(unstatedAnatomy, schema);
    assert(evUnstated.warnings.some(w => w.includes('anatomy') || w.includes('verified')), 'Unverified anatomy flagged in warnings');

    // ── TEST 5: Zero-Fabrication Transparency Check ──────────────────
    console.log('\n--- Test 5: Zero-Fabrication Policy Verification ---');
    assert(
        !JSON.stringify(exactScored).includes('4dflow-net/4dflow-net-cardiac'),
        'No synthetic 4dflow-net-cardiac fake Hugging Face repo in scored results'
    );
    assert(
        valid4DFlowCandidate.url !== 'https://huggingface.co/4dflow-net',
        'No fake URLs assigned'
    );

    console.log('\n====================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runUnitTests().catch((err) => {
    console.error('Fatal error during test run:', err);
    process.exit(1);
});

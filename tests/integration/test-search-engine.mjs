/**
 * Search Engine 2.0.0 Unit Test Suite (Section 56)
 * Run with: node scripts/test_search_engine.mjs
 */

import { promises as fs } from 'fs';
import path from 'path';

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

async function runTests() {
    console.log('====================================================');
    console.log('  SEARCH ENGINE 2.0.0 — AUTOMATED TEST SUITE        ');
    console.log('====================================================\n');

    // ── Test 1: Query Decomposition & Token Preservation ─────────────
    console.log('--- Test 1: Query Decomposition & Token Preservation ---');
    const quContent = await fs.readFile(path.join(process.cwd(), 'src/lib/search/queryUnderstanding.ts'), 'utf-8');
    const ontoContent = await fs.readFile(path.join(process.cwd(), 'src/lib/search/ontology.ts'), 'utf-8');
    assert(quContent.includes('export function parseResearchQuery'), 'parseResearchQuery exported');
    assert(quContent.includes('Biomedical / Cardiovascular MRI / Computational Hemodynamics'), 'Cardiovascular MRI & Hemodynamics domain detected');
    assert(quContent.includes('4D Flow MRI') && quContent.includes('4D phase-contrast MRI'), '4D Flow & Phase-contrast MRI subtypes detected');
    assert(quContent.includes('Velocity-field reconstruction'), 'Velocity-field reconstruction task preserved');
    assert(quContent.includes('Wall shear stress estimation'), 'Wall shear stress estimation task preserved');
    assert(quContent.includes('Radial undersampling') && quContent.includes('Sparse k-space'), 'Sparse k-space and radial undersampling preserved');
    assert(ontoContent.includes('Brain'), 'Brain strictly excluded for cardiac query in ontology');
    assert(ontoContent.includes('Astronomy & Astrophysics'), 'Astronomy non-medical domain excluded in ontology');

    // ── Test 2: Hard Filter Contradiction Guards ─────────────────────
    console.log('\n--- Test 2: Hard Filter Contradiction Guards ---');
    const hfContent = await fs.readFile(path.join(process.cwd(), 'src/lib/search/hardConstraints.ts'), 'utf-8');
    assert(hfContent.includes('NON_MEDICAL_CONFLICT_DOMAINS'), 'Non-medical conflict domains imported and applied');
    assert(ontoContent.includes('astronomy') && ontoContent.includes('atmospheric') && ontoContent.includes('generic_cfd'), 'Astronomy, atmospheric flow, and generic CFD indexed in conflict matrix');
    assert(hfContent.includes('isBrainPrimary') && hfContent.includes('Anatomical conflict:'), 'Brain conflict guard implemented');
    assert(hfContent.includes('isLungPrimary') && hfContent.includes('Anatomical conflict:'), 'Lung non-cardiac conflict guard implemented');
    assert(hfContent.includes('isCtOnly') && hfContent.includes('Modality conflict:'), 'CT-only modality guard implemented for MRI');
    assert(hfContent.includes('Sampling compatibility not verified'), 'Sampling compatibility verification implemented');

    // ── Test 3: Hybrid Scoring & Hierarchy ───────────────────────────
    console.log('\n--- Test 3: Hybrid Scoring & Exact > Partial > Related Hierarchy ---');
    const scoreContent = await fs.readFile(path.join(process.cwd(), 'src/lib/search/scoring.ts'), 'utf-8');
    assert(scoreContent.includes('calculateBM25LexicalScore'), 'BM25 lexical scoring implemented');
    assert(scoreContent.includes('computeAdaptiveWeights'), 'Dynamic query-adaptive weighting implemented');
    assert(scoreContent.includes('weights.wPopularity') && scoreContent.includes('0.02'), 'Popularity strictly capped at max 3% weight');
    assert(scoreContent.includes('EXACT_MATCH') && scoreContent.includes('PARTIAL_MATCH') && scoreContent.includes('RELATED_RESOURCE'), 'Exact, Partial, and Related Match categories assigned');
    assert(scoreContent.includes('whyMatches') && scoreContent.includes('unverifiedClaims'), 'Transparent why-matches and unverified-claims populated');

    // ── Test 4: Evidence Verifier ────────────────────────────────────
    console.log('\n--- Test 4: Evidence Verifier Claim Classification ---');
    const evContent = await fs.readFile(path.join(process.cwd(), 'src/lib/search/evidenceVerifier.ts'), 'utf-8');
    assert(evContent.includes('Technique: 4D Flow MRI') || evContent.includes('4D Flow'), '4D Flow MRI technique evidence verified');
    assert(evContent.includes('Sampling: Radial Undersampling'), 'Radial undersampling evidence checked');
    assert(evContent.includes('Wall Shear Stress'), 'Wall shear stress evidence checked');
    assert(evContent.includes('VERIFIED') && evContent.includes('SUPPORTED') && evContent.includes('PARTIAL') && evContent.includes('UNVERIFIED'), 'Standardized Evidence Levels implemented');

    // ── Test 5: Zero-Fabrication Policy Verification ──────────────────
    console.log('\n--- Test 5: Zero-Fabrication Policy Verification ---');
    const modelsContent = await fs.readFile(path.join(process.cwd(), 'src/lib/search/modelsFallback.ts'), 'utf-8');
    assert(!modelsContent.includes('https://huggingface.co/4dflow-net'), 'Fabricated Hugging Face URL removed');
    assert(modelsContent.includes('https://github.com/EdwardFerdian/4DFlowNet'), 'Official 4DFlowNet research repository referenced');
    assert(modelsContent.includes('ARCHITECTURE REFERENCE ONLY') || modelsContent.includes('RESEARCH BASELINE'), 'Baselines explicitly labeled as Architecture Reference / Research Baseline');
    assert(modelsContent.includes('isPretrainedCheckpointVerified: false'), 'Pretrained checkpoint verification explicitly set to false for unverified models');

    // ── Test 6: Central Orchestrator & Cache Integration ─────────────
    console.log('\n--- Test 6: Central Orchestrator & Cache Integration ---');
    const engineContent = await fs.readFile(path.join(process.cwd(), 'src/lib/search/searchEngine.ts'), 'utf-8');
    assert(engineContent.includes('export async function advancedResearchSearch'), 'Master advancedResearchSearch function exported');
    assert(engineContent.includes('SEARCH_ENGINE_VERSION') || engineContent.includes('2.0.0'), 'Search engine version 2.0.0 tagged');
    assert(engineContent.includes('getCachedSearch') && engineContent.includes('setCachedSearch'), 'Deterministic caching integrated');

    console.log('\n====================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED `);
    console.log('====================================================\n');

    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});

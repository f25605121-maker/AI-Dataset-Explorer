import { understandQuery } from '../lib/search/queryUnderstanding';
import { expandQueries } from '../lib/search/queryExpansion';
import { parseQuery, detectMedicalTaskType } from '../lib/queryParser';
import { extractCoreSearchKeywords } from '../lib/assistant/keywordExtractor';
import { getFallbackBaselineModels } from '../lib/search/modelsFallback';

async function runTelemetryBugVerification() {
    console.log('\n======================================================');
    console.log('🔬 Telemetry Bug Verification: 4D Flow Cardiac MRI Query');
    console.log('======================================================\n');

    const query = "I want to find datasets and pretrained models for real-time 4D flow cardiac MRI velocity field reconstruction and hemodynamic wall shear stress estimation under sparse k-space radial undersampling";
    let passed = true;

    // 1. Task detection via detectMedicalTaskType
    const detectedMedTask = detectMedicalTaskType(query);
    console.log(`1. detectMedicalTaskType: "${detectedMedTask}"`);
    if (detectedMedTask !== 'reconstruction' && detectedMedTask !== 'velocity_estimation') {
        console.error(`❌ FAILED: Expected reconstruction or velocity_estimation, got "${detectedMedTask}"`);
        passed = false;
    } else {
        console.log(`✅ PASSED: Detected non-segmentation medical task: ${detectedMedTask}`);
    }

    // 2. Query Understanding pipeline
    const understanding = understandQuery(query);
    console.log(`\n2. Query Understanding:`);
    console.log(`   - Task: "${understanding.task}"`);
    console.log(`   - Primary Anatomy: [${understanding.anatomy.primary.join(', ')}]`);
    console.log(`   - Modality: [${understanding.modality.join(', ')}]`);
    console.log(`   - Sequence: [${understanding.sequence.join(', ')}]`);
    console.log(`   - Target: [${understanding.target.join(', ')}]`);

    if (understanding.task === 'discovery' || understanding.task === 'segmentation') {
        console.error(`❌ FAILED: Primary task extracted as "${understanding.task}" (expected reconstruction or velocity_estimation)`);
        passed = false;
    } else {
        console.log(`✅ PASSED: Primary task is "${understanding.task}" (not discovery or segmentation)`);
    }

    if (understanding.anatomy.primary[0] !== 'cardiac') {
        console.error(`❌ FAILED: Primary anatomy defaulted to "${understanding.anatomy.primary[0]}" instead of "cardiac"`);
        passed = false;
    } else {
        console.log(`✅ PASSED: Primary anatomy correctly prioritized as "${understanding.anatomy.primary[0]}"`);
    }

    // 3. Query Expansion anti-dilution check
    const expansions = expandQueries(understanding);
    console.log(`\n3. Query Expansion:`);
    console.log(`   - Dataset Queries:`, expansions.datasetQueries);
    console.log(`   - Model Queries:`, expansions.modelQueries);
    console.log(`   - Paper Queries:`, expansions.paperQueries);

    const hasChestSegDataset = expansions.datasetQueries.some(q => /chest.*segmentation/i.test(q));
    const hasSwinUnetrChest = expansions.modelQueries.some(q => /swin\s*unetr\s*chest/i.test(q));

    if (hasChestSegDataset) {
        console.error(`❌ FAILED: datasetQueries generated "chest MRI segmentation dataset"`);
        passed = false;
    } else {
        console.log(`✅ PASSED: No false "chest MRI segmentation dataset" generated`);
    }

    if (hasSwinUnetrChest) {
        console.error(`❌ FAILED: modelQueries generated "swin unetr chest"`);
        passed = false;
    } else {
        console.log(`✅ PASSED: No "swin unetr chest" generated for reconstruction task`);
    }

    // Check critical tokens preservation
    const allExpQueries = expansions.allQueries.join(' ').toLowerCase();
    const criticalTokens = ['4d flow', 'cardiac', 'velocity', 'reconstruction', 'wall shear stress', 'k-space'];
    const missingTokens = criticalTokens.filter(tok => !allExpQueries.includes(tok));
    if (missingTokens.length > 0) {
        console.error(`❌ FAILED: Critical tokens missing from query expansions:`, missingTokens);
        passed = false;
    } else {
        console.log(`✅ PASSED: All critical tokens preserved across expansions:`, criticalTokens);
    }

    // 4. Full parseQuery API output
    const parsedOutput = await parseQuery(query);
    console.log(`\n4. parseQuery API output:`);
    console.log(`   - constraints.task: "${parsedOutput.constraints.task}"`);
    console.log(`   - constraints.anatomy:`, parsedOutput.constraints.anatomy);

    if (parsedOutput.constraints.task === 'discovery' || parsedOutput.constraints.task === 'Dataset Discovery' || parsedOutput.constraints.task === 'segmentation') {
        console.error(`❌ FAILED: constraints.task defaulted to "${parsedOutput.constraints.task}"`);
        passed = false;
    } else {
        console.log(`✅ PASSED: constraints.task correctly populated as "${parsedOutput.constraints.task}"`);
    }

    // 5. Keyword Extractor check
    const coreKeywords = extractCoreSearchKeywords(query);
    console.log(`\n5. extractCoreSearchKeywords:`);
    console.log(`   - primaryQuery: "${coreKeywords.primaryQuery}"`);
    console.log(`   - secondaryQuery: "${coreKeywords.secondaryQuery}"`);
    console.log(`   - tertiaryQuery: "${coreKeywords.tertiaryQuery}"`);

    const hasPhysicsInCore = coreKeywords.allQueries.some(q => /4d\s*flow|velocity|shear\s*stress|k-space/i.test(q));
    if (!hasPhysicsInCore) {
        console.error(`❌ FAILED: core keywords stripped all physics tokens:`, coreKeywords.allQueries);
        passed = false;
    } else {
        console.log(`✅ PASSED: core keywords preserved physics tokens`);
    }

    // 6. Fallback Models check
    const fallbacks = getFallbackBaselineModels(understanding);
    console.log(`\n6. Fallback Baseline Models:`, fallbacks.map(f => `${f.id} (${f.architecture})`));
    const hasSwinFallback = fallbacks.some(f => /swin-unetr/i.test(f.id));
    const hasPhysicsFallback = fallbacks.some(f => /fastmri|4dflow/i.test(f.id));

    if (hasSwinFallback) {
        console.error(`❌ FAILED: Fallback models recommended swin-unetr for reconstruction task!`);
        passed = false;
    } else if (!hasPhysicsFallback) {
        console.error(`❌ FAILED: Fallback models did not recommend physics/reconstruction baseline!`);
        passed = false;
    } else {
        console.log(`✅ PASSED: Fallback models recommended appropriate reconstruction baselines (FastMRI / 4DFlowNet)`);
    }

    console.log('\n======================================================');
    if (passed) {
        console.log('🎉 ALL TELEMETRY VERIFICATION CHECKS PASSED!');
    } else {
        console.error('💥 SOME CHECKS FAILED!');
        process.exit(1);
    }
    console.log('======================================================\n');
}

runTelemetryBugVerification().catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
});

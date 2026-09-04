import { classifyIntent } from '../lib/assistant/classifyIntent';
import { extractCoreSearchKeywords, isTechnicalOrDataQuery } from '../lib/assistant/keywordExtractor';
import { parseQuery } from '@/server/query-understanding/queryParser';
import { expandQueries } from '@/server/query-understanding/queryExpander';
import { runDatasetPipeline } from '../lib/assistant/datasetPipeline';

async function runAllTests() {
    console.log('====================================================');
    console.log('RUNNING INTENT CLASSIFIER & KEYWORD EXTRACTION TESTS');
    console.log('====================================================\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Sub-string Keyword Extraction on Long Technical Query
    // ─────────────────────────────────────────────────────────────
    console.log('=== TEST 1: Sub-string Keyword Extraction for Upstream APIs ===');
    const longQuery = 'Multimodal real-time seizure detection and onset zone localization using continuous 64-channel intracranial EEG and synchronized infrared video streams';
    const extracted = extractCoreSearchKeywords(longQuery);

    console.log('Input Query:', longQuery);
    console.log('Primary Query:', extracted.primaryQuery);
    console.log('Secondary Query:', extracted.secondaryQuery);
    console.log('Tertiary Query:', extracted.tertiaryQuery);
    console.log('Extracted Core Keywords:', extracted.keywords);
    console.log('Is Technical/Data Query:', extracted.isTechnicalOrData);

    if (!extracted.isTechnicalOrData) {
        throw new Error('Expected isTechnicalOrData to be true for seizure EEG query');
    }

    if (!extracted.primaryQuery.toLowerCase().includes('seizure') || !extracted.primaryQuery.toLowerCase().includes('eeg')) {
        throw new Error(`Expected primary query to contain 'seizure' and 'eeg', got: "${extracted.primaryQuery}"`);
    }

    if (extracted.primaryQuery.split(/\s+/).length > 6) {
        throw new Error(`Primary query is too long for search APIs (> 6 words): "${extracted.primaryQuery}"`);
    }

    console.log('✓ TEST 1 PASSED: Core sub-string keywords extracted cleanly.\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Intent Classification for Technical Problem Statements
    // ─────────────────────────────────────────────────────────────
    console.log('=== TEST 2: Broadened Dataset Search Intent for Technical Problem Statements ===');

    const testQueries = [
        {
            query: 'Multimodal real-time seizure detection and onset zone localization using continuous 64-channel intracranial EEG and synchronized infrared video streams',
            expectedDatasetRequired: true,
            label: 'Complex 20-word multimodal seizure EEG query',
        },
        {
            query: 'Real-time seizure detection with EEG',
            expectedDatasetRequired: true,
            label: 'Implicit dataset search for seizure EEG',
        },
        {
            query: 'CCTV anomaly detection and pedestrian tracking',
            expectedDatasetRequired: true,
            label: 'Sensor/modality CCTV query',
        },
        {
            query: 'Coronary artery CTA segmentation',
            expectedDatasetRequired: true,
            label: 'Clinical imaging CTA query',
        },
    ];

    for (const t of testQueries) {
        const result = await classifyIntent(t.query);
        console.log(`[${t.label}]`);
        console.log(`  Query: "${t.query}"`);
        console.log(`  Intent: ${result.intent}`);
        console.log(`  Dataset Required: ${result.datasetRequired}`);
        console.log(`  Search Query: "${result.searchQuery}"`);
        console.log(`  Reason: "${result.reason}"`);

        if (!result.datasetRequired) {
            throw new Error(`Failed for "${t.query}": Expected datasetRequired=true, got false (Intent: ${result.intent})`);
        }
        if (result.intent === 'GENERAL_AI' || result.intent === 'EXPLAIN_CONCEPT') {
            throw new Error(`Failed for "${t.query}": Erroneously classified as general concept: ${result.intent}`);
        }
        if (result.searchQuery.split(/\s+/).length > 6) {
            throw new Error(`Search query too long for API retrieval: "${result.searchQuery}"`);
        }
    }

    console.log('✓ TEST 2 PASSED: All technical problem statements correctly routed to search pipeline.\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Refined Concept / Conversational Heuristics
    // ─────────────────────────────────────────────────────────────
    console.log('=== TEST 3: Pure Conversational / Concept Heuristics ===');

    const conceptQueries = [
        {
            query: 'hi',
            expectedIntent: 'GREETING',
            expectedDatasetRequired: false,
        },
        {
            query: 'how does backpropagation work',
            expectedDatasetRequired: false,
        },
        {
            query: 'explain Adam optimizer vs SGD',
            expectedDatasetRequired: false,
        },
    ];

    for (const c of conceptQueries) {
        const result = await classifyIntent(c.query);
        console.log(`[Concept Query: "${c.query}"]`);
        console.log(`  Intent: ${result.intent}`);
        console.log(`  Dataset Required: ${result.datasetRequired}`);
        console.log(`  General Answer Required: ${result.generalAnswerRequired}`);

        if (c.expectedIntent && result.intent !== c.expectedIntent) {
            throw new Error(`Expected intent ${c.expectedIntent}, got ${result.intent}`);
        }
        if (result.datasetRequired !== c.expectedDatasetRequired) {
            throw new Error(`Expected datasetRequired=${c.expectedDatasetRequired} for "${c.query}", got ${result.datasetRequired}`);
        }
    }

    console.log('✓ TEST 3 PASSED: Conversational & concept queries preserved.\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Query Understanding & Expander for Multimodal Seizure Query
    // ─────────────────────────────────────────────────────────────
    console.log('=== TEST 4: Query Understanding & Expander for Multimodal Seizure Query ===');
    const qu = parseQuery(longQuery, 'DATASET_SEARCH');
    console.log('Parsed QueryUnderstanding:');
    console.log('  Domain:', qu.domain.value, `(${qu.domain.state})`);
    console.log('  Subdomain:', qu.subdomain.value, `(${qu.subdomain.state})`);
    console.log('  Task:', qu.task.value, `(${qu.task.state})`);
    console.log('  Target:', qu.target.value, `(${qu.target.state})`);
    console.log('  Modality:', qu.modality.value, `(${qu.modality.state})`);
    console.log('  Search Queries:', qu.searchQueries);

    const expanded = expandQueries(qu);
    console.log('Expanded Queries:');
    console.log('  HF Dataset Queries:', expanded.hfDatasetQueries);
    console.log('  Kaggle Dataset Queries:', expanded.kaggleDatasetQueries);
    console.log('  HF Model Queries:', expanded.hfModelQueries);

    if (!qu.searchQueries.some((q) => q.toLowerCase().includes('seizure') || q.toLowerCase().includes('eeg'))) {
        throw new Error('Expected search queries to contain seizure or EEG');
    }

    // Verify all search queries are concise (<= 6 words)
    for (const q of expanded.allQueries) {
        if (q.split(/\s+/).length > 6) {
            throw new Error(`Expanded query exceeds 6 words: "${q}"`);
        }
    }

    console.log('✓ TEST 4 PASSED: Query parser and expander produced structured concise queries.\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Full Dataset Pipeline Execution
    // ─────────────────────────────────────────────────────────────
    console.log('=== TEST 5: Full Dataset Pipeline Execution for Complex Seizure Query ===');
    const pipelineResult = await runDatasetPipeline(
        extracted.primaryQuery,
        'test-seizure-id-001',
        {
            intent: 'DATASET_SEARCH',
            confidence: 0.95,
            datasetRequired: true,
            generalAnswerRequired: false,
            searchQuery: extracted.primaryQuery,
            reason: 'Test pipeline run',
        }
    );

    console.log('Pipeline Output:');
    console.log('  Analysis Title:', pipelineResult.analysis?.title);
    console.log('  Domain:', pipelineResult.summary?.domain);
    console.log('  Task:', pipelineResult.summary?.task);
    console.log('  DataType / Modality:', pipelineResult.summary?.dataType);
    console.log('  Datasets Discovered:', pipelineResult.summary?.datasetsFound);
    console.log('  Models Discovered:', pipelineResult.summary?.modelsFound);
    console.log('  Research Papers Discovered:', pipelineResult.summary?.papersFound);
    console.log('  Research Maturity:', pipelineResult.researchLandscape?.researchMaturity);

    if (pipelineResult.summary?.domain === 'General / AI Concepts') {
        throw new Error('Pipeline returned General / AI Concepts domain incorrectly!');
    }

    console.log('✓ TEST 5 PASSED: Pipeline executed successfully with non-general domain.\n');

    console.log('====================================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
}

runAllTests().catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
});

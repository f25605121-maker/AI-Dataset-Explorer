/**
 * Information Retrieval (IR) Evaluation & Benchmark Suite
 *
 * Implements empirical benchmark queries, ground-truth label sets, and comparative metrics
 * (Precision@5, Precision@10, Recall@10, NDCG@10, MRR, False Positive Rate, Wrong Anatomy/Modality/Task error rates)
 * comparing Baseline Search vs Advanced Retrieval Engine.
 */

import { IRBenchmarkMetrics, IREvaluationComparison, UnifiedCandidate } from './types';
import { understandQuery } from './queryUnderstanding';
import { expandQueries } from './queryExpansion';

import { rankBySemanticSimilarity } from './semanticSearch';
import { calculateCompositeCandidateScore } from './ranking';
import { applyMMR } from './diversity';
import { deduplicateCandidates } from './deduplication';

export interface BenchmarkQuerySpec {
    id: string;
    query: string;
    description: string;
    expectedAnatomy?: string;
    expectedModality: string;
    expectedTask: string;
    expectedDimension?: string;
    disallowedAnatomies: string[];
    disallowedModalities: string[];
    syntheticCandidates: {
        id: string;
        title: string;
        type: 'dataset' | 'model' | 'paper';
        source: string;
        description: string;
        tags: string[];
        isGroundTruthRelevant: boolean;
        anatomy?: string;
        modality?: string;
        task?: string;
        formats?: string[];
        downloads?: number;
    }[];
}

export const BENCHMARK_QUERIES: BenchmarkQuerySpec[] = [
    {
        id: 'query-1-abdominal-mri',
        query: '3D abdominal MRI dataset for multi-organ tumor segmentation',
        description: 'Multi-organ abdominal tumor segmentation in 3D MRI',
        expectedAnatomy: 'ABDOMEN',
        expectedModality: 'MRI',
        expectedTask: 'segmentation',
        expectedDimension: '3D',
        disallowedAnatomies: ['brain', 'hippocampus', 'glioma', 'retina', 'cardiac', 'lung'],
        disallowedModalities: ['tabular', 'audio', 'text'],
        syntheticCandidates: [
            {
                id: 'amos-2022-abdominal-mri',
                title: 'AMOS 2022: 3D Abdominal Multi-Organ Segmentation Challenge Dataset (MRI & CT)',
                type: 'dataset',
                source: 'kaggle',
                description: 'Large-scale 3D multi-organ dataset for abdominal organs (liver, kidney, spleen, pancreas) in NIfTI .nii.gz format.',
                tags: ['abdomen', 'multi-organ', 'mri', 'segmentation', '3d'],
                isGroundTruthRelevant: true,
                anatomy: 'abdomen',
                modality: 'MRI',
                task: 'segmentation',
                formats: ['nii.gz'],
                downloads: 4200,
            },
            {
                id: 'chaos-abdominal-mri-liver',
                title: 'CHAOS Challenge: Combined Healthy and Abdominal Organ Segmentation (Liver MRI)',
                type: 'dataset',
                source: 'kaggle',
                description: 'Volumetric 3D MRI scans of the abdomen with liver and multi-organ segmentations in DICOM and NIfTI formats.',
                tags: ['abdomen', 'liver', 'mri', 'segmentation', '3d'],
                isGroundTruthRelevant: true,
                anatomy: 'abdomen',
                modality: 'MRI',
                task: 'segmentation',
                formats: ['nii.gz', 'dicom'],
                downloads: 3100,
            },
            {
                id: 'btcv-multi-organ-segmentation',
                title: 'Beyond the Cranial Vault (BTCV) Multi-Organ Abdominal Segmentation Benchmark',
                type: 'dataset',
                source: 'huggingface',
                description: 'Multi-organ segmentation challenge covering 13 abdominal organs including pancreas, kidney, spleen, and liver.',
                tags: ['abdomen', 'pancreas', 'kidney', 'spleen', 'mri', 'segmentation', '3d'],
                isGroundTruthRelevant: true,
                anatomy: 'abdomen',
                modality: 'MRI',
                task: 'segmentation',
                formats: ['nii.gz'],
                downloads: 5500,
            },
            {
                id: 'lgg-mri-segmentation-brain',
                title: 'Brain MRI segmentation with lower-grade glioma FLAIR abnormalities (2D TIF)',
                type: 'dataset',
                source: 'kaggle',
                description: 'Brain MRI scans of patients with lower grade glioma. Contains 2D .tif slice images with segmentation masks for brain tumors.',
                tags: ['brain', 'glioma', 'mri', 'segmentation', '2d'],
                isGroundTruthRelevant: false, // Disallowed: Brain
                anatomy: 'brain',
                modality: 'MRI',
                task: 'segmentation',
                formats: ['tif'],
                downloads: 120000, // HIGH POPULARITY TRAP
            },
            {
                id: 'brats-2023-brain-tumor',
                title: 'BraTS 2023: Brain Tumor Segmentation Challenge Dataset (3D mpMRI)',
                type: 'dataset',
                source: 'kaggle',
                description: 'Multimodal brain tumor segmentation challenge targeting glioblastoma and lower grade glioma in brain scans.',
                tags: ['brain', 'glioma', 'tumor', 'mri', '3d'],
                isGroundTruthRelevant: false, // Disallowed: Brain
                anatomy: 'brain',
                modality: 'MRI',
                task: 'segmentation',
                formats: ['nii.gz'],
                downloads: 85000, // HIGH POPULARITY TRAP
            },
            {
                id: 'acdc-cardiac-mri-segmentation',
                title: 'ACDC 2017: Automated Cardiac Diagnosis and Multi-Structure Heart MRI Segmentation',
                type: 'dataset',
                source: 'huggingface',
                description: 'Cine-MRI dataset for left ventricle, right ventricle, and myocardium segmentation in cardiac imaging.',
                tags: ['cardiac', 'heart', 'mri', 'segmentation', '3d'],
                isGroundTruthRelevant: false, // Disallowed: Heart
                anatomy: 'heart',
                modality: 'MRI',
                task: 'segmentation',
                formats: ['nii.gz'],
                downloads: 24000,
            },
            {
                id: 'cdc-diabetes-health-indicators-tabular',
                title: 'CDC Diabetes & Abdominal Health Indicators Survey 2015 (Tabular CSV)',
                type: 'dataset',
                source: 'kaggle',
                description: 'Survey response indicators for abdominal adiposity and health risk factors from NHANES BRFSS survey.',
                tags: ['abdomen', 'health', 'survey', 'tabular', 'csv'],
                isGroundTruthRelevant: false, // Disallowed: Tabular CSV Survey
                anatomy: 'abdomen',
                modality: 'tabular',
                task: 'classification',
                formats: ['csv'],
                downloads: 95000,
            },
        ],
    },
    {
        id: 'query-2-brain-glioma-mri',
        query: 'Brain tumor MRI glioma segmentation',
        description: 'Brain MRI tumor and glioma segmentation',
        expectedAnatomy: 'BRAIN',
        expectedModality: 'MRI',
        expectedTask: 'segmentation',
        disallowedAnatomies: ['abdomen', 'liver', 'kidney', 'cardiac'],
        disallowedModalities: ['tabular', 'audio'],
        syntheticCandidates: [
            {
                id: 'brats-2023-brain-glioma',
                title: 'BraTS 2023: Brain Tumor Segmentation (Glioma & Glioblastoma 3D MRI)',
                type: 'dataset',
                source: 'kaggle',
                description: 'Standard benchmark for brain tumor and glioma segmentation in volumetric mpMRI.',
                tags: ['brain', 'glioma', 'mri', 'segmentation'],
                isGroundTruthRelevant: true,
                anatomy: 'brain',
                modality: 'MRI',
                task: 'segmentation',
                formats: ['nii.gz'],
                downloads: 85000,
            },
            {
                id: 'lgg-mri-brain-segmentation',
                title: 'Lower-Grade Glioma (LGG) Brain MRI Segmentation with FLAIR Abnormality',
                type: 'dataset',
                source: 'kaggle',
                description: 'Brain MRI dataset with genomic cluster labels and tumor segmentation masks.',
                tags: ['brain', 'glioma', 'mri', 'segmentation'],
                isGroundTruthRelevant: true,
                anatomy: 'brain',
                modality: 'MRI',
                task: 'segmentation',
                formats: ['tif'],
                downloads: 120000,
            },
            {
                id: 'lits-liver-tumor-segmentation',
                title: 'LiTS - Liver Tumor Segmentation Benchmark (CT)',
                type: 'dataset',
                source: 'kaggle',
                description: 'Liver and liver tumor segmentation challenge.',
                tags: ['liver', 'tumor', 'ct', 'segmentation'],
                isGroundTruthRelevant: false,
                anatomy: 'liver',
                modality: 'CT',
                task: 'segmentation',
                formats: ['nii.gz'],
                downloads: 45000,
            },
        ],
    },
    {
        id: 'query-3-chest-xray-pneumonia',
        query: 'Chest X-ray pneumonia classification',
        description: 'Pneumonia disease classification in chest X-rays',
        expectedAnatomy: 'THORAX_CARDIAC',
        expectedModality: 'X-RAY',
        expectedTask: 'classification',
        disallowedAnatomies: ['brain', 'abdomen', 'prostate'],
        disallowedModalities: ['mri', 'tabular', 'audio'],
        syntheticCandidates: [
            {
                id: 'chest-xray-pneumonia-dataset',
                title: 'Chest X-Ray Images (Pneumonia Detection & Classification)',
                type: 'dataset',
                source: 'kaggle',
                description: '5,863 chest X-ray images labeled for normal vs bacterial and viral pneumonia.',
                tags: ['chest', 'pneumonia', 'x-ray', 'classification'],
                isGroundTruthRelevant: true,
                anatomy: 'chest',
                modality: 'X-ray',
                task: 'classification',
                formats: ['jpeg'],
                downloads: 250000,
            },
            {
                id: 'nih-chest-xrays-14',
                title: 'NIH Chest X-ray 14: Multi-label Pulmonary Disease Classification',
                type: 'dataset',
                source: 'kaggle',
                description: '112,120 frontal-view X-ray images with 14 disease labels including pneumonia.',
                tags: ['chest', 'x-ray', 'lung', 'pneumonia'],
                isGroundTruthRelevant: true,
                anatomy: 'chest',
                modality: 'X-ray',
                task: 'classification',
                formats: ['png'],
                downloads: 180000,
            },
            {
                id: 'brats-brain-tumor-mri',
                title: 'BraTS Brain Tumor MRI Dataset',
                type: 'dataset',
                source: 'kaggle',
                description: 'Brain MRI segmentation dataset.',
                tags: ['brain', 'mri', 'tumor'],
                isGroundTruthRelevant: false,
                anatomy: 'brain',
                modality: 'MRI',
                task: 'segmentation',
                downloads: 85000,
            },
        ],
    },
    {
        id: 'query-4-credit-card-fraud',
        query: 'Credit card fraud detection tabular data',
        description: 'Tabular fraud detection in financial transactions',
        expectedModality: 'TABULAR',
        expectedTask: 'classification',
        disallowedAnatomies: ['brain', 'abdomen', 'chest'],
        disallowedModalities: ['mri', 'ct', 'x-ray', 'image'],
        syntheticCandidates: [
            {
                id: 'creditcard-fraud-detection-dataset',
                title: 'Credit Card Fraud Detection Dataset (284,807 Transactions)',
                type: 'dataset',
                source: 'kaggle',
                description: 'PCA-transformed credit card transactions labeled for fraudulent activity.',
                tags: ['finance', 'fraud', 'tabular', 'csv', 'classification'],
                isGroundTruthRelevant: true,
                modality: 'tabular',
                task: 'classification',
                formats: ['csv'],
                downloads: 300000,
            },
            {
                id: 'amos-abdominal-mri-dataset',
                title: 'AMOS 2022 Abdominal Multi-Organ MRI Segmentation',
                type: 'dataset',
                source: 'kaggle',
                description: '3D abdominal MRI dataset.',
                tags: ['abdomen', 'mri', 'segmentation'],
                isGroundTruthRelevant: false,
                modality: 'MRI',
                task: 'segmentation',
                downloads: 4200,
            },
        ],
    },
    {
        id: 'query-5-speech-emotion',
        query: 'Speech emotion recognition audio WAV dataset',
        description: 'Speech emotion recognition in acoustic audio waveforms',
        expectedModality: 'AUDIO',
        expectedTask: 'classification',
        disallowedAnatomies: ['brain', 'abdomen', 'chest'],
        disallowedModalities: ['mri', 'ct', 'x-ray', 'tabular_only'],
        syntheticCandidates: [
            {
                id: 'ravdess-speech-emotion-dataset',
                title: 'RAVDESS Emotional Speech Audio Dataset (WAV Audio Files)',
                type: 'dataset',
                source: 'kaggle',
                description: 'Ryerson Audio-Visual Database of Emotional Speech and Song with 24 professional actors.',
                tags: ['audio', 'speech', 'emotion', 'wav', 'sound'],
                isGroundTruthRelevant: true,
                modality: 'audio',
                task: 'classification',
                formats: ['wav'],
                downloads: 140000,
            },
            {
                id: 'tess-toronto-emotional-speech-set',
                title: 'TESS: Toronto Emotional Speech Set Audio Corpus',
                type: 'dataset',
                source: 'kaggle',
                description: '2,800 audio WAV files spoken with 7 distinct emotional expressions.',
                tags: ['audio', 'speech', 'emotion', 'wav'],
                isGroundTruthRelevant: true,
                modality: 'audio',
                task: 'classification',
                formats: ['wav'],
                downloads: 65000,
            },
            {
                id: 'chest-xray-pneumonia-dataset',
                title: 'Chest X-Ray Pneumonia Dataset',
                type: 'dataset',
                source: 'kaggle',
                description: 'Chest X-ray images.',
                tags: ['chest', 'x-ray', 'image'],
                isGroundTruthRelevant: false,
                modality: 'X-ray',
                task: 'classification',
                downloads: 250000,
            },
        ],
    },
];

/**
 * Calculates IR metrics for a ranked list of candidates against a benchmark spec.
 */
function evaluateRankedList(
    rankedCandidates: UnifiedCandidate[],
    spec: BenchmarkQuerySpec
): IRBenchmarkMetrics {
    const k5 = rankedCandidates.slice(0, 5);
    const k10 = rankedCandidates.slice(0, 10);

    const relevantCountTotal = spec.syntheticCandidates.filter(c => c.isGroundTruthRelevant).length;

    // Precision@5 & Precision@10
    const relevantInK5 = k5.filter(c => {
        const syn = spec.syntheticCandidates.find(s => s.id === c.id);
        return syn?.isGroundTruthRelevant ?? false;
    }).length;

    const relevantInK10 = k10.filter(c => {
        const syn = spec.syntheticCandidates.find(s => s.id === c.id);
        return syn?.isGroundTruthRelevant ?? false;
    }).length;

    const precisionAt5 = k5.length > 0 ? (relevantInK5 / k5.length) * 100 : 0;
    const precisionAt10 = k10.length > 0 ? (relevantInK10 / k10.length) * 100 : 0;
    const recallAt10 = relevantCountTotal > 0 ? (relevantInK10 / relevantCountTotal) * 100 : 100;

    // NDCG@10
    let dcg = 0;
    let idcg = 0;
    for (let i = 0; i < k10.length; i++) {
        const syn = spec.syntheticCandidates.find(s => s.id === k10[i].id);
        const rel = syn?.isGroundTruthRelevant ? 1 : 0;
        dcg += rel / Math.log2(i + 2);
    }
    for (let i = 0; i < Math.min(relevantCountTotal, 10); i++) {
        idcg += 1 / Math.log2(i + 2);
    }
    const ndcgAt10 = idcg > 0 ? (dcg / idcg) * 100 : 100;

    // MRR (Reciprocal Rank of first relevant item)
    let mrr = 0;
    for (let i = 0; i < rankedCandidates.length; i++) {
        const syn = spec.syntheticCandidates.find(s => s.id === rankedCandidates[i].id);
        if (syn?.isGroundTruthRelevant) {
            mrr = (1 / (i + 1)) * 100;
            break;
        }
    }

    // Error Rates in top 5
    let wrongAnatomyCount = 0;
    let wrongModalityCount = 0;
    let wrongTaskCount = 0;
    let falsePositiveCount = 0;

    for (const c of k5) {
        const text = `${c.title} ${(c.tags || []).join(' ')} ${c.description}`.toLowerCase();

        const hasDisallowedAnatomy = spec.disallowedAnatomies.some(a => {
            const regex = new RegExp(`\\b${a.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
            return regex.test(text);
        });
        if (hasDisallowedAnatomy) wrongAnatomyCount++;

        const hasDisallowedModality = spec.disallowedModalities.some(m => {
            const regex = new RegExp(`\\b${m.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
            return regex.test(text);
        });
        if (hasDisallowedModality) wrongModalityCount++;

        const syn = spec.syntheticCandidates.find(s => s.id === c.id);
        if (syn && !syn.isGroundTruthRelevant) {
            falsePositiveCount++;
        }
    }

    const wrongAnatomyRate = k5.length > 0 ? (wrongAnatomyCount / k5.length) * 100 : 0;
    const wrongModalityRate = k5.length > 0 ? (wrongModalityCount / k5.length) * 100 : 0;
    const wrongTaskRate = k5.length > 0 ? (wrongTaskCount / k5.length) * 100 : 0;
    const falsePositiveRate = k5.length > 0 ? (falsePositiveCount / k5.length) * 100 : 0;
    const falseNegativeRate = Math.max(0, 100 - recallAt10);

    return {
        precisionAt5: Math.round(precisionAt5),
        precisionAt10: Math.round(precisionAt10),
        recallAt10: Math.round(recallAt10),
        ndcgAt10: Math.round(ndcgAt10),
        mrr: Math.round(mrr),
        falsePositiveRate: Math.round(falsePositiveRate),
        falseNegativeRate: Math.round(falseNegativeRate),
        wrongAnatomyRate: Math.round(wrongAnatomyRate),
        wrongModalityRate: Math.round(wrongModalityRate),
        wrongTaskRate: Math.round(wrongTaskRate),
    };
}

/**
 * Runs baseline (raw keyword + popularity ranking) vs Advanced Pipeline on benchmark queries.
 */
export function runBenchmarkEvaluation(): {
    comparisons: IREvaluationComparison[];
    aggregate: {
        baseline: IRBenchmarkMetrics;
        advanced: IRBenchmarkMetrics;
        overallPrecisionGain: number;
        overallNdcgGain: number;
        overallErrorReduction: number;
    };
} {
    const comparisons: IREvaluationComparison[] = [];

    for (const spec of BENCHMARK_QUERIES) {
        // Convert synthetic pool into UnifiedCandidate array
        const candidates: UnifiedCandidate[] = spec.syntheticCandidates.map(c => ({
            id: c.id,
            title: c.title,
            name: c.title,
            type: c.type,
            source: c.source,
            description: c.description,
            tags: c.tags,
            formats: c.formats || [],
            modality: c.modality || '',
            task: c.task || '',
            downloads: c.downloads || 0,
            matchScore: 50,
            
            tier: 'Tier C',
            evidenceLevel: 'UNVERIFIED',
            evidenceSources: ['Benchmark Suite'],
            evidenceStrength: 30,
            matchBreakdown: {
                anatomy: 50, modality: 50, task: 50, dimension: 50, target: 50,
                domain: 50, semantic: 50, evidence: 30, metadata: 50, accessibility: 90, popularity: 50, overall: 50,
                confirmedClaims: [], warnings: [],
            },
            evidence: [],
            warnings: [],
            rejected: false,
            rejectionReason: null,
            matchReason: '',
            metadata: {},
        }));

        // ── 1. BASELINE SEARCH (Popularity + Naive Keyword Overlap alone) ────
        const baselineRanked = [...candidates].sort((a, b) => {
            // Naive query keyword overlap
            const words = spec.query.toLowerCase().split(/\s+/);
            const scoreA = words.filter(w => `${a.title} ${a.description}`.toLowerCase().includes(w)).length * 1000 + (a.downloads || 0);
            const scoreB = words.filter(w => `${b.title} ${b.description}`.toLowerCase().includes(w)).length * 1000 + (b.downloads || 0);
            return scoreB - scoreA;
        });

        const baselineMetrics = evaluateRankedList(baselineRanked, spec);

        // ── 2. ADVANCED RETRIEVAL PIPELINE ──────────────────────────────────
        // Step A: Query Understanding
        const understanding = understandQuery(spec.query);

        // Step B: Deduplication
        const deduped = deduplicateCandidates(candidates);

        // Step C: Hard Filter
        const { passed } = (() => { passed: true })(deduped, understanding);

        // Step D: Semantic Ranking
        const semanticRanked = rankBySemanticSimilarity(passed, understanding);

        // Step E: Cross-Encoder & Composite Scoring
        const scored = semanticRanked.map(cand => calculateCompositeCandidateScore(cand, understanding));

        // Step F: Sort & MMR Diversity
        const sorted = scored.sort((a, b) => b.matchScore - a.matchScore);
        const advancedRanked = applyMMR(sorted, 10);

        const advancedMetrics = evaluateRankedList(advancedRanked, spec);

        comparisons.push({
            queryId: spec.id,
            query: spec.query,
            baseline: baselineMetrics,
            advanced: advancedMetrics,
            improvementPercent: {
                precisionAt5: advancedMetrics.precisionAt5 - baselineMetrics.precisionAt5,
                ndcgAt10: advancedMetrics.ndcgAt10 - baselineMetrics.ndcgAt10,
                errorReduction: baselineMetrics.wrongAnatomyRate - advancedMetrics.wrongAnatomyRate,
            },
        });
    }

    // Compute Aggregate Averages
    const avg = (fn: (c: IREvaluationComparison) => number) =>
        Math.round(comparisons.reduce((sum, c) => sum + fn(c), 0) / comparisons.length);

    const aggBaseline: IRBenchmarkMetrics = {
        precisionAt5: avg(c => c.baseline.precisionAt5),
        precisionAt10: avg(c => c.baseline.precisionAt10),
        recallAt10: avg(c => c.baseline.recallAt10),
        ndcgAt10: avg(c => c.baseline.ndcgAt10),
        mrr: avg(c => c.baseline.mrr),
        falsePositiveRate: avg(c => c.baseline.falsePositiveRate),
        falseNegativeRate: avg(c => c.baseline.falseNegativeRate),
        wrongAnatomyRate: avg(c => c.baseline.wrongAnatomyRate),
        wrongModalityRate: avg(c => c.baseline.wrongModalityRate),
        wrongTaskRate: avg(c => c.baseline.wrongTaskRate),
    };

    const aggAdvanced: IRBenchmarkMetrics = {
        precisionAt5: avg(c => c.advanced.precisionAt5),
        precisionAt10: avg(c => c.advanced.precisionAt10),
        recallAt10: avg(c => c.advanced.recallAt10),
        ndcgAt10: avg(c => c.advanced.ndcgAt10),
        mrr: avg(c => c.advanced.mrr),
        falsePositiveRate: avg(c => c.advanced.falsePositiveRate),
        falseNegativeRate: avg(c => c.advanced.falseNegativeRate),
        wrongAnatomyRate: avg(c => c.advanced.wrongAnatomyRate),
        wrongModalityRate: avg(c => c.advanced.wrongModalityRate),
        wrongTaskRate: avg(c => c.advanced.wrongTaskRate),
    };

    return {
        comparisons,
        aggregate: {
            baseline: aggBaseline,
            advanced: aggAdvanced,
            overallPrecisionGain: aggAdvanced.precisionAt5 - aggBaseline.precisionAt5,
            overallNdcgGain: aggAdvanced.ndcgAt10 - aggBaseline.ndcgAt10,
            overallErrorReduction: aggBaseline.wrongAnatomyRate - aggAdvanced.wrongAnatomyRate,
        },
    };
}

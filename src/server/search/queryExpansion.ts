/**
 * Query Expansion & Decomposition Engine (Search Engine 2.0.0)
 *
 * Implements Section 7 & 8: Tiered Retrieval and Targeted Query Families.
 * Never sends only the raw query to external APIs.
 * Generates structured query sets from narrow (Tier 1) to broad (Tier 4):
 *
 * Tier 1: Exact specialized query (e.g., "4D flow cardiac MRI radial undersampling")
 * Tier 2: Specialized synonym query (e.g., "4D phase contrast cardiac MRI reconstruction")
 * Tier 3: Domain + modality + task (e.g., "cardiac MRI velocity reconstruction")
 * Tier 4: Domain + core modality (e.g., "4D flow MRI dataset")
 */

import { StructuredQueryUnderstanding, ResearchQuerySchema } from './types';
import { SCIENTIFIC_CONCEPT_GRAPH } from './ontology';

export interface TieredQuery {
    query: string;
    tier: 1 | 2 | 3 | 4;
    category: 'dataset' | 'model' | 'paper' | 'benchmark';
}

export interface SpecializedQueries {
    datasetQueries: string[];
    modelQueries: string[];
    paperQueries: string[];
    benchmarkQueries: string[];
    allQueries: string[];
    tieredQueries: TieredQuery[];
}

export function expandQueries(
    input: StructuredQueryUnderstanding | ResearchQuerySchema
): SpecializedQueries {
    const isSchema = 'primaryDomain' in input;
    const rawQuery = isSchema ? input.originalQuery : input.rawQuery;
    const qLower = rawQuery.toLowerCase();

    const tieredQueries: TieredQuery[] = [];
    const datasetQueries: string[] = [];
    const modelQueries: string[] = [];
    const paperQueries: string[] = [];
    const benchmarkQueries: string[] = [];

    // Helper to add query with tier and deduplicate
    const addQuery = (query: string, tier: 1 | 2 | 3 | 4, category: 'dataset' | 'model' | 'paper' | 'benchmark') => {
        const trimmed = query.trim().replace(/\s+/g, ' ');
        if (!trimmed) return;
        if (!tieredQueries.some(t => t.query.toLowerCase() === trimmed.toLowerCase() && t.category === category)) {
            tieredQueries.push({ query: trimmed, tier, category });
        }
        if (category === 'dataset' && !datasetQueries.includes(trimmed)) datasetQueries.push(trimmed);
        if (category === 'model' && !modelQueries.includes(trimmed)) modelQueries.push(trimmed);
        if (category === 'paper' && !paperQueries.includes(trimmed)) paperQueries.push(trimmed);
        if (category === 'benchmark' && !benchmarkQueries.includes(trimmed)) benchmarkQueries.push(trimmed);
    };

    const is4DFlowCardiac = /4d\s*flow|phase\s*contrast|pc.?mri/i.test(qLower) && /cardiac|heart|aort|coronary|myocard/i.test(qLower);
    const isAlzheimer = /alzheimer|dementia|mild\s*cognitive\s*impairment|\bmci\b|adni|oasis|apoe|cognitive\s*progression/i.test(qLower);
    const isRetinopathy = /retinopath|retina|fundus|ophthalm|diabetic\s*retinopathy|macular|glaucoma/i.test(qLower);
    const isVehicle = /vehicle|traffic|car\b|autonomous|yolo/i.test(qLower);
    const isPet = /cats?\s*and\s*dogs?|pet\b|animal\b|dog\b|cat\b/i.test(qLower);
    const isNuclei = /nuclei|monuseg|stardist|histolog|fluorescence\s*microscopy/i.test(qLower);
    const isSkin = /skin\s*lesion|melanoma|isic|dermoscop/i.test(qLower);
    // New compound-query domain flags
    const isAudioEmotion = /speech\s*emotion|emotion\s*(recogni|classif|detect).*(audio|speech|voice)|audio\s*emotion|(emotion|affect)\s*(from|in)\s*(speech|audio|voice)/i.test(qLower);
    const isAudioClassification = /\baudio\s*classif|\bsound\s*classif|\bacoustic\s*(event|classif)|audio\s*(detect|recogni)/i.test(qLower) && !isAudioEmotion;
    const isASR = /automatic\s*speech\s*recogni|\basr\b|speech.to.text|transcri.*speech|voice\s*recogni/i.test(qLower);
    const isAnyAudio = isAudioEmotion || isAudioClassification || isASR || /\baudio\b|\bspeech\b|\bacoustic\b/i.test(qLower);
    const isCoronarySegmentation = /coronary\s*(art(?:ery|eries)|vessel|cta|ct).*segment|segment.*coronary|coronary.*ct.*segment/i.test(qLower) || (/coronary/i.test(qLower) && /segment/i.test(qLower));
    const isDriverFatigue = /driver\s*(fatigue|drowsi|monitor)|drowsi.*detect|fatigue.*detect.*(?:driver|driving)|driver\s*(attention|alert)/i.test(qLower);
    const isKeypoint = /keypoint|pose\s*estimat|skeleton\s*detect|human\s*pose|body\s*landmark/i.test(qLower);


    // ── 1. Target Problem: 4D Flow Cardiac MRI Velocity & WSS ─────────────────
    if (is4DFlowCardiac) {
        // TIER 1: Exact Specialized Queries
        addQuery('4D flow cardiac MRI radial undersampling', 1, 'dataset');
        addQuery('4D flow cardiac MRI velocity field reconstruction', 1, 'dataset');
        addQuery('sparse k-space radial undersampling cardiac MRI', 1, 'dataset');
        addQuery('4D flow cardiac MRI velocity reconstruction', 1, 'paper');
        addQuery('radial undersampling 4D flow MRI', 1, 'paper');
        addQuery('wall shear stress 4D flow MRI', 1, 'paper');
        addQuery('4D flow MRI reconstruction', 1, 'model');
        addQuery('radial undersampled MRI reconstruction', 1, 'model');
        addQuery('4D flow velocity reconstruction', 1, 'model');
        addQuery('4D flow MRI challenge', 1, 'benchmark');

        // TIER 2: Specialized Synonym Queries
        addQuery('4D phase contrast MRI velocity', 2, 'dataset');
        addQuery('cardiac 4D flow MRI dataset', 2, 'dataset');
        addQuery('4D phase contrast cardiac MRI reconstruction', 2, 'paper');
        addQuery('sparse k-space 4D flow MRI', 2, 'paper');
        addQuery('4D phase contrast MRI hemodynamics', 2, 'paper');
        addQuery('phase contrast MRI reconstruction', 2, 'model');
        addQuery('cardiac MRI k-space reconstruction', 2, 'model');
        addQuery('non Cartesian MRI reconstruction', 2, 'model');
        addQuery('velocity field reconstruction MRI', 2, 'model');

        // TIER 3: Domain + Modality + Task Queries
        addQuery('cardiovascular velocity field MRI', 3, 'dataset');
        addQuery('aortic 4D flow MRI', 3, 'dataset');
        addQuery('velocity field reconstruction cardiac MRI', 3, 'paper');
        addQuery('cardiac MRI velocity reconstruction', 3, 'paper');
        addQuery('hemodynamic wall shear stress MRI estimation', 3, 'paper');
        addQuery('cardiac MRI reconstruction unet', 3, 'model');
        addQuery('variational network mri reconstruction', 3, 'model');
        addQuery('cardiac MRI reconstruction benchmark', 3, 'benchmark');

        // TIER 4: Domain + Core Modality Queries
        addQuery('phase contrast MRI flow dataset', 4, 'dataset');
        addQuery('4D flow MRI hemodynamics', 4, 'dataset');
        addQuery('cardiac 4D flow MRI', 4, 'dataset');
        addQuery('cardiac MRI flow quantification', 4, 'paper');
        addQuery('fastMRI cardiac reconstruction', 4, 'benchmark');
    } else if (isAlzheimer) {
        // TIER 1: Exact Specialized Queries for Alzheimer's / Dementia Progression
        addQuery('Alzheimer MRI', 1, 'dataset');
        addQuery('ADNI brain MRI', 1, 'dataset');
        addQuery('Alzheimer longitudinal MRI', 1, 'dataset');
        addQuery('OASIS brain MRI', 1, 'dataset');
        addQuery('Alzheimer disease dataset', 1, 'dataset');
        addQuery('Alzheimer MRI model', 1, 'model');
        addQuery('3D brain MRI transformer', 1, 'model');
        addQuery('Alzheimer progression prediction', 1, 'model');
        addQuery('longitudinal Alzheimer MRI progression deep learning', 1, 'paper');
        addQuery('multimodal Alzheimer disease prediction MRI clinical', 1, 'paper');
        addQuery('ADNI', 1, 'benchmark');
        addQuery('OASIS-3 Alzheimer', 1, 'benchmark');

        // TIER 2: Secondary & Synonym Queries
        addQuery('mri-and-alzheimers', 2, 'dataset');
        addQuery('oasis-1-shinohara', 2, 'dataset');
        addQuery('mci-to-ad-mri-dataset', 2, 'dataset');
        addQuery('medical vision transformer 3D', 2, 'model');
        addQuery('tabnet tabular transformer', 2, 'model');
        addQuery('missing modality medical deep learning Alzheimer', 2, 'paper');
        addQuery('Alzheimer benchmark', 2, 'benchmark');

        // TIER 3 & 4
        addQuery('brain MRI dementia dataset', 3, 'dataset');
        addQuery('brain MRI progression prediction', 3, 'model');
        addQuery('longitudinal brain MRI deep learning', 3, 'paper');
        addQuery('brain MRI longitudinal dataset', 4, 'dataset');
    } else if (isRetinopathy) {
        // TIER 1: Diabetic Retinopathy & Ophthalmology Queries
        addQuery('diabetic retinopathy', 1, 'dataset');
        addQuery('retinal fundus dataset', 1, 'dataset');
        addQuery('EyePACS diabetic retinopathy', 1, 'dataset');
        addQuery('diabetic retinopathy image dataset', 1, 'dataset');
        addQuery('diabetic retinopathy classification model', 1, 'model');
        addQuery('retinal fundus vision model', 1, 'model');
        addQuery('BiomedCLIP', 1, 'model');
        addQuery('diabetic retinopathy fundus deep learning classification', 1, 'paper');
        addQuery('retinal image classification transformers', 1, 'paper');
        addQuery('EyePACS', 1, 'benchmark');
        addQuery('MESSIDOR', 1, 'benchmark');

        // TIER 2 & 3
        addQuery('diabetic retinopathy grading dataset', 2, 'dataset');
        addQuery('fundus photo classification model', 2, 'model');
        addQuery('DRIVE retina challenge', 2, 'benchmark');
        addQuery('retinal fundus classification', 3, 'dataset');
    } else if (isVehicle) {
        // TIER 1: Vehicle & Traffic Detection Queries
        addQuery('vehicle instance segmentation dataset', 1, 'dataset');
        addQuery('traffic vehicle detection dataset', 1, 'dataset');
        addQuery('car segmentation images', 1, 'dataset');
        addQuery('yolov8 instance segmentation', 1, 'model');
        addQuery('yolov8 vehicle', 1, 'model');
        addQuery('yolov8-seg', 1, 'model');
        addQuery('YOLOv8 real time instance segmentation vehicles', 1, 'paper');
        addQuery('deep learning vehicle detection surveillance', 1, 'paper');
        addQuery('COCO vehicle', 1, 'benchmark');
        addQuery('BDD100K traffic dataset', 1, 'benchmark');

        // TIER 2 & 3
        addQuery('vehicle detection dataset', 2, 'dataset');
        addQuery('yolov8 object detection', 2, 'model');
        addQuery('traffic surveillance dataset', 3, 'dataset');
    } else if (isPet) {
        // TIER 1: Pet / Animal Classification Queries
        addQuery('cats and dogs dataset', 1, 'dataset');
        addQuery('oxford iiit pet', 1, 'dataset');
        addQuery('cat dog image classification', 1, 'dataset');
        addQuery('cats and dogs', 1, 'dataset');
        addQuery('vision transformer image classification', 1, 'model');
        addQuery('resnet cats and dogs', 1, 'model');
        addQuery('convnext image classification', 1, 'model');
        addQuery('fine grained pet classification deep learning', 1, 'paper');
        addQuery('deep learning image classification transfer learning', 1, 'paper');
        addQuery('Oxford IIIT Pet', 1, 'benchmark');

        // TIER 2 & 3
        addQuery('animal image dataset', 2, 'dataset');
        addQuery('image classification vision transformer', 2, 'model');
    } else if (isNuclei) {
        // TIER 1: Cellular & Nuclei Segmentation Queries
        addQuery('MoNuSeg nuclei dataset', 1, 'dataset');
        addQuery('cell nuclei segmentation microscopy', 1, 'dataset');
        addQuery('fluorescence microscopy nuclei dataset', 1, 'dataset');
        addQuery('StarDist nuclei segmentation', 1, 'model');
        addQuery('cellpose microscopy', 1, 'model');
        addQuery('U-Net nuclei segmentation', 1, 'model');
        addQuery('star convex nuclei segmentation fluorescence microscopy', 1, 'paper');
        addQuery('few shot nuclei segmentation deep learning', 1, 'paper');
        addQuery('MoNuSeg challenge', 1, 'benchmark');
    } else if (isSkin) {
        // TIER 1: Skin Lesion / Melanoma Queries
        addQuery('ISIC skin lesion dataset', 1, 'dataset');
        addQuery('melanoma classification dermoscopy', 1, 'dataset');
        addQuery('skin cancer image dataset', 1, 'dataset');
        addQuery('skin lesion', 1, 'dataset');
        addQuery('dermoscopy skin cancer dataset', 1, 'dataset');
        addQuery('melanoma classification model', 1, 'model');
        addQuery('EfficientNet skin lesion classification', 1, 'model');
        addQuery('skin lesion classification deep learning', 1, 'paper');
        addQuery('melanoma detection convolutional neural network', 1, 'paper');
        addQuery('ISIC challenge benchmark', 1, 'benchmark');

        // TIER 2
        addQuery('HAM10000 skin dataset', 2, 'dataset');
        addQuery('skin lesion dermoscopy', 2, 'dataset');
        addQuery('dermoscopy image classification', 2, 'model');
        addQuery('isic melanoma dermoscopy deep learning', 2, 'paper');

        // TIER 3 & 4
        addQuery('skin cancer dermoscopy', 3, 'dataset');
        addQuery('melanoma detection model', 3, 'model');
        addQuery('skin cancer classification', 4, 'dataset');

    } else if (isAudioEmotion) {
        // ── Audio: Speech Emotion Recognition ───────────────────────────────────
        // TIER 1: Exact compound [Entity]+[Task]+[Modality]
        addQuery('speech emotion recognition audio dataset', 1, 'dataset');
        addQuery('emotion recognition speech wav dataset', 1, 'dataset');
        addQuery('speech emotion recognition corpus', 1, 'dataset');
        addQuery('audio emotion classification model', 1, 'model');
        addQuery('speech emotion recognition transformer', 1, 'model');
        addQuery('wav2vec emotion classification', 1, 'model');
        addQuery('speech emotion recognition deep learning', 1, 'paper');
        addQuery('audio emotion recognition transformer wav2vec', 1, 'paper');
        addQuery('IEMOCAP RAVDESS speech emotion benchmark', 1, 'benchmark');

        // TIER 2: Synonym compound queries
        addQuery('emotion recognition audio classification speech', 2, 'dataset');
        addQuery('affective speech dataset emotion labels', 2, 'dataset');
        addQuery('audio emotion recognition hubert', 2, 'model');
        addQuery('IEMOCAP', 2, 'benchmark');
        addQuery('RAVDESS', 2, 'benchmark');

        // TIER 3 & 4
        addQuery('speech emotion dataset', 3, 'dataset');
        addQuery('audio emotion model', 3, 'model');
        addQuery('speech affect recognition', 3, 'paper');
        addQuery('emotion speech audio', 4, 'dataset');

    } else if (isASR) {
        // ── Audio: Automatic Speech Recognition ─────────────────────────────────
        addQuery('automatic speech recognition dataset', 1, 'dataset');
        addQuery('ASR speech transcription corpus audio', 1, 'dataset');
        addQuery('whisper speech recognition model', 1, 'model');
        addQuery('wav2vec ASR model', 1, 'model');
        addQuery('speech recognition deep learning transformer', 1, 'paper');
        addQuery('LibriSpeech ASR benchmark', 1, 'benchmark');
        addQuery('CommonVoice speech dataset', 2, 'dataset');
        addQuery('speech recognition audio corpus', 3, 'dataset');

    } else if (isAudioClassification) {
        // ── Audio: Acoustic Event Detection / Sound Classification ──────────────
        addQuery('acoustic event detection audio dataset', 1, 'dataset');
        addQuery('sound event detection audio classification dataset', 1, 'dataset');
        addQuery('audio classification sound events', 1, 'dataset');
        addQuery('audio spectrogram transformer sound classification', 1, 'model');
        addQuery('panns audio classification model', 1, 'model');
        addQuery('acoustic event detection deep learning', 1, 'paper');
        addQuery('AudioSet sound event benchmark', 1, 'benchmark');
        addQuery('ESC-50 audio classification benchmark', 2, 'benchmark');
        addQuery('audio sound classification dataset', 3, 'dataset');

    } else if (isCoronarySegmentation && !is4DFlowCardiac) {
        // ── Medical: Coronary Artery CT/CTA Segmentation ────────────────────────
        // TIER 1: Exact compound [Anatomy]+[Task]+[Modality]
        addQuery('coronary artery CT segmentation dataset', 1, 'dataset');
        addQuery('coronary artery segmentation CTA dataset', 1, 'dataset');
        addQuery('CCTA coronary vessel segmentation', 1, 'dataset');
        addQuery('coronary artery segmentation model', 1, 'model');
        addQuery('CT vessel segmentation transformer', 1, 'model');
        addQuery('nnUNet coronary segmentation', 1, 'model');
        addQuery('coronary artery segmentation deep learning CT', 1, 'paper');
        addQuery('CCTA coronary stenosis detection segmentation', 1, 'paper');
        addQuery('coronary CT angiography challenge benchmark', 1, 'benchmark');

        // TIER 2 & 3
        addQuery('coronary vessel segmentation CTA', 2, 'dataset');
        addQuery('cardiac CT artery segmentation model', 2, 'model');
        addQuery('cardiovascular CT segmentation dataset', 3, 'dataset');
        addQuery('vascular segmentation CT deep learning', 3, 'paper');

    } else if (isDriverFatigue) {
        // ── Automotive/Video: Driver Fatigue & Drowsiness Detection ─────────────
        // TIER 1: Exact compound [Entity]+[Task]+[Modality]
        addQuery('driver fatigue detection video dataset', 1, 'dataset');
        addQuery('drowsiness detection driver monitoring video', 1, 'dataset');
        addQuery('driver drowsiness face video classification dataset', 1, 'dataset');
        addQuery('driver fatigue detection model video classification', 1, 'model');
        addQuery('driver monitoring system eye closure detection', 1, 'model');
        addQuery('drowsiness detection deep learning video', 1, 'paper');
        addQuery('driver fatigue eye closure yawn detection', 1, 'paper');
        addQuery('driver attention monitoring benchmark dataset', 1, 'benchmark');

        // TIER 2 & 3
        addQuery('driver alertness eye detection video', 2, 'dataset');
        addQuery('drowsy driver dataset', 2, 'dataset');
        addQuery('video classification driver attention model', 2, 'model');
        addQuery('driver fatigue video', 3, 'dataset');
        addQuery('fatigue detection driving video deep learning', 3, 'paper');

    } else if (isKeypoint) {
        // ── Vision: Human Pose / Keypoint Estimation ────────────────────────────
        addQuery('human pose estimation keypoint dataset', 1, 'dataset');
        addQuery('body keypoint detection benchmark', 1, 'dataset');
        addQuery('pose estimation model keypoint detection', 1, 'model');
        addQuery('human pose estimation transformer', 1, 'model');
        addQuery('human pose estimation deep learning keypoint', 1, 'paper');
        addQuery('COCO keypoints benchmark', 1, 'benchmark');
        addQuery('MPII human pose dataset', 2, 'dataset');
        addQuery('keypoint detection pose estimation', 3, 'dataset');

    } else {
        // ── Generic: Compound Multi-Token Query Generation ───────────────────────
        //
        // Strategy: extract [Entity/Target] + [Task] + [Modality] tokens from the query
        // and build compound search strings. Never fall back to single bare tokens.
        //
        const primaryAnatomy = isSchema ? (input.anatomy[0] || '') : (input.anatomy.primary[0] || '');
        const primaryModality = isSchema ? (input.modalities[0] || '') : (input.modality[0] || '');
        const primaryTask = isSchema
            ? (input.reconstructionTasks[0] || input.estimationTasks[0] || input.predictionTasks[0] || '')
            : (input.task || '');
        const targetEntity = isSchema ? (input.targetEntities[0] || '') : (input.target?.[0] || '');

        // Distill raw query to short phrase (2-5 meaningful words), stripping prompt preamble
        const strippedQuery = rawQuery
            .replace(/^(I am building|I need to|We want to|Please find|Can you recommend|I have|Looking for|Search for|Find me)\s+/i, '')
            .trim();
        const shortQuery = strippedQuery.split(/[\n.?,;]/)[0].trim().split(/\s+/).slice(0, 6).join(' ');

        // Build compound queries from extracted structural tokens
        const entity = targetEntity || primaryAnatomy || shortQuery.split(/\s+/).slice(0, 2).join(' ');
        const task = primaryTask || shortQuery.split(/\s+/).slice(-2).join(' ');
        const modality = primaryModality && primaryModality !== 'Multimodal / General' ? primaryModality : '';

        // TIER 1: Full compound [Entity + Task + Modality] strings
        if (entity && task && modality) {
            addQuery(`${entity} ${task} ${modality} dataset`, 1, 'dataset');
            addQuery(`${entity} ${task} ${modality} model`, 1, 'model');
            addQuery(`${entity} ${task} ${modality} deep learning`, 1, 'paper');
        } else if (entity && task) {
            addQuery(`${entity} ${task} dataset`, 1, 'dataset');
            addQuery(`${entity} ${task} model`, 1, 'model');
            addQuery(`${entity} ${task} deep learning`, 1, 'paper');
        } else if (shortQuery && shortQuery.length < 60) {
            addQuery(`${shortQuery} dataset`, 1, 'dataset');
            addQuery(`${shortQuery} model`, 1, 'model');
            addQuery(`${shortQuery} deep learning`, 1, 'paper');
        }

        // TIER 2: Entity + Task, Entity + Modality
        if (entity && modality) {
            addQuery(`${entity} ${modality} dataset`, 2, 'dataset');
            addQuery(`${entity} ${modality} model`, 2, 'model');
        }
        if (entity) {
            addQuery(`${entity} deep learning dataset`, 2, 'dataset');
            addQuery(`${entity} neural network`, 2, 'model');
        }

        // TIER 3: Modality + Task combinations
        if (modality && task) {
            addQuery(`${modality} ${task} dataset`, 3, 'dataset');
            addQuery(`${modality} ${task} deep learning`, 3, 'model');
        }
        if (modality) {
            addQuery(`${modality} dataset`, 4, 'dataset');
        }
    }



    const allQueries = [...new Set([...datasetQueries, ...modelQueries, ...paperQueries, ...benchmarkQueries])];

    return {
        datasetQueries,
        modelQueries,
        paperQueries,
        benchmarkQueries,
        allQueries,
        tieredQueries,
    };
}

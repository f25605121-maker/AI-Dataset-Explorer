/**
 * Requirement Extractor
 *
 * Converts a raw user query into a structured RequirementProfile.
 * Every detected requirement is classified as HARD or SOFT with a weight.
 * HARD requirements gate the final score — violations are capped.
 * SOFT requirements improve ranking but cannot independently produce a DIRECT MATCH.
 */

import {
    Requirement,
    RequirementProfile,
    RequirementCategory,
    RequirementImportance,
} from "./types";

const BASE_WEIGHTS: Record<RequirementCategory, number> = {
    DOMAIN:             0.22,
    MODALITY:           0.14,
    TASK:               0.14,
    LONGITUDINAL:       0.12,
    TARGET:             0.10,
    MULTIMODAL:         0.09,
    CLINICAL:           0.07,
    GPU:                0.05,
    COMPUTE:            0.02,
    DATA_SIZE:          0.02,
    LABEL_AVAILABILITY: 0.02,
    CLASS_IMBALANCE:    0.02,
    MISSING_DATA:       0.01,
    PRETRAINING:        0.01,
    TEMPORAL:           0.03,
    POPULATION:         0.02,
    OTHER:              0.01,
};

function extractGpuVramGb(q: string): number | null {
    const m = q.match(/(\d+)\s*[-\s]?GB\s*(VRAM|GPU|memory|RAM|card)/i);
    if (m) return parseInt(m[1], 10);
    const m2 = q.match(/limited\s+to\s+(\d+)\s*GB/i);
    if (m2) return parseInt(m2[1], 10);
    return null;
}

function extractPatientCounts(q: string): { labeled: number | null; total: number | null } {
    let labeled: number | null = null;
    let total: number | null = null;
    const mL = q.match(/(\d[\d,]*)\s*labeled\s*patients?/i);
    if (mL) labeled = parseInt(mL[1].replace(/,/g, ""), 10);
    const mT = q.match(/(\d[\d,]*)\s*(?:total\s*)?patients?/i);
    if (mT) {
        const t = parseInt(mT[1].replace(/,/g, ""), 10);
        if (!labeled || t > labeled) total = t;
    }
    return { labeled, total };
}

interface DomainSpec {
    id: string;
    description: string;
    keywords: string[];
    test: (q: string) => boolean;
    isHard: boolean;
    importance: RequirementImportance;
}

const DISEASE_DOMAINS: DomainSpec[] = [
    {
        id: "req_domain_copd",
        description: "COPD / pulmonary disease classification or prediction",
        keywords: ["copd", "chronic obstructive", "pulmonary disease", "spirometry", "fev1", "exacerbation", "emphysema"],
        test: (q) => /\bCOPD\b|chronic\s+obstructive\s+pulmonary|emphysema|spirometry|fev1\/fvc|fev1|exacerbation/i.test(q),
        isHard: true,
        importance: "CRITICAL",
    },
    {
        id: "req_domain_alzheimer",
        description: "Alzheimer's / neurodegenerative disease prediction",
        keywords: ["alzheimer", "dementia", "mci", "adni", "oasis", "apoe"],
        test: (q) => /alzheimer|dementia|mild\s*cognitive|\bmci\b|adni|oasis|apoe/i.test(q),
        isHard: true,
        importance: "CRITICAL",
    },
    {
        id: "req_domain_cardiac",
        description: "Cardiac / cardiovascular imaging",
        keywords: ["cardiac", "heart", "coronary", "cardiovascular", "aorta"],
        test: (q) => /cardiac|heart|myocard|aort|coronary|cardiovascular/i.test(q),
        isHard: true,
        importance: "CRITICAL",
    },
    {
        id: "req_domain_brain_tumor",
        description: "Brain tumor / glioma / neuro-oncology",
        keywords: ["brain tumor", "glioma", "glioblastoma", "brats"],
        test: (q) => /brain\s*tumor|glioma|glioblastoma|meningioma|\bbrats\b/i.test(q),
        isHard: true,
        importance: "CRITICAL",
    },
    {
        id: "req_domain_retinopathy",
        description: "Diabetic retinopathy / ophthalmic imaging",
        keywords: ["retinopathy", "fundus", "retina", "ophthalmology"],
        test: (q) => /retinopath|fundus|retina|ophthalm/i.test(q),
        isHard: true,
        importance: "CRITICAL",
    },
    {
        id: "req_domain_skin",
        description: "Skin lesion / melanoma / dermoscopy",
        keywords: ["skin lesion", "melanoma", "dermoscopy", "isic"],
        test: (q) => /skin\s*lesion|melanoma|dermoscop|isic/i.test(q),
        isHard: true,
        importance: "CRITICAL",
    },
    {
        id: "req_domain_seizure",
        description: "Seizure / EEG / epilepsy",
        keywords: ["seizure", "eeg", "epilepsy"],
        test: (q) => /seizure|epilepsy|\beeg\b|\bieeg\b/i.test(q),
        isHard: true,
        importance: "CRITICAL",
    },
    {
        id: "req_domain_lung_nodule",
        description: "Lung nodule / lung cancer (non-COPD)",
        keywords: ["lung nodule", "lung cancer", "pulmonary nodule"],
        test: (q) => /lung\s*nodule|lung\s*cancer|pulmonary\s*nodule/i.test(q) && !/\bCOPD\b|chronic\s+obstructive/i.test(q),
        isHard: false,
        importance: "HIGH",
    },
];

export function extractRequirementProfile(rawQuery: string): RequirementProfile {
    const q = rawQuery;
    const requirements: Requirement[] = [];
    const hardRequirementIds: string[] = [];
    const softRequirementIds: string[] = [];
    let primaryDomainKeywords: string[] = [];
    let domainDetected = false;

    // 1. Disease/domain
    for (const domain of DISEASE_DOMAINS) {
        if (domain.test(q)) {
            requirements.push({
                id: domain.id,
                description: domain.description,
                category: "DOMAIN",
                importance: domain.importance,
                isHard: domain.isHard,
                detectedValue: domain.keywords[0],
                weight: BASE_WEIGHTS.DOMAIN,
            });
            if (domain.isHard) hardRequirementIds.push(domain.id);
            else softRequirementIds.push(domain.id);
            primaryDomainKeywords = domain.keywords;
            domainDetected = true;
            break;
        }
    }

    if (!domainDetected && /medical|clinical|patient|radiology/i.test(q)) {
        requirements.push({
            id: "req_domain_medical",
            description: "Medical / clinical domain",
            category: "DOMAIN",
            importance: "HIGH",
            isHard: false,
            detectedValue: "medical/clinical",
            weight: BASE_WEIGHTS.DOMAIN * 0.6,
        });
        softRequirementIds.push("req_domain_medical");
    }

    // 2. Modality
    const modalityVals: string[] = [];
    if (/3d\s*ct|3d\s+ct|\bct\b|computed\s*tomography/i.test(q)) {
        modalityVals.push(/3d/i.test(q) ? "3D CT" : "CT");
    }
    if (/\bmri\b|magnetic\s*resonance/i.test(q)) modalityVals.push("MRI");
    if (/chest\s*x.?ray|cxr/i.test(q)) modalityVals.push("CXR");
    if (/ultrasound|echo/i.test(q)) modalityVals.push("Ultrasound");
    if (/pet\s*scan|\bpet\b.*scan/i.test(q)) modalityVals.push("PET");
    if (/dermoscop/i.test(q)) modalityVals.push("Dermoscopy");
    if (/fundus|retinal\s*photo/i.test(q)) modalityVals.push("Fundus");
    if (/\baudio\b|\bwav\b|\bspeech\b/i.test(q)) modalityVals.push("Audio");
    if (modalityVals.length > 0) {
        const isHardModality = !/tabular/i.test(modalityVals[0]);
        requirements.push({
            id: "req_modality",
            description: `Modality: ${modalityVals.join(" + ")}`,
            category: "MODALITY",
            importance: "CRITICAL",
            isHard: isHardModality,
            detectedValue: modalityVals.join(", "),
            weight: BASE_WEIGHTS.MODALITY,
        });
        if (isHardModality) hardRequirementIds.push("req_modality");
        else softRequirementIds.push("req_modality");
    }

    // 3. Tasks
    const tasks: string[] = [];
    if (/classif|diagnos|grading|severity/i.test(q)) tasks.push("classification");
    if (/segment/i.test(q)) tasks.push("segmentation");
    if (/predict|forecast|prognos/i.test(q)) tasks.push("prediction");
    if (/reconstruct/i.test(q)) tasks.push("reconstruction");
    if (/detect(?!ion\s*model)/i.test(q)) tasks.push("detection");
    if (tasks.length > 0) {
        requirements.push({
            id: "req_task",
            description: `Required tasks: ${tasks.join(", ")}`,
            category: "TASK",
            importance: "CRITICAL",
            isHard: true,
            detectedValue: tasks.join(", "),
            weight: BASE_WEIGHTS.TASK,
        });
        hardRequirementIds.push("req_task");
    }

    // 4. Longitudinal
    const isLongitudinal = /longitudinal|multi.?timepoint|follow.?up|progression|temporal\s*series|serial\s*scan|repeat\s*scan|time\s*series/i.test(q);
    if (isLongitudinal) {
        requirements.push({
            id: "req_longitudinal",
            description: "Longitudinal / multi-timepoint patient data required",
            category: "LONGITUDINAL",
            importance: "CRITICAL",
            isHard: true,
            detectedValue: "longitudinal",
            weight: BASE_WEIGHTS.LONGITUDINAL,
        });
        hardRequirementIds.push("req_longitudinal");
    }

    // 5. Multimodal
    const isMultimodal = /multimodal|multi.?modal|ct\s*\+\s*clinical|imaging\s*\+\s*clinical|tabular\s*\+|clinical\s*data.*ct|combine.*modalities/i.test(q);
    if (isMultimodal) {
        requirements.push({
            id: "req_multimodal",
            description: "Multimodal fusion: imaging + clinical/tabular required",
            category: "MULTIMODAL",
            importance: "CRITICAL",
            isHard: true,
            detectedValue: "multimodal",
            weight: BASE_WEIGHTS.MULTIMODAL,
        });
        hardRequirementIds.push("req_multimodal");
    }

    // 6. Clinical data
    const hasClinicalData = /clinical\s*data|clinical\s*features|tabular\s*data|ehr|electronic\s*health|demographics|biomarker|lab\s*values|spirometry/i.test(q);
    if (hasClinicalData) {
        requirements.push({
            id: "req_clinical",
            description: "Clinical / tabular patient data required",
            category: "CLINICAL",
            importance: "HIGH",
            isHard: false,
            detectedValue: "clinical/tabular",
            weight: BASE_WEIGHTS.CLINICAL,
        });
        softRequirementIds.push("req_clinical");
    }

    // 7. Target / outcome
    const targetPhrases: string[] = [];
    if (/exacerbation/i.test(q)) targetPhrases.push("COPD exacerbation prediction");
    const mMonth = q.match(/(\d+)[- ]?month/i);
    if (mMonth) targetPhrases.push(`${mMonth[1]}-month prediction horizon`);
    if (/severity\s*class|copd\s*severity|gold\s*stage/i.test(q)) targetPhrases.push("COPD severity grade");
    if (/progression.*alzheimer|conversion.*mci/i.test(q)) targetPhrases.push("Alzheimer progression prediction");
    if (/malignant|benign|malignancy/i.test(q)) targetPhrases.push("malignancy classification");
    if (targetPhrases.length > 0) {
        requirements.push({
            id: "req_target",
            description: `Required target: ${targetPhrases.join("; ")}`,
            category: "TARGET",
            importance: "CRITICAL",
            isHard: true,
            detectedValue: targetPhrases.join("; "),
            weight: BASE_WEIGHTS.TARGET,
        });
        hardRequirementIds.push("req_target");
    }

    // 8. GPU VRAM
    const gpuVramLimitGb = extractGpuVramGb(q);
    if (gpuVramLimitGb !== null) {
        requirements.push({
            id: "req_gpu",
            description: `Must run within ${gpuVramLimitGb} GB VRAM`,
            category: "GPU",
            importance: "HIGH",
            isHard: true,
            detectedValue: `${gpuVramLimitGb}GB`,
            weight: BASE_WEIGHTS.GPU,
        });
        hardRequirementIds.push("req_gpu");
    }

    // 9. Class imbalance
    const hasClassImbalance = /class\s*imbalance|imbalanced|rare\s*class|minority\s*class|severe\s*imbalance/i.test(q);
    if (hasClassImbalance) {
        requirements.push({
            id: "req_class_imbalance",
            description: "Dataset must handle severe class imbalance",
            category: "CLASS_IMBALANCE",
            importance: "MEDIUM",
            isHard: false,
            detectedValue: "class imbalance",
            weight: BASE_WEIGHTS.CLASS_IMBALANCE,
        });
        softRequirementIds.push("req_class_imbalance");
    }

    // 10. Missing data
    const hasMissingData = /missing\s*values?|missing\s*data|incomplete\s*data|partial\s*labels?/i.test(q);
    if (hasMissingData) {
        requirements.push({
            id: "req_missing_data",
            description: "Support for missing clinical/tabular data",
            category: "MISSING_DATA",
            importance: "MEDIUM",
            isHard: false,
            detectedValue: "missing data",
            weight: BASE_WEIGHTS.MISSING_DATA,
        });
        softRequirementIds.push("req_missing_data");
    }

    // 11. Pretraining preference
    if (/pretrained|transfer\s*learning|fine.?tun|backbone|foundation\s*model/i.test(q)) {
        requirements.push({
            id: "req_pretraining",
            description: "Pretrained model preferred",
            category: "PRETRAINING",
            importance: "LOW",
            isHard: false,
            detectedValue: "pretraining preferred",
            weight: BASE_WEIGHTS.PRETRAINING,
        });
        softRequirementIds.push("req_pretraining");
    }

    // 12. Population size
    const { labeled, total } = extractPatientCounts(q);
    if (labeled !== null || total !== null) {
        const desc = [labeled ? `${labeled} labeled` : null, total ? `${total} total` : null].filter(Boolean).join(", ");
        requirements.push({
            id: "req_population",
            description: `Study size context: ${desc} patients`,
            category: "POPULATION",
            importance: "LOW",
            isHard: false,
            detectedValue: desc,
            weight: BASE_WEIGHTS.POPULATION,
        });
        softRequirementIds.push("req_population");
    }

    // Normalize weights
    const totalW = requirements.reduce((s, r) => s + r.weight, 0);
    if (totalW > 0) for (const r of requirements) r.weight = r.weight / totalW;

    const wantsModel = /model|architecture|pretrained|backbone/i.test(q);
    const wantsDataset = /dataset|data\b|training\s*data/i.test(q);
    const queryType = wantsDataset && wantsModel ? "all" : wantsModel ? "model" : wantsDataset ? "dataset" : "all";

    return {
        requirements,
        hardRequirementIds,
        softRequirementIds,
        gpuVramLimitGb,
        isLongitudinal,
        isMultimodal,
        hasClinicalData,
        hasClassImbalance,
        hasMissingData,
        primaryDomainKeywords,
        queryType,
    };
}

const _profileCache = new Map<string, RequirementProfile>();

export function getRequirementProfile(rawQuery: string): RequirementProfile {
    const key = rawQuery.trim();
    if (_profileCache.has(key)) return _profileCache.get(key)!;
    const profile = extractRequirementProfile(key);
    _profileCache.set(key, profile);
    return profile;
}

/**
 * Query Parser — Structured Query Understanding & Entity Extraction
 *
 * Extracts semantic intent from user queries WITHOUT hallucinating missing fields.
 * Every extracted field is tagged as CONFIRMED, INFERRED, or UNKNOWN.
 *
 * Implements ExtractedQueryEntities:
 * - targetAnatomy & excludedAnatomy mapping
 * - sequenceSubtype (DCE, FLAIR, T1, T2, etc.)
 * - dimensionality (3D, 4D, 2D, any)
 * - taskType & targetModality
 * - coreSearchKeywords
 */

import { EvidenceFact, FactState, ProjectSpec, ExtractedQueryEntities } from '@/types/pipeline';
import { extractCoreSearchKeywords } from '@/server/assistant/keywordExtractor';

// ── Public types ─────────────────────────────────────────────────────────────

export type EntityType = 'dataset' | 'model' | 'architecture' | 'comparison' | 'general' | 'unknown';

export interface QueryField<T> {
    value: T | null;
    state: FactState;
    confidence: number;
    source: 'explicit' | 'inferred' | 'unknown';
    evidence?: string;
}

export interface QueryUnderstanding {
    /** Raw user query */
    rawQuery: string;
    /** What the user is looking for */
    entityType: QueryField<EntityType>;
    /** Broad domain: medical_imaging, neurology, robotics, nlp, etc. */
    domain: QueryField<string>;
    /** Narrow subdomain: epileptology, cardiovascular, manipulation, sentiment, etc. */
    subdomain: QueryField<string>;
    /** Primary ML task: seizure detection, localization, segmentation, detection, classification, imitation_learning, etc. */
    task: QueryField<string>;
    /** Specific target/anatomy/subject: seizure, coronary arteries, brain tumor, SO-101, etc. */
    target: QueryField<string>;
    /** Data modality: EEG, intracranial EEG, CT, MRI, infrared video, image, text, tabular, video, audio, robotics, etc. */
    modality: QueryField<string>;
    /** Robot/hardware/framework if relevant: SO-101, LeRobot, ROS */
    framework: QueryField<string>;
    /** Size constraint if stated */
    sizeConstraint: QueryField<string>;
    /** Language constraint if stated */
    languageConstraint: QueryField<string>;
    /** Keywords explicitly found in the query */
    explicitKeywords: string[];
    /** Secondary keywords inferred from context */
    inferredKeywords: string[];
    /** Fields the user explicitly stated (for adaptive weight boosting) */
    explicitFields: Set<string>;
    /** Whether this is a comparison query */
    isComparison: boolean;
    /** Whether the query mentions a specific dataset or model by name */
    specificEntityMentioned: string | null;
    /** Structured biomedical and task entities */
    entities: ExtractedQueryEntities;
    /** Structured search queries for APIs */
    searchQueries: string[];
    /** Diagnostic log */
    parseLog: string[];
}

// ── Domain knowledge tables ──────────────────────────────────────────────────

export const ANATOMY_GROUPS: Record<string, { terms: string[]; synonyms: string[]; conflictingGroups: string[] }> = {
    abdomen: {
        terms: [
            'abdomen', 'abdominal', 'liver', 'hepatic', 'kidney', 'renal', 'pancreas', 'pancreatic',
            'spleen', 'splenic', 'stomach', 'gastric', 'bowel', 'colon', 'colorectal', 'intestine',
            'intestinal', 'gallbladder', 'biliary', 'adrenal', 'multi-organ', 'multi organ', 'multiorgan',
            'intra-abdominal', 'peritoneal', 'visceral', 'btcv', 'chaos', 'amos', 'lits', 'kits'
        ],
        synonyms: ['abdomen', 'abdominal', 'liver', 'kidney', 'pancreas', 'spleen', 'multi-organ', 'organ'],
        conflictingGroups: ['brain', 'thorax_cardiac', 'pelvis_prostate', 'musculoskeletal', 'skin', 'eye', 'head_neck'],
    },
    brain: {
        terms: [
            'brain', 'cerebral', 'cranial', 'glioma', 'lgg', 'hgg', 'glioblastoma', 'meningioma',
            'intracranial', 'neuro', 'neurology', 'cerebellum', 'cortex', 'hippocampus', 'stroke', 'white matter',
            'gray matter', 'ventricle', 'pituitary', 'skull', 'eeg', 'ecog', 'ieeg', 'flair abnormality',
            'brats', 'isles'
        ],
        synonyms: ['brain', 'cerebral', 'cranial', 'glioma', 'neuro'],
        conflictingGroups: ['abdomen', 'thorax_cardiac', 'pelvis_prostate', 'musculoskeletal', 'skin', 'eye'],
    },
    thorax_cardiac: {
        terms: [
            'chest', 'thorax', 'thoracic', 'lung', 'pulmonary', 'pneumonia', 'covid', 'cardiac',
            'heart', 'myocardium', 'myocardial', 'coronary', 'aorta', 'aortic', 'atrium', 'rib',
            'pleural', 'cxr', 'acdc'
        ],
        synonyms: ['chest', 'lung', 'cardiac', 'heart', 'coronary', 'pulmonary'],
        conflictingGroups: ['abdomen', 'brain', 'pelvis_prostate', 'musculoskeletal', 'skin', 'eye'],
    },
    pelvis_prostate: {
        terms: [
            'prostate', 'prostatic', 'bladder', 'cervix', 'cervical', 'uterus', 'uterine',
            'ovary', 'ovarian', 'pelvis', 'pelvic', 'rectum', 'rectal', 'promise12', 'prostatex'
        ],
        synonyms: ['prostate', 'pelvis', 'bladder', 'cervix', 'uterus'],
        conflictingGroups: ['brain', 'thorax_cardiac', 'head_neck', 'eye', 'skin'],
    },
    musculoskeletal: {
        terms: [
            'bone', 'spine', 'vertebra', 'vertebral', 'spinal', 'femur', 'knee', 'hip',
            'fracture', 'joint', 'shoulder', 'wrist', 'ankle', 'tibia', 'skeleton', 'skeletal'
        ],
        synonyms: ['bone', 'spine', 'joint', 'femur', 'knee', 'hip'],
        conflictingGroups: ['brain', 'abdomen', 'thorax_cardiac', 'skin', 'eye'],
    },
    skin: {
        terms: ['skin', 'melanoma', 'dermoscopy', 'dermatology', 'cutaneous', 'dermatological', 'lesion', 'isic'],
        synonyms: ['skin', 'melanoma', 'dermoscopy', 'cutaneous'],
        conflictingGroups: ['brain', 'abdomen', 'thorax_cardiac', 'pelvis_prostate', 'musculoskeletal', 'eye'],
    },
    eye: {
        terms: ['eye', 'retina', 'retinal', 'fundus', 'optic', 'ophthalmology', 'cornea', 'macula', 'glaucoma', 'drise'],
        synonyms: ['retina', 'eye', 'fundus', 'optic disc'],
        conflictingGroups: ['abdomen', 'brain', 'thorax_cardiac', 'pelvis_prostate', 'musculoskeletal', 'skin'],
    },
    head_neck: {
        terms: ['neck', 'thyroid', 'sinus', 'larynx', 'pharynx', 'oral', 'nasopharyngeal', 'dental', 'jaw'],
        synonyms: ['thyroid', 'neck', 'sinus', 'oral'],
        conflictingGroups: ['abdomen', 'pelvis_prostate', 'musculoskeletal', 'skin', 'eye'],
    },
};

/** Medical imaging and clinical sub-domain keywords → subdomain label */
const CLINICAL_SUBDOMAINS: [RegExp, string][] = [
    [/seizure|epilep|intracranial\s*eeg|ieeg|ecog|onset\s*zone/i, 'epileptology'],
    [/coronary\s*art(?:ery|eries)/i, 'cardiovascular'],
    [/cardiac|heart\s*(?:vessel|chamber|wall|muscle|mri|ct)/i, 'cardiovascular'],
    [/brain\s*tumor|glioma|glioblastoma|meningioma/i, 'neuro-oncology'],
    [/brain|cerebral|neuro(?:imaging)?/i, 'neurology'],
    [/abdomen|abdominal|liver|kidney|pancrea|spleen|multi.?organ/i, 'abdominal radiology'],
    [/chest\s*x.?ray|lung|pulmonary|pneumonia|covid/i, 'pulmonology'],
    [/retina|fundus|optic\s*disc|diabetic\s*retinopathy/i, 'ophthalmology'],
    [/skin\s*(?:lesion|cancer|disease|derm)|melanoma|dermoscop/i, 'dermatology'],
    [/histopathol|pathol|tissue|biopsy/i, 'histopathology'],
    [/ultrasound|echocardiograph/i, 'ultrasonography'],
    [/angiograph|vessel\s*segment/i, 'vascular'],
    [/bone|fracture|joint|spine/i, 'musculoskeletal'],
    [/colonoscopy|polyp|gastro/i, 'gastroenterology'],
];

/** Modality detection patterns → canonical modality label */
const MODALITY_PATTERNS: [RegExp, string][] = [
    [/cryo[- ]?e[mt]|cryo[- ]?electron|electron\s*tomograph|subtomogram|macromolecule\s*structural/i, 'Cryo-EM/ET'],
    [/fluorescen|confocal|immunofluorescen|gfp\b/i, 'Fluorescence'],
    [/genom|transcriptom|rna[- ]?seq|single[- ]?cell/i, 'Genomics/Tabular'],
    [/intracranial\s*eeg|ieeg|ecog/i, 'intracranial EEG'],
    [/\beeg\b|electroencephalog/i, 'EEG'],
    [/\becg\b|\bekg\b|electrocardiog/i, 'ECG'],
    [/infrared\s*video|thermal\s*video|infrared/i, 'infrared video'],
    [/multimodal|multi.?modal/i, 'multimodal'],
    [/\bCTA?\b|coronary\s*CT|cardiac\s*CT|computed\s*tomograph/i, 'CT'],
    [/\bMRI\b|\bfmri\b|magnetic\s*resonance/i, 'MRI'],
    [/\bX.?ray\b|radiograph/i, 'X-ray'],
    [/\bPET\b\s*(?:scan|image|CT)?/i, 'PET'],
    [/ultrasound|echocardio/i, 'ultrasound'],
    [/angiograph/i, 'angiography'],
    [/fundus|ophthalmoscopy|retinal\s*image/i, 'fundus photography'],
    [/dermoscop/i, 'dermoscopy'],
    [/(?:medical\s*)?image|scan|radiolog/i, 'medical imaging'],
    [/video|cctv|video\s*stream/i, 'video'],
    [/audio|speech|wav\b/i, 'audio'],
    [/tabular|csv|spreadsheet|structured\s*data/i, 'tabular'],
    [/text|nlp|natural\s*language|document/i, 'text'],
    [/point\s*cloud|3D\s*(?:scan|model)|lidar/i, '3D'],
    [/robo(?:t|tics)|manipulation|teleoperat/i, 'robotics'],
    [/time.?series|temporal\s*data|sensor\s*data/i, 'time-series'],
    [/image|photo|picture|visual/i, 'image'],
];

/** Task detection patterns → canonical task label */
const TASK_PATTERNS: [RegExp, string][] = [
    [/velocity\s*(?:field\s*)?reconstruction/i, 'velocity reconstruction'],
    [/velocity\s*estimation|wall\s*shear\s*stress|shear\s*stress\s*estimation|flow\s*estimation/i, 'velocity_estimation'],
    [/reconstruction|reconstruct|k-space/i, 'reconstruction'],
    [/registration|spatial\s*alignment/i, 'registration'],
    [/seizure\s*detect(?:ion)?/i, 'seizure detection'],
    [/onset\s*zone\s*localiz(?:ation)?|zone\s*localiz(?:ation)?/i, 'onset zone localization'],
    [/multi.?organ\s*segment(?:ation)?/i, 'multi-organ segmentation'],
    [/tumor\s*segment(?:ation)?/i, 'tumor segmentation'],
    [/localiz(?:ation)?/i, 'localization'],
    [/segment(?:ation)?/i, 'segmentation'],
    [/detect(?:ion)?/i, 'detection'],
    [/classif(?:y|ication)/i, 'classification'],
    [/imitation\s*learning|behavior\s*clon/i, 'imitation learning'],
    [/object\s*detect/i, 'object detection'],
    [/instance\s*segment/i, 'instance segmentation'],
    [/semantic\s*segment/i, 'semantic segmentation'],
    [/track(?:ing)?/i, 'tracking'],
    [/forecast(?:ing)?|predict/i, 'forecasting'],
    [/generat(?:ion|e)/i, 'generation'],
    [/recogni(?:ze|tion)/i, 'recognition'],
    [/anomaly\s*detect/i, 'anomaly detection'],
    [/regression/i, 'regression'],
    [/translat(?:e|ion)/i, 'translation'],
    [/summar(?:ize|ization)/i, 'summarization'],
    [/question\s*answer/i, 'question answering'],
    [/manipulation\s*task|pick|place|grasp|sort|clean|throw/i, 'robotic manipulation'],
    [/vision.?language.?action|VLA/i, 'vision-language-action'],
    [/multimodal\s*fusion|fusion/i, 'multimodal fusion'],
];

/** Domain detection patterns → canonical domain label */
const DOMAIN_PATTERNS: [RegExp, string][] = [
    [/cryo[- ]?e[mt]|electron\s*tomograph|subtomogram|macromolecule|structural\s*biology|fluorescen|microscop/i, 'Structural Biology & Microscopy'],
    [/seizure|epilep|intracranial|eeg|ecog|neurolog|neurosci/i, 'neurology'],
    [/coronary|cardiac|cardiovascular|heart\s*(?:disease|failure|attack)|ecg|ekg/i, 'medical imaging'],
    [/abdomen|abdominal|liver|kidney|pancrea|spleen|multi.?organ/i, 'medical imaging'],
    [/medical|clinical|hospital|patient|diagnosis|disease|patholog|radiol|mri\b|ct\s*scan/i, 'medical imaging'],
    [/brain|tumor|cancer|lesion|tumor/i, 'medical imaging'],
    [/robot(?:ic)?|manipulat|teleoperat|so.?101|lerobot|arm/i, 'robotics'],
    [/nlp|natural\s*language|text\s*classif|sentiment|review|document/i, 'natural language processing'],
    [/speech|audio|sound|voice\s*recogn/i, 'audio processing'],
    [/autonomous\s*driving|self.?driving|lane|vehicle\s*detect/i, 'autonomous driving'],
    [/satellite|remote\s*sensing|aerial|geo/i, 'remote sensing'],
    [/agriculture|crop|plant\s*disease|farm/i, 'agriculture'],
    [/finance|stock|credit|fraud|bank/i, 'finance'],
    [/manufacturing|defect|quality\s*control|industrial/i, 'manufacturing'],
    [/recommendation|collaborative\s*filter/i, 'recommendation systems'],
];

/** Known specific entity names → extract as specificEntityMentioned */
const KNOWN_ENTITIES: [RegExp, string][] = [
    [/Project.?IRA/i, 'Project-IRA'],
    [/SO.?101/i, 'SO-101'],
    [/LeRobot/i, 'LeRobot'],
    [/SmolVLA/i, 'SmolVLA'],
    [/Pi0(?:\.5)?/i, 'Pi0.5'],
    [/GPT.?4/i, 'GPT-4'],
    [/LLaMA\s*\d/i, 'LLaMA'],
    [/BERT/i, 'BERT'],
    [/SegFormer/i, 'SegFormer'],
    [/YOLOv?\d/i, 'YOLO'],
    [/CHAOS/i, 'CHAOS'],
    [/AMOS/i, 'AMOS'],
    [/BTCV/i, 'BTCV'],
    [/BraTS/i, 'BraTS'],
    [/LiTS/i, 'LiTS'],
    [/KiTS/i, 'KiTS'],
];

// ── Field extraction helpers ─────────────────────────────────────────────────

function makeField<T>(
    value: T | null,
    state: FactState,
    confidence: number,
    source: 'explicit' | 'inferred' | 'unknown',
    evidence?: string
): QueryField<T> {
    return { value, state, confidence, source, evidence };
}

function unknownField<T>(): QueryField<T> {
    return { value: null, state: 'UNKNOWN', confidence: 0, source: 'unknown' };
}

function matchFirst<T>(
    text: string,
    patterns: [RegExp, T][],
    sourceIfMatch: 'explicit' | 'inferred' = 'explicit'
): QueryField<T> | null {
    for (const [pattern, label] of patterns) {
        const m = text.match(pattern);
        if (m) {
            return makeField(label, 'CONFIRMED', 0.9, sourceIfMatch, `Matched: "${m[0]}"`);
        }
    }
    return null;
}

// ── Target / anatomy / subject extraction ────────────────────────────────────

const TARGET_PATTERNS: [RegExp, string][] = [
    [/4d\s*flow\s*cardiac|4d\s*flow/i, '4D flow cardiac'],
    [/cardiac\s*velocity\s*field|velocity\s*field/i, 'velocity field'],
    [/wall\s*shear\s*stress|shear\s*stress/i, 'wall shear stress'],
    [/cardiac|heart\s*(?:muscle|chamber|ventricle|tissue)/i, 'cardiac'],
    [/seizure\s*onset\s*zone|onset\s*zone/i, 'seizure onset zone'],
    [/seizure|epilep/i, 'seizure'],
    [/intracranial\s*eeg|ieeg/i, 'intracranial EEG'],
    [/multi.?organ\s*abdomen|abdominal\s*tumor|abdomen|abdominal/i, 'abdominal organs'],
    [/coronary\s*art(?:ery|eries)/i, 'coronary arteries'],
    [/coronary\s*vessel/i, 'coronary vessels'],
    [/brain\s*tumor/i, 'brain tumor'],
    [/glioma/i, 'glioma'],
    [/lung\s*(?:cancer|nodule|tumor)/i, 'lung cancer'],
    [/skin\s*(?:lesion|cancer|melanoma)/i, 'skin lesion'],
    [/retinal\s*(?:vessel|disease|image)/i, 'retinal'],
    [/diabetic\s*retinopathy/i, 'diabetic retinopathy'],
    [/polyp/i, 'polyp'],
    [/liver\s*(?:tumor|lesion|segment)?/i, 'liver'],
    [/kidney\s*(?:stone|tumor|segment)?/i, 'kidney'],
    [/pancrea(?:s|tic)\s*(?:tumor|lesion|segment)?/i, 'pancreas'],
    [/spleen/i, 'spleen'],
    [/aorta/i, 'aorta'],
    [/prostate/i, 'prostate'],
    [/bone\s*(?:fracture|tumor)/i, 'bone'],
    [/SO.?101/i, 'SO-101 robot'],
    [/robotic\s*arm/i, 'robotic arm'],
    [/lego\s*sort|desk\s*clean|dice\s*throw|fetch\s*ball/i, 'manipulation tasks'],
];

// ── Size constraint extraction ────────────────────────────────────────────────

function extractSizeConstraint(query: string): QueryField<string> | null {
    const m = query.match(/under\s*([\d.]+)\s*(GB|MB|TB)/i)
        || query.match(/([\d.]+)\s*(GB|MB|TB)\s*(?:or\s*(?:less|smaller|under))/i)
        || query.match(/(?:smaller|less)\s*than\s*([\d.]+)\s*(GB|MB|TB)/i)
        || query.match(/small\s*dataset/i);
    if (m) {
        const val = m[0];
        return makeField(val.trim(), 'CONFIRMED', 0.95, 'explicit', `Size constraint: "${val}"`);
    }
    return null;
}

// ── Language constraint extraction ───────────────────────────────────────────

function extractLanguageConstraint(query: string): QueryField<string> | null {
    const m = query.match(/\b(English|French|German|Spanish|Chinese|Arabic|Mandarin|Hindi|Japanese|Korean|Portuguese)\b/i);
    if (m) {
        return makeField(m[1], 'CONFIRMED', 0.95, 'explicit', `Language: "${m[1]}"`);
    }
    return null;
}

// ── Keyword extraction ────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
    'i', 'want', 'to', 'find', 'a', 'an', 'the', 'dataset', 'datasets', 'on',
    'for', 'about', 'with', 'using', 'that', 'this', 'my', 'me', 'can', 'please',
    'need', 'looking', 'get', 'use', 'build', 'create', 'make', 'train', 'model',
    'data', 'some', 'good', 'best', 'related', 'is', 'are', 'it', 'what', 'which',
    'how', 'show', 'me', 'give', 'search', 'look', 'have', 'has', 'been', 'from',
    'in', 'of', 'at', 'by', 'or', 'and', 'do', 'does', 'will', 'should', 'would',
    'could', 'we', 'our', 'any', 'all', 'only',
]);

function extractKeywords(query: string): string[] {
    return query
        .toLowerCase()
        .replace(/[^a-z0-9\s\-_]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// ── Comparison detection ──────────────────────────────────────────────────────

function isComparisonQuery(query: string): boolean {
    return /\bcompare\b|\bvs\.?\b|\bversus\b|\bor\s+(?:the\s+)?(?:[A-Z][a-zA-Z]+)/i.test(query);
}

// ── Entity type detection ─────────────────────────────────────────────────────

function detectEntityType(query: string, intent: string): QueryField<EntityType> {
    const q = query.toLowerCase();
    const i = intent?.toLowerCase() || '';

    if (i.includes('architecture_analysis')) return makeField('architecture', 'CONFIRMED', 0.95, 'explicit');
    if (i.includes('model_search') || i.includes('model_analysis') || i.includes('model_comparison')) return makeField('model', 'CONFIRMED', 0.95, 'explicit');
    if (i.includes('dataset_search') || i.includes('dataset_analysis') || i.includes('dataset_comparison')) return makeField('dataset', 'CONFIRMED', 0.95, 'explicit');
    if (i.includes('comparison') || i.includes('dataset_model_matching')) return makeField('comparison', 'CONFIRMED', 0.9, 'explicit');
    if (i.includes('general_ai') || i.includes('explain_concept')) return makeField('general', 'CONFIRMED', 0.95, 'explicit');

    // Fallback: rule-based
    if (/\b(?:find|search|show|list|get)\s+(?:me\s+)?(?:a\s+)?(?:good\s+)?(?:dataset|data|training\s+data)/i.test(query)) {
        return makeField('dataset', 'CONFIRMED', 0.9, 'explicit', 'User asked for dataset explicitly');
    }
    if (/\b(?:what|which|find|recommend)\s+(?:model|architecture|network)\b/i.test(query)) {
        return makeField('model', 'CONFIRMED', 0.9, 'explicit', 'User asked for model explicitly');
    }
    if (/\barchitecture\b/i.test(query) && !/dataset/i.test(query)) {
        return makeField('architecture', 'INFERRED', 0.75, 'inferred');
    }
    if (/\bmodel\b/i.test(query) && !/dataset/i.test(query)) {
        return makeField('model', 'INFERRED', 0.7, 'inferred');
    }
    if (/\b(?:dataset|data)\b/i.test(q)) {
        return makeField('dataset', 'INFERRED', 0.8, 'inferred');
    }

    return makeField('dataset', 'INFERRED', 0.8, 'inferred', 'Assumed dataset & asset discovery for ML problem');
}

// ── Structured Query Entity Extraction ─────────────────────────────────────────

export function extractQueryEntities(rawQuery: string): ExtractedQueryEntities {
    const q = rawQuery.toLowerCase();

    // 1. Target anatomy & conflicting excluded anatomy
    const targetAnatomy: string[] = [];
    const excludedAnatomy: string[] = [];

    let matchedGroupKey: string | null = null;
    for (const [groupKey, group] of Object.entries(ANATOMY_GROUPS)) {
        const found = group.terms.filter(term => {
            const regex = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
            return regex.test(q);
        });
        if (found.length > 0) {
            matchedGroupKey = groupKey;
            targetAnatomy.push(...found);
            // Also include canonical synonyms
            for (const syn of group.synonyms) {
                if (!targetAnatomy.includes(syn)) targetAnatomy.push(syn);
            }
            // Populate excluded anatomy from conflicting groups
            for (const conflictKey of group.conflictingGroups) {
                const conflictGroup = ANATOMY_GROUPS[conflictKey];
                if (conflictGroup) {
                    for (const term of conflictGroup.terms.slice(0, 6)) {
                        if (!excludedAnatomy.includes(term)) excludedAnatomy.push(term);
                    }
                }
            }
            break; // Primary anatomical region found
        }
    }

    // 2. Modality
    let targetModality = 'any';
    if (/cryo[- ]?e[mt]|cryo[- ]?electron|electron\s*tomograph|subtomogram|macromolecule\s*structural/i.test(q)) targetModality = 'Cryo-EM/ET';
    else if (/fluorescen|confocal|immunofluorescen|gfp\b/i.test(q)) targetModality = 'Fluorescence';
    else if (/genom|transcriptom|rna[- ]?seq|single[- ]?cell/i.test(q)) targetModality = 'Genomics/Tabular';
    else if (/intracranial\s*eeg|ieeg|ecog/i.test(q)) targetModality = 'intracranial EEG';
    else if (/\beeg\b/i.test(q)) targetModality = 'EEG';
    else if (/\becg\b|\bekg\b/i.test(q)) targetModality = 'ECG';
    else if (/\bmri\b|\bfmri\b|magnetic\s*resonance/i.test(q)) targetModality = 'MRI';
    else if (/\bct\b|\bcta\b|computed\s*tomograph/i.test(q)) targetModality = 'CT';
    else if (/\bx.?ray\b|radiograph|\bcxr\b/i.test(q)) targetModality = 'X-ray';
    else if (/ultrasound|echocardio/i.test(q)) targetModality = 'Ultrasound';
    else if (/pet\s*scan|\bpet\b/i.test(q)) targetModality = 'PET';
    else if (/dermoscop/i.test(q)) targetModality = 'Dermoscopy';
    else if (/fundus|retinal\s*image/i.test(q)) targetModality = 'Fundus';
    else if (/histopathol|biopsy/i.test(q)) targetModality = 'Histopathology';
    else if (/infrared/i.test(q)) targetModality = 'Infrared';
    else if (/video/i.test(q)) targetModality = 'Video';
    else if (/audio|speech/i.test(q)) targetModality = 'Audio';
    else if (/tabular|csv/i.test(q)) targetModality = 'Tabular';
    else if (/text|nlp/i.test(q)) targetModality = 'Text';

    // 3. Sequence subtype
    let sequenceSubtype: string | undefined;
    if (/4d\s*flow|phase\s*contrast|pc.?mri/i.test(q)) sequenceSubtype = '4D Flow';
    else if (/dce|dynamic\s*contrast|contrast.?enhanced|gadolinium/i.test(q)) sequenceSubtype = 'DCE';
    else if (/flair/i.test(q)) sequenceSubtype = 'FLAIR';
    else if (/\bt1w?\b|t1.?weighted/i.test(q)) sequenceSubtype = 'T1';
    else if (/\bt2w?\b|t2.?weighted/i.test(q)) sequenceSubtype = 'T2';
    else if (/dwi|diffusion.?weighted|adc/i.test(q)) sequenceSubtype = 'DWI';
    else if (/cta|coronary\s*cta|angiograph/i.test(q)) sequenceSubtype = 'CTA';
    else if (/fmri|bold/i.test(q)) sequenceSubtype = 'fMRI';

    // 4. Task type
    let taskType = 'discovery';
    if (/velocity\s*(?:field\s*)?reconstruction/i.test(q)) taskType = 'reconstruction';
    else if (/wall\s*shear\s*stress|shear\s*stress\s*estimation|velocity\s*estimation|flow\s*estimation/i.test(q)) taskType = 'velocity_estimation';
    else if (/k-space|radial\s*undersampling|reconstruction|reconstruct|sparse.*recon|super.?resolution/i.test(q)) taskType = 'reconstruction';
    else if (/registration|spatial\s*align|deformable\s*reg/i.test(q)) taskType = 'registration';
    else if (/multi.?organ\s*segment(?:ation)?/i.test(q)) taskType = 'multi-organ segmentation';
    else if (/instance\s*segment(?:ation)?/i.test(q)) taskType = 'instance segmentation';
    else if (/semantic\s*segment(?:ation)?/i.test(q)) taskType = 'semantic segmentation';
    else if (/segment(?:ation)?/i.test(q)) taskType = 'segmentation';
    else if (/object\s*detect(?:ion)?/i.test(q)) taskType = 'object detection';
    else if (/detect(?:ion)?/i.test(q)) taskType = 'detection';
    else if (/classif(?:y|ication)?/i.test(q)) taskType = 'classification';
    else if (/localiz(?:ation)?/i.test(q)) taskType = 'localization';
    else if (/tracking/i.test(q)) taskType = 'tracking';
    else if (/imitation\s*learning|behavior\s*clon/i.test(q)) taskType = 'imitation learning';

    // 5. Dimensionality
    let dimensionality: '2D' | '3D' | '4D' | 'any' = 'any';
    if (/\b4d\b|\b4-d\b|dynamic\s*contrast|spatiotemporal/i.test(q)) dimensionality = '4D';
    if (/\b3d\b|\b3-d\b|3\s*dimensional|volumetric|volume\b|voxel/i.test(q)) dimensionality = '3D'; // 3D takes precedence if specified
    else if (/\b2d\b|\b2-d\b|2\s*dimensional|slice\b|planar|patch/i.test(q)) dimensionality = '2D';

    // 6. Core search keywords (targeted, anti-dilution)
    const coreSearchKeywords: string[] = [];
    const anatomyTerm = targetAnatomy[0] || '';
    const dimTerm = dimensionality === '3D' || dimensionality === '4D' ? `${dimensionality} ` : '';
    const seqTerm = sequenceSubtype ? `${sequenceSubtype} ` : '';

    if (anatomyTerm && taskType !== 'discovery' && targetModality !== 'any') {
        coreSearchKeywords.push(`${dimTerm}${anatomyTerm} ${targetModality} ${taskType}`.trim());
        coreSearchKeywords.push(`${anatomyTerm} ${targetModality} ${taskType}`.trim());
        if (sequenceSubtype) {
            coreSearchKeywords.push(`${dimTerm}${seqTerm}${anatomyTerm} ${targetModality}`.trim());
            coreSearchKeywords.push(`${seqTerm}${anatomyTerm} ${targetModality}`.trim());
        }
        if (/4d\s*flow/i.test(q) && /velocity/i.test(q)) {
            coreSearchKeywords.push(`4D flow cardiac MRI velocity reconstruction`);
        }
        if (/wall\s*shear\s*stress|shear\s*stress/i.test(q)) {
            coreSearchKeywords.push(`cardiac wall shear stress MRI`);
        }
        if (/k-space/i.test(q)) {
            coreSearchKeywords.push(`k-space cardiac MRI reconstruction`);
        }
        if (q.includes('tumor')) {
            coreSearchKeywords.push(`${dimTerm}${anatomyTerm} tumor ${targetModality}`.trim());
        }
    } else if (anatomyTerm && targetModality !== 'any') {
        coreSearchKeywords.push(`${dimTerm}${anatomyTerm} ${targetModality}`.trim());
        coreSearchKeywords.push(`${anatomyTerm} ${targetModality}`.trim());
    } else if (anatomyTerm && taskType !== 'discovery') {
        coreSearchKeywords.push(`${dimTerm}${anatomyTerm} ${taskType}`.trim());
    }

    return {
        targetAnatomy: [...new Set(targetAnatomy)],
        excludedAnatomy: [...new Set(excludedAnatomy)],
        targetModality,
        sequenceSubtype,
        taskType,
        dimensionality,
        coreSearchKeywords: [...new Set(coreSearchKeywords)],
    };
}

// ── Main parser ───────────────────────────────────────────────────────────────

/**
 * Parse a user query into a structured QueryUnderstanding object.
 *
 * @param rawQuery   The user's raw search query
 * @param intent     Optional: intent string already classified (e.g. "DATASET_SEARCH")
 */
export function parseQuery(rawQuery: string, intent?: string): QueryUnderstanding {
    const log: string[] = [];
    const explicitFields = new Set<string>();
    const q = rawQuery.trim();

    log.push(`Parsing: "${q.slice(0, 80)}"`);

    // ── Entity extraction ──────────────────────────────────────────────────
    const entities = extractQueryEntities(q);
    log.push(`Entities: anatomy=${JSON.stringify(entities.targetAnatomy)}, dim=${entities.dimensionality}, modality=${entities.targetModality}`);

    // ── Entity type ────────────────────────────────────────────────────────
    const entityType = detectEntityType(q, intent || '');
    if (entityType.state === 'CONFIRMED' && entityType.source === 'explicit') {
        explicitFields.add('entityType');
    }

    // ── Domain ────────────────────────────────────────────────────────────
    let domain = matchFirst(q, DOMAIN_PATTERNS);
    if (!domain) domain = unknownField<string>();
    else if (domain.state === 'CONFIRMED') explicitFields.add('domain');
    log.push(`Domain: ${domain.value ?? 'UNKNOWN'} (${domain.state})`);

    // ── Subdomain ─────────────────────────────────────────────────────────
    let subdomain: QueryField<string> = unknownField<string>();
    if (domain.value === 'medical imaging' || domain.value === 'neurology') {
        const sub = matchFirst(q, CLINICAL_SUBDOMAINS);
        if (sub) { subdomain = sub; explicitFields.add('subdomain'); }
    }
    log.push(`Subdomain: ${subdomain.value ?? 'UNKNOWN'} (${subdomain.state})`);

    // ── Task ──────────────────────────────────────────────────────────────
    let task = matchFirst(q, TASK_PATTERNS);
    if (!task) task = unknownField<string>();
    else { explicitFields.add('task'); }
    log.push(`Task: ${task.value ?? 'UNKNOWN'} (${task.state})`);

    // ── Target / anatomy ──────────────────────────────────────────────────
    let target = matchFirst(q, TARGET_PATTERNS);
    if (!target) target = unknownField<string>();
    else { explicitFields.add('target'); }
    log.push(`Target: ${target.value ?? 'UNKNOWN'} (${target.state})`);

    // ── Modality ──────────────────────────────────────────────────────────
    let modality = matchFirst(q, MODALITY_PATTERNS);
    if (!modality) modality = unknownField<string>();
    else { explicitFields.add('modality'); }
    log.push(`Modality: ${modality.value ?? 'UNKNOWN'} (${modality.state})`);

    // ── Framework / hardware ──────────────────────────────────────────────
    const frameworkMatch = q.match(/\b(LeRobot|ROS2?|PyTorch|TensorFlow|JAX|ONNX|Hugging\s*Face)\b/i);
    let framework: QueryField<string> = unknownField<string>();
    if (frameworkMatch) {
        framework = makeField(frameworkMatch[1], 'CONFIRMED', 0.9, 'explicit', `Matched: "${frameworkMatch[1]}"`);
        explicitFields.add('framework');
    }

    // ── Size constraint ───────────────────────────────────────────────────
    const sizeConstraint = extractSizeConstraint(q) ?? unknownField<string>();
    if (sizeConstraint.state === 'CONFIRMED') explicitFields.add('sizeConstraint');

    // ── Language constraint ───────────────────────────────────────────────
    const languageConstraint = extractLanguageConstraint(q) ?? unknownField<string>();
    if (languageConstraint.state === 'CONFIRMED') explicitFields.add('language');

    // ── Specific entity ───────────────────────────────────────────────────
    let specificEntityMentioned: string | null = null;
    for (const [pattern, name] of KNOWN_ENTITIES) {
        if (pattern.test(q)) { specificEntityMentioned = name; break; }
    }
    if (specificEntityMentioned) log.push(`Specific entity: ${specificEntityMentioned}`);

    // ── Keywords ──────────────────────────────────────────────────────────
    const explicitKeywords = extractKeywords(q);

    // Inferred keywords: synonyms/variants for confirmed target/modality/task
    const inferredKeywords: string[] = [];
    if (target.value) {
        if (/seizure/i.test(target.value)) {
            inferredKeywords.push('seizure detection', 'epilepsy', 'intracranial EEG', 'seizure onset');
        }
        if (/coronary/i.test(target.value)) {
            inferredKeywords.push('coronary vessel', 'coronary artery', 'coronary segmentation', 'coronary CTA');
        }
        if (/brain\s*tumor/i.test(target.value)) {
            inferredKeywords.push('glioma', 'brain MRI', 'tumor segmentation');
        }
        if (/abdomen|abdominal/i.test(target.value)) {
            inferredKeywords.push('abdominal MRI', 'multi-organ segmentation', 'liver tumor', 'kidney segmentation');
        }
        if (/cardiac|4d\s*flow|velocity/i.test(target.value)) {
            inferredKeywords.push('cardiac MRI', '4D flow MRI', 'velocity field reconstruction', 'wall shear stress');
        }
    }
    if (modality.value === 'CT') {
        inferredKeywords.push('computed tomography', 'CTA', 'cardiac CT');
    } else if (modality.value === 'MRI') {
        inferredKeywords.push('magnetic resonance', 'MR image');
    } else if (modality.value === 'EEG' || modality.value === 'intracranial EEG') {
        inferredKeywords.push('electroencephalography', 'iEEG', 'time-series EEG');
    } else if (modality.value === 'infrared video') {
        inferredKeywords.push('thermal video', 'video EEG');
    }

    // ── Build API search queries ──────────────────────────────────────────
    const searchQueries = buildSearchQueries(q, target, task, modality, domain, subdomain, specificEntityMentioned, explicitKeywords, entities);
    log.push(`Search queries: ${JSON.stringify(searchQueries)}`);

    // ── Comparison detection ──────────────────────────────────────────────
    const isComparison = isComparisonQuery(q);

    return {
        rawQuery: q,
        entityType,
        domain,
        subdomain,
        task,
        target,
        modality,
        framework,
        sizeConstraint,
        languageConstraint,
        explicitKeywords,
        inferredKeywords,
        explicitFields,
        isComparison,
        specificEntityMentioned,
        entities,
        searchQueries,
        parseLog: log,
    };
}

// ── Search query construction ─────────────────────────────────────────────────

function buildSearchQueries(
    rawQuery: string,
    target: QueryField<string>,
    task: QueryField<string>,
    modality: QueryField<string>,
    domain: QueryField<string>,
    subdomain: QueryField<string>,
    specificEntity: string | null,
    keywords: string[],
    entities: ExtractedQueryEntities
): string[] {
    const queries: string[] = [];

    // Priority 1: specific entity name
    if (specificEntity) {
        queries.push(specificEntity);
    }

    // Priority 1b: Relaxed queries for Cryo-EM/ET structural biology
    if (rawQuery.toLowerCase().includes('cryo') || rawQuery.toLowerCase().includes('tomography')) {
        queries.push('cryo-et', 'cryo-em', 'electron tomography', 'macromolecule structural', 'subtomogram');
    }

    // Priority 2: Core search keywords from structured entity extraction
    if (entities.coreSearchKeywords.length > 0) {
        for (const csk of entities.coreSearchKeywords) {
            queries.push(csk);
        }
    }

    // Priority 3: Sub-string keyword extractor (handles complex 20-word queries)
    const extracted = extractCoreSearchKeywords(rawQuery);
    if (extracted.primaryQuery && !queries.includes(extracted.primaryQuery)) queries.push(extracted.primaryQuery);
    if (extracted.secondaryQuery && extracted.secondaryQuery !== extracted.primaryQuery && !queries.includes(extracted.secondaryQuery)) {
        queries.push(extracted.secondaryQuery);
    }
    if (extracted.tertiaryQuery && !queries.includes(extracted.tertiaryQuery)) {
        queries.push(extracted.tertiaryQuery);
    }

    // Priority 4: target + task + modality (most specific)
    const parts: string[] = [];
    if (target.value) parts.push(target.value);
    if (task.value && (!target.value || (!target.value.toLowerCase().includes(task.value.toLowerCase()) && !task.value.toLowerCase().includes(target.value.toLowerCase())))) {
        parts.push(task.value);
    }
    if (modality.value && modality.value !== 'image' && (!target.value || !target.value.toLowerCase().includes(modality.value.toLowerCase()))) {
        parts.push(modality.value);
    }

    if (parts.length >= 2) {
        queries.push(parts.join(' '));
    }

    // Priority 5: target + task
    if (target.value && task.value) {
        const merged = task.value.toLowerCase().includes(target.value.toLowerCase())
            ? task.value
            : target.value.toLowerCase().includes(task.value.toLowerCase())
            ? target.value
            : `${target.value} ${task.value}`;
        if (!queries.includes(merged)) queries.push(merged);
    }

    // Priority 6: target + modality
    if (target.value && modality.value && !target.value.toLowerCase().includes(modality.value.toLowerCase())) {
        const tm = `${target.value} ${modality.value}`;
        if (!queries.includes(tm)) queries.push(tm);
    }

    // Deduplicate and limit to concise queries (< 7 words each)
    const cleaned = queries
        .map(q => q.trim())
        .filter(q => q.length > 2 && q.split(/\s+/).length <= 6);

    return [...new Set(cleaned)].slice(0, 6);
}

// ── Diagnostics helper ─────────────────────────────────────────────────────────

export function formatQueryUnderstanding(qu: QueryUnderstanding): Record<string, unknown> {
    return {
        intent: qu.entityType.value,
        domain: qu.domain.value ?? 'Unknown',
        domain_state: qu.domain.state,
        subdomain: qu.subdomain.value ?? 'Unknown',
        subdomain_state: qu.subdomain.state,
        task: qu.task.value ?? 'Unknown',
        task_state: qu.task.state,
        target: qu.target.value ?? 'Unknown',
        target_state: qu.target.state,
        modality: qu.modality.value ?? 'Unknown',
        modality_state: qu.modality.state,
        framework: qu.framework.value ?? 'Unknown',
        explicit_fields: [...qu.explicitFields],
        specific_entity: qu.specificEntityMentioned,
        is_comparison: qu.isComparison,
        entities: qu.entities,
        search_queries: qu.searchQueries,
        explicit_keywords: qu.explicitKeywords,
        inferred_keywords: qu.inferredKeywords,
        parse_log: qu.parseLog,
    };
}

// ── Convert to legacy ProjectSpec (for backward-compat with existing enrichment) ─

export function queryUnderstandingToProjectSpec(qu: QueryUnderstanding): ProjectSpec {
    const modalityVal = qu.modality.value;
    const legacyModality =
        modalityVal === 'Cryo-EM/ET' ? 'Microscopy / Cryo-EM/ET' :
        modalityVal === 'Fluorescence' ? 'Microscopy / Fluorescence' :
        modalityVal === 'Genomics/Tabular' ? 'Genomics / Tabular' :
        modalityVal === 'CT' ? 'Medical Imaging / CT' :
        modalityVal === 'MRI' ? 'Medical Imaging / MRI' :
        modalityVal === 'X-ray' ? 'Medical Imaging / X-ray' :
        modalityVal === 'EEG' || modalityVal === 'intracranial EEG' ? 'EEG / Electrophysiology' :
        modalityVal === 'infrared video' ? 'Video / Infrared' :
        modalityVal === 'multimodal' ? 'Multimodal' :
        modalityVal === 'robotics' ? 'Robotics' :
        modalityVal === 'tabular' ? 'Tabular' :
        modalityVal === 'text' ? 'Text' :
        modalityVal === 'audio' ? 'Audio' :
        modalityVal === 'video' ? 'Video' :
        modalityVal ?? 'Unknown';

    return {
        intent: qu.entityType.value ?? 'dataset',
        entity_type: qu.entityType.value ?? 'unknown',
        domain: qu.domain.value ?? '',
        subdomain: qu.subdomain.value ?? '',
        task: qu.task.value ?? '',
        target: qu.target.value ?? '',
        modality: legacyModality,
        preferred_sources: [],
        constraints: {},
        keywords: [...qu.explicitKeywords, ...qu.inferredKeywords],
        entities: qu.entities,

        // Legacy
        data_modality: legacyModality,
        input_type: modalityVal ?? 'Unknown',
        target_labels: qu.target.value ? [qu.target.value] : [],
        primary_architecture: 'Unknown',
        alternative_architectures: [],
        architecture_reasoning: '',
        explicit_facts: qu.explicitKeywords,
        inferred_facts: qu.inferredKeywords,
        unknown_facts: [
            ...(qu.task.state === 'UNKNOWN' ? ['task'] : []),
            ...(qu.modality.state === 'UNKNOWN' ? ['modality'] : []),
            ...(qu.domain.state === 'UNKNOWN' ? ['domain'] : []),
        ],
        ambiguity_notes: [],
        confidence: {
            task_certainty: qu.task.state === 'CONFIRMED' ? 90 : qu.task.state === 'INFERRED' ? 60 : 0,
            domain_certainty: qu.domain.state === 'CONFIRMED' ? 90 : qu.domain.state === 'INFERRED' ? 60 : 0,
            modality_certainty: qu.modality.state === 'CONFIRMED' ? 90 : qu.modality.state === 'INFERRED' ? 60 : 0,
            target_certainty: qu.target.state === 'CONFIRMED' ? 90 : qu.target.state === 'INFERRED' ? 60 : 0,
            architecture_certainty: 0,
            score: 0,
            reason: 'Calculated from explicit query fields',
        },
    };
}

/**
 * Query Parser — Structured Query Understanding
 *
 * Extracts semantic intent from user queries WITHOUT hallucinating missing fields.
 * Every extracted field is tagged as CONFIRMED, INFERRED, or UNKNOWN.
 *
 * DESIGN PRINCIPLE:
 * - "coronary arteries" → target=coronary arteries, task=UNKNOWN, modality=UNKNOWN
 * - NEVER auto-assign task=classification, modality=tabular because the word "disease" appeared
 * - Let the search results provide the evidence; this module only extracts what is explicit
 */

import { EvidenceFact, FactState } from '../../schemas/types';

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
    /** Broad domain: medical_imaging, robotics, nlp, etc. */
    domain: QueryField<string>;
    /** Narrow subdomain: cardiovascular, manipulation, sentiment, etc. */
    subdomain: QueryField<string>;
    /** Primary ML task: segmentation, detection, classification, imitation_learning, etc. */
    task: QueryField<string>;
    /** Specific target/anatomy/subject: coronary arteries, brain tumor, SO-101, etc. */
    target: QueryField<string>;
    /** Data modality: CT, MRI, image, text, tabular, video, audio, robotics, etc. */
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
    /** Structured search queries for APIs */
    searchQueries: string[];
    /** Diagnostic log */
    parseLog: string[];
}

// ── Domain knowledge tables ──────────────────────────────────────────────────

/** Medical imaging sub-domain keywords → subdomain label */
const MEDICAL_IMAGING_SUBDOMAINS: [RegExp, string][] = [
    [/coronary\s*art(?:ery|eries)/i, 'cardiovascular'],
    [/cardiac|heart\s*(?:vessel|chamber|wall|muscle|mri|ct)/i, 'cardiovascular'],
    [/brain\s*tumor|glioma|glioblastoma|meningioma/i, 'neuro-oncology'],
    [/brain|cerebral|neuro(?:imaging)?/i, 'neurology'],
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
    [/\bCTA?\b|coronary\s*CT|cardiac\s*CT|computed\s*tomograph/i, 'CT'],
    [/\bMRI\b|magnetic\s*resonance/i, 'MRI'],
    [/\bX.?ray\b|radiograph/i, 'X-ray'],
    [/\bPET\b\s*(?:scan|image|CT)?/i, 'PET'],
    [/ultrasound|echocardio/i, 'ultrasound'],
    [/angiograph/i, 'angiography'],
    [/fundus|ophthalmoscopy|retinal\s*image/i, 'fundus photography'],
    [/dermoscop/i, 'dermoscopy'],
    [/(?:medical\s*)?image|scan|radiolog/i, 'medical imaging'],
    [/video/i, 'video'],
    [/audio|speech|wav\b/i, 'audio'],
    [/tabular|csv|spreadsheet|structured\s*data/i, 'tabular'],
    [/text|nlp|natural\s*language|document/i, 'text'],
    [/point\s*cloud|3D\s*(?:scan|model)|lidar/i, '3D'],
    [/robo(?:t|tics)|manipulation|teleoperat/i, 'robotics'],
    [/time.?series|temporal\s*data/i, 'time-series'],
    [/image|photo|picture|visual/i, 'image'],
];

/** Task detection patterns → canonical task label */
const TASK_PATTERNS: [RegExp, string][] = [
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
];

/** Domain detection patterns → canonical domain label */
const DOMAIN_PATTERNS: [RegExp, string][] = [
    [/coronary|cardiac|cardiovascular|heart\s*(?:disease|failure|attack)|ecg|ekg/i, 'medical imaging'],
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
    [/coronary\s*art(?:ery|eries)/i, 'coronary arteries'],
    [/coronary\s*vessel/i, 'coronary vessels'],
    [/brain\s*tumor/i, 'brain tumor'],
    [/glioma/i, 'glioma'],
    [/lung\s*(?:cancer|nodule|tumor)/i, 'lung cancer'],
    [/skin\s*(?:lesion|cancer|melanoma)/i, 'skin lesion'],
    [/retinal\s*(?:vessel|disease|image)/i, 'retinal'],
    [/diabetic\s*retinopathy/i, 'diabetic retinopathy'],
    [/polyp/i, 'polyp'],
    [/liver\s*(?:tumor|lesion|segment)/i, 'liver'],
    [/kidney\s*(?:stone|tumor|segment)/i, 'kidney'],
    [/pancrea(?:s|tic)/i, 'pancreas'],
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

    return makeField('dataset', 'INFERRED', 0.5, 'inferred', 'Default: assumed dataset search');
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
    if (domain.value === 'medical imaging') {
        const sub = matchFirst(q, MEDICAL_IMAGING_SUBDOMAINS);
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
        if (/coronary/i.test(target.value)) {
            inferredKeywords.push('coronary vessel', 'coronary artery', 'coronary segmentation', 'coronary CTA');
        }
        if (/brain\s*tumor/i.test(target.value)) {
            inferredKeywords.push('glioma', 'brain MRI', 'tumor segmentation');
        }
    }
    if (modality.value === 'CT') {
        inferredKeywords.push('computed tomography', 'CTA', 'cardiac CT');
    }

    // ── Build API search queries ──────────────────────────────────────────
    const searchQueries = buildSearchQueries(q, target, task, modality, domain, subdomain, specificEntityMentioned, explicitKeywords);
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
    keywords: string[]
): string[] {
    const queries: string[] = [];

    // Priority 1: specific entity name
    if (specificEntity) {
        queries.push(specificEntity);
    }

    // Priority 2: target + task + modality (most specific)
    const parts: string[] = [];
    if (target.value) parts.push(target.value);
    if (task.value) parts.push(task.value);
    if (modality.value && modality.value !== 'image') parts.push(modality.value);

    if (parts.length >= 2) {
        queries.push(parts.join(' '));
    }

    // Priority 3: target + task
    if (target.value && task.value) {
        queries.push(`${target.value} ${task.value}`);
    }

    // Priority 4: target + modality
    if (target.value && modality.value) {
        queries.push(`${target.value} ${modality.value}`);
    }

    // Priority 5: target only
    if (target.value) {
        queries.push(target.value);
    }

    // Priority 6: subdomain + task
    if (subdomain.value && task.value) {
        queries.push(`${subdomain.value} ${task.value}`);
    }

    // Priority 7: domain + task
    if (domain.value && task.value) {
        queries.push(`${domain.value} ${task.value}`);
    }

    // Priority 8: raw keyword phrase (fallback)
    const keyPhrase = keywords.slice(0, 4).join(' ');
    if (keyPhrase && !queries.some(q => q.includes(keyPhrase.split(' ')[0]))) {
        queries.push(keyPhrase);
    }

    // Deduplicate and limit
    return [...new Set(queries.filter(q => q && q.trim().length > 2))].slice(0, 5);
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
        search_queries: qu.searchQueries,
        explicit_keywords: qu.explicitKeywords,
        inferred_keywords: qu.inferredKeywords,
        parse_log: qu.parseLog,
    };
}

// ── Convert to legacy ProjectSpec (for backward-compat with existing enrichment) ─

import type { ProjectSpec } from '../../schemas/types';

export function queryUnderstandingToProjectSpec(qu: QueryUnderstanding): ProjectSpec {
    // Determine modality label for legacy field mapping
    const modalityVal = qu.modality.value;
    const legacyModality =
        modalityVal === 'CT' ? 'Medical Imaging / CT' :
        modalityVal === 'MRI' ? 'Medical Imaging / MRI' :
        modalityVal === 'X-ray' ? 'Medical Imaging / X-ray' :
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

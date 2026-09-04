/**
 * Sub-String Keyword Extractor & Semantic Query Compressor
 *
 * Extracts concise, high-salience search queries (2–5 words) from long,
 * verbose technical problem statements (e.g., 20+ words) to ensure
 * upstream search APIs (Kaggle, Hugging Face, Semantic Scholar, arXiv, PubMed, OpenAlex)
 * do not return 0 results due to overly long query strings.
 */

// Common domain entities and targets
const TARGET_MAP: [RegExp, string, string[]][] = [
    [/4d\s*flow\s*cardiac|4d\s*flow/i, '4D flow cardiac', ['4D flow', 'cardiac flow', 'phase contrast']],
    [/velocity\s*field|velocity\s*reconstruction/i, 'velocity field', ['velocity field', 'cardiac velocity']],
    [/wall\s*shear\s*stress|shear\s*stress/i, 'wall shear stress', ['hemodynamic wall shear stress', 'WSS']],
    [/cardiac|heart\s*(?:muscle|ventricle)/i, 'cardiac', ['cardiovascular', 'heart']],
    [/seizure|epilep/i, 'seizure', ['epilepsy', 'seizure onset', 'epileptic']],
    [/onset\s*zone/i, 'onset zone', ['seizure onset zone', 'soz']],
    [/coronary\s*art(?:ery|eries)|coronary\s*vessel/i, 'coronary artery', ['coronary', 'cardiovascular']],
    [/brain\s*tumor|glioma|glioblastoma/i, 'brain tumor', ['glioma', 'brain lesion']],
    [/lung\s*(?:cancer|nodule|tumor)/i, 'lung cancer', ['pulmonary nodule', 'chest CT']],
    [/skin\s*(?:lesion|cancer|melanoma)/i, 'skin lesion', ['melanoma', 'dermoscopy']],
    [/diabetic\s*retinopathy|retin(?:a|al)/i, 'diabetic retinopathy', ['retinal image', 'fundus']],
    [/arrhythmia|ecg\s*signal|heart\s*rate/i, 'arrhythmia', ['cardiac arrhythmia', 'ecg']],
    [/manufacturing\s*defect|surface\s*defect|industrial\s*defect/i, 'manufacturing defect', ['surface defect', 'industrial anomaly']],
    [/traffic|vehicle|pedestrian/i, 'vehicle detection', ['traffic monitoring', 'autonomous driving']],
    [/so.?101|robotic\s*arm/i, 'SO-101', ['robot arm', 'lerobot']],
    [/cryo.?e[mt]|electron\s*tomograph|subtomogram|macromolecule/i, 'macromolecule structural', ['cryo-et', 'cryo-em', 'subtomogram', 'macromolecular']],
];

// Modality terms
const MODALITY_MAP: [RegExp, string, string[]][] = [
    [/cryo.?e[mt]|cryo.?electron|electron\s*tomograph|subtomogram/i, 'Cryo-EM/ET', ['cryo-et', 'cryo-em', 'electron tomography', 'subtomogram']],
    [/fluorescen|confocal|immunofluorescen/i, 'Fluorescence', ['fluorescence microscopy', 'confocal']],
    [/4d\s*flow\s*mri|phase\s*contrast\s*mri|pc.?mri/i, '4D Flow MRI', ['4D flow', 'phase contrast MRI']],
    [/intracranial\s*eeg|ieeg|ecog/i, 'intracranial EEG', ['iEEG', 'EEG']],
    [/\beeg\b|electroencephalog/i, 'EEG', ['electroencephalography', 'EEG signals']],
    [/\becg\b|\bekg\b|electrocardiog/i, 'ECG', ['electrocardiography', 'ECG signals']],
    [/infrared\s*video|thermal\s*video|infrared/i, 'infrared video', ['thermal video', 'video EEG']],
    [/\bvideo\b|\bcctv\b|video\s*stream/i, 'video', ['video stream', 'surveillance']],
    [/\bct\b|\bcta\b|computed\s*tomograph/i, 'CT', ['computed tomography', 'CTA']],
    [/\bmri\b|\bfmri\b|magnetic\s*resonance/i, 'MRI', ['magnetic resonance imaging']],
    [/x.?ray|radiograph/i, 'X-ray', ['radiography']],
    [/ultrasound|echocardio/i, 'ultrasound', ['echocardiography']],
    [/multimodal|multi.?modal/i, 'multimodal', ['multimodal fusion', 'cross-modal']],
    [/time.?series|temporal\s*data/i, 'time-series', ['temporal signal', 'sensor data']],
    [/tabular|spreadsheet|csv/i, 'tabular', ['structured data']],
    [/audio|speech|acoustic/i, 'audio', ['speech signal', 'audio stream']],
];

// Task terms
const TASK_MAP: [RegExp, string, string[]][] = [
    [/velocity\s*(?:field\s*)?reconstruction/i, 'velocity field reconstruction', ['velocity reconstruction', '4D flow reconstruction']],
    [/wall\s*shear\s*stress|shear\s*stress\s*estimation|velocity\s*estimation|flow\s*estimation/i, 'velocity estimation', ['wall shear stress estimation', 'hemodynamic estimation']],
    [/k-space|radial\s*undersampling|reconstruction|reconstruct/i, 'reconstruction', ['k-space reconstruction', 'MRI reconstruction', 'sparse reconstruction']],
    [/registration|spatial\s*align/i, 'registration', ['image registration', 'spatial alignment']],
    [/seizure\s*detect(?:ion)?/i, 'seizure detection', ['seizure prediction', 'epilepsy detection']],
    [/onset\s*zone\s*localiz(?:ation)?|localiz(?:ation)?/i, 'localization', ['onset zone localization', 'zone localization']],
    [/segment(?:ation)?/i, 'segmentation', ['semantic segmentation', 'instance segmentation']],
    [/detect(?:ion)?/i, 'detection', ['real-time detection', 'event detection']],
    [/classif(?:y|ication)/i, 'classification', ['pattern recognition']],
    [/imitation\s*learning|behavior\s*clon/i, 'imitation learning', ['policy learning']],
    [/anomaly\s*detect(?:ion)?/i, 'anomaly detection', ['outlier detection']],
    [/track(?:ing)?/i, 'tracking', ['object tracking']],
    [/forecast(?:ing)?|predict(?:ion)?/i, 'prediction', ['forecasting']],
    [/fusion/i, 'fusion', ['multimodal fusion']],
];

// Words to strip when compressing search queries
const NOISE_WORDS = new Set([
    'using', 'continuous', 'real-time', 'realtime', 'synchronized', 'streams',
    'stream', 'channel', 'channels', '64-channel', '128-channel', '32-channel',
    '16-channel', 'please', 'find', 'search', 'dataset', 'datasets', 'data',
    'model', 'models', 'system', 'for', 'and', 'with', 'the', 'a', 'an', 'on',
    'of', 'to', 'in', 'by', 'via', 'from', 'at', 'is', 'are', 'was', 'were',
    'based', 'deep', 'learning', 'network', 'networks', 'ai', 'ml', 'algorithm',
    'algorithms', 'method', 'methods', 'framework', 'approach', 'study', 'studies',
    'analysis', 'paper', 'papers', 'research', 'we', 'our', 'i', 'want', 'need',
    'looking', 'show', 'give', 'get', 'help', 'can', 'you', 'me',
]);

export interface ExtractedCoreKeywords {
    primaryQuery: string;
    secondaryQuery: string;
    tertiaryQuery: string;
    allQueries: string[];
    keywords: string[];
    target?: string;
    task?: string;
    modality?: string;
    modalities: string[];
    isTechnicalOrData: boolean;
}

/**
 * Checks whether a query contains domain, clinical, sensor, modality, or ML task terms.
 */
export function isTechnicalOrDataQuery(query: string): boolean {
    const q = query.toLowerCase();

    // 1. Check modality patterns
    for (const [pattern] of MODALITY_MAP) {
        if (pattern.test(q)) return true;
    }

    // 2. Check task patterns
    for (const [pattern] of TASK_MAP) {
        if (pattern.test(q)) return true;
    }

    // 3. Check target patterns
    for (const [pattern] of TARGET_MAP) {
        if (pattern.test(q)) return true;
    }

    // 4. Check additional technical, clinical, robotics, or sensor terms
    const technicalKeywords = [
        /\b(?:eeg|ieeg|ecog|ecg|ekg|emg|ppg|dicom|cta?|mri|fmri|pet|spect)\b/i,
        /\b(?:seizure|epilep\w*|intracranial|arrhythmia|glioma|tumor|lesion|infarct|stroke|stenosis|aneurysm)\b/i,
        /\b(?:cctv|infrared|thermal|multimodal|lidar|radar|imu|spectroscopy|microscopy|histopathol\w*)\b/i,
        /\b(?:segmentation|localization|detection|classification|regression|forecasting|imitation\s*learning)\b/i,
        /\b(?:so-?101|lerobot|smolvla|pi0|yolo|unet|transformer|resnet|segformer|vla|diffusion)\b/i,
        /\b(?:sensor\s*data|time-?series|tabular\s*data|point\s*cloud|audio\s*stream|video\s*stream)\b/i,
    ];

    return technicalKeywords.some((regex) => regex.test(q));
}

/**
 * Extracts concise core search sub-strings from a raw user query.
 */
export function extractCoreSearchKeywords(rawQuery: string): ExtractedCoreKeywords {
    const clean = rawQuery.trim();
    const q = clean.toLowerCase();

    let target: string | undefined;
    let task: string | undefined;
    const modalities: string[] = [];

    // 1. Identify target
    for (const [pattern, label] of TARGET_MAP) {
        if (pattern.test(q)) {
            target = label;
            break;
        }
    }

    // 2. Identify task
    for (const [pattern, label] of TASK_MAP) {
        if (pattern.test(q)) {
            task = label;
            break;
        }
    }

    // 3. Identify modalities
    for (const [pattern, label] of MODALITY_MAP) {
        if (pattern.test(q) && !modalities.includes(label)) {
            modalities.push(label);
        }
    }

    // 4. Token-level keyword filtering (stripping noise)
    const rawTokens = clean
        .replace(/[^a-zA-Z0-9\-_]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 1);

    const salientTokens = rawTokens.filter((t) => !NOISE_WORDS.has(t.toLowerCase()));

    // 4b. Specialized handler for 4D flow cardiac MRI queries to prevent stripping critical physics tokens
    if (/4d\s*flow/i.test(q) && /cardiac/i.test(q)) {
        const pQuery = '4D flow cardiac MRI velocity reconstruction';
        const sQuery = 'cardiac 4D flow wall shear stress';
        const tQuery = 'sparse k-space cardiac MRI reconstruction';
        return {
            primaryQuery: pQuery,
            secondaryQuery: sQuery,
            tertiaryQuery: tQuery,
            allQueries: [pQuery, sQuery, tQuery],
            keywords: ['4D flow', 'cardiac', 'MRI', 'velocity', 'reconstruction', 'wall shear stress', 'k-space'],
            target: target || '4D flow cardiac',
            task: task || 'velocity field reconstruction',
            modality: modalities[0] || '4D Flow MRI',
            modalities: modalities.length > 0 ? modalities : ['4D Flow MRI'],
            isTechnicalOrData: true,
        };
    }

    // 4c. Specialized handler for Cryo-EM / Cryo-ET microscopy queries
    if (/cryo/i.test(q) || /tomography/i.test(q)) {
        const pQuery = 'cryo-et macromolecule structural';
        const sQuery = 'electron tomography subtomogram';
        const tQuery = 'cryo-em structural biology';
        return {
            primaryQuery: pQuery,
            secondaryQuery: sQuery,
            tertiaryQuery: tQuery,
            allQueries: ['cryo-et', 'cryo-em', 'electron tomography', 'macromolecule structural', 'subtomogram'],
            keywords: ['cryo-et', 'cryo-em', 'electron tomography', 'macromolecule', 'subtomogram', 'structural biology'],
            target: target || 'macromolecule structural',
            task: task || 'structural identification',
            modality: 'Cryo-EM/ET',
            modalities: ['Cryo-EM/ET'],
            isTechnicalOrData: true,
        };
    }

    // 5. Construct primary query (Target + Task + Key Modality)
    const targetTaskCombined = target && task
        ? (task.toLowerCase().includes(target.toLowerCase())
            ? task
            : target.toLowerCase().includes(task.toLowerCase())
            ? target
            : `${target} ${task}`)
        : (target || task || '');

    let primaryQuery = '';
    if (targetTaskCombined && modalities.length > 0) {
        // e.g. "seizure detection intracranial EEG"
        const primaryModality = modalities[0];
        primaryQuery = `${targetTaskCombined} ${primaryModality}`.replace(/\s+/g, ' ').trim();
    } else if (targetTaskCombined) {
        primaryQuery = targetTaskCombined;
    } else if (modalities.length > 0) {
        primaryQuery = modalities[0];
    } else if (salientTokens.length > 0) {
        primaryQuery = salientTokens.slice(0, 4).join(' ');
    } else {
        primaryQuery = clean.split(/\s+/).slice(0, 4).join(' ');
    }

    // 6. Construct secondary query (Domain / Related synonyms / Secondary modalities)
    let secondaryQuery = '';
    if (/seizure|epilep/i.test(q)) {
        if (modalities.includes('video') || modalities.includes('infrared video') || /video/i.test(q)) {
            secondaryQuery = 'epilepsy multimodal video EEG';
        } else {
            secondaryQuery = 'epilepsy intracranial EEG detection';
        }
    } else if (target && modalities.length > 1) {
        secondaryQuery = `${target} ${modalities.slice(0, 2).join(' ')}`;
    } else if (target && task) {
        secondaryQuery = `${target} ${task} benchmark`;
    } else if (salientTokens.length >= 3) {
        secondaryQuery = salientTokens.slice(1, 5).join(' ');
    } else {
        secondaryQuery = primaryQuery;
    }

    // 7. Construct tertiary query
    let tertiaryQuery = '';
    if (/onset\s*zone/i.test(q) || /localiz/i.test(q)) {
        tertiaryQuery = 'seizure onset zone localization EEG';
    } else if (modalities.length > 0 && target) {
        tertiaryQuery = `${modalities[0]} ${target}`;
    } else if (salientTokens.length >= 2) {
        tertiaryQuery = salientTokens.slice(0, 3).join(' ');
    } else {
        tertiaryQuery = primaryQuery;
    }

    // 8. Clean and format keyword list
    const keywordsSet = new Set<string>();
    if (target) keywordsSet.add(target);
    if (task) keywordsSet.add(task);
    for (const m of modalities) keywordsSet.add(m);

    // Add 2-word combinations found in query
    if (/seizure\s*detect/i.test(q)) keywordsSet.add('seizure detection');
    if (/intracranial\s*eeg|ieeg/i.test(q)) keywordsSet.add('intracranial EEG');
    if (/infrared\s*video/i.test(q)) keywordsSet.add('infrared video');
    if (/onset\s*zone/i.test(q)) keywordsSet.add('onset zone localization');
    if (/coronary\s*art/i.test(q)) keywordsSet.add('coronary artery');
    if (/brain\s*tumor/i.test(q)) keywordsSet.add('brain tumor');
    if (/so.?101/i.test(q)) keywordsSet.add('SO-101');

    for (const token of salientTokens.slice(0, 6)) {
        keywordsSet.add(token);
    }

    const uniqueQueries = Array.from(
        new Set([primaryQuery, secondaryQuery, tertiaryQuery].filter((s) => s && s.trim().length > 2))
    );

    return {
        primaryQuery,
        secondaryQuery,
        tertiaryQuery,
        allQueries: uniqueQueries,
        keywords: Array.from(keywordsSet).filter((k) => k && k.length > 2),
        target,
        task,
        modality: modalities[0],
        modalities,
        isTechnicalOrData: isTechnicalOrDataQuery(clean),
    };
}

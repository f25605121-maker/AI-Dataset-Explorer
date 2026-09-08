# isTechnicalOrDataQuery

**File:** `src\server\assistant\keywordExtractor.ts`

## Description
Sub-String Keyword Extractor & Semantic Query Compressor
Extracts concise, high-salience search queries (2–5 words) from long,
verbose technical problem statements (e.g., 20+ words) to ensure
upstream search APIs (Kaggle, Hugging Face, Semantic Scholar, arXiv, PubMed, OpenAlex)
do not return 0 results due to overly long query strings.
/

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
Checks whether a query contains domain, clinical, sensor, modality, or ML task terms.

## Signature
```typescript
function isTechnicalOrDataQuery(query: string): boolean
```

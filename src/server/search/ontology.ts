/**
 * Ontology Normalization Engine
 *
 * Provides standardized entity resolution, synonym mapping, taxonomy hierarchies,
 * and conflict matrices for Anatomy, Modalities, Tasks, Sequences, and Dimensionality.
 */

export interface AnatomyDefinition {
    canonical: string;
    terms: string[];
    synonyms: string[];
    organs: string[];
    conflictingGroups: string[];
    benchmarks: string[];
}

export const ANATOMY_ONTOLOGY: Record<string, AnatomyDefinition> = {
    abdomen: {
        canonical: 'ABDOMEN',
        terms: [
            'abdomen', 'abdominal', 'abdominal cavity', 'intra-abdominal', 'peritoneal', 'visceral',
            'liver', 'hepatic', 'hepatocellular', 'kidney', 'renal', 'pancreas', 'pancreatic',
            'spleen', 'splenic', 'stomach', 'gastric', 'bowel', 'colon', 'colorectal', 'intestine',
            'intestinal', 'gallbladder', 'biliary', 'adrenal', 'retroperitoneal'
        ],
        synonyms: ['abdomen', 'abdominal', 'abdominal cavity'],
        organs: ['liver', 'kidney', 'pancreas', 'spleen', 'stomach', 'gallbladder', 'adrenal', 'bowel', 'colon'],
        conflictingGroups: ['brain', 'cardiac', 'pulmonary_lung', 'pelvis_prostate', 'musculoskeletal', 'skin', 'eye', 'head_neck', 'face'],
        benchmarks: ['amos', 'btcv', 'chaos', 'lits', 'kits', 'flare', 'msd_pancreas', 'msd_liver', 'msd_spleen', 'msd_colon'],
    },
    brain: {
        canonical: 'BRAIN',
        terms: [
            'brain', 'cerebral', 'cranial', 'encephalic', 'intracranial', 'neuro', 'neurological',
            'cortex', 'cerebellum', 'hippocampus', 'hippocampal', 'glioma', 'glioblastoma', 'gbm',
            'lgg', 'hgg', 'meningioma', 'stroke', 'ischemia', 'white matter', 'gray matter', 'ventricle',
            'pituitary', 'skull', 'neuroimaging', 'brainstem', 'thalamus', 'basal ganglia'
        ],
        synonyms: ['brain', 'cerebral', 'cranial', 'neuro', 'encephalic'],
        organs: ['hippocampus', 'cortex', 'cerebellum', 'brainstem', 'thalamus', 'ventricles', 'pituitary'],
        conflictingGroups: ['abdomen', 'cardiac', 'pulmonary_lung', 'pelvis_prostate', 'musculoskeletal', 'skin', 'eye', 'face'],
        benchmarks: ['brats', 'isles', 'adni', 'oasis', 'ixi', 'atlas', 'wmh', 'crossmoda'],
    },
    cardiac: {
        canonical: 'CARDIAC',
        terms: [
            'cardiac', 'heart', 'myocardium', 'myocardial', 'coronary', 'aorta', 'aortic', 'atrium', 'atrial',
            'ventricle', 'ventricular', 'cardiovascular', 'pericardium', 'bicuspid', 'valvular', 'valve',
            'endocardium', 'cardio', 'left ventricle', 'right ventricle', 'ascending aorta', 'aortic arch',
            'descending aorta', 'cardiac flow', 'blood flow', 'hemodynamics', 'velocity field'
        ],
        synonyms: ['cardiac', 'heart', 'cardiovascular', 'aorta', 'myocardium', 'coronary'],
        organs: ['heart', 'aorta', 'coronary artery', 'myocardium', 'left ventricle', 'right ventricle', 'atrium'],
        conflictingGroups: ['brain', 'abdomen', 'pelvis_prostate', 'musculoskeletal', 'skin', 'eye', 'head_neck', 'pulmonary_lung', 'face'],
        benchmarks: ['acdc', 'coronary-cta', 'asoca', 'stcom', 'mmms'],
    },
    pulmonary_lung: {
        canonical: 'PULMONARY_LUNG',
        terms: [
            'lung', 'pulmonary', 'pneumonia', 'pleura', 'pleural', 'bronchial', 'cxr', 'chest radiograph',
            'pneumothorax', 'tuberculosis', 'emphysema', 'copd', 'lung nodule', 'lung tumor', 'covid', 'covid-19'
        ],
        synonyms: ['lung', 'pulmonary', 'pneumonia', 'pleura', 'bronchial'],
        organs: ['lung', 'bronchus', 'pleura'],
        conflictingGroups: ['brain', 'cardiac', 'abdomen', 'pelvis_prostate', 'musculoskeletal', 'skin', 'eye', 'face'],
        benchmarks: ['chexpert', 'mimic-cxr', 'nih-chest-xrays', 'luna16'],
    },
    pelvis_prostate: {
        canonical: 'PELVIS_PROSTATE',
        terms: [
            'prostate', 'prostatic', 'bladder', 'cervix', 'cervical', 'uterus', 'uterine',
            'ovary', 'ovarian', 'pelvis', 'pelvic', 'rectum', 'rectal', 'seminal vesicle'
        ],
        synonyms: ['prostate', 'pelvis', 'bladder', 'cervix', 'uterus'],
        organs: ['prostate', 'bladder', 'uterus', 'ovary', 'rectum'],
        conflictingGroups: ['brain', 'cardiac', 'head_neck', 'eye', 'skin', 'face'],
        benchmarks: ['promise12', 'prostatex', 'picai'],
    },
    musculoskeletal: {
        canonical: 'MUSCULOSKELETAL',
        terms: [
            'bone', 'spine', 'vertebra', 'vertebral', 'spinal', 'femur', 'knee', 'hip',
            'fracture', 'joint', 'shoulder', 'wrist', 'ankle', 'tibia', 'skeleton', 'skeletal',
            'cartilage', 'meniscus', 'lumbar', 'cervical spine'
        ],
        synonyms: ['bone', 'spine', 'joint', 'knee', 'hip', 'vertebra'],
        organs: ['spine', 'vertebra', 'femur', 'knee', 'hip', 'joint', 'cartilage'],
        conflictingGroups: ['brain', 'abdomen', 'cardiac', 'skin', 'eye', 'face'],
        benchmarks: ['verse', 'oai', 'fastmri_knee', 'mrnet', 'rsna_bone_age'],
    },
    skin: {
        canonical: 'SKIN',
        terms: ['skin', 'melanoma', 'dermoscopy', 'dermatology', 'cutaneous', 'dermatological', 'skin lesion', 'nevus', 'keratosis'],
        synonyms: ['skin', 'melanoma', 'dermoscopy', 'cutaneous'],
        organs: ['skin', 'epidermis'],
        conflictingGroups: ['brain', 'abdomen', 'cardiac', 'pelvis_prostate', 'musculoskeletal', 'eye', 'face'],
        benchmarks: ['isic', 'ham10000', 'pad-ufes-20'],
    },
    eye: {
        canonical: 'EYE',
        terms: ['eye', 'retina', 'retinal', 'fundus', 'optic', 'ophthalmology', 'cornea', 'macula', 'glaucoma', 'diabetic retinopathy', 'fovea', 'oct'],
        synonyms: ['retina', 'eye', 'fundus', 'optic disc'],
        organs: ['retina', 'optic nerve', 'cornea', 'macula'],
        conflictingGroups: ['abdomen', 'brain', 'cardiac', 'pelvis_prostate', 'musculoskeletal', 'skin', 'face'],
        benchmarks: ['drive', 'stare', 'aria', 'eyepacs', 'messidor', 'refuge'],
    },
    head_neck: {
        canonical: 'HEAD_NECK',
        terms: ['neck', 'thyroid', 'sinus', 'larynx', 'pharynx', 'oral', 'nasopharyngeal', 'dental', 'jaw', 'mandible', 'salivary'],
        synonyms: ['neck', 'thyroid', 'sinus', 'oral'],
        organs: ['thyroid', 'larynx', 'sinus', 'oral cavity'],
        conflictingGroups: ['abdomen', 'pelvis_prostate', 'musculoskeletal', 'skin', 'eye', 'cardiac'],
        benchmarks: ['hecktor', 'tn-scui2020'],
    },
    face: {
        canonical: 'FACE',
        terms: ['face', 'facial', 'face recognition', 'face detection', 'face verification', 'celeb', 'face alignment', 'facial landmark', 'person re-identification'],
        synonyms: ['face', 'facial'],
        organs: ['face'],
        conflictingGroups: ['cardiac', 'abdomen', 'pelvis_prostate', 'musculoskeletal', 'eye'],
        benchmarks: ['lfw', 'celeba', 'widerface'],
    },
};

export interface ModalityDefinition {
    canonical: string;
    terms: string[];
    subtypes: string[];
    isMedicalImaging: boolean;
    conflictingModalities: string[];
}

export const MODALITY_ONTOLOGY: Record<string, ModalityDefinition> = {
    cryo_em_et: {
        canonical: 'Cryo-EM/ET',
        terms: [
            'cryo-et', 'cryo-em', 'cryo et', 'cryo em', 'electron tomography',
            'cryo-electron tomography', 'cryo-electron microscopy', 'subtomogram',
            'macromolecule structural', 'subtomogram averaging', 'transmission electron microscopy'
        ],
        subtypes: ['Cryo-ET', 'Cryo-EM', 'Subtomogram', 'Single-Particle Cryo-EM'],
        isMedicalImaging: true,
        conflictingModalities: ['tabular', 'audio', 'text', 'speech'],
    },
    fluorescence: {
        canonical: 'Fluorescence',
        terms: ['fluorescence', 'fluorescent', 'confocal', 'immunofluorescence', 'gfp', 'microscopy fluorescence'],
        subtypes: ['Widefield', 'Confocal', 'TIRF', 'Super-Resolution'],
        isMedicalImaging: true,
        conflictingModalities: ['audio', 'text', 'tabular'],
    },
    genomics_tabular: {
        canonical: 'Genomics/Tabular',
        terms: ['genomics', 'transcriptomics', 'rna-seq', 'single-cell', 'dna sequencing', 'variant', 'expression table'],
        subtypes: ['RNA-Seq', 'scRNA-Seq', 'VCF', 'Gene Expression Matrix'],
        isMedicalImaging: false,
        conflictingModalities: ['audio', 'video', 'mri', 'ct'],
    },
    mri: {
        canonical: 'MRI',
        terms: [
            'mri', 'magnetic resonance imaging', 'magnetic resonance', 'mr imaging', 'mr scan',
            'mri scan', 'mr image', 'nuclear magnetic resonance', 'fmri', 'functional mri'
        ],
        subtypes: ['DCE-MRI', '4D-Flow MRI', 'PC-MRI', 'T1', 'T1w', 'T1CE', 'T2', 'T2w', 'FLAIR', 'DWI', 'ADC', 'SWI', 'fMRI', 'MRCP'],
        isMedicalImaging: true,
        conflictingModalities: ['tabular', 'audio', 'text', 'speech', 'sensor_only'],
    },
    flow_mri: {
        canonical: '4D-FLOW-MRI',
        terms: ['4d flow', '4d-flow', '4d flow mri', 'phase contrast mri', 'pc-mri', 'phase-contrast', 'flow mri', 'velocity field mri'],
        subtypes: ['4D-Flow MRI', 'PC-MRI'],
        isMedicalImaging: true,
        conflictingModalities: ['tabular', 'audio', 'text', 'ct', 'x-ray'],
    },
    dce_mri: {
        canonical: 'DCE-MRI',
        terms: ['dce-mri', 'dce mri', 'dynamic contrast enhanced mri', 'dynamic contrast-enhanced mri', 'dynamic contrast mri', 'contrast-enhanced mri', 'gadolinium-enhanced mri'],
        subtypes: ['DCE-MRI'],
        isMedicalImaging: true,
        conflictingModalities: ['tabular', 'audio', 'text', 'ct', 'x-ray'],
    },
    ct: {
        canonical: 'CT',
        terms: ['ct', 'computed tomography', 'cat scan', 'ct scan', 'computed tomographic', 'cta', 'computed tomography angiography', 'ccta', 'hrct'],
        subtypes: ['CTA', 'CCTA', 'HRCT', 'NCCT', 'CECT'],
        isMedicalImaging: true,
        conflictingModalities: ['tabular', 'audio', 'text', 'speech'],
    },
    xray: {
        canonical: 'X-RAY',
        terms: ['x-ray', 'xray', 'x ray', 'radiograph', 'radiography', 'cxr', 'chest radiograph', 'plain film'],
        subtypes: ['CXR', 'Mammography', 'Fluoroscopy'],
        isMedicalImaging: true,
        conflictingModalities: ['tabular', 'audio', 'text', 'mri', 'ct'],
    },
    ultrasound: {
        canonical: 'ULTRASOUND',
        terms: ['ultrasound', 'ultrasonography', 'echocardiogram', 'echocardiography', 'sonogram', 'sonography', 'doppler ultrasound'],
        subtypes: ['Echocardiography', 'B-mode', 'Doppler'],
        isMedicalImaging: true,
        conflictingModalities: ['tabular', 'text', 'audio'],
    },
    pet: {
        canonical: 'PET',
        terms: ['pet', 'positron emission tomography', 'pet-ct', 'pet/ct', 'pet scan', 'fdg-pet'],
        subtypes: ['FDG-PET', 'PET-CT', 'PET-MRI'],
        isMedicalImaging: true,
        conflictingModalities: ['tabular', 'text', 'audio'],
    },
    eeg: {
        canonical: 'EEG',
        terms: ['eeg', 'electroencephalogram', 'electroencephalography', 'ieeg', 'intracranial eeg', 'ecog', 'electrocorticography', 'scalp eeg'],
        subtypes: ['iEEG', 'ECoG', 'Scalp EEG', 'Video EEG'],
        isMedicalImaging: false,
        conflictingModalities: ['ct', 'mri', 'x-ray', 'audio', 'text'],
    },
    audio: {
        canonical: 'AUDIO',
        terms: ['audio', 'speech', 'sound', 'voice', 'acoustic', 'waveform', 'wav', 'mp3', 'flac', 'spectrogram', 'utterance'],
        subtypes: ['WAV', 'Spectrogram', 'Speech', 'Environmental Sound'],
        isMedicalImaging: false,
        conflictingModalities: ['mri', 'ct', 'x-ray', 'ultrasound', 'image', 'video'],
    },
    video: {
        canonical: 'VIDEO',
        terms: ['video', 'cctv', 'surveillance', 'camera stream', 'mp4', 'avi', 'infrared video', 'thermal video', 'rgb video'],
        subtypes: ['RGB Video', 'Infrared Video', 'Thermal Video'],
        isMedicalImaging: false,
        conflictingModalities: ['tabular', 'audio_only', 'text_only'],
    },
    tabular: {
        canonical: 'TABULAR',
        terms: ['tabular', 'csv', 'spreadsheet', 'table', 'structured data', 'dataframe', 'parquet', 'features table', 'relational'],
        subtypes: ['CSV', 'Parquet', 'Database'],
        isMedicalImaging: false,
        conflictingModalities: ['mri', 'ct', 'x-ray', 'ultrasound', 'point_cloud'],
    },
    text: {
        canonical: 'TEXT',
        terms: ['text', 'nlp', 'natural language', 'corpus', 'document', 'sentence', 'token', 'transcript', 'clinical notes'],
        subtypes: ['Plain Text', 'JSON', 'Articles'],
        isMedicalImaging: false,
        conflictingModalities: ['mri', 'ct', 'x-ray', 'ultrasound', 'audio_only'],
    },
};

export interface TaskDefinition {
    canonical: string;
    terms: string[];
    synonyms: string[];
    parentTask?: string;
    outputType: string;
}

export const TASK_ONTOLOGY: Record<string, TaskDefinition> = {
    segmentation: {
        canonical: 'SEGMENTATION',
        terms: [
            'segmentation', 'segment', 'delineation', 'contouring', 'mask generation', 'voxel mask',
            'pixel mask', 'organ delineation', 'tumor delineation', 'lesion segmentation', 'multi-organ segmentation',
            'semantic segmentation', 'instance segmentation', 'panoptic segmentation'
        ],
        synonyms: ['segmentation', 'delineation', 'masking', 'contour extraction'],
        outputType: 'mask',
    },
    semantic_segmentation: {
        canonical: 'SEMANTIC_SEGMENTATION',
        terms: ['semantic segmentation', 'dense labeling', 'pixel-level classification', 'voxel-level classification'],
        synonyms: ['semantic segmentation', 'pixel classification'],
        parentTask: 'segmentation',
        outputType: 'class_mask',
    },
    multi_organ_segmentation: {
        canonical: 'MULTI_ORGAN_SEGMENTATION',
        terms: ['multi-organ segmentation', 'multi organ segmentation', 'multiorgan segmentation', 'whole abdomen segmentation', 'multiple organ delineation'],
        synonyms: ['multi-organ segmentation', 'abdominal multi-organ segmentation'],
        parentTask: 'segmentation',
        outputType: 'multi_label_mask',
    },
    tumor_segmentation: {
        canonical: 'TUMOR_SEGMENTATION',
        terms: ['tumor segmentation', 'lesion segmentation', 'neoplasm segmentation', 'cancer segmentation', 'mass delineation', 'tumor delineation'],
        synonyms: ['tumor segmentation', 'lesion delineation'],
        parentTask: 'segmentation',
        outputType: 'lesion_mask',
    },
    classification: {
        canonical: 'CLASSIFICATION',
        terms: ['classification', 'classify', 'categorization', 'diagnosis', 'disease identification', 'binary classification', 'multiclass classification'],
        synonyms: ['classification', 'categorization', 'prediction'],
        outputType: 'label',
    },
    detection: {
        canonical: 'DETECTION',
        terms: ['detection', 'detect', 'localization', 'bounding box', 'nodule detection', 'lesion detection', 'object detection', 'anomaly detection'],
        synonyms: ['detection', 'localization', 'bounding box'],
        outputType: 'bounding_box',
    },
    tracking: {
        canonical: 'TRACKING',
        terms: ['tracking', 'track', 'motion estimation', 'object tracking', 'multi-object tracking', 'trajectory tracking'],
        synonyms: ['tracking', 'trajectory estimation'],
        outputType: 'trajectories',
    },
    generation: {
        canonical: 'GENERATION',
        terms: ['generation', 'synthesis', 'image-to-image', 'translation', 'denoising'],
        synonyms: ['generation', 'synthesis'],
        outputType: 'generated_data',
    },
    reconstruction: {
        canonical: 'RECONSTRUCTION',
        terms: [
            'reconstruction', 'reconstruct', 'k-space reconstruction', 'velocity field reconstruction',
            'image reconstruction', 'sparse reconstruction', 'undersampled reconstruction', 'compressed sensing',
            'super-resolution', 'mri reconstruction', '4d flow reconstruction', 'raw data reconstruction'
        ],
        synonyms: ['reconstruction', 'image reconstruction', 'k-space reconstruction'],
        outputType: 'image_volume',
    },
    velocity_estimation: {
        canonical: 'VELOCITY_ESTIMATION',
        terms: [
            'velocity estimation', 'velocity field', 'wall shear stress', 'shear stress estimation',
            'flow estimation', 'wss estimation', 'hemodynamic estimation', 'vector field regression',
            'velocity field regression', 'velocity regression'
        ],
        synonyms: ['velocity estimation', 'flow estimation', 'hemodynamic estimation', 'wall shear stress estimation'],
        outputType: 'vector_field',
    },
    registration: {
        canonical: 'REGISTRATION',
        terms: [
            'registration', 'image registration', 'deformable registration', 'rigid registration',
            'spatial alignment', 'motion correction', 'alignment'
        ],
        synonyms: ['registration', 'spatial alignment', 'deformable registration'],
        outputType: 'deformation_field',
    },
};

// ── Normalization Functions ──────────────────────────────────────────────────

function clean(text: string): string {
    return text.toLowerCase().trim().replace(/[-_]/g, ' ');
}

export function normalizeAnatomy(term: string): { canonical: string; groupKey: string; organ: string | null } | null {
    const c = clean(term);
    for (const [key, group] of Object.entries(ANATOMY_ONTOLOGY)) {
        for (const t of group.terms) {
            if (c.includes(clean(t)) || clean(t).includes(c)) {
                const organ = group.organs.find(o => c.includes(clean(o))) || null;
                return { canonical: group.canonical, groupKey: key, organ };
            }
        }
    }
    return null;
}

export function normalizeModality(term: string): { canonical: string; isMedical: boolean; subtype?: string } {
    const c = clean(term);
    if (/dce|dynamic contrast/i.test(c)) {
        return { canonical: 'DCE-MRI', isMedical: true, subtype: 'DCE-MRI' };
    }
    for (const [key, mod] of Object.entries(MODALITY_ONTOLOGY)) {
        for (const t of mod.terms) {
            if (c.includes(clean(t)) || clean(t).includes(c)) {
                const matchedSub = mod.subtypes.find(st => c.includes(clean(st)));
                return { canonical: mod.canonical, isMedical: mod.isMedicalImaging, subtype: matchedSub };
            }
        }
    }
    return { canonical: term.toUpperCase(), isMedical: false };
}

export function normalizeTask(term: string): { canonical: string; parentTask?: string } {
    const c = clean(term);
    for (const [key, task] of Object.entries(TASK_ONTOLOGY)) {
        for (const t of task.terms) {
            if (c.includes(clean(t)) || clean(t).includes(c)) {
                return { canonical: task.canonical, parentTask: task.parentTask };
            }
        }
    }
    return { canonical: term.toUpperCase() };
}

export function normalizeDimensionality(text: string, formats: string[] = []): '2D' | '2.5D' | '3D' | '4D' | 'any' {
    const t = text.toLowerCase();
    const f = formats.map(x => x.toLowerCase()).join(' ');
    const combined = `${t} ${f}`;

    if (/\b4d\b|\b4-d\b|4-dimensional|spatiotemporal|time[- ]series 3d/i.test(t)) return '4D';
    if (/\b3d\b|\b3-d\b|3-dimensional|3 dimensional|volumetric|voxel|nifti|\.nii|\.nii\.gz|\.mha|\.nrrd|\.mhd|volume|dicom series/i.test(combined)) return '3D';
    if (/2\.5d|multi slice/i.test(t)) return '2.5D';
    if (/\b2d\b|\b2-d\b|2-dimensional|2 dimensional|slice|planar|patch|\.png|\.jpg|\.tif|\.jpeg/i.test(combined)) return '2D';
    return 'any';
}

export function getConflictingAnatomies(anatomyKey: string): string[] {
    const group = ANATOMY_ONTOLOGY[anatomyKey];
    if (!group) return [];
    const conflictingTerms: string[] = [];
    for (const confKey of group.conflictingGroups) {
        const confGroup = ANATOMY_ONTOLOGY[confKey];
        if (confGroup) {
            conflictingTerms.push(...confGroup.terms.slice(0, 8));
        }
    }
    return [...new Set(conflictingTerms)];
}

export function isAnatomicalConflict(targetAnatomy: string[], candidateText: string): { conflict: boolean; reason?: string } {
    if (!targetAnatomy || targetAnatomy.length === 0) return { conflict: false };

    const candLower = candidateText.toLowerCase();
    const primaryAnatomyKey = targetAnatomy.map(a => normalizeAnatomy(a)?.groupKey).find(Boolean);

    if (!primaryAnatomyKey) return { conflict: false };

    const targetGroup = ANATOMY_ONTOLOGY[primaryAnatomyKey];
    if (!targetGroup) return { conflict: false };

    // Check if candidate matches any target terms
    const hasTargetMatch = targetGroup.terms.some(term => {
        const regex = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        return regex.test(candLower);
    });

    // Check if candidate matches conflicting terms
    for (const confKey of targetGroup.conflictingGroups) {
        const confGroup = ANATOMY_ONTOLOGY[confKey];
        if (!confGroup) continue;

        const conflictingTermsMatched = confGroup.terms.filter(term => {
            const regex = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
            return regex.test(candLower);
        });

        if (conflictingTermsMatched.length > 0 && !hasTargetMatch) {
            return {
                conflict: true,
                reason: `Anatomical conflict: Query targets ${targetGroup.canonical} anatomy (${targetAnatomy.slice(0, 3).join(', ')}), but resource relates to conflicting ${confGroup.canonical} anatomy [${conflictingTermsMatched.slice(0, 3).join(', ')}].`,
            };
        }
    }

    return { conflict: false };
}

// ── Scientific Concept Graph (Section 6) ─────────────────────────────────────

export interface ConceptNode {
    canonical: string;
    aliases: string[];
    relatedConcepts: string[];
    domain: string;
    narrowerQueries: string[];
}

export const SCIENTIFIC_CONCEPT_GRAPH: Record<string, ConceptNode> = {
    four_d_flow_mri: {
        canonical: '4D Flow MRI',
        domain: 'Cardiovascular MRI',
        aliases: [
            '4d flow', '4d-flow', '4d flow mri', 'phase-contrast mri', '4d pc-mri', '4d pc mri',
            'phase contrast mri', 'phase-contrast mr', 'phase contrast magnetic resonance',
            'velocity encoding', 'venc', 'time-resolved 3d phase contrast', '4d velocity field mri'
        ],
        relatedConcepts: [
            'phase-contrast MRI', '4D PC-MRI', 'velocity encoding', 'velocity field',
            'blood flow', 'hemodynamics', 'wall shear stress', 'vorticity', 'turbulent kinetic energy'
        ],
        narrowerQueries: [
            '4D flow cardiac MRI',
            '4D phase contrast MRI velocity',
            'cardiac 4D flow MRI dataset',
            'cardiovascular velocity field MRI',
            'aortic 4D flow MRI',
            'phase contrast MRI flow dataset',
            '4D flow MRI hemodynamics'
        ],
    },
    sparse_kspace: {
        canonical: 'Sparse k-space Undersampling',
        domain: 'MRI Physics & Accelerated Reconstruction',
        aliases: [
            'sparse k-space', 'k-space undersampling', 'radial undersampling', 'radial k-space',
            'sparse sampling', 'accelerated mri', 'compressed sensing', 'non-cartesian',
            'golden-angle radial', 'spoke trajectory', 'sub-nyquist sampling', 'radial trajectory'
        ],
        relatedConcepts: [
            'undersampling', 'accelerated MRI', 'radial sampling', 'compressed sensing',
            'non-Cartesian acquisition', 'NUFFT', 'parallel imaging', 'sparse reconstruction'
        ],
        narrowerQueries: [
            'sparse k-space radial undersampling MRI',
            'radial undersampled cardiac MRI reconstruction',
            '4D flow sparse k-space reconstruction',
            'non-Cartesian MRI velocity reconstruction'
        ],
    },
    wall_shear_stress: {
        canonical: 'Wall Shear Stress (WSS)',
        domain: 'Computational Hemodynamics',
        aliases: [
            'wall shear stress', 'wss', 'shear stress estimation', 'hemodynamic wall shear stress',
            'oscillatory shear index', 'osi', 'wall shear stress vector', 'endothelial shear stress'
        ],
        relatedConcepts: [
            'hemodynamics', 'velocity gradients', 'vascular flow', 'aortic flow',
            'velocity field', 'shear rate', 'viscous energy loss'
        ],
        narrowerQueries: [
            'wall shear stress 4D flow MRI',
            'hemodynamic wall shear stress estimation',
            'cardiac MRI wall shear stress velocity reconstruction'
        ],
    },
};

// ── Non-Medical & Domain Contradiction Matrix (Section 25 & 26) ───────────────

export interface ConflictingDomainDefinition {
    domain: string;
    label: string;
    contradictionTerms: string[];
    regexPatterns: RegExp[];
}

export const NON_MEDICAL_CONFLICT_DOMAINS: ConflictingDomainDefinition[] = [
    {
        domain: 'astronomy',
        label: 'Astronomy & Astrophysics',
        contradictionTerms: [
            'astronomy', 'astrophysics', 'astronomical', 'cosmic', 'galaxy', 'interstellar',
            'celestial', 'planetary', 'telescope', 'jwst', 'hubble', 'star formation', 'dark matter'
        ],
        regexPatterns: [/astronom/i, /astrophys/i, /cosmic/i, /galaxy/i, /interstellar/i, /telescope/i, /\bjwst\b/i],
    },
    {
        domain: 'atmospheric_oceanic',
        label: 'Atmospheric & Oceanographic Fluid Dynamics',
        contradictionTerms: [
            'atmospheric flow', 'wind flow', 'meteorology', 'climate model', 'weather forecast',
            'ocean circulation', 'oceanography', 'typhoon', 'hurricane', 'atmospheric pressure'
        ],
        regexPatterns: [/atmospheric\s*flow/i, /wind\s*flow/i, /meteorolog/i, /ocean\s*circulation/i, /oceanograph/i, /climate\s*model/i, /typhoon/i, /hurricane/i],
    },
    {
        domain: 'generic_cfd',
        label: 'Generic Engineering CFD & Aerodynamics',
        contradictionTerms: [
            'airfoil', 'wind tunnel', 'aerodynamics', 'pipe flow', 'combustion chamber',
            'mach number', 'external aerodynamics', 'aircraft wing', 'supersonic'
        ],
        regexPatterns: [/airfoil/i, /wind\s*tunnel/i, /aerodynamic/i, /pipe\s*flow/i, /mach\s*number/i, /aircraft\s*wing/i, /supersonic/i],
    },
    {
        domain: 'generic_cv',
        label: 'Natural Images & Generic Computer Vision',
        contradictionTerms: [
            'imagenet', 'coco dataset', 'pascal voc', 'cifar-10', 'cifar-100', 'celeba',
            'face recognition', 'facial recognition', 'person re-identification', 'face detection', 'celebrity'
        ],
        regexPatterns: [/imagenet/i, /\bcoco\s*dataset\b/i, /pascal\s*voc/i, /celeba/i, /face\s*recognition/i, /facial\s*recognition/i, /person\s*re-?id/i],
    },
];

export function isMedicalProblem(queryText: string): boolean {
    const q = queryText.toLowerCase();
    return /mri|ct\b|x.?ray|radiograph|ultrasound|pet\s*scan|dicom|nii|biomedical|clinical|patient|hospital|cardiac|heart|aort|brain|neuro|glioma|alzheimer|dementia|retina|fundus|ophthalm|tumor|cancer|lesion|melanoma|dermatol|pulmonary|lung|pneumonia|histolog|microscop|nuclei|biomarker|apoe|cognit|cellular/i.test(q);
}

/**
 * Dynamic Negative Concept Generator
 * Creates query-contextualized negative lists and conflicting entities.
 */
export function getDynamicNegativeConcepts(queryText: string): {
    excludedDomains: string[];
    excludedAnatomy: string[];
    excludedTasks: string[];
    conflictingPatterns: RegExp[];
} {
    const qLower = queryText.toLowerCase();
    const isCardiac = /cardiac|heart|myocard|aort|coronary|cardiovascular/i.test(qLower);
    const isMri = /mri|magnetic\s*resonance/i.test(qLower);
    const isReconstruction = /reconstruction|reconstruct|k-space|sparse.*recon/i.test(qLower);
    const isFlow = /4d\s*flow|phase\s*contrast|velocity\s*field|hemodynamic|wall\s*shear/i.test(qLower);
    const isAlzheimer = /alzheimer|dementia|mild\s*cognitive\s*impairment|\bmci\b|adni|oasis|apoe|cognitive\s*progression/i.test(qLower);
    const isBrainTumor = /brain\s*tumor|brain\s*cancer|glioma|glioblastoma|meningioma|\bbrats\b/i.test(qLower);
    const isEye = /retina|retinal|fundus|ophthalm|diabetic\s*retinopathy|macular|glaucoma/i.test(qLower);
    const isSkin = /skin\s*lesion|melanoma|dermoscop|isic|dermatolog/i.test(qLower);

    const excludedDomains: string[] = [];
    const excludedAnatomy: string[] = [];
    const excludedTasks: string[] = [];
    const conflictingPatterns: RegExp[] = [];

    if (isAlzheimer) {
        // Alzheimer's disease is neurodegenerative; strictly exclude oncological brain tumors and other organs
        excludedDomains.push('Brain Oncology / Glioma', 'Cardiac / Cardiovascular', 'Abdominal Oncology', 'Ophthalmology', 'Dermatology');
        excludedAnatomy.push('Heart', 'Liver', 'Kidney', 'Lung', 'Retina', 'Skin');
        conflictingPatterns.push(
            /\bglioma\b/i, /\bglioblastoma\b/i, /\bbrats\b/i, /\bbrain\s*tumor\b/i,
            /\bbrain\s*cancer\b/i, /\bmeningioma\b/i, /\blgg\b/i, /\bhgg\b/i,
            /\bcardiac\b/i, /\bheart\b/i, /\bliver\b/i, /\bretina\b/i, /\bskin\b/i
        );
    } else if (isBrainTumor) {
        // Brain tumor is oncological; exclude Alzheimer's / dementia
        excludedDomains.push('Neurodegenerative / Dementia');
        conflictingPatterns.push(/\balzheimer\b/i, /\bdementia\b/i, /\bcardiac\b/i, /\bliver\b/i, /\bretina\b/i);
    }

    if (isEye) {
        excludedDomains.push('Neurology / Brain', 'Cardiovascular', 'Abdominal', 'Dermatology', 'Pulmonary');
        excludedAnatomy.push('Brain', 'Heart', 'Liver', 'Kidney', 'Lung', 'Skin');
        conflictingPatterns.push(/\bbrain\b/i, /\bcardiac\b/i, /\bheart\b/i, /\bliver\b/i, /\bkidney\b/i, /\blung\b/i, /\bskin\b/i, /\bmelanoma\b/i);
    }

    if (isSkin) {
        excludedDomains.push('Neurology / Brain', 'Cardiovascular', 'Abdominal', 'Ophthalmology', 'Pulmonary');
        excludedAnatomy.push('Brain', 'Heart', 'Liver', 'Retina', 'Lung');
        conflictingPatterns.push(/\bbrain\b/i, /\bcardiac\b/i, /\bheart\b/i, /\bretina\b/i, /\blung\b/i, /\bliver\b/i);
    }

    if (isCardiac) {
        excludedAnatomy.push(
            'Brain', 'Cerebral', 'Hippocampus', 'Glioma', 'Stroke', 'Neuro',
            'Lung (non-cardiovascular)', 'Pulmonary (non-cardiovascular)',
            'Abdomen', 'Liver', 'Kidney', 'Pancreas', 'Prostate', 'Breast',
            'Knee', 'Spine', 'Musculoskeletal', 'Retina', 'Ophthalmology', 'Face'
        );

        excludedDomains.push(
            'Brain / Neurology', 'Pulmonary / Non-cardiac Lung', 'Abdominal Oncology',
            'Ophthalmology', 'Dermatology', 'Astronomy & Astrophysics',
            'Atmospheric & Oceanic Flow', 'Generic CFD & Aerodynamics',
            'Generic Computer Vision & Natural Images', 'Facial Recognition'
        );

        conflictingPatterns.push(
            /\bbrain\b/i, /\bhippocampus\b/i, /\bglioma\b/i, /\bstroke\b/i, /\bbrats\b/i,
            /\bretina\b/i, /\bophthalmology\b/i, /\bprostate\b/i, /\bknee\b/i, /\bspine\b/i,
            /\bface\b/i, /\bfacial\b/i, /\bimagenet\b/i, /\bastronomy\b/i, /\bastrophysics\b/i
        );
    }

    if (isReconstruction) {
        excludedTasks.push('Segmentation only (without reconstruction)', 'Classification only', 'Facial recognition');
        conflictingPatterns.push(/\bface\s*recognition\b/i, /\bperson\s*re-?identification\b/i);
    }

    if (isFlow) {
        // Must exclude non-medical flow concepts
        conflictingPatterns.push(
            /astronomy/i, /galaxy\s*flow/i, /atmospheric\s*flow/i, /wind\s*tunnel/i,
            /airfoil/i, /aerodynamic/i, /combustion\s*chamber/i
        );
    }

    return {
        excludedDomains: [...new Set(excludedDomains)],
        excludedAnatomy: [...new Set(excludedAnatomy)],
        excludedTasks: [...new Set(excludedTasks)],
        conflictingPatterns,
    };
}



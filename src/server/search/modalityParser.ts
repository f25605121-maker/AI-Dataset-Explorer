/**
 * Universal Modality Parser
 *
 * Extracts and normalizes explicit data modality from dataset/model titles,
 * descriptions, tags, and formats.
 *
 * Prioritizes explicit keyword signals:
 * MRI, CT, Ultrasound, X-ray, Histopathology, Dermoscopy, Fundus, OCT, Audio, Tabular, Text, Video.
 */

export function extractExplicitModality(
    title?: string | null,
    description?: string | null,
    tags: string[] = [],
    formats: string[] = []
): string {
    const t = (title || '').toLowerCase();
    const d = (description || '').toLowerCase();
    const tagStr = tags.join(' ').toLowerCase();
    const fmtStr = formats.join(' ').toLowerCase();
    const combined = `${t} ${tagStr} ${fmtStr} ${d}`;

    // 1. High Priority Explicit Microscopy & Medical Imaging Signals
    if (/\b(?:cryo[- ]?e[mt]|cryo[- ]?electron|electron\s*tomography|subtomogram|macromolecule\s*structural|single[- ]particle\s*cryo)\b/i.test(combined)) {
        return 'Cryo-EM/ET';
    }
    if (/\b(?:fluorescen|confocal|immunofluorescen|gfp\b)\b/i.test(combined)) {
        return 'Fluorescence';
    }
    if (/\b(?:genom|transcriptom|rna[- ]?seq|single[- ]?cell|scrna)\b/i.test(combined)) {
        return 'Genomics/Tabular';
    }
    if (/\b(?:dce[- ]mri|flair|t1w?|t2w?|t2[- ]weighted|t1[- ]weighted|mr\s*imaging|mri|magnetic\s*resonance)\b/i.test(combined)) {
        return 'MRI';
    }
    if (/\b(?:computed\s*tomography|cta|ct\s*scans?|\bct\b|hrct|cbct)\b/i.test(combined)) {
        return 'CT';
    }
    if (/\b(?:x[- ]?ray|radiograph|radiography|\bcxr\b)\b/i.test(combined)) {
        return 'X-ray';
    }
    if (/\b(?:ultrasound|sonograph|sonography|echocardiogram|echocardiography|\bus\b)\b/i.test(combined)) {
        return 'Ultrasound';
    }
    if (/\b(?:histopatholog|patholog|whole\s*slide|wsi|h&e|biopsy)\b/i.test(combined)) {
        return 'Histopathology';
    }
    if (/\b(?:fundus|ophthalmoscop|retinal\s*imaging|retinal\s*photo)\b/i.test(combined)) {
        return 'Fundus Photography';
    }
    if (/\b(?:oct|optical\s*coherence\s*tomography)\b/i.test(combined)) {
        return 'OCT';
    }
    if (/\b(?:dermoscop|dermatoscop|skin\s*lesion\s*photo)\b/i.test(combined)) {
        return 'Dermoscopy';
    }
    if (/\b(?:pet\s*scan|positron\s*emission|\bpet\b|\bpet-ct\b|\bspect\b)\b/i.test(combined)) {
        return 'PET';
    }
    if (/\b(?:eeg|electroencephalogram|ieeg|ecog)\b/i.test(combined)) {
        return 'EEG';
    }

    // 2. High Priority Other Modalities
    if (/\b(?:audio|speech|voice|sound|acoustic|wav|mp3|flac)\b/i.test(combined)) {
        return 'Audio';
    }
    if (/\b(?:video|cctv|stream|mp4|avi|mov)\b/i.test(combined)) {
        return 'Video';
    }
    if (/\b(?:tabular|csv|tsv|spreadsheet|dataframe|structured\s*data|financial\s*data)\b/i.test(combined)) {
        return 'Tabular';
    }
    if (/\b(?:text|nlp|corpus|document|transcription|dialogue|chat)\b/i.test(combined)) {
        return 'Text';
    }
    if (/\b(?:point\s*cloud|lidar|3d\s*mesh)\b/i.test(combined)) {
        return '3D Point Cloud';
    }

    // 3. Fallback based on format
    if (/\b(?:nii|nii\.gz|mha|dcm|dicom)\b/i.test(fmtStr)) {
        return 'Volumetric Imaging (3D)';
    }
    if (/\b(?:png|jpg|jpeg|tif|tiff)\b/i.test(fmtStr)) {
        return 'Image';
    }

    return 'General';
}

/**
 * Hugging Face Provider Adapter
 *
 * Fetches and normalizes Datasets and Pretrained Models from Hugging Face Hub APIs.
 */

import { UnifiedCandidate, StructuredQueryUnderstanding } from '../types';
import { extractExplicitModality } from '../modalityParser';
import { classifyTask, canonicalTaskToHFPipelineTag } from '../taskAlignmentMatrix';


const HF_DATASETS_API = 'https://huggingface.co/api/datasets';
const HF_MODELS_API = 'https://huggingface.co/api/models';

function getHfHeaders(): Record<string, string> {
    const token = process.env.HUGGING_FACE_TOKEN || process.env.HUGGINGFACE_TOKEN || process.env.HF_API_KEY || process.env.HF_TOKEN;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function fetchHuggingFaceDatasets(
    queries: string[],
    understanding: StructuredQueryUnderstanding,
    poolLimit = 80
): Promise<UnifiedCandidate[]> {
    const candidates: UnifiedCandidate[] = [];
    const seenIds = new Set<string>();
    const headers = getHfHeaders();

    for (const q of queries.slice(0, 4)) {
        try {
            const url = `${HF_DATASETS_API}?search=${encodeURIComponent(q)}&full=true&limit=30`;
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 6000);

            const res = await fetch(url, { headers, signal: ctrl.signal, cache: 'no-store' });
            clearTimeout(tid);

            if (!res.ok) continue;

            const items = await res.json();
            if (!Array.isArray(items)) continue;

            for (const item of items) {
                const id = item.id || item._id || '';
                if (!id || seenIds.has(id)) continue;
                seenIds.add(id);

                const title = id.split('/').pop() || id;
                const desc = item.description || item.cardData?.description || item.cardData?.summary || '';
                const tags = Array.isArray(item.tags) ? item.tags : [];

                const formats: string[] = [];
                const blob = `${id} ${title} ${desc} ${tags.join(' ')}`.toLowerCase();
                if (/nii|\.nii\.gz|nifti/i.test(blob)) formats.push('nii.gz');
                if (/mha/i.test(blob)) formats.push('mha');
                if (/dicom/i.test(blob)) formats.push('dicom');
                if (/parquet/i.test(blob)) formats.push('parquet');
                if (/arrow/i.test(blob)) formats.push('arrow');
                const explicitModality = extractExplicitModality(
                    item.cardData?.pretty_name || title,
                    desc,
                    tags,
                    formats
                );

                candidates.push({
                    id,
                    source: 'huggingface',
                    type: 'dataset',
                    title: item.cardData?.pretty_name || title,
                    name: id,
                    description: desc,
                    tags,
                    modality: explicitModality,
                    url: `https://huggingface.co/datasets/${id}`,
                    license: item.cardData?.license || item.license || 'Open Access',
                    formats,
                    downloads: item.downloads || null,
                    likes: item.likes || null,
                    metadata: {
                        author: item.author,
                        private: item.private,
                        gated: item.gated,
                        cardData: item.cardData,
                    },
                    matchScore: 50,
                    
                    tier: 'Tier C',
                    evidenceLevel: 'UNVERIFIED',
                    evidenceSources: ['Hugging Face API'],
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
                });

                if (candidates.length >= poolLimit) break;
            }
        } catch {
            // Continue on timeout
        }
    }

    return candidates;
}

export async function fetchHuggingFaceModels(
    queries: string[],
    understanding: StructuredQueryUnderstanding,
    poolLimit = 80
): Promise<UnifiedCandidate[]> {
    const candidates: UnifiedCandidate[] = [];
    const seenIds = new Set<string>();
    const headers = getHfHeaders();

    // Determine HF pipeline_tag from the query's extracted task for precision filtering.
    // Uses the task alignment matrix to map canonical task â†’ HF API taxonomy.
    const queryTaskText = `${understanding.rawQuery} ${understanding.task || ''}`;
    const canonicalTask = classifyTask(queryTaskText);
    const hfPipelineTag = canonicalTask !== 'DISCOVERY' ? canonicalTaskToHFPipelineTag(canonicalTask) : null;

    for (const q of queries.slice(0, 4)) {
        try {
            // HF pipeline_tag is often inaccurate for medical models (e.g. tagging detection as classification)
            const url = `${HF_MODELS_API}?search=${encodeURIComponent(q)}&full=true&limit=30`;

            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 6000);

            const res = await fetch(url, { headers, signal: ctrl.signal, cache: 'no-store' });
            clearTimeout(tid);

            if (!res.ok) continue;

            const items = await res.json();
            if (!Array.isArray(items)) continue;

            for (const item of items) {
                const id = item.id || item._id || '';
                if (!id || seenIds.has(id)) continue;
                seenIds.add(id);

                const title = id.split('/').pop() || id;
                const desc = item.cardData?.description || item.cardData?.summary || '';
                const tags = Array.isArray(item.tags) ? item.tags : [];
                const pipelineTag = item.pipeline_tag || '';

                // Extract architecture if available
                let architecture = item.cardData?.model_type || item.config?.model_type || '';
                if (!architecture) {
                    if (/swin/i.test(id)) architecture = 'Swin UNETR Transformer';
                    else if (/unetr/i.test(id)) architecture = 'UNETR Transformer';
                    else if (/unet/i.test(id)) architecture = 'Residual U-Net';
                    else if (/vit/i.test(id)) architecture = 'Vision Transformer (ViT)';
                    else if (/segformer/i.test(id)) architecture = 'SegFormer';
                    else if (/yolo/i.test(id)) architecture = 'YOLO';
                    else architecture = 'Pretrained Transformer';
                }

                const explicitModality = extractExplicitModality(
                    item.cardData?.pretty_name || title,
                    desc,
                    tags,
                    []
                );

                candidates.push({
                    id,
                    source: 'huggingface',
                    type: 'model',
                    title: item.cardData?.pretty_name || title,
                    name: id,
                    description: desc,
                    tags,
                    modality: explicitModality,
                    url: `https://huggingface.co/${id}`,
                    pipelineTag,
                    architecture,
                    license: item.cardData?.license || item.license || 'Open Access',
                    downloads: item.downloads || null,
                    likes: item.likes || null,
                    metadata: {
                        pipeline_tag: pipelineTag,
                        library_name: item.library_name,
                        framework: item.library_name || 'PyTorch',
                    },
                    matchScore: 50,
                    
                    tier: 'Tier C',
                    evidenceLevel: 'UNVERIFIED',
                    evidenceSources: ['Hugging Face Hub'],
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
                });

                if (candidates.length >= poolLimit) break;
            }
        } catch {
            // Continue on timeout
        }
    }

    return candidates;
}

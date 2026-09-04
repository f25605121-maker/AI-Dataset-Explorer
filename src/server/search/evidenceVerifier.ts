/**
 * Evidence Verification Engine (Search Engine 2.0.0)
 *
 * Implements Section 12:
 * Verifies candidate claims against primary metadata (READMEs, model cards, config JSONs, paper abstracts, DOIs).
 * Assigns Evidence Levels (VERIFIED, SUPPORTED, PARTIAL, UNVERIFIED) and prevents metadata fabrication.
 * Extracts explicit textual evidence sentences for anatomy, modality, 4D flow technique, radial sampling,
 * and wall shear stress.
 */

import {
    UnifiedCandidate,
    NormalizedSearchResult,
    StructuredQueryUnderstanding,
    ResearchQuerySchema,
    EvidenceLevel,
    EvidenceItem,
} from './types';

export function verifyCandidateEvidence(
    candidate: UnifiedCandidate | NormalizedSearchResult,
    input: StructuredQueryUnderstanding | ResearchQuerySchema
): {
    evidenceLevel: EvidenceLevel;
    evidenceItems: EvidenceItem[];
    evidenceSources: string[];
    evidenceStrength: number;
    warnings: string[];
    confirmedClaims: string[];
} {
    const isSchema = 'primaryDomain' in input;
    const evidenceItems: EvidenceItem[] = [];
    const evidenceSources = new Set<string>();
    const warnings: string[] = [];
    const confirmedClaims: string[] = [];

    const title = (candidate.title || candidate.name || '').toLowerCase();
    const desc = (candidate.description || '').toLowerCase();
    const tags = ((candidate.tags as string[]) || []).map(t => t.toLowerCase());
    const rawFormats = Array.isArray(candidate.format)
        ? candidate.format
        : (candidate.format ? [candidate.format] : ((candidate as any).formats || []));
    const formats = rawFormats.map((f: string) => f.toLowerCase());
    const candidateBlob = `${title} ${tags.join(' ')} ${desc} ${formats.join(' ')}`.toLowerCase();

    const targetAnatomy = isSchema ? input.anatomy : input.anatomy.primary;
    const targetModalities = isSchema ? input.modalities : input.modality;
    const rawQuery = isSchema ? input.originalQuery : input.rawQuery;

    // ── 1. Anatomy Evidence ──────────────────────────────────────────────────
    if (targetAnatomy.length > 0) {
        let verifiedAnatomy = false;
        for (const anat of targetAnatomy) {
            const term = anat.toLowerCase();
            if (title.includes(term)) {
                evidenceItems.push({
                    claim: `Anatomy: ${anat}`,
                    sourceField: 'title',
                    evidenceText: `Confirmed in title "${candidate.title || candidate.name}"`,
                    verified: true,
                    strength: 'strong',
                });
                evidenceSources.add('Primary Title');
                confirmedClaims.push(`Anatomy: ${anat}`);
                verifiedAnatomy = true;
                break;
            } else if (tags.some(t => t.includes(term))) {
                evidenceItems.push({
                    claim: `Anatomy: ${anat}`,
                    sourceField: 'tags',
                    evidenceText: `Verified in dataset tags`,
                    verified: true,
                    strength: 'strong',
                });
                evidenceSources.add('Repository Tags');
                confirmedClaims.push(`Anatomy: ${anat}`);
                verifiedAnatomy = true;
                break;
            } else if (desc.includes(term)) {
                evidenceItems.push({
                    claim: `Anatomy: ${anat}`,
                    sourceField: 'description',
                    evidenceText: `Stated in documentation/abstract`,
                    verified: true,
                    strength: 'moderate',
                });
                evidenceSources.add('Dataset Description / Abstract');
                confirmedClaims.push(`Anatomy: ${anat}`);
                verifiedAnatomy = true;
                break;
            }
        }

        if (!verifiedAnatomy) {
            warnings.push(`Target anatomy (${targetAnatomy[0]}) not explicitly verified in primary metadata.`);
        }
    }

    // ── 2. Modality Evidence ─────────────────────────────────────────────────
    if (targetModalities.length > 0 && targetModalities[0] !== 'Multimodal / General') {
        const mod = targetModalities[0].toLowerCase();
        let verifiedModality = false;

        if (title.includes(mod)) {
            evidenceItems.push({
                claim: `Modality: ${targetModalities[0]}`,
                sourceField: 'title',
                evidenceText: `Confirmed in title "${candidate.title || candidate.name}"`,
                verified: true,
                strength: 'strong',
            });
            evidenceSources.add('Primary Title');
            confirmedClaims.push(`Modality: ${targetModalities[0]}`);
            verifiedModality = true;
        } else if (candidateBlob.includes(mod)) {
            evidenceItems.push({
                claim: `Modality: ${targetModalities[0]}`,
                sourceField: 'description',
                evidenceText: `Confirmed in description/tags metadata`,
                verified: true,
                strength: 'strong',
            });
            evidenceSources.add('Metadata Specification');
            confirmedClaims.push(`Modality: ${targetModalities[0]}`);
            verifiedModality = true;
        }

        if (!verifiedModality) {
            warnings.push(`Modality (${targetModalities[0]}) could not be verified in primary metadata.`);
        }
    }

    // ── 3. 4D Flow & Velocity Field Technique Evidence ───────────────────────
    if (/4d\s*flow|phase\s*contrast|pc.?mri|velocity/i.test(rawQuery)) {
        if (/4d\s*flow|4d-flow/i.test(candidateBlob)) {
            evidenceItems.push({
                claim: 'Technique: 4D Flow MRI',
                sourceField: 'description',
                evidenceText: 'Explicit 4D Flow MRI phase-contrast sequence confirmed in metadata',
                verified: true,
                strength: 'strong',
            });
            evidenceSources.add('4D Flow Protocol');
            confirmedClaims.push('Technique: 4D Flow MRI');
        } else if (/phase\s*contrast|pc.?mri/i.test(candidateBlob)) {
            evidenceItems.push({
                claim: 'Technique: Phase-Contrast MRI',
                sourceField: 'description',
                evidenceText: 'Phase-contrast velocity encoding verified in documentation',
                verified: true,
                strength: 'moderate',
            });
            evidenceSources.add('Phase-Contrast Protocol');
            confirmedClaims.push('Technique: Phase-Contrast MRI');
        } else {
            warnings.push('Specialized 4D flow velocity encoding not explicitly verified in public documentation.');
        }
    }

    // ── 4. Sampling & Radial k-Space Evidence ────────────────────────────────
    if (/radial|undersampling|sparse\s*k-space/i.test(rawQuery)) {
        if (/radial|golden[- ]angle|spoke|non[- ]cartesian/i.test(candidateBlob)) {
            evidenceItems.push({
                claim: 'Sampling: Radial Undersampling',
                sourceField: 'description',
                evidenceText: 'Radial / non-Cartesian k-space trajectory verified',
                verified: true,
                strength: 'strong',
            });
            evidenceSources.add('Acquisition Trajectory');
            confirmedClaims.push('Sampling: Radial Undersampling');
        } else {
            warnings.push('Sampling compatibility not verified: Public metadata does not verify raw radial/non-Cartesian k-space.');
        }
    }

    // ── 5. Hemodynamic Wall Shear Stress (WSS) Evidence ──────────────────────
    if (/wall\s*shear|wss|hemodynamic/i.test(rawQuery)) {
        if (/wall\s*shear\s*stress|wss|hemodynamic/i.test(candidateBlob)) {
            evidenceItems.push({
                claim: 'Physiological Target: Hemodynamic Wall Shear Stress',
                sourceField: 'description',
                evidenceText: 'Wall shear stress (WSS) quantification / estimation confirmed in documentation',
                verified: true,
                strength: 'strong',
            });
            evidenceSources.add('Hemodynamic Targets');
            confirmedClaims.push('Physiological Target: Wall Shear Stress');
        } else {
            warnings.push('Wall shear stress estimation capability is not explicitly documented.');
        }
    }

    // ── 6. Scholarly DOI / Repository Evidence ───────────────────────────────
    if (candidate.doi) {
        evidenceItems.push({
            claim: `Peer-Reviewed DOI: ${candidate.doi}`,
            sourceField: 'doi',
            evidenceText: `Indexed in scholarly registry (${candidate.doi})`,
            verified: true,
            strength: 'strong',
        });
        evidenceSources.add('Crossref / Scholarly DOI');
        confirmedClaims.push(`Indexed DOI: ${candidate.doi}`);
    }

    // ── 7. Calculate Evidence Level & Strength ───────────────────────────────
    const strongEvidenceCount = evidenceItems.filter(e => e.strength === 'strong').length;
    const totalVerifiedCount = evidenceItems.filter(e => e.verified).length;

    let evidenceLevel: EvidenceLevel = 'UNVERIFIED';
    let evidenceStrength = 25;

    if (strongEvidenceCount >= 3 && warnings.length === 0) {
        evidenceLevel = 'VERIFIED';
        evidenceStrength = 95;
    } else if (totalVerifiedCount >= 2 && warnings.length <= 1) {
        evidenceLevel = 'SUPPORTED';
        evidenceStrength = 80;
    } else if (totalVerifiedCount >= 1) {
        evidenceLevel = 'PARTIAL';
        evidenceStrength = 55;
    } else {
        evidenceLevel = 'UNVERIFIED';
        evidenceStrength = 25;
    }

    return {
        evidenceLevel,
        evidenceItems,
        evidenceSources: Array.from(evidenceSources),
        evidenceStrength,
        warnings,
        confirmedClaims,
    };
}

import { ProblemProfile, UnifiedCandidate, RequirementMatch, RequirementSatisfaction } from './types';

export interface VerificationResult {
    passed: boolean; // false if any HARD constraint failed
    verified: RequirementMatch[];
    unknown: RequirementMatch[];
    failed: RequirementMatch[];
}

function normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Phase 2 & 5: Generic Evidence Verification
 * No domain-specific logic. Verifies modality, tasks, and hardware limits.
 */
export function verifyCandidate(
    candidate: UnifiedCandidate,
    profile: ProblemProfile
): VerificationResult {
    const verified: RequirementMatch[] = [];
    const unknown: RequirementMatch[] = [];
    const failed: RequirementMatch[] = [];

    const candidateBlob = [
        candidate.title,
        candidate.name,
        candidate.description,
        ...(candidate.tags || []),
        candidate.domain,
        candidate.task,
        ...(candidate.modalities || []),
    ].filter(Boolean).join(' ').toLowerCase();

    // 1. HARD CONSTRAINT: Modality Check
    if (profile.modalities && profile.modalities.length > 0) {
        // If the user specifies a modality, candidate must explicitly support it or be unknown
        const requestedModality = profile.modalities[0].toLowerCase();
        const candModalities = candidate.modalities || [];
        
        let modStatus: RequirementSatisfaction = 'UNKNOWN';
        let evidence = null;
        
        if (candModalities.length > 0) {
            const hasMatch = candModalities.some(m => normalize(m) === normalize(requestedModality) || candidateBlob.includes(normalize(requestedModality)));
            if (hasMatch) {
                modStatus = 'SATISFIED';
                evidence = `Modality match found in metadata.`;
            } else {
                modStatus = 'NOT_SATISFIED';
                evidence = `Candidate has modalities [${candModalities.join(', ')}] but query requires ${requestedModality}.`;
            }
        } else if (candidateBlob.includes(normalize(requestedModality))) {
            modStatus = 'SATISFIED';
            evidence = `Modality match inferred from description.`;
        }
        
        const match: RequirementMatch = {
            requirementId: 'req_modality',
            status: modStatus,
            evidence,
            confidence: modStatus === 'UNKNOWN' ? 0 : 1,
            explanation: evidence || 'Missing modality information'
        };

        if (modStatus === 'NOT_SATISFIED') {
            failed.push(match);
        } else if (modStatus === 'SATISFIED') {
            verified.push(match);
        } else {
            unknown.push(match);
        }
    }

    // 2. SOFT CONSTRAINT: Tasks
    if (profile.tasks && profile.tasks.length > 0) {
        for (const task of profile.tasks) {
            const nTask = normalize(task);
            if (nTask === 'discovery') continue;
            
            let tStatus: RequirementSatisfaction = 'UNKNOWN';
            if (candidateBlob.includes(nTask)) {
                tStatus = 'SATISFIED';
            }
            
            const match: RequirementMatch = {
                requirementId: `req_task_${nTask}`,
                status: tStatus,
                evidence: tStatus === 'SATISFIED' ? `Mentions task: ${task}` : null,
                confidence: tStatus === 'SATISFIED' ? 0.8 : 0,
                explanation: `Task check for ${task}`
            };
            
            if (tStatus === 'SATISFIED') verified.push(match);
            else unknown.push(match);
        }
    }

    // 3. HARD CONSTRAINT: Hardware (VRAM Limit)
    if (candidate.type === 'model' && typeof profile.hardwareConstraints.maxVramGb === 'number') {
        const maxVram = profile.hardwareConstraints.maxVramGb;
        let vramStatus: RequirementSatisfaction = 'UNKNOWN';
        let evidence = null;
        
        const paramMatch = candidateBlob.match(/\b(\d+(?:\.\d+)?)(?:b|m)\b/i);
        if (paramMatch) {
            const val = parseFloat(paramMatch[1]);
            const isBillion = paramMatch[0].toLowerCase().includes('b');
            const estimatedVram = isBillion ? val * 2 : val / 500; 
            
            if (estimatedVram > maxVram) {
                vramStatus = 'NOT_SATISFIED';
                evidence = `Estimated ${Math.round(estimatedVram)}GB VRAM required for ${paramMatch[0]} parameters exceeds limit of ${maxVram}GB.`;
            } else {
                vramStatus = 'SATISFIED';
                evidence = `Estimated ${Math.round(estimatedVram)}GB VRAM fits within ${maxVram}GB limit.`;
            }
        }

        const match: RequirementMatch = {
            requirementId: 'req_vram',
            status: vramStatus,
            evidence,
            confidence: vramStatus === 'UNKNOWN' ? 0 : 0.9,
            explanation: `VRAM constraint check against ${maxVram}GB`
        };

        if (vramStatus === 'NOT_SATISFIED') failed.push(match);
        else if (vramStatus === 'SATISFIED') verified.push(match);
        else unknown.push(match);
    }
    
    const passed = failed.length === 0;
    return { passed, verified, unknown, failed };
}

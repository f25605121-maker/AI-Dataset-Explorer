
import { parseResearchQuery, understandQuery } from './src/server/search/queryUnderstanding';
import { expandQueries } from './src/server/search/queryExpansion';
import { retrieveAllCandidates } from './src/server/search/providers';
import { rerankCandidatesWithConfidence } from './src/server/search/reranker';
import { getRequirementProfile } from './src/server/search/requirementExtractor';

async function run() {
    const q = 'crop-yield/multispectral';
    const schema = parseResearchQuery(q);
    const understanding = understandQuery(q);
    const expanded = expandQueries(schema);
    const rawPools = await retrieveAllCandidates(expanded, understanding);
    
    const rerankedDatasets = rerankCandidatesWithConfidence(rawPools.datasets, schema, 100);
    const rerankedPapers = rerankCandidatesWithConfidence(rawPools.papers, schema, 100);
    
    const profile = getRequirementProfile(q);
    
    const printFailed = (cand) => {
        const failed = cand.requirementMatches?.filter(m => m.status === 'NOT_SATISFIED').map(m => m.requirementId) || [];
        console.log(cand.title, 'FAILED:', failed, 'SCORE:', cand.matchScore);
    };
    
    console.log('--- Datasets ---');
    rerankedDatasets.candidates.slice(0, 5).forEach(printFailed);
    console.log('--- Papers ---');
    rerankedPapers.candidates.slice(0, 5).forEach(printFailed);
}
run().catch(console.error);


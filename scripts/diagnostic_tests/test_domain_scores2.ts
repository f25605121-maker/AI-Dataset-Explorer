
(global as any).__DEBUG_SCORING = true;
import { parseResearchQuery, understandQuery } from './src/server/search/queryUnderstanding';
import { expandQueries } from './src/server/search/queryExpansion';
import { retrieveAllCandidates } from './src/server/search/providers';
import { scoreCandidate } from './src/server/search/scoring';

async function run() {
    const q = 'crop-yield/multispectral';
    const schema = parseResearchQuery(q);
    const understanding = understandQuery(q);
    const expanded = expandQueries(schema);
    const rawPools = await retrieveAllCandidates(expanded, understanding);
    
    let allCandidates = [...rawPools.datasets, ...rawPools.models, ...rawPools.papers];
    
    if (allCandidates.length > 0) {
        console.log('Scoring candidate:', allCandidates[0].title);
        scoreCandidate(allCandidates[0], schema);
    }
}
run().catch(console.error);


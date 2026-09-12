
import { parseResearchQuery, understandQuery } from './src/server/search/queryUnderstanding';
import { expandQueries } from './src/server/search/queryExpansion';
import { retrieveAllCandidates } from './src/server/search/providers';
import { scoreCandidate } from './src/server/search/scoring';

async function run() {
    try {
        const q = 'crop-yield/multispectral';
        const schema = parseResearchQuery(q);
        const understanding = understandQuery(q);
        const expanded = expandQueries(schema);
        const rawPools = await retrieveAllCandidates(expanded, understanding);
        
        if (rawPools.papers.length > 0) {
            console.log('Scoring paper:', rawPools.papers[0].title);
            const scored = scoreCandidate(rawPools.papers[0], schema);
            console.log('Final matchScore:', scored.matchScore);
        }
    } catch (e) {
        console.error('EXCEPTION:', e);
    }
}
run().catch(console.error);


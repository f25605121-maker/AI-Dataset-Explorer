
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
        
        let allCandidates = [...rawPools.datasets, ...rawPools.models, ...rawPools.papers];
        console.log('Total candidates to score:', allCandidates.length);
        
        for (const cand of allCandidates) {
            try {
                scoreCandidate(cand, schema);
            } catch (e) {
                console.error('EXCEPTION SCORING:', cand.title || cand.name);
                console.error(e);
            }
        }
        console.log('Done scoring all candidates');
    } catch (e) {
        console.error('OUTER EXCEPTION:', e);
    }
}
run().catch(console.error);


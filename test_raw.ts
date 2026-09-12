import { parseResearchQuery, understandQuery } from './src/server/search/queryUnderstanding'; import { expandQueries } from './src/server/search/queryExpansion'; import { retrieveAllCandidates } from './src/server/search/providers';
async function run() {
    const q = 'crop-yield/multispectral';
    const schema = parseResearchQuery(q);
    const understanding = understandQuery(q);
    const expanded = expandQueries(schema);
    const rawPools = await retrieveAllCandidates(expanded, understanding);
    require('fs').writeFileSync('raw_pools.json', JSON.stringify(rawPools, null, 2));
    console.log('Done.');
}
run().catch(console.error);

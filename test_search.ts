import { advancedResearchSearch } from './src/server/search/searchEngine';
async function run() {
    console.log('Running...');
    const result = await advancedResearchSearch('crop-yield/multispectral', { bypassCache: true });
    require('fs').writeFileSync('crop_yield_result.json', JSON.stringify(result, null, 2));
    console.log('Done.');
}
run().catch(console.error);

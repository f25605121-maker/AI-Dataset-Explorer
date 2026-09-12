
import { advancedResearchSearch } from './src/server/search/searchEngine';
async function run() {
    const res = await advancedResearchSearch('crop-yield/multispectral');
    console.log('Datasets length:', Array.isArray(res.datasets) ? res.datasets.length : res.datasets);
    console.log('Models length:', Array.isArray(res.models) ? res.models.length : res.models);
    console.log('Papers length:', Array.isArray(res.papers) ? res.papers.length : res.papers);
    
    if (Array.isArray(res.datasets)) console.log('Top dataset:', res.datasets[0]?.title, res.datasets[0]?.matchScore);
    if (Array.isArray(res.models)) console.log('Top model:', res.models[0]?.title, res.models[0]?.matchScore);
    if (Array.isArray(res.papers)) console.log('Top paper:', res.papers[0]?.title, res.papers[0]?.matchScore);
}
run().catch(console.error);


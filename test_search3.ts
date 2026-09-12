
import { advancedSearch } from './src/server/search/retrieval';
async function run() {
    const res = await advancedSearch('crop-yield/multispectral');
    
    if (res.datasets?.length) {
        console.log('--- Datasets ---');
        res.datasets.slice(0, 2).forEach(d => console.log(d.title, d.matchScore));
    }
    if (res.models?.length) {
        console.log('--- Models ---');
        res.models.slice(0, 2).forEach(m => console.log(m.title, m.matchScore));
    }
    if (res.papers?.length) {
        console.log('--- Papers ---');
        res.papers.slice(0, 2).forEach(p => console.log(p.title, p.matchScore));
    }
}
run().catch(console.error);


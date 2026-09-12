
import { advancedSearch } from './src/server/search/retrieval';
async function run() {
    const res = await advancedSearch('crop-yield/multispectral');
    console.log('Datasets length:', res.datasets?.length);
    console.log('Models length:', res.models?.length);
    console.log('Papers length:', res.papers?.length);
    
    if (res.datasets?.length) console.log('Top dataset:', res.datasets[0]?.title, res.datasets[0]?.matchScore);
    if (res.models?.length) console.log('Top model:', res.models[0]?.title, res.models[0]?.matchScore);
    if (res.papers?.length) console.log('Top paper:', res.papers[0]?.title, res.papers[0]?.matchScore);
}
run().catch(console.error);


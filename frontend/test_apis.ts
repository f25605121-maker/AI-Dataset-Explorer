import { searchKaggleDatasets } from './src/app/api/search/services/kaggle/searchDatasets';
import { searchHuggingFaceModels } from './src/app/api/search/services/huggingface/searchModels';
import { searchHuggingFaceDatasets } from './src/app/api/search/services/huggingface/searchDatasets';
import { parseQuery } from './src/app/api/search/services/queryUnderstanding/queryParser';
import { expandQueries } from './src/app/api/search/services/queryUnderstanding/queryExpander';

async function main() {
    // Test with a coronary artery query (the key test case)
    const query = 'coronary artery segmentation CT dataset';
    const qu = parseQuery(query, 'DATASET_SEARCH');
    const expanded = expandQueries(qu);

    console.log('Query Understanding:', JSON.stringify({
        domain: qu.domain.value, domain_state: qu.domain.state,
        task: qu.task.value, task_state: qu.task.state,
        target: qu.target.value, target_state: qu.target.state,
        modality: qu.modality.value, modality_state: qu.modality.state,
    }, null, 2));

    console.log('Search queries:', expanded.allQueries);

    console.log('\nSearching Kaggle Datasets...');
    const kaggleResults = await searchKaggleDatasets(qu, expanded);
    console.log(`Found ${kaggleResults.length} Kaggle datasets.`);
    if (kaggleResults.length > 0) {
        kaggleResults.slice(0, 3).forEach(ds => {
            console.log(` - ${ds.name} | score=${ds.matchScore} | modality=${ds.modality} | task=${ds.task}`);
        });
    }

    console.log('\nSearching Hugging Face Datasets...');
    const hfDsResults = await searchHuggingFaceDatasets(qu, expanded);
    console.log(`Found ${hfDsResults.length} HF datasets.`);
    hfDsResults.slice(0, 3).forEach(ds => {
        console.log(` - ${ds.name} | modality=${ds.modality} | task=${ds.task}`);
    });

    console.log('\nSearching Hugging Face Models...');
    const hfResults = await searchHuggingFaceModels(qu, expanded);
    console.log(`Found ${hfResults.length} Hugging Face models.`);
    hfResults.slice(0, 3).forEach(m => {
        console.log(` - ${m.name} | arch=${m.architecture} | task=${m.task}`);
    });
}

main().catch(console.error);

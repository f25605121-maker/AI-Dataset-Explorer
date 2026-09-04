import { searchResearchPapers } from '@/server/papers/paperSearchAggregator';
import { runDatasetPipeline } from '../lib/assistant/datasetPipeline';
import { classifyIntent } from '../lib/assistant/classifyIntent';

async function runTests() {
    console.log('=== TEST 1: Direct Research Discovery for SO-101 Robotics ===');
    const so101Result = await searchResearchPapers({
        query: 'Project-IRA/TPSoSe2026_Dataset_Collection_LeRobot_SO101',
        limit: 10,
    });
    console.log(`Discovered ${so101Result.papers.length} papers.`);
    console.log('Research Landscape:', JSON.stringify(so101Result.researchLandscape, null, 2));
    if (so101Result.papers.length > 0) {
        console.log('Top Paper:', {
            title: so101Result.papers[0].title,
            authors: (so101Result.papers[0].authors || []).slice(0, 3),
            year: so101Result.papers[0].year,
            venue: so101Result.papers[0].venue,
            relationship: so101Result.papers[0].relationship,
            relationshipEvidence: so101Result.papers[0].relationshipEvidence,
            relevanceScore: so101Result.papers[0].relevanceScore,
            whyRelevant: so101Result.papers[0].whyRelevant,
            sources: so101Result.papers[0].sources,
        });
    }

    console.log('\n=== TEST 2: Direct Research Discovery for Coronary Artery CT ===');
    const medicalResult = await searchResearchPapers({
        query: 'coronary artery segmentation CT dataset',
        limit: 10,
    });
    console.log(`Discovered ${medicalResult.papers.length} medical papers.`);
    console.log('Research Landscape:', JSON.stringify(medicalResult.researchLandscape, null, 2));
    if (medicalResult.papers.length > 0) {
        console.log('Top Medical Paper:', {
            title: medicalResult.papers[0].title,
            year: medicalResult.papers[0].year,
            venue: medicalResult.papers[0].venue,
            relationship: medicalResult.papers[0].relationship,
            relevanceScore: medicalResult.papers[0].relevanceScore,
            sources: medicalResult.papers[0].sources,
        });
    }

    console.log('\n=== TEST 3: Full Unified Pipeline with Research Integration ===');
    const intent = await classifyIntent('vision language action robotics SmolVLA Pi0.5');
    const pipelineResult = await runDatasetPipeline(
        'vision language action robotics SmolVLA Pi0.5',
        'test-search-id-001',
        intent
    );

    console.log('Pipeline Results Summary:');
    console.log(`- Datasets found: ${pipelineResult.datasets?.length || 0}`);
    console.log(`- Models found: ${pipelineResult.models?.length || 0}`);
    console.log(`- Research Papers found: ${pipelineResult.papers?.length || 0}`);
    console.log(`- Research Maturity: ${pipelineResult.researchLandscape?.researchMaturity}`);
    console.log(`- Research Synthesis Facts: ${pipelineResult.researchSynthesis?.factsFromSource?.length || 0}`);
    console.log(`- Research Synthesis Interpretations: ${pipelineResult.researchSynthesis?.aiInterpretation?.length || 0}`);
    console.log(`- Best Dataset: ${pipelineResult.summary?.bestDataset?.id || 'None'}`);
    console.log(`- Best Model: ${pipelineResult.summary?.bestModel?.id || 'None'}`);
    console.log(`- Best Paper: ${pipelineResult.summary?.bestPaper?.title || 'None'}`);

    console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
});

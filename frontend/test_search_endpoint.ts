import { NextRequest } from 'next/server';
import { POST } from './src/app/api/search/route';

async function runTest() {
    console.log('=====================================================');
    console.log('      TESTING 7-STEP SEARCH PIPELINE ENDPOINT        ');
    console.log('=====================================================\n');

    const testQuery = 'Coronary artery segmentation CT dataset';
    console.log(`[Step 1] Sending prompt: "${testQuery}"`);

    const req = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery }),
    });

    const startTime = Date.now();
    const response = await POST(req);
    const duration = Date.now() - startTime;

    console.log(`[HTTP Response Status]: ${response.status} (${duration}ms)`);
    const data = await response.json();

    if (!data.success) {
        console.error('Search pipeline returned failure:', data);
        return;
    }

    console.log('\n[Step 2: Intent & Query Gen]');
    console.log('  Intent:', data.intent);
    console.log('  Domain:', data.summary?.domain);
    console.log('  Task:', data.summary?.task);
    console.log('  Modality:', data.summary?.dataType);

    console.log('\n[Step 3 & 4: Multi-Source Discovery]');
    console.log(`  Kaggle Datasets: ${data.results?.kaggle?.length || 0}`);
    console.log(`  HF Datasets: ${data.results?.hfDatasets?.length || 0}`);
    console.log(`  HF Models: ${data.results?.hfModels?.length || 0}`);

    console.log('\n[Step 5: Normalization, Deduplication & Scoring]');
    if (data.datasets && data.datasets.length > 0) {
        console.log('  Top 3 Ranked Datasets:');
        data.datasets.slice(0, 3).forEach((d: any, i: number) => {
            console.log(`    ${i + 1}. [${d.source}] ${d.name} (Score: ${d.matchScore}/100, Modality: ${d.modality}, Task: ${d.task})`);
        });
    }

    if (data.models && data.models.length > 0) {
        console.log('  Top 3 Ranked Models:');
        data.models.slice(0, 3).forEach((m: any, i: number) => {
            console.log(`    ${i + 1}. [HF] ${m.name} (Score: ${m.matchScore}/100, Arch: ${m.architecture})`);
        });
    }

    console.log('\n[Step 6: Rationale & Synthesis]');
    if (data.analysis?.ai_analysis) {
        console.log('  AI Analysis:', data.analysis.ai_analysis.slice(0, 200) + '...');
    } else {
        console.log('  (Evidence-based synthesis ready; AI key provider status logged in audit)');
    }

    console.log('\n[Step 7: Output Dashboard Payload]');
    console.log('  Feasibility Score:', data.feasibility?.feasibility_score);
    console.log('  Hardware GPU:', data.hardware?.gpu_recommendation);
    console.log('  Estimated VRAM:', data.hardware?.vram_estimate);
    console.log('  API Audit Status:', JSON.stringify(data.apiAudit));

    console.log('\n=====================================================');
    console.log('             SEARCH PIPELINE TEST PASSED!            ');
    console.log('=====================================================');
}

runTest().catch(console.error);

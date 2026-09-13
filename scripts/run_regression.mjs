import fs from 'fs';

const TEST_QUERIES = [
    {
        id: 1,
        name: "Lung Cancer 3D CT",
        query: "Lung cancer / 3D chest CT (classification + detection + segmentation, 10GB)"
    },
    {
        id: 2,
        name: "Aircraft Fuselage Defects",
        query: "Aircraft fuselage skin panel defects / 2D RGB (classification + detection + segmentation, 8GB)"
    },
    {
        id: 3,
        name: "Crop Yield & Disease",
        query: "Crop yield + disease / multispectral satellite (regression + classification + segmentation, 6GB)"
    },
    {
        id: 4,
        name: "Customer Support Ticket Triage",
        query: "Customer support ticket triage / multilingual text (classification + priority + NER + summarization, 12GB)"
    }
];

const API_ENDPOINT = process.env.SEARCH_API_URL || 'http://localhost:3000/api/search';

async function runQuery(testCase) {
    const t0 = Date.now();
    try {
        const res = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: testCase.query, bypassCache: true })
        });

        if (!res.ok) {
            return {
                id: testCase.id,
                name: testCase.name,
                query: testCase.query,
                error: `HTTP ${res.status}: ${res.statusText}`,
                elapsedMs: Date.now() - t0
            };
        }

        const data = await res.json();
        const elapsedMs = Date.now() - t0;

        const diag = data.diagnostics || {};
        const parsed = diag.parsedQuery || data.understanding || {};
        const hard = data.hardware || {};

        const domain = parsed.domain || parsed.primaryDomain || data.domain || 'N/A';
        const tasks = parsed.tasks || parsed.predictionTasks || parsed.task || [];
        const taskList = Array.isArray(tasks) ? tasks : [tasks];

        const datasets = data.datasets || [];
        const models = data.models || [];
        const papers = data.papers || [];

        const topDatasetScores = datasets.slice(0, 2).map(d => ({
            title: d.title || d.name,
            score: d.matchScore,
            tier: d.tier,
            evidence: d.evidenceLevel
        }));

        const topModelScores = models.slice(0, 2).map(m => ({
            title: m.title || m.name,
            score: m.matchScore,
            tier: m.tier,
            evidence: m.evidenceLevel
        }));

        const topPaperScores = papers.slice(0, 2).map(p => ({
            title: p.title || p.name,
            score: p.matchScore,
            tier: p.tier,
            evidence: p.evidenceLevel
        }));

        return {
            id: testCase.id,
            name: testCase.name,
            query: testCase.query,
            elapsedMs,
            domainExtracted: domain,
            tasksExtracted: taskList,
            hardwareExtracted: hard.vram_estimate || hard.gpu_recommendation || (parsed.hardwareConstraints ? `${parsed.hardwareConstraints.maxVramGb}GB` : 'N/A'),
            hardwareFull: hard,
            counts: {
                datasets: datasets.length,
                models: models.length,
                papers: papers.length,
                total: datasets.length + models.length + papers.length
            },
            topScores: {
                datasets: topDatasetScores,
                models: topModelScores,
                papers: topPaperScores
            },
            confidenceStatus: data.diagnostics?.confidenceStatus || (datasets[0]?.matchScore >= 60 ? 'HIGH' : 'LOW/PARTIAL'),
            synthesis: (data.scientificSynthesis || '').slice(0, 140) + '...'
        };
    } catch (err) {
        return {
            id: testCase.id,
            name: testCase.name,
            query: testCase.query,
            error: err.message,
            elapsedMs: Date.now() - t0
        };
    }
}

async function main() {
    console.log(`========================================================================`);
    console.log(`RUNNING 4-QUERY REGRESSION SUITE against ${API_ENDPOINT}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`========================================================================\n`);

    const results = [];
    for (const testCase of TEST_QUERIES) {
        process.stdout.write(`Executing Query ${testCase.id}: "${testCase.name}"... `);
        const result = await runQuery(testCase);
        if (result.error) {
            console.log(`FAILED (${result.elapsedMs}ms) - ${result.error}`);
        } else {
            console.log(`DONE (${result.elapsedMs}ms) - D:${result.counts.datasets} M:${result.counts.models} P:${result.counts.papers}`);
        }
        results.push(result);
    }

    console.log(`\n========================================================================`);
    console.log(`REGRESSION SUMMARY REPORT`);
    console.log(`========================================================================\n`);

    for (const r of results) {
        console.log(`------------------------------------------------------------------------`);
        console.log(`QUERY #${r.id}: ${r.name}`);
        console.log(`Raw Query: "${r.query}"`);
        if (r.error) {
            console.log(`  ERROR: ${r.error}`);
            continue;
        }
        console.log(`  Domain Extracted:   ${JSON.stringify(r.domainExtracted)}`);
        console.log(`  Tasks Extracted:    ${JSON.stringify(r.tasksExtracted)}`);
        console.log(`  Hardware Preserved: ${JSON.stringify(r.hardwareExtracted)}`);
        console.log(`  Counts:             Datasets: ${r.counts.datasets}, Models: ${r.counts.models}, Papers: ${r.counts.papers}`);
        console.log(`  Top Datasets:       ${r.topScores.datasets.map(d => `${d.score}% [${d.tier}] ${d.title.slice(0, 30)}`).join(' | ') || 'None'}`);
        console.log(`  Top Models:         ${r.topScores.models.map(m => `${m.score}% [${m.tier}] ${m.title.slice(0, 30)}`).join(' | ') || 'None'}`);
        console.log(`  Top Papers:         ${r.topScores.papers.map(p => `${p.score}% [${p.tier}] ${p.title.slice(0, 30)}`).join(' | ') || 'None'}`);
        console.log(`  Synthesis Snippet:  ${r.synthesis}`);
    }

    fs.writeFileSync('./regression_results.json', JSON.stringify(results, null, 2));
    console.log(`\nFull report saved to ./regression_results.json\n`);
}

main().catch(console.error);

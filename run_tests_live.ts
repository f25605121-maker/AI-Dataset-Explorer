import fs from 'fs';

const queries = [
    "I want to classify diabetic retinopathy from retinal fundus photographs using 5 severity classes.",
    "I need a model for lung cancer detection using chest CT scans.",
    "I need longitudinal Alzheimer's prediction using 3D T1 MRI combined with clinical and cognitive information.",
    "I need pneumonia classification from chest X-ray images.",
    "I need retinal OCT segmentation.",
    "I need 3D brain tumor MRI segmentation."
];

async function runTests() {
    const results = [];
    for (let i = 0; i < queries.length; i++) {
        console.log(`Running query ${i + 1}: ${queries[i]}`);
        try {
            const res = await fetch("https://ai-dataset-explorer-web-production.up.railway.app/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: queries[i] })
            });
            const data = await res.json();
            results.push({ query: queries[i], response: data });
        } catch (e: any) {
            console.error(`Error on query ${i + 1}:`, e.message);
            results.push({ query: queries[i], error: e.message });
        }
    }
    fs.writeFileSync('c:/Users/01-135231-091/.gemini/antigravity/brain/7fcb9e32-75b2-467f-95f7-f566b591aadb/scratch/test_results_live.json', JSON.stringify(results, null, 2));
    console.log("Done.");
}

runTests();

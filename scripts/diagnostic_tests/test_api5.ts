
async function run() {
    const q = 'crop-yield/multispectral dataset';
    const res = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, searchId: '127' })
    }).then(r => r.json());
    console.log('Datasets returned:', res.datasets?.length || (res.datasets as any)?.status);
}
run().catch(console.error);


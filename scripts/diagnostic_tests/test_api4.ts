
async function run() {
    const q = 'medical mri brain dataset';
    const res = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, searchId: '126' })
    }).then(r => r.json());
    console.log('Datasets returned:', res.datasets?.length || (res.datasets as any)?.status);
    if (res.datasets?.length > 0) {
        console.log('Top Dataset:', res.datasets[0].title);
    }
}
run().catch(console.error);


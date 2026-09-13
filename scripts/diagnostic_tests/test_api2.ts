
const q = 'medical mri brain dataset';
fetch('http://localhost:3000/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, searchId: '124' })
}).then(res => res.text()).then(console.log).catch(console.error);


import { NextRequest } from 'next/server';
import { POST } from './src/app/api/search/route';

async function testVehicleDetection() {
    const query = "I want to build a real-time AI system that detects and tracks vehicles such as cars, buses, trucks, and motorcycles from CCTV or roadside traffic camera video. The system should detect each vehicle using bounding boxes, assign a vehicle class, track the same vehicle across consecutive video frames, and count vehicles passing through a predefined road region.";
    
    console.log('Testing query:', query.slice(0, 100) + '...');
    const req = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });

    const response = await POST(req);
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Domain:', data.summary?.domain);
    console.log('Task:', data.summary?.task);
    console.log('Modality:', data.summary?.dataType);
    console.log(`Datasets Found: ${data.datasets?.length}`);
    console.log(`Models Found: ${data.models?.length}`);
    if (data.datasets?.[0]) {
        console.log('Top Dataset:', data.datasets[0].name, '| Score:', data.datasets[0].matchScore, '| Source:', data.datasets[0].source);
    }
    if (data.models?.[0]) {
        console.log('Top Model:', data.models[0].name, '| Score:', data.models[0].matchScore, '| Arch:', data.models[0].architecture);
    }
}

testVehicleDetection().catch(console.error);

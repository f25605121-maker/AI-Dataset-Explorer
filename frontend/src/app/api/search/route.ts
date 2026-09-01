import { NextRequest, NextResponse } from 'next/server';
import { runDatasetPipeline } from '@/lib/assistant/datasetPipeline';
import { runGeneralAIPipeline } from '@/lib/assistant/generalAIPipeline';
import { classifyIntent } from '@/lib/assistant/classifyIntent';
import { extractIp } from '@/lib/rateLimit';

// In-memory rate limiting per IP
const ipRequestLog = new Map<string, number[]>();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_RPM || '30', 10);
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    let requests = ipRequestLog.get(ip) || [];

    requests = requests.filter(t => now - t < WINDOW_MS);

    if (requests.length >= RATE_LIMIT) {
        return true;
    }

    requests.push(now);
    ipRequestLog.set(ip, requests);

    if (ipRequestLog.size > 1000) {
        ipRequestLog.clear();
    }
    return false;
}

export async function POST(req: NextRequest) {
    try {
        const clientIp = extractIp(req);

        if (isRateLimited(clientIp)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        type: 'RATE_LIMITED',
                        status: 429,
                        message: 'Too many requests. Please wait before searching again.',
                    },
                },
                { status: 429 }
            );
        }

        let body: any = {};
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, error: 'Invalid JSON in request body.' }, { status: 400 });
        }

        // Support { query: "..." } or { messages: [{ role: "user", content: "..." }] }
        let query = '';
        if (typeof body.query === 'string') {
            query = body.query.trim();
        } else if (Array.isArray(body.messages) && body.messages.length > 0) {
            const last = body.messages[body.messages.length - 1];
            query = (last?.content || '').trim();
        }

        if (!query) {
            return NextResponse.json({ success: false, error: 'Query is required.' }, { status: 400 });
        }

        if (query.length > 8000) {
            return NextResponse.json({ success: false, error: 'Query exceeds maximum length of 8000 characters.' }, { status: 400 });
        }

        const searchId = body.searchId || body.conversationId || crypto.randomUUID();

        // Step 2: Intent & Query Generation
        const intentClassification = await classifyIntent(query);

        // Check if statement is purely non-dataset (e.g. Greeting, General AI question, Concept explanation)
        const isNonDatasetQuery = !intentClassification.datasetRequired || 
            ['GREETING', 'GENERAL_AI', 'EXPLAIN_CONCEPT'].includes(intentClassification.intent);

        if (isNonDatasetQuery) {
            console.log(`[API-SEARCH] Handling non-dataset / general statement: "${query}" (Intent: ${intentClassification.intent})`);
            
            const generalAnswer = await runGeneralAIPipeline([
                { role: 'user', content: query }
            ]);

            return NextResponse.json({
                success: true,
                searchId,
                type: intentClassification.intent === 'GREETING' ? 'greeting' : 'general',
                isGeneralQuery: true,
                answer: generalAnswer,
                message: generalAnswer,
                intent: intentClassification.intent,
                intentDetails: intentClassification,
                summary: {
                    projectTitle: intentClassification.intent === 'GREETING' ? 'Welcome' : 'AI & General Knowledge Inquiry',
                    domain: 'General / Concept',
                    task: intentClassification.intent,
                    dataType: 'Text',
                    datasetsFound: 0,
                    modelsFound: 0,
                },
                results: {
                    kaggle: [],
                    hfDatasets: [],
                    hfModels: [],
                },
                datasets: [],
                models: [],
                analysis: {
                    title: 'General AI Inquiry',
                    domain: 'General',
                    task: intentClassification.intent,
                    ai_analysis: generalAnswer,
                    confidence: { score: 100, reason: 'Direct response generated for user statement.' }
                },
            });
        }

        // Step 3-6: Multi-source discovery (Kaggle + HF) -> Backend Normalization & Filter -> Rationale & Synthesis
        const pipelineResult = await runDatasetPipeline(
            intentClassification.searchQuery || query,
            searchId,
            intentClassification
        );

        // If hybrid or conceptual, attach direct general AI explanation as well
        let generalAnswer: string | undefined;
        if (intentClassification.generalAnswerRequired || intentClassification.intent === 'HYBRID') {
            generalAnswer = await runGeneralAIPipeline([{ role: 'user', content: query }]);
        }

        // Step 7: Format output for both direct API callers and UI dashboard
        const kaggle = (pipelineResult.datasets || []).filter(
            d => d.source?.toLowerCase() === 'kaggle'
        );
        const hfDatasets = (pipelineResult.datasets || []).filter(
            d => d.source?.toLowerCase().includes('hugging')
        );
        const hfModels = pipelineResult.models || [];

        return NextResponse.json({
            success: true,
            searchId,
            type: intentClassification.intent === 'HYBRID' ? 'hybrid' : 'dataset',
            isGeneralQuery: false,
            answer: generalAnswer || pipelineResult.analysis?.ai_analysis,
            intent: intentClassification.intent,
            intentDetails: intentClassification,
            summary: pipelineResult.summary,
            results: {
                kaggle,
                hfDatasets,
                hfModels,
            },
            datasets: pipelineResult.datasets,
            models: pipelineResult.models,
            analysis: pipelineResult.analysis,
            feasibility: pipelineResult.feasibility,
            hardware: pipelineResult.hardware,
            searchCoverage: pipelineResult.searchCoverage,
            datasetCompatibility: pipelineResult.datasetCompatibility,
            labelMapping: pipelineResult.labelMapping,
            recommendationCategories: pipelineResult.recommendationCategories,
            smartRecommendation: pipelineResult.smartRecommendation,
            apiAudit: pipelineResult.apiAudit,
            ai_mode: pipelineResult.ai_mode,
        });

    } catch (e: any) {
        console.error('[API-SEARCH][ERROR]', e);
        return NextResponse.json(
            {
                success: false,
                error: {
                    status: 500,
                    message: 'Internal search engine error. Please try again.',
                },
            },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query');

    if (!query) {
        return NextResponse.json({
            status: 'online',
            service: 'AI Dataset Explorer Search API',
            usage: 'Send a POST request with { query: "your project description" } to search.',
        });
    }

    const fakeReq = new NextRequest(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({ query }),
    });

    return POST(fakeReq);
}

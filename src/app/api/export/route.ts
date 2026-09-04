import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      generator: "AI Dataset Explorer Analysis Export v2.0",
      query: body.query || "Unspecified",
      domainAndTask: body.domainAndTask || "General AI / Data Science",
      intent: body.intent || null,
      constraints: body.constraints || {},
      datasets: body.datasets || [],
      models: body.models || [],
      papers: body.papers || [],
      feasibility: body.feasibility || null,
      hardwareProfile: body.hardwareProfile || null,
      directAnswer: body.directAnswer || null,
      researchLandscape: body.researchLandscape || null,
      researchSynthesis: body.researchSynthesis || null,
      meta: {
        totalDatasets: body.datasets?.length || 0,
        totalModels: body.models?.length || 0,
        totalPapers: body.papers?.length || 0,
        exportedBy: body.user || "anonymous",
      },
    };

    const serialized = JSON.stringify(exportPayload, null, 2);

    return new NextResponse(serialized, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="ai-dataset-explorer-${Date.now()}.json"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("[Export API Error]:", error);
    return NextResponse.json(
      {
        error: "Failed to generate analysis export",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "export";

  return NextResponse.json({
    status: "ok",
    message: "Export endpoint active. Use POST to generate structured JSON exports.",
    query,
  });
}

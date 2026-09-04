#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo " Starting AI Dataset Explorer Architectural Refactoring "
echo "========================================================"

# Determine workspace root
if [ -d "frontend" ]; then
    ROOT_DIR="$(pwd)"
    FRONTEND_DIR="$(pwd)/frontend"
elif [ -d "src" ] && [ -f "package.json" ]; then
    FRONTEND_DIR="$(pwd)"
    ROOT_DIR="$(dirname "$FRONTEND_DIR")"
else
    echo "Error: Must run from repository root or frontend directory."
    exit 1
fi

echo "Repository Root : $ROOT_DIR"
echo "Frontend Root   : $FRONTEND_DIR"

smart_mv() {
    local src="$1"
    local dest="$2"
    if [ ! -e "$src" ]; then
        return 0
    fi
    if git ls-files --error-unmatch "$src" >/dev/null 2>&1; then
        git mv "$src" "$dest"
    else
        mv "$src" "$dest"
    fi
}

# STEP 1: Purge Root-Level & Frontend-Level Ephemeral Clutter
echo "--> Step 1: Purging logs, dumps, and temporary fix scripts..."
cd "$ROOT_DIR"
rm -f git_err.txt push.log
rm -rf .next

cd "$FRONTEND_DIR"
rm -f server.log build-check.log
rm -f output.json output2.json
rm -f kaggle_body.html kaggle_headers.txt test_write.txt tree_output.txt tsc-output.txt
rm -f fix.js kaggle_test.js test_apis.js test_flow.js
rm -f src/app/api/auth/*.tmp*

# STEP 2: Centralize Project Documentation & PRDs
echo "--> Step 2: Centralizing documentation in docs/..."
mkdir -p "$ROOT_DIR/docs"
smart_mv "$ROOT_DIR/AI_Dataset_Explorer_PRD.pdf" "$ROOT_DIR/docs/AI_Dataset_Explorer_PRD.pdf"
smart_mv "$FRONTEND_DIR/AI-CHECKLIST.MD" "$ROOT_DIR/docs/AI-CHECKLIST.md"
smart_mv "$FRONTEND_DIR/manual-checklist.md" "$ROOT_DIR/docs/manual-checklist.md"
smart_mv "$FRONTEND_DIR/CLAUDE.md" "$ROOT_DIR/docs/CLAUDE.md"

if [ -d "$FRONTEND_DIR/docs" ]; then
    cp -r "$FRONTEND_DIR/docs/"* "$ROOT_DIR/docs/" 2>/dev/null || true
fi

# STEP 3: Relocate Leaky Data Stores
echo "--> Step 3: Relocating data stores out of src/app/api/auth/..."
mkdir -p "$FRONTEND_DIR/data"
smart_mv "$FRONTEND_DIR/src/app/api/auth/users.json" "$FRONTEND_DIR/data/users.json"
smart_mv "$FRONTEND_DIR/src/app/api/auth/user_usage.json" "$FRONTEND_DIR/data/user_usage.json"
smart_mv "$FRONTEND_DIR/src/app/api/auth/DEV_STORE_WARNING.md" "$FRONTEND_DIR/data/README.md"
touch "$FRONTEND_DIR/data/.gitkeep"

# STEP 4: Relocate Route-Polluting Services & Schemas
echo "--> Step 4: Migrating business services from src/app/api/search/services to src/server/services..."
mkdir -p "$FRONTEND_DIR/src/server/services"
mkdir -p "$FRONTEND_DIR/src/types"

if [ -f "$FRONTEND_DIR/src/app/api/search/schemas/paperTypes.ts" ]; then
    smart_mv "$FRONTEND_DIR/src/app/api/search/schemas/paperTypes.ts" "$FRONTEND_DIR/src/types/papers.ts"
fi
if [ -f "$FRONTEND_DIR/src/app/api/search/schemas/types.ts" ]; then
    smart_mv "$FRONTEND_DIR/src/app/api/search/schemas/types.ts" "$FRONTEND_DIR/src/types/pipeline.ts"
fi
rm -rf "$FRONTEND_DIR/src/app/api/search/schemas"

for dir in analysis evidence feasibility gemini normalization papers ranking; do
    if [ -d "$FRONTEND_DIR/src/app/api/search/services/$dir" ]; then
        mkdir -p "$FRONTEND_DIR/src/server/services/$dir"
        for file in "$FRONTEND_DIR/src/app/api/search/services/$dir"/*; do
            if [ -f "$file" ]; then
                smart_mv "$file" "$FRONTEND_DIR/src/server/services/$dir/$(basename "$file")"
            fi
        done
    fi
done

mkdir -p "$FRONTEND_DIR/src/server/services/providers"
smart_mv "$FRONTEND_DIR/src/app/api/search/services/huggingface/searchDatasets.ts" "$FRONTEND_DIR/src/server/services/providers/huggingfaceDatasets.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/src/app/api/search/services/huggingface/searchModels.ts" "$FRONTEND_DIR/src/server/services/providers/huggingfaceModels.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/src/app/api/search/services/kaggle/searchDatasets.ts" "$FRONTEND_DIR/src/server/services/providers/kaggleDatasets.ts" 2>/dev/null || true

mkdir -p "$FRONTEND_DIR/src/server/services/queryUnderstanding"
smart_mv "$FRONTEND_DIR/src/app/api/search/services/queryUnderstanding/queryParser.ts" "$FRONTEND_DIR/src/server/services/queryUnderstanding/queryParser.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/src/app/api/search/services/queryUnderstanding/queryExpander.ts" "$FRONTEND_DIR/src/server/services/queryUnderstanding/queryExpander.ts" 2>/dev/null || true

mkdir -p "$FRONTEND_DIR/src/server/services/cache"
smart_mv "$FRONTEND_DIR/src/app/api/search/services/cache/metadataCache.ts" "$FRONTEND_DIR/src/server/services/cache/metadataCache.ts" 2>/dev/null || true

rm -rf "$FRONTEND_DIR/src/app/api/search/services"

# STEP 5: Consolidate Tests and CLI Scripts
echo "--> Step 5: Structuring tests and operational scripts..."
mkdir -p "$FRONTEND_DIR/tests/unit"
mkdir -p "$FRONTEND_DIR/tests/integration"
mkdir -p "$FRONTEND_DIR/tests/security"

smart_mv "$FRONTEND_DIR/src/tests/test_classification.ts" "$FRONTEND_DIR/tests/unit/test-classification.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/src/tests/test_intent_classifier.ts" "$FRONTEND_DIR/tests/unit/test-intent-classifier.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/test_vehicle.ts" "$FRONTEND_DIR/tests/unit/test-vehicle.ts" 2>/dev/null || true

smart_mv "$FRONTEND_DIR/src/tests/test_research.ts" "$FRONTEND_DIR/tests/integration/test-research.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/src/tests/test_telemetry_4dflow.ts" "$FRONTEND_DIR/tests/integration/test-telemetry.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/test_search_endpoint.ts" "$FRONTEND_DIR/tests/integration/test-search-endpoint.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/test_apis.ts" "$FRONTEND_DIR/tests/integration/test-apis.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/scripts/prove_all_apis.ts" "$FRONTEND_DIR/tests/integration/prove-all-apis.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/scripts/test_biomedical_precision.mjs" "$FRONTEND_DIR/tests/integration/test-biomedical-precision.mjs" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/scripts/test_cryo_and_empty_state.ts" "$FRONTEND_DIR/tests/integration/test-cryo-and-empty-state.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/scripts/test_search_engine.ts" "$FRONTEND_DIR/tests/integration/test-search-engine.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/scripts/test_search_engine.mjs" "$FRONTEND_DIR/tests/integration/test-search-engine.mjs" 2>/dev/null || true

smart_mv "$FRONTEND_DIR/scripts/test-all-security.ts" "$FRONTEND_DIR/tests/security/test-all-security.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/scripts/test-all-security.mjs" "$FRONTEND_DIR/tests/security/test-all-security.mjs" 2>/dev/null || true

rm -rf "$FRONTEND_DIR/src/tests"

smart_mv "$FRONTEND_DIR/scripts/seed_presets.ts" "$FRONTEND_DIR/scripts/seed-presets.ts" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/scripts/evaluate_retrieval.mjs" "$FRONTEND_DIR/scripts/evaluate-retrieval.mjs" 2>/dev/null || true
smart_mv "$FRONTEND_DIR/scripts/run_search_evaluation.ts" "$FRONTEND_DIR/scripts/run-search-evaluation.ts" 2>/dev/null || true

# STEP 6: Component Hierarchy Normalization & Deduplication
echo "--> Step 6: Normalizing component directory structure..."
mkdir -p "$FRONTEND_DIR/src/components/cards"
mkdir -p "$FRONTEND_DIR/src/components/modals"
mkdir -p "$FRONTEND_DIR/src/components/landing"
mkdir -p "$FRONTEND_DIR/src/components/providers"

rm -f "$FRONTEND_DIR/src/components/confidence-badge.tsx"
rm -f "$FRONTEND_DIR/src/components/evidence-badge.tsx"
rm -f "$FRONTEND_DIR/src/components/match-breakdown.tsx"
rm -f "$FRONTEND_DIR/src/components/footer.tsx"
rm -f "$FRONTEND_DIR/src/components/navbar.tsx"

smart_mv "$FRONTEND_DIR/src/components/dataset-card.tsx" "$FRONTEND_DIR/src/components/cards/DatasetCard.tsx"
smart_mv "$FRONTEND_DIR/src/components/model-card.tsx" "$FRONTEND_DIR/src/components/cards/ModelCard.tsx"
smart_mv "$FRONTEND_DIR/src/components/paper-card.tsx" "$FRONTEND_DIR/src/components/cards/PaperCard.tsx"

smart_mv "$FRONTEND_DIR/src/components/paper-detail-modal.tsx" "$FRONTEND_DIR/src/components/modals/PaperDetailModal.tsx"
smart_mv "$FRONTEND_DIR/src/components/search-benchmark-modal.tsx" "$FRONTEND_DIR/src/components/modals/SearchBenchmarkModal.tsx"
smart_mv "$FRONTEND_DIR/src/components/search-debug-modal.tsx" "$FRONTEND_DIR/src/components/modals/SearchDebugModal.tsx"
smart_mv "$FRONTEND_DIR/src/components/user-feedback-modal.tsx" "$FRONTEND_DIR/src/components/modals/UserFeedbackModal.tsx"

smart_mv "$FRONTEND_DIR/src/components/landing-page.tsx" "$FRONTEND_DIR/src/components/landing/LandingPage.tsx"
smart_mv "$FRONTEND_DIR/src/components/starter-code-hub.tsx" "$FRONTEND_DIR/src/components/roadmap/StarterCodeHub.tsx"
smart_mv "$FRONTEND_DIR/src/components/providers.tsx" "$FRONTEND_DIR/src/components/providers/Providers.tsx"

# STEP 7: Route Aliasing Cleanup (roadmap vs roadmaps)
echo "--> Step 7: Harmonizing canonical roadmap route..."
if [ -d "$FRONTEND_DIR/src/app/roadmaps" ] && [ -d "$FRONTEND_DIR/src/app/roadmap" ]; then
    smart_mv "$FRONTEND_DIR/src/app/roadmaps/page.tsx" "$FRONTEND_DIR/src/app/roadmap/page.tsx"
    rm -rf "$FRONTEND_DIR/src/app/roadmaps"
fi

echo "========================================================"
echo " Directory Migration Complete! Proceed to Import Fixing."
echo "========================================================"

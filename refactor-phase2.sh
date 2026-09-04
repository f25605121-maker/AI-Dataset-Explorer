#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " Starting AI Dataset Explorer Phase 2 Refactoring (Unified) "
echo "=========================================================="

ROOT_DIR="$(pwd)"
if [ -d "frontend" ]; then
    FRONTEND_DIR="$ROOT_DIR/frontend"
else
    FRONTEND_DIR="$ROOT_DIR"
fi

smart_mv() {
    local src="$1"
    local dest="$2"
    if [ ! -e "$src" ]; then
        return 0
    fi
    local dest_dir
    dest_dir="$(dirname "$dest")"
    mkdir -p "$dest_dir"
    if git ls-files --error-unmatch "$src" >/dev/null 2>&1; then
        git mv "$src" "$dest"
    else
        mv "$src" "$dest"
    fi
}

echo "--> Step 1: Flattening frontend/ to root if present..."
if [ -d "$ROOT_DIR/frontend" ]; then
    # Move configs to root
    for cfg in package.json package-lock.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs eslint.config.mjs next-env.d.ts .env.example .env.local; do
        if [ -f "$ROOT_DIR/frontend/$cfg" ]; then
            smart_mv "$ROOT_DIR/frontend/$cfg" "$ROOT_DIR/$cfg"
        fi
    done

    # Move directories
    for dir in src public data tests scripts; do
        if [ -d "$ROOT_DIR/frontend/$dir" ]; then
            if [ -d "$ROOT_DIR/$dir" ]; then
                cp -r "$ROOT_DIR/frontend/$dir/"* "$ROOT_DIR/$dir/" 2>/dev/null || true
                rm -rf "$ROOT_DIR/frontend/$dir"
            else
                smart_mv "$ROOT_DIR/frontend/$dir" "$ROOT_DIR/$dir"
            fi
        fi
    done

    # Clean up empty frontend/ folder
    rm -rf "$ROOT_DIR/frontend"
fi

echo "--> Step 2: Relocating and standardizing domain services to src/server/..."
mkdir -p "$ROOT_DIR/src/server/search"
mkdir -p "$ROOT_DIR/src/server/providers"
mkdir -p "$ROOT_DIR/src/server/papers"
mkdir -p "$ROOT_DIR/src/server/analysis"
mkdir -p "$ROOT_DIR/src/server/feasibility"
mkdir -p "$ROOT_DIR/src/server/normalization"
mkdir -p "$ROOT_DIR/src/server/ranking"
mkdir -p "$ROOT_DIR/src/server/query-understanding"
mkdir -p "$ROOT_DIR/src/server/cache"
mkdir -p "$ROOT_DIR/src/server/assistant"
mkdir -p "$ROOT_DIR/src/server/security"
mkdir -p "$ROOT_DIR/src/server/auth"
mkdir -p "$ROOT_DIR/src/server/db"

# Migrate src/lib/search to src/server/search
if [ -d "$ROOT_DIR/src/lib/search" ]; then
    cp -rn "$ROOT_DIR/src/lib/search/"* "$ROOT_DIR/src/server/search/" 2>/dev/null || true
    rm -rf "$ROOT_DIR/src/lib/search"
fi

# Migrate src/lib/assistant, security, auth, db to src/server/
for domain in assistant security auth db; do
    if [ -d "$ROOT_DIR/src/lib/$domain" ]; then
        cp -rn "$ROOT_DIR/src/lib/$domain/"* "$ROOT_DIR/src/server/$domain/" 2>/dev/null || true
        rm -rf "$ROOT_DIR/src/lib/$domain"
    fi
done

# Migrate rateLimit
smart_mv "$ROOT_DIR/src/lib/rateLimit.ts" "$ROOT_DIR/src/server/security/rate-limit.ts" 2>/dev/null || true

# Migrate server services if in src/server/services
if [ -d "$ROOT_DIR/src/server/services" ]; then
    smart_mv "$ROOT_DIR/src/server/services/papers" "$ROOT_DIR/src/server/papers" 2>/dev/null || true
    smart_mv "$ROOT_DIR/src/server/services/analysis" "$ROOT_DIR/src/server/analysis" 2>/dev/null || true
    smart_mv "$ROOT_DIR/src/server/services/feasibility" "$ROOT_DIR/src/server/feasibility" 2>/dev/null || true
    smart_mv "$ROOT_DIR/src/server/services/normalization" "$ROOT_DIR/src/server/normalization" 2>/dev/null || true
    smart_mv "$ROOT_DIR/src/server/services/ranking" "$ROOT_DIR/src/server/ranking" 2>/dev/null || true
    smart_mv "$ROOT_DIR/src/server/services/queryUnderstanding" "$ROOT_DIR/src/server/query-understanding" 2>/dev/null || true
    smart_mv "$ROOT_DIR/src/server/services/cache" "$ROOT_DIR/src/server/cache" 2>/dev/null || true
    smart_mv "$ROOT_DIR/src/server/services/providers" "$ROOT_DIR/src/server/providers" 2>/dev/null || true
    smart_mv "$ROOT_DIR/src/server/services/evidence" "$ROOT_DIR/src/server/evidence" 2>/dev/null || true
    smart_mv "$ROOT_DIR/src/server/services/gemini/analyzeProject.ts" "$ROOT_DIR/src/server/assistant/analyze-project.ts" 2>/dev/null || true
    rm -rf "$ROOT_DIR/src/server/services"
fi

echo "--> Step 3: Extracting client state and fixtures from src/lib/..."
mkdir -p "$ROOT_DIR/src/context"
mkdir -p "$ROOT_DIR/src/hooks"
mkdir -p "$ROOT_DIR/src/fixtures"
mkdir -p "$ROOT_DIR/src/lib/algorithms"

smart_mv "$ROOT_DIR/src/lib/theme.tsx" "$ROOT_DIR/src/context/ThemeContext.tsx" 2>/dev/null || true
smart_mv "$ROOT_DIR/src/lib/trendingTemplates.ts" "$ROOT_DIR/src/fixtures/trending-templates.ts" 2>/dev/null || true
smart_mv "$ROOT_DIR/src/lib/popularityAlgorithm.ts" "$ROOT_DIR/src/lib/algorithms/popularity.ts" 2>/dev/null || true

# Purge dead shims in src/lib
rm -f "$ROOT_DIR/src/lib/huggingface.ts"
rm -f "$ROOT_DIR/src/lib/kaggle.ts"
rm -f "$ROOT_DIR/src/lib/reRanker.ts"
rm -f "$ROOT_DIR/src/lib/queryParser.ts"
rm -f "$ROOT_DIR/src/lib/constants.ts"
rm -f "$ROOT_DIR/src/lib/searchSession.tsx"
rm -f "$ROOT_DIR/src/lib/gemini.ts"
rm -f "$ROOT_DIR/src/lib/index.ts"
rm -rf "$ROOT_DIR/src/lib/services"

echo "=========================================================="
echo " Phase 2 Refactoring Complete! "
echo "=========================================================="

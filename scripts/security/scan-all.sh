#!/usr/bin/env bash
# DocuThinker — Comprehensive Security Scan
# Runs SonarQube analysis + Snyk (open source, container, IaC) scans
# Prerequisites: sonar-scanner, snyk CLI, docker
# Usage: ./scripts/security/scan-all.sh [--sonar] [--snyk] [--all]
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT_DIR="$PROJECT_ROOT/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults
RUN_SONAR=false
RUN_SNYK=false
SONAR_HOST_URL="${SONAR_HOST_URL:-https://sonarqube.docuthinker.com}"
SONAR_TOKEN="${SONAR_TOKEN:-}"
SNYK_TOKEN="${SNYK_TOKEN:-}"
SNYK_ORG="${SNYK_ORG:-}"
SEVERITY_THRESHOLD="${SEVERITY_THRESHOLD:-high}"
EXIT_CODE=0

# ──────────────────────────────────────────────────────────────
# Parse Arguments
# ──────────────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --sonar) RUN_SONAR=true ;;
    --snyk)  RUN_SNYK=true ;;
    --all)   RUN_SONAR=true; RUN_SNYK=true ;;
    --help|-h)
      echo "Usage: $0 [--sonar] [--snyk] [--all]"
      echo ""
      echo "Options:"
      echo "  --sonar  Run SonarQube analysis"
      echo "  --snyk   Run Snyk scans (open source, container, IaC)"
      echo "  --all    Run all scans"
      echo ""
      echo "Environment variables:"
      echo "  SONAR_HOST_URL   SonarQube server URL (default: https://sonarqube.docuthinker.com)"
      echo "  SONAR_TOKEN      SonarQube authentication token"
      echo "  SNYK_TOKEN       Snyk API token"
      echo "  SNYK_ORG         Snyk organization ID"
      exit 0
      ;;
    *) echo -e "${RED}Unknown argument: $arg${NC}"; exit 1 ;;
  esac
done

if ! $RUN_SONAR && ! $RUN_SNYK; then
  echo -e "${YELLOW}No scan type specified. Running all scans.${NC}"
  RUN_SONAR=true
  RUN_SNYK=true
fi

# ──────────────────────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────────────────────
mkdir -p "$REPORT_DIR/sonarqube" "$REPORT_DIR/snyk-oss" "$REPORT_DIR/snyk-container" "$REPORT_DIR/snyk-iac"

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   DocuThinker Security Scan — $TIMESTAMP   ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ──────────────────────────────────────────────────────────────
# SonarQube Analysis
# ──────────────────────────────────────────────────────────────
if $RUN_SONAR; then
  echo -e "${BLUE}━━━ SonarQube Analysis ━━━${NC}"

  if [ -z "$SONAR_TOKEN" ]; then
    echo -e "${YELLOW}⚠ SONAR_TOKEN not set. Skipping SonarQube scan.${NC}"
  elif ! command -v sonar-scanner &>/dev/null; then
    echo -e "${YELLOW}⚠ sonar-scanner not found. Install: brew install sonar-scanner${NC}"
  else
    echo -e "  Server: $SONAR_HOST_URL"
    echo -e "  Config: sonar-project.properties"

    cd "$PROJECT_ROOT"
    sonar-scanner \
      -Dsonar.host.url="$SONAR_HOST_URL" \
      -Dsonar.token="$SONAR_TOKEN" \
      -Dsonar.projectBaseDir="$PROJECT_ROOT" \
      2>&1 | tee "$REPORT_DIR/sonarqube/scan-${TIMESTAMP}.log"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
      echo -e "${GREEN}✓ SonarQube analysis completed${NC}"
    else
      echo -e "${RED}✗ SonarQube analysis failed${NC}"
      EXIT_CODE=1
    fi
    echo ""
  fi
fi

# ──────────────────────────────────────────────────────────────
# Snyk Open Source (dependency vulnerabilities)
# ──────────────────────────────────────────────────────────────
if $RUN_SNYK; then
  echo -e "${BLUE}━━━ Snyk Open Source Scan ━━━${NC}"

  if [ -z "$SNYK_TOKEN" ]; then
    echo -e "${YELLOW}⚠ SNYK_TOKEN not set. Skipping Snyk scans.${NC}"
  elif ! command -v snyk &>/dev/null; then
    echo -e "${YELLOW}⚠ snyk not found. Install: npm install -g snyk${NC}"
  else
    SNYK_ORG_FLAG=""
    if [ -n "$SNYK_ORG" ]; then
      SNYK_ORG_FLAG="--org=$SNYK_ORG"
    fi

    # Root project
    echo -e "  Scanning root dependencies..."
    cd "$PROJECT_ROOT"
    snyk test $SNYK_ORG_FLAG --severity-threshold=$SEVERITY_THRESHOLD \
      --json-file-output="$REPORT_DIR/snyk-oss/root-${TIMESTAMP}.json" \
      2>&1 | tail -5 || true

    # Frontend
    if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
      echo -e "  Scanning frontend dependencies..."
      cd "$PROJECT_ROOT/frontend"
      snyk test $SNYK_ORG_FLAG --severity-threshold=$SEVERITY_THRESHOLD \
        --json-file-output="$REPORT_DIR/snyk-oss/frontend-${TIMESTAMP}.json" \
        2>&1 | tail -5 || true
    fi

    # Backend
    if [ -f "$PROJECT_ROOT/backend/package.json" ]; then
      echo -e "  Scanning backend dependencies..."
      cd "$PROJECT_ROOT/backend"
      snyk test $SNYK_ORG_FLAG --severity-threshold=$SEVERITY_THRESHOLD \
        --json-file-output="$REPORT_DIR/snyk-oss/backend-${TIMESTAMP}.json" \
        2>&1 | tail -5 || true
    fi

    # Orchestrator
    if [ -f "$PROJECT_ROOT/orchestrator/package.json" ]; then
      echo -e "  Scanning orchestrator dependencies..."
      cd "$PROJECT_ROOT/orchestrator"
      snyk test $SNYK_ORG_FLAG --severity-threshold=$SEVERITY_THRESHOLD \
        --json-file-output="$REPORT_DIR/snyk-oss/orchestrator-${TIMESTAMP}.json" \
        2>&1 | tail -5 || true
    fi

    # AI/ML (Python)
    if [ -f "$PROJECT_ROOT/ai_ml/requirements.txt" ]; then
      echo -e "  Scanning AI/ML Python dependencies..."
      cd "$PROJECT_ROOT/ai_ml"
      snyk test $SNYK_ORG_FLAG --severity-threshold=$SEVERITY_THRESHOLD \
        --file=requirements.txt --package-manager=pip \
        --json-file-output="$REPORT_DIR/snyk-oss/ai-ml-${TIMESTAMP}.json" \
        2>&1 | tail -5 || true
    fi

    echo -e "${GREEN}✓ Snyk OSS scan completed${NC}"
    echo ""

    # ──────────────────────────────────────────────────────────
    # Snyk Container Scanning
    # ──────────────────────────────────────────────────────────
    echo -e "${BLUE}━━━ Snyk Container Scan ━━━${NC}"

    IMAGES=(
      "docuthinker/frontend:latest"
      "docuthinker/backend:latest"
      "docuthinker/orchestrator:latest"
      "docuthinker/ai-ml:latest"
    )

    for IMAGE in "${IMAGES[@]}"; do
      IMAGE_SAFE=$(echo "$IMAGE" | tr '/:' '__')
      echo -e "  Scanning $IMAGE..."

      if docker image inspect "$IMAGE" &>/dev/null; then
        snyk container test "$IMAGE" $SNYK_ORG_FLAG \
          --severity-threshold=$SEVERITY_THRESHOLD \
          --json-file-output="$REPORT_DIR/snyk-container/${IMAGE_SAFE}-${TIMESTAMP}.json" \
          2>&1 | tail -5 || true
      else
        echo -e "  ${YELLOW}⚠ Image $IMAGE not found locally, skipping${NC}"
      fi
    done

    echo -e "${GREEN}✓ Snyk container scan completed${NC}"
    echo ""

    # ──────────────────────────────────────────────────────────
    # Snyk IaC Scanning
    # ──────────────────────────────────────────────────────────
    echo -e "${BLUE}━━━ Snyk IaC Scan ━━━${NC}"

    cd "$PROJECT_ROOT"

    IaC_DIRS=(
      "terraform"
      "kubernetes"
      "helm"
      "argocd"
      "monitoring"
      "security"
    )

    for DIR in "${IaC_DIRS[@]}"; do
      if [ -d "$PROJECT_ROOT/$DIR" ]; then
        echo -e "  Scanning $DIR/..."
        snyk iac test "$PROJECT_ROOT/$DIR" $SNYK_ORG_FLAG \
          --severity-threshold=$SEVERITY_THRESHOLD \
          --json-file-output="$REPORT_DIR/snyk-iac/${DIR}-${TIMESTAMP}.json" \
          --report \
          2>&1 | tail -5 || true
      fi
    done

    echo -e "${GREEN}✓ Snyk IaC scan completed${NC}"
    echo ""

    # ──────────────────────────────────────────────────────────
    # Snyk Code (SAST)
    # ──────────────────────────────────────────────────────────
    echo -e "${BLUE}━━━ Snyk Code (SAST) Scan ━━━${NC}"

    cd "$PROJECT_ROOT"
    snyk code test $SNYK_ORG_FLAG \
      --severity-threshold=$SEVERITY_THRESHOLD \
      --json-file-output="$REPORT_DIR/snyk-oss/code-${TIMESTAMP}.json" \
      --sarif-file-output="$REPORT_DIR/snyk-oss/code-${TIMESTAMP}.sarif" \
      2>&1 | tail -10 || true

    echo -e "${GREEN}✓ Snyk Code scan completed${NC}"
    echo ""
  fi
fi

# ──────────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────────
echo -e "${BLUE}━━━ Scan Summary ━━━${NC}"
echo -e "  Reports: $REPORT_DIR/"
echo ""

SONAR_COUNT=$(find "$REPORT_DIR/sonarqube" -name "*.log" -newer "$REPORT_DIR" 2>/dev/null | wc -l | tr -d ' ')
OSS_COUNT=$(find "$REPORT_DIR/snyk-oss" -name "*.json" -newer "$REPORT_DIR" 2>/dev/null | wc -l | tr -d ' ')
CONTAINER_COUNT=$(find "$REPORT_DIR/snyk-container" -name "*.json" -newer "$REPORT_DIR" 2>/dev/null | wc -l | tr -d ' ')
IAC_COUNT=$(find "$REPORT_DIR/snyk-iac" -name "*.json" -newer "$REPORT_DIR" 2>/dev/null | wc -l | tr -d ' ')

echo -e "  SonarQube reports:      $SONAR_COUNT"
echo -e "  Snyk OSS reports:       $OSS_COUNT"
echo -e "  Snyk Container reports: $CONTAINER_COUNT"
echo -e "  Snyk IaC reports:       $IAC_COUNT"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ All security scans completed successfully${NC}"
else
  echo -e "${RED}✗ Some scans failed — review reports above${NC}"
fi

exit $EXIT_CODE

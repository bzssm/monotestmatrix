#!/usr/bin/env bash
# =============================================================================
# Zava Bank — Docker Compose Test Runner
# Brings up the stack, waits for healthy services, runs M1 smoke tests,
# reports results, and optionally tears down.
# 📌 Proactive — written 2026-05-14; adjust once implementations land.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.yml"
SMOKE_TESTS="${SCRIPT_DIR}/m1-smoke-tests.sh"

TEARDOWN=${TEARDOWN:-false}
TIMEOUT=${TIMEOUT:-180}

M1_SERVICES=(
    "zava-auth-service"
    "zava-currency-service"
    "zava-ledger-core"
    "zava-kyc-service"
)

declare -A SERVICE_HEALTH
SERVICE_HEALTH[zava-auth-service]="http://localhost:8003/health"
SERVICE_HEALTH[zava-currency-service]="http://localhost:8004/health"
SERVICE_HEALTH[zava-ledger-core]="http://localhost:9004/health"
SERVICE_HEALTH[zava-kyc-service]="http://localhost:9005/health"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()      { echo -e "${CYAN}[compose-test]${NC} $1"; }
log_ok()   { echo -e "${GREEN}[compose-test]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[compose-test]${NC} $1"; }
log_err()  { echo -e "${RED}[compose-test]${NC} $1"; }

# ---------------------------------------------------------------------------
# Step 1: Bring up Docker Compose
# ---------------------------------------------------------------------------
log "Starting Docker Compose stack..."
cd "$REPO_ROOT"

docker compose -f "$COMPOSE_FILE" up -d sqlserver rabbitmq 2>&1 | tail -5
log "Waiting 15s for infrastructure to initialize..."
sleep 15

for svc in "${M1_SERVICES[@]}"; do
    log "Starting $svc..."
    docker compose -f "$COMPOSE_FILE" up -d "$svc" 2>&1 | tail -2
done

# ---------------------------------------------------------------------------
# Step 2: Wait for all M1 services to become healthy
# ---------------------------------------------------------------------------
log "Waiting for M1 services to become healthy (timeout: ${TIMEOUT}s)..."

wait_for_service() {
    local name=$1
    local url=$2
    local elapsed=0
    local interval=5

    while [ $elapsed -lt $TIMEOUT ]; do
        status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null || echo "000")
        if [ "$status" = "200" ]; then
            log_ok "$name is healthy (${elapsed}s)"
            return 0
        fi
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    log_err "$name did NOT become healthy within ${TIMEOUT}s (last status: $status)"
    return 1
}

ALL_HEALTHY=true
for svc in "${M1_SERVICES[@]}"; do
    if ! wait_for_service "$svc" "${SERVICE_HEALTH[$svc]}"; then
        ALL_HEALTHY=false
    fi
done

if [ "$ALL_HEALTHY" = false ]; then
    log_err "Not all M1 services are healthy. Dumping container status:"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    log_warn "Attempting to run smoke tests anyway (some will fail)..."
fi

# ---------------------------------------------------------------------------
# Step 3: Show container status
# ---------------------------------------------------------------------------
log "Container status:"
docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
    || docker compose -f "$COMPOSE_FILE" ps

echo ""

# ---------------------------------------------------------------------------
# Step 4: Run M1 smoke tests
# ---------------------------------------------------------------------------
log "Running M1 smoke tests..."
echo ""

TEST_EXIT=0
bash "$SMOKE_TESTS" || TEST_EXIT=$?

echo ""

# ---------------------------------------------------------------------------
# Step 5: Collect logs on failure
# ---------------------------------------------------------------------------
if [ $TEST_EXIT -ne 0 ]; then
    log_warn "Smoke tests failed. Collecting recent logs from M1 services..."
    for svc in "${M1_SERVICES[@]}"; do
        echo ""
        echo "--- $svc (last 20 lines) ---"
        docker compose -f "$COMPOSE_FILE" logs --tail 20 "$svc" 2>/dev/null || echo "(no logs)"
    done
fi

# ---------------------------------------------------------------------------
# Step 6: Teardown (optional)
# ---------------------------------------------------------------------------
if [ "$TEARDOWN" = "true" ]; then
    log "Tearing down Docker Compose stack..."
    docker compose -f "$COMPOSE_FILE" down -v 2>&1 | tail -3
    log_ok "Stack torn down."
else
    log "Stack left running. Set TEARDOWN=true to auto-teardown."
fi

# ---------------------------------------------------------------------------
# Final Report
# ---------------------------------------------------------------------------
echo ""
if [ $TEST_EXIT -eq 0 ]; then
    log_ok "═══ M1 INTEGRATION TESTS: PASSED ═══"
else
    log_err "═══ M1 INTEGRATION TESTS: FAILED (exit code $TEST_EXIT) ═══"
fi

exit $TEST_EXIT

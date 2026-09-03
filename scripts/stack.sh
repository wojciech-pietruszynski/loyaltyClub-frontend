#!/usr/bin/env bash
#
# Sterowanie kontenerem SPA LoyaltyClub. Wszystko dzieje sie w Dockerze -
# na hoscie nie jest potrzebny Node.
#
# Warstwa serwerowa (siec loyaltyclub-net) musi dzialac wczesniej; podnosi ja
# repozytorium backendu: loyalytyClub-backend/scripts/stack.sh up
#
# Uzycie: scripts/stack.sh <polecenie>
#
#   build   - zbudowanie obrazu frontendu
#   test    - bramka jakosci w kontenerze (analizator, typy, testy)
#   up      - zbudowanie i uruchomienie SPA, z czekaniem na gotowosc
#   down    - zatrzymanie
#   logs    - biezace logi
#   ps      - stan uslug
#   smoke   - sprawdzenie SPA i przejscia /api do backendu
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE="docker compose"
IMAGE="${FRONTEND_IMAGE:-loyaltyclub/frontend}:${IMAGE_TAG:-local}"
FRONTEND_HOST_PORT="${FRONTEND_HOST_PORT:-8080}"
NETWORK="loyaltyclub-net"
READY_TIMEOUT="${READY_TIMEOUT:-60}"

log() { printf '\n==== %s\n' "$1"; }

require_docker() {
    docker info >/dev/null 2>&1 || {
        echo "BLAD: demon Dockera nie odpowiada." >&2
        exit 1
    }
}

# Siec jest wlasnoscia wdrozenia backendu - bez niej compose frontendu
# nie ruszy, wiec komunikat ma od razu wskazywac, co uruchomic.
require_network() {
    docker network inspect "$NETWORK" >/dev/null 2>&1 || {
        echo "BLAD: brak sieci $NETWORK." >&2
        echo "Uruchom najpierw warstwe serwerowa:" >&2
        echo "  cd ../loyalytyClub-backend && ./scripts/stack.sh up" >&2
        exit 1
    }
}

wait_for_health() {
    local name="loyalty-frontend" waited=0 status
    log "Czekam na gotowosc SPA (limit ${READY_TIMEOUT}s)"
    while [ "$waited" -lt "$READY_TIMEOUT" ]; do
        status="$(docker inspect -f '{{.State.Health.Status}}' "$name" 2>/dev/null || echo brak)"
        case "$status" in
            healthy) echo "SPA gotowe po ${waited}s."; return 0 ;;
            brak)    echo "BLAD: kontener $name nie istnieje." >&2; return 1 ;;
        esac
        if [ "$(docker inspect -f '{{.State.Running}}' "$name" 2>/dev/null)" = "false" ]; then
            echo "BLAD: kontener $name przestal dzialac. Logi:" >&2
            docker logs --tail 60 "$name" >&2 || true
            return 1
        fi
        sleep 2
        waited=$((waited + 2))
    done
    echo "BLAD: SPA nie zglosilo gotowosci w ${READY_TIMEOUT}s. Logi:" >&2
    docker logs --tail 80 "$name" >&2 || true
    return 1
}

cmd_build() {
    require_docker
    log "Budowanie obrazu $IMAGE"
    docker build --target runtime -t "$IMAGE" .
}

cmd_test() {
    require_docker
    log "Bramka jakosci w kontenerze"
    rm -rf coverage-docker
    docker build --target ci-reports --output "type=local,dest=coverage-docker" .
    echo "Raport pokrycia: coverage-docker/coverage"
}

cmd_up() {
    require_docker
    require_network
    log "Budowanie i uruchamianie SPA"
    $COMPOSE up -d --build
    wait_for_health
    cmd_smoke
    log "Gotowe"
    echo "Aplikacja: http://localhost:${FRONTEND_HOST_PORT}"
}

cmd_down() { require_docker; log "Zatrzymywanie SPA"; $COMPOSE down; }
cmd_logs() { require_docker; $COMPOSE logs -f --tail 100; }
cmd_ps()   { require_docker; $COMPOSE ps; }

cmd_smoke() {
    require_docker
    log "Test dymny"
    # 1) sam serwer statyczny
    curl -fsS -o /dev/null -w 'SPA:  HTTP %{http_code}\n' \
        "http://localhost:${FRONTEND_HOST_PORT}/"
    # 2) przejscie /api przez nginx do kontenera backendu - to jest wlasciwy
    #    dowod na komunikacje miedzy kontenerami. Bledne haslo daje 401,
    #    czyli odpowiedz backendu, a nie 502 od nginxa.
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' \
        -X POST "http://localhost:${FRONTEND_HOST_PORT}/api/admin/auth/login" \
        -H 'Content-Type: application/json' \
        -d '{"username":"smoke-test","password":"smoke-test"}')"
    echo "/api: HTTP ${code}"
    case "$code" in
        502|504|000)
            echo "BLAD: nginx nie dosiegnal backendu (HTTP ${code})." >&2
            exit 1
            ;;
    esac
}

case "${1:-}" in
    build) shift; cmd_build "$@" ;;
    test)  shift; cmd_test "$@" ;;
    up)    shift; cmd_up "$@" ;;
    down)  shift; cmd_down "$@" ;;
    logs)  shift; cmd_logs "$@" ;;
    ps)    shift; cmd_ps "$@" ;;
    smoke) shift; cmd_smoke "$@" ;;
    *)
        sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
        exit 1
        ;;
esac

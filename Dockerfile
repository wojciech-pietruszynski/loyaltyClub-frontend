# syntax=docker/dockerfile:1.7
#
# Budowanie i uruchamianie SPA LoyaltyClub w calosci w Dockerze.
# Etapy:
#   deps    - instalacja zaleznosci (osobna warstwa, cache npm)
#   ci      - bramka jakosci: analizator, typy, testy z pokryciem
#   build   - produkcyjny build Vite
#   runtime - nginx serwujacy statyki i przekazujacy /api do backendu
#
# Uzycie:
#   docker build -t loyaltyclub/frontend:local .
#   docker build --target ci .              # sama bramka jakosci

# ---------------------------------------------------------------- deps
FROM node:22-alpine AS deps
WORKDIR /app

# Same manifesty - warstwa z zaleznosciami przebudowuje sie tylko wtedy,
# gdy zmieni sie package-lock.json.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci

COPY . .

# ------------------------------------------------------------------ ci
# Osobny cel dla potoku: analizator statyczny, kontrola typow i testy.
# Ten sam zestaw polecen, co w bramce jakosci na GitHub Actions.
FROM deps AS ci
RUN npm run lint \
    && npm run typecheck \
    && npm run test:coverage

FROM scratch AS ci-reports
COPY --from=ci /app/coverage /coverage

# --------------------------------------------------------------- build
FROM deps AS build
# Vite wpisuje zmienne VITE_* do artefaktu w czasie budowania, wiec adres API
# jest decyzja budowania, a nie uruchomienia. Puste = ten sam origin co SPA,
# czyli zadania /api obsluguje nginx z etapu runtime. Wartosc niepusta ma sens
# tylko wtedy, gdy API stoi pod wlasna domena.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ------------------------------------------------------------- runtime
FROM nginx:1.29-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
# Wejscie obrazu nginx przepuszcza pliki z templates/ przez envsubst
# i zapisuje wynik do conf.d/ przy starcie kontenera.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

# Nazwa hosta backendu w sieci kontenerow (nazwa kontenera z compose backendu).
ENV BACKEND_ORIGIN=http://loyalty-backend:8089 \
    NGINX_RESOLVER=127.0.0.11

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
    CMD wget -qO /dev/null http://127.0.0.1:8080/healthz || exit 1

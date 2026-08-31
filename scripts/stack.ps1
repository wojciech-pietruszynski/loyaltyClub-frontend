<#
.SYNOPSIS
    Sterowanie kontenerem SPA LoyaltyClub.

.DESCRIPTION
    Odpowiednik scripts/stack.sh dla Windowsa. Calosc budowania i uruchamiania
    dzieje sie w Dockerze - na hoscie nie jest potrzebny Node.

    Warstwa serwerowa (siec loyaltyclub-net) musi dzialac wczesniej; podnosi ja
    repozytorium backendu: loyalytyClub-backend\scripts\stack.ps1 up

.PARAMETER Command
    build   - zbudowanie obrazu frontendu
    test    - bramka jakosci w kontenerze (analizator, typy, testy)
    up      - zbudowanie i uruchomienie SPA, z czekaniem na gotowosc
    down    - zatrzymanie
    logs    - biezace logi
    ps      - stan uslug
    smoke   - sprawdzenie SPA i przejscia /api do backendu

.EXAMPLE
    .\scripts\stack.ps1 up
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('build', 'test', 'up', 'down', 'logs', 'ps', 'smoke')]
    [string]$Command = 'up'
)

$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent $PSScriptRoot
Set-Location $RootDir

$Image = "$(if ($env:FRONTEND_IMAGE) { $env:FRONTEND_IMAGE } else { 'loyaltyclub/frontend' }):$(if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { 'local' })"
$FrontendPort = if ($env:FRONTEND_HOST_PORT) { $env:FRONTEND_HOST_PORT } else { '8080' }
$Network = 'loyaltyclub-net'
$ReadyTimeout = if ($env:READY_TIMEOUT) { [int]$env:READY_TIMEOUT } else { 60 }

function Write-Step([string]$Text) { Write-Host "`n==== $Text" -ForegroundColor Cyan }

function Assert-LastExitCode([string]$What) {
    if ($LASTEXITCODE -ne 0) { throw "$What zakonczylo sie kodem $LASTEXITCODE" }
}

function Assert-Docker {
    docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Demon Dockera nie odpowiada.' }
}

# Siec jest wlasnoscia wdrozenia backendu - bez niej compose frontendu
# nie ruszy, wiec komunikat ma od razu wskazywac, co uruchomic.
function Assert-Network {
    docker network inspect $Network *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Brak sieci $Network. Uruchom najpierw warstwe serwerowa: cd ..\loyalytyClub-backend; .\scripts\stack.ps1 up"
    }
}

function Wait-Health {
    $name = 'loyalty-frontend'
    $waited = 0
    Write-Step "Czekam na gotowosc SPA (limit ${ReadyTimeout}s)"
    while ($waited -lt $ReadyTimeout) {
        $status = docker inspect -f '{{.State.Health.Status}}' $name 2>$null
        if ($LASTEXITCODE -ne 0) { throw "Kontener $name nie istnieje." }
        if ($status -eq 'healthy') {
            Write-Host "SPA gotowe po ${waited}s."
            return
        }
        $running = docker inspect -f '{{.State.Running}}' $name 2>$null
        if ($running -eq 'false') {
            docker logs --tail 60 $name
            throw "Kontener $name przestal dzialac."
        }
        Start-Sleep -Seconds 2
        $waited += 2
    }
    docker logs --tail 80 $name
    throw "SPA nie zglosilo gotowosci w ${ReadyTimeout}s."
}

# Zwraca sam kod odpowiedzi. Invoke-WebRequest w Windows PowerShellu 5.1
# traktuje 4xx/5xx jak blad koncowy (przelacznik -SkipHttpErrorCheck jest
# dopiero w PowerShellu 7), wiec status odczytujemy takze ze sciezki wyjatku.
function Get-HttpStatus {
    param(
        [Parameter(Mandatory)][string]$Uri,
        [string]$Method = 'Get',
        [string]$Body,
        [string]$ContentType
    )
    $params = @{ Uri = $Uri; Method = $Method; UseBasicParsing = $true; TimeoutSec = 20 }
    if ($PSBoundParameters.ContainsKey('Body')) { $params.Body = $Body }
    if ($PSBoundParameters.ContainsKey('ContentType')) { $params.ContentType = $ContentType }
    try {
        return [int](Invoke-WebRequest @params).StatusCode
    } catch {
        $response = $_.Exception.Response
        if ($response) { return [int]$response.StatusCode }
        throw
    }
}

function Invoke-Smoke {
    Assert-Docker
    Write-Step 'Test dymny'

    # 1) sam serwer statyczny
    $spa = Get-HttpStatus -Uri "http://localhost:$FrontendPort/"
    Write-Host "SPA:  HTTP $spa"
    if ($spa -ne 200) { throw "SPA odpowiedzialo kodem $spa." }

    # 2) przejscie /api przez nginx do kontenera backendu - to jest wlasciwy
    #    dowod na komunikacje miedzy kontenerami. Bledne haslo daje 401,
    #    czyli odpowiedz backendu, a nie 502 od nginxa.
    $api = Get-HttpStatus -Uri "http://localhost:$FrontendPort/api/admin/auth/login" `
        -Method Post -ContentType 'application/json' `
        -Body '{"username":"smoke-test","password":"smoke-test"}'
    Write-Host "/api: HTTP $api"
    if ($api -eq 502 -or $api -eq 504) {
        throw "nginx nie dosiegnal backendu (HTTP $api)."
    }
}

switch ($Command) {
    'build' {
        Assert-Docker
        Write-Step "Budowanie obrazu $Image"
        docker build --target runtime -t $Image .
        Assert-LastExitCode 'docker build'
    }
    'test' {
        Assert-Docker
        Write-Step 'Bramka jakosci w kontenerze'
        if (Test-Path 'coverage-docker') { Remove-Item -Recurse -Force 'coverage-docker' }
        docker build --target ci-reports --output 'type=local,dest=coverage-docker' .
        Assert-LastExitCode 'Bramka jakosci'
        Write-Host 'Raport pokrycia: coverage-docker/coverage'
    }
    'up' {
        Assert-Docker
        Assert-Network
        Write-Step 'Budowanie i uruchamianie SPA'
        docker compose up -d --build
        Assert-LastExitCode 'docker compose up'
        Wait-Health
        Invoke-Smoke
        Write-Step 'Gotowe'
        Write-Host "Aplikacja: http://localhost:$FrontendPort"
    }
    'down' {
        Assert-Docker
        Write-Step 'Zatrzymywanie SPA'
        docker compose down
    }
    'logs'  { Assert-Docker; docker compose logs -f --tail 100 }
    'ps'    { Assert-Docker; docker compose ps }
    'smoke' { Invoke-Smoke }
}

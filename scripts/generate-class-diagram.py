# -*- coding: utf-8 -*-
"""
Generator diagramu klas frontendu loyalty-club.

Czyta zrodla z src (TypeScript / TSX), buduje diagram klas w PlantUML (jedna
strona na warstwe architektury), renderuje strony do SVG i sklada je w
wielostronicowe PDF-y w formatach A4 i A3 (orientacja pozioma).

Odpowiednik skryptu z repozytorium backendu -- diagram powstaje ze zrodel,
a nie z recznego eksportu z IntelliJ, dzieki czemu da sie go odtworzyc po
kazdej zmianie w kodzie.

Uruchomienie:
    python scripts/generate-class-diagram.py

Wymagania:
    - java (do uruchomienia plantuml.jar, patrz PLANTUML_JAR)
    - Google Chrome lub Edge (druk HTML -> PDF w trybie headless)

Wynik trafia do docs/diagrams/ (zrodla .puml, rysunki .svg, gotowe .pdf).
"""
import io
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(ROOT, "docs", "diagrams")

PLANTUML_VERSION = "1.2025.4"
PLANTUML_JAR = os.path.join(
    os.path.expanduser("~"), ".m2", "repository", "net", "sourceforge",
    "plantuml", "plantuml", PLANTUML_VERSION, "plantuml-%s.jar" % PLANTUML_VERSION)

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

# Maksymalny rozmiar rysunku strony w pikselach SVG. Dobrany tak, aby po
# wpasowaniu w arkusz A4 poziomo tekst klas mial ok. 1.2 mm wysokosci.
MAX_W, MAX_H = 2400, 1660

# Arkusz A4 poziomo ma po odjeciu naglowka i stopki proporcje ok. 1.6:1. Rysunek
# duzo szerszy marnuje wysokosc arkusza -- po wpasowaniu w szerokosc tekst klas
# robi sie drobniejszy, niz musi. Prog dobrany tak, by dzielic warstwy naprawde
# rozciagniete w poziomie, a nie kazda odbiegajaca od proporcji arkusza.
MAX_RATIO = 2.8

# Pliki testowe, zaplecze testow i deklaracje srodowiska nie naleza do
# architektury aplikacji.
SKIP_RE = re.compile(r'(\.test\.tsx?$)|(^test/)|(\.d\.ts$)')

MAX_FIELDS, MAX_METHODS, MAX_CONSTS = 18, 14, 16
ALIAS_LIMIT = 62


# --------------------------------------------------------------------------
# 1. Wstepne czyszczenie zrodla
# --------------------------------------------------------------------------

def strip_comments(text):
    """Usuwa komentarze, nie ruszajac literalow tekstowych (np. 'https://...')."""
    out, i, n = [], 0, len(text)
    while i < n:
        ch = text[i]
        if ch in "'\"`":
            quote = ch
            out.append(ch)
            i += 1
            while i < n:
                if text[i] == "\\":
                    out.append(text[i:i + 2])
                    i += 2
                    continue
                out.append(text[i])
                i += 1
                if text[i - 1] == quote:
                    break
            continue
        if ch == "/" and i + 1 < n:
            if text[i + 1] == "/":
                while i < n and text[i] != "\n":
                    i += 1
                continue
            if text[i + 1] == "*":
                end = text.find("*/", i + 2)
                i = n if end < 0 else end + 2
                continue
        out.append(ch)
        i += 1
    return "".join(out)


OPEN, CLOSE = "{[(<", "}])>"
ARROW = "\x01"


def depth_scan(text):
    """Zwraca trojki (indeks, glebokosc, znak); '=>' nie liczy sie jako '>'."""
    probe = text.replace("=>", "=" + ARROW)
    depth = 0
    for i, ch in enumerate(probe):
        yield i, depth, ch
        if ch in OPEN:
            depth += 1
        elif ch in CLOSE:
            depth = max(0, depth - 1)


def matching(text, start):
    """Zwraca indeks nawiasu domykajacego nawias otwarty na pozycji start."""
    pairs = {"{": "}", "[": "]", "(": ")", "<": ">"}
    opener = text[start]
    closer = pairs[opener]
    depth = 0
    for i in range(start, len(text)):
        if text[i] == opener:
            depth += 1
        elif text[i] == closer:
            depth -= 1
            if depth == 0:
                return i
    return len(text) - 1


def split_top(text, separators=";,"):
    """Dzieli tekst na fragmenty po separatorach wystepujacych na glebokosci 0."""
    parts, last = [], 0
    for i, depth, ch in depth_scan(text):
        if depth == 0 and ch in separators:
            parts.append(text[last:i])
            last = i + 1
    parts.append(text[last:])
    return [p.strip() for p in parts if p.strip()]


def clean_type(text):
    """Sprowadza zapis typu do jednej linii."""
    return re.sub(r"\s+", " ", text.replace(ARROW, ">")).strip().rstrip(";,").strip()


def shorten(text, limit=ALIAS_LIMIT):
    text = clean_type(text)
    return text if len(text) <= limit else text[:limit - 1] + "..."


# --------------------------------------------------------------------------
# 2. Parsowanie deklaracji
# --------------------------------------------------------------------------

LITERAL_UNION_RE = re.compile(r"^'[^']*'(\s*\|\s*'[^']*')+$")


def parse_members(body):
    """Rozklada cialo typu obiektowego na pola i sygnatury metod."""
    fields, methods = [], []
    for member in split_top(body, ";,"):
        colon = None
        for i, depth, ch in depth_scan(member):
            if depth == 0 and ch == ":":
                colon = i
                break
        if colon is None:
            continue
        head = member[:colon].strip()
        tail = clean_type(member[colon + 1:])
        if not tail or not head:
            continue
        if "(" in head:                        # sygnatura metody: foo(a: X): Y
            methods.append((head.split("(", 1)[0].strip().rstrip("?"), shorten(tail)))
        elif "=>" in tail:                     # pole funkcyjne: foo: (a) => Y
            methods.append((head.rstrip("?"), shorten(tail.rsplit("=>", 1)[1])))
        else:
            optional = head.endswith("?")
            name = head.rstrip("?").replace("readonly ", "").strip()
            if re.match(r"^[\w$]+$", name):
                fields.append((name + ("?" if optional else ""), shorten(tail)))
    return fields, methods


def parse_class_body(body):
    """Pola i metody komponentu klasowego lub klasy bledu."""
    fields, methods = [], []
    for match in re.finditer(r'^\s{2,6}(?:static\s+|readonly\s+)*(\w+)\s*:\s*([^=;{\n]+)', body, re.M):
        fields.append((match.group(1), shorten(match.group(2))))
    for match in re.finditer(
            r'^\s{2,6}(?:static\s+|async\s+)*(\w+)\s*\(([^)]*)\)\s*(?::\s*([\w<>\[\]| .]+))?\s*\{', body, re.M):
        if match.group(1) not in ("if", "for", "while", "switch", "catch"):
            methods.append((match.group(1), shorten(match.group(3) or "void")))
    return fields, methods


def parse_params(text):
    """Skrocona lista nazw parametrow funkcji."""
    names = []
    for part in split_top(text, ","):
        name = re.split(r"[:=]", part, maxsplit=1)[0].strip()
        if not name:
            continue
        names.append("{...}" if name.startswith(("{", "[")) else name.rstrip("?"))
    return names


def const_label(annotation, initializer):
    """Opis stalej: adnotacja typu, a gdy jej brak -- skrocony inicjalizator."""
    if annotation:
        return shorten(annotation)
    head = (initializer or "").strip()
    if head.startswith("{"):
        return "{...}"
    if head.startswith("["):
        return "[...]"
    call = re.match(r"([\w.]+)\s*\(", head)
    return call.group(1) + "(...)" if call else shorten(head)


def return_type(text, after):
    """Odczytuje adnotacje typu zwracanego znajdujaca sie za lista parametrow."""
    match = re.match(r'\s*:\s*([^{=;\n]+)', text[after:])
    return shorten(match.group(1)) if match else ""


def parse_file(path, rel):
    """Zwraca (deklaracje typow, importy, eksportowane funkcje i stale)."""
    text = strip_comments(io.open(path, encoding="utf-8-sig").read())
    pkg = os.path.dirname(rel) or "(root)"
    module = re.sub(r"\.tsx?$", "", rel)
    nodes, imports = [], []

    def add(name, kind, **extra):
        node = dict(name=name, kind=kind, pkg=pkg, module=module, path=rel,
                    fields=[], methods=[], consts=[], supers=[], alias="",
                    primary=False)
        node.update(extra)
        nodes.append(node)
        return node

    # importy -- zrodlo krawedzi zaleznosci dla wezlow funkcyjnych
    for match in re.finditer(r'^import\s+(?:type\s+)?([^;]+?)\s+from\s+[\'"]([^\'"]+)[\'"]', text, re.M):
        clause, spec = match.group(1), match.group(2)
        symbols = []
        named = re.search(r"\{(.*)\}", clause, re.S)
        if named:
            for item in named.group(1).split(","):
                item = item.strip().replace("type ", "")
                if item:
                    symbols.append(item.split(" as ")[0].strip())
        if not clause.strip().startswith(("{", "*")):
            default = re.match(r"^\s*(\w+)", clause)
            if default:
                symbols.append(default.group(1))
        imports.append(dict(spec=spec, symbols=symbols))

    # interface Name extends A, B { ... }
    for match in re.finditer(r'^(?:export\s+)?interface\s+(\w+)\s*(?:<[^>]*>)?\s*([^{]*)\{', text, re.M):
        opening = text.index("{", match.end() - 1)
        body = text[opening + 1:matching(text, opening)]
        supers = [s.strip() for s in match.group(2).replace("extends", "").split(",") if s.strip()]
        fields, methods = parse_members(body)
        add(match.group(1), "interface", fields=fields, methods=methods, supers=supers)

    # type Name = ...
    for match in re.finditer(r'^(?:export\s+)?type\s+(\w+)\s*(?:<[^=]*?>)?\s*=', text, re.M):
        rest = text[match.end():]
        end = len(rest)
        for i, depth, ch in depth_scan(rest):
            if depth == 0 and ch == ";":
                end = i
                break
        body = rest[:end].strip()
        if body.startswith("{"):
            fields, methods = parse_members(body[1:matching(body, 0)])
            add(match.group(1), "type", fields=fields, methods=methods)
        elif LITERAL_UNION_RE.match(clean_type(body)):
            add(match.group(1), "enum",
                consts=[v.strip().strip("'") for v in clean_type(body).split("|")])
        else:
            add(match.group(1), "type", alias=shorten(body))

    # enum Name { ... }
    for match in re.finditer(r'^(?:export\s+)?(?:const\s+)?enum\s+(\w+)\s*\{', text, re.M):
        opening = text.index("{", match.end() - 1)
        body = text[opening + 1:matching(text, opening)]
        consts = [re.split(r"[=,]", v)[0].strip() for v in body.split(",")]
        add(match.group(1), "enum", consts=[c for c in consts if re.match(r"^\w+$", c)])

    # class Name extends X implements Y { ... }
    for match in re.finditer(
            r'^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)\s*(?:<[^>]*>)?\s*([^{]*)\{', text, re.M):
        opening = text.index("{", match.end() - 1)
        body = text[opening + 1:matching(text, opening)]
        tail = match.group(2)
        supers = []
        ext = re.search(r'extends\s+([\w.]+)', tail)
        if ext:
            supers.append(ext.group(1))
        impl = re.search(r'implements\s+([^{]+)', tail)
        if impl:
            supers += [s.strip() for s in impl.group(1).split(",")]
        fields, methods = parse_class_body(body)
        add(match.group(1), "class", fields=fields, methods=methods, supers=supers)

    # eksportowane funkcje (params != None) i stale (params == None)
    exported = []
    for match in re.finditer(
            r'^export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(', text, re.M):
        opening = text.index("(", match.end() - 1)
        closing = matching(text, opening)
        exported.append((match.group(1), parse_params(text[opening + 1:closing]),
                         return_type(text, closing + 1)))
    for match in re.finditer(
            r'^export\s+const\s+(\w+)\s*(?::\s*([^=]+?))?\s*=\s*(?:async\s+)?\(', text, re.M):
        opening = text.index("(", match.end() - 1)
        closing = matching(text, opening)
        exported.append((match.group(1), parse_params(text[opening + 1:closing]),
                         return_type(text, closing + 1) or shorten(match.group(2) or "")))
    for match in re.finditer(r'^export\s+const\s+([A-Z]\w*)\s*:\s*([^=]+?)\s*=\s*[\[{]', text, re.M):
        exported.append((match.group(1), None, shorten(match.group(2))))
    for match in re.finditer(
            r'^export\s+const\s+([A-Z][A-Z0-9_]*)\s*(?::\s*([^=]+?))?\s*=\s*([\'"\d][^\n;]{0,30})', text, re.M):
        exported.append((match.group(1), None, const_label(match.group(2), match.group(3))))

    # `export default X;` -- deklaracja X stoi wyzej w pliku, bez slowa export
    default = re.search(r'^export\s+default\s+(\w+)\s*;', text, re.M)
    if default and not any(e[0] == default.group(1) for e in exported):
        name = default.group(1)
        function = re.search(r'^(?:async\s+)?function\s+%s\s*(?:<[^>]*>)?\s*\(' % name, text, re.M)
        constant = re.search(r'^const\s+%s\s*(?::\s*([^=]+?))?\s*=\s*([^\n;]{0,40})' % name, text, re.M)
        if function:
            opening = text.index("(", function.end() - 1)
            closing = matching(text, opening)
            exported.append((name, parse_params(text[opening + 1:closing]),
                             return_type(text, closing + 1)))
        elif constant:
            exported.append((name, None, const_label(constant.group(1), constant.group(2))))

    return nodes, imports, exported


# --------------------------------------------------------------------------
# 3. Budowa modelu: wezly funkcyjne i krawedzie
# --------------------------------------------------------------------------

# Punkt wejscia aplikacji nie eksportuje niczego, ale nalezy do architektury.
ENTRY_MODULES = {"main"}


def is_component(name, rel):
    return name[:1].isupper() and rel.endswith(".tsx")


def parse_sources():
    """Zwraca slownik wezlow: typy, komponenty, hooki i moduly narzedziowe."""
    raw_nodes, file_imports = [], {}
    for dirpath, _, files in os.walk(SRC):
        for name in sorted(files):
            if not name.endswith((".ts", ".tsx")):
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, SRC).replace("\\", "/")
            if SKIP_RE.search(rel):
                continue

            parsed, imports, exported = parse_file(path, rel)
            module = re.sub(r"\.tsx?$", "", rel)
            pkg = os.path.dirname(rel) or "(root)"
            file_imports[module] = imports

            functions = [e for e in exported if e[1] is not None]
            constants = [e for e in exported if e[1] is None]

            # komponent lub hook -- glowny wezel pliku, z pelna sygnatura
            primary = []
            for fname, params, ret in functions:
                if is_component(fname, rel):
                    kind, default_ret = "component", "JSX.Element"
                elif fname.startswith("use"):
                    kind, default_ret = "hook", "void"
                else:
                    continue
                signature = "%s(%s)" % (fname, ", ".join(params))
                primary.append(dict(
                    name=fname, kind=kind, pkg=pkg, module=module, path=rel,
                    fields=[], consts=[], supers=[], alias="", primary=True,
                    methods=[(signature, ret or default_ret)]))

            # modul narzedziowy -- plik bez komponentu i bez hooka
            if not primary:
                plain = [e for e in functions
                         if not is_component(e[0], rel) and not e[0].startswith("use")]
                if plain or constants or module in ENTRY_MODULES:
                    primary.append(dict(
                        name=module, kind="module", pkg=pkg, module=module, path=rel,
                        supers=[], alias="", consts=[], primary=True,
                        fields=[(c[0], c[2]) for c in constants],
                        methods=[("%s(%s)" % (f[0], ", ".join(f[1])), f[2] or "void")
                                 for f in plain]))

            raw_nodes.extend(primary)
            raw_nodes.extend(parsed)

    # nazwy musza byc unikalne w calym diagramie
    counts = {}
    for node in raw_nodes:
        counts[node["name"]] = counts.get(node["name"], 0) + 1
    nodes = {}
    for node in raw_nodes:
        key = node["name"]
        if key in nodes:
            key = "%s@%s" % (node["name"], node["module"])
        node["key"] = key
        # ta sama nazwa w dwoch plikach (np. lokalny typ widoku) -- etykieta
        # musi wskazywac, z ktorego modulu pochodzi dane pudelko
        node["label"] = node["name"] if counts[node["name"]] == 1 else             "%s (%s)" % (node["name"], os.path.basename(node["module"]))
        nodes[key] = node

    fold_props(nodes)
    return nodes, file_imports


def fold_props(nodes):
    """Wciaga typ `XProps` do wezla komponentu X i usuwa osobne pudelko."""
    by_module = {}
    for node in nodes.values():
        by_module.setdefault(node["module"], []).append(node)
    for group in by_module.values():
        for component in [n for n in group if n["kind"] in ("component", "class")]:
            for node in group:
                if node["kind"] in ("interface", "type") and \
                        node["name"] in (component["name"] + "Props", "Props"):
                    component["fields"] = node["fields"] + component["fields"]
                    component["methods"] = node["methods"] + component["methods"]
                    nodes.pop(node["key"], None)


def resolve_module(module, spec):
    """Zamienia sciezke importu na nazwe modulu wzgledem src."""
    if not spec.startswith("."):
        return None
    target = os.path.normpath(os.path.join(os.path.dirname(module), spec))
    return target.replace("\\", "/")


IDENT_RE = re.compile(r"\b[A-Z]\w*\b")
COLLECTION_TOKENS = ("[]", "Array<", "Record<", "Map<", "Set<")


def build_edges(nodes, file_imports):
    """Dziedziczenie, asocjacje z typow skladowych oraz zaleznosci z importow."""
    by_name = {}
    for key, node in nodes.items():
        by_name.setdefault(node["name"], key)
    by_module = {node["module"]: key for key, node in nodes.items() if node["primary"]}
    edges = set()

    for key, node in nodes.items():
        for sup in node["supers"]:
            target = by_name.get(re.split(r"[<.]", sup)[0])
            if target and target != key:
                edges.add((target, key, "inherit"))

        texts = [t for _, t in node["fields"]] + [t for _, t in node["methods"]]
        if node["alias"]:
            texts.append(node["alias"])
        for text in texts:
            multi = any(token in text for token in COLLECTION_TOKENS)
            for ident in IDENT_RE.findall(text):
                target = by_name.get(ident)
                if target and target != key:
                    edges.add((key, target, "many" if multi else "one"))

        if node["primary"]:
            for entry in file_imports.get(node["module"], []):
                target_module = resolve_module(node["module"], entry["spec"])
                if target_module in by_module and by_module[target_module] != key:
                    edges.add((key, by_module[target_module], "use"))
                for symbol in entry["symbols"]:
                    target = by_name.get(symbol)
                    if target and target != key:
                        edges.add((key, target, "use"))

    # slabsza relacja nie dubluje mocniejszej miedzy ta sama para wezlow
    strong = {(a, b) for a, b, kind in edges if kind in ("inherit", "one", "many")}
    edges = {e for e in edges if e[2] != "use" or (e[0], e[1]) not in strong}
    inherited = {(a, b) for a, b, kind in edges if kind == "inherit"}
    edges = {e for e in edges if e[2] == "inherit" or (e[0], e[1]) not in inherited}
    return sorted(edges)


# --------------------------------------------------------------------------
# 4. Podzial na strony
# --------------------------------------------------------------------------

LAYERS = [
    ("Model dziedzinowy — typy danych zwracanych przez API",
     lambda n: n["path"] == "types/index.ts"),
    ("Typy interfejsu użytkownika — zakładki, stany formularzy, formatowanie",
     lambda n: n["path"] == "types/ui.ts"),
    ("Warstwa dostępu do API — klient HTTP, walidacja odpowiedzi, błędy",
     lambda n: n["pkg"] == "api"),
    ("Hooki dziedzinowe — kontrakty i implementacje",
     lambda n: n["pkg"] == "hooks"),
    ("Kontekst aplikacji, powłoka i nawigacja",
     lambda n: n["pkg"] == "context"
     or n["path"] in ("App.tsx", "main.tsx", "routes.ts")
     or n["name"] in ("AppShell", "AppHeader", "ErrorBoundary")),
    ("Komponenty — sekcje funkcjonalne",
     lambda n: n["pkg"] == "components"
     and n["name"].endswith(("Section", "Page", "View", "Panel"))),
    ("Komponenty — modale i elementy wspólne",
     lambda n: n["pkg"] == "components"),
    ("Internacjonalizacja — słowniki, tłumaczenia, formatowanie",
     lambda n: n["pkg"] == "i18n"),
    ("Narzędzia pomocnicze — liczby i walidacja formularzy",
     lambda n: True),
]

COLOR = {"domain": "#FFF3C4", "ui": "#E3F2FD", "contract": "#E0F7FA",
         "component": "#FFE0E6", "hook": "#EDE7F6", "module": "#E8F5E9",
         "enum": "#FFECB3", "infra": "#ECEFF1", "other": "#FFFFFF",
         "ghost": "#F0F0F0"}


def stereotype(node):
    if node["kind"] == "enum":
        return "enum"
    if node["kind"] in ("component", "hook", "module"):
        return node["kind"]
    if node["kind"] == "class":
        return "infra"
    if node["path"] == "types/index.ts":
        return "domain"
    if node["path"] == "types/ui.ts":
        return "ui"
    if node["pkg"] == "hooks":
        return "contract"
    if node["pkg"] in ("api", "i18n", "lib", "context"):
        return "infra"
    return "other"


HEAD = """@startuml
!pragma layout smetana
skinparam dpi 96
skinparam shadowing false
skinparam defaultFontName Segoe UI
skinparam defaultFontSize 11
skinparam classFontSize 12
skinparam classAttributeFontSize 10
skinparam ArrowColor #546E7A
skinparam classBorderColor #37474F
skinparam classBackgroundColor #FFFFFF
skinparam packageBorderColor #90A4AE
skinparam packageBackgroundColor #FAFAFA
skinparam packageFontSize 13
skinparam packageFontStyle bold
skinparam nodesep 22
skinparam ranksep 40
hide empty members
"""

KEYWORD = {"interface": "interface", "enum": "enum"}
STEREO_TEXT = {"component": "komponent", "hook": "hook", "module": "moduł",
               "type": "typ", "interface": "interfejs"}
MAX_GHOSTS = 24


def alias_of(key):
    return re.sub(r"\W", "_", key)


def render_class(node):
    stereo = STEREO_TEXT.get(node["kind"], "")
    lines = ['  %s "%s" as %s %s%s {' % (
        KEYWORD.get(node["kind"], "class"), node["label"], alias_of(node["key"]),
        ("<<%s>> " % stereo) if stereo else "", COLOR[stereotype(node)])]
    if node["alias"]:
        lines.append("    = %s" % node["alias"])
    for const in node["consts"][:MAX_CONSTS]:
        lines.append("    %s" % const)
    for fname, ftype in node["fields"][:MAX_FIELDS]:
        lines.append("    - %s : %s" % (fname, ftype))
    for mname, mtype in node["methods"][:MAX_METHODS]:
        call = mname if "(" in mname else mname + "()"
        lines.append("    + %s : %s" % (call, mtype or "void"))
    lines.append("  }")
    return lines


def render_puml(nodes, edges, members, with_ghosts=True):
    """Buduje tresc pliku .puml dla jednej strony diagramu."""
    member_set = set(members)
    cross = [e for e in edges if (e[0] in member_set) != (e[1] in member_set)]
    ghosts = {(b if a in member_set else a) for a, b, _ in cross} - member_set
    if not with_ghosts or len(ghosts) > MAX_GHOSTS:
        ghosts, cross = set(), []

    lines = [HEAD]
    by_pkg = {}
    for key in sorted(members):
        by_pkg.setdefault(nodes[key]["pkg"], []).append(key)
    for pkg in sorted(by_pkg):
        lines.append('package "src%s" {' % ("" if pkg == "(root)" else "/" + pkg))
        for key in by_pkg[pkg]:
            lines.extend(render_class(nodes[key]))
        lines.append("}")
    if ghosts:
        lines.append('package "powiązania spoza tej strony" %s {' % COLOR["ghost"])
        for key in sorted(ghosts):
            lines.append('  class "%s" as %s %s'
                         % (nodes[key]["label"], alias_of(key), COLOR["ghost"]))
        lines.append("}")

    local = [e for e in edges if e[0] in member_set and e[1] in member_set]
    for a, b, kind in sorted(set(local + cross)):
        a, b = alias_of(a), alias_of(b)
        if kind == "inherit":
            lines.append("%s <|-- %s" % (a, b))
        elif kind == "many":
            lines.append('%s "1" --> "*" %s' % (a, b))
        elif kind == "use":
            lines.append("%s ..> %s" % (a, b))
        else:
            lines.append("%s --> %s" % (a, b))
    lines.append("@enduml")
    return "\n".join(lines)


# --------------------------------------------------------------------------
# 5. Renderowanie SVG (z podzialem zbyt duzych stron)
# --------------------------------------------------------------------------

def plantuml(paths):
    subprocess.check_call(
        ["java", "-Djava.awt.headless=true", "-Xmx2g", "-jar", PLANTUML_JAR,
         "-tsvg", "-charset", "UTF-8"] + paths,
        stdout=subprocess.DEVNULL)


def svg_size(path):
    head = io.open(path, encoding="utf-8").read(400)
    box = re.search(r'viewBox="0 0 (\d+) (\d+)"', head)
    return (int(box.group(1)), int(box.group(2))) if box else (0, 0)


def split_members(nodes, members):
    """Dzieli liste wezlow na dwie polowy, nie rozbijajac plikow bez potrzeby."""
    ordered = sorted(members, key=lambda k: (nodes[k]["path"], nodes[k]["name"]))
    half = len(ordered) // 2
    for shift in range(0, max(1, len(ordered) // 4)):
        for cut in (half - shift, half + shift):
            if 0 < cut < len(ordered) and \
                    nodes[ordered[cut]]["path"] != nodes[ordered[cut - 1]]["path"]:
                return ordered[:cut], ordered[cut:]
    return ordered[:half], ordered[half:]


class Renderer(object):
    """Renderuje strony do plikow tymczasowych i pamieta ich rozmiary."""

    def __init__(self, nodes, edges):
        self.nodes, self.edges, self.counter = nodes, edges, 0

    def render(self, base, members, with_ghosts=True):
        self.counter += 1
        stem = os.path.join(OUT, "tmp-%04d" % self.counter)
        io.open(stem + ".puml", "w", encoding="utf-8").write(
            render_puml(self.nodes, self.edges, sorted(members), with_ghosts))
        plantuml([stem + ".puml"])
        width, height = svg_size(stem + ".svg")
        return dict(stem=stem, base=base, members=sorted(members),
                    width=width, height=height, ghosts=with_ghosts)

    def attempt(self, base, members):
        """Ramka `powiazania spoza tej strony` rozpycha rysunek -- gdy strona
        przez nia nie miesci sie w arkuszu, lepiej ja pominac niz dzielic warstwe."""
        page = self.render(base, members)
        if self.fits(page):
            return page
        self.discard(page)
        return self.render(base, members, with_ghosts=False)

    @staticmethod
    def fits(page):
        return (page["width"] <= MAX_W and page["height"] <= MAX_H
                and page["width"] <= page["height"] * MAX_RATIO)

    @staticmethod
    def discard(page):
        for ext in (".puml", ".svg"):
            if os.path.exists(page["stem"] + ext):
                os.remove(page["stem"] + ext)


def render_pages(nodes, edges):
    """Dzieli warstwy na strony miesczace sie w arkuszu, potem scala nadmiarowe ciecia."""
    renderer = Renderer(nodes, edges)
    taken, layers = set(), []
    for title, predicate in LAYERS:
        members = sorted(k for k, n in nodes.items() if k not in taken and predicate(n))
        if members:
            taken.update(members)
            layers.append((title, members))

    pages = []
    for title, members in layers:
        work, done = [members], []
        while work:
            chunk = work.pop(0)
            page = renderer.attempt(title, chunk)
            if Renderer.fits(page) or len(chunk) <= 4:
                done.append(page)
                continue
            renderer.discard(page)
            first, second = split_members(nodes, chunk)
            work.insert(0, second)
            work.insert(0, first)
        pages.extend(merge_pass(renderer, title, done))
    return finalize(pages)


def merge_pass(renderer, title, pages):
    """Skleja sasiednie fragmenty jednej warstwy, dopoki mieszcza sie na arkuszu."""
    merged = True
    while merged and len(pages) > 1:
        merged = False
        for i in range(len(pages) - 1):
            candidate = renderer.attempt(title, pages[i]["members"] + pages[i + 1]["members"])
            if Renderer.fits(candidate):
                renderer.discard(pages[i])
                renderer.discard(pages[i + 1])
                pages[i:i + 2] = [candidate]
                merged = True
                break
            renderer.discard(candidate)
    return pages


def finalize(pages):
    """Nadaje tytulom numery czesci, a plikom ostateczne nazwy."""
    counts = {}
    for page in pages:
        counts[page["base"]] = counts.get(page["base"], 0) + 1
    seen = {}
    for number, page in enumerate(pages, start=1):
        total = counts[page["base"]]
        seen[page["base"]] = seen.get(page["base"], 0) + 1
        page["title"] = page["base"] if total == 1 else \
            "%s (cz. %d z %d)" % (page["base"], seen[page["base"]], total)
        page["number"] = number
        stem = os.path.join(OUT, "page-%02d" % number)
        for ext in (".puml", ".svg"):
            if os.path.exists(stem + ext):
                os.remove(stem + ext)
            shutil.move(page["stem"] + ext, stem + ext)
        page["stem"] = stem
    return pages


# --------------------------------------------------------------------------
# 6. Skladanie PDF (Chrome headless)
# --------------------------------------------------------------------------

FORMATS = {"a4": ("A4", 287.0, 200.0), "a3": ("A3", 410.0, 287.0)}

# Stopka z odsylaczami ma stala wysokosc czterech wierszy, a jej tresc jest
# skracana do trzech - dzieki temu zaden wiersz nie zostaje przeciety w polowie,
# a obszar rysunku jest identyczny na kazdym arkuszu.
XREF_BUDGET = 700
XREF_STEPS = (6, 4, 2, 0)


def cross_references(nodes, edges, pages):
    """Dla kazdej strony spisuje elementy z pozostalych stron, z ktorymi laczy
    ja relacja. Ramka `powiazania spoza tej strony` miesci sie tylko na czesci
    arkuszy, wiec pelny wykaz idzie do stopki strony PDF."""
    page_of = {key: page["number"] for page in pages for key in page["members"]}
    for page in pages:
        members = set(page["members"])
        related = {}
        for a, b, _ in edges:
            for near, far in ((a, b), (b, a)):
                if near in members and far not in members and far in page_of:
                    related.setdefault(page_of[far], set()).add(nodes[far]["label"])
        page["links"] = [(number, sorted(names)) for number, names in sorted(related.items())]


def xref_entries(links, per_page):
    """Wykaz powiazan; per_page = 0 oznacza same liczby zamiast nazw."""
    parts = []
    for number, names in links:
        if per_page:
            rest = len(names) - per_page
            parts.append("str.&nbsp;%d: %s%s" % (
                number, ", ".join(names[:per_page]),
                (" i %d dalszych" % rest) if rest > 0 else ""))
        else:
            parts.append("str.&nbsp;%d: %d elem." % (number, len(names)))
    return "; ".join(parts)


def xref_html(page):
    text = ""
    for per_page in XREF_STEPS:
        text = xref_entries(page.get("links", []), per_page)
        if len(text.replace("&nbsp;", " ")) <= XREF_BUDGET:
            break
    if not text:
        return '<div class="xref"></div>'
    return '<div class="xref"><b>Powiązania z innymi stronami</b> &mdash; %s</div>' % text


LEGEND_ITEMS = [
    ("domain", "typ dziedzinowy"),
    ("ui", "typ interfejsu"),
    ("contract", "kontrakt hooka"),
    ("hook", "hook"),
    ("component", "komponent"),
    ("module", "moduł"),
    ("enum", "typ wyliczeniowy"),
    ("infra", "infrastruktura"),
    ("ghost", "element z innej strony"),
]


def inline_svg(path):
    """Rysunek trafia do arkusza jako element SVG skalowany do obszaru strony."""
    svg = io.open(path, encoding="utf-8").read()
    svg = re.sub(r'\sstyle="width:[^"]*"', '', svg, count=1)
    svg = re.sub(r'\swidth="\d+px"', ' width="100%"', svg, count=1)
    svg = re.sub(r'\sheight="\d+px"', ' height="100%"', svg, count=1)
    svg = svg.replace('preserveAspectRatio="none"',
                      'preserveAspectRatio="xMidYMid meet"', 1)
    return svg


def build_html(pages, fmt):
    css_page, width_mm, height_mm = FORMATS[fmt]
    parts = ["""<meta charset="utf-8"><title>Diagram klas — loyalty-club (frontend)</title><style>
@page { size: %s landscape; margin: 5mm; }
html, body { margin: 0; padding: 0; background: #fff; }
body { font-family: "Segoe UI", Arial, sans-serif; color: #263238; }
.sheet { width: %.1fmm; height: %.1fmm; page-break-after: always;
         display: flex; flex-direction: column; overflow: hidden; }
.sheet:last-child { page-break-after: auto; }
.hd { display: flex; justify-content: space-between; align-items: baseline;
      border-bottom: 0.4mm solid #37474F; padding-bottom: 1mm; margin-bottom: 2mm;
      font-size: 3.2mm; }
.hd b { font-size: 3.8mm; }
.hd span { color: #607D8B; }
.art { flex: 1 1 auto; min-height: 0; display: flex; align-items: center;
       justify-content: center; }
.art svg { max-width: 100%%; max-height: 100%%; }
.xref { margin-top: 1.5mm; font-size: 2.5mm; color: #546E7A;
        line-height: 3.4mm; height: 13.6mm; overflow: hidden; flex: 0 0 auto; }
.xref b { color: #37474F; }
.legend { margin-top: 1.5mm; font-size: 2.6mm; color: #455A64;
          display: flex; gap: 4mm; flex-wrap: wrap; }
.legend i { display: inline-block; width: 3mm; height: 2.2mm; margin-right: 1mm;
            border: 0.2mm solid #37474F; vertical-align: middle; }
</style>""" % (css_page, width_mm, height_mm)]

    legend = "".join("<span><i style='background:%s'></i>%s</span>" % (COLOR[key], text)
                     for key, text in LEGEND_ITEMS)

    for page in pages:
        parts.append(
            '<div class="sheet"><div class="hd"><b>%s</b>'
            '<span>loyalty-club frontend &middot; diagram klas &middot; %d elementów &middot; '
            'strona %d/%d</span></div><div class="art">%s</div>%s'
            '<div class="legend">%s</div></div>'
            % (page["title"], len(page["members"]), page["number"], len(pages),
               inline_svg(page["stem"] + ".svg"), xref_html(page), legend))
    return "".join(parts)


def find_chrome():
    for path in CHROME_CANDIDATES:
        if os.path.exists(path):
            return path
    raise SystemExit("Nie znaleziono Chrome ani Edge - nie moge wydrukowac PDF.")


def print_pdf(html_path, pdf_path):
    chrome = find_chrome()
    subprocess.check_call([
        chrome, "--headless", "--disable-gpu", "--no-sandbox",
        "--run-all-compositor-stages-before-draw", "--virtual-time-budget=20000",
        "--no-pdf-header-footer", "--print-to-pdf=" + pdf_path,
        "file:///" + html_path.replace("\\", "/")],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


# --------------------------------------------------------------------------

def main():
    if not os.path.exists(PLANTUML_JAR):
        raise SystemExit(
            "Brak plantuml.jar. Pobierz go poleceniem:\n"
            "  mvn dependency:get -Dartifact=net.sourceforge.plantuml:plantuml:%s"
            % PLANTUML_VERSION)
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    for stale in os.listdir(OUT):
        if re.match(r'^(page-\d+|tmp-\d+|class-diagram-full)\.(puml|svg)$', stale):
            os.remove(os.path.join(OUT, stale))

    nodes, file_imports = parse_sources()
    edges = build_edges(nodes, file_imports)
    print("Sparsowano %d elementow, %d relacji." % (len(nodes), len(edges)))

    # pelny diagram na jednym arkuszu - material zrodlowy do przegladania na ekranie
    full = os.path.join(OUT, "class-diagram-full")
    io.open(full + ".puml", "w", encoding="utf-8").write(
        render_puml(nodes, edges, list(nodes)))
    plantuml([full + ".puml"])
    print("class-diagram-full.svg -> %dx%d px" % svg_size(full + ".svg"))

    pages = render_pages(nodes, edges)
    cross_references(nodes, edges, pages)
    print("Strony diagramu: %d" % len(pages))
    for page in pages:
        print("  %2d. %-70s %3d elem.  %dx%d px"
              % (page["number"], page["title"][:70], len(page["members"]),
                 page["width"], page["height"]))

    for fmt in ("a4", "a3"):
        html_path = os.path.join(OUT, "class-diagram-%s.html" % fmt)
        pdf_path = os.path.join(OUT, "class-diagram-%s.pdf" % fmt)
        io.open(html_path, "w", encoding="utf-8").write(build_html(pages, fmt))
        print_pdf(html_path, pdf_path)
        os.remove(html_path)
        size = os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
        print("%s -> %.1f kB" % (os.path.basename(pdf_path), size / 1024.0))

    io.open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8").write(
        json.dumps([{"number": p["number"], "title": p["title"],
                     "members": [nodes[k]["label"] for k in p["members"]],
                     "links": {str(number): names for number, names in p["links"]},
                     "width": p["width"], "height": p["height"]} for p in pages],
                   indent=1, ensure_ascii=False))


if __name__ == "__main__":
    sys.exit(main())

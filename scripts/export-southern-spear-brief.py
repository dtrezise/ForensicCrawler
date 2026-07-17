#!/usr/bin/env python3
"""Render the audited Southern Spear vessel-strike package as a private PDF brief."""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "fixtures/pilots/southern-spear-vessel-strikes/forensic-package.json"
SCENE = ROOT / "fixtures/pilots/southern-spear-vessel-strikes/local/reconstruction-scene.json"
OUTPUT = ROOT / "output/pdf/SOUTHERN_SPEAR_VESSEL_STRIKES_FIRST_PASS.pdf"

PAGE_W, PAGE_H = landscape(letter)
MARGIN_X = 0.55 * inch
MARGIN_Y = 0.48 * inch
BG = colors.HexColor("#071219")
PANEL = colors.HexColor("#0F2028")
PANEL_2 = colors.HexColor("#173039")
LINE = colors.HexColor("#29434D")
TEXT = colors.HexColor("#E9F0F2")
MUTED = colors.HexColor("#A9B8BE")
MUTED_2 = colors.HexColor("#6D818A")
GOLD = colors.HexColor("#D7B866")
RED = colors.HexColor("#D66B73")
BLUE = colors.HexColor("#69B2CF")
GREEN = colors.HexColor("#77C39A")
PURPLE = colors.HexColor("#A983D0")


def safe(value: object) -> str:
    return (
        str(value)
        .replace("\u2011", "-")
        .replace("\u2013", "-")
        .replace("\u2014", "-")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def load() -> tuple[dict, dict]:
    return json.loads(INPUT.read_text()), json.loads(SCENE.read_text())


def claim_text(data: dict, claim: dict) -> str:
    return next(item["text"] for item in data["claimRevisions"] if item["id"] == claim["currentRevisionId"])


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle("kicker", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=GOLD, spaceAfter=5),
        "title": ParagraphStyle("title", parent=base["Title"], fontName="Helvetica-Bold", fontSize=25, leading=28, textColor=TEXT, alignment=TA_LEFT, spaceAfter=8),
        "h1": ParagraphStyle("h1", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=20, textColor=TEXT, spaceAfter=8),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=TEXT, spaceAfter=5),
        "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Helvetica", fontSize=8.2, leading=11.3, textColor=MUTED, spaceAfter=5),
        "body_small": ParagraphStyle("body_small", parent=base["BodyText"], fontName="Helvetica", fontSize=7, leading=9.1, textColor=MUTED, spaceAfter=3),
        "body_white": ParagraphStyle("body_white", parent=base["BodyText"], fontName="Helvetica", fontSize=9, leading=12.4, textColor=TEXT, spaceAfter=5),
        "callout": ParagraphStyle("callout", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=colors.HexColor("#E8D8B4")),
        "table_head": ParagraphStyle("table_head", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=6.25, leading=7.7, textColor=GOLD),
        "table": ParagraphStyle("table", parent=base["Normal"], fontName="Helvetica", fontSize=6.2, leading=7.85, textColor=MUTED),
        "table_white": ParagraphStyle("table_white", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=6.3, leading=7.95, textColor=TEXT),
        "tiny": ParagraphStyle("tiny", parent=base["Normal"], fontName="Helvetica", fontSize=5.35, leading=6.45, textColor=MUTED),
        "tiny_white": ParagraphStyle("tiny_white", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=5.45, leading=6.55, textColor=TEXT),
        "mono": ParagraphStyle("mono", parent=base["Code"], fontName="Courier", fontSize=6.2, leading=8.2, textColor=MUTED),
        "foot": ParagraphStyle("foot", parent=base["Normal"], fontName="Courier", fontSize=5.7, leading=7, textColor=MUTED_2),
    }


ST = make_styles()


def para(text: object, style: str = "body") -> Paragraph:
    return Paragraph(safe(text), ST[style])


def rich(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, ST[style])


def bullets(items: list[str], color=GOLD, style: str = "body") -> list[Paragraph]:
    return [rich(f'<font color="{color.hexval()}">-</font> {safe(item)}', style) for item in items]


def card(items, widths=None, padding=12, background=PANEL):
    result = Table([items], colWidths=widths, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
    ]))
    return result


def grid(data, widths, repeat_header=True, padding=4):
    result = Table(data, colWidths=widths, repeatRows=1 if repeat_header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
    ]
    if repeat_header:
        commands.extend([("BACKGROUND", (0, 0), (-1, 0), PANEL_2), ("TEXTCOLOR", (0, 0), (-1, 0), GOLD)])
    for row in range(1 if repeat_header else 0, len(data)):
        commands.append(("BACKGROUND", (0, row), (-1, row), PANEL if row % 2 else colors.HexColor("#0B1920")))
    result.setStyle(TableStyle(commands))
    return result


def page_header(kicker: str, title: str, subtitle: str | None = None):
    parts = [para(kicker.upper(), "kicker"), para(title, "h1")]
    if subtitle:
        parts.append(para(subtitle, "body"))
    parts.append(Spacer(1, 0.05 * inch))
    return parts


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN_X, 0.31 * inch, PAGE_W - MARGIN_X, 0.31 * inch)
    canvas.setFont("Courier", 5.7)
    canvas.setFillColor(MUTED_2)
    canvas.drawString(MARGIN_X, 0.17 * inch, "FORENSIC CRAWLER / PRIVATE WORKING BRIEF / EVIDENCE CUTOFF 17 JUL 2026")
    canvas.drawRightString(PAGE_W - MARGIN_X, 0.17 * inch, f"{doc.page:02d}")
    canvas.restoreState()


class BriefDoc(BaseDocTemplate):
    def __init__(self, filename: Path):
        super().__init__(str(filename), pagesize=landscape(letter), leftMargin=MARGIN_X, rightMargin=MARGIN_X, topMargin=MARGIN_Y, bottomMargin=0.42 * inch, title="Operation Southern Spear Vessel Strikes - First-Pass Forensic Crawler Brief", author="Forensic Crawler")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id="brief", frames=frame, onPage=footer))


def build_story(data: dict, scene: dict):
    inv = data["investigations"][0]
    story = []

    story += [Spacer(1, 0.55 * inch), para("FORENSIC CRAWLER / CAMPAIGN TEST", "kicker"), para("Operation Southern Spear vessel strikes", "title"), para("Non-graphic public-record reconstruction of the U.S. lethal vessel-strike campaign across the Caribbean and eastern Pacific", "body_white"), Spacer(1, 0.24 * inch)]
    story.append(card([
        [para("STATUS", "kicker"), para("WORKING - PRIVATE", "h2"), para("Not approved for public release", "body_small")],
        [para("PUBLIC LOWER BOUND", "kicker"), para("AT LEAST 66 VESSELS", "h2"), para("Derived through 21 Jun; not an official complete ledger", "body_small")],
        [para("RECONSTRUCTION", "kicker"), para("QUALITATIVE", "h2"), para("Unitless, non-geographic, non-photogrammetric", "body_small")],
    ], widths=[3.1 * inch] * 3, padding=13))
    story += [Spacer(1, 0.25 * inch), rich('<font color="#D7B866"><b>BOUNDARY</b></font>  This campaign began near Venezuela, but it is not confined to Venezuela. Target, cargo, casualty, survivor, maritime-zone, threat, and legal claims remain source-specific.', "callout"), Spacer(1, 0.30 * inch), para(f"Package {data['packageId']} / Schema {data['schemaVersion']} / 20 source locators / 0 remote source bodies", "mono"), PageBreak()]

    story += page_header("01 / campaign boundary", "What the public record establishes - and what it cannot", inv["purpose"])
    left = [para("ESTABLISHED PUBLIC RECORD", "kicker")] + bullets([
        "The first publicly announced vessel strike occurred on September 2, 2025.",
        "Operation Southern Spear was formally named in November 2025.",
        "The Lead IG reported at least 47 boats and 156 killed or presumed dead through March 31.",
        "A source-by-source reconciliation yields at least 66 vessels through June 21.",
        "AP reported more than 60 attacks and more than 210 killed by June 22.",
    ])
    right = [para("NON-NEGOTIABLE LIMITS", "kicker")] + bullets([
        "SOUTHCOM told the Lead IG it could not provide a complete public accounting.",
        "No single death number merges immediate, missing, survivor, and presumed-death categories.",
        "Most target packets, cargo evidence, coordinates, native sensor files, and full legal analysis are not public.",
        "Institutional legal positions and civil allegations are not court findings.",
        "No campaign-legality merits judgment or completed legality investigation was identified by the cutoff.",
    ], RED)
    story.append(card([left, right], widths=[4.65 * inch, 4.65 * inch], padding=15))
    story += [Spacer(1, 0.16 * inch), rich('<font color="#D66B73"><b>DO NOT FLATTEN</b></font>  47 boats / 156 killed or presumed dead through March 31 and more than 60 attacks / more than 210 killed through June 22 are different source aggregates with different cutoffs.', "callout"), PageBreak()]

    story += page_header("02 / representative chronology", "Campaign and accountability timeline", "This is a milestone register, not a fabricated complete strike ledger.")
    rows = [[para("SOURCE DATE", "table_head"), para("EVENT", "table_head"), para("EVIDENTIARY READING", "table_head")]]
    for event in data["events"]:
        anchors = [next(item for item in data["temporalAnchors"] if item["id"] == anchor_id) for anchor_id in event["temporalAnchorIds"]]
        label = " / ".join(item["originalExpression"] for item in anchors)
        reading = "Attributed incident account" if "strike" in event["title"].lower() else "Public record milestone"
        rows.append([para(label, "table"), rich(f'<b><font color="#E9F0F2">{safe(event["title"])}</font></b><br/>{safe(event["description"])}', "table"), para(reading, "table")])
    story.append(grid(rows, [1.75 * inch, 6.15 * inch, 1.4 * inch], padding=3))
    story += [Spacer(1, 6), para("Strike, engagement, and vessel counts can differ. October 27 reporting, for example, describes multiple strikes affecting four vessels; the engine retains the source unit instead of forcing a false one-row-per-strike ledger.", "foot"), PageBreak()]

    story += page_header("03 / spatial and visual method", "A maritime event cell, not an attack replay", scene["status"])
    anchor_rows = [[para("ANCHOR", "table_head"), para("METHOD", "table_head"), para("DISPLAY UNCERTAINTY", "table_head")]]
    for anchor in data["spatialAnchors"]:
        anchor_rows.append([para(anchor["label"], "table_white"), para(anchor["method"], "table"), para(f"{anchor['uncertaintyMeters']:,} m", "table")])
    method = [para("EVENT_LOCAL_V1", "kicker"), para("Origin: apparent vessel centroid", "body_white"), para("Unitless axes and a generic hull support source-state review only. True location, scale, heading, speed, camera pose, and environmental conditions remain unknown.", "body"), Spacer(1, 6), para("DISPLAYED STATES", "kicker")] + bullets(["Published-source vessel silhouette", "Attributed two-death count", "Attributed six-survivor count", "SAR-notification state", "Mutually exclusive maritime-zone hypotheses", "Cargo, identity, coordinate, platform, and munition unknowns"], GREEN, "body_small")
    story.append(Table([[grid(anchor_rows, [2.0 * inch, 3.95 * inch, 0.75 * inch]), card([method], widths=[2.4 * inch], padding=12)]], colWidths=[6.8 * inch, 2.5 * inch], style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)])))
    story += [Spacer(1, 8), rich('<font color="#A983D0"><b>MARITIME ZONES</b></font>  "International waters" remains an attributed phrase. Without coordinates, datum, baselines, and boundary data, the engine cannot choose territorial sea, EEZ outside territorial sea, or high seas.', "callout"), Spacer(1, 6), para("No impact, bodies, faces, injuries, attack trajectory, launch point, platform, munition, sensor type, route, targeting pipeline, or survivor/SAR coordinates are depicted or inferred.", "body"), PageBreak()]

    for page, claim_slice in enumerate((data["claims"][:12], data["claims"][12:]), start=1):
        story += page_header(f"0{3 + page} / evidence ledger", f"Claim-state ledger - part {page}", "Confidence describes the review posture, not probability of guilt or legal validity.")
        claim_rows = [[para("ID", "table_head"), para("STATE", "table_head"), para("CURRENT CLAIM", "table_head"), para("SOURCE / PROCEDURAL BOUNDARY", "table_head")]]
        offset = 0 if page == 1 else 12
        for idx, claim in enumerate(claim_slice, offset + 1):
            source_count = sum(1 for item in data["claimSourceRelationships"] if item["claimId"] == claim["id"])
            boundary = f"{source_count} linked source(s). {claim['proceduralStatus']}"
            claim_rows.append([para(f"CLM-{idx:03d}", "tiny"), para(claim["evidenceState"].replace("_", " "), "tiny"), para(claim_text(data, claim), "tiny"), para(boundary, "tiny")])
        story.append(grid(claim_rows, [0.55 * inch, 1.25 * inch, 4.25 * inch, 3.25 * inch], padding=3))
        story += [Spacer(1, 5), para("U.S. target, cargo, DTO, route, international-waters, casualty, and SAR claims remain attributed. Litigation allegations and institutional assessments remain separately labeled.", "foot"), PageBreak()]

    story += page_header("06 / contradiction register", "Conflicts the engine refuses to average away", "Each alternative is retained for testing; none is silently adopted.")
    conflict_rows = [[para("CONFLICT", "table_head"), para("CURRENT READING", "table_head"), para("STATUS", "table_head")]]
    for conflict in data["contradictions"]:
        alternatives = "; ".join(conflict["alternateExplanations"])
        conflict_rows.append([para(conflict["title"], "table_white"), rich(f'{safe(conflict["description"])}<br/><font color="#6D818A">Retained alternatives: {safe(alternatives)}</font>', "table"), para(conflict["status"], "table")])
    story.append(grid(conflict_rows, [1.8 * inch, 6.45 * inch, 1.05 * inch]))
    story += [Spacer(1, 8), rich('<font color="#D66B73"><b>EDITORIAL RULE</b></font>  Do not convert classification into guilt, official casualty wording into verified identity, an edited clip into native sensor evidence, or the absence of public proof into proof that no classified evidence exists.', "callout"), PageBreak()]

    story += page_header("07 / source registry", "Twenty exact locators; zero remote source bodies retained")
    source_rows = [[para("SOURCE / PUBLISHER", "table_head"), para("ROLE", "table_head"), para("SAFE RETENTION", "table_head")]]
    for source in data["sources"]:
        rights = next(item for item in data["rightsDecisions"] if item["id"] == source["rightsDecisionId"])
        source_rows.append([rich(f'<b><font color="#E9F0F2">{safe(source["title"])}</font></b><br/>{safe(source["publisher"])}', "tiny"), para(source["sourceType"].replace("_", " "), "tiny"), para(f"{rights['storagePermission']}; {rights['exportPermission']}", "tiny")])
    story.append(grid(source_rows, [5.0 * inch, 1.55 * inch, 2.75 * inch], padding=2))
    story += [Spacer(1, 5), para("Official records establish what an institution published or asserted. Independent reporting may rely on the same underlying government release. The complaint states plaintiffs' allegations; the docket establishes procedure, not merits.", "foot"), PageBreak()]

    story += page_header("08 / provenance, dignity, and upgrade gate", "What a defensible next reconstruction would require")
    provenance = [para("INTEGRITY", "kicker"), para(f"{len(data['auditEvents'])} linked audit events", "h2"), para(f"{len(data['assetCaptures'])} local JSON captures matched SHA-256 and byte size. {len(data['claimSourceRelationships'])} claim-source relationships preserve source function and locator.", "body"), Spacer(1, 6), para("INTENTIONALLY EXCLUDED", "kicker")] + bullets(["Fatal-strike clips, stills, impacts, bodies, faces, remains, and identifying imagery", "Private family data, speculative victim identification, or survivor tracking", "Coordinates, targeting geometry, platforms, munitions, sensors, routes, surveillance patterns, and SAR locations", "Remote article bodies, court-file bytes, thumbnails, or social-media payloads"], RED, "body_small")
    upgrade = [para("METRIC / PHOTOGRAMMETRY GATE", "kicker")] + bullets(["Preserved native files, cryptographic hashes, and complete edit lineage", "Verified event clock, frame cadence, sensor model, camera calibration, and platform telemetry", "Known vessel dimensions or other in-scene control", "Exact coordinates, datum, applicable baselines, and boundary-data vintage", "Independent vessel, flag, registry, cargo, occupant, route, and casualty evidence", "Published residuals, sensitivity tests, uncertainty bounds, and adversarial peer review"], GREEN, "body_small") + [Spacer(1, 7), para("PUBLIC RELEASE", "kicker"), para("BLOCKED pending qualified legal, rights, privacy, forensic, security, and final editorial review.", "body_white")]
    story.append(card([provenance, upgrade], widths=[4.65 * inch, 4.65 * inch], padding=15))
    story += [Spacer(1, 8), rich('<font color="#D7B866"><b>FIRST-PASS RESULT</b></font>  The engine can expose incomplete accounting, changing casualty categories, disputed target identity, survivor/SAR uncertainty, and legal disagreement without replaying violence or pretending to solve absent geometry.', "callout"), Spacer(1, 6), para("Private working artifact. Not legal advice, a military assessment, a certified expert report, a finding about any person or vessel, or public-release approval.", "foot")]
    return story


def main():
    data, scene = load()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    BriefDoc(OUTPUT).build(build_story(data, scene))
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()

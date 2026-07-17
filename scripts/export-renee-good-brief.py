#!/usr/bin/env python3
"""Render the audited Renee Good working package as a private PDF brief."""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "fixtures/pilots/renee-good-killing/forensic-package.json"
SCENE = ROOT / "fixtures/pilots/renee-good-killing/local/reconstruction-scene.json"
OUTPUT = ROOT / "output/pdf/RENEE_GOOD_KILLING_FIRST_PASS.pdf"

PAGE_W, PAGE_H = landscape(letter)
MARGIN_X = 0.55 * inch
MARGIN_Y = 0.48 * inch
BG = colors.HexColor("#0B1217")
PANEL = colors.HexColor("#111B22")
PANEL_2 = colors.HexColor("#18242C")
LINE = colors.HexColor("#2B3942")
TEXT = colors.HexColor("#E7ECEE")
MUTED = colors.HexColor("#A2B0B8")
MUTED_2 = colors.HexColor("#667781")
GOLD = colors.HexColor("#D7B86E")
RED = colors.HexColor("#D66D79")
BLUE = colors.HexColor("#72AED8")
GREEN = colors.HexColor("#78B99B")


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
    revision_id = claim["currentRevisionId"]
    return next(item["text"] for item in data["claimRevisions"] if item["id"] == revision_id)


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle("kicker", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=GOLD, spaceAfter=5),
        "title": ParagraphStyle("title", parent=base["Title"], fontName="Helvetica-Bold", fontSize=26, leading=29, textColor=TEXT, alignment=TA_LEFT, spaceAfter=8),
        "h1": ParagraphStyle("h1", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=20, textColor=TEXT, spaceAfter=8),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=TEXT, spaceAfter=5),
        "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Helvetica", fontSize=8.2, leading=11.3, textColor=MUTED, spaceAfter=5),
        "body_small": ParagraphStyle("body_small", parent=base["BodyText"], fontName="Helvetica", fontSize=7, leading=9.2, textColor=MUTED, spaceAfter=3),
        "body_white": ParagraphStyle("body_white", parent=base["BodyText"], fontName="Helvetica", fontSize=9, leading=12.4, textColor=TEXT, spaceAfter=5),
        "callout": ParagraphStyle("callout", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=colors.HexColor("#E8D8B4")),
        "table_head": ParagraphStyle("table_head", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=6.3, leading=7.8, textColor=GOLD),
        "table": ParagraphStyle("table", parent=base["Normal"], fontName="Helvetica", fontSize=6.25, leading=8.05, textColor=MUTED),
        "table_white": ParagraphStyle("table_white", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=6.35, leading=8.1, textColor=TEXT),
        "tiny": ParagraphStyle("tiny", parent=base["Normal"], fontName="Helvetica", fontSize=5.35, leading=6.55, textColor=MUTED),
        "tiny_white": ParagraphStyle("tiny_white", parent=base["Normal"], fontName="Helvetica-Bold", fontSize=5.45, leading=6.65, textColor=TEXT),
        "mono": ParagraphStyle("mono", parent=base["Code"], fontName="Courier", fontSize=6.4, leading=8.5, textColor=MUTED),
        "foot": ParagraphStyle("foot", parent=base["Normal"], fontName="Courier", fontSize=5.7, leading=7, textColor=MUTED_2),
    }


ST = make_styles()


def para(text: object, style: str = "body") -> Paragraph:
    return Paragraph(safe(text), ST[style])


def rich(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, ST[style])


def bullets(items: list[str], color: colors.Color = GOLD, style: str = "body") -> list[Paragraph]:
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
        commands.append(("BACKGROUND", (0, row), (-1, row), PANEL if row % 2 else colors.HexColor("#0F171D")))
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
        super().__init__(str(filename), pagesize=landscape(letter), leftMargin=MARGIN_X, rightMargin=MARGIN_X, topMargin=MARGIN_Y, bottomMargin=0.42 * inch, title="Renee Good Killing - First-Pass Forensic Crawler Brief", author="Forensic Crawler")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id="brief", frames=frame, onPage=footer))


def build_story(data: dict, scene: dict):
    inv = data["investigations"][0]
    story = []

    # 1 - Cover
    story += [Spacer(1, 0.62 * inch), para("FORENSIC CRAWLER / SECOND CASE PILOT", "kicker"), para("Renee Good killing", "title"), para("Non-graphic public-record reconstruction of the January 7, 2026 fatal federal-agent shooting in Minneapolis", "body_white"), Spacer(1, 0.28 * inch)]
    story.append(card([
        [para("STATUS", "kicker"), para("WORKING - PRIVATE", "h2"), para("Not approved for public release", "body_small")],
        [para("PROCEDURE", "kicker"), para("OPEN STATE REVIEW", "h2"), para("No state charging decision identified", "body_small")],
        [para("RECONSTRUCTION", "kicker"), para("QUALITATIVE", "h2"), para("Not metric, photogrammetric, collision, or trajectory analysis", "body_small")],
    ], widths=[3.1 * inch] * 3, padding=13))
    story += [Spacer(1, 0.28 * inch), rich('<font color="#D7B86E"><b>BOUNDARY</b></font>  The death and shooting agent are established. Intent, contact, legal justification, criminal liability, trajectory, and counterfactual survivability remain unresolved.', "callout"), Spacer(1, 0.42 * inch), para(f"Package {data['packageId']} / Schema {data['schemaVersion']} / Audited local data / 24 source locators", "mono"), PageBreak()]

    # 2 - Current status
    story += page_header("01 / current state", "What is established - and what is still under review", inv["purpose"])
    left = [para("ESTABLISHED EVENT", "kicker"), para("Renee Good was fatally shot in her vehicle by ICE agent Jonathan Ross near East 34th Street and Portland Avenue on January 7, 2026.", "body_white"), Spacer(1, 7), para("CURRENT OFFICIAL POSTURE", "kicker"), para("HCAO and BCA are conducting a state investigation. On July 13 they announced receipt of previously withheld hard drives and Good's vehicle; analysis remained ongoing and HCAO said it had not prejudged whether a law was violated.", "body")]
    right = [para("NON-NEGOTIABLE LABELS", "kicker")] + bullets(["Ross is an identified, uncharged investigation subject - not a defendant or convicted person.", "DHS's initial account is an attributed party assertion, not an adjudicated finding.", "Medical manner of death 'homicide' is not a finding of murder or unlawful force.", "No state charge, declination, final independent use-of-force finding, or final public DHS report was identified by the cutoff."]) + [Spacer(1, 7), para("RESEARCH BOUNDARY", "kicker")] + bullets(["Lawful public sources only", "No outreach, private-person research, or paid docket access", "No graphic media or third-party source body retained"])
    story.append(card([left, right], widths=[4.65 * inch, 4.65 * inch], padding=15))
    story += [Spacer(1, 0.17 * inch), rich('<font color="#D66D79"><b>DO NOT INFER</b></font>  Intent from vehicle motion, contact from a compressed frame, lawfulness from agency rhetoric, or clinical causation from response timing.', "callout"), PageBreak()]

    # 3 - Timeline
    story += page_header("02 / temporal reconstruction", "Incident and response timeline", "CST expressions are preserved. Publisher synchronization is not an authenticated master evidence clock.")
    rows = [[para("SOURCE TIME", "table_head"), para("EVENT", "table_head"), para("EVIDENCE STATUS", "table_head")]]
    for event in data["events"][:9]:
        anchors = [next(item for item in data["temporalAnchors"] if item["id"] == anchor_id) for anchor_id in event["temporalAnchorIds"]]
        label = " / ".join(item["originalExpression"] for item in anchors)
        status = "Attributed federal account" if event["title"] == "Initial DHS account" else "Source-bounded event"
        rows.append([para(label, "table"), rich(f'<b><font color="#E6EBEE">{safe(event["title"])}</font></b><br/>{safe(event["description"])}', "table"), para(status, "table")])
    story.append(grid(rows, [2.15 * inch, 5.8 * inch, 1.35 * inch]))
    story += [Spacer(1, 7), para("Publisher timing places the first report at about 9:37:13 a.m., with three reports in about 0.7 seconds. Exact absolute time, inter-shot timing, and clinical-action labels require original files and records.", "body"), PageBreak()]

    # 4 - Scene
    story += page_header("03 / spatial reconstruction", "Qualitative topology, not photogrammetry", scene["status"])
    anchor_rows = [[para("ANCHOR", "table_head"), para("METHOD", "table_head"), para("DISPLAY UNCERTAINTY", "table_head")]]
    for anchor in data["spatialAnchors"]:
        anchor_rows.append([para(anchor["label"], "table_white"), para(anchor["method"], "table"), para(f"{anchor['uncertaintyMeters']} m", "table")])
    left_table = grid(anchor_rows, [2.0 * inch, 3.95 * inch, 0.65 * inch])
    method = [para("STREET_FRAME_V1", "kicker"), para("Intersection-level origin; display Y follows Portland Avenue", "body_white"), para("The scene separates publisher-verified observations, independent analysis, attributed federal claims, and unresolved questions into switchable layers.", "body"), Spacer(1, 6), para("NOT DRAWN", "kicker")] + bullets(["Bullet or wound trajectories", "Metric vehicle speed or collision dynamics", "A conclusive contact determination", "Exact witness positions or camera rays", "Faces, plates, addresses, children, or graphic detail"], RED, "body_small")
    story.append(Table([[left_table, card([method], widths=[2.45 * inch], padding=12)]], colWidths=[6.7 * inch, 2.6 * inch], style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)])))
    story += [Spacer(1, 7), para("Blocking evidence: lawful native independent files, hashes, authenticated clocks, camera calibration, surveyed as-built control, vehicle scan/telemetry, scene documentation, and physical/medical evidence.", "body"), PageBreak()]

    # 5-6 - Claim ledger
    for page, claim_slice in enumerate((data["claims"][:12], data["claims"][12:]), start=1):
        story += page_header(f"0{3 + page} / evidence ledger", f"Claim-state ledger - part {page}", "Confidence descriptors are editorial review aids, never legal findings or statistical probabilities.")
        claim_rows = [[para("ID", "table_head"), para("STATE", "table_head"), para("CURRENT CLAIM", "table_head"), para("BOUNDARY / STATUS", "table_head")]]
        offset = 0 if page == 1 else 12
        for idx, claim in enumerate(claim_slice, offset + 1):
            claim_rows.append([para(f"CLM-{idx:03d}", "tiny"), para(claim["evidenceState"].replace("_", " "), "tiny"), para(claim_text(data, claim), "tiny"), para(claim["proceduralStatus"], "tiny")])
        story.append(grid(claim_rows, [0.55 * inch, 1.35 * inch, 4.3 * inch, 3.1 * inch], padding=3))
        story += [Spacer(1, 6), para("Every claim links to exact source locators and retains unresolved questions. Repetition across publishers is not automatically independent when analyses share the same underlying recordings.", "foot"), PageBreak()]

    # 7 - Contradictions
    story += page_header("06 / red-team register", "Conflicts the engine refuses to flatten", "Alternate explanations remain hypotheses for testing, not adopted conclusions.")
    conflict_rows = [[para("CONFLICT", "table_head"), para("CURRENT READING", "table_head"), para("STATUS", "table_head")]]
    for conflict in data["contradictions"]:
        alternatives = "; ".join(conflict["alternateExplanations"])
        conflict_rows.append([para(conflict["title"], "table_white"), rich(f'{safe(conflict["description"])}<br/><font color="#667781">Retained alternatives: {safe(alternatives)}</font>', "table"), para(conflict["status"], "table")])
    story.append(grid(conflict_rows, [1.75 * inch, 6.55 * inch, 1.0 * inch]))
    story += [Spacer(1, 8), rich('<font color="#D66D79"><b>EDITORIAL RULE</b></font>  Do not silently convert an evolving access dispute into complete production, a medical classification into criminal culpability, or a visible path into proof of intent.', "callout"), PageBreak()]

    # 8 - Source registry
    story += page_header("07 / source registry", "Twenty-four locators; zero third-party bodies retained")
    source_rows = [[para("SOURCE / PUBLISHER", "table_head"), para("ROLE", "table_head"), para("SAFE RETENTION", "table_head")]]
    for source in data["sources"]:
        rights = next(item for item in data["rightsDecisions"] if item["id"] == source["rightsDecisionId"])
        source_rows.append([rich(f'<b><font color="#E6EBEE">{safe(source["title"])}</font></b><br/>{safe(source["publisher"])}', "tiny"), para(source["sourceType"].replace("_", " "), "tiny"), para(f"{rights['storagePermission']}; {rights['exportPermission']}", "tiny")])
    story.append(grid(source_rows, [5.0 * inch, 1.55 * inch, 2.75 * inch], padding=2))
    story += [Spacer(1, 5), para("Official pages establish what an institution recorded, asserted, requested, or decided. They are not presumed neutral proof of disputed conduct. Reporting is independently edited but may reuse the same underlying recordings.", "foot"), PageBreak()]

    # 9 - Provenance and rights
    story += page_header("08 / provenance and dignity", "A public record is not automatically reusable evidence")
    provenance = [para("INTEGRITY CHAIN", "kicker"), para(f"{len(data['auditEvents'])} linked audit events", "h2"), para(f"{len(data['assetCaptures'])} local JSON captures matched recorded SHA-256 and byte size. {len(data['claimSourceRelationships'])} claim-source relationships retain functions and locators.", "body"), Spacer(1, 7), para("SOURCE CUSTODY", "kicker")] + bullets(["URL, publisher, date, locator, retrieval time, and restrained paraphrase only", "No article body, social-post body, public-video bytes, still frames, or thumbnails", "The project scene is authored locally and contains no copied source pixels"])
    dignity = [para("INTENTIONALLY EXCLUDED", "kicker")] + bullets(["Graphic footage, wounds, autopsy imagery, or detailed medical findings", "Faces, children, family information, plates, witness identities/positions, or addresses", "Agent relatives, residence, private medical material, or unrelated people", "Exact tactical blind spots or operational optimization"], RED) + [Spacer(1, 7), para("PUBLIC RELEASE GATE", "kicker"), para("Blocked pending qualified legal, defamation, privacy, rights, forensic, and final editorial review.", "body_white")]
    story.append(card([provenance, dignity], widths=[4.65 * inch, 4.65 * inch], padding=15))
    story += [Spacer(1, 10), rich('<font color="#D7B86E"><b>NO GRAPHIC MEDIA WAS NEEDED</b></font>  The first pass tests provenance, contradiction handling, procedural labels, and defensible uncertainty without reproducing harm.', "callout"), PageBreak()]

    # 10 - Upgrade path
    story += page_header("09 / evidentiary threshold", "What would support a defensible metric reconstruction")
    gaps = ["Rights-cleared native independent video files with hashes and creator/device provenance", "Authenticated clock offsets, native frame cadence, codec history, and edit lineage", "Camera intrinsics, rolling-shutter characterization, lens distortion, and surveyed control", "January 2026 as-built street/curb geometry and scene documentation", "Vehicle scan, event data, inspection, damage map, and qualified collision analysis", "Complete physical, ballistic, medical, policy/training, and chain-of-custody records", "Independent withheld views for validation and uncertainty reporting"]
    pipeline = ["Register source and item-level rights decision", "Preserve native bytes and immutable capture record", "Synchronize clocks with explicit uncertainty", "Solve cameras only when independent static control is sufficient", "Estimate poses/speed with residuals and sensitivity analysis", "Keep observed, attributed, inferred, interpolated, and unknown layers separate", "Publish only after adversarial technical and qualified legal/editorial review"]
    rows = [[para("BLOCKING EVIDENCE GAP", "table_head"), para("VALIDATED UPGRADE PATH", "table_head")]]
    for index in range(max(len(gaps), len(pipeline))):
        rows.append([rich(f'<font color="#D66D79"><b>{index + 1:02d}</b></font> {safe(gaps[index])}', "body"), rich(f'<font color="#78B99B"><b>{index + 1:02d}</b></font> {safe(pipeline[index])}', "body")])
    story.append(grid(rows, [4.65 * inch, 4.65 * inch]))
    story += [Spacer(1, 10), card([[para("FIRST-PASS RESULT", "kicker"), para("The engine can present a coherent, source-linked incident sequence while making uncertainty and institutional disagreement visible. It cannot yet certify contact, intent, trajectory, justification, or causation.", "body_white")]], widths=[9.3 * inch], padding=13), Spacer(1, 8), para("Private working artifact. Not legal advice, a charging recommendation, a certified expert report, or public-release approval.", "foot")]
    return story


def main():
    data, scene = load()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    BriefDoc(OUTPUT).build(build_story(data, scene))
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()

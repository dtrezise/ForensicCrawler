#!/usr/bin/env python3
"""Generate the private first-pass case briefing from the audited local fixture."""

from __future__ import annotations

import json
import sys
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


ROOT = Path(__file__).resolve().parent.parent
INPUT = ROOT / "fixtures/pilots/charlie-kirk-assassination/forensic-package.json"
SCENE = ROOT / "fixtures/pilots/charlie-kirk-assassination/local/reconstruction-scene.json"
OUTPUT = ROOT / "output/pdf/CHARLIE_KIRK_ASSASSINATION_FIRST_PASS.pdf"

BG = colors.HexColor("#0B1116")
PANEL = colors.HexColor("#121B22")
PANEL_2 = colors.HexColor("#18232B")
LINE = colors.HexColor("#2A3841")
TEXT = colors.HexColor("#E6EBEE")
MUTED = colors.HexColor("#92A0A8")
MUTED_2 = colors.HexColor("#667781")
GOLD = colors.HexColor("#D7B86E")
GREEN = colors.HexColor("#78B99B")
RED = colors.HexColor("#D66D79")
BLUE = colors.HexColor("#70A4BD")

PAGE_W, PAGE_H = landscape(letter)
MARGIN_X = 0.55 * inch
MARGIN_Y = 0.45 * inch


def esc(value: object) -> str:
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def load() -> tuple[dict, dict]:
    return json.loads(INPUT.read_text()), json.loads(SCENE.read_text())


def claim_text(data: dict, claim: dict) -> str:
    revision_id = claim["currentRevisionId"]
    return next(item["text"] for item in data["claimRevisions"] if item["id"] == revision_id)


def make_styles():
    styles = getSampleStyleSheet()
    return {
        "kicker": ParagraphStyle("kicker", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=GOLD, spaceAfter=5, uppercase=True),
        "title": ParagraphStyle("title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=28, textColor=TEXT, alignment=TA_LEFT, spaceAfter=8),
        "h1": ParagraphStyle("h1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=20, textColor=TEXT, spaceAfter=8),
        "h2": ParagraphStyle("h2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=TEXT, spaceAfter=5),
        "body": ParagraphStyle("body", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.2, leading=11.4, textColor=MUTED, spaceAfter=5),
        "body_small": ParagraphStyle("body_small", parent=styles["BodyText"], fontName="Helvetica", fontSize=7, leading=9.3, textColor=MUTED, spaceAfter=3),
        "body_white": ParagraphStyle("body_white", parent=styles["BodyText"], fontName="Helvetica", fontSize=9, leading=12.5, textColor=TEXT, spaceAfter=5),
        "mono": ParagraphStyle("mono", parent=styles["Code"], fontName="Courier", fontSize=6.8, leading=9, textColor=MUTED),
        "callout": ParagraphStyle("callout", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=10, leading=14, textColor=colors.HexColor("#E8D8B4")),
        "table_head": ParagraphStyle("table_head", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=6.4, leading=8, textColor=GOLD),
        "table": ParagraphStyle("table", parent=styles["Normal"], fontName="Helvetica", fontSize=6.3, leading=8.2, textColor=MUTED),
        "table_white": ParagraphStyle("table_white", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=6.5, leading=8.2, textColor=TEXT),
        "foot": ParagraphStyle("foot", parent=styles["Normal"], fontName="Courier", fontSize=5.8, leading=7, textColor=MUTED_2),
    }


ST = make_styles()


def para(text: object, style: str = "body") -> Paragraph:
    return Paragraph(esc(text), ST[style])


def rich(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, ST[style])


def card(items, widths=None, padding=11, background=PANEL):
    table = Table([items], colWidths=widths, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
    ]))
    return table


def page_header(kicker: str, title: str, subtitle: str | None = None):
    parts = [para(kicker.upper(), "kicker"), para(title, "h1")]
    if subtitle:
        parts.append(para(subtitle, "body"))
    parts.append(Spacer(1, 0.05 * inch))
    return parts


def bullet_lines(items, color=GOLD, style="body"):
    return [rich(f'<font color="{color.hexval()}">•</font> {esc(item)}', style) for item in items]


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN_X, 0.31 * inch, PAGE_W - MARGIN_X, 0.31 * inch)
    canvas.setFont("Courier", 5.8)
    canvas.setFillColor(MUTED_2)
    canvas.drawString(MARGIN_X, 0.17 * inch, "FORENSIC CRAWLER  /  PRIVATE WORKING BRIEF  /  EVIDENCE CUTOFF 17 JUL 2026")
    canvas.drawRightString(PAGE_W - MARGIN_X, 0.17 * inch, f"{doc.page:02d}")
    canvas.restoreState()


class BriefDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=landscape(letter), leftMargin=MARGIN_X, rightMargin=MARGIN_X, topMargin=MARGIN_Y, bottomMargin=0.42 * inch, title="Charlie Kirk Assassination — First-Pass Forensic Crawler Brief", author="Forensic Crawler")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id="brief", frames=frame, onPage=footer))


def table(data, col_widths, header=True, row_bgs=True):
    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        commands += [("BACKGROUND", (0, 0), (-1, 0), PANEL_2), ("TEXTCOLOR", (0, 0), (-1, 0), GOLD)]
    if row_bgs:
        for row in range(1 if header else 0, len(data)):
            commands.append(("BACKGROUND", (0, row), (-1, row), PANEL if row % 2 else colors.HexColor("#0F171D")))
    t.setStyle(TableStyle(commands))
    return t


def build_story(data: dict, scene: dict):
    inv = data["investigations"][0]
    story = []

    # 1 Cover
    story += [Spacer(1, 0.62 * inch), para("FORENSIC CRAWLER / FIRST-PASS CASE BRIEF", "kicker"), para("Charlie Kirk assassination", "title"), rich("Public-record reconstruction of the September 10, 2025 fatal shooting at Utah Valley University", "body_white"), Spacer(1, 0.28 * inch)]
    story.append(card([
        [para("STATUS", "kicker"), para("WORKING — PRIVATE", "h2"), para("Not approved for public release", "body_small")],
        [para("PROCEDURE", "kicker"), para("ACTIVE CRIMINAL CASE", "h2"), para("No guilt finding; charges remain allegations", "body_small")],
        [para("RECONSTRUCTION", "kicker"), para("SCHEMATIC", "h2"), para("Not photogrammetric, georeferenced, or trajectory-validated", "body_small")],
    ], widths=[3.1 * inch, 3.1 * inch, 3.1 * inch], padding=13))
    story += [Spacer(1, 0.27 * inch), rich('<font color="#D7B86E"><b>BOUNDARY</b></font>  The fatal incident is established. Actor identity, motive, forensic associations, and the State\'s narrative remain attributed and unadjudicated.', "callout"), Spacer(1, 0.48 * inch), para(f"Package {data['packageId']}  /  Schema {data['schemaVersion']}  /  Generated from audited local data", "mono"), PageBreak()]

    # 2 Scope / procedure
    story += page_header("01 / analytical boundary", "What this pass establishes — and what it does not", inv["purpose"])
    left = [para("ESTABLISHED EVENT", "kicker"), rich("Charlie Kirk was fatally shot during an outdoor public event at Utah Valley University on September 10, 2025.", "body_white"), Spacer(1, 7), para("CURRENT PROCEDURAL POSTURE", "kicker"), para("The State filed seven charges. Reviewed official public pages do not yet show a probable-cause disposition. Open-court reporting says final preliminary-hearing arguments are scheduled for September 1, 2026.", "body")]
    right = [para("NON-NEGOTIABLE LABELS", "kicker")] + bullet_lines(["Every charge is an allegation.", "The defendant is presumed innocent.", "No plea, verdict, bind-over, or dismissal is represented as officially verified in this pass.", "State assertions, witness statements, analyst results, reporting, and Forensic Crawler analysis remain distinct."]) + [Spacer(1, 7), para("RESEARCH BOUNDARY", "kicker")] + bullet_lines(["Lawful public sources only", "No paid or authenticated docket access", "No outreach or private-person research", "No third-party source body retained"])
    story.append(card([left, right], widths=[4.65 * inch, 4.65 * inch], padding=15))
    story += [Spacer(1, 0.18 * inch), rich('<font color="#D66D79"><b>DO NOT INFER</b></font>  Motive from political association, identity from pixels or gait, guilt from repetition, or a trajectory from compressed public video.', "callout"), PageBreak()]

    # 3 Timeline
    story += page_header("02 / temporal reconstruction", "Incident and response timeline", "Source expressions are preserved. MDT normalization does not validate the underlying clock.")
    timeline_rows = [[para("SOURCE TIME", "table_head"), para("EVENT", "table_head"), para("STATUS", "table_head")]]
    for event in data["events"]:
        anchors = [next(a for a in data["temporalAnchors"] if a["id"] == anchor_id) for anchor_id in event["temporalAnchorIds"]]
        time_label = " / ".join(anchor["originalExpression"] for anchor in anchors)
        status = "State allegation" if "Alleged" in event["title"] else "Source-bounded event"
        if "Superseded" in event["title"]:
            status = "Superseded contemporaneous record"
        timeline_rows.append([para(time_label, "table"), rich(f'<b><font color="#E6EBEE">{esc(event["title"])}</font></b><br/>{esc(event["description"])}', "table"), para(status, "table")])
    story.append(table(timeline_rows, [2.05 * inch, 5.75 * inch, 1.5 * inch]))
    story += [Spacer(1, 8), rich('<font color="#D7B86E"><b>TIME CONFLICT</b></font>  DPS: approximately 12:20 (initially mislabeled MST). FBI / charging filing: 12:23. The engine retains both; it does not invent a preferred second.', "body"), PageBreak()]

    # 4 Spatial
    story += page_header("03 / spatial reconstruction", "Relational scene, not photogrammetry", scene["status"])
    spatial_rows = [[para("ANCHOR", "table_head"), para("DISPLAY CONSTRAINT", "table_head"), para("UNCERTAINTY", "table_head")]]
    for anchor in data["spatialAnchors"]:
        spatial_rows.append([para(anchor["label"], "table_white"), para(anchor["method"], "table"), para(f"± {anchor['uncertaintyMeters']} m", "table")])
    left_table = table(spatial_rows, [1.9 * inch, 3.9 * inch, 0.65 * inch])
    method = [para("SCENE_FRAME_V1", "kicker"), para("Origin: unresolved seat/canopy event region", "body_white"), para("The display axis toward the alleged rooftop is not north-aligned. Massing, heights, display bearing, and route curvature are placeholders.", "body"), Spacer(1, 6), para("CONTRADICTION RINGS", "kicker"), para("146.3 m — State filing, approximately 160 yd", "body_white"), para("182.9 m — early briefing, roughly 200 yd", "body_white"), Spacer(1, 6), para("SIGHTLINE", "kicker"), para("A source-stated visibility corridor only. It is not a bullet path, firing solution, or wound trajectory.", "body")]
    story.append(Table([[left_table, card([method], widths=[2.55 * inch], padding=12)]], colWidths=[6.55 * inch, 2.75 * inch], style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)])))
    story += [Spacer(1, 7), para("Blocking evidence: no rights-cleared original multi-view set, camera intrinsics, native surveillance timebase, verified scale controls, survey, final trajectory analysis, complete ballistics, or autopsy findings.", "body"), PageBreak()]

    # 5 Claims
    story += page_header("04 / evidence ledger", "Claim-state overview", "Confidence is an editorial review aid, never a probability of guilt.")
    state_counts = {}
    for claim in data["claims"]:
        state_counts[claim["evidenceState"]] = state_counts.get(claim["evidenceState"], 0) + 1
    state_cards = []
    for state, count in state_counts.items():
        state_cards.append(rich(f'<font color="#E6EBEE" size="14"><b>{count}</b></font><br/><font color="#D7B86E" size="6">{esc(state.replace("_", " ").upper())}</font>', "body"))
    story.append(Table([state_cards], colWidths=[9.3 * inch / len(state_cards)] * len(state_cards), style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), PANEL), ("BOX", (0, 0), (-1, -1), 0.5, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)])))
    story += [Spacer(1, 8)]
    claim_rows = [[para("ID", "table_head"), para("STATE", "table_head"), para("CURRENT CLAIM", "table_head")]]
    for idx, claim in enumerate(data["claims"][:8], 1):
        claim_rows.append([para(f"CLM-{idx:03d}", "table"), para(claim["evidenceState"].replace("_", " "), "table"), para(claim_text(data, claim), "table")])
    story.append(table(claim_rows, [0.55 * inch, 1.5 * inch, 7.25 * inch]))
    story += [Spacer(1, 5), para("Ten additional claim records cover derivative video lineage, reconstruction limits, open-court procedural reporting, the missing external-review report, and qualified DNA testimony.", "foot"), PageBreak()]

    # 6 Contradictions
    story += page_header("05 / red-team register", "Material conflicts the engine refuses to flatten", "Every conflict retains its source values, status, and unverified alternate explanations.")
    conflict_rows = [[para("CONFLICT", "table_head"), para("CURRENT READING", "table_head"), para("STATUS", "table_head")]]
    for conflict in data["contradictions"]:
        alternatives = "; ".join(conflict["alternateExplanations"])
        conflict_rows.append([para(conflict["title"], "table_white"), rich(f'{esc(conflict["description"])}<br/><font color="#667781">Possible explanations: {esc(alternatives)}</font>', "table"), para(conflict["status"], "table")])
    story.append(table(conflict_rows, [1.75 * inch, 6.55 * inch, 1 * inch]))
    story += [Spacer(1, 9), rich('<font color="#D66D79"><b>EDITORIAL RULE</b></font>  Do not average incompatible values, silently repair source history, or convert qualified laboratory language into an absolute identification.', "callout"), PageBreak()]

    # 7 Evidence integrity
    story += page_header("06 / forensic evidence integrity", "DNA, ballistics, and video require qualified language")
    columns = []
    columns.append([para("DNA", "kicker"), para("Charging summary", "h2"), para("The filing says DNA was 'consistent with' the defendant on multiple items.", "body"), para("Hearing terminology", "h2"), para("Open-court reporting describes mixtures, possible-contributor language, likelihood ratios, and a two-person towel profile.", "body"), rich('<font color="#D66D79"><b>Never render:</b></font> unqualified “DNA match.”', "body")])
    columns.append([para("BALLISTICS", "kicker"), para("Bullet fragment", "h2"), para("Public hearing coverage describes comparison with the recovered rifle as inconclusive.", "body"), para("Canonical label", "h2"), para("INCONCLUSIVE — neither a match nor an exclusion.", "body_white"), rich('<font color="#D66D79"><b>Never infer:</b></font> trajectory, wound mechanics, or weapon performance from compressed impact video.', "body")])
    columns.append([para("VIDEO", "kicker"), para("Source family", "h2"), para("FBI releases and courtroom compilations derive from UVU surveillance. Reposts are not independent cameras.", "body"), para("Transforms", "h2"), para("Zooms, circles, red marks, edits, stabilization, and release timestamps must remain separate from native frames and capture times.", "body"), rich('<font color="#D66D79"><b>Never measure:</b></font> an enhanced copy as original evidence.', "body")])
    story.append(card(columns, widths=[3.08 * inch] * 3, padding=14))
    story += [Spacer(1, 10), para("Underlying laboratory reports, certified transcripts, native clips, edit decision lists, calibration metadata, and complete chain-of-custody records were not retained in this fixture.", "body"), PageBreak()]

    # 8 Sources
    story += page_header("07 / source registry", "Thirteen reviewed locators; zero third-party bodies retained")
    source_rows = [[para("SOURCE", "table_head"), para("ROLE", "table_head"), para("SAFE USE", "table_head")]]
    for source in data["sources"]:
        rights = next(item for item in data["rightsDecisions"] if item["id"] == source["rightsDecisionId"])
        source_rows.append([rich(f'<b><font color="#E6EBEE">{esc(source["title"])}</font></b><br/>{esc(source["publisher"])}', "table"), para(source["sourceType"].replace("_", " "), "table"), para(f"{rights['storagePermission']}; {rights['exportPermission']}", "table")])
    story.append(table(source_rows, [4.55 * inch, 1.55 * inch, 3.2 * inch]))
    story += [Spacer(1, 6), para("Official pages establish what agencies published. Separate pages in the same joint investigation are not automatically independent. AP and KSL add editorially independent open-court or briefing reports but may describe the same underlying evidence.", "body"), PageBreak()]

    # 9 Rights privacy
    story += page_header("08 / rights, dignity, and trial integrity", "What the first pass intentionally excludes")
    excludes = ["Graphic impact video, thumbnails, and frame extractions", "Faces, minors, gait/face/voice identification, lip reading", "Defendant home address and date of birth exposed by the filing", "Private relationship details and unrelated people", "Court-restricted or accidentally exposed exhibits", "UVU map pixels, press photographs, surveillance textures, FBI seals", "Exact tactical blind spots, security weaknesses, or optimized escape routes", "Raw article bodies, social posts, private messages, or scraped datasets"]
    controls = ["Metadata, timestamps, exact locators, and restrained paraphrases only", "Project-authored neutral geometry with no copied pixels", "Every allegation carries procedural status", "Superseded custody statements remain visible with correction", "Public release blocked pending qualified legal, rights, privacy, and editorial review", "No outreach, paid access, authentication bypass, deployment, or publication"]
    story.append(card([
        [para("EXCLUDED", "kicker")] + bullet_lines(excludes, RED, "body"),
        [para("CONTROLS IN PLACE", "kicker")] + bullet_lines(controls, GREEN, "body"),
    ], widths=[4.65 * inch, 4.65 * inch], padding=14))
    story += [Spacer(1, 8), rich('<font color="#D7B86E"><b>PUBLIC AVAILABILITY IS NOT REUSE PERMISSION.</b></font>  State and institutional publications are not automatically federal public domain; underlying UVU surveillance authorship remains unresolved.', "body"), PageBreak()]

    # 10 Gaps and upgrade path
    story += page_header("09 / next evidentiary threshold", "What would convert the schematic into defensible photogrammetry")
    gaps = ["Original-resolution, lawfully licensed overlapping images", "Native surveillance streams with hashes, frame cadence, clock offsets, and edit history", "Camera intrinsics, distortion, orientation, and independent calibration", "Surveyed scale controls, facade/roof elevations, and a verified local CRS", "Complete ballistics, medical-examiner, chain-of-custody, and laboratory records", "An independent withheld control set for reprojection and geometric validation"]
    pipeline = ["Register source and rights decision", "Hash native bytes and preserve acquisition record", "Annotate static control points", "Estimate cameras with OpenCV / COLMAP only when inputs qualify", "Validate residuals and withheld controls in CloudCompare", "Separate observed mesh, inference, interpolation, and uncertainty in Blender", "Publish only after legal, forensic, privacy, and editorial sign-off"]
    rows = []
    for index in range(max(len(gaps), len(pipeline))):
        rows.append([rich(f'<font color="#D66D79"><b>{index + 1:02d}</b></font> {esc(gaps[index])}' if index < len(gaps) else "", "body"), rich(f'<font color="#78B99B"><b>{index + 1:02d}</b></font> {esc(pipeline[index])}' if index < len(pipeline) else "", "body")])
    story.append(table([[para("BLOCKING EVIDENCE GAP", "table_head"), para("VALIDATED UPGRADE PATH", "table_head")]] + rows, [4.65 * inch, 4.65 * inch]))
    story += [Spacer(1, 8), para("Running a photogrammetry tool on inadequate or unlicensed inputs does not create valid measurement. It creates a derivative whose precision can be visually persuasive and scientifically unsupported.", "callout"), PageBreak()]

    # 11 Handoff
    story += page_header("10 / first-pass handoff", "Completed local presentation and remaining release blockers")
    completed = [f"{len(data['claims'])} source-linked claims", f"{len(data['events'])} timeline events and {len(data['temporalAnchors'])} temporal anchors", f"{len(data['contradictions'])} contradiction ledgers", f"{len(data['spatialAnchors'])} spatial anchors and selectable Three.js scene", f"{len(data['auditEvents'])}-event linked audit chain", "Deterministic JSON package, Markdown report, and this PDF brief", "Responsive case UI with Apollo 11 fixture preserved"]
    blockers = ["Qualified legal, defamation, privacy, and rights review", "Official probable-cause disposition when published", "Defense/prosecution parity and final editorial review", "Corrections owner and private contact route", "Item-specific permission for any future source pixel", "Independent forensic-method review before metric claims", "Separate authorization for deployment, publication, outreach, or push"]
    story.append(card([
        [para("COMPLETE IN THIS PASS", "kicker")] + bullet_lines(completed, GREEN, "body"),
        [para("BLOCKED BEFORE EXTERNAL USE", "kicker")] + bullet_lines(blockers, RED, "body"),
    ], widths=[4.65 * inch, 4.65 * inch], padding=14))
    story += [Spacer(1, 0.15 * inch), para("Verification", "kicker"), para("Schema, reference graph, rights-subject mapping, local capture hashes, reconstruction outputs, offline source policy, audit chain, TypeScript, automated tests, and production build pass locally.", "body_white"), Spacer(1, 0.1 * inch), rich('<font color="#D7B86E"><b>FINAL STATUS:</b></font>  Completed first pass for private review. Evidence collection, metric reconstruction, legal review, and public release remain future gated work.', "callout")]

    return story


def main() -> int:
    data, scene = load()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BriefDoc(str(OUTPUT))
    doc.build(build_story(data, scene))
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

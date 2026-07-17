#!/usr/bin/env python3
"""Render a consistent, accessible forensic briefing PDF from a v2 package."""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Circle, Drawing, Line, Rect, String
from reportlab.platypus import BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[2]
if len(sys.argv) != 3:
    raise SystemExit("Usage: python export-brief-v2.py <package.json> <output.pdf>")

package_path = ROOT / sys.argv[1]
output_path = ROOT / sys.argv[2]
data = json.loads(package_path.read_text(encoding="utf-8"))
investigation = data["investigations"][0]
revision_by_id = {item["id"]: item for item in data["claimRevisions"]}
source_codes = {source["id"]: f"S{index + 1:03d}" for index, source in enumerate(data["sources"])}

PAGE = landscape(letter)
NAVY = colors.HexColor("#0B1116")
SURFACE = colors.HexColor("#121C23")
SURFACE_2 = colors.HexColor("#18252E")
GOLD = colors.HexColor("#D7B86E")
TEXT = colors.HexColor("#E6ECEF")
MUTED = colors.HexColor("#92A0A9")
GREEN = colors.HexColor("#78B99B")
RED = colors.HexColor("#D66D79")
BLUE = colors.HexColor("#70A4BD")
LINE = colors.HexColor("#2B3941")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", fontName="Helvetica-Bold", fontSize=9, leading=11, textColor=GOLD, spaceAfter=12, tracking=1.3))
styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=28, leading=32, textColor=TEXT, spaceAfter=16))
styles.add(ParagraphStyle(name="CoverDeck", fontName="Helvetica", fontSize=11, leading=17, textColor=MUTED, spaceAfter=18))
styles.add(ParagraphStyle(name="Section", fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=TEXT, spaceAfter=7))
styles.add(ParagraphStyle(name="Eyebrow", fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=GOLD, spaceAfter=5, tracking=1.1))
styles.add(ParagraphStyle(name="BodyDark", fontName="Helvetica", fontSize=8.5, leading=12.5, textColor=MUTED, spaceAfter=6))
styles.add(ParagraphStyle(name="BodyStrong", fontName="Helvetica-Bold", fontSize=9, leading=13, textColor=TEXT, spaceAfter=4))
styles.add(ParagraphStyle(name="Small", fontName="Helvetica", fontSize=6.8, leading=9.2, textColor=MUTED))
styles.add(ParagraphStyle(name="Tiny", fontName="Helvetica", fontSize=5.8, leading=7.2, textColor=MUTED))
styles.add(ParagraphStyle(name="Right", parent=styles["Small"], alignment=TA_RIGHT))


def safe(value: object) -> str:
    return str(value or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def claim_text(claim: dict) -> str:
    return revision_by_id.get(claim["currentRevisionId"], {}).get("text", "Current revision unavailable")


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE[0], PAGE[1], fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(0.55 * inch, 0.42 * inch, PAGE[0] - 0.55 * inch, 0.42 * inch)
    canvas.setFont("Helvetica-Bold", 6.5)
    canvas.setFillColor(GOLD)
    canvas.drawString(0.55 * inch, 0.23 * inch, "FORENSIC CRAWLER / PRIVATE WORKING ANALYSIS")
    canvas.setFont("Helvetica", 6.5)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(PAGE[0] - 0.55 * inch, 0.23 * inch, f"{data['packageId']}  /  {doc.page}")
    canvas.restoreState()


class BriefDoc(BaseDocTemplate):
    pass


output_path.parent.mkdir(parents=True, exist_ok=True)
doc = BriefDoc(str(output_path), pagesize=PAGE, leftMargin=0.55 * inch, rightMargin=0.55 * inch, topMargin=0.5 * inch, bottomMargin=0.55 * inch, title=investigation["title"], author="Forensic Crawler")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
doc.addPageTemplates(PageTemplate(id="brief", frames=[frame], onPage=header_footer))
story = []


def section(title: str, eyebrow: str) -> None:
    story.extend([Paragraph(safe(eyebrow.upper()), styles["Eyebrow"]), Paragraph(safe(title), styles["Section"]), Spacer(1, 7)])


def card(text: str, label: str, tone=GOLD):
    content = [[Paragraph(safe(label.upper()), styles["Eyebrow"])], [Paragraph(safe(text), styles["BodyDark"])]]
    return Table(content, colWidths=[3.35 * inch], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LINEBEFORE", (0, 0), (0, -1), 3, tone), ("LEFTPADDING", (0, 0), (-1, -1), 11),
        ("RIGHTPADDING", (0, 0), (-1, -1), 11), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))


def reconstruction_diagram():
    capture = next((item for item in data.get("assetCaptures", []) if item.get("localPath", "").endswith("reconstruction-scene.json")), None)
    if not capture:
        return None
    scene_path = ROOT / capture["localPath"]
    if not scene_path.exists():
        return None
    scene = json.loads(scene_path.read_text(encoding="utf-8"))
    objects = [item for item in scene.get("objects", []) if item.get("center") or item.get("points")]
    coordinates = []
    for item in objects:
        if item.get("center"):
            coordinates.append((item["center"][0], item["center"][1]))
        coordinates.extend((point[0], point[1]) for point in item.get("points", []))
    if not coordinates:
        return None
    xs, ys = zip(*coordinates)
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    span_x, span_y = max(max_x - min_x, 1), max(max_y - min_y, 1)
    drawing = Drawing(710, 335)
    drawing.add(Rect(0, 0, 710, 335, fillColor=SURFACE, strokeColor=LINE, strokeWidth=.7))
    plot_x, plot_y, plot_w, plot_h = 16, 22, 470, 292
    drawing.add(Rect(plot_x, plot_y, plot_w, plot_h, fillColor=colors.HexColor("#0D151B"), strokeColor=LINE))
    for grid_index in range(1, 6):
        gx = plot_x + plot_w * grid_index / 6
        gy = plot_y + plot_h * grid_index / 6
        drawing.add(Line(gx, plot_y, gx, plot_y + plot_h, strokeColor=colors.HexColor("#1D2A32"), strokeWidth=.4))
        drawing.add(Line(plot_x, gy, plot_x + plot_w, gy, strokeColor=colors.HexColor("#1D2A32"), strokeWidth=.4))
    layer_colors = {item["id"]: colors.HexColor(item["color"]) for item in scene.get("layers", [])}
    selected = sorted(objects, key=lambda item: item.get("labelPriority", 0), reverse=True)[:14]
    for index, item in enumerate(selected, 1):
        center = item.get("center") or item.get("points", [[0, 0, 0]])[0]
        px = plot_x + 22 + (center[0] - min_x) / span_x * (plot_w - 44)
        py = plot_y + 22 + (center[1] - min_y) / span_y * (plot_h - 44)
        color = layer_colors.get(item.get("layer"), GOLD)
        drawing.add(Circle(px, py, 7 if item.get("semantic") in {"vehicle", "vessel", "structure"} else 5, fillColor=color, strokeColor=colors.white, strokeWidth=.5))
        drawing.add(String(px, py - 2.4, str(index), fontName="Helvetica-Bold", fontSize=5.5, fillColor=NAVY, textAnchor="middle"))
        label_y = 302 - (index - 1) * 20
        drawing.add(Circle(507, label_y + 2, 4, fillColor=color, strokeColor=None))
        label = item.get("label", item.get("id", "scene object"))
        if len(label) > 34:
            label = label[:32] + "..."
        drawing.add(String(516, label_y, f"{index:02d}  {label}", fontName="Helvetica", fontSize=6.7, fillColor=TEXT))
        drawing.add(String(516, label_y - 8, f"{item.get('semantic', item.get('type', 'object'))} / {item.get('layer', 'layer')}", fontName="Helvetica", fontSize=5.3, fillColor=MUTED))
    drawing.add(String(17, 322, f"{scene.get('coordinateSystem', {}).get('id', 'LOCAL FRAME')} / TOP-DOWN PRESENTATION INDEX", fontName="Helvetica-Bold", fontSize=6.5, fillColor=GOLD))
    drawing.add(String(500, 322, "LABELED SCENE OBJECTS", fontName="Helvetica-Bold", fontSize=6.5, fillColor=GOLD))
    return drawing


def timing_diagram():
    anchors = [item for item in data.get("temporalAnchors", []) if item.get("missionElapsedSeconds") is not None]
    if not anchors:
        return None
    drawing = Drawing(710, 250)
    drawing.add(Rect(0, 0, 710, 250, fillColor=SURFACE, strokeColor=LINE))
    values = [item["missionElapsedSeconds"] for item in anchors]
    lower, upper = min(values), max(values)
    span = max(upper - lower, 1)
    y = 122
    drawing.add(Line(50, y, 660, y, strokeColor=LINE, strokeWidth=2))
    for index, item in enumerate(sorted(anchors, key=lambda value: value["missionElapsedSeconds"])):
        x = 50 + (item["missionElapsedSeconds"] - lower) / span * 610
        tone = RED if index in {0, len(anchors) - 1} else GOLD
        drawing.add(Line(x, y - 22, x, y + 28, strokeColor=tone, strokeWidth=2))
        drawing.add(Circle(x, y, 6, fillColor=tone, strokeColor=colors.white, strokeWidth=.5))
        drawing.add(String(x, y + 39 + (index % 2) * 28, item["label"][:28], fontName="Helvetica-Bold", fontSize=6.5, fillColor=TEXT, textAnchor="middle"))
        drawing.add(String(x, y + 29 + (index % 2) * 28, item["originalExpression"][:34], fontName="Helvetica", fontSize=5.5, fillColor=MUTED, textAnchor="middle"))
        drawing.add(String(x, y - 38, f"T+{item['missionElapsedSeconds']:.1f}s", fontName="Helvetica", fontSize=6, fillColor=GOLD, textAnchor="middle"))
    drawing.add(String(22, 226, "SOURCE CLOCK COMPARISON / NORMALIZATION DOES NOT ESTABLISH CLOCK ACCURACY", fontName="Helvetica-Bold", fontSize=7, fillColor=GOLD))
    return drawing


# Cover
story.extend([
    Spacer(1, 0.6 * inch),
    Paragraph("FORENSIC CRAWLER / FIRST-PASS BRIEFING", styles["CoverKicker"]),
    Paragraph(safe(investigation["title"]), styles["CoverTitle"]),
    Paragraph(safe(investigation["purpose"]), styles["CoverDeck"]),
])
metrics = [
    ("SOURCES", len(data["sources"]), "reviewed public locators"),
    ("CLAIMS", len(data["claims"]), "source-linked propositions"),
    ("CONFLICTS", len(data["contradictions"]), "preserved contradiction ledgers"),
    ("PRESERVED BODIES", data.get("integritySummary", {}).get("sourceBodiesPreserved", 0), "rights-permitted remote bodies"),
]
metric_cells = []
for label, value, note in metrics:
    metric_cells.append([Paragraph(label, styles["Eyebrow"]), Paragraph(str(value), ParagraphStyle(name=f"Metric{label}", fontName="Helvetica-Bold", fontSize=22, leading=24, textColor=TEXT)), Paragraph(note, styles["Small"])])
story.append(Table([metric_cells], colWidths=[2.45 * inch] * 4, style=TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), 0.6, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
])))
story.extend([Spacer(1, 16), Paragraph(f"STATUS: {investigation['status'].upper()} / RESEARCH CUTOFF: {data['exportedAt']} / SCHEMA: {data['schemaVersion']}", styles["Eyebrow"]), Paragraph("This analysis is not a finding of guilt, certification, metric-validation statement, court-admissibility opinion, or public-release approval.", styles["BodyDark"]), PageBreak()])

# Executive summary
section("Executive summary", "Established, attributed, disputed, and unknown")
established = [c for c in data["claims"] if c["evidenceState"] in {"directly_observed_primary_evidence", "authenticated_official_record", "independently_corroborated"}][:5]
attributed = [c for c in data["claims"] if c["evidenceState"] == "attributed_unverified"][:5]
unknowns = list(dict.fromkeys(q for c in data["claims"] for q in c.get("unresolvedQuestions", [])))[:6]
left = [card(claim_text(c), "Established in package", GREEN) for c in established[:3]] or [card("No proposition is designated established.", "Established", MUTED)]
right = [card(claim_text(c), "Attributed claim", GOLD) for c in attributed[:2]] + [card(item, "Open evidence need", RED) for item in unknowns[:2]]
rows = []
for index in range(max(len(left), len(right))):
    rows.append([left[index] if index < len(left) else "", right[index] if index < len(right) else ""])
story.append(Table(rows, colWidths=[5.05 * inch, 5.05 * inch], hAlign="LEFT", style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)])))
story.append(PageBreak())

# Method and visual evidence profile
section("Method and evidence profile", "How to read this package")
method = data.get("methodology", {})
story.append(Table([
    [card(method.get("inclusionRule", "Defined public-record scope."), "Inclusion rule", GREEN), card(method.get("exclusionRule", "Unsupported inference excluded."), "Exclusion rule", RED), card(" > ".join(method.get("sourceHierarchy", [])), "Source hierarchy", BLUE)]
], colWidths=[3.35 * inch] * 3, style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 8)])))
story.append(Spacer(1, 15))
state_counts = Counter(claim["evidenceState"].replace("_", " ") for claim in data["claims"])
source_counts = Counter(source.get("authorityClass", source["sourceType"]).replace("_", " ") for source in data["sources"])

def bar_table(counts: Counter, title: str):
    maximum = max(counts.values(), default=1)
    rows = [[Paragraph(title.upper(), styles["Eyebrow"]), "", ""]]
    for label, value in counts.most_common():
        width = max(1, int(20 * value / maximum))
        rows.append([Paragraph(safe(label), styles["Small"]), Paragraph("■" * width, ParagraphStyle(name=f"Bar{title}{label}", fontName="Helvetica", fontSize=7, textColor=GOLD)), Paragraph(str(value), styles["Right"])])
    return Table(rows, colWidths=[2.0 * inch, 2.35 * inch, .35 * inch], style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), .5, LINE), ("SPAN", (0, 0), (2, 0)), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))

story.append(Table([[bar_table(state_counts, "Claim evidence states"), bar_table(source_counts, "Source authority classes")]], colWidths=[5.05 * inch, 5.05 * inch], style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 8)])))
story.append(PageBreak())

# Chronology pages
events = data["events"]
for offset in range(0, len(events), 7):
    section("Chronology", f"Events {offset + 1}-{min(offset + 7, len(events))} of {len(events)}")
    rows = [[Paragraph("NO.", styles["Eyebrow"]), Paragraph("SOURCE TIME", styles["Eyebrow"]), Paragraph("EVENT", styles["Eyebrow"]), Paragraph("SOURCE-BOUNDED DESCRIPTION", styles["Eyebrow"])]]
    for index, event in enumerate(events[offset:offset + 7], offset + 1):
        anchors = [next((item for item in data["temporalAnchors"] if item["id"] == anchor_id), None) for anchor_id in event["temporalAnchorIds"]]
        anchor_text = " / ".join(item["originalExpression"] for item in anchors if item) or "Unresolved"
        rows.append([Paragraph(f"{index:02d}", styles["BodyStrong"]), Paragraph(safe(anchor_text), styles["Small"]), Paragraph(safe(event["title"]), styles["BodyStrong"]), Paragraph(safe(event["description"]), styles["Small"])])
    story.append(Table(rows, colWidths=[.48 * inch, 1.75 * inch, 2.25 * inch, 5.65 * inch], repeatRows=1, style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), SURFACE_2), ("BACKGROUND", (0, 1), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), .5, LINE), ("INNERGRID", (0, 0), (-1, -1), .35, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)])))
    story.append(PageBreak())

# Contradictions
section("Contradiction register", "Conflicts remain visible")
for item in data["contradictions"]:
    story.append(Table([[Paragraph(safe(item["title"]), styles["BodyStrong"]), Paragraph(safe(item["status"].upper()), styles["Eyebrow"])], [Paragraph(safe(item["description"]), styles["BodyDark"]), Paragraph("<br/>".join(safe(value) for value in item.get("alternateExplanations", [])[:3]), styles["Small"])]], colWidths=[6.7 * inch, 3.4 * inch], style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), .5, LINE), ("LINEBEFORE", (0, 0), (0, -1), 3, RED if item["status"] == "open" else GREEN), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)])))
    story.append(Spacer(1, 6))
story.append(PageBreak())

# Spatial and integrity
section("Spatial and integrity gates", "What the reconstruction can and cannot support")
artifacts = data.get("spatialArtifacts", [])
artifact_rows = [[Paragraph("ARTIFACT", styles["Eyebrow"]), Paragraph("FRAME", styles["Eyebrow"]), Paragraph("METRIC", styles["Eyebrow"]), Paragraph("MEASUREMENT", styles["Eyebrow"]), Paragraph("VALIDATION", styles["Eyebrow"])]]
for artifact in artifacts:
    artifact_rows.append([Paragraph(safe(artifact["title"]), styles["BodyStrong"]), Paragraph(safe(artifact["coordinateSystem"]), styles["Small"]), Paragraph("YES" if artifact["metricValidated"] else "NO", styles["Small"]), Paragraph("ENABLED" if artifact["measurementEnabled"] else "DISABLED", styles["Small"]), Paragraph(safe(artifact["validation"]["status"]), styles["Small"])])
if not artifacts:
    artifact_rows.append([Paragraph("No spatial artifact", styles["BodyStrong"]), "-", "NO", "DISABLED", "NOT AVAILABLE"])
story.append(Table(artifact_rows, colWidths=[3.4 * inch, 2.1 * inch, 1 * inch, 1.3 * inch, 2.3 * inch], repeatRows=1, style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), SURFACE_2), ("BACKGROUND", (0, 1), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), .5, LINE), ("INNERGRID", (0, 0), (-1, -1), .35, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)])))
story.append(Spacer(1, 15))
integrity = data.get("integritySummary", {})
story.append(Table([[card(integrity.get("structuralValidation", "passed"), "Structural validation", GREEN), card(integrity.get("evidentiaryAuthentication", "limited"), "Evidence authentication", GOLD), card(f"{integrity.get('sourceBodiesPreserved', 0)} of {len(data['sources'])}", "Preserved source bodies", RED)]], colWidths=[3.35 * inch] * 3, style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 8)])))
story.extend([Spacer(1, 12), Paragraph("Internal consistency does not authenticate remote source content. Measurements remain disabled for non-metric case scenes. Gaussian-splat products are visualization derivatives unless independently validated.", styles["BodyDark"]), PageBreak()])

diagram = reconstruction_diagram() or timing_diagram()
if diagram is not None:
    section("Labeled reconstruction view", "Project-authored analytical graphic")
    story.append(diagram)
    story.append(Spacer(1, 8))
    story.append(Paragraph("This diagram is generated from the package's relational scene or normalized timing anchors. It contains no copied source pixels and does not add metric, geodetic, trajectory, identity, or legal conclusions.", styles["BodyDark"]))
    story.append(PageBreak())

# Sources appendix
for offset in range(0, len(data["sources"]), 6):
    section("Source appendix", f"Sources {offset + 1}-{min(offset + 6, len(data['sources']))} of {len(data['sources'])}")
    rows = [[Paragraph("ID", styles["Eyebrow"]), Paragraph("SOURCE", styles["Eyebrow"]), Paragraph("LOCATOR", styles["Eyebrow"]), Paragraph("PRESERVATION", styles["Eyebrow"])]]
    for source in data["sources"][offset:offset + 6]:
        snapshot = next(item for item in data["sourceSnapshots"] if item["sourceId"] == source["id"])
        locator = "; ".join(f"{item['kind']}: {item['value']}" for item in source["locators"])
        rows.append([Paragraph(source_codes[source["id"]], styles["BodyStrong"]), Paragraph(f"<b>{safe(source['title'])}</b><br/>{safe(source['publisher'])}<br/><font color='#70808A'>{safe(source['canonicalUrl'])}</font>", styles["Small"]), Paragraph(safe(locator), styles["Small"]), Paragraph(safe(snapshot.get("preservationState", snapshot["storageState"])), styles["Small"])])
    story.append(Table(rows, colWidths=[.5 * inch, 4.25 * inch, 4.35 * inch, 1.05 * inch], repeatRows=1, style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), SURFACE_2), ("BACKGROUND", (0, 1), (-1, -1), SURFACE), ("BOX", (0, 0), (-1, -1), .5, LINE), ("INNERGRID", (0, 0), (-1, -1), .35, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)])))
    if offset + 6 < len(data["sources"]):
        story.append(PageBreak())

doc.build(story)
print(f"Wrote v2 briefing {output_path}")

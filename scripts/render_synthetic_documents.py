#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow>=10.4.0", "reportlab>=4.2.0"]
# ///

"""Render synthetic applicant document bundles into mixed-format demo artifacts."""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import subprocess
import textwrap
from io import BytesIO
from pathlib import Path
from typing import Any, Iterable

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "credit-checking" / "data"
DATA_PATH = DATA_ROOT / "manifests" / "synthetic_applicant_bundles.json"
OUT_DIR = DATA_ROOT / "applicants"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DATA_PATH)
    parser.add_argument("--output-dir", type=Path, default=OUT_DIR)
    parser.add_argument(
        "--webp-backend",
        choices=["gemimg", "local"],
        default="gemimg",
        help="How to generate .webp documents marked as gemimg_scan_webp.",
    )
    parser.add_argument(
        "--gemimg-timeout-sec",
        type=int,
        default=240,
        help="Timeout for each gemimg image generation call.",
    )
    parser.add_argument(
        "--gemimg-samples",
        type=int,
        default=0,
        help="Generate N supplemental gemimg visuals for scan-style docs (keeps local readable render as primary).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Seed for deterministic local scan noise.",
    )
    return parser.parse_args()


def slugify(name: str) -> str:
    chars = [c if c.isalnum() else "_" for c in name]
    slug = "".join(chars)
    while "__" in slug:
        slug = slug.replace("__", "_")
    return slug.strip("_")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def choose_font(size: int, mono: bool = False, bold: bool = False) -> ImageFont.ImageFont:
    mono_candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationMono-Regular.ttf",
    ]
    sans_candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    bold_candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ]
    candidates = mono_candidates if mono else (bold_candidates if bold else sans_candidates)
    if bold and not mono:
        candidates = bold_candidates + sans_candidates
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def wrap_lines(text: str, width: int) -> list[str]:
    wrapped = textwrap.wrap(text, width=width) or [""]
    return wrapped


def document_text_lines(doc: dict[str, Any]) -> list[str]:
    sc = doc["Structured_Content"]
    lines = [
        doc["Title"].upper(),
        f"Issuer: {doc['Issuing_Organization']}",
        f"Issue Date: {doc['Issue_Date']}",
        f"Document Type: {doc['Document_Type']}",
    ]
    if sc.get("student_name"):
        lines.append(f"Student: {sc['student_name']}")
    if sc.get("student_id_on_document"):
        lines.append(f"Document Student ID: {sc['student_id_on_document']}")
    if sc.get("document_number"):
        lines.append(f"Document Number: {sc['document_number']}")
    if sc.get("summary_lines"):
        lines.append("")
        lines.append("SUMMARY")
        lines.extend(sc["summary_lines"])

    if (service := sc.get("service_record")):
        lines.append("")
        lines.append("SERVICE RECORD")
        for key in [
            "branch",
            "component",
            "rank_at_separation",
            "mos_code",
            "mos_title",
            "service_start",
            "service_end",
            "character_of_service",
            "deployments_count",
        ]:
            if key in service:
                label = key.replace("_", " ").title()
                lines.append(f"{label}: {service[key]}")

    if (edu := sc.get("education_record")):
        lines.append("")
        lines.append("EDUCATION RECORD")
        for key in [
            "institution_name",
            "student_number",
            "program",
            "credential_awarded",
            "attendance_start",
            "attendance_end",
            "gpa",
            "graduation_date",
        ]:
            if key in edu:
                label = key.replace("_", " ").title()
                lines.append(f"{label}: {edu[key]}")

    if (ev := sc.get("evaluation_record")):
        lines.append("")
        lines.append("CREDENTIAL EVALUATION")
        for key in [
            "agency",
            "report_type",
            "origin_country",
            "origin_institution",
            "origin_credential",
            "us_equivalency",
            "us_gpa",
            "report_date",
            "reference_number",
        ]:
            if key in ev:
                label = key.replace("_", " ").title()
                lines.append(f"{label}: {ev[key]}")

    if (cert := sc.get("certificate_record")):
        lines.append("")
        lines.append("CERTIFICATE")
        for key in [
            "certificate_name",
            "provider",
            "credential_id",
            "issue_date",
            "expiration_date",
            "verification_url",
        ]:
            if key in cert:
                label = key.replace("_", " ").title()
                lines.append(f"{label}: {cert[key]}")
        if cert.get("skills"):
            lines.append("Skills:")
            for skill in cert["skills"]:
                lines.append(f" - {skill}")

    if sc.get("scores"):
        lines.append("")
        lines.append("SCORES")
        for s in sc["scores"]:
            lines.append(f"{s['test_name']} | {s['section']}: {s['score']} ({s['scale']}) [{s['test_date']}]")

    if sc.get("courses"):
        lines.append("")
        lines.append("COURSE RECORDS")
        lines.append("Code           | Title                             | Term   | Yr | Cr | Grade | Status")
        lines.append("-" * 94)
        for c in sc["courses"]:
            code = c["course_code"][:13].ljust(13)
            title = c["course_title"][:33].ljust(33)
            term = c["term_label"][:6].ljust(6)
            year = str(c["year"]).rjust(4)
            credits = f"{c['credits']:.1f}".rjust(4)
            grade = str(c["grade"] if c["grade"] is not None else "").ljust(5)
            status = c["status"][:9].ljust(9)
            lines.append(f"{code} | {title} | {term} | {year} | {credits} | {grade} | {status}")

    if sc.get("ace_recommendations"):
        lines.append("")
        lines.append("ACE CREDIT RECOMMENDATIONS")
        for rec in sc["ace_recommendations"]:
            lines.append(
                f"{rec['experience_or_training']}: {rec['subject']} "
                f"(LL {rec['lower_division_credits']:.1f} / UL {rec['upper_division_credits']:.1f})"
            )
            lines.extend(wrap_lines(f"Basis: {rec['recommendation_basis']}", width=92))

    if sc.get("ai_mapping_hints"):
        lines.append("")
        lines.append("AI MAPPING HINTS")
        for hint in sc["ai_mapping_hints"]:
            lines.append(
                f"{hint['source_evidence']} -> {hint['proposed_college_course_code']} "
                f"({hint['proposed_college_course_title']}, {hint['credits']:.1f} cr)"
            )

    if sc.get("raw_text_preview"):
        lines.append("")
        lines.append("RAW TEXT PREVIEW")
        lines.extend(sc["raw_text_preview"])

    if sc.get("notes"):
        lines.append("")
        lines.append("NOTES")
        for note in sc["notes"]:
            lines.extend(wrap_lines(note, width=92))

    return lines


def draw_wrapped_pdf_lines(
    c: canvas.Canvas,
    x: float,
    y: float,
    width_chars: int,
    lines: Iterable[str],
    *,
    font_name: str = "Helvetica",
    font_size: int = 10,
    leading: int = 13,
    bottom_margin: float = 0.7 * inch,
) -> float:
    c.setFont(font_name, font_size)
    cur_y = y
    for line in lines:
        wrapped = wrap_lines(str(line), width_chars) if line else [""]
        for chunk in wrapped:
            if cur_y <= bottom_margin:
                c.showPage()
                cur_y = letter[1] - 0.75 * inch
                c.setFont(font_name, font_size)
            c.drawString(x, cur_y, chunk)
            cur_y -= leading
    return cur_y


def render_pristine_pdf(doc: dict[str, Any], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(out_path), pagesize=letter)
    width, height = letter
    sc = doc["Structured_Content"]

    c.setStrokeColor(colors.HexColor("#D1D5DB"))
    c.setFillColor(colors.HexColor("#F8FAFC"))
    c.rect(0.5 * inch, height - 1.35 * inch, width - inch, 0.85 * inch, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#0F172A"))
    c.setFont("Helvetica-Bold", 16)
    c.drawString(0.75 * inch, height - 0.9 * inch, doc["Title"])
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#334155"))
    c.drawString(0.75 * inch, height - 1.15 * inch, f"Issuer: {doc['Issuing_Organization']}")
    c.drawRightString(width - 0.75 * inch, height - 1.15 * inch, f"Issue Date: {doc['Issue_Date']}")

    y = height - 1.7 * inch
    if sc.get("student_name"):
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(0.75 * inch, y, f"Student: {sc['student_name']}")
        y -= 0.25 * inch

    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    y = draw_wrapped_pdf_lines(
        c,
        0.75 * inch,
        y,
        95,
        [f"- {line}" for line in sc.get("summary_lines", [])],
        font_name="Helvetica",
        font_size=10,
        leading=14,
    )
    y -= 0.1 * inch

    if (cert := sc.get("certificate_record")):
        c.setFont("Helvetica-Bold", 11)
        c.drawString(0.75 * inch, y, "Credential Details")
        y -= 0.2 * inch
        rows = [
            f"Certificate: {cert['certificate_name']}",
            f"Provider: {cert['provider']}",
            f"Credential ID: {cert['credential_id']}",
            f"Issue Date: {cert['issue_date']}",
            f"Expiration Date: {cert.get('expiration_date') or 'N/A'}",
            f"Verification URL: {cert['verification_url']}",
        ]
        y = draw_wrapped_pdf_lines(c, 0.9 * inch, y, 92, rows, font_name="Helvetica", font_size=9, leading=12)
        if cert.get("skills"):
            y -= 0.1 * inch
            c.setFont("Helvetica-Bold", 10)
            c.drawString(0.9 * inch, y, "Skills")
            y -= 0.18 * inch
            y = draw_wrapped_pdf_lines(c, 1.05 * inch, y, 88, [f"* {s}" for s in cert["skills"]], font_name="Helvetica", font_size=9, leading=12)

    if (ev := sc.get("evaluation_record")):
        c.setFont("Helvetica-Bold", 11)
        if y < 2.5 * inch:
            c.showPage()
            y = height - 0.9 * inch
        c.drawString(0.75 * inch, y, "Evaluation Summary")
        y -= 0.2 * inch
        rows = [
            f"Agency: {ev['agency']}",
            f"Report Type: {ev['report_type']}",
            f"Origin Institution: {ev['origin_institution']} ({ev['origin_country']})",
            f"Origin Credential: {ev['origin_credential']}",
            f"U.S. Equivalency: {ev['us_equivalency']}",
            f"U.S. GPA: {ev.get('us_gpa') if ev.get('us_gpa') is not None else 'N/A'}",
            f"Reference Number: {ev['reference_number']}",
        ]
        y = draw_wrapped_pdf_lines(c, 0.9 * inch, y, 90, rows, font_name="Helvetica", font_size=9, leading=12)

    if sc.get("scores"):
        if y < 2.2 * inch:
            c.showPage()
            y = height - 0.9 * inch
        c.setFont("Helvetica-Bold", 11)
        c.drawString(0.75 * inch, y, "Score Breakdown")
        y -= 0.2 * inch
        for s in sc["scores"]:
            c.setStrokeColor(colors.HexColor("#CBD5E1"))
            c.rect(0.9 * inch, y - 0.15 * inch, width - 1.8 * inch, 0.28 * inch, fill=0, stroke=1)
            c.setFont("Helvetica", 9)
            c.drawString(1.0 * inch, y - 0.03 * inch, f"{s['section']}")
            c.drawRightString(width - 1.0 * inch, y - 0.03 * inch, f"{s['score']} ({s['scale']})")
            y -= 0.34 * inch

    if sc.get("courses"):
        if y < 3.0 * inch:
            c.showPage()
            y = height - 0.9 * inch
        c.setFont("Helvetica-Bold", 11)
        c.drawString(0.75 * inch, y, "Course Table")
        y -= 0.18 * inch
        c.setFont("Helvetica-Bold", 8)
        c.drawString(0.8 * inch, y, "Code")
        c.drawString(1.8 * inch, y, "Course Title")
        c.drawString(4.6 * inch, y, "Term")
        c.drawString(5.35 * inch, y, "Yr")
        c.drawString(5.8 * inch, y, "Cr")
        c.drawString(6.15 * inch, y, "Grade")
        y -= 0.12 * inch
        c.line(0.75 * inch, y, width - 0.75 * inch, y)
        y -= 0.15 * inch
        c.setFont("Helvetica", 8)
        for row in sc["courses"]:
            if y < 0.9 * inch:
                c.showPage()
                y = height - 0.9 * inch
                c.setFont("Helvetica", 8)
            c.drawString(0.8 * inch, y, row["course_code"][:15])
            c.drawString(1.8 * inch, y, row["course_title"][:44])
            c.drawString(4.6 * inch, y, row["term_label"][:8])
            c.drawString(5.35 * inch, y, str(row["year"]))
            c.drawString(5.8 * inch, y, f"{row['credits']:.1f}")
            c.drawString(6.15 * inch, y, str(row.get("grade") or ""))
            y -= 0.18 * inch

    if sc.get("ai_mapping_hints"):
        if y < 2.0 * inch:
            c.showPage()
            y = height - 0.9 * inch
        c.setFont("Helvetica-Bold", 10)
        c.drawString(0.75 * inch, y, "AI Mapping Hints (for demo renderer)")
        y -= 0.18 * inch
        hint_lines = [
            f"- {h['source_evidence']} -> {h['proposed_college_course_code']} ({h['credits']:.1f} cr)"
            for h in sc["ai_mapping_hints"]
        ]
        draw_wrapped_pdf_lines(c, 0.9 * inch, y, 90, hint_lines, font_name="Helvetica", font_size=8, leading=11)

    c.save()


def render_raw_text_pdf(doc: dict[str, Any], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(out_path), pagesize=letter)
    width, height = letter
    left = 0.55 * inch
    top = height - 0.55 * inch
    line_height = 11
    max_width = 102

    full_lines = build_raw_text_lines(doc)

    cur_y = top
    c.setFont("Courier", 9)
    for line in full_lines:
        chunks = wrap_lines(line, max_width) if line else [""]
        for chunk in chunks:
            if cur_y < 0.55 * inch:
                c.showPage()
                c.setFont("Courier", 9)
                cur_y = top
            c.drawString(left, cur_y, chunk)
            cur_y -= line_height
    c.save()


def build_raw_text_lines(doc: dict[str, Any]) -> list[str]:
    full_lines = []
    full_lines.append("=" * 106)
    full_lines.append(doc["Title"].upper())
    full_lines.append("=" * 106)
    full_lines.extend(document_text_lines(doc))
    full_lines.append("")
    full_lines.append("END OF DOCUMENT")
    return full_lines


def render_raw_text_txt(doc: dict[str, Any], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text("\n".join(build_raw_text_lines(doc)) + "\n", encoding="utf-8")


def paper_background(size: tuple[int, int], tone: str) -> Image.Image:
    base = {
        "warm_offwhite": (241, 237, 228),
        "yellowed_offwhite": (235, 229, 207),
        "gray_white": (232, 233, 235),
        "plain_white": (246, 247, 248),
        "bright_white": (248, 250, 252),
    }.get(tone, (242, 242, 242))
    img = Image.new("RGB", size, base)
    # subtle paper texture
    noise = Image.effect_noise(size, 6).convert("L")
    noise = ImageOps.autocontrast(noise)
    noise = noise.point(lambda p: 220 + (p - 128) * 0.08)
    img = ImageChops.multiply(img, Image.merge("RGB", (noise, noise, noise)))
    return img


def add_scan_artifacts(img: Image.Image, visual_profile: dict[str, Any], rng: random.Random) -> Image.Image:
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = img.size

    # Edge shadow
    for i in range(6):
        alpha = 25 - i * 3
        draw.rectangle((12 + i, 12 + i, w - 12 - i, h - 12 - i), outline=(90, 90, 90, alpha))

    # Random stains / smudges for medium-heavy artifacts
    artifact = visual_profile.get("artifact_level", "light")
    if artifact in {"medium", "heavy"}:
        for _ in range(2 if artifact == "medium" else 4):
            x = rng.randint(80, w - 160)
            y = rng.randint(80, h - 160)
            r = rng.randint(20, 90)
            draw.ellipse((x - r, y - r, x + r, y + r), outline=(120, 100, 80, 28), width=2)
    if artifact == "heavy":
        for _ in range(900):
            x = rng.randint(0, w - 1)
            y = rng.randint(0, h - 1)
            val = rng.randint(140, 210)
            img.putpixel((x, y), (val, val, val))

    # Fax line artifacts
    if artifact in {"medium", "heavy"}:
        for _ in range(4):
            y = rng.randint(40, h - 40)
            draw.line((20, y, w - 20, y + rng.randint(-2, 2)), fill=(120, 120, 120, 28), width=1)

    blur_px = float(visual_profile.get("blur_px", 0.0) or 0.0)
    if blur_px > 0:
        img = img.filter(ImageFilter.GaussianBlur(radius=blur_px))

    rot = float(visual_profile.get("rotation_degrees", 0.0) or 0.0)
    if rot:
        img = img.rotate(rot, resample=Image.Resampling.BICUBIC, expand=True, fillcolor=(235, 235, 235))
        img = ImageOps.fit(img, (1654, 2339), method=Image.Resampling.BICUBIC, centering=(0.5, 0.5))

    return img


def build_scan_image(doc: dict[str, Any], rng: random.Random) -> Image.Image:
    sc = doc["Structured_Content"]
    vp = sc["visual_profile"]
    img = paper_background((1654, 2339), vp.get("paper_tone", "gray_white"))
    draw = ImageDraw.Draw(img)
    title_font = choose_font(42, bold=True)
    label_font = choose_font(24, bold=True)
    body_font = choose_font(23)
    mono_font = choose_font(20, mono=True)

    # Margins and faux header blocks
    draw.rectangle((70, 60, 1584, 240), outline=(70, 70, 70), width=3)
    draw.text((95, 82), doc["Title"][:70], fill=(25, 25, 25), font=title_font)
    draw.text((98, 150), f"Issuer: {doc['Issuing_Organization']}", fill=(40, 40, 40), font=body_font)
    draw.text((980, 150), f"Issue Date: {doc['Issue_Date']}", fill=(40, 40, 40), font=body_font)

    if doc["Document_Type"] in {"DD214", "High_School_Attestation_Form", "Community_College_Transcript"}:
        draw.rectangle((70, 270, 1584, 2100), outline=(90, 90, 90), width=2)
        for y in range(330, 2060, 90):
            draw.line((85, y, 1570, y), fill=(175, 175, 175), width=1)
        for x in [470, 980, 1270]:
            draw.line((x, 285, x, 2090), fill=(180, 180, 180), width=1)

    lines = document_text_lines(doc)
    y = 285
    x = 96
    max_chars = 108
    draw.text((x, y), "DOCUMENT CONTENT (SYNTHETIC FACSIMILE)", fill=(20, 20, 20), font=label_font)
    y += 55
    for line in lines:
        for chunk in wrap_lines(line, max_chars) if line else [""]:
            if y > 2240:
                break
            font = mono_font if len(chunk) > 45 or "|" in chunk else body_font
            draw.text((x, y), chunk, fill=(30, 30, 30), font=font)
            y += 28
        if y > 2240:
            break

    # Stamp-like corner box for authenticity feel
    draw.rectangle((1220, 2160, 1550, 2280), outline=(120, 60, 60), width=3)
    draw.text((1240, 2196), "RECEIVED", fill=(120, 60, 60), font=choose_font(28, bold=True))

    img = add_scan_artifacts(img, vp, rng)
    return img


def render_scan_webp(doc: dict[str, Any], out_path: Path, rng: random.Random) -> None:
    img = build_scan_image(doc, rng)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, format="WEBP", quality=85, method=6)


def render_scanned_pdf(doc: dict[str, Any], out_path: Path, rng: random.Random) -> None:
    img = build_scan_image(doc, rng)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(out_path), pagesize=letter)
    page_w, page_h = letter
    margin = 0.45 * inch

    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    reader = ImageReader(buf)
    iw, ih = img.size
    scale = min((page_w - 2 * margin) / iw, (page_h - 2 * margin) / ih)
    draw_w = iw * scale
    draw_h = ih * scale
    x = (page_w - draw_w) / 2
    y = (page_h - draw_h) / 2

    c.setFillColor(colors.white)
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    c.drawImage(reader, x, y, width=draw_w, height=draw_h, preserveAspectRatio=True, mask="auto")
    c.save()


def generate_gemimg_webp(doc: dict[str, Any], out_path: Path, timeout_sec: int) -> dict[str, Any]:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    prompt = doc.get("Gemimg_Prompt") or f"Photorealistic scanned document image: {doc['Title']}"
    cmd = [
        "uvx",
        "gemimg",
        "--webp",
        "--force",
        "-o",
        out_path.name,
        prompt,
    ]
    proc = subprocess.run(
        cmd,
        cwd=out_path.parent,
        capture_output=True,
        text=True,
        timeout=timeout_sec,
        env=os.environ.copy(),
    )
    status = {
        "document_id": doc["Document_ID"],
        "method": "gemimg_scan_webp",
        "output_file": str(out_path),
        "returncode": proc.returncode,
        "stdout": proc.stdout.strip(),
        "stderr": proc.stderr.strip(),
    }
    if proc.returncode != 0:
        raise RuntimeError(f"gemimg failed for {doc['Document_ID']}: {proc.stderr.strip() or proc.stdout.strip()}")
    if not out_path.exists():
        alt = out_path.parent / out_path.name
        if alt.exists():
            alt.rename(out_path)
    if not out_path.exists():
        raise RuntimeError(f"gemimg reported success but output not found: {out_path}")
    return status


def render_document(
    doc: dict[str, Any],
    out_path: Path,
    rng: random.Random,
    *,
    webp_backend: str,
    gemimg_timeout_sec: int,
) -> dict[str, Any]:
    method = doc["Rendering_Method"]
    if method == "pristine_pdf":
        render_pristine_pdf(doc, out_path)
        return {"engine": "local", "status": "ok"}
    if method == "scanned_pdf":
        render_scanned_pdf(doc, out_path, rng)
        return {"engine": "local", "status": "ok"}
    if method == "raw_text_pdf":
        render_raw_text_pdf(doc, out_path)
        return {"engine": "local", "status": "ok"}
    if method == "raw_text_txt":
        render_raw_text_txt(doc, out_path)
        return {"engine": "local", "status": "ok"}
    if method in {"simulated_scan_webp", "gemimg_scan_webp"}:
        if method == "gemimg_scan_webp" and webp_backend == "gemimg":
            try:
                meta = generate_gemimg_webp(doc, out_path, gemimg_timeout_sec)
                return {"engine": "gemimg", "status": "ok", **meta}
            except Exception as exc:
                render_scan_webp(doc, out_path, rng)
                return {"engine": "local_fallback", "status": "fallback", "error": str(exc)}
        render_scan_webp(doc, out_path, rng)
        return {"engine": "local", "status": "ok"}
    raise ValueError(f"Unsupported rendering method: {method}")


def build_gemimg_job(doc: dict[str, Any], out_path: Path) -> dict[str, Any]:
    return {
        "document_id": doc["Document_ID"],
        "output_file": str(out_path),
        "prompt": doc.get("Gemimg_Prompt", ""),
        "document_type": doc["Document_Type"],
        "issuer": doc["Issuing_Organization"],
        "title": doc["Title"],
    }


def run_gemimg_samples(jobs: list[dict[str, Any]], out_dir: Path, count: int) -> list[dict[str, Any]]:
    out_dir.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, Any]] = []
    for job in jobs[:count]:
        out_name = f"{job['document_id']}_gemimg_preview.webp"
        out_path = out_dir / out_name
        cmd = [
            "uvx",
            "gemimg",
            "--webp",
            "--force",
            "-o",
            out_name,
            job["prompt"],
        ]
        status = {"document_id": job["document_id"], "output_file": str(out_path), "status": "ok"}
        try:
            proc = subprocess.run(
                cmd,
                check=True,
                capture_output=True,
                text=True,
                timeout=240,
                cwd=out_dir,
                env=os.environ.copy(),
            )
            status["stdout"] = proc.stdout.strip()
        except Exception as exc:  # pragma: no cover - best-effort supplemental output
            status["status"] = "failed"
            status["error"] = str(exc)
        results.append(status)
    return results


def make_contact_sheet(image_paths: list[Path], out_path: Path) -> None:
    if not image_paths:
        return
    cols = 4
    cell_w, cell_h = 360, 500
    rows = math.ceil(len(image_paths) / cols)
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h + 50), (246, 246, 246))
    draw = ImageDraw.Draw(sheet)
    font = choose_font(20, bold=True)
    small = choose_font(16)
    draw.text((20, 14), "Synthetic Scan-Style Preview (local renderer)", fill=(20, 20, 20), font=font)

    for i, path in enumerate(image_paths):
        row = i // cols
        col = i % cols
        x0 = col * cell_w + 12
        y0 = row * cell_h + 56
        try:
            img = Image.open(path).convert("RGB")
        except Exception:
            continue
        thumb = ImageOps.contain(img, (cell_w - 24, cell_h - 78))
        card = Image.new("RGB", (cell_w - 18, cell_h - 26), "white")
        card_draw = ImageDraw.Draw(card)
        card_draw.rectangle((0, 0, card.width - 1, card.height - 1), outline=(180, 180, 180))
        card.paste(thumb, ((card.width - thumb.width) // 2, 8))
        label = path.name[:38]
        card_draw.text((10, card.height - 42), label, fill=(40, 40, 40), font=small)
        sheet.paste(card, (x0, y0))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, format="WEBP", quality=88, method=6)


def write_manifest(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    data = load_json(args.input)
    rng = random.Random(args.seed)
    applicants_dir = args.output_dir
    data_root = applicants_dir.parent
    manifests_dir = data_root / "manifests"
    previews_dir = data_root / "previews"

    applicants_dir.mkdir(parents=True, exist_ok=True)
    manifests_dir.mkdir(parents=True, exist_ok=True)
    previews_dir.mkdir(parents=True, exist_ok=True)

    total_docs_expected = sum(len(a["Document_Bundle"]) for a in data["applicants"])

    manifest: dict[str, Any] = {
        "dataset_id": data["dataset_id"],
        "generated_on": data["generated_on"],
        "rendered_to": str(applicants_dir),
        "manifests_dir": str(manifests_dir),
        "previews_dir": str(previews_dir),
        "webp_backend": args.webp_backend,
        "applicants": [],
    }
    gemimg_jobs: list[dict[str, Any]] = []
    scan_images_for_preview: list[Path] = []
    total_docs = 0
    render_engine_counts: dict[str, int] = {}
    bundle_mix_summary = {
        "pdf_only": 0,
        "image_only": 0,
        "text_only": 0,
        "mixed": 0,
        "contains_txt": 0,
    }

    for applicant_index, applicant in enumerate(data["applicants"], start=1):
        name_slug = slugify(applicant["Persona"]["full_name"])
        folder = applicants_dir / f"{applicant['Applicant_ID']}_{name_slug}"
        folder.mkdir(parents=True, exist_ok=True)
        app_record = {
            "Applicant_ID": applicant["Applicant_ID"],
            "Archetype_Code": applicant["Archetype_Code"],
            "Archetype_Label": applicant["Archetype_Label"],
            "Folder": str(folder.relative_to(ROOT)),
            "Documents": [],
        }
        format_counts: dict[str, int] = {}
        for doc in applicant["Document_Bundle"]:
            out_path = folder / doc["Output_File_Name"]
            total_docs += 1
            print(
                f"[{total_docs}/{total_docs_expected}] Rendering {applicant['Applicant_ID']} "
                f"{doc['Document_ID']} -> {out_path.name}"
            )
            render_meta = render_document(
                doc,
                out_path,
                rng,
                webp_backend=args.webp_backend,
                gemimg_timeout_sec=args.gemimg_timeout_sec,
            )
            engine_key = str(render_meta.get("engine", "local"))
            render_engine_counts[engine_key] = render_engine_counts.get(engine_key, 0) + 1

            fmt = doc["Document_Format"]
            format_counts[fmt] = format_counts.get(fmt, 0) + 1
            app_record["Documents"].append(
                {
                    "Document_ID": doc["Document_ID"],
                    "Document_Type": doc["Document_Type"],
                    "Document_Format": doc["Document_Format"],
                    "Rendering_Method": doc["Rendering_Method"],
                    "Render_Engine": render_meta.get("engine"),
                    "Render_Status": render_meta.get("status"),
                    "Output_File": str(out_path.relative_to(ROOT)),
                }
            )
            if doc["Document_Format"] == "webp":
                scan_images_for_preview.append(out_path)
            if doc["Rendering_Method"] == "gemimg_scan_webp" and doc.get("Gemimg_Prompt"):
                gemimg_jobs.append(build_gemimg_job(doc, out_path))
        app_record["Format_Counts"] = format_counts
        app_record["Format_Mix"] = sorted(format_counts.keys())
        if "txt" in format_counts:
            bundle_mix_summary["contains_txt"] += 1
        if set(format_counts) == {"pdf"}:
            bundle_mix_summary["pdf_only"] += 1
        elif set(format_counts) == {"webp"}:
            bundle_mix_summary["image_only"] += 1
        elif set(format_counts) == {"txt"}:
            bundle_mix_summary["text_only"] += 1
        else:
            bundle_mix_summary["mixed"] += 1

        pdf_count = format_counts.get("pdf", 0)
        webp_count = format_counts.get("webp", 0)
        txt_count = format_counts.get("txt", 0)
        print(
            f"  -> mix for {applicant['Applicant_ID']} (applicant {applicant_index}/{len(data['applicants'])}): "
            f"pdf={pdf_count}, webp={webp_count}, txt={txt_count}"
        )
        manifest["applicants"].append(app_record)

    gemimg_jobs_path = manifests_dir / "gemimg_jobs.json"
    write_manifest(gemimg_jobs_path, {"jobs": gemimg_jobs})

    # CLI helper script for manual reruns
    helper = previews_dir / "run_gemimg_samples.sh"
    helper.write_text(
        "#!/usr/bin/env bash\n"
        "set -euo pipefail\n"
        "COUNT=\"${1:-3}\"\n"
        "OUT_DIR=\"$(dirname \"$0\")/gemimg_samples\"\n"
        "mkdir -p \"$OUT_DIR\"\n"
        "echo \"Use: set -a && source .env && set +a && uv run --script scripts/render_synthetic_documents.py --gemimg-samples $COUNT\"\n",
        encoding="utf-8",
    )
    helper.chmod(0o755)

    preview_path = previews_dir / "scan_contact_sheet.webp"
    make_contact_sheet(scan_images_for_preview[:12], preview_path)

    gemimg_results: list[dict[str, Any]] = []
    if args.gemimg_samples > 0 and gemimg_jobs:
        gemimg_results = run_gemimg_samples(gemimg_jobs, previews_dir / "gemimg_samples", args.gemimg_samples)

    manifest["total_applicants"] = len(data["applicants"])
    manifest["total_documents"] = total_docs
    manifest["gemimg_job_count"] = len(gemimg_jobs)
    manifest["bundle_mix_summary"] = bundle_mix_summary
    manifest["render_engine_counts"] = render_engine_counts
    manifest["preview_contact_sheet"] = str(preview_path.relative_to(ROOT)) if preview_path.exists() else None
    if gemimg_results:
        manifest["gemimg_sample_results"] = gemimg_results

    write_manifest(manifests_dir / "render_manifest.json", manifest)

    print(f"Rendered {total_docs} documents for {len(data['applicants'])} applicants -> {applicants_dir.relative_to(ROOT)}")
    print(f"Gemimg-ready scan jobs: {len(gemimg_jobs)} (see {gemimg_jobs_path.relative_to(ROOT)})")
    if preview_path.exists():
        print(f"Preview contact sheet: {preview_path.relative_to(ROOT)}")
    if gemimg_results:
        ok_count = sum(1 for r in gemimg_results if r.get('status') == 'ok')
        print(f"Gemimg sample renders: {ok_count}/{len(gemimg_results)} succeeded")


if __name__ == "__main__":
    main()

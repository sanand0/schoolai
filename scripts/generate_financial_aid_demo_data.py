#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow>=10.4.0", "reportlab>=4.2.0"]
# ///

"""Generate synthetic financial-aid applicant bundles with documents + chats."""

from __future__ import annotations

import json
import textwrap
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "financial-aid" / "data"
TZ_CST = timezone(timedelta(hours=-6))


def choose_font(size: int, *, bold: bool = False, mono: bool = False) -> ImageFont.ImageFont:
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
    for candidate in candidates:
        if Path(candidate).exists():
            try:
                return ImageFont.truetype(candidate, size)
            except OSError:
                continue
    return ImageFont.load_default()


def wrap_text(text: str, width: int) -> list[str]:
    return textwrap.wrap(text, width=width) or [""]


def slugify(value: str) -> str:
    out = [ch if ch.isalnum() else "_" for ch in value]
    slug = "".join(out)
    while "__" in slug:
        slug = slug.replace("__", "_")
    return slug.strip("_")


def make_doc(
    doc_id: str,
    doc_type: str,
    title: str,
    file_name: str,
    fmt: str,
    role: str,
    issuer: str,
    issue_date: str,
    render_template: str,
    structured_fields: dict[str, Any],
    body_lines: list[str],
    quality_flags: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "doc_id": doc_id,
        "doc_type": doc_type,
        "title": title,
        "file_name": file_name,
        "format": fmt,
        "document_role": role,
        "issuer": issuer,
        "issue_date": issue_date,
        "render_template": render_template,
        "quality_flags": quality_flags or [],
        "structured_fields": structured_fields,
        "body_lines": body_lines,
    }


def form_update(
    form_id: str,
    field_id: str,
    field_label: str,
    value: Any,
    source: str,
    confidence: float = 0.95,
) -> dict[str, Any]:
    return {
        "form_id": form_id,
        "field_id": field_id,
        "field_label": field_label,
        "new_value": value,
        "source": source,
        "confidence": confidence,
    }


def event(
    speaker: str,
    message: str,
    *,
    language: str,
    intent: str,
    sentiment: str,
    form_updates: list[dict[str, Any]] | None = None,
    document_links: list[dict[str, str]] | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "speaker": speaker,
        "language": language,
        "intent": intent,
        "sentiment": sentiment,
        "message": message,
    }
    if form_updates:
        payload["form_updates"] = form_updates
    if document_links:
        payload["document_links"] = document_links
    if metadata:
        payload["metadata"] = metadata
    return payload


def timestamped_chat(start_hour: int, start_minute: int, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    start = datetime(2026, 3, 2, start_hour, start_minute, tzinfo=TZ_CST)
    out: list[dict[str, Any]] = []
    for idx, item in enumerate(events, start=1):
        stamped = {
            "turn": idx,
            "timestamp": (start + timedelta(minutes=2 * (idx - 1))).isoformat(),
            **item,
        }
        out.append(stamped)
    return out


def pdf_line(c: canvas.Canvas, text: str, x: float, y: float, width_chars: int = 96) -> float:
    for wrapped in wrap_text(text, width_chars):
        c.drawString(x, y, wrapped)
        y -= 13
    return y


def render_pdf_document(doc: dict[str, Any], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(out_path), pagesize=letter)
    width, height = letter
    x_margin = 52
    y = height - 54

    c.setFont("Helvetica-Bold", 15)
    c.drawString(x_margin, y, doc["title"])
    y -= 20

    c.setFillColor(colors.HexColor("#444444"))
    c.setFont("Helvetica", 9)
    c.drawString(x_margin, y, f"Issuer: {doc['issuer']}")
    c.drawRightString(width - x_margin, y, f"Issue Date: {doc['issue_date']}")
    y -= 16
    c.drawString(x_margin, y, f"Document Type: {doc['doc_type']}")
    c.drawRightString(width - x_margin, y, f"Role: {doc['document_role']}")

    y -= 14
    c.setFillColor(colors.HexColor("#777777"))
    c.line(x_margin, y, width - x_margin, y)
    y -= 18

    c.setFillColor(colors.black)
    c.setFont("Helvetica", 10)

    if doc.get("structured_fields"):
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x_margin, y, "KEY FIELDS")
        y -= 15
        c.setFont("Helvetica", 10)
        for key, value in doc["structured_fields"].items():
            line = f"{key.replace('_', ' ').title()}: {value}"
            y = pdf_line(c, line, x_margin, y)
            if y < 82:
                c.showPage()
                y = height - 54
                c.setFont("Helvetica", 10)

    if doc.get("body_lines"):
        y -= 4
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x_margin, y, "CONTENT")
        y -= 15
        c.setFont("Helvetica", 10)
        for line in doc["body_lines"]:
            y = pdf_line(c, line, x_margin, y)
            if y < 82:
                c.showPage()
                y = height - 54
                c.setFont("Helvetica", 10)

    y -= 8
    if y < 100:
        c.showPage()
        y = height - 54

    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawString(x_margin, y, "Synthetic document for Financial Aid Bot demo only. Not real student data.")
    c.save()


def render_card_photo(doc: dict[str, Any], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    bg = Image.new("RGB", (1600, 980), (58, 63, 70))
    bg_draw = ImageDraw.Draw(bg)

    # Subtle desk texture lines.
    for idx in range(0, 980, 14):
        shade = 54 + (idx % 5)
        bg_draw.line([(0, idx), (1600, idx)], fill=(shade, shade + 2, shade + 5), width=1)

    card = Image.new("RGB", (1090, 680), (239, 242, 247))
    d = ImageDraw.Draw(card)
    d.rectangle([(0, 0), (1090, 98)], fill=(26, 82, 153))
    d.text((28, 32), doc["title"].upper(), fill="white", font=choose_font(30, bold=True))

    d.rectangle([(40, 145), (335, 495)], outline=(40, 50, 65), width=3)
    d.text((70, 300), "PHOTO", fill=(110, 115, 120), font=choose_font(34, bold=True))

    fields = doc.get("structured_fields", {})
    y = 148
    for key in [
        "full_name",
        "id_number",
        "dob",
        "address",
        "expiration",
        "citizenship_status",
    ]:
        if key in fields:
            label = key.replace("_", " ").upper()
            d.text((380, y), f"{label}", fill=(35, 45, 60), font=choose_font(16, bold=True))
            d.text((380, y + 22), str(fields[key]), fill=(20, 20, 20), font=choose_font(20))
            y += 72

    d.rectangle([(0, 620), (1090, 680)], fill=(216, 222, 232))
    d.text((30, 639), "SYNTHETIC DEMO DOCUMENT", fill=(35, 45, 60), font=choose_font(18, bold=True))

    angle = -2.0 if "2_degree_skew" in doc.get("quality_flags", []) else -0.5
    card_rot = card.rotate(angle, expand=True, fillcolor=(58, 63, 70))
    x = (bg.width - card_rot.width) // 2
    y0 = (bg.height - card_rot.height) // 2
    bg.paste(card_rot, (x, y0))

    final_img = apply_quality_flags(bg, doc.get("quality_flags", []))
    final_img.save(out_path, "WEBP", quality=84, method=6)


def render_page_photo(doc: dict[str, Any], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)

    desk = Image.new("RGB", (1900, 1500), (66, 71, 78))
    desk_draw = ImageDraw.Draw(desk)
    for idx in range(0, 1900, 24):
        tint = 60 + (idx % 7)
        desk_draw.line([(idx, 0), (idx, 1500)], fill=(tint, tint + 1, tint + 4), width=1)

    paper = Image.new("RGB", (1080, 1340), (248, 245, 238))
    d = ImageDraw.Draw(paper)
    d.rectangle([(0, 0), (1079, 90)], fill=(40, 53, 72))
    d.text((26, 28), doc["title"], fill="white", font=choose_font(30, bold=True))

    y = 118
    d.text((30, y), f"Issuer: {doc['issuer']}", fill=(45, 45, 45), font=choose_font(18))
    y += 32
    d.text((30, y), f"Issue Date: {doc['issue_date']}", fill=(45, 45, 45), font=choose_font(18))
    y += 36
    d.line([(30, y), (1040, y)], fill=(115, 115, 115), width=2)
    y += 24

    fields = doc.get("structured_fields", {})
    for key, value in fields.items():
        label = key.replace("_", " ").title()
        text = f"{label}: {value}"
        for wrapped in wrap_text(text, 62):
            d.text((34, y), wrapped, fill=(28, 28, 28), font=choose_font(20))
            y += 28
        y += 4

    y += 6
    d.text((30, y), "Details", fill=(45, 45, 45), font=choose_font(21, bold=True))
    y += 30
    for line in doc.get("body_lines", []):
        for wrapped in wrap_text(line, 64):
            d.text((34, y), wrapped, fill=(25, 25, 25), font=choose_font(20))
            y += 27
        y += 3

    d.text((30, 1296), "Synthetic demo record - not real PII", fill=(80, 80, 80), font=choose_font(16))

    angle = -2.0 if "2_degree_skew" in doc.get("quality_flags", []) else -0.8
    paper_rot = paper.rotate(angle, expand=True, fillcolor=(66, 71, 78))
    x = (desk.width - paper_rot.width) // 2
    y0 = (desk.height - paper_rot.height) // 2
    desk.paste(paper_rot, (x, y0))

    final_img = apply_quality_flags(desk, doc.get("quality_flags", []))
    quality = 78 if "compression_noise" in doc.get("quality_flags", []) else 86
    final_img.save(out_path, "WEBP", quality=quality, method=6)


def apply_quality_flags(image: Image.Image, flags: list[str]) -> Image.Image:
    img = image.convert("RGB")

    if "low_light" in flags:
        img = ImageEnhance.Brightness(img).enhance(0.74)

    if "shadow_glare" in flags:
        overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
        d = ImageDraw.Draw(overlay)
        d.ellipse(
            [(int(img.width * 0.58), int(img.height * 0.1)), (int(img.width * 1.05), int(img.height * 0.62))],
            fill=(255, 255, 255, 42),
        )
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    if "coffee_stain" in flags:
        overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
        d = ImageDraw.Draw(overlay)
        d.ellipse([(240, 430), (640, 870)], outline=(110, 70, 35, 65), width=18)
        d.ellipse([(860, 220), (1170, 540)], outline=(122, 78, 41, 55), width=12)
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    if "monochrome_artifacting" in flags:
        img = ImageOps.grayscale(img).convert("RGB")
        img = ImageEnhance.Contrast(img).enhance(1.18)

    if "scanner_noise" in flags or "compression_noise" in flags:
        noise = Image.effect_noise(img.size, 8).convert("L")
        noise_rgb = Image.merge("RGB", (noise, noise, noise))
        img = Image.blend(img, noise_rgb, 0.10)

    if "blurry" in flags:
        img = img.filter(ImageFilter.GaussianBlur(radius=1.3))

    return img


def render_document(doc: dict[str, Any], out_path: Path) -> None:
    if doc["format"] == "pdf":
        render_pdf_document(doc, out_path)
        return

    template = doc.get("render_template")
    if template in {"id_card_photo", "ead_card_photo"}:
        render_card_photo(doc, out_path)
    else:
        render_page_photo(doc, out_path)


def build_applicants() -> list[dict[str, Any]]:
    applicants: list[dict[str, Any]] = []

    # Applicant 1
    form_1 = "uni_v1_verification_worksheet_2026"
    docs_1 = [
        make_doc(
            "FA001-D1",
            "W2_Phone_Photo",
            "Fast Food W-2 (Copy B)",
            "01_fast_food_w2_blurry.webp",
            "webp",
            "student_upload",
            "BrightBurger LLC Payroll",
            "2026-01-15",
            "w2_photo",
            {
                "employee_name": "Marcus Johnson",
                "employer": "BrightBurger #147",
                "tax_year": "2025",
                "wages_tips": "$8,412.37",
                "federal_withholding": "$282.00",
                "state": "IL",
            },
            [
                "Uploaded from Android camera at 11:42 PM in low bedroom lighting.",
                "Top-right corner is clipped and text is slightly smeared.",
            ],
            ["blurry", "2_degree_skew", "low_light", "monochrome_artifacting", "compression_noise"],
        ),
        make_doc(
            "FA001-D2",
            "Handwritten_Household_Note",
            "Household Note (Handwritten)",
            "02_household_note_handwritten.webp",
            "webp",
            "student_upload",
            "Student Provided",
            "2026-03-02",
            "handwritten_note_photo",
            {
                "note_text": "Me, my mom Tanya Johnson, and my little sister Aaliyah (age 10)",
                "phone_number": "312-555-0148",
                "signed_by": "Marcus J.",
            },
            [
                "Written on notebook paper and photographed on kitchen table.",
                "Coffee ring in lower-left area.",
            ],
            ["2_degree_skew", "coffee_stain", "scanner_noise"],
        ),
        make_doc(
            "FA001-D3",
            "V1_Verification_Worksheet_Draft",
            "The Uni V1 Verification Worksheet (Draft)",
            "03_v1_verification_worksheet_draft.pdf",
            "pdf",
            "ai_generated",
            "The Uni Financial Aid Bot",
            "2026-03-02",
            "form_pdf",
            {
                "student_name": "Marcus Johnson",
                "student_id": "U10449213",
                "aid_year": "2026-2027",
                "household_size": "3",
                "student_income_from_w2": "$8,412.37",
                "untaxed_income": "Pending advisor confirmation",
                "completion_status": "90% complete",
            },
            [
                "Sections completed from chat: Student info, household size, earned income.",
                "Escalated to advisor for SSDI untaxed income policy confirmation.",
            ],
            [],
        ),
    ]
    chat_1 = timestamped_chat(
        9,
        12,
        [
            event(
                "student",
                "The Uni says I have a hold and need a V1 Verification Worksheet. I do not know what that is.",
                language="en",
                intent="seek_help",
                sentiment="panicked",
            ),
            event(
                "ai",
                "Do not worry, Marcus, your classes are safe. I opened your V1 worksheet and we can do it together. First, who lives in your household?",
                language="en",
                intent="reassure_and_start_form",
                sentiment="empathetic",
                form_updates=[
                    form_update(form_1, "student_name", "Student Name", "Marcus Johnson", "student_profile", 0.99),
                    form_update(form_1, "student_id", "Student ID", "U10449213", "student_profile", 0.99),
                    form_update(form_1, "aid_year", "Aid Year", "2026-2027", "institution_context", 1.0),
                ],
            ),
            event(
                "student",
                "Just me, my mom, and my little sister.",
                language="en",
                intent="provide_household",
                sentiment="anxious",
            ),
            event(
                "ai",
                "Perfect. I filled household size as 3. Did you work last year? If yes, send me a photo of your W-2.",
                language="en",
                intent="collect_income",
                sentiment="supportive",
                form_updates=[
                    form_update(form_1, "household_size", "Household Size", "3", "turn_3_message", 0.98),
                    form_update(
                        form_1,
                        "household_members",
                        "Household Members",
                        ["Marcus Johnson (student)", "Tanya Johnson (mother)", "Aaliyah Johnson (sister, age 10)"],
                        "turn_3_message",
                        0.96,
                    ),
                ],
            ),
            event(
                "student",
                "Yes, I worked at BrightBurger. Uploading W-2 and my note now.",
                language="en",
                intent="upload_docs",
                sentiment="nervous",
                document_links=[
                    {"doc_id": "FA001-D1", "file_link": "./01_fast_food_w2_blurry.webp"},
                    {"doc_id": "FA001-D2", "file_link": "./02_household_note_handwritten.webp"},
                ],
            ),
            event(
                "ai",
                "I extracted your wages: $8,412.37 from BrightBurger. I entered your income section.",
                language="en",
                intent="autofill_income",
                sentiment="reassuring",
                form_updates=[
                    form_update(form_1, "employer_name", "Employer Name", "BrightBurger #147", "FA001-D1_ocr", 0.93),
                    form_update(form_1, "student_wages", "Student Wages", 8412.37, "FA001-D1_ocr", 0.94),
                    form_update(form_1, "federal_tax_paid", "Federal Tax Paid", 282.00, "FA001-D1_ocr", 0.91),
                ],
                metadata={"ocr_quality": "medium", "blur_detected": True},
            ),
            event(
                "student",
                "Wait, does my mom's disability check count as untaxed income?",
                language="en",
                intent="policy_question",
                sentiment="confused",
            ),
            event(
                "ai",
                "Great question. I am bringing in Sarah, a human financial aid advisor, to confirm that policy and finish your last step.",
                language="en",
                intent="escalate_to_human",
                sentiment="empathetic",
                metadata={
                    "escalation_trigger": "regulatory_complexity_and_student_confusion",
                    "distress_score": 0.86,
                    "handoff_to": "Sarah Kim",
                    "handoff_summary": "Worksheet 90% complete; verify treatment of parent SSDI untaxed income.",
                },
            ),
            event(
                "advisor",
                "Hi Marcus, I am Sarah. You did everything right. I reviewed your draft and I will help finalize the untaxed income section now.",
                language="en",
                intent="human_takeover",
                sentiment="calm",
                form_updates=[
                    form_update(form_1, "untaxed_income_parent_ssdi", "Parent SSDI Untaxed Income", "Included - advisor reviewed", "advisor_confirmation", 1.0),
                    form_update(form_1, "review_status", "Review Status", "Ready for e-sign", "advisor_confirmation", 1.0),
                ],
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-001",
            "profile": {
                "full_name": "Marcus Johnson",
                "preferred_name": "Marcus",
                "age": 18,
                "background_summary": "First-generation first-year student balancing school and part-time fast-food work.",
                "first_language": "English",
                "english_proficiency": "Fluent",
                "tech_savviness": "Low",
                "financial_aid_literacy": "Low",
                "device_primary": "Android smartphone",
                "current_address": "1948 S Kedzie Ave Apt 3, Chicago, IL 60623",
                "enrollment_goal": "AS Business Administration",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Dependent",
                "sai_estimate": -980,
                "reported_prior_year_income_usd": 8412,
                "current_year_income_usd": 9200,
                "household_size": 3,
                "selected_for": ["Federal Verification V1"],
                "risk_flags": ["high_stress", "dropout_language_detected"],
            },
            "required_forms": ["V1 Verification Worksheet", "Untaxed Income Clarification"],
            "document_bundle": docs_1,
            "chat_conversation": chat_1,
            "conversation_outcome": {
                "status": "escalated_to_human_and_resolved",
                "final_owner": "Advisor Sarah Kim",
                "completion_percent_before_handoff": 90,
            },
            "demo_hook": {
                "title": "Step-by-step V1 auto-fill plus empathetic escalation",
                "heart_moment": "AI reassures Marcus classes are safe, then escalates immediately when policy complexity appears.",
            },
        }
    )

    # Applicant 2
    form_2 = "professional_judgment_appeal_2026"
    docs_2 = [
        make_doc(
            "FA002-D1",
            "IRS_1040_Tax_Return",
            "IRS Form 1040 - Tax Year 2024",
            "01_2024_tax_return.pdf",
            "pdf",
            "student_upload",
            "Internal Revenue Service",
            "2025-04-12",
            "tax_return_pdf",
            {
                "taxpayer_name": "Elena Rodriguez",
                "filing_status": "Head of Household",
                "agi": "$75,118",
                "wages": "$75,000",
                "dependents": "2",
                "refund_or_amount_owed": "$412 refund",
            },
            [
                "Prior-prior year income is significantly above current circumstances.",
                "Used by FAFSA baseline before job loss adjustment.",
            ],
        ),
        make_doc(
            "FA002-D2",
            "Corporate_Layoff_Letter",
            "Termination Notice - Position Eliminated",
            "02_corporate_layoff_letter.pdf",
            "pdf",
            "student_upload",
            "NorthBridge Logistics Inc.",
            "2026-01-09",
            "letter_pdf",
            {
                "employee_name": "Elena Rodriguez",
                "title": "Operations Supervisor",
                "termination_date": "2026-01-08",
                "reason": "Reduction in force / company-wide layoff",
                "severance": "2 weeks",
            },
            [
                "This letter confirms involuntary separation due to restructuring.",
                "Employee eligible for unemployment benefits.",
            ],
        ),
        make_doc(
            "FA002-D3",
            "State_Unemployment_Statement",
            "Texas Workforce Commission Benefit Statement",
            "03_state_unemployment_statement.pdf",
            "pdf",
            "student_upload",
            "Texas Workforce Commission",
            "2026-02-20",
            "benefits_pdf",
            {
                "claimant_name": "Elena Rodriguez",
                "weekly_benefit_amount": "$426",
                "benefit_start": "2026-01-18",
                "remaining_weeks": "20",
                "projected_annualized_income": "$22,152",
            },
            [
                "Current income level materially below FAFSA prior-prior year estimate.",
                "Supports professional judgment review.",
            ],
        ),
        make_doc(
            "FA002-D4",
            "Professional_Judgment_Form_Draft",
            "The Uni Professional Judgment Appeal (Draft)",
            "04_professional_judgment_appeal_draft.pdf",
            "pdf",
            "ai_generated",
            "The Uni Financial Aid Bot",
            "2026-03-02",
            "form_pdf",
            {
                "student_name": "Elena Rodriguez",
                "change_in_circumstance": "Loss of Employment",
                "employment_end_date": "2026-01-08",
                "projected_2026_income": "$22,152",
                "personal_statement": "Drafted from conversation",
                "status": "Ready for e-sign",
            },
            [
                "Bot mapped documents to appeal checklist and drafted personal statement.",
                "Packet assembled for one-click submission.",
            ],
        ),
    ]
    chat_2 = timestamped_chat(
        9,
        42,
        [
            event(
                "student",
                "The FAFSA says my contribution is too high, but I just lost my job and have nothing.",
                language="en",
                intent="report_income_change",
                sentiment="distressed",
            ),
            event(
                "ai",
                "I am sorry you are going through this, Elena. You qualify to file a Professional Judgment Appeal. What date did your employment end?",
                language="en",
                intent="start_pj_form",
                sentiment="empathetic",
                form_updates=[
                    form_update(form_2, "student_name", "Student Name", "Elena Rodriguez", "student_profile", 0.99),
                    form_update(form_2, "appeal_reason", "Appeal Reason", "Loss of Employment", "turn_1_message", 0.98),
                ],
            ),
            event(
                "student",
                "January 8, 2026.",
                language="en",
                intent="answer_date",
                sentiment="worried",
            ),
            event(
                "ai",
                "Got it. I entered 2026-01-08. Please upload your layoff letter and unemployment statement.",
                language="en",
                intent="collect_documents",
                sentiment="supportive",
                form_updates=[
                    form_update(form_2, "employment_end_date", "Employment End Date", "2026-01-08", "turn_3_message", 0.99),
                ],
            ),
            event(
                "student",
                "Uploading my 2024 return, layoff letter, and unemployment statement.",
                language="en",
                intent="upload_docs",
                sentiment="cooperative",
                document_links=[
                    {"doc_id": "FA002-D1", "file_link": "./01_2024_tax_return.pdf"},
                    {"doc_id": "FA002-D2", "file_link": "./02_corporate_layoff_letter.pdf"},
                    {"doc_id": "FA002-D3", "file_link": "./03_state_unemployment_statement.pdf"},
                ],
            ),
            event(
                "ai",
                "I verified job loss, checked the Loss of Employment box, and projected your new annual income at $22,152.",
                language="en",
                intent="autofill_financial_grid",
                sentiment="reassuring",
                form_updates=[
                    form_update(form_2, "loss_of_employment_checkbox", "Loss of Employment", True, "FA002-D2_parse", 0.97),
                    form_update(form_2, "projected_annual_income", "Projected 2026 Income", 22152, "FA002-D3_parse", 0.95),
                    form_update(form_2, "supporting_docs_complete", "Supporting Docs", "Complete", "doc_checklist", 1.0),
                ],
            ),
            event(
                "ai",
                "I drafted your personal statement in formal format and inserted it into the appeal packet. Please review and click Sign to submit.",
                language="en",
                intent="draft_statement_and_request_signature",
                sentiment="supportive",
                form_updates=[
                    form_update(
                        form_2,
                        "personal_statement",
                        "Personal Statement",
                        "Generated from chat: involuntary layoff, single parent, immediate income decline.",
                        "llm_summary",
                        0.91,
                    ),
                    form_update(form_2, "packet_status", "Packet Status", "Ready for signature", "workflow", 1.0),
                ],
                document_links=[{"doc_id": "FA002-D4", "file_link": "./04_professional_judgment_appeal_draft.pdf"}],
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-002",
            "profile": {
                "full_name": "Elena Rodriguez",
                "preferred_name": "Elena",
                "age": 35,
                "background_summary": "Single mother returning to school after corporate layoff.",
                "first_language": "English",
                "english_proficiency": "Fluent",
                "tech_savviness": "Medium",
                "financial_aid_literacy": "Low",
                "device_primary": "Laptop and mobile",
                "current_address": "5826 Maple Glen Ct, San Antonio, TX 78240",
                "enrollment_goal": "BS Supply Chain Management",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Independent with dependents",
                "sai_estimate": 14200,
                "reported_prior_year_income_usd": 75118,
                "current_year_income_usd": 22152,
                "household_size": 3,
                "selected_for": ["Income discrepancy review"],
                "risk_flags": ["income_shock", "childcare_pressure"],
            },
            "required_forms": ["Professional Judgment Appeal", "Income Reduction Worksheet"],
            "document_bundle": docs_2,
            "chat_conversation": chat_2,
            "conversation_outcome": {
                "status": "packet_prepared_pending_esign",
                "final_owner": "Student",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "Professional Judgment auto-fill and packet assembly",
                "heart_moment": "AI turns a high-stress life event into a nearly one-click appeal submission.",
            },
        }
    )

    # Applicant 3
    form_3 = "dependency_override_request_2026"
    docs_3 = [
        make_doc(
            "FA003-D1",
            "Utility_Bill",
            "City Electric Utility Bill",
            "01_utility_bill_current_address.pdf",
            "pdf",
            "student_upload",
            "Orlando Municipal Utilities",
            "2026-02-11",
            "statement_pdf",
            {
                "account_holder": "Carlos Mendoza",
                "service_address": "8810 Liberty View Dr Apt 5C, Orlando, FL 32821",
                "billing_period": "2026-01-10 to 2026-02-09",
                "amount_due": "$96.41",
            },
            [
                "Used to verify current independent residence.",
                "Address matches student profile.",
            ],
        ),
        make_doc(
            "FA003-D2",
            "Therapist_Letter_of_Support",
            "Clinical Support Letter - Family Estrangement",
            "02_therapist_support_letter.pdf",
            "pdf",
            "student_upload",
            "Sunrise Behavioral Health",
            "2026-02-14",
            "letter_pdf",
            {
                "student_name": "Carlos Mendoza",
                "author_name": "Dr. Naomi Ellis, LCSW",
                "author_phone": "407-555-0119",
                "relationship_to_student": "Treating therapist",
                "estrangement_duration": "5 years",
            },
            [
                "Letter affirms long-term estrangement from abusive parents.",
                "Recommends dependency override for student safety.",
            ],
        ),
        make_doc(
            "FA003-D3",
            "Landlord_Letter_of_Support",
            "Landlord Verification Letter",
            "03_landlord_support_letter.pdf",
            "pdf",
            "student_upload",
            "Vista Pines Apartments",
            "2026-02-16",
            "letter_pdf",
            {
                "tenant_name": "Carlos Mendoza",
                "landlord_name": "Miguel Alvarado",
                "landlord_phone": "321-555-0182",
                "lease_start": "2024-08-01",
                "notes": "No parental co-signer or family support",
            },
            [
                "Second third-party confirmation letter for override packet.",
                "Confirms independent tenancy and financial responsibility.",
            ],
        ),
        make_doc(
            "FA003-D4",
            "Dependency_Override_Draft_Form",
            "Dependency Override Request (Draft)",
            "04_dependency_override_draft.pdf",
            "pdf",
            "ai_generated",
            "The Uni Financial Aid Bot",
            "2026-03-02",
            "form_pdf",
            {
                "student_name": "Carlos Mendoza",
                "address": "8810 Liberty View Dr Apt 5C, Orlando, FL 32821",
                "reference_1": "Dr. Naomi Ellis, LCSW",
                "reference_2": "Miguel Alvarado, Landlord",
                "translated_statement": "Completed from Spanish interview",
                "status": "Ready for review",
            },
            [
                "Bot translated student's Spanish responses into formal English narrative.",
                "Reference contact fields auto-populated from uploaded letters.",
            ],
        ),
    ]
    chat_3 = timestamped_chat(
        10,
        18,
        [
            event(
                "student",
                "La FAFSA pide impuestos de mis padres, pero no hablo con ellos desde hace cinco anos.",
                language="es",
                intent="report_estrangement",
                sentiment="overwhelmed",
            ),
            event(
                "ai",
                "Lo siento mucho, Carlos. Podemos hacer una solicitud de Dependency Override. Ya abri el formulario. Primero, cual es tu direccion actual?",
                language="es",
                intent="start_override_form",
                sentiment="empathetic",
                form_updates=[
                    form_update(form_3, "student_name", "Student Name", "Carlos Mendoza", "student_profile", 0.99),
                    form_update(form_3, "language_preference", "Language Preference", "Spanish", "turn_1_message", 0.99),
                ],
            ),
            event(
                "student",
                "8810 Liberty View Dr Apt 5C, Orlando Florida 32821.",
                language="es",
                intent="provide_address",
                sentiment="anxious",
            ),
            event(
                "ai",
                "Gracias. Ya complete la seccion de informacion independiente. Ahora sube dos cartas de apoyo, por favor.",
                language="es",
                intent="collect_support_letters",
                sentiment="supportive",
                form_updates=[
                    form_update(form_3, "current_address", "Current Address", "8810 Liberty View Dr Apt 5C, Orlando, FL 32821", "turn_3_message", 0.99),
                ],
            ),
            event(
                "student",
                "Subidas: carta de mi terapeuta y carta de mi landlord, y utility bill.",
                language="es",
                intent="upload_docs",
                sentiment="cooperative",
                document_links=[
                    {"doc_id": "FA003-D1", "file_link": "./01_utility_bill_current_address.pdf"},
                    {"doc_id": "FA003-D2", "file_link": "./02_therapist_support_letter.pdf"},
                    {"doc_id": "FA003-D3", "file_link": "./03_landlord_support_letter.pdf"},
                ],
            ),
            event(
                "ai",
                "Excelente. Extraije los contactos de referencia y complete Letter of Support 1 y 2. Ahora te hare tres preguntas breves sobre como pagas tus gastos.",
                language="es",
                intent="parse_letters_and_continue",
                sentiment="encouraging",
                form_updates=[
                    form_update(form_3, "reference_1_name", "Reference 1 Name", "Dr. Naomi Ellis, LCSW", "FA003-D2_parse", 0.96),
                    form_update(form_3, "reference_1_phone", "Reference 1 Phone", "407-555-0119", "FA003-D2_parse", 0.95),
                    form_update(form_3, "reference_2_name", "Reference 2 Name", "Miguel Alvarado", "FA003-D3_parse", 0.96),
                    form_update(form_3, "reference_2_phone", "Reference 2 Phone", "321-555-0182", "FA003-D3_parse", 0.95),
                ],
            ),
            event(
                "student",
                "Trabajo en construccion por horas y pago renta y comida yo solo.",
                language="es",
                intent="provide_self_support_statement",
                sentiment="hopeful",
            ),
            event(
                "ai",
                "Listo. Traduje tu respuesta al ingles formal y complete la seccion Separation Details. Tu borrador esta listo para revision.",
                language="es",
                intent="finalize_draft",
                sentiment="supportive",
                form_updates=[
                    form_update(
                        form_3,
                        "separation_details",
                        "Separation Details",
                        "Student reports five-year estrangement, self-support through hourly construction work, and no parental contact.",
                        "turn_7_translation",
                        0.93,
                    ),
                    form_update(form_3, "packet_status", "Packet Status", "Ready for submission", "workflow", 1.0),
                ],
                document_links=[{"doc_id": "FA003-D4", "file_link": "./04_dependency_override_draft.pdf"}],
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-003",
            "profile": {
                "full_name": "Carlos Mendoza",
                "preferred_name": "Carlos",
                "age": 29,
                "background_summary": "Adult learner, Spanish-first speaker, no parental contact for five years.",
                "first_language": "Spanish",
                "english_proficiency": "Intermediate",
                "tech_savviness": "Low",
                "financial_aid_literacy": "Low",
                "device_primary": "Android smartphone",
                "current_address": "8810 Liberty View Dr Apt 5C, Orlando, FL 32821",
                "enrollment_goal": "AAS HVAC Technology",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Pending override",
                "sai_estimate": 6800,
                "reported_prior_year_income_usd": 19800,
                "current_year_income_usd": 22400,
                "household_size": 1,
                "selected_for": ["Dependency Override Documentation"],
                "risk_flags": ["language_barrier", "trauma_history"],
            },
            "required_forms": ["Dependency Override Request", "Independent Student Statement"],
            "document_bundle": docs_3,
            "chat_conversation": chat_3,
            "conversation_outcome": {
                "status": "draft_ready_for_office_review",
                "final_owner": "Financial Aid Office",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "Spanish-first dependency override auto-fill",
                "heart_moment": "AI removes language and jargon barriers while preserving trauma-informed process.",
            },
        }
    )

    # Applicant 4
    form_4 = "unusual_circumstances_appeal_2026"
    docs_4 = [
        make_doc(
            "FA004-D1",
            "Parent_Incarceration_Verification",
            "County Corrections Verification Letter",
            "01_parent_incarceration_verification_letter.pdf",
            "pdf",
            "student_upload",
            "Cook County Department of Corrections",
            "2026-02-25",
            "letter_pdf",
            {
                "incarcerated_parent": "Darnell Thompson",
                "booking_number": "CCDOC-883119",
                "custody_start": "2025-09-03",
                "expected_release": "2027-02-17",
            },
            [
                "Student cannot obtain parental FAFSA signatures while parent is incarcerated.",
                "Supports unusual circumstances dependency review.",
            ],
        ),
        make_doc(
            "FA004-D2",
            "School_Counselor_Support_Letter",
            "School Counselor Statement",
            "02_school_counselor_statement.pdf",
            "pdf",
            "student_upload",
            "Westview High School Counseling Office",
            "2026-02-26",
            "letter_pdf",
            {
                "student_name": "Nia Thompson",
                "counselor_name": "Rachel Kim, M.Ed.",
                "contact_phone": "773-555-0164",
                "statement_type": "Third-party support",
            },
            [
                "Counselor confirms ongoing independent support from grandmother.",
                "No financial contribution from either parent.",
            ],
        ),
        make_doc(
            "FA004-D3",
            "No_Contact_Affidavit_Photo",
            "No Contact Affidavit (Phone Photo)",
            "03_no_contact_affidavit_photo.webp",
            "webp",
            "student_upload",
            "Student Provided",
            "2026-03-02",
            "document_photo",
            {
                "student_name": "Nia Thompson",
                "affidavit_date": "2026-03-02",
                "declared_status": "No parental contact or support",
                "witness": "Grandmother - Laverne Thompson",
            },
            [
                "Signed document photographed in low light from bedroom desk.",
                "Includes handwritten witness confirmation.",
            ],
            ["2_degree_skew", "low_light", "scanner_noise"],
        ),
    ]
    chat_4 = timestamped_chat(
        11,
        6,
        [
            event(
                "student",
                "My mom is incarcerated and my dad is not in my life. FAFSA keeps asking for parent signatures.",
                language="en",
                intent="explain_unusual_circumstance",
                sentiment="stressed",
            ),
            event(
                "ai",
                "I can help you submit an Unusual Circumstances Appeal. I opened the form and entered your student details.",
                language="en",
                intent="open_form",
                sentiment="empathetic",
                form_updates=[
                    form_update(form_4, "student_name", "Student Name", "Nia Thompson", "student_profile", 0.99),
                    form_update(form_4, "appeal_reason", "Appeal Reason", "Parent incarceration and no contact", "turn_1_message", 0.97),
                ],
            ),
            event(
                "student",
                "I have a letter from county corrections and my counselor letter.",
                language="en",
                intent="confirm_docs",
                sentiment="anxious",
            ),
            event(
                "ai",
                "Great. Please upload both letters and any signed affidavit you have.",
                language="en",
                intent="collect_docs",
                sentiment="supportive",
            ),
            event(
                "student",
                "Uploaded all three.",
                language="en",
                intent="upload_docs",
                sentiment="cooperative",
                document_links=[
                    {"doc_id": "FA004-D1", "file_link": "./01_parent_incarceration_verification_letter.pdf"},
                    {"doc_id": "FA004-D2", "file_link": "./02_school_counselor_statement.pdf"},
                    {"doc_id": "FA004-D3", "file_link": "./03_no_contact_affidavit_photo.webp"},
                ],
            ),
            event(
                "ai",
                "I extracted all references and completed the documentation checklist. Your packet is queued for priority review.",
                language="en",
                intent="complete_checklist",
                sentiment="reassuring",
                form_updates=[
                    form_update(form_4, "third_party_letter_1", "Third-Party Letter 1", "County corrections verification", "FA004-D1_parse", 0.98),
                    form_update(form_4, "third_party_letter_2", "Third-Party Letter 2", "School counselor statement", "FA004-D2_parse", 0.98),
                    form_update(form_4, "signed_affidavit", "Signed Affidavit", "Uploaded", "FA004-D3_parse", 0.94),
                ],
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-004",
            "profile": {
                "full_name": "Nia Thompson",
                "preferred_name": "Nia",
                "age": 19,
                "background_summary": "Recent high-school graduate navigating aid without parental support.",
                "first_language": "English",
                "english_proficiency": "Fluent",
                "tech_savviness": "Medium",
                "financial_aid_literacy": "Low",
                "device_primary": "iPhone",
                "current_address": "2337 W Devon Ave Unit 1, Chicago, IL 60659",
                "enrollment_goal": "BA Psychology",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Dependent pending review",
                "sai_estimate": 5400,
                "reported_prior_year_income_usd": 0,
                "current_year_income_usd": 0,
                "household_size": 2,
                "selected_for": ["Unusual Circumstances Appeal"],
                "risk_flags": ["parental_signature_block", "first_year_student"],
            },
            "required_forms": ["Unusual Circumstances Appeal"],
            "document_bundle": docs_4,
            "chat_conversation": chat_4,
            "conversation_outcome": {
                "status": "submitted_for_review",
                "final_owner": "Financial Aid Appeals Team",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "No-parent-contact appeal flow",
                "heart_moment": "AI quickly packages third-party evidence so the student does not get stuck on signatures.",
            },
        }
    )

    # Applicant 5
    form_5 = "coa_adjustment_dependent_care_2026"
    docs_5 = [
        make_doc(
            "FA005-D1",
            "Daycare_Invoice",
            "Little Oaks Daycare Monthly Invoice",
            "01_daycare_invoice_summary.pdf",
            "pdf",
            "student_upload",
            "Little Oaks Childcare Center",
            "2026-02-28",
            "invoice_pdf",
            {
                "child_name": "Aman Singh",
                "monthly_care_cost": "$1,140",
                "care_schedule": "Mon-Fri 7:30 AM - 5:30 PM",
                "invoice_month": "February 2026",
            },
            [
                "Student requests COA increase due mandatory childcare cost while attending classes.",
                "Invoice is current and paid through ACH.",
            ],
        ),
        make_doc(
            "FA005-D2",
            "Spouse_Paystub_Photo",
            "Spouse Paystub (Phone Scan)",
            "02_spouse_paystub_photo.webp",
            "webp",
            "student_upload",
            "Metro Parcel Services",
            "2026-02-27",
            "document_photo",
            {
                "employee_name": "Kiran Singh",
                "gross_pay": "$1,845.12",
                "net_pay": "$1,392.40",
                "pay_period": "2026-02-10 to 2026-02-23",
            },
            [
                "Photo captured while folded; lower-right edge shadowed.",
                "Used for household cash-flow context.",
            ],
            ["2_degree_skew", "shadow_glare", "compression_noise"],
        ),
        make_doc(
            "FA005-D3",
            "Dependent_Care_Budget_Form",
            "Dependent Care Cost Adjustment Worksheet",
            "03_dependent_care_budget_form.pdf",
            "pdf",
            "ai_generated",
            "The Uni Financial Aid Bot",
            "2026-03-02",
            "form_pdf",
            {
                "student_name": "Harpreet Singh",
                "requested_coa_increase": "$13,680 annual",
                "supporting_invoice": "FA005-D1",
                "household_cashflow_note": "Included spouse pay data",
                "status": "Ready for signature",
            },
            [
                "Annualized childcare costs calculated from invoice.",
                "Form sections prefilled to reduce manual entry.",
            ],
        ),
    ]
    chat_5 = timestamped_chat(
        11,
        34,
        [
            event(
                "student",
                "I am married with a toddler and daycare is expensive. Is there a form for this?",
                language="en",
                intent="ask_coa_adjustment",
                sentiment="worried",
            ),
            event(
                "ai",
                "Yes. I opened the Dependent Care Cost Adjustment form. What is your monthly childcare bill?",
                language="en",
                intent="start_dependent_care_form",
                sentiment="supportive",
                form_updates=[
                    form_update(form_5, "student_name", "Student Name", "Harpreet Singh", "student_profile", 0.99),
                ],
            ),
            event(
                "student",
                "It is $1,140 per month.",
                language="en",
                intent="provide_cost",
                sentiment="anxious",
            ),
            event(
                "ai",
                "I entered that and projected $13,680 annual dependent-care expenses. Please upload your daycare invoice.",
                language="en",
                intent="autofill_and_collect_docs",
                sentiment="reassuring",
                form_updates=[
                    form_update(form_5, "monthly_childcare_cost", "Monthly Childcare Cost", 1140, "turn_3_message", 0.99),
                    form_update(form_5, "annual_childcare_cost", "Annual Childcare Cost", 13680, "computed", 1.0),
                ],
            ),
            event(
                "student",
                "Uploaded daycare invoice and spouse paystub photo.",
                language="en",
                intent="upload_docs",
                sentiment="cooperative",
                document_links=[
                    {"doc_id": "FA005-D1", "file_link": "./01_daycare_invoice_summary.pdf"},
                    {"doc_id": "FA005-D2", "file_link": "./02_spouse_paystub_photo.webp"},
                ],
            ),
            event(
                "ai",
                "Everything is parsed and placed into your worksheet. Please review and sign.",
                language="en",
                intent="complete_form",
                sentiment="encouraging",
                form_updates=[
                    form_update(form_5, "supporting_docs", "Supporting Docs", "Invoice + paystub received", "doc_checklist", 1.0),
                    form_update(form_5, "status", "Status", "Ready for signature", "workflow", 1.0),
                ],
                document_links=[{"doc_id": "FA005-D3", "file_link": "./03_dependent_care_budget_form.pdf"}],
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-005",
            "profile": {
                "full_name": "Harpreet Singh",
                "preferred_name": "Harpreet",
                "age": 28,
                "background_summary": "Working parent balancing coursework and childcare costs.",
                "first_language": "Punjabi",
                "english_proficiency": "Advanced",
                "tech_savviness": "Medium",
                "financial_aid_literacy": "Medium",
                "device_primary": "Android smartphone",
                "current_address": "917 Pine Crossing Rd, Tacoma, WA 98405",
                "enrollment_goal": "BS Information Systems",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Independent married",
                "sai_estimate": 3100,
                "reported_prior_year_income_usd": 41200,
                "current_year_income_usd": 43800,
                "household_size": 3,
                "selected_for": ["COA Adjustment Review"],
                "risk_flags": ["childcare_cost_burden"],
            },
            "required_forms": ["Dependent Care Cost Adjustment Worksheet"],
            "document_bundle": docs_5,
            "chat_conversation": chat_5,
            "conversation_outcome": {
                "status": "ready_for_signature",
                "final_owner": "Student",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "Childcare COA adjustment automation",
                "heart_moment": "AI converts a monthly invoice into a complete annual budget appeal in minutes.",
            },
        }
    )

    # Applicant 6
    form_6 = "benefit_coordination_form_2026"
    docs_6 = [
        make_doc(
            "FA006-D1",
            "DD214_Summary",
            "DD214 Member-4 Summary (Redacted)",
            "01_dd214_member4_redacted.pdf",
            "pdf",
            "student_upload",
            "Department of Defense",
            "2024-09-19",
            "service_pdf",
            {
                "veteran_name": "Lena Yazzie",
                "branch": "US Army",
                "service_dates": "2017-03-12 to 2024-09-19",
                "character_of_service": "Honorable",
                "education_benefit_eligibility": "Post-9/11 GI Bill",
            },
            [
                "Used for federal veteran benefit verification and overlap checks.",
            ],
        ),
        make_doc(
            "FA006-D2",
            "VA_Certificate_of_Eligibility",
            "VA Education Certificate of Eligibility",
            "02_va_certificate_of_eligibility.pdf",
            "pdf",
            "student_upload",
            "US Department of Veterans Affairs",
            "2026-01-21",
            "benefits_pdf",
            {
                "beneficiary_name": "Lena Yazzie",
                "benefit_chapter": "Chapter 33",
                "percentage_eligibility": "80%",
                "remaining_entitlement_months": "24",
            },
            [
                "Confirms tuition and housing benefit percentages for coordination with federal aid.",
            ],
        ),
        make_doc(
            "FA006-D3",
            "Tribal_Residency_Affidavit",
            "Tribal Residency Affidavit",
            "03_tribal_residency_affidavit.pdf",
            "pdf",
            "student_upload",
            "Navajo Nation Records Office",
            "2026-02-18",
            "affidavit_pdf",
            {
                "student_name": "Lena Yazzie",
                "community": "Window Rock Agency",
                "in_state_tuition_eligibility": "Confirmed",
                "affidavit_id": "NNR-26-4491",
            },
            [
                "Supports resident tuition treatment and lower net cost calculations.",
            ],
        ),
    ]
    chat_6 = timestamped_chat(
        12,
        2,
        [
            event(
                "student",
                "I have GI Bill benefits. I do not want to lose Pell Grant because of it.",
                language="en",
                intent="benefit_coordination_question",
                sentiment="concerned",
            ),
            event(
                "ai",
                "I can coordinate both. I opened the Benefit Coordination form and entered your veteran profile.",
                language="en",
                intent="open_benefit_form",
                sentiment="reassuring",
                form_updates=[
                    form_update(form_6, "student_name", "Student Name", "Lena Yazzie", "student_profile", 0.99),
                    form_update(form_6, "veteran_status", "Veteran Status", "Yes", "student_profile", 0.99),
                ],
            ),
            event(
                "student",
                "Uploading DD214 and VA certificate now.",
                language="en",
                intent="upload_docs",
                sentiment="cooperative",
                document_links=[
                    {"doc_id": "FA006-D1", "file_link": "./01_dd214_member4_redacted.pdf"},
                    {"doc_id": "FA006-D2", "file_link": "./02_va_certificate_of_eligibility.pdf"},
                    {"doc_id": "FA006-D3", "file_link": "./03_tribal_residency_affidavit.pdf"},
                ],
            ),
            event(
                "ai",
                "I mapped your Chapter 33 eligibility (80%) and confirmed resident tuition status from your affidavit.",
                language="en",
                intent="autofill_benefit_sections",
                sentiment="supportive",
                form_updates=[
                    form_update(form_6, "gi_bill_chapter", "GI Bill Chapter", "Chapter 33", "FA006-D2_parse", 0.98),
                    form_update(form_6, "benefit_percent", "Benefit Percent", "80%", "FA006-D2_parse", 0.98),
                    form_update(form_6, "resident_tuition", "Resident Tuition", "Yes", "FA006-D3_parse", 0.96),
                ],
            ),
            event(
                "ai",
                "Your Pell eligibility remains in place; this form is now complete and ready for office validation.",
                language="en",
                intent="close_and_confirm",
                sentiment="calm",
                metadata={"policy_note": "VA education benefits coordinated separately from federal need formula."},
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-006",
            "profile": {
                "full_name": "Lena Yazzie",
                "preferred_name": "Lena",
                "age": 31,
                "background_summary": "Army veteran and tribal community member returning for cybersecurity training.",
                "first_language": "English",
                "english_proficiency": "Fluent",
                "tech_savviness": "High",
                "financial_aid_literacy": "Medium",
                "device_primary": "Laptop",
                "current_address": "14210 Brookfield Loop Apt 412, Irving, TX 75063",
                "enrollment_goal": "BS Cybersecurity",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Independent",
                "sai_estimate": -450,
                "reported_prior_year_income_usd": 28800,
                "current_year_income_usd": 30200,
                "household_size": 2,
                "selected_for": ["Veteran Benefit Coordination"],
                "risk_flags": ["benefit_overlap_confusion"],
            },
            "required_forms": ["Benefit Coordination Form"],
            "document_bundle": docs_6,
            "chat_conversation": chat_6,
            "conversation_outcome": {
                "status": "ready_for_validation",
                "final_owner": "Veteran Services + Financial Aid",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "VA + Pell coordination",
                "heart_moment": "AI removes fear of benefit conflicts by mapping military docs directly into aid fields.",
            },
        }
    )

    # Applicant 7
    form_7 = "state_dream_act_support_packet_2026"
    docs_7 = [
        make_doc(
            "FA007-D1",
            "EAD_Card_Phone_Photo",
            "Employment Authorization Card (Phone Photo)",
            "01_ead_card_mobile_photo.webp",
            "webp",
            "student_upload",
            "USCIS",
            "2025-10-03",
            "ead_card_photo",
            {
                "full_name": "Minh Tran",
                "id_number": "A219-882-410",
                "dob": "2005-07-21",
                "expiration": "2027-10-03",
                "citizenship_status": "DACA recipient",
            },
            [
                "Card photo taken under fluorescent lighting in cafeteria.",
            ],
            ["2_degree_skew", "shadow_glare", "compression_noise"],
        ),
        make_doc(
            "FA007-D2",
            "State_Dream_Act_Confirmation",
            "California Dream Act Application Confirmation",
            "02_state_dream_act_confirmation.pdf",
            "pdf",
            "student_upload",
            "California Student Aid Commission",
            "2026-02-07",
            "confirmation_pdf",
            {
                "applicant_name": "Minh Tran",
                "cadAA_id": "CADAA-2026-550922",
                "application_status": "Submitted",
                "submission_date": "2026-02-07",
            },
            [
                "State aid pathway active; federal FAFSA not primary path.",
            ],
        ),
        make_doc(
            "FA007-D3",
            "Parent_Income_Affidavit",
            "Parent Cash Income Affidavit",
            "03_parent_income_affidavit.pdf",
            "pdf",
            "student_upload",
            "Student Family Declaration",
            "2026-02-10",
            "affidavit_pdf",
            {
                "parent_name": "Lan Tran",
                "annual_cash_income": "$27,400",
                "income_source": "Nail salon cash wages",
                "notarized": "Yes",
            },
            [
                "Affidavit used for state grant eligibility when formal tax docs unavailable.",
            ],
        ),
    ]
    chat_7 = timestamped_chat(
        12,
        28,
        [
            event(
                "student",
                "I have DACA and I am confused if I should fill FAFSA or Dream Act form.",
                language="en",
                intent="eligibility_question",
                sentiment="confused",
            ),
            event(
                "ai",
                "For your status, we should use the California Dream Act flow. I opened the state aid support packet.",
                language="en",
                intent="route_to_state_aid",
                sentiment="supportive",
                form_updates=[
                    form_update(form_7, "aid_pathway", "Aid Pathway", "California Dream Act", "eligibility_rules", 1.0),
                    form_update(form_7, "student_name", "Student Name", "Minh Tran", "student_profile", 0.99),
                ],
            ),
            event(
                "student",
                "I uploaded my work permit card and Dream Act confirmation.",
                language="en",
                intent="upload_docs",
                sentiment="relieved",
                document_links=[
                    {"doc_id": "FA007-D1", "file_link": "./01_ead_card_mobile_photo.webp"},
                    {"doc_id": "FA007-D2", "file_link": "./02_state_dream_act_confirmation.pdf"},
                    {"doc_id": "FA007-D3", "file_link": "./03_parent_income_affidavit.pdf"},
                ],
            ),
            event(
                "ai",
                "I extracted your CADAA ID and permit expiration date, and attached your parent income affidavit for state grant review.",
                language="en",
                intent="autofill_state_fields",
                sentiment="encouraging",
                form_updates=[
                    form_update(form_7, "cadaa_id", "CADAA ID", "CADAA-2026-550922", "FA007-D2_parse", 0.99),
                    form_update(form_7, "ead_expiration", "EAD Expiration", "2027-10-03", "FA007-D1_parse", 0.94),
                    form_update(form_7, "parent_income", "Parent Income", 27400, "FA007-D3_parse", 0.95),
                ],
            ),
            event(
                "student",
                "Thank you. This is easier than I thought.",
                language="en",
                intent="acknowledge_help",
                sentiment="relieved",
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-007",
            "profile": {
                "full_name": "Minh Tran",
                "preferred_name": "Minh",
                "age": 20,
                "background_summary": "DACA student navigating state-aid alternatives to FAFSA.",
                "first_language": "Vietnamese",
                "english_proficiency": "Advanced",
                "tech_savviness": "Medium",
                "financial_aid_literacy": "Low",
                "device_primary": "iPhone",
                "current_address": "4418 Senter Rd Unit 18, San Jose, CA 95111",
                "enrollment_goal": "BS Nursing",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Dependent",
                "sai_estimate": None,
                "reported_prior_year_income_usd": 27400,
                "current_year_income_usd": 28900,
                "household_size": 4,
                "selected_for": ["State Dream Act Verification"],
                "risk_flags": ["federal_eligibility_confusion"],
            },
            "required_forms": ["State Aid Support Packet"],
            "document_bundle": docs_7,
            "chat_conversation": chat_7,
            "conversation_outcome": {
                "status": "state_packet_complete",
                "final_owner": "State Aid Processing Team",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "DACA state-aid routing",
                "heart_moment": "AI chooses the correct aid pathway and avoids dead-end FAFSA steps.",
            },
        }
    )

    # Applicant 8
    form_8 = "independent_status_housing_grant_2026"
    docs_8 = [
        make_doc(
            "FA008-D1",
            "Foster_Youth_Status_Letter",
            "County Foster Youth Status Verification",
            "01_foster_youth_status_letter.pdf",
            "pdf",
            "student_upload",
            "Franklin County Youth Services",
            "2026-01-30",
            "verification_pdf",
            {
                "student_name": "Noah Williams",
                "status": "Former foster youth",
                "case_end_date": "2024-11-12",
                "case_worker": "Mira Collins",
            },
            [
                "Supports independent status determination under federal aid rules.",
            ],
        ),
        make_doc(
            "FA008-D2",
            "Homeless_Liaison_Letter",
            "McKinney-Vento Liaison Determination",
            "02_homeless_liaison_determination.pdf",
            "pdf",
            "student_upload",
            "Columbus Public Schools Student Services",
            "2026-02-22",
            "letter_pdf",
            {
                "student_name": "Noah Williams",
                "determination": "Unaccompanied homeless youth",
                "effective_term": "Spring 2026",
                "liaison_name": "Patricia Gomez",
            },
            [
                "Enables independent filing and emergency housing aid consideration.",
            ],
        ),
        make_doc(
            "FA008-D3",
            "Lease_Termination_Notice",
            "Lease Termination Notice",
            "03_lease_termination_notice.pdf",
            "pdf",
            "student_upload",
            "Rivergate Apartments",
            "2026-02-18",
            "notice_pdf",
            {
                "tenant_name": "Noah Williams",
                "termination_date": "2026-03-01",
                "reason": "Non-renewal due roommate departure",
                "balance_due": "$0",
            },
            [
                "Shows immediate housing instability and need for emergency housing grant.",
            ],
        ),
    ]
    chat_8 = timestamped_chat(
        12,
        52,
        [
            event(
                "student",
                "I might lose housing this week. I am scared I will have to stop school.",
                language="en",
                intent="crisis_disclosure",
                sentiment="high_stress",
            ),
            event(
                "ai",
                "I am here with you. I opened the Independent Status + Housing Grant form and marked this as urgent.",
                language="en",
                intent="stabilize_and_start",
                sentiment="empathetic",
                form_updates=[
                    form_update(form_8, "student_name", "Student Name", "Noah Williams", "student_profile", 0.99),
                    form_update(form_8, "urgent_flag", "Urgent Flag", True, "sentiment_engine", 0.96),
                ],
            ),
            event(
                "student",
                "Uploading foster letter, school liaison letter, and lease termination.",
                language="en",
                intent="upload_docs",
                sentiment="anxious",
                document_links=[
                    {"doc_id": "FA008-D1", "file_link": "./01_foster_youth_status_letter.pdf"},
                    {"doc_id": "FA008-D2", "file_link": "./02_homeless_liaison_determination.pdf"},
                    {"doc_id": "FA008-D3", "file_link": "./03_lease_termination_notice.pdf"},
                ],
            ),
            event(
                "ai",
                "I verified independent status evidence and filled your emergency housing request section.",
                language="en",
                intent="autofill_housing_fields",
                sentiment="calm",
                form_updates=[
                    form_update(form_8, "independent_status_basis", "Independent Status Basis", "Former foster youth + homeless liaison determination", "doc_parse", 0.98),
                    form_update(form_8, "housing_insecurity_date", "Housing Insecurity Date", "2026-03-01", "FA008-D3_parse", 0.94),
                    form_update(form_8, "emergency_grant_requested", "Emergency Grant Requested", "$1,500", "policy_default", 0.9),
                ],
            ),
            event(
                "ai",
                "A same-day advisor review was requested. You will not lose enrollment while this is being processed.",
                language="en",
                intent="assure_and_route",
                sentiment="reassuring",
                metadata={"advisor_queue": "Emergency Aid Team", "sla": "same_day"},
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-008",
            "profile": {
                "full_name": "Noah Williams",
                "preferred_name": "Noah",
                "age": 22,
                "background_summary": "Former foster youth with sudden housing instability mid-term.",
                "first_language": "English",
                "english_proficiency": "Fluent",
                "tech_savviness": "Low",
                "financial_aid_literacy": "Low",
                "device_primary": "Android smartphone",
                "current_address": "118 Rosewood Court, Columbus, OH 43215",
                "enrollment_goal": "AAS Health Information Technology",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Independent",
                "sai_estimate": -1500,
                "reported_prior_year_income_usd": 6400,
                "current_year_income_usd": 7900,
                "household_size": 1,
                "selected_for": ["Independent Status Confirmation", "Emergency Housing Grant"],
                "risk_flags": ["housing_insecurity", "enrollment_dropout_risk"],
            },
            "required_forms": ["Independent Status Form", "Emergency Housing Grant Request"],
            "document_bundle": docs_8,
            "chat_conversation": chat_8,
            "conversation_outcome": {
                "status": "escalated_priority_review",
                "final_owner": "Emergency Aid Team",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "Emergency housing stabilization",
                "heart_moment": "AI prioritizes immediate risk and auto-prepares grant paperwork in one session.",
            },
        }
    )

    # Applicant 9
    form_9 = "special_circumstances_income_adjustment_2026"
    docs_9 = [
        make_doc(
            "FA009-D1",
            "Divorce_Decree_Excerpt",
            "Divorce Decree Excerpt",
            "01_divorce_decree_excerpt.pdf",
            "pdf",
            "student_upload",
            "Philadelphia County Family Court",
            "2025-10-12",
            "court_pdf",
            {
                "student_name": "Sofia Petrova",
                "case_number": "FC-25-118302",
                "status": "Divorce finalized",
                "custody": "Shared custody - 1 dependent",
            },
            [
                "Used to validate marital status and household composition changes.",
            ],
        ),
        make_doc(
            "FA009-D2",
            "Child_Support_Paid_Statement",
            "Child Support Paid Statement",
            "02_child_support_paid_statement.pdf",
            "pdf",
            "student_upload",
            "PA Department of Human Services",
            "2026-02-19",
            "statement_pdf",
            {
                "payer_name": "Sofia Petrova",
                "annual_support_paid": "$4,800",
                "beneficiary": "Mila Petrova",
                "reporting_year": "2025",
            },
            [
                "Reported child support paid can affect aid calculation fields.",
            ],
        ),
        make_doc(
            "FA009-D3",
            "Medical_Debt_Statement",
            "Hospital Medical Debt Statement",
            "03_medical_debt_statement.pdf",
            "pdf",
            "student_upload",
            "Mercy General Hospital Billing",
            "2026-01-26",
            "statement_pdf",
            {
                "patient_name": "Mila Petrova",
                "outstanding_balance": "$9,432",
                "monthly_payment": "$260",
                "financial_hardship_plan": "Active",
            },
            [
                "Student requests special-circumstances review due ongoing mandatory medical payments.",
            ],
        ),
    ]
    chat_9 = timestamped_chat(
        13,
        18,
        [
            event(
                "student",
                "I am divorced now and paying child support plus medical bills. FAFSA numbers do not reflect this.",
                language="en",
                intent="special_circumstance_request",
                sentiment="concerned",
            ),
            event(
                "ai",
                "I opened the Special Circumstances Income Adjustment form. I can prefill your household change section.",
                language="en",
                intent="open_adjustment_form",
                sentiment="supportive",
                form_updates=[
                    form_update(form_9, "student_name", "Student Name", "Sofia Petrova", "student_profile", 0.99),
                    form_update(form_9, "marital_status", "Marital Status", "Divorced", "turn_1_message", 0.95),
                ],
            ),
            event(
                "student",
                "Uploading divorce decree, child support statement, and medical debt bill.",
                language="en",
                intent="upload_docs",
                sentiment="cooperative",
                document_links=[
                    {"doc_id": "FA009-D1", "file_link": "./01_divorce_decree_excerpt.pdf"},
                    {"doc_id": "FA009-D2", "file_link": "./02_child_support_paid_statement.pdf"},
                    {"doc_id": "FA009-D3", "file_link": "./03_medical_debt_statement.pdf"},
                ],
            ),
            event(
                "ai",
                "I extracted $4,800 child support paid and $9,432 medical debt with a $260 monthly payment plan.",
                language="en",
                intent="autofill_expense_fields",
                sentiment="reassuring",
                form_updates=[
                    form_update(form_9, "child_support_paid", "Child Support Paid", 4800, "FA009-D2_parse", 0.97),
                    form_update(form_9, "medical_debt_balance", "Medical Debt Balance", 9432, "FA009-D3_parse", 0.96),
                    form_update(form_9, "monthly_medical_payment", "Monthly Medical Payment", 260, "FA009-D3_parse", 0.96),
                ],
            ),
            event(
                "ai",
                "Your adjustment form is complete and ready for submission with supporting docs attached.",
                language="en",
                intent="complete_form",
                sentiment="calm",
                form_updates=[form_update(form_9, "status", "Status", "Ready for submission", "workflow", 1.0)],
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-009",
            "profile": {
                "full_name": "Sofia Petrova",
                "preferred_name": "Sofia",
                "age": 33,
                "background_summary": "Divorced parent returning to school while carrying family medical debt.",
                "first_language": "Bulgarian",
                "english_proficiency": "Advanced",
                "tech_savviness": "Medium",
                "financial_aid_literacy": "Medium",
                "device_primary": "Laptop",
                "current_address": "3907 Belmont Rd Apt 2A, Philadelphia, PA 19104",
                "enrollment_goal": "BS Public Health",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Independent with dependent child",
                "sai_estimate": 5400,
                "reported_prior_year_income_usd": 38700,
                "current_year_income_usd": 30100,
                "household_size": 2,
                "selected_for": ["Special Circumstances Review"],
                "risk_flags": ["household_change", "medical_financial_strain"],
            },
            "required_forms": ["Special Circumstances Income Adjustment"],
            "document_bundle": docs_9,
            "chat_conversation": chat_9,
            "conversation_outcome": {
                "status": "ready_for_submission",
                "final_owner": "Student",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "Household-change recalc with expense extraction",
                "heart_moment": "AI converts legal and billing documents into usable aid adjustment data.",
            },
        }
    )

    # Applicant 10
    form_10 = "citizenship_status_correction_2026"
    docs_10 = [
        make_doc(
            "FA010-D1",
            "Certificate_of_Naturalization",
            "Certificate of Naturalization",
            "01_certificate_of_naturalization.pdf",
            "pdf",
            "student_upload",
            "USCIS",
            "2025-12-02",
            "certificate_pdf",
            {
                "student_name": "Jean Baptiste",
                "certificate_number": "N-4429187",
                "country_of_birth": "Haiti",
                "naturalization_date": "2025-12-02",
            },
            [
                "Used to update citizenship status from non-eligible to eligible for federal aid.",
            ],
        ),
        make_doc(
            "FA010-D2",
            "Selective_Service_Status_Letter",
            "Selective Service Status Information Letter",
            "02_selective_service_status_letter.pdf",
            "pdf",
            "student_upload",
            "Selective Service System",
            "2026-01-15",
            "letter_pdf",
            {
                "registrant_name": "Jean Baptiste",
                "registration_number": "S-925004137",
                "status": "Registered",
                "registration_date": "2024-08-11",
            },
            [
                "Documentation included to clear federal eligibility checklist.",
            ],
        ),
        make_doc(
            "FA010-D3",
            "Tax_Return_Translation_Summary",
            "Tax Return Translation Summary",
            "03_tax_return_translation_summary.pdf",
            "pdf",
            "student_upload",
            "Community Translation Network",
            "2026-02-03",
            "summary_pdf",
            {
                "taxpayer_name": "Jean Baptiste",
                "translated_from": "French/Creole",
                "agi_equivalent": "$19,760",
                "notes": "Certified translation",
            },
            [
                "Helps student understand and correctly enter income values in FAFSA fields.",
            ],
        ),
    ]
    chat_10 = timestamped_chat(
        13,
        46,
        [
            event(
                "student",
                "Mwen pa twop pale angle. FAFSA says I am not eligible but I became a citizen last year.",
                language="ht",
                intent="citizenship_issue",
                sentiment="confused",
            ),
            event(
                "ai",
                "Mesi Jean. I can help. I opened the Citizenship Status Correction form and can fill it step by step.",
                language="en",
                intent="start_citizenship_form",
                sentiment="supportive",
                form_updates=[
                    form_update(form_10, "student_name", "Student Name", "Jean Baptiste", "student_profile", 0.99),
                    form_update(form_10, "language_assistance", "Language Assistance", "Haitian Creole requested", "turn_1_message", 0.97),
                ],
            ),
            event(
                "student",
                "Uploading naturalization certificate, selective service letter, and tax translation.",
                language="en",
                intent="upload_docs",
                sentiment="cooperative",
                document_links=[
                    {"doc_id": "FA010-D1", "file_link": "./01_certificate_of_naturalization.pdf"},
                    {"doc_id": "FA010-D2", "file_link": "./02_selective_service_status_letter.pdf"},
                    {"doc_id": "FA010-D3", "file_link": "./03_tax_return_translation_summary.pdf"},
                ],
            ),
            event(
                "ai",
                "I updated your citizenship field to US Citizen, added your registration number, and mapped AGI to $19,760.",
                language="en",
                intent="autofill_eligibility_fields",
                sentiment="reassuring",
                form_updates=[
                    form_update(form_10, "citizenship_status", "Citizenship Status", "US Citizen", "FA010-D1_parse", 0.99),
                    form_update(form_10, "selective_service_number", "Selective Service Number", "S-925004137", "FA010-D2_parse", 0.98),
                    form_update(form_10, "agi", "AGI", 19760, "FA010-D3_parse", 0.95),
                ],
            ),
            event(
                "ai",
                "Form complete. I also saved a plain-language summary in English and Haitian Creole for your review.",
                language="en",
                intent="finalize_with_translation",
                sentiment="encouraging",
                metadata={"translation_mode": "bi-lingual summary generated"},
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-010",
            "profile": {
                "full_name": "Jean Baptiste",
                "preferred_name": "Jean",
                "age": 24,
                "background_summary": "Recent naturalized citizen with limited English confidence.",
                "first_language": "Haitian Creole",
                "english_proficiency": "Intermediate",
                "tech_savviness": "Low",
                "financial_aid_literacy": "Low",
                "device_primary": "Android smartphone",
                "current_address": "66 Waverly Terrace Apt 1, Baltimore, MD 21217",
                "enrollment_goal": "AAS Medical Assisting",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Independent",
                "sai_estimate": -620,
                "reported_prior_year_income_usd": 19760,
                "current_year_income_usd": 20840,
                "household_size": 1,
                "selected_for": ["Citizenship Status Correction"],
                "risk_flags": ["language_barrier", "eligibility_misclassification"],
            },
            "required_forms": ["Citizenship Status Correction Form"],
            "document_bundle": docs_10,
            "chat_conversation": chat_10,
            "conversation_outcome": {
                "status": "eligibility_status_corrected",
                "final_owner": "Financial Aid Eligibility Team",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "Eligibility correction with language support",
                "heart_moment": "AI handles both compliance fields and language translation in one workflow.",
            },
        }
    )

    # Applicant 11
    form_11 = "consortium_and_benefit_coordination_2026"
    docs_11 = [
        make_doc(
            "FA011-D1",
            "Military_PCS_Orders",
            "Spouse PCS Orders (Excerpt)",
            "01_spouse_pcs_orders.pdf",
            "pdf",
            "student_upload",
            "Department of the Air Force",
            "2026-02-02",
            "orders_pdf",
            {
                "service_member": "Omar Al-Khalil",
                "dependent_spouse": "Fatima Al-Khalil",
                "pcs_location": "Colorado Springs, CO",
                "effective_date": "2026-05-01",
            },
            [
                "Student requests remote consortium accommodations due relocation orders.",
            ],
        ),
        make_doc(
            "FA011-D2",
            "Chapter35_Eligibility_Letter",
            "DEA Chapter 35 Eligibility Letter",
            "02_chapter35_eligibility_letter.pdf",
            "pdf",
            "student_upload",
            "US Department of Veterans Affairs",
            "2026-01-19",
            "benefits_pdf",
            {
                "beneficiary_name": "Fatima Al-Khalil",
                "benefit_type": "Chapter 35 DEA",
                "monthly_benefit": "$1,536",
                "eligibility_window": "2026-01 to 2030-01",
            },
            [
                "Used to coordinate institutional aid packaging with VA educational assistance.",
            ],
        ),
        make_doc(
            "FA011-D3",
            "Current_Tuition_Statement",
            "Current Term Tuition and Fee Statement",
            "03_current_term_tuition_statement.pdf",
            "pdf",
            "student_upload",
            "The Uni Bursar Office",
            "2026-02-24",
            "billing_pdf",
            {
                "student_name": "Fatima Al-Khalil",
                "tuition_charges": "$7,880",
                "fees": "$620",
                "balance_after_grants": "$2,190",
            },
            [
                "Provides net balance used in consortium and payment-planning sections.",
            ],
        ),
    ]
    chat_11 = timestamped_chat(
        14,
        8,
        [
            event(
                "student",
                "My spouse has PCS orders and I also have Chapter 35 benefits. Can I keep my aid package stable?",
                language="en",
                intent="consortium_question",
                sentiment="concerned",
            ),
            event(
                "ai",
                "Yes. I opened the Consortium and Benefit Coordination form and added your base enrollment details.",
                language="en",
                intent="start_consortium_form",
                sentiment="supportive",
                form_updates=[
                    form_update(form_11, "student_name", "Student Name", "Fatima Al-Khalil", "student_profile", 0.99),
                    form_update(form_11, "coordination_needed", "Coordination Needed", "Consortium + Chapter 35", "turn_1_message", 0.98),
                ],
            ),
            event(
                "student",
                "Uploading PCS orders, VA letter, and tuition statement.",
                language="en",
                intent="upload_docs",
                sentiment="cooperative",
                document_links=[
                    {"doc_id": "FA011-D1", "file_link": "./01_spouse_pcs_orders.pdf"},
                    {"doc_id": "FA011-D2", "file_link": "./02_chapter35_eligibility_letter.pdf"},
                    {"doc_id": "FA011-D3", "file_link": "./03_current_term_tuition_statement.pdf"},
                ],
            ),
            event(
                "ai",
                "I filled relocation date, Chapter 35 monthly benefit, and your current net balance.",
                language="en",
                intent="autofill_consortium_fields",
                sentiment="reassuring",
                form_updates=[
                    form_update(form_11, "pcs_effective_date", "PCS Effective Date", "2026-05-01", "FA011-D1_parse", 0.99),
                    form_update(form_11, "chapter35_monthly", "Chapter 35 Monthly Benefit", 1536, "FA011-D2_parse", 0.98),
                    form_update(form_11, "net_balance", "Current Net Balance", 2190, "FA011-D3_parse", 0.97),
                ],
            ),
            event(
                "ai",
                "Your form is complete and queued for consortium coordinator approval.",
                language="en",
                intent="submit_for_coordination",
                sentiment="calm",
                metadata={"queue": "Consortium Coordinator", "expected_review_days": 3},
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-011",
            "profile": {
                "full_name": "Fatima Al-Khalil",
                "preferred_name": "Fatima",
                "age": 27,
                "background_summary": "Military spouse managing relocation while finishing degree.",
                "first_language": "Arabic",
                "english_proficiency": "Advanced",
                "tech_savviness": "High",
                "financial_aid_literacy": "Medium",
                "device_primary": "Laptop",
                "current_address": "7702 Alpenglow St, Colorado Springs, CO 80918",
                "enrollment_goal": "BS Data Analytics",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Independent married",
                "sai_estimate": 2400,
                "reported_prior_year_income_usd": 24600,
                "current_year_income_usd": 25900,
                "household_size": 2,
                "selected_for": ["Consortium Coordination", "VA Benefit Coordination"],
                "risk_flags": ["midyear_relocation"],
            },
            "required_forms": ["Consortium Agreement and Benefit Coordination Form"],
            "document_bundle": docs_11,
            "chat_conversation": chat_11,
            "conversation_outcome": {
                "status": "submitted_for_coordinator_review",
                "final_owner": "Consortium Coordinator",
                "completion_percent": 100,
            },
            "demo_hook": {
                "title": "Military-family relocation support",
                "heart_moment": "AI combines relocation, VA benefits, and billing data into one coherent packet.",
            },
        }
    )

    # Applicant 12
    form_12 = "v1_verification_income_reconciliation_2026"
    docs_12 = [
        make_doc(
            "FA012-D1",
            "IRS_Non_Filing_Letter",
            "IRS Verification of Non-Filing Letter",
            "01_parent_non_filing_letter.pdf",
            "pdf",
            "student_upload",
            "Internal Revenue Service",
            "2026-02-12",
            "verification_pdf",
            {
                "taxpayer_name": "Darius Simmons",
                "tax_year": "2024",
                "status": "No return filed",
                "irs_tracking_number": "NF-771203-99",
            },
            [
                "Used in V1 verification for parent non-filer status.",
            ],
        ),
        make_doc(
            "FA012-D2",
            "Parent_Cash_Ledger_Photo",
            "Parent Handwritten Business Ledger (Phone Photo)",
            "02_parent_cash_ledger_photo.webp",
            "webp",
            "student_upload",
            "Student Family Record",
            "2026-03-01",
            "ledger_photo",
            {
                "owner_name": "Darius Simmons",
                "business_type": "Lawn service",
                "monthly_cash_entries": "Varies $800-$2,100",
                "estimated_annual_net": "$18,900",
            },
            [
                "Notebook photo with uneven lighting and partial corner crop.",
                "Amounts conflict with prior FAFSA estimate.",
            ],
            ["2_degree_skew", "blurry", "low_light", "compression_noise"],
        ),
        make_doc(
            "FA012-D3",
            "Income_Verification_Worksheet",
            "Income Verification Worksheet (Partially Completed)",
            "03_income_verification_worksheet_partial.pdf",
            "pdf",
            "student_upload",
            "The Uni Financial Aid Office",
            "2026-02-28",
            "form_pdf",
            {
                "student_name": "Andre Simmons",
                "parent_non_filer": "Checked",
                "parent_income_reported": "$12,000",
                "missing_fields": "Business net income detail",
            },
            [
                "Student entered preliminary values manually before chat.",
                "Bot must reconcile conflicting numbers with ledger evidence.",
            ],
        ),
        make_doc(
            "FA012-D4",
            "Advisor_Handoff_Note",
            "Income Discrepancy Handoff Note",
            "04_income_discrepancy_handoff_note.pdf",
            "pdf",
            "ai_generated",
            "The Uni Financial Aid Bot",
            "2026-03-02",
            "summary_pdf",
            {
                "student_name": "Andre Simmons",
                "issue": "Conflicting parent cash income values",
                "worksheet_value": "$12,000",
                "ledger_estimate": "$18,900",
                "recommended_action": "Advisor reconciliation call",
            },
            [
                "Bot completed all deterministic fields and escalated reconciliation decision to human advisor.",
                "Includes concise summary for rapid handoff.",
            ],
        ),
    ]
    chat_12 = timestamped_chat(
        14,
        36,
        [
            event(
                "student",
                "My coach said I still have a verification hold. We filed non-filing but now they want income proof.",
                language="en",
                intent="verification_help",
                sentiment="stressed",
            ),
            event(
                "ai",
                "I opened your V1 income reconciliation form and imported your partial worksheet.",
                language="en",
                intent="open_reconciliation_form",
                sentiment="supportive",
                form_updates=[
                    form_update(form_12, "student_name", "Student Name", "Andre Simmons", "student_profile", 0.99),
                    form_update(form_12, "parent_non_filer_status", "Parent Non-Filer", True, "FA012-D3_parse", 0.97),
                ],
            ),
            event(
                "student",
                "Uploading IRS non-filing letter and my dad's notebook ledger.",
                language="en",
                intent="upload_docs",
                sentiment="anxious",
                document_links=[
                    {"doc_id": "FA012-D1", "file_link": "./01_parent_non_filing_letter.pdf"},
                    {"doc_id": "FA012-D2", "file_link": "./02_parent_cash_ledger_photo.webp"},
                    {"doc_id": "FA012-D3", "file_link": "./03_income_verification_worksheet_partial.pdf"},
                ],
            ),
            event(
                "ai",
                "I extracted an estimated parent net income of $18,900 from the ledger, which conflicts with $12,000 on your worksheet.",
                language="en",
                intent="detect_discrepancy",
                sentiment="careful",
                form_updates=[
                    form_update(form_12, "parent_income_worksheet", "Worksheet Parent Income", 12000, "FA012-D3_parse", 0.96),
                    form_update(form_12, "parent_income_ledger", "Ledger Parent Income", 18900, "FA012-D2_parse", 0.87),
                    form_update(form_12, "discrepancy_flag", "Discrepancy Flag", True, "rules_engine", 1.0),
                ],
                metadata={"ocr_quality": "medium_low", "reason": "blur + handwriting"},
            ),
            event(
                "student",
                "I do not know which number is right. I am worried I will be dropped.",
                language="en",
                intent="distress_signal",
                sentiment="high_stress",
            ),
            event(
                "ai",
                "You will not be dropped for asking for help. I am bringing in an advisor now with a full summary so you do not repeat anything.",
                language="en",
                intent="escalate_to_human",
                sentiment="empathetic",
                metadata={
                    "escalation_trigger": "high_stress + unresolved income discrepancy",
                    "distress_score": 0.9,
                    "handoff_to": "Advisor Miguel Santos",
                },
                document_links=[{"doc_id": "FA012-D4", "file_link": "./04_income_discrepancy_handoff_note.pdf"}],
            ),
            event(
                "advisor",
                "Hi Andre, I am Miguel. I reviewed the handoff note and we can reconcile this quickly on a 5-minute call.",
                language="en",
                intent="human_takeover",
                sentiment="calm",
                form_updates=[
                    form_update(form_12, "advisor_review_status", "Advisor Review Status", "In progress", "advisor_confirmation", 1.0),
                ],
            ),
        ],
    )
    applicants.append(
        {
            "applicant_id": "FA-012",
            "profile": {
                "full_name": "Andre Simmons",
                "preferred_name": "Andre",
                "age": 18,
                "background_summary": "First-year student athlete with parent non-filer verification complexity.",
                "first_language": "English",
                "english_proficiency": "Fluent",
                "tech_savviness": "Medium",
                "financial_aid_literacy": "Low",
                "device_primary": "Android smartphone",
                "current_address": "5219 Martin Luther King Jr Blvd Apt 14, Houston, TX 77021",
                "enrollment_goal": "BS Kinesiology",
            },
            "financial_aid_context": {
                "institution": "The Uni",
                "aid_year": "2026-2027",
                "dependency_status": "Dependent",
                "sai_estimate": -210,
                "reported_prior_year_income_usd": 12000,
                "current_year_income_usd": 18900,
                "household_size": 4,
                "selected_for": ["Federal Verification V1"],
                "risk_flags": ["income_discrepancy", "high_stress"],
            },
            "required_forms": ["V1 Verification Income Reconciliation"],
            "document_bundle": docs_12,
            "chat_conversation": chat_12,
            "conversation_outcome": {
                "status": "escalated_to_human_pending_call",
                "final_owner": "Advisor Miguel Santos",
                "completion_percent_before_handoff": 88,
            },
            "demo_hook": {
                "title": "Discrepancy detection with human safety net",
                "heart_moment": "AI auto-fills everything deterministic and escalates exactly where human judgment is needed.",
            },
        }
    )

    return applicants


def assign_paths(dataset: dict[str, Any]) -> None:
    for applicant in dataset["applicants"]:
        folder = f"{applicant['applicant_id']}_{slugify(applicant['profile']['full_name'])}"
        applicant["folder_name"] = folder
        for doc in applicant["document_bundle"]:
            doc["file_link"] = f"./{doc['file_name']}"


def write_dataset(dataset: dict[str, Any]) -> None:
    DATA_ROOT.mkdir(parents=True, exist_ok=True)

    for applicant in dataset["applicants"]:
        folder_path = DATA_ROOT / applicant["folder_name"]
        folder_path.mkdir(parents=True, exist_ok=True)

        for doc in applicant["document_bundle"]:
            render_document(doc, folder_path / doc["file_name"])

        bundle_path = folder_path / "applicant_bundle.json"
        bundle_path.write_text(json.dumps(applicant, indent=2, ensure_ascii=True), encoding="utf-8")

    manifest = {
        "dataset_id": dataset["dataset_id"],
        "generated_on": dataset["generated_on"],
        "notes": dataset["notes"],
        "applicant_count": len(dataset["applicants"]),
        "applicants": [
            {
                "applicant_id": a["applicant_id"],
                "full_name": a["profile"]["full_name"],
                "folder": a["folder_name"],
                "documents": [d["file_name"] for d in a["document_bundle"]],
                "chat_turns": len(a["chat_conversation"]),
                "outcome": a["conversation_outcome"]["status"],
            }
            for a in dataset["applicants"]
        ],
    }

    (DATA_ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=True), encoding="utf-8")
    (DATA_ROOT / "all_applicants.json").write_text(json.dumps(dataset, indent=2, ensure_ascii=True), encoding="utf-8")


def main() -> None:
    applicants = build_applicants()
    if len(applicants) != 12:
        raise RuntimeError(f"Expected 12 applicants, found {len(applicants)}")

    dataset = {
        "dataset_id": "financial_aid_bot_synthetic_demo_v1",
        "generated_on": "2026-03-02",
        "notes": [
            "All records are synthetic and generated for product demonstration.",
            "Each applicant bundle includes profile metadata, realistic chat timeline, form field updates, and document links.",
            "No real student PII is included.",
        ],
        "applicants": applicants,
    }

    assign_paths(dataset)
    write_dataset(dataset)


if __name__ == "__main__":
    main()

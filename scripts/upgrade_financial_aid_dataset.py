#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "financial-aid" / "data"
DATA_FILE = DATA_ROOT / "all_applicants.json"
MANIFEST_FILE = DATA_ROOT / "manifest.json"


def fu(form_id: str, field_id: str, label: str, value: Any, source: str, confidence: float) -> dict[str, Any]:
    return {
        "form_id": form_id,
        "field_id": field_id,
        "field_label": label,
        "new_value": value,
        "source": source,
        "confidence": confidence,
    }


def ev(
    speaker: str,
    language: str,
    intent: str,
    sentiment: str,
    message: str,
    *,
    translated_message_en: str | None = None,
    form_updates: list[dict[str, Any]] | None = None,
    document_links: list[dict[str, str]] | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    out: dict[str, Any] = {
        "speaker": speaker,
        "language": language,
        "intent": intent,
        "sentiment": sentiment,
        "message": message,
    }
    if translated_message_en:
        out["translated_message_en"] = translated_message_en
    if form_updates:
        out["form_updates"] = form_updates
    if document_links:
        out["document_links"] = document_links
    if metadata:
        out["metadata"] = metadata
    return out


def stamp(events: list[dict[str, Any]], first_timestamp: str) -> list[dict[str, Any]]:
    start = datetime.fromisoformat(first_timestamp)
    out: list[dict[str, Any]] = []
    for idx, item in enumerate(events, start=1):
        out.append(
            {
                "turn": idx,
                "timestamp": (start + timedelta(minutes=2 * (idx - 1))).isoformat(),
                **item,
            }
        )
    return out


def make_fa001_chat() -> list[dict[str, Any]]:
    f = "uni_v1_verification_worksheet_2026"
    events = [
        ev(
            "student",
            "en",
            "seek_help",
            "panicked",
            "The Uni says I have a hold and need a V1 Verification Worksheet. I do not know what that is.",
        ),
        ev(
            "ai",
            "en",
            "reassure_and_start_form",
            "empathetic",
            "You are okay, Marcus. Your classes are safe. I opened your V1 worksheet and we can do this together. Who lives in your household right now?",
            form_updates=[
                fu(f, "student_name", "Student Name", "Marcus Johnson", "student_profile", 0.99),
                fu(f, "student_id", "Student ID", "U10449213", "student_profile", 0.99),
                fu(f, "aid_year", "Aid Year", "2026-2027", "institution_context", 1.0),
            ],
        ),
        ev(
            "student",
            "en",
            "provide_household",
            "anxious",
            "Just me, my mom, and my little sister.",
        ),
        ev(
            "ai",
            "en",
            "clarify_household_details",
            "supportive",
            "Got it. I entered household size as 3. Is your sister under 13, and is your mom working this year?",
            form_updates=[
                fu(f, "household_size", "Household Size", 3, "turn_3_message", 0.98),
                fu(
                    f,
                    "household_members",
                    "Household Members",
                    [
                        "Marcus Johnson (student)",
                        "Tanya Johnson (mother)",
                        "Aaliyah Johnson (sister, age 10)",
                    ],
                    "turn_3_message",
                    0.96,
                ),
            ],
        ),
        ev(
            "student",
            "en",
            "provide_household_followup",
            "worried",
            "Yes, my sister is 10. My mom does not work because of disability.",
        ),
        ev(
            "ai",
            "en",
            "collect_income_docs",
            "supportive",
            "Thanks. Did you work in 2025? If yes, snap your W-2 and upload it here.",
            form_updates=[
                fu(f, "sibling_under_13", "Sibling Under 13", True, "turn_5_message", 0.95),
            ],
        ),
        ev(
            "student",
            "en",
            "upload_docs",
            "nervous",
            "Yes, I worked at BrightBurger. Uploading W-2 and my handwritten note now.",
            document_links=[
                {"doc_id": "FA001-D1", "file_link": "./01_fast_food_w2_blurry.webp"},
                {"doc_id": "FA001-D2", "file_link": "./02_household_note_handwritten.webp"},
            ],
        ),
        ev(
            "ai",
            "en",
            "autofill_income",
            "reassuring",
            "I read your W-2. Wages are $8,412.37 from BrightBurger and federal withholding is $282. I filled the income section.",
            form_updates=[
                fu(f, "employer_name", "Employer Name", "BrightBurger #147", "FA001-D1_ocr", 0.94),
                fu(f, "student_wages", "Student Wages", 8412.37, "FA001-D1_ocr", 0.94),
                fu(f, "federal_tax_paid", "Federal Tax Paid", 282.00, "FA001-D1_ocr", 0.91),
            ],
            metadata={"ocr_quality": "medium", "blur_detected": True},
        ),
        ev(
            "student",
            "en",
            "policy_question",
            "confused",
            "The form asks for untaxed income. Does my mom's disability check count?",
        ),
        ev(
            "ai",
            "en",
            "escalate_to_human",
            "empathetic",
            "Great question. I am pulling in Sarah, a human advisor, so you get the policy answer right away.",
            metadata={
                "escalation_trigger": "regulatory_complexity_and_student_confusion",
                "distress_score": 0.88,
                "handoff_to": "Sarah Kim",
                "handoff_summary": "Worksheet mostly complete; pending policy treatment of parent SSDI as untaxed income.",
                "advisor_action_items": [
                    "Confirm SSDI handling",
                    "Finalize untaxed income line",
                    "Approve for e-sign",
                ],
            },
        ),
        ev(
            "advisor",
            "en",
            "human_takeover",
            "calm",
            "Hi Marcus, I am Sarah. Thanks for staying with us. SSDI can count in specific untaxed lines, and I will place it correctly.",
            form_updates=[
                fu(f, "untaxed_income_parent_ssdi", "Parent SSDI Untaxed Income", 11880, "advisor_confirmation", 1.0)
            ],
        ),
        ev(
            "student",
            "en",
            "provide_amount",
            "relieved",
            "It is around $990 each month.",
        ),
        ev(
            "advisor",
            "en",
            "confirm_math",
            "supportive",
            "Perfect, that is $11,880 annual. I entered it and checked the advisor review box.",
            form_updates=[
                fu(f, "parent_ssdi_annual", "Parent SSDI Annual", 11880, "advisor_math", 1.0),
                fu(f, "review_status", "Review Status", "Ready for e-sign", "advisor_confirmation", 1.0),
            ],
        ),
        ev(
            "ai",
            "en",
            "confirm_next_step",
            "encouraging",
            "I attached your updated worksheet draft. Review and sign once you are ready.",
            document_links=[{"doc_id": "FA001-D3", "file_link": "./03_v1_verification_worksheet_draft.pdf"}],
        ),
        ev(
            "student",
            "en",
            "student_confirmation",
            "relieved",
            "I signed it. Thank you for not making this scary.",
        ),
        ev(
            "advisor",
            "en",
            "close_case",
            "calm",
            "Signed packet received. Your hold will clear after processing. You will stay enrolled.",
            form_updates=[fu(f, "submission_status", "Submission Status", "Submitted by advisor", "advisor_confirmation", 1.0)],
        ),
    ]
    return events


def make_fa003_chat() -> list[dict[str, Any]]:
    f = "dependency_override_request_2026"
    events = [
        ev(
            "student",
            "es",
            "report_estrangement",
            "overwhelmed",
            "La FAFSA pide impuestos de mis padres, pero no hablo con ellos desde hace cinco anos.",
            translated_message_en="FAFSA asks for my parents' taxes, but I have not spoken to them in five years.",
        ),
        ev(
            "ai",
            "es",
            "start_override_form",
            "empathetic",
            "Lo siento mucho, Carlos. Podemos hacer una solicitud de Dependency Override. Ya abri el formulario. Cual es tu direccion actual?",
            translated_message_en="I am very sorry, Carlos. We can submit a dependency override request. I opened the form. What is your current address?",
            form_updates=[
                fu(f, "student_name", "Student Name", "Carlos Mendoza", "student_profile", 0.99),
                fu(f, "language_preference", "Language Preference", "Spanish", "turn_1_message", 0.99),
            ],
        ),
        ev(
            "student",
            "es",
            "provide_address",
            "anxious",
            "8810 Liberty View Dr Apt 5C, Orlando Florida 32821.",
            translated_message_en="8810 Liberty View Dr Apt 5C, Orlando Florida 32821.",
        ),
        ev(
            "ai",
            "es",
            "collect_letters",
            "supportive",
            "Gracias. Ya complete la informacion independiente. Ahora necesito dos cartas de apoyo de profesionales.",
            translated_message_en="Thank you. I completed your independent student information. Now I need two professional support letters.",
            form_updates=[
                fu(f, "current_address", "Current Address", "8810 Liberty View Dr Apt 5C, Orlando, FL 32821", "turn_3_message", 0.99),
            ],
        ),
        ev(
            "student",
            "es",
            "upload_docs",
            "cooperative",
            "Subi carta de mi terapeuta, carta de mi arrendador y mi utility bill.",
            translated_message_en="I uploaded my therapist letter, my landlord letter, and my utility bill.",
            document_links=[
                {"doc_id": "FA003-D1", "file_link": "./01_utility_bill_current_address.pdf"},
                {"doc_id": "FA003-D2", "file_link": "./02_therapist_support_letter.pdf"},
                {"doc_id": "FA003-D3", "file_link": "./03_landlord_support_letter.pdf"},
                {"doc_id": "FA003-D5", "file_link": "./05_self_support_note_phone_photo.webp"},
            ],
        ),
        ev(
            "ai",
            "es",
            "parse_letters",
            "encouraging",
            "Excelente. Ya extraje los nombres y telefonos de tus referencias. Ahora necesito como te mantienes economicamente.",
            translated_message_en="Excellent. I extracted your references and phone numbers. Now I need to know how you support yourself financially.",
            form_updates=[
                fu(f, "reference_1_name", "Reference 1 Name", "Dr. Naomi Ellis, LCSW", "FA003-D2_parse", 0.96),
                fu(f, "reference_1_phone", "Reference 1 Phone", "407-555-0119", "FA003-D2_parse", 0.95),
                fu(f, "reference_2_name", "Reference 2 Name", "Miguel Alvarado", "FA003-D3_parse", 0.96),
                fu(f, "reference_2_phone", "Reference 2 Phone", "321-555-0182", "FA003-D3_parse", 0.95),
            ],
        ),
        ev(
            "student",
            "es",
            "provide_self_support_statement",
            "hopeful",
            "Trabajo por horas en construccion, pago renta, comida y transporte yo solo.",
            translated_message_en="I work hourly in construction and I pay rent, food, and transportation by myself.",
        ),
        ev(
            "ai",
            "es",
            "collect_additional_context",
            "supportive",
            "Gracias. Cuanto pagas de renta al mes y desde cuando vives sin apoyo familiar?",
            translated_message_en="Thank you. How much rent do you pay monthly and since when have you lived without family support?",
        ),
        ev(
            "student",
            "es",
            "provide_rent_history",
            "steady",
            "Pago $1,050 por mes y llevo cinco anos sin apoyo de ellos.",
            translated_message_en="I pay $1,050 per month and I have had no support from them for five years.",
        ),
        ev(
            "ai",
            "es",
            "draft_statement",
            "supportive",
            "Perfecto. Traduzco tu historia a ingles formal para la seccion Separation Details.",
            translated_message_en="Perfect. I will translate your story into formal English for the Separation Details section.",
            form_updates=[
                fu(
                    f,
                    "separation_details",
                    "Separation Details",
                    "Student reports five-year estrangement, self-support through hourly construction work, and no parental contact.",
                    "turn_9_translation",
                    0.94,
                ),
                fu(f, "monthly_rent", "Monthly Rent", 1050, "turn_9_message", 0.94),
            ],
        ),
        ev(
            "student",
            "es",
            "policy_question",
            "concerned",
            "Necesito reporte policial para aprobar esto?",
            translated_message_en="Do I need a police report for this to be approved?",
        ),
        ev(
            "ai",
            "es",
            "policy_clarification",
            "reassuring",
            "No necesariamente. Tus dos cartas profesionales y evidencia de domicilio normalmente son suficientes para revision inicial.",
            translated_message_en="Not necessarily. Your two professional letters and address evidence are usually enough for initial review.",
        ),
        ev(
            "student",
            "es",
            "confirm_ready",
            "relieved",
            "Entonces sigamos. Quiero enviarlo hoy.",
            translated_message_en="Then let's continue. I want to submit it today.",
        ),
        ev(
            "ai",
            "es",
            "finalize_draft",
            "encouraging",
            "Listo. El borrador esta preparado para envio y ya inclui tus referencias, direccion y declaracion traducida.",
            translated_message_en="Done. The draft is ready for submission with your references, address, and translated statement included.",
            form_updates=[fu(f, "packet_status", "Packet Status", "Ready for submission", "workflow", 1.0)],
            document_links=[{"doc_id": "FA003-D4", "file_link": "./04_dependency_override_draft.pdf"}],
        ),
        ev(
            "student",
            "es",
            "gratitude",
            "relieved",
            "Gracias por explicarlo sin palabras complicadas.",
            translated_message_en="Thank you for explaining this without complicated words.",
        ),
        ev(
            "ai",
            "es",
            "close_support",
            "warm",
            "Siempre. Si la oficina pide algo extra, te aviso aqui en espanol y en ingles.",
            translated_message_en="Always. If the office asks for anything else, I'll notify you here in Spanish and English.",
        ),
    ]
    return events


def make_fa005_chat() -> list[dict[str, Any]]:
    f = "coa_adjustment_dependent_care_2026"
    events = [
        ev(
            "student",
            "pa",
            "ask_coa_adjustment",
            "worried",
            "ਮੇਰਾ ਬੱਚਾ ਡੇਅਕੇਅਰ ਜਾਂਦਾ ਹੈ ਤੇ ਖਰਚਾ ਬਹੁਤ ਵੱਧ ਹੈ। ਕੀ ਇਸ ਲਈ ਕੋਈ ਫਾਰਮ ਹੈ?",
            translated_message_en="My child goes to daycare and the cost is very high. Is there a form for this?",
        ),
        ev(
            "ai",
            "pa",
            "start_dependent_care_form",
            "supportive",
            "ਹਾਂ, ਮੈਂ Dependent Care Cost Adjustment ਫਾਰਮ ਖੋਲ੍ਹ ਦਿੱਤਾ ਹੈ। ਮਹੀਨੇ ਦਾ ਡੇਅਕੇਅਰ ਖਰਚਾ ਕਿੰਨਾ ਹੈ?",
            translated_message_en="Yes, I opened the Dependent Care Cost Adjustment form. What is the monthly daycare cost?",
            form_updates=[fu(f, "student_name", "Student Name", "Harpreet Singh", "student_profile", 0.99)],
        ),
        ev(
            "student",
            "pa",
            "provide_cost",
            "anxious",
            "ਮਹੀਨੇ ਦਾ $1,140 ਹੈ।",
            translated_message_en="It is $1,140 per month.",
        ),
        ev(
            "ai",
            "pa",
            "autofill_and_collect_docs",
            "reassuring",
            "ਠੀਕ ਹੈ। ਮੈਂ ਸਾਲਾਨਾ ਖਰਚਾ $13,680 ਭਰ ਦਿੱਤਾ ਹੈ। ਹੁਣ ਡੇਅਕੇਅਰ ਇਨਵੌਇਸ ਅਪਲੋਡ ਕਰੋ।",
            translated_message_en="Great. I entered annual cost as $13,680. Now upload your daycare invoice.",
            form_updates=[
                fu(f, "monthly_childcare_cost", "Monthly Childcare Cost", 1140, "turn_3_message", 0.99),
                fu(f, "annual_childcare_cost", "Annual Childcare Cost", 13680, "computed", 1.0),
            ],
        ),
        ev(
            "student",
            "pa",
            "upload_docs",
            "cooperative",
            "ਇਨਵੌਇਸ ਅਤੇ ਮੇਰੇ spouse ਦੀ paystub ਫੋਟੋ ਅਪਲੋਡ ਕਰ ਦਿੱਤੀ ਹੈ।",
            translated_message_en="I uploaded the invoice and my spouse's paystub photo.",
            document_links=[
                {"doc_id": "FA005-D1", "file_link": "./01_daycare_invoice_summary.pdf"},
                {"doc_id": "FA005-D2", "file_link": "./02_spouse_paystub_photo.webp"},
            ],
        ),
        ev(
            "ai",
            "pa",
            "parse_docs",
            "supportive",
            "ਵਧੀਆ। ਮੈਂ ਡੌਕੂਮੈਂਟ ਪੜ੍ਹ ਕੇ ਫਾਰਮ ਵਿੱਚ ਜੋੜ ਦਿੱਤੇ ਹਨ। ਕੀ ਬੱਚਾ ਹਫ਼ਤੇ ਵਿੱਚ 5 ਦਿਨ ਡੇਅਕੇਅਰ ਜਾਂਦਾ ਹੈ?",
            translated_message_en="Great. I parsed the documents and added them to the form. Does your child attend daycare 5 days a week?",
            form_updates=[fu(f, "supporting_docs", "Supporting Docs", "Invoice + paystub received", "doc_checklist", 1.0)],
        ),
        ev(
            "student",
            "pa",
            "confirm_schedule",
            "steady",
            "ਹਾਂ, ਸੋਮਵਾਰ ਤੋਂ ਸ਼ੁੱਕਰਵਾਰ ਤੱਕ ਜਾਂਦਾ ਹੈ।",
            translated_message_en="Yes, Monday through Friday.",
        ),
        ev(
            "ai",
            "pa",
            "collect_spouse_income_frequency",
            "supportive",
            "ਧੰਨਵਾਦ। spouse ਦੀ ਆਮਦਨ ਦੋ ਹਫ਼ਤਿਆਂ ਵਿੱਚ ਆਉਂਦੀ ਹੈ, ਠੀਕ?",
            translated_message_en="Thank you. Your spouse income is biweekly, correct?",
        ),
        ev(
            "student",
            "pa",
            "confirm_income_frequency",
            "calm",
            "ਹਾਂ, biweekly ਹੈ।",
            translated_message_en="Yes, it is biweekly.",
        ),
        ev(
            "ai",
            "pa",
            "update_budget_detail",
            "encouraging",
            "ਮੈਂ household cash-flow ਨੋਟ ਵੀ ਭਰ ਦਿੱਤਾ ਹੈ ਤਾਂ ਜੋ ਰਿਵਿਊ ਤੇਜ਼ ਹੋਵੇ।",
            translated_message_en="I also filled the household cash-flow note so the review can move faster.",
            form_updates=[fu(f, "cashflow_note", "Cashflow Note", "Spouse biweekly pay included", "turn_9_message", 0.92)],
        ),
        ev(
            "student",
            "pa",
            "ask_processing_time",
            "curious",
            "ਇਹਨੂੰ ਕਿੰਨਾ ਸਮਾਂ ਲੱਗੇਗਾ?",
            translated_message_en="How long will this take?",
        ),
        ev(
            "ai",
            "pa",
            "processing_eta",
            "reassuring",
            "ਆਮ ਤੌਰ ਤੇ 3 ਤੋਂ 5 ਬਿਜ਼ਨਸ ਦਿਨ। ਮੈਂ ਤੁਰੰਤ ਸਬਮਿਟ ਲਈ ਤਿਆਰ ਕਰ ਰਿਹਾ ਹਾਂ।",
            translated_message_en="Usually 3 to 5 business days. I am preparing it for immediate submission.",
        ),
        ev(
            "student",
            "pa",
            "confirm_submission",
            "relieved",
            "ਠੀਕ ਹੈ, ਭੇਜੋ।",
            translated_message_en="Okay, submit it.",
        ),
        ev(
            "ai",
            "pa",
            "complete_form",
            "encouraging",
            "ਫਾਰਮ ਤਿਆਰ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਸਾਇਨ ਕਰੋ, ਫਿਰ ਮੈਂ Financial Aid Office ਨੂੰ ਭੇਜ ਦਿਆਂਗਾ।",
            translated_message_en="The form is ready. Please sign, then I will send it to the Financial Aid Office.",
            form_updates=[fu(f, "status", "Status", "Ready for signature", "workflow", 1.0)],
            document_links=[{"doc_id": "FA005-D3", "file_link": "./03_dependent_care_budget_form.pdf"}],
        ),
        ev(
            "student",
            "pa",
            "gratitude",
            "relieved",
            "ਧੰਨਵਾਦ, ਇਹ ਬਹੁਤ ਆਸਾਨ ਬਣ ਗਿਆ।",
            translated_message_en="Thank you, this became much easier.",
        ),
    ]
    return events


def make_fa007_chat() -> list[dict[str, Any]]:
    f = "state_dream_act_support_packet_2026"
    events = [
        ev(
            "student",
            "vi",
            "eligibility_question",
            "confused",
            "Em có DACA, em không biết nên điền FAFSA hay Dream Act.",
            translated_message_en="I have DACA and I don't know whether to fill FAFSA or Dream Act.",
        ),
        ev(
            "ai",
            "vi",
            "route_to_state_aid",
            "supportive",
            "Với tình trạng của em, mình đi theo California Dream Act. Tôi đã mở gói hồ sơ hỗ trợ tiểu bang.",
            translated_message_en="For your status, we should use California Dream Act. I opened the state aid support packet.",
            form_updates=[
                fu(f, "aid_pathway", "Aid Pathway", "California Dream Act", "eligibility_rules", 1.0),
                fu(f, "student_name", "Student Name", "Minh Tran", "student_profile", 0.99),
            ],
        ),
        ev(
            "student",
            "vi",
            "upload_docs",
            "cooperative",
            "Em đã tải thẻ work permit, giấy xác nhận Dream Act và affidavit thu nhập của mẹ.",
            translated_message_en="I uploaded the work permit card, Dream Act confirmation, and my mother's income affidavit.",
            document_links=[
                {"doc_id": "FA007-D1", "file_link": "./01_ead_card_mobile_photo.webp"},
                {"doc_id": "FA007-D2", "file_link": "./02_state_dream_act_confirmation.pdf"},
                {"doc_id": "FA007-D3", "file_link": "./03_parent_income_affidavit.pdf"},
            ],
        ),
        ev(
            "ai",
            "vi",
            "autofill_state_fields",
            "encouraging",
            "Tôi đã lấy CADAA ID, ngày hết hạn thẻ và thu nhập phụ huynh để điền vào form.",
            translated_message_en="I extracted the CADAA ID, permit expiration, and parent income to fill your form.",
            form_updates=[
                fu(f, "cadaa_id", "CADAA ID", "CADAA-2026-550922", "FA007-D2_parse", 0.99),
                fu(f, "ead_expiration", "EAD Expiration", "2027-10-03", "FA007-D1_parse", 0.94),
                fu(f, "parent_income", "Parent Income", 27400, "FA007-D3_parse", 0.95),
            ],
        ),
        ev(
            "student",
            "vi",
            "ask_about_deadline",
            "concerned",
            "Hạn nộp còn kịp không?",
            translated_message_en="Will I still make the submission deadline?",
        ),
        ev(
            "ai",
            "vi",
            "deadline_reassurance",
            "reassuring",
            "Kịp. Hồ sơ của em đã sẵn sàng và chỉ còn bước ký điện tử.",
            translated_message_en="Yes. Your packet is ready and only electronic signature remains.",
        ),
        ev(
            "student",
            "vi",
            "acknowledge_help",
            "relieved",
            "Cảm ơn, bây giờ em hiểu rồi.",
            translated_message_en="Thank you, I understand now.",
        ),
    ]
    return events


def make_fa009_chat() -> list[dict[str, Any]]:
    f = "special_circumstances_income_adjustment_2026"
    events = [
        ev(
            "student",
            "bg",
            "special_circumstance_request",
            "concerned",
            "Сега съм разведена и плащам издръжка и медицински сметки. FAFSA не го отразява.",
            translated_message_en="I am now divorced and paying child support and medical bills. FAFSA does not reflect that.",
        ),
        ev(
            "ai",
            "bg",
            "open_adjustment_form",
            "supportive",
            "Отворих формуляра за Special Circumstances и започвам секцията за промяна в домакинството.",
            translated_message_en="I opened the Special Circumstances form and started the household-change section.",
            form_updates=[
                fu(f, "student_name", "Student Name", "Sofia Petrova", "student_profile", 0.99),
                fu(f, "marital_status", "Marital Status", "Divorced", "turn_1_message", 0.95),
            ],
        ),
        ev(
            "student",
            "bg",
            "upload_docs",
            "cooperative",
            "Качвам съдебното решение, извлечението за издръжка и болничната сметка.",
            translated_message_en="Uploading the divorce decree, child support statement, and hospital bill.",
            document_links=[
                {"doc_id": "FA009-D1", "file_link": "./01_divorce_decree_excerpt.pdf"},
                {"doc_id": "FA009-D2", "file_link": "./02_child_support_paid_statement.pdf"},
                {"doc_id": "FA009-D3", "file_link": "./03_medical_debt_statement.pdf"},
            ],
        ),
        ev(
            "ai",
            "bg",
            "autofill_expense_fields",
            "reassuring",
            "Извлякох $4,800 платена издръжка и $9,432 медицински дълг с месечна вноска $260.",
            translated_message_en="I extracted $4,800 child support paid and $9,432 medical debt with a $260 monthly payment.",
            form_updates=[
                fu(f, "child_support_paid", "Child Support Paid", 4800, "FA009-D2_parse", 0.97),
                fu(f, "medical_debt_balance", "Medical Debt Balance", 9432, "FA009-D3_parse", 0.96),
                fu(f, "monthly_medical_payment", "Monthly Medical Payment", 260, "FA009-D3_parse", 0.96),
            ],
        ),
        ev(
            "ai",
            "bg",
            "complete_form",
            "calm",
            "Формулярът е готов за подаване с всички доказателства.",
            translated_message_en="Your form is complete and ready for submission with all supporting evidence.",
            form_updates=[fu(f, "status", "Status", "Ready for submission", "workflow", 1.0)],
        ),
    ]
    return events


def make_fa010_chat() -> list[dict[str, Any]]:
    f = "citizenship_status_correction_2026"
    events = [
        ev(
            "student",
            "ht",
            "citizenship_issue",
            "confused",
            "Mwen pa pale angle byen. FAFSA di mwen pa kalifye men mwen vin sitwayen ane pase.",
            translated_message_en="I do not speak English well. FAFSA says I am not eligible but I became a citizen last year.",
        ),
        ev(
            "ai",
            "ht",
            "start_citizenship_form",
            "supportive",
            "Mesi Jean. Mwen ka ede ou. Mwen louvri fòm koreksyon sitwayènte a etap pa etap.",
            translated_message_en="Thank you, Jean. I can help. I opened the citizenship correction form step by step.",
            form_updates=[
                fu(f, "student_name", "Student Name", "Jean Baptiste", "student_profile", 0.99),
                fu(f, "language_assistance", "Language Assistance", "Haitian Creole requested", "turn_1_message", 0.97),
            ],
        ),
        ev(
            "student",
            "ht",
            "upload_docs",
            "cooperative",
            "M ap voye sètifika natiralizasyon an, lèt Selective Service, ak tradiksyon taks la.",
            translated_message_en="I am sending the naturalization certificate, Selective Service letter, and tax translation.",
            document_links=[
                {"doc_id": "FA010-D1", "file_link": "./01_certificate_of_naturalization.pdf"},
                {"doc_id": "FA010-D2", "file_link": "./02_selective_service_status_letter.pdf"},
                {"doc_id": "FA010-D3", "file_link": "./03_tax_return_translation_summary.pdf"},
            ],
        ),
        ev(
            "ai",
            "ht",
            "autofill_eligibility_fields",
            "reassuring",
            "Mwen mete estati ou kòm US Citizen, ajoute nimewo Selective Service, epi AGI a se $19,760.",
            translated_message_en="I set your status to US Citizen, added your Selective Service number, and AGI as $19,760.",
            form_updates=[
                fu(f, "citizenship_status", "Citizenship Status", "US Citizen", "FA010-D1_parse", 0.99),
                fu(f, "selective_service_number", "Selective Service Number", "S-925004137", "FA010-D2_parse", 0.98),
                fu(f, "agi", "AGI", 19760, "FA010-D3_parse", 0.95),
            ],
        ),
        ev(
            "student",
            "ht",
            "confirmation",
            "relieved",
            "Trè byen. Mwen konprann pi byen kounye a.",
            translated_message_en="Very good. I understand much better now.",
        ),
        ev(
            "ai",
            "ht",
            "finalize_with_translation",
            "encouraging",
            "Fòm nan fini. Mwen mete yon rezime an kreyòl ak angle pou ou revize.",
            translated_message_en="The form is complete. I added a summary in Creole and English for your review.",
            metadata={"translation_mode": "bi-lingual summary generated"},
        ),
    ]
    return events


def make_fa011_chat() -> list[dict[str, Any]]:
    f = "consortium_and_benefit_coordination_2026"
    events = [
        ev(
            "student",
            "ar",
            "consortium_question",
            "concerned",
            "زوجي عنده أوامر نقل عسكري وأنا عندي مزايا Chapter 35. هل ممكن أحافظ على باقة المساعدات؟",
            translated_message_en="My spouse has military transfer orders and I have Chapter 35 benefits. Can I keep my aid package stable?",
        ),
        ev(
            "ai",
            "ar",
            "start_consortium_form",
            "supportive",
            "نعم. فتحت نموذج التنسيق بين Consortium ومزايا Chapter 35 وأدخلت بياناتك الأساسية.",
            translated_message_en="Yes. I opened the consortium and Chapter 35 coordination form and entered your basic profile.",
            form_updates=[
                fu(f, "student_name", "Student Name", "Fatima Al-Khalil", "student_profile", 0.99),
                fu(f, "coordination_needed", "Coordination Needed", "Consortium + Chapter 35", "turn_1_message", 0.98),
            ],
        ),
        ev(
            "student",
            "ar",
            "upload_docs",
            "cooperative",
            "رفعت أوامر النقل، خطاب VA، وكشف الرسوم الحالي.",
            translated_message_en="I uploaded PCS orders, VA letter, and current tuition statement.",
            document_links=[
                {"doc_id": "FA011-D1", "file_link": "./01_spouse_pcs_orders.pdf"},
                {"doc_id": "FA011-D2", "file_link": "./02_chapter35_eligibility_letter.pdf"},
                {"doc_id": "FA011-D3", "file_link": "./03_current_term_tuition_statement.pdf"},
                {"doc_id": "FA011-D4", "file_link": "./04_household_budget_note_photo.webp"},
            ],
        ),
        ev(
            "ai",
            "ar",
            "autofill_consortium_fields",
            "reassuring",
            "استخرجت تاريخ النقل 2026-05-01، ومبلغ Chapter 35 الشهري $1,536، والرصيد الحالي $2,190.",
            translated_message_en="I extracted relocation date 2026-05-01, Chapter 35 monthly amount $1,536, and current balance $2,190.",
            form_updates=[
                fu(f, "pcs_effective_date", "PCS Effective Date", "2026-05-01", "FA011-D1_parse", 0.99),
                fu(f, "chapter35_monthly", "Chapter 35 Monthly Benefit", 1536, "FA011-D2_parse", 0.98),
                fu(f, "net_balance", "Current Net Balance", 2190, "FA011-D3_parse", 0.97),
            ],
        ),
        ev(
            "student",
            "ar",
            "ask_timeline",
            "concerned",
            "طيب كم يوم تحتاج الموافقة؟",
            translated_message_en="Okay, how many days will approval take?",
        ),
        ev(
            "ai",
            "ar",
            "timeline_response",
            "supportive",
            "عادة 3 أيام عمل. سأجهز لك ملخصًا للمراجع حتى لا تعيدي الشرح.",
            translated_message_en="Usually 3 business days. I will prepare a reviewer summary so you do not have to repeat anything.",
        ),
        ev(
            "student",
            "ar",
            "ask_about_housing_stipend",
            "curious",
            "وهل بدل السكن من VA يؤثر على المنحة؟",
            translated_message_en="Does VA housing stipend affect the grant?",
        ),
        ev(
            "ai",
            "ar",
            "policy_clarification",
            "careful",
            "سأحول هذا السؤال لمستشار مختص للتأكيد الرسمي، وأرفق له كل التفاصيل الآن.",
            translated_message_en="I will route this question to a specialist advisor for official confirmation, and attach all details now.",
            metadata={
                "escalation_trigger": "benefit_policy_confirmation",
                "distress_score": 0.52,
                "handoff_to": "Advisor Omar Haddad",
                "handoff_summary": "Consortium form drafted; confirm treatment of VA housing stipend with institutional grants.",
                "advisor_action_items": [
                    "Confirm policy interaction",
                    "Approve consortium packet",
                    "Notify student in Arabic",
                ],
            },
        ),
        ev(
            "advisor",
            "ar",
            "human_takeover",
            "calm",
            "مرحبًا فاطمة، أنا المستشار عمر. راجعت الملخص وسأؤكد لك السياسة خلال دقائق.",
            translated_message_en="Hi Fatima, I am Advisor Omar. I reviewed the summary and will confirm policy in a few minutes.",
        ),
        ev(
            "student",
            "ar",
            "acknowledge",
            "relieved",
            "شكرًا، هذا ممتاز.",
            translated_message_en="Thank you, that's excellent.",
        ),
        ev(
            "advisor",
            "ar",
            "policy_confirmation",
            "supportive",
            "تم التأكيد: بدل السكن لا يلغي المنحة تلقائيًا. أدخلت الملاحظة الرسمية في الملف.",
            translated_message_en="Confirmed: housing stipend does not automatically cancel the grant. I added the official note to your file.",
            form_updates=[
                fu(
                    f,
                    "policy_note",
                    "Policy Note",
                    "VA housing stipend reviewed; no automatic grant cancellation.",
                    "advisor_confirmation",
                    1.0,
                )
            ],
        ),
        ev(
            "ai",
            "ar",
            "prepare_submission",
            "encouraging",
            "الآن الملف كامل. سأرسله لمنسق الـ Consortium للموافقة النهائية.",
            translated_message_en="Now the file is complete. I will send it to the consortium coordinator for final approval.",
        ),
        ev(
            "student",
            "ar",
            "confirm_submit",
            "relieved",
            "ممتاز، أكملي الإرسال.",
            translated_message_en="Great, proceed with submission.",
        ),
        ev(
            "ai",
            "ar",
            "submit_for_coordination",
            "calm",
            "تم الإرسال بنجاح. ستصلكِ رسالة متابعة خلال 72 ساعة.",
            translated_message_en="Submitted successfully. You will receive a follow-up message within 72 hours.",
            metadata={"queue": "Consortium Coordinator", "expected_review_days": 3},
        ),
        ev(
            "advisor",
            "ar",
            "close_case",
            "warm",
            "إذا وصلتك أي رسالة غير واضحة، أرسليها هنا وسأشرحها بالعربية.",
            translated_message_en="If you receive any unclear message, send it here and I will explain it in Arabic.",
        ),
    ]
    return events


def append_doc_if_missing(app: dict[str, Any], doc: dict[str, Any]) -> None:
    docs = app["document_bundle"]
    if not any(d.get("doc_id") == doc.get("doc_id") for d in docs):
        docs.append(doc)


def main() -> None:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))

    by_id = {app["applicant_id"]: app for app in data["applicants"]}

    # Extend / revise long-form chats.
    for app_id, builder in {
        "FA-001": make_fa001_chat,
        "FA-003": make_fa003_chat,
        "FA-005": make_fa005_chat,
        "FA-007": make_fa007_chat,
        "FA-009": make_fa009_chat,
        "FA-010": make_fa010_chat,
        "FA-011": make_fa011_chat,
    }.items():
        app = by_id[app_id]
        first_ts = app["chat_conversation"][0]["timestamp"]
        app["chat_conversation"] = stamp(builder(), first_ts)

    # Add extra webp docs for longer-chat profiles where helpful.
    append_doc_if_missing(
        by_id["FA-003"],
        {
            "doc_id": "FA003-D5",
            "doc_type": "Self_Support_Note_Photo",
            "title": "Self Support Expense Note (Phone Photo)",
            "file_name": "05_self_support_note_phone_photo.webp",
            "format": "webp",
            "document_role": "student_upload",
            "issuer": "Student Provided",
            "issue_date": "2026-03-02",
            "render_template": "handwritten_note_photo",
            "quality_flags": ["2_degree_skew", "blurry", "low_light", "compression_noise"],
            "structured_fields": {
                "student_name": "Carlos Mendoza",
                "monthly_rent": "$1,050",
                "food_transport": "$410",
                "note": "Self-supported with hourly construction income",
            },
            "body_lines": [
                "Handwritten personal budget note attached as supplemental evidence.",
                "Used by AI to enrich separation and self-support details.",
            ],
            "file_link": "./05_self_support_note_phone_photo.webp",
        },
    )

    append_doc_if_missing(
        by_id["FA-011"],
        {
            "doc_id": "FA011-D4",
            "doc_type": "Household_Budget_Note_Photo",
            "title": "Household Budget Notes (Mobile Photo)",
            "file_name": "04_household_budget_note_photo.webp",
            "format": "webp",
            "document_role": "student_upload",
            "issuer": "Student Provided",
            "issue_date": "2026-03-02",
            "render_template": "budget_note_photo",
            "quality_flags": ["2_degree_skew", "shadow_glare", "compression_noise"],
            "structured_fields": {
                "student_name": "Fatima Al-Khalil",
                "rent": "$1,840",
                "utilities": "$290",
                "childcare": "$460",
            },
            "body_lines": [
                "Photo of handwritten budget notes to support consortium planning.",
                "Used to contextualize relocation cash-flow constraints.",
            ],
            "file_link": "./04_household_budget_note_photo.webp",
        },
    )

    # Update outcomes where turn counts/flow changed.
    by_id["FA-005"]["conversation_outcome"]["status"] = "submitted_after_signature"
    by_id["FA-011"]["conversation_outcome"]["status"] = "escalated_and_submitted_for_coordinator_review"

    # Keep folder links aligned and write data.
    for app in data["applicants"]:
        app["chat_conversation"] = sorted(app["chat_conversation"], key=lambda x: x["turn"])
        for doc in app["document_bundle"]:
            doc["file_link"] = f"./{doc['file_name']}"

    DATA_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    manifest = {
        "dataset_id": data["dataset_id"],
        "generated_on": data["generated_on"],
        "notes": data.get("notes", []),
        "applicant_count": len(data["applicants"]),
        "applicants": [
            {
                "applicant_id": a["applicant_id"],
                "full_name": a["profile"]["full_name"],
                "folder": a["folder_name"],
                "documents": [d["file_name"] for d in a["document_bundle"]],
                "chat_turns": len(a["chat_conversation"]),
                "outcome": a["conversation_outcome"]["status"],
            }
            for a in data["applicants"]
        ],
    }
    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()

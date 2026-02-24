#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["jsonschema>=4.23.0"]
# ///

"""Generate a strict-schema JSON dataset of synthetic applicant document bundles."""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "credit-checking" / "data"
SCHEMA_PATH = OUT_DIR / "schema" / "synthetic_applicant_bundles.schema.json"
DATA_PATH = OUT_DIR / "manifests" / "synthetic_applicant_bundles.json"
GENERATED_ON = "2026-02-24"


def build_schema() -> dict[str, Any]:
    document_types = [
        "DD214",
        "JST",
        "CompTIA_SecurityPlus_Certificate",
        "High_School_Attestation_Form",
        "Community_College_Transcript",
        "Sophia_Learning_Transcript",
        "Google_Project_Management_Certificate",
        "WES_Course_By_Course_Evaluation",
        "ECE_Course_By_Course_Evaluation",
        "TOEFL_Score_Report",
    ]

    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "SyntheticApplicantDocumentBundles",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "dataset_id",
            "generated_on",
            "dataset_notes",
            "applicants",
        ],
        "properties": {
            "dataset_id": {"type": "string", "minLength": 1},
            "generated_on": {"type": "string", "format": "date"},
            "dataset_notes": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 1,
            },
            "applicants": {
                "type": "array",
                "minItems": 12,
                "maxItems": 12,
                "items": {"$ref": "#/$defs/applicant"},
            },
        },
        "$defs": {
            "applicant": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "Applicant_ID",
                    "Archetype_Code",
                    "Archetype_Label",
                    "Persona",
                    "Target_Program",
                    "Admissions_Term",
                    "Document_Bundle",
                    "Expected_AI_Output",
                ],
                "properties": {
                    "Applicant_ID": {"type": "string"},
                    "Archetype_Code": {"type": "string", "enum": ["A", "B", "C"]},
                    "Archetype_Label": {"type": "string"},
                    "Persona": {"$ref": "#/$defs/persona"},
                    "Target_Program": {"type": "string"},
                    "Admissions_Term": {"type": "string"},
                    "Document_Bundle": {
                        "type": "array",
                        "minItems": 2,
                        "maxItems": 4,
                        "items": {"$ref": "#/$defs/document"},
                    },
                    "Expected_AI_Output": {"$ref": "#/$defs/expected_ai_output"},
                },
            },
            "persona": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "full_name",
                    "preferred_name",
                    "career_goal",
                    "prior_learning_sources",
                    "demo_storyline",
                ],
                "properties": {
                    "full_name": {"type": "string"},
                    "preferred_name": {"type": "string"},
                    "career_goal": {"type": "string"},
                    "prior_learning_sources": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 2,
                    },
                    "demo_storyline": {"type": "string"},
                },
            },
            "expected_ai_output": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "Target_Pathway",
                    "Pathway_Theme",
                    "Proposed_Transfer_Credits_Total",
                    "Mapped_Courses",
                    "Remaining_Admissions_Checks",
                    "Advisor_Review_Focus",
                    "Narrative",
                ],
                "properties": {
                    "Target_Pathway": {"type": "string"},
                    "Pathway_Theme": {"type": "string"},
                    "Proposed_Transfer_Credits_Total": {"type": "number"},
                    "Mapped_Courses": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/mapping"},
                    },
                    "Remaining_Admissions_Checks": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "Advisor_Review_Focus": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "Narrative": {"type": "string"},
                },
            },
            "mapping": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "source_evidence",
                    "proposed_college_course_code",
                    "proposed_college_course_title",
                    "credits",
                    "rationale",
                ],
                "properties": {
                    "source_evidence": {"type": "string"},
                    "proposed_college_course_code": {"type": "string"},
                    "proposed_college_course_title": {"type": "string"},
                    "credits": {"type": "number"},
                    "rationale": {"type": "string"},
                },
            },
            "document": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "Document_ID",
                    "Document_Type",
                    "Title",
                    "Issuing_Organization",
                    "Issue_Date",
                    "Document_Format",
                    "Rendering_Method",
                    "Output_File_Name",
                    "Page_Count",
                    "Structured_Content",
                ],
                "properties": {
                    "Document_ID": {"type": "string"},
                    "Document_Type": {"type": "string", "enum": document_types},
                    "Title": {"type": "string"},
                    "Issuing_Organization": {"type": "string"},
                    "Issue_Date": {"type": "string", "format": "date"},
                    "Document_Format": {"type": "string", "enum": ["pdf", "webp", "txt"]},
                    "Rendering_Method": {
                        "type": "string",
                        "enum": [
                            "pristine_pdf",
                            "scanned_pdf",
                            "raw_text_pdf",
                            "raw_text_txt",
                            "simulated_scan_webp",
                            "gemimg_scan_webp",
                        ],
                    },
                    "Output_File_Name": {"type": "string"},
                    "Page_Count": {"type": "integer", "minimum": 1, "maximum": 8},
                    "Gemimg_Prompt": {"type": "string"},
                    "Structured_Content": {"$ref": "#/$defs/structured_content"},
                },
            },
            "structured_content": {
                "type": "object",
                "additionalProperties": False,
                "required": ["summary_lines", "visual_profile"],
                "properties": {
                    "student_name": {"type": "string"},
                    "student_id_on_document": {"type": "string"},
                    "document_number": {"type": "string"},
                    "date_range": {"$ref": "#/$defs/date_range"},
                    "service_record": {"$ref": "#/$defs/service_record"},
                    "certificate_record": {"$ref": "#/$defs/certificate_record"},
                    "education_record": {"$ref": "#/$defs/education_record"},
                    "evaluation_record": {"$ref": "#/$defs/evaluation_record"},
                    "gpa_summary": {"$ref": "#/$defs/gpa_summary"},
                    "signature_block": {"$ref": "#/$defs/signature_block"},
                    "summary_lines": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"type": "string"},
                    },
                    "notes": {"type": "array", "items": {"type": "string"}},
                    "raw_text_preview": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "courses": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/course"},
                    },
                    "ace_recommendations": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/ace_recommendation"},
                    },
                    "scores": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/score"},
                    },
                    "ai_mapping_hints": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/mapping"},
                    },
                    "visual_profile": {"$ref": "#/$defs/visual_profile"},
                },
            },
            "course": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "course_code",
                    "course_title",
                    "term_label",
                    "year",
                    "credits",
                    "grade",
                    "status",
                ],
                "properties": {
                    "course_code": {"type": "string"},
                    "course_title": {"type": "string"},
                    "term_label": {"type": "string"},
                    "year": {"type": "integer", "minimum": 1990, "maximum": 2030},
                    "credits": {"type": "number"},
                    "grade": {"type": ["string", "null"]},
                    "status": {
                        "type": "string",
                        "enum": ["Completed", "In Progress", "Evaluated"],
                    },
                    "level": {"type": "string"},
                    "source_system": {"type": "string"},
                    "notes": {"type": "string"},
                },
            },
            "score": {
                "type": "object",
                "additionalProperties": False,
                "required": ["test_name", "section", "score", "scale", "test_date"],
                "properties": {
                    "test_name": {"type": "string"},
                    "section": {"type": "string"},
                    "score": {"type": "number"},
                    "scale": {"type": "string"},
                    "test_date": {"type": "string", "format": "date"},
                },
            },
            "ace_recommendation": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "experience_or_training",
                    "subject",
                    "lower_division_credits",
                    "upper_division_credits",
                    "recommendation_basis",
                ],
                "properties": {
                    "experience_or_training": {"type": "string"},
                    "subject": {"type": "string"},
                    "lower_division_credits": {"type": "number"},
                    "upper_division_credits": {"type": "number"},
                    "recommendation_basis": {"type": "string"},
                },
            },
            "date_range": {
                "type": "object",
                "additionalProperties": False,
                "required": ["start", "end"],
                "properties": {
                    "start": {"type": "string", "format": "date"},
                    "end": {"type": "string", "format": "date"},
                },
            },
            "service_record": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "branch",
                    "component",
                    "rank_at_separation",
                    "mos_code",
                    "mos_title",
                    "service_start",
                    "service_end",
                    "character_of_service",
                    "deployments_count",
                ],
                "properties": {
                    "branch": {"type": "string"},
                    "component": {"type": "string"},
                    "rank_at_separation": {"type": "string"},
                    "mos_code": {"type": "string"},
                    "mos_title": {"type": "string"},
                    "service_start": {"type": "string", "format": "date"},
                    "service_end": {"type": "string", "format": "date"},
                    "character_of_service": {"type": "string"},
                    "deployments_count": {"type": "integer", "minimum": 0, "maximum": 10},
                },
            },
            "certificate_record": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "certificate_name",
                    "provider",
                    "credential_id",
                    "issue_date",
                    "verification_url",
                    "skills",
                ],
                "properties": {
                    "certificate_name": {"type": "string"},
                    "provider": {"type": "string"},
                    "credential_id": {"type": "string"},
                    "issue_date": {"type": "string", "format": "date"},
                    "expiration_date": {"type": ["string", "null"], "format": "date"},
                    "verification_url": {"type": "string"},
                    "skills": {"type": "array", "items": {"type": "string"}, "minItems": 1},
                },
            },
            "education_record": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "institution_name",
                    "student_number",
                    "program",
                    "credential_awarded",
                    "attendance_start",
                    "attendance_end",
                ],
                "properties": {
                    "institution_name": {"type": "string"},
                    "student_number": {"type": "string"},
                    "program": {"type": "string"},
                    "credential_awarded": {"type": "string"},
                    "attendance_start": {"type": "string", "format": "date"},
                    "attendance_end": {"type": "string", "format": "date"},
                    "gpa": {"type": ["number", "null"]},
                    "graduation_date": {"type": ["string", "null"], "format": "date"},
                },
            },
            "evaluation_record": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "agency",
                    "report_type",
                    "origin_country",
                    "origin_institution",
                    "origin_credential",
                    "us_equivalency",
                    "report_date",
                    "reference_number",
                ],
                "properties": {
                    "agency": {"type": "string"},
                    "report_type": {"type": "string"},
                    "origin_country": {"type": "string"},
                    "origin_institution": {"type": "string"},
                    "origin_credential": {"type": "string"},
                    "us_equivalency": {"type": "string"},
                    "us_gpa": {"type": ["number", "null"]},
                    "report_date": {"type": "string", "format": "date"},
                    "reference_number": {"type": "string"},
                },
            },
            "gpa_summary": {
                "type": "object",
                "additionalProperties": False,
                "required": ["gpa", "scale", "credits_attempted", "credits_earned"],
                "properties": {
                    "gpa": {"type": "number"},
                    "scale": {"type": "number"},
                    "credits_attempted": {"type": "number"},
                    "credits_earned": {"type": "number"},
                },
            },
            "signature_block": {
                "type": "object",
                "additionalProperties": False,
                "required": ["signed_by", "title", "signed_date"],
                "properties": {
                    "signed_by": {"type": "string"},
                    "title": {"type": "string"},
                    "signed_date": {"type": "string", "format": "date"},
                },
            },
            "visual_profile": {
                "type": "object",
                "additionalProperties": False,
                "required": ["style", "paper_tone", "artifact_level"],
                "properties": {
                    "style": {
                        "type": "string",
                        "enum": ["pristine_digital", "dense_text_dump", "scanned_photo"],
                    },
                    "paper_tone": {"type": "string"},
                    "artifact_level": {
                        "type": "string",
                        "enum": ["none", "light", "medium", "heavy"],
                    },
                    "rotation_degrees": {"type": "number"},
                    "blur_px": {"type": "number"},
                    "notes": {"type": "string"},
                },
            },
        },
    }


def mapping(
    source_evidence: str,
    code: str,
    title: str,
    credits: float,
    rationale: str,
) -> dict[str, Any]:
    return {
        "source_evidence": source_evidence,
        "proposed_college_course_code": code,
        "proposed_college_course_title": title,
        "credits": credits,
        "rationale": rationale,
    }


def course(
    course_code: str,
    course_title: str,
    term_label: str,
    year: int,
    credits: float,
    grade: str | None,
    *,
    status: str = "Completed",
    level: str | None = None,
    source_system: str | None = None,
    notes: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "course_code": course_code,
        "course_title": course_title,
        "term_label": term_label,
        "year": year,
        "credits": credits,
        "grade": grade,
        "status": status,
    }
    if level:
        payload["level"] = level
    if source_system:
        payload["source_system"] = source_system
    if notes:
        payload["notes"] = notes
    return payload


def score(test_name: str, section: str, value: float, scale: str, test_date: str) -> dict[str, Any]:
    return {
        "test_name": test_name,
        "section": section,
        "score": value,
        "scale": scale,
        "test_date": test_date,
    }


def ace(
    experience_or_training: str,
    subject: str,
    lower: float,
    upper: float,
    recommendation_basis: str,
) -> dict[str, Any]:
    return {
        "experience_or_training": experience_or_training,
        "subject": subject,
        "lower_division_credits": lower,
        "upper_division_credits": upper,
        "recommendation_basis": recommendation_basis,
    }


def visual(style: str, tone: str, artifact: str, *, rot: float = 0.0, blur: float = 0.0, notes: str = "") -> dict[str, Any]:
    out: dict[str, Any] = {
        "style": style,
        "paper_tone": tone,
        "artifact_level": artifact,
    }
    if rot:
        out["rotation_degrees"] = rot
    if blur:
        out["blur_px"] = blur
    if notes:
        out["notes"] = notes
    return out


def make_doc(
    applicant_id: str,
    index: int,
    *,
    doc_type: str,
    title: str,
    issuer: str,
    issue_date: str,
    fmt: str,
    rendering: str,
    file_name: str,
    page_count: int,
    structured: dict[str, Any],
    gemimg_prompt: str | None = None,
) -> dict[str, Any]:
    doc = {
        "Document_ID": f"{applicant_id}-D{index}",
        "Document_Type": doc_type,
        "Title": title,
        "Issuing_Organization": issuer,
        "Issue_Date": issue_date,
        "Document_Format": fmt,
        "Rendering_Method": rendering,
        "Output_File_Name": file_name,
        "Page_Count": page_count,
        "Structured_Content": structured,
    }
    if gemimg_prompt:
        doc["Gemimg_Prompt"] = gemimg_prompt
    return doc


def veteran_applicant(idx: int, profile: dict[str, Any]) -> dict[str, Any]:
    applicant_id = f"APPL-{idx:03d}"
    name = profile["name"]
    preferred = name.split()[0]
    jst_date = profile["jst_issue_date"]
    secplus_date = profile["secplus_issue_date"]

    service_record = {
        "branch": "U.S. Army",
        "component": profile["component"],
        "rank_at_separation": profile["rank"],
        "mos_code": "42A",
        "mos_title": "Human Resources Specialist",
        "service_start": profile["service_start"],
        "service_end": profile["service_end"],
        "character_of_service": "Honorable",
        "deployments_count": profile["deployments"],
    }

    dd214 = make_doc(
        applicant_id,
        1,
        doc_type="DD214",
        title="Certificate of Release or Discharge from Active Duty (DD Form 214)",
        issuer="Department of Defense",
        issue_date=profile["service_end"],
        fmt="webp",
        rendering="gemimg_scan_webp",
        file_name=profile["dd214_file"],
        page_count=1,
        gemimg_prompt=(
            "Photorealistic scanned DD-214 form on off-white paper, slight 2-degree skew, "
            "mild coffee ring, monochrome copier noise, legible typed fields, Army discharge form, "
            "businesslike desk scan, no hands visible."
        ),
        structured={
            "student_name": name,
            "document_number": profile["dd214_number"],
            "date_range": {"start": profile["service_start"], "end": profile["service_end"]},
            "service_record": service_record,
            "summary_lines": [
                f"Name: {name}",
                "Branch: U.S. Army",
                "MOS: 42A Human Resources Specialist",
                f"Rank at Separation: {profile['rank']}",
                "Character of Service: Honorable",
            ],
            "notes": [
                "Synthetic DD-214 facsimile for demo ingestion only.",
                "Form fields intentionally varied to simulate scan quality issues.",
            ],
            "visual_profile": visual(
                "scanned_photo",
                "warm_offwhite",
                "medium",
                rot=2.0,
                blur=0.8,
                notes="Monochrome artifacting, compression halos, faint fold crease.",
            ),
        },
    )

    jst_courses = [
        course("HR-42A-BLC", "Basic Leader Course", "Military Training", 2012 + profile["offset"], 3.0, None, status="Evaluated", level="Lower", source_system="JST"),
        course("HR-42A-ADV", "Human Resources Specialist Course", "Military Training", 2008 + profile["offset"], 4.0, None, status="Evaluated", level="Lower", source_system="JST"),
        course("ARMY-OPS", "Personnel Administration in Unit Operations", "Military Occupation", 2013 + profile["offset"], 3.0, None, status="Evaluated", level="Upper", source_system="JST"),
    ]
    ace_recs = [
        ace(
            "MOS 42A Duty Performance",
            "Human Resource Management / Personnel Administration",
            3.0,
            3.0,
            "ACE military guide recommendation for Army MOS 42A (skill level reflected on JST).",
        ),
        ace(
            "Army Structured Self-Development + HR systems workflow",
            "Business Communications / Information Systems",
            3.0,
            0.0,
            "ACE recommendation derived from completed military schooling and documented duty assignments.",
        ),
    ]
    jst = make_doc(
        applicant_id,
        2,
        doc_type="JST",
        title="Joint Services Transcript",
        issuer="Joint Services Transcript / American Council on Education",
        issue_date=jst_date,
        fmt="pdf",
        rendering="raw_text_pdf",
        file_name=profile["jst_file"],
        page_count=3,
        structured={
            "student_name": name,
            "student_id_on_document": profile["jst_id"],
            "summary_lines": [
                f"Joint Services Transcript for {name}",
                "Army MOS history includes 42A Human Resources Specialist",
                "ACE credit recommendations included for training and occupational experience",
            ],
            "raw_text_preview": [
                "JOINT SERVICES TRANSCRIPT (UNOFFICIAL COPY FOR REVIEW)",
                f"STUDENT: {name.upper()}   JST ID: {profile['jst_id']}",
                "SERVICE BRANCH: ARMY",
                "PRIMARY MOS: 42A HUMAN RESOURCES SPECIALIST",
                "ACE CREDIT RECOMMENDATIONS:",
                "  - HUMAN RESOURCE MANAGEMENT / PERSONNEL ADMINISTRATION: 3 LL / 3 UL",
                "  - BUSINESS COMMUNICATIONS / INFO SYSTEMS SUPPORT: 3 LL",
            ],
            "courses": jst_courses,
            "ace_recommendations": ace_recs,
            "ai_mapping_hints": [
                mapping(
                    "JST ACE recommendation for MOS 42A (HR / Personnel Administration)",
                    "HRM-ELEC",
                    "Human Resource Management elective credit",
                    3.0,
                    "MOS 42A duties and ACE recommendation align with HR operations and personnel records workflows.",
                ),
                mapping(
                    "JST ACE recommendation for MOS 42A (upper-division HR / personnel)",
                    "HRM-3XX",
                    "Advanced Human Resource Management elective",
                    3.0,
                    "Upper-division ACE recommendation supports leadership-level personnel administration credit review.",
                ),
            ],
            "visual_profile": visual("dense_text_dump", "plain_white", "light", notes="Monospaced utilitarian JST text export style."),
        },
    )

    secplus = make_doc(
        applicant_id,
        3,
        doc_type="CompTIA_SecurityPlus_Certificate",
        title="CompTIA Security+ Certification",
        issuer="CompTIA",
        issue_date=secplus_date,
        fmt="pdf",
        rendering="pristine_pdf",
        file_name=profile["secplus_file"],
        page_count=1,
        structured={
            "student_name": name,
            "certificate_record": {
                "certificate_name": "CompTIA Security+",
                "provider": "CompTIA",
                "credential_id": profile["secplus_id"],
                "issue_date": secplus_date,
                "expiration_date": profile["secplus_expiry"],
                "verification_url": "https://www.certmetrics.com/comptia/public/verification.aspx",
                "skills": [
                    "Threat management",
                    "Network security",
                    "Risk mitigation",
                    "Security operations",
                ],
            },
            "summary_lines": [
                f"CompTIA Security+ digital certificate for {name}",
                f"Credential ID: {profile['secplus_id']}",
                "AI demo hook: maps to IT-253 (Computer Systems Security)",
            ],
            "ai_mapping_hints": [
                mapping(
                    "CompTIA Security+ certificate",
                    "IT-253",
                    "Computer Systems Security",
                    3.0,
                    "Current Security+ coverage aligns with foundational cybersecurity and systems security outcomes.",
                )
            ],
            "visual_profile": visual("pristine_digital", "bright_white", "none", notes="Modern digital certificate with seal and QR-like footer."),
        },
    )

    mapped_courses = [
        mapping(
            "JST MOS 42A ACE recommendation",
            "HRM-ELEC",
            "Human Resource Management elective credit",
            3.0,
            "Personnel administration, records management, and HR workflow experience documented on JST.",
        ),
        mapping(
            "JST MOS 42A ACE upper-division recommendation",
            "HRM-3XX",
            "Upper-level Human Resource Management elective",
            3.0,
            "ACE upper-division recommendation supports advisor review for advanced HR elective placement.",
        ),
        mapping(
            "CompTIA Security+",
            "IT-253",
            "Computer Systems Security",
            3.0,
            "Certification outcomes match course competencies in computer systems security.",
        ),
    ]
    mapped_courses.append(
        mapping(
            "JST training + ACE communication/systems recommendation",
            "BUS/IT-ELEC",
            "Business or IT elective credit",
            3.0,
            "Military training indicates structured administrative systems and business communication skills.",
        )
    )

    return {
        "Applicant_ID": applicant_id,
        "Archetype_Code": "A",
        "Archetype_Label": "Military Veteran Transitioning to Business/IT",
        "Persona": {
            "full_name": name,
            "preferred_name": preferred,
            "career_goal": profile["career_goal"],
            "prior_learning_sources": [
                "U.S. Army service (MOS 42A Human Resources Specialist)",
                "Joint Services Transcript (ACE credit recommendations)",
                "CompTIA Security+ certification",
            ],
            "demo_storyline": profile["storyline"],
        },
        "Target_Program": profile["target_program"],
        "Admissions_Term": "2026FA",
        "Document_Bundle": [dd214, jst, secplus],
        "Expected_AI_Output": {
            "Target_Pathway": profile["target_program"],
            "Pathway_Theme": "Military-to-business/IT accelerated transfer review",
            "Proposed_Transfer_Credits_Total": 12.0,
            "Mapped_Courses": mapped_courses,
            "Remaining_Admissions_Checks": [
                "Confirm official JST delivery status",
                "Verify CompTIA credential active status on evaluation date",
            ],
            "Advisor_Review_Focus": [
                "Approve MOS 42A HR management elective mapping",
                "Determine whether upper-division HR elective can be transcripted directly",
                "Sequence IT-253 with degree plan prerequisites",
            ],
            "Narrative": (
                "Bundle demonstrates cross-domain mapping: Army MOS 42A personnel administration experience "
                "supports Human Resource Management credit consideration, while Security+ yields a direct IT-253 "
                "equivalency for a business/IT transition pathway."
            ),
        },
    }


def scnc_applicant(idx: int, profile: dict[str, Any]) -> dict[str, Any]:
    applicant_id = f"APPL-{idx:03d}"
    name = profile["name"]
    preferred = name.split()[0]

    hs = make_doc(
        applicant_id,
        1,
        doc_type="High_School_Attestation_Form",
        title="High School Completion Attestation",
        issuer=profile["hs_issuer"],
        issue_date=profile["hs_attestation_date"],
        fmt="webp",
        rendering="gemimg_scan_webp",
        file_name=profile["hs_file"],
        page_count=1,
        gemimg_prompt=(
            "Realistic scanned high school completion attestation form, blue ink signature, slight page curl, "
            "fax artifacts, grayscale office scan, dated form with stamp and checkbox fields, legible typed text."
        ),
        structured={
            "student_name": name,
            "summary_lines": [
                "High school completion attestation form",
                f"School/attestor: {profile['hs_issuer']}",
                f"Attestation date: {profile['hs_attestation_date']}",
            ],
            "signature_block": {
                "signed_by": profile["hs_signer"],
                "title": "Registrar / Records Officer",
                "signed_date": profile["hs_attestation_date"],
            },
            "notes": ["Synthetic form included to test low-quality scanned admissions paperwork ingestion."],
            "visual_profile": visual(
                "scanned_photo",
                "yellowed_offwhite",
                "medium",
                rot=-1.6,
                blur=0.6,
                notes="Fax streaks and toner dropout around signature block.",
            ),
        },
    )

    cc_courses = [
        course("PSY101", "Intro to Psychology", profile["cc_term_1_label"], profile["cc_year_1"], 3.0, profile["psy_grade"], source_system="CommunityCollege"),
        course("ENG111", "English Composition I", profile["cc_term_1_label"], profile["cc_year_1"], 3.0, profile["eng_grade"], source_system="CommunityCollege"),
        course("MAT092", "Beginning Algebra", profile["cc_term_1_label"], profile["cc_year_1"], 3.0, profile["alg_grade"], source_system="CommunityCollege"),
        course("CIS105", "Computer Applications", profile["cc_term_2_label"], profile["cc_year_2"], 3.0, profile["cis_grade"], source_system="CommunityCollege"),
    ]
    cc_transcript = make_doc(
        applicant_id,
        2,
        doc_type="Community_College_Transcript",
        title=f"Official Transcript - {profile['cc_name']}",
        issuer=profile["cc_name"],
        issue_date=profile["cc_issue_date"],
        fmt="webp",
        rendering="gemimg_scan_webp",
        file_name=profile["cc_file"],
        page_count=1,
        gemimg_prompt=(
            "Photorealistic 2000s community college transcript scan, monochrome copier output, slightly skewed, "
            "faint staple shadow, old registrar layout with course table and GPA section, readable row text."
        ),
        structured={
            "student_name": name,
            "student_id_on_document": profile["cc_student_id"],
            "education_record": {
                "institution_name": profile["cc_name"],
                "student_number": profile["cc_student_id"],
                "program": "General Studies (no credential completed)",
                "credential_awarded": "No Credential",
                "attendance_start": f"{profile['cc_year_1']}-09-01",
                "attendance_end": f"{profile['cc_year_2']}-05-20",
                "gpa": profile["cc_gpa"],
                "graduation_date": None,
            },
            "gpa_summary": {
                "gpa": profile["cc_gpa"],
                "scale": 4.0,
                "credits_attempted": 12.0,
                "credits_earned": 12.0,
            },
            "summary_lines": [
                f"Legacy transcript from {profile['cc_name']}",
                f"Attendance years: {profile['cc_year_1']}-{profile['cc_year_2']}",
                "Key demo hook: includes Intro to Psychology for instant transfer mapping",
            ],
            "courses": cc_courses,
            "ai_mapping_hints": [
                mapping(
                    f"{profile['cc_name']} PSY101 Intro to Psychology",
                    "PSY-108",
                    "Introduction to Psychology",
                    3.0,
                    "Standard lower-division psychology course with transferable grade.",
                )
            ],
            "visual_profile": visual(
                "scanned_photo",
                "gray_white",
                "heavy",
                rot=2.2,
                blur=1.1,
                notes="2000s copier compression, edge shadowing, mild speckle noise.",
            ),
        },
    )

    sophia_courses = [
        course("SOPH-STAT1001", "Introduction to Statistics", "Self-Paced", 2024, 3.0, "Pass", source_system="Sophia"),
        course("SOPH-PM1001", "Project Management", "Self-Paced", 2025, 3.0, "Pass", source_system="Sophia"),
        course("SOPH-BUS1001", "Business Communication", "Self-Paced", 2025, 3.0, "Pass", source_system="Sophia"),
    ]
    sophia = make_doc(
        applicant_id,
        3,
        doc_type="Sophia_Learning_Transcript",
        title="Sophia Learning Transcript",
        issuer="Sophia Learning",
        issue_date=profile["sophia_issue_date"],
        fmt="pdf",
        rendering="raw_text_pdf",
        file_name=profile["sophia_file"],
        page_count=2,
        structured={
            "student_name": name,
            "summary_lines": [
                "Sophia Learning transcript export",
                "Competency-based coursework transcripted as pass/fail",
            ],
            "raw_text_preview": [
                "SOPHIA LEARNING UNOFFICIAL TRANSCRIPT",
                f"LEARNER: {name.upper()}",
                "COURSES COMPLETED",
                " - Introduction to Statistics ........ PASS .... 3.0 credits",
                " - Project Management ................ PASS .... 3.0 credits",
                " - Business Communication ............ PASS .... 3.0 credits",
            ],
            "courses": sophia_courses,
            "visual_profile": visual("dense_text_dump", "plain_white", "light", notes="Plain text export PDF for utility-style parser testing."),
        },
    )

    google_cert = make_doc(
        applicant_id,
        4,
        doc_type="Google_Project_Management_Certificate",
        title="Google Project Management Professional Certificate",
        issuer="Google / Coursera",
        issue_date=profile["google_issue_date"],
        fmt="pdf",
        rendering="pristine_pdf",
        file_name=profile["google_file"],
        page_count=1,
        structured={
            "student_name": name,
            "certificate_record": {
                "certificate_name": "Google Project Management Professional Certificate",
                "provider": "Google via Coursera",
                "credential_id": profile["google_cred_id"],
                "issue_date": profile["google_issue_date"],
                "expiration_date": None,
                "verification_url": "https://coursera.org/verify/professional-cert",
                "skills": [
                    "Project initiation",
                    "Agile project management",
                    "Stakeholder communication",
                    "Risk and schedule management",
                ],
            },
            "summary_lines": [
                "Google Project Management Professional Certificate",
                "AI demo hook: maps to QSO340, QSO355, QSO420, QSO435 (12 credits)",
            ],
            "ai_mapping_hints": [
                mapping("Google PM Certificate", "QSO340", "Project Management", 3.0, "Certificate competency coverage aligns to project management fundamentals."),
                mapping("Google PM Certificate", "QSO355", "Resource Estimating and Scheduling", 3.0, "Includes scheduling, estimation, and planning modules."),
                mapping("Google PM Certificate", "QSO420", "Integrated Cost and Schedule Control", 3.0, "Includes tracking, reporting, and project controls concepts."),
                mapping("Google PM Certificate", "QSO435", "Adaptive Project Management", 3.0, "Agile/scrum and adaptive delivery content included."),
            ],
            "visual_profile": visual("pristine_digital", "bright_white", "none", notes="Modern certificate layout with colored branding stripe."),
        },
    )

    mapped = [
        mapping(
            f"{profile['cc_name']} PSY101 Intro to Psychology",
            "PSY-108",
            "Introduction to Psychology",
            3.0,
            "Legacy community college course transfers as foundational psychology credit.",
        ),
        mapping("Google Project Management Certificate", "QSO340", "Project Management", 3.0, "Direct certificate-to-course articulation."),
        mapping("Google Project Management Certificate", "QSO355", "Resource Estimating and Scheduling", 3.0, "Direct certificate-to-course articulation."),
        mapping("Google Project Management Certificate", "QSO420", "Integrated Cost and Schedule Control", 3.0, "Direct certificate-to-course articulation."),
        mapping("Google Project Management Certificate", "QSO435", "Adaptive Project Management", 3.0, "Direct certificate-to-course articulation."),
    ]
    mapped.append(
        mapping(
            "Sophia Introduction to Statistics",
            "MAT/STAT-ELEC",
            "Statistics elective (advisor review)",
            3.0,
            "Sophia ACE-backed statistics course is commonly evaluated for lower-division statistics transfer.",
        )
    )

    return {
        "Applicant_ID": applicant_id,
        "Archetype_Code": "B",
        "Archetype_Label": "SCNC Corporate Upskiller (Some College, No Credential)",
        "Persona": {
            "full_name": name,
            "preferred_name": preferred,
            "career_goal": profile["career_goal"],
            "prior_learning_sources": [
                "High school completion documentation",
                f"Regional community college coursework at {profile['cc_name']}",
                "Sophia Learning self-paced coursework",
                "Google Project Management Professional Certificate",
            ],
            "demo_storyline": profile["storyline"],
        },
        "Target_Program": "BS in Operations Management",
        "Admissions_Term": "2026FA",
        "Document_Bundle": [hs, cc_transcript, sophia, google_cert],
        "Expected_AI_Output": {
            "Target_Pathway": "BS in Operations Management",
            "Pathway_Theme": "SCNC fast-track credit aggregation across old and new learning",
            "Proposed_Transfer_Credits_Total": 18.0,
            "Mapped_Courses": mapped,
            "Remaining_Admissions_Checks": [
                "Confirm official community college transcript source",
                "Verify Coursera certificate credential link if required by policy",
                "Finalize Sophia transfer policy limits for current catalog year",
            ],
            "Advisor_Review_Focus": [
                "Confirm Google PM articulation pack (QSO340/QSO355/QSO420/QSO435)",
                "Review math placement impact of MAT092 legacy coursework",
                "Sequence remaining degree requirements after 12-credit QSO jump",
            ],
            "Narrative": (
                "Bundle demonstrates high-value aggregation for a working adult with some college, no credential: "
                "the AI picks up the old Intro to Psychology course from a noisy transcript, adds modern Sophia work, "
                "and applies a 12-credit Google PM articulation block to accelerate the pathway."
            ),
        },
    }


def international_applicant(idx: int, profile: dict[str, Any]) -> dict[str, Any]:
    applicant_id = f"APPL-{idx:03d}"
    name = profile["name"]
    preferred = name.split()[0]
    eval_doc_type = "WES_Course_By_Course_Evaluation" if profile["agency"] == "WES" else "ECE_Course_By_Course_Evaluation"

    evaluation = make_doc(
        applicant_id,
        1,
        doc_type=eval_doc_type,
        title=f"{profile['agency']} Course-by-Course Credential Evaluation",
        issuer=profile["agency"],
        issue_date=profile["report_date"],
        fmt="pdf",
        rendering="pristine_pdf",
        file_name=profile["eval_file"],
        page_count=2,
        structured={
            "student_name": name,
            "evaluation_record": {
                "agency": profile["agency"],
                "report_type": "Course-by-Course",
                "origin_country": profile["country"],
                "origin_institution": profile["institution"],
                "origin_credential": profile["credential"],
                "us_equivalency": profile["us_equivalency"],
                "us_gpa": profile["us_gpa"],
                "report_date": profile["report_date"],
                "reference_number": profile["ref_number"],
            },
            "summary_lines": [
                f"{profile['agency']} course-by-course evaluation report",
                f"Origin credential: {profile['credential']} ({profile['country']})",
                f"U.S. equivalency: {profile['us_equivalency']}",
            ],
            "courses": deepcopy(profile["evaluated_courses"]),
            "gpa_summary": {
                "gpa": profile["us_gpa"],
                "scale": 4.0,
                "credits_attempted": profile["eval_credits"],
                "credits_earned": profile["eval_credits"],
            },
            "ai_mapping_hints": deepcopy(profile["eval_mapping_hints"]),
            "visual_profile": visual("pristine_digital", "bright_white", "none", notes="Credential evaluation report table layout with agency header."),
        },
    )

    toefl = make_doc(
        applicant_id,
        2,
        doc_type="TOEFL_Score_Report",
        title="TOEFL iBT Score Report",
        issuer="ETS",
        issue_date=profile["toefl_date"],
        fmt="pdf",
        rendering="pristine_pdf",
        file_name=profile["toefl_file"],
        page_count=1,
        structured={
            "student_name": name,
            "document_number": profile["toefl_registration"],
            "summary_lines": [
                "Official TOEFL iBT score report",
                f"Total score: {profile['toefl_total']}",
                "Used for English proficiency review in admissions workflow",
            ],
            "scores": [
                score("TOEFL iBT", "Reading", profile["toefl_breakdown"]["Reading"], "0-30", profile["toefl_date"]),
                score("TOEFL iBT", "Listening", profile["toefl_breakdown"]["Listening"], "0-30", profile["toefl_date"]),
                score("TOEFL iBT", "Speaking", profile["toefl_breakdown"]["Speaking"], "0-30", profile["toefl_date"]),
                score("TOEFL iBT", "Writing", profile["toefl_breakdown"]["Writing"], "0-30", profile["toefl_date"]),
                score("TOEFL iBT", "Total", profile["toefl_total"], "0-120", profile["toefl_date"]),
            ],
            "notes": [f"ETS registration number {profile['toefl_registration']}"],
            "visual_profile": visual("pristine_digital", "bright_white", "none", notes="Digital score report with boxed section scores."),
        },
    )

    mapped = deepcopy(profile["eval_mapping_hints"])
    mapped.append(
        mapping(
            f"TOEFL iBT total {profile['toefl_total']}",
            "ENGL-PROF",
            "English proficiency satisfied (admissions requirement)",
            0.0,
            "TOEFL score meets demonstration threshold for English proficiency review; no transfer credits awarded.",
        )
    )

    return {
        "Applicant_ID": applicant_id,
        "Archetype_Code": "C",
        "Archetype_Label": "International Adult Learner",
        "Persona": {
            "full_name": name,
            "preferred_name": preferred,
            "career_goal": profile["career_goal"],
            "prior_learning_sources": [
                f"{profile['credential']} from {profile['institution']} ({profile['country']})",
                f"{profile['agency']} course-by-course U.S. credential evaluation",
                "TOEFL iBT score report",
            ],
            "demo_storyline": profile["storyline"],
        },
        "Target_Program": profile["target_program"],
        "Admissions_Term": "2026FA",
        "Document_Bundle": [evaluation, toefl],
        "Expected_AI_Output": {
            "Target_Pathway": profile["target_program"],
            "Pathway_Theme": "International transfer with credential evaluation + language verification",
            "Proposed_Transfer_Credits_Total": profile["proposed_transfer_total"],
            "Mapped_Courses": mapped,
            "Remaining_Admissions_Checks": [
                "Confirm official evaluator PDF authenticity/reference number",
                "Validate TOEFL score delivery policy window",
            ],
            "Advisor_Review_Focus": [
                "Review major-course equivalencies from evaluator report",
                "Confirm residency and catalog requirements for remaining credits",
            ],
            "Narrative": (
                "Bundle shows international admissions acceleration: a course-by-course evaluation supplies U.S.-equivalent "
                "credit details while the TOEFL report resolves English proficiency in the same intake pass."
            ),
        },
    }


def build_dataset() -> dict[str, Any]:
    veterans = [
        {
            "name": "Miguel Rivera",
            "component": "Active Duty",
            "rank": "SSG / E-6",
            "service_start": "2006-08-15",
            "service_end": "2014-09-30",
            "deployments": 1,
            "offset": 0,
            "jst_issue_date": "2024-11-12",
            "secplus_issue_date": "2025-06-21",
            "secplus_expiry": "2028-06-21",
            "secplus_id": "COMP-SEC-8A1R-1927",
            "jst_id": "JST-AR-5729441",
            "dd214_number": "DD214-8471-AR-2006",
            "dd214_file": "IMG_1044_dd214_rivera.webp",
            "jst_file": "JST_MRivera_2024-11-12.pdf",
            "secplus_file": "CompTIA_SecurityPlus_Miguel_Rivera.pdf",
            "target_program": "BS in Information Technologies",
            "career_goal": "Move from Army HR operations into corporate HRIS and cybersecurity-aware IT support roles.",
            "storyline": "Veteran with strong personnel records experience wants a business/IT degree path without losing military credit.",
        },
        {
            "name": "Ashley Kim",
            "component": "Army Reserve",
            "rank": "SGT / E-5",
            "service_start": "2009-03-10",
            "service_end": "2018-05-18",
            "deployments": 0,
            "offset": 1,
            "jst_issue_date": "2025-01-09",
            "secplus_issue_date": "2025-09-04",
            "secplus_expiry": "2028-09-04",
            "secplus_id": "COMP-SEC-4K2M-0083",
            "jst_id": "JST-AK-4482020",
            "dd214_number": "DD214-1120-AK-2009",
            "dd214_file": "scan_ashley_kim_dd214_final.webp",
            "jst_file": "JST_AKim_reserve_copy.pdf",
            "secplus_file": "SecurityPlus_Certificate_AshleyKim_2025.pdf",
            "target_program": "BS in Business Administration",
            "career_goal": "Pivot into HR operations and compliance technology roles in a healthcare employer.",
            "storyline": "Reserve service and recent IT certification create a mixed HR/IT profile that benefits from fast cross-walking.",
        },
        {
            "name": "Darnell Turner",
            "component": "Active Duty",
            "rank": "SFC / E-7",
            "service_start": "2004-01-12",
            "service_end": "2016-02-01",
            "deployments": 2,
            "offset": -1,
            "jst_issue_date": "2024-08-28",
            "secplus_issue_date": "2024-12-10",
            "secplus_expiry": "2027-12-10",
            "secplus_id": "COMP-SEC-7D9T-5512",
            "jst_id": "JST-DT-3319475",
            "dd214_number": "DD214-5399-DT-2004",
            "dd214_file": "phone-photo_dd214_turner.webp",
            "jst_file": "Turner_Darnell_JST_unofficial.pdf",
            "secplus_file": "comptia_security_plus_turner.pdf",
            "target_program": "BS in Business Administration",
            "career_goal": "Translate military personnel leadership into civilian HR management while keeping IT security credibility.",
            "storyline": "Senior NCO HR specialist needs rapid review of ACE and certification credit to choose the best degree track.",
        },
        {
            "name": "Brianna Patel",
            "component": "National Guard",
            "rank": "SSG / E-6",
            "service_start": "2010-07-06",
            "service_end": "2022-10-14",
            "deployments": 1,
            "offset": 2,
            "jst_issue_date": "2025-03-03",
            "secplus_issue_date": "2025-11-16",
            "secplus_expiry": "2028-11-16",
            "secplus_id": "COMP-SEC-2P7L-7644",
            "jst_id": "JST-BP-9021547",
            "dd214_number": "DD214-2886-BP-2010",
            "dd214_file": "BPatel_DD214_scan.webp",
            "jst_file": "JST_BriannaPatel_guard.pdf",
            "secplus_file": "BriannaPatel_SecurityPlus_Credential.pdf",
            "target_program": "BS in Information Technologies",
            "career_goal": "Advance from administrative roles into IT governance and systems security support.",
            "storyline": "Guard HR specialist completed Security+ and wants immediate visibility into transfer credit before enrolling.",
        },
    ]

    scncs = [
        {
            "name": "Nicole Hernandez",
            "hs_issuer": "Springfield Adult Learning Center",
            "hs_signer": "L. McCarthy",
            "hs_attestation_date": "2025-09-11",
            "hs_file": "hs_attestation_signed_nhernandez.webp",
            "cc_name": "Bunker Hill Community College",
            "cc_student_id": "BH-00492177",
            "cc_year_1": 2007,
            "cc_year_2": 2008,
            "cc_term_1_label": "Fall",
            "cc_term_2_label": "Spring",
            "psy_grade": "B+",
            "eng_grade": "B",
            "alg_grade": "C+",
            "cis_grade": "A-",
            "cc_gpa": 3.11,
            "cc_issue_date": "2025-10-02",
            "cc_file": "scan0001_BHCC_transcript_2008.webp",
            "sophia_issue_date": "2025-12-06",
            "sophia_file": "SophiaLearning-Transcript-NH-2025.pdf",
            "google_issue_date": "2025-11-21",
            "google_cred_id": "GPM-NH-8452-2025",
            "google_file": "Google_Project_Management_Certificate_Nicole_Hernandez.pdf",
            "career_goal": "Move from office coordinator work into operations/project management with a bachelor's pathway.",
            "storyline": "Classic SCNC profile: old community college credits, new online upskilling, and a high-value Google PM certificate.",
        },
        {
            "name": "Brandon ONeal",
            "hs_issuer": "Metro Regional Adult Education Program",
            "hs_signer": "T. Alvarez",
            "hs_attestation_date": "2025-08-19",
            "hs_file": "attestation_form_boneal_scan.webp",
            "cc_name": "Middlesex Community College",
            "cc_student_id": "MX-7712043",
            "cc_year_1": 2004,
            "cc_year_2": 2005,
            "cc_term_1_label": "Fall",
            "cc_term_2_label": "Spring",
            "psy_grade": "A-",
            "eng_grade": "B-",
            "alg_grade": "B",
            "cis_grade": "B+",
            "cc_gpa": 3.22,
            "cc_issue_date": "2025-09-30",
            "cc_file": "mcc_old_transcript_copy_2005.webp",
            "sophia_issue_date": "2025-11-27",
            "sophia_file": "BrandonONeal_Sophia_Transcript.pdf",
            "google_issue_date": "2025-10-18",
            "google_cred_id": "GPM-BO-1922-2025",
            "google_file": "BrandonONeal_GooglePM_ProfCert.pdf",
            "career_goal": "Grow from warehouse team lead to operations project coordinator in manufacturing.",
            "storyline": "Has old credits and recent self-paced coursework but needs quick clarity on what still counts.",
        },
        {
            "name": "Tasha Nguyen",
            "hs_issuer": "North Shore Adult Diploma Office",
            "hs_signer": "R. Patel",
            "hs_attestation_date": "2025-07-08",
            "hs_file": "HS_completion_attestation_tnguyen.webp",
            "cc_name": "Northern Essex Community College",
            "cc_student_id": "NE-229915",
            "cc_year_1": 2002,
            "cc_year_2": 2003,
            "cc_term_1_label": "Spring",
            "cc_term_2_label": "Fall",
            "psy_grade": "B",
            "eng_grade": "A-",
            "alg_grade": "C",
            "cis_grade": "B",
            "cc_gpa": 2.94,
            "cc_issue_date": "2025-09-04",
            "cc_file": "NECC_transcript_scanned_03.webp",
            "sophia_issue_date": "2025-10-29",
            "sophia_file": "SophiaTranscript_TNguyen_102925.pdf",
            "google_issue_date": "2025-12-01",
            "google_cred_id": "GPM-TN-7710-2025",
            "google_file": "GooglePMCert_TashaNguyen.pdf",
            "career_goal": "Transition from customer service supervision to project operations and process improvement.",
            "storyline": "Long gap since community college makes the AI transcript read/normalize capability especially compelling.",
        },
        {
            "name": "Kevin Morales",
            "hs_issuer": "City Schools Records Verification Office",
            "hs_signer": "J. Bennett",
            "hs_attestation_date": "2025-10-03",
            "hs_file": "kmorales_hs_attestation_scan.webp",
            "cc_name": "Quinsigamond Community College",
            "cc_student_id": "QCC-518884",
            "cc_year_1": 2009,
            "cc_year_2": 2010,
            "cc_term_1_label": "Fall",
            "cc_term_2_label": "Spring",
            "psy_grade": "A",
            "eng_grade": "B+",
            "alg_grade": "B-",
            "cis_grade": "A-",
            "cc_gpa": 3.45,
            "cc_issue_date": "2025-11-14",
            "cc_file": "qcc_transcript_2010_scan-copy.webp",
            "sophia_issue_date": "2025-12-19",
            "sophia_file": "KMorales_Sophia_Learning_Transcript.pdf",
            "google_issue_date": "2025-12-09",
            "google_cred_id": "GPM-KM-3348-2025",
            "google_file": "Google_Project_Mgmt_Certificate_KMorales.pdf",
            "career_goal": "Advance from field service logistics to operations program management.",
            "storyline": "Strong mix of older academic credits and modern credentialing for a dramatic credit-jump demo.",
        },
    ]

    intl = [
        {
            "name": "Priya Nair",
            "agency": "WES",
            "country": "India",
            "institution": "University of Mumbai",
            "credential": "Bachelor of Commerce",
            "us_equivalency": "U.S. Bachelor's degree (4 years) in Business Administration",
            "us_gpa": 3.18,
            "report_date": "2025-11-05",
            "ref_number": "WES-7349912",
            "eval_file": "WES_CourseByCourse_PriyaNair.pdf",
            "eval_credits": 90.0,
            "evaluated_courses": [
                course("WES-EVAL-ACC", "Financial Accounting", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="WES"),
                course("WES-EVAL-MKT", "Principles of Marketing", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="WES"),
                course("WES-EVAL-MGMT", "Principles of Management", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="WES"),
                course("WES-EVAL-ECON", "Microeconomics", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="WES"),
            ],
            "eval_mapping_hints": [
                mapping("WES course equivalency: Financial Accounting", "ACC-201", "Financial Accounting", 3.0, "Evaluator identifies equivalent lower-division accounting coursework."),
                mapping("WES course equivalency: Principles of Management", "BUS-210", "Managing and Leading in Business", 3.0, "Management fundamentals align to business core outcomes."),
            ],
            "toefl_date": "2025-09-17",
            "toefl_registration": "ETS-IBT-99150012",
            "toefl_breakdown": {"Reading": 26, "Listening": 24, "Speaking": 23, "Writing": 25},
            "toefl_total": 98,
            "toefl_file": "TOEFL_iBT_PriyaNair_2025.pdf",
            "target_program": "BS in Business Administration",
            "proposed_transfer_total": 60.0,
            "career_goal": "Move into U.S.-based operations and finance management after relocating.",
            "storyline": "International applicant needs simultaneous credential evaluation ingestion and English proficiency verification.",
        },
        {
            "name": "Wei Chen",
            "agency": "ECE",
            "country": "China",
            "institution": "Shanghai Open University",
            "credential": "Associate Degree in Information Technology",
            "us_equivalency": "U.S. Associate degree in Information Technology",
            "us_gpa": 3.01,
            "report_date": "2025-10-21",
            "ref_number": "ECE-8821045",
            "eval_file": "ECE_Evaluation_WeiChen_course_by_course.pdf",
            "eval_credits": 63.0,
            "evaluated_courses": [
                course("ECE-EVAL-PROG", "Programming Fundamentals", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="ECE"),
                course("ECE-EVAL-NET", "Computer Networking", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="ECE"),
                course("ECE-EVAL-DB", "Database Concepts", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="ECE"),
                course("ECE-EVAL-MATH", "Discrete Mathematics", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="ECE"),
            ],
            "eval_mapping_hints": [
                mapping("ECE evaluated course: Computer Networking", "IT-212", "Introduction to Computer Networks", 3.0, "Evaluator course equivalency aligns with lower-division networking outcomes."),
                mapping("ECE evaluated course: Database Concepts", "IT-235", "Database Design", 3.0, "Database fundamentals are suitable for transfer articulation review."),
            ],
            "toefl_date": "2025-08-28",
            "toefl_registration": "ETS-IBT-99200418",
            "toefl_breakdown": {"Reading": 23, "Listening": 22, "Speaking": 21, "Writing": 24},
            "toefl_total": 90,
            "toefl_file": "TOEFL_WeiChen_official_score_report.pdf",
            "target_program": "BS in Information Technologies",
            "proposed_transfer_total": 45.0,
            "career_goal": "Complete a U.S. IT bachelor's while working in technical support.",
            "storyline": "ECE report plus TOEFL lets the AI intake both transfer and language documentation in one pass.",
        },
        {
            "name": "Maria Lopes",
            "agency": "WES",
            "country": "Brazil",
            "institution": "Universidade Paulista",
            "credential": "Tecnologo em Logistica",
            "us_equivalency": "U.S. Associate degree in Logistics / Operations",
            "us_gpa": 3.34,
            "report_date": "2025-12-02",
            "ref_number": "WES-7411228",
            "eval_file": "WES_MariaLopes_CourseByCourse_Report.pdf",
            "eval_credits": 66.0,
            "evaluated_courses": [
                course("WES-EVAL-LOG", "Logistics Management", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="WES"),
                course("WES-EVAL-SCM", "Supply Chain Fundamentals", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="WES"),
                course("WES-EVAL-QM", "Quality Management", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="WES"),
                course("WES-EVAL-STATS", "Business Statistics", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="WES"),
            ],
            "eval_mapping_hints": [
                mapping("WES evaluated course: Logistics Management", "QSO-330", "Logistics Management", 3.0, "Evaluator's translated course content matches logistics management competencies."),
                mapping("WES evaluated course: Business Statistics", "QSO/STAT-ELEC", "Business Statistics elective", 3.0, "Transferable quantitative business/statistics content."),
            ],
            "toefl_date": "2025-09-29",
            "toefl_registration": "ETS-IBT-99087165",
            "toefl_breakdown": {"Reading": 24, "Listening": 23, "Speaking": 24, "Writing": 23},
            "toefl_total": 94,
            "toefl_file": "TOEFL_MariaLopes_ETS_Report.pdf",
            "target_program": "BS in Operations Management",
            "proposed_transfer_total": 48.0,
            "career_goal": "Advance into supply chain and operations leadership in a U.S. employer.",
            "storyline": "International transfer into operations management with evaluator report and TOEFL ready for same-day review.",
        },
        {
            "name": "Samuel Ofori",
            "agency": "ECE",
            "country": "Ghana",
            "institution": "Kumasi Technical University",
            "credential": "Higher National Diploma in Business Studies",
            "us_equivalency": "U.S. Associate degree in Business",
            "us_gpa": 2.92,
            "report_date": "2025-10-07",
            "ref_number": "ECE-8793310",
            "eval_file": "ECE_SamuelOfori_Credential_Evaluation.pdf",
            "eval_credits": 60.0,
            "evaluated_courses": [
                course("ECE-EVAL-BUSCOM", "Business Communication", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="ECE"),
                course("ECE-EVAL-MGMT", "Management Principles", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="ECE"),
                course("ECE-EVAL-ACC", "Accounting Principles", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="ECE"),
                course("ECE-EVAL-MKT", "Marketing Principles", "Evaluated", 2025, 3.0, None, status="Evaluated", source_system="ECE"),
            ],
            "eval_mapping_hints": [
                mapping("ECE evaluated course: Management Principles", "BUS-210", "Managing and Leading in Business", 3.0, "Foundational management content transfers to business core review."),
                mapping("ECE evaluated course: Business Communication", "BUS-COMM-ELEC", "Business Communication elective", 3.0, "Communication content is directly relevant to business communication requirements."),
            ],
            "toefl_date": "2025-08-14",
            "toefl_registration": "ETS-IBT-99311804",
            "toefl_breakdown": {"Reading": 21, "Listening": 23, "Speaking": 22, "Writing": 21},
            "toefl_total": 87,
            "toefl_file": "SamuelOfori_TOEFL_iBT_ScoreReport.pdf",
            "target_program": "BS in Business Administration",
            "proposed_transfer_total": 42.0,
            "career_goal": "Complete a bachelor's in business while continuing full-time employment.",
            "storyline": "International adult learner needs rapid clarity on how prior HND coursework converts into a U.S. degree pathway.",
        },
    ]

    applicants: list[dict[str, Any]] = []
    for i, profile in enumerate(veterans, start=1):
        applicants.append(veteran_applicant(i, profile))
    for i, profile in enumerate(scncs, start=5):
        applicants.append(scnc_applicant(i, profile))
    for i, profile in enumerate(intl, start=9):
        applicants.append(international_applicant(i, profile))

    return {
        "dataset_id": "super-fast-ai-credit-checking.synthetic-applicant-bundles.v1",
        "generated_on": GENERATED_ON,
        "dataset_notes": [
            "Synthetic records only; names, IDs, and credentials are fictitious.",
            "Document_Bundle arrays intentionally mix pristine, dense-text, and scan-style artifacts for ingestion testing.",
            "SCNC bundles include both high school attestation and Sophia transcript to satisfy multiple demo scenarios.",
        ],
        "applicants": applicants,
    }


def swap_suffix(file_name: str, suffix: str) -> str:
    return str(Path(file_name).with_suffix(suffix))


def get_doc(applicant: dict[str, Any], doc_type: str) -> dict[str, Any]:
    for doc in applicant["Document_Bundle"]:
        if doc["Document_Type"] == doc_type:
            return doc
    raise KeyError(f"Document type not found for {applicant['Applicant_ID']}: {doc_type}")


def ensure_notes(doc: dict[str, Any]) -> list[str]:
    structured = doc["Structured_Content"]
    notes = structured.setdefault("notes", [])
    return notes


def inferred_gemimg_prompt(doc: dict[str, Any]) -> str:
    doc_type = doc["Document_Type"]
    sc = doc["Structured_Content"]
    student = sc.get("student_name", "adult learner")
    base_prompts = {
        "DD214": (
            "Photorealistic smartphone photo of a printed DD-214 discharge form on a dark desk, "
            "slight perspective skew, grayscale copier text, faint coffee ring, mild motion blur, "
            "realistic paper texture, legible form labels, no hands."
        ),
        "JST": (
            "Photorealistic scan/photo of a Joint Services Transcript page, dense monospaced text table, "
            "Army transcript formatting, ACE credit recommendation section visible, slight skew, scanner noise, "
            "high OCR-friendly contrast with realistic artifacts."
        ),
        "CompTIA_SecurityPlus_Certificate": (
            "Photorealistic phone screenshot or printed certificate photo of a modern CompTIA Security+ certificate, "
            "clean digital certificate styling, seal/badge visible, slight glare and perspective, readable name and credential area."
        ),
        "High_School_Attestation_Form": (
            "Photorealistic scanned high school completion attestation form, checkbox fields, blue-ink signature, "
            "fax artifacts, slightly yellowed paper, office copier grain, mild skew."
        ),
        "Community_College_Transcript": (
            "Photorealistic 2000s community college transcript scan, monochrome registrar transcript table, "
            "staple shadow, slight 2-degree skew, copier speckle noise, readable course rows and GPA section."
        ),
        "Sophia_Learning_Transcript": (
            "Photorealistic screenshot/printout of a Sophia Learning transcript export, simple tabular course completion list, "
            "text-heavy layout, slight screen moire or print scan noise, readable rows."
        ),
        "Google_Project_Management_Certificate": (
            "Photorealistic screenshot or printed certificate photo of a Google Project Management Professional Certificate, "
            "modern Coursera/Google certificate layout, colored branding strip, slight desk shadow, readable credential block."
        ),
        "WES_Course_By_Course_Evaluation": (
            "Photorealistic photo of a printed WES course-by-course credential evaluation report page, "
            "formal report header, table of evaluated courses, slight page curl and shadow, high-detail scan quality."
        ),
        "ECE_Course_By_Course_Evaluation": (
            "Photorealistic photo of a printed ECE credential evaluation report page, formal evaluation header and table, "
            "mild skew, office lighting shadow, legible academic equivalency lines."
        ),
        "TOEFL_Score_Report": (
            "Photorealistic photo of a printed TOEFL iBT score report on a desk, boxed section scores, "
            "slight fold crease, mild shadow and lens distortion, readable score fields."
        ),
    }
    prompt = base_prompts.get(doc_type, "Photorealistic scanned educational document with realistic office artifacts.")
    vp = sc.get("visual_profile", {})
    artifact = vp.get("artifact_level")
    if artifact in {"medium", "heavy"}:
        prompt += " Include subtle copier dust, compression noise, and edge shadowing."
    if doc_type == "JST":
        prompt += " Show a line mentioning MOS 42A Human Resources Specialist."
    if student:
        prompt += f" Synthetic demo document for {student}."
    return prompt


def set_doc_variant(
    doc: dict[str, Any],
    *,
    fmt: str,
    rendering: str,
    single_page_image: bool = False,
) -> None:
    old_fmt = doc["Document_Format"]
    doc["Document_Format"] = fmt
    doc["Rendering_Method"] = rendering
    doc["Output_File_Name"] = swap_suffix(doc["Output_File_Name"], f".{fmt}")

    if fmt == "webp":
        if single_page_image and doc.get("Page_Count", 1) != 1:
            notes = ensure_notes(doc)
            notes.append(
                "Applicant uploaded a single image capture of this document (page 1 / summary page only); remaining pages may be requested."
            )
            doc["Page_Count"] = 1
        doc["Gemimg_Prompt"] = inferred_gemimg_prompt(doc)
    else:
        doc.pop("Gemimg_Prompt", None)
        if fmt == "txt":
            # Text dumps commonly collapse multi-page content into a single file export.
            if old_fmt != "txt":
                notes = ensure_notes(doc)
                notes.append("Content provided as a plain-text export file instead of scanned pages.")


def apply_realistic_format_mix(dataset: dict[str, Any]) -> dict[str, Any]:
    """Adjust document formats so bundles look like real user-submitted upload mixes."""

    variant_plan: dict[str, dict[str, tuple[str, str, bool]]] = {
        # A: veteran bundles
        "APPL-001": {
            "DD214": ("webp", "gemimg_scan_webp", False),
            "JST": ("txt", "raw_text_txt", False),
            "CompTIA_SecurityPlus_Certificate": ("pdf", "pristine_pdf", False),
        },
        "APPL-002": {
            "DD214": ("pdf", "scanned_pdf", False),
            "JST": ("pdf", "raw_text_pdf", False),
            "CompTIA_SecurityPlus_Certificate": ("webp", "gemimg_scan_webp", False),
        },
        "APPL-003": {
            "DD214": ("webp", "gemimg_scan_webp", False),
            "JST": ("webp", "gemimg_scan_webp", True),
            "CompTIA_SecurityPlus_Certificate": ("webp", "gemimg_scan_webp", False),
        },
        "APPL-004": {
            "DD214": ("pdf", "scanned_pdf", False),
            "JST": ("pdf", "raw_text_pdf", False),
            "CompTIA_SecurityPlus_Certificate": ("pdf", "pristine_pdf", False),
        },
        # B: SCNC bundles (4 docs each)
        "APPL-005": {
            "High_School_Attestation_Form": ("webp", "gemimg_scan_webp", False),
            "Community_College_Transcript": ("webp", "gemimg_scan_webp", False),
            "Sophia_Learning_Transcript": ("txt", "raw_text_txt", False),
            "Google_Project_Management_Certificate": ("pdf", "pristine_pdf", False),
        },
        "APPL-006": {
            "High_School_Attestation_Form": ("pdf", "scanned_pdf", False),
            "Community_College_Transcript": ("pdf", "scanned_pdf", False),
            "Sophia_Learning_Transcript": ("pdf", "raw_text_pdf", False),
            "Google_Project_Management_Certificate": ("pdf", "pristine_pdf", False),
        },
        "APPL-007": {
            "High_School_Attestation_Form": ("webp", "gemimg_scan_webp", False),
            "Community_College_Transcript": ("webp", "gemimg_scan_webp", False),
            "Sophia_Learning_Transcript": ("webp", "gemimg_scan_webp", True),
            "Google_Project_Management_Certificate": ("webp", "gemimg_scan_webp", False),
        },
        "APPL-008": {
            "High_School_Attestation_Form": ("webp", "gemimg_scan_webp", False),
            "Community_College_Transcript": ("pdf", "scanned_pdf", False),
            "Sophia_Learning_Transcript": ("txt", "raw_text_txt", False),
            "Google_Project_Management_Certificate": ("webp", "gemimg_scan_webp", False),
        },
        # C: international bundles
        "APPL-009": {
            "WES_Course_By_Course_Evaluation": ("pdf", "pristine_pdf", False),
            "TOEFL_Score_Report": ("pdf", "pristine_pdf", False),
        },
        "APPL-010": {
            "ECE_Course_By_Course_Evaluation": ("pdf", "pristine_pdf", False),
            "TOEFL_Score_Report": ("webp", "gemimg_scan_webp", False),
        },
        "APPL-011": {
            "WES_Course_By_Course_Evaluation": ("pdf", "pristine_pdf", False),
            "TOEFL_Score_Report": ("pdf", "pristine_pdf", False),
        },
        "APPL-012": {
            "ECE_Course_By_Course_Evaluation": ("pdf", "pristine_pdf", False),
            "TOEFL_Score_Report": ("webp", "gemimg_scan_webp", False),
        },
    }

    for applicant in dataset["applicants"]:
        plan = variant_plan.get(applicant["Applicant_ID"])
        if not plan:
            continue
        for doc_type, (fmt, rendering, single_page_image) in plan.items():
            set_doc_variant(
                get_doc(applicant, doc_type),
                fmt=fmt,
                rendering=rendering,
                single_page_image=single_page_image,
            )

    dataset["dataset_notes"].append(
        "Bundle formats intentionally vary by applicant (PDF-only, image-only, mixed PDF/WEBP/TXT) to mimic real submission behavior."
    )
    return dataset


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=False) + "\n", encoding="utf-8")


def validate(schema: dict[str, Any], data: dict[str, Any]) -> None:
    Draft202012Validator(schema).validate(data)


def main() -> None:
    schema = build_schema()
    dataset = apply_realistic_format_mix(build_dataset())
    validate(schema, dataset)
    write_json(SCHEMA_PATH, schema)
    write_json(DATA_PATH, dataset)

    doc_count = sum(len(a["Document_Bundle"]) for a in dataset["applicants"])
    counts = {"A": 0, "B": 0, "C": 0}
    for applicant in dataset["applicants"]:
        counts[applicant["Archetype_Code"]] += 1

    print(f"Wrote schema: {SCHEMA_PATH.relative_to(ROOT)}")
    print(f"Wrote data:   {DATA_PATH.relative_to(ROOT)}")
    print(
        "Applicants: "
        f"{len(dataset['applicants'])} total "
        f"(A={counts['A']}, B={counts['B']}, C={counts['C']}); "
        f"Documents: {doc_count}"
    )


if __name__ == "__main__":
    main()

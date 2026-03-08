# SchoolAI Demo Portal

SchoolAI is a lightweight demo portfolio for higher-education teams. It shows how AI can help schools respond faster, reduce manual review, and route complex student cases to the right staff without losing context.

## What This Repo Shows

- **Triage Agent**: a real-time enrollment intake dashboard for email, web chat, SMS, WhatsApp, voicemail, and social messages. It demonstrates classification, routing, draft response generation, and human handoff.
- **Super-Fast AI Credit Checking**: an interactive demo that turns mixed transfer-credit evidence into structured, advisor-ready recommendations.
- **Financial Aid Bot Experience Console**: a multilingual financial-aid support simulation with document intake, form auto-fill replay, and advisor escalation.
- **Executive Portal**: a simple landing page that links the demo experiences for stakeholder walkthroughs.

## Why It Matters

- Faster first-response times for prospective and current students
- More consistent handling of high-volume inquiries
- Less manual effort in document-heavy workflows
- Better use of advisor time for nuanced or sensitive cases

## Quick Start

This project is a static front-end demo with local JSON data and document assets. Run it from a local web server so browser `fetch()` requests work correctly.

```bash
cd /home/vscode/code/schoolai
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Repo Layout

- `index.html`: executive landing page
- `triage/`: enrollment triage demo and synthetic message stream
- `credit-checking/`: transfer-credit demo and synthetic applicant bundles
- `financial-aid/`: financial-aid demo and synthetic applicant journeys
- `scripts/`: utilities for generating and rendering synthetic demo data

## Data Note

All student, applicant, and message data in this repository is synthetic and intended for demo or testing use only. No real student records are included.

## For Technical Users

The scripts in `scripts/` can regenerate portions of the synthetic datasets and demo artifacts, but they are not required to view the demos.

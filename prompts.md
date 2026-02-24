# Credit Checking

## Generate data

We're pitching Super-Fast AI Credit Checking: An AI to instantly read and organize messy, 20-year-old college transcripts, military records, or work certificates so human advisors can easily see what credits a student already has. Adult learners hate waiting weeks to find out if their past hard work will count toward their new degree. By speeding this up, you directly help her goal of removing roadblocks for those 40 million adults, saving them time and money.

To create a truly realistic, high-fidelity demo we need to show our AI ingesting a chaotic folder of mixed documents for a single student, parsing them all simultaneously, and instantly outputting a unified degree pathway.

Generate 12 applicants, each with a bundle of 2 to 4 distinct documents. We require students to submit documentation from _every_ prior institution and experience.

Here are the three specific bundle archetypes you should generate to prove the AI's versatility:

- **Archetype A: The Military Veteran Transitioning to Business/IT.**
  - _The Bundle:_ A DD-214 discharge paper, a dense, text-heavy Joint Services Transcript (JST) featuring ACE credit recommendations, and a modern CompTIA Security+ digital certificate.
  - _The Reality Hook:_ Ensure the JST shows an Army Human Resources Specialist (MOS 42A) background. The AI will show how the MOS 42A experience maps to College Human Resource Management credits, while the CompTIA cert maps to IT-253 (Computer Systems Security).
- **Archetype B: The "SCNC" Corporate Upskiller (Some College, No Credential).**
  - _The Bundle:_ A high school attestation form, a scanned, 15-year-old transcript from a regional community college (e.g., Bunker Hill Community College), and a recent Google Project Management Certificate.
  - _The Reality Hook:_ The AI will map the old community college Intro to Psychology class, and then instantly map the Google Project Management Certificate to College's QSO340, QSO355, QSO420, and QSO435 courses (a massive 12-credit jump).
- **Archetype C: The International Adult Learner.**
  - _The Bundle:_ An official WES (World Education Services) or ECE course-by-course credential evaluation report, paired with a TOEFL English proficiency score report.

Use `gemimg` combined with a strict JSON schema that outputs _arrays of documents_ per student, followed by a quick visual rendering step.

First, generate the JSON data for the 12 bundles using a prompt like this, perhaps with a sub-agent.

> "You are an expert educational data architect creating synthetic student records to test an EdTech data ingestion engine. Generate a JSON payload for 12 distinct applicants. Each applicant must have a 'Document_Bundle' containing 2 to 4 distinct educational documents.
>
> - Make 4 applicants 'Military Veterans' submitting a DD-214, a Joint Services Transcript (JST) with ACE recommendations, and an IT Certificate (like CompTIA or AWS).
> - Make 4 applicants 'SCNC Upskillers' submitting an old community college transcript (years 2002-2010), a modern Sophia Learning transcript, and a Google Professional Certificate.
> - Make 4 applicants 'International Transfers' submitting a WES course-by-course evaluation and a TOEFL score.
>
> Ensure realistic course names, grades, and dates. Output strictly in the provided JSON schema."

You can use three methods to convert these JSON bundles into certificates.

**METHOD 1**: Use `gemimg` to render these JSON bundles into visually distinct .webp images that look exactly like the real-world scanned documents or photos (e.g. 2-degree skew, slight blur, coffee stains, monochrome artifacting, ...).

```bash
❯ uvx gemimg
Installed 10 packages in 9ms
usage: gemimg [-h] [-i INPUT_IMAGES [INPUT_IMAGES ...]] [-o OUTPUT_FILE] [--api-key API_KEY] [--model MODEL]
              [--base-url BASE_URL] [--aspect-ratio ASPECT_RATIO] [--no-resize] [--output-dir OUTPUT_DIR]
              [--temperature TEMPERATURE] [--webp] [-n N] [--store-prompt] [--image-size IMAGE_SIZE]
              [--system-prompt SYSTEM_PROMPT] [--grid GRID] [--grid-aspect-ratio GRID_ASPECT_RATIO]
              [--grid-image-size GRID_IMAGE_SIZE] [--save-grid-original] [-f]
              prompt
```

**METHOD 2**: Drop the JSON data into a clean, modern HTML/CSS certificate template and print to PDF. Keep these pristine.

**METHOD 3**: Convert the JSON JST data into a raw text file and save as PDF. JSTs are notoriously dense and utilitarian.

Each student may have a mix of a pristine digital PDF (e.g. Google Cert), a skewed, noisy PDF (2004 Community College transcript), a raw text PDF (Sophia Learning), etc. We will use the _entire folder_ of each student for the demo.

## Update data

All of these have the same structure. In real life, each student will have a different mix of PDF, WebP and text files, e.g. some will only have images. Some will only have PDFs. Some will only have a JST and three images. Create a REALISTIC mix. Use `gemimg` where required, with realistic prompts, to create the images - that's what has the best quality.

Move all of the generated files under `credit-checking/data/` and organize well.

## Create agent demo

Create an application that demonstrates the Super-Fast AI Credit Checking: An AI to instantly read and organize messy, 20-year-old college transcripts, military records, or work certificates so human advisors can easily see what credits a student already has. Adult learners hate waiting weeks to find out if their past hard work will count toward their new degree. By speeding this up, you directly help her goal of removing roadblocks for those 40 million adults, saving them time and money.

This should show cards for each of the 12 students. Each card should link to the original documents (PDFs, images, text). At a glance, it should be possible to see - just by reading the file names (no path names, just base name) the diversity of inputs. Rename the files in realistic ways that applicants would name them. Clicking on any of the files should show a popup with a preview of the file.

Add a button in each card labelled "Credit Check". This should trigger an analysis of the folder.

Simulate an AI analyzing each of the files. Show a "task list" that has the files in that applicant's folder. As each file is "analyzed", show a preview of the file. Alongside that, show the AI's "thoughts" as it processes the file, e.g. "This looks like a DD-214. Extracting service dates, MOS, and ACE credit recommendations." Then show the extracted data in a structured format as a tabular structure. Ensure that this extracted data is accurate and consistent with the original JSON, and in a standardized format that a human advisor would find useful.

When "streaming", stream word-by-word.

Clicking on any completed task should open a popup with the COMPLETE details of everything the AI extracted from that file, along with the original file preview for reference. This allows the user to verify the AI's extraction and understand how it arrived at its conclusions.

Then, after all files are processed, show the AI's final output: a unified degree pathway that maps all of the credits from the various documents into a single, coherent format that a human advisor can easily understand. This should show how the various credits from the different documents combine to form a clear pathway toward degree completion.

High visual quality is critical. Follow the visual style, animation, and effects used in the The Pudding (pudding.cool): custom data visualizations, playful explanatory graphics, bold typography, interactive chart explorations, and visual format innovation.

Think carefully about what will be meaningful and useful for the audience to see. The goal is to make the Credit Checker's impact tangible and compelling to a business audience - to help them understand how this will help with the overall objective and improve outcomes.

Plan the application design and layout carefully before you start coding. Consider the user experience and how to best visualize the animation and the agent's processing. Use animations and interactions to make it engaging, but ensure it remains clear and informative.

Save the output in `credit-checking/index.html` (along with associated scripts, styles, or any other assets you need to create under `credit-checking/`)

### Corrections

- Update the max width from 1440px to 1920px.
- "Intake Diversity Map":
  - Clicking on the filename in the Intake Diversity Map should not process the credit check - it should just open the file preview. Only clicking on the "Credit Check" button should trigger the analysis and processing.
  - The Diversity Fingerprint segments exceed the width of the card. That should never happen.
- Slow down the credit extraction "streaming" speed by 50%.
- When the "Folder analysis > Credit Check" popup is open
  - If the Unified Degree Pathway (#final-pathway-panel) is taller than the popup height, I'm not able to see the bottom. Allow that card to be scrollable as well.
  - .stage-frame is still visible when no file is selected and only the #final-pathway-panel has content. Hide it in such a case.
- When the "Completed Task Evidence Review" popup is open
  - The "Complete AI Extraction (Advisor Review)" is not vertically scrollable, so I can't see the bottom if the content exceeds the height. Make that scrollable as well.
  - The vertical scrollbar is not visible on the preview frame either if the .text-preview, etc. has a width higher than .preview-frame - so ensure that they have the same width too, allowing the preview to be horizontally scrollable (auto, i.e. only if required).
- Find other places where there are similar errors and fix those.
- Add a side-by-side “Before vs After” KPI panel (manual review time, advisor touches, credits surfaced, student savings estimate).

### Corrections 2

- In the Intake Diversity Map, remove the .diversity-fingerprint (and any associated code).
- In the Intake Diversity Map, clicking on a .diversity-file-btn should open the original in a new tab - not show the file preview popup.

### Corrections 3

- In the Intake Diversity Map, ensure that .diversity-cell has an overflow:hidden and add a file type badge (IMG, PDF, TXT with colors) to the left of each .diversity-file-btn to make it easier to visually parse the types of documents at a glance.
- Compress the PDFs dramatically to reduce the overall file sizes. Prefer losslessly, or with small acceptable quality loss.

### Cleanup

Remove any unused files

# Triage Agent

## Generate data

I want to create a synthetic dataset for the Triage Agent demo based on the pitch below. We want to SNHU how the agent could intercept emails, WhatsApp messages, web activity from forms, and inquiries from any other channels, can be updated and categorized into the CRM automatically along with automated drafts of personal replies.

For this, in the context of schools like SNHU, think about and research the kind of channels they use for students and parents to inquire from an enrollment perspective. Suggest the kinds of messages they are likely to receive.

Generate an ultra-realistic synthetic dataset of ~100 messages across the different channels.

List fields that would be present in such data, briefly describing how the data might be distributed.
Think about who the audience might be and their objective / key questions.
Search online if required.
Remember: real data is messy. Make sure the generated data reflects relevant characteristics.
Generate this as `messages.json` file.

For each of thee messages, include a draft response if the question had been posed to SNHU. Ensure that the response is realistic and reflects SNHU's tone and values.

Keep in mind that a bot may not be qualified to (or allowed to) answer certain questions. Think about the areas where the bot would need to hand off to a human, and include examples of those as well.

Include the metadata that would accompany the draft response.

For example, while escalating, include a field that mentions the specific action that the bot should take to escalate the issue to a human advisor, how it might tag the message - e.g. what queue it should go into, what priority level it should be assigned, what's the reason for escalation, and what information it should pass along to them.

When responding with a draft, there would be similar fields such as citations, reasons for the response, and confidence level of the bot, etc.

In either case, think about the most important & useful metadata to include.

Ensure that `messages.json` includes the draft responses and metadata for each message.

Here's the pitch and context. Ignore what's irrelevant.

<PITCH>

```markdown
[LearningMate](https://learningmate.com/)

[Solution](https://enrollmentserviceswebsite.lovable.app/#solution-architecture) [What We Do](https://enrollmentserviceswebsite.lovable.app/#ai-agents) [Who We Are](https://enrollmentserviceswebsite.lovable.app/#why-learningmate) [Insights](https://enrollmentserviceswebsite.lovable.app/#metrics)

ContactRequest Demo

AI-Augmented Enrollment Engine

# Stop Losing Students to the 'Black Hole'

Turn **44% of non-responsive inquiries** into enrolled students. We combine 24/7 generative AI agents with empathy-focused human support to fix your leaky funnel—without the bloat of traditional OPMs.

Audit Your FunnelWatch Demo

FERPA Compliant

GDPR Ready

20+ Years Experience

![AI-Augmented Enrollment Dashboard showing student engagement metrics](https://enrollmentserviceswebsite.lovable.app/assets/hero-enrollment-DbekkNd4.jpg)

44%

Leads Recovered

24/7

AI Coverage

The Crisis

## The 'Leaky Funnel' in Higher Ed

In 2025, the student journey is broken. Admissions teams are burned out, and legacy systems are failing to capture interest.

44%

Lost Leads

### The 44% Black Hole

Nearly half of all inquiries receive no human response. 62% of emails to individual faculty go unanswered.

10+

Form Fields

### RFI Friction

Long, static forms and generic 'Hello \[Name\]' auto-responders are driving away Gen Z and adult learners who demand instant gratification.

60%

Time Wasted

### Staff Burnout

Counselors spend hours on repetitive data entry and 'Are you still interested?' calls, leaving no time for meaningful advising.

5+

Data Silos

### Fragmented Data

With leads trapped in emails, spreadsheets, and shadow IT, you can't prove marketing ROI or attribute enrollments to campaigns.

1000 Inquiries

600 Reached

300 Engaged

56 Enrolled

← 44% Lost Here

The Solution

## A 4-Layer Hybrid Engine

We don't just offer a chatbot. We provide a fully managed, AI-augmented enrollment ecosystem that integrates seamlessly with your existing SIS and CRM (Slate, Salesforce, Element451).

### See How It All Works Together

Our hybrid architecture seamlessly connects every touchpoint—from first inquiry to enrolled student—through intelligent automation and human expertise.

![Hybrid AI-Augmented Enrollment Engine Architecture showing the 4-layer system: Engagement, Intelligence, Operational, and Analytics layers](https://enrollmentserviceswebsite.lovable.app/assets/architecture-diagram--h3pgxK7.png)

Layer 1

### Engagement

(The Front End)

4-Channel Intercept

WebEmailVoiceText

AI Agents intercept inquiries instantly across all channels, eliminating wait times.

Layer 2

### Intelligence

(The Brain)

Identity Resolution & Orchestration

Powered by LearningMate's data expertise, we merge email, WhatsApp, and web activity into One Student Profile using a Unified Vector Database.

Layer 3

### Operational

(The Human Touch)

AI-Augmented Global Support

Our 'Empathy Specialists' handle complex issues, supported by an AI Co-Pilot that provides real-time answers and policy lookups.

Layer 4

### Analytics

(The Dashboard)

Omnichannel Command Center

Real-time monitoring of 'Black Hole' metrics, stalled inquiries, and marketing ROI attribution.

Seamlessly integrates with

Slate

Salesforce

Element451

Banner

Workday

AI Team

## Meet Your New AI Enrollment Team

Deploy specialized AI agents that work 24/7 to nurture leads, allowing your staff to focus on high-value counseling.

Email

### The Triage Agent

The Problem Solver

Intercepts faculty/admissions inbox emails, reads intent (e.g., 'Scholarship help'), and auto-drafts personalized replies in <2 mins. Updates CRM automatically.

<2 min

Response Time

Web

### The Conversational RFI Agent

The Form Killer

Replaces 10-field static forms with a chat interface. Collects data conversationally and pushes 'High Intent' leads immediately to the call queue.

3x

More Conversions

SMS/WhatsApp

### The Nurture Agent

The Warmer

Re-engages cold leads with proactive texts ('Do you have 5 mins for a quick call?'). Handles international students via WhatsApp in any time zone.

24/7

Global Coverage

Phone

### The AI Voice Gatekeeper

The 24/7 Cover

Answers inbound calls instantly. Resolves Tier 1 issues and executes a 'Warm Handoff' to human agents for complex queries.

0 sec

Wait Time

Why LearningMate

## 20+ Years of EdTech Excellence

For over two decades, LearningMate has been a digital transformation partner for the world's leading education institutions. We move beyond the rigid OPM model to offer flexible, fee-for-service solutions.

10M+

Learners Served

200+

Partner Institutions

20+

Years Experience

### Enterprise-Grade Compliance

We understand the role of the CIO. Our solution is engineered for FERPA and GDPR compliance, ensuring student data is encrypted, governed, and never used to train public models without consent.

FERPA CompliantGDPR ReadySOC 2 Type II

### Seamless Integration

Leveraging our 'Double Line' and 'Clarity' data heritage, we build connectors for Slate, Salesforce Education Cloud, and Banner/Workday, ensuring no data silos.

Native CRM ConnectorsReal-time SyncZero Data Loss

### Cost Transparency

Say goodbye to 50% revenue-share models. We operate on a transparent SaaS or fee-for-service model, aligning our success with your enrollment growth.

No Revenue SharePredictable PricingClear ROI

Expected Outcomes

## Results You Can Measure

< 5min

Average Response Time (Global)

From inquiry to first contact

20%

Projected Conversion Increase

Based on industry benchmarks

24/7

Inquiry Coverage

Nights, weekends & holidays

100%

Data Capture in CRM

Zero lost lead information

## Close the Gap Between Inquiry and Enrollment

Don't let another semester pass with a leaky funnel. See how our AI-Augmented Enrollment Engine can transform your admissions process in just 30 days.
```

</PITCH>

<SNHU-CONTEXT>

```markdown
Here is the simple, ELI15 breakdown of what makes Lisa Marsh Ryerson tick and how you should angle your pitch.

**What Lisa Cares About (Her Focus Areas)**

- **Fairness and Finishing:** She is a first-generation college graduate who believes deeply in "equitable attainment". This means it’s not enough to just let students enroll; the school must actively help them overcome life's hurdles so they actually cross the finish line and graduate.
- **The 40 Million "Almost-There" Adults:** Her biggest target audience is the 40 million Americans who have some college credits but never got their degree. She wants to make it incredibly easy for these working adults (whom she calls "The Anders"—students _and_ parents, students _and_ workers) to come back to school.
- **Human Connection:** She hates the idea of online students feeling lonely or like just a number. She strongly believes in "social connectedness" and thinks university staff should act as human "guides" or coaches, not just rule-enforcers.
- **No "Blind Spots":** She wants all of the university's departments to share information (which she calls "radical collaboration") so that the school never misses the warning signs when a student is struggling and about to drop out.

**What You Should Pitch (And Why)**

You need to pitch your technology not as a way to replace human workers or save a quick buck, but as a tool to remove the frustrating paperwork so her staff can focus on caring for the students.

**1\. Pitch: Super-Fast AI Credit Checking**

- **What it is:** Straive's AI can instantly read and organize messy, 20-year-old college transcripts, military records, or work certificates so human advisors can easily see what credits a student already has.
- **Why it works:** Adult learners hate waiting weeks to find out if their past hard work will count toward their new degree. By speeding this up, you directly help her goal of removing roadblocks for those 40 million adults, saving them time and money.

**2\. Pitch: Upgrading "Penny" to a Problem-Solver**

- **What it is:** Taking SNHU's current friendly chatbot (Penny) and making it smart enough to actually complete tasks (like filing financial aid forms), while having Straive's human support team standing by 24/7 if the bot senses a student is stressed.
- **Why it works:** Lisa specifically says technology should be the "hand" doing chores, while humans are the "heart" giving emotional support. This pitch proves you understand that balance. You use AI to handle the midnight password resets, and instantly transfer crying or stressed students to a real, empathetic human.

**3\. Pitch: The "Blind Spot" Detector (Data Unification)**

- **What it is:** Connecting all of SNHU's disconnected computer systems so they talk to each other. If a student misses a payment, fails a quiz, and stops logging in all in the same week, the system flags it.
- **Why it works:** It solves her exact fear of having institutional "blind spots". You are giving her advisors a smart early-warning system so they can reach out and offer a lifeline to a struggling student _before_ that student gives up and drops out.
```

</SNHU-CONTEXT>

## Dashboard

Move `messages.json` to `triage/messages.json`.

Based on the context in `prompts.md` and the dataset in `triage/messages.json`, show a realtime simulation of the Triage Agent in action as a single page dashboard, `triage/index.html` (along with associated scripts, styles, or any other assets you need to create under `triage/`)

It should include:

- Realtime simulation of messages coming in from different channels, depicted visually with icons and labels.
- Rich, visual animation of the messages flowing in.
- Show each message being processed by the Triage Agent, with the draft response and metadata appearing alongside it. Simulate an LLM "thinking" by showing a loading animation for a realistic amount of time before the metadata appears. Then "stream" the responses word by word to make it feel more dynamic and real.
- Show the accumulation of messages, responses, triage resolutions, escalations, and other relevant metrics on a dashboard in real time.
- Include visualizations of key metrics such as response time, escalation rate, resolution rate, and student satisfaction (if applicable).
- Add a collapsible "Controls" panel. Under this, allow playing, pausing, resetting, and adjusting the speed of the simulation.

High visual quality is critical. Follow the visual style, animation, and effects used in the The Pudding (pudding.cool): custom data visualizations, playful explanatory graphics, bold typography, interactive chart explorations, and visual format innovation.

Think carefully about what will be meaningful and useful for the audience to see. The goal is to make the Triage Agent's impact tangible and compelling to a business audience - to help them understand how the agent will help reduce inquiry load, improve qualit of responses, and improve enrollment outcomes.

Plan the dashboard design and layout carefully before you start coding. Consider the user experience and how to best visualize the flow of messages and the agent's processing. Use animations and interactions to make it engaging, but ensure it remains clear and informative.

## Corrections

- Set --max-width to 1920px.
- Change the title to "Triage Agent. Change the ".hero-lede" to explain the business benefit in a clear, compelling way with typical metrics, in 2-3 paragraphs.
- Remove all references to SNHU, simulations, synthetic data, etc. and make it look like a real triage agent dashboard for a real but unnamed client.
- Rename "Omnichannel Intake → Agent → Outcomes" to something smaller. Also, ensure that that row, which also has "Live Message Processing" and "Resolution Feed" cards don't change width as the content changes.
  - Also ensure that these cards have an equal height. Auto-scroll the height of the inbound message, draft response, and anything else that might have a long content.
  - Run the simulation for a while to see how the size changes as the content changes. That shouldn't happen. Think of the best way to make this happen.
- Show the number of messages processed (Auto drafts, Human handoffs) visually apart from showing the number - e.g. small multiples of icons representing each message.
- Don't show the total number of messages in Email, Web Chat, etc. That makes it look like a simulation rather than real streaming data. Instead, show the number of messages processed so far, and as new messages are processed, increment the count of the channel.
- In the resolution log, clicking on any draft card should open a popup showing the full message with metadata.

## Corrections 2

- Auto-play on load.
- On wide screens, move the Activity Log card to a separate row by itself. Re-design it to look attractive even with this wide design. Let the Live Message Processing card take up the width freed up by the Activity Log.
- Ensure that the icons in Auto Drafts and Human Handoffs never spill outside their cards and always wrap. Let them have the same size always.
- Explain the Throughput + Backlog card with a clear, compelling lede that explains the business impact of these metrics.
- The "Response Time vs Legacy Baseline" card is boring, with the legacy baseline of 240m and agent response of just a few min being static and making the chart mostly empty. Replace this with a more dynamic and useful visualization.
- Drop the "Channel mix" card and related code (if any). Move the "Routing Pressure" card on the same row (and to the left of) "Impact Storyboard".

## Corrections 3

- The "median" and "under 5m" stats in "Response Time Distribution + SLA Bands" overlap with the axis. Move it below the chart, e.g. alongside the legend.
- Instead of showing +n against the message count indicators, find a way to show the actual counts, i.e. with one icon per message. I don't mind smaller dots or other creative layouts.
- In Throughput + Backlog, the chart shows a blue and red line but the legend shows green and red. Is that right?

## Corrections 4

In "Controls":
Replace "Stream speed" with "Number of agents". The idea is to make it look like we're achieving speed by adding more agents.
Replace "Play" with "Start" and "Reset" with "Restart".
Replace "Play, pause, reset, speed" with "Start, pause, restart, scale".

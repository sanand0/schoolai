# Prompts

<!-- https://gemini.google.com/app/40837ce1a2d9c6cc -->

# Home page

Create an elegant, highly skimmable landing page at `./index.html` showcasing how AI can be used by educational institutions, targeting the executive leadership team of schools and universities.

This page serves as a portal for interactive AI demos that prove our AI technology can help educational institutions scale learners while eliminating friction and preserving deep "social connectedness."

Go through the demos at

triage/
credit-checking/
financial-aid/

... for information about the specic demos to link to. (There will be more to add later.)

Align with the style of the other demos.
Include subtle animations, engaging interactions, and a certain playfulness.

**Principles** to follow:

- Meaningfulness: think carefully about what will be meaningful and useful for the audience to see, based on their objective. The goal is to help them understand and act.
- Visual quality: is critical. Use consistency, bold typography, contrast, visual hierarchy, progressive disclosure, repetition, alignment, information density calibration, and other principles of visual design - while also evaluating relevant visual format innovation.
- Responsive design: all interactions, tooltips, and popups work well on different screen sizes and devices.
- Accessibility: keyboard navigation, minimum contrast ratios, etc.

Plan the design and layout carefully before coding. Sketch the information architecture, interaction inventory, design tokens, performance sensitive paths, responsive breakpoints, etc.

## Corrections

Drop the "Choose the outcome you want to prioritize" and "Branched complexity" sections and associated items. Keep it simple.

# Financial Aid

## Generate data

We're pitching a Financial Aid Bot: An AI that can interact with students in a friendly, empathetic way to help them complete their financial aid forms by asking them questions, allowing them to upload documents, and filling out forms for them - as much as possible - while seamlessly escalating to a human advisor if the student seems stressed or confused. This bot will be available 24/7, so students can get help whenever they need it, without having to wait for business hours.

To create a truly realistic, high-fidelity demo we need to show our AI interacting with students with diverse backgrounds, multiple backgrounds, varying levels of English proficiency, tech savviness, and financial aid literacy. We also need to show the bot handling a variety of different financial aid forms and documents, and escalating to a human advisor when necessary.

Generate 12 applicants, each with a bundle of distinct documents. Here are examples of three applicants. Use these as examples when generating the data for the 12.

Applicant 1: The Frustrated First-Gen Student (The "V1 Verification Worksheet" Auto-Fill)

- **The Profile:** "Marcus," an 18-year-old first-generation college student with low financial literacy. His FAFSA was flagged for "Federal Verification," a common institutional hurdle. He is using a smartphone, is confused by the jargon, and is panicking that his classes will be dropped.
- **The Document Bundle:** A blurry smartphone photo of a fast-food W-2 and a handwritten note about his family.
- **The Demo Hook (Step-by-Step Form Filling & The "Heart"):**
  1. Marcus texts the bot: "The Uni says I have a hold and need a V1 Verification Worksheet. I don't know what that is or how to do it."
  2. The AI agent brings up a blank The Uni V1 Verification PDF on the screen. It replies: _"Don't worry Marcus, your classes are safe. We can fill this out together right now. First, who currently lives in your house?"_
  3. Marcus texts: "Just me, my mom, and my little sister." The AI instantly maps this data, checking the appropriate boxes and auto-filling the "Household Size" section of the PDF on-screen.
  4. The AI then asks: _"Did you work last year? If so, can you snap a picture of your W-2?"_ Marcus uploads his blurry W-2 photo. The AI parses the image, extracts his employer's name and exact wages, and populates the "Income Information" fields on the form.
  5. Marcus then asks: "Wait, the form asks for untaxed income. Does my mom's disability check count?"
  6. **The Escalation:** The AI detects confusion and potential regulatory complexity. It responds: _"That's a great question, Marcus. I am bringing in Sarah, a human financial aid advisor, to answer that and help us finish the last step."_ The human advisor enters the chat, already reviewing the 90% completed form as well as a concise summary of the conversation and what they need to do next, proving the bot eliminates friction without removing the human safety net.

Applicant 2: "The Ander" Navigating a Life Crisis (The "Professional Judgment Appeal" Step-by-Step)

- **The Profile:** "Elena," a 35-year-old single mother. The FAFSA requires tax information from two years ago. At that time, she had a high-paying job, but she was recently laid off. The automated federal system assumes she is wealthy and denies her aid. She needs a "Professional Judgment Appeal".
- **The Document Bundle:** A 2024 tax return showing $75,000 in income, a recent corporate layoff letter, and a state unemployment benefits statement.
- **The Demo Hook (Step-by-Step Form Filling & The "Hand"):**
  1. Elena tells the bot: "The FAFSA says my Expected Family Contribution is too high, but I just lost my job and have nothing."
  2. The AI recognizes this qualifies for a Professional Judgment Appeal and opens the corresponding blank appeal form on-screen.
  3. The AI asks: _"I am so sorry to hear about your job loss, Elena. I can help you file an appeal to get your aid adjusted. What date did your employment end?"_ Elena answers, and the AI types the date into the "Change in Circumstance" field on the form.
  4. The AI asks for proof. Elena drags and drops her layoff letter and unemployment statement into the chat.
  5. The AI instantly ingests both documents. It automatically checks the "Loss of Employment" box on the form, calculates her new projected annual income based on the unemployment statement, and fills in the financial grid on the PDF.
  6. Finally, the AI drafts a formal, empathetic "Personal Statement" based on Elena's chat history, places it into the required section of the form, and prompts Elena: _"I've completed your appeal packet. Please review the attached form and click 'Sign' so I can submit it to the financial aid office for you."_

Applicant 3: The ESL / Non-Traditional Learner (The "Dependency Override" Auto-Fill)

- **The Profile:** "Carlos," an adult learner whose first language is Spanish. He has been estranged from his abusive parents for five years, but the FAFSA is demanding his parents' tax information. He is overwhelmed by the process of filing a "Dependency Override".
- **The Document Bundle:** A utility bill in his name, and two PDF letters of support from non-relatives (a therapist and a landlord) explaining his estrangement.
- **The Demo Hook (Step-by-Step Form Filling & Friction Eliminator):**
  1. Carlos asks the bot in Spanish: "The FAFSA wants my parents' taxes, but I haven't spoken to them in five years."
  2. The AI replies in Spanish, explaining the Dependency Override process, and opens the blank override form on the screen.
  3. The AI guides him step-by-step: _"First, I need your current address."_ Carlos types it, and the AI fills the "Independent Student Information" section.
  4. The AI says: _"Because of your situation, the university requires two letters from professionals who know your story."_ Carlos uploads the two PDF letters from his therapist and landlord.
  5. The AI parses the uploaded letters, extracting the names, professional titles, and contact information of both references. It automatically fills out the "Letter of Support 1" and "Letter of Support 2" reference fields on the override form.
  6. The AI then asks Carlos a few conversational questions in Spanish about how he supports himself financially. It translates his answers into a formal English statement, auto-fills the "Separation Details" text box on the form, and readies the document for submission, completely bypassing the language and bureaucratic barriers.

Generate synthetic financial aid data as well as chat conversations for 12 such profiles in JSON format.
The chat conversations should include the fields filled out by the AI in the financial aid form at each stage (if it is able to fill out fields at that step of the conversation) as well as links to the documents uploaded by the user, and any other relevant metadata (e.g. timestamp). This should be enought to reproduce the entire chat experience in a realistic way, without having to create the actual application.
Student may often have a mix of documents and document types.
Include realistic addresses and figures.

You can use two methods to generate images for these documents.

**METHOD 1**: Use `gemimg` to render visually distinct .webp images that look exactly like the real-world scanned documents or photos (e.g. 2-degree skew, slight blur, coffee stains, monochrome artifacting, ...).

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

**METHOD 2**: Drop the JSON data into REALISTIC HTML/CSS certificate template and print to PDF.

Under `financial-aid/data/` create one folder for each student with the JSON (including the conversation) and relevant attachments. This should be sufficient to demonstrate the flow for the entire chat in a realistic manner, without having to create the actual application.

## Create agent demo

Create an application that demonstrates the Financial Aid Bot: An AI that can interact with students in a friendly, empathetic way to help them complete their financial aid forms by asking them questions, allowing them to upload documents, and filling out forms for them - as much as possible - while seamlessly escalating to a human advisor if the student seems stressed or confused. This bot will be available 24/7, so students can get help whenever they need it, without having to wait for business hours.

This should show cards for each of the 12 financial aid applicants. Each card should show the student profile, financial aid context, and links to the original documents (PDFs, images, text) and a summary of what happened in the chat. Clicking on any of the files should show a popup with a preview of the file.

Add a button in each card labelled "Chat Recording". This should trigger a simulated walk through of the chat.

The walk through should show the student profile and financial aid context on top. Stream the chat realistically. The student chat messages should be typed out character by character with a realistic non-linear typing speed, and the AI's responses should be streamed word by word with a realistic "thinking" delay between each message. The AI's responses should also include animations to show that it is processing and analyzing the student's information before responding.

At the end of the AI conversation, fill out the relevant fields in the financial aid form based on the information extracted from the chat and the uploaded documents. Show the form being filled out in real time as the AI extracts information and populates the fields.

Include a slider that lets the user step through a process, pause, play, speed up, slow down, step forward/backward, or jump to any point in the chat timeline (like a video player), with visual cues to highlight relevant parts and metadata/tags across the chat steps.

Use tooltips, popups, interactions, and animations as informative and engaging aids.

**Tooltips** are for:

- Context about non-obvious terms or phrases (only if relevant and useful)
- Additional context about references (where possible)
- Metadata and context about data points, table cells, chart elements, etc. (always)
- Guidelines:
  - On mobile, use tap-to-reveal with clear dismiss affordance (tap elsewhere or an × icon); auto-reposition to stay within the viewport.
  - Debounce on hover. Only 1 tooltip at a time.

**Popups** are for:

- Files. Link liberally to files.
  - Clicking on file links should open the files in a popup, with a link to open the original in a new tab.
  - Syntax-highlighted if code
  - Show sortable for tabular data, gradient-coloring important numeric / categorical columns if that will help understand the context
- Data points. Provide extensive context for data points.
  - Wherever useful, clicking on data points, table cells, chart elements, etc. should open a popup that provides full context about that element.
  - Include narratives, cards, tables, charts, or even entire dashboards that answer what the user is likely to be curious about or wants to dig in for more details. E.g. context, examples, related metrics, trends over time, breakdown by relevant dimensions, etc.
  - Standardize the format of these popups so users know what to expect. Reuse popups by archetype.
- Guidelines: Trap keyboard focus inside. Contain scrolling. Show loading state when required. Use a consistent anatomy.

**Interactions** can include:

- Scrollytelling. As the user scrolls, trigger changes in charts, illustrations, narratives, etc. to guide them through the story.
- Sliders that allow users to adjust assumptions, scenarios, etc. and see the impact in real time. Keep input & output close - without scrolling.
- Interactive explainers that let the user step through a process, pause, play, speed up, slow down, step forward/backward, or jump to any point in the timeline via a slider (like a video player), with clear explanation of each step and visual cues to highlight relevant parts and metadata/tags for the current step.
- Transition on value change. Animate chart values between states (e.g., bar heights morphing) rather than jump-cutting.
- Streaming text to simulate LLM responses. Stream word-by-word, at ~4 words per second, with a controllable rate, using a blinking cursor at the end to show that it's still generating.
- Progressive reveal quiz. Ask user a question, reveal answer against their guess. Related to scenario forking: choose your own adventure style branching based on user choices.
- Comparisons. Pairwise comparisons, pinnable for comparison, swipe to compare, etc.
- Brushing and linking. Select a region in one chart to highlight related data nearby.
- Small multiples. Show a grid of small charts, letting user expand any SMOOTHLY into a full view - with more details.
- Filters & search.
- Also: Trails. Cursor morphing. Magnetic snapping. Intertial scrolling/panning. Contextual axis transitions.

**Animated SVGs** are for:

- Explaining processes, mechanisms, workflows, etc. The aim is to make users FEEL the process. One glance should give them an intuitive understanding of how it works, even before they read the accompanying text. Show how things are connected, what data flows from where to where, how elements, interact, etc.
- Guidelines: Use GPU-friendly rendering (transform, opacity). Sequence multiple animations deliverately. Respect `prefers-reducted-motion`.

**Principles** to follow:

- Meaningfulness: think carefully about what will be meaningful and useful for the audience to see, based on their objective. The goal is to help them understand and act.
- Visual quality: is critical. Use consistency, bold typography, contrast, visual hierarchy, progressive disclosure, repetition, alignment, information density calibration, and other principles of visual design - while also evaluating relevant visual format innovation.
- Responsive design: all interactions, tooltips, and popups work well on different screen sizes and devices.
- Accessibility: keyboard navigation, minimum contrast ratios, etc.
- URL-driven state: Slider positions, toggle states, and selected scenarios should be reflected in bookmarkable URL parameters.

**Errors to avoid**:

- Visibility: ensure nothing overlaps, get cut off, or becomes inaccessible because we can't scroll to it, etc.
- Performance: ensure loading is fast, latency < 100ms, even with large datasets or complex visualizations.
- Common bugs: tooltip/popup positioning during scroll / resize, z-index warefare, orphaned event listeners, etc.

Plan the design and layout carefully before coding. Sketch the information architecture, interaction inventory, design tokens, performance sensitive paths, responsive breakpoints, etc.

Save the output in `financial-aid/index.html` (along with associated scripts, styles, or any other assets you need to create under `financial-aid/`)

## Corrections

- DO NOT show tooltips where the tooltips add no meaningful value or additional information beyond the text!
- When "Chat recording" is clicked, auto-play after the popup loads.
- Show meta tags (e.g. "concerned", "en", etc.) AFTER the chat message is fully streamed, not before.
- Pause before the AI responds for a random thinking time between 1-3 seconds.
- Show timestamps like "Mon 2 Mar 2026, 4:35 pm"
- When clicking on a file or context from the recording simulator, the documents / context are shown BEHIND the chat simulator. It should be on top.
- Render the financial aid form with the visual look and feel of the actual form used by the university. Details like source and confidence should appear on hover. Add an option to print the partly/fully filled form as a PDF.
- Color code the outcomes (e.g. green for auto-filled, yellow for needs review, red for flagged for escalation, etc.) and label the outcomes, risk flags, etc. more intuitively (e.g. dropout_language_detected => "Dropout language detected".)
- The hero animated workflow seems trivial. Show the branched complexity of typical workflows.
- When an advisor is brought in, show the summary context that's shown to the advisor.

Revise the data (and corresponding UI) so that:

- Conversations for Arabic, Punjabi, etc. are ACTUALLY in the respective language, but translations are stored in the JSON and made visible AFTER the student / AI chat messages are displayed.
- On the home page, show conversations sorted by descending length of the number of turns.
- For some promising conversations, extend to 15-20 turns to show more of the back-and-forth.
- Did you use `gemimg`? If not, use it for some of the .webp images (especially for those that'll appear near the top of the page, i.e. longer chats) to increase the visual quality and realism of the documents. The API key is in `.env`.

Using the above as guidelines, think about the kinds of improvements / fixes I'd like made, find more places where you can apply such fixes, and proactively make those. Let me know what else you changed.

## More corrections

- Content inside .analysis-column can overflow the height of the screen sometimes, and there's no way to scroll to the bottom to see the rest of the content.
- Add visual badges to attachments
- .flow-node.active messes up the transform - I think removing transform-origin: center from `.flow-node.active circle` works
- .flow-track is not visible. Maybe the problem is in url(#flowLine)?

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

const DATA_URL = "./data/all_applicants.json";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const els = {
  heroStats: document.querySelector("#heroStats"),
  flowSvg: document.querySelector("#flowSvg"),
  storyline: document.querySelector("#storyline"),
  applicantGrid: document.querySelector("#applicantGrid"),
  compareDock: document.querySelector("#compareDock"),
  compareGrid: document.querySelector("#compareGrid"),
  clearPinsBtn: document.querySelector("#clearPinsBtn"),
  searchInput: document.querySelector("#searchInput"),
  languageFilter: document.querySelector("#languageFilter"),
  riskFilter: document.querySelector("#riskFilter"),
  sortBy: document.querySelector("#sortBy"),
  cardTemplate: document.querySelector("#applicantCardTemplate"),
  fileModal: document.querySelector("#fileModal"),
  fileModalTitle: document.querySelector("#fileModalTitle"),
  fileLoading: document.querySelector("#fileLoading"),
  filePreview: document.querySelector("#filePreview"),
  openOriginalLink: document.querySelector("#openOriginalLink"),
  contextModal: document.querySelector("#contextModal"),
  contextModalTitle: document.querySelector("#contextModalTitle"),
  contextModalBody: document.querySelector("#contextModalBody"),
  replayModal: document.querySelector("#replayModal"),
  replayTitle: document.querySelector("#replayTitle"),
  replayTop: document.querySelector("#replayTop"),
  chatStream: document.querySelector("#chatStream"),
  thinkingCard: document.querySelector("#thinkingCard"),
  thinkingText: document.querySelector("#thinkingText"),
  formTitle: document.querySelector("#formTitle"),
  formFieldList: document.querySelector("#formFieldList"),
  printFormBtn: document.querySelector("#printFormBtn"),
  timelineTags: document.querySelector("#timelineTags"),
  advisorCard: document.querySelector("#advisorCard"),
  advisorCardBody: document.querySelector("#advisorCardBody"),
  speedChip: document.querySelector("#speedChip"),
  slowerBtn: document.querySelector("#slowerBtn"),
  stepBackBtn: document.querySelector("#stepBackBtn"),
  playPauseBtn: document.querySelector("#playPauseBtn"),
  stepForwardBtn: document.querySelector("#stepForwardBtn"),
  fasterBtn: document.querySelector("#fasterBtn"),
  timelineSlider: document.querySelector("#timelineSlider"),
  timelineLabel: document.querySelector("#timelineLabel"),
  timelineClock: document.querySelector("#timelineClock"),
  openFormContext: document.querySelector("#openFormContext"),
  tooltip: document.querySelector("#tooltip"),
  tooltipContent: document.querySelector("#tooltipContent"),
  tooltipClose: document.querySelector("#tooltipClose"),
};

const state = {
  dataset: null,
  applicants: [],
  filters: {
    search: "",
    language: "all",
    risk: "all",
    sort: "turns_desc",
  },
  pins: new Set(),
  modal: {
    stack: [],
    cleanupByModal: {},
    previousFocusByModal: {},
  },
  tooltip: {
    timer: null,
    visibleFor: null,
  },
  replay: {
    open: false,
    applicant: null,
    turns: [],
    displayedCount: 0,
    speed: 1,
    mode: "paused",
    token: 0,
    loopRunning: false,
    formFields: new Map(),
    fieldHistory: new Map(),
    lastUpdatedFieldId: null,
    activeFormId: null,
    advisorBrief: null,
  },
};

const URL_STATE = readUrlState();

init().catch((error) => {
  console.error(error);
  els.applicantGrid.innerHTML = `<div class="no-results"><h2>Could not load demo data</h2><p>${escapeHtml(
    String(error)
  )}</p></div>`;
});

async function init() {
  bindBaseEvents();
  initTooltips();
  initScrollytelling();

  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load dataset (${response.status})`);
  }

  const dataset = await response.json();
  state.dataset = dataset;
  state.applicants = dataset.applicants || [];

  applyUrlFiltersIfPresent();
  renderHeroStats();
  populateFilterControls();
  renderApplicants();
  restoreReplayFromUrlIfNeeded();
}

function bindBaseEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim();
    renderApplicants();
    writeUrlState();
  });

  els.languageFilter.addEventListener("change", (event) => {
    state.filters.language = event.target.value;
    renderApplicants();
    writeUrlState();
  });

  els.riskFilter.addEventListener("change", (event) => {
    state.filters.risk = event.target.value;
    renderApplicants();
    writeUrlState();
  });

  els.sortBy.addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    renderApplicants();
    writeUrlState();
  });

  els.clearPinsBtn.addEventListener("click", () => {
    state.pins.clear();
    renderApplicants();
    renderCompareDock();
  });

  document.addEventListener("click", onGlobalClick);

  els.tooltipClose.addEventListener("click", () => {
    hideTooltip();
  });

  els.slowerBtn.addEventListener("click", () => setReplaySpeed(state.replay.speed - 0.25));
  els.fasterBtn.addEventListener("click", () => setReplaySpeed(state.replay.speed + 0.25));
  els.stepBackBtn.addEventListener("click", () => stepReplay(-1));
  els.stepForwardBtn.addEventListener("click", () => stepReplay(1));
  els.playPauseBtn.addEventListener("click", () => toggleReplayPlayback());

  els.timelineSlider.addEventListener("input", (event) => {
    seekReplay(Number(event.target.value));
  });

  els.openFormContext.addEventListener("click", () => {
    if (!state.replay.applicant) return;
    openApplicantContextPopup(state.replay.applicant, "form_context");
  });

  els.printFormBtn.addEventListener("click", () => {
    printCurrentFormSheet();
  });
}

function onGlobalClick(event) {
  const closeTarget = event.target.closest("[data-close-modal]");
  if (closeTarget) {
    closeModal(closeTarget.dataset.closeModal);
    return;
  }

  const card = event.target.closest(".applicant-card");
  if (card) {
    const applicantId = card.dataset.applicantId;
    const applicant = getApplicantById(applicantId);
    if (!applicant) return;

    if (event.target.closest(".chat-recording-btn")) {
      openReplay(applicantId, { autoplay: true, useUrlState: false });
      return;
    }

    if (event.target.closest(".pin-btn")) {
      togglePin(applicantId);
      return;
    }

    const docBtn = event.target.closest(".doc-link");
    if (docBtn) {
      openFilePopup(applicant, docBtn.dataset.docId);
      return;
    }

    const contextItem = event.target.closest(".context-item");
    if (contextItem) {
      openApplicantContextPopup(applicant, contextItem.dataset.key || "context");
      return;
    }

    const metric = event.target.closest(".metric.clickable");
    if (metric) {
      openApplicantContextPopup(applicant, metric.dataset.metric || "summary");
      return;
    }
  }

  const replayDoc = event.target.closest(".upload-link");
  if (replayDoc && state.replay.applicant) {
    openFilePopup(state.replay.applicant, replayDoc.dataset.docId, replayDoc.dataset.fileLink || null);
    return;
  }

  const timelineTag = event.target.closest(".timeline-tag");
  if (timelineTag && state.replay.open) {
    seekReplay(Number(timelineTag.dataset.step));
    return;
  }

  const formRow = event.target.closest(".form-field-row.clickable");
  if (formRow && state.replay.applicant) {
    openFieldContextPopup(formRow.dataset.fieldId);
    return;
  }

  const outsideTooltip = !event.target.closest("#tooltip") && !event.target.closest("[data-tip]");
  if (outsideTooltip) {
    hideTooltip();
  }
}

function renderHeroStats() {
  const applicants = state.applicants;
  const escalations = applicants.filter((a) => String(a.conversation_outcome?.status || "").includes("escalated")).length;
  const docCount = applicants.reduce((sum, applicant) => sum + (applicant.document_bundle?.length || 0), 0);
  const languages = new Set(applicants.map((applicant) => applicant.profile?.first_language)).size;
  const longest = Math.max(...applicants.map((applicant) => applicant.chat_conversation?.length || 0));

  els.heroStats.innerHTML = "";
  const chips = [
    `${applicants.length} Applicant Scenarios`,
    `${docCount} Synthetic Documents`,
    `${languages} First-Language Backgrounds`,
    `${escalations} Escalations to Human Advisor`,
    `Up to ${longest} Chat Turns Per Scenario`,
    `${state.dataset.generated_on} Dataset Build Date`,
  ];

  for (const label of chips) {
    const chip = document.createElement("span");
    chip.className = "stat-chip";
    chip.textContent = label;
    els.heroStats.append(chip);
  }
}

function populateFilterControls() {
  const languageSet = new Set();
  const riskSet = new Set();

  for (const applicant of state.applicants) {
    languageSet.add(applicant.profile?.first_language || "Unknown");
    for (const risk of applicant.financial_aid_context?.risk_flags || []) {
      riskSet.add(risk);
    }
  }

  fillSelect(els.languageFilter, Array.from(languageSet).sort((a, b) => a.localeCompare(b)), state.filters.language);
  fillSelect(
    els.riskFilter,
    Array.from(riskSet).sort((a, b) => a.localeCompare(b)),
    state.filters.risk,
    (value) => prettifyLabel(value)
  );

  els.searchInput.value = state.filters.search;
  els.sortBy.value = state.filters.sort;
}

function fillSelect(selectEl, options, selectedValue, labelFormatter = (v) => v) {
  for (const optionLabel of options) {
    const option = document.createElement("option");
    option.value = optionLabel;
    option.textContent = labelFormatter(optionLabel);
    selectEl.append(option);
  }
  if (selectedValue && [...selectEl.options].some((opt) => opt.value === selectedValue)) {
    selectEl.value = selectedValue;
  }
}

function getFilteredApplicants() {
  const query = state.filters.search.toLowerCase();

  const filtered = state.applicants.filter((applicant) => {
    const language = applicant.profile?.first_language || "";
    const risks = applicant.financial_aid_context?.risk_flags || [];

    if (state.filters.language !== "all" && language !== state.filters.language) {
      return false;
    }

    if (state.filters.risk !== "all" && !risks.includes(state.filters.risk)) {
      return false;
    }

    if (!query) return true;

    const searchable = [
      applicant.applicant_id,
      applicant.profile?.full_name,
      applicant.profile?.background_summary,
      applicant.profile?.first_language,
      applicant.profile?.enrollment_goal,
      ...(applicant.financial_aid_context?.risk_flags || []),
      ...(applicant.required_forms || []),
      ...(applicant.financial_aid_context?.selected_for || []),
      ...(applicant.chat_conversation || []).flatMap((item) => [item.intent, item.message, item.translated_message_en]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });

  filtered.sort((a, b) => sortApplicants(a, b, state.filters.sort));
  return filtered;
}

function sortApplicants(a, b, mode) {
  if (mode === "turns_desc") {
    return (b.chat_conversation?.length || 0) - (a.chat_conversation?.length || 0);
  }
  if (mode === "name") {
    return (a.profile?.full_name || "").localeCompare(b.profile?.full_name || "");
  }
  if (mode === "completion") {
    const aCompletion = Number(a.conversation_outcome?.completion_percent ?? a.conversation_outcome?.completion_percent_before_handoff ?? 0);
    const bCompletion = Number(b.conversation_outcome?.completion_percent ?? b.conversation_outcome?.completion_percent_before_handoff ?? 0);
    return bCompletion - aCompletion;
  }
  return getStressScore(b) - getStressScore(a);
}

function getStressScore(applicant) {
  const risk = applicant.financial_aid_context?.risk_flags || [];
  const turns = applicant.chat_conversation || [];
  let score = 0;

  if (risk.includes("high_stress") || risk.includes("enrollment_dropout_risk")) score += 2.2;
  if (risk.includes("housing_insecurity") || risk.includes("trauma_history")) score += 1.6;
  if (String(applicant.conversation_outcome?.status || "").includes("escalated")) score += 1.4;

  for (const turn of turns) {
    const sentiment = turn.sentiment || "";
    if (sentiment.includes("panicked") || sentiment.includes("high_stress")) score += 0.75;
    if (turn.intent && turn.intent.includes("escalate")) score += 0.5;
  }

  return score;
}

function renderApplicants() {
  const applicants = getFilteredApplicants();
  els.applicantGrid.innerHTML = "";

  if (!applicants.length) {
    els.applicantGrid.innerHTML = `
      <div class="no-results">
        <h2>No applicants match current filters</h2>
        <p>Try clearing one or more filters to see all scenarios.</p>
      </div>
    `;
    renderCompareDock();
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const applicant of applicants) {
    const card = buildApplicantCard(applicant);
    fragment.append(card);
  }

  els.applicantGrid.append(fragment);
  renderCompareDock();
}

function buildApplicantCard(applicant) {
  const template = els.cardTemplate.content.cloneNode(true);
  const card = template.querySelector(".applicant-card");
  card.dataset.applicantId = applicant.applicant_id;

  const nameEl = template.querySelector(".card-name");
  nameEl.textContent = applicant.profile?.full_name || applicant.applicant_id;

  const idEl = template.querySelector(".card-id");
  idEl.textContent = applicant.applicant_id;

  const pinBtn = template.querySelector(".pin-btn");
  const pinned = state.pins.has(applicant.applicant_id);
  pinBtn.setAttribute("aria-pressed", pinned ? "true" : "false");
  pinBtn.textContent = pinned ? "Pinned" : "Pin";

  template.querySelector(".card-summary").textContent = applicant.profile?.background_summary || "";

  const tagsEl = template.querySelector(".profile-tags");
  const tags = [
    `Language: ${applicant.profile?.first_language}`,
    `English: ${applicant.profile?.english_proficiency}`,
    `Tech: ${applicant.profile?.tech_savviness}`,
    `Aid Literacy: ${applicant.profile?.financial_aid_literacy}`,
  ];
  for (const risk of applicant.financial_aid_context?.risk_flags || []) {
    tags.push(`Risk: ${prettifyLabel(risk)}`);
  }

  for (const label of tags) {
    const span = document.createElement("span");
    if (label.startsWith("Risk:")) {
      const severity = classifyRiskSeverity(label);
      span.className = `tag risk ${severity}`;
    } else {
      span.className = "tag";
    }
    span.textContent = label;
    tagsEl.append(span);
  }

  const contextEl = template.querySelector(".context-grid");
  const contextItems = [
    ["selected_for", "Selected For", (v) => (Array.isArray(v) ? v.map(prettifyLabel).join(", ") : prettifyLabel(v))],
    ["dependency_status", "Dependency", (v) => prettifyLabel(v)],
    ["sai_estimate", "SAI", (v) => (v === null || v === undefined ? "N/A (state flow)" : formatNumber(v))],
    ["reported_prior_year_income_usd", "Prior Income", (v) => formatCurrency(v)],
    ["current_year_income_usd", "Current Income", (v) => formatCurrency(v)],
    ["household_size", "Household", (v) => String(v)],
  ];

  for (const [key, label, formatter] of contextItems) {
    const value = applicant.financial_aid_context?.[key];
    const item = document.createElement("button");
    item.type = "button";
    item.className = "context-item clickable";
    item.dataset.key = key;
    item.setAttribute("data-tip", `Open detailed context for ${label.toLowerCase()} calculations and references.`);
    item.innerHTML = `<span class="context-label">${escapeHtml(label)}</span><span class="context-value">${escapeHtml(
      formatter(value)
    )}</span>`;
    contextEl.append(item);
  }

  const docsEl = template.querySelector(".doc-list");
  for (const doc of applicant.document_bundle || []) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "doc-link";
    btn.dataset.docId = doc.doc_id;
    btn.innerHTML = `
      <span class="doc-title">${escapeHtml(doc.title)}</span>
      <span class="attachment-badges">
        ${attachmentBadgeHtml(doc)}
      </span>
    `;
    li.append(btn);
    docsEl.append(li);
  }

  template.querySelector(".chat-summary").textContent = applicant.demo_hook?.heart_moment || "";

  const metricsEl = template.querySelector(".chat-metrics");
  const conversationTurns = applicant.chat_conversation?.length || 0;
  const docMentions = (applicant.chat_conversation || []).reduce((sum, item) => sum + (item.document_links?.length || 0), 0);
  const updateMentions = (applicant.chat_conversation || []).reduce((sum, item) => sum + (item.form_updates?.length || 0), 0);
  const outcome = applicant.conversation_outcome?.status || "unknown";

  const metrics = [
    ["Turns", String(conversationTurns)],
    ["Doc Mentions", String(docMentions)],
    ["Field Updates", String(updateMentions)],
    ["Outcome", prettifyLabel(outcome)],
  ];

  for (const [label, value] of metrics) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "metric clickable";
    chip.dataset.metric = label.toLowerCase().replace(/\s+/g, "_");
    chip.textContent = `${label}: ${value}`;
    metricsEl.append(chip);
  }

  const outcomePill = document.createElement("span");
  outcomePill.className = `outcome-pill ${getOutcomeClass(outcome)}`;
  outcomePill.textContent = prettyOutcome(outcome);
  metricsEl.append(outcomePill);

  const replayBtn = template.querySelector(".chat-recording-btn");
  replayBtn.textContent = "Chat Recording";

  return card;
}

function renderCompareDock() {
  const pinnedApplicants = [...state.pins]
    .map((id) => getApplicantById(id))
    .filter(Boolean)
    .slice(0, 4);

  if (!pinnedApplicants.length) {
    els.compareDock.hidden = true;
    els.compareGrid.innerHTML = "";
    return;
  }

  els.compareDock.hidden = false;
  els.compareGrid.innerHTML = "";

  for (const applicant of pinnedApplicants) {
    const tile = document.createElement("article");
    tile.className = "compare-tile";
    tile.innerHTML = `
      <h3>${escapeHtml(applicant.profile?.preferred_name || applicant.profile?.full_name || applicant.applicant_id)}</h3>
      <ul class="compare-list">
        <li>Language: ${escapeHtml(applicant.profile?.first_language || "-")}</li>
        <li>Dependency: ${escapeHtml(applicant.financial_aid_context?.dependency_status || "-")}</li>
        <li>Outcome: ${escapeHtml(prettyOutcome(applicant.conversation_outcome?.status || "-"))}</li>
      </ul>
    `;
    els.compareGrid.append(tile);
  }
}

function togglePin(applicantId) {
  if (state.pins.has(applicantId)) {
    state.pins.delete(applicantId);
  } else {
    state.pins.add(applicantId);
  }
  renderApplicants();
}

function openFilePopup(applicant, docId, fallbackFileLink = null) {
  const match = resolveDocument(applicant, docId, fallbackFileLink);
  if (!match) return;

  const { doc, fileUrl } = match;
  els.fileModalTitle.textContent = `${doc.title}`;
  els.openOriginalLink.href = fileUrl;
  els.filePreview.innerHTML = "";
  els.fileLoading.classList.remove("hidden");
  els.fileLoading.textContent = "Loading file preview...";

  openModal("file");
  renderFilePreview(doc, fileUrl).catch((error) => {
    els.fileLoading.classList.remove("hidden");
    els.fileLoading.textContent = `Preview failed: ${String(error)}`;
  });
}

function resolveDocument(applicant, docId, fallbackFileLink = null) {
  if (!applicant) return null;
  let doc = null;

  if (docId) {
    doc = (applicant.document_bundle || []).find((item) => item.doc_id === docId);
  }

  if (!doc && fallbackFileLink) {
    const fileName = fallbackFileLink.replace(/^\.\//, "");
    doc = (applicant.document_bundle || []).find((item) => item.file_name === fileName);
  }

  if (!doc) return null;

  const fileUrl = `./data/${applicant.folder_name}/${doc.file_name}`;
  return { doc, fileUrl };
}

async function renderFilePreview(doc, fileUrl) {
  const ext = (doc.format || "").toLowerCase();
  els.filePreview.innerHTML = "";

  if (ext === "pdf") {
    const iframe = document.createElement("iframe");
    iframe.className = "preview-frame";
    iframe.src = `${fileUrl}#view=FitH&toolbar=0`;
    iframe.setAttribute("title", doc.title);
    iframe.addEventListener("load", () => {
      els.fileLoading.classList.add("hidden");
    });
    els.filePreview.append(iframe);
    return;
  }

  if (["webp", "png", "jpg", "jpeg"].includes(ext)) {
    const img = document.createElement("img");
    img.className = "preview-image";
    img.src = fileUrl;
    img.alt = doc.title;
    img.addEventListener("load", () => {
      els.fileLoading.classList.add("hidden");
    });
    els.filePreview.append(img);
    return;
  }

  const text = await fetchText(fileUrl);
  els.fileLoading.classList.add("hidden");

  if (ext === "csv") {
    renderCsvPreview(text, els.filePreview);
    return;
  }

  const pre = document.createElement("pre");
  pre.className = "preview-code";
  const codeLike = ["js", "ts", "tsx", "jsx", "json", "html", "css", "md", "py", "txt"].includes(ext);
  if (codeLike) {
    pre.innerHTML = highlightCode(text, ext);
  } else {
    pre.textContent = text;
  }
  els.filePreview.append(pre);
}

async function fetchText(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch ${url}`);
  }
  return response.text();
}

function renderCsvPreview(csvText, container) {
  const rows = csvText
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((item) => item.trim()));

  if (!rows.length) {
    container.innerHTML = '<p class="visually-muted">No data rows found.</p>';
    return;
  }

  let sortState = { column: 0, direction: 1 };

  const wrap = document.createElement("div");
  wrap.className = "preview-table-wrap";
  const table = document.createElement("table");
  table.className = "preview-table";
  wrap.append(table);
  container.append(wrap);

  const render = () => {
    table.innerHTML = "";
    const [header, ...body] = rows;
    const sorted = body
      .slice()
      .sort((a, b) => compareCsvCell(a[sortState.column], b[sortState.column]) * sortState.direction);

    const thead = document.createElement("thead");
    const htr = document.createElement("tr");

    header.forEach((label, idx) => {
      const th = document.createElement("th");
      th.textContent = idx === sortState.column ? `${label} ${sortState.direction === 1 ? "▲" : "▼"}` : label;
      th.addEventListener("click", () => {
        if (sortState.column === idx) {
          sortState.direction *= -1;
        } else {
          sortState.column = idx;
          sortState.direction = 1;
        }
        render();
      });
      htr.append(th);
    });

    thead.append(htr);
    table.append(thead);

    const numericColumns = header.map((_, colIdx) =>
      sorted.every((row) => Number.isFinite(Number(String(row[colIdx]).replace(/[^0-9.-]/g, ""))) && row[colIdx] !== "")
    );

    const tbody = document.createElement("tbody");
    sorted.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell, colIdx) => {
        const td = document.createElement("td");
        td.textContent = cell;
        if (numericColumns[colIdx]) {
          td.classList.add("num");
          const value = Number(String(cell).replace(/[^0-9.-]/g, ""));
          const heat = calcHeatClass(sorted, colIdx, value);
          td.classList.add(heat);
        }
        tr.append(td);
      });
      tbody.append(tr);
    });

    table.append(tbody);
  };

  render();
  els.fileLoading.classList.add("hidden");
}

function compareCsvCell(a, b) {
  const aa = Number(String(a).replace(/[^0-9.-]/g, ""));
  const bb = Number(String(b).replace(/[^0-9.-]/g, ""));
  if (Number.isFinite(aa) && Number.isFinite(bb)) {
    return aa - bb;
  }
  return String(a).localeCompare(String(b));
}

function calcHeatClass(rows, col, value) {
  const values = rows
    .map((row) => Number(String(row[col]).replace(/[^0-9.-]/g, "")))
    .filter((num) => Number.isFinite(num));

  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const normalized = (value - min) / span;
  if (normalized > 0.66) return "heat-high";
  if (normalized > 0.33) return "heat-mid";
  return "heat-low";
}

function highlightCode(text, ext) {
  if (ext === "json") {
    const escaped = escapeHtml(text);
    return escaped.replace(
      /(&quot;[^&]+&quot;)(\\s*:\\s*)|(&quot;[^&]+&quot;)|(\\b-?\\d+(?:\\.\\d+)?\\b)|(\\btrue\\b|\\bfalse\\b|\\bnull\\b)/g,
      (match, key, colon, stringValue, numberValue, literalValue) => {
        if (key) {
          return `<span class="tok-key">${key}</span>${colon || ""}`;
        }
        if (stringValue) {
          return `<span class="tok-string">${stringValue}</span>`;
        }
        if (numberValue) {
          return `<span class="tok-number">${numberValue}</span>`;
        }
        if (literalValue) {
          return `<span class="tok-literal">${literalValue}</span>`;
        }
        return match;
      }
    );
  }

  let escaped = escapeHtml(text);
  escaped = escaped.replace(
    /\b(const|let|var|function|return|if|else|for|while|class|async|await|import|export|from|new|try|catch|throw)\b/g,
    '<span class="tok-keyword">$1</span>'
  );
  escaped = escaped.replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g, '<span class="tok-string">$1</span>');
  escaped = escaped.replace(/\b-?\d+(?:\.\d+)?\b/g, '<span class="tok-number">$&</span>');
  escaped = escaped.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>');
  return escaped;
}

function openApplicantContextPopup(applicant, emphasis = "context") {
  const prior = applicant.financial_aid_context?.reported_prior_year_income_usd ?? 0;
  const current = applicant.financial_aid_context?.current_year_income_usd ?? 0;
  const delta = current - prior;
  const deltaLabel = `${delta >= 0 ? "+" : ""}${formatCurrency(delta)}`;

  els.contextModalTitle.textContent = `${applicant.profile?.full_name} Context`;

  els.contextModalBody.innerHTML = `
    <section class="context-panel">
      <p><strong>Focus:</strong> ${escapeHtml(formatEmphasis(emphasis))}</p>
      <p>${escapeHtml(applicant.demo_hook?.title || "Scenario walkthrough")}</p>
      <div class="context-cards">
        <article class="mini-card">
          <h4>Prior-Year Income</h4>
          <p>${escapeHtml(formatCurrency(prior))}</p>
        </article>
        <article class="mini-card">
          <h4>Current Income</h4>
          <p>${escapeHtml(formatCurrency(current))}</p>
        </article>
        <article class="mini-card">
          <h4>Income Delta</h4>
          <p>${escapeHtml(deltaLabel)}</p>
        </article>
      </div>
      <div class="delta-chart">
        <div class="delta-row">
          <span>Prior</span>
          <div class="delta-bar"><div class="delta-fill prior" data-fill="${Math.max(prior, current) ? (prior / Math.max(prior, current)) * 100 : 0}"></div></div>
          <span class="delta-value">${escapeHtml(formatCurrency(prior))}</span>
        </div>
        <div class="delta-row">
          <span>Current</span>
          <div class="delta-bar"><div class="delta-fill current" data-fill="${Math.max(prior, current) ? (current / Math.max(prior, current)) * 100 : 0}"></div></div>
          <span class="delta-value">${escapeHtml(formatCurrency(current))}</span>
        </div>
      </div>
      <article class="mini-card">
        <h4>Selected For</h4>
        <p>${escapeHtml((applicant.financial_aid_context?.selected_for || []).map(prettifyLabel).join(", ") || "Not specified")}</p>
      </article>
      <article class="mini-card">
        <h4>Risk Flags</h4>
        <p>${escapeHtml((applicant.financial_aid_context?.risk_flags || []).map(prettifyLabel).join(", ") || "None")}</p>
      </article>
    </section>
  `;

  openModal("context");

  requestAnimationFrame(() => {
    els.contextModalBody.querySelectorAll(".delta-fill").forEach((bar) => {
      bar.style.width = `${bar.dataset.fill}%`;
    });
  });
}

function formatEmphasis(emphasis) {
  return emphasis
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function openFieldContextPopup(fieldId) {
  if (!state.replay.fieldHistory.has(fieldId)) return;
  const history = state.replay.fieldHistory.get(fieldId) || [];
  const latest = history[history.length - 1];

  els.contextModalTitle.textContent = `${latest.field_label} Field Trace`;

  const listRows = history
    .map(
      (entry, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(formatValue(entry.new_value))}</td>
          <td>${escapeHtml(entry.source)}</td>
          <td>${escapeHtml(String(entry.confidence))}</td>
        </tr>`
    )
    .join("");

  els.contextModalBody.innerHTML = `
    <section class="context-panel">
      <article class="mini-card"><h4>Field ID</h4><p>${escapeHtml(fieldId)}</p></article>
      <article class="mini-card"><h4>Form</h4><p>${escapeHtml(latest.form_id)}</p></article>
      <article class="mini-card"><h4>Latest Value</h4><p>${escapeHtml(formatValue(latest.new_value))}</p></article>
      <div class="preview-table-wrap">
        <table class="preview-table">
          <thead><tr><th>#</th><th>Value</th><th>Source</th><th>Confidence</th></tr></thead>
          <tbody>${listRows}</tbody>
        </table>
      </div>
    </section>
  `;

  openModal("context");
}

function openReplay(applicantId, options = {}) {
  const applicant = getApplicantById(applicantId);
  if (!applicant) return;

  state.replay.open = true;
  state.replay.applicant = applicant;
  state.replay.turns = applicant.chat_conversation || [];
  state.replay.displayedCount = 0;
  state.replay.mode = "paused";
  state.replay.token += 1;
  state.replay.formFields = new Map();
  state.replay.fieldHistory = new Map();
  state.replay.lastUpdatedFieldId = null;
  state.replay.activeFormId = null;
  state.replay.advisorBrief = null;

  const useUrlState = Boolean(options.useUrlState);
  const initialStep = useUrlState ? clampNumber(URL_STATE.turn, 0, state.replay.turns.length, 0) : 0;
  const initialSpeed = useUrlState ? clampNumber(URL_STATE.speed, 0.5, 3, 1) : 1;
  const shouldAutoplay = options.autoplay ?? (useUrlState ? URL_STATE.playing : true);

  setReplaySpeed(initialSpeed, { writeUrl: false });
  els.replayTitle.textContent = `${applicant.profile?.full_name} - Chat Recording`;

  renderReplayTop(applicant);
  renderTimelineTags();
  seekReplay(initialStep, { quiet: true });

  openModal("replay");

  if (shouldAutoplay) {
    setReplayMode("playing");
    window.setTimeout(() => {
      if (state.replay.open && state.replay.applicant?.applicant_id === applicantId) {
        ensureReplayLoop();
      }
    }, 90);
  }

  writeUrlState();
}

function renderReplayTop(applicant) {
  const profile = applicant.profile || {};
  const context = applicant.financial_aid_context || {};

  els.replayTop.innerHTML = `
    <article class="replay-info-card">
      <h3>Student Profile</h3>
      <div class="replay-profile-lines">
        ${replayLine("Name", profile.full_name)}
        ${replayLine("Age", profile.age)}
        ${replayLine("Language", `${profile.first_language} (${profile.english_proficiency})`)}
        ${replayLine("Tech", profile.tech_savviness)}
        ${replayLine("Aid Literacy", profile.financial_aid_literacy)}
        ${replayLine("Device", profile.device_primary)}
      </div>
    </article>
    <article class="replay-info-card">
      <h3>Financial Aid Context</h3>
      <div class="replay-context-lines">
        ${replayLine("Institution", context.institution)}
        ${replayLine("Aid Year", context.aid_year)}
        ${replayLine("Dependency", context.dependency_status)}
        ${replayLine("SAI", context.sai_estimate === null ? "N/A" : formatNumber(context.sai_estimate))}
        ${replayLine("Prior Income", formatCurrency(context.reported_prior_year_income_usd))}
        ${replayLine("Current Income", formatCurrency(context.current_year_income_usd))}
      </div>
    </article>
  `;
}

function replayLine(key, value) {
  return `<div class="replay-line"><span class="k">${escapeHtml(key)}</span><span>${escapeHtml(String(value ?? "-"))}</span></div>`;
}

function renderTimelineTags() {
  els.timelineTags.innerHTML = "";

  for (let idx = 0; idx < state.replay.turns.length; idx += 1) {
    const turn = state.replay.turns[idx];
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "timeline-tag";
    tag.dataset.step = String(idx + 1);
    tag.setAttribute(
      "data-tip",
      `Turn ${turn.turn} | ${formatTurnTimestamp(turn.timestamp)} | ${turn.speaker} | intent=${turn.intent} | sentiment=${turn.sentiment}`
    );
    tag.textContent = `T${turn.turn} ${turn.speaker}`;
    els.timelineTags.append(tag);
  }
}

function seekReplay(stepCount, options = {}) {
  if (!state.replay.open) return;

  const clamped = clampNumber(stepCount, 0, state.replay.turns.length, 0);
  state.replay.mode = "paused";
  state.replay.token += 1;

  state.replay.displayedCount = 0;
  state.replay.formFields = new Map();
  state.replay.fieldHistory = new Map();
  state.replay.lastUpdatedFieldId = null;
  state.replay.activeFormId = null;
  state.replay.advisorBrief = null;

  els.chatStream.innerHTML = "";
  setThinking(false, "Waiting for next event...");
  els.advisorCard.hidden = true;
  els.advisorCardBody.innerHTML = "";

  for (let idx = 0; idx < clamped; idx += 1) {
    const turn = state.replay.turns[idx];
    appendTurnBubble(turn, { stream: false });
    applyTurnFormUpdates(turn, { animate: false });
    updateAdvisorBrief(turn, { quiet: true });
  }

  renderFormSheet();
  state.replay.displayedCount = clamped;
  refreshReplayUi();

  if (!options.quiet) {
    writeUrlState();
  }
}

function stepReplay(direction) {
  if (!state.replay.open) return;
  const next = clampNumber(state.replay.displayedCount + direction, 0, state.replay.turns.length, 0);
  seekReplay(next);
}

function setReplaySpeed(nextSpeed, options = {}) {
  state.replay.speed = clampNumber(nextSpeed, 0.5, 3, 1);
  els.speedChip.textContent = `${state.replay.speed.toFixed(2)}x`;
  if (options.writeUrl !== false) {
    writeUrlState();
  }
}

function toggleReplayPlayback() {
  if (!state.replay.open) return;

  if (state.replay.mode === "playing") {
    setReplayMode("paused");
  } else {
    if (state.replay.displayedCount >= state.replay.turns.length) {
      seekReplay(0, { quiet: true });
    }
    setReplayMode("playing");
    ensureReplayLoop();
  }

  writeUrlState();
}

function setReplayMode(mode) {
  state.replay.mode = mode;
  els.playPauseBtn.textContent = mode === "playing" ? "Pause" : "Play";
}

function refreshReplayUi() {
  const total = state.replay.turns.length;
  els.timelineSlider.max = String(total);
  els.timelineSlider.value = String(state.replay.displayedCount);
  els.timelineLabel.textContent = `Step ${state.replay.displayedCount}/${total}`;

  const elapsed = replayElapsedMs();
  els.timelineClock.textContent = formatDuration(elapsed);

  const currentTagIndex = Math.max(0, state.replay.displayedCount - 1);
  els.timelineTags.querySelectorAll(".timeline-tag").forEach((tag, idx) => {
    tag.classList.toggle("active", idx === currentTagIndex && state.replay.displayedCount > 0);
  });

  const done = state.replay.displayedCount >= total;
  els.stepForwardBtn.disabled = done;
  els.playPauseBtn.disabled = total === 0;
  els.stepBackBtn.disabled = state.replay.displayedCount === 0;
}

function replayElapsedMs() {
  if (!state.replay.turns.length || state.replay.displayedCount === 0) return 0;

  const first = Date.parse(state.replay.turns[0].timestamp);
  const last = Date.parse(state.replay.turns[state.replay.displayedCount - 1].timestamp);
  if (Number.isFinite(first) && Number.isFinite(last)) {
    return Math.max(0, last - first);
  }
  return state.replay.displayedCount * 120000;
}

function ensureReplayLoop() {
  if (state.replay.loopRunning || !state.replay.open) return;

  state.replay.loopRunning = true;
  const token = state.replay.token;

  (async () => {
    try {
      while (token === state.replay.token && state.replay.displayedCount < state.replay.turns.length) {
        if (state.replay.mode !== "playing") {
          await sleep(60);
          continue;
        }

        const nextIndex = state.replay.displayedCount;
        await streamTurn(nextIndex, token);

        if (token !== state.replay.token) return;

        state.replay.displayedCount += 1;
        refreshReplayUi();
        writeUrlState();
      }

      if (state.replay.displayedCount >= state.replay.turns.length) {
        setReplayMode("paused");
      }
    } finally {
      state.replay.loopRunning = false;
      refreshReplayUi();
    }
  })().catch((error) => {
    if (String(error) !== "cancelled") {
      console.error(error);
    }
    state.replay.loopRunning = false;
  });
}

async function streamTurn(index, token) {
  const turn = state.replay.turns[index];
  if (!turn) return;

  const bubble = appendTurnBubble(turn, { stream: true, deferDetails: true });
  const messageEl = bubble.querySelector(".message-text");

  if (turn.speaker === "ai" || turn.speaker === "advisor") {
    const processingLabel =
      turn.form_updates?.length || turn.document_links?.length
        ? "Analyzing documents and mapping to form fields..."
        : "Reasoning over conversation context...";

    setThinking(true, processingLabel);
    await controlledDelay((1000 + Math.random() * 2000) / state.replay.speed, token);
    await streamByWord(messageEl, turn.message, token);
    setThinking(false, "Response sent");
  } else {
    setThinking(false, "Student is typing...");
    await streamByCharacter(messageEl, turn.message, token);
  }

  messageEl.classList.remove("message-cursor");
  await attachTurnDetails(turn, bubble, { stream: true, token });
  updateAdvisorBrief(turn);

  if (turn.form_updates?.length) {
    setThinking(true, `Updating ${turn.form_updates.length} form field${turn.form_updates.length > 1 ? "s" : ""}...`);
    await applyTurnFormUpdatesStreaming(turn, token);
    setThinking(false, "Form sync complete");
  }

  if (turn.metadata?.escalation_trigger) {
    setThinking(true, `Escalation route: ${turn.metadata.handoff_to || "advisor"}`);
    await controlledDelay(250 / state.replay.speed, token);
    setThinking(false, "Human handoff packet prepared");
  }

  refreshReplayUi();
  scrollChatToBottom();
}

function appendTurnBubble(turn, options = { stream: false, deferDetails: false }) {
  const bubble = document.createElement("article");
  bubble.className = `chat-bubble ${turn.speaker}`;

  const head = document.createElement("div");
  head.className = "bubble-head";
  head.innerHTML = `
    <span class="speaker-pill">${escapeHtml(turn.speaker)}</span>
    <span>${escapeHtml(formatTurnTimestamp(turn.timestamp))}</span>
  `;

  const message = document.createElement("p");
  message.className = "message-text";
  message.textContent = options.stream ? "" : turn.message;
  if (options.stream) {
    message.classList.add("message-cursor");
  }

  bubble.append(head, message);

  if (!options.deferDetails) {
    attachTurnDetails(turn, bubble, { stream: false }).catch((error) => console.error(error));
  }

  els.chatStream.append(bubble);
  scrollChatToBottom();
  return bubble;
}

async function attachTurnDetails(turn, bubble, options = { stream: false, token: 0 }) {
  if (options.stream) {
    await controlledDelay(120 / state.replay.speed, options.token);
  }

  const metaTags = [turn.intent, turn.sentiment, turn.language].filter(Boolean);
  if (metaTags.length) {
    const metaWrap = document.createElement("div");
    metaWrap.className = "meta-tags";
    for (const tag of metaTags) {
      const span = document.createElement("span");
      span.className = "meta-tag";
      span.textContent = tag;
      metaWrap.append(span);
    }
    bubble.append(metaWrap);
  }

  if (turn.translated_message_en && turn.language !== "en") {
    const translation = document.createElement("p");
    translation.className = "message-translation";
    translation.textContent = `EN translation: ${turn.translated_message_en}`;
    bubble.append(translation);
  }

  if (turn.document_links?.length && state.replay.applicant) {
    const uploadWrap = document.createElement("div");
    uploadWrap.className = "upload-links";
    for (const link of turn.document_links) {
      const resolved = resolveDocument(state.replay.applicant, link.doc_id, link.file_link);
      const doc = resolved?.doc || null;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "upload-link";
      button.dataset.docId = link.doc_id || "";
      button.dataset.fileLink = link.file_link || "";
      const fileName = doc?.file_name || link.file_link || link.doc_id || "attachment";
      button.innerHTML = `
        <span class="upload-name">${escapeHtml(fileName)}</span>
        <span class="attachment-badges">${attachmentBadgeHtml(doc)}</span>
      `;
      uploadWrap.append(button);
    }
    bubble.append(uploadWrap);
  }

  if (turn.metadata) {
    const metadataKeys = Object.keys(turn.metadata).filter((key) => !["advisor_action_items", "handoff_summary"].includes(key));
    if (metadataKeys.length) {
      const metaWrap = document.createElement("div");
      metaWrap.className = "meta-tags";
      for (const key of metadataKeys.slice(0, 3)) {
        const span = document.createElement("span");
        span.className = "meta-tag";
        span.textContent = `${prettifyLabel(key)}: ${formatValue(turn.metadata[key])}`;
        metaWrap.append(span);
      }
      bubble.append(metaWrap);
    }
  }

  scrollChatToBottom();
}

async function streamByCharacter(targetEl, text, token) {
  if (prefersReducedMotion) {
    targetEl.textContent = text;
    return;
  }

  targetEl.textContent = "";
  for (let idx = 0; idx < text.length; idx += 1) {
    ensureReplayToken(token);

    if (state.replay.mode !== "playing") {
      await waitForPlaybackResume(token);
    }

    targetEl.textContent += text[idx];

    const delay = studentTypingDelay(text[idx], idx) / state.replay.speed;
    await controlledDelay(delay, token);
  }
}

async function streamByWord(targetEl, text, token) {
  if (prefersReducedMotion) {
    targetEl.textContent = text;
    return;
  }

  const words = text.split(/\s+/).filter(Boolean);
  targetEl.textContent = "";

  for (let idx = 0; idx < words.length; idx += 1) {
    ensureReplayToken(token);

    if (state.replay.mode !== "playing") {
      await waitForPlaybackResume(token);
    }

    targetEl.textContent += `${idx === 0 ? "" : " "}${words[idx]}`;
    const punctuationPause = /[.!?,]$/.test(words[idx]) ? 140 : 0;
    const delay = (250 + Math.random() * 140 + punctuationPause) / state.replay.speed;
    await controlledDelay(delay, token);
  }
}

function studentTypingDelay(character, index) {
  let base = 24 + Math.random() * 64;
  if (index % 11 === 0) base += 40;
  if (index % 19 === 0) base += 60;
  if (/\s/.test(character)) base += 20;
  if (/[,.!?]/.test(character)) base += 120 + Math.random() * 50;
  return base;
}

async function applyTurnFormUpdatesStreaming(turn, token) {
  for (const update of turn.form_updates || []) {
    ensureReplayToken(token);
    if (state.replay.mode !== "playing") {
      await waitForPlaybackResume(token);
    }
    applyFormUpdate(update, { animate: true });
    await controlledDelay((220 + Math.random() * 170) / state.replay.speed, token);
  }
}

function applyTurnFormUpdates(turn, options = { animate: false }) {
  for (const update of turn.form_updates || []) {
    applyFormUpdate(update, options);
  }
}

function applyFormUpdate(update, options = { animate: false }) {
  state.replay.activeFormId = update.form_id;
  state.replay.lastUpdatedFieldId = update.field_id;

  const history = state.replay.fieldHistory.get(update.field_id) || [];
  history.push(update);
  state.replay.fieldHistory.set(update.field_id, history);

  state.replay.formFields.set(update.field_id, {
    field_id: update.field_id,
    field_label: update.field_label,
    new_value: update.new_value,
    source: update.source,
    confidence: update.confidence,
    form_id: update.form_id,
  });

  renderFormSheet(options.animate ? update.field_id : null);
}

function renderFormSheet(updatedFieldId = null) {
  els.formTitle.textContent = state.replay.activeFormId
    ? `Form: ${state.replay.activeFormId}`
    : "Form Fields";

  const entries = Array.from(state.replay.formFields.values());
  els.formFieldList.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "visually-muted";
    empty.textContent = "No fields updated yet.";
    els.formFieldList.append(empty);
    return;
  }

  for (const entry of entries) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "form-field-row clickable";
    row.dataset.fieldId = entry.field_id;
    const status = getFieldStatus(entry);
    row.setAttribute(
      "data-tip",
      `${entry.field_label} | ${status.label} | Source: ${entry.source} | Confidence: ${formatPercent(entry.confidence)}`
    );

    if (entry.field_id === updatedFieldId) {
      row.classList.add("updated");
    }

    row.innerHTML = `
      <span class="field-name">${escapeHtml(entry.field_label)}</span>
      <span class="field-value">${escapeHtml(formatValue(entry.new_value))}</span>
      <span class="field-status ${status.className}">${status.label}</span>
    `;

    els.formFieldList.append(row);
  }
}

function updateAdvisorBrief(turn, options = { quiet: false }) {
  if (turn.metadata?.handoff_summary || turn.metadata?.handoff_to) {
    state.replay.advisorBrief = {
      handoffTo: turn.metadata?.handoff_to || "Human advisor",
      trigger: turn.metadata?.escalation_trigger || "Manual escalation",
      summary: turn.metadata?.handoff_summary || "Advisor review requested.",
      actionItems: Array.isArray(turn.metadata?.advisor_action_items) ? turn.metadata.advisor_action_items : [],
      lastUpdate: formatTurnTimestamp(turn.timestamp),
      advisorMessage: "",
    };
  }

  if (turn.speaker === "advisor") {
    if (!state.replay.advisorBrief) {
      state.replay.advisorBrief = {
        handoffTo: "Human advisor",
        trigger: "Advisor engaged",
        summary: "Advisor has joined the conversation.",
        actionItems: [],
        lastUpdate: formatTurnTimestamp(turn.timestamp),
        advisorMessage: turn.message,
      };
    } else {
      state.replay.advisorBrief.lastUpdate = formatTurnTimestamp(turn.timestamp);
      state.replay.advisorBrief.advisorMessage = turn.message;
    }
  }

  if (!state.replay.advisorBrief) {
    els.advisorCard.hidden = true;
    return;
  }

  const brief = state.replay.advisorBrief;
  const itemLines = (brief.actionItems || [])
    .map((item) => `<li>${escapeHtml(prettifyLabel(item))}</li>`)
    .join("");
  const actionBlock = itemLines ? `<ul>${itemLines}</ul>` : "<p class=\"visually-muted\">No additional action items.</p>";
  const advisorMsg = brief.advisorMessage
    ? `<div class=\"advisor-point\"><strong>Latest Advisor Message:</strong> ${escapeHtml(brief.advisorMessage)}</div>`
    : "";

  els.advisorCardBody.innerHTML = `
    <div class="advisor-point"><strong>Assigned Advisor:</strong> ${escapeHtml(brief.handoffTo)}</div>
    <div class="advisor-point"><strong>Trigger:</strong> ${escapeHtml(prettifyLabel(brief.trigger))}</div>
    <div class="advisor-point"><strong>Summary:</strong> ${escapeHtml(brief.summary)}</div>
    <div class="advisor-point"><strong>Action Items:</strong> ${actionBlock}</div>
    <div class="advisor-point"><strong>Last Update:</strong> ${escapeHtml(brief.lastUpdate)}</div>
    ${advisorMsg}
  `;
  els.advisorCard.hidden = false;

  if (!options.quiet) {
    scrollChatToBottom();
  }
}

function setThinking(active, text) {
  els.thinkingCard.classList.toggle("active", active);
  els.thinkingText.textContent = text;
}

function scrollChatToBottom() {
  els.chatStream.scrollTop = els.chatStream.scrollHeight;
}

function ensureReplayToken(token) {
  if (token !== state.replay.token) {
    throw new Error("cancelled");
  }
}

async function waitForPlaybackResume(token) {
  while (state.replay.mode !== "playing") {
    ensureReplayToken(token);
    await sleep(60);
  }
}

async function controlledDelay(ms, token) {
  if (prefersReducedMotion) return;

  let remaining = ms;
  while (remaining > 0) {
    ensureReplayToken(token);
    if (state.replay.mode !== "playing") {
      await waitForPlaybackResume(token);
    }
    const chunk = Math.min(50, remaining);
    await sleep(chunk);
    remaining -= chunk;
  }
}

function closeModal(which) {
  if (!which) return;
  const modal = getModalByName(which);
  if (!modal) return;

  const previousFocus = state.modal.previousFocusByModal[which];
  const cleanup = state.modal.cleanupByModal[which];
  if (cleanup) {
    cleanup();
    delete state.modal.cleanupByModal[which];
  }

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  delete state.modal.previousFocusByModal[which];

  if (which === "replay") {
    state.replay.mode = "paused";
    state.replay.token += 1;
    state.replay.open = false;
    state.replay.loopRunning = false;
  }

  state.modal.stack = state.modal.stack.filter((item) => item !== which);
  const nextTop = state.modal.stack[state.modal.stack.length - 1];

  if (nextTop) {
    document.body.style.overflow = "hidden";
    const topModal = getModalByName(nextTop);
    if (topModal) {
      topModal.classList.remove("hidden");
      topModal.setAttribute("aria-hidden", "false");
      state.modal.cleanupByModal[nextTop] = trapFocus(topModal, nextTop);
      const focusTarget = topModal.querySelector(".close-btn") || topModal.querySelector("button, [href], input");
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus();
      }
    }
  } else {
    document.body.style.overflow = "";
    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  }

  writeUrlState();
}

function openModal(which) {
  const modal = getModalByName(which);
  if (!modal) return;

  const currentTop = state.modal.stack[state.modal.stack.length - 1];
  if (currentTop && state.modal.cleanupByModal[currentTop]) {
    state.modal.cleanupByModal[currentTop]();
    delete state.modal.cleanupByModal[currentTop];
  }

  if (!state.modal.stack.includes(which)) {
    state.modal.stack.push(which);
  }
  state.modal.previousFocusByModal[which] = document.activeElement;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  state.modal.cleanupByModal[which] = trapFocus(modal, which);

  const focusTarget = modal.querySelector(".close-btn") || modal.querySelector("button, [href], input");
  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus();
  }
}

function trapFocus(modal, which) {
  const selector =
    'a[href], button:not([disabled]), textarea, input, select, details,[tabindex]:not([tabindex="-1"])';

  const keyHandler = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal(which);
      return;
    }

    if (event.key !== "Tab") return;

    const focusables = [...modal.querySelectorAll(selector)].filter((el) => !el.hasAttribute("disabled"));
    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  modal.addEventListener("keydown", keyHandler);
  return () => {
    modal.removeEventListener("keydown", keyHandler);
  };
}

function getModalByName(which) {
  if (which === "file") return els.fileModal;
  if (which === "context") return els.contextModal;
  if (which === "replay") return els.replayModal;
  return null;
}

function getApplicantById(applicantId) {
  return state.applicants.find((applicant) => applicant.applicant_id === applicantId) || null;
}

function formatCurrency(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(number);
}

function formatNumber(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "N/A";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(number);
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${Math.round(number * 100)}%`;
}

function formatValue(value) {
  if (Array.isArray(value)) {
    return value.join("; ");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? formatNumber(value) : String(value);
  }
  return String(value ?? "");
}

function formatTurnTimestamp(value) {
  const match = String(value).match(/^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})/);
  if (!match) return String(value);
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour24 = Number(match[4]);
  const minute = Number(match[5]);

  const weekdayIndex = new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mm = String(minute).padStart(2, "0");
  const ampm = hour24 >= 12 ? "pm" : "am";
  const hh = hour24 % 12 || 12;
  return `${weekdays[weekdayIndex]} ${day} ${months[monthIndex]} ${year}, ${hh}:${mm} ${ampm}`;
}

function prettifyLabel(value) {
  const raw = String(value ?? "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .trim();
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function classifyRiskSeverity(text) {
  const lowered = String(text).toLowerCase();
  if (/(dropout|high stress|housing|trauma|crisis|escalat|flagged)/.test(lowered)) {
    return "risk-high";
  }
  return "risk-moderate";
}

function prettyOutcome(status) {
  const v = String(status || "").toLowerCase();
  if (v.includes("escalated")) return "Escalated to advisor";
  if (v.includes("submitted") || v.includes("complete") || v.includes("corrected")) return "Auto-filled and submitted";
  if (v.includes("ready")) return "Ready for review/signature";
  return prettifyLabel(status || "Unknown");
}

function getOutcomeClass(status) {
  const v = String(status || "").toLowerCase();
  if (v.includes("escalated")) return "escalated";
  if (v.includes("ready") || v.includes("pending") || v.includes("review")) return "review";
  return "success";
}

function getFieldStatus(entry) {
  const source = String(entry.source || "").toLowerCase();
  const confidence = Number(entry.confidence ?? 0);
  const value = String(entry.new_value ?? "").toLowerCase();

  if (value.includes("pending") || value.includes("discrepancy") || source.includes("rules_engine")) {
    return { className: "flag", label: "Flagged" };
  }
  if (source.includes("advisor") || confidence < 0.93) {
    return { className: "review", label: "Needs review" };
  }
  return { className: "auto", label: "Auto-filled" };
}

function attachmentBadgeHtml(doc) {
  if (!doc) {
    return '<span class="attachment-badge">FILE</span>';
  }

  const formatBadge = `<span class="attachment-badge">${escapeHtml(String(doc.format || "file").toUpperCase())}</span>`;
  const roleRaw = String(doc.document_role || "");
  const roleLabel =
    roleRaw === "student_upload"
      ? "Student"
      : roleRaw === "ai_generated"
        ? "AI draft"
        : roleRaw
          ? prettifyLabel(roleRaw)
          : "";
  const roleBadge = roleLabel ? `<span class="attachment-badge role">${escapeHtml(roleLabel)}</span>` : "";
  return `${formatBadge}${roleBadge}`;
}

function printCurrentFormSheet() {
  const applicant = state.replay.applicant;
  if (!applicant) return;

  const entries = Array.from(state.replay.formFields.values());
  const rows = entries
    .map((entry) => {
      const status = getFieldStatus(entry);
      return `<tr>
        <td>${escapeHtml(entry.field_label)}</td>
        <td>${escapeHtml(formatValue(entry.new_value))}</td>
        <td>${escapeHtml(status.label)}</td>
        <td>${escapeHtml(entry.source)}</td>
        <td>${escapeHtml(formatPercent(entry.confidence))}</td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(applicant.profile?.full_name || applicant.applicant_id)} - Form Print</title>
      <style>
        body { font-family: Georgia, serif; margin: 24px; color: #172f39; }
        h1 { font-size: 20px; margin: 0 0 6px; }
        p { margin: 0 0 10px; }
        .meta { font-size: 12px; color: #375662; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #9fb2bc; padding: 6px 7px; text-align: left; vertical-align: top; }
        th { background: #e8eef1; }
      </style>
    </head>
    <body>
      <h1>THE UNI Financial Aid Form (Auto-Prepared Copy)</h1>
      <p>${escapeHtml(applicant.profile?.full_name || "")} - ${escapeHtml(state.replay.activeFormId || "form")}</p>
      <p class="meta">Printed ${escapeHtml(formatTurnTimestamp(new Date().toISOString()))}</p>
      <table>
        <thead><tr><th>Field</th><th>Value</th><th>Status</th><th>Source</th><th>Confidence</th></tr></thead>
        <tbody>${rows || "<tr><td colspan='5'>No values captured yet.</td></tr>"}</tbody>
      </table>
    </body>
  </html>`;

  const win = window.open("", "_blank", "noopener,noreferrer,width=960,height=740");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  window.setTimeout(() => {
    win.print();
  }, 220);
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function initScrollytelling() {
  const steps = [...els.storyline.querySelectorAll(".story-step")];
  const nodes = [...els.flowSvg.querySelectorAll(".flow-node")];

  const activateStage = (stage) => {
    steps.forEach((step) => {
      step.classList.toggle("active", step.dataset.stage === stage);
    });
    nodes.forEach((node) => {
      node.classList.toggle("active", node.dataset.stage === stage);
    });
  };

  activateStage("intake");

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) {
        activateStage(visible.target.dataset.stage || "intake");
      }
    },
    { threshold: [0.3, 0.6, 0.9], rootMargin: "-10% 0px -30% 0px" }
  );

  steps.forEach((step) => observer.observe(step));
}

function initTooltips() {
  document.addEventListener(
    "mouseover",
    (event) => {
      const target = event.target.closest("[data-tip]");
      if (!target) return;
      queueTooltip(target);
    },
    true
  );

  document.addEventListener(
    "mouseout",
    (event) => {
      const target = event.target.closest("[data-tip]");
      if (!target) return;
      if (!els.tooltip.contains(event.relatedTarget)) {
        hideTooltip();
      }
    },
    true
  );

  document.addEventListener(
    "focusin",
    (event) => {
      const target = event.target.closest("[data-tip]");
      if (!target) return;
      showTooltip(target);
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      if (window.matchMedia("(hover: none)").matches) {
        const target = event.target.closest("[data-tip]");
        if (target) {
          showTooltip(target);
          return;
        }
      }

      if (!event.target.closest("#tooltip") && !event.target.closest("[data-tip]")) {
        hideTooltip();
      }
    },
    true
  );

  window.addEventListener("scroll", () => {
    if (state.tooltip.visibleFor) {
      positionTooltip(state.tooltip.visibleFor);
    }
  });

  window.addEventListener("resize", () => {
    if (state.tooltip.visibleFor) {
      positionTooltip(state.tooltip.visibleFor);
    }
  });
}

function queueTooltip(target) {
  window.clearTimeout(state.tooltip.timer);
  state.tooltip.timer = window.setTimeout(() => {
    showTooltip(target);
  }, 180);
}

function showTooltip(target) {
  if (!target?.dataset?.tip) return;

  state.tooltip.visibleFor = target;
  els.tooltipContent.textContent = target.dataset.tip;
  els.tooltip.classList.remove("hidden");
  els.tooltip.setAttribute("aria-hidden", "false");

  positionTooltip(target);
}

function hideTooltip() {
  window.clearTimeout(state.tooltip.timer);
  state.tooltip.visibleFor = null;
  els.tooltip.classList.add("hidden");
  els.tooltip.setAttribute("aria-hidden", "true");
}

function positionTooltip(target) {
  if (!target || els.tooltip.classList.contains("hidden")) return;

  const rect = target.getBoundingClientRect();
  const tipRect = els.tooltip.getBoundingClientRect();
  const viewportPadding = 8;

  let top = rect.bottom + 8;
  let left = rect.left;

  if (left + tipRect.width > window.innerWidth - viewportPadding) {
    left = window.innerWidth - tipRect.width - viewportPadding;
  }
  if (left < viewportPadding) {
    left = viewportPadding;
  }

  if (top + tipRect.height > window.innerHeight - viewportPadding) {
    top = rect.top - tipRect.height - 8;
  }
  if (top < viewportPadding) {
    top = viewportPadding;
  }

  els.tooltip.style.top = `${top}px`;
  els.tooltip.style.left = `${left}px`;
}

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("q") || "",
    language: params.get("lang") || "all",
    risk: params.get("risk") || "all",
    sort: params.get("sort") || "turns_desc",
    replayApplicantId: params.get("replay") || "",
    turn: params.get("turn") || "0",
    speed: params.get("speed") || "1",
    playing: params.get("play") === "1",
  };
}

function applyUrlFiltersIfPresent() {
  if (URL_STATE.q) state.filters.search = URL_STATE.q;
  if (URL_STATE.language) state.filters.language = URL_STATE.language;
  if (URL_STATE.risk) state.filters.risk = URL_STATE.risk;
  if (URL_STATE.sort) state.filters.sort = URL_STATE.sort;
}

function restoreReplayFromUrlIfNeeded() {
  if (!URL_STATE.replayApplicantId) return;
  const applicant = getApplicantById(URL_STATE.replayApplicantId);
  if (!applicant) return;
  openReplay(applicant.applicant_id, { autoplay: URL_STATE.playing, useUrlState: true });
}

function writeUrlState() {
  const params = new URLSearchParams();

  if (state.filters.search) params.set("q", state.filters.search);
  if (state.filters.language !== "all") params.set("lang", state.filters.language);
  if (state.filters.risk !== "all") params.set("risk", state.filters.risk);
  if (state.filters.sort !== "turns_desc") params.set("sort", state.filters.sort);

  if (state.replay.open && state.replay.applicant) {
    params.set("replay", state.replay.applicant.applicant_id);
    params.set("turn", String(state.replay.displayedCount));
    params.set("speed", String(state.replay.speed.toFixed(2)));
    if (state.replay.mode === "playing") params.set("play", "1");
  }

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
  history.replaceState({}, "", nextUrl);
}

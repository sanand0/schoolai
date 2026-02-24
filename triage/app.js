// @ts-check

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const CHANNEL_META = {
  email: { label: "Email", icon: "✉", color: "#1463ff", short: "EM" },
  web_chat: { label: "Web Chat", icon: "◍", color: "#0ea5a4", short: "WC" },
  web_form: { label: "Web Form", icon: "▤", color: "#7458ff", short: "WF" },
  sms: { label: "SMS", icon: "SMS", color: "#f08b35", short: "SMS" },
  whatsapp: { label: "WhatsApp", icon: "WA", color: "#2ea86f", short: "WA" },
  phone_voicemail: { label: "Voicemail", icon: "☎", color: "#ef5b44", short: "VM" },
  facebook_messenger: { label: "Messenger", icon: "f", color: "#0c72ff", short: "FB" },
  instagram_dm: { label: "Instagram DM", icon: "◎", color: "#ff6178", short: "IG" },
};

const PRIORITY_COLOR = {
  normal: "#1463ff",
  high: "#ef5b44",
  urgent: "#d43232",
};

const BASELINE_RESPONSE_SEC = 4 * 60 * 60; // storytelling baseline for manual first response
const MAX_FEED_ITEMS = 30;
const CHART_HISTORY_LIMIT = 160;

/** @type {ReturnType<typeof makeDom>} */
let dom;

const state = {
  dataset: null,
  messages: /** @type {any[]} */ ([]),
  loaded: false,
  error: null,
  sim: createFreshSimulationState(),
};

function createFreshSimulationState() {
  return {
    running: false,
    speed: 1,
    simTimeMs: 0,
    lastFrameTs: 0,
    arrivalCursor: 0,
    nextArrivalInMs: 900,
    queue: /** @type {any[]} */ ([]),
    current: /** @type {null | ReturnType<typeof createProcessorRecord>} */ (null),
    selectedChannel: /** @type {null | string} */ (null),
    stats: {
      arrived: 0,
      processed: 0,
      autoDrafts: 0,
      escalations: 0,
      urgent: 0,
      highIntent: 0,
      under5Min: 0,
      responseEqSecTotal: 0,
      satisfactionTotal: 0,
      confidenceTotal: 0,
      hoursSavedTotal: 0,
      channelCountsArrived: Object.fromEntries(Object.keys(CHANNEL_META).map((k) => [k, 0])),
      channelCountsProcessed: Object.fromEntries(Object.keys(CHANNEL_META).map((k) => [k, 0])),
      queueCounts: {},
      intentCounts: {},
      responseSamples: /** @type {Array<{sec:number,isEsc:boolean}>} */ ([]),
      history:
        /** @type {Array<{tMin:number, arrived:number, processed:number, backlog:number, autoDrafts:number, escalations:number, latestResponseMin:number, avgResponseMin:number, satisfaction:number}>} */ ([]),
      lastResponseMin: 0,
      maxBacklog: 0,
    },
    feed: /** @type {any[]} */ ([]),
    pendingSparkTimer: 0,
    activePackets: 0,
    burstMode: true,
    autoScrollFeed: true,
  };
}

function makeDom() {
  return {
    pageShell: $("#page-shell"),
    liveDot: $("#live-dot"),
    playbackStatusLabel: $("#playback-status-label"),
    datasetName: $("#dataset-name"),
    datasetCount: $("#dataset-count"),
    speedLabel: $("#speed-label"),
    modeLabel: $("#mode-label"),
    footerStatus: $("#footer-status"),

    playBtn: $("#play-btn"),
    pauseBtn: $("#pause-btn"),
    resetBtn: $("#reset-btn"),
    speedRange: /** @type {HTMLInputElement} */ ($("#speed-range")),
    speedPresetButtons: $$("#speed-presets button"),
    autoScrollFeed: /** @type {HTMLInputElement} */ ($("#auto-scroll-feed")),
    burstMode: /** @type {HTMLInputElement} */ ($("#burst-mode")),

    metricArrived: $("#metric-arrived"),
    metricProcessed: $("#metric-processed"),
    metricThroughput: $("#metric-throughput"),
    metricAuto: $("#metric-auto"),
    metricAutoRate: $("#metric-auto-rate"),
    metricAutoIcons: $("#metric-auto-icons"),
    metricEscalations: $("#metric-escalations"),
    metricEscalationRate: $("#metric-escalation-rate"),
    metricHandoffIcons: $("#metric-handoff-icons"),
    metricResponseTime: $("#metric-response-time"),
    metricUnder5: $("#metric-under5"),
    metricBacklog: $("#metric-backlog"),
    metricSatisfaction: $("#metric-satisfaction"),
    metricSatDelta: $("#metric-sat-delta"),
    baselineTimeLabel: $("#baseline-time-label"),

    flowMap: $("#flow-map"),
    flowBadge: $("#flow-badge"),
    flowCaption: $("#flow-caption"),
    packetLayer: $("#packet-layer"),
    sparkLayer: $("#spark-layer"),
    channelNodes: /** @type {HTMLButtonElement[]} */ ($$(".channel-node")),
    channelCounts: Object.fromEntries(Object.keys(CHANNEL_META).map((k) => [k, $(`#count-${k}`)])),
    agentCore: $("#agent-core"),
    coreProcessing: $("#core-processing"),
    coreQueue: $("#core-queue"),
    autoNode: $("#auto-node"),
    handoffNode: $("#handoff-node"),
    outcomeAutoCount: $("#outcome-auto-count"),
    outcomeHandoffCount: $("#outcome-handoff-count"),
    outcomeAutoIcons: $("#outcome-auto-icons"),
    outcomeHandoffIcons: $("#outcome-handoff-icons"),

    currentPhaseBadge: $("#current-phase-badge"),
    focusChannelPill: $("#focus-channel-pill"),
    focusMessageId: $("#focus-message-id"),
    focusTimestamp: $("#focus-timestamp"),
    focusAudience: $("#focus-audience"),
    focusProgram: $("#focus-program"),
    focusStage: $("#focus-stage"),
    focusMessageText: $("#focus-message-text"),
    focusMessageChips: $("#focus-message-chips"),
    focusMatch: $("#focus-match"),
    focusLanguage: $("#focus-language"),
    focusConsent: $("#focus-consent"),
    focusPrioritySignal: $("#focus-priority-signal"),

    workbenchTitle: $("#workbench-title"),
    thinkingPill: $("#thinking-pill"),
    thinkingStage: $("#thinking-stage"),
    thinkingLines: $$("#thinking-lines span"),
    thinkingProgressFill: $("#thinking-progress-fill"),
    thinkingEstimate: $("#thinking-estimate"),
    metadataPanel: $("#metadata-panel"),
    triageChipGrid: $("#triage-chip-grid"),
    routingDetails: $("#routing-details"),
    crmActionsList: $("#crm-actions-list"),
    draftMetaList: $("#draft-meta-list"),
    citationsGuardrailsList: $("#citations-guardrails-list"),
    responseSubtitle: $("#response-subtitle"),
    responseStatus: $("#response-status"),
    responseStream: $("#response-stream"),
    streamCaret: $("#stream-caret"),
    escalationCard: $("#escalation-card"),
    escalationPriority: $("#escalation-priority"),
    escalationList: $("#escalation-list"),

    feedList: $("#feed-list"),
    feedBadge: $("#feed-badge"),
    feedTemplate: /** @type {HTMLTemplateElement} */ ($("#feed-item-template")),
    detailModal: /** @type {HTMLDialogElement} */ ($("#detail-modal")),
    detailCloseBtn: $("#detail-close-btn"),
    detailModalTitle: $("#detail-modal-title"),
    detailModalBody: $("#detail-modal-body"),

    throughputChart: /** @type {SVGSVGElement} */ ($("#throughput-chart")),
    responseTimeChart: /** @type {SVGSVGElement} */ ($("#response-time-chart")),
    responseTimeSummary: $("#response-time-summary"),
    outcomeDonut: /** @type {SVGSVGElement} */ ($("#outcome-donut")),
    donutEscalationRate: $("#donut-escalation-rate"),
    outcomeBreakdownNote: $("#outcome-breakdown-note"),
    queueBars: $("#queue-bars"),
    impactFunnel: $("#impact-funnel"),
    satisfactionGaugeFill: $("#satisfaction-gauge-fill"),
    satisfactionGaugeValue: $("#satisfaction-gauge-value"),
    hoursSaved: $("#hours-saved"),
    highIntentCount: $("#high-intent-count"),
    highIntentShare: $("#high-intent-share"),
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded01(seed) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function seededRange(seed, min, max) {
  return min + seeded01(seed) * (max - min);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function toTitleFromSnake(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatPercent(n, digits = 0) {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

function formatAgentCount(n) {
  if (!Number.isFinite(n) || n <= 0) return "0 agents";
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return `${rounded} ${Number(n) === 1 ? "agent" : "agents"}`;
}

function formatInt(n) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function formatDurationShort(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "—";
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, "0")}`;
  return `0:${String(s).padStart(2, "0")}`;
}

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function abbreviateText(str, max = 120) {
  if (!str) return "";
  const clean = String(str).replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}

function maskBrandText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/Southern New Hampshire University/gi, "Client University")
    .replace(/\bSNHU\b/gi, "Client University")
    .replace(/https:\/\/www\.snhu\.edu/gi, "https://client.example")
    .replace(/\bsnhu\.edu\b/gi, "client.example")
    .replace(/\bSNHU-style\b/gi, "enterprise")
    .replace(/\bSNHU Admissions\b/gi, "Admissions")
    .replace(/\bSNHU team\b/gi, "Admissions team");
}

function maskBrandDeep(value) {
  if (Array.isArray(value)) return value.map(maskBrandDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskBrandDeep(v)]));
  }
  return typeof value === "string" ? maskBrandText(value) : value;
}

function tokenizeForStream(text) {
  return String(text || "").match(/\S+\s*/g) ?? [];
}

function createChip(text, className = "") {
  const span = document.createElement("span");
  span.className = `chip ${className}`.trim();
  span.textContent = text;
  return span;
}

function createListRow(label, value) {
  const div = document.createElement("div");
  div.className = "list-row";
  if (value === undefined) {
    div.textContent = label;
    return div;
  }
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  div.append(strong, document.createTextNode(maskBrandText(String(value))));
  return div;
}

function renderMiniIcons(container, count, variant = "auto") {
  if (!container) return;
  const key = `${variant}:${count}`;
  if (container.dataset.renderedKey === key) return;
  container.dataset.renderedKey = key;
  container.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement("span");
    dot.className = "micro-icon";
    if (variant === "handoff") dot.classList.add("handoff");
    container.append(dot);
  }
}

function createDetailSection(title, contentEl, full = false) {
  const card = document.createElement("section");
  card.className = `detail-card ${full ? "full" : ""}`.trim();
  const label = document.createElement("div");
  label.className = "small-label";
  label.textContent = title;
  card.append(label, contentEl);
  return card;
}

function createDetailKv(rows) {
  const wrap = document.createElement("div");
  wrap.className = "detail-kv";
  for (const [k, v] of rows) {
    const row = document.createElement("div");
    row.className = "detail-kv-row";
    const kEl = document.createElement("div");
    kEl.className = "k";
    kEl.textContent = k;
    const vEl = document.createElement("div");
    vEl.className = "v";
    vEl.textContent = maskBrandText(v ?? "—");
    row.append(kEl, vEl);
    wrap.append(row);
  }
  return wrap;
}

function getMetaConfidenceScore(msg) {
  return Number(msg?.draft_response?.metadata?.confidence?.score ?? 0.6);
}

function deriveEquivalentResponseSec(msg, index) {
  const seed = hashString(`${msg.message_id}:resp:${index}`);
  const textLen = msg.message_content?.text?.length ?? 120;
  const urgencyFactor = msg.triage?.priority === "urgent" ? -35 : msg.triage?.priority === "high" ? -15 : 0;
  const escalated = Boolean(msg.triage?.requires_human_handoff);
  let sec;
  if (escalated) {
    sec = 110 + textLen * 0.36 + seededRange(seed, 15, 220) + urgencyFactor;
  } else {
    sec = 55 + textLen * 0.24 + seededRange(seed, 10, 95) + urgencyFactor;
  }
  if (msg.message_content?.urgency_signals?.includes("distress_language")) {
    sec = Math.min(sec, 90);
  }
  if (msg.channel === "phone_voicemail") sec += 22;
  if (msg.channel === "web_form") sec += 14;
  return Math.round(clamp(sec, 35, 520));
}

function deriveSatisfactionProxy(msg, responseEqSec, index) {
  const baseBySentiment = {
    hopeful: 68,
    curious: 63,
    neutral: 58,
    anxious: 48,
    frustrated: 36,
    upset: 30,
    urgent: 34,
    distressed: 18,
  };
  const sentiment = msg.message_content?.sentiment ?? "neutral";
  let score = baseBySentiment[sentiment] ?? 56;

  if (responseEqSec <= 90) score += 18;
  else if (responseEqSec <= 180) score += 14;
  else if (responseEqSec <= 300) score += 10;
  else if (responseEqSec <= 600) score += 4;
  else score -= 6;

  if (msg.triage?.requires_human_handoff) {
    score += 7; // timely human routing is often a good outcome for sensitive cases
    if (msg.triage?.priority === "urgent") score += 4;
  } else {
    score += 12;
  }

  if (msg.draft_response?.metadata?.human_review_required) score -= 2;
  score += Math.round((getMetaConfidenceScore(msg) - 0.5) * 24);

  if (msg.compliance?.possible_ferpa_privacy_risk) score += 2;
  if (msg.message_content?.language_detected === "es") score -= 1;
  if (msg.triage?.high_intent_score >= 75) score += 4;
  if (msg.message_content?.urgency_signals?.includes("distress_language")) score = Math.min(score, 55);

  const noise = (seeded01(hashString(`${msg.message_id}:sat:${index}`)) - 0.5) * 8;
  return Math.round(clamp(score + noise, 18, 96));
}

function deriveVisualDurations(msg, index) {
  const seed = hashString(`${msg.message_id}:vis:${index}`);
  const textLen = msg.message_content?.text?.length ?? 120;
  const responseTokens = tokenizeForStream(msg.draft_response?.body || "");
  const isEscalation = Boolean(msg.triage?.requires_human_handoff);
  const thinkingMs = clamp(
    1150 + textLen * 2 + responseTokens.length * 8 + (isEscalation ? 260 : 0) + seededRange(seed, 50, 850),
    1100,
    3900,
  );
  const streamTokenIntervalMs = clamp(42 + seededRange(seed + 3, 10, 55), 38, 125);
  const holdAfterStreamMs = clamp(seededRange(seed + 4, 240, 640), 220, 700);
  return {
    thinkingMs,
    streamTokenIntervalMs,
    holdAfterStreamMs,
  };
}

function enrichMessages(messages) {
  return messages.map((msg, index) => {
    const responseEqSec = deriveEquivalentResponseSec(msg, index);
    const satisfactionProxy = deriveSatisfactionProxy(msg, responseEqSec, index);
    const visualDurations = deriveVisualDurations(msg, index);
    const confidenceScore = getMetaConfidenceScore(msg);
    const isEscalation = Boolean(msg.triage?.requires_human_handoff);
    const under5 = responseEqSec <= 300;
    const highIntent = (msg.triage?.high_intent_score ?? 0) >= 75;
    const legacySavedHours = Math.max(0, (BASELINE_RESPONSE_SEC - responseEqSec) / 3600);
    const tokens = tokenizeForStream(msg.draft_response?.body || "");
    const qualityFlag = isEscalation
      ? "human-handoff"
      : confidenceScore >= 0.82
      ? "high-confidence-draft"
      : "draft-needs-review";
    return {
      ...msg,
      _derived: {
        index,
        responseEqSec,
        responseEqMin: responseEqSec / 60,
        satisfactionProxy,
        visualDurations,
        confidenceScore,
        isEscalation,
        under5,
        highIntent,
        legacySavedHours,
        streamTokens: tokens,
        qualityFlag,
        channelMeta: CHANNEL_META[msg.channel] ?? { label: msg.channel, icon: "•", color: "#394156", short: "?" },
      },
    };
  });
}

function createProcessorRecord(msg) {
  const derived = msg._derived;
  return {
    message: msg,
    phase: "thinking", // thinking -> streaming -> hold
    phaseElapsedMs: 0,
    startedAtSimMs: state.sim.simTimeMs,
    thinkingMs: derived.visualDurations.thinkingMs,
    streamTokenIntervalMs: derived.visualDurations.streamTokenIntervalMs,
    holdAfterStreamMs: derived.visualDurations.holdAfterStreamMs,
    streamAccumulatorMs: 0,
    streamIndex: 0,
    displayedResponse: "",
    tokens: derived.streamTokens,
    metadataShown: false,
    outgoingPacketSpawned: false,
    lastSparkAtMs: 0,
  };
}

async function loadDataset() {
  setFooterStatus("Connecting intake stream…");
  const res = await fetch("./messages.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load messages.json (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data?.messages)) throw new Error("Invalid dataset shape: messages array missing");
  state.dataset = data;
  state.messages = enrichMessages(data.messages);
  state.loaded = true;
  dom.datasetName.textContent = "Client A · Enrollment Ops";
  dom.datasetCount.textContent = "0";
  dom.baselineTimeLabel.textContent = formatDuration(BASELINE_RESPONSE_SEC);
}

function attachEvents() {
  dom.playBtn.addEventListener("click", () => {
    if (!state.loaded) return;
    setRunning(true);
  });
  dom.pauseBtn.addEventListener("click", () => setRunning(false));
  dom.resetBtn.addEventListener("click", () => {
    resetSimulation();
    setRunning(false);
    renderAll();
  });

  dom.speedRange.addEventListener("input", () => {
    const speed = Number(dom.speedRange.value);
    state.sim.speed = speed;
    renderControlState();
  });

  dom.speedPresetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const speed = Number(btn.dataset.speed || 1);
      state.sim.speed = speed;
      dom.speedRange.value = String(speed);
      renderControlState();
    });
  });

  dom.autoScrollFeed.addEventListener("change", () => {
    state.sim.autoScrollFeed = dom.autoScrollFeed.checked;
  });

  dom.burstMode.addEventListener("change", () => {
    state.sim.burstMode = dom.burstMode.checked;
  });

  dom.channelNodes.forEach((node) => {
    node.addEventListener("click", () => {
      const channel = node.dataset.channel;
      state.sim.selectedChannel = state.sim.selectedChannel === channel ? null : channel;
      renderChannelSelection();
    });
  });

  dom.detailCloseBtn?.addEventListener("click", () => {
    dom.detailModal?.close();
  });
  dom.detailModal?.addEventListener("click", (event) => {
    if (event.target === dom.detailModal) dom.detailModal.close();
  });

  window.addEventListener("resize", () => {
    // Active packets use relative coordinates; new packets will adapt. Just refresh selection visuals.
    renderChannelSelection();
  });
}

function setRunning(nextRunning) {
  if (state.error || !state.loaded) return;
  state.sim.running = nextRunning;
  state.sim.lastFrameTs = performance.now();
  renderControlState();
  renderPlaybackStatus();
  setFooterStatus(nextRunning ? "Intake stream active." : "Intake stream paused.");
}

function resetSimulation() {
  state.sim = createFreshSimulationState();
  state.sim.speed = Number(dom.speedRange?.value || 1);
  state.sim.autoScrollFeed = dom.autoScrollFeed?.checked ?? true;
  state.sim.burstMode = dom.burstMode?.checked ?? true;
  if (dom.detailModal?.open) dom.detailModal.close();
  clearFlowLayers();
  resetFeed();
  resetChartsAndImpact();
  resetProcessingPanels();
  renderControlState();
  renderMetrics();
  renderChannelCounts();
  renderPlaybackStatus();
  renderChannelSelection();
}

function clearFlowLayers() {
  dom.packetLayer.innerHTML = "";
  dom.sparkLayer.innerHTML = "";
  state.sim.activePackets = 0;
}

function resetFeed() {
  dom.feedList.innerHTML = "";
  dom.feedBadge.textContent = "0 completed";
}

function resetChartsAndImpact() {
  dom.throughputChart.innerHTML = "";
  dom.responseTimeChart.innerHTML = "";
  dom.outcomeDonut.innerHTML = "";
  dom.outcomeBreakdownNote.innerHTML = "";
  dom.queueBars.innerHTML = "";
  dom.impactFunnel.innerHTML = "";
  buildImpactFunnelRows();
  updateCharts();
}

function resetProcessingPanels() {
  dom.currentPhaseBadge.textContent = "Idle";
  dom.focusChannelPill.textContent = "—";
  dom.focusMessageId.textContent = "No message selected";
  dom.focusTimestamp.textContent = "—";
  dom.focusAudience.textContent = "—";
  dom.focusProgram.textContent = "—";
  dom.focusStage.textContent = "—";
  dom.focusMessageText.textContent = "Waiting for traffic…";
  dom.focusMessageChips.innerHTML = "";
  dom.focusMatch.textContent = "—";
  dom.focusLanguage.textContent = "—";
  dom.focusConsent.textContent = "—";
  dom.focusPrioritySignal.textContent = "—";

  dom.workbenchTitle.textContent = "Awaiting first message";
  dom.thinkingPill.textContent = "Standby";
  dom.thinkingPill.classList.remove("active");
  dom.thinkingStage.classList.remove("thinking");
  dom.thinkingProgressFill.style.width = "0%";
  dom.thinkingEstimate.textContent = "—";
  dom.thinkingLines.forEach((line) => line.classList.remove("active"));
  dom.metadataPanel.classList.remove("ready");
  dom.triageChipGrid.innerHTML = "";
  dom.routingDetails.innerHTML = "";
  dom.crmActionsList.innerHTML = "";
  dom.draftMetaList.innerHTML = "";
  dom.citationsGuardrailsList.innerHTML = "";
  dom.responseSubtitle.textContent = "Waiting for agent output";
  dom.responseStatus.textContent = "—";
  dom.responseStream.textContent = "";
  dom.streamCaret.classList.remove("visible");
  dom.escalationCard.hidden = true;
  dom.escalationPriority.textContent = "—";
  dom.escalationList.innerHTML = "";
  dom.flowBadge.textContent = "No activity yet";
  dom.flowCaption.textContent =
    "Packets animate from channel nodes into the Triage Agent, then route to auto-draft or human handoff outcomes based on the message metadata.";
}

function renderControlState() {
  dom.speedLabel.textContent = formatAgentCount(state.sim.speed);
  dom.speedPresetButtons.forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.speed) === state.sim.speed);
  });
  dom.playBtn.classList.toggle("active", state.sim.running);
  dom.pauseBtn.classList.toggle("active", !state.sim.running);
  dom.pageShell.classList.toggle("is-paused", !state.sim.running);
}

function renderPlaybackStatus() {
  const sim = state.sim;
  const done = sim.arrivalCursor >= state.messages.length && sim.queue.length === 0 && !sim.current;
  if (state.error) {
    dom.playbackStatusLabel.textContent = "Load error";
    dom.liveDot.className = "live-dot error";
    dom.modeLabel.textContent = "Error";
    return;
  }
  if (!state.loaded) {
    dom.playbackStatusLabel.textContent = "Connecting intake stream…";
    dom.liveDot.className = "live-dot";
    dom.modeLabel.textContent = "Boot";
    return;
  }
  if (done && sim.stats.processed > 0) {
    dom.playbackStatusLabel.textContent = "Queue cleared";
    dom.liveDot.className = "live-dot paused";
    dom.modeLabel.textContent = "Idle";
    return;
  }
  if (sim.running) {
    dom.playbackStatusLabel.textContent = "Intake stream active";
    dom.liveDot.className = "live-dot running";
    dom.modeLabel.textContent = "Live";
  } else {
    dom.playbackStatusLabel.textContent = "Paused";
    dom.liveDot.className = "live-dot paused";
    dom.modeLabel.textContent = "Paused";
  }
}

function setFooterStatus(text) {
  dom.footerStatus.textContent = text;
}

function buildImpactFunnelRows() {
  const rows = [
    { key: "arrived", label: "Intercepted inquiries", className: "" },
    { key: "processed", label: "Processed by triage", className: "" },
    { key: "under5", label: "Responded in < 5m (equiv.)", className: "success" },
    { key: "auto", label: "Auto-draft responses", className: "" },
    { key: "handoff", label: "Human handoffs queued", className: "warn" },
    { key: "highIntent", label: "High-intent leads surfaced", className: "success" },
    { key: "projectedEnrollables", label: "Projected enrollable conversations", className: "success" },
  ];

  for (const row of rows) {
    const rowEl = document.createElement("div");
    rowEl.className = "funnel-row";
    rowEl.dataset.key = row.key;

    const head = document.createElement("div");
    head.className = "funnel-head";
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = row.label;
    const value = document.createElement("span");
    value.className = "value";
    value.dataset.role = "value";
    value.textContent = "0";
    head.append(label, value);

    const track = document.createElement("div");
    track.className = "funnel-track";
    const fill = document.createElement("div");
    fill.className = `funnel-fill ${row.className}`.trim();
    fill.dataset.role = "fill";
    track.append(fill);

    rowEl.append(head, track);
    dom.impactFunnel.append(rowEl);
  }
}

function pushHistorySnapshot() {
  const { stats, queue, current, simTimeMs } = state.sim;
  const backlog = queue.length + (current ? 1 : 0);
  const avgResponseMin = stats.processed ? stats.responseEqSecTotal / stats.processed / 60 : 0;
  const satisfaction = stats.processed ? stats.satisfactionTotal / stats.processed : 0;
  stats.history.push({
    tMin: simTimeMs / 60000,
    arrived: stats.arrived,
    processed: stats.processed,
    backlog,
    autoDrafts: stats.autoDrafts,
    escalations: stats.escalations,
    latestResponseMin: stats.lastResponseMin,
    avgResponseMin,
    satisfaction,
  });
  if (stats.history.length > CHART_HISTORY_LIMIT) stats.history.shift();
}

function nextArrivalDelayMs() {
  const sim = state.sim;
  const seed = hashString(`arrival:${sim.arrivalCursor}:${sim.stats.arrived}:${Math.floor(sim.simTimeMs / 100)}`);
  const r = seeded01(seed);
  const burst = sim.burstMode;
  if (!burst) return 850 + r * 1250;
  if (r < 0.18) return 180 + r * 260;
  if (r < 0.52) return 420 + r * 520;
  if (r < 0.86) return 900 + r * 1100;
  return 1600 + r * 1800;
}

function advanceSimulation(simDtMs) {
  const sim = state.sim;
  sim.simTimeMs += simDtMs;

  sim.nextArrivalInMs -= simDtMs;
  while (sim.nextArrivalInMs <= 0 && sim.arrivalCursor < state.messages.length) {
    const msg = state.messages[sim.arrivalCursor];
    sim.arrivalCursor += 1;
    handleArrival(msg);
    sim.nextArrivalInMs += nextArrivalDelayMs();
  }

  if (!sim.current && sim.queue.length > 0) {
    startProcessing(sim.queue.shift());
  }

  if (sim.current) {
    advanceProcessor(sim.current, simDtMs);
  }

  const done = sim.arrivalCursor >= state.messages.length && sim.queue.length === 0 && !sim.current;
  if (done && sim.running) {
    setRunning(false);
    renderPlaybackStatus();
    setFooterStatus("Queue cleared. Restart to begin the stream again.");
  }
}

function handleArrival(msg) {
  const sim = state.sim;
  sim.queue.push(msg);
  sim.stats.arrived += 1;
  sim.stats.channelCountsArrived[msg.channel] = (sim.stats.channelCountsArrived[msg.channel] ?? 0) + 1;
  if (msg.triage?.priority === "urgent") sim.stats.urgent += 1;
  sim.stats.maxBacklog = Math.max(sim.stats.maxBacklog, sim.queue.length);

  pushHistorySnapshot();
  renderMetrics();
  renderChannelCounts();
  updateCharts();

  const channelMeta = CHANNEL_META[msg.channel] ?? CHANNEL_META.email;
  spawnPacket("inbound", getChannelNodeEl(msg.channel), dom.agentCore, channelMeta.color);
  pulseNode(getChannelNodeEl(msg.channel));
  updateFlowBadge(
    `Inbound • ${channelMeta.label} • ${
      abbreviateText(maskBrandText(msg.message_content?.normalized_summary || msg.message_content?.text || ""), 68)
    }`,
  );
  updateFlowCaptionForMessage(msg, "arrived");
}

function startProcessing(msg) {
  state.sim.current = createProcessorRecord(msg);
  renderCurrentMessage(msg);
  renderProcessingPhase();
  highlightActiveChannel(msg.channel);
  dom.coreProcessing.textContent = "1";
  dom.coreQueue.textContent = String(state.sim.queue.length);
  updateFlowBadge(`Triage processing • ${msg.message_id} • ${msg.triage?.primary_intent || "inquiry"}`);
  setFooterStatus(`Processing ${msg.message_id} (${CHANNEL_META[msg.channel]?.label || msg.channel})`);
}

function advanceProcessor(proc, simDtMs) {
  proc.phaseElapsedMs += simDtMs;
  proc.lastSparkAtMs += simDtMs;

  if (proc.phase === "thinking") {
    const progress = clamp(proc.phaseElapsedMs / proc.thinkingMs, 0, 1);
    renderThinkingProgress(proc, progress);

    if (proc.lastSparkAtMs > 520) {
      proc.lastSparkAtMs = 0;
      spawnSparkNear(dom.agentCore, proc.message._derived.channelMeta.color);
    }

    if (progress >= 1) {
      proc.phase = "streaming";
      proc.phaseElapsedMs = 0;
      proc.metadataShown = true;
      proc.streamAccumulatorMs = 0;
      renderMetadataForCurrent(proc.message);
      dom.metadataPanel.classList.add("ready");
      dom.responseSubtitle.textContent =
        proc.message.draft_response?.metadata?.response_type === "acknowledge_and_handoff"
          ? "Acknowledgment + handoff note (streaming)"
          : "Personalized draft response (streaming)";
      dom.responseStatus.textContent = "Streaming";
      dom.streamCaret.classList.add("visible");
      dom.thinkingPill.textContent = "Streaming response";
      dom.thinkingStage.classList.remove("thinking");
      dom.currentPhaseBadge.textContent = "Streaming Draft";
      setFooterStatus(`Streaming response for ${proc.message.message_id}`);
    }
    return;
  }

  if (proc.phase === "streaming") {
    const interval = proc.streamTokenIntervalMs;
    proc.streamAccumulatorMs += simDtMs;
    let advanced = false;
    while (proc.streamAccumulatorMs >= interval && proc.streamIndex < proc.tokens.length) {
      proc.streamAccumulatorMs -= interval;
      const burstTokens = state.sim.speed >= 4 ? 3 : state.sim.speed >= 2 ? 2 : 1;
      for (let i = 0; i < burstTokens && proc.streamIndex < proc.tokens.length; i += 1) {
        proc.displayedResponse += proc.tokens[proc.streamIndex];
        proc.streamIndex += 1;
      }
      advanced = true;
    }
    if (advanced) renderStreamText(proc.displayedResponse);

    if (proc.streamIndex >= proc.tokens.length) {
      proc.phase = "hold";
      proc.phaseElapsedMs = 0;
      dom.responseStatus.textContent = proc.message._derived.isEscalation ? "Acknowledged + routed" : "Draft ready";
      if (!proc.outgoingPacketSpawned) {
        proc.outgoingPacketSpawned = true;
        const target = proc.message._derived.isEscalation ? dom.handoffNode : dom.autoNode;
        const color = proc.message._derived.isEscalation ? "#ef5b44" : "#0ea5a4";
        spawnPacket("outbound", dom.agentCore, target, color);
        pulseNode(target);
      }
      updateFlowCaptionForMessage(proc.message, "resolved");
    }
    return;
  }

  if (proc.phase === "hold") {
    if (proc.phaseElapsedMs >= proc.holdAfterStreamMs) {
      finalizeCurrentMessage(proc.message);
      state.sim.current = null;
      dom.coreProcessing.textContent = "0";
      dom.coreQueue.textContent = String(state.sim.queue.length);
      if (state.sim.queue.length === 0 && state.sim.arrivalCursor >= state.messages.length) {
        dom.currentPhaseBadge.textContent = "Complete";
        dom.streamCaret.classList.remove("visible");
      }
    }
  }
}

function finalizeCurrentMessage(msg) {
  const sim = state.sim;
  const stats = sim.stats;
  stats.processed += 1;
  if (msg._derived.isEscalation) stats.escalations += 1;
  else stats.autoDrafts += 1;
  if (msg._derived.highIntent) stats.highIntent += 1;
  if (msg._derived.under5) stats.under5Min += 1;
  stats.responseEqSecTotal += msg._derived.responseEqSec;
  stats.responseSamples.push({ sec: msg._derived.responseEqSec, isEsc: msg._derived.isEscalation });
  if (stats.responseSamples.length > 500) stats.responseSamples.shift();
  stats.satisfactionTotal += msg._derived.satisfactionProxy;
  stats.confidenceTotal += msg._derived.confidenceScore;
  stats.hoursSavedTotal += msg._derived.legacySavedHours;
  stats.lastResponseMin = msg._derived.responseEqMin;

  const queue = msg.triage?.queue || "Unknown";
  stats.queueCounts[queue] = (stats.queueCounts[queue] || 0) + 1;
  const intent = msg.triage?.primary_intent || "unknown";
  stats.intentCounts[intent] = (stats.intentCounts[intent] || 0) + 1;
  stats.channelCountsProcessed[msg.channel] = (stats.channelCountsProcessed[msg.channel] ?? 0) + 1;

  sim.feed.unshift(msg);
  if (sim.feed.length > MAX_FEED_ITEMS) sim.feed.length = MAX_FEED_ITEMS;

  pushHistorySnapshot();
  addFeedItem(msg);
  renderMetrics();
  renderChannelCounts();
  updateCharts();

  dom.feedBadge.textContent = `${stats.processed} completed`;
  dom.outcomeAutoCount.textContent = formatInt(stats.autoDrafts);
  dom.outcomeHandoffCount.textContent = formatInt(stats.escalations);
  dom.coreQueue.textContent = String(sim.queue.length);
  dom.currentPhaseBadge.textContent = "Completed";
  dom.thinkingPill.textContent = msg._derived.isEscalation ? "Handoff created" : "Draft complete";
  dom.streamCaret.classList.remove("visible");

  const outcomeLabel = msg._derived.isEscalation ? "human handoff" : "auto draft";
  updateFlowBadge(`Resolved • ${msg.message_id} • ${outcomeLabel}`);
  setFooterStatus(
    `${msg.message_id} ${outcomeLabel} in ${formatDuration(msg._derived.responseEqSec)} (equivalent first response)`,
  );
}

function renderCurrentMessage(msg) {
  const ch = msg._derived.channelMeta;
  dom.focusChannelPill.textContent = `${ch.icon} ${ch.label}`;
  dom.focusChannelPill.style.borderColor = `${ch.color}33`;
  dom.focusChannelPill.style.background = `${ch.color}10`;
  dom.focusMessageId.textContent = msg.message_id;
  dom.focusTimestamp.textContent = formatTimestamp(msg.received_at_utc);
  dom.focusAudience.textContent = `${toTitleFromSnake(msg.lead_context?.audience_segment || "unknown")} · ${
    toTitleFromSnake(msg.lead_context?.student_type || "unknown")
  }`;
  dom.focusProgram.textContent = msg.lead_context?.program_interest || msg.extracted_entities?.program_interest
    || "Undeclared";
  dom.focusStage.textContent = toTitleFromSnake(msg.lead_context?.lifecycle_stage || "unknown");
  dom.focusMessageText.textContent = maskBrandText(msg.message_content?.text || "(No message text)");

  dom.focusMessageChips.innerHTML = "";
  const sentiment = msg.message_content?.sentiment || "neutral";
  dom.focusMessageChips.append(
    createChip(
      `Sentiment: ${sentiment}`,
      sentiment === "frustrated" || sentiment === "upset" ? "warn" : sentiment === "distressed" ? "danger" : "ok",
    ),
    createChip(`Len: ${(msg.message_content?.text || "").length} chars`, ""),
    createChip(`High-intent: ${msg._derived.highIntent ? "Yes" : "No"}`, msg._derived.highIntent ? "ok" : ""),
  );
  for (const signal of (msg.message_content?.urgency_signals || []).slice(0, 3)) {
    dom.focusMessageChips.append(createChip(signal.replace(/_/g, " "), "warn"));
  }
  for (const flag of (msg.message_content?.messiness_flags || []).slice(0, 2)) {
    dom.focusMessageChips.append(createChip(flag.replace(/_/g, " "), ""));
  }

  const match = msg.identity_resolution;
  dom.focusMatch.textContent = `${toTitleFromSnake(match?.match_status || "unknown")} (${
    Math.round((match?.match_confidence || 0) * 100)
  }%)`;
  dom.focusLanguage.textContent = `${msg.message_content?.language_detected || "en"} · ${
    msg.raw_contact?.country || "Unknown"
  }`;
  const consent = msg.raw_contact?.consent_status || {};
  const consentLine = [
    `Email ${consent.email_opt_in === true ? "✓" : consent.email_opt_in === false ? "✕" : "—"}`,
    `SMS ${consent.sms_opt_in === true ? "✓" : consent.sms_opt_in === false ? "✕" : "—"}`,
    `WA ${consent.whatsapp_opt_in === true ? "✓" : consent.whatsapp_opt_in === false ? "✕" : "—"}`,
  ].join(" · ");
  dom.focusConsent.textContent = consentLine;
  dom.focusPrioritySignal.textContent = `${msg.triage?.priority || "normal"} · ${
    msg.triage?.high_intent_score || 0
  }/100 intent`;

  dom.workbenchTitle.textContent = `Analyzing ${msg.triage?.category || "Inquiry"} • ${
    toTitleFromSnake(msg.triage?.primary_intent || "unknown")
  }`;
  dom.responseStream.textContent = "";
  dom.responseSubtitle.textContent = "Agent is reasoning about intent, routing and reply policy…";
  dom.responseStatus.textContent = "Thinking";
  dom.metadataPanel.classList.remove("ready");
  dom.triageChipGrid.innerHTML = "";
  dom.routingDetails.innerHTML = "";
  dom.crmActionsList.innerHTML = "";
  dom.draftMetaList.innerHTML = "";
  dom.citationsGuardrailsList.innerHTML = "";
  dom.escalationCard.hidden = true;
  dom.escalationList.innerHTML = "";
  dom.escalationPriority.textContent = "—";
  dom.thinkingPill.textContent = "LLM thinking";
  dom.thinkingPill.classList.add("active");
  dom.thinkingStage.classList.add("thinking");
  dom.currentPhaseBadge.textContent = "Thinking";
  dom.streamCaret.classList.add("visible");
}

function renderThinkingProgress(proc, progress) {
  const pct = Math.round(progress * 100);
  dom.thinkingProgressFill.style.width = `${pct}%`;
  dom.thinkingEstimate.textContent = `thinking ${pct}% · ~${
    Math.max(0, Math.ceil((proc.thinkingMs - proc.phaseElapsedMs) / 1000))
  }s`;
  dom.thinkingLines.forEach((line, i) => {
    const threshold = (i + 1) / dom.thinkingLines.length;
    line.classList.toggle("active", progress >= threshold - 0.15);
  });
  renderStreamText(proc.displayedResponse || "");
}

function renderMetadataForCurrent(msg) {
  const triage = msg.triage || {};
  const draftMeta = msg.draft_response?.metadata || {};
  const confidence = draftMeta.confidence?.score;

  dom.triageChipGrid.innerHTML = "";
  const chips = [
    createChip(`Intent: ${toTitleFromSnake(triage.primary_intent || "unknown")}`, "intent"),
    createChip(`Category: ${triage.category || "—"}`, "queue"),
    createChip(`Queue: ${triage.queue || "—"}`, "queue"),
    createChip(
      `Priority: ${triage.priority || "—"}`,
      triage.priority === "urgent" ? "danger" : triage.priority === "high" ? "warn" : "ok",
    ),
    createChip(
      triage.requires_human_handoff ? "Human handoff required" : "Auto draft eligible",
      triage.requires_human_handoff ? "warn" : "ok",
    ),
    createChip(
      `Confidence: ${confidence != null ? Math.round(confidence * 100) + "%" : "—"}`,
      confidence >= 0.85 ? "ok" : confidence >= 0.65 ? "warn" : "danger",
    ),
  ];
  chips.forEach((c) => dom.triageChipGrid.append(c));

  dom.routingDetails.innerHTML = "";
  dom.routingDetails.append(
    createListRow("Owner", triage.owner_role || "Automation"),
    createListRow("SLA", `${triage.sla_target_minutes || "—"} min`),
    createListRow("Next step", triage.recommended_next_step || "—"),
  );
  if (triage.secondary_intents?.length) {
    dom.routingDetails.append(
      createListRow("Secondary intents", triage.secondary_intents.map((s) => toTitleFromSnake(s)).join(", ")),
    );
  }
  if (triage.tags?.length) {
    dom.routingDetails.append(createListRow("Tags", triage.tags.slice(0, 6).join(", ")));
  }

  dom.crmActionsList.innerHTML = "";
  for (const action of (triage.crm_actions || []).slice(0, 5)) {
    const label = action.action?.replace(/_/g, " ") || "action";
    const detail = action.queue || action.crm || action.task_type || action.interaction_type || "";
    dom.crmActionsList.append(createListRow(toTitleFromSnake(label), detail));
  }

  dom.draftMetaList.innerHTML = "";
  dom.draftMetaList.append(
    createListRow("Response type", draftMeta.response_type || "—"),
    createListRow("Send readiness", draftMeta.send_readiness || "—"),
    createListRow("Human review", draftMeta.human_review_required ? "Required" : "Not required"),
    createListRow("Tone", draftMeta.tone?.style || "—"),
    createListRow("Equivalent first response", formatDuration(msg._derived.responseEqSec)),
  );

  dom.citationsGuardrailsList.innerHTML = "";
  for (const citation of (draftMeta.citations || []).slice(0, 2)) {
    dom.citationsGuardrailsList.append(createListRow("Citation", maskBrandText(citation.title || citation.source_id)));
  }
  for (const guardrail of (draftMeta.guardrails || []).slice(0, 3)) {
    dom.citationsGuardrailsList.append(createListRow(guardrail));
  }

  if (msg._derived.isEscalation && msg.escalation) {
    dom.escalationCard.hidden = false;
    dom.escalationPriority.textContent = `${String(msg.escalation.priority || triage.priority || "").toUpperCase()} • ${
      msg.escalation.queue || ""
    }`;
    dom.escalationList.innerHTML = "";
    dom.escalationList.append(
      createListRow("Reason", msg.escalation.reason || triage.handoff_policy_reason || "Human review required"),
      createListRow("Action", maskBrandText(msg.escalation.action || "Route to staff")),
      createListRow(
        "Pass along",
        maskBrandText(msg.escalation.pass_along?.summary || msg.message_content?.normalized_summary || "—"),
      ),
    );
  }
}

function renderStreamText(text) {
  dom.responseStream.textContent = maskBrandText(text);
  dom.responseStream.scrollTop = dom.responseStream.scrollHeight;
}

function renderProcessingPhase() {
  const proc = state.sim.current;
  if (!proc) return;
  dom.currentPhaseBadge.textContent = proc.phase === "thinking"
    ? "Thinking"
    : proc.phase === "streaming"
    ? "Streaming Draft"
    : "Finalizing";
}

function addFeedItem(msg) {
  const frag = dom.feedTemplate.content.cloneNode(true);
  const root = /** @type {HTMLElement} */ (frag.querySelector(".feed-item"));
  const channelEl = frag.querySelector(".feed-channel");
  const outcomeEl = frag.querySelector(".feed-outcome");
  const timeEl = frag.querySelector(".feed-time");
  const messageLine = frag.querySelector(".feed-message-line");
  const metaRow = frag.querySelector(".feed-meta-row");

  const channelMeta = msg._derived.channelMeta;
  root.classList.add(msg._derived.isEscalation ? "escalated" : "auto");
  channelEl.textContent = `${channelMeta.icon} ${channelMeta.label}`;
  channelEl.style.borderColor = `${channelMeta.color}33`;
  channelEl.style.background = `${channelMeta.color}10`;
  outcomeEl.textContent = msg._derived.isEscalation ? "Human handoff" : "Auto draft";
  outcomeEl.style.borderColor = msg._derived.isEscalation ? "rgba(239,91,68,0.22)" : "rgba(14,165,164,0.2)";
  outcomeEl.style.background = msg._derived.isEscalation ? "rgba(239,91,68,0.08)" : "rgba(14,165,164,0.07)";
  timeEl.textContent = `${formatDuration(msg._derived.responseEqSec)} eq.`;

  messageLine.textContent = abbreviateText(
    maskBrandText(msg.message_content?.normalized_summary || msg.message_content?.text || ""),
    118,
  );
  const confidencePct = `${Math.round(msg._derived.confidenceScore * 100)}%`;
  const queue = msg.triage?.queue || "—";
  metaRow.textContent = `${
    toTitleFromSnake(msg.triage?.primary_intent || "unknown")
  } • ${queue} • confidence ${confidencePct} • sat ${msg._derived.satisfactionProxy}`;

  root.addEventListener("click", () => openDetailModal(msg));
  root.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetailModal(msg);
    }
  });

  dom.feedList.prepend(frag);
  while (dom.feedList.children.length > MAX_FEED_ITEMS) {
    dom.feedList.removeChild(dom.feedList.lastElementChild);
  }
  if (state.sim.autoScrollFeed) dom.feedList.scrollTop = 0;
}

function openDetailModal(msg) {
  if (!dom.detailModal || !dom.detailModalBody) return;
  renderDetailModal(msg);
  if (typeof dom.detailModal.showModal === "function") {
    if (!dom.detailModal.open) dom.detailModal.showModal();
  } else {
    dom.detailModal.setAttribute("open", "open");
  }
}

function renderDetailModal(msg) {
  const masked = maskBrandDeep(msg);
  dom.detailModalTitle.textContent = `${masked.message_id} · ${masked._derived?.channelMeta?.label || masked.channel}`;
  dom.detailModalBody.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "detail-grid";

  const summaryRows = [
    ["Channel", masked._derived?.channelMeta?.label || masked.channel],
    ["Received", formatTimestamp(masked.received_at_utc)],
    [
      "Audience",
      `${toTitleFromSnake(masked.lead_context?.audience_segment || "unknown")} · ${
        toTitleFromSnake(masked.lead_context?.student_type || "unknown")
      }`,
    ],
    ["Program", masked.lead_context?.program_interest || masked.extracted_entities?.program_interest || "—"],
    ["Intent", toTitleFromSnake(masked.triage?.primary_intent || "unknown")],
    ["Queue", masked.triage?.queue || "—"],
    ["Priority", `${masked.triage?.priority || "normal"} • ${masked.triage?.sla_target_minutes || "—"} min SLA`],
    ["Outcome", masked._derived?.isEscalation ? "Human handoff" : "Auto draft"],
  ];
  grid.append(createDetailSection("Overview", createDetailKv(summaryRows)));

  const routingRows = [
    ["Owner", masked.triage?.owner_role || "Automation"],
    ["Next step", masked.triage?.recommended_next_step || "—"],
    ["Tags", (masked.triage?.tags || []).join(", ") || "—"],
    ["Confidence", `${Math.round((masked._derived?.confidenceScore || 0) * 100)}%`],
    ["Equivalent first response", formatDuration(masked._derived?.responseEqSec || 0)],
    ["Satisfaction signal", String(masked._derived?.satisfactionProxy || "—")],
  ];
  grid.append(createDetailSection("Routing + Quality", createDetailKv(routingRows)));

  const inbound = document.createElement("pre");
  inbound.textContent = masked.message_content?.text || "";
  grid.append(createDetailSection("Inbound Message", inbound, true));

  const draft = document.createElement("pre");
  draft.textContent = masked.draft_response?.body || "";
  grid.append(createDetailSection("Draft Response", draft, true));

  const metaWrap = document.createElement("div");
  metaWrap.className = "detail-kv";
  const citations = (masked.draft_response?.metadata?.citations || []).slice(0, 4);
  const guardrails = (masked.draft_response?.metadata?.guardrails || []).slice(0, 5);
  metaWrap.append(createDetailKv([
    ["Response type", masked.draft_response?.metadata?.response_type || "—"],
    ["Send readiness", masked.draft_response?.metadata?.send_readiness || "—"],
    ["Human review required", masked.draft_response?.metadata?.human_review_required ? "Yes" : "No"],
  ]));
  for (const c of citations) {
    metaWrap.append(createListRow("Citation", maskBrandText(c.title || c.url || c.source_id || "—")));
  }
  for (const g of guardrails) {
    metaWrap.append(createListRow("Guardrail", maskBrandText(g)));
  }
  grid.append(createDetailSection("Draft Metadata", metaWrap));

  const escalationWrap = document.createElement("div");
  if (masked.escalation) {
    escalationWrap.append(
      createListRow("Queue", masked.escalation.queue),
      createListRow("Priority", masked.escalation.priority),
      createListRow("Reason", masked.escalation.reason),
      createListRow("Action", masked.escalation.action),
      createListRow("Target response by", masked.escalation.target_response_by_utc),
    );
  } else {
    escalationWrap.append(createListRow("No human handoff created for this message."));
  }
  grid.append(createDetailSection("Escalation / Handoff", escalationWrap));

  dom.detailModalBody.append(grid);

  const jsonLabel = document.createElement("div");
  jsonLabel.className = "small-label";
  jsonLabel.textContent = "Structured record snapshot";
  const jsonPre = document.createElement("pre");
  jsonPre.className = "detail-json";
  const jsonSnapshot = {
    message_id: masked.message_id,
    channel: masked.channel,
    lead_context: masked.lead_context,
    message_content: masked.message_content,
    triage: masked.triage,
    draft_response: masked.draft_response,
    escalation: masked.escalation,
    compliance: masked.compliance,
  };
  jsonPre.textContent = JSON.stringify(jsonSnapshot, null, 2);
  dom.detailModalBody.append(jsonLabel, jsonPre);
}

function renderMetrics() {
  const { stats, queue, current, simTimeMs } = state.sim;
  const arrivals = stats.arrived;
  const processed = stats.processed;
  const backlog = queue.length + (current ? 1 : 0);
  const autoRate = processed ? stats.autoDrafts / processed : 0;
  const escalationRate = processed ? stats.escalations / processed : 0;
  const avgResponseSec = processed ? stats.responseEqSecTotal / processed : 0;
  const under5Rate = processed ? stats.under5Min / processed : 0;
  const satisfaction = processed ? stats.satisfactionTotal / processed : 0;
  const avgConfidence = processed ? stats.confidenceTotal / processed : 0;
  const elapsedMin = Math.max(simTimeMs / 60000, 0.0001);
  const throughputPerMin = processed / elapsedMin;
  const resolutionRate = arrivals ? processed / arrivals : 0;

  dom.metricArrived.textContent = formatInt(arrivals);
  dom.metricProcessed.textContent = formatInt(processed);
  dom.datasetCount.textContent = formatInt(arrivals);
  dom.metricThroughput.textContent = `${throughputPerMin.toFixed(1)}/min • ${
    formatPercent(resolutionRate, 0)
  } resolved`;
  dom.metricAuto.textContent = formatInt(stats.autoDrafts);
  dom.metricAutoRate.textContent = formatPercent(autoRate, 0);
  dom.metricEscalations.textContent = formatInt(stats.escalations);
  dom.metricEscalationRate.textContent = formatPercent(escalationRate, 0);
  dom.metricResponseTime.textContent = processed ? formatDuration(avgResponseSec) : "—";
  dom.metricUnder5.textContent = formatPercent(under5Rate, 0);
  dom.metricBacklog.textContent = formatInt(backlog);
  dom.metricSatisfaction.textContent = processed ? String(Math.round(satisfaction)) : "—";
  dom.metricSatDelta.textContent = processed ? `conf ${Math.round(avgConfidence * 100)}%` : "composite";

  dom.outcomeAutoCount.textContent = formatInt(stats.autoDrafts);
  dom.outcomeHandoffCount.textContent = formatInt(stats.escalations);
  renderMiniIcons(dom.metricAutoIcons, stats.autoDrafts, "auto");
  renderMiniIcons(dom.metricHandoffIcons, stats.escalations, "handoff");
  renderMiniIcons(dom.outcomeAutoIcons, stats.autoDrafts, "auto");
  renderMiniIcons(dom.outcomeHandoffIcons, stats.escalations, "handoff");
  dom.coreQueue.textContent = String(queue.length);
  dom.coreProcessing.textContent = current ? "1" : "0";

  dom.feedBadge.textContent = `${processed} completed`;
}

function renderChannelCounts() {
  for (const [channel, count] of Object.entries(state.sim.stats.channelCountsProcessed)) {
    const el = dom.channelCounts[channel];
    if (el) el.textContent = String(count);
  }
}

function renderChannelSelection() {
  const selected = state.sim.selectedChannel;
  dom.channelNodes.forEach((node) => {
    node.classList.toggle("is-active", node.dataset.channel === selected);
  });
  if (!selected) return;
  const meta = CHANNEL_META[selected];
  const count = state.sim.stats.channelCountsProcessed[selected] || 0;
  const total = Math.max(1, state.sim.stats.processed);
  const share = count / total;
  dom.flowCaption.textContent = `${meta.label} selected • ${count} processed so far (${
    formatPercent(share, 0)
  } of completed volume). Click again to clear.`;
}

function highlightActiveChannel(channel) {
  dom.channelNodes.forEach((node) => node.classList.toggle("is-active", node.dataset.channel === channel));
}

function getChannelNodeEl(channel) {
  return dom.channelNodes.find((n) => n.dataset.channel === channel) ?? dom.channelNodes[0];
}

function pulseNode(el) {
  if (!el) return;
  el.animate(
    [
      { transform: "translateX(0) scale(1)", boxShadow: "0 4px 16px rgba(17,20,33,0.04)" },
      { transform: "translateX(3px) scale(1.02)", boxShadow: "0 12px 20px rgba(20,99,255,0.14)" },
      { transform: "translateX(0) scale(1)", boxShadow: "0 4px 16px rgba(17,20,33,0.04)" },
    ],
    { duration: Math.max(220, 680 / state.sim.speed), easing: "ease-out" },
  );
}

function updateFlowBadge(text) {
  dom.flowBadge.textContent = maskBrandText(abbreviateText(text, 88));
}

function updateFlowCaptionForMessage(msg, stage) {
  if (state.sim.selectedChannel) return;
  const intent = toTitleFromSnake(msg.triage?.primary_intent || "unknown");
  const outcome = msg._derived.isEscalation ? "Human handoff queued" : "Auto draft prepared";
  if (stage === "arrived") {
    dom.flowCaption.textContent = `${CHANNEL_META[msg.channel]?.label || msg.channel} inquiry arrived • ${intent} • ${
      msg.lead_context?.audience_role?.replace(/_/g, " ") || "prospect"
    } • waiting in queue.`;
  } else {
    dom.flowCaption.textContent = `${intent} processed in ${
      formatDuration(msg._derived.responseEqSec)
    } (equivalent) • ${outcome} • queue ${msg.triage?.queue || "—"}.`;
  }
  dom.flowCaption.textContent = maskBrandText(dom.flowCaption.textContent);
}

function getRelativePoint(container, el) {
  const c = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    x: r.left - c.left + r.width / 2,
    y: r.top - c.top + r.height / 2,
  };
}

function spawnPacket(direction, fromEl, toEl, color) {
  if (!fromEl || !toEl) return;
  const from = getRelativePoint(dom.flowMap, fromEl);
  const to = getRelativePoint(dom.flowMap, toEl);
  const mid = {
    x: direction === "inbound" ? (from.x + to.x) / 2 + 16 : (from.x + to.x) / 2 - 12,
    y: direction === "inbound"
      ? (from.y + to.y) / 2 + (from.y < to.y ? 18 : -18)
      : (from.y + to.y) / 2 + (to.y > from.y ? 18 : -18),
  };
  const dot = document.createElement("div");
  dot.className = "flow-packet";
  dot.style.setProperty("--packet-color", color);
  dot.style.setProperty("--sx", `${Math.round(from.x - 7)}px`);
  dot.style.setProperty("--sy", `${Math.round(from.y - 7)}px`);
  dot.style.setProperty("--mx", `${Math.round(mid.x - 7)}px`);
  dot.style.setProperty("--my", `${Math.round(mid.y - 7)}px`);
  dot.style.setProperty("--ex", `${Math.round(to.x - 7)}px`);
  dot.style.setProperty("--ey", `${Math.round(to.y - 7)}px`);
  const base = direction === "inbound" ? 980 : 860;
  dot.style.setProperty("--dur", `${Math.round(clamp(base / state.sim.speed, 160, 1400))}ms`);
  dom.packetLayer.append(dot);
  state.sim.activePackets += 1;
  dot.addEventListener("animationend", () => {
    dot.remove();
    state.sim.activePackets = Math.max(0, state.sim.activePackets - 1);
    spawnSpark({ x: to.x - 14, y: to.y - 14, color });
  });
}

function spawnSparkNear(el, color) {
  const p = getRelativePoint(dom.flowMap, el);
  const spread = 30;
  const seed = hashString(`${state.sim.simTimeMs}:${p.x}:${p.y}:${color}`);
  const dx = (seeded01(seed) - 0.5) * spread;
  const dy = (seeded01(seed + 1) - 0.5) * spread;
  spawnSpark({ x: p.x + dx - 14, y: p.y + dy - 14, color });
}

function spawnSpark({ x, y, color }) {
  const spark = document.createElement("div");
  spark.className = "flow-spark";
  spark.style.setProperty("--x", `${Math.round(x)}px`);
  spark.style.setProperty("--y", `${Math.round(y)}px`);
  spark.style.setProperty("--spark-color", color);
  spark.style.animationDuration = `${Math.round(clamp(620 / state.sim.speed, 140, 620))}ms`;
  dom.sparkLayer.append(spark);
  spark.addEventListener("animationend", () => spark.remove());
}

function updateCharts() {
  drawThroughputChart();
  drawResponseTimeChart();
  drawOutcomeDonut();
  drawQueueBars();
  updateImpactStoryboard();
}

function drawThroughputChart() {
  const svg = dom.throughputChart;
  const history = state.sim.stats.history;
  const w = 420;
  const h = 220;
  const m = { l: 34, r: 10, t: 10, b: 24 };
  const cw = w - m.l - m.r;
  const ch = h - m.t - m.b;
  const points = history.length ? history : [{ tMin: 0, processed: 0, backlog: 0, arrived: 0 }];
  const xMax = Math.max(points[points.length - 1]?.tMin || 0, 1);
  const yMax = Math.max(5, ...points.map((p) => Math.max(p.processed, p.backlog)));

  const x = (v) => m.l + (v / xMax) * cw;
  const y = (v) => m.t + ch - (v / yMax) * ch;

  const lineProcessed = points.map((p, i) => `${i ? "L" : "M"}${x(p.tMin)},${y(p.processed)}`).join(" ");
  const lineBacklog = points.map((p, i) => `${i ? "L" : "M"}${x(p.tMin)},${y(p.backlog)}`).join(" ");
  const areaProcessed = `${lineProcessed} L${x(points[points.length - 1].tMin)},${m.t + ch} L${x(points[0].tMin)},${
    m.t + ch
  } Z`;
  const areaBacklog = `${lineBacklog} L${x(points[points.length - 1].tMin)},${m.t + ch} L${x(points[0].tMin)},${
    m.t + ch
  } Z`;

  const grid = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => {
      const yy = m.t + ch * t;
      const label = Math.round(yMax * (1 - t));
      return `<line class="grid" x1="${m.l}" y1="${yy}" x2="${w - m.r}" y2="${yy}"></line><text x="${m.l - 6}" y="${
        yy + 4
      }" text-anchor="end">${label}</text>`;
    })
    .join("");

  const ticks = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => {
      const xx = m.l + cw * t;
      const label = `${(xMax * t).toFixed(xMax > 8 ? 0 : 1)}m`;
      return `<line class="grid" x1="${xx}" y1="${m.t}" x2="${xx}" y2="${m.t + ch}"></line><text x="${xx}" y="${
        h - 6
      }" text-anchor="middle">${label}</text>`;
    })
    .join("");

  svg.innerHTML = `
    <g>
      ${grid}
      ${ticks}
      <line class="axis" x1="${m.l}" y1="${m.t + ch}" x2="${w - m.r}" y2="${m.t + ch}"></line>
      <path class="area-main" d="${areaProcessed}"></path>
      <path class="area-backlog" d="${areaBacklog}"></path>
      <path class="line-main" d="${lineProcessed}"></path>
      <path class="line-backlog" d="${lineBacklog}"></path>
    </g>`;
}

function drawResponseTimeChart() {
  const svg = dom.responseTimeChart;
  const summaryEl = dom.responseTimeSummary;
  const samples = state.sim.stats.responseSamples;
  const w = 420;
  const h = 220;
  const m = { l: 34, r: 12, t: 14, b: 30 };
  const cw = w - m.l - m.r;
  const ch = h - m.t - m.b;

  const buckets = [
    { label: "<1m", min: 0, max: 60 },
    { label: "1–2m", min: 60, max: 120 },
    { label: "2–3m", min: 120, max: 180 },
    { label: "3–5m", min: 180, max: 300 },
    { label: "5–10m", min: 300, max: 600 },
    { label: "10m+", min: 600, max: Infinity },
  ];

  const bucketCounts = buckets.map(() => ({ auto: 0, handoff: 0 }));
  for (const s of samples) {
    const idx = buckets.findIndex((b) => s.sec >= b.min && s.sec < b.max);
    const bucket = bucketCounts[idx === -1 ? bucketCounts.length - 1 : idx];
    if (s.isEsc) bucket.handoff += 1;
    else bucket.auto += 1;
  }

  const totals = bucketCounts.map((b) => b.auto + b.handoff);
  const yMax = Math.max(2, ...totals);
  const barGap = 10;
  const barW = (cw - barGap * (buckets.length - 1)) / buckets.length;
  const y = (v) => m.t + ch - (v / yMax) * ch;

  const gridVals = Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * i));
  const grid = gridVals
    .map((v) => {
      const yy = y(v);
      return `<line class="grid" x1="${m.l}" y1="${yy}" x2="${w - m.r}" y2="${yy}"></line><text x="${m.l - 6}" y="${
        yy + 4
      }" text-anchor="end">${v}</text>`;
    })
    .join("");

  const bars = bucketCounts
    .map((b, i) => {
      const x = m.l + i * (barW + barGap);
      const autoH = y(0) - y(b.auto);
      const handoffH = y(0) - y(b.handoff);
      const autoY = y(b.auto);
      const stackY = y(b.auto + b.handoff);
      const total = b.auto + b.handoff;
      const label = buckets[i].label;
      return `
        <g>
          <rect x="${x}" y="${y(0)}" width="${barW}" height="0" rx="6" fill="rgba(17,20,33,0.03)"></rect>
          <rect x="${x}" y="${autoY}" width="${barW}" height="${
        Math.max(0, autoH)
      }" rx="6" fill="rgba(14,165,164,0.85)"></rect>
          <rect x="${x}" y="${stackY}" width="${barW}" height="${
        Math.max(0, handoffH)
      }" rx="6" fill="rgba(239,91,68,0.82)"></rect>
          <text x="${x + barW / 2}" y="${h - 8}" text-anchor="middle">${label}</text>
          <text x="${x + barW / 2}" y="${stackY - 4}" text-anchor="middle">${total || ""}</text>
        </g>
      `;
    })
    .join("");

  const slaX = m.l + (barW + barGap) * 4 - barGap / 2; // boundary after 3–5m bucket
  const under5 = samples.length ? samples.filter((s) => s.sec <= 300).length / samples.length : 0;
  const medianSec = samples.length
    ? [...samples].sort((a, b) => a.sec - b.sec)[Math.floor(samples.length / 2)].sec
    : 0;

  if (summaryEl) {
    summaryEl.textContent = samples.length
      ? `Median ${formatDurationShort(medianSec)} • Under 5m ${Math.round(under5 * 100)}% • N=${samples.length}`
      : "Waiting for completed responses…";
  }

  svg.innerHTML = `
    <g>
      ${grid}
      <line class="axis" x1="${m.l}" y1="${m.t + ch}" x2="${w - m.r}" y2="${m.t + ch}"></line>
      <line x1="${slaX}" y1="${m.t}" x2="${slaX}" y2="${
    m.t + ch
  }" stroke="#1463ff" stroke-width="2" opacity="0.75" stroke-dasharray="5 5"></line>
      <text x="${Math.min(w - m.r, slaX + 6)}" y="${m.t + 10}" text-anchor="start">5-min SLA</text>
      ${bars}
    </g>`;
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function drawOutcomeDonut() {
  const svg = dom.outcomeDonut;
  const { autoDrafts, escalations, processed } = state.sim.stats;
  const total = Math.max(processed, 1);
  const escRate = escalations / total;
  const autoRate = autoDrafts / total;
  const cx = 110;
  const cy = 110;
  const r = 72;
  const start = 0;
  const escEnd = start + escRate * 360;
  const autoEnd = escEnd + autoRate * 360;

  const baseCircle =
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(17,20,33,0.08)" stroke-width="22"></circle>`;
  const escPath = escalations
    ? `<path d="${
      arcPath(cx, cy, r, start, escEnd)
    }" fill="none" stroke="#ef5b44" stroke-width="22" stroke-linecap="round"></path>`
    : "";
  const autoPath = autoDrafts
    ? `<path d="${
      arcPath(cx, cy, r, escEnd + (escalations ? 2 : 0), autoEnd)
    }" fill="none" stroke="#0ea5a4" stroke-width="22" stroke-linecap="round"></path>`
    : "";

  svg.innerHTML = `${baseCircle}${autoPath}${escPath}`;
  dom.donutEscalationRate.textContent = formatPercent(escRate, 0);
  dom.outcomeBreakdownNote.innerHTML = `
    <div><span class="legend-dot teal"></span>Auto drafts: <strong>${formatInt(autoDrafts)}</strong> (${
    formatPercent(autoRate, 0)
  })</div>
    <div><span class="legend-dot coral"></span>Handoffs: <strong>${formatInt(escalations)}</strong> (${
    formatPercent(escRate, 0)
  })</div>`;
}

function drawQueueBars() {
  const container = dom.queueBars;
  const queueEntries = Object.entries(state.sim.stats.queueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  const max = Math.max(1, ...queueEntries.map(([, count]) => count), 1);
  container.innerHTML = "";
  if (queueEntries.length === 0) {
    container.innerHTML =
      "<div class=\"list-row\">No queue routing yet. Press Start to see routing pressure build in real time.</div>";
    return;
  }
  for (const [queue, count] of queueEntries) {
    const row = document.createElement("div");
    row.className = "bar-row";
    const likelyHandoff =
      /International|TransferEval|Privacy|Accessibility|ServiceRecovery|HelpDesk|PackageReview|Immediate|InfoSec/.test(
        queue,
      );
    row.innerHTML = `
      <div class="bar-label">${queue}</div>
      <div class="bar-track"><div class="bar-fill ${likelyHandoff ? "handoff" : ""}"></div></div>
      <div class="bar-value">${count}</div>`;
    container.append(row);
    const fill = row.querySelector(".bar-fill");
    fill.style.width = `${(count / max) * 100}%`;
  }
}

function updateImpactStoryboard() {
  const stats = state.sim.stats;
  const processed = stats.processed;
  const arrived = stats.arrived;
  const avgSat = processed ? stats.satisfactionTotal / processed : 0;
  const projectedEnrollables = Math.round(stats.highIntent * 0.28 + stats.autoDrafts * 0.06 + stats.escalations * 0.1);

  /** @type {Record<string, number>} */
  const values = {
    arrived,
    processed,
    under5: stats.under5Min,
    auto: stats.autoDrafts,
    handoff: stats.escalations,
    highIntent: stats.highIntent,
    projectedEnrollables,
  };
  const denom = Math.max(arrived, 1);

  for (const row of $$("[data-key]", dom.impactFunnel)) {
    const key = row.dataset.key;
    const value = values[key] ?? 0;
    const valueEl = row.querySelector("[data-role=\"value\"]");
    const fillEl = row.querySelector("[data-role=\"fill\"]");
    if (valueEl) valueEl.textContent = `${formatInt(value)}${arrived ? ` (${formatPercent(value / denom, 0)})` : ""}`;
    if (fillEl) fillEl.style.width = `${(value / denom) * 100}%`;
  }

  const satAngle = clamp((avgSat / 100) * 360, 0, 360);
  dom.satisfactionGaugeFill.style.background =
    `conic-gradient(#0ea5a4 0deg, #1463ff ${satAngle}deg, rgba(17,20,33,0.08) ${satAngle}deg 360deg)`;
  dom.satisfactionGaugeValue.textContent = processed ? String(Math.round(avgSat)) : "—";

  dom.hoursSaved.textContent = `${stats.hoursSavedTotal.toFixed(1)}h`;
  dom.highIntentCount.textContent = formatInt(stats.highIntent);
  dom.highIntentShare.textContent = processed
    ? `${formatPercent(stats.highIntent / processed, 0)} of processed inquiries`
    : "0% of processed";
}

function linePath(points, xFn, yFn) {
  if (!points.length) return "";
  return points.map((p, i) => `${i ? "L" : "M"}${xFn(p, i)},${yFn(p, i)}`).join(" ");
}

function renderAll() {
  renderPlaybackStatus();
  renderControlState();
  renderMetrics();
  renderChannelCounts();
  updateCharts();
}

function tick(frameTs) {
  if (!state.sim.lastFrameTs) state.sim.lastFrameTs = frameTs;
  const rawDt = Math.min(120, frameTs - state.sim.lastFrameTs);
  state.sim.lastFrameTs = frameTs;

  if (state.sim.running && state.loaded && !state.error) {
    advanceSimulation(rawDt * state.sim.speed);
    renderMetrics();
    renderPlaybackStatus();
    renderProcessingPhase();
    dom.coreQueue.textContent = String(state.sim.queue.length);
    dom.coreProcessing.textContent = state.sim.current ? "1" : "0";
  }

  requestAnimationFrame(tick);
}

function loadErrorMessage(err) {
  return [
    "Unable to load the intake stream file (`triage/messages.json`).",
    "If you opened `index.html` directly from the filesystem, the browser may block `fetch()` for local files.",
    "Serve the folder locally (example: `cd triage && python3 -m http.server 8000`) and open `http://localhost:8000`.",
    `Error: ${err?.message || String(err)}`,
  ].join("\n\n");
}

async function init() {
  dom = makeDom();
  attachEvents();
  renderControlState();
  renderPlaybackStatus();
  buildImpactFunnelRows();
  updateCharts();
  resetProcessingPanels();

  try {
    await loadDataset();
    resetSimulation();
    renderAll();
    setFooterStatus("Stream ready. Starting intake stream…");
    setRunning(true);
  } catch (err) {
    console.error(err);
    state.error = err;
    resetProcessingPanels();
    dom.focusMessageText.textContent = loadErrorMessage(err);
    dom.playbackStatusLabel.textContent = "Load error";
    dom.liveDot.className = "live-dot error";
    dom.currentPhaseBadge.textContent = "Load Error";
    setFooterStatus("Load error. See message panel for details.");
  }

  requestAnimationFrame(tick);
}

init();

// @ts-check

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    app: /** @type {null | AppModel} */ (null),
    textCache: new Map(),
    analyzer: {
      open: false,
      applicant: /** @type {null | ApplicantModel} */ (null),
      tasks: /** @type {AnalysisTask[]} */ ([]),
      currentTaskId: null,
      running: false,
      token: 0,
      thoughtText: "",
      currentSnapshotRows: /** @type {KeyValueRow[]} */ ([]),
      currentDoc: /** @type {null | DocumentModel} */ (null),
      finalReady: false,
      finalNarrativeText: "",
      completionCount: 0,
    },
    currentPreviewTarget: /** @type {null | { applicant: ApplicantModel; doc: DocumentModel; mode: 'preview' | 'task-detail' }} */ (null),
  };

  /** @typedef {{ synthetic: any, renderManifest: any, applicants: ApplicantModel[], stats: AppStats }} AppModel */
  /** @typedef {{ field: string, value: string }} KeyValueRow */
  /** @typedef {{ title: string, kind: 'kv' | 'table' | 'list' | 'code' | 'badges', rows?: KeyValueRow[], columns?: string[], tableRows?: string[][], items?: string[], text?: string, badges?: string[] }} ExtractionSection */
  /** @typedef {{ summaryRows: KeyValueRow[], snapshotRows: KeyValueRow[], sections: ExtractionSection[], raw: any }} ExtractionModel */
  /** @typedef {{ id: string, status: 'pending' | 'current' | 'complete' | 'error', doc: DocumentModel, thoughtText: string, snapshotRows: KeyValueRow[], error?: string }} AnalysisTask */
  /** @typedef {{ totalApplicants: number, totalDocuments: number, fileTypeCounts: Record<string, number>, archetypeCounts: Record<string, number>, mixedBundles: number, imageOnlyBundles: number, pdfOnlyBundles: number, textContainingBundles: number }} AppStats */
  /** @typedef {{ id: string, applicantId: string, type: string, title: string, issuer: string, issueDate: string, format: 'pdf'|'webp'|'txt', renderingMethod: string, pageCount: number, fileName: string, path: string, basename: string, structuredContent: any, gemimgPrompt?: string, renderEngine?: string, renderStatus?: string, thought: string, extraction: ExtractionModel }} DocumentModel */
  /** @typedef {{ id: string, archetypeCode: 'A'|'B'|'C', archetypeLabel: string, persona: any, targetProgram: string, admissionsTerm: string, expected: any, folder: string, documents: DocumentModel[], formatCounts: Record<string, number>, formatMix: string[] }} ApplicantModel */

  const refs = {
    heroMetrics: /** @type {HTMLElement} */ ($("#hero-metrics")),
    beforeAfterKpi: /** @type {HTMLElement} */ ($("#before-after-kpi")),
    diversityMap: /** @type {HTMLElement} */ ($("#diversity-map")),
    sectionStatboard: /** @type {HTMLElement} */ ($("#section-statboard")),
    grid: /** @type {HTMLElement} */ ($("#applicant-grid")),
    cardTemplate: /** @type {HTMLTemplateElement} */ ($("#card-template")),

    analyzerModal: /** @type {HTMLElement} */ ($("#analyzer-modal")),
    analyzerTitle: /** @type {HTMLElement} */ ($("#analyzer-title")),
    analyzerSubtitle: /** @type {HTMLElement} */ ($("#analyzer-subtitle")),
    analyzerCloseBtn: /** @type {HTMLButtonElement} */ ($("#analyzer-close-btn")),
    progressPill: /** @type {HTMLElement} */ ($("#analyzer-progress-pill")),
    taskSummary: /** @type {HTMLElement} */ ($("#task-summary")),
    taskProgressFill: /** @type {HTMLElement} */ ($("#task-progress-fill")),
    taskList: /** @type {HTMLElement} */ ($("#task-list")),
    analysisStage: /** @type {HTMLElement} */ ($(".analysis-stage")),
    stageFrame: /** @type {HTMLElement} */ ($(".stage-frame")),
    currentFileName: /** @type {HTMLElement} */ ($("#current-file-name")),
    openCurrentFileBtn: /** @type {HTMLButtonElement} */ ($("#open-current-file-btn")),
    livePreviewShell: /** @type {HTMLElement} */ ($(".live-preview-shell")),
    livePreview: /** @type {HTMLElement} */ ($("#live-preview")),
    thoughtStream: /** @type {HTMLElement} */ ($("#thought-stream")),
    extractedStatus: /** @type {HTMLElement} */ ($("#extracted-status")),
    extractedWrap: /** @type {HTMLElement} */ ($("#extracted-table-wrap")),
    finalPathwayPanel: /** @type {HTMLElement} */ ($("#final-pathway-panel")),

    fileModal: /** @type {HTMLElement} */ ($("#file-modal")),
    fileModalEyebrow: /** @type {HTMLElement} */ ($("#file-modal-eyebrow")),
    fileModalTitle: /** @type {HTMLElement} */ ($("#file-modal-title")),
    fileModalMeta: /** @type {HTMLElement} */ ($("#file-modal-meta")),
    fileModalOpenLink: /** @type {HTMLAnchorElement} */ ($("#file-modal-open-link")),
    fileModalCloseBtn: /** @type {HTMLButtonElement} */ ($("#file-modal-close-btn")),
    filePreviewContainer: /** @type {HTMLElement} */ ($("#file-preview-container")),
    fileDetailTitle: /** @type {HTMLElement} */ ($("#file-detail-title")),
    fileDetailSubtitle: /** @type {HTMLElement} */ ($("#file-detail-subtitle")),
    fileDetailContent: /** @type {HTMLElement} */ ($("#file-detail-content")),
  };

  const ARCHETYPE_THEME = {
    A: { className: "archetype-a", short: "Veteran" },
    B: { className: "archetype-b", short: "SCNC" },
    C: { className: "archetype-c", short: "International" },
  };

  const DOC_TYPE_LABEL = {
    DD214: "DD-214",
    JST: "Joint Services Transcript",
    CompTIA_SecurityPlus_Certificate: "CompTIA Security+",
    High_School_Attestation_Form: "HS Attestation",
    Community_College_Transcript: "Community College Transcript",
    Sophia_Learning_Transcript: "Sophia Transcript",
    Google_Project_Management_Certificate: "Google PM Certificate",
    WES_Course_By_Course_Evaluation: "WES Evaluation",
    ECE_Course_By_Course_Evaluation: "ECE Evaluation",
    TOEFL_Score_Report: "TOEFL Score Report",
  };

  const FILE_TYPE_ICON = { pdf: "PDF", webp: "IMG", txt: "TXT" };
  const STREAM_SLOWDOWN = 1.5;

  init().catch((error) => {
    console.error(error);
    refs.grid.innerHTML = `
      <article class="applicant-card" style="grid-column:1/-1; opacity:1; transform:none;">
        <h3 style="margin:0; font-family: Fraunces, serif;">Failed to load demo data</h3>
        <p class="muted">${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
      </article>
    `;
  });

  async function init() {
    bindBaseEvents();
    const [synthetic, renderManifest] = await Promise.all([
      fetchJson("./data/manifests/synthetic_applicant_bundles.json"),
      fetchJson("./data/manifests/render_manifest.json"),
    ]);

    const app = buildAppModel(synthetic, renderManifest);
    state.app = app;

    renderHero(app);
    renderDiversityMap(app);
    renderSectionStatboard(app);
    renderApplicantGrid(app);
  }

  function bindBaseEvents() {
    refs.grid.addEventListener("click", onGridClick);
    refs.diversityMap.addEventListener("click", onDiversityMapClick);
    refs.analyzerCloseBtn.addEventListener("click", () => closeAnalyzer());
    refs.fileModalCloseBtn.addEventListener("click", () => closeFileModal());
    refs.openCurrentFileBtn.addEventListener("click", () => {
      const analyzer = state.analyzer;
      if (!analyzer.currentDoc || !analyzer.applicant) return;
      openFileModal({ applicant: analyzer.applicant, doc: analyzer.currentDoc, mode: "preview" });
    });

    document.addEventListener("click", (event) => {
      const target = /** @type {HTMLElement} */ (event.target);
      const closer = target.closest("[data-close]");
      if (!closer) return;
      const which = closer.getAttribute("data-close");
      if (which === "analyzer") closeAnalyzer();
      if (which === "file") closeFileModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!refs.fileModal.classList.contains("hidden")) {
        closeFileModal();
        return;
      }
      if (!refs.analyzerModal.classList.contains("hidden")) {
        closeAnalyzer();
      }
    });

    refs.taskList.addEventListener("click", (event) => {
      const target = /** @type {HTMLElement} */ (event.target);
      const item = target.closest(".task-item");
      if (!item) return;
      const taskId = item.getAttribute("data-task-id");
      if (!taskId || !state.analyzer.applicant) return;
      const task = state.analyzer.tasks.find((t) => t.id === taskId);
      if (!task || task.status !== "complete") return;
      openFileModal({ applicant: state.analyzer.applicant, doc: task.doc, mode: "task-detail" });
    });
    refs.taskList.addEventListener("keydown", (event) => {
      const keyEvent = /** @type {KeyboardEvent} */ (event);
      if (!["Enter", " "].includes(keyEvent.key)) return;
      const target = /** @type {HTMLElement} */ (keyEvent.target);
      const item = target.closest(".task-item.clickable");
      if (!item) return;
      keyEvent.preventDefault();
      item.click();
    });
  }

  async function onGridClick(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    if (target.closest(".file-open-link")) return;
    const fileChip = target.closest(".file-chip");
    if (fileChip) {
      const mouse = /** @type {MouseEvent} */ (event);
      if (mouse.metaKey || mouse.ctrlKey || mouse.shiftKey || mouse.altKey) return;
      event.preventDefault();
      const applicantId = fileChip.getAttribute("data-applicant-id");
      const docId = fileChip.getAttribute("data-doc-id");
      if (!applicantId || !docId || !state.app) return;
      const applicant = state.app.applicants.find((a) => a.id === applicantId);
      const doc = applicant?.documents.find((d) => d.id === docId);
      if (!applicant || !doc) return;
      openFileModal({ applicant, doc, mode: "preview" });
      return;
    }

    const creditBtn = target.closest(".credit-check-btn");
    if (creditBtn) {
      const card = creditBtn.closest(".applicant-card");
      const applicantId = card?.getAttribute("data-applicant-id");
      if (!applicantId || !state.app) return;
      const applicant = state.app.applicants.find((a) => a.id === applicantId);
      if (!applicant) return;
      startAnalyzer(applicant);
      return;
    }
  }

  async function onDiversityMapClick(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    const fileBtn = target.closest(".diversity-file-btn");
    if (!fileBtn) return;
    const applicantId = fileBtn.getAttribute("data-applicant-id");
    const docId = fileBtn.getAttribute("data-doc-id");
    if (!applicantId || !docId || !state.app) return;
    const doc = findDoc(applicantId, docId);
    if (!doc) return;
    window.open(doc.path, "_blank", "noopener,noreferrer");
  }

  /** @param {string} applicantId @param {string} docId */
  function findApplicantAndDoc(applicantId, docId) {
    if (!state.app) return null;
    const applicant = state.app.applicants.find((a) => a.id === applicantId);
    const doc = applicant?.documents.find((d) => d.id === docId);
    if (!applicant || !doc) return null;
    return { applicant, doc };
  }

  /** @param {string} applicantId @param {string} docId */
  function findDoc(applicantId, docId) {
    return findApplicantAndDoc(applicantId, docId)?.doc || null;
  }

  async function fetchJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return res.json();
  }

  /** @param {string} path */
  function normalizeAppRelativePath(path) {
    let p = String(path);
    if (p.startsWith("credit-checking/")) p = p.slice("credit-checking/".length);
    if (!p.startsWith("./")) p = `./${p}`;
    return p;
  }

  /** @param {string} path */
  function baseName(path) {
    const parts = String(path).split("/");
    return parts[parts.length - 1] || path;
  }

  /** @param {string} fileName */
  function fileExt(fileName) {
    const idx = fileName.lastIndexOf(".");
    return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : "";
  }

  /** @param {any} synthetic @param {any} renderManifest @returns {AppModel} */
  function buildAppModel(synthetic, renderManifest) {
    /** @type {Map<string, any>} */
    const renderApplicantMap = new Map((renderManifest.applicants || []).map((a) => [a.Applicant_ID, a]));
    /** @type {Map<string, any>} */
    const renderDocMap = new Map();
    for (const app of renderManifest.applicants || []) {
      for (const doc of app.Documents || []) renderDocMap.set(doc.Document_ID, doc);
    }

    /** @type {ApplicantModel[]} */
    const applicants = (synthetic.applicants || []).map((a) => {
      const renderApplicant = renderApplicantMap.get(a.Applicant_ID);
      const formatCounts = renderApplicant?.Format_Counts || countFormatsFromDocs(a.Document_Bundle);
      const documents = /** @type {DocumentModel[]} */ ((a.Document_Bundle || []).map((doc) => {
        const renderDoc = renderDocMap.get(doc.Document_ID);
        const rawOutput = renderDoc?.Output_File || `${renderApplicant?.Folder || ""}/${doc.Output_File_Name}`;
        const relPath = normalizeAppRelativePath(rawOutput);
        const basename = baseName(relPath);
        const format = /** @type {'pdf'|'webp'|'txt'} */ (doc.Document_Format);
        const model = {
          id: doc.Document_ID,
          applicantId: a.Applicant_ID,
          type: doc.Document_Type,
          title: doc.Title,
          issuer: doc.Issuing_Organization,
          issueDate: doc.Issue_Date,
          format,
          renderingMethod: doc.Rendering_Method,
          pageCount: doc.Page_Count,
          fileName: doc.Output_File_Name,
          path: relPath,
          basename,
          structuredContent: doc.Structured_Content,
          gemimgPrompt: doc.Gemimg_Prompt,
          renderEngine: renderDoc?.Render_Engine,
          renderStatus: renderDoc?.Render_Status,
          thought: "",
          extraction: /** @type {ExtractionModel} */ ({ summaryRows: [], snapshotRows: [], sections: [], raw: doc.Structured_Content }),
        };
        model.thought = buildThoughtForDocument(model, a);
        model.extraction = buildExtractionModel(model, a);
        return model;
      }));

      return {
        id: a.Applicant_ID,
        archetypeCode: a.Archetype_Code,
        archetypeLabel: a.Archetype_Label,
        persona: a.Persona,
        targetProgram: a.Target_Program,
        admissionsTerm: a.Admissions_Term,
        expected: a.Expected_AI_Output,
        folder: normalizeAppRelativePath(renderApplicant?.Folder || ""),
        documents,
        formatCounts,
        formatMix: Object.keys(formatCounts).sort(),
      };
    });

    const stats = buildStats(applicants);
    return { synthetic, renderManifest, applicants, stats };
  }

  /** @param {any[]} docs */
  function countFormatsFromDocs(docs) {
    /** @type {Record<string, number>} */
    const counts = {};
    for (const d of docs || []) counts[d.Document_Format] = (counts[d.Document_Format] || 0) + 1;
    return counts;
  }

  /** @param {ApplicantModel[]} applicants */
  function buildStats(applicants) {
    /** @type {Record<string, number>} */
    const fileTypeCounts = { pdf: 0, webp: 0, txt: 0 };
    /** @type {Record<string, number>} */
    const archetypeCounts = { A: 0, B: 0, C: 0 };
    let totalDocuments = 0;
    let mixedBundles = 0;
    let imageOnlyBundles = 0;
    let pdfOnlyBundles = 0;
    let textContainingBundles = 0;

    for (const applicant of applicants) {
      archetypeCounts[applicant.archetypeCode] = (archetypeCounts[applicant.archetypeCode] || 0) + 1;
      const types = new Set();
      for (const doc of applicant.documents) {
        totalDocuments += 1;
        fileTypeCounts[doc.format] = (fileTypeCounts[doc.format] || 0) + 1;
        types.add(doc.format);
      }
      if (types.size > 1) mixedBundles += 1;
      if (types.size === 1 && types.has("webp")) imageOnlyBundles += 1;
      if (types.size === 1 && types.has("pdf")) pdfOnlyBundles += 1;
      if (types.has("txt")) textContainingBundles += 1;
    }

    return {
      totalApplicants: applicants.length,
      totalDocuments,
      fileTypeCounts,
      archetypeCounts,
      mixedBundles,
      imageOnlyBundles,
      pdfOnlyBundles,
      textContainingBundles,
    };
  }

  /** @param {AppModel} app */
  function renderHero(app) {
    const stats = app.stats;
    refs.heroMetrics.innerHTML = "";
    const tiles = [
      [String(stats.totalApplicants), "Applicants"],
      [String(stats.totalDocuments), "Uploaded files"],
      [`${stats.fileTypeCounts.webp ?? 0} img`, "Messy image uploads"],
      ["Weeks → Minutes", "Advisor turnaround (demo)"],
    ];
    for (const [value, label] of tiles) {
      const el = document.createElement("div");
      el.className = "metric-tile";
      el.innerHTML = `<span class="metric-value">${escapeHtml(value)}</span><span class="metric-label">${escapeHtml(label)}</span>`;
      refs.heroMetrics.append(el);
    }
    renderBeforeAfterKpi(app);
  }

  /** @param {AppModel} app */
  function renderBeforeAfterKpi(app) {
    const avgTransferCredits =
      app.applicants.reduce((sum, a) => sum + Number(a.expected?.Proposed_Transfer_Credits_Total || 0), 0) /
      Math.max(1, app.applicants.length);
    const avgSavings = avgTransferCredits * 330;
    const metrics = [
      {
        label: "Manual Review Turnaround",
        before: "10-15 business days",
        after: "< 30 minutes (same call)",
        accent: "teal",
      },
      {
        label: "Advisor Touches / Applicant",
        before: "5-7 handoffs",
        after: "1-2 focused reviews",
        accent: "navy",
      },
      {
        label: "Credits Surfaced in First Pass",
        before: "Partial / delayed",
        after: `${formatCredits(avgTransferCredits)} average visible`,
        accent: "gold",
      },
      {
        label: "Student Savings Clarified Upfront",
        before: "Unknown until eval complete",
        after: `~${formatCurrency(avgSavings)} tuition equivalent`,
        accent: "red",
      },
    ];

    refs.beforeAfterKpi.innerHTML = `
      <div class="kpi-panel-head">
        <p class="eyebrow">Business Impact Lens</p>
        <h3>Before vs After: what this changes for adult learners and advisors</h3>
      </div>
      <div class="kpi-grid">
        ${metrics
          .map(
            (m) => `
          <article class="kpi-card kpi-${escapeHtml(m.accent)}">
            <p class="kpi-label">${escapeHtml(m.label)}</p>
            <div class="kpi-compare">
              <div class="kpi-col before">
                <span class="kpi-col-label">Before</span>
                <span class="kpi-value">${escapeHtml(m.before)}</span>
              </div>
              <div class="kpi-arrow" aria-hidden="true">→</div>
              <div class="kpi-col after">
                <span class="kpi-col-label">After</span>
                <span class="kpi-value">${escapeHtml(m.after)}</span>
              </div>
            </div>
          </article>
        `,
          )
          .join("")}
      </div>
    `;
  }

  /** @param {number} amount */
  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /** @param {AppModel} app */
  function renderDiversityMap(app) {
    refs.diversityMap.innerHTML = "";
    for (const applicant of app.applicants) {
      const cell = document.createElement("div");
      cell.className = "diversity-cell";
      const archetypeTheme = ARCHETYPE_THEME[applicant.archetypeCode];
      cell.innerHTML = `
        <h3>${escapeHtml(applicant.persona.preferred_name)} <span class="tiny-meta">${escapeHtml(archetypeTheme.short)}</span></h3>
        <ul class="diversity-file-list">${applicant.documents
          .map(
            (d) => `
            <li>
              <button class="diversity-file-btn" type="button" data-applicant-id="${escapeHtml(applicant.id)}" data-doc-id="${escapeHtml(d.id)}" title="Open ${escapeHtml(d.basename)} in a new tab">
                <span class="diversity-file-type ${escapeHtml(d.format)}">${d.format === "webp" ? "IMG" : d.format.toUpperCase()}</span>
                <span class="diversity-file-name">${escapeHtml(d.basename)}</span>
              </button>
            </li>
          `,
          )
          .join("")}</ul>
      `;
      refs.diversityMap.append(cell);
    }
  }

  /** @param {AppModel} app */
  function renderSectionStatboard(app) {
    const rows = [
      ["Bundles with mixed formats", String(app.stats.mixedBundles)],
      ["Image-only bundles", String(app.stats.imageOnlyBundles)],
      ["PDF-only bundles", String(app.stats.pdfOnlyBundles)],
      ["Bundles containing text exports", String(app.stats.textContainingBundles)],
    ];
    refs.sectionStatboard.innerHTML = rows
      .map(
        ([label, value]) => `
        <div class="statboard-item">
          <span class="label">${escapeHtml(label)}</span>
          <span class="value">${escapeHtml(value)}</span>
        </div>
      `,
      )
      .join("");
  }

  /** @param {AppModel} app */
  function renderApplicantGrid(app) {
    refs.grid.innerHTML = "";
    for (const applicant of app.applicants) {
      const node = refs.cardTemplate.content.firstElementChild?.cloneNode(true);
      if (!(node instanceof HTMLElement)) continue;
      node.dataset.applicantId = applicant.id;
      populateApplicantCard(node, applicant);
      refs.grid.append(node);
    }
  }

  /** @param {HTMLElement} card @param {ApplicantModel} applicant */
  function populateApplicantCard(card, applicant) {
    const theme = ARCHETYPE_THEME[applicant.archetypeCode];
    const badges = $(".card-badges", card);
    const creditBtn = /** @type {HTMLButtonElement} */ ($(".credit-check-btn", card));
    const nameEl = $(".applicant-name", card);
    const subtitleEl = $(".card-subtitle", card);
    const storylineEl = $(".storyline", card);
    const fingerprintEl = $(".mini-fingerprint", card);
    const fileCluster = $(".file-cluster", card);
    const cardMetrics = $(".card-metrics", card);

    if (badges) {
      badges.innerHTML = `
        <span class="badge ${theme.className}">${escapeHtml(theme.short)}</span>
        <span class="badge program">${escapeHtml(applicant.targetProgram)}</span>
      `;
    }
    if (creditBtn) {
      creditBtn.dataset.applicantId = applicant.id;
    }
    if (nameEl) nameEl.textContent = applicant.persona.full_name;
    if (subtitleEl) {
      subtitleEl.textContent = `${applicant.archetypeLabel} • ${applicant.documents.length} files`;
    }
    if (storylineEl) storylineEl.textContent = applicant.persona.demo_storyline;

    if (fingerprintEl) {
      fingerprintEl.innerHTML = applicant.documents
        .map((doc) => `<span class="segment ${doc.format}" style="flex:${Math.max(1, doc.pageCount)}" title="${escapeHtml(doc.basename)}"></span>`)
        .join("");
    }

    if (fileCluster) {
      fileCluster.innerHTML = applicant.documents
        .map(
          (doc) => `
          <a class="file-chip" href="${escapeAttr(doc.path)}" target="_blank" rel="noopener noreferrer" data-applicant-id="${escapeHtml(applicant.id)}" data-doc-id="${escapeHtml(doc.id)}" title="Click to preview • Cmd/Ctrl-click opens original">
            <span class="file-icon ${escapeHtml(doc.format)}">${escapeHtml(FILE_TYPE_ICON[doc.format] || doc.format.toUpperCase())}</span>
            <span class="file-name">${escapeHtml(doc.basename)}</span>
            <span class="file-actions">
              <span class="file-ext-pill">${escapeHtml(doc.format)}</span>
              <span class="file-open-link" aria-hidden="true">↗</span>
            </span>
          </a>
        `,
        )
        .join("");
    }

    if (cardMetrics) {
      const totalTransfer = applicant.expected?.Proposed_Transfer_Credits_Total ?? 0;
      const mapped = (applicant.expected?.Mapped_Courses || []).length;
      const formats = Object.entries(applicant.formatCounts)
        .map(([k, v]) => `${k}:${v}`)
        .join(" • ");
      cardMetrics.innerHTML = [
        ["Transfer", `${formatCredits(totalTransfer)} est.`],
        ["Mapped", `${mapped} courses`],
        ["Mix", formats],
      ]
        .map(
          ([label, value]) => `
          <div class="card-metric">
            <span class="label">${escapeHtml(label)}</span>
            <span class="value">${escapeHtml(value)}</span>
          </div>
        `,
        )
        .join("");
    }
  }

  /** @param {DocumentModel} doc @param {any} applicantRaw */
  function buildThoughtForDocument(doc, applicantRaw) {
    const sc = doc.structuredContent || {};
    const common = `Normalizing fields into the advisor-ready schema and linking evidence to this applicant's pathway.`;
    switch (doc.type) {
      case "DD214": {
        const mos = sc.service_record?.mos_code || "MOS";
        return `This looks like a DD-214. Extracting service branch, service dates, rank at separation, character of service, and military occupation (${mos}). Capturing identifiers and separation metadata for transfer-credit evidence. ${common}`;
      }
      case "JST": {
        return `Identified a Joint Services Transcript. Parsing dense military transcript text, training records, and ACE credit recommendation blocks. Looking for MOS 42A Human Resources Specialist evidence and any ACE lower/upper-division credit guidance. ${common}`;
      }
      case "CompTIA_SecurityPlus_Certificate": {
        return `Detected a CompTIA Security+ credential certificate. Extracting credential ID, issue/expiration dates, and competency signals. Matching certificate outcomes against IT-253 Computer Systems Security articulation rules. ${common}`;
      }
      case "High_School_Attestation_Form": {
        return `This appears to be a high school completion attestation form. Reading completion confirmation, signer information, and attestation date from a low-quality scan. Standardizing admissions-readiness evidence before transfer review. ${common}`;
      }
      case "Community_College_Transcript": {
        return `Detected a community college transcript. Extracting institution name, student number, GPA summary, and course rows from an older registrar layout. Checking for transferable foundational courses like Intro to Psychology. ${common}`;
      }
      case "Sophia_Learning_Transcript": {
        return `This is a Sophia Learning transcript export. Parsing pass/fail competency-based course completions and credit amounts from the text-heavy transcript format. Converting self-paced course evidence into standardized transfer rows. ${common}`;
      }
      case "Google_Project_Management_Certificate": {
        return `Detected a Google Project Management Professional Certificate. Extracting credential metadata and skill coverage, then testing the certificate against the QSO articulation bundle (QSO340, QSO355, QSO420, QSO435). ${common}`;
      }
      case "WES_Course_By_Course_Evaluation":
      case "ECE_Course_By_Course_Evaluation": {
        const agency = sc.evaluation_record?.agency || (doc.type.startsWith("WES") ? "WES" : "ECE");
        return `Recognized a ${agency} course-by-course credential evaluation. Extracting U.S. equivalency, evaluator reference number, converted GPA, and evaluated course list. Mapping evaluator course equivalencies into advisor review tables. ${common}`;
      }
      case "TOEFL_Score_Report": {
        return `Detected a TOEFL iBT score report. Extracting section scores and total score, validating test date, and standardizing English proficiency evidence in the admissions checklist. ${common}`;
      }
      default:
        return `Reviewing uploaded document and extracting structured fields, tabular data, identifiers, dates, and potential transfer-credit evidence. ${common}`;
    }
  }

  /** @param {DocumentModel} doc @param {any} applicantRaw @returns {ExtractionModel} */
  function buildExtractionModel(doc, applicantRaw) {
    const sc = doc.structuredContent || {};
    /** @type {KeyValueRow[]} */
    const summaryRows = [
      row("Detected Document", DOC_TYPE_LABEL[doc.type] || doc.type),
      row("Uploaded File", doc.basename),
      row("File Format", doc.format.toUpperCase()),
      row("Issuer", doc.issuer),
      row("Issue Date", doc.issueDate),
      row("Applicant", applicantRaw.Persona?.full_name || sc.student_name || ""),
    ];
    if (sc.student_id_on_document) summaryRows.push(row("Document Student ID", String(sc.student_id_on_document)));
    if (sc.document_number) summaryRows.push(row("Document Number", String(sc.document_number)));
    if (sc.date_range?.start || sc.date_range?.end) {
      summaryRows.push(row("Date Range", `${sc.date_range?.start || ""} → ${sc.date_range?.end || ""}`));
    }
    if (sc.service_record?.mos_code) summaryRows.push(row("MOS", `${sc.service_record.mos_code} ${sc.service_record.mos_title || ""}`.trim()));
    if (sc.education_record?.institution_name) summaryRows.push(row("Institution", sc.education_record.institution_name));
    if (sc.evaluation_record?.agency) summaryRows.push(row("Evaluator", sc.evaluation_record.agency));
    if (sc.certificate_record?.credential_id) summaryRows.push(row("Credential ID", sc.certificate_record.credential_id));
    const toeflTotal = findToeflTotal(sc.scores);
    if (toeflTotal) summaryRows.push(row("TOEFL Total", `${toeflTotal.score} / ${toeflTotal.scale}`));
    if (Array.isArray(sc.courses)) summaryRows.push(row("Course Rows", String(sc.courses.length)));
    if (Array.isArray(sc.ace_recommendations)) summaryRows.push(row("ACE Recommendations", String(sc.ace_recommendations.length)));
    if (Array.isArray(sc.ai_mapping_hints)) summaryRows.push(row("Mapping Hints", String(sc.ai_mapping_hints.length)));

    /** @type {KeyValueRow[]} */
    const snapshotRows = buildSnapshotRows(doc, summaryRows, sc);

    /** @type {ExtractionSection[]} */
    const sections = [{ title: "Standardized Summary", kind: "kv", rows: summaryRows }];

    if (Array.isArray(sc.summary_lines) && sc.summary_lines.length) {
      sections.push({ title: "Document Summary Lines", kind: "list", items: sc.summary_lines.map(String) });
    }

    if (sc.service_record) sections.push({ title: "Service Record", kind: "kv", rows: objectToRows(sc.service_record) });
    if (sc.education_record) sections.push({ title: "Education Record", kind: "kv", rows: objectToRows(sc.education_record) });
    if (sc.evaluation_record) sections.push({ title: "Credential Evaluation", kind: "kv", rows: objectToRows(sc.evaluation_record) });
    if (sc.certificate_record) sections.push({ title: "Certificate Record", kind: "kv", rows: objectToRows(sc.certificate_record) });
    if (sc.gpa_summary) sections.push({ title: "GPA Summary", kind: "kv", rows: objectToRows(sc.gpa_summary) });
    if (sc.signature_block) sections.push({ title: "Signature Block", kind: "kv", rows: objectToRows(sc.signature_block) });
    if (sc.visual_profile) sections.push({ title: "Visual Profile (Upload Quality)", kind: "kv", rows: objectToRows(sc.visual_profile) });

    if (Array.isArray(sc.courses) && sc.courses.length) {
      sections.push({
        title: `Courses (${sc.courses.length})`,
        kind: "table",
        columns: ["Code", "Title", "Term", "Year", "Credits", "Grade", "Status", "Source"],
        tableRows: sc.courses.map((c) => [
          safe(c.course_code),
          safe(c.course_title),
          safe(c.term_label),
          safe(c.year),
          safe(c.credits),
          safe(c.grade),
          safe(c.status),
          safe(c.source_system),
        ]),
      });
    }

    if (Array.isArray(sc.ace_recommendations) && sc.ace_recommendations.length) {
      sections.push({
        title: `ACE Credit Recommendations (${sc.ace_recommendations.length})`,
        kind: "table",
        columns: ["Experience / Training", "Subject", "LL", "UL", "Basis"],
        tableRows: sc.ace_recommendations.map((r) => [
          safe(r.experience_or_training),
          safe(r.subject),
          safe(r.lower_division_credits),
          safe(r.upper_division_credits),
          safe(r.recommendation_basis),
        ]),
      });
    }

    if (Array.isArray(sc.scores) && sc.scores.length) {
      sections.push({
        title: `Scores (${sc.scores.length})`,
        kind: "table",
        columns: ["Test", "Section", "Score", "Scale", "Test Date"],
        tableRows: sc.scores.map((s) => [safe(s.test_name), safe(s.section), safe(s.score), safe(s.scale), safe(s.test_date)]),
      });
    }

    if (Array.isArray(sc.ai_mapping_hints) && sc.ai_mapping_hints.length) {
      sections.push({
        title: `AI Mapping Hints (${sc.ai_mapping_hints.length})`,
        kind: "table",
        columns: ["Source Evidence", "Course Code", "Course Title", "Credits", "Rationale"],
        tableRows: sc.ai_mapping_hints.map((m) => [
          safe(m.source_evidence),
          safe(m.proposed_college_course_code),
          safe(m.proposed_college_course_title),
          safe(m.credits),
          safe(m.rationale),
        ]),
      });
    }

    if (Array.isArray(sc.raw_text_preview) && sc.raw_text_preview.length) {
      sections.push({ title: "Raw Text Preview", kind: "code", text: sc.raw_text_preview.join("\n") });
    }

    if (Array.isArray(sc.notes) && sc.notes.length) {
      sections.push({ title: "Notes", kind: "list", items: sc.notes.map(String) });
    }

    if (sc.certificate_record?.skills?.length) {
      sections.push({ title: "Skills", kind: "badges", badges: sc.certificate_record.skills.map(String) });
    }

    return { summaryRows, snapshotRows, sections, raw: sc };
  }

  /** @param {DocumentModel} doc @param {KeyValueRow[]} summaryRows @param {any} sc */
  function buildSnapshotRows(doc, summaryRows, sc) {
    /** @type {KeyValueRow[]} */
    const rows = [];
    const push = (label, value) => {
      if (value === undefined || value === null || String(value).trim() === "") return;
      rows.push(row(label, String(value)));
    };

    push("Doc Type", DOC_TYPE_LABEL[doc.type] || doc.type);
    push("Issuer", doc.issuer);
    push("File", doc.basename);

    if (sc.service_record) {
      push("Branch", sc.service_record.branch);
      push("Service Component", sc.service_record.component);
      push("MOS", `${sc.service_record.mos_code || ""} ${sc.service_record.mos_title || ""}`.trim());
      push("Service Dates", `${sc.service_record.service_start || ""} → ${sc.service_record.service_end || ""}`);
      push("Character of Service", sc.service_record.character_of_service);
    }
    if (sc.education_record) {
      push("Institution", sc.education_record.institution_name);
      push("Attendance", `${sc.education_record.attendance_start || ""} → ${sc.education_record.attendance_end || ""}`);
      push("Credential Awarded", sc.education_record.credential_awarded);
      if (sc.education_record.gpa != null) push("Institution GPA", `${sc.education_record.gpa} / 4.0`);
    }
    if (sc.evaluation_record) {
      push("Evaluator", sc.evaluation_record.agency);
      push("U.S. Equivalency", sc.evaluation_record.us_equivalency);
      if (sc.evaluation_record.us_gpa != null) push("Converted GPA", `${sc.evaluation_record.us_gpa} / 4.0`);
      push("Reference #", sc.evaluation_record.reference_number);
    }
    if (sc.certificate_record) {
      push("Certificate", sc.certificate_record.certificate_name);
      push("Credential ID", sc.certificate_record.credential_id);
      push("Provider", sc.certificate_record.provider);
      push("Issue Date", sc.certificate_record.issue_date);
    }
    if (Array.isArray(sc.scores) && sc.scores.length) {
      const total = findToeflTotal(sc.scores);
      if (total) push("TOEFL Total", `${total.score} / 120`);
      for (const s of sc.scores) {
        if (String(s.section).toLowerCase() === "total") continue;
        push(`${s.section} Score`, `${s.score} (${s.scale})`);
      }
    }
    if (Array.isArray(sc.courses)) push("Course Rows Parsed", sc.courses.length);
    if (Array.isArray(sc.ace_recommendations)) push("ACE Recommendations", sc.ace_recommendations.length);
    if (Array.isArray(sc.ai_mapping_hints)) push("Pathway Hints", sc.ai_mapping_hints.length);

    if (!rows.length) return summaryRows.slice(0, 8);
    return rows.slice(0, 12);
  }

  /** @param {string} field @param {string} value */
  function row(field, value) {
    return { field, value };
  }

  /** @param {any} scores */
  function findToeflTotal(scores) {
    if (!Array.isArray(scores)) return null;
    return scores.find((s) => String(s.section).toLowerCase() === "total") || null;
  }

  /** @param {any} obj @returns {KeyValueRow[]} */
  function objectToRows(obj) {
    return Object.entries(obj)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => row(humanizeKey(key), formatValue(value)));
  }

  /** @param {string} key */
  function humanizeKey(key) {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase())
      .replace(/Us /g, "U.S. ");
  }

  /** @param {any} value */
  function formatValue(value) {
    if (value === null) return "—";
    if (Array.isArray(value)) return value.map(formatValue).join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  /** @param {number|string} n */
  function safe(n) {
    return n == null ? "" : String(n);
  }

  /** @param {number} credits */
  function formatCredits(credits) {
    return `${Number(credits || 0).toFixed(credits % 1 ? 1 : 0)} cr`;
  }

  /** @param {{ applicant: ApplicantModel, doc: DocumentModel, mode: 'preview'|'task-detail' }} args */
  async function openFileModal(args) {
    state.currentPreviewTarget = args;
    refs.fileModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    const { applicant, doc, mode } = args;
    refs.fileModalEyebrow.textContent = mode === "task-detail" ? "Completed Task Evidence Review" : "File Preview";
    refs.fileModalTitle.textContent = doc.basename;
    refs.fileModalMeta.textContent = `${DOC_TYPE_LABEL[doc.type] || doc.type} • ${applicant.persona.full_name} • ${doc.format.toUpperCase()} • ${doc.issuer}`;
    refs.fileModalOpenLink.href = doc.path;
    refs.fileDetailTitle.textContent = mode === "task-detail" ? "Complete AI Extraction (Advisor Review)" : "Document Snapshot";
    refs.fileDetailSubtitle.textContent = mode === "task-detail"
      ? "Full extracted fields, tables, and raw structured output used to build the pathway."
      : "Quick standardized summary of what the AI can extract from this file.";

    refs.filePreviewContainer.classList.add("loading");
    refs.filePreviewContainer.innerHTML = '<div class="loading-sheen"></div>';
    refs.fileDetailContent.innerHTML = renderFileDetail(doc, mode);

    await mountPreview(refs.filePreviewContainer, doc, { fullText: mode === "task-detail" });
  }

  function closeFileModal() {
    refs.fileModal.classList.add("hidden");
    refs.filePreviewContainer.innerHTML = '<div class="loading-sheen"></div>';
    if (refs.analyzerModal.classList.contains("hidden")) {
      document.body.style.overflow = "";
    }
  }

  /** @param {DocumentModel} doc @param {'preview'|'task-detail'} mode */
  function renderFileDetail(doc, mode) {
    const extraction = doc.extraction;
    const sections = mode === "task-detail" ? extraction.sections : extraction.sections.slice(0, 3);

    let html = "";
    html += `<section class="detail-card">`;
    html += `<h4>Advisor Snapshot</h4>`;
    html += renderKvGrid(extraction.snapshotRows);
    html += `</section>`;

    if (doc.gemimgPrompt && mode === "task-detail") {
      html += `<section class="detail-card"><h4>Image Generation Prompt (Gemimg)</h4><p>${escapeHtml(doc.gemimgPrompt)}</p></section>`;
    }

    for (const section of sections) {
      html += `<section class="detail-card">`;
      html += `<h4>${escapeHtml(section.title)}</h4>`;
      html += renderSectionBody(section);
      html += `</section>`;
    }

    if (mode === "task-detail") {
      html += `<section class="detail-card"><h4>Raw Structured Output (JSON)</h4><pre class="detail-json">${escapeHtml(JSON.stringify(extraction.raw, null, 2))}</pre></section>`;
    } else {
      html += `<section class="detail-card"><h4>Why this matters</h4><p>This file is one input into the folder-level Credit Check. Click <strong>Credit Check</strong> on the applicant card to watch the AI process all uploaded files and combine credits into one pathway.</p></section>`;
    }

    return html;
  }

  /** @param {KeyValueRow[]} rows */
  function renderKvGrid(rows) {
    return `
      <dl class="kv-grid">
        ${rows.map((r) => `<dt>${escapeHtml(r.field)}</dt><dd>${escapeHtml(r.value)}</dd>`).join("")}
      </dl>
    `;
  }

  /** @param {ExtractionSection} section */
  function renderSectionBody(section) {
    switch (section.kind) {
      case "kv":
        return renderKvGrid(section.rows || []);
      case "table":
        return `
          <div class="table-scroll">
            <table class="data-table">
              <thead><tr>${(section.columns || []).map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
              <tbody>${(section.tableRows || [])
                .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
                .join("")}</tbody>
            </table>
          </div>
        `;
      case "list":
        return `<ul class="bullet-list">${(section.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      case "code":
        return `<pre class="detail-json">${escapeHtml(section.text || "")}</pre>`;
      case "badges":
        return `<div class="inline-badges">${(section.badges || []).map((b) => `<span class="inline-badge">${escapeHtml(b)}</span>`).join("")}</div>`;
      default:
        return "";
    }
  }

  /** @param {HTMLElement} container @param {DocumentModel} doc @param {{ fullText?: boolean }} options */
  async function mountPreview(container, doc, options = {}) {
    container.classList.remove("empty-state");
    container.classList.remove("loading");
    container.innerHTML = "";
    const frame = document.createElement("div");
    frame.className = "preview-frame";

    if (doc.format === "webp") {
      const img = document.createElement("img");
      img.alt = `${doc.basename} preview`;
      img.loading = "lazy";
      img.src = doc.path;
      frame.append(img);
      container.append(frame);
      return;
    }

    if (doc.format === "pdf") {
      const iframe = document.createElement("iframe");
      iframe.title = `${doc.basename} PDF preview`;
      iframe.src = `${doc.path}#toolbar=0&navpanes=0&scrollbar=1`;
      frame.append(iframe);
      container.append(frame);
      return;
    }

    const pre = document.createElement("pre");
    pre.className = "text-preview";
    pre.textContent = "Loading text preview…";
    frame.append(pre);
    container.append(frame);

    try {
      const text = await loadTextFile(doc.path);
      pre.textContent = options.fullText ? text : truncateText(text, 4500);
    } catch (error) {
      pre.textContent = `Unable to load text preview.\n${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /** @param {string} path */
  async function loadTextFile(path) {
    if (state.textCache.has(path)) return state.textCache.get(path);
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    const text = await res.text();
    state.textCache.set(path, text);
    return text;
  }

  /** @param {string} text @param {number} maxLen */
  function truncateText(text, maxLen) {
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen)}\n\n… [truncated for preview]`;
  }

  /** @param {ApplicantModel} applicant */
  function startAnalyzer(applicant) {
    const token = state.analyzer.token + 1;
    state.analyzer = {
      open: true,
      applicant,
      tasks: applicant.documents.map((doc) => ({ id: doc.id, status: "pending", doc, thoughtText: "", snapshotRows: [] })),
      currentTaskId: null,
      running: true,
      token,
      thoughtText: "",
      currentSnapshotRows: [],
      currentDoc: null,
      finalReady: false,
      finalNarrativeText: "",
      completionCount: 0,
    };

    refs.analyzerModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    refs.analysisStage.classList.remove("final-only");
    refs.stageFrame.classList.remove("hidden");
    refs.finalPathwayPanel.classList.add("hidden");
    refs.finalPathwayPanel.innerHTML = "";
    refs.thoughtStream.innerHTML = "";
    refs.extractedWrap.classList.add("empty-state", "compact");
    refs.extractedWrap.innerHTML = "<p>Preparing folder analysis…</p>";
    refs.extractedStatus.textContent = "Preparing analysis queue…";
    refs.livePreviewShell.classList.remove("scanning");
    refs.openCurrentFileBtn.classList.add("hidden");
    refs.currentFileName.textContent = "Preparing tasks…";

    renderAnalyzerHeader();
    renderTaskList();
    void runAnalyzerSequence(token);
  }

  function closeAnalyzer() {
    if (!state.analyzer.open) return;
    state.analyzer.token += 1;
    state.analyzer.running = false;
    state.analyzer.open = false;
    refs.analyzerModal.classList.add("hidden");
    refs.livePreviewShell.classList.remove("scanning");
    if (refs.fileModal.classList.contains("hidden")) {
      document.body.style.overflow = "";
    }
  }

  function renderAnalyzerHeader() {
    const analyzer = state.analyzer;
    const applicant = analyzer.applicant;
    if (!applicant) return;
    refs.analyzerTitle.textContent = `Credit Check • ${applicant.persona.full_name}`;
    refs.analyzerSubtitle.textContent = `${applicant.archetypeLabel} • ${applicant.documents.length} uploaded files • ${applicant.targetProgram}`;
    updateAnalyzerProgress();
  }

  function updateAnalyzerProgress() {
    const analyzer = state.analyzer;
    if (!analyzer.applicant) return;
    const total = analyzer.tasks.length;
    const complete = analyzer.tasks.filter((t) => t.status === "complete").length;
    const current = analyzer.tasks.find((t) => t.status === "current");
    const percent = total ? Math.round((complete / total) * 100) : 0;
    refs.taskSummary.textContent = `${complete}/${total} files completed`;
    refs.taskProgressFill.style.width = `${percent}%`;

    if (analyzer.finalReady) {
      refs.progressPill.textContent = "Pathway Ready";
      refs.progressPill.style.background = "rgba(13, 122, 113, 0.14)";
      refs.progressPill.style.color = "#0a635b";
      return;
    }
    if (current) {
      refs.progressPill.textContent = `Analyzing ${complete + 1}/${total}`;
      refs.progressPill.style.background = "rgba(191, 143, 25, 0.14)";
      refs.progressPill.style.color = "#6f5310";
      return;
    }
    refs.progressPill.textContent = analyzer.running ? "Queueing" : "Ready";
    refs.progressPill.style.background = "rgba(13, 122, 113, 0.12)";
    refs.progressPill.style.color = "#085f57";
  }

  function renderTaskList() {
    const analyzer = state.analyzer;
    refs.taskList.innerHTML = analyzer.tasks
      .map((task) => {
        const doc = task.doc;
        const clickable = task.status === "complete";
        const statusLabel = task.status === "complete" ? "complete" : task.status === "current" ? "running" : task.status;
        return `
          <li class="task-item ${task.status} ${clickable ? "clickable" : ""}" data-task-id="${escapeHtml(task.id)}" tabindex="${clickable ? "0" : "-1"}">
            <div class="task-top">
              <span class="task-status-dot ${task.status}"></span>
              <span class="task-name">${escapeHtml(doc.basename)}</span>
              <span class="task-state-label">${escapeHtml(statusLabel)}</span>
            </div>
            <div class="task-meta">
              <span class="format-chip ${escapeHtml(doc.format)}">${escapeHtml(doc.format)}</span>
              <span>${escapeHtml(DOC_TYPE_LABEL[doc.type] || doc.type)}</span>
            </div>
            ${clickable ? '<div class="task-open-hint">Click to inspect full extraction + source preview</div>' : ""}
          </li>
        `;
      })
      .join("");
    updateAnalyzerProgress();
  }

  /** @param {number} token */
  async function runAnalyzerSequence(token) {
    const analyzer = state.analyzer;
    const applicant = analyzer.applicant;
    if (!applicant) return;

    for (const task of analyzer.tasks) {
      if (!isAnalyzerTokenActive(token)) return;
      await analyzeTask(task, applicant, token);
      if (!isAnalyzerTokenActive(token)) return;
    }

    state.analyzer.running = false;
    state.analyzer.currentTaskId = null;
    state.analyzer.currentDoc = null;
    state.analyzer.finalReady = true;
    refs.livePreviewShell.classList.remove("scanning");
    refs.extractedStatus.textContent = "Folder analysis complete";
    refs.currentFileName.textContent = "Unified pathway ready";
    refs.openCurrentFileBtn.classList.add("hidden");
    refs.stageFrame.classList.add("hidden");
    refs.analysisStage.classList.add("final-only");
    renderTaskList();
    renderFinalPathway(applicant);
    await streamNarrative(applicant.expected?.Narrative || "Unified degree pathway prepared.", token);
  }

  /** @param {AnalysisTask} task @param {ApplicantModel} applicant @param {number} token */
  async function analyzeTask(task, applicant, token) {
    for (const t of state.analyzer.tasks) {
      if (t.id === task.id) t.status = "current";
      else if (t.status === "current") t.status = "pending";
    }

    state.analyzer.currentTaskId = task.id;
    state.analyzer.currentDoc = task.doc;
    state.analyzer.thoughtText = "";
    state.analyzer.currentSnapshotRows = [];
    refs.extractedWrap.classList.remove("empty-state");
    refs.extractedWrap.classList.add("compact");
    refs.extractedWrap.innerHTML = "";
    refs.extractedStatus.textContent = "Extracting fields…";
    refs.currentFileName.textContent = task.doc.basename;
    refs.openCurrentFileBtn.classList.remove("hidden");
    refs.livePreviewShell.classList.add("scanning");
    renderTaskList();
    renderThoughtStream();
    await mountPreview(refs.livePreview, task.doc, { fullText: false });

    const thoughts = task.doc.thought;
    await streamWords(thoughts, (partial) => {
      state.analyzer.thoughtText = partial;
      renderThoughtStream();
    }, token, { minDelay: 20, maxDelay: 48 });

    if (!isAnalyzerTokenActive(token)) return;
    task.thoughtText = thoughts;
    task.snapshotRows = task.doc.extraction.snapshotRows;
    state.analyzer.currentSnapshotRows = task.snapshotRows;
    refs.extractedStatus.textContent = "Standardized extraction complete";
    renderExtractedSnapshot(task.doc);
    await delayWithToken(380, token);

    if (!isAnalyzerTokenActive(token)) return;
    task.status = "complete";
    state.analyzer.completionCount = state.analyzer.tasks.filter((t) => t.status === "complete").length;
    renderTaskList();
  }

  function renderThoughtStream() {
    const text = state.analyzer.thoughtText || "";
    refs.thoughtStream.innerHTML = `${escapeHtml(text)}<span class="cursor">▍</span>`;
    refs.thoughtStream.scrollTop = refs.thoughtStream.scrollHeight;
  }

  /** @param {DocumentModel} doc */
  function renderExtractedSnapshot(doc) {
    const rows = state.analyzer.currentSnapshotRows || doc.extraction.snapshotRows;
    if (!rows.length) {
      refs.extractedWrap.classList.add("empty-state");
      refs.extractedWrap.innerHTML = "<p>No fields extracted.</p>";
      return;
    }
    refs.extractedWrap.classList.remove("empty-state");
    refs.extractedWrap.innerHTML = `
      <table class="std-table">
        <tbody>
          ${rows.map((r) => `<tr><th>${escapeHtml(r.field)}</th><td>${escapeHtml(r.value)}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  /** @param {ApplicantModel} applicant */
  function renderFinalPathway(applicant) {
    const expected = applicant.expected || {};
    const totalCredits = Number(expected.Proposed_Transfer_Credits_Total || 0);
    const degreeCredits = 120;
    const percent = Math.max(0, Math.min(100, (totalCredits / degreeCredits) * 100));
    const remaining = Math.max(0, degreeCredits - totalCredits);
    const mappedCourses = Array.isArray(expected.Mapped_Courses) ? expected.Mapped_Courses : [];

    refs.finalPathwayPanel.classList.remove("hidden");
    refs.finalPathwayPanel.innerHTML = `
      <div class="pathway-header">
        <div>
          <p class="eyebrow">Unified Degree Pathway</p>
          <h3>${escapeHtml(expected.Target_Pathway || applicant.targetProgram)}</h3>
          <p>${escapeHtml(expected.Pathway_Theme || "AI-combined transfer credit pathway")}</p>
        </div>
        <div>
          <div class="pathway-metrics">
            <div class="pathway-metric"><div class="label">Proposed Transfer</div><div class="value">${escapeHtml(formatCredits(totalCredits))}</div></div>
            <div class="pathway-metric"><div class="label">Mapped Items</div><div class="value">${escapeHtml(String(mappedCourses.length))}</div></div>
            <div class="pathway-metric"><div class="label">Admissions Term</div><div class="value">${escapeHtml(applicant.admissionsTerm)}</div></div>
            <div class="pathway-metric"><div class="label">Remaining (demo 120 cr)</div><div class="value">${escapeHtml(formatCredits(remaining))}</div></div>
          </div>
          <div class="credit-gauge">
            <div class="gauge-track"><div class="gauge-fill" style="width:${percent.toFixed(1)}%"></div></div>
            <div class="gauge-label">${escapeHtml(percent.toFixed(1))}% of a 120-credit degree visible from uploaded evidence (demo assumption)</div>
          </div>
        </div>
      </div>
      <div class="pathway-layout">
        <section class="pathway-ledger">
          <h4>Credit Mapping Ledger</h4>
          <div class="pathway-rows">
            ${mappedCourses.map((m) => renderPathwayRow(m, applicant)).join("")}
          </div>
        </section>
        <aside class="pathway-sidecar">
          <section>
            <h4>Advisor Review Focus</h4>
            <ul class="bullet-list">${(expected.Advisor_Review_Focus || []).map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>
          </section>
          <section>
            <h4>Remaining Admissions Checks</h4>
            <ul class="bullet-list">${(expected.Remaining_Admissions_Checks || []).map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>
          </section>
          <section>
            <h4>AI Final Narrative</h4>
            <div id="pathway-narrative-stream" class="narrative-stream"></div>
          </section>
        </aside>
      </div>
    `;
  }

  /** @param {any} mapping @param {ApplicantModel} applicant */
  function renderPathwayRow(mapping, applicant) {
    const evidenceFile = inferEvidenceFile(mapping.source_evidence, applicant.documents);
    return `
      <div class="pathway-row">
        <div class="source-pill" title="${escapeHtml(String(mapping.source_evidence || ""))}">
          <span class="label">Source Evidence${evidenceFile ? ` • ${escapeHtml(evidenceFile.format.toUpperCase())}` : ""}</span>
          <span class="value">${escapeHtml(String(mapping.source_evidence || ""))}</span>
        </div>
        <div class="arrow-knot">→</div>
        <div class="course-pill">
          <span class="course-code">${escapeHtml(String(mapping.proposed_college_course_code || ""))}</span>
          <span class="course-title">${escapeHtml(String(mapping.proposed_college_course_title || ""))}</span>
        </div>
        <div class="credit-chip">${escapeHtml(formatCredits(Number(mapping.credits || 0)))}</div>
      </div>
    `;
  }

  /** @param {string} sourceEvidence @param {DocumentModel[]} docs */
  function inferEvidenceFile(sourceEvidence, docs) {
    const s = String(sourceEvidence || "").toLowerCase();
    const candidates = [
      ["jst", (d) => d.type === "JST"],
      ["mos", (d) => d.type === "JST" || d.type === "DD214"],
      ["ace", (d) => d.type === "JST"],
      ["security+", (d) => d.type === "CompTIA_SecurityPlus_Certificate"],
      ["comptia", (d) => d.type === "CompTIA_SecurityPlus_Certificate"],
      ["google", (d) => d.type === "Google_Project_Management_Certificate"],
      ["sophia", (d) => d.type === "Sophia_Learning_Transcript"],
      ["toefl", (d) => d.type === "TOEFL_Score_Report"],
      ["wes", (d) => d.type === "WES_Course_By_Course_Evaluation"],
      ["ece", (d) => d.type === "ECE_Course_By_Course_Evaluation"],
      ["psy101", (d) => d.type === "Community_College_Transcript"],
      ["community college", (d) => d.type === "Community_College_Transcript"],
      ["evaluation", (d) => d.type.includes("Evaluation")],
    ];
    for (const [needle, matchFn] of candidates) {
      if (s.includes(needle)) {
        const doc = docs.find(matchFn);
        if (doc) return doc;
      }
    }
    return docs[0] || null;
  }

  /** @param {string} narrative @param {number} token */
  async function streamNarrative(narrative, token) {
    const el = /** @type {HTMLElement | null} */ ($("#pathway-narrative-stream", refs.finalPathwayPanel));
    if (!el) return;
    el.textContent = "";
    await streamWords(narrative, (partial) => {
      if (!isAnalyzerTokenActive(token)) return;
      state.analyzer.finalNarrativeText = partial;
      el.textContent = partial;
    }, token, { minDelay: 18, maxDelay: 34 });
  }

  /** @param {string} text @param {(partial: string) => void} onUpdate @param {number} token @param {{minDelay?:number,maxDelay?:number}} options */
  async function streamWords(text, onUpdate, token, options = {}) {
    const words = text.trim().split(/\s+/);
    let partial = "";
    const minDelay = options.minDelay ?? 24;
    const maxDelay = options.maxDelay ?? 44;

    for (let i = 0; i < words.length; i += 1) {
      if (!isAnalyzerTokenActive(token)) return;
      partial += (i ? " " : "") + words[i];
      onUpdate(partial);
      const delayMs = computeWordDelay(words[i], minDelay, maxDelay);
      await delayWithToken(delayMs, token);
    }
  }

  /** @param {string} word @param {number} minDelay @param {number} maxDelay */
  function computeWordDelay(word, minDelay, maxDelay) {
    let ms = Math.round(minDelay + Math.random() * (maxDelay - minDelay));
    if (/[,:]/.test(word)) ms += 70;
    if (/[.!?]/.test(word)) ms += 120;
    return Math.round(ms * STREAM_SLOWDOWN);
  }

  /** @param {number} ms @param {number} token */
  function delayWithToken(ms, token) {
    return new Promise((resolve) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        resolve(undefined);
      }, ms);
    }).then(() => {
      if (!isAnalyzerTokenActive(token)) return;
    });
  }

  /** @param {number} token */
  function isAnalyzerTokenActive(token) {
    return state.analyzer.open && state.analyzer.token === token;
  }

  /** @param {string} value */
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** @param {string} value */
  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();

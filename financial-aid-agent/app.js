
const liveStreamsEl = document.getElementById('live-streams');
const pastStreamsEl = document.getElementById('past-streams');
const liveCountEl = document.getElementById('live-count');
const agentsRange = document.getElementById('agents-range');
const agentsValue = document.getElementById('agents-value');
const filterStatus = document.getElementById('filter-status');
const filterLanguage = document.getElementById('filter-language');
const filterAttachments = document.getElementById('filter-attachments');
const filterCompletion = document.getElementById('filter-completion');
const filterRecency = document.getElementById('filter-recency');
const metricCompleted = document.getElementById('metric-completed');
const metricAid = document.getElementById('metric-aid');
const metricMix = document.getElementById('metric-mix');
const metricRate = document.getElementById('metric-rate');
const metricPending = document.getElementById('metric-pending');

const detailEyebrow = document.getElementById('detail-eyebrow');
const detailTitle = document.getElementById('detail-title');
const detailSubtitle = document.getElementById('detail-subtitle');
const detailMessages = document.getElementById('detail-messages');
const detailFormBody = document.getElementById('detail-form-body');
const detailFormSubtitle = document.getElementById('detail-form-subtitle');
const formProgressCount = document.getElementById('form-progress-count');
const formProgressPercent = document.getElementById('form-progress-percent');
const formProgressFill = document.getElementById('form-progress-fill');
const formStageBar = document.getElementById('form-stage-bar');
const formStagePreview = document.getElementById('form-stage-preview');
const detailReasoning = document.getElementById('detail-reasoning');
const detailTimeline = document.getElementById('detail-timeline');
const transcriptionStatus = document.getElementById('transcriptionStatus');
const transcriptionLog = document.getElementById('transcription-log');
const autoDocsEl = document.getElementById('auto-docs');
const detailModal = document.getElementById('detail-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalPanel = document.getElementById('detail-panel');
const modalBody = document.querySelector('#detail-panel .panel-body');
const jumpButtons = document.querySelectorAll('[data-jump]');
const rationaleSection = document.getElementById('rationale-section');
const sourcesSection = document.getElementById('sources-section');
const attachmentModal = document.getElementById('attachment-modal');
const attachmentBackdrop = document.getElementById('attachment-backdrop');
const attachmentClose = document.getElementById('attachment-close');
const attachmentTitle = document.getElementById('attachment-title');
const attachmentFrame = document.getElementById('attachment-frame');
const attachmentText = document.getElementById('attachment-text');
const impactStudents = document.getElementById('impact-students');
const impactTime = document.getElementById('impact-time');
const impactCompletion = document.getElementById('impact-completion');
const impactHours = document.getElementById('impact-hours');
const impactCost = document.getElementById('impact-cost');
const impactErrors = document.getElementById('impact-errors');
const impactAidVolume = document.getElementById('impact-aid-volume');
const impactGrantMix = document.getElementById('impact-grant-mix');
const impactRefunds = document.getElementById('impact-refunds');
const impactTitle = document.getElementById('impact-title');
const impactAudit = document.getElementById('impact-audit');
const impactReporting = document.getElementById('impact-reporting');
const impactIntakes = document.getElementById('impact-intakes');
const impactAutofill = document.getElementById('impact-autofill');
const impactDocs = document.getElementById('impact-docs');
const impactAidUnlocked = document.getElementById('impact-aid-unlocked');
const impactDropoff = document.getElementById('impact-dropoff');
const impactCompliance = document.getElementById('impact-compliance');

const lockState = { active: false, conversationId: null };
const lastAuto = { conversationId: null, messageIndex: 0 };
let lastImpactChartRender = 0;

const FIELD_LABELS = [
  { key: 'name', label: 'Student Name' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'age', label: 'Age' },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'dependencyStatus', label: 'Dependency Status' },
  { key: 'veteran', label: 'Veteran Status' },
  { key: 'enrollmentStatus', label: 'Enrollment Status' },
  { key: 'institution', label: 'Institution' },
  { key: 'gpa', label: 'GPA' },
  { key: 'sai', label: 'Student Aid Index (SAI)' },
  { key: 'income', label: 'Household Income' },
  { key: 'recommendedBanks', label: 'Recommended Banks' },
  { key: 'missingDocs', label: 'Missing Documents' },
  { key: 'status', label: 'Form Status' }
];

const STUDENT_TYPES = [
  'First-time Undergrad',
  'Transfer Student',
  'Working Adult',
  'Veteran Student',
  'International Evaluation',
  'Graduate Applicant'
];

const FIRST_NAMES = [
  'Ava', 'Noah', 'Liam', 'Sophia', 'Ethan', 'Maya', 'Isabella', 'Lucas', 'Olivia', 'Elijah',
  'Chloe', 'Daniel', 'Grace', 'Henry', 'Nora', 'Caleb', 'Zoe', 'Julian', 'Amara', 'Mateo',
  'Ivy', 'Miles', 'Aria', 'Leo', 'Hazel', 'Jaxon', 'Keira', 'Logan', 'Camila', 'Rafael'
];

const LAST_NAMES = [
  'Carter', 'Brooks', 'Nguyen', 'Patel', 'Kim', 'Johnson', 'Rivera', 'Chen', 'Bennett', 'Gomez',
  'Martinez', 'Wright', 'Lee', 'Scott', 'Adams', 'Singh', 'Clark', 'Perez', 'Davis', 'Alvarez',
  'Baker', 'Cooper', 'Flores', 'Morris', 'Hernandez', 'Reed', 'Hughes', 'Lopez', 'Diaz', 'Howard'
];

const UNIQUE_NAMES = generateUniqueNames(120);

const SAMPLE_DOCS = [
  {
    id: 'fafsa-01',
    label: 'FAFSA Submission Summary (Ava Carter)',
    file: 'demo-docs/fafsa-summary-01.txt',
    previewFile: 'demo-docs/financial-aid-form.pdf',
    type: 'fafsa',
    rawText: `FAFSA Submission Summary (Demo)\nStudent Name: Ava Carter\nStudent Aid Index (SAI): -620\nDependency Status: Independent\nEnrollment Status: Full-time\nInstitution: SNHU`,
    data: {
      name: 'Ava Carter',
      sai: -620,
      dependencyStatus: 'Independent',
      enrollmentStatus: 'Full-time',
      institution: 'SNHU'
    }
  },
  {
    id: 'fafsa-02',
    label: 'FAFSA Submission Summary (Liam Nguyen)',
    file: 'demo-docs/fafsa-summary-02.txt',
    previewFile: 'demo-docs/financial-aid-form.pdf',
    type: 'fafsa',
    rawText: `FAFSA Submission Summary (Demo)\nStudent Name: Liam Nguyen\nSAI: 1450\nDependency Status: Dependent\nEnrollment Status: Half-time\nInstitution: Metro State`,
    data: {
      name: 'Liam Nguyen',
      sai: 1450,
      dependencyStatus: 'Dependent',
      enrollmentStatus: 'Half-time',
      institution: 'Metro State'
    }
  },
  {
    id: 'transcript-01',
    label: 'Transcript (Ava Carter)',
    file: 'demo-docs/transcript.txt',
    previewFile: 'demo-docs/transcript.pdf',
    type: 'transcript',
    rawText: `SNHU Transcript (Demo)\nStudent Name: Ava Carter\nEnrollment Status: Full-time\nInstitution: SNHU\nGPA: 3.42\nCredits: 54`,
    data: {
      name: 'Ava Carter',
      gpa: 3.42,
      enrollmentStatus: 'Full-time',
      institution: 'SNHU'
    }
  },
  {
    id: 'transcript-02',
    label: 'Transcript (Liam Nguyen)',
    file: 'demo-docs/transcript-02.txt',
    previewFile: 'demo-docs/transcript.pdf',
    type: 'transcript',
    rawText: `Metro State Transcript (Demo)\nStudent Name: Liam Nguyen\nEnrollment Status: Half-time\nInstitution: Metro State\nGPA: 3.78\nCredits: 36`,
    data: {
      name: 'Liam Nguyen',
      gpa: 3.78,
      enrollmentStatus: 'Half-time',
      institution: 'Metro State'
    }
  },
  {
    id: 'tax-01',
    label: 'IRS 1040 Summary',
    file: 'demo-docs/tax-document.txt',
    previewFile: 'demo-docs/tax-document.pdf',
    type: 'tax',
    rawText: `IRS 1040 Summary (Demo)\nTax Year: 2025\nAdjusted Gross Income: 28450\nHousehold Income: 28450\nFiling Status: Single`,
    data: {
      income: 28450
    }
  },
  {
    id: 'dd214-01',
    label: 'DD-214',
    file: 'demo-docs/dd214.txt',
    previewFile: 'demo-docs/dd214.pdf',
    type: 'military',
    rawText: `DD-214 (Demo)\nBranch: U.S. Navy\nService Years: 6\nDischarge: Honorable\nVeteran: Yes`,
    data: {
      veteran: 'Yes'
    }
  }
];

const FAFSA_DOCS = SAMPLE_DOCS.filter((doc) => doc.type === 'fafsa');
const TRANSCRIPT_DOCS = SAMPLE_DOCS.filter((doc) => doc.type === 'transcript');
const TAX_DOCS = SAMPLE_DOCS.filter((doc) => doc.type === 'tax');
const VETERAN_DOCS = SAMPLE_DOCS.filter((doc) => doc.type === 'military');

const conversationMap = new Map();
const liveRows = [];
const pastRows = [];
let activeConversationId = null;
let agentsCount = parseInt(agentsRange?.value || '3', 10);
let maxLiveRows = 18 + agentsCount * 2;
let transcriptAutoScroll = true;

const metrics = {
  completed: 0,
  completedComplete: 0,
  completedIncomplete: 0,
  totalAid: 0,
  typeCounts: {}
};

const TIMING = {
  studentBase: 1500,
  agentBase: 2400,
  perWordStudent: 110,
  perWordAgent: 170,
  jitter: 900,
  pauseAfter: 1100
};

const STANDARD_GREETING = {
  en: 'Hi, I am Penny. I can complete your financial aid form, extract documents, and explain why each question matters. Share your school and any documents you already have to begin.',
  es: 'Hola, soy Penny. Puedo completar tu formulario de ayuda financiera, extraer documentos y explicar por que cada pregunta importa. Comparte tu escuela y los documentos que tengas para empezar.',
  pt: 'Oi, sou a Penny. Posso completar seu formulario de ajuda financeira, extrair documentos e explicar por que cada pergunta importa. Compartilhe sua escola e os documentos que tiver para comecar.'
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateUniqueNames(count) {
  const combos = [];
  FIRST_NAMES.forEach((first) => {
    LAST_NAMES.forEach((last) => {
      combos.push(`${first} ${last}`);
    });
  });
  const shuffled = shuffleArray(combos);
  if (shuffled.length >= count) return shuffled.slice(0, count);
  return shuffled;
}

function formatCurrency(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

let hoverTooltip = null;

function ensureHoverTooltip() {
  if (hoverTooltip) return hoverTooltip;
  const existing = document.getElementById('hover-tooltip');
  if (existing) {
    hoverTooltip = existing;
    return hoverTooltip;
  }
  hoverTooltip = document.createElement('div');
  hoverTooltip.id = 'hover-tooltip';
  hoverTooltip.className = 'hover-tooltip';
  document.body.appendChild(hoverTooltip);
  return hoverTooltip;
}

function positionHoverTooltipAt(x, y) {
  const tooltip = ensureHoverTooltip();
  const padding = 12;
  const rect = tooltip.getBoundingClientRect();
  let left = x + 14;
  let top = y + 14;

  if (left + rect.width > window.innerWidth - padding) {
    left = x - rect.width - 14;
  }
  if (left < padding) left = padding;

  if (top + rect.height > window.innerHeight - padding) {
    top = y - rect.height - 14;
  }
  if (top < padding) top = padding;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function showHoverTooltip(html, x, y) {
  const tooltip = ensureHoverTooltip();
  tooltip.innerHTML = html;
  tooltip.classList.add('visible');
  positionHoverTooltipAt(x, y);
}

function hideHoverTooltip() {
  if (!hoverTooltip) return;
  hoverTooltip.classList.remove('visible');
}

function t(lang, en, es, pt) {
  if (lang === 'es') return es;
  if (lang === 'pt') return pt || en;
  return en;
}

function makeMessyText(text) {
  const tweaks = [
    (s) => s.replace('your', 'ur'),
    (s) => s.replace('please', 'pls'),
    (s) => s.replace('and', '&'),
    (s) => s.replace('because', 'bc'),
    (s) => s.replace('I am', "I'm"),
    (s) => s.replace('financial', 'fin aid'),
    (s) => s.replace('cannot', "can't"),
    (s) => s.replace('with', 'w/'),
    (s) => s.replace('about', 'abt'),
    (s) => s.replace('document', 'doc')
  ];
  let result = text;
  const count = randomInt(1, 3);
  for (let i = 0; i < count; i += 1) {
    result = tweaks[randomInt(0, tweaks.length - 1)](result);
  }
  return result;
}

function studentIntroText(name, institution, lang) {
  if (lang === 'pt') {
    return `Oi, sou ${name}. Preciso de ajuda com ajuda financeira para ${institution}.`;
  }
  const templates = [
    `hi im ${name} need help w/ aid for ${institution}`,
    `hey, ${name} here. trying to finish fin aid for ${institution}`,
    `yo i'm ${name}... can u help w financial aid for ${institution}?`,
    `Hi, I'm ${name}. I'm trying to finish my financial aid for ${institution}.`
  ];
  const base = templates[randomInt(0, templates.length - 1)];
  return Math.random() > 0.5 ? makeMessyText(base) : base;
}

function studentProvideBasics(name, dob, enrollmentStatus, lang) {
  const english = `Name ${name}. DOB ${dob}. Enrollment ${enrollmentStatus}.`;
  const spanish = `Nombre ${name}. Nacimiento ${dob}. Inscripcion ${enrollmentStatus}.`;
  const portuguese = `Nome ${name}. Nascimento ${dob}. Matricula ${enrollmentStatus}.`;
  const base = lang === 'es' ? spanish : (lang === 'pt' ? portuguese : english);
  return Math.random() > 0.5 ? makeMessyText(base) : base;
}

function studentDependencyText(dependencyStatus, maritalStatus, veteranStatus, lang) {
  const english = `I'm ${dependencyStatus}, ${maritalStatus}. Military: ${veteranStatus === 'Yes' ? 'Yes' : 'No'}.`;
  const spanish = `Soy ${dependencyStatus}, ${maritalStatus}. Militar: ${veteranStatus === 'Yes' ? 'Si' : 'No'}.`;
  const portuguese = `Sou ${dependencyStatus}, ${maritalStatus}. Militar: ${veteranStatus === 'Yes' ? 'Sim' : 'Nao'}.`;
  const base = lang === 'es' ? spanish : (lang === 'pt' ? portuguese : english);
  return Math.random() > 0.5 ? makeMessyText(base) : base;
}

function studentShareDocText(label, lang) {
  const english = `Sharing ${label}.`;
  const spanish = `Compartiendo ${label}.`;
  const portuguese = `Enviando ${label}.`;
  const base = lang === 'es' ? spanish : (lang === 'pt' ? portuguese : english);
  return Math.random() > 0.5 ? makeMessyText(base) : base;
}

function recommendBanks({ veteran, income, dependencyStatus }) {
  if (veteran === 'Yes') {
    return 'Navy Federal Credit Union, USAA, PenFed';
  }
  if (income && income < 30000) {
    return 'Local Credit Union, Capital One 360, Ally Bank';
  }
  if (dependencyStatus === 'Dependent') {
    return 'Chase College Checking, Capital One 360, Ally Bank';
  }
  return 'Ally Bank, Capital One 360, Local Credit Union';
}

function applyDeltaToSnapshots(conversation, startIndex, delta) {
  if (!delta || !Object.keys(delta).length) return;
  for (let i = startIndex; i < conversation.snapshots.length; i += 1) {
    conversation.snapshots[i] = { ...conversation.snapshots[i], ...delta };
  }
}

function updateDocLine(text, label, value) {
  const pattern = new RegExp(`(${label}[:\\s]*)[^\\n]*`, 'i');
  if (pattern.test(text)) {
    return text.replace(pattern, `$1${value}`);
  }
  return `${text}\n${label}: ${value}`;
}

function personalizeDoc(doc, overrides) {
  const next = { ...doc, data: { ...(doc.data || {}) } };
  let text = doc.rawText || '';

  if (overrides.name) {
    next.data.name = overrides.name;
    text = updateDocLine(text, 'Student Name', overrides.name);
  }
  if (overrides.institution) {
    next.data.institution = overrides.institution;
    text = updateDocLine(text, 'Institution', overrides.institution);
  }
  if (overrides.enrollmentStatus) {
    next.data.enrollmentStatus = overrides.enrollmentStatus;
    text = updateDocLine(text, 'Enrollment Status', overrides.enrollmentStatus);
  }
  if (overrides.dependencyStatus) {
    next.data.dependencyStatus = overrides.dependencyStatus;
    text = updateDocLine(text, 'Dependency Status', overrides.dependencyStatus);
  }
  if (typeof overrides.sai === 'number') {
    next.data.sai = overrides.sai;
    text = updateDocLine(text, 'Student Aid Index (SAI)', overrides.sai);
  }
  if (typeof overrides.gpa === 'number') {
    next.data.gpa = overrides.gpa;
    text = updateDocLine(text, 'GPA', overrides.gpa);
  }
  if (typeof overrides.income === 'number') {
    next.data.income = overrides.income;
    text = updateDocLine(text, 'Household Income', overrides.income);
  }

  next.rawText = text;
  if (overrides.name && next.label) {
    const base = next.label.replace(/\(.*?\)/, '').trim();
    next.label = `${base} (${overrides.name})`;
  }
  return next;
}

function generateConversations(count) {
  const conversations = [];
  for (let i = 0; i < count; i += 1) {
    const studentName = UNIQUE_NAMES[i % UNIQUE_NAMES.length];
    const studentType = pickRandom(STUDENT_TYPES);
    const complete = Math.random() > 0.35;
    const aidValue = randomInt(4000, 18000);

    const scenario = buildScenario(studentName, studentType, complete, aidValue);
    scenario.id = `conv_${i + 1}`;
    scenario.renderedIndex = -1;
    scenario.docs = [];
    scenario.logs = [];
    conversations.push(scenario);
  }
  return conversations;
}

function buildScenario(name, type, complete, aidValue) {
  const studentName = name;
  const spanishHints = ['Rivera', 'Gomez', 'Martinez', 'Perez', 'Alvarez'];
  const likelySpanish = spanishHints.some((token) => studentName.includes(token));
  const randLang = Math.random();
  const language = likelySpanish ? 'es' : (randLang > 0.9 ? 'pt' : (randLang > 0.82 ? 'es' : 'en'));
  const languageLabel = language === 'es' ? 'Spanish' : (language === 'pt' ? 'Portuguese' : 'English');
  const institution = pickRandom(['SNHU', 'Metro State', 'Purdue Global', 'ASU Online', 'UMass Global']);
  const enrollmentStatus = Math.random() > 0.2 ? 'Full-time' : 'Half-time';
  const dependencyStatus = Math.random() > 0.55 ? 'Independent' : 'Dependent';
  const sai = randomInt(-1500, 3000);
  const gpa = parseFloat((Math.random() * 1.5 + 2.5).toFixed(2));
  const income = randomInt(18000, 78000);
  const veteranStatus = type === 'Veteran Student' ? 'Yes' : 'No';
  const maritalStatus = Math.random() > 0.75 ? 'Married' : 'Single';

  const dobYear = randomInt(1996, 2006);
  const dob = `${dobYear}-0${randomInt(1, 9)}-${randomInt(10, 28)}`;
  const age = randomInt(18, 32);

  const fafsaDoc = personalizeDoc(pickRandom(FAFSA_DOCS), {
    name: studentName,
    institution,
    enrollmentStatus,
    dependencyStatus,
    sai
  });
  const transcriptDoc = personalizeDoc(pickRandom(TRANSCRIPT_DOCS), {
    name: studentName,
    institution,
    enrollmentStatus,
    gpa
  });
  const taxDoc = personalizeDoc(pickRandom(TAX_DOCS), { income });
  const veteranDoc = personalizeDoc(pickRandom(VETERAN_DOCS), {});

  const fafsaDelta = parseTextToDelta(fafsaDoc.rawText || '');
  const transcriptDelta = parseTextToDelta(transcriptDoc.rawText || '');
  const taxDelta = parseTextToDelta(taxDoc.rawText || '');
  const veteranDelta = parseTextToDelta(veteranDoc.rawText || '');

  const missingDocs = complete
    ? 'None'
    : pickRandom(['Official transcript', 'Tax transcript', 'FAFSA Submission Summary']);

  const messages = [
    {
      role: 'agent',
      text: t(language, STANDARD_GREETING.en, STANDARD_GREETING.es, STANDARD_GREETING.pt),
      reasoning: {
        ask: 'Standardized intake greeting',
        why: 'Sets expectations and shows how the intake will work.',
        unlocks: 'Clarifies that document upload and explanations are available.',
        differentiator: 'Generic bots do not explain the full aid workflow up front.',
        fields: [],
        language: languageLabel
      }
    },
    {
      role: 'student',
      text: t(
        language,
        studentIntroText(studentName, institution, language),
        `Hola, soy ${studentName}. Necesito ayuda con ayuda financiera para ${institution}.`,
        `Oi, sou ${studentName}. Preciso de ajuda com ajuda financeira para ${institution}.`
      ),
      delta: { name: studentName, institution },
      reasoning: {
        ask: 'Initial intent and school context',
        why: 'Confirms the institution and starts the aid workflow without making the student search the form.',
        unlocks: 'Routes the right college-specific checklist.',
        rule: 'Institution-specific aid checklists vary, so we anchor the school early.',
        differentiator: 'A generic bot might ask for every field up front; we start with context to reduce friction.',
        fields: ['institution'],
        language: languageLabel
      }
    },
    {
      role: 'agent',
      text: t(
        language,
        'Happy to help. What is your legal name, date of birth, and enrollment status? This sets your aid track.',
        'Con gusto. Cual es tu nombre legal, fecha de nacimiento y estado de inscripcion? Esto define tu via de ayuda.'
      ),
      reasoning: {
        ask: 'Name, DOB, enrollment status',
        why: 'These are required for FAFSA and institutional packaging.',
        unlocks: 'Populates identity and cost-of-attendance assumptions.',
        rule: 'Enrollment status drives aid eligibility and disbursement pace.',
        differentiator: 'One question fills three fields and avoids duplicate data entry.',
        fields: ['name', 'dateOfBirth', 'enrollmentStatus'],
        language: languageLabel
      }
    },
    {
      role: 'student',
      text: studentProvideBasics(studentName, dob, enrollmentStatus, language),
      delta: { name: studentName, dateOfBirth: dob, enrollmentStatus },
      reasoning: {
        ask: 'Student response captured',
        why: 'Verified identity and enrollment for aid routing.',
        unlocks: 'Allows dependency and aid index steps next.',
        fields: ['name', 'dateOfBirth', 'enrollmentStatus']
      }
    },
    {
      role: 'agent',
      text: t(
        language,
        'Thanks. Are you dependent or independent? Any military service? This determines whose income we need.',
        'Gracias. Eres dependiente o independiente? Tienes servicio militar? Esto define que ingresos usar.'
      ),
      reasoning: {
        ask: 'Dependency and veteran status',
        why: 'Dependency changes whose income is counted and veteran status can override dependency.',
        unlocks: 'Sets household data requirements and veteran benefits.',
        rule: 'Veteran status can make a student independent in FAFSA rules.',
        differentiator: 'Generic bots miss the dependency shortcut and ask for parent data unnecessarily.',
        fields: ['dependencyStatus', 'veteran', 'maritalStatus'],
        language: languageLabel
      }
    },
    {
      role: 'student',
      text: studentDependencyText(dependencyStatus, maritalStatus, veteranStatus, language),
      delta: {
        age,
        maritalStatus,
        veteran: veteranStatus,
        dependencyStatus
      },
      reasoning: {
        ask: 'Student eligibility signals captured',
        why: 'Dependency and veteran status drive which financial data is required.',
        unlocks: 'Determines if parent info is needed and veteran benefits apply.',
        fields: ['dependencyStatus', 'veteran', 'maritalStatus', 'age']
      }
    },
    {
      role: 'agent',
      text: t(
        language,
        'Please share your FAFSA Submission Summary (SAI). It drives Pell and grant ranges. I will ingest transcripts and tax docs next.',
        'Comparte tu FAFSA Submission Summary (SAI). Esto define rangos de ayuda. Voy a ingresar transcript y documentos de impuestos.'
      ),
      reasoning: {
        ask: 'FAFSA Submission Summary (SAI)',
        why: 'SAI is the strongest predictor for Pell and institutional aid bands.',
        unlocks: 'Fills aid index, dependency, and eligibility flags.',
        rule: 'SAI drives need-based eligibility thresholds.',
        differentiator: 'Generic bots treat FAFSA as optional; we prioritize it for accuracy.',
        fields: ['sai', 'dependencyStatus', 'institution'],
        language: languageLabel
      }
    },
    {
      role: 'student',
      text: studentShareDocText(fafsaDoc.label, language),
      doc: fafsaDoc,
      reasoning: {
        ask: 'Document intake',
        why: 'ingest to avoid manual form entry.',
        unlocks: 'Captures SAI and dependency fields.',
        fields: ['sai', 'dependencyStatus']
      }
    },
    {
      role: 'agent',
      text: t(
        language,
        `Got it. I see SAI ${sai} and ${dependencyStatus} status.`,
        `Listo. Veo SAI ${sai} y estado ${dependencyStatus}.`
      ),
      delta: { ...fafsaDelta, sai, dependencyStatus, enrollmentStatus, institution },
      reasoning: {
        ask: 'Summarize FAFSA extraction',
        why: 'Confirms the extracted fields before moving on.',
        unlocks: 'Keeps the student confident and reduces errors.',
        fields: ['sai', 'dependencyStatus', 'enrollmentStatus', 'institution']
      }
    }
  ];

  if (veteranStatus === 'Yes') {
    messages.push(
      {
      role: 'student',
      text: studentShareDocText(veteranDoc.label, language),
      doc: veteranDoc,
        reasoning: {
          ask: 'Veteran benefits proof',
          why: 'DD-214 verifies veteran eligibility and benefits.',
          unlocks: 'Populates veteran fields and benefit flags.',
          fields: ['veteran']
        }
      },
      {
        role: 'agent',
        text: t(
          language,
          'Veteran status verified. Thanks for sharing your DD-214.',
          'Estado veterano verificado. Gracias por compartir tu DD-214.'
        ),
        delta: { ...veteranDelta, veteran: 'Yes' },
        reasoning: {
          ask: 'Confirm veteran status',
          why: 'Locks dependency override and veteran benefits.',
          unlocks: 'Fills additional aid and waiver fields.',
          fields: ['veteran']
        }
      }
    );
  }

  if (complete) {
    const bankList = recommendBanks({ veteran: veteranStatus, income, dependencyStatus });
    messages.push(
      {
      role: 'student',
      text: studentShareDocText(transcriptDoc.label, language),
      doc: transcriptDoc,
        reasoning: {
          ask: 'Transcript intake',
          why: 'GPA and enrollment confirm merit aid and SAP standing.',
          unlocks: 'Merit aid and academic progress checks.',
          fields: ['gpa', 'enrollmentStatus', 'institution']
        }
      },
      {
        role: 'agent',
        text: t(
          language,
          `Transcript parsed. GPA ${gpa} at ${institution}.`,
          `Transcript procesado. GPA ${gpa} en ${institution}.`
        ),
        delta: { ...transcriptDelta, gpa, institution },
        reasoning: {
          ask: 'Confirm transcript values',
          why: 'Merit aid uses GPA and enrollment status.',
          unlocks: 'Merit-based offers and SAP eligibility.',
          fields: ['gpa', 'institution']
        }
      },
      {
      role: 'student',
      text: studentShareDocText(taxDoc.label, language),
      doc: taxDoc,
        reasoning: {
          ask: 'Tax document intake',
          why: 'Household income is required for need analysis.',
          unlocks: 'Need-based grants and work-study eligibility.',
          fields: ['income']
        }
      },
      {
        role: 'agent',
        text: t(
          language,
          'Income recorded from the tax summary. I can prep your checklist now.',
          'Ingreso registrado del resumen de impuestos. Puedo preparar tu lista ahora.'
        ),
        delta: { ...taxDelta, income },
        reasoning: {
          ask: 'Confirm income',
          why: 'Income drives need-based eligibility and verification rules.',
          unlocks: 'Final aid packaging and verification readiness.',
          fields: ['income']
        }
      },
      {
        role: 'agent',
        text: t(
          language,
          `Form looks ready. Recommended banks for refunds: ${bankList}.`,
          `Formulario listo. Bancos recomendados para reembolsos: ${bankList}.`
        ),
        delta: { recommendedBanks: bankList },
        reasoning: {
          ask: 'Recommend banking options',
          why: 'Direct deposit speeds refunds and avoids paper checks.',
          unlocks: 'Finalizes refund preference section.',
          rule: 'Refund delivery method is required for most disbursement timelines.',
          differentiator: 'Generic bots do not connect aid forms to real banking options.',
          fields: ['recommendedBanks']
        }
      },
      {
        role: 'student',
        text: t(
          language,
          makeMessyText('Appreciate the help.'),
          'Gracias por la ayuda.'
        ),
        delta: { status: 'Complete', missingDocs: 'None' },
        reasoning: {
          ask: 'Closeout',
          why: 'Marks the form as ready for submission.',
          unlocks: 'Completion status and checklist summary.',
          fields: ['status', 'missingDocs']
        }
      }
    );
  } else {
    messages.push(
      {
        role: 'agent',
        text: t(
          language,
          `I still need ${missingDocs} to finish. Do you have an income estimate? It helps prefill need-based aid.`,
          `Aun necesito ${missingDocs} para terminar. Tienes un estimado de ingresos? Esto ayuda a prellenar ayudas.`
        ),
        reasoning: {
          ask: 'Missing documents and income estimate',
          why: 'We can prepare a partial package with estimated income.',
          unlocks: 'Keeps the form moving while docs are pending.',
          fields: ['missingDocs', 'income']
        }
      },
      {
        role: 'student',
        text: t(
          language,
          makeMessyText(`Household income is about $${income}. I'll share ${missingDocs} later.`),
          `Ingreso familiar aproximado $${income}. Enviare ${missingDocs} despues.`
        ),
        delta: { income, status: 'Incomplete', missingDocs },
        reasoning: {
          ask: 'Income estimate captured',
          why: 'Allows provisional need analysis and next steps.',
          unlocks: 'Partial completion and reminders.',
          fields: ['income', 'status', 'missingDocs']
        }
      }
    );
  }

  const totalDuration = randomInt(60, 150);
  const weighted = messages.map((msg) => ({
    ...msg,
    length: Math.max(8, msg.text.split(' ').length)
  }));
  const totalLength = weighted.reduce((sum, msg) => sum + msg.length, 0);

  const messagesWithDuration = weighted.map((msg) => ({
    ...msg,
    duration: Math.max(2, (msg.length / totalLength) * totalDuration)
  }));

  const snapshots = buildSnapshots(messagesWithDuration);

  return {
    studentName: studentName,
    studentType: type,
    aidValue,
    status: complete ? 'Complete' : 'Incomplete',
    messages: messagesWithDuration,
    snapshots,
    language: languageLabel
  };
}

function buildSnapshots(messages) {
  const current = {
    name: null,
    dateOfBirth: null,
    age: null,
    maritalStatus: null,
    dependencyStatus: null,
    veteran: null,
    enrollmentStatus: null,
    institution: null,
    gpa: null,
    sai: null,
    income: null,
    recommendedBanks: null,
    missingDocs: null,
    status: null
  };

  const snapshots = [];
  messages.forEach((msg) => {
    if (msg.delta) {
      Object.assign(current, msg.delta);
    }
    snapshots.push(JSON.parse(JSON.stringify(current)));
  });

  return snapshots;
}

function renderMetricMix() {
  const total = metrics.completed;
  if (!total) {
    metricMix.textContent = '-';
    return;
  }
  const entries = Object.entries(metrics.typeCounts).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 3).map(([type, count]) => {
    const percent = Math.round((count / total) * 100);
    return `${type.split(' ')[0]} ${percent}%`;
  });
  metricMix.textContent = top.join(' | ');
}

function truncateText(text, limit = 88) {
  if (!text) return '';
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function getSegmentLabel(text) {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return truncateText(cleaned, 18);
}

function formatDateShort(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getCompletionStats(snapshot) {
  const total = FIELD_LABELS.length;
  const filled = FIELD_LABELS.reduce((count, field) => {
    const value = snapshot[field.key];
    return value !== undefined && value !== null && value !== '' ? count + 1 : count;
  }, 0);
  const percent = Math.round((filled / total) * 100);
  return { filled, total, percent };
}

function getConversationPreview(conversation) {
  const firstStudent = conversation.messages.find((msg) => msg.role === 'student');
  return truncateText(firstStudent?.text || conversation.messages[0]?.text || '');
}

function hasAttachments(conversation) {
  return conversation.messages.some((msg) => msg.doc);
}

function getLatestSnapshot(conversation) {
  return conversation.snapshots[conversation.snapshots.length - 1] || {};
}

function getStageIndices(conversation) {
  const stages = [];
  FIELD_LABELS.forEach((field) => {
    const idx = conversation.snapshots.findIndex((snap) => {
      const value = snap[field.key];
      return value !== undefined && value !== null && value !== '';
    });
    stages.push(idx === -1 ? null : idx);
  });
  return stages;
}

function updateMetrics() {
  metricCompleted.textContent = metrics.completed.toLocaleString();
  metricAid.textContent = formatCurrency(metrics.totalAid);
  const rate = metrics.completed ? Math.round((metrics.completedComplete / metrics.completed) * 100) : 0;
  metricRate.textContent = `${rate}%`;
  metricPending.textContent = metrics.completedIncomplete.toLocaleString();
  renderMetricMix();
  updateImpactMetrics();
}

function renderBarChart(container, rows) {
  if (!container) return;
  container.innerHTML = '';
  rows.forEach((row, index) => {
    const line = document.createElement('div');
    line.className = 'chart-row';

    const label = document.createElement('span');
    label.textContent = row.label;

    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    const fill = document.createElement('span');
    fill.style.setProperty('--chart-width', `${row.value}%`);
    bar.appendChild(fill);

    const value = document.createElement('span');
    value.textContent = row.display;

    line.appendChild(label);
    line.appendChild(bar);
    line.appendChild(value);
    container.appendChild(line);

    requestAnimationFrame(() => {
      setTimeout(() => {
        fill.classList.add('animate');
      }, 40 + index * 80);
    });

    line.addEventListener('mouseenter', (event) => {
      showHoverTooltip(
        `<div class="tooltip-title">${row.label}</div><div class="tooltip-row"><span>Value</span><strong>${row.display}</strong></div>`,
        event.clientX,
        event.clientY
      );
    });
    line.addEventListener('mousemove', (event) => {
      if (!hoverTooltip || !hoverTooltip.classList.contains('visible')) return;
      positionHoverTooltipAt(event.clientX, event.clientY);
    });
    line.addEventListener('mouseleave', () => {
      hideHoverTooltip();
    });
  });
}

function renderSparkline(container, points, accent) {
  if (!container) return;
  container.innerHTML = '';
  const w = 320;
  const h = 120;
  const padding = 12;
  const max = Math.max(...points.map((p) => p.value));
  const min = Math.min(...points.map((p) => p.value));
  const span = max - min || 1;
  const step = (w - padding * 2) / (points.length - 1);

  const coords = points.map((point, idx) => {
    const x = padding + idx * step;
    const y = h - padding - ((point.value - min) / span) * (h - padding * 2);
    return { x, y, label: point.label, value: point.value };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${h - padding} L ${coords[0].x} ${h - padding} Z`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('role', 'img');

  const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  area.setAttribute('d', areaPath);
  area.setAttribute('class', 'sparkline-area');
  svg.appendChild(area);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', linePath);
  path.setAttribute('class', 'sparkline-path');
  if (accent) path.setAttribute('style', `stroke:${accent};`);
  svg.appendChild(path);

  coords.forEach((point) => {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', `${point.x}`);
    dot.setAttribute('cy', `${point.y}`);
    dot.setAttribute('r', '4');
    dot.setAttribute('class', 'sparkline-point');
    dot.addEventListener('mouseenter', (event) => {
      showHoverTooltip(
        `<div class="tooltip-title">${point.label}</div><div class="tooltip-row"><span>Value</span><strong>${point.value}</strong></div>`,
        event.clientX,
        event.clientY
      );
    });
    dot.addEventListener('mousemove', (event) => {
      if (!hoverTooltip || !hoverTooltip.classList.contains('visible')) return;
      positionHoverTooltipAt(event.clientX, event.clientY);
    });
    dot.addEventListener('mouseleave', () => {
      hideHoverTooltip();
    });
    svg.appendChild(dot);
  });

  container.appendChild(svg);
}

function updateImpactMetrics(forceCharts = false) {
  const pastCount = pastStreamsEl ? pastStreamsEl.children.length : 0;
  const liveCount = liveStreamsEl ? liveStreamsEl.children.length : 0;
  const totalStudents = metrics.completed + liveCount + pastCount;
  const completionRate = metrics.completed ? Math.round((metrics.completedComplete / metrics.completed) * 100) : 0;
  const avgTime = Math.max(10, 22 - agentsCount * 2);
  const hoursSaved = Math.round(metrics.completed * 0.6);
  const costPer = Math.max(12, 28 - completionRate / 5);
  const errorRate = Math.min(90, 60 + completionRate / 2);
  const docsProcessed = Math.round((metrics.completed + liveCount) * 1.8);
  const autoFillRate = Math.min(96, 62 + Math.round(completionRate * 0.35));
  const dropoffRisk = Math.max(6, 42 - completionRate / 2);
  const complianceRate = Math.min(99, 88 + Math.round(completionRate / 12));
  const aidUnlocked = metrics.totalAid + 320000;

  if (impactStudents) impactStudents.textContent = totalStudents.toLocaleString();
  if (impactTime) impactTime.textContent = `${avgTime} min`;
  if (impactCompletion) impactCompletion.textContent = `${completionRate}%`;
  if (impactHours) impactHours.textContent = `${hoursSaved} hrs`;
  if (impactCost) impactCost.textContent = `$${costPer.toFixed(0)}`;
  if (impactErrors) impactErrors.textContent = `${errorRate}%`;
  if (impactAidVolume) impactAidVolume.textContent = formatCurrency(aidUnlocked);
  if (impactGrantMix) impactGrantMix.textContent = 'Pell 62% | State 18% | Institutional 20%';
  if (impactRefunds) impactRefunds.textContent = '76% direct deposit';
  if (impactTitle) impactTitle.textContent = '98% clean checks';
  if (impactAudit) impactAudit.textContent = '100% traceable';
  if (impactReporting) impactReporting.textContent = 'On-time';
  if (impactIntakes) impactIntakes.textContent = totalStudents.toLocaleString();
  if (impactAutofill) impactAutofill.textContent = `${autoFillRate}%`;
  if (impactDocs) impactDocs.textContent = docsProcessed.toLocaleString();
  if (impactAidUnlocked) impactAidUnlocked.textContent = formatCurrency(aidUnlocked);
  if (impactDropoff) impactDropoff.textContent = `${dropoffRisk}%`;
  if (impactCompliance) impactCompliance.textContent = `${complianceRate}%`;

  const now = Date.now();
  const shouldRenderCharts = forceCharts || now - lastImpactChartRender > 6000;
  if (!shouldRenderCharts) return;
  lastImpactChartRender = now;

  renderBarChart(document.getElementById('chart-dropoff'), [
    { label: 'Started', value: 100, display: '100%' },
    { label: 'Docs', value: 78, display: '78%' },
    { label: 'Review', value: 64, display: '64%' },
    { label: 'Complete', value: completionRate || 52, display: `${completionRate || 52}%` }
  ]);
  renderBarChart(document.getElementById('chart-throughput'), [
    { label: '8 AM', value: 45, display: '45' },
    { label: '12 PM', value: 72, display: '72' },
    { label: '4 PM', value: 60, display: '60' },
    { label: '8 PM', value: 38, display: '38' }
  ]);
  renderBarChart(document.getElementById('chart-aid'), [
    { label: 'Pell', value: 68, display: '68%' },
    { label: 'State', value: 22, display: '22%' },
    { label: 'Inst', value: 40, display: '40%' }
  ]);
  renderBarChart(document.getElementById('chart-compliance'), [
    { label: 'FAFSA', value: 92, display: '92%' },
    { label: 'Title IV', value: 88, display: '88%' },
    { label: 'Audit', value: 96, display: '96%' }
  ]);

  renderSparkline(document.getElementById('chart-aid-trend'), [
    { label: 'Mon', value: 420 },
    { label: 'Tue', value: 520 },
    { label: 'Wed', value: 610 },
    { label: 'Thu', value: 560 },
    { label: 'Fri', value: 720 },
    { label: 'Sat', value: 680 },
    { label: 'Sun', value: 760 }
  ]);
  renderSparkline(document.getElementById('chart-doc-turnaround'), [
    { label: 'Week 1', value: 34 },
    { label: 'Week 2', value: 28 },
    { label: 'Week 3', value: 22 },
    { label: 'Week 4', value: 18 },
    { label: 'Week 5', value: 16 }
  ], '#0d7a71');
}

function addCompletionMetrics(conversation) {
  metrics.completed += 1;
  metrics.totalAid += conversation.aidValue;
  if (conversation.status === 'Complete') {
    metrics.completedComplete += 1;
  } else {
    metrics.completedIncomplete += 1;
  }
  metrics.typeCounts[conversation.studentType] = (metrics.typeCounts[conversation.studentType] || 0) + 1;
  updateMetrics();
}

function createStreamRow(conversation) {
  const row = document.createElement('div');
  row.className = 'stream-row';

  const meta = document.createElement('div');
  meta.className = 'stream-meta';

  const nameEl = document.createElement('div');
  nameEl.className = 'student-name';
  nameEl.textContent = conversation.studentName;

  const typeEl = document.createElement('div');
  typeEl.className = 'student-type';
  typeEl.textContent = `${conversation.studentType} | ${conversation.language}`;

  const statusEl = document.createElement('div');
  statusEl.className = 'stream-status';
  statusEl.textContent = 'In Progress';

  const previewEl = document.createElement('div');
  previewEl.className = 'conversation-preview';
  previewEl.textContent = getConversationPreview(conversation);

  const metaRow = document.createElement('div');
  metaRow.className = 'conversation-meta-row';

  const progressEl = document.createElement('span');
  progressEl.className = 'progress-pill';

  const attachmentEl = document.createElement('span');
  attachmentEl.className = 'attachment-pill';
  attachmentEl.textContent = 'Attachments';
  if (!hasAttachments(conversation)) {
    attachmentEl.classList.add('hidden');
  }

  const dateEl = document.createElement('span');
  dateEl.className = 'meta-date';
  dateEl.textContent = formatDateShort(conversation.createdAt || Date.now());

  metaRow.appendChild(progressEl);
  metaRow.appendChild(attachmentEl);
  metaRow.appendChild(dateEl);

  meta.appendChild(nameEl);
  meta.appendChild(typeEl);
  meta.appendChild(statusEl);
  meta.appendChild(previewEl);
  meta.appendChild(metaRow);

  const track = document.createElement('div');
  track.className = 'stream-track';

  row.appendChild(meta);
  row.appendChild(track);

  row.addEventListener('click', (event) => {
    if (event.target.closest('.segment')) return;
    const lastIndex = Math.max(0, conversation.messages.length - 1);
    lockConversation(conversation, lastIndex);
  });

  row.dataset.conversationId = conversation.id;

  row.addEventListener('mouseenter', (event) => {
    const snapshot = getLatestSnapshot(conversation);
    const { filled, total, percent } = getCompletionStats(snapshot);
    const html = conversation.rowTooltipHtml || buildRowTooltipHtml(conversation, filled, total, percent);
    showHoverTooltip(html, event.clientX, event.clientY);
  });
  row.addEventListener('mouseleave', () => {
    hideHoverTooltip();
  });
  row.addEventListener('mousemove', (event) => {
    if (!hoverTooltip || !hoverTooltip.classList.contains('visible')) return;
    positionHoverTooltipAt(event.clientX, event.clientY);
  });

  return { row, track, statusEl, previewEl, progressEl, attachmentEl };
}

function updateRowMeta(conversation, index) {
  if (!conversation.rowRefs) return;
  const snapshot = conversation.snapshots[index] || getLatestSnapshot(conversation);
  const { filled, total, percent } = getCompletionStats(snapshot);
  conversation.rowRefs.progressEl.textContent = `${filled}/${total}`;
  conversation.rowRefs.progressEl.setAttribute('data-percent', `${percent}%`);
  conversation.rowRefs.previewEl.textContent = getConversationPreview(conversation);

  const row = conversation.rowRefs.row;
  row.dataset.status = conversation.status.toLowerCase();
  row.dataset.language = conversation.language;
  row.dataset.attachments = hasAttachments(conversation) ? 'has' : 'none';
  row.dataset.completion = percent;
  if (conversation.createdAt) {
    row.dataset.createdAt = `${conversation.createdAt}`;
  }

  if (hasAttachments(conversation)) {
    conversation.rowRefs.attachmentEl.classList.remove('hidden');
  } else {
    conversation.rowRefs.attachmentEl.classList.add('hidden');
  }

  conversation.rowTooltipHtml = buildRowTooltipHtml(conversation, filled, total, percent);
}

function updateLiveCount() {
  if (!liveCountEl) return;
  const count = liveStreamsEl ? liveStreamsEl.children.length : 0;
  liveCountEl.textContent = `${count} active`;
}

function moveToPast(conversation) {
  if (!pastStreamsEl || !conversation.rowRefs) return;
  const row = conversation.rowRefs.row;
  row.classList.add('to-past');
  setTimeout(() => {
    row.classList.remove('to-past');
    row.classList.add('past');
    pastStreamsEl.prepend(row);
    updateLiveCount();
    applyPastFilters();
    updateImpactMetrics(true);
  }, 280);
}

function matchesCompletionFilter(value, filterValue) {
  if (filterValue === 'all') return true;
  const percent = Number(value) || 0;
  if (filterValue === '0-50') return percent <= 50;
  if (filterValue === '50-80') return percent > 50 && percent <= 80;
  if (filterValue === '80-100') return percent > 80;
  return true;
}

function applyPastFilters() {
  if (!pastStreamsEl) return;
  const statusVal = filterStatus?.value || 'all';
  const languageVal = filterLanguage?.value || 'all';
  const attachmentVal = filterAttachments?.value || 'all';
  const completionVal = filterCompletion?.value || 'all';
  const recencyVal = filterRecency?.value || 'all';

  Array.from(pastStreamsEl.children).forEach((row) => {
    const status = row.dataset.status || '';
    const language = row.dataset.language || '';
    const attachments = row.dataset.attachments || 'none';
    const completion = row.dataset.completion || '0';
    const createdAt = Number(row.dataset.createdAt || 0);

    const statusOk = statusVal === 'all' || status === statusVal;
    const languageOk = languageVal === 'all' || (languageVal === 'Other' ? !['English', 'Spanish'].includes(language) : language === languageVal);
    const attachmentOk = attachmentVal === 'all' || attachments === attachmentVal;
    const completionOk = matchesCompletionFilter(completion, completionVal);
    let recencyOk = true;
    if (recencyVal !== 'all' && createdAt) {
      const days = Number(recencyVal);
      const cutoff = Date.now() - days * 86400000;
      recencyOk = createdAt >= cutoff;
    }

    row.classList.toggle('hidden', !(statusOk && languageOk && attachmentOk && completionOk && recencyOk));
  });
}

function renderPastConversation(conversation) {
  const { row, track, statusEl, previewEl, progressEl, attachmentEl } = createStreamRow(conversation);
  conversation.rowRefs = { row, track, statusEl, previewEl, progressEl, attachmentEl };
  conversation.track = track;
  conversation.statusEl = statusEl;
  row.classList.add('past');

  statusEl.textContent = conversation.status === 'Complete' ? 'Complete' : 'Needs Docs';
  if (conversation.status !== 'Complete') {
    statusEl.classList.add('incomplete');
  }

  conversation.messages.forEach((msg, idx) => {
    const segment = document.createElement('div');
    segment.className = `segment ${msg.role} static`;
    segment.style.width = `${calcSegmentWidth(msg.text)}px`;
    const label = document.createElement('span');
    label.className = 'segment-label';
    label.textContent = getSegmentLabel(msg.text);
    segment.appendChild(label);
    if (msg.doc) {
      const folder = document.createElement('span');
      folder.className = 'segment-folder';
      folder.title = 'Attachment';
      segment.appendChild(folder);
    }
    segment.addEventListener('click', () => lockConversation(conversation, idx));
    segment.addEventListener('mouseenter', (event) => {
      showHoverTooltip(buildSegmentTooltipHtml(msg), event.clientX, event.clientY);
    });
    segment.addEventListener('mouseleave', (event) => {
      if (row.matches(':hover')) {
        const snapshot = conversation.snapshots[idx] || getLatestSnapshot(conversation);
        const { filled, total, percent } = getCompletionStats(snapshot);
        showHoverTooltip(buildRowTooltipHtml(conversation, filled, total, percent), event.clientX, event.clientY);
      } else {
        hideHoverTooltip();
      }
    });
    track.appendChild(segment);
  });

  requestAnimationFrame(() => ensureTrackFits(track));
  updateRowMeta(conversation, conversation.messages.length - 1);
  pastStreamsEl.appendChild(row);
}

function calcSegmentWidth(text) {
  const tokens = text.split(' ').length;
  return Math.min(260, Math.max(60, tokens * 8));
}

function renderMarkdown(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />');
}

function buildRowTooltipHtml(conversation, filled, total, percent) {
  return `
    <div class="tooltip-title">${conversation.studentName}</div>
    <div class="tooltip-row"><span>Status</span><strong>${conversation.status}</strong></div>
    <div class="tooltip-row"><span>Completion</span><strong>${filled}/${total} (${percent}%)</strong></div>
    <div class="tooltip-row"><span>Language</span><strong>${conversation.language}</strong></div>
    <div class="tooltip-row"><span>Preview</span><span>${getConversationPreview(conversation)}</span></div>
  `;
}

function buildSegmentTooltipHtml(msg) {
  const body = renderMarkdown(msg.text || '');
  const attachment = msg.doc ? `<div class="tooltip-row"><span>Folder</span><strong>${msg.doc.label}</strong></div>` : '';
  return `<div class="tooltip-title">${msg.role === 'agent' ? 'Agent' : 'Student'} message</div>${body}${attachment}`;
}

function createAttachmentButton(doc) {
  if (!doc) return null;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'message-attachment';
  btn.textContent = doc.label;
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    openAttachment(doc);
  });
  return btn;
}

function conversationSubtitle(conversation) {
  return `${conversation.status} form | Aid supported ${formatCurrency(conversation.aidValue)}`;
}

function setModalOpenState(isOpen) {
  document.body.classList.toggle('modal-open', isOpen);
  document.documentElement.classList.toggle('modal-open', isOpen);
}

function lockConversation(conversation, index) {
  lockState.active = true;
  lockState.conversationId = conversation.id;
  detailModal?.classList.add('locked');
  detailModal?.classList.add('open');
  setModalOpenState(true);
  const safeIndex = Number.isInteger(index) ? index : conversation.messages.length - 1;
  setActiveConversation(conversation, safeIndex, { force: true });
}

function unlockConversation() {
  if (!lockState.active) return;
  lockState.active = false;
  lockState.conversationId = null;
  detailModal?.classList.remove('locked');
  detailModal?.classList.remove('open');
  if (!attachmentModal || !attachmentModal.classList.contains('open')) {
    setModalOpenState(false);
  }
  if (lastAuto.conversationId) {
    const conv = conversationMap.get(lastAuto.conversationId);
    if (conv) {
      const idx = Math.min(lastAuto.messageIndex, conv.messages.length - 1);
      setActiveConversation(conv, idx, { force: true });
    }
  }
}

function setActiveConversation(conversation, index, options = {}) {
  const isNewConversation = activeConversationId !== conversation.id;
  if (!options.force && !lockState.active) {
    lastAuto.conversationId = conversation.id;
    lastAuto.messageIndex = index;
  }
  if (lockState.active && conversation.id !== lockState.conversationId) {
    return;
  }
  activeConversationId = conversation.id;
  if (isNewConversation) {
    transcriptAutoScroll = true;
  }
  detailEyebrow.textContent = conversation.status === 'Complete' ? 'Completed' : 'In Progress';
  detailTitle.textContent = `${conversation.studentName} | ${conversation.studentType}`;

  if (!options.typingStatus) {
    detailSubtitle.textContent = conversationSubtitle(conversation);
  } else {
    detailSubtitle.textContent = options.typingStatus;
  }

  if (options.stream && options.message) {
    appendStreamingMessage(conversation, options.message, index);
  } else {
    renderTranscriptUpTo(conversation, index);
  }

  renderFormState(conversation, index);
  renderReasoning(conversation, index);
  renderTimeline(conversation, index);
  renderAutoDocs(conversation);
}

function renderTranscriptUpTo(conversation, activeIndex) {
  detailMessages.dataset.convId = conversation.id;
  detailMessages.classList.remove('empty-state');
  detailMessages.innerHTML = '';
  conversation.messages.forEach((msg, idx) => {
    if (idx > activeIndex) return;
    const msgEl = document.createElement('div');
    msgEl.className = `detail-message ${msg.role}`;
    if (idx === activeIndex) msgEl.classList.add('active');

    const textEl = document.createElement('p');
    textEl.innerHTML = renderMarkdown(msg.text);
    msgEl.appendChild(textEl);

    if (msg.doc) {
      const attachment = createAttachmentButton(msg.doc);
      if (attachment) {
        msgEl.appendChild(attachment);
      }
    }

    msgEl.addEventListener('click', () => {
      lockConversation(conversation, idx);
    });

    detailMessages.appendChild(msgEl);
  });

  conversation.renderedIndex = activeIndex;
  if (transcriptAutoScroll) {
    detailMessages.scrollTop = detailMessages.scrollHeight;
  }
}

function appendStreamingMessage(conversation, msg, index) {
  const currentConv = detailMessages.dataset.convId;
  if (currentConv !== conversation.id || index !== conversation.renderedIndex + 1) {
    renderTranscriptUpTo(conversation, index);
    renderReasoning(conversation, index);
    return;
  }

  const msgEl = document.createElement('div');
  msgEl.className = `detail-message ${msg.role}`;
  msgEl.classList.add('active');

  detailMessages.querySelectorAll('.detail-message').forEach((el) => el.classList.remove('active'));

  const textEl = document.createElement('p');
  textEl.textContent = '';
  msgEl.appendChild(textEl);

  if (msg.doc) {
    const attachment = createAttachmentButton(msg.doc);
    if (attachment) {
      msgEl.appendChild(attachment);
    }
  }

  msgEl.addEventListener('click', () => {
    lockConversation(conversation, index);
  });

  detailMessages.appendChild(msgEl);
  conversation.renderedIndex = index;

  const durationMs = (msg.duration || 2) * 1000;
  streamText(textEl, msg.text, durationMs);
  if (transcriptAutoScroll) {
    detailMessages.scrollTop = detailMessages.scrollHeight;
  }
  renderReasoning(conversation, index);
}

function streamText(target, text, durationMs) {
  const words = text.split(' ');
  const interval = Math.max(25, Math.floor(durationMs / Math.max(4, words.length)));
  let idx = 0;

  const timer = setInterval(() => {
    idx += 1;
    target.textContent = words.slice(0, idx).join(' ');
    if (idx >= words.length) {
      clearInterval(timer);
    }
  }, interval);
}

function showTypingIndicator(role) {
  const indicator = document.createElement('div');
  indicator.className = `typing-indicator ${role}`;
  indicator.innerHTML = '<span></span><span></span><span></span>';
  detailMessages.appendChild(indicator);
  if (transcriptAutoScroll) {
    detailMessages.scrollTop = detailMessages.scrollHeight;
  }
  return indicator;
}

function bindNestedScroll(child, parent) {
  if (!child || !parent) return;
  child.addEventListener('wheel', (event) => {
    const delta = event.deltaY;
    const atTop = child.scrollTop <= 0;
    const atBottom = child.scrollTop + child.clientHeight >= child.scrollHeight - 1;
    if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
      parent.scrollTop += delta;
      event.preventDefault();
    }
    event.stopPropagation();
  }, { passive: false });
}

function isTranscriptNearBottom() {
  if (!detailMessages) return true;
  return detailMessages.scrollTop + detailMessages.clientHeight >= detailMessages.scrollHeight - 24;
}

function showPendingSegment(track, role) {
  const segment = document.createElement('div');
  segment.className = `segment ${role} pending`;
  segment.style.width = '46px';
  track.appendChild(segment);
  requestAnimationFrame(() => ensureTrackFits(track));
  return segment;
}

function calcTypingDelay(msg) {
  const words = msg.text.split(' ').length;
  const base = msg.role === 'agent' ? TIMING.agentBase : TIMING.studentBase;
  const perWord = msg.role === 'agent' ? TIMING.perWordAgent : TIMING.perWordStudent;
  return Math.min(4200, base + words * perWord + randomInt(120, TIMING.jitter));
}

function appendSegment(track, msg, durationOverride) {
  const segment = document.createElement('div');
  segment.className = `segment ${msg.role}`;

  const label = document.createElement('span');
  label.className = 'segment-label';
  label.textContent = getSegmentLabel(msg.text);
  segment.appendChild(label);

  if (msg.doc) {
    const folder = document.createElement('span');
    folder.className = 'segment-folder';
    folder.title = 'Attachment';
    segment.appendChild(folder);
  }

  const width = calcSegmentWidth(msg.text);
  segment.style.transitionDuration = `${durationOverride || msg.duration || 1.4}s`;
  track.appendChild(segment);

  requestAnimationFrame(() => {
    segment.classList.add('playing');
    segment.style.width = `${width}px`;
    ensureTrackFits(track);
  });

  setTimeout(() => {
    segment.classList.remove('playing');
  }, (durationOverride || msg.duration || 1.4) * 1000);

  segment.addEventListener('mouseenter', (event) => {
    showHoverTooltip(buildSegmentTooltipHtml(msg), event.clientX, event.clientY);
  });
  segment.addEventListener('mouseleave', (event) => {
    const row = track.closest('.stream-row');
    const conversationId = row?.dataset.conversationId;
    const conv = conversationId ? conversationMap.get(conversationId) : null;
    if (row && row.matches(':hover') && conv) {
      const snapshot = getLatestSnapshot(conv);
      const { filled, total, percent } = getCompletionStats(snapshot);
      showHoverTooltip(buildRowTooltipHtml(conv, filled, total, percent), event.clientX, event.clientY);
    } else {
      hideHoverTooltip();
    }
  });

  return segment;
}

function ensureTrackFits(track) {
  if (!track) return;
  const maxWidth = track.clientWidth;
  if (!maxWidth) return;
  const overflowEl = track.querySelector('.segment.overflow');
  if (overflowEl) overflowEl.remove();

  const segments = Array.from(track.querySelectorAll('.segment'));
  let total = 0;
  segments.forEach((seg, idx) => {
    if (idx === 0) {
      total += seg.offsetWidth;
    } else {
      total += seg.offsetWidth + 6;
    }
  });

  if (total <= maxWidth) return;

  let removed = 0;
  while (segments.length && total > maxWidth) {
    const seg = segments.shift();
    if (!seg) break;
    total -= seg.offsetWidth + 6;
    seg.remove();
    removed += 1;
  }

  if (removed > 0) {
    const overflowSegment = document.createElement('div');
    overflowSegment.className = 'segment overflow static';
    overflowSegment.style.width = '48px';
    const label = document.createElement('span');
    label.className = 'segment-label';
    label.textContent = '...';
    overflowSegment.appendChild(label);
    track.prepend(overflowSegment);
  }
}

function spawnConversation(conversation) {
  const { row, track, statusEl, previewEl, progressEl, attachmentEl } = createStreamRow(conversation);
  if (!liveStreamsEl) return;
  liveStreamsEl.prepend(row);
  liveRows.unshift(row);
  if (liveRows.length > maxLiveRows) {
    const removed = liveRows.pop();
    removed.remove();
  }

  conversation.track = track;
  conversation.statusEl = statusEl;
  conversation.rowRefs = { row, track, statusEl, previewEl, progressEl, attachmentEl };
  updateRowMeta(conversation, 0);
  updateLiveCount();
  updateImpactMetrics();

  let index = 0;

  function playNext() {
    const msg = conversation.messages[index];
    if (!msg) {
      statusEl.textContent = conversation.status === 'Complete' ? 'Complete' : 'Needs Docs';
      statusEl.classList.remove('pending');
      if (conversation.status !== 'Complete') {
        statusEl.classList.add('incomplete');
      }
      addCompletionMetrics(conversation);
      moveToPast(conversation);
      return;
    }

    const typingDelay = calcTypingDelay(msg);
    const pendingSegment = showPendingSegment(track, msg.role);

    statusEl.textContent = msg.role === 'student' ? 'Student typing...' : 'Agent thinking...';
    statusEl.classList.add('pending');

    let typingIndicator = null;
    if (activeConversationId === conversation.id || !activeConversationId) {
      setActiveConversation(conversation, Math.max(index - 1, 0), {
        typingStatus: msg.role === 'student' ? 'Student is typing...' : 'Agent is thinking...'
      });
      typingIndicator = showTypingIndicator(msg.role);
    }

    setTimeout(async () => {
      pendingSegment.remove();
      typingIndicator?.remove();

      const segmentIndex = index;
      const segment = appendSegment(track, msg, msg.duration);
      segment.addEventListener('click', () => lockConversation(conversation, segmentIndex));

      statusEl.textContent = 'In Progress';
      statusEl.classList.remove('pending');

      setActiveConversation(conversation, segmentIndex, { stream: true, message: msg });
      updateRowMeta(conversation, segmentIndex);
      updateImpactMetrics();

      if (msg.doc) {
        await simulateDocProcessing(conversation, msg.doc, segmentIndex);
        updateRowMeta(conversation, segmentIndex);
        updateImpactMetrics();
      }

      setTimeout(() => {
        index += 1;
        playNext();
      }, TIMING.pauseAfter + randomInt(140, 340));
    }, typingDelay);
  }

  playNext();
}

function renderFormState(conversation, index) {
  const snapshot = conversation.snapshots[index] || {};
  detailFormSubtitle.textContent = `Snapshot after message ${index + 1} of ${conversation.messages.length}`;
  detailFormBody.innerHTML = '';

  const totalFields = FIELD_LABELS.length;
  let filledCount = 0;

  FIELD_LABELS.forEach((field) => {
    const fieldEl = document.createElement('div');
    fieldEl.className = 'form-field';

    const labelEl = document.createElement('span');
    labelEl.className = 'form-label';
    labelEl.textContent = field.label;

    const valueEl = document.createElement('span');
    valueEl.className = 'form-value';
    const value = snapshot[field.key];
    valueEl.textContent = value || '-';

    if (value !== undefined && value !== null && value !== '') {
      filledCount += 1;
    }

    fieldEl.appendChild(labelEl);
    fieldEl.appendChild(valueEl);
    detailFormBody.appendChild(fieldEl);
  });

  const percent = Math.round((filledCount / totalFields) * 100);
  if (formProgressCount) {
    formProgressCount.textContent = `${filledCount}/${totalFields} fields`;
  }
  if (formProgressPercent) {
    formProgressPercent.textContent = `${percent}%`;
  }
  if (formProgressFill) {
    formProgressFill.style.width = `${percent}%`;
  }

  renderStageBar(conversation, index);
}

function renderStageBar(conversation, index) {
  if (!formStageBar) return;
  formStageBar.innerHTML = '';
  const stages = getStageIndices(conversation);

  let activeStage = null;
  let activeStageIndex = null;
  stages.forEach((stageIndex, idx) => {
    if (stageIndex !== null && stageIndex <= index) {
      activeStage = idx;
      activeStageIndex = stageIndex;
    }
  });

  stages.forEach((stageIndex, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stage-dot';
    btn.textContent = `${idx + 1}`;
    btn.dataset.stage = `${idx + 1}`;
    if (stageIndex === null) {
      btn.classList.add('inactive');
    } else {
      btn.classList.add('done');
    }
    if (idx === activeStage) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      const targetIndex = stageIndex ?? index;
      lockConversation(conversation, targetIndex);
    });
    formStageBar.appendChild(btn);
  });

  if (formStagePreview) {
    formStagePreview.innerHTML = '';
    const previewIndex = Number.isInteger(activeStageIndex) ? activeStageIndex : Math.min(index, conversation.messages.length - 1);
    const msg = conversation.messages[previewIndex];
    const previewText = msg ? truncateText(msg.text, 96) : 'No transcript yet.';
    const textEl = document.createElement('span');
    textEl.className = 'stage-preview-text';
    textEl.textContent = previewText;
    formStagePreview.appendChild(textEl);

    if (msg?.doc) {
      const docEl = document.createElement('span');
      docEl.className = 'stage-preview-doc';
      docEl.textContent = truncateText(msg.doc.label, 40);
      formStagePreview.appendChild(docEl);
    }
  }
}

function renderReasoning(conversation, index) {
  if (!detailReasoning) return;
  detailReasoning.innerHTML = '';

  const msg = conversation.messages[index];
  if (!msg || !msg.reasoning) {
    detailReasoning.innerHTML = '<div class="reason-empty">No reasoning captured for this message.</div>';
    return;
  }

  const reasoning = msg.reasoning;
  const fields = reasoning.fields || [];

  const cards = [];
  if (reasoning.ask) {
    cards.push({ title: 'What Penny asked', value: reasoning.ask });
  }
  if (reasoning.why) {
    cards.push({ title: 'Why it asked', value: reasoning.why });
  }
  if (reasoning.unlocks) {
    cards.push({ title: 'What it unlocks', value: reasoning.unlocks });
  }
  if (reasoning.rule) {
    cards.push({ title: 'Domain rule', value: reasoning.rule });
  }
  if (reasoning.differentiator) {
    cards.push({ title: 'Why it is smarter', value: reasoning.differentiator });
  }
  if (reasoning.language) {
    cards.push({ title: 'Language', value: reasoning.language });
  }

  cards.forEach((card) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'reason-card';

    const title = document.createElement('div');
    title.className = 'reason-title';
    title.textContent = card.title;

    const value = document.createElement('div');
    value.className = 'reason-value';
    value.textContent = card.value;

    cardEl.appendChild(title);
    cardEl.appendChild(value);

    if (fields.length && card.title === 'What it unlocks') {
      const tagWrap = document.createElement('div');
      tagWrap.className = 'reason-tags';
      fields.forEach((field) => {
        const tag = document.createElement('span');
        tag.className = 'reason-tag';
        tag.textContent = field;
        tagWrap.appendChild(tag);
      });
      cardEl.appendChild(tagWrap);
    }

    detailReasoning.appendChild(cardEl);
  });
}

function renderTimeline(conversation, index) {
  if (!detailTimeline) return;
  detailTimeline.innerHTML = '';

  conversation.messages.forEach((msg, idx) => {
    if (idx > index) return;
    const item = document.createElement('div');
    item.className = 'timeline-item';
    if (idx === index) {
      item.classList.add('active');
    }

    const header = document.createElement('button');
    header.type = 'button';
    header.className = `timeline-header ${msg.role}`;
    header.textContent = `${msg.role === 'agent' ? 'Agent' : 'Student'} - ${truncateText(msg.text, 80)}`;
    header.addEventListener('click', () => {
      lockConversation(conversation, idx);
    });

    const body = document.createElement('div');
    body.className = 'timeline-body';
    body.textContent = msg.text;

    item.appendChild(header);
    if (idx === index) {
      item.appendChild(body);
    }
    detailTimeline.appendChild(item);
  });
}

function renderAutoDocs(conversation) {
  if (!autoDocsEl) return;
  autoDocsEl.innerHTML = '';

  if (!conversation.docs || !conversation.docs.length) {
    const empty = document.createElement('div');
    empty.className = 'reason-empty';
    empty.textContent = 'No documents ingested yet.';
    autoDocsEl.appendChild(empty);
    renderTranscriptionLog(conversation);
    return;
  }

  conversation.docs.forEach((doc) => {
    const row = document.createElement('div');
    row.className = 'auto-doc';

    const left = document.createElement('div');
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'doc-link';
    link.textContent = doc.label;
    link.addEventListener('click', () => openAttachment(doc));
    left.appendChild(link);

    if (doc.fields && doc.fields.length) {
      const meta = document.createElement('div');
      meta.className = 'muted';
      meta.style.fontSize = '0.7rem';
      meta.textContent = `Fields: ${doc.fields.join(', ')}`;
      left.appendChild(meta);
    }

    const status = document.createElement('span');
    status.className = `auto-doc-status${doc.status === 'Needs Review' ? ' warn' : ''}`;
    status.textContent = doc.status;

    row.appendChild(left);
    row.appendChild(status);
    autoDocsEl.appendChild(row);
  });

  renderTranscriptionLog(conversation);
}

function addTranscriptionEntry(conversation, entry) {
  if (!conversation.logs) conversation.logs = [];
  conversation.logs.unshift(entry);
  if (activeConversationId === conversation.id) {
    renderTranscriptionLog(conversation);
  }
  return entry;
}

function updateTranscriptionEntry(conversation, entry, patch) {
  Object.assign(entry, patch);
  if (activeConversationId === conversation.id) {
    renderTranscriptionLog(conversation);
  }
}

function renderTranscriptionLog(conversation) {
  if (!transcriptionLog) return;
  transcriptionLog.innerHTML = '';

  if (!conversation.logs || !conversation.logs.length) {
    const empty = document.createElement('div');
    empty.className = 'reason-empty';
    empty.textContent = 'No extractions yet.';
    transcriptionLog.appendChild(empty);
    return;
  }

  conversation.logs.forEach((entry) => {
    const row = document.createElement('div');
    row.className = `transcription-row ${entry.state || 'info'}`;

    const top = document.createElement('div');
    top.className = 'log-row-top';

    const label = document.createElement('span');
    label.textContent = entry.text;
    top.appendChild(label);

    if (entry.link) {
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'log-link';
      link.textContent = entry.link.label;
      link.addEventListener('click', () => {
        if (entry.doc) {
          openAttachment(entry.doc);
        }
      });
      top.appendChild(link);
    }

    row.appendChild(top);

    if (entry.rawText) {
      const pre = document.createElement('pre');
      pre.textContent = entry.rawText;
      row.appendChild(pre);
    }

    transcriptionLog.appendChild(row);
  });
}

function setTranscriptionStatus(text) {
  if (!transcriptionStatus) return;
  transcriptionStatus.textContent = text;
  transcriptionStatus.style.display = text ? 'inline-flex' : 'none';
}

function openAttachment(doc) {
  if (!attachmentModal || !doc) return;
  if (attachmentTitle) attachmentTitle.textContent = doc.label || 'Attachment';
  const preview = doc.previewFile || doc.file;
  if (preview && preview.toLowerCase().endsWith('.pdf')) {
    if (attachmentFrame) {
      attachmentFrame.src = preview;
      attachmentFrame.style.display = 'block';
    }
    if (attachmentText) {
      attachmentText.textContent = '';
      attachmentText.style.display = 'none';
    }
  } else {
    if (attachmentFrame) {
      attachmentFrame.src = '';
      attachmentFrame.style.display = 'none';
    }
    if (attachmentText) {
      attachmentText.textContent = doc.rawText || 'No preview available.';
      attachmentText.style.display = 'block';
    }
  }
  attachmentModal.classList.add('open');
  setModalOpenState(true);
}

function closeAttachment() {
  if (!attachmentModal) return;
  attachmentModal.classList.remove('open');
  if (attachmentFrame) attachmentFrame.src = '';
  if (!detailModal || !detailModal.classList.contains('open')) {
    setModalOpenState(false);
  }
}

function parseTextToDelta(text) {
  const delta = {};
  const normalized = text.replace(/\s+/g, ' ');

  const saiMatch = normalized.match(/\b(Student Aid Index|SAI)\b[:\s]*(-?\d{1,5})/i);
  if (saiMatch) delta.sai = parseInt(saiMatch[2], 10);

  const gpaMatch = normalized.match(/\bGPA\b[:\s]*([0-4]\.\d{1,2})/i);
  if (gpaMatch) delta.gpa = parseFloat(gpaMatch[1]);

  const incomeMatch = normalized.match(/\b(AGI|Adjusted Gross Income|Household Income|Income)\b[:\s]*\$?([0-9,]{4,})/i);
  if (incomeMatch) delta.income = parseInt(incomeMatch[2].replace(/,/g, ''), 10);

  const nameMatch = normalized.match(/\b(Student Name|Legal Name|Student)\b[:\s]*([A-Za-z][A-Za-z .'-]{2,60})/i);
  if (nameMatch) {
    const candidate = nameMatch[2].trim();
    if (!/Aid Index|Submission|Summary/i.test(candidate)) {
      delta.name = candidate;
    }
  }

  const dependencyMatch = normalized.match(/\bDependency Status\b[:\s]*([A-Za-z- ]{4,20})/i);
  if (dependencyMatch) delta.dependencyStatus = dependencyMatch[1].trim();

  const veteranMatch = normalized.match(/\bVeteran\b[:\s]*([A-Za-z- ]{2,20})/i);
  if (veteranMatch) delta.veteran = veteranMatch[1].trim();

  const instMatch = normalized.match(/\bInstitution\b[:\s]*([A-Za-z0-9 ,.'&-]{3,60})/i);
  if (instMatch) delta.institution = instMatch[1].trim();

  const enrollMatch = normalized.match(/\b(enrollment status|enrolled)\b[:\s]*([A-Za-z- ]{4,20})/i);
  if (enrollMatch) delta.enrollmentStatus = enrollMatch[2].trim();

  return delta;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function upsertDoc(conversation, info) {
  if (!conversation.docs) conversation.docs = [];
  const existing = conversation.docs.find((doc) => doc.label === info.label);
  if (existing) {
    Object.assign(existing, info);
  } else {
    conversation.docs.push(info);
  }
  if (activeConversationId === conversation.id) {
    renderAutoDocs(conversation);
  }
}

function hydrateConversationDocs(conversation) {
  conversation.docs = [];
  conversation.logs = [];
  conversation.messages.forEach((msg) => {
    if (!msg.doc) return;
    const delta = parseTextToDelta(msg.doc.rawText || '');
    const fields = Object.keys(delta);
    conversation.docs.push({
      label: msg.doc.label,
      file: msg.doc.file,
      previewFile: msg.doc.previewFile,
      status: fields.length ? 'Parsed' : 'Needs Review',
      fields
    });
    conversation.logs.unshift({
      text: `Fields detected: ${fields.length ? fields.join(', ') : 'None'}`,
      state: fields.length ? 'success' : 'warn',
      doc: msg.doc
    });
    conversation.logs.unshift({
      text: `Raw text from ${msg.doc.label}`,
      state: 'info',
      rawText: msg.doc.rawText ? msg.doc.rawText.slice(0, 240) : '',
      doc: msg.doc
    });
  });
}

async function processDocumentPipeline({ conversation, doc }) {
  const displayLabel = doc.label;
  const linkLabel = doc.file?.split('/').pop() || doc.label;

  upsertDoc(conversation, {
    label: displayLabel,
    file: doc.file,
    previewFile: doc.previewFile,
    rawText: doc.rawText,
    status: 'Reading',
    fields: []
  });

  addTranscriptionEntry(conversation, {
    text: `Received ${displayLabel}`,
    state: 'info',
    link: doc.file ? { href: doc.file, label: linkLabel } : null,
    doc
  });

  setTranscriptionStatus('Transcribing...');
  const stageEntry = addTranscriptionEntry(conversation, {
    text: `Reading ${linkLabel}...`,
    state: 'loading',
    doc
  });

  const previousSubtitle = detailSubtitle.textContent;
  if (activeConversationId === conversation.id) {
    detailSubtitle.textContent = `Transcribing ${displayLabel}...`;
  }
  if (conversation.statusEl) {
    conversation.statusEl.textContent = 'Transcribing...';
    conversation.statusEl.classList.add('pending');
  }

  await delay(randomInt(500, 900));
  const text = (doc.rawText || '').trim();
  await delay(randomInt(350, 650));

  if (stageEntry) {
    updateTranscriptionEntry(conversation, stageEntry, {
      text: text ? `Text captured from ${linkLabel}.` : `No text captured from ${linkLabel}.`,
      state: text ? 'success' : 'warn'
    });
  }

  if (text) {
    const preview = text.length > 320 ? `${text.slice(0, 320)}...` : text;
    addTranscriptionEntry(conversation, {
      text: `Raw text from ${linkLabel}`,
      state: 'info',
      rawText: preview,
      doc
    });
  } else {
    addTranscriptionEntry(conversation, {
      text: `No text extracted from ${linkLabel}.`,
      state: 'warn',
      doc
    });
  }

  const delta = parseTextToDelta(text);
  const keys = Object.keys(delta);
  if (keys.length) {
    addTranscriptionEntry(conversation, {
      text: `Fields detected: ${keys.join(', ')}`,
      state: 'success',
      doc
    });
    upsertDoc(conversation, {
      label: displayLabel,
      file: doc.file,
      previewFile: doc.previewFile,
      rawText: doc.rawText,
      status: 'Parsed',
      fields: keys
    });
  } else {
    addTranscriptionEntry(conversation, {
      text: 'No structured fields detected.',
      state: 'warn',
      doc
    });
    upsertDoc(conversation, {
      label: displayLabel,
      file: doc.file,
      previewFile: doc.previewFile,
      rawText: doc.rawText,
      status: 'Needs Review',
      fields: []
    });
  }

  setTranscriptionStatus('');
  if (activeConversationId === conversation.id) {
    detailSubtitle.textContent = previousSubtitle;
  }
  if (conversation.statusEl) {
    conversation.statusEl.textContent = 'In Progress';
    conversation.statusEl.classList.remove('pending');
  }

  return { text, delta };
}

async function simulateDocProcessing(conversation, doc, index) {
  if (!doc) return;
  const result = await processDocumentPipeline({ conversation, doc });
  if (result?.delta) {
    applyDeltaToSnapshots(conversation, index, result.delta);
    if (activeConversationId === conversation.id) {
      renderFormState(conversation, index);
    }
  }
}

function getSpawnDelay() {
  const base = randomInt(18000, 26000);
  return Math.max(5200, Math.floor(base / Math.max(1, agentsCount)));
}

function formatAgentsLabel(count) {
  return `${count} agent${count === 1 ? '' : 's'}`;
}

function getBurstCount() {
  return Math.min(4, Math.max(1, agentsCount));
}

function startSimulation() {
  updateMetrics();

  let nameIndex = 0;
  let spawnCounter = 0;

  const createInstance = () => {
    const studentName = UNIQUE_NAMES[nameIndex % UNIQUE_NAMES.length];
    nameIndex += 1;
    const studentType = pickRandom(STUDENT_TYPES);
    const complete = Math.random() > 0.35;
    const aidValue = randomInt(4000, 18000);
    const scenario = buildScenario(studentName, studentType, complete, aidValue);

    spawnCounter += 1;
    scenario.id = `conv_live_${spawnCounter}`;
    scenario.renderedIndex = -1;
    scenario.docs = [];
    scenario.logs = [];
    scenario.createdAt = Date.now();
    conversationMap.set(scenario.id, scenario);
    return scenario;
  };

  const initialBurst = getBurstCount();
  const burstSpacing = 2400;
  for (let i = 0; i < initialBurst; i += 1) {
    const conv = createInstance();
    setTimeout(() => spawnConversation(conv), i * burstSpacing);
  }

  const launchNext = () => {
    const conv = createInstance();
    spawnConversation(conv);
    const delayTime = getSpawnDelay();
    setTimeout(launchNext, delayTime);
  };

  setTimeout(launchNext, initialBurst * burstSpacing);
}

function seedPastConversations() {
  if (!pastStreamsEl) return;
  const pastCount = 5;
  for (let i = 0; i < pastCount; i += 1) {
    const studentName = UNIQUE_NAMES[(i + 40) % UNIQUE_NAMES.length];
    const studentType = pickRandom(STUDENT_TYPES);
    const complete = Math.random() > 0.4;
    const aidValue = randomInt(5000, 16000);
    const scenario = buildScenario(studentName, studentType, complete, aidValue);
    scenario.id = `conv_past_${i + 1}`;
    scenario.renderedIndex = scenario.messages.length - 1;
    hydrateConversationDocs(scenario);
    scenario.createdAt = Date.now() - randomInt(1, 20) * 86400000;
    conversationMap.set(scenario.id, scenario);
    renderPastConversation(scenario);
    addCompletionMetrics(scenario);
  }
  applyPastFilters();
}

if (modalBackdrop) {
  modalBackdrop.addEventListener('click', () => unlockConversation());
}

if (attachmentBackdrop) {
  attachmentBackdrop.addEventListener('click', () => closeAttachment());
}

if (attachmentClose) {
  attachmentClose.addEventListener('click', () => closeAttachment());
}

setTranscriptionStatus('');
seedPastConversations();
startSimulation();
updateImpactMetrics(true);

if (modalPanel) {
  bindNestedScroll(detailMessages, modalPanel);
  bindNestedScroll(detailFormBody, modalPanel);
  bindNestedScroll(detailReasoning, modalPanel);
  bindNestedScroll(transcriptionLog, modalPanel);
  modalPanel.addEventListener('wheel', (event) => {
    event.stopPropagation();
  }, { passive: true });
}

if (liveStreamsEl) {
  liveStreamsEl.addEventListener('scroll', () => hideHoverTooltip());
}

if (pastStreamsEl) {
  pastStreamsEl.addEventListener('scroll', () => hideHoverTooltip());
}

if (detailMessages) {
  detailMessages.addEventListener('scroll', () => {
    transcriptAutoScroll = isTranscriptNearBottom();
  });
}

if (jumpButtons.length && modalBody && modalPanel) {
  jumpButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.jump === 'latest') {
        if (!activeConversationId) return;
        const conv = conversationMap.get(activeConversationId);
        if (!conv) return;
        const lastIndex = Math.max(0, conv.messages.length - 1);
        lockConversation(conv, lastIndex);
        return;
      }

      const target = btn.dataset.jump === 'sources' ? sourcesSection : rationaleSection;
      if (!target) return;
      const offset = target.getBoundingClientRect().top - modalPanel.getBoundingClientRect().top;
      modalPanel.scrollTop += offset - 8;
    });
  });
}

if (agentsRange && agentsValue) {
  agentsValue.textContent = formatAgentsLabel(agentsCount);
  agentsRange.addEventListener('input', () => {
    agentsCount = parseInt(agentsRange.value, 10);
    agentsValue.textContent = formatAgentsLabel(agentsCount);
    maxLiveRows = 18 + agentsCount * 2;
  });
}

[filterStatus, filterLanguage, filterAttachments, filterCompletion, filterRecency].forEach((filter) => {
  if (!filter) return;
  filter.addEventListener('change', applyPastFilters);
});




















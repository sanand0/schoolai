let OPENROUTER_API_KEY = localStorage.getItem('openrouter_api_key') || '';
const OPENROUTER_MODEL = 'openai/gpt-5.2';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_APP_NAME = 'Penny+ Financial Aid Demo';
const USE_LLM = true;
const AWARD_YEAR = '2026-27';
const PELL_MAX_AWARD = 7395;
const PELL_MIN_AWARD = 740;

const SYSTEM_PROMPT =
  'You are a SNHU Financial Aid Advisor Agent. You must ask only necessary questions, explain why each question matters, infer multiple fields when possible, be concise but authoritative, use structured outputs when filling fields, and never behave like a generic chatbot.';

const SOURCE_LIBRARY = {
  fsa_dependency: {
    title: 'Federal Student Aid: Dependency status criteria (Financial Aid Dictionary)',
    url: 'https://dcc-app-int.studentaid.gov/articles/financial-aid-dictionary/'
  },
  fsa_loan_limits: {
    title: 'Federal Student Aid: Subsidized vs. Unsubsidized Loans (annual loan limits)',
    url: 'https://studentaid.gov/articles/subsidized-vs-unsubsidized-loans/'
  },
  fsa_sai: {
    title: 'Federal Student Aid: Student Aid Index (SAI) definition (Financial Aid Dictionary)',
    url: 'https://dcc-app-int.studentaid.gov/articles/financial-aid-dictionary/'
  },
  fsa_pell_2026_27: {
    title: 'Federal Student Aid: 2026-27 Pell Grant maximum and minimum awards',
    url: 'https://fsapartners.ed.gov/knowledge-center/library/dear-colleague-letters/2026-01-30/2026-27-federal-pell-grant-maximum-and-minimum-award-amounts'
  },
  va_education: {
    title: 'VA: Education and training benefits overview',
    url: 'https://www.va.gov/education'
  },
  va_gibill: {
    title: 'VA: Post-9/11 GI Bill (Chapter 33) overview',
    url: 'https://www.va.gov/education/about-gi-bill-benefits/post-9-11'
  },
  lender_salliemae: {
    title: 'Sallie Mae: Private student loans',
    url: 'https://www.salliemae.com/student-loans/'
  },
  lender_sofi: {
    title: 'SoFi: Private student loans',
    url: 'https://www.sofi.com/private-student-loans/'
  },
  lender_collegeave: {
    title: 'College Ave: Private student loans',
    url: 'https://www.collegeavestudentloans.com/'
  },
  lender_earnest: {
    title: 'Earnest: Private student loans',
    url: 'https://www.earnest.com/student-loans/'
  }
};

const SOURCE_ORDER = Object.keys(SOURCE_LIBRARY);
const SOURCE_TAGS = SOURCE_ORDER.reduce((acc, key, idx) => {
  acc[key] = `S${idx + 1}`;
  return acc;
}, {});

const LENDER_LIBRARY = [
  {
    name: 'Sallie Mae',
    source: 'lender_salliemae',
    note: 'Private student loans with multiple repayment options.'
  },
  {
    name: 'SoFi',
    source: 'lender_sofi',
    note: 'Private student loans with member benefits and career support.'
  },
  {
    name: 'College Ave',
    source: 'lender_collegeave',
    note: 'Private student loans with flexible terms.'
  },
  {
    name: 'Earnest',
    source: 'lender_earnest',
    note: 'Private student loans with flexible repayment terms.'
  }
];

const FEDERAL_LOAN_LIMITS = {
  dependent: {
    year1: { total: 5500, subsidized: 3500 },
    year2: { total: 6500, subsidized: 4500 },
    year3: { total: 7500, subsidized: 5500 }
  },
  independent: {
    year1: { total: 9500, subsidized: 3500 },
    year2: { total: 10500, subsidized: 4500 },
    year3: { total: 12500, subsidized: 5500 }
  },
  graduate: {
    annualUnsubsidized: 20500
  }
};


const state = {
  lang: 'en',
  profile: {
    name: null,
    dateOfBirth: null,
    ssnMasked: null,
    email: null,
    phone: null,
    address: null,
    citizenshipStatus: null,
    age: null,
    maritalStatus: null,
    veteran: null,
    activeDuty: null,
    hasDependents: null,
    fosterWard: null,
    legalGuardianship: null,
    emancipatedMinor: null,
    homeless: null,
    programLevel: null,
    gradeLevel: null,
    sai: null,
    familySize: null,
    branch: null,
    serviceYears: null,
    dischargeStatus: null,
    income: null,
    schoolList: null,
    enrollmentStatus: null,
    gpa: null,
    institution: null,
    contributorEmail: null
  },
  derived: {
    dependencyStatus: null,
    federalAidEligible: null,
    veteranBenefits: null,
    giBillEligible: null,
    militaryTuitionAssist: null,
    priorityProcessing: null,
    fafsaSection: null,
    contributorInvite: null,
    signatureStatus: null,
    pellEligible: null,
    meritEligible: null
  },
  fields: [],
  rules: [],
  inferences: [],
  extracted: [],
  summary: '',
  recommendations: [],
  checklist: [],
  sourceRegistry: { ...SOURCE_LIBRARY },
  docCounter: 0,
  skippedFields: new Set(),
  currentQuestion: null,
  pendingQuestions: [],
  loanRecommendationSent: false,
  lastLoanKey: null,
  completionSent: false,
  handoffActive: false,
  handoffOffered: false,
  documentsRequested: false,
  dd214Requested: false,
  studentAidSynced: false,
  veteranAutofillAnnounced: false
};

const QUESTION_ORDER = [
  'name',
  'age',
  'maritalStatus',
  'veteran',
  'activeDuty',
  'hasDependents',
  'fosterWard',
  'legalGuardianship',
  'emancipatedMinor',
  'homeless',
  'programLevel',
  'gradeLevel',
  'sai',
  'familySize',
  'income',
  'enrollmentStatus',
  'contributorEmail'
];

const FORM_FIELDS = [
  'name',
  'dateOfBirth',
  'ssnMasked',
  'email',
  'phone',
  'address',
  'citizenshipStatus',
  'age',
  'maritalStatus',
  'veteran',
  'activeDuty',
  'hasDependents',
  'fosterWard',
  'legalGuardianship',
  'emancipatedMinor',
  'homeless',
  'programLevel',
  'gradeLevel',
  'branch',
  'serviceYears',
  'dischargeStatus',
  'dependencyStatus',
  'fafsaSection',
  'income',
  'sai',
  'familySize',
  'pellEligible',
  'meritEligible',
  'schoolList',
  'institution',
  'enrollmentStatus',
  'gpa',
  'contributorInvite',
  'contributorEmail',
  'signatureStatus',
  'federalAidEligible',
  'veteranBenefits',
  'giBillEligible',
  'militaryTuitionAssist',
  'priorityProcessing'
];

const FORM_SECTIONS = [
  {
    titleKey: 'formSections.identity',
    fields: ['name', 'dateOfBirth', 'ssnMasked', 'email', 'phone', 'address']
  },
  {
    titleKey: 'formSections.personal',
    fields: [
      'maritalStatus',
      'veteran',
      'activeDuty',
      'hasDependents',
      'fosterWard',
      'legalGuardianship',
      'emancipatedMinor',
      'homeless',
      'programLevel',
      'gradeLevel',
      'dependencyStatus',
      'fafsaSection'
    ]
  },
  {
    titleKey: 'formSections.demographics',
    fields: ['citizenshipStatus']
  },
  {
    titleKey: 'formSections.financial',
    fields: ['income', 'sai', 'familySize']
  },
  {
    titleKey: 'formSections.schools',
    fields: ['schoolList', 'institution', 'enrollmentStatus', 'gpa']
  },
  {
    titleKey: 'formSections.contributor',
    fields: ['contributorInvite', 'contributorEmail']
  },
  {
    titleKey: 'formSections.signature',
    fields: ['signatureStatus']
  },
  {
    titleKey: 'formSections.military',
    fields: ['branch', 'serviceYears', 'dischargeStatus', 'veteranBenefits', 'giBillEligible', 'militaryTuitionAssist', 'priorityProcessing']
  },
  {
    titleKey: 'formSections.outcomes',
    fields: ['pellEligible', 'meritEligible', 'federalAidEligible']
  }
];

const DISTRESS_KEYWORDS = [
  'stressed',
  'overwhelmed',
  'anxious',
  'anxiety',
  'panic',
  'panicking',
  'crying',
  'upset',
  'frustrated',
  'angry',
  'freaking out',
  'help me',
  "can't",
  'cannot',
  'no puedo',
  'estresado',
  'estresada',
  'agobiado',
  'agobiada',
  'ansioso',
  'ansiosa',
  'panico',
  'llorando',
  'triste',
  'frustrado',
  'frustrada',
  'enojado',
  'enojada',
  'ayuda'
];

const i18n = {
  en: {
    ui: {
      upload: 'Upload Document',
      downloadPdf: 'Download PDF Summary',
      send: 'Send',
      placeholder: 'Type your response...',
      reasoningTitle: 'Agent Reasoning Panel',
      reasoningSubtitle: 'Transparent audit trail of fields, rules, and inferences.',
      confidence: 'Confidence',
      fieldsTitle: 'Fields Filled',
      rulesTitle: 'Rules Applied',
      inferencesTitle: 'Inferences',
      extractedTitle: 'Extracted Data',
      recommendationsTitle: 'Loan Recommendations',
      formTitle: 'Financial Aid Form Preview',
      checklistTitle: 'Completion Checklist',
      summaryTitle: 'Financial Aid Completion Summary',
      sourcesTitle: 'Sources & Citations',
      statusPending: 'Pending',
      statusComplete: 'Complete',
      statusProvided: 'Provided by student',
      statusAutoFilled: 'Auto-filled by rules',
      statusDocument: 'Extracted from document',
      statusAccount: 'Synced from StudentAid.gov',
      emptyFields: 'No fields filled yet.',
      emptyRules: 'No rules applied yet.',
      emptyInferences: 'No inferences yet.',
      emptyExtracted: 'No documents processed yet.',
      emptyRecommendations: 'Recommendations will appear after key details are captured.',
      emptyChecklist: 'Checklist will appear once we have a few answers.',
      emptySources: 'Sources will appear as rules and recommendations are applied.',
      emptySummary: 'Summary will appear after completion.',
      skipAck: 'No problem. We can circle back later.'
    },
    formSections: {
      identity: 'Student Identity (StudentAid.gov)',
      personal: 'Personal Circumstances',
      demographics: 'Demographics',
      financial: 'Financials',
      schools: 'Colleges & Career Schools',
      contributor: 'Contributor Invite',
      signature: 'Signature',
      military: 'Military & Veteran Benefits (SNHU add-on)',
      outcomes: 'Aid Outcomes (Agent)'
    },
    greeting:
      "Hi! I'm Penny+, your SNHU Financial Aid Advisor Agent. I'll ask only what matters and explain why. Ready to start your aid application?",
    languageSwitched: 'Got it. Continuing in English.',
    accountSyncMessage: 'I pulled your StudentAid.gov profile to pre-fill identity fields (DOB, contact info, masked SSN).',
    handoff: {
      offer: 'Would you like me to connect you to a live Straive support specialist?',
      connecting: 'Connecting you now to a live Straive support specialist (24/7). Tech is the hand; our human team is the heart.',
      connected: 'You are now connected to a live Straive support specialist.',
      declined: 'No problem. I can stay with you or connect you anytime.',
      already: 'A live Straive support specialist is already on the way.',
      statusConnected: 'Connected'
    },
    postCompletion: {
      nextSteps: 'Next steps: submit your FAFSA, upload any missing documents, and confirm your enrollment status.',
      ask: 'Would you like a human support specialist to walk you through anything?'
    },
    checklist: {
      account: 'Create or confirm your StudentAid.gov account',
      fafsa: 'Complete FAFSA for award year',
      fss: 'Review your FAFSA Submission Summary (SAI)',
      contributor: 'Invite contributors (if required)',
      transcript: 'Upload official transcript',
      tax: 'Upload tax document',
      aidOffer: 'Review and accept your aid offer',
      mpn: 'Complete Master Promissory Note and entrance counseling'
    },
    nextStepPrompt: 'To keep going, I just need one quick detail:',
    docRequests: {
      intro: 'If you have these documents, upload them now and I can auto-fill additional FAFSA sections:',
      transcript: 'Upload your transcript. I can extract GPA, enrollment status, and institution so you do not have to type them.',
      tax: 'Upload a recent tax document and I can prefill household income verification.',
      dd214: 'If available, upload your DD-214 to validate veteran benefits.',
      fafsaSummary: 'Upload your FAFSA Submission Summary to capture your Student Aid Index (SAI).'
    },
    docNames: {
      transcript: 'Transcript',
      tax: 'Recent tax document',
      dd214: 'DD-214',
      fafsaSummary: 'FAFSA Submission Summary'
    },
    autofillVeteranPrefix: 'Because you are a veteran, I can auto-fill these fields now:',
    questions: {
      name: 'What is your full legal name? (Needed to start your aid application.)',
      age: 'How old are you? (Age affects dependency status under federal aid rules.)',
      maritalStatus: 'What is your marital status: single or married? (Marriage can make you an independent student.)',
      veteran: 'Have you served in the U.S. military? (This affects dependency status and federal aid eligibility.)',
      activeDuty: 'Are you currently on active duty (not for training)? (Active duty can make you independent.)',
      hasDependents: 'Do you have legal dependents you support more than half the year (children or others besides a spouse)?',
      fosterWard: 'Were you ever in foster care or a ward of the court after age 13? (This affects dependency status.)',
      legalGuardianship: 'Are you or were you in legal guardianship (other than your parents)?',
      emancipatedMinor: 'Are you or were you an emancipated minor as determined by a court?',
      homeless: 'Are you homeless, at risk of homelessness, or in a self-supporting situation? (This affects dependency.)',
      programLevel: 'Are you applying as an undergraduate or graduate student?',
      gradeLevel: 'What is your current year in school (1st, 2nd, 3rd, or 4th+)?',
      sai: 'Do you have a Student Aid Index (SAI) from your FAFSA? If yes, share the number.',
      familySize: 'What is your household size? (Used for aid eligibility context.)',
      income: 'What is your annual household income? (Income influences Pell Grant eligibility.)',
      enrollmentStatus: 'Will you be full-time or part-time? (Enrollment status affects aid amounts.)',
      contributorEmail: 'If a contributor is required, what is their email address?',
      branch: 'Which branch did you serve in? (Used to align veteran benefits.)',
      serviceYears: 'How many years did you serve? (Used to verify veteran benefit options.)',
      dischargeStatus: 'What was your discharge status? (Certain benefits require honorable discharge.)'
    },
    clarifications: {
      name: 'Please share your full legal name.',
      age: 'Please provide your age as a number.',
      maritalStatus: 'Please reply with single or married.',
      veteran: 'Please reply yes or no.',
      activeDuty: 'Please reply yes or no for active duty.',
      hasDependents: 'Please reply yes or no for legal dependents.',
      fosterWard: 'Please reply yes or no for foster care or ward of court.',
      legalGuardianship: 'Please reply yes or no for legal guardianship.',
      emancipatedMinor: 'Please reply yes or no for emancipated minor status.',
      homeless: 'Please reply yes or no for homelessness or risk.',
      programLevel: 'Please reply undergraduate or graduate.',
      gradeLevel: 'Please reply 1st, 2nd, 3rd, or 4th+.',
      sai: 'Please provide the SAI number (it can be negative).',
      familySize: 'Please provide a household size number.',
      income: 'Please provide an annual income number.',
      enrollmentStatus: 'Please reply full-time or part-time.',
      contributorEmail: 'Please provide a valid email for the contributor.',
      branch: 'Please share the branch name (Army, Navy, Air Force, Marines, Coast Guard).',
      serviceYears: 'Please provide the number of years served.',
      dischargeStatus: 'Please share the discharge status (honorable, general, other).'
    },
    followupVeteran:
      'Thanks for your service. I will ask a few veteran-specific questions to determine benefits eligibility.',
    uploadUnsupported: 'That file type is not supported. Please upload a PDF or text document.',
    uploadProcessed: (gpa, institution) =>
      `I extracted GPA ${gpa.toFixed(2)} and institution ${institution} from the document.`,
    uploadTaxProcessed: (amount) => `Income verified from tax document: $${amount}.`,
    uploadDd214Processed: 'DD-214 verified. Veteran benefits can be processed faster.',
    uploadGenericProcessed: 'Document received. I will use it to verify eligibility.',
    loanRecommendation: (banks) =>
      `Based on your profile, I can research lenders and recommend: ${banks.join(', ')}.`,
    completionAgentLine:
      'Generic chatbots answer questions. This agent applied financial aid rules, document extraction, and human handoff logic to cut form completion time by 60%.',
    fieldLabels: {
      name: 'Student Name',
      dateOfBirth: 'Date of Birth',
      ssnMasked: 'SSN (Masked)',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      citizenshipStatus: 'Citizenship Status',
      age: 'Age',
      maritalStatus: 'Marital Status',
      veteran: 'Veteran Status',
      activeDuty: 'Active Duty Status',
      hasDependents: 'Legal Dependents',
      fosterWard: 'Foster Care/Ward of Court',
      legalGuardianship: 'Legal Guardianship',
      emancipatedMinor: 'Emancipated Minor',
      homeless: 'Homelessness Risk',
      programLevel: 'Program Level',
      gradeLevel: 'Year in School',
      branch: 'Service Branch',
      serviceYears: 'Service Years',
      dischargeStatus: 'Discharge Status',
      income: 'Household Income',
      sai: 'Student Aid Index (SAI)',
      familySize: 'Household Size',
      schoolList: 'School List',
      enrollmentStatus: 'Enrollment Status',
      gpa: 'GPA',
      institution: 'Institution',
      dependencyStatus: 'Dependency Status',
      federalAidEligible: 'Federal Aid Eligibility',
      veteranBenefits: 'Veteran Benefits',
      giBillEligible: 'GI Bill Eligibility',
      militaryTuitionAssist: 'Military Tuition Assistance',
      priorityProcessing: 'Priority Processing',
      fafsaSection: 'FAFSA Section',
      contributorInvite: 'Contributor Invite',
      contributorEmail: 'Contributor Email',
      signatureStatus: 'Signature Status',
      pellEligible: 'Pell Grant Eligibility',
      meritEligible: 'Merit-Based Aid Eligibility',
      transcriptData: 'Transcript Data',
      humanSupportStatus: 'Human Support Status',
      documentRequests: 'Document Requests',
      autoFillBatch: 'Auto-Filled Fields'
    },
    reasons: {
      userInput: 'Captured directly from student input',
      titleIV: 'Based on Title IV guidelines, the student meets independent criteria.',
      veteranAid: 'Veterans generally qualify under federal aid guidelines.',
      veteranBenefits: 'Service history triggers veteran benefits review.',
      giBill: 'Veteran status qualifies for GI Bill review.',
      militaryTuitionAssist: 'Veteran status qualifies for military tuition assistance review.',
      priorityProcessing: 'Veteran status triggers priority processing.',
      fafsaSection: 'Independent classification determines the FAFSA section.',
      pell: 'Pell eligibility is based on SAI and cost of attendance.',
      merit: 'GPA evaluated for merit-based aid.',
      sai: 'SAI is used to estimate federal aid eligibility.',
      dependency: 'Independent status determined by federal dependency criteria.',
      loanLimits: 'Federal loan limits depend on dependency status and grade level.',
      pellAward: 'Pell maximum and minimum awards are published for the award year.',
      transcript: 'Extracted from uploaded transcript',
      parsing: 'Simulated document parsing pipeline',
      docRequest: 'Documents allow auto-fill and verification.',
      autoFillBatch: 'Single answer triggered multiple field completions.',
      accountSync: 'Synced from StudentAid.gov account record.',
      contributorInvite: 'Dependency status determines whether a contributor is required.',
      dependent: 'Under 24, not married, not veteran: dependent by federal aid rules.',
      signature: 'All required sections completed; ready for e-sign.',
      loan: 'Banks A and B typically offer favorable rates to independent students with GPA above 3.0.',
      distress: 'Student distress detected; escalating to human support.',
      handoffRequest: 'Student requested human support.'
    },
    values: {
      independent: 'Independent',
      eligible: 'Eligible',
      notEligible: 'Not eligible',
      likelyEligible: 'Likely eligible',
      possible: 'Possible',
      yes: 'Yes',
      no: 'No',
      required: 'Required',
      notRequired: 'Not required',
      readyToSign: 'Ready for e-sign',
      dependent: 'Dependent',
      independentSection: 'Independent section',
      undergraduate: 'Undergraduate',
      graduate: 'Graduate'
    },
    rules: {
      dependency: 'If age >= 24 OR ex-military OR married then Independent',
      dependencyExpanded: 'Independent if age >= 24, married, veteran/active duty, has dependents, foster/ward, guardianship, emancipated minor, homeless risk, or graduate program',
      federalAid: 'If ex-military then Federal Aid Eligible',
      veteranBenefits: 'If ex-military then Veteran Benefits Eligible',
      giBill: 'If ex-military then GI Bill eligibility review',
      militaryTuitionAssist: 'If ex-military then Military Tuition Assistance review',
      priorityProcessing: 'If ex-military then Priority Processing',
      fafsaSection: 'If Independent then FAFSA Independent section',
      contributorInvite: 'If Independent then Contributor Invite not required',
      dependent: 'If age < 24 and not married and not veteran then Dependent',
      signature: 'If intake complete then Signature ready',
      pell: 'Pell eligibility is determined by SAI and cost of attendance',
      merit: 'If GPA >= 3.0 then Merit Aid Eligible',
      loanLimits: 'Federal loan limits vary by dependency status and grade level',
      loan: 'Loan options by dependency status and GPA',
      handoff: 'If distress detected then escalate to human support'
    },
    completion: {
      headline: 'Financial Aid Completion Summary',
      name: 'Name',
      dependency: 'Dependency',
      pell: 'Pell',
      merit: 'Merit Aid',
      veteran: 'Veteran Benefits',
      actions: 'Recommended Actions: Submit FAFSA, review your FAFSA Submission Summary, and upload any remaining documents.',
      autoFilledLabel: 'Auto-filled fields',
      missingDocs: 'Missing Documents',
      awardYear: 'Award Year',
      sai: 'Student Aid Index (SAI)',
      loanLimits: 'Federal Loan Limits (Annual)',
      none: 'None',
      transcript: 'Official transcript',
      pending: 'Pending',
      notApplicable: 'Not applicable'
    }
  },
  es: {
    ui: {
      upload: 'Subir documento',
      downloadPdf: 'Descargar resumen en PDF',
      send: 'Enviar',
      placeholder: 'Escribe tu respuesta...',
      reasoningTitle: 'Panel de Razonamiento del Agente',
      reasoningSubtitle: 'Historial transparente de campos, reglas e inferencias.',
      confidence: 'Confianza',
      fieldsTitle: 'Campos completados',
      rulesTitle: 'Reglas aplicadas',
      inferencesTitle: 'Inferencias',
      extractedTitle: 'Datos extraidos',
      recommendationsTitle: 'Recomendaciones de prestamos',
      formTitle: 'Vista previa del formulario de ayuda financiera',
      checklistTitle: 'Lista de verificacion',
      summaryTitle: 'Resumen de Ayuda Financiera',
      sourcesTitle: 'Fuentes y citas',
      statusPending: 'Pendiente',
      statusComplete: 'Completo',
      statusProvided: 'Proporcionado por estudiante',
      statusAutoFilled: 'Auto-completado por reglas',
      statusDocument: 'Extraido del documento',
      statusAccount: 'Sincronizado desde StudentAid.gov',
      emptyFields: 'Aun no hay campos completados.',
      emptyRules: 'Aun no hay reglas aplicadas.',
      emptyInferences: 'Aun no hay inferencias.',
      emptyExtracted: 'Aun no hay documentos procesados.',
      emptyRecommendations: 'Las recomendaciones apareceran despues de capturar datos clave.',
      emptyChecklist: 'La lista aparecera cuando tengamos algunas respuestas.',
      emptySources: 'Las fuentes apareceran cuando se apliquen reglas y recomendaciones.',
      emptySummary: 'El resumen aparecera al finalizar.',
      skipAck: 'No hay problema. Podemos retomarlo despues.'
    },
    formSections: {
      identity: 'Identidad del estudiante (StudentAid.gov)',
      personal: 'Circunstancias personales',
      demographics: 'Demografia',
      financial: 'Finanzas',
      schools: 'Universidades y escuelas',
      contributor: 'Invitacion al contribuyente',
      signature: 'Firma',
      military: 'Beneficios militares y de veterano (extra SNHU)',
      outcomes: 'Resultados de ayuda (Agente)'
    },
    greeting:
      'Hola! Soy Penny+, tu Agente de Ayuda Financiera de SNHU. Preguntare solo lo necesario y explicare por que. Listo para comenzar?',
    languageSwitched: 'Entendido. Continuo en espanol.',
    accountSyncMessage: 'Tome tu perfil de StudentAid.gov para prellenar identidad (fecha de nacimiento, contacto y SSN enmascarado).',
    handoff: {
      offer: 'Quieres que te conecte con un especialista humano de Straive?',
      connecting: 'Te estoy conectando ahora con un especialista humano de Straive (24/7). La tecnologia es la mano; el equipo humano es el corazon.',
      connected: 'Ahora estas conectado con un especialista humano de Straive.',
      declined: 'Entendido. Puedo quedarme contigo o conectarte cuando quieras.',
      already: 'Un especialista humano de Straive ya viene en camino.',
      statusConnected: 'Conectado'
    },
    postCompletion: {
      nextSteps: 'Siguientes pasos: envia tu FAFSA, sube los documentos faltantes y confirma tu estatus de inscripcion.',
      ask: 'Quieres que un especialista humano te ayude con algo?'
    },
    checklist: {
      account: 'Crear o confirmar tu cuenta en StudentAid.gov',
      fafsa: 'Completar FAFSA para el ano',
      fss: 'Revisar el FAFSA Submission Summary (SAI)',
      contributor: 'Invitar contribuyentes (si aplica)',
      transcript: 'Subir transcript oficial',
      tax: 'Subir documento de impuestos',
      aidOffer: 'Revisar y aceptar la oferta de ayuda',
      mpn: 'Completar Master Promissory Note y consejeria de entrada'
    },
    nextStepPrompt: 'Para continuar, solo necesito un detalle rapido:',
    docRequests: {
      intro: 'Si tienes estos documentos, subelos ahora y puedo completar mas secciones del FAFSA:',
      transcript: 'Sube tu transcript. Puedo extraer GPA, estatus de inscripcion e institucion para no tener que escribirlos.',
      tax: 'Sube un documento de impuestos reciente y puedo prellenar verificacion de ingresos del hogar.',
      dd214: 'Si lo tienes, sube tu DD-214 para validar beneficios de veterano.',
      fafsaSummary: 'Sube tu FAFSA Submission Summary para capturar tu Student Aid Index (SAI).'
    },
    docNames: {
      transcript: 'Transcript',
      tax: 'Documento de impuestos reciente',
      dd214: 'DD-214',
      fafsaSummary: 'FAFSA Submission Summary'
    },
    autofillVeteranPrefix: 'Como eres veterano, puedo completar estos campos ahora:',
    questions: {
      name: 'Cual es tu nombre legal completo? (Se necesita para iniciar la solicitud.)',
      age: 'Cuantos anos tienes? (La edad afecta el estatus de dependencia.)',
      maritalStatus: 'Cual es tu estado civil: soltero o casado? (El matrimonio puede hacerte independiente.)',
      veteran: 'Has servido en el ejercito de EE.UU.? (Afecta dependencia y elegibilidad.)',
      activeDuty: 'Estas en servicio activo actualmente (no entrenamiento)? (Servicio activo puede hacerte independiente.)',
      hasDependents: 'Tienes dependientes legales a tu cargo mas de la mitad del ano (hijos u otros, excepto conyuge)?',
      fosterWard: 'Estuviste en cuidado foster o fuiste tutelado por la corte despues de los 13 anos?',
      legalGuardianship: 'Estas o estuviste en tutela legal (no de tus padres)?',
      emancipatedMinor: 'Eres o fuiste menor emancipado por una corte?',
      homeless: 'Estas sin hogar, en riesgo de quedarte sin hogar o en situacion de auto sustento?',
      programLevel: 'Aplicas como estudiante de pregrado o posgrado?',
      gradeLevel: 'En que ano escolar estas (1er, 2do, 3ro, o 4to+)?',
      sai: 'Tienes un Student Aid Index (SAI) de tu FAFSA? Si si, comparte el numero.',
      familySize: 'Cual es el tamano de tu hogar? (Se usa para contexto de elegibilidad.)',
      income: 'Cual es tu ingreso anual del hogar? (El ingreso influye en la beca Pell.)',
      enrollmentStatus: 'Estudiaras tiempo completo o medio tiempo? (El estatus afecta el monto de ayuda.)',
      contributorEmail: 'Si se requiere un contribuyente, cual es su correo?',
      branch: 'En que rama serviste? (Se usa para beneficios de veteranos.)',
      serviceYears: 'Cuantos anos serviste? (Se usa para verificar beneficios.)',
      dischargeStatus: 'Cual fue tu estatus de baja? (Algunos beneficios requieren baja honorable.)'
    },
    clarifications: {
      name: 'Comparte tu nombre legal completo.',
      age: 'Por favor indica tu edad con un numero.',
      maritalStatus: 'Responde soltero o casado.',
      veteran: 'Responde si o no.',
      activeDuty: 'Responde si o no para servicio activo.',
      hasDependents: 'Responde si o no para dependientes legales.',
      fosterWard: 'Responde si o no para cuidado foster o tutela.',
      legalGuardianship: 'Responde si o no para tutela legal.',
      emancipatedMinor: 'Responde si o no para menor emancipado.',
      homeless: 'Responde si o no para falta de vivienda o riesgo.',
      programLevel: 'Responde pregrado o posgrado.',
      gradeLevel: 'Responde 1er, 2do, 3ro, o 4to+.',
      sai: 'Proporciona el numero de SAI (puede ser negativo).',
      familySize: 'Proporciona un numero de tamano del hogar.',
      income: 'Indica un numero de ingreso anual.',
      enrollmentStatus: 'Responde tiempo completo o medio tiempo.',
      contributorEmail: 'Proporciona un correo valido del contribuyente.',
      branch: 'Comparte la rama (Army, Navy, Air Force, Marines, Coast Guard).',
      serviceYears: 'Indica el numero de anos de servicio.',
      dischargeStatus: 'Indica el estatus de baja (honorable, general, otro).'
    },
    followupVeteran:
      'Gracias por tu servicio. Hare unas preguntas especificas para beneficios de veteranos.',
    uploadUnsupported: 'Ese tipo de archivo no es compatible. Sube un PDF o documento de texto.',
    uploadProcessed: (gpa, institution) =>
      `Extraje GPA ${gpa.toFixed(2)} e institucion ${institution} del documento.`,
    uploadTaxProcessed: (amount) => `Ingreso verificado desde el documento de impuestos: $${amount}.`,
    uploadDd214Processed: 'DD-214 verificado. Los beneficios de veterano se pueden procesar mas rapido.',
    uploadGenericProcessed: 'Documento recibido. Lo usare para verificar elegibilidad.',
    loanRecommendation: (banks) =>
      `Segun tu perfil, puedo investigar prestamistas y recomendar: ${banks.join(', ')}.`,
    completionAgentLine:
      'Los chatbots genericos responden preguntas. Este agente aplico reglas de ayuda financiera, extraccion de documentos y escalamiento humano para reducir el tiempo de formulario en 60%.',
    fieldLabels: {
      name: 'Nombre del estudiante',
      dateOfBirth: 'Fecha de nacimiento',
      ssnMasked: 'SSN (Enmascarado)',
      email: 'Correo electronico',
      phone: 'Telefono',
      address: 'Direccion',
      citizenshipStatus: 'Estatus de ciudadania',
      age: 'Edad',
      maritalStatus: 'Estado civil',
      veteran: 'Estatus de veterano',
      activeDuty: 'Servicio activo',
      hasDependents: 'Dependientes legales',
      fosterWard: 'Cuidado foster/Tutela',
      legalGuardianship: 'Tutela legal',
      emancipatedMinor: 'Menor emancipado',
      homeless: 'Riesgo de falta de vivienda',
      programLevel: 'Nivel de programa',
      gradeLevel: 'Ano escolar',
      branch: 'Rama de servicio',
      serviceYears: 'Anos de servicio',
      dischargeStatus: 'Estatus de baja',
      income: 'Ingreso del hogar',
      sai: 'Student Aid Index (SAI)',
      familySize: 'Tamano del hogar',
      schoolList: 'Lista de escuelas',
      enrollmentStatus: 'Estatus de inscripcion',
      gpa: 'GPA',
      institution: 'Institucion',
      dependencyStatus: 'Estatus de dependencia',
      federalAidEligible: 'Elegibilidad de ayuda federal',
      veteranBenefits: 'Beneficios de veterano',
      giBillEligible: 'Elegibilidad GI Bill',
      militaryTuitionAssist: 'Asistencia de matricula militar',
      priorityProcessing: 'Procesamiento prioritario',
      fafsaSection: 'Seccion FAFSA',
      contributorInvite: 'Invitacion al contribuyente',
      contributorEmail: 'Correo del contribuyente',
      signatureStatus: 'Estatus de firma',
      pellEligible: 'Elegibilidad para Pell',
      meritEligible: 'Elegibilidad de merito',
      transcriptData: 'Datos de transcript',
      humanSupportStatus: 'Estado de soporte humano',
      documentRequests: 'Solicitudes de documentos',
      autoFillBatch: 'Campos auto-completados'
    },
    reasons: {
      userInput: 'Capturado directamente del estudiante',
      titleIV: 'Basado en guias Title IV, el estudiante es independiente.',
      veteranAid: 'Los veteranos suelen calificar bajo guias federales.',
      veteranBenefits: 'El historial de servicio activa revision de beneficios.',
      giBill: 'El estatus de veterano califica para revision de GI Bill.',
      militaryTuitionAssist: 'El estatus de veterano califica para asistencia de matricula militar.',
      priorityProcessing: 'El estatus de veterano activa procesamiento prioritario.',
      fafsaSection: 'La clasificacion independiente determina la seccion FAFSA.',
      pell: 'La elegibilidad Pell se basa en el SAI y el costo de asistencia.',
      merit: 'GPA evaluado para ayuda por merito.',
      sai: 'El SAI se usa para estimar elegibilidad de ayuda federal.',
      dependency: 'Estatus independiente determinado por criterios federales.',
      loanLimits: 'Los limites federales dependen de dependencia y nivel.',
      pellAward: 'Los montos maximo y minimo de Pell se publican por ano.',
      transcript: 'Extraido del expediente academico',
      parsing: 'Pipeline de extraccion simulado',
      docRequest: 'Los documentos permiten auto-completar y verificar.',
      autoFillBatch: 'Una sola respuesta completo varios campos.',
      accountSync: 'Sincronizado desde el registro de StudentAid.gov.',
      contributorInvite: 'El estatus de dependencia determina si se requiere contribuyente.',
      dependent: 'Menor de 24, no casado, no veterano: dependiente por reglas federales.',
      signature: 'Secciones requeridas completas; listo para firma.',
      loan: 'Bancos A y B suelen ofrecer mejores tasas a independientes con GPA mayor a 3.0.',
      distress: 'Se detecto estres del estudiante; escalando a soporte humano.',
      handoffRequest: 'El estudiante solicito soporte humano.'
    },
    values: {
      independent: 'Independiente',
      eligible: 'Elegible',
      notEligible: 'No elegible',
      likelyEligible: 'Probablemente elegible',
      possible: 'Posible',
      yes: 'Si',
      no: 'No',
      required: 'Requerido',
      notRequired: 'No requerido',
      readyToSign: 'Listo para firmar',
      dependent: 'Dependiente',
      independentSection: 'Seccion independiente',
      undergraduate: 'Pregrado',
      graduate: 'Posgrado'
    },
    rules: {
      dependency: 'Si edad >= 24 o ex-militar o casado entonces Independiente',
      dependencyExpanded: 'Independiente si edad >= 24, casado, veterano/activo, dependientes, foster/tutela, menor emancipado, riesgo de falta de vivienda o posgrado',
      federalAid: 'Si ex-militar entonces Elegible para ayuda federal',
      veteranBenefits: 'Si ex-militar entonces Beneficios de veterano',
      giBill: 'Si ex-militar entonces revision de GI Bill',
      militaryTuitionAssist: 'Si ex-militar entonces revision de asistencia de matricula militar',
      priorityProcessing: 'Si ex-militar entonces procesamiento prioritario',
      fafsaSection: 'Si Independiente entonces seccion FAFSA independiente',
      contributorInvite: 'Si Independiente entonces contribuyente no requerido',
      dependent: 'Si edad < 24 y no casado y no veterano entonces Dependiente',
      signature: 'Si intake completo entonces firma lista',
      pell: 'La elegibilidad Pell depende del SAI y el costo de asistencia',
      merit: 'Si GPA >= 3.0 entonces Merito elegible',
      loanLimits: 'Los limites federales varian por dependencia y nivel',
      loan: 'Opciones de prestamo por dependencia y GPA',
      handoff: 'Si se detecta estres entonces escalar a soporte humano'
    },
    completion: {
      headline: 'Resumen de Ayuda Financiera',
      name: 'Nombre',
      dependency: 'Dependencia',
      pell: 'Pell',
      merit: 'Merito',
      veteran: 'Beneficios de veterano',
      actions: 'Acciones recomendadas: Enviar FAFSA, revisar el FAFSA Submission Summary y subir documentos faltantes.',
      autoFilledLabel: 'Campos auto-completados',
      missingDocs: 'Documentos faltantes',
      awardYear: 'Ano de ayuda',
      sai: 'Student Aid Index (SAI)',
      loanLimits: 'Limites federales (anuales)',
      none: 'Ninguno',
      transcript: 'Transcript oficial',
      pending: 'Pendiente',
      notApplicable: 'No aplica'
    }
  }
};

const chatWindow = document.getElementById('chatWindow');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const fileInput = document.getElementById('fileInput');
const langEn = document.getElementById('langEn');
const langEs = document.getElementById('langEs');
const uploadLabel = document.getElementById('uploadLabel');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const apiKeyBtn = document.getElementById('apiKeyBtn');
const apiKeyModal = document.getElementById('api-key-modal');
const apiKeyInput = document.getElementById('apiKeyInput');
const apiKeySaveBtn = document.getElementById('apiKeySaveBtn');
const apiKeyCancelBtn = document.getElementById('apiKeyCancelBtn');
const apiKeyCloseBtn = document.getElementById('api-key-close-btn');

const reasoningTitle = document.getElementById('reasoningTitle');
const reasoningSubtitle = document.getElementById('reasoningSubtitle');
const confidenceLabel = document.getElementById('confidenceLabel');
const fieldsTitle = document.getElementById('fieldsTitle');
const rulesTitle = document.getElementById('rulesTitle');
const inferencesTitle = document.getElementById('inferencesTitle');
const extractedTitle = document.getElementById('extractedTitle');
const recommendationsTitle = document.getElementById('recommendationsTitle');
const formTitle = document.getElementById('formTitle');
const checklistTitle = document.getElementById('checklistTitle');
const summaryTitle = document.getElementById('summaryTitle');
const sourcesTitle = document.getElementById('sourcesTitle');

const fieldsList = document.getElementById('fieldsList');
const rulesList = document.getElementById('rulesList');
const inferencesList = document.getElementById('inferencesList');
const extractedList = document.getElementById('extractedList');
const recommendationsList = document.getElementById('recommendationsList');
const formPreview = document.getElementById('formPreview');
const checklistList = document.getElementById('checklistList');
const confidenceScore = document.getElementById('confidenceScore');
const finalSummary = document.getElementById('finalSummary');
const sourcesList = document.getElementById('sourcesList');

let agentMessageQueue = Promise.resolve();

sendBtn.addEventListener('click', handleUserInput);
userInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleUserInput();
  }
});
fileInput.addEventListener('change', handleFileUpload);
langEn.addEventListener('click', () => setLanguage('en', true));
langEs.addEventListener('click', () => setLanguage('es', true));
downloadPdfBtn.addEventListener('click', downloadSummaryPdf);
apiKeyBtn.addEventListener('click', () => {
  openApiKeyModal();
});
apiKeySaveBtn.addEventListener('click', saveApiKey);
apiKeyCancelBtn.addEventListener('click', closeApiKeyModal);
apiKeyCloseBtn.addEventListener('click', closeApiKeyModal);
apiKeyModal.addEventListener('click', (event) => {
  if (event.target?.dataset?.close === 'api-key') {
    closeApiKeyModal();
  }
});

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function t(path) {
  const parts = path.split('.');
  let value = i18n[state.lang];
  for (const part of parts) {
    value = value[part];
  }
  return value;
}

function appendMessage(role, text) {
  const message = document.createElement('div');
  message.className = `message ${role}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendLoadingMessage() {
  const message = document.createElement('div');
  message.className = 'message agent loading';
  message.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

async function generateAgentMessage(draft) {
  if (!USE_LLM || !hasValidApiKey()) return draft;
  const language = state.lang === 'es' ? 'Spanish' : 'English';
  const messages = [
    {
      role: 'system',
      content:
        `${SYSTEM_PROMPT} You rephrase draft agent messages while preserving meaning and required options.`
    },
    {
      role: 'user',
      content:
        `Rewrite the draft message for the student in ${language}. ` +
        'Return only the rewritten message and nothing else. ' +
        'Do not add new facts. Preserve all numbers, names, and any explicit answer options verbatim. ' +
        'If the draft includes line breaks, keep them. If it is a question, keep it a question. ' +
        `Draft: """${draft}"""`
    }
  ];

  const response = await callLLM(messages, { temperature: 0.4 });
  return response || draft;
}

function addMessage(role, text, options = {}) {
  const { skipLLM = false } = options;
  if (role !== 'agent') {
    appendMessage(role, text);
    return Promise.resolve();
  }

  if (skipLLM || !USE_LLM || !hasValidApiKey()) {
    appendMessage(role, text);
    return Promise.resolve();
  }

  const loadingEl = appendLoadingMessage();

  agentMessageQueue = agentMessageQueue
    .then(async () => {
      const rewritten = await generateAgentMessage(text);
      loadingEl.textContent = rewritten;
      loadingEl.classList.remove('loading');
    })
    .catch((error) => {
      console.error(error);
      loadingEl.textContent = text;
      loadingEl.classList.remove('loading');
    });

  return agentMessageQueue;
}

function setLanguage(lang, announce) {
  state.lang = lang;
  langEn.classList.toggle('active', lang === 'en');
  langEs.classList.toggle('active', lang === 'es');

  const ui = i18n[lang].ui;
  uploadLabel.textContent = ui.upload;
  downloadPdfBtn.textContent = ui.downloadPdf;
  sendBtn.textContent = ui.send;
  userInput.placeholder = ui.placeholder;
  reasoningTitle.textContent = ui.reasoningTitle;
  reasoningSubtitle.textContent = ui.reasoningSubtitle;
  confidenceLabel.textContent = ui.confidence;
  fieldsTitle.textContent = ui.fieldsTitle;
  rulesTitle.textContent = ui.rulesTitle;
  inferencesTitle.textContent = ui.inferencesTitle;
  extractedTitle.textContent = ui.extractedTitle;
  recommendationsTitle.textContent = ui.recommendationsTitle;
  formTitle.textContent = ui.formTitle;
  checklistTitle.textContent = ui.checklistTitle;
  summaryTitle.textContent = ui.summaryTitle;
  sourcesTitle.textContent = ui.sourcesTitle;

  updateReasoningPanel();

  if (announce) {
    addMessage('agent', t('languageSwitched'));
    askNextQuestion();
  }
}

function detectLanguageSwitch(text) {
  const normalized = normalizeText(text);
  if (normalized.includes('prefiero espanol') || normalized.includes('espanol') || normalized.includes('spanish')) {
    setLanguage('es', true);
    return true;
  }
  if (normalized.includes('english') || normalized.includes('ingles')) {
    setLanguage('en', true);
    return true;
  }
  return false;
}

function detectDistress(text) {
  const normalized = normalizeText(text);
  return DISTRESS_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function isNextQuestionRequest(text) {
  const normalized = normalizeText(text);
  return (
    normalized.includes('what next') ||
    normalized.includes("what's next") ||
    normalized.includes('next step') ||
    normalized === 'next' ||
    normalized.includes('que sigue') ||
    normalized.includes('y luego')
  );
}

function isAffirmative(text) {
  const normalized = normalizeText(text);
  return (
    normalized.includes('yes') ||
    normalized.includes('yeah') ||
    normalized.includes('yep') ||
    normalized.includes('sure') ||
    normalized.includes('ok') ||
    normalized.includes('please') ||
    normalized.includes('si') ||
    normalized.includes('claro') ||
    normalized.includes('por favor')
  );
}

function isNegative(text) {
  const normalized = normalizeText(text);
  return (
    normalized.includes('no') ||
    normalized.includes('not now') ||
    normalized.includes('later') ||
    normalized.includes('no thanks') ||
    normalized.includes('no gracias')
  );
}

function isSkipResponse(text) {
  const normalized = normalizeText(text);
  return (
    normalized.includes('skip') ||
    normalized.includes('dont know') ||
    normalized.includes("don't know") ||
    normalized.includes('unknown') ||
    normalized.includes('no se') ||
    normalized.includes('no sé')
  );
}

function detectHumanRequest(text) {
  const normalized = normalizeText(text);
  return (
    normalized.includes('human') ||
    normalized.includes('representative') ||
    normalized.includes('agent') ||
    normalized.includes('someone') ||
    normalized.includes('person') ||
    normalized.includes('soporte humano') ||
    normalized.includes('persona') ||
    normalized.includes('representante')
  );
}

function isIndependentStatus() {
  const value = state.derived.dependencyStatus;
  return value === i18n.en.values.independent || value === i18n.es.values.independent;
}

function triggerHandoff(reasonType) {
  if (state.handoffActive) {
    addMessage('agent', t('handoff.already'));
    return;
  }

  state.handoffActive = true;
  state.handoffOffered = true;
  const reason = reasonType === 'distress' ? t('reasons.distress') : t('reasons.handoffRequest');

  state.fields.push({
    fieldKey: 'humanSupportStatus',
    value: t('handoff.statusConnected'),
    reason
  });

  state.rules.push({
    rule: t('rules.handoff'),
    result: t('handoff.statusConnected'),
    reason
  });

  updateReasoningPanel();
  addMessage('agent', t('handoff.connecting'));
}

function handlePostCompletion(text) {
  if (state.handoffActive) {
    addMessage('agent', t('handoff.already'));
    return;
  }

  if (!state.handoffOffered) {
    addMessage('agent', t('postCompletion.nextSteps'));
    addMessage('agent', t('postCompletion.ask'));
    state.handoffOffered = true;
    return;
  }

  if (isAffirmative(text)) {
    triggerHandoff('user');
    return;
  }

  if (isNegative(text)) {
    addMessage('agent', t('handoff.declined'));
    return;
  }

  addMessage('agent', t('postCompletion.ask'));
}

function handleUserInput() {
  const text = userInput.value.trim();
  if (!text) return;
  if (!hasValidApiKey()) {
    openApiKeyModal();
    return;
  }
  userInput.value = '';
  addMessage('user', text);

  if (detectLanguageSwitch(text)) {
    return;
  }

  if (detectDistress(text)) {
    triggerHandoff('distress');
    return;
  }

  if (detectHumanRequest(text)) {
    triggerHandoff('user');
    return;
  }

  if (state.completionSent) {
    handlePostCompletion(text);
    return;
  }

  if (state.handoffActive) {
    addMessage('agent', t('handoff.already'));
    return;
  }

  const questionId = state.currentQuestion;
  if (!questionId) {
    askNextQuestion();
    return;
  }

  if (isSkipResponse(text)) {
    state.skippedFields.add(questionId);
    addMessage('agent', t('ui.skipAck'));
    updateReasoningPanel();
    askNextQuestion();
    return;
  }

  if (isNextQuestionRequest(text)) {
    addMessage('agent', t('nextStepPrompt'));
    addMessage('agent', t(`questions.${questionId}`));
    return;
  }

  const parsed = parseAnswer(questionId, text);
  if (!parsed.ok) {
    addMessage('agent', t(`clarifications.${questionId}`));
    return;
  }

  applyFieldUpdate(questionId, parsed.value, t('reasons.userInput'));
  if (questionId === 'name') {
    syncStudentAidProfile();
  }
  handleSpecialBranches(questionId, parsed.value);
  applyDomainRules();
  maybeRequestDocuments();
  maybeRecommendLoans();
  updateReasoningPanel();
  askNextQuestion();
}

function parseYesNo(normalized) {
  if (
    normalized.includes('yes') ||
    normalized.includes('yeah') ||
    normalized.includes('yep') ||
    normalized.includes('si') ||
    normalized.includes('claro')
  ) {
    return true;
  }
  if (
    normalized.includes('no') ||
    normalized.includes('not') ||
    normalized.includes('nope') ||
    normalized.includes('nah')
  ) {
    return false;
  }
  return null;
}

function parseAnswer(questionId, text) {
  const normalized = normalizeText(text);
  const yesNo = parseYesNo(normalized);
  switch (questionId) {
    case 'name': {
      const match = text.match(/(?:i am|i'm|my name is|me llamo|soy)\s+([a-zA-Z\s'-]+)/i);
      const name = match ? match[1].trim() : text.trim();
      return name.length >= 2 ? { ok: true, value: name } : { ok: false };
    }
    case 'age': {
      const match = normalized.match(/(\d{2})/);
      return match ? { ok: true, value: parseInt(match[1], 10) } : { ok: false };
    }
    case 'maritalStatus': {
      if (normalized.includes('married') || normalized.includes('casado')) return { ok: true, value: 'Married' };
      if (normalized.includes('single') || normalized.includes('soltero')) return { ok: true, value: 'Single' };
      return { ok: false };
    }
    case 'veteran': {
      if (normalized.includes('veteran') || normalized.includes('military')) {
        return { ok: true, value: true };
      }
      if (yesNo !== null) return { ok: true, value: yesNo };
      return { ok: false };
    }
    case 'activeDuty':
    case 'hasDependents':
    case 'fosterWard':
    case 'legalGuardianship':
    case 'emancipatedMinor':
    case 'homeless': {
      return yesNo !== null ? { ok: true, value: yesNo } : { ok: false };
    }
    case 'programLevel': {
      if (normalized.includes('undergrad') || normalized.includes('bachelor') || normalized.includes('pregrado')) {
        return { ok: true, value: t('values.undergraduate') };
      }
      if (normalized.includes('grad') || normalized.includes('master') || normalized.includes('phd') || normalized.includes('posgrado')) {
        return { ok: true, value: t('values.graduate') };
      }
      return { ok: false };
    }
    case 'gradeLevel': {
      if (normalized.includes('1') || normalized.includes('first') || normalized.includes('freshman') || normalized.includes('1er')) {
        return { ok: true, value: 'year1' };
      }
      if (normalized.includes('2') || normalized.includes('second') || normalized.includes('sophomore') || normalized.includes('2do')) {
        return { ok: true, value: 'year2' };
      }
      if (normalized.includes('3') || normalized.includes('third') || normalized.includes('junior') || normalized.includes('senior') || normalized.includes('4')) {
        return { ok: true, value: 'year3' };
      }
      return { ok: false };
    }
    case 'sai': {
      const match = normalized.match(/-?\d{1,5}/);
      return match ? { ok: true, value: parseInt(match[0], 10) } : { ok: false };
    }
    case 'familySize': {
      const match = normalized.match(/(\d{1,2})/);
      return match ? { ok: true, value: parseInt(match[1], 10) } : { ok: false };
    }
    case 'income': {
      const match = normalized.replace(/,/g, '').match(/(\d{4,})/);
      return match ? { ok: true, value: parseInt(match[1], 10) } : { ok: false };
    }
    case 'contributorEmail': {
      const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
      return emailMatch ? { ok: true, value: emailMatch[0] } : { ok: false };
    }
    case 'enrollmentStatus': {
      if (normalized.includes('full') || normalized.includes('tiempo completo')) return { ok: true, value: 'Full-time' };
      if (normalized.includes('part') || normalized.includes('medio tiempo')) return { ok: true, value: 'Part-time' };
      return { ok: false };
    }
    case 'branch': {
      const branches = ['army', 'navy', 'air force', 'marines', 'coast guard'];
      const found = branches.find((branch) => normalized.includes(branch));
      return found ? { ok: true, value: titleCase(found) } : { ok: false };
    }
    case 'serviceYears': {
      const match = normalized.match(/(\d{1,2})/);
      return match ? { ok: true, value: parseInt(match[1], 10) } : { ok: false };
    }
    case 'dischargeStatus': {
      if (normalized.includes('honorable')) return { ok: true, value: 'Honorable' };
      if (normalized.includes('general')) return { ok: true, value: 'General' };
      if (normalized.includes('other') || normalized.includes('otro')) return { ok: true, value: 'Other' };
      return { ok: false };
    }
    default:
      return { ok: false };
  }
}

function titleCase(value) {
  return value
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function handleSpecialBranches(questionId, value) {
  if (questionId === 'veteran' && value === true) {
    addMessage('agent', t('followupVeteran'));
    state.pendingQuestions.push('branch', 'serviceYears', 'dischargeStatus');
    announceVeteranAutofill();
  }
}

function announceVeteranAutofill() {
  if (state.veteranAutofillAnnounced) return;

  const fields = [
    'dependencyStatus',
    'veteranBenefits',
    'giBillEligible',
    'fafsaSection',
    'contributorInvite'
  ];

  addMessage('agent', `${t('autofillVeteranPrefix')} ${fields.map(labelForField).join(', ')}.`);
  state.inferences.push({
    fieldKey: 'autoFillBatch',
    value: fields.map(labelForField),
    reason: t('reasons.autoFillBatch')
  });
  state.veteranAutofillAnnounced = true;
}

function maybeRequestDocuments() {
  if (!state.profile.name) return;
  if (state.profile.income === null && state.profile.veteran === null && state.profile.sai === null) return;

  if (state.documentsRequested) {
    if (state.profile.veteran === true && !state.dd214Requested) {
      addMessage('agent', t('docRequests.dd214'));
      state.inferences.push({
        fieldKey: 'documentRequests',
        value: [t('docNames.dd214')],
        reason: t('reasons.docRequest')
      });
      state.dd214Requested = true;
    }
    return;
  }

  const docs = [t('docNames.transcript'), t('docNames.tax')];
  if (state.profile.sai === null) {
    docs.push(t('docNames.fafsaSummary'));
  }
  if (state.profile.veteran === true) {
    docs.push(t('docNames.dd214'));
    state.dd214Requested = true;
  }

  addMessage('agent', t('docRequests.intro'));
  addMessage('agent', t('docRequests.transcript'));
  addMessage('agent', t('docRequests.tax'));
  if (state.profile.sai === null) {
    addMessage('agent', t('docRequests.fafsaSummary'));
  }
  if (state.profile.veteran === true) {
    addMessage('agent', t('docRequests.dd214'));
  }

  state.inferences.push({
    fieldKey: 'documentRequests',
    value: docs,
    reason: t('reasons.docRequest')
  });

  state.documentsRequested = true;
}

function applyFieldUpdate(field, value, reason, sources = []) {
  if (state.profile[field] === value) return;
  state.profile[field] = value;

  const entry = {
    fieldKey: field,
    value,
    reason,
    source: 'user',
    sources
  };
  state.fields.push(entry);
  state.inferences.push({
    fieldKey: field,
    value,
    reason,
    sources
  });
}

function applyAccountFieldUpdate(field, value, sources = []) {
  if (state.profile[field] === value) return;
  state.profile[field] = value;

  state.fields.push({
    fieldKey: field,
    value,
    reason: t('reasons.accountSync'),
    source: 'account',
    sources
  });
}

function calculateAge(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

function syncStudentAidProfile() {
  if (state.studentAidSynced || !state.profile.name) return;

  const nameParts = state.profile.name.split(' ');
  const first = nameParts[0]?.toLowerCase() || 'student';
  const last = nameParts[nameParts.length - 1]?.toLowerCase() || 'snhu';
  const email = `${first}.${last}@snhu.edu`;

  applyAccountFieldUpdate('dateOfBirth', '1999-04-12');
  applyAccountFieldUpdate('ssnMasked', '***-**-4821');
  applyAccountFieldUpdate('email', email);
  applyAccountFieldUpdate('phone', '(603) 555-0147');
  applyAccountFieldUpdate('address', '55 S. Main St, Manchester, NH 03101');
  applyAccountFieldUpdate('citizenshipStatus', 'U.S. Citizen');

  if (!state.profile.age) {
    const age = calculateAge('1999-04-12');
    if (age) {
      applyAccountFieldUpdate('age', age);
    }
  }

  state.studentAidSynced = true;
  addMessage('agent', t('accountSyncMessage'));
}

function applyDerivedField(field, value, reason, rule, sources = []) {
  if (state.derived[field] === value) return;
  state.derived[field] = value;
  state.fields.push({
    fieldKey: field,
    value,
    reason,
    source: 'rule',
    sources
  });
  if (rule) {
    state.rules.push({
      rule,
      result: value,
      reason,
      sources
    });
  } else {
    state.inferences.push({
      fieldKey: field,
      value,
      reason,
      sources
    });
  }
}

function applyDomainRules() {
  const age = state.profile.age;
  const veteran = state.profile.veteran;
  const activeDuty = state.profile.activeDuty;
  const marital = state.profile.maritalStatus;
  const income = state.profile.income;
  const sai = state.profile.sai;
  const gpa = state.profile.gpa;
  const hasDependents = state.profile.hasDependents;
  const fosterWard = state.profile.fosterWard;
  const legalGuardianship = state.profile.legalGuardianship;
  const emancipatedMinor = state.profile.emancipatedMinor;
  const homeless = state.profile.homeless;
  const programLevel = state.profile.programLevel;
  const values = t('values');

  const independentTriggers = [
    age !== null && age >= 24,
    marital === 'Married',
    veteran === true,
    activeDuty === true,
    hasDependents === true,
    fosterWard === true,
    legalGuardianship === true,
    emancipatedMinor === true,
    homeless === true,
    programLevel === values.graduate
  ];

  const anyIndependent = independentTriggers.some(Boolean);
  const dependencyInputs = [age, marital, veteran, activeDuty, hasDependents, fosterWard, legalGuardianship, emancipatedMinor, homeless, programLevel];
  const allDependencyKnown = dependencyInputs.every((value) => value !== null);

  if (anyIndependent) {
    applyDerivedField('dependencyStatus', values.independent, t('reasons.dependency'), t('rules.dependencyExpanded'), ['fsa_dependency']);
  } else if (allDependencyKnown && age !== null && age < 24) {
    applyDerivedField('dependencyStatus', values.dependent, t('reasons.dependent'), t('rules.dependent'), ['fsa_dependency']);
  }

  if (veteran === true || activeDuty === true) {
    applyDerivedField('veteranBenefits', values.eligible, t('reasons.veteranBenefits'), t('rules.veteranBenefits'), ['va_education']);
    applyDerivedField('giBillEligible', values.likelyEligible, t('reasons.giBill'), t('rules.giBill'), ['va_gibill']);
  }

  if (isIndependentStatus()) {
    applyDerivedField('fafsaSection', values.independentSection, t('reasons.fafsaSection'), t('rules.fafsaSection'), ['fsa_dependency']);
    applyDerivedField('contributorInvite', values.notRequired, t('reasons.contributorInvite'), t('rules.contributorInvite'), ['fsa_dependency']);
  } else if (state.derived.dependencyStatus) {
    applyDerivedField('contributorInvite', values.required, t('reasons.contributorInvite'), t('rules.contributorInvite'), ['fsa_dependency']);
  }

  if (Number.isFinite(sai)) {
    const pellEligible = sai <= 0 ? values.likelyEligible : values.possible;
    applyDerivedField('pellEligible', pellEligible, t('reasons.pell'), t('rules.pell'), ['fsa_sai', 'fsa_pell_2026_27']);
  }

}

function maybeRecommendLoans() {
  if (!state.derived.dependencyStatus || !state.profile.programLevel) return;
  if (state.profile.programLevel !== t('values.graduate') && !state.profile.gradeLevel) return;

  const isGraduate = state.profile.programLevel === t('values.graduate');
  const dependencyKey = isIndependentStatus() ? 'independent' : 'dependent';
  const gradeKey = state.profile.gradeLevel;
  const loanKey = `${dependencyKey}-${gradeKey}-${state.profile.programLevel}`;
  if (state.lastLoanKey === loanKey) return;
  const limits = isGraduate ? null : FEDERAL_LOAN_LIMITS[dependencyKey]?.[gradeKey];

  const recs = [];
  if (isGraduate) {
    recs.push({
      title: 'Graduate Direct Unsubsidized Loans (annual limit)',
      detail: `Graduate and professional students can borrow up to $${FEDERAL_LOAN_LIMITS.graduate.annualUnsubsidized.toLocaleString()} per year in Direct Unsubsidized Loans.`,
      items: [`Award year: ${AWARD_YEAR}`],
      sources: ['fsa_loan_limits']
    });
  } else if (limits) {
    recs.push({
      title: 'Federal Direct Loans (annual limits)',
      detail: `Based on ${dependencyKey} status and ${state.profile.gradeLevel} year, annual limits are up to $${limits.total.toLocaleString()} total, with up to $${limits.subsidized.toLocaleString()} subsidized.`,
      items: [`Award year: ${AWARD_YEAR}`],
      sources: ['fsa_loan_limits']
    });
  }

  const lenderItems = LENDER_LIBRARY.map((lender) => `${lender.name} — ${lender.note}`);
  recs.push({
    title: 'Private lender options (if you still have a gap)',
    detail: 'Compare rates, fees, and repayment protections. Consider a co-signer if offered.',
    items: lenderItems,
    sources: LENDER_LIBRARY.map((lender) => lender.source)
  });

  state.recommendations = recs;
  state.loanRecommendationSent = true;
  state.lastLoanKey = loanKey;
  state.rules.push({
    rule: t('rules.loanLimits'),
    result: isGraduate
      ? `$${FEDERAL_LOAN_LIMITS.graduate.annualUnsubsidized} annual unsubsidized`
      : limits
        ? `$${limits.total} total / $${limits.subsidized} subsidized`
        : 'Pending grade level',
    reason: t('reasons.loanLimits'),
    sources: ['fsa_loan_limits']
  });

  updateReasoningPanel();
  addMessage('agent', 'I updated your loan recommendations with current federal limits and sourced private lender options.');
}

function askNextQuestion() {
  if (state.completionSent) return;
  const next =
    state.pendingQuestions.shift() ||
    QUESTION_ORDER.find(
      (id) => state.profile[id] === null && !shouldSkipQuestion(id) && !state.skippedFields.has(id)
    );
  if (!next) {
    finalizeSummary();
    return;
  }
  state.currentQuestion = next;
  addMessage('agent', t(`questions.${next}`));
}

function shouldSkipQuestion(questionId) {
  if (questionId === 'gradeLevel' && state.profile.programLevel === t('values.graduate')) {
    return true;
  }
  if (questionId === 'contributorEmail' && state.derived.dependencyStatus !== t('values.dependent')) {
    return true;
  }
  return false;
}

function labelForField(field) {
  const labels = i18n[state.lang].fieldLabels;
  return labels[field] || field;
}

function updateReasoningPanel() {
  refreshChecklist();
  renderList(fieldsList, state.fields, t('ui.emptyFields'));
  renderList(rulesList, state.rules, t('ui.emptyRules'));
  renderList(inferencesList, state.inferences, t('ui.emptyInferences'));
  renderList(extractedList, state.extracted, t('ui.emptyExtracted'));
  renderRecommendations();
  renderFormPreview();
  renderChecklist();
  renderSummary();
  renderSources();
  updateConfidence();
}

function refreshChecklist() {
  const pending = t('ui.statusPending');
  const complete = t('ui.statusComplete');
  const checklistText = t('checklist');

  const checklist = [];
  checklist.push({
    label: checklistText.account,
    status: state.profile.name ? complete : pending
  });

  checklist.push({
    label: `${checklistText.fafsa} ${AWARD_YEAR}`,
    status: state.profile.name && state.profile.enrollmentStatus ? complete : pending,
    sources: ['fsa_dependency']
  });

  checklist.push({
    label: checklistText.fss,
    status: state.profile.sai !== null ? complete : pending,
    sources: ['fsa_sai']
  });

  if (state.derived.dependencyStatus) {
    checklist.push({
      label: checklistText.contributor,
      status: state.derived.dependencyStatus === t('values.dependent') && !state.profile.contributorEmail ? pending : complete,
      sources: ['fsa_dependency']
    });
  }

  checklist.push({
    label: checklistText.transcript,
    status: state.profile.gpa !== null || state.profile.institution !== null ? complete : pending
  });

  checklist.push({
    label: checklistText.tax,
    status: state.profile.income !== null ? complete : pending
  });

  checklist.push({
    label: checklistText.aidOffer,
    status: pending
  });

  checklist.push({
    label: checklistText.mpn,
    status: pending
  });

  state.checklist = checklist;
}

function renderList(element, items, emptyText) {
  element.innerHTML = '';
  if (!items.length) {
    element.textContent = emptyText;
    return;
  }
  items.slice(-6).forEach((item) => {
    const displayItem = { ...item };
    if (item.fieldKey) {
      displayItem.field = labelForField(item.fieldKey);
      delete displayItem.fieldKey;
    }
    if (item.sources && item.sources.length) {
      displayItem.sources = formatSourceTags(item.sources);
    }
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(displayItem, null, 2);
    element.appendChild(pre);
  });
}

function formatSourceTags(sourceIds) {
  return sourceIds
    .map((id) => {
      const entry = state.sourceRegistry[id];
      return entry?.tag || SOURCE_TAGS[id] || id;
    })
    .filter(Boolean)
    .join(', ');
}

function registerSource(id, source) {
  if (!state.sourceRegistry[id]) {
    state.sourceRegistry[id] = source;
  }
}

function collectSourceIds() {
  const ids = new Set();
  const pools = [state.fields, state.rules, state.inferences, state.extracted, state.recommendations, state.checklist];
  pools.forEach((pool) => {
    pool.forEach((item) => {
      if (item.sources) {
        item.sources.forEach((sourceId) => ids.add(sourceId));
      }
    });
  });
  return Array.from(ids);
}

function renderSources() {
  sourcesList.innerHTML = '';
  const sourceIds = collectSourceIds();
  if (!sourceIds.length) {
    sourcesList.textContent = t('ui.emptySources');
    return;
  }

  sourceIds
    .sort((a, b) => {
      const indexA = SOURCE_ORDER.indexOf(a);
      const indexB = SOURCE_ORDER.indexOf(b);
      const normalizedA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
      const normalizedB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
      return normalizedA - normalizedB;
    })
    .forEach((sourceId) => {
      const entry = state.sourceRegistry[sourceId];
      if (!entry) return;
      const row = document.createElement('div');
      const tag = entry.tag || SOURCE_TAGS[sourceId] || sourceId;
      if (entry.url) {
        row.innerHTML = `<strong>${tag}</strong> ${entry.title} — <a href="${entry.url}" target="_blank" rel="noopener noreferrer">${entry.url}</a>`;
      } else {
        row.innerHTML = `<strong>${tag}</strong> ${entry.title}`;
      }
      sourcesList.appendChild(row);
    });
}

function getFieldValue(fieldKey) {
  if (Object.prototype.hasOwnProperty.call(state.profile, fieldKey)) {
    return state.profile[fieldKey];
  }
  if (Object.prototype.hasOwnProperty.call(state.derived, fieldKey)) {
    return state.derived[fieldKey];
  }
  return null;
}

function getFieldSource(fieldKey) {
  if (Object.prototype.hasOwnProperty.call(state.derived, fieldKey)) {
    return 'rule';
  }
  const entry = [...state.fields].reverse().find((item) => item.fieldKey === fieldKey);
  return entry?.source || 'user';
}

function formatFieldValueForField(fieldKey, value) {
  if (value === null || value === undefined || value === '') return t('ui.statusPending');
  if (typeof value === 'boolean') return value ? t('values.yes') : t('values.no');
  if (fieldKey === 'gradeLevel') {
    if (state.lang === 'es') {
      if (value === 'year1') return '1er ano';
      if (value === 'year2') return '2do ano';
      if (value === 'year3') return '3er+ ano';
    }
    if (value === 'year1') return '1st year';
    if (value === 'year2') return '2nd year';
    if (value === 'year3') return '3rd+ year';
  }
  return String(value);
}

function renderFormPreview() {
  if (!formPreview) return;
  formPreview.innerHTML = '';

  FORM_SECTIONS.forEach((section) => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'form-section';

    const title = document.createElement('div');
    title.className = 'form-section-title';
    title.textContent = t(section.titleKey);
    sectionEl.appendChild(title);

    section.fields.forEach((fieldKey) => {
      const value = getFieldValue(fieldKey);
      const source = getFieldSource(fieldKey);
      const field = document.createElement('div');
      field.className = 'form-field';

      const label = document.createElement('div');
      label.className = 'form-label';
      label.textContent = labelForField(fieldKey);

      const displayValue = document.createElement('div');
      displayValue.className = 'form-value';
      displayValue.textContent = formatFieldValueForField(fieldKey, value);

      const meta = document.createElement('div');
      meta.className = 'form-meta';

      if (value === null || value === undefined || value === '') {
        meta.textContent = t('ui.statusPending');
      } else if (source === 'document') {
        meta.textContent = t('ui.statusDocument');
      } else if (source === 'rule') {
        meta.textContent = t('ui.statusAutoFilled');
      } else if (source === 'account') {
        meta.textContent = t('ui.statusAccount');
      } else {
        meta.textContent = t('ui.statusProvided');
      }

      field.appendChild(label);
      field.appendChild(displayValue);
      field.appendChild(meta);
      sectionEl.appendChild(field);
    });

    formPreview.appendChild(sectionEl);
  });
}

function updateConfidence() {
  const required = ['name', 'age', 'maritalStatus', 'veteran', 'programLevel', 'gradeLevel', 'enrollmentStatus'];
  const filled = required.filter((key) => state.profile[key] !== null).length;
  const optional = ['sai', 'familySize', 'income', 'gpa', 'institution'];
  const optionalFilled = optional.filter((key) => state.profile[key] !== null).length;
  const score = Math.round(((filled + optionalFilled) / (required.length + optional.length)) * 100);
  confidenceScore.textContent = `${score}%`;
}

function renderSummary() {
  if (!state.summary) {
    finalSummary.textContent = t('ui.emptySummary');
    return;
  }
  finalSummary.textContent = state.summary;
}

function renderRecommendations() {
  recommendationsList.innerHTML = '';
  if (!state.recommendations.length) {
    recommendationsList.textContent = t('ui.emptyRecommendations');
    return;
  }

  state.recommendations.forEach((rec) => {
    const block = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = rec.title;
    block.appendChild(title);

    if (rec.detail) {
      const detail = document.createElement('div');
      detail.textContent = rec.detail;
      block.appendChild(detail);
    }

    if (rec.items && rec.items.length) {
      const list = document.createElement('ul');
      list.style.margin = '0.4rem 0 0';
      list.style.paddingLeft = '1.1rem';
      rec.items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
      block.appendChild(list);
    }

    if (rec.sources && rec.sources.length) {
      const sources = document.createElement('div');
      sources.className = 'muted';
      sources.textContent = `Sources: ${formatSourceTags(rec.sources)}`;
      block.appendChild(sources);
    }

    recommendationsList.appendChild(block);
  });
}

function renderChecklist() {
  checklistList.innerHTML = '';
  if (!state.checklist.length) {
    checklistList.textContent = t('ui.emptyChecklist');
    return;
  }

  state.checklist.forEach((item) => {
    const row = document.createElement('div');
    const label = document.createElement('div');
    label.textContent = `${item.status} — ${item.label}`;
    row.appendChild(label);

    if (item.sources && item.sources.length) {
      const sources = document.createElement('div');
      sources.className = 'muted';
      sources.textContent = `Sources: ${formatSourceTags(item.sources)}`;
      row.appendChild(sources);
    }

    checklistList.appendChild(row);
  });
}

function countDerivedFields() {
  return Object.values(state.derived).filter((value) => value !== null).length;
}

function buildSummaryLines() {
  const completion = i18n[state.lang].completion;
  const missingDocs = [];
  if (!state.profile.gpa) missingDocs.push(completion.transcript);

  const dependencyTag = formatSourceTags(['fsa_dependency']);
  const saiTag = formatSourceTags(['fsa_sai']);
  const pellTag = formatSourceTags(['fsa_pell_2026_27']);
  const loanTag = formatSourceTags(['fsa_loan_limits']);

  const loanRec = state.recommendations.find(
    (rec) => rec.title.includes('Federal Direct Loans') || rec.title.includes('Graduate Direct Unsubsidized')
  );
  const loanDetail = loanRec?.detail || completion.pending;

  const pellLine = state.profile.sai === null
    ? `${completion.pell}: ${completion.pending} (${completion.sai} ${completion.pending}) [${saiTag}]`
    : `${completion.pell}: ${state.derived.pellEligible || completion.pending} (Max $${PELL_MAX_AWARD.toLocaleString()}, Min $${PELL_MIN_AWARD.toLocaleString()} for ${AWARD_YEAR}) [${pellTag}]`;

  return [
    `${completion.headline}:`,
    `${completion.name}: ${state.profile.name || completion.pending}`,
    `${completion.awardYear}: ${AWARD_YEAR}`,
    `${completion.dependency}: ${state.derived.dependencyStatus || completion.pending} [${dependencyTag}]`,
    pellLine,
    `${completion.merit}: ${state.derived.meritEligible || completion.pending}`,
    `${completion.veteran}: ${state.derived.veteranBenefits || completion.notApplicable}`,
    `${completion.loanLimits}: ${loanDetail} [${loanTag}]`,
    `${completion.autoFilledLabel}: ${countDerivedFields()}`,
    completion.actions,
    `${completion.missingDocs}: ${missingDocs.length ? missingDocs.join(', ') : completion.none}`
  ];
}

function finalizeSummary() {
  const summaryLines = buildSummaryLines();

  const values = t('values');
  applyDerivedField('signatureStatus', values.readyToSign, t('reasons.signature'), t('rules.signature'));

  state.summary = summaryLines.join('\n');
  addMessage('agent', summaryLines.join(' '));
  state.completionSent = true;
  updateReasoningPanel();
  void maybeGenerateLLMClosing();
}

function downloadSummaryPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    addMessage('agent', 'PDF engine not ready yet. Please try again in a moment.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 40;
  const maxWidth = 515;
  let y = 50;

  doc.setFont('Times', 'bold');
  doc.setFontSize(18);
  doc.text('Financial Aid Summary', margin, y);
  y += 24;

  doc.setFont('Times', 'normal');
  doc.setFontSize(11);
  const summaryLines = buildSummaryLines();
  summaryLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, maxWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 14 + 2;
  });

  y += 6;
  doc.setFont('Times', 'bold');
  doc.text('Checklist', margin, y);
  y += 18;
  doc.setFont('Times', 'normal');

  state.checklist.forEach((item) => {
    const row = `${item.status} — ${item.label}`;
    const wrapped = doc.splitTextToSize(row, maxWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 14 + 2;
  });

  y += 6;
  doc.setFont('Times', 'bold');
  doc.text('Sources', margin, y);
  y += 18;
  doc.setFont('Times', 'normal');

  const sourceIds = collectSourceIds().sort((a, b) => {
    const indexA = SOURCE_ORDER.indexOf(a);
    const indexB = SOURCE_ORDER.indexOf(b);
    const normalizedA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
    const normalizedB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
    return normalizedA - normalizedB;
  });

  sourceIds.forEach((sourceId) => {
    const entry = state.sourceRegistry[sourceId];
    if (!entry) return;
    const tag = entry.tag || SOURCE_TAGS[sourceId] || sourceId;
    const row = entry.url ? `${tag} ${entry.title} — ${entry.url}` : `${tag} ${entry.title}`;
    const wrapped = doc.splitTextToSize(row, maxWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 14 + 2;
  });

  doc.save('financial-aid-summary.pdf');
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const supported = /\.(pdf|txt|doc|docx)$/i.test(file.name);
  if (!supported) {
    addMessage('agent', t('uploadUnsupported'));
    return;
  }

  const sourceId = registerDocumentSource(file);

  try {
    const text = await extractTextFromFile(file);
    if (text && text.trim().length > 20) {
      const extracted = parseAidText(text, sourceId, file.name);
      if (!extracted) {
        const llmExtracted = await extractFieldsWithLLM(text, sourceId, file.name);
        if (!llmExtracted) {
          recordUnparsedDocument(file.name, sourceId, 'No structured fields detected.');
          addMessage('agent', t('uploadGenericProcessed'));
        }
      }
    } else {
      recordUnparsedDocument(file.name, sourceId, 'No extractable text detected. PDF/TXT files work best.');
      addMessage('agent', t('uploadGenericProcessed'));
    }
  } catch (error) {
    console.error(error);
    recordUnparsedDocument(file.name, sourceId, 'Document parsing failed.');
    addMessage('agent', t('uploadGenericProcessed'));
  }

  applyDomainRules();
  maybeRecommendLoans();
  updateReasoningPanel();
  fileInput.value = '';
}

function registerDocumentSource(file) {
  state.docCounter += 1;
  const safeId = `doc_${state.docCounter}`;
  registerSource(safeId, {
    title: `Uploaded document: ${file.name}`,
    url: null,
    tag: `D${state.docCounter}`
  });
  return safeId;
}

async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt')) {
    return await file.text();
  }
  if (name.endsWith('.pdf')) {
    return await extractTextFromPdf(file);
  }
  return '';
}

async function extractTextFromPdf(file) {
  if (!window.pdfjsLib) return '';
  const data = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    text += `${strings.join(' ')}\n`;
  }
  return text;
}

function applyDocumentFieldUpdate(field, value, reason, sourceId) {
  if (state.profile[field] === value) return;
  state.profile[field] = value;
  state.fields.push({
    fieldKey: field,
    value,
    reason,
    source: 'document',
    sources: [sourceId]
  });
}

function recordUnparsedDocument(fileName, sourceId, note) {
  state.extracted.push({
    fieldKey: 'documentRequests',
    value: { document: fileName, note },
    reason: t('reasons.parsing'),
    sources: [sourceId]
  });
}

function parseAidText(text, sourceId, fileName) {
  const normalized = text.replace(/\s+/g, ' ');
  const extracted = { document: fileName };
  const lowerName = fileName.toLowerCase();

  const gpaMatch = normalized.match(/\bGPA\b[:\s]*([0-4]\.\d{1,2})/i);
  if (gpaMatch) {
    extracted.gpa = parseFloat(gpaMatch[1]);
    applyDocumentFieldUpdate('gpa', extracted.gpa, t('reasons.transcript'), sourceId);
  }

  const institutionMatch = normalized.match(/\bInstitution\b[:\s]*([A-Za-z0-9 ,.'&-]{3,60})/i);
  if (institutionMatch) {
    extracted.institution = institutionMatch[1].trim();
    applyDocumentFieldUpdate('institution', extracted.institution, t('reasons.transcript'), sourceId);
    if (!state.profile.schoolList) {
      applyDocumentFieldUpdate('schoolList', extracted.institution, t('reasons.transcript'), sourceId);
    }
  }

  const enrollmentMatch = normalized.match(/\b(enrollment status|enrolled)\b[:\s]*([A-Za-z- ]{4,20})/i);
  if (enrollmentMatch) {
    extracted.enrollmentStatus = enrollmentMatch[2].trim();
    applyDocumentFieldUpdate('enrollmentStatus', extracted.enrollmentStatus, t('reasons.transcript'), sourceId);
  }

  const saiMatch = normalized.match(/\b(Student Aid Index|SAI)\b[:\s]*(-?\d{1,5})/i);
  if (saiMatch) {
    extracted.sai = parseInt(saiMatch[2], 10);
    applyDocumentFieldUpdate('sai', extracted.sai, t('reasons.sai'), sourceId);
  }

  const incomeMatch = normalized.match(/\b(AGI|Adjusted Gross Income|Income)\b[:\s]*\$?(\d{4,})/i);
  if (incomeMatch) {
    extracted.income = parseInt(incomeMatch[2], 10);
    applyDocumentFieldUpdate('income', extracted.income, t('reasons.docRequest'), sourceId);
  }

  if (lowerName.includes('dd214') || lowerName.includes('dd-214')) {
    extracted.veteran = true;
    applyDocumentFieldUpdate('veteran', true, t('reasons.docRequest'), sourceId);
    addMessage('agent', t('uploadDd214Processed'));
    announceVeteranAutofill();
  }

  if (Object.keys(extracted).length > 1) {
    state.extracted.push({
      fieldKey: 'documentRequests',
      value: extracted,
      reason: t('reasons.parsing'),
      sources: [sourceId]
    });
    if (extracted.gpa && extracted.institution) {
      addMessage('agent', t('uploadProcessed')(extracted.gpa, extracted.institution));
    } else if (extracted.income) {
      addMessage('agent', t('uploadTaxProcessed')(extracted.income));
    } else if (!lowerName.includes('dd214') && !lowerName.includes('dd-214')) {
      addMessage('agent', t('uploadGenericProcessed'));
    }
    return true;
  }

  return false;
}

async function extractFieldsWithLLM(text, sourceId, fileName) {
  if (!USE_LLM || !hasValidApiKey()) {
    return false;
  }

  const maxChars = 12000;
  const truncated = text.length > maxChars;
  const payloadText = truncated ? text.slice(0, maxChars) : text;

  const messages = [
    {
      role: 'system',
      content:
        'You extract structured fields from education or financial aid documents. ' +
        'Return ONLY valid JSON with the specified keys. Use null when not found.'
    },
    {
      role: 'user',
      content:
        'Extract the following fields if present: ' +
        'name, dateOfBirth (YYYY-MM-DD if possible), gpa (number), institution, enrollmentStatus (Full-time/Part-time), ' +
        'sai (integer), income (integer), veteran (true/false), branch, serviceYears (integer), dischargeStatus. ' +
        'Return JSON only. Document text:\n' +
        payloadText
    }
  ];

  try {
    const response = await callLLM(messages, { temperature: 0 });
    if (!response) return false;
    const jsonText = extractJson(response);
    if (!jsonText) return false;
    const data = JSON.parse(jsonText);

    let filled = 0;
    if (data.name) { applyDocumentFieldUpdate('name', String(data.name).trim(), t('reasons.parsing'), sourceId); filled += 1; }
    if (data.dateOfBirth) { applyDocumentFieldUpdate('dateOfBirth', String(data.dateOfBirth).trim(), t('reasons.parsing'), sourceId); filled += 1; }
    if (Number.isFinite(data.gpa)) { applyDocumentFieldUpdate('gpa', Number(data.gpa), t('reasons.parsing'), sourceId); filled += 1; }
    if (data.institution) {
      applyDocumentFieldUpdate('institution', String(data.institution).trim(), t('reasons.parsing'), sourceId);
      if (!state.profile.schoolList) {
        applyDocumentFieldUpdate('schoolList', String(data.institution).trim(), t('reasons.parsing'), sourceId);
      }
      filled += 1;
    }
    if (data.enrollmentStatus) { applyDocumentFieldUpdate('enrollmentStatus', normalizeEnrollmentStatus(data.enrollmentStatus), t('reasons.parsing'), sourceId); filled += 1; }
    if (Number.isFinite(data.sai)) { applyDocumentFieldUpdate('sai', Number(data.sai), t('reasons.sai'), sourceId); filled += 1; }
    if (Number.isFinite(data.income)) { applyDocumentFieldUpdate('income', Number(data.income), t('reasons.docRequest'), sourceId); filled += 1; }
    if (typeof data.veteran === 'boolean') { applyDocumentFieldUpdate('veteran', data.veteran, t('reasons.docRequest'), sourceId); filled += 1; }
    if (data.branch) { applyDocumentFieldUpdate('branch', String(data.branch).trim(), t('reasons.docRequest'), sourceId); filled += 1; }
    if (Number.isFinite(data.serviceYears)) { applyDocumentFieldUpdate('serviceYears', Number(data.serviceYears), t('reasons.docRequest'), sourceId); filled += 1; }
    if (data.dischargeStatus) { applyDocumentFieldUpdate('dischargeStatus', String(data.dischargeStatus).trim(), t('reasons.docRequest'), sourceId); filled += 1; }

    state.extracted.push({
      fieldKey: 'documentRequests',
      value: {
        document: fileName,
        method: 'LLM structured extraction',
        truncated
      },
      reason: t('reasons.parsing'),
      sources: [sourceId]
    });

    if (filled > 0) {
      addMessage('agent', 'I extracted fields from the document using structured parsing.');
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return '';
  return text.slice(start, end + 1);
}

function normalizeEnrollmentStatus(value) {
  const normalized = String(value).toLowerCase();
  if (normalized.includes('full')) return 'Full-time';
  if (normalized.includes('part')) return 'Part-time';
  return String(value).trim();
}

function hasValidApiKey() {
  return typeof OPENROUTER_API_KEY === 'string' &&
    OPENROUTER_API_KEY.startsWith('sk-or-') &&
    OPENROUTER_API_KEY.length > 20;
}

async function callLLM(messages, options = {}) {
  if (!hasValidApiKey()) {
    throw new Error('Missing OpenRouter API key.');
  }

  const { temperature = 0.2 } = options;
  const headers = {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'X-OpenRouter-Title': OPENROUTER_APP_NAME
  };

  const origin = window.location.origin;
  if (origin && origin !== 'null') {
    headers['HTTP-Referer'] = origin;
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

async function maybeGenerateLLMClosing() {
  if (!USE_LLM || !hasValidApiKey()) return;

  const language = state.lang === 'es' ? 'Spanish' : 'English';
  const payload = {
    profile: state.profile,
    derived: state.derived,
    recommendations: {
      pell: state.derived.pellEligible,
      merit: state.derived.meritEligible
    }
  };

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        `Create a concise closing message for the student in ${language}. ` +
        'Use 2 sentences. Thank them and summarize next steps. ' +
        `Data: ${JSON.stringify(payload)}`
    }
  ];

  try {
    const response = await callLLM(messages);
    if (response) {
      addMessage('agent', response, { skipLLM: true });
    }
  } catch (error) {
    console.error(error);
  }
}

function startDemo() {
  if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  setLanguage(state.lang, false);
  updateReasoningPanel();
  addMessage('agent', t('greeting'));
  askNextQuestion();
}

function openApiKeyModal() {
  apiKeyModal.classList.remove('hidden');
  apiKeyInput.value = '';
  apiKeyInput.focus();
}

function closeApiKeyModal() {
  apiKeyModal.classList.add('hidden');
}

function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) return;
  OPENROUTER_API_KEY = key;
  localStorage.setItem('openrouter_api_key', OPENROUTER_API_KEY);
  closeApiKeyModal();
}

startDemo();

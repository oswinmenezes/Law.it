/**
 * Prebuilt Indian Legal Cases for Quick Start
 * Includes: Writ, Bail, Constitutional, Medical Negligence, Family Law, and IP.
 */

const prebuiltCases = [
  {
    id: 'writ-article-226',
    case_title: 'Rajesh Kumar v. State of Maharashtra',
    court_type: 'Bombay High Court',
    description: 'Writ petition challenging arbitrary demolition of commercial establishment without due notice under municipal law.',
    difficulty: 'Medium',
    legal_issues: [
      'Maintainability of Writ under Article 226',
      'Violation of Natural Justice',
      'Right to Livelihood under Article 21',
      'Municipal Corporation Powers',
      'Alternative Remedy',
    ],
    facts: [
      'The Petitioner is the owner of a commercial shop in Andheri West, Mumbai, operating for the last 15 years.',
      'On 12.03.2025, the Municipal Corporation demolished the shop alleging unauthorized construction without issuing any prior notice.',
      'The Petitioner holds a valid trade license and has been paying property tax regularly.',
      'No show-cause notice was served before the demolition action.',
      'The Petitioner suffered a loss of approximately Rs. 50 lakhs due to the demolition.',
      'Similar shops in the vicinity were not subjected to demolition action.',
      'The Petitioner made a representation to the Municipal Commissioner which was not responded to.',
    ],
    timeline: [
      '2010 — Shop established with valid permissions',
      '2024 — Trade license renewed',
      '12.03.2025 — Demolition carried out without notice',
      '15.03.2025 — Representation submitted to Municipal Commissioner',
      '01.04.2025 — Writ Petition filed',
    ],
    procedural_history: [
      'No prior legal proceedings between the parties',
      'Representation to Municipal Commissioner went unanswered',
      'Writ petition filed directly before the High Court',
    ],
    relief_sought: [
      'Declaration that the demolition action is illegal, arbitrary, and violative of Article 14 and 21',
      'Direction to restore the demolished structure to its original condition',
      'Compensation of Rs. 50 lakhs for illegal demolition',
      'Direction to the Corporation to follow due process in future demolition actions',
    ],
    parties: {
      petitioner: 'Rajesh Kumar, Proprietor of M/s Kumar Enterprises',
      respondent: 'Municipal Corporation of Greater Mumbai through its Commissioner',
    },
    raw_text: `WRIT PETITION (L) NO. _____ OF 2025
IN THE HIGH COURT OF JUDICATURE AT BOMBAY
ORDINARY ORIGINAL CIVIL JURISDICTION

Rajesh Kumar, Proprietor of M/s Kumar Enterprises ... Petitioner
Vs.
Municipal Corporation of Greater Mumbai through its Commissioner ... Respondent

PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA

The Petitioner submits that he is the owner of a commercial establishment situated at Shop No. 12, Ground Floor, Paradise Complex, S.V. Road, Andheri West, Mumbai 400058...`,
    judge_personality: {
      temperament: 'stern',
      questioning_style: 'aggressive',
      patience_level: 'low',
    },
    opposing_strategy: {
      primary_attack: 'Alternative Remedy under the Municipal Act',
      style: 'procedural',
      aggression: 'high',
    },
  },
  {
    id: 'bail-application',
    case_title: 'State v. Anil Sharma (Bail Application)',
    court_type: 'Delhi High Court',
    description: 'Regular bail application in a case of alleged financial fraud under IPC and Prevention of Corruption Act.',
    difficulty: 'Hard',
    legal_issues: [
      'Bail under Section 439 CrPC',
      'Severity of Offence vs Personal Liberty',
      'Flight Risk Assessment',
      'Tampering with Evidence',
      'Parity with Co-accused',
      'Duration of Incarceration',
    ],
    facts: [
      'The accused Anil Sharma is a former Director of a public sector undertaking.',
      'He is accused of causing a loss of Rs. 120 crores to the exchequer through fraudulent procurement contracts.',
      'The FIR was registered by CBI on 15.01.2025 under Sections 420, 467, 468, 471 IPC read with Section 13(1)(d) of the Prevention of Corruption Act.',
      'The accused has been in judicial custody since 20.01.2025.',
      'Investigation is stated to be complete and chargesheet has been filed.',
      'Two co-accused in the same case have already been granted bail by the Trial Court.',
      'The accused is 62 years old and suffers from cardiac ailments requiring regular medical attention.',
    ],
    timeline: [
      '2019-2023 — Period of alleged fraudulent transactions',
      '15.01.2025 — FIR registered by CBI',
      '20.01.2025 — Accused arrested',
      '10.03.2025 — Chargesheet filed',
      '15.03.2025 — Bail rejected by Trial Court',
      '01.04.2025 — Bail application filed before High Court',
    ],
    procedural_history: [
      'FIR No. RC/2025/001 registered by CBI',
      'Bail rejected by Special CBI Court on 15.03.2025',
      'Present application under Section 439 CrPC before the High Court',
    ],
    relief_sought: [
      'Grant of regular bail on such terms and conditions as deemed appropriate',
      'Alternatively, interim bail on medical grounds',
    ],
    parties: {
      petitioner: 'Anil Sharma, former Director of National Infrastructure Ltd.',
      respondent: 'Central Bureau of Investigation through the State',
    },
    raw_text: `BAIL APPLICATION NO. _____ OF 2025
IN THE HIGH COURT OF DELHI AT NEW DELHI

Anil Sharma ... Applicant/Accused
Vs.
Central Bureau of Investigation ... Respondent...`,
    judge_personality: {
      temperament: 'balanced',
      questioning_style: 'probing',
      patience_level: 'moderate',
    },
    opposing_strategy: {
      primary_attack: 'Severity of economic offence and flight risk',
      style: 'aggressive',
      aggression: 'very high',
    },
  },
  {
    id: 'constitutional-challenge',
    case_title: 'Citizens for Digital Rights v. Union of India',
    court_type: 'Supreme Court of India',
    description: 'PIL challenging the constitutional validity of provisions mandating mass surveillance under the new Digital Security Act.',
    difficulty: 'Expert',
    legal_issues: [
      'Constitutional Validity under Article 14, 19, and 21',
      'Right to Privacy (Puttaswamy)',
      'Proportionality Doctrine',
      'State Surveillance and Fundamental Rights',
      'Maintainability of PIL',
      'Doctrine of Severability',
    ],
    facts: [
      'The Digital Security Act, 2024 was enacted by Parliament and received Presidential assent on 01.08.2024.',
      'Section 12 of the Act authorizes government agencies to intercept and monitor all digital communications without prior judicial authorization.',
      'Section 15 mandates telecom companies and internet service providers to install government surveillance equipment.',
      'The Petitioner is a registered NGO working on digital rights and privacy advocacy.',
      'Multiple experts have submitted that the provisions go beyond reasonable restrictions under Article 19(2).',
      'The Union has argued the provisions are necessary for national security.',
    ],
    timeline: [
      '01.08.2024 — Digital Security Act enacted',
      '01.10.2024 — Act comes into force',
      '15.11.2024 — PIL filed before Supreme Court',
    ],
    procedural_history: [
      'PIL filed directly before the Supreme Court under Article 32',
      'Notice issued to Union of India and all State Governments',
      'Matter is listed for final hearing',
    ],
    relief_sought: [
      'Declaration that Sections 12 and 15 of the Digital Security Act, 2024 are unconstitutional',
      'Interim stay on operation of the impugned provisions',
      'Direction to constitute an independent oversight mechanism for surveillance',
    ],
    parties: {
      petitioner: 'Citizens for Digital Rights, a registered NGO',
      respondent: 'Union of India through Secretary, Ministry of Home Affairs',
    },
    raw_text: `WRIT PETITION (CIVIL) NO. _____ OF 2024
IN THE SUPREME COURT OF INDIA...`,
    judge_personality: {
      temperament: 'intellectual',
      questioning_style: 'socratic',
      patience_level: 'moderate',
    },
    opposing_strategy: {
      primary_attack: 'National Security imperative and legislative competence',
      style: 'defensive',
      aggression: 'moderate',
    },
  },
  {
    id: 'medical-negligence',
    case_title: 'Sunita Devi v. LifeCare Super Specialty Hospital',
    court_type: 'State Consumer Commission',
    description: 'Consumer dispute alleging medical negligence leading to permanent disability after a routine gall bladder surgery.',
    difficulty: 'Medium',
    legal_issues: [
      'Definition of Deficiency in Service',
      'Res Ipsa Loquitur in Medical Negligence',
      'Bolam Test vs. Bolitho Test',
      'Quantum of Compensation',
      'Liability of Hospital for Consultant Doctors',
    ],
    facts: [
      'The Complainant was admitted for a routine laparoscopic cholecystectomy.',
      'Post-surgery, she complained of severe abdominal pain and bile leakage.',
      'It was later discovered that the surgeon inadvertently clipped the Common Bile Duct (CBD).',
      'The hospital failed to perform an ERCP immediately, leading to jaundice and sepsis.',
      'The Complainant had to undergo major reconstructive surgery at another hospital.',
      'Hospital bills totaled Rs. 15 lakhs for a procedure estimated at Rs. 50,000.',
    ],
    timeline: [
      '10.01.2025 — Initial surgery performed',
      '12.01.2025 — Complications started, jaundice observed',
      '15.01.2025 — Patient shifted to another hospital in critical state',
      '20.02.2025 — Complaint filed before Consumer Commission',
    ],
    procedural_history: [
      'Hospital denied negligence in their written version',
      'Medical board opinion sought by the Commission',
    ],
    relief_sought: [
      'Compensation of Rs. 1 Crore for physical agony and loss of income',
      'Refund of all hospital expenses with 12% interest',
      'Action against the operating surgeon for professional misconduct',
    ],
    parties: {
      petitioner: 'Sunita Devi (Complainant)',
      respondent: 'LifeCare Hospital & Dr. Sameer (Opposite Parties)',
    },
    raw_text: `BEFORE THE STATE CONSUMER DISPUTES REDRESSAL COMMISSION...
    The Complainant, a 45-year-old school teacher, alleges gross medical negligence by the Opposite Parties. During a routine surgery, the operating surgeon failed to identify the anatomical structures correctly, leading to a permanent impairment of the digestive system. The hospital's lack of post-operative care constitutes a clear deficiency in service under the Consumer Protection Act, 2019.`,
    judge_personality: {
      temperament: 'empathetic',
      questioning_style: 'fact-oriented',
      patience_level: 'high',
    },
    opposing_strategy: {
      primary_attack: 'Surgical complication is an inherent risk, not negligence',
      style: 'technical',
      aggression: 'moderate',
    },
  },
  {
    id: 'section-498a-quashing',
    case_title: 'Vikram Mehta v. State of Haryana',
    court_type: 'Punjab & Haryana High Court',
    description: 'Petition under Section 482 CrPC for quashing of FIR registered under Section 498A IPC (Cruelty) alleging misuse of law.',
    difficulty: 'Hard',
    legal_issues: [
      'Quashing under Section 482 CrPC',
      'Abuse of Process of Court',
      'Vague and General Allegations',
      'Territorial Jurisdiction',
      'Mediation and Settlement Possibilities',
    ],
    facts: [
      'The marriage between the Petitioner and the Complainant took place in 2022.',
      'The Complainant left the matrimonial home within 6 months after a dispute regarding living in a joint family.',
      'FIR was registered in her parental hometown, which is 500km away from the matrimonial home.',
      'The FIR names the husband, his 80-year-old grandmother, and a sister living in the USA.',
      'No specific dates or instances of cruelty are mentioned in the complaint.',
      'Medical records show no signs of physical injury.',
    ],
    timeline: [
      '15.05.2022 — Marriage solemnized',
      '10.12.2022 — Separation',
      '05.02.2025 — FIR registered under Section 498A/406 IPC',
      '20.03.2025 — Quashing petition filed',
    ],
    procedural_history: [
      'Anticipatory bail granted to the Petitioners',
      'Notice issued to the Complainant wife',
    ],
    relief_sought: [
      'Quashing of FIR No. 45/2025 and all subsequent proceedings',
      'Stay on investigation pending the disposal of the petition',
    ],
    parties: {
      petitioner: 'Vikram Mehta and others (Husband\'s family)',
      respondent: 'State of Haryana and Priya Mehta (Wife)',
    },
    raw_text: `IN THE HIGH COURT OF PUNJAB AND HARYANA AT CHANDIGARH...
    This is a classic case of legal extortion where the entire family of the husband has been impleaded in a matrimonial dispute. The allegations are "omnibus" in nature without any specific overtones. As per the Preeti Gupta v. State of Jharkhand judgment, such proceedings are liable to be quashed to prevent the miscarriage of justice.`,
    judge_personality: {
      temperament: 'cynical',
      questioning_style: 'direct',
      patience_level: 'low',
    },
    opposing_strategy: {
      primary_attack: 'Allegations require trial; cannot be quashed at threshold',
      style: 'emotional',
      aggression: 'high',
    },
  },
  {
    id: 'trademark-infringement',
    case_title: 'Z-Tech Corp v. Zee-Technologies Pvt Ltd',
    court_type: 'Delhi High Court (IP Division)',
    description: 'Intellectual Property suit seeking permanent injunction for trademark infringement and passing off.',
    difficulty: 'Expert',
    legal_issues: [
      'Deceptive Similarity',
      'Prior User Rights',
      'Well-known Trademark Status',
      'Balance of Convenience',
      'Triple Identity Test',
    ],
    facts: [
      'The Plaintiff (Z-Tech) is a global leader in software solutions since 1995.',
      'The Defendant started using the name "Zee-Technologies" in 2024 for identical software products.',
      'The logos use the same color scheme (Blue and Silver) and a similar font.',
      'Evidence shows customers tagging the wrong company on social media (actual confusion).',
      'The Defendant claims "Zee" is a generic prefix derived from the founder\'s name.',
    ],
    timeline: [
      '1995 — Plaintiff registers trademark in India',
      '2024 — Defendant launches products with infringing mark',
      'Jan 2025 — Cease and Desist notice sent',
      'Mar 2025 — Suit filed in Delhi High Court',
    ],
    procedural_history: [
      'Ex-parte ad-interim injunction granted initially',
      'Application under Order 39 Rule 4 filed by Defendant to vacate stay',
    ],
    relief_sought: [
      'Permanent injunction restraining use of the mark "Zee"',
      'Damages of Rs. 50 lakhs for loss of reputation',
      'Rendition of accounts of profits made by the Defendant',
    ],
    parties: {
      petitioner: 'Z-Tech Corporation (Plaintiff)',
      respondent: 'Zee-Technologies Pvt Ltd (Defendant)',
    },
    raw_text: `IN THE HIGH COURT OF DELHI: NEW DELHI (COMMERCIAL DIVISION)...
    The Defendant has adopted a phonetically and visually similar mark to ride upon the goodwill of the Plaintiff. The products are sold through the same trade channels to the same class of consumers. This is a clear case of "dishonest adoption" intended to cause confusion in the marketplace.`,
    judge_personality: {
      temperament: 'scholarly',
      questioning_style: 'analytical',
      patience_level: 'moderate',
    },
    opposing_strategy: {
      primary_attack: 'The mark is descriptive and common to the trade',
      style: 'legalistic',
      aggression: 'moderate',
    },
  }
];

export default prebuiltCases;
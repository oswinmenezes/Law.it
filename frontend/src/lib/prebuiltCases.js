/**
 * Prebuilt Indian Legal Cases for Quick Start
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

The Petitioner submits that he is the owner of a commercial establishment situated at Shop No. 12, Ground Floor, Paradise Complex, S.V. Road, Andheri West, Mumbai 400058, operating a general merchandise business for the past 15 years. The Petitioner holds Trade License No. BMC/AW/2024/1847 valid till March 2026 and has regularly paid all municipal taxes.

On 12.03.2025, officers of the Respondent Corporation demolished the said shop alleging unauthorized construction under Section 354A of the Mumbai Municipal Corporation Act. However, no show-cause notice, demolition notice, or any prior intimation was given to the Petitioner. The action was carried out in gross violation of principles of natural justice.

It is pertinent to note that similar commercial establishments in the same complex have not been subjected to any such action, making the impugned action discriminatory under Article 14.

The Petitioner submits that the right to carry on trade or business is a fundamental right under Article 19(1)(g) and the right to livelihood is protected under Article 21 of the Constitution. The arbitrary demolition without due process violates these fundamental rights.`,
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
Central Bureau of Investigation ... Respondent

APPLICATION UNDER SECTION 439 CR.P.C.

The applicant is a former Director of National Infrastructure Ltd., a Government of India undertaking. The CBI has registered FIR No. RC/2025/001 alleging that the applicant conspired with private contractors to award procurement contracts at inflated rates causing an alleged loss of Rs. 120 crores.

The applicant has been in custody for over 3 months. The investigation is complete and chargesheet has been filed. The trial is likely to take considerable time given the complexity and volume of documents involved. Two co-accused who held similar positions have been granted bail. The applicant is 62 years old with serious cardiac conditions. He is not a flight risk having deep roots in the community and having cooperated throughout the investigation.`,
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
IN THE SUPREME COURT OF INDIA
CIVIL ORIGINAL JURISDICTION

Citizens for Digital Rights ... Petitioner
Vs.
Union of India through Secretary, Ministry of Home Affairs ... Respondent

PETITION UNDER ARTICLE 32 OF THE CONSTITUTION OF INDIA

The Petitioner challenges the constitutional validity of Sections 12 and 15 of the Digital Security Act, 2024 as being violative of Articles 14, 19(1)(a), and 21 of the Constitution. Section 12 authorizes mass surveillance without judicial oversight, while Section 15 mandates private entities to facilitate such surveillance. The provisions fail the proportionality test laid down in K.S. Puttaswamy v. Union of India (2017) 10 SCC 1.`,
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
];

export default prebuiltCases;

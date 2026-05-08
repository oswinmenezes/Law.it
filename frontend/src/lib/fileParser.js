/**
 * File Parser — Extracts text from PDF, DOCX, and TXT files in-browser
 */
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Parse a file and extract text content
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  switch (ext) {
    case 'pdf':
      return parsePDF(file);
    case 'docx':
      return parseDOCX(file);
    case 'txt':
      return parseTXT(file);
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}

async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
}

async function parseDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function parseTXT(file) {
  return await file.text();
}

/**
 * Extract structured case data from raw text using heuristics
 */
export function extractCaseStructure(rawText) {
  const lines = rawText.split('\n').filter((l) => l.trim());

  // Try to extract case title from first few lines
  let caseTitle = 'Untitled Matter';
  for (const line of lines.slice(0, 5)) {
    if (line.includes('v.') || line.includes('vs.') || line.includes('Vs.') || line.includes('V/S') || line.includes('versus')) {
      caseTitle = line.trim();
      break;
    }
  }
  if (caseTitle === 'Untitled Matter' && lines.length > 0) {
    caseTitle = lines[0].substring(0, 100).trim();
  }

  // Detect court type
  let courtType = 'High Court';
  const textLower = rawText.toLowerCase();
  if (textLower.includes('supreme court')) courtType = 'Supreme Court of India';
  else if (textLower.includes('high court')) {
    const hcMatch = rawText.match(/(?:Hon'ble\s+)?(.+?High Court)/i);
    courtType = hcMatch ? hcMatch[1] : 'High Court';
  }
  else if (textLower.includes('district court')) courtType = 'District Court';
  else if (textLower.includes('tribunal')) courtType = 'Tribunal';

  // Extract legal issues
  const legalIssues = [];
  const issueKeywords = [
    'maintainability', 'jurisdiction', 'locus standi', 'limitation',
    'constitutional validity', 'fundamental rights', 'natural justice',
    'arbitrary', 'unreasonable', 'ultra vires', 'interim relief',
    'bail', 'anticipatory bail', 'writ', 'habeas corpus',
    'mandamus', 'certiorari', 'prohibition', 'quo warranto',
    'article 14', 'article 19', 'article 21', 'article 226', 'article 32',
    'section 482', 'section 438', 'section 439',
  ];
  for (const keyword of issueKeywords) {
    if (textLower.includes(keyword)) {
      legalIssues.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }
  if (legalIssues.length === 0) {
    legalIssues.push('Maintainability', 'Jurisdiction');
  }

  // Extract facts (sentences with key indicators)
  const facts = [];
  const sentences = rawText.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const factIndicators = ['alleged', 'submitted', 'stated', 'filed', 'dated', 'on or about', 'it is contended', 'the petitioner', 'the respondent', 'the accused', 'the complainant'];
  for (const sentence of sentences) {
    const sentLower = sentence.toLowerCase();
    if (factIndicators.some((ind) => sentLower.includes(ind))) {
      facts.push(sentence.trim());
      if (facts.length >= 10) break;
    }
  }
  if (facts.length === 0) {
    facts.push(...sentences.slice(0, 5).map((s) => s.trim()));
  }

  // Extract relief sought
  const reliefSought = [];
  const reliefIndicators = ['prayer', 'relief', 'prayed', 'seeks', 'requested', 'quash', 'set aside', 'direct', 'restrain', 'injunction', 'compensation', 'bail'];
  for (const sentence of sentences) {
    const sentLower = sentence.toLowerCase();
    if (reliefIndicators.some((ind) => sentLower.includes(ind))) {
      reliefSought.push(sentence.trim());
      if (reliefSought.length >= 5) break;
    }
  }

  // Detect parties
  let petitioner = 'Petitioner';
  let respondent = 'Respondent';
  const petMatch = rawText.match(/(?:petitioner|appellant|complainant)[:\s]*([^\n,]+)/i);
  const resMatch = rawText.match(/(?:respondent|defendant|accused)[:\s]*([^\n,]+)/i);
  if (petMatch) petitioner = petMatch[1].trim().substring(0, 60);
  if (resMatch) respondent = resMatch[1].trim().substring(0, 60);

  return {
    case_title: caseTitle,
    court_type: courtType,
    legal_issues: legalIssues,
    facts,
    timeline: [],
    procedural_history: [],
    relief_sought: reliefSought,
    parties: { petitioner, respondent },
    raw_text: rawText.substring(0, 8000), // Keep first 8000 chars for context
    judge_personality: {
      temperament: 'stern',
      questioning_style: 'aggressive',
      patience_level: 'low',
    },
    opposing_strategy: {
      primary_attack: legalIssues[0] || 'Maintainability',
      style: 'adversarial',
      aggression: 'high',
    },
  };
}

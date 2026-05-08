import Tesseract from 'tesseract.js';

/* ═════════════════════════════════════════════════════════════
   OpenRouter OCR API — Direct frontend calls
   ═════════════════════════════════════════════════════════════ */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free vision models currently available on OpenRouter (May 2026)
const PRIMARY_MODEL = 'google/gemini-2.0-flash:free';
const FALLBACK_1 = 'qwen/qwen-2.5-vl-72b-instruct:free';
const FALLBACK_2 = 'google/gemma-4-31b-it:free';
const FALLBACK_3 = 'google/gemini-2.0-flash-lite:free';
const FALLBACK_4 = 'openrouter/free';

const PROMPTS = {
  default: `You are an expert OCR engine. Extract ALL text from this image accurately.

Rules:
- Preserve the original formatting, structure, and layout as much as possible.
- For tables, use markdown table syntax.
- For mathematical formulas, use LaTeX notation.
- For code, use markdown code blocks with the appropriate language.
- If the image contains handwritten text, do your best to transcribe it accurately.
- Do NOT add any commentary, explanation, or description of the image — only output the extracted text.
- If no text is found, respond with: "[No text detected in this image]"`,

  table: `Extract ALL tables from this image. Output them in clean markdown table format. Preserve headers, alignment, and all cell values exactly as shown. If no table is found, say "[No table detected]".`,

  handwriting: `You are an expert at reading handwritten text. Carefully transcribe ALL handwritten text from this image. Preserve line breaks and paragraph structure. If you're unsure about a word, provide your best guess in [brackets]. Only output the transcribed text.`,

  code: `Extract all code or programming content from this image. Output it in a markdown code block with the correct language identifier. Preserve exact indentation, spacing, and syntax. Only output the code, no commentary.`,

  math: `Extract all mathematical formulas, equations, and expressions from this image. Use LaTeX notation for all mathematical content. Preserve the structure and ordering. Only output the mathematical content.`,

  receipt: `Extract all text from this receipt/invoice image. Structure the output clearly with:
- Store/company name
- Date and time
- Individual items with quantities and prices
- Subtotal, tax, total
- Any other relevant information
Preserve the original formatting where possible.`,
};

export function getPromptOptions() {
  return [
    { value: 'default', label: 'General Text (Default)' },
    { value: 'table', label: 'Table Extraction' },
    { value: 'handwriting', label: 'Handwriting Recognition' },
    { value: 'code', label: 'Code Extraction' },
    { value: 'math', label: 'Mathematical Formulas' },
    { value: 'receipt', label: 'Receipt / Invoice' },
  ];
}

export function getModelInfo() {
  return {
    primary: PRIMARY_MODEL,
    fallbacks: [FALLBACK_1, FALLBACK_2, FALLBACK_3, FALLBACK_4],
  };
}

export async function performOCR(apiKeys, imageBase64, mimeType, promptKey = 'default') {
  const keys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
  const prompt = PROMPTS[promptKey] || PROMPTS.default;
  const imageUrl = `data:${mimeType};base64,${imageBase64}`;

  const models = [PRIMARY_MODEL, FALLBACK_1, FALLBACK_2, FALLBACK_3, FALLBACK_4];
  let lastError = null;

  for (const model of models) {
    console.log(`Attempting OCR with model: ${model}`);
    
    // Try each API key for the current model
    for (let k = 0; k < keys.length; k++) {
      const currentKey = keys[k];
      if (keys.length > 1) console.log(`Using API key ${k + 1}/${keys.length}`);
      
      const result = await callModel(currentKey, model, imageUrl, prompt);

      if (!result.error) {
        return {
          ...result,
          fallback: model !== PRIMARY_MODEL,
        };
      }

      lastError = result;
      console.warn(`Model ${model} with Key ${k + 1} failed:`, result.error);

      // If it's a 401 (Unauthorized), don't bother with this key anymore, but maybe try next key
      if (result.status === 401) {
        continue; 
      }

      // If it's NOT a rate limit (429), then the model itself might be down or image too large
      // In that case, we should try the next model instead of rotating keys for this failing model
      if (result.status !== 429 && !result.error.includes('rate limit')) {
        break; 
      }
      
      if (k < keys.length - 1) {
        console.log('Rate limit reached or 429 error. Rotating to next API key...');
      }
    }

    // If we've hit the GLOBAL free tier limit, don't try other free models
    if (lastError?.error && lastError.error.includes('free-models-per-day')) {
      console.log('Global free-tier limit reached across all keys. Switching to Local OCR Fallback...');
      break; 
    }
  }

  // ULTIMATE FALLBACK: Local OCR via Tesseract.js
  console.log('Starting Local OCR Fallback (Tesseract.js)...');
  try {
    const { data: { text } } = await Tesseract.recognize(
      imageUrl,
      'eng',
      { logger: m => console.log(m) }
    );
    return {
      text: text || '[Local OCR failed to detect text]',
      model: 'Local-Tesseract-Fallback',
      isLocal: true
    };
  } catch (err) {
    return {
      error: lastError?.error || `Local OCR Error: ${err.message}`,
      status: lastError?.status || 0
    };
  }
}

async function callModel(apiKey, model, imageUrl, prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'OCR Scanner',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.error?.message || `API error (${response.status})`,
        status: response.status,
      };
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '[No text extracted]';

    return {
      text,
      model: data.model || model,
      usage: data.usage || null,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      error: err.name === 'AbortError' ? 'Request timed out' : `Network error: ${err.message}`,
      status: 0,
    };
  }
}
export async function summarizeText(apiKeys, text) {
  const keys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
  const models = [
    'google/gemini-2.0-flash:free',
    'google/gemini-2.0-flash-lite-preview-02-05:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'deepseek/deepseek-r1:free',
    'mistralai/pixtral-12b:free',
    'google/gemma-2-9b-it:free',
    'openrouter/free',
  ];

  const prompt = `You are a high-level Legal Analyst. Summarize the following extracted text into a professional Legal Abstract. 
Focus on identifying critical information that a lawyer needs for quick review.

Use the following Markdown structure:

### LEGAL ABSTRACT & CASE OVERVIEW

#### 1. KEY PARTIES & IDENTIFICATION
- (List primary entities, individuals, or governing bodies involved)
- (Specify roles if clear)

#### 2. CRITICAL DATES & DEADLINES
- (List all effective dates, expiration dates, court dates, or filing deadlines)

#### 3. JURISDICTION & GOVERNING LAW
- (Specify the applicable law or court of jurisdiction)

#### 4. PRIMARY OBLIGATIONS & FINDINGS
- (Summarize the core legal obligations, rulings, or factual findings)

#### 5. RISK ASSESSMENT & ANOMALIES
- (Identify potential risks, unusual clauses, or missing critical information)

---
*Generated by Law.it Premium Legal AI*

Extracted Text:
"""
${text}
"""`;

  let lastError = null;

  for (const model of models) {
    for (let k = 0; k < keys.length; k++) {
      const currentKey = keys[k];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        console.log(`Attempting summary with model: ${model} (Key ${k + 1})`);
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'OCR Scanner Summary',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1024,
            temperature: 0.3,
          }),
        });

        clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || `API error (${response.status})`;
            lastError = { error: errorMsg, status: response.status };
            console.warn(`Summary model ${model} with key ${k + 1} failed:`, errorMsg);
            
            if (response.status === 401) continue;

            // Specific check for global free-tier limit
            if (errorMsg.toLowerCase().includes('free-models-per-day')) {
              console.error('GLOBAL OpenRouter free-tier limit reached for this account.');
              // If we have more keys, try them, as they might be from different accounts
              if (k < keys.length - 1) {
                console.log('Rotating to next API key (hopefully a different account)...');
                continue;
              }
              // If no more keys, this account is done for the day for free models
              break; 
            }

            if (response.status === 429 || errorMsg.toLowerCase().includes('rate limit')) {
              if (k < keys.length - 1) {
                console.log('Rotating API key for summary due to rate limit...');
                continue;
              }
            }
            break; 
          }

        const data = await response.json();
        return { 
          text: data.choices?.[0]?.message?.content || '[No summary generated]',
          model: model 
        };
      } catch (err) {
        clearTimeout(timeoutId);
        const msg = err.name === 'AbortError' ? 'Summary request timed out' : err.message;
        lastError = { error: `Network error: ${msg}`, model: model };
        console.warn(`Summary model ${model} error:`, msg);
        break; // Move to next model on network error
      }
    }
  }

  return lastError;
}

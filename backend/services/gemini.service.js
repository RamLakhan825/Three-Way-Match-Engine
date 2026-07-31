const { GoogleGenerativeAI,SchemaType  } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' ,generationConfig: {
    responseMimeType: "application/json",
  }});

const PROMPTS = {
  po: `You are extracting structured data from a Purchase Order (PO) document.
Return ONLY valid JSON (no markdown fences, no commentary) with this exact shape:
{
  "poNumber": string,
  "poDate": string (YYYY-MM-DD),
  "vendorName": string,
  "items": [
    { "itemCode": string, "description": string, "quantity": number }
  ]
}
Rules:
- itemCode is the vendor/SKU item code column (e.g. "11423"), as a string, not the S.No/serial number.
- If an item has no explicit item code in the document, use an empty string "".
- quantity must be a number, not a string.
- Do not invent data. If a field truly cannot be found, use an empty string "" (or 0 for quantity).`,

  grn: `You are extracting structured data from a Goods Receipt Note (GRN) document.
Return ONLY valid JSON (no markdown fences, no commentary) with this exact shape:
{
  "grnNumber": string,
  "poNumber": string,
  "grnDate": string (YYYY-MM-DD),
  "items": [
    { "itemCode": string, "description": string, "receivedQuantity": number, "mrp": number }
  ]
}
Rules:
- itemCode is the SKU Code column, as a string.
- receivedQuantity is the "Recv Qty" column, as a number.
- mrp is the "Lot MRP" column if present, else 0.
- Do not invent data.`,

  invoice: `You are extracting structured data from a Tax Invoice document.
Return ONLY valid JSON (no markdown fences, no commentary) with this exact shape:
{
  "invoiceNumber": string,
  "poNumber": string,
  "invoiceDate": string (YYYY-MM-DD),
  "items": [
    { "itemCode": string, "description": string, "quantity": number, "unitRate": number, "mrp": number }
  ]
}
Rules:
- itemCode is the Item Code column (e.g. "FG-P-F-0503"), as a string.
- unitRate is the Rate [INR] column.
- poNumber is usually labelled "Customer Order No." on the invoice.
- mrp may not be present on an invoice — if truly absent, use 0.
- Do not invent data.`,
};

function fileToGeminiPart(filePath, mimeType) {
  const data = fs.readFileSync(filePath);
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType,
    },
  };
}

function extractJson(text) {
  // Gemini sometimes wraps output in ```json ... ``` despite instructions — strip that defensively.
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function parseDocument(documentType, filePath, mimeType) {
  const prompt = PROMPTS[documentType];
  if (!prompt) throw new Error(`No prompt defined for documentType: ${documentType}`);

  const filePart = fileToGeminiPart(filePath, mimeType);

  // try once, then retry once on malformed JSON, per assignment spec
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent([prompt, filePart]);
      const text = result.response.text();
      const json = extractJson(text);
      return json;
    } catch (err) {
      if (attempt === 2) {
        throw new Error(`Gemini parsing failed after retry: ${err.message}`);
      }
      // otherwise loop and retry once
      await sleep(6000);
    }
  }
}

module.exports = { parseDocument };
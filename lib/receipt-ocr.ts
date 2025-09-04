'use client';

import Tesseract from 'tesseract.js';

export interface ReceiptExtractionResult {
  merchant?: string;
  total?: number;
  currency?: 'EUR' | 'USD' | 'GBP' | string;
  date?: string; // yyyy-MM-dd
  rawText: string;
  confidence?: number;
}

const MAX_DIMENSION = 1600;

const downscaleImageForOcr = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const targetWidth = Math.max(1, Math.round(img.width * scale));
      const targetHeight = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob for OCR'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => reject(new Error('Failed to load image for OCR'));
    img.src = URL.createObjectURL(file);
  });
};

const normalizeNumber = (value: string): number | undefined => {
  // Handle European formats: 1.234,56 and US formats: 1,234.56
  let cleaned = value.trim();
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  if (hasComma && hasDot) {
    // Assume last occurrence is decimal separator
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/[.\s]/g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/[,\s]/g, '');
    }
  } else if (hasComma && !hasDot) {
    cleaned = cleaned.replace(/[\s]/g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/[\s,]/g, '');
  }
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
};

const parseCurrency = (text: string): 'EUR' | 'USD' | 'GBP' | string | undefined => {
  const t = text.toLowerCase();
  if (t.includes('€') || /\b(eur|euro|euros)\b/i.test(text)) return 'EUR';
  if (t.includes('$') || /\b(usd|dollar|dollars)\b/i.test(text)) return 'USD';
  if (/\b(gbp|pound|pounds|£)\b/i.test(text)) return 'GBP';
  return undefined;
};

const parseDate = (text: string): string | undefined => {
  // Try common formats: dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, yyyy/mm/dd, dd.mm.yyyy
  const patterns = [
    /(\b\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/g, // dd/mm/yyyy
    /(\b\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/g,   // yyyy-mm-dd
    /(\b\d{1,2})[.](\d{1,2})[.](\d{2,4})/g       // dd.mm.yyyy
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) {
      let year: number, month: number, day: number;
      if (m[1].length === 4) {
        year = Number(m[1]);
        month = Number(m[2]);
        day = Number(m[3]);
      } else {
        day = Number(m[1]);
        month = Number(m[2]);
        year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
      }
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      }
    }
  }
  return undefined;
};

const parseTotal = (text: string): number | undefined => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const amountRegex = /([€$£]?)[\s]*([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2}|[0-9]+(?:[.,][0-9]{2}))/;
  const priorityKeywords = /(total|amount due|grand total|balance due|montant|totaal|sum)/i;
  let best: number | undefined;
  for (const line of lines) {
    if (!priorityKeywords.test(line) && !amountRegex.test(line)) continue;
    const m = amountRegex.exec(line);
    if (m && m[2]) {
      const normalized = normalizeNumber(m[2]);
      if (typeof normalized === 'number') {
        if (best === undefined || normalized > best) {
          best = normalized;
        }
      }
    }
  }
  // As a fallback, pick the largest number in the text
  if (best === undefined) {
    let max: number | undefined;
    const allMatches = text.match(/([0-9]{1,3}(?:[.,\s][0-9]{3})*[.,][0-9]{2}|[0-9]+(?:[.,][0-9]{2}))/g);
    if (allMatches) {
      for (const v of allMatches) {
        const n = normalizeNumber(v);
        if (typeof n === 'number') {
          if (max === undefined || n > max) max = n;
        }
      }
    }
    best = max;
  }
  return best;
};

const parseMerchant = (text: string): string | undefined => {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return undefined;
  // Heuristics: pick the first line that is not a header keyword and is not mostly digits
  const badKeywords = /(receipt|invoice|ticket|transaction|order|vat|tva|btw|tax|date|time|heure|kasbon)/i;
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];
    const digitRatio = (line.replace(/\D/g, '').length) / Math.max(1, line.length);
    if (digitRatio > 0.5) continue;
    if (badKeywords.test(line)) continue;
    // Favor uppercase or title-like words
    if (/^[A-Z0-9\s\-.'&()]+$/.test(line) || /[A-Z][a-z]+/.test(line)) {
      return line.replace(/[*_#]/g, '').trim();
    }
  }
  // Fallback to first line
  return lines[0];
};

export const extractReceiptFieldsFromImage = async (file: File): Promise<ReceiptExtractionResult> => {
  const blob = await downscaleImageForOcr(file);
  const imageUrl = URL.createObjectURL(blob);
  const result = await Tesseract.recognize(imageUrl, 'eng');
  const text = result?.data?.text || '';
  const confidence = result?.data?.confidence;

  const currency = parseCurrency(text) || 'EUR';
  const total = parseTotal(text);
  const date = parseDate(text);
  const merchant = parseMerchant(text);

  return {
    merchant,
    total,
    currency,
    date,
    rawText: text,
    confidence
  };
};



import { presetIcons } from './preset-icons';

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const inferPresetIconId = (merchant?: string): string | undefined => {
  if (!merchant) return undefined;
  const m = clean(merchant);
  // Direct id or name contains
  for (const icon of presetIcons) {
    const nameClean = clean(icon.name);
    if (m.includes(icon.id) || m.includes(nameClean) || nameClean.includes(m)) {
      return icon.id;
    }
  }
  // Keyword heuristics
  if (/\bstarbucks\b/.test(m)) return 'starbucks';
  if (/\bmc ?donald'?s\b/.test(m)) return 'mcdonalds';
  if (/\bcolruyt\b/.test(m)) return 'colruyt';
  if (/\bdelhaize\b/.test(m)) return 'delhaize';
  if (/\bcarrefour\b/.test(m)) return 'carrefour-be';
  if (/\baldi\b/.test(m)) return 'aldi-be';
  if (/\blidl\b/.test(m)) return 'lidl-be';
  if (/\bspotify\b/.test(m)) return 'spotify';
  if (/\bnetflix\b/.test(m)) return 'netflix';
  if (/\buber\b/.test(m)) return 'uber';
  if (/\bshell\b/.test(m)) return 'shell';
  return undefined;
};



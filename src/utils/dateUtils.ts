/**
 * Utilities for date formatting and month generation in Indonesian
 */

export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Formats a Date object or string (e.g. '2026-08' or ISO date) to "Month Year" string in Indonesian
 */
export const getIndonesianMonthYear = (dateInput: Date | string | undefined | null): string => {
  if (!dateInput) {
    const now = new Date();
    return `${INDONESIAN_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }
  if (typeof dateInput === 'string') {
    // If it's in YYYY-MM format
    if (/^\d{4}-\d{2}$/.test(dateInput.trim())) {
      const [yearStr, monthStr] = dateInput.trim().split('-');
      const monthIdx = parseInt(monthStr, 10) - 1;
      const year = parseInt(yearStr, 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${INDONESIAN_MONTHS[monthIdx]} ${year}`;
      }
    }
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
      return `${INDONESIAN_MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
    }
    return dateInput; // Return as-is if already formatted or non-date string
  }
  return `${INDONESIAN_MONTHS[dateInput.getMonth()]} ${dateInput.getFullYear()}`;
};

/**
 * Generates an array of "Month Year" strings for a given range
 * @param forwardMonths Number of months to look forward from current month
 * @param backwardMonths Number of months to look backward from current month
 */
export const generateMonthOptions = (forwardMonths: number = 12, totalLength: number = 36): string[] => {
  return Array.from({ length: totalLength }).map((_, i) => {
    const d = new Date();
    d.setDate(1); // Avoid rollover issues
    d.setMonth(d.getMonth() + forwardMonths - i);
    return getIndonesianMonthYear(d);
  });
};

/**
 * Checks if two month strings match (case insensitive, handles multiple formats)
 */
export const isMonthMatch = (monthA: string, monthB: string): boolean => {
  if (!monthA || !monthB) return false;
  const cleanA = String(monthA).trim().toLowerCase();
  const cleanB = String(monthB).trim().toLowerCase();
  if (cleanA === cleanB) return true;

  const monthsId = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
  const monthsEn = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  const normalize = (m: string) => {
    const yearMatch = m.match(/\d{4}/);
    const year = yearMatch ? yearMatch[0] : null;
    
    // Try finding month name anywhere in string
    let index = monthsId.findIndex(name => m.includes(name));
    if (index === -1) index = monthsEn.findIndex(name => m.includes(name));
    
    if (index !== -1) {
      return year ? `${index}-${year}` : `${index}`;
    }

    // Try numeric month
    const parts = m.split(/[-/\s]/);
    for (const part of parts) {
      const num = parseInt(part);
      if (num >= 1 && num <= 12 && part.length <= 2) {
        return year ? `${num - 1}-${year}` : `${num - 1}`;
      }
    }

    return null;
  };

  const normA = normalize(cleanA);
  const normB = normalize(cleanB);
  
  if (!normA || !normB) return false;
  if (normA.includes('-') && normB.includes('-')) return normA === normB;
  return normA.split('-')[0] === normB.split('-')[0];
};

/**
 * Calculates age from birth date string (YYYY-MM-DD)
 */
export const calculateAge = (birthDate?: string): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

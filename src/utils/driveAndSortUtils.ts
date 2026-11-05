/**
 * Lightweight shared utilities for Google Drive media URLs and natural alphanumeric house/block sorting.
 * Kept separate from pdfService and excelService to prevent heavy PDF/Excel libraries from bundling into initial page loads.
 */

export const getDriveId = (url: string): string | null => {
  if (!url) return null;
  const driveRegex = /\/d\/([a-zA-Z0-9_-]+)|\?id=([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  return match ? (match[1] || match[2]) : null;
};

export const convertToDirectLink = (url: string): string => {
  const id = getDriveId(url);
  if (id) {
    return `https://drive.google.com/uc?export=view&id=${id}`;
  }
  return url;
};

export const getDriveThumbnail = (url: string, width: number = 800): string => {
  const id = getDriveId(url);
  if (id) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
  }
  return url;
};

export const naturalSortBlockAndNumber = (
  blockA: string | undefined | null,
  numA: string | undefined | null,
  blockB: string | undefined | null,
  numB: string | undefined | null
): number => {
  const bA = (blockA || '').trim();
  const bB = (blockB || '').trim();

  const cleanBA = bA.replace(/[\s\-_]+/g, '');
  const cleanBB = bB.replace(/[\s\-_]+/g, '');

  const blockMatchA = cleanBA.match(/^([A-Za-z]+)?(\d+)?$/);
  const blockMatchB = cleanBB.match(/^([A-Za-z]+)?(\d+)?$/);

  const letterA = blockMatchA ? (blockMatchA[1] || '') : cleanBA;
  const letterB = blockMatchB ? (blockMatchB[1] || '') : cleanBB;
  const valA = blockMatchA && blockMatchA[2] ? parseInt(blockMatchA[2], 10) : -1;
  const valB = blockMatchB && blockMatchB[2] ? parseInt(blockMatchB[2], 10) : -1;

  const letterComp = letterA.localeCompare(letterB, undefined, { sensitivity: 'base' });
  if (letterComp !== 0) return letterComp;

  if (valA !== valB) {
    if (valA === -1) return 1;
    if (valB === -1) return -1;
    return valA - valB;
  }

  const nA = (numA || '').trim();
  const nB = (numB || '').trim();

  const cleanNA = nA.replace(/[\s\-_]+/g, '');
  const cleanNB = nB.replace(/[\s\-_]+/g, '');

  const numMatchA = cleanNA.match(/^([A-Za-z]+)?(\d+)?$/);
  const numMatchB = cleanNB.match(/^([A-Za-z]+)?(\d+)?$/);

  const numLetterA = numMatchA ? (numMatchA[1] || '') : cleanNA;
  const numLetterB = numMatchB ? (numMatchB[1] || '') : cleanNB;
  const numValA = numMatchA && numMatchA[2] ? parseInt(numMatchA[2], 10) : -1;
  const numValB = numMatchB && numMatchB[2] ? parseInt(numMatchB[2], 10) : -1;

  const numLetterComp = numLetterA.localeCompare(numLetterB, undefined, { sensitivity: 'base' });
  if (numLetterComp !== 0) return numLetterComp;

  if (numValA !== numValB) {
    if (numValA === -1) return 1;
    if (numValB === -1) return -1;
    return numValA - numValB;
  }

  return 0;
};

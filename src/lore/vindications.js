import { DICTIONARY } from '../data/dictionary.js';

/**
 * Vindications — coherent words found in library text
 * "The certainty that everything has been written negates us or turns us
 * into phantoms. I know of districts in which the young men prostrate
 * themselves before books and kiss their pages in a barbarous manner,
 * but they do not know how to decipher a single letter. Epidemics,
 * heretical conflicts, peregrinations which inevitably degenerate into
 * banditry, have decimated the population. I believe I have mentioned
 * suicides, more and more frequent with the years."
 *
 * A "Vindication" is any recognizable word (4+ letters) found in the
 * otherwise random text. These are vanishingly rare miracles.
 */

let totalVindications = 0;
const vindicationLog = []; // { word, hexId, wall, shelf, vol, page, line }

/**
 * Scan a page of text for vindication words (4+ letter dictionary words)
 * @param {string[]} lines - 40 lines of text
 * @returns {Array<{ word: string, line: number, start: number, end: number }>}
 */
export function scanForVindications(lines) {
  const found = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const text = lines[lineIdx];
    // Look for runs of lowercase letters that form words
    const regex = /[a-z]{4,}/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const word = match[0];
      if (DICTIONARY.has(word)) {
        found.push({
          word,
          line: lineIdx,
          start: match.index,
          end: match.index + word.length,
        });
      }
    }
  }

  return found;
}

/**
 * Record vindications found on a page
 */
export function recordVindications(vindications, coords) {
  for (const v of vindications) {
    totalVindications++;
    vindicationLog.push({
      word: v.word,
      ...coords,
      line: v.line,
    });
  }
  // Keep log manageable
  if (vindicationLog.length > 200) {
    vindicationLog.splice(0, vindicationLog.length - 200);
  }
}

export function getVindicationCount() {
  return totalVindications;
}

export function getVindicationLog() {
  return vindicationLog;
}

/**
 * Highlight vindication words in HTML text
 * @param {string[]} lines
 * @param {Array} vindications - from scanForVindications
 * @returns {string} HTML with highlighted words
 */
export function highlightVindications(lines, vindications) {
  // Group by line
  const byLine = new Map();
  for (const v of vindications) {
    if (!byLine.has(v.line)) byLine.set(v.line, []);
    byLine.get(v.line).push(v);
  }

  return lines.map((line, lineIdx) => {
    const lineVindications = byLine.get(lineIdx);
    if (!lineVindications || lineVindications.length === 0) {
      return escapeHtml(line);
    }

    // Sort by position (reverse to not shift indices)
    const sorted = [...lineVindications].sort((a, b) => b.start - a.start);
    let result = line;

    // Build from back to front
    const chars = [...result];
    const html = [];
    let pos = 0;
    const sortedFwd = [...lineVindications].sort((a, b) => a.start - b.start);

    let lastEnd = 0;
    for (const v of sortedFwd) {
      if (v.start > lastEnd) {
        html.push(escapeHtml(result.substring(lastEnd, v.start)));
      }
      html.push(`<span class="highlight">${escapeHtml(result.substring(v.start, v.end))}</span>`);
      lastEnd = v.end;
    }
    if (lastEnd < result.length) {
      html.push(escapeHtml(result.substring(lastEnd)));
    }

    return html.join('');
  }).join('\n');
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

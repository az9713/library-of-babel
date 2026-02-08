/**
 * Purifiers — ~5% of rooms are burned/damaged
 * "For every rational line or forthright statement there are leagues of
 * senseless cacophony, verbal rubble and incoherence. I know of one wild
 * region whose librarians repudiate the vain superstitious custom of
 * seeking any sense in books and compare it to looking for meaning in
 * dreams... They speak of the 'Purifiers'."
 */

/**
 * Determine if a hex room has been "purified" (burned by fanatical librarians)
 * Approximately 5% of rooms (5000 out of every 100003)
 * Using a prime modulus to avoid patterns
 */
export function isPurifiedRoom(hexId) {
  return hexId % 100003n < 5000n;
}

/**
 * Get a random Borges quote for a purifier plaque
 * @param {bigint} hexId
 * @returns {string}
 */
export function getPurifierQuote(hexId) {
  const quotes = [
    '"Others, inversely, believed that it was fundamental to eliminate useless works."',
    '"They invaded the hexagons, showed credentials that were not always false, leafed through a volume with displeasure and condemned whole shelves."',
    '"Their ascetic, hygienic furor caused the senseless perdition of millions of books."',
    '"We know: for every rational line there are leagues of senseless cacophony."',
    '"It is true that the most ancient people, the first librarians, used a language quite different from the one we now speak."',
  ];
  const idx = Number(hexId % BigInt(quotes.length));
  return quotes[idx];
}

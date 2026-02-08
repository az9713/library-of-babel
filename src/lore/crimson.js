/**
 * The Crimson Hexagon
 * "On some shelf in some hexagon, it was argued, there must exist a book
 * that is the cipher and perfect compendium of all other books, and some
 * librarian must have examined that book; this librarian is analogous to a god."
 *
 * The Crimson Hexagon is a special room with red-tinted walls and lighting.
 * Borges's birthday: June 24, 1899 → 18990824 (YYYYMMDD reversed)
 */

const CRIMSON_PRIMARY = 18990824n;

/**
 * Check if a hex room is a Crimson Hexagon
 */
export function isCrimsonRoom(hexId) {
  return hexId === CRIMSON_PRIMARY || (hexId > 0n && hexId % CRIMSON_PRIMARY === 0n);
}

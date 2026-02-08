/**
 * Cipher round-trip test
 * Run with: node tests/cipher-test.js
 */

// We need to use dynamic import since the modules use ESM
async function runTests() {
  const { encrypt, decrypt, bigintToChars, charsToBigint, bigMod } = await import('../src/cipher/lcg.js');
  const { BASE, TOTAL, LINE_LEN } = await import('../src/cipher/constants.js');
  const { generatePage, searchText, coordsToLineAddress } = await import('../src/cipher/library-math.js');

  let passed = 0;
  let failed = 0;

  function assert(condition, msg) {
    if (condition) {
      passed++;
      console.log(`  PASS: ${msg}`);
    } else {
      failed++;
      console.error(`  FAIL: ${msg}`);
    }
  }

  // Test 1: Round-trip encrypt/decrypt
  console.log('\n=== Round-trip encrypt/decrypt ===');
  const testValues = [0n, 1n, 42n, 1000000n, 314159265n, BASE ** 40n, TOTAL - 1n];
  for (const val of testValues) {
    const encrypted = encrypt(val);
    const decrypted = decrypt(encrypted);
    assert(decrypted === val, `roundtrip(${val}) = ${decrypted}`);
  }

  // Test 2: Random values round-trip
  console.log('\n=== Random value round-trips ===');
  for (let i = 0; i < 20; i++) {
    let val = 0n;
    for (let j = 0; j < 10; j++) {
      val = val * 256n + BigInt(Math.floor(Math.random() * 256));
    }
    val = val % TOTAL;
    const encrypted = encrypt(val);
    const decrypted = decrypt(encrypted);
    assert(decrypted === val, `random roundtrip #${i}`);
  }

  // Test 3: Encrypt produces different outputs (no collisions for adjacent inputs)
  console.log('\n=== Collision check ===');
  const outputs = new Set();
  for (let i = 0n; i < 100n; i++) {
    const out = encrypt(i);
    assert(!outputs.has(out.toString()), `no collision for input ${i}`);
    outputs.add(out.toString());
  }

  // Test 4: chars <-> bigint round-trip
  console.log('\n=== chars/bigint round-trip ===');
  const testStrings = [
    ' '.repeat(80),
    'hello world' + ' '.repeat(69),
    'abcdefghijklmnopqrstuvwxyz ,.' + ' '.repeat(51),
  ];
  for (const str of testStrings) {
    const num = charsToBigint(str);
    const back = bigintToChars(num, LINE_LEN);
    assert(back === str, `chars roundtrip: "${str.substring(0, 20)}..."`);
  }

  // Test 5: Search round-trip
  console.log('\n=== Search round-trip ===');
  const searchTerms = ['hello world', 'the library of babel', 'vindication'];
  for (const term of searchTerms) {
    const result = searchText(term);
    const page = generatePage(result.hexId, result.wall, result.shelf, result.vol, result.page);
    const line = page[result.line];
    const normalized = term.toLowerCase().replace(/[^a-z ,.]/g, '').padEnd(LINE_LEN, ' ').substring(0, LINE_LEN);
    assert(line === normalized, `search "${term}" found at correct location`);
  }

  // Test 6: Performance
  console.log('\n=== Performance ===');
  const perfStart = performance.now();
  const perfIters = 100;
  for (let i = 0n; i < BigInt(perfIters); i++) {
    encrypt(i * 1000000n);
  }
  const perfTime = performance.now() - perfStart;
  const avgMs = perfTime / perfIters;
  console.log(`  ${perfIters} encryptions in ${perfTime.toFixed(1)}ms (${avgMs.toFixed(2)}ms avg)`);
  assert(avgMs < 50, `avg encrypt time ${avgMs.toFixed(2)}ms < 50ms`);

  // Summary
  console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

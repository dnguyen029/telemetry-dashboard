const fs = require("fs");
const path = require("path");

// Convert typescript export to commonjs for node test runner
const libCode = fs.readFileSync(path.join(__dirname, "../lib/priceFilters.ts"), "utf8");
// Simple transformation to strip type annotations for node execution
const jsCode = libCode
  .replace(/url:\s*string\s*\|\s*null\s*\|\s*undefined/g, "url")
  .replace(/price:\s*number/g, "price")
  .replace(/mapPrice:\s*number/g, "mapPrice")
  .replace(/:\s*boolean/g, "")
  .replace("export function isValidVanityMatch", "function isValidVanityMatch")
  .concat("\nmodule.exports = { isValidVanityMatch };");

fs.writeFileSync(path.join(__dirname, "../lib/priceFilters.js"), jsCode, "utf8");

const { isValidVanityMatch } = require("../lib/priceFilters.js");

function runTest(description, url, price, mapPrice, expected) {
  const result = isValidVanityMatch(url, price, mapPrice);
  const passed = result === expected;
  console.log(`${passed ? "✅ PASS" : "❌ FAIL"}: ${description}`);
  if (!passed) {
    console.error(`  Expected: ${expected}, Got: ${result}`);
  }
}

try {
  console.log("Running mismatch filter heuristic tests...");
  
  runTest(
    "Lowe's Monroe 55 inch vanity top (should fail on keyword vanity-top)",
    "https://www.lowes.com/pd/ARIEL-55-in-x-22-in-Pure-White-Quartz-Quartz-Undermount-Single-Sink-Widespread-Faucet-Mount-Bathroom-Vanity-Top/5017206953",
    620.00,
    1700.00,
    false
  );

  runTest(
    "Amazon vanity mirror (should fail on keyword mirror-only)",
    "https://www.amazon.com/dp/B0BHTYNQPQ-mirror-only",
    120.00,
    1200.00,
    false
  );

  runTest(
    "Home Depot valid vanity listing matching MAP (should pass)",
    "https://www.homedepot.com/p/ARIEL-Hepburn-42-in-Single-Sink-Freestanding-Bathroom-Vanity-in-White-with-Pure-White-Quartz-Top-T043SWQRVOWHT/323469749",
    1889.00,
    1200.00,
    true
  );

  runTest(
    "Suspect low price less than 50% MAP (should fail)",
    "https://www.ebay.com/itm/some-vanity",
    400.00,
    1200.00,
    false
  );

  runTest(
    "Valid price above 50% MAP but below MAP floor (should pass - represents a real violation)",
    "https://www.homedepot.com/p/some-vanity",
    1080.00,
    1200.00,
    true
  );

  console.log("Tests completed!");
} finally {
  // Clean up temporary js file
  try {
    fs.unlinkSync(path.join(__dirname, "../lib/priceFilters.js"));
  } catch (err) {}
}

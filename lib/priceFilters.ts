/**
 * Heuristics to determine if a competitor retail link/price is a valid match
 * for the complete vanity product, or if it represents an accessory/part mismatch.
 */
export function isValidVanityMatch(
  url: string | null | undefined,
  price: number,
  mapPrice: number
): boolean {
  if (!url || price <= 0) {
    return false;
  }

  // Rule 1: Filter out accessory/parts keywords in the URL path
  const lowerUrl = url.toLowerCase();
  const accessoryKeywords = [
    "vanity-top",
    "countertop",
    "mirror-only",
    "backsplash",
    "side-splash",
    "sink-only",
    "filler-strip",
    "-top/",
    "top-only"
  ];
  const hasAccessoryKeyword = accessoryKeywords.some((keyword) =>
    lowerUrl.includes(keyword)
  );
  if (hasAccessoryKeyword) {
    return false;
  }

  // Rule 2: Suspect mismatch if the price is less than 50% of the MAP floor
  if (price < mapPrice * 0.5) {
    return false;
  }

  return true;
}

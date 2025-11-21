import comingSoonDesktop from "@assets/coming soon carte blanche_1761364163382.png";
import comingSoonMobile from "@assets/coming soon web app mobile_1758821892697.png";
/**
 * Asset path utilities for handling URL encoding and asset references
 */

/**
 * Encodes asset paths to be URL safe by encoding spaces and special characters
 * Handles already encoded paths safely to prevent double-encoding
 * @param assetPath - The asset path relative to /attached_assets/
 * @returns URL-encoded asset path
 */
export function encodeAssetPath(assetPath: string): string {
  // Remove leading slash if present
  const cleanPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;

  // Extract the attached_assets part and the actual filename
  const attachedAssetsPrefix = "attached_assets/";
  if (cleanPath.startsWith(attachedAssetsPrefix)) {
    const filename = cleanPath.slice(attachedAssetsPrefix.length);

    // Check if filename is already encoded (contains %)
    if (filename.includes("%")) {
      // Decode first to handle already-encoded paths, then re-encode
      try {
        const decodedFilename = decodeURIComponent(filename);
        const encodedFilename = encodeURIComponent(decodedFilename);
        return `/${attachedAssetsPrefix}${encodedFilename}`;
      } catch (e) {
        // If decoding fails, assume it's not properly encoded and encode as-is
        const encodedFilename = encodeURIComponent(filename);
        return `/${attachedAssetsPrefix}${encodedFilename}`;
      }
    } else {
      // Not encoded yet, encode it
      const encodedFilename = encodeURIComponent(filename);
      return `/${attachedAssetsPrefix}${encodedFilename}`;
    }
  }

  // If path doesn't start with attached_assets/, assume it's just the filename
  // Apply same decode-before-encode logic
  if (cleanPath.includes("%")) {
    try {
      const decodedFilename = decodeURIComponent(cleanPath);
      const encodedFilename = encodeURIComponent(decodedFilename);
      return `/attached_assets/${encodedFilename}`;
    } catch (e) {
      const encodedFilename = encodeURIComponent(cleanPath);
      return `/attached_assets/${encodedFilename}`;
    }
  } else {
    const encodedFilename = encodeURIComponent(cleanPath);
    return `/attached_assets/${encodedFilename}`;
  }
}

/**
 * Creates a safe asset URL from a filename
 * @param filename - The asset filename (can include path)
 * @returns Safe URL for the asset
 */
export function createAssetUrl(filename: string): string {
  if (filename.startsWith("/attached_assets/")) {
    return encodeAssetPath(filename);
  }
  return encodeAssetPath(`/attached_assets/${filename}`);
}

/**
 * Common asset paths with their encoded versions
 * This helps maintain consistency and can be imported directly
 */
export const ENCODED_ASSETS = {
  // Video assets
  CAR_SELLING_VIDEO:
    "/attached_assets/car%20selling%20online%20%20_1749419270298.mp4",
  CAFE_VIDEO: "/attached_assets/Cafe_1749419425062.mp4",
  BE_YOURSELF_VIDEO: "/attached_assets/Be%20yourself_1749419131578.mp4",
  PHONE_FINGER_VIDEO: "/attached_assets/Phone%20finger%20_1749112701077.mp4",

  // Hero/Landing images
  COMING_SOON_DESKTOP: comingSoonDesktop,
  COMING_SOON_MOBILE: comingSoonMobile,

  // Business headers
  BUSINESS_B2B_HEADER: "/attached_assets/Dedw3n%20Business%20B2B%20Header.png",
  BUSINESS_B2C_HEADER:
    "/attached_assets/Dedw3n%20Business%20B2C%20Header%20new_1749416893159.png",
  BUSINESS_C2C_HEADER:
    "/attached_assets/Dedw3n%20Business%20C2c%20header_1749418133958.png",

  // Business footers
  BUSINESS_B2B_FOOTER: "/attached_assets/Dedw3n%20Business%20B2B%20Footer.png",
  BUSINESS_B2C_FOOTER:
    "/attached_assets/Dedw3n%20Business%20B2C%20Footer%20new%202_1749417170052.png",

  // Dating headers
  DATING_HEADER: "/attached_assets/_Dedw3n%20Dating%20Header%20(1).png",
  DATING_HEADER_FALLBACK: "/attached_assets/_Dedw3n%20Dating%20Header.png",

  // Community/Campaign images
  COMMUNITY_FOOTER: "/attached_assets/Dedw3n%20comm%20Footer.png",
  COMMUNITY_HEADER: "/attached_assets/Dedw3n%20Business%20commHeader.png",

  // Marketplace images
  MARKETPLACE_PROMO:
    "/attached_assets/Copy%20of%20Dedw3n%20Marketplace%20II.png",
  MARKETPLACE_FALLBACK: "/attached_assets/Copy%20of%20Dedw3n%20Marketplace.png",
  MARKETPLACE_FOOTER:
    "/attached_assets/Copy%20of%20Dedw3n%20Marketplace%20III.png",
  MARKETPLACE_LUXURY: "/attached_assets/Dedw3n%20Marketplace%20(1).png",

  // Business logos and headers
  BUSINESS_B2B_IMAGE: "/attached_assets/Dedw3n%20Business%20B2B.png",
  D3_BLACK_LOGO: "/attached_assets/D3%20black%20logo.png",

  // Partnership and campaign images
  AFFILIATE_PARTNERSHIP:
    "/attached_assets/affiliate%20partnership%202_1754329999391.png",
  CAMPAIGN_SELL:
    "/attached_assets/Copy%20of%20Copy%20of%20Pre%20Launch%20Campaign%20%20SELL%20(1).png",

  // Business content images (with numbers)
  BUSINESS_CONTENT_5:
    "/attached_assets/Dedw3n%20Business%20%20(5)_1753733900980.png",

  // Community and communication
  COMMUNITY_COMM_HEADER: "/attached_assets/Dedw3n%20Business%20commHeader.png",
  COMMUNITY_COMM_FOOTER:
    "/attached_assets/Dedw3n%20comm%20Footer_1749108826266.png",

  // Long filename assets
  WORLD_TOMORROW:
    "/attached_assets/Copy%20of%20We%20are%20developing%20software%20today%20that%20will%20facilitate%20business%20operations%20in%20the%20world%20of%20tomorrow._1751998175092.png",
  AFFILIAT_PARTNERSHIP_3:
    "/attached_assets/Affiliat%20partnership%203_1753733859529.png",
} as const;

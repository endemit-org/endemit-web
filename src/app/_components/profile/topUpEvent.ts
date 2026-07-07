/**
 * Cross-component signal asking ProfileSidebar to open its TopUpModal.
 * Lives in its own module so listeners don't have to import the whole
 * StickerLinkPrompt bundle (framer-motion, three.js scene).
 */
export const OPEN_TOP_UP_EVENT = "endemit:open-topup";

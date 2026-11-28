// Pure horizontal swipe geometry for Home meal rows (#3686): one action width and one commit
// threshold, shared by the pointer drag handler and its unit tests.

/** Width of the revealed Delete action tray (px), matching iOS and the design board. */
export const ROW_DELETE_WIDTH = 84;

/** Horizontal drag distance (px) that commits opening or closing the Delete action. */
export const ROW_DELETE_THRESHOLD = 36;

/** Clamp a row's horizontal drag offset between fully revealed (-width) and closed (0). */
export const clampRowSwipe = (baseOffset: number, dx: number, width = ROW_DELETE_WIDTH): number =>
  Math.max(-width, Math.min(0, baseOffset + dx));

/** Decide whether a released drag leaves the Delete action revealed. */
export const shouldOpenRowSwipe = (wasOpen: boolean, dx: number): boolean =>
  wasOpen ? dx < ROW_DELETE_THRESHOLD : dx <= -ROW_DELETE_THRESHOLD;

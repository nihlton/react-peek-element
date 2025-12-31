import { CSSProperties } from "react";

export const MAX_STYLE: CSSProperties = { maxWidth: "100%" };
export const PARENT_STYLE: CSSProperties = { position: "relative", ...MAX_STYLE };
export const PLACEHOLDER_STYLE: CSSProperties = { ...MAX_STYLE };
export const CHILD_STYLE: CSSProperties = {
  width: "100%",
  position: "fixed",
  zIndex: "4000",
  ...MAX_STYLE,
};

export const SCROLLING_DOWN_CLASS = "scrolling-down";
export const SCROLLING_UP_CLASS = "scrolling-up";

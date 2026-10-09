import type * as React from "react";
import { KNOWN_ICON_NAMES } from "@/components/font-links";
import { cn } from "@/lib/utils";

export type IconizerProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** Material Symbols name (must be in the font-links allow-list). */
  icon: string;
  /** Pixel size. Omit to follow the surrounding text size (1em). */
  size?: number;
  /** Filled variant. */
  fill?: boolean;
};

// Dev-only: warn once per icon missing from the allow-list. Without a glyph in
// the subset font, Material Symbols renders the raw ligature text instead.
const warned = process.env.NODE_ENV !== "production" ? new Set<string>() : null;
function devWarn(icon: string) {
  if (!warned || warned.has(icon) || KNOWN_ICON_NAMES.has(icon)) return;
  warned.add(icon);
  console.warn(
    `[Iconizer] "${icon}" is not in the Material Symbols allow-list (components/font-links.tsx). ` +
      `It will render as plain text. Add it to ICONS.`,
  );
}

export function Iconizer({ icon, size, fill = false, className, style, ...rest }: IconizerProps) {
  if (process.env.NODE_ENV !== "production") devWarn(icon);
  return (
    <i
      translate="no"
      lang="en"
      aria-hidden
      {...rest}
      style={{
        ...(size ? { fontSize: `${size}px` } : null),
        fontVariationSettings: `"FILL" ${fill ? 1 : 0}, "wght" 400, "opsz" ${size && size <= 20 ? 20 : 24}`,
        ...style,
      }}
      className={cn("notranslate material-symbols-outlined iconizer-icon", className)}
    >
      {icon}
    </i>
  );
}

export default Iconizer;

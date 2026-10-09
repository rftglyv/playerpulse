/* eslint-disable @next/next/no-img-element -- tiny static SVG; next/image adds nothing here */

/**
 * The PlayerPulse mark (logo 03a), tightly cropped to the bubble.
 * Default height is 1em, so next to the wordmark it is exactly the text's height.
 */
export function BrandMark({ height = "1em", className }: { height?: string | number; className?: string }) {
  return (
    <img
      src="/brand/mark-tight.svg"
      alt=""
      aria-hidden="true"
      width={56}
      height={52}
      style={{ height, width: "auto" }}
      className={className}
    />
  );
}

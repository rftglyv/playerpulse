import Image from "next/image";

/** The PlayerPulse mark (logo 03a): blue speech bubble with the pixel heart. Source: public/brand/mark.svg. */
export function BrandMark({ size = 24, className }: { size?: number; className?: string }) {
  return <Image src="/brand/mark.svg" alt="" width={size} height={size} className={className} priority />;
}

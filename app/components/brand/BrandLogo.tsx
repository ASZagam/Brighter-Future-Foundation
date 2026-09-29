import Image from 'next/image';
import logo from './bff-logo.png';

/**
 * The BFF mark, in one place.
 *
 * Every surface that shows the organisation's identity — public header and
 * footer, the auth lockup, the console sidebar — renders this component rather
 * than importing the image file itself, so there is a single asset, a single
 * set of dimensions and a single contrast treatment to reason about.
 *
 * The artwork is dark navy line art on a transparent background. On a dark
 * surface that would disappear, so the mark always sits on a light plate
 * (`.brand-logo`). The plate is invisible against the light-mode header and
 * becomes the contrast anchor in dark mode, which means the logo can never be
 * recoloured or filtered to "fix" dark mode — it just works.
 */

/** Intrinsic dimensions of the trimmed asset, after transparent padding was removed. */
const INTRINSIC = { width: 294, height: 342 };

export function BrandLogo({
  height = 32,
  className = '',
  priority = false,
  alt = '',
  src,
}: {
  /** Rendered height in px; width follows the asset's aspect ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
  /** Leave empty when an adjacent wordmark already names the organisation. */
  alt?: string;
  /**
   * Overrides the bundled asset with the organisation profile's uploaded logo
   * when one has been published. Falls back to the bundled mark.
   */
  src?: string | null;
}) {
  const width = Math.round((INTRINSIC.width / INTRINSIC.height) * height);

  return (
    <span className={`brand-logo${className ? ` ${className}` : ''}`} style={{ height }}>
      <Image
        src={src || logo}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="brand-logo__img"
        style={{ height, width }}
      />
    </span>
  );
}

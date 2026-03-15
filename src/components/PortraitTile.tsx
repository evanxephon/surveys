import { PORTRAIT_IMAGES } from '../config/portraits';
import type { RoleId } from '../types';

interface PortraitTileProps {
  roleId: RoleId;
  alt?: string;
  className?: string;
  imageClassName?: string;
  overlayClassName?: string;
}

export function PortraitTile({
  roleId,
  alt = '',
  className = '',
  imageClassName = '',
  overlayClassName = '',
}: PortraitTileProps) {
  const src = PORTRAIT_IMAGES[roleId];

  return (
    <div className={`relative overflow-hidden bg-[#ddd2c0] ${className}`.trim()}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="eager"
          className={`h-full w-full object-contain ${imageClassName}`.trim()}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm tracking-[0.18em] text-[#5a4638]/80">
          肖像待补
        </div>
      )}
      <div className={`absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.03),rgba(0,0,0,0.16))] ${overlayClassName}`.trim()} />
    </div>
  );
}

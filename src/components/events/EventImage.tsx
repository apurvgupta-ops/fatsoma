"use client";

import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  priority?: boolean;
};

export default function EventImage({
  src,
  alt,
  title,
  className = "",
  priority = false,
}: Props) {
  // Check if it's a local uploaded image
  const isLocalUpload = src.startsWith("/uploads/");

  // Check if it's a placeholder image (not an actual URL)
  const isPlaceholder = src.startsWith("placeholder-");

  // Determine the image URL
  const imageUrl = isPlaceholder
    ? `https://placehold.co/600x400/1a1a1a/9333ea.png?text=${encodeURIComponent(alt)}`
    : src;

  return (
    <div className={className}>
      {title && (
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
          {title}
        </p>
      )}
      <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
        <div className="relative aspect-video">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={isLocalUpload}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://placehold.co/600x400/1a1a1a/9333ea.png?text=${encodeURIComponent(alt)}`;
            }}
          />
        </div>
        {isPlaceholder && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 backdrop-blur-[1px]">
            <div className="rounded-lg border border-purple-500/30 bg-zinc-900/90 px-3 py-2 text-xs text-purple-300">
              Demo placeholder
            </div>
          </div>
        )}
      </div>
      {isPlaceholder && (
        <p className="mt-2 text-xs text-zinc-500">
          Uploaded: {src.replace("placeholder-", "")}
        </p>
      )}
      {isLocalUpload && (
        <p className="mt-2 text-xs text-emerald-400">
          ✓ Uploaded image: {src.split("/").pop()}
        </p>
      )}
    </div>
  );
}

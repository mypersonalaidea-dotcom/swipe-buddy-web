import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/* ─────── types ─────── */
export interface GalleryGroup {
  id: string;
  label: string;
  photos: string[];
}

interface PhotoGalleryProps {
  groups: GalleryGroup[];
  initialGroupId: string;
  initialPhotoIndex: number;
  onClose: () => void;
}

/* ─────── component ─────── */
export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  groups,
  initialGroupId,
  initialPhotoIndex,
  onClose,
}) => {
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId);
  const [photoIndex, setPhotoIndex] = useState(initialPhotoIndex);
  const [fadeKey, setFadeKey] = useState(0);

  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  const allPhotosFlat = groups.flatMap((g) =>
    g.photos.map((url, idx) => ({ url, groupId: g.id, indexInGroup: idx }))
  );

  const globalActiveIndex = allPhotosFlat.findIndex(
    (p) => p.groupId === activeGroupId && p.indexInGroup === photoIndex
  );

  /* ── navigation ── */
  const goTo = useCallback((groupId: string, idx: number) => {
    setActiveGroupId(groupId);
    setPhotoIndex(idx);
    setFadeKey((k) => k + 1);
  }, []);

  const goPrev = useCallback(() => {
    if (globalActiveIndex > 0) {
      const prev = allPhotosFlat[globalActiveIndex - 1];
      goTo(prev.groupId, prev.indexInGroup);
    }
  }, [globalActiveIndex, allPhotosFlat, goTo]);

  const goNext = useCallback(() => {
    if (globalActiveIndex < allPhotosFlat.length - 1) {
      const next = allPhotosFlat[globalActiveIndex + 1];
      goTo(next.groupId, next.indexInGroup);
    }
  }, [globalActiveIndex, allPhotosFlat, goTo]);

  const switchTab = useCallback((groupId: string) => goTo(groupId, 0), [goTo]);

  /* ── keyboard ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goPrev, goNext]);

  /* ── lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* ── center active thumbnail ── */
  useEffect(() => {
    if (activeThumbnailRef.current && thumbnailStripRef.current) {
      const strip = thumbnailStripRef.current;
      const thumb = activeThumbnailRef.current;
      const scrollTarget = thumb.offsetLeft - strip.offsetWidth / 2 + thumb.offsetWidth / 2;
      strip.scrollTo({ left: scrollTarget, behavior: "smooth" });
    }
  }, [globalActiveIndex]);

  /* ── touch / swipe ── */
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
  const onTouchMove = (e: React.TouchEvent) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; };
  const onTouchEnd = () => { if (touchDeltaX.current > 60) goPrev(); else if (touchDeltaX.current < -60) goNext(); };

  /* ── build strip items ── */
  const stripItems: (
    | { kind: "photo"; url: string; groupId: string; indexInGroup: number; globalIdx: number }
    | { kind: "divider"; label: string }
  )[] = [];
  let gIdx = 0;
  groups.forEach((group, gi) => {
    if (gi > 0 && group.photos.length > 0) {
      stripItems.push({ kind: "divider", label: group.label });
    }
    group.photos.forEach((url, idx) => {
      stripItems.push({ kind: "photo", url, groupId: group.id, indexInGroup: idx, globalIdx: gIdx });
      gIdx++;
    });
  });

  const hasPrev = globalActiveIndex > 0;
  const hasNext = globalActiveIndex < allPhotosFlat.length - 1;
  const roomTabs = groups.filter((g) => g.id !== "common-area");
  const hasCommonArea = groups.some((g) => g.id === "common-area");

  /* ── render ── */
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop — frosted glass */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-black/85 to-gray-900/90 backdrop-blur-xl" />

      {/* Popup container */}
      <div
        className="gallery-popup relative z-10 flex flex-col overflow-hidden"
        style={{ width: "min(94vw, 1020px)", height: "min(90vh, 760px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Tab bar ── */}
        <div className="flex items-center px-5 pt-5 pb-3 gap-3">
          <div className="flex gap-2 flex-1 overflow-x-auto scrollbar-hide">
            {roomTabs.map((group) => {
              const isActive = activeGroupId === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => switchTab(group.id)}
                  className={`gallery-tab ${isActive ? "gallery-tab--active" : "gallery-tab--inactive"}`}
                >
                  {group.label}
                </button>
              );
            })}
          </div>
          {hasCommonArea && (
            <button
              onClick={() => switchTab("common-area")}
              className={`gallery-tab ${activeGroupId === "common-area" ? "gallery-tab--active" : "gallery-tab--inactive"}`}
            >
              Common Area
            </button>
          )}
          <button onClick={onClose} className="gallery-close-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Main viewer with arrows ── */}
        <div className="flex-1 flex items-center gap-3 px-3 mb-3 min-h-0">
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className={`gallery-arrow ${hasPrev ? "gallery-arrow--enabled" : "gallery-arrow--disabled"}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Image */}
          <div
            className="gallery-image-container"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              key={fadeKey}
              src={activeGroup?.photos[photoIndex] || ""}
              alt=""
              className="gallery-image"
            />
            {/* Counter badge */}
            <div className="gallery-counter">
              <span className="gallery-counter-current">{globalActiveIndex + 1}</span>
              <span className="gallery-counter-divider">/</span>
              <span>{allPhotosFlat.length}</span>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={!hasNext}
            className={`gallery-arrow ${hasNext ? "gallery-arrow--enabled" : "gallery-arrow--disabled"}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ── Thumbnail strip ── */}
        <div className="gallery-strip-wrapper">
          <div
            ref={thumbnailStripRef}
            className="gallery-strip"
          >
            <div className="gallery-strip-spacer" />
            {stripItems.map((item, i) => {
              if (item.kind === "divider") {
                return (
                  <div key={`divider-${i}`} className="gallery-divider">
                    <div className="gallery-divider-line" />
                    <span className="gallery-divider-label">{item.label}</span>
                    <div className="gallery-divider-line" />
                  </div>
                );
              }
              const isActive = item.globalIdx === globalActiveIndex;
              return (
                <button
                  key={`thumb-${item.globalIdx}`}
                  ref={isActive ? activeThumbnailRef : undefined}
                  onClick={() => goTo(item.groupId, item.indexInGroup)}
                  className={`gallery-thumb ${isActive ? "gallery-thumb--active" : "gallery-thumb--inactive"}`}
                >
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
            <div className="gallery-strip-spacer" />
          </div>
        </div>
      </div>

      {/* Scoped styles */}
      <style>{`
        /* ── Popup container ── */
        .gallery-popup {
          background: linear-gradient(160deg, hsl(220 20% 97%), hsl(220 14% 96%) 40%, hsl(250 15% 95%));
          border-radius: 24px;
          border: 1px solid hsl(220 13% 91%);
          box-shadow:
            0 0 0 1px hsl(220 13% 91% / 0.5),
            0 25px 80px -12px hsl(240 10% 15% / 0.35),
            0 0 60px -10px hsl(346 77% 49% / 0.08);
        }

        /* ── Tabs ── */
        .gallery-tab {
          padding: 6px 18px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1.5px solid transparent;
          flex-shrink: 0;
        }
        .gallery-tab--active {
          background: linear-gradient(135deg, hsl(346 77% 49%), hsl(346 77% 58%));
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 16px -2px hsl(346 77% 49% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.15);
        }
        .gallery-tab--inactive {
          background: hsl(220 14% 93%);
          color: hsl(220 10% 45%);
          border-color: hsl(220 13% 88%);
        }
        .gallery-tab--inactive:hover {
          background: hsl(220 14% 90%);
          color: hsl(220 10% 30%);
          border-color: hsl(346 77% 49% / 0.3);
        }

        /* ── Close button ── */
        .gallery-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(220 10% 50%);
          background: hsl(220 14% 93%);
          border: 1.5px solid hsl(220 13% 88%);
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .gallery-close-btn:hover {
          background: hsl(346 77% 49%);
          color: white;
          border-color: hsl(346 77% 49%);
          box-shadow: 0 4px 12px hsl(346 77% 49% / 0.3);
        }

        /* ── Navigation arrows ── */
        .gallery-arrow {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1.5px solid transparent;
        }
        .gallery-arrow--enabled {
          background: white;
          color: hsl(240 10% 25%);
          border-color: hsl(220 13% 88%);
          box-shadow: 0 2px 8px hsl(240 10% 15% / 0.08);
          cursor: pointer;
        }
        .gallery-arrow--enabled:hover {
          background: hsl(346 77% 49%);
          color: white;
          border-color: hsl(346 77% 49%);
          box-shadow: 0 6px 20px hsl(346 77% 49% / 0.35);
          transform: scale(1.05);
        }
        .gallery-arrow--disabled {
          background: hsl(220 14% 95%);
          color: hsl(220 10% 75%);
          border-color: hsl(220 13% 91%);
          cursor: default;
        }

        /* ── Image container ── */
        .gallery-image-container {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          border-radius: 16px;
          overflow: hidden;
          background: hsl(220 15% 12%);
          border: 1px solid hsl(220 13% 88%);
          box-shadow: inset 0 2px 20px hsl(240 10% 15% / 0.15);
        }

        /* ── Image ── */
        .gallery-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          animation: galleryFadeIn 0.25s ease-out;
        }

        /* ── Counter badge ── */
        .gallery-counter {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: hsl(0 0% 100% / 0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid hsl(0 0% 100% / 0.15);
          color: hsl(0 0% 100%);
          font-size: 12px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 20px;
          letter-spacing: 0.05em;
        }
        .gallery-counter-current {
          color: hsl(346 77% 65%);
          font-weight: 800;
        }
        .gallery-counter-divider {
          opacity: 0.4;
          margin: 0 3px;
        }

        /* ── Thumbnail strip wrapper ── */
        .gallery-strip-wrapper {
          background: linear-gradient(180deg, hsl(220 14% 94%), hsl(220 14% 96%));
          border-top: 1px solid hsl(220 13% 89%);
          border-radius: 0 0 24px 24px;
          padding: 12px 0 16px;
        }

        /* ── Thumbnail strip ── */
        .gallery-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          scroll-behavior: smooth;
        }
        .gallery-strip::-webkit-scrollbar { display: none; }

        .gallery-strip-spacer {
          flex-shrink: 0;
          min-width: 50%;
        }

        /* ── Dividers ── */
        .gallery-divider {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 6px;
          flex-shrink: 0;
        }
        .gallery-divider-line {
          width: 1px;
          height: 36px;
          background: linear-gradient(180deg, transparent, hsl(220 13% 82%), transparent);
        }
        .gallery-divider-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: hsl(220 10% 30%);
          white-space: nowrap;
        }

        /* ── Thumbnails ── */
        .gallery-thumb {
          flex-shrink: 0;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
        }
        .gallery-thumb--active {
          width: 72px;
          height: 54px;
          border-color: hsl(346 77% 49%);
          box-shadow: 0 0 0 3px hsl(346 77% 49% / 0.2), 0 4px 12px hsl(346 77% 49% / 0.15);
        }
        .gallery-thumb--inactive {
          width: 52px;
          height: 40px;
          opacity: 0.5;
          border-color: hsl(220 13% 88%);
        }
        .gallery-thumb--inactive:hover {
          opacity: 0.85;
          border-color: hsl(346 77% 49% / 0.4);
          transform: translateY(-1px);
        }

        @keyframes galleryFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

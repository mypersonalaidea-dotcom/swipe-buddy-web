import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

// Extend the Window interface for adsbygoogle
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdCardProps {
  /** Your AdSense ad slot ID (from your AdSense dashboard) */
  adSlot: string;
  /** Your AdSense publisher client ID, e.g. "ca-pub-XXXXXXXXXXXXXXXX" */
  adClient: string;
  /** Ad format – defaults to "auto" */
  adFormat?: string;
  /** Whether to use full-width responsive – defaults to true */
  fullWidthResponsive?: boolean;
}

/**
 * A Google AdSense ad rendered inside a card that matches
 * the look and feel of a ProfileCard in the swipe stack.
 */
export const AdCard = ({
  adSlot,
  adClient,
  adFormat = "auto",
  fullWidthResponsive = true,
}: AdCardProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const isAdPushed = useRef(false);

  useEffect(() => {
    // Only push the ad once per mount
    if (isAdPushed.current) return;

    try {
      // adsbygoogle may not be loaded yet in dev / without a valid publisher ID
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      isAdPushed.current = true;
    } catch (err) {
      console.error("AdSense push error:", err);
    }
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden rounded-2xl shadow-card border border-border/50 bg-card flex flex-col">
      {/* Sponsored badge */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Megaphone className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-semibold tracking-wide text-amber-600 dark:text-amber-400 uppercase">
            Sponsored
          </span>
        </div>
      </div>

      {/* Ad container */}
      <div className="flex-1 flex items-center justify-center px-4 pb-4 min-h-[250px]">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: "250px" }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
        />
      </div>
    </Card>
  );
};

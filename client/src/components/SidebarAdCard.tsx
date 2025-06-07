import { ZeroLoadingAd } from "@/components/ads/ZeroLoadingAd";

export function SidebarAdCard() {
  return (
    <ZeroLoadingAd
      adType="campaign"
      position="sidebar"
      showCloseButton={true}
      clickable={true}
      targetUrl="/special-offers"
      className="border-2 border-blue-200"
    />
  );
}
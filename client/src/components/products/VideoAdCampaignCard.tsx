import { Card } from "@/components/ui/card";
import campaignVideo from "@assets/Cafe.mp4";

export function VideoAdCampaignCard() {
  return (
    <Card className="w-full overflow-hidden">
      <div className="relative">
        <video
          className="w-full h-32 object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={campaignVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </Card>
  );
}
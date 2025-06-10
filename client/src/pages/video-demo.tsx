import { IndependentVideoCard } from "@/components/products/IndependentVideoCard";

export default function VideoDemo() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Independent Video Component Demo</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <h2 className="text-xl font-semibold mb-4">Cafe Experience Video</h2>
          <IndependentVideoCard 
            title="Cafe Experience"
            autoPlay={true}
            showControls={true}
            showInfo={true}
          />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Custom Title Video</h2>
          <IndependentVideoCard 
            title="Custom Video Title"
            autoPlay={false}
            showControls={true}
            showInfo={true}
          />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Minimal Controls</h2>
          <IndependentVideoCard 
            title="Minimal Video"
            autoPlay={true}
            showControls={true}
            showInfo={false}
          />
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Video Properties</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <ul className="space-y-2 text-sm">
            <li><strong>Source:</strong> Cafe_1749111451530.mp4</li>
            <li><strong>Controls:</strong> Play/Pause, Mute/Unmute, Info Panel</li>
            <li><strong>Properties Display:</strong> Duration, Current Time, Resolution, Volume, Speed, Status</li>
            <li><strong>Features:</strong> Auto-play, Loop, Independent state management</li>
            <li><strong>Independence:</strong> Not linked to other video entities on the website</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
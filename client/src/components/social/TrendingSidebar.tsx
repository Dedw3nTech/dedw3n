import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";

export default function TrendingSidebar() {
  return (
    <div className="hidden lg:block w-72 flex-shrink-0">
      {/* Trending Now Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="font-semibold text-lg mb-3">Trending Now</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-50 text-primary font-medium rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              #1
            </div>
            <div>
              <h4 className="font-medium text-sm">Summer Handcrafted Collection</h4>
              <p className="text-xs text-gray-500">1.2K posts • Trending in Crafts</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-blue-50 text-primary font-medium rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              #2
            </div>
            <div>
              <h4 className="font-medium text-sm">Eco-Friendly Packaging</h4>
              <p className="text-xs text-gray-500">865 posts • Trending in Sustainability</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="bg-blue-50 text-primary font-medium rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              #3
            </div>
            <div>
              <h4 className="font-medium text-sm">Home Office Setup</h4>
              <p className="text-xs text-gray-500">742 posts • Trending in Home</p>
            </div>
          </div>
        </div>
        <Button variant="link" className="w-full mt-3 text-sm text-primary hover:text-blue-600">
          See more
        </Button>
      </div>

      {/* Suggested Vendors Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="font-semibold text-lg mb-3">Suggested Vendors</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="https://images.unsplash.com/photo-1612282131293-37332d3cea00?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Vendor avatar" />
              <AvatarFallback>OB</AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-grow">
              <h4 className="font-medium text-sm">Organic Beauty Co.</h4>
              <p className="text-xs text-gray-500">Natural skincare products</p>
            </div>
            <Button variant="outline" className="px-3 py-1 border border-primary text-primary rounded-full text-xs hover:bg-blue-50">
              Follow
            </Button>
          </div>

          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="https://images.unsplash.com/photo-1506880135364-e28660dc35fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Vendor avatar" />
              <AvatarFallback>TG</AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-grow">
              <h4 className="font-medium text-sm">Tech Gadgets Pro</h4>
              <p className="text-xs text-gray-500">Latest technology accessories</p>
            </div>
            <Button variant="outline" className="px-3 py-1 border border-primary text-primary rounded-full text-xs hover:bg-blue-50">
              Follow
            </Button>
          </div>

          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="https://images.unsplash.com/photo-1619462084485-5972bf4612c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Vendor avatar" />
              <AvatarFallback>HT</AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-grow">
              <h4 className="font-medium text-sm">Handmade Treasures</h4>
              <p className="text-xs text-gray-500">Unique artisanal products</p>
            </div>
            <Button variant="outline" className="px-3 py-1 border border-primary text-primary rounded-full text-xs hover:bg-blue-50">
              Follow
            </Button>
          </div>
        </div>
        <Button variant="link" className="w-full mt-3 text-sm text-primary hover:text-blue-600">
          View all suggestions
        </Button>
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-semibold text-lg mb-3">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <UserAvatar userId={1} username="sarahwilliams" size="sm" />
            <div>
              <p className="text-sm">
                <span className="font-medium">Sarah Williams</span>
                <span className="text-gray-600"> liked your post about sustainable packaging</span>
              </p>
              <span className="text-xs text-gray-500">2h ago</span>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <UserAvatar userId={2} username="davidgarcia" size="sm" />
            <div>
              <p className="text-sm">
                <span className="font-medium">David Garcia</span>
                <span className="text-gray-600"> mentioned you in a comment</span>
              </p>
              <span className="text-xs text-gray-500">5h ago</span>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
              <i className="ri-store-2-line"></i>
            </div>
            <div>
              <p className="text-sm">
                <span className="font-medium">GemArtisans</span>
                <span className="text-gray-600"> started following you</span>
              </p>
              <span className="text-xs text-gray-500">1d ago</span>
            </div>
          </div>
        </div>
        <Button variant="link" className="w-full mt-3 text-sm text-primary hover:text-blue-600">
          View all activity
        </Button>
      </div>
    </div>
  );
}

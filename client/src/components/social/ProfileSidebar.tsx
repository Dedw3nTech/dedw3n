import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function ProfileSidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:block w-64 flex-shrink-0">
      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col items-center">
          <Avatar className="w-20 h-20 mb-2">
            <AvatarImage
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
              alt="User profile"
            />
            <AvatarFallback>AJ</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">Alex Johnson</h3>
          <p className="text-gray-500 text-sm mb-3">@alexjohnson</p>
          <div className="flex space-x-4 text-sm">
            <div className="text-center">
              <div className="font-semibold">245</div>
              <div className="text-gray-500">Following</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">1.2K</div>
              <div className="text-gray-500">Followers</div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 my-4"></div>
        <Button className="w-full py-2 bg-primary text-white rounded text-sm font-medium hover:bg-blue-600 transition">
          Edit Profile
        </Button>
      </div>

      {/* Social Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <nav className="space-y-2">
          <Link href="/community">
            <a className={`flex items-center py-2 px-3 ${location === "/community" ? "bg-blue-50 text-primary" : "text-gray-700 hover:bg-gray-50"} rounded`}>
              <i className="ri-home-line mr-3"></i>
              <span>Home Feed</span>
            </a>
          </Link>
          <Link href="/discover">
            <a className={`flex items-center py-2 px-3 ${location === "/discover" ? "bg-blue-50 text-primary" : "text-gray-700 hover:bg-gray-50"} rounded`}>
              <i className="ri-compass-line mr-3"></i>
              <span>Discover</span>
            </a>
          </Link>
          <Link href="/saved">
            <a className={`flex items-center py-2 px-3 ${location === "/saved" ? "bg-blue-50 text-primary" : "text-gray-700 hover:bg-gray-50"} rounded`}>
              <i className="ri-bookmark-line mr-3"></i>
              <span>Saved Items</span>
            </a>
          </Link>
          <Link href="/messages">
            <a className={`flex items-center py-2 px-3 ${location === "/messages" ? "bg-blue-50 text-primary" : "text-gray-700 hover:bg-gray-50"} rounded`}>
              <i className="ri-message-3-line mr-3"></i>
              <span>Messages</span>
              <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
                3
              </span>
            </a>
          </Link>
          <Link href="/communities">
            <a className={`flex items-center py-2 px-3 ${location === "/communities" ? "bg-blue-50 text-primary" : "text-gray-700 hover:bg-gray-50"} rounded`}>
              <i className="ri-group-line mr-3"></i>
              <span>Communities</span>
            </a>
          </Link>
          <Link href="/events">
            <a className={`flex items-center py-2 px-3 ${location === "/events" ? "bg-blue-50 text-primary" : "text-gray-700 hover:bg-gray-50"} rounded`}>
              <i className="ri-calendar-event-line mr-3"></i>
              <span>Events</span>
            </a>
          </Link>
        </nav>
      </div>
    </div>
  );
}

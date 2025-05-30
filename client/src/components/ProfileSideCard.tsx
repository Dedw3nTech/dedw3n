import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Bell, Settings, Users, Heart, Star, Plus, PlusCircle, ShoppingCart, Store, LogOut, Globe, MapPin, Flag } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar?: string;
  datingEnabled?: boolean;
}

export function ProfileSideCard() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : user.username.substring(0, 2).toUpperCase();

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 mb-3">
              <AvatarImage src={user.avatar} alt={user.name || user.username} />
              <AvatarFallback className="text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <h3 className="font-semibold text-lg text-gray-900">
              {user.name || user.username}
            </h3>
            
            <p className="text-sm text-blue-500 mb-3">
              @{user.username}
            </p>
            
            {user.datingEnabled && (
              <Badge variant="secondary" className="bg-pink-100 text-pink-700 border-pink-200">
                <Heart className="h-3 w-3 mr-1" />
                Open to Date
              </Badge>
            )}

          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Quick Actions */}
          <div className="space-y-2">
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-10"
            >
              <Link href="/notifications">
                <Bell className="h-5 w-5 mr-3 text-gray-700 flex-shrink-0" />
                Notifications
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-10"
            >
              <Link href="/messages">
                <MessageSquare className="h-5 w-5 mr-3 text-gray-700 flex-shrink-0" />
                Messages
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-10"
            >
              <Link href="/chatrooms">
                <svg className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  {/* First talking cloud */}
                  <path d="M7 9c-2.8 0-5 2.2-5 5s2.2 5 5 5h1.5l2.5 2.5v-2.5h1c2.8 0 5-2.2 5-5s-2.2-5-5-5H7z" fill="currentColor" opacity="0.7"/>
                  {/* Second talking cloud */}
                  <path d="M14 3c-2.8 0-5 2.2-5 5s2.2 5 5 5h1.5l2.5 2.5V13h1c2.8 0 5-2.2 5-5s-2.2-5-5-5h-4z" fill="currentColor"/>
                </svg>
                Chatrooms
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-10"
            >
              <Link href="/settings">
                <Settings className="h-5 w-5 mr-3 text-gray-700 flex-shrink-0" />
                Settings
              </Link>
            </Button>
            
            
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-10"
            >
              <Link href="/vendor-dashboard">
                <Store className="h-5 w-5 mr-3 text-gray-700 flex-shrink-0" />
                Vendor Panel
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="ghost" 
              className="w-full justify-start h-10"
            >
              <Link href="/dating-dashboard">
                <Heart className="h-5 w-5 mr-3 text-gray-700 flex-shrink-0" />
                Dating Panel
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start h-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => {
                // Handle logout
                fetch('/api/logout', { method: 'POST' })
                  .then(() => {
                    window.location.href = '/';
                  });
              }}
            >
              <LogOut className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
              Log Out
            </Button>
          </div>

          
          {/* View Profile Button */}
          <div className="pt-2">
            <Button 
              asChild 
              variant="outline" 
              className="w-full"
            >
              <Link href={`/profile/${user.username}`}>
                View Full Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Add Product/Service Button */}
      <div className="mt-4">
        <Button 
          asChild 
          variant="outline" 
          className="w-full justify-start h-12 bg-black border-black text-white hover:bg-gray-800 hover:border-gray-800"
        >
          <Link href="/add-product" className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
            <span className="text-white font-bold">Sell Product/Service</span>
          </Link>
        </Button>
      </div>
      
      {/* Chatroom Quick Access Card */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              {/* First talking cloud */}
              <path d="M7 9c-2.8 0-5 2.2-5 5s2.2 5 5 5h1.5l2.5 2.5v-2.5h1c2.8 0 5-2.2 5-5s-2.2-5-5-5H7z" fill="currentColor" opacity="0.7"/>
              {/* Second talking cloud */}
              <path d="M14 3c-2.8 0-5 2.2-5 5s2.2 5 5 5h1.5l2.5 2.5V13h1c2.8 0 5-2.2 5-5s-2.2-5-5-5h-4z" fill="currentColor"/>
            </svg>
            Chat Rooms
          </h3>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-2 text-[14px]">
          <Button 
            asChild 
            variant="ghost" 
            className="w-full justify-start h-10 text-[14px]"
          >
            <Link href="/chatrooms?room=global">
              <Globe className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
              Global Chat
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="ghost" 
            className="w-full justify-start h-10 text-[14px]"
          >
            <Link href="/chatrooms?room=regional">
              <MapPin className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
              Regional Chat
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="ghost" 
            className="w-full justify-start h-10 text-[14px]"
          >
            <Link href="/chatrooms?room=country">
              <Flag className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
              Local Chat
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Footer Information Card */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mt-4">
        <div className="space-y-3">
          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 mb-2">Quick Links</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <Link href="/about" className="text-gray-600 hover:text-blue-500">About</Link>
              <Link href="/help" className="text-gray-600 hover:text-blue-500">Help</Link>
              <Link href="/privacy" className="text-gray-600 hover:text-blue-500">Privacy</Link>
              <Link href="/terms" className="text-gray-600 hover:text-blue-500">Terms</Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-500">Contact</Link>
              <Link href="/careers" className="text-gray-600 hover:text-blue-500">Careers</Link>
            </div>
          </div>

          {/* App Downloads */}
          <div>
            <h4 className="text-xs font-semibold text-gray-900 mb-2">Download App</h4>
            <div className="space-y-2">
              <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
                 className="block hover:opacity-80 transition-opacity">
                <svg width="120" height="35" viewBox="0 0 120 35" className="w-full h-auto">
                  <rect width="120" height="35" rx="6" fill="#000000"/>
                  <text x="70" y="12" textAnchor="middle" fill="white" fontSize="8" fontWeight="300">Download on the</text>
                  <text x="70" y="25" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">App Store</text>
                  {/* Apple Logo */}
                  <g transform="translate(15, 10)">
                    <path d="M12.5 2.5c0.8-1 1.3-2.4 1.2-3.8-1.2 0.1-2.6 0.8-3.5 1.8-0.7 0.9-1.4 2.3-1.2 3.7 1.3 0.1 2.6-0.7 3.5-1.7zm1.2 1.9c-1.9-0.1-3.6 1.1-4.5 1.1-0.9 0-2.3-1-3.8-1-1.9 0-3.7 1.1-4.7 2.8-2 3.5-0.5 8.7 1.4 11.5 0.9 1.4 2 2.9 3.4 2.8 1.4-0.1 1.9-0.9 3.6-0.9s2.1 0.9 3.6 0.9c1.5 0 2.4-1.3 3.3-2.7 1-1.6 1.4-3.1 1.4-3.2-0.1 0-2.7-1-2.7-4.2 0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.1-4-2.1z" fill="white"/>
                  </g>
                </svg>
              </a>
              <a href="https://play.google.com" target="_blank" rel="noopener noreferrer"
                 className="block hover:opacity-80 transition-opacity">
                <svg width="120" height="35" viewBox="0 0 120 35" className="w-full h-auto">
                  <rect width="120" height="35" rx="6" fill="#000000"/>
                  <text x="70" y="12" textAnchor="middle" fill="white" fontSize="8" fontWeight="300">Get it on</text>
                  <text x="70" y="25" textAnchor="middle" fill="white" fontSize="14" fontWeight="600">Google Play</text>
                  {/* Google Play Logo */}
                  <g transform="translate(15, 8)">
                    <defs>
                      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#4285F4"}}/>
                        <stop offset="100%" style={{stopColor:"#286EF1"}}/>
                      </linearGradient>
                      <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#34A853"}}/>
                        <stop offset="100%" style={{stopColor:"#137333"}}/>
                      </linearGradient>
                      <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#FBBC04"}}/>
                        <stop offset="100%" style={{stopColor:"#F29900"}}/>
                      </linearGradient>
                      <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:"#EA4335"}}/>
                        <stop offset="100%" style={{stopColor:"#D33B2C"}}/>
                      </linearGradient>
                    </defs>
                    <path d="M2 2 L10 10 L2 18 Z" fill="url(#blueGradient)"/>
                    <path d="M10 10 L18 2 L14 2 L10 6 Z" fill="url(#yellowGradient)"/>
                    <path d="M10 10 L18 18 L14 18 L10 14 Z" fill="url(#greenGradient)"/>
                    <path d="M2 18 L10 10 L6 10 L2 14 Z" fill="url(#redGradient)"/>
                  </g>
                </svg>
              </a>
            </div>
          </div>

          {/* Company Info */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-900">Dedw3n Ltd.</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Dedw3n Ltd. is a British Company registered in England, Wales and Scotland under registration number 15930281, whose registered office is situated 50 Essex Street, London, England, WC2R3JF.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed mt-2">
              Our bank is registered with HSBC UK IBAN GB79 HBUK 4003 2782 3984 94(BIC BUKGB4B), our sole official website is www.dedw3n.com.
            </p>
            <p className="text-xs text-gray-400 mt-1">© 2025 Dedw3n Ltd. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Crown, Gem, Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/LoginPromptModal";

interface DatingRoomWallProps {
  children: React.ReactNode;
}

export function DatingRoomWall({ children }: DatingRoomWallProps) {
  const { user } = useAuth();
  const { isOpen, action, showLoginPrompt, closePrompt } = useLoginPrompt();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const rooms = [
    {
      id: "normal",
      name: "Normal Room",
      icon: <Heart className="h-8 w-8" />,
      color: "bg-blue-500",
      borderColor: "border-blue-200",
      price: "Free",
      description: "Basic dating features for everyone",
      features: [
        "Browse profiles",
        "Like profiles", 
        "Basic messaging",
        "Create profile"
      ],
      badge: "FREE",
      badgeColor: "bg-blue-100 text-blue-800"
    },
    {
      id: "vip",
      name: "VIP Room",
      icon: <Crown className="h-8 w-8" />,
      color: "bg-purple-500",
      borderColor: "border-purple-200",
      price: "$9.99/month",
      description: "Enhanced features for serious daters",
      features: [
        "All Normal features",
        "Unlimited likes",
        "See who liked you",
        "Priority matching",
        "Advanced filters",
        "Read receipts"
      ],
      badge: "POPULAR",
      badgeColor: "bg-purple-100 text-purple-800"
    },
    {
      id: "vvip",
      name: "VVIP Room", 
      icon: <Gem className="h-8 w-8" />,
      color: "bg-gradient-to-r from-yellow-400 to-orange-500",
      borderColor: "border-yellow-200",
      price: "$19.99/month",
      description: "Exclusive premium experience",
      features: [
        "All VIP features",
        "Boost your profile",
        "Incognito mode",
        "Video calling",
        "Gift sending",
        "24/7 premium support",
        "Exclusive events access"
      ],
      badge: "PREMIUM",
      badgeColor: "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800"
    }
  ];

  const handleRoomSelect = (roomId: string) => {
    if (!user) {
      showLoginPrompt("dating");
      return;
    }
    
    // Check if user has activated dating in their profile
    if (!user.datingEnabled) {
      // Show dialog to activate dating feature
      setSelectedRoom(roomId);
      setShowConfirmDialog(true);
      return;
    }
    
    // Check if user has access to this room based on their subscription
    const userSubscription = user.datingSubscription || 'normal';
    const hasAccess = checkRoomAccess(roomId, userSubscription);
    
    if (!hasAccess) {
      // Show upgrade dialog for rooms they don't have access to
      setSelectedRoom(roomId);
      setShowConfirmDialog(true);
      return;
    }
    
    // User has access, allow entry
    setSelectedRoom(roomId);
  };

  const checkRoomAccess = (roomId: string, userSubscription: string): boolean => {
    const subscriptionLevels = {
      'normal': ['normal'],
      'vip': ['normal', 'vip'],
      'vvip': ['normal', 'vip', 'vvip']
    };
    
    return subscriptionLevels[userSubscription as keyof typeof subscriptionLevels]?.includes(roomId) || false;
  };

  const handleConfirmSelection = async () => {
    if (!user) return;

    try {
      // If user hasn't activated dating, activate it first
      if (!user.datingEnabled) {
        const response = await fetch('/api/user/activate-dating', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          // Refresh user data by refetching
          window.location.reload();
        } else {
          console.error('Failed to activate dating');
        }
      } else {
        // Handle subscription upgrade logic here
        console.log(`Upgrading to ${selectedRoom} subscription`);
      }
    } catch (error) {
      console.error('Error handling confirmation:', error);
    }

    setShowConfirmDialog(false);
    setSelectedRoom(null);
  };

  // If user has selected a room, show the content
  if (selectedRoom) {
    return <>{children}</>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Dating Experience</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the perfect room for your dating journey. Each tier offers unique features to help you find your perfect match.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {rooms.map((room) => {
          const userSubscription = user?.datingSubscription || 'normal';
          const hasAccess = checkRoomAccess(room.id, userSubscription);
          const isDatingDisabled = user && !user.datingEnabled;
          const isLocked = !hasAccess || isDatingDisabled;
          
          return (
            <Card 
              key={room.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${room.borderColor} border-2 cursor-pointer ${
                isLocked ? 'opacity-60 grayscale' : ''
              }`}
              onClick={() => handleRoomSelect(room.id)}
            >
              {room.id !== "normal" && (
              <div className="absolute top-4 right-4">
                <Badge className={room.badgeColor}>{room.badge}</Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className={`w-16 h-16 rounded-full ${room.color} flex items-center justify-center mx-auto mb-4 text-white`}>
                {room.icon}
              </div>
              <CardTitle className="text-2xl font-bold">{room.name}</CardTitle>
              <CardDescription className="text-gray-600">{room.description}</CardDescription>
              <div className="text-3xl font-bold text-gray-900 mt-2">{room.price}</div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                {room.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className={`w-full ${
                  room.id === "normal" 
                    ? "bg-blue-500 hover:bg-blue-600" 
                    : room.id === "vip" 
                    ? "bg-purple-500 hover:bg-purple-600" 
                    : "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                } text-white`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoomSelect(room.id);
                }}
              >
                {room.id === "normal" ? "Enter Free Room" : "Upgrade Now"}
              </Button>
            </CardContent>
          </Card>
          )
        })}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          All plans include basic safety features and community guidelines protection
        </p>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {user && !user.datingEnabled ? (
              <>
                <DialogTitle>Activate Dating Feature</DialogTitle>
                <DialogDescription>
                  To access dating rooms, you need to activate the dating feature in your profile first. 
                  This will enable you to connect with others and find meaningful relationships.
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle>Upgrade to {selectedRoom === "vip" ? "VIP" : "VVIP"} Room</DialogTitle>
                <DialogDescription>
                  You're about to upgrade to the {selectedRoom === "vip" ? "VIP" : "VVIP"} dating experience. 
                  This will unlock premium features and enhance your dating journey.
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              className={
                user && !user.datingEnabled 
                  ? "bg-blue-500 hover:bg-blue-600"
                  : selectedRoom === "vip" 
                  ? "bg-purple-500 hover:bg-purple-600" 
                  : "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
              }
              onClick={handleConfirmSelection}
            >
              {user && !user.datingEnabled ? "Activate Dating" : "Confirm Upgrade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Prompt Modal */}
      <LoginPromptModal 
        isOpen={isOpen} 
        onClose={closePrompt} 
        action={action} 
      />
    </div>
  );
}
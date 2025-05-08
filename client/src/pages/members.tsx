import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserWithoutPassword } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  MessageSquare, 
  Phone, 
  PhoneOff,
  Video, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  User as UserIcon,
  Users,
  Store
} from 'lucide-react';
import { generateAvatarFallback } from '@/lib/utils';

// Member Card Component
const MemberCard = ({ member, onMessageClick, onCallClick, onVideoClick }: { 
  member: UserWithoutPassword, 
  onMessageClick: (member: UserWithoutPassword) => void,
  onCallClick: (member: UserWithoutPassword) => void,
  onVideoClick: (member: UserWithoutPassword) => void
}) => {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  
  // For grabbing vendor data if the user is a vendor
  const { data: vendorData } = useQuery<{ id: number; storeName: string }>({
    queryKey: [`/api/vendors/user/${member.id}`],
    enabled: !!member.isVendor,
  });
  
  const goToVendorStore = () => {
    if (vendorData) {
      setLocation(`/vendor/${vendorData.id}`);
    }
  };
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={member.avatar || undefined} alt={member.name} />
            <AvatarFallback>{generateAvatarFallback(member.name)}</AvatarFallback>
          </Avatar>
          {member.isVendor && (
            <div className="flex flex-col items-end">
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 mb-1">
                <Store className="mr-1 h-3 w-3" />
                {t('members.vendor')}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs bg-primary text-white border-primary hover:bg-primary/90 hover:text-white"
                onClick={goToVendorStore}
              >
                <Store className="mr-1 h-3 w-3" />
                {t('members.visit_store')}
              </Button>
            </div>
          )}
        </div>
        <CardTitle className="mt-2">{member.name}</CardTitle>
        <CardDescription className="flex items-center">
          <Mail className="mr-1 h-3 w-3" /> {member.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          {member.bio || t('members.no_bio')}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
          onClick={() => onMessageClick(member)}
        >
          <MessageSquare className="mr-1 h-4 w-4" />
          {t('members.message')}
        </Button>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 w-8"
            onClick={() => onCallClick(member)}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 h-8 w-8"
            onClick={() => onVideoClick(member)}
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Chat Dialog Component
interface ChatDialogProps {
  isOpen: boolean;
  member?: UserWithoutPassword;
  onClose: () => void;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ isOpen, member, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    content: string;
    senderId: number;
    timestamp: Date;
  }>>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [callStatus, setCallStatus] = useState<'none' | 'incoming' | 'outgoing' | 'active'>('none');
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [callerId, setCallerId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && member && user) {
      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connected');
        
        // Send authentication message once connection is open
        const authToken = localStorage.getItem('dedwen_auth_token');
        const authMessage = {
          type: 'authenticate',
          userId: user.id,
          token: authToken
        };
        
        console.log('Sent authentication request to WebSocket server with token');
        newSocket.send(JSON.stringify(authMessage));
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Handle authentication confirmation
          if (data.type === 'authenticated') {
            console.log('Successfully authenticated with WebSocket server');
          }
          // Handle error messages
          else if (data.type === 'error') {
            console.error('WebSocket error message:', data.message);
          }
          // Handle incoming messages
          else if ((data.type === 'chat' || data.type === 'message' || data.type === 'new_message') && 
                   (data.senderId === member.id || data.message?.senderId === member.id)) {
            
            // Handle the different message formats
            const messageData = data.type === 'new_message' ? data.message : data;
            
            setChatMessages(prev => [...prev, {
              id: messageData.messageId || messageData.id || Date.now(),
              content: messageData.content,
              senderId: messageData.senderId,
              timestamp: new Date(messageData.timestamp || Date.now())
            }]);
            console.log('Added message to chat:', messageData);
          }
          
          // Handle incoming call request
          else if (data.type === 'call-request' && data.callerId === member.id) {
            setCallStatus('incoming');
            setCallType(data.callType);
            setCallerId(data.callerId);
            
            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(t('members.incoming_call'), {
                body: t('members.incoming_call_from', { name: member.name }),
                icon: member.avatar || undefined
              });
            } else {
              // If notifications not supported, use alert
              if (window.confirm(t('members.incoming_call_from', { name: member.name }) + "\n" + 
                                 t('members.accept_call'))) {
                acceptCall();
              } else {
                rejectCall();
              }
            }
          }
          
          // Handle call response (accept/reject)
          else if (data.type === 'call-response' && data.responderId === member.id) {
            if (data.accepted) {
              setCallStatus('active');
              // In a real implementation, this would set up WebRTC connection
              alert(t('members.call_connected'));
            } else {
              setCallStatus('none');
              setCallType(null);
              alert(t('members.call_rejected'));
            }
          }
          
          // Handle call errors
          else if (data.type === 'call-error') {
            setCallStatus('none');
            setCallType(null);
            alert(t('members.call_error', { error: data.error }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message', error);
        }
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      setSocket(newSocket);
      
      // Fetch previous messages
      // This would be implemented with an API call in a real app
      
      return () => {
        newSocket.close();
      };
    }
  }, [isOpen, member, user, t]);
  
  const sendMessage = () => {
    if (!message.trim() || !socket || !member || !user) return;
    
    // Make sure to use 'message' type which the server is expecting
    const messageData = {
      type: 'message',
      receiverId: member.id,
      content: message,
      senderId: user.id
    };
    
    socket.send(JSON.stringify(messageData));
    console.log('Sending message:', messageData);
    
    // Optimistically add message to UI
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      content: message,
      senderId: user.id,
      timestamp: new Date()
    }]);
    
    setMessage('');
  };
  
  // Handle accepting an incoming call
  const acceptCall = () => {
    if (!socket || !callerId) return;
    
    socket.send(JSON.stringify({
      type: 'call-response',
      callerId: callerId,
      accepted: true,
      // In a real implementation, this would include WebRTC SDP offer
      sdpOffer: null
    }));
    
    setCallStatus('active');
  };
  
  // Handle rejecting an incoming call
  const rejectCall = () => {
    if (!socket || !callerId) return;
    
    socket.send(JSON.stringify({
      type: 'call-response',
      callerId: callerId,
      accepted: false
    }));
    
    setCallStatus('none');
    setCallType(null);
    setCallerId(null);
  };
  
  // Handle ending an active call
  const endCall = () => {
    setCallStatus('none');
    setCallType(null);
    setCallerId(null);
    // In a real implementation, this would close WebRTC connections
  };
  
  if (!isOpen || !member) return null;
  
  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-lg flex flex-col z-50">
      <div className="flex justify-between items-center p-3 border-b">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={member.avatar || undefined} alt={member.name} />
            <AvatarFallback>{generateAvatarFallback(member.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{member.name}</h3>
            {callStatus !== 'none' && (
              <p className="text-xs text-muted-foreground">
                {callStatus === 'incoming' ? t('members.incoming_call') : 
                 callStatus === 'outgoing' ? t('members.calling') : 
                 t('members.in_call')}
                {callType && ` (${callType})`}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          &times;
        </Button>
      </div>
      
      {/* Incoming Call UI */}
      {callStatus === 'incoming' && (
        <div className="p-4 bg-green-50 border-b flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            <Phone className="h-6 w-6 text-green-500 animate-pulse mr-2" />
            <span>{t('members.incoming_call_from', { name: member.name })}</span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={acceptCall} 
              variant="default" 
              className="bg-green-500 hover:bg-green-600"
              size="sm"
            >
              <Phone className="mr-1 h-4 w-4" />
              {t('members.accept')}
            </Button>
            <Button 
              onClick={rejectCall} 
              variant="destructive"
              size="sm"
            >
              <PhoneOff className="mr-1 h-4 w-4" />
              {t('members.decline')}
            </Button>
          </div>
        </div>
      )}
      
      {/* Active Call UI */}
      {callStatus === 'active' && (
        <div className="p-4 bg-blue-50 border-b flex flex-col items-center">
          <div className="flex items-center justify-center mb-2">
            {callType === 'audio' ? (
              <Phone className="h-6 w-6 text-blue-500 mr-2" />
            ) : (
              <Video className="h-6 w-6 text-blue-500 mr-2" />
            )}
            <span>{t('members.call_in_progress', { duration: '00:00' })}</span>
          </div>
          <Button 
            onClick={endCall} 
            variant="destructive"
            size="sm"
          >
            <PhoneOff className="mr-1 h-4 w-4" />
            {t('members.end_call')}
          </Button>
        </div>
      )}
      
      <div className="flex-grow p-3 overflow-y-auto flex flex-col gap-2">
        {chatMessages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            {t('members.start_conversation')}
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.senderId === user?.id
                  ? 'bg-primary/10 text-primary-foreground self-end'
                  : 'bg-muted self-start'
              }`}
            >
              <p className="text-sm text-black">{msg.content}</p>
              <span className="text-xs text-muted-foreground">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('members.type_message')}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button onClick={sendMessage}>{t('members.send')}</Button>
      </div>
    </div>
  );
};

// Main Directory Page
const MembersPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeChatMember, setActiveChatMember] = useState<UserWithoutPassword | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!user) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      
      // Send authentication message once connection is open
      const authToken = localStorage.getItem('dedwen_auth_token');
      const authMessage = {
        type: 'authenticate',
        userId: user.id,
        token: authToken
      };
      
      console.log('Sent authentication request to WebSocket server with token');
      ws.send(JSON.stringify(authMessage));
    };
    
    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      try {
        const data = JSON.parse(event.data);
        
        // Handle authentication confirmation
        if (data.type === 'authenticated') {
          console.log('Successfully authenticated with WebSocket server');
        }
        // Handle different message types
        else if (data.type === 'new_message') {
          // Show notification for new message
          toast({
            title: "New Message",
            description: `You have a new message from ${data.message.senderName || 'someone'}`,
          });
          
          // Play notification sound if available
          const notificationSound = new Audio('/notification.mp3');
          notificationSound.play().catch(e => console.log('Could not play notification sound'));
          
          // If in chat with this user, update the chat
          if (activeChatMember && activeChatMember.id === data.message.senderId) {
            // Add message to current chat
            setChatMessages((prev: any[]) => [...prev, data.message]);
          }
        } 
        // Handle chat message type (direct format)
        else if (data.type === 'chat' || data.type === 'message') {
          // If in chat with this user, update the chat
          if (activeChatMember && activeChatMember.id === data.senderId) {
            // Add message to current chat
            setChatMessages((prev: any[]) => [...prev, {
              id: data.messageId || data.id || Date.now(),
              content: data.content,
              senderId: data.senderId,
              timestamp: new Date(data.timestamp || Date.now())
            }]);
          }
          
          // Show notification if not in active chat
          if (!activeChatMember || activeChatMember.id !== data.senderId) {
            // Use a generic name since we might not have members loaded yet
            toast({
              title: "New Message",
              description: `${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
            });
          }
        }
        else if (data.type === 'notification') {
          // Show notification for any other notification type
          toast({
            title: "New Notification",
            description: data.message,
          });
        }
        // Handle error messages
        else if (data.type === 'error') {
          console.error('WebSocket error message:', data.message);
          toast({
            title: "Connection Error",
            description: data.message,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [user, toast, activeChatMember]);
  
  const membersPerPage = 12;
  
  const { data: members = [], isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: ['/api/members'],
    enabled: !!user,
  });
  
  if (!user) {
    // Redirect to login if not authenticated
    useEffect(() => {
      setLocation('/auth');
    }, [setLocation]);
    return null;
  }
  
  // Filter members based on search and active tab
  const filteredMembers = members.filter(member => {
    // Filter by search
    const matchesSearch = search === '' || 
      member.name.toLowerCase().includes(search.toLowerCase()) || 
      member.email.toLowerCase().includes(search.toLowerCase());
    
    // Filter by tab
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'vendors' && member.isVendor) ||
      (activeTab === 'regular' && !member.isVendor);
    
    // Don't include the current user
    const isNotCurrentUser = member.id !== user.id;
    
    return matchesSearch && matchesTab && isNotCurrentUser;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * membersPerPage,
    currentPage * membersPerPage
  );
  
  const handleMessageClick = (member: UserWithoutPassword) => {
    setActiveChatMember(member);
  };
  
  const handleCallClick = (member: UserWithoutPassword) => {
    if (!socket || !user) {
      alert(t('members.connection_error'));
      return;
    }
    
    setActiveChatMember(member);
    
    // Send call request via WebSocket
    const callRequest = {
      type: 'call-request',
      receiverId: member.id,
      callType: 'audio'
    };
    
    socket.send(JSON.stringify(callRequest));
    alert(t('members.calling_audio', { name: member.name }));
  };
  
  const handleVideoClick = (member: UserWithoutPassword) => {
    if (!socket || !user) {
      alert(t('members.connection_error'));
      return;
    }
    
    setActiveChatMember(member);
    
    // Send call request via WebSocket
    const callRequest = {
      type: 'call-request',
      receiverId: member.id,
      callType: 'video'
    };
    
    socket.send(JSON.stringify(callRequest));
    alert(t('members.calling_video', { name: member.name }));
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Users className="mr-2 h-8 w-8" />
        {t('members.directory')}
      </h1>
      
      <div className="flex flex-col gap-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/40 p-4 rounded-lg">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('members.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="all">
                <Users className="mr-1 h-4 w-4" />
                {t('members.all')}
              </TabsTrigger>
              <TabsTrigger value="vendors">
                <Store className="mr-1 h-4 w-4" />
                {t('members.vendors')}
              </TabsTrigger>
              <TabsTrigger value="regular">
                <UserIcon className="mr-1 h-4 w-4" />
                {t('members.regular')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Members Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : paginatedMembers.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <UserIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{t('members.no_members_found')}</h3>
            <p className="text-muted-foreground">{t('members.try_different_search')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onMessageClick={handleMessageClick}
                onCallClick={handleCallClick}
                onVideoClick={handleVideoClick}
              />
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              {t('members.page')} {currentPage} {t('members.of')} {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Chat Dialog */}
      <ChatDialog
        isOpen={!!activeChatMember}
        member={activeChatMember}
        onClose={() => setActiveChatMember(undefined)}
      />
    </div>
  );
};

export default MembersPage;
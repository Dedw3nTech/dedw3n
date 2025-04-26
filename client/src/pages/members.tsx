import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserWithoutPassword } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
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
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={member.avatar || undefined} alt={member.name} />
            <AvatarFallback>{generateAvatarFallback(member.name)}</AvatarFallback>
          </Avatar>
          {member.isVendor && (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
              <Store className="mr-1 h-3 w-3" />
              {t('members.vendor')}
            </Badge>
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

  useEffect(() => {
    if (isOpen && member && user) {
      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${user.id}`;
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        console.log('WebSocket connected');
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          if (data.type === 'chat' && data.senderId === member.id) {
            setChatMessages(prev => [...prev, {
              id: data.messageId || Date.now(),
              content: data.content,
              senderId: data.senderId,
              timestamp: new Date(data.timestamp)
            }]);
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
  }, [isOpen, member, user]);
  
  const sendMessage = () => {
    if (!message.trim() || !socket || !member || !user) return;
    
    const messageData = {
      type: 'chat',
      receiverId: member.id,
      content: message
    };
    
    socket.send(JSON.stringify(messageData));
    
    // Optimistically add message to UI
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      content: message,
      senderId: user.id,
      timestamp: new Date()
    }]);
    
    setMessage('');
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
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          &times;
        </Button>
      </div>
      
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
              <p className="text-sm">{msg.content}</p>
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
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeChatMember, setActiveChatMember] = useState<UserWithoutPassword | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');
  
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
    // For real implementation, this would initiate a call request via WebSocket
    alert(`Starting audio call with ${member.name}`);
  };
  
  const handleVideoClick = (member: UserWithoutPassword) => {
    // For real implementation, this would initiate a video call request via WebSocket
    alert(`Starting video call with ${member.name}`);
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
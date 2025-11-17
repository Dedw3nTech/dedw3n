import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ResolvedUserAvatar } from '@/components/ui/resolved-user-avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import {  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  MessageSquare, 
  Send, 
  User, 
  Smile, 
  Image, 
  Video, 
  Paperclip, 
  X, 
  FileText, 
  Music, 
  FileSpreadsheet, 
  Bot,
  Phone,
  VideoIcon,
  Plus,
  Settings,
  Search,
  Edit,
  Info,
  Bell,
  BellOff,
  ThumbsUp,
  Shield,
  Users,
  UserX,
  Eye,
  EyeOff,
  ChevronRight,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  CameraOff
} from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import EmojiPicker from 'emoji-picker-react';
import { AIMessageAssistant } from './AIMessageAssistant';
import { useToast } from '@/hooks/use-toast';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { apiRequest } from '@/lib/queryClient';

// ============================================================================
// Helper Functions - Clean Coding Principle: Extract Pure Functions
// ============================================================================

/**
 * Determines the file type category from MIME type
 */
const getFileType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || 
      mimeType.includes('sheet') || mimeType.includes('presentation') ||
      mimeType.includes('text') || mimeType === 'application/rtf') {
    return 'document';
  }
  return 'file';
};

/**
 * Returns appropriate icon component for file type
 */
const getFileIcon = (mimeType: string) => {
  const fileType = getFileType(mimeType);
  switch (fileType) {
    case 'image':
      return <Image className="h-6 w-6 text-blue-500" />;
    case 'video':
      return <Video className="h-6 w-6 text-purple-500" />;
    case 'audio':
      return <Music className="h-6 w-6 text-green-500" />;
    case 'document':
      return mimeType.includes('sheet') ? 
        <FileSpreadsheet className="h-6 w-6 text-green-600" /> : 
        <FileText className="h-6 w-6 text-red-500" />;
    default:
      return <FileText className="h-6 w-6 text-gray-500" />;
  }
};

/**
 * Formats message timestamp for display
 */
function formatMessageTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Formats conversation time in sidebar
 */
function formatConversationTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface MessagingUser {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
}

// ============================================================================
// Main Component
// ============================================================================

export function UnifiedMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    conversations, 
    messages, 
    conversationMessages, 
    unreadCount, 
    isConnected, 
    sendMessage, 
    setActiveConversation, 
    refreshConversations 
  } = useMessaging();

  // Translation strings - Clean Coding: Centralized text management
  const translationTexts = useMemo(() => [
    'Messages',
    'Search messages',
    'No conversations yet',
    'New Message',
    'Search members',
    'Loading members...',
    'No members found',
    'Privacy Settings',
    'Manage your messaging privacy preferences',
    'Online Status',
    'Visible to everyone',
    'Hidden from everyone',
    'Group Invites',
    'Anyone can add you to groups',
    'Only friends can add you to groups',
    'Blocked Users',
    "People you've blocked",
    'No blocked users',
    'Unblock',
    'Muted Contacts',
    "People you've muted",
    'No muted contacts',
    'Unmute',
    'Search Results for',
    'results found',
    'Messages',
    'Conversations',
    'Members',
    'No results found',
    'Try a different search term',
    'Your Messages',
    'Send private messages to friends',
    'Active 19 min ago',
    'Start a conversation with',
    'Type a message',
    'Image',
    'Video',
    'File',
    'Dedw3n Profile',
    'View Profile',
    'Mute',
    'Unmute',
    'Audio',
    'Profile',
    'AI Message Assistant',
    'Manage Messages',
    'Privacy',
    'Message management feature coming soon!',
    'Voice Call',
    'Initiating voice call with',
    'Video Call',
    'Initiating video call with',
    'Unknown User',
    'Block',
    'Unblock',
    'Report',
    'User blocked successfully',
    'User unblocked successfully',
    'Issue reported successfully',
    'Select a reason',
    'Harassment',
    'Spam',
    'Inappropriate Content',
    'Other',
    'Additional details (optional)',
    'Submit Report',
    'Report User',
    'Block this user?',
    'They will not be able to message you anymore',
    'Block',
    'Cancel'
  ], []);

  const { translations } = useMasterBatchTranslation(translationTexts, 'high');

  // Translation helper - Clean Coding: Descriptive variable names
  const t = useMemo(() => ({
    messages: translations[0],
    searchMessages: translations[1],
    noConversations: translations[2],
    newMessage: translations[3],
    searchMembers: translations[4],
    loadingMembers: translations[5],
    noMembersFound: translations[6],
    privacySettings: translations[7],
    managePrivacy: translations[8],
    onlineStatus: translations[9],
    visibleToEveryone: translations[10],
    hiddenFromEveryone: translations[11],
    groupInvites: translations[12],
    anyoneCanAdd: translations[13],
    onlyFriendsCanAdd: translations[14],
    blockedUsers: translations[15],
    peopleBlocked: translations[16],
    noBlockedUsers: translations[17],
    unblock: translations[18],
    mutedContacts: translations[19],
    peopleMuted: translations[20],
    noMutedContacts: translations[21],
    unmute: translations[22],
    searchResultsFor: translations[23],
    resultsFound: translations[24],
    messagesLabel: translations[25],
    conversationsLabel: translations[26],
    membersLabel: translations[27],
    noResultsFound: translations[28],
    tryDifferentSearch: translations[29],
    yourMessages: translations[30],
    sendPrivateMessages: translations[31],
    activeMinAgo: translations[32],
    startConversation: translations[33],
    typeMessage: translations[34],
    image: translations[35],
    video: translations[36],
    file: translations[37],
    dedw3nProfile: translations[38],
    viewProfile: translations[39],
    muteNotifications: translations[40],
    unmuteNotifications: translations[41],
    audio: translations[42],
    profile: translations[43],
    aiAssistant: translations[44],
    manageMessages: translations[45],
    privacy: translations[46],
    messageManagementSoon: translations[47],
    voiceCall: translations[48],
    initiatingVoiceCall: translations[49],
    videoCall: translations[50],
    initiatingVideoCall: translations[51],
    unknownUser: translations[52],
    blockUser: translations[53],
    unblockUser: translations[54],
    reportIssue: translations[55],
    userBlockedSuccess: translations[56],
    userUnblockedSuccess: translations[57],
    issueReportedSuccess: translations[58],
    selectReason: translations[59],
    harassment: translations[60],
    spam: translations[61],
    inappropriateContent: translations[62],
    other: translations[63],
    additionalDetails: translations[64],
    submitReport: translations[65],
    reportUser: translations[66],
    blockThisUser: translations[67],
    noMessageAfterBlock: translations[68],
    block: translations[69],
    cancel: translations[70]
  }), [translations]);

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<MessagingUser | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [onlineStatusVisible, setOnlineStatusVisible] = useState(true);
  const [allowGroupInvites, setAllowGroupInvites] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<MessagingUser[]>([]);
  const [mutedUsers, setMutedUsers] = useState<MessagingUser[]>([]);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  
  // Mobile Navigation State
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  
  // Call State Management
  const [activeCall, setActiveCall] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMutedCall, setIsMutedCall] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [ringDuration, setRingDuration] = useState(0);
  const [hasVideoStream, setHasVideoStream] = useState(false);

  // Ringing Audio Ref
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Video Refs for WebRTC
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Fetch users for messaging
  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/messages/users'],
    enabled: !!user?.id,
  });

  // Determine current recipient - Clean Coding: Early calculation to prevent temporal dead zone
  const currentRecipient: any = selectedUser || (() => {
    let participant = selectedConversation?.participants?.find((p: any) => p.id !== user?.id);
    
    // Fallback for self-conversations: find any participant with complete data
    if (!participant && selectedConversation?.participants) {
      participant = selectedConversation.participants.find((p: any) => p.username || p.name);
    }
    
    return participant;
  })();

  // Fetch call history for active conversation
  const otherParticipantId = currentRecipient?.id;
  const { data: callHistoryData } = useQuery({
    queryKey: [`/api/calls/conversation/${otherParticipantId}`],
    enabled: !!user?.id && !!otherParticipantId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  
  const callHistory = callHistoryData?.calls || [];

  // ============================================================================
  // Event Handlers - Clean Coding: Grouped by functionality
  // ============================================================================

  // Conversation Management
  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
    setSelectedUser(null);
    setActiveConversation(String(conversation.id));
    setShowUserInfo(true);
    setShowNewMessage(false);
    setSearchQuery('');
    setShowLeftSidebar(false);
  };

  const handleOpenNewMessage = () => {
    setShowNewMessage(true);
    setShowUserInfo(false);
    setMemberSearchQuery('');
    setShowRightSidebar(true);
  };

  const handleSelectMember = (member: MessagingUser) => {
    setSelectedUser(member);
    setSelectedConversation(null);
    setShowNewMessage(false);
    setShowUserInfo(true);
    setSearchQuery('');
    setShowRightSidebar(false);
    setShowLeftSidebar(false);
  };

  const handleOpenPrivacySettings = () => {
    setShowPrivacySettings(true);
    setShowUserInfo(false);
    setShowNewMessage(false);
    setSelectedConversation(null);
    setSelectedUser(null);
  };

  const handleManageMessages = () => {
    toast({
      title: t.manageMessages,
      description: t.messageManagementSoon,
    });
  };

  // Message Sending
  const handleSendMessage = async () => {
    if (!selectedUser && !selectedConversation) return;
    if (!messageText.trim()) return;
    if (isSending) return;
    
    const messageContent = messageText.trim();
    let receiverId: string;
    
    if (selectedUser) {
      receiverId = String(selectedUser.id);
    } else if (selectedConversation) {
      let otherParticipant = selectedConversation.participants.find((p: any) => p.id !== user?.id);
      
      if (!otherParticipant) {
        otherParticipant = selectedConversation.participants.find((p: any) => p.username || p.name);
      }
      
      if (!otherParticipant) return;
      receiverId = String(otherParticipant.id);
    } else {
      return;
    }
    
    setIsSending(true);
    setMessageText('');
    setShowEmojiPicker(false);
    
    try {
      const messagePromise = Promise.race([
        sendMessage(receiverId, messageContent),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Message send timeout')), 10000)
        )
      ]);
      
      messagePromise
        .then(() => {
          console.log('[UnifiedMessaging] Message sent successfully');
          refreshConversations();
        })
        .catch((error) => {
          console.error('[UnifiedMessaging] Failed to send message:', error);
          setMessageText(messageContent);
        })
        .finally(() => {
          setTimeout(() => setIsSending(false), 500);
        });
        
    } catch (error) {
      console.error('[UnifiedMessaging] Failed to send message:', error);
      setMessageText(messageContent);
      setIsSending(false);
    }
  };

  // Emoji Handler
  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const newText = messageText + emoji;
    setMessageText(newText);
    
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newText.length, newText.length);
        }
      }, 0);
    }
  };

  // File Handling
  const handleFileSelect = (type: 'image' | 'video' | 'audio' | 'document' | 'spreadsheet' | 'file') => {
    if (fileInputRef.current) {
      const acceptMap = {
        image: 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
        video: 'video/mp4,video/avi,video/mov,video/wmv',
        audio: 'audio/mp3,audio/wav,audio/aac',
        document: 'application/pdf,.doc,.docx,text/plain,application/rtf',
        spreadsheet: 'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xls,.xlsx',
        file: '*/*'
      };
      
      fileInputRef.current.accept = acceptMap[type];
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeAttachment = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  // Request media permissions (microphone/camera)
  const requestMediaPermissions = async (callType: 'audio' | 'video'): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log(`[Media] ${callType === 'video' ? 'Camera and microphone' : 'Microphone'} access granted`);

      return stream;
    } catch (error: any) {
      console.error('[Media] Permission denied:', error);
      
      let errorTitle = 'Permission Required';
      let errorMessage = 'Permission denied';
      
      if (error.name === 'NotAllowedError') {
        errorTitle = 'Camera Access Blocked';
        errorMessage = `Click the camera icon in your browser's address bar to allow access, then click the ${callType === 'video' ? 'Video' : 'Audio'} button again`;
      } else if (error.name === 'NotFoundError') {
        errorTitle = 'Hardware Not Found';
        errorMessage = `No ${callType === 'video' ? 'camera or microphone' : 'microphone'} detected. Please check your device connections`;
      } else if (error.name === 'NotReadableError') {
        errorTitle = 'Device In Use';
        errorMessage = `Your ${callType === 'video' ? 'camera or microphone' : 'microphone'} is being used by another application. Please close it and try again`;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        duration: 7000
      });

      return null;
    }
  };

  // Ringtone Control - Clean Coding: Separation of Concerns
  const playRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(err => {
        console.log('[Ringtone] Failed to play:', err);
      });
      console.log('[Ringtone] Playing ringtone');
    }
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      console.log('[Ringtone] Stopped ringtone');
    }
  };

  // Ringtone Management - Play/Stop based on call state
  useEffect(() => {
    // Play ringtone when there's a ringing outgoing call or incoming call
    if ((activeCall && activeCall.status === 'ringing') || incomingCall) {
      playRingtone();
    } else {
      stopRingtone();
    }

    // Cleanup on unmount
    return () => {
      stopRingtone();
    };
  }, [activeCall?.status, incomingCall]);

  // Call Handlers - Using React Query Mutations for Consistency
  const handleVoiceCall = async () => {
    const recipient = selectedUser || selectedConversation?.participants?.find((p: any) => p.id !== user?.id);
    
    if (!recipient) {
      console.error('[Call] No recipient selected');
      toast({
        title: 'Cannot Start Call',
        description: 'Please select a conversation first',
        variant: 'destructive'
      });
      return;
    }

    let mediaStream: MediaStream | null = null;

    try {
      console.log('[Call] Requesting microphone permissions...');
      mediaStream = await requestMediaPermissions('audio');
      
      if (!mediaStream) {
        // Permission denied - error toast already shown by requestMediaPermissions
        return;
      }

      const response = await apiRequest('POST', '/api/calls/initiate', {
        receiverId: recipient.id,
        callType: 'audio'
      });

      const data = await response.json();
      
      if (!data.success) {
        // Stop media stream if call initiation fails
        mediaStream.getTracks().forEach(track => track.stop());
        throw new Error(data.error || 'Failed to initiate call');
      }

      // Store active call state with recipient info and media stream
      setActiveCall({
        ...data.call,
        initiatorId: user?.id,
        recipientName: recipient?.name,
        recipientAvatar: recipient?.avatar,
        callType: 'audio',
        status: 'ringing',
        mediaStream
      });
      setIsVideoEnabled(false);
      setCallDuration(0);

      console.log('[Call] Audio call initiated with microphone access');
    } catch (error) {
      console.error('Error initiating voice call:', error);
      
      // Clean up media stream on error
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        console.log('[Media] Cleaned up microphone on error');
      }
    }
  };

  const handleVideoCall = async () => {
    const recipient = selectedUser || selectedConversation?.participants?.find((p: any) => p.id !== user?.id);
    
    if (!recipient) {
      console.error('[Call] No recipient selected');
      toast({
        title: 'Cannot Start Call',
        description: 'Please select a conversation first',
        variant: 'destructive'
      });
      return;
    }

    let mediaStream: MediaStream | null = null;

    try {
      console.log('[Call] Requesting camera and microphone permissions...');
      mediaStream = await requestMediaPermissions('video');
      
      if (!mediaStream) {
        // Permission denied - error toast already shown by requestMediaPermissions
        return;
      }

      console.log('[Call] Media permissions granted, initiating call...');
      const response = await apiRequest('POST', '/api/calls/initiate', {
        receiverId: recipient.id,
        callType: 'video'
      });

      const data = await response.json();
      
      if (!data.success) {
        // Stop media stream if call initiation fails
        mediaStream.getTracks().forEach(track => track.stop());
        toast({
          title: 'Call Failed',
          description: data.error || 'Failed to initiate video call. Please try again.',
          variant: 'destructive'
        });
        throw new Error(data.error || 'Failed to initiate call');
      }

      // Store active call state with recipient info and media stream
      setActiveCall({
        ...data.call,
        initiatorId: user?.id,
        recipientName: recipient?.name,
        recipientAvatar: recipient?.avatar,
        callType: 'video',
        status: 'ringing',
        mediaStream
      });
      setIsVideoEnabled(true);
      setCallDuration(0);

      console.log('[Call] Video call initiated successfully with camera and microphone access');
    } catch (error) {
      console.error('Error initiating video call:', error);
      
      // Clean up media stream on error
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        console.log('[Media] Cleaned up camera and microphone on error');
      }
      
      toast({
        title: 'Video Call Error',
        description: 'Failed to start video call. Click the video button again to retry.',
        variant: 'destructive'
      });
    }
  };

  // Accept incoming call
  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    let mediaStream: MediaStream | null = null;

    try {
      mediaStream = await requestMediaPermissions(incomingCall.callType);
      
      if (!mediaStream) {
        // Permission denied - reject the call on backend to notify caller
        try {
          await apiRequest('POST', `/api/calls/${incomingCall.callId}/reject`, {});
          console.log('[Call] Call rejected due to permission denial');
        } catch (error) {
          console.error('[Call] Failed to reject call on backend:', error);
        } finally {
          // Clear state only after reject completes (or fails)
          setIncomingCall(null);
        }
        
        return;
      }

      // Permission granted - accept the call
      const response = await apiRequest('POST', `/api/calls/${incomingCall.callId}/accept`, {});
      const data = await response.json();

      if (!data.success) {
        // Stop media stream if acceptance fails
        mediaStream.getTracks().forEach(track => track.stop());
        throw new Error(data.error || 'Failed to accept call');
      }

      // Set up active call with proper initial state and media stream
      setActiveCall({
        ...data.call,
        recipientName: incomingCall.callerName,
        recipientAvatar: incomingCall.callerAvatar,
        callType: incomingCall.callType,
        status: 'connected',
        mediaStream
      });
      setIsVideoEnabled(incomingCall.callType === 'video');
      setCallDuration(0);
      setIncomingCall(null);

      console.log('[Call] Call accepted with media access granted');
    } catch (error) {
      console.error('Error accepting call:', error);
      
      // Clean up media stream on error
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        console.log('[Media] Cleaned up media on accept error');
      }
      
      // Notify backend to reject the call so caller is informed
      if (incomingCall) {
        try {
          await apiRequest('POST', `/api/calls/${incomingCall.callId}/reject`, {});
          console.log('[Call] Call rejected due to accept error');
        } catch (rejectError) {
          console.error('[Call] Failed to reject call on backend:', rejectError);
        } finally {
          // Clear state only after reject completes (or fails)
          setIncomingCall(null);
        }
      } else {
        // No incoming call to reject, just clear state
        setIncomingCall(null);
      }
    }
  };

  // Reject incoming call
  const handleRejectCall = async () => {
    if (!incomingCall) return;

    try {
      const response = await apiRequest('POST', `/api/calls/${incomingCall.callId}/reject`, {});
      const data = await response.json();

      setIncomingCall(null);

      console.log('Call rejected:', data.call);
    } catch (error) {
      console.error('Error rejecting call:', error);
      setIncomingCall(null);
    }
  };

  // End active call
  const handleEndCall = async () => {
    if (!activeCall) return;

    try{
      const response = await apiRequest('POST', `/api/calls/${activeCall.callId}/end`, {
        duration: callDuration // Send actual call duration
      });
      
      const data = await response.json();

      // Stop all media tracks (microphone/camera)
      if (activeCall.mediaStream) {
        activeCall.mediaStream.getTracks().forEach(track => {
          track.stop();
          console.log(`[Media] Stopped ${track.kind} track`);
        });
      }

      // Reset all call-related state
      setActiveCall(null);
      setCallDuration(0);
      setIsMutedCall(false);
      setIsSpeakerOn(false);
      setIsVideoEnabled(false);

      console.log('[Call] Call ended - media streams cleaned up');
    } catch (error) {
      console.error('Error ending call:', error);
      
      // Clean up media streams even on error
      if (activeCall.mediaStream) {
        activeCall.mediaStream.getTracks().forEach(track => track.stop());
      }
      
      // Reset state even on error
      setActiveCall(null);
      setCallDuration(0);
      setIsMutedCall(false);
      setIsSpeakerOn(false);
      setIsVideoEnabled(false);
    }
  };

  // AI Assistant Handlers
  const handleAISuggestionApply = (suggestion: string) => {
    setMessageText(suggestion);
    setShowAIAssistant(false);
  };

  const handleAIComposedMessageApply = (message: string) => {
    setMessageText(message);
    setShowAIAssistant(false);
  };

  // Block/Unblock/Report Handlers
  const handleBlockUser = async () => {
    if (!currentRecipient?.id) return;
    
    try {
      const response = await apiRequest('POST', '/api/users/block', {
        userId: currentRecipient.id
      });
      const data = await response.json();
      
      if (data.success) {
        setIsUserBlocked(true);
        setShowBlockDialog(false);
        toast({
          title: t.userBlockedSuccess,
          description: `${currentRecipient.name} has been blocked`
        });
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        title: 'Error',
        description: 'Failed to block user',
        variant: 'destructive'
      });
    }
  };

  const handleUnblockUser = async () => {
    if (!currentRecipient?.id) return;
    
    try {
      const response = await apiRequest('POST', '/api/users/unblock', {
        userId: currentRecipient.id
      });
      const data = await response.json();
      
      if (data.success) {
        setIsUserBlocked(false);
        toast({
          title: t.userUnblockedSuccess,
          description: `${currentRecipient.name} has been unblocked`
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: 'Error',
        description: 'Failed to unblock user',
        variant: 'destructive'
      });
    }
  };

  const handleSubmitReport = async () => {
    if (!currentRecipient?.id || !reportReason) return;
    
    try {
      const response = await apiRequest('POST', '/api/moderation/report', {
        subjectId: currentRecipient.id,
        subjectType: 'user',
        reason: reportReason,
        description: reportDescription
      });
      
      if (response.ok) {
        setShowReportDialog(false);
        setReportReason('');
        setReportDescription('');
        toast({
          title: t.issueReportedSuccess,
          description: 'Thank you for your report. We will review it shortly.'
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report',
        variant: 'destructive'
      });
    }
  };

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages, messages]);

  // Call Duration Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (activeCall && activeCall.status === 'connected') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCall]);

  // Connect media stream to video element and detect video tracks
  useEffect(() => {
    if (activeCall && activeCall.mediaStream && localVideoRef.current) {
      // Attach the local media stream to the video element
      localVideoRef.current.srcObject = activeCall.mediaStream;
      console.log('[Video] Local stream connected to video element');
      
      // Check if stream has active video tracks
      const videoTracks = activeCall.mediaStream.getVideoTracks();
      const hasActiveVideo = videoTracks.length > 0 && videoTracks[0].readyState === 'live';
      setHasVideoStream(hasActiveVideo);
      
      if (hasActiveVideo) {
        console.log('[Video] Active video stream detected');
      }
    } else {
      setHasVideoStream(false);
    }

    // Cleanup when call ends
    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [activeCall]);

  // 45-Second Ring Timer - Auto-voicemail
  useEffect(() => {
    let ringTimer: NodeJS.Timeout | null = null;

    if (activeCall && activeCall.status === 'ringing') {
      // Reset ring duration
      setRingDuration(0);
      
      // Start ring timer
      ringTimer = setInterval(() => {
        setRingDuration(prev => {
          const newDuration = prev + 1;
          
          // Auto-end call after 45 seconds (voicemail)
          if (newDuration >= 45) {
            console.log('[Call] 45-second timeout reached - sending to voicemail');
            handleEndCall();
            return prev;
          }
          
          return newDuration;
        });
      }, 1000);

      console.log('[Call] Ring timer started - will timeout in 45 seconds');
    } else {
      // Reset ring duration when call is connected or ended
      setRingDuration(0);
    }

    // Cleanup timer
    return () => {
      if (ringTimer) {
        clearInterval(ringTimer);
        console.log('[Call] Ring timer cleared');
      }
    };
  }, [activeCall?.status]);

  // Check if current recipient is blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (!currentRecipient?.id || !user?.id) {
        setIsUserBlocked(false);
        return;
      }
      
      try {
        const response = await apiRequest('GET', `/api/users/is-blocked/${currentRecipient.id}`);
        const data = await response.json();
        setIsUserBlocked(data.isBlocked || false);
      } catch (error) {
        console.error('Error checking block status:', error);
        setIsUserBlocked(false);
      }
    };

    checkBlockStatus();
  }, [currentRecipient?.id, user?.id]);

  // Check call status periodically for outgoing calls (production: would use WebRTC signaling)
  useEffect(() => {
    let statusCheckInterval: NodeJS.Timeout;
    
    if (activeCall && activeCall.status === 'ringing' && activeCall.initiatorId === user?.id) {
      console.log('[Call] Starting status polling for call:', activeCall.callId);
      
      // Poll backend to check if receiver has accepted
      statusCheckInterval = setInterval(async () => {
        try {
          console.log('[Call] Checking call status...');
          const response = await apiRequest('POST', `/api/calls/${activeCall.callId}/connect`, {});
          const data = await response.json();

          console.log('[Call] Status check response:', data);

          if (data.success && data.call.status === 'ongoing') {
            // Receiver accepted! Update UI
            setActiveCall((prev: any) => prev ? { ...prev, status: 'connected' } : null);
            toast({
              title: 'Call Accepted',
              description: 'Receiver picked up',
            });
            console.log('[Call] Receiver accepted call');
            clearInterval(statusCheckInterval);
          } else if (data.call?.status === 'missed' || data.call?.status === 'declined' || data.call?.status === 'ended') {
            // Call was declined or ended - clean up media streams
            console.log('[Call] Call ended with status:', data.call?.status);
            if (activeCall.mediaStream) {
              activeCall.mediaStream.getTracks().forEach(track => track.stop());
            }
            setActiveCall(null);
            toast({
              title: 'Call Ended',
              description: data.call?.status === 'declined' ? 'Recipient declined the call' : 'Call ended',
              variant: 'destructive'
            });
            clearInterval(statusCheckInterval);
          }
          // else: still ringing, keep checking
        } catch (error) {
          console.error('[Call] Status check error:', error);
          // Don't immediately end call on error - might be temporary network issue
          // Let it continue ringing
        }
      }, 2000); // Check every 2 seconds
    }

    return () => {
      if (statusCheckInterval) {
        console.log('[Call] Stopping status polling');
        clearInterval(statusCheckInterval);
      }
    };
  }, [activeCall?.status, activeCall?.initiatorId, activeCall?.callId, user?.id, toast]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Search functionality - Clean Coding: Extract complex logic
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase();
    const results = {
      messages: [] as any[],
      members: [] as MessagingUser[],
      conversations: [] as any[]
    };

    // Search through conversations and their messages
    conversations.forEach(conv => {
      let otherParticipant = conv.participants.find((p: any) => p.id !== user?.id) as any;
      
      if (!otherParticipant) {
        otherParticipant = conv.participants.find((p: any) => p.username || p.name) as any;
      }
      
      const participantName = (otherParticipant?.name || otherParticipant?.username || '').toLowerCase();
      
      // Check if conversation name matches
      if (participantName.includes(query)) {
        results.conversations.push(conv);
      }
      
      // Check if any message in this conversation matches
      const matchingMessages = conversationMessages.filter((msg: any) => 
        msg.conversationId === conv.id && msg.content.toLowerCase().includes(query)
      );
      
      if (matchingMessages.length > 0) {
        matchingMessages.forEach((msg: any) => {
          results.messages.push({
            ...msg,
            conversation: conv,
            participant: otherParticipant
          });
        });
      }
    });

    // Search through all available members
    (availableUsers as MessagingUser[]).forEach(member => {
      const name = (member.name || member.username || '').toLowerCase();
      if (name.includes(query) && member.id !== user?.id) {
        results.members.push(member);
      }
    });

    return results;
  }, [searchQuery, conversations, conversationMessages, availableUsers, user?.id]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    let otherParticipant = conv.participants.find((p: any) => p.id !== user?.id) as any;
    
    if (!otherParticipant) {
      otherParticipant = conv.participants.find((p: any) => p.username || p.name) as any;
    }
    
    const name: string = (otherParticipant?.name || otherParticipant?.username || '') as string;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredMembers = (availableUsers as MessagingUser[]).filter((member: MessagingUser) => {
    if (!memberSearchQuery) return true;
    const name = (member.name || member.username || '').toLowerCase();
    return name.includes(memberSearchQuery.toLowerCase());
  });

  // Merge messages and call logs chronologically
  const currentMessages = useMemo(() => {
    const messagesToShow = selectedConversation ? conversationMessages : messages;
    
    // Combine messages and calls
    const combined: any[] = [
      ...messagesToShow.map((msg: any) => ({
        ...msg,
        type: 'message',
        timestamp: new Date(msg.createdAt).getTime()
      })),
      ...callHistory.map((call: any) => ({
        ...call,
        type: 'call',
        timestamp: new Date(call.startedAt).getTime()
      }))
    ];
    
    // Sort by timestamp
    return combined.sort((a, b) => a.timestamp - b.timestamp);
  }, [selectedConversation, conversationMessages, messages, callHistory]);

  // ============================================================================
  // Render: Login Gate
  // ============================================================================

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">{t.messages}</h2>
          <p className="text-gray-600">Please log in to access messages.</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Main Messenger Interface
  // ============================================================================

  return (
    <div className="flex h-screen bg-white" data-messaging-container>
      {/* ====================================================================
          LEFT SIDEBAR: Conversations List
          ==================================================================== */}
      <div className={`${showLeftSidebar ? 'fixed inset-0 z-40' : 'hidden'} md:relative md:block w-full md:w-80 border-r flex flex-col bg-white`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">{t.messages}</h1>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    data-testid="button-settings"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleManageMessages} data-testid="menu-manage-messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t.manageMessages}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenPrivacySettings} data-testid="menu-privacy">
                    <Shield className="h-4 w-4 mr-2" />
                    {t.privacy}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={handleOpenNewMessage}
                data-testid="button-new-message"
              >
                <Edit className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full md:hidden"
                onClick={() => setShowLeftSidebar(false)}
                data-testid="button-close-sidebar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t.searchMessages}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 border-none rounded-full"
              data-testid="input-search-conversations"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{t.noConversations}</p>
            </div>
          ) : (
            <div>
              {filteredConversations.map((conversation) => {
                let otherParticipant = conversation.participants.find((p: any) => p.id !== user.id) as any;
                
                if (!otherParticipant) {
                  otherParticipant = conversation.participants.find((p: any) => p.username || p.name) as any;
                }
                
                const isSelected = selectedConversation?.id === conversation.id;
                const lastMessageTime = conversation.lastMessage?.createdAt;
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                    data-testid={`conversation-${conversation.id}`}
                  >
                    <div className="relative">
                      <ResolvedUserAvatar
                        user={otherParticipant}
                        size="lg"
                        className="h-14 w-14"
                      />
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm truncate">
                          {otherParticipant?.name || otherParticipant?.username || t.unknownUser}
                        </span>
                        {lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {formatConversationTime(lastMessageTime)}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ====================================================================
          CENTER: Chat Area / Privacy Settings
          ==================================================================== */}
      <div className="flex-1 flex flex-col">
        {showPrivacySettings ? (
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-2xl mx-auto p-6">
              {/* Privacy Settings Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{t.privacySettings}</h2>
                  <p className="text-sm text-gray-500">{t.managePrivacy}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setShowPrivacySettings(false)}
                  data-testid="button-close-privacy"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Online Status Section */}
              <div className="mb-6 p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{t.onlineStatus}</h3>
                    <p className="text-sm text-gray-500">
                      {onlineStatusVisible ? t.visibleToEveryone : t.hiddenFromEveryone}
                    </p>
                  </div>
                  <Switch
                    checked={onlineStatusVisible}
                    onCheckedChange={setOnlineStatusVisible}
                    data-testid="switch-online-status"
                  />
                </div>
              </div>

              {/* Groups Section */}
              <div className="mb-6 p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{t.groupInvites}</h3>
                    <p className="text-sm text-gray-500">
                      {allowGroupInvites ? t.anyoneCanAdd : t.onlyFriendsCanAdd}
                    </p>
                  </div>
                  <Switch
                    checked={allowGroupInvites}
                    onCheckedChange={setAllowGroupInvites}
                    data-testid="switch-group-invites"
                  />
                </div>
              </div>

              {/* Blocked Users Section */}
              <div className="mb-6 p-4 border rounded-lg">
                <div className="mb-4">
                  <h3 className="font-semibold">{t.blockedUsers}</h3>
                  <p className="text-sm text-gray-500">{t.peopleBlocked}</p>
                </div>
                {blockedUsers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{t.noBlockedUsers}</p>
                ) : (
                  <div className="space-y-2">
                    {blockedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                        data-testid={`blocked-user-${user.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <ResolvedUserAvatar
                            user={user}
                            size="sm"
                            className="h-8 w-8"
                          />
                          <span className="text-sm font-medium">{user.name || user.username}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => setBlockedUsers(blockedUsers.filter(u => u.id !== user.id))}
                          data-testid={`unblock-${user.id}`}
                        >
                          {t.unblock}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Muted Users Section */}
              <div className="mb-6 p-4 border rounded-lg">
                <div className="mb-4">
                  <h3 className="font-semibold">{t.mutedContacts}</h3>
                  <p className="text-sm text-gray-500">{t.peopleMuted}</p>
                </div>
                {mutedUsers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{t.noMutedContacts}</p>
                ) : (
                  <div className="space-y-2">
                    {mutedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                        data-testid={`muted-user-${user.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <ResolvedUserAvatar
                            user={user}
                            size="sm"
                            className="h-8 w-8"
                          />
                          <span className="text-sm font-medium">{user.name || user.username}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => setMutedUsers(mutedUsers.filter(u => u.id !== user.id))}
                          data-testid={`unmute-${user.id}`}
                        >
                          {t.unmute}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : searchResults ? (
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">{t.searchResultsFor} "{searchQuery}"</h2>
                <p className="text-sm text-gray-500">
                  {searchResults.messages.length + searchResults.members.length + searchResults.conversations.length} {t.resultsFound}
                </p>
              </div>

              {/* Messages Results */}
              {searchResults.messages.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">{t.messagesLabel} ({searchResults.messages.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        onClick={() => handleSelectConversation(msg.conversation)}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        data-testid={`search-result-message-${msg.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <ResolvedUserAvatar
                            user={msg.participant}
                            size="md"
                            className="h-10 w-10"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm">
                                {msg.participant?.name || msg.participant?.username || t.unknownUser}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">{msg.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversations Results */}
              {searchResults.conversations.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">{t.conversationsLabel} ({searchResults.conversations.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.conversations.map((conv: any) => {
                      let otherParticipant = conv.participants.find((p: any) => p.id !== user.id) as any;
                      
                      if (!otherParticipant) {
                        otherParticipant = conv.participants.find((p: any) => p.username || p.name) as any;
                      }
                      
                      return (
                        <div
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv)}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          data-testid={`search-result-conversation-${conv.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <ResolvedUserAvatar
                              user={otherParticipant}
                              size="md"
                              className="h-10 w-10"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">
                                {otherParticipant?.name || otherParticipant?.username || t.unknownUser}
                              </div>
                              {conv.lastMessage && (
                                <p className="text-sm text-gray-600 truncate">
                                  {conv.lastMessage.content}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Members Results */}
              {searchResults.members.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">{t.membersLabel} ({searchResults.members.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.members.map((member: MessagingUser) => (
                      <div
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        data-testid={`search-result-member-${member.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <ResolvedUserAvatar
                            user={member}
                            size="md"
                            className="h-10 w-10"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">
                              {member.name || member.username}
                            </div>
                            {member.name && member.username && (
                              <p className="text-xs text-gray-500 truncate">
                                @{member.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchResults.messages.length === 0 && 
               searchResults.members.length === 0 && 
               searchResults.conversations.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">{t.noResultsFound}</h3>
                  <p className="text-sm">{t.tryDifferentSearch}</p>
                </div>
              )}
            </div>
          </div>
        ) : !selectedConversation && !selectedUser ? (
          <>
            {/* Mobile Header */}
            <div className="h-16 border-b flex items-center justify-between px-4 bg-white md:hidden">
              <h2 className="text-lg font-semibold">{t.messages}</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setShowLeftSidebar(true)}
                  data-testid="button-open-conversations"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={handleOpenNewMessage}
                  data-testid="button-new-message-empty"
                >
                  <Edit className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center flex-1 text-gray-500">
              <div className="text-center px-4">
                <MessageSquare className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">{t.yourMessages}</h3>
                <p className="text-sm mb-4">{t.sendPrivateMessages}</p>
                <Button
                  onClick={() => setShowLeftSidebar(true)}
                  className="md:hidden"
                  data-testid="button-show-conversations"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Conversations
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center justify-between px-4 bg-white">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full md:hidden"
                  onClick={() => setShowLeftSidebar(true)}
                  data-testid="button-back-to-conversations"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </Button>
                <ResolvedUserAvatar
                  user={currentRecipient}
                  size="md"
                  className="h-10 w-10"
                />
                <div>
                  <div className="font-semibold text-sm" data-testid="text-recipient-name">
                    {currentRecipient?.name || t.unknownUser}
                  </div>
                  <div className="text-xs text-gray-500">{t.activeMinAgo}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-gray-100 text-blue-600"
                  onClick={handleVoiceCall}
                  data-testid="button-voice-call"
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-gray-100 text-blue-600"
                  onClick={handleVideoCall}
                  data-testid="button-video-call"
                >
                  <VideoIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-gray-100"
                  onClick={() => {
                    setShowUserInfo(!showUserInfo);
                    setShowRightSidebar(!showRightSidebar);
                  }}
                  data-testid="button-info"
                >
                  <Info className="h-5 w-5 text-blue-600" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2 min-h-full">
                  {currentMessages.length === 0 && selectedUser ? (
                    <div className="flex items-center justify-center h-96 text-gray-500">
                      {t.startConversation} {selectedUser.name}
                    </div>
                  ) : (
                    <>
                      {currentMessages.map((item: any) => {
                        // Render call log entry
                        if (item.type === 'call') {
                          const isOutgoing = item.initiatorId === user.id;
                          const callIcon = item.callType === 'video' ? <VideoIcon className="h-4 w-4" /> : <Phone className="h-4 w-4" />;
                          const callDurationText = item.duration > 0 
                            ? `${Math.floor(item.duration / 60)} mins ${item.duration % 60} secs`
                            : '';
                          
                          let statusText = '';
                          if (item.status === 'missed') {
                            statusText = isOutgoing 
                              ? `${currentRecipient?.name || 'User'} missed your ${item.callType} chat.`
                              : `You missed a ${item.callType} call.`;
                          } else if (item.status === 'declined') {
                            statusText = `The ${item.callType} chat was declined.`;
                          } else if (item.status === 'ended') {
                            statusText = `The ${item.callType} chat ended.`;
                          } else {
                            return null; // Don't show ongoing/requested calls
                          }

                          return (
                            <div key={`call-${item.id}`} className="flex justify-center mb-3">
                              <div className="max-w-md w-full">
                                <div className="bg-gray-100 rounded-2xl p-4 text-center">
                                  <p className="text-gray-900 font-medium mb-1">{statusText}</p>
                                  <p className="text-gray-500 text-xs mb-3">
                                    {callIcon} {new Date(item.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                    {callDurationText && `, ${callDurationText}`}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold"
                                    onClick={item.callType === 'video' ? handleVideoCall : handleVoiceCall}
                                  >
                                    {isOutgoing || item.status === 'missed' ? 'CALL AGAIN' : 'CALL BACK'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        // Render regular message
                        return (
                          <div
                            key={`message-${item.id}`}
                            className={`flex ${item.senderId === user.id ? 'justify-end' : 'justify-start'} mb-2`}
                          >
                            {item.senderId !== user.id && (
                              <ResolvedUserAvatar
                                user={currentRecipient}
                                size="sm"
                                className="h-7 w-7 mr-2 flex-shrink-0"
                              />
                            )}
                            <div
                              className={`px-4 py-2 rounded-2xl max-w-md break-words ${
                                item.senderId === user.id
                                  ? 'bg-black text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                              data-testid={`message-${item.id}`}
                            >
                              {item.content}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Message Input */}
            <div className="border-t bg-white p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-gray-100"
                  data-testid="button-add-attachment"
                >
                  <Plus className="h-5 w-5 text-blue-600" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full hover:bg-gray-100"
                      data-testid="button-attach-file"
                    >
                      <Image className="h-5 w-5 text-blue-600" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleFileSelect('image')}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        {t.image}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleFileSelect('video')}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {t.video}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleFileSelect('file')}
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        {t.file}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder={t.typeMessage}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="rounded-full bg-gray-100 border-none pr-20"
                    data-testid="input-message"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full"
                          data-testid="button-emoji"
                        >
                          <Smile className="h-4 w-4 text-blue-600" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 border-none">
                        <EmojiPicker onEmojiClick={handleEmojiSelect} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {messageText.trim() ? (
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending}
                    size="icon"
                    className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700"
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-gray-100"
                    data-testid="button-like"
                  >
                    <ThumbsUp className="h-5 w-5 text-blue-600" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ====================================================================
          RIGHT SIDEBAR: New Message / Member Search
          ==================================================================== */}
      {showNewMessage && (
        <div className={`${showRightSidebar ? 'fixed inset-0 z-40' : 'hidden'} md:relative md:block w-full md:w-80 border-l bg-white flex flex-col`}>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">{t.newMessage}</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => {
                  setShowNewMessage(false);
                  setShowRightSidebar(false);
                }}
                data-testid="button-close-new-message"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t.searchMembers}
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="pl-10 bg-gray-100 border-none rounded-full"
                data-testid="input-search-members"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {usersLoading ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">{t.loadingMembers}</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">{t.noMembersFound}</p>
              </div>
            ) : (
              <div>
                {filteredMembers.map((member: MessagingUser) => (
                  <div
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50"
                    data-testid={`member-${member.id}`}
                  >
                    <ResolvedUserAvatar
                      user={member}
                      size="md"
                      className="h-12 w-12"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {member.name || member.username}
                      </div>
                      {member.name && member.username && (
                        <p className="text-xs text-gray-500 truncate">
                          @{member.username}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* ====================================================================
          RIGHT SIDEBAR: User Info
          ==================================================================== */}
      {showUserInfo && currentRecipient && (
        <div className={`${showRightSidebar ? 'fixed inset-0 z-40' : 'hidden'} md:relative md:block w-full md:w-80 border-l bg-white overflow-y-auto`}>
          <div className="p-4">
            {/* Close Button for Mobile */}
            <div className="flex justify-end mb-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => {
                  setShowUserInfo(false);
                  setShowRightSidebar(false);
                }}
                data-testid="button-close-user-info"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* User Profile Section */}
            <div className="text-center mb-6">
              <ResolvedUserAvatar
                user={currentRecipient}
                size="xl"
                className="h-20 w-20 mx-auto mb-3"
              />
              <h3 className="font-semibold text-lg" data-testid="text-sidebar-name">
                {currentRecipient?.name || t.unknownUser}
              </h3>
              <p className="text-sm text-gray-500">{t.activeMinAgo}</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={handleVoiceCall}
                data-testid="button-sidebar-voice"
              >
                <Phone className="h-5 w-5 text-gray-700" />
                <span className="text-xs">{t.audio}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={handleVideoCall}
                data-testid="button-sidebar-video"
              >
                <VideoIcon className="h-5 w-5 text-gray-700" />
                <span className="text-xs">{t.video}</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                data-testid="button-sidebar-profile"
              >
                <User className="h-5 w-5 text-gray-700" />
                <span className="text-xs">{t.profile}</span>
              </Button>
            </div>

            {/* Options */}
            <div className="flex justify-center gap-3">
              <Button
                variant="ghost"
                className="h-12 w-12 p-0 hover:bg-gray-100 transition-all duration-200"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? t.unmuteNotifications : t.muteNotifications}
                aria-label={isMuted ? t.unmuteNotifications : t.muteNotifications}
                data-testid="button-mute-notifications"
              >
                {isMuted ? (
                  <BellOff className="h-5 w-5 text-gray-700" />
                ) : (
                  <Bell className="h-5 w-5 text-gray-700" />
                )}
              </Button>

              <Button
                variant="ghost"
                className="h-12 w-12 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                onClick={() => isUserBlocked ? handleUnblockUser() : setShowBlockDialog(true)}
                title={isUserBlocked ? t.unblockUser : t.blockUser}
                aria-label={isUserBlocked ? t.unblockUser : t.blockUser}
                data-testid="button-block-user"
              >
                <UserX className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                className="h-12 w-12 p-0 hover:bg-gray-100 transition-all duration-200"
                onClick={() => setShowReportDialog(true)}
                title={t.reportIssue}
                aria-label={t.reportIssue}
                data-testid="button-report-issue"
              >
                <Shield className="h-5 w-5 text-gray-700" />
              </Button>

              {currentRecipient?.username && (
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{t.dedw3nProfile}</h4>
                  <a
                    href={`/profile/${currentRecipient.username}`}
                    className="text-sm text-blue-600 hover:underline"
                    data-testid="link-facebook-profile"
                  >
                    {t.viewProfile}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Incoming Call Notification */}
      <AlertDialog open={!!incomingCall} onOpenChange={(open) => !open && setIncomingCall(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {incomingCall?.callType === 'video' ? (
                <VideoIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <Phone className="h-5 w-5 text-blue-600" />
              )}
              Incoming {incomingCall?.callType === 'video' ? 'Video' : 'Voice'} Call
            </AlertDialogTitle>
            <AlertDialogDescription>
              {incomingCall?.callerName || 'Unknown'} is calling you...
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRejectCall} className="flex items-center gap-2">
              <PhoneOff className="h-4 w-4" />
              Decline
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptCall} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full-Screen Call Interface */}
      {activeCall && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Call Header - Absolute positioned */}
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-6 bg-gradient-to-b from-black/70 to-transparent">
            <div className="text-white text-sm font-medium">
              {activeCall.callType === 'video' ? 'Video Call' : 'Voice Call'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={() => {
                // Minimize to small indicator (future enhancement)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Video Call - Full Screen */}
          {activeCall.callType === 'video' && isVideoEnabled ? (
            <div className="relative flex-1 w-full h-full">
              {/* Main local video - fills entire screen, always rendered for ref */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${hasVideoStream ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {/* Fallback when video stream not ready - prevents black screen */}
              {!hasVideoStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
                  <ResolvedUserAvatar
                    avatarUrl={activeCall.recipientAvatar}
                    name={activeCall.recipientName}
                    size="xl"
                    className="h-32 w-32 mb-6 ring-4 ring-white/20"
                  />
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-blue-600/30 flex items-center justify-center mb-3 animate-pulse">
                      <Camera className="h-10 w-10 text-blue-400" />
                    </div>
                    <p className="text-white text-xl font-semibold mb-1">{activeCall.recipientName || 'Unknown User'}</p>
                    <p className="text-gray-400 text-sm">Connecting camera...</p>
                  </div>
                </div>
              )}
              
              {/* User info overlay - top center with background for readability (only when video is showing) */}
              {hasVideoStream && (
                <div className="absolute top-20 left-0 right-0 z-10 flex flex-col items-center px-4">
                  <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <h2 className="text-white text-xl font-semibold text-center">
                      {activeCall.recipientName || 'Unknown User'}
                    </h2>
                    <p className="text-white/90 text-sm text-center mt-1">
                      {activeCall.status === 'ringing' ? `Ringing... (${45 - ringDuration}s)` : 
                       activeCall.status === 'connected' ? `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : 
                       'Connecting...'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Picture-in-picture for remote video - adjusted position to avoid control overlap */}
              <div className="absolute bottom-32 right-4 w-40 aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl z-10 md:bottom-36 md:right-6 md:w-44">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            /* Audio Call or Video Disabled - Center Layout */
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 pb-20">
              {/* Recipient Avatar and Info */}
              <ResolvedUserAvatar
                avatarUrl={activeCall.recipientAvatar}
                name={activeCall.recipientName}
                size="xl"
                className="h-32 w-32 mb-6 ring-4 ring-white/20"
              />

              {/* Recipient Name */}
              <h2 className="text-white text-3xl font-semibold mb-2">
                {activeCall.recipientName || 'Unknown User'}
              </h2>

              {/* Call Status with Ring Timer */}
              <p className="text-gray-300 text-lg mb-2">
                {activeCall.status === 'ringing' ? 'Ringing...' : 
                 activeCall.status === 'connected' ? `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : 
                 'Connecting...'}
              </p>

              {/* Ring Timer Countdown */}
              {activeCall.status === 'ringing' && ringDuration > 0 && (
                <p className="text-gray-400 text-sm">
                  {45 - ringDuration}s until voicemail
                </p>
              )}

              {/* Camera Off Indicator for Video Calls */}
              {activeCall.callType === 'video' && !isVideoEnabled && (
                <div className="mt-8 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-700/50 flex items-center justify-center mb-3">
                    <CameraOff className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Camera is off</p>
                </div>
              )}
            </div>
          )}

          {/* Call Controls - Absolute positioned at bottom with gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/60 to-transparent pb-[max(env(safe-area-inset-bottom),2.5rem)] pt-10">
            {/* Control Buttons Row */}
            <div className="flex justify-center items-center gap-6 mb-6">
              {/* Mute Button */}
              <button
                onClick={() => {
                  const newMuteState = !isMutedCall;
                  setIsMutedCall(newMuteState);
                  
                  // Mute/unmute audio track in media stream
                  if (activeCall && activeCall.mediaStream) {
                    const audioTrack = activeCall.mediaStream.getAudioTracks()[0];
                    if (audioTrack) {
                      audioTrack.enabled = !newMuteState;
                      console.log(`Microphone ${newMuteState ? 'muted' : 'unmuted'}`);
                    }
                  }
                }}
                className={`flex flex-col items-center gap-2 transition-all ${
                  isMutedCall ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
                data-testid="button-call-mute"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  isMutedCall ? 'bg-white' : 'bg-white/20'
                }`}>
                  {isMutedCall ? (
                    <MicOff className="h-6 w-6 text-gray-900" />
                  ) : (
                    <Mic className="h-6 w-6 text-white" />
                  )}
                </div>
                <span className="text-white text-xs drop-shadow-lg">
                  {isMutedCall ? 'Unmute' : 'Mute'}
                </span>
              </button>

              {/* Speaker Button (Audio calls only) */}
              {activeCall.callType === 'audio' && (
                <button
                  onClick={() => {
                    const newSpeakerState = !isSpeakerOn;
                    setIsSpeakerOn(newSpeakerState);
                    console.log(`Speaker ${newSpeakerState ? 'enabled' : 'disabled'}`);
                    // In production: Switch audio output device (speaker vs earpiece)
                  }}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    isSpeakerOn ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                  data-testid="button-call-speaker"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isSpeakerOn ? 'bg-white' : 'bg-white/20'
                  }`}>
                    {isSpeakerOn ? (
                      <Volume2 className="h-6 w-6 text-gray-900" />
                    ) : (
                      <Volume2 className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <span className="text-white text-xs drop-shadow-lg">Speaker</span>
                </button>
              )}

              {/* Video Toggle Button */}
              <button
                onClick={() => {
                  const newVideoState = !isVideoEnabled;
                  setIsVideoEnabled(newVideoState);
                  
                  // Enable/disable video track in media stream
                  if (activeCall && activeCall.mediaStream) {
                    const videoTrack = activeCall.mediaStream.getVideoTracks()[0];
                    if (videoTrack) {
                      videoTrack.enabled = newVideoState;
                      console.log(`Video ${newVideoState ? 'enabled' : 'disabled'}`);
                    }
                  }
                }}
                className={`flex flex-col items-center gap-2 transition-all ${
                  !isVideoEnabled ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                }`}
                data-testid="button-call-video-toggle"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  !isVideoEnabled ? 'bg-white' : 'bg-white/20'
                }`}>
                  {isVideoEnabled ? (
                    <Camera className="h-6 w-6 text-white" />
                  ) : (
                    <CameraOff className="h-6 w-6 text-gray-900" />
                  )}
                </div>
                <span className="text-white text-xs drop-shadow-lg">Video</span>
              </button>
            </div>

            {/* End Call Button */}
            <div className="flex justify-center">
              <button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 shadow-lg"
                data-testid="button-call-end"
              >
                <PhoneOff className="h-8 w-8" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Dialog */}
      <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Message Assistant
            </DialogTitle>
          </DialogHeader>
          <AIMessageAssistant
            conversationId={selectedConversation?.id}
            lastMessages={currentMessages.map((m: any) => m.content)}
            onSuggestionApply={handleAISuggestionApply}
            onComposedMessageApply={handleAIComposedMessageApply}
          />
        </DialogContent>
      </Dialog>

      {/* Block User Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.blockThisUser}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.noMessageAfterBlock}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlockUser}
              className="bg-red-600 hover:bg-red-700"
            >
              {t.block}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Issue Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t.reportUser}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t.selectReason}
              </label>
              <select 
                className="w-full border rounded-md p-2"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                data-testid="select-report-reason"
              >
                <option value="">{t.selectReason}</option>
                <option value="harassment">{t.harassment}</option>
                <option value="spam">{t.spam}</option>
                <option value="inappropriate">{t.inappropriateContent}</option>
                <option value="other">{t.other}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t.additionalDetails}
              </label>
              <textarea 
                className="w-full border rounded-md p-2 min-h-[100px]"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder={t.additionalDetails}
                data-testid="textarea-report-description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowReportDialog(false)}
              >
                {t.cancel}
              </Button>
              <Button 
                onClick={handleSubmitReport}
                disabled={!reportReason}
                data-testid="button-submit-report"
              >
                {t.submitReport}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Audio Element for Ringtone */}
      <audio
        ref={ringtoneRef}
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        preload="auto"
        style={{ display: 'none' }}
      />
    </div>
  );
}

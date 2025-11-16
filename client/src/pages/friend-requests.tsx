import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { Link } from 'wouter';

interface FriendRequest {
  id: number;
  senderId: number;
  recipientId: number;
  message: string;
  status: string;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export default function FriendRequests() {
  const { toast } = useToast();

  const texts = [
    'Friend Requests',
    'Manage your friend requests',
    'No pending friend requests',
    "You don't have any pending friend requests at the moment.",
    'Accept',
    'Decline',
    'Friend request accepted',
    'Friend request declined',
    'Failed to accept friend request',
    'Failed to decline friend request',
    'sent you a friend request'
  ];

  const { translations } = useMasterBatchTranslation(texts, 'normal');

  const getTranslation = (text: string) => {
    const index = texts.indexOf(text);
    return translations?.[index] || text;
  };

  // Fetch friend requests
  const { data: friendRequests, isLoading } = useQuery<FriendRequest[]>({
    queryKey: ['/api/friends/requests'],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Accept friend request mutation
  const acceptMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest('POST', `/api/friends/accept/${requestId}`, {});
    },
    onSuccess: () => {
      toast({
        title: getTranslation('Friend request accepted'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/pending/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: () => {
      toast({
        title: getTranslation('Failed to accept friend request'),
        variant: 'destructive',
      });
    },
  });

  // Decline friend request mutation
  const declineMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return apiRequest('POST', `/api/friends/reject/${requestId}`, {});
    },
    onSuccess: () => {
      toast({
        title: getTranslation('Friend request declined'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/pending/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    },
    onError: () => {
      toast({
        title: getTranslation('Failed to decline friend request'),
        variant: 'destructive',
      });
    },
  });

  const handleAccept = (requestId: number) => {
    acceptMutation.mutate(requestId);
  };

  const handleDecline = (requestId: number) => {
    declineMutation.mutate(requestId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white border-0 shadow-none">
            <CardContent className="p-8 flex justify-center">
              <p className="text-black">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-white border-0 shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl text-black">
              {getTranslation('Friend Requests')}
            </CardTitle>
            <CardDescription className="text-black">
              {getTranslation('Manage your friend requests')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!friendRequests || friendRequests.length === 0 ? (
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold text-black">
                  {getTranslation('No pending friend requests')}
                </h3>
              </div>
            ) : (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4"
                    data-testid={`friend-request-${request.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Link href={`/profile/${request.sender.username}`}>
                        <UserAvatar
                          userId={request.sender.id}
                          username={request.sender.username}
                          size="md"
                          className="cursor-pointer"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${request.sender.username}`}>
                          <h4 className="font-semibold text-black hover:underline cursor-pointer">
                            {request.sender.name || request.sender.username}
                          </h4>
                        </Link>
                        <p className="text-sm text-gray-600">
                          @{request.sender.username}
                        </p>
                        {request.message && (
                          <p className="text-sm text-black mt-1 italic">"{request.message}"</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleAccept(request.id)}
                        disabled={acceptMutation.isPending || declineMutation.isPending}
                        className="bg-black text-white hover:bg-gray-800"
                        data-testid={`button-accept-${request.id}`}
                      >
                        {acceptMutation.isPending ? 'Accepting...' : getTranslation('Accept')}
                      </Button>
                      <Button
                        onClick={() => handleDecline(request.id)}
                        disabled={acceptMutation.isPending || declineMutation.isPending}
                        variant="outline"
                        className="border-black text-black hover:bg-gray-100"
                        data-testid={`button-decline-${request.id}`}
                      >
                        {declineMutation.isPending ? 'Declining...' : getTranslation('Decline')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

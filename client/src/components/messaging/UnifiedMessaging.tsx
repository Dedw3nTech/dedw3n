import { useMessaging } from '@/hooks/use-messaging';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send } from 'lucide-react';

export function UnifiedMessaging() {
  const { user } = useAuth();
  const { conversations, messages, unreadCount, isConnected } = useMessaging();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please log in to access messages.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
            {/* Conversations List */}
            <div className="border-r pr-4">
              <h3 className="font-semibold mb-4">Conversations</h3>
              {conversations.length === 0 ? (
                <p className="text-muted-foreground text-sm">No conversations yet</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium">Conversation {conversation.id}</div>
                      {conversation.lastMessage && (
                        <div className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Area */}
            <div className="col-span-2 flex flex-col">
              <div className="flex-1 border rounded p-4 mb-4 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a conversation to start messaging
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-2 rounded max-w-xs ${
                          message.senderId === String(user.id)
                            ? 'bg-blue-500 text-white ml-auto'
                            : 'bg-white border'
                        }`}
                      >
                        {message.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input placeholder="Type a message..." className="flex-1" />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-4 text-sm text-muted-foreground">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
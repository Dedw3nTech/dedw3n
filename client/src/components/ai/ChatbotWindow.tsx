import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bot, X, ChevronDown, ChevronUp, Loader2, Send, ImagePlus, Trash, HelpCircle, Settings, Sparkles } from "lucide-react";

// Types for messages in the chatbot
type MessageType = "text" | "image" | "product" | "community" | "system";

interface Message {
  id: string;
  content: string;
  type: MessageType;
  sender: "user" | "bot";
  timestamp: Date;
  isTyping?: boolean;
  metadata?: any; // For rich content like product info, etc.
}

export default function ChatbotWindow() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hi there! I'm your AI assistant. How can I help you today?",
      type: "text",
      sender: "bot",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Send message to AI API and get response
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(
        "POST",
        "/api/ai/chat",
        { message, userId: user?.id }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get response from AI");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Add AI response
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          content: data.message,
          type: data.type || "text",
          sender: "bot",
          timestamp: new Date(),
          metadata: data.metadata,
        }
      ]);
      
      setIsLoading(false);
    },
    onError: (error: Error) => {
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "Sorry, I encountered an error. Please try again later.",
          type: "system",
          sender: "bot",
          timestamp: new Date(),
        }
      ]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI",
        variant: "destructive",
      });
      
      setIsLoading(false);
    },
  });

  // Send message handler
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      type: "text",
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add typing indicator
    setMessages(prev => [
      ...prev,
      {
        id: `typing-${Date.now()}`,
        content: "",
        type: "text",
        sender: "bot",
        timestamp: new Date(),
        isTyping: true,
      }
    ]);
    
    setInputValue("");
    setIsLoading(true);
    
    // Send to AI
    sendMessageMutation.mutate(inputValue);
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome-new",
        content: "Chat history cleared. How can I help you?",
        type: "text",
        sender: "bot",
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <>
      {/* Chat button in the corner */}
      {!isOpen && (
        <Button
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card className={`fixed bottom-8 right-8 shadow-xl transition-all duration-300 ${
          isMinimized ? "h-16 w-80" : "h-[500px] w-80"
        }`}>
          <CardHeader className="p-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-md flex items-center gap-1">
                AI Assistant
                <Badge className="ml-1 h-5 text-[10px]" variant="outline">
                  <Sparkles className="h-3 w-3 mr-1" />
                  BETA
                </Badge>
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <Button variant="ghost" size="icon" onClick={handleClearChat}>
                  <Trash className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="p-3 h-[380px] overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.sender === "bot" && (
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.type === "system"
                            ? "bg-muted border border-border"
                            : "bg-secondary"
                        }`}
                      >
                        {message.isTyping ? (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-current animate-bounce"></div>
                            <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-75"></div>
                            <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-150"></div>
                          </div>
                        ) : message.type === "product" && message.metadata ? (
                          <div>
                            <p className="mb-2">{message.content}</p>
                            <div className="bg-background rounded-md p-2 mt-1 text-sm">
                              <div className="font-medium">{message.metadata.name}</div>
                              <div className="text-muted-foreground text-xs">${message.metadata.price}</div>
                              <Button size="sm" variant="secondary" className="mt-2 text-xs">View Product</Button>
                            </div>
                          </div>
                        ) : message.type === "community" && message.metadata ? (
                          <div>
                            <p className="mb-2">{message.content}</p>
                            <div className="bg-background rounded-md p-2 mt-1 text-sm">
                              <div className="font-medium">{message.metadata.name}</div>
                              <div className="text-muted-foreground text-xs">{message.metadata.memberCount} members</div>
                              <Button size="sm" variant="secondary" className="mt-2 text-xs">View Community</Button>
                            </div>
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                      
                      {message.sender === "user" && (
                        <Avatar className="h-8 w-8 ml-2">
                          {user?.avatar ? (
                            <AvatarImage src={user.avatar} alt={user.name || "User"} />
                          ) : null}
                          <AvatarFallback>
                            {user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>
              
              <CardFooter className="p-3 pt-0">
                <div className="relative w-full flex items-center">
                  <Input
                    ref={inputRef}
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!isLoading) handleSendMessage();
                      }
                    }}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-0"
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      )}

      {/* Help tooltip button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-8 right-28 h-10 w-10 rounded-full shadow-md"
        onClick={() => {
          toast({
            title: "AI Assistant Help",
            description: "Ask the AI about products, communities, marketplace items, or for general help with the platform.",
          });
        }}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    </>
  );
}
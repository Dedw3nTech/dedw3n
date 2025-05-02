import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertPost, Post } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Tag, 
  X,
  CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface ContentCreatorProps {
  onSuccess?: () => void;
}

export default function ContentCreator({ onSuccess }: ContentCreatorProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Content form state
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPromoted, setIsPromoted] = useState(false);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [selectedPromotionPlan, setSelectedPromotionPlan] = useState("1day");
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: InsertPost) => {
      // Add invalidation of personal feed to ensure new posts appear
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: (data: Post) => {
      // Reset form
      setContent("");
      setTitle("");
      setTags([]);
      setTagInput("");
      setIsPromoted(false);
      
      // Refresh posts list and feed
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/personal"] });
      
      // Show success toast
      toast({
        title: t("post_created") || "Post Created",
        description: t("post_success_message") || "Your post has been published successfully.",
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: t("errors.error") || "Error",
        description: error.message || t("post_error") || "Failed to create post",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = () => {
    if (!user) {
      toast({
        title: t("errors.error") || "Error",
        description: t("errors.unauthorized") || "You must be logged in to post",
        variant: "destructive",
      });
      return;
    }
    
    // Basic validation
    if (!content.trim()) {
      toast({
        title: t("errors.error") || "Error",
        description: t("content_required") || "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }
    
    // Create post
    const postData: InsertPost = {
      userId: user.id,
      content,
      contentType: "text",
      isPublished: true,
      isPromoted: isPromoted,
    };
    
    // Add title if available
    if (title.trim()) {
      postData.title = title;
    }
    
    // Add tags if any
    if (tags.length > 0) {
      postData.tags = tags;
    }
    
    // Submit post
    createPostMutation.mutate(postData);
  };
  
  // Tag handling
  const handleTagAdd = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };
  
  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleTagAdd();
    }
  };
  
  // Promotion handling
  const handlePromotionSelect = () => {
    // Add promotion to user's cart based on selected plan
    const promotionDetails: Record<string, { duration: string, price: number }> = {
      '1day': { duration: '1 Day', price: 2 },
      '7days': { duration: '7 Days', price: 10 },
      '30days': { duration: '30 Days', price: 30 }
    };
    
    const selected = promotionDetails[selectedPromotionPlan];
    
    // Close dialog and set promoted state
    setPromotionDialogOpen(false);
    setIsPromoted(true);
    
    // Show confirmation toast
    toast({
      title: "Promotion Added",
      description: `${selected.duration} promotion (£${selected.price}) added to your cart.`,
    });
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        {/* Promotion Dialog */}
        <Dialog open={promotionDialogOpen} onOpenChange={setPromotionDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Promote Your Post</DialogTitle>
              <DialogDescription>
                Select a promotion plan to increase the visibility of your post.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <RadioGroup 
                value={selectedPromotionPlan} 
                onValueChange={setSelectedPromotionPlan}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="1day" id="1day" />
                  <Label 
                    htmlFor="1day" 
                    className="flex-grow flex justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">1 Day</span>
                      <p className="text-sm text-muted-foreground">
                        Short boost for immediate impact.
                      </p>
                    </div>
                    <span className="font-semibold">£2</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="7days" id="7days" />
                  <Label 
                    htmlFor="7days" 
                    className="flex-grow flex justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">7 Days</span>
                      <p className="text-sm text-muted-foreground">
                        Week-long visibility boost. Best value.
                      </p>
                    </div>
                    <span className="font-semibold">£10</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="30days" id="30days" />
                  <Label 
                    htmlFor="30days" 
                    className="flex-grow flex justify-between cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">30 Days</span>
                      <p className="text-sm text-muted-foreground">
                        Maximum exposure for a full month.
                      </p>
                    </div>
                    <span className="font-semibold">£30</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button 
                variant="outline" 
                onClick={() => setPromotionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePromotionSelect}
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Text content area */}
        <div className="space-y-4">
          <Textarea
            placeholder="Write your post..."
            className="min-h-[120px] resize-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          
          {/* Tags input */}
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-black" />
            <div className="flex-1 flex flex-wrap gap-2 items-center border rounded-md p-2">
              {tags.map((tag) => (
                <Badge key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                  #{tag}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleTagRemove(tag)}
                  />
                </Badge>
              ))}
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => tagInput.trim() && handleTagAdd()}
                placeholder="Add tags..."
                className="flex-1 border-none shadow-none focus-visible:ring-0 min-w-[100px] h-7 p-0"
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end items-center space-x-2">
            <Button
              type="button"
              onClick={() => setPromotionDialogOpen(true)}
              className={`flex items-center gap-1 ${isPromoted ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}
            >
              <span className="text-white">
                {isPromoted ? 'Promoted ✓' : 'Promote'}
              </span>
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPostMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
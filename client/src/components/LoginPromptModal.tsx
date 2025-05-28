import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  User, 
  Eye, 
  EyeOff, 
  Heart,
  MessageCircle,
  Share2,
  ShoppingBag,
  Users
} from "lucide-react";

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string; // What action triggered this popup
}

export function LoginPromptModal({ isOpen, onClose, action = "continue" }: LoginPromptModalProps) {
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    name: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        await loginMutation.mutateAsync({
          username: formData.username,
          password: formData.password
        });
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
      } else {
        await registerMutation.mutateAsync({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name
        });
        toast({
          title: "Account created!",
          description: "Welcome to Dedw3n! You can now enjoy all features.",
        });
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getActionMessage = () => {
    switch (action) {
      case "like":
        return "like posts and show your appreciation";
      case "comment":
        return "comment and join conversations";
      case "share":
        return "share amazing content with others";
      case "message":
        return "send messages and connect with people";
      case "follow":
        return "follow users and build your network";
      case "create":
        return "create posts and share your thoughts";
      case "buy":
        return "purchase products from our marketplace";
      case "sell":
        return "sell your products and services";
      default:
        return "access all the amazing features";
    }
  };

  const getActionIcon = () => {
    switch (action) {
      case "like":
        return <Heart className="h-6 w-6 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-6 w-6 text-blue-500" />;
      case "share":
        return <Share2 className="h-6 w-6 text-green-500" />;
      case "message":
        return <MessageCircle className="h-6 w-6 text-purple-500" />;
      case "follow":
        return <Users className="h-6 w-6 text-indigo-500" />;
      case "buy":
      case "sell":
        return <ShoppingBag className="h-6 w-6 text-orange-500" />;
      default:
        return <User className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getActionIcon()}
          </div>
          <DialogTitle className="text-xl font-bold">
            Join Dedw3n to {getActionMessage()}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Connect, share, and discover amazing content with our community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loginMutation.isPending || registerMutation.isPending}>
            {(loginMutation.isPending || registerMutation.isPending) ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="text-center">
          <Separator className="my-4" />
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold text-blue-600"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Button>
          </p>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-blue-600 underline"
              onClick={() => setLocation("/terms")}
            >
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-blue-600 underline"
              onClick={() => setLocation("/privacy")}
            >
              Privacy Policy
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Crown, Check, Users, Lock, Zap, Shield } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const tierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be a non-negative number"),
  currency: z.string().default("USD"),
  tierType: z.enum(["free", "paid", "premium"]),
  benefits: z.string().transform(val => val.split('\n').filter(benefit => benefit.trim() !== '')),
  durationDays: z.coerce.number().min(1, "Duration must be at least 1 day"),
  isActive: z.boolean().default(true),
  maxMembers: z.coerce.number().optional(),
});

type MembershipTier = {
  id: number;
  communityId: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  tierType: "free" | "paid" | "premium";
  benefits: string[];
  durationDays: number;
  isActive: boolean;
  maxMembers?: number;
  createdAt: string;
  updatedAt: string;
};

interface MembershipTiersProps {
  communityId: number;
  isOwner: boolean;
}

export default function MembershipTiers({ communityId, isOwner }: MembershipTiersProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);

  // Fetch all tiers for this community
  const { 
    data: tiers, 
    isLoading: isLoadingTiers,
    refetch
  } = useQuery({
    queryKey: [`/api/communities/${communityId}/tiers`],
    queryFn: async () => {
      const response = await fetch(`/api/communities/${communityId}/tiers`);
      if (!response.ok) {
        throw new Error("Failed to fetch membership tiers");
      }
      return response.json() as Promise<MembershipTier[]>;
    },
  });

  // Fetch user's memberships for this community
  const { 
    data: userMembership 
  } = useQuery({
    queryKey: [`/api/communities/${communityId}/memberships/user`],
    queryFn: async () => {
      const response = await fetch(`/api/communities/${communityId}/memberships/user`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // User has no membership
        }
        throw new Error("Failed to fetch user membership");
      }
      return response.json();
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  // Create tier mutation
  const createTierMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tierSchema>) => {
      const response = await apiRequest(
        "POST",
        `/api/communities/${communityId}/tiers`,
        data
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create membership tier");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Membership tier created successfully",
      });
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create membership tier",
        variant: "destructive",
      });
    },
  });

  // Subscribe to tier mutation
  const subscribeMutation = useMutation({
    mutationFn: async (tierId: number) => {
      const response = await apiRequest(
        "POST",
        `/api/communities/${communityId}/memberships`,
        { tierId }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to subscribe to tier");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscribed to membership tier successfully",
      });
      setIsSubscribeDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/memberships/user`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe to tier",
        variant: "destructive",
      });
    },
  });

  type FormData = z.infer<typeof tierSchema>;

  // Form for creating a new membership tier
  const form = useForm<FormData>({
    resolver: zodResolver(tierSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      currency: "USD",
      tierType: "free",
      benefits: "",
      durationDays: 30,
      isActive: true,
    },
  });

  const onSubmit = (data: FormData) => {
    createTierMutation.mutate(data);
  };

  const handleSubscribe = (tier: MembershipTier) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to a membership tier",
        variant: "destructive",
      });
      return;
    }

    setSelectedTier(tier);
    setIsSubscribeDialogOpen(true);
  };

  const confirmSubscription = () => {
    if (selectedTier) {
      subscribeMutation.mutate(selectedTier.id);
    }
  };

  // Helper to render tier icon based on tier type
  const getTierIcon = (tierType: string) => {
    switch (tierType) {
      case "free":
        return <Users className="h-5 w-5 text-primary" />;
      case "paid":
        return <Crown className="h-5 w-5 text-amber-500" />;
      case "premium":
        return <Zap className="h-5 w-5 text-purple-500" />;
      default:
        return <Users className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Membership Tiers</h2>
          <p className="text-muted-foreground">
            Join different membership tiers to access exclusive content and benefits
          </p>
        </div>
        {isOwner && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Tier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create Membership Tier</DialogTitle>
                <DialogDescription>
                  Create a new membership tier for your community with exclusive benefits.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tier Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Basic, Premium, VIP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tierType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tier Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tier type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what members will get with this tier"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Set to 0 for free tiers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Subscription duration in days
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Benefits</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter benefits, one per line"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          List benefits one per line, e.g. "Access to exclusive content"
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Make this tier available for subscriptions
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxMembers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Members (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="Leave empty for unlimited"
                              {...field} 
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Limit number of members (for exclusive tiers)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createTierMutation.isPending}
                    >
                      {createTierMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Tier
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoadingTiers ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !tiers || tiers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Shield className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium">No membership tiers available</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              {isOwner 
                ? "Create membership tiers to offer premium content and benefits to your community members."
                : "This community doesn't have any membership tiers yet."}
            </p>
            {isOwner && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Tier
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative ${tier.tierType === 'premium' ? 'border-purple-300' : tier.tierType === 'paid' ? 'border-amber-300' : ''}`}
            >
              {(tier.tierType === 'premium' || tier.tierType === 'paid') && (
                <div className={`absolute top-0 right-0 w-20 h-20 overflow-hidden`}>
                  <div className={`absolute transform rotate-45 translate-x-2 translate-y-0 ${tier.tierType === 'premium' ? 'bg-purple-500' : 'bg-amber-500'} text-white text-xs font-bold py-1 text-center w-28`}>
                    {tier.tierType === 'premium' ? 'PREMIUM' : 'PAID'}
                  </div>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getTierIcon(tier.tierType)}
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                </div>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold">
                    {tier.price > 0 ? `$${tier.price}` : 'Free'}
                  </span>
                  {tier.price > 0 && (
                    <span className="ml-1 text-muted-foreground">
                      /{tier.durationDays} days
                    </span>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-2">Benefits:</h4>
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                {tier.maxMembers && (
                  <div className="mt-4 flex items-center">
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Limited to {tier.maxMembers} members
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                {/* If user already has this tier */}
                {userMembership && userMembership.tierId === tier.id ? (
                  <div className="w-full">
                    <Badge className="w-full justify-center py-2 bg-primary-foreground text-primary">
                      Current Membership
                    </Badge>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Expires: {new Date(userMembership.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <Button 
                    className="w-full"
                    disabled={!tier.isActive}
                    onClick={() => handleSubscribe(tier)}
                  >
                    {tier.price > 0 ? 'Subscribe' : 'Join Free Tier'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Subscribe Confirmation Dialog */}
      <Dialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subscribe to {selectedTier?.name}</DialogTitle>
            <DialogDescription>
              {selectedTier?.price > 0 
                ? `You'll be charged $${selectedTier?.price} for a ${selectedTier?.durationDays}-day subscription.`
                : 'You\'re joining a free membership tier.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h4 className="font-medium mb-2">Benefits:</h4>
            <ul className="space-y-2">
              {selectedTier?.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSubscribeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmSubscription}
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {selectedTier?.price > 0 ? 'Pay & Subscribe' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
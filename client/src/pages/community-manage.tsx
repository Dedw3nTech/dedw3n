import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ChevronLeft, Users, CalendarDays, MessageSquare, Trash2, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const formSchema = z.object({
  name: z.string().min(3, "Community name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  visibility: z.enum(["public", "private", "secret"], {
    required_error: "Please select a visibility option",
  }),
  rules: z.string().optional(),
  topics: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const tierFormSchema = z.object({
  name: z.string().min(3, "Tier name must be at least 3 characters").max(50),
  description: z.string().min(10, "Description must be at least 10 characters").max(300),
  price: z.number().min(0, "Price cannot be negative"),
  currency: z.string().min(1, "Currency is required"),
  tierType: z.enum(["free", "paid", "premium"], {
    required_error: "Please select a tier type",
  }),
  durationDays: z.number().min(1, "Duration must be at least 1 day"),
  benefits: z.string().optional(),
  maxMembers: z.number().optional(),
});

type TierFormData = z.infer<typeof tierFormSchema>;

export default function CommunityManagePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [createTierDialogOpen, setCreateTierDialogOpen] = useState(false);

  // Fetch community details
  const {
    data: community,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`/api/communities/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/communities/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch community details");
      }
      return response.json();
    },
  });

  // Fetch community members
  const {
    data: members,
    isLoading: isLoadingMembers,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: [`/api/communities/${id}/members`],
    queryFn: async () => {
      const response = await fetch(`/api/communities/${id}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch community members");
      }
      return response.json();
    },
    enabled: !!community,
  });

  // Fetch membership tiers
  const {
    data: tiers,
    isLoading: isLoadingTiers,
    refetch: refetchTiers,
  } = useQuery({
    queryKey: [`/api/communities/${id}/tiers`],
    queryFn: async () => {
      const response = await fetch(`/api/communities/${id}/tiers`);
      if (!response.ok) {
        throw new Error("Failed to fetch membership tiers");
      }
      return response.json();
    },
    enabled: !!community,
  });

  // Check if current user is the owner
  const isOwner = community?.ownerId === user?.id;

  // Redirect if not logged in or not the owner
  if (!isLoading && (!user || !isOwner)) {
    toast({
      title: "Access denied",
      description: "You don't have permission to manage this community",
      variant: "destructive",
    });
    setLocation(`/communities/${id}`);
    return null;
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: community?.name || "",
      description: community?.description || "",
      visibility: (community?.visibility as "public" | "private" | "secret") || "public",
      rules: community?.rules || "",
      topics: community?.topics ? community.topics.join(", ") : "",
    },
    values: {
      name: community?.name || "",
      description: community?.description || "",
      visibility: (community?.visibility as "public" | "private" | "secret") || "public",
      rules: community?.rules || "",
      topics: community?.topics ? community.topics.join(", ") : "",
    },
  });

  const tierForm = useForm<TierFormData>({
    resolver: zodResolver(tierFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      currency: "GBP",
      tierType: "free",
      durationDays: 30,
      benefits: "",
      maxMembers: undefined,
    },
  });

  // Update community mutation
  const updateCommunityMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Transform topics from comma-separated string to array
      const formattedData = {
        ...data,
        topics: data.topics ? data.topics.split(",").map(t => t.trim()).filter(Boolean) : undefined
      };

      const response = await apiRequest(
        "PUT",
        `/api/communities/${id}`,
        formattedData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update community");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Community updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}`] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update community",
        variant: "destructive",
      });
    },
  });

  // Create membership tier mutation
  const createTierMutation = useMutation({
    mutationFn: async (data: TierFormData) => {
      // Transform benefits from string to array
      const formattedData = {
        ...data,
        benefits: data.benefits ? data.benefits.split(",").map(b => b.trim()).filter(Boolean) : undefined
      };

      const response = await apiRequest(
        "POST",
        `/api/communities/${id}/tiers`,
        formattedData
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
      setCreateTierDialogOpen(false);
      tierForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/tiers`] });
      refetchTiers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create membership tier",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/communities/${id}/members/${memberId}`,
        {}
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove member");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${id}/members`] });
      refetchMembers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateCommunityMutation.mutate(data);
  };

  const onCreateTier = (data: TierFormData) => {
    createTierMutation.mutate(data);
  };

  const handleRemoveMember = (memberId: number) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      removeMemberMutation.mutate(memberId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl text-red-500 mb-4">Error</h1>
        <p>Failed to load community. Please try again later.</p>
        <Button 
          onClick={() => setLocation(`/communities/${id}`)} 
          className="mt-4"
        >
          Back to Community
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/communities/${id}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
          <h1 className="text-2xl font-bold">Manage Community: {community.name}</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="membership-tiers">
            <Badge className="mr-2">PRO</Badge>
            Membership Tiers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Community Settings</CardTitle>
              <CardDescription>
                Update your community's profile and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[120px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="public">Public - Anyone can find and join</SelectItem>
                            <SelectItem value="private">Private - Visible but requires approval to join</SelectItem>
                            <SelectItem value="secret">Secret - Hidden and requires invitation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Controls who can see and join your community.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="topics"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topics</FormLabel>
                        <FormControl>
                          <Input placeholder="finance, technology, education" {...field} />
                        </FormControl>
                        <FormDescription>
                          Add topics related to your community, separated by commas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community Rules</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[150px]" {...field} />
                        </FormControl>
                        <FormDescription>
                          Clear rules help maintain a positive community environment.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateCommunityMutation.isPending}
                  >
                    {updateCommunityMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Manage Members</CardTitle>
              <CardDescription>
                View and manage the members of your community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : members && members.length > 0 ? (
                <ul className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {members.map((member: any) => (
                    <li 
                      key={member.id} 
                      className="flex items-center gap-4 p-3 rounded-md border hover:bg-accent/50"
                    >
                      <Avatar>
                        <AvatarImage 
                          src={member.user?.avatar || ""} 
                          alt={member.user?.name || "Member"} 
                        />
                        <AvatarFallback>
                          {getInitials(member.user?.name || "Member")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <div className="font-medium">{member.user?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{member.user?.username}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === "owner" ? "default" : "outline"}>
                          {member.role}
                        </Badge>
                        {member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={removeMemberMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No members found.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="membership-tiers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Membership Tiers</CardTitle>
                <CardDescription>
                  Create and manage paid membership tiers for your community
                </CardDescription>
              </div>
              <Dialog open={createTierDialogOpen} onOpenChange={setCreateTierDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Membership Tier</DialogTitle>
                    <DialogDescription>
                      Create a new membership tier for your community
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...tierForm}>
                    <form onSubmit={tierForm.handleSubmit(onCreateTier)} className="space-y-4">
                      <FormField
                        control={tierForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tier Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Premium, Gold, VIP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
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

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={tierForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={tierForm.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="GBP">GBP (£)</SelectItem>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="EUR">EUR (€)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={tierForm.control}
                        name="durationDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (days)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="30" 
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the benefits of this tier" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={tierForm.control}
                        name="benefits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Benefits</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Access to premium content, Early access"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              List benefits separated by commas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={createTierMutation.isPending}
                        >
                          {createTierMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Tier"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingTiers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tiers && tiers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tiers.map((tier: any) => (
                    <Card key={tier.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{tier.name}</CardTitle>
                          <Badge variant={tier.tierType === "free" ? "outline" : "default"}>
                            {tier.tierType}
                          </Badge>
                        </div>
                        <CardDescription>
                          {tier.price > 0 ? (
                            <span className="font-bold text-lg">
                              {tier.price} {tier.currency} / {tier.durationDays} days
                            </span>
                          ) : (
                            <span>Free</span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{tier.description}</p>
                        {tier.benefits && tier.benefits.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Benefits:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {tier.benefits.map((benefit: string, index: number) => (
                                <li key={index}>{benefit}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Button variant="outline" size="sm">Edit</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No membership tiers created yet.
                  </p>
                  <Button onClick={() => setCreateTierDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Tier
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
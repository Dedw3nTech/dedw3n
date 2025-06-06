import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, User, Search, Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Role permissions mapping
const ROLE_PERMISSIONS = {
  marketer: [
    "Create and manage marketing campaigns",
    "Manage promotions and discounts",
    "View sales analytics",
    "Send marketing emails"
  ],
  merchandiser: [
    "Manage product listings",
    "Update inventory levels",
    "Create product categories",
    "Create and manage marketing campaigns",
    "Manage promotions and discounts",
    "View sales analytics"
  ],
  online_store_manager: [
    "Full store management access",
    "Manage all products and inventory", 
    "Handle customer orders and returns",
    "Manage store users and permissions",
    "View all analytics and reports",
    "Manage store settings and configuration"
  ]
};

// Vendor settings form schema
const vendorSettingsSchema = z.object({
  storeName: z.string().min(3, { message: "Store name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  logo: z.string().url({ message: "Please enter a valid image URL" }).optional().or(z.literal("")),
  contactEmail: z.string().email({ message: "Please enter a valid email" }).optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  hasSalesManager: z.boolean().default(false),
  salesManagerName: z.string().optional(),
  salesManagerId: z.string().optional(),
  unitSystem: z.enum(["metric", "imperial"]).default("metric"),
  weightSystem: z.enum(["kg", "lbs", "g", "oz"]).default("kg"),
  timezone: z.string().default("Europe/London"),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]).default("monthly"),
}).refine((data) => {
  if (data.hasSalesManager) {
    return data.salesManagerName && data.salesManagerName.trim().length > 0 &&
           data.salesManagerId && data.salesManagerId.trim().length > 0;
  }
  return true;
}, {
  message: "Sales Manager name and ID are required when Sales Manager is selected",
  path: ["salesManagerName"],
});

type VendorSettingsFormValues = z.infer<typeof vendorSettingsSchema>;

interface StoreSettingsFormProps {
  vendor?: any;
}

// Store user management interfaces
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar?: string;
}

interface StoreUser {
  id: number;
  userId: number;
  role: 'marketer' | 'merchandiser' | 'online_store_manager';
  isActive: boolean;
  createdAt: string;
  user: User;
}



export default function StoreSettingsForm({ vendor }: StoreSettingsFormProps) {
  const { toast } = useToast();
  const [imageUploading, setImageUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'marketer' | 'merchandiser' | 'online_store_manager'>('marketer');

  // Fetch store users
  const { data: storeUsers = [], refetch: refetchStoreUsers } = useQuery<StoreUser[]>({
    queryKey: ['/api/vendor/store-users'],
    enabled: !!vendor?.id
  });

  // Search users mutation
  const searchUsersMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest('GET', `/api/vendor/search-users?query=${encodeURIComponent(query)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
    }
  });

  // Assign user mutation
  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await apiRequest('POST', `/api/vendor/store-users`, {
        userId,
        role
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User assigned to store successfully",
      });
      refetchStoreUsers();
      setSelectedUser(null);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign user to store",
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest('PUT', `/api/vendor/store-users/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      refetchStoreUsers();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/vendors/${vendor?.id}/store-users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User removed from store successfully",
      });
      refetchStoreUsers();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove user from store",
        variant: "destructive",
      });
    }
  });

  // Handle user search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 3) {
      searchUsersMutation.mutate(query);
    } else {
      setSearchResults([]);
    }
  };

  // Handle user assignment
  const handleAssignUser = () => {
    if (selectedUser) {
      assignUserMutation.mutate({
        userId: selectedUser.id,
        role: selectedRole
      });
    }
  };

  // Form initialization with vendor data
  const form = useForm<VendorSettingsFormValues>({
    resolver: zodResolver(vendorSettingsSchema),
    defaultValues: {
      storeName: vendor?.storeName || "",
      description: vendor?.description || "",
      logo: vendor?.logo || "",
      contactEmail: vendor?.contactEmail || "",
      contactPhone: vendor?.contactPhone || "",
      website: vendor?.website || "",
      address: vendor?.address || "",
      hasSalesManager: vendor?.hasSalesManager || false,
      salesManagerName: vendor?.salesManagerName || "",
      salesManagerId: vendor?.salesManagerId || "",
      unitSystem: vendor?.unitSystem || "metric",
      weightSystem: vendor?.weightSystem || "kg",
      timezone: vendor?.timezone || "Europe/London",
      billingCycle: vendor?.billingCycle || "monthly",
    },
  });

  // Update form values when vendor data changes
  useEffect(() => {
    if (vendor) {
      form.reset({
        storeName: vendor.storeName || "",
        description: vendor.description || "",
        logo: vendor.logo || "",
        contactEmail: vendor.contactEmail || "",
        contactPhone: vendor.contactPhone || "",
        website: vendor.website || "",
        address: vendor.address || "",
        hasSalesManager: vendor.hasSalesManager || false,
        salesManagerName: vendor.salesManagerName || "",
        salesManagerId: vendor.salesManagerId || "",
        unitSystem: vendor.unitSystem || "metric",
        weightSystem: vendor.weightSystem || "kg",
        timezone: vendor.timezone || "Europe/London",
        billingCycle: vendor.billingCycle || "monthly",
      });
    }
  }, [vendor, form]);

  // Update vendor settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: VendorSettingsFormValues) => {
      const response = await apiRequest("PUT", "/api/vendors/settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your store settings have been updated successfully.",
      });
      
      // Invalidate queries to refetch vendor data
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo image must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      setImageUploading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", file);
      
      // Upload image
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const data = await response.json();
      
      // Set logo URL in form
      form.setValue("logo", data.imageUrl);
      
      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  // On form submit
  const onSubmit = (values: VendorSettingsFormValues) => {
    updateSettingsMutation.mutate(values);
  };

  // Helper to get initials from name
  const getInitials = (name: string) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem className="flex flex-col items-center">
                        <FormLabel className="mb-2">Store Logo</FormLabel>
                        <FormControl>
                          <div className="space-y-4 flex flex-col items-center">
                            <Avatar className="h-24 w-24">
                              <AvatarImage src={field.value || ""} alt="Store logo" />
                              <AvatarFallback className="text-lg">
                                {getInitials(form.watch("storeName"))}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={imageUploading}
                              />
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                disabled={imageUploading}
                              >
                                {imageUploading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Logo
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            <Input
                              placeholder="Or enter logo URL"
                              className="w-full max-w-xs"
                              {...field}
                              value={field.value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your store name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is the name that will be displayed to customers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your store and what you sell"
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Tell customers about your store, products, and brand
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="store@example.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Email address for customer inquiries
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Phone number for customer support
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourstorewebsite.com" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Your external website if you have one
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, Country" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Your business location
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Sales Manager Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Sales Manager
                </h3>
                <FormField
                  control={form.control}
                  name="hasSalesManager"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Do you have a Sales Manager?
                        </FormLabel>
                        <FormDescription>
                          Sales Managers earn an additional 2.5% commission on your sales
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
                
                {form.watch("hasSalesManager") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200">
                    <FormField
                      control={form.control}
                      name="salesManagerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sales Manager Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Full name of your Sales Manager
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="salesManagerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sales Manager ID Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter ID number" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormDescription>
                            Official ID number of your Sales Manager
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* System Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">System Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit System</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit system" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="metric">Metric (cm, m, km)</SelectItem>
                            <SelectItem value="imperial">Imperial (in, ft, yd, mi)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Default unit system for measurements
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weightSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Weight System</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select weight system" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="g">Grams (g)</SelectItem>
                            <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                            <SelectItem value="oz">Ounces (oz)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Default weight unit for products
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Zone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                            <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                            <SelectItem value="America/New_York">New York (EST)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                            <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                            <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                            <SelectItem value="Africa/Johannesburg">Johannesburg (SAST)</SelectItem>
                            <SelectItem value="Africa/Cairo">Cairo (EET)</SelectItem>
                            <SelectItem value="Africa/Lagos">Lagos (WAT)</SelectItem>
                            <SelectItem value="Africa/Nairobi">Nairobi (EAT)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Your local timezone for order processing
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="billingCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Billing Cycle</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select billing cycle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly (10% commission)</SelectItem>
                            <SelectItem value="quarterly">Quarterly (10% commission)</SelectItem>
                            <SelectItem value="yearly">Yearly (10% commission)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How often commission fees are charged
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* User Management Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Store User Management</h3>
                  <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add User to Store</DialogTitle>
                        <DialogDescription>
                          Search for users and assign them roles in your store
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by username, name, or email..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        {searchUsersMutation.isPending && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm text-gray-500">Searching...</span>
                          </div>
                        )}

                        {searchResults.length > 0 && (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {searchResults.map((user) => (
                              <div
                                key={user.id}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedUser?.id === user.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedUser(user)}
                              >
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>
                                      <User className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{user.name}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                  </div>
                                </div>
                                {selectedUser?.id === user.id && (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedUser && (
                          <div className="space-y-3 pt-3 border-t">
                            <div>
                              <label className="text-sm font-medium">Assign Role</label>
                              <Select value={selectedRole} onValueChange={(value: 'marketer' | 'merchandiser' | 'online_store_manager') => setSelectedRole(value)}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="marketer">
                                    <div>
                                      <p className="font-medium">Marketer</p>
                                      <p className="text-xs text-gray-500">Can manage campaigns and promotions</p>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="merchandiser">
                                    <div>
                                      <p className="font-medium">Merchandiser</p>
                                      <p className="text-xs text-gray-500">Can manage products plus marketer permissions</p>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="online_store_manager">
                                    <div>
                                      <p className="font-medium">Online Store Manager</p>
                                      <p className="text-xs text-gray-500">Full access to all store functions</p>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium mb-2">Role Permissions:</p>
                              <ul className="text-xs text-gray-600 space-y-1">
                                {ROLE_PERMISSIONS[selectedRole].map((permission, index) => (
                                  <li key={index} className="flex items-center">
                                    <UserCheck className="h-3 w-3 mr-2 text-green-600" />
                                    {permission}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <Button 
                              onClick={handleAssignUser}
                              disabled={assignUserMutation.isPending}
                              className="w-full bg-black text-white hover:bg-gray-800"
                            >
                              {assignUserMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Assigning...
                                </>
                              ) : (
                                "Assign User"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Current Store Users */}
                <div className="space-y-3">
                  {storeUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No store users assigned yet</p>
                      <p className="text-xs text-gray-400">Add users to help manage your store</p>
                    </div>
                  ) : (
                    storeUsers.map((storeUser: any) => (
                      <Card key={storeUser.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={storeUser.user?.avatar} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{storeUser.user?.name}</p>
                                <Badge variant={storeUser.isActive ? "default" : "secondary"}>
                                  {storeUser.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">@{storeUser.user?.username}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline">
                                  {storeUser.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  Added {new Date(storeUser.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUserMutation.mutate({
                                id: storeUser.id,
                                updates: { isActive: !storeUser.isActive }
                              })}
                              disabled={updateUserMutation.isPending}
                            >
                              {storeUser.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeUserMutation.mutate(storeUser.id)}
                              disabled={removeUserMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-500 mb-2">Permissions:</p>
                          <div className="flex flex-wrap gap-1">
                            {ROLE_PERMISSIONS[storeUser.role as keyof typeof ROLE_PERMISSIONS]?.map((permission: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
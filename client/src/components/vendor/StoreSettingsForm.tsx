import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Vendor settings form schema
const vendorSettingsSchema = z.object({
  storeName: z.string().min(3, { message: "Store name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  logo: z.string().url({ message: "Please enter a valid image URL" }).optional().or(z.literal("")),
  contactEmail: z.string().email({ message: "Please enter a valid email" }).optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  website: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

type VendorSettingsFormValues = z.infer<typeof vendorSettingsSchema>;

interface StoreSettingsFormProps {
  vendor?: any;
}

export default function StoreSettingsForm({ vendor }: StoreSettingsFormProps) {
  const { toast } = useToast();
  const [imageUploading, setImageUploading] = useState(false);

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
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
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
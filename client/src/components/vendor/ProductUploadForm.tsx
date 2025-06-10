import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

// Product form schema
const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  discountPrice: z.coerce.number().nonnegative().optional(),
  category: z.string().min(1, { message: "Please select a category" }),
  imageUrl: z.string().url({ message: "Please enter a valid image URL" }),
  inventory: z.coerce.number().int().nonnegative({ message: "Inventory must be a non-negative number" }),
  isNew: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductUploadFormProps {
  vendorId: number;
  onSuccess?: () => void;
}

export default function ProductUploadForm({ vendorId, onSuccess }: ProductUploadFormProps) {
  const { toast } = useToast();
  const [imageUploading, setImageUploading] = useState(false);
  
  // Form initialization
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      discountPrice: undefined,
      category: "",
      imageUrl: "",
      inventory: 1,
      isNew: true,
      isOnSale: false,
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const response = await apiRequest("POST", "/api/products", {
        ...data,
        vendorId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Product Added",
        description: "Your product has been added successfully.",
      });
      
      // Reset form
      form.reset();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/products"] });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add product: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
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
      
      // Set image URL in form
      form.setValue("imageUrl", data.imageUrl);
      
      toast({
        title: "Image Uploaded",
        description: "Your image has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  // On form submit
  const onSubmit = (values: ProductFormValues) => {
    if (!vendorId) {
      toast({
        title: "Error",
        description: "Vendor information is not available.",
        variant: "destructive",
      });
      return;
    }
    
    createProductMutation.mutate(values);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
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
                    <Textarea
                      placeholder="Enter product description"
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of your product including features, materials, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Price ($) (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty if there's no discount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(categories) ? categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        )) : null}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inventory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="1"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of items available for sale
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image</FormLabel>
                  <div className="space-y-3">
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">Or upload an image:</div>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={imageUploading}
                        />
                        <Button type="button" variant="outline" disabled={imageUploading}>
                          {imageUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {field.value && (
                      <div className="mt-2 border rounded-md overflow-hidden w-40 h-40">
                        <img 
                          src={field.value} 
                          alt="Product preview" 
                          className="w-full h-full object-cover"
                          onError={() => {
                            toast({
                              title: "Image Error",
                              description: "Failed to load image preview. Please check the URL.",
                              variant: "destructive",
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    Enter an image URL or upload an image for your product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="isNew"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Mark as New</FormLabel>
                      <FormDescription>
                        Display a "New" badge on this product
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
                name="isOnSale"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">On Sale</FormLabel>
                      <FormDescription>
                        Display a "Sale" badge on this product
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
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createProductMutation.isPending || imageUploading}
            >
              {createProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Product...
                </>
              ) : (
                "Add Product"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
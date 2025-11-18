import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LifestyleNav } from "@/components/layout/LifestyleNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, X, Loader2 } from "lucide-react";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";

const groceriesSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required"),
  product_type: z.string().optional(),
  category_detail: z.string().optional(),
  organic: z.string().optional(),
  unit: z.string().optional(),
  weight: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  delivery_available: z.string().optional()
});

type GroceriesFormData = z.infer<typeof groceriesSchema>;

export default function AddGroceriesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [images, setImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const texts = [
    "Add Grocery Product",
    "List your grocery products and essentials",
    "Product Name",
    "Enter product name",
    "Description",
    "Describe the product quality, origin, and features",
    "Price",
    "Price per unit",
    "Product Type",
    "Select product type",
    "Fresh Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Beverages", "Frozen Foods", "Pantry Staples", "Snacks", "Other",
    "Category",
    "Select category",
    "Fruits", "Vegetables", "Grains", "Legumes", "Spices", "Condiments", "Personal Care", "Household",
    "Organic",
    "Is this product organic?",
    "Yes", "No",
    "Unit",
    "Select unit",
    "kg", "g", "lb", "oz", "piece", "bunch", "pack", "liter", "ml",
    "Weight / Quantity",
    "e.g., 1, 500, 2.5",
    "Location / Store Address",
    "Enter store location",
    "City",
    "Enter city",
    "Country",
    "Enter country",
    "Phone Number",
    "Enter contact phone",
    "Email",
    "Enter contact email",
    "Delivery Available",
    "Select delivery option",
    "Upload Images",
    "Upload photos of the product",
    "Remove",
    "Upload Image",
    "Publish Product",
    "Cancel",
    "Publishing...",
    "Product published successfully!",
    "Failed to publish product"
  ];

  const { translations: t } = useMasterBatchTranslation(texts);

  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  const form = useForm<GroceriesFormData>({
    resolver: zodResolver(groceriesSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      product_type: "",
      category_detail: "",
      organic: "",
      unit: "",
      weight: "",
      location: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      delivery_available: ""
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload maximum 5 images",
        variant: "destructive"
      });
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const image of images) {
        const formData = new FormData();
        formData.append('file', image);

        const response = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        uploadedUrls.push(data.url);
      }
    } catch (error) {
      throw new Error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }

    return uploadedUrls;
  };

  const publishMutation = useMutation({
    mutationFn: async (data: GroceriesFormData) => {
      if (!user?.id) {
        throw new Error('Please log in to publish');
      }

      const imageUrls = await uploadImages();

      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category: 'groceries',
        images: imageUrls,
        metadata: {
          product_type: data.product_type,
          category_detail: data.category_detail,
          organic: data.organic,
          unit: data.unit,
          weight: data.weight,
          delivery_available: data.delivery_available
        },
        location: data.location,
        city: data.city,
        country: data.country,
        contactPhone: data.phone,
        contactEmail: data.email,
        isActive: true
      };

      return apiRequest('POST', '/api/products', productData);
    },
    onSuccess: () => {
      toast({
        title: t[54] || "Product published successfully!",
        description: "Your product is now visible to customers"
      });
      setLocation('/lifestyle/groceries');
    },
    onError: (error: any) => {
      toast({
        title: t[55] || "Failed to publish product",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: GroceriesFormData) => {
    publishMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-white">
      <LifestyleNav 
        searchTerm=""
        setSearchTerm={() => {}}
        selectedCategory="groceries"
        setSelectedCategory={() => {}}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{t[0] || "Add Grocery Product"}</CardTitle>
            <CardDescription>{t[1] || "List your grocery products and essentials"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t[2] || "Product Name"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t[3] || "Enter product name"} {...field} data-testid="input-name" />
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
                      <FormLabel>{t[4] || "Description"}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t[5] || "Describe the product"}
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
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
                        <FormLabel>{t[6] || "Price"}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            step="0.01"
                            placeholder={t[7] || "Price per unit"} 
                            {...field}
                            data-testid="input-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="product_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[8] || "Product Type"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product-type">
                              <SelectValue placeholder={t[9] || "Select product type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fresh_produce">{t[10] || "Fresh Produce"}</SelectItem>
                            <SelectItem value="dairy_eggs">{t[11] || "Dairy & Eggs"}</SelectItem>
                            <SelectItem value="meat_seafood">{t[12] || "Meat & Seafood"}</SelectItem>
                            <SelectItem value="bakery">{t[13] || "Bakery"}</SelectItem>
                            <SelectItem value="beverages">{t[14] || "Beverages"}</SelectItem>
                            <SelectItem value="frozen">{t[15] || "Frozen Foods"}</SelectItem>
                            <SelectItem value="pantry">{t[16] || "Pantry Staples"}</SelectItem>
                            <SelectItem value="snacks">{t[17] || "Snacks"}</SelectItem>
                            <SelectItem value="other">{t[18] || "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category_detail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[19] || "Category"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder={t[20] || "Select category"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fruits">{t[21] || "Fruits"}</SelectItem>
                            <SelectItem value="vegetables">{t[22] || "Vegetables"}</SelectItem>
                            <SelectItem value="grains">{t[23] || "Grains"}</SelectItem>
                            <SelectItem value="legumes">{t[24] || "Legumes"}</SelectItem>
                            <SelectItem value="spices">{t[25] || "Spices"}</SelectItem>
                            <SelectItem value="condiments">{t[26] || "Condiments"}</SelectItem>
                            <SelectItem value="personal_care">{t[27] || "Personal Care"}</SelectItem>
                            <SelectItem value="household">{t[28] || "Household"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[29] || "Organic"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-organic">
                              <SelectValue placeholder={t[30] || "Is this organic?"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">{t[31] || "Yes"}</SelectItem>
                            <SelectItem value="no">{t[32] || "No"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[33] || "Unit"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-unit">
                              <SelectValue placeholder={t[34] || "Select unit"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">{t[35] || "kg"}</SelectItem>
                            <SelectItem value="g">{t[36] || "g"}</SelectItem>
                            <SelectItem value="lb">{t[37] || "lb"}</SelectItem>
                            <SelectItem value="oz">{t[38] || "oz"}</SelectItem>
                            <SelectItem value="piece">{t[39] || "piece"}</SelectItem>
                            <SelectItem value="bunch">{t[40] || "bunch"}</SelectItem>
                            <SelectItem value="pack">{t[41] || "pack"}</SelectItem>
                            <SelectItem value="liter">{t[42] || "liter"}</SelectItem>
                            <SelectItem value="ml">{t[43] || "ml"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[44] || "Weight / Quantity"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[45] || "e.g., 1, 500"} {...field} data-testid="input-weight" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t[46] || "Location / Store Address"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t[47] || "Enter store location"} {...field} data-testid="input-location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[48] || "City"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[49] || "Enter city"} {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[50] || "Country"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[51] || "Enter country"} {...field} data-testid="input-country" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[52] || "Phone Number"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[53] || "Enter phone"} {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[54] || "Email"}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder={t[55] || "Enter email"} {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="delivery_available"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t[56] || "Delivery Available"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-delivery">
                            <SelectValue placeholder={t[57] || "Select delivery option"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">{t[31] || "Yes"}</SelectItem>
                          <SelectItem value="no">{t[32] || "No"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>{t[58] || "Upload Images"}</FormLabel>
                  <p className="text-sm text-gray-500 mb-3">{t[59] || "Upload photos"}</p>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-image-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {images.length < 5 && (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">{t[61] || "Upload Image"}</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        data-testid="input-image-upload"
                      />
                    </label>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-black text-white hover:bg-gray-800"
                    disabled={publishMutation.isPending || uploadingImages}
                    data-testid="button-publish"
                  >
                    {publishMutation.isPending || uploadingImages ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t[64] || "Publishing..."}
                      </>
                    ) : (
                      t[62] || "Publish Product"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/lifestyle/groceries')}
                    disabled={publishMutation.isPending}
                    data-testid="button-cancel"
                  >
                    {t[63] || "Cancel"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

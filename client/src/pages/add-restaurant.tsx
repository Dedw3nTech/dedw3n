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

const restaurantSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required"),
  cuisine_type: z.string().optional(),
  meal_type: z.string().optional(),
  dietary_options: z.string().optional(),
  delivery_available: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  operating_hours: z.string().optional()
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

export default function AddRestaurantPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [images, setImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const texts = [
    "Add Restaurant / Food Service",
    "Share your restaurant or food service with the community",
    "Restaurant / Service Name",
    "Enter the name of your restaurant or food service",
    "Description",
    "Describe your offerings, specialties, and what makes you unique",
    "Price",
    "Starting price or average meal cost",
    "Cuisine Type",
    "Select cuisine type",
    "Italian", "Chinese", "Japanese", "Mexican", "Indian", "Thai", "French", "American", "Mediterranean", "Other",
    "Meal Type",
    "Select meal type",
    "Breakfast", "Lunch", "Dinner", "Brunch", "Snacks", "All Day",
    "Dietary Options",
    "Select dietary options",
    "Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Organic", "None",
    "Delivery Available",
    "Select delivery option",
    "Yes", "No",
    "Location / Address",
    "Enter your location or address",
    "City",
    "Enter city",
    "Country",
    "Enter country",
    "Phone Number",
    "Enter contact phone number",
    "Email",
    "Enter contact email",
    "Website",
    "Enter website URL (optional)",
    "Operating Hours",
    "e.g., Mon-Fri 9AM-10PM, Sat-Sun 10AM-11PM",
    "Upload Images",
    "Upload photos of your restaurant, menu items, or dishes",
    "Remove",
    "Upload Image",
    "Publish Restaurant",
    "Cancel",
    "Publishing...",
    "Restaurant published successfully!",
    "Failed to publish restaurant",
    "All fields are required"
  ];

  const { translations: t } = useMasterBatchTranslation(texts);

  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  const form = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      cuisine_type: "",
      meal_type: "",
      dietary_options: "",
      delivery_available: "",
      location: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      website: "",
      operating_hours: ""
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
    mutationFn: async (data: RestaurantFormData) => {
      if (!user?.id) {
        throw new Error('Please log in to publish');
      }

      const imageUrls = await uploadImages();

      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category: 'restaurant',
        images: imageUrls,
        metadata: {
          cuisine_type: data.cuisine_type,
          meal_type: data.meal_type,
          dietary_options: data.dietary_options,
          delivery_available: data.delivery_available,
          operating_hours: data.operating_hours
        },
        location: data.location,
        city: data.city,
        country: data.country,
        contactPhone: data.phone,
        contactEmail: data.email,
        website: data.website,
        isActive: true
      };

      return apiRequest('POST', '/api/products', productData);
    },
    onSuccess: () => {
      toast({
        title: t[45] || "Restaurant published successfully!",
        description: "Your restaurant is now visible to customers"
      });
      setLocation('/lifestyle/order-food');
    },
    onError: (error: any) => {
      toast({
        title: t[46] || "Failed to publish restaurant",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: RestaurantFormData) => {
    publishMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-white">
      <LifestyleNav 
        searchTerm=""
        setSearchTerm={() => {}}
        selectedCategory="restaurant"
        setSelectedCategory={() => {}}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{t[0] || "Add Restaurant / Food Service"}</CardTitle>
            <CardDescription>{t[1] || "Share your restaurant or food service with the community"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t[2] || "Restaurant / Service Name"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t[3] || "Enter the name"} {...field} data-testid="input-name" />
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
                          placeholder={t[5] || "Describe your offerings"}
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          placeholder={t[7] || "Starting price"} 
                          {...field}
                          data-testid="input-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="cuisine_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[8] || "Cuisine Type"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-cuisine">
                              <SelectValue placeholder={t[9] || "Select cuisine type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="italian">{t[10] || "Italian"}</SelectItem>
                            <SelectItem value="chinese">{t[11] || "Chinese"}</SelectItem>
                            <SelectItem value="japanese">{t[12] || "Japanese"}</SelectItem>
                            <SelectItem value="mexican">{t[13] || "Mexican"}</SelectItem>
                            <SelectItem value="indian">{t[14] || "Indian"}</SelectItem>
                            <SelectItem value="thai">{t[15] || "Thai"}</SelectItem>
                            <SelectItem value="french">{t[16] || "French"}</SelectItem>
                            <SelectItem value="american">{t[17] || "American"}</SelectItem>
                            <SelectItem value="mediterranean">{t[18] || "Mediterranean"}</SelectItem>
                            <SelectItem value="other">{t[19] || "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meal_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[20] || "Meal Type"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-meal-type">
                              <SelectValue placeholder={t[21] || "Select meal type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakfast">{t[22] || "Breakfast"}</SelectItem>
                            <SelectItem value="lunch">{t[23] || "Lunch"}</SelectItem>
                            <SelectItem value="dinner">{t[24] || "Dinner"}</SelectItem>
                            <SelectItem value="brunch">{t[25] || "Brunch"}</SelectItem>
                            <SelectItem value="snacks">{t[26] || "Snacks"}</SelectItem>
                            <SelectItem value="all_day">{t[27] || "All Day"}</SelectItem>
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
                    name="dietary_options"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[28] || "Dietary Options"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-dietary">
                              <SelectValue placeholder={t[29] || "Select dietary options"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vegetarian">{t[30] || "Vegetarian"}</SelectItem>
                            <SelectItem value="vegan">{t[31] || "Vegan"}</SelectItem>
                            <SelectItem value="gluten_free">{t[32] || "Gluten-Free"}</SelectItem>
                            <SelectItem value="halal">{t[33] || "Halal"}</SelectItem>
                            <SelectItem value="kosher">{t[34] || "Kosher"}</SelectItem>
                            <SelectItem value="organic">{t[35] || "Organic"}</SelectItem>
                            <SelectItem value="none">{t[36] || "None"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="delivery_available"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[37] || "Delivery Available"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-delivery">
                              <SelectValue placeholder={t[38] || "Select delivery option"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">{t[39] || "Yes"}</SelectItem>
                            <SelectItem value="no">{t[40] || "No"}</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <FormLabel>{t[41] || "Location / Address"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t[42] || "Enter your location"} {...field} data-testid="input-location" />
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
                        <FormLabel>{t[43] || "City"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[44] || "Enter city"} {...field} data-testid="input-city" />
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
                        <FormLabel>{t[45] || "Country"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[46] || "Enter country"} {...field} data-testid="input-country" />
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
                        <FormLabel>{t[47] || "Phone Number"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[48] || "Enter phone"} {...field} data-testid="input-phone" />
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
                        <FormLabel>{t[49] || "Email"}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder={t[50] || "Enter email"} {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t[51] || "Website"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t[52] || "Enter website URL"} {...field} data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operating_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t[53] || "Operating Hours"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t[54] || "e.g., Mon-Fri 9AM-10PM"} {...field} data-testid="input-hours" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>{t[55] || "Upload Images"}</FormLabel>
                  <p className="text-sm text-gray-500 mb-3">{t[56] || "Upload photos"}</p>
                  
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
                      <span className="text-sm text-gray-500">{t[58] || "Upload Image"}</span>
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
                        {t[61] || "Publishing..."}
                      </>
                    ) : (
                      t[59] || "Publish Restaurant"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/lifestyle/order-food')}
                    disabled={publishMutation.isPending}
                    data-testid="button-cancel"
                  >
                    {t[60] || "Cancel"}
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

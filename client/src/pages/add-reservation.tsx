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

const reservationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().min(1, "Price is required"),
  property_type: z.string().optional(),
  accommodation_type: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  max_guests: z.string().optional(),
  amenities: z.string().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal(""))
});

type ReservationFormData = z.infer<typeof reservationSchema>;

export default function AddReservationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [images, setImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const texts = [
    "Add Hotel / Accommodation",
    "List your hotel, venue, or accommodation service",
    "Property Name",
    "Enter property or hotel name",
    "Description",
    "Describe the property, amenities, and unique features",
    "Price Per Night",
    "Starting price per night",
    "Property Type",
    "Select property type",
    "Hotel", "Resort", "Villa", "Apartment", "Guesthouse", "Hostel", "Cottage", "Cabin", "Other",
    "Accommodation Type",
    "Select type",
    "Entire Place", "Private Room", "Shared Room",
    "Bedrooms",
    "Number of bedrooms",
    "Bathrooms",
    "Number of bathrooms",
    "Maximum Guests",
    "Maximum number of guests",
    "Amenities",
    "Select amenities",
    "WiFi", "Pool", "Parking", "Air Conditioning", "Kitchen", "Gym", "Spa", "Restaurant", "Pet Friendly",
    "Check-in Time",
    "e.g., 3:00 PM",
    "Check-out Time",
    "e.g., 11:00 AM",
    "Location / Address",
    "Enter property address",
    "City",
    "Enter city",
    "Country",
    "Enter country",
    "Phone Number",
    "Enter contact phone",
    "Email",
    "Enter contact email",
    "Website",
    "Enter website URL (optional)",
    "Upload Images",
    "Upload photos of the property, rooms, and facilities",
    "Remove",
    "Upload Image",
    "Publish Property",
    "Cancel",
    "Publishing...",
    "Property published successfully!",
    "Failed to publish property"
  ];

  const { translations: t } = useMasterBatchTranslation(texts);

  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      property_type: "",
      accommodation_type: "",
      bedrooms: "",
      bathrooms: "",
      max_guests: "",
      amenities: "",
      check_in: "",
      check_out: "",
      location: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      website: ""
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
    mutationFn: async (data: ReservationFormData) => {
      if (!user?.id) {
        throw new Error('Please log in to publish');
      }

      const imageUrls = await uploadImages();

      const productData = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        category: 'hotels',
        images: imageUrls,
        metadata: {
          property_type: data.property_type,
          accommodation_type: data.accommodation_type,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          max_guests: data.max_guests,
          amenities: data.amenities,
          check_in: data.check_in,
          check_out: data.check_out
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
        title: t[55] || "Property published successfully!",
        description: "Your property is now visible to guests"
      });
      setLocation('/lifestyle/reservations');
    },
    onError: (error: any) => {
      toast({
        title: t[56] || "Failed to publish property",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ReservationFormData) => {
    publishMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-white">
      <LifestyleNav 
        searchTerm=""
        setSearchTerm={() => {}}
        selectedCategory="hotels"
        setSelectedCategory={() => {}}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{t[0] || "Add Hotel / Accommodation"}</CardTitle>
            <CardDescription>{t[1] || "List your hotel, venue, or accommodation service"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t[2] || "Property Name"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t[3] || "Enter property name"} {...field} data-testid="input-name" />
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
                          placeholder={t[5] || "Describe the property"}
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
                      <FormLabel>{t[6] || "Price Per Night"}</FormLabel>
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
                    name="property_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[8] || "Property Type"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-property-type">
                              <SelectValue placeholder={t[9] || "Select property type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hotel">{t[10] || "Hotel"}</SelectItem>
                            <SelectItem value="resort">{t[11] || "Resort"}</SelectItem>
                            <SelectItem value="villa">{t[12] || "Villa"}</SelectItem>
                            <SelectItem value="apartment">{t[13] || "Apartment"}</SelectItem>
                            <SelectItem value="guesthouse">{t[14] || "Guesthouse"}</SelectItem>
                            <SelectItem value="hostel">{t[15] || "Hostel"}</SelectItem>
                            <SelectItem value="cottage">{t[16] || "Cottage"}</SelectItem>
                            <SelectItem value="cabin">{t[17] || "Cabin"}</SelectItem>
                            <SelectItem value="other">{t[18] || "Other"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accommodation_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[19] || "Accommodation Type"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-accommodation-type">
                              <SelectValue placeholder={t[20] || "Select type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="entire_place">{t[21] || "Entire Place"}</SelectItem>
                            <SelectItem value="private_room">{t[22] || "Private Room"}</SelectItem>
                            <SelectItem value="shared_room">{t[23] || "Shared Room"}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[24] || "Bedrooms"}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder={t[25] || "Number"} {...field} data-testid="input-bedrooms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[26] || "Bathrooms"}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder={t[27] || "Number"} {...field} data-testid="input-bathrooms" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_guests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[28] || "Maximum Guests"}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder={t[29] || "Maximum"} {...field} data-testid="input-guests" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="amenities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t[30] || "Amenities"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-amenities">
                            <SelectValue placeholder={t[31] || "Select amenities"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="wifi">{t[32] || "WiFi"}</SelectItem>
                          <SelectItem value="pool">{t[33] || "Pool"}</SelectItem>
                          <SelectItem value="parking">{t[34] || "Parking"}</SelectItem>
                          <SelectItem value="ac">{t[35] || "Air Conditioning"}</SelectItem>
                          <SelectItem value="kitchen">{t[36] || "Kitchen"}</SelectItem>
                          <SelectItem value="gym">{t[37] || "Gym"}</SelectItem>
                          <SelectItem value="spa">{t[38] || "Spa"}</SelectItem>
                          <SelectItem value="restaurant">{t[39] || "Restaurant"}</SelectItem>
                          <SelectItem value="pet_friendly">{t[40] || "Pet Friendly"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="check_in"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[41] || "Check-in Time"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[42] || "e.g., 3:00 PM"} {...field} data-testid="input-checkin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="check_out"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t[43] || "Check-out Time"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[44] || "e.g., 11:00 AM"} {...field} data-testid="input-checkout" />
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
                      <FormLabel>{t[45] || "Location / Address"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t[46] || "Enter address"} {...field} data-testid="input-location" />
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
                        <FormLabel>{t[47] || "City"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[48] || "Enter city"} {...field} data-testid="input-city" />
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
                        <FormLabel>{t[49] || "Country"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[50] || "Enter country"} {...field} data-testid="input-country" />
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
                        <FormLabel>{t[51] || "Phone Number"}</FormLabel>
                        <FormControl>
                          <Input placeholder={t[52] || "Enter phone"} {...field} data-testid="input-phone" />
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
                        <FormLabel>{t[53] || "Email"}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder={t[54] || "Enter email"} {...field} data-testid="input-email" />
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
                      <FormLabel>{t[55] || "Website"}</FormLabel>
                      <FormControl>
                        <Input placeholder={t[56] || "Enter website URL"} {...field} data-testid="input-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>{t[57] || "Upload Images"}</FormLabel>
                  <p className="text-sm text-gray-500 mb-3">{t[58] || "Upload photos"}</p>
                  
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
                      <span className="text-sm text-gray-500">{t[60] || "Upload Image"}</span>
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
                        {t[63] || "Publishing..."}
                      </>
                    ) : (
                      t[61] || "Publish Property"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/lifestyle/reservations')}
                    disabled={publishMutation.isPending}
                    data-testid="button-cancel"
                  >
                    {t[62] || "Cancel"}
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

import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMasterBatchTranslation } from '@/hooks/use-master-translation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Vendor } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RESERVATION_CATEGORIES = [
  { value: 'reservation-restaurant', label: 'Restaurant Reservation', fields: ['restaurant_name', 'cuisine_type', 'seating_capacity', 'time_slot', 'location'] },
  { value: 'reservation-hotel', label: 'Hotel Booking', fields: ['hotel_name', 'room_type', 'check_in', 'check_out', 'location'] },
  { value: 'reservation-event', label: 'Event Booking', fields: ['event_name', 'event_type', 'venue', 'date_time', 'capacity'] },
  { value: 'reservation-spa', label: 'Spa & Wellness', fields: ['spa_service_type', 'duration', 'time_slot'] },
];

const FIELD_CONFIGS: Record<string, {label: string; type: string; placeholder?: string; options?: string[]}> = {
  restaurant_name: { label: 'Restaurant Name', type: 'text', placeholder: 'Name of restaurant' },
  cuisine_type: { label: 'Cuisine Type', type: 'select', options: ['African', 'Asian', 'American', 'European', 'Mediterranean', 'Latin', 'Fusion', 'Other'] },
  seating_capacity: { label: 'Seating Capacity', type: 'number', placeholder: 'e.g., 4' },
  time_slot: { label: 'Time Slot', type: 'text', placeholder: 'e.g., 7:00 PM - 9:00 PM' },
  location: { label: 'Location', type: 'text', placeholder: 'Address or area' },
  hotel_name: { label: 'Hotel Name', type: 'text', placeholder: 'Name of hotel' },
  room_type: { label: 'Room Type', type: 'select', options: ['Single', 'Double', 'Suite', 'Deluxe', 'Family'] },
  check_in: { label: 'Check-in Date', type: 'date' },
  check_out: { label: 'Check-out Date', type: 'date' },
  event_name: { label: 'Event Name', type: 'text', placeholder: 'Name of event' },
  event_type: { label: 'Event Type', type: 'select', options: ['Conference', 'Wedding', 'Birthday', 'Corporate', 'Concert', 'Workshop'] },
  venue: { label: 'Venue', type: 'text', placeholder: 'Event venue' },
  date_time: { label: 'Date & Time', type: 'text', placeholder: 'e.g., 2024-12-25 6:00 PM' },
  capacity: { label: 'Capacity', type: 'number', placeholder: 'e.g., 50' },
  spa_service_type: { label: 'Spa Service', type: 'select', options: ['Massage', 'Facial', 'Body Treatment', 'Manicure/Pedicure', 'Sauna', 'Hot Tub', 'Aromatherapy'] },
  duration: { label: 'Duration', type: 'text', placeholder: 'e.g., 45 min' },
};

const productSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().positive({ message: "Price must be positive" }),
  discountPrice: z.coerce.number().nonnegative().optional(),
  category: z.string().min(1, { message: "Please select a category" }),
  imageUrl: z.string().optional(),
  inventory: z.coerce.number().int().nonnegative({ message: "Inventory must be a non-negative number" }),
  isNew: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  offeringType: z.enum(['product', 'service', 'digital_product']).default('service'),
  marketplace: z.enum(['c2c', 'b2c', 'b2b', 'raw', 'rqst', 'government-dr-congo']),
  categoryFields: z.record(z.string(), z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddReservationPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const texts = useMemo(() => [
    "Add Reservation Service",
    "List your reservation services for customers",
    "Reservation Category",
    "Select reservation category",
    "Service Name",
    "Enter service name",
    "Description",
    "Describe your reservation service",
    "Price",
    "Available Slots",
    "Category-Specific Details",
    "Select",
    "Cancel",
    "Add Reservation Service",
    "Adding...",
    "Success",
    "Reservation service added successfully",
    "Error",
    "Failed to add reservation service",
    "Please log in to add a reservation service",
    "Login",
    "You need to create a vendor account before you can add reservation services.",
    "Become a Vendor",
    "Restaurant Reservation",
    "Hotel Booking",
    "Event Booking",
    "Spa & Wellness",
    "Restaurant Name",
    "Cuisine Type",
    "Seating Capacity",
    "Time Slot",
    "Location",
    "Hotel Name",
    "Room Type",
    "Check-in Date",
    "Check-out Date",
    "Event Name",
    "Event Type",
    "Venue",
    "Date & Time",
    "Capacity",
    "Spa Service",
    "Duration",
    "African", "Asian", "American", "European", "Mediterranean", "Latin", "Fusion", "Other",
    "Single", "Double", "Suite", "Deluxe", "Family",
    "Conference", "Wedding", "Birthday", "Corporate", "Concert", "Workshop",
    "Massage", "Facial", "Body Treatment", "Manicure/Pedicure", "Sauna", "Hot Tub", "Aromatherapy",
  ], []);

  const { translations } = useMasterBatchTranslation(texts);
  const t = (key: string) => {
    const index = texts.indexOf(key);
    return index >= 0 ? (translations[index] || key) : key;
  };

  const { data: vendorAccounts } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors/user/accounts'],
    enabled: !!user,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      discountPrice: 0,
      category: '',
      imageUrl: '',
      inventory: 0,
      isNew: false,
      isOnSale: false,
      status: 'active',
      offeringType: 'service',
      marketplace: 'rqst',
      categoryFields: {},
    },
  });


  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      return apiRequest('/api/vendors/products', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/products'] });
      toast({
        title: t("Success"),
        description: t("Reservation service added successfully"),
      });
      setLocation('/vendor-dashboard');
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("Error"),
        description: error.message || t("Failed to add reservation service"),
      });
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    createProductMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4" data-testid="text-login-message">{t("Please log in to add a reservation service")}</p>
            <Button onClick={() => setLocation('/login')} data-testid="button-login">
              {t("Login")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vendorAccounts || vendorAccounts.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4" data-testid="text-vendor-message">{t("You need to create a vendor account before you can add reservation services.")}</p>
            <Button onClick={() => setLocation('/become-vendor')} data-testid="button-become-vendor">
              {t("Become a Vendor")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedCategoryFields = RESERVATION_CATEGORIES.find(c => c.value === selectedCategory)?.fields || [];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-card-title">{t("Add Reservation Service")}</CardTitle>
          <CardDescription data-testid="text-card-description">{t("List your reservation services for customers")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Reservation Category")}</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategory(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder={t("Select reservation category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RESERVATION_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {t(cat.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Service Name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("Enter service name")} {...field} data-testid="input-name" />
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
                    <FormLabel>{t("Description")}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("Describe your reservation service")} {...field} data-testid="textarea-description" />
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
                      <FormLabel>{t("Price")}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inventory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Available Slots")}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} data-testid="input-inventory" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedCategoryFields.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold" data-testid="text-heading-category-details">{t("Category-Specific Details")}</h3>
                  {selectedCategoryFields.map((fieldKey) => {
                    const fieldConfig = FIELD_CONFIGS[fieldKey];
                    if (!fieldConfig) return null;

                    return (
                      <div key={fieldKey}>
                        <label className="block text-sm font-medium mb-2" data-testid={`text-label-${fieldKey}`}>{t(fieldConfig.label)}</label>
                        {fieldConfig.type === 'select' ? (
                          <Select
                            value={form.watch(`categoryFields.${fieldKey}`) || ''}
                            onValueChange={(value) => {
                              const currentFields = form.getValues('categoryFields') || {};
                              form.setValue('categoryFields', { ...currentFields, [fieldKey]: value });
                            }}
                          >
                            <SelectTrigger data-testid={`select-${fieldKey}`}>
                              <SelectValue placeholder={t(`Select ${fieldConfig.label}`)} />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldConfig.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {t(option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={fieldConfig.type}
                            placeholder={fieldConfig.placeholder ? t(fieldConfig.placeholder) : ''}
                            value={form.watch(`categoryFields.${fieldKey}`) || ''}
                            onChange={(e) => {
                              const currentFields = form.getValues('categoryFields') || {};
                              form.setValue('categoryFields', { ...currentFields, [fieldKey]: e.target.value });
                            }}
                            data-testid={`input-${fieldKey}`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/add-product')}
                  data-testid="button-cancel"
                >
                  {t("Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  data-testid="button-submit"
                >
                  {createProductMutation.isPending ? t("Adding...") : t("Add Reservation Service")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

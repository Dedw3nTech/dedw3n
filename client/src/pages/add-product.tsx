import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

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

export default function AddProduct() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVendor, setIsVendor] = useState(false);
  const [vendorId, setVendorId] = useState<number | null>(null);

  // Form initialization
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      discountPrice: undefined,
      category: '',
      imageUrl: '',
      inventory: 1,
      isNew: true,
      isOnSale: false,
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    },
  });

  // Check if user is a vendor
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user) {
        return;
      }

      try {
        // Check if user is already a vendor
        const response = await apiRequest('GET', '/api/vendors');
        const vendors = await response.json();
        const userVendor = vendors.find((v: any) => v.userId === user.id);
        
        if (userVendor) {
          setIsVendor(true);
          setVendorId(userVendor.id);
        } else {
          // User is not a vendor
          setIsVendor(false);
        }
      } catch (error) {
        console.error('Error checking vendor status:', error);
      }
    };

    checkVendorStatus();
  }, [user]);

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: async (data: { storeName: string, description: string }) => {
      const response = await apiRequest('POST', '/api/vendors', data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsVendor(true);
      setVendorId(data.id);
      toast({
        title: 'Vendor Account Created',
        description: 'Your vendor account has been created successfully. You can now add products.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to create vendor account: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      if (!vendorId) throw new Error('Vendor ID not available');
      
      const response = await apiRequest('POST', '/api/products', {
        ...data,
        vendorId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Product Added',
        description: 'Your product has been added successfully.',
      });
      
      // Reset form
      form.reset();
      
      // Invalidate products query
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      // Navigate to the product page
      setLocation(`/product/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to add product: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // On form submit
  const onSubmit = (values: ProductFormValues) => {
    if (!isVendor) {
      toast({
        title: 'Error',
        description: 'You need to create a vendor account first.',
        variant: 'destructive',
      });
      return;
    }
    
    createProductMutation.mutate(values);
  };

  // Handle vendor creation
  const handleCreateVendor = () => {
    const storeName = prompt('Enter your store name:');
    if (!storeName) return;
    
    const description = prompt('Enter a brief description of your store:');
    if (!description) return;
    
    createVendorMutation.mutate({ storeName, description });
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Product</CardTitle>
            <CardDescription>Please log in to add a product</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/auth')}>Login</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Display vendor registration prompt if user is not a vendor
  if (!isVendor && !createVendorMutation.isPending) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Become a Vendor</CardTitle>
            <CardDescription>
              You need to create a vendor account before you can add products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              As a vendor, you'll be able to:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>List and sell your products on our marketplace</li>
              <li>Manage your inventory and orders</li>
              <li>Receive payments directly to your account</li>
              <li>Build your brand and customer base</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateVendor}>Create Vendor Account</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show loader while vendor creation is in progress
  if (createVendorMutation.isPending) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <CardDescription>Fill out the form below to add a new product to the marketplace</CardDescription>
        </CardHeader>
        <CardContent>
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
                          {categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
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
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a URL to your product image
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
                disabled={createProductMutation.isPending}
              >
                {createProductMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Product...
                  </>
                ) : (
                  'Add Product'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
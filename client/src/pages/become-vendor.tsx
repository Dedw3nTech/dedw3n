import { useForm } from "react-hook-form";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Store } from "lucide-react";

const vendorFormSchema = z.object({
  storeName: z.string().min(3, "Store name must be at least 3 characters").max(50, "Store name must be less than 50 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  logo: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

export default function BecomeVendorPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // If user is already a vendor, redirect to vendor dashboard
  if (user?.isVendor) {
    setLocation("/vendor-dashboard");
    return null;
  }

  // Initialize form with react-hook-form
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      storeName: "",
      description: "",
      logo: "",
    },
  });

  // Create mutation for registering as a vendor
  const vendorMutation = useMutation({
    mutationFn: async (data: VendorFormValues) => {
      const response = await apiRequest("POST", "/api/vendors", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register as a vendor");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You are now a vendor!",
      });
      // Invalidate user query to refresh the user data (isVendor flag)
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/vendor-dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: VendorFormValues) {
    vendorMutation.mutate(data);
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl lg:text-3xl">Become a Vendor</CardTitle>
              <CardDescription>
                Turn your passion into profit by selling your products on our marketplace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          This is how customers will see your store.
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
                            placeholder="Tell customers about your store and what you sell..." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Describe what makes your products special.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a URL for your store logo" {...field} />
                        </FormControl>
                        <FormDescription>
                          Add a logo to make your store stand out.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={vendorMutation.isPending}
                  >
                    {vendorMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register as Vendor"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col justify-center">
          <div className="space-y-6">
            <div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 mx-auto">
              <Store className="h-12 w-12 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-center">Why become a vendor?</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Reach a Global Audience</h3>
                <p className="text-muted-foreground">Showcase your products to millions of potential customers around the world.</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Powerful Analytics</h3>
                <p className="text-muted-foreground">Get detailed insights about your sales performance and customer behavior.</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Secure Payments</h3>
                <p className="text-muted-foreground">Accept multiple payment methods with our secure payment processing system.</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Marketing Tools</h3>
                <p className="text-muted-foreground">Promote your products with built-in marketing tools and features.</p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already a vendor? <Link href="/vendor-dashboard" className="text-primary font-medium">Go to your dashboard</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
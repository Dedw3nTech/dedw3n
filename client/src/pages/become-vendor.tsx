import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Store, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define form schema for vendor registration
const vendorFormSchema = z.object({
  storeName: z
    .string()
    .min(3, { message: "Store name must be at least 3 characters long" })
    .max(50, { message: "Store name cannot exceed 50 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .max(500, { message: "Description cannot exceed 500 characters" }),
  logo: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

export default function BecomeVendorPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error">("idle");

  // Check if user is logged in
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Redirect if user already is a vendor
  if (userData && userData.isVendor) {
    setLocation("/vendor-dashboard");
    return null;
  }

  // Define form
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      storeName: "",
      description: "",
      logo: "",
    },
  });

  // Mutation for creating a vendor
  const createVendorMutation = useMutation({
    mutationFn: async (data: VendorFormValues) => {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to register as a vendor");
      }

      return await response.json();
    },
    onSuccess: () => {
      setSubmissionStatus("success");
      toast({
        title: "Registration successful!",
        description: "You are now a vendor on our platform.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Redirect after a short delay to let the user see the success message
      setTimeout(() => {
        setLocation("/vendor-dashboard");
      }, 2000);
    },
    onError: (error) => {
      setSubmissionStatus("error");
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  function onSubmit(data: VendorFormValues) {
    createVendorMutation.mutate(data);
  }

  // Redirect if not logged in
  if (!isLoadingUser && !userData) {
    setLocation("/auth?redirect=/become-vendor");
    return null;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Become a Vendor</h1>
          <p className="text-muted-foreground mt-2">
            Start selling your products on our marketplace
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Vendor Registration
            </CardTitle>
            <CardDescription>
              Fill out the form below to register as a vendor. Once approved, you'll be able to list and sell products.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissionStatus === "success" ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Registration Successful!</AlertTitle>
                <AlertDescription className="text-green-700">
                  You have successfully registered as a vendor. You will be redirected to your vendor dashboard shortly.
                </AlertDescription>
              </Alert>
            ) : submissionStatus === "error" ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>
                  There was an error registering your vendor account. Please try again.
                </AlertDescription>
              </Alert>
            ) : (
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
                          This is how your store will appear to customers.
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
                            placeholder="Describe your store, products, and what makes you unique"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A good description helps customers understand what you sell.
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
                        <FormLabel>Store Logo URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter logo URL" {...field} />
                        </FormControl>
                        <FormDescription>
                          Add a URL to your store logo. You can update this later.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createVendorMutation.isPending}
                  >
                    {createVendorMutation.isPending ? (
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
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 bg-muted/50 px-6 py-4">
            <div className="text-sm">
              <strong>Benefits of becoming a vendor:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
                <li>Access to millions of potential customers</li>
                <li>Easy-to-use dashboard for managing products</li>
                <li>Detailed analytics and reporting</li>
                <li>Secure payment processing</li>
              </ul>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
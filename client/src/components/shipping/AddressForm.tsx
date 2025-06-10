import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the address schema with validation
const addressSchema = z.object({
  fullName: z.string().min(3, { message: "Full name is required" }),
  addressLine1: z.string().min(5, { message: "Address line 1 is required" }),
  addressLine2: z.string().optional(),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  postalCode: z.string().min(5, { message: "Postal code is required" }),
  country: z.string().min(2, { message: "Country is required" }),
  phone: z.string().min(10, { message: "Valid phone number is required" }),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (data: AddressFormValues) => void;
  className?: string;
}

export function AddressForm({ defaultValues, onSubmit, className }: AddressFormProps) {
  const [isValidating, setIsValidating] = useState(false);

  // Initialize the form with react-hook-form
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: defaultValues?.fullName || "",
      addressLine1: defaultValues?.addressLine1 || "",
      addressLine2: defaultValues?.addressLine2 || "",
      city: defaultValues?.city || "",
      state: defaultValues?.state || "",
      postalCode: defaultValues?.postalCode || "",
      country: defaultValues?.country || "United States",
      phone: defaultValues?.phone || "",
    },
  });

  // Handle form submission
  const handleSubmit = async (values: AddressFormValues) => {
    try {
      setIsValidating(true);
      
      // Validate the address with the server
      const response = await apiRequest("POST", "/api/shipping/validate-address", values);
      const result = await response.json();
      
      if (!result.valid) {
        if (result.errors) {
          // Handle validation errors from the server
          result.errors.forEach((error: any) => {
            form.setError(error.path[0] as any, {
              type: "server",
              message: error.message,
            });
          });
        } else {
          // General validation error
          toast({
            title: "Address Validation Failed",
            description: result.message || "Please check your address details",
            variant: "destructive",
          });
        }
      } else {
        // Address is valid, proceed with submission
        onSubmit(values);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Shipping Address</CardTitle>
        <CardDescription>Enter your shipping information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 4B" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
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
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="United States" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isValidating}>
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Continue to Shipping"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
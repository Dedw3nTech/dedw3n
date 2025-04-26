import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Loader2 } from "lucide-react";

const addressSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  street: z.string().min(5, { message: "Street address must be at least 5 characters" }),
  city: z.string().min(2, { message: "City must be at least 2 characters" }),
  state: z.string().min(2, { message: "State/Province must be at least 2 characters" }),
  postalCode: z.string().min(3, { message: "Postal code must be at least 3 characters" }),
  country: z.string().min(2, { message: "Country must be at least 2 characters" }),
});

type AddressFormValues = z.infer<typeof addressSchema>;

type AddressFormProps = {
  onAddressSubmit: (address: AddressFormValues, isValid: boolean) => void;
};

export default function AddressForm({ onAddressSubmit }: AddressFormProps) {
  const [isValidated, setIsValidated] = useState(false);

  // Set up the form
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
    },
  });

  // Validate address with server
  const validateAddressMutation = useMutation({
    mutationFn: async (data: AddressFormValues) => {
      const response = await apiRequest("POST", "/api/shipping/validate-address", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setIsValidated(true);
        onAddressSubmit(form.getValues(), true);
      } else {
        setIsValidated(false);
        onAddressSubmit(form.getValues(), false);
        form.setError("root", {
          type: "manual",
          message: data.error || "Address validation failed",
        });
      }
    },
    onError: (error: any) => {
      setIsValidated(false);
      onAddressSubmit(form.getValues(), false);
      form.setError("root", {
        type: "manual",
        message: error.message || "Address validation failed",
      });
    },
  });

  // Submit handler
  function onSubmit(data: AddressFormValues) {
    validateAddressMutation.mutate(data);
  }

  const countries = [
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "UK", label: "United Kingdom" },
    { value: "AU", label: "Australia" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
    { value: "JP", label: "Japan" },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Shipping Address</h3>
          {isValidated && (
            <span className="flex items-center text-green-600 text-sm">
              <CheckCircle className="h-4 w-4 mr-1" /> Validated
            </span>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
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
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.value} value={country.value}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={validateAddressMutation.isPending}
            >
              {validateAddressMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : isValidated ? "Address Validated" : "Validate Address"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
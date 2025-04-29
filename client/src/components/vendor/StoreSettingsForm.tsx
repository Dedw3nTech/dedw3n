import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Store, Upload, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define validation schema
const formSchema = z.object({
  storeName: z.string().min(3, {
    message: "Store name must be at least 3 characters.",
  }).max(100, {
    message: "Store name must not be longer than 100 characters.",
  }),
  description: z.string().max(1000, {
    message: "Description must not be longer than 1000 characters.",
  }).nullable(),
  logo: z.string().url({
    message: "Please enter a valid URL for your logo.",
  }).nullable().optional(),
});

interface StoreSettingsFormProps {
  vendor?: any;
}

export default function StoreSettingsForm({ vendor }: StoreSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Initialize form with vendor data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: vendor?.storeName || "",
      description: vendor?.description || "",
      logo: vendor?.logo || "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await apiRequest("PUT", "/api/vendors/settings", values);
      
      // Show success message
      toast({
        title: "Settings updated",
        description: "Your store settings have been updated successfully.",
      });
      
      // Invalidate vendor data cache
      queryClient.invalidateQueries({ queryKey: ["/api/vendors/me"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update store settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={vendor?.logo || ""} alt={vendor?.storeName} />
            <AvatarFallback>
              <Store className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-medium">{vendor?.storeName}</h3>
            <p className="text-sm text-muted-foreground">
              Created by {vendor?.user?.name || "Unknown"}
            </p>
          </div>
        </div>

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
                This is the name that will appear to customers.
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
                  placeholder="Enter a description of your store"
                  className="min-h-32"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Tell customers about your store and what makes it unique.
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
              <FormLabel>Store Logo URL</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input placeholder="Enter your logo URL" {...field} value={field.value || ""} />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                The logo will appear on your store page and products.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
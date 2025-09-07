import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Vendor creation form schema
const vendorCreationSchema = z.object({
  storeName: z.string().min(3, { message: "Store name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
});

type VendorCreationFormValues = z.infer<typeof vendorCreationSchema>;

interface VendorCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { storeName: string; description: string }) => void;
  isLoading?: boolean;
}

export function VendorCreationDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: VendorCreationDialogProps) {
  const form = useForm<VendorCreationFormValues>({
    resolver: zodResolver(vendorCreationSchema),
    defaultValues: {
      storeName: "",
      description: "",
    },
  });

  const handleSubmit = (values: VendorCreationFormValues) => {
    onSubmit(values);
    form.reset();
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          {/* Dedw3n Logo */}
          <div className="flex justify-center">
            <img 
              src="/dedw3n-logo-black.png" 
              alt="Dedw3n Logo" 
              className="h-12 w-auto"
            />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Create Your Vendor Account
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="storeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter your store name:</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., John's Electronics Store" 
                      {...field}
                      disabled={isLoading}
                    />
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
                  <FormLabel>Short description of your store:</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., We sell high-quality electronics and accessories with fast shipping and excellent customer service."
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-black hover:bg-gray-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Store"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
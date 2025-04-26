import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const formSchema = z.object({
  name: z.string().min(3, "Community name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  visibility: z.enum(["public", "private", "secret"], {
    required_error: "Please select a visibility option",
  }),
  rules: z.string().optional(),
  topics: z.string().transform((val) => 
    val.split(",").map(t => t.trim()).filter(Boolean)
  ).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateCommunityPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in
  if (!user) {
    setLocation("/auth");
    return null;
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "public",
      rules: "",
      topics: "",
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/communities", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create community");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Community created",
        description: "Your community has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      setLocation("/communities");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create community",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: FormData) => {
    setIsSubmitting(true);
    createCommunityMutation.mutate(data);
  };

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Button 
        variant="ghost" 
        onClick={() => setLocation("/communities")} 
        className="mb-4"
      >
        <ChevronLeft className="h-4 w-4 mr-2" /> Back to Communities
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Community</CardTitle>
          <CardDescription>
            Start a community to connect with people who share your interests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a name for your community" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is how your community will appear to others.
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what your community is about" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      A clear description helps people understand what your community is about.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can find and join</SelectItem>
                        <SelectItem value="private">Private - Visible but requires approval to join</SelectItem>
                        <SelectItem value="secret">Secret - Hidden and requires invitation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Controls who can see and join your community.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topics (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="finance, technology, education" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Add topics related to your community, separated by commas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Rules (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="List the rules for your community" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Clear rules help maintain a positive community environment.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Community"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
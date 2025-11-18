import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const meetingFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  participants: z.string().optional(),
});

type MeetingFormValues = z.infer<typeof meetingFormSchema>;

export default function NewMeetingPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      participants: "",
    },
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data: MeetingFormValues) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      const response = await apiRequest('POST', '/api/meetings', {
        title: data.title,
        description: data.description || null,
        startDate,
        endDate,
        people: data.participants || null,
        isAllDay: false,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        priority: 'medium',
        status: 'scheduled',
      }) as unknown as {
        id: number;
        roomId: string;
        title: string;
        description: string | null;
        startDate: Date;
        endDate: Date;
        meetingLink: string;
      };

      return response;
    },
    onSuccess: (data) => {
      navigate(`/meeting/${data.roomId}`);
    },
    onError: (error: any) => {
      console.error('Error creating meeting:', error);
      alert(error.message || 'Failed to create meeting');
    },
  });

  const onSubmit = (data: MeetingFormValues) => {
    createMeetingMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="w-full max-w-md border-black">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-black" data-testid="text-auth-required">Authentication Required</h2>
            <p className="text-black">Please log in to create a meeting.</p>
            <Button
              onClick={() => navigate('/login')}
              className="mt-4 bg-black text-white hover:bg-black border-black"
              data-testid="button-login"
            >
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="border-black">
          <CardHeader className="border-b border-black">
            <CardTitle className="text-2xl font-bold text-black" data-testid="text-page-title">Create New Meeting</CardTitle>
            <CardDescription className="text-black" data-testid="text-page-description">
              Schedule a new online meeting. A unique meeting link will be generated for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-medium" data-testid="text-label-title">Meeting Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Team Standup, Client Review"
                          className="border-black text-black placeholder:text-black"
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-medium" data-testid="text-label-description">Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Add meeting agenda or notes"
                          className="border-black text-black placeholder:text-black min-h-[100px]"
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormDescription className="text-black">
                        Provide any additional details about the meeting
                      </FormDescription>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-medium" data-testid="text-label-start">Start Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="border-black text-black"
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-medium" data-testid="text-label-end">End Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          className="border-black text-black"
                          data-testid="input-end-date"
                        />
                      </FormControl>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black font-medium" data-testid="text-label-participants">Participants (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter usernames or emails, separated by commas"
                          className="border-black text-black placeholder:text-black"
                          data-testid="input-participants"
                        />
                      </FormControl>
                      <FormDescription className="text-black">
                        List participants who should be invited to this meeting
                      </FormDescription>
                      <FormMessage className="text-black" />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4 border-t border-black">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/calendar')}
                    className="border-black text-black hover:bg-white"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMeetingMutation.isPending}
                    className="bg-black text-white hover:bg-black"
                    data-testid="button-create-meeting"
                  >
                    {createMeetingMutation.isPending ? 'Creating Meeting...' : 'Create Meeting'}
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

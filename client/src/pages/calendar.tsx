import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMasterBatchTranslation } from "@/hooks/use-master-translation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileUpload } from "@/components/ui/file-upload";
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  DollarSign,
  Building,
  Coffee,
  Briefcase,
  ShoppingCart,
  Users,
  X,
  Shield,
  Video,
  ExternalLink,
  Upload,
  File,
  Trash,
} from "lucide-react";
import type { CalendarEvent, InsertCalendarEvent } from "@shared/schema";

const BASE_CALENDAR_CATEGORIES = [
  { id: "finance", name: "Finance", icon: DollarSign, color: "bg-emerald-500" },
  { id: "government", name: "Government", icon: Building, color: "bg-slate-500" },
  { id: "lifestyle", name: "Lifestyle", icon: Coffee, color: "bg-orange-500" },
  { id: "services", name: "Services", icon: Briefcase, color: "bg-indigo-500" },
  { id: "marketplace", name: "Marketplace", icon: ShoppingCart, color: "bg-blue-500" },
  { id: "community", name: "Community", icon: Users, color: "bg-purple-500" },
];

const ADMIN_CATEGORY = { id: "admin", name: "Admin", icon: Shield, color: "bg-red-500" };

const categoryColorMap: Record<string, string> = {
  finance: "bg-emerald-100 text-emerald-700 border-emerald-300",
  government: "bg-slate-100 text-slate-700 border-slate-300",
  lifestyle: "bg-orange-100 text-orange-700 border-orange-300",
  services: "bg-indigo-100 text-indigo-700 border-indigo-300",
  marketplace: "bg-blue-100 text-blue-700 border-blue-300",
  community: "bg-purple-100 text-purple-700 border-purple-300",
  admin: "bg-red-100 text-red-700 border-red-300",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isAdminUser = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'moderator';
  }, [user?.role]);

  const CALENDAR_CATEGORIES = useMemo(() => {
    return isAdminUser ? [...BASE_CALENDAR_CATEGORIES, ADMIN_CATEGORY] : BASE_CALENDAR_CATEGORIES;
  }, [isAdminUser]);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState<"create" | "edit" | "search">("create");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set([...BASE_CALENDAR_CATEGORIES.map(c => c.id), ...(isAdminUser ? [ADMIN_CATEGORY.id] : [])])
  );
  const [viewMode, setViewMode] = useState<"week" | "3day">("week");
  const [miniCalendarDate, setMiniCalendarDate] = useState<Date | undefined>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<CalendarEvent[]>([]);
  const [expandedCell, setExpandedCell] = useState<{ dayIndex: number; hour: number } | null>(null);
  const expandedCellRef = useRef<HTMLDivElement>(null);
  const [expandedHolidayDay, setExpandedHolidayDay] = useState<number | null>(null);
  const expandedHolidayRef = useRef<HTMLDivElement>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<Array<{id: number, username: string, name: string, avatar: string | null}>>([]);
  const [participantSearchOpen, setParticipantSearchOpen] = useState(false);
  const [generatedMeetingLink, setGeneratedMeetingLink] = useState<string>("");
  const [isOnlineMeeting, setIsOnlineMeeting] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<Array<{name: string, url: string, type: string, size: number}>>([]);
  const [shareWithParticipants, setShareWithParticipants] = useState<boolean>(false);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  
  // State for showing/hiding holidays with localStorage persistence
  const [showHolidays, setShowHolidays] = useState<boolean>(() => {
    const saved = localStorage.getItem('calendar-show-holidays');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // State for 12-hour or 24-hour time format with localStorage persistence
  const [is24HourFormat, setIs24HourFormat] = useState<boolean>(() => {
    const saved = localStorage.getItem('calendar-time-format');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Persist holiday visibility preference
  useEffect(() => {
    localStorage.setItem('calendar-show-holidays', JSON.stringify(showHolidays));
  }, [showHolidays]);

  // Persist time format preference
  useEffect(() => {
    localStorage.setItem('calendar-time-format', JSON.stringify(is24HourFormat));
  }, [is24HourFormat]);

  // Initialize form states when editing an event
  useEffect(() => {
    if (rightPanelMode === "edit" && selectedEvent) {
      setShareWithParticipants(selectedEvent.shareWithParticipants || false);
      setAttachments((selectedEvent.attachments as any[]) || []);
      setIsOnlineMeeting(selectedEvent.isOnline || false);
      if (selectedEvent.meetingLink) {
        setGeneratedMeetingLink(selectedEvent.meetingLink);
      }
    } else if (rightPanelMode === "create") {
      setShareWithParticipants(false);
      setAttachments([]);
      setIsOnlineMeeting(false);
      setGeneratedMeetingLink("");
    }
  }, [rightPanelMode, selectedEvent]);

  const texts = useMemo(() => [
    "Calendar",
    "My Calendar",
    "Create Event",
    "Edit Event",
    "Title",
    "Description",
    "Category",
    "Priority",
    "Start Date",
    "End Date",
    "All Day",
    "Location",
    "Online Meeting",
    "Meeting Link",
    "Reminder",
    "Notes",
    "Save",
    "Cancel",
    "Delete",
    "Today",
    "Week",
    "3 Days",
    "Search",
    "People",
    "more",
    "Select category",
    "Low",
    "Medium",
    "High",
    "Urgent",
    "Saving...",
    "Updating...",
    "Deleting...",
    "Search Results",
    "No events found for",
    "minutes before",
    "e.g., John Doe, Jane Smith",
    "Finance",
    "Government",
    "Lifestyle",
    "Services",
    "Marketplace",
    "Community",
    "Admin",
    "Add participants",
    "Search users...",
    "No users found",
    "Selected",
    "participant",
    "participants",
    "Show Holidays",
    "Hide Holidays",
  ], []);

  const { translations } = useMasterBatchTranslation(texts, 'high');

  const getCategoryTranslation = (categoryId: string): string => {
    const categoryMap: Record<string, number> = {
      finance: 37,
      government: 38,
      lifestyle: 39,
      services: 40,
      marketplace: 41,
      community: 42,
      admin: 43,
    };
    const index = categoryMap[categoryId];
    return index !== undefined && translations[index] 
      ? translations[index] 
      : categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  };

  useEffect(() => {
    if (isAdminUser && !visibleCategories.has(ADMIN_CATEGORY.id)) {
      setVisibleCategories(prev => new Set([...Array.from(prev), ADMIN_CATEGORY.id]));
    }
  }, [isAdminUser, visibleCategories]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedCell && expandedCellRef.current && !expandedCellRef.current.contains(event.target as Node)) {
        setExpandedCell(null);
      }
    };

    if (expandedCell) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedCell]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedHolidayDay !== null && expandedHolidayRef.current && !expandedHolidayRef.current.contains(event.target as Node)) {
        setExpandedHolidayDay(null);
      }
    };

    if (expandedHolidayDay !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedHolidayDay]);

  useEffect(() => {
    if (rightPanelMode === 'edit' && selectedEvent && selectedEvent.attachments) {
      setAttachments(Array.isArray(selectedEvent.attachments) ? selectedEvent.attachments : []);
    } else if (rightPanelMode === 'create') {
      setAttachments([]);
    }
  }, [rightPanelMode, selectedEvent]);

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/events', currentWeekStart],
    enabled: true,
  });

  const weekEnd = useMemo(() => {
    const end = addDays(currentWeekStart, viewMode === "week" ? 6 : 2);
    return format(end, 'yyyy-MM-dd');
  }, [currentWeekStart, viewMode]);

  const { data: holidays = [] } = useQuery({
    queryKey: ['/api/calendar/holidays', format(currentWeekStart, 'yyyy-MM-dd'), weekEnd],
    queryFn: async () => {
      const response = await fetch(
        `/api/calendar/holidays?startDate=${format(currentWeekStart, 'yyyy-MM-dd')}&endDate=${weekEnd}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch holidays');
      }
      return response.json();
    },
    enabled: true,
  });

  const holidayNames = useMemo(() => {
    const uniqueNames = new Set<string>();
    holidays.forEach((holiday: any) => {
      if (holiday.name) {
        uniqueNames.add(holiday.name);
      }
    });
    return Array.from(uniqueNames);
  }, [holidays]);

  const { translations: holidayTranslations } = useMasterBatchTranslation(holidayNames, 'high');

  const getTranslatedHolidayName = (originalName: string): string => {
    const index = holidayNames.indexOf(originalName);
    return index >= 0 && holidayTranslations[index] 
      ? holidayTranslations[index] 
      : originalName;
  };

  const { data: platformUsers = [] } = useQuery<Array<{id: number, username: string, name: string, avatar: string | null}>>({
    queryKey: ['/api/messages/users'],
    enabled: true,
  });

  useEffect(() => {
    if (rightPanelMode === "edit" && selectedEvent) {
      if (selectedEvent.participants && platformUsers.length > 0) {
        const participantIds = Array.isArray(selectedEvent.participants) ? selectedEvent.participants : [];
        const participants = platformUsers.filter(user => participantIds.includes(user.id));
        setSelectedParticipants(participants);
      } else {
        setSelectedParticipants([]);
      }
    } else if (rightPanelMode === "create") {
      setSelectedParticipants([]);
    }
  }, [rightPanelMode, selectedEvent, platformUsers]);

  const createEventMutation = useMutation({
    mutationFn: async (eventData: InsertCalendarEvent) => {
      const response = await apiRequest("POST", "/api/calendar/events", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      setShowRightPanel(false);
      toast({
        title: "Event Created",
        description: "Your calendar event has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CalendarEvent> }) => {
      const response = await apiRequest("PUT", `/api/calendar/events/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      setShowRightPanel(false);
      setSelectedEvent(null);
      toast({
        title: "Event Updated",
        description: "Your calendar event has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/calendar/events/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      setShowRightPanel(false);
      setSelectedEvent(null);
      toast({
        title: "Event Deleted",
        description: "Your calendar event has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const weekDays = useMemo(() => {
    const daysToShow = viewMode === "week" ? 7 : 3;
    return Array.from({ length: daysToShow }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart, viewMode]);

  const filteredEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    return events.filter(event => visibleCategories.has(event.category));
  }, [events, visibleCategories]);

  const toggleCategory = (categoryId: string) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create events",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    const reminderStr = formData.get('reminderMinutes') as string;
    
    const eventData = {
      userId: user.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string || '',
      category: formData.get('category') as string,
      priority: (formData.get('priority') as string) || 'medium',
      startDate: new Date(startDateStr).toISOString(),
      endDate: new Date(endDateStr).toISOString(),
      isAllDay: formData.get('isAllDay') === 'on',
      location: formData.get('location') as string || '',
      people: selectedParticipants.map(p => p.name).join(', '),
      participants: selectedParticipants.map(p => p.id),
      isOnline: formData.get('isOnline') === 'on',
      meetingLink: formData.get('meetingLink') as string || '',
      shareWithParticipants: shareWithParticipants,
      reminderMinutes: reminderStr ? parseInt(reminderStr, 10) : 30,
      notes: formData.get('notes') as string || '',
      status: 'scheduled' as const,
    };

    createEventMutation.mutate(eventData as any);
    setSelectedParticipants([]);
    setAttachments([]);
    setShareWithParticipants(false);
  };

  const handleUpdateEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    const formData = new FormData(e.currentTarget);
    
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    const reminderStr = formData.get('reminderMinutes') as string;
    
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string || '',
      category: formData.get('category') as string,
      priority: formData.get('priority') as string,
      startDate: new Date(startDateStr).toISOString(),
      endDate: new Date(endDateStr).toISOString(),
      isAllDay: formData.get('isAllDay') === 'on',
      location: formData.get('location') as string || '',
      people: selectedParticipants.map(p => p.name).join(', '),
      participants: selectedParticipants.map(p => p.id),
      isOnline: formData.get('isOnline') === 'on',
      meetingLink: formData.get('meetingLink') as string || '',
      shareWithParticipants: shareWithParticipants,
      reminderMinutes: reminderStr ? parseInt(reminderStr, 10) : 30,
      notes: formData.get('notes') as string || '',
    };

    updateEventMutation.mutate({ id: selectedEvent.id, data: eventData as any });
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const toggleCellExpansion = (dayIndex: number, hour: number) => {
    if (expandedCell?.dayIndex === dayIndex && expandedCell?.hour === hour) {
      setExpandedCell(null);
    } else {
      setExpandedCell({ dayIndex, hour });
    }
  };

  const handleFiveMinuteSlotClick = (day: Date, hour: number, minute: number) => {
    const startDate = new Date(day);
    startDate.setHours(hour, minute, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(startDate.getMinutes() + 5);

    setSelectedEvent({
      id: 0,
      userId: user?.id || 0,
      title: '',
      description: null,
      category: 'finance',
      priority: 'medium',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isAllDay: false,
      location: null,
      people: null,
      isOnline: false,
      meetingLink: null,
      reminderMinutes: 30,
      notes: null,
      status: 'scheduled',
      color: null,
      createdAt: null,
      updatedAt: null,
      timezone: null,
      recurrence: null,
      recurrenceEnd: null,
      attachments: null,
      tags: null,
      visibility: 'private',
      googleEventId: null,
      outlookEventId: null,
    } as any);
    
    setExpandedCell(null);
    setRightPanelMode("create");
    setShowRightPanel(true);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      if (rightPanelMode === "search") {
        setShowRightPanel(false);
      }
      return;
    }

    try {
      const response = await fetch(`/api/calendar/events/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
        setRightPanelMode("search");
        setShowRightPanel(true);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const generateMeetingLink = () => {
    const roomId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const meetingUrl = `${window.location.origin}/meeting/${roomId}`;
    return meetingUrl;
  };

  const handleOnlineMeetingChange = (checked: boolean) => {
    setIsOnlineMeeting(checked);
    if (checked && !generatedMeetingLink) {
      const newLink = generateMeetingLink();
      setGeneratedMeetingLink(newLink);
    } else if (!checked) {
      setGeneratedMeetingLink("");
    }
  };

  useEffect(() => {
    if (selectedEvent && rightPanelMode === "edit") {
      setIsOnlineMeeting(selectedEvent.isOnline || false);
      setGeneratedMeetingLink(selectedEvent.meetingLink || "");
    } else if (rightPanelMode === "create") {
      setIsOnlineMeeting(false);
      setGeneratedMeetingLink("");
    }
  }, [selectedEvent, rightPanelMode]);

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    const hourStart = new Date(day);
    hourStart.setHours(hour, 0, 0, 0);
    const hourEnd = new Date(day);
    hourEnd.setHours(hour, 59, 59, 999);

    return filteredEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      return (
        (eventStart >= hourStart && eventStart <= hourEnd) ||
        (eventEnd >= hourStart && eventEnd <= hourEnd) ||
        (eventStart <= hourStart && eventEnd >= hourEnd)
      );
    });
  };

  const getHolidaysForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayHolidays = holidays.filter((holiday: any) => holiday.date === dayStr);
    
    const uniqueHolidays = dayHolidays.reduce((acc: any[], current: any) => {
      const exists = acc.find((h: any) => h.name === current.name);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    return uniqueHolidays;
  };

  const getCategoryInfo = (categoryId: string) => {
    return CALENDAR_CATEGORIES.find(c => c.id === categoryId);
  };

  const formatHourLabel = (hour: number): string => {
    if (is24HourFormat) {
      return `${hour.toString().padStart(2, '0')}:00`;
    } else {
      if (hour === 0) return '12 AM';
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return '12 PM';
      return `${hour - 12} PM`;
    }
  };

  const formatTimeSlot = (date: Date): string => {
    if (is24HourFormat) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'h:mm a');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Calendar Categories */}
        <div className="w-64 bg-white border-r border-gray-200 p-3 overflow-y-auto flex flex-col">
          {/* Mini Calendar Widget */}
          <div className="mb-4 bg-gray-50 rounded-lg p-2 border border-gray-200">
            <Calendar
              mode="single"
              selected={miniCalendarDate}
              onSelect={(date) => {
                setMiniCalendarDate(date);
                if (date) {
                  setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 0 }));
                }
              }}
              className="scale-90 origin-top"
              classNames={{
                months: "flex flex-col",
                month: "space-y-2",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-xs font-semibold text-gray-700",
                nav: "space-x-1 flex items-center",
                nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse",
                head_row: "flex",
                head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.65rem]",
                row: "flex w-full mt-1",
                cell: "h-8 w-8 text-center text-xs p-0 relative hover:bg-gray-100 rounded-md",
                day: "h-8 w-8 p-0 font-normal hover:bg-gray-100 rounded-md",
                day_range_end: "day-range-end",
                day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white rounded-md",
                day_today: "bg-blue-100 text-blue-900 rounded-md",
                day_outside: "text-gray-400 opacity-50",
                day_disabled: "text-gray-400 opacity-50",
                day_hidden: "invisible",
              }}
              data-testid="mini-calendar"
            />
          </div>

          <div className="mb-4">
            <Button 
              className="w-full shadow-sm bg-black text-white hover:bg-gray-800" 
              onClick={() => {
                setRightPanelMode("create");
                setSelectedEvent(null);
                setShowRightPanel(true);
              }}
              data-testid="button-create-event"
            >
              <Plus className="mr-2 h-4 w-4" />
              {translations[2] || "Create Event"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 px-1">
                My Calendars
              </h3>
              <div className="space-y-0.5">
                {CALENDAR_CATEGORIES.map(category => {
                  const Icon = category.icon;
                  const isVisible = visibleCategories.has(category.id);
                  return (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                      data-testid={`category-${category.id}`}
                    >
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={() => toggleCategory(category.id)}
                        className="h-4 w-4"
                        data-testid={`checkbox-category-${category.id}`}
                      />
                      <div className={`w-2.5 h-2.5 rounded-full ${category.color} flex-shrink-0`} />
                      <Icon className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
                      <span className="text-xs text-gray-700 font-medium">{getCategoryTranslation(category.id)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            {/* Hide/Show Holidays Button */}
            <div className="mt-4">
              <Button 
                variant="ghost"
                className="w-full justify-start" 
                onClick={() => setShowHolidays(!showHolidays)}
                data-testid="button-toggle-holidays"
              >
                {showHolidays ? "Hide Holidays" : "Show Holidays"}
              </Button>
            </div>

            {/* 12/24 Hour Format Toggle Button */}
            <div className="mt-2">
              <Button 
                variant="ghost"
                className="w-full justify-start" 
                onClick={() => setIs24HourFormat(!is24HourFormat)}
                data-testid="button-toggle-time-format"
              >
                {is24HourFormat ? "Show 12 Hours" : "Show 24 Hours"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Top Navigation */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousWeek}
                    data-testid="button-previous-week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextWeek}
                    data-testid="button-next-week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToday}
                    data-testid="button-today"
                  >
                    {translations[19] || "Today"}
                  </Button>
                </div>

                <h2 className="text-xl font-semibold text-gray-900">
                  {format(currentWeekStart, 'MMMM yyyy')}
                </h2>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <Button
                    variant={viewMode === "3day" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("3day")}
                    className={viewMode === "3day" ? "bg-black text-white hover:bg-gray-800" : ""}
                    data-testid="button-view-3day"
                  >
                    {translations[21] || "3 Days"}
                  </Button>
                  <Button
                    variant={viewMode === "week" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("week")}
                    className={viewMode === "week" ? "bg-black text-white hover:bg-gray-800" : ""}
                    data-testid="button-view-week"
                  >
                    {translations[20] || "Week"}
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={translations[22] || "Search"}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-64 border-0 border-b border-gray-300 rounded-none focus-visible:ring-0 focus-visible:border-gray-500"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-[80px_1fr] min-h-full">
              {/* Fixed Time Column */}
              <div className="sticky left-0 z-20 bg-white border-r border-gray-200">
                {/* Time column header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 z-30">
                  <div className="h-28 flex items-center justify-center text-xs font-semibold text-gray-500">
                    Time
                  </div>
                </div>

                {/* Time labels */}
                <div>
                  {HOURS.map(hour => (
                    <div
                      key={`time-${hour}`}
                      className="h-20 border-b border-gray-200 bg-gray-50 flex items-start justify-center pt-1"
                    >
                      <span className="text-xs text-gray-500 font-medium">
                        {formatHourLabel(hour)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrollable Day Columns */}
              <div className="overflow-x-auto">
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weekDays.length}, minmax(150px, 1fr))` }}>
                  {/* Day headers */}
                  {weekDays.map((day, index) => {
                    const dayHolidays = getHolidaysForDay(day);
                    const isHolidayExpanded = expandedHolidayDay === index;
                    
                    return (
                      <div
                        key={index}
                        className="sticky top-0 bg-white border-b border-r border-gray-200 z-10"
                      >
                        <div className={`${isHolidayExpanded ? 'min-h-28' : 'h-28'} flex flex-col items-center justify-center px-2 transition-all`}>
                          <div className="text-xs text-gray-500">
                            {format(day, 'EEE').toUpperCase()}
                          </div>
                          <div className={`text-2xl font-semibold ${
                            isSameDay(day, new Date())
                              ? 'text-blue-600'
                              : 'text-gray-900'
                          }`}>
                            {format(day, 'd')}
                          </div>
                          {showHolidays && dayHolidays.length > 0 && (
                            <div 
                              ref={isHolidayExpanded ? expandedHolidayRef : null}
                              className="flex flex-col gap-0.5 mt-1 w-full"
                            >
                              {isHolidayExpanded ? (
                                dayHolidays.map((holiday: any) => (
                                  <div
                                    key={holiday.id}
                                    className="text-xs px-1 py-0.5 text-black text-center truncate"
                                    title={getTranslatedHolidayName(holiday.name)}
                                  >
                                    {getTranslatedHolidayName(holiday.name)}
                                  </div>
                                ))
                              ) : (
                                <>
                                  {dayHolidays.slice(0, 2).map((holiday: any) => (
                                    <div
                                      key={holiday.id}
                                      className="text-xs px-1 py-0.5 text-black text-center truncate"
                                      title={getTranslatedHolidayName(holiday.name)}
                                    >
                                      {getTranslatedHolidayName(holiday.name)}
                                    </div>
                                  ))}
                                  {dayHolidays.length > 2 && (
                                    <div 
                                      className="text-xs text-gray-500 text-center cursor-pointer hover:text-blue-600 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedHolidayDay(index);
                                      }}
                                      data-testid={`expand-holidays-${index}`}
                                    >
                                      +{dayHolidays.length - 2} {translations[24] || "more"}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Time slot cells */}
                  {HOURS.map(hour => (
                    weekDays.map((day, dayIndex) => {
                      const eventsInSlot = getEventsForDayAndHour(day, hour);
                      const isExpanded = expandedCell?.dayIndex === dayIndex && expandedCell?.hour === hour;
                      
                      return (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className="relative h-20 border-r border-b border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('.event-card') || (e.target as HTMLElement).closest('.time-slot-btn')) return;
                            toggleCellExpansion(dayIndex, hour);
                          }}
                          data-testid={`cell-${dayIndex}-${hour}`}
                        >
                          {isExpanded && (
                            <div 
                              ref={expandedCellRef}
                              className="absolute top-0 left-0 right-0 bg-blue-50 border-2 border-blue-500 rounded-md shadow-lg z-50 p-3 max-h-[640px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400"
                            >
                              <div className="flex flex-col gap-2">
                                {Array.from({ length: 12 }, (_, i) => i * 5).map(minute => {
                                  const slotTime = new Date(day);
                                  slotTime.setHours(hour, minute, 0, 0);
                                  return (
                                    <Button
                                      key={minute}
                                      variant="outline"
                                      className="time-slot-btn w-full h-12 text-xs font-medium hover:bg-blue-100 hover:border-blue-600 transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFiveMinuteSlotClick(day, hour, minute);
                                      }}
                                      data-testid={`slot-${hour}-${minute}`}
                                    >
                                      {formatTimeSlot(slotTime)}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <div className="h-full p-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                            {eventsInSlot.map(event => {
                              const categoryInfo = getCategoryInfo(event.category);
                              return (
                                <Card
                                  key={event.id}
                                  className={`mb-1 cursor-pointer event-card ${categoryColorMap[event.category]} border-l-4`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                    setRightPanelMode("edit");
                                    setShowRightPanel(true);
                                  }}
                                  data-testid={`event-${event.id}`}
                                >
                                  <CardContent className="p-2">
                                    <div className="flex items-start justify-between gap-1">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate">{event.title}</p>
                                        <p className="text-xs truncate">
                                          {formatTimeSlot(new Date(event.startDate))} - {formatTimeSlot(new Date(event.endDate))}
                                        </p>
                                      </div>
                                      {categoryInfo && (
                                        <categoryInfo.icon className="h-3 w-3 flex-shrink-0" />
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Panel - Event Form */}
        {showRightPanel && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {rightPanelMode === "create" && (translations[2] || "Create Event")}
                  {rightPanelMode === "edit" && (translations[3] || "Edit Event")}
                  {rightPanelMode === "search" && `${translations[33] || "Search Results"} (${searchResults.length})`}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowRightPanel(false);
                    if (rightPanelMode === "search") {
                      setSearchQuery("");
                      setSearchResults([]);
                    }
                  }}
                  data-testid="button-close-panel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {rightPanelMode === "search" ? (
                <div className="space-y-3">
                  {searchResults.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {translations[34] || "No events found for"} "{searchQuery}"
                    </p>
                  ) : (
                    searchResults.map((event) => {
                      const categoryInfo = CALENDAR_CATEGORIES.find(c => c.id === event.category);
                      return (
                        <Card
                          key={event.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow ${categoryColorMap[event.category]} border-l-4`}
                          onClick={() => {
                            setSelectedEvent(event);
                            setRightPanelMode("edit");
                          }}
                          data-testid={`search-result-${event.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-base">{event.title}</h3>
                              {categoryInfo && <categoryInfo.icon className="h-5 w-5 flex-shrink-0" />}
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                            <div className="flex flex-col gap-1 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{format(new Date(event.startDate), 'PPp')}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">📍 {event.location}</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              ) : (
                <form onSubmit={rightPanelMode === "create" ? handleCreateEvent : handleUpdateEvent} className="space-y-4">
                <div>
                  <Label htmlFor="title">{translations[4] || "Title"}</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    required 
                    defaultValue={rightPanelMode === "edit" ? selectedEvent?.title : ""}
                    data-testid="input-event-title" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">{translations[5] || "Description"}</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    rows={3} 
                    defaultValue={rightPanelMode === "edit" ? (selectedEvent?.description || "") : ""}
                    data-testid="input-event-description" 
                  />
                </div>

                <div>
                  <Label htmlFor="category">{translations[6] || "Category"}</Label>
                  <Select name="category" required defaultValue={rightPanelMode === "edit" ? (selectedEvent?.category || undefined) : undefined}>
                    <SelectTrigger data-testid="select-event-category">
                      <SelectValue placeholder={translations[25] || "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {CALENDAR_CATEGORIES.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{getCategoryTranslation(cat.id)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">{translations[7] || "Priority"}</Label>
                  <Select 
                    name="priority" 
                    defaultValue={rightPanelMode === "edit" ? (selectedEvent?.priority || "medium") : "medium"}
                  >
                    <SelectTrigger data-testid="select-event-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{translations[26] || "Low"}</SelectItem>
                      <SelectItem value="medium">{translations[27] || "Medium"}</SelectItem>
                      <SelectItem value="high">{translations[28] || "High"}</SelectItem>
                      <SelectItem value="urgent">{translations[29] || "Urgent"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startDate">{translations[8] || "Start Date"}</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="datetime-local"
                    required
                    defaultValue={
                      rightPanelMode === "edit" && selectedEvent
                        ? format(new Date(selectedEvent.startDate), "yyyy-MM-dd'T'HH:mm")
                        : format(new Date(), "yyyy-MM-dd'T'HH:mm")
                    }
                    data-testid="input-start-date"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">{translations[9] || "End Date"}</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="datetime-local"
                    required
                    defaultValue={
                      rightPanelMode === "edit" && selectedEvent
                        ? format(new Date(selectedEvent.endDate), "yyyy-MM-dd'T'HH:mm")
                        : format(new Date(), "yyyy-MM-dd'T'HH:mm")
                    }
                    data-testid="input-end-date"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isAllDay" 
                    name="isAllDay" 
                    defaultChecked={rightPanelMode === "edit" ? (selectedEvent?.isAllDay || false) : false}
                    data-testid="checkbox-all-day" 
                  />
                  <Label htmlFor="isAllDay">{translations[10] || "All Day"}</Label>
                </div>

                <div>
                  <Label htmlFor="location">{translations[11] || "Location"}</Label>
                  <Input 
                    id="location" 
                    name="location" 
                    defaultValue={rightPanelMode === "edit" ? (selectedEvent?.location || "") : ""}
                    data-testid="input-location" 
                  />
                </div>

                <div>
                  <Label htmlFor="people">{translations[23] || "People"}</Label>
                  <Popover open={participantSearchOpen} onOpenChange={setParticipantSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={participantSearchOpen}
                        className="w-full justify-between font-normal"
                        data-testid="button-select-participants"
                        type="button"
                      >
                        {selectedParticipants.length > 0
                          ? `${translations[46] || "Selected"} ${selectedParticipants.length} ${selectedParticipants.length === 1 ? (translations[47] || "participant") : (translations[48] || "participants")}`
                          : (translations[44] || "Add participants")}
                        <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder={translations[45] || "Search users..."} data-testid="input-search-users" />
                        <CommandList>
                          <CommandEmpty>{translations[46] || "No users found"}</CommandEmpty>
                          <CommandGroup>
                            {platformUsers.map((user) => {
                              const isSelected = selectedParticipants.some(p => p.id === user.id);
                              return (
                                <CommandItem
                                  key={user.id}
                                  value={`${user.username} ${user.name}`}
                                  onSelect={() => {
                                    if (isSelected) {
                                      setSelectedParticipants(selectedParticipants.filter(p => p.id !== user.id));
                                    } else {
                                      setSelectedParticipants([...selectedParticipants, user]);
                                    }
                                  }}
                                  className="cursor-pointer"
                                  data-testid={`user-option-${user.id}`}
                                >
                                  <Checkbox checked={isSelected} className="mr-2" />
                                  <div className="flex items-center gap-2">
                                    <UserAvatar 
                                      userId={user.id} 
                                      username={user.username} 
                                      size="sm" 
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">{user.name}</span>
                                      <span className="text-xs text-gray-500">@{user.username}</span>
                                    </div>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      {selectedParticipants.length > 0 && (
                        <div className="border-t p-2">
                          <div className="flex flex-wrap gap-1">
                            {selectedParticipants.map(participant => (
                              <Badge 
                                key={participant.id} 
                                variant="secondary" 
                                className="text-xs"
                                data-testid={`selected-participant-${participant.id}`}
                              >
                                {participant.name}
                                <X 
                                  className="ml-1 h-3 w-3 cursor-pointer" 
                                  onClick={() => setSelectedParticipants(selectedParticipants.filter(p => p.id !== participant.id))}
                                />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isOnline" 
                    name="isOnline" 
                    checked={isOnlineMeeting}
                    onCheckedChange={handleOnlineMeetingChange}
                    data-testid="checkbox-online" 
                  />
                  <Label htmlFor="isOnline" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    {translations[12] || "Online Meeting"}
                  </Label>
                </div>

                {isOnlineMeeting && (
                  <div>
                    <Label htmlFor="meetingLink" className="flex items-center justify-between">
                      <span>{translations[13] || "Meeting Link"}</span>
                      {generatedMeetingLink && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => window.open(generatedMeetingLink, '_blank')}
                          data-testid="button-open-meeting"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open Meeting
                        </Button>
                      )}
                    </Label>
                    <div className="relative">
                      <Input 
                        id="meetingLink" 
                        name="meetingLink" 
                        type="url" 
                        value={generatedMeetingLink}
                        readOnly
                        data-testid="input-meeting-link"
                        className="pr-10 bg-muted cursor-pointer"
                        onClick={() => generatedMeetingLink && window.open(generatedMeetingLink, '_blank')}
                      />
                      {generatedMeetingLink && (
                        <ExternalLink 
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer"
                          onClick={() => window.open(generatedMeetingLink, '_blank')}
                        />
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="reminderMinutes">{translations[14] || "Reminder"} ({translations[35] || "minutes before"})</Label>
                  <Input
                    id="reminderMinutes"
                    name="reminderMinutes"
                    type="number"
                    defaultValue={rightPanelMode === "edit" ? (selectedEvent?.reminderMinutes || 30) : 30}
                    data-testid="input-reminder"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">{translations[15] || "Notes"}</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    rows={3} 
                    defaultValue={rightPanelMode === "edit" ? (selectedEvent?.notes || "") : ""}
                    data-testid="input-notes" 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="shareWithParticipants" 
                      checked={shareWithParticipants}
                      onCheckedChange={(checked) => setShareWithParticipants(checked as boolean)}
                      data-testid="checkbox-share-files" 
                    />
                    <Label htmlFor="shareWithParticipants" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Share with Participants
                    </Label>
                  </div>

                  {shareWithParticipants && (
                    <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                      <div>
                        <Label className="text-sm text-gray-600">
                          Upload files to share with event participants
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          Supported: Documents, images, videos, audio (max 50MB)
                        </p>
                      </div>
                      
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;

                          setUploadingFiles(true);
                          
                          for (const file of files) {
                            if (file.size > 50 * 1024 * 1024) {
                              toast({
                                title: "File too large",
                                description: `${file.name} exceeds 50MB limit`,
                                variant: "destructive",
                              });
                              continue;
                            }

                            setAttachments(prev => [
                              ...prev,
                              {
                                name: file.name,
                                url: URL.createObjectURL(file),
                                type: file.type,
                                size: file.size
                              }
                            ]);
                          }
                          
                          setUploadingFiles(false);
                          toast({
                            title: "Files added",
                            description: `${files.length} file(s) will be uploaded when you save the event`,
                          });
                          
                          e.target.value = '';
                        }}
                        data-testid="input-file-upload"
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={uploadingFiles}
                        className="w-full"
                        data-testid="button-upload-files"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingFiles ? "Adding files..." : "Choose Files to Upload"}
                      </Button>

                      {attachments.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm">Selected Files ({attachments.length})</Label>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {attachments.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                data-testid={`attachment-${index}`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <File className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{file.name}</span>
                                  <span className="text-xs text-gray-500">
                                    ({(file.size / 1024).toFixed(0)}KB)
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    URL.revokeObjectURL(file.url);
                                    setAttachments(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  data-testid={`button-remove-file-${index}`}
                                >
                                  <Trash className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedParticipants.length === 0 && (
                        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                          Note: Add participants above to share files with them
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowRightPanel(false)}
                    className="flex-1"
                  >
                    {translations[17] || "Cancel"}
                  </Button>
                  
                  {rightPanelMode === "edit" && selectedEvent && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      disabled={deleteEventMutation.isPending}
                      data-testid="button-delete-event"
                    >
                      {deleteEventMutation.isPending ? (translations[32] || "Deleting...") : (translations[18] || "Delete")}
                    </Button>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={rightPanelMode === "create" ? createEventMutation.isPending : updateEventMutation.isPending} 
                    data-testid="button-save-event"
                    className="flex-1 bg-black text-white hover:bg-black/90"
                  >
                    {rightPanelMode === "create" 
                      ? (createEventMutation.isPending ? (translations[30] || "Saving...") : (translations[16] || "Save"))
                      : (updateEventMutation.isPending ? (translations[31] || "Updating...") : (translations[16] || "Save"))
                    }
                  </Button>
                </div>
              </form>
            )}
            </div>
          </div>
        )}
    </div>
  );
}

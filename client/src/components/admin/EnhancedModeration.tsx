import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Bot,
  Clock,
  Shield,
  FileWarning,
  ListFilter,
} from "lucide-react";
import ModeratorDashboard from "./ModeratorDashboard";
import AIModeratorAssistant from "./AIModeratorAssistant";
import BatchModeration from "./BatchModeration";
import ModerationLogs from "./ModerationLogs";
import ContentModerationTools from "./ContentModerationTools";

export default function EnhancedModeration() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="hidden md:inline">AI Assistant</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            <span className="hidden md:inline">Batch Actions</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">Moderation Tools</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Activity Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-4">
          <ModeratorDashboard />
        </TabsContent>

        <TabsContent value="ai-assistant" className="mt-6 space-y-4">
          <AIModeratorAssistant />
        </TabsContent>

        <TabsContent value="batch" className="mt-6 space-y-4">
          <BatchModeration />
        </TabsContent>

        <TabsContent value="tools" className="mt-6 space-y-4">
          <ContentModerationTools />
        </TabsContent>

        <TabsContent value="logs" className="mt-6 space-y-4">
          <ModerationLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
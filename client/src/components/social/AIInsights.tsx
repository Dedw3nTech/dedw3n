import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquareText, 
  BarChart, 
  PieChart, 
  Loader2,
  Brain,
  LineChart,
  Lightbulb,
  Sparkles
} from "lucide-react";

type Topic = {
  name: string;
  count: number;
  percentage: number;
};

type Sentiment = {
  positive: number;
  neutral: number;
  negative: number;
};

type ContentInsight = {
  type: string;
  engagement: number;
  recommendation: string;
};

export default function AIInsights() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("topic");

  // Mock data until backend is implemented
  const topicsData: Topic[] = [
    { name: "Technology", count: 245, percentage: 32 },
    { name: "Fashion", count: 189, percentage: 25 },
    { name: "Travel", count: 156, percentage: 21 },
    { name: "Food", count: 124, percentage: 16 },
    { name: "Entertainment", count: 76, percentage: 10 }
  ];

  const sentimentData: Sentiment = {
    positive: 65,
    neutral: 23,
    negative: 12
  };

  const contentInsightsData: ContentInsight[] = [
    { 
      type: "Video", 
      engagement: 84, 
      recommendation: "Short-form vertical videos under 60 seconds perform best for your audience" 
    },
    { 
      type: "Images", 
      engagement: 68, 
      recommendation: "Product showcases with lifestyle context generate most interactions" 
    },
    { 
      type: "Text", 
      engagement: 42, 
      recommendation: "Question-based posts drive more comments and discussions" 
    }
  ];

  // Generate AI insights mutation
  const generateInsightsMutation = useMutation({
    mutationFn: async (type: string) => {
      const res = await apiRequest("POST", "/api/social/insights/generate", { type });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Fresh insights have been generated based on your latest data.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateInsights = (type: string) => {
    generateInsightsMutation.mutate(type);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Social Insights</h2>
        <p className="text-muted-foreground">
          Leverage AI-powered analytics to understand your audience and optimize your content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Topic Analysis
            </CardTitle>
            <CardDescription>
              Popular topics in your community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topicsData.map((topic) => (
                <div key={topic.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{topic.name}</span>
                    <span className="font-medium">{topic.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${topic.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-primary" />
              Sentiment Analysis
            </CardTitle>
            <CardDescription>
              Audience reaction to your content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Positive
                  </span>
                  <span className="font-medium">{sentimentData.positive}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${sentimentData.positive}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                    Neutral
                  </span>
                  <span className="font-medium">{sentimentData.neutral}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${sentimentData.neutral}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                    Negative
                  </span>
                  <span className="font-medium">{sentimentData.negative}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${sentimentData.negative}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Content Insights
            </CardTitle>
            <CardDescription>
              Optimizations for better engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contentInsightsData.map((insight) => (
                <div key={insight.type} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{insight.type}</span>
                    <span className="text-sm bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {insight.engagement}% engagement
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Advanced AI Analysis
          </CardTitle>
          <CardDescription>
            Generate specialized insights for your business needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="audience" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="audience">Audience Analysis</TabsTrigger>
              <TabsTrigger value="content">Content Strategy</TabsTrigger>
              <TabsTrigger value="growth">Growth Opportunities</TabsTrigger>
            </TabsList>
            
            <TabsContent value="audience" className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-semibold">Demographic Breakdown</h4>
                  <p className="text-sm text-muted-foreground">Deep audience segmentation and behavior analysis</p>
                </div>
                <Button 
                  variant="default" 
                  onClick={() => handleGenerateInsights('audience')}
                  disabled={generateInsightsMutation.isPending}
                >
                  {generateInsightsMutation.isPending && activeTab === 'audience' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Insights
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-semibold">Content Performance</h4>
                  <p className="text-sm text-muted-foreground">Format, timing, and topic recommendations</p>
                </div>
                <Button 
                  variant="default" 
                  onClick={() => handleGenerateInsights('content')}
                  disabled={generateInsightsMutation.isPending}
                >
                  {generateInsightsMutation.isPending && activeTab === 'content' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Insights
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="growth" className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-semibold">Revenue Optimization</h4>
                  <p className="text-sm text-muted-foreground">Identify opportunities to increase engagement and revenue</p>
                </div>
                <Button 
                  variant="default" 
                  onClick={() => handleGenerateInsights('growth')}
                  disabled={generateInsightsMutation.isPending}
                >
                  {generateInsightsMutation.isPending && activeTab === 'growth' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Insights
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
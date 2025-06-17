"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { MessageSquare, Clock, Calendar, TrendingUp, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/fileUtils";

export function StatsTab() {
  const stats = useQuery(api.stats.getUserStats);

  const statCards = [
    {
      title: "Total Messages",
      value: stats?.totalMessages || 0,
      description: "Messages sent across all threads",
      icon: MessageSquare,
      trend: stats?.messagesThisWeek && stats.messagesThisWeek > 0 ? `+${stats.messagesThisWeek} this week` : "No messages this week",
      trendColor: "text-green-500"
    },
    {
      title: "Active Threads",
      value: stats?.totalThreads || 0,
      description: "Conversation threads created",
      icon: Calendar,
      trend: stats?.threadsThisWeek && stats.threadsThisWeek > 0 ? `+${stats.threadsThisWeek} this week` : "No new threads this week",
      trendColor: "text-green-500"
    },
    {
      title: "Total Attachments",
      value: stats?.totalAttachments || 0,
      description: "Files uploaded and shared",
      icon: TrendingUp,
      trend: formatFileSize(stats?.totalAttachmentSize || 0),
      trendColor: "text-blue-500"
    },
    {
      title: "Account Age",
      value: stats?.accountAgeDays || 0,
      description: "Days since account creation",
      icon: Clock,
      trend: `Created ${new Date(stats?.accountCreatedAt || 0).toLocaleDateString()}`,
      trendColor: "text-purple-500"
    },
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Account Statistics</CardTitle>
          </div>
          <CardDescription>
            Overview of your chat activity and usage statistics
          </CardDescription>
        </CardHeader>
      </Card>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="rounded-full bg-primary/10 p-2">
                <stat.icon className={cn("h-4 w-4 text-primary", stat.trendColor)} />
              </div>
            </CardHeader>
            <CardContent>
              {stats === undefined ? (
                <div className="space-y-2">
                  <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
                  <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                  <div className="h-6 w-28 animate-pulse rounded bg-muted"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
                  <p className="text-sm text-muted-foreground mt-1">{stat.description}</p>
                  <Badge style="soft" className={cn("mt-3 text-xs font-medium truncate", stat.trendColor)}>
                    {stat.trend}
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-2 border-primary/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Usage Breakdown</CardTitle>
          <CardDescription className="text-base">
            Your most used models and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stats === undefined ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-dashed rounded-lg border-muted">
                  <div className="space-y-2">
                    <div className="h-5 w-32 animate-pulse rounded bg-muted"></div>
                    <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                  </div>
                  <div className="h-6 w-16 animate-pulse rounded bg-muted"></div>
                </div>
              ))}
            </>
          ) : (
            <div className="grid gap-4">
              {stats?.modelUsage?.map((model, index) => (
                <div 
                  key={index} 
                  className="relative flex items-center justify-between group p-4 rounded-lg transition-all duration-200 hover:shadow-md border border-muted hover:border-primary/30 bg-gradient-to-r hover:from-primary/5 hover:to-transparent"
                >
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">
                      {model.modelName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {model.count.toLocaleString()} messages sent
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-primary/60 transition-all duration-300 ease-out group-hover:bg-primary"
                        style={{ width: `${model.percentage}%` }}
                      />
                    </div>
                    <Badge 
                      style="soft"
                      className="min-w-[3rem] text-center transition-colors group-hover:border-primary group-hover:text-primary"
                    >
                      {model.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
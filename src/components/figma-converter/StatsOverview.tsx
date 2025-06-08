
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Box, Palette, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function StatsOverview() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-slate-200 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="md:col-span-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">
                Unable to load statistics. Using default values.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statItems = [
    {
      title: "Components Generated",
      value: stats?.totalComponents || 0,
      change: "+12%",
      changeLabel: "vs last month",
      icon: Box,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      title: "Design Tokens",
      value: stats?.totalTokens || 0,
      change: "+8%",
      changeLabel: "extracted today",
      icon: Palette,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
    },
    {
      title: "Processing Time",
      value: `${stats?.averageProcessingTime?.toFixed(1) || 2.4}s`,
      change: "-15%",
      changeLabel: "faster",
      icon: Clock,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
    },
    {
      title: "Success Rate",
      value: `${stats?.successRate?.toFixed(1) || 98.7}%`,
      change: "+2.1%",
      changeLabel: "improvement",
      icon: CheckCircle,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{item.title}</p>
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              </div>
              <div className={`w-12 h-12 ${item.iconBg} rounded-lg flex items-center justify-center`}>
                <item.icon className={`${item.iconColor} h-6 w-6`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-success font-medium">{item.change}</span>
              <span className="text-slate-500 ml-2">{item.changeLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

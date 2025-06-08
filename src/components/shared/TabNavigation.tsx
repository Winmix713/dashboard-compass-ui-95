
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";

interface TabItem {
  value: string;
  label: string;
  icon: string;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
}

export default function TabNavigation({ tabs, activeTab }: TabNavigationProps) {
  return (
    <div className="border-b border-slate-200">
      <TabsList className="grid w-full grid-cols-6 bg-slate-50">
        {tabs.map((tab) => (
          <TabsTrigger 
            key={tab.value}
            value={tab.value} 
            className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            {tab.value === 'settings' ? (
              <Settings className="h-4 w-4" />
            ) : (
              <i className={`fas ${tab.icon} text-sm`}></i>
            )}
            <span>{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}

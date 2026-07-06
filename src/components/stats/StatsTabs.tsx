import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OverviewTab from "./OverviewTab";
import TrendsTab from "./TrendsTab";
import ClubFeed from "@/components/home/ClubFeed";

const StatsTabs = () => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full grid grid-cols-3 mb-4">
        <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
        <TabsTrigger value="trends" className="text-sm">Trends</TabsTrigger>
        <TabsTrigger value="club" className="text-sm">Club</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4 mt-0">
        <OverviewTab />
      </TabsContent>
      <TabsContent value="trends" className="space-y-4 mt-0">
        <TrendsTab />
      </TabsContent>
      <TabsContent value="club" className="space-y-4 mt-0">
        <ClubFeed />
      </TabsContent>
    </Tabs>
  );
};

export default StatsTabs;

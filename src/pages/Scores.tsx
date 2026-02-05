 import { AppLayout } from '@/components/layout/AppLayout';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Activity } from 'lucide-react';
 import { DAS28Calculator } from '@/components/scores/DAS28Calculator';
 import { CDAICalculator } from '@/components/scores/CDAICalculator';
 import { BASDAICalculator } from '@/components/scores/BASDAICalculator';
 import { SLEDAICalculator } from '@/components/scores/SLEDAICalculator';
 
 export default function Scores() {
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         <div className="mb-6">
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <Activity className="h-6 w-6 text-primary" />
             Disease Activity Scores
           </h1>
           <p className="text-muted-foreground">Calculate and track disease activity indices</p>
         </div>
 
         <Tabs defaultValue="das28" className="space-y-6">
           <TabsList className="grid w-full max-w-lg grid-cols-4">
             <TabsTrigger value="das28">DAS28-ESR</TabsTrigger>
             <TabsTrigger value="cdai">CDAI</TabsTrigger>
             <TabsTrigger value="basdai">BASDAI</TabsTrigger>
             <TabsTrigger value="sledai">SLEDAI</TabsTrigger>
           </TabsList>
 
           <TabsContent value="das28">
             <DAS28Calculator />
           </TabsContent>
 
           <TabsContent value="cdai">
             <CDAICalculator />
           </TabsContent>
 
           <TabsContent value="basdai">
             <BASDAICalculator />
           </TabsContent>
 
           <TabsContent value="sledai">
             <SLEDAICalculator />
           </TabsContent>
         </Tabs>
       </div>
     </AppLayout>
   );
 }
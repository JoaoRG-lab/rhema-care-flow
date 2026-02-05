import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Separator } from "@/components/ui/separator";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import { Label } from "@/components/ui/label";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Sun, Moon, Monitor } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 
 const ColorSwatch = ({ name, variable, description }: { name: string; variable: string; description?: string }) => (
   <div className="flex items-center gap-3 p-2">
     <div 
       className="w-12 h-12 rounded-lg border shadow-sm flex-shrink-0" 
       style={{ backgroundColor: `hsl(var(${variable}))` }}
     />
     <div>
       <p className="font-medium text-sm">{name}</p>
       <p className="text-xs text-muted-foreground font-mono">{variable}</p>
       {description && <p className="text-xs text-muted-foreground">{description}</p>}
     </div>
   </div>
 );
 
 const DiseaseTag = ({ className, label }: { className: string; label: string }) => (
   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
     {label}
   </span>
 );
 
 export default function StyleGuide() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setResolvedTheme(systemDark ? "dark" : "light");
      if (systemDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else if (theme === "dark") {
      root.classList.add("dark");
      setResolvedTheme("dark");
    } else {
      root.classList.remove("dark");
      setResolvedTheme("light");
    }

    return () => {
      // Reset to light mode when leaving the page
      root.classList.remove("dark");
    };
  }, [theme]);

   return (
     <div className="min-h-screen bg-background p-8">
       <div className="max-w-6xl mx-auto space-y-12">
         {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">RheumaFlow Design System</h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive style guide for the medical-tech professional theme
            </p>
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Theme:</span>
            <Tabs value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
              <TabsList>
                <TabsTrigger value="light" className="gap-1.5">
                  <Sun className="h-4 w-4" />
                  Light
                </TabsTrigger>
                <TabsTrigger value="dark" className="gap-1.5">
                  <Moon className="h-4 w-4" />
                  Dark
                </TabsTrigger>
                <TabsTrigger value="system" className="gap-1.5">
                  <Monitor className="h-4 w-4" />
                  System
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge variant={resolvedTheme === "dark" ? "secondary" : "outline"} className="ml-2">
              {resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}
            </Badge>
          </div>
         </div>
 
         <Separator />
 
         {/* Core Colors */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Core Colors</h2>
             <p className="text-muted-foreground">Foundation colors for surfaces, text, and interactions</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">Backgrounds</CardTitle>
               </CardHeader>
               <CardContent className="space-y-1">
                 <ColorSwatch name="Background" variable="--background" description="Page backgrounds" />
                 <ColorSwatch name="Card" variable="--card" description="Card surfaces" />
                 <ColorSwatch name="Popover" variable="--popover" description="Dropdown surfaces" />
                 <ColorSwatch name="Muted" variable="--muted" description="Subtle backgrounds" />
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">Text Colors</CardTitle>
               </CardHeader>
               <CardContent className="space-y-1">
                 <ColorSwatch name="Foreground" variable="--foreground" description="Primary text" />
                 <ColorSwatch name="Card Foreground" variable="--card-foreground" />
                 <ColorSwatch name="Muted Foreground" variable="--muted-foreground" description="Secondary text" />
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">Brand Colors</CardTitle>
               </CardHeader>
               <CardContent className="space-y-1">
                 <ColorSwatch name="Primary (Deep Teal)" variable="--primary" description="Main brand color" />
                 <ColorSwatch name="Primary Foreground" variable="--primary-foreground" />
                 <ColorSwatch name="Accent (Soft Cyan)" variable="--accent" description="Highlights" />
                 <ColorSwatch name="Secondary" variable="--secondary" />
               </CardContent>
             </Card>
           </div>
         </section>
 
         <Separator />
 
         {/* Disease Category Colors */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Disease Category Colors</h2>
             <p className="text-muted-foreground">Color-coded system for rheumatologic conditions</p>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">Disease Colors</CardTitle>
               </CardHeader>
               <CardContent className="space-y-1">
                 <ColorSwatch name="RA (Rheumatoid Arthritis)" variable="--ra" description="210 75% 50% - Blue" />
                 <ColorSwatch name="SLE (Lupus)" variable="--sle" description="280 60% 55% - Purple" />
                 <ColorSwatch name="SpA (Spondyloarthritis)" variable="--spa" description="185 65% 40% - Teal" />
                 <ColorSwatch name="PsA (Psoriatic Arthritis)" variable="--psa" description="35 90% 50% - Amber" />
                 <ColorSwatch name="Vasculitis" variable="--vasculitis" description="0 65% 50% - Rose" />
                 <ColorSwatch name="FM (Fibromyalgia)" variable="--fm" description="320 55% 55% - Pink" />
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">Disease Tags in Use</CardTitle>
               </CardHeader>
               <CardContent className="flex flex-wrap gap-2">
                 <DiseaseTag className="tag-ra" label="Rheumatoid Arthritis" />
                 <DiseaseTag className="tag-sle" label="SLE" />
                 <DiseaseTag className="tag-spa" label="Spondyloarthritis" />
                 <DiseaseTag className="tag-psa" label="Psoriatic Arthritis" />
                 <DiseaseTag className="tag-vasculitis" label="Vasculitis" />
                 <DiseaseTag className="tag-fm" label="Fibromyalgia" />
               </CardContent>
             </Card>
           </div>
         </section>
 
         <Separator />
 
         {/* Risk & Therapy Tags */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Risk & Therapy Tags</h2>
             <p className="text-muted-foreground">Tags for treatment and risk factor identification</p>
           </div>
 
           <Card>
             <CardContent className="pt-6 flex flex-wrap gap-2">
               <DiseaseTag className="tag-biologic" label="Biologic" />
               <DiseaseTag className="tag-infusion" label="Infusion" />
               <DiseaseTag className="tag-pregnancy" label="Pregnancy" />
               <DiseaseTag className="tag-infection" label="Infection Risk" />
             </CardContent>
           </Card>
         </section>
 
         <Separator />
 
         {/* Status Colors */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Status Colors</h2>
             <p className="text-muted-foreground">Feedback and state indication</p>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">Status Tokens</CardTitle>
               </CardHeader>
               <CardContent className="space-y-1">
                 <ColorSwatch name="Success" variable="--success" description="Completed states" />
                 <ColorSwatch name="Warning" variable="--warning" description="Attention needed" />
                 <ColorSwatch name="Info" variable="--info" description="Informational" />
                 <ColorSwatch name="Destructive" variable="--destructive" description="Errors, deletions" />
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-base">Status Badges</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="flex flex-wrap gap-2">
                   <span className="status-completed px-2.5 py-0.5 rounded-full text-xs font-medium">Completed</span>
                   <span className="status-pending px-2.5 py-0.5 rounded-full text-xs font-medium">Pending</span>
                   <span className="status-overdue px-2.5 py-0.5 rounded-full text-xs font-medium">Overdue</span>
                 </div>
               </CardContent>
             </Card>
           </div>
         </section>
 
         <Separator />
 
         {/* Typography */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Typography</h2>
             <p className="text-muted-foreground">Font family: Inter, system-ui, sans-serif</p>
           </div>
 
           <Card>
             <CardContent className="pt-6 space-y-4">
               <div>
                 <p className="text-xs text-muted-foreground mb-1">H1 - text-4xl font-bold tracking-tight</p>
                 <h1 className="text-4xl font-bold tracking-tight">Heading Level 1</h1>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground mb-1">H2 - text-2xl font-semibold</p>
                 <h2 className="text-2xl font-semibold">Heading Level 2</h2>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground mb-1">H3 - text-xl font-semibold</p>
                 <h3 className="text-xl font-semibold">Heading Level 3</h3>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground mb-1">H4 - text-lg font-medium</p>
                 <h4 className="text-lg font-medium">Heading Level 4</h4>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground mb-1">Body - text-base</p>
                 <p>Regular body text for content and descriptions.</p>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground mb-1">Small - text-sm text-muted-foreground</p>
                 <p className="text-sm text-muted-foreground">Secondary text and captions.</p>
               </div>
             </CardContent>
           </Card>
         </section>
 
         <Separator />
 
         {/* Shadows */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Shadows</h2>
             <p className="text-muted-foreground">Elevation and depth hierarchy</p>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-6 bg-card rounded-lg shadow-soft border">
               <p className="font-medium">shadow-soft</p>
               <p className="text-sm text-muted-foreground">Subtle cards</p>
             </div>
             <div className="p-6 bg-card rounded-lg shadow-medium border">
               <p className="font-medium">shadow-medium</p>
               <p className="text-sm text-muted-foreground">Elevated elements</p>
             </div>
             <div className="p-6 bg-card rounded-lg shadow-elevated border">
               <p className="font-medium">shadow-elevated</p>
               <p className="text-sm text-muted-foreground">Modals, dropdowns</p>
             </div>
           </div>
         </section>
 
         <Separator />
 
         {/* Buttons */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Buttons</h2>
             <p className="text-muted-foreground">Interactive button variants</p>
           </div>
 
           <Card>
             <CardContent className="pt-6 space-y-4">
               <div className="flex flex-wrap gap-3">
                 <Button>Primary</Button>
                 <Button variant="secondary">Secondary</Button>
                 <Button variant="outline">Outline</Button>
                 <Button variant="ghost">Ghost</Button>
                 <Button variant="destructive">Destructive</Button>
                 <Button variant="link">Link</Button>
               </div>
               <div className="flex flex-wrap gap-3">
                 <Button size="sm">Small</Button>
                 <Button size="default">Default</Button>
                 <Button size="lg">Large</Button>
               </div>
             </CardContent>
           </Card>
         </section>
 
         <Separator />
 
         {/* Form Elements */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Form Elements</h2>
             <p className="text-muted-foreground">Input components and form controls</p>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Text Inputs</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="example-input">Label</Label>
                   <Input id="example-input" placeholder="Placeholder text..." />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="example-textarea">Textarea</Label>
                   <Textarea id="example-textarea" placeholder="Enter notes..." />
                 </div>
               </CardContent>
             </Card>
 
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Controls</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center space-x-2">
                   <Switch id="example-switch" />
                   <Label htmlFor="example-switch">Toggle setting</Label>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   <Badge>Default</Badge>
                   <Badge variant="secondary">Secondary</Badge>
                   <Badge variant="outline">Outline</Badge>
                   <Badge variant="destructive">Destructive</Badge>
                 </div>
               </CardContent>
             </Card>
           </div>
         </section>
 
         <Separator />
 
         {/* Alerts */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Alerts</h2>
             <p className="text-muted-foreground">Feedback and notification patterns</p>
           </div>
 
           <div className="space-y-4">
             <Alert>
               <Info className="h-4 w-4" />
               <AlertTitle>Information</AlertTitle>
               <AlertDescription>Default alert for general information.</AlertDescription>
             </Alert>
             <Alert className="border-success/50 bg-success/10">
               <CheckCircle className="h-4 w-4 text-success" />
               <AlertTitle>Success</AlertTitle>
               <AlertDescription>Operation completed successfully.</AlertDescription>
             </Alert>
             <Alert className="border-warning/50 bg-warning/10">
               <AlertTriangle className="h-4 w-4 text-warning" />
               <AlertTitle>Warning</AlertTitle>
               <AlertDescription>Attention required for this item.</AlertDescription>
             </Alert>
             <Alert variant="destructive">
               <AlertCircle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>Something went wrong. Please try again.</AlertDescription>
             </Alert>
           </div>
         </section>
 
         <Separator />
 
         {/* Component Classes */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Utility Classes</h2>
             <p className="text-muted-foreground">Custom component classes defined in index.css</p>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="stat-card">
               <p className="text-sm text-muted-foreground">stat-card</p>
               <p className="text-2xl font-bold">42</p>
               <p className="text-sm">Standard metric display</p>
             </div>
 
             <div className="glass p-6 rounded-lg">
               <p className="text-sm text-muted-foreground">glass</p>
               <p className="font-medium">Glassmorphism effect</p>
             </div>
           </div>
 
           <Card>
             <CardHeader>
               <CardTitle className="text-base">Gradient Text</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="gradient-text text-3xl font-bold">RheumaFlow</p>
               <p className="text-sm text-muted-foreground mt-2">Using gradient-text class</p>
             </CardContent>
           </Card>
         </section>
 
         <Separator />
 
         {/* Spacing Reference */}
         <section className="space-y-6">
           <div>
             <h2 className="text-2xl font-semibold mb-2">Spacing Scale</h2>
             <p className="text-muted-foreground">Tailwind spacing units (base 4px = 1 unit)</p>
           </div>
 
           <Card>
             <CardContent className="pt-6">
               <div className="space-y-3">
                 {[
                   { value: "2", px: "8px", desc: "Tight spacing" },
                   { value: "3", px: "12px", desc: "Compact elements" },
                   { value: "4", px: "16px", desc: "Standard gap" },
                   { value: "6", px: "24px", desc: "Section spacing" },
                   { value: "8", px: "32px", desc: "Large sections" },
                 ].map((item) => (
                   <div key={item.value} className="flex items-center gap-4">
                     <div 
                       className="bg-primary h-4 rounded" 
                       style={{ width: `${parseInt(item.px)}px` }}
                     />
                     <span className="font-mono text-sm w-16">gap-{item.value}</span>
                     <span className="text-sm text-muted-foreground">{item.px} - {item.desc}</span>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </section>
 
         {/* Footer */}
         <div className="text-center py-8 text-muted-foreground text-sm">
           <p>RheumaFlow Design System v1.0</p>
           <p>Medical-Tech Professional Theme</p>
         </div>
       </div>
     </div>
   );
 }
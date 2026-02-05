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
import { Download, FileJson, Copy, Check } from "lucide-react";
import { FileCode } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const CSS_VARIABLES = `/* RheumaFlow Design System - CSS Variables */
/* Generated: ${new Date().toISOString().split('T')[0]} */

:root {
  /* Core Colors */
  --background: 210 20% 98%;
  --foreground: 215 25% 15%;
  --card: 0 0% 100%;
  --card-foreground: 215 25% 15%;
  --popover: 0 0% 100%;
  --popover-foreground: 215 25% 15%;
  --muted: 210 15% 95%;
  --muted-foreground: 215 15% 45%;
  --border: 210 20% 88%;
  --input: 210 20% 88%;
  --ring: 185 65% 35%;

  /* Brand Colors */
  --primary: 185 65% 30%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 15% 93%;
  --secondary-foreground: 215 25% 25%;
  --accent: 185 55% 92%;
  --accent-foreground: 185 65% 25%;

  /* Status Colors */
  --success: 150 60% 40%;
  --warning: 40 90% 50%;
  --info: 200 75% 50%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;

  /* Disease Category Colors */
  --ra: 210 75% 50%;
  --sle: 280 60% 55%;
  --spa: 185 65% 40%;
  --psa: 35 90% 50%;
  --vasculitis: 0 65% 50%;
  --fm: 320 55% 55%;

  /* Sidebar Colors */
  --sidebar-background: 215 25% 15%;
  --sidebar-foreground: 210 20% 90%;
  --sidebar-primary: 185 65% 45%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 215 25% 22%;
  --sidebar-accent-foreground: 210 20% 90%;
  --sidebar-border: 215 25% 25%;
  --sidebar-ring: 185 65% 45%;

  /* Border Radius */
  --radius: 0.5rem;

  /* Shadows */
  --shadow-soft: 0 2px 8px -2px rgba(0, 0, 0, 0.08);
  --shadow-medium: 0 4px 16px -4px rgba(0, 0, 0, 0.1);
  --shadow-elevated: 0 8px 32px -8px rgba(0, 0, 0, 0.12);
}

.dark {
  /* Dark Mode Core Colors */
  --background: 215 30% 10%;
  --foreground: 210 20% 95%;
  --card: 215 30% 14%;
  --card-foreground: 210 20% 95%;
  --popover: 215 30% 14%;
  --popover-foreground: 210 20% 95%;
  --muted: 215 25% 18%;
  --muted-foreground: 215 15% 60%;
  --border: 215 25% 22%;
  --input: 215 25% 22%;
  --ring: 185 60% 45%;

  /* Dark Mode Brand Colors */
  --primary: 185 60% 45%;
  --primary-foreground: 0 0% 100%;
  --secondary: 215 25% 22%;
  --secondary-foreground: 210 20% 90%;
  --accent: 215 30% 20%;
  --accent-foreground: 185 55% 75%;

  /* Status Colors (slightly adjusted for dark mode) */
  --success: 150 55% 45%;
  --warning: 40 85% 55%;
  --info: 200 70% 55%;
  --destructive: 0 65% 55%;
  --destructive-foreground: 0 0% 100%;
}
`;

const DESIGN_TOKENS_JSON = {
  "$schema": "https://design-tokens.org/schema.json",
  "name": "RheumaFlow Design Tokens",
  "version": "1.0.0",
  "color": {
    "core": {
      "background": { "value": "hsl(210, 20%, 98%)", "type": "color" },
      "foreground": { "value": "hsl(215, 25%, 15%)", "type": "color" },
      "card": { "value": "hsl(0, 0%, 100%)", "type": "color" },
      "muted": { "value": "hsl(210, 15%, 95%)", "type": "color" },
      "mutedForeground": { "value": "hsl(215, 15%, 45%)", "type": "color" },
      "border": { "value": "hsl(210, 20%, 88%)", "type": "color" },
      "ring": { "value": "hsl(185, 65%, 35%)", "type": "color" }
    },
    "brand": {
      "primary": { "value": "hsl(185, 65%, 30%)", "type": "color" },
      "primaryForeground": { "value": "hsl(0, 0%, 100%)", "type": "color" },
      "accent": { "value": "hsl(185, 55%, 92%)", "type": "color" },
      "accentForeground": { "value": "hsl(185, 65%, 25%)", "type": "color" },
      "secondary": { "value": "hsl(210, 15%, 93%)", "type": "color" },
      "secondaryForeground": { "value": "hsl(215, 25%, 25%)", "type": "color" }
    },
    "disease": {
      "ra": { "value": "hsl(210, 75%, 50%)", "type": "color", "description": "Rheumatoid Arthritis" },
      "sle": { "value": "hsl(280, 60%, 55%)", "type": "color", "description": "Lupus" },
      "spa": { "value": "hsl(185, 65%, 40%)", "type": "color", "description": "Spondyloarthritis" },
      "psa": { "value": "hsl(35, 90%, 50%)", "type": "color", "description": "Psoriatic Arthritis" },
      "vasculitis": { "value": "hsl(0, 65%, 50%)", "type": "color", "description": "Vasculitis" },
      "fm": { "value": "hsl(320, 55%, 55%)", "type": "color", "description": "Fibromyalgia" }
    },
    "status": {
      "success": { "value": "hsl(150, 60%, 40%)", "type": "color" },
      "warning": { "value": "hsl(40, 90%, 50%)", "type": "color" },
      "info": { "value": "hsl(200, 75%, 50%)", "type": "color" },
      "destructive": { "value": "hsl(0, 72%, 51%)", "type": "color" }
    },
    "sidebar": {
      "background": { "value": "hsl(215, 25%, 15%)", "type": "color" },
      "foreground": { "value": "hsl(210, 20%, 90%)", "type": "color" },
      "primary": { "value": "hsl(185, 65%, 45%)", "type": "color" },
      "accent": { "value": "hsl(215, 25%, 22%)", "type": "color" }
    }
  },
  "spacing": {
    "xs": { "value": "4px", "type": "spacing" },
    "sm": { "value": "8px", "type": "spacing" },
    "md": { "value": "12px", "type": "spacing" },
    "base": { "value": "16px", "type": "spacing" },
    "lg": { "value": "24px", "type": "spacing" },
    "xl": { "value": "32px", "type": "spacing" },
    "2xl": { "value": "48px", "type": "spacing" }
  },
  "borderRadius": {
    "sm": { "value": "4px", "type": "borderRadius" },
    "md": { "value": "6px", "type": "borderRadius" },
    "lg": { "value": "8px", "type": "borderRadius" },
    "full": { "value": "9999px", "type": "borderRadius" }
  },
  "typography": {
    "fontFamily": { "sans": { "value": "Inter, system-ui, sans-serif", "type": "fontFamily" } },
    "fontSize": {
      "xs": { "value": "12px", "type": "fontSize" },
      "sm": { "value": "14px", "type": "fontSize" },
      "base": { "value": "16px", "type": "fontSize" },
      "lg": { "value": "18px", "type": "fontSize" },
      "xl": { "value": "20px", "type": "fontSize" },
      "2xl": { "value": "24px", "type": "fontSize" },
      "4xl": { "value": "36px", "type": "fontSize" }
    },
    "fontWeight": {
      "normal": { "value": "400", "type": "fontWeight" },
      "medium": { "value": "500", "type": "fontWeight" },
      "semibold": { "value": "600", "type": "fontWeight" },
      "bold": { "value": "700", "type": "fontWeight" }
    }
  },
  "shadow": {
    "soft": { "value": "0 2px 8px -2px rgba(0, 0, 0, 0.08)", "type": "boxShadow" },
    "medium": { "value": "0 4px 16px -4px rgba(0, 0, 0, 0.1)", "type": "boxShadow" },
    "elevated": { "value": "0 8px 32px -8px rgba(0, 0, 0, 0.12)", "type": "boxShadow" }
  }
};

const STYLE_GUIDE_MARKDOWN = `# RheumaFlow Design System

**Version 1.0** | Medical-Tech Professional Theme

---

## Color Palette (HSL)

### Core Colors
| Token | HSL Value | Usage |
|-------|-----------|-------|
| --background | 210 20% 98% | Page backgrounds |
| --foreground | 215 25% 15% | Primary text |
| --primary | 185 65% 30% | Main brand (Deep Teal) |
| --accent | 185 55% 92% | Highlights (Soft Cyan) |
| --muted | 210 15% 95% | Subtle backgrounds |
| --muted-foreground | 215 15% 45% | Secondary text |

### Disease Category Colors
| Disease | Token | HSL Value |
|---------|-------|-----------|
| RA | --ra | 210 75% 50% (Blue) |
| SLE | --sle | 280 60% 55% (Purple) |
| SpA | --spa | 185 65% 40% (Teal) |
| PsA | --psa | 35 90% 50% (Amber) |
| Vasculitis | --vasculitis | 0 65% 50% (Rose) |
| FM | --fm | 320 55% 55% (Pink) |

### Status Colors
| Status | Token | HSL Value |
|--------|-------|-----------|
| Success | --success | 150 60% 40% |
| Warning | --warning | 40 90% 50% |
| Info | --info | 200 75% 50% |
| Destructive | --destructive | 0 72% 51% |

---

## Typography

**Font Family:** Inter, system-ui, sans-serif

| Element | Classes |
|---------|---------|
| H1 | text-4xl font-bold tracking-tight |
| H2 | text-2xl font-semibold |
| H3 | text-xl font-semibold |
| H4 | text-lg font-medium |
| Body | text-base |
| Small | text-sm text-muted-foreground |

---

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| gap-2 | 8px | Tight spacing |
| gap-3 | 12px | Compact elements |
| gap-4 | 16px | Standard gap |
| gap-6 | 24px | Section spacing |
| gap-8 | 32px | Large sections |

---

## Shadows

| Class | Usage |
|-------|-------|
| shadow-soft | Subtle cards |
| shadow-medium | Elevated elements |
| shadow-elevated | Modals, dropdowns |

---

## Component Classes

- \`.stat-card\` - Standard metric display
- \`.glass\` - Glassmorphism effect
- \`.gradient-text\` - Primary gradient on text
- \`.tag-ra\`, \`.tag-sle\`, etc. - Disease category tags
- \`.status-completed\`, \`.status-pending\`, \`.status-overdue\` - Status badges

---

## Button Variants

| Variant | Usage |
|---------|-------|
| Primary | Main actions |
| Secondary | Alternate actions |
| Outline | Tertiary actions |
| Ghost | Subtle actions |
| Destructive | Delete, cancel |
| Link | Inline links |

---

*RheumaFlow Design System v1.0*
*Generated: ${new Date().toLocaleDateString()}*
`;
 
const CopyButton = ({ value, label }: { value: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Copied ${label || value}`);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? "Copied!" : `Copy ${label || value}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ColorSwatch = ({ name, variable, description }: { name: string; variable: string; description?: string }) => (
  <div className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
    <div 
      className="w-12 h-12 rounded-lg border shadow-sm flex-shrink-0" 
      style={{ backgroundColor: `hsl(var(${variable}))` }}
    />
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm">{name}</p>
      <p className="text-xs text-muted-foreground font-mono">{variable}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <CopyButton value={variable} label="CSS variable" />
  </div>
);
 
const DiseaseTag = ({ className, label }: { className: string; label: string }) => (
  <div className="group inline-flex items-center gap-1">
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {label}
    </span>
    <CopyButton value={className} label="class" />
  </div>
);

const SpacingRow = ({ value, px, desc }: { value: string; px: string; desc: string }) => (
  <div className="group flex items-center gap-4 p-1 rounded-md hover:bg-muted/50 transition-colors">
    <div 
      className="bg-primary h-4 rounded" 
      style={{ width: `${parseInt(px)}px` }}
    />
    <span className="font-mono text-sm w-16">gap-{value}</span>
    <span className="text-sm text-muted-foreground flex-1">{px} - {desc}</span>
    <CopyButton value={`gap-${value}`} label="class" />
  </div>
);

const ShadowCard = ({ name, description }: { name: string; description: string }) => (
  <div className={`group relative p-6 bg-card rounded-lg ${name} border`}>
    <p className="font-medium">{name}</p>
    <p className="text-sm text-muted-foreground">{description}</p>
    <div className="absolute top-2 right-2">
      <CopyButton value={name} label="class" />
    </div>
  </div>
);
 
 export default function StyleGuide() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const handleExport = () => {
    const blob = new Blob([STYLE_GUIDE_MARKDOWN], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "RheumaFlow-Style-Guide.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Style guide exported successfully");
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(DESIGN_TOKENS_JSON, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "design-tokens.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Design tokens JSON exported for Figma");
  };

  const handleExportCSS = () => {
    const blob = new Blob([CSS_VARIABLES], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rheumaflow-tokens.css";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSS variables exported for developers");
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 ml-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON} className="gap-2">
                  <FileJson className="h-4 w-4" />
                  Design Tokens (.json)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSS} className="gap-2">
                  <FileCode className="h-4 w-4" />
                  CSS Variables (.css)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
             <ShadowCard name="shadow-soft" description="Subtle cards" />
             <ShadowCard name="shadow-medium" description="Elevated elements" />
             <ShadowCard name="shadow-elevated" description="Modals, dropdowns" />
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
                  <SpacingRow value="2" px="8px" desc="Tight spacing" />
                  <SpacingRow value="3" px="12px" desc="Compact elements" />
                  <SpacingRow value="4" px="16px" desc="Standard gap" />
                  <SpacingRow value="6" px="24px" desc="Section spacing" />
                  <SpacingRow value="8" px="32px" desc="Large sections" />
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
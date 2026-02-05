 # RheumaFlow Design System
 
 **Version 1.0** | Medical-Tech Professional Theme
 
 ---
 
 ## Table of Contents
 
 1. [Design Philosophy](#design-philosophy)
 2. [Color Palette](#color-palette)
 3. [Disease Category Colors](#disease-category-colors)
 4. [Risk & Therapy Tags](#risk--therapy-tags)
 5. [Status Colors](#status-colors)
 6. [Typography](#typography)
 7. [Spacing Scale](#spacing-scale)
 8. [Shadows & Elevation](#shadows--elevation)
 9. [Component Classes](#component-classes)
 10. [Button Variants](#button-variants)
 11. [Form Elements](#form-elements)
 12. [Alerts & Feedback](#alerts--feedback)
 13. [Usage Guidelines](#usage-guidelines)
 
 ---
 
 ## Design Philosophy
 
 RheumaFlow follows a **medical-tech professional aesthetic** with:
 
 - Clean, high-contrast, minimal UI
 - Deep teal primary color palette
 - Clear visual hierarchy for clinical data
 - Accessible color combinations
 - Consistent spacing and alignment
 
 ---
 
 ## Color Palette
 
 All colors use HSL format for consistency and easy theming.
 
 ### Core Colors
 
 | Token | HSL Value | Hex Approx. | Usage |
 |-------|-----------|-------------|-------|
 | `--background` | 210 20% 98% | #f8f9fa | Page backgrounds |
 | `--foreground` | 215 25% 15% | #1e2a3a | Primary text |
 | `--card` | 0 0% 100% | #ffffff | Card surfaces |
 | `--card-foreground` | 215 25% 15% | #1e2a3a | Card text |
 | `--muted` | 210 15% 95% | #f0f2f4 | Subtle backgrounds |
 | `--muted-foreground` | 215 15% 45% | #64748b | Secondary text |
 
 ### Brand Colors
 
 | Token | HSL Value | Hex Approx. | Usage |
 |-------|-----------|-------------|-------|
 | `--primary` | 185 65% 30% | #1a7a7a | Main brand (Deep Teal) |
 | `--primary-foreground` | 0 0% 100% | #ffffff | Text on primary |
 | `--accent` | 185 55% 92% | #e0f4f4 | Highlights (Soft Cyan) |
 | `--accent-foreground` | 185 65% 25% | #156666 | Text on accent |
 | `--secondary` | 210 15% 93% | #e8ebee | Secondary actions |
 | `--secondary-foreground` | 215 25% 25% | #2d3a4d | Text on secondary |
 
 ### Utility Colors
 
 | Token | HSL Value | Usage |
 |-------|-----------|-------|
 | `--border` | 210 20% 88% | Borders and dividers |
 | `--input` | 210 20% 88% | Input borders |
 | `--ring` | 185 65% 35% | Focus rings |
 | `--destructive` | 0 72% 51% | Errors, deletions |
 | `--destructive-foreground` | 0 0% 100% | Text on destructive |
 
 ### Sidebar Colors
 
 | Token | HSL Value | Usage |
 |-------|-----------|-------|
 | `--sidebar-background` | 215 25% 15% | Sidebar background |
 | `--sidebar-foreground` | 210 20% 90% | Sidebar text |
 | `--sidebar-primary` | 185 65% 45% | Active items |
 | `--sidebar-accent` | 215 25% 22% | Hover states |
 | `--sidebar-border` | 215 25% 25% | Sidebar dividers |
 
 ---
 
 ## Disease Category Colors
 
 Color-coded system for rheumatologic conditions. Each disease has a distinct hue for quick visual identification.
 
 | Disease | Abbreviation | HSL Value | CSS Class |
 |---------|--------------|-----------|-----------|
 | Rheumatoid Arthritis | RA | 210 75% 50% | `.tag-ra` |
 | Systemic Lupus Erythematosus | SLE | 280 60% 55% | `.tag-sle` |
 | Spondyloarthritis | SpA | 185 65% 40% | `.tag-spa` |
 | Psoriatic Arthritis | PsA | 35 90% 50% | `.tag-psa` |
 | Vasculitis | - | 0 65% 50% | `.tag-vasculitis` |
 | Fibromyalgia | FM | 320 55% 55% | `.tag-fm` |
 
 ### Tag Styling
 
 ```css
 .tag-{disease} {
   background: hsl({hue} {sat}% 95%);
   color: hsl({hue} {sat}% 35%);
   border: 1px solid hsl({hue} {sat}% 85%);
   padding: 0.125rem 0.625rem;
   border-radius: 9999px;
   font-size: 0.75rem;
   font-weight: 500;
 }
 ```
 
 ---
 
 ## Risk & Therapy Tags
 
 Additional tags for treatment and risk factor identification.
 
 | Tag | HSL Base | CSS Class | Usage |
 |-----|----------|-----------|-------|
 | Biologic | 150 60% | `.tag-biologic` | Biologic therapy |
 | Infusion | 200 75% | `.tag-infusion` | IV infusion treatment |
 | Pregnancy | 340 70% | `.tag-pregnancy` | Pregnancy status/risk |
 | Infection | 25 85% | `.tag-infection` | Infection risk |
 
 ---
 
 ## Status Colors
 
 Semantic colors for feedback and state indication.
 
 | Status | HSL Value | CSS Token | CSS Class |
 |--------|-----------|-----------|-----------|
 | Success | 150 60% 40% | `--success` | `.status-completed` |
 | Warning | 40 90% 50% | `--warning` | `.status-pending` |
 | Info | 200 75% 50% | `--info` | - |
 | Error | 0 72% 51% | `--destructive` | `.status-overdue` |
 
 ### Status Badge Styling
 
 ```css
 .status-completed {
   background: hsl(150 60% 92%);
   color: hsl(150 60% 30%);
 }
 
 .status-pending {
   background: hsl(40 90% 92%);
   color: hsl(40 90% 35%);
 }
 
 .status-overdue {
   background: hsl(0 72% 95%);
   color: hsl(0 72% 45%);
 }
 ```
 
 ---
 
 ## Typography
 
 ### Font Stack
 
 ```css
 font-family: "Inter", system-ui, sans-serif;
 font-feature-settings: "cv02", "cv03", "cv04", "cv11";
 ```
 
 ### Type Scale
 
 | Element | Tailwind Classes | Size |
 |---------|------------------|------|
 | H1 | `text-4xl font-bold tracking-tight` | 36px |
 | H2 | `text-2xl font-semibold tracking-tight` | 24px |
 | H3 | `text-xl font-semibold` | 20px |
 | H4 | `text-lg font-medium` | 18px |
 | Body | `text-base` | 16px |
 | Small | `text-sm` | 14px |
 | Caption | `text-xs` | 12px |
 
 ### Text Colors
 
 | Usage | Tailwind Class |
 |-------|---------------|
 | Primary text | `text-foreground` |
 | Secondary text | `text-muted-foreground` |
 | Links | `text-primary` |
 | Error text | `text-destructive` |
 | Success text | `text-success` |
 
 ---
 
 ## Spacing Scale
 
 Based on Tailwind's default 4px unit system.
 
 | Token | Value | Common Usage |
 |-------|-------|--------------|
 | `1` | 4px | Tight inline spacing |
 | `2` | 8px | Icon gaps, tight padding |
 | `3` | 12px | Compact elements |
 | `4` | 16px | Standard gap, card padding |
 | `6` | 24px | Section spacing |
 | `8` | 32px | Large section gaps |
 | `12` | 48px | Page sections |
 | `16` | 64px | Major layout breaks |
 
 ### Common Patterns
 
 ```css
 /* Card padding */
 padding: 1.5rem; /* p-6 */
 
 /* Form field gaps */
 gap: 1rem; /* gap-4 */
 
 /* Section margins */
 margin-bottom: 2rem; /* mb-8 */
 
 /* Inline icon spacing */
 margin-right: 0.5rem; /* mr-2 */
 ```
 
 ---
 
 ## Shadows & Elevation
 
 Three-tier elevation system for visual hierarchy.
 
 | Level | Class | Box Shadow | Usage |
 |-------|-------|------------|-------|
 | 1 | `shadow-soft` | `0 2px 8px -2px rgba(0,0,0,0.08)` | Cards, list items |
 | 2 | `shadow-medium` | `0 4px 16px -4px rgba(0,0,0,0.1)` | Hover states, popovers |
 | 3 | `shadow-elevated` | `0 8px 32px -8px rgba(0,0,0,0.12)` | Modals, dropdowns |
 
 ---
 
 ## Component Classes
 
 ### Stat Card
 
 ```css
 .stat-card {
   background: hsl(var(--card));
   border: 1px solid hsl(var(--border));
   border-radius: 0.5rem;
   padding: 1rem;
   box-shadow: var(--shadow-soft);
   transition: box-shadow 0.2s;
 }
 
 .stat-card:hover {
   box-shadow: var(--shadow-medium);
 }
 ```
 
 ### Glass Morphism
 
 ```css
 .glass {
   background: rgba(255, 255, 255, 0.8);
   backdrop-filter: blur(16px);
   border: 1px solid rgba(255, 255, 255, 0.2);
 }
 ```
 
 ### Gradient Text
 
 ```css
 .gradient-text {
   background: linear-gradient(135deg, hsl(185 65% 30%), hsl(185 75% 40%));
   -webkit-background-clip: text;
   -webkit-text-fill-color: transparent;
   background-clip: text;
 }
 ```
 
 ### Focus Ring
 
 ```css
 .focus-ring:focus {
   outline: none;
   box-shadow: 0 0 0 2px hsl(var(--ring)), 0 0 0 4px hsl(var(--background));
 }
 ```
 
 ---
 
 ## Button Variants
 
 | Variant | Background | Text | Border | Usage |
 |---------|------------|------|--------|-------|
 | Primary | `--primary` | `--primary-foreground` | none | Main actions |
 | Secondary | `--secondary` | `--secondary-foreground` | none | Alternate actions |
 | Outline | transparent | `--foreground` | `--border` | Tertiary actions |
 | Ghost | transparent | `--foreground` | none | Subtle actions |
 | Destructive | `--destructive` | `--destructive-foreground` | none | Delete, cancel |
 | Link | transparent | `--primary` | none | Inline links |
 
 ### Sizes
 
 | Size | Height | Padding | Font Size |
 |------|--------|---------|-----------|
 | sm | 32px | 12px 16px | 14px |
 | default | 40px | 16px 24px | 14px |
 | lg | 48px | 24px 32px | 16px |
 
 ---
 
 ## Form Elements
 
 ### Input Fields
 
 ```css
 input, textarea {
   height: 40px; /* textarea: auto */
   padding: 8px 12px;
   border: 1px solid hsl(var(--input));
   border-radius: calc(var(--radius) - 2px);
   background: transparent;
   font-size: 14px;
 }
 
 input:focus {
   border-color: hsl(var(--ring));
   outline: none;
   box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
 }
 ```
 
 ### Labels
 
 ```css
 label {
   font-size: 14px;
   font-weight: 500;
   color: hsl(var(--foreground));
 }
 ```
 
 ---
 
 ## Alerts & Feedback
 
 | Type | Border Color | Background | Icon |
 |------|--------------|------------|------|
 | Info | `--border` | `--card` | Info |
 | Success | `--success/50` | `--success/10` | CheckCircle |
 | Warning | `--warning/50` | `--warning/10` | AlertTriangle |
 | Error | `--destructive` | `--destructive/10` | AlertCircle |
 
 ---
 
 ## Usage Guidelines
 
 ### Do's ✅
 
 - Use semantic color tokens (`bg-background`, `text-foreground`)
 - Apply disease colors via tag classes (`.tag-ra`, `.tag-sle`)
 - Maintain consistent spacing using Tailwind scale
 - Use appropriate shadow levels for elevation
 - Ensure sufficient color contrast for accessibility
 
 ### Don'ts ❌
 
 - Don't use hardcoded colors (`bg-white`, `text-gray-900`)
 - Don't create custom color values outside the system
 - Don't mix spacing systems (px with rem inconsistently)
 - Don't apply shadows without clear hierarchy purpose
 - Don't use low-contrast color combinations
 
 ### Accessibility
 
 - All text meets WCAG 2.1 AA contrast requirements
 - Focus states are clearly visible
 - Color is not the only means of conveying information
 - Interactive elements have minimum 44x44px touch targets
 
 ---
 
 ## Dark Mode
 
 The design system includes full dark mode support. Colors automatically adjust via CSS custom properties when `.dark` class is applied to the root element.
 
 | Token | Light Mode | Dark Mode |
 |-------|------------|-----------|
 | `--background` | 210 20% 98% | 215 30% 10% |
 | `--foreground` | 215 25% 15% | 210 20% 95% |
 | `--primary` | 185 65% 30% | 185 60% 45% |
 | `--card` | 0 0% 100% | 215 30% 14% |
 | `--muted` | 210 15% 95% | 215 25% 18% |
 
 ---
 
 ## File References
 
 - CSS Variables: `src/index.css`
 - Tailwind Config: `tailwind.config.ts`
 - UI Components: `src/components/ui/`
 - Style Guide Page: `src/pages/StyleGuide.tsx`
 
 ---
 
 *RheumaFlow Design System v1.0*  
 *Last Updated: February 2025*
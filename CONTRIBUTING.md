 # Contributing to RheumaFlow
 
 RheumaFlow is a specialized workflow application for rheumatologists to manage outpatient clinic flows, including follow-up tracking, safety monitoring, and clinical documentation.
 
 ## Table of Contents
 
 - [Project Overview](#project-overview)
 - [Tech Stack](#tech-stack)
 - [Development Setup](#development-setup)
 - [Code Conventions](#code-conventions)
 - [Design System](#design-system)
 - [Database Patterns](#database-patterns)
 - [API Integration](#api-integration)
 - [Clinical Terminology](#clinical-terminology)
 - [Privacy & De-identification](#privacy--de-identification)
 
 ---
 
 ## Project Overview
 
 RheumaFlow helps rheumatologists manage:
 - **Patient Cards**: De-identified patient records with diagnosis/therapy tags
 - **Visit Documentation**: Clinical notes with file attachments
 - **Disease Activity Scores**: DAS28, CDAI, SLEDAI, BASDAI calculators
 - **Safety Monitoring**: Lab/screening tracking for high-risk medications
 - **Infusion Coordination**: Drug intervals and pre-infusion checklists
 - **Productivity Tools**: Tasks, shifts, and focus sessions
 
 ---
 
 ## Tech Stack
 
 | Layer | Technology |
 |-------|------------|
 | Framework | React 18 + TypeScript |
 | Build Tool | Vite |
 | Styling | Tailwind CSS + shadcn/ui |
 | State Management | TanStack React Query |
 | Routing | React Router v6 |
 | Backend | Supabase (Lovable Cloud) |
 | Forms | React Hook Form + Zod |
 | Rich Text | TipTap |
 | Charts | Recharts |
 
 ---
 
 ## Development Setup
 
 ```bash
 # Clone repository
 git clone <repository-url>
 cd rheumaflow
 
 # Install dependencies
 npm install
 
 # Start development server
 npm run dev
 ```
 
 Environment variables are managed through Lovable Cloud and `.env` file.
 
 ---
 
 ## Code Conventions
 
 ### File Structure
 
 ```
 src/
 ├── components/
 │   ├── ui/          # shadcn/ui primitives
 │   ├── patients/    # Patient-related components
 │   ├── scores/      # Disease activity calculators
 │   └── layout/      # App layout components
 ├── pages/           # Route pages (PascalCase)
 ├── hooks/           # Custom hooks (use* prefix)
 ├── contexts/        # React contexts
 ├── lib/             # Utility functions
 └── integrations/    # External service clients
 ```
 
 ### Component Guidelines
 
 - Keep components under 200 lines; extract logic into custom hooks
 - Use TypeScript interfaces for all props
 - Prefer named exports for components
 - Use semantic HTML elements
 
 ```tsx
 // ✅ Good
 interface PatientCardProps {
   patient: Patient;
   onEdit: (id: string) => void;
 }
 
 export function PatientCard({ patient, onEdit }: PatientCardProps) {
   // ...
 }
 ```
 
 ### Styling Rules
 
 - **ALWAYS** use semantic tokens from `index.css`
 - **NEVER** use hardcoded colors in components
 - Use Tailwind's spacing scale consistently
 
 ```tsx
 // ✅ Good - semantic tokens
 <div className="bg-background text-foreground border-border">
 
 // ❌ Bad - hardcoded colors
 <div className="bg-white text-gray-900 border-gray-200">
 ```
 
 ---
 
 ## Design System
 
 ### Color Palette (HSL)
 
 | Token | Value | Usage |
 |-------|-------|-------|
 | `--primary` | 185 65% 30% | Deep Teal - main brand |
 | `--accent` | 185 55% 92% | Soft Cyan - highlights |
 | `--background` | 210 20% 98% | Page backgrounds |
 | `--foreground` | 215 25% 15% | Primary text |
 | `--muted-foreground` | 215 15% 45% | Secondary text |
 
 ### Disease Category Colors
 
 | Disease | Token | Color |
 |---------|-------|-------|
 | RA | `--ra` | Blue (210 75% 50%) |
 | SLE | `--sle` | Purple (280 60% 55%) |
 | SpA | `--spa` | Teal (185 65% 40%) |
 | PsA | `--psa` | Amber (35 90% 50%) |
 | Vasculitis | `--vasculitis` | Rose (0 65% 50%) |
 | FM | `--fm` | Pink (320 55% 55%) |
 
 ### Tag Classes
 
 ```css
 /* Disease tags */
 .tag-ra, .tag-sle, .tag-spa, .tag-psa, .tag-vasculitis, .tag-fm
 
 /* Risk/therapy tags */
 .tag-biologic, .tag-infusion, .tag-pregnancy, .tag-infection
 
 /* Status badges */
 .status-pending, .status-overdue, .status-completed
 ```
 
 ### Typography
 
 - Font: Inter, system-ui, sans-serif
 - Headings: `font-semibold tracking-tight`
 - Body: `text-base`
 - Secondary: `text-sm text-muted-foreground`
 
 ### Shadows
 
 | Class | Usage |
 |-------|-------|
 | `shadow-soft` | Subtle cards |
 | `shadow-medium` | Elevated elements |
 | `shadow-elevated` | Modals, dropdowns |
 
 ---
 
 ## Database Patterns
 
 ### Supabase Client
 
 ```typescript
 // Always import from preconfigured client
 import { supabase } from "@/integrations/supabase/client";
 
 // NEVER create new clients or edit client.ts
 ```
 
 ### Type Safety
 
 ```typescript
 import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
 
 type Patient = Tables<'patient_cards'>;
 type PatientInsert = TablesInsert<'patient_cards'>;
 ```
 
 ### Query Patterns
 
 ```typescript
 // Basic query with React Query
 const { data, isLoading } = useQuery({
   queryKey: ['patients', userId],
   queryFn: async () => {
     const { data, error } = await supabase
       .from('patient_cards')
       .select('*')
       .order('created_at', { ascending: false });
     if (error) throw error;
     return data;
   },
   enabled: !!userId,
 });
 ```
 
 ### RLS Requirements
 
 All tables use Row-Level Security. Always include `user_id` on insert:
 
 ```typescript
 await supabase.from('patient_cards').insert({
   patient_code: 'ABC123',
   user_id: user.id,  // Required for RLS
 });
 ```
 
 ### Table Relationships
 
 ```
 patient_cards (1) ─────┬───── (*) visits
                        ├───── (*) score_entries
                        ├───── (*) monitoring_events
                        └───── (*) infusion_events
 ```
 
 ---
 
 ## API Integration
 
 ### Edge Functions
 
 Location: `supabase/functions/{name}/index.ts`
 
 Required CORS headers:
 ```typescript
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 ```
 
 Config (`supabase/config.toml`):
 ```toml
 [functions.my-function]
 verify_jwt = false  # Validate in code
 ```
 
 ### Calling Edge Functions
 
 ```typescript
 const { data, error } = await supabase.functions.invoke('function-name', {
   body: { patientId, scoreType },
 });
 ```
 
 ### Error Handling
 
 ```typescript
 const { data, error } = await supabase.from('table').select();
 if (error) {
   console.error('Database error:', error);
   toast.error('Failed to load data');
   return;
 }
 ```
 
 ---
 
 ## Clinical Terminology
 
 ### Disease Activity Scores
 
 | Score | Disease | Formula | Remission Threshold |
 |-------|---------|---------|---------------------|
 | DAS28-ESR | RA | 0.56×√TJC + 0.28×√SJC + 0.70×ln(ESR) + 0.014×PtGlobal | < 2.6 |
 | CDAI | RA | TJC + SJC + PtGlobal + PhGlobal | ≤ 2.8 |
 | SLEDAI-2K | SLE | Weighted checklist (0-105) | 0 |
 | BASDAI | SpA | [(Q1+Q2+Q3+Q4)/4 + (Q5+Q6)/2] / 2 | < 4 |
 
 ### Score Thresholds
 
 **DAS28-ESR:**
 - Remission: < 2.6
 - Low: ≤ 3.2
 - Moderate: ≤ 5.1
 - High: > 5.1
 
 **CDAI:**
 - Remission: ≤ 2.8
 - Low: ≤ 10
 - Moderate: ≤ 22
 - High: > 22
 
 **SLEDAI-2K:**
 - No Activity: 0
 - Mild: 1-5
 - Moderate: 6-10
 - High: 11-20
 - Very High: > 20
 
 **BASDAI:**
 - Low: < 4
 - High: ≥ 4
 
 ### Medication Classes
 
 | Abbreviation | Full Name | Examples |
 |--------------|-----------|----------|
 | csDMARDs | Conventional synthetic DMARDs | MTX, Leflunomide, SSZ, HCQ |
 | bDMARDs | Biologic DMARDs | TNFi, IL-6i, Rituximab |
 | tsDMARDs | Targeted synthetic DMARDs | JAK inhibitors |
 
 ### Lab Abbreviations
 
 - CBC: Complete Blood Count
 - CMP/LFT: Liver Function Tests
 - ESR: Erythrocyte Sedimentation Rate
 - CRP: C-Reactive Protein
 - RF: Rheumatoid Factor
 - Anti-CCP: Anti-Cyclic Citrullinated Peptide
 - ANA: Antinuclear Antibody
 
 ---
 
 ## Privacy & De-identification
 
 ### Prohibited Data
 
 **NEVER** store or collect:
 - Patient names
 - CPF/SSN or national IDs
 - Phone numbers
 - Physical addresses
 - Email addresses
 - Photos of patients
 
 ### Allowed Identifiers
 
 | Field | Description |
 |-------|-------------|
 | `patient_code` | User-defined alphanumeric code |
 | `mrn_last4` | Last 4 digits of clinic MRN |
 
 ### UI Requirements
 
 - Label identifier fields as "de-identified" or "non-identifying"
 - Display medical disclaimer on landing and registration screens
 - Never suggest collecting additional patient identifiers
 
 ---
 
 ## Clinical References
 
 - [ACR Clinical Practice Guidelines](https://rheumatology.org/clinical-practice-guidelines)
 - [EULAR Recommendations](https://www.eular.org/recommendations-management)
 - [OARSI Guidelines](https://oarsi.org/education/oarsi-guidelines)
 
 ---
 
 ## Questions?
 
 For questions about contributing, please open an issue in the repository.
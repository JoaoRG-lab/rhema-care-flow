-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  specialty TEXT DEFAULT 'Rheumatology',
  institution TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient_cards table (de-identified)
CREATE TABLE public.patient_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_code TEXT NOT NULL,
  mrn_last4 TEXT,
  diagnosis_tags TEXT[] DEFAULT '{}',
  therapy_tags TEXT[] DEFAULT '{}',
  risk_flags TEXT[] DEFAULT '{}',
  last_visit_date DATE,
  next_followup_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_card_id UUID REFERENCES public.patient_cards(id) ON DELETE CASCADE NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  disease_activity JSONB,
  actions TEXT[] DEFAULT '{}',
  labs_ordered TEXT[] DEFAULT '{}',
  imaging TEXT[] DEFAULT '{}',
  next_steps TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create score_entries table for disease activity scores
CREATE TABLE public.score_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE,
  patient_card_id UUID REFERENCES public.patient_cards(id) ON DELETE CASCADE,
  score_type TEXT NOT NULL,
  data_json JSONB NOT NULL,
  calculated_score DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monitoring_plans table
CREATE TABLE public.monitoring_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  med_class TEXT NOT NULL,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monitoring_events table
CREATE TABLE public.monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_card_id UUID REFERENCES public.patient_cards(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create infusion_events table
CREATE TABLE public.infusion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_card_id UUID REFERENCES public.patient_cards(id) ON DELETE CASCADE,
  drug TEXT NOT NULL,
  interval_days INTEGER NOT NULL,
  next_date DATE NOT NULL,
  pre_checklist JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table for productivity
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'clinic',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shifts table
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL,
  location TEXT,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create focus_sessions table
CREATE TABLE public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  task_category TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infusion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for patient_cards
CREATE POLICY "Users can view own patient cards" ON public.patient_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patient cards" ON public.patient_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patient cards" ON public.patient_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patient cards" ON public.patient_cards FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for visits
CREATE POLICY "Users can view own visits" ON public.visits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own visits" ON public.visits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own visits" ON public.visits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own visits" ON public.visits FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for score_entries
CREATE POLICY "Users can view own scores" ON public.score_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON public.score_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON public.score_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON public.score_entries FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for monitoring_plans
CREATE POLICY "Users can view own monitoring plans" ON public.monitoring_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monitoring plans" ON public.monitoring_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monitoring plans" ON public.monitoring_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monitoring plans" ON public.monitoring_plans FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for monitoring_events
CREATE POLICY "Users can view own monitoring events" ON public.monitoring_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monitoring events" ON public.monitoring_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own monitoring events" ON public.monitoring_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own monitoring events" ON public.monitoring_events FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for infusion_events
CREATE POLICY "Users can view own infusion events" ON public.infusion_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own infusion events" ON public.infusion_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own infusion events" ON public.infusion_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own infusion events" ON public.infusion_events FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shifts
CREATE POLICY "Users can view own shifts" ON public.shifts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shifts" ON public.shifts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shifts" ON public.shifts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shifts" ON public.shifts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for focus_sessions
CREATE POLICY "Users can view own focus sessions" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own focus sessions" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patient_cards_updated_at BEFORE UPDATE ON public.patient_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_monitoring_plans_updated_at BEFORE UPDATE ON public.monitoring_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_infusion_events_updated_at BEFORE UPDATE ON public.infusion_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
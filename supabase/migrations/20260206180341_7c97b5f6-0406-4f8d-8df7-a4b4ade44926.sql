-- Add "ultimate" to the verification tier enum
ALTER TYPE verification_tier ADD VALUE IF NOT EXISTS 'ultimate';

-- Create outreach campaigns table
CREATE TABLE public.outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'general', -- university, investor, association, entrepreneur, college
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL, -- HTML content with placeholders
  sender_name TEXT NOT NULL DEFAULT 'Novus Oriens',
  sender_email TEXT NOT NULL DEFAULT 'orienta@novusoriens.org',
  target_audience JSONB DEFAULT '[]'::jsonb, -- Array of audience tags
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create outreach contacts table
CREATE TABLE public.outreach_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  organization TEXT,
  organization_type TEXT, -- university, association, college, investor, entrepreneur
  position TEXT,
  country TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, unsubscribed, bounced
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Create campaign sends tracking table
CREATE TABLE public.outreach_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES outreach_contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, delivered, opened, clicked, bounced, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  resend_message_id TEXT, -- Resend API message ID for tracking
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

-- Create email templates table for reusable templates
CREATE TABLE public.outreach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'general', -- university, investor, association, entrepreneur, college
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- HTML with placeholders like {{name}}, {{organization}}
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for outreach_campaigns
CREATE POLICY "Require authentication for outreach_campaigns"
  ON public.outreach_campaigns
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own campaigns"
  ON public.outreach_campaigns
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all campaigns"
  ON public.outreach_campaigns
  FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for outreach_contacts
CREATE POLICY "Require authentication for outreach_contacts"
  ON public.outreach_contacts
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own contacts"
  ON public.outreach_contacts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all contacts"
  ON public.outreach_contacts
  FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for outreach_sends
CREATE POLICY "Require authentication for outreach_sends"
  ON public.outreach_sends
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view sends for own campaigns"
  ON public.outreach_sends
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns c 
      WHERE c.id = outreach_sends.campaign_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage sends for own campaigns"
  ON public.outreach_sends
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns c 
      WHERE c.id = outreach_sends.campaign_id 
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outreach_campaigns c 
      WHERE c.id = outreach_sends.campaign_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all sends"
  ON public.outreach_sends
  FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for outreach_templates
CREATE POLICY "Require authentication for outreach_templates"
  ON public.outreach_templates
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own templates"
  ON public.outreach_templates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all templates"
  ON public.outreach_templates
  FOR ALL
  USING (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_outreach_campaigns_updated_at
  BEFORE UPDATE ON public.outreach_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outreach_contacts_updated_at
  BEFORE UPDATE ON public.outreach_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outreach_templates_updated_at
  BEFORE UPDATE ON public.outreach_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_outreach_campaigns_user_id ON public.outreach_campaigns(user_id);
CREATE INDEX idx_outreach_campaigns_status ON public.outreach_campaigns(status);
CREATE INDEX idx_outreach_contacts_user_id ON public.outreach_contacts(user_id);
CREATE INDEX idx_outreach_contacts_organization_type ON public.outreach_contacts(organization_type);
CREATE INDEX idx_outreach_sends_campaign_id ON public.outreach_sends(campaign_id);
CREATE INDEX idx_outreach_sends_status ON public.outreach_sends(status);
CREATE INDEX idx_outreach_templates_user_id ON public.outreach_templates(user_id);
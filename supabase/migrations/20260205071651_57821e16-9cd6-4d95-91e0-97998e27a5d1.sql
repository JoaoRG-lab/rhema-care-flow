-- Create rate_limits table for tracking API usage per user
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint, window_start)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Require authentication for all operations
CREATE POLICY "Require authentication for rate_limits"
ON public.rate_limits
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only see their own rate limit records
CREATE POLICY "Users can view own rate limits"
ON public.rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own rate limit records
CREATE POLICY "Users can insert own rate limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own rate limit records
CREATE POLICY "Users can update own rate limits"
ON public.rate_limits
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to check and increment rate limit
-- Returns true if request is allowed, false if rate limited
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests integer DEFAULT 20,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamp with time zone;
  v_current_count integer;
BEGIN
  -- Calculate window start (truncate to the minute boundary)
  v_window_start := date_trunc('hour', now()) + 
    (floor(extract(minute from now()) / p_window_minutes) * p_window_minutes || ' minutes')::interval;
  
  -- Try to get existing count for this window
  SELECT request_count INTO v_current_count
  FROM public.rate_limits
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start = v_window_start;
  
  IF v_current_count IS NULL THEN
    -- First request in this window, insert new record
    INSERT INTO public.rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, v_window_start)
    ON CONFLICT (user_id, endpoint, window_start) 
    DO UPDATE SET request_count = rate_limits.request_count + 1, updated_at = now();
    
    RETURN true;
  ELSIF v_current_count >= p_max_requests THEN
    -- Rate limit exceeded
    RETURN false;
  ELSE
    -- Increment counter
    UPDATE public.rate_limits 
    SET request_count = request_count + 1, updated_at = now()
    WHERE user_id = p_user_id 
      AND endpoint = p_endpoint 
      AND window_start = v_window_start;
    
    RETURN true;
  END IF;
END;
$$;

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_user_endpoint_window 
ON public.rate_limits (user_id, endpoint, window_start);

-- Add trigger for updated_at
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Cleanup old rate limit records (optional - can be run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;
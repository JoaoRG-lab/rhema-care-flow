import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResearchRequest {
  category: "investors" | "academics" | "associations" | "all";
  region?: string;
}

interface Contact {
  name: string;
  email: string;
  organization: string;
  organization_type: string;
  position: string;
  country: string;
}

async function searchWithPerplexity(query: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: `You are a research assistant that finds contact information for healthcare organizations, investors, and academic institutions. 
          
Return ONLY a JSON array of contacts with this exact structure:
[
  {
    "name": "Contact Name or Organization Name",
    "email": "contact@email.com",
    "organization": "Organization Name",
    "organization_type": "investor|university|association",
    "position": "Position Title",
    "country": "Country"
  }
]

If you cannot find a real email, use a pattern like contact@organization-domain.com or info@organization-domain.com.
Focus on REAL organizations with verifiable information.
Return at least 10 contacts per query.`,
        },
        { role: "user", content: query },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Perplexity API error:", error);
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "[]";
}

function parseContacts(content: string): Contact[] {
  try {
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (e) {
    console.error("Failed to parse contacts:", e);
    return [];
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) {
      throw new Error("PERPLEXITY_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { category } = (await req.json()) as ResearchRequest;

    const queries: { category: string; query: string; orgType: string }[] = [];

    if (category === "investors" || category === "all") {
      queries.push({
        category: "investors",
        orgType: "investor",
        query: `Find the top 15 healthtech and healthcare venture capital firms and investors globally in 2024-2025. 
Include: Andreessen Horowitz Bio, General Catalyst Healthcare, Khosla Ventures, GV (Google Ventures) Life Sciences, 
Sequoia Capital Healthcare, ARCH Venture Partners, OrbiMed, Polaris Partners, NEA Healthcare, Founders Fund Bio, 
and other major healthcare investors.
For each, provide their general contact email or investment inquiry email.`,
      });
    }

    if (category === "academics" || category === "all") {
      queries.push({
        category: "academics",
        orgType: "university",
        query: `Find the top 15 medical schools and healthcare research institutions globally with their innovation or partnership contact.
Include: Harvard Medical School, Johns Hopkins Medicine, Stanford Medicine, Mayo Clinic, Cleveland Clinic, 
MIT Health, Oxford Medical Sciences, Cambridge Clinical School, Karolinska Institute, University of Tokyo Medical School,
National University of Singapore Medicine, University of Melbourne Medicine, and other leading institutions.
Provide innovation office or partnership contact emails.`,
      });
    }

    if (category === "associations" || category === "all") {
      queries.push({
        category: "associations",
        orgType: "association",
        query: `Find the top 15 major medical and healthcare professional associations globally.
Include: American Medical Association (AMA), British Medical Association (BMA), World Medical Association, 
American College of Rheumatology (ACR), European League Against Rheumatism (EULAR), 
American College of Physicians, Royal College of Physicians, Deutsche Ärzteblatt, 
Associação Médica Brasileira, Sociedad Brasileira de Reumatologia, 
Pan American Health Organization, and other major medical associations.
Provide their main contact or membership email.`,
      });
    }

    console.log(`Starting research for categories: ${queries.map(q => q.category).join(", ")}`);

    const allContacts: Contact[] = [];

    for (const q of queries) {
      console.log(`Researching ${q.category}...`);
      const content = await searchWithPerplexity(q.query, perplexityKey);
      const contacts = parseContacts(content);
      
      // Add organization type
      contacts.forEach(c => {
        c.organization_type = q.orgType;
      });
      
      allContacts.push(...contacts);
      console.log(`Found ${contacts.length} ${q.category}`);
    }

    // Save contacts to database
    const savedContacts: string[] = [];
    const errors: string[] = [];

    for (const contact of allContacts) {
      // Check if email already exists
      const { data: existing } = await supabase
        .from("outreach_contacts")
        .select("id")
        .eq("email", contact.email)
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        const { error: insertError } = await supabase.from("outreach_contacts").insert({
          user_id: user.id,
          name: contact.name,
          email: contact.email,
          organization: contact.organization,
          organization_type: contact.organization_type,
          position: contact.position,
          country: contact.country,
          status: "active",
          tags: [category, contact.organization_type],
        });

        if (insertError) {
          errors.push(`Failed to save ${contact.email}: ${insertError.message}`);
        } else {
          savedContacts.push(contact.email);
        }
      } else {
        console.log(`Contact ${contact.email} already exists, skipping`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        found: allContacts.length,
        saved: savedContacts.length,
        contacts: allContacts,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in ai-research-outreach:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

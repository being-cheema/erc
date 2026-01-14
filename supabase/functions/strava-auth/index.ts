import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRAVA_CLIENT_ID = Deno.env.get("STRAVA_CLIENT_ID")!;
const STRAVA_CLIENT_SECRET = Deno.env.get("STRAVA_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Step 1: Generate Strava OAuth URL
    if (action === "authorize") {
      const redirectUri = url.searchParams.get("redirect_uri");
      if (!redirectUri) {
        return new Response(
          JSON.stringify({ error: "redirect_uri is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const stravaAuthUrl = new URL("https://www.strava.com/oauth/authorize");
      stravaAuthUrl.searchParams.set("client_id", STRAVA_CLIENT_ID);
      stravaAuthUrl.searchParams.set("response_type", "code");
      stravaAuthUrl.searchParams.set("redirect_uri", redirectUri);
      stravaAuthUrl.searchParams.set("approval_prompt", "auto");
      stravaAuthUrl.searchParams.set("scope", "read,activity:read_all,profile:read_all");

      return new Response(
        JSON.stringify({ url: stravaAuthUrl.toString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Exchange code for tokens
    if (action === "callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response(
          JSON.stringify({ error: "code is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Exchange code for tokens with Strava
      const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Strava token error:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to exchange code for tokens" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenData = await tokenResponse.json();
      const { access_token, refresh_token, expires_at, athlete } = tokenData;

      // Create Supabase admin client
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Check if user exists with this Strava ID
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("strava_id", athlete.id.toString())
        .single();

      let userId: string;

      if (existingProfile) {
        // User exists, update tokens
        userId = existingProfile.user_id;
        
        await supabase
          .from("profiles")
          .update({
            strava_access_token: access_token,
            strava_refresh_token: refresh_token,
            strava_token_expires_at: new Date(expires_at * 1000).toISOString(),
            display_name: `${athlete.firstname} ${athlete.lastname}`,
            avatar_url: athlete.profile,
            city: athlete.city || null,
          })
          .eq("user_id", userId);
      } else {
        // Create new user in auth.users
        const email = `strava_${athlete.id}@eroderunners.local`;
        const password = crypto.randomUUID();

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            strava_id: athlete.id,
            display_name: `${athlete.firstname} ${athlete.lastname}`,
            avatar_url: athlete.profile,
          },
        });

        if (authError) {
          console.error("Auth creation error:", authError);
          return new Response(
            JSON.stringify({ error: "Failed to create user account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        userId = authData.user.id;

        // Create profile
        await supabase.from("profiles").insert({
          user_id: userId,
          strava_id: athlete.id.toString(),
          strava_access_token: access_token,
          strava_refresh_token: refresh_token,
          strava_token_expires_at: new Date(expires_at * 1000).toISOString(),
          display_name: `${athlete.firstname} ${athlete.lastname}`,
          avatar_url: athlete.profile,
          city: athlete.city || null,
        });

        // Assign member role
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: "member",
        });
      }

      // Generate a magic link for the user to sign in
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: `strava_${athlete.id}@eroderunners.local`,
      });

      if (linkError) {
        console.error("Link generation error:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to generate session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract the token from the action link
      const actionLink = linkData.properties?.action_link;
      const tokenMatch = actionLink?.match(/token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      return new Response(
        JSON.stringify({
          success: true,
          user_id: userId,
          token: token,
          athlete: {
            id: athlete.id,
            firstname: athlete.firstname,
            lastname: athlete.lastname,
            profile: athlete.profile,
            city: athlete.city,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Refresh access token
    if (action === "refresh") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Authorization required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace("Bearer ", "");
      
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("strava_refresh_token")
        .eq("user_id", user.id)
        .single();

      if (!profile?.strava_refresh_token) {
        return new Response(
          JSON.stringify({ error: "No refresh token found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          refresh_token: profile.strava_refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!tokenResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to refresh token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { access_token, refresh_token, expires_at } = await tokenResponse.json();

      await supabase
        .from("profiles")
        .update({
          strava_access_token: access_token,
          strava_refresh_token: refresh_token,
          strava_token_expires_at: new Date(expires_at * 1000).toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Strava auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

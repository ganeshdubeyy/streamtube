import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const parseTimestamp = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  const parsed = new Date(String(value || "")).getTime();
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
};

const defaultKey = (pluralName: string, legacyName: string) => {
  const keyMap = Deno.env.get(pluralName);
  if (keyMap) {
    try {
      const parsed = JSON.parse(keyMap);
      if (parsed.default) return parsed.default as string;
    } catch {
      // Fall back to the legacy single-key environment variable below.
    }
  }
  return Deno.env.get(legacyName);
};

async function requestHub(mode: "subscribe" | "unsubscribe", topicUrl: string, verifyToken: string, callbackUrl: string, secret: string) {
  const form = new URLSearchParams({
    "hub.callback": callbackUrl,
    "hub.mode": mode,
    "hub.topic": topicUrl,
    "hub.verify": "async",
    "hub.verify_token": verifyToken,
    "hub.secret": secret,
    "hub.lease_seconds": "1209600",
  });
  return fetch("https://pubsubhubbub.appspot.com/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = defaultKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const serviceKey = defaultKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  const websubSecret = Deno.env.get("YOUTUBE_WEBSUB_SECRET");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !publishableKey || !serviceKey || !websubSecret || !authorization) {
    return json({ error: "Function configuration is incomplete." }, 500);
  }

  const caller = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await caller.auth.getUser();
  if (authError || !user) return json({ error: "Sign in is required." }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: libraryRow, error: libraryError } = await admin
    .from("user_library")
    .select("data")
    .eq("user_id", user.id)
    .maybeSingle();
  if (libraryError) return json({ error: libraryError.message }, 500);

  const rawSubscriptions = Array.isArray(libraryRow?.data?.streamtubeSubscriptions)
    ? libraryRow.data.streamtubeSubscriptions
    : [];
  const channels = rawSubscriptions
    .filter((channel: any) => typeof channel?.id === "string" && channel.id.length > 0)
    .map((channel: any) => ({
      user_id: user.id,
      channel_id: channel.id,
      channel_title: String(channel.title || "YouTube channel").slice(0, 200),
      thumbnail: typeof channel.thumbnail === "string" ? channel.thumbnail : null,
      subscribed_at: parseTimestamp(channel.subscribedAt),
    }));

  const { data: oldFollows, error: oldFollowsError } = await admin
    .from("app_channel_subscriptions")
    .select("channel_id")
    .eq("user_id", user.id);
  if (oldFollowsError) return json({ error: oldFollowsError.message }, 500);

  const currentIds = new Set(channels.map((channel: { channel_id: string }) => channel.channel_id));
  for (const oldFollow of oldFollows || []) {
    if (!currentIds.has(oldFollow.channel_id)) {
      const { error } = await admin.from("app_channel_subscriptions")
        .delete().eq("user_id", user.id).eq("channel_id", oldFollow.channel_id);
      if (error) return json({ error: error.message }, 500);
    }
  }

  if (channels.length) {
    const { error } = await admin.from("app_channel_subscriptions")
      .upsert(channels, { onConflict: "user_id,channel_id" });
    if (error) return json({ error: error.message }, 500);
  }

  const callbackUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/youtube-webhook`;
  const topicErrors: string[] = [];
  const uniqueChannelMap = new Map<string, { channel_id: string; channel_title: string }>();
  for (const channel of channels) uniqueChannelMap.set(channel.channel_id, channel);
  for (const channel of uniqueChannelMap.values()) {
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${encodeURIComponent(channel.channel_id)}`;
    const { data: topic, error: topicReadError } = await admin.from("youtube_websub_topics")
      .select("verify_token, status, lease_expires_at, updated_at")
      .eq("channel_id", channel.channel_id)
      .maybeSingle();
    if (topicReadError) {
      topicErrors.push(`${channel.channel_title}: ${topicReadError.message}`);
      continue;
    }
    const leaseEnd = topic?.lease_expires_at ? new Date(topic.lease_expires_at).getTime() : 0;
    const recentlyRequested = topic?.status === "pending" && Date.now() - new Date(topic.updated_at).getTime() < 10 * 60 * 1000;
    if ((topic?.status === "active" && leaseEnd > Date.now() + 24 * 60 * 60 * 1000) || recentlyRequested) continue;

    const verifyToken = crypto.randomUUID();
    const { error: saveTopicError } = await admin.from("youtube_websub_topics").upsert({
      channel_id: channel.channel_id,
      topic_url: topicUrl,
      verify_token: verifyToken,
      status: "pending",
      lease_expires_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "channel_id" });
    if (saveTopicError) {
      topicErrors.push(`${channel.channel_title}: ${saveTopicError.message}`);
      continue;
    }

    try {
      const response = await requestHub("subscribe", topicUrl, verifyToken, callbackUrl, websubSecret);
      if (!response.ok) {
        const details = (await response.text()).slice(0, 160);
        topicErrors.push(`${channel.channel_title}: YouTube hub returned ${response.status} ${details}`);
      }
    } catch (error) {
      topicErrors.push(`${channel.channel_title}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return json({ syncedChannels: channels.length, topicErrors });
});

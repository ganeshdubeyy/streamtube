import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json" },
});

const decodeXml = (value: string) => value
  .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
  .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
  .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, "&");

const tagValue = (xml: string, tagName: string) => {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<(?:(?:[\\w.-]+):)?${escaped}\\b[^>]*>([\\s\\S]*?)<\\/(?:(?:[\\w.-]+):)?${escaped}\\s*>`, "i"));
  return match ? decodeXml(match[1]).trim() : "";
};

const serviceKey = () => {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      if (parsed.default) return parsed.default as string;
    } catch {
      // Fall back to the legacy single-key environment variable below.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
};

async function checkSignature(body: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha1=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  const expected = [...signature].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const actual = header.slice(5).toLowerCase();
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  return difference === 0;
}

Deno.serve(async (request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const adminKey = serviceKey();
  const websubSecret = Deno.env.get("YOUTUBE_WEBSUB_SECRET");
  if (!supabaseUrl || !adminKey || !websubSecret) return json({ error: "Webhook configuration is incomplete." }, 500);

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (request.method === "GET") {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const topicUrl = url.searchParams.get("hub.topic");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = url.searchParams.get("hub.verify_token");
    if (!mode || !topicUrl || !challenge || !verifyToken) return new Response("Missing verification values.", { status: 400 });

    const { data: topic, error } = await admin.from("youtube_websub_topics")
      .select("channel_id, verify_token")
      .eq("topic_url", topicUrl)
      .maybeSingle();
    if (error || !topic || topic.verify_token !== verifyToken) return new Response("Verification rejected.", { status: 403 });
    if (mode !== "subscribe" && mode !== "unsubscribe") return new Response("Unsupported mode.", { status: 400 });

    const requestedLease = Number(url.searchParams.get("hub.lease_seconds")) || 1_209_600;
    const { error: updateError } = await admin.from("youtube_websub_topics").update({
      status: mode === "subscribe" ? "active" : "inactive",
      lease_expires_at: mode === "subscribe" ? new Date(Date.now() + requestedLease * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("channel_id", topic.channel_id);
    if (updateError) return new Response("Could not save subscription status.", { status: 500 });
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  if (request.method !== "POST") return new Response("Method not allowed.", { status: 405 });
  const body = await request.text();
  if (!await checkSignature(body, request.headers.get("x-hub-signature"), websubSecret)) {
    console.warn("Ignored a YouTube webhook with an invalid signature.");
    return new Response(null, { status: 202 });
  }

  const entries = [...body.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
  for (const entry of entries) {
    const channelId = tagValue(entry, "channelId");
    const videoId = tagValue(entry, "videoId");
    const videoTitle = tagValue(entry, "title");
    const publishedAt = tagValue(entry, "published");
    const publishedTime = new Date(publishedAt).getTime();
    if (!channelId || !videoId || !videoTitle || !Number.isFinite(publishedTime)) continue;

    const { data: followers, error: followersError } = await admin.from("app_channel_subscriptions")
      .select("user_id, channel_title, subscribed_at")
      .eq("channel_id", channelId);
    if (followersError || !followers?.length) continue;

    const alerts = followers
      .filter((follower) => new Date(follower.subscribed_at).getTime() < publishedTime)
      .map((follower) => ({
        user_id: follower.user_id,
        channel_id: channelId,
        channel_title: follower.channel_title || "YouTube channel",
        video_id: videoId,
        video_title: videoTitle.slice(0, 500),
        published_at: new Date(publishedTime).toISOString(),
      }));
    if (!alerts.length) continue;

    const { error: insertError } = await admin.from("app_notifications")
      .upsert(alerts, { onConflict: "user_id,video_id", ignoreDuplicates: true });
    if (insertError) console.error("Could not save upload alerts:", insertError.message);
  }

  return new Response(null, { status: 204 });
});

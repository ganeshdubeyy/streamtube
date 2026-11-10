import { useEffect, useState } from "react";
import { PlaySquare, UserRound, UserMinus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getSubscribedChannels,
  removeChannelSubscription,
  subscribeToLibrary,
} from "../../utils/videoLibrary";
import { useAuth } from "../../auth/useAuth";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState(getSubscribedChannels);

  useEffect(() => {
    const refresh = (key) => {
      if (!key || key === "streamtubeSubscriptions") {
        setChannels(getSubscribedChannels());
      }
    };
    return subscribeToLibrary(refresh);
  }, []);

  return (
    <section className="min-h-screen bg-white px-4 py-6 dark:bg-[#0f0f0f] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <PlaySquare className="text-gray-500 dark:text-gray-400" />
          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">Subscriptions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {channels.length} {channels.length === 1 ? "channel" : "channels"} · {user ? "Synced with your account" : "Saved on this device"}
            </p>
          </div>
        </div>

        {channels.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-10 text-center dark:border-[#303030]">
            <UserRound className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-300">You haven’t subscribed to any channels in StreamTube yet.</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Open a video and select Subscribe to add its channel here.</p>
            <Link to="/" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">Explore videos</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-[#303030]">
            {channels.map((channel) => (
              <article key={channel.id} className="flex items-center gap-4 py-4">
                <a
                  href={`https://www.youtube.com/channel/${channel.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  {channel.thumbnail ? (
                    <img src={channel.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-400 text-xl text-white">{channel.title?.[0] || "?"}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-black dark:text-white">{channel.title}</span>
                    <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">
                      {Number(channel.subscriberCount).toLocaleString()} subscribers · Opens on YouTube
                    </span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => removeChannelSubscription(channel.id)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#272727]"
                  aria-label={`Unsubscribe from ${channel.title}`}
                >
                  <UserMinus size={17} />
                  <span className="hidden sm:inline">Unsubscribe</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

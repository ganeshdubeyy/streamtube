import { Link } from "react-router-dom";
import { Upload } from "lucide-react";

export default function YourVideosPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-white px-5 py-12 dark:bg-[#0f0f0f]">
      <section className="max-w-lg text-center">
        <Upload className="mx-auto mb-4 text-gray-400" size={40} />
        <h1 className="text-2xl font-semibold text-black dark:text-white">Your videos</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">StreamTube can’t upload videos to a YouTube channel yet. Uploading requires Google sign-in and YouTube authorization, which this frontend-only app doesn’t implement.</p>
        <a href="https://studio.youtube.com/" target="_blank" rel="noreferrer" className="mt-5 inline-block rounded-full bg-black px-5 py-2 text-sm font-medium text-white hover:opacity-80 dark:bg-white dark:text-black">Open YouTube Studio</a>
        <div><Link to="/" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">Back to videos</Link></div>
      </section>
    </main>
  );
}

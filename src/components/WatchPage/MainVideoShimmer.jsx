const MainVideoShimmer = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 px-4 py-4 bg-white dark:bg-[#0f0f0f] min-h-screen">
      <div className="flex-1 min-w-0 max-w-[1000px] animate-pulse [animation-duration:2s]">
        <div className="w-full aspect-video rounded-xl bg-gray-100 dark:bg-white/5" />

        <div className="h-5 w-4/5 rounded bg-gray-100 dark:bg-white/5 mt-4" />

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5" />

            <div>
              <div className="h-4 w-28 rounded bg-gray-100 dark:bg-white/5" />
              <div className="h-3 w-20 rounded bg-gray-100 dark:bg-white/5 mt-2" />
            </div>

            <div className="h-9 w-24 rounded-full bg-gray-100 dark:bg-white/5 ml-3" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-10 w-32 rounded-full bg-gray-100 dark:bg-white/5" />
            <div className="h-10 w-24 rounded-full bg-gray-100 dark:bg-white/5" />
            <div className="h-10 w-28 rounded-full bg-gray-100 dark:bg-white/5" />
            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-white/5" />
          </div>
        </div>

        <div className="mt-4 rounded-xl p-4 bg-gray-50 dark:bg-white/[0.03]">
          <div className="h-4 w-40 rounded bg-gray-100 dark:bg-white/5" />
          <div className="h-3 w-full rounded bg-gray-100 dark:bg-white/5 mt-3" />
          <div className="h-3 w-11/12 rounded bg-gray-100 dark:bg-white/5 mt-2" />
          <div className="h-3 w-7/12 rounded bg-gray-100 dark:bg-white/5 mt-2" />
        </div>

        <div className="mt-6">
          <div className="h-5 w-32 rounded bg-gray-100 dark:bg-white/5 mb-6" />

          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex-shrink-0" />

              <div className="flex-1">
                <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/5" />
                <div className="h-3 w-11/12 rounded bg-gray-100 dark:bg-white/5 mt-2" />
                <div className="h-3 w-7/12 rounded bg-gray-100 dark:bg-white/5 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainVideoShimmer;

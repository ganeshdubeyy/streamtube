import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Search, Mic, Video, X, UserRound, ListVideo } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addInputSearchValue,
  clearInputSearch,
  toggleShowSuggestion,
  toggleSideBar,
  toggleMobileSidebar,
} from "../../utils/appSlice";
import SuggestionContainer from "../HomePage/SuggestionContainer";
import { addtoCache } from "../../utils/searchSlice";
import { Link, useNavigate } from "react-router-dom";
import MobileSearchHeader from "./MobileSearchHeader";
import { createPlaylist } from "../../utils/videoLibrary";
import NotificationMenu from "./NotificationMenu";
import { useAuth } from "../../auth/useAuth";
export default function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [createError, setCreateError] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const { inputSearch, showSuggestions } = useSelector((store) => store.app);
  const [suggestions, setSuggestions] = useState([]);
  const searchBoxRef = useRef(null);
  const createMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const latestSearchRef = useRef(inputSearch);
  latestSearchRef.current = inputSearch;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cacheResult = useSelector((store) => store.search);
  const { user, profile } = useAuth();
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target) &&
        showSuggestions
      ) {
        dispatch(toggleShowSuggestion());
        setActiveSuggestion(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions, dispatch]);

  useEffect(() => {
    const closeMenus = (event) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target)) setCreateOpen(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setCreateOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const getQuerySuggestions = useCallback(async (query) => {
    if (!query.trim()) return;
    try {
      const response = await fetch(
        `/api/suggestions?client=firefox&ds=yt&q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) return;
      const data = await response.json();
      if (latestSearchRef.current !== query) return;
      const results = Array.isArray(data[1]) ? data[1] : [];
      dispatch(addtoCache({ [query]: results }));
      setSuggestions(results);
      setActiveSuggestion(-1);
    } catch {
      if (latestSearchRef.current === query) setSuggestions([]);
    }
  }, [dispatch]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (cacheResult[inputSearch]) {
        setSuggestions(cacheResult[inputSearch]);
        setActiveSuggestion(-1);
        return;
      }
      getQuerySuggestions(inputSearch);
    }, 200);
    return () => clearTimeout(timerId);
  }, [inputSearch, cacheResult, getQuerySuggestions]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
      selectSuggestion(suggestions[activeSuggestion]);
      return;
    }
    const query = inputSearch.trim();
    if (!query) return;
    if (showSuggestions) dispatch(toggleShowSuggestion());
    navigate(`/results?search_query=${encodeURIComponent(query)}`);
    setMobileSearchOpen(false);
  };

  const selectSuggestion = (query) => {
    dispatch(addInputSearchValue(query));
    if (showSuggestions) dispatch(toggleShowSuggestion());
    setActiveSuggestion(-1);
    setMobileSearchOpen(false);
    navigate(`/results?search_query=${encodeURIComponent(query)}`);
  };

  const handleSearchKeyDown = (event) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Escape") {
      event.preventDefault();
      dispatch(toggleShowSuggestion());
      setActiveSuggestion(-1);
    }
  };

  const clearSearch = () => {
    dispatch(clearInputSearch());
    setSuggestions([]);
    setActiveSuggestion(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const startVoiceSearch = async () => {
    if (voiceListening) {
      recognitionRef.current?.stop();
      return;
    }
    if (voiceStarting) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceMessage("Voice search is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceMessage("This page cannot access a microphone. Open it on localhost or a secure HTTPS site.");
      return;
    }

    setVoiceMessage("Checking microphone…");
    setVoiceStarting(true);
    try {
      // Prompt for mic access explicitly so a denied/missing device is reported
      // before the browser's speech service starts listening.
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphone.getTracks().forEach((track) => track.stop());

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = navigator.language || "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setVoiceStarting(false);
        setVoiceListening(true);
        setVoiceMessage("Listening… speak now.");
      };
      recognition.onend = () => {
        setVoiceStarting(false);
        setVoiceListening(false);
      };
      recognition.onerror = (event) => {
        setVoiceStarting(false);
        setVoiceListening(false);
        console.warn("Speech recognition error:", event.error, event.message || "");
        const messages = {
          "not-allowed": "Microphone access was blocked. Allow microphone access for localhost in your browser settings, then try again.",
          "service-not-allowed": "The browser's speech recognition service is blocked. Check browser policy or use another supported browser.",
          "no-speech": "No speech was detected. Press the microphone and start speaking when the listening message appears.",
          "audio-capture": "The browser could not capture audio. Check that a microphone is connected and available.",
          network: "The browser could not reach its speech recognition service. Check your internet connection, VPN, or firewall.",
          aborted: "Voice recognition was stopped before a search was captured. Try again and keep the microphone active.",
        };
        setVoiceMessage(messages[event.error] || `Voice recognition failed (${event.error || "unknown error"}). Check microphone and browser speech settings, then try again.`);
      };
      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = event.results[index][0]?.transcript || "";
          if (event.results[index].isFinal) finalTranscript += transcript;
          else interimTranscript += transcript;
        }
        const query = finalTranscript.trim();
        if (!query) {
          if (interimTranscript.trim()) setVoiceMessage(`Hearing: ${interimTranscript.trim()}…`);
          return;
        }
        dispatch(addInputSearchValue(query));
        if (showSuggestions) dispatch(toggleShowSuggestion());
        setVoiceMessage(`Searching for ${query}`);
        setActiveSuggestion(-1);
        setMobileSearchOpen(false);
        recognition.stop();
        navigate(`/results?search_query=${encodeURIComponent(query)}`);
      };
      recognition.start();
    } catch (error) {
      setVoiceStarting(false);
      setVoiceListening(false);
      const messages = {
        NotAllowedError: "Microphone access was denied. Allow it for localhost in your browser's site settings, then try again.",
        NotFoundError: "No microphone was found. Connect or enable a microphone, then try again.",
        NotReadableError: "The microphone is busy or unavailable. Close other apps using it, then try again.",
        SecurityError: "Microphone access requires localhost or a secure HTTPS page.",
      };
      console.warn("Microphone access error:", error);
      setVoiceMessage(messages[error?.name] || `Voice search could not start (${error?.name || "unknown error"}). Check microphone permission and try again.`);
    }
  };

  const handleCreatePlaylist = (event) => {
    event.preventDefault();
    const playlist = createPlaylist(playlistName);
    if (!playlist) {
      setCreateError(playlistName.trim() ? "A playlist with that name already exists." : "Enter a playlist name.");
      return;
    }
    setPlaylistName("");
    setCreateError("");
    setCreateOpen(false);
    navigate(`/playlists/${playlist.id}`);
  };

  const toggleNavigation = () => {
    if (window.matchMedia("(min-width: 768px)").matches) dispatch(toggleSideBar());
    else dispatch(toggleMobileSidebar());
  };

  if (mobileSearchOpen) {
    return (
      <MobileSearchHeader
        showSuggestions={showSuggestions}
        onSubmit={submitSearch}
        onKeyDown={handleSearchKeyDown}
        onClear={clearSearch}
        onVoiceSearch={startVoiceSearch}
        voiceListening={voiceListening}
        voiceStarting={voiceStarting}
        voiceMessage={voiceMessage}
        activeSuggestion={activeSuggestion}
        inputRef={inputRef}
        onQueryChange={() => setActiveSuggestion(-1)}
        setMobileSearchOpen={setMobileSearchOpen}
        suggestions={suggestions}
        searchBoxRef={searchBoxRef}
        inputSearch={inputSearch}
      />
    );
  }

  return (
    <header className="w-full h-14 flex items-center justify-between px-4 bg-white dark:bg-[#0f0f0f] border-b border-transparent sticky top-0 z-50">
      <div className="flex items-center gap-4 min-w-0">
        <button
          className="p-2 rounded-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Menu"
          onClick={toggleNavigation}
        >
          <Menu
            size={22}
            className="text-black dark:text-white"
            strokeWidth={1.8}
          />
        </button>

        <Link
          to="/"
          className="flex items-center gap-1 -ml-1 cursor-pointer"
          aria-label="StreamTube Home"
        >
          <div className="w-8 h-[22px] rounded-[6px] bg-red-600 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-white ml-0.5" />
          </div>

          <span className="text-black dark:text-white text-[20px] font-semibold tracking-[-1.2px]">
            StreamTube
          </span>
        </Link>
      </div>

      <div className="hidden md:flex flex-1 justify-center items-center max-w-[720px] mx-4">
        <form className="flex flex-1 relative" ref={searchBoxRef} onSubmit={submitSearch}>
          <div
            className={`flex flex-1 items-center h-10 rounded-l-full border pl-4 pr-2 bg-white dark:bg-[#121212] ${
              searchFocused
                ? "border-blue-500 dark:border-blue-500"
                : "border-gray-300 dark:border-[#303030]"
            }`}
          >
            <input
              type="text"
              placeholder="Search"
              value={inputSearch}
              ref={inputRef}
              onChange={(e) => { dispatch(addInputSearchValue(e.target.value)); setActiveSuggestion(-1); }}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => { setSearchFocused(true); if (!showSuggestions) dispatch(toggleShowSuggestion()); }}
              onBlur={() => setSearchFocused(false)}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="search-suggestions"
              aria-activedescendant={activeSuggestion >= 0 ? `search-suggestion-${activeSuggestion}` : undefined}
              autoComplete="off"
              className="flex-1 bg-transparent outline-none text-black dark:text-white text-base placeholder-gray-500 dark:placeholder-gray-400"
            />
            {inputSearch && <button type="button" aria-label="Clear search" onClick={(event) => { event.stopPropagation(); clearSearch(); }} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-[#303030]">
              <X className="text-gray-500 dark:text-gray-400" width={18} />
            </button>}
          </div>

          <button
            className="flex items-center justify-center w-16 h-10 rounded-r-full bg-gray-100 dark:bg-[#222222] border border-l-0 border-gray-300 dark:border-[#303030] hover:bg-gray-200 dark:hover:bg-[#2f2f2f] transition-colors cursor-pointer"
            aria-label="Search"
            type="submit"
          >
            <Search
              size={20}
              className="text-black dark:text-white"
              strokeWidth={2}
            />
          </button>

          {showSuggestions && inputSearch.trim() && suggestions.length > 0 && <SuggestionContainer suggestions={suggestions} activeIndex={activeSuggestion} />}
        </form>

        <div className="relative ml-3">
          <button
            type="button"
            onClick={startVoiceSearch}
            className={`rounded-full p-2.5 transition-colors ${voiceListening || voiceStarting ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-[#181818] dark:text-white dark:hover:bg-[#272727]"}`}
            aria-label={voiceListening ? "Stop voice search" : voiceStarting ? "Starting voice search" : "Search with voice"}
            title={voiceMessage || "Search with voice"}
          >
            <Mic size={20} strokeWidth={1.8} />
          </button>
          {voiceMessage && <span role="status" className="absolute right-0 top-12 z-[60] w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">{voiceMessage}</span>}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <button
          className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Search"
          onClick={() => setMobileSearchOpen(true)}
        >
          <Search
            size={22}
            className="text-black dark:text-white"
            strokeWidth={1.8}
          />
        </button>

        <div className="relative hidden sm:block" ref={createMenuRef}>
          <button
            type="button"
            className="flex items-center gap-2 px-3 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-black dark:text-white cursor-pointer"
            aria-label="Create"
            aria-expanded={createOpen}
            aria-controls="create-menu"
            onClick={() => { setCreateOpen((open) => !open); setProfileOpen(false); setCreateError(""); }}
          >
            <Video size={22} strokeWidth={1.8} />
            <span className="text-sm font-medium">Create</span>
          </button>
          {createOpen && (
            <div id="create-menu" className="absolute right-0 top-11 z-[60] w-80 rounded-xl border border-gray-200 bg-white p-4 text-black shadow-xl dark:border-[#303030] dark:bg-[#212121] dark:text-white">
              <div className="mb-3 flex items-center gap-2 font-semibold"><ListVideo size={18} /> Create a playlist</div>
              <form onSubmit={handleCreatePlaylist}>
                <label htmlFor="header-playlist-name" className="mb-1 block text-xs text-gray-500 dark:text-gray-400">Playlist name</label>
                <input
                  id="header-playlist-name"
                  value={playlistName}
                  onChange={(event) => setPlaylistName(event.target.value)}
                  maxLength={60}
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-[#454545]"
                  placeholder="e.g. React learning path"
                />
                {createError && <p role="alert" className="mt-2 text-xs text-red-600">{createError}</p>}
                <button type="submit" className="mt-3 w-full rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:opacity-80 dark:bg-white dark:text-black">Create and open</button>
              </form>
              <Link to="/playlists" onClick={() => setCreateOpen(false)} className="mt-2 block text-center text-sm text-blue-600 hover:underline dark:text-blue-400">Manage playlists</Link>
            </div>
          )}
        </div>

        <NotificationMenu />

        <div className="relative ml-1" ref={profileMenuRef}>
          <button
            type="button"
            className="flex items-center cursor-pointer rounded-full"
            aria-label={user ? `${profile?.display_name || user.email} account menu` : "Guest profile menu"}
            aria-expanded={profileOpen}
            aria-controls="profile-menu"
            onClick={() => { setProfileOpen((open) => !open); setCreateOpen(false); }}
          >
            {user && profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : user ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-sm font-medium text-white">{(profile?.display_name || user?.email || "G")[0].toUpperCase()}</div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#737987] text-white">
                <UserRound size={21} strokeWidth={1.8} />
              </div>
            )}
          </button>
          {profileOpen && (
            <div id="profile-menu" className="absolute right-0 top-11 z-[60] w-64 overflow-hidden rounded-xl border border-gray-200 bg-white text-black shadow-xl dark:border-[#303030] dark:bg-[#212121] dark:text-white">
              <div className="border-b border-gray-200 px-4 py-3 dark:border-[#303030]">
                <div className="flex items-center gap-3">
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-500 text-white"><UserRound size={20} /></div>}
                  <div><p className="font-medium">{profile?.display_name || (user ? user.email : "Guest")}</p><p className="text-xs text-gray-500 dark:text-gray-400">{user ? user.email : "Saved on this device"}</p></div>
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{user ? "Your library syncs with your account." : "Sign in to sync your library across devices."}</p>
              </div>
              <nav className="p-2" aria-label="Guest library">
                <Link to="/account" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-[#3f3f3f]">{user ? "Manage account" : "Sign in / Create account"}</Link>
                {[["/history", "Watch history"], ["/watch-later", "Watch later"], ["/liked-videos", "Liked videos"], ["/playlists", "Playlists"]].map(([to, label]) => (
                  <Link key={to} to={to} onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-[#3f3f3f]">{label}</Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

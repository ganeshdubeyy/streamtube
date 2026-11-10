import { ArrowLeft, Search, X, Mic } from "lucide-react";
import {
  addInputSearchValue,
  toggleShowSuggestion,
} from "../../utils/appSlice";
import { useDispatch } from "react-redux";
import SuggestionContainer from "../HomePage/SuggestionContainer";

const MobileSearchHeader = ({
  setMobileSearchOpen,
  showSuggestions,
  onSubmit,
  onKeyDown,
  onClear,
  onVoiceSearch,
  voiceListening,
  voiceStarting,
  voiceMessage,
  activeSuggestion,
  inputRef,
  onQueryChange,
  searchBoxRef,
  inputSearch,
  suggestions
}) => {
  const dispatch = useDispatch();
  return (
    <header className="w-full h-14 flex items-center gap-2 px-2 bg-white dark:bg-[#0f0f0f] sticky top-0 z-50 md:hidden">
      <button
        className="p-2 rounded-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
        aria-label="Back"
        onClick={() => setMobileSearchOpen(false)}
      >
        <ArrowLeft
          size={22}
          className="text-black dark:text-white"
          strokeWidth={1.8}
        />
      </button>

      <form className="flex flex-1 items-center relative" ref={searchBoxRef} onSubmit={onSubmit}>
        <div
          className="flex flex-1 items-center h-10 rounded-full border border-gray-300 dark:border-[#303030] pl-4 pr-2 bg-white dark:bg-[#121212]"
        >
          <input
            type="text"
            placeholder="Search"
            value={inputSearch}
            ref={inputRef}
            onChange={(e) => { dispatch(addInputSearchValue(e.target.value)); onQueryChange(); }}
            onFocus={() => { if (!showSuggestions) dispatch(toggleShowSuggestion()); }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="search-suggestions"
            aria-activedescendant={activeSuggestion >= 0 ? `search-suggestion-${activeSuggestion}` : undefined}
            autoComplete="off"
            className="flex-1 bg-transparent outline-none text-black dark:text-white text-base placeholder-gray-500 dark:placeholder-gray-400"
          />
          {inputSearch && <button type="button" aria-label="Clear search" onClick={(event) => { event.stopPropagation(); onClear(); }} className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-[#303030]">
            <X className="text-gray-500 dark:text-gray-400" width={18} />
          </button>}
        </div>

        {showSuggestions && inputSearch.trim() && suggestions.length > 0 && <SuggestionContainer suggestions={suggestions} activeIndex={activeSuggestion} />}
      <button
        type="submit"
        className="p-2 rounded-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex-shrink-0"
        aria-label="Search"
      >
        <Search
          size={20}
          className="text-black dark:text-white"
          strokeWidth={2}
        />
      </button>
      </form>
      <button type="button" onClick={onVoiceSearch} className={`shrink-0 rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 ${voiceListening || voiceStarting ? "text-red-600" : "text-black dark:text-white"}`} aria-label={voiceListening ? "Stop voice search" : voiceStarting ? "Starting voice search" : "Search with voice"} title={voiceMessage || "Search with voice"}>
        <Mic size={20} />
      </button>
      {voiceMessage && <span role="status" className="absolute right-2 top-14 z-[60] max-w-[calc(100vw-1rem)] rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">{voiceMessage}</span>}
    </header>
  );
};

export default MobileSearchHeader;

import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  addInputSearchValue,
  toggleShowSuggestion,
} from "../../utils/appSlice";

const SuggestionContainer = ({ suggestions, activeIndex = -1 }) => {
  const dispatch = useDispatch();
  return (
    <div id="search-suggestions" role="listbox" aria-label="Search suggestions" className="absolute top-11 left-0 w-full bg-white dark:bg-[#212121] mt-2 border-gray-200 dark:border-[#303030] rounded-2xl shadow-lg z-50 overflow-hidden">
      {suggestions.map((item, index) => (
        <Link
          to={`/results?search_query=${encodeURIComponent(item)}`}
          key={item}
          id={`search-suggestion-${index}`}
          role="option"
          aria-selected={activeIndex === index}
          onClick={() => {
            dispatch(addInputSearchValue(item));
            dispatch(toggleShowSuggestion());
          }}
          className={`flex items-center gap-4 px-4 py-2 cursor-pointer text-sm text-black dark:text-white ${activeIndex === index ? "bg-gray-100 dark:bg-[#3f3f3f]" : "hover:bg-gray-100 dark:hover:bg-[#3f3f3f]"}`}
        >
          <Search size={16} className="text-gray-500 dark:text-gray-400" />
          {item}
        </Link>
      ))}
    </div>
  );
};

export default SuggestionContainer;

import { SearchIcon, XIcon } from "./Icon";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search…",
  className = "",
}) => (
  <div className={`admin-search ${className}`}>
    <SearchIcon />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        className="admin-search-clear"
        aria-label="Clear search"
      >
        <XIcon className="w-3 h-3" />
      </button>
    )}
  </div>
);

export default SearchInput;

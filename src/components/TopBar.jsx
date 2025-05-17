import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Users, Bot, Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";

const TopBar = ({ projects, fetchSuggestions }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Debounce search requests
  const debouncedSearch = debounce(async (query) => {
    if (query.length > 0) {
      setIsLoading(true);
      try {
        const results = await fetchSuggestions(query);
        setSuggestions(results);
      } catch (error) {
        console.error("Search failed:", error);
      }
      setIsLoading(false);
    }
  }, 300);

  useEffect(() => {
    if (searchTerm.trim()) {
      debouncedSearch(searchTerm);
    } else {
      setSuggestions([]);
    }
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      setActiveIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      handleSelect(suggestions[activeIndex]);
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const highlightMatch = (text) => {
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-100">{text.substr(index, searchTerm.length)}</span>
        {text.substring(index + searchTerm.length)}
      </>
    );
  };

  const handleSelect = (item) => {
    setSearchTerm("");
    setSuggestions([]);
    navigate(`/projects/${item.id}`);
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 py-2 bg-white shadow-sm relative" ref={containerRef}>
      <div className="relative w-full md:w-[500px]">
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder="Search projects, tags, users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-8 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          {isLoading && (
            <Loader2 className="absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin" />
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
            <ul className="max-h-[280px] overflow-y-auto">
              {suggestions.map((item, index) => (
                <li
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === activeIndex ? "bg-blue-50" : "hover:bg-gray-50"
                  } ${
                    index < suggestions.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.type === 'project' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm">P</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {highlightMatch(item.name)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span>ID: {item.id}</span>
                        {item.tags?.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/chat-group")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative group"
        >
          <Users className="w-5 h-5 text-gray-600" />
          {/* <span className="tooltip">Group Chat</span> */}
        </button>
        <button
          onClick={() => navigate("/chat-ai")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative group"
        >
          <Bot className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
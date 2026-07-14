import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch real-time recommendations as the user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmed = inputValue.trim();
      if (trimmed.length < 1) {
        setSuggestions([]);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('products')
          .select('title')
          .ilike('title', `%${trimmed}%`)
          .limit(10);

        if (!error && data) {
          const uniqueTitles = Array.from(new Set(data.map((p) => p.title)));
          
          // Sort by match index positioning
          const sortedTitles = uniqueTitles.sort((a, b) => {
            const indexA = a.toLowerCase().indexOf(trimmed.toLowerCase());
            const indexB = b.toLowerCase().indexOf(trimmed.toLowerCase());
            return indexA - indexB;
          });

          setSuggestions(sortedTitles.slice(0, 6));
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    };

    const debounce = setTimeout(() => {
      fetchSuggestions();
    }, 150);

    return () => clearTimeout(debounce);
  }, [inputValue]);

  // Handle outside clicks to collapse recommendations dropdown cleanly
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchTrigger = (queryToSend: string) => {
    onSearch(queryToSend);
    setShowDropdown(false); 
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchTrigger(inputValue);
    }
  };

  const handleClearSearch = () => {
    setInputValue('');
    onSearch('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Helper to split string and bold what the user typed matching Amazon layout logic
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <b key={i} className="text-gray-950 font-black">{part}</b> 
            : <span key={i} className="text-gray-600 font-medium">{part}</span>
        )}
      </span>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-5 px-2 box-border relative z-40" ref={dropdownRef}>
      
      {/* 📦 Increased Outer Frame Border thickness to border-2 with deep high-visibility tracking */}
      <div className="relative flex items-center bg-white border-2 border-gray-400 rounded-xl overflow-hidden shadow-sm hover:border-gray-600 focus-within:ring-4 focus-within:ring-[#ff9900]/30 focus-within:border-[#e47911] transition-all duration-150">
        
        {/* Search Field input frame */}
        <input
          type="text"
          value={inputValue}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search GadgetHorizon..."
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-4 pr-12 py-3 rounded-none bg-transparent font-sans text-gray-900 placeholder-gray-500 text-sm font-bold outline-hidden border-none focus:ring-0"
        />

        {/* Clear string cross mark action link */}
        {inputValue.length > 0 && !isLoading && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-16 p-1.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 font-sans font-bold text-xs transition active:scale-90 cursor-pointer flex items-center justify-center w-6 h-6"
          >
            ✕
          </button>
        )}

        {/* 🎨 Right Side: Deep Signature Amazon Amber Yellow Search Action button with clear border boundary */}
        <button
          type="button"
          onClick={() => handleSearchTrigger(inputValue)}
          className="bg-[#febd69] hover:bg-[#f3a847] text-[#131921] border-l-2 border-gray-400 group-focus-within:border-[#e47911] self-stretch px-7 flex items-center justify-center cursor-pointer transition shrink-0"
          title="Submit Search request"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-[#131921] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5.5 w-5.5 transition-transform duration-150 active:scale-95" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2.8} // Thickened up search loop lines for sharp view matrices
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          )}
        </button>
      </div>

      {/* Suggestion Dropdown Panel with thick borders */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-1 right-1 mt-2 bg-white border-2 border-gray-300 shadow-2xl rounded-xl z-50 overflow-hidden box-border max-h-64 overflow-y-auto animate-in fade-in duration-100">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => {
                setInputValue(suggestion);
                handleSearchTrigger(suggestion);
              }}
              className="px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer transition flex items-center gap-3 border-b border-gray-100 last:border-none"
            >
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="truncate">{renderHighlightedText(suggestion, inputValue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
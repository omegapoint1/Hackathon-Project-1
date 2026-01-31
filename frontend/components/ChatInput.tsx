import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={`
          flex-1 h-11 px-4
          bg-white border-2 border-nim-cream
          rounded-lg
          text-nim-black placeholder-nim-brown/40
          font-body text-sm
          outline-none
          transition-colors duration-200
          focus:border-nim-orange
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className={`
          h-11 w-11
          bg-nim-orange text-white
          rounded-lg
          flex items-center justify-center
          transition-all duration-200
          hover:opacity-90 hover:scale-105
          active:scale-95
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
        `}
        aria-label="Send message"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
}

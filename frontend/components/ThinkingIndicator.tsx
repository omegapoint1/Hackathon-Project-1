export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-nim-white border border-nim-grey-100 rounded-lg max-w-bubble">
      <div className="nim-thinking-dot w-2 h-2 bg-nim-black rounded-full" />
      <div className="nim-thinking-dot w-2 h-2 bg-nim-black rounded-full" />
      <div className="nim-thinking-dot w-2 h-2 bg-nim-black rounded-full" />
    </div>
  );
}

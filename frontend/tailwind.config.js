/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',           // Login.tsx, main.tsx, etc.
    './components/**/*.{ts,tsx}',  // All components
    './hooks/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        nim: {
          orange: '#FF6D00',
          cream: '#F1EDE7',
          blue: '#9BC1F3',
          black: '#231F18',
          brown: '#492610',
          green: '#188A31',
        },
      },
      fontFamily: {
        display: ['ABC Marist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        body: ['Helvetica Monospaced Pro', 'SF Mono', 'Monaco', 'Courier New', 'monospace'],
        mono: ['Helvetica Monospaced Pro', 'SF Mono', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        bubble: '16px',
      },
      maxWidth: {
        bubble: '85%',
      },
    },
  },
  plugins: [],
};


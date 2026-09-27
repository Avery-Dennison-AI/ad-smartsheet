/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Every colour resolves through a CSS variable defined in
      // src/styles/theme.css. The literal fallback inside each var() is the
      // default palette, so the app still renders correctly if theme.css is
      // ever emptied or deleted. The channel-triplet form is what enables
      // opacity modifiers (bg-primary/10, text-muted-foreground/70).
      colors: {
        background: 'rgb(var(--background, 255 255 255) / <alpha-value>)',
        foreground: 'rgb(var(--foreground, 15 23 42) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card, 255 255 255) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground, 15 23 42) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted, 241 245 249) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground, 100 116 139) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary, 79 70 229) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground, 255 255 255) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary, 241 245 249) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground, 15 23 42) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent, 238 242 255) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground, 55 48 163) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive, 220 38 38) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground, 255 255 255) / <alpha-value>)',
        },
        success: 'rgb(var(--success, 22 163 74) / <alpha-value>)',
        warning: 'rgb(var(--warning, 217 119 6) / <alpha-value>)',
        border: 'rgb(var(--border, 226 232 240) / <alpha-value>)',
        input: 'rgb(var(--input, 203 213 225) / <alpha-value>)',
        ring: 'rgb(var(--ring, 79 70 229) / <alpha-value>)',
      },
      fontSize: {
        '2xs': 'var(--text-2xs)',
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        md: 'var(--text-md)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',   // 4px
        md: 'var(--radius-md)',   // 6px
        lg: 'var(--radius-lg)',   // 8px
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

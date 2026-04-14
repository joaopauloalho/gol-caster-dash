import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      /* ── FONTS ── */
      fontFamily: {
        display: ['"Barlow Condensed"', "sans-serif"],
        body:    ["Outfit",            "sans-serif"],
        mono:    ['"JetBrains Mono"',  "monospace"],
        sans:    ["Outfit",            "sans-serif"], // replaces Inter globally
      },

      /* ── COLORS ── */
      colors: {
        /* shadcn-required vars */
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50:  "hsl(var(--color-primary-50))",
          100: "hsl(var(--color-primary-100))",
          200: "hsl(var(--color-primary-200))",
          300: "hsl(var(--color-primary-300))",
          400: "hsl(var(--color-primary-400))",
          500: "hsl(var(--color-primary-500))",
          600: "hsl(var(--color-primary-600))",
          700: "hsl(var(--color-primary-700))",
          800: "hsl(var(--color-primary-800))",
          900: "hsl(var(--color-primary-900))",
          950: "hsl(var(--color-primary-950))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50:  "hsl(var(--color-secondary-50))",
          100: "hsl(var(--color-secondary-100))",
          200: "hsl(var(--color-secondary-200))",
          300: "hsl(var(--color-secondary-300))",
          400: "hsl(var(--color-secondary-400))",
          500: "hsl(var(--color-secondary-500))",
          600: "hsl(var(--color-secondary-600))",
          700: "hsl(var(--color-secondary-700))",
          800: "hsl(var(--color-secondary-800))",
          900: "hsl(var(--color-secondary-900))",
          950: "hsl(var(--color-secondary-950))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* semantic surfaces */
        surface: {
          DEFAULT: "hsl(var(--color-surface))",
          raised:  "hsl(var(--color-surface-raised))",
          overlay: "hsl(var(--color-surface-overlay))",
        },

        /* feedback */
        success: {
          DEFAULT:    "hsl(var(--color-success))",
          foreground: "hsl(var(--color-success-foreground))",
        },
        error: {
          DEFAULT:    "hsl(var(--color-error))",
          foreground: "hsl(var(--color-error-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--color-warning))",
          foreground: "hsl(var(--color-warning-foreground))",
        },
        info: {
          DEFAULT:    "hsl(var(--color-info))",
          foreground: "hsl(var(--color-info-foreground))",
        },

        /* legacy gold/green aliases kept for backward compat */
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light:   "hsl(var(--gold-light))",
        },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },
      },

      /* ── BORDER RADIUS ── */
      borderRadius: {
        xs:   "var(--radius-xs)",
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },

      /* ── SHADOWS ── */
      boxShadow: {
        sm:         "var(--shadow-sm)",
        md:         "var(--shadow-md)",
        lg:         "var(--shadow-lg)",
        xl:         "var(--shadow-xl)",
        card:       "var(--shadow-card)",
        "glow-gold":  "var(--shadow-glow-gold)",
        "glow-green": "var(--shadow-glow-green)",
      },

      /* ── TRANSITION DURATION ── */
      transitionDuration: {
        instant: "var(--duration-instant)",
        fast:    "var(--duration-fast)",
        normal:  "var(--duration-normal)",
        slow:    "var(--duration-slow)",
        slower:  "var(--duration-slower)",
      },

      /* ── KEYFRAMES ── */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(45 95% 55% / 0.2)" },
          "50%":      { boxShadow: "0 0 25px hsl(45 95% 55% / 0.45)" },
        },
        shimmer: {
          from: { transform: "translateX(-600%)" },
          to:   { transform: "translateX(600%)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(calc(-100% - 1rem))" },
        },
        grid: {
          "0%":   { transform: "translateY(-50%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        float:            "float 3s ease-in-out infinite",
        "slide-up":       "slide-up 0.5s ease-out forwards",
        "pulse-gold":     "pulse-gold 2s ease-in-out infinite",
        shimmer:          "shimmer 4s infinite",
        marquee:          "marquee var(--duration, 40s) linear infinite",
        grid:             "grid 15s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

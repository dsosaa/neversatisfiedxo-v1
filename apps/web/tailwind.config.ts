import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  // Tailwind CSS performance optimizations
  future: {
    hoverOnlyWhenSupported: true, // Only apply hover styles on devices that support it
  },
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-jetbrains-mono)', ...defaultTheme.fontFamily.mono],
        display: ['var(--font-playfair-display)', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Premium video-specific colors
        video: {
          free: 'hsl(142 76% 36%)', // Green for free content
          premium: 'hsl(47 96% 53%)', // Gold for premium content
          processing: 'hsl(43 96% 56%)', // Orange for processing
          error: 'hsl(0 84% 60%)', // Red for errors
        },
        // Enhanced semantic colors
        success: 'hsl(142 76% 36%)',
        warning: 'hsl(43 96% 56%)',
        info: 'hsl(217 91% 60%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)', // Premium 16px radius
        '3xl': 'calc(var(--radius) + 12px)',
      },
      animation: {
        // Premium trailer-specific animations
        'trailer-hover': 'trailer-hover 0.2s ease-out forwards',
        'modal-enter': 'modal-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'modal-exit': 'modal-exit 0.2s cubic-bezier(0.4, 0, 1, 1) forwards',
        'stagger-fade': 'stagger-fade 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        // Enhanced built-in animations
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-out': 'scale-out 0.2s ease-in',
      },
      keyframes: {
        // Premium trailer animations
        'trailer-hover': {
          '0%': { 
            transform: 'translateY(0) scale(1)',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          },
          '100%': { 
            transform: 'translateY(-8px) scale(1.02)',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
          }
        },
        'modal-enter': {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.95) translateY(8px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1) translateY(0)'
          }
        },
        'modal-exit': {
          '0%': { 
            opacity: '1',
            transform: 'scale(1) translateY(0)'
          },
          '100%': { 
            opacity: '0',
            transform: 'scale(0.95) translateY(8px)'
          }
        },
        'stagger-fade': {
          '0%': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'shimmer': {
          '0%, 100%': { 
            backgroundPosition: '200% 0'
          },
          '50%': { 
            backgroundPosition: '-200% 0'
          }
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgb(255 255 255 / 0.1)'
          },
          '50%': { 
            boxShadow: '0 0 30px rgb(255 255 255 / 0.2)'
          }
        },
        // Enhanced standard animations
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'scale-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.9)' }
        }
      },
      // Premium spacing system
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '92': '23rem',
        '96': '24rem',
        '104': '26rem',
        '112': '28rem',
        '128': '32rem',
      },
      // Premium typography scale
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.2' }],
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
      },
      // Premium shadows
      boxShadow: {
        'premium': '0 8px 32px -4px rgb(0 0 0 / 0.2)',
        'premium-hover': '0 16px 64px -12px rgb(0 0 0 / 0.35)',
        'premium-glow': '0 0 40px rgb(255 255 255 / 0.1)',
        'inner-glow': 'inset 0 1px 0 rgb(255 255 255 / 0.1)',
      },
      // Premium backdrop blur
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px',
      },
      // Premium aspect ratios for video content
      aspectRatio: {
        'video': '16 / 9',
        'portrait': '3 / 4',
        'cinema': '21 / 9',
      },
      // Enhanced transitions
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      // Enhanced backgrounds
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [
    // Add typography plugin for better text handling
    // Note: Install with `npm install @tailwindcss/typography`
    // require('@tailwindcss/typography'),
    
    // Add container queries plugin for advanced responsive design
    // Note: Install with `npm install @tailwindcss/container-queries`  
    // require('@tailwindcss/container-queries'),
    
    // Custom utilities for glass morphism and premium effects
    function({ addUtilities }: { addUtilities: (utilities: Record<string, any>) => void }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
        '.shimmer-bg': {
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          backgroundSize: '200% 100%',
        },
        '.focus-ring': {
          outline: '2px solid transparent',
          outlineOffset: '2px',
          '&:focus-visible': {
            outline: '2px solid hsl(var(--ring))',
            outlineOffset: '2px',
          }
        },
        '.grid-auto-rows-fr': {
          'grid-auto-rows': '1fr'
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config
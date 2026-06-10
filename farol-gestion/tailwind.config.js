/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Pipedrive-inspired: whites, cool grays, one blue accent
        pipe: {
          bg:        '#F5F5F5',   // page background
          surface:   '#FFFFFF',   // cards, panels
          border:    '#E4E6EA',   // all borders
          border2:   '#CDD0D6',   // stronger borders
          text:      '#1A1D23',   // primary text
          muted:     '#6B7280',   // secondary text
          faint:     '#9CA3AF',   // placeholders, hints
          blue:      '#1F6FEB',   // primary action (Pipedrive-ish blue)
          blueHover: '#1A5FCC',
          blueFaint: '#EFF4FF',   // blue tint bg
          green:     '#0D7A4E',
          greenBg:   '#ECFDF5',
          yellow:    '#92600A',
          yellowBg:  '#FFFBEB',
          red:       '#B91C1C',
          redBg:     '#FEF2F2',
          sidebar:   '#1C2B41',   // dark nav (Pipedrive dark top bar)
          sidebarText: '#A8B4C4',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
        xs:    ['12px', '17px'],
        sm:    ['13px', '19px'],
        base:  ['14px', '21px'],
        lg:    ['16px', '24px'],
        xl:    ['18px', '28px'],
        '2xl': ['22px', '32px'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '3px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        card:   '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        panel:  '0 4px 16px 0 rgba(0,0,0,0.10)',
        modal:  '0 8px 32px 0 rgba(0,0,0,0.14)',
      }
    },
  },
  plugins: [],
}

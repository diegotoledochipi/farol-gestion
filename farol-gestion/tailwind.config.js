/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        farol: {
          amber:   '#C8860A',
          gold:    '#E6A817',
          dark:    '#1A1208',
          ink:     '#2C1F05',
          paper:   '#FAF6EE',
          mist:    '#F0E9D8',
          border:  '#DDD0B3',
          green:   '#2D6A4F',
          yellow:  '#B7791F',
          red:     '#9B2335',
          greenBg: '#D1FAE5',
          yellowBg:'#FEF3C7',
          redBg:   '#FEE2E2',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
      }
    },
  },
  plugins: [],
}

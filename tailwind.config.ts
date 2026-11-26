import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Nunito', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF'
        },
        emeraldPop: {
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669'
        },
        amberPop: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706'
        }
      },
      boxShadow: {
        card: '0 2px 10px rgba(15, 23, 42, 0.05)',
        soft: '0 8px 24px rgba(37, 99, 235, 0.12)'
      }
    }
  }
}

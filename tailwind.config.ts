import forms from '@tailwindcss/forms';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      transitionDelay: {
        25: '25ms',
        50: '50ms',
      },
    },
  },
  plugins: [forms],
};

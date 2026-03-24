import { heroui } from '@heroui/react';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [heroui()],
};

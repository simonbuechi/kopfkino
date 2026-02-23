import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                primary: colors.slate,
                accent: {
                    DEFAULT: colors.fuchsia[500],
                    hover: colors.fuchsia[600],
                },
                danger: colors.red,
            }
        },
    },
    plugins: [],
}

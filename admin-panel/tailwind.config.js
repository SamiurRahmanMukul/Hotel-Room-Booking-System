/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: {
      xs: '480px', // => @media (min-width: 480px) { ... }
      sm: '576px', // => @media (min-width: 576px) { ... }
      md: '768px', // => @media (min-width: 768px) { ... }
      lg: '992px', // => @media (min-width: 992px) { ... }
      xl: '1200px', // => @media (min-width: 1200px) { ... }
      xxl: '1600px' // => @media (min-width: 1600px) { ... }
    },
    extend: {
      colors: {
        'color-primary': '#2563eb',
        'color-secondary': '#1d4ed8',
        'color-default': '#5189F5',
        'color-agent': '#613659',
        'color-success': '#45d175',
        'color-warning': '#f59e0b',
        'color-error': '#ff0000',
        'bg-white': '#ffffff',
        'bg-black': '#1e1e1e',
        'bg-gray': '#383838',
        'txt-white': '#f5f5f5',
        'txt-black': '#000000',
        'txt-grey': '#374151'
      },
      fontFamily: {
        'body-font': ['Inter', 'sans-serif'],
        'text-font': ['Poppins', 'serif']
      },
      fontSize: {
        'h1-font-size': '2rem',
        'h2-font-size': '1.5rem',
        'h3-font-size': '1.17rem',
        'h4-font-size': '1rem',
        'normal-font-size': '0.938rem',
        'small-font-size': '0.813rem',
        'smaller-font-size': '0.75rem',
        'tiny-font-size': '0.625rem'
      },
      fontWeight: {
        'font-normal': '400',
        'font-medium': '500',
        'font-semi-bold': '600',
        'font-bold': '800'
      },
      zIndex: {
        'z-normal': '1',
        'z-tooltip': '10',
        'z-fixed': '100'
      }
    }
  },
  plugins: []
};

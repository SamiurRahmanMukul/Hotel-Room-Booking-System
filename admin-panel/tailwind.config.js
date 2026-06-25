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
        // brand
        'color-primary': '#853953', // wine — primary CTA, links, active sidebar item
        'color-secondary': '#612D53', // deep wine — hover, headers, focus
        'color-default': '#612D53',
        'color-agent': '#612D53',
        'color-success': '#3F7D58',
        'color-warning': '#C8923A',
        'color-error': '#A4243B',
        // surface
        'bg-white': '#ffffff',
        'bg-black': '#2C2C2C', // charcoal — sidebar
        'bg-gray': '#F3F4F4', // page background
        // text
        'txt-white': '#ffffff',
        'txt-black': '#2C2C2C',
        'txt-grey': '#6B6B6B'
      },
      fontFamily: {
        // Inter everywhere — loaded as a webfont (Google Fonts)
        'body-font': ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        'text-font': ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        // Inter Tight for tables — denser, designed for compact tabular data
        'table-font': ['"Inter Tight"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif']
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

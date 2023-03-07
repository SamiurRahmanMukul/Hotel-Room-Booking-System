module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: [
    'plugin:react/recommended',
    'plugin:@next/next/recommended',
    'airbnb'
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  plugins: ['react'],
  rules: {
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'jsx-a11y/label-has-associated-control': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'react/jsx-props-no-spreading': 'off',
    'no-unsafe-optional-chaining': 'off',
    'jsx-quotes': [1, 'prefer-single'],
    'comma-dangle': ['error', 'never'],
    'react/react-in-jsx-scope': 'off',
    '@next/next/no-img-element': 'off',
    'react/forbid-prop-types': 'off',
    'no-param-reassign': 'off',
    'no-nested-ternary': 'off',
    'react/prop-types': 'off',
    'linebreak-style': 'off',
    'max-len': 'off'
  }
};

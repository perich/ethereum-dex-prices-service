module.exports = {
  env: {
    node: true,
    es6: true,
    'jest/globals': true,
  },
  extends: ['airbnb-base', 'plugin:jest/recommended'],
  plugins: ['jest'],
  rules: {
    'comma-dangle': 'off',
    'function-paren-newline': 'off',
    'object-curly-newline': 'off',
    'arrow-parens': 'off',
    'no-console': 'off',
    indent: 'off',
    'no-continue': 'off',
    'no-use-before-define': 'off',
    'no-mixed-operators': 'off',
    'max-len': 'off',
    'implicit-arrow-linebreak': 'off',
    'no-underscore-dangle': 'off',
    semi: ['error', 'never'],
  },
}

module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: ['airbnb-base'],
  rules: {
    'comma-dangle': 'off',
    'function-paren-newline': 'off',
    'object-curly-newline': 'off',
    'arrow-parens': 'off',
    'no-console': 'off',
    'no-continue': 'off',
    'no-use-before-define': 'off',
    'no-mixed-operators': 'off',
    'max-len': 'off',
    'implicit-arrow-linebreak': 'off',
    'no-underscore-dangle': 'off',
    semi: ['error', 'never'],
  },
}

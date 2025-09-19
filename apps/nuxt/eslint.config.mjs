import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  extends: ['plugin:prettier/recommended'],
  rules: {
    // Custom rules can be added here
    // 'vue/html-self-closing': 'off',
  },
});

import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt({
  rules: {
    'vue/html-self-closing': [
      'warn',
      {
        html: {
          void: 'always', // allow <input /> — matches Prettier
          normal: 'never',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
  },
});

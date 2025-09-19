import nuxt from "@nuxt/eslint-config";

export default [
  ...nuxt(), // invoke it so you get a config object
  {
    rules: {
      // Custom rules can be added here
      //   'vue/multi-word-component-names': 'off',
    },
  },
];

import canvaPlugin from "@canva/app-eslint-plugin";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "**/*.d.ts", "**/*.config.*"],
  },
  ...canvaPlugin.configs.apps,
  {
    settings: {
      jest: {
        version: "29.7.0",
      },
    },
  },
];

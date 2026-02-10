import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
  ],
  framework: "@storybook/react-vite",
  viteFinal(config) {
    // Strip VitePWA plugin — it crashes outside the app context
    config.plugins = config.plugins?.filter((plugin) => {
      const name =
        plugin && typeof plugin === "object" && "name" in plugin
          ? (plugin as { name: string }).name
          : "";
      return !name.startsWith("vite-plugin-pwa");
    });

    // Strip rollup-plugin-visualizer (not needed for Storybook)
    config.plugins = config.plugins?.filter((plugin) => {
      const name =
        plugin && typeof plugin === "object" && "name" in plugin
          ? (plugin as { name: string }).name
          : "";
      return name !== "visualizer";
    });

    return config;
  },
};

export default config;

import type { Preview, ReactRenderer } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { CurrencyProvider } from "../src/features/currency/components/CurrencyProvider";
import i18n from "../src/i18n/config";
import React from "react";

// Tailwind CSS
import "../src/index.css";

// Force Spanish locale for consistency
i18n.changeLanguage("es");

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
    a11y: {
      test: "todo",
    },
  },
  decorators: [
    // Wrap every story with providers (same pattern as test-utils.tsx)
    (Story) =>
      React.createElement(
        I18nextProvider,
        { i18n },
        React.createElement(
          BrowserRouter,
          null,
          React.createElement(
            CurrencyProvider,
            null,
            React.createElement(Story)
          )
        )
      ),
    // Dark mode toggle via toolbar
    withThemeByClassName<ReactRenderer>({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;

import React from "react";
import { AppI18nProvider } from "@canva/app-i18n-kit";
import { AppUiProvider } from "@canva/app-ui-kit";
import type { DesignEditorIntent } from "@canva/intents/design";
import { auth } from "@canva/user";
import { createRoot } from "react-dom/client";
import { App } from "../../app";
import "@canva/app-ui-kit/styles.css";
import "../../styles.css";

async function render() {
  const container = document.getElementById("root") || createRootElement();
  const root = createRoot(container);
  const oauth = auth.initOauth();
  root.render(
    <AppI18nProvider>
      <AppUiProvider>
        <App oauth={oauth} />
      </AppUiProvider>
    </AppI18nProvider>,
  );
}

function createRootElement() {
  const element = document.createElement("div");
  element.id = "root";
  document.body.appendChild(element);
  return element;
}

const designEditor: DesignEditorIntent = { render };
export default designEditor;

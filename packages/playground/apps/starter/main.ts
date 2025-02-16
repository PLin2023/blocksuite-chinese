/// <reference types="./env.d.ts" />
import '@blocksuite/blocks';
import '@blocksuite/presets';
import './components/start-panel.js';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { TestUtils } from '@blocksuite/blocks';
import { AffineSchemas } from '@blocksuite/blocks/models';
import type { EditorHost } from '@blocksuite/lit';
import { CopilotPanel } from '@blocksuite/presets';
import type { DocProvider, Page } from '@blocksuite/store';
import { Job, Workspace } from '@blocksuite/store';

import { CustomFramePanel } from './components/custom-frame-panel.js';
import { CustomOutlinePanel } from './components/custom-outline-panel.js';
import { DebugMenu } from './components/debug-menu.js';
import { LeftSidePanel } from './components/left-side-panel.js';
import { PagesPanel } from './components/pages-panel.js';
import { SidePanel } from './components/side-panel.js';
import type { InitFn } from './data';
import {
  createEditor,
  createWorkspaceOptions,
  defaultMode,
  initParam,
  isE2E,
} from './utils.js';

const options = createWorkspaceOptions();

// Subscribe for page update and create editor after page loaded.
function subscribePage(workspace: Workspace) {
  workspace.slots.pageAdded.once(pageId => {
    if (typeof globalThis.targetPageId === 'string') {
      if (pageId !== globalThis.targetPageId) {
        // if there's `targetPageId` which not same as the `pageId`
        return;
      }
    }
    const app = document.getElementById('app');
    if (!app) return;

    const page = workspace.getPage(pageId) as Page;

    const editor = createEditor(page, app);
    editor.slots.pageLinkClicked.on(({ pageId }) => {
      const target = page.workspace.getPage(pageId);
      if (!target) {
        throw new Error(`Failed to jump to page ${pageId}`);
      }
      editor.page = target;
    });
    const debugMenu = new DebugMenu();
    const outlinePanel = new CustomOutlinePanel();
    const framePanel = new CustomFramePanel();
    const copilotPanelPanel = new CopilotPanel();
    const sidePanel = new SidePanel();
    const leftSidePanel = new LeftSidePanel();
    const pagesPanel = new PagesPanel();

    debugMenu.workspace = workspace;
    debugMenu.editor = editor;
    debugMenu.mode = defaultMode;
    debugMenu.outlinePanel = outlinePanel;
    debugMenu.framePanel = framePanel;
    debugMenu.copilotPanel = copilotPanelPanel;
    debugMenu.sidePanel = sidePanel;
    debugMenu.leftSidePanel = leftSidePanel;
    debugMenu.pagesPanel = pagesPanel;

    outlinePanel.editor = editor;
    copilotPanelPanel.editor = editor;
    framePanel.editor = editor;
    pagesPanel.editor = editor;

    document.body.appendChild(debugMenu);
    document.body.appendChild(outlinePanel);
    document.body.appendChild(sidePanel);
    document.body.appendChild(leftSidePanel);
    document.body.appendChild(framePanel);

    window.editor = editor;
    window.page = page;
  });
}

export async function initPageContentByParam(
  workspace: Workspace,
  param: string,
  pageId: string
) {
  const functionMap = new Map<
    string,
    (workspace: Workspace, id: string) => void
  >();
  Object.values(
    (await import('./data/index.js')) as Record<string, InitFn>
  ).forEach(fn => functionMap.set(fn.id, fn));
  // Load the preset playground documentation when `?init` param provided
  if (param === '') {
    param = 'preset';
  }

  // Load built-in init function when `?init=heavy` param provided
  if (functionMap.has(param)) {
    functionMap.get(param)?.(workspace, pageId);
    const page = workspace.getPage(pageId);
    await page?.load();
    page?.resetHistory();
    return;
  }
}

async function main() {
  if (window.workspace) return;

  const workspace = new Workspace(options);
  window.workspace = workspace;
  window.job = new Job({ workspace });
  window.blockSchemas = AffineSchemas;
  window.Y = Workspace.Y;
  Object.defineProperty(globalThis, 'host', {
    get() {
      return document.querySelector('editor-host') as EditorHost;
    },
  });

  const syncProviders = async (providers: DocProvider[]) => {
    for (const provider of providers) {
      if ('active' in provider) {
        provider.sync();
        await provider.whenReady;
      } else if ('passive' in provider) {
        provider.connect();
      }
    }
  };

  await syncProviders(workspace.providers);

  workspace.slots.pageAdded.on(async pageId => {
    const page = workspace.getPage(pageId) as Page;
    await page.load();
  });

  window.testUtils = new TestUtils();

  // In E2E environment, initial state should be generated by test case,
  // instead of using this default setup.
  if (isE2E) return;

  subscribePage(workspace);
  if (initParam !== null) {
    await initPageContentByParam(workspace, initParam, 'page:home');
    return;
  }

  // Open default examples list when no `?init` param is provided
  const exampleList = document.createElement('start-panel');
  workspace.slots.pageAdded.once(() => exampleList.remove());
  document.body.prepend(exampleList);
}

main().catch(console.error);

import './../button.js';

import type { BlockStdScope } from '@blocksuite/block-std';
import { WithDisposable } from '@blocksuite/lit';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { BookmarkBlockModel } from '../../../bookmark-block/bookmark-model.js';
import type { EmbedFigmaModel } from '../../../embed-figma-block/embed-figma-model.js';
import type { EmbedGithubModel } from '../../../embed-github-block/embed-github-model.js';
import type { EmbedLinkedDocModel } from '../../../embed-linked-doc-block/embed-linked-doc-model.js';
import type { EmbedYoutubeModel } from '../../../embed-youtube-block/embed-youtube-model.js';
import type { EmbedCardStyle } from '../../types.js';
import { getEmbedCardIcons } from '../../utils/url.js';

@customElement('embed-card-style-menu')
export class EmbedCardStyleMenu extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      border-radius: 8px;
      padding: 8px;
      gap: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-shadow-2);
    }

    icon-button {
      padding: var(--1, 0px);
    }

    icon-button.selected {
      border: 1px solid var(--affine-brand-color);
    }
  `;

  @property({ attribute: false })
  model!:
    | BookmarkBlockModel
    | EmbedGithubModel
    | EmbedYoutubeModel
    | EmbedFigmaModel
    | EmbedLinkedDocModel;

  @property({ attribute: false })
  std!: BlockStdScope;

  @property({ attribute: false })
  abortController!: AbortController;

  private _setEmbedCardStyle(style: EmbedCardStyle) {
    this.model.page.updateBlock(this.model, { style });
    this.requestUpdate();
    this.abortController.abort();
  }

  override render() {
    const { EmbedCardHorizontalIcon, EmbedCardListIcon } = getEmbedCardIcons();
    return html`
      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.model.style === 'horizontal',
        })}
        @click=${() => this._setEmbedCardStyle('horizontal')}
      >
        ${EmbedCardHorizontalIcon}
        <affine-tooltip .offset=${4}
          >${'Large horizontal style'}</affine-tooltip
        >
      </icon-button>

      <icon-button
        width="76px"
        height="76px"
        class=${classMap({
          selected: this.model.style === 'list',
        })}
        @click=${() => this._setEmbedCardStyle('list')}
      >
        ${EmbedCardListIcon}
        <affine-tooltip .offset=${4}
          >${'Small horizontal style'}</affine-tooltip
        >
      </icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'embed-card-style-menu': EmbedCardStyleMenu;
  }
}

import { customElement } from 'aurelia'
import { UiScrollArea } from '@/registry/default/ui/scroll-area'

const TEMPLATE = `
<ui-scroll-area orientation="horizontal" class="w-96 rounded-md border whitespace-nowrap">
  <div class="flex w-max space-x-4 p-4">
    <figure repeat.for="art of artworks" class="shrink-0">
      <div class="bg-muted flex h-40 w-36 items-center justify-center overflow-hidden rounded-md text-4xl">
        \${art.emoji}
      </div>
      <figcaption class="text-muted-foreground pt-2 text-xs">
        Work by <span class="text-foreground font-semibold">\${art.artist}</span>
      </figcaption>
    </figure>
  </div>
</ui-scroll-area>
`

@customElement({
  name: 'scroll-area-horizontal',
  template: TEMPLATE,
  dependencies: [UiScrollArea],
})
export class ScrollAreaHorizontal {
  artworks = [
    { artist: 'Ornella Binni', emoji: '🌅' },
    { artist: 'Tom Byrom', emoji: '🏔️' },
    { artist: 'Vladimir Malyavko', emoji: '🌊' },
    { artist: 'Ava Chen', emoji: '🌸' },
    { artist: 'Liam Osei', emoji: '🌌' },
    { artist: 'Mia Kato', emoji: '🍂' },
  ]
}

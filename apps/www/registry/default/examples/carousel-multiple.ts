import { customElement } from 'aurelia'
import {
  UiCarousel,
  UiCarouselContent,
  UiCarouselItem,
  UiCarouselPrevious,
  UiCarouselNext,
} from '@/registry/default/ui/carousel'
import { UiCard, UiCardContent } from '@/registry/default/ui/card'

const TEMPLATE = `
<ui-carousel label="Multiple item carousel" opts.bind="{ align: 'start' }" class="w-full max-w-sm">
  <ui-carousel-content>
    <ui-carousel-item repeat.for="n of numbers" class="md:basis-1/2 lg:basis-1/3">
      <div class="p-1">
        <ui-card>
          <ui-card-content class="flex aspect-square items-center justify-center p-6">
            <span class="text-2xl font-semibold">\${n}</span>
          </ui-card-content>
        </ui-card>
      </div>
    </ui-carousel-item>
  </ui-carousel-content>
  <ui-carousel-previous></ui-carousel-previous>
  <ui-carousel-next></ui-carousel-next>
</ui-carousel>
`

@customElement({
  name: 'carousel-multiple',
  template: TEMPLATE,
  dependencies: [
    UiCarousel,
    UiCarouselContent,
    UiCarouselItem,
    UiCarouselPrevious,
    UiCarouselNext,
    UiCard,
    UiCardContent,
  ],
})
export class CarouselMultiple {
  numbers = [1, 2, 3, 4, 5]
}

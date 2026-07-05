import { customElement } from 'aurelia'

// Typography is a class recipe, not a component — copy the classes you need.
const TEMPLATE = `
<div class="max-w-2xl">
  <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
    Taxing laughter: the joke tax chronicles
  </h1>
  <p class="text-muted-foreground text-xl leading-7 [&:not(:first-child)]:mt-6">
    Once upon a time, in a far-off land, there was a very lazy king who spent
    all day lounging on his throne.
  </p>
  <h2 class="mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
    The king's plan
  </h2>
  <p class="leading-7 [&:not(:first-child)]:mt-6">
    The king thought long and hard, and finally came up with
    <a href="#" class="text-primary font-medium underline underline-offset-4">a brilliant plan</a>:
    he would tax the jokes in the kingdom.
  </p>
  <blockquote class="mt-6 border-l-2 pl-6 italic">
    "After all," he said, "everyone enjoys a good joke, so it's only fair
    that they should pay for the privilege."
  </blockquote>
  <h3 class="mt-8 scroll-m-20 text-2xl font-semibold tracking-tight">The joke tax</h3>
  <ul class="my-6 ml-6 list-disc [&>li]:mt-2">
    <li>1st level of puns: 5 gold coins</li>
    <li>2nd level of jokes: 10 gold coins</li>
    <li>3rd level of one-liners: 20 gold coins</li>
  </ul>
  <p class="text-muted-foreground text-sm leading-7">
    The people of the kingdom, feeling uneasy, gathered to discuss the tax.
  </p>
</div>
`

@customElement({ name: 'typography-demo', template: TEMPLATE })
export class TypographyDemo {}

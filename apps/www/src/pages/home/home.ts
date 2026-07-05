import { buttonVariants } from '@/registry/default/ui/button'

export class Home {
  readonly primaryCta = buttonVariants({ size: 'lg' })
  readonly secondaryCta = buttonVariants({ variant: 'outline', size: 'lg' })
}

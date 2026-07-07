import { LoginForm } from '@/registry/default/blocks/login-01/login-01'
import loginSource from '@/registry/default/blocks/login-01/login-01.ts?raw'
import { DashboardPage } from '@/registry/default/blocks/dashboard-01/dashboard-01'
import dashboardSource from '@/registry/default/blocks/dashboard-01/dashboard-01.ts?raw'
import { SettingsPage } from '@/registry/default/blocks/settings-01/settings-01'
import settingsSource from '@/registry/default/blocks/settings-01/settings-01.ts?raw'

export interface BlockDoc {
  name: string
  title: string
  description: string
  component: unknown
  source: string
}

export class Blocks {
  readonly blocks: BlockDoc[] = [
    {
      name: 'login-01',
      title: 'Login',
      description: 'A simple login form in a card: email, password, social login and sign-up link.',
      component: LoginForm,
      source: loginSource,
    },
    {
      name: 'dashboard-01',
      title: 'Dashboard',
      description:
        'A dashboard shell: sidebar with navigation, breadcrumb header, stat cards and a chart.',
      component: DashboardPage,
      source: dashboardSource,
    },
    {
      name: 'settings-01',
      title: 'Settings',
      description: 'A settings page: profile fields, a timezone select and notification switches.',
      component: SettingsPage,
      source: settingsSource,
    },
  ]
}

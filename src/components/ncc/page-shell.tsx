import type { ReactNode } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

type NccPageShellProps = {
  children: ReactNode
  fixed?: boolean
  fluid?: boolean
}

export function NccPageShell({ children, fixed, fluid }: NccPageShellProps) {
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>
      <Main fixed={fixed} fluid={fluid}>
        {children}
      </Main>
    </>
  )
}

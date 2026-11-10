import { cn, initials } from '@/lib/utils'
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Ellipsis,
  EyeOff,
  FileChartColumnIncreasing,
  FileSearch,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppSelector } from '@/app/store'
import { usePermissionCheck } from '@/features/auth/use-permission'
import { useSignOut } from '@/features/auth/use-sign-out'
import logo from '@/assets/testify-logo.png'

type NavItem = {
  label: string
  icon: LucideIcon
  href: string
  /** View permission that shows the item. */
  permission: string
  end?: boolean
  filled?: boolean
}
const navigation: NavItem[] = [
  {
    label: 'Overview',
    permission: 'overview:view',
    icon: LayoutDashboard,
    href: '/',
    end: true,
    filled: true,
  },
  {
    label: 'Moderation Queue',
    permission: 'moderation:view',
    icon: Flag,
    href: '/moderation',
    filled: true,
  },
  {
    label: 'Reports',
    permission: 'reports:view',
    icon: FileChartColumnIncreasing,
    href: '/reports',
  },
  { label: 'Users', permission: 'users:view', icon: Users, href: '/users', filled: true },
  { label: 'Audit Log', permission: 'audit:view', icon: FileSearch, href: '/audit-log' },
  { label: 'Hidden Content', permission: 'hidden:view', icon: EyeOff, href: '/hidden-content' },
  { label: 'Roles & Permissions', permission: 'roles:view', icon: ShieldCheck, href: '/roles' },
  { label: 'Staff Management', permission: 'staff:view', icon: UserCog, href: '/staff' },
  { label: 'Settings', permission: 'settings:view', icon: Settings, href: '/settings' },
]

const titleClass = 'truncate text-[26px] leading-[46px] font-bold tracking-[-0.5px] sm:text-[34px]'
const menuContentClass = 'border-tf-line bg-tf-card text-white font-dm-sans'
const menuItemClass = 'text-[14px] focus:bg-tf-field focus:text-white'

export function AdminLayout({
  children,
  title,
  backTo,
  eyebrow,
}: {
  children: ReactNode
  /** Page heading shown in the top bar. */
  title: ReactNode
  /** Turns the heading into a back link (e.g. “← Back to Report”). */
  backTo?: string
  /** Small breadcrumb shown above the heading (Overview). */
  eyebrow?: string
}) {
  const user = useAppSelector((state) => state.auth.session?.user)
  const can = usePermissionCheck()
  const [menuOpen, setMenuOpen] = useState(false)
  const signOut = useSignOut()
  const logout = () => void signOut()
  const userInitials = initials(user?.name)

  const sidebarContent = (
    <>
      <Link
        to="/"
        className="mx-auto block w-fit shrink-0 pt-11 pb-[29px]"
        aria-label="Testify home"
      >
        <img src={logo} alt="Testify" width={172} height={56} />
      </Link>
      <div className="mx-[30px] h-px shrink-0 bg-tf-rule" />
      <nav aria-label="Main navigation" className="flex flex-col gap-5 px-[30px] pt-[35px]">
        <p className="pl-[3px] text-[12px] leading-[15px] font-semibold text-tf-periwinkle">
          WORKSPACE
        </p>
        {navigation
          .filter((item) => can(item.permission))
          .map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-[14px] rounded-[8px] pl-[18px] text-[15px] transition-colors',
                  isActive
                    ? 'bg-tf-field font-medium text-white [&_svg]:text-tf-lime'
                    : 'text-tf-nav hover:bg-tf-field/50 hover:text-[#8b909a]',
                )
              }
            >
              <item.icon
                className="size-5"
                aria-hidden
                fill={item.filled ? 'currentColor' : 'none'}
                strokeWidth={item.filled ? 1.5 : 2}
              />
              {item.label}
            </NavLink>
          ))}
      </nav>
      <div className="mt-auto px-6 pt-10 pb-[23px]">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-[14px] pb-[41px] pl-[24px] text-[15px] text-tf-red hover:opacity-90"
        >
          <LogOut className="size-5" aria-hidden />
          Log Out
        </button>
        <div className="mb-[20px] h-px bg-tf-rule" />
        <div className="flex h-[72px] items-center gap-2 rounded-[16px] bg-tf-chip pr-[18px] pl-[20px]">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-tf-page text-[11px] text-white">
            {userInitials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] leading-4 font-semibold text-white">
              {user?.name}
            </span>
            <span className="block truncate text-[11px] leading-4 text-tf-silver">
              {user?.role || 'Administrator'}
            </span>
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account options"
              className="grid size-7 place-items-center rounded-full text-white hover:bg-white/10"
            >
              <Ellipsis className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={menuContentClass}>
              <DropdownMenuItem asChild className={menuItemClass}>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={logout} className={menuItemClass}>
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-dvh bg-tf-page font-dm-sans text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-[290px] flex-col overflow-y-auto bg-tf-panel lg:flex">
        {sidebarContent}
      </aside>
      <div className="lg:pl-[290px]">
        <header className="flex items-center justify-between gap-4 px-4 py-6 sm:px-8 lg:h-[148px] lg:items-start lg:px-[60px] lg:pt-[70px] lg:pb-0">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="grid size-10 place-items-center rounded-full bg-tf-panel lg:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <div className="relative min-w-0">
              {eyebrow && (
                <p className="flex items-center gap-2 text-[14px] leading-[18px] text-[#707eae] lg:absolute lg:bottom-full lg:mb-[-1px] lg:whitespace-nowrap">
                  <span className="size-2 rounded-full bg-tf-green" aria-hidden />
                  {eyebrow}
                </p>
              )}
              {backTo ? (
                <Link
                  to={backTo}
                  className="flex items-center gap-[10px] hover:opacity-90"
                  aria-label={typeof title === 'string' ? title : undefined}
                >
                  <ArrowLeft className="size-[34px] shrink-0" strokeWidth={2.25} aria-hidden />
                  <h1 className={titleClass}>{title}</h1>
                </Link>
              ) : (
                <h1 className={titleClass}>{title}</h1>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            <label className="mr-[33px] hidden h-[46px] w-[340px] items-center gap-[10px] rounded-full bg-tf-panel px-6 xl:flex">
              <Search className="size-[18px] shrink-0 text-white" aria-hidden />
              <input
                type="search"
                aria-label="Search"
                placeholder="Search"
                className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-tf-slate"
              />
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Notifications"
                className="relative mr-4 grid size-[46px] place-items-center rounded-full bg-tf-panel text-white sm:mr-[32px]"
              >
                <Bell className="size-5" fill="currentColor" />
                <span className="absolute top-[11px] right-[13px] size-[7px] rounded-full bg-[#f2353b] ring-[1.5px] ring-white" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn(menuContentClass, 'p-4 text-sm')}>
                You’re all caught up.
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="flex items-center gap-[10px] rounded-full"
              >
                <span className="grid size-[46px] place-items-center rounded-full bg-tf-lime text-[15px] font-medium text-tf-page">
                  {userInitials}
                </span>
                <ChevronDown className="size-[18px] text-[#f0f0f0]" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={menuContentClass}>
                <div className="px-2 py-1.5 text-[13px]">
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-tf-muted">{user?.email}</p>
                </div>
                <DropdownMenuItem onSelect={logout} className={menuItemClass}>
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="px-4 pb-10 sm:px-8 lg:px-[60px] lg:pb-[70px]">{children}</main>
      </div>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          showCloseButton={false}
          className="inset-y-0 left-0 flex h-dvh w-[290px] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 bg-tf-panel p-0 font-dm-sans text-white sm:max-w-none"
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <DialogDescription className="sr-only">
            Testify administration navigation
          </DialogDescription>
          <div
            className="flex min-h-full flex-col"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('a')) setMenuOpen(false)
            }}
          >
            {sidebarContent}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

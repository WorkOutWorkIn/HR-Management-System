import { Button, Chip } from '@heroui/react';
import { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROLES, hasAnyRole } from '@hrms/shared';
import { moduleRegistry } from '@/constants/module-registry';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2.3M12 19.2v2.3M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20 15.2A7.5 7.5 0 1110.8 4 8.5 8.5 0 0020 15.2z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12H9" />
      <path d="M5 20h5a2 2 0 002-2v-1" />
      <path d="M12 7V6a2 2 0 00-2-2H5" />
    </svg>
  );
}

function ModuleIcon({ moduleKey }) {
  const paths = {
    dashboard: (
      <>
        <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />
      </>
    ),
    profile: (
      <>
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
        <path d="M4 20a8 8 0 0116 0" />
      </>
    ),
    employees: (
      <>
        <path d="M7.5 11a3 3 0 100-6 3 3 0 000 6zM16.5 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
        <path d="M2.5 20a5 5 0 0110 0M13 20a4 4 0 018 0" />
      </>
    ),
    leave: (
      <>
        <path d="M6 3v3M18 3v3M4 8h16" />
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    'org-chart': (
      <>
        <rect x="4" y="4" width="5" height="5" rx="1" />
        <rect x="15" y="4" width="5" height="5" rx="1" />
        <rect x="9.5" y="15" width="5" height="5" rx="1" />
        <path d="M6.5 9v3h10V9M12 12v3" />
      </>
    ),
    performance: (
      <>
        <path d="M5 17l4-4 3 3 6-7" />
        <path d="M18 9h1v4" />
        <circle cx="5" cy="17" r="1" />
        <circle cx="9" cy="13" r="1" />
        <circle cx="12" cy="16" r="1" />
      </>
    ),
    salary: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M7 12h10M7 9h4M13 15h4" />
      </>
    ),
    payroll: (
      <>
        <path d="M6 3h10l2 2v16H6z" />
        <path d="M16 3v3h3M9 11h6M9 15h6" />
      </>
    ),
  };

  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      {paths[moduleKey] || <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

function SidebarNavItem({ item, isExpanded, onNavigate }) {
  return (
    <NavLink
      key={item.href}
      to={item.href}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-base transition-all duration-200',
          isActive
            ? 'bg-cyan-400/12 text-cyan-700 shadow-[inset_3px_0_0_0_rgba(34,211,238,0.8)] dark:text-cyan-200'
            : 'text-[var(--app-muted)] hover:bg-white/[0.04] hover:text-[var(--app-foreground-strong)]',
          isExpanded ? 'justify-start' : 'justify-center px-3',
        ].join(' ')
      }
      title={item.label}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.03] text-current transition group-hover:bg-white/[0.06]">
        <ModuleIcon moduleKey={item.key} />
      </span>
      <span
        className={[
          'truncate whitespace-nowrap transition-all duration-200',
          isExpanded ? 'max-w-[180px] opacity-100 translate-x-0' : 'max-w-0 -translate-x-2 opacity-0',
        ].join(' ')}
      >
        {item.label}
      </span>
    </NavLink>
  );
}

export function AppShell() {
  const { signOut, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const visibleModules = useMemo(
    () =>
      moduleRegistry.filter(
        (item) => !item.allowedRoles || hasAnyRole(user?.role, item.allowedRoles),
      ),
    [user?.role],
  );
  const isDesktopSidebarExpanded = isSidebarPinned || isSidebarHovered;
  const isSidebarExpanded = isSidebarOpen || isDesktopSidebarExpanded;
  const sidebarWidthClass = isSidebarExpanded ? 'w-[288px]' : 'w-[108px]';

  const closeMobileSidebar = () => setIsSidebarOpen(false);

  const handleDesktopHoverEnter = () => {
    setIsSidebarHovered(true);
  };

  const handleDesktopHoverLeave = () => {
    if (!isSidebarPinned) {
      setIsSidebarHovered(false);
    }
  };

  const handleDesktopFocus = () => {
    setIsSidebarHovered(true);
  };

  const handleDesktopBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget) && !isSidebarPinned) {
      setIsSidebarHovered(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-foreground)] transition-colors duration-300">
      <div className="flex min-h-screen">
        <div
          className={[
            'fixed inset-0 z-30 bg-[var(--app-overlay)] backdrop-blur-sm transition lg:hidden',
            isSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-[var(--app-border)] bg-[var(--app-sidebar-bg)] backdrop-blur transition-[width,transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0',
            sidebarWidthClass,
            isSidebarExpanded ? 'shadow-[18px_0_48px_rgba(2,12,27,0.42)]' : 'shadow-none',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
          onBlurCapture={handleDesktopBlur}
          onFocusCapture={handleDesktopFocus}
          onMouseEnter={handleDesktopHoverEnter}
          onMouseLeave={handleDesktopHoverLeave}
        >
          <div
            className={[
              'flex items-center border-b border-[var(--app-border)] py-6',
              isSidebarExpanded ? 'justify-between px-6' : 'justify-center px-4',
            ].join(' ')}
          >
            <div
              className={[
                'overflow-hidden transition-all duration-200',
                isSidebarExpanded ? 'max-w-[140px] opacity-100' : 'max-w-0 opacity-0',
              ].join(' ')}
            >
              <p className="text-3xl font-semibold tracking-tight text-[var(--app-foreground-strong)]">
                HRMS
              </p>
            </div>
            <Button
              isIconOnly
              aria-label={
                isSidebarOpen
                  ? 'Collapse sidebar'
                  : isSidebarPinned
                    ? 'Unpin sidebar'
                    : 'Pin sidebar open'
              }
              color="default"
              radius="full"
              variant="bordered"
              aria-pressed={isSidebarPinned}
              className="text-[var(--app-foreground)]"
              title={
                isSidebarOpen
                  ? 'Collapse sidebar'
                  : isSidebarPinned
                    ? 'Unpin sidebar'
                    : 'Pin sidebar open'
              }
              onPress={() => {
                if (isSidebarOpen) {
                  setIsSidebarOpen(false);
                  return;
                }

                setIsSidebarPinned((current) => !current);
              }}
            >
              <MenuIcon />
            </Button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {visibleModules.map((item) => (
              <SidebarNavItem
                key={item.href}
                isExpanded={isSidebarExpanded}
                item={item}
                onNavigate={closeMobileSidebar}
              />
            ))}
          </nav>

          <div className="border-t border-[var(--app-border)] px-4 py-5">
            <button
              type="button"
              onClick={() => signOut()}
              className={[
                'flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-[var(--app-muted)] transition hover:bg-white/[0.04] hover:text-[var(--app-foreground-strong)]',
                isSidebarExpanded ? 'justify-start' : 'justify-center px-3',
              ].join(' ')}
              title="Sign out"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.03]">
                <LogoutIcon />
              </span>
              <span
                className={[
                  'truncate whitespace-nowrap transition-all duration-200',
                  isSidebarExpanded ? 'max-w-[180px] opacity-100 translate-x-0' : 'max-w-0 -translate-x-2 opacity-0',
                ].join(' ')}
              >
                Logout
              </span>
            </button>
          </div>
        </aside>

        <div className="hidden w-[108px] shrink-0 lg:block" />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--app-border)] bg-[var(--app-header-bg)] backdrop-blur transition-colors duration-300">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Button
                  isIconOnly
                  aria-label="Open navigation"
                  color="default"
                  radius="full"
                  variant="light"
                  className="text-[var(--app-foreground)] lg:hidden"
                  onPress={() => setIsSidebarOpen(true)}
                >
                  <MenuIcon />
                </Button>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">HRMS</p>
                  {/* <h1 className="text-xl font-semibold text-white">Foundational Workspace</h1> */}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* <Button isIconOnly color="default" radius="full" variant="light">
                  <BellIcon />
                </Button> */}
                <Button
                  color="default"
                  radius="full"
                  startContent={isDark ? <SunIcon /> : <MoonIcon />}
                  variant="bordered"
                  className="hidden text-[var(--app-foreground)] md:inline-flex"
                  onPress={toggleTheme}
                >
                  {isDark ? 'Light mode' : 'Dark mode'}
                </Button>
                <Button
                  isIconOnly
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  color="default"
                  radius="full"
                  variant="bordered"
                  className="text-[var(--app-foreground)] md:hidden"
                  onPress={toggleTheme}
                >
                  {isDark ? <SunIcon /> : <MoonIcon />}
                </Button>
                {/* <Button isIconOnly color="default" radius="full" variant="light">
                  <CogIcon />
                </Button>
                <Button isIconOnly color="default" radius="full" variant="light">
                  <HelpIcon />
                </Button> */}
                <Chip
                  color={
                    user?.role === ROLES.ADMIN
                      ? 'warning'
                      : user?.role === ROLES.MANAGER
                        ? 'primary'
                        : 'default'
                  }
                  variant="flat"
                  className="hidden md:inline-flex"
                >
                  {user?.role ?? 'Guest'}
                </Chip>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 font-semibold text-cyan-100">
                  {user?.fullName?.charAt(0)?.toUpperCase() || user?.role?.charAt(0) || 'U'}
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

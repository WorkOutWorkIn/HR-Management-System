import { Button, Chip } from '@heroui/react';
import { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROLES, hasAnyRole } from '@hrms/shared';
import { moduleRegistry } from '@/constants/module-registry';
import { useAuth } from '@/hooks/useAuth';

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M15 17H5.5a1 1 0 01-.9-1.45L6 13V9a6 6 0 1112 0v4l1.4 2.55A1 1 0 0118.5 17H15z" />
      <path d="M10 19a2 2 0 004 0" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 8.5A3.5 3.5 0 1112 15.5 3.5 3.5 0 0112 8.5z" />
      <path d="M19.4 15a1 1 0 00.2 1.1l.1.1a2 2 0 010 2.8 2 2 0 01-2.8 0l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a2 2 0 01-4 0v-.2a1 1 0 00-.7-.9 1 1 0 00-1.1.2l-.1.1a2 2 0 01-2.8 0 2 2 0 010-2.8l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4a2 2 0 010-4h.2a1 1 0 00.9-.7 1 1 0 00-.2-1.1l-.1-.1a2 2 0 010-2.8 2 2 0 012.8 0l.1.1a1 1 0 001.1.2 1 1 0 00.6-.9V4a2 2 0 014 0v.2a1 1 0 00.7.9 1 1 0 001.1-.2l.1-.1a2 2 0 012.8 0 2 2 0 010 2.8l-.1.1a1 1 0 00-.2 1.1 1 1 0 00.9.6H20a2 2 0 010 4h-.2a1 1 0 00-.9.7z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9a2.8 2.8 0 115.4 1c0 2-2.7 2.3-2.7 4" />
      <path d="M12 17h.01" />
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

export function AppShell() {
  const { signOut, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const visibleModules = useMemo(
    () =>
      moduleRegistry.filter(
        (item) => !item.allowedRoles || hasAnyRole(user?.role, item.allowedRoles),
      ),
    [user?.role],
  );

  return (
    <div className="min-h-screen bg-[#061018] text-slate-50">
      <div className="flex min-h-screen">
        <div
          className={[
            'fixed inset-0 z-30 bg-slate-950/65 backdrop-blur-sm transition lg:hidden',
            isSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/6 bg-[#0b141c]/95 backdrop-blur transition-all duration-300 lg:static lg:z-0',
            isSidebarCollapsed ? 'w-[92px]' : 'w-[288px]',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          <div className="flex items-center justify-between border-b border-white/6 px-6 py-6">
            <div className={isSidebarCollapsed ? 'hidden' : 'block'}>
              <p className="text-4xl font-semibold tracking-tight text-white">HRMS</p>
            </div>
            <Button
              isIconOnly
              radius="full"
              variant="light"
              className="text-slate-300"
              onPress={() => setIsSidebarCollapsed((current) => !current)}
            >
              <MenuIcon />
            </Button>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {visibleModules.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-base transition',
                    isActive
                      ? 'bg-cyan-400/12 text-cyan-200 shadow-[inset_3px_0_0_0_rgba(34,211,238,0.8)]'
                      : 'text-slate-300 hover:bg-white/[0.04] hover:text-white',
                    isSidebarCollapsed ? 'justify-center px-3' : '',
                  ].join(' ')
                }
                title={item.label}
              >
                <span
                  className={[
                    'inline-flex h-10 w-10 items-center justify-center rounded-2xl',
                    'bg-white/[0.03] text-current group-hover:bg-white/[0.06]',
                  ].join(' ')}
                >
                  <ModuleIcon moduleKey={item.key} />
                </span>
                {isSidebarCollapsed ? null : <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/6 px-4 py-5">
            <button
              type="button"
              onClick={() => signOut()}
              className={[
                'flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-slate-300 transition hover:bg-white/[0.04] hover:text-white',
                isSidebarCollapsed ? 'justify-center px-3' : '',
              ].join(' ')}
              title="Sign out"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.03]">
                <LogoutIcon />
              </span>
              {isSidebarCollapsed ? null : <span>Logout</span>}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/6 bg-[#09131b]/88 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <Button
                  isIconOnly
                  radius="full"
                  variant="light"
                  className="text-slate-200 lg:hidden"
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
                <Button isIconOnly radius="full" variant="light" className="text-slate-300">
                  <BellIcon />
                </Button>
                <Button isIconOnly radius="full" variant="light" className="text-slate-300">
                  <CogIcon />
                </Button>
                <Button isIconOnly radius="full" variant="light" className="text-slate-300">
                  <HelpIcon />
                </Button>
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

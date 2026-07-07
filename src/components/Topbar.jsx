import {
  ChevronDown,
  LogOut,
  Search,
  Settings,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SolidSparklesIcon } from './ui/SolidIcons.jsx';

const menuIcons = {
  switchAccount: UsersRound,
  accountSettings: Settings,
  notificationPreferences: UserRound,
  logout: LogOut,
};

export default function Topbar({
  searchQuery,
  searchScope,
  searchScopes,
  sidebarWidth,
  t,
  userMenuItems,
  onOpenCopilot,
  onSearchQueryChange,
  onSearchScopeChange,
}) {
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const scopeRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (scopeRef.current && !scopeRef.current.contains(event.target)) {
        setScopeMenuOpen(false);
      }

      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectScope(scope) {
    onSearchScopeChange(scope.id);
    setScopeMenuOpen(false);
  }

  const activeSearchScope = searchScopes.find((scope) => scope.id === searchScope) ?? searchScopes[0];

  return (
    <header
      className="fixed right-0 top-0 z-20 flex h-[64px] items-center justify-end border-b border-slate-100 bg-slate-50 px-7 transition-[left] duration-200"
      style={{ left: sidebarWidth }}
    >
      <div className="flex w-full items-center justify-end gap-5">
        <div className="flex w-full max-w-[520px] items-center rounded-full border border-slate-200 bg-white shadow-sm">
          <div ref={scopeRef} className="relative">
            <button
              data-testid="search-scope-button"
              type="button"
              className="flex h-11 min-w-[126px] items-center justify-center gap-2 rounded-l-full border-r border-slate-200 px-4 text-[15px] font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => setScopeMenuOpen((open) => !open)}
              aria-expanded={scopeMenuOpen}
            >
              {activeSearchScope.label}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {scopeMenuOpen ? (
              <div className="absolute left-0 top-[50px] z-40 w-[150px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-menu">
                {searchScopes.map((scope) => (
                  <button
                    key={scope.id}
                    data-testid={`search-scope-option-${scope.id}`}
                    type="button"
                    className={`w-full px-4 py-2 text-left text-sm transition ${
                      scope.id === searchScope
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    onClick={() => selectScope(scope)}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 items-center px-4">
            <input
              data-testid="global-search-input"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className="h-11 min-w-0 flex-1 border-none bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
              placeholder={t.topbar.searchPlaceholder}
              type="search"
            />
            <Search className="h-5 w-5 text-slate-500" />
          </div>
        </div>

        <button
          data-testid="copilot-entry-button"
          type="button"
          className="inline-flex h-11 w-[96px] flex-none items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
          onClick={onOpenCopilot}
          aria-label={t.topbar.copilot}
        >
          <SolidSparklesIcon className="h-4 w-4" />
          {t.topbar.copilot}
        </button>

        <div ref={userRef} className="relative">
          <button
            data-testid="user-menu-button"
            type="button"
            className="flex h-11 items-center gap-3 rounded-full pl-1 pr-2 transition hover:bg-white"
            onClick={() => setUserMenuOpen((open) => !open)}
            aria-expanded={userMenuOpen}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
              A
            </span>
            <span className="text-[15px] font-bold text-slate-800">Angel</span>
          </button>

          {userMenuOpen ? (
            <div className="absolute right-0 top-[50px] z-40 w-[180px] overflow-hidden rounded-lg border border-slate-200 bg-white py-2 shadow-menu">
              {userMenuItems.map((item) => {
                const Icon = menuIcons[item.id] ?? UserRound;

                return (
                  <button
                    key={item.id}
                    data-testid={`user-menu-item-${item.id}`}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4 text-slate-500" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

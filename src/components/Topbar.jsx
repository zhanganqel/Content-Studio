import {
  Bell,
  Check,
  ChevronDown,
  Languages,
  LogOut,
  Search,
  Settings,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import userAvatar from '../assets/user/zhanganqel-avatar.png';
import { locales } from '../i18n/messages.js';
import { SolidSparklesIcon } from './ui/SolidIcons.jsx';
import { useToast } from './ui/Toast.jsx';

// 顶栏承载全局搜索、Copilot 入口和账户菜单；语言状态仍由 App 统一持有。
export default function Topbar({
  locale,
  searchQuery,
  searchScope,
  searchScopes,
  sidebarWidth,
  t,
  onLocaleChange,
  onOpenCopilot,
  onSearchQueryChange,
  onSearchScopeChange,
}) {
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const scopeRef = useRef(null);
  const userRef = useRef(null);
  const toast = useToast({ scope: 'topbar-account-menu' });

  useEffect(() => {
    // 下拉菜单使用外部点击统一关闭，避免搜索范围和账户二级菜单残留。
    function handleClickOutside(event) {
      if (scopeRef.current && !scopeRef.current.contains(event.target)) {
        setScopeMenuOpen(false);
      }

      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserMenuOpen(false);
        setLanguageMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function closeUserMenu() {
    setUserMenuOpen(false);
    setLanguageMenuOpen(false);
  }

  function selectScope(scope) {
    onSearchScopeChange(scope.id);
    setScopeMenuOpen(false);
  }

  function handleUnavailable(message) {
    closeUserMenu();
    toast.info(message);
  }

  function selectLocale(nextLocale) {
    onLocaleChange(nextLocale);
    closeUserMenu();
  }

  const activeSearchScope = searchScopes.find((scope) => scope.id === searchScope) ?? searchScopes[0];
  const activeLocale = locales.find((item) => item.code === locale) ?? locales[0];

  return (
    <header
      className="fixed right-0 top-0 z-20 flex h-[64px] items-center justify-end border-b border-slate-100 bg-slate-50 px-7 transition-[left] duration-200"
      style={{ left: sidebarWidth }}
    >
      <div className="flex w-full items-center justify-end gap-5">
        <div className="flex w-full max-w-[520px] items-center rounded-full border border-slate-200 bg-white shadow-sm">
          {/* 搜索范围和输入框共用同一个搜索状态，由 App 统一持有 */}
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
            className="grid h-11 w-11 place-items-center overflow-hidden rounded-full ring-1 ring-transparent transition hover:ring-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={() => {
              setUserMenuOpen((open) => !open);
              setLanguageMenuOpen(false);
            }}
            aria-expanded={userMenuOpen}
            aria-label={t.topbar.accountMenu}
            title={t.topbar.accountMenu}
          >
            <img className="h-full w-full object-cover" src={userAvatar} alt="" />
          </button>

          {userMenuOpen ? (
            <div className="absolute right-0 top-[52px] z-40 w-[280px] rounded-lg border border-slate-200 bg-white py-2 shadow-menu">
              <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                <img className="h-11 w-11 flex-none rounded-full object-cover" src={userAvatar} alt="" />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold leading-5 text-slate-800">{t.topbar.accountName}</div>
                  <div className="mt-0.5 truncate text-sm leading-5 text-slate-500">{t.topbar.accountEmail}</div>
                </div>
              </div>
              <div className="mx-4 border-t border-slate-100" />

              <div className="pt-2">
                <button
                  data-testid="user-menu-item-accountSettings"
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => handleUnavailable(t.topbar.accountSettingsUnavailable)}
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  {t.userMenu.accountSettings}
                </button>
                <button
                  data-testid="user-menu-item-notificationPreferences"
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => handleUnavailable(t.topbar.notificationPreferencesUnavailable)}
                >
                  <Bell className="h-4 w-4 text-slate-500" />
                  {t.userMenu.notificationPreferences}
                </button>

                <div className="relative">
                  <button
                    data-testid="user-menu-item-language"
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setLanguageMenuOpen((open) => !open)}
                    aria-expanded={languageMenuOpen}
                  >
                    <Languages className="h-4 w-4 text-slate-500" />
                    <span className="min-w-0 flex-1">{t.settings.interfaceLanguage}</span>
                    <span className="text-xs font-medium text-slate-400">{activeLocale.label}</span>
                  </button>

                  {languageMenuOpen ? (
                    <div
                      data-testid="user-language-menu"
                      className="absolute right-[calc(100%+8px)] top-1/2 z-50 w-[150px] -translate-y-1/2 rounded-lg border border-slate-200 bg-white py-2 shadow-menu max-sm:left-0 max-sm:right-auto max-sm:top-[calc(100%+8px)] max-sm:translate-y-0"
                    >
                      {locales.map((item) => {
                        const selected = item.code === locale;

                        return (
                          <button
                            key={item.code}
                            data-testid={`topbar-locale-option-${item.code}`}
                            type="button"
                            className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-medium transition ${
                              selected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                            onClick={() => selectLocale(item.code)}
                          >
                            {item.label}
                            {selected ? <Check className="h-4 w-4" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <button
                  data-testid="user-menu-item-logout"
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => handleUnavailable(t.topbar.logoutUnavailable)}
                >
                  <LogOut className="h-4 w-4 text-slate-500" />
                  {t.userMenu.logout}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

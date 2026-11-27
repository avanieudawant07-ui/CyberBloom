import React, { useState } from 'react';
import {
  BarChart3,
  Cpu,
  History,
  Home,
  Lock,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Overview', icon: Home },
  { id: 'studio', label: 'Sanitization Lab', icon: SlidersHorizontal },
  { id: 'report', label: 'Intelligence Report', icon: BarChart3 },
  { id: 'activity', label: 'Activity History', icon: History },
  { id: 'architecture', label: 'Privacy Architecture', icon: Cpu },
];

export default function SidebarNav({
  activePage,
  onNavigate,
  totalDetected,
  historyCount,
  privacyScore,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelect = (id) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        {/* Brand */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="flex items-center gap-3 px-2 py-1 text-left cursor-pointer group w-full"
        >
          <div className="w-9 h-9 rounded-[10px] bg-[#3B2E6E] text-[#FFFFFF] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-[#EAE6F7]" />
          </div>
          <div>
            <div className="text-[16px] font-semibold tracking-tight text-[#22202B] leading-tight">
              CyberBloom
            </div>
            <div className="text-[11px] text-[#6D6A7C]">
              Local Privacy Workspace
            </div>
          </div>
        </button>

        {/* Navigation Links */}
        <nav aria-label="Workspace navigation" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full cursor-pointer flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-[10px] text-[14px] transition-colors ${
                  isActive
                    ? 'bg-[#EAE6F7] text-[#3B2E6E] font-medium'
                    : 'text-[#6D6A7C] hover:bg-[#F7F6FB] hover:text-[#22202B]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#3B2E6E]' : 'text-[#6D6A7C]'
                    }`}
                  />
                  <span>{item.label}</span>
                </span>

                {item.id === 'studio' && totalDetected > 0 && (
                  <span className="text-[11px] font-medium bg-[#FFFFFF] text-[#3B2E6E] border border-[#E6E2F0] px-2 py-0.5 rounded-full tabular-nums">
                    {totalDetected}
                  </span>
                )}

                {item.id === 'activity' && historyCount > 0 && (
                  <span className="text-[11px] font-medium bg-[#FFFFFF] text-[#6D6A7C] border border-[#E6E2F0] px-2 py-0.5 rounded-full tabular-nums">
                    {historyCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Live Privacy Status Widget */}
      <div className="space-y-3 pt-4 border-t border-[#E6E2F0]">
        <div className="p-3.5 rounded-[12px] bg-[#F7F6FB] border border-[#E6E2F0] space-y-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B7CC8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B2E6E]" />
            </span>
            <span className="text-[12px] font-medium text-[#3B2E6E]">
              Local Processing Active
            </span>
          </div>
          <p className="text-[12px] text-[#6D6A7C] leading-snug">
            All detection, redaction, and IndexedDB storage run inside your
            browser.
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-[#6D6A7C] border-t border-[#E6E2F0]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#8B7CC8]" />
              Zero Network I/O
            </span>
            <span className="font-medium text-[#3B2E6E] tabular-nums">
              {privacyScore}% Cov.
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E6E2F0] px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-[9px] bg-[#3B2E6E] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#EAE6F7]" />
          </div>
          <span className="text-[15px] font-semibold text-[#22202B]">
            CyberBloom
          </span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-[#3B2E6E] bg-[#EAE6F7]/70 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B2E6E]" />
            Local Only
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-[10px] border border-[#E6E2F0] text-[#22202B] hover:bg-[#F7F6FB] cursor-pointer"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#22202B]/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#FFFFFF] border-r border-[#E6E2F0] h-full">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-[#FFFFFF] border-r border-[#E6E2F0] sticky top-0 h-screen overflow-y-auto">
        <NavContent />
      </aside>
    </>
  );
}

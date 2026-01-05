'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ProductMockup() {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Glow effect behind the mockup */}
      <div className="absolute inset-0 bg-gradient-radial from-theme-accent/10 to-transparent blur-3xl" />

      {/* Main window */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative mockup-window border border-theme-border shadow-2xl"
      >
        {/* Title bar */}
        <div className="mockup-titlebar">
          <div className="flex items-center gap-2">
            <span className="mockup-dot-red" />
            <span className="mockup-dot-yellow" />
            <span className="mockup-dot-green" />
          </div>
          <span className="text-xs text-theme-text-tertiary font-mono">Margen - Tax Research</span>
          <div className="w-16" />
        </div>

        {/* Content area */}
        <div className="flex h-[400px] md:h-[500px]">
          {/* Sidebar */}
          <div className="hidden md:flex flex-col w-56 border-r border-theme-border bg-[#151515] p-3">
            <div className="mb-4">
              <div className="text-xs text-theme-text-tertiary uppercase tracking-wider mb-2">Documents</div>
              <SidebarItem active>Form 1040 - 2024</SidebarItem>
              <SidebarItem>Schedule C</SidebarItem>
              <SidebarItem>W-2 Employer</SidebarItem>
              <SidebarItem>1099-NEC</SidebarItem>
            </div>
            <div className="mt-auto">
              <div className="text-xs text-theme-text-tertiary uppercase tracking-wider mb-2">Research</div>
              <SidebarItem>IRC Section 162</SidebarItem>
              <SidebarItem>Home Office Deduction</SidebarItem>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Document viewer area */}
            <div className="flex-1 p-4 border-b border-theme-border overflow-hidden">
              <div className="h-full bg-[#1a1a1a] rounded-lg p-4 overflow-hidden">
                <div className="text-sm text-theme-text-secondary mb-3 font-mono">Form 1040 - U.S. Individual Income Tax Return</div>
                <div className="space-y-2">
                  <FormLine label="Filing Status" value="Married Filing Jointly" />
                  <FormLine label="Total Income" value="$185,420" highlight />
                  <FormLine label="Adjusted Gross Income" value="$162,830" />
                  <FormLine label="Standard Deduction" value="$29,200" />
                  <FormLine label="Taxable Income" value="$133,630" highlight />
                </div>
              </div>
            </div>

            {/* AI Chat panel */}
            <div className="h-48 p-4 bg-[#151515]">
              <div className="text-xs text-theme-text-tertiary mb-3 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-theme-accent animate-pulse" />
                AI Assistant
              </div>
              <ChatMessage type="user">
                Can I deduct my home office expenses?
              </ChatMessage>
              <ChatMessage type="ai">
                Based on IRC Section 280A, you may qualify for the home office deduction if you use a portion of your home{' '}
                <span className="text-theme-accent">exclusively and regularly</span> for business...
                <span className="inline-block ml-1 w-2 h-4 bg-theme-accent animate-typing-cursor" />
              </ChatMessage>
            </div>
          </div>

          {/* Right panel - Citations */}
          <div className="hidden lg:flex flex-col w-64 border-l border-theme-border bg-[#151515] p-3">
            <div className="text-xs text-theme-text-tertiary uppercase tracking-wider mb-3">Sources</div>
            <CitationCard
              title="IRC Section 280A"
              description="Disallowance of certain expenses in connection with business use of home"
            />
            <CitationCard
              title="Publication 587"
              description="Business Use of Your Home (Including Use by Daycare Providers)"
            />
            <CitationCard
              title="Rev. Proc. 2013-13"
              description="Safe harbor for home office deduction"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SidebarItem({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        'px-3 py-2 rounded-md text-sm cursor-pointer transition-colors',
        active
          ? 'bg-theme-card text-theme-text'
          : 'text-theme-text-secondary hover:bg-theme-card hover:text-theme-text'
      )}
    >
      {children}
    </div>
  );
}

function FormLine({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-theme-border-subtle">
      <span className="text-sm text-theme-text-secondary">{label}</span>
      <span className={cn('text-sm font-mono', highlight ? 'text-theme-accent' : 'text-theme-text')}>
        {value}
      </span>
    </div>
  );
}

function ChatMessage({
  type,
  children,
}: {
  type: 'user' | 'ai';
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'text-sm mb-2',
        type === 'user' ? 'text-theme-text-secondary' : 'text-theme-text'
      )}
    >
      <span className={cn('font-medium mr-2', type === 'ai' && 'text-theme-accent')}>
        {type === 'user' ? 'You:' : 'Margen:'}
      </span>
      {children}
    </div>
  );
}

function CitationCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-theme-card border border-theme-border mb-2 hover:border-theme-accent/50 transition-colors cursor-pointer">
      <div className="text-sm font-medium text-theme-text mb-1">{title}</div>
      <div className="text-xs text-theme-text-tertiary line-clamp-2">{description}</div>
    </div>
  );
}

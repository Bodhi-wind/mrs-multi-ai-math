import type { ReactNode } from 'react';
import {
  Compass, Shield, Search, Code2, GitMerge, BookOpen,
  LayoutDashboard, Library, Swords, Users, FileCode2,
  Activity, Plus, ArrowLeft, Play, X, Sparkles,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

export const ROLE_ICONS: Record<string, typeof Compass> = {
  compass: Compass,
  shield: Shield,
  search: Search,
  code: Code2,
  'git-merge': GitMerge,
  'book-open': BookOpen,
};

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'badge-open',
    resolved: 'badge-resolved',
    partial: 'badge-partial',
    contested: 'badge-contested',
    'active-frontier': 'badge-active-frontier',
    active: 'badge-open',
    completed: 'badge-resolved',
    pending: 'badge-field',
    running: 'badge-active-frontier',
    draft: 'badge-field',
  };
  const labels: Record<string, string> = {
    open: '开放',
    resolved: '已解决',
    partial: '部分进展',
    contested: '有争议',
    'active-frontier': '活跃前沿',
    active: '进行中',
    completed: '完成',
    pending: '待开始',
    running: '运行中',
    draft: '草稿',
  };
  return <span className={clsx('badge', map[status] || 'badge-field')}>{labels[status] || status}</span>;
}

export function DiffBar({ n }: { n: number }) {
  return (
    <div className="diff-bar" title={`难度 ${n}/10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={i < n ? 'on' : ''} />
      ))}
    </div>
  );
}

export function Sidebar() {
  const items = [
    { to: '/', icon: LayoutDashboard, label: '总览看板' },
    { to: '/problems', icon: Library, label: '前沿问题库' },
    { to: '/campaigns', icon: Swords, label: '攻克战役' },
    { to: '/roles', icon: Users, label: '多角色系统' },
    { to: '/artifacts', icon: FileCode2, label: '证明工件' },
    { to: '/literature', icon: BookOpen, label: '文献库' },
    { to: '/activity', icon: Activity, label: '活动日志' },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">∫</div>
        <div>
          <h1>MRS Math Lab</h1>
          <p>Multi-Role System</p>
        </div>
      </div>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === '/'}
          className={({ isActive }) => clsx('nav-link', isActive && 'active')}
        >
          <it.icon size={16} />
          {it.label}
        </NavLink>
      ))}
      <div className="sidebar-footer">
        <div style={{ marginBottom: 6, color: 'var(--accent)', fontWeight: 600 }}>多AI协作数学前沿攻克库</div>
        探索者 · 证明者 · 批判者
        <br />
        形式化者 · 综合者 · 史鉴者
      </div>
    </aside>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export { Plus, ArrowLeft, Play, Sparkles, Compass, Shield, Search, Code2, GitMerge, BookOpen };

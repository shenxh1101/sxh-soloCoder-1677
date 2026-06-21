import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  Users,
  Workflow,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: '工作台', icon: Layers },
  { path: '/clients', label: '客户管理', icon: Users },
  { path: '/progress', label: '制作进度', icon: Workflow },
  { path: '/statistics', label: '数据统计', icon: BarChart3 },
  { path: '/settings', label: '系统设置', icon: Settings },
];

export default function Sidebar({ collapsed, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-darkGray to-darkGray/95',
        'border-r border-roseGold/20 shadow-xl',
        'flex flex-col overflow-hidden'
      )}
    >
      <div
        className={cn(
          'flex items-center h-20 px-6 border-b border-roseGold/20',
          collapsed && 'justify-center px-0'
        )}
      >
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-roseGold to-champagne shadow-lg"
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="ml-3"
          >
            <h1 className="font-noto-serif-sc text-lg font-semibold text-white">
              婚纱摄影管理
            </h1>
            <p className="text-xs text-roseGold/70 mt-0.5">Wedding Studio</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive: navActive }) =>
                cn(
                  'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                  collapsed && 'justify-center px-0',
                  navActive || isActive
                    ? 'bg-gradient-to-r from-roseGold/20 to-roseGold/5 text-roseGold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )
              }
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-roseGold to-champagne"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 transition-colors duration-300',
                    isActive && 'drop-shadow-[0_0_8px_rgba(212,165,116,0.5)]'
                  )}
                />
              </motion.div>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.05 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-roseGold/20">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-xl bg-gradient-to-br from-roseGold/10 to-champagne/10 border border-roseGold/20"
          >
            <p className="text-xs text-roseGold/80 font-medium mb-1">温馨提示</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              今日有 3 个订单待处理，请及时跟进客户选片进度。
            </p>
          </motion.div>
        </div>
      )}
    </motion.aside>
  );
}

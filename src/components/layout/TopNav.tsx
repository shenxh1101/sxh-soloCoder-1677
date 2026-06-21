import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  ChevronRight,
  Home,
  Bell,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

interface TopNavProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onMobileMenuOpen: () => void;
}

const routeNames: Record<string, string> = {
  dashboard: '工作台',
  clients: '客户管理',
  progress: '制作进度',
  statistics: '数据统计',
  settings: '系统设置',
};

const roleLabels: Record<string, string> = {
  admin: '系统管理员',
  consultant: '选片顾问',
  service: '客服人员',
  editor: '后期修图师',
};

export default function TopNav({
  collapsed,
  onToggleCollapsed,
  onMobileMenuOpen,
}: TopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();

  const pathSegments = location.pathname
    .split('/')
    .filter((seg) => seg.length > 0);

  const breadcrumbs = pathSegments.map((seg, index) => ({
    name: routeNames[seg] || seg,
    path: '/' + pathSegments.slice(0, index + 1).join('/'),
  }));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-20 bg-white/80 backdrop-blur-xl',
        'border-b border-roseGold/10 transition-all duration-300',
        collapsed ? 'left-[80px]' : 'left-[260px]',
        'lg:left-0 lg:pl-[260px]'
      )}
      style={
        {
          '--sidebar-width': collapsed ? '80px' : '260px',
          left: 'var(--sidebar-width)',
        } as React.CSSProperties
      }
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleCollapsed}
            className="hidden lg:flex items-center justify-center w-10 h-10 rounded-xl
              bg-warmPink/50 text-darkGray hover:bg-roseGold/20 hover:text-roseGold
              transition-all duration-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl
              bg-warmPink/50 text-darkGray hover:bg-roseGold/20 hover:text-roseGold
              transition-all duration-300"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="hidden sm:flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-gray-500 hover:text-roseGold hover:bg-warmPink/50
                transition-all duration-300"
            >
              <Home className="w-4 h-4" />
            </button>
            <AnimatePresence mode="wait">
              {breadcrumbs.map((crumb, index) => (
                <motion.div
                  key={crumb.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  <button
                    onClick={() => navigate(crumb.path)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg transition-all duration-300',
                      index === breadcrumbs.length - 1
                        ? 'bg-roseGold/10 text-roseGold font-medium'
                        : 'text-gray-500 hover:text-darkGray hover:bg-gray-100'
                    )}
                  >
                    {crumb.name}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {breadcrumbs.length === 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="px-3 py-1.5 rounded-lg bg-roseGold/10 text-roseGold font-medium">
                  工作台
                </span>
              </motion.div>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl
              bg-warmPink/50 text-darkGray hover:bg-roseGold/20 hover:text-roseGold
              transition-all duration-300"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-coralRed animate-pulseSoft" />
          </motion.button>

          <div className="h-8 w-px bg-gray-200 mx-1" />

          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-roseGold/30 shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-roseGold to-champagne flex items-center justify-center shadow-sm">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-forestGreen border-2 border-white" />
            </motion.div>

            <div className="hidden md:block">
              <p className="text-sm font-medium text-darkGray">
                {currentUser?.name || '未登录'}
              </p>
              <p className="text-xs text-gray-500">
                {currentUser?.role ? roleLabels[currentUser.role] : ''}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(224, 122, 95, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-500
                hover:text-coralRed transition-all duration-300"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block text-sm font-medium">退出</span>
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}

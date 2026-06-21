import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Users,
  Sliders,
  Info,
  UserPlus,
  Edit3,
  KeyRound,
  Ban,
  Power,
  Save,
  Heart,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Shield,
  Clock,
  Truck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import type { User, UserRole } from '@/types';

type TabKey = 'users' | 'config' | 'about';

interface SystemConfig {
  selectExpireDays: number;
  retouchStandardHours: number;
  albumMakingHours: number;
  defaultLogisticsCompany: string;
  defaultLogisticsContact: string;
  defaultLogisticsPhone: string;
}

interface UserFormData {
  username: string;
  name: string;
  role: UserRole;
  phone: string;
  password: string;
}

const ROLE_META: Record<UserRole, { label: string; variant: 'roseGold' | 'info' | 'success' | 'warning' }> = {
  admin: { label: '系统管理员', variant: 'roseGold' },
  consultant: { label: '选片顾问', variant: 'info' },
  service: { label: '客服人员', variant: 'success' },
  editor: { label: '后期修图师', variant: 'warning' },
};

const roleOptions: SelectOption[] = [
  { value: 'admin', label: '系统管理员' },
  { value: 'consultant', label: '选片顾问' },
  { value: 'service', label: '客服人员' },
  { value: 'editor', label: '后期修图师' },
];

const tabConfig: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'users', label: '用户管理', icon: Users },
  { key: 'config', label: '系统配置', icon: Sliders },
  { key: 'about', label: '关于系统', icon: Info },
];

const CHANGELOG = [
  { version: 'v1.2.0', date: '2026-06-15', changes: ['新增选片确认功能', '优化用户体验', '修复若干Bug'] },
  { version: 'v1.1.0', date: '2026-05-20', changes: ['新增客户详情页面', '新增数据统计模块', '增强进度追踪功能'] },
  { version: 'v1.0.0', date: '2026-04-01', changes: ['系统正式上线', '基础客户管理', '订单进度跟踪'] },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>('users');

  return (
    <div className="min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-darkGray flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-roseGold" />
          系统设置
        </h1>
        <p className="text-sm text-gray-500 mt-1">管理系统用户、配置参数及查看系统信息</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 shrink-0">
          <Card className="p-2 sticky top-6">
            <div className="space-y-1">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left',
                      isActive
                        ? 'bg-gradient-to-r from-roseGold/20 to-roseGold/5 text-roseGold font-medium shadow-sm'
                        : 'text-gray-600 hover:bg-warmPink/30 hover:text-darkGray'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_rgba(212,165,116,0.4)]')} />
                    <span className="text-sm">{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="settingsTabIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-roseGold"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'config' && <SystemConfiguration />}
              {activeTab === 'about' && <AboutSystem />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const { users } = useAuthStore();
  const [localUsers, setLocalUsers] = useState<User[]>(users);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<User | null>(null);
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    name: '',
    role: 'consultant',
    phone: '',
    password: '',
  });

  const filteredUsers = useMemo(() => {
    return localUsers.filter((u) => {
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        if (
          !u.username.toLowerCase().includes(kw) &&
          !u.name.toLowerCase().includes(kw) &&
          !(u.phone && u.phone.includes(kw))
        ) {
          return false;
        }
      }
      if (roleFilter && u.role !== roleFilter) {
        return false;
      }
      return true;
    });
  }, [localUsers, searchKeyword, roleFilter]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      name: '',
      role: 'consultant',
      phone: '',
      password: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      password: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.username || !formData.name) return;

    if (editingUser) {
      setLocalUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, username: formData.username, name: formData.name, role: formData.role, phone: formData.phone }
            : u
        )
      );
    } else {
      const newUser: User = {
        id: `user_${Date.now()}`,
        username: formData.username,
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setLocalUsers((prev) => [...prev, newUser]);
    }
    setModalOpen(false);
  };

  const toggleUserStatus = (userId: string) => {
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
  };

  const openResetPwd = (user: User) => {
    setResetPwdUser(user);
    setNewPassword('');
    setResetPwdOpen(true);
  };

  const handleResetPwd = () => {
    if (!newPassword) return;
    setResetPwdOpen(false);
    setResetPwdUser(null);
  };

  const filterRoleOptions: SelectOption[] = [
    { value: '', label: '全部角色' },
    ...roleOptions,
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-roseGold" />
              用户管理
              <Badge variant="roseGold" className="ml-2">
                {localUsers.length} 位用户
              </Badge>
            </CardTitle>
            <Button
              variant="primary"
              onClick={openAddModal}
              className="shadow-lg shadow-roseGold/20"
            >
              <UserPlus className="w-4 h-4" />
              添加用户
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="搜索用户名、姓名、电话..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                prefixIcon={<Users className="w-4 h-4" />}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                options={filterRoleOptions}
                value={roleFilter}
                onChange={setRoleFilter}
                placeholder="筛选角色"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-warmPink/30">
            <table className="w-full">
              <thead>
                <tr className="bg-warmPink/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-darkGray/70 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-darkGray/70 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-darkGray/70 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-darkGray/70 uppercase tracking-wider">
                    电话
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-darkGray/70 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-darkGray/70 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmPink/30">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-warmPink/20 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-roseGold/30 to-champagne/40 flex items-center justify-center text-darkGray font-semibold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-medium text-darkGray">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-darkGray/80">{user.name}</td>
                      <td className="px-5 py-4">
                        <Badge variant={ROLE_META[user.role].variant} dot>
                          {ROLE_META[user.role].label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-darkGray/70 text-sm">
                        {user.phone || '-'}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300',
                            user.isActive ? 'bg-forestGreen' : 'bg-gray-300'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300',
                              user.isActive ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                        <span className={cn(
                          'ml-2 text-xs',
                          user.isActive ? 'text-forestGreen' : 'text-gray-400'
                        )}>
                          {user.isActive ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-lg text-darkGray/60 hover:text-roseGold hover:bg-warmPink/40 transition-colors"
                            title="编辑"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openResetPwd(user)}
                            className="p-2 rounded-lg text-darkGray/60 hover:text-champagne hover:bg-warmPink/40 transition-colors"
                            title="重置密码"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              user.isActive
                                ? 'text-darkGray/60 hover:text-coralRed hover:bg-coralRed/10'
                                : 'text-forestGreen hover:bg-forestGreen/10'
                            )}
                            title={user.isActive ? '禁用' : '启用'}
                          >
                            {user.isActive ? <Ban className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        className="max-w-xl"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-darkGray mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-roseGold" />
            {editingUser ? '编辑用户' : '添加用户'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="用户名"
              placeholder="请输入登录用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <Input
              label="姓名"
              placeholder="请输入真实姓名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Select
              label="角色"
              options={roleOptions}
              value={formData.role}
              onChange={(v) => setFormData({ ...formData, role: v as UserRole })}
              placeholder="请选择角色"
            />
            <Input
              label="联系电话"
              placeholder="请输入联系电话"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            {!editingUser && (
              <Input
                label="初始密码"
                type="password"
                placeholder="请输入初始密码"
                containerClassName="md:col-span-2"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            )}
            {editingUser && (
              <Input
                label="新密码（留空则不修改）"
                type="password"
                placeholder="留空则保持原密码不变"
                containerClassName="md:col-span-2"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            )}
          </div>
          <div className="flex gap-3 mt-8 justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              className="shadow-lg shadow-roseGold/20"
            >
              {editingUser ? '保存修改' : '确认添加'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={resetPwdOpen}
        onClose={() => setResetPwdOpen(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-darkGray mb-2 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-champagne" />
            重置密码
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            为用户 <span className="font-medium text-darkGray">{resetPwdUser?.name}</span> 重置登录密码
          </p>
          <Input
            label="新密码"
            type="password"
            placeholder="请输入新的登录密码"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="flex gap-3 mt-8 justify-end">
            <Button variant="ghost" onClick={() => setResetPwdOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleResetPwd}
              className="shadow-lg shadow-roseGold/20"
            >
              确认重置
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SystemConfiguration() {
  const [config, setConfig] = useState<SystemConfig>({
    selectExpireDays: 30,
    retouchStandardHours: 48,
    albumMakingHours: 72,
    defaultLogisticsCompany: '顺丰速运',
    defaultLogisticsContact: '客服部',
    defaultLogisticsPhone: '400-888-8888',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const configItems = [
    {
      key: 'selectExpireDays',
      label: '选片链接默认有效期',
      suffix: '天',
      icon: Calendar,
      hint: '新建订单时选片链接的默认有效天数',
      color: 'from-roseGold/20 to-roseGold/5',
    },
    {
      key: 'retouchStandardHours',
      label: '精修标准工时',
      suffix: '小时',
      icon: Clock,
      hint: '单张照片精修的标准处理工时',
      color: 'from-champagne/30 to-champagne/10',
    },
    {
      key: 'albumMakingHours',
      label: '相册制作工时',
      suffix: '小时',
      icon: TrendingUp,
      hint: '相册排版制作的标准工时',
      color: 'from-forestGreen/20 to-forestGreen/5',
    },
  ] as const;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-roseGold" />
              系统配置
            </CardTitle>
            <Button
              variant="primary"
              onClick={handleSave}
              className={cn(
                'shadow-lg transition-all duration-300',
                saved ? 'shadow-forestGreen/30 bg-gradient-to-r from-forestGreen to-emerald-600' : 'shadow-roseGold/20'
              )}
            >
              <Save className="w-4 h-4" />
              {saved ? '已保存 ✓' : '保存配置'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {configItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={cn(
                    'p-5 rounded-2xl bg-gradient-to-r border border-warmPink/30',
                    item.color
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-roseGold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-sm font-semibold text-darkGray mb-1">
                          {item.label}
                        </label>
                        <p className="text-xs text-gray-500">{item.hint}</p>
                      </div>
                    </div>
                    <div className="w-full lg:w-56 shrink-0">
                      <Input
                        type="number"
                        value={String(config[item.key])}
                        onChange={(e) =>
                          setConfig({ ...config, [item.key]: Number(e.target.value) })
                        }
                        suffixIcon={
                          <span className="text-xs text-darkGray/50 pr-2">{item.suffix}</span>
                        }
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-warmPink/50 to-transparent my-2" />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-base font-semibold text-darkGray mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-coralRed" />
              物流信息默认值
            </h3>
            <div className="p-5 rounded-2xl bg-gradient-to-r from-coralRed/10 via-warmPink/10 to-transparent border border-warmPink/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="默认物流公司"
                  placeholder="如：顺丰速运"
                  value={config.defaultLogisticsCompany}
                  onChange={(e) =>
                    setConfig({ ...config, defaultLogisticsCompany: e.target.value })
                  }
                  prefixIcon={<Truck className="w-4 h-4" />}
                />
                <Input
                  label="默认联系人"
                  placeholder="如：客服部"
                  value={config.defaultLogisticsContact}
                  onChange={(e) =>
                    setConfig({ ...config, defaultLogisticsContact: e.target.value })
                  }
                  prefixIcon={<Users className="w-4 h-4" />}
                />
                <Input
                  label="默认联系电话"
                  placeholder="如：400-888-8888"
                  value={config.defaultLogisticsPhone}
                  onChange={(e) =>
                    setConfig({ ...config, defaultLogisticsPhone: e.target.value })
                  }
                  prefixIcon={<Phone className="w-4 h-4" />}
                />
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}

function AboutSystem() {
  const [expandedChangelog, setExpandedChangelog] = useState<string | null>('v1.2.0');

  const teamMembers = [
    { name: '产品团队', desc: '负责需求设计与产品规划', icon: Sparkles },
    { name: '研发团队', desc: '负责系统开发与技术支持', icon: Shield },
    { name: '运营团队', desc: '负责客户服务与日常运营', icon: Heart },
  ];

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <Card className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-roseGold/15 via-warmPink/30 to-champagne/20" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-roseGold/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <CardContent className="relative p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-roseGold via-champagne to-roseGold shadow-2xl shadow-roseGold/30 flex items-center justify-center">
                  <Heart className="w-14 h-14 text-white fill-white/20" />
                </div>
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-2xl bg-gradient-to-br from-champagne to-roseGold shadow-lg flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>

              <div className="flex-1 text-center lg:text-left min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl font-bold font-noto-serif-sc text-darkGray mb-2">
                    婚纱摄影管理系统
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Wedding Studio Management System
                  </p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    <Badge variant="roseGold" className="px-4 py-1.5 text-xs">
                      版本 v1.2.0
                    </Badge>
                    <Badge variant="success" dot className="px-4 py-1.5 text-xs">
                      正式版
                    </Badge>
                    <Badge variant="info" className="px-4 py-1.5 text-xs">
                      发布于 2026-06-15
                    </Badge>
                  </div>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-forestGreen" />
                团队信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member, idx) => {
                  const Icon = member.icon;
                  return (
                    <motion.div
                      key={member.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.08 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-warmPink/30 to-transparent border border-warmPink/30 hover:shadow-md transition-all"
                    >
                      <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-roseGold" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-darkGray">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-champagne" />
                联系方式
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { icon: Phone, label: '客服热线', value: '400-888-8888', color: 'text-roseGold' },
                  { icon: Mail, label: '邮箱地址', value: 'support@wedding-studio.com', color: 'text-champagne' },
                  { icon: MapPin, label: '办公地址', value: '北京市朝阳区望京SOHO T3', color: 'text-forestGreen' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + idx * 0.08 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-warmPink/30 to-transparent border border-warmPink/30"
                    >
                      <div className={cn('w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0', item.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                        <p className="font-medium text-darkGray">{item.value}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-coralRed" />
              更新日志
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-roseGold/50 via-champagne/40 to-transparent" />
              <div className="space-y-3">
                {CHANGELOG.map((log, idx) => {
                  const isExpanded = expandedChangelog === log.version;
                  return (
                    <motion.div
                      key={log.version}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + idx * 0.08 }}
                      className="relative pl-14"
                    >
                      <div className="absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-roseGold/20 to-champagne/30 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-roseGold to-champagne" />
                      </div>
                      <div
                        onClick={() =>
                          setExpandedChangelog(isExpanded ? null : log.version)
                        }
                        className="cursor-pointer p-4 rounded-xl border border-warmPink/30 hover:bg-warmPink/20 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="roseGold" className="px-3 py-1 text-xs font-semibold">
                              {log.version}
                            </Badge>
                            <span className="text-xs text-gray-400">{log.date}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-darkGray/50" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-darkGray/50" />
                          )}
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.ul
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 space-y-1.5 overflow-hidden"
                            >
                              {log.changes.map((change, cIdx) => (
                                <li
                                  key={cIdx}
                                  className="flex items-start gap-2 text-sm text-darkGray/70"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-roseGold mt-1.5 shrink-0" />
                                  {change}
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-xs text-gray-400 py-4"
      >
        <div className="flex items-center justify-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-coralRed/60 fill-coralRed/20" />
          <span>© 2026 婚纱摄影管理系统 · 用心记录每一个美好瞬间</span>
        </div>
      </motion.div>
    </div>
  );
}

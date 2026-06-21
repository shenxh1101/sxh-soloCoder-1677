import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  Filter,
  UserPlus,
  Phone,
  MessageCircle,
  User,
  Calendar,
  Package,
  Image as ImageIcon,
  BookImage,
  Wand2,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import { useClientStore } from '@/store/useClientStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePhotoStore } from '@/store/usePhotoStore';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Client, ProductionStatus } from '@/types';
import { STATUS_META } from '@/mock/seed';

export default function Clients() {
  const navigate = useNavigate();
  const { clients } = useClientStore();
  const { orders } = useOrderStore();
  const { users, getUsersByRole } = useAuthStore();
  const { getPhotos, getSelectionSummary } = usePhotoStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [consultantFilter, setConsultantFilter] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    partnerName: '',
    phone: '',
    wechat: '',
    address: '',
    consultantId: '',
    packageName: '',
    shootDate: '',
    albumCount: 40,
    retouchCount: 30,
  });

  const consultants = getUsersByRole('consultant');

  const statusOptions: SelectOption[] = useMemo(() => {
    const options = Object.entries(STATUS_META).map(([value, meta]) => ({
      value,
      label: meta.label,
    }));
    return [{ value: '', label: '全部状态' }, ...options];
  }, []);

  const consultantOptions: SelectOption[] = useMemo(() => {
    const options = consultants.map((c) => ({
      value: c.id,
      label: c.name,
    }));
    return [{ value: '', label: '全部顾问' }, ...options];
  }, [consultants]);

  const getClientOrder = (clientId: string) => {
    return orders.find((o) => o.clientId === clientId);
  };

  const getConsultantName = (consultantId: string) => {
    const user = users.find((u) => u.id === consultantId);
    return user?.name || '未分配';
  };

  const filteredClients = useMemo(() => {
    let result = clients;

    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.partnerName.toLowerCase().includes(kw) ||
          c.phone.includes(kw) ||
          (c.wechat && c.wechat.toLowerCase().includes(kw))
      );
    }

    if (consultantFilter) {
      result = result.filter((c) => c.consultantId === consultantFilter);
    }

    if (statusFilter) {
      result = result.filter((c) => {
        const order = getClientOrder(c.id);
        return order?.status === statusFilter;
      });
    }

    return result;
  }, [clients, searchKeyword, consultantFilter, statusFilter, orders]);

  const handleCardClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleCreateClient = () => {
    if (!newClient.name || !newClient.partnerName || !newClient.phone || !newClient.consultantId) {
      return;
    }

    const { addClient } = useClientStore.getState();
    const { addOrder } = useOrderStore.getState();

    const client = addClient({
      name: newClient.name,
      partnerName: newClient.partnerName,
      phone: newClient.phone,
      wechat: newClient.wechat,
      address: newClient.address,
      consultantId: newClient.consultantId,
    });

    if (newClient.packageName) {
      const now = new Date();
      const expireAt = new Date(now);
      expireAt.setDate(expireAt.getDate() + 30);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let token = '';
      for (let i = 0; i < 16; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      addOrder({
        clientId: client.id,
        consultantId: newClient.consultantId,
        packageName: newClient.packageName,
        photosCount: 0,
        albumCount: newClient.albumCount,
        retouchCount: newClient.retouchCount,
        shootDate: newClient.shootDate || new Date().toISOString().split('T')[0],
        status: 'pending_photos',
        selectToken: token,
        selectExpireAt: expireAt.toISOString(),
      });
    }

    setCreateModalOpen(false);
    setNewClient({
      name: '',
      partnerName: '',
      phone: '',
      wechat: '',
      address: '',
      consultantId: '',
      packageName: '',
      shootDate: '',
      albumCount: 40,
      retouchCount: 30,
    });
  };

  return (
    <div className="min-h-full">
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-darkGray flex items-center gap-3">
              <Users className="w-7 h-7 text-roseGold" />
              客户管理
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              共 {filteredClients.length} 位客户 · {clients.length} 位总客户
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setCreateModalOpen(true)}
            className="shadow-lg shadow-roseGold/20"
          >
            <UserPlus className="w-4 h-4" />
            新建客户
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="搜索客户姓名、手机号、微信号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                prefixIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="筛选状态"
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                options={consultantOptions}
                value={consultantFilter}
                onChange={setConsultantFilter}
                placeholder="筛选顾问"
              />
            </div>
            {(searchKeyword || statusFilter || consultantFilter) && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setSearchKeyword('');
                  setStatusFilter('');
                  setConsultantFilter('');
                }}
              >
                <Filter className="w-4 h-4" />
                清除
              </Button>
            )}
          </div>
        </Card>
      </div>

      <AnimatePresence mode="wait">
        {filteredClients.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 2, -2, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative mb-6"
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-warmPink/50 to-champagne/30 flex items-center justify-center">
                <Heart className="w-16 h-16 text-roseGold/60" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-roseGold/20"
              />
            </motion.div>
            <h3 className="text-xl font-semibold text-darkGray mb-2">暂无客户</h3>
            <p className="text-gray-500 mb-6 text-center max-w-xs">
              {searchKeyword || statusFilter || consultantFilter
                ? '没有找到匹配的客户，试试调整搜索条件吧'
                : '点击右上角按钮创建您的第一位客户档案'}
            </p>
            <Button
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              className="shadow-lg shadow-roseGold/20"
            >
              <UserPlus className="w-4 h-4" />
              创建客户
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {filteredClients.map((client, index) => {
              const order = getClientOrder(client.id);
              const photos = order ? getPhotos(order.id) : [];
              const summary = order ? getSelectionSummary(order.id) : null;

              return (
                <ClientCard
                  key={client.id}
                  client={client}
                  order={order}
                  photosCount={photos.length}
                  summary={summary}
                  consultantName={getConsultantName(client.consultantId)}
                  index={index}
                  onClick={() => handleCardClick(client.id)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        className="max-w-2xl"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-darkGray mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-roseGold" />
            新建客户档案
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="新郎姓名"
              placeholder="请输入新郎姓名"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            />
            <Input
              label="新娘姓名"
              placeholder="请输入新娘姓名"
              value={newClient.partnerName}
              onChange={(e) => setNewClient({ ...newClient, partnerName: e.target.value })}
            />
            <Input
              label="联系电话"
              placeholder="请输入联系电话"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
            />
            <Input
              label="微信号"
              placeholder="请输入微信号"
              value={newClient.wechat}
              onChange={(e) => setNewClient({ ...newClient, wechat: e.target.value })}
            />
            <Input
              label="收货地址"
              placeholder="请输入收货地址"
              containerClassName="md:col-span-2"
              value={newClient.address}
              onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
            />
            <Select
              label="摄影顾问"
              options={consultants.map((c) => ({ value: c.id, label: c.name }))}
              value={newClient.consultantId}
              onChange={(v) => setNewClient({ ...newClient, consultantId: v })}
              placeholder="请选择顾问"
            />
            <Input
              label="拍摄日期"
              type="date"
              value={newClient.shootDate}
              onChange={(e) => setNewClient({ ...newClient, shootDate: e.target.value })}
            />
            <Input
              label="套餐名称"
              placeholder="如：经典婚纱套餐A"
              value={newClient.packageName}
              onChange={(e) => setNewClient({ ...newClient, packageName: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="入册数量"
                type="number"
                value={String(newClient.albumCount)}
                onChange={(e) =>
                  setNewClient({ ...newClient, albumCount: Number(e.target.value) })
                }
              />
              <Input
                label="精修数量"
                type="number"
                value={String(newClient.retouchCount)}
                onChange={(e) =>
                  setNewClient({ ...newClient, retouchCount: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8 justify-end">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateClient}
              className="shadow-lg shadow-roseGold/20"
            >
              确认创建
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface ClientCardProps {
  client: Client;
  order: {
    id: string;
    status: ProductionStatus;
    packageName: string;
    shootDate: string;
  } | undefined;
  photosCount: number;
  summary: { albumCount: number; retouchCount: number } | null;
  consultantName: string;
  index: number;
  onClick: () => void;
}

function ClientCard({
  client,
  order,
  photosCount,
  summary,
  consultantName,
  index,
  onClick,
}: ClientCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <Card className="h-full overflow-hidden group-hover:shadow-xl group-hover:shadow-roseGold/10 transition-all duration-500">
        <div className="relative bg-gradient-to-br from-warmPink/40 via-champagne/20 to-roseGold/10 p-5 pb-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-roseGold/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-champagne/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-darkGray flex items-center gap-2">
                <span>{client.name}先生</span>
                <span className="text-roseGold">&amp;</span>
                <span>{client.partnerName}女士</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                创建于 {formatDate(client.createdAt, 'short')}
              </p>
            </div>
            {order && (
              <StatusBadge status={order.status} size="sm" />
            )}
          </div>
        </div>

        <div className="p-5 pt-4 space-y-3">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 text-roseGold/60 shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
            {client.wechat && (
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-4 h-4 text-forestGreen/70 shrink-0" />
                <span className="truncate">{client.wechat}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-champagne shrink-0" />
              <span className="truncate">顾问：{consultantName}</span>
            </div>
            {order && (
              <>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-coralRed/60 shrink-0" />
                  <span>拍摄：{formatDate(order.shootDate, 'short')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4 text-darkGray/50 shrink-0" />
                  <span className="truncate">{order.packageName}</span>
                </div>
              </>
            )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-warmPink/50 to-transparent my-3" />

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-warmPink/40 flex items-center justify-center">
                  <ImageIcon className="w-3.5 h-3.5 text-darkGray/70" />
                </div>
                <span className="text-sm font-semibold text-darkGray">{photosCount}</span>
                <span className="text-xs text-gray-400">张</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-forestGreen/15 flex items-center justify-center">
                  <BookImage className="w-3.5 h-3.5 text-forestGreen" />
                </div>
                <span className="text-sm font-semibold text-darkGray">
                  {summary?.albumCount || 0}
                </span>
                <span className="text-xs text-gray-400">入册</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-champagne/30 flex items-center justify-center">
                  <Wand2 className="w-3.5 h-3.5 text-roseGold" />
                </div>
                <span className="text-sm font-semibold text-darkGray">
                  {summary?.retouchCount || 0}
                </span>
                <span className="text-xs text-gray-400">精修</span>
              </div>
            </div>
          </div>

          <motion.div
            whileHover={{ x: 4 }}
            className="flex items-center justify-end pt-2"
          >
            <div
              className={cn(
                'inline-flex items-center gap-1.5 text-sm font-medium',
                'text-roseGold group-hover:text-roseGold transition-colors duration-300'
              )}
            >
              <span>查看详情</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

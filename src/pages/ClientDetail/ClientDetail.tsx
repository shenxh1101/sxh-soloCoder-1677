import { useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  User,
  Calendar,
  Package,
  MapPin,
  Upload,
  Link as LinkIcon,
  Copy,
  RefreshCw,
  Image as ImageIcon,
  BookImage,
  Wand2,
  X as XIcon,
  FileText,
  Star,
  MessageSquare,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Check,
  Trash2,
  AlertCircle,
  Sparkles,
  Receipt,
  Clock,
  Bell,
  Printer,
  PlusCircle,
  Send,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import StatusTimeline from '@/components/StatusTimeline/StatusTimeline';
import { useClientStore } from '@/store/useClientStore';
import { useOrderStore } from '@/store/useOrderStore';
import { usePhotoStore } from '@/store/usePhotoStore';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate, isExpired, daysBetween } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { ProductionStatus, PhotoMark, SelectionReminder, AdditionalService } from '@/types';
import { STATUS_META } from '@/mock/seed';

type TabKey = 'photos' | 'progress' | 'confirm' | 'order';

const ALL_STATUSES: ProductionStatus[] = [
  'pending_photos',
  'pending_selection',
  'retouching',
  'layout',
  'album_making',
  'shipping',
  'completed',
];

const PHOTOS_PER_PAGE = 24;

const PHOTO_MARK_LABELS: Record<PhotoMark, { label: string; color: string; bgColor: string }> = {
  none: { label: '', color: '', bgColor: '' },
  album: { label: '入册', color: '#059669', bgColor: '#D1FAE5' },
  retouch: { label: '精修', color: '#B45309', bgColor: '#FEF3C7' },
  reject: { label: '删除', color: '#DC2626', bgColor: '#FEE2E2' },
};

async function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getClient } = useClientStore();
  const { orders, updateStatus, updateOrder, addSelectionReminder, getSelectionReminders, addAdditionalService, getAdditionalServices } = useOrderStore();
  const getSelectionConfirm = useOrderStore((s) => s.getSelectionConfirm);
  const { getPhotos, addPhotos, markPhoto, addNote, getSelectionSummary } = usePhotoStore();
  const { getUserById, currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('photos');
  const [photoPage, setPhotoPage] = useState(1);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<ProductionStatus | ''>('');
  const [statusRemark, setStatusRemark] = useState('');
  const [copied, setCopied] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState('');
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderChannel, setReminderChannel] = useState<'wechat' | 'phone' | 'sms' | 'other'>('wechat');
  const [reminderNote, setReminderNote] = useState('');
  const [showLinkUpdatedTip, setShowLinkUpdatedTip] = useState(false);
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [serviceType, setServiceType] = useState<'additional_retouch' | 'additional_album'>('additional_retouch');
  const [serviceQuantity, setServiceQuantity] = useState('');
  const [serviceFee, setServiceFee] = useState('');
  const [serviceNote, setServiceNote] = useState('');

  const client = id ? getClient(id) : undefined;
  const order = useMemo(() => orders.find((o) => o.clientId === id), [orders, id]);
  const consultant = order ? getUserById(order.consultantId) : undefined;
  const photos = order ? getPhotos(order.id) : [];
  const summary = order ? getSelectionSummary(order.id) : { albumCount: 0, retouchCount: 0, notes: [] };
  const selectionConfirm = order ? getSelectionConfirm(order.id) : undefined;
  const selectionReminders = order ? getSelectionReminders(order.id) : [];
  const additionalServices = order ? getAdditionalServices(order.id) : [];

  const totalPages = Math.max(1, Math.ceil(photos.length / PHOTOS_PER_PAGE));
  const pagedPhotos = useMemo(() => {
    const start = (photoPage - 1) * PHOTOS_PER_PAGE;
    return photos.slice(start, start + PHOTOS_PER_PAGE);
  }, [photos, photoPage]);

  const selectionStats = useMemo(() => {
    let selected = 0;
    let album = 0;
    let retouch = 0;
    let unselected = 0;
    for (const p of photos) {
      if (p.mark === 'album') {
        album++;
        selected++;
      } else if (p.mark === 'retouch') {
        retouch++;
        selected++;
      } else if (p.mark === 'reject') {
        selected++;
      } else {
        unselected++;
      }
    }
    return { selected, album, retouch, unselected, total: photos.length };
  }, [photos]);

  const nextStatusOptions: SelectOption[] = useMemo(() => {
    if (!order) return [];
    const currentIdx = ALL_STATUSES.indexOf(order.status);
    return ALL_STATUSES.slice(currentIdx + 1).map((s) => ({
      value: s,
      label: STATUS_META[s].label,
    }));
  }, [order]);

  const linkExpired = order ? isExpired(order.selectExpireAt) : false;
  const daysLeft = order ? -daysBetween(order.selectExpireAt) : 0;

  const albumPhotos = photos.filter((p) => p.mark === 'album');
  const retouchPhotos = photos.filter((p) => p.mark === 'retouch');

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setSelectedFiles(imageFiles);
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    setUploadModalOpen(true);
  }, []);

  const handleUpload = async () => {
    if (!order || selectedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(`已选 ${selectedFiles.length} 张，正在处理...`);

    try {
      const existingCount = photos.length;
      const newPhotos: {
        url: string;
        thumbnail: string;
        filename: string;
      }[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`正在压缩 ${i + 1} / ${selectedFiles.length}...`);
        const file = selectedFiles[i];
        const [url, thumbnail] = await Promise.all([
          compressImage(file, 800, 0.7),
          compressImage(file, 400, 0.7),
        ]);
        newPhotos.push({
          url,
          thumbnail,
          filename: file.name || `IMG_${String(1000 + existingCount + i).padStart(4, '0')}.jpg`,
        });
      }

      setUploadProgress('正在保存...');
      addPhotos(order.id, newPhotos);
      const newCount = existingCount + newPhotos.length;
      updateOrder(order.id, { photosCount: newCount });

      if (order.status === 'pending_photos' && currentUser) {
        updateStatus(order.id, 'pending_selection', currentUser.id, '原片上传完成，等待客户选片');
      }

      setUploadProgress('');
      setUploading(false);
      setUploadModalOpen(false);
      setSelectedFiles([]);
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
      setPreviewUrls([]);
    } catch {
      setUploading(false);
      setUploadProgress('上传失败，请重试');
    }
  };

  const handleCopyLink = async () => {
    if (!order) return;
    const link = `${window.location.origin}/select/${order.selectToken}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // fallback
    }
    setCopied(true);
    setShowLinkUpdatedTip(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setShowLinkUpdatedTip(false), 8000);
  };

  const handleRegenerateLink = () => {
    if (!order) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const now = new Date();
    now.setDate(now.getDate() + 30);
    updateOrder(order.id, {
      selectToken: token,
      selectExpireAt: now.toISOString(),
    });
    setShowLinkUpdatedTip(true);
    setTimeout(() => setShowLinkUpdatedTip(false), 8000);
  };

  const handleUpdateStatus = () => {
    if (!order || !nextStatus || !currentUser) return;
    updateStatus(order.id, nextStatus as ProductionStatus, currentUser.id, statusRemark);
    setStatusModalOpen(false);
    setNextStatus('');
    setStatusRemark('');
  };

  const handleMarkPhoto = (photoId: string, mark: PhotoMark) => {
    markPhoto(photoId, mark);
  };

  const handleOpenNote = (photoId: string, existingNote?: string) => {
    setCurrentPhotoId(photoId);
    setCurrentNote(existingNote || '');
    setNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    if (currentPhotoId) {
      addNote(currentPhotoId, currentNote);
    }
    setNoteModalOpen(false);
    setCurrentPhotoId(null);
    setCurrentNote('');
  };

  const handleAddReminder = () => {
    if (!order || !currentUser) return;
    addSelectionReminder({
      orderId: order.id,
      channel: reminderChannel,
      senderId: currentUser.id,
      senderName: currentUser.name,
      note: reminderNote || undefined,
    });
    setReminderModalOpen(false);
    setReminderChannel('wechat');
    setReminderNote('');
    setShowLinkUpdatedTip(false);
  };

  const handleAddService = () => {
    if (!order || !currentUser) return;
    const qty = parseInt(serviceQuantity) || 0;
    const fee = parseFloat(serviceFee) || 0;
    if (qty <= 0 || fee <= 0) return;
    addAdditionalService({
      orderId: order.id,
      type: serviceType,
      quantity: qty,
      fee,
      note: serviceNote || undefined,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
    });
    updateStatus(
      order.id,
      order.status,
      currentUser.id,
      `客户追加${serviceType === 'additional_retouch' ? '精修' : '入册'}${qty}张，费用¥${fee}`
    );
    setAddServiceModalOpen(false);
    setServiceType('additional_retouch');
    setServiceQuantity('');
    setServiceFee('');
    setServiceNote('');
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'photos', label: '照片管理', icon: <ImageIcon className="w-4 h-4" /> },
    { key: 'progress', label: '制作进度', icon: <Clock className="w-4 h-4" /> },
    { key: 'confirm', label: '选片确认单', icon: <FileText className="w-4 h-4" /> },
    { key: 'order', label: '订单信息', icon: <Receipt className="w-4 h-4" /> },
  ];

  if (!client || !order) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-warmPink/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-roseGold/60" />
          </div>
          <h2 className="text-xl font-bold text-darkGray mb-2">未找到客户信息</h2>
          <p className="text-gray-500 mb-6">客户档案可能已被删除或不存在</p>
          <Button variant="primary" onClick={() => navigate('/clients')}>
            <ArrowLeft className="w-4 h-4" />
            返回客户列表
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-5">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #selection-confirm-print, #selection-confirm-print * { visibility: visible; }
          #selection-confirm-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <Card className="p-5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-roseGold/10 via-champagne/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />
        <div className="relative flex flex-col lg:flex-row gap-5 items-start lg:items-center">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/clients')}
              className="w-11 h-11 rounded-xl bg-warmPink/40 flex items-center justify-center text-darkGray/70 hover:bg-warmPink/60 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-champagne via-roseGold to-warmPink flex items-center justify-center shadow-lg shadow-roseGold/20 shrink-0">
              <span className="text-2xl">💑</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-bold text-darkGray">
                {client.name}先生 &amp; {client.partnerName}女士
              </h1>
              <StatusBadge status={order.status} size="md" />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-roseGold/60" />
                {client.phone}
              </span>
              {client.wechat && (
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-forestGreen/70" />
                  {client.wechat}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-champagne" />
                顾问：{consultant?.name || '未分配'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-coralRed/60" />
                拍摄：{formatDate(order.shootDate)}
              </span>
            </div>
            {client.address && (
              <div className="mt-2 flex items-start gap-1.5 text-sm text-gray-500 max-w-xl">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-darkGray/40" />
                <span className="truncate">{client.address}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-warmPink/30">
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300',
              activeTab === tab.key
                ? 'bg-gradient-to-r from-champagne to-roseGold text-white shadow-md shadow-roseGold/20'
                : 'text-gray-500 hover:text-darkGray hover:bg-warmPink/30'
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'photos' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2 p-6 relative overflow-hidden">
                  <div
                    className={cn(
                      'absolute inset-0 opacity-50 cursor-pointer transition-colors duration-200',
                      dragOver && 'bg-roseGold/10'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOver(false);
                      if (e.dataTransfer.files.length > 0) {
                        handleFileSelect(e.dataTransfer.files);
                      }
                    }}
                  >
                    <div className={cn(
                      'absolute inset-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300',
                      dragOver
                        ? 'border-roseGold bg-roseGold/10'
                        : 'border-roseGold/40 hover:border-roseGold hover:bg-roseGold/5'
                    )}>
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-champagne/40 to-roseGold/20 flex items-center justify-center mb-4"
                      >
                        <Upload className="w-8 h-8 text-roseGold" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-darkGray mb-1">批量上传照片</h3>
                      <p className="text-sm text-gray-500">
                        拖拽照片到此处，或点击选择文件 · 支持 JPG/PNG 格式
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-champagne/30 to-roseGold/20 flex items-center justify-center">
                        <LinkIcon className="w-4 h-4 text-roseGold" />
                      </div>
                      <h3 className="font-semibold text-darkGray">选片链接</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerateLink}
                      className="h-8 px-3 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      重新生成
                    </Button>
                  </div>

                  <div
                    className={cn(
                      'rounded-xl p-3 mb-3 text-sm font-mono break-all border transition-colors',
                      linkExpired
                        ? 'bg-coralRed/5 border-coralRed/20 text-coralRed'
                        : 'bg-warmPink/20 border-warmPink/40 text-darkGray'
                    )}
                  >
                    {window.location.origin}/select/{order.selectToken}
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <span
                      className={cn(
                        'flex items-center gap-1.5',
                        linkExpired ? 'text-coralRed' : 'text-gray-500'
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {linkExpired
                        ? '链接已过期'
                        : daysLeft > 7
                          ? `有效期至 ${formatDate(order.selectExpireAt, 'short')}`
                          : `剩余 ${daysLeft} 天过期`}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCopyLink}
                    className="w-full shadow-lg shadow-roseGold/20"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制链接
                      </>
                    )}
                  </Button>

                  {showLinkUpdatedTip && (
                    <div className="mt-3 rounded-xl bg-champagne/20 border border-champagne/40 p-3 flex items-center justify-between gap-2">
                      <span className="text-sm text-darkGray flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-roseGold" />
                        链接已更新，是否登记提醒？
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setReminderModalOpen(true);
                            setShowLinkUpdatedTip(false);
                          }}
                          className="h-7 px-3 text-xs"
                        >
                          登记提醒
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLinkUpdatedTip(false)}
                          className="h-7 px-2 text-xs"
                        >
                          稍后
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-darkGray flex items-center gap-2">
                      <Bell className="w-4 h-4 text-roseGold" />
                      选片提醒
                    </h3>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setReminderModalOpen(true)}
                      className="h-8 px-3 text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      登记提醒
                    </Button>
                  </div>

                  {selectionReminders.length > 0 && (
                    <p className="text-xs text-gray-500 mb-3">
                      已提醒 {selectionReminders.length} 次
                    </p>
                  )}

                  {selectionReminders.length === 0 ? (
                    <div className="py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-warmPink/30 flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-roseGold/40" />
                      </div>
                      <p className="text-sm text-gray-400">暂无提醒记录</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {selectionReminders.map((r, idx) => (
                        <div key={r.id} className="relative flex gap-3 pb-4">
                          {idx < selectionReminders.length - 1 && (
                            <div className="absolute left-[11px] top-6 bottom-0 w-px bg-warmPink/30" />
                          )}
                          <div className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold z-10',
                            r.channel === 'wechat' ? 'bg-forestGreen' :
                            r.channel === 'phone' ? 'bg-champagne' :
                            r.channel === 'sms' ? 'bg-roseGold' : 'bg-gray-400'
                          )}>
                            {r.channel === 'wechat' ? '微' : r.channel === 'phone' ? '话' : r.channel === 'sms' ? '短' : '他'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={cn(
                                'text-xs px-1.5 py-0.5 rounded font-medium',
                                r.channel === 'wechat' ? 'bg-forestGreen/15 text-forestGreen' :
                                r.channel === 'phone' ? 'bg-champagne/30 text-amber-700' :
                                r.channel === 'sms' ? 'bg-roseGold/20 text-roseGold' : 'bg-gray-100 text-gray-600'
                              )}>
                                {r.channel === 'wechat' ? '微信' : r.channel === 'phone' ? '电话' : r.channel === 'sms' ? '短信' : '其他'}
                              </span>
                              <span className="text-sm text-darkGray font-medium">{r.senderName}</span>
                              <span className="text-xs text-gray-400">{formatDate(r.createdAt, 'datetime')}</span>
                            </div>
                            {r.note && (
                              <p className="text-sm text-gray-600 mt-0.5">{r.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-darkGray flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-roseGold" />
                    选片统计
                  </h3>
                  <span className="text-sm text-gray-500">
                    共 {selectionStats.total} 张照片
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatItem
                    icon={<ImageIcon className="w-4 h-4" />}
                    label="已选"
                    value={selectionStats.selected}
                    total={selectionStats.total}
                    bgColor="bg-warmPink/40"
                    iconColor="text-darkGray/70"
                  />
                  <StatItem
                    icon={<BookImage className="w-4 h-4" />}
                    label="入册"
                    value={selectionStats.album}
                    total={order.albumCount}
                    bgColor="bg-forestGreen/15"
                    iconColor="text-forestGreen"
                  />
                  <StatItem
                    icon={<Wand2 className="w-4 h-4" />}
                    label="精修"
                    value={selectionStats.retouch}
                    total={order.retouchCount}
                    bgColor="bg-champagne/30"
                    iconColor="text-roseGold"
                  />
                  <StatItem
                    icon={<XIcon className="w-4 h-4" />}
                    label="未选"
                    value={selectionStats.unselected}
                    total={selectionStats.total}
                    bgColor="bg-gray-100"
                    iconColor="text-gray-400"
                  />
                </div>

                <div className="space-y-3">
                  <ProgressBar
                    label="入册进度"
                    current={selectionStats.album}
                    total={order.albumCount}
                    gradient="from-forestGreen to-forestGreen/60"
                  />
                  <ProgressBar
                    label="精修进度"
                    current={selectionStats.retouch}
                    total={order.retouchCount}
                    gradient="from-champagne to-roseGold"
                  />
                  <ProgressBar
                    label="整体选片"
                    current={selectionStats.selected}
                    total={selectionStats.total || 1}
                    gradient="from-roseGold via-champagne to-warmPink"
                  />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warmPink/40 to-champagne/30 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-roseGold" />
                    </div>
                    <h3 className="font-semibold text-darkGray">照片列表</h3>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9"
                  >
                    <Upload className="w-4 h-4" />
                    上传照片
                  </Button>
                </div>

                {photos.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-warmPink/30 flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-10 h-10 text-roseGold/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-darkGray mb-2">暂无照片</h3>
                    <p className="text-sm text-gray-500 mb-5">点击上方按钮上传拍摄的原片</p>
                    <Button
                      variant="primary"
                      onClick={() => fileInputRef.current?.click()}
                      className="shadow-lg shadow-roseGold/20"
                    >
                      <Upload className="w-4 h-4" />
                      立即上传
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {pagedPhotos.map((photo, idx) => (
                        <PhotoThumb
                          key={photo.id}
                          photo={photo}
                          index={(photoPage - 1) * PHOTOS_PER_PAGE + idx}
                          onMark={(mark) => handleMarkPhoto(photo.id, mark)}
                          onNote={() => handleOpenNote(photo.id, photo.note)}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6 pt-5 border-t border-warmPink/20">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={photoPage <= 1}
                          onClick={() => setPhotoPage((p) => Math.max(1, p - 1))}
                          className="h-9 w-9 p-0"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600 px-3">
                          第 <span className="font-semibold text-roseGold">{photoPage}</span> /{' '}
                          {totalPages} 页
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={photoPage >= totalPages}
                          onClick={() => setPhotoPage((p) => Math.min(totalPages, p + 1))}
                          className="h-9 w-9 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-2 p-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-champagne/30 to-roseGold/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-roseGold" />
                  </div>
                  <h3 className="font-semibold text-darkGray">制作进度时间轴</h3>
                </div>
                <StatusTimeline statusHistory={order.statusHistory} />
              </Card>

              <Card className="p-5 h-fit">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forestGreen/15 to-champagne/20 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-forestGreen" />
                  </div>
                  <h3 className="font-semibold text-darkGray">状态流转</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1.5">当前状态</p>
                    <StatusBadge status={order.status} size="lg" />
                  </div>

                  {order.status !== 'completed' && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500 mb-1.5">下一个状态</p>
                        <Select
                          options={nextStatusOptions}
                          value={nextStatus}
                          onChange={(v) => setNextStatus(v as ProductionStatus)}
                          placeholder="选择要流转的状态"
                        />
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-1.5">备注（可选）</p>
                        <textarea
                          value={statusRemark}
                          onChange={(e) => setStatusRemark(e.target.value)}
                          placeholder="输入状态变更备注..."
                          rows={3}
                          className={cn(
                            'w-full rounded-xl border border-warmPink/50 bg-white px-3 py-2.5',
                            'text-sm text-darkGray placeholder:text-darkGray/30',
                            'focus:outline-none focus:border-roseGold focus:ring-2 focus:ring-roseGold/30',
                            'resize-none transition-all duration-200'
                          )}
                        />
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        disabled={!nextStatus}
                        onClick={() => setStatusModalOpen(true)}
                        className="w-full shadow-lg shadow-roseGold/20"
                      >
                        <RefreshCw className="w-4 h-4" />
                        更新状态
                      </Button>
                    </>
                  )}

                  {order.status === 'completed' && (
                    <div className="rounded-xl bg-forestGreen/10 border border-forestGreen/20 p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-forestGreen/20 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-forestGreen" />
                      </div>
                      <p className="font-semibold text-forestGreen">订单已完成</p>
                      <p className="text-xs text-gray-500 mt-1">感谢您的信任与支持</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'confirm' && (
            <div className="space-y-5">
              {selectionConfirm && (
                <Card className="p-4 border-forestGreen/30 bg-gradient-to-r from-forestGreen/5 to-transparent">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forestGreen/15 text-forestGreen text-sm font-semibold">
                      <Check className="w-4 h-4" />
                      客户已确认选片
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-forestGreen/60" />
                      确认时间：{formatDate(selectionConfirm.confirmedAt, 'datetime')}
                    </span>
                    {selectionConfirm.clientSignature && (
                      <span className="flex items-center gap-1.5 text-sm text-gray-600">
                        <User className="w-4 h-4 text-champagne" />
                        客户签名：{selectionConfirm.clientSignature}
                      </span>
                    )}
                  </div>
                </Card>
              )}

              <Card id="selection-confirm-print" className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-champagne/30 to-warmPink/50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-roseGold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-darkGray">选片确认单</h3>
                      <p className="text-xs text-gray-500">
                        单号：CFM-{order.id.split('_')[1]?.toUpperCase() || '001'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.print()}
                      className="h-8 px-3 text-xs no-print"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      导出打印
                    </Button>
                    {selectionConfirm ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forestGreen/15 text-forestGreen text-sm font-medium">
                        <Check className="w-4 h-4" />
                        客户已确认
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warmPink/50 text-darkGray/60 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        待客户确认
                      </span>
                    )}
                  </div>
                </div>

                {(selectionConfirm ? selectionConfirm.albumPhotoIds.length === 0 && selectionConfirm.retouchPhotoIds.length === 0 : albumPhotos.length === 0 && retouchPhotos.length === 0) ? (
                  <div className="py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-warmPink/30 flex items-center justify-center mx-auto mb-4">
                      <BookMarked className="w-10 h-10 text-roseGold/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-darkGray mb-2">暂无选片记录</h3>
                    <p className="text-sm text-gray-500">
                      客户完成选片后，确认单将在此处展示
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {(selectionConfirm ? selectionConfirm.albumPhotoIds.map((pid) => photos.find((p) => p.id === pid)).filter(Boolean) : albumPhotos).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-darkGray flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-forestGreen" />
                            入册照片组
                            <span className="text-sm font-normal text-gray-500">
                              （{(selectionConfirm ? selectionConfirm.albumPhotoIds.length : albumPhotos.length)} / {order.albumCount} 张）
                            </span>
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(selectionConfirm ? selectionConfirm.albumPhotoIds.map((pid) => photos.find((p) => p.id === pid)).filter(Boolean) : albumPhotos).map((photo, idx) => (
                            <ConfirmPhotoItem key={photo!.id} photo={photo!} index={idx} />
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectionConfirm ? selectionConfirm.retouchPhotoIds.map((pid) => photos.find((p) => p.id === pid)).filter(Boolean) : retouchPhotos).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-darkGray flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-roseGold" />
                            精修不入册组
                            <span className="text-sm font-normal text-gray-500">
                              （{(selectionConfirm ? selectionConfirm.retouchPhotoIds.length : retouchPhotos.length)} / {order.retouchCount} 张）
                            </span>
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {(selectionConfirm ? selectionConfirm.retouchPhotoIds.map((pid) => photos.find((p) => p.id === pid)).filter(Boolean) : retouchPhotos).map((photo, idx) => (
                            <ConfirmPhotoItem key={photo!.id} photo={photo!} index={idx} />
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectionConfirm ? selectionConfirm.notes : summary.notes).length > 0 && (
                      <div className="border-t border-warmPink/20 pt-6">
                        <h4 className="font-semibold text-darkGray flex items-center gap-2 mb-4">
                          <MessageSquare className="w-4 h-4 text-roseGold" />
                          备注说明
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(selectionConfirm ? selectionConfirm.notes : summary.notes).map((n) => {
                            const p = photos.find((ph) => ph.id === n.photoId);
                            return (
                              <div
                                key={n.photoId}
                                className="flex items-start gap-3 rounded-xl bg-warmPink/20 p-3"
                              >
                                {p && (
                                  <img
                                    src={p.thumbnail}
                                    alt=""
                                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 mb-1">
                                    {p?.filename || n.photoId}
                                  </p>
                                  <p className="text-sm text-darkGray">{n.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  <div className="border-t border-warmPink/20 pt-6 mt-6 no-print">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-darkGray flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-roseGold" />
                        补选与加修记录
                      </h4>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setAddServiceModalOpen(true)}
                        className="h-8 px-3 text-xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        新增加修
                      </Button>
                    </div>

                    {additionalServices.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-warmPink/30 flex items-center justify-center mx-auto mb-3">
                          <PlusCircle className="w-6 h-6 text-roseGold/40" />
                        </div>
                        <p className="text-sm text-gray-400">暂无加修记录</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {additionalServices.map((svc) => (
                          <div
                            key={svc.id}
                            className="flex items-start gap-3 rounded-xl bg-warmPink/10 p-3"
                          >
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded font-medium shrink-0',
                              svc.type === 'additional_retouch'
                                ? 'bg-champagne/30 text-amber-700'
                                : 'bg-forestGreen/15 text-forestGreen'
                            )}>
                              {svc.type === 'additional_retouch' ? '加修' : '加册'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm text-darkGray font-medium">
                                  {svc.type === 'additional_retouch' ? '精修' : '入册'} {svc.quantity} 张
                                </span>
                                <span className="text-sm font-semibold text-roseGold">¥{svc.fee}</span>
                                <span className="text-xs text-gray-400">
                                  {svc.operatorName} · {formatDate(svc.createdAt, 'datetime')}
                                </span>
                              </div>
                              {svc.note && (
                                <p className="text-sm text-gray-500 mt-1">{svc.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'order' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-2 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-champagne/30 to-warmPink/50 flex items-center justify-center">
                    <Package className="w-4 h-4 text-roseGold" />
                  </div>
                  <h3 className="font-semibold text-darkGray">套餐信息</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">套餐名称</p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-champagne/40 to-roseGold/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 text-roseGold" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-darkGray">{order.packageName}</h4>
                        <p className="text-sm text-gray-500">订单号：{order.id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-warmPink/50 to-transparent" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoItem label="拍摄数量" value={`${order.photosCount} 张`} />
                    <InfoItem label="入册数量" value={`${order.albumCount} 张`} />
                    <InfoItem label="精修数量" value={`${order.retouchCount} 张`} />
                    <InfoItem
                      label="拍摄日期"
                      value={formatDate(order.shootDate, 'short')}
                    />
                    <InfoItem
                      label="创建时间"
                      value={formatDate(order.createdAt, 'datetime')}
                    />
                    <InfoItem label="摄影顾问" value={consultant?.name || '未分配'} />
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-warmPink/50 to-transparent" />

                  <div>
                    <p className="text-xs text-gray-500 mb-3">数量配置明细</p>
                    <div className="space-y-3">
                      <ConfigRow
                        label="原片拍摄"
                        value={`${order.photosCount} 张`}
                        desc="全部高清原片交付"
                        icon={<ImageIcon className="w-4 h-4" />}
                        iconBg="bg-warmPink/40"
                        iconColor="text-darkGray/70"
                      />
                      <ConfigRow
                        label="精修照片"
                        value={`${order.retouchCount} 张`}
                        desc="专业后期精修处理"
                        icon={<Wand2 className="w-4 h-4" />}
                        iconBg="bg-champagne/30"
                        iconColor="text-roseGold"
                      />
                      <ConfigRow
                        label="相册入册"
                        value={`${order.albumCount} 张`}
                        desc="精美相册排版入册"
                        icon={<BookImage className="w-4 h-4" />}
                        iconBg="bg-forestGreen/15"
                        iconColor="text-forestGreen"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-5">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-coralRed/15 to-roseGold/20 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-roseGold" />
                    </div>
                    <h3 className="font-semibold text-darkGray">价格信息</h3>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-xs text-gray-500 mb-1">套餐价格</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-bold text-roseGold">¥</span>
                      <span className="text-5xl font-bold bg-gradient-to-r from-champagne via-roseGold to-coralRed bg-clip-text text-transparent">
                        {calculatePrice(order.packageName, order.albumCount, order.retouchCount)}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-warmPink/50 to-transparent my-4" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>基础套餐费</span>
                      <span>
                        ¥{calculatePrice(order.packageName, order.albumCount, order.retouchCount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>精修服务（{order.retouchCount}张）</span>
                      <span>已包含</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>相册制作</span>
                      <span>已包含</span>
                    </div>
                    {additionalServices.length > 0 && (
                      <>
                        <div className="h-px bg-gradient-to-r from-transparent via-warmPink/30 to-transparent my-2" />
                        <p className="text-xs text-gray-400 mb-1">加修加册</p>
                        {additionalServices.map((svc) => (
                          <div key={svc.id} className="flex justify-between text-gray-600">
                            <span>
                              {svc.type === 'additional_retouch' ? '加修精修' : '加册入册'} {svc.quantity} 张
                            </span>
                            <span className="text-roseGold">¥{svc.fee}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold text-darkGray pt-1 border-t border-warmPink/20">
                          <span>追加费用合计</span>
                          <span className="text-roseGold">
                            ¥{additionalServices.reduce((sum, s) => sum + s.fee, 0)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  {additionalServices.length > 0 && (
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      含追加费用 ¥{additionalServices.reduce((sum, s) => sum + s.fee, 0)}
                    </p>
                  )}
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forestGreen/15 to-champagne/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-forestGreen" />
                    </div>
                    <h3 className="font-semibold text-darkGray">客户满意度</h3>
                  </div>

                  {order.satisfaction !== undefined ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              'w-8 h-8 transition-all duration-300',
                              s <= Math.round(order.satisfaction!)
                                ? 'fill-champagne text-champagne drop-shadow-sm'
                                : 'text-gray-200'
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-darkGray">
                          {order.satisfaction.toFixed(1)}
                        </span>
                        <span className="text-lg text-gray-400">/ 5.0</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {order.satisfaction >= 4.8
                          ? '非常满意！感谢您的好评 🎉'
                          : order.satisfaction >= 4.0
                            ? '客户体验良好'
                            : '服务有待提升'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className="w-7 h-7 text-gray-200"
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-400">客户尚未评分</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files);
          }
          e.target.value = '';
        }}
      />

      <Modal
        open={uploadModalOpen}
        onClose={() => {
          if (!uploading) {
            setUploadModalOpen(false);
            setSelectedFiles([]);
            previewUrls.forEach((u) => URL.revokeObjectURL(u));
            setPreviewUrls([]);
            setUploadProgress('');
          }
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-darkGray mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-roseGold" />
            批量上传照片
          </h2>

          {selectedFiles.length === 0 ? (
            <div
              className="border-2 border-dashed border-roseGold/40 rounded-2xl p-8 mb-6 text-center hover:border-roseGold hover:bg-roseGold/5 transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-champagne/40 to-roseGold/20 flex items-center justify-center mx-auto mb-4"
              >
                <Upload className="w-8 h-8 text-roseGold" />
              </motion.div>
              <p className="font-semibold text-darkGray mb-1">拖拽或点击选择文件</p>
              <p className="text-xs text-gray-500">支持 JPG / PNG 格式</p>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                已选择 <span className="font-semibold text-roseGold">{selectedFiles.length}</span> 张照片
              </p>
              <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-warmPink/20">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadProgress && (
            <div className="mb-4 rounded-xl bg-warmPink/20 p-3 text-sm text-darkGray flex items-center gap-2">
              <Upload className="w-4 h-4 text-roseGold animate-bounce" />
              {uploadProgress}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setUploadModalOpen(false);
                setSelectedFiles([]);
                previewUrls.forEach((u) => URL.revokeObjectURL(u));
                setPreviewUrls([]);
                setUploadProgress('');
              }}
              disabled={uploading}
            >
              取消
            </Button>
            {selectedFiles.length === 0 ? (
              <Button
                variant="primary"
                onClick={() => fileInputRef.current?.click()}
                className="shadow-lg shadow-roseGold/20"
              >
                <ImageIcon className="w-4 h-4" />
                选择照片
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleUpload}
                loading={uploading}
                disabled={selectedFiles.length === 0}
                className="shadow-lg shadow-roseGold/20"
              >
                <Upload className="w-4 h-4" />
                {uploading ? '上传中...' : `确认上传 ${selectedFiles.length} 张`}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-darkGray mb-2 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-forestGreen" />
            确认状态更新
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            将订单状态从「{STATUS_META[order.status].label}」流转至「
            {nextStatus ? STATUS_META[nextStatus as ProductionStatus].label : ''}」
          </p>

          <div className="rounded-xl bg-warmPink/20 p-4 mb-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">订单号</span>
              <span className="font-mono text-darkGray">{order.id}</span>
            </div>
            {statusRemark && (
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-gray-500 shrink-0">变更备注</span>
                <span className="text-darkGray text-right">{statusRemark}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setStatusModalOpen(false)}>
              取消
            </Button>
            <Button
              variant="success"
              onClick={handleUpdateStatus}
              className="shadow-lg shadow-forestGreen/20"
            >
              <Check className="w-4 h-4" />
              确认更新
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-darkGray mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-roseGold" />
            照片备注
          </h2>
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="输入修片要求、调整说明等备注信息..."
            rows={5}
            className={cn(
              'w-full rounded-xl border border-warmPink/50 bg-white px-3 py-3',
              'text-sm text-darkGray placeholder:text-darkGray/30',
              'focus:outline-none focus:border-roseGold focus:ring-2 focus:ring-roseGold/30',
              'resize-none transition-all duration-200 mb-6'
            )}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setNoteModalOpen(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSaveNote}>
              <Check className="w-4 h-4" />
              保存备注
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={reminderModalOpen}
        onClose={() => {
          setReminderModalOpen(false);
          setReminderChannel('wechat');
          setReminderNote('');
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-darkGray mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-roseGold" />
            登记选片提醒
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1.5">发送渠道</p>
              <Select
                options={[
                  { value: 'wechat', label: '微信' },
                  { value: 'phone', label: '电话' },
                  { value: 'sms', label: '短信' },
                  { value: 'other', label: '其他' },
                ]}
                value={reminderChannel}
                onChange={(v) => setReminderChannel(v as 'wechat' | 'phone' | 'sms' | 'other')}
                placeholder="选择发送渠道"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1.5">备注（可选）</p>
              <textarea
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="如：微信已发，客户说明天看"
                rows={3}
                className={cn(
                  'w-full rounded-xl border border-warmPink/50 bg-white px-3 py-2.5',
                  'text-sm text-darkGray placeholder:text-darkGray/30',
                  'focus:outline-none focus:border-roseGold focus:ring-2 focus:ring-roseGold/30',
                  'resize-none transition-all duration-200'
                )}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button variant="ghost" onClick={() => {
              setReminderModalOpen(false);
              setReminderChannel('wechat');
              setReminderNote('');
            }}>
              取消
            </Button>
            <Button variant="primary" onClick={handleAddReminder} className="shadow-lg shadow-roseGold/20">
              <Send className="w-4 h-4" />
              提交
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={addServiceModalOpen}
        onClose={() => {
          setAddServiceModalOpen(false);
          setServiceType('additional_retouch');
          setServiceQuantity('');
          setServiceFee('');
          setServiceNote('');
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-darkGray mb-6 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-roseGold" />
            新增加修/加册
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1.5">类型</p>
              <Select
                options={[
                  { value: 'additional_retouch', label: '加修精修' },
                  { value: 'additional_album', label: '加册入册' },
                ]}
                value={serviceType}
                onChange={(v) => setServiceType(v as 'additional_retouch' | 'additional_album')}
                placeholder="选择类型"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1.5">数量</p>
              <input
                type="number"
                min={1}
                value={serviceQuantity}
                onChange={(e) => setServiceQuantity(e.target.value)}
                placeholder="输入张数"
                className={cn(
                  'w-full rounded-xl border border-warmPink/50 bg-white px-3 py-2.5',
                  'text-sm text-darkGray placeholder:text-darkGray/30',
                  'focus:outline-none focus:border-roseGold focus:ring-2 focus:ring-roseGold/30',
                  'transition-all duration-200'
                )}
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1.5">费用（元）</p>
              <input
                type="number"
                min={0}
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                placeholder="输入费用"
                className={cn(
                  'w-full rounded-xl border border-warmPink/50 bg-white px-3 py-2.5',
                  'text-sm text-darkGray placeholder:text-darkGray/30',
                  'focus:outline-none focus:border-roseGold focus:ring-2 focus:ring-roseGold/30',
                  'transition-all duration-200'
                )}
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1.5">备注（可选）</p>
              <textarea
                value={serviceNote}
                onChange={(e) => setServiceNote(e.target.value)}
                placeholder="如：客户追加5张精修，因婚礼追加嘉宾照"
                rows={3}
                className={cn(
                  'w-full rounded-xl border border-warmPink/50 bg-white px-3 py-2.5',
                  'text-sm text-darkGray placeholder:text-darkGray/30',
                  'focus:outline-none focus:border-roseGold focus:ring-2 focus:ring-roseGold/30',
                  'resize-none transition-all duration-200'
                )}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button variant="ghost" onClick={() => {
              setAddServiceModalOpen(false);
              setServiceType('additional_retouch');
              setServiceQuantity('');
              setServiceFee('');
              setServiceNote('');
            }}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleAddService}
              disabled={!serviceQuantity || !serviceFee}
              className="shadow-lg shadow-roseGold/20"
            >
              <PlusCircle className="w-4 h-4" />
              提交
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  total,
  bgColor,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl bg-warmPink/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', bgColor)}>
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-darkGray">{value}</span>
        <span className="text-xs text-gray-400">/ {total}</span>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  current,
  total,
  gradient,
}: {
  label: string;
  current: number;
  total: number;
  gradient: string;
}) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-darkGray">
          {current} / {total} <span className="text-gray-400">({percent}%)</span>
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-warmPink/20 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className={cn('h-full rounded-full bg-gradient-to-r', gradient)}
        />
      </div>
    </div>
  );
}

function PhotoThumb({
  photo,
  index,
  onMark,
  onNote,
}: {
  photo: { id: string; thumbnail: string; filename: string; mark: PhotoMark; note?: string };
  index: number;
  onMark: (mark: PhotoMark) => void;
  onNote: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const markMeta = PHOTO_MARK_LABELS[photo.mark];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
      className="relative group aspect-[3/4] rounded-xl overflow-hidden bg-warmPink/20"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <img
        src={photo.thumbnail}
        alt={photo.filename}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          photo.mark === 'reject' && 'opacity-30 grayscale',
          photo.mark !== 'none' && photo.mark !== 'reject' && 'ring-2 ring-offset-1',
          photo.mark === 'album' && 'ring-forestGreen',
          photo.mark === 'retouch' && 'ring-roseGold'
        )}
      />

      <div className="absolute top-1.5 left-1.5 text-[10px] font-mono bg-darkGray/60 text-white px-1.5 py-0.5 rounded">
        {String(index + 1).padStart(3, '0')}
      </div>

      {markMeta.label && (
        <div
          className="absolute top-1.5 right-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm"
          style={{ backgroundColor: markMeta.bgColor, color: markMeta.color }}
        >
          {markMeta.label}
        </div>
      )}

      {photo.note && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNote();
          }}
          className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-roseGold text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <MessageSquare className="w-3 h-3" />
        </button>
      )}

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-darkGray/80 to-transparent"
          >
            <div className="grid grid-cols-4 gap-1">
              <MarkBtn
                active={photo.mark === 'album'}
                onClick={(e) => {
                  e.stopPropagation();
                  onMark(photo.mark === 'album' ? 'none' : 'album');
                }}
                title="入册"
                bg="bg-forestGreen"
              >
                <BookImage className="w-3 h-3" />
              </MarkBtn>
              <MarkBtn
                active={photo.mark === 'retouch'}
                onClick={(e) => {
                  e.stopPropagation();
                  onMark(photo.mark === 'retouch' ? 'none' : 'retouch');
                }}
                title="精修"
                bg="bg-champagne"
              >
                <Wand2 className="w-3 h-3" />
              </MarkBtn>
              <MarkBtn
                active={photo.mark === 'reject'}
                onClick={(e) => {
                  e.stopPropagation();
                  onMark(photo.mark === 'reject' ? 'none' : 'reject');
                }}
                title="删除"
                bg="bg-coralRed"
              >
                <Trash2 className="w-3 h-3" />
              </MarkBtn>
              <MarkBtn
                active={!!photo.note}
                onClick={(e) => {
                  e.stopPropagation();
                  onNote();
                }}
                title="备注"
                bg="bg-darkGray/70"
              >
                <MessageSquare className="w-3 h-3" />
              </MarkBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MarkBtn({
  children,
  onClick,
  active,
  bg,
  title,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  active: boolean;
  bg: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-full h-7 rounded-lg flex items-center justify-center text-white transition-all duration-200',
        active ? bg : `${bg}/50 hover:${bg}`
      )}
    >
      {children}
    </button>
  );
}

function ConfirmPhotoItem({
  photo,
  index,
}: {
  photo: { id: string; thumbnail: string; filename: string; mark: PhotoMark; note?: string };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="relative group"
    >
      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-warmPink/20">
        <img
          src={photo.thumbnail}
          alt={photo.filename}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-1.5 left-1.5 text-[10px] font-mono bg-darkGray/60 text-white px-1.5 py-0.5 rounded">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div
        className={cn(
          'absolute top-1.5 right-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm',
          photo.mark === 'album' && 'bg-forestGreen/90 text-white',
          photo.mark === 'retouch' && 'bg-roseGold/90 text-white'
        )}
      >
        {photo.mark === 'album' ? '入册' : '精修'}
      </div>
      {photo.note && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-11/12 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-darkGray/90 text-white text-[11px] rounded-lg px-2.5 py-2 shadow-lg whitespace-normal">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-darkGray/90 rotate-45" />
            {photo.note}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-semibold text-darkGray">{value}</p>
    </div>
  );
}

function ConfigRow({
  label,
  value,
  desc,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-warmPink/10">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-darkGray">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <div className="text-base font-bold text-roseGold shrink-0">{value}</div>
    </div>
  );
}

function calculatePrice(packageName: string, albumCount: number, retouchCount: number): string {
  const basePrices: Record<string, number> = {
    '经典婚纱套餐A': 6888,
    '尊贵婚纱套餐B': 9888,
    '豪华婚纱套餐C': 15888,
    '旅拍婚纱套餐': 12888,
    '室内实景套餐': 4888,
    '情侣写真套餐': 2888,
  };
  const base = basePrices[packageName] || 5000;
  const extra = Math.max(0, albumCount - 30) * 80 + Math.max(0, retouchCount - 20) * 50;
  return (base + extra).toLocaleString();
}

import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  BookImage,
  Wand2,
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePhotoStore } from '@/store/usePhotoStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useClientStore } from '@/store/useClientStore';
import { cn } from '@/lib/utils';

export default function SelectConfirm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const getPhotos = usePhotoStore((s) => s.getPhotos);
  const getSelectionSummary = usePhotoStore((s) => s.getSelectionSummary);
  const orders = useOrderStore((s) => s.orders);
  const getClient = useClientStore((s) => s.getClient);

  const order = useMemo(() => orders.find((o) => o.selectToken === token), [orders, token]);
  const photos = useMemo(() => (order ? getPhotos(order.id) : []), [order, getPhotos]);
  const summary = useMemo(() => (order ? getSelectionSummary(order.id) : null), [order, getSelectionSummary]);
  const client = useMemo(() => (order ? getClient(order.clientId) : null), [order, getClient]);

  const albumPhotos = useMemo(() => photos.filter((p) => p.mark === 'album'), [photos]);
  const retouchPhotos = useMemo(() => photos.filter((p) => p.mark === 'retouch'), [photos]);
  const notesPhotos = useMemo(() => photos.filter((p) => p.note && p.note.trim()), [photos]);

  const [signature, setSignature] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const albumOverflow = summary && summary.albumCount > (order?.albumCount || 0);
  const retouchOverflow = summary && summary.retouchCount > (order?.retouchCount || 0);
  const canSubmit = agreed && !albumOverflow && !retouchOverflow && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warmPink/30 via-white to-champagne/20 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-coralRed/15 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-coralRed" />
            </div>
            <h2 className="text-xl font-bold text-darkGray mb-2">链接无效</h2>
            <p className="text-gray-500 text-sm">选片链接不存在或已失效</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warmPink/30 via-white to-champagne/20 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-roseGold/15 via-warmPink/30 to-champagne/20" />
            <CardContent className="relative p-8 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="relative inline-block mb-6"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-forestGreen to-emerald-600 shadow-2xl shadow-forestGreen/30 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute -top-2 -right-2 w-10 h-10 rounded-2xl bg-gradient-to-br from-champagne to-roseGold shadow-lg flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 text-white" />
                </motion.div>
              </motion.div>
              <h2 className="text-2xl font-bold font-noto-serif-sc text-darkGray mb-2">选片确认完成！</h2>
              <p className="text-gray-500 text-sm mb-6">
                感谢您的耐心选片，我们将尽快开始精修处理
              </p>
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <BookImage className="w-4 h-4 text-forestGreen" />
                    入册照片
                  </span>
                  <Badge variant="success" className="px-3 py-1">
                    {summary?.albumCount || 0} 张
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-champagne" />
                    仅精修照片
                  </span>
                  <Badge variant="info" className="px-3 py-1">
                    {summary?.retouchCount || 0} 张
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 backdrop-blur-sm">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-roseGold" />
                    备注信息
                  </span>
                  <Badge variant="roseGold" className="px-3 py-1">
                    {notesPhotos.length} 条
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-6">
                <Heart className="w-3.5 h-3.5 text-coralRed/60 fill-coralRed/20" />
                <span>© 2026 婚纱摄影管理系统</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warmPink/20 via-white to-champagne/20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-warmPink/30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/select/${token}`)}>
                <ArrowLeft className="w-4 h-4" />
                返回选片
              </Button>
              <div className="h-6 w-px bg-warmPink/50 hidden sm:block" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold font-noto-serif-sc text-darkGray truncate">
                  {client ? `${client.name} & ${client.partnerName}` : '选片确认'}
                </h1>
                <p className="text-xs text-gray-500 truncate">{order.packageName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                <span className={cn('w-6 h-6 rounded-full flex items-center justify-center bg-roseGold text-white font-semibold text-xs')}>1</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                <span className={cn('w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs bg-gradient-to-br from-roseGold to-champagne text-white shadow-md shadow-roseGold/30')}>2</span>
              </div>
              <Badge variant="roseGold" className="hidden sm:inline-flex">确认选片</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-roseGold" />
                选片汇总
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className={cn(
                  'p-5 rounded-2xl border transition-all',
                  albumOverflow
                    ? 'bg-coralRed/10 border-coralRed/30'
                    : 'bg-gradient-to-br from-forestGreen/15 to-transparent border-forestGreen/20'
                )}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-forestGreen/20 flex items-center justify-center">
                      <BookImage className="w-5 h-5 text-forestGreen" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">入册照片</p>
                      <p className="text-2xl font-bold text-darkGray">
                        {summary?.albumCount || 0}
                        <span className="text-sm font-normal text-gray-400"> / {order.albumCount}</span>
                      </p>
                    </div>
                  </div>
                  {albumOverflow && (
                    <p className="text-xs text-coralRed flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      超出上限 {(summary?.albumCount || 0) - order.albumCount} 张，请调整
                    </p>
                  )}
                  <div className="h-2 bg-warmPink/30 rounded-full mt-3 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        albumOverflow
                          ? 'bg-gradient-to-r from-coralRed to-red-500'
                          : 'bg-gradient-to-r from-forestGreen to-emerald-600'
                      )}
                      style={{ width: `${Math.min(((summary?.albumCount || 0) / order.albumCount) * 100, 120)}%` }}
                    />
                  </div>
                </div>

                <div className={cn(
                  'p-5 rounded-2xl border transition-all',
                  retouchOverflow
                    ? 'bg-coralRed/10 border-coralRed/30'
                    : 'bg-gradient-to-br from-champagne/25 to-transparent border-champagne/30'
                )}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-champagne/30 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-champagne" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">仅精修照片</p>
                      <p className="text-2xl font-bold text-darkGray">
                        {summary?.retouchCount || 0}
                        <span className="text-sm font-normal text-gray-400"> / {order.retouchCount}</span>
                      </p>
                    </div>
                  </div>
                  {retouchOverflow && (
                    <p className="text-xs text-coralRed flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      超出上限 {(summary?.retouchCount || 0) - order.retouchCount} 张，请调整
                    </p>
                  )}
                  <div className="h-2 bg-warmPink/30 rounded-full mt-3 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        retouchOverflow
                          ? 'bg-gradient-to-r from-coralRed to-red-500'
                          : 'bg-gradient-to-r from-champagne to-roseGold'
                      )}
                      style={{ width: `${Math.min(((summary?.retouchCount || 0) / order.retouchCount) * 100, 120)}%` }}
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-roseGold/15 to-transparent border border-roseGold/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-roseGold/20 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-roseGold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">总计处理</p>
                      <p className="text-2xl font-bold text-darkGray">
                        {(summary?.albumCount || 0) + (summary?.retouchCount || 0)}
                        <span className="text-sm font-normal text-gray-400"> 张</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    未标记 {photos.filter((p) => p.mark === 'none').length} 张 · 删除 {photos.filter((p) => p.mark === 'reject').length} 张
                  </p>
                </div>
              </div>

              {notesPhotos.length > 0 && (
                <div className="pt-4 border-t border-warmPink/30">
                  <h3 className="text-sm font-semibold text-darkGray mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-roseGold" />
                    备注信息 ({notesPhotos.length} 条)
                  </h3>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {notesPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-warmPink/20"
                      >
                        <img
                          src={photo.thumbnail}
                          alt=""
                          className="w-12 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 mb-1">{photo.filename}</p>
                          <p className="text-sm text-darkGray/80">{photo.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {albumPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookImage className="w-4 h-4 text-forestGreen" />
                  入册照片预览（{albumPhotos.length} 张）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-72 overflow-y-auto">
                  {albumPhotos.map((photo, idx) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="relative aspect-[3/4] rounded-lg overflow-hidden"
                    >
                      <img src={photo.thumbnail} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {retouchPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wand2 className="w-4 h-4 text-champagne" />
                  仅精修照片预览（{retouchPhotos.length} 张）
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-72 overflow-y-auto">
                  {retouchPhotos.map((photo, idx) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="relative aspect-[3/4] rounded-lg overflow-hidden"
                    >
                      <img src={photo.thumbnail} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-2 border-roseGold/30 bg-gradient-to-br from-roseGold/5 via-white to-champagne/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-roseGold" />
                确认签名
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-warmPink/30 text-sm text-darkGray/80 leading-relaxed">
                  <p className="mb-2 font-medium text-darkGray">选片确认声明：</p>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>本人已仔细核对所有选片标记，确认无误</li>
                    <li>入册和精修数量已确认，超出部分将另行计费</li>
                    <li>备注信息已完整填写，修片要求已说明清楚</li>
                    <li>确认提交后将进入精修阶段，选片结果不可更改</li>
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-darkGray/80 mb-2">
                    客户签名（请输入主联系人姓名）
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="请输入主联系人姓名确认..."
                    className="w-full px-4 py-3 text-base rounded-xl border-2 border-warmPink/50 bg-white outline-none focus:border-roseGold focus:ring-4 focus:ring-roseGold/20 transition-all placeholder:text-darkGray/30 text-darkGray"
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded-lg border-warmPink text-roseGold focus:ring-roseGold/30 cursor-pointer"
                  />
                  <span className="text-sm text-darkGray/70 group-hover:text-darkGray transition-colors">
                    我已阅读并同意以上选片确认声明，确认选片结果为最终决定
                  </span>
                </label>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/select/${token}`)}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    返回修改
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    loading={submitting}
                    className="flex-1 shadow-lg shadow-roseGold/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {submitting ? '提交中...' : '确认提交'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

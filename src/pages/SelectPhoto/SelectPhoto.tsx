import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  BookImage,
  Wand2,
  XCircle,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  Image as ImageIcon,
  Info,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePhotoStore } from '@/store/usePhotoStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useClientStore } from '@/store/useClientStore';
import { cn } from '@/lib/utils';
import type { PhotoMark } from '@/types';

type FilterMark = 'all' | PhotoMark;

const markOptions: SelectOption[] = [
  { value: 'all', label: '全部照片' },
  { value: 'none', label: '未标记' },
  { value: 'album', label: '入册' },
  { value: 'retouch', label: '仅精修' },
  { value: 'reject', label: '删除' },
];

const markMeta: Record<PhotoMark, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  none: { label: '未标记', icon: ImageIcon, color: 'text-gray-500', bg: 'bg-gray-100' },
  album: { label: '入册', icon: BookImage, color: 'text-forestGreen', bg: 'bg-forestGreen/15' },
  retouch: { label: '仅精修', icon: Wand2, color: 'text-champagne', bg: 'bg-champagne/25' },
  reject: { label: '删除', icon: XCircle, color: 'text-coralRed', bg: 'bg-coralRed/15' },
};

export default function SelectPhoto() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const getPhotos = usePhotoStore((s) => s.getPhotos);
  const markPhoto = usePhotoStore((s) => s.markPhoto);
  const addNote = usePhotoStore((s) => s.addNote);
  const getSelectionSummary = usePhotoStore((s) => s.getSelectionSummary);
  const getOrderByToken = useOrderStore((s) => s.getOrderByToken);
  const getClient = useClientStore((s) => s.getClient);

  const order = useMemo(() => (token ? getOrderByToken(token) : undefined), [token, getOrderByToken]);
  const photos = useMemo(() => (order ? getPhotos(order.id) : []), [order, getPhotos]);
  const summary = useMemo(() => (order ? getSelectionSummary(order.id) : null), [order, getSelectionSummary]);
  const client = useMemo(() => (order ? getClient(order.clientId) : null), [order, getClient]);

  const [filterMark, setFilterMark] = useState<FilterMark>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (filterMark !== 'all' && p.mark !== filterMark) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        if (!p.filename.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  }, [photos, filterMark, searchKeyword]);

  const handleMark = (photoId: string, mark: PhotoMark) => {
    markPhoto(photoId, mark);
  };

  const selectedPhoto = useMemo(
    () => photos.find((p) => p.id === selectedPhotoId) || null,
    [photos, selectedPhotoId]
  );

  const handleSaveNote = () => {
    if (selectedPhotoId) {
      addNote(selectedPhotoId, noteText);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warmPink/30 via-white to-champagne/20 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-coralRed/15 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-coralRed" />
            </div>
            <h2 className="text-xl font-bold text-darkGray mb-2">链接无效</h2>
            <p className="text-gray-500 text-sm">选片链接不存在或已失效，请联系客服获取新链接</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warmPink/20 via-white to-champagne/20">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-warmPink/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-roseGold to-champagne shadow-lg flex items-center justify-center"
              >
                <Heart className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold font-noto-serif-sc text-darkGray">
                  {client ? `${client.name} & ${client.partnerName}` : '选片页面'}
                </h1>
                <p className="text-xs text-gray-500">{order.packageName}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="roseGold" className="px-3 py-1">
                <BookImage className="w-3.5 h-3.5 mr-1" />
                入册 {summary?.albumCount || 0}/{order.albumCount}
              </Badge>
              <Badge variant="info" className="px-3 py-1">
                <Wand2 className="w-3.5 h-3.5 mr-1" />
                精修 {summary?.retouchCount || 0}/{order.retouchCount}
              </Badge>
              <Button
                variant="primary"
                onClick={() => navigate(`/select/${token}/confirm`)}
                className="shadow-lg shadow-roseGold/20"
              >
                确认选片
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              <div className="flex-1">
                <Input
                  placeholder="搜索文件名..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  prefixIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="w-full md:w-44">
                <Select
                  options={markOptions}
                  value={filterMark}
                  onChange={(v) => setFilterMark(v as FilterMark)}
                  placeholder="筛选标记"
                />
              </div>
              {(searchKeyword || filterMark !== 'all') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchKeyword('');
                    setFilterMark('all');
                  }}
                >
                  <Filter className="w-4 h-4" />
                  清除
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {filteredPhotos.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="w-24 h-24 rounded-full bg-warmPink/40 flex items-center justify-center mb-4">
                    <ImageIcon className="w-12 h-12 text-roseGold/40" />
                  </div>
                  <p className="text-gray-500">没有找到匹配的照片</p>
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                >
                  {filteredPhotos.map((photo, idx) => {
                    const Meta = markMeta[photo.mark];
                    return (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        whileHover={{ y: -3, scale: 1.02 }}
                        onClick={() => {
                          setSelectedPhotoId(photo.id);
                          setNoteText(photo.note || '');
                        }}
                        className={cn(
                          'group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border-2',
                          selectedPhotoId === photo.id
                            ? 'border-roseGold shadow-lg shadow-roseGold/30'
                            : 'border-transparent'
                        )}
                      >
                        <img
                          src={photo.thumbnail}
                          alt={photo.filename}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-lg', Meta.bg)}>
                            <Meta.icon className={cn('w-4 h-4', Meta.color)} />
                          </div>
                        </div>
                        {photo.mark !== 'none' && (
                          <div className="absolute top-2 left-2">
                            <div className={cn('px-2 py-0.5 rounded-md text-xs font-medium shadow', Meta.bg, Meta.color)}>
                              {Meta.label}
                            </div>
                          </div>
                        )}
                        {photo.note && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1.5 text-xs text-darkGray line-clamp-2 shadow">
                              <Info className="w-3 h-3 inline mr-1 text-roseGold" />
                              {photo.note}
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMark(photo.id, 'album');
                            }}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all hover:scale-110',
                              photo.mark === 'album' ? 'bg-forestGreen text-white' : 'bg-white text-forestGreen'
                            )}
                            title="入册"
                          >
                            <BookImage className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMark(photo.id, 'retouch');
                            }}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all hover:scale-110',
                              photo.mark === 'retouch' ? 'bg-champagne text-white' : 'bg-white text-champagne'
                            )}
                            title="仅精修"
                          >
                            <Wand2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMark(photo.id, 'reject');
                            }}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all hover:scale-110',
                              photo.mark === 'reject' ? 'bg-coralRed text-white' : 'bg-white text-coralRed'
                            )}
                            title="删除"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedPhoto && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full lg:w-80 shrink-0"
            >
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="w-4 h-4 text-roseGold" />
                    照片详情
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden mb-4">
                    <img
                      src={selectedPhoto.url}
                      alt={selectedPhoto.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">文件名</p>
                      <p className="text-sm font-medium text-darkGray break-all">{selectedPhoto.filename}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">当前标记</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['none', 'album', 'retouch', 'reject'] as PhotoMark[]).map((m) => {
                          const Meta = markMeta[m];
                          return (
                            <button
                              key={m}
                              onClick={() => handleMark(selectedPhoto.id, m)}
                              className={cn(
                                'flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                                selectedPhoto.mark === m
                                  ? `${Meta.bg} ${Meta.color} ring-2 ring-offset-1 ring-current`
                                  : 'bg-warmPink/20 text-darkGray/60 hover:bg-warmPink/40'
                              )}
                            >
                              <Meta.icon className="w-3.5 h-3.5" />
                              {Meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">备注信息</p>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onBlur={handleSaveNote}
                        placeholder="添加修片要求、调整说明等备注..."
                        className="w-full h-24 px-3 py-2 text-sm rounded-xl border border-warmPink/50 bg-white resize-none outline-none focus:border-roseGold focus:ring-2 focus:ring-roseGold/30 transition-all placeholder:text-darkGray/30 text-darkGray"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => setSelectedPhotoId(null)}>
                      关闭
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        handleSaveNote();
                        setSelectedPhotoId(null);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      保存
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.aside>
          )}
        </div>
      </main>
    </div>
  );
}

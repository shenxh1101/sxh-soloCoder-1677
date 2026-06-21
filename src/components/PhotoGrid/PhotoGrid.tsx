import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Photo, PhotoMark } from '@/types';

export type PhotoFilter = 'all' | 'none' | 'album' | 'retouch' | 'reject';

interface PhotoGridProps {
  photos: Photo[];
  filter?: PhotoFilter;
  onPhotoClick: (photo: Photo, index: number) => void;
  pageSize?: number;
  className?: string;
  showCornerBadges?: boolean;
}

const markConfig: Record<Exclude<PhotoMark, 'none'>, { label: string; color: string; bg: string }> = {
  album: { label: '入册', color: 'text-white', bg: 'bg-forestGreen' },
  retouch: { label: '精修', color: 'text-white', bg: 'bg-gradient-to-r from-champagne to-roseGold' },
  reject: { label: '不选', color: 'text-white', bg: 'bg-gray-500' },
};

export function PhotoGrid({
  photos,
  filter = 'all',
  onPhotoClick,
  pageSize = 48,
  className,
  showCornerBadges = true,
}: PhotoGridProps) {
  const [page, setPage] = useState(1);

  const filteredPhotos = useMemo(() => {
    if (filter === 'all') return photos;
    return photos.filter((p) => p.mark === filter);
  }, [photos, filter]);

  const pagedPhotos = useMemo(() => {
    return filteredPhotos.slice(0, page * pageSize);
  }, [filteredPhotos, page, pageSize]);

  const hasMore = pagedPhotos.length < filteredPhotos.length;

  const handleLoadMore = () => {
    setPage((p) => p + 1);
  };

  if (filteredPhotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-warmPink/50 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-roseGold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-darkGray/60 text-lg">暂无照片</p>
        <p className="text-darkGray/40 text-sm mt-1">当前筛选条件下没有照片</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
        <AnimatePresence mode="popLayout">
          {pagedPhotos.map((photo, idx) => {
            const originalIndex = filteredPhotos.findIndex((p) => p.id === photo.id);
            return (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: (idx % 12) * 0.03 }}
                className="break-inside-avoid mb-3 md:mb-4"
              >
                <div
                  onClick={() => onPhotoClick(photo, originalIndex)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="overflow-hidden">
                    <img
                      src={photo.thumbnail}
                      alt={photo.filename}
                      loading="lazy"
                      className="w-full h-auto transform group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-darkGray/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {showCornerBadges && photo.mark !== 'none' && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium shadow-md',
                          markConfig[photo.mark].bg,
                          markConfig[photo.mark].color
                        )}
                      >
                        {markConfig[photo.mark].label}
                      </motion.span>
                    </div>
                  )}

                  {photo.note && photo.note.trim() && (
                    <div className="absolute top-2 right-2">
                      <div className="w-7 h-7 rounded-full bg-roseGold text-white flex items-center justify-center shadow-md">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white/90 text-xs truncate">{photo.filename}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8 mb-4">
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 rounded-full border-2 border-roseGold/40 text-roseGold font-medium hover:bg-roseGold/10 transition-all duration-200 hover:border-roseGold"
          >
            加载更多 ({filteredPhotos.length - pagedPhotos.length} 张)
          </button>
        </div>
      )}
    </div>
  );
}

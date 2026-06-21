import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  ArrowLeft,
  Heart,
  Sparkles,
  SearchX,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-warmPink/30 via-white to-champagne/20 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-roseGold/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-champagne/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative inline-block mb-8"
        >
          <div className="w-36 h-36 rounded-[2rem] bg-gradient-to-br from-white to-warmPink/50 shadow-2xl shadow-roseGold/20 flex items-center justify-center border border-warmPink/40">
            <div className="relative">
              <span className="text-7xl font-bold font-noto-serif-sc bg-gradient-to-br from-roseGold to-champagne bg-clip-text text-transparent">
                404
              </span>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -top-3 -right-6 w-12 h-12 rounded-2xl bg-gradient-to-br from-champagne to-roseGold shadow-lg flex items-center justify-center"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <SearchX className="w-5 h-5 text-coralRed" />
            <h1 className="text-2xl font-bold font-noto-serif-sc text-darkGray">
              页面走丢了
            </h1>
          </div>
          <p className="text-gray-500 mb-8 leading-relaxed">
            您访问的页面不存在或已被移除
            <br />
            别担心，让我们带您回到正轨
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/dashboard')}
            className="shadow-lg shadow-roseGold/20"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
            返回上一页
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 flex items-center justify-center gap-1.5 text-xs text-gray-400"
        >
          <Heart className="w-3.5 h-3.5 text-coralRed/60 fill-coralRed/20" />
          <span>婚纱摄影管理系统 · 用心记录每一个美好瞬间</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

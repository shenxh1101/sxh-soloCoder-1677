import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        if (remember) {
          localStorage.setItem('remember_username', username);
        } else {
          localStorage.removeItem('remember_username');
        }
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        setError('用户名或密码错误');
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-warmPink/30">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative md:w-1/2 min-h-[300px] md:min-h-screen overflow-hidden bg-gradient-to-br from-warmPink via-roseGold/20 to-champagne/30"
      >
        <div className="absolute inset-0">
          <img
            src="https://picsum.photos/seed/wedding/800/1200"
            alt="婚纱照"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-roseGold/60 via-roseGold/20 to-transparent" />
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl mb-6"
            >
              <Heart className="w-8 h-8 text-coralRed fill-coralRed/20" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold font-noto-serif-sc text-white mb-4 drop-shadow-lg">
              记录最美瞬间
            </h1>
            <h2 className="text-2xl md:text-3xl font-noto-serif-sc text-white/90 mb-6 drop-shadow-md">
              见证永恒爱情
            </h2>

            <div className="flex items-center gap-2 text-white/80">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm">专业婚纱摄影选片与进度跟踪系统</span>
            </div>
          </motion.div>
        </div>

        <div className="absolute top-8 right-8 w-32 h-32 rounded-full bg-champagne/20 blur-3xl" />
        <div className="absolute bottom-1/3 left-8 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      </motion.div>

      <div className="md:w-1/2 min-h-screen flex items-center justify-center p-6 md:p-12 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="w-full max-w-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-roseGold to-champagne shadow-lg mb-4">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold font-noto-serif-sc text-darkGray mb-2">
              欢迎登录
            </h2>
            <p className="text-gray-500">
              婚纱摄影管理系统
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <Input
              label="用户名"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              prefixIcon={<User className="w-5 h-5" />}
              placeholder="请输入用户名"
              autoComplete="username"
            />

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefixIcon={<Lock className="w-5 h-5" />}
              placeholder="请输入密码"
              autoComplete="current-password"
              error={error}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-warmPink text-roseGold focus:ring-roseGold/30 cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-darkGray transition-colors">
                  记住我
                </span>
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-shadow"
            >
              {loading ? '登录中...' : '登 录'}
            </Button>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center pt-4"
            >
              <p className="text-sm text-gray-400">
                默认账号：<span className="text-roseGold font-medium">admin</span>
                {' / '}
                <span className="text-roseGold font-medium">123456</span>
              </p>
            </motion.div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center text-xs text-gray-400"
          >
            © 2026 婚纱摄影管理系统 · 版权所有
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

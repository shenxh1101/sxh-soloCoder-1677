export type UserRole = 'admin' | 'consultant' | 'service' | 'editor';

export type ProductionStatus =
  | 'pending_photos'
  | 'pending_selection'
  | 'retouching'
  | 'layout'
  | 'album_making'
  | 'shipping'
  | 'completed';

export type PhotoMark = 'none' | 'album' | 'retouch' | 'reject';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  partnerName: string;
  phone: string;
  wechat?: string;
  address?: string;
  consultantId: string;
  createdAt: string;
}

export interface StatusRecord {
  status: ProductionStatus;
  updatedAt: string;
  operatorId: string;
  remark?: string;
}

export interface Order {
  id: string;
  clientId: string;
  consultantId: string;
  packageName: string;
  photosCount: number;
  albumCount: number;
  retouchCount: number;
  shootDate: string;
  status: ProductionStatus;
  selectToken: string;
  selectExpireAt: string;
  satisfaction?: number;
  statusHistory: StatusRecord[];
  createdAt: string;
}

export interface Photo {
  id: string;
  orderId: string;
  url: string;
  thumbnail: string;
  filename: string;
  mark: PhotoMark;
  note?: string;
  uploadedAt: string;
}

export interface MonthlyStat {
  month: string;
  consultantId: string;
  consultantName: string;
  completedPhotos: number;
  retouchedPhotos: number;
  satisfaction: number;
  orderCount: number;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  type: 'deposit' | 'balance' | 'additional';
  amount: number;
  method: 'cash' | 'transfer' | 'wechat' | 'alipay' | 'other';
  operatorId: string;
  operatorName: string;
  createdAt: string;
  note?: string;
}

export const STATUS_META: Record<
  ProductionStatus,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  pending_photos: {
    label: '待上传照片',
    color: '#D97706',
    bgColor: '#FEF3C7',
    icon: 'Upload',
  },
  pending_selection: {
    label: '待客户选片',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    icon: 'Clock',
  },
  retouching: {
    label: '精修中',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    icon: 'Wand2',
  },
  layout: {
    label: '排版中',
    color: '#0891B2',
    bgColor: '#CFFAFE',
    icon: 'Layout',
  },
  album_making: {
    label: '相册制作中',
    color: '#059669',
    bgColor: '#D1FAE5',
    icon: 'BookImage',
  },
  shipping: {
    label: '物流中',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: 'Truck',
  },
  completed: {
    label: '已完成',
    color: '#4A7C59',
    bgColor: '#ECFDF5',
    icon: 'CheckCircle2',
  },
};

const ALL_STATUSES: ProductionStatus[] = [
  'pending_photos',
  'pending_selection',
  'retouching',
  'layout',
  'album_making',
  'shipping',
  'completed',
];

const PACKAGES = [
  { name: '经典婚纱套餐A', album: 40, retouch: 30, price: 6888 },
  { name: '尊贵婚纱套餐B', album: 50, retouch: 40, price: 9888 },
  { name: '豪华婚纱套餐C', album: 60, retouch: 50, price: 15888 },
  { name: '旅拍婚纱套餐', album: 45, retouch: 35, price: 12888 },
  { name: '室内实景套餐', album: 35, retouch: 25, price: 4888 },
  { name: '情侣写真套餐', album: 30, retouch: 20, price: 2888 },
];

const GROOM_NAMES = [
  '张伟', '王磊', '李建国', '刘洋', '陈昊', '杨帆',
  '赵鹏', '周杰', '吴强', '郑浩', '孙明', '黄磊',
];

const BRIDE_NAMES = [
  '李娜', '王芳', '张美丽', '刘婷', '陈雪', '杨琳',
  '赵丽', '周敏', '吴倩', '郑婷', '孙悦', '黄蕾',
];

const DISTRICTS = [
  '朝阳区', '海淀区', '东城区', '西城区', '丰台区', '通州区',
  '浦东新区', '黄浦区', '徐汇区', '静安区', '天河区', '南山区',
];

const CITIES = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '成都市'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  const prefixes = ['138', '139', '150', '151', '158', '159', '186', '187', '188', '136'];
  return randomItem(prefixes) + String(randomInt(10000000, 99999999));
}

function generateId(prefix: string, index: number): string {
  return `${prefix}_${String(index).padStart(3, '0')}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUsers(): User[] {
  return [
    {
      id: 'user_001',
      username: 'admin',
      name: '林管理',
      role: 'admin',
      phone: '13800138000',
      avatar: 'https://picsum.photos/seed/admin001/100/100',
      isActive: true,
      createdAt: '2025-01-15T09:00:00.000Z',
    },
    {
      id: 'user_002',
      username: 'consultant1',
      name: '苏晚晴',
      role: 'consultant',
      phone: '13800138001',
      avatar: 'https://picsum.photos/seed/consultant001/100/100',
      isActive: true,
      createdAt: '2025-02-20T10:00:00.000Z',
    },
    {
      id: 'user_003',
      username: 'consultant2',
      name: '顾星辰',
      role: 'consultant',
      phone: '13800138002',
      avatar: 'https://picsum.photos/seed/consultant002/100/100',
      isActive: true,
      createdAt: '2025-03-10T11:00:00.000Z',
    },
    {
      id: 'user_004',
      username: 'service1',
      name: '何小悦',
      role: 'service',
      phone: '13800138003',
      avatar: 'https://picsum.photos/seed/service001/100/100',
      isActive: true,
      createdAt: '2025-03-25T14:00:00.000Z',
    },
    {
      id: 'user_005',
      username: 'editor1',
      name: '沈墨白',
      role: 'editor',
      phone: '13800138004',
      avatar: 'https://picsum.photos/seed/editor001/100/100',
      isActive: true,
      createdAt: '2025-04-01T13:00:00.000Z',
    },
  ];
}

function generateClients(users: User[]): Client[] {
  const consultants = users.filter((u) => u.role === 'consultant');
  const clients: Client[] = [];
  const usedCombos = new Set<string>();

  for (let i = 0; i < 12; i++) {
    let groomIdx = i % GROOM_NAMES.length;
    let brideIdx = (i + 3) % BRIDE_NAMES.length;
    while (usedCombos.has(`${groomIdx}-${brideIdx}`)) {
      groomIdx = (groomIdx + 1) % GROOM_NAMES.length;
      brideIdx = (brideIdx + 1) % BRIDE_NAMES.length;
    }
    usedCombos.add(`${groomIdx}-${brideIdx}`);

    const consultant = consultants[i % consultants.length];
    const city = randomItem(CITIES);
    const district = randomItem(DISTRICTS);
    const baseDate = new Date(2026, 0, 1);
    baseDate.setDate(baseDate.getDate() + i * 7);

    clients.push({
      id: generateId('client', i + 1),
      name: GROOM_NAMES[groomIdx],
      partnerName: BRIDE_NAMES[brideIdx],
      phone: randomPhone(),
      wechat: `wx_${GROOM_NAMES[groomIdx]}${brideIdx}`,
      address: `${city}${district}${randomItem(['望京SOHO', '国贸大厦', '中关村科技园', '滨江花园', '阳光小区', '翠湖天地'])}${randomInt(1, 99)}号楼${randomInt(1, 32)}层${randomInt(101, 3208)}室`,
      consultantId: consultant.id,
      createdAt: baseDate.toISOString(),
    });
  }

  return clients;
}

function generateOrders(clients: Client[], users: User[]): Order[] {
  const orders: Order[] = [];
  const consultants = users.filter((u) => u.role === 'consultant');
  const editors = users.filter((u) => u.role === 'editor');
  const services = users.filter((u) => u.role === 'service');
  const allStaffIds = users.map((u) => u.id);

  for (let i = 0; i < 12; i++) {
    const client = clients[i];
    const consultant = consultants.find((c) => c.id === client.consultantId)!;
    const pkg = PACKAGES[i % PACKAGES.length];
    const status = ALL_STATUSES[i % ALL_STATUSES.length];
    const photoCount = randomInt(40, 80);

    const shootBase = new Date(2026, 3, 1);
    shootBase.setDate(shootBase.getDate() + i * 5);
    const shootDate = formatDate(shootBase);

    const createdBase = new Date(shootBase);
    createdBase.setDate(createdBase.getDate() - 10);
    const createdAt = createdBase.toISOString();

    const statusIdx = ALL_STATUSES.indexOf(status);
    const statusHistory: StatusRecord[] = [];
    let currentDate = new Date(createdAt);

    for (let s = 0; s <= statusIdx; s++) {
      const sStatus = ALL_STATUSES[s];
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + randomInt(1, 4));

      let operatorId = consultant.id;
      if (sStatus === 'retouching' || sStatus === 'layout' || sStatus === 'album_making') {
        operatorId = editors[0].id;
      } else if (sStatus === 'shipping') {
        operatorId = services[0].id;
      } else if (sStatus === 'completed') {
        operatorId = randomItem(allStaffIds);
      }

      const remarks: Record<ProductionStatus, string[]> = {
        pending_photos: ['客户已签约，等待拍摄档期', '合同已确认，定金已收取'],
        pending_selection: ['原片已全部上传，请客户尽快选片', '已发送选片链接至客户微信'],
        retouching: ['开始精修处理，预计7个工作日', '客户反馈部分照片需调整肤色'],
        layout: ['开始相册排版设计', '排版方案A已发送客户确认'],
        album_making: ['已发工厂制作相册', '加急处理，客户婚期临近'],
        shipping: ['顺丰速运发货，运单号：SF' + randomInt(100000000000, 999999999999), '已寄出，预计3天内送达'],
        completed: ['客户已签收，满意度好评', '订单完成，感谢客户信任'],
      };

      statusHistory.push({
        status: sStatus,
        updatedAt: currentDate.toISOString(),
        operatorId,
        remark: s === statusIdx || Math.random() > 0.3 ? randomItem(remarks[sStatus]) : undefined,
      });
    }

    const expireDate = new Date(shootBase);
    expireDate.setDate(expireDate.getDate() + 30);

    let satisfaction: number | undefined;
    if (status === 'completed') {
      satisfaction = Math.round((4.2 + Math.random() * 0.7) * 10) / 10;
    } else if (status === 'shipping' && Math.random() > 0.5) {
      satisfaction = Math.round((4.2 + Math.random() * 0.7) * 10) / 10;
    }

    orders.push({
      id: generateId('order', i + 1),
      clientId: client.id,
      consultantId: consultant.id,
      packageName: pkg.name,
      photosCount: photoCount,
      albumCount: pkg.album,
      retouchCount: pkg.retouch,
      shootDate,
      status,
      selectToken: generateToken(),
      selectExpireAt: expireDate.toISOString(),
      satisfaction,
      statusHistory,
      createdAt,
    });
  }

  return orders;
}

function generatePhotos(orders: Order[]): Photo[] {
  const photos: Photo[] = [];
  const notePool = [
    '这张笑容很自然，希望保留',
    '背景可以稍微虚化一点',
    '肤色调亮一些，显得更白',
    '非常喜欢这张的构图',
    '裙摆飘起来的瞬间太美了',
    '眼神交流的感觉很到位',
    '希望修一下手臂的线条',
    '这张可以做放大相框',
    '当作迎宾海报不错',
    '花束的颜色再鲜艳点',
  ];

  for (const order of orders) {
    const statusIdx = ALL_STATUSES.indexOf(order.status);
    const canMark = statusIdx >= ALL_STATUSES.indexOf('pending_selection');

    for (let i = 0; i < order.photosCount; i++) {
      const seed = `${order.id}_${i + 1}`;
      const photoId = `photo_${order.id.split('_')[1]}_${String(i + 1).padStart(3, '0')}`;

      let mark: PhotoMark = 'none';
      let note: string | undefined;

      if (canMark) {
        const markRand = Math.random();
        if (markRand < 0.45) {
          mark = 'album';
          if (Math.random() < 0.2) {
            note = randomItem(notePool);
          }
        } else if (markRand < 0.65) {
          mark = 'retouch';
          if (Math.random() < 0.3) {
            note = randomItem(notePool);
          }
        } else if (markRand < 0.8) {
          mark = 'reject';
        }

        if (mark === 'album' && i < 5) {
          note = note || (Math.random() < 0.4 ? randomItem(notePool) : undefined);
        }
      }

      const uploadDate = addDays(order.createdAt, randomInt(1, 3));

      photos.push({
        id: photoId,
        orderId: order.id,
        url: `https://picsum.photos/seed/${seed}/600/800`,
        thumbnail: `https://picsum.photos/seed/${seed}/400/533`,
        filename: `IMG_${String(1000 + i).padStart(4, '0')}.jpg`,
        mark,
        note,
        uploadedAt: uploadDate,
      });
    }
  }

  return photos;
}

function generateStats(users: User[]): MonthlyStat[] {
  const consultants = users.filter((u) => u.role === 'consultant');
  const stats: MonthlyStat[] = [];
  const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];

  const baseValues: Record<string, { photos: [number, number]; retouch: [number, number] }> = {
    'user_002': { photos: [180, 260], retouch: [120, 180] },
    'user_003': { photos: [160, 240], retouch: [100, 160] },
  };

  for (let mi = 0; mi < months.length; mi++) {
    const month = months[mi];
    for (const consultant of consultants) {
      const base = baseValues[consultant.id] || { photos: [150, 220], retouch: [90, 150] };
      const monthFactor = 1 + (mi * 0.05);
      const completedPhotos = Math.round(randomInt(base.photos[0], base.photos[1]) * monthFactor);
      const retouchedPhotos = Math.round(randomInt(base.retouch[0], base.retouch[1]) * monthFactor);
      const orderCount = randomInt(3, 6);
      const satisfaction = Math.round((4.2 + Math.random() * 0.7) * 10) / 10;

      stats.push({
        month,
        consultantId: consultant.id,
        consultantName: consultant.name,
        completedPhotos,
        retouchedPhotos,
        satisfaction,
        orderCount,
      });
    }
  }

  return stats;
}

function generatePaymentRecords(orders: Order[], users: User[]): Record<string, PaymentRecord[]> {
  const records: Record<string, PaymentRecord[]> = {};
  const consultants = users.filter((u) => u.role === 'consultant');

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const pkg = PACKAGES[i % PACKAGES.length];
    const totalDue = pkg.price + Math.max(0, order.albumCount - 30) * 80 + Math.max(0, order.retouchCount - 20) * 50;
    const consultant = consultants.find((c) => c.id === order.consultantId) || consultants[0];
    const orderRecords: PaymentRecord[] = [];

    const depositAmount = Math.round(totalDue * 0.3 / 100) * 100;
    orderRecords.push({
      id: `pay_${order.id.split('_')[1]}_1`,
      orderId: order.id,
      type: 'deposit',
      amount: depositAmount,
      method: randomItem(['wechat', 'transfer', 'alipay'] as const),
      operatorId: consultant.id,
      operatorName: consultant.name,
      createdAt: order.createdAt,
      note: '定金',
    });

    if (i % 3 !== 0) {
      const finalAmount = Math.round(totalDue * 0.5 / 100) * 100;
      const finalDate = new Date(order.shootDate);
      finalDate.setDate(finalDate.getDate() + randomInt(1, 3));
      orderRecords.push({
        id: `pay_${order.id.split('_')[1]}_2`,
        orderId: order.id,
        type: 'balance',
        amount: finalAmount,
        method: randomItem(['transfer', 'cash', 'wechat'] as const),
        operatorId: consultant.id,
        operatorName: consultant.name,
        createdAt: finalDate.toISOString(),
        note: '尾款部分',
      });
    }

    records[order.id] = orderRecords;
  }

  return records;
}

export function generateMockData() {
  const users = generateUsers();
  const clients = generateClients(users);
  const orders = generateOrders(clients, users);
  const photos = generatePhotos(orders);
  const stats = generateStats(users);
  const paymentRecords = generatePaymentRecords(orders, users);

  return { users, clients, orders, photos, stats, paymentRecords };
}

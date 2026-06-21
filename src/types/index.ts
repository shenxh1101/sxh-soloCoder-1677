/**
 * 用户角色枚举类型
 * - admin: 系统管理员，拥有最高权限
 * - consultant: 选片顾问，负责与客户沟通选片
 * - service: 客服人员，处理客户咨询与售后
 * - editor: 后期修图师，负责照片精修与排版
 */
export type UserRole = 'admin' | 'consultant' | 'service' | 'editor';

/**
 * 订单生产状态枚举类型，描述订单从拍摄完成到最终交付的完整流程
 * - pending_photos: 待上传照片，拍摄完成后等待摄影师上传原片
 * - pending_selection: 待选片，照片已上传，等待客户进行选片
 * - retouching: 精修中，选片完成后进入照片精修阶段
 * - layout: 排版中，精修完成后进行相册版面设计
 * - album_making: 制册中，排版确认后进入实体相册制作
 * - shipping: 待发货/配送中，相册制作完成等待发货或正在配送
 * - completed: 已完成，订单全部流程结束，客户已确认收货
 */
export type ProductionStatus =
  | 'pending_photos'
  | 'pending_selection'
  | 'retouching'
  | 'layout'
  | 'album_making'
  | 'shipping'
  | 'completed';

/**
 * 照片标记枚举类型，用于客户选片时标记每张照片的处理方式
 * - none: 未标记，初始状态或未做选择
 * - album: 入册，选入相册进行排版制作
 * - retouch: 精修，仅进行精修处理但不入册
 * - reject: 删除，不纳入任何后续处理
 */
export type PhotoMark = 'none' | 'album' | 'retouch' | 'reject';

/**
 * 用户接口，描述系统用户（员工）的基本信息
 * @property id - 用户唯一标识符，UUID格式
 * @property username - 登录用户名，系统内唯一
 * @property name - 用户真实姓名
 * @property role - 用户角色，决定系统权限范围
 * @property phone - 联系电话
 * @property avatar - 头像图片URL地址
 * @property isActive - 账号是否启用，false表示已禁用
 * @property createdAt - 账号创建时间，ISO 8601格式字符串
 */
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

/**
 * 客户接口，描述拍摄客户的基本信息
 * @property id - 客户唯一标识符，UUID格式
 * @property name - 客户姓名（主联系人）
 * @property partnerName - 伴侣姓名，适用于婚纱摄影等双人场景
 * @property phone - 联系电话
 * @property wechat - 微信号，用于日常沟通和发送通知
 * @property address - 收货地址，用于成品相册邮寄
 * @property consultantId - 关联的选片顾问ID，对应 User.id
 * @property createdAt - 客户档案创建时间，ISO 8601格式字符串
 */
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

/**
 * 状态变更记录接口，用于追踪订单每次状态变更的历史
 * @property status - 变更后的订单状态
 * @property updatedAt - 状态变更的时间，ISO 8601格式字符串
 * @property operatorId - 执行状态变更操作的用户ID，对应 User.id
 * @property remark - 状态变更备注信息，可选，用于记录特殊情况说明
 */
export interface StatusRecord {
  status: ProductionStatus;
  updatedAt: string;
  operatorId: string;
  remark?: string;
}

/**
 * 订单接口，描述拍摄订单的完整信息
 * @property id - 订单唯一标识符，UUID格式
 * @property clientId - 关联客户ID，对应 Client.id
 * @property consultantId - 负责该订单的选片顾问ID，对应 User.id
 * @property packageName - 套餐名称，如"经典婚纱套餐A"
 * @property photosCount - 拍摄原片总数量
 * @property albumCount - 相册入册照片数量上限
 * @property retouchCount - 精修照片数量上限
 * @property shootDate - 拍摄日期，ISO 8601格式字符串
 * @property status - 当前订单生产状态
 * @property selectToken - 客户选片访问令牌，用于生成免登录选片链接
 * @property selectExpireAt - 选片链接过期时间，ISO 8601格式字符串
 * @property satisfaction - 客户满意度评分，0-5分，可选，客户完成后填写
 * @property statusHistory - 订单状态变更历史记录数组，按时间升序排列
 * @property createdAt - 订单创建时间，ISO 8601格式字符串
 */
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

/**
 * 照片接口，描述订单中的单张照片信息
 * @property id - 照片唯一标识符，UUID格式
 * @property orderId - 所属订单ID，对应 Order.id
 * @property url - 原图访问URL地址
 * @property thumbnail - 缩略图访问URL地址，用于列表快速预览
 * @property filename - 原始文件名，保留上传时的文件名
 * @property mark - 客户选片标记，标识该照片的处理方式
 * @property note - 针对该照片的备注信息，可选，客户或顾问可添加修片要求等
 * @property uploadedAt - 照片上传时间，ISO 8601格式字符串
 */
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

/**
 * 选片确认信息接口，记录客户对选片结果的最终确认
 * @property orderId - 关联订单ID，对应 Order.id
 * @property albumPhotoIds - 客户选择入册的照片ID数组
 * @property retouchPhotoIds - 客户选择仅精修不入册的照片ID数组
 * @property notes - 针对特定照片的备注说明数组，包含照片ID和具体内容
 * @property notes[].photoId - 备注关联的照片ID，对应 Photo.id
 * @property notes[].content - 备注具体内容，如修片要求、调整说明等
 * @property confirmedAt - 客户确认选片的时间，ISO 8601格式字符串
 * @property clientSignature - 客户签名数据，可选，通常为Base64编码的签名图片
 */
export interface SelectionConfirm {
  orderId: string;
  albumPhotoIds: string[];
  retouchPhotoIds: string[];
  notes: {
    photoId: string;
    content: string;
  }[];
  confirmedAt: string;
  clientSignature?: string;
}

/**
 * 顾问月度统计数据接口，用于展示选片顾问的工作业绩
 * @property consultantId - 顾问用户ID，对应 User.id
 * @property consultantName - 顾问姓名，冗余字段用于报表展示
 * @property month - 统计月份，格式为"YYYY-MM"，如"2026-06"
 * @property totalPhotos - 该顾问本月负责订单的选片总张数
 * @property retouchPhotos - 该顾问本月产生的精修照片总张数
 * @property avgSatisfaction - 该顾问本月订单的客户满意度平均分，0-5分
 * @property orderCount - 该顾问本月处理的订单总数
 */
export interface SelectionReminder {
  id: string;
  orderId: string;
  channel: 'wechat' | 'phone' | 'sms' | 'other';
  senderId: string;
  senderName: string;
  note?: string;
  createdAt: string;
}

export interface AdditionalService {
  id: string;
  orderId: string;
  type: 'additional_retouch' | 'additional_album';
  quantity: number;
  fee: number;
  note?: string;
  operatorId: string;
  operatorName: string;
  createdAt: string;
}

export interface ConsultantStats {
  consultantId: string;
  consultantName: string;
  month: string;
  totalPhotos: number;
  retouchPhotos: number;
  avgSatisfaction: number;
  orderCount: number;
}

/**
 * 月度统计数据接口，用于数据统计报表（stats store 使用的内部类型）
 * @property month - 统计月份，格式为"YYYY-MM"
 * @property consultantId - 顾问用户ID
 * @property consultantName - 顾问姓名
 * @property completedPhotos - 完成选片照片数
 * @property retouchedPhotos - 精修完成照片数
 * @property satisfaction - 满意度评分 0-5
 * @property orderCount - 处理订单数
 */
export interface MonthlyStat {
  month: string;
  consultantId: string;
  consultantName: string;
  completedPhotos: number;
  retouchedPhotos: number;
  satisfaction: number;
  orderCount: number;
}

/**
 * 选片提醒记录接口，记录客服向客户发送选片链接的历史
 * @property id - 记录唯一标识符
 * @property orderId - 关联订单ID
 * @property channel - 发送渠道：wechat(微信)、phone(电话)、sms(短信)、other(其他)
 * @property sentBy - 发送人用户ID
 * @property sentAt - 发送时间
 * @property remark - 备注，可选
 */
export interface SelectionReminder {
  id: string;
  orderId: string;
  channel: 'wechat' | 'phone' | 'sms' | 'other';
  sentBy: string;
  sentAt: string;
  remark?: string;
}

/**
 * 补选加修记录接口，记录客户在确认选片后追加的精修需求
 * @property id - 记录唯一标识符
 * @property orderId - 关联订单ID
 * @property type - 类型：additional_retouch(加修)、additional_album(加册)
 * @property quantity - 追加数量
 * @property fee - 追加费用（元）
 * @property remark - 备注，如加修原因或具体要求
 * @property addedBy - 登记人用户ID
 * @property addedAt - 登记时间
 */
export interface AdditionalService {
  id: string;
  orderId: string;
  type: 'additional_retouch' | 'additional_album';
  quantity: number;
  fee: number;
  remark?: string;
  addedBy: string;
  addedAt: string;
}

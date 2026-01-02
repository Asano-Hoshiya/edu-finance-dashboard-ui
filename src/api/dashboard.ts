// src/api/dashboard.ts

import axios from 'axios';

// ============================================================
// 通用类型定义
// ============================================================

/**
 * 通用 API 响应结构
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * Dashboard 通用查询参数
 */
export interface DashboardQueryParams {
  /** 统计开始日期（含），格式 YYYY-MM-DD */
  startDate: string;
  /** 统计结束日期（含），格式 YYYY-MM-DD */
  endDate: string;
  /** 校区 ID（可选） */
  campusId?: string;
  /** 课型（可选），如 PS/KET/PET/FCE */
  courseType?: string;
}

// ============================================================
// A. 总览 KPI - GET /api/dashboard/summary
// ============================================================

/**
 * 财务总览 KPI 数据
 */
export interface SummaryData {
  /** 缴费人数（期间汇总） */
  payCount: number;
  /** 实缴金额（期间汇总） */
  payAmount: number;
  /** 退费人数（期间汇总） */
  refundCount: number;
  /** 退费金额（期间汇总） */
  refundAmount: number;
  /** 净收入 = payAmount - refundAmount */
  netAmount: number;
  /** 人数退费率 = refundCount / payCount（缴费人数为0时返回0） */
  refundRateByCount: number;
  /** 金额退费率 = refundAmount / payAmount（缴费金额为0时返回0） */
  refundRateByAmount: number;
}

/**
 * 获取财务总览 KPI
 * @param params 查询参数
 */
export function getSummary(
  params: DashboardQueryParams
): Promise<ApiResponse<SummaryData>> {
  return axios
    .get<ApiResponse<SummaryData>>('/api/dashboard/summary', { params })
    .then((res) => res.data);
}

// ============================================================
// B. 班级类型占比（饼图）- GET /api/dashboard/class-type
// ============================================================

/**
 * 班级类型占比数据（N/R）
 */
export interface ClassTypeData {
  /** 新开班(N)数量 */
  newCount: number;
  /** 续费班(R)数量 */
  renewCount: number;
  newPayAmount: number;
  renewPayAmount: number;
  newStudentCount: number;
  renewStudentCount: number;
}

/**
 * 获取班级类型占比（用于饼图）
 * @param params 查询参数
 */
export function getClassType(
  params: DashboardQueryParams
): Promise<ApiResponse<ClassTypeData>> {
  return axios
    .get<ApiResponse<ClassTypeData>>('/api/dashboard/class-type', { params })
    .then((res) => res.data);
}

// ============================================================
// C. 月度趋势（折线图）- GET /api/dashboard/monthly
// ============================================================

/**
 * 单月趋势数据项
 */
export interface MonthlyTrendItem {
  /** 月份，格式 YYYY-MM */
  month: string;
  /** 当月净收入 */
  netAmount: number;
  payAmount: number;
  refundAmount: number;
}

/**
 * 月度趋势数据
 */
export interface MonthlyTrendData {
  items: MonthlyTrendItem[];
}

/**
 * 获取月度净收入趋势（用于折线图）
 * @param params 查询参数
 */
export function getMonthlyTrend(
  params: DashboardQueryParams
): Promise<ApiResponse<MonthlyTrendData>> {
  return axios
    .get<ApiResponse<MonthlyTrendData>>('/api/dashboard/monthly', { params })
    .then((res) => res.data);
}

// ============================================================
// D. 班主任绩效排行（表格）- GET /api/dashboard/teacher-rank
// ============================================================

/**
 * 班主任绩效排行项
 */
export interface TeacherRankItem {
  /** 班主任 ID */
  teacherId: string;
  /** 班主任姓名 */
  teacherName: string;
  /** 管理班级数 */
  classCount: number;
  /** 缴费人数 */
  payCount: number;
  /** 实缴金额 */
  payAmount: number;
  /** 退费人数 */
  refundCount: number;
  /** 退费金额 */
  refundAmount: number;
  /** 人数退费率 */
  refundRateByCount: number;
  /** 金额退费率 */
  refundRateByAmount: number;
}

/**
 * 班主任绩效排行数据
 */
export interface TeacherRankData {
  items: TeacherRankItem[];
}

/**
 * 获取班主任绩效排行
 * @param params 查询参数
 */
export function getTeacherRank(
  params: DashboardQueryParams
): Promise<ApiResponse<TeacherRankData>> {
  return axios
    .get<ApiResponse<TeacherRankData>>('/api/dashboard/teacher-rank', { params })
    .then((res) => res.data);
}

// ============================================================
// E. 班级经营排行（表格）- GET /api/dashboard/class-rank
// ============================================================

/**
 * 班级经营排行项
 */
export interface ClassRankItem {
  /** 班级 ID */
  classId: string;
  /** 班级展示名（如 26PS003｜周三晚｜EV1） */
  classDisplay: string;
  /** 班主任姓名 */
  teacherName: string;
  /** 缴费人数（班级人数） */
  payCount: number;
  /** 实缴金额 */
  payAmount: number;
  /** 退费人数 */
  refundCount: number;
  /** 退费金额 */
  refundAmount: number;
  /** 净收入 = payAmount - refundAmount */
  netAmount: number;
}

/**
 * 班级经营排行数据
 */
export interface ClassRankData {
  items: ClassRankItem[];
}

/**
 * 获取班级经营排行
 * @param params 查询参数
 */
export function getClassRank(
  params: DashboardQueryParams
): Promise<ApiResponse<ClassRankData>> {
  return axios
    .get<ApiResponse<ClassRankData>>('/api/dashboard/class-rank', { params })
    .then((res) => res.data);
}

// ============================================================
// F. 日期×班级 Pivot 表 - GET /api/dashboard/pivot
// ============================================================

/**
 * Pivot 表查询参数（扩展通用参数）
 */
export interface PivotQueryParams extends DashboardQueryParams {
  /** 聚合指标类型 */
  metric?: 'netAmount' | 'payAmount' | 'refundAmount' | 'payCount' | 'refundCount';
  /** 班级 ID 列表（可选，用于筛选特定班级） */
  classIds?: string[];
}

/**
 * Pivot 表列定义
 */
export interface PivotColumn {
  /** 班级 ID，合计列为 '_total' */
  classId: string;
  /** 班级展示名 */
  classDisplay: string;
}

/**
 * Pivot 表行数据
 */
export interface PivotRow {
  /** 日期，格式 YYYY-MM-DD */
  date: string;
  /** 各班级对应的值，key 为 classId */
  values: Record<string, number>;
}

/**
 * Pivot 表数据
 */
export interface PivotData {
  /** 列定义（班级列表 + 合计列） */
  columns: PivotColumn[];
  /** 行数据 */
  rows: PivotRow[];
  /** 合计行（各班级汇总） */
  totals: Record<string, number>;
}

/**
 * 获取日期×班级 Pivot 表数据
 * @param params 查询参数
 */
export function getPivot(
  params: PivotQueryParams
): Promise<ApiResponse<PivotData>> {
  return axios
    .get<ApiResponse<PivotData>>('/api/dashboard/pivot', { params })
    .then((res) => res.data);
}

// ============================================================
// G. 缴费明细 - GET /api/dashboard/payment-details
// ============================================================

/**
 * 缴费明细查询参数
 */
export interface PaymentDetailsQueryParams extends DashboardQueryParams {
  /** 班级ID（可选） */
  classId?: string;
  /** 班主任ID（可选） */
  teacherId?: string;
  /** 页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
}

/**
 * 缴费明细项
 */
export interface PaymentDetailItem {
  /** 记录ID */
  id: string;
  /** 报名日期 */
  payDate: string;
  /** 班级ID */
  classId: string;
  /** 班级名称 */
  className: string;
  /** 班主任ID */
  teacherId: string;
  /** 班主任姓名 */
  teacherName: string;
  /** 缴费人数 */
  payCount: number;
  /** 实缴金额 */
  payAmount: number;
  /** 校区名称 */
  campusName?: string;
  /** 课型 */
  courseType?: string;
}

/**
 * 缴费明细响应数据
 */
export interface PaymentDetailsData {
  items: PaymentDetailItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取缴费明细
 */
export function getPaymentDetails(
  params: PaymentDetailsQueryParams
): Promise<ApiResponse<PaymentDetailsData>> {
  return axios
    .get<ApiResponse<PaymentDetailsData>>('/api/dashboard/payment-details', { params })
    .then((res) => res.data);
}

// ============================================================
// H. 退费明细 - GET /api/dashboard/refund-details
// ============================================================

/**
 * 退费明细查询参数
 */
export interface RefundDetailsQueryParams extends DashboardQueryParams {
  /** 班级ID（可选） */
  classId?: string;
  /** 班主任ID（可选） */
  teacherId?: string;
  /** 页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
}

/**
 * 退费明细项
 */
export interface RefundDetailItem {
  /** 记录ID */
  id: string;
  /** 退费日期 */
  refundDate: string;
  /** 班级ID */
  classId: string;
  /** 班级名称 */
  className: string;
  /** 班主任ID */
  teacherId: string;
  /** 班主任姓名 */
  teacherName: string;
  /** 退费人数 */
  refundCount: number;
  /** 退费金额 */
  refundAmount: number;
  /** 退费原因（可选） */
  refundReason?: string;
  /** 校区名称 */
  campusName?: string;
  /** 课型 */
  courseType?: string;
}

/**
 * 退费明细响应数据
 */
export interface RefundDetailsData {
  items: RefundDetailItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 获取退费明细
 */
export function getRefundDetails(
  params: RefundDetailsQueryParams
): Promise<ApiResponse<RefundDetailsData>> {
  return axios
    .get<ApiResponse<RefundDetailsData>>('/api/dashboard/refund-details', { params })
    .then((res) => res.data);
}

// ============================================================
// I. 校区收入分布 - GET /api/dashboard/campus-income
// ============================================================

/**
 * 校区收入项
 */
export interface CampusIncomeItem {
  /** 校区ID */
  campusId: string;
  /** 校区名称 */
  campusName: string;
  /** 收入金额 */
  amount: number;
  /** 占比 */
  ratio: number;
}

/**
 * 校区收入分布数据
 */
export interface CampusIncomeData {
  items: CampusIncomeItem[];
}

/**
 * 获取校区收入分布
 * @param params 查询参数
 */
export function getCampusIncome(
  params: DashboardQueryParams
): Promise<ApiResponse<CampusIncomeData>> {
  return axios
    .get<ApiResponse<CampusIncomeData>>('/api/dashboard/campus-income', { params })
    .then((res) => res.data);
}

// ============================================================
// J. 课型收入分布 - GET /api/dashboard/course-type-income
// ============================================================

/**
 * 课型收入项
 */
export interface CourseTypeIncomeItem {
  /** 课型代码 */
  courseType: string;
  /** 课型名称 */
  courseTypeName: string;
  /** 收入金额 */
  amount: number;
  /** 占比 */
  ratio: number;
}

/**
 * 课型收入分布数据
 */
export interface CourseTypeIncomeData {
  items: CourseTypeIncomeItem[];
}

/**
 * 获取课型收入分布
 * @param params 查询参数
 */
export function getCourseTypeIncome(
  params: DashboardQueryParams
): Promise<ApiResponse<CourseTypeIncomeData>> {
  return axios
    .get<ApiResponse<CourseTypeIncomeData>>('/api/dashboard/course-type-income', { params })
    .then((res) => res.data);
}

// ============================================================
// 集中导出
// ============================================================

export default {
  getSummary,
  getClassType,
  getMonthlyTrend,
  getTeacherRank,
  getClassRank,
  getPivot,
  getPaymentDetails,
  getRefundDetails,
  getCampusIncome,
  getCourseTypeIncome,
};
// src/api/meta.ts

import axios from 'axios';

// ============================================================
// 类型定义
// ============================================================

/** 校区 */
export interface Campus {
  id: string;
  name: string;
}

/** 元数据响应结构 */
export interface MetaData {
  /** 校区列表 */
  campuses: Campus[];
  /** 课型列表，如 ["PS", "KET", "PET", "FCE", "CAE"] */
  courseTypes: string[];
}

/** 通用 API 响应结构 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取元数据（字典/下拉选项）
 *
 * @description 用于获取校区列表、课型列表等下拉选项数据
 * @returns Promise<MetaData>
 *
 * @example
 * const meta = await getMeta();
 * console.log(meta.campuses);   // [{ id: 'bj01', name: '北京校区' }, ...]
 * console.log(meta.courseTypes); // ['PS', 'KET', 'PET', ...]
 */
export async function getMeta(): Promise<MetaData> {
  const response = await axios.get<ApiResponse<MetaData>>('/api/meta');
  return response.data.data;
}

// ============================================================
// 默认导出
// ============================================================

export default {
  getMeta,
};
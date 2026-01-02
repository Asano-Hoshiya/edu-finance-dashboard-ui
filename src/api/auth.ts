// src/api/auth.ts

import axios from 'axios';

// ============ 类型定义 ============

/**
 * 用户角色（仅允许这三种）
 */
export type UserRole = '校长' | '分校长' | '班主任';

/**
 * 用户信息
 */
export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  campusId?: string;       // 分校长/班主任所属校区
  campusName?: string;     // 校区名称
  classIds?: string[];     // 班主任负责的班级ID列表
}

/**
 * 登录请求参数
 */
export interface LoginParams {
  username: string;
  password: string;
}

/**
 * 登录响应数据
 */
export interface LoginData {
  token: string;
  user: User;
}

/**
 * 统一 API 响应结构
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// ============ API 调用 ============

const API_BASE = '/api';

/**
 * 用户登录
 */
export async function login(
  username: string,
  password: string
): Promise<ApiResponse<LoginData>> {
  const response = await axios.post<ApiResponse<LoginData>>(
    `${API_BASE}/auth/login`,
    { username, password }
  );
  return response.data;
}

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  const response = await axios.get<ApiResponse<User>>(
    `${API_BASE}/auth/current-user`
  );
  return response.data;
}

/**
 * 用户登出
 */
export async function logout(): Promise<ApiResponse<null>> {
  const response = await axios.post<ApiResponse<null>>(
    `${API_BASE}/auth/logout`
  );
  return response.data;
}

// ============ 权限判断辅助函数（供 view 层调用，避免硬编码角色） ============

/** 是否为校长 */
export const isPrincipal = (user: User): boolean => user.role === '校长';

/** 是否为分校长 */
export const isVicePrincipal = (user: User): boolean => user.role === '分校长';

/** 是否为班主任 */
export const isTeacher = (user: User): boolean => user.role === '班主任';

/** 是否有权查看所有校区 */
export const canViewAllCampuses = (user: User): boolean => isPrincipal(user);

/** 是否有权查看指定校区 */
export const canViewCampus = (user: User, campusId: string): boolean => {
  if (isPrincipal(user)) return true;
  return user.campusId === campusId;
};

/** 是否有权查看指定班级 */
export const canViewClass = (user: User, classId: string): boolean => {
  if (isPrincipal(user) || isVicePrincipal(user)) return true;
  return user.classIds?.includes(classId) ?? false;
};

/** 是否有权配置分校长权限 */
export const canManageVicePrincipals = (user: User): boolean => isPrincipal(user);

/** 是否有权配置班主任权限 */
export const canManageTeachers = (user: User): boolean =>
  isPrincipal(user) || isVicePrincipal(user);

/** 是否有权录入招生退费数据 */
export const canEditFinanceData = (user: User): boolean => isTeacher(user);
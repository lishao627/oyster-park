/**
 * API 请求模块
 * 封装 axios，统一处理 JWT token 和错误
 */
import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：自动附加 JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理 401 等错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // token 过期或无效，清除登录态
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ========== 认证接口 ==========
export const authAPI = {
  register(username, password) {
    return api.post('/auth/register', { username, password });
  },
  login(username, password) {
    return api.post('/auth/login', { username, password });
  },
  getMe() {
    return api.get('/auth/me');
  },
};

// ========== 城市接口 ==========
export const cityAPI = {
  getAll() {
    return api.get('/cities');
  },
  create(data) {
    return api.post('/cities', data);
  },
  update(id, data) {
    return api.put(`/cities/${id}`, data);
  },
  remove(id) {
    return api.delete(`/cities/${id}`);
  },
};

// ========== 照片接口 ==========
export const photoAPI = {
  upload(cityId, files) {
    const formData = new FormData();
    formData.append('cityId', cityId);
    for (const file of files) {
      formData.append('photos', file);
    }
    return api.post('/photos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getByCity(cityId) {
    return api.get(`/photos/city/${cityId}`);
  },
  remove(id) {
    return api.delete(`/photos/${id}`);
  },
};

// ========== 手账接口 ==========
export const journalAPI = {
  get(cityId) {
    return api.get(`/journals/${cityId}`);
  },
  save(cityId, data) {
    return api.put(`/journals/${cityId}`, data);
  },
  remove(cityId) {
    return api.delete(`/journals/${cityId}`);
  },
};

export default api;

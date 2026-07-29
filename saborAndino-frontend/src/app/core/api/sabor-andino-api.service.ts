import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api.config';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface LoginApiResponse {
  type: 'success' | 'warning' | 'error' | 'exception';
  listMessage: string[];
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  tokenType: string;
}

@Injectable({ providedIn: 'root' })
export class SaborAndinoApiService {
  private readonly baseUrl = `${API_BASE_URL}/api/frontend`;

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<LoginApiResponse> {
    return this.http.post<LoginApiResponse>(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
  }

  changePassword(email: string, currentPassword: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${API_BASE_URL}/auth/change-password`, {
      email,
      currentPassword,
      newPassword
    });
  }

  getAdminProfile<T = unknown>(email: string): Observable<ApiResponse<T>> {
    const params = new HttpParams().set('email', email);
    return this.http.get<ApiResponse<T>>(`${API_BASE_URL}/auth/profile`, { params });
  }

  updateAdminProfile<T = unknown>(payload: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${API_BASE_URL}/auth/profile`, payload);
  }

  getPublicBranches<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/public/branches`);
  }

  getPublicCategories<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/public/categories`);
  }

  getPublicProducts<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/public/products`);
  }

  getPublicPromotion<T = unknown>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/public/promotion`);
  }

  getAvailableTables<T = unknown[]>(branchId: string, date: string, time: string, people: number): Observable<ApiResponse<T>> {
    const params = new HttpParams()
      .set('branchId', branchId)
      .set('date', date)
      .set('time', time)
      .set('people', people);
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/public/tables/available`, { params });
  }

  createReservation<T = unknown>(payload: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/public/reservations`, payload);
  }

  createOrder<T = unknown>(payload: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/public/orders`, payload);
  }

  trackOrder<T = unknown>(code: string, phone: string): Observable<ApiResponse<T>> {
    const params = new HttpParams().set('code', code).set('phone', phone);
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/public/orders/track`, { params });
  }

  getAdminBranches<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/branches`);
  }
  syncBranches(payload: unknown[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/admin/branches/sync`, payload);
  }
  deleteBranch(code: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/branches/${encodeURIComponent(code)}`);
  }

  getAdminCategories<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/categories`);
  }
  syncCategories(payload: unknown[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/admin/categories/sync`, payload);
  }
  deleteCategory(code: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/categories/${encodeURIComponent(code)}`);
  }

  getAdminProducts<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/products`);
  }
  syncProducts(payload: unknown[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/admin/products/sync`, payload);
  }
  deleteProduct(code: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/products/${encodeURIComponent(code)}`);
  }

  getAdminClients<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/clients`);
  }
  syncClients(payload: unknown[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/admin/clients/sync`, payload);
  }
  deleteClient(code: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/clients/${encodeURIComponent(code)}`);
  }

  getAdminTables<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/tables`);
  }
  syncTables(payload: unknown[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/admin/tables/sync`, payload);
  }
  deleteTable(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/tables/${encodeURIComponent(id)}`);
  }

  getAdminPromotions<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/promotions`);
  }
  syncPromotions(payload: unknown[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/admin/promotions/sync`, payload);
  }
  deletePromotion(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/promotions/${encodeURIComponent(id)}`);
  }

  getAdminPayments<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/payments`);
  }
  syncPayments(payload: unknown[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/admin/payments/sync`, payload);
  }

  getAdminReservations<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/reservations`);
  }
  syncReservations(payload: unknown[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/admin/reservations/sync`, payload);
  }

  getAdminOrders<T = unknown[]>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/orders`);
  }
  syncOrders(payload: unknown[]): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/admin/orders/sync`, payload);
  }

  getDashboard<T = unknown>(): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/dashboard`);
  }

  getReports<T = unknown>(from = '', to = ''): Observable<ApiResponse<T>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin/reports`, { params });
  }
}

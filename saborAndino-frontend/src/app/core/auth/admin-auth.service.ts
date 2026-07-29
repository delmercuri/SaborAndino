import { Injectable } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

import { SaborAndinoApiService } from '../api/sabor-andino-api.service';

/* =========================================================
   INTERFACES
========================================================= */

export interface AdminSession {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  branch: string;
  avatarUrl: string;
  role: 'ADMIN';
  loginDate: string;
  expiresAt: number;
}

export interface AdminAccount {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  branch: string;
  avatarUrl: string;
  role: 'ADMIN';
  updatedAt: string;
}

export interface AdminLoginResult {
  success: boolean;
  message: string;
}

export interface AdminOperationResult {
  success: boolean;
  message: string;
  logoutRequired?: boolean;
}

export interface AdminProfileUpdate {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  branch: string;
  avatarUrl: string;
}

/* =========================================================
   SERVICIO DE AUTENTICACIÓN
========================================================= */

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {

  constructor(
    private readonly api: SaborAndinoApiService
  ) {}

  /* =======================================================
     CLAVES DE ALMACENAMIENTO
  ======================================================== */

  private readonly localStorageKey =
    'sabor-andino-admin-session';

  private readonly sessionStorageKey =
    'sabor-andino-admin-temporary-session';

  private readonly accountStorageKey =
    'sabor-andino-admin-account';

  private readonly apiTokenStorageKey =
    'sabor-andino-api-token';

  /* =======================================================
     DATOS PREDETERMINADOS DEL ADMINISTRADOR
  ======================================================== */

  private readonly defaultEmail =
    'admin@saborandino.pe';

  private readonly defaultAvatar =
    '/images/logo/logo-sabor-andino.png';

  private readonly sessionDuration =
    8 * 60 * 60 * 1000;

  /* =======================================================
     INICIAR SESIÓN
  ======================================================== */

  async login(
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<AdminLoginResult> {

    if (typeof window === 'undefined') {
      return {
        success: false,
        message: 'El inicio de sesión no está disponible.'
      };
    }

    try {
      const response = await firstValueFrom(
        this.api.login(
          this.normalizeEmail(email),
          password
        ).pipe(
          timeout(10000)
        )
      );

      if (
        response.type !== 'success' ||
        !response.accessToken
      ) {
        return {
          success: false,
          message:
            response.listMessage?.[0] ??
            'El correo o la contraseña son incorrectos.'
        };
      }

      this.clearSessions();

      const storage = rememberMe ? localStorage : sessionStorage;
      const storageKey = rememberMe ? this.localStorageKey : this.sessionStorageKey;
      storage.setItem(this.apiTokenStorageKey, response.accessToken);

      let account = this.getAccount();
      account.email = this.normalizeEmail(email);

      try {
        const profileResponse = await firstValueFrom(
          this.api.getAdminProfile<AdminProfileUpdate>(account.email).pipe(timeout(10000))
        );
        if (profileResponse.success && profileResponse.data) {
          account = this.accountFromProfile(profileResponse.data, account);
        }
      } catch {
        // El login sigue siendo válido; el perfil se podrá recargar luego.
      }

      this.saveAccount(account);
      const session = this.createSession(account, Date.now());
      storage.setItem(storageKey, JSON.stringify(session));

      return {
        success: true,
        message: 'Inicio de sesión correcto.'
      };

    } catch {
      return {
        success: false,
        message:
          'No se pudo conectar con el backend. Verifica que saborandino-api esté ejecutándose en el puerto 8080.'
      };
    }
  }

  /* =======================================================
     CERRAR SESIÓN
  ======================================================== */

  logout(): void {
    this.clearSessions();
  }

  /* =======================================================
     VERIFICAR AUTENTICACIÓN
  ======================================================== */

  isAuthenticated(): boolean {
    const session =
      this.getSession();

    if (!session) {
      return false;
    }

    const token =
      localStorage.getItem(this.apiTokenStorageKey) ??
      sessionStorage.getItem(this.apiTokenStorageKey);

    if (
      !token ||
      session.role !== 'ADMIN' ||
      session.expiresAt <= Date.now()
    ) {
      this.clearSessions();

      return false;
    }

    return true;
  }

  /* =======================================================
     OBTENER SESIÓN
  ======================================================== */

  getSession(): AdminSession | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const localSession =
      this.readSession(
        localStorage,
        this.localStorageKey
      );

    if (localSession) {
      return localSession;
    }

    return this.readSession(
      sessionStorage,
      this.sessionStorageKey
    );
  }

  /* =======================================================
     OBTENER CUENTA ADMINISTRATIVA
  ======================================================== */

  getAccount(): AdminAccount {
    if (typeof window === 'undefined') {
      return this.createDefaultAccount();
    }

    const savedAccount =
      localStorage.getItem(
        this.accountStorageKey
      );

    if (!savedAccount) {
      const defaultAccount =
        this.createDefaultAccount();

      this.saveAccount(
        defaultAccount
      );

      return defaultAccount;
    }

    try {
      const parsedAccount =
        JSON.parse(
          savedAccount
        ) as Partial<AdminAccount>;

      const account =
        this.normalizeAccount(
          parsedAccount
        );

      this.saveAccount(account);

      return account;

    } catch {
      const defaultAccount =
        this.createDefaultAccount();

      this.saveAccount(
        defaultAccount
      );

      return defaultAccount;
    }
  }

  /* =======================================================
     DATOS BÁSICOS DEL ADMINISTRADOR
  ======================================================== */

  getAdminName(): string {
    return (
      this.getSession()?.name ??
      this.getAccount().name
    );
  }

  getAdminEmail(): string {
    return (
      this.getSession()?.email ??
      this.getAccount().email
    );
  }

  getAdminAvatar(): string {
    return (
      this.getSession()?.avatarUrl ??
      this.getAccount().avatarUrl ??
      this.defaultAvatar
    );
  }

  /* =======================================================
     ACTUALIZAR PERFIL
  ======================================================== */

  async updateProfile(
    profile: AdminProfileUpdate
  ): Promise<AdminOperationResult> {
    if (typeof window === 'undefined') {
      return { success: false, message: 'No se pudo actualizar el perfil.' };
    }

    const normalized: AdminProfileUpdate = {
      name: profile.name.trim(),
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      email: this.normalizeEmail(profile.email),
      phone: profile.phone.trim(),
      position: profile.position.trim(),
      branch: profile.branch.trim(),
      avatarUrl: profile.avatarUrl.trim() || this.defaultAvatar
    };

    if (!normalized.name || normalized.name.length < 3) {
      return { success: false, message: 'El nombre visible debe tener al menos 3 caracteres.' };
    }
    if (!normalized.firstName) return { success: false, message: 'Ingresa los nombres del administrador.' };
    if (!normalized.lastName) return { success: false, message: 'Ingresa los apellidos del administrador.' };
    if (!this.isValidEmail(normalized.email)) return { success: false, message: 'Ingresa un correo electrónico válido.' };
    if (normalized.phone && !this.isValidPhone(normalized.phone)) return { success: false, message: 'Ingresa un teléfono válido.' };
    if (!normalized.position) return { success: false, message: 'Ingresa el cargo del administrador.' };
    if (!normalized.branch) return { success: false, message: 'Selecciona o ingresa la sucursal asignada.' };

    const currentAccount = this.getAccount();
    try {
      const response = await firstValueFrom(
        this.api.updateAdminProfile<AdminProfileUpdate>({
          currentEmail: currentAccount.email,
          ...normalized
        }).pipe(timeout(10000))
      );
      if (!response.success || !response.data) {
        return { success: false, message: response.message || 'No se pudo guardar la información del perfil.' };
      }
      const updatedAccount = this.accountFromProfile(response.data, currentAccount);
      if (!this.saveAccount(updatedAccount)) {
        return { success: false, message: 'El perfil se actualizó en la base, pero no se pudo actualizar la sesión local.' };
      }
      this.updateActiveSession(updatedAccount);
      return { success: true, message: response.message || 'Perfil actualizado correctamente.' };
    } catch {
      return { success: false, message: 'No se pudo conectar con el backend para actualizar el perfil.' };
    }
  }

  /* =======================================================
     VERIFICAR CONTRASEÑA ACTUAL
  ======================================================== */

  verifyCurrentPassword(_password: string): boolean {
    // La verificación real se realiza en el backend al cambiar la contraseña.
    return false;
  }

  /* =======================================================
     CAMBIAR CONTRASEÑA
  ======================================================== */

  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<AdminOperationResult> {
    if (!currentPassword) {
      return { success: false, message: 'Ingresa la contraseña actual.' };
    }
    if (!newPassword) {
      return { success: false, message: 'Ingresa la nueva contraseña.' };
    }
    if (!confirmPassword) {
      return { success: false, message: 'Confirma la nueva contraseña.' };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, message: 'Las nuevas contraseñas no coinciden.' };
    }
    if (newPassword === currentPassword) {
      return { success: false, message: 'La nueva contraseña debe ser diferente de la contraseña actual.' };
    }
    const validation = this.validatePassword(newPassword);
    if (!validation.success) return validation;

    try {
      const response = await firstValueFrom(
        this.api.changePassword(this.getAdminEmail(), currentPassword, newPassword).pipe(timeout(10000))
      );
      if (!response.success) {
        return { success: false, message: response.message || 'No se pudo actualizar la contraseña.' };
      }
      this.clearSessions();
      return {
        success: true,
        message: 'Contraseña actualizada correctamente. Inicia sesión nuevamente.',
        logoutRequired: true
      };
    } catch {
      return { success: false, message: 'No se pudo conectar con el backend para cambiar la contraseña.' };
    }
  }

  /* =======================================================
     VALIDAR SEGURIDAD DE CONTRASEÑA
  ======================================================== */

  validatePassword(
    password: string
  ): AdminOperationResult {

    if (password.length < 8) {
      return {
        success: false,
        message:
          'La contraseña debe tener al menos 8 caracteres.'
      };
    }

    if (
      !/[A-Z]/.test(password)
    ) {
      return {
        success: false,
        message:
          'La contraseña debe contener al menos una letra mayúscula.'
      };
    }

    if (
      !/[a-z]/.test(password)
    ) {
      return {
        success: false,
        message:
          'La contraseña debe contener al menos una letra minúscula.'
      };
    }

    if (
      !/[0-9]/.test(password)
    ) {
      return {
        success: false,
        message:
          'La contraseña debe contener al menos un número.'
      };
    }

    if (
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return {
        success: false,
        message:
          'La contraseña debe contener al menos un símbolo.'
      };
    }

    return {
      success: true,
      message:
        'La contraseña cumple los requisitos de seguridad.'
    };
  }

  /* =======================================================
     CREAR SESIÓN
  ======================================================== */

  private createSession(
    account: AdminAccount,
    currentTime: number
  ): AdminSession {

    return {
      email:
        account.email,

      name:
        account.name,

      firstName:
        account.firstName,

      lastName:
        account.lastName,

      phone:
        account.phone,

      position:
        account.position,

      branch:
        account.branch,

      avatarUrl:
        account.avatarUrl,

      role:
        'ADMIN',

      loginDate:
        new Date(
          currentTime
        ).toISOString(),

      expiresAt:
        currentTime +
        this.sessionDuration
    };
  }

  /* =======================================================
     ACTUALIZAR SESIÓN ACTIVA
  ======================================================== */

  private updateActiveSession(
    account: AdminAccount
  ): void {

    if (typeof window === 'undefined') {
      return;
    }

    this.updateSessionInStorage(
      localStorage,
      this.localStorageKey,
      account
    );

    this.updateSessionInStorage(
      sessionStorage,
      this.sessionStorageKey,
      account
    );
  }

  private updateSessionInStorage(
    storage: Storage,
    key: string,
    account: AdminAccount
  ): void {

    const currentSession =
      this.readSession(
        storage,
        key
      );

    if (!currentSession) {
      return;
    }

    const updatedSession:
      AdminSession = {

      ...currentSession,

      email:
        account.email,

      name:
        account.name,

      firstName:
        account.firstName,

      lastName:
        account.lastName,

      phone:
        account.phone,

      position:
        account.position,

      branch:
        account.branch,

      avatarUrl:
        account.avatarUrl
    };

    try {
      storage.setItem(
        key,
        JSON.stringify(
          updatedSession
        )
      );
    } catch {
      console.warn(
        'No se pudo actualizar la sesión administrativa.'
      );
    }
  }

  /* =======================================================
     LEER SESIÓN
  ======================================================== */

  private readSession(
    storage: Storage,
    key: string
  ): AdminSession | null {

    const savedSession =
      storage.getItem(key);

    if (!savedSession) {
      return null;
    }

    try {
      const parsedSession =
        JSON.parse(
          savedSession
        ) as Partial<AdminSession>;

      if (
        !parsedSession.email ||
        !parsedSession.role ||
        !parsedSession.expiresAt
      ) {
        storage.removeItem(key);

        return null;
      }

      if (
        parsedSession.role !==
        'ADMIN'
      ) {
        storage.removeItem(key);

        return null;
      }

      if (
        Number(
          parsedSession.expiresAt
        ) <= Date.now()
      ) {
        storage.removeItem(key);

        return null;
      }

      const account =
        this.getAccount();

      return {
        email:
          parsedSession.email,

        name:
          parsedSession.name ||
          account.name,

        firstName:
          parsedSession.firstName ||
          account.firstName,

        lastName:
          parsedSession.lastName ||
          account.lastName,

        phone:
          parsedSession.phone ??
          account.phone,

        position:
          parsedSession.position ||
          account.position,

        branch:
          parsedSession.branch ||
          account.branch,

        avatarUrl:
          parsedSession.avatarUrl ||
          account.avatarUrl ||
          this.defaultAvatar,

        role:
          'ADMIN',

        loginDate:
          parsedSession.loginDate ||
          new Date().toISOString(),

        expiresAt:
          Number(
            parsedSession.expiresAt
          )
      };

    } catch {
      storage.removeItem(key);

      return null;
    }
  }

  private accountFromProfile(
    profile: AdminProfileUpdate,
    fallback: AdminAccount
  ): AdminAccount {
    return {
      email: this.normalizeEmail(profile.email || fallback.email),
      name: profile.name?.trim() || fallback.name,
      firstName: profile.firstName?.trim() || fallback.firstName,
      lastName: profile.lastName?.trim() || fallback.lastName,
      phone: profile.phone?.trim() || '',
      position: profile.position?.trim() || fallback.position,
      branch: profile.branch?.trim() || fallback.branch,
      avatarUrl: profile.avatarUrl?.trim() || this.defaultAvatar,
      role: 'ADMIN',
      updatedAt: new Date().toISOString()
    };
  }

  /* =======================================================
     CREAR CUENTA PREDETERMINADA
  ======================================================== */

  private createDefaultAccount():
    AdminAccount {

    return {
      email:
        this.defaultEmail,

      name:
        'Administrador',

      firstName:
        'Administrador',

      lastName:
        'General',

      phone:
        '',

      position:
        'Administrador general',

      branch:
        'Todas las sucursales',

      avatarUrl:
        this.defaultAvatar,

      role:
        'ADMIN',

      updatedAt:
        new Date().toISOString()
    };
  }

  /* =======================================================
     NORMALIZAR CUENTA GUARDADA
  ======================================================== */

  private normalizeAccount(
    account:
      Partial<AdminAccount>
  ): AdminAccount {

    return {
      email:
        this.normalizeEmail(
          account.email ||
          this.defaultEmail
        ),

      name:
        account.name?.trim() ||
        'Administrador',

      firstName:
        account.firstName?.trim() ||
        'Administrador',

      lastName:
        account.lastName?.trim() ||
        'General',

      phone:
        account.phone?.trim() ||
        '',

      position:
        account.position?.trim() ||
        'Administrador general',

      branch:
        account.branch?.trim() ||
        'Todas las sucursales',

      avatarUrl:
        account.avatarUrl?.trim() ||
        this.defaultAvatar,

      role:
        'ADMIN',

      updatedAt:
        account.updatedAt ||
        new Date().toISOString()
    };
  }

  /* =======================================================
     GUARDAR CUENTA
  ======================================================== */

  private saveAccount(
    account: AdminAccount
  ): boolean {

    if (typeof window === 'undefined') {
      return false;
    }

    try {
      localStorage.setItem(
        this.accountStorageKey,
        JSON.stringify(account)
      );

      return true;

    } catch {
      return false;
    }
  }

  /* =======================================================
     VALIDACIONES
  ======================================================== */

  private isValidEmail(
    email: string
  ): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  }

  private isValidPhone(
    phone: string
  ): boolean {

    const normalizedPhone =
      phone.replace(
        /[\s()+-]/g,
        ''
      );

    return /^[0-9]{7,15}$/
      .test(normalizedPhone);
  }

  private normalizeEmail(
    email: string
  ): string {

    return email
      .trim()
      .toLowerCase();
  }

  /* =======================================================
     ELIMINAR SESIONES
  ======================================================== */

  private clearSessions(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(
      this.localStorageKey
    );

    sessionStorage.removeItem(
      this.sessionStorageKey
    );

    localStorage.removeItem(
      this.apiTokenStorageKey
    );

    sessionStorage.removeItem(
      this.apiTokenStorageKey
    );
  }

}
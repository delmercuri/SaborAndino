import { CommonModule } from '@angular/common';

import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  AdminAuthService
} from '../../../../../core/auth/admin-auth.service';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl:
    './admin-login-page.html',
  styleUrl:
    './admin-login-page.css'
})
export class AdminLoginPage
  implements OnInit, OnDestroy {

  /* =======================================================
     DATOS DEL FORMULARIO
  ======================================================== */

  email = '';
  password = '';
  rememberMe = false;

  /* =======================================================
     ESTADO DE LA INTERFAZ
  ======================================================== */

  showPassword = false;
  isLoading = false;

  errorMessage = '';
  successMessage = '';

  /* =======================================================
     REDIRECCIÓN
  ======================================================== */

  private returnUrl =
    '/admin/dashboard';

  /* =======================================================
     TEMPORIZADORES
  ======================================================== */

  private loginTimer:
    ReturnType<typeof setTimeout> | null =
      null;

  private redirectTimer:
    ReturnType<typeof setTimeout> | null =
      null;

  /* =======================================================
     CONSTRUCTOR
  ======================================================== */

  constructor(
    private readonly authService:
      AdminAuthService,

    private readonly router:
      Router,

    private readonly activatedRoute:
      ActivatedRoute
  ) {}

  /* =======================================================
     INICIALIZACIÓN
  ======================================================== */

  ngOnInit(): void {

    const requestedReturnUrl =
      this.activatedRoute
        .snapshot
        .queryParamMap
        .get('returnUrl');

    this.returnUrl =
      this.getSafeReturnUrl(
        requestedReturnUrl
      );

    if (
      this.authService
        .isAuthenticated()
    ) {
      void this.router.navigateByUrl(
        this.returnUrl,
        {
          replaceUrl: true
        }
      );
    }
  }

  /* =======================================================
     DESTRUIR COMPONENTE
  ======================================================== */

  ngOnDestroy(): void {

    if (this.loginTimer) {
      clearTimeout(
        this.loginTimer
      );
    }

    if (this.redirectTimer) {
      clearTimeout(
        this.redirectTimer
      );
    }
  }

  /* =======================================================
     INICIAR SESIÓN
  ======================================================== */

  async login(): Promise<void> {

    if (this.isLoading) {
      return;
    }

    this.clearMessages();

    const normalizedEmail =
      this.email.trim().toLowerCase();

    const normalizedPassword =
      this.password;

    if (!normalizedEmail) {
      this.errorMessage =
        'Ingresa el correo electrónico.';
      return;
    }

    if (!this.isValidEmail(normalizedEmail)) {
      this.errorMessage =
        'Ingresa un correo electrónico válido.';
      return;
    }

    if (!normalizedPassword) {
      this.errorMessage =
        'Ingresa la contraseña.';
      return;
    }

    if (normalizedPassword.length < 8) {
      this.errorMessage =
        'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.isLoading = true;

    let result;

    try {
      result = await this.authService.login(
        normalizedEmail,
        normalizedPassword,
        this.rememberMe
      );
    } finally {
      this.isLoading = false;
    }

    if (!result.success) {
      this.errorMessage = result.message;
      return;
    }

    this.successMessage =
      'Acceso autorizado. Redirigiendo al panel...';

    this.redirectTimer = setTimeout(() => {
      void this.router.navigateByUrl(
        this.returnUrl,
        { replaceUrl: true }
      );
    }, 500);
  }

  /* =======================================================
     MOSTRAR U OCULTAR CONTRASEÑA
  ======================================================== */

  togglePasswordVisibility(): void {

    this.showPassword =
      !this.showPassword;
  }

  /* =======================================================
     VOLVER AL SITIO PÚBLICO
  ======================================================== */

  goToPublicSite(): void {

    if (this.isLoading) {
      return;
    }

    void this.router.navigate(
      ['/']
    );
  }

  /* =======================================================
     LIMPIAR MENSAJES AL EDITAR
  ======================================================== */

  clearLoginMessages(): void {

    if (
      this.errorMessage ||
      this.successMessage
    ) {
      this.clearMessages();
    }
  }

  /* =======================================================
     VALIDAR CORREO
  ======================================================== */

  private isValidEmail(
    email: string
  ): boolean {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  }

  /* =======================================================
     VALIDAR RUTA DE RETORNO
  ======================================================== */

  private getSafeReturnUrl(
    returnUrl: string | null
  ): string {

    if (!returnUrl) {
      return '/admin/dashboard';
    }

    const normalizedUrl =
      returnUrl.trim();

    const isInternalAdminRoute =
      normalizedUrl.startsWith(
        '/admin/'
      );

    const isLoginRoute =
      normalizedUrl.startsWith(
        '/admin/login'
      );

    if (
      !isInternalAdminRoute ||
      isLoginRoute
    ) {
      return '/admin/dashboard';
    }

    return normalizedUrl;
  }

  /* =======================================================
     LIMPIAR MENSAJES
  ======================================================== */

  private clearMessages(): void {

    this.errorMessage = '';
    this.successMessage = '';
  }

}
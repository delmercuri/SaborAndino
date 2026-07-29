import { CommonModule } from '@angular/common';

import {
  Component,
  EventEmitter,
  HostListener,
  OnInit,
  Output
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';

import {
  AdminAuthService,
  AdminProfileUpdate
} from '../../../../core/auth/admin-auth.service';

/* =========================================================
   TIPOS E INTERFACES
========================================================= */

type ProfileTab =
  | 'personal'
  | 'security';

interface AdministrativeSearchRoute {
  keywords: string[];
  route: string;
}

/* =========================================================
   COMPONENTE
========================================================= */

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-topbar.html',
  styleUrl: './admin-topbar.css'
})
export class AdminTopbar implements OnInit {

  /* =======================================================
     EVENTO DEL MENÚ LATERAL
  ======================================================== */

  @Output()
  menuRequested =
    new EventEmitter<void>();

  /* =======================================================
     ESTADO GENERAL DEL PERFIL
  ======================================================== */

  profileMenuOpen = false;

  activeProfileTab:
    ProfileTab = 'personal';

  isSavingProfile = false;
  isChangingPassword = false;

  /* =======================================================
     DATOS MOSTRADOS EN LA BARRA
  ======================================================== */

  adminName =
    'Administrador';

  adminEmail =
    'admin@saborandino.pe';

  adminAvatar =
    '/images/logo/logo-sabor-andino.png';

  adminPosition =
    'Administrador general';

  adminBranch =
    'Todas las sucursales';

  /* =======================================================
     FORMULARIO DE DATOS PERSONALES
  ======================================================== */

  profileName = '';
  profileFirstName = '';
  profileLastName = '';
  profileEmail = '';
  profilePhone = '';
  profilePosition = '';
  profileBranch = '';

  profileAvatarPreview =
    '/images/logo/logo-sabor-andino.png';

  profileMessage = '';
  profileError = '';

  /* =======================================================
     FORMULARIO DE SEGURIDAD
  ======================================================== */

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  securityMessage = '';
  securityError = '';

  /* =======================================================
     OPCIONES DEL FORMULARIO
  ======================================================== */

  branchOptions: string[] = [
    'Todas las sucursales'
  ];

  readonly positionOptions: string[] = [
    'Administrador general',
    'Gerente del restaurante',
    'Supervisor de operaciones',
    'Encargado de sucursal',
    'Administrador de pedidos'
  ];

  /* =======================================================
     CONFIGURACIÓN
  ======================================================== */

  private readonly defaultAvatar =
    '/images/logo/logo-sabor-andino.png';

  /* =======================================================
     RUTAS DEL BUSCADOR
  ======================================================== */

  private readonly searchRoutes:
    AdministrativeSearchRoute[] = [

      {
        keywords: [
          'dashboard',
          'inicio',
          'panel',
          'resumen',
          'principal'
        ],
        route: '/admin/dashboard'
      },

      {
        keywords: [
          'pedido',
          'pedidos',
          'orden',
          'ordenes',
          'órdenes'
        ],
        route: '/admin/pedidos'
      },

      {
        keywords: [
          'reserva',
          'reservas'
        ],
        route: '/admin/reservas'
      },

      {
        keywords: [
          'mesa',
          'mesas',
          'salón',
          'salon'
        ],
        route: '/admin/mesas'
      },

      {
        keywords: [
          'producto',
          'productos',
          'plato',
          'platos',
          'comida',
          'menu',
          'menú'
        ],
        route: '/admin/productos'
      },

      {
        keywords: [
          'categoria',
          'categoría',
          'categorias',
          'categorías'
        ],
        route: '/admin/categorias'
      },

      {
        keywords: [
          'sucursal',
          'sucursales',
          'local',
          'locales',
          'tienda',
          'tiendas'
        ],
        route: '/admin/sucursales'
      },

      {
        keywords: [
          'pago',
          'pagos',
          'yape',
          'tarjeta',
          'efectivo'
        ],
        route: '/admin/pagos'
      },

      {
        keywords: [
          'promocion',
          'promoción',
          'promociones',
          'oferta',
          'ofertas',
          'campaña'
        ],
        route: '/admin/promociones'
      },

      {
        keywords: [
          'cliente',
          'clientes',
          'usuario',
          'usuarios',
          'registrados'
        ],
        route: '/admin/clientes'
      },

      {
        keywords: [
          'reporte',
          'reportes',
          'estadistica',
          'estadística',
          'estadisticas',
          'estadísticas',
          'ventas',
          'ingresos'
        ],
        route: '/admin/reportes'
      }

    ];

  /* =======================================================
     CONSTRUCTOR
  ======================================================== */

  constructor(
    private readonly authService:
      AdminAuthService,

    private readonly api:
      SaborAndinoApiService,

    private readonly router:
      Router
  ) {}

  /* =======================================================
     INICIALIZACIÓN
  ======================================================== */

  ngOnInit(): void {
    this.loadAdminProfile();
    this.loadBranchOptions();
  }

  /* =======================================================
     CERRAR PERFIL CON ESCAPE
  ======================================================== */

  @HostListener(
    'document:keydown.escape'
  )
  closeProfileWithEscape(): void {

    if (this.profileMenuOpen) {
      this.closeProfileMenu();
    }
  }

  /* =======================================================
     ATAJO CTRL + K PARA EL BUSCADOR
  ======================================================== */

  @HostListener(
    'document:keydown',
    ['$event']
  )
  focusSearchWithShortcut(
    event: KeyboardEvent
  ): void {

    const shortcutPressed =
      (
        event.ctrlKey ||
        event.metaKey
      ) &&
      event.key.toLowerCase() === 'k';

    if (!shortcutPressed) {
      return;
    }

    event.preventDefault();

    const searchInput =
      document.querySelector(
        '.admin-search input'
      ) as HTMLInputElement | null;

    searchInput?.focus();
  }

  /* =======================================================
     CERRAR PERFIL AL PRESIONAR FUERA
  ======================================================== */

  @HostListener(
    'document:click',
    ['$event']
  )
  closeProfileWhenClickingOutside(
    event: MouseEvent
  ): void {

    if (!this.profileMenuOpen) {
      return;
    }

    const clickedElement =
      event.target as Element | null;

    const clickedInsideProfile =
      clickedElement?.closest(
        '.administrator-profile-wrapper'
      );

    if (!clickedInsideProfile) {
      this.closeProfileMenu();
    }
  }

  /* =======================================================
     MENÚ LATERAL
  ======================================================== */

  toggleMenu(): void {
    this.menuRequested.emit();
  }

  /* =======================================================
     MENÚ DEL PERFIL
  ======================================================== */

  toggleProfileMenu(): void {

    this.profileMenuOpen =
      !this.profileMenuOpen;

    this.clearMessages();

    if (this.profileMenuOpen) {
      this.activeProfileTab =
        'personal';

      this.loadProfileForm();
    }
  }

  closeProfileMenu(): void {

    this.profileMenuOpen = false;

    this.activeProfileTab =
      'personal';

    this.clearMessages();
    this.clearPasswordForm();
  }

  selectProfileTab(
    tab: ProfileTab
  ): void {

    this.activeProfileTab = tab;

    this.clearMessages();

    if (tab === 'personal') {
      this.loadProfileForm();
    }

    if (tab === 'security') {
      this.clearPasswordForm();
    }
  }

  /* =======================================================
     SELECCIONAR FOTOGRAFÍA
  ======================================================== */

  onAvatarSelected(
    event: Event
  ): void {

    this.profileMessage = '';
    this.profileError = '';

    const input =
      event.target as HTMLInputElement;

    const selectedFile =
      input.files?.[0];

    if (!selectedFile) {
      return;
    }

    const allowedImageTypes = [
      'image/png',
      'image/jpeg',
      'image/webp'
    ];

    if (
      !allowedImageTypes.includes(
        selectedFile.type
      )
    ) {
      this.profileError =
        'Selecciona una imagen PNG, JPG o WEBP.';

      input.value = '';

      return;
    }

    const maximumFileSize =
      1024 * 1024;

    if (
      selectedFile.size >
      maximumFileSize
    ) {
      this.profileError =
        'La fotografía no debe superar 1 MB.';

      input.value = '';

      return;
    }

    const fileReader =
      new FileReader();

    fileReader.onload = () => {

      if (
        typeof fileReader.result !==
        'string'
      ) {
        this.profileError =
          'No se pudo cargar la fotografía.';

        return;
      }

      this.profileAvatarPreview =
        fileReader.result;
    };

    fileReader.onerror = () => {

      this.profileError =
        'Ocurrió un problema al leer la fotografía.';
    };

    fileReader.readAsDataURL(
      selectedFile
    );

    input.value = '';
  }

  /* =======================================================
     ERROR AL CARGAR LA FOTOGRAFÍA
  ======================================================== */

  handleAvatarError(
    event: Event
  ): void {

    const image =
      event.target as HTMLImageElement;

    image.alt = '';

    const fallbackWasApplied =
      image.dataset['fallbackApplied'] ===
      'true';

    if (fallbackWasApplied) {
      image.style.visibility =
        'hidden';

      return;
    }

    image.dataset['fallbackApplied'] =
      'true';

    image.style.visibility =
      'visible';

    image.src =
      this.defaultAvatar;

    this.adminAvatar =
      this.defaultAvatar;

    this.profileAvatarPreview =
      this.defaultAvatar;
  }

  /* =======================================================
     GUARDAR DATOS PERSONALES
  ======================================================== */

  async saveProfile(): Promise<void> {

    this.profileMessage = '';
    this.profileError = '';

    if (this.isSavingProfile) {
      return;
    }

    const profile:
      AdminProfileUpdate = {

      name:
        this.profileName,

      firstName:
        this.profileFirstName,

      lastName:
        this.profileLastName,

      email:
        this.profileEmail,

      phone:
        this.profilePhone,

      position:
        this.profilePosition,

      branch:
        this.profileBranch,

      avatarUrl:
        this.profileAvatarPreview ||
        this.defaultAvatar
    };

    this.isSavingProfile = true;

    const result =
      await this.authService.updateProfile(
        profile
      );

    this.isSavingProfile = false;

    if (!result.success) {

      this.profileError =
        result.message;

      return;
    }

    this.loadAdminProfile();

    this.profileMessage =
      result.message;
  }

  /* =======================================================
     RESTABLECER FOTOGRAFÍA
  ======================================================== */

  resetAdminPhoto(): void {

    this.profileAvatarPreview =
      this.defaultAvatar;

    this.profileMessage = '';
    this.profileError = '';
  }

  /* =======================================================
     VISIBILIDAD DE CONTRASEÑAS
  ======================================================== */

  toggleCurrentPasswordVisibility():
    void {

    this.showCurrentPassword =
      !this.showCurrentPassword;
  }

  toggleNewPasswordVisibility():
    void {

    this.showNewPassword =
      !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility():
    void {

    this.showConfirmPassword =
      !this.showConfirmPassword;
  }

  /* =======================================================
     CAMBIAR CONTRASEÑA
  ======================================================== */

  async changePassword(): Promise<void> {

    this.securityMessage = '';
    this.securityError = '';

    if (this.isChangingPassword) {
      return;
    }

    this.isChangingPassword = true;

    const result =
      await this.authService.changePassword(
        this.currentPassword,
        this.newPassword,
        this.confirmPassword
      );

    this.isChangingPassword = false;

    if (!result.success) {

      this.securityError =
        result.message;

      return;
    }

    this.securityMessage =
      result.message;

    this.clearPasswordFieldsOnly();

    if (result.logoutRequired) {

      window.setTimeout(() => {

        this.profileMenuOpen =
          false;

        void this.router.navigate(
          ['/admin/login'],
          {
            replaceUrl: true
          }
        );

      }, 1300);
    }
  }

  /* =======================================================
     REQUISITOS DE LA CONTRASEÑA
  ======================================================== */

  get hasMinimumPasswordLength():
    boolean {

    return this.newPassword.length >= 8;
  }

  get hasPasswordUppercase():
    boolean {

    return /[A-Z]/.test(
      this.newPassword
    );
  }

  get hasPasswordLowercase():
    boolean {

    return /[a-z]/.test(
      this.newPassword
    );
  }

  get hasPasswordNumber():
    boolean {

    return /[0-9]/.test(
      this.newPassword
    );
  }

  get hasPasswordSymbol():
    boolean {

    return /[^A-Za-z0-9]/.test(
      this.newPassword
    );
  }

  get passwordsMatch():
    boolean {

    return (
      this.confirmPassword.length > 0 &&
      this.newPassword ===
        this.confirmPassword
    );
  }

  get passwordStrengthScore():
    number {

    let score = 0;

    if (
      this.hasMinimumPasswordLength
    ) {
      score++;
    }

    if (
      this.hasPasswordUppercase
    ) {
      score++;
    }

    if (
      this.hasPasswordLowercase
    ) {
      score++;
    }

    if (
      this.hasPasswordNumber
    ) {
      score++;
    }

    if (
      this.hasPasswordSymbol
    ) {
      score++;
    }

    return score;
  }

  get passwordStrengthPercentage():
    number {

    return (
      this.passwordStrengthScore /
      5
    ) * 100;
  }

  get passwordStrengthText():
    string {

    switch (
      this.passwordStrengthScore
    ) {

      case 0:
      case 1:
        return 'Muy débil';

      case 2:
        return 'Débil';

      case 3:
        return 'Regular';

      case 4:
        return 'Segura';

      case 5:
        return 'Muy segura';

      default:
        return 'Muy débil';
    }
  }

  get passwordStrengthClass():
    string {

    switch (
      this.passwordStrengthScore
    ) {

      case 0:
      case 1:
        return 'password-strength-very-weak';

      case 2:
        return 'password-strength-weak';

      case 3:
        return 'password-strength-medium';

      case 4:
        return 'password-strength-strong';

      case 5:
        return 'password-strength-very-strong';

      default:
        return 'password-strength-very-weak';
    }
  }

  /* =======================================================
     BUSCADOR ADMINISTRATIVO
  ======================================================== */

  searchAdministration(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const originalSearchValue =
      input.value.trim();

    const normalizedSearchValue =
      this.normalizeText(
        originalSearchValue
      );

    if (!normalizedSearchValue) {
      return;
    }

    const matchedRoute =
      this.searchRoutes.find(
        item =>
          item.keywords.some(
            keyword =>
              normalizedSearchValue.includes(
                this.normalizeText(
                  keyword
                )
              )
          )
      );

    if (!matchedRoute) {

      window.alert(
        `No se encontró un apartado relacionado con "${originalSearchValue}".`
      );

      return;
    }

    void this.router.navigateByUrl(
      matchedRoute.route
    );

    input.value = '';
  }

  /* =======================================================
     CERRAR SESIÓN
  ======================================================== */

  logout(): void {

    const confirmed =
      window.confirm(
        '¿Deseas cerrar la sesión administrativa?'
      );

    if (!confirmed) {
      return;
    }

    this.profileMenuOpen = false;

    this.authService.logout();

    void this.router.navigate(
      ['/admin/login'],
      {
        replaceUrl: true
      }
    );
  }

  /* =======================================================
     CARGAR INFORMACIÓN DEL ADMINISTRADOR
  ======================================================== */

  private loadBranchOptions(): void {
    this.api.getPublicBranches<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data)) return;
        const names = response.data
          .map(item => String(item['name'] ?? '').trim())
          .filter(name => name.length > 0);
        this.branchOptions = ['Todas las sucursales', ...Array.from(new Set<string>(names))];
      },
      error: () => {
        this.branchOptions = ['Todas las sucursales'];
      }
    });
  }

  private loadAdminProfile(): void {

    const account =
      this.authService.getAccount();

    this.adminName =
      account.name ||
      'Administrador';

    this.adminEmail =
      account.email ||
      'admin@saborandino.pe';

    this.adminAvatar =
      account.avatarUrl ||
      this.defaultAvatar;

    this.adminPosition =
      account.position ||
      'Administrador general';

    this.adminBranch =
      account.branch ||
      'Todas las sucursales';

    this.loadProfileForm();
  }

  /* =======================================================
     CARGAR FORMULARIO DEL PERFIL
  ======================================================== */

  private loadProfileForm(): void {

    const account =
      this.authService.getAccount();

    this.profileName =
      account.name;

    this.profileFirstName =
      account.firstName;

    this.profileLastName =
      account.lastName;

    this.profileEmail =
      account.email;

    this.profilePhone =
      account.phone;

    this.profilePosition =
      account.position;

    this.profileBranch =
      account.branch;

    this.profileAvatarPreview =
      account.avatarUrl ||
      this.defaultAvatar;
  }

  /* =======================================================
     LIMPIAR MENSAJES
  ======================================================== */

  private clearMessages(): void {

    this.profileMessage = '';
    this.profileError = '';

    this.securityMessage = '';
    this.securityError = '';
  }

  /* =======================================================
     LIMPIAR FORMULARIO DE CONTRASEÑA
  ======================================================== */

  private clearPasswordForm(): void {

    this.clearPasswordFieldsOnly();

    this.showCurrentPassword =
      false;

    this.showNewPassword =
      false;

    this.showConfirmPassword =
      false;
  }

  private clearPasswordFieldsOnly():
    void {

    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  /* =======================================================
     NORMALIZAR TEXTO
  ======================================================== */

  private normalizeText(
    value: string
  ): string {

    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );
  }

}
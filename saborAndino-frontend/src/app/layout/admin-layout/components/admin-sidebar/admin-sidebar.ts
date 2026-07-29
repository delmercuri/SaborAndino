import { CommonModule } from '@angular/common';

import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterModule
} from '@angular/router';

import {
  filter,
  Subscription
} from 'rxjs';

/* =========================================================
   INTERFACES
========================================================= */

interface AdminSubmenuItem {
  label: string;
  icon: string;
  route: string;
  queryParams?: Record<string, string>;
  action?: boolean;
}

interface AdminMenuItem {
  label: string;
  icon: string;
  route?: string;
  exact?: boolean;
  submenu?: AdminSubmenuItem[];
}

/* =========================================================
   COMPONENTE
========================================================= */

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css'
})
export class AdminSidebar
  implements OnInit, OnChanges, OnDestroy {

  /* =======================================================
     ESTADO DEL SIDEBAR
  ======================================================== */

  @Input()
  collapsed = false;

  branchesMenuOpen = false;

  private routerSubscription:
    Subscription | null = null;

  /* =======================================================
     MENÚ ADMINISTRATIVO
  ======================================================== */

  readonly menuItems:
    AdminMenuItem[] = [

      {
        label: 'Dashboard',
        icon: 'dashboard',
        route: '/admin/dashboard',
        exact: true
      },

      {
        label: 'Pedidos',
        icon: 'receipt_long',
        route: '/admin/pedidos'
      },

      {
        label: 'Reservas',
        icon: 'calendar_month',
        route: '/admin/reservas'
      },

      {
        label: 'Productos',
        icon: 'restaurant_menu',
        route: '/admin/productos'
      },

      {
        label: 'Categorías',
        icon: 'category',
        route: '/admin/categorias'
      },

      {
        label: 'Sucursales',
        icon: 'storefront',
        route: '/admin/sucursales',

        submenu: [

          {
            label: 'Todas las sucursales',
            icon: 'apps',
            route: '/admin/sucursales',
            queryParams: {
              vista: 'todas'
            }
          },

          {
            label: 'Lima',
            icon: 'location_city',
            route: '/admin/sucursales',
            queryParams: {
              departamento: 'lima'
            }
          },

          {
            label: 'Apurímac',
            icon: 'landscape',
            route: '/admin/sucursales',
            queryParams: {
              departamento: 'apurimac'
            }
          },

          {
            label: 'Ayacucho',
            icon: 'location_on',
            route: '/admin/sucursales',
            queryParams: {
              departamento: 'ayacucho'
            }
          },

          {
            label: 'Agregar sucursal',
            icon: 'add_business',
            route: '/admin/sucursales',
            queryParams: {
              accion: 'agregar'
            },
            action: true
          }

        ]
      },

      {
        label: 'Mesas',
        icon: 'table_restaurant',
        route: '/admin/mesas'
      },

      {
        label: 'Pagos',
        icon: 'payments',
        route: '/admin/pagos'
      },

      {
        label: 'Promociones',
        icon: 'campaign',
        route: '/admin/promociones'
      },

      {
        label: 'Clientes',
        icon: 'groups',
        route: '/admin/clientes'
      },

      {
        label: 'Reportes',
        icon: 'bar_chart',
        route: '/admin/reportes'
      }

    ];

  /* =======================================================
     CONSTRUCTOR
  ======================================================== */

  constructor(
    private readonly router:
      Router
  ) {}

  /* =======================================================
     INICIALIZACIÓN
  ======================================================== */

  ngOnInit(): void {

    this.synchronizeBranchesMenu(
      this.router.url
    );

    this.routerSubscription =
      this.router.events
        .pipe(
          filter(
            (
              event
            ): event is NavigationEnd =>
              event instanceof NavigationEnd
          )
        )
        .subscribe(
          event => {

            this.synchronizeBranchesMenu(
              event.urlAfterRedirects
            );

          }
        );
  }

  /* =======================================================
     CAMBIOS DEL SIDEBAR
  ======================================================== */

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    const collapsedChange =
      changes['collapsed'];

    if (!collapsedChange) {
      return;
    }

    if (
      collapsedChange.currentValue === true
    ) {
      this.branchesMenuOpen = false;

      return;
    }

    if (
      collapsedChange.currentValue === false &&
      this.isBranchesRouteActive()
    ) {
      this.branchesMenuOpen = true;
    }
  }

  /* =======================================================
     DESTRUIR COMPONENTE
  ======================================================== */

  ngOnDestroy(): void {

    this.routerSubscription
      ?.unsubscribe();
  }

  /* =======================================================
     IDENTIFICAR SUCURSALES
  ======================================================== */

  isBranchesMenuItem(
    item: AdminMenuItem
  ): boolean {

    return item.label === 'Sucursales';
  }

  /* =======================================================
     ABRIR O CERRAR SUBMENÚ
  ======================================================== */

  toggleBranchesMenu(
    event: MouseEvent
  ): void {

    event.preventDefault();
    event.stopPropagation();

    if (this.collapsed) {

      void this.router.navigate(
        ['/admin/sucursales'],
        {
          queryParams: {
            vista: 'todas'
          }
        }
      );

      return;
    }

    this.branchesMenuOpen =
      !this.branchesMenuOpen;
  }

  /* =======================================================
     VERIFICAR RUTA DE SUCURSALES
  ======================================================== */

  isBranchesRouteActive():
    boolean {

    return this.router.url
      .startsWith(
        '/admin/sucursales'
      );
  }

  /* =======================================================
     VERIFICAR SUBOPCIÓN ACTIVA
  ======================================================== */

  isSubmenuItemActive(
    item: AdminSubmenuItem
  ): boolean {

    if (
      !this.router.url.startsWith(
        item.route
      )
    ) {
      return false;
    }

    const currentUrl =
      this.router.url.toLowerCase();

    const queryParams =
      item.queryParams ?? {};

    return Object.entries(
      queryParams
    ).every(
      ([key, value]) =>
        currentUrl.includes(
          `${key.toLowerCase()}=${value.toLowerCase()}`
        )
    );
  }

  /* =======================================================
     NAVEGAR A UNA SUBOPCIÓN
  ======================================================== */

  navigateToSubmenuItem(
    item: AdminSubmenuItem
  ): void {

    void this.router.navigate(
      [item.route],
      {
        queryParams:
          item.queryParams
      }
    );
  }

  /* =======================================================
     CERRAR SUBMENÚ
  ======================================================== */

  closeBranchesSubmenu(): void {

    if (this.collapsed) {
      this.branchesMenuOpen = false;
    }
  }

  /* =======================================================
     SINCRONIZAR CON LA RUTA
  ======================================================== */

  private synchronizeBranchesMenu(
    currentUrl: string
  ): void {

    if (this.collapsed) {
      this.branchesMenuOpen = false;

      return;
    }

    this.branchesMenuOpen =
      currentUrl.startsWith(
        '/admin/sucursales'
      );
  }

}
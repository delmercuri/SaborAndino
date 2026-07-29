import { Routes } from '@angular/router';

/* =========================================================
   LAYOUT PÚBLICO
========================================================= */

import {
  PublicLayout
} from './layout/public-layout/public-layout';

/* =========================================================
   PÁGINAS PÚBLICAS
========================================================= */

import {
  HomePage
} from './features/home/pages/home-page/home-page';

import {
  MenuPage
} from './features/menu/pages/menu-page';

import {
  BranchesPage
} from './features/sucursales/pages/branches-page';

import {
  ReservationsPage
} from './features/reservas/pages/reservations-page';

import {
  SeguimientoPage
} from './features/seguimiento/pages/seguimiento-page';

/* =========================================================
   LAYOUT ADMINISTRATIVO
========================================================= */

import {
  AdminLayout
} from './layout/admin-layout/admin-layout';

/* =========================================================
   AUTENTICACIÓN ADMINISTRATIVA
========================================================= */

import {
  AdminLoginPage
} from './features/admin/auth/pages/admin-login-page/admin-login-page';

import {
  adminAuthGuard
} from './core/auth/admin-auth.guard';

/* =========================================================
   PÁGINAS ADMINISTRATIVAS
========================================================= */

import {
  DashboardPage
} from './features/admin/dashboard/pages/dashboard-page/dashboard-page';

import {
  OrdersPage
} from './features/admin/orders/pages/orders-page/orders-page';

import {
  AdminReservationsPage
} from './features/admin/reservations/pages/reservations-page/reservations-page';

import {
  AdminProductsPage
} from './features/admin/products/pages/products-page/products-page';

import {
  AdminCategoriesPage
} from './features/admin/categories/pages/categories-page/categories-page';

import {
  AdminBranchesPage
} from './features/admin/branches/pages/branches-page/branches-page';

import {
  AdminTablesPage
} from './features/admin/tables/pages/tables-page/tables-page';

import {
  AdminPaymentsPage
} from './features/admin/payments/pages/payments-page/payments-page';

import {
  AdminPromotionsPage
} from './features/admin/promotions/pages/promotions-page/promotions-page';

import {
  AdminClientsPage
} from './features/admin/clients/pages/clients-page/clients-page';

import {
  AdminReportsPage
} from './features/admin/reports/pages/reports-page/reports-page';

/* =========================================================
   RUTAS DE LA APLICACIÓN
========================================================= */

export const routes: Routes = [

  /* =======================================================
     LOGIN DEL ADMINISTRADOR
  ======================================================== */

  {
    path: 'admin/login',
    component: AdminLoginPage,
    title: 'Acceso administrativo | Sabor Andino'
  },

  /* =======================================================
     PANEL ADMINISTRATIVO PROTEGIDO
  ======================================================== */

  {
    path: 'admin',
    component: AdminLayout,

    canActivate: [
      adminAuthGuard
    ],

    children: [

      /* REDIRECCIÓN PRINCIPAL DEL ADMIN */

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      /* DASHBOARD */

      {
        path: 'dashboard',
        component: DashboardPage,
        title: 'Dashboard | Sabor Andino'
      },

      /* PEDIDOS */

      {
        path: 'pedidos',
        component: OrdersPage,
        title: 'Pedidos | Sabor Andino'
      },

      /* RESERVAS ADMINISTRATIVAS */

      {
        path: 'reservas',
        component: AdminReservationsPage,
        title: 'Gestión de reservas | Sabor Andino'
      },

      /* PRODUCTOS */

      {
        path: 'productos',
        component: AdminProductsPage,
        title: 'Gestión de productos | Sabor Andino'
      },

      /* CATEGORÍAS */

      {
        path: 'categorias',
        component: AdminCategoriesPage,
        title: 'Gestión de categorías | Sabor Andino'
      },

      /* SUCURSALES ADMINISTRATIVAS */

      {
        path: 'sucursales',
        component: AdminBranchesPage,
        title: 'Gestión de sucursales | Sabor Andino'
      },

      /* MESAS */

      {
        path: 'mesas',
        component: AdminTablesPage,
        title: 'Gestión de mesas | Sabor Andino'
      },

      /* PAGOS */

      {
        path: 'pagos',
        component: AdminPaymentsPage,
        title: 'Gestión de pagos | Sabor Andino'
      },

      /* PROMOCIONES */

      {
        path: 'promociones',
        component: AdminPromotionsPage,
        title: 'Gestión de promociones | Sabor Andino'
      },

      /* CLIENTES */

      {
        path: 'clientes',
        component: AdminClientsPage,
        title: 'Gestión de clientes | Sabor Andino'
      },

      /* REPORTES */

      {
        path: 'reportes',
        component: AdminReportsPage,
        title: 'Reportes | Sabor Andino'
      }

    ]
  },

  /* =======================================================
     REDIRECCIONES ADMINISTRATIVAS
  ======================================================== */

  {
    path: 'dashboard',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },

  {
    path: 'pedidos',
    redirectTo: 'admin/pedidos',
    pathMatch: 'full'
  },

  {
    path: 'admin-reservas',
    redirectTo: 'admin/reservas',
    pathMatch: 'full'
  },

  {
    path: 'productos',
    redirectTo: 'admin/productos',
    pathMatch: 'full'
  },

  {
    path: 'categorias',
    redirectTo: 'admin/categorias',
    pathMatch: 'full'
  },

  {
    path: 'admin-sucursales',
    redirectTo: 'admin/sucursales',
    pathMatch: 'full'
  },

  {
    path: 'mesas',
    redirectTo: 'admin/mesas',
    pathMatch: 'full'
  },

  {
    path: 'pagos',
    redirectTo: 'admin/pagos',
    pathMatch: 'full'
  },

  {
    path: 'promociones',
    redirectTo: 'admin/promociones',
    pathMatch: 'full'
  },

  {
    path: 'clientes',
    redirectTo: 'admin/clientes',
    pathMatch: 'full'
  },

  {
    path: 'reportes',
    redirectTo: 'admin/reportes',
    pathMatch: 'full'
  },

  /* =======================================================
     SITIO PÚBLICO
  ======================================================== */

  {
    path: '',
    component: PublicLayout,
    children: [

      /* INICIO */

      {
        path: '',
        component: HomePage,
        title: 'Sabor Andino'
      },

      /* MENÚ */

      {
        path: 'menu',
        component: MenuPage,
        title: 'Menú | Sabor Andino'
      },

      /* SUCURSALES PÚBLICAS */

      {
        path: 'sucursales',
        component: BranchesPage,
        title: 'Sucursales | Sabor Andino'
      },

      /* RESERVAS PÚBLICAS */

      {
        path: 'reservas',
        component: ReservationsPage,
        title: 'Reservas | Sabor Andino'
      },

      /* SEGUIMIENTO */

      {
        path: 'seguimiento',
        component: SeguimientoPage,
        title: 'Seguimiento | Sabor Andino'
      }

    ]
  },

  /* =======================================================
     RUTA NO ENCONTRADA
  ======================================================== */

  {
    path: '**',
    redirectTo: ''
  }

];
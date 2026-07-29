import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AdminSidebar } from './components/admin-sidebar/admin-sidebar';
import { AdminTopbar } from './components/admin-topbar/admin-topbar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AdminSidebar,
    AdminTopbar
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout {

  sidebarCollapsed = false;
  mobileSidebarOpen = false;

  toggleSidebar(): void {
    if (window.innerWidth <= 900) {
      this.mobileSidebarOpen = !this.mobileSidebarOpen;
      return;
    }

    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    if (window.innerWidth > 900) {
      this.mobileSidebarOpen = false;
    }
  }
}

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('saborAndino-frontend');

  constructor() {
    if (typeof window === 'undefined') return;

    const cleanupVersion = 'sabor-andino-clean-data-v3';
    if (localStorage.getItem(cleanupVersion)) return;

    Object.keys(localStorage)
      .filter(key => key.startsWith('sabor-andino-') && key !== cleanupVersion)
      .forEach(key => localStorage.removeItem(key));

    Object.keys(sessionStorage)
      .filter(key => key.startsWith('sabor-andino-'))
      .forEach(key => sessionStorage.removeItem(key));

    localStorage.setItem(cleanupVersion, '1');
  }
}

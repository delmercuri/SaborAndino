import { Component } from '@angular/core';

import {
  Hero
} from '../../components/hero/hero';

import {
  Categories
} from '../../components/categories/categories';

import {
  FeaturedProducts
} from '../../components/featured-products/featured-products';

import {
  Advantages
} from '../../components/advantages/advantages';

import {
  Promotion
} from '../../components/promotion/promotion';

import {
  Experience
} from '../../components/experience/experience';

import {
  BranchesPreview
} from '../../components/branches-preview/branches-preview';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    Hero,
    Categories,
    FeaturedProducts,
    Advantages,
    Promotion,
    Experience,
    BranchesPreview
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {

  selectedCategory = 'Todos';

  selectCategory(
    category: string
  ): void {
    this.selectedCategory = category;
  }
}
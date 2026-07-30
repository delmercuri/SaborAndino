import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { retry, timer } from 'rxjs';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

type CategoryStatus =
  | 'Activa'
  | 'Inactiva';

interface CategoryItem {
  id: number;
  code: string;
  name: string;
  description: string;
  productCount: number;
  status: CategoryStatus;
  imageUrl: string;
}

interface CategoryForm {
  name: string;
  description: string;
  status: CategoryStatus;
  imageUrl: string;
}

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.css'
})
export class AdminCategoriesPage implements OnInit {

  searchTerm = '';
  selectedStatus = '';

  currentPage = 1;
  readonly pageSize = 6;

  isCategoryModalOpen = false;
  editingCategoryId: number | null = null;

  isLoadingCategories = false;

  categories: CategoryItem[] = [];

  categoryForm: CategoryForm =
    this.createEmptyCategoryForm();

  readonly statusOptions: CategoryStatus[] = [
    'Activa',
    'Inactiva'
  ];

  constructor(
    private readonly api: SaborAndinoApiService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  get totalCategories(): number {
    return this.categories.length;
  }

  get activeCategories(): number {
    return this.categories.filter(
      category =>
        category.status === 'Activa'
    ).length;
  }

  get inactiveCategories(): number {
    return this.categories.filter(
      category =>
        category.status === 'Inactiva'
    ).length;
  }

  get assignedProductsCount(): number {
    return this.categories.reduce(
      (
        total,
        category
      ) => total + category.productCount,
      0
    );
  }

  get filteredCategories(): CategoryItem[] {
    const searchValue =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.categories.filter(
      category => {

        const matchesSearch =
          !searchValue ||
          category.code
            .toLowerCase()
            .includes(searchValue) ||
          category.name
            .toLowerCase()
            .includes(searchValue) ||
          category.description
            .toLowerCase()
            .includes(searchValue);

        const matchesStatus =
          !this.selectedStatus ||
          category.status ===
            this.selectedStatus;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(
        this.filteredCategories.length /
        this.pageSize
      )
    );
  }

  get paginatedCategories(): CategoryItem[] {
    const startIndex =
      (this.currentPage - 1) *
      this.pageSize;

    const endIndex =
      startIndex + this.pageSize;

    return this.filteredCategories.slice(
      startIndex,
      endIndex
    );
  }

  get showingFrom(): number {
    if (
      this.filteredCategories.length === 0
    ) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;
  }

  get showingTo(): number {
    return Math.min(
      this.currentPage *
      this.pageSize,
      this.filteredCategories.length
    );
  }

  get isEditingCategory(): boolean {
    return this.editingCategoryId !== null;
  }

  onFiltersChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.currentPage = 1;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (
      this.currentPage <
      this.totalPages
    ) {
      this.currentPage++;
    }
  }

  openCreateCategory(): void {
    this.editingCategoryId = null;

    this.categoryForm =
      this.createEmptyCategoryForm();

    this.isCategoryModalOpen = true;
  }

  openEditCategory(
    category: CategoryItem
  ): void {
    this.editingCategoryId =
      category.id;

    this.categoryForm = {
      name: category.name,
      description:
        category.description,
      status: category.status,
      imageUrl: category.imageUrl
    };

    this.isCategoryModalOpen = true;
  }

  closeCategoryModal(): void {
    this.isCategoryModalOpen = false;
    this.editingCategoryId = null;

    this.categoryForm =
      this.createEmptyCategoryForm();
  }

  saveCategory(): void {
    const categoryName =
      this.categoryForm.name.trim();

    const categoryDescription =
      this.categoryForm.description.trim();

    if (!categoryName) {
      window.alert(
        'Ingresa el nombre de la categoría.'
      );

      return;
    }

    if (!categoryDescription) {
      window.alert(
        'Ingresa una descripción para la categoría.'
      );

      return;
    }

    const categoryExists =
      this.categories.some(
        category =>
          category.name
            .trim()
            .toLowerCase() ===
            categoryName.toLowerCase() &&
          category.id !==
            this.editingCategoryId
      );

    if (categoryExists) {
      window.alert(
        'Ya existe una categoría con ese nombre.'
      );

      return;
    }

    if (
      this.editingCategoryId !== null
    ) {
      this.categories =
        this.categories.map(
          category => {

            if (
              category.id !==
              this.editingCategoryId
            ) {
              return category;
            }

            return {
              ...category,
              name: categoryName,
              description:
                categoryDescription,
              status:
                this.categoryForm.status,
              imageUrl:
                this.categoryForm.imageUrl
            };
          }
        );
    } else {
      const nextId =
        this.categories.length > 0
          ? Math.max(
              ...this.categories.map(
                category => category.id
              )
            ) + 1
          : 1;

      const newCategory:
        CategoryItem = {

        id: nextId,

        code:
          `CAT-${String(nextId)
            .padStart(3, '0')}`,

        name: categoryName,

        description:
          categoryDescription,

        productCount: 0,

        status:
          this.categoryForm.status,

        imageUrl:
          this.categoryForm.imageUrl
      };

      this.categories = [
        newCategory,
        ...this.categories
      ];
    }

    this.saveCategories();
    this.currentPage = 1;
    this.closeCategoryModal();
  }

  toggleCategoryStatus(
    category: CategoryItem
  ): void {
    this.categories =
      this.categories.map(
        currentCategory => {

          if (
            currentCategory.id !==
            category.id
          ) {
            return currentCategory;
          }

          const nextStatus:
            CategoryStatus =
              currentCategory.status ===
              'Activa'
                ? 'Inactiva'
                : 'Activa';

          return {
            ...currentCategory,
            status: nextStatus
          };
        }
      );

    this.saveCategories();
  }

  removeCategory(
    category: CategoryItem
  ): void {
    if (category.productCount > 0) {
      window.alert(
        `No se puede eliminar "${category.name}" porque tiene ${category.productCount} productos asignados.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        `¿Deseas eliminar la categoría "${category.name}"?`
      );

    if (!confirmed) {
      return;
    }

    this.api
      .deleteCategory(category.code)
      .subscribe({
        next: response => {
          if (!response.success) {
            window.alert(
              response.message ||
              'No se pudo eliminar la categoría.'
            );

            return;
          }

          this.categories =
            this.categories.filter(
              item =>
                item.id !== category.id
            );

          this.currentPage =
            Math.min(
              this.currentPage,
              this.totalPages
            );
        },

        error: error => {
          console.error(
            'Error al eliminar la categoría:',
            error
          );

          window.alert(
            'No se pudo eliminar la categoría en el backend.'
          );
        }
      });
  }

  onImageSelected(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith('image/')
    ) {
      window.alert(
        'Selecciona un archivo de imagen válido.'
      );

      input.value = '';
      return;
    }

    const maximumSize =
      2 * 1024 * 1024;

    if (file.size > maximumSize) {
      window.alert(
        'La imagen no debe superar los 2 MB.'
      );

      input.value = '';
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      this.categoryForm.imageUrl =
        typeof reader.result ===
        'string'
          ? reader.result
          : '';
    };

    reader.onerror = () => {
      window.alert(
        'No se pudo leer la imagen seleccionada.'
      );

      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  removeSelectedImage(): void {
    this.categoryForm.imageUrl = '';
  }

  onCategoryImageError(
    category: CategoryItem
  ): void {
    category.imageUrl = '';
    this.saveCategories();
  }

  exportCategories(): void {
    const headers = [
      'Código',
      'Categoría',
      'Descripción',
      'Productos asignados',
      'Estado'
    ];

    const rows =
      this.filteredCategories.map(
        category => [
          category.code,
          category.name,
          category.description,
          category.productCount.toString(),
          category.status
        ]
      );

    const csvContent = [
      headers,
      ...rows
    ]
      .map(
        row =>
          row
            .map(
              value =>
                `"${value.replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(',')
      )
      .join('\n');

    const file = new Blob(
      [
        '\uFEFF',
        csvContent
      ],
      {
        type:
          'text/csv;charset=utf-8;'
      }
    );

    const downloadUrl =
      URL.createObjectURL(file);

    const link =
      document.createElement('a');

    link.href = downloadUrl;

    link.download =
      'categorias-sabor-andino.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(
      downloadUrl
    );
  }

  getStatusClass(
    status: CategoryStatus
  ): string {
    return status === 'Activa'
      ? 'status-active'
      : 'status-inactive';
  }

  trackByCategoryId(
    _index: number,
    category: CategoryItem
  ): number {
    return category.id;
  }

  private loadCategories(): void {
    if (this.isLoadingCategories) {
      return;
    }

    this.isLoadingCategories = true;

    this.api
      .getAdminCategories<CategoryItem[]>()
      .pipe(
        retry({
          count: 1,
          delay: () => timer(700)
        })
      )
      .subscribe({
        next: response => {
          if (
            !response.success ||
            !Array.isArray(response.data)
          ) {
            this.categories = [];

            console.error(
              response.message ||
              'La respuesta de categorías no es válida.'
            );

            this.isLoadingCategories = false;
            return;
          }

          this.categories =
            response.data.map(
              category => ({
                ...category,
                id: Number(category.id),
                code: String(
                  category.code ?? ''
                ),
                name: String(
                  category.name ?? ''
                ),
                description: String(
                  category.description ?? ''
                ),
                productCount: Number(
                  category.productCount ?? 0
                ),
                status:
                  category.status === 'Inactiva'
                    ? 'Inactiva'
                    : 'Activa',
                imageUrl: String(
                  category.imageUrl ?? ''
                )
              })
            );

          if (
            this.currentPage >
            this.totalPages
          ) {
            this.currentPage =
              this.totalPages;
          }

          this.isLoadingCategories = false;
        },

        error: error => {
          this.categories = [];
          this.isLoadingCategories = false;

          console.error(
            'No se pudieron cargar las categorías desde la base de datos.',
            error
          );
        }
      });
  }

  private saveCategories(): void {
    this.api
      .syncCategories(this.categories)
      .subscribe({
        next: response => {
          if (!response.success) {
            console.error(
              response.message ||
              'No se pudieron guardar las categorías.'
            );

            window.alert(
              response.message ||
              'No se pudieron guardar los cambios.'
            );

            return;
          }

          this.loadCategories();
        },

        error: error => {
          console.error(
            'No se pudieron guardar las categorías en la base de datos.',
            error
          );

          window.alert(
            'No se pudieron guardar los cambios en el backend.'
          );
        }
      });
  }

  private createEmptyCategoryForm():
    CategoryForm {

    return {
      name: '',
      description: '',
      status: 'Activa',
      imageUrl: ''
    };
  }
}
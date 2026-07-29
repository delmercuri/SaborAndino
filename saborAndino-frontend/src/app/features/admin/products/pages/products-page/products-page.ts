import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

type ProductStatus =
  | 'Activo'
  | 'Agotado'
  | 'Inactivo';

interface ProductItem {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  branch: string;
  price: number;
  stock: number;
  status: ProductStatus;
  imageUrl: string;
}

interface ProductForm {
  name: string;
  description: string;
  category: string;
  branch: string;
  price: number;
  stock: number;
  status: ProductStatus;
  imageUrl: string;
}

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './products-page.html',
  styleUrl: './products-page.css'
})
export class AdminProductsPage {

  constructor(private readonly api: SaborAndinoApiService) {
    this.loadBackendData();
  }

  searchTerm = '';
  selectedCategory = '';
  selectedBranch = '';
  selectedStatus = '';

  currentPage = 1;
  readonly pageSize = 7;

  isProductModalOpen = false;
  editingProductId: number | null = null;

  categoryOptions: string[] = [];

  branchOptions: string[] = ['Todas las sucursales'];

  readonly statusOptions: ProductStatus[] = [
    'Activo',
    'Agotado',
    'Inactivo'
  ];

  productForm: ProductForm =
    this.createEmptyProductForm();

  products: ProductItem[] = [];

  get totalProducts(): number {
    return this.products.length;
  }

  get activeProducts(): number {
    return this.products.filter(
      product => product.status === 'Activo'
    ).length;
  }

  get lowStockProducts(): number {
    return this.products.filter(
      product =>
        product.stock > 0 &&
        product.stock <= 5
    ).length;
  }

  get outOfStockProducts(): number {
    return this.products.filter(
      product =>
        product.stock === 0 ||
        product.status === 'Agotado'
    ).length;
  }

  get filteredProducts(): ProductItem[] {
    const searchValue =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.products.filter(product => {

      const matchesSearch =
        !searchValue ||
        product.code
          .toLowerCase()
          .includes(searchValue) ||
        product.name
          .toLowerCase()
          .includes(searchValue) ||
        product.description
          .toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        !this.selectedCategory ||
        product.category ===
          this.selectedCategory;

      const matchesBranch =
        !this.selectedBranch ||
        product.branch ===
          this.selectedBranch;

      const matchesStatus =
        !this.selectedStatus ||
        product.status ===
          this.selectedStatus;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBranch &&
        matchesStatus
      );
    });
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(
        this.filteredProducts.length /
        this.pageSize
      )
    );
  }

  get paginatedProducts(): ProductItem[] {
    const startIndex =
      (this.currentPage - 1) *
      this.pageSize;

    const endIndex =
      startIndex + this.pageSize;

    return this.filteredProducts.slice(
      startIndex,
      endIndex
    );
  }

  get showingFrom(): number {
    if (this.filteredProducts.length === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;
  }

  get showingTo(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredProducts.length
    );
  }

  get isEditingProduct(): boolean {
    return this.editingProductId !== null;
  }

  onFiltersChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedBranch = '';
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

  openCreateProduct(): void {
    this.editingProductId = null;
    this.productForm =
      this.createEmptyProductForm();

    this.isProductModalOpen = true;
  }

  openEditProduct(
    product: ProductItem
  ): void {
    this.editingProductId =
      product.id;

    this.productForm = {
      name: product.name,
      description: product.description,
      category: product.category,
      branch: product.branch,
      price: product.price,
      stock: product.stock,
      status: product.status,
      imageUrl: product.imageUrl
    };

    this.isProductModalOpen = true;
  }

  closeProductModal(): void {
    this.isProductModalOpen = false;
    this.editingProductId = null;
    this.productForm =
      this.createEmptyProductForm();
  }

  saveProduct(): void {
    const productName =
      this.productForm.name.trim();

    const productDescription =
      this.productForm.description.trim();

    if (
      !productName ||
      !this.productForm.category ||
      !this.productForm.branch
    ) {
      window.alert(
        'Completa el nombre, categoría y sucursal del producto.'
      );

      return;
    }

    if (
      this.productForm.price < 0 ||
      this.productForm.stock < 0
    ) {
      window.alert(
        'El precio y el stock no pueden ser negativos.'
      );

      return;
    }

    const normalizedStock =
      Number(this.productForm.stock);

    const normalizedStatus:
      ProductStatus =
        normalizedStock === 0
          ? 'Agotado'
          : this.productForm.status;

    if (this.editingProductId !== null) {

      this.products =
        this.products.map(product => {

          if (
            product.id !==
            this.editingProductId
          ) {
            return product;
          }

          return {
            ...product,
            name: productName,
            description:
              productDescription,
            category:
              this.productForm.category,
            branch:
              this.productForm.branch,
            price:
              Number(
                this.productForm.price
              ),
            stock: normalizedStock,
            status: normalizedStatus,
            imageUrl:
              this.productForm.imageUrl
          };
        });

    } else {

      const nextId =
        this.products.length > 0
          ? Math.max(
              ...this.products.map(
                product => product.id
              )
            ) + 1
          : 1;

      const newProduct: ProductItem = {
        id: nextId,
        code:
          `PROD-${String(nextId)
            .padStart(4, '0')}`,
        name: productName,
        description:
          productDescription,
        category:
          this.productForm.category,
        branch:
          this.productForm.branch,
        price:
          Number(
            this.productForm.price
          ),
        stock: normalizedStock,
        status: normalizedStatus,
        imageUrl:
          this.productForm.imageUrl
      };

      this.products = [
        newProduct,
        ...this.products
      ];
    }

    this.currentPage = 1;
    this.closeProductModal();
    this.persistProducts();
  }

  removeProduct(product: ProductItem): void {
    if (!window.confirm(`¿Deseas eliminar el producto "${product.name}"?`)) return;

    this.api.deleteProduct(product.code).subscribe({
      next: response => {
        if (!response.success) {
          window.alert(response.message);
          return;
        }
        this.products = this.products.filter(item => item.id !== product.id);
        this.currentPage = Math.min(this.currentPage, this.totalPages);
      },
      error: () => window.alert('No se pudo eliminar el producto en el backend.')
    });
  }

  toggleProductStatus(
    product: ProductItem
  ): void {
    this.products =
      this.products.map(
        currentProduct => {

          if (
            currentProduct.id !==
            product.id
          ) {
            return currentProduct;
          }

          const nextStatus:
            ProductStatus =
              currentProduct.status ===
              'Inactivo'
                ? currentProduct.stock === 0
                  ? 'Agotado'
                  : 'Activo'
                : 'Inactivo';

          return {
            ...currentProduct,
            status: nextStatus
          };
        }
      );

    this.persistProducts();
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

    if (file.size > 2 * 1024 * 1024) {
      window.alert('La imagen no debe superar los 2 MB.');
      input.value = '';
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      this.productForm.imageUrl =
        typeof reader.result ===
        'string'
          ? reader.result
          : '';
    };

    reader.readAsDataURL(file);
  }

  removeSelectedImage(): void {
    this.productForm.imageUrl = '';
  }

  onProductImageError(
    product: ProductItem
  ): void {
    product.imageUrl = '';
  }

  exportProducts(): void {
    const headers = [
      'Código',
      'Producto',
      'Descripción',
      'Categoría',
      'Sucursal',
      'Precio',
      'Stock',
      'Estado'
    ];

    const rows =
      this.filteredProducts.map(
        product => [
          product.code,
          product.name,
          product.description,
          product.category,
          product.branch,
          product.price.toFixed(2),
          product.stock.toString(),
          product.status
        ]
      );

    const csvContent = [
      headers,
      ...rows
    ]
      .map(row =>
        row
          .map(value =>
            `"${value.replace(/"/g, '""')}"`
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
      'productos-sabor-andino.csv';

    link.click();

    URL.revokeObjectURL(
      downloadUrl
    );
  }

  getStatusClass(
    status: ProductStatus
  ): string {
    const statusClasses:
      Record<ProductStatus, string> = {
        'Activo':
          'status-active',

        'Agotado':
          'status-out-of-stock',

        'Inactivo':
          'status-inactive'
      };

    return statusClasses[status];
  }

  getStockClass(
    product: ProductItem
  ): string {
    if (product.stock === 0) {
      return 'stock-empty';
    }

    if (product.stock <= 5) {
      return 'stock-low';
    }

    return 'stock-available';
  }

  formatCurrency(
    amount: number
  ): string {
    return new Intl.NumberFormat(
      'es-PE',
      {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
      }
    ).format(amount);
  }

  private loadBackendData(): void {
    this.api.getAdminProducts<ProductItem[]>().subscribe({
      next: response => {
        if (response.success && Array.isArray(response.data)) this.products = response.data;
      },
      error: () => console.warn('No se pudieron cargar los productos desde el backend.')
    });

    this.api.getAdminCategories<Array<{ name: string }>>().subscribe({
      next: response => {
        if (response.success && Array.isArray(response.data)) {
          this.categoryOptions = response.data.map(category => category.name);
        }
      }
    });

    this.api.getAdminBranches<Array<{ name: string }>>().subscribe({
      next: response => {
        if (response.success && Array.isArray(response.data)) {
          this.branchOptions = ['Todas las sucursales', ...response.data.map(branch => branch.name)];
        }
      }
    });
  }

  private persistProducts(): void {
    this.api.syncProducts(this.products).subscribe({
      next: response => {
        if (!response.success) window.alert(response.message);
      },
      error: () => window.alert('El producto se guardó en pantalla, pero no se pudo sincronizar con el backend.')
    });
  }

  private createEmptyProductForm():
    ProductForm {
    return {
      name: '',
      description: '',
      category: '',
      branch:
        'Todas las sucursales',
      price: 0,
      stock: 0,
      status: 'Activo',
      imageUrl: ''
    };
  }

}
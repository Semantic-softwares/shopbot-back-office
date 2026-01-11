import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Option, Product } from '../models';
import { computed, inject } from '@angular/core';
import { CategoryStore } from './category.store'; // Import the CategoryStore
import { StoreStore } from './store.store';
import { _Product } from '../classes/product.class';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, forkJoin } from 'rxjs';
import { ProductService } from '../services/product.service';
// import { ProductService, SyncService, ViewService } from "../services";
// import { EventBusService } from "~/app/shared/services";

type ProductsState = {
  products: Product[];
  isLoading: boolean;
  error: string | null | unknown;
  searchQuery: string | null; // New state for search input
  attachedFiles: any[];
  changedPhotoOnEdit: boolean;
};

const initialState: ProductsState = {
  products: [],
  error: null,
  isLoading: false,
  searchQuery: '', // New state for search input
  changedPhotoOnEdit: false,
  attachedFiles: [],
};

export const ProductsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => {
    const categoryStore = inject(CategoryStore); // Inject CategoryStore

    // Update filteredProducts to use search and category filters
    const filteredProducts = computed(() => {
      const selectedCategory = categoryStore.selectedCategory();
      const searchQuery = store.searchQuery()!.toLowerCase();
      // If there's a search query, filter based on the search query, ignoring category
      if (searchQuery!.length > 0) {
        return store
          .products()
          .filter(
            (product) =>
              product.name?.toLowerCase().includes(searchQuery!) ||
              product.description?.toLowerCase().includes(searchQuery!) ||
              product.barcode?.toLowerCase().includes(searchQuery)
          );
      }

      // If no search query, filter by selected category (using menu._id)
      return selectedCategory
        ? store.products().filter((product) => product?.menu?._id === selectedCategory?._id)
        : [];
    });

    return {
      productCount: computed(() => store.products().length),

      filteredProducts,

      filterProductCount: computed(() => filteredProducts().length),
    };
  }),

  withMethods((store) => {
    function updateSearchQuery(query: string): void {
      patchState(store, { searchQuery: query });
    }

    function searchByBarcode(barcode: string): Product | undefined {
      return store.products().find((product) => product?.barcode === barcode);
    }

    function updateChangedPhotoOnEdit(isEdition: boolean): void {
      patchState(store, { changedPhotoOnEdit: isEdition });
    }

    function updateAttachedFiles(files: any[]): void {
      patchState(store, { attachedFiles: files });
    }

    function clearSearchQuery(): void {
      patchState(store, { searchQuery: '' });
    }

    function incrementQuantity(productId: string): void {
      const updatedProducts = store.products().map((product) => {
        if (product._id === productId) {
          return { ...product, quantity: product.quantity + 1 };
        }
        return product;
      });
      patchState(store, { products: updatedProducts });
    }

    function decrementQuantity(productId: string): void {
      const updatedProducts = store.products().map((product) => {
        if (product._id === productId) {
          return { ...product, quantity: Math.max(0, product.quantity - 1) };
        }
        return product;
      });
      patchState(store, { products: updatedProducts });
    }

    function createProduct(product: Product): void {
      patchState(store, {
        products: [product, ...store.products()],
      });
    }

    function deleteProduct(productId: string): void {
      const updatedCategories = store
        .products()
        .filter((product) => product._id !== productId);
      patchState(store, {
        products: updatedCategories,
      });
    }

    return {
      updateSearchQuery,
      clearSearchQuery,
      deleteProduct,
      searchByBarcode,
      createProduct,
      decrementQuantity,
      incrementQuantity,
      updateChangedPhotoOnEdit,
      updateAttachedFiles,
    };
  }),

  withMethods(
    (
      store,
      // syncService = inject(SyncService),
      productService = inject(ProductService)
      // viewService = inject(ViewService),
      // eventBusService = inject(EventBusService)
    ) => {
      const getStoreProducts = rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
              products: [],
            })
          ),
          switchMap((storeId) =>
            productService.getStoreProducts(storeId).pipe(
              tapResponse({
                next(response) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                    products: response,
                  });
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error,
                    products: [],
                  });
                },
              })
            )
          )
        )
      );

      function updateProduct(
        productId: string,
        updatedProduct: Partial<Product>
      ): void {
        const foundProductIndex = store
          .products()
          .findIndex((product) => product._id === productId);
        if (foundProductIndex !== -1) {
          const updatedProducts = [...store.products()];
          updatedProducts[foundProductIndex] = {
            ...updatedProducts[foundProductIndex],
            ...updatedProduct,
          };

          patchState(store, {
            products: updatedProducts,
          });
        } else {
          console.error(`Product with ID ${productId} not found`);
        }
      }

      // const createProducts$ = rxMethod<Partial<Product> | any>(
      //   pipe(
      //     tap(() =>
      //       patchState(store, {
      //         isLoading: true,
      //         error: null,
      //       })
      //     ),
      //     switchMap((product) => {
      //       return productService.addProduct(product).pipe(
      //         tapResponse({
      //           next(productResponse) {
      //             if (product?.options.length > 0) {
      //               updateVariants$({variants: product.options, productId: product._id});
      //             }
      //             if (store.attachedFiles() && store.attachedFiles().length > 0 && store.changedPhotoOnEdit()) {
      //               console.log(store.attachedFiles(), `foods/upload/${product._id}`, `files`)
      //                viewService.uploadFile(store.attachedFiles(), `foods/upload/${product._id}`, 'files');
      //             }
      //             eventBusService.emit("productCreated");
      //             viewService.showFeedback("success", "Product saved successfully");
      //             patchState(store, {
      //               isLoading: false,
      //               error: null,
      //               products: [product, ...store.products()],
      //               attachedFiles: [],
      //               changedPhotoOnEdit: false
      //             });
      //           },
      //           error(error) {
      //             patchState(store, {
      //               isLoading: false,
      //               error
      //             });
      //           },
      //         })
      //       )
      //     }

      //     )
      //   )
      // );

      // const updateVariants$ = rxMethod<{variants: Partial<Option[]>, productId: string}>(
      //   pipe(
      //     switchMap((productParams) => {
      //       const calls = productParams.variants.map(({ _id }) =>
      //       productService.addProductIdToVariant(_id, { productId: productParams.productId }))
      //       return forkJoin(calls).pipe(
      //         tapResponse({
      //           next(product) {},
      //           error(error) {
      //             patchState(store, {
      //               isLoading: false,
      //               error,

      //             });
      //           },
      //         })
      //       )
      //     }

      //     )
      //   )
      // );

      // const updateProducts$ = rxMethod<{product: Partial<Product>, productId: string, reload?: boolean}>(
      //   pipe(

      //     switchMap(({ product, productId, reload = true }) => {
      //       patchState(store, {
      //         isLoading: reload,
      //         error: null,
      //       })
      //       return productService.saveProduct(product, productId).pipe(
      //         tapResponse({
      //           next(productResponse) {
      //             if (product?.options.length > 0) {
      //               updateVariants$({variants: product.options, productId});
      //             }

      //             if (store.attachedFiles() && store.attachedFiles().length > 0 && store.changedPhotoOnEdit()) {
      //               console.log(store.attachedFiles())
      //                viewService.uploadFile(store.attachedFiles(), `foods/upload/${product._id}`, 'files');
      //             }
      //             patchState(store, {
      //               isLoading: false,
      //               error: null,
      //               attachedFiles: [],
      //               changedPhotoOnEdit: false
      //             });
      //             updateProduct(productId, product)
      //           },
      //           error(error) {
      //             patchState(store, {
      //               isLoading: false,
      //               error,

      //             });
      //           },
      //         })
      //       )
      //     }

      //     )
      //   )
      // );

      const deleteProducts$ = rxMethod<string>(
        pipe(
          switchMap((productId) => {
            return productService.deleteProduct(productId).pipe(
              tapResponse({
                next(product) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                  });
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error,
                  });
                },
              })
            );
          })
        )
      );

      return {
        updateProduct,
        getStoreProducts,
        deleteProducts$,
      };
    }
  ),

  withHooks({
    onInit(store) {
      const storeStore = inject(StoreStore);
      const selectedStore = storeStore.selectedStore();
      if (selectedStore?._id) {
        store.getStoreProducts(selectedStore._id);
      }
    },
  })
);

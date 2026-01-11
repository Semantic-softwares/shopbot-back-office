import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from "@ngrx/signals";
import { Option } from "../models";
import { computed, inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, tap, switchMap } from "rxjs";
import { ProductService } from "../services/product.service";
import { StoreStore } from "./store.store";

type VariantState = {
  variants: Option[];
  isLoading: boolean;
  error: unknown;
  selectedVariant: Option | null;
  selectedVariants: Option[];
};

const initialState: VariantState = {
  variants: [

  ],
  error: null,
  isLoading: false,
  selectedVariant: null,
  selectedVariants: [],
};

export const VariantStore = signalStore(
  { providedIn: "root" },
  withState(initialState),

  withComputed(({ variants }) => ({
    menuCount: computed(() => variants().length),
  })),

  withMethods((store, 
    productService = inject(ProductService)) => {
    
    

     function setSelectedVariant(variant: Option): void {
        patchState(store, { selectedVariant: variant });
      };

      function createVariant(variant: Option): void {
        patchState(store, {
          variants: [...store.variants(), variant],
        });
        setSelectedVariant(variant);
      };

      function updateVariant(variantId: string, updatedVariant: Partial<Option>): void {
        const foundVariantIndex = store
          .variants()
          .findIndex((variant) => variant._id === variantId);

        if (foundVariantIndex !== -1) {
          const updatedVariants = [...store.variants()];
          updatedVariants[foundVariantIndex] = {
            ...updatedVariants[foundVariantIndex],
            ...updatedVariant,
          };

          patchState(store, {
            variants: updatedVariants,
          });
        } else {
          console.error(`Category with ID ${variantId} not found`);
        }
      };

      function deleteVariant(variantId: string): void {
        const updatedVariants = store
          .variants()
          .filter((variant) => variant._id !== variantId);
        patchState(store, {
          variants: updatedVariants,
        });
      };

      function updateSelectedVariants(updatedVariants: Option[]) {
        patchState(store, {
          selectedVariants: updatedVariants,
        });
      };

      function getProductVariants(productId: string): void {
        const variants = store
          .variants()
          .filter((variant) => variant.products.includes(productId));
          console.log("Filtered variants for product:", variants);
        patchState(store, {
          selectedVariants: variants,
        });
      };

      const loadVariants = rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
              variants: [],
            })
          ),
          switchMap((storeId) =>
            productService.getStoreGroupOption(storeId).pipe(
              tapResponse({
                next(response) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                    variants: response,
                  });
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error,
                    variants: [],
                  });
                },
              })
            )
          )
        )
      );

      const createVariant$ = rxMethod<Partial<Option> | any>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
            })
          ),
          switchMap((variant) => {
            return productService.createVariant(variant).pipe(
              tapResponse({
                next(optionResponse) {
              
                  patchState(store, {
                    isLoading: false,
                    error: null,
                    variants: [variant, ...store.variants()],
                  });
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error,
                   
                  });
                },
              })
            )
          }
          
          )
        )
      );
  
      const updateVariant$ = rxMethod<{variant: Partial<Option> | any, variantId: string, reload?:boolean}>(
        pipe(
          switchMap(({ variant, variantId, reload = true }) => {
            patchState(store, {
              isLoading: reload,
              error: null,
            })
         
            return productService.updateVariant(variant, variantId).pipe(
              tapResponse({
                next(optionResponse) {
                  updateVariant(variantId, variant);
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
            )
          }
          
          )
        )
      );
  
      const deleteVariant$ = rxMethod<string>(
        pipe(
          switchMap((variantId) => {
            return productService.deleteVariant(variantId).pipe(
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
            )
          }
          
          )
        )
      );

      const removeProductIds$ = rxMethod<{variantId: string, productId: string}>(
        pipe(
          switchMap((params) => {
            return productService.removeProductIdFromVariant(params.variantId, params.productId).pipe(
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
            )
          }
          
          )
        )
      );

        return {
          setSelectedVariant,
          createVariant,
          updateVariant,
          deleteVariant,
          updateSelectedVariants,
          getProductVariants,
          loadVariants,
          createVariant$,
          updateVariant$,
          deleteVariant$,
          removeProductIds$
        };
      }
    ),
    withHooks({
      onInit(store) {
        const storeStore = inject(StoreStore);
        const storeId = storeStore.selectedStore()?._id;
        if (storeId) {
          store.loadVariants(storeId);
        }
      },
    })
  );
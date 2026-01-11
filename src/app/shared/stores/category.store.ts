import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from "@ngrx/signals";
import { Category } from "../models";
import { computed, inject } from "@angular/core";
// import { _Category } from "../classes/category.class";
import { tapResponse } from "@ngrx/operators";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, tap, switchMap } from "rxjs";
import { _Category } from "../classes/category.class";
import { CategoryService } from "../services/category.service";
import { StoreStore } from "./store.store";

type CategoryState = {
  categories: Category[];
  selectedCategory: Category | null;
  isLoading: boolean;
  error: unknown;
};

const initialState: CategoryState = {
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,
};

export const CategoryStore = signalStore(
  { providedIn: "root" },
  withState(initialState),

  withComputed(({ categories }) => ({
    categoryCount: computed(() => categories().length),
  })),

  withMethods(
    (
      store,
      categoryService = inject(CategoryService)
    ) => {
    
     function selectCategory(category: Category): void {
        patchState(store, { selectedCategory: category });
      };

      function createCategory(category: Category): void {
        const _category = new _Category(category);
        patchState(store, {
          categories: [_category, ...store.categories()],
        });
       
      };

      function updateCategory(
        categoryId: string,
        updatedCategory: Partial<Category>
      ): void {
        const foundCategoryIndex = store
          .categories()
          .findIndex((category) => category._id === categoryId);

        if (foundCategoryIndex !== -1) {
          const updatedCategories = [...store.categories()];
          updatedCategories[foundCategoryIndex] = {
            ...updatedCategories[foundCategoryIndex],
            ...updatedCategory,
          };

          patchState(store, {
            categories: updatedCategories,
          });
        } else {
          console.error(`Category with ID ${categoryId} not found`);
        }
      };

      function deleteCategory(categoryId: string): void {
        const updatedCategories = store
          .categories()
          .filter((category) => category._id !== categoryId);
        patchState(store, {
          categories: updatedCategories,
        });
      };

 
    const  getCategories$ = rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
              categories: [],
            })
          ),
          switchMap((storeId) =>
            categoryService.getStoreMenus(storeId).pipe(
              tapResponse({
                next(response) {
                  selectCategory(response[0]);
                  patchState(store, {
                    isLoading: false,
                    error: response,
                    categories: response,
                  });
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error,
                    categories: [],
                  });
                },
              })
            )
          )
        )
      );

      const createCategory$ = rxMethod<Partial<Category>>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
            })
          ),
          switchMap((category) => {
            const _category = new _Category(category);
            return categoryService.createMenu(_category).pipe(
              tapResponse({
                next(category: any) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                    categories: [category, ...store.categories()],
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

      const deleteCategory$ = rxMethod<string>(
        pipe(
          switchMap((categoryId) => {
            return categoryService.deleteMenu(categoryId).pipe(
              tapResponse({
                next(category) {
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

      const updateCategory$ = rxMethod<{category: Partial<Category>, categoryId: string, reload?: boolean}>(
        pipe(
          switchMap(({ category, categoryId, reload = true }) => {
            patchState(store, {
              isLoading: reload,
              error: null,
            })
            return categoryService.updateMenu(categoryId, category).pipe(
              tapResponse({
                next(category) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                  });
                  updateCategory(categoryId, category)
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
        createCategory,
        updateCategory,
        deleteCategory,
        selectCategory,
        createCategory$,
        getCategories$,
        deleteCategory$,
        updateCategory$
      };
    
  }),

  withHooks({
    onInit(store) {
      const storeStore = inject(StoreStore);
      const selectedStore = storeStore.selectedStore();
      if (selectedStore?._id) {
        store.getCategories$(selectedStore._id);
      }
    }
  })
);

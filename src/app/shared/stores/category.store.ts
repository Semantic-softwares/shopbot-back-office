import { OfflineStore } from '../offline/offline-store.service';
import { cachedFetch } from '../offline/cached-fetch';
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
import { childrenOf, topLevel } from "../category-tree";

type CategoryState = {
  categories: Category[];
  /** The top-level category chosen in the first row. */
  selectedCategory: Category | null;
  /** The sub-category chosen in the second row; null means "all of the selected category". */
  selectedSub: Category | null;
  isLoading: boolean;
  error: unknown;
};

const initialState: CategoryState = {
  categories: [],
  selectedCategory: null,
  selectedSub: null,
  isLoading: false,
  error: null,
};

export const CategoryStore = signalStore(
  { providedIn: "root" },
  withState(initialState),

  withComputed(({ categories, selectedCategory, selectedSub }) => ({
    categoryCount: computed(() => categories().length),
    /** First row of the POS: categories without a parent. */
    topLevel: computed(() => topLevel(categories())),
    /** Second row of the POS: the sub-categories of the selected category (none when it has none). */
    visibleSubs: computed(() => childrenOf(categories(), selectedCategory()?._id)),
    /** Category ids whose products the POS grid shows: the chosen sub-category, or the selected category and all its sub-categories. */
    selectedIds: computed(() => {
      if (selectedSub()) return [selectedSub()!._id!];
      const id = selectedCategory()?._id;
      // An inactive sub-category stays out of its parent's "all" view, like an inactive category stays off the POS.
      return id ? [id, ...childrenOf(categories(), id).filter((c) => c.activate !== false).map((c) => c._id!)] : [];
    }),
  })),

  withMethods(
    (
      store,
      categoryService = inject(CategoryService),
      offline = inject(OfflineStore)    ) => {
    
     function selectCategory(category: Category): void {
        // Choosing a (top-level) category clears the sub-category: the grid goes back to "all of it".
        patchState(store, { selectedCategory: category, selectedSub: null });
      };

      function selectSub(sub: Category | null): void {
        patchState(store, { selectedSub: sub });
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
            cachedFetch(offline, `menus:${storeId}`, categoryService.getStoreMenus(storeId)).pipe(
              tapResponse({
                next(response) {
                  selectCategory(topLevel(response)[0] ?? response[0]);
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

      /**
       * Re-fetches the store's categories WITHOUT clearing the list, showing the spinner or resetting
       * the cashier's selection, so the POS picks up categories renamed/added/removed elsewhere (ERP).
       * The selected category is kept (refreshed to the latest copy); only if it no longer exists does
       * the selection fall back to the first one. A failed refresh leaves the current list in place.
       */
      const refreshCategories$ = rxMethod<string>(
        pipe(
          switchMap((storeId) =>
            categoryService.getStoreMenus(storeId).pipe(
              tapResponse({
                next(response) {
                  const selectedId = store.selectedCategory()?._id;
                  const tops = topLevel(response);
                  const stillThere = tops.find((category) => category._id === selectedId);
                  const selected = stillThere ?? tops[0] ?? null;
                  // Keep the chosen sub-category only while it still exists under the (same) selected category.
                  const subId = store.selectedSub()?._id;
                  const sub = stillThere && subId ? childrenOf(response, selected?._id).find((c) => c._id === subId) ?? null : null;
                  patchState(store, {
                    categories: response,
                    selectedCategory: selected,
                    selectedSub: sub,
                  });
                },
                error(error) {
                  console.warn('Could not refresh categories', error);
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
        selectSub,
        createCategory$,
        getCategories$,
        refreshCategories$,
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

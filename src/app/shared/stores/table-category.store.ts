import {
    patchState,
    signalStore,
    withComputed,
    withHooks,
    withMethods,
    withState,
  } from "@ngrx/signals";
  import {  TableCategory } from "../models";
  import { computed, inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, tap, switchMap } from "rxjs";
import { TableCategoryService } from "../services/table-categories.service";
import { StoreStore } from "./store.store";
  
  type TableCategoryState = {
    tableCategories: TableCategory[];
    selectedTableCategory: TableCategory | null;
    isLoading: boolean;
    error: string | null;
  };
  
  const initialState: TableCategoryState = {
    tableCategories: [],
    selectedTableCategory: null,
    isLoading: false,
    error: null
  };
  
  export const TableCategoryStore = signalStore(
    { providedIn: "root" },
    withState(initialState),

    withComputed(({ tableCategories }) => ({
      tablesCategoryCount: computed(() => tableCategories().length)
    })),

    withMethods((store, 
      tableCategoryService = inject(TableCategoryService)
    ) => {
      const selectTableCategory = (tableCategory: TableCategory): void => {
        patchState(store, { selectedTableCategory: tableCategory });
      };

      const clearSelectedTableCategory = (): void => {
        patchState(store, {
          selectedTableCategory: null,
        });
      };

      const updateTableParams = (tableId: string, params: Partial<TableCategory>): void => {
        const updatedTableCategories = store.tableCategories().map((table) =>
          table._id === tableId ? { ...table, ...params } : table
        );
        patchState(store, { tableCategories: updatedTableCategories });
      };

      const createTableCategory = (tableCategory: TableCategory): void => {
        patchState(store, {
          tableCategories: [...store.tableCategories(), tableCategory],
        });
      };

      const deleteTableCategory = (tableCategoryId: string): void => {
        const updatedCategories = store.tableCategories().filter(tableCategory => tableCategory._id !== tableCategoryId);
        patchState(store, {
          tableCategories: updatedCategories,
        });
      };

      const getTablesCategories$ =  rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
              tableCategories: [],
            })
          ),
          switchMap((storeId) =>
            tableCategoryService.getStoreTableCategories(storeId).pipe(
              tapResponse({
                next(tables) {
                  
                  patchState(store, {
                    isLoading: false,
                    error: null,
                    tableCategories: tables,
                    selectedTableCategory:  null,
                  });
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error: String(error)
                  });
                },
              })
            )
          )
        )
      );

      const createTableCategory$ = rxMethod<{tableParams: Partial<TableCategory>, modalParams?: any}>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
            })
          ),
          switchMap((params) =>
            tableCategoryService.createTableCategory(params.tableParams).pipe(
              tapResponse({
                next(table: any | TableCategory) {
                    patchState(store, {
                      isLoading: false,
                      error: null,
                    })
                    createTableCategory(table)
                    if (params?.modalParams) {
                      params.modalParams.closeCallback();
                    }
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error: String(error)
                  });
                },
              })
            )
          )
        )
      );

      const updateTableCategory$ = rxMethod<{tableParams: Partial<TableCategory>, tableId: string, modalParams?: any}>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
            })
          ),
          switchMap((params) =>
            tableCategoryService.updateTableCategory(params.tableId, params.tableParams).pipe(
              tapResponse({
                next(table: any | TableCategory) {
                    patchState(store, {
                      isLoading: false,
                      error: null,
                    })
                    updateTableParams(params.tableId, params.tableParams)
                    if (params?.modalParams) {
                      params.modalParams.closeCallback();
                    }
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error: String(error)
                  });
                },
              })
            )
          )
        )
      );

      const deleteTableCategory$ = rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
            })
          ),
          switchMap((tableId) =>
            tableCategoryService.deleteTableCategory(tableId).pipe(
              tapResponse({
                next(table: any | TableCategory) {
                    patchState(store, {
                      isLoading: false,
                      error: null,
                    })
                    deleteTableCategory(tableId);
                   
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error: String(error)
                  });
                },
              })
            )
          )
        )
      );

      return {
        selectTableCategory,
        clearSelectedTableCategory,
        updateTableParams,
        createTableCategory,
        deleteTableCategory,
        getTablesCategories$,
        createTableCategory$,
        updateTableCategory$,
        deleteTableCategory$
      };
    }),

    withHooks({
      onInit(store) {
        const storeStore = inject(StoreStore);
        const selectedStore = storeStore.selectedStore();
        if (selectedStore?._id) {
          store.getTablesCategories$(selectedStore._id);
        }
      }
    })
  );
  
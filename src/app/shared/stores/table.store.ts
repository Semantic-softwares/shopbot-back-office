import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from "@ngrx/signals";
import { Order, Table, TableCategory } from "../models";
import { computed, inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, tap, switchMap } from "rxjs";
import { TableService } from "../services/table.service";
import { StoreStore } from "./store.store";

type TablesState = {
  tables: Table[];
  selectedTable: Table | null;
  isLoading: boolean;
  searchQuery: string;
  searchFilters: TableCategory | null;
  statusFilter: 'all' | 'free' | 'occupied';
  error: null | string;
};

const initialState: TablesState = {
  tables: [],
  selectedTable: null,
  isLoading: false,
  searchQuery: "",
  searchFilters: null,
  statusFilter: 'all',
  error: null,
};

export const TableStore = signalStore(
  { providedIn: "root" },
  withState(initialState),

  withComputed(({ tables, searchQuery, searchFilters, statusFilter }) => ({
    tablesCount: computed(() => tables().length),

    freeTableCount: computed(
      () => tables().filter((table) => !table.orderId).length
    ),

    totalSeatCount: computed(() => {
      return tables().reduce((sum, table) => sum + table.numberOfGuest, 0);
    }),

    totalFreeSeats: computed(() => {
      return tables()
        .filter((table) => table.orderId) // Filter tables with 'Free' status
        .reduce((sum, table) => sum + table.numberOfGuest, 0); // Sum up numberOfGuest
    }),

    occupiedTableCount: computed(
      () => tables().filter((table) => table.orderId).length
    ),

    filteredTables: computed(() => {
      const query = searchQuery()?.toLowerCase();
      const selected = searchFilters();
      const status = statusFilter();

      let filtered = tables();

      // Filter by search query
      if (query && query.length > 0) {
        filtered = filtered.filter((table) =>
          table.name?.toLowerCase().includes(query)
        );
      }

      // Filter by category
      if (selected) {
        filtered = filtered.filter((table) => table.category?._id === selected._id);
      }
    
      console.log(status)
      // Filter by status (free/occupied)
      if (status === 'free') {
        
        filtered = filtered.filter((table) => !table.orderId);
      } else if (status === 'occupied') {
        filtered = filtered.filter((table) => table.orderId);
      }

      return filtered;
    }),
  })),

  withMethods(
    (
      store,
      tableService = inject(TableService)
    ) => {
      function selectTable(tableId: string): void {
        const selected =
          store.tables().find((table) => table._id === tableId) || null;
        patchState(store, { selectedTable: selected });
      }

      // Deselects the current sales type and exits editing mode
      function clearSelectedTable(): void {
        patchState(store, {
          selectedTable: null,
        });
      }

      function updateTable(
        tableId: string,
        params: Partial<Table>
      ): void {
        const updatedTables = store
          .tables()
          .map((table) =>
            table._id === tableId ? { ...table, ...params } : table
          );

        patchState(store, { tables: updatedTables });
      }

      function updateTableOrder(tableId: string, order: Order): void {
       
        const updatedTables = store
          .tables()
          .map((table) =>
            table._id === tableId
              ? { ...table, order }
              : table
          );
        patchState(store, { tables: updatedTables });
        
      }

      function updateTableOrderSync(tableId: string, order: Partial<Table>): void {
        tableService.updateTable(tableId, order).subscribe({
          next: (updatedTable) => {
            console.log('Table updated on server:', updatedTable);
          },
          error: (error) => {
            console.error('Failed to update table on server:', error);
          }
        });
      }

      

      function updateSearchFilter(tableCategory: TableCategory): void {
        patchState(store, { searchFilters: tableCategory });
      }

      function updateSearchQuery(query: string): void {
        patchState(store, { searchQuery: query });
      }

      function updateStatusFilter(status: 'all' | 'free' | 'occupied'): void {
        patchState(store, { statusFilter: status });
      }

      function createTable(table: Table): void {
        patchState(store, {
          tables: [...store.tables(), table],
        });
      }

      function deleteTable(tableId: string): void {
        const updatedTables = store
          .tables()
          .filter((table) => table._id !== tableId);
        patchState(store, {
          tables: updatedTables,
        });
      }

      const getTables$ = rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
              tables: [],
            })
          ),
          switchMap((storeId) =>
            tableService.getStoreTables(storeId).pipe(
              tapResponse({
                next(tables) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                    tables: tables,
                  });
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error: String(error),
                  });
                },
              })
            )
          )
        )
      );

      const createTable$ = rxMethod<{
        tableParams: Partial<Table>;
        modalParams?: any;
      }>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
            })
          ),
          switchMap((params) =>
            tableService.createTable(params.tableParams).pipe(
              tapResponse({
                next(table: any | Table) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                  });
                  createTable(table);
                  if (params?.modalParams) {
                    params.modalParams.closeCallback();
                  }
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error: String(error),
                  });
                },
              })
            )
          )
        )
      );

      const updateTable$ = rxMethod<{
        tableParams: Partial<Table>;
        tableId: string;
        modalParams?: any;
      }>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
            })
          ),
          switchMap((params) =>
            tableService.updateTable(params.tableId, params.tableParams).pipe(
              tapResponse({
                next(table: any | Table) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                  });
                  updateTable(params.tableId, params.tableParams);
                  if (params?.modalParams) {
                    params.modalParams.closeCallback();
                  }
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error: String(error),
                  });
                },
              })
            )
          )
        )
      );

      const deleteTable$ = rxMethod<string>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
            })
          ),
          switchMap((tableId) =>
            tableService.deleteTable(tableId).pipe(
              tapResponse({
                next(table: any | Table) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                  });
                  // deleteTable(tableId);
                },
                error(error) {
                  patchState(store, {
                    isLoading: false,
                    error: String(error),
                  });
                },
              })
            )
          )
        )
      );

      return {
        selectTable,
        clearSelectedTable,
        updateTable,
        updateTableOrder,
        updateSearchFilter,
        updateSearchQuery,
        updateStatusFilter,
        createTable,
        deleteTable,
        getTables$,
        createTable$,
        updateTable$,
        deleteTable$,
        updateTableOrderSync
      };
    }
  ),

  withHooks({
    onInit(store) {
      const storeStore = inject(StoreStore);
      const selectedStore = storeStore.selectedStore();
      if (selectedStore?._id) {
        store.getTables$(selectedStore._id);
      }
    }
  })
);

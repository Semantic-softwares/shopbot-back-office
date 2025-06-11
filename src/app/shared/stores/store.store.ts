import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
  withHooks
} from "@ngrx/signals";
import { computed, inject } from "@angular/core";
import { Store } from "../models/store.model";
import { tapResponse } from "@ngrx/operators";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, tap, switchMap } from "rxjs";
import { StoreService } from "../services/store.service";
import { User } from "../models";
import { Employee } from "../models/employee.model";
type StoreState = {
  stores: Store[];
  isLoading: boolean;
  selectedStore: Store | null;
  error: unknown | null,
  logoPath: any[] | null,
  bannerPath: any[] | null
};

const initialState: StoreState = {
  stores: [],
  isLoading: false,
  selectedStore: null,
  error: null,
  logoPath:  null,
  bannerPath: null
};

export const StoreStore = signalStore(
  { providedIn: "root" },
  withState(initialState),

  withComputed(({ stores }) => ({
    storesCount: computed(() => stores().length),
  })),


  withMethods(
    (
      store,
      storeService = inject(StoreService),
    ) => {

      function setLoadingState(loading: boolean): void {
        patchState(store, { isLoading: loading });
      };

        function setSelectedStore(_store: Store): void {
          storeService.saveStoreLocally(_store);
          patchState(store, { selectedStore: _store });
        };

        function setSelectedStores(_stores: Store[]): void {
          storeService.saveStoresLocally(_stores);
          patchState(store, { stores: _stores });
        };

  

       function clearStores(): void {
        patchState(store, {
          stores: [],
        });
       }

        function initializeFromStorage(): void {
          const storedData = storeService.getStoreLocally;
          if (storedData) {
            patchState(store, { selectedStore: storedData });
          }
        };
  
        function updateStoreStaffs(staffId: string, staffParams: Partial<Employee>): void {
          // Get the current selectedStore
          const currentSelectedStore = store.selectedStore();
        
          if (currentSelectedStore) {
            // Update the staff in the selected store
            const updatedStaffs = currentSelectedStore.staffs.map((staff) =>
              staff._id === staffId ? { ...staff, ...staffParams } : staff
            );
        
            // Patch the updated selectedStore
            patchState(store, {
              selectedStore: {
                ...currentSelectedStore,
                staffs: updatedStaffs,
              },
            });
          }
        };
  
        // function addStaffToStore(email: string): void {
        //   // Inject the UserStore to access users
         
        
        //   // Get the current selectedStore
        //   const currentSelectedStore = store.selectedStore();
        
        //   if (currentSelectedStore) {
        //     // Find the user in the UserStore by email
        //     const user = this.userStore.findUserByEmail(email);
        //     if (user) {
        //       // Add the found user to the selectedStore's staffs
        //       patchState(store, {
        //         selectedStore: {
        //           ...currentSelectedStore,
        //           staffs: [...currentSelectedStore.staffs, user],
        //         },
        //       });
        //     } else {
        //       console.error(`User with email "${email}" not found.`);
        //     }
        //   } else {
        //     console.error("No selected store to add staff to.");
        //   }
        // };
  
        // function deleteStaffById(staffId: string,  userStore = inject(UserStore)): void {
        //   // Inject the UserStore to access users
         
        
        //   // Remove the user from the UserStore
        //   userStore.deleteUserById(staffId);
        
        //   // Get the current selectedStore
        //   const currentSelectedStore = store.selectedStore();
        
        //   if (currentSelectedStore) {
        //     // Filter out the staff with the given staffId
        //     const updatedStaffs = currentSelectedStore.staffs.filter(
        //       (staff) => staff._id !== staffId
        //     );
        
        //     // Patch the state with the updated staff list
        //     patchState(store, {
        //       selectedStore: {
        //         ...currentSelectedStore,
        //         staffs: updatedStaffs,
        //       },
        //     });
        //   } else {
        //     console.error("No selected store to remove staff from.");
        //   }
        // };
  
        function updateStore(updatedStore: Partial<Store>): void {
          const selectedStore = store.selectedStore();
          if (!selectedStore) return;
            patchState(store, {
              selectedStore: {
                ...selectedStore,
                ...updatedStore,
                _id: selectedStore._id, // Ensure _id is always present and defined
              } as Store,
            });
          
        };

      function updateLogoPath(paths: [] |  null): void {
        patchState(store, { logoPath:  paths });
      }
      
     

      const updateStore$ = rxMethod<Partial<Store>>(
        pipe(
          tap(() =>
            patchState(store, {
              isLoading: true,
              error: null,
            })
          ),
          switchMap((storeParams) => {
            return storeService.updateStore(store.selectedStore()!._id, storeParams).pipe(
              tapResponse({
                next(storeResponse) {
                  patchState(store, {
                    isLoading: false,
                    error: null,
                    logoPath: null,
                    bannerPath: null
                  });
                  updateStore(storeParams);
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
        setSelectedStores,
        clearStores,
        updateStore$,
        updateStore,
        updateStoreStaffs,
        setSelectedStore,
        initializeFromStorage,
        updateLogoPath,
        setLoadingState,
      };
    }
  ),

  withHooks({
    onInit(store, storeService = inject(StoreService)) {
      const storedStores = storeService.getStoresLocally;
        const selectedStore = storeService.getStoreLocally;
        if (storedStores && storedStores.length > 0) {
          patchState(store, {  stores: storedStores });
        }
        if (selectedStore) {
          patchState(store, { selectedStore });
        }
    },
    
  }),
);

import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from "@ngrx/signals";
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Order, OrderCategoryType, SalesTypeId, SearchFilter } from "../models";
import { computed, inject } from "@angular/core";
import { StoreStore } from "./store.store";
import { debounceTime, distinctUntilChanged, pipe, switchMap, tap } from "rxjs";
import { tapResponse } from '@ngrx/operators';
import { OrdersService } from "../services/order.service";

// Type for online orders indexing
type OnlineOrdersKey = 'new' | 'processing' | 'ready' | 'complete' | 'cancel';

type OrderState = {
  orders: Order[];
  isLoading: boolean;
  isAccepting: boolean;
  selectedOrder: Order | null;
  searchQuery: string;
  searchFilters: SearchFilter | null;
  onlineOrders: Record<OnlineOrdersKey, Order[]>;
  selectedOnlineOrder: Order | null;
  orderHistory: Order[];
  hasMore: boolean;
  isLoadingMore: boolean;
  error: string | null;
};

const initialState: OrderState = {
  orders: [],
  isAccepting: false,
  isLoading: false,
  selectedOrder: null,
  searchQuery: "",
  searchFilters: null,
  onlineOrders: {
    new: [],
    processing: [],
    ready: [],
    complete: [],
    cancel: []
  },
  selectedOnlineOrder: null,
  orderHistory: [],
  hasMore: false,
  isLoadingMore: false,
  error: null 
};

export const OrderStore = signalStore(
  { providedIn: "root" },
  withState(initialState),

  withComputed(({ orders, searchQuery, searchFilters, onlineOrders }) => ({
  
    orderCount: computed(() => orders().length),

    newOnlineOrders: computed(() => onlineOrders().new),

    processingOnlineOrders: computed(() => onlineOrders().processing),

    readyOnlineOrders: computed(() => onlineOrders().ready),

    completeOnlineOrders: computed(() => onlineOrders().complete),

    filteredOrders: computed(() => {
      const query = searchQuery()?.toLowerCase();
      const filters = searchFilters();
      const ordersList = orders();
      return ordersList.filter((order) => {
        // Check the search query match
        const matchesQuery = query
          ? order.reference?.toLowerCase().includes(query)
          : true;
    
        const matchesCategory = filters?.status
          ? order.category?.toLowerCase() === filters.status?.toLowerCase()
          : true;
    
        const matchesType = filters?.types
          ? order.salesType?.name.toLowerCase() === filters.types.toLowerCase()
          : true;
    
        const matchesPaymentType = filters?.paymentType
          ? order.payment?.toLowerCase() === filters.paymentType.toLowerCase()
          : true;
    
        // Check date range match
        const matchesDate = filters?.startedAt
          ? new Date(order.createdAt!).toDateString() === new Date(filters.startedAt).toDateString()
          : true;
    
        // Combine all conditions
        return (
          matchesQuery &&
          matchesCategory &&
          matchesType &&
          matchesPaymentType &&
          matchesDate
        );
      });
    }),
  })),

  withMethods((store) => {
   function updateSearchQuery(query: string): void {
      patchState(store, { searchQuery: query });
    };

    function updateSearchFilter(filters: SearchFilter): void {
      patchState(store, { searchFilters: filters });
    };

    function clearSearchFilter(): void {
      patchState(store, { searchFilters: null });
    };

    function clearSearchQuery(): void {
      patchState(store, { searchQuery: "" });
    };

    function findOrderById(id: string): Order | undefined {
      return store.orders().find((order) => order._id === id);
    };

    function selectOrder(order: Order): void {
      patchState(store, { selectedOrder: order });
    };

    function deleteOrder(orderId: string): void {
      const orders = store.orders();
      // Filter only the cart with the matching ID
      const updatedOrders = orders.filter((order) => order._id !== orderId);
      // Update the state with the remaining carts
      patchState(store, {
        orders: updatedOrders,
      });
    };

    function deleteSelectedOrder(): void {
      // Update the state with the remaining carts
      patchState(store, {
        selectedOrder: null,
      });
    };

    // Local state update only - use createOrder$ for server submission
    function addOrderToState(order: Order): void {
      patchState(store, {
        orders: [...store.orders(), order],
      });
      selectOrder(order);
    };

    function updateOrder(id: string, updates: Partial<Order>): void {
     
      patchState(store, {
        orders: store.orders().map((order) => {
          return order._id === id ? { ...order, ...updates } : order;
        }),
      });
    };

 

    function updateSelectedOrder(updates: Partial<Order>): void {
      const selectedOrder = store.selectedOrder();
      if (!selectedOrder) return;
      patchState(store, {
        selectedOrder: { ...selectedOrder, ...updates } as Order,
      });
    };

    function updateOnlineSelectedOrder(updates: Partial<Order>): void {
      const selectedOrder = store.selectedOnlineOrder();
      if (!selectedOrder) return;
      patchState(store, {
        selectedOnlineOrder: { ...selectedOrder, ...updates } as Order,
      });
    };

    // function saveOrderInDatabase(order: Partial<Order>) {
    //   dataBaseService.insertOrder(order);
    // }

    // function saveCartInDatabase(cart: Order['cart']) {
    //   dataBaseService.insertCart(cart);
    // };

    // function updateOrderInDatabase(orderId:string, order: Partial<Order>) {
    //   dataBaseService.updateOrder(orderId, order);
    // }



    return {
      updateSelectedOrder,
      updateOrder,
      addOrderToState,
      deleteSelectedOrder,
      deleteOrder,
      selectOrder,
      findOrderById,
      clearSearchQuery,
      clearSearchFilter,
      updateSearchFilter,
      updateSearchQuery,
      updateOnlineSelectedOrder
    }
  }),

  withMethods((store, 
    orderService = inject(OrdersService), 
    storeStore = inject(StoreStore)) => {
    
    // Helper to get order key for online orders
    function getOnlineOrderKey(orderType: OrderCategoryType): OnlineOrdersKey {
      return orderType.toLowerCase() as OnlineOrdersKey;
    }

    async function completeOrder(orderId: string, payment?: string): Promise<Order> {
      const ordersSignal = store.orders();
      const order = ordersSignal.find((order) => order._id === orderId);
      
      if (!order) {
        console.error(`Order with ID ${orderId} not found.`);
        return Promise.reject(new Error(`Order with ID ${orderId} not found.`));
      }

      // Prepare updates
      const updates: Partial<Order> = {
        category: OrderCategoryType.COMPLETE
      };

      // Add payment updates if payment is provided and order doesn't have payment yet
      if (!order.payment && payment) {
        updates.payment = payment;
        updates.paymentStatus = "Paid";
      }

      try {
        // Update the order on the server using comprehensive update
        const updatedOrder = await orderService.updateOrderComprehensive(orderId, updates).toPromise();
        console.log(`Order ${orderId} marked as complete on the server.`);
        
        if (updatedOrder) {
          // Update the store with fully populated order from backend
          patchState(store, {
            orders: ordersSignal.map((o) =>
              o._id === orderId ? updatedOrder as Order : o
            ),
          });

          return Promise.resolve(updatedOrder as Order);
        }
        
        return Promise.reject(new Error('No order returned from server'));
      } catch (error) {
        console.error(`Failed to update order ${orderId} on the server:`, error);
        return Promise.reject(error);
      }
    }

    const getOnlineOrders = rxMethod<{orderType: OrderCategoryType, limit?: number, offset?: number, reload?: boolean}>(
      pipe(
        switchMap((query) => {
          patchState(store, {
            isLoadingMore: true,
            isLoading: query?.reload ?? false
          });
          const limit = query.limit ?? 25;
          const offset = query.offset ?? 0;
          const selectedStore = storeStore.selectedStore();
          if (!selectedStore?._id) {
            patchState(store, { isLoading: false, isLoadingMore: false });
            return [];
          }
          return orderService.getStoreOrder(selectedStore._id, { status: query.orderType, limit, offset }, SalesTypeId.ONLINE).pipe(
            tapResponse({
              next: (orders: Order[]) => {
                patchState(store, {
                  isLoading: false,
                  hasMore: orders.length > 0,
                  isLoadingMore: false,
                  error: null,
                });
                if(store.hasMore()) {
                  const key = getOnlineOrderKey(query.orderType);
                  const currentOrders = store.onlineOrders()[key] || [];
                  patchState(store, {
                    onlineOrders: { 
                      ...store.onlineOrders(), 
                      [key]: [...currentOrders, ...orders] 
                    },
                  });
                }
              },
              error: (error) => {
                console.error(error);
                patchState(store, { error: String(error) });
              },
              finalize: () => patchState(store, { isLoading: false, isLoadingMore: false }),
            })
          );
        })
      )
    );

   function _selectOrder(orderType: OrderCategoryType): Order[] {
      const key = getOnlineOrderKey(orderType);
      return store.onlineOrders()[key] || [];
    }

   function clearOnlineOrders(orderType: OrderCategoryType): void {
      const key = getOnlineOrderKey(orderType);
      patchState(store, { 
        onlineOrders: { ...store.onlineOrders(), [key]: [] } 
      });
    }



    const getOnlineOrder = rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((orderId) =>
          orderService.getOrder(orderId).pipe(
            tapResponse({
              next: (order: Order) =>
                patchState(store, {
                  isLoading: false,
                  selectedOnlineOrder: order,
                }),
              error: (error) => {
                console.error(error);
                patchState(store, { error: String(error) });
              },
              finalize: () => patchState(store, { isLoading: false }),
            })
          )
        )
      )
    );

    const updateOrderStatus$ = rxMethod<{order: Order, statusNumber: number, currentStatus: OrderCategoryType, targetStatus: OrderCategoryType}>(
      pipe(
        tap(() => patchState(store, { isAccepting: true })),
        switchMap(({ order, statusNumber, currentStatus, targetStatus }) => {
          const userId = order.user?._id || '';
          return orderService.updateOrderStatus({orderId: order._id, userId, statusNumber}).pipe(
            tapResponse({
              next: (updatedOrder) => {
                store.updateOnlineSelectedOrder({category: targetStatus});
                const currentKey = getOnlineOrderKey(currentStatus);
                const targetKey = getOnlineOrderKey(targetStatus);
                const updatedOnlineOrders = { ...store.onlineOrders() };
                updatedOnlineOrders[currentKey] = updatedOnlineOrders[currentKey].filter((o: Order) => o._id !== order._id);
                updatedOnlineOrders[targetKey] = [...updatedOnlineOrders[targetKey], updatedOrder as Order];
                
                patchState(store, {
                  isLoading: false,
                  isAccepting: false,
                  onlineOrders: updatedOnlineOrders,
                  selectedOrder: updatedOrder as Order,
                });
              },
              error: (error) => {
                console.error(error);
                patchState(store, { error: String(error) });
              },
              finalize: () => patchState(store, { isLoading: false, isAccepting: false }),
            })
          );
        })
      )
    );

    const getOrderHistory = rxMethod<{limit: number, skip: number}>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => patchState(store, { isLoading: true })),
        switchMap((query) => {
          const limit = query.limit ?? 10;
          const skip = query.skip ?? 0;
          const selectedStore = storeStore.selectedStore();
          if (!selectedStore?._id) {
            patchState(store, { isLoading: false });
            return [];
          }
          return orderService.getStoreOrders(selectedStore._id, { limit, skip }).pipe(
            tapResponse({
              next: (orders: Order[]) =>
                patchState(store, {
                  orderHistory: orders,
                  isLoading: false,
                }),
              error: (error) => {
                console.error(error);
                patchState(store, { error: String(error) });
              },
              finalize: () => patchState(store, { isLoading: false }),
            })
          );
        })
      )
    );

    const getOrders$ = rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((storeId) => {
          return orderService.getStoreOrders(storeId, { limit: 100, skip: 0 }).pipe(
            tapResponse({
              next: (orders: Order[]) =>
                patchState(store, {
                  orders: orders,
                  isLoading: false
                }),
              error: (error) => {
                console.error(error);
                patchState(store, { error: String(error) });
              },
              finalize: () => patchState(store, { isLoading: false }),
            })
          );
        })
      )
    );

    // Delete order from server
    const deleteOrder$ = rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((orderId) => {
          return orderService.deleteOrder(orderId).pipe(
            tapResponse({
              next: () => {
                // Remove from local state
                patchState(store, {
                  orders: store.orders().filter(o => o._id !== orderId),
                  isLoading: false
                });
              },
              error: (error) => {
                console.error(error);
                patchState(store, { error: String(error) });
              },
              finalize: () => patchState(store, { isLoading: false }),
            })
          );
        })
      )
    );

    // Update order on server with comprehensive cart handling
    const updateOrder$ = rxMethod<{orderId: string, updates: Partial<Order>}>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ orderId, updates }) => {
          return orderService.updateOrderComprehensive(orderId, updates).pipe(
            tapResponse({
              next: (updatedOrder: any) => {
                // Update local state with fully populated order from backend
                patchState(store, {
                  orders: store.orders().map(o => 
                    o._id === orderId ? updatedOrder as Order : o
                  ),
                  isLoading: false
                });
              },
              error: (error) => {
                console.error('Failed to update order:', error);
                patchState(store, { error: String(error), isLoading: false });
              },
              finalize: () => patchState(store, { isLoading: false }),
            })
          );
        })
      )
    );

    // Sync order to server (handles both create and update)
    const syncOrder$ = rxMethod<Partial<Order>>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((orderData) => {
          return orderService.syncOrders([orderData as Order]).pipe(
            tapResponse({
              next: (syncedOrders: Order[]) => {
                const syncedOrder = syncedOrders[0];
                if (syncedOrder) {
                  // Check if order exists in state
                  const existingIndex = store.orders().findIndex(o => o._id === syncedOrder._id);
                  if (existingIndex >= 0) {
                    // Update existing order
                    const updatedOrders = [...store.orders()];
                    updatedOrders[existingIndex] = syncedOrder;
                    patchState(store, {
                      orders: updatedOrders,
                      selectedOrder: syncedOrder,
                      isLoading: false
                    });
                  } else {
                    // Add new order
                    patchState(store, {
                      orders: [...store.orders(), syncedOrder],
                      selectedOrder: syncedOrder,
                      isLoading: false
                    });
                  }
                }
              },
              error: (error) => {
                console.error(error);
                patchState(store, { error: String(error), isLoading: false });
              },
              finalize: () => patchState(store, { isLoading: false }),
            })
          );
        })
      )
    );

    return {
      getOrders$,
      getOnlineOrders,
      _selectOrder,
      getOnlineOrder,
      getOrderHistory,
      clearOnlineOrders,
      updateOrderStatus$,
      deleteOrder$,
      updateOrder$,
      syncOrder$,
      getOnlineOrderKey,
      completeOrder
    }
  }),

  withHooks({
    onInit(store) {
      const storeStore = inject(StoreStore);
      const selectedStore = storeStore.selectedStore();
      if (selectedStore?._id) {
        store.getOrders$(selectedStore._id);
      }
    }
  })
);

import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
  } from "@ngrx/signals";
  import {  SalesType, SalesTypeId } from "../models";
  import { computed } from "@angular/core";
  
  type SalesTypeState = {
    salesTypes: SalesType[];
    isEditing: boolean;
    selectedSale: SalesType | null
  };
  
  const initialState: SalesTypeState = {
    salesTypes: [{
        id: "table",
        name: "Table Sales",
        description: "For sales made at assigned tables within the premises.",
        icon: "table_icon.svg",
        features: {
          requiresTableAssignment: true,
          allowsMultipleOrders: true,
          supportsOnlinePayment: true,
          supportsOfflinePayment: true,
          requiresDeliveryAddress: false,
        },
        defaultSettings: {
          paymentMethod: "Cash",
          orderPrefix: "TBL",
        },
      },
      {
        id: "quick",
        name: "Quick Sales",
        description: "Fast checkout for walk-in customers without table assignment.",
        icon: "quick_icon.svg",
        features: {
          requiresTableAssignment: false,
          allowsMultipleOrders: false,
          supportsOnlinePayment: true,
          supportsOfflinePayment: true,
          requiresDeliveryAddress: false,
        },
        defaultSettings: {
          paymentMethod: "Card",
          orderPrefix: "QUK",
        },
      },
      {
        id: "online",
        name: "Online Sales",
        description: "Sales made through the online ordering system for delivery or pickup.",
        icon: "online_icon.svg",
        features: {
          requiresTableAssignment: false,
          allowsMultipleOrders: true,
          supportsOnlinePayment: true,
          supportsOfflinePayment: false,
          requiresDeliveryAddress: true,
        },
        defaultSettings: {
          paymentMethod: "Online",
          orderPrefix: "ONL",
        },
      }],
    isEditing: false,
    selectedSale: null
  };
  
  export const SalesTypeStore = signalStore(
    { providedIn: "root" },
    withState(initialState),
  
    withComputed(({ salesTypes }) => ({
      menuCount: computed(() => salesTypes().length),
    })),
  
    withMethods((store) => ({
        // Selects a sales type and optionally enables edit mode
        setSelectedSaleType(saleIdentifier: string, isEditing: boolean = false): void {
            const saleType = store.salesTypes().find(
              (sale) => sale.id === saleIdentifier || sale.name === saleIdentifier
            );
          
            if (saleType) {
              patchState(store, {
                selectedSale: saleType,
                isEditing, // Set the editing state based on the argument
              });
            } else {
              console.warn(`Sales type with ID or name "${saleIdentifier}" not found.`);
              patchState(store, { selectedSale: null, isEditing: false });
            }
          },

          setDefaultSaleType(): void {
            const defaultSale = store.salesTypes().find((sale) => sale.id === SalesTypeId.QUICK);
            if (defaultSale) {
              patchState(store, { selectedSale: defaultSale, isEditing: false });
            } else {
              console.warn("Default sale type 'Quick Sales' not found.");
            }
          },
    
        // Enables editing mode for the currently selected sales type
        startEditing(): void {
          console.log(store.selectedSale(), "Entering editing mode");
          if (store.selectedSale()) {
            patchState(store, { isEditing: true });
          } else {
            console.warn("No sales type selected to edit.");
          }
        },
    
        // Exits editing mode
        stopEditing(): void {
          console.log("Exiting editing mode");
          patchState(store, { isEditing: false });
        },
    
        // Deselects the current sales type and exits editing mode
        clearSelection(): void {
          patchState(store, {
            selectedSale: null,
            isEditing: false,
          });
        },
      }))
  );
  
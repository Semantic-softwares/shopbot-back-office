export interface SalesType {
    id: string; // Unique identifier for the sales type
    name: string; // Display name of the sales type
    description?: string; // Optional description for clarity
    icon?: string; // Optional icon for UI purposes
    features?: {
      requiresTableAssignment: boolean; // If the sale type requires table selection
      allowsMultipleOrders: boolean; // If multiple orders can be made simultaneously
      supportsOnlinePayment: boolean; // If online payment is supported
      supportsOfflinePayment: boolean; // If offline payment is supported
      requiresDeliveryAddress: boolean; // If a delivery address is needed
    };
    defaultSettings?: {
      paymentMethod: string; // Default payment method (e.g., "Cash", "Card", etc.)
      orderPrefix: string; // Prefix for order numbers (e.g., "TBL" for table sales)
    };
  }

  export enum SalesTypeId {
    TABLE = "table",
    QUICK = "quick",
    ONLINE = "online",
  }
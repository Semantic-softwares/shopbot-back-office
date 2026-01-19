import { Employee } from "./employee.model";
import { User } from "./user.model";

export interface Store {
    _id: string;
    storeType?: 'restaurant' | 'hotel';
    propertyType?: 'hotel' | 'hostel' | 'apartment' | 'guesthouse' | 'resort' | 'motel' | 'villa' | 'boutique_hotel' | 'bed_and_breakfast' | 'lodge';
    storeNumber?: string;
    bannerImage?: string;
    logo: string;
    name: string;
    description: string;
    active?: boolean;
    contactInfo: ContactInfo;
    notifications?: Notifications;
    operations?: Operations;
    orderSettings: OrderSettings;
    deliveryService: DeliveryService;
    paused: boolean;
    businessHours: BusinessHours | any;
    rank?: number;
    location?: Location | any;
    owner?: User,
    merchant?: User | string | any;
    currency: string;
    currencyCode: string;
    deliverySettings: DeliverySettings,
    category: string;
    walletBalance: number,
    deepLink: string;
    updateProgress: StoreUpdateProgress;
    staffs: Employee[];
    tax?: number;
    posSettings?: {
      requireOrdersPaymentBeforeCheckout?: boolean;
      useBarcodeScanner?: boolean;
      receiptSettings?: {
        showNote?: boolean;
        showTax?: boolean;
        showStoreDetails?: boolean;
        showSellerInfo?: boolean;
        showCustomerName?: boolean;
        printAfterFinish?: boolean;
        footerMessage?: string;
        disclaimer?: string;
      };
    };
    hotelSettings?: HotelSettings;
    channex?: ChannexIntegration;
  };
  
  export interface DeliverySettings {
    deliveryRadius: string;
    deliveryFeeNumber: number;
    deliveryFee: number;
    minimumOrderAmountForFreeDelivery: number;
    deliveryFeeForAllOrder: number;
    minimumDeliveryFee: number;
    deliveryFeeByKilometers: number;
    allowMinimumOrderAmount: number;
    minimumOrderAmount: number;
    estimatedDeliveryTime: {
       minimum: number;
       maximum: number;
    };
    enableDeliveryInstructions: boolean;
    deliveryInstructions: string;
    deliveryType: string[];
  }
  
  
  export  interface ContactInfo {
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    state?: string;
    postalCode?: string;
    placeName?: string;
    placeNumber?: string;
  }

  export  interface StoreUpdateProgress {
    isStorefrontSetup: boolean;
    isAccountAdded: boolean;
    isProductAdded: boolean;
    isBusinessUpdated:boolean;
  }
  
  
  export  interface Notifications {
    sms: string;
    phone: string;
    email: string;
  }
  
export interface Operations {
    payToBank: boolean;
    enableDelivery: boolean;
    alowPickUp: boolean;
  }
  
  
export interface OrderSettings {
    orderPrepTime: string;
    enablePickup: string;
    allowMinimumOrderAmount: number;
    minimumOrderAmount: number;
    pickUpInstruction: string;
  }
  
  export interface DeliveryService {
    deliverOrderToCustomers: 'My own couriers' | 'Our Courier';
  }
  
export interface BusinessHours {
    friday: { name: string, openingTime: string, closingTime: string, referenceDate: string, closed: boolean, open: boolean };
    monday: { name: string, openingTime: string, closingTime: string, referenceDate: string,  closed: boolean, open: boolean };
    saturday: { name: string, openingTime: string, closingTime: string, referenceDate: string,  closed: boolean, open: boolean };
    sunday:  { name: string, openingTime: string, closingTime: string, referenceDate: string,  closed: boolean, open: boolean };
    thursday: { name: string, openingTime: string, closingTime: string, referenceDate: string,  closed: boolean, open: boolean };
    tuesday:  { name: string, openingTime: string, closingTime: string, referenceDate: string,  closed: boolean, open: boolean };
    wednesday: { name: string, openingTime: string, closingTime: string, referenceDate: string,  closed: boolean, open: boolean };
  }
  
  
export interface Location {
    type: 'Point'
    coordinates: number[];
}

export interface HotelSettings {
  operationalSettings: {
    timezone: string;
    checkInTime: string;
    checkOutTime: string;
  };
  printerConfiguration: {
    paperSize: string;
    printQuality: string;
    autocut: boolean;
    headerText: string;
    footerText: string;
    includeLogo: boolean;
    fontSize: number;
    lineSpacing: number;
  };
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    smtpSecure: boolean;
    senderName: string;
    senderEmail: string;
    replyToEmail: string;
  };
  notifications: {
    reservationConfirmation: boolean;
    checkInReminder: boolean;
    checkOutReminder: boolean;
    paymentConfirmation: boolean;
    cancellationNotice: boolean;
    guestFeedbackRequest: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

export interface ChannexIntegration {
  propertyId?: string;
  syncEnabled?: boolean;
  lastSyncAt?: Date | string;
  syncStatus?: 'not_synced' | 'syncing' | 'synced' | 'error';
  syncErrors?: Array<{
    message: string;
    code?: string;
    occurredAt: Date | string;
  }>;
  oneTimeKey?: string;
  oneTimeKeyExpiry?: Date | string;
  channelsConnected?: boolean;
  connectedChannels?: Array<{
    channelId: string;
    channelName: string;
    connectedAt: Date | string;
    status: 'active' | 'disconnected' | 'error';
  }>;
  metadata?: {
    channelManager: string;
    propertyType: string;
    currency: string;
    timezone: string;
  };
}
  
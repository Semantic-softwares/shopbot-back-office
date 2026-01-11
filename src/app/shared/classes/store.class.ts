import { ContactInfo, Notifications, Operations, OrderSettings, DeliveryService, BusinessHours, DeliverySettings, StoreUpdateProgress, ReceiptSettings } from "../models/store.model";
import { User } from "../models/user.model";

export class Store {
    _id: string;
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
    location?: Location;
    owner?: User;
    currency: string;
    currencyCode: string;
    deliverySettings: DeliverySettings;
    category: string;
    walletBalance: number;
    deepLink: string;
    merchant: User | string | any;
    updateProgress: StoreUpdateProgress;
    staffs: User[];
    tax?: number; 
    useBarcodeScanner: boolean;
    receiptSettings: ReceiptSettings

    private generateReference(): string {
        return `USER-${Date.now()}`; // Example reference generator
    }
  
    constructor(data: Partial<Store>) {
      this._id = data._id || this.generateReference();
      this.bannerImage = data.bannerImage;
      this.logo = data.logo || '';
      this.name = data.name || '';
      this.description = data.description || '';
      this.active = data.active ?? true;
      this.contactInfo = data.contactInfo || this.initializeContactInfo();
      this.notifications = data.notifications || this.initializeNotifications();
      this.operations = data.operations || this.initializeOperations();
      this.orderSettings = data.orderSettings || this.initializeOrderSettings();
      this.deliveryService = data.deliveryService || { deliverOrderToCustomers: 'My own couriers' };
      this.paused = data.paused || false;
      this.businessHours = data.businessHours || this.initializeBusinessHours();
      this.rank = data.rank;
      this.location = data?.location;
      this.owner = data.owner;
      this.merchant = data.merchant || null;  
      this.currency = data.currency || '';
      this.currencyCode = data.currencyCode || '';
      this.deliverySettings = data.deliverySettings || this.initializeDeliverySettings();
      this.category = data.category || '';
      this.walletBalance = data.walletBalance || 0;
      this.deepLink = data.deepLink || '';
      this.updateProgress = data.updateProgress || this.initializeUpdateProgress()
      this.staffs = data.staffs || [];
      this.tax = data.tax || 0;
      this.useBarcodeScanner = data.useBarcodeScanner || false;
      this.receiptSettings = data.receiptSettings || this.initializeReceiptSettings()
    }
  
    private initializeContactInfo(): ContactInfo {
      return {
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        state: '',
        postalCode: '',
        placeName: '',
        placeNumber: '',
      };
    }

    
  
    private initializeNotifications(): Notifications {
      return {
        sms: '',
        phone: '',
        email: '',
      };
    }

    private initializeReceiptSettings(): ReceiptSettings {
      return {
        showNote: true,
        showTax: true,
        showStoreDetails: true,
        showCustomerName: true,
        printAfterFinish: true,
        footerMessage: '',
        disclaimer: '',
        paperSize: 32, // Default paper size in mm
      };
    }

    private initializeUpdateProgress(): StoreUpdateProgress {
      return {
        isStorefrontSetup: false,
        isAccountAdded: false,
        isProductAdded: false,
        isBusinessUpdated:false
      }
    }
   
  
    private initializeOperations(): Operations {
      return {
        payToBank: false,
        enableDelivery: false,
        alowPickUp: false,
      };
    }
  
    private initializeOrderSettings(): OrderSettings {
      return {
        orderPrepTime: '',
        enablePickup: '',
        allowMinimumOrderAmount: 0,
        minimumOrderAmount: 0,
        pickUpInstruction: '',
      };
    }
  
    private initializeDeliverySettings(): DeliverySettings {
      return {
        deliveryRadius: '',
        deliveryFeeNumber: 0,
        deliveryFee: 0,
        minimumOrderAmountForFreeDelivery: 0,
        deliveryFeeForAllOrder: 0,
        minimumDeliveryFee: 0,
        deliveryFeeByKilometers: 0,
        allowMinimumOrderAmount: 0,
        minimumOrderAmount: 0,
        estimatedDeliveryTime: { minimum: 0, maximum: 0 },
        enableDeliveryInstructions: false,
        deliveryInstructions: '',
        deliveryType: [],
      };
    }


    private initializeBusinessHours(): BusinessHours {
      return {
          sunday: {
            name: 'sunday',
            openingTime: '8:00',
            closingTime: '8:00',
            referenceDate: '8:00',
            closed: true,
            open: true
          },
          monday: {
            name: 'monday',
            openingTime: '8:00',
            closingTime: '8:00',
            referenceDate: '8:00',
            closed: true,
            open: true
          },
          tuesday: {
            name: 'tuesday',
            openingTime: '8:00',
            closingTime: '8:00',
            referenceDate: '8:00',
            closed: true,
            open: true
          },
          wednesday: {
            name: 'wednesday',
            openingTime: '8:00',
            closingTime: '8:00',
            referenceDate: '8:00',
            closed: true,
            open: true
          },
          thursday: {
            name: 'thursday',
            openingTime: '8:00',
            closingTime: '8:00',
            referenceDate: '8:00',
            closed: true,
            open: true
          },
          friday: {
            name: 'friday',
            openingTime: '8:00',
            closingTime: '8:00',
            referenceDate: '8:00',
            closed: true,
            open: true
          },
          saturday: {
            name: 'saturday',
            openingTime: '8:00',
            closingTime: '8:00',
            referenceDate: '8:00',
            closed: true,
            open: true
          },
      }
      
    }
  }
  
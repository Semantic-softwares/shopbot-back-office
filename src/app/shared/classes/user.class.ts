export class User {
    _id: string;
    photo: string;
    name: string;
    email: string;
    phoneNumber: string;
    gender: string;
    language: string;
    country: string;
    deleteAccount: boolean;
    address: string;
    password: string;
    phoneToken: string;
    loginCount: number;
    verifyPhoneNumber: boolean;
    allowNotifications: boolean;
    allowSalesNotifications: boolean;
    registered: string;
    notes: string;
    totalAmountSpent: number;
    avgAmountSpent: number;
    totalOrders: number;
    shipping: Shipping;
    pin: number;
    ban:boolean;
    store:string
    role: string;
    syncedAt: Date | string;
  
    constructor(data: Partial<User>) {
      this._id = data._id;
      this.photo = data.photo || '';
      this.name = data.name || '';
      this.email = data.email || '';
      this.phoneNumber = data.phoneNumber || '';
      this.gender = data.gender || '';
      this.language = data.language || '';
      this.country = data.country || '';
      this.deleteAccount = data.deleteAccount || false;
      this.address = data.address || '';
      this.password = data.password || '';
      this.phoneToken = data.phoneToken || '';
      this.loginCount = data.loginCount || 0;
      this.verifyPhoneNumber = data.verifyPhoneNumber || false;
      this.allowNotifications = data.allowNotifications || false;
      this.allowSalesNotifications = data.allowSalesNotifications || false;
      this.registered = data.registered || new Date().toISOString();
      this.notes = data.notes || '';
      this.totalAmountSpent = data.totalAmountSpent || 0;
      this.avgAmountSpent = data.avgAmountSpent || 0;
      this.totalOrders = data.totalOrders || 0;
      this.shipping = data.shipping || this.initializeShipping();
      this.pin = data.pin || 0;
      this.ban = data.ban || false,
      this.store = data.store || null
      this.role = data.role || null,
      this.syncedAt = data.syncedAt || new Date().toISOString();
    }
  
    private initializeShipping(): Shipping {
      return {
        name: '',
        latitude: 0,
        longitude: 0,
        country: '',
        isoCountryCode: '',
        locality: '',
        postalCode: '',
        administrativeArea: '',
        subAdministrativeArea: '',
        subLocality: '',
        subThoroughfare: '',
        thoroughfare: '',
      };
    }
  }
  
  export class Shipping {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    isoCountryCode: string;
    locality: string;
    postalCode: string;
    administrativeArea: string;
    subAdministrativeArea: string;
    subLocality: string;
    subThoroughfare: string;
    thoroughfare: string;
  
    constructor(data: Partial<Shipping>) {
      this.name = data.name || '';
      this.latitude = data.latitude || 0;
      this.longitude = data.longitude || 0;
      this.country = data.country || '';
      this.isoCountryCode = data.isoCountryCode || '';
      this.locality = data.locality || '';
      this.postalCode = data.postalCode || '';
      this.administrativeArea = data.administrativeArea || '';
      this.subAdministrativeArea = data.subAdministrativeArea || '';
      this.subLocality = data.subLocality || '';
      this.subThoroughfare = data.subThoroughfare || '';
      this.thoroughfare = data.thoroughfare || '';
    }

    
  }
  
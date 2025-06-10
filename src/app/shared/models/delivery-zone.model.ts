export interface DeliveryZone {
    country?: string;
    countryCode?: string;
    currencyCode?: string;
    currency?: string;
    image?: string;
    states?: State[];
    enabled?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface State {
    name?: string;
    localities?: Locality[];
  }
  
  export interface Locality {
    name: string;
    latitude: string;
    longitude: string;
    enabled?: boolean;
  }
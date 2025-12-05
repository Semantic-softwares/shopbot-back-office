import { Injectable } from '@angular/core';

export interface PricingCalculation {
  subtotal: number;
  taxes: number;
  serviceFee: number;
  totalDiscount: number;
  earlyBirdDiscount: number;
  total: number;
}

export interface RoomPrice {
  roomId: string;
  nights: number;
  pricePerNight: number;
  subtotal: number;
}

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  /**
   * Calculate pricing from rooms
   * Sums room prices and applies taxes/fees
   */
  calculatePricingFromRooms(rooms: any[], taxRate: number = 0.1): PricingCalculation {
    if (!rooms || rooms.length === 0) {
      return this.getEmptyPricing();
    }

    let subtotal = 0;

    // Calculate subtotal from all rooms
    for (const room of rooms) {
      if (room.pricing && room.stayPeriod) {
        subtotal += room.pricing * room.stayPeriod;
      }
    }

    // Calculate taxes
    const taxes = Math.round(subtotal * taxRate * 100) / 100;

    // Get other pricing components (these should come from form)
    const serviceFee = 0; // This would be set separately
    const totalDiscount = 0; // This would be calculated from discount rules
    const earlyBirdDiscount = 0; // This would be calculated from booking timing

    const total = subtotal + taxes + serviceFee - totalDiscount - earlyBirdDiscount;

    return {
      subtotal,
      taxes,
      serviceFee,
      totalDiscount,
      earlyBirdDiscount,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Calculate the total with all components
   */
  calculateTotal(
    subtotal: number,
    taxes: number,
    serviceFee: number,
    totalDiscount: number,
    earlyBirdDiscount: number
  ): number {
    return Math.round(
      (subtotal + taxes + serviceFee - totalDiscount - earlyBirdDiscount) * 100
    ) / 100;
  }

  /**
   * Get empty/default pricing
   */
  private getEmptyPricing(): PricingCalculation {
    return {
      subtotal: 0,
      taxes: 0,
      serviceFee: 0,
      totalDiscount: 0,
      earlyBirdDiscount: 0,
      total: 0,
    };
  }

  /**
   * Calculate subtotal from rooms
   */
  calculateSubtotal(rooms: any[]): number {
    if (!rooms || rooms.length === 0) return 0;

    return rooms.reduce((total, room) => {
      const roomPrice = (room.pricing || 0) * (room.stayPeriod || 1);
      return total + roomPrice;
    }, 0);
  }

  /**
   * Apply discount based on percentage
   */
  applyPercentageDiscount(amount: number, percentage: number): number {
    return Math.round((amount * percentage) / 100 * 100) / 100;
  }

  /**
   * Apply fixed discount
   */
  applyFixedDiscount(amount: number, discount: number): number {
    return Math.min(discount, amount);
  }
}

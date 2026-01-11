import { Product } from "../models";


export class _Category {
    name: string;
    activate: boolean;
    position: number;
    color: string;
    icon: string;
    items: number;
    store?: string;
    foods?:  Product[] |  string[]
  
    constructor(data: Partial<_Category>) {
      this.name = data.name || '';
      this.activate = data.activate ?? true; // Defaults to `true` if not provided
      this.position = data.position || 0;
      this.color = data.color || '#CFDDDB'; // Default color is black
      this.icon = data.icon || 'lunch_dining'; // Default color is black
      this.items = data.items || 0;
      this.store = data.store || '';
      this.foods = data.foods || []
    }
  }
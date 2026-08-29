export interface TemplateSettingField {
  key: string;
  label: string;
  type: 'color' | 'text' | 'select' | 'image' | 'font';
  default?: any;
  options?: any[];
}

export interface Template {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  previewImage?: string;
  isBuiltIn: boolean;
  status: 'draft' | 'published';
  price: number;
  settingsSchema: TemplateSettingField[];
}

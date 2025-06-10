export interface Feedback {
  status: 'PENDING' | 'RESPONDED';
  _id: string;
  user: User;
  touchPoint: TouchPoint;
  company: Company;
  touchPointReference: string;
  touchPointDetails: string;
  sent: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
  office: string;
}

interface TouchPoint {
  _id: string;
  name: string;
  description: string;
  status: boolean;
}

interface Company {
  _id: string;
  name: string;
  email: string;
  website: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface QuestionResponse {
  _id: string;
  question: string;
  response: string;
  type: string;
  createdAt: string;
}

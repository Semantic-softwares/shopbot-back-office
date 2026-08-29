export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  socketUrl: 'http://localhost:3000',
  subscriptionApiUrl: 'http://localhost:3000/subscriptions',
  usageApiUrl: 'http://localhost:3000/usage',
  appUrl: 'http://localhost:4200',
  paymentReturnUrl: 'http://localhost:4200/#/pricing/payment-callback',
  webhookUrl: 'https://comprisable-glumpy-mildred.ngrok-free.dev/webhooks/paystack',
  // Firebase Web Push (staff on-duty table-order alerts).
  firebaseConfig: {
    apiKey: 'AIzaSyALKWXDUQHGAf2nwjQ1eDN-zOApIlRiM4k',
    authDomain: 'foodie-6d808.firebaseapp.com',
    projectId: 'foodie-6d808',
    storageBucket: 'foodie-6d808.firebasestorage.app',
    messagingSenderId: '883466824651',
    appId: '1:883466824651:web:373261f8a1907bfe84a44e',
  },
  vapidKey: 'BGR6An1ArcSr33uyiWUSoMszE0SJC0b1FyEYzINtKAVAQ9mEar5r8Z0vkR4fSfy4Mb4qbke35IGyrBK7kNJ-ct0',
};


export const environment = {
  production: true,
  apiUrl: 'https://shopbot-server-7d7f5c27c0b7.herokuapp.com',
  socketUrl: 'https://shopbot-server-7d7f5c27c0b7.herokuapp.com',
  subscriptionApiUrl: 'https://shopbot-server-7d7f5c27c0b7.herokuapp.com/subscriptions',
  usageApiUrl: 'https://shopbot-server-7d7f5c27c0b7.herokuapp.com/usage',
  appUrl: 'https://office.shopbot.africa',
  // Standalone storefront app (shopbot-storefront) that table QR codes and store links open.
  storefrontUrl: 'https://store.shopbot.africa',
  paymentReturnUrl: 'https://office.shopbot.africa/pricing/payment-callback',
  webhookUrl: 'https://shopbot-server-7d7f5c27c0b7.herokuapp.com/webhooks/paystack',
  // Same Firebase project as environment.ts (and public/firebase-messaging-sw.js's own copy, which can't read this file).
  firebaseConfig: {
    apiKey: 'AIzaSyALKWXDUQHGAf2nwjQ1eDN-zOApIlRiM4k',
    authDomain: 'foodie-6d808.firebaseapp.com',
    projectId: 'foodie-6d808',
    storageBucket: 'foodie-6d808.firebasestorage.app',
    messagingSenderId: '883466824651',
    appId: '1:883466824651:web:373261f8a1907bfe84a44e',
  },
  vapidKey: 'BGR6An1ArcSr33uyiWUSoMszE0SJC0b1FyEYzINtKAVAQ9mEar5r8Z0vkR4fSfy4Mb4qbke35IGyrBK7kNJ-ct0',
  // Same key loaded in index.html. The app's original key here
  // (AIzaSyAIDzv-...) turned out to be invalid — confirmed via a direct
  // Geocoding API call returning "The provided API key is invalid." — which
  // is why both the Places Autocomplete and the delivery map broke. Reusing
  // the storefront's working key instead.
  googleMapsApiKey: 'AIzaSyDj2Iq9H0urXYeg-ZNuD4i19jmjZv6rk74',
};


import{a as _}from"./chunk-FUTA6TE5.js";import{i as $}from"./chunk-WFQLSX5X.js";import{a as T}from"./chunk-BFT2MTJY.js";import{x as A}from"./chunk-6BQAOBQP.js";import{$ as E,ea as h}from"./chunk-H33Y42PP.js";import{a as P,g as y}from"./chunk-GAL4ENT6.js";var x=class f{http=h(A);storeStore=h($);bluetoothPrinterService=h(_);apiUrl=`${T.apiUrl}/print-jobs`;COMMANDS={INIT:"\x1B@",ALIGN_CENTER:"\x1Ba",ALIGN_LEFT:"\x1Ba\0",TEXT_DOUBLE_SIZE:"\x1B!0",TEXT_NORMAL:"\x1B!\0",BOLD_ON:"\x1BE",BOLD_OFF:"\x1BE\0",FEED_LINE:`
`,CUT_PAPER:"V\0"};getPrintJobs(e,i){let r=P({store:e,populate:"order,station"},i);return this.http.get(this.apiUrl,{params:r})}getPrintJobById(e){return this.http.get(`${this.apiUrl}/${e}`)}getPrintJobStats(e){return this.http.get(`${this.apiUrl}/stats`,{params:{store:e}})}retryPrintJob(e){return this.http.post(`${this.apiUrl}/${e}/retry`,{})}cancelPrintJob(e){return this.http.post(`${this.apiUrl}/${e}/cancel`,{})}createPrintJobsForOrder(e){return this.http.post(`${this.apiUrl}/create-for-order`,{orderData:e})}generateOrderReceipt(e){if(console.log("=== GENERATE RECEIPT ==="),console.log("Order ID:",e._id),console.log("Order Reference:",e.reference),console.log("Order cart products:",e.cart?.products?.length||0),!e)return console.error("\u274C No order provided"),this.COMMANDS.INIT+`ERROR: No order data
`+this.COMMANDS.CUT_PAPER;let i=this.storeStore.selectedStore()?.posSettings?.receiptSettings,r=i?.showNote??!1,I=i?.showTax??!0,L=i?.showStoreDetails??!0,R=i?.showSellerInfo??!0,F=i?.showCustomerName??!0,b=i?.footerMessage||"Thank you for your patronage",D=i?.disclaimer||"",t="";if(t+=this.COMMANDS.INIT,L){t+=this.COMMANDS.ALIGN_CENTER,t+=this.COMMANDS.TEXT_DOUBLE_SIZE,t+=this.COMMANDS.BOLD_ON;let n=e.store;n&&n.name&&(t+=`${n.name}
`),t+=`KITCHEN ORDER
`,t+=this.COMMANDS.BOLD_OFF,t+=this.COMMANDS.TEXT_NORMAL}if(t+=this.COMMANDS.ALIGN_LEFT,t+=`================================
`,t+=this.COMMANDS.BOLD_ON,t+=`Order: #${e.reference||e._id}
`,t+=this.COMMANDS.BOLD_OFF,t+=`Time: ${this.formatDate(e.createdAt||new Date)}
`,e.type&&(t+=`Type: ${e.type}
`),e.salesChannel&&(t+=`Channel: ${e.salesChannel}
`),e.table){let n=e.table;t+=`Table: ${n.number||n.name||n}
`}if(F&&e.guest){let n=e.guest;n.name&&(t+=`Guest: ${n.name}
`),n.room&&(t+=`Room: ${n.room}
`)}if(R&&e.staff){let n=e.staff,u=n.name||n.firstName||n;t+=`Server: ${u}
`}t+=`================================
`;let S=e.cart?.products||[],s=this.storeStore.selectedStore()?.currencyCode||"NGN";S.length>0?(t+=this.COMMANDS.BOLD_ON,t+=`ITEMS:
`,t+=this.COMMANDS.BOLD_OFF,S.forEach(n=>{let u=n.name,v=n.quantity||1,g=n.price||0;t+=`${v}x ${u}`,g>0&&(t+=` - ${this.formatCurrency(g,s)}`),t+=`
`,n.options&&Array.isArray(n.options)&&n.options.length>0&&n.options.forEach(o=>{if(o.options&&Array.isArray(o.options))o.options.forEach(a=>{if(a.selected){let l=a.quantity||1,c=a.price||0;t+=`   + ${l}x ${a.name}`,c>0&&(t+=` (${this.formatCurrency(c,s)})`),t+=`
`}});else{let a=o.optionItemName||o.name||o,l=o.quantity||1,c=o.price||0;l>1?t+=`   + ${l}x ${a}`:t+=`   + ${a}`,c>0&&(t+=` (${this.formatCurrency(c,s)})`),t+=`
`}}),n.notes&&(t+=`   Note: ${n.notes}
`),t+=`
`})):t+=`No items in order
`,t+=`================================
`;let M=e.subTotal||e.subtotal,O=e.tax,p=e.discount,N=e.shippingFee,m=e.serviceFee,C=e.total;return t+=this.COMMANDS.BOLD_ON,t+=`ORDER SUMMARY:
`,t+=this.COMMANDS.BOLD_OFF,M!==void 0&&(t+=`Subtotal:            ${this.formatCurrency(M,s)}
`),I&&O&&O>0&&(t+=`Tax:                 ${this.formatCurrency(O,s)}
`),p&&p>0&&(t+=`Discount:           -${this.formatCurrency(p,s)}
`),N&&N>0&&(t+=`Shipping:            ${this.formatCurrency(N,s)}
`),m&&m>0&&(t+=`Service Fee:         ${this.formatCurrency(m,s)}
`),C!==void 0&&(t+=`--------------------------------
`,t+=this.COMMANDS.BOLD_ON,t+=`TOTAL:               ${this.formatCurrency(C,s)}
`,t+=this.COMMANDS.BOLD_OFF),e.payment&&(t+=`Payment: ${e.payment}
`),e.paymentStatus&&(t+=`Status: ${e.paymentStatus}
`),t+=`================================
`,r&&(e.note||e.orderInstruction)&&(t+=this.COMMANDS.BOLD_ON,t+=`NOTES:
`,t+=this.COMMANDS.BOLD_OFF,t+=`${e.note||e.orderInstruction}
`,t+=`================================
`),t+=this.COMMANDS.ALIGN_CENTER,b&&(t+=`${b}
`),D&&(t+=this.COMMANDS.TEXT_NORMAL,t+=`${D}
`),t+=this.COMMANDS.TEXT_NORMAL,t+=`Order: ${e.reference||e._id.substring(e._id.length-6)}
`,t+=this.COMMANDS.FEED_LINE,t+=this.COMMANDS.FEED_LINE,t+=this.COMMANDS.CUT_PAPER,console.log("=== RECEIPT GENERATED ==="),t}printOrderReceipt(e){return y(this,null,function*(){if(this.bluetoothPrinterService.isConnected()){console.log("\u{1F4F1} [PRINT] Printer connected - Printing directly via Bluetooth");try{let r=this.generateOrderReceipt(e);return yield this.bluetoothPrinterService.sendToPrinter(r),console.log("\u2705 [PRINT] Direct print completed"),{isPrinterConnected:!0}}catch(r){throw console.error("\u274C [PRINT] Direct print failed:",r),r}}else{console.log("\u{1F4E1} [PRINT] No printer connected - Creating backend print job");try{let r=yield this.createPrintJobsForOrder(e).toPromise();return console.log("\u2705 [PRINT] Print job created - Master system will print:",r),{isPrinterConnected:!1}}catch(r){throw console.error("\u274C [PRINT] Failed to create print job:",r),new Error("Failed to create print job. Please try again.")}}})}formatCurrency(e,i){let r=e.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});return`${i} ${r}`}formatDate(e){return e?new Date(e).toLocaleString():"-"}static \u0275fac=function(i){return new(i||f)};static \u0275prov=E({token:f,factory:f.\u0275fac,providedIn:"root"})};export{x as a};

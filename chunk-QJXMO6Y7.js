import{i as R}from"./chunk-ZKQYDJ5W.js";import{a as I}from"./chunk-BFT2MTJY.js";import{A as m}from"./chunk-H22US2IH.js";import{aa as h,fa as l}from"./chunk-P5WOETP4.js";import{a as v}from"./chunk-GAL4ENT6.js";var f=class a{http=l(m);networkPrinterUrl="http://localhost:4001/api";sendToPrinter(t,n,s,g){try{let O={data:btoa(t),printerId:n||null,orderId:s||"unknown",orderRef:g||"N/A"};return this.http.post(`${this.networkPrinterUrl}/print`,O)}catch(b){throw console.error("\u274C [NETWORK PRINTER] Error preparing data:",b),b}}getPrinters(){return this.http.get(`${this.networkPrinterUrl}/printers`)}testPrinter(t,n){return this.http.post(`${this.networkPrinterUrl}/printers/test`,{ip:t,port:n})}addPrinter(t,n,s){return this.http.post(`${this.networkPrinterUrl}/printers/add`,{name:t,ip:n,port:s})}removePrinter(t){return this.http.delete(`${this.networkPrinterUrl}/printers/${t}`)}getPrintLogs(t=100){return this.http.get(`${this.networkPrinterUrl}/logs?limit=${t}`)}clearLogs(){return this.http.delete(`${this.networkPrinterUrl}/logs`)}getQueueStats(){return this.http.get(`${this.networkPrinterUrl}/queue/stats`)}discoverUSBPrinters(){return this.http.post(`${this.networkPrinterUrl}/printers/usb/discover`,{})}static \u0275fac=function(n){return new(n||a)};static \u0275prov=h({token:a,factory:a.\u0275fac,providedIn:"root"})};var d=class a{http=l(m);storeStore=l(R);networkPrinterService=l(f);apiUrl=`${I.apiUrl}/print-jobs`;COMMANDS={INIT:"\x1B@",ALIGN_CENTER:"\x1Ba",ALIGN_LEFT:"\x1Ba\0",TEXT_DOUBLE_SIZE:"\x1B!0",TEXT_NORMAL:"\x1B!\0",BOLD_ON:"\x1BE",BOLD_OFF:"\x1BE\0",FEED_LINE:`
`,CUT_PAPER:"V\0"};getPrintJobs(t,n){let s=v({store:t,populate:"order,station"},n);return this.http.get(this.apiUrl,{params:s})}getPrintJobById(t){return this.http.get(`${this.apiUrl}/${t}`)}getPrintJobStats(t){return this.http.get(`${this.apiUrl}/stats`,{params:{store:t}})}retryPrintJob(t){return this.http.post(`${this.apiUrl}/${t}/retry`,{})}cancelPrintJob(t){return this.http.post(`${this.apiUrl}/${t}/cancel`,{})}createPrintJobsForOrder(t){return this.http.post(`${this.apiUrl}/create-for-order`,{orderData:t})}printOrder(t){return this.http.post(`${this.apiUrl}/print-order`,{orderId:t})}generateOrderReceipt(t,n=80){if(console.log("=== GENERATE RECEIPT ==="),console.log("Order ID:",t._id),console.log("Order Reference:",t.reference),console.log("Order cart products:",t.cart?.products?.length||0),console.log("Paper Width:",n,"mm"),!t)return console.error("\u274C No order provided"),this.COMMANDS.INIT+`ERROR: No order data
`+this.COMMANDS.CUT_PAPER;let s=this.storeStore.selectedStore()?.posSettings?.receiptSettings,g=s?.showNote??!1,b=s?.showTax??!0,O=s?.showStoreDetails??!0,x=s?.showSellerInfo??!0,L=s?.showCustomerName??!0,P=s?.footerMessage||"Thank you for your patronage",E=s?.disclaimer||"",e="";if(e+=this.COMMANDS.INIT,O){e+=this.COMMANDS.ALIGN_CENTER,e+=this.COMMANDS.TEXT_DOUBLE_SIZE,e+=this.COMMANDS.BOLD_ON;let r=t.store;r&&r.name&&(e+=`${r.name}
`),e+=`KITCHEN ORDER
`,e+=this.COMMANDS.BOLD_OFF,e+=this.COMMANDS.TEXT_NORMAL}if(e+=this.COMMANDS.ALIGN_LEFT,e+=this.generateSeparator(n),e+=this.COMMANDS.BOLD_ON,e+=`Order: #${t.reference||t._id}
`,e+=this.COMMANDS.BOLD_OFF,e+=`Time: ${this.formatDate(t.createdAt||new Date)}
`,t.type&&(e+=`Type: ${t.type}
`),t.salesChannel&&(e+=`Channel: ${t.salesChannel}
`),t.table){let r=t.table;e+=`Table: ${r.number||r.name||r}
`}if(L&&t.guest){let r=t.guest;r.name&&(e+=`Guest: ${r.name}
`),r.room&&(e+=`Room: ${r.room}
`)}if(x&&t.staff){let r=t.staff,M=r.name||r.firstName||r;e+=`Server: ${M}
`}e+=this.generateSeparator(n);let $=t.cart?.products||[],i=this.storeStore.selectedStore()?.currencyCode||"NGN";$.length>0?(e+=this.COMMANDS.BOLD_ON,e+=`ITEMS:
`,e+=this.COMMANDS.BOLD_OFF,$.forEach(r=>{let M=r.name,_=r.quantity||1,A=r.price||0;e+=`${_}x ${M}`,A>0&&(e+=` - ${this.formatCurrency(A,i)}`),e+=`
`,r.options&&Array.isArray(r.options)&&r.options.length>0&&r.options.forEach(o=>{if(o.options&&Array.isArray(o.options))o.options.forEach(c=>{if(c.selected){let p=c.quantity||1,u=c.price||0;e+=`   + ${p}x ${c.name}`,u>0&&(e+=` (${this.formatCurrency(u,i)})`),e+=`
`}});else{let c=o.optionItemName||o.name||o,p=o.quantity||1,u=o.price||0;p>1?e+=`   + ${p}x ${c}`:e+=`   + ${c}`,u>0&&(e+=` (${this.formatCurrency(u,i)})`),e+=`
`}}),r.notes&&(e+=`   Note: ${r.notes}
`),e+=`
`})):e+=`No items in order
`,e+=this.generateSeparator(n);let C=t.subTotal||t.subtotal,N=t.tax,S=t.discount,D=t.shippingFee,y=t.serviceFee,T=t.total;return e+=this.COMMANDS.BOLD_ON,e+=`ORDER SUMMARY:
`,e+=this.COMMANDS.BOLD_OFF,C!==void 0&&(e+=`Subtotal:            ${this.formatCurrency(C,i)}
`),b&&N&&N>0&&(e+=`Tax:                 ${this.formatCurrency(N,i)}
`),S&&S>0&&(e+=`Discount:           -${this.formatCurrency(S,i)}
`),D&&D>0&&(e+=`Shipping:            ${this.formatCurrency(D,i)}
`),y&&y>0&&(e+=`Service Fee:         ${this.formatCurrency(y,i)}
`),T!==void 0&&(e+=`--------------------------------
`,e+=this.COMMANDS.BOLD_ON,e+=`TOTAL:               ${this.formatCurrency(T,i)}
`,e+=this.COMMANDS.BOLD_OFF),t.payment&&(e+=`Payment: ${t.payment}
`),t.paymentStatus&&(e+=`Status: ${t.paymentStatus}
`),e+=this.generateSeparator(n),g&&(t.note||t.orderInstruction)&&(e+=this.COMMANDS.BOLD_ON,e+=`NOTES:
`,e+=this.COMMANDS.BOLD_OFF,e+=`${t.note||t.orderInstruction}
`,e+=this.generateSeparator(n)),e+=this.COMMANDS.ALIGN_CENTER,P&&(e+=`${P}
`),E&&(e+=this.COMMANDS.TEXT_NORMAL,e+=`${E}
`),e+=this.COMMANDS.TEXT_NORMAL,e+=`Order: ${t.reference||t._id.substring(t._id.length-6)}
`,e+=this.COMMANDS.FEED_LINE,e+=this.COMMANDS.FEED_LINE,e+=this.COMMANDS.CUT_PAPER,console.log("=== RECEIPT GENERATED ==="),e}formatCurrency(t,n){let s=t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});return`${n} ${s}`}formatDate(t){return t?new Date(t).toLocaleString():"-"}sendToNetworkPrinter(t,n){try{this.networkPrinterService.sendToPrinter(t,void 0,n?._id,n?.reference).subscribe({next:s=>{console.log("\u2705 [NETWORK PRINTER] Print job sent successfully:",s)},error:s=>{console.warn("\u26A0\uFE0F [NETWORK PRINTER] Failed to send to network printer:",s.message)}})}catch(s){console.warn("\u26A0\uFE0F [NETWORK PRINTER] Error preparing print job:",s.message)}}generateSeparator(t=80){let n=t===58?31:42;return"=".repeat(n)+`
`}static \u0275fac=function(n){return new(n||a)};static \u0275prov=h({token:a,factory:a.\u0275fac,providedIn:"root"})};export{d as a};

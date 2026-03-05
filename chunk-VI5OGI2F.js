import{i as d}from"./chunk-ZKQYDJ5W.js";import{a as I}from"./chunk-BFT2MTJY.js";import{A as f}from"./chunk-H22US2IH.js";import{aa as m,fa as l}from"./chunk-P5WOETP4.js";import{a as v}from"./chunk-GAL4ENT6.js";var g=class a{http=l(f);networkPrinterUrl="http://localhost:4001/api";sendToPrinter(t,s,n,O){try{let N={data:btoa(t),printerId:s||null,orderId:n||"unknown",orderRef:O||"N/A"};return this.http.post(`${this.networkPrinterUrl}/print`,N)}catch(u){throw console.error("\u274C [NETWORK PRINTER] Error preparing data:",u),u}}getPrinters(){return this.http.get(`${this.networkPrinterUrl}/printers`)}testPrinter(t,s){return this.http.post(`${this.networkPrinterUrl}/printers/test`,{ip:t,port:s})}addPrinter(t,s,n){return this.http.post(`${this.networkPrinterUrl}/printers/add`,{name:t,ip:s,port:n})}removePrinter(t){return this.http.delete(`${this.networkPrinterUrl}/printers/${t}`)}getPrintLogs(t=100){return this.http.get(`${this.networkPrinterUrl}/logs?limit=${t}`)}clearLogs(){return this.http.delete(`${this.networkPrinterUrl}/logs`)}getQueueStats(){return this.http.get(`${this.networkPrinterUrl}/queue/stats`)}discoverUSBPrinters(){return this.http.post(`${this.networkPrinterUrl}/printers/usb/discover`,{})}static \u0275fac=function(s){return new(s||a)};static \u0275prov=m({token:a,factory:a.\u0275fac,providedIn:"root"})};var R=class a{http=l(f);storeStore=l(d);networkPrinterService=l(g);apiUrl=`${I.apiUrl}/print-jobs`;COMMANDS={INIT:"\x1B@",ALIGN_CENTER:"\x1Ba",ALIGN_LEFT:"\x1Ba\0",TEXT_DOUBLE_SIZE:"\x1B!0",TEXT_NORMAL:"\x1B!\0",BOLD_ON:"\x1BE",BOLD_OFF:"\x1BE\0",FEED_LINE:`
`,CUT_PAPER:"V\0"};getPrintJobs(t,s){let n=v({store:t,populate:"order,station"},s);return this.http.get(this.apiUrl,{params:n})}getPrintJobById(t){return this.http.get(`${this.apiUrl}/${t}`)}getPrintJobStats(t){return this.http.get(`${this.apiUrl}/stats`,{params:{store:t}})}retryPrintJob(t){return this.http.post(`${this.apiUrl}/${t}/retry`,{})}cancelPrintJob(t){return this.http.post(`${this.apiUrl}/${t}/cancel`,{})}createPrintJobsForOrder(t){return this.http.post(`${this.apiUrl}/create-for-order`,{orderData:t})}printOrder(t){return this.http.post(`${this.apiUrl}/print-order`,{orderId:t})}generateOrderReceipt(t,s=80){if(console.log("=== GENERATE RECEIPT ==="),console.log("Order ID:",t._id),console.log("Order Reference:",t.reference),console.log("Order cart products:",t.cart?.products?.length||0),console.log("Paper Width:",s,"mm"),!t)return console.error("\u274C No order provided"),this.COMMANDS.INIT+`ERROR: No order data
`+this.COMMANDS.CUT_PAPER;let n=this.storeStore.selectedStore()?.posSettings?.receiptSettings,O=n?.showNote??!1,u=n?.showTax??!0,N=n?.showStoreDetails??!0,x=n?.showSellerInfo??!0,L=n?.showCustomerName??!0,P=n?.footerMessage||"Thank you for your patronage",E=n?.disclaimer||"",e="";if(e+=this.COMMANDS.INIT,N){e+=this.COMMANDS.ALIGN_CENTER,e+=this.COMMANDS.TEXT_DOUBLE_SIZE,e+=this.COMMANDS.BOLD_ON;let r=t.store;if(r&&r.name){let b=n?.useCustomBusinessName&&n?.businessName?n.businessName:r.name;e+=`${b}
`}e+=`KITCHEN ORDER
`,e+=this.COMMANDS.BOLD_OFF,e+=this.COMMANDS.TEXT_NORMAL}if(e+=this.COMMANDS.ALIGN_LEFT,e+=this.generateSeparator(s),e+=this.COMMANDS.BOLD_ON,e+=`Order: #${t.reference||t._id}
`,e+=this.COMMANDS.BOLD_OFF,e+=`Time: ${this.formatDate(t.createdAt||new Date)}
`,t.type&&(e+=`Type: ${t.type}
`),t.salesChannel&&(e+=`Channel: ${t.salesChannel}
`),t.table){let r=t.table;e+=`Table: ${r.number||r.name||r}
`}if(L&&t.guest){let r=t.guest;r.name&&(e+=`Guest: ${r.name}
`),r.room&&(e+=`Room: ${r.room}
`)}if(x&&t.staff){let r=t.staff,b=r.name||r.firstName||r;e+=`Server: ${b}
`}e+=this.generateSeparator(s);let C=t.cart?.products||[],i=this.storeStore.selectedStore()?.currencyCode||"NGN";C.length>0?(e+=this.COMMANDS.BOLD_ON,e+=`ITEMS:
`,e+=this.COMMANDS.BOLD_OFF,C.forEach(r=>{let b=r.name,_=r.quantity||1,A=r.price||0;e+=`${_}x ${b}`,A>0&&(e+=` - ${this.formatCurrency(A,i)}`),e+=`
`,r.options&&Array.isArray(r.options)&&r.options.length>0&&r.options.forEach(o=>{if(o.options&&Array.isArray(o.options))o.options.forEach(c=>{if(c.selected){let h=c.quantity||1,p=c.price||0;e+=`   + ${h}x ${c.name}`,p>0&&(e+=` (${this.formatCurrency(p,i)})`),e+=`
`}});else{let c=o.optionItemName||o.name||o,h=o.quantity||1,p=o.price||0;h>1?e+=`   + ${h}x ${c}`:e+=`   + ${c}`,p>0&&(e+=` (${this.formatCurrency(p,i)})`),e+=`
`}}),r.notes&&(e+=`   Note: ${r.notes}
`),e+=`
`})):e+=`No items in order
`,e+=this.generateSeparator(s);let $=t.subTotal||t.subtotal,S=t.tax,D=t.discount,y=t.shippingFee,M=t.serviceFee,T=t.total;return e+=this.COMMANDS.BOLD_ON,e+=`ORDER SUMMARY:
`,e+=this.COMMANDS.BOLD_OFF,$!==void 0&&(e+=`Subtotal:            ${this.formatCurrency($,i)}
`),u&&S&&S>0&&(e+=`Tax:                 ${this.formatCurrency(S,i)}
`),D&&D>0&&(e+=`Discount:           -${this.formatCurrency(D,i)}
`),y&&y>0&&(e+=`Shipping:            ${this.formatCurrency(y,i)}
`),M&&M>0&&(e+=`Service Fee:         ${this.formatCurrency(M,i)}
`),T!==void 0&&(e+=`--------------------------------
`,e+=this.COMMANDS.BOLD_ON,e+=`TOTAL:               ${this.formatCurrency(T,i)}
`,e+=this.COMMANDS.BOLD_OFF),t.payment&&(e+=`Payment: ${t.payment}
`),t.paymentStatus&&(e+=`Status: ${t.paymentStatus}
`),e+=this.generateSeparator(s),O&&(t.note||t.orderInstruction)&&(e+=this.COMMANDS.BOLD_ON,e+=`NOTES:
`,e+=this.COMMANDS.BOLD_OFF,e+=`${t.note||t.orderInstruction}
`,e+=this.generateSeparator(s)),e+=this.COMMANDS.ALIGN_CENTER,P&&(e+=`${P}
`),E&&(e+=this.COMMANDS.TEXT_NORMAL,e+=`${E}
`),e+=this.COMMANDS.TEXT_NORMAL,e+=`Order: ${t.reference||t._id.substring(t._id.length-6)}
`,e+=this.COMMANDS.FEED_LINE,e+=this.COMMANDS.FEED_LINE,e+=this.COMMANDS.CUT_PAPER,console.log("=== RECEIPT GENERATED ==="),e}formatCurrency(t,s){let n=t.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});return`${s} ${n}`}formatDate(t){return t?new Date(t).toLocaleString():"-"}sendToNetworkPrinter(t,s){try{this.networkPrinterService.sendToPrinter(t,void 0,s?._id,s?.reference).subscribe({next:n=>{console.log("\u2705 [NETWORK PRINTER] Print job sent successfully:",n)},error:n=>{console.warn("\u26A0\uFE0F [NETWORK PRINTER] Failed to send to network printer:",n.message)}})}catch(n){console.warn("\u26A0\uFE0F [NETWORK PRINTER] Error preparing print job:",n.message)}}generateSeparator(t=80){let s=t===58?31:42;return"=".repeat(s)+`
`}static \u0275fac=function(s){return new(s||a)};static \u0275prov=m({token:a,factory:a.\u0275fac,providedIn:"root"})};export{R as a};

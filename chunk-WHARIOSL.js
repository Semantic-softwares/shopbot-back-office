import{aa as A}from"./chunk-P5WOETP4.js";import{g as h}from"./chunk-GAL4ENT6.js";var N=class C{connectedPrinter=null;PRINTER_SERVICE_UUID="000018f0-0000-1000-8000-00805f9b34fb";PRINTER_CHARACTERISTIC_UUID="00002af1-0000-1000-8000-00805f9b34fb";ESC="\x1B";GS="";LF=`
`;CR="\r";FF="\f";COMMANDS={INIT:"\x1B@",RESET:"\x1B@",FEED_LINE:`
`,CUT_PAPER:"V\0",ALIGN_LEFT:"\x1Ba\0",ALIGN_CENTER:"\x1Ba",ALIGN_RIGHT:"\x1Ba",TEXT_NORMAL:"\x1B!\0",TEXT_DOUBLE_HEIGHT:"\x1B!",TEXT_DOUBLE_WIDTH:"\x1B! ",TEXT_DOUBLE_SIZE:"\x1B!0",BOLD_ON:"\x1BE",BOLD_OFF:"\x1BE\0",UNDERLINE_ON:"\x1B-",UNDERLINE_OFF:"\x1B-\0",CHAR_SPACING_0:"\x1B \0",CHAR_SPACING_1:"\x1B ",CHAR_SPACING_TIGHT:"\x1B \0",CHAR_SPACING_NORMAL:"\x1B ",CHAR_SPACING_WIDE:"\x1B ",LINE_SPACING_DEFAULT:"\x1B2",LINE_SPACING_NARROW:"\x1B3",LINE_SPACING_WIDE:"\x1B3 ",CHAR_DENSITY_HIGH:"\x1B!",CHAR_DENSITY_NORMAL:"\x1B!\0",CHAR_WIDTH_COMPRESSED:"",CHAR_WIDTH_NORMAL:"",LOGO_COMMAND:"p\0",IMAGE_MODE:"\x1B*!",QUALITY_DRAFT:"\x1Bx\0",QUALITY_NORMAL:"\x1Bx",QUALITY_HIGH:"\x1Bx",FONT_SIZE_SMALL:"\x1B!",FONT_SIZE_MEDIUM:"\x1B!\0",FONT_SIZE_LARGE:"\x1B!",FONT_SIZE_EXTRA_LARGE:"\x1B!3"};PAPER_CONFIGS={"58mm":{width:38,maxChars:{small:42,medium:38,large:30,extraLarge:22}},"80mm":{width:64,maxChars:{small:72,medium:64,large:48,extraLarge:32}},"112mm":{width:90,maxChars:{small:100,medium:90,large:72,extraLarge:56}}};constructor(){this.restoreConnectionState()}isBluetoothSupported(){return"bluetooth"in navigator}isConnected(){return this.connectedPrinter!==null&&this.connectedPrinter.server!==void 0&&this.connectedPrinter.server.connected}getConnectedPrinter(){return this.isConnected()?this.connectedPrinter:null}saveConnectionState(){this.connectedPrinter?.device&&(localStorage.setItem("bluetoothPrinterConnected","true"),localStorage.setItem("bluetoothPrinterName",this.connectedPrinter.device.name||"Unknown"),localStorage.setItem("bluetoothPrinterId",this.connectedPrinter.device.id))}restoreConnectionState(){if(localStorage.getItem("bluetoothPrinterConnected")==="true"){let r=localStorage.getItem("bluetoothPrinterName");console.log(`Previous Bluetooth printer connection detected: ${r}`),console.log("Note: Reconnection requires user interaction due to Web Bluetooth security")}}clearConnectionState(){localStorage.removeItem("bluetoothPrinterConnected"),localStorage.removeItem("bluetoothPrinterName"),localStorage.removeItem("bluetoothPrinterId")}connectToPrinter(){return h(this,null,function*(){if(!this.isBluetoothSupported())throw new Error("Web Bluetooth is not supported in this browser");try{console.log("Requesting Bluetooth device...");let t=yield navigator.bluetooth.requestDevice({filters:[{services:[this.PRINTER_SERVICE_UUID]},{namePrefix:"POS"},{namePrefix:"Printer"},{namePrefix:"EPSON"},{namePrefix:"STAR"},{namePrefix:"Citizen"}],optionalServices:[this.PRINTER_SERVICE_UUID,"000018f0-0000-1000-8000-00805f9b34fb","0000ff00-0000-1000-8000-00805f9b34fb"]});console.log("Connecting to GATT server...");let r=yield t.gatt.connect();console.log("Getting printer service...");let i;try{i=yield r.getPrimaryService(this.PRINTER_SERVICE_UUID)}catch{let o=yield r.getPrimaryServices();if(o.length>0)i=o[0];else throw new Error("No compatible printer service found")}console.log("Getting printer characteristic...");let e;try{e=yield i.getCharacteristic(this.PRINTER_CHARACTERISTIC_UUID)}catch{let a=(yield i.getCharacteristics()).find(m=>m.properties.write||m.properties.writeWithoutResponse);if(!a)throw new Error("No writable characteristic found");e=a}return this.connectedPrinter={device:t,server:r,service:i,characteristic:e,isConnected:!0},this.saveConnectionState(),t.addEventListener("gattserverdisconnected",()=>{console.log("Printer disconnected"),this.clearConnectionState(),this.connectedPrinter&&(this.connectedPrinter.isConnected=!1)}),console.log("Successfully connected to printer:",t.name),this.connectedPrinter}catch(t){throw console.error("Error connecting to printer:",t),new Error(`Failed to connect to printer: ${t}`)}})}disconnectPrinter(){return h(this,null,function*(){this.connectedPrinter?.server&&(this.connectedPrinter.server.disconnect(),this.connectedPrinter.isConnected=!1,this.connectedPrinter=null,this.clearConnectionState(),console.log("Disconnected from printer"))})}sendToPrinter(t){return h(this,null,function*(){if(!this.connectedPrinter?.characteristic)throw new Error("Printer not connected");try{let r;typeof t=="string"?r=new TextEncoder().encode(t).buffer:r=t.buffer;let i=20,e=[];for(let n=0;n<r.byteLength;n+=i)e.push(r.slice(n,n+i));for(let n of e)yield this.connectedPrinter.characteristic.writeValue(n),yield this.delay(10)}catch(r){throw console.error("Error sending data to printer:",r),new Error(`Failed to send data to printer: ${r}`)}})}delay(t){return new Promise(r=>setTimeout(r,t))}getPaperWidth(t){let r=t?.paperSize||"80mm";return this.PAPER_CONFIGS[r].width}getFontSizeCategory(t){let r=t?.fontSize||12;return r<=10?"small":r<=14?"medium":r<=18?"large":"extraLarge"}getMaxCharsPerLine(t){let r=t?.paperSize||"80mm",i=this.getFontSizeCategory(t);return this.PAPER_CONFIGS[r].maxChars[i]}getPrintQualityCommand(t){switch(t?.printQuality||"normal"){case"draft":return this.COMMANDS.QUALITY_DRAFT;case"high":return this.COMMANDS.QUALITY_HIGH;case"normal":default:return this.COMMANDS.QUALITY_NORMAL}}getFontSizeCommand(t){let r=t?.fontSize||12,i=t?.paperSize||"80mm";return i==="58mm"?r<=8?this.COMMANDS.FONT_SIZE_SMALL:r<=12?this.COMMANDS.TEXT_NORMAL:r<=16?this.COMMANDS.FONT_SIZE_MEDIUM:this.COMMANDS.FONT_SIZE_LARGE:i==="80mm"?r<=10?this.COMMANDS.FONT_SIZE_SMALL:r<=14?this.COMMANDS.FONT_SIZE_MEDIUM:r<=18?this.COMMANDS.FONT_SIZE_LARGE:this.COMMANDS.FONT_SIZE_EXTRA_LARGE:r<=12?this.COMMANDS.FONT_SIZE_MEDIUM:r<=16?this.COMMANDS.FONT_SIZE_LARGE:this.COMMANDS.FONT_SIZE_EXTRA_LARGE}getLineSpacingCommand(t){let r=t?.lineSpacing||1.2;return r<=1?this.COMMANDS.LINE_SPACING_NARROW:r>=2?this.COMMANDS.LINE_SPACING_WIDE:this.COMMANDS.LINE_SPACING_DEFAULT}getCharacterOptimizationCommands(t){let r=t?.paperSize||"80mm",i="";return r==="58mm"?(i+=this.COMMANDS.CHAR_WIDTH_COMPRESSED,i+=this.COMMANDS.CHAR_SPACING_TIGHT,i+=this.COMMANDS.CHAR_DENSITY_HIGH):r==="80mm"?(i+=this.COMMANDS.CHAR_WIDTH_NORMAL,i+=this.COMMANDS.CHAR_SPACING_NORMAL,i+=this.COMMANDS.CHAR_DENSITY_NORMAL):(i+=this.COMMANDS.CHAR_WIDTH_NORMAL,i+=this.COMMANDS.CHAR_SPACING_WIDE,i+=this.COMMANDS.CHAR_DENSITY_NORMAL),i}formatText(t,r){let i=this.getMaxCharsPerLine(r);if(t.length<=i)return t;let e=t.split(" "),n=[],o="";for(let a of e)(o+" "+a).length<=i?o+=(o?" ":"")+a:(o&&n.push(o),o=a);return o&&n.push(o),n.join(`
`)}centerText(t,r){let i=this.getMaxCharsPerLine(r),e=Math.max(0,Math.floor((i-t.length)/2));return" ".repeat(e)+t}rightAlignText(t,r){let i=this.getMaxCharsPerLine(r),e=Math.max(0,i-t.length);return" ".repeat(e)+t}justifyLine(t,r,i){let e=this.getMaxCharsPerLine(i),n=t.length+r.length;if(n>=e)return t+" "+r;let o=e-n;return t+" ".repeat(o)+r}getSeparatorLine(t,r="-"){let i=this.getMaxCharsPerLine(t);return r.repeat(i)}generateReservationReceipt(t,r,i){let e="";if(e+=this.COMMANDS.INIT,e+=this.getCharacterOptimizationCommands(i),e+=this.getPrintQualityCommand(i),e+=this.getLineSpacingCommand(i),e+=this.getFontSizeCommand(i),i?.headerText&&(e+=this.COMMANDS.ALIGN_CENTER,e+=this.COMMANDS.BOLD_ON,e+=this.centerText(i.headerText,i)+`
`,e+=this.COMMANDS.BOLD_OFF,e+=`
`),i?.includeLogo)try{e+=this.COMMANDS.ALIGN_CENTER,e+=this.COMMANDS.LOGO_COMMAND,e+=`

`}catch{e+=this.createTextLogo(r?.name||"HOTEL",i),e+=`
`}i?.includeLogo||(e+=this.COMMANDS.ALIGN_CENTER,e+=this.COMMANDS.TEXT_DOUBLE_SIZE,e+=this.COMMANDS.BOLD_ON,e+=this.centerText(r?.name||"HOTEL NAME",i)+`
`,e+=this.COMMANDS.BOLD_OFF,e+=this.COMMANDS.TEXT_NORMAL,e+=this.getCharacterOptimizationCommands(i),e+=this.getFontSizeCommand(i)),r?.contactInfo?.address&&(e+=this.centerText(this.formatText(r.contactInfo.address,i),i)+`
`),r?.contactInfo?.phone&&(e+=this.centerText(`Tel: ${r.contactInfo.phone}`,i)+`
`),r?.contactInfo?.email&&(e+=this.centerText(r.contactInfo.email,i)+`
`),e+=`
`,e+=this.getSeparatorLine(i)+`
`,e+=this.COMMANDS.ALIGN_CENTER,e+=this.COMMANDS.TEXT_DOUBLE_HEIGHT,e+=this.COMMANDS.BOLD_ON,e+=this.centerText("RESERVATION DETAILS",i)+`
`,e+=this.COMMANDS.BOLD_OFF,e+=this.COMMANDS.TEXT_NORMAL,e+=this.getCharacterOptimizationCommands(i),e+=this.getFontSizeCommand(i),e+=this.getSeparatorLine(i)+`
`,e+=this.COMMANDS.ALIGN_LEFT,e+=this.COMMANDS.BOLD_ON,e+=this.justifyLine("Confirmation:",t.confirmationNumber||"N/A",i)+`
`,e+=this.COMMANDS.BOLD_OFF,e+=this.justifyLine("Status:",(t.status||"unknown").toUpperCase(),i)+`
`,e+=this.justifyLine("Booking Date:",this.formatDate(t.createdAt),i)+`
`,e+=`
`,e+=this.COMMANDS.BOLD_ON,e+=`GUEST INFORMATION
`,e+=this.COMMANDS.BOLD_OFF,e+=this.getSeparatorLine(i,"-")+`
`;let n=typeof t.guest=="object"?t.guest:null,o=n?.firstName&&n?.lastName?`${n.firstName} ${n.lastName}`:"Guest";e+=this.justifyLine("Name:",o,i)+`
`,n?.email&&(e+=`Email: ${n.email}
`),n?.phone&&(e+=`Phone: ${n.phone}
`);let a=t.additionalGuests?.length||1;if(e+=this.justifyLine("Occupancy:",`${a} Adults, 0 Children`,i)+`
`,e+=`
`,e+=this.COMMANDS.BOLD_ON,e+=`STAY INFORMATION
`,e+=this.COMMANDS.BOLD_OFF,e+=this.getSeparatorLine(i,"-")+`
`,e+=this.justifyLine("Check-in:",this.formatDate(t.checkInDate),i)+`
`,e+=this.justifyLine("Check-out:",this.formatDate(t.checkOutDate),i)+`
`,e+=this.justifyLine("Nights:",(t.numberOfNights||1).toString(),i)+`
`,t.expectedCheckInTime&&(e+=this.justifyLine("Check-in Time:",t.expectedCheckInTime,i)+`
`),t.expectedCheckOutTime&&(e+=this.justifyLine("Check-out Time:",t.expectedCheckOutTime,i)+`
`),e+=`
`,e+=this.COMMANDS.BOLD_ON,e+=`ROOM DETAILS
`,e+=this.COMMANDS.BOLD_OFF,e+=this.getSeparatorLine(i,"-")+`
`,t.rooms&&t.rooms.length>0&&t.rooms.forEach((s,u)=>{let c=s.room||{},d=c.roomNumber||`Room ${u+1}`,l=typeof c.roomType=="object"?c.roomType?.name:c.roomType||"Standard",S=c.priceOverride||c.rate||0;e+=`${d} (${c.name||l})
`,e+=this.justifyLine("Type:",l,i)+`
`,e+=this.justifyLine("Rate/Night:",this.formatCurrency(S,r?.currency),i)+`
`,s.guests&&(e+=this.justifyLine("Guests:",`${s.guests.adults||1}A, ${s.guests.children||0}C`,i)+`
`),u<t.rooms.length-1&&(e+=`
`)}),e+=`
`,e+=this.COMMANDS.BOLD_ON,e+=`PRICING SUMMARY
`,e+=this.COMMANDS.BOLD_OFF,e+=this.getSeparatorLine(i,"=")+`
`,t.pricing){t.pricing.subtotal&&(e+=this.justifyLine("Subtotal:",this.formatCurrency(t.pricing.subtotal,r?.currency),i)+`
`),t.pricing.taxes&&(e+=this.justifyLine("Taxes:",this.formatCurrency(t.pricing.taxes,r?.currency),i)+`
`),t.pricing.fees&&Object.entries(t.pricing.fees).forEach(([d,l])=>{if(l){let S=d.replace(/([A-Z])/g," $1").replace(/^./,O=>O.toUpperCase());e+=this.justifyLine(S+":",this.formatCurrency(l,r?.currency),i)+`
`}}),t.pricing.discounts&&(e+=this.justifyLine("Discount:","-"+this.formatCurrency(t.pricing.discounts,r?.currency),i)+`
`),e+=this.getSeparatorLine(i,"-")+`
`,e+=this.COMMANDS.TEXT_DOUBLE_HEIGHT,e+=this.COMMANDS.BOLD_ON,e+=this.justifyLine("TOTAL:",this.formatCurrency(t.pricing.total||0,r?.currency),i)+`
`,e+=this.COMMANDS.BOLD_OFF,e+=this.COMMANDS.TEXT_NORMAL,e+=this.getCharacterOptimizationCommands(i),e+=this.getFontSizeCommand(i),e+=this.justifyLine("Paid:",this.formatCurrency(t.pricing.paid||0,r?.currency),i)+`
`;let s=t.pricing.balance||0,u=s>0?"BALANCE DUE:":"OVERPAID:",c=Math.abs(s);s!==0&&(e+=this.COMMANDS.BOLD_ON,e+=this.justifyLine(u,this.formatCurrency(c,r?.currency),i)+`
`,e+=this.COMMANDS.BOLD_OFF)}return e+=`
`,t.paymentInfo&&(e+=this.COMMANDS.BOLD_ON,e+=`PAYMENT INFORMATION
`,e+=this.COMMANDS.BOLD_OFF,e+=this.getSeparatorLine(i,"-")+`
`,e+=this.justifyLine("Method:",(t.paymentInfo.method||"N/A").toUpperCase(),i)+`
`,e+=this.justifyLine("Status:",(t.paymentInfo.status||"pending").toUpperCase(),i)+`
`,e+=`
`),t.specialRequests&&(e+=this.COMMANDS.BOLD_ON,e+=`SPECIAL REQUESTS
`,e+=this.COMMANDS.BOLD_OFF,e+=this.getSeparatorLine(i,"-")+`
`,e+=this.formatText(t.specialRequests,i)+`
`,e+=`
`),e+=this.getSeparatorLine(i,"=")+`
`,e+=this.COMMANDS.ALIGN_CENTER,(i?.footerText||`Thank you for choosing us!
Have a pleasant stay`).split(`
`).forEach(s=>{e+=this.centerText(s.trim(),i)+`
`}),e+=`
`,e+=this.centerText("Printed: "+this.formatDateTime(new Date),i)+`
`,e+=`

`,i?.autocut!==!1&&(e+=this.COMMANDS.CUT_PAPER),e}formatDate(t){return t?new Date(t).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"N/A"}formatDateTime(t){return t?new Date(t).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"N/A"}formatCurrency(t,r="USD"){try{return new Intl.NumberFormat("en-US",{style:"currency",currency:r}).format(t)}catch{return`${r} ${t.toFixed(2)}`}}printReservation(t,r,i){return h(this,null,function*(){this.isConnected()||(yield this.connectToPrinter());try{let e=this.generateReservationReceipt(t,r,i);yield this.sendToPrinter(e),console.log("Reservation printed successfully")}catch(e){throw console.error("Error printing reservation:",e),new Error(`Failed to print reservation: ${e}`)}})}testPrint(t){return h(this,null,function*(){this.isConnected()||(yield this.connectToPrinter());try{let r="";r+=this.COMMANDS.INIT,r+=this.getCharacterOptimizationCommands(t),r+=this.getPrintQualityCommand(t),r+=this.getLineSpacingCommand(t),r+=this.getFontSizeCommand(t),r+=this.COMMANDS.ALIGN_CENTER,r+=this.COMMANDS.TEXT_DOUBLE_SIZE,r+=this.COMMANDS.BOLD_ON,r+=this.centerText("TEST PRINT",t)+`
`,r+=this.COMMANDS.BOLD_OFF,r+=this.COMMANDS.TEXT_NORMAL,r+=this.getCharacterOptimizationCommands(t),r+=this.getFontSizeCommand(t),r+=this.getSeparatorLine(t)+`
`,r+=this.centerText("Printer is working correctly",t)+`
`,r+=this.centerText(`Paper Size: ${t?.paperSize||"80mm"}`,t)+`
`,r+=this.centerText(`Print Quality: ${t?.printQuality||"normal"}`,t)+`
`,r+=this.centerText(`Font Size: ${t?.fontSize||12}px`,t)+`
`,r+=this.centerText(`Max Chars: ${this.getMaxCharsPerLine(t)}`,t)+`
`,r+=this.centerText(`Logo Enabled: ${t?.includeLogo?"Yes":"No"}`,t)+`
`,r+=this.centerText(new Date().toLocaleString(),t)+`
`,r+=`

`,t?.autocut!==!1&&(r+=this.COMMANDS.CUT_PAPER),yield this.sendToPrinter(r),console.log("Test print completed successfully")}catch(r){throw console.error("Error during test print:",r),new Error(`Test print failed: ${r}`)}})}getConnectedDeviceInfo(){return this.connectedPrinter?.device?{name:this.connectedPrinter.device.name||"Unknown Printer",id:this.connectedPrinter.device.id}:null}createTextLogo(t,r){if(!t)return"";let i="";i+=this.COMMANDS.ALIGN_CENTER,i+=this.COMMANDS.TEXT_DOUBLE_SIZE,i+=this.COMMANDS.BOLD_ON;let e=this.getMaxCharsPerLine(r),n=Math.min(t.length+4,e),o="=".repeat(n);return i+=this.centerText(o,r)+`
`,i+=this.centerText(`  ${t}  `,r)+`
`,i+=this.centerText(o,r)+`
`,i+=this.COMMANDS.BOLD_OFF,i+=this.COMMANDS.TEXT_NORMAL,i+=this.getCharacterOptimizationCommands(r),i+=this.getFontSizeCommand(r),i}uploadLogo(t){return h(this,null,function*(){if(!this.isConnected())throw new Error("Printer not connected");try{let r;if(typeof t=="string"){let e=t.replace(/^data:image\/[a-z]+;base64,/,""),n=atob(e);r=new Uint8Array(n.length);for(let o=0;o<n.length;o++)r[o]=n.charCodeAt(o)}else r=new Uint8Array(t);let i=new Uint8Array([28,113,1,...r]);yield this.sendToPrinter(i),console.log("Logo uploaded to printer successfully")}catch(r){throw console.error("Error uploading logo:",r),new Error(`Failed to upload logo: ${r}`)}})}testPaperUtilization(t){return h(this,null,function*(){this.isConnected()||(yield this.connectToPrinter());try{let r=this.getMaxCharsPerLine(t),i=t?.paperSize||"80mm",e="";e+=this.COMMANDS.INIT,e+=this.getCharacterOptimizationCommands(t),e+=this.getFontSizeCommand(t),e+=this.COMMANDS.ALIGN_CENTER,e+=this.COMMANDS.BOLD_ON,e+=this.centerText("PAPER UTILIZATION TEST",t)+`
`,e+=this.COMMANDS.BOLD_OFF,e+=this.getSeparatorLine(t)+`
`,e+=this.COMMANDS.ALIGN_LEFT,e+=`Paper Size: ${i}
`,e+=`Max Chars: ${r}
`,e+=`Font Size: ${t?.fontSize||12}px
`,e+=`
`,e+=`Full width test:
`,e+="|"+"=".repeat(r-2)+`|
`,e+="|"+" ".repeat(r-2)+`|
`,e+="|"+"1234567890".repeat(Math.floor((r-2)/10))+"123456789".substring(0,(r-2)%10)+`|
`,e+="|"+"=".repeat(r-2)+`|
`,e+=`
`,e+=`Character density test:
`;for(let o=1;o<=5;o++){let a=Math.floor(r*o/5);e+=`${o}/5: ${"#".repeat(a)}
`}e+=`
`,e+=`Optimal for 58mm: 4/5 density
`;let n=Math.floor(r*4/5);e+=`Recommended: ${"*".repeat(n)}
`,e+=`

`,t?.autocut!==!1&&(e+=this.COMMANDS.CUT_PAPER),yield this.sendToPrinter(e),console.log("Paper utilization test completed")}catch(r){throw console.error("Error during paper utilization test:",r),new Error(`Paper utilization test failed: ${r}`)}})}static \u0275fac=function(r){return new(r||C)};static \u0275prov=A({token:C,factory:C.\u0275fac,providedIn:"root"})};export{N as a};

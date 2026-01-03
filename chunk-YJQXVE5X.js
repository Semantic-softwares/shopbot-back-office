import{$ as O}from"./chunk-IQSYHSID.js";import{f as c}from"./chunk-EQDQRRRY.js";var N=class C{connectedPrinter=null;PRINTER_SERVICE_UUID="000018f0-0000-1000-8000-00805f9b34fb";PRINTER_CHARACTERISTIC_UUID="00002af1-0000-1000-8000-00805f9b34fb";ESC="\x1B";GS="";LF=`
`;CR="\r";FF="\f";COMMANDS={INIT:"\x1B@",RESET:"\x1B@",FEED_LINE:`
`,CUT_PAPER:"V\0",ALIGN_LEFT:"\x1Ba\0",ALIGN_CENTER:"\x1Ba",ALIGN_RIGHT:"\x1Ba",TEXT_NORMAL:"\x1B!\0",TEXT_DOUBLE_HEIGHT:"\x1B!",TEXT_DOUBLE_WIDTH:"\x1B! ",TEXT_DOUBLE_SIZE:"\x1B!0",BOLD_ON:"\x1BE",BOLD_OFF:"\x1BE\0",UNDERLINE_ON:"\x1B-",UNDERLINE_OFF:"\x1B-\0",CHAR_SPACING_0:"\x1B \0",CHAR_SPACING_1:"\x1B ",CHAR_SPACING_TIGHT:"\x1B \0",CHAR_SPACING_NORMAL:"\x1B ",CHAR_SPACING_WIDE:"\x1B ",LINE_SPACING_DEFAULT:"\x1B2",LINE_SPACING_NARROW:"\x1B3",LINE_SPACING_WIDE:"\x1B3 ",CHAR_DENSITY_HIGH:"\x1B!",CHAR_DENSITY_NORMAL:"\x1B!\0",CHAR_WIDTH_COMPRESSED:"",CHAR_WIDTH_NORMAL:"",LOGO_COMMAND:"p\0",IMAGE_MODE:"\x1B*!",QUALITY_DRAFT:"\x1Bx\0",QUALITY_NORMAL:"\x1Bx",QUALITY_HIGH:"\x1Bx",FONT_SIZE_SMALL:"\x1B!",FONT_SIZE_MEDIUM:"\x1B!\0",FONT_SIZE_LARGE:"\x1B!",FONT_SIZE_EXTRA_LARGE:"\x1B!3"};PAPER_CONFIGS={"58mm":{width:38,maxChars:{small:42,medium:38,large:30,extraLarge:22}},"80mm":{width:64,maxChars:{small:72,medium:64,large:48,extraLarge:32}},"112mm":{width:90,maxChars:{small:100,medium:90,large:72,extraLarge:56}}};constructor(){}isBluetoothSupported(){return"bluetooth"in navigator}connectToPrinter(){return c(this,null,function*(){if(!this.isBluetoothSupported())throw new Error("Web Bluetooth is not supported in this browser");try{console.log("Requesting Bluetooth device...");let e=yield navigator.bluetooth.requestDevice({filters:[{services:[this.PRINTER_SERVICE_UUID]},{namePrefix:"POS"},{namePrefix:"Printer"},{namePrefix:"EPSON"},{namePrefix:"STAR"},{namePrefix:"Citizen"}],optionalServices:[this.PRINTER_SERVICE_UUID,"000018f0-0000-1000-8000-00805f9b34fb","0000ff00-0000-1000-8000-00805f9b34fb"]});console.log("Connecting to GATT server...");let r=yield e.gatt.connect();console.log("Getting printer service...");let i;try{i=yield r.getPrimaryService(this.PRINTER_SERVICE_UUID)}catch{let s=yield r.getPrimaryServices();if(s.length>0)i=s[0];else throw new Error("No compatible printer service found")}console.log("Getting printer characteristic...");let t;try{t=yield i.getCharacteristic(this.PRINTER_CHARACTERISTIC_UUID)}catch{let o=(yield i.getCharacteristics()).find(m=>m.properties.write||m.properties.writeWithoutResponse);if(!o)throw new Error("No writable characteristic found");t=o}return this.connectedPrinter={device:e,server:r,service:i,characteristic:t,isConnected:!0},console.log("Successfully connected to printer:",e.name),this.connectedPrinter}catch(e){throw console.error("Error connecting to printer:",e),new Error(`Failed to connect to printer: ${e}`)}})}disconnectPrinter(){return c(this,null,function*(){this.connectedPrinter?.server&&(this.connectedPrinter.server.disconnect(),this.connectedPrinter.isConnected=!1,this.connectedPrinter=null,console.log("Disconnected from printer"))})}isConnected(){return this.connectedPrinter?.isConnected||!1}sendToPrinter(e){return c(this,null,function*(){if(!this.connectedPrinter?.characteristic)throw new Error("Printer not connected");try{let r;typeof e=="string"?r=new TextEncoder().encode(e).buffer:r=e.buffer;let i=20,t=[];for(let n=0;n<r.byteLength;n+=i)t.push(r.slice(n,n+i));for(let n of t)yield this.connectedPrinter.characteristic.writeValue(n),yield this.delay(10)}catch(r){throw console.error("Error sending data to printer:",r),new Error(`Failed to send data to printer: ${r}`)}})}delay(e){return new Promise(r=>setTimeout(r,e))}getPaperWidth(e){let r=e?.paperSize||"80mm";return this.PAPER_CONFIGS[r].width}getFontSizeCategory(e){let r=e?.fontSize||12;return r<=10?"small":r<=14?"medium":r<=18?"large":"extraLarge"}getMaxCharsPerLine(e){let r=e?.paperSize||"80mm",i=this.getFontSizeCategory(e);return this.PAPER_CONFIGS[r].maxChars[i]}getPrintQualityCommand(e){switch(e?.printQuality||"normal"){case"draft":return this.COMMANDS.QUALITY_DRAFT;case"high":return this.COMMANDS.QUALITY_HIGH;case"normal":default:return this.COMMANDS.QUALITY_NORMAL}}getFontSizeCommand(e){let r=e?.fontSize||12,i=e?.paperSize||"80mm";return i==="58mm"?r<=8?this.COMMANDS.FONT_SIZE_SMALL:r<=12?this.COMMANDS.TEXT_NORMAL:r<=16?this.COMMANDS.FONT_SIZE_MEDIUM:this.COMMANDS.FONT_SIZE_LARGE:i==="80mm"?r<=10?this.COMMANDS.FONT_SIZE_SMALL:r<=14?this.COMMANDS.FONT_SIZE_MEDIUM:r<=18?this.COMMANDS.FONT_SIZE_LARGE:this.COMMANDS.FONT_SIZE_EXTRA_LARGE:r<=12?this.COMMANDS.FONT_SIZE_MEDIUM:r<=16?this.COMMANDS.FONT_SIZE_LARGE:this.COMMANDS.FONT_SIZE_EXTRA_LARGE}getLineSpacingCommand(e){let r=e?.lineSpacing||1.2;return r<=1?this.COMMANDS.LINE_SPACING_NARROW:r>=2?this.COMMANDS.LINE_SPACING_WIDE:this.COMMANDS.LINE_SPACING_DEFAULT}getCharacterOptimizationCommands(e){let r=e?.paperSize||"80mm",i="";return r==="58mm"?(i+=this.COMMANDS.CHAR_WIDTH_COMPRESSED,i+=this.COMMANDS.CHAR_SPACING_TIGHT,i+=this.COMMANDS.CHAR_DENSITY_HIGH):r==="80mm"?(i+=this.COMMANDS.CHAR_WIDTH_NORMAL,i+=this.COMMANDS.CHAR_SPACING_NORMAL,i+=this.COMMANDS.CHAR_DENSITY_NORMAL):(i+=this.COMMANDS.CHAR_WIDTH_NORMAL,i+=this.COMMANDS.CHAR_SPACING_WIDE,i+=this.COMMANDS.CHAR_DENSITY_NORMAL),i}formatText(e,r){let i=this.getMaxCharsPerLine(r);if(e.length<=i)return e;let t=e.split(" "),n=[],s="";for(let o of t)(s+" "+o).length<=i?s+=(s?" ":"")+o:(s&&n.push(s),s=o);return s&&n.push(s),n.join(`
`)}centerText(e,r){let i=this.getMaxCharsPerLine(r),t=Math.max(0,Math.floor((i-e.length)/2));return" ".repeat(t)+e}rightAlignText(e,r){let i=this.getMaxCharsPerLine(r),t=Math.max(0,i-e.length);return" ".repeat(t)+e}justifyLine(e,r,i){let t=this.getMaxCharsPerLine(i),n=e.length+r.length;if(n>=t)return e+" "+r;let s=t-n;return e+" ".repeat(s)+r}getSeparatorLine(e,r="-"){let i=this.getMaxCharsPerLine(e);return r.repeat(i)}generateReservationReceipt(e,r,i){let t="";if(t+=this.COMMANDS.INIT,t+=this.getCharacterOptimizationCommands(i),t+=this.getPrintQualityCommand(i),t+=this.getLineSpacingCommand(i),t+=this.getFontSizeCommand(i),i?.headerText&&(t+=this.COMMANDS.ALIGN_CENTER,t+=this.COMMANDS.BOLD_ON,t+=this.centerText(i.headerText,i)+`
`,t+=this.COMMANDS.BOLD_OFF,t+=`
`),i?.includeLogo)try{t+=this.COMMANDS.ALIGN_CENTER,t+=this.COMMANDS.LOGO_COMMAND,t+=`

`}catch{t+=this.createTextLogo(r?.name||"HOTEL",i),t+=`
`}i?.includeLogo||(t+=this.COMMANDS.ALIGN_CENTER,t+=this.COMMANDS.TEXT_DOUBLE_SIZE,t+=this.COMMANDS.BOLD_ON,t+=this.centerText(r?.name||"HOTEL NAME",i)+`
`,t+=this.COMMANDS.BOLD_OFF,t+=this.COMMANDS.TEXT_NORMAL,t+=this.getCharacterOptimizationCommands(i),t+=this.getFontSizeCommand(i)),r?.contactInfo?.address&&(t+=this.centerText(this.formatText(r.contactInfo.address,i),i)+`
`),r?.contactInfo?.phone&&(t+=this.centerText(`Tel: ${r.contactInfo.phone}`,i)+`
`),r?.contactInfo?.email&&(t+=this.centerText(r.contactInfo.email,i)+`
`),t+=`
`,t+=this.getSeparatorLine(i)+`
`,t+=this.COMMANDS.ALIGN_CENTER,t+=this.COMMANDS.TEXT_DOUBLE_HEIGHT,t+=this.COMMANDS.BOLD_ON,t+=this.centerText("RESERVATION DETAILS",i)+`
`,t+=this.COMMANDS.BOLD_OFF,t+=this.COMMANDS.TEXT_NORMAL,t+=this.getCharacterOptimizationCommands(i),t+=this.getFontSizeCommand(i),t+=this.getSeparatorLine(i)+`
`,t+=this.COMMANDS.ALIGN_LEFT,t+=this.COMMANDS.BOLD_ON,t+=this.justifyLine("Confirmation:",e.confirmationNumber||"N/A",i)+`
`,t+=this.COMMANDS.BOLD_OFF,t+=this.justifyLine("Status:",(e.status||"unknown").toUpperCase(),i)+`
`,t+=this.justifyLine("Booking Date:",this.formatDate(e.createdAt),i)+`
`,t+=`
`,t+=this.COMMANDS.BOLD_ON,t+=`GUEST INFORMATION
`,t+=this.COMMANDS.BOLD_OFF,t+=this.getSeparatorLine(i,"-")+`
`;let n=typeof e.guest=="object"?e.guest:null,s=n?.firstName&&n?.lastName?`${n.firstName} ${n.lastName}`:"Guest";t+=this.justifyLine("Name:",s,i)+`
`,n?.email&&(t+=`Email: ${n.email}
`),n?.phone&&(t+=`Phone: ${n.phone}
`);let o=e.additionalGuests?.length||1;if(t+=this.justifyLine("Occupancy:",`${o} Adults, 0 Children`,i)+`
`,t+=`
`,t+=this.COMMANDS.BOLD_ON,t+=`STAY INFORMATION
`,t+=this.COMMANDS.BOLD_OFF,t+=this.getSeparatorLine(i,"-")+`
`,t+=this.justifyLine("Check-in:",this.formatDate(e.checkInDate),i)+`
`,t+=this.justifyLine("Check-out:",this.formatDate(e.checkOutDate),i)+`
`,t+=this.justifyLine("Nights:",(e.numberOfNights||1).toString(),i)+`
`,e.expectedCheckInTime&&(t+=this.justifyLine("Check-in Time:",e.expectedCheckInTime,i)+`
`),e.expectedCheckOutTime&&(t+=this.justifyLine("Check-out Time:",e.expectedCheckOutTime,i)+`
`),t+=`
`,t+=this.COMMANDS.BOLD_ON,t+=`ROOM DETAILS
`,t+=this.COMMANDS.BOLD_OFF,t+=this.getSeparatorLine(i,"-")+`
`,e.rooms&&e.rooms.length>0&&e.rooms.forEach((a,u)=>{let h=a.room||{},A=h.roomNumber||`Room ${u+1}`,l=typeof h.roomType=="object"?h.roomType?.name:h.roomType||"Standard",S=h.priceOverride||h.rate||0;t+=`${A} (${h.name||l})
`,t+=this.justifyLine("Type:",l,i)+`
`,t+=this.justifyLine("Rate/Night:",this.formatCurrency(S,r?.currency),i)+`
`,a.guests&&(t+=this.justifyLine("Guests:",`${a.guests.adults||1}A, ${a.guests.children||0}C`,i)+`
`),u<e.rooms.length-1&&(t+=`
`)}),t+=`
`,t+=this.COMMANDS.BOLD_ON,t+=`PRICING SUMMARY
`,t+=this.COMMANDS.BOLD_OFF,t+=this.getSeparatorLine(i,"=")+`
`,e.pricing){e.pricing.subtotal&&(t+=this.justifyLine("Subtotal:",this.formatCurrency(e.pricing.subtotal,r?.currency),i)+`
`),e.pricing.taxes&&(t+=this.justifyLine("Taxes:",this.formatCurrency(e.pricing.taxes,r?.currency),i)+`
`),e.pricing.fees&&Object.entries(e.pricing.fees).forEach(([A,l])=>{if(l){let S=A.replace(/([A-Z])/g," $1").replace(/^./,M=>M.toUpperCase());t+=this.justifyLine(S+":",this.formatCurrency(l,r?.currency),i)+`
`}}),e.pricing.discounts&&(t+=this.justifyLine("Discount:","-"+this.formatCurrency(e.pricing.discounts,r?.currency),i)+`
`),t+=this.getSeparatorLine(i,"-")+`
`,t+=this.COMMANDS.TEXT_DOUBLE_HEIGHT,t+=this.COMMANDS.BOLD_ON,t+=this.justifyLine("TOTAL:",this.formatCurrency(e.pricing.total||0,r?.currency),i)+`
`,t+=this.COMMANDS.BOLD_OFF,t+=this.COMMANDS.TEXT_NORMAL,t+=this.getCharacterOptimizationCommands(i),t+=this.getFontSizeCommand(i),t+=this.justifyLine("Paid:",this.formatCurrency(e.pricing.paid||0,r?.currency),i)+`
`;let a=e.pricing.balance||0,u=a>0?"BALANCE DUE:":"OVERPAID:",h=Math.abs(a);a!==0&&(t+=this.COMMANDS.BOLD_ON,t+=this.justifyLine(u,this.formatCurrency(h,r?.currency),i)+`
`,t+=this.COMMANDS.BOLD_OFF)}return t+=`
`,e.paymentInfo&&(t+=this.COMMANDS.BOLD_ON,t+=`PAYMENT INFORMATION
`,t+=this.COMMANDS.BOLD_OFF,t+=this.getSeparatorLine(i,"-")+`
`,t+=this.justifyLine("Method:",(e.paymentInfo.method||"N/A").toUpperCase(),i)+`
`,t+=this.justifyLine("Status:",(e.paymentInfo.status||"pending").toUpperCase(),i)+`
`,t+=`
`),e.specialRequests&&(t+=this.COMMANDS.BOLD_ON,t+=`SPECIAL REQUESTS
`,t+=this.COMMANDS.BOLD_OFF,t+=this.getSeparatorLine(i,"-")+`
`,t+=this.formatText(e.specialRequests,i)+`
`,t+=`
`),t+=this.getSeparatorLine(i,"=")+`
`,t+=this.COMMANDS.ALIGN_CENTER,(i?.footerText||`Thank you for choosing us!
Have a pleasant stay`).split(`
`).forEach(a=>{t+=this.centerText(a.trim(),i)+`
`}),t+=`
`,t+=this.centerText("Printed: "+this.formatDateTime(new Date),i)+`
`,t+=`

`,i?.autocut!==!1&&(t+=this.COMMANDS.CUT_PAPER),t}formatDate(e){return e?new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"N/A"}formatDateTime(e){return e?new Date(e).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"N/A"}formatCurrency(e,r="USD"){try{return new Intl.NumberFormat("en-US",{style:"currency",currency:r}).format(e)}catch{return`${r} ${e.toFixed(2)}`}}printReservation(e,r,i){return c(this,null,function*(){this.isConnected()||(yield this.connectToPrinter());try{let t=this.generateReservationReceipt(e,r,i);yield this.sendToPrinter(t),console.log("Reservation printed successfully")}catch(t){throw console.error("Error printing reservation:",t),new Error(`Failed to print reservation: ${t}`)}})}testPrint(e){return c(this,null,function*(){this.isConnected()||(yield this.connectToPrinter());try{let r="";r+=this.COMMANDS.INIT,r+=this.getCharacterOptimizationCommands(e),r+=this.getPrintQualityCommand(e),r+=this.getLineSpacingCommand(e),r+=this.getFontSizeCommand(e),r+=this.COMMANDS.ALIGN_CENTER,r+=this.COMMANDS.TEXT_DOUBLE_SIZE,r+=this.COMMANDS.BOLD_ON,r+=this.centerText("TEST PRINT",e)+`
`,r+=this.COMMANDS.BOLD_OFF,r+=this.COMMANDS.TEXT_NORMAL,r+=this.getCharacterOptimizationCommands(e),r+=this.getFontSizeCommand(e),r+=this.getSeparatorLine(e)+`
`,r+=this.centerText("Printer is working correctly",e)+`
`,r+=this.centerText(`Paper Size: ${e?.paperSize||"80mm"}`,e)+`
`,r+=this.centerText(`Print Quality: ${e?.printQuality||"normal"}`,e)+`
`,r+=this.centerText(`Font Size: ${e?.fontSize||12}px`,e)+`
`,r+=this.centerText(`Max Chars: ${this.getMaxCharsPerLine(e)}`,e)+`
`,r+=this.centerText(`Logo Enabled: ${e?.includeLogo?"Yes":"No"}`,e)+`
`,r+=this.centerText(new Date().toLocaleString(),e)+`
`,r+=`

`,e?.autocut!==!1&&(r+=this.COMMANDS.CUT_PAPER),yield this.sendToPrinter(r),console.log("Test print completed successfully")}catch(r){throw console.error("Error during test print:",r),new Error(`Test print failed: ${r}`)}})}getConnectedDeviceInfo(){return this.connectedPrinter?.device?{name:this.connectedPrinter.device.name||"Unknown Printer",id:this.connectedPrinter.device.id}:null}createTextLogo(e,r){if(!e)return"";let i="";i+=this.COMMANDS.ALIGN_CENTER,i+=this.COMMANDS.TEXT_DOUBLE_SIZE,i+=this.COMMANDS.BOLD_ON;let t=this.getMaxCharsPerLine(r),n=Math.min(e.length+4,t),s="=".repeat(n);return i+=this.centerText(s,r)+`
`,i+=this.centerText(`  ${e}  `,r)+`
`,i+=this.centerText(s,r)+`
`,i+=this.COMMANDS.BOLD_OFF,i+=this.COMMANDS.TEXT_NORMAL,i+=this.getCharacterOptimizationCommands(r),i+=this.getFontSizeCommand(r),i}uploadLogo(e){return c(this,null,function*(){if(!this.isConnected())throw new Error("Printer not connected");try{let r;if(typeof e=="string"){let t=e.replace(/^data:image\/[a-z]+;base64,/,""),n=atob(t);r=new Uint8Array(n.length);for(let s=0;s<n.length;s++)r[s]=n.charCodeAt(s)}else r=new Uint8Array(e);let i=new Uint8Array([28,113,1,...r]);yield this.sendToPrinter(i),console.log("Logo uploaded to printer successfully")}catch(r){throw console.error("Error uploading logo:",r),new Error(`Failed to upload logo: ${r}`)}})}testPaperUtilization(e){return c(this,null,function*(){this.isConnected()||(yield this.connectToPrinter());try{let r=this.getMaxCharsPerLine(e),i=e?.paperSize||"80mm",t="";t+=this.COMMANDS.INIT,t+=this.getCharacterOptimizationCommands(e),t+=this.getFontSizeCommand(e),t+=this.COMMANDS.ALIGN_CENTER,t+=this.COMMANDS.BOLD_ON,t+=this.centerText("PAPER UTILIZATION TEST",e)+`
`,t+=this.COMMANDS.BOLD_OFF,t+=this.getSeparatorLine(e)+`
`,t+=this.COMMANDS.ALIGN_LEFT,t+=`Paper Size: ${i}
`,t+=`Max Chars: ${r}
`,t+=`Font Size: ${e?.fontSize||12}px
`,t+=`
`,t+=`Full width test:
`,t+="|"+"=".repeat(r-2)+`|
`,t+="|"+" ".repeat(r-2)+`|
`,t+="|"+"1234567890".repeat(Math.floor((r-2)/10))+"123456789".substring(0,(r-2)%10)+`|
`,t+="|"+"=".repeat(r-2)+`|
`,t+=`
`,t+=`Character density test:
`;for(let s=1;s<=5;s++){let o=Math.floor(r*s/5);t+=`${s}/5: ${"#".repeat(o)}
`}t+=`
`,t+=`Optimal for 58mm: 4/5 density
`;let n=Math.floor(r*4/5);t+=`Recommended: ${"*".repeat(n)}
`,t+=`

`,e?.autocut!==!1&&(t+=this.COMMANDS.CUT_PAPER),yield this.sendToPrinter(t),console.log("Paper utilization test completed")}catch(r){throw console.error("Error during paper utilization test:",r),new Error(`Paper utilization test failed: ${r}`)}})}static \u0275fac=function(r){return new(r||C)};static \u0275prov=O({token:C,factory:C.\u0275fac,providedIn:"root"})};export{N as a};

import{a as fe}from"./chunk-72TJ4JLQ.js";import{a as ce,b as me}from"./chunk-TLN5MM36.js";import{a as re}from"./chunk-BF5Y3WJN.js";import{a as xe,c as ve,d as ge,e as ue}from"./chunk-CMZGRSEW.js";import{d as be}from"./chunk-ZBSG24BC.js";import{a as pe}from"./chunk-OJWZ6ZD7.js";import{g as de}from"./chunk-L2IRRR6J.js";import{a as le,b as se}from"./chunk-EDESGICS.js";import"./chunk-JRF7K3G5.js";import"./chunk-HRGWPEEQ.js";import{Z as ae}from"./chunk-BVLPFG4Z.js";import"./chunk-LYY57WCE.js";import"./chunk-AGZJ637K.js";import{a as ne,c as oe}from"./chunk-QJAAU2EQ.js";import"./chunk-S3JL7UCS.js";import{m as Z,n as ee,q as te,r as ie}from"./chunk-ETP2OZKZ.js";import{Db as p,Eb as c,Fb as F,Gc as m,Hb as M,Hc as S,Ib as L,Ic as g,Jb as O,Kb as i,Lb as t,Mb as U,Oc as X,Tb as j,Va as H,Xb as D,Ya as d,Zb as l,ca as E,ha as z,hc as W,ia as N,jc as V,lb as Y,mc as n,nc as s,oc as v,qc as K,ta as q,uc as Q,vc as J,wc as h}from"./chunk-KGWH6IHP.js";import{f as A}from"./chunk-EQDQRRRY.js";function Ce(r,e){if(r&1&&(i(0,"h1",8),n(1,"Receipt Details"),t(),i(2,"p",9),n(3),t()),r&2){let a=l();d(3),v("Order #",a.orderResource.value().reference)}}function Ee(r,e){r&1&&(i(0,"h1",8),n(1,"Receipt Details"),t(),i(2,"p",9),n(3,"Loading receipt..."),t())}function $e(r,e){r&1&&(i(0,"mat-icon",12),n(1,"refresh"),t(),i(2,"span"),n(3,"Exporting..."),t())}function we(r,e){r&1&&(i(0,"mat-icon"),n(1,"print"),t(),i(2,"span"),n(3,"Export"),t(),i(4,"mat-icon"),n(5,"arrow_drop_down"),t())}function Te(r,e){if(r&1){let a=j();i(0,"button",10),p(1,$e,4,0)(2,we,6,0),t(),i(3,"mat-menu",null,0)(5,"button",11),D("click",function(){z(a);let x=l();return N(x.exportReceipt())}),i(6,"mat-icon"),n(7,"receipt"),t(),i(8,"span"),n(9,"Generate Receipt"),t()(),i(10,"button",11),D("click",function(){z(a);let x=l();return N(x.exportInvoice())}),i(11,"mat-icon"),n(12,"description"),t(),i(13,"span"),n(14,"Generate Invoice"),t()()()}if(r&2){let a=W(4),o=l();O("matMenuTriggerFor",a)("disabled",o.exporting()),d(),c(o.exporting()?1:2)}}function De(r,e){r&1&&(i(0,"div",6)(1,"div",13),U(2,"mat-spinner",14),i(3,"p",15),n(4,"Loading receipt details..."),t()()())}function Ie(r,e){if(r&1){let a=j();i(0,"div",7)(1,"div",16)(2,"div",17)(3,"mat-icon",18),n(4,"error_outline"),t()(),i(5,"h3",19),n(6,"Failed to Load Receipt"),t(),i(7,"p",20),n(8),t(),i(9,"button",21),D("click",function(){z(a);let x=l();return N(x.goBack())}),n(10," Back to Receipts "),t()()()}if(r&2){let a,o=l();d(8),s(((a=o.orderResource.error())==null?null:a.message)||"An error occurred")}}function Re(r,e){if(r&1&&(i(0,"div",22)(1,"div",71)(2,"mat-icon",72),n(3,"schedule"),t(),i(4,"div",73)(5,"h3",74),n(6,"Scheduled Delivery"),t(),i(7,"p",75),n(8," This order is scheduled for "),i(9,"strong"),n(10),t(),n(11," at "),i(12,"strong"),n(13),t()()()()()),r&2){l();let a=h(0);d(10),s(a.deliveryTime.date),d(3),s(a.deliveryTime.time)}}function ke(r,e){if(r&1&&(i(0,"div",23)(1,"div",71)(2,"mat-icon",76),n(3,"card_giftcard"),t(),i(4,"div",73)(5,"h3",77),n(6,"\u{1F381} Gift Order"),t(),i(7,"p",78),n(8),t()()()()),r&2){l();let a=h(0);d(8),v(" This is a gift order ",a.receiver!=null&&a.receiver.surprise?"(Surprise)":""," ")}}function Pe(r,e){if(r&1&&U(0,"img",81),r&2){let a=l().$implicit;O("src",a.image,H)("alt",a.name)}}function Ae(r,e){r&1&&(i(0,"div",82)(1,"mat-icon",90),n(2,"image"),t()())}function ze(r,e){if(r&1&&(i(0,"div",83),n(1),t()),r&2){let a=l().$implicit;d(),s(a.description)}}function Ne(r,e){if(r&1&&(i(0,"span",92),n(1),m(2,"currency"),t()),r&2){let a=l().$implicit,o=l(4);d(),v("(",g(2,1,a.price,o.currency()),")")}}function Be(r,e){if(r&1&&(i(0,"div",91),n(1),p(2,Ne,3,4,"span",92),i(3,"span",93),n(4),t()()),r&2){let a=e.$implicit;d(),v(" ",a.name," "),d(),c(a.price?2:-1),d(2),v("\xD7",a.quantity)}}function Fe(r,e){if(r&1&&(i(0,"div",84),M(1,Be,5,3,"div",91,F),t()),r&2){let a=l().$implicit;d(),L(a.options)}}function Me(r,e){r&1&&(i(0,"span",85),n(1,"-"),t())}function Le(r,e){if(r&1&&(i(0,"tr",55)(1,"td",79)(2,"div",80),p(3,Pe,1,2,"img",81)(4,Ae,3,0,"div",82),i(5,"div")(6,"div",33),n(7),t(),p(8,ze,2,1,"div",83),t()()(),i(9,"td",79),p(10,Fe,3,0,"div",84)(11,Me,2,0,"span",85),t(),i(12,"td",86)(13,"span",87),n(14),t()(),i(15,"td",88),n(16),m(17,"currency"),t(),i(18,"td",89),n(19),m(20,"currency"),t()()),r&2){let a=e.$implicit,o=l(2);d(3),c(a.image?3:4),d(4),s(a.name),d(),c(a.description?8:-1),d(2),c(a.options&&a.options.length>0?10:11),d(4),v(" ",a.quantity," "),d(2),v(" ",g(17,7,a.price,o.currency())," "),d(3),v(" ",g(20,10,o.getProductSubtotal(a),o.currency())," ")}}function Oe(r,e){r&1&&(i(0,"span",96),n(1,"Surprise"),t())}function Ue(r,e){if(r&1&&(i(0,"div")(1,"label",42),n(2,"Delivery Address"),t(),i(3,"div",44),n(4),t()()),r&2){l(2);let a=h(0);d(4),K(" ",a.receiver.address.name," ",a.receiver.address.administrativeArea," ",a.receiver.address.locality," ")}}function je(r,e){if(r&1&&(i(0,"div")(1,"label",42),n(2,"Gift Note"),t(),i(3,"div",97),n(4),t()()),r&2){l(2);let a=h(0);d(4),s(a.receiver.note)}}function Ve(r,e){if(r&1&&(i(0,"div",36)(1,"div",94)(2,"h3",38)(3,"mat-icon",95),n(4,"card_giftcard"),t(),n(5," Gift Receiver "),p(6,Oe,2,0,"span",96),t()(),i(7,"div",40)(8,"div",58)(9,"div")(10,"label",42),n(11,"Name"),t(),i(12,"div",44),n(13),t()(),i(14,"div")(15,"label",42),n(16,"Phone"),t(),i(17,"div",44),n(18),t()(),p(19,Ue,5,3,"div"),p(20,je,5,1,"div"),t()()()),r&2){l();let a=h(0);d(6),c(a.receiver.surprise?6:-1),d(7),s(a.receiver.name||"N/A"),d(5),s(a.receiver.phoneNumber||"N/A"),d(),c(a.receiver.address?19:-1),d(),c(a.receiver.note?20:-1)}}function Ge(r,e){if(r&1&&(i(0,"div")(1,"label",42),n(2,"Contact Phone"),t(),i(3,"div",44),n(4),t()()),r&2){l(2);let a=h(0);d(4),s(a.shipping.phone)}}function qe(r,e){if(r&1&&(i(0,"div",36)(1,"div",37)(2,"h3",38)(3,"mat-icon",98),n(4,"local_shipping"),t(),n(5," Shipping "),t()(),i(6,"div",40)(7,"div",99)(8,"div")(9,"label",42),n(10,"Address"),t(),i(11,"div",44),n(12),t()(),p(13,Ge,5,1,"div"),t()()()),r&2){l();let a=h(0);d(12),s((a.shipping==null?null:a.shipping.name)||"N/A"),d(),c(a.shipping!=null&&a.shipping.phone?13:-1)}}function He(r,e){if(r&1&&(i(0,"div",65)(1,"span",15),n(2,"Discount:"),t(),i(3,"span",100),n(4),m(5,"currency"),t()()),r&2){l();let a=h(0),o=l();d(4),v("-",g(5,1,a.discount,o.currency()))}}function Ye(r,e){if(r&1&&(i(0,"div",70)(1,"div",65)(2,"span",101)(3,"mat-icon",102),n(4,"local_taxi"),t(),n(5," Driver Tip: "),t(),i(6,"span",103),n(7),m(8,"currency"),t()()()),r&2){l();let a=h(0),o=l();d(7),s(g(8,1,a.driverTip,o.currency()))}}function We(r,e){if(r&1&&(i(0,"div",36)(1,"div",37)(2,"h3",38)(3,"mat-icon",104),n(4,"account_balance"),t(),n(5," Revenue Breakdown "),t()(),i(6,"div",64)(7,"div",105)(8,"div",106)(9,"span",107),n(10,"Vendor Commission"),t(),i(11,"span",108),n(12),t()(),i(13,"div",109),n(14),m(15,"currency"),t()(),i(16,"div",110)(17,"div",106)(18,"span",111),n(19,"Vendor Receives"),t()(),i(20,"div",112),n(21),m(22,"currency"),t()(),i(23,"div",113)(24,"div",106)(25,"span",114),n(26,"Platform Receives"),t()(),i(27,"div",115),n(28),m(29,"currency"),t()()()()),r&2){l();let a=h(0),o=l();d(12),v("",a.vendorCommission,"%"),d(2),s(g(15,4,a.vendorCommissionAmount,o.currency())),d(7),v(" ",g(22,7,a.subTotal-a.vendorCommissionAmount,o.currency())," "),d(7),v(" ",g(29,10,a.total-(a.subTotal-a.vendorCommissionAmount),o.currency())," ")}}function Ke(r,e){if(r&1&&(Q(0),i(1,"div",7),p(2,Re,14,2,"div",22),p(3,ke,9,1,"div",23),i(4,"div",24)(5,"div",25)(6,"div",4)(7,"div",26)(8,"mat-icon",27),n(9,"receipt_long"),t()(),i(10,"div")(11,"h2",28),n(12),t(),i(13,"p",29),n(14),m(15,"date"),t()()(),i(16,"div",30)(17,"div",31),n(18),m(19,"titlecase"),t(),i(20,"div",32),n(21," Payment: "),i(22,"span",33),n(23),m(24,"titlecase"),t()()()()(),i(25,"div",34)(26,"div",35)(27,"div",36)(28,"div",37)(29,"h3",38)(30,"mat-icon",39),n(31,"info"),t(),n(32," Order Information "),t()(),i(33,"div",40)(34,"div",41)(35,"div")(36,"label",42),n(37,"Order Reference"),t(),i(38,"div",43),n(39),t()(),i(40,"div")(41,"label",42),n(42,"Order Date"),t(),i(43,"div",44),n(44),m(45,"date"),t()(),i(46,"div")(47,"label",42),n(48,"Payment Method"),t(),i(49,"div",44),n(50),m(51,"titlecase"),t()(),i(52,"div")(53,"label",42),n(54,"Payment Status"),t(),i(55,"div",45)(56,"span",46),n(57),m(58,"titlecase"),t()()(),i(59,"div")(60,"label",42),n(61,"Order Type"),t(),i(62,"div",44),n(63),m(64,"titlecase"),t()(),i(65,"div")(66,"label",42),n(67,"Delivery Type"),t(),i(68,"div",44),n(69),m(70,"titlecase"),t()()()()(),i(71,"div",36)(72,"div",37)(73,"h3",38)(74,"mat-icon",47),n(75,"shopping_cart"),t(),n(76," Order Items "),t()(),i(77,"div",48)(78,"table",49)(79,"thead",50)(80,"tr")(81,"th",51),n(82,"Product"),t(),i(83,"th",51),n(84,"Options"),t(),i(85,"th",52),n(86,"Qty"),t(),i(87,"th",53),n(88,"Price"),t(),i(89,"th",53),n(90,"Subtotal"),t()()(),i(91,"tbody",54),M(92,Le,21,13,"tr",55,F),t()()()()(),i(94,"div",56)(95,"div",36)(96,"div",37)(97,"h3",38)(98,"mat-icon",57),n(99,"person"),t(),n(100," Customer "),t()(),i(101,"div",40)(102,"div",58)(103,"div")(104,"label",42),n(105,"Name"),t(),i(106,"div",44),n(107),t()(),i(108,"div")(109,"label",42),n(110,"Phone"),t(),i(111,"div",44),n(112),t()(),i(113,"div")(114,"label",42),n(115,"Email"),t(),i(116,"div",59),n(117),t()()()()(),p(118,Ve,21,5,"div",36),p(119,qe,14,2,"div",36),i(120,"div",60)(121,"div",61)(122,"h3",62)(123,"mat-icon",63),n(124,"account_balance_wallet"),t(),n(125," Order Summary "),t()(),i(126,"div",64)(127,"div",65)(128,"span",15),n(129,"Subtotal:"),t(),i(130,"span",33),n(131),m(132,"currency"),t()(),i(133,"div",65)(134,"span",15),n(135,"Service Fee:"),t(),i(136,"span",33),n(137),m(138,"currency"),t()(),i(139,"div",65)(140,"span",15),n(141,"Shipping Fee:"),t(),i(142,"span",33),n(143),m(144,"currency"),t()(),p(145,He,6,4,"div",65),i(146,"div",66)(147,"div",67)(148,"span",68),n(149,"Total:"),t(),i(150,"span",69),n(151),m(152,"currency"),t()()(),p(153,Ye,9,4,"div",70),t()(),p(154,We,30,13,"div",36),t()()()),r&2){let a=l(),o=J(a.orderResource.value());d(2),c((o.deliveryTime==null?null:o.deliveryTime.name)==="Schedule Delivery"?2:-1),d(),c(o.gift?3:-1),d(9),s(o.reference),d(2),v(" Created on ",g(15,49,o.createdAt,"medium")," "),d(3),V("bg-green-100",o.category==="complete")("text-green-800",o.category==="complete")("bg-yellow-100",o.category==="pending")("text-yellow-800",o.category==="pending")("bg-red-100",o.category==="cancel")("text-red-800",o.category==="cancel"),d(),v(" ",S(19,52,o.category)," "),d(5),s(S(24,54,o.paymentStatus)),d(16),s(o.reference),d(5),s(g(45,56,o.createdAt,"medium")),d(6),s(S(51,59,o.payment)),d(6),V("bg-green-100",o.paymentStatus==="paid")("text-green-800",o.paymentStatus==="paid")("bg-yellow-100",o.paymentStatus==="pending")("text-yellow-800",o.paymentStatus==="pending")("bg-red-100",o.paymentStatus==="failed")("text-red-800",o.paymentStatus==="failed"),d(),v(" ",S(58,61,o.paymentStatus)," "),d(6),s(S(64,63,o.orderType)),d(6),s(S(70,65,o.deliveryType)),d(23),L(o.cart==null?null:o.cart.products),d(15),s((o.user==null?null:o.user.name)||"N/A"),d(5),s((o.user==null?null:o.user.phoneNumber)||"N/A"),d(5),s((o.user==null?null:o.user.email)||"N/A"),d(),c(o.gift&&o.receiver?118:-1),d(),c(o.shipping?119:-1),d(12),s(g(132,67,o.subTotal,a.currency())),d(6),s(g(138,70,o.serviceFee,a.currency())),d(6),s(g(144,73,o.shippingFee,a.currency())),d(2),c(o.discount?145:-1),d(6),s(g(152,76,o.total,a.currency())),d(2),c(o.driverTip?153:-1),d(),c(o.vendorCommission&&o.vendorCommissionAmount?154:-1)}}var ye=class r{route=E(ne);router=E(oe);orderService=E(fe);storeService=E(pe);snackBar=E(re);exporting=q(!1);orderResource=be({params:()=>({id:this.route.snapshot.paramMap.get("id")}),stream:({params:e})=>this.orderService.getOrder(e.id)});currency=X(()=>this.storeService.getStoreLocally?.currencyCode||"NGN");getProductSubtotal(e){let a=(e.price||0)*(e.quantity||0),o=(e.options||[]).reduce((x,f)=>x+(f.price||0)*(f.quantity||0),0);return a+o}getCurrency(){return this.storeService.getStoreLocally?.currencyCode||"NGN"}goBack(){this.router.navigate(["../menu/erp/reports/receipts/list"])}exportReceipt(){return A(this,null,function*(){yield this.exportDocument("receipt")})}exportInvoice(){return A(this,null,function*(){yield this.exportDocument("invoice")})}exportDocument(e){return A(this,null,function*(){let a=this.orderResource.value();if(!a){this.snackBar.open("Order data not available","Close",{duration:3e3});return}let o=this.currency();if(!o){this.snackBar.open("Currency information not available","Close",{duration:3e3});return}this.exporting.set(!0);try{let x=e==="receipt"?this.generatePrintableReceipt(a,o):this.generatePrintableInvoice(a,o),f=e==="receipt"?800:1e3,y=e==="receipt"?900:1e3,_=window.open("","_blank",`width=${f},height=${y}`);_?(_.document.write(x),_.document.close(),_.focus(),setTimeout(()=>{_.print()},500)):this.snackBar.open("Please allow pop-ups to export","Close",{duration:3e3})}catch(x){console.error(`Error exporting ${e}:`,x),this.snackBar.open(`Failed to export ${e}`,"Close",{duration:3e3})}finally{this.exporting.set(!1)}})}generatePrintableReceipt(e,a){let o=u=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:a,currencyDisplay:"symbol"}).format(u)}catch{return console.warn(`Invalid currency code: ${a}, using USD`),new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(u)}},x=u=>new Date(u).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),f=this.storeService.getStoreLocally,y=f?.name||"Store",_=f?.contactInfo?.phone||"",$=f?.contactInfo?.address||"",I=e.deliveryTime?.name==="Schedule Delivery"?`
      <div class="alert-section scheduled">
        <div class="alert-icon">\u{1F4C5}</div>
        <div class="alert-content">
          <div class="alert-title">SCHEDULED DELIVERY</div>
          <div class="alert-text">${e.deliveryTime.date} at ${e.deliveryTime.time}</div>
        </div>
      </div>
    `:"",R=e.gift&&e.receiver?`
      <div class="alert-section gift">
        <div class="alert-icon">\u{1F381}</div>
        <div class="alert-content">
          <div class="alert-title">GIFT ORDER ${e.receiver.surprise?"(SURPRISE)":""}</div>
          <div class="alert-text">
            <strong>To:</strong> ${e.receiver.name}<br>
            <strong>Phone:</strong> ${e.receiver.phoneNumber}
            ${e.receiver.address?`<br><strong>Address:</strong> ${e.receiver.address.name}`:""}
            ${e.receiver.note?`<br><strong>Note:</strong> ${e.receiver.note}`:""}
          </div>
        </div>
      </div>
    `:"",w=e.cart?.products?.map(u=>{let k=u.options?.length>0?u.options.map(C=>`<div class="option-line">  + ${C.name} ${C.price?"("+o(C.price)+")":""} x${C.quantity}</div>`).join(""):"",B=this.getProductSubtotal(u);return`
        <div class="product-item">
          <div class="product-header">
            <span class="product-name">${u.quantity}x ${u.name}</span>
            <span class="product-price">${o(B)}</span>
          </div>
          ${k}
          <div class="product-unit-price">@ ${o(u.price)} each</div>
        </div>
      `}).join("")||"",T=e.vendorCommission&&e.vendorCommissionAmount?`
      <div class="section-divider"></div>
      <div class="commission-section">
        <div class="section-title">REVENUE BREAKDOWN</div>
        <div class="commission-item">
          <span>Vendor Commission (${e.vendorCommission}%)</span>
          <span>${o(e.vendorCommissionAmount)}</span>
        </div>
        <div class="commission-item">
          <span>Vendor Receives</span>
          <span>${o(e.subTotal-e.vendorCommissionAmount)}</span>
        </div>
        <div class="commission-item">
          <span>Platform Receives</span>
          <span>${o(e.total-(e.subTotal-e.vendorCommissionAmount))}</span>
        </div>
      </div>
    `:"";return`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${e.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { 
            size: 80mm auto;
            margin: 0;
          }
          body { 
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
            width: 80mm;
            margin: 0 auto;
            padding: 10mm;
          }
          
          .receipt-header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .store-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .store-info {
            font-size: 10px;
            margin-bottom: 2px;
          }
          .receipt-title {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0 5px 0;
            text-transform: uppercase;
          }
          .order-ref {
            font-size: 11px;
            margin-bottom: 3px;
          }
          .order-date {
            font-size: 10px;
            color: #555;
          }
          
          .alert-section {
            border: 2px solid #000;
            padding: 8px;
            margin: 10px 0;
            background: #f5f5f5;
          }
          .alert-section.scheduled {
            border-color: #2563eb;
          }
          .alert-section.gift {
            border-color: #db2777;
          }
          .alert-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 5px;
          }
          .alert-text {
            font-size: 10px;
            line-height: 1.5;
          }
          
          .info-section {
            margin: 15px 0;
            font-size: 11px;
          }
          .info-label {
            font-weight: bold;
            display: inline-block;
            width: 100px;
          }
          
          .section-divider {
            border-top: 1px dashed #000;
            margin: 15px 0;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 8px;
            text-align: center;
            text-transform: uppercase;
          }
          
          .product-item {
            margin-bottom: 12px;
            font-size: 11px;
          }
          .product-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .product-name {
            flex: 1;
            padding-right: 10px;
          }
          .product-price {
            white-space: nowrap;
          }
          .option-line {
            font-size: 10px;
            padding-left: 10px;
            margin: 2px 0;
            color: #555;
          }
          .product-unit-price {
            font-size: 9px;
            color: #666;
            padding-left: 10px;
            margin-top: 2px;
          }
          
          .totals-section {
            margin-top: 15px;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
          }
          .total-line.grand {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 8px 0;
            margin-top: 8px;
          }
          .total-line.tip {
            color: #f59e0b;
            font-weight: bold;
            border-top: 1px dashed #000;
            padding-top: 8px;
            margin-top: 8px;
          }
          
          .commission-section {
            margin: 15px 0;
            padding: 10px;
            background: #f9f9f9;
            border: 1px solid #ddd;
          }
          .commission-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 10px;
          }
          
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px dashed #000;
            font-size: 10px;
          }
          .footer-message {
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          @media print {
            body { 
              padding: 5mm;
            }
            .no-print { 
              display: none; 
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="receipt-header">
          <div class="store-name">${y}</div>
          ${_?`<div class="store-info">${_}</div>`:""}
          ${$?`<div class="store-info">${$}</div>`:""}
          <div class="receipt-title">RECEIPT</div>
          <div class="order-ref">Order: ${e.reference}</div>
          <div class="order-date">${x(e.createdAt)}</div>
        </div>

        <!-- Alerts -->
        ${I}
        ${R}

        <!-- Customer Information -->
        <div class="info-section">
          <div><span class="info-label">Customer:</span> ${e.user?.name||"N/A"}</div>
          <div><span class="info-label">Phone:</span> ${e.user?.phoneNumber||"N/A"}</div>
          ${e.shipping?.name?`<div><span class="info-label">Address:</span> ${e.shipping.name}</div>`:""}
        </div>

        <!-- Order Details -->
        <div class="info-section">
          <div><span class="info-label">Payment:</span> ${e.payment}</div>
          <div><span class="info-label">Status:</span> ${e.paymentStatus}</div>
          <div><span class="info-label">Order Type:</span> ${e.orderType}</div>
          <div><span class="info-label">Delivery:</span> ${e.deliveryType}</div>
        </div>

        <div class="section-divider"></div>

        <!-- Products -->
        <div class="section-title">Items Ordered</div>
        ${w}

        <!-- Totals -->
        <div class="totals-section">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${o(e.subTotal)}</span>
          </div>
          <div class="total-line">
            <span>Service Fee:</span>
            <span>${o(e.serviceFee)}</span>
          </div>
          <div class="total-line">
            <span>Shipping Fee:</span>
            <span>${o(e.shippingFee)}</span>
          </div>
          ${e.discount?`
          <div class="total-line">
            <span>Discount:</span>
            <span>-${o(e.discount)}</span>
          </div>
          `:""}
          <div class="total-line grand">
            <span>TOTAL:</span>
            <span>${o(e.total)}</span>
          </div>
          ${e.driverTip?`
          <div class="total-line tip">
            <span>Driver Tip:</span>
            <span>${o(e.driverTip)}</span>
          </div>
          `:""}
        </div>

        ${T}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-message">THANK YOU FOR YOUR BUSINESS!</div>
          <div>Printed: ${x(new Date().toISOString())}</div>
        </div>
      </body>
      </html>
    `}generatePrintableInvoice(e,a){let o=b=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:a,currencyDisplay:"symbol"}).format(b)}catch{return console.warn(`Invalid currency code: ${a}, using USD`),new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(b)}},x=b=>new Date(b).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),f=b=>new Date(b).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),y=this.storeService.getStoreLocally,_=y?.name||"Store",$=y?.contactInfo?.phone||"",I=y?.contactInfo?.email||"",R=y?.contactInfo?.address||"",w=y?.contactInfo?.city||"",T=y?.contactInfo?.state||"",u=y?.contactInfo?.country||"",k=e.deliveryTime?.name==="Schedule Delivery"?`
      <div class="alert-box scheduled">
        <div class="alert-icon">\u{1F4C5}</div>
        <div class="alert-content">
          <div class="alert-title">Scheduled Delivery</div>
          <div class="alert-text">This order is scheduled for <strong>${e.deliveryTime.date}</strong> at <strong>${e.deliveryTime.time}</strong></div>
        </div>
      </div>
    `:"",B=e.gift&&e.receiver?`
      <div class="alert-box gift">
        <div class="alert-icon">\u{1F381}</div>
        <div class="alert-content">
          <div class="alert-title">Gift Order ${e.receiver.surprise?"(Surprise)":""}</div>
          <div class="gift-details">
            <div><strong>Recipient:</strong> ${e.receiver.name}</div>
            <div><strong>Phone:</strong> ${e.receiver.phoneNumber}</div>
            ${e.receiver.address?`<div><strong>Address:</strong> ${e.receiver.address.name}</div>`:""}
            ${e.receiver.note?`<div><strong>Gift Message:</strong> ${e.receiver.note}</div>`:""}
          </div>
        </div>
      </div>
    `:"",C=e.cart?.products?.map((b,G)=>{let _e=b.options?.length>0?`<br><small style="color: #666;">${b.options.map(P=>`+ ${P.name} ${P.price?"("+o(P.price)+")":""} x${P.quantity}`).join("<br>")}</small>`:"",Se=this.getProductSubtotal(b);return`
        <tr>
          <td style="text-align: center;">${G+1}</td>
          <td>${b.name}${_e}</td>
          <td style="text-align: center;">${b.quantity}</td>
          <td style="text-align: right;">${o(b.price)}</td>
          <td style="text-align: right;"><strong>${o(Se)}</strong></td>
        </tr>
      `}).join("")||"",he=e.vendorCommission&&e.vendorCommissionAmount?`
      <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #374151; text-transform: uppercase;">Revenue Breakdown</h3>
        <table style="width: 100%; font-size: 12px;">
          <tr style="background: #dbeafe;">
            <td style="padding: 10px; border-radius: 4px;">Vendor Commission (${e.vendorCommission}%)</td>
            <td style="padding: 10px; text-align: right; color: #2563eb; font-weight: bold;">${o(e.vendorCommissionAmount)}</td>
          </tr>
          <tr style="background: #fce7f3;">
            <td style="padding: 10px; border-radius: 4px; padding-top: 5px;">Vendor Receives</td>
            <td style="padding: 10px; text-align: right; color: #db2777; font-weight: bold; padding-top: 5px;">${o(e.subTotal-e.vendorCommissionAmount)}</td>
          </tr>
          <tr style="background: #d1fae5;">
            <td style="padding: 10px; border-radius: 4px; padding-top: 5px;">Platform Receives</td>
            <td style="padding: 10px; text-align: right; color: #059669; font-weight: bold; padding-top: 5px;">${o(e.total-(e.subTotal-e.vendorCommissionAmount))}</td>
          </tr>
        </table>
      </div>
    `:"";return`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${e.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { 
            size: A4;
            margin: 0;
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1f2937;
            background: white;
            padding: 40px;
          }
          
          .invoice-header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 3px solid #3b82f6;
          }
          
          .company-info h1 {
            font-size: 28px;
            color: #1f2937;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .company-info p {
            color: #6b7280;
            font-size: 11px;
            line-height: 1.6;
            margin-bottom: 3px;
          }
          
          .invoice-info {
            text-align: right;
          }
          .invoice-title {
            font-size: 36px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .invoice-details {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            text-align: left;
            display: inline-block;
          }
          .invoice-details div {
            display: flex;
            justify-content: space-between;
            gap: 30px;
            margin-bottom: 5px;
            font-size: 11px;
          }
          .invoice-details strong {
            color: #374151;
            min-width: 100px;
          }
          .invoice-details span {
            color: #6b7280;
          }
          
          .alert-box {
            margin: 20px 0;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: flex-start;
            gap: 15px;
          }
          .alert-box.scheduled {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
          }
          .alert-box.gift {
            background: #fdf2f8;
            border-left: 4px solid #ec4899;
          }
          .alert-icon {
            font-size: 24px;
          }
          .alert-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 5px;
            color: #1f2937;
          }
          .alert-text {
            font-size: 11px;
            color: #6b7280;
          }
          .gift-details {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.8;
          }
          
          .parties-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .party-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .party-box h3 {
            font-size: 12px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .party-box p {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 4px;
            line-height: 1.6;
          }
          .party-box strong {
            color: #1f2937;
          }
          
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .items-table thead {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
          }
          .items-table th {
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-table tbody tr {
            border-bottom: 1px solid #e5e7eb;
          }
          .items-table tbody tr:nth-child(even) {
            background: #f9fafb;
          }
          .items-table tbody tr:hover {
            background: #f3f4f6;
          }
          .items-table td {
            padding: 12px 10px;
            font-size: 11px;
            color: #374151;
          }
          
          .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
          }
          .totals-table {
            width: 350px;
          }
          .totals-table tr {
            border-bottom: 1px solid #e5e7eb;
          }
          .totals-table td {
            padding: 10px 15px;
            font-size: 12px;
          }
          .totals-table td:first-child {
            color: #6b7280;
          }
          .totals-table td:last-child {
            text-align: right;
            color: #1f2937;
            font-weight: 500;
          }
          .totals-table tr.subtotal {
            background: #f9fafb;
          }
          .totals-table tr.grand-total {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            font-weight: bold;
            font-size: 16px;
            border: none;
          }
          .totals-table tr.grand-total td {
            color: white;
            padding: 15px;
          }
          .totals-table tr.driver-tip {
            background: #fffbeb;
            border-top: 2px solid #f59e0b;
          }
          .totals-table tr.driver-tip td:last-child {
            color: #f59e0b;
            font-weight: bold;
          }
          
          .payment-status {
            margin-top: 30px;
            padding: 15px 20px;
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            border-radius: 8px;
          }
          .payment-status.pending {
            background: #fef3c7;
            border-left-color: #f59e0b;
          }
          .payment-status.failed {
            background: #fee2e2;
            border-left-color: #ef4444;
          }
          .payment-status h4 {
            font-size: 12px;
            margin-bottom: 5px;
            color: #1f2937;
          }
          .payment-status p {
            font-size: 11px;
            color: #6b7280;
          }
          
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
          }
          .footer p {
            margin-bottom: 5px;
          }
          
          @media print {
            body { 
              padding: 20mm;
            }
            .no-print { 
              display: none; 
            }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-info">
            <h1>${_}</h1>
            ${R?`<p>${R}</p>`:""}
            ${w||T?`<p>${w}${w&&T?", ":""}${T}</p>`:""}
            ${u?`<p>${u}</p>`:""}
            ${$?`<p>Phone: ${$}</p>`:""}
            ${I?`<p>Email: ${I}</p>`:""}
          </div>
          
          <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-details">
              <div><strong>Invoice #:</strong><span>${e.reference}</span></div>
              <div><strong>Date:</strong><span>${x(e.createdAt)}</span></div>
              <div><strong>Status:</strong><span>${e.category}</span></div>
              <div><strong>Payment:</strong><span>${e.paymentStatus}</span></div>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        ${k}
        ${B}

        <!-- Bill To / Ship To -->
        <div class="parties-section">
          <div class="party-box">
            <h3>Bill To</h3>
            <p><strong>${e.user?.name||"N/A"}</strong></p>
            ${e.user?.phoneNumber?`<p>Phone: ${e.user.phoneNumber}</p>`:""}
            ${e.user?.email?`<p>Email: ${e.user.email}</p>`:""}
          </div>
          
          <div class="party-box">
            <h3>Ship To</h3>
            ${e.shipping?.name?`<p>${e.shipping.name}</p>`:"<p>N/A</p>"}
            <p style="margin-top: 10px;"><strong>Delivery Type:</strong> ${e.deliveryType}</p>
            <p><strong>Order Type:</strong> ${e.orderType}</p>
            <p><strong>Payment Method:</strong> ${e.payment}</p>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 45%;">Item Description</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 20%; text-align: right;">Unit Price</th>
              <th style="width: 20%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${C}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <table class="totals-table">
            <tr class="subtotal">
              <td>Subtotal</td>
              <td>${o(e.subTotal)}</td>
            </tr>
            <tr>
              <td>Service Fee</td>
              <td>${o(e.serviceFee)}</td>
            </tr>
            <tr>
              <td>Shipping Fee</td>
              <td>${o(e.shippingFee)}</td>
            </tr>
            ${e.discount?`
            <tr>
              <td>Discount</td>
              <td>-${o(e.discount)}</td>
            </tr>
            `:""}
            <tr class="grand-total">
              <td>TOTAL DUE</td>
              <td>${o(e.total)}</td>
            </tr>
            ${e.driverTip?`
            <tr class="driver-tip">
              <td>Driver Tip</td>
              <td>${o(e.driverTip)}</td>
            </tr>
            `:""}
          </table>
        </div>

        ${he}

        <!-- Payment Status -->
        <div class="payment-status ${e.paymentStatus?.toLowerCase()}">
          <h4>Payment Status: ${e.paymentStatus}</h4>
          <p>Payment Method: ${e.payment} | Order Date: ${f(e.createdAt)}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p>Generated on ${f(new Date().toISOString())}</p>
        </div>
      </body>
      </html>
    `}static \u0275fac=function(a){return new(a||r)};static \u0275cmp=Y({type:r,selectors:[["receipts-details"]],decls:14,vars:5,consts:[["exportMenu","matMenu"],[1,"bg-gradient-to-r","from-indigo-50","to-blue-50","border-b","border-blue-100"],[1,"max-w-7xl","mx-auto","px-4","sm:px-6","lg:px-8"],[1,"flex","justify-between","items-center","py-6"],[1,"flex","items-center","gap-4"],["type","button",1,"p-2","text-gray-600","hover:text-gray-900","hover:bg-white/60","rounded-lg","transition-all","duration-200",3,"click"],[1,"flex","justify-center","items-center","py-20","bg-white"],[1,"max-w-7xl","mx-auto","px-4","sm:px-6","lg:px-8","py-8"],[1,"text-3xl","font-bold","text-gray-900","mb-1"],[1,"text-sm","text-gray-600"],["type","button",1,"px-6","py-3","bg-indigo-600","text-white","rounded-lg","hover:bg-indigo-700","disabled:opacity-50","disabled:cursor-not-allowed","transition-all","duration-200","flex","items-center","gap-2","shadow-md","hover:shadow-lg",3,"matMenuTriggerFor","disabled"],["mat-menu-item","",3,"click"],[1,"animate-spin"],[1,"text-center"],["diameter","50",1,"!mx-auto","mb-4"],[1,"text-gray-600"],[1,"bg-red-50","border","border-red-200","rounded-lg","p-6","text-center"],[1,"w-16","h-16","bg-red-200","rounded-full","flex","items-center","justify-center","mx-auto","mb-4"],[1,"text-4xl","text-red-500"],[1,"text-lg","font-semibold","text-red-900","mb-2"],[1,"text-red-700","mb-4"],["type","button",1,"bg-red-600","hover:bg-red-700","text-white","px-4","py-2","rounded-lg","font-medium","transition-colors","duration-200",3,"click"],[1,"bg-blue-50","border-l-4","border-blue-400","p-4","mb-6","rounded-r-lg","shadow-sm"],[1,"bg-pink-50","border-l-4","border-pink-400","p-4","mb-6","rounded-r-lg","shadow-sm"],[1,"bg-white","rounded-lg","shadow-sm","border","border-gray-200","p-6","mb-6"],[1,"flex","items-center","justify-between"],[1,"w-14","h-14","bg-indigo-100","rounded-full","flex","items-center","justify-center"],[1,"text-indigo-600","!text-3xl"],[1,"text-2xl","font-bold","text-gray-900"],[1,"text-sm","text-gray-600","mt-1"],[1,"text-right"],[1,"inline-flex","px-4","py-2","rounded-full","text-sm","font-semibold"],[1,"mt-2","text-sm","text-gray-600"],[1,"font-medium","text-gray-900"],[1,"grid","grid-cols-1","lg:grid-cols-3","gap-6"],[1,"lg:col-span-2","space-y-6"],[1,"bg-white","rounded-lg","shadow-sm","border","border-gray-200","overflow-hidden"],[1,"bg-gradient-to-r","from-gray-50","to-gray-100","px-6","py-4","border-b","border-gray-200"],[1,"text-lg","font-semibold","text-gray-900","flex","items-center","gap-2"],[1,"text-indigo-600"],[1,"p-6"],[1,"grid","grid-cols-1","md:grid-cols-2","gap-6"],[1,"block","text-sm","font-medium","text-gray-700","mb-1"],[1,"text-lg","font-semibold","text-gray-900"],[1,"text-sm","text-gray-900"],[1,"text-sm"],[1,"inline-flex","px-2","py-1","rounded-full","text-xs","font-medium"],[1,"text-green-600"],[1,"overflow-x-auto"],[1,"min-w-full","divide-y","divide-gray-200"],[1,"bg-gray-50"],[1,"px-6","py-3","text-left","text-xs","font-medium","text-gray-500","uppercase","tracking-wider"],[1,"px-6","py-3","text-center","text-xs","font-medium","text-gray-500","uppercase","tracking-wider"],[1,"px-6","py-3","text-right","text-xs","font-medium","text-gray-500","uppercase","tracking-wider"],[1,"bg-white","divide-y","divide-gray-200"],[1,"hover:bg-gray-50","transition-colors"],[1,"space-y-6"],[1,"text-purple-600"],[1,"space-y-4"],[1,"text-sm","text-gray-900","break-all"],[1,"bg-gradient-to-br","from-indigo-50","to-blue-50","rounded-lg","shadow-md","border-2","border-indigo-200","overflow-hidden"],[1,"bg-gradient-to-r","from-indigo-600","to-blue-600","px-6","py-4"],[1,"text-lg","font-semibold","text-white","flex","items-center","gap-2"],[1,"text-white"],[1,"p-6","space-y-3"],[1,"flex","justify-between","text-sm"],[1,"border-t-2","border-indigo-200","pt-3","mt-3"],[1,"flex","justify-between","items-center"],[1,"text-lg","font-bold","text-gray-900"],[1,"text-2xl","font-bold","text-indigo-600"],[1,"border-t","border-gray-300","pt-3","mt-3"],[1,"flex","items-center"],[1,"text-blue-600","mr-3"],[1,"flex-1"],[1,"text-lg","font-medium","text-blue-900","mb-1"],[1,"text-sm","text-blue-700"],[1,"text-pink-600","mr-3"],[1,"text-lg","font-medium","text-pink-900","mb-1"],[1,"text-sm","text-pink-700"],[1,"px-6","py-4"],[1,"flex","items-center","gap-3"],[1,"w-12","h-12","rounded-lg","object-cover",3,"src","alt"],[1,"w-12","h-12","bg-gray-200","rounded-lg","flex","items-center","justify-center"],[1,"text-xs","text-gray-500","mt-1"],[1,"space-y-1"],[1,"text-gray-400","text-sm"],[1,"px-6","py-4","text-center"],[1,"inline-flex","items-center","justify-center","w-8","h-8","bg-indigo-100","text-indigo-700","rounded-full","font-semibold","text-sm"],[1,"px-6","py-4","text-right","font-medium","text-gray-900"],[1,"px-6","py-4","text-right","font-bold","text-gray-900"],[1,"text-gray-400"],[1,"text-xs","bg-blue-50","text-blue-700","px-2","py-1","rounded","inline-block","mr-1"],[1,"font-medium"],[1,"text-blue-500"],[1,"bg-gradient-to-r","from-pink-50","to-rose-50","px-6","py-4","border-b","border-pink-200"],[1,"text-pink-600"],[1,"text-xs","bg-pink-100","text-pink-700","px-2","py-1","rounded-full"],[1,"text-sm","text-gray-900","bg-pink-50","p-3","rounded","border","border-pink-100"],[1,"text-orange-600"],[1,"space-y-3"],[1,"font-medium","text-green-600"],[1,"text-gray-700","flex","items-center","gap-1"],[1,"!text-base","text-amber-500"],[1,"font-semibold","text-amber-600"],[1,"text-blue-600"],[1,"bg-blue-50","border","border-blue-200","rounded-lg","p-4"],[1,"flex","justify-between","items-center","mb-2"],[1,"text-sm","font-medium","text-blue-900"],[1,"text-xs","bg-blue-100","text-blue-700","px-2","py-1","rounded-full"],[1,"text-2xl","font-bold","text-blue-600"],[1,"bg-pink-50","border","border-pink-200","rounded-lg","p-4"],[1,"text-sm","font-medium","text-pink-900"],[1,"text-2xl","font-bold","text-pink-600"],[1,"bg-green-50","border","border-green-200","rounded-lg","p-4"],[1,"text-sm","font-medium","text-green-900"],[1,"text-2xl","font-bold","text-green-600"]],template:function(a,o){a&1&&(i(0,"div",1)(1,"div",2)(2,"div",3)(3,"div",4)(4,"button",5),D("click",function(){return o.goBack()}),i(5,"mat-icon"),n(6,"arrow_back"),t()(),i(7,"div"),p(8,Ce,4,1)(9,Ee,4,0),t()(),p(10,Te,15,3),t()()(),p(11,De,5,0,"div",6),p(12,Ie,11,1,"div",7),p(13,Ke,155,79,"div",7)),a&2&&(d(8),c(o.orderResource.hasValue()?8:9),d(2),c(o.orderResource.hasValue()&&!o.orderResource.isLoading()?10:-1),d(),c(o.orderResource.isLoading()?11:-1),d(),c(o.orderResource.error()?12:-1),d(),c(o.orderResource.hasValue()&&!o.orderResource.isLoading()?13:-1))},dependencies:[ie,de,se,le,ae,me,ce,ue,ve,xe,ge,Z,te,ee],styles:["[_nghost-%COMP%]{display:block}"]})};export{ye as ReceiptsDetailsComponent};

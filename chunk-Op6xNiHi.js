import {W as Wt,P as P$1}from'./chunk-8zIcFVp0.js';import {E as E$1}from'./chunk-gYOE8haC.js';import'./chunk-B6bG4aRu.js';import {o}from'./chunk-BfuiMNBJ.js';import {l as li,Z as Zt,e as ei,n as ni,t as ti,J as Jt,r as ri,i as ii,o as oi,s as si,a as ai}from'./chunk-DGa7JVYy.js';import {P as Pi,D as Di,E as Ei,L as Lt$3,Y as Yt}from'./chunk-Czm9IqKq.js';import'./chunk-TKOr3Hul.js';import {H as Ht$1,P,G,L as Lt$2}from'./chunk-DkGygpyH.js';import'./chunk-DrhrHbYK.js';import {y,h as W,F,S as h,M as Mt$1,dT as qe,b as Me,a7 as V,a6 as Xe,ar as C,A as Av,C as Cn,N as Nt$1,c as yt$1,L as Lt$1,O as Ot$1,ah as aa,a2 as $t$1,j as an,p as pn,k as dn,f as fo,l as II,cN as wa,J as Jd,d as Xy,D as Da,o as oy,cO as Ma,G as Gd,s as CI,t as tm,i as iy,q as gy,r as Lc,T as Ty,P as Pc,aj as Ay,m as mf,e as Na,W as Wd,dU as Tf,ac as jd,dV as iI,aq as lf,n as DI,ap as pI,dW as sI,cP as vf,u as cy,ao as sy,w as ly,bQ as hI,dX as yf,au as bu}from'./main-CD2M3L55.js';import'./chunk-DIydUpE2.js';import'./chunk-ClVNkcNO.js';import {X,J}from'./chunk-Bs4XXXUC.js';import {B,j,z,k,E,S}from'./chunk-ByfED6VZ.js';import'./chunk-vCJd3wfN.js';var at=()=>[],Ze=()=>["product","options","quantity","price","subtotal"],ot=a=>["/menu/hms/front-desk/reservations",a];function rt(a,e){if(a&1){let o=gy();fo(0,"button",7)(1,"mat-icon"),Xy(2),Da(),Xy(3),Da(),fo(4,"mat-menu",null,0)(6,"button",8),Jd("click",function(){Lc(o);let u=Ty();return Pc(u.exportReceipt())}),fo(7,"mat-icon"),Xy(8,"receipt"),Da(),fo(9,"span"),Xy(10,"Generate Receipt"),Da()(),fo(11,"button",8),Jd("click",function(){Lc(o);let u=Ty();return Pc(u.exportInvoice())}),fo(12,"mat-icon"),Xy(13,"description"),Da(),fo(14,"span"),Xy(15,"Generate Invoice"),Da()()();}if(a&2){let o=Ay(5),r=Ty();Gd("matMenuTriggerFor",o)("disabled",r.exporting()),tm(2),mf(r.exporting()?"refresh":"print"),tm(),Na(" ",r.exporting()?"Exporting...":"Export"," ");}}function lt(a,e){a&1&&(fo(0,"div",4),Wd(1,"mat-spinner",9),Da());}function dt(a,e){if(a&1){let o=gy();fo(0,"div",5)(1,"mat-card",10)(2,"mat-card-content",11)(3,"mat-icon",12),Xy(4,"error_outline"),Da(),fo(5,"h3",13),Xy(6,"Failed to Load Receipt"),Da(),fo(7,"p",14),Xy(8),Da(),fo(9,"button",15),Jd("click",function(){Lc(o);let u=Ty();return Pc(u.goBack())}),Xy(10," Back to Receipts "),Da()()()();}if(a&2){let o=Ty();tm(8),mf(o.orderResource.error()?.message||"An error occurred");}}function st(a,e){if(a&1&&(fo(0,"mat-card",16)(1,"mat-card-content",63)(2,"mat-icon",64),Xy(3,"schedule"),Da(),fo(4,"div")(5,"h3",57),Xy(6,"Scheduled Delivery"),Da(),fo(7,"p",23),Xy(8," This order is scheduled for "),fo(9,"strong"),Xy(10),Da(),Xy(11," at "),fo(12,"strong"),Xy(13),Da()()()()()),a&2){Ty();let o=sI(0);tm(10),mf(o.deliveryTime.date),tm(3),mf(o.deliveryTime.time);}}function ct(a,e){if(a&1&&(fo(0,"mat-card",17)(1,"mat-card-content",63)(2,"mat-icon",65),Xy(3,"card_giftcard"),Da(),fo(4,"div")(5,"h3",57),Xy(6,"\u{1F381} Gift Order"),Da(),fo(7,"p",23),Xy(8),Da()()()()),a&2){Ty();let o=sI(0);tm(8),Na(" This is a gift order ",o.receiver?.surprise?"(Surprise)":""," ");}}function mt(a,e){if(a&1&&(fo(0,"mat-chip",26),Xy(1),Da()),a&2){Ty();let o=sI(0);tm(),Na(" ",o.salesChannel," ");}}function pt(a,e){if(a&1&&(fo(0,"div",33)(1,"label",30),Xy(2,"Note"),Da(),fo(3,"div",66),Xy(4),Da()()),a&2){Ty();let o=sI(0);tm(4),mf(o.note);}}function xt(a,e){a&1&&(fo(0,"th",67),Xy(1,"Product"),Da());}function ut(a,e){if(a&1&&Wd(0,"img",70),a&2){let o=Ty().$implicit;Gd("src",o.image,bu)("alt",o.name);}}function vt(a,e){a&1&&(fo(0,"div",71)(1,"mat-icon",73),Xy(2,"image"),Da()());}function ft(a,e){if(a&1&&(fo(0,"div",72),Xy(1),Da()),a&2){let o=Ty().$implicit;tm(),mf(o.description);}}function gt(a,e){if(a&1&&(fo(0,"td",68)(1,"div",69),oy(2,ut,1,2,"img",70)(3,vt,3,0,"div",71),fo(4,"div")(5,"div",57),Xy(6),Da(),oy(7,ft,2,1,"div",72),Da()()()),a&2){let o=e.$implicit;tm(2),iy(o.image?2:3),tm(4),mf(o.name),tm(),iy(o.description?7:-1);}}function bt(a,e){a&1&&(fo(0,"th",67),Xy(1,"Options"),Da());}function yt(a,e){if(a&1&&(Xy(0),II(1,"currency")),a&2){let o=Ty().$implicit,r=Ty(4);Na(" (",CI(1,1,o.price,r.currency()),") ");}}function _t(a,e){if(a&1&&(fo(0,"mat-chip",75),Xy(1),oy(2,yt,2,4),Xy(3),Da()),a&2){let o=e.$implicit;tm(),Na(" ",o.name," "),tm(),iy(o.price?2:-1),tm(),Na(" \xD7",o.quantity," ");}}function Ct(a,e){if(a&1&&(fo(0,"div",74),cy(1,_t,4,3,"mat-chip",75,sy),Da()),a&2){let o=Ty().$implicit;tm(),ly(o.options);}}function ht(a,e){a&1&&(fo(0,"span",73),Xy(1,"-"),Da());}function St(a,e){if(a&1&&(fo(0,"td",68),oy(1,Ct,3,0,"div",74)(2,ht,2,0,"span",73),Da()),a&2){let o=e.$implicit;tm(),iy(o.options&&o.options.length>0?1:2);}}function Et(a,e){a&1&&(fo(0,"th",76),Xy(1,"Qty"),Da());}function $t(a,e){if(a&1&&(fo(0,"td",77)(1,"span",78),Xy(2),Da()()),a&2){let o=e.$implicit;tm(2),Na(" ",o.quantity," ");}}function Dt(a,e){a&1&&(fo(0,"th",79),Xy(1,"Price"),Da());}function Tt(a,e){if(a&1&&(fo(0,"td",80),Xy(1),II(2,"currency"),Da()),a&2){let o=e.$implicit,r=Ty(2);tm(),Na(" ",CI(2,1,o.price,r.currency())," ");}}function wt(a,e){a&1&&(fo(0,"th",79),Xy(1,"Subtotal"),Da());}function Rt(a,e){if(a&1&&(fo(0,"td",81),Xy(1),II(2,"currency"),Da()),a&2){let o=e.$implicit,r=Ty(2);tm(),Na(" ",CI(2,1,r.getProductSubtotal(o),r.currency())," ");}}function It(a,e){a&1&&Wd(0,"tr",82);}function kt(a,e){a&1&&Wd(0,"tr",83);}function Mt(a,e){if(a&1&&(fo(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title"),Xy(3," Customer "),Da()(),fo(4,"mat-card-content",35)(5,"mat-list")(6,"mat-list-item")(7,"span",84),Xy(8,"Name"),Da(),fo(9,"span",85),Xy(10),Da()(),fo(11,"mat-list-item")(12,"span",84),Xy(13,"Phone"),Da(),fo(14,"span",85),Xy(15),Da()(),fo(16,"mat-list-item")(17,"span",84),Xy(18,"Email"),Da(),fo(19,"span",86),Xy(20),Da()()()()()),a&2){Ty();let o=sI(0);tm(10),mf(o.user?.name||"N/A"),tm(5),mf(o.user?.phoneNumber||"N/A"),tm(5),mf(o.user?.email||"N/A");}}function Pt(a,e){if(a&1&&(fo(0,"mat-list-item")(1,"span",84),Xy(2,"Nationality"),Da(),fo(3,"span",85),Xy(4),Da()()),a&2){Ty(2);let o=sI(0);tm(4),mf(o.guest?.nationality);}}function Nt(a,e){if(a&1&&(fo(0,"mat-list-item")(1,"span",84),Xy(2,"Reservation"),Da(),fo(3,"span",85)(4,"a",88),Xy(5," View Reservation "),Da()()()),a&2){Ty(2);let o=sI(0);tm(4),Gd("routerLink",hI(1,ot,o.reservation));}}function At(a,e){if(a&1&&(fo(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title",87)(3,"mat-icon"),Xy(4,"person"),Da(),Xy(5," Guest "),Da()(),fo(6,"mat-card-content",35)(7,"mat-list")(8,"mat-list-item")(9,"span",84),Xy(10,"Name"),Da(),fo(11,"span",85),Xy(12),Da()(),fo(13,"mat-list-item")(14,"span",84),Xy(15,"Phone"),Da(),fo(16,"span",85),Xy(17),Da()(),fo(18,"mat-list-item")(19,"span",84),Xy(20,"Email"),Da(),fo(21,"span",86),Xy(22),Da()(),oy(23,Pt,5,1,"mat-list-item"),oy(24,Nt,6,3,"mat-list-item"),Da()()()),a&2){Ty();let o=sI(0);tm(12),vf("",o.guest?.firstName," ",o.guest?.lastName),tm(5),mf(o.guest?.phone||"N/A"),tm(5),mf(o.guest?.email||"N/A"),tm(),iy(o.guest?.nationality?23:-1),tm(),iy(o.reservation?24:-1);}}function Lt(a,e){if(a&1&&(fo(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title",87),Xy(3," Staff "),Da()(),fo(4,"mat-card-content",35)(5,"mat-list")(6,"mat-list-item")(7,"span",84),Xy(8,"Name"),Da(),fo(9,"span",85),Xy(10),Da()(),fo(11,"mat-list-item")(12,"span",84),Xy(13,"Phone"),Da(),fo(14,"span",85),Xy(15),Da()(),fo(16,"mat-list-item")(17,"span",84),Xy(18,"Email"),Da(),fo(19,"span",86),Xy(20),Da()()()()()),a&2){Ty();let o=sI(0);tm(10),mf(o.staff?.name||"N/A"),tm(5),mf(o.staff?.phoneNumber||"N/A"),tm(5),mf(o.staff?.email||"N/A");}}function zt(a,e){a&1&&(fo(0,"mat-chip",89),Xy(1,"Surprise"),Da());}function Bt(a,e){if(a&1&&(fo(0,"div")(1,"label",30),Xy(2,"Delivery Address"),Da(),fo(3,"div",32),Xy(4),Da()()),a&2){Ty(2);let o=sI(0);tm(4),yf(" ",o.receiver.address.name," ",o.receiver.address.administrativeArea," ",o.receiver.address.locality," ");}}function Ft(a,e){if(a&1&&(fo(0,"div")(1,"label",30),Xy(2,"Gift Note"),Da(),fo(3,"div",91),Xy(4),Da()()),a&2){Ty(2);let o=sI(0);tm(4),mf(o.receiver.note);}}function Ot(a,e){if(a&1&&(fo(0,"mat-card",53)(1,"mat-card-header")(2,"mat-card-title",87),Xy(3," Gift Receiver "),oy(4,zt,2,0,"mat-chip",89),Da()(),fo(5,"mat-card-content")(6,"div",90)(7,"div")(8,"label",30),Xy(9,"Name"),Da(),fo(10,"div",32),Xy(11),Da()(),fo(12,"div")(13,"label",30),Xy(14,"Phone"),Da(),fo(15,"div",32),Xy(16),Da()(),oy(17,Bt,5,3,"div"),oy(18,Ft,5,1,"div"),Da()()()),a&2){Ty();let o=sI(0);tm(4),iy(o.receiver.surprise?4:-1),tm(7),mf(o.receiver.name||"N/A"),tm(5),mf(o.receiver.phoneNumber||"N/A"),tm(),iy(o.receiver.address?17:-1),tm(),iy(o.receiver.note?18:-1);}}function Ut(a,e){if(a&1&&(fo(0,"div")(1,"label",30),Xy(2,"Contact Phone"),Da(),fo(3,"div",32),Xy(4),Da()()),a&2){Ty(2);let o=sI(0);tm(4),mf(o.shipping.phone);}}function Vt(a,e){if(a&1&&(fo(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title"),Xy(3," Shipping "),Da()(),fo(4,"mat-card-content")(5,"div",54)(6,"div")(7,"label",30),Xy(8,"Address"),Da(),fo(9,"div",32),Xy(10),Da()(),oy(11,Ut,5,1,"div"),Da()()()),a&2){Ty();let o=sI(0);tm(10),mf(o.shipping?.name||"N/A"),tm(),iy(o.shipping?.phone?11:-1);}}function jt(a,e){if(a&1&&(fo(0,"div",55)(1,"span",56),Xy(2,"Discount:"),Da(),fo(3,"span",92),Xy(4),II(5,"currency"),Da()()),a&2){Ty();let o=sI(0),r=Ty();tm(4),Na("-",CI(5,1,o.discount,r.currency()));}}function Ht(a,e){if(a&1&&(fo(0,"div",58)(1,"div",55)(2,"span",93)(3,"mat-icon",94),Xy(4,"local_taxi"),Da(),Xy(5," Driver Tip: "),Da(),fo(6,"span",95),Xy(7),II(8,"currency"),Da()()()),a&2){Ty();let o=sI(0),r=Ty();tm(7),mf(CI(8,1,o.driverTip,r.currency()));}}function Gt(a,e){if(a&1&&(fo(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title"),Xy(3," Revenue Breakdown "),Da()(),fo(4,"mat-card-content")(5,"div",54)(6,"div",96)(7,"div",97)(8,"span",98),Xy(9,"Vendor Commission"),Da(),fo(10,"mat-chip",99),Xy(11),Da()(),fo(12,"div",100),Xy(13),II(14,"currency"),Da()(),fo(15,"div",101)(16,"div",97)(17,"span",102),Xy(18,"Vendor Receives"),Da()(),fo(19,"div",103),Xy(20),II(21,"currency"),Da()(),fo(22,"div",104)(23,"div",97)(24,"span",105),Xy(25,"Platform Receives"),Da()(),fo(26,"div",106),Xy(27),II(28,"currency"),Da()()()()()),a&2){Ty();let o=sI(0),r=Ty();tm(11),Na("",o.vendorCommission,"%"),tm(2),mf(CI(14,4,o.vendorCommissionAmount,r.currency())),tm(7),Na(" ",CI(21,7,o.subTotal-o.vendorCommissionAmount,r.currency())," "),tm(7),Na(" ",CI(28,10,o.total-(o.subTotal-o.vendorCommissionAmount),r.currency())," ");}}function qt(a,e){if(a&1&&(Tf(0),fo(1,"div",6),oy(2,st,14,2,"mat-card",16),oy(3,ct,9,1,"mat-card",17),fo(4,"mat-card",18)(5,"mat-card-content",19)(6,"div",20)(7,"div",21)(8,"div")(9,"h2",22),Xy(10),Da(),fo(11,"p",23),Xy(12),II(13,"date"),Da()()(),fo(14,"div",24)(15,"div",25)(16,"mat-chip"),Xy(17),II(18,"titlecase"),Da(),oy(19,mt,2,1,"mat-chip",26),Da()()()()(),fo(20,"div",27)(21,"div",28)(22,"mat-card",10)(23,"mat-card-header")(24,"mat-card-title"),Xy(25," Order Information "),Da()(),fo(26,"mat-card-content")(27,"div",29)(28,"div")(29,"label",30),Xy(30,"Order Reference"),Da(),fo(31,"div",31),Xy(32),Da()(),fo(33,"div")(34,"label",30),Xy(35,"Order Date"),Da(),fo(36,"div",32),Xy(37),II(38,"date"),Da()(),fo(39,"div")(40,"label",30),Xy(41,"Payment Method"),Da(),fo(42,"div",32),Xy(43),II(44,"titlecase"),Da()(),fo(45,"div")(46,"label",30),Xy(47,"Payment Status"),Da(),fo(48,"mat-chip"),Xy(49),II(50,"titlecase"),Da()(),fo(51,"div")(52,"label",30),Xy(53,"Order Type"),Da(),fo(54,"div",32),Xy(55),II(56,"titlecase"),Da()(),fo(57,"div")(58,"label",30),Xy(59,"Delivery Type"),Da(),fo(60,"div",32),Xy(61),II(62,"titlecase"),Da()(),oy(63,pt,5,1,"div",33),Da()()(),fo(64,"mat-card",34)(65,"mat-card-header")(66,"mat-card-title"),Xy(67," Order Items "),Da()(),fo(68,"mat-card-content",35)(69,"div",36)(70,"table",37),wa(71,38),jd(72,xt,2,0,"th",39)(73,gt,8,3,"td",40),Ma(),wa(74,41),jd(75,bt,2,0,"th",39)(76,St,3,1,"td",40),Ma(),wa(77,42),jd(78,Et,2,0,"th",43)(79,$t,3,1,"td",44),Ma(),wa(80,45),jd(81,Dt,2,0,"th",46)(82,Tt,3,4,"td",47),Ma(),wa(83,48),jd(84,wt,2,0,"th",46)(85,Rt,3,4,"td",49),Ma(),jd(86,It,1,0,"tr",50)(87,kt,1,0,"tr",51),Da()()()()(),fo(88,"div",52),oy(89,Mt,21,3,"mat-card",10),oy(90,At,25,6,"mat-card",10),oy(91,Lt,21,3,"mat-card",10),oy(92,Ot,19,5,"mat-card",53),oy(93,Vt,12,2,"mat-card",10),fo(94,"mat-card",10)(95,"mat-card-header")(96,"mat-card-title"),Xy(97," Order Summary "),Da()(),fo(98,"mat-card-content")(99,"div",54)(100,"div",55)(101,"span",56),Xy(102,"Subtotal:"),Da(),fo(103,"span",57),Xy(104),II(105,"currency"),Da()(),fo(106,"div",55)(107,"span",56),Xy(108,"Service Fee:"),Da(),fo(109,"span",57),Xy(110),II(111,"currency"),Da()(),fo(112,"div",55)(113,"span",56),Xy(114,"Shipping Fee:"),Da(),fo(115,"span",57),Xy(116),II(117,"currency"),Da()(),oy(118,jt,6,4,"div",55),oy(119,Ht,9,4,"div",58),Da()(),fo(120,"mat-card-actions",59)(121,"div",60)(122,"span",61),Xy(123,"Total:"),Da(),fo(124,"span",62),Xy(125),II(126,"currency"),Da()()()(),oy(127,Gt,29,13,"mat-card",10),Da()()()),a&2){let o=Ty(),r=iI(o.orderResource.value());tm(2),iy(r.deliveryTime?.name==="Schedule Delivery"?2:-1),tm(),iy(r.gift?3:-1),tm(7),mf(r.reference),tm(2),Na(" Created on ",CI(13,53,r.createdAt,"medium")," "),tm(4),lf("!bg-green-100",r.category==="complete")("!text-green-800",r.category==="complete")("!bg-yellow-100",r.category==="pending")("!text-yellow-800",r.category==="pending")("!bg-red-100",r.category==="cancel")("!text-red-800",r.category==="cancel"),tm(),Na(" ",DI(18,56,r.category)," "),tm(2),iy(r.salesChannel?19:-1),tm(13),mf(r.reference),tm(5),mf(CI(38,58,r.createdAt,"medium")),tm(6),mf(DI(44,61,r.payment)),tm(5),lf("!bg-green-100",r.paymentStatus==="paid")("!text-green-800",r.paymentStatus==="paid")("!bg-yellow-100",r.paymentStatus==="pending")("!text-yellow-800",r.paymentStatus==="pending")("!bg-red-100",r.paymentStatus==="failed")("!text-red-800",r.paymentStatus==="failed"),tm(),Na(" ",DI(50,63,r.paymentStatus)," "),tm(6),mf(DI(56,65,r.orderType)),tm(6),mf(DI(62,67,r.deliveryType)),tm(2),iy(r.note?63:-1),tm(7),Gd("dataSource",r.cart?.products||pI(81,at)),tm(16),Gd("matHeaderRowDef",pI(82,Ze)),tm(),Gd("matRowDefColumns",pI(83,Ze)),tm(2),iy(r.user?89:-1),tm(),iy(r.guest?90:-1),tm(),iy(r.staff?91:-1),tm(),iy(r.gift&&r.receiver?92:-1),tm(),iy(r.shipping?93:-1),tm(11),mf(CI(105,69,r.subTotal,o.currency())),tm(6),mf(CI(111,72,r.serviceFee,o.currency())),tm(6),mf(CI(117,75,r.shippingFee,o.currency())),tm(2),iy(r.discount?118:-1),tm(),iy(r.driverTip?119:-1),tm(6),mf(CI(126,78,r.total,o.currency())),tm(2),iy(r.vendorCommission&&r.vendorCommissionAmount?127:-1);}}var et=class a{route=y(W);router=y(F);orderService=y(o);storeService=y(h);snackBar=y(Mt$1);location=y(qe);exporting=Me(false);orderResource=V({params:()=>({id:this.route.snapshot.paramMap.get("id")}),stream:({params:e})=>this.orderService.getOrder(e.id)});currency=Xe(()=>this.storeService.getStoreLocally?.currencyCode||"NGN");getProductSubtotal(e){let o=(e.price||0)*(e.quantity||0),r=(e.options||[]).reduce((u,y)=>u+(y.price||0)*(y.quantity||0),0);return o+r}getCurrency(){return this.storeService.getStoreLocally?.currencyCode||"NGN"}goBack(){this.location.back();}exportReceipt(){return C(this,null,function*(){yield this.exportDocument("receipt");})}exportInvoice(){return C(this,null,function*(){yield this.exportDocument("invoice");})}exportDocument(e){return C(this,null,function*(){let o=this.orderResource.value();if(!o){this.snackBar.open("Order data not available","Close",{duration:3e3});return}let r=this.currency();if(!r){this.snackBar.open("Currency information not available","Close",{duration:3e3});return}this.exporting.set(true);try{let u=e==="receipt"?this.generatePrintableReceipt(o,r):this.generatePrintableInvoice(o,r),y=e==="receipt"?800:1e3,_=e==="receipt"?900:1e3,C=window.open("","_blank",`width=${y},height=${_}`);C?(C.document.write(u),C.document.close(),C.focus(),setTimeout(()=>{C.print();},500)):this.snackBar.open("Please allow pop-ups to export","Close",{duration:3e3});}catch(u){console.error(`Error exporting ${e}:`,u),this.snackBar.open(`Failed to export ${e}`,"Close",{duration:3e3});}finally{this.exporting.set(false);}})}generatePrintableReceipt(e,o){let r=g=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:o,currencyDisplay:"symbol"}).format(g)}catch(L){return console.warn(`Invalid currency code: ${o}, using USD`),new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(g)}},u=g=>new Date(g).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),y=this.storeService.getStoreLocally,_=y?.name||"Store",C=y?.contactInfo?.phone||"",R=y?.contactInfo?.address||"",N=e.deliveryTime?.name==="Schedule Delivery"?`
      <div class="alert-section scheduled">
        <div class="alert-icon">\u{1F4C5}</div>
        <div class="alert-content">
          <div class="alert-title">SCHEDULED DELIVERY</div>
          <div class="alert-text">${e.deliveryTime.date} at ${e.deliveryTime.time}</div>
        </div>
      </div>
    `:"",A=e.gift&&e.receiver?`
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
    `:"",I=e.cart?.products?.map(g=>{let L=g.options?.length>0?g.options.map(T=>`<div class="option-line">  + ${T.name} ${T.price?"("+r(T.price)+")":""} x${T.quantity}</div>`).join(""):"",V=this.getProductSubtotal(g);return `
        <div class="product-item">
          <div class="product-header">
            <span class="product-name">${g.quantity}x ${g.name}</span>
            <span class="product-price">${r(V)}</span>
          </div>
          ${L}
          <div class="product-unit-price">@ ${r(g.price)} each</div>
        </div>
      `}).join("")||"",k=e.vendorCommission&&e.vendorCommissionAmount?`
      <div class="section-divider"></div>
      <div class="commission-section">
        <div class="section-title">REVENUE BREAKDOWN</div>
        <div class="commission-item">
          <span>Vendor Commission (${e.vendorCommission}%)</span>
          <span>${r(e.vendorCommissionAmount)}</span>
        </div>
        <div class="commission-item">
          <span>Vendor Receives</span>
          <span>${r(e.subTotal-e.vendorCommissionAmount)}</span>
        </div>
        <div class="commission-item">
          <span>Platform Receives</span>
          <span>${r(e.total-(e.subTotal-e.vendorCommissionAmount))}</span>
        </div>
      </div>
    `:"";return `
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
          <div class="store-name">${_}</div>
          ${C?`<div class="store-info">${C}</div>`:""}
          ${R?`<div class="store-info">${R}</div>`:""}
          <div class="receipt-title">RECEIPT</div>
          <div class="order-ref">Order: ${e.reference}</div>
          <div class="order-date">${u(e.createdAt)}</div>
        </div>

        <!-- Alerts -->
        ${N}
        ${A}

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
        ${I}

        <!-- Totals -->
        <div class="totals-section">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${r(e.subTotal)}</span>
          </div>
          <div class="total-line">
            <span>Service Fee:</span>
            <span>${r(e.serviceFee)}</span>
          </div>
          <div class="total-line">
            <span>Shipping Fee:</span>
            <span>${r(e.shippingFee)}</span>
          </div>
          ${e.discount?`
          <div class="total-line">
            <span>Discount:</span>
            <span>-${r(e.discount)}</span>
          </div>
          `:""}
          <div class="total-line grand">
            <span>TOTAL:</span>
            <span>${r(e.total)}</span>
          </div>
          ${e.driverTip?`
          <div class="total-line tip">
            <span>Driver Tip:</span>
            <span>${r(e.driverTip)}</span>
          </div>
          `:""}
        </div>

        ${k}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-message">THANK YOU FOR YOUR BUSINESS!</div>
          <div>Printed: ${u(new Date().toISOString())}</div>
        </div>
      </body>
      </html>
    `}generatePrintableInvoice(e,o){let r=b=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:o,currencyDisplay:"symbol"}).format(b)}catch(G){return console.warn(`Invalid currency code: ${o}, using USD`),new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(b)}},u=b=>new Date(b).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),y=b=>new Date(b).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),_=this.storeService.getStoreLocally,C=_?.name||"Store",R=_?.contactInfo?.phone||"",N=_?.contactInfo?.email||"",A=_?.contactInfo?.address||"",I=_?.contactInfo?.city||"",k=_?.contactInfo?.state||"",g=_?.contactInfo?.country||"",L=e.deliveryTime?.name==="Schedule Delivery"?`
      <div class="alert-box scheduled">
        <div class="alert-icon">\u{1F4C5}</div>
        <div class="alert-content">
          <div class="alert-title">Scheduled Delivery</div>
          <div class="alert-text">This order is scheduled for <strong>${e.deliveryTime.date}</strong> at <strong>${e.deliveryTime.time}</strong></div>
        </div>
      </div>
    `:"",V=e.gift&&e.receiver?`
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
    `:"",T=e.cart?.products?.map((b,G)=>{let it=b.options?.length>0?`<br><small style="color: #666;">${b.options.map(z=>`+ ${z.name} ${z.price?"("+r(z.price)+")":""} x${z.quantity}`).join("<br>")}</small>`:"",nt=this.getProductSubtotal(b);return `
        <tr>
          <td style="text-align: center;">${G+1}</td>
          <td>${b.name}${it}</td>
          <td style="text-align: center;">${b.quantity}</td>
          <td style="text-align: right;">${r(b.price)}</td>
          <td style="text-align: right;"><strong>${r(nt)}</strong></td>
        </tr>
      `}).join("")||"",tt=e.vendorCommission&&e.vendorCommissionAmount?`
      <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #374151; text-transform: uppercase;">Revenue Breakdown</h3>
        <table style="width: 100%; font-size: 12px;">
          <tr style="background: #dbeafe;">
            <td style="padding: 10px; border-radius: 4px;">Vendor Commission (${e.vendorCommission}%)</td>
            <td style="padding: 10px; text-align: right; color: #2563eb; font-weight: bold;">${r(e.vendorCommissionAmount)}</td>
          </tr>
          <tr style="background: #fce7f3;">
            <td style="padding: 10px; border-radius: 4px; padding-top: 5px;">Vendor Receives</td>
            <td style="padding: 10px; text-align: right; color: #db2777; font-weight: bold; padding-top: 5px;">${r(e.subTotal-e.vendorCommissionAmount)}</td>
          </tr>
          <tr style="background: #d1fae5;">
            <td style="padding: 10px; border-radius: 4px; padding-top: 5px;">Platform Receives</td>
            <td style="padding: 10px; text-align: right; color: #059669; font-weight: bold; padding-top: 5px;">${r(e.total-(e.subTotal-e.vendorCommissionAmount))}</td>
          </tr>
        </table>
      </div>
    `:"";return `
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
            <h1>${C}</h1>
            ${A?`<p>${A}</p>`:""}
            ${I||k?`<p>${I}${I&&k?", ":""}${k}</p>`:""}
            ${g?`<p>${g}</p>`:""}
            ${R?`<p>Phone: ${R}</p>`:""}
            ${N?`<p>Email: ${N}</p>`:""}
          </div>
          
          <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-details">
              <div><strong>Invoice #:</strong><span>${e.reference}</span></div>
              <div><strong>Date:</strong><span>${u(e.createdAt)}</span></div>
              <div><strong>Status:</strong><span>${e.category}</span></div>
              <div><strong>Payment:</strong><span>${e.paymentStatus}</span></div>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        ${L}
        ${V}

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
            ${T}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <table class="totals-table">
            <tr class="subtotal">
              <td>Subtotal</td>
              <td>${r(e.subTotal)}</td>
            </tr>
            <tr>
              <td>Service Fee</td>
              <td>${r(e.serviceFee)}</td>
            </tr>
            <tr>
              <td>Shipping Fee</td>
              <td>${r(e.shippingFee)}</td>
            </tr>
            ${e.discount?`
            <tr>
              <td>Discount</td>
              <td>-${r(e.discount)}</td>
            </tr>
            `:""}
            <tr class="grand-total">
              <td>TOTAL DUE</td>
              <td>${r(e.total)}</td>
            </tr>
            ${e.driverTip?`
            <tr class="driver-tip">
              <td>Driver Tip</td>
              <td>${r(e.driverTip)}</td>
            </tr>
            `:""}
          </table>
        </div>

        ${tt}

        <!-- Payment Status -->
        <div class="payment-status ${e.paymentStatus?.toLowerCase()}">
          <h4>Payment Status: ${e.paymentStatus}</h4>
          <p>Payment Method: ${e.payment} | Order Date: ${y(e.createdAt)}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p>Generated on ${y(new Date().toISOString())}</p>
        </div>
      </body>
      </html>
    `}static \u0275fac=function(o){return new(o||a)};static \u0275cmp=Av({type:a,selectors:[["receipts-details"]],decls:11,vars:9,consts:[["exportMenu","matMenu"],[3,"title","subtitle"],["actions",""],["mat-stroked-button","",3,"click"],[1,"flex","justify-center","items-center","py-20"],[1,"max-w-7xl","mx-auto","px-4","py-8"],[1,"max-w-12xl","mx-auto","px-4","py-6"],["matButton","outlined",3,"matMenuTriggerFor","disabled"],["mat-menu-item","",3,"click"],["diameter","50"],["appearance","outlined"],[1,"text-center","py-8"],[1,"!text-6xl","text-red-500","mb-4"],[1,"text-lg","font-semibold","mb-2"],[1,"text-gray-600","mb-4"],["mat-flat-button","","color","warn",3,"click"],["appearance","outlined",1,"mb-4","!border-l-4","!border-l-blue-500"],["appearance","outlined",1,"mb-4","!border-l-4","!border-l-pink-500"],["appearance","outlined",1,"mb-4"],[1,"py-4"],[1,"flex","items-center","justify-between"],[1,"flex","items-center","gap-4"],[1,"text-2xl","font-bold"],[1,"text-sm","text-gray-600"],[1,"text-right","space-y-2"],[1,"flex","gap-2","justify-end"],[1,"!bg-blue-100","!text-blue-800"],[1,"grid","grid-cols-1","lg:grid-cols-3","gap-6"],[1,"lg:col-span-2","space-y-6"],[1,"grid","grid-cols-1","md:grid-cols-2","gap-6","mt-4"],[1,"block","text-sm","font-medium","text-gray-700","mb-1"],[1,"text-lg","font-semibold"],[1,"text-sm"],[1,"md:col-span-2"],["appearance","outlined",1,"PY"],[1,"!p-0"],[1,"overflow-x-auto","py-2"],["mat-table","",1,"w-full",3,"dataSource"],["matColumnDef","product"],["mat-header-cell","",4,"matHeaderCellDef"],["mat-cell","",4,"matCellDef"],["matColumnDef","options"],["matColumnDef","quantity"],["mat-header-cell","","class","text-center",4,"matHeaderCellDef"],["mat-cell","","class","text-center",4,"matCellDef"],["matColumnDef","price"],["mat-header-cell","","class","text-right",4,"matHeaderCellDef"],["mat-cell","","class","text-right font-medium",4,"matCellDef"],["matColumnDef","subtotal"],["mat-cell","","class","text-right font-bold",4,"matCellDef"],["mat-header-row","",4,"matHeaderRowDef"],["mat-row","",4,"matRowDef","matRowDefColumns"],[1,"space-y-6"],["appearance","outlined",1,"!border-l-4","!border-l-pink-500"],[1,"space-y-3","mt-4"],[1,"flex","justify-between","text-sm"],[1,"text-gray-600"],[1,"font-medium"],[1,"border-t","border-gray-300","pt-3","mt-3"],[1,"border-t","border-outline-variant","mt-4","pt-4"],[1,"flex","justify-between","w-full","text-lg"],[1,"font-bold"],[1,"font-bold","text-right"],[1,"flex","items-center","gap-3","py-3"],[1,"text-blue-600"],[1,"text-pink-600"],[1,"text-sm","whitespace-pre-line","bg-amber-50","rounded-md","p-3"],["mat-header-cell",""],["mat-cell",""],[1,"flex","items-center","gap-3","py-2"],[1,"w-12","h-12","rounded","object-cover",3,"src","alt"],[1,"w-12","h-12","bg-gray-200","rounded","flex","items-center","justify-center"],[1,"text-xs","text-gray-500"],[1,"text-gray-400"],[1,"space-y-1"],[1,"!text-xs"],["mat-header-cell","",1,"text-center"],["mat-cell","",1,"text-center"],[1,"inline-flex","items-center","justify-center","w-8","h-8","bg-indigo-100","text-indigo-700","rounded-full","font-semibold","text-sm"],["mat-header-cell","",1,"text-right"],["mat-cell","",1,"text-right","font-medium"],["mat-cell","",1,"text-right","font-bold"],["mat-header-row",""],["mat-row",""],["matListItemTitle",""],["matListItemMeta",""],["matListItemMeta","",1,"break-all"],[1,"flex","items-center","gap-2"],[1,"font-medium","text-indigo-600","hover:text-indigo-800","underline",3,"routerLink"],[1,"!text-xs","!bg-pink-100","!text-pink-700"],[1,"space-y-4","mt-4"],[1,"text-sm","bg-pink-50","p-3","rounded","border","border-pink-100"],[1,"font-medium","text-green-600"],[1,"text-gray-700","flex","items-center","gap-1"],[1,"!text-base","text-amber-500"],[1,"font-semibold","text-amber-600"],[1,"bg-blue-50","border","border-blue-200","rounded-lg","p-4"],[1,"flex","justify-between","items-center","mb-2"],[1,"text-sm","font-medium","text-blue-900"],[1,"!text-xs","!bg-blue-100","!text-blue-700"],[1,"text-2xl","font-bold","text-blue-600"],[1,"bg-pink-50","border","border-pink-200","rounded-lg","p-4"],[1,"text-sm","font-medium","text-pink-900"],[1,"text-2xl","font-bold","text-pink-600"],[1,"bg-green-50","border","border-green-200","rounded-lg","p-4"],[1,"text-sm","font-medium","text-green-900"],[1,"text-2xl","font-bold","text-green-600"]],template:function(o,r){o&1&&(fo(0,"app-page-header",1),II(1,"date"),wa(2,2),fo(3,"button",3),Jd("click",function(){return r.goBack()}),fo(4,"mat-icon"),Xy(5,"arrow_back"),Da(),Xy(6," Back "),Da(),oy(7,rt,16,4),Ma(),Da(),oy(8,lt,2,0,"div",4),oy(9,dt,11,1,"div",5),oy(10,qt,128,84,"div",6)),o&2&&(Gd("title",r.orderResource.hasValue()?"Receipt #"+r.orderResource.value().reference:"Receipt Details")("subtitle",r.orderResource.hasValue()?"Created on "+CI(1,6,r.orderResource.value().createdAt,"medium"):"Loading receipt..."),tm(7),iy(r.orderResource.hasValue()&&!r.orderResource.isLoading()?7:-1),tm(),iy(r.orderResource.isLoading()?8:-1),tm(),iy(r.orderResource.error()?9:-1),tm(),iy(r.orderResource.hasValue()&&!r.orderResource.isLoading()?10:-1));},dependencies:[Cn,B,j,z,k,E,S,Nt$1,yt$1,Lt$1,Ot$1,X,J,Ht$1,P,G,Lt$2,li,Zt,ei,ni,ti,Jt,ri,ii,oi,si,ai,Wt,P$1,E$1,Pi,Di,Ei,Lt$3,Yt,aa,$t$1,an,pn,dn],styles:["[_nghost-%COMP%]{display:block}"],changeDetection:1})};export{et as ReceiptsDetailsComponent};
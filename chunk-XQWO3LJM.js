import{b as Je,f as Xe}from"./chunk-4L4VWXIM.js";import{a as Qe}from"./chunk-YZQZHEMG.js";import"./chunk-LCNY3JPX.js";import{a as Ke}from"./chunk-XJJHORKJ.js";import{a as Be,b as Fe,c as Oe,d as Ue,e as Ve,f as je,g as He,h as Ge,i as qe,j as Ye,k as We}from"./chunk-BAU4EBFS.js";import{a as Pe,c as Ne,f as Ae,g as Le,l as ze}from"./chunk-T7LGKL43.js";import"./chunk-E4PTFC5Z.js";import{a as Te,b as De,c as we,d as Re}from"./chunk-4P4GBQE7.js";import{d as Me}from"./chunk-HJGFVW6K.js";import"./chunk-TVH27JLT.js";import"./chunk-G4CZ6LK2.js";import"./chunk-I564X6SI.js";import{a as ge}from"./chunk-VTDH2LYT.js";import"./chunk-YJCGHVXK.js";import"./chunk-UHBDKNKX.js";import{a as Ie,b as ke}from"./chunk-3ZLH5HUN.js";import"./chunk-O5GCTPYR.js";import"./chunk-EGLRIU4H.js";import{a as fe}from"./chunk-5TL46KBL.js";import"./chunk-53AK2UWQ.js";import"./chunk-BFT2MTJY.js";import{a as Ce,b as he,c as ye,e as Se,f as Ee,h as $e}from"./chunk-JONI64R4.js";import"./chunk-H7INH462.js";import"./chunk-OOL2KACG.js";import"./chunk-KZJMNFJ3.js";import{b as be,c as _e}from"./chunk-G6I3OKXX.js";import{_ as ue,ba as ve}from"./chunk-4Z2XUZY2.js";import{e as ce,g as pe,h as me,l as xe}from"./chunk-F436VINI.js";import{e as oe,l as re,n as le,s as de,u as se}from"./chunk-H22US2IH.js";import{Ac as te,Bc as ie,Cc as v,Gc as U,Hc as ne,Ib as c,Jb as p,Kb as K,Mb as Q,Mc as m,Nb as J,Nc as w,Ob as y,Oc as f,Pb as n,Qb as i,Rb as M,Vb as $,Wb as T,Wc as ae,Ya as Y,Yb as j,ac as P,bb as l,cc as d,fa as S,ka as F,la as O,mc as X,oc as H,qb as W,rc as a,sc as s,tc as u,uc as Z,vc as ee,wa as q,wb as E}from"./chunk-P5WOETP4.js";import{g as B}from"./chunk-GAL4ENT6.js";var at=()=>[],Ze=()=>["product","options","quantity","price","subtotal"],ot=o=>["/menu/hms/front-desk/reservations",o];function rt(o,e){if(o&1){let t=j();n(0,"button",7)(1,"mat-icon"),a(2),i(),a(3),i(),n(4,"mat-menu",null,0)(6,"button",8),P("click",function(){F(t);let x=d();return O(x.exportReceipt())}),n(7,"mat-icon"),a(8,"receipt"),i(),n(9,"span"),a(10,"Generate Receipt"),i()(),n(11,"button",8),P("click",function(){F(t);let x=d();return O(x.exportInvoice())}),n(12,"mat-icon"),a(13,"description"),i(),n(14,"span"),a(15,"Generate Invoice"),i()()()}if(o&2){let t=X(5),r=d();y("matMenuTriggerFor",t)("disabled",r.exporting()),l(2),s(r.exporting()?"refresh":"print"),l(),u(" ",r.exporting()?"Exporting...":"Export"," ")}}function lt(o,e){o&1&&(n(0,"div",4),M(1,"mat-spinner",9),i())}function dt(o,e){if(o&1){let t=j();n(0,"div",5)(1,"mat-card",10)(2,"mat-card-content",11)(3,"mat-icon",12),a(4,"error_outline"),i(),n(5,"h3",13),a(6,"Failed to Load Receipt"),i(),n(7,"p",14),a(8),i(),n(9,"button",15),P("click",function(){F(t);let x=d();return O(x.goBack())}),a(10," Back to Receipts "),i()()()()}if(o&2){let t,r=d();l(8),s(((t=r.orderResource.error())==null?null:t.message)||"An error occurred")}}function st(o,e){if(o&1&&(n(0,"mat-card",16)(1,"mat-card-content",62)(2,"mat-icon",63),a(3,"schedule"),i(),n(4,"div")(5,"h3",56),a(6,"Scheduled Delivery"),i(),n(7,"p",23),a(8," This order is scheduled for "),n(9,"strong"),a(10),i(),a(11," at "),n(12,"strong"),a(13),i()()()()()),o&2){d();let t=v(0);l(10),s(t.deliveryTime.date),l(3),s(t.deliveryTime.time)}}function ct(o,e){if(o&1&&(n(0,"mat-card",17)(1,"mat-card-content",62)(2,"mat-icon",64),a(3,"card_giftcard"),i(),n(4,"div")(5,"h3",56),a(6,"\u{1F381} Gift Order"),i(),n(7,"p",23),a(8),i()()()()),o&2){d();let t=v(0);l(8),u(" This is a gift order ",t.receiver!=null&&t.receiver.surprise?"(Surprise)":""," ")}}function pt(o,e){if(o&1&&(n(0,"mat-chip",26),a(1),i()),o&2){d();let t=v(0);l(),u(" ",t.salesChannel," ")}}function mt(o,e){o&1&&(n(0,"th",65),a(1,"Product"),i())}function xt(o,e){if(o&1&&M(0,"img",68),o&2){let t=d().$implicit;y("src",t.image,Y)("alt",t.name)}}function ut(o,e){o&1&&(n(0,"div",69)(1,"mat-icon",71),a(2,"image"),i()())}function vt(o,e){if(o&1&&(n(0,"div",70),a(1),i()),o&2){let t=d().$implicit;l(),s(t.description)}}function ft(o,e){if(o&1&&(n(0,"td",66)(1,"div",67),c(2,xt,1,2,"img",68)(3,ut,3,0,"div",69),n(4,"div")(5,"div",56),a(6),i(),c(7,vt,2,1,"div",70),i()()()),o&2){let t=e.$implicit;l(2),p(t.image?2:3),l(4),s(t.name),l(),p(t.description?7:-1)}}function gt(o,e){o&1&&(n(0,"th",65),a(1,"Options"),i())}function bt(o,e){if(o&1&&(a(0),m(1,"currency")),o&2){let t=d().$implicit,r=d(4);u(" (",f(1,1,t.price,r.currency()),") ")}}function _t(o,e){if(o&1&&(n(0,"mat-chip",73),a(1),c(2,bt,2,4),a(3),i()),o&2){let t=e.$implicit;l(),u(" ",t.name," "),l(),p(t.price?2:-1),l(),u(" \xD7",t.quantity," ")}}function Ct(o,e){if(o&1&&(n(0,"div",72),Q(1,_t,4,3,"mat-chip",73,K),i()),o&2){let t=d().$implicit;l(),J(t.options)}}function ht(o,e){o&1&&(n(0,"span",71),a(1,"-"),i())}function yt(o,e){if(o&1&&(n(0,"td",66),c(1,Ct,3,0,"div",72)(2,ht,2,0,"span",71),i()),o&2){let t=e.$implicit;l(),p(t.options&&t.options.length>0?1:2)}}function St(o,e){o&1&&(n(0,"th",74),a(1,"Qty"),i())}function Et(o,e){if(o&1&&(n(0,"td",75)(1,"span",76),a(2),i()()),o&2){let t=e.$implicit;l(2),u(" ",t.quantity," ")}}function $t(o,e){o&1&&(n(0,"th",77),a(1,"Price"),i())}function Tt(o,e){if(o&1&&(n(0,"td",78),a(1),m(2,"currency"),i()),o&2){let t=e.$implicit,r=d(2);l(),u(" ",f(2,1,t.price,r.currency())," ")}}function Dt(o,e){o&1&&(n(0,"th",77),a(1,"Subtotal"),i())}function wt(o,e){if(o&1&&(n(0,"td",79),a(1),m(2,"currency"),i()),o&2){let t=e.$implicit,r=d(2);l(),u(" ",f(2,1,r.getProductSubtotal(t),r.currency())," ")}}function Rt(o,e){o&1&&M(0,"tr",80)}function It(o,e){o&1&&M(0,"tr",81)}function kt(o,e){if(o&1&&(n(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title"),a(3," Customer "),i()(),n(4,"mat-card-content",34)(5,"mat-list")(6,"mat-list-item")(7,"span",82),a(8,"Name"),i(),n(9,"span",83),a(10),i()(),n(11,"mat-list-item")(12,"span",82),a(13,"Phone"),i(),n(14,"span",83),a(15),i()(),n(16,"mat-list-item")(17,"span",82),a(18,"Email"),i(),n(19,"span",84),a(20),i()()()()()),o&2){d();let t=v(0);l(10),s((t.user==null?null:t.user.name)||"N/A"),l(5),s((t.user==null?null:t.user.phoneNumber)||"N/A"),l(5),s((t.user==null?null:t.user.email)||"N/A")}}function Mt(o,e){if(o&1&&(n(0,"mat-list-item")(1,"span",82),a(2,"Nationality"),i(),n(3,"span",83),a(4),i()()),o&2){d(2);let t=v(0);l(4),s(t.guest==null?null:t.guest.nationality)}}function Pt(o,e){if(o&1&&(n(0,"mat-list-item")(1,"span",82),a(2,"Reservation"),i(),n(3,"span",83)(4,"a",86),a(5," View Reservation "),i()()()),o&2){d(2);let t=v(0);l(4),y("routerLink",ne(1,ot,t.reservation))}}function Nt(o,e){if(o&1&&(n(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title",85)(3,"mat-icon"),a(4,"person"),i(),a(5," Guest "),i()(),n(6,"mat-card-content",34)(7,"mat-list")(8,"mat-list-item")(9,"span",82),a(10,"Name"),i(),n(11,"span",83),a(12),i()(),n(13,"mat-list-item")(14,"span",82),a(15,"Phone"),i(),n(16,"span",83),a(17),i()(),n(18,"mat-list-item")(19,"span",82),a(20,"Email"),i(),n(21,"span",84),a(22),i()(),c(23,Mt,5,1,"mat-list-item"),c(24,Pt,6,3,"mat-list-item"),i()()()),o&2){d();let t=v(0);l(12),Z("",t.guest==null?null:t.guest.firstName," ",t.guest==null?null:t.guest.lastName),l(5),s((t.guest==null?null:t.guest.phone)||"N/A"),l(5),s((t.guest==null?null:t.guest.email)||"N/A"),l(),p(t.guest!=null&&t.guest.nationality?23:-1),l(),p(t.reservation?24:-1)}}function At(o,e){if(o&1&&(n(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title",85),a(3," Staff "),i()(),n(4,"mat-card-content",34)(5,"mat-list")(6,"mat-list-item")(7,"span",82),a(8,"Name"),i(),n(9,"span",83),a(10),i()(),n(11,"mat-list-item")(12,"span",82),a(13,"Phone"),i(),n(14,"span",83),a(15),i()(),n(16,"mat-list-item")(17,"span",82),a(18,"Email"),i(),n(19,"span",84),a(20),i()()()()()),o&2){d();let t=v(0);l(10),s((t.staff==null?null:t.staff.name)||"N/A"),l(5),s((t.staff==null?null:t.staff.phoneNumber)||"N/A"),l(5),s((t.staff==null?null:t.staff.email)||"N/A")}}function Lt(o,e){o&1&&(n(0,"mat-chip",87),a(1,"Surprise"),i())}function zt(o,e){if(o&1&&(n(0,"div")(1,"label",30),a(2,"Delivery Address"),i(),n(3,"div",32),a(4),i()()),o&2){d(2);let t=v(0);l(4),ee(" ",t.receiver.address.name," ",t.receiver.address.administrativeArea," ",t.receiver.address.locality," ")}}function Bt(o,e){if(o&1&&(n(0,"div")(1,"label",30),a(2,"Gift Note"),i(),n(3,"div",89),a(4),i()()),o&2){d(2);let t=v(0);l(4),s(t.receiver.note)}}function Ft(o,e){if(o&1&&(n(0,"mat-card",52)(1,"mat-card-header")(2,"mat-card-title",85),a(3," Gift Receiver "),c(4,Lt,2,0,"mat-chip",87),i()(),n(5,"mat-card-content")(6,"div",88)(7,"div")(8,"label",30),a(9,"Name"),i(),n(10,"div",32),a(11),i()(),n(12,"div")(13,"label",30),a(14,"Phone"),i(),n(15,"div",32),a(16),i()(),c(17,zt,5,3,"div"),c(18,Bt,5,1,"div"),i()()()),o&2){d();let t=v(0);l(4),p(t.receiver.surprise?4:-1),l(7),s(t.receiver.name||"N/A"),l(5),s(t.receiver.phoneNumber||"N/A"),l(),p(t.receiver.address?17:-1),l(),p(t.receiver.note?18:-1)}}function Ot(o,e){if(o&1&&(n(0,"div")(1,"label",30),a(2,"Contact Phone"),i(),n(3,"div",32),a(4),i()()),o&2){d(2);let t=v(0);l(4),s(t.shipping.phone)}}function Ut(o,e){if(o&1&&(n(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title"),a(3," Shipping "),i()(),n(4,"mat-card-content")(5,"div",53)(6,"div")(7,"label",30),a(8,"Address"),i(),n(9,"div",32),a(10),i()(),c(11,Ot,5,1,"div"),i()()()),o&2){d();let t=v(0);l(10),s((t.shipping==null?null:t.shipping.name)||"N/A"),l(),p(t.shipping!=null&&t.shipping.phone?11:-1)}}function Vt(o,e){if(o&1&&(n(0,"div",54)(1,"span",55),a(2,"Discount:"),i(),n(3,"span",90),a(4),m(5,"currency"),i()()),o&2){d();let t=v(0),r=d();l(4),u("-",f(5,1,t.discount,r.currency()))}}function jt(o,e){if(o&1&&(n(0,"div",57)(1,"div",54)(2,"span",91)(3,"mat-icon",92),a(4,"local_taxi"),i(),a(5," Driver Tip: "),i(),n(6,"span",93),a(7),m(8,"currency"),i()()()),o&2){d();let t=v(0),r=d();l(7),s(f(8,1,t.driverTip,r.currency()))}}function Ht(o,e){if(o&1&&(n(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title"),a(3," Revenue Breakdown "),i()(),n(4,"mat-card-content")(5,"div",53)(6,"div",94)(7,"div",95)(8,"span",96),a(9,"Vendor Commission"),i(),n(10,"mat-chip",97),a(11),i()(),n(12,"div",98),a(13),m(14,"currency"),i()(),n(15,"div",99)(16,"div",95)(17,"span",100),a(18,"Vendor Receives"),i()(),n(19,"div",101),a(20),m(21,"currency"),i()(),n(22,"div",102)(23,"div",95)(24,"span",103),a(25,"Platform Receives"),i()(),n(26,"div",104),a(27),m(28,"currency"),i()()()()()),o&2){d();let t=v(0),r=d();l(11),u("",t.vendorCommission,"%"),l(2),s(f(14,4,t.vendorCommissionAmount,r.currency())),l(7),u(" ",f(21,7,t.subTotal-t.vendorCommissionAmount,r.currency())," "),l(7),u(" ",f(28,10,t.total-(t.subTotal-t.vendorCommissionAmount),r.currency())," ")}}function Gt(o,e){if(o&1&&(te(0),n(1,"div",6),c(2,st,14,2,"mat-card",16),c(3,ct,9,1,"mat-card",17),n(4,"mat-card",18)(5,"mat-card-content",19)(6,"div",20)(7,"div",21)(8,"div")(9,"h2",22),a(10),i(),n(11,"p",23),a(12),m(13,"date"),i()()(),n(14,"div",24)(15,"div",25)(16,"mat-chip"),a(17),m(18,"titlecase"),i(),c(19,pt,2,1,"mat-chip",26),i()()()()(),n(20,"div",27)(21,"div",28)(22,"mat-card",10)(23,"mat-card-header")(24,"mat-card-title"),a(25," Order Information "),i()(),n(26,"mat-card-content")(27,"div",29)(28,"div")(29,"label",30),a(30,"Order Reference"),i(),n(31,"div",31),a(32),i()(),n(33,"div")(34,"label",30),a(35,"Order Date"),i(),n(36,"div",32),a(37),m(38,"date"),i()(),n(39,"div")(40,"label",30),a(41,"Payment Method"),i(),n(42,"div",32),a(43),m(44,"titlecase"),i()(),n(45,"div")(46,"label",30),a(47,"Payment Status"),i(),n(48,"mat-chip"),a(49),m(50,"titlecase"),i()(),n(51,"div")(52,"label",30),a(53,"Order Type"),i(),n(54,"div",32),a(55),m(56,"titlecase"),i()(),n(57,"div")(58,"label",30),a(59,"Delivery Type"),i(),n(60,"div",32),a(61),m(62,"titlecase"),i()()()()(),n(63,"mat-card",33)(64,"mat-card-header")(65,"mat-card-title"),a(66," Order Items "),i()(),n(67,"mat-card-content",34)(68,"div",35)(69,"table",36),$(70,37),E(71,mt,2,0,"th",38)(72,ft,8,3,"td",39),T(),$(73,40),E(74,gt,2,0,"th",38)(75,yt,3,1,"td",39),T(),$(76,41),E(77,St,2,0,"th",42)(78,Et,3,1,"td",43),T(),$(79,44),E(80,$t,2,0,"th",45)(81,Tt,3,4,"td",46),T(),$(82,47),E(83,Dt,2,0,"th",45)(84,wt,3,4,"td",48),T(),E(85,Rt,1,0,"tr",49)(86,It,1,0,"tr",50),i()()()()(),n(87,"div",51),c(88,kt,21,3,"mat-card",10),c(89,Nt,25,6,"mat-card",10),c(90,At,21,3,"mat-card",10),c(91,Ft,19,5,"mat-card",52),c(92,Ut,12,2,"mat-card",10),n(93,"mat-card",10)(94,"mat-card-header")(95,"mat-card-title"),a(96," Order Summary "),i()(),n(97,"mat-card-content")(98,"div",53)(99,"div",54)(100,"span",55),a(101,"Subtotal:"),i(),n(102,"span",56),a(103),m(104,"currency"),i()(),n(105,"div",54)(106,"span",55),a(107,"Service Fee:"),i(),n(108,"span",56),a(109),m(110,"currency"),i()(),n(111,"div",54)(112,"span",55),a(113,"Shipping Fee:"),i(),n(114,"span",56),a(115),m(116,"currency"),i()(),c(117,Vt,6,4,"div",54),c(118,jt,9,4,"div",57),i()(),n(119,"mat-card-actions",58)(120,"div",59)(121,"span",60),a(122,"Total:"),i(),n(123,"span",61),a(124),m(125,"currency"),i()()()(),c(126,Ht,29,13,"mat-card",10),i()()()),o&2){let t=d(),r=ie(t.orderResource.value());l(2),p((r.deliveryTime==null?null:r.deliveryTime.name)==="Schedule Delivery"?2:-1),l(),p(r.gift?3:-1),l(7),s(r.reference),l(2),u(" Created on ",f(13,52,r.createdAt,"medium")," "),l(4),H("!bg-green-100",r.category==="complete")("!text-green-800",r.category==="complete")("!bg-yellow-100",r.category==="pending")("!text-yellow-800",r.category==="pending")("!bg-red-100",r.category==="cancel")("!text-red-800",r.category==="cancel"),l(),u(" ",w(18,55,r.category)," "),l(2),p(r.salesChannel?19:-1),l(13),s(r.reference),l(5),s(f(38,57,r.createdAt,"medium")),l(6),s(w(44,60,r.payment)),l(5),H("!bg-green-100",r.paymentStatus==="paid")("!text-green-800",r.paymentStatus==="paid")("!bg-yellow-100",r.paymentStatus==="pending")("!text-yellow-800",r.paymentStatus==="pending")("!bg-red-100",r.paymentStatus==="failed")("!text-red-800",r.paymentStatus==="failed"),l(),u(" ",w(50,62,r.paymentStatus)," "),l(6),s(w(56,64,r.orderType)),l(6),s(w(62,66,r.deliveryType)),l(8),y("dataSource",(r.cart==null?null:r.cart.products)||U(80,at)),l(16),y("matHeaderRowDef",U(81,Ze)),l(),y("matRowDefColumns",U(82,Ze)),l(2),p(r.user?88:-1),l(),p(r.guest?89:-1),l(),p(r.staff?90:-1),l(),p(r.gift&&r.receiver?91:-1),l(),p(r.shipping?92:-1),l(11),s(f(104,68,r.subTotal,t.currency())),l(6),s(f(110,71,r.serviceFee,t.currency())),l(6),s(f(116,74,r.shippingFee,t.currency())),l(2),p(r.discount?117:-1),l(),p(r.driverTip?118:-1),l(6),s(f(125,77,r.total,t.currency())),l(2),p(r.vendorCommission&&r.vendorCommissionAmount?126:-1)}}var et=class o{route=S(ce);router=S(pe);orderService=S(Ke);storeService=S(ge);snackBar=S(fe);location=S(oe);exporting=q(!1);orderResource=Me({params:()=>({id:this.route.snapshot.paramMap.get("id")}),stream:({params:e})=>this.orderService.getOrder(e.id)});currency=ae(()=>this.storeService.getStoreLocally?.currencyCode||"NGN");getProductSubtotal(e){let t=(e.price||0)*(e.quantity||0),r=(e.options||[]).reduce((x,_)=>x+(_.price||0)*(_.quantity||0),0);return t+r}getCurrency(){return this.storeService.getStoreLocally?.currencyCode||"NGN"}goBack(){this.location.back()}exportReceipt(){return B(this,null,function*(){yield this.exportDocument("receipt")})}exportInvoice(){return B(this,null,function*(){yield this.exportDocument("invoice")})}exportDocument(e){return B(this,null,function*(){let t=this.orderResource.value();if(!t){this.snackBar.open("Order data not available","Close",{duration:3e3});return}let r=this.currency();if(!r){this.snackBar.open("Currency information not available","Close",{duration:3e3});return}this.exporting.set(!0);try{let x=e==="receipt"?this.generatePrintableReceipt(t,r):this.generatePrintableInvoice(t,r),_=e==="receipt"?800:1e3,C=e==="receipt"?900:1e3,h=window.open("","_blank",`width=${_},height=${C}`);h?(h.document.write(x),h.document.close(),h.focus(),setTimeout(()=>{h.print()},500)):this.snackBar.open("Please allow pop-ups to export","Close",{duration:3e3})}catch(x){console.error(`Error exporting ${e}:`,x),this.snackBar.open(`Failed to export ${e}`,"Close",{duration:3e3})}finally{this.exporting.set(!1)}})}generatePrintableReceipt(e,t){let r=g=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:t,currencyDisplay:"symbol"}).format(g)}catch{return console.warn(`Invalid currency code: ${t}, using USD`),new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(g)}},x=g=>new Date(g).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),_=this.storeService.getStoreLocally,C=_?.name||"Store",h=_?.contactInfo?.phone||"",R=_?.contactInfo?.address||"",N=e.deliveryTime?.name==="Schedule Delivery"?`
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
    `:"",I=e.cart?.products?.map(g=>{let L=g.options?.length>0?g.options.map(D=>`<div class="option-line">  + ${D.name} ${D.price?"("+r(D.price)+")":""} x${D.quantity}</div>`).join(""):"",V=this.getProductSubtotal(g);return`
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
          <div class="store-name">${C}</div>
          ${h?`<div class="store-info">${h}</div>`:""}
          ${R?`<div class="store-info">${R}</div>`:""}
          <div class="receipt-title">RECEIPT</div>
          <div class="order-ref">Order: ${e.reference}</div>
          <div class="order-date">${x(e.createdAt)}</div>
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
          <div>Printed: ${x(new Date().toISOString())}</div>
        </div>
      </body>
      </html>
    `}generatePrintableInvoice(e,t){let r=b=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:t,currencyDisplay:"symbol"}).format(b)}catch{return console.warn(`Invalid currency code: ${t}, using USD`),new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(b)}},x=b=>new Date(b).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),_=b=>new Date(b).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),C=this.storeService.getStoreLocally,h=C?.name||"Store",R=C?.contactInfo?.phone||"",N=C?.contactInfo?.email||"",A=C?.contactInfo?.address||"",I=C?.contactInfo?.city||"",k=C?.contactInfo?.state||"",g=C?.contactInfo?.country||"",L=e.deliveryTime?.name==="Schedule Delivery"?`
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
    `:"",D=e.cart?.products?.map((b,G)=>{let it=b.options?.length>0?`<br><small style="color: #666;">${b.options.map(z=>`+ ${z.name} ${z.price?"("+r(z.price)+")":""} x${z.quantity}`).join("<br>")}</small>`:"",nt=this.getProductSubtotal(b);return`
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
            <h1>${h}</h1>
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
              <div><strong>Date:</strong><span>${x(e.createdAt)}</span></div>
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
            ${D}
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
          <p>Payment Method: ${e.payment} | Order Date: ${_(e.createdAt)}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p>Generated on ${_(new Date().toISOString())}</p>
        </div>
      </body>
      </html>
    `}static \u0275fac=function(t){return new(t||o)};static \u0275cmp=W({type:o,selectors:[["receipts-details"]],decls:11,vars:9,consts:[["exportMenu","matMenu"],[3,"title","subtitle"],["actions",""],["mat-stroked-button","",3,"click"],[1,"flex","justify-center","items-center","py-20"],[1,"max-w-7xl","mx-auto","px-4","py-8"],[1,"max-w-12xl","mx-auto","px-4","py-6"],["matButton","outlined",3,"matMenuTriggerFor","disabled"],["mat-menu-item","",3,"click"],["diameter","50"],["appearance","outlined"],[1,"text-center","py-8"],[1,"!text-6xl","text-red-500","mb-4"],[1,"text-lg","font-semibold","mb-2"],[1,"text-gray-600","mb-4"],["mat-flat-button","","color","warn",3,"click"],["appearance","outlined",1,"mb-4","!border-l-4","!border-l-blue-500"],["appearance","outlined",1,"mb-4","!border-l-4","!border-l-pink-500"],["appearance","outlined",1,"mb-4"],[1,"py-4"],[1,"flex","items-center","justify-between"],[1,"flex","items-center","gap-4"],[1,"text-2xl","font-bold"],[1,"text-sm","text-gray-600"],[1,"text-right","space-y-2"],[1,"flex","gap-2","justify-end"],[1,"!bg-blue-100","!text-blue-800"],[1,"grid","grid-cols-1","lg:grid-cols-3","gap-6"],[1,"lg:col-span-2","space-y-6"],[1,"grid","grid-cols-1","md:grid-cols-2","gap-6","mt-4"],[1,"block","text-sm","font-medium","text-gray-700","mb-1"],[1,"text-lg","font-semibold"],[1,"text-sm"],["appearance","outlined",1,"PY"],[1,"!p-0"],[1,"overflow-x-auto","py-2"],["mat-table","",1,"w-full",3,"dataSource"],["matColumnDef","product"],["mat-header-cell","",4,"matHeaderCellDef"],["mat-cell","",4,"matCellDef"],["matColumnDef","options"],["matColumnDef","quantity"],["mat-header-cell","","class","text-center",4,"matHeaderCellDef"],["mat-cell","","class","text-center",4,"matCellDef"],["matColumnDef","price"],["mat-header-cell","","class","text-right",4,"matHeaderCellDef"],["mat-cell","","class","text-right font-medium",4,"matCellDef"],["matColumnDef","subtotal"],["mat-cell","","class","text-right font-bold",4,"matCellDef"],["mat-header-row","",4,"matHeaderRowDef"],["mat-row","",4,"matRowDef","matRowDefColumns"],[1,"space-y-6"],["appearance","outlined",1,"!border-l-4","!border-l-pink-500"],[1,"space-y-3","mt-4"],[1,"flex","justify-between","text-sm"],[1,"text-gray-600"],[1,"font-medium"],[1,"border-t","border-gray-300","pt-3","mt-3"],[1,"border-t","border-outline-variant","mt-4","pt-4"],[1,"flex","justify-between","w-full","text-lg"],[1,"font-bold"],[1,"font-bold","text-right"],[1,"flex","items-center","gap-3","py-3"],[1,"text-blue-600"],[1,"text-pink-600"],["mat-header-cell",""],["mat-cell",""],[1,"flex","items-center","gap-3","py-2"],[1,"w-12","h-12","rounded","object-cover",3,"src","alt"],[1,"w-12","h-12","bg-gray-200","rounded","flex","items-center","justify-center"],[1,"text-xs","text-gray-500"],[1,"text-gray-400"],[1,"space-y-1"],[1,"!text-xs"],["mat-header-cell","",1,"text-center"],["mat-cell","",1,"text-center"],[1,"inline-flex","items-center","justify-center","w-8","h-8","bg-indigo-100","text-indigo-700","rounded-full","font-semibold","text-sm"],["mat-header-cell","",1,"text-right"],["mat-cell","",1,"text-right","font-medium"],["mat-cell","",1,"text-right","font-bold"],["mat-header-row",""],["mat-row",""],["matListItemTitle",""],["matListItemMeta",""],["matListItemMeta","",1,"break-all"],[1,"flex","items-center","gap-2"],[1,"font-medium","text-indigo-600","hover:text-indigo-800","underline",3,"routerLink"],[1,"!text-xs","!bg-pink-100","!text-pink-700"],[1,"space-y-4","mt-4"],[1,"text-sm","bg-pink-50","p-3","rounded","border","border-pink-100"],[1,"font-medium","text-green-600"],[1,"text-gray-700","flex","items-center","gap-1"],[1,"!text-base","text-amber-500"],[1,"font-semibold","text-amber-600"],[1,"bg-blue-50","border","border-blue-200","rounded-lg","p-4"],[1,"flex","justify-between","items-center","mb-2"],[1,"text-sm","font-medium","text-blue-900"],[1,"!text-xs","!bg-blue-100","!text-blue-700"],[1,"text-2xl","font-bold","text-blue-600"],[1,"bg-pink-50","border","border-pink-200","rounded-lg","p-4"],[1,"text-sm","font-medium","text-pink-900"],[1,"text-2xl","font-bold","text-pink-600"],[1,"bg-green-50","border","border-green-200","rounded-lg","p-4"],[1,"text-sm","font-medium","text-green-900"],[1,"text-2xl","font-bold","text-green-600"]],template:function(t,r){t&1&&(n(0,"app-page-header",1),m(1,"date"),$(2,2),n(3,"button",3),P("click",function(){return r.goBack()}),n(4,"mat-icon"),a(5,"arrow_back"),i(),a(6," Back "),i(),c(7,rt,16,4),T(),i(),c(8,lt,2,0,"div",4),c(9,dt,11,1,"div",5),c(10,Gt,127,83,"div",6)),t&2&&(y("title",r.orderResource.hasValue()?"Receipt #"+r.orderResource.value().reference:"Receipt Details")("subtitle",r.orderResource.hasValue()?"Created on "+f(1,6,r.orderResource.value().createdAt,"medium"):"Loading receipt..."),l(7),p(r.orderResource.hasValue()&&!r.orderResource.isLoading()?7:-1),l(),p(r.orderResource.isLoading()?8:-1),l(),p(r.orderResource.error()?9:-1),l(),p(r.orderResource.hasValue()&&!r.orderResource.isLoading()?10:-1))},dependencies:[se,$e,Ce,Se,ye,Ee,he,_e,be,ve,ue,ke,Ie,Re,De,Te,we,We,Be,Oe,He,Ue,Fe,Ge,Ve,je,qe,Ye,Xe,Je,Qe,ze,Ae,Le,Pe,Ne,xe,me,re,de,le],styles:["[_nghost-%COMP%]{display:block}"]})};export{et as ReceiptsDetailsComponent};

import {E as E$2}from'./chunk-CkfjDPp7.js';import {W as Wt$1,P as P$1}from'./chunk-BetvXg-o.js';import'./chunk-BENxTilh.js';import {l as li,Z as Zt$1,e as ei$1,n as ni$1,t as ti$1,J as Jt$1,r as ri$1,i as ii$1,o as oi$1,s as si,a as ai$1}from'./chunk-DVuHqepr.js';import {P as Pi,D as Di,E as Ei,L as Lt$3,Y as Yt$1}from'./chunk-B3EnsTNX.js';import'./chunk-CuIktFtc.js';import {H as Ht$1,P,G,L as Lt$2}from'./chunk-B2IF1Y6H.js';import {E,W,F,dk as l,H as h,M as Mt$1,e7 as Je,b as be,S,a6 as ct$1,aa as x$1,x as w,a7 as V,at as C,m as mI,c as Fn,N as Nt$1,y as yt$1,L as Lt$1,O as Ot$1,ah as aa,a2 as $t$1,n as cn,C as Cn,o as fn,k as ko,p as OD,dd as lc,_ as _p,h as hD,s as sc,U as UI,de as ti$2,e as ep,v as FD,d as _v,q as qI,r as XI,w as wl,j as jE,u as Ml,aj as WE,f as qp,g as dc,t as tp,e8 as Kp,ac as zf,e9 as ED,aC as Fp,P as PD,aI as SD,ea as DD,aE as Gp,z as zI,aD as GI,Q as QI,c0 as bD,di as Wp,aF as xd}from'./main-CZ7UM47Q.js';import'./chunk-B_ieYD4R.js';import'./chunk-DFjR0BRS.js';import'./chunk-DQCowxyR.js';import {X,J}from'./chunk-BoqzAen7.js';import {B,j,z,k,E as E$1,S as S$1}from'./chunk-Drz4Z8vQ.js';import'./chunk-Bm-IFrnS.js';var lt=()=>[],it=()=>["product","options","quantity","price","subtotal"],dt=n=>["/menu/hms/front-desk/reservations",n];function st(n,e){if(n&1){let t=XI();ko(0,"button",7)(1,"mat-icon"),hD(2),sc(),hD(3),sc(),ko(4,"mat-menu",null,0)(6,"button",8),_p("click",function(){wl(t);let p=jE();return Ml(p.exportReceipt())}),ko(7,"mat-icon"),hD(8,"receipt"),sc(),ko(9,"span"),hD(10,"Generate Receipt"),sc()(),ko(11,"button",8),_p("click",function(){wl(t);let p=jE();return Ml(p.exportInvoice())}),ko(12,"mat-icon"),hD(13,"description"),sc(),ko(14,"span"),hD(15,"Generate Invoice"),sc()()();}if(n&2){let t=WE(5),r=jE();ep("matMenuTriggerFor",t)("disabled",r.exporting()),_v(2),qp(r.exporting()?"refresh":"print"),_v(),dc(" ",r.exporting()?"Exporting...":"Export"," ");}}function ct(n,e){n&1&&(ko(0,"div",4),tp(1,"mat-spinner",9),sc());}function mt(n,e){if(n&1){let t=XI();ko(0,"div",5)(1,"mat-card",10)(2,"mat-card-content",11)(3,"mat-icon",12),hD(4,"error_outline"),sc(),ko(5,"h3",13),hD(6,"Failed to Load Receipt"),sc(),ko(7,"p",14),hD(8),sc(),ko(9,"button",15),_p("click",function(){wl(t);let p=jE();return Ml(p.goBack())}),hD(10," Back to Receipts "),sc()()()();}if(n&2){let t=jE();_v(8),qp(t.orderResource.error()?.message||"An error occurred");}}function pt(n,e){n&1&&(ko(0,"h3",58),hD(1,"This table hasn't been picked up yet"),sc(),ko(2,"p",24),hD(3,"Accept it to serve this table \u2014 it will show in your orders."),sc());}function xt(n,e){n&1&&(ko(0,"h3",58),hD(1,"You are serving this table"),sc(),ko(2,"p",24),hD(3,"It appears in your POS orders list."),sc());}function ut(n,e){if(n&1&&hD(0),n&2){let t=jE(4);dc(" Already taken by ",t.assignedStaffName()," ");}}function vt(n,e){n&1&&hD(0," Already taken ");}function ft(n,e){if(n&1&&(ko(0,"h3",58),UI(1,ut,1,1)(2,vt,1,0),sc(),ko(3,"p",24),hD(4,"Another team member is serving this table."),sc()),n&2){let t=jE(3);_v(),qI(t.assignedStaffName()?1:2);}}function gt(n,e){n&1&&(ko(0,"mat-icon",70),hD(1,"refresh"),sc());}function bt(n,e){n&1&&hD(0," Accept order ");}function _t(n,e){if(n&1){let t=XI();ko(0,"div",67)(1,"button",68),_p("click",function(){wl(t);let p=jE(3);return Ml(p.declineOrder())}),hD(2," Decline "),sc(),ko(3,"button",69),_p("click",function(){wl(t);let p=jE(3);return Ml(p.acceptOrder())}),UI(4,gt,2,0,"mat-icon",70)(5,bt,1,0),sc()();}if(n&2){let t=jE(3);_v(),ep("disabled",t.claiming()),_v(2),ep("disabled",t.claiming()),_v(),qI(t.claiming()?4:5);}}function yt(n,e){if(n&1&&(ko(0,"mat-card",64)(1,"mat-card-content",65)(2,"div",66)(3,"mat-icon"),hD(4),sc(),ko(5,"div"),UI(6,pt,4,0)(7,xt,4,0)(8,ft,5,1),sc()(),UI(9,_t,6,3,"div",67),sc()()),n&2){let t=jE(2);Fp("!border-l-orange-500",t.canAccept())("!border-l-green-600",!t.canAccept()),_v(3),Fp("text-orange-600",t.canAccept())("text-green-600",!t.canAccept()),_v(),dc(" ",t.canAccept()?"room_service":"assignment_turned_in"," "),_v(2),qI(t.canAccept()?6:t.isMine()?7:8),_v(3),qI(t.canAccept()?9:-1);}}function Ct(n,e){if(n&1&&(ko(0,"mat-card",17)(1,"mat-card-content",71)(2,"mat-icon",72),hD(3,"schedule"),sc(),ko(4,"div")(5,"h3",58),hD(6,"Scheduled Delivery"),sc(),ko(7,"p",24),hD(8," This order is scheduled for "),ko(9,"strong"),hD(10),sc(),hD(11," at "),ko(12,"strong"),hD(13),sc()()()()()),n&2){jE();let t=DD(0);_v(10),qp(t.deliveryTime.date),_v(3),qp(t.deliveryTime.time);}}function ht(n,e){if(n&1&&(ko(0,"mat-card",18)(1,"mat-card-content",71)(2,"mat-icon",73),hD(3,"card_giftcard"),sc(),ko(4,"div")(5,"h3",58),hD(6,"\u{1F381} Gift Order"),sc(),ko(7,"p",24),hD(8),sc()()()()),n&2){jE();let t=DD(0);_v(8),dc(" This is a gift order ",t.receiver?.surprise?"(Surprise)":""," ");}}function St(n,e){if(n&1&&(ko(0,"mat-chip",27),hD(1),sc()),n&2){jE();let t=DD(0);_v(),dc(" ",t.salesChannel," ");}}function Et(n,e){if(n&1&&(ko(0,"div",34)(1,"label",31),hD(2,"Note"),sc(),ko(3,"div",74),hD(4),sc()()),n&2){jE();let t=DD(0);_v(4),qp(t.note);}}function Dt(n,e){n&1&&(ko(0,"th",75),hD(1,"Product"),sc());}function Tt(n,e){if(n&1&&tp(0,"img",78),n&2){let t=jE().$implicit;ep("src",t.image,xd)("alt",t.name);}}function $t(n,e){n&1&&(ko(0,"div",79)(1,"mat-icon",82),hD(2,"image"),sc()());}function Rt(n,e){if(n&1&&(ko(0,"div",80),hD(1),sc()),n&2){let t=jE().$implicit;_v(),qp(t.description);}}function wt(n,e){if(n&1&&(ko(0,"div",81)(1,"mat-icon",83),hD(2,"person"),sc(),hD(3),sc()),n&2){let t=jE().$implicit;_v(3),dc(" ",t.orderedBy," ");}}function It(n,e){if(n&1&&(ko(0,"td",76)(1,"div",77),UI(2,Tt,1,2,"img",78)(3,$t,3,0,"div",79),ko(4,"div")(5,"div",58),hD(6),sc(),UI(7,Rt,2,1,"div",80),UI(8,wt,4,1,"div",81),sc()()()),n&2){let t=e.$implicit;_v(2),qI(t.image?2:3),_v(4),qp(t.name),_v(),qI(t.description?7:-1),_v(),qI(t.orderedBy?8:-1);}}function kt(n,e){n&1&&(ko(0,"th",75),hD(1,"Options"),sc());}function At(n,e){if(n&1&&(hD(0),OD(1,"currency")),n&2){let t=jE().$implicit,r=jE(4);dc(" (",FD(1,1,t.price,r.currency()),") ");}}function Mt(n,e){if(n&1&&(ko(0,"mat-chip",85),hD(1),UI(2,At,2,4),hD(3),sc()),n&2){let t=e.$implicit;_v(),dc(" ",t.optionItemName||t.name," "),_v(),qI(t.price?2:-1),_v(),dc(" \xD7",t.quantity," ");}}function Nt(n,e){if(n&1&&(ko(0,"div",84),zI(1,Mt,4,3,"mat-chip",85,GI),sc()),n&2){let t=jE().$implicit;_v(),QI(t.options);}}function Pt(n,e){n&1&&(ko(0,"span",82),hD(1,"-"),sc());}function Lt(n,e){if(n&1&&(ko(0,"td",76),UI(1,Nt,3,0,"div",84)(2,Pt,2,0,"span",82),sc()),n&2){let t=e.$implicit;_v(),qI(t.options&&t.options.length>0?1:2);}}function Bt(n,e){n&1&&(ko(0,"th",86),hD(1,"Qty"),sc());}function Ot(n,e){if(n&1&&(ko(0,"td",87)(1,"span",88),hD(2),sc()()),n&2){let t=e.$implicit;_v(2),dc(" ",t.quantity," ");}}function zt(n,e){n&1&&(ko(0,"th",89),hD(1,"Price"),sc());}function Ft(n,e){if(n&1&&(ko(0,"td",90),hD(1),OD(2,"currency"),sc()),n&2){let t=e.$implicit,r=jE(2);_v(),dc(" ",FD(2,1,t.price,r.currency())," ");}}function Vt(n,e){n&1&&(ko(0,"th",89),hD(1,"Subtotal"),sc());}function Ut(n,e){if(n&1&&(ko(0,"td",91),hD(1),OD(2,"currency"),sc()),n&2){let t=e.$implicit,r=jE(2);_v(),dc(" ",FD(2,1,r.getProductSubtotal(t),r.currency())," ");}}function jt(n,e){n&1&&tp(0,"tr",92);}function Ht(n,e){n&1&&tp(0,"tr",93);}function Gt(n,e){if(n&1&&(ko(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title"),hD(3," Customer "),sc()(),ko(4,"mat-card-content",36)(5,"mat-list")(6,"mat-list-item")(7,"span",94),hD(8,"Name"),sc(),ko(9,"span",95),hD(10),sc()(),ko(11,"mat-list-item")(12,"span",94),hD(13,"Phone"),sc(),ko(14,"span",95),hD(15),sc()(),ko(16,"mat-list-item")(17,"span",94),hD(18,"Email"),sc(),ko(19,"span",96),hD(20),sc()()()()()),n&2){jE();let t=DD(0);_v(10),qp(t.user?.name||"N/A"),_v(5),qp(t.user?.phoneNumber||"N/A"),_v(5),qp(t.user?.email||"N/A");}}function qt(n,e){if(n&1&&(ko(0,"mat-list-item")(1,"span",94),hD(2,"Nationality"),sc(),ko(3,"span",95),hD(4),sc()()),n&2){jE(2);let t=DD(0);_v(4),qp(t.guest?.nationality);}}function Yt(n,e){if(n&1&&(ko(0,"mat-list-item")(1,"span",94),hD(2,"Reservation"),sc(),ko(3,"span",95)(4,"a",98),hD(5," View Reservation "),sc()()()),n&2){jE(2);let t=DD(0);_v(4),ep("routerLink",bD(1,dt,t.reservation));}}function Qt(n,e){if(n&1&&(ko(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title",97)(3,"mat-icon"),hD(4,"person"),sc(),hD(5," Guest "),sc()(),ko(6,"mat-card-content",36)(7,"mat-list")(8,"mat-list-item")(9,"span",94),hD(10,"Name"),sc(),ko(11,"span",95),hD(12),sc()(),ko(13,"mat-list-item")(14,"span",94),hD(15,"Phone"),sc(),ko(16,"span",95),hD(17),sc()(),ko(18,"mat-list-item")(19,"span",94),hD(20,"Email"),sc(),ko(21,"span",96),hD(22),sc()(),UI(23,qt,5,1,"mat-list-item"),UI(24,Yt,6,3,"mat-list-item"),sc()()()),n&2){jE();let t=DD(0);_v(12),Gp("",t.guest?.firstName," ",t.guest?.lastName),_v(5),qp(t.guest?.phone||"N/A"),_v(5),qp(t.guest?.email||"N/A"),_v(),qI(t.guest?.nationality?23:-1),_v(),qI(t.reservation?24:-1);}}function Wt(n,e){if(n&1&&(ko(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title",97)(3,"mat-icon"),hD(4,"person"),sc(),hD(5," Ordered by "),sc()(),ko(6,"mat-card-content",36)(7,"mat-list")(8,"mat-list-item")(9,"span",94),hD(10,"Customer"),sc(),ko(11,"span",95),hD(12),sc()()()()()),n&2){jE();let t=DD(0);_v(12),qp(t.guestName);}}function Kt(n,e){if(n&1&&(ko(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title",97)(3,"mat-icon"),hD(4,"room_service"),sc(),hD(5," Served by "),sc()(),ko(6,"mat-card-content",36)(7,"mat-list")(8,"mat-list-item")(9,"span",94),hD(10,"Name"),sc(),ko(11,"span",95),hD(12),sc()(),ko(13,"mat-list-item")(14,"span",94),hD(15,"Phone"),sc(),ko(16,"span",95),hD(17),sc()(),ko(18,"mat-list-item")(19,"span",94),hD(20,"Email"),sc(),ko(21,"span",96),hD(22),sc()()()()()),n&2){jE();let t=DD(0);_v(12),qp(t.staff?.name||"N/A"),_v(5),qp(t.staff?.phoneNumber||"N/A"),_v(5),qp(t.staff?.email||"N/A");}}function Jt(n,e){n&1&&(ko(0,"mat-chip",99),hD(1,"Surprise"),sc());}function Xt(n,e){if(n&1&&(ko(0,"div")(1,"label",31),hD(2,"Delivery Address"),sc(),ko(3,"div",33),hD(4),sc()()),n&2){jE(2);let t=DD(0);_v(4),Wp(" ",t.receiver.address.name," ",t.receiver.address.administrativeArea," ",t.receiver.address.locality," ");}}function Zt(n,e){if(n&1&&(ko(0,"div")(1,"label",31),hD(2,"Gift Note"),sc(),ko(3,"div",101),hD(4),sc()()),n&2){jE(2);let t=DD(0);_v(4),qp(t.receiver.note);}}function ei(n,e){if(n&1&&(ko(0,"mat-card",54)(1,"mat-card-header")(2,"mat-card-title",97),hD(3," Gift Receiver "),UI(4,Jt,2,0,"mat-chip",99),sc()(),ko(5,"mat-card-content")(6,"div",100)(7,"div")(8,"label",31),hD(9,"Name"),sc(),ko(10,"div",33),hD(11),sc()(),ko(12,"div")(13,"label",31),hD(14,"Phone"),sc(),ko(15,"div",33),hD(16),sc()(),UI(17,Xt,5,3,"div"),UI(18,Zt,5,1,"div"),sc()()()),n&2){jE();let t=DD(0);_v(4),qI(t.receiver.surprise?4:-1),_v(7),qp(t.receiver.name||"N/A"),_v(5),qp(t.receiver.phoneNumber||"N/A"),_v(),qI(t.receiver.address?17:-1),_v(),qI(t.receiver.note?18:-1);}}function ti(n,e){if(n&1&&(ko(0,"div")(1,"label",31),hD(2,"Contact Phone"),sc(),ko(3,"div",33),hD(4),sc()()),n&2){jE(2);let t=DD(0);_v(4),qp(t.shipping.phone);}}function ii(n,e){if(n&1&&(ko(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title"),hD(3," Shipping "),sc()(),ko(4,"mat-card-content")(5,"div",55)(6,"div")(7,"label",31),hD(8,"Address"),sc(),ko(9,"div",33),hD(10),sc()(),UI(11,ti,5,1,"div"),sc()()()),n&2){jE();let t=DD(0);_v(10),qp(t.shipping?.name||"N/A"),_v(),qI(t.shipping?.phone?11:-1);}}function ni(n,e){if(n&1&&(ko(0,"div",56)(1,"span",57),hD(2,"Discount:"),sc(),ko(3,"span",102),hD(4),OD(5,"currency"),sc()()),n&2){jE();let t=DD(0),r=jE();_v(4),dc("-",FD(5,1,t.discount,r.currency()));}}function ai(n,e){if(n&1&&(ko(0,"div",59)(1,"div",56)(2,"span",103)(3,"mat-icon",104),hD(4,"local_taxi"),sc(),hD(5," Driver Tip: "),sc(),ko(6,"span",105),hD(7),OD(8,"currency"),sc()()()),n&2){jE();let t=DD(0),r=jE();_v(7),qp(FD(8,1,t.driverTip,r.currency()));}}function oi(n,e){if(n&1&&(ko(0,"mat-card",10)(1,"mat-card-header")(2,"mat-card-title"),hD(3," Revenue Breakdown "),sc()(),ko(4,"mat-card-content")(5,"div",55)(6,"div",106)(7,"div",107)(8,"span",108),hD(9,"Vendor Commission"),sc(),ko(10,"mat-chip",109),hD(11),sc()(),ko(12,"div",110),hD(13),OD(14,"currency"),sc()(),ko(15,"div",111)(16,"div",107)(17,"span",112),hD(18,"Vendor Receives"),sc()(),ko(19,"div",113),hD(20),OD(21,"currency"),sc()(),ko(22,"div",114)(23,"div",107)(24,"span",115),hD(25,"Platform Receives"),sc()(),ko(26,"div",116),hD(27),OD(28,"currency"),sc()()()()()),n&2){jE();let t=DD(0),r=jE();_v(11),dc("",t.vendorCommission,"%"),_v(2),qp(FD(14,4,t.vendorCommissionAmount,r.currency())),_v(7),dc(" ",FD(21,7,t.subTotal-t.vendorCommissionAmount,r.currency())," "),_v(7),dc(" ",FD(28,10,t.total-(t.subTotal-t.vendorCommissionAmount),r.currency())," ");}}function ri(n,e){if(n&1&&(Kp(0),ko(1,"div",6),UI(2,yt,10,11,"mat-card",16),UI(3,Ct,14,2,"mat-card",17),UI(4,ht,9,1,"mat-card",18),ko(5,"mat-card",19)(6,"mat-card-content",20)(7,"div",21)(8,"div",22)(9,"div")(10,"h2",23),hD(11),sc(),ko(12,"p",24),hD(13),OD(14,"date"),sc()()(),ko(15,"div",25)(16,"div",26)(17,"mat-chip"),hD(18),OD(19,"titlecase"),sc(),UI(20,St,2,1,"mat-chip",27),sc()()()()(),ko(21,"div",28)(22,"div",29)(23,"mat-card",10)(24,"mat-card-header")(25,"mat-card-title"),hD(26," Order Information "),sc()(),ko(27,"mat-card-content")(28,"div",30)(29,"div")(30,"label",31),hD(31,"Order Reference"),sc(),ko(32,"div",32),hD(33),sc()(),ko(34,"div")(35,"label",31),hD(36,"Order Date"),sc(),ko(37,"div",33),hD(38),OD(39,"date"),sc()(),ko(40,"div")(41,"label",31),hD(42,"Payment Method"),sc(),ko(43,"div",33),hD(44),OD(45,"titlecase"),sc()(),ko(46,"div")(47,"label",31),hD(48,"Payment Status"),sc(),ko(49,"mat-chip"),hD(50),OD(51,"titlecase"),sc()(),ko(52,"div")(53,"label",31),hD(54,"Order Type"),sc(),ko(55,"div",33),hD(56),OD(57,"titlecase"),sc()(),ko(58,"div")(59,"label",31),hD(60,"Delivery Type"),sc(),ko(61,"div",33),hD(62),OD(63,"titlecase"),sc()(),UI(64,Et,5,1,"div",34),sc()()(),ko(65,"mat-card",35)(66,"mat-card-header")(67,"mat-card-title"),hD(68," Order Items "),sc()(),ko(69,"mat-card-content",36)(70,"div",37)(71,"table",38),lc(72,39),zf(73,Dt,2,0,"th",40)(74,It,9,4,"td",41),ti$2(),lc(75,42),zf(76,kt,2,0,"th",40)(77,Lt,3,1,"td",41),ti$2(),lc(78,43),zf(79,Bt,2,0,"th",44)(80,Ot,3,1,"td",45),ti$2(),lc(81,46),zf(82,zt,2,0,"th",47)(83,Ft,3,4,"td",48),ti$2(),lc(84,49),zf(85,Vt,2,0,"th",47)(86,Ut,3,4,"td",50),ti$2(),zf(87,jt,1,0,"tr",51)(88,Ht,1,0,"tr",52),sc()()()()(),ko(89,"div",53),UI(90,Gt,21,3,"mat-card",10),UI(91,Qt,25,6,"mat-card",10),UI(92,Wt,13,1,"mat-card",10),UI(93,Kt,23,3,"mat-card",10),UI(94,ei,19,5,"mat-card",54),UI(95,ii,12,2,"mat-card",10),ko(96,"mat-card",10)(97,"mat-card-header")(98,"mat-card-title"),hD(99," Order Summary "),sc()(),ko(100,"mat-card-content")(101,"div",55)(102,"div",56)(103,"span",57),hD(104,"Subtotal:"),sc(),ko(105,"span",58),hD(106),OD(107,"currency"),sc()(),ko(108,"div",56)(109,"span",57),hD(110,"Service Fee:"),sc(),ko(111,"span",58),hD(112),OD(113,"currency"),sc()(),ko(114,"div",56)(115,"span",57),hD(116,"Shipping Fee:"),sc(),ko(117,"span",58),hD(118),OD(119,"currency"),sc()(),UI(120,ni,6,4,"div",56),UI(121,ai,9,4,"div",59),sc()(),ko(122,"mat-card-actions",60)(123,"div",61)(124,"span",62),hD(125,"Total:"),sc(),ko(126,"span",63),hD(127),OD(128,"currency"),sc()()()(),UI(129,oi,29,13,"mat-card",10),sc()()()),n&2){let t=jE(),r=ED(t.orderResource.value());_v(2),qI(t.isSelfOrder()?2:-1),_v(),qI(r.deliveryTime?.name==="Schedule Delivery"?3:-1),_v(),qI(r.gift?4:-1),_v(7),qp(r.reference),_v(2),dc(" Created on ",FD(14,55,r.createdAt,"medium")," "),_v(4),Fp("!bg-green-100",r.category==="complete")("!text-green-800",r.category==="complete")("!bg-yellow-100",r.category==="pending")("!text-yellow-800",r.category==="pending")("!bg-red-100",r.category==="cancel")("!text-red-800",r.category==="cancel"),_v(),dc(" ",PD(19,58,r.category)," "),_v(2),qI(r.salesChannel?20:-1),_v(13),qp(r.reference),_v(5),qp(FD(39,60,r.createdAt,"medium")),_v(6),qp(PD(45,63,r.payment)),_v(5),Fp("!bg-green-100",r.paymentStatus==="paid")("!text-green-800",r.paymentStatus==="paid")("!bg-yellow-100",r.paymentStatus==="pending")("!text-yellow-800",r.paymentStatus==="pending")("!bg-red-100",r.paymentStatus==="failed")("!text-red-800",r.paymentStatus==="failed"),_v(),dc(" ",PD(51,65,r.paymentStatus)," "),_v(6),qp(PD(57,67,r.orderType)),_v(6),qp(PD(63,69,r.deliveryType)),_v(2),qI(r.note?64:-1),_v(7),ep("dataSource",r.cart?.products||SD(83,lt)),_v(16),ep("matHeaderRowDef",SD(84,it)),_v(),ep("matRowDefColumns",SD(85,it)),_v(2),qI(r.user?90:-1),_v(),qI(r.guest?91:-1),_v(),qI(r.salesChannel==="Qrcode"&&r.guestName?92:-1),_v(),qI(r.staff?93:-1),_v(),qI(r.gift&&r.receiver?94:-1),_v(),qI(r.shipping?95:-1),_v(11),qp(FD(107,71,r.subTotal,t.currency())),_v(6),qp(FD(113,74,r.serviceFee,t.currency())),_v(6),qp(FD(119,77,r.shippingFee,t.currency())),_v(2),qI(r.discount?120:-1),_v(),qI(r.driverTip?121:-1),_v(6),qp(FD(128,80,r.total,t.currency())),_v(2),qI(r.vendorCommission&&r.vendorCommissionAmount?129:-1);}}var nt=class n{route=E(W);router=E(F);orderService=E(l);storeService=E(h);snackBar=E(Mt$1);location=E(Je);exporting=be(false);claiming=be(false);authService=E(S);isSelfOrder=ct$1(()=>this.orderResource.value()?.salesChannel==="Qrcode");isAssigned=ct$1(()=>this.orderResource.value()?.tableAssignment?.status==="assigned");assignedStaffId=ct$1(()=>{let e=this.orderResource.value()?.tableAssignment?.staff;return e?typeof e=="string"?e:e._id?String(e._id):null:null});assignedStaffName=ct$1(()=>{let e=this.orderResource.value()?.tableAssignment?.staff;return typeof e=="object"&&e?.name?e.name:null});isMine=ct$1(()=>{let e=this.assignedStaffId();return !!e&&e===this.authService.currentUserValue?._id});canAccept=ct$1(()=>this.isSelfOrder()&&!this.isAssigned());acceptOrder(){let e=this.orderResource.value();e?._id&&(this.claiming.set(true),this.orderService.claimOrder(e._id).subscribe({next:t=>{this.claiming.set(false),t.success?(this.snackBar.open("You are now serving this table","Close",{duration:4e3}),this.markAssignedLocally()):this.snackBar.open(t.assignedTo?`Already taken by ${t.assignedTo}`:"Someone else already took this order","Close",{duration:5e3}),this.orderResource.reload();},error:t=>{this.claiming.set(false);let r=t?.error?.assignedTo;this.snackBar.open(r?`Already taken by ${r}`:"Could not accept this order","Close",{duration:5e3}),this.orderResource.reload();}}));}markAssignedLocally(){if(!this.orderResource.hasValue())return;let e=this.authService.currentUserValue;this.orderResource.update(t=>t&&x$1(w({},t),{staff:t.staff??e,tableAssignment:x$1(w({},t.tableAssignment||{}),{status:"assigned",staff:e?{_id:e._id,name:e.name}:t.tableAssignment?.staff,assignedAt:new Date().toISOString()})}));}declineOrder(){this.snackBar.open("Left for another team member","Close",{duration:3e3}),this.goBack();}orderResource=V({params:()=>({id:this.route.snapshot.paramMap.get("id")}),stream:({params:e})=>this.orderService.getOrder(e.id)});currency=ct$1(()=>this.storeService.getStoreLocally?.currencyCode||"NGN");getProductSubtotal(e){let t=(e.price||0)*(e.quantity||0),r=(e.options||[]).reduce((p,_)=>p+(_.price||0)*(_.quantity||0),0);return t+r}getCurrency(){return this.storeService.getStoreLocally?.currencyCode||"NGN"}goBack(){this.location.back();}exportReceipt(){return C(this,null,function*(){yield this.exportDocument("receipt");})}exportInvoice(){return C(this,null,function*(){yield this.exportDocument("invoice");})}exportDocument(e){return C(this,null,function*(){let t=this.orderResource.value();if(!t){this.snackBar.open("Order data not available","Close",{duration:3e3});return}let r=this.currency();if(!r){this.snackBar.open("Currency information not available","Close",{duration:3e3});return}this.exporting.set(true);try{let p=e==="receipt"?this.generatePrintableReceipt(t,r):this.generatePrintableInvoice(t,r),_=e==="receipt"?800:1e3,y=e==="receipt"?900:1e3,C=window.open("","_blank",`width=${_},height=${y}`);C?(C.document.write(p),C.document.close(),C.focus(),setTimeout(()=>{C.print();},500)):this.snackBar.open("Please allow pop-ups to export","Close",{duration:3e3});}catch(p){console.error(`Error exporting ${e}:`,p),this.snackBar.open(`Failed to export ${e}`,"Close",{duration:3e3});}finally{this.exporting.set(false);}})}generatePrintableReceipt(e,t){let r=g=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:t,currencyDisplay:"symbol"}).format(g)}catch(V){return console.warn(`Invalid currency code: ${t}, using USD`),new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(g)}},p=g=>new Date(g).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),_=this.storeService.getStoreLocally,y=_?.name||"Store",C=_?.contactInfo?.phone||"",M=_?.contactInfo?.address||"",z=e.deliveryTime?.name==="Schedule Delivery"?`
      <div class="alert-section scheduled">
        <div class="alert-icon">\u{1F4C5}</div>
        <div class="alert-content">
          <div class="alert-title">SCHEDULED DELIVERY</div>
          <div class="alert-text">${e.deliveryTime.date} at ${e.deliveryTime.time}</div>
        </div>
      </div>
    `:"",F=e.gift&&e.receiver?`
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
    `:"",N=e.cart?.products?.map(g=>{let V=g.options?.length>0?g.options.map(D=>`<div class="option-line">  + ${D.optionItemName||D.name} ${D.price?"("+r(D.price)+")":""} x${D.quantity}</div>`).join(""):"",G=this.getProductSubtotal(g);return `
        <div class="product-item">
          <div class="product-header">
            <span class="product-name">${g.quantity}x ${g.name}</span>
            <span class="product-price">${r(G)}</span>
          </div>
          ${V}
          <div class="product-unit-price">@ ${r(g.price)} each</div>
        </div>
      `}).join("")||"",P=e.vendorCommission&&e.vendorCommissionAmount?`
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
          <div class="store-name">${y}</div>
          ${C?`<div class="store-info">${C}</div>`:""}
          ${M?`<div class="store-info">${M}</div>`:""}
          <div class="receipt-title">RECEIPT</div>
          <div class="order-ref">Order: ${e.reference}</div>
          <div class="order-date">${p(e.createdAt)}</div>
        </div>

        <!-- Alerts -->
        ${z}
        ${F}

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
        ${N}

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

        ${P}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-message">THANK YOU FOR YOUR BUSINESS!</div>
          <div>Printed: ${p(new Date().toISOString())}</div>
        </div>
      </body>
      </html>
    `}generatePrintableInvoice(e,t){let r=b=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:t,currencyDisplay:"symbol"}).format(b)}catch(W){return console.warn(`Invalid currency code: ${t}, using USD`),new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(b)}},p=b=>new Date(b).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}),_=b=>new Date(b).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),y=this.storeService.getStoreLocally,C=y?.name||"Store",M=y?.contactInfo?.phone||"",z=y?.contactInfo?.email||"",F=y?.contactInfo?.address||"",N=y?.contactInfo?.city||"",P=y?.contactInfo?.state||"",g=y?.contactInfo?.country||"",V=e.deliveryTime?.name==="Schedule Delivery"?`
      <div class="alert-box scheduled">
        <div class="alert-icon">\u{1F4C5}</div>
        <div class="alert-content">
          <div class="alert-title">Scheduled Delivery</div>
          <div class="alert-text">This order is scheduled for <strong>${e.deliveryTime.date}</strong> at <strong>${e.deliveryTime.time}</strong></div>
        </div>
      </div>
    `:"",G=e.gift&&e.receiver?`
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
    `:"",D=e.cart?.products?.map((b,W)=>{let ot=b.options?.length>0?`<br><small style="color: #666;">${b.options.map(L=>`+ ${L.optionItemName||L.name} ${L.price?"("+r(L.price)+")":""} x${L.quantity}`).join("<br>")}</small>`:"",rt=this.getProductSubtotal(b);return `
        <tr>
          <td style="text-align: center;">${W+1}</td>
          <td>${b.name}${ot}</td>
          <td style="text-align: center;">${b.quantity}</td>
          <td style="text-align: right;">${r(b.price)}</td>
          <td style="text-align: right;"><strong>${r(rt)}</strong></td>
        </tr>
      `}).join("")||"",at=e.vendorCommission&&e.vendorCommissionAmount?`
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
            ${F?`<p>${F}</p>`:""}
            ${N||P?`<p>${N}${N&&P?", ":""}${P}</p>`:""}
            ${g?`<p>${g}</p>`:""}
            ${M?`<p>Phone: ${M}</p>`:""}
            ${z?`<p>Email: ${z}</p>`:""}
          </div>
          
          <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-details">
              <div><strong>Invoice #:</strong><span>${e.reference}</span></div>
              <div><strong>Date:</strong><span>${p(e.createdAt)}</span></div>
              <div><strong>Status:</strong><span>${e.category}</span></div>
              <div><strong>Payment:</strong><span>${e.paymentStatus}</span></div>
            </div>
          </div>
        </div>

        <!-- Alerts -->
        ${V}
        ${G}

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

        ${at}

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
    `}static \u0275fac=function(t){return new(t||n)};static \u0275cmp=mI({type:n,selectors:[["receipts-details"]],decls:11,vars:9,consts:[["exportMenu","matMenu"],[3,"title","subtitle"],["actions",""],["mat-stroked-button","",3,"click"],[1,"flex","justify-center","items-center","py-20"],[1,"max-w-7xl","mx-auto","px-4","py-8"],[1,"max-w-12xl","mx-auto","px-4","py-6"],["matButton","outlined",3,"matMenuTriggerFor","disabled"],["mat-menu-item","",3,"click"],["diameter","50"],["appearance","outlined"],[1,"text-center","py-8"],[1,"!text-6xl","text-red-500","mb-4"],[1,"text-lg","font-semibold","mb-2"],[1,"text-gray-600","mb-4"],["mat-flat-button","","color","warn",3,"click"],["appearance","outlined",1,"mb-4","!border-l-4",3,"!border-l-orange-500","!border-l-green-600"],["appearance","outlined",1,"mb-4","!border-l-4","!border-l-blue-500"],["appearance","outlined",1,"mb-4","!border-l-4","!border-l-pink-500"],["appearance","outlined",1,"mb-4"],[1,"py-4"],[1,"flex","items-center","justify-between"],[1,"flex","items-center","gap-4"],[1,"text-2xl","font-bold"],[1,"text-sm","text-gray-600"],[1,"text-right","space-y-2"],[1,"flex","gap-2","justify-end"],[1,"!bg-blue-100","!text-blue-800"],[1,"grid","grid-cols-1","lg:grid-cols-3","gap-6"],[1,"lg:col-span-2","space-y-6"],[1,"grid","grid-cols-1","md:grid-cols-2","gap-6","mt-4"],[1,"block","text-sm","font-medium","text-gray-700","mb-1"],[1,"text-lg","font-semibold"],[1,"text-sm"],[1,"md:col-span-2"],["appearance","outlined",1,"PY"],[1,"!p-0"],[1,"overflow-x-auto","py-2"],["mat-table","",1,"w-full",3,"dataSource"],["matColumnDef","product"],["mat-header-cell","",4,"matHeaderCellDef"],["mat-cell","",4,"matCellDef"],["matColumnDef","options"],["matColumnDef","quantity"],["mat-header-cell","","class","text-center",4,"matHeaderCellDef"],["mat-cell","","class","text-center",4,"matCellDef"],["matColumnDef","price"],["mat-header-cell","","class","text-right",4,"matHeaderCellDef"],["mat-cell","","class","text-right font-medium",4,"matCellDef"],["matColumnDef","subtotal"],["mat-cell","","class","text-right font-bold",4,"matCellDef"],["mat-header-row","",4,"matHeaderRowDef"],["mat-row","",4,"matRowDef","matRowDefColumns"],[1,"space-y-6"],["appearance","outlined",1,"!border-l-4","!border-l-pink-500"],[1,"space-y-3","mt-4"],[1,"flex","justify-between","text-sm"],[1,"text-gray-600"],[1,"font-medium"],[1,"border-t","border-gray-300","pt-3","mt-3"],[1,"border-t","border-outline-variant","mt-4","pt-4"],[1,"flex","justify-between","w-full","text-lg"],[1,"font-bold"],[1,"font-bold","text-right"],["appearance","outlined",1,"mb-4","!border-l-4"],[1,"flex","flex-wrap","items-center","justify-between","gap-3","py-3"],[1,"flex","items-center","gap-3"],[1,"flex","gap-2"],["mat-stroked-button","",3,"click","disabled"],["mat-flat-button","","color","primary",3,"click","disabled"],[1,"animate-spin"],[1,"flex","items-center","gap-3","py-3"],[1,"text-blue-600"],[1,"text-pink-600"],[1,"text-sm","whitespace-pre-line","bg-amber-50","rounded-md","p-3"],["mat-header-cell",""],["mat-cell",""],[1,"flex","items-center","gap-3","py-2"],[1,"w-12","h-12","rounded","object-cover",3,"src","alt"],[1,"w-12","h-12","bg-gray-200","rounded","flex","items-center","justify-center"],[1,"text-xs","text-gray-500"],[1,"flex","items-center","gap-1","text-xs","text-gray-500"],[1,"text-gray-400"],[1,"!text-sm","!w-3.5","!h-3.5"],[1,"space-y-1"],[1,"!text-xs"],["mat-header-cell","",1,"text-center"],["mat-cell","",1,"text-center"],[1,"inline-flex","items-center","justify-center","w-8","h-8","bg-indigo-100","text-indigo-700","rounded-full","font-semibold","text-sm"],["mat-header-cell","",1,"text-right"],["mat-cell","",1,"text-right","font-medium"],["mat-cell","",1,"text-right","font-bold"],["mat-header-row",""],["mat-row",""],["matListItemTitle",""],["matListItemMeta",""],["matListItemMeta","",1,"break-all"],[1,"flex","items-center","gap-2"],[1,"font-medium","text-indigo-600","hover:text-indigo-800","underline",3,"routerLink"],[1,"!text-xs","!bg-pink-100","!text-pink-700"],[1,"space-y-4","mt-4"],[1,"text-sm","bg-pink-50","p-3","rounded","border","border-pink-100"],[1,"font-medium","text-green-600"],[1,"text-gray-700","flex","items-center","gap-1"],[1,"!text-base","text-amber-500"],[1,"font-semibold","text-amber-600"],[1,"bg-blue-50","border","border-blue-200","rounded-lg","p-4"],[1,"flex","justify-between","items-center","mb-2"],[1,"text-sm","font-medium","text-blue-900"],[1,"!text-xs","!bg-blue-100","!text-blue-700"],[1,"text-2xl","font-bold","text-blue-600"],[1,"bg-pink-50","border","border-pink-200","rounded-lg","p-4"],[1,"text-sm","font-medium","text-pink-900"],[1,"text-2xl","font-bold","text-pink-600"],[1,"bg-green-50","border","border-green-200","rounded-lg","p-4"],[1,"text-sm","font-medium","text-green-900"],[1,"text-2xl","font-bold","text-green-600"]],template:function(t,r){t&1&&(ko(0,"app-page-header",1),OD(1,"date"),lc(2,2),ko(3,"button",3),_p("click",function(){return r.goBack()}),ko(4,"mat-icon"),hD(5,"arrow_back"),sc(),hD(6," Back "),sc(),UI(7,st,16,4),ti$2(),sc(),UI(8,ct,2,0,"div",4),UI(9,mt,11,1,"div",5),UI(10,ri,130,86,"div",6)),t&2&&(ep("title",r.orderResource.hasValue()?"Receipt #"+r.orderResource.value().reference:"Receipt Details")("subtitle",r.orderResource.hasValue()?"Created on "+FD(1,6,r.orderResource.value().createdAt,"medium"):"Loading receipt..."),_v(7),qI(r.orderResource.hasValue()&&!r.orderResource.isLoading()?7:-1),_v(),qI(r.orderResource.isLoading()?8:-1),_v(),qI(r.orderResource.error()?9:-1),_v(),qI(r.orderResource.hasValue()&&!r.orderResource.isLoading()?10:-1));},dependencies:[Fn,B,j,z,k,E$1,S$1,Nt$1,yt$1,Lt$1,Ot$1,X,J,Ht$1,P,G,Lt$2,li,Zt$1,ei$1,ni$1,ti$1,Jt$1,ri$1,ii$1,oi$1,si,ai$1,Wt$1,P$1,E$2,Pi,Di,Ei,Lt$3,Yt$1,aa,$t$1,cn,Cn,fn],styles:["[_nghost-%COMP%]{display:block}"],changeDetection:1})};export{nt as ReceiptsDetailsComponent};
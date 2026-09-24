import"./chunk-ZG_ciif-.js";import{a as x,i as w,r as C}from"./chunk-B9dn0NrW.js";import{B as LD,Dn as lE,E as Gp,Ft as aD,I as KD,It as aE,J as PD,Jt as ci$1,N as JD,On as lh,Or as yp,V as Ll,Z as Pl,Zn as rE,a as $v,b as Ec,en as dp,fn as gE,fr as uE,ft as UD,gr as vc,hr as ut$1,ht as WD,i as $r,it as SD,j as Ip,kt as ZD,lr as th,n as $d,nn as eC,nr as sE,p as Cc,pn as gh,pr as uh,qt as ch,s as AI,v as E,xr as xe,yt as XE}from"./chunk-5XvVQiy2.js";import"./chunk-CY5G5MZS.js";import{_ as hn,d as Qe,n as Cn,o as Fn,y as ln}from"./chunk-C6VwEn-p.js";import"./chunk-mzm8-boI.js";import{t as l}from"./chunk-BnIBytCy.js";import"./chunk-BTUBykex.js";import{t as S}from"./chunk--k2_09uR.js";import"./chunk-C2ra7W0i.js";import"./chunk-JltcrRJr.js";import"./chunk-BDr1J6Tf.js";import"./chunk--TR0RrN-.js";import"./chunk-CDoV_brl.js";import"./chunk-Bu_A3-kn.js";import"./chunk-9GOaJjbF.js";import"./chunk-DYZRRrgF.js";import{o as jt$1,t as Lt$1}from"./chunk-CcO9vZmb.js";import{B as Bt$1,E as l$1,R as z,a as da,c as wt$1,n as G,o as qt$1,r as H,s as Mt$1}from"./main-L7MY4SSX.js";import"./chunk-DZq9hBzd.js";import"./chunk-kcvYzMPS.js";import"./chunk-BzHQjT9s.js";import{r as G$1,t as Bt$2}from"./chunk-CDAVpev1.js";import"./chunk-cP-J10nG.js";import"./chunk-dgoz-vAA.js";import"./chunk-CXxmAcZr.js";import{t as E$1}from"./chunk-BeppvEJx.js";import{a as Qt$1,c as Xt$1,d as eo,i as Kt$1,l as Yt$1,n as Gt$1,o as Wt$1,p as qt$2,r as Jt$1,t as $t$1,u as Zt$1}from"./chunk-DIV7zRnW.js";import{i as P,n as G$2,r as Ot$1,t as At$1}from"./chunk-C9HmFA0P.js";import{n as Z,t as J}from"./chunk-ChlRtycI.js";import{a as _,i as T,n as E$2,o as j,s as k,t as A}from"./chunk-B6aUXJJs.js";import{i as Ii,n as Ai,r as Ei,s as Mt$2,u as Wt$2}from"./chunk-B77nsJFq.js";var nt=()=>[];var at=()=>[`product`,`options`,`quantity`,`price`,`subtotal`];var st=i=>[`/menu/hms/front-desk/reservations`,i];function ct(i,e){if(i&1){let t=gE();$r(0,`button`,7)(1,`mat-icon`),SD(2),vc(),SD(3),vc(),$r(4,`mat-menu`,null,0)(6,`button`,8),Gp(`click`,function(){Ll(t);let p=XE();return Pl(p.exportReceipt())}),$r(7,`mat-icon`),SD(8,`receipt`),vc(),$r(9,`span`),SD(10,`Generate Receipt`),vc()(),$r(11,`button`,8),Gp(`click`,function(){Ll(t);let p=XE();return Pl(p.exportInvoice())}),$r(12,`mat-icon`),SD(13,`description`),vc(),$r(14,`span`),SD(15,`Generate Invoice`),vc()()()}if(i&2){let t=aD(5),r=XE();yp(`matMenuTriggerFor`,t)(`disabled`,r.exporting()),$v(2),ch(r.exporting()?`refresh`:`print`),$v(),Cc(` `,r.exporting()?`Exporting...`:`Export`,` `)}}function mt(i,e){i&1&&($r(0,`div`,4),Ip(1,`mat-spinner`,9),vc())}function pt(i,e){if(i&1){let t=gE();$r(0,`div`,5)(1,`mat-card`,10)(2,`mat-card-content`,11)(3,`mat-icon`,12),SD(4,`error_outline`),vc(),$r(5,`h3`,13),SD(6,`Failed to Load Receipt`),vc(),$r(7,`p`,14),SD(8),vc(),$r(9,`button`,15),Gp(`click`,function(){Ll(t);let p=XE();return Pl(p.goBack())}),SD(10,` Back to Receipts `),vc()()()()}if(i&2){let t=XE();$v(8),ch(t.orderResource.error()?.message||`An error occurred`)}}function xt(i,e){i&1&&($r(0,`h3`,59),SD(1,`This table hasn't been picked up yet`),vc(),$r(2,`p`,24),SD(3,`Accept it to serve this table — it will show in your orders.`),vc())}function ut(i,e){i&1&&($r(0,`h3`,59),SD(1,`You are serving this table`),vc(),$r(2,`p`,24),SD(3,`It appears in your POS orders list.`),vc())}function vt(i,e){if(i&1&&SD(0),i&2){let t=XE(4);Cc(` Already taken by `,t.assignedStaffName(),` `)}}function ft(i,e){i&1&&SD(0,` Already taken `)}function gt(i,e){if(i&1&&($r(0,`h3`,59),rE(1,vt,1,1)(2,ft,1,0),vc(),$r(3,`p`,24),SD(4,`Another team member is serving this table.`),vc()),i&2){let t=XE(3);$v(),sE(t.assignedStaffName()?1:2)}}function bt(i,e){i&1&&($r(0,`mat-icon`,71),SD(1,`refresh`),vc())}function _t(i,e){i&1&&SD(0,` Accept order `)}function yt(i,e){if(i&1){let t=gE();$r(0,`div`,68)(1,`button`,69),Gp(`click`,function(){Ll(t);let p=XE(3);return Pl(p.declineOrder())}),SD(2,` Decline `),vc(),$r(3,`button`,70),Gp(`click`,function(){Ll(t);let p=XE(3);return Pl(p.acceptOrder())}),rE(4,bt,2,0,`mat-icon`,71)(5,_t,1,0),vc()()}if(i&2){let t=XE(3);$v(),yp(`disabled`,t.claiming()),$v(2),yp(`disabled`,t.claiming()),$v(),sE(t.claiming()?4:5)}}function Ct(i,e){if(i&1&&($r(0,`mat-card`,65)(1,`mat-card-content`,66)(2,`div`,67)(3,`mat-icon`),SD(4),vc(),$r(5,`div`),rE(6,xt,4,0)(7,ut,4,0)(8,gt,5,1),vc()(),rE(9,yt,6,3,`div`,68),vc()()),i&2){let t=XE(2);th(`!border-l-orange-500`,t.canAccept())(`!border-l-green-600`,!t.canAccept()),$v(3),th(`text-orange-600`,t.canAccept())(`text-green-600`,!t.canAccept()),$v(),Cc(` `,t.canAccept()?`room_service`:`assignment_turned_in`,` `),$v(2),sE(t.canAccept()?6:t.isMine()?7:8),$v(3),sE(t.canAccept()?9:-1)}}function ht(i,e){if(i&1&&($r(0,`mat-card`,17)(1,`mat-card-content`,72)(2,`mat-icon`,73),SD(3,`schedule`),vc(),$r(4,`div`)(5,`h3`,59),SD(6,`Scheduled Delivery`),vc(),$r(7,`p`,24),SD(8,` This order is scheduled for `),$r(9,`strong`),SD(10),vc(),SD(11,` at `),$r(12,`strong`),SD(13),vc()()()()()),i&2){XE();let t=PD(0);$v(10),ch(t.deliveryTime.date),$v(3),ch(t.deliveryTime.time)}}function St(i,e){if(i&1&&($r(0,`mat-card`,18)(1,`mat-card-content`,72)(2,`mat-icon`,74),SD(3,`card_giftcard`),vc(),$r(4,`div`)(5,`h3`,59),SD(6,`🎁 Gift Order`),vc(),$r(7,`p`,24),SD(8),vc()()()()),i&2){XE();let t=PD(0);$v(8),Cc(` This is a gift order `,t.receiver?.surprise?`(Surprise)`:``,` `)}}function Et(i,e){if(i&1&&($r(0,`mat-chip`,27),SD(1),vc()),i&2){XE();let t=PD(0);$v(),Cc(` `,t.salesChannel,` `)}}function Dt(i,e){if(i&1&&($r(0,`div`,33),SD(1),ZD(2,`currency`),vc()),i&2){let t=e.$implicit,r=XE(3);$v(),lh(` `,t.method,` — `,eC(2,2,t.amount,r.currency(),`symbol`,`1.2-2`),` `)}}function Tt(i,e){if(i&1&&lE(0,Dt,3,7,`div`,33,aE),i&2){XE();let t=PD(0);uE(t.payments)}}function $t(i,e){if(i&1&&($r(0,`div`,33),SD(1),ZD(2,`titlecase`),vc()),i&2){XE();let t=PD(0);$v(),ch(KD(2,1,t.payment))}}function Rt(i,e){if(i&1&&($r(0,`div`,34),SD(1),ZD(2,`currency`),vc()),i&2){XE();let t=PD(0),r=XE();$v(),Cc(` Change given `,eC(2,1,t.changeDue,r.currency(),`symbol`,`1.2-2`),` `)}}function wt(i,e){if(i&1&&($r(0,`div`,35)(1,`label`,31),SD(2,`Note`),vc(),$r(3,`div`,75),SD(4),vc()()),i&2){XE();let t=PD(0);$v(4),ch(t.note)}}function It(i,e){i&1&&($r(0,`th`,76),SD(1,`Product`),vc())}function kt(i,e){if(i&1&&Ip(0,`img`,79),i&2){let t=XE().$implicit;yp(`src`,t.image,$d)(`alt`,t.name)}}function At(i,e){i&1&&($r(0,`div`,80)(1,`mat-icon`,83),SD(2,`image`),vc()())}function Mt(i,e){if(i&1&&($r(0,`div`,81),SD(1),vc()),i&2){let t=XE().$implicit;$v(),ch(t.description)}}function Nt(i,e){if(i&1&&($r(0,`div`,82)(1,`mat-icon`,84),SD(2,`person`),vc(),SD(3),vc()),i&2){let t=XE().$implicit;$v(3),Cc(` `,t.orderedBy,` `)}}function Pt(i,e){if(i&1&&($r(0,`td`,77)(1,`div`,78),rE(2,kt,1,2,`img`,79)(3,At,3,0,`div`,80),$r(4,`div`)(5,`div`,59),SD(6),vc(),rE(7,Mt,2,1,`div`,81),rE(8,Nt,4,1,`div`,82),vc()()()),i&2){let t=e.$implicit;$v(2),sE(t.image?2:3),$v(4),ch(t.name),$v(),sE(t.description?7:-1),$v(),sE(t.orderedBy?8:-1)}}function Lt(i,e){i&1&&($r(0,`th`,76),SD(1,`Options`),vc())}function Bt(i,e){if(i&1&&(SD(0),ZD(1,`currency`)),i&2){let t=XE().$implicit,r=XE(4);Cc(` (`,JD(1,1,t.price,r.currency()),`) `)}}function Ot(i,e){if(i&1&&($r(0,`mat-chip`,86),SD(1),rE(2,Bt,2,4),SD(3),vc()),i&2){let t=e.$implicit;$v(),Cc(` `,t.optionItemName||t.name,` `),$v(),sE(t.price?2:-1),$v(),Cc(` ×`,t.quantity,` `)}}function zt(i,e){if(i&1&&($r(0,`div`,85),lE(1,Ot,4,3,`mat-chip`,86,aE),vc()),i&2){let t=XE().$implicit;$v(),uE(t.options)}}function Ft(i,e){i&1&&($r(0,`span`,83),SD(1,`-`),vc())}function Vt(i,e){if(i&1&&($r(0,`td`,77),rE(1,zt,3,0,`div`,85)(2,Ft,2,0,`span`,83),vc()),i&2){let t=e.$implicit;$v(),sE(t.options&&t.options.length>0?1:2)}}function Ut(i,e){i&1&&($r(0,`th`,87),SD(1,`Qty`),vc())}function jt(i,e){if(i&1&&($r(0,`td`,88)(1,`span`,89),SD(2),vc()()),i&2){let t=e.$implicit;$v(2),Cc(` `,t.quantity,` `)}}function Ht(i,e){i&1&&($r(0,`th`,90),SD(1,`Price`),vc())}function Gt(i,e){if(i&1&&($r(0,`td`,91),SD(1),ZD(2,`currency`),vc()),i&2){let t=e.$implicit,r=XE(2);$v(),Cc(` `,JD(2,1,t.price,r.currency()),` `)}}function qt(i,e){i&1&&($r(0,`th`,90),SD(1,`Subtotal`),vc())}function Yt(i,e){if(i&1&&($r(0,`td`,92),SD(1),ZD(2,`currency`),vc()),i&2){let t=e.$implicit,r=XE(2);$v(),Cc(` `,JD(2,1,r.getProductSubtotal(t),r.currency()),` `)}}function Qt(i,e){i&1&&Ip(0,`tr`,93)}function Wt(i,e){i&1&&Ip(0,`tr`,94)}function Kt(i,e){if(i&1&&($r(0,`mat-card`,10)(1,`mat-card-header`)(2,`mat-card-title`),SD(3,` Customer `),vc()(),$r(4,`mat-card-content`,37)(5,`mat-list`)(6,`mat-list-item`)(7,`span`,95),SD(8,`Name`),vc(),$r(9,`span`,96),SD(10),vc()(),$r(11,`mat-list-item`)(12,`span`,95),SD(13,`Phone`),vc(),$r(14,`span`,96),SD(15),vc()(),$r(16,`mat-list-item`)(17,`span`,95),SD(18,`Email`),vc(),$r(19,`span`,97),SD(20),vc()()()()()),i&2){XE();let t=PD(0);$v(10),ch(t.user?.name||`N/A`),$v(5),ch(t.user?.phoneNumber||`N/A`),$v(5),ch(t.user?.email||`N/A`)}}function Jt(i,e){if(i&1&&($r(0,`mat-list-item`)(1,`span`,95),SD(2,`Nationality`),vc(),$r(3,`span`,96),SD(4),vc()()),i&2){XE(2);let t=PD(0);$v(4),ch(t.guest?.nationality)}}function Xt(i,e){if(i&1&&($r(0,`mat-list-item`)(1,`span`,95),SD(2,`Reservation`),vc(),$r(3,`span`,96)(4,`a`,99),SD(5,` View Reservation `),vc()()()),i&2){XE(2);let t=PD(0);$v(4),yp(`routerLink`,WD(1,st,t.reservation))}}function Zt(i,e){if(i&1&&($r(0,`mat-card`,10)(1,`mat-card-header`)(2,`mat-card-title`,98)(3,`mat-icon`),SD(4,`person`),vc(),SD(5,` Guest `),vc()(),$r(6,`mat-card-content`,37)(7,`mat-list`)(8,`mat-list-item`)(9,`span`,95),SD(10,`Name`),vc(),$r(11,`span`,96),SD(12),vc()(),$r(13,`mat-list-item`)(14,`span`,95),SD(15,`Phone`),vc(),$r(16,`span`,96),SD(17),vc()(),$r(18,`mat-list-item`)(19,`span`,95),SD(20,`Email`),vc(),$r(21,`span`,97),SD(22),vc()(),rE(23,Jt,5,1,`mat-list-item`),rE(24,Xt,6,3,`mat-list-item`),vc()()()),i&2){XE();let t=PD(0);$v(12),lh(``,t.guest?.firstName,` `,t.guest?.lastName),$v(5),ch(t.guest?.phone||`N/A`),$v(5),ch(t.guest?.email||`N/A`),$v(),sE(t.guest?.nationality?23:-1),$v(),sE(t.reservation?24:-1)}}function ei(i,e){if(i&1&&($r(0,`mat-card`,10)(1,`mat-card-header`)(2,`mat-card-title`,98)(3,`mat-icon`),SD(4,`person`),vc(),SD(5,` Ordered by `),vc()(),$r(6,`mat-card-content`,37)(7,`mat-list`)(8,`mat-list-item`)(9,`span`,95),SD(10,`Customer`),vc(),$r(11,`span`,96),SD(12),vc()()()()()),i&2){XE();let t=PD(0);$v(12),ch(t.guestName)}}function ti(i,e){if(i&1&&($r(0,`mat-card`,10)(1,`mat-card-header`)(2,`mat-card-title`,98)(3,`mat-icon`),SD(4,`room_service`),vc(),SD(5,` Served by `),vc()(),$r(6,`mat-card-content`,37)(7,`mat-list`)(8,`mat-list-item`)(9,`span`,95),SD(10,`Name`),vc(),$r(11,`span`,96),SD(12),vc()(),$r(13,`mat-list-item`)(14,`span`,95),SD(15,`Phone`),vc(),$r(16,`span`,96),SD(17),vc()(),$r(18,`mat-list-item`)(19,`span`,95),SD(20,`Email`),vc(),$r(21,`span`,97),SD(22),vc()()()()()),i&2){XE();let t=PD(0);$v(12),ch(t.staff?.name||`N/A`),$v(5),ch(t.staff?.phoneNumber||`N/A`),$v(5),ch(t.staff?.email||`N/A`)}}function ii(i,e){i&1&&($r(0,`mat-chip`,100),SD(1,`Surprise`),vc())}function ni(i,e){if(i&1&&($r(0,`div`)(1,`label`,31),SD(2,`Delivery Address`),vc(),$r(3,`div`,33),SD(4),vc()()),i&2){XE(2);let t=PD(0);$v(4),uh(` `,t.receiver.address.name,` `,t.receiver.address.administrativeArea,` `,t.receiver.address.locality,` `)}}function ai(i,e){if(i&1&&($r(0,`div`)(1,`label`,31),SD(2,`Gift Note`),vc(),$r(3,`div`,102),SD(4),vc()()),i&2){XE(2);let t=PD(0);$v(4),ch(t.receiver.note)}}function oi(i,e){if(i&1&&($r(0,`mat-card`,55)(1,`mat-card-header`)(2,`mat-card-title`,98),SD(3,` Gift Receiver `),rE(4,ii,2,0,`mat-chip`,100),vc()(),$r(5,`mat-card-content`)(6,`div`,101)(7,`div`)(8,`label`,31),SD(9,`Name`),vc(),$r(10,`div`,33),SD(11),vc()(),$r(12,`div`)(13,`label`,31),SD(14,`Phone`),vc(),$r(15,`div`,33),SD(16),vc()(),rE(17,ni,5,3,`div`),rE(18,ai,5,1,`div`),vc()()()),i&2){XE();let t=PD(0);$v(4),sE(t.receiver.surprise?4:-1),$v(7),ch(t.receiver.name||`N/A`),$v(5),ch(t.receiver.phoneNumber||`N/A`),$v(),sE(t.receiver.address?17:-1),$v(),sE(t.receiver.note?18:-1)}}function ri(i,e){if(i&1&&($r(0,`div`)(1,`label`,31),SD(2,`Contact Phone`),vc(),$r(3,`div`,33),SD(4),vc()()),i&2){XE(2);let t=PD(0);$v(4),ch(t.shipping.phone)}}function li(i,e){if(i&1&&($r(0,`mat-card`,10)(1,`mat-card-header`)(2,`mat-card-title`),SD(3,` Shipping `),vc()(),$r(4,`mat-card-content`)(5,`div`,56)(6,`div`)(7,`label`,31),SD(8,`Address`),vc(),$r(9,`div`,33),SD(10),vc()(),rE(11,ri,5,1,`div`),vc()()()),i&2){XE();let t=PD(0);$v(10),ch(t.shipping?.name||`N/A`),$v(),sE(t.shipping?.phone?11:-1)}}function di(i,e){if(i&1&&($r(0,`div`,57)(1,`span`,58),SD(2,`Discount:`),vc(),$r(3,`span`,103),SD(4),ZD(5,`currency`),vc()()),i&2){XE();let t=PD(0),r=XE();$v(4),Cc(`-`,JD(5,1,t.discount,r.currency()))}}function si(i,e){if(i&1&&($r(0,`div`,60)(1,`div`,57)(2,`span`,104)(3,`mat-icon`,105),SD(4,`local_taxi`),vc(),SD(5,` Driver Tip: `),vc(),$r(6,`span`,106),SD(7),ZD(8,`currency`),vc()()()),i&2){XE();let t=PD(0),r=XE();$v(7),ch(JD(8,1,t.driverTip,r.currency()))}}function ci(i,e){if(i&1&&($r(0,`mat-card`,10)(1,`mat-card-header`)(2,`mat-card-title`),SD(3,` Revenue Breakdown `),vc()(),$r(4,`mat-card-content`)(5,`div`,56)(6,`div`,107)(7,`div`,108)(8,`span`,109),SD(9,`Vendor Commission`),vc(),$r(10,`mat-chip`,110),SD(11),vc()(),$r(12,`div`,111),SD(13),ZD(14,`currency`),vc()(),$r(15,`div`,112)(16,`div`,108)(17,`span`,113),SD(18,`Vendor Receives`),vc()(),$r(19,`div`,114),SD(20),ZD(21,`currency`),vc()(),$r(22,`div`,115)(23,`div`,108)(24,`span`,116),SD(25,`Platform Receives`),vc()(),$r(26,`div`,117),SD(27),ZD(28,`currency`),vc()()()()()),i&2){XE();let t=PD(0),r=XE();$v(11),Cc(``,t.vendorCommission,`%`),$v(2),ch(JD(14,4,t.vendorCommissionAmount,r.currency())),$v(7),Cc(` `,JD(21,7,t.subTotal-t.vendorCommissionAmount,r.currency()),` `),$v(7),Cc(` `,JD(28,10,t.total-(t.subTotal-t.vendorCommissionAmount),r.currency()),` `)}}function mi(i,e){if(i&1&&(gh(0),$r(1,`div`,6),rE(2,Ct,10,11,`mat-card`,16),rE(3,ht,14,2,`mat-card`,17),rE(4,St,9,1,`mat-card`,18),$r(5,`mat-card`,19)(6,`mat-card-content`,20)(7,`div`,21)(8,`div`,22)(9,`div`)(10,`h2`,23),SD(11),vc(),$r(12,`p`,24),SD(13),ZD(14,`date`),vc()()(),$r(15,`div`,25)(16,`div`,26)(17,`mat-chip`),SD(18),ZD(19,`titlecase`),vc(),rE(20,Et,2,1,`mat-chip`,27),vc()()()()(),$r(21,`div`,28)(22,`div`,29)(23,`mat-card`,10)(24,`mat-card-header`)(25,`mat-card-title`),SD(26,` Order Information `),vc()(),$r(27,`mat-card-content`)(28,`div`,30)(29,`div`)(30,`label`,31),SD(31,`Order Reference`),vc(),$r(32,`div`,32),SD(33),vc()(),$r(34,`div`)(35,`label`,31),SD(36,`Order Date`),vc(),$r(37,`div`,33),SD(38),ZD(39,`date`),vc()(),$r(40,`div`)(41,`label`,31),SD(42,`Payment Method`),vc(),rE(43,Tt,2,0)(44,$t,3,3,`div`,33),rE(45,Rt,3,6,`div`,34),vc(),$r(46,`div`)(47,`label`,31),SD(48,`Payment Status`),vc(),$r(49,`mat-chip`),SD(50),ZD(51,`titlecase`),vc()(),$r(52,`div`)(53,`label`,31),SD(54,`Order Type`),vc(),$r(55,`div`,33),SD(56),ZD(57,`titlecase`),vc()(),$r(58,`div`)(59,`label`,31),SD(60,`Delivery Type`),vc(),$r(61,`div`,33),SD(62),ZD(63,`titlecase`),vc()(),rE(64,wt,5,1,`div`,35),vc()()(),$r(65,`mat-card`,36)(66,`mat-card-header`)(67,`mat-card-title`),SD(68,` Order Items `),vc()(),$r(69,`mat-card-content`,37)(70,`div`,38)(71,`table`,39),Ec(72,40),dp(73,It,2,0,`th`,41)(74,Pt,9,4,`td`,42),ci$1(),Ec(75,43),dp(76,Lt,2,0,`th`,41)(77,Vt,3,1,`td`,42),ci$1(),Ec(78,44),dp(79,Ut,2,0,`th`,45)(80,jt,3,1,`td`,46),ci$1(),Ec(81,47),dp(82,Ht,2,0,`th`,48)(83,Gt,3,4,`td`,49),ci$1(),Ec(84,50),dp(85,qt,2,0,`th`,48)(86,Yt,3,4,`td`,51),ci$1(),dp(87,Qt,1,0,`tr`,52)(88,Wt,1,0,`tr`,53),vc()()()()(),$r(89,`div`,54),rE(90,Kt,21,3,`mat-card`,10),rE(91,Zt,25,6,`mat-card`,10),rE(92,ei,13,1,`mat-card`,10),rE(93,ti,23,3,`mat-card`,10),rE(94,oi,19,5,`mat-card`,55),rE(95,li,12,2,`mat-card`,10),$r(96,`mat-card`,10)(97,`mat-card-header`)(98,`mat-card-title`),SD(99,` Order Summary `),vc()(),$r(100,`mat-card-content`)(101,`div`,56)(102,`div`,57)(103,`span`,58),SD(104,`Subtotal:`),vc(),$r(105,`span`,59),SD(106),ZD(107,`currency`),vc()(),$r(108,`div`,57)(109,`span`,58),SD(110,`Service Fee:`),vc(),$r(111,`span`,59),SD(112),ZD(113,`currency`),vc()(),$r(114,`div`,57)(115,`span`,58),SD(116,`Shipping Fee:`),vc(),$r(117,`span`,59),SD(118),ZD(119,`currency`),vc()(),rE(120,di,6,4,`div`,57),rE(121,si,9,4,`div`,60),vc()(),$r(122,`mat-card-actions`,61)(123,`div`,62)(124,`span`,63),SD(125,`Total:`),vc(),$r(126,`span`,64),SD(127),ZD(128,`currency`),vc()()()(),rE(129,ci,29,13,`mat-card`,10),vc()()()),i&2){let t=XE(),r=LD(t.orderResource.value());$v(2),sE(t.isSelfOrder()?2:-1),$v(),sE(r.deliveryTime?.name===`Schedule Delivery`?3:-1),$v(),sE(r.gift?4:-1),$v(7),ch(r.reference),$v(2),Cc(` Created on `,JD(14,56,r.createdAt,`medium`),` `),$v(4),th(`!bg-green-100`,r.category===`complete`)(`!text-green-800`,r.category===`complete`)(`!bg-yellow-100`,r.category===`pending`)(`!text-yellow-800`,r.category===`pending`)(`!bg-red-100`,r.category===`cancel`)(`!text-red-800`,r.category===`cancel`),$v(),Cc(` `,KD(19,59,r.category),` `),$v(2),sE(r.salesChannel?20:-1),$v(13),ch(r.reference),$v(5),ch(JD(39,61,r.createdAt,`medium`)),$v(5),sE((r.payments||UD(82,nt)).length>1?43:44),$v(2),sE((r.changeDue||0)>0?45:-1),$v(4),th(`!bg-green-100`,r.paymentStatus===`paid`)(`!text-green-800`,r.paymentStatus===`paid`)(`!bg-yellow-100`,r.paymentStatus===`pending`)(`!text-yellow-800`,r.paymentStatus===`pending`)(`!bg-red-100`,r.paymentStatus===`failed`)(`!text-red-800`,r.paymentStatus===`failed`),$v(),Cc(` `,KD(51,64,r.paymentStatus),` `),$v(6),ch(KD(57,66,r.orderType)),$v(6),ch(KD(63,68,r.deliveryType)),$v(2),sE(r.note?64:-1),$v(7),yp(`dataSource`,r.cart?.products||UD(83,nt)),$v(16),yp(`matHeaderRowDef`,UD(84,at)),$v(),yp(`matRowDefColumns`,UD(85,at)),$v(2),sE(r.user?90:-1),$v(),sE(r.guest?91:-1),$v(),sE(r.salesChannel===`Qrcode`&&r.guestName?92:-1),$v(),sE(r.staff?93:-1),$v(),sE(r.gift&&r.receiver?94:-1),$v(),sE(r.shipping?95:-1),$v(11),ch(JD(107,70,r.subTotal,t.currency())),$v(6),ch(JD(113,73,r.serviceFee,t.currency())),$v(6),ch(JD(119,76,r.shippingFee,t.currency())),$v(2),sE(r.discount?120:-1),$v(),sE(r.driverTip?121:-1),$v(6),ch(JD(128,79,r.total,t.currency())),$v(2),sE(r.vendorCommission&&r.vendorCommissionAmount?129:-1)}}var ot=class i{route=E(G);router=E(H);orderService=E(l$1);storeService=E(l);snackBar=E(Bt$1);location=E(Qe);exporting=xe(!1);claiming=xe(!1);authService=E(S);isSelfOrder=ut$1(()=>this.orderResource.value()?.salesChannel===`Qrcode`);isAssigned=ut$1(()=>this.orderResource.value()?.tableAssignment?.status===`assigned`);assignedStaffId=ut$1(()=>{let e=this.orderResource.value()?.tableAssignment?.staff;return e?typeof e==`string`?e:e._id?String(e._id):null:null});assignedStaffName=ut$1(()=>{let e=this.orderResource.value()?.tableAssignment?.staff;return typeof e==`object`&&e?.name?e.name:null});isMine=ut$1(()=>{let e=this.assignedStaffId();return!!e&&e===this.authService.currentUserValue?._id});canAccept=ut$1(()=>this.isSelfOrder()&&!this.isAssigned());acceptOrder(){let e=this.orderResource.value();e?._id&&(this.claiming.set(!0),this.orderService.claimOrder(e._id).subscribe({next:t=>{this.claiming.set(!1),t.success?(this.snackBar.open(`You are now serving this table`,`Close`,{duration:4e3}),this.markAssignedLocally()):this.snackBar.open(t.assignedTo?`Already taken by ${t.assignedTo}`:`Someone else already took this order`,`Close`,{duration:5e3}),this.orderResource.reload()},error:t=>{this.claiming.set(!1);let r=t?.error?.assignedTo;this.snackBar.open(r?`Already taken by ${r}`:`Could not accept this order`,`Close`,{duration:5e3}),this.orderResource.reload()}}))}markAssignedLocally(){if(!this.orderResource.hasValue())return;let e=this.authService.currentUserValue;this.orderResource.update(t=>t&&x(w({},t),{staff:t.staff??e,tableAssignment:x(w({},t.tableAssignment||{}),{status:`assigned`,staff:e?{_id:e._id,name:e.name}:t.tableAssignment?.staff,assignedAt:new Date().toISOString()})}))}declineOrder(){this.snackBar.open(`Left for another team member`,`Close`,{duration:3e3}),this.goBack()}orderResource=z({params:()=>({id:this.route.snapshot.paramMap.get(`id`)}),stream:({params:e})=>this.orderService.getOrder(e.id)});currency=ut$1(()=>this.storeService.getStoreLocally?.currencyCode||`NGN`);getProductSubtotal(e){return(e.price||0)*(e.quantity||0)+(e.options||[]).reduce((p,_)=>p+(_.price||0)*(_.quantity||0),0)}getCurrency(){return this.storeService.getStoreLocally?.currencyCode||`NGN`}goBack(){this.location.back()}exportReceipt(){return C(this,null,function*(){yield this.exportDocument(`receipt`)})}exportInvoice(){return C(this,null,function*(){yield this.exportDocument(`invoice`)})}exportDocument(e){return C(this,null,function*(){let t=this.orderResource.value();if(!t){this.snackBar.open(`Order data not available`,`Close`,{duration:3e3});return}let r=this.currency();if(!r){this.snackBar.open(`Currency information not available`,`Close`,{duration:3e3});return}this.exporting.set(!0);try{let p=e===`receipt`?this.generatePrintableReceipt(t,r):this.generatePrintableInvoice(t,r),_=e===`receipt`?800:1e3,y=e===`receipt`?900:1e3,C=window.open(``,`_blank`,`width=${_},height=${y}`);C?(C.document.write(p),C.document.close(),C.focus(),setTimeout(()=>{C.print()},500)):this.snackBar.open(`Please allow pop-ups to export`,`Close`,{duration:3e3})}catch(p){console.error(`Error exporting ${e}:`,p),this.snackBar.open(`Failed to export ${e}`,`Close`,{duration:3e3})}finally{this.exporting.set(!1)}})}paymentText(e,t){let r=Array.isArray(e?.payments)?e.payments:[];return r.length>1?r.map(p=>`${p.method} ${this.formatMoney(p.amount,t)}`).join(` + `):r[0]?.method||e?.payment||`N/A`}changeText(e,t){let r=Number(e?.changeDue)||0;return r>0?this.formatMoney(r,t):null}formatMoney(e,t){try{return new Intl.NumberFormat(`en-US`,{style:`currency`,currency:t,currencyDisplay:`symbol`}).format(e||0)}catch(r){return`${t} ${(e||0).toFixed(2)}`}}generatePrintableReceipt(e,t){let r=g=>{try{return new Intl.NumberFormat(`en-US`,{style:`currency`,currency:t,currencyDisplay:`symbol`}).format(g)}catch(U){return console.warn(`Invalid currency code: ${t}, using USD`),new Intl.NumberFormat(`en-US`,{style:`currency`,currency:`USD`}).format(g)}},p=g=>new Date(g).toLocaleString(`en-US`,{year:`numeric`,month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`}),_=this.storeService.getStoreLocally,y=_?.name||`Store`,C=_?.contactInfo?.phone||``,M=_?.contactInfo?.address||``,F=e.deliveryTime?.name===`Schedule Delivery`?`
      <div class="alert-section scheduled">
        <div class="alert-icon">\u{1F4C5}</div>
        <div class="alert-content">
          <div class="alert-title">SCHEDULED DELIVERY</div>
          <div class="alert-text">${e.deliveryTime.date} at ${e.deliveryTime.time}</div>
        </div>
      </div>
    `:``,V=e.gift&&e.receiver?`
      <div class="alert-section gift">
        <div class="alert-icon">\u{1F381}</div>
        <div class="alert-content">
          <div class="alert-title">GIFT ORDER ${e.receiver.surprise?`(SURPRISE)`:``}</div>
          <div class="alert-text">
            <strong>To:</strong> ${e.receiver.name}<br>
            <strong>Phone:</strong> ${e.receiver.phoneNumber}
            ${e.receiver.address?`<br><strong>Address:</strong> ${e.receiver.address.name}`:``}
            ${e.receiver.note?`<br><strong>Note:</strong> ${e.receiver.note}`:``}
          </div>
        </div>
      </div>
    `:``,N=e.cart?.products?.map(g=>{let U=g.options?.length>0?g.options.map(D=>`<div class="option-line">  + ${D.optionItemName||D.name} ${D.price?`(`+r(D.price)+`)`:``} x${D.quantity}</div>`).join(``):``,G=this.getProductSubtotal(g);return`
        <div class="product-item">
          <div class="product-header">
            <span class="product-name">${g.quantity}x ${g.name}</span>
            <span class="product-price">${r(G)}</span>
          </div>
          ${U}
          <div class="product-unit-price">@ ${r(g.price)} each</div>
        </div>
      `}).join(``)||``,P=e.vendorCommission&&e.vendorCommissionAmount?`
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
    `:``;return`
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
          ${C?`<div class="store-info">${C}</div>`:``}
          ${M?`<div class="store-info">${M}</div>`:``}
          <div class="receipt-title">RECEIPT</div>
          <div class="order-ref">Order: ${e.reference}</div>
          <div class="order-date">${p(e.createdAt)}</div>
        </div>

        <!-- Alerts -->
        ${F}
        ${V}

        <!-- Customer Information -->
        <div class="info-section">
          <div><span class="info-label">Customer:</span> ${e.user?.name||`N/A`}</div>
          <div><span class="info-label">Phone:</span> ${e.user?.phoneNumber||`N/A`}</div>
          ${e.shipping?.name?`<div><span class="info-label">Address:</span> ${e.shipping.name}</div>`:``}
        </div>

        <!-- Order Details -->
        <div class="info-section">
          <div><span class="info-label">Payment:</span> ${this.paymentText(e,t)}</div>
          ${this.changeText(e,t)?`<div><span class="info-label">Change:</span> ${this.changeText(e,t)}</div>`:``}
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
          `:``}
          <div class="total-line grand">
            <span>TOTAL:</span>
            <span>${r(e.total)}</span>
          </div>
          ${e.driverTip?`
          <div class="total-line tip">
            <span>Driver Tip:</span>
            <span>${r(e.driverTip)}</span>
          </div>
          `:``}
        </div>

        ${P}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-message">THANK YOU FOR YOUR BUSINESS!</div>
          <div>Printed: ${p(new Date().toISOString())}</div>
        </div>
      </body>
      </html>
    `}generatePrintableInvoice(e,t){let r=b=>{try{return new Intl.NumberFormat(`en-US`,{style:`currency`,currency:t,currencyDisplay:`symbol`}).format(b)}catch(ee){return console.warn(`Invalid currency code: ${t}, using USD`),new Intl.NumberFormat(`en-US`,{style:`currency`,currency:`USD`}).format(b)}},p=b=>new Date(b).toLocaleDateString(`en-US`,{year:`numeric`,month:`long`,day:`numeric`}),_=b=>new Date(b).toLocaleString(`en-US`,{year:`numeric`,month:`short`,day:`numeric`,hour:`2-digit`,minute:`2-digit`}),y=this.storeService.getStoreLocally,C=y?.name||`Store`,M=y?.contactInfo?.phone||``,F=y?.contactInfo?.email||``,V=y?.contactInfo?.address||``,N=y?.contactInfo?.city||``,P=y?.contactInfo?.state||``,g=y?.contactInfo?.country||``,U=e.deliveryTime?.name===`Schedule Delivery`?`
      <div class="alert-box scheduled">
        <div class="alert-icon">\u{1F4C5}</div>
        <div class="alert-content">
          <div class="alert-title">Scheduled Delivery</div>
          <div class="alert-text">This order is scheduled for <strong>${e.deliveryTime.date}</strong> at <strong>${e.deliveryTime.time}</strong></div>
        </div>
      </div>
    `:``,G=e.gift&&e.receiver?`
      <div class="alert-box gift">
        <div class="alert-icon">\u{1F381}</div>
        <div class="alert-content">
          <div class="alert-title">Gift Order ${e.receiver.surprise?`(Surprise)`:``}</div>
          <div class="gift-details">
            <div><strong>Recipient:</strong> ${e.receiver.name}</div>
            <div><strong>Phone:</strong> ${e.receiver.phoneNumber}</div>
            ${e.receiver.address?`<div><strong>Address:</strong> ${e.receiver.address.name}</div>`:``}
            ${e.receiver.note?`<div><strong>Gift Message:</strong> ${e.receiver.note}</div>`:``}
          </div>
        </div>
      </div>
    `:``,D=e.cart?.products?.map((b,ee)=>{let lt=b.options?.length>0?`<br><small style="color: #666;">${b.options.map(L=>`+ ${L.optionItemName||L.name} ${L.price?`(`+r(L.price)+`)`:``} x${L.quantity}`).join(`<br>`)}</small>`:``,dt=this.getProductSubtotal(b);return`
        <tr>
          <td style="text-align: center;">${ee+1}</td>
          <td>${b.name}${lt}</td>
          <td style="text-align: center;">${b.quantity}</td>
          <td style="text-align: right;">${r(b.price)}</td>
          <td style="text-align: right;"><strong>${r(dt)}</strong></td>
        </tr>
      `}).join(``)||``,rt=e.vendorCommission&&e.vendorCommissionAmount?`
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
    `:``;return`
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
            ${V?`<p>${V}</p>`:``}
            ${N||P?`<p>${N}${N&&P?`, `:``}${P}</p>`:``}
            ${g?`<p>${g}</p>`:``}
            ${M?`<p>Phone: ${M}</p>`:``}
            ${F?`<p>Email: ${F}</p>`:``}
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
        ${U}
        ${G}

        <!-- Bill To / Ship To -->
        <div class="parties-section">
          <div class="party-box">
            <h3>Bill To</h3>
            <p><strong>${e.user?.name||`N/A`}</strong></p>
            ${e.user?.phoneNumber?`<p>Phone: ${e.user.phoneNumber}</p>`:``}
            ${e.user?.email?`<p>Email: ${e.user.email}</p>`:``}
          </div>
          
          <div class="party-box">
            <h3>Ship To</h3>
            ${e.shipping?.name?`<p>${e.shipping.name}</p>`:`<p>N/A</p>`}
            <p style="margin-top: 10px;"><strong>Delivery Type:</strong> ${e.deliveryType}</p>
            <p><strong>Order Type:</strong> ${e.orderType}</p>
            <p><strong>Payment Method:</strong> ${this.paymentText(e,t)}</p>
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
            `:``}
            <tr class="grand-total">
              <td>TOTAL DUE</td>
              <td>${r(e.total)}</td>
            </tr>
            ${e.driverTip?`
            <tr class="driver-tip">
              <td>Driver Tip</td>
              <td>${r(e.driverTip)}</td>
            </tr>
            `:``}
          </table>
        </div>

        ${rt}

        <!-- Payment Status -->
        <div class="payment-status ${e.paymentStatus?.toLowerCase()}">
          <h4>Payment Status: ${e.paymentStatus}</h4>
          <p>Payment Method: ${this.paymentText(e,t)} | Order Date: ${_(e.createdAt)}</p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p>Generated on ${_(new Date().toISOString())}</p>
        </div>
      </body>
      </html>
    `}static ɵfac=function(t){return new(t||i)};static ɵcmp=AI({type:i,selectors:[[`receipts-details`]],decls:11,vars:9,consts:[[`exportMenu`,`matMenu`],[3,`title`,`subtitle`],[`actions`,``],[`mat-stroked-button`,``,3,`click`],[1,`flex`,`justify-center`,`items-center`,`py-20`],[1,`max-w-7xl`,`mx-auto`,`px-4`,`py-8`],[1,`max-w-12xl`,`mx-auto`,`px-4`,`py-6`],[`matButton`,`outlined`,3,`matMenuTriggerFor`,`disabled`],[`mat-menu-item`,``,3,`click`],[`diameter`,`50`],[`appearance`,`outlined`],[1,`text-center`,`py-8`],[1,`!text-6xl`,`text-red-500`,`mb-4`],[1,`text-lg`,`font-semibold`,`mb-2`],[1,`text-gray-600`,`mb-4`],[`mat-flat-button`,``,`color`,`warn`,3,`click`],[`appearance`,`outlined`,1,`mb-4`,`!border-l-4`,3,`!border-l-orange-500`,`!border-l-green-600`],[`appearance`,`outlined`,1,`mb-4`,`!border-l-4`,`!border-l-blue-500`],[`appearance`,`outlined`,1,`mb-4`,`!border-l-4`,`!border-l-pink-500`],[`appearance`,`outlined`,1,`mb-4`],[1,`py-4`],[1,`flex`,`items-center`,`justify-between`],[1,`flex`,`items-center`,`gap-4`],[1,`text-2xl`,`font-bold`],[1,`text-sm`,`text-gray-600`],[1,`text-right`,`space-y-2`],[1,`flex`,`gap-2`,`justify-end`],[1,`!bg-blue-100`,`!text-blue-800`],[1,`grid`,`grid-cols-1`,`lg:grid-cols-3`,`gap-6`],[1,`lg:col-span-2`,`space-y-6`],[1,`grid`,`grid-cols-1`,`md:grid-cols-2`,`gap-6`,`mt-4`],[1,`block`,`text-sm`,`font-medium`,`text-gray-700`,`mb-1`],[1,`text-lg`,`font-semibold`],[1,`text-sm`],[1,`text-xs`,`text-gray-500`,`mt-1`],[1,`md:col-span-2`],[`appearance`,`outlined`,1,`PY`],[1,`!p-0`],[1,`overflow-x-auto`,`py-2`],[`mat-table`,``,1,`w-full`,3,`dataSource`],[`matColumnDef`,`product`],[`mat-header-cell`,``,4,`matHeaderCellDef`],[`mat-cell`,``,4,`matCellDef`],[`matColumnDef`,`options`],[`matColumnDef`,`quantity`],[`mat-header-cell`,``,`class`,`text-center`,4,`matHeaderCellDef`],[`mat-cell`,``,`class`,`text-center`,4,`matCellDef`],[`matColumnDef`,`price`],[`mat-header-cell`,``,`class`,`text-right`,4,`matHeaderCellDef`],[`mat-cell`,``,`class`,`text-right font-medium`,4,`matCellDef`],[`matColumnDef`,`subtotal`],[`mat-cell`,``,`class`,`text-right font-bold`,4,`matCellDef`],[`mat-header-row`,``,4,`matHeaderRowDef`],[`mat-row`,``,4,`matRowDef`,`matRowDefColumns`],[1,`space-y-6`],[`appearance`,`outlined`,1,`!border-l-4`,`!border-l-pink-500`],[1,`space-y-3`,`mt-4`],[1,`flex`,`justify-between`,`text-sm`],[1,`text-gray-600`],[1,`font-medium`],[1,`border-t`,`border-gray-300`,`pt-3`,`mt-3`],[1,`border-t`,`border-outline-variant`,`mt-4`,`pt-4`],[1,`flex`,`justify-between`,`w-full`,`text-lg`],[1,`font-bold`],[1,`font-bold`,`text-right`],[`appearance`,`outlined`,1,`mb-4`,`!border-l-4`],[1,`flex`,`flex-wrap`,`items-center`,`justify-between`,`gap-3`,`py-3`],[1,`flex`,`items-center`,`gap-3`],[1,`flex`,`gap-2`],[`mat-stroked-button`,``,3,`click`,`disabled`],[`mat-flat-button`,``,`color`,`primary`,3,`click`,`disabled`],[1,`animate-spin`],[1,`flex`,`items-center`,`gap-3`,`py-3`],[1,`text-blue-600`],[1,`text-pink-600`],[1,`text-sm`,`whitespace-pre-line`,`bg-amber-50`,`rounded-md`,`p-3`],[`mat-header-cell`,``],[`mat-cell`,``],[1,`flex`,`items-center`,`gap-3`,`py-2`],[1,`w-12`,`h-12`,`rounded`,`object-cover`,3,`src`,`alt`],[1,`w-12`,`h-12`,`bg-gray-200`,`rounded`,`flex`,`items-center`,`justify-center`],[1,`text-xs`,`text-gray-500`],[1,`flex`,`items-center`,`gap-1`,`text-xs`,`text-gray-500`],[1,`text-gray-400`],[1,`!text-sm`,`!w-3.5`,`!h-3.5`],[1,`space-y-1`],[1,`!text-xs`],[`mat-header-cell`,``,1,`text-center`],[`mat-cell`,``,1,`text-center`],[1,`inline-flex`,`items-center`,`justify-center`,`w-8`,`h-8`,`bg-indigo-100`,`text-indigo-700`,`rounded-full`,`font-semibold`,`text-sm`],[`mat-header-cell`,``,1,`text-right`],[`mat-cell`,``,1,`text-right`,`font-medium`],[`mat-cell`,``,1,`text-right`,`font-bold`],[`mat-header-row`,``],[`mat-row`,``],[`matListItemTitle`,``],[`matListItemMeta`,``],[`matListItemMeta`,``,1,`break-all`],[1,`flex`,`items-center`,`gap-2`],[1,`font-medium`,`text-indigo-600`,`hover:text-indigo-800`,`underline`,3,`routerLink`],[1,`!text-xs`,`!bg-pink-100`,`!text-pink-700`],[1,`space-y-4`,`mt-4`],[1,`text-sm`,`bg-pink-50`,`p-3`,`rounded`,`border`,`border-pink-100`],[1,`font-medium`,`text-green-600`],[1,`text-gray-700`,`flex`,`items-center`,`gap-1`],[1,`!text-base`,`text-amber-500`],[1,`font-semibold`,`text-amber-600`],[1,`bg-blue-50`,`border`,`border-blue-200`,`rounded-lg`,`p-4`],[1,`flex`,`justify-between`,`items-center`,`mb-2`],[1,`text-sm`,`font-medium`,`text-blue-900`],[1,`!text-xs`,`!bg-blue-100`,`!text-blue-700`],[1,`text-2xl`,`font-bold`,`text-blue-600`],[1,`bg-pink-50`,`border`,`border-pink-200`,`rounded-lg`,`p-4`],[1,`text-sm`,`font-medium`,`text-pink-900`],[1,`text-2xl`,`font-bold`,`text-pink-600`],[1,`bg-green-50`,`border`,`border-green-200`,`rounded-lg`,`p-4`],[1,`text-sm`,`font-medium`,`text-green-900`],[1,`text-2xl`,`font-bold`,`text-green-600`]],template:function(t,r){t&1&&($r(0,`app-page-header`,1),ZD(1,`date`),Ec(2,2),$r(3,`button`,3),Gp(`click`,function(){return r.goBack()}),$r(4,`mat-icon`),SD(5,`arrow_back`),vc(),SD(6,` Back `),vc(),rE(7,ct,16,4),ci$1(),vc(),rE(8,mt,2,0,`div`,4),rE(9,pt,11,1,`div`,5),rE(10,mi,130,86,`div`,6)),t&2&&(yp(`title`,r.orderResource.hasValue()?`Receipt #`+r.orderResource.value().reference:`Receipt Details`)(`subtitle`,r.orderResource.hasValue()?`Created on `+JD(1,6,r.orderResource.value().createdAt,`medium`):`Loading receipt...`),$v(7),sE(r.orderResource.hasValue()&&!r.orderResource.isLoading()?7:-1),$v(),sE(r.orderResource.isLoading()?8:-1),$v(),sE(r.orderResource.error()?9:-1),$v(),sE(r.orderResource.hasValue()&&!r.orderResource.isLoading()?10:-1))},dependencies:[Fn,E$2,_,T,k,j,A,Mt$1,wt$1,Lt$1,jt$1,J,Z,Ot$1,P,G$2,At$1,eo,Wt$1,$t$1,Gt$1,Kt$1,Qt$1,Yt$1,qt$2,Xt$1,Zt$1,Jt$1,Bt$2,G$1,E$1,Ei,Ii,Ai,Mt$2,Wt$2,da,qt$1,ln,Cn,hn],styles:[`[_nghost-%COMP%]{display:block}`],changeDetection:1})};export{ot as ReceiptsDetailsComponent};
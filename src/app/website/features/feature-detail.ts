import { Component, computed, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';

export interface FeatureData {
  slug: string;
  title: string;
  subtitle: string;
  heroDescription: string;
  icon: string;
  color: string;
  bgColor: string;
  highlights: { icon: string; title: string; description: string }[];
  benefits: string[];
  screenshotPlaceholder: string;
  detailSections: { title: string; description: string; icon: string }[];
}

const FEATURES: FeatureData[] = [
  {
    slug: 'pms',
    title: 'Property Management System',
    subtitle: 'Complete Hotel Operations',
    heroDescription: 'Manage your entire hotel operation from a single dashboard. From room assignments to guest check-ins, our PMS streamlines every aspect of property management so you can focus on delivering exceptional guest experiences.',
    icon: 'hotel',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    screenshotPlaceholder: 'PMS Dashboard — Room Grid & Booking Overview',
    highlights: [
      { icon: 'calendar_month', title: 'Reservation Calendar', description: 'Visual calendar with drag-and-drop booking management, color-coded room status, and real-time availability updates.' },
      { icon: 'meeting_room', title: 'Room Management', description: 'Track room types, status (clean, dirty, occupied, maintenance), and manage room assignments effortlessly.' },
      { icon: 'person', title: 'Guest Profiles', description: 'Maintain detailed guest records including preferences, stay history, and loyalty information for personalized service.' },
      { icon: 'check_circle', title: 'Check-in / Check-out', description: 'Streamlined check-in and check-out workflows with ID verification, key card assignment, and folio management.' },
    ],
    benefits: [
      'Reduce front-desk check-in time by 60%',
      'Eliminate overbookings with real-time availability sync',
      'Improve guest satisfaction with preference tracking',
      'Automate room assignment based on guest preferences',
      'Centralized dashboard for all property operations',
      'Multi-property support for hotel chains',
    ],
    detailSections: [
      { title: 'Front Desk Operations', description: 'A streamlined front desk interface that handles walk-ins, group bookings, room moves, and early/late check-outs. Staff can quickly view room availability, process payments, and print registration cards.', icon: 'desktop_windows' },
      { title: 'Housekeeping Integration', description: 'Automatic room status updates sync with housekeeping schedules. When a guest checks out, rooms are flagged for cleaning and updated in real-time as housekeeping completes their tasks.', icon: 'cleaning_services' },
      { title: 'Night Audit & Reporting', description: 'Automated night audit process that reconciles daily transactions, posts room charges, and generates end-of-day reports. Track occupancy rates, ADR, RevPAR, and other key metrics.', icon: 'summarize' },
    ],
  },
  {
    slug: 'pos',
    title: 'POS — Food & Beverage',
    subtitle: 'Restaurant & Bar Management',
    heroDescription: 'A fast, intuitive point-of-sale system designed for restaurants, bars, cafes, and room service. Process orders quickly, manage tables, split bills, and keep your kitchen running smoothly.',
    icon: 'point_of_sale',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    screenshotPlaceholder: 'POS Terminal — Order Entry & Table View',
    highlights: [
      { icon: 'restaurant_menu', title: 'Menu Management', description: 'Create and organize menus with categories, modifiers, pricing tiers, and beautiful food photography support.' },
      { icon: 'table_restaurant', title: 'Table Management', description: 'Visual floor plan with real-time table status, capacity tracking, and easy drag-and-drop table assignment.' },
      { icon: 'receipt_long', title: 'Order & Billing', description: 'Split bills, apply discounts, process multiple payment types, and generate itemized receipts instantly.' },
      { icon: 'kitchen', title: 'Kitchen Display System', description: 'Route orders to the right kitchen station automatically with priority queuing and preparation time tracking.' },
    ],
    benefits: [
      'Process orders 3x faster with touch-optimized interface',
      'Reduce order errors with kitchen display integration',
      'Increase revenue with smart upselling suggestions',
      'Track food costs and waste in real-time',
      'Support for dine-in, takeaway, and delivery',
      'Bluetooth receipt printing at the table',
    ],
    detailSections: [
      { title: 'Quick Service Mode', description: 'Optimized for fast-paced environments like cafes and food courts. Quick product lookup, barcode scanning, and one-tap checkout for speed and efficiency.', icon: 'speed' },
      { title: 'Multi-Outlet Support', description: 'Manage multiple restaurants, bars, and room service outlets from a single system. Each outlet has its own menu, pricing, and reporting while sharing a central inventory.', icon: 'store' },
      { title: 'Real-Time Analytics', description: 'Track bestselling items, peak hours, average order value, and server performance. Make data-driven decisions to optimize your menu and staffing.', icon: 'trending_up' },
    ],
  },
  {
    slug: 'accounting',
    title: 'Accounting & Expenses',
    subtitle: 'Financial Management',
    heroDescription: 'Keep your finances organized with built-in accounting tools. Track every transaction, manage expenses, generate invoices, and get a complete picture of your financial health at any time.',
    icon: 'account_balance',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    screenshotPlaceholder: 'Accounting Dashboard — P&L & Expense Breakdown',
    highlights: [
      { icon: 'receipt', title: 'Expense Tracking', description: 'Categorize and track all business expenses with receipt scanning, approval workflows, and budget monitoring.' },
      { icon: 'account_balance_wallet', title: 'Revenue Management', description: 'Monitor revenue streams across rooms, F&B, events, and ancillary services with real-time financial dashboards.' },
      { icon: 'description', title: 'Invoice Generation', description: 'Create professional invoices for corporate clients, travel agents, and event planners with automated billing cycles.' },
      { icon: 'assessment', title: 'Financial Reports', description: 'Generate profit & loss statements, balance sheets, cash flow reports, and tax summaries on demand.' },
    ],
    benefits: [
      'Automate daily revenue posting from PMS and POS',
      'Reduce manual bookkeeping by 80%',
      'Real-time visibility into cash flow and profitability',
      'Simplified tax reporting with categorized transactions',
      'Multi-currency support for international properties',
      'Export data to popular accounting software',
    ],
    detailSections: [
      { title: 'Automated Reconciliation', description: 'Daily revenue from room charges, restaurant bills, and other services is automatically reconciled with payment records. Discrepancies are flagged for review.', icon: 'sync_alt' },
      { title: 'Budget Planning', description: 'Set departmental budgets, track spending against targets, and receive alerts when expenses approach limits. Compare actual vs. budgeted performance.', icon: 'savings' },
      { title: 'Audit Trail', description: 'Every financial transaction is logged with timestamp, user, and reason. Maintain complete audit compliance with exportable transaction histories.', icon: 'policy' },
    ],
  },
  {
    slug: 'inventory',
    title: 'Purchasing & Inventory',
    subtitle: 'Supply Chain Management',
    heroDescription: 'Never run out of essentials again. Manage suppliers, automate purchase orders, track stock levels across all departments, and minimize waste with smart inventory controls.',
    icon: 'inventory_2',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    screenshotPlaceholder: 'Inventory Dashboard — Stock Levels & Purchase Orders',
    highlights: [
      { icon: 'local_shipping', title: 'Supplier Management', description: 'Maintain a supplier directory with contact details, pricing agreements, lead times, and performance ratings.' },
      { icon: 'shopping_cart', title: 'Purchase Orders', description: 'Create, approve, and track purchase orders with automated reorder points and multi-level approval workflows.' },
      { icon: 'warehouse', title: 'Stock Management', description: 'Track inventory across multiple storage locations with real-time stock levels, expiry tracking, and transfer management.' },
      { icon: 'trending_down', title: 'Waste Reduction', description: 'Monitor consumption patterns, identify waste, and optimize ordering to reduce food spoilage and overstocking.' },
    ],
    benefits: [
      'Reduce stockouts with automated reorder alerts',
      'Lower food costs with waste tracking and analysis',
      'Streamline procurement with digital purchase orders',
      'Track inventory value and cost of goods sold',
      'Manage recipes and ingredient costs accurately',
      'Barcode scanning for fast stock counts',
    ],
    detailSections: [
      { title: 'Recipe & Cost Management', description: 'Define recipes with ingredient quantities, calculate dish costs automatically, and monitor food cost percentages. Adjust menu pricing based on real ingredient costs.', icon: 'menu_book' },
      { title: 'Multi-Location Inventory', description: 'Track stock across the main kitchen, bar, housekeeping store, and any other storage locations. Manage inter-department transfers and maintain accurate counts everywhere.', icon: 'hub' },
      { title: 'Vendor Portal', description: 'Suppliers can view and confirm purchase orders, update delivery schedules, and submit invoices digitally. Streamline communication and reduce errors.', icon: 'handshake' },
    ],
  },
  {
    slug: 'housekeeping',
    title: 'Housekeeping & Maintenance',
    subtitle: 'Property Care Management',
    heroDescription: 'Keep your property in pristine condition with intelligent housekeeping scheduling, maintenance task tracking, and real-time room status updates that sync across your entire team.',
    icon: 'cleaning_services',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    screenshotPlaceholder: 'Housekeeping Dashboard — Room Status Board',
    highlights: [
      { icon: 'event_available', title: 'Smart Scheduling', description: 'Auto-assign cleaning tasks based on check-out times, room priority, and staff availability with optimized routing.' },
      { icon: 'checklist', title: 'Task Checklists', description: 'Customizable cleaning checklists ensure consistency. Housekeepers mark tasks complete on mobile devices in real-time.' },
      { icon: 'build', title: 'Maintenance Requests', description: 'Log, assign, and track maintenance issues with photo documentation, priority levels, and resolution timelines.' },
      { icon: 'update', title: 'Real-Time Status', description: 'Room status updates instantly visible to front desk, housekeeping supervisors, and management on a live dashboard.' },
    ],
    benefits: [
      'Cut room turnaround time by 40%',
      'Ensure consistent cleaning quality with checklists',
      'Reduce maintenance response time with mobile alerts',
      'Track housekeeping productivity and staff performance',
      'Automate room status updates to front desk',
      'Manage lost-and-found items digitally',
    ],
    detailSections: [
      { title: 'Mobile Housekeeping App', description: 'Housekeepers receive tasks on their mobile device, view room details, follow checklists, report issues with photos, and mark rooms as clean — all without visiting the front desk.', icon: 'phone_android' },
      { title: 'Preventive Maintenance', description: 'Schedule recurring maintenance tasks for HVAC, plumbing, electrical, and other systems. Track equipment lifecycle and plan capital expenditure based on condition assessments.', icon: 'engineering' },
      { title: 'Linen & Minibar Tracking', description: 'Track linen inventory, laundry cycles, and minibar restocking. Automate reorder triggers and monitor usage patterns per room type.', icon: 'local_laundry_service' },
    ],
  },
  {
    slug: 'reporting',
    title: 'Reporting & Analytics',
    subtitle: 'Data-Driven Decisions',
    heroDescription: 'Transform raw data into actionable insights. Our reporting suite gives you real-time visibility into occupancy, revenue, guest satisfaction, and operational efficiency across your entire property.',
    icon: 'analytics',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    screenshotPlaceholder: 'Analytics Dashboard — Revenue & Occupancy Charts',
    highlights: [
      { icon: 'bar_chart', title: 'Revenue Analytics', description: 'Track ADR, RevPAR, TRevPAR, and GOPPAR with trend analysis and year-over-year comparisons.' },
      { icon: 'pie_chart', title: 'Occupancy Reports', description: 'Monitor occupancy rates by room type, day of week, and season. Forecast demand and optimize pricing.' },
      { icon: 'groups', title: 'Guest Analytics', description: 'Understand guest demographics, booking patterns, length of stay, and channel mix for targeted marketing.' },
      { icon: 'leaderboard', title: 'Performance Dashboards', description: 'Customizable dashboards with KPI widgets, alerts, and drill-down capabilities for management at every level.' },
    ],
    benefits: [
      'Make data-driven pricing and staffing decisions',
      'Identify revenue opportunities with trend analysis',
      'Benchmark performance against industry standards',
      'Automate daily, weekly, and monthly report generation',
      'Export reports in PDF, Excel, or CSV format',
      'Role-based dashboards for GMs, owners, and departments',
    ],
    detailSections: [
      { title: 'Revenue Management Intelligence', description: 'AI-powered rate suggestions based on demand patterns, competitor pricing, and historical data. Optimize room rates to maximize revenue per available room.', icon: 'auto_graph' },
      { title: 'Operational Reports', description: 'Departmental performance reports covering housekeeping efficiency, maintenance response times, F&B covers, and staff productivity. Identify bottlenecks and optimize operations.', icon: 'assignment' },
      { title: 'Custom Report Builder', description: 'Create custom reports by selecting metrics, date ranges, and visualization types. Save report templates and schedule automated distribution to stakeholders.', icon: 'dashboard_customize' },
    ],
  },
  {
    slug: 'booking-engine',
    title: 'Booking Engine',
    subtitle: 'Direct Online Reservations',
    heroDescription: 'Accept direct bookings from your website with a beautiful, conversion-optimized booking engine. Reduce OTA commissions, build guest relationships, and offer exclusive direct-booking perks.',
    icon: 'language',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    screenshotPlaceholder: 'Booking Widget — Room Selection & Rate Display',
    highlights: [
      { icon: 'web', title: 'Website Integration', description: 'Embed the booking widget on your website in minutes. Fully customizable to match your brand colors and style.' },
      { icon: 'phone_iphone', title: 'Mobile Optimized', description: 'Responsive design ensures a seamless booking experience on phones, tablets, and desktops with fast load times.' },
      { icon: 'loyalty', title: 'Promo Codes & Packages', description: 'Create promotional rates, seasonal packages, and loyalty discounts to incentivize direct bookings.' },
      { icon: 'lock', title: 'Secure Payments', description: 'PCI-compliant payment processing with support for credit cards, bank transfers, and popular payment gateways.' },
    ],
    benefits: [
      'Save 15–25% on OTA commissions per booking',
      'Own the guest relationship from first interaction',
      'Offer best-rate guarantees for direct bookings',
      'Capture guest emails for direct marketing',
      'Real-time rate and availability sync with PMS',
      'Multi-language and multi-currency support',
    ],
    detailSections: [
      { title: 'Conversion Optimization', description: 'Built-in urgency indicators, social proof ("5 people viewing"), and abandoned booking recovery emails to maximize conversion rates and capture more direct revenue.', icon: 'rocket_launch' },
      { title: 'Rate Comparison Widget', description: 'Show guests that your direct rates are the best by displaying a real-time comparison with OTA prices. Build trust and encourage direct bookings with transparent pricing.', icon: 'compare_arrows' },
      { title: 'Guest Self-Service Portal', description: 'Guests can manage their bookings, request room upgrades, add special requests, and complete online check-in before arrival — reducing front desk workload.', icon: 'person_pin' },
    ],
  },
  {
    slug: 'channel-manager',
    title: 'Channel Manager',
    subtitle: 'Distribution Management',
    heroDescription: 'Manage rates and availability across all online channels from one place. Sync with Booking.com, Expedia, Airbnb, and 200+ other platforms in real-time to maximize exposure and prevent overbookings.',
    icon: 'sync',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    screenshotPlaceholder: 'Channel Manager — Rate & Availability Grid',
    highlights: [
      { icon: 'cloud_sync', title: 'Real-Time Sync', description: 'Two-way synchronization ensures rates, availability, and restrictions are always up-to-date across every connected channel.' },
      { icon: 'tune', title: 'Rate Management', description: 'Set base rates and apply channel-specific markups, discounts, or restrictions. Manage rate plans, minimum stays, and close-outs centrally.' },
      { icon: 'hub', title: '200+ Channels', description: 'Connect to major OTAs, GDS systems, metasearch engines, and niche platforms with pre-built integrations powered by Channex.' },
      { icon: 'block', title: 'Overbooking Prevention', description: 'Automatic inventory updates across all channels when a booking is made, modified, or cancelled — eliminating double bookings.' },
    ],
    benefits: [
      'Eliminate overbookings with real-time inventory sync',
      'Save hours of manual rate updates across platforms',
      'Maximize visibility on all major booking channels',
      'Optimize channel mix based on commission and performance',
      'Centralized control of restrictions and close-outs',
      'Automated mapping of room types and rate plans',
    ],
    detailSections: [
      { title: 'Channex Integration', description: 'Powered by Channex, our channel manager connects seamlessly with 200+ OTAs and booking platforms. Set up once, and rates, availability, and restrictions flow automatically to all channels.', icon: 'electrical_services' },
      { title: 'Revenue Optimization', description: 'Analyze channel performance by revenue, commission cost, and booking volume. Shift inventory to higher-performing channels and optimize your distribution strategy.', icon: 'monetization_on' },
      { title: 'Bulk Rate Updates', description: 'Update rates across multiple room types, rate plans, and channels simultaneously. Apply seasonal pricing, last-minute deals, or promotional rates in seconds.', icon: 'edit_note' },
    ],
  },
];

@Component({
  selector: 'app-feature-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './feature-detail.html',
  styleUrl: './feature-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected feature = signal<FeatureData | null>(null);
  protected otherFeatures = computed(() => {
    const current = this.feature();
    if (!current) return FEATURES;
    return FEATURES.filter(f => f.slug !== current.slug);
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      const found = FEATURES.find(f => f.slug === slug);
      if (found) {
        this.feature.set(found);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.router.navigate(['/home']);
      }
    });
  }

  navigateToSignup(): void {
    this.router.navigate(['/auth/signup']);
  }
}

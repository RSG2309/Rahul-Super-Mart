'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, Calendar, Scale, Ban } from 'lucide-react';

export default function AntiPricingManipulation() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full text-left">
        
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
          <span>Home</span>
          <span>/</span>
          <span className="text-indigo-600">Anti-Pricing Manipulation</span>
        </div>

        {/* Page Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={28} /> Anti-Pricing Manipulation Policy
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
              <Calendar size={13} className="text-slate-400" /> **Effective Date:** July 16, 2026
            </p>
          </div>
          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full shadow-sm">
            <Scale size={11} /> Fair Sourcing
          </span>
        </div>

        {/* Content Container */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-8 text-slate-700 leading-relaxed text-sm">
          
          <p className="text-slate-600">
            This Anti-Pricing Manipulation Policy (&quot;Policy&quot;) applies to all retailers, distributors, wholesalers, and business customers purchasing products from <strong>Rahul Super Mart</strong>, operated by <strong>Vishal Telecom Pvt. Ltd.</strong> (Rahul Super Mart is a business unit of Vishal Telecom)
          </p>

          <p className="text-slate-600">
            Our goal is to maintain fair, transparent, and competitive pricing for all business customers.
          </p>

          <hr className="border-slate-100" />

          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">1</span>
              Purpose
            </h3>
            <p>This Policy is designed to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Promote fair business practices.</li>
              <li>Prevent artificial price manipulation.</li>
              <li>Ensure equal pricing opportunities for eligible buyers.</li>
              <li>Protect customers from fraudulent pricing activities.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">2</span>
              Product Categories
            </h3>
            <p>This Policy applies to all products sold by Rahul Super Mart, including but not limited to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Grocery &amp; Daily Essentials</li>
              <li>Cosmetics &amp; Personal Care</li>
              <li>Electronics &amp; Accessories</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">3</span>
              Fair Pricing
            </h3>
            <p>Prices displayed on our platform are determined based on various business factors, including:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Manufacturer pricing</li>
              <li>Wholesale procurement cost</li>
              <li>Taxes and statutory charges</li>
              <li>Logistics and operational expenses</li>
              <li>Promotional campaigns</li>
              <li>Market conditions</li>
            </ul>
            <p className="text-xs text-slate-500 italic pt-1">Prices may change without prior notice.</p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">4</span>
              Prohibited Activities
            </h3>
            <p>Buyers must not engage in any activities that disrupt fair pricing. Prohibited actions include:</p>
            
            <div className="bg-rose-50/50 border border-rose-100/75 rounded-2xl p-5 space-y-3">
              <div className="flex gap-3 text-xs text-slate-700">
                <Ban size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p><strong>Fraudulent Accounts:</strong> Manipulating discount slabs or pricing using fake, duplicate, or proxy accounts.</p>
              </div>
              <div className="flex gap-3 text-xs text-slate-700">
                <Ban size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p><strong>Exploitative Automation:</strong> Using automated tools, bots, crawlers, or scripts to monitor, scrape, or exploit promotional price structures.</p>
              </div>
              <div className="flex gap-3 text-xs text-slate-700">
                <Ban size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p><strong>Misleading Orders:</strong> Placing fake or speculative bulk orders without payment intent to artificially block stock and influence pricing.</p>
              </div>
              <div className="flex gap-3 text-xs text-slate-700">
                <Ban size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p><strong>Slab Abuse:</strong> Coordinating with other buyers or dividing single orders to manipulate demand metrics, slab configurations, or discount thresholds.</p>
              </div>
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">5</span>
              Promotional Offers
            </h3>
            <p>Discounts and promotional pricing:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>May be time-limited.</li>
              <li>May be quantity-limited.</li>
              <li>May be restricted to eligible customers.</li>
              <li>Cannot be transferred, resold, or misused.</li>
            </ul>
            <p>We reserve the right to modify or withdraw promotional offers at any time.</p>
          </div>

          {/* Section 6 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">6</span>
              Pricing Errors
            </h3>
            <p>Despite our best efforts, pricing errors may occasionally occur. If an incorrect price is displayed due to technical issues, human error, software malfunction, or supplier pricing updates, Rahul Super Mart reserves the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Cancel the affected order,</li>
              <li>Correct the pricing on the platform,</li>
              <li>Contact the buyer before processing or dispatching the order,</li>
              <li>Issue a full refund to the buyer&apos;s wallet where payment has already been received.</li>
            </ul>
          </div>

          {/* Section 7 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">7</span>
              Bulk Purchase Monitoring
            </h3>
            <p>To maintain fair distribution and prevent speculative hoarding, unusually large or suspicious orders may be reviewed before processing.</p>
            <p>Orders may be delayed, modified, or cancelled if fraudulent or abusive activity is reasonably suspected.</p>
          </div>

          {/* Section 8 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">8</span>
              Marketplace Compliance
            </h3>
            <p>Retailers purchasing products through Rahul Super Mart are expected to comply with all applicable laws and marketplace rules.</p>
            <p>This Policy does <strong>not</strong> require buyers to sell products at any fixed resale price. Buyers remain responsible for determining their own resale prices, subject to applicable law.</p>
          </div>

          {/* Section 9 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">9</span>
              Investigation
            </h3>
            <p>Where suspicious pricing activity is detected, we may:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Review transaction history.</li>
              <li>Verify account information.</li>
              <li>Request additional business verification.</li>
              <li>Suspend order processing during investigation.</li>
            </ul>
          </div>

          {/* Section 10 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">10</span>
              Enforcement
            </h3>
            <p>Violation of this Policy may result in one or more of the following actions:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Warning notice.</li>
              <li>Cancellation of affected orders.</li>
              <li>Removal of promotional benefits.</li>
              <li>Temporary account suspension.</li>
              <li>Permanent account termination.</li>
              <li>Reporting fraudulent activities to the appropriate authorities where required by law.</li>
            </ul>
          </div>

          {/* Section 11 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">11</span>
              Policy Updates
            </h3>
            <p>Vishal Telecom Pvt. Ltd. may update this Policy from time to time. The latest version will always be available on our website and will become effective upon publication.</p>
          </div>

          {/* Section 12 */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">12</span>
              Contact Information
            </h3>
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 space-y-2 text-xs text-slate-600">
              <p className="font-extrabold text-slate-900 text-sm">Rahul Super Mart (A Unit of Vishal Telecom)</p>
              <p>Operated by <strong>Vishal Telecom Pvt. Ltd.</strong></p>
              <p><strong>Address:</strong> Sikta Bazar, West Champaran, Bihar – 845307, India</p>
              <p><strong>Email:</strong> vishaltelecomskt@gmail.com</p>
              <p><strong>Phone:</strong> +91 8210302931</p>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}

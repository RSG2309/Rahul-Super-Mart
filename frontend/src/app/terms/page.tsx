'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FileText, Calendar, Scale, Shield } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full text-left">
        
        {/* Breadcrumb / Top Bar */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
          <span>Home</span>
          <span>/</span>
          <span className="text-indigo-600">Terms of Service</span>
        </div>

        {/* Page Header */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-indigo-600" size={28} /> B2B Terms of Service
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
              <Calendar size={13} className="text-slate-400" /> **Effective Date:** July 16, 2026
            </p>
          </div>
          <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full shadow-sm">
            <Scale size={11} /> Business-to-Business
          </span>
        </div>

        {/* Content Container */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-8 text-slate-700 leading-relaxed text-sm">
          
          <p className="text-slate-600">
            Welcome to <strong>Rahul Super Mart</strong>, operated by <strong>Vishal Telecom Pvt. Ltd.</strong> (Rahul Super Mart is a business division of Vishal Telecom). These Business-to-Business (B2B) Terms of Service (&quot;Terms&quot;) govern the use of our website, mobile application, and related services by retailers, wholesalers, distributors, and other business customers (&quot;Buyer&quot;, &quot;You&quot;, or &quot;Your&quot;).
          </p>

          <p className="text-slate-600">
            By creating an account, placing an order, or using our platform, you agree to these Terms.
          </p>

          <hr className="border-slate-100" />

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">1</span>
              Company Information
            </h3>
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-1.5 text-xs text-slate-600">
              <p><strong>Business Name:</strong> Rahul Super Mart (A Unit of Vishal Telecom)</p>
              <p><strong>Legal Entity:</strong> Vishal Telecom Pvt. Ltd.</p>
              <p><strong>Business Address:</strong> Sikta Bazar, West Champaran, Bihar – 845307, India</p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">2</span>
              Eligibility
            </h3>
            <p>Our platform is intended solely for businesses.</p>
            <p>By using our platform, you confirm that:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>You are at least 18 years of age.</li>
              <li>You are authorized to purchase on behalf of your business.</li>
              <li>The information provided during registration is accurate and complete.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">3</span>
              Business Account
            </h3>
            <p>To place orders, you may be required to create a business account.</p>
            <p>You agree to:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Maintain accurate business information.</li>
              <li>Keep your login credentials secure.</li>
              <li>Notify us immediately if you suspect unauthorized access.</li>
            </ul>
            <p className="text-xs text-slate-500 italic pt-1">
              We reserve the right to suspend or terminate accounts involved in fraud, misuse, or violations of these Terms.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">4</span>
              Orders
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>All orders are subject to acceptance by Vishal Store.</li>
              <li>We may cancel or reject any order due to stock unavailability, pricing errors, suspected fraud, or other legitimate business reasons.</li>
              <li>Order confirmation does not guarantee shipment until processing is complete.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">5</span>
              Pricing
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Prices displayed are intended for registered business customers.</li>
              <li>Prices may change without prior notice.</li>
              <li>Applicable GST and other taxes will be charged as required under Indian law.</li>
              <li>Promotional pricing may be available for limited periods.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">6</span>
              Payment
            </h3>
            <p>We may accept payments through:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['UPI', 'PhonePe', 'Razorpay', 'Bank Transfer', 'Cash on Collect Order'].map((m) => (
                <span key={m} className="bg-slate-100 border border-slate-200 text-slate-800 text-xs px-3 py-1 rounded-lg font-semibold">
                  {m}
                </span>
              ))}
            </div>
            <p className="pt-2">Orders may be processed only after successful payment unless Cash on Collect Order has been selected and approved.</p>
          </div>

          {/* Section 7 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">7</span>
              Shipping and Delivery
            </h3>
            <p>We offer:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Home Delivery (where available)</li>
              <li>Store Pickup (Self Pickup)</li>
            </ul>
            <p>Estimated delivery timelines are provided for convenience and may vary depending on logistics, location, holidays, or unforeseen circumstances.</p>
          </div>

          {/* Section 8 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">8</span>
              Store Pickup
            </h3>
            <p>For Store Pickup (Self Pickup) orders:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Buyers must collect the order within the specified pickup period.</li>
              <li>A valid order confirmation may be required.</li>
              <li>Failure to collect the order within the allowed period may result in cancellation.</li>
            </ul>
          </div>

          {/* Section 9 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">9</span>
              Product Availability
            </h3>
            <p>All products are subject to availability.</p>
            <p>If any product becomes unavailable after an order is placed, we may:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Cancel the affected item(s),</li>
              <li>Offer an alternative product (subject to buyer approval), or</li>
              <li>Issue a refund to your wallet for the unavailable item(s), where applicable.</li>
            </ul>
          </div>

          {/* Section 10 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">10</span>
              Returns and Refunds
            </h3>
            <p>Returns or replacements may be accepted only in accordance with our Return & Refund Policy.</p>
            <p>Products may qualify for return if:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>The wrong product was delivered,</li>
              <li>The product was damaged during transit,</li>
              <li>The product has a manufacturing defect.</li>
            </ul>
            <p>Return requests should be submitted within the period specified in our Return Policy.</p>
          </div>

          {/* Section 11 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">11</span>
              Buyer Responsibilities
            </h3>
            <p>The Buyer agrees:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Not to misuse the platform.</li>
              <li>Not to engage in fraudulent activities.</li>
              <li>Not to attempt unauthorized access to our systems.</li>
              <li>Not to reproduce, copy, or misuse our content without permission.</li>
            </ul>
          </div>

          {/* Section 12 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">12</span>
              Intellectual Property
            </h3>
            <p>All website content, including logos, product listings, graphics, software, text, and trademarks, belongs to Vishal Telecom Pvt. Ltd. or its licensors and is protected under applicable intellectual property laws.</p>
          </div>

          {/* Section 13 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">13</span>
              Limitation of Liability
            </h3>
            <p>To the maximum extent permitted by law, Vishal Telecom Pvt. Ltd. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of our platform or products.</p>
            <p>Our total liability shall not exceed the amount paid for the relevant order.</p>
          </div>

          {/* Section 14 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">14</span>
              Account Suspension
            </h3>
            <p>We reserve the right to suspend or terminate accounts that:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Violate these Terms,</li>
              <li>Engage in fraudulent transactions,</li>
              <li>Misrepresent business information,</li>
              <li>Abuse promotional offers or payment systems.</li>
            </ul>
          </div>

          {/* Section 15 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">15</span>
              Force Majeure
            </h3>
            <p>We shall not be liable for delays or failures caused by events beyond our reasonable control, including natural disasters, strikes, government actions, internet outages, pandemics, or transportation disruptions.</p>
          </div>

          {/* Section 16 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">16</span>
              Privacy
            </h3>
            <p>Your use of the platform is also governed by our Privacy Policy.</p>
          </div>

          {/* Section 17 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">17</span>
              Governing Law
            </h3>
            <p>These Terms shall be governed by the laws of India.</p>
            <p>Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>West Champaran, Bihar</strong>, unless otherwise required by applicable law.</p>
          </div>

          {/* Section 18 */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">18</span>
              Changes to These Terms
            </h3>
            <p>We may update these Terms from time to time.</p>
            <p>Updated versions will become effective upon publication on our website.</p>
            <p>Continued use of the platform after such updates constitutes acceptance of the revised Terms.</p>
          </div>

          {/* Section 19 */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">19</span>
              Contact Us
            </h3>
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 space-y-2 text-xs text-slate-600">
              <p className="font-extrabold text-slate-900 text-sm">Vishal Store</p>
              <p>Operated by <strong>Vishal Telecom Pvt. Ltd.</strong></p>
              <p><strong>Address:</strong> Sikta Bazar, West Champaran, Bihar – 845307, India</p>
              <p><strong>Email:</strong> vishaltelecomskt@gmail.com</p>
              <p><strong>Phone:</strong> +91 8210302931</p>
            </div>
            <p className="pt-2 text-xs text-slate-500">If you have any questions regarding these Terms, please contact us using the details above.</p>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}

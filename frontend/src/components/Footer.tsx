'use client';

import React from 'react';
import { Mail, Phone, MapPin, ShieldCheck, Truck, RotateCcw, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <>
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        
        {/* Badges / Value Prop */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="p-3 bg-slate-800 text-indigo-400 rounded-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Priority Sourcing Slabs</h4>
                <p className="text-xs text-slate-400 mt-0.5">Bulk ordering rates and discount slabs on all items.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="p-3 bg-slate-800 text-indigo-400 rounded-xl">
                <Truck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Priority Bulk Logistics</h4>
                <p className="text-xs text-slate-400 mt-0.5">Prompt delivery across select industrial and retail zip codes.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="p-3 bg-slate-800 text-indigo-400 rounded-xl">
                <RotateCcw size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Easy Returns & Refund</h4>
                <p className="text-xs text-slate-400 mt-0.5">Refund directly to your B2B wallet upon audit verification.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-4">
              <span className="text-lg font-extrabold text-white tracking-wider uppercase">
                Vishal <span className="text-indigo-400">Store</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Premium B2B market connecting local grocers, supermarkets, and electronics retailers directly with top manufacturing brands.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/vishaltelecomskt"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-blue-600 transition"
                  title="Facebook"
                >
                  <Facebook size={14} />
                </a>
                <a
                  href="https://x.com/vishaltelecom12"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition"
                  title="X (Twitter)"
                >
                  <Twitter size={14} />
                </a>
                <a
                  href="https://www.instagram.com/vishaltelecomskt"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-pink-600 transition"
                  title="Instagram"
                >
                  <Instagram size={14} />
                </a>
                <a
                  href="https://wa.me/918210302931?text=Hello"
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-emerald-600 transition"
                  title="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.336 0 9.69-4.32 9.693-9.627.002-2.57-1.002-4.986-2.83-6.814C16.368 2.336 13.972 1.332 11.99 1.332c-5.343 0-9.69 4.323-9.693 9.63-.001 2.01.528 3.97 1.529 5.679L2.83 21.284l4.98-.846z" />
                    <path d="M17.472 14.382c-.3-.149-1.778-.878-2.046-.975-.267-.099-.463-.149-.66.15-.196.297-.762.962-.934 1.16-.172.196-.343.22-.642.072-.3-.15-1.272-.469-2.423-1.496-.895-.798-1.5-1.784-1.676-2.083-.177-.3-.019-.462.13-.61.135-.133.3-.349.45-.523.15-.174.2-.297.3-.496.1-.2.05-.375-.025-.523-.075-.15-.66-1.586-.905-2.179-.24-.576-.48-.497-.66-.506-.17-.008-.363-.01-.555-.01h-.001c-.19 0-.5.07-.76.357-.26.287-1 .977-1 2.383s1.025 2.766 1.17 2.961c.145.195 2.015 3.078 4.88 4.316.68.295 1.21.47 1.62.6.68.216 1.3.186 1.79.112.55-.083 1.78-.727 2.03-1.43.25-.702.25-1.3.17-1.43-.08-.13-.3-.21-.6-.358z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-4">Product Verticals</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><a href="/catalog?category=grocery" className="hover:text-white transition">Grocery Staples & Rice</a></li>
                <li><a href="/catalog?category=cosmetic" className="hover:text-white transition">Beauty & Cosmetics</a></li>
                <li><a href="/catalog?category=electronics" className="hover:text-white transition">Shop Electric & Devices</a></li>
                <li><a href="/catalog" className="hover:text-white transition">Explore Sourcing Catalog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-4">Helpful Policies</h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li><a href="/terms" className="hover:text-white transition">B2B Terms of Service</a></li>
                <li><a href="/anti-pricing-manipulation" className="hover:text-white transition">Anti-Pricing Manipulation</a></li>
                <li><a href="#" className="hover:text-white transition">KYC Validation Guidelines</a></li>
                <li><a href="/payment-faq" className="hover:text-white transition">Payment & Wallet FAQs</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">Corporate Office</h4>
              <div className="flex items-start gap-2.5 text-xs text-slate-400 leading-normal text-left">
                <MapPin size={16} className="text-[#2874f0] mt-0.5 flex-shrink-0" />
                <span>Sikta Bazar, West Champaran, Bihar – 845307, India</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <Phone size={16} className="text-[#2874f0] flex-shrink-0" />
                <span>+91 8210302931</span>
              </div>
              <div className="pt-2 text-left">
                <a
                  href="https://wa.me/918210302931?text=Hello"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-md shadow-emerald-600/10"
                >
                  Chat on WhatsApp
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <Mail size={16} className="text-[#2874f0] flex-shrink-0" />
                <a href="mailto:vishalstoresikta@gmail.com" className="hover:underline hover:text-white transition">vishalstoresikta@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Copy / Bottom bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Rahul Super Mart. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="/terms" className="hover:underline">B2B Terms of Service</a>
            <a href="/anti-pricing-manipulation" className="hover:underline">Anti-Pricing Manipulation Policy</a>
          </div>
        </div>

      </footer>

      {/* Mobile bottom nav spacer */}
      <div className="h-16 block md:hidden" />
    </>
  );
}

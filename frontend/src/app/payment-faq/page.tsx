'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { HelpCircle, ChevronDown, Search, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export default function PaymentFaq() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: "Which payment methods do you accept?",
      answer: "We accept UPI, PhonePe, Razorpay (Cards, Net Banking, Wallets), and Cash on Delivery (COD) where available."
    },
    {
      id: 2,
      question: "Is Cash on Delivery (COD) available?",
      answer: "Yes, COD is available for eligible orders."
    },
    {
      id: 3,
      question: "Is online payment secure?",
      answer: "Yes. All online payments are processed through secure and trusted payment gateways."
    },
    {
      id: 4,
      question: "When will my payment be confirmed?",
      answer: "Online payments are usually confirmed instantly. If there's a delay, please wait a few minutes or contact support."
    },
    {
      id: 5,
      question: "What should I do if my payment fails?",
      answer: "If your payment fails but the amount is deducted, it is usually refunded automatically by your bank within 5–7 business days. Contact us if you need assistance."
    },
    {
      id: 6,
      question: "Do you provide invoices?",
      answer: "Yes. A GST invoice (if applicable) or purchase invoice is provided with every successful order."
    },
    {
      id: 7,
      question: "Can I get a refund?",
      answer: "Refunds are processed according to our Refund Policy after the returned item is verified and approved."
    },
    {
      id: 8,
      question: "Can I pay using multiple payment methods?",
      answer: "Currently, only one payment method can be used per order."
    },
    {
      id: 9,
      question: "Is there any extra charge for online payments?",
      answer: "No. We do not charge any additional fee for standard online payment methods."
    },
    {
      id: 10,
      question: "How can I contact support for payment issues?",
      answer: "You can reach our support team through the Contact Us page or call the customer support number listed on our website (+91 8210302931 / vishalstoresikta@gmail.com)."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#2874f0] transition">
            <ArrowLeft size={14} /> Back to Sourcing
          </Link>
        </div>

        {/* Page Title Header */}
        <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
          <div className="inline-flex p-3 bg-indigo-50 text-indigo-650 rounded-2xl border border-indigo-100">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment & Wallet FAQs</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Find answers to commonly asked questions about bulk order payments, online gateways, and ledger balance management.
          </p>
        </div>

        {/* FAQ Search Bar */}
        <div className="relative max-w-md mx-auto mb-10">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search FAQs (e.g. COD, refund, invoice)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-950 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25 shadow-sm transition"
          />
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div 
                  key={faq.id} 
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <button
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full px-6 py-4.5 text-left flex justify-between items-center gap-4 focus:outline-none"
                  >
                    <span className="font-extrabold text-sm text-slate-800 tracking-tight leading-snug">
                      {faq.question}
                    </span>
                    <span className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-650' : ''}`}>
                      <ChevronDown size={18} />
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50">
                      <p className="text-xs text-slate-650 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-2xl block">🔍</span>
              <h3 className="font-bold text-slate-850 text-sm">No Match Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                We couldn't find any FAQ matching "{searchQuery}". Try typing another keyword.
              </p>
            </div>
          )}
        </div>

        {/* Help Banner Box */}
        <div className="mt-12 bg-indigo-950 text-white rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-indigo-900">
          <div className="flex items-center gap-4 text-left">
            <div className="p-3.5 bg-white/10 text-indigo-300 rounded-2xl flex-shrink-0">
              <MessageSquare size={24} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm tracking-tight">Still have queries about payment or wallet?</h4>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 max-w-md leading-normal">
                Our support team is available 24/7. Reach out via email, call, or click the WhatsApp support button below.
              </p>
            </div>
          </div>
          <a
            href="https://wa.me/918210302931?text=Hello%2C%20I%20have%20payment%20queries."
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg transition tracking-wide whitespace-nowrap"
          >
            Chat with Support
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * Landing Page with Analytics Tracking
 * Tracks landing page visits and Start Trial clicks
 */

'use client'

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  ClipboardCheck, 
  Zap, 
  ArrowRight, 
  Clock, 
  Shield, 
  CheckCircle2, 
  Users, 
  TrendingUp, 
  Sparkles,
  Eye,
  BarChart3,
  Lock,
  Globe,
  Smartphone
} from 'lucide-react'
import { Analytics } from '@/lib/analytics';

export function LandingHero() {
  useEffect(() => {
    // Track landing page visit
    Analytics.landingPageVisit();
  }, []);

  const handleStartTrialClick = () => {
    Analytics.startTrialClicked();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="container mx-auto px-4 py-16 sm:py-24 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg mb-8">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">Trusted by Legal Professionals</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Transform Your Legal Practice with AI-Powered Automation
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Save <span className="font-bold text-yellow-300">10+ hours per week</span> on document preparation. 
            Perfect for paralegals, law firms, and legal departments.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mb-10">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-yellow-300">90%</div>
              <div className="text-sm sm:text-base text-blue-200">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-yellow-300">99.9%</div>
              <div className="text-sm sm:text-base text-blue-200">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-yellow-300">24/7</div>
              <div className="text-sm sm:text-base text-blue-200">Available</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              onClick={handleStartTrialClick}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-yellow-400 text-blue-900 font-bold rounded-xl shadow-xl hover:bg-yellow-300 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 text-lg"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-200 text-lg"
            >
              Watch Demo
            </Link>
          </div>
          
          <p className="text-sm text-blue-200 mt-6">
            Only <span className="font-bold text-white">$200/month</span> • No setup fees • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}

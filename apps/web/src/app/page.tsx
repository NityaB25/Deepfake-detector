"use client";
import Link from "next/link";
import { Upload, Search, History, Shield, Zap, Target } from "lucide-react";

export default function HomePage() {
  const actions = [
    {
      title: "Upload & Scan",
      description: "Send a file to Cloudinary and run a scan.",
      icon: Upload,
      href: "/upload",
      gradient: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/20",
    },
    {
      title: "Quick Scan",
      description: "Scan a public URL (image or short video).",
      icon: Search,
      href: "/scan",
      gradient: "from-purple-500 to-pink-500",
      shadow: "shadow-purple-500/20",
    },

    {
      title: "How It Works",
      description: "Understand how scores are calculated and what they mean.",
      icon: Shield,
       href: "/how-it-works",
      gradient: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/20",
},
    {
      title: "History",
      description: "See your recent scans.",
      icon: History,
      href: "/history",
      gradient: "from-orange-500 to-red-500",
      shadow: "shadow-orange-500/20",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Advanced Detection",
      description: "State-of-the-art ML models to identify deepfakes",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get results in seconds with our optimized pipeline",
    },
    {
      icon: Target,
      title: "High Accuracy",
      description: "Proven accuracy with comprehensive analysis",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-600/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          {/* Welcome Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Welcome
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto">
              Choose an action below to get started with AI-powered deepfake detection
            </p>
          </div>

          {/* Action Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">

            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                  <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                    <div className={`w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {action.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {action.description}
                    </p>
                    <div className="mt-6 flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                      <span className="text-sm font-medium">Get Started</span>
                      <svg
                        className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Features Section */}
          <div className="border-t border-gray-800 pt-16">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              Why Choose Our Detector?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center p-6 rounded-xl bg-gray-800/30 backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-all duration-300"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import Link from "next/link";
import { Github, Linkedin, Twitter, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="pt-24 min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-300">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          About This Project
        </h1>

        {/* Description */}
        <div className="space-y-6 text-lg leading-relaxed">
          <p>
            This project is an AI-powered deepfake detection platform designed
            to help users identify manipulated images and videos with clarity
            and transparency.
          </p>

          <p>
            It combines machine learning models with external verification APIs
            to provide confidence scores, enabling users to better understand
            the authenticity of digital media.
          </p>

          <p>
            The goal is not just detection, but also education — helping users
            understand how AI arrives at its conclusions and what those results
            truly mean.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-12" />

        {/* Author */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Created by Nitya Bhavsar
          </h2>

          <p className="text-gray-400 mb-6">
            Full-stack developer • AI enthusiast • Builder
          </p>

          {/* Social Links */}
          <div className="flex justify-center gap-6">
            <Link
              href="https://github.com/NityaB25"
              target="_blank"
              className="hover:text-white transition"
            >
              <Github size={28} />
            </Link>

            <Link
              href="https://www.linkedin.com/in/nitya-bhavsar-a927382ab/"
              target="_blank"
              className="hover:text-white transition"
            >
              <Linkedin size={28} />
            </Link>

          

           
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6">
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-white mb-4">
      {children}
    </h3>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}


// Score Gauge Component
interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreGauge({ score, label, size = "md" }: ScoreGaugeProps) {
  const getColor = (score: number) => {
    if (score >= 90) return "from-red-500 to-pink-500";
    if (score >= 70) return "from-orange-500 to-yellow-500";
    if (score >= 50) return "from-yellow-500 to-green-500";
    return "from-green-500 to-emerald-500";
  };

  const sizes = {
    sm: { container: "w-24 h-24", text: "text-2xl", label: "text-xs" },
    md: { container: "w-32 h-32", text: "text-3xl", label: "text-sm" },
    lg: { container: "w-40 h-40", text: "text-4xl", label: "text-base" },
  };

  const sizeClasses = sizes[size];

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg className={`${sizeClasses.container} transform -rotate-90`}>
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-800"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
            strokeDashoffset={2 * Math.PI * 45 * (1 - score / 100)}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={`${getColor(score).split(' ')[0].replace('from-', '')}`} />
              <stop offset="100%" className={`${getColor(score).split(' ')[1].replace('to-', '')}`} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${sizeClasses.text} font-bold text-white`}>{score}%</span>
        </div>
      </div>
      <span className={`${sizeClasses.label} text-gray-400 mt-2 font-medium`}>{label}</span>
    </div>
  );
}

// Verdict Badge Component
interface VerdictBadgeProps {
  verdict: "Real" | "Fake" | "Inconclusive";
  size?: "sm" | "md" | "lg";
}

export function VerdictBadge({ verdict, size = "md" }: VerdictBadgeProps) {
  const getStyles = (verdict: string) => {
    switch (verdict) {
      case "Real":
        return {
          bg: "bg-gradient-to-r from-green-500 to-emerald-500",
          border: "border-green-500/30",
          glow: "shadow-lg shadow-green-500/50",
        };
      case "Fake":
        return {
          bg: "bg-gradient-to-r from-red-500 to-pink-500",
          border: "border-red-500/30",
          glow: "shadow-lg shadow-red-500/50",
        };
      case "Inconclusive":
        return {
          bg: "bg-gradient-to-r from-yellow-500 to-orange-500",
          border: "border-yellow-500/30",
          glow: "shadow-lg shadow-yellow-500/50",
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-500 to-gray-600",
          border: "border-gray-500/30",
          glow: "shadow-lg shadow-gray-500/50",
        };
    }
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const styles = getStyles(verdict);

  return (
    <div
      className={`inline-flex items-center ${sizes[size]} ${styles.bg} ${styles.glow} border ${styles.border} rounded-full font-bold text-white backdrop-blur-sm`}
    >
      {verdict}
    </div>
  );
}

// Info Card Component
interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  gradient?: string;
}

export function InfoCard({
  icon: Icon,
  title,
  value,
  subtitle,
  gradient = "from-blue-500 to-purple-500",
}: InfoCardProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-gray-700 hover:scale-105 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

// Analysis Result Card
interface AnalysisResultProps {
  title: string;
  ourScore: number;
  apiScore: number;
  verdict: "Real" | "Fake" | "Inconclusive";
  children?: ReactNode;
}

export function AnalysisResult({
  title,
  ourScore,
  apiScore,
  verdict,
  children,
}: AnalysisResultProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-2xl border border-gray-800 rounded-3xl p-8 shadow-2xl">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">{title}</h2>

      {/* Verdict Badge */}
      <div className="flex justify-center mb-8">
        <VerdictBadge verdict={verdict} size="lg" />
      </div>

      {/* Score Gauges */}
      <div className="flex justify-center items-center gap-12 mb-8">
        {ourScore == null ? (
  <span>Model unavailable</span>
) : (
   <ScoreGauge score={ourScore} label="Our Model" size="lg" />
)}

       
        <ScoreGauge score={apiScore} label="API Model" size="lg" />
      </div>

      {/* Additional Content */}
      {children && (
        <div className="mt-8 pt-8 border-t border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}

// Loading Card
export function LoadingCard({ message = "Processing..." }: { message?: string }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-12 text-center">
      <div className="inline-block w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 text-lg">{message}</p>
    </div>
  );
}

// Empty State Card
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Icon className="w-10 h-10 text-gray-500" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
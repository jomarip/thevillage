"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

/**
 * Success animation component with confetti-like effect
 * Use for major actions like transaction confirmations, approvals, etc.
 */
export function SuccessAnimation({
  show,
  message = "Success!",
  onComplete,
  duration = 2000,
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      // Generate random particles for confetti effect
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 300,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in" />
      
      {/* Success Card */}
      <div className="relative z-10 bg-surface rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4 animate-slide-up border-2 border-success/50">
        {/* Confetti Particles */}
        <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                animation: `confetti-fall 1s ease-out ${particle.delay}ms forwards`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        {/* Success Icon */}
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
            <div className="relative w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-success animate-scale-in" />
            </div>
          </div>
          
          {/* Sparkles */}
          <Sparkles className="absolute top-0 right-0 h-6 w-6 text-primary animate-spin-slow" />
          <Sparkles className="absolute bottom-0 left-0 h-6 w-6 text-secondary animate-spin-slow" style={{ animationDirection: "reverse" }} />

          {/* Message */}
          <h3 className="text-xl font-semibold text-text mb-2">{message}</h3>
          <p className="text-sm text-text-muted">Your action was successful!</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(360deg);
          }
        }
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook to trigger success animation
 */
export function useSuccessAnimation() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("Success!");

  const trigger = (msg?: string) => {
    setMessage(msg || "Success!");
    setShow(true);
  };

  return {
    show,
    message,
    trigger,
    Animation: (
      <SuccessAnimation
        show={show}
        message={message}
        onComplete={() => setShow(false)}
      />
    ),
  };
}

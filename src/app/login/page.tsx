"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, Camera, Film, Scissors, Sliders, Sparkles, Key } from "lucide-react";

export default function LoginPage() {
  const [loginId, setLoginId] = useState(""); // Email or Mobile number
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  // Cycling taglines loop for creative context
  const taglines = [
    "Where stories come to life.",
    "Fueled by caffeine and keyframes.",
    "Rendering instant impact.",
    "Capturing the narrative.",
    "Ready to edit your next masterpiece?",
  ];
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIdx((prev) => (prev + 1) % taglines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setSuccessMessage(data.message || "Passcode sent successfully to WhatsApp!");
      setStep("verify");
    } catch (err: any) {
      setError(err.message || "Failed to generate OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, otp }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Verification failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid OTP passcode. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Background floating objects
  const floatingIcons = [
    { icon: Camera, top: "12%", left: "8%", delay: "0s", size: 24, opacity: 0.15 },
    { icon: Film, top: "20%", right: "12%", delay: "-3s", size: 28, opacity: 0.12 },
    { icon: Scissors, bottom: "16%", left: "14%", delay: "-6s", size: 22, opacity: 0.15 },
    { icon: Sliders, bottom: "28%", right: "10%", delay: "-9s", size: 26, opacity: 0.1 },
    { icon: Sparkles, top: "45%", left: "18%", delay: "-2.5s", size: 20, opacity: 0.18 },
    { icon: Sparkles, bottom: "48%", right: "22%", delay: "-11.5s", size: 18, opacity: 0.15 },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden">
      
      {/* Background Animated Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute left-1/4 top-1/4 w-[350px] h-[350px] rounded-full bg-brand-orange/5 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 w-[350px] h-[350px] rounded-full bg-brand-orange/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      {/* Floating Creative Tool Icons */}
      {floatingIcons.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="absolute text-brand-orange anim-float pointer-events-none hidden md:block"
            style={{
              top: item.top,
              left: item.left,
              right: item.right,
              bottom: item.bottom,
              animationDelay: item.delay,
              opacity: item.opacity,
            }}
          >
            <Icon size={item.size} className="filter drop-shadow-[0_0_10px_rgba(255,122,0,0.35)]" />
          </div>
        );
      })}

      {/* Interactive Card container */}
      <div 
        className="w-full max-w-md z-10 glass-panel border border-neutral-900 rounded-[2.3rem] p-8 sm:p-10 shadow-2xl backdrop-blur-xl group hover:border-brand-orange/20 transition-all duration-300 hover:scale-[1.01]"
      >
        <div>
          
          {/* Header */}
          <div className="text-center mb-8 flex flex-col items-center">
            <img 
              src="/logo.png" 
              alt="LITWORKS Logo" 
              className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(255,122,0,0.55)] group-hover:scale-105 transition-all duration-300"
            />
            
            {/* Dynamic taglines reveal */}
            <div className="h-6 overflow-hidden mt-3 relative">
              <span className="text-[10px] text-neutral-400 tracking-widest font-mono uppercase block animate-pulse">
                {taglines[taglineIdx]}
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 mb-5 rounded-xl bg-red-950/20 border border-red-900/50 text-red-500 text-xs text-center font-mono font-medium leading-relaxed">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 mb-5 rounded-xl bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 text-xs text-center font-mono font-medium leading-relaxed">
              {successMessage}
            </div>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === "request" && (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">
                  Creator Email or Phone
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-555 group-hover:text-brand-orange transition-colors" />
                  <input
                    type="text"
                    placeholder="e.g. roshan@litworks.media or 91XXXXXXXXXX"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black border border-neutral-850 focus:outline-none focus:border-brand-orange text-xs text-white transition-colors"
                  />
                </div>
                <p className="text-[9px] text-neutral-500 font-mono mt-2 uppercase tracking-wide leading-relaxed">
                  Enter your email or phone number. We will send a secure OTP key directly to your WhatsApp.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Requesting OTP...</span>
                  </>
                ) : (
                  <span>Send WhatsApp OTP</span>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-neutral-400 font-bold mb-2">
                  Enter Secure Access Code
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-555 group-hover:text-brand-orange transition-colors" />
                  <input
                    type="text"
                    placeholder="6-digit code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black border border-neutral-850 focus:outline-none focus:border-brand-orange text-xs text-white transition-colors font-mono tracking-widest"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-brand-orange hover:bg-white text-black font-extrabold text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Session...</span>
                    </>
                  ) : (
                    <span>Confirm OTP & Login</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMessage("");
                    setOtp("");
                    setStep("request");
                  }}
                  className="w-full py-3 rounded-xl bg-transparent border border-neutral-850 hover:border-neutral-700 text-neutral-400 hover:text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center cursor-pointer"
                >
                  Request a new code / Go Back
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Determine current step from pathname
  const currentStep = pathname === "/onboarding" ? 1 : 
                     pathname === "/onboarding/step2" ? 2 : 
                     pathname === "/onboarding/step3" ? 3 : 1;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-10">Get Your Account Set Up</h1>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
          {children}
        </div>

        {/* Step indicator */}
        <div className="flex justify-center mt-8 space-x-4 text-sm text-gray-400">
          <span className={currentStep >= 1 ? "opacity-100" : "opacity-50"}>Step 1</span>
          <span>•</span>
          <span className={currentStep >= 2 ? "opacity-100" : "opacity-50"}>Step 2</span>
          <span>•</span>
          <span className={currentStep >= 3 ? "opacity-100" : "opacity-50"}>Step 3</span>
        </div>
      </div>
    </div>
  );
}


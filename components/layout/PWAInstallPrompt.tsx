"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone (PWA) mode
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);

    if (isStandalone) {
      return;
    }

    // 2. Detect platform
    const ua = navigator.userAgent;
    const isAndroidDevice = /Android/i.test(ua);
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua) && !("MSStream" in window);
    
    setIsAndroid(isAndroidDevice);
    setIsIOS(isIOSDevice);

    // 3. Check if user dismissed the prompt recently
    const dismissedAt = localStorage.getItem("ilueats-pwa-prompt-dismissed");
    if (dismissedAt) {
      const parsedDate = new Date(dismissedAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - parsedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If dismissed less than 7 days ago, don't show the prompt
      if (diffDays <= 7) {
        return;
      }
    }

    // 4. Listen for beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Wait a little time (15 seconds) before suggesting installation for Android
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 15000);

      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. iOS Suggestion after a delay (since iOS doesn't fire beforeinstallprompt)
    let iosTimer: NodeJS.Timeout;
    if (isIOSDevice) {
      iosTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 15000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    // Trigger the native install prompt
    await deferredPrompt.prompt();

    // Wait for the user response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User choice outcome: ${outcome}`);

    // Clean up
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("ilueats-pwa-prompt-dismissed", new Date().toISOString());
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <div className="fixed inset-x-0 bottom-24 z-[100] mx-auto flex max-w-md flex-col px-4 lg:bottom-6">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white/90 p-5 shadow-lift backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90"
          >
            {!showIOSInstructions ? (
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-[var(--color-primary)]/10">
                    🍔
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-[15.5px] font-bold tracking-tight text-[var(--color-ink)] dark:text-zinc-50">
                      Install IluEats App
                    </h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-ink-muted)] dark:text-zinc-400">
                      Add to your home screen for faster ordering, offline access, and a native experience.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 rounded-xl border border-[var(--color-line)] py-2 text-center text-[13px] font-medium text-[var(--color-ink-muted)] hover:bg-[var(--color-bg)] active:scale-[0.98] transition-all dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Not now
                  </button>
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 rounded-xl bg-[var(--color-primary)] py-2 text-center text-[13px] font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
                  >
                    Install App
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-[var(--color-primary)]/10">
                    📲
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-[15.5px] font-bold tracking-tight text-[var(--color-ink)] dark:text-zinc-50">
                      How to Install on iOS
                    </h3>
                    <div className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-ink-muted)] dark:text-zinc-400 space-y-2">
                      <p className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[10px] font-bold text-[var(--color-primary)]">
                          1
                        </span>
                        Tap the share button{" "}
                        <span className="inline-flex items-center justify-center px-1 py-0.5 rounded bg-zinc-100 text-[13px] dark:bg-zinc-800">
                          ⎋
                        </span>{" "}
                        at the bottom of Safari.
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[10px] font-bold text-[var(--color-primary)]">
                          2
                        </span>
                        Scroll down and tap <b>&quot;Add to Home Screen&quot;</b>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleDismiss}
                    className="w-full rounded-xl bg-[var(--color-primary)] py-2 text-center text-[13px] font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

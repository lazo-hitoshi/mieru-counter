"use client";

import { useState } from "react";

export type HelpStep = {
  icon: string;
  title: string;
  description: string;
};

export function HelpGuide({
  steps,
  buttonPosition = "bottom-right",
  buttonColor = "blue",
}: {
  steps: HelpStep[];
  buttonPosition?: "bottom-right" | "header";
  buttonColor?: "blue" | "emerald" | "slate";
}) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const colorMap = {
    blue: {
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      accent: "bg-blue-600",
      accentLight: "bg-blue-100 text-blue-700",
      ring: "ring-blue-200",
    },
    emerald: {
      button: "bg-emerald-600 hover:bg-emerald-700 text-white",
      accent: "bg-emerald-600",
      accentLight: "bg-emerald-100 text-emerald-700",
      ring: "ring-emerald-200",
    },
    slate: {
      button: "bg-slate-700 hover:bg-slate-800 text-white",
      accent: "bg-slate-700",
      accentLight: "bg-slate-100 text-slate-700",
      ring: "ring-slate-200",
    },
  };

  const colors = colorMap[buttonColor];
  const step = steps[currentStep];

  function close() {
    setOpen(false);
    setCurrentStep(0);
  }

  if (buttonPosition === "header") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={`text-sm px-3 py-1.5 rounded-lg transition-colors border border-slate-200 text-slate-600 hover:bg-slate-50`}
        >
          ❓ 使い方
        </button>
        {open && (
          <HelpModal
            steps={steps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            colors={colors}
            onClose={close}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`fixed top-3 right-3 z-40 w-10 h-10 rounded-full shadow-lg ${colors.button} flex items-center justify-center text-lg active:scale-95 transition-transform opacity-70 hover:opacity-100`}
        aria-label="使い方ガイド"
      >
        ？
      </button>
      {open && (
        <HelpModal
          steps={steps}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          colors={colors}
          onClose={close}
        />
      )}
    </>
  );
}

function HelpModal({
  steps,
  currentStep,
  setCurrentStep,
  colors,
  onClose,
}: {
  steps: HelpStep[];
  currentStep: number;
  setCurrentStep: (n: number) => void;
  colors: { accent: string; accentLight: string; ring: string; button: string };
  onClose: () => void;
}) {
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className={`${colors.accent} px-6 py-4 flex items-center justify-between`}>
          <h3 className="text-white font-bold text-lg">📖 使い方ガイド</h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? `${colors.accent} w-8`
                  : i < currentStep
                    ? `${colors.accent} opacity-40 w-4`
                    : "bg-slate-200 w-4"
              }`}
            />
          ))}
          <span className="ml-auto text-xs text-slate-400">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-center">
            <div className="text-5xl mb-4">{step.icon}</div>
            <h4 className="text-xl font-bold text-slate-800 mb-3">
              {step.title}
            </h4>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {step.description}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={isFirst}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-0 transition-all"
          >
            ← 前へ
          </button>

          {isLast ? (
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium ${colors.button} shadow-sm`}
            >
              はじめる ✓
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium ${colors.button} shadow-sm`}
            >
              次へ →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

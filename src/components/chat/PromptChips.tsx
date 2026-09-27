"use client";

import { useState } from "react";
import { Sparkles, Flame, ShieldAlert, ChefHat, Brain } from "lucide-react";

interface PromptChipsProps {
  onSelectPrompt: (text: string) => void;
  disabled?: boolean;
}

interface PromptCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  prompts: string[];
}

const CATEGORIES: PromptCategory[] = [
  {
    id: "protein",
    name: "Protein & Macros",
    icon: Flame,
    prompts: [
      "How many grams of protein does a 70kg sedentary vegetarian adult need?",
      "What are the highest protein plant-based food combinations?",
      "What is the biological difference between whey and plant protein absorption?"
    ]
  },
  {
    id: "safety",
    name: "Food Safety",
    icon: ShieldAlert,
    prompts: [
      "How long can cooked rice be safely stored in the refrigerator?",
      "Can you safely eat chicken thawed on the counter if cooked to 165°F?",
      "What is the maximum safe refrigerator time for opened smoked salmon?"
    ]
  },
  {
    id: "cooking",
    name: "Cooking Methods",
    icon: ChefHat,
    prompts: [
      "Does boiling broccoli destroy more glucosinolates than steaming?",
      "Does heating extra virgin olive oil create toxic polar compounds?",
      "How does air frying affect nutrient retention compared to deep frying?"
    ]
  },
  {
    id: "science",
    name: "Metabolism & Fasting",
    icon: Brain,
    prompts: [
      "What happens biochemically during extended fasting and ketosis?",
      "Are industrial seed oils high in linoleic acid a driver of inflammation?",
      "Is time-restricted feeding superior to caloric restriction for visceral fat?"
    ]
  }
];

export function PromptChips({ onSelectPrompt, disabled }: PromptChipsProps) {
  const [activeCategory, setActiveCategory] = useState<string>("protein");

  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div className="w-full space-y-2 py-2">
      {/* Category selector pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 font-medium px-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          Topics:
        </span>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0 font-medium ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Prompts for active category */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {currentCategory.prompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-left whitespace-nowrap transition-all shadow-xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useTheme, Theme } from "../context/ThemeContext";
import { Sun, Moon, Monitor, Check } from "lucide-react";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Quick icon based on resolvedTheme or theme
  const getActiveIcon = () => {
    if (theme === "system") {
      return <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (resolvedTheme === "dark") {
      return <Moon className="w-4 h-4 text-amber-400" />;
    }
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  const options: Array<{ id: Theme; label: string; icon: React.ReactNode }> = [
    {
      id: "light",
      label: "Light",
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />
    },
    {
      id: "dark",
      label: "Dark",
      icon: <Moon className="w-3.5 h-3.5 text-blue-400" />
    },
    {
      id: "system",
      label: "System",
      icon: <Monitor className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5"
        title={`Current theme: ${theme} (${resolvedTheme})`}
        aria-label="Toggle theme menu"
        aria-expanded={isOpen}
      >
        {getActiveIcon()}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Theme
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left ${
                  isSelected
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

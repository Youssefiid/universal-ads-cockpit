import React from "react";

export function PlatformIcon({
  platform,
  className = "w-5 h-5",
}: {
  platform: string;
  className?: string;
}) {
  const p = platform.toLowerCase();

  if (p.includes("meta") || p.includes("facebook") || p.includes("instagram")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.8V15H7.5V12H10V9.5C10 7.02 11.54 5.65 13.8 5.65C14.88 5.65 15.82 5.73 16.1 5.77V8.43H14.52C13.32 8.43 13 9.03 13 9.87V12H16L15.5 15H13V21.95C17.8 21.17 21.5 17.02 21.5 12C21.5 6.48 17.52 2 12 2Z"
          fill="#0081FB"
        />
      </svg>
    );
  }

  if (p.includes("google")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          fill="#EA4335"
        />
      </svg>
    );
  }

  if (p.includes("tiktok")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.35 0 .69.06 1 .17V9.45a6.34 6.34 0 0 0-1-.08 6.34 6.34 0 0 0-6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 0 0 0 6.34-6.34V8.41a8.31 8.31 0 0 0 4.76 1.48V6.44c-.69 0-1.37-.15-2.05-.44l.001.69z"
          fill="#EE1D52"
        />
      </svg>
    );
  }

  if (p.includes("linkedin")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"
          fill="#0A66C2"
        />
      </svg>
    );
  }

  if (p.includes("looker")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="6" r="3" fill="#4285F4" />
        <circle cx="18" cy="6" r="3" fill="#EA4335" />
        <circle cx="6" cy="18" r="3" fill="#34A853" />
        <circle cx="18" cy="18" r="3" fill="#FBBC05" />
        <path d="M6 9v6M9 6h6M18 9v6M9 18h6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <div className={`rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs ${className}`}>
      {platform.slice(0, 2).toUpperCase()}
    </div>
  );
}

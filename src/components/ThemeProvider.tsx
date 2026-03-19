"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import '@/i18n/config'; // Import i18n config here to ensure it's initialized on client side

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}


import { ThemeProvider } from "@/components/theme-provider"

import {Inter} from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex/ConvexClientProvider";  

const inter = Inter({subset: ['latin']})

export const metadata = {
  title: "AI Content Platform",
  description: "Content Creation powered by AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en"  suppressHydrationWarning>
      <body
        className={`${inter.className}`}
      >
         <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          > 
          <ConvexClientProvider>
          {/* Header */ }
          <main className="bg-slate-900 min-h-screen text-white overflow-x-hidden">
        {children}
        </main>
         </ConvexClientProvider>
        </ThemeProvider>
       
      </body>
    </html>
  );
}

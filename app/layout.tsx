import "./globals.css";
import { AppProvider } from "./providers";
import TopNav from "./topnav";

export const metadata = {
  title: "AI Student Platform",
  description: "Student access platform",
};

// مهم عشان مايحصلش caching غريب مع auth
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppProvider>
          <TopNav />
          <div className="container">{children}</div>
        </AppProvider>
      </body>
    </html>
  );
}

import "./globals.css";
import { AppProvider } from "./providers";
import TopNav from "./topnav";

export const metadata = {
  title: "AI Student Platform",
  description: "Student access platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AppProvider>
          <TopNav />
          <div className="container">{children}</div>
        </AppProvider>
      </body>
    </html>
  );
}

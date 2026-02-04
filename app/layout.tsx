import "./globals.css";

export const metadata = {
  title: "AI Student Platform",
  description: "Student access platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="nav">
          <div className="navinner">
            <div className="logo">AI Student Platform 🚀</div>
            <div className="navlinks">
              <a className="badge" href="/">Home</a>
              <a className="badge" href="/chat">Chat</a>
              <a className="badge" href="/redeem">Redeem</a>
              <a className="badge" href="/login">Login</a>
              <a className="badge" href="/register">Register</a>
              <a className="badge" href="/admin">Admin</a>
            </div>
          </div>
        </div>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}

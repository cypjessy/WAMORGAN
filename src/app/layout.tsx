import type { Metadata } from "next";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "WAMORGAN",
  description: "AI-Powered WhatsApp Sales Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

import "./globals.css";

export const metadata = {
  title: "Session-Based RAG Application",
  description: "RAG App using Next.js + TypeScript"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  );
}
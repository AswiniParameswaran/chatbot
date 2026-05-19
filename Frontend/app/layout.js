import "./globals.css";

export const metadata = {
  title: "KFC Drive-Thru",
  description: "Voice ordering frontend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

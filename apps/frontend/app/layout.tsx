import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "AI Job Tracker",
  description: "Track your job applications smarter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,

            style: {
              background: "#020B3D",
              color: "#fff",
              border: "1px solid #334155",
            },

            success: {
              style: {
                background: "#16a34a",
              },
            },

            error: {
              style: {
                background: "#dc2626",
              },
            },
          }}
        />
      </body>
    </html>
  );
}

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './globals.css';

export const metadata = {
  title: 'DocuThinker - Document Analysis',
};

export default function RootLayout({ children }) {
  return (
      <html lang="en">
      <body>
      <Navbar />
      <main>{children}</main>
      <Footer />
      </body>
      </html>
  );
}

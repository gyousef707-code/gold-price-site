import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';

import GoldPage from './pages/GoldPage.jsx';
import CurrenciesPage from './pages/CurrenciesPage.jsx';
import SilverPage from './pages/SilverPage.jsx';
import CryptoPage from './pages/CryptoPage.jsx';
import ToolsPage from './pages/ToolsPage.jsx';
import GoldKaratPage from './pages/GoldKaratPage.jsx';
import CryptoCoinPage from './pages/CryptoCoinPage.jsx';
import BlogListPage from './pages/BlogListPage.jsx';
import BlogPostPage from './pages/BlogPostPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import DisclaimerPage from './pages/DisclaimerPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<GoldPage />} />
        <Route path="/currencies" element={<CurrenciesPage />} />
        <Route path="/silver" element={<SilverPage />} />
        <Route path="/crypto" element={<CryptoPage />} />
        <Route path="/tools" element={<ToolsPage />} />

        <Route path="/gold/:karat" element={<GoldKaratPage />} />
        <Route path="/crypto/:coin" element={<CryptoCoinPage />} />

        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

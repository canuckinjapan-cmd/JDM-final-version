import { Mail, Settings, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, checkIsAdmin } from "@/lib/firebase";
import { useCurrency, CurrencyCode } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

const CURRENCIES: CurrencyCode[] = ['GBP', 'AUD', 'JPY', 'USD'];

const SiteNav = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const status = await checkIsAdmin(user);
        setIsAdmin(status);
      } else {
        setIsAdmin(false);
      }
    });
    return unsubscribe;
  }, []);

  // Sync mobile menu open state with route and anchor transitions to prevent trapped overlays
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <Link 
          to="/" 
          onClick={() => {
            if (location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="group relative flex items-center gap-2 shrink-0 py-1"
        >
          <div className="w-8 h-8 rounded-sm gradient-bronze flex items-center justify-center font-display text-primary-foreground text-lg shrink-0">
            JDM
          </div>
          <div className="leading-tight shrink-0">
            <div className="font-display text-base sm:text-lg tracking-wider whitespace-nowrap">JDM RETRO RIDES</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden sm:block md:portrait:hidden">
              {t.nav.logoSubtitle}
            </div>
          </div>

          {/* Hover Tooltip Box */}
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 whitespace-nowrap rounded-[4px] border border-[#f97316] bg-white px-2.5 py-1 shadow-md">
            {/* Triangular arrow pointer */}
            <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-t border-l border-[#f97316] rotate-45" />
            <span className="relative z-10 font-mono text-[11px] font-semibold tracking-wide text-black">
              {language === 'ja' ? 'トップへ戻る' : 'RETURN TO TOP'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <Link to="/inventory" className="hover:text-bronze transition-colors">
            {t.nav.inventory}
          </Link>
          <Link to="/#about" className="hover:text-bronze transition-colors">
            {t.nav.about}
          </Link>
          <Link to="/#process" className="hover:text-bronze transition-colors">
            {t.nav.process}
          </Link>
          <Link to="/#contact" className="hover:text-bronze transition-colors">
            {t.nav.contact}
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-bronze hover:text-bronze/80 transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4" /> {t.nav.admin}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop Currency Converter */}
          <div className="hidden lg:flex items-center rounded-sm border border-border bg-background/50 overflow-hidden text-xs">
            {CURRENCIES.map(code => (
              <button
                key={code}
                onClick={() => setCurrency(code)}
                className={`transition-colors font-medium px-3 py-2 text-xs ${
                  currency === code 
                    ? 'bg-bronze text-primary-foreground' 
                    : 'hover:bg-foreground/5'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          {/* Desktop Enquire Button */}
          <Button
            asChild
            className="hidden lg:flex bg-bronze hover:bg-primary/90 text-primary-foreground font-medium rounded-sm gap-2 px-4 h-10 text-sm"
          >
            <Link to="/#contact">
              <Mail className="w-4 h-4" /> {t.nav.enquire}
            </Link>
          </Button>

          {/* EN / JP Language Switcher (Always displayed at top right across mobile and desktop) */}
          <div
            id="lang-switcher"
            className="flex items-center border border-border rounded-sm bg-background/60 overflow-hidden text-xs font-mono shrink-0"
          >
            <button
              id="lang-btn-en"
              onClick={() => setLanguage('en')}
              className={`transition-colors px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold ${
                language === 'en'
                  ? 'bg-bronze text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              }`}
              title="English"
              aria-label="Switch to English"
            >
              EN
            </button>
            <span className="text-border/60 select-none text-[10px] px-0.5">/</span>
            <button
              id="lang-btn-ja"
              onClick={() => setLanguage('ja')}
              className={`transition-colors px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold ${
                language === 'ja'
                  ? 'bg-bronze text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              }`}
              title="日本語"
              aria-label="日本語に切り替え"
            >
              JP
            </button>
          </div>

          {/* Mobile/Tablet Menu Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground hover:bg-transparent hover:text-bronze shrink-0 h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-background border-b border-border/50 p-6 landscape:p-3.5 landscape:sm:p-4 flex flex-col gap-6 landscape:gap-2.5 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col gap-4 landscape:gap-1.5 text-lg landscape:text-sm font-medium">
            <Link to="/inventory" onClick={() => setMobileMenuOpen(false)} className="hover:text-bronze transition-colors">{t.nav.inventory}</Link>
            <Link to="/#about" onClick={() => setMobileMenuOpen(false)} className="hover:text-bronze transition-colors">{t.nav.about}</Link>
            <Link to="/#process" onClick={() => setMobileMenuOpen(false)} className="hover:text-bronze transition-colors">{t.nav.process}</Link>
            <Link to="/#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-bronze transition-colors">{t.nav.contact}</Link>
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-bronze hover:text-bronze/80 transition-colors flex items-center gap-2">
                <Settings className="w-5 h-5 landscape:w-4 landscape:h-4" /> {t.nav.admin}
              </Link>
            )}
          </nav>

          <div className="flex flex-wrap gap-2 pt-4 landscape:pt-2 border-t border-border">
            {CURRENCIES.map(code => (
              <button
                key={code}
                onClick={() => { setCurrency(code); setMobileMenuOpen(false); }}
                className={`px-4 py-2 landscape:py-1 text-sm landscape:text-xs rounded-sm transition-colors border flex-1 ${
                  currency === code 
                    ? 'border-bronze bg-bronze/10 text-bronze font-medium' 
                    : 'border-border bg-background hover:bg-foreground/5'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          
          <Button
            asChild
            className="w-full bg-bronze hover:bg-primary/90 text-primary-foreground font-medium rounded-sm gap-2 h-12 landscape:h-9 landscape:text-xs"
          >
            <Link to="/#contact" onClick={() => setMobileMenuOpen(false)}>
              <Mail className="w-4 h-4 landscape:w-3.5 landscape:h-3.5" /> {t.nav.enquire}
            </Link>
          </Button>
        </div>
      )}
    </header>
  );
};

export default SiteNav;

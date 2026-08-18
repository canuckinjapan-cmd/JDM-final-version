import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Search,
  ShieldCheck,
  Ship,
  Key,
  Gauge,
  Cog,
  MapPin,
  ArrowRight,
  Phone,
  ZoomIn,
  Info,
} from "lucide-react";
import heroImg from "@/assets/hero-jdm.jpg";
import auctionLane from "@/assets/auction-lane.jpg";
import SiteNav from "@/components/SiteNav";
import ContactForm from "@/components/ContactForm";
import FacebookIcon from "@/components/icons/FacebookIcon";
import { inventory, resolveVehicleImage } from "@/data/inventory";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import SlideshowModal from "@/components/SlideshowModal";
import { VehicleDetailsOverlay } from "@/components/VehicleDetailsOverlay";
import { 
  Vehicle,
  statusStyles,
  fetchVehicles as fetchVehiclesService,
  getBypassStatus,
  setBypassStatus,
  getLocalVehicles
} from "@/lib/firebase";

const FACEBOOK_URL = "https://www.facebook.com/";

const stepIcons = [Search, ShieldCheck, Cog, Ship];
const featureIcons = [MapPin, ShieldCheck, Key];

const Index = () => {
  const { convertPrice, currency } = useCurrency();
  const { t, language } = useLanguage();
  const heroImgRef = useRef<HTMLImageElement | null>(null);
  const [scrollY, setScrollY] = useState(0);

  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>(inventory.slice(0, 4));
  const [connectionMode, setConnectionMode] = useState<"live" | "local" | "fallback">("live");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      if (getBypassStatus()) {
        setConnectionMode("local");
        const localList = getLocalVehicles();
        if (localList.length > 0) {
          const featured = localList.filter(v => v.featured && v.isVisible !== false).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
          setFeaturedVehicles(featured.slice(0, 4));
        }
        return;
      }

      try {
        const list = await fetchVehiclesService();
        if (list.length > 0) {
          const featured = list.filter(v => v.featured && v.isVisible !== false).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
          setFeaturedVehicles(featured.slice(0, 4));
          setConnectionMode("live");
        } else {
          setFeaturedVehicles([]);
          setConnectionMode("live");
        }
      } catch (error: any) {
        console.error("Featured fetch failed:", error);
        setConnectionMode("fallback");
        try {
          const parsed = JSON.parse(error.message);
          setConnectionError(parsed.error || error.message);
        } catch {
          setConnectionError(error.message || String(error));
        }
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (!activeVehicle) return;
    const handleClose = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('article')) setActiveVehicle(null);
    };
    document.addEventListener('mousedown', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
    };
  }, [activeVehicle]);

  const openSlideshow = (images?: string[]) => {
    if (!images || images.length === 0) return;
    setSlideshowImages(images);
    setSlideshowOpen(true);
  };

  // Subtle parallax on the hero background image
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getStatusLabel = (status: string) => {
    if (language === 'ja') {
      switch (status) {
        case 'AVAILABLE': return '販売中';
        case 'IN_TRANSIT': return '輸送中';
        case 'SOURCING': return '仕入れ中';
        case 'SOLD': return '売約済';
        default: return status;
      }
    }
    return status;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* Adjust page container padding relative to fixed SiteNav */}
      <div className="pt-16">
        {connectionMode === "local" && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-6 select-none">
            <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-amber-500 font-mono uppercase tracking-wider">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Local Browser Storage Active</span>
              <button 
                className="text-amber-500 hover:text-amber-400 underline text-xs cursor-pointer font-bold"
                onClick={() => {
                  setBypassStatus(false);
                  window.location.reload();
                }}
              >
                Switch to Live System
              </button>
            </div>
          </div>
        )}

        {connectionMode === "fallback" && (
          <div className="bg-destructive/15 border-b border-destructive/25 py-3 px-6 select-none">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-destructive font-mono uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                <span>Live Database Connection Incomplete (Showing Static Fallback)</span>
                {connectionError && (
                  <span className="text-muted-foreground normal-case text-[11px] max-w-lg truncate ml-2">
                    {connectionError}
                  </span>
                )}
              </span>
              <span className="text-muted-foreground text-[10px]">Verify Firestore config or security rules</span>
            </div>
          </div>
        )}
      </div>

      {/* HERO */}
      <section className="relative min-h-[calc(100svh-4vh)] flex items-end md:items-center overflow-hidden grain">
        <img
          ref={heroImgRef}
          src={heroImg}
          alt="Vintage Nissan Skyline GT-R parked in a Japanese warehouse at night"
          className="absolute inset-0 w-full h-[120%] object-cover will-change-transform"
          style={{
            transform: `translate3d(0, ${scrollY * 0.3}px, 0) scale(1.05)`,
          }}
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-background/30" />

        <div className="relative max-w-7xl mx-auto px-6 pb-20 pt-20 md:pt-32 w-full">
          <div className={language === 'ja' ? "max-w-3xl lg:max-w-4xl xl:max-w-5xl" : "max-w-3xl"}>
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-10 bg-bronze" />
              <span className="mono text-xs uppercase tracking-[0.3em] text-bronze">
                {t.hero.since}
              </span>
            </div>
            {language === 'ja' ? (
              <h1 className="font-sans font-bold tracking-tight mb-6 leading-[1.2] sm:leading-[1.18] lg:leading-[1.15] text-[24px] xs:text-[27px] sm:text-4xl md:text-5xl lg:text-[54px] xl:text-6xl">
                <span className="block whitespace-nowrap">{t.hero.titlePart1}</span>
                <span className="block whitespace-nowrap">日本のオークションから</span>
                <span className="block whitespace-nowrap">直接仕入れ、輸出。</span>
                <span className="block whitespace-nowrap text-bronze">{t.hero.titleHighlight}</span>
              </h1>
            ) : (
              <h1 className="font-display text-5xl sm:text-7xl md:text-8xl leading-[0.9] mb-6">
                30+ Years Inside <br />
                Japan's Auctions. <br />
                <span className="text-bronze">Shipped to your driveway.</span>
              </h1>
            )}
            {language === 'ja' ? (
              <p className="text-[13px] xs:text-sm sm:text-base md:text-lg text-foreground/80 max-w-xl mb-5 sm:mb-8 md:mb-10 leading-snug sm:leading-relaxed">
                {t.hero.description}
              </p>
            ) : (
              <p className="text-lg text-foreground/80 max-w-xl mb-10 leading-relaxed">
                {t.hero.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="bg-bronze hover:bg-primary/90 text-primary-foreground font-medium rounded-sm gap-2 h-11 sm:h-12 px-5 sm:px-8 text-xs sm:text-sm"
              >
                <Link to="/inventory">
                  {t.hero.browseInventory} <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-foreground/30 text-foreground hover:border-bronze hover:text-bronze hover:bg-bronze/10 rounded-sm h-11 sm:h-12 px-5 sm:px-8 gap-2 text-xs sm:text-sm transition-colors"
              >
                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
                  <FacebookIcon className="w-4 h-4" /> {t.hero.facebook}
                </a>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
              {[
                [<AnimatedNumber key="num1" value={30} suffix="+" />, t.hero.yearsExporting],
                [<AnimatedNumber key="num2" value={1200} suffix="+" />, t.hero.carsDelivered],
                ["USS / JU", t.hero.auctionAccess],
                ["UK · AU", t.hero.primaryMarkets],
              ].map(([k, v]) => (
                <div key={v as string} className="border-l border-bronze/40 pl-3">
                  <div className="font-display text-3xl text-bronze">{k}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{v as string}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <span>{t.hero.scroll}</span>
          <span className="h-px w-12 bg-muted-foreground/50" />
        </div>
      </section>

      {/* INVENTORY */}
      <section id="inventory" className="py-24 sm:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-10 bg-bronze" />
                <span className="mono text-xs uppercase tracking-[0.3em] text-bronze">
                  {t.inventorySection.sectionTag}
                </span>
              </div>
              <h2 className="font-display text-5xl md:text-6xl leading-none">
                {t.inventorySection.sectionHeading} <br />
                <span className="text-bronze">{t.inventorySection.sectionHeadingHighlight}</span>
              </h2>
            </div>
            <p className="text-muted-foreground max-w-md">
              {t.inventorySection.sectionDescription}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
            {featuredVehicles.map((c, index) => {
              const isLeft2Col = index % 2 === 0;
              return (
                <article
                  key={c.id}
                  className="group gradient-card border border-border rounded-sm shadow-deep hover:border-bronze/50 transition-all duration-500 relative scroll-mt-24"
                >
                  <div className={activeVehicle?.id === c.id ? "opacity-0 pointer-events-none" : ""}>
                    <div
                      className={`relative aspect-[16/10] overflow-hidden bg-secondary group/main ${
                        c.images && c.images.length > 0 ? "cursor-pointer" : ""
                      }`}
                      onClick={() => openSlideshow(c.images || [c.img])}
                    >
                      <img
                        src={(c.images && c.images.length > 0) ? c.images[0] : c.img}
                        alt={`${c.year} ${c.name}`}
                        loading="lazy"
                        width={1280}
                        height={800}
                        className="w-full h-full object-cover transition-transform duration-700 lg:group-hover/main:scale-105"
                      />
                      {c.images && c.images.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          <ZoomIn className="text-white opacity-0 group-hover/main:opacity-100 w-10 h-10 transition-opacity absolute top-4 right-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge
                          variant="outline"
                          className={`rounded-sm uppercase tracking-wider text-[10px] font-mono ${statusStyles[c.status]}`}
                        >
                          {getStatusLabel(c.status)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-sm uppercase tracking-wider text-[10px] font-mono bg-background/60 backdrop-blur-sm border-border text-foreground/80"
                        >
                          {!c.grade ? '' : /^auction/i.test(c.grade) ? (language === 'ja' ? c.grade.replace(/Auction Grade /i, '評価点 ') : c.grade) : `${t.inventorySection.auctionGrade} ${c.grade}`}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                          <div className="mono text-xs text-bronze tracking-wider mb-1">{c.year}</div>
                          <h3 className="font-display text-3xl leading-none">{c.name}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex flex-col items-end">
                            <span>{t.inventorySection.price} {currency !== 'JPY' && t.inventorySection.priceApprox}</span>
                          </div>
                          <div className="font-display text-2xl text-bronze">{convertPrice(c.priceJPY).formatted}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mb-6 pt-5 border-t border-border">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Gauge className="w-4 h-4 text-bronze" /> {c.mileage}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Cog className="w-4 h-4 text-bronze" /> {c.transmission}
                        </div>
                        <div className="mono text-[11px] text-muted-foreground tracking-wider uppercase col-span-1">
                          {c.displacementLabel}
                        </div>
                        <div className="mono text-[11px] text-muted-foreground tracking-wider uppercase col-span-1">
                          {c.stockNumber ? `${t.inventorySection.stock}: ${c.stockNumber}` : ""}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 rounded-sm border-border hover:border-bronze hover:bg-bronze/10 hover:text-bronze transition-colors h-11"
                          onClick={(e) => {
                            const article = e.currentTarget.closest('article');
                            if (article) article.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            setActiveVehicle(c);
                          }}
                        >
                          <Info className="w-4 h-4 mr-2 hidden md:block" />
                          {t.inventorySection.viewDetails}
                        </Button>
                        {c.status === "SOLD" ? (
                          <Button
                            disabled
                            className="flex-1 rounded-sm btn-sold-bronze cursor-not-allowed h-11 pointer-events-none font-mono uppercase tracking-widest text-xs"
                          >
                            {t.inventorySection.sold}
                          </Button>
                        ) : (
                          <Button
                            asChild
                            className="flex-1 rounded-sm gradient-bronze hover:opacity-90 transition-opacity h-11 border-0 text-white cursor-pointer"
                          >
                            <Link 
                              to="/#contact"
                              state={{ subject: c.stockNumber ? `${c.year} ${c.name} (${t.inventorySection.stock}: ${c.stockNumber})` : `${c.year} ${c.name}` }}
                            >
                              <Mail className="w-4 h-4 mr-2 hidden md:block" />
                              {t.inventorySection.enquire}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {activeVehicle?.id === c.id && (
                    <VehicleDetailsOverlay 
                      vehicle={c} 
                      onClose={() => setActiveVehicle(null)} 
                      className={`
                        fixed inset-0 z-[100] rounded-none md:rounded-sm
                        md:absolute md:inset-auto md:top-0 md:h-full md:z-30
                        ${isLeft2Col ? 'md:left-0 md:w-[calc(200%+2rem)]' : 'md:left-[calc(-100%-2rem)] md:w-[calc(200%+2rem)]'}
                        lg:absolute lg:inset-0 lg:left-0 lg:w-full lg:h-full lg:z-30
                      `}
                    />
                  )}
                </article>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="text-sm text-foreground/60 italic">
              {t.inventorySection.currencyDisclaimer}
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-sm border-bronze text-bronze hover:bg-bronze hover:text-primary-foreground transition-colors gap-2 h-12 px-8"
            >
              <Link to="/inventory">
                {t.inventorySection.seeAllVehicles} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {t.about.tag}
              </span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-tight mb-8">
              {t.about.heading}<br /> <span className="text-bronze">{t.about.headingHighlight}</span>
            </h2>
          </div>
          <div className="max-w-xl space-y-6 text-foreground/80 leading-relaxed text-lg pt-2 lg:pt-12">
            <p>
              {t.about.p1}
            </p>
            <p>
              {t.about.p2}
            </p>
            <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-border">
              <div>
                <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{t.about.statUkDelivery}</div>
                <div className="font-mono text-sm">{t.about.statUkDeliveryVal}</div>
              </div>
              <div>
                <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{t.about.statCompliance}</div>
                <div className="font-mono text-sm">{t.about.statComplianceVal}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="process" className="py-24 sm:py-32 bg-secondary/30 relative overflow-hidden grain">
        <div className="absolute inset-0 opacity-10">
          <img src={auctionLane} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-bronze" />
              <span className="mono text-xs uppercase tracking-[0.3em] text-bronze">
                {t.process.tag}
              </span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-none mb-6">
              {t.process.heading} <br />
              <span className="text-bronze">{t.process.headingHighlight}</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              {t.process.description}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-sm overflow-hidden border border-border">
            {t.process.steps.map((s, idx) => {
              const Icon = stepIcons[idx] || Search;
              return (
                <div
                  key={s.n}
                  className="bg-background p-8 group hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-display text-5xl text-bronze/30 group-hover:text-bronze transition-colors">
                      {s.n}
                    </span>
                    <div className="w-12 h-12 rounded-sm border border-bronze/40 flex items-center justify-center text-bronze">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-display text-2xl mb-3 leading-tight">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-8">
            {t.process.features.map((feat, idx) => {
              const Icon = featureIcons[idx] || MapPin;
              return (
                <div key={feat.title} className="flex gap-4 p-6 border border-border rounded-sm bg-background/60">
                  <Icon className="w-6 h-6 text-bronze shrink-0 mt-1" />
                  <div>
                    <div className="font-medium mb-1">{feat.title}</div>
                    <div className="text-sm text-muted-foreground">{feat.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 bg-secondary/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {t.testimonials.tag}
              </span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-tight">
              {t.testimonials.heading}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.testimonials.items.map((item, idx) => (
              <div key={idx} className="bg-background border border-border group overflow-hidden flex flex-col">
                <div 
                  className="aspect-[4/3] overflow-hidden cursor-pointer"
                  onClick={() => openSlideshow([resolveVehicleImage(item.image)])}
                >
                  <img 
                    src={resolveVehicleImage(item.image)} 
                    alt={item.car} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:duration-700 ease-out" 
                  />
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
                    {item.car}
                  </div>
                  <p className="text-xl mb-8 leading-relaxed font-serif text-foreground/90 flex-1">
                    {item.quote}
                  </p>
                  <div className="flex items-center justify-between text-xs tracking-wider text-muted-foreground mono mt-auto uppercase">
                    <span>{item.author}</span>
                    <span className="flex items-center gap-2">
                      <img 
                        src={`https://flagcdn.com/w40/${item.flagCode}.png`} 
                        alt={`${item.country} Flag`} 
                        className="w-4 h-2.5 object-cover rounded-[1px] border border-white/10 shadow-sm" 
                        referrerPolicy="no-referrer"
                      />
                      {item.country}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 bg-secondary/40 border-y border-border scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-10 bg-bronze" />
              <span className="mono text-xs uppercase tracking-[0.3em] text-bronze">
                {t.contact.tag}
              </span>
            </div>
            <h2 className="font-display text-5xl md:text-6xl leading-none mb-6">
              {t.contact.heading} <br />
              <span className="text-bronze">{t.contact.headingHighlight}</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {t.contact.description}
            </p>

            <div className="space-y-4">
              <a
                href="tel:+8152XXXXXXX"
                className="flex items-center gap-3 text-foreground/90 hover:text-bronze transition-colors"
              >
                <Phone className="w-5 h-5 text-bronze" />
                <span className="mono text-sm">{t.contact.phone}</span>
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-foreground/90 hover:text-bronze transition-colors"
              >
                <FacebookIcon className="w-5 h-5" />
                <span className="text-sm">{t.contact.followFb}</span>
              </a>
              <div className="mono text-xs text-muted-foreground pt-2">
                {t.contact.hours}
              </div>
            </div>
          </div>

          <div className="border border-border rounded-sm bg-background/60 p-6 md:p-8 shadow-deep">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm gradient-bronze flex items-center justify-center font-display text-primary-foreground text-sm">
              JDM
            </div>
            <span className="font-display tracking-wider">JDM RETRO RIDES</span>
          </div>
          <div className="mono text-xs uppercase tracking-[0.3em] text-muted-foreground text-center">
            {t.footer.tagline}
          </div>
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} JDM Retro Rides
          </div>
        </div>
      </footer>
      <SlideshowModal
        images={slideshowImages}
        initialIndex={0}
        isOpen={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
      />
    </div>
  );
};

export default Index;

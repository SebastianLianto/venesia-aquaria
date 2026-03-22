import { useState, useEffect, useRef, createContext, useContext } from "react";

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Sora:wght@300;400;500;600;700&display=swap";

// ─── Theme (Light) ───────────────────────────────────────────────────────
const theme = {
    bg: "#F6F3EE",
    surface: "#FFFFFF",
    surfaceAlt: "#EDE9E3",
    accent: "#1B3C35",
    accentLight: "#2D6A5A",
    accentTint: "rgba(27,60,53,0.06)",
    text: "#3A3A3A",
    textMuted: "#8A8577",
    border: "rgba(0,0,0,0.07)",
    dark: "#1A1A1A",
    warm: "#C4A265",
};

// ═══════════════════════════════════════════════════════════════════════════
// i18n — TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════
// i18n — Loads translations from /lang/en.json and /lang/id.json in public/
// To update text, just edit the JSON files — no code changes needed.
// To add a new language, create /lang/xx.json and add "xx" to SUPPORTED_LANGS.
// ═══════════════════════════════════════════════════════════════════════════
const SUPPORTED_LANGS = ["en", "id"];

const LangContext = createContext();

function LangProvider({ children }) {
    const [lang, setLang] = useState(() => {
        try { return localStorage.getItem("va-lang") || "en"; } catch { return "en"; }
    });
    const [translations, setTranslations] = useState({});
    const [ready, setReady] = useState(false);

    // Load all language files once on mount
    useEffect(() => {
        Promise.all(
            SUPPORTED_LANGS.map(code =>
                fetch(`/lang/${code}.json`)
                    .then(res => { if (!res.ok) throw new Error(`Missing ${code}.json`); return res.json(); })
                    .then(data => ({ code, data }))
            )
        )
            .then(results => {
                const map = {};
                results.forEach(({ code, data }) => { map[code] = data; });
                setTranslations(map);
                setReady(true);
            })
            .catch(err => {
                console.error("Failed to load translations:", err);
                setReady(true); // still render, t() will return fallback keys
            });
    }, []);

    const toggle = () => {
        const next = lang === "en" ? "id" : "en";
        setLang(next);
        try { localStorage.setItem("va-lang", next); } catch { }
    };

    const t = (key) => translations[lang]?.[key] ?? translations.en?.[key] ?? key;

    return (
        <LangContext.Provider value={{ lang, toggle, t, ready }}>
            {children}
        </LangContext.Provider>
    );
}

function useLang() { return useContext(LangContext); }

// ─── Shared Styles ───────────────────────────────────────────────────────
const css = `
  @import url('${FONTS_URL}');
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  :root {
    --bg: ${theme.bg}; --surface: ${theme.surface}; --surface-alt: ${theme.surfaceAlt};
    --accent: ${theme.accent}; --accent-light: ${theme.accentLight}; --accent-tint: ${theme.accentTint};
    --text: ${theme.text}; --text-muted: ${theme.textMuted}; --border: ${theme.border};
    --dark: ${theme.dark}; --warm: ${theme.warm};
    --serif: 'Cormorant Garamond', Georgia, serif;
    --sans: 'Sora', system-ui, sans-serif;
  }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: var(--sans); line-height: 1.6; overflow-x: hidden; }
  ::selection { background: var(--accent); color: #fff; }
  .container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
  .reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.8s cubic-bezier(.16,1,.3,1), transform 0.8s cubic-bezier(.16,1,.3,1); }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  section { padding: 100px 0; position: relative; }
  .section-label { font-family: var(--sans); font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--accent-light); margin-bottom: 18px; display: flex; align-items: center; gap: 14px; }
  .section-label::before { content: ''; width: 28px; height: 1.5px; background: var(--warm); }
  .section-title { font-family: var(--serif); font-size: clamp(32px, 5vw, 50px); font-weight: 600; color: var(--dark); line-height: 1.15; margin-bottom: 18px; }
  .section-subtitle { font-size: 16px; color: var(--text-muted); max-width: 520px; line-height: 1.75; }
  .btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 32px; border-radius: 60px; font-family: var(--sans); font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.35s cubic-bezier(.16,1,.3,1); text-decoration: none; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(27,60,53,0.2); background: var(--accent-light); }
  .btn-ghost { background: transparent; color: var(--dark); border: 1.5px solid var(--border); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  body::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 180px; }
  @keyframes faq-spin { to { transform: rotate(360deg); } }
`;

// ─── Hooks & Utilities ───────────────────────────────────────────────────
function useReveal() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); } },
            { threshold: 0.15 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return ref;
}

function Reveal({ children, delay = 0, className = "" }) {
    const ref = useReveal();
    return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

const LOGO_SRC = "/logo.png";
function LogoImg({ height = 40 }) {
    return <img src={LOGO_SRC} alt="Venesia Aquaria Design" style={{ height, width: "auto", objectFit: "contain", display: "block" }} />;
}

const ArrowIcon = () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
);

// ═══════════════════════════════════════════════════════════════════════════
// LANGUAGE TOGGLE
// ═══════════════════════════════════════════════════════════════════════════
function LangToggle() {
    const { lang, toggle } = useLang();
    return (
        <button onClick={toggle} title="Switch language" style={{
            display: "flex", alignItems: "center", gap: 6,
            background: theme.accentTint, border: `1px solid ${theme.border}`,
            borderRadius: 20, padding: "6px 14px", cursor: "pointer",
            fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600,
            color: theme.accent, transition: "all 0.3s",
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; }}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {lang === "en" ? "EN" : "ID"}
        </button>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════
function Navbar({ onNavigate, currentPage }) {
    const { t } = useLang();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", h);
        return () => window.removeEventListener("scroll", h);
    }, []);

    const links = [
        { label: t("nav_home"), action: () => onNavigate("home"), href: "#home" },
        { label: t("nav_catalog"), action: () => onNavigate("catalog"), href: "#" },
        { label: t("nav_faq"), action: () => onNavigate("home", "faq"), href: "#faq" },
        { label: t("nav_contact"), action: () => onNavigate("home", "contact"), href: "#contact" },
    ];

    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
            padding: scrolled ? "12px 0" : "20px 0",
            background: scrolled ? "rgba(246,243,238,0.92)" : "transparent",
            backdropFilter: scrolled ? "blur(16px)" : "none",
            borderBottom: scrolled ? `1px solid ${theme.border}` : "1px solid transparent",
            transition: "all 0.4s ease",
        }}>
            <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <a href="#" onClick={e => { e.preventDefault(); onNavigate("home"); }} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                    <LogoImg height={44} />
                </a>

                <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="nav-desktop">
                    {links.map(l => (
                        <a key={l.label} href={l.href} onClick={e => { e.preventDefault(); l.action(); }} style={{
                            textDecoration: "none", color: theme.text, fontSize: 13, fontWeight: 500,
                            letterSpacing: 0.5, transition: "color 0.3s",
                        }}
                            onMouseEnter={e => e.target.style.color = theme.accent}
                            onMouseLeave={e => e.target.style.color = theme.text}
                        >{l.label}</a>
                    ))}
                    <LangToggle />
                    <a href="#" onClick={e => { e.preventDefault(); onNavigate("home", "contact"); }} className="btn btn-primary" style={{ padding: "10px 26px", fontSize: 12, letterSpacing: 0.5 }}>{t("nav_cta")}</a>
                </div>

                <div style={{ display: "none", alignItems: "center", gap: 12 }} className="nav-mobile-area">
                    <LangToggle />
                    <button onClick={() => setMenuOpen(!menuOpen)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        display: "flex", flexDirection: "column", gap: 5, padding: 8,
                    }}>
                        {[0, 1, 2].map(i => (
                            <span key={i} style={{
                                width: 22, height: 2, background: theme.dark, borderRadius: 2, transition: "all 0.3s",
                                transform: menuOpen ? (i === 0 ? "rotate(45deg) translate(5px,5px)" : i === 2 ? "rotate(-45deg) translate(5px,-5px)" : "scaleX(0)") : "none",
                            }} />
                        ))}
                    </button>
                </div>
            </div>

            {menuOpen && (
                <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0,
                    background: "rgba(246,243,238,0.97)", backdropFilter: "blur(20px)",
                    padding: "24px 32px", display: "flex", flexDirection: "column", gap: 20,
                    borderBottom: `1px solid ${theme.border}`,
                }}>
                    {links.map(l => (
                        <a key={l.label} href={l.href} onClick={e => { e.preventDefault(); setMenuOpen(false); l.action(); }}
                            style={{ textDecoration: "none", color: theme.dark, fontSize: 15, fontWeight: 500 }}>
                            {l.label}
                        </a>
                    ))}
                </div>
            )}

            <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-area { display: flex !important; }
        }
      `}</style>
        </nav>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════════════════
function Hero() {
    const { t } = useLang();
    return (
        <section id="home" style={{ paddingTop: 160, paddingBottom: 120, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "-15%", right: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,162,101,0.1) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(27,60,53,0.05) 0%, transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />
            <div className="container" style={{ position: "relative", zIndex: 1 }}>
                <Reveal><div className="section-label" style={{ marginBottom: 24 }}>{t("hero_label")}</div></Reveal>
                <Reveal delay={100}>
                    <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(40px, 7vw, 76px)", color: theme.dark, lineHeight: 1.08, maxWidth: 780, marginBottom: 24, fontWeight: 600 }}>
                        {t("hero_title_1")}<br /><span style={{ color: theme.accentLight, fontStyle: "italic" }}>{t("hero_title_2")}</span>
                    </h1>
                </Reveal>
                <Reveal delay={200}><p style={{ fontSize: 17, color: theme.textMuted, maxWidth: 500, lineHeight: 1.8, marginBottom: 40 }}>{t("hero_desc")}</p></Reveal>
                <Reveal delay={300}>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <a href="#catalog" className="btn btn-primary">{t("hero_btn_catalog")}<ArrowIcon /></a>
                        <a href="#contact" className="btn btn-ghost">{t("hero_btn_contact")}</a>
                    </div>
                </Reveal>
                <Reveal delay={450}>
                    <div style={{ marginTop: 72, display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
                        {[t("hero_badge_1"), t("hero_badge_2"), t("hero_badge_3")].map((txt, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.warm }} />
                                <span style={{ fontSize: 13, fontWeight: 500, color: theme.textMuted }}>{txt}</span>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CATALOG — Shared card component + Preview (home) + Full page
// ═══════════════════════════════════════════════════════════════════════════
function CatalogCard({ item, i }) {
    const { t } = useLang();
    return (
        <Reveal delay={i * 70}>
            <div style={{
                background: theme.bg, borderRadius: 16, padding: 32,
                border: `1px solid ${theme.border}`, transition: "all 0.4s ease",
                cursor: "pointer", overflow: "hidden", height: "100%",
            }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(27,60,53,0.18)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
                <div style={{ width: "100%", height: 180, borderRadius: 10, marginBottom: 22, background: theme.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 13, color: theme.textMuted, fontWeight: 500 }}>{t("catalog_image")}</span>
                </div>
                <div style={{ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: theme.accentLight, background: theme.accentTint, padding: "4px 12px", borderRadius: 20, marginBottom: 14 }}>{item.tag}</div>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 24, fontWeight: 600, color: theme.dark, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.7 }}>{item.desc}</p>
            </div>
        </Reveal>
    );
}

// Preview on home page — shows first 4 items + "See All" button
function CatalogPreview({ onNavigate }) {
    const { t } = useLang();
    const items = Array.isArray(t("catalog_items")) ? t("catalog_items") : [];
    const preview = items.slice(0, 4);

    return (
        <section id="catalog" style={{ background: theme.surface }}>
            <div className="container">
                <Reveal>
                    <div className="section-label">{t("catalog_label")}</div>
                    <h2 className="section-title">{t("catalog_title_1")}<br />{t("catalog_title_2")}</h2>
                    <p className="section-subtitle" style={{ marginBottom: 56 }}>{t("catalog_subtitle")}</p>
                </Reveal>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
                    {preview.map((item, i) => <CatalogCard key={i} item={item} i={i} />)}
                </div>
                {items.length > 4 && (
                    <Reveal delay={300}>
                        <div style={{ textAlign: "center", marginTop: 48 }}>
                            <button
                                className="btn btn-ghost"
                                onClick={() => onNavigate("catalog")}
                                style={{ fontSize: 14, padding: "14px 36px" }}
                            >
                                {t("catalog_see_all")}
                                <ArrowIcon />
                            </button>
                        </div>
                    </Reveal>
                )}
            </div>
        </section>
    );
}

// Full catalog page — shows all items with back button
function CatalogPage({ onNavigate }) {
    const { t } = useLang();
    const items = Array.isArray(t("catalog_items")) ? t("catalog_items") : [];

    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <section style={{ background: theme.surface, paddingTop: 140, minHeight: "100vh" }}>
            <div className="container">
                <Reveal>
                    <button
                        onClick={() => onNavigate("home")}
                        style={{
                            display: "inline-flex", alignItems: "center", gap: 8,
                            background: "none", border: "none", cursor: "pointer",
                            fontFamily: "var(--sans)", fontSize: 13, fontWeight: 500,
                            color: theme.textMuted, marginBottom: 32, padding: 0,
                            transition: "color 0.3s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = theme.accent}
                        onMouseLeave={e => e.currentTarget.style.color = theme.textMuted}
                    >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 8H3M7 4l-4 4 4 4" /></svg>
                        {t("catalog_back")}
                    </button>
                </Reveal>
                <Reveal>
                    <div className="section-label">{t("catalog_label")}</div>
                    <h2 className="section-title">{t("catalog_page_title_1")}<br />{t("catalog_page_title_2")}</h2>
                    <p className="section-subtitle" style={{ marginBottom: 56 }}>{t("catalog_subtitle")}</p>
                </Reveal>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
                    {items.map((item, i) => <CatalogCard key={i} item={item} i={i} />)}
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT
// ═══════════════════════════════════════════════════════════════════════════
function About() {
    const { t } = useLang();
    const stats = [
        { num: t("about_stat_1_num"), label: t("about_stat_1_label") },
        { num: t("about_stat_2_num"), label: t("about_stat_2_label") },
        { num: t("about_stat_3_num"), label: t("about_stat_3_label") },
    ];
    return (
        <section id="about">
            <div className="container">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
                    <Reveal>
                        <div>
                            <div className="section-label">{t("about_label")}</div>
                            <h2 className="section-title">{t("about_title_1")}<br />{t("about_title_2")}</h2>
                            <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.8, marginBottom: 20 }}>{t("about_p1")}</p>
                            <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.8, marginBottom: 36 }}>{t("about_p2")}</p>
                            <div style={{ display: "flex", gap: 44 }}>
                                {stats.map((s, i) => (
                                    <div key={i}>
                                        <div style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 700, color: theme.accent }}>{s.num}</div>
                                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                    <Reveal delay={150}>
                        <div style={{ background: theme.surfaceAlt, borderRadius: 20, aspectRatio: "4/3", border: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: `radial-gradient(circle at 30% 50%, ${theme.accent} 1px, transparent 1px), radial-gradient(circle at 70% 50%, ${theme.accent} 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
                            <span style={{ fontSize: 14, color: theme.textMuted, fontWeight: 500, position: "relative" }}>{t("about_photo")}</span>
                        </div>
                    </Reveal>
                </div>
            </div>
            <style>{`@media (max-width: 768px) { #about .container > div { grid-template-columns: 1fr !important; gap: 44px !important; } }`}</style>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ═══════════════════════════════════════════════════════════════════════════
function Testimonials() {
    const { t } = useLang();
    const items = Array.isArray(t("testimonials")) ? t("testimonials") : [];
    return (
        <section id="testimonials" style={{ background: theme.surface }}>
            <div className="container">
                <Reveal>
                    <div className="section-label">{t("testimonials_label")}</div>
                    <h2 className="section-title">{t("testimonials_title")}</h2>
                </Reveal>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 48 }}>
                    {items.map((item, i) => (
                        <Reveal key={i} delay={i * 100}>
                            <div style={{ background: theme.bg, borderRadius: 18, padding: 32, border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", height: "100%" }}>
                                <svg width="28" height="20" viewBox="0 0 32 24" fill="none" style={{ marginBottom: 20, opacity: 0.25 }}>
                                    <path d="M0 24V14.4C0 6.13 5.07 1.16 13.33 0L14.93 3.73C10.4 5.07 7.73 8.27 7.47 12H12.8V24H0ZM17.07 24V14.4C17.07 6.13 22.13 1.16 30.4 0L32 3.73C27.47 5.07 24.8 8.27 24.53 12H29.87V24H17.07Z" fill={theme.accent} />
                                </svg>
                                <p style={{ fontSize: 15, color: theme.text, lineHeight: 1.8, flex: 1, marginBottom: 24 }}>{item.quote}</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: theme.accentTint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 16, fontWeight: 700, color: theme.accent }}>{item.name[0]}</div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: theme.dark }}>{item.name}</div>
                                        <div style={{ fontSize: 11, color: theme.textMuted }}>{item.role}</div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// FAQ (loads from /faq-data.json — bilingual with q_en/a_en and q_id/a_id)
// ═══════════════════════════════════════════════════════════════════════════
function useFaqData(lang) {
    const [raw, setRaw] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("/faq-data.json")
            .then(res => { if (!res.ok) throw new Error("Failed"); return res.json(); })
            .then(data => { setRaw(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, []);

    const faqData = raw
        .map(item => ({
            q: item[`q_${lang}`] || item.q_en || "",
            a: item[`a_${lang}`] || item.a_en || "",
        }))
        .filter(item => item.q && item.a);

    return { faqData, loading, error };
}

function FaqItem({ item, isOpen, onToggle }) {
    return (
        <div style={{ borderBottom: `1px solid ${theme.border}`, overflow: "hidden" }}>
            <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 20 }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600, color: isOpen ? theme.accent : theme.dark, transition: "color 0.3s", lineHeight: 1.3 }}>{item.q}</span>
                <span style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: isOpen ? theme.accent : theme.accentTint, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.35s cubic-bezier(.16,1,.3,1)" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: "transform 0.35s cubic-bezier(.16,1,.3,1)", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}>
                        <path d="M7 1v12M1 7h12" stroke={isOpen ? "#fff" : theme.accent} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </span>
            </button>
            <div style={{ maxHeight: isOpen ? 300 : 0, opacity: isOpen ? 1 : 0, transition: "max-height 0.45s cubic-bezier(.16,1,.3,1), opacity 0.35s ease", overflow: "hidden" }}>
                <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.8, paddingBottom: 24, maxWidth: 680 }}>{item.a}</p>
            </div>
        </div>
    );
}

function FAQ() {
    const { lang, t } = useLang();
    const [openIndex, setOpenIndex] = useState(null);
    const { faqData, loading, error } = useFaqData(lang);

    return (
        <section id="faq" style={{ background: theme.surface }}>
            <div className="container">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, alignItems: "start" }}>
                    <Reveal>
                        <div style={{ position: "sticky", top: 120 }}>
                            <div className="section-label">{t("faq_label")}</div>
                            <h2 className="section-title">{t("faq_title_1")}<br />{t("faq_title_2")}</h2>
                            <p className="section-subtitle" style={{ marginBottom: 28 }}>{t("faq_subtitle")}</p>
                            <a href="#contact" className="btn btn-ghost" style={{ fontSize: 13 }}>{t("faq_still")}</a>
                        </div>
                    </Reveal>
                    <Reveal delay={100}>
                        <div style={{ borderTop: `1px solid ${theme.border}` }}>
                            {loading && (
                                <div style={{ padding: "40px 0", textAlign: "center" }}>
                                    <div style={{ width: 28, height: 28, border: `3px solid ${theme.surfaceAlt}`, borderTopColor: theme.accent, borderRadius: "50%", animation: "faq-spin 0.7s linear infinite", margin: "0 auto 12px" }} />
                                    <p style={{ fontSize: 13, color: theme.textMuted }}>{t("faq_loading")}</p>
                                </div>
                            )}
                            {error && (
                                <div style={{ padding: "40px 0", textAlign: "center" }}>
                                    <p style={{ fontSize: 14, color: "#b44" }}>{t("faq_error")}</p>
                                    <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 6 }}>{t("faq_error_hint")}</p>
                                </div>
                            )}
                            {!loading && !error && faqData.map((item, i) => (
                                <FaqItem key={i} item={item} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? null : i)} />
                            ))}
                        </div>
                    </Reveal>
                </div>
            </div>
            <style>{`@media (max-width: 768px) { #faq .container > div { grid-template-columns: 1fr !important; gap: 36px !important; } #faq .container > div > div:first-child { position: static !important; } }`}</style>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════════════════════════════════
function Contact() {
    const { t } = useLang();
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [status, setStatus] = useState("idle"); // idle | sending | sent | error

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (status !== "idle") setStatus("idle");
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

        setStatus("sending");
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error("Server error");
            setStatus("sent");
            setForm({ name: "", email: "", message: "" });
        } catch (err) {
            console.error("Contact form error:", err);
            setStatus("error");
        }
    };

    const isValid = form.name.trim() && form.email.trim() && form.message.trim();
    const isSending = status === "sending";

    const fields = [
        { key: "name", label: t("contact_form_name"), type: "text", placeholder: t("contact_form_name_ph") },
        { key: "email", label: t("contact_form_email"), type: "email", placeholder: t("contact_form_email_ph") },
        { key: "message", label: t("contact_form_msg"), type: "textarea", placeholder: t("contact_form_msg_ph") },
    ];

    const inputStyle = {
        width: "100%", padding: "12px 16px", borderRadius: 10,
        border: `1.5px solid ${theme.border}`, background: theme.bg,
        fontFamily: "var(--sans)", fontSize: 14, color: theme.text,
        outline: "none", transition: "border-color 0.3s",
    };

    return (
        <section id="contact" style={{ background: theme.bg }}>
            <div className="container">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
                    <Reveal>
                        <div>
                            <div className="section-label">{t("contact_label")}</div>
                            <h2 className="section-title">{t("contact_title_1")}<br /><span style={{ color: theme.accentLight, fontStyle: "italic" }}>{t("contact_title_2")}</span></h2>
                            <p style={{ fontSize: 15, color: theme.textMuted, lineHeight: 1.8, marginBottom: 36, maxWidth: 420 }}>{t("contact_desc")}</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                {[
                                    { icon: "✉", label: "hello@venesiaaquaria.com" },
                                    { icon: "☎", label: "+65 8123 4567" },
                                    { icon: "◉", label: "123 Marina Boulevard, Singapore" },
                                ].map((c, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: theme.accentTint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: theme.accent }}>{c.icon}</div>
                                        <span style={{ fontSize: 14, color: theme.text }}>{c.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                    <Reveal delay={150}>
                        <div style={{ background: theme.surface, borderRadius: 20, padding: 36, border: `1px solid ${theme.border}` }}>
                            {fields.map((f, i) => (
                                <div key={i} style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.dark, marginBottom: 8, letterSpacing: 0.5 }}>{f.label}</label>
                                    {f.type === "textarea" ? (
                                        <textarea
                                            placeholder={f.placeholder} rows={5} style={{ ...inputStyle, resize: "vertical" }}
                                            value={form[f.key]}
                                            onChange={e => handleChange(f.key, e.target.value)}
                                            onFocus={e => e.target.style.borderColor = theme.accent}
                                            onBlur={e => e.target.style.borderColor = theme.border}
                                            disabled={isSending}
                                        />
                                    ) : (
                                        <input
                                            type={f.type} placeholder={f.placeholder} style={inputStyle}
                                            value={form[f.key]}
                                            onChange={e => handleChange(f.key, e.target.value)}
                                            onFocus={e => e.target.style.borderColor = theme.accent}
                                            onBlur={e => e.target.style.borderColor = theme.border}
                                            disabled={isSending}
                                        />
                                    )}
                                </div>
                            ))}

                            <button
                                className="btn btn-primary"
                                style={{
                                    width: "100%", justifyContent: "center", marginTop: 8,
                                    opacity: (!isValid || isSending) ? 0.5 : 1,
                                    pointerEvents: (!isValid || isSending) ? "none" : "auto",
                                }}
                                onClick={handleSubmit}
                            >
                                {isSending ? t("contact_form_sending") : t("contact_form_submit")}
                                {!isSending && <ArrowIcon />}
                            </button>

                            {status === "sent" && (
                                <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(27,60,53,0.06)", textAlign: "center" }}>
                                    <p style={{ fontSize: 13, color: theme.accent, fontWeight: 500 }}>✓ {t("contact_form_success")}</p>
                                </div>
                            )}
                            {status === "error" && (
                                <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(180,50,50,0.06)", textAlign: "center" }}>
                                    <p style={{ fontSize: 13, color: "#b44", fontWeight: 500 }}>{t("contact_form_error")}</p>
                                </div>
                            )}
                        </div>
                    </Reveal>
                </div>
            </div>
            <style>{`@media (max-width: 768px) { #contact .container > div { grid-template-columns: 1fr !important; gap: 40px !important; } }`}</style>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════
function Footer({ onNavigate }) {
    const { t } = useLang();
    const quickLinks = [
        { label: t("nav_home"), action: () => onNavigate("home") },
        { label: t("nav_catalog"), action: () => onNavigate("catalog") },
        { label: t("nav_faq"), action: () => onNavigate("home", "faq") },
        { label: t("nav_contact"), action: () => onNavigate("home", "contact") },
    ];
    return (
        <footer style={{ padding: "60px 0 32px", borderTop: `1px solid ${theme.border}`, background: theme.surface }}>
            <div className="container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 40, marginBottom: 48 }}>
                    <div style={{ maxWidth: 280 }}>
                        <div style={{ marginBottom: 16 }}><LogoImg height={36} /></div>
                        <p style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.7 }}>{t("footer_desc")}</p>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: theme.dark, marginBottom: 16, letterSpacing: 0.5 }}>{t("footer_links")}</div>
                        {quickLinks.map((l, i) => (
                            <a key={i} href="#" onClick={e => { e.preventDefault(); l.action(); }} style={{ display: "block", fontSize: 13, color: theme.textMuted, textDecoration: "none", marginBottom: 10, transition: "color 0.3s" }}
                                onMouseEnter={e => e.target.style.color = theme.accent} onMouseLeave={e => e.target.style.color = theme.textMuted}>{l.label}</a>
                        ))}
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: theme.dark, marginBottom: 16, letterSpacing: 0.5 }}>{t("footer_services")}</div>
                        {(Array.isArray(t("footer_services_items")) ? t("footer_services_items") : []).map((l, i) => (
                            <a key={i} href="#" onClick={e => { e.preventDefault(); onNavigate("catalog"); }} style={{ display: "block", fontSize: 13, color: theme.textMuted, textDecoration: "none", marginBottom: 10, transition: "color 0.3s" }}
                                onMouseEnter={e => e.target.style.color = theme.accent} onMouseLeave={e => e.target.style.color = theme.textMuted}>{l}</a>
                        ))}
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: theme.dark, marginBottom: 16, letterSpacing: 0.5 }}>{t("footer_follow")}</div>
                        {["Instagram", "Facebook", "Pinterest"].map((s, i) => (
                            <a key={i} href="#" style={{ display: "block", fontSize: 13, color: theme.textMuted, textDecoration: "none", marginBottom: 10, transition: "color 0.3s" }}
                                onMouseEnter={e => e.target.style.color = theme.accent} onMouseLeave={e => e.target.style.color = theme.textMuted}>{s}</a>
                        ))}
                    </div>
                </div>
                <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <span style={{ fontSize: 12, color: theme.textMuted }}>{t("footer_copyright")}</span>
                    <div style={{ display: "flex", gap: 20 }}>
                        {["Privacy", "Terms"].map(s => (
                            <a key={s} href="#" style={{ fontSize: 12, color: theme.textMuted, textDecoration: "none", transition: "color 0.3s" }}
                                onMouseEnter={e => e.target.style.color = theme.accent} onMouseLeave={e => e.target.style.color = theme.textMuted}>{s}</a>
                        ))}
                    </div>
                </div>
            </div>
            <style>{`@media (max-width: 768px) { footer .container > div:first-child { flex-direction: column; } }`}</style>
        </footer>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
    return (
        <LangProvider>
            <AppContent />
        </LangProvider>
    );
}

function AppContent() {
    const { ready } = useLang();
    const [page, setPage] = useState("home"); // "home" or "catalog"

    // Navigate between pages, optionally scroll to a section
    const navigate = (target, scrollTo) => {
        setPage(target);
        if (target === "home" && scrollTo) {
            // Wait for home page to render, then scroll to section
            setTimeout(() => {
                const el = document.getElementById(scrollTo);
                if (el) el.scrollIntoView({ behavior: "smooth" });
            }, 100);
        } else {
            window.scrollTo(0, 0);
        }
    };

    if (!ready) {
        return (
            <>
                <style>{css}</style>
                <div style={{
                    height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
                    background: theme.bg, fontFamily: "var(--sans)",
                }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            width: 32, height: 32, border: `3px solid ${theme.surfaceAlt}`,
                            borderTopColor: theme.accent, borderRadius: "50%",
                            animation: "faq-spin 0.7s linear infinite", margin: "0 auto 16px",
                        }} />
                        <p style={{ fontSize: 13, color: theme.textMuted }}>Loading...</p>
                    </div>
                </div>
            </>
        );
    }

    if (page === "catalog") {
        return (
            <>
                <style>{css}</style>
                <Navbar onNavigate={navigate} currentPage="catalog" />
                <CatalogPage onNavigate={navigate} />
                <Footer onNavigate={navigate} />
            </>
        );
    }

    return (
        <>
            <style>{css}</style>
            <Navbar onNavigate={navigate} currentPage="home" />
            <Hero />
            <CatalogPreview onNavigate={navigate} />
            <About />
            {/* <Testimonials /> */}
            <FAQ />
            <Contact />
            <Footer onNavigate={navigate} />
        </>
    );
}
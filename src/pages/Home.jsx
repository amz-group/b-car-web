import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { db } from '@/lib/db';
import { useLang } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/useSettings';
import NewsSection from '@/components/NewsSection';
import OffersSection from '@/components/OffersSection';
import { ArrowRight, ArrowLeft, Gauge, Fuel, Users, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const categoryIcons = { sedan: '🚗', suv: '🚙', sports: '🏎️', luxury: '✨', van: '🚐' };

export default function Home() {
  const { t, lang, dir } = useLang();
  const { settings } = useSettings();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const list = await db.Car.list('order', 100);
        setCars(list || []);
      } catch (e) { setCars([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return cars;
    if (filter === 'available') return cars.filter(c => c.status === 'available');
    if (filter === 'rented') return cars.filter(c => c.status === 'rented');
    return cars.filter(c => c.category === filter);
  }, [cars, filter]);

  const filters = [
    { key: 'all', label: t.fleet.all },
    { key: 'available', label: t.fleet.available },
    { key: 'rented', label: t.fleet.rented }
  ];

  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const bg = settings?.background_url;

  return (
    <div>
      {/* HERO */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {bg ? (
            <img src={bg} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-zinc-950/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 pb-24 pt-40 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 backdrop-blur-xl mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-cyan-300">B Car For Rent</span>
            </div>
            <h1 className="font-heading font-extrabold text-white leading-[0.95] tracking-tight" style={{ fontSize: 'clamp(2.8rem, 8vw, 6.5rem)' }}>
              {t.hero.title}
            </h1>
            <p className="mt-8 text-lg lg:text-xl text-zinc-300 leading-relaxed max-w-xl">{t.hero.subtitle}</p>
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <a href="#fleet" className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-zinc-950 font-semibold text-sm tracking-wide hover:bg-cyan-400 transition-all duration-300">
                {t.hero.cta}
                <Arrow className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </a>
              <a href={`https://wa.me/${settings?.whatsapp_number || '9647509180156'}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-white/15 bg-white/5 backdrop-blur-xl text-white font-medium text-sm hover:bg-white/10 transition-all">
                {t.contact.callUs}
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 inset-x-0 flex justify-center z-10">
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <span className="text-[10px] uppercase tracking-[0.3em]">{t.hero.scroll}</span>
            <div className="w-px h-12 bg-gradient-to-b from-cyan-400/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* FLEET */}
      <section id="fleet" className="py-24 lg:py-32">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-4">{t.fleet.title}</p>
              <h2 className="font-heading font-extrabold text-white tracking-tight" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
                {t.fleet.subtitle}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${filter === f.key ? 'bg-white text-zinc-950' : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/2] rounded-2xl bg-white/5 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-zinc-500">{t.common.loading}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filtered.map(car => (
                <CarCard key={car.id} car={car} t={t} lang={lang} settings={settings} Arrow={Arrow} />
              ))}
            </div>
          )}
        </div>
      </section>

      <OffersSection />

      <NewsSection />

      {/* ABOUT */}
      <section id="about" className="py-16 lg:py-20 border-t border-white/5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-3">B Car For Rent</p>
            <h2 className="font-heading font-extrabold text-white tracking-tight text-3xl lg:text-4xl leading-tight mb-4">
              {lang === 'en' ? 'Engineered for those who demand more.' : lang === 'ku' ? 'بۆ ئەوانە دروستکراوە کە زیاتر دەوەن.' : 'مصمومة لمن يطالب بالمزيد.'}
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              {lang === 'en' ? 'Every vehicle in our fleet is selected for presence, performance, and precision. Book instantly through WhatsApp — no paperwork, no friction, just motion.'
                : lang === 'ku' ? 'هەموو ئۆتۆمبێلێک لە ئۆتۆمبێلەکانماندا بۆ شکۆ و کارایی و وردی هەڵبژێردراوە. بە یەک چرکە لە ڕێگەی واتسئاپەوە داوی بکە — بێ کاغەز، بێ کێشە، تەنها جووڵە.'
                : 'كل سيارة في أسطولنا مختارة للهيبة والأداء والدقة. احجز فوراً عبر واتساب — بلا أوراق، بلا احتكاك، مجرد حركة.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { num: '24/7', label: lang === 'en' ? 'WhatsApp Booking' : lang === 'ku' ? 'داواکردنی واتسئاپ' : 'حجز واتساب' },
              { num: '7+', label: lang === 'en' ? 'Images per Car' : lang === 'ku' ? 'وێنە بۆ هەر ئۆتۆمبێل' : 'صور لكل سيارة' },
              { num: '3', label: lang === 'en' ? 'Languages' : lang === 'ku' ? 'زمان' : 'لغات' },
              { num: '0', label: lang === 'en' ? 'Friction' : lang === 'ku' ? 'کێشە' : 'احتكاك' }
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between">
                <span className="font-heading font-extrabold text-white text-3xl lg:text-4xl">{s.num}</span>
                <span className="text-xs uppercase tracking-wider text-zinc-500 mt-2">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function CarCard({ car, t, lang, settings, Arrow }) {
  const available = car.status === 'available';
  const img = car.images && car.images.length > 0 ? car.images[0] : null;
  const waNumber = settings?.whatsapp_number || '9647509180156';
  const desc = car[`description_${lang}`] || car.description_en || '';

  const waMessage = available
    ? `Hello B Car For Rent, I am interested in renting the ${car.name} (${car.brand} ${car.model}) which is currently available. Please provide details.`
    : `Hello B Car For Rent, I am interested in the ${car.name} (${car.brand} ${car.model}) which is currently rented. Please notify me when it becomes available.`;

  return (
    <Link to={`/car/${car.id}`} className="group block">
      <div className="relative aspect-[3/2] rounded-2xl overflow-hidden bg-zinc-900 border border-white/[0.06] shadow-2xl shadow-black/40">
        {img ? (
          <img src={img} alt={car.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">{categoryIcons[car.category] || '🚗'}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/10 to-transparent" />
        <div className="absolute top-4 start-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl ${available ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : car.status === 'rented' ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-emerald-400 animate-pulse' : car.status === 'rented' ? 'bg-sky-400' : 'bg-rose-400'}`} />
            {available ? t.fleet.available : car.status === 'rented' ? t.fleet.rented : t.fleet.unavailable}
          </span>
        </div>
        {(car.discount_percentage || 0) > 0 && (
          <div className="absolute top-4 end-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/30">-{car.discount_percentage}%</span>
          </div>
        )}
        <div className="absolute bottom-4 end-4 text-end">
          <div className="text-xs text-zinc-400 uppercase tracking-wider">{t.fleet.from}</div>
          {available && (car.discount_percentage || 0) > 0 ? (
            <div>
              <span className="text-xs text-zinc-600 line-through me-1">${car.price_per_day}</span>
              <span className="text-2xl font-heading font-bold text-amber-300">${(car.price_per_day * (1 - car.discount_percentage / 100)).toFixed(0)}<span className="text-sm font-normal text-zinc-400">{t.fleet.perDay}</span></span>
            </div>
          ) : (
            <div className="text-2xl font-heading font-bold text-white">${car.price_per_day}<span className="text-sm font-normal text-zinc-400">{t.fleet.perDay}</span></div>
          )}
        </div>
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading font-bold text-white text-lg tracking-tight">{car.name}</h3>
          <p className="text-sm text-zinc-500">{car.brand} {car.model} · {car.year}</p>
        </div>
        <div className="shrink-0 w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-zinc-300 group-hover:bg-cyan-400 group-hover:text-zinc-950 group-hover:border-cyan-400 transition-all">
          <Arrow className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
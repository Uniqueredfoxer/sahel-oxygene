import { Link } from 'react-router-dom';
import { useBranding } from '../context/BrandingContext';

export default function Logo({ className = '', href = '/' }) {
  const { appName } = useBranding();
  
  const content = (
    <div className={`flex items-center gap-2.5 group cursor-pointer ${className}`}>
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sahel to-sahel-dark flex items-center justify-center shadow-emerald/30 shadow-md group-hover:scale-105 transition-transform duration-200">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 18L9.5 8L13.5 14L17 7L20 18"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="18" r="1.8" fill="white" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="font-display font-bold text-lg text-slate-900 tracking-tight leading-none group-hover:text-sahel-dark transition-colors">
          {appName}
        </span>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-sahel font-mono -mt-0.5">
          Livraison & Gaz
        </span>
      </div>
    </div>
  );

  return href ? <Link to={href} className="inline-block">{content}</Link> : content;
}

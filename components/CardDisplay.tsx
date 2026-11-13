import React, { useRef, useState, useEffect } from 'react';
import { CardData, Theme } from '../types';
import { Sparkles, Shield, Zap, Skull, Gamepad2, Star, Rocket, Ghost, Crown } from 'lucide-react';

interface CardDisplayProps {
  imageSrc: string;
  data: CardData;
  theme: Theme;
  id?: string;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ imageSrc, data, theme, id }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element.
    const y = e.clientY - rect.top;  // y position within the element.

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation (max 15 degrees)
    const rotateY = ((x - centerX) / centerX) * 15;
    const rotateX = ((centerY - y) / centerY) * 15; // Inverted Y for natural feel

    setRotation({ x: rotateX, y: rotateY });
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setGlarePosition({ x: 50, y: 50 });
  };

  // Theme-specific icons and fonts
  const getThemeIcon = () => {
    switch (theme) {
      case Theme.CYBERPUNK: return <Zap className="w-5 h-5" />;
      case Theme.FANTASY: return <Shield className="w-5 h-5" />;
      case Theme.ZOMBIE: return <Skull className="w-5 h-5" />;
      case Theme.RETRO: return <Gamepad2 className="w-5 h-5" />;
      case Theme.SCI_FI: return <Rocket className="w-5 h-5" />;
      case Theme.HORROR: return <Ghost className="w-5 h-5" />;
      case Theme.MYTHOLOGY: return <Crown className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const getThemeFont = () => {
    switch (theme) {
      case Theme.CYBERPUNK: return 'font-orbitron';
      case Theme.SCI_FI: return 'font-orbitron';
      case Theme.FANTASY: return 'font-cinzel';
      case Theme.MYTHOLOGY: return 'font-cinzel';
      case Theme.HORROR: return 'font-cinzel';
      case Theme.RETRO: return 'font-bangers tracking-widest';
      default: return 'font-sans';
    }
  };

  // Rarity Styles
  const getRarityColor = () => {
    switch(data.rarity) {
        case 'Legendary': return 'border-yellow-400 shadow-yellow-500/50';
        case 'Epic': return 'border-purple-500 shadow-purple-500/50';
        case 'Rare': return 'border-blue-400 shadow-blue-400/50';
        default: return 'border-gray-400 shadow-gray-400/50';
    }
  };

  // Safe defaults in case API returns partial data
  const borderColor = data.colors?.border || '#444';
  const accentColor = data.colors?.accent || '#fff';
  const secondaryColor = data.colors?.secondary || '#222';

  // Stats Limiter
  const displayStats = data.stats ? data.stats.slice(0, 3) : [];
  const overallRating = displayStats[0]?.value || 99;

  return (
    <div id={id} className="card-container w-[320px] h-[480px] mx-auto select-none">
      <div
        ref={cardRef}
        className={`card-inner relative w-full h-full rounded-xl shadow-2xl transition-transform duration-100 ease-linear border-[8px] ${getRarityColor()} bg-black overflow-hidden`}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          borderColor: borderColor,
          boxShadow: `0 20px 50px -12px ${accentColor}66`,
          backfaceVisibility: 'hidden'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Card Background Image */}
        <div className="absolute inset-0 bg-gray-900">
           {/* Fallback pattern or color */}
           <div className="w-full h-full" style={{backgroundColor: secondaryColor}}></div>
        </div>

        {/* Character Image */}
        <img
          src={imageSrc}
          alt={data.name}
          className="absolute inset-0 w-full h-full object-cover z-0 block"
        />

        {/* Improved Readability Layer: Deep Gradient + Backdrop Blur */}
        <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none" />
        <div 
          className="absolute bottom-0 left-0 right-0 h-[40%] backdrop-blur-[2px] z-10 pointer-events-none"
          style={{ 
             WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
             maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
          }}
        />

        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 p-3 z-20 flex justify-between items-start">
            <div className={`bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-br-xl rounded-tl-lg text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${getThemeFont()}`}>
                 {getThemeIcon()}
                 <span>{data.rarity}</span>
            </div>
            
            {/* BIGGER OVERALL RATING */}
            <div className="relative group">
                <div className="absolute inset-0 bg-white/20 blur-lg rounded-full"></div>
                <div className="relative bg-gradient-to-br from-gray-800 to-black backdrop-blur-md border-2 border-white/30 w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-2xl shadow-[0_0_15px_rgba(255,255,255,0.3)] leading-none">
                    {overallRating}
                </div>
            </div>
        </div>

        {/* Bottom Stats & Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white">
          <div className="mb-2">
            <h2 className={`text-2xl font-bold leading-tight mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-200 ${getThemeFont()} drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]`}>
              {data.name}
            </h2>
            <p className="text-xs font-bold text-gray-300 uppercase tracking-widest drop-shadow-md leading-snug">
              {data.title} <span className="text-gray-500">•</span> {data.element}
            </p>
          </div>

          <div className="space-y-1 mb-3">
             {displayStats.map((stat, idx) => (
               <div key={idx} className="flex items-center gap-2 text-xs h-5">
                 {/* Increased width for label from w-24 to w-32 and fixed flex behavior for screenshot consistency */}
                 <span className="w-32 flex-shrink-0 font-bold text-gray-300 drop-shadow-md truncate leading-none flex items-center h-full" title={stat.label}>{stat.label.toUpperCase()}</span>
                 <div className="flex-1 h-2 bg-gray-800/80 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm">
                   <div 
                      className="h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                      style={{ 
                          width: `${stat.value}%`,
                          backgroundColor: idx === 0 ? '#fbbf24' : accentColor 
                      }} 
                    />
                 </div>
                 <span className="w-8 flex-shrink-0 text-right font-mono font-bold text-white drop-shadow-md leading-none flex items-center justify-end h-full">{stat.value}</span>
               </div>
             ))}
          </div>

          <div className="relative mt-3">
            <div className="absolute -inset-1 bg-black/40 rounded-lg blur-sm"></div>
            <p className="relative text-[11px] leading-tight italic text-gray-200 bg-black/30 p-2.5 rounded border border-white/10 backdrop-blur-[1px] shadow-sm">
              "{data.description}"
            </p>
          </div>
        </div>

        {/* Holographic Sheen Overlay */}
        <div
          className="holo-sheen absolute inset-0 z-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
            opacity: rotation.x !== 0 ? 0.6 : 0 // Show sheen only on movement
          }}
        />
        
        {/* Border Overlay */}
        <div className="absolute inset-0 border-4 border-white/10 rounded-lg z-20 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default CardDisplay;
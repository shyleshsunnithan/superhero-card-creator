import React, { useState, useCallback } from 'react';
import { Upload, Sparkles, RefreshCcw, Download, Info, Twitter, Instagram, Share2, Settings2, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
// @ts-ignore
import { toPng } from 'html-to-image';
import { Theme, CardData, GenerationState } from './types';
import { fileToGenerativePart, generateCardMetadata, transformImage } from './services/geminiService';
import CardDisplay from './components/CardDisplay';
import Loader from './components/Loader';
import { playSound } from './utils/soundEffects';

const THEMES = Object.values(Theme);

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(Theme.CYBERPUNK);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({ step: 'idle' });

  // Custom Fields State
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customStats, setCustomStats] = useState([
    { label: '', value: 75 },
    { label: '', value: 60 },
    { label: '', value: 85 }
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      playSound('upload');
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
      // Reset state if new file
      setCardData(null);
      setTransformedImage(null);
      setGenerationState({ step: 'idle' });
    }
  };

  const handleStatChange = (index: number, field: 'label' | 'value', value: string | number) => {
    const newStats = [...customStats];
    if (field === 'label') {
        newStats[index].label = value as string;
    } else {
        newStats[index].value = Number(value);
    }
    setCustomStats(newStats);
  };

  const handleGenerate = useCallback(async () => {
    if (!file || !imagePreview) return;
    playSound('processing');

    try {
      setGenerationState({ step: 'processing_text' });
      
      const base64Data = await fileToGenerativePart(file);

      // Prepare Custom Options
      const validStats = customStats.filter(s => s.label.trim() !== '');
      const customOptions = {
        name: customName.trim() || undefined,
        description: customDesc.trim() || undefined,
        stats: validStats.length > 0 ? validStats : undefined
      };

      // Step 1: Generate Metadata
      const metadata = await generateCardMetadata(base64Data, selectedTheme, customOptions);
      setCardData(metadata);

      setGenerationState({ step: 'processing_image' });

      // Step 2: Transform Image
      const transformedBase64 = await transformImage(base64Data, selectedTheme, metadata);
      setTransformedImage(`data:image/jpeg;base64,${transformedBase64}`);

      setGenerationState({ step: 'complete' });
      playSound('success');

    } catch (error: any) {
      console.error("Generation failed:", error);
      setGenerationState({ step: 'error', error: error.message || "Something went wrong." });
    }
  }, [file, imagePreview, selectedTheme, customName, customDesc, customStats]);

  const handleReset = () => {
    playSound('hover');
    setFile(null);
    setImagePreview(null);
    setCardData(null);
    setTransformedImage(null);
    setGenerationState({ step: 'idle' });
    // Keep custom settings
  };

  const handleDownload = async () => {
    playSound('shutter');
    const element = document.getElementById('card-capture-area');
    if (!element || !cardData) return;

    try {
        // Ensure fonts are fully loaded before capture to prevent layout shifts or missing text
        await document.fonts.ready;

        const dataUrl = await toPng(element, {
            cacheBust: true, // Force fresh fetch to help with CORS on some assets
            quality: 1.0,
            pixelRatio: 3, // High resolution
            filter: (node: HTMLElement) => {
                // Exclude the holographic sheen from the screenshot to avoid artifacts
                if (node.classList && node.classList.contains('holo-sheen')) {
                    return false;
                }
                return true;
            },
            style: {
                // Remove 3D perspective for a flat, clean capture
                perspective: 'none',
                transform: 'none'
            }
        });
        
        const link = document.createElement('a');
        link.download = `${cardData.name.replace(/\s+/g, '_')}_card.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error("Download failed:", err);
        alert("Could not download the card. Try screenshotting instead!");
    }
  };

  // Social Sharing Helpers
  const generateShareText = () => {
    if (!cardData) return '';
    return `I just forged a ${cardData.rarity} ${selectedTheme} character: "${cardData.name}, ${cardData.title}"! 🃏✨\n\n#CardForgeAI #Gemini #AIArt`;
  };

  const handleShareTwitter = () => {
    const text = generateShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareInstagram = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    alert("Caption copied! 📋\n\n1. Download the card\n2. Post on Instagram\n3. Paste the caption");
  };

  const handleNativeShare = async () => {
    const text = generateShareText();
    
    if (navigator.share) {
      try {
        const shareData: { title: string; text: string; url?: string } = {
          title: 'CardForge AI',
          text: text
        };

        // Only add URL if it is a valid web URL (http/https). 
        // Some browsers/environments reject blob: or about: URLs.
        if (window.location.href.startsWith('http')) {
            shareData.url = window.location.href;
        }

        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
            // Fallback to clipboard if share fails (e.g. invalid URL or permission denied)
            navigator.clipboard.writeText(text);
            alert("Share failed. Caption copied to clipboard!");
        }
      }
    } else {
       navigator.clipboard.writeText(text);
       alert("Card details copied to clipboard!");
    }
  };

  // Determine if processing to control UI visibility
  const isProcessing = generationState.step === 'processing_text' || generationState.step === 'processing_image';

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-stone-950 to-black text-white selection:bg-purple-500/30">
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-lg flex items-center justify-center transform rotate-3">
               <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">CardForge AI</h1>
          </div>
          <a href="https://ai.google.dev/gemini-api/docs" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-white transition-colors">
            Powered by Gemini
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        
        {/* Hero Section */}
        {generationState.step === 'idle' && !imagePreview && (
          <div className="text-center max-w-2xl mx-auto mb-16 animate-in slide-in-from-bottom-5 duration-700">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
              Turn Yourself Into a <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                Legendary Card
              </span>
            </h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Upload a photo, choose a style, and let our AI forge a unique trading card featuring <strong>you</strong> as the hero (or villain).
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Controls & Input */}
          <div className="space-y-8">
            
            {/* Upload Area */}
            <div className={`border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${imagePreview ? 'border-gray-700 bg-gray-900/30' : 'border-gray-700 hover:border-purple-500/50 hover:bg-gray-900/50'}`}>
              {!imagePreview ? (
                <label className="flex flex-col items-center justify-center cursor-pointer h-64">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <span className="text-lg font-medium text-gray-200">Upload your photo</span>
                  <span className="text-sm text-gray-500 mt-2">JPEG or PNG, clear face works best</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="relative group">
                   <div className="aspect-[3/4] rounded-lg overflow-hidden relative bg-black">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <button 
                        onClick={handleReset}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/80 rounded-full backdrop-blur-sm transition-colors text-white"
                        title="Remove image"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                   </div>
                   
                   {/* Controls Section: Visible when not processing */}
                   {!isProcessing && (
                     <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Select Theme</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {THEMES.map((t) => (
                            <button
                              key={t}
                              onClick={() => { playSound('theme_select'); setSelectedTheme(t); }}
                              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                selectedTheme === t 
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20 scale-105' 
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Custom Options Toggle */}
                        <div className="mt-6 border-t border-gray-800 pt-6">
                            <button 
                              onClick={() => { playSound('hover'); setShowCustom(!showCustom); }}
                              className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4" />
                                <span>Custom Details (Optional)</span>
                              </div>
                              {showCustom ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {showCustom && (
                              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Custom Name</label>
                                  <input 
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                                    placeholder="e.g. Cyber Samurai"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Custom Description</label>
                                  <textarea 
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                                    rows={2}
                                    placeholder="e.g. A rogue hacker who steals corporate secrets..."
                                    value={customDesc}
                                    onChange={(e) => setCustomDesc(e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Custom Stats (Label & Value)</label>
                                  <div className="space-y-2">
                                    {customStats.map((stat, idx) => (
                                      <div key={idx} className="flex gap-2">
                                        <input 
                                          type="text"
                                          placeholder="Stat Name"
                                          className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs flex-1 text-gray-300 focus:border-purple-500 outline-none"
                                          value={stat.label}
                                          onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                                        />
                                        <input 
                                          type="range"
                                          min="0"
                                          max="100"
                                          className="w-24 accent-purple-500"
                                          value={stat.value}
                                          onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                                        />
                                        <input 
                                            type="number" 
                                            className="w-12 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-center text-gray-300"
                                            value={stat.value}
                                            onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                        
                        <button
                          onClick={handleGenerate}
                          className="w-full mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl shadow-xl shadow-purple-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                           {generationState.step === 'complete' ? (
                             <>
                               <RefreshCcw className="w-5 h-5" />
                               Regenerate Card
                             </>
                           ) : (
                             <>
                               <Sparkles className="w-5 h-5" />
                               Forge My Card
                             </>
                           )}
                        </button>
                     </div>
                   )}
                </div>
              )}
            </div>

            {/* Status Messages */}
            {isProcessing && (
               <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 text-center">
                  <Loader status={
                    generationState.step === 'processing_text' 
                    ? "Analyzing bio-data & generating stats..." 
                    : "Synthesizing card artwork..."
                  } />
               </div>
            )}
            
            {generationState.step === 'error' && (
              <div className="bg-red-900/20 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p>{generationState.error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col items-center justify-start min-h-[500px]">
            {generationState.step === 'complete' && cardData && transformedImage ? (
               <div className="animate-in fade-in zoom-in duration-700 w-full flex flex-col items-center">
                 <div className="mb-8">
                   <CardDisplay 
                     id="card-capture-area"
                     imageSrc={transformedImage} 
                     data={cardData} 
                     theme={selectedTheme} 
                   />
                 </div>
                 
                 <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={handleDownload}
                        className="p-3 rounded-full bg-purple-600 border border-purple-500 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/30 transition-all scale-100 hover:scale-110"
                        title="Download Card"
                    >
                        <Download className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleShareTwitter}
                        className="p-3 rounded-full bg-black/40 border border-gray-700 text-gray-400 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 hover:bg-[#1DA1F2]/10 transition-all scale-100 hover:scale-110"
                        title="Share on Twitter"
                    >
                        <Twitter className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleShareInstagram}
                        className="p-3 rounded-full bg-black/40 border border-gray-700 text-gray-400 hover:text-[#E1306C] hover:border-[#E1306C]/50 hover:bg-[#E1306C]/10 transition-all scale-100 hover:scale-110"
                        title="Copy Caption for Instagram"
                    >
                        <Instagram className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleNativeShare}
                        className="p-3 rounded-full bg-black/40 border border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-400/50 hover:bg-green-400/10 transition-all scale-100 hover:scale-110"
                        title="More Share Options"
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                 </div>
                 
                 <button 
                    onClick={handleReset}
                    className="px-8 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold tracking-wide transition-colors border border-white/10 hover:border-white/30 flex items-center gap-2"
                 >
                    <RefreshCcw className="w-4 h-4" />
                    FORGE NEW LEGEND
                 </button>

                 <p className="text-xs text-gray-500 max-w-xs text-center mt-6 leading-relaxed">
                    Tip: Hover to activate the holographic foil. <br/> Screenshot to save image to your device.
                 </p>
               </div>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-3xl p-12 bg-gray-900/20">
                 <div className="w-24 h-32 border-4 border-gray-700 rounded-lg mb-4 opacity-20 transform rotate-[-6deg]"></div>
                 <p className="text-sm font-mono uppercase tracking-widest opacity-50">Card Preview Area</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  status: string;
}

const Loader: React.FC<LoaderProps> = ({ status }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin relative z-10" />
      </div>
      <p className="text-gray-300 font-mono text-sm animate-pulse">{status}</p>
    </div>
  );
};

export default Loader;

"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from 'framer-motion';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Eye, Download, Heart } from 'lucide-react';

export interface GalleryItem {
  id: string;
  type: string;
  prompt: string;
  author: string;
  likes: number;
  views: number;
  src?: string;
  placeholder?: string;
}

const STOCK_UNSPLASH = [
  'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80',
  'https://images.unsplash.com/photo-1682687981551-3058b45f512a?w=800&q=80',
  'https://images.unsplash.com/photo-1682695700569-ba78f0b45fb0?w=800&q=80',
  'https://images.unsplash.com/photo-1682685797769-481b48222adf?w=800&q=80',
  'https://images.unsplash.com/photo-1682687218147-9806132dc697?w=800&q=80',
  'https://images.unsplash.com/photo-1682695700569-ba78f0b45fb0?w=800&q=80',
  'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=800&q=80',
  'https://images.unsplash.com/photo-1682687982501-1e58f8142718?w=800&q=80',
  'https://images.unsplash.com/photo-1682687220199-d0124f48f95b?w=800&q=80',
  'https://images.unsplash.com/photo-1682685797365-41f45b562c0a?w=800&q=80',
  'https://images.unsplash.com/photo-1682687982054-c9db86a247ec?w=800&q=80',
  'https://images.unsplash.com/photo-1682687221038-404670f05144?w=800&q=80',
];

interface ImageGalleryProps {
  items?: GalleryItem[];
}

export function ImageGallery({ items }: ImageGalleryProps) {
  // Use provided items or fallback to a dummy array
  const displayItems = items || Array.from({ length: 12 }).map((_, i) => ({
    id: String(i),
    type: 'image',
    prompt: 'Sample creation...',
    author: 'user' + i,
    likes: Math.floor(Math.random() * 1000),
    views: Math.floor(Math.random() * 5000),
  }));

  // Distribute items into 3 columns for Masonry effect
  const columns: GalleryItem[][] = [[], [], []];
  displayItems.forEach((item, index) => {
    // If not provided, assign a random recognized unsplash image
    if (!item.src) {
      item.src = STOCK_UNSPLASH[index % STOCK_UNSPLASH.length];
    }
    columns[index % 3].push(item);
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start py-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((col, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-6">
            {col.map((item, index) => {
              // Alternate portrait and landscape dynamically based on position for a true masonry feel
              const isPortrait = (colIndex + index) % 2 === 0;
              const ratio = isPortrait ? 3 / 4 : 4 / 3;

              return (
                <ExploreAnimatedCard
                  key={item.id}
                  item={item}
                  ratio={ratio}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExploreAnimatedCard({ item, ratio }: { item: GalleryItem; ratio: number }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const [isLoading, setIsLoading] = React.useState(true);
  const [liked, setLiked] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState(item.src || '');

  const handleError = () => {
    if (item.placeholder) setImgSrc(item.placeholder);
  };

  return (
    <div className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-500 bg-surface border border-border hover:border-accent hover:shadow-[0_8px_32px_rgba(255,125,128,0.15)]">
      <AspectRatio
        ref={ref}
        ratio={ratio}
        className="relative size-full overflow-hidden"
      >
        <img
          alt={item.prompt}
          src={imgSrc}
          className={cn(
            'size-full object-cover opacity-0 transition-opacity duration-1000 ease-in-out',
            { 'opacity-100': isInView && !isLoading }
          )}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
          onError={handleError}
        />
        
        {/* Loading skeleton pulse */}
        {isLoading && (
          <div className="absolute inset-0 bg-surface-2 animate-pulse" />
        )}

        {/* Hover overlay stats/actions - Integrated nicely over the AspectRatio image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
          <div className="flex justify-end gap-2">
            <button className="p-2 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/30 transition-all">
              <Eye className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 rounded-full backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/30 transition-all">
              <Download className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-sm font-medium text-white line-clamp-2 mb-2 drop-shadow-md">{item.prompt}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 font-medium">@{item.author}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                  className={cn("flex items-center gap-1 transition-colors drop-shadow", {
                    "text-accent": liked,
                    "text-white/80 hover:text-white": !liked
                  })}
                >
                  <Heart className={cn("w-3.5 h-3.5", { "fill-current": liked })} />
                  <span>{item.likes + (liked ? 1 : 0)}</span>
                </button>
                <span className="flex items-center gap-1 text-white/80 drop-shadow">
                  <Eye className="w-3.5 h-3.5" />
                  {item.views.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </AspectRatio>
    </div>
  );
}

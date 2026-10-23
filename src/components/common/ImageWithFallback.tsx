import React, { useState, useEffect, useRef } from 'react';
import { FALLBACK_IMAGE_DATA_URL, resolveImageUrl } from '../../lib/assets';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = 'Nivora Resort',
  fallbackSrc = FALLBACK_IMAGE_DATA_URL,
  className = '',
  containerClassName = '',
  loading = 'lazy',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() => resolveImageUrl(src));
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Update image source if prop changes
  useEffect(() => {
    const nextSrc = resolveImageUrl(src);
    setImgSrc(nextSrc);
    setHasError(false);
    
    // If the image is already cached/complete in browser, avoid delay
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      }
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  // Check ref on mount and whenever imgSrc updates
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      } else {
        handleError();
      }
    }
  }, [imgSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      setIsLoaded(true);
    }
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Subtle skeleton shimmer during initial load */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse pointer-events-none" />
      )}
      <img
        ref={imgRef}
        src={imgSrc || fallbackSrc}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={handleError}
        onLoad={() => {
          setIsLoaded(true);
          setHasError(false);
        }}
        className={`transition-opacity duration-300 ${
          isLoaded || hasError ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};

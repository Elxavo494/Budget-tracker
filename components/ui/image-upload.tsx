'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidImageFile } from '@/lib/image-utils';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string | undefined) => void;
  onFileSelect?: (file: File | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onFileSelect,
  label = 'Image',
  placeholder = 'Upload an image (max 5MB)',
  disabled = false,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setError('');

    if (!isValidImageFile(file)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP) under 5MB.');
      return;
    }

    onFileSelect?.(file);

    // Create a temporary URL for preview
    const tempUrl = URL.createObjectURL(file);
    onChange(tempUrl);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange(undefined);
    onFileSelect?.(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      
      <Card
        className={cn(
          'relative border-2 border-dashed border-gray-300 rounded-lg transition-colors cursor-pointer',
          isDragging && 'border-blue-400 bg-blue-50',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-gray-400'
        )}
        onClick={!disabled ? handleClick : undefined}
        onDrop={!disabled ? handleDrop : undefined}
        onDragOver={!disabled ? handleDragOver : undefined}
        onDragLeave={!disabled ? handleDragLeave : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {value ? (
          <div className="relative p-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <img
                  src={value}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-2">
              Click to change image
            </p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
              {isDragging ? (
                <Upload className="w-full h-full" />
              ) : (
                <ImageIcon className="w-full h-full" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {isDragging ? 'Drop image here' : 'Upload an image'}
              </p>
              <p className="text-xs text-gray-500">
                {placeholder}
              </p>
            </div>
          </div>
        )}
      </Card>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

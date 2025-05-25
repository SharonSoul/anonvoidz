'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaUploadProps {
  onUpload: (file: File) => Promise<void>;
  type: 'image' | 'video';
  disabled?: boolean;
}

export default function MediaUpload({ onUpload, type, disabled }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size
    const maxSize = type === 'image' ? 2 * 1024 * 1024 : 10 * 1024 * 1024; // 2MB for images, 10MB for videos
    if (file.size > maxSize) {
      alert(`File size must be less than ${type === 'image' ? '2MB' : '10MB'}`);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      setIsUploading(true);
      await onUpload(file);
    } finally {
      setIsUploading(false);
      setPreview(null);
    }
  }, [onUpload, type]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      [type === 'image' ? 'image/*' : 'video/*']: [],
    },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  return (
    <div className="relative">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-4
          ${isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-500'}
          transition-colors duration-200
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          {type === 'image' ? (
            <PhotoIcon className="w-8 h-8 text-gray-400 mb-2" />
          ) : (
            <VideoCameraIcon className="w-8 h-8 text-gray-400 mb-2" />
          )}
          <p className="text-sm text-gray-400">
            {isDragActive
              ? 'Drop the file here'
              : `Drag & drop a ${type}, or click to select`}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max size: {type === 'image' ? '2MB' : '10MB'}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center"
          >
            {type === 'image' ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <video
                src={preview}
                className="max-h-full max-w-full"
                controls
              />
            )}
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isUploading && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
    </div>
  );
} 
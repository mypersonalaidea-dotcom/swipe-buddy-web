import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image, Video, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
}

interface MediaUploadProps {
  value: MediaFile[];
  onChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

export const MediaUpload = ({ 
  value = [], 
  onChange, 
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
  className 
}: MediaUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: MediaFile[] = [];
    const currentFileCount = value.length;

    Array.from(files).forEach((file, index) => {
      if (currentFileCount + newFiles.length >= maxFiles) return;

      const fileType = file.type.startsWith('image/') ? 'image' : 'video';
      const url = URL.createObjectURL(file);
      
      newFiles.push({
        id: `${Date.now()}-${index}`,
        file,
        url,
        type: fileType
      });
    });

    onChange([...value, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    const updatedFiles = value.filter(f => f.id !== id);
    // Clean up object URL to prevent memory leaks
    const fileToRemove = value.find(f => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    onChange(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50",
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            Images and videos up to {maxFiles} files
          </p>
          {value.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {value.length} / {maxFiles} files uploaded
            </p>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* File Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((mediaFile) => (
            <div key={mediaFile.id} className="relative group">
              <Card className="overflow-hidden">
                <CardContent className="p-0 relative aspect-square">
                  {mediaFile.type === 'image' ? (
                    <img
                      src={mediaFile.url}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <div className="text-center">
                        <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground truncate px-2">
                          {mediaFile.file.name}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(mediaFile.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  {/* File type indicator */}
                  <div className="absolute bottom-2 left-2">
                    {mediaFile.type === 'image' ? (
                      <FileImage className="w-4 h-4 text-white drop-shadow-lg" />
                    ) : (
                      <Video className="w-4 h-4 text-white drop-shadow-lg" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
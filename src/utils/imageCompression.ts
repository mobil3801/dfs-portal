/**
 * Image compression utility for handling large image files
 * Automatically compresses images over 1MB while maintaining quality
 */

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
  initialQuality?: number;
  alwaysKeepResolution?: boolean;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

/**
 * Check if a file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Convert file size to human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Create a canvas element for image manipulation
 */
const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
const calculateDimensions = (
originalWidth: number,
originalHeight: number,
maxWidthOrHeight?: number)
: {width: number;height: number;} => {
  if (!maxWidthOrHeight || originalWidth <= maxWidthOrHeight && originalHeight <= maxWidthOrHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;

  if (originalWidth > originalHeight) {
    return {
      width: maxWidthOrHeight,
      height: Math.round(maxWidthOrHeight / aspectRatio)
    };
  } else {
    return {
      width: Math.round(maxWidthOrHeight * aspectRatio),
      height: maxWidthOrHeight
    };
  }
};

/**
 * Load image from file
 */
const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress image using canvas
 */
const compressImageWithCanvas = (
img: HTMLImageElement,
options: CompressionOptions)
: Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const { width, height } = calculateDimensions(
      img.naturalWidth,
      img.naturalHeight,
      options.maxWidthOrHeight
    );

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Set canvas drawing properties for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob with quality
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      },
      'image/jpeg',
      options.quality || 0.8
    );
  });
};

/**
 * Iteratively compress image until target size is reached
 */
const compressToTargetSize = async (
img: HTMLImageElement,
targetSizeMB: number,
options: CompressionOptions)
: Promise<Blob> => {
  let quality = options.initialQuality || 0.8;
  let blob: Blob;
  let attempts = 0;
  const maxAttempts = 10;
  const targetSizeBytes = targetSizeMB * 1024 * 1024;

  do {
    blob = await compressImageWithCanvas(img, { ...options, quality });

    if (blob.size <= targetSizeBytes || attempts >= maxAttempts) {
      break;
    }

    // Reduce quality for next attempt
    quality = Math.max(0.1, quality - 0.1);
    attempts++;
  } while (attempts < maxAttempts);

  return blob;
};

/**
 * Get compression settings from localStorage
 */
const getCompressionSettings = (): CompressionOptions => {
  try {
    const saved = localStorage.getItem('imageCompressionSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      return {
        maxSizeMB: settings.maxSizeMB || 1,
        maxWidthOrHeight: settings.maxResolution || 1920,
        quality: settings.quality || 0.8,
        initialQuality: settings.quality || 0.8,
        useWebWorker: false,
        alwaysKeepResolution: false
      };
    }
  } catch (error) {
    console.error('Failed to load compression settings:', error);
  }

  // Return defaults if no settings found
  return {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    quality: 0.8,
    initialQuality: 0.8,
    useWebWorker: false,
    alwaysKeepResolution: false
  };
};

/**
 * Check if compression is enabled
 */
const isCompressionEnabled = (): boolean => {
  try {
    const saved = localStorage.getItem('imageCompressionSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      return settings.enabled !== false; // Default to true
    }
  } catch (error) {
    console.error('Failed to load compression settings:', error);
  }
  return true; // Default to enabled
};

/**
 * Main compression function
 */
export const compressImage = async (
file: File,
options?: Partial<CompressionOptions>)
: Promise<CompressionResult> => {
  // Get settings from localStorage or use provided options
  const savedSettings = getCompressionSettings();
  const finalOptions = { ...savedSettings, ...options };

  const originalSize = file.size;
  const targetSizeMB = finalOptions.maxSizeMB;
  const targetSizeBytes = targetSizeMB * 1024 * 1024;

  // Check if compression is enabled
  if (!isCompressionEnabled()) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false
    };
  }

  // Check if file is an image
  if (!isImageFile(file)) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false
    };
  }

  // Check if compression is needed
  const autoCompress = (() => {
    try {
      const saved = localStorage.getItem('imageCompressionSettings');
      return saved ? JSON.parse(saved).autoCompress : false;
    } catch {
      return false;
    }
  })();

  if (!autoCompress && originalSize <= targetSizeBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false
    };
  }

  try {
    // Load the image
    const img = await loadImage(file);

    // Compress the image
    const compressedBlob = await compressToTargetSize(img, targetSizeMB, finalOptions);

    // Create new file from compressed blob
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^/.]+$/, '.jpg'), // Change extension to jpg
      {
        type: 'image/jpeg',
        lastModified: Date.now()
      }
    );

    const compressedSize = compressedFile.size;
    const compressionRatio = originalSize / compressedSize;

    // Clean up object URL
    URL.revokeObjectURL(img.src);

    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      wasCompressed: true
    };
  } catch (error) {
    console.error('Image compression failed:', error);

    // Return original file if compression fails
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false
    };
  }
};

/**
 * Batch compress multiple images
 */
export const compressImages = async (
files: File[],
options: CompressionOptions = { maxSizeMB: 1 })
: Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];

  for (const file of files) {
    const result = await compressImage(file, options);
    results.push(result);
  }

  return results;
};

/**
 * Get compression statistics
 */
export const getCompressionStats = (results: CompressionResult[]) => {
  const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, result) => sum + result.compressedSize, 0);
  const compressedCount = results.filter((result) => result.wasCompressed).length;

  return {
    totalOriginalSize,
    totalCompressedSize,
    totalSavings: totalOriginalSize - totalCompressedSize,
    averageCompressionRatio: totalOriginalSize / totalCompressedSize,
    compressedCount,
    totalCount: results.length
  };
};
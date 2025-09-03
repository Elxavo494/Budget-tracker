import { supabase } from './supabase';

/**
 * Resizes an image to 124x124 pixels while maintaining aspect ratio
 * @param file - The image file to resize
 * @returns Promise<Blob> - The resized image as a Blob
 */
export const resizeImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size to 124x124
      canvas.width = 124;
      canvas.height = 124;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Calculate dimensions to maintain aspect ratio and center the image
      const aspectRatio = img.width / img.height;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      if (aspectRatio > 1) {
        // Image is wider than tall - crop width
        sourceWidth = img.height;
        sourceX = (img.width - sourceWidth) / 2;
      } else if (aspectRatio < 1) {
        // Image is taller than wide - crop height
        sourceHeight = img.width;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 124, 124);

      // Draw the cropped and resized image
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
        0, 0, 124, 124 // Destination rectangle
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/jpeg',
        0.8 // Quality setting
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Uploads an icon to Supabase storage with resizing
 * @param file - The image file to upload
 * @param userId - The user ID for the file naming
 * @param transactionType - Type of transaction (expense or income)
 * @returns Promise<string> - The public URL of the uploaded icon
 */
export const uploadTransactionIcon = async (
  file: File,
  userId: string,
  transactionType: 'expense' | 'income'
): Promise<string> => {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Please check your environment variables.');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    // Validate file size (max 5MB before resizing)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Please choose an image smaller than 5MB.');
    }

    // Resize the image
    const resizedBlob = await resizeImage(file);

    // Generate unique filename
    const fileExtension = 'jpg'; // Always save as JPEG after resizing
    const timestamp = Date.now();
    const fileName = `${userId}-${transactionType}-icon-${timestamp}.${fileExtension}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('transaction-images')
      .upload(fileName, resizedBlob, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('transaction-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Deletes an icon from Supabase storage
 * @param iconUrl - The public URL of the icon to delete
 * @returns Promise<void>
 */
export const deleteTransactionIcon = async (iconUrl: string): Promise<void> => {
  try {
    // Check if Supabase is initialized
    if (!supabase) {
      console.error('Supabase client is not initialized. Cannot delete icon.');
      return; // Don't throw error for deletion failures to avoid blocking other operations
    }

    // Extract the file path from the URL
    const urlParts = iconUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from('transaction-images')
      .remove([fileName]);

    if (error) {
          console.error('Error deleting icon:', error);
    // Don't throw error for deletion failures to avoid blocking other operations
    }
  } catch (error) {
    console.error('Error deleting icon:', error);
    // Don't throw error for deletion failures to avoid blocking other operations
  }
};

/**
 * Validates if a file is a valid image
 * @param file - The file to validate
 * @returns boolean - True if the file is a valid image
 */
export const isValidImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  return allowedTypes.includes(file.type) && file.size <= maxSize;
};

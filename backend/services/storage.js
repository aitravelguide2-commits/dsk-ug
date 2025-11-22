import { getSupabase } from './supabase.js';
import { randomBytes } from 'crypto';
import path from 'path';

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File mimetype
 * @returns {Promise<{url: string, filename: string}>}
 */
export async function uploadToSupabase(fileBuffer, originalName, mimetype) {
  const supabase = getSupabase();
  
  // Generate unique filename
  const ext = path.extname(originalName);
  const filename = `${randomBytes(8).toString('hex')}${ext}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('accommodations')
    .upload(filename, fileBuffer, {
      contentType: mimetype,
      upsert: false
    });
  
  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('accommodations')
    .getPublicUrl(filename);
  
  return {
    url: publicUrl,
    filename: filename
  };
}

/**
 * Delete a file from Supabase Storage
 * @param {string} filename - Filename to delete
 * @returns {Promise<void>}
 */
export async function deleteFromSupabase(filename) {
  const supabase = getSupabase();
  
  const { error } = await supabase.storage
    .from('accommodations')
    .remove([filename]);
  
  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Extract filename from Supabase URL
 * @param {string} url - Supabase Storage URL
 * @returns {string|null}
 */
export function extractFilenameFromUrl(url) {
  if (!url) return null;
  
  // Match: https://PROJECT.supabase.co/storage/v1/object/public/accommodations/FILENAME
  const match = url.match(/\/accommodations\/([^/?]+)/);
  return match ? match[1] : null;
}

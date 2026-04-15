const CLOUD_NAME = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
const UPLOAD_PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export async function uploadProfileImage(file) {
  if (!file) {
    throw new Error('Please choose an image to upload.');
  }
  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('Please choose a JPG, PNG, WEBP, or another image file.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Please choose an image smaller than 5MB.');
  }
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'sigauth/profile-images');

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.secure_url) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed. Please try again.');
  }

  return payload.secure_url;
}

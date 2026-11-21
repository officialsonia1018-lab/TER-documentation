// Converts an uploaded image file into a compressed data URL. The server
// stores the bytes in the module_images table when the card is saved.

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 800;
const JPEG_QUALITY = 0.8;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('This image could not be read. Try a JPG or PNG file.'));
    };
    image.src = objectUrl;
  });
}

export async function imageFileToDataUrl(file) {
  if (!file) {
    throw new Error('Choose an image file first.');
  }
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Only image files can be uploaded.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Image is larger than 10 MB. Choose a smaller file.');
  }

  const image = await loadImageElement(file);
  const scale = Math.min(1, MAX_WIDTH / image.width, MAX_HEIGHT / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

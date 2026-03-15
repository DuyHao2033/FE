export const getFullUrl = (src?: string) => {
  if (!src) return undefined;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
    return src;
  }
  
  // If the path contains /uploads/, extract it (handles absolute backend paths)
  let relativePath = src;
  const uploadIndex = src.indexOf('/uploads/');
  if (uploadIndex !== -1) {
    relativePath = src.substring(uploadIndex);
  }
  
  if (relativePath.startsWith('/')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || '';
    return `${baseUrl}${relativePath}`;
  }
  
  return relativePath;
};

export const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const isBase64Image = mimeType.startsWith('image/') && content.startsWith('data:');
  
  const blob = isBase64Image 
    ? base64ToBlob(content, mimeType)
    : new Blob([content], { type: mimeType });

  const url = URL.createObjectURL(blob);
  // FIX: Cast window to any to access document property
  const a = (window as any).document.createElement('a');
  a.href = url;
  a.download = fileName;
  (window as any).document.body.appendChild(a);
  a.click();
  (window as any).document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
export type Attachment = {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  size: number;
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const fileToAttachment = (file: File): Promise<Attachment> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: uid(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: String(reader.result),
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
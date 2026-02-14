import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export async function uploadImageAndGetURL(
  storage: any,
  userId: string,
  file: File,
  folder: string = "uploads"
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const fileRef = ref(storage, `${folder}/${userId}/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        snapshot => {
          // يمكن إضافة progress هنا إذا أحببت
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        error => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

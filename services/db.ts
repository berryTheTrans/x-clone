import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Post, UserProfile } from '../types';

interface BlogDB extends DBSchema {
  posts: {
    key: string;
    value: Post;
    indexes: { 'by-date': number };
  };
  profile: {
    key: string;
    value: UserProfile;
  };
}

let dbPromise: Promise<IDBPDatabase<BlogDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<BlogDB>('local-x-blog', 1, {
      upgrade(db) {
        const postStore = db.createObjectStore('posts', { keyPath: 'id' });
        postStore.createIndex('by-date', 'timestamp');
        db.createObjectStore('profile', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
};

export const savePost = async (post: Post) => {
  const db = await initDB();
  return db.put('posts', post);
};

export const getAllPosts = async () => {
  const db = await initDB();
  return db.getAllFromIndex('posts', 'by-date');
};

export const saveProfile = async (profile: UserProfile) => {
  const db = await initDB();
  return db.put('profile', profile);
};

export const getProfile = async (id: string) => {
  const db = await initDB();
  return db.get('profile', id);
};

// Helper to convert File to Base64 for simple P2P transfer
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

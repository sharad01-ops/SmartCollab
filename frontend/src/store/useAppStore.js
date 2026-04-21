import { create } from 'zustand'

const useAppStore = create((set) => ({
  language: localStorage.getItem("lang") || "en",
  setLanguage: (lang) => {
    localStorage.setItem("lang", lang);
    set({ language: lang });
  },
}));

export default useAppStore;

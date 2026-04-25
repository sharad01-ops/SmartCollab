import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  language: localStorage.getItem("lang") || "en",
  activeChannelId: null,
  messages: [],
  translationCache: {}, 

  setActiveChannel: (id) => set({ activeChannelId: id, messages: [] }),

  setMessages: (newMessages) => set({ 
    messages: newMessages.map(m => ({
      id: m.id || `${m.sent_at}-${m.sender_id}`,
      text: m.message,
      translatedText: null,
      language: get().language,
      ...m
    }))
  }),

  setLanguage: (lang) => {
    localStorage.setItem("lang", lang);
    set(state => ({
      language: lang,
      translationCache: {},
      messages: state.messages.map(m => ({
        ...m,
        translatedText: null
      }))
    }));
  },

  updateMessageTranslation: (id, translatedText) => {
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === id ? { ...msg, translatedText } : msg
      )
    }));
  },

  addToCache: (original, translated, lang) => {
    const key = `${original}::${lang}`;
    set((state) => ({
      translationCache: { ...state.translationCache, [key]: translated }
    }));
  }
}));

export default useAppStore;

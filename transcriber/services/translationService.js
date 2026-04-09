const translate = require('google-translate-api-x');

class TranslationService {
  constructor() {
    this.supportedLanguages = {
      'en': { name: 'English', nativeName: 'English', flag: '🇺🇸' },
      'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
      'bn': { name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
      'te': { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
      'mr': { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
      'ta': { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
      'ur': { name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳' },
      'gu': { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
      'kn': { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
      'ml': { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
      'pa': { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
      'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
      'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
      'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
      'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
      'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
      'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
      'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
      'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
      'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
      'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' }
    };

    this.indianLanguageIndicators = {
      'hi': ['ह', 'ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः'],
      'bn': ['অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'ঋ', 'এ', 'ঐ', 'ও', 'ঔ'],
      'te': ['అ', 'ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ', 'ఋ', 'ఎ', 'ఏ', 'ఐ', 'ఒ', 'ఓ', 'ఔ'],
      'ta': ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'],
      'mr': ['ह', 'ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः'],
      'gu': ['અ', 'આ', 'ઇ', 'ઈ', 'ઉ', 'ઊ', 'ઋ', 'એ', 'ઐ', 'ઓ', 'ઔ'],
      'kn': ['ಅ', 'ಆ', 'ಇ', 'ಈ', 'ಉ', 'ಊ', 'ಋ', 'ಎ', 'ಏ', 'ಐ', 'ಒ', 'ಓ', 'ಔ'],
      'ml': ['അ', 'ആ', 'ഇ', 'ഈ', 'ഉ', 'ഊ', 'ഋ', 'എ', 'ഏ', 'ഐ', 'ഒ', 'ഓ', 'ഔ'],
      'pa': ['ਅ', 'ਆ', 'ਇ', 'ਈ', 'ਉ', 'ਊ', 'ਏ', 'ਐ', 'ਓ', 'ਔ'],
      'ur': ['ا', 'ب', 'پ', 'ت', 'ٹ', 'ث', 'ج', 'چ', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'ژ', 'س']
    };
  }

  async detectLanguage(text) {
    try {
      const detectedByChars = this.detectIndianLanguageByCharacters(text);
      if (detectedByChars) {
        return detectedByChars;
      }

      const result = await translate(text, { to: 'en' });
      return result.from.language.iso || 'en';
    } catch (error) {
      console.error('Language detection failed:', error.message);
      return 'en';
    }
  }

  detectIndianLanguageByCharacters(text) {
    if (!text || text.length < 3) return null;

    const cleanText = text.replace(/[^\w\s]/gi, '');
    
    for (const [langCode, indicators] of Object.entries(this.indianLanguageIndicators)) {
      for (const char of indicators) {
        if (cleanText.includes(char)) {
          return langCode;
        }
      }
    }
    return null;
  }

  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      if (!text || !targetLanguage) {
        throw new Error('Text and target language are required');
      }

      if (targetLanguage === sourceLanguage) {
        return text;
      }

      if (targetLanguage === 'en' && sourceLanguage === 'en') {
        return text;
      }

      console.log(`🔄 Translating: "${text}" from ${sourceLanguage} to ${targetLanguage}`);

      const result = await translate(text, { 
        to: targetLanguage,
        from: sourceLanguage === 'auto' ? 'auto' : sourceLanguage
      });

      console.log(`✅ Translated to: "${result.text}"`);
      return result.text;
    } catch (error) {
      console.error(`❌ Translation failed (${sourceLanguage} -> ${targetLanguage}):`, error.message);
      return text;
    }
  }

  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, data]) => ({
      code,
      name: data.name,
      nativeName: data.nativeName,
      flag: data.flag
    }));
  }

  async autoTranslateMessage(message, userPreferredLanguage = 'en') {
    try {
      const detectedLanguage = await this.detectLanguage(message);
      
      if (detectedLanguage === userPreferredLanguage) {
        return {
          original: message,
          translated: message,
          detectedLanguage,
          targetLanguage: userPreferredLanguage,
          wasTranslated: false
        };
      }

      const translatedText = await this.translateText(
        message, 
        userPreferredLanguage, 
        detectedLanguage
      );

      return {
        original: message,
        translated: translatedText,
        detectedLanguage,
        targetLanguage: userPreferredLanguage,
        wasTranslated: true
      };
    } catch (error) {
      console.error('Auto-translate failed:', error);
      return {
        original: message,
        translated: message,
        detectedLanguage: 'en',
        targetLanguage: userPreferredLanguage,
        wasTranslated: false,
        error: error.message
      };
    }
  }
}

module.exports = new TranslationService();
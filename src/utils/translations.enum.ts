enum TRANSLATIONS_EN {
  INTERNAL_ERROR = "Internal_Error"
}

enum TRANSLATIONS_RU {
  INTERNAL_ERROR = "Internal_Error"
}

enum TRANSLATIONS_UA {
  INTERNAL_ERROR = "Internal_Error"
}

export const TRANSLATION = (lang) => {
  if (lang === "en") {
    return TRANSLATIONS_EN;
  } else if (lang === "ru") {
    return TRANSLATIONS_RU;
  } else if (lang === "ua") {
    return TRANSLATIONS_UA;
  }
};

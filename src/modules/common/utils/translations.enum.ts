enum TRANSLATIONS_EN {
  INTERNAL_ERROR = "Internal_Error"
}

enum TRANSLATIONS_UA {
  INTERNAL_ERROR = "Internal_Error"
}

export const TRANSLATION = (lang: "en" | "ua") => {
  if (lang === "en") {
    return TRANSLATIONS_EN;
  } else if (lang === "ua") {
    return TRANSLATIONS_UA;
  }
};

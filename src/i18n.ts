import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

// Configuração básica para SSR/CSR
// O next-i18next cuida do resto, mas isso permite usar hooks no client

// funcao auxiliar para identificar o idioma do navegador e retornar se pt, en ou es
const getBrowserLanguage = (language) => {
  language = language.toLowerCase();
  if (language.startsWith("pt")) return "pt";
  if (language.startsWith("en")) return "en";
  if (language.startsWith("es")) return "es";
  return "pt"; // Padrão
}

// Adiciona logs para mostrar a linguagem detectada e a selecionada
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(
    {
      fallbackLng: "pt",
      supportedLngs: ["pt", "en", "es"],
      debug: false,
      ns: ["common"],
      defaultNS: "common",
      interpolation: {
        escapeValue: false,
      },
      backend: {
        loadPath: "/locales/{{lng}}/{{ns}}.json",
      },
      detection: {
        order: [
          "navigator",
          "path",
          "querystring",
          "cookie",
          "localStorage",
          "htmlTag"
        ],
        lookupFromPathIndex: 0, // para /en/login
        // caches: ['localStorage', 'cookie'], // Não cacheia, sempre detecta
      },
      initImmediate: true,
    },
    (err, t) => {
      if (err) {
        console.error("Erro ao inicializar i18n:", err);
      } else {
        // Linguagem detectada
        const detected = i18n.services?.languageDetector?.detect?.();
        // detected pode ser um array ou string, dependendo do detector
        // Se for um array, pega o primeiro valor e verifica se contains a linguagem diferente da atual e ao setar coloque pt, en ou es
        // Se for string, verifica se é diferente da atual e ao setar coloque pt, en ou es
        if (Array.isArray(detected)) {
          const firstDetected = detected[0];
          if (firstDetected && firstDetected.includes(i18n.language) === false) {
            i18n.changeLanguage(getBrowserLanguage(firstDetected));
          }
        } else if (typeof detected === "string" && detected !== i18n.language) {
          i18n.changeLanguage(getBrowserLanguage(detected));
        }
        console.log("[i18n] Linguagem detectada:", detected);
        console.log("[i18n] Linguagem selecionada:", i18n.language);
      }
    }
  );

i18n.on("languageChanged", (lng) => {
  console.log("[i18n] Linguagem alterada para:", lng);
});
export default i18n;

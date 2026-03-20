"use client";
import { useEffect } from "react";

export default function GoogleTranslate() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.head.appendChild(script);

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement({
        pageLanguage: "nl",
        autoDisplay: true,
      }, "google_translate_element");
    };
  }, []);

  return <div id="google_translate_element" style={{ position: "fixed", bottom: 16, right: 16, zIndex: 9999 }} />;
}
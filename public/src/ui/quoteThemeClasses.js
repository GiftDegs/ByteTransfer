// public/src/ui/quoteThemeClasses.js

import { getQuoteTheme } from "../state/quoteTheme.js";

export function getQuoteThemeClasses() {
  const theme = getQuoteTheme();
  const isLight = theme === "light";

  if (isLight) {
    return {
      theme,
      isLight,

      shell:
        "border-[#8fdde8]/35 bg-[radial-gradient(circle_at_top,#dceeff_0%,#f7fbff_34%,#eaf6fa_100%)] text-[#0b2f57]",
      topbar:
        "border-[#a7dceb]/45 bg-white/72 shadow-[0_16px_50px_rgba(18,88,140,0.12)]",
      topbarButton:
        "border-[#b5ddec] bg-white/82 text-[#1a456e] hover:bg-[#eef8ff]",
      themeButton:
        "border-[#0b2f57] bg-[#0b2f57] text-white shadow-[0_10px_30px_rgba(11,47,87,0.25)] hover:bg-[#124273]",

      glowA: "bg-[#55b9ff]/22",
      glowB: "bg-[#2ed7c8]/14",
      gridOpacity: "opacity-20",

      panel:
        "border-[#9fdaea]/40 bg-white/74 text-[#29527a] shadow-[0_20px_55px_rgba(23,95,140,0.14)]",
      panelSoft:
        "border-[#b7dfeb]/40 bg-white/62 text-[#3d6386]",
      card:
        "border-[#9fdaea]/42 bg-[linear-gradient(145deg,rgba(255,255,255,0.93),rgba(231,247,250,0.82))] text-[#0b2f57] shadow-[0_18px_48px_rgba(18,96,139,0.15)]",
      cardHover:
        "hover:bg-[linear-gradient(145deg,rgba(255,255,255,1),rgba(221,245,249,0.9))] hover:border-[#2fd3c6]/70",
      resultPanel:
        "border-[#7edce3]/45 bg-[linear-gradient(160deg,rgba(255,255,255,0.95),rgba(230,247,250,0.84))] text-[#0b2f57] shadow-[0_24px_70px_rgba(15,96,136,0.17)]",

      input: "border-[#b7deeb] bg-white/84 text-[#0b2f57]",
      inputText: "text-[#0b2f57] placeholder:text-[#6e86a0]",

      primaryText: "text-[#0b2f57]",
      secondaryText: "text-[#315b82]",
      mutedText: "text-[#5d7792]",
      labelText: "text-[#163d63]",
      accentText: "text-[#18cfc4]",

      heroTitle: "text-[#0b2f57]",
      heroDescription: "text-[#315b82]",
      sectionEyebrow: "text-[#18cfc4]",
      cardTitle: "text-[#0b2f57]",
      cardDescription: "text-[#315b82]",
      valueLabel: "text-[#536f8b]",
      valueNumber: "text-[#0b2f57]",
      valueUnit: "text-[#315b82]",
      metaText: "text-[#315b82]",
      mutedMetaText: "text-[#5d7792]",
      badgeText: "text-[#0b877f]",
      primaryButtonText: "text-[#061226]",
      secondaryButtonText: "text-[#1b4368]",

      chip: "bg-[#dffbf7] text-[#0b877f]",
      badge: "bg-[#dffbf7] text-[#0b877f]",
      iconBox:
        "border-[#bce6ef] bg-white/88 text-[#1ad0c2] shadow-[0_12px_28px_rgba(16,115,150,0.13)]",
      arrowBox:
        "bg-[#e4fbf8] text-[#0a8f93] group-hover:bg-[#19d6c7] group-hover:text-[#0b2f57]",

      metaBox: "border-[#b9dfe9] bg-white/78 text-[#315b82]",
      resultLine: "border-[#c7e8ef] bg-white/82",
      highlightedResultLine: "border-[#29d6c8]/55 bg-[#dcfbf6]",

      gemButton:
        "bg-[linear-gradient(135deg,#22d3c5,#2f8cff)] text-[#061226] shadow-[0_18px_42px_rgba(35,164,203,0.22)] hover:brightness-105",
      secondaryButton:
        "border-[#b7ddeb] bg-white/80 text-[#1b4368] hover:bg-[#eef8ff]",
    };
  }

  return {
    theme,
    isLight,

    shell:
      "border-[#173552] bg-[radial-gradient(circle_at_top,#0c2a4a_0%,#07111f_42%,#03101c_100%)] text-[#b8fff1]",
    topbar:
      "border-[#1d7e83]/25 bg-[#07111f]/84 shadow-[0_18px_50px_rgba(0,0,0,0.3)]",
    topbarButton:
      "border-[#165f67]/25 bg-white/[0.06] text-[#9beee4] hover:bg-white/[0.1]",
    themeButton:
      "border-[#1fd5c5]/30 bg-[linear-gradient(135deg,rgba(27,208,191,0.14),rgba(44,136,255,0.14))] text-[#b8fff1] hover:bg-[linear-gradient(135deg,rgba(27,208,191,0.22),rgba(44,136,255,0.2))]",

    glowA: "bg-[#1a72ff]/20",
    glowB: "bg-[#1fd5c5]/16",
    gridOpacity: "opacity-20",

    panel:
      "border-[#1bd0c4]/16 bg-white/[0.05] text-[#9eece3] shadow-xl",
    panelSoft: "border-[#1bd0c4]/14 bg-white/[0.045] text-[#8adfd7]",
    card:
      "border-[#1bd0c4]/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.035))] text-[#b8fff1] shadow-xl",
    cardHover: "hover:bg-white/[0.10] hover:border-[#22e2cf]/55",
    resultPanel:
      "border-[#1bd0c4]/25 bg-gradient-to-b from-white/[0.10] to-white/[0.04] text-[#a9f5ea] shadow-2xl",

    input: "border-[#1bd0c4]/18 bg-black/25 text-[#b8fff1]",
    inputText: "text-[#b8fff1] placeholder:text-[#72a9a8]",

    primaryText: "text-[#b8fff1]",
    secondaryText: "text-[#90e6dc]",
    mutedText: "text-[#74c9c0]",
    labelText: "text-[#a6f1e8]",
    accentText: "text-[#22d8cb]",

    heroTitle: "text-[#b8fff1]",
    heroDescription: "text-[#90e6dc]",
    sectionEyebrow: "text-[#22d8cb]",
    cardTitle: "text-[#b8fff1]",
    cardDescription: "text-[#90e6dc]",
    valueLabel: "text-[#74c9c0]",
    valueNumber: "text-[#b8fff1]",
    valueUnit: "text-[#90e6dc]",
    metaText: "text-[#90e6dc]",
    mutedMetaText: "text-[#74c9c0]",
    badgeText: "text-[#91efe4]",
    primaryButtonText: "text-[#07111f]",
    secondaryButtonText: "text-[#b8fff1]",

    chip: "bg-[#10353b] text-[#91efe4]",
    badge: "bg-[#10353b] text-[#91efe4]",
    iconBox:
      "border-[#1bd0c4]/20 bg-white/[0.08] text-[#24ddd0] shadow-lg",
    arrowBox:
      "bg-white/[0.08] text-[#b8fff1] group-hover:bg-[#1dd8ca] group-hover:text-[#07111f]",

    metaBox: "border-[#1bd0c4]/16 bg-black/20 text-[#90e6dc]",
    resultLine: "border-[#1bd0c4]/16 bg-black/20",
    highlightedResultLine: "border-[#1bd0c4]/30 bg-[#0f3337]",

    gemButton:
      "bg-[linear-gradient(135deg,#21d4c5,#2f8cff)] text-[#07111f] shadow-xl hover:brightness-110",
    secondaryButton:
      "border-[#1bd0c4]/18 bg-white/[0.08] text-[#b8fff1] hover:bg-white/[0.12]",
  };
}
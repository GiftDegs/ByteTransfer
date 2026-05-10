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
      iconTopbarButton:
        "border-[#bfd7e9] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(234,243,250,0.94))] text-[#36506e] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_18px_rgba(55,92,130,0.16)] hover:text-[#183756] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_10px_22px_rgba(55,92,130,0.2)]",
      themeSwitch:
        "border-[#bfd7e9] bg-[linear-gradient(180deg,rgba(247,250,253,0.98),rgba(227,236,245,0.95))] text-[#5f6f84] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_18px_rgba(55,92,130,0.14)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_10px_22px_rgba(55,92,130,0.18)]",
      themeSwitchThumb:
        "bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(237,242,248,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_18px_rgba(55,92,130,0.18)]",
      themeSwitchLabel:
        "text-[#8a96a8]",
      themeSwitchIcon:
        "bg-transparent text-[#8a96a8]",
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
      "border-[#1d2a3d]/55 bg-[radial-gradient(circle_at_top,#132033_0%,#0c1422_42%,#08111d_100%)] text-[#ced9e8]",
    topbar:
      "border-[#2a3b52]/55 bg-[#0f1828]/86 shadow-[0_18px_45px_rgba(0,0,0,0.22)]",
    iconTopbarButton:
      "border-[#334760] bg-[linear-gradient(180deg,rgba(37,48,68,0.95),rgba(22,31,46,0.95))] text-[#c7d4e4] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_20px_rgba(0,0,0,0.28)] hover:text-[#eef4fb] hover:bg-[linear-gradient(180deg,rgba(44,58,81,0.98),rgba(24,35,51,0.98))]",
    themeSwitch:
      "border border-cyan-400/15 bg-slate-950/55 text-slate-300 shadow-[0_8px_24px_rgba(0,0,0,0.28)] hover:border-cyan-300/25 hover:bg-slate-950/70",
    themeSwitchThumb:
      "bg-[linear-gradient(180deg,rgba(127,132,162,0.98),rgba(94,101,132,0.98))] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_10px_18px_rgba(0,0,0,0.35)]",
    themeSwitchLabel:
      "text-[#8e9cb0]",
    themeSwitchIcon:
      "bg-transparent text-[#eef3fb]",
    topbarButton:
      "border-[#2a3b52]/70 bg-[#142033]/72 text-[#a8b7c8] hover:bg-[#1a2a40] hover:text-[#d7e2ef]",
    themeButton:
      "border-[#2a3b52]/70 bg-[#142033]/82 text-[#a8b7c8] shadow-[0_10px_26px_rgba(0,0,0,0.18)] hover:border-[#28d7c5]/32 hover:bg-[#182638] hover:text-[#d7e2ef]",

    glowA: "bg-[#59b8e8]/10",
    glowB: "bg-[#28d7c5]/8",
    gridOpacity: "opacity-[0.10]",

    panel:
      "border-[#2a3b52]/45 bg-[#101a2b]/72 text-[#a8b7c8] shadow-[0_18px_46px_rgba(0,0,0,0.20)]",
    panelSoft:
      "border-[#2a3b52]/38 bg-[#0f1828]/68 text-[#98aabe]",
    card:
      "border-[#2a3b52]/52 bg-[linear-gradient(145deg,rgba(24,35,53,0.92),rgba(18,29,46,0.78))] text-[#ced9e8] shadow-[0_16px_38px_rgba(0,0,0,0.18)]",
    cardHover:
      "hover:bg-[linear-gradient(145deg,rgba(28,42,62,0.96),rgba(20,32,51,0.86))] hover:border-[#59b8e8]/34",
    resultPanel:
      "border-[#2a3b52]/58 bg-[linear-gradient(160deg,rgba(27,43,66,0.92),rgba(16,26,43,0.82))] text-[#d5dfec] shadow-[0_22px_58px_rgba(0,0,0,0.22)]",

    input: "border-[#2a3b52]/65 bg-[#0c1422]/72 text-[#d5dfec]",
    inputText: "text-[#d5dfec] placeholder:text-[#6f839b]",

    primaryText: "text-[#d5dfec]",
    secondaryText: "text-[#a8b7c8]",
    mutedText: "text-[#7f91a6]",
    labelText: "text-[#bdcad9]",
    accentText: "text-[#57cfc3]",

    heroTitle: "text-[#d5dfec]",
    heroDescription: "text-[#a8b7c8]",
    sectionEyebrow: "text-[#57cfc3]",
    cardTitle: "text-[#d5dfec]",
    cardDescription: "text-[#a8b7c8]",
    valueLabel: "text-[#7f91a6]",
    valueNumber: "text-[#dbe4ee]",
    valueUnit: "text-[#a8b7c8]",
    metaText: "text-[#a8b7c8]",
    mutedMetaText: "text-[#7f91a6]",
    badgeText: "text-[#7fded4]",
    primaryButtonText: "text-[#08111d]",
    secondaryButtonText: "text-[#c7d4e4]",

    chip: "bg-[#162b36] text-[#7fded4]",
    badge: "bg-[#162b36] text-[#7fded4]",
    iconBox:
      "border-[#2a3b52]/62 bg-[#182335]/82 text-[#57cfc3] shadow-[0_12px_26px_rgba(0,0,0,0.16)]",
    arrowBox:
      "bg-[#182335]/88 text-[#c7d4e4] group-hover:bg-[#25455a] group-hover:text-[#dbe4ee]",

    metaBox: "border-[#2a3b52]/48 bg-[#0c1422]/52 text-[#a8b7c8]",
    resultLine: "border-[#2a3b52]/46 bg-[#0c1422]/48",
    highlightedResultLine: "border-[#57cfc3]/26 bg-[#12323a]/60",

    gemButton:
      "bg-[linear-gradient(135deg,#28d7c5,#4aa9da)] text-[#06111d] shadow-[0_16px_36px_rgba(24,120,150,0.18)] hover:brightness-105",
    secondaryButton:
      "border-[#2a3b52]/62 bg-[#142033]/78 text-[#c7d4e4] hover:bg-[#1a2a40]",
  };
}
export type LocaleCode = "fa" | "en" | "ar";

export type IconName =
  | "water"
  | "soil"
  | "leaf"
  | "sun"
  | "satellite"
  | "map"
  | "chart"
  | "shield"
  | "store"
  | "tent"
  | "users"
  | "village"
  | "compass"
  | "brain"
  | "globe"
  | "sprout";

export type Block =
  | { kind: "paragraph"; title: string; body: string }
  | { kind: "features"; title: string; body?: string; items: Array<{ title: string; body: string; icon?: IconName }> }
  | { kind: "bullets"; title: string; items: string[] }
  | { kind: "metrics"; items: Array<{ value: string; label: string }> }
  | { kind: "cta"; title: string; body: string; action: string; to: string };

export type PageKey =
  | "home"
  | "ecosystem"
  | "hydroma"
  | "landscape"
  | "marketplace"
  | "tourism"
  | "mrv"
  | "knowledge"
  | "about"
  | "contact"
  | "partner"
  | "login";

export type PageContent = {
  eyebrow: string;
  title: string;
  description: string;
  lead: string;
  blocks: Block[];
};

export type SiteContent = {
  locale: LocaleCode;
  dir: "rtl" | "ltr";
  ui: {
    brand: string;
    tagline: string;
    skip: string;
    menu: string;
    close: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    system: string;
    login: string;
    contactCta: string;
    breadcrumb: string;
    home: string;
    footerRights: string;
    footerNote: string;
    statusTitle: string;
    statusBody: string;
    formName: string;
    formEmail: string;
    formOrg: string;
    formMessage: string;
    formSubmit: string;
    formUnavailableTitle: string;
    formUnavailableBody: string;
    formValidation: string;
    navGroups: { ecosystem: string; science: string; community: string; contact: string };
    notFoundTitle: string;
    notFoundBody: string;
    backHome: string;
  };
  nav: Array<{ to: string; label: string }>;
  pages: Record<PageKey, PageContent>;
};
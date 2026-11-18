export interface AboutDiscipline {
  id: string;
  name: string;
  description: string;
  display_order: number;
  is_published: boolean;
}

export interface AboutDraft {
  name: string;
  slogan: string;
  about_intro: string;
  disciplines_intro: string;
  mission: string;
  vision: string;
  history: string;
  founder_name: string;
  founder_title: string;
  email: string;
  phone: string;
  address: string;
  contact_intro: string;
  disciplines: AboutDiscipline[];
}

export interface AboutResponse {
  published: AboutDraft;
  draft: AboutDraft;
  has_draft: boolean;
  published_banner_url: string;
  draft_banner_url: string;
  updated_at: string;
}

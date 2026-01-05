export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
}

export interface AgentFeature {
  id: string;
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
}

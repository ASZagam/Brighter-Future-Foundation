import type { AboutDraft } from './types';

export const DEFAULT_ABOUT: AboutDraft = {
  name: 'Brighter Future Foundation',
  slogan: 'Toward A Brighter Future.',
  about_intro: `Brighter Future Foundation (BFF) is a non-governmental organization committed to creating opportunities, improving lives, and contributing to a brighter and more sustainable future for individuals and communities.

Guided by our motto, "Toward A Brighter Future," we believe that every individual deserves the opportunity to live a dignified life, access essential opportunities, develop their potential, and contribute meaningfully to society.

Through community-focused programmes, partnerships, advocacy, and sustainable development initiatives, we work towards addressing challenges affecting vulnerable populations and supporting communities to build a better future.

Our approach is rooted in compassion, inclusion, accountability, and the belief that lasting development happens when communities are empowered to participate in their own progress.`,
  mission: `To empower individuals and communities through inclusive development initiatives, education, healthcare awareness, social support, capacity building, and sustainable community programmes that improve livelihoods, promote human dignity, and create lasting positive change.

We are committed to identifying community needs, developing practical solutions, and working with stakeholders to ensure that opportunities for growth and development reach those who need them most.`,
  vision: `A society where every individual has equal opportunities to thrive, communities are empowered to achieve sustainable development, and everyone can contribute to building a peaceful, healthy, inclusive, and prosperous future.

We envision a future where poverty, exclusion, and limited access to opportunities no longer prevent individuals and communities from reaching their full potential.`,
  history: `Brighter Future Foundation was established with a commitment to contributing to meaningful social change and improving the well-being of communities.

Built on the belief that a better future begins with collective responsibility and practical action, the foundation seeks to address social and developmental challenges through programmes that empower people, strengthen communities, and create opportunities for sustainable progress.

As the foundation continues to grow, it remains committed to its founding purpose: supporting people, responding to community needs, and working towards a future in which everyone has the opportunity to thrive.

Our journey is guided by one enduring principle: a brighter future is possible when we work together to create it.`,
  disciplines_intro: 'Our work is organized around six programme and development areas. These areas provide a framework for designing initiatives, addressing community challenges, and delivering sustainable impact.',
  founder_name: '',
  founder_title: '',
  email: '',
  phone: '',
  address: '',
  contact_intro: `We welcome individuals, organizations, development partners, volunteers, and other stakeholders who share our commitment to building a brighter future.

Whether you are interested in volunteering, partnering with us, supporting our programmes, or learning more about our work, we would be glad to hear from you.

Together, we can turn shared commitments into meaningful community impact.`,
  disciplines: [
    {
      id: 'discipline-education',
      name: 'Education and Human Capital Development',
      description: 'We support access to education, learning opportunities, skills development, and capacity-building initiatives that help individuals acquire the knowledge and abilities needed to improve their lives and contribute to society.',
      display_order: 0,
      is_published: true,
    },
    {
      id: 'discipline-health',
      name: 'Health and Community Well-being',
      description: 'We promote healthier communities through health awareness, preventive health education, community outreach, and initiatives that encourage access to essential health information and services.',
      display_order: 1,
      is_published: true,
    },
    {
      id: 'discipline-youth-women',
      name: 'Youth and Women Empowerment',
      description: 'We support initiatives that create opportunities for women and young people through leadership development, entrepreneurship, skills acquisition, mentorship, and active participation in community development.',
      display_order: 2,
      is_published: true,
    },
    {
      id: 'discipline-livelihoods',
      name: 'Poverty Alleviation and Livelihood Development',
      description: 'We work towards improving livelihoods by supporting vulnerable individuals and households through economic empowerment, vocational development, livelihood initiatives, and opportunities for self-reliance.',
      display_order: 3,
      is_published: true,
    },
    {
      id: 'discipline-humanitarian',
      name: 'Humanitarian Support and Social Protection',
      description: 'We are committed to supporting vulnerable populations and communities facing hardship through humanitarian interventions, social support initiatives, advocacy, and programmes that promote dignity and inclusion.',
      display_order: 4,
      is_published: true,
    },
    {
      id: 'discipline-community',
      name: 'Community Development and Environmental Sustainability',
      description: 'We encourage community participation, local development initiatives, environmental awareness, and sustainable practices that contribute to stronger, safer, and more resilient communities.',
      display_order: 5,
      is_published: true,
    },
  ],
};

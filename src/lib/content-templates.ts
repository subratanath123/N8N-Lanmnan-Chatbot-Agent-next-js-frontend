export type FieldType = 'text' | 'textarea' | 'select';

export interface TemplateField {
  id: string;
  label: string;
  placeholder: string;
  type: FieldType;
  required: boolean;
  maxLength?: number;
  rows?: number;
  options?: string[];
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  outputLabel: string;
  fields: TemplateField[];
  buildPrompt: (values: Record<string, string>) => string;
}

export const TEMPLATE_CATEGORIES = [
  'All',
  'Ads & Marketing',
  'Articles & Blogs',
  'E-commerce',
  'General Writing',
  'Jobs & Companies',
  'Profile & Bio',
  'SEO & Web',
];

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  // ── Articles & Blogs ──────────────────────────────────────────────────────
  {
    id: 'blog-ideas',
    name: 'Blog Ideas & Outlines',
    description: 'Brainstorm new blog post topics that will engage readers and rank well on Google.',
    emoji: '💡',
    category: 'Articles & Blogs',
    outputLabel: 'Blog Ideas & Outline',
    fields: [
      { id: 'topic', label: 'Topic or Niche', placeholder: 'e.g. personal finance, vegan cooking', type: 'text', required: true, maxLength: 150 },
      { id: 'audience', label: 'Target Audience', placeholder: 'e.g. millennials, small business owners', type: 'text', required: false, maxLength: 100 },
      { id: 'tone', label: 'Tone', placeholder: '', type: 'select', required: false, options: ['Professional', 'Conversational', 'Humorous', 'Inspirational', 'Educational'] },
    ],
    buildPrompt: (v) =>
      `Generate 5 creative blog post ideas with detailed outlines for the topic "${v.topic}"${v.audience ? `, targeting ${v.audience}` : ''}. Tone should be ${v.tone || 'professional'}. For each idea, provide: a compelling title, a brief intro paragraph, 4–5 section headings with 2–3 sub-points each, and a conclusion hook.`,
  },
  {
    id: 'blog-post-writing',
    name: 'Blog Post Writing',
    description: 'Write deliciously engaging sections for any topic to grow your blog.',
    emoji: '✍️',
    category: 'Articles & Blogs',
    outputLabel: 'Blog Post',
    fields: [
      { id: 'title', label: 'Title of your blog article', placeholder: 'Article about the smartphone', type: 'text', required: true, maxLength: 190 },
      { id: 'keywords', label: 'Keywords or content of your blog', placeholder: 'Story about a horror night, first day at school', type: 'textarea', required: true, maxLength: 190, rows: 3 },
      { id: 'tone', label: 'Tone', placeholder: '', type: 'select', required: false, options: ['Professional', 'Conversational', 'Humorous', 'Inspirational', 'Formal', 'Casual'] },
      { id: 'length', label: 'Post Length', placeholder: '', type: 'select', required: false, options: ['Short (300–500 words)', 'Medium (600–900 words)', 'Long (1000–1500 words)'] },
    ],
    buildPrompt: (v) =>
      `Write a ${v.length || 'medium (600–900 words)'} blog post titled "${v.title}". Keywords/context: ${v.keywords}. Tone: ${v.tone || 'conversational'}. Include an engaging introduction, well-structured body sections with subheadings, and a compelling conclusion with a call-to-action. Use markdown formatting.`,
  },
  {
    id: 'story-writing',
    name: 'Story Writing',
    description: 'Write deliciously creative stories to engage your readers.',
    emoji: '📖',
    category: 'Articles & Blogs',
    outputLabel: 'Story',
    fields: [
      { id: 'genre', label: 'Genre', placeholder: '', type: 'select', required: true, options: ['Fantasy', 'Science Fiction', 'Romance', 'Horror', 'Mystery', 'Adventure', 'Drama', 'Comedy'] },
      { id: 'premise', label: 'Story Premise', placeholder: 'A detective who can hear lies must solve a murder...', type: 'textarea', required: true, maxLength: 300, rows: 3 },
      { id: 'characters', label: 'Main Characters (optional)', placeholder: 'Alex — a retired spy; Luna — a street artist', type: 'text', required: false, maxLength: 200 },
      { id: 'length', label: 'Length', placeholder: '', type: 'select', required: false, options: ['Short story (~500 words)', 'Medium (~800 words)', 'Opening chapter (~1200 words)'] },
    ],
    buildPrompt: (v) =>
      `Write a ${v.length || 'medium (~800 words)'} ${v.genre} story based on this premise: "${v.premise}"${v.characters ? `. Main characters: ${v.characters}` : ''}. Make it vivid, emotionally engaging, with strong dialogue and a surprising twist. Use markdown formatting.`,
  },
  {
    id: 'text-summarizer',
    name: 'Text Summarizer',
    description: 'Condense long text into crisp, accurate summaries in seconds.',
    emoji: '📋',
    category: 'Articles & Blogs',
    outputLabel: 'Summary',
    fields: [
      { id: 'text', label: 'Text to Summarize', placeholder: 'Paste the text you want summarized…', type: 'textarea', required: true, rows: 6 },
      { id: 'length', label: 'Summary Length', placeholder: '', type: 'select', required: false, options: ['1 sentence', '3 sentences', '1 paragraph', 'Bullet points (5)'] },
    ],
    buildPrompt: (v) =>
      `Summarize the following text in ${v.length || '1 paragraph'}:\n\n${v.text}`,
  },

  // ── Ads & Marketing ───────────────────────────────────────────────────────
  {
    id: 'google-ad-copy',
    name: 'Google Ad Copy',
    description: 'Create high-performing Google Ad (Title & Description) copy to drive more leads.',
    emoji: '🔵',
    category: 'Ads & Marketing',
    outputLabel: 'Google Ad Copy',
    fields: [
      { id: 'product', label: 'Product / Service', placeholder: 'Online accounting software for small businesses', type: 'text', required: true, maxLength: 150 },
      { id: 'usp', label: 'Unique Selling Point', placeholder: 'Saves 3 hours/week, free trial, no credit card', type: 'text', required: false, maxLength: 200 },
      { id: 'audience', label: 'Target Audience', placeholder: 'Freelancers and solopreneurs', type: 'text', required: false, maxLength: 100 },
    ],
    buildPrompt: (v) =>
      `Write 5 Google Ad variations for "${v.product}"${v.usp ? `. USP: ${v.usp}` : ''}${v.audience ? `. Audience: ${v.audience}` : ''}. For each ad provide: headline 1 (max 30 chars), headline 2 (max 30 chars), headline 3 (max 30 chars), description 1 (max 90 chars), description 2 (max 90 chars). Make them compelling, keyword-rich, and action-oriented.`,
  },
  {
    id: 'facebook-ad-copy',
    name: 'Facebook Ad Copy',
    description: 'Create high-performing Facebook Ad copy to generate more leads.',
    emoji: '🔵',
    category: 'Ads & Marketing',
    outputLabel: 'Facebook Ad Copy',
    fields: [
      { id: 'product', label: 'Product / Service', placeholder: 'Online yoga classes for busy moms', type: 'text', required: true, maxLength: 150 },
      { id: 'audience', label: 'Target Audience', placeholder: 'Women 25–40, interested in fitness', type: 'text', required: false, maxLength: 100 },
      { id: 'goal', label: 'Campaign Goal', placeholder: '', type: 'select', required: false, options: ['Drive traffic', 'Generate leads', 'Increase sales', 'Boost engagement', 'App installs'] },
      { id: 'offer', label: 'Offer or CTA', placeholder: 'Free 7-day trial, no credit card required', type: 'text', required: false, maxLength: 150 },
    ],
    buildPrompt: (v) =>
      `Write 3 Facebook Ad variations for "${v.product}"${v.audience ? `. Target: ${v.audience}` : ''}. Goal: ${v.goal || 'drive traffic'}${v.offer ? `. Offer: ${v.offer}` : ''}. Each ad should include: a hook (first line that stops the scroll), body copy (2–3 short paragraphs), and a strong CTA. Use an emotional, story-driven tone.`,
  },
  {
    id: 'marketing-copy',
    name: 'Marketing Copy & Strategies',
    description: 'Generate diverse marketing angles that add intensity to your campaigns.',
    emoji: '📣',
    category: 'Ads & Marketing',
    outputLabel: 'Marketing Copy',
    fields: [
      { id: 'product', label: 'Product / Service / Brand', placeholder: 'SaaS CRM platform for real estate agents', type: 'text', required: true, maxLength: 150 },
      { id: 'goal', label: 'Marketing Goal', placeholder: 'Launch campaign, increase trials by 20%', type: 'text', required: true, maxLength: 200 },
      { id: 'channels', label: 'Marketing Channels', placeholder: '', type: 'select', required: false, options: ['Email + Social Media', 'Paid Ads', 'Content Marketing', 'Influencer', 'Multi-channel'] },
    ],
    buildPrompt: (v) =>
      `Create a marketing copy strategy for "${v.product}". Goal: ${v.goal}. Channels: ${v.channels || 'multi-channel'}. Include: 3 unique positioning angles, value propositions, 5 headline variants, 3 body copy blocks, and a 4-week campaign roadmap.`,
  },
  {
    id: 'call-to-action',
    name: 'Call to Action',
    description: 'Write powerful CTAs that convert visitors into customers.',
    emoji: '🎯',
    category: 'Ads & Marketing',
    outputLabel: 'Call to Action Copy',
    fields: [
      { id: 'product', label: 'Product / Page', placeholder: 'Free trial landing page for design tool', type: 'text', required: true, maxLength: 150 },
      { id: 'action', label: 'Desired Action', placeholder: 'Sign up for free trial', type: 'text', required: true, maxLength: 100 },
      { id: 'style', label: 'Style', placeholder: '', type: 'select', required: false, options: ['Urgent', 'Benefit-focused', 'Curiosity-driven', 'Social proof', 'Fear of missing out'] },
    ],
    buildPrompt: (v) =>
      `Generate 10 powerful call-to-action variants for "${v.product}". Desired action: "${v.action}". Style: ${v.style || 'benefit-focused'}. Include: button text (2–5 words), supporting subtext (1 sentence), and a brief explanation of why each CTA works.`,
  },
  {
    id: 'landing-page-copy',
    name: 'Landing Page & Website Copy',
    description: 'Generate creative and persuasive copy for sections of your website.',
    emoji: '💻',
    category: 'Ads & Marketing',
    outputLabel: 'Landing Page Copy',
    fields: [
      { id: 'product', label: 'Product / Service', placeholder: 'Project management tool for remote teams', type: 'text', required: true, maxLength: 150 },
      { id: 'section', label: 'Page Section', placeholder: '', type: 'select', required: true, options: ['Hero section', 'Features section', 'Benefits section', 'Testimonials prompt', 'FAQ section', 'Pricing section', 'Full landing page'] },
      { id: 'audience', label: 'Target Audience', placeholder: 'Startup founders and team leads', type: 'text', required: false, maxLength: 100 },
    ],
    buildPrompt: (v) =>
      `Write compelling ${v.section} copy for "${v.product}"${v.audience ? `. Target audience: ${v.audience}` : ''}. Make it conversion-focused, clear, and benefit-driven. Use markdown formatting with appropriate headings.`,
  },

  // ── E-commerce ────────────────────────────────────────────────────────────
  {
    id: 'product-description',
    name: 'Product Description',
    description: 'Craft epic product descriptions that increase conversions on your store.',
    emoji: '🛒',
    category: 'E-commerce',
    outputLabel: 'Product Description',
    fields: [
      { id: 'product', label: 'Product Name', placeholder: 'Wireless noise-cancelling headphones', type: 'text', required: true, maxLength: 100 },
      { id: 'features', label: 'Key Features', placeholder: '40hr battery, foldable, 30mm drivers, USB-C', type: 'textarea', required: true, maxLength: 300, rows: 3 },
      { id: 'audience', label: 'Target Customer', placeholder: 'Commuters and remote workers', type: 'text', required: false, maxLength: 100 },
      { id: 'platform', label: 'Platform', placeholder: '', type: 'select', required: false, options: ['Amazon', 'Shopify store', 'Etsy', 'WooCommerce', 'General'] },
    ],
    buildPrompt: (v) =>
      `Write a compelling ${v.platform || 'e-commerce'} product description for "${v.product}". Features: ${v.features}${v.audience ? `. Target customer: ${v.audience}` : ''}. Include: attention-grabbing headline, benefit-driven intro, bullet-point features list, emotional connection paragraph, and a strong CTA. Optimize for conversions and SEO.`,
  },
  {
    id: 'amazon-product-outline',
    name: 'Amazon Product Outlines',
    description: 'Create product descriptions according to Amazon\'s guidelines to grab more sales.',
    emoji: '🛍️',
    category: 'E-commerce',
    outputLabel: 'Amazon Product Listing',
    fields: [
      { id: 'product', label: 'Product Name', placeholder: 'Stainless steel water bottle 32oz', type: 'text', required: true, maxLength: 100 },
      { id: 'features', label: 'Key Features & Benefits', placeholder: 'BPA-free, keeps cold 24hr, dishwasher safe', type: 'textarea', required: true, maxLength: 300, rows: 3 },
      { id: 'category', label: 'Amazon Category', placeholder: 'Sports & Outdoors', type: 'text', required: false, maxLength: 80 },
    ],
    buildPrompt: (v) =>
      `Write a complete Amazon product listing for "${v.product}"${v.category ? ` in category "${v.category}"` : ''}. Features: ${v.features}. Include: SEO-optimized product title (max 200 chars), 5 bullet points (starting with key benefit in caps), A+ content description (2–3 paragraphs), and 10 backend search keywords.`,
  },
  {
    id: 'product-review-response',
    name: 'Product Reviews & Responders',
    description: 'Write detailed product reviews and thoughtful responses to existing reviews.',
    emoji: '⭐',
    category: 'E-commerce',
    outputLabel: 'Product Review / Response',
    fields: [
      { id: 'task', label: 'What do you need?', placeholder: '', type: 'select', required: true, options: ['Write a product review', 'Respond to a positive review', 'Respond to a negative review', 'Respond to a neutral review'] },
      { id: 'product', label: 'Product Name', placeholder: 'Smart LED desk lamp', type: 'text', required: true, maxLength: 100 },
      { id: 'context', label: 'Context / Review Text', placeholder: 'Product highlights or the review you want to respond to...', type: 'textarea', required: true, rows: 3, maxLength: 400 },
    ],
    buildPrompt: (v) =>
      `Task: ${v.task} for "${v.product}". Context: ${v.context}. Write a professional, authentic, and empathetic response. For reviews, include pros, cons, and a verdict. For responses, thank the customer, address their feedback specifically, and offer resolution if negative.`,
  },

  // ── General Writing ───────────────────────────────────────────────────────
  {
    id: 'email-writing',
    name: 'Email Writing',
    description: 'Create professional emails for marketing, sales, announcements & more.',
    emoji: '📧',
    category: 'General Writing',
    outputLabel: 'Email',
    fields: [
      { id: 'purpose', label: 'Email Purpose', placeholder: '', type: 'select', required: true, options: ['Sales outreach', 'Marketing campaign', 'Follow-up', 'Announcement', 'Customer onboarding', 'Apology / recovery', 'Re-engagement', 'Thank you'] },
      { id: 'context', label: 'Context / Details', placeholder: 'Launching a new feature: dark mode for our project app...', type: 'textarea', required: true, rows: 3, maxLength: 300 },
      { id: 'recipient', label: 'Recipient', placeholder: 'Existing customers, software teams', type: 'text', required: false, maxLength: 100 },
      { id: 'tone', label: 'Tone', placeholder: '', type: 'select', required: false, options: ['Professional', 'Friendly', 'Urgent', 'Inspirational', 'Casual'] },
    ],
    buildPrompt: (v) =>
      `Write a ${v.tone || 'professional'} ${v.purpose} email. Details: ${v.context}${v.recipient ? `. Recipient: ${v.recipient}` : ''}. Include: compelling subject line, personalized opening, clear value in the body, and a strong CTA. Keep it concise and scannable.`,
  },
  {
    id: 'business-ideas',
    name: 'Business Ideas & Strategies',
    description: 'Explore business ideas and strategies you should pursue as an entrepreneur.',
    emoji: '💼',
    category: 'General Writing',
    outputLabel: 'Business Ideas & Strategy',
    fields: [
      { id: 'niche', label: 'Industry or Niche', placeholder: 'Sustainable fashion, EdTech, HealthTech', type: 'text', required: true, maxLength: 150 },
      { id: 'skills', label: 'Your Skills / Resources', placeholder: 'Software development, $5k budget, 10hr/week', type: 'text', required: false, maxLength: 200 },
      { id: 'goal', label: 'Goal', placeholder: '', type: 'select', required: false, options: ['Side income', 'Full-time business', 'Startup / VC-backed', 'Freelance / consulting', 'E-commerce'] },
    ],
    buildPrompt: (v) =>
      `Generate 5 innovative business ideas in the "${v.niche}" space${v.skills ? ` for someone with: ${v.skills}` : ''}. Goal: ${v.goal || 'side income'}. For each idea: concept overview, target market, revenue model, startup cost estimate, and 90-day launch roadmap.`,
  },
  {
    id: 'brand-name',
    name: 'Brand Name Generator',
    description: 'Give your new brand launch the perfect name that captures attention.',
    emoji: '🏷️',
    category: 'General Writing',
    outputLabel: 'Brand Name Ideas',
    fields: [
      { id: 'description', label: 'Describe Your Business', placeholder: 'AI-powered fitness coaching app for busy professionals', type: 'textarea', required: true, rows: 2, maxLength: 200 },
      { id: 'style', label: 'Name Style', placeholder: '', type: 'select', required: false, options: ['Short & punchy', 'Descriptive', 'Abstract / invented', 'Metaphorical', 'Acronym-friendly'] },
      { id: 'keywords', label: 'Must-include Keywords (optional)', placeholder: 'fit, motion, coach', type: 'text', required: false, maxLength: 100 },
    ],
    buildPrompt: (v) =>
      `Generate 15 brand name ideas for: "${v.description}". Style preference: ${v.style || 'short & punchy'}${v.keywords ? `. Consider keywords: ${v.keywords}` : ''}. For each name provide: the name, a 1-sentence rationale, potential domain availability note (.com suggestion), and tagline idea.`,
  },
  {
    id: 'tagline',
    name: 'Tagline & Headlines',
    description: 'Generate catchy and creative taglines for your profiles, brand, or products.',
    emoji: '✨',
    category: 'General Writing',
    outputLabel: 'Taglines & Headlines',
    fields: [
      { id: 'brand', label: 'Brand / Product / Page', placeholder: 'Productivity app for remote teams', type: 'text', required: true, maxLength: 150 },
      { id: 'value', label: 'Core Value or Benefit', placeholder: 'Saves 2 hours a day, reduces meeting overload', type: 'text', required: false, maxLength: 150 },
      { id: 'style', label: 'Style', placeholder: '', type: 'select', required: false, options: ['Clever & witty', 'Inspirational', 'Bold & direct', 'Question-based', 'Minimalist'] },
    ],
    buildPrompt: (v) =>
      `Generate 12 taglines and 8 headline variants for "${v.brand}"${v.value ? `. Core value: ${v.value}` : ''}. Style: ${v.style || 'clever & witty'}. Group them into: Taglines (short, memorable, brandable) and Headlines (for ads, landing pages, emails). Explain the hook behind the best 3.`,
  },
  {
    id: 'content-improver',
    name: 'Content Improver',
    description: 'Rewrite and elevate your existing content to be more compelling and polished.',
    emoji: '⬆️',
    category: 'General Writing',
    outputLabel: 'Improved Content',
    fields: [
      { id: 'content', label: 'Your Existing Content', placeholder: 'Paste the content you want to improve…', type: 'textarea', required: true, rows: 5 },
      { id: 'goal', label: 'Improvement Goal', placeholder: '', type: 'select', required: true, options: ['More engaging', 'More professional', 'Simpler / clearer', 'SEO optimized', 'More persuasive', 'Shorter / concise'] },
    ],
    buildPrompt: (v) =>
      `Rewrite and improve the following content to be ${v.goal || 'more engaging'}. Preserve the original meaning and key points while significantly enhancing the quality:\n\n${v.content}\n\nAlso briefly explain 3 key improvements you made.`,
  },
  {
    id: 'content-rephrase',
    name: 'Content Rephrase',
    description: 'Rephrase sentences and paragraphs in a fresh, unique voice.',
    emoji: '🔄',
    category: 'General Writing',
    outputLabel: 'Rephrased Content',
    fields: [
      { id: 'content', label: 'Text to Rephrase', placeholder: 'Paste the text you want rephrased…', type: 'textarea', required: true, rows: 5 },
      { id: 'tone', label: 'Target Tone', placeholder: '', type: 'select', required: false, options: ['Professional', 'Casual / friendly', 'Academic', 'Simple / plain', 'Creative', 'Formal'] },
    ],
    buildPrompt: (v) =>
      `Rephrase the following text in a ${v.tone || 'professional'} tone, making it sound fresh and original while preserving the original meaning:\n\n${v.content}`,
  },

  // ── Profile & Bio ─────────────────────────────────────────────────────────
  {
    id: 'linkedin-profile-copy',
    name: 'LinkedIn Profile Copy',
    description: 'Add a blend of achievements and professionalism to enrich your LinkedIn.',
    emoji: '🔵',
    category: 'Profile & Bio',
    outputLabel: 'LinkedIn Profile Copy',
    fields: [
      { id: 'role', label: 'Your Role / Title', placeholder: 'Senior Product Manager at a B2B SaaS company', type: 'text', required: true, maxLength: 150 },
      { id: 'experience', label: 'Key Experience & Achievements', placeholder: 'Led team of 12, launched 3 products, 40% revenue growth', type: 'textarea', required: true, rows: 3, maxLength: 300 },
      { id: 'goal', label: 'Profile Goal', placeholder: '', type: 'select', required: false, options: ['Land a new job', 'Attract clients / consulting', 'Build thought leadership', 'Network in industry', 'Recruit talent'] },
    ],
    buildPrompt: (v) =>
      `Write a compelling LinkedIn profile for: Role: "${v.role}". Experience: ${v.experience}. Goal: ${v.goal || 'build thought leadership'}. Include: headline (max 220 chars), about section (3 paragraphs, first-person), experience bullet points (action + result format), and 5 featured skills to highlight.`,
  },
  {
    id: 'personal-bio',
    name: 'Personal Bio',
    description: 'Describe yourself effectively in a few words while capturing attention.',
    emoji: '👤',
    category: 'Profile & Bio',
    outputLabel: 'Personal Bio',
    fields: [
      { id: 'name', label: 'Your Name', placeholder: 'Alex Johnson', type: 'text', required: true, maxLength: 60 },
      { id: 'role', label: 'Role / What You Do', placeholder: 'UX Designer & Illustrator based in NYC', type: 'text', required: true, maxLength: 150 },
      { id: 'highlights', label: 'Key Highlights / Achievements', placeholder: '5 years at Google, featured in Forbes, mentor at GDI', type: 'textarea', required: false, rows: 2, maxLength: 200 },
      { id: 'length', label: 'Bio Length', placeholder: '', type: 'select', required: false, options: ['Twitter / Instagram (2 lines)', 'Website / portfolio (1 paragraph)', 'Conference speaker (2 paragraphs)', 'Full professional bio (3 paragraphs)'] },
    ],
    buildPrompt: (v) =>
      `Write a ${v.length || 'website / portfolio (1 paragraph)'} personal bio for ${v.name}, who is a ${v.role}${v.highlights ? `. Highlights: ${v.highlights}` : ''}. Make it confident, engaging, and memorable. Write in third person.`,
  },

  // ── Jobs & Companies ──────────────────────────────────────────────────────
  {
    id: 'cover-letter',
    name: 'Cover Letter',
    description: 'Write a compelling, personalized cover letter that gets you noticed.',
    emoji: '📄',
    category: 'Jobs & Companies',
    outputLabel: 'Cover Letter',
    fields: [
      { id: 'role', label: 'Job Role Applying For', placeholder: 'Senior Frontend Engineer at Stripe', type: 'text', required: true, maxLength: 150 },
      { id: 'experience', label: 'Your Relevant Experience', placeholder: '4 years React, launched 2 fintech products, TypeScript expert', type: 'textarea', required: true, rows: 3, maxLength: 300 },
      { id: 'company', label: 'Why This Company?', placeholder: 'Admire their API-first approach and engineering culture', type: 'text', required: false, maxLength: 200 },
    ],
    buildPrompt: (v) =>
      `Write a professional, tailored cover letter for the role of "${v.role}". Candidate experience: ${v.experience}${v.company ? `. Motivation for this company: ${v.company}` : ''}. Include: compelling opening hook, 2 achievement-focused body paragraphs, company-specific connection, and a confident closing. Keep it under 350 words.`,
  },
  {
    id: 'job-description',
    name: 'Job Description',
    description: 'Create clear, attractive job descriptions to find the best candidates.',
    emoji: '📋',
    category: 'Jobs & Companies',
    outputLabel: 'Job Description',
    fields: [
      { id: 'role', label: 'Job Title', placeholder: 'Senior Backend Engineer', type: 'text', required: true, maxLength: 100 },
      { id: 'company', label: 'Company & Team Description', placeholder: 'Early-stage fintech startup, 20-person engineering team', type: 'text', required: true, maxLength: 200 },
      { id: 'requirements', label: 'Key Requirements', placeholder: '5+ years Go, microservices, Kubernetes, strong comms', type: 'textarea', required: true, rows: 3, maxLength: 300 },
      { id: 'perks', label: 'Perks & Benefits', placeholder: 'Remote-first, equity, $5k learning budget', type: 'text', required: false, maxLength: 200 },
    ],
    buildPrompt: (v) =>
      `Write an engaging job description for "${v.role}" at: ${v.company}. Requirements: ${v.requirements}${v.perks ? `. Perks: ${v.perks}` : ''}. Include: hook intro about the company, role overview, responsibilities (5–7 bullets), requirements (must-have + nice-to-have), and perks section. Make it inclusive and appealing.`,
  },

  // ── SEO & Web ─────────────────────────────────────────────────────────────
  {
    id: 'keyword-generator',
    name: 'Keyword Generator',
    description: 'Come up with relevant, key phrases and questions related to your niche.',
    emoji: '🔍',
    category: 'SEO & Web',
    outputLabel: 'Keyword List',
    fields: [
      { id: 'topic', label: 'Topic or Seed Keyword', placeholder: 'electric vehicles, remote work tools', type: 'text', required: true, maxLength: 150 },
      { id: 'intent', label: 'Search Intent', placeholder: '', type: 'select', required: false, options: ['Informational', 'Commercial / comparison', 'Transactional', 'Navigational', 'All intents'] },
      { id: 'count', label: 'Number of Keywords', placeholder: '', type: 'select', required: false, options: ['20 keywords', '50 keywords', '100 keywords'] },
    ],
    buildPrompt: (v) =>
      `Generate ${v.count || '50 keywords'} for the topic "${v.topic}" with ${v.intent || 'all'} search intent. Organize them into clusters: short-tail (1–2 words), long-tail (3–5 words), and question-based. Include estimated search intent label and content type suggestion for each.`,
  },
  {
    id: 'keyword-extractor',
    name: 'Keyword Extractor',
    description: 'Extract the most important SEO keywords from any text automatically.',
    emoji: '🔎',
    category: 'SEO & Web',
    outputLabel: 'Extracted Keywords',
    fields: [
      { id: 'text', label: 'Text to Extract Keywords From', placeholder: 'Paste your article, product page, or any content…', type: 'textarea', required: true, rows: 5 },
      { id: 'count', label: 'Number of Keywords', placeholder: '', type: 'select', required: false, options: ['Top 10', 'Top 20', 'Top 30'] },
    ],
    buildPrompt: (v) =>
      `Extract the ${v.count || 'top 20'} most important SEO keywords from the following text. For each keyword provide: the keyword/phrase, relevance score (1–10), search intent (informational/commercial/transactional), and a brief note on why it's important:\n\n${v.text}`,
  },
  {
    id: 'seo-meta',
    name: 'SEO Meta Title & Details',
    description: 'Generate SEO-optimized page titles and meta descriptions that rank and click.',
    emoji: '🌐',
    category: 'SEO & Web',
    outputLabel: 'SEO Meta Tags',
    fields: [
      { id: 'page', label: 'Page / Article Title or Topic', placeholder: 'Best productivity apps for remote teams 2024', type: 'text', required: true, maxLength: 150 },
      { id: 'keywords', label: 'Target Keywords', placeholder: 'productivity apps, remote work tools, team collaboration', type: 'text', required: false, maxLength: 150 },
      { id: 'count', label: 'Variants', placeholder: '', type: 'select', required: false, options: ['3 variants', '5 variants', '10 variants'] },
    ],
    buildPrompt: (v) =>
      `Generate ${v.count || '5 variants'} of SEO-optimized meta title and description for "${v.page}"${v.keywords ? `. Target keywords: ${v.keywords}` : ''}. Each variant should include: meta title (max 60 chars), meta description (max 155 chars), and a focus keyword. Ensure each is unique in angle and compelling to click.`,
  },
];

export function getTemplateById(id: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): ContentTemplate[] {
  if (category === 'All') return CONTENT_TEMPLATES;
  return CONTENT_TEMPLATES.filter(t => t.category === category);
}

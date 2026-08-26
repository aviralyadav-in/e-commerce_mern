/**
 * siteContent.js — poore site ka static editorial content ek jagah.
 * Niyabags.vercel.app ke content model jaisa hi structure:
 * announcements, hero slides, marquee, campaign, reels,
 * testimonials, newsletter aur saare info/legal pages.
 */

export const ANNOUNCEMENTS = [
  { id: 1, text: "Complimentary shipping on orders above ₹500" },
  { id: 2, text: "Discover the new Niya collection" },
  { id: 3, text: "Crafted with intention, made for you" },
];

export const HERO_SLIDES = [
  {
    id: "hero-1",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1800&q=85",
    title: "Carry Your\nStory",
    subtitle: "Discover timeless handbags crafted for the modern woman.",
    buttonText: "Shop Collection",
    buttonLink: "/shop",
  },
  {
    id: "hero-2",
    image:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1800&q=85",
    title: "Made for\nYour Moment",
    subtitle: "Elegant silhouettes designed to move with you.",
    buttonText: "Explore Collection",
    buttonLink: "/shop",
  },
];

export const MARQUEE_FEATURES = [
  { icon: "truck", title: "Free Shipping", text: "On orders above ₹500" },
  { icon: "shield", title: "2-Year Warranty", text: "Crafted to last" },
  { icon: "refresh", title: "Easy Returns", text: "7-day hassle-free returns" },
  { icon: "package", title: "Help Centre", text: "We're here to help" },
];

export const CAMPAIGN_BANNER = {
  eyebrow: "OUR ENTIRE WORLD IN A SINGLE COLLECTION",
  title: "Made for\nYour Moment",
  description:
    "A celebration of modern elegance, effortless movement, and the quiet confidence that comes with carrying something beautifully made.",
  image:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85",
  buttonText: "Explore every piece possible",
  buttonLink: "/shop",
};

export const REELS = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=85",
    title: "Everyday elegance",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=700&q=85",
    title: "Style it your way",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=85",
    title: "Behind the craft",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=85",
    title: "The Niya edit",
  },
];

export const CRAFTSMANSHIP_HOME = {
  eyebrow: "OUR PROMISE",
  title: "The Art of\nCraftsmanship",
  description: [
    "Every Niya bag begins as a sketch and ends in the hands of a master artisan.",
    "We believe luxury is not just about materials. It is about the human touch, patience, precision, and stories woven into every stitch.",
  ],
  stats: [
    { value: "25+", label: "Pieces of craft" },
    { value: "40+", label: "Handcrafted steps" },
    { value: "100%", label: "Intentional design" },
  ],
  image:
    "https://images.unsplash.com/photo-1612902456551-333ac5afa26e?auto=format&fit=crop&w=1200&q=85",
  imageAlt: "Niya craftsmanship",
  buttonText: "Discover Our Story",
  buttonLink: "/craftsmanship",
};

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Ananya M.",
    location: "Mumbai",
    rating: 5,
    text: "The craftsmanship is even more beautiful in person. It feels luxurious without being overdone.",
  },
  {
    id: 2,
    name: "Priya R.",
    location: "Delhi",
    rating: 5,
    text: "My Niya bag has become my everyday favourite. The quality, details and packaging were exceptional.",
  },
  {
    id: 3,
    name: "Meera S.",
    location: "Bengaluru",
    rating: 5,
    text: "Elegant, practical and beautifully made. I have already recommended Niya to my friends.",
  },
];

export const NEWSLETTER = {
  eyebrow: "STAY IN THE LOOP",
  title: "Join the Niya Circle",
  description:
    "Be the first to know about new collections, private sales, and styling stories.",
};

export const SUPPORT_EMAIL = "support@niyabags.com";

/* ------------------------------------------------------------------
   INFO PAGES — /about · /our-story · /shipping-returns · guides etc.
   ------------------------------------------------------------------ */

export const ABOUT_PAGE = {
  eyebrow: "ABOUT NIYA",
  title: "Designed for the woman who carries her own story.",
  intro:
    "Niya Bags is a contemporary handbag brand built around thoughtful design, timeless silhouettes, and everyday elegance.",
  sections: [
    {
      id: "design",
      title: "Thoughtful Design",
      content:
        "Every Niya piece is designed with a focus on clean silhouettes, considered details and effortless functionality. We believe a handbag should feel beautiful while naturally fitting into everyday life.",
    },
    {
      id: "quality",
      title: "Made with Purpose",
      content:
        "We focus on creating pieces that balance contemporary style with practical use. From the proportions to the finishing details, every element has a purpose.",
    },
    {
      id: "everyday",
      title: "For Every Day",
      content:
        "Niya handbags are created for the woman who moves through different moments of her day with confidence. Our designs are made to transition naturally from everyday routines to occasions that matter.",
    },
  ],
  values: [
    {
      id: "intentional-design",
      title: "Intentional Design",
      content:
        "Clean forms, thoughtful details and timeless silhouettes designed to stay relevant beyond a season.",
    },
    {
      id: "everyday-elegance",
      title: "Everyday Elegance",
      content:
        "Pieces that feel refined without compromising comfort, functionality or versatility.",
    },
    {
      id: "lasting-style",
      title: "Lasting Style",
      content:
        "A considered approach to design that focuses on pieces you can continue to carry and love.",
    },
  ],
};

export const OUR_STORY_PAGE = {
  eyebrow: "OUR STORY",
  title: "A story shaped by design, purpose and everyday life.",
  intro:
    "Niya began with a simple idea — create handbags that feel considered, useful and beautiful enough to become part of the everyday.",
  sections: [
    {
      title: "The Beginning",
      content:
        "Niya started with a love for handbags and a desire to create pieces that balance contemporary design with the practical needs of modern women.",
    },
    {
      title: "Finding Our Identity",
      content:
        "We developed a design language around clean silhouettes, subtle details and versatile forms. Every collection is designed to feel distinctive without being difficult to wear.",
    },
    {
      title: "Designed for Everyday Life",
      content:
        "From workdays and coffee runs to dinners and occasions that matter, our handbags are designed to move naturally with the woman carrying them.",
    },
  ],
  quote:
    "The best designs are the ones that become part of your everyday life.",
};

export const CRAFTSMANSHIP_PAGE = {
  eyebrow: "CRAFTSMANSHIP",
  title: "Where heritage meets modern luxury.",
  intro:
    "India has always told its stories through what its hands create. At Niya, we bring that spirit into contemporary handbags — where traditional craftsmanship meets a modern sense of luxury.",
  sections: [
    {
      title: "A Heritage of Making",
      content:
        "From hand embroidery and intricate weaving to leatherwork and decorative detailing, craftsmanship has always been part of India's visual language.",
    },
    {
      title: "The Niya Approach",
      content:
        "Niya draws from this heritage — not to recreate the past, but to carry its spirit forward. Each silhouette is refined, tested and finished by hand before it reaches you.",
    },
  ],
  closing:
    "The colours, textures, patience and artistry found across Indian craftsmanship influence the way we think about our bags. The result is not a replica of tradition, but a continuation of it — designed for the everyday.",
};

export const CONTACT_PAGE = {
  eyebrow: "CONTACT US",
  title: "We are here to help.",
  intro:
    "Have a question about your order, a product or anything else? Our team is here to assist you.",
  email: SUPPORT_EMAIL,
  supportHours: "Mon – Sat · 10:00 AM to 7:00 PM IST",
  subjects: [
    { value: "", label: "Select a subject" },
    { value: "order", label: "Order Related" },
    { value: "product", label: "Product Enquiry" },
    { value: "shipping", label: "Shipping & Delivery" },
    { value: "returns", label: "Returns & Exchange" },
    { value: "payment", label: "Payment Issue" },
    { value: "partnership", label: "Partnership / Collaboration" },
    { value: "other", label: "Other" },
  ],
};

export const SHIPPING_RETURNS_PAGE = {
  eyebrow: "CUSTOMER CARE",
  title: "Shipping & Returns",
  intro:
    "Everything you need to know about receiving, returning and exchanging your Niya order.",
  sections: [
    {
      id: "shipping",
      title: "Shipping",
      content:
        "Orders are carefully packed and dispatched to the shipping address provided at checkout. Once your order has been shipped, you will receive tracking information by email or through the available order updates.",
    },
    {
      id: "returns",
      title: "Returns",
      content:
        "If you are not completely satisfied with your purchase, eligible products can be returned within the applicable return period, provided they are unused and in their original condition.",
    },
    {
      id: "exchange",
      title: "Exchange Policy",
      content:
        "Eligible products may be exchanged according to our exchange terms. Products must be unused, undamaged and returned with their original packaging and tags.",
    },
  ],
};

export const SIZE_GUIDE_PAGE = {
  eyebrow: "GUIDES",
  title: "Know your bag. Care for it well.",
  intro:
    "Explore our size information and simple care recommendations to help you choose and maintain your Niya piece.",
  sections: [
    {
      id: "size-guide",
      title: "Size Guide",
      content:
        "Use the dimensions provided on each product page to understand the bag's proportions, capacity and fit for your everyday essentials.",
    },
    {
      id: "care-guide",
      title: "Care Guide",
      content:
        "Keep your Niya bag away from excessive moisture, direct heat and harsh chemicals. Store it in its protective packaging when not in use and handle delicate finishes with care.",
    },
  ],
};

export const FAQ_PAGE = {
  eyebrow: "FAQ",
  title: "Frequently Asked Questions",
  intro:
    "Find answers to common questions about Niya products, orders, shipping and returns.",
  faqs: [
    {
      question: "How can I place an order?",
      answer:
        "Browse the collection, select the product you want and add it to your shopping bag. Proceed to checkout and complete the required order details.",
    },
    {
      question: "How can I track my order?",
      answer:
        "Once your order has been dispatched, tracking information will be provided through the available order updates.",
    },
    {
      question: "Can I return my order?",
      answer:
        "Eligible products can be returned according to the applicable return policy. Products must meet the required condition and return requirements.",
    },
    {
      question: "Can I exchange a product?",
      answer:
        "Eligible products may be exchanged according to the applicable exchange policy.",
    },
    {
      question: "How should I care for my handbag?",
      answer:
        "Keep your handbag away from excessive moisture, direct sunlight and abrasive surfaces. Store it in its protective dust bag when not in use.",
    },
    {
      question: "How can I contact Niya?",
      answer: `You can contact our customer support team at ${SUPPORT_EMAIL}.`,
    },
  ],
};

export const LEGAL_PAGES = {
  "privacy-policy": {
    eyebrow: "LEGAL",
    title: "Privacy Policy",
    intro:
      "Your privacy is important to us. This policy explains how Niya Bags collects, uses and protects information.",
    sections: [
      {
        id: "privacy-policy",
        title: "Information We Collect",
        content:
          "We may collect information provided during account creation, checkout, customer support interactions and other interactions with our website.",
      },
      {
        id: "how-we-use",
        title: "How We Use Information",
        content:
          "Information may be used to process orders, provide customer support, improve our website and communicate relevant service updates.",
      },
      {
        id: "data-security",
        title: "Data Security",
        content:
          "We take reasonable measures to protect information handled through our website and services.",
      },
      {
        id: "contact",
        title: "Contact",
        content: `For privacy-related questions, contact us at ${SUPPORT_EMAIL}.`,
      },
    ],
  },
  "terms-of-use": {
    eyebrow: "LEGAL",
    title: "Terms of Use",
    intro:
      "These terms govern your use of the Niya Bags website and services.",
    sections: [
      {
        id: "terms-of-use",
        title: "Use of the Website",
        content:
          "By accessing and using the Niya Bags website, you agree to use the website responsibly and in accordance with applicable laws.",
      },
      {
        id: "products",
        title: "Products and Information",
        content:
          "We make reasonable efforts to provide accurate product information, descriptions and images. Product availability and details may change without prior notice.",
      },
      {
        id: "orders",
        title: "Orders",
        content:
          "Orders are subject to availability and confirmation. We reserve the right to cancel or modify an order where necessary.",
      },
      {
        id: "intellectual-property",
        title: "Intellectual Property",
        content:
          "The content, branding, imagery, design and other materials on this website belong to Niya Bags or their respective owners and may not be reproduced without permission.",
      },
      {
        id: "contact",
        title: "Contact",
        content: `For questions regarding these terms, contact us at ${SUPPORT_EMAIL}.`,
      },
    ],
  },
};




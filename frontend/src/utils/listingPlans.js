export const PLANS = [
  {
    id:"community", name:"Community Member", desc:"Basic visibility for parent-focused providers", price:"R0", highlight:false,
    features:[
      {text:"Basic profile listing",yes:true},
      {text:"Appears in search results",yes:true},
      {text:"Contact via Parental's form",yes:true},
      {text:"No pricing or website links",yes:false},
      {text:"Direct contact details",yes:false},
    ],
    cta:"Get Started for Free", planParam:"Free Listing - basic profile"
  },
  {
    id:"trusted", name:"Parental Plus+", desc:"Discounted to R149/month for the first 12 months", price:"R149", highlight:true,
    features:[
      {text:"Full provider profile",yes:true},
      {text:"Direct phone, email, WhatsApp & website",yes:true},
      {text:"Pricing, availability and reviews",yes:true},
      {text:"Priority placement in results",yes:true},
      {text:"Up to 3 services listed",yes:true},
      {text:"Monthly newsletter inclusion",yes:true},
      {text:"1 Facebook & Instagram post",yes:true},
      {text:"1 native article: 800 words + image",yes:true},
    ],
    cta:"Start Parental Plus+", planParam:"Parental Plus+ – R149/month introductory offer"
  },
];

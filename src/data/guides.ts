// Buying guides: original, practical articles for shoppers. Each paragraph is a plain string.
export interface Guide {
  slug: string;
  title: string;
  summary: string;
  sections: Array<{ heading: string; paragraphs?: string[]; bullets?: string[] }>;
}

import { moreGuides } from "./guides2";

const coreGuides: Guide[] = [
  {
    slug: "how-to-choose-a-smartphone-in-kenya",
    title: "How to choose a smartphone in Kenya: a practical checklist",
    summary: "Battery, storage, network bands and warranty - what to check before you pay for a phone.",
    sections: [
      {
        heading: "Start with your budget and how you use the phone",
        paragraphs: [
          "The best phone is the one that fits what you actually do. If you mostly use WhatsApp, M-Pesa, social media and video calls, a solid mid-range phone will serve you well. If you edit video or play demanding games, you will need a faster processor and more memory, and the price rises quickly.",
          "Decide your maximum budget first, then compare phones inside it. Remember to keep a little aside for a screen protector and a case - repairs cost far more than protection.",
        ],
      },
      {
        heading: "The specifications that matter most",
        bullets: [
          "Battery: look for 4,000-5,000 mAh or more if you are out all day. Fast charging helps when you are in a hurry.",
          "Storage: 64 GB fills up fast with photos and WhatsApp media. 128 GB is a comfortable minimum today, and check whether a memory-card slot is included.",
          "RAM: 4 GB works for everyday use; 6-8 GB keeps the phone smooth for longer as apps grow.",
          "Display: bigger and brighter is easier on the eyes. AMOLED screens look richer but are not essential.",
          "Camera: do not judge by megapixels alone. Real photo samples and reviews tell you more than the number on the box.",
        ],
      },
      {
        heading: "Check network support and dual SIM",
        paragraphs: [
          "Make sure the phone supports 4G on the networks you use, and 5G only if your area actually has coverage. Many Kenyans carry two lines, so a dual-SIM phone is usually worth it.",
        ],
      },
      {
        heading: "Before you pay",
        bullets: [
          "Confirm the exact model, colour, storage and what comes in the box (charger, cable, earphones).",
          "Ask about the warranty and how to claim it.",
          "Open the phone with the delivery rider if you can, power it on and check the screen, camera and charging port.",
          "Dial *#06# to see the phone's IMEI and make sure it matches the box.",
        ],
      },
    ],
  },
  {
    slug: "shopping-online-safely-with-m-pesa",
    title: "Shopping online safely with M-Pesa",
    summary: "How to pay by M-Pesa online without getting scammed, and what to do if something goes wrong.",
    sections: [
      {
        heading: "How an M-Pesa checkout should work",
        paragraphs: [
          "When you pay for an online order, the shop sends a payment prompt to your phone. You see the amount and the business name, and you approve it by entering your M-Pesa PIN on your own phone. You should never have to send money to a personal number to buy something from a shop.",
        ],
      },
      {
        heading: "Golden rules",
        bullets: [
          "Never share your M-Pesa PIN, with anyone, for any reason. A real shop will never ask for it.",
          "Check the amount on the prompt matches your order total before you enter your PIN.",
          "Be wary of deals that are far cheaper than everywhere else - if it looks too good to be true, it usually is.",
          "Shop on websites you recognise and check the address in your browser carefully. Look for the padlock symbol.",
          "Keep your M-Pesa confirmation SMS and your order number until the item has arrived and you are happy with it.",
        ],
      },
      {
        heading: "Check the shop before you buy",
        paragraphs: [
          "A trustworthy shop has clear contact details, a delivery and returns policy, a privacy policy and real customer reviews. If you cannot find these, think twice. You can read ours on the Contact us, Delivery and returns, and Privacy pages.",
        ],
      },
      {
        heading: "If something goes wrong",
        bullets: [
          "Contact the shop straight away with your order number and M-Pesa message.",
          "If you paid the wrong amount or the wrong number, contact Safaricom customer care promptly to ask about a reversal.",
          "Report any fraud to the police and to Safaricom.",
        ],
      },
    ],
  },
  {
    slug: "caring-for-your-electronics-and-making-them-last",
    title: "Caring for your electronics and making them last",
    summary: "Simple habits that protect your phone, earbuds, laptop and appliances from early failure.",
    sections: [
      {
        heading: "Look after the battery",
        paragraphs: [
          "Batteries wear out faster when they are very hot or regularly drained to zero. Avoid leaving your phone in a hot car or under a pillow while it charges, and try to top it up before it hits 10 percent. Use the charger that came with the device, or a good quality one, as cheap chargers can damage batteries.",
        ],
      },
      {
        heading: "Protect against dust, water and drops",
        bullets: [
          "Use a case and a screen protector on your phone from day one.",
          "Keep devices away from water and wipe off spills straight away. Do not charge a wet device.",
          "Do not pack a laptop with heavy items on top, and carry it in a padded bag.",
        ],
      },
      {
        heading: "Deal with power problems",
        paragraphs: [
          "Power surges are common and can damage electronics. A surge protector is a cheap way to protect your TV, laptop and kitchen appliances. Unplug expensive devices during storms.",
        ],
      },
      {
        heading: "Keep things clean and updated",
        bullets: [
          "Clean charging ports gently with a dry soft brush - lint stops cables from connecting properly.",
          "Install software updates, which fix bugs and security problems.",
          "Free up storage regularly so the device stays quick.",
          "Clean laptop vents so the machine does not overheat.",
        ],
      },
      {
        heading: "Keep your receipts and warranty",
        paragraphs: [
          "Keep your receipt and the box for the warranty period. If a product develops a fault soon after purchase, contact the seller quickly with your order number.",
        ],
      },
    ],
  },
  {
    slug: "setting-up-a-small-kitchen-on-a-budget",
    title: "Setting up a small kitchen on a budget",
    summary: "The appliances and tools that are worth buying first when you are moving into your own place.",
    sections: [
      {
        heading: "Start with the essentials",
        paragraphs: [
          "Moving into a new room or house means buying a lot at once. Prioritise the things you will use every day, and add the rest later as your budget allows.",
        ],
      },
      {
        heading: "A sensible shopping order",
        bullets: [
          "A reliable cooker or gas stove, and a gas cylinder or electric hotplate.",
          "A few sufurias (cooking pots) with lids, and one non-stick frying pan.",
          "An electric kettle - fast, safe and cheaper than boiling on a stove for tea and hot water.",
          "Sharp kitchen knives, a chopping board and basic utensils.",
          "Plates, cups and cutlery for the number of people you actually feed.",
          "Food containers to store leftovers and keep food fresh.",
        ],
      },
      {
        heading: "Appliances worth the money",
        paragraphs: [
          "A blender saves time for smoothies, soups and sauces. A rice cooker or multi-cooker helps if you cook after a long day. A refrigerator is a bigger purchase, but it reduces food waste and saves money over time.",
        ],
      },
      {
        heading: "Buying smart",
        bullets: [
          "Check the power rating (watts) so the appliance suits your electricity use and sockets.",
          "Look for products with clear specifications and what is in the box.",
          "Read customer reviews and check the delivery and returns policy before you pay.",
          "Avoid buying everything at once - spread purchases across a few weeks.",
        ],
      },
    ],
  },
];

export const guides: Guide[] = [...coreGuides, ...moreGuides];

export const findGuide = (slug: string) => guides.find((g) => g.slug === slug);

import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';

const RESTAURANT_DATASET = `
Available Restaurants & Menus:
1. Spice Junction
   - Cuisine: North Indian
   - Dietary Tags: [Veg], [Non-Veg]
   - Menu:
     * Butter Chicken (₹420) - Spice: Medium 🌶️🌶️ | Tag: Non-Veg | Image: [https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D?auto=format&fit=crop&w=300&q=80)
     * Paneer Tikka (₹320) - Spice: Mild 🌶️ | Tag: Pure Veg | Image: [https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=300&q=80)
     * Dal Makhani (₹280) - Spice: Mild 🌶️ | Tag: Pure Veg / Jain Available | Image: [https://images.unsplash.com/photo-1655785382092-4829c8d9c11a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1655785382092-4829c8d9c11a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D?auto=format&fit=crop&w=300&q=80)
   - Timings: 12:00 PM - 11:00 PM

2. Bella Italia
   - Cuisine: Italian, Continental
   - Dietary Tags: [Veg], [Non-Veg]
   - Menu:
     * Margherita Pizza (₹450) - Spice: Mild 🌶️ | Tag: Pure Veg | Image: [https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=300&q=80)
     * Alfredo Pasta (₹390) - Spice: Mild 🌶️ | Tag: Pure Veg / Gluten-Free Option | Image: [https://images.unsplash.com/photo-1686565510178-52c69af8be37?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1686565510178-52c69af8be37?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D?auto=format&fit=crop&w=300&q=80)
   - Timings: 1:00 PM - 10:30 PM

3. Green Bowl
   - Cuisine: Healthy, Salad
   - Dietary Tags: [100% Pure Veg], [Gluten-Free], [Vegan]
   - Menu:
     * Avocado Salad (₹350) - Spice: None | Tag: Vegan / Gluten-Free | Image: [https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80)
     * Quinoa Bowl (₹380) - Spice: None | Tag: Vegan / High Protein | Image: [https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80](https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80)
   - Timings: 9:00 AM - 9:00 PM
`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is missing.' }, { status: 500 });
    }

    const body = await req.json();
    const groq = new Groq({ apiKey });

    const messages = body.messages || [];
    const pastSessionsContext = body.pastSessionsContext || '';
    const activeFilter = body.activeFilter || 'All';

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    const recentMessages = messages.slice(-8);

    const systemPrompt = `You are an interactive AI dining assistant.

DATASET:
${RESTAURANT_DATASET}

${pastSessionsContext ? `USER PREVIOUS HISTORY / MEMORY FROM OTHER SESSIONS:
${pastSessionsContext}

PERSONALIZATION RULE:
- Check past history for dietary preferences (e.g., Pure Veg, Jain, Low-Spice, or past dishes enjoyed).
- Proactively greet returning users and suggest personalized options based on their history.` : ''}

${activeFilter !== 'All' ? `ACTIVE DIETARY FILTER: [${activeFilter}]
Strictly prioritize and filter menu suggestions that match the "${activeFilter}" preference.` : ''}

RULES FOR INTERACTIVE DIALOGUE:
1. DIETARY TAGS & SPICE METERS:
   - Always list dietary badges ([Pure Veg], [Vegan], [Gluten-Free]) and spice indicators (🌶️) next to menu items.

2. TABLE RESERVATIONS:
   - Collect Restaurant Name, Guest Count, Date, and Time step-by-step.
   - Output booking JSON strictly when all details are gathered:
\`\`\`booking
{
  "status": "Confirmed",
  "restaurant": "Spice Junction",
  "guests": 2,
  "date": "Today",
  "time": "8:00 PM",
  "bookingId": "BK-${Math.floor(1000 + Math.random() * 9000)}"
}
\`\`\`

3. FEEDBACK / RATING REQUEST:
   - When a booking is confirmed or the user finishes exploring, render a feedback card block:
\`\`\`feedback
{
  "bookingId": "BK-9842",
  "restaurant": "Spice Junction"
}
\`\`\``;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentMessages,
      ],
      model: 'openai/gpt-oss-120b',
    });

    const reply = completion.choices[0]?.message?.content || 'No response received.';
    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
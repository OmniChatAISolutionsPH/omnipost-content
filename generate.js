const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// ===== CONFIGURATION =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 CONFIGURATION CHECK:');
console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== MGA TOPICS (para iba-iba araw-araw) =====
const topics = [
  {
    title: "Ang hirap maghanap ng customers? 😩",
    angle: "lead_generation",
    hook: "Alam mo ba na may secret weapon ang mga top businesses para makakuha ng maraming customers? 🤫"
  },
  {
    title: "Pagod ka na ba sa paulit-ulit na tanong? 😓",
    angle: "customer_support",
    hook: "Isipin mo, habang tulog ka, may sumasagot na sa lahat ng inquiries mo! 💤🤖"
  },
  {
    title: "Gusto mo ng 24/7 na empleyado na hindi nagre-request ng OT pay? 🤖",
    angle: "automation_benefits",
    hook: "May kakilala akong small business owner na dating puyat na puyat — ngayon, relax na lang siya! 😌"
  },
  {
    title: "Ang AI ay hindi kaaway, kaibigan mo ito! 🤝",
    angle: "ai_myth",
    hook: "Maraming takot sa AI, pero ang totoo, ito ang magiging pinakamatalino mong empleyado. 🧠"
  },
  {
    title: "5 taon kang nagtiis sa manual na trabaho. Sa AI, 5 minuto lang! ⏱️",
    angle: "time_saving",
    hook: "Kung alam mo lang kung gaano kadali ang buhay gamit ang automation, baka nag-start ka na noon pa! 😅"
  },
  {
    title: "Habang nagcha-chat ka, may kumikita na! 💰",
    angle: "passive_income",
    hook: "Habang nag-aalmusal ka, may mga negosyanteng may 10 bagong leads na — galing sa AI! 🥐📊"
  }
];

// ===== PUMILI NG RANDOM TOPIC BATAY SA ARAW =====
function getTopicForToday() {
  const day = new Date().getDate(); // 1-31
  const index = (day - 1) % topics.length;
  return topics[index];
}

// ===== GEMINI API - CONTENT GENERATOR =====
async function generateContent() {
  console.log('🤖 Generating fresh content with Gemini...');
  
  const topic = getTopicForToday();
  console.log('📌 Today\'s topic:', topic.title);
  
  const prompt = `Ikaw ang pinaka-malupit na Filipino content creator. Gumawa ng isang sobrang engaging na Facebook post para sa page ng OmniChat AI Solutions PH.

TOPIC: "${topic.title}"
ANGLE: ${topic.angle}
HOOK: "${topic.hook}"

TARGET AUDIENCE: Filipino small business owners, freelancers, online sellers, startups.

LEAD MAGNET LINK (isama sa post): https://omnichataisolutionsph.github.io/omnichat-optin/

PROMO: "50% OFF sa First Month para sa unang 10 customers!"

REQUIREMENTS:
- Haba: 8-15 sentences
- May "hook" sa unang 2 sentences
- May personal na kwento o scenario na relatable
- May explanation ng benefits ng AI automation
- May mention ng services at promo
- May call-to-action: "Kunin ang FREE AI Automation Starter Kit" at "I-message kami para sa free consultation"
- May hashtags sa dulo (#AIAutomationPH #SmallBusinessTips #OmniChatAI)
- Parang nagkukuwento lang sa kaibigan, hindi nagbebenta
- IBA sa mga naunang posts — gumamit ng bagong anggulo at istorya

Output format (exact JSON):
{
  "caption": "dito ang buong caption",
  "image_prompt": "dito ang prompt para sa infographic"
}

Return ONLY the JSON.`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.95,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    console.log('📝 Gemini response:', content);
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Parsed JSON successfully');
      return parsed;
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (error) {
    console.error('❌ Error generating content:', error);
    // Fallback content (iba-iba depende sa topic)
    const fallbackTopics = [
      "Nagsasawa ka na bang mag-reply sa inquiries? 😩 Ang AI chatbot ang solusyon! 24/7 support kahit tulog ka. 💤🤖",
      "Gusto mo ng mas maraming customers? Ang AI lead generation ang sikreto ng mga top businesses! 📊🚀",
      "Takot ka ba sa AI? Huwag! Ito ang magiging pinakamatalino mong empleyado. 🤝🧠",
      "5 taon kang nagtiis sa manual work. Sa AI, 5 minuto lang! ⏱️😱"
    ];
    const randomIndex = Math.floor(Math.random() * fallbackTopics.length);
    return {
      caption: `${topic.hook}\n\n${fallbackTopics[randomIndex]}\n\nKunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/\n\nI-message kami para sa free consultation! 📩\n\n#AIAutomationPH #SmallBusinessTips #OmniChatAI`,
      image_prompt: `Futuristic AI technology helping a small Filipino business owner, ${topic.angle}, modern workspace, cyberpunk style, neon blue and purple, infographic style, high quality, 1080x1080`
    };
  }
}

// ===== SAVE TO SUPABASE =====
async function saveToSupabase(caption, imagePrompt) {
  console.log('💾 Saving to Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('content_queue')
      .insert([{
        caption: caption,
        image_prompt: imagePrompt,
        status: 'pending'
      }]);

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log('✅ Saved to Supabase!');
    return true;
  } catch (error) {
    console.error('❌ Error saving:', error);
    return false;
  }
}

// ===== MAIN =====
async function main() {
  console.log('🚀 Starting OmniPost AI - FRESH CONTENT MODE...');
  console.log('⏰ Time:', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));

  const { caption, image_prompt } = await generateContent();
  console.log('\n📝 CAPTION:\n', caption);
  console.log('\n🎨 IMAGE PROMPT:\n', image_prompt);

  await saveToSupabase(caption, image_prompt);
  console.log('\n✅ Content saved to Supabase! Ready for Make.com to post.');
}

main().catch(console.error);

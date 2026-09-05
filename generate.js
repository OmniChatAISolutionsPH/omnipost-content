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

// ===== MGA TOPICS NA IBA-IBA ARAW-ARAW =====
const topics = [
  "Kung nahihirapan ka sa customer inquiries, ang AI chatbot ang solusyon! 💬🤖",
  "Ang AI automation ay hindi para sa malalaking kumpanya lang — kahit small business, pwedeng-pwede! 🏪🚀",
  "Habang tulog ka, may AI na sumasagot sa customers mo. Gising na! 🌙💡",
  "Ang AI ay hindi kaaway ng empleyado — ito ang bagong katulong mo! 🤝✨",
  "5 taon kang nahirapan maghanap ng customers — sa AI, 5 minuto lang! ⏱️🔥",
  "Gusto mo bang doble ang leads mo ngayong buwan? Eto ang sikreto ng mga top businesses! 📈💰"
];

// ===== PUMILI NG TOPIC BATAY SA ARAW =====
function getTodaysTopic() {
  const day = new Date().getDate(); // 1-31
  const index = (day - 1) % topics.length;
  return topics[index];
}

// ===== GEMINI API - CONTENT GENERATOR =====
async function generateContent() {
  console.log('🤖 Generating fresh content with Gemini...');
  
  const topic = getTodaysTopic();
  console.log('📌 Today\'s topic:', topic);
  
  const prompt = `Gumawa ng isang engaging Facebook post para sa AI automation agency sa Pilipinas.

Topic: "${topic}"

Requirements:
- Haba: 5-10 sentences
- Taglish (Tagalog + English)
- May emoji
- May call-to-action: "Kunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/"
- May promo: "50% OFF sa First Month!"
- Hashtags: #AIAutomationPH #SmallBusinessTips #OmniChatAI

Output format:
{
  "caption": "dito ang caption",
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
          temperature: 0.9,
          maxOutputTokens: 500
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
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Parsed JSON successfully');
      return parsed;
    } else {
      throw new Error('No JSON found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    // Fallback na iba-iba ang content
    const fallbacks = [
      "Nagsasawa ka na bang mag-reply sa inquiries 24/7? 😩 Ang AI chatbot ang solusyon! 24/7 support kahit tulog ka. 💤🤖",
      "Gusto mo ng mas maraming customers? Ang AI lead generation ang sikreto ng mga top businesses! 📊🚀",
      "Takot ka ba sa AI? Huwag! Ito ang magiging pinakamatalino mong empleyado. 🤝🧠",
      "5 taon kang nagtiis sa manual work. Sa AI, 5 minuto lang! ⏱️😱"
    ];
    const randomIndex = Math.floor(Math.random() * fallbacks.length);
    return {
      caption: `${topic}\n\n${fallbacks[randomIndex]}\n\nKunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/\n\nI-message kami para sa free consultation! 📩\n\n#AIAutomationPH #SmallBusinessTips #OmniChatAI`,
      image_prompt: `Futuristic AI technology helping a small Filipino business owner, modern workspace, neon blue and purple, infographic style, high quality, 1080x1080`
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
  console.log('🚀 Starting OmniPost AI...');
  console.log('⏰ Time:', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));

  const { caption, image_prompt } = await generateContent();
  console.log('\n📝 CAPTION:\n', caption);

  await saveToSupabase(caption, image_prompt);
  console.log('\n✅ Content saved to Supabase!');
}

main().catch(console.error);

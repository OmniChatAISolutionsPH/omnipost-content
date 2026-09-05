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

// ===== KUNIN ANG MGA NAUNANG CONTENT =====
async function getPreviousContent() {
  console.log('📚 Checking previous content...');
  
  const { data, error } = await supabase
    .from('content_queue')
    .select('caption')
    .order('created_at', { ascending: false })
    .limit(20); // Kunin ang huling 20 posts

  if (error) {
    console.error('❌ Error fetching previous content:', error);
    return [];
  }

  console.log(`📚 Found ${data.length} previous posts`);
  return data.map(item => item.caption);
}

// ===== GEMINI API - CONTENT GENERATOR (WITHOUT REPETITION) =====
async function generateContent(previousCaptions) {
  console.log('🤖 Gemini, gumawa ka ng bagong topic...');
  
  const previousText = previousCaptions.length > 0 
    ? `\n\n⚠️ HUWAG UULITIN ANG MGA SUMUSUNOD NA TOPIC O CONTENT:\n${previousCaptions.map((c, i) => `${i+1}. ${c.substring(0, 100)}...`).join('\n')}`
    : '';

  const prompt = `Ikaw ang pinaka-malupit na Filipino content creator at social media strategist.

Gumawa ng isang sobrang engaging na Facebook post para sa page ng OmniChat AI Solutions PH — isang AI Automation Agency na tumutulong sa mga small businesses sa Pilipinas.

IMPORTANTE: 
- Ikaw ang bahala sa TOPIC. Pumili ka ng bago at fresh na topic.
- BAWAL UULITIN ang mga topic na nagawa na.${previousText}

Siguraduhing:
- Fresh at bago ang topic (hindi pa nagawa)
- Makaka-relate ang small business owners
- May value at matututunan nila

REQUIREMENTS SA POST:
- Haba: 8-15 sentences
- May "hook" sa unang 2 sentences
- May personal na kwento o scenario na relatable
- May explanation ng benefits ng AI automation
- May mention ng promo: "50% OFF sa First Month"
- May call-to-action: "Kunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/"
- May hashtags: #AIAutomationPH #SmallBusinessTips #OmniChatAI
- Parang nagkukuwento lang sa kaibigan
- Gumamit ng Taglish

Output format:
{
  "caption": "dito ang buong caption",
  "image_prompt": "dito ang detailed prompt para sa infographic"
}

Return ONLY the JSON.`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent', {
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
    // Fallback na random
    const fallbacks = [
      "Gising na, mga ka-OmniChat! 🌅 Ang AI automation ay hindi na para sa malalaking kumpanya lang — kahit small business, pwedeng-pwede na! 🚀",
      "Nakakapagod na mag-reply sa inquiries 24/7? 😩 Ang AI chatbot ang solusyon! 💬🤖",
      "Habang tulog ka, may AI na sumasagot sa customers mo. Gising na! 🌙💡"
    ];
    const randomIndex = Math.floor(Math.random() * fallbacks.length);
    return {
      caption: `${fallbacks[randomIndex]}\n\nKunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/\n\nI-message kami para sa free consultation! 📩\n\n#AIAutomationPH #SmallBusinessTips #OmniChatAI`,
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
  console.log('🚀 Starting OmniPost AI - NO REPETITION MODE...');
  console.log('⏰ Time:', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));

  // Kunin ang mga nakaraang content
  const previousCaptions = await getPreviousContent();
  
  // Generate ng bagong content (iwasan ang repetition)
  const { caption, image_prompt } = await generateContent(previousCaptions);
  console.log('\n📝 NEW CAPTION:\n', caption);

  await saveToSupabase(caption, image_prompt);
  console.log('\n✅ New content saved to Supabase!');
}

main().catch(console.error);

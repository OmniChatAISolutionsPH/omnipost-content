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

// ===== GEMINI API - CONTENT GENERATOR (SI AI NA ANG BAHALA) =====
async function generateContent() {
  console.log('🤖 Gemini, ikaw na ang bahala sa topic ngayon...');
  
  const prompt = `Ikaw ang pinaka-malupit na Filipino content creator at social media strategist.

Gumawa ng isang sobrang engaging na Facebook post para sa page ng OmniChat AI Solutions PH — isang AI Automation Agency na tumutulong sa mga small businesses sa Pilipinas.

IMPORTANTE: Ikaw ang bahala sa TOPIC. Pumili ka ng anumang relevant at interesting na topic tungkol sa AI automation para sa small businesses. Basta dapat:
- Fresh at bago (hindi paulit-ulit)
- Makaka-relate ang small business owners
- May value at matututunan nila

Mga pwedeng pagpilian (pero hindi limited dito):
- Paano makatipid ng oras gamit ang AI
- Bakit 24/7 support ang kailangan ng customers
- AI lead generation secrets
- AI vs manual work
- Paano magsimula sa AI kahit walang technical background
- Mga common mistakes sa AI automation
- AI tools na pwedeng gamitin ng small businesses
- Ano ang future ng AI sa Pilipinas

REQUIREMENTS SA POST:
- Haba: 8-15 sentences
- May "hook" sa unang 2 sentences — dapat mapahinto ang reader
- May personal na kwento o scenario na relatable
- May explanation ng benefits ng AI automation
- May mention ng services at promo: "50% OFF sa First Month"
- May call-to-action: "Kunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/"
- May hashtags: #AIAutomationPH #SmallBusinessTips #OmniChatAI
- Parang nagkukuwento lang sa kaibigan, hindi nagbebenta
- Gumamit ng Taglish (Tagalog + English)

Output format:
{
  "caption": "dito ang buong caption",
  "image_prompt": "dito ang detailed prompt para sa infographic"
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
    return {
      caption: `Gising na, mga ka-OmniChat! 🌅\n\nAlam mo ba na may mga small business owners na kumikita na habang tulog sila? 😱\n\nAng sikreto? AI automation! 🤖\n\nHindi ito para sa malalaking kumpanya lang — kahit ikaw, pwedeng-pwede ka nang magkaroon ng 24/7 customer support at automatic lead capture. 💡\n\nMay 50% OFF sa first month para sa unang 10 customers! 🎉\n\nKunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/\n\nI-message mo na kami para sa free consultation! 📩\n\n#AIAutomationPH #SmallBusinessTips #OmniChatAI`,
      image_prompt: `Futuristic AI technology helping a small Filipino business owner, modern workspace, cyberpunk style, neon blue and purple, infographic style, high quality, 1080x1080`
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
  console.log('🚀 Starting OmniPost AI - AI CHOOSES TOPIC MODE...');
  console.log('⏰ Time:', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));

  const { caption, image_prompt } = await generateContent();
  console.log('\n📝 CAPTION:\n', caption);

  await saveToSupabase(caption, image_prompt);
  console.log('\n✅ Content saved to Supabase! Ready for Make.com to post.');
}

main().catch(console.error);

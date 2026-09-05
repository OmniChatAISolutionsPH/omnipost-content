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

// ===== KUNIN ANG MGA NAUNANG CONTENT (caption AT image_prompt) =====
async function getPreviousContent() {
  console.log('📚 Checking previous content...');

  const { data, error } = await supabase
    .from('content_queue')
    .select('caption, image_prompt')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error fetching previous content:', error);
    return { captions: [], imagePrompts: [] };
  }

  console.log(`📚 Found ${data.length} previous posts`);
  return {
    captions: data.map(item => item.caption),
    imagePrompts: data.map(item => item.image_prompt).filter(Boolean),
  };
}

// ===== GEMINI API - CONTENT GENERATOR (WITHOUT REPETITION) =====
async function generateContent(previousCaptions, previousImagePrompts) {
  console.log('🤖 Gemini, gumawa ka ng bagong topic...');

  const previousCaptionsText = previousCaptions.length > 0
    ? `\n\n⚠️ HUWAG UULITIN ANG MGA SUMUSUNOD NA TOPIC O CONTENT:\n${previousCaptions.map((c, i) => `${i+1}. ${c.substring(0, 100)}...`).join('\n')}`
    : '';

  const previousImagesText = previousImagePrompts.length > 0
    ? `\n\n⚠️ HUWAG ULITIN ANG MGA SUMUSUNOD NA VISUAL CONCEPT/SCENE PARA SA IMAGE_PROMPT (gumawa ng bagong scene, ibang setting, ibang visual metaphor kada post):\n${previousImagePrompts.map((p, i) => `${i+1}. ${p.substring(0, 120)}...`).join('\n')}`
    : '';

  const prompt = `Ikaw ang pinaka-malupit na Filipino content creator at social media strategist.

Gumawa ng isang sobrang engaging na Facebook post para sa page ng OmniChat AI Solutions PH — isang AI Automation Agency na tumutulong sa mga small businesses sa Pilipinas.

IMPORTANTE:
- Ikaw ang bahala sa TOPIC. Pumili ka ng bago at fresh na topic.
- BAWAL UULITIN ang mga topic na nagawa na.${previousCaptionsText}

Siguraduhing:
- Fresh at bago ang topic (hindi pa nagawa)
- Makaka-relate ang small business owners
- May value at matututunan nila

REQUIREMENTS SA CAPTION:
- HABA: minimum 120 words, 8-15 sentences.
- May "hook" sa unang 2 sentences
- May personal na kwento o scenario na relatable
- May explanation ng benefits ng AI automation
- May mention ng promo: "50% OFF sa First Month"
- May call-to-action: "Kunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/"
- May hashtags: #AIAutomationPH #SmallBusinessTips #OmniChatAI
- Parang nagkukuwento lang sa kaibigan
- Gumamit ng Taglish

REQUIREMENTS SA IMAGE_PROMPT:
- Kailangan direktang kaugnay at specific sa TOPIC/KWENTO ng caption na ito
- Magdetalye ng specific na scene na naiiba sa mga naunang image prompts.${previousImagesText}
- Isama ang: setting, mood, color palette, style, aspect ratio (1080x1080)

MAHALAGA: Panatilihing MAIKSI at DIRETSO ang bawat parte — huwag nang magdagdag ng ibang komento o paliwanag bukod sa JSON. Sundin ang word count nang eksakto, huwag lumagpas ng masyado.

Output format (JSON lang, walang ibang text bago o pagkatapos):
{"caption": "...", "image_prompt": "..."}`;

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
          temperature: 1.0,
          maxOutputTokens: 4096,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    const finishReason = data.candidates?.[0]?.finishReason;
    console.log('🏁 Finish reason:', finishReason);
    if (finishReason === 'MAX_TOKENS') {
      console.error('⚠️ Naputol ang response dahil naabot ang max tokens limit.');
    }

    let content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('📝 Gemini raw response (full):', content);

    if (!content) {
      throw new Error('Walang laman ang response mula kay Gemini');
    }

    // Alisin ang markdown code fences (```json ... ```) kung meron
    content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

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

  const { captions: previousCaptions, imagePrompts: previousImagePrompts } = await getPreviousContent();

  const { caption, image_prompt } = await generateContent(previousCaptions, previousImagePrompts);
  console.log('\n📝 NEW CAPTION:\n', caption);
  console.log('\n🖼️ NEW IMAGE PROMPT:\n', image_prompt);

  await saveToSupabase(caption, image_prompt);
  console.log('\n✅ New content saved to Supabase!');
}

main().catch(console.error);

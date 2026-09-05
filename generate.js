const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// ===== CONFIGURATION =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 CONFIGURATION CHECK:');
console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_KEY:', SUPABASE_KEY ? '✅ Set' : '❌ Missing');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== GEMINI API - SUPER VIRAL CONTENT GENERATOR =====
async function generateContent() {
  console.log('🤖 Generating VIRAL content with Gemini...');
  
  const prompt = `Ikaw ang pinaka-malupit at creative na Filipino social media content creator. Ang goal mo ay gumawa ng posts na magvi-viral at makakakuha ng maraming engagement.

Bawat post ay dapat:
1. **MAKAKA-RELATE** - parang sinasabi mo ang iniisip ng small business owners
2. **MAY EMOSYON** - nakakatawa, nakaka-inspire, o nakaka-ngiti
3. **MAY VALUE** - may matututunan ang reader
4. **MAY CALL-TO-ACTION** - may gagawin sila pagkatapos basahin
5. **MAY PERSONALITY** - parang kaibigan lang kausap, hindi robot

Lead Magnet Link (isama sa bawat post): https://omnichataisolutionsph.github.io/omnichat-optin/

---

GUMAWA NG 1 POST gamit ang isa sa mga topics na ito (pumili ng pinaka-relevant ngayon):

1. "Ang hirap maghanap ng customers? Eto ang sikreto ng mga top businesses ngayon. 🤫"
2. "Nakakapagod na mag-reply sa inquiries 24/7? Eto ang ginagawa ng mga matatalinong negosyante. 💡"
3. "Habang tulog ka, may kumikita na gamit ang AI. Gising na! 🚀"
4. "5 taon kang nagtiis sa manual na trabaho. Sa AI, 5 minuto lang. 😱"
5. "Ang AI ay hindi kaaway. Ito ang magiging pinakamatalino mong empleyado. 🤝"
6. "Bakit ang hirap mag-follow up sa leads? Eto ang solusyon! 📊"
7. "Ano ang ginagawa ng mga top businesses na hindi mo ginagawa? AI Automation! 🎯"

REQUIREMENTS:
- Haba: 5-10 sentences
- Parang nagkukuwento lang sa kaibigan
- May emoji sa halos bawat sentence
- May nakakatawa o nakaka-relate na opening
- May mahalagang lesson o insight
- May PROMO: "First month 50% OFF sa unang 10 customers!"
- May CTA: "I-message kami para sa FREE consultation" at i-link ang lead magnet
- Gumamit ng Taglish (Tagalog + English)
- Hindi boring, hindi puro technical
- Parang gusto mong basahin hanggang dulo

EXAMPLES NG MAGANDANG POST:

"Gising na, mga negosyante! 😅 Alam niyo ba na habang tulog kayo, may mga kumikita na gamit ang AI? 🤖 Oo, totoo 'yan! Habang kayo'y nagre-reply sa inquiries nang paisa-isa, ang iba ay naka-auto pilot na. 💡

Ang AI automation ay hindi para sa malalaking kumpanya lang. Kahit small business owner ka, pwedeng-pwede ka nang magkaroon ng 24/7 customer support, automatic lead capture, at social media auto-reply. 🚀

At ang best part? Hindi ito kasing mahal ng iniisip mo. 😱 May mga plans na nagsisimula sa ₱1,000/month lang — at may 50% OFF pa sa first month para sa unang 10 customers! 🎉

Gusto mong matuto? Kunin ang FREE AI Automation Starter Kit dito: https://omnichataisolutionsph.github.io/omnichat-optin/

I-message mo na kami ngayon para sa FREE consultation. Tatawagan ka ni Bernard sa loob ng 24 oras. 📞

#AIAutomation #SmallBusinessPH #OmniChatAI #BusinessTips #DigitalPH"

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
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    console.log('📝 Raw content:', content);
    
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
      caption: `Gising na, mga negosyante! 😅 Habang binabasa mo ito, may mga kumikita na gamit ang AI. 🚀\n\nAng AI automation ay hindi para sa malalaking kumpanya lang. Kahit small business owner ka, pwedeng-pwede ka nang magkaroon ng 24/7 customer support at automatic lead capture. 💡\n\nMay 50% OFF pa sa first month para sa unang 10 customers! 🎉\n\nKunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/\n\nI-message mo na kami para sa FREE consultation. 📞\n\n#AIAutomation #SmallBusinessPH #OmniChatAI`,
      image_prompt: 'Futuristic AI technology helping a small Filipino business owner, modern workspace, cyberpunk style, neon blue and purple, infographic style, high quality, 1080x1080, motivational, vibrant colors, Filipino flag elements, modern business theme'
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
  console.log('🚀 Starting OmniPost AI - VIRAL CONTENT MODE...');
  console.log('⏰ Time:', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));

  const { caption, image_prompt } = await generateContent();
  console.log('\n📝 CAPTION:\n', caption);
  console.log('\n🎨 IMAGE PROMPT:\n', image_prompt);

  await saveToSupabase(caption, image_prompt);
  console.log('\n✅ Content saved to Supabase! Ready for Make.com to post.');
}

main().catch(console.error);

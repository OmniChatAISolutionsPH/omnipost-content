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

// ===== GEMINI API - VIRAL CONTENT GENERATOR =====
async function generateContent() {
  console.log('🤖 Generating VIRAL content with Gemini...');
  
  const systemPrompt = `Ikaw ang pinaka-malupit na Filipino content creator at social media strategist. 
Ang specialty mo ay gumawa ng posts na nagvi-viral at nakakakuha ng maraming engagement.

Mga dapat tandaan:
- Gumamit ng "hook" sa unang linya - dapat mapahinto ang reader
- Magkwento na parang kaibigan lang, hindi parang salesperson
- Maging relatable - dapat masabi ng reader "ah same!" o "totoo 'yan!"
- Magbigay ng value - may matututunan sila
- Gumamit ng conversational Taglish - parang nagcha-chat lang
- Maglagay ng emoji para may personality
- I-end with a call-to-action - dapat may gagawin sila

Ang goal: Makakuha ng leads at engagement, hindi lang likes.`;

  const userPrompt = `Gumawa ng isang sobrang engaging na Facebook post para sa page ng OmniChat AI Solutions PH.

TARGET AUDIENCE: Filipino small business owners, freelancers, online sellers, at startups.

LEAD MAGNET LINK (isama sa bawat post): https://omnichataisolutionsph.github.io/omnichat-optin/

PROMO: "50% OFF sa First Month para sa unang 10 customers!"

---

PUMILI NG ISA SA MGA TOPICS NA ITO:

1. "Ang hirap talaga maghanap ng customers no? 😩"
   → I-kwento ang struggle ng paghahanap ng leads, tapos i-introduce ang AI lead generation

2. "Gusto mo bang magkaroon ng 24/7 na empleyado na hindi nagre-request ng OT pay? 🤖"
   → I-kwento ang benefits ng AI chatbot para sa small business

3. "Alam mo ba na habang tulog ka, may mga negosyanteng kumikita na? 😱"
   → I-kwento ang concept ng passive income through automation

4. "Pagod ka na ba sa paulit-ulit na tanong ng customers? 😅"
   → I-kwento ang solution ng AI FAQ automation

5. "May 1 million ka bang piso? Kasi eto ang sikreto ng mga mayayamang negosyante! 💰"
   → I-kwento ang ROI ng AI automation

---

REQUIREMENTS SA CAPTION:
- Haba: 8-15 sentences (mahaba, may laman)
- May "hook" sa unang 2 sentences
- May personal na kwento o scenario na relatable
- May explanation ng benefits ng AI automation
- May mention ng services at promo
- May call-to-action: "Kunin ang FREE AI Automation Starter Kit" at "I-message kami para sa free consultation"
- May hashtags sa dulo (#AIAutomationPH #SmallBusinessTips #OmniChatAI)
- Parang nagkukuwento lang sa kaibigan, hindi nagbebenta

---

MAGANDANG HALIMBAWA:

"Gising na, mga ka-OmniChat! 🌅

Alam niyo ba na may kakilala akong small business owner na dati ay puyat na puyat kakareply sa inquiries? 😩

Araw-araw, paulit-ulit ang mga tanong: 'Magkano?' 'Paano mag-order?' 'Available pa ba?' — nakakapagod, diba? 😓

Pero ngayon? Relax na siya. 😌 May AI chatbot na siyang sumasagot sa customers 24/7, kahit tulog siya! 🤖

Habang siya ay nag-e-enjoy sa family time, ang bot naman ay kumukuha ng leads at nagre-reply sa inquiries. 💡

Hindi ito para sa malalaking kumpanya lang. Kahit ikaw, may negosyo ka man o freelancer, pwedeng-pwede ka nang magkaroon ng AI assistant. 🚀

At ang best part? May 50% OFF sa first month para sa unang 10 customers! 🎉

Gusto mong matuto? Kunin mo na ang FREE AI Automation Starter Kit dito: 👇
https://omnichataisolutionsph.github.io/omnichat-optin/

May tanong? I-message mo lang kami — free consultation pa 'yan! 📩

#AIAutomationPH #SmallBusinessTips #OmniChatAI #BusinessGrowth #DigitalPH"

---

NGAYON, GUMAWA KA NG BAGONG POST (iba sa example) gamit ang isa sa mga topics sa itaas.

Output format:
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
          parts: [{ text: systemPrompt + '\n\n' + userPrompt }]
        }],
        generationConfig: {
          temperature: 0.9,
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
      caption: `Gising na, mga ka-OmniChat! 🌅\n\nAlam mo ba na may kakilala akong business owner na dati ay puyat na puyat kakareply sa inquiries? 😩 Pero ngayon, relax na siya dahil may AI chatbot na siyang sumasagot 24/7! 🤖\n\nHabang siya ay tulog, ang bot naman ay kumukuha ng leads at nagre-reply sa customers. 💡\n\nHindi ito para sa malalaking kumpanya lang — kahit ikaw, pwedeng-pwede ka nang magkaroon ng AI assistant. 🚀\n\nMay 50% OFF sa first month para sa unang 10 customers! 🎉\n\nKunin ang FREE AI Automation Starter Kit: https://omnichataisolutionsph.github.io/omnichat-optin/\n\nI-message mo na kami para sa free consultation! 📩\n\n#AIAutomationPH #SmallBusinessTips #OmniChatAI`,
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

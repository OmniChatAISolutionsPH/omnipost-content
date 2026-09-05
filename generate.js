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

// ===== GEMINI API - CONTENT GENERATOR =====
async function generateContent() {
  console.log('🤖 Generating content with Gemini...');
  
  const prompt = `Gumawa ng isang sobrang lupit na Facebook post tungkol sa AI automation para sa small businesses sa Pilipinas.

Topic ideas (pumili ng isa):
1. "Ang hirap maghanap ng customers? Eto ang sikreto ng mga top businesses ngayon. 🤫"
2. "Hindi ka na dapat nahihirapan sa pag-reply sa customers! Eto ang ginagawa ng mga matatalinong negosyante. 💡"
3. "Gumising ka na! Habang tulog ka, kumikita na ang iba gamit ang AI. 🚀"
4. "5 taon kang nagtiis sa manual na trabaho. Sa AI, 5 minuto lang. 😱"
5. "Ang AI ay hindi kaaway. Ito ang magiging pinakamatalino mong empleyado. 🤝"

Requirements:
- Haba: 4-8 sentences
- May emoji sa bawat sentence
- May nakakatawa o nakaka-relate na opening
- May mahalagang lesson o insight
- May call-to-action sa dulo: "I-message kami para sa free consultation!"
- Gumamit ng Taglish
- Parang nagkukuwento lang sa kaibigan

Output format (exact JSON):
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
      caption: `Hindi ka pa ba nag-a-AI automation? 😱\n\nHuwag kang mahuli! I-message mo na kami ngayon para sa FREE consultation. 📩\n\n#AIAutomation #SmallBusinessPH #OmniChatAI`,
      image_prompt: 'Futuristic AI technology helping a small Filipino business owner, modern workspace, cyberpunk style, neon blue and purple, infographic style'
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
  console.log('\n🎨 IMAGE PROMPT:\n', image_prompt);

  await saveToSupabase(caption, image_prompt);
}

main().catch(console.error);

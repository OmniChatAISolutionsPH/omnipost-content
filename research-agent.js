const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// ===== CONFIGURATION =====
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🔧 CONFIGURATION CHECK:');
console.log('TAVILY_API_KEY:', TAVILY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? '✅ Set' : '❌ Missing');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== LISTAHAN NG SEARCH QUERIES =====
// Iba't ibang angle para makakuha ng malawak na research
const SEARCH_QUERIES = [
  "small business Philippines customer service problems 2026",
  "Filipino small business owners AI automation adoption",
  "Facebook Messenger business challenges small business Philippines",
  "small business Philippines social media marketing struggles",
  "Philippine SME digital transformation trends 2026"
];

// ===== TAVILY SEARCH =====
async function searchTavily(query) {
  console.log(`🔍 Searching: "${query}"`);

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: query,
        search_depth: 'basic',
        max_results: 3,
        include_answer: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Tavily API error for "${query}":`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Found ${data.results?.length || 0} results for "${query}"`);
    return data;
  } catch (error) {
    console.error(`❌ Tavily exception for "${query}":`, error);
    return null;
  }
}

// ===== I-SUMMARIZE ANG LAHAT NG RESEARCH GAMIT SI GEMINI =====
async function summarizeFindings(allResults) {
  console.log('🤖 Sinusuma ang mga findings gamit si Gemini...');

  const combinedText = allResults
    .filter(r => r !== null)
    .map(r => {
      const answer = r.answer || '';
      const snippets = (r.results || [])
        .map(item => `- ${item.title}: ${item.content?.substring(0, 200)}`)
        .join('\n');
      return `${answer}\n${snippets}`;
    })
    .join('\n\n---\n\n');

  const prompt = `Ikaw ay isang research analyst para sa isang AI Automation Agency sa Pilipinas (OmniChat AI Solutions PH).

Narito ang mga raw na research findings mula sa internet tungkol sa small business pain points at AI automation trends sa Pilipinas:

${combinedText}

GAWAIN MO:
Bumuo ng isang MAIKLING buod (3-5 sentences) ng mga PINAKA-KAPAKI-PAKINABANG na insight dito na pwedeng gawing basehan ng isang Facebook content creator para gumawa ng relatable at napapanahong post para sa mga Filipino small business owners.

Focus sa: mga totoong pain point, mga specific na problema, o mga trend na maaaring gawing content angle.

Isulat sa Taglish. Output lang ang buod, walang preamble.`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini summarize error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log('📝 Summary:', summary);
    return summary;
  } catch (error) {
    console.error('❌ Gemini summarize exception:', error);
    return null;
  }
}

// ===== SAVE TO SUPABASE =====
async function saveInsight(summary, sourceUrls) {
  console.log('💾 Sinasave ang research insight...');

  try {
    const { error } = await supabase
      .from('research_insights')
      .insert([{
        topic_summary: summary,
        source_urls: sourceUrls,
        used_in_content: false
      }]);

    if (error) {
      console.error('❌ Supabase error:', error);
      return false;
    }

    console.log('✅ Na-save ang research insight!');
    return true;
  } catch (error) {
    console.error('❌ Error saving:', error);
    return false;
  }
}

// ===== MAIN =====
async function main() {
  console.log('🚀 Starting Research Agent...');
  console.log('⏰ Time:', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));

  // Pumili ng random na 2 queries sa listahan (para hindi palaging pareho, at makatipid sa API calls)
  const shuffled = [...SEARCH_QUERIES].sort(() => 0.5 - Math.random());
  const selectedQueries = shuffled.slice(0, 2);

  console.log('📋 Selected queries:', selectedQueries);

  const allResults = [];
  const allSourceUrls = [];

  for (const query of selectedQueries) {
    const result = await searchTavily(query);
    if (result) {
      allResults.push(result);
      const urls = (result.results || []).map(r => r.url);
      allSourceUrls.push(...urls);
    }
  }

  if (allResults.length === 0) {
    console.error('❌ Walang nakuhang results mula sa Tavily. Titigil na.');
    return;
  }

  const summary = await summarizeFindings(allResults);

  if (!summary) {
    console.error('❌ Nabigo ang pag-summarize. Titigil na.');
    return;
  }

  await saveInsight(summary, allSourceUrls);
  console.log('\n✅ Research Agent tapos na!');
}

main().catch(console.error);

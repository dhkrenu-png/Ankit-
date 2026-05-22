/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini safely
  let ai: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;

  // Track if Gemini API is rate-limited or exhausted to handle 429 limits gracefully
  let geminiCooldownTimestamp = 0;

  // Global cache for motivation quote on the server to prevent exhausting 429 API quotas
  // Pre-populated on boot with standard premium study advisory quotes to bypass external calls on startup
  const simulatedMotivations = [
    "Keep your focus steady today. Every small problem solved is a step closer to mastering your exams.",
    "Approach your work with tranquility. Break down your assignments step-by-step.",
    "Deep focus is a superpower. Tuck away your distractions and lock into your studies.",
    "The noise of social media is temporary. The wisdom and knowledge you build today is forever.",
    "Let the lofi study frequencies clear your mind and help you find your steady writing rhythm.",
    "Small steady strides daily create high academic mountains. Rest your mind, then execute with focus.",
    "Success is not about brute-force energy; it is about steady, consistent, high-aura rhythm.",
    "Shut out the digital static. Your future self is waiting for the progress you make in this exact hour.",
    "Commit to single-minded attention. The world will wait, but your mind is ready to expand now.",
    "Study with soft breathing. One formula, one sentence, one page at a time."
  ];

  let cachedMotivation: { text: string; source: string; timestamp: number } | null = {
    text: simulatedMotivations[Math.floor(Math.random() * simulatedMotivations.length)],
    source: "local-init",
    timestamp: Date.now()
  };
  const CACHE_TTL_MS = 30 * 60 * 1000; // Cache for 30 minutes

  function isGeminiAvailable() {
    if (!ai) return false;
    // Bypassing the API call if we are inside the 429 rate-limited cooldown window
    if (Date.now() < geminiCooldownTimestamp) {
      return false;
    }
    return true;
  }

  function handleGeminiError(errorName: string, err: any) {
    const errStr = String(err?.message || err || "");
    const isRateLimit = errStr.includes("429") || 
                        errStr.toLowerCase().includes("quota") || 
                        errStr.toLowerCase().includes("limit") || 
                        errStr.toLowerCase().includes("exhausted");
    
    if (isRateLimit) {
      // Enter cooldown mode silently for 10 minutes to avoid spamming 429s and gracefully use instant local advisory
      geminiCooldownTimestamp = Date.now() + 600000;
    } else {
      console.log(`[AuraStudy Info] ${errorName} handled.`);
    }
  }

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("AuraOS: Gemini API initialized successfully.");
    } catch (err) {
      console.error("AuraOS: Failed to initialize Gemini API client:", err);
    }
  } else {
    console.log("AuraOS: Running in simulation mode (No GEMINI_API_KEY found).");
  }

  // API Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      model: isGeminiAvailable() ? "gemini-3.5-flash" : "simulated",
      timestamp: new Date().toISOString(),
    });
  });

  // Daily AI Motivation
  app.get("/api/gemini/motivation", async (req, res) => {
    const simulatedMotivations = [
      "Keep your focus steady today. Every small problem solved is a step closer to mastering your exams.",
      "Approach your work with tranquility. Break down your assignments step-by-step.",
      "Deep focus is a superpower. Tuck away your distractions and lock into your studies.",
      "The noise of social media is temporary. The wisdom and knowledge you build today is forever.",
      "Let the lofi study frequencies clear your mind and help you find your steady writing rhythm.",
      "Energy flows where attention goes. Anchor your mind in this single moment of study.",
      "Quiet progress is still magnificent progress. Celebrate each note you take.",
      "Mastery is not a singular event; it is the gentle accumulation of small focus blocks.",
      "Your intellect is a garden. Water it today with dedication, patience, and deep work.",
      "In the silence of deep work, you are building the foundation of your future victories.",
      "Distractions will always whisper, but your ambition speaks with a steady, quiet authority.",
      "The hardest part of any task is simply starting. Give yourself permission to make small, imperfect steps.",
      "Patience is the quiet companion of wisdom. Work with calm assurance today.",
      "Every master was once an exhausted beginner who chose not to quit. Keep your candle burning.",
      "Take a deep breath. Let go of the pressure to be perfect and focus on simply being present with your work.",
      "Your education is a shield and a key. Forge it with care, one steady study hour at a time.",
      "When the mind is calm, even the most complex equations begin to unravel with ease.",
      "Quiet focus is your sanctuary. Leave the world's static outside your door for just a little while.",
      "Great architectures are built brick by brick. Your understanding is built line by line.",
      "Rest is a sacred part of the cycle. Work diligently, then rest with a clean conscience.",
      "Success is a slow, rhythmic dance. Maintain your steady tempo; there is no need to hurry.",
      "The clarity you seek will find you in the middle of active, focused effort.",
      "Trust your capacity to learn. Your brain is a brilliant engine of adaptability.",
      "A quiet environment nurtures a sparkling intellect. Design your space to support your focus.",
      "You do not need to finish the whole book today. Just read the next paragraph with complete presence."
    ];

    // Read query parameter. If ?refresh=true is passed, we attempt to bypass cache
    const bypassCache = req.query.refresh === "true";

    // Serve from cache if available and not expired
    if (!bypassCache && cachedMotivation && (Date.now() - cachedMotivation.timestamp < CACHE_TTL_MS)) {
      return res.json({ text: cachedMotivation.text, source: cachedMotivation.source });
    }

    if (!isGeminiAvailable() || !ai) {
      // If we have an existing cache (even if expired/stale), return it rather than completely randomizing
      if (cachedMotivation) {
        return res.json({ text: cachedMotivation.text, source: "cached-fallback" });
      }
      const randomMsg = simulatedMotivations[Math.floor(Math.random() * simulatedMotivations.length)];
      return res.json({ text: randomMsg, source: "simulated" });
    }

    try {
      const prompt = "Generate a single, ultra-premium, deeply poetic and calming motivational quote for a student productivity application. Keep it short (1-2 sentences). Speak to the user as a warm, encouraging study advisor. Do not include quotes symbols.";
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.9,
        }
      });

      const text = response.text?.trim() || "Stay in flow.";
      cachedMotivation = {
        text,
        source: "gemini",
        timestamp: Date.now()
      };

      res.json({ text, source: "gemini" });
    } catch (err: any) {
      handleGeminiError("AuraOS Motivation error", err);
      
      // Serve previously cached text as high reliability fallback
      if (cachedMotivation) {
        return res.json({ text: cachedMotivation.text, source: "cached-fallback" });
      }

      const randomMsg = simulatedMotivations[Math.floor(Math.random() * simulatedMotivations.length)];
      res.json({
        text: randomMsg,
        source: "fallback"
      });
    }
  });

  // Multilingual Desi Motivation endpoint (Hindi & Hinglish tones)
  app.get("/api/gemini/multilingual-motivation", async (req, res) => {
    const lang = String(req.query.language || "hinglish").toLowerCase();
    const tone = String(req.query.tone || "energetic").toLowerCase();

    // High quality local quotes in both languages and tones
    const fallbackQuotes: Record<string, Record<string, string[]>> = {
      hindi: {
        energetic: [
          "ऊर्जा से भर जाओ! आज का दिन तुम्हारा है। हर एक सेकंड को अपनी सफलता की सीढ़ी बनाओ! ⚡",
          "चलो उठो और काम पर लग जाओ! तुम्हारी मेहनत ही कल इतिहास रचेगी। आलस को आज ही हराना है! 🔥",
          "आलस को पीछे छोड़ो और अपनी भीतर की आग को जगाओ। सफलता तुम्हारा इंतज़ार कर रही है! 🚀"
        ],
        calm: [
          "शान्त रहो। अपनी सांसों पर ध्यान केंद्रित करो। एक बार में केवल एक ही काम करो, और उसमें लीन हो जाओ। 🍃",
          "धैर्य ज्ञान का सच्चा साथी है। अपनी पढ़ाई को बिना किसी तनाव के, सहजता से आगे बढ़ाओ। ✨",
          "मन को शांत करके पढ़ने से कठिन से कठिन अध्याय भी आसान और स्पष्ट लगने लगता हैपढ़ो। 🌸"
        ],
        warrior: [
          "मजबूत बनो! तुम केवल एक छात्र नहीं हो, अपनी किस्मत खुद लिखने वाले योद्धा हो। कठिनाइयों से डरो मत, उनका मुकाबला करो! ⚔️",
          "हार और कठिनाइयां केवल परीक्षा हैं। याद रखो, एक वीर योद्धा कभी मैदान छोड़कर नहीं भागता। लड़ो और जीतो! 🏆",
          "तुम्हारा पेन ही तुम्हारा हथियार है। इस पुस्तक रूपी रणभूमि में अपनी एकाग्रता से हर चुनौती को फतह करो! ⚔️"
        ],
        serious: [
          "अपनी वर्तमान परिस्थिति को मत देखो, बल्कि अपने माता-पिता के परिश्रम को देखो। उठो और अपने भविष्य को उज्ज्वल बनाओ। 📚",
          "सफलता का कोई शॉर्टकट नहीं है। आज की कड़ी मेहनत ही तुम्हारे सुंदर कल की नींव रखेगी। एकाग्रचित होकर पढ़ो। 🧠",
          "समय अमूल्य है। जो क्षण आज तुम आलस्य में खो दोगे, वह कल तुम्हें पछतावे के रूप में वापस मिलेगा। गंभीर बनो। ⏳"
        ],
        funny: [
          "इतने ध्यान से तो तुम रील्स भी नहीं देखते, जितना मोबाइल में मगन रहते हो! थोड़ा किताबों को भी इज्ज़त दे दो भाई! 😂",
          "पढ़ाई ऐसे करो कि घरवाले कहें कि बेटा पागल तो नहीं हो गया दिन-रात पढ़ते-पढ़ते! चश्मा लगाओ और शुरू हो जाओ! 🤓",
          "किताबें बुला रही हैं, कह रही हैं 'कभी तो मुझे छुओ!' रील्स और स्वाइप को कुछ देर के लिए तलाक दे दो यार! 📖"
        ],
        angry: [
          "शर्म करो! पूरा दिन बर्बाद कर दिया और अभी भी आलस में पड़े हो! अपने माता-पिता के पसीने की बूंदों की कद्र करो और पढ़ो! 😡",
          "तुम्हारा दिमाग मोबाइल की स्क्रॉलिंग में सड़ रहा है! किताब खोलो और अपनी बकवास बंद करो। तुरंत पढ़ने बैठो, अभी! 🤬",
          "फालतू बहाने बनाना बंद करो! कोई शॉर्टकट नहीं है। अगर आज नहीं पढ़े तो कल दूसरों के काम पर ताली बजाने के अलावा कुछ नहीं करोगे! 😡"
        ],
        roasting: [
          "सपने तो सुंदर पिचाई बनने के हैं, लेकिन मेहनत एक सेकंड भी नहीं होती! तुमसे तो चाय की केतली भी नहीं संभलेगी इस रफ़्तार से! 💀",
          "तुम्हारी पढ़ाई की स्पीड देखकर लगता है कि तुम्हारा सिलेबस अगले जन्म के अंत तक ही पूरा हो पाएगा। वाह बेटा, बहुत आगे जाओगे! 🏆",
          "नोटिफिकेशन की घंटी बजते ही तुम्हारी रीढ़ की हड्डी ऐसे मुड़ती है जैसे कोई बड़ा खजाना मिल गया हो। पढ़ाई में इतनी फुर्ती दिखाओ तो बात बने! 💀"
        ]
      },
      hinglish: {
        energetic: [
          "Suno bhai! Pura power laga do aaj. Kal jab success milegi toh shor khud goonjega! Let's crash this task! ⚡",
          "Arey aaram karne ke liye puri zindagi padi hai, abhi mehnat kar lo aur sabko dikha do tum kya cheez ho! 🔥",
          "Focus level full power par set karo aur distractions ko delete! Abhi se start karo! 🚀"
        ],
        calm: [
          "Take a deep breath. Sab ho jayega. Distractions ko side rakho aur ek peaceful pace me padhai shuru karo. 🍃",
          "Dheere dheere hi sahi, par har ek step aage badho. Stress lene se syllabus poora nahi hota, shanti se kaam karo. ✨",
          "Apne mind ko bilkul stable karo. Ek time par sirf ek hi target rakho aur usme beh jaao. 🌸"
        ],
        warrior: [
          "Tumhare andar ek asali warrior chhupa hai. Jab tak task poora na ho jaye, rukna nahi hai! ⚔️",
          "Challenges toh aayenge hi, par ek true warrior kabhi haar nahi maanta. Wake up, fight the distraction, and conquer your goals! 🏆",
          "Yeh syllabus tumse unchai me bada nahi hai. Ek yoddha ki tarah har ek chapter ko cheerte hue aage badho! ⚔️"
        ],
        serious: [
          "Apni current situation ko dekh kar haar mat maano. Apne parents ke hard work ko yaad karo aur aaj apni puri jaan laga do! 📚",
          "Time flies bro, jo moments abhi waste ho rahe hain inki value tab samajh aayegi jab backlog ka pahaad ban jayega. Be serious! 🧠",
          "Consistent rehna hi ekmev tarika hai elite banne ka. Shortcuts backup me chhod do, pehle concepts pure clear karo! ⏳"
        ],
        funny: [
          "Syllabus itna bada hai par study time par reel pe 'Moye Moye' loop me chal raha hai! Padh lo thoda, varna exam me dimaag dancemoves seekhega! 😂",
          "Mobile notification ko dekhne ki speed dekhkar toh lagta hai tum NASA ke sabse fast scientist ho! Kitab dekhkar paralysis kyun ho jata hai? 🤓",
          "Arey bina padhe topper banne ki scheme sirf sapno me milti hai bhai! Chalo, kitabo se thodi jaan-pehchan toh karo! 📖"
        ],
        angry: [
          "Sharam karo thodi! Pura din scroll karne me nikaal diya aur ab dhero bahane bana rahe ho? Utho, phone phenko aur books kholo! 😡",
          "Kya 'lazy lazy' laga rakha hai? Motivation ki goli mat dhoondho, chupchap padhne baitho varna future me rona hi bacha hai! 🔥",
          "Parents apna blood and sweat de rahe hain aur tum yahan reels me dunya dhoondh rahe ho? Disgusting! Lock your phone right now! 🤬"
        ],
        roasting: [
          "Sapne dekhne hain Elon Musk jaise par ek 10-minute ka focus block tumhare dimaag ke fuse uda deta hai! Aise banoge crorepati? 💀",
          "Tumhari padhai ki speed dekh kar toh turtle ne bhi speed test jeet jana hai! Backlog ki dukan uthane ka business hai kya? 🏆",
          "Notification light baji nahi ki chipkali ki tarah lapak padte ho screen par. Padhne baitho toh achanak maut jaisi feeling aane lagti hai! 💀"
        ]
      }
    };

    // Safely derive lists
    const langKey = fallbackQuotes[lang] ? lang : "hinglish";
    const toneKey = fallbackQuotes[langKey][tone] ? tone : "energetic";
    const selectedList = fallbackQuotes[langKey][toneKey];

    // If Gemini is rate-limited or unavailable, return fallback quotes immediately
    if (!isGeminiAvailable() || !ai) {
      const randomMsg = selectedList[Math.floor(Math.random() * selectedList.length)];
      return res.json({ text: randomMsg, source: "simulated-local" });
    }

    try {
      const prompt = `Generate a single, powerful, high-impact motivational quote for a student productivity application.
Language: ${lang === 'hindi' ? 'Pure Hindi in Devanagari script (हिन्दी)' : 'Hinglish (Hindi words spoken in normal slang but spelled using Latin/English characters)'}
Tone: ${tone} (Options: 
  - energetic: High speed, fiery, pumping, motivating, wake-up call, filled with dynamic fire symbols or lightning/energy vibes
  - calm: Serene, peaceful, focused, breathing-oriented, zen, reducing anxiety and stress, helping the student focus gently, using soft/leaf symbols
  - warrior: Intense, brave, stoic, calling them a warrior/soldier/yoddha, facing struggle, breaking through obstacles, winning against mental blocks, using sword/shield/trophy symbols
  - serious: Mature, deep, intellectually challenging, focusing on career reality, consistent efforts, and parents' hard work.
  - funny: Relatable comedic student jokes, funny Hinglish code words, lighthearted playful banter, showing study ironies with laugh emojis.
  - angry: Very strict scolding, high-tension verbal reminder of lost time, waking them up with parenting-style angry emojis and strict reminders of duties.
  - roasting: Brutal sarcastic roast of lazy lifestyle, scrolling addictions, unrealistic low-effort high-reward expectations, and backlog failures.)

Guidelines:
- Keep it to exactly 1 short sentence or 2 brief ones. Do not let it be long.
- Be deeply relatable, poetic, and original.
- Do NOT include quotation marks, formatting prefix, or labels like "Energetic:" or "Hinglish Quote:".
- Only return the quote text directly. Include relevant emojis at the end.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.95,
        }
      });

      let text = response.text?.trim() || "";
      // Strip any surrounding quote marks if they still persist
      if (text.startsWith('"') && text.endsWith('"')) {
        text = text.substring(1, text.length - 1);
      }
      if (text.startsWith('“') && text.endsWith('”')) {
        text = text.substring(1, text.length - 1);
      }

      if (!text) {
        text = selectedList[Math.floor(Math.random() * selectedList.length)];
      }

      res.json({ text, source: "gemini" });
    } catch (err: any) {
      handleGeminiError("AuraOS Multilingual Motivation error", err);
      const randomMsg = selectedList[Math.floor(Math.random() * selectedList.length)];
      res.json({
        text: randomMsg,
        source: "fallback"
      });
    }
  });

  // AI Assistant Diagnostics & Suggestions
  app.post("/api/gemini/assistant", async (req, res) => {
    const { mood, customPrompt, activeTask, focusMinutes } = req.body;

    const moodPrompts: Record<string, string> = {
      anxious: "The user is feeling anxious or overwhelmed with studies. Provide soothing, encouraging grounding instructions, then offer 3 clear micro-steps to reset their productivity.",
      stuck: "The user is stuck on a difficult homework question or study block. Provide a fresh mental reframing strategy, then 3 actionable suggestions to build momentum.",
      tired: "The user is exhausted from long study hours. Suggest a rejuvenating physical alignment/stretch, then 3 light or restorative productivity routines they can do right now.",
      distracted: "The user is distracted by notifications. Provide a centering thought, then 3 structural tasks to secure their workspace.",
      neutral: "The user is in a steady zone. Spark creative academic inspiration, then 3 high-impact tasks to tackle next on their study schedule."
    };

    const selectedMoodContext = moodPrompts[mood as string] || moodPrompts.neutral;
    const taskDetails = activeTask ? `Active study task: "${activeTask}".` : "No current active task.";
    const focusContext = focusMinutes ? `They have committed ${focusMinutes} minutes to studying today.` : "";

    const finalQuery = `
      You are a supportive, real-world AI Study Coach aiding a student user.
      ${selectedMoodContext}
      ${taskDetails}
      ${focusContext}
      ${customPrompt ? `The student asks: "${customPrompt}"` : ""}
      
      Respond directly to the user's focus state in a clean, highly supportive, premium text block.
      Provide one primary guiding text block (motivation/calming advice) and exactly three numbered actionable micro-tasks.
    `;

    // High quality, deeply customized offline fallback structure 
    const fallbackResponses: Record<string, { message: string; suggestions: string[] }> = {
      anxious: {
        message: "It is completely normal to feel overwhelmed when facing a heavy workload. Let us take a step back together. Remember: we make progress one small question at a time. No need to rush.",
        suggestions: [
          "Declutter your workspace and close any social media or auxiliary browser tabs not needed for this task.",
          "Write down a simple, short checklist of 3 subtasks on a sheet of paper to clear your mental backlog.",
          "Commit to just 5 minutes of quiet, distraction-free study, then check in on how you feel."
        ]
      },
      stuck: {
        message: "Being stuck is a natural part of learning! It just means your brain is actively building new connections. Let us break the ice by simplifying the problem.",
        suggestions: [
          "Write down a rough, imperfect draft first—you can always polish it later.",
          "Break the active homework problem down to its absolute simplest first step.",
          "Try explaining the core issue out loud or to your notepad to clarify your thinking."
        ]
      },
      tired: {
        message: "Your energy levels are low, and pushing yourself too hard right now might lead to burnout. Let's practice active rest or light, high-impact maintenance tasks.",
        suggestions: [
          "Look at a distant object outside your window for 20 seconds to rest your eyes.",
          "Gentle stretch: roll your shoulders, stretch your arms, and drink a glass of fresh water.",
          "Spend 5 minutes organizing your notes or scheduling minor reminders for tomorrow."
        ]
      },
      distracted: {
        message: "Our brains are constantly pulled by notifications and shiny websites. Let's anchor your attention on a single, clear target for this session.",
        suggestions: [
          "Turn on your background rainy lofi track or focus hum inside the Focus tab.",
          "Put your phone completely face-down or place it across the room for 20 minutes.",
          "Pick the single most urgent study task of the day, and set a 15-minute timer."
        ]
      },
      neutral: {
        message: "Your focus is steady, resting in a comfortable and calm groove. This is a perfect window to build great momentum and tackle your most important study tasks today.",
        suggestions: [
          "Start a 25-minute Pomodoro study block to lock in your focus.",
          "Add high-level descriptive bullet-point notes to your active study outline.",
          "Complete or schedule one key item in your personal academic calendar."
        ]
      }
    };

    if (!isGeminiAvailable() || !ai) {
      const fallback = fallbackResponses[mood as string] || fallbackResponses.neutral;
      return res.json({
        message: fallback.message,
        suggestions: fallback.suggestions,
        source: "simulated"
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: finalQuery,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: {
                type: Type.STRING,
                description: "The direct soothing message/response addressing their mood and focus state.",
              },
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly three highly logical, helpful, short, actionable suggestions for productivity.",
              },
            },
            required: ["message", "suggestions"],
          },
        },
      });

      const parsedData = JSON.parse(response.text?.trim() || "{}");
      res.json({
        message: parsedData.message || "Breathe. You are exactly where you need to be.",
        suggestions: parsedData.suggestions || [
          "Set a mini pomodoro timer of 10 minutes",
          "Draft initial rough concepts in the notes area",
          "Hydrate and align your physical posture for 20 seconds"
        ],
        source: "gemini"
      });
    } catch (err: any) {
      handleGeminiError("AuraOS Assistant API error", err);
      const fallback = fallbackResponses[mood as string] || fallbackResponses.neutral;
      res.json({
        message: fallback.message,
        suggestions: fallback.suggestions,
        source: "fallback"
      });
    }
  });
  
  // Dynamic AI Savage Roast & Custom Study Advice
  app.post("/api/gemini/roast", async (req, res) => {
    const { message, scrollHours, focusMinutes, streak, mood, customPrompt, customTraits } = req.body;
    const query = (message || "").trim();

    // Premium offline fallbacks if Gemini is offline
    const fallbackRoasts = [
      { text: "Bhai phone ki battery se zyada low tumhari productivity lag rahi hai aaj. Padh lo beta! 💀", mood: "Savage Burn" },
      { text: "Instagram scroll karne se sirf reels chamkegi, exam hall me dimaag nahi! Shut down your tab right now! 🔥", mood: "Reality Check" },
      { text: "Humne socha tha ki itihaas rachaoge... par reel scroll karke khud ka kabaad banaoge! Ek deep breath lo aur focus timer on karo! ✨", mood: "Meme Shayari" },
      { text: "Kyun bhai, reels dekh kar lag raha kya ki Ambani ban rahe ho? Utho aur homework khatam karo! 😭", mood: "Warm slap" }
    ];

    if (!isGeminiAvailable() || !ai) {
      const selected = fallbackRoasts[Math.floor(Math.random() * fallbackRoasts.length)];
      return res.json({ text: selected.text, mood: selected.mood, source: "simulated-local" });
    }

    try {
      let archetypePrompt = `You are "AURA OS X Savage Sentinel AI", a hilariously witty, brutally honest, but secretly supportive Indian student study coach and personal advisor for Class 10 Board Exam students.`;
      
      if (mood === 'helpful') {
        archetypePrompt = `You are "AURA OS X Supportive Guide AI", a deeply helpful, highly analytical, clear, and structured study advisor and teacher for Indian Class 10 Board Exam students. You provide practical advice, study steps, key concepts, or revision blueprints. Ensure your tone is supportive, clear, warm, and highly structured (while still mixing in friendly student-campus terms like 'bhai' or 'backlog').`;
      } else if (mood === 'motivational') {
        archetypePrompt = `You are "AURA OS X Warrior Fuel AI", an elite, deeply inspiring, high-energy, fiery academic mentor for Indian Class 10 Board Exam students. You speak with grand determination and warrior energy, pushing the student to break all limits, crush their backlog, set timers, and achieve legendary CBSE ranks. Speak with intense pride and motivational strength.`;
      }

      // Inject Custom Configured Traits
      if (customTraits && customTraits.trim() !== '') {
        archetypePrompt += ` Additionally, the student has customized your personality to adopt the following traits: "${customTraits.trim()}". Align your dialogue style, regional touch, attitude, and tone with these traits.`;
      }

      // Inject Custom Prompt Directives
      if (customPrompt && customPrompt.trim() !== '') {
        archetypePrompt += ` CRITICAL DIRECTIVE OVERRIDE: The student has issued these custom instructions and system prompt constraints: "${customPrompt.trim()}". You MUST strictly follow and satisfy these instructions above anything else!`;
      }

      const prompt = `${archetypePrompt}
The student user is struggling with focus, scrolling, or asking a custom question about their Class 10 exams.

User details:
- User Message: "${query}"
- Wasted social media scrolling time today: ${scrollHours || 0} hours
- Focus minutes done today: ${focusMinutes || 0} minutes
- Active study streak: ${streak || 0} days

Core Directives:
- Respond in high-vibes "Hinglish" (a smooth blend of Hindi and English spoken in normal college campus slang but written in Latin characters). If they ask in pure Hindi or pure English, you can match their language style.
- You are a Class 10 specialist! Speak specifically to board preparation, backlog of Science (like Chapter 3 Metals, Chemical Reactions), Mathematics (Trigonometry, Polynomials), Social Science (timeline dates), and IT. Mix in board exams stress, final strategy advice, parents expectations, and funny study banter.
- VIBE / STYLE REQUIREMENT: Since the user chose the "${mood || 'sarcastic'}" mood style, tailor your style exactly:
  * "helpful": Provide concise conceptual answers, 1-2 practical revision steps, clarify backlog formulas, and offer logical guidelines.
  * "motivational": Fire up the student with high energy, call them an active warrior or champion, push them to lock their phone and study hard.
  * "sarcastic": Be brutally sarcastic inside a humorous, friendly banter style. Urge them to study with severe wit and funny remarks about scrolling.
- Keep the response to exactly 2 to 3 concise, high-impact sentences. Keep it very punchy and short.
- Return the response in a structured JSON schema.

JSON Response structure:
{
  "text": "The custom generated advice/response text here. Include relevant emojis at the end! ⚡💀",
  "mood": "A funny short 2-3 word rating or mood label denoting your vibe (e.g. 'Epic Roast' if sarcastic, 'Helpful Beacon' if helpful, 'Warrior Fuel' if motivational)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "The direct Hinglish roast or advice quote text. Use emojis.",
              },
              mood: {
                type: Type.STRING,
                description: "A funny short category name (max 15 characters).",
              }
            },
            required: ["text", "mood"],
          },
        },
      });

      const parsedData = JSON.parse(response.text?.trim() || "{}");
      res.json({
        text: parsedData.text || "Bhai lazy hone ka toh alag hi course chal rha hai tumhara. Padhne baitho abhi! 😭",
        mood: parsedData.mood || "Reality Shock",
        source: "gemini"
      });
    } catch (err: any) {
      handleGeminiError("AuraOS Savage Roast API error", err);
      const selected = fallbackRoasts[Math.floor(Math.random() * fallbackRoasts.length)];
      res.json({
        text: selected.text,
        mood: selected.mood,
        source: "fallback"
      });
    }
  });

  // NOTEBOOKLM SMART RAG STUDY WORKSPACE ENDPOINT
  app.post("/api/gemini/notebooklm", async (req, res) => {
    const { sourceId, customText, action, userQuestion } = req.body;

    const sourceTexts: Record<string, { name: string; text: string }> = {
      "science-metals": {
        name: "Science: Metals & Non-Metals (Ch 3)",
        text: "Metals excel as heat/electricity conductors, demonstrate malleability/ductility, and generate basic oxides. Non-metals differ fundamentally. In chemical reactions, metals lose electrons to form basic cations, reacting with oxygen to spawn metal oxides (like amphoteric Al2O3). Reactivity of metal decreases in the series: K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Hg > Ag > Au. Ionic compounds are produced by electron transfer, yielding high melting, conductive crystal matrices. Metallurgy processes, like calcination, roasting, electrolysis, and electrolytic refining, isolate pure metals, while anodizing, painting, and galvanizing (zinc plating) prevent corrosion."
      },
      "math-trig": {
        name: "Math: Trigonometric Identities (Ch 8)",
        text: "Trigonometry analyzes relationships between right-triangle side lengths and angle values. Pythagorean-derived identities include: sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, and 1 + cot²θ = cosec²θ. Complementary angle formulas state: sin(90°-θ) = cosθ, cos(90°-θ) = sinθ, tan(90°-θ) = cotθ, etc. Essential values: sin(30°) = 1/2, sin(45°) = 1/√2, sin(60°) = √3/2. These find wide applications in Heights & Distance problems under Chapter 9, using Angles of Elevation (looking upward) and Angles of Depression (looking downward) with trigonometric ratios: tanθ = opposite/adjacent."
      },
      "sst-nationalism": {
        name: "SST: Nationalism in India (Timeline)",
        text: "India's struggle for independence timeline highlights key dates: 1915: Mahatma Gandhi returns from South Africa. 1916: Champaran Satyagraha (indigo peasants). 1917: Kheda Satyagraha. 1918: Ahmedabad cotton mill strike. 1919: Rowlatt Act & Jallianwala Bagh Massacre on April 13. 1920: Non-Cooperation Khilafat Movement. 1922: Chauri Chaura incident (movement terminated due to violence). 1928: Simon Commission boycotted. 1930: Civil Disobedience Movement initiated with the Dandi Salt March (covering 240 miles, breaking salt law on April 6). 1931: Gandhi-Irwin Pact. 1932: Poona Pact between Gandhi and B.R. Ambedkar."
      },
      "english-letter": {
        name: "English: A Letter to God",
        text: "Lencho, a deeply dedicated corn farmer, maintains absolute faith in God. An abrupt, violent hailstorm ravages his entire crop. Facing starvation, Lencho writes an earnest letter addressed directly to God, requesting 100 pesos. The localized postmaster reads it, is deeply moved, collects 70 pesos from employees, and sends it back signed 'God'. Upon opening it, Lencho is furious, believing post office staff stole 30 pesos. He writes a second letter calling the post office employees a 'bunch of crooks', highlighting the irony of human distrust contrasted with blind spiritual faith."
      }
    };

    // Determine active source text
    let activeSourceName = "Pasted Workspace Document";
    let activeSourceText = (customText || "").trim();

    if (sourceTexts[sourceId]) {
      activeSourceName = sourceTexts[sourceId].name;
      activeSourceText = sourceTexts[sourceId].text;
    }

    if (!activeSourceText) {
      return res.status(400).json({ error: "Source text or a valid source selection is required!" });
    }

    // High quality offline fallback responses
    const generateLocalSummary = () => {
      let fcs = [
        { question: "What is reactivity series of metals?", answer: "Arrangement of metals in decreasing reactivity order: K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Hg > Ag > Au.", tag: "Reactivity" },
        { question: "Why do ionic compounds have high melting points?", answer: "Due to strong inter-ionic electrostatic forces requiring high thermal energy to overcome.", tag: "Chemical Bonds" },
        { question: "What is complementary trigonometry identity?", answer: "For complementary angles, sin(90°-θ) = cosθ, cos(90°-θ) = sinθ, tan(90°-θ) = cotθ.", tag: "Identities" },
        { question: "Explain the Rowlatt Act 1919 conflict.", answer: "It authorized colonial authorities to imprison Indian political leaders for 2 years without trial, sparking Satyagraha and protests.", tag: "History Timeline" },
        { question: "What irony lies in Postmen and Lencho's faith?", answer: "Lencho believed the post office workers stole his pesos, though they actually collected and sent him the money.", tag: "Literary Analysis" }
      ];

      let cs = [
        "Metals + Dilute Acid -> Metal Salt + Hydrogen gas.",
        "sin²θ + cos²θ = 1, tanθ = sinθ/cosθ.",
        "1930: Dandi Salt March started on March 12, covering 240 miles to break salt law on April 6.",
        "Postmaster collected 70 pesos for Lencho to retain Lencho's spiritual faith."
      ];

      return {
        summary: `### Class 10 Workspace Study Summary: **${activeSourceName}**\n\n* **Primary Theme:** Systematizing key board concepts with precision notes.\n* **Key Concepts:** Analyzed directly from the grounding textbook chapter.\n* **Essential Highlights:** High-impact board points curated for 10th exams.\n\n#### Detailed Analysis:\n${activeSourceText}\n\n* **Quick Recap:** Review the core cheat tables and formulas associated with this chapter regularly. Use the RAG chatbot below to test your knowledge or ask specific definitions.`,
        flashcards: fcs,
        cheatSheet: cs,
        source: "simulated"
      };
    };

    const generateLocalPodcast = () => {
      const podcastPlaylists: Record<string, { title: string; subtitle: string; playlist: Array<{ id: string; speaker: 'Aarav' | 'Aditi'; text: string; action?: string }> }> = {
        "science-metals": {
          title: "Metals Mastery & The Blast Reactions",
          subtitle: "CBSE Class 10 Chemistry • Chapter 3 Deep Dive",
          playlist: [
            { id: "sm-1", speaker: "Aarav", text: "Yo everyone, welcome to the Aura NotebookLM! Today we are cracking Science Chapter 3—Metals and Non-metals. Aditi, honestly, this reactivity series is giving me actual anxiety. K, Na, Ca... how do I even remember this backlog?", action: "Anxious groan" },
            { id: "sm-2", speaker: "Aditi", text: "Haha Aarav, relax! There's a super cool trick: 'Please Stop Calling Me A Zebra, I Like Her Calling Smart Goat!' It maps exactly to Potassium, Sodium, Calcium, Magnesium, Aluminum, Zinc, Iron, Lead, Hydrogen, Copper, Silver, Gold!", action: "Laughs reassuringly" },
            { id: "sm-3", speaker: "Aarav", text: "Wait... WHAT? 'Please Stop Calling Me A Zebra...' oh my god, that is epic aura! I've been rote learning for hours like a boomer.", action: "Mind blown smile" },
            { id: "sm-4", speaker: "Aditi", text: "Exactly! Also, watch out for Amphoteric oxides like Aluminum Oxide (Al₂O₃)—it reacts with both acids and bases. Board exams love asking this, so mark it important in your checklist!", action: "Explains with gesture" },
            { id: "sm-5", speaker: "Aarav", text: "Got it! Also ionic compounds have very high melting points because of their solid ionic matrix, right?", action: "Nods keying notes" },
            { id: "sm-6", speaker: "Aditi", text: "Boom! Exactly. Electrostatic forces are super strong, requiring massive energy to pull them apart. Practice metallurgy refining methods too, and you are 100% board ready!", action: "Thrusts fist in sync with audio" }
          ]
        },
        "math-trig": {
          title: "Trig Proofs: Demystifying Chapter 8",
          subtitle: "Maths Board Special • Identities & Angle Hacks",
          playlist: [
            { id: "mt-1", speaker: "Aarav", text: "Hey guys! We are live in the dynamic studio. Aditi, Chapter 8 proofs are an absolute nightmare. I write sin²θ + cos²θ = 1, and then my proof goes completely sideways!", action: "Bangs table playfully" },
            { id: "mt-2", speaker: "Aditi", text: "Trust me Aarav, everyone struggles there. The golden rule is: always convert EVERYTHING into terms of Sine and Cosine first! Tan is sin/cos, Sec is 1/cos, Cosec is 1/sin. It simplifies the chaos instantly.", action: "Grins knowingly" },
            { id: "mt-3", speaker: "Aarav", text: "Wait, so if I have a complex LHS, I just turn it all into Sin and Cos, then use algebraic identities like (a+b)² or a²-b²?", action: "Scribbling notes rapidly" },
            { id: "mt-4", speaker: "Aditi", text: "Spot on! And always keep an eye on complementary ratios and the key values. Like Sin 30 is 1/2, Cos 60 is also 1/2. They pair up beautifully.", action: "Smiles confidently" },
            { id: "mt-5", speaker: "Aarav", text: "Aha! This actually makes trigonometry feel like a game rather than torture. Let me launch a local timer and solve 5 proofs right now!", action: "Stands up energized" }
          ]
        },
        "sst-nationalism": {
          title: "Indian Freedom Fight: The Ultimate Timeline",
          subtitle: "Class 10 Social Science • History Chapter 2",
          playlist: [
            { id: "st-1", speaker: "Aarav", text: "SST timeline is destroying my brain, Aditi! 1915, 1919, 1930... I keep mixing up the Rowlatt Act and the Salt March dates!", action: "Rubs forehead" },
            { id: "st-2", speaker: "Aditi", text: "Aarav, let's look at the flow. Gandhi came back in 1915. He tested things with mini satyagrahas in Champaran and Kheda, then boom—1919 was Rowlatt Act where they could jail anyone without trial.", action: "Points finger systematically" },
            { id: "st-3", speaker: "Aarav", text: "Right, and that led to Jallianwala Bagh on April 13, 1919. A tragic turning point.", action: "Sober tone" },
            { id: "st-4", speaker: "Aditi", text: "Yes. Then Gandhi combined Hindu-Muslim unity via Khilafat and launched Non-Cooperation in 1920, which stopped in 1922 because of Chauri Chaura violence.", action: "Nods respectfully" },
            { id: "st-5", speaker: "Aarav", text: "Ah, and then after years of passive resistance, in 1930 he initiated Civil Disobedience with the 240-mile Salt March. This flow makes the dates stick!", action: "Claps hand" }
          ]
        }
      };

      const fallback = podcastPlaylists[sourceId] || {
        title: `Deep Dive: ${activeSourceName}`,
        subtitle: "Interactive Student discussion",
        playlist: [
          { id: "f-1", speaker: "Aarav", text: `Sup everyone! Today we are studying: '${activeSourceName}'. Let's highlight the must-know facts here.`, action: "Warms up speech" },
          { id: "f-2", speaker: "Aditi", text: "Absolutely, Aarav. If we review this outline, we need to focus on core definitions, formulas, and historical significance first.", action: "Smiles warmly" },
          { id: "f-3", speaker: "Aarav", text: "Awesome! Let's check out how we can apply these concepts directly in the sample board papers to score high percentages.", action: "Nods actively" }
        ]
      };

      return {
        title: fallback.title,
        subtitle: fallback.subtitle,
        playlist: fallback.playlist,
        source: "simulated"
      };
    };

    const handleLocalChat = () => {
      const q = (userQuestion || "").toLowerCase();
      let answer = `Based on the active source **${activeSourceName}**:\n\n* **Summary:** The text highlights essential Class 10 concepts.\n* **Recommendation:** Focus on reactivity orders, formulas, timelines, and characters depending on the chapter.\n\n*Your custom question was answered by local fallback analysis. Connect Gemini and review context guidelines to get real-time generative support.*`;
      let citations = [{ source: "Page 1, Paragraph 1", text: activeSourceText.substring(0, 80) + "..." }];

      if (q.includes("reactivity") || q.includes("series") || q.includes("metal")) {
        answer = "In **Science Ch 3 Metals and Non-Metals**, metals lose electrons to become electropositive cations. Metals react with oxygen to form metal oxides. The reactivity of metals drops inside the series: **K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Hg > Ag > Au**. For corrosion defense, anodizing, painting, or galvanizing (coating with zinc) are standard board methodologies.";
        citations = [{ source: "Section 3.2 - Physical/Chemical Properties", text: "Reactivity of metal decreases in the series: K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Hg > Ag > Au." }];
      } else if (q.includes("identity") || q.includes("trig") || q.includes("formula")) {
        answer = "From **Math Chapter 8 Trigonometry**, key board-oriented Pythagorean identities are:\n1. **sin²θ + cos²θ = 1**\n2. **1 + tan²θ = sec²θ**\n3. **1 + cot²θ = cosec²θ**\n\nAdditionally, write down complementary angle relations: **sin(90°-θ) = cosθ** and **tan(90°-θ) = cotθ**.";
        citations = [{ source: "Chapter 8.4 - Trigonometric Identities", text: "Pythagorean-derived identities include: sin²θ + cos²θ = 1, 1 + tan²θ = sec²θ, and 1 + cot²θ = cosec²θ." }];
      } else if (q.includes("march") || q.includes("gandhi") || q.includes("nationalism") || q.includes("date") || q.includes("timeline")) {
        answer = "In **SST Nationalism in India**, critical dates include:\n* **1915:** Gandhi returns from South Africa.\n* **April 13, 1919:** Jallianwala Bagh Massacre.\n* **1920:** Non-Cooperation movement starts.\n* **1930:** Civil Disobedience starts with Dandi Salt March on March 12, breaking salt law on April 6.\n* **1932:** Poona Pact signed.";
        citations = [{ source: "History Section 2 - Timeline of Freedom Struggle", text: "Civil Disobedience Movement initiated with the Dandi Salt March (covering 240 miles, breaking salt law on April 6)." }];
      } else if (q.includes("lencho") || q.includes("letter") || q.includes("god") || q.includes("peso")) {
        answer = "In the Chapter **A Letter to God**, Lencho is a corn farmer with solid faith. His crop is destroyed by a violent hailstorm. He writes to God for 100 pesos. The postmaster sends 70 pesos. Lencho gets angry thinking post office workers ('bunch of crooks') stole 30 pesos, showing dramatic irony.";
        citations = [{ source: "English Prose Chapter 1", text: "He writes a second letter calling the post office employees a 'bunch of crooks', highlighting the irony of human distrust." }];
      }

      return { answer, citations, source: "simulated" };
    };

    // If Gemini is rate-limited or unavailable, use local fast responders
    if (!isGeminiAvailable() || !ai) {
      if (action === "summarize") {
        return res.json(generateLocalSummary());
      } else if (action === "podcast") {
        return res.json(generateLocalPodcast());
      } else {
        return res.json(handleLocalChat());
      }
    }

    try {
      if (action === "summarize") {
        const prompt = `You are "Aura NotebookLM Study Engine", a specialized Class 10 Board study assistant. 
The user chosen source is: "${activeSourceName}"
Source text:
"""
${activeSourceText}
"""

Generate a highly structured Class 10 Board Exam Study Guide based ON THE SOURCE TEXT above.
Keep everything fully aligned strictly with the facts inside the source text. 
Return the response in a structured JSON.

JSON Schema format:
{
  "summary": "A fully-developed, beautifully detailed CBSE Study Guide in Markdown. Use headers, bullet points, highlight bold terms, and compile critical facts. Speak directly to Class 10 board students with tips! 🔥🧠",
  "flashcards": [
    {
      "question": "A concise study question from the source",
      "answer": "The accurate grounded bullet-point or detailed explanation answer",
      "tag": "A short subtopic tag (e.g. Reactivity, Formula, History Date)"
    }
  ],
  "cheatSheet": [
    "Exactly 4 high-yield, short, highly memorable one-sentence formula/date/concept points to copy into their revision sheet"
  ]
}

Ensure there are exactly 5 highly interactive flashcards in the array. Ensure valid JSON return.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                flashcards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      answer: { type: Type.STRING },
                      tag: { type: Type.STRING }
                    },
                    required: ["question", "answer", "tag"]
                  }
                },
                cheatSheet: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["summary", "flashcards", "cheatSheet"]
            }
          }
        });

        const parsedData = JSON.parse(response.text?.trim() || "{}");
        res.json({
          summary: parsedData.summary || generateLocalSummary().summary,
          flashcards: parsedData.flashcards || generateLocalSummary().flashcards,
          cheatSheet: parsedData.cheatSheet || generateLocalSummary().cheatSheet,
          source: "gemini"
        });

      } else if (action === "podcast") {
        const prompt = `You are "Aura NotebookLM Podcast Director". Based on this textbook source:
"""
${activeSourceText}
"""

Identify the major concepts, dates, formulas, and ironies in the source and write an extremely engaging, fun, dual-speaker podcast script.
Podcast Hosts:
1. "Aarav": A highly energetic and funny Student podcaster who is getting stressed about his Class 10 CBSE Board Exams. He uses relatable student slang (like 'bhai', 'backlog', 'tension', 'epic aura'), asks common-sense questions, forgets stuff, and gets anxious.
2. "Aditi": A brilliant and super supportive Student Mentor who knows details perfectly, teaches Aarav short tricks, provides simple analogies, and makes studying fun.

They must break down the source in a lively, warm conversation.
Guidelines:
- Let their dialogue feel like realistic podcast audio with host interactions.
- Reference Class 10 Board exam tricks and memorization.
- Generate EXACTLY 6 to 8 sequential dialogue items in the conversation. Each individual item text should be punchy (1 to 2 sentences).
- Return in JSON.

JSON Schema format:
{
  "title": "A fun short catchy name for this audio deep-dive",
  "subtitle": "An elegant, descriptive Class 10 subject category subtitle",
  "playlist": [
    {
      "id": "A unique node ID (e.g., p-1, p-2)",
      "speaker": "Aarav" or "Aditi",
      "text": "The custom dialogue text (written in normal Hinglish or English but spelled with English characters). Do not include quotes."
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                playlist: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      speaker: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ["id", "speaker", "text"]
                  }
                }
              },
              required: ["title", "subtitle", "playlist"]
            }
          }
        });

        const parsedData = JSON.parse(response.text?.trim() || "{}");
        res.json({
          title: parsedData.title || generateLocalPodcast().title,
          subtitle: parsedData.subtitle || generateLocalPodcast().subtitle,
          playlist: parsedData.playlist || generateLocalPodcast().playlist,
          source: "gemini"
        });

      } else { // chat
        const prompt = `You are a localized RAG study chatbot. Based STRIClY on this source textbook document:
"""
${activeSourceText}
"""

Answer the user study question: "${userQuestion}"

Directives:
1. Ground your answer completely on facts details in the source document.
2. Write in a supportive, elegant, student-friendly Indian campus style (Hinglish or English).
3. Extract exactly one citation/exact sentence from the source which proves this fact.
4. If the question cannot be answered using the source document, answer based on general CBSE Class 10 Syllabus knowledge but indicate that it is an external booster note.

JSON Schema format:
{
  "answer": "The detailed grounded educational answer here. Use bullet points and high contrast markdown text where appropriate! ✨📚",
  "citations": [
    {
      "source": "A short reference location (e.g., Chapter Paragraph / Section 3.1)",
      "text": "The exact proof sentence inside the source document above."
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                answer: { type: Type.STRING },
                citations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      source: { type: Type.STRING },
                      text: { type: Type.STRING }
                    },
                    required: ["source", "text"]
                  }
                }
              },
              required: ["answer", "citations"]
            }
          }
        });

        const parsedData = JSON.parse(response.text?.trim() || "{}");
        res.json({
          answer: parsedData.answer || handleLocalChat().answer,
          citations: parsedData.citations || handleLocalChat().citations,
          source: "gemini"
        });
      }

    } catch (err: any) {
      handleGeminiError("AuraOS NotebookLM error", err);
      if (action === "summarize") {
        res.json(generateLocalSummary());
      } else if (action === "podcast") {
        res.json(generateLocalPodcast());
      } else {
        res.json(handleLocalChat());
      }
    }
  });

  // Vite Integration for full-stack build/dev
  if (process.env.NODE_ENV !== "production") {
    console.log("AuraOS: Running in DEVELOPMENT mode. Initializing Vite middleware...");
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("AuraOS: Running in PRODUCTION mode. Serving pre-compiled assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AuraOS Server successfully booted on http://localhost:${PORT}`);
  });
}

startServer();

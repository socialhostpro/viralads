import { GoogleGenAI } from "@google/genai";
import type { Post, GenerationOptions, Platform, ResearchReport, ApiKeys } from '../types';
import { Platform as PlatformEnum, PostStatus } from '../types';

const getGoogleApiKey = (keys?: ApiKeys) => {
    if (keys?.google) return keys.google;
    if (process.env.API_KEY) return process.env.API_KEY;
    throw new Error("Google API Key is not configured.");
}

const getElevenLabsApiKey = (keys?: ApiKeys) => {
    if (keys?.elevenlabs) return keys.elevenlabs;
    // Fallback to a default key if not provided by user or environment
    return process.env.ELEVENLABS_API_KEY || ''; 
}

export const ALL_PLATFORMS: Platform[] = Object.values(PlatformEnum);

export const findBestUrlForTopic = async (topic: string, keys?: ApiKeys): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getGoogleApiKey(keys) });
    const prompt = `You are an expert web researcher. Your task is to find the single most authoritative and relevant URL for the following topic. This could be an official website, a high-quality article, a product page, or a primary source.

Topic: "${topic}"

Provide ONLY the URL in your response. Do not include any other text, explanation, or formatting.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    
    let url = response.text.trim();
    // Clean up potential markdown or quotes
    url = url.replace(/[`"'<>]/g, '');
    
    if (URL.canParse(url)) {
        return url;
    }
    
    // If parsing fails, try to find a URL within the text
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    if (urlMatch && URL.canParse(urlMatch[0])) {
        return urlMatch[0];
    }

    console.error("AI did not return a valid URL. Response:", response.text);
    throw new Error("AI research failed to find a valid URL. Please try a different topic.");
};


export const performResearch = async (topic: string, sourceUrl?: string): Promise<ResearchReport> => {
  const ai = new GoogleGenAI({ apiKey: getGoogleApiKey() });
  
  let researchContext = `Analyze the topic: "${topic}".`;
  if (sourceUrl) {
    researchContext += ` Your primary source of information should be the content at this URL: ${sourceUrl}. If you cannot access the URL, use Google Search as a fallback.`;
  } else {
    researchContext += ` Use Google Search to find information on this topic.`;
  }

  const prompt = `${researchContext}
  
  Your task is to perform a detailed analysis and provide strategic recommendations for creating viral marketing content. Based on your research, generate a JSON object with the following structure:
  - sentiment: A single word classification ('Positive', 'Negative', 'Neutral', 'Mixed'). This reflects the general public or media sentiment around the topic.
  - summary: A 2-3 sentence summary of your findings. Mention key positive aspects (good press) and negative aspects (bad press) to be aware of.
  - keywordsToInclude: An array of 5-10 specific, high-impact keywords or phrases that are essential for discoverability and engagement.
  - keywordsToExclude: An array of 3-5 specific keywords or phrases to avoid. These could be related to competitors, negative sentiment, or off-brand concepts.
  - negativePrompt: A string containing a suggested "negative prompt" for content generation, outlining what the AI should avoid doing or saying (e.g., "Avoid cliches like 'game-changer'. Do not mention the product's price.").
  
  Provide ONLY the raw JSON object in your response. Do not wrap it in markdown formatting or add any explanatory text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro', // Using a more powerful model for analysis
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  try {
    let jsonText = response.text.trim();
    
    // Find the start and end of the JSON object to handle potential markdown or other text
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No valid JSON object found in the AI's response.");
    }
    
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    
    return JSON.parse(jsonText) as ResearchReport;
  } catch (e) {
    console.error("Failed to parse research JSON from AI:", response.text, e);
    throw new Error("The AI returned an invalid analysis format. Please try again.");
  }
};

const getPlatformPrompt = (platform: Platform, options: GenerationOptions, trendingTopics?: string) => {
  const { topic, targetAudience, tone, category, keywordsToInclude, keywordsToExclude, negativePrompt, sourceUrl, research, musicPrompt, sfxPrompt } = options;

  let basePrompt: string;

  if (sourceUrl) {
    basePrompt = `You are a world-class viral content strategist and creator for the social media platform: ${platform}.

**Primary Directive:** Your most important task is to deeply analyze the content found at the provided Source URL. The post you generate MUST be based on the information, key points, and subject matter from this URL.
**Source URL:** ${sourceUrl}

**Focal Topic/Angle:** Within the context of the URL's content, focus on "${topic || 'the main subject of the page'}". This topic should guide your angle, but the URL's content is your primary source of truth.

**IMPORTANT FALLBACK:** If you are absolutely unable to access or analyze the content at the Source URL, you MUST disregard it and instead generate the post based *solely* on the "Focal Topic/Angle". Do not mention that the URL was inaccessible in the final post itself.
`;
  } else {
    basePrompt = `You are a world-class viral content strategist and creator for the social media platform: ${platform}.

**Primary Goal:** Generate a post about "${topic}".
`;
  }
  
  if (research) {
     basePrompt += `
**Strategic Context from Research:**
- Overall Sentiment: ${research.sentiment}
- Key Summary: ${research.summary}
- Use this context to inform the angle and emotional tone of the post.
`;
  }

  basePrompt += `
**Content Category/Campaign:** ${category || 'General Content'}
**Target Audience:** ${targetAudience || 'A general audience'}
**Tone of Voice:** ${tone}

**Mandatory Keywords:** You MUST naturally integrate the following keywords: "${keywordsToInclude || 'None'}".
**Forbidden Keywords:** You MUST NOT use the following keywords: "${keywordsToExclude || 'None'}".
**Negative Prompt / Constraints:** Strictly adhere to these constraints: ${negativePrompt || 'None'}.
`;
  
  if (trendingTopics) {
    basePrompt += `
**Trending Context:** If relevant, subtly weave in these trending topics: ${trendingTopics}.
`;
  }
  
  basePrompt += "\n**Platform-Specific Instructions:**\n";

  switch (platform) {
    case PlatformEnum.Blog:
      return `${basePrompt}Generate a well-structured blog post of 500-800 words with a catchy title, introduction, several sub-headings with detailed content, and a conclusion. Use markdown for formatting.`;
    case PlatformEnum.Instagram:
      return `${basePrompt}Generate an engaging Instagram caption. Include relevant emojis and a strong call to action. Suggest 5-10 relevant, popular hashtags on separate lines.`;
    case PlatformEnum.Facebook:
      return `${basePrompt}Generate a slightly longer, community-building Facebook post. Ask a question to encourage comments and engagement.`;
    case PlatformEnum.X:
      return `${basePrompt}Generate a concise and punchy X (formerly Twitter) post under 280 characters. Use 2-3 relevant hashtags.`;
    case PlatformEnum.TikTok:
      return `${basePrompt}Generate a TikTok video script concept.
The response MUST have the following structure, and nothing else:
VISUALS:
[Describe scenes, on-screen text, and suggested trending audio here. Also consider these audio prompts: Music: ${musicPrompt || 'none'}, Sound Effects: ${sfxPrompt || 'none'}]

VOICEOVER SCRIPT:
[Write the voiceover script here. This is the text that will be converted to audio. Keep it concise and engaging for a short-form video.]`;
    case PlatformEnum.YouTube:
      return `${basePrompt}Generate a YouTube video script concept. The video should be engaging and between 5-10 minutes long.
The response MUST have the following structure, and nothing else:
TITLE:
[A catchy, SEO-friendly title]

DESCRIPTION:
[A detailed description including relevant links and keywords. Add 5-10 relevant hashtags.]

VISUALS:
[Describe scenes, on-screen text/graphics, and camera angles. Also consider these audio prompts: Music: ${musicPrompt || 'none'}, Sound Effects: ${sfxPrompt || 'none'}]

VOICEOVER SCRIPT:
[Write the full voiceover script here. This is the text that will be converted to audio.]`;
    case PlatformEnum.Podcast:
      return `${basePrompt}Generate a podcast episode script. The episode should be around 5-10 minutes in length.
The response MUST have the following structure, and nothing else:
TITLE:
[A compelling title for the podcast episode]

SHOW NOTES:
[A summary of the episode, key takeaways, and any relevant links.]

SCRIPT:
[Write the full podcast script here. This includes host narration, and could include sections for music breaks or sound effects. This is the text that will be converted to audio.]`;
    case PlatformEnum.Bluesky:
      return `${basePrompt}Generate a short, conversational Bluesky post. It can be slightly longer and more casual than an X post.`;
    case PlatformEnum.LinkedIn:
      return `${basePrompt}Generate a professional LinkedIn post. Focus on industry insights, professional value, or thought leadership. Use 3-5 professional hashtags.`;
    case PlatformEnum.PressRelease:
      return `${basePrompt}Generate a formal press release. Include a headline, dateline, introduction (5 Ws), body paragraphs with quotes, and a boilerplate about the company/person.`;
    default:
      return basePrompt + `Generate a suitable post for ${platform}.`;
  }
};

const generateAudio = async (text: string, elevenLabsKey: string): Promise<string | undefined> => {
    if (!elevenLabsKey) {
        console.error("ElevenLabs API Key is not provided.");
        return undefined;
    }
    
    const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
    const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': elevenLabsKey,
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: { stability: 0.5, similarity_boost: 0.5 },
            }),
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.statusText}`);
        }

        const audioBlob = await response.blob();
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });

    } catch (error) {
        console.error("Failed to generate audio from ElevenLabs:", error);
        return undefined;
    }
};

const generateTextContent = async (platform: Platform, options: GenerationOptions, trendingTopics?: string, keys?: ApiKeys): Promise<Pick<Post, 'content' | 'groundingSources'>> => {
    const ai = new GoogleGenAI({ apiKey: getGoogleApiKey(keys) });
    const prompt = getPlatformPrompt(platform, options, trendingTopics);
    const useGrounding = options.useTrendingTopics || !!options.sourceUrl;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: useGrounding ? { tools: [{ googleSearch: {} }] } : {}
    });

    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter(Boolean) || [];

    return { content: response.text, groundingSources };
};

const generateImage = async (topic: string, tone: string, model: string, keys?: ApiKeys): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getGoogleApiKey(keys) });
    const response = await ai.models.generateImages({
        model: model || 'imagen-4.0-generate-001',
        prompt: `Create a visually stunning, viral-style image related to: ${topic}. The tone should be ${tone}. Cinematic, high detail.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

const generateVideo = async (options: GenerationOptions, updateCallback: (message: string) => void, keys?: ApiKeys): Promise<string> => {
    const { topic, tone, videoModel, musicPrompt, sfxPrompt } = options;
    const apiKey = getGoogleApiKey(keys);
    const videoAI = new GoogleGenAI({ apiKey });
    
    let videoPrompt = `A cinematic, high-energy video about ${topic}. Tone: ${tone}. Perfect for social media.`;
    if (musicPrompt) videoPrompt += ` Include background music that feels ${musicPrompt}.`;
    if (sfxPrompt) videoPrompt += ` Incorporate sound effects like ${sfxPrompt}.`;

    updateCallback('Step 1/3: Initiating video generation...');
    let operation = await videoAI.models.generateVideos({
        model: videoModel || 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        config: { 
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '9:16'
         }
    });
    
    updateCallback('Step 2/3: Rendering video... This can take several minutes.');
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        try {
            operation = await videoAI.operations.getVideosOperation({ operation: operation });
        } catch(e) {
            console.warn("Polling failed, will retry.", e);
        }
    }
    
    updateCallback('Step 3/3: Finalizing video link...');
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation completed but no download link was found.');
    }
    return `${downloadLink}&key=${apiKey}`;
};


export const generateContentForAllPlatforms = async (
    options: GenerationOptions, 
    updateCallback: (message: string) => void,
    postUpdateCallback: (postId: string, update: Partial<Post>) => void,
    errorCallback: (error: Error) => void,
    apiKeys?: ApiKeys
): Promise<Post[]> => {
    const { platforms, useTrendingTopics, includeImage, includeVideo, topic, tone, category, clientId, imageModel } = options;
    let trendingTopics: string | undefined;
    let groundingSources: any[] = [];
    
    const ai = new GoogleGenAI({ apiKey: getGoogleApiKey(apiKeys) });

    if (useTrendingTopics) {
        updateCallback('Researching trending topics...');
        try {
            const trendResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `What are the top 3-5 trending topics or news related to "${topic}" right now? List them briefly.`,
                config: { tools: [{ googleSearch: {} }] }
            });
            trendingTopics = trendResponse.text;
            groundingSources = trendResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
                ?.map((chunk: any) => chunk.web)
                .filter(Boolean) || [];
        } catch (error) {
            console.error("Failed to fetch trending topics:", error);
            trendingTopics = "Could not fetch trending topics.";
        }
    }

    updateCallback('Generating text content...');
    const textGenerationPromises = platforms.map(platform =>
        generateTextContent(platform, options, trendingTopics, apiKeys)
    );
    const textResults = await Promise.all(textGenerationPromises);

    let posts: Post[] = platforms.map((platform, index) => ({
        id: crypto.randomUUID(),
        platform,
        clientId,
        content: textResults[index].content,
        trendingTopics: trendingTopics?.split('\n'),
        groundingSources: textResults[index].groundingSources?.length > 0 ? textResults[index].groundingSources : (useTrendingTopics ? groundingSources : undefined),
        category: category || undefined,
        status: PostStatus.Draft,
        createdAt: new Date().toISOString(),
        generationOptions: options,
        internalNotes: '',
        clientFeedback: '',
    }));

    // Generate audio for platforms that need it
    updateCallback('Generating voiceovers...');
    const elevenLabsKey = getElevenLabsApiKey(apiKeys);
    posts = await Promise.all(posts.map(async (post) => {
        let script: string | undefined;

        if ((post.platform === PlatformEnum.TikTok || post.platform === PlatformEnum.YouTube) && post.content.includes('VOICEOVER SCRIPT:')) {
            script = post.content.split('VOICEOVER SCRIPT:')[1]?.trim();
        } else if (post.platform === PlatformEnum.Podcast && post.content.includes('SCRIPT:')) {
            script = post.content.split('SCRIPT:')[1]?.trim();
        }
        
        if (script) {
            const audioUrl = await generateAudio(script, elevenLabsKey);
            if (audioUrl) {
                return { ...post, audioUrl };
            }
        }
        return post;
    }));

    let imageUrl: string | undefined;
    if (includeImage) {
        updateCallback('Generating viral image...');
        imageUrl = await generateImage(topic, tone, imageModel || 'imagen-4.0-generate-001', apiKeys);
        posts.forEach(post => {
            if (post.platform !== PlatformEnum.Blog && post.platform !== PlatformEnum.PressRelease) {
                post.imageUrl = imageUrl;
            }
        });
    }
    
    if (includeVideo) {
        const postsThatNeedVideo = posts.filter(p => 
            p.platform === PlatformEnum.TikTok || 
            p.platform === PlatformEnum.Instagram ||
            p.platform === PlatformEnum.YouTube
        );
        
        postsThatNeedVideo.forEach(p => {
            p.videoUrl = 'GENERATING';
        });
        
        generateVideo(options, updateCallback, apiKeys).then(finalVideoUrl => {
            postsThatNeedVideo.forEach(p => {
                postUpdateCallback(p.id, { videoUrl: finalVideoUrl });
            });
        }).catch(err => {
            console.error("Video generation failed in background", err);
            errorCallback(err as Error);
            postsThatNeedVideo.forEach(p => {
                postUpdateCallback(p.id, { 
                    videoUrl: 'FAILED',
                    content: p.content + '\n\n[Video generation failed]'
                });
            });
        });
    }

    return posts;
};

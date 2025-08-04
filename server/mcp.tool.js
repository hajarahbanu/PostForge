import { config } from "dotenv"
import { TwitterApi } from "twitter-api-v2"
import fs from "fs"
import path from "path"
import https from "https"
import http from "http"
config()

const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

// Helper function to enhance content with AI
async function enhanceContent(basicContent) {
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Transform this basic social media post into an engaging, human-like tweet that people will want to interact with. Make it:
        - More conversational and authentic
        - Include relevant emojis naturally 
        - Add a call-to-action or question to encourage engagement
        - Keep it under 280 characters
        - Remove any timestamps
        - Make it feel personal and relatable
        
        Original: "${basicContent}"
        
        Enhanced version:`;

        const result = await model.generateContent(prompt);
        const enhanced = result.response.text().trim();
        
        // Remove quotes if the AI wrapped the response in them
        return enhanced.replace(/^["']|["']$/g, '');
        
    } catch (error) {
        console.error("Content enhancement error:", error);
        // Fallback: just remove timestamp and return original
        return basicContent.replace(/\s*—\s*\d{1,2}:\d{2}:\d{2}\s*(AM|PM)?\s*$/, '');
    }
}

// Helper function to extract poll options from question using AI
async function extractPollOptions(question) {
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Given this poll question, generate 2-4 relevant poll options that make sense for the question. Return ONLY the options as a JSON array of strings, nothing else.

        Question: "${question}"
        
        Examples:
        - For "What's your favorite programming language?" → ["JavaScript", "Python", "Java", "C++"]
        - For "Best time to post on social media?" → ["Morning", "Afternoon", "Evening", "Night"]
        - For "Most useful social media app?" → ["Instagram", "Twitter/X", "LinkedIn", "TikTok"]
        - For "Preferred way to learn coding?" → ["Online courses", "Books", "YouTube", "Practice projects"]
        
        Response (JSON array only):`;

        const result = await model.generateContent(prompt);
        const response = result.response.text().trim();
        
        // Try to parse the JSON response
        try {
            const options = JSON.parse(response);
            if (Array.isArray(options) && options.length >= 2 && options.length <= 4) {
                return options.slice(0, 4); // Ensure max 4 options
            }
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON:", response);
        }
        
        // Fallback: extract from common patterns
        return extractFallbackOptions(question);
        
    } catch (error) {
        console.error("Poll options extraction error:", error);
        return extractFallbackOptions(question);
    }
}

// Fallback option extraction with pattern matching
function extractFallbackOptions(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Common poll patterns
    const patterns = {
        'framework': ['React', 'Angular', 'Vue', 'Svelte'],
        'programming language': ['JavaScript', 'Python', 'Java', 'C++'],
        'social media': ['Instagram', 'Twitter/X', 'LinkedIn', 'TikTok'],
        'time': ['Morning', 'Afternoon', 'Evening', 'Night'],
        'season': ['Spring', 'Summer', 'Fall', 'Winter'],
        'food': ['Pizza', 'Burger', 'Pasta', 'Sushi'],
        'coffee': ['Espresso', 'Latte', 'Cappuccino', 'Americano'],
        'music': ['Pop', 'Rock', 'Hip-hop', 'Classical'],
        'movie': ['Action', 'Comedy', 'Drama', 'Sci-fi'],
        'color': ['Blue', 'Red', 'Green', 'Purple'],
        'browser': ['Chrome', 'Firefox', 'Safari', 'Edge'],
        'operating system': ['Windows', 'macOS', 'Linux', 'Mobile'],
        'database': ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite'],
        'editor': ['VS Code', 'WebStorm', 'Sublime', 'Vim'],
        'css framework': ['Tailwind', 'Bootstrap', 'Bulma', 'Material'],
        'cloud': ['AWS', 'Google Cloud', 'Azure', 'Vercel']
    };
    
    // Check for pattern matches
    for (const [pattern, options] of Object.entries(patterns)) {
        if (lowerQuestion.includes(pattern)) {
            return options;
        }
    }
    
    // If no pattern matches, create generic options based on question type
    if (lowerQuestion.includes('best') || lowerQuestion.includes('favorite')) {
        return ['Option A', 'Option B', 'Option C', 'Other'];
    } else if (lowerQuestion.includes('do you') || lowerQuestion.includes('would you')) {
        return ['Yes', 'No', 'Maybe', 'Not sure'];
    } else {
        return ['Yes', 'No']; // Final fallback
    }
}

// Your existing createPost function - enhanced
export async function createPost(status) {
    try {
        // Enhance the content first
        const enhancedStatus = await enhanceContent(status);
        console.log("Original:", status);
        console.log("Enhanced:", enhancedStatus);

        const response = await twitterClient.v2.tweet(enhancedStatus);

        return {
            content: [
                {
                    type: "text",
                    text: `✅ Tweeted: ${enhancedStatus}`
                }
            ]
        };
    } catch (error) {
        console.error("Twitter API Error:", error);

        if (
            error.code === 403 &&
            error.data?.detail?.includes("duplicate content")
        ) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ Error: Duplicate tweet content is not allowed. Please try something different."
                    }
                ]
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: `Failed to tweet. Error: ${error.message}`
                }
            ]
        };
    }
}

// Enhanced createPoll function with smart option extraction
export async function createPoll(question, options = null, durationMinutes = 1440) {
    try {
        let pollOptions = options;
        
        // If no options provided or empty array, extract them from the question
        if (!pollOptions || pollOptions.length === 0) {
            console.log("No valid options provided, extracting from question...");
            pollOptions = await extractPollOptions(question);
        }
        
        // Validate options
        if (!Array.isArray(pollOptions) || pollOptions.length < 2 || pollOptions.length > 4) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ Error: Polls must have between 2 and 4 options."
                    }
                ]
            };
        }

        // Enhance the poll question
        const enhancedQuestion = await enhanceContent(question);
        console.log("Original poll:", question);
        console.log("Enhanced poll:", enhancedQuestion);
        console.log("Poll options:", pollOptions);

        const response = await twitterClient.v2.tweet({
            text: enhancedQuestion,
            poll: {
                options: pollOptions,
                duration_minutes: durationMinutes
            }
        });

        return {
            content: [
                {
                    type: "text",
                    text: `🗳️ Poll created: ${enhancedQuestion}\nOptions: ${pollOptions.join(', ')}\nDuration: ${Math.floor(durationMinutes / 60)} hours`
                }
            ]
        };
    } catch (error) {
        console.error("Poll creation error:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Failed to create poll. Error: ${error.message}`
                }
            ]
        };
    }
}

// Helper function to download image from URL
async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filename);
        
        protocol.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filename);
            });
        }).on('error', (err) => {
            fs.unlink(filename, () => {}); // Delete the file on error
            reject(err);
        });
    });
}

// Helper function to extract better search keywords
function extractImageKeywords(content) {
    // Extract main keywords and simplify for better image search
    const keywords = content.toLowerCase();
    
    // Map complex topics to simpler visual search terms
    const keywordMappings = {
        'framework': 'web development coding framework',
        'react': 'react framework coding',
        'angular': 'angular framework coding',
        'vue': 'vue framework coding',  
        'javascript': 'javascript coding',
        'frontend': 'frontend development coding',
        'backend': 'backend development coding',
        'developer': 'software developer coding',
        'programming': 'coding computer programming',
        'coding': 'coding computer programming',
        'ghibli': 'anime studio ghibli',
        'studio ghibli': 'anime studio ghibli',
        'anime': 'anime',
        'coffee': 'coffee cup',
        'italy': 'italy landscape',
        'tourism': 'travel destination',
        'travel': 'travel destination',
        'sunset': 'sunset landscape',
        'morning': 'morning sunrise',
        'food': 'delicious food',
        'culture': 'culture art',
        'heritage': 'architecture history',
        'nature': 'nature landscape',
        'technology': 'modern technology'
    };
    
    // Find the best matching keyword
    for (const [key, value] of Object.entries(keywordMappings)) {
        if (keywords.includes(key)) {
            console.log(`Found keyword mapping: "${key}" -> "${value}"`);
            return value;
        }
    }
    
    // Extract first meaningful word if no mapping found
    const words = content.split(' ').filter(word => 
        word.length > 3 && 
        !['with', 'about', 'the', 'and', 'or', 'but', 'for', 'from', 'post', 'tweet', 'asking'].includes(word.toLowerCase())
    );
    
    const result = words.slice(0, 2).join(' ') || 'abstract technology';
    console.log(`Extracted keywords: "${result}" from "${content}"`);
    return result;
}

// Helper function to search for images on Unsplash
async function searchUnsplashImage(query) {
    try {
        const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
        if (!unsplashAccessKey) {
            throw new Error("UNSPLASH_ACCESS_KEY not found in environment variables");
        }

        // Use the improved keyword extraction
        const searchTerm = extractImageKeywords(query);
        console.log(`Improved search term: "${searchTerm}" (from: "${query}")`);

        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=landscape`, {
            headers: {
                'Authorization': `Client-ID ${unsplashAccessKey}`
            }
        });

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results[0].urls.regular; // Returns a high-quality image URL
        }
        
        return null;
    } catch (error) {
        console.error("Unsplash search error:", error);
        return null;
    }
}

// NEW: Create question post with image (poll alternative)
export async function createQuestionWithImage(question, searchQuery) {
    try {
        console.log(`Creating question post with image for: ${question}`);
        
        // Search for relevant image
        const imageUrl = await searchUnsplashImage(searchQuery);
        
        if (!imageUrl) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Could not find a suitable image for "${searchQuery}". Try with a different topic.`
                    }
                ]
            };
        }

        // Enhance the question to be more engaging
        const enhancedQuestion = await enhanceQuestionPost(question);
        console.log("Original question:", question);
        console.log("Enhanced question:", enhancedQuestion);

        // Use the existing createPostWithImage function
        return await createPostWithImage(enhancedQuestion, imageUrl);
        
    } catch (error) {
        console.error("Question with image error:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Failed to create question post with image. Error: ${error.message}`
                }
            ]
        };
    }
}

// Helper function to enhance question posts specifically
async function enhanceQuestionPost(question) {
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Transform this question into an engaging social media post that encourages replies and discussion. Make it:
        - More conversational and inviting
        - Include relevant emojis naturally
        - Add context or personal touch to make it more relatable
        - Encourage people to reply in comments with their answers
        - Keep it under 280 characters
        - Make it feel like a genuine conversation starter
        
        Original question: "${question}"
        
        Enhanced post:`;

        const result = await model.generateContent(prompt);
        const enhanced = result.response.text().trim();
        
        // Remove quotes if the AI wrapped the response in them
        return enhanced.replace(/^["']|["']$/g, '');
        
    } catch (error) {
        console.error("Question enhancement error:", error);
        // Fallback: just add some engagement elements
        return `${question} 🤔💭 Drop your answer in the replies! I'm curious to hear your thoughts! ⬇️`;
    }
}

export async function createPostWithAutoImage(status, searchQuery) {
    try {
        console.log(`Searching for image related to: ${searchQuery}`);
        
        // Search for relevant image
        const imageUrl = await searchUnsplashImage(searchQuery);
        
        if (!imageUrl) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Could not find a suitable image for "${searchQuery}". Try posting without image or provide a specific image URL.`
                    }
                ]
            };
        }

        // Enhance the content first
        const enhancedStatus = await enhanceContent(status);
        console.log("Original:", status);
        console.log("Enhanced:", enhancedStatus);

        // Use the existing createPostWithImage function with enhanced content
        return await createPostWithImage(enhancedStatus, imageUrl);
        
    } catch (error) {
        console.error("Auto image post error:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Failed to create post with auto image. Error: ${error.message}`
                }
            ]
        };
    }
}

// NEW: Create post with image function - enhanced
export async function createPostWithImage(status, imageUrl) {
    try {
        // Enhance content if it looks basic (contains timestamp or is very simple)
        let finalStatus = status;
        if (status.includes('—') || status.split(' ').length < 8) {
            finalStatus = await enhanceContent(status);
            console.log("Original:", status);
            console.log("Enhanced:", finalStatus);
        }

        console.log("Attempting to tweet with image:", finalStatus);

        // Create temp directory if it doesn't exist
        const tempDir = './temp';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // Download image to temp file
        const tempImagePath = path.join(tempDir, `temp_image_${Date.now()}.jpg`);
        await downloadImage(imageUrl, tempImagePath);

        // Upload image to Twitter
        const mediaId = await twitterClient.v1.uploadMedia(tempImagePath);

        // Create tweet with image
        const response = await twitterClient.v2.tweet({
            text: finalStatus,
            media: { media_ids: [mediaId] }
        });

        // Clean up temp file
        fs.unlinkSync(tempImagePath);

        return {
            content: [
                {
                    type: "text",
                    text: `🖼️ Tweeted with image: ${finalStatus}`
                }
            ]
        };
    } catch (error) {
        console.error("Twitter API Error with image:", error);

        if (
            error.code === 403 &&
            error.data?.detail?.includes("duplicate content")
        ) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ Error: Duplicate tweet content is not allowed. Please try something different."
                    }
                ]
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: `❌ Failed to tweet with image. Error: ${error.message}`
                }
            ]
        };
    }
}
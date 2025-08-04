import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createPost, createPoll, createPostWithImage, createPostWithAutoImage, createQuestionWithImage } from "./mcp.tool.js";
import { dbOperations } from "./database.js";
import { startScheduler, schedulePost } from "./scheduler.js";
import { z } from "zod";

const server = new McpServer({
    name: "example-server",
    version: "1.0.0"
});

const app = express();

// Enable CORS and JSON parsing
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());

// MCP Server Tools
server.tool(
    "addTwoNumbers",
    "Add two numbers",
    {
        a: z.number(),
        b: z.number()
    },
    async (arg) => {
        const { a, b } = arg;
        return {
            content: [
                {
                    type: "text",
                    text: `The sum of ${a} and ${b} is ${a + b}`
                }
            ]
        }
    }
)

server.tool(
    "createPost",
    "Create a post on X formally known as Twitter", {
    status: z.string()
}, async (arg) => {
    const { status } = arg;
    return createPost(status);
})

server.tool(
    "createPoll",
    "Create an interactive poll on X (formerly Twitter)",
    {
        question: z.string().describe("The poll question/text"),
        options: z.array(z.string()).min(2).max(4).describe("Poll options (2-4 choices)"),
        durationMinutes: z.number().min(5).max(10080).default(1440).describe("Poll duration in minutes (default 24 hours)")
    },
    async (arg) => {
        const { question, options, durationMinutes } = arg;
        return createPoll(question, options, durationMinutes);
    }
)

server.tool(
    "createPostWithImage",
    "Create a post on X with an image or GIF",
    {
        status: z.string().describe("The tweet text/status"),
        imageUrl: z.string().describe("URL of the image or GIF to attach")
    },
    async (arg) => {
        const { status, imageUrl } = arg;
        return createPostWithImage(status, imageUrl);
    }
)

server.tool(
    "createPostWithAutoImage", 
    "Create a post on X with an automatically found relevant image",
    {
        status: z.string().describe("The tweet text/status"),
        searchQuery: z.string().describe("Keywords to search for a relevant image (e.g., 'sunset', 'coding', 'coffee')")
    },
    async (arg) => {
        const { status, searchQuery } = arg;
        return createPostWithAutoImage(status, searchQuery);
    }
)

server.tool(
    "createQuestionWithImage",
    "Create an engaging question post with a relevant image to encourage discussion (alternative to polls with images)",
    {
        question: z.string().describe("The question to ask your audience"),
        searchQuery: z.string().describe("Keywords to search for a relevant image")
    },
    async (arg) => {
        const { question, searchQuery } = arg;
        return createQuestionWithImage(question, searchQuery);
    }
)

// MCP Server Transport Setup
const transports = {};

app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    transports[transport.sessionId] = transport;
    res.on("close", () => {
        delete transports[transport.sessionId];
    });
    await server.connect(transport);
});

app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId;
    const transport = transports[sessionId];
    if (transport) {
        await transport.handlePostMessage(req, res);
    } else {
        res.status(400).send('No transport found for sessionId');
    }
});

// HTTP API endpoints for the frontend
app.post('/api/createPost', async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }
        const result = await createPost(status);
        res.json({ success: true, message: result.content[0].text });
    } catch (error) {
        console.error('API createPost error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/createPoll', async (req, res) => {
    try {
        const { question, options, durationMinutes = 1440 } = req.body;
        if (!question) {
            return res.status(400).json({ success: false, message: 'Question is required' });
        }
        
        // Handle case where options is empty array or null - let the tool extract them
        let pollOptions = options;
        if (!pollOptions || pollOptions.length === 0) {
            pollOptions = null; // Let the tool handle option extraction
        }
        
        const result = await createPoll(question, pollOptions, durationMinutes);
        res.json({ success: true, message: result.content[0].text });
    } catch (error) {
        console.error('API createPoll error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/createPostWithImage', async (req, res) => {
    try {
        const { status, imageUrl } = req.body;
        if (!status || !imageUrl) {
            return res.status(400).json({ success: false, message: 'Status and imageUrl are required' });
        }
        const result = await createPostWithImage(status, imageUrl);
        res.json({ success: true, message: result.content[0].text });
    } catch (error) {
        console.error('API createPostWithImage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/createPostWithAutoImage', async (req, res) => {
    try {
        const { status, searchQuery } = req.body;
        if (!status || !searchQuery) {
            return res.status(400).json({ success: false, message: 'Status and searchQuery are required' });
        }
        const result = await createPostWithAutoImage(status, searchQuery);
        res.json({ success: true, message: result.content[0].text });
    } catch (error) {
        console.error('API createPostWithAutoImage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/createQuestionWithImage', async (req, res) => {
    try {
        const { question, searchQuery } = req.body;
        if (!question || !searchQuery) {
            return res.status(400).json({ success: false, message: 'Question and searchQuery are required' });
        }
        const result = await createQuestionWithImage(question, searchQuery);
        res.json({ success: true, message: result.content[0].text });
    } catch (error) {
        console.error('API createQuestionWithImage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Scheduling API endpoints
app.post('/api/schedule-post', async (req, res) => {
    try {
        const { content, postType, scheduledTime, metadata } = req.body;
        
        // Validate required fields
        if (!content || !postType || !scheduledTime) {
            return res.status(400).json({ 
                success: false, 
                message: 'Content, postType, and scheduledTime are required' 
            });
        }
        
        // Validate post type
        const validPostTypes = ['post', 'poll', 'image', 'auto_image', 'question_image'];
        if (!validPostTypes.includes(postType)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid post type' 
            });
        }
        
        // Validate scheduled time is in the future
        const scheduledDate = new Date(scheduledTime);
        if (scheduledDate <= new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Scheduled time must be in the future' 
            });
        }
        
        const postId = schedulePost({
            content,
            postType,
            scheduledTime: scheduledDate.toISOString(),
            metadata: metadata || {}
        });
        
        res.json({ 
            success: true, 
            message: 'Post scheduled successfully',
            postId,
            scheduledTime: scheduledDate.toISOString()
        });
        
    } catch (error) {
        console.error('API schedule-post error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/scheduled-posts', async (req, res) => {
    try {
        const posts = dbOperations.getAllScheduledPosts();
        res.json({ success: true, posts });
    } catch (error) {
        console.error('API scheduled-posts error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/scheduled-posts/pending', async (req, res) => {
    try {
        const posts = dbOperations.getPendingScheduledPosts();
        res.json({ success: true, posts });
    } catch (error) {
        console.error('API pending scheduled-posts error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/scheduled-posts/:id', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const result = dbOperations.cancelScheduledPost(postId);
        
        if (result.changes === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found or already processed' 
            });
        }
        
        res.json({ success: true, message: 'Post cancelled successfully' });
    } catch (error) {
        console.error('API cancel scheduled-post error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(3001, () => {
    console.log("Server is running on http://localhost:3001");
    console.log("Now supports: tweets, polls, image posts, auto-image posts, and question posts with images!");
    console.log("API endpoints available at /api/*");
    
    // Start the scheduler
    startScheduler();
});
import cron from 'node-cron';
import { dbOperations } from './database.js';
import { createPost, createPoll, createPostWithImage, createPostWithAutoImage, createQuestionWithImage } from './mcp.tool.js';

// Map post types to their corresponding functions
const postHandlers = {
    'post': createPost,
    'poll': createPoll,
    'image': createPostWithImage,
    'auto_image': createPostWithAutoImage,
    'question_image': createQuestionWithImage
};

// Function to publish a scheduled post
const publishScheduledPost = async (scheduledPost) => {
    const { id, post_type, content, metadata } = scheduledPost;
    
    console.log(`Publishing scheduled post ${id}: ${post_type}`);
    
    try {
        let result;
        
        switch (post_type) {
            case 'post':
                result = await createPost(content);
                break;
                
            case 'poll':
                result = await createPoll(
                    content, 
                    metadata.options || ['Yes', 'No'], 
                    metadata.durationMinutes || 1440
                );
                break;
                
            case 'image':
                result = await createPostWithImage(content, metadata.imageUrl);
                break;
                
            case 'auto_image':
                result = await createPostWithAutoImage(content, metadata.searchQuery);
                break;
                
            case 'question_image':
                result = await createQuestionWithImage(content, metadata.searchQuery);
                break;
                
            default:
                throw new Error(`Unknown post type: ${post_type}`);
        }
        
        // Update status to posted
        dbOperations.updatePostStatus(id, 'posted', null, new Date().toISOString());
        
        console.log(`✅ Successfully published scheduled post ${id}`);
        return result;
        
    } catch (error) {
        console.error(`❌ Failed to publish scheduled post ${id}:`, error);
        
        // Update status to failed with error message
        dbOperations.updatePostStatus(id, 'failed', error.message);
        
        throw error;
    }
};

// Function to check and publish due posts
const checkAndPublishDuePosts = async () => {
    try {
        const duePosts = dbOperations.getPostsDueForPublishing();
        
        if (duePosts.length === 0) {
            return; // No posts due
        }
        
        console.log(`Found ${duePosts.length} posts due for publishing`);
        
        // Process each due post
        for (const post of duePosts) {
            try {
                await publishScheduledPost(post);
            } catch (error) {
                // Continue with other posts even if one fails
                console.error(`Failed to publish post ${post.id}, continuing with others...`);
            }
        }
        
    } catch (error) {
        console.error('Error checking for due posts:', error);
    }
};

// Start the scheduler
export const startScheduler = () => {
    console.log('🕐 Starting post scheduler...');
    
    // Run every minute to check for due posts
    cron.schedule('* * * * *', async () => {
        await checkAndPublishDuePosts();
    });
    
    console.log('✅ Scheduler started - checking for due posts every minute');
};

// Function to schedule a new post
export const schedulePost = (postData) => {
    try {
        const postId = dbOperations.createScheduledPost(postData);
        console.log(`📅 Scheduled new post (ID: ${postId}) for ${postData.scheduledTime}`);
        return postId;
    } catch (error) {
        console.error('Error scheduling post:', error);
        throw error;
    }
};
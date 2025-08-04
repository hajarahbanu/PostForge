import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'social_scheduler.db');

// Initialize database
const db = new Database(dbPath);

// Create tables
const initDatabase = () => {
    // Create scheduled_posts table
    const createScheduledPostsTable = `
        CREATE TABLE IF NOT EXISTS scheduled_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            post_type TEXT NOT NULL CHECK(post_type IN ('post', 'poll', 'image', 'auto_image', 'question_image')),
            scheduled_time DATETIME NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'posted', 'failed', 'cancelled')),
            platform TEXT DEFAULT 'twitter',
            metadata TEXT, -- JSON string for poll options, image URLs, etc.
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            posted_at DATETIME,
            error_message TEXT
        )
    `;
    
    db.exec(createScheduledPostsTable);
    
    // Create index for faster queries
    db.exec(`CREATE INDEX IF NOT EXISTS idx_scheduled_time ON scheduled_posts(scheduled_time, status)`);
    
    console.log('Database initialized successfully');
};

// Database operations
export const dbOperations = {
    // Create a new scheduled post
    createScheduledPost: (postData) => {
        const stmt = db.prepare(`
            INSERT INTO scheduled_posts (content, post_type, scheduled_time, metadata)
            VALUES (?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            postData.content,
            postData.postType,
            postData.scheduledTime,
            JSON.stringify(postData.metadata || {})
        );
        
        return result.lastInsertRowid;
    },
    
    // Get posts due for publishing
    getPostsDueForPublishing: () => {
        const stmt = db.prepare(`
            SELECT * FROM scheduled_posts 
            WHERE status = 'pending' 
            AND scheduled_time <= datetime('now')
            ORDER BY scheduled_time ASC
        `);
        
        return stmt.all().map(post => ({
            ...post,
            metadata: JSON.parse(post.metadata || '{}')
        }));
    },
    
    // Get all scheduled posts for a user (we'll add user support later)
    getAllScheduledPosts: () => {
        const stmt = db.prepare(`
            SELECT * FROM scheduled_posts 
            ORDER BY scheduled_time DESC
        `);
        
        return stmt.all().map(post => ({
            ...post,
            metadata: JSON.parse(post.metadata || '{}')
        }));
    },
    
    // Get pending scheduled posts
    getPendingScheduledPosts: () => {
        const stmt = db.prepare(`
            SELECT * FROM scheduled_posts 
            WHERE status = 'pending'
            ORDER BY scheduled_time ASC
        `);
        
        return stmt.all().map(post => ({
            ...post,
            metadata: JSON.parse(post.metadata || '{}')
        }));
    },
    
    // Update post status
    updatePostStatus: (postId, status, errorMessage = null, postedAt = null) => {
        const stmt = db.prepare(`
            UPDATE scheduled_posts 
            SET status = ?, error_message = ?, posted_at = ?
            WHERE id = ?
        `);
        
        return stmt.run(status, errorMessage, postedAt || new Date().toISOString(), postId);
    },
    
    // Delete/cancel a scheduled post
    cancelScheduledPost: (postId) => {
        const stmt = db.prepare(`
            UPDATE scheduled_posts 
            SET status = 'cancelled'
            WHERE id = ? AND status = 'pending'
        `);
        
        return stmt.run(postId);
    },
    
    // Get post by ID
    getScheduledPostById: (postId) => {
        const stmt = db.prepare(`
            SELECT * FROM scheduled_posts WHERE id = ?
        `);
        
        const post = stmt.get(postId);
        if (post) {
            post.metadata = JSON.parse(post.metadata || '{}');
        }
        return post;
    }
};

// Initialize database on import
initDatabase();

export default db;
import { kv } from '@cloudflare/kv-store';
import crypto from 'crypto';

const STATS_KV = 'STATS_KV';

function sha1(input) {
    return crypto.createHash('sha1').update(input).digest('hex');
}

export async function onRequestGet({ request }) {
    const ip = request.headers.get('CF-Connecting-IP');
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    try {
        // Create a unique daily token for the visitor
        const hashInput = ip + dateStr;
        const dailyToken = sha1(hashInput);
        
        // Check analytics in KV store
        const existingVisit = await kv.get(`visitor:${dateStr}`);
        
        if (existingVisit === null) {
            // New visitor for the day - increment count and cache key
            await kv.set(`visitor:${dateStr}`, '1', { ttl: 24 * 60 * 60 });
            
            return json({ message: 'New unique visit recorded' }, 200);
        } else {
            // Already counted this IP today - do nothing
            return json({ message: 'Visit already counted today' }, 304);
        }
    } catch (error) {
        console.error('Pageview error:', error);
        return json({ error: 'Failed to record pageview' }, 500);
    }
}
import { kv } from '@cloudflare/kv-store';
import crypto from 'crypto';

const STATS_KV = 'STATS_KV';

function sha1(input) {
    return crypto.createHash('sha1').update(input).digest('hex');
}

export async function checkAndUpdateStats(ip, dateStr) {
    const dailyKey = `visitor:${dateStr}`;
    
    try {
        // Check if IP has already been counted today
        const exists = await kv.get(dailyKey);
        
        if (exists === null) {
            // New visitor for the day - increment count and cache key
            await kv.set(dailyKey, '1', { ttl: 24 * 60 * 60 });
            
            return true; // Indicates new unique visit
        } else {
            // Already counted this IP today - do nothing
            return false;
        }
    } catch (error) {
        console.error('KV error:', error);
        return false;
    }
}

export async function onRequestGet({ request }) {
    const ip = request.headers.get('CF-Connecting-IP');
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    try {
        // Create a unique daily token for the visitor
        const hashInput = ip + dateStr;
        const dailyToken = sha1(hashInput);
        
        // Check analytics in KV store
        const existingVisit = await checkAndUpdateStats(ip, dateStr);
        
        if (existingVisit) {
            return json({ message: 'New unique visit recorded' }, 200);
        } else {
            return json({ message: 'Visit already counted today' }, 304);
        }
    } catch (error) {
        console.error('Pageview error:', error);
        return json({ error: 'Failed to record pageview' }, 500);
    }
}
import { kv } from '@cloudflare/kv-store';
import crypto from 'crypto';

const STATS_KV = 'STATS_KV';

function sha1(input) {
    return crypto.createHash('sha1').update(input).digest('hex');
}

export async function checkAndUpdateStats(ip, dateStr) {
    const dailyKey = `visitor:${dateStr}`;
    
    try {
        // Check if IP has already been counted today
        const exists = await kv.get(dailyKey);
        
        if (exists === null) {
            // New visitor for the day - increment count and cache key
            await kv.set(dailyKey, '1', { ttl: 24 * 60 * 60 });
            
            return true; // Indicates new unique visit
        } else {
            // Already counted this IP today - do nothing
            return false;
        }
    } catch (error) {
        console.error('KV error:', error);
        return false;
    }
}

export async function onRequestGet({ request }) {
    const ip = request.headers.get('CF-Connecting-IP');
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    try {
        // Create a unique daily token for the visitor
        const hashInput = ip + dateStr;
        const dailyToken = sha1(hashInput);
        
        // Check analytics in KV store
        const existingVisit = await checkAndUpdateStats(ip, dateStr);
        
        if (existingVisit) {
            return json({ message: 'New unique visit recorded' }, 200);
        } else {
            return json({ message: 'Visit already counted today' }, 304);
        }
    } catch (error) {
        console.error('Pageview error:', error);
        return json({ error: 'Failed to record pageview' }, 500);
    }
}

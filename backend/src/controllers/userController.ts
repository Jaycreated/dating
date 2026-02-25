import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { MessageModel } from '../models/Message';
import { MatchModel } from '../models/Match';
import { UserPreferences } from '../types/index';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export class UserController {
  static async getSettings(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Parse preferences if it's a string
      const preferences = typeof user.preferences === 'string' 
        ? JSON.parse(user.preferences) 
        : user.preferences || {};

      // Return only the settings we want to expose
      const settings = {
        darkMode: preferences.darkMode || false,
        notifications: {
          matches: preferences.notifications?.matches ?? true,
          messages: preferences.notifications?.messages ?? true,
          promotions: preferences.notifications?.promotions ?? false
        }
      };

      res.json({ settings });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  }

  static async updateSettings(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      const { darkMode, notifications } = req.body;

      // Validate input
      if (darkMode !== undefined && typeof darkMode !== 'boolean') {
        return res.status(400).json({ error: 'Invalid darkMode value' });
      }

      const updateData: any = {};
      const preferences: any = {};
      
      if (darkMode !== undefined) {
        preferences.darkMode = darkMode;
      }

      if (notifications) {
        preferences.notifications = preferences.notifications || {};
        if (notifications.matches !== undefined) {
          preferences.notifications.matches = notifications.matches;
        }
        if (notifications.messages !== undefined) {
          preferences.notifications.messages = notifications.messages;
        }
        if (notifications.promotions !== undefined) {
          preferences.notifications.promotions = notifications.promotions;
        }
      }

      if (Object.keys(preferences).length > 0) {
        updateData.preferences = preferences;
      }

      await UserModel.update(userId, updateData);
      
      res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }

  static async getPublicProfile(req: Request, res: Response) {
    try {
      // The user ID is already validated by the validateUserIdParam middleware
      const userId = (req as any).validatedUserId;
      
      const user = await UserModel.findById(userId);
      
      if (!user) {
        console.error(`User not found with ID: ${userId}`);
        return res.status(404).json({ 
          error: 'User not found',
          userId: userId
        });
      }

      // Remove sensitive data
      const { password_hash, email, preferences, ...publicProfile } = user as any;
      
      // Parse photos if they're stored as JSON string
      if (publicProfile.photos && typeof publicProfile.photos === 'string') {
        try {
          publicProfile.photos = JSON.parse(publicProfile.photos);
        } catch (e) {
          console.error('Error parsing photos:', e);
          publicProfile.photos = [];
        }
      }

      res.json({ user: publicProfile });
    } catch (error) {
      console.error('Get public profile error:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  }

  /**
   * Get the authenticated user's profile
   * Requires authentication
   * GET /api/users/profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      // Get the user ID from the authenticated request
      const userId = req.userId;
      console.log('Getting profile for user ID:', userId);

      if (!userId) {
        console.error('No user ID found in request');
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          details: {
            authHeader: !!req.headers.authorization,
            userId: req.userId
          }
        });
      }
      
      // Find the user in the database
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found',
          userId
        });
      }
      
      // Handle user data processing
      let preferences: UserPreferences = {};
      if (user.preferences) {
        if (typeof user.preferences === 'string') {
          try {
            preferences = JSON.parse(user.preferences) as UserPreferences;
          } catch (error) {
            console.error('Error parsing preferences:', error);
          }
        } else if (typeof user.preferences === 'object') {
          preferences = user.preferences as UserPreferences;
        }
      }
      
      // Handle photos
      let photos: string[] = [];
      if (user.photos) {
        if (typeof user.photos === 'string') {
          try {
            const parsedPhotos = JSON.parse(user.photos);
            photos = Array.isArray(parsedPhotos) ? parsedPhotos : [];
          } catch (error) {
            console.error('Error parsing photos:', error);
          }
        } else if (Array.isArray(user.photos)) {
          photos = user.photos;
        }
      }
      
      // Remove sensitive data and construct the response
      const { password_hash, ...userWithoutPassword } = user as any;
      
      res.json({ 
        user: {
          ...userWithoutPassword,
          preferences,
          photos
        }
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const { 
        name, 
        age, 
        gender, 
        bio, 
        location, 
        photos, 
        interests, 
        preferences: userPreferences,
        sexual_orientation,
        looking_for
      } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (age) updateData.age = age;
      if (gender) updateData.gender = gender;
      if (bio) updateData.bio = bio;
      if (location) updateData.location = location;
      
      // Handle photos - ensure it's a stringified array
      if (photos) {
        updateData.photos = Array.isArray(photos) 
          ? JSON.stringify(photos)
          : JSON.stringify([photos]);
      }
      
      if (interests) {
        updateData.interests = Array.isArray(interests)
          ? JSON.stringify(interests)
          : JSON.stringify([interests]);
      }
      
      // Handle preferences including sexual_orientation and looking_for
      const preferences: UserPreferences = {};
      
      // Copy existing preferences if they exist
      if (userPreferences) {
        Object.assign(preferences, userPreferences);
      }
      
      // Update with new values if provided
      if (sexual_orientation) {
        preferences.sexual_orientation = sexual_orientation;
      }
      
      if (looking_for) {
        preferences.looking_for = looking_for;
      }
      
      // Only update preferences if we have any
      if (Object.keys(preferences).length > 0) {
        updateData.preferences = JSON.stringify(preferences);
      }

      const user = await UserModel.update(req.userId!, updateData);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password_hash, ...userWithoutPassword } = user;
      res.json({
        message: 'Profile updated successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async getPotentialMatches(req: Request, res: Response) {
    console.log('🔍 [CONTROLLER] getPotentialMatches - Starting');
    
    try {
      // Get the authenticated user ID
      const userId = req.userId;
      console.log(`👤 [CONTROLLER] Getting potential matches for user ID: ${userId}`);
      
      if (!userId) {
        console.error('❌ [CONTROLLER] No user ID in request');
        return res.status(401).json({ 
          success: false,
          error: 'Authentication required',
          details: 'No user ID found in the request. Please log in again.'
        });
      }
      
      console.log('🔍 [MATCHES] Starting to find potential matches');
      console.log(`👤 [MATCHES] Requested by user ID: ${userId} (type: ${typeof userId})`);
      
      // Log environment and configuration
      console.log('🌐 [MATCHES] Environment:', {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? '***' : 'Not set',
        port: process.env.PORT || 'Not set'
      });

      console.log('🔍 [MATCHES] Looking up user in database...');
      const user = await UserModel.findById(userId);
      
      if (!user) {
        const errorMsg = `❌ [MATCHES] User not found with ID: ${userId}`;
        console.error(errorMsg);
        return res.status(404).json({ 
          error: 'User not found',
          details: {
            userId,
            timestamp: new Date().toISOString(),
            path: req.path
          }
        });
      }
      console.log(`✅ [MATCHES] Found user: ${user.name} (ID: ${user.id})`);

      // Handle preferences - could be string or already parsed object
      let preferences: any = {};
      try {
        console.log('🔧 [MATCHES] Processing user preferences...');
        
        if (user.preferences) {
          if (typeof user.preferences === 'string') {
            console.log('📝 [MATCHES] Parsing preferences from string');
            try {
              preferences = JSON.parse(user.preferences);
            } catch (parseError) {
              console.error('❌ [MATCHES] Error parsing preferences JSON:', parseError);
              console.log('📝 [MATCHES] Raw preferences string:', user.preferences);
              // Continue with empty preferences
            }
          } else if (typeof user.preferences === 'object') {
            console.log('📝 [MATCHES] Using preferences object directly');
            preferences = user.preferences;
          }
          
          // Log sanitized preferences (without sensitive data)
          const { password, password_hash, ...safePreferences } = preferences;
          console.log('🔧 [MATCHES] User preferences:', JSON.stringify(safePreferences, null, 2));
        } else {
          console.log('ℹ️ [MATCHES] No preferences found for user');
        }
      } catch (error) {
        console.error('❌ [MATCHES] Unexpected error processing preferences:', error);
        // Continue with empty preferences
        preferences = {};
      }

      console.log('🔍 [MATCHES] Finding potential matches...');
      try {
        const startTime = Date.now();
        console.log(`⏱️ [MATCHES] Starting database query at ${new Date().toISOString()}`);
        
        const potentialMatches = await UserModel.getPotentialMatches(userId, preferences);
        
        const queryTime = Date.now() - startTime;
        console.log(`✅ [MATCHES] Found ${potentialMatches.length} potential matches in ${queryTime}ms`);

        // Remove sensitive data and log basic match info
        const sanitizedMatches = potentialMatches.map(({ password_hash, email, ...match }) => {
          const matchInfo = `👥 [MATCH] Found: ${match.name} (ID: ${match.id}, Gender: ${match.gender || 'N/A'}, Age: ${match.age || 'N/A'})`;
          console.log(matchInfo);
          return match;
        });

        // Send the response with the matches
        return res.json({ 
          success: true,
          count: sanitizedMatches.length,
          matches: sanitizedMatches,
          timestamp: new Date().toISOString()
        });
      } catch (dbError) {
        const error = dbError as Error;
        const errorId = Math.random().toString(36).substring(2, 10);
        const timestamp = new Date().toISOString();
        
        console.error(`❌ [MATCHES] [${errorId}] Database error in getPotentialMatches:`, {
          message: error.message,
          stack: error.stack,
          userId,
          timestamp
        });
        
        return res.status(500).json({ 
          error: 'Failed to fetch potential matches',
          errorId,
          timestamp,
          details: {
            message: error.message,
            path: req.path,
            userId
          }
        });
      }
    } catch (error) {
      const err = error as Error;
      const errorId = Math.random().toString(36).substring(2, 10);
      const timestamp = new Date().toISOString();
      
      console.error(`❌ [MATCHES] [${errorId}] Unexpected error in getPotentialMatches:`, {
        name: err.name,
        message: err.message,
        stack: err.stack,
        userId: req.userId,
        timestamp
      });
      
      return res.status(500).json({
        error: 'An unexpected error occurred',
        errorId,
        timestamp,
        details: {
          name: err.name,
          message: err.message,
          path: req.path,
          userId: req.userId
        }
      });
    }
  }

  static async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.userId!;
      
      // Delete user's data from all related tables in order
      // 1. Delete user's messages
      await MessageModel.deleteByUserId(userId);
      
      // 2. Delete user's matches/swipes
      await MatchModel.deleteByUserId(userId);
      
      // 3. Delete user's settings
      await UserModel.deleteSettingsByUserId(userId);
      
      // 4. Delete user's profile/images
      await UserModel.deleteProfileByUserId(userId);
      
      // 5. Finally delete the user account
      const userDeleted = await UserModel.delete(userId);
      
      if (!userDeleted) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ message: 'Failed to delete account' });
    }
  }
}

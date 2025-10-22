import { Response } from 'express';
import { UserModel } from '../models/User';
import { AuthRequest } from '../middleware/auth';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await UserModel.findById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password_hash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { name, age, gender, bio, location, photos, interests, preferences } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (age) updateData.age = age;
      if (gender) updateData.gender = gender;
      if (bio) updateData.bio = bio;
      if (location) updateData.location = location;
      if (photos) updateData.photos = JSON.stringify(photos);
      if (interests) updateData.interests = JSON.stringify(interests);
      if (preferences) updateData.preferences = JSON.stringify(preferences);

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

  static async getPotentialMatches(req: AuthRequest, res: Response) {
    try {
      const user = await UserModel.findById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Handle preferences - could be string or already parsed object
      let preferences = {};
      if (user.preferences) {
        if (typeof user.preferences === 'string') {
          preferences = JSON.parse(user.preferences);
        } else {
          preferences = user.preferences as any;
        }
      }

      const potentialMatches = await UserModel.getPotentialMatches(req.userId!, preferences);

      // Remove sensitive data
      const sanitizedMatches = potentialMatches.map(({ password_hash, email, ...match }) => match);

      res.json({ matches: sanitizedMatches });
    } catch (error) {
      console.error('Get potential matches error:', error);
      res.status(500).json({ error: 'Failed to fetch potential matches' });
    }
  }
}

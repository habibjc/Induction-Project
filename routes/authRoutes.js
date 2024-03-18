// routes/authRoutes.js
import { Router } from 'express';
const router = Router();
import User  from '../models/User.js';
import UserEntitySector from '../models/UserEntitySector.js';
import UserEntitySectorRole from '../models/UserEntitySectorRole.js';
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import { secretKey } from '../config/config.js';

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.query().where('email', email).first();

    // Verify the password using the user model method
    if (!user || !user.verifyPassword(password)) {
   // if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Fetch user's entity sectors and roles
    const entitySectors = await UserEntitySector.query().where('userId', user.id);
    const roles = await UserEntitySectorRole.query().whereIn('userEntitySectorId', entitySectors.map(sector => sector.id));
    const units = await  UserEntitySector.query().where('userId', user.id);
    // Generate JWT token with user information, entity sectors, units, and roles
    const token = sign(
      {
        userId: user.id,
        email: user.email,
        entitySectors,
        units,
        roles,
      },
      secretKey,
      // { expiresIn: '1h' }
    );

    // Return the token
    res.json({ token });
  } catch (error) {
    next(error);
  }
});

export default router;

import { Router } from 'express';
const router = Router();
const envr= require('dotenv').config();
import { createTransport } from 'nodemailer';
import { sign, verify } from 'jsonwebtoken';
import { hash } from 'bcrypt';

import { query } from '../models/User'; // Adjust this based on your user model

// 2. Generate Reset Token
const generateRandomToken = () => {
  return sign({ data: 'reset' }, process.env.RESET_TOKEN_SECRET, { expiresIn: '1h' });
};

// 3. Send Reset Link to User's Email
const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
    },
  });

  const resetLink = `http://induction.ippis.rw/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: 'sharon.gusikowski@ethereal.email',
    to: email,
    subject: 'Password Reset',
    html: `Click <a href="${resetLink}">here</a> to reset your password.`,
  };

  await transporter.sendMail(mailOptions);
};

// 4. Handle Password Reset Request
router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body;

  // 2. Generate Reset Token
  const resetToken = generateRandomToken();

  // 3. Send Reset Link to User's Email
  await sendPasswordResetEmail(email, resetToken);

  res.json({ message: 'Password reset email sent.' });
});

// 5. Allow Password Reset
const validateResetToken = (resetToken) => {
  try {
    const decoded = verify(resetToken, process.env.RESET_TOKEN_SECRET);
    return true;
  } catch (error) {
    return false;
  }
};

// 6. Update Password
router.post('/reset-password', async (req, res, next) => {
  const { email, resetToken, newPassword } = req.body;

  // 5. Allow Password Reset
  const isValidToken = validateResetToken(resetToken);

  if (!isValidToken) {
    return res.status(400).json({ error: 'Invalid or expired reset token.' });
  }

  // 6. Update Password
  const hashedPassword = await hash(newPassword, 10); // Use bcrypt to hash the new password
  await query().where('email', email).update({ password: hashedPassword });

  res.json({ message: 'Password reset successful.' });
});

export default router;

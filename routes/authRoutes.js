const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const domain = process.env.JIIT_DOMAIN;
const JWT_SECRET = process.env.JWT_SECRET;
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
function isJiitMail(email){ 
  return email.endsWith('@'+domain); 
}
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, dept, year } = req.body;

    const result1 = await pool.query(
  'SELECT user_id FROM "User" WHERE email=$1',
  [email]
);

const existing = result1.rows;

    if (existing.length > 0)
      return res.status(409).json({ error: 'Account already exists' });

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO "User"(name,email,password,dept,year,is_verified)
       VALUES($1,$2,$3,$4,$5,false)
       RETURNING user_id`,
      [name,email,hash,dept,year]
    );

    const userId = result.rows[0].user_id;

    // 🔹 Create verification token
    const token = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO "EmailVerification"(user_id,token)
       VALUES($1,$2)`,
      [userId, token]
    );

    // 🔹 Send email
    const link = `${process.env.APP_URL}/auth/verify?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your CampusBuzz account',
      html: `
        <h2>Welcome to CampusBuzz 🎉</h2>
        <p>Click below to verify:</p>
        <a href="${link}">${link}</a>
      `
    });

    res.json({ msg: "Registration successful. Check email to verify." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}); 
router.get('/verify', async (req,res)=>{
  const {token}=req.query;

  try{
    const result=await pool.query(
      `SELECT * FROM "EmailVerification" WHERE token=$1`,
      [token]
    );

    if(!result.rows.length)
      return res.send("Invalid or expired token");

    const userId=result.rows[0].user_id;

    await pool.query(
      `UPDATE "User" SET is_verified=true WHERE user_id=$1`,
      [userId]
    );

    await pool.query(
      `DELETE FROM "EmailVerification" WHERE token=$1`,
      [token]
    );

    res.send(`
      <h2>Email verified ✅</h2>
      <a href="/login.html">Login now</a>
    `);

  }catch(err){
    console.error(err);
    res.send("Verification failed");
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM "User" WHERE email=$1',
      [email]
    );

    if (!result.rows.length)
      return res.status(400).json({ error: 'No user found' });

    const user = result.rows[0];
    if (!user.is_verified)
  return res.status(403).json({ error: 'Please verify email first' });
    if (!user.is_active)
      return res.status(403).json({ error: 'Account deactivated' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(400).json({ error: 'Wrong password' });

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});


router.get('/verify-token', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      'SELECT user_id,name,email,dept,year,role,is_active,is_verified,warning_count,warning_level,created_at FROM "User" WHERE user_id=$1',
      [payload.user_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;

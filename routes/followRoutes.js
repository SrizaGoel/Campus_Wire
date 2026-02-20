const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

// FOLLOW
router.post('/follow', auth, async (req, res) => {
    const { target_id } = req.body;
    const me = req.user.user_id;

    if (me === target_id)
        return res.status(400).json({ error: "Cannot follow yourself" });

    try {
        await pool.query(
            `INSERT INTO "Followers"(follower_id, following_id)
             VALUES($1,$2)
             ON CONFLICT (follower_id, following_id) DO NOTHING`,
            [me, target_id]
        );
        res.json({ message: "Followed" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// UNFOLLOW
router.post('/unfollow', auth, async (req, res) => {
    const { target_id } = req.body;
    const me = req.user.user_id;

    try {
        await pool.query(
            `DELETE FROM "Followers" WHERE follower_id=$1 AND following_id=$2`,
            [me, target_id]
        );
        res.json({ message: "Unfollowed" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// FOLLOWERS LIST
router.get('/followers/:uid', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id,u.name,u.dept,u.year
             FROM "Followers" f
             JOIN "User" u ON u.user_id=f.follower_id
             WHERE f.following_id=$1`,
            [req.params.uid]
        );

        res.json({
            count: result.rows.length,
            list: result.rows
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// FOLLOWING LIST
router.get('/following/:uid', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id,u.name,u.dept,u.year
             FROM "Followers" f
             JOIN "User" u ON u.user_id=f.following_id
             WHERE f.follower_id=$1`,
            [req.params.uid]
        );

        res.json({
            count: result.rows.length,
            list: result.rows
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// IS FOLLOWING
router.get('/is-following/:uid', auth, async (req, res) => {
    const me = req.user.user_id;
    const target = req.params.uid;

    const result = await pool.query(
        `SELECT 1 FROM "Followers" WHERE follower_id=$1 AND following_id=$2`,
        [me, target]
    );

    res.json({ isFollowing: result.rows.length > 0 });
});

module.exports = router;

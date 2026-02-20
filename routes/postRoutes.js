const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

function containsBadWord(text=''){
  const profane=['idiot','stupid','fuck','shit','bitch','asshole'];
  const t=text.toLowerCase();
  return profane.some(w=>t.includes(w));
}

const upload = multer({ dest: path.join(__dirname,'../uploads') });

router.post('/', auth, upload.single('image'), async (req,res)=>{
  try{
    const { content, emotion } = req.body;
    const user=req.user;
    let imagePath=req.file?`/uploads/${req.file.filename}`:null;

    if(containsBadWord(content)){
      await pool.query(
        `INSERT INTO "Warning"(user_id,reason) VALUES($1,$2)`,
        [user.user_id,'Indecent language']
      );

      await pool.query(
        `UPDATE "User" SET warning_count=warning_count+1 WHERE user_id=$1`,
        [user.user_id]
      );

      const result=await pool.query(
        `SELECT warning_count FROM "User" WHERE user_id=$1`,
        [user.user_id]
      );

      if(result.rows[0].warning_count>=process.env.WARN_THRESHOLD){
        await pool.query(
          `UPDATE "User" SET is_active=FALSE WHERE user_id=$1`,
          [user.user_id]
        );
      }

      return res.status(400).json({ error:'Post contains indecent words. Warning added.'});
    }

    const r=await pool.query(
      `INSERT INTO "Post"(user_id,content,image_path,emotion)
       VALUES($1,$2,$3,$4)
       RETURNING post_id`,
      [user.user_id,content,imagePath,emotion||'Neutral']
    );

    res.json({ msg:'Posted', post_id:r.rows[0].post_id });

  }catch(error){
    console.error('Post creation error:',error);
    res.status(500).json({ error:'Failed to create post' });
  }
});

router.get('/',auth,async(req,res)=>{
  try{
    const result=await pool.query(
      `SELECT P.*,U.name
       FROM "Post" P
       JOIN "User" U ON P.user_id=U.user_id
       WHERE P.status='Active'
       ORDER BY P.created_at DESC`
    );
    res.json(result.rows);
  }catch(error){
    console.error('Error fetching posts:',error);
    res.status(500).json({ error:'Failed to fetch posts' });
  }
});
// GET posts by user
router.get('/user/:id', auth, async (req,res)=>{
  try{
    const { id } = req.params;

    const result = await pool.query(`
        SELECT P.*, U.name
        FROM "Post" P
        JOIN "User" U ON P.user_id = U.user_id
        WHERE P.user_id = $1
        ORDER BY P.created_at DESC
    `,[id]);

    res.json(result.rows);

  }catch(err){
    console.error("User posts error:",err);
    res.status(500).json({error:'Failed to fetch user posts'});
  }
});

module.exports=router;

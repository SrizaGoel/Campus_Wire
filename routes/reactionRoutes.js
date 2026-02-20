const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// COMMENTS
router.get('/comments/:postId', auth, async (req,res)=>{
  try{
    const result=await pool.query(
      `SELECT r.*,u.name AS username
       FROM "Reaction" r
       JOIN "User" u ON r.user_id=u.user_id
       WHERE r.post_id=$1 AND r.type='Comment'
       ORDER BY r.created_at ASC`,
      [req.params.postId]
    );
    res.json(result.rows);
  }catch(e){
    console.error('Failed to fetch comments:',e);
    res.status(500).json({error:'Failed to fetch comments'});
  }
});

// REACTION COUNTS
router.get('/reactions/:postId',auth,async(req,res)=>{
  try{
    const reactions=await pool.query(
      `SELECT reaction_type,COUNT(*) AS count
       FROM "Reaction"
       WHERE post_id=$1 AND type='Like'
       GROUP BY reaction_type`,
      [req.params.postId]
    );

    const userReaction=await pool.query(
      `SELECT reaction_type
       FROM "Reaction"
       WHERE post_id=$1 AND user_id=$2 AND type='Like'`,
      [req.params.postId,req.user.user_id]
    );

    res.json({
      counts:reactions.rows,
      userReaction:userReaction.rows[0]||null
    });
  }catch(e){
    console.error('Failed to fetch reactions:',e);
    res.status(500).json({error:'Failed to fetch reactions'});
  }
});

// TOGGLE REACTION
router.post('/react',auth,async(req,res)=>{
  try{
    const { post_id,reaction_type }=req.body;

    const existing=await pool.query(
      `SELECT * FROM "Reaction"
       WHERE post_id=$1 AND user_id=$2 AND type='Like'`,
      [post_id,req.user.user_id]
    );

    if(existing.rows.length){
      if(existing.rows[0].reaction_type===reaction_type){
        await pool.query(
          `DELETE FROM "Reaction"
           WHERE post_id=$1 AND user_id=$2 AND type='Like'`,
          [post_id,req.user.user_id]
        );
        return res.json({msg:'Unliked',action:'removed'});
      }else{
        await pool.query(
          `UPDATE "Reaction"
           SET reaction_type=$1
           WHERE post_id=$2 AND user_id=$3 AND type='Like'`,
          [reaction_type,post_id,req.user.user_id]
        );
        return res.json({msg:'Reaction updated',action:'updated'});
      }
    }

    await pool.query(
      `INSERT INTO "Reaction"(post_id,user_id,type,reaction_type)
       VALUES($1,$2,'Like',$3)`,
      [post_id,req.user.user_id,reaction_type]
    );

    res.json({msg:'Liked',action:'added'});
  }catch(e){
    console.error('Reaction error:',e);
    res.status(500).json({error:'Failed to update reaction'});
  }
});

// COMMENT
router.post('/comment',auth,async(req,res)=>{
  try{
    const { post_id,comment }=req.body;
    await pool.query(
      `INSERT INTO "Reaction"(post_id,user_id,type,comment_text)
       VALUES($1,$2,'Comment',$3)`,
      [post_id,req.user.user_id,comment]
    );
    res.json({msg:'Commented'});
  }catch(e){
    console.error('Comment error:',e);
    res.status(500).json({error:'Failed to add comment'});
  }
});

// LIKES LIST
router.get('/likes/:postId',auth,async(req,res)=>{
  try{
    const result=await pool.query(
      `SELECT u.name,u.user_id,r.reaction_type,r.created_at
       FROM "Reaction" r
       JOIN "User" u ON r.user_id=u.user_id
       WHERE r.post_id=$1 AND r.type='Like'
       ORDER BY r.created_at DESC`,
      [req.params.postId]
    );
    res.json(result.rows);
  }catch(e){
    console.error('Failed to fetch likes:',e);
    res.status(500).json({error:'Failed to fetch likes'});
  }
});

// COMMENT COUNT
router.get('/comments-count/:postId',auth,async(req,res)=>{
  try{
    const result=await pool.query(
      `SELECT COUNT(*) AS comment_count
       FROM "Reaction"
       WHERE post_id=$1 AND type='Comment'`,
      [req.params.postId]
    );
    res.json({ comment_count: result.rows[0].comment_count });
  }catch(e){
    console.error('Failed to fetch comment count:',e);
    res.status(500).json({error:'Failed to fetch comment count'});
  }
});

module.exports=router;

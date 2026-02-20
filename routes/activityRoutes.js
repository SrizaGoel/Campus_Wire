const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// PRIVATE activity — only owner can view
router.get('/:userId', auth, async (req,res)=>{
  const userId=req.params.userId;

  // prevent viewing someone else's activity
  if(req.user.user_id != userId){
    return res.status(403).json({error:"Private activity"});
  }

  try{

    const result=await pool.query(`
    
    SELECT 
      'post' as type,
      P.content as text,
      P.image_path as image,
      P.created_at
    FROM "Post" P
    WHERE P.user_id=$1

    UNION ALL

    SELECT 
      'comment' as type,
      R.comment_text as text,
      NULL as image,
      R.created_at
    FROM "Reaction" R
    WHERE R.user_id=$1 AND R.type='Comment'

    UNION ALL

    SELECT 
      'like' as type,
      'Reacted to a post' as text,
      NULL as image,
      R.created_at
    FROM "Reaction" R
    WHERE R.user_id=$1 AND R.type='Like'

    UNION ALL

    SELECT 
      'follow' as type,
      'Started following someone' as text,
      NULL as image,
      F.created_at
    FROM "Followers" F
    WHERE F.follower_id=$1

    ORDER BY created_at DESC
    LIMIT 15
    
    `,[userId]);

    res.json(result.rows || []);

  }catch(err){
    console.error("Activity error:",err);
    res.status(500).json([]);
  }
});

module.exports=router;
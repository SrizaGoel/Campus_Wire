const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:id", async (req,res)=>{
    try{
        const result=await db.query(
            `SELECT user_id,name,dept,year,created_at,warning_count
             FROM "User"
             WHERE user_id=$1`,
            [req.params.id]
        );

        if(!result.rows.length){
            return res.status(404).json({ error:"User not found" });
        }

        res.json(result.rows[0]);

    }catch(err){
        console.error(err);
        res.status(500).json({ error:"Failed to fetch user" });
    }
});

module.exports=router;

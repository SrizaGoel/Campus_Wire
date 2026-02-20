const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
require('dotenv').config();

const API_KEY = process.env.CALENDARIFIC_KEY;

router.get('/current', async (req,res)=>{
  try{
    const today = new Date();
    const year = today.getFullYear();

    const url =
`https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=IN&year=${year}`;

    const response = await fetch(url);
    const data = await response.json();

    let holidays = data.response.holidays || [];

    // ❌ exclude Muslim festivals
    const blocked=['eid','ramadan','islam','muharram','bakrid','milad'];
    holidays = holidays.filter(h=>{
      const text=(h.name+" "+h.description).toLowerCase();
      return !blocked.some(b=>text.includes(b));
    });

    // ✅ find today's festivals
    const todayStr = today.toISOString().slice(0,10);

    const todaysFestivals = holidays.filter(h=>{
      return h.date.iso === todayStr;
    });

    if(!todaysFestivals.length){
      return res.json({
        active:false,
        theme:{
          festival_name:'Default',
          primary_color:'#1e293b',
          secondary_color:'#60a5fa',
          banner_image:''
        }
      });
    }

    const fest = todaysFestivals[0].name;

    const query = encodeURIComponent(fest+" festival india");
    const banner=`https://source.unsplash.com/1600x500/?${query}`;

    res.json({
      active:true,
      theme:{
        festival_name:fest,
        primary_color:'#1C174A',
        secondary_color:'#BFA5FF',
        banner_image:banner
      }
    });

  }catch(err){
    console.error(err);
    res.status(500).json({error:'Festival API failed'});
  }
});

module.exports = router;

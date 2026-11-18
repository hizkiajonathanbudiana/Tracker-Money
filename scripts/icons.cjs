const {createCanvas}=require('canvas');
const fs=require('fs');
for(const n of [72,96,128,144,152,192,384,512]){const canvas=createCanvas(n,n),ctx=canvas.getContext('2d');ctx.fillStyle='#345542';ctx.fillRect(0,0,n,n);ctx.fillStyle='#d6e2bc';ctx.beginPath();ctx.roundRect(n*.18,n*.18,n*.64,n*.64,n*.15);ctx.fill();ctx.fillStyle='#284b36';ctx.font=`bold ${n*.48}px Georgia`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('m',n*.46,n*.51);ctx.font=`${n*.24}px Arial`;ctx.fillText('↗',n*.67,n*.4);fs.writeFileSync(`public/icon-${n}x${n}.png`,canvas.toBuffer('image/png'));}

var c=document.getElementById("golf")
c.style.background="#000"
var ctx=c.getContext("2d")
ctx.canvas.width=1000
ctx.canvas.height=1100
ctx.lineCap="round"
ctx.strokeStyle="white"
ctx.fillStyle="white"

//config

fps=30
interval=1000/fps
sfx=1

//

anistep=1
ani=0

//

mouse_coords={x:0,y:0}
mouse_pos={x:0,y:0}
click_coords={x:-1, y:-1}
menu_option=-1
selected={x:-1, y:-1}

//

ball={pos:{x:500,y:500}, spd:{x:0,y:0}, prev_spd:{x:0,y:0}}
stick={start:{x:0,y:0}, end:{x:0,y:0}, pos:{x:0,y:0}, power:0, type:1}
lvdata={hole:{x:0,y:0}, fm:[], obstacles:[], completed:0}
shooting=0
shot=0
score=Array(18).fill(0)
shot_dis=0
shot_deltax=0
shot_deltay=0
power_mov_mod=0

// Obstacle specification
// {type:0, pos:{x:0,y:0}, size:{x:0,y:0}, charge:0, mfield:0, efield:0}
// keys are optional and depend on obstacle
// 0: negative point
// 1: positive point
// 2-5: electric field (right, up, left, down)
// 6-7: magnetic field (towards player, away from player)
// 8-11: particle accelerator (lineal), (right, up, left, down)
// 99: wall (?)

holesdata=[
{//Hole 1
  ball:{x:150, y:850},
  hole:{x:850, y:150},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:[]
},
{//Hole 2, positive point obstacle
  ball:{x:500, y:850},
  hole:{x:100, y:150},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:1, pos:{x:500,y:500}},
  ]
},
{//Hole 3, negative point obstacle
  ball:{x:500, y:850},
  hole:{x:900, y:150},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:0, pos:{x:500,y:500}},
  ]
},
{//Hole 4, magnetic obstacle
  ball:{x:150, y:850},
  hole:{x:850, y:150},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:7, pos:{x:400,y:0}, size:{x:200,y:998}, mfield:15},
  ]
},
{//Hole 5, Electric obstacle
  ball:{x:850, y:850},
  hole:{x:150, y:150},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:2, pos:{x:400,y:0}, size:{x:200,y:998}, efield:10000},
  ]
},
{//Hole 6, point particle inside magnetic obstacle
  ball:{x:350, y:850},
  hole:{x:850, y:600},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:7, pos:{x:400,y:0}, size:{x:200,y:998}, mfield:15},
    {type:1, pos:{x:500,y:500}},
  ]
},
//Hole 7, linear accelerator
//Hole 8, linear accelerator + magnetic field at output
{//Hole 9, multiple point obstacles
  ball:{x:150, y:850},
  hole:{x:850, y:150},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:0, pos:{x:50,y:50}},
    {type:1, pos:{x:950,y:950}},
    {type:0, pos:{x:750,y:890}},
  ]
},
{//Hole 10, electric and magnetic fields
  ball:{x:850, y:850},
  hole:{x:150, y:150},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:2, pos:{x:400,y:0}, size:{x:200,y:998}, efield:10000},
    {type:7, pos:{x:0,y:400}, size:{x:998,y:200}, mfield:15},
  ]
},
//Hole 11, magnetic field before linear accelerator
//Hole 12, maze (If walls work)
//Hole 13, multiple particle accelerators
{//Hole 14, alternating electric fields
  ball:{x:350, y:850},
  hole:{x:950, y:50},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:3, pos:{x:400,y:0}, size:{x:200,y:998}, efield:10000},
    {type:5, pos:{x:600,y:0}, size:{x:200,y:998}, efield:10000},
  ]
},
{//Hole 15, alternating magnetic fields
  ball:{x:350, y:850},
  hole:{x:950, y:50},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:6, pos:{x:400,y:0}, size:{x:200,y:998}, mfield:15},
    {type:7, pos:{x:600,y:0}, size:{x:200,y:998}, mfield:15},
  ]
},
{//Hole 16, hole surrounded by charges
  ball:{x:150, y:850},
  hole:{x:500, y:260},
  friction_matrix:Array(100).fill(Array(100).fill(50)),
  obstacles:
  [
    {type:1, pos:{x:500,y:10}},
    {type:1, pos:{x:750,y:260}},
    {type:1, pos:{x:250,y:260}},
  ]
},
//Hole 17, hole inside accelerated field
//Hole 18, everything
]
holes={current:1,total:holesdata.length}

function loadlevel(lv)
{
  var lev=holesdata[lv-1]
  ball.pos.x=lev.ball.x
  ball.pos.y=lev.ball.y
  lvdata.hole=lev.hole
  lvdata.fm=lev.friction_matrix
  lvdata.obstacles=lev.obstacles
  lvdata.completed=0
}

//Mobile detection

try{document.createEvent("TouchEvent"); mobile=1;}
catch(e){mobile=0}

//Adjusting css so canvas scales to fit window

if(window.innerWidth>window.innerHeight)
{
  document.getElementById("golf").style.width=""
  document.getElementById("golf").style.height="100%"
}

//Save/Load game

var storedlevel=window.localStorage.getItem('clevel', holes.current);
if(storedlevel==null)
{
  window.localStorage.setItem('clevel', holes.current)
  window.localStorage.setItem('score', JSON.stringify(score))
}
else
{
  holes.current=storedlevel
  score=JSON.parse(window.localStorage.getItem('score'))
}

//Audio management

au=new Object();

au.play=function(s)
{
  if (sfx==1)
  {
    tem=eval("this."+s+".cloneNode();")
    tem.play()
  }
}

sounds=[
"menu_back",
"menu_select",
"menu_option",
]

function loader()
{
  for (i=0; i<sounds.length; i++)
  {
    it="./audio/"+sounds[i]+".wav";
    vname=sounds[i]
    eval("au."+vname+"=new Audio('"+it+"');");
  }
}

//Auxiliary functions

function draw_line(x1,y1,x2,y2)
{
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.stroke();
}

function draw_circle(x,y,size,colour="white",alpha=1)
{
  var pa=ctx.globalAlpha;
  var pc=ctx.fillStyle;
  if (colour!="black"){ctx.globalAlpha=alpha;}
  ctx.strokeStyle=colour;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2*Math.PI, true);
  ctx.stroke();
  ctx.globalAlpha=pa;
  ctx.fillStyle=pc
}

function fill_circle(x,y,size,colour="white",alpha=1)
{
  pa=ctx.globalAlpha;
  if (colour!="black"){ctx.globalAlpha=alpha;}
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2*Math.PI, true);
  ctx.fillStyle=colour;
  ctx.strokeStyle=colour;
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha=pa;
  ctx.fillStyle="white"
  ctx.strokeStyle="white"
}

function pixel_to_coord(px)
{
  return Math.ceil(px/(100))-1
}

function coord_to_pixel(c)
{
  return (50)*(1+(c*2))
}

function menu_alpha(y)
{
  if (mobile==0){return Math.abs(y-mouse_pos.y)}
  else {return 50}
}

//Intro and menus

function logo_animation(i)
{
  ctx.clearRect(0,0,1000,1000)
  ctx.font="45px sans-serif";
  ctx.fillStyle="rgba(255,255,255,"+(anistep/80)+")";
  ctx.textAlign="center"
  ctx.fillText("愛智重工",500,500);
  ctx.font="20px quizma";
  ctx.fillText("Achi Heavy Industries",500,520)
  if (anistep==80){clearTimeout(ani);ani=setInterval(logo_animation, interval, 0)}
  if(i==1){anistep++;}else{anistep--;}
  if (anistep==0){clearTimeout(ani);ani=setInterval(title_animation, interval, 1)}
}

function title_animation(i)
{
  ctx.clearRect(0,0,1000,1000)
  ctx.font="100px proton";
  ctx.fillStyle="rgba(255,255,255,"+(anistep/80)+")";
  ctx.textAlign="center"
  ctx.fillText("ProtonGolf",500,500);
  if (anistep==80)
  {
    clearTimeout(ani);
    ctx.canvas.addEventListener("click", main_menu_listener, false);
    ani=setInterval(title_animation, interval, 0)
  }
  if(i==1){anistep++;}else{anistep--;}
  if (anistep==0){clearTimeout(ani);ani=setInterval(menu, interval, 1)}
}

function menu()
{
  ctx.canvas.removeEventListener("click", skip_to_menu);
  ctx.clearRect(0,0,1000,1100)
  malpha=anistep/30;
  ctx.lineWidth=1;

  ctx.fillStyle="rgba(255,255,255,"+malpha+")";
  ctx.textAlign="center";
  ctx.font="100px proton";
  ctx.fillText("ProtonGolf",500,160);

  ctx.font="bold 50px quizma";
  ctx.fillStyle="rgba(255,255,255,"+(30*malpha/menu_alpha(350))+")";
  ctx.fillText("Play",500,360);
  // ctx.fillStyle="rgba(255,255,255,"+(30*malpha/menu_alpha(450))+")";
  // ctx.fillText("Scores",500,460);
  // ctx.fillStyle="rgba(255,255,255,"+(30*malpha/menu_alpha(550))+")";
  // ctx.fillText("Tutorial",500,560);
  ctx.fillStyle="rgba(255,255,255,"+(30*malpha/menu_alpha(750))+")";
  ctx.fillText("Settings",500,760);
  ctx.fillStyle="rgba(255,255,255,"+(30*malpha/menu_alpha(850))+")";
  ctx.fillText("Credits",500,860);

  if (anistep<30){anistep++;} 
}

function credits()
{
  ctx.clearRect(0,0,1000,1000)

  calpha=anistep/30

  ctx.fillStyle="rgba(255,255,255,"+calpha+")";
  ctx.textAlign="center";
  ctx.font="100px proton";
  ctx.fillText("ProtonGolf",500,160);
  ctx.textAlign="end"
  ctx.font="50px quizma";
  ctx.fillText("Credits",755,210);

  
  ctx.font="bold 50px quizma";
  ctx.fillText("Code",350,360);
  //ctx.fillText("Music",800,360);
  ctx.fillText("SFX",750,460);
  ctx.fillText("Fonts",350,560);
  


  ctx.textAlign="center"
  // ctx.fillText("Special Thanks",500,760)
  ctx.fillStyle="rgba(255,255,255,"+(30*calpha/menu_alpha(950))+")";
  ctx.fillText("Back",500,960);

  // ctx.fillStyle="white"
  // ctx.font="20px quizma"
  // ctx.fillText("❤",400,860)
  // ctx.fillText("❤",600,860)
  // ctx.font="45px quizma";
  
  // ctx.fillText("Lea",500,860)
  // ctx.textAlign="start"
  // ctx.fillText("q3muyq3",650,860)
  // ctx.textAlign="end"
  // ctx.fillText("Klon",350,860)
  // ctx.textAlign="center"

  ctx.fillStyle="rgba(255,255,255,"+(30*calpha/menu_alpha(350))+")";
  ctx.fillText("Achifaifa",500,360);
  ctx.fillStyle="rgba(255,255,255,"+(30*calpha/menu_alpha(450))+")";
  ctx.fillText("broumbroum",500,460);
  ctx.fillStyle="rgba(255,255,255,"+(50*calpha/menu_alpha(550))+")";
  ctx.fillText("Studio Typo",500,560);
  ctx.fillStyle="rgba(255,255,255,"+(50*calpha/menu_alpha(650))+")";
  ctx.fillText("Patrick Giasson",500,660);
  

  if (anistep<30){anistep++}
}

function settings()
{
  ctx.clearRect(0,0,1000,1000)

  salpha=anistep/30

  ctx.fillStyle="rgba(255,255,255,"+salpha+")";
  ctx.textAlign="center";
  ctx.font="100px proton";
  ctx.fillText("ProtonGolf",500,160);
  ctx.textAlign="end"
  ctx.font="60px quizma";
  ctx.fillText("Settings",805,210);

  ctx.textAlign="center"
  ctx.fillStyle="rgba(255,255,255,"+(30*salpha/menu_alpha(400))+")";
  if(sfx==1)
  {
    ctx.fillText("SFX on",500,460);
  }
  else
  {
    ctx.fillText("SFX off",500,460);
  }
  
  ctx.fillStyle="rgba(255,255,255,"+(30*salpha/menu_alpha(700))+")";
  ctx.fillText("Back",500,760);

  // ctx.font="45px quizma";
  // ctx.fillStyle="rgba(255,255,255,"+salpha+")";

  if (anistep<30){anistep++;}
}

//Calculations

function distance(a,b)
{
  return Math.sqrt(Math.pow((b.x-a.x),2)+Math.pow((b.y-a.y),2))
}

//Angle is in *radians*
function angle(a,b)
{
  var dx=b.x-a.x
  var dy=b.y-a.y
  return Math.atan2(dy,dx)
}

//ke*q1*q2
const ke=Number("9E9")
const ep_charge=Number("1.6E-19")
const stick_ball_data=ke*Number("1.6E-19")*Number("1.6E-19")
function stick_force()
{
  //function for stick and ball only. Returns Newtons on ball.
  //F= ke (q1*q2) /r2
  //ke: coulomb's constant (9e9)
  //qm1/qm2 -> charges. Ball is 1.6e-19C. stick is 1.6e-19*type
  // r-> separation (1px -> 1nm in this model)
  //I swear to god, if someone opens a GH issue complaining about this
  //not being accurate I'm going to flip a shit. IT'S GOOD ENOUGH.

  //Force magnitude:
  var dist_m=distance(ball.pos,stick.pos)/1000000000

  //Prevent slingshots
  if(dist_m<Number("20e-9"))
  {
    return {fx:0,fy:0}
  }
  var force=(stick_ball_data*stick.type)/Math.pow(dist_m,2)

  //Force component in x and y
  var vang=angle(ball.pos,stick.pos)
  var fx=force*Math.cos(vang)
  var fy=force*Math.sin(vang)

  return {fx:fx, fy:fy}
}

//Like stick_force, but requires more data
//Returns force (x,y) on both objects
//A and B are particles w/ pos and charge: {pos:{x:0,y:0}, c:0}
function point_force(a,b)
{
  var dist=distance(a.pos,b.pos)/1000000000
  //Prevent slingshots
  if(dist<Number("50E-9"))
  {
    return[{fx:0,fy:0}, {fx:0,fy:0}]
  }
  var force=(a.c*b.c*ke)/Math.pow(dist,2)

  var vang=angle(a.pos,b.pos)

  var fx=force*Math.cos(vang)
  var fy=force*Math.sin(vang)

  return[{fx:-fx,fy:-fy}, {fx:fx,fy:fy}]
}

function get_friction(c)
{
  if(c.x<1 || c.x>999 || c.y<1 || c.y>999){return 50}

  var fxcoord=parseInt(c.x/10)
  var fycoord=parseInt(c.x/10)
  return lvdata.fm[fycoord][fxcoord]
}

//rolling friction of """ball""" on """floor"""
//F=uN (F=umg) (u: coefficient of friction, n:normal force)
//F=u*p_mass*9.8. 
//U is stored in the friction data of the level.
//50 feels like normal
const p_mass=Number("1.67E-27")
const fric_const=p_mass*9800000000//g in nm/s
function friction()
{
  //Calculate angle of movement
  var frang=Math.atan2(ball.spd.y,ball.spd.x)

  //Calculate total friction
  var tfforce=get_friction(ball.pos)*fric_const

  //Decompose friction into x/y components
  var tfx=tfforce*Math.cos(frang)
  var tfy=tfforce*Math.sin(frang)

  //Prevent wild bouncing
  if(ball.spd.x>1000 || ball.spd.y>1000)
  {
    tfx*=1+Math.pow(Math.ceil(ball.spd.x/1000),2)
    tfy*=1+Math.pow(Math.ceil(ball.spd.y/1000),2)
  }
  return {fx:tfx, fy:tfy}
}

function environmental_force()
{
  var eforce={fx:0, fy:0}

  //force for obstacles
  var obss=lvdata.obstacles
  for(var i=0; i<obss.length; i++)
  {
    var it=obss[i]
    var fbuffer={fx:0, fy:0}
    //e-
    if(it.type==0 && distance(ball.pos,it.pos)<250)
    {
      fbuffer=point_force({pos:ball.pos,c:ep_charge}, {pos:it.pos,c:-ep_charge})[1]
    }
    //p+
    if(it.type==1 && distance(ball.pos,it.pos)<250)
    {
      fbuffer=point_force({pos:ball.pos,c:ep_charge}, {pos:it.pos,c:ep_charge})[1]
    }
    //electric field (right, up, left, down)
    //It's multiplying stuff
    if([2,3,4,5].includes(it.type))
    {
      if
      (
        (ball.pos.x>it.pos.x && ball.pos.x<it.pos.x+it.size.x)
      &&(ball.pos.y>it.pos.y && ball.pos.y<it.pos.y+it.size.y)
      )
      {
        if(it.type==2) {fbuffer.fx-=it.efield*ep_charge}
        if(it.type==3) {fbuffer.fy-=it.efield*ep_charge}
        if(it.type==4) {fbuffer.fx+=it.efield*ep_charge} 
        if(it.type==5) {fbuffer.fy+=it.efield*ep_charge}
      }
    }
    //magnetic field (towards player, away from player)
    //Lorentz forces in x and y
    //Fx=q vy Bz
    //Fy=q -vx Bz
    //Full formula is F=q(E+v x B) but ain't nobody got time for that
    if([6,7].includes(it.type))
    {
      var mod=-1
      if(it.type==7){mod=1}

      if
      (
        (ball.pos.x>it.pos.x && ball.pos.x<it.pos.x+it.size.x)
      &&(ball.pos.y>it.pos.y && ball.pos.y<it.pos.y+it.size.y)
      )
      {
        fbuffer.fx+=ep_charge*ball.spd.y*it.mfield*mod
        fbuffer.fy+=ep_charge*(-ball.spd.x)*it.mfield*mod
      }
    }
    //particle accelerator (right, up, left, down)
    if([8,9,10,11].includes(it.type))
    {

    }
    //wall (?)
    if(it.type==99)
    {

    }
    eforce.fx+=fbuffer.fx 
    eforce.fy+=fbuffer.fy
  }

  //friction over floor
  var fric=friction()
  eforce.fx+=fric.fx
  eforce.fy+=fric.fy
  
  return eforce
}

//Add all forces
function force_on_ball()
{
  var tforce={fx:0, fy:0}
  if(stick.start.x!=0)
  {
    var st_force=stick_force()
    tforce.fx+=st_force.fx
    tforce.fy+=st_force.fy
  }
  env_force=environmental_force()
  tforce.fx+=env_force.fx
  tforce.fy+=env_force.fy

  return tforce
}

//F=ma; a=F/m; ax=Fx/m
//Proton mass 1.67e-27
//m/s converted to nm/s, then reduced to tick time (1/30s)
//Final acc values are in nm/cycle, equivalent to px/cycle
//displacement d=v0t+(0.5*at^2).
//v0=initial speed
//a=acceleration
//t=time (Always 1/30)
//d=v0/30 + a/2000
function move_ball()
{
  //Find acceleration on a given frame
  var tforce=force_on_ball()
  var acc_x=-tforce.fx/(p_mass*30*1000000000)
  var acc_y=-tforce.fy/(p_mass*30*1000000000)
  //Update ball speed
  ball.spd.x+=acc_x 
  ball.spd.y+=acc_y

  //bouncing
  var flipped=0
  if(ball.pos.x<5 || ball.pos.x>995)
  {
    ball.spd.x*=-1
    flipped=1
    if(ball.pos.x<5)
    {
      ball.pos.x=5
    }
    if(ball.pos.x>995)
    {
      ball.pos.x=995
    }
  }
  if(ball.pos.y<5 || ball.pos.y>995)
  {
    ball.spd.y*=-1
    flipped=1
    if(ball.pos.y<5)
    {
      ball.pos.y=5
    }
    if(ball.pos.y>995)
    {
      ball.pos.y=995
    }
  }
  //Prevent jittering
  if(flipped==0)
  {
    if(Math.sign(ball.prev_spd.x)!=0 && (Math.sign(ball.spd.x)!=Math.sign(ball.prev_spd.x)))
    {
      ball.spd.x=0
    }
    if(Math.sign(ball.prev_spd.y)!=0 && (Math.sign(ball.spd.y)!=Math.sign(ball.prev_spd.y)))
    {
      ball.spd.y=0
    }
  }

  ball.prev_spd={x:ball.spd.x, y:ball.spd.y}

  //move ball
  ball.pos.x+=(ball.spd.x/30)+(acc_x/2000)
  ball.pos.y+=(ball.spd.y/30)+(acc_y/2000)

  if(distance(ball.pos, lvdata.hole)<10)
  {
    //Require low speed to enter in hole
    if(Math.abs(ball.spd.x)<500 && Math.abs(ball.spd.y)<500)
    {
      ball.spd={x:0, y:0}
      ball.pos={x:lvdata.hole.x, y:lvdata.hole.y}
      lvdata.completed=1
      shooting=0
      shot=0
      stick.start={x:0, y:0}
      stick.end={x:0, y:0}
    }
  }
}

//Drawing

function draw_power()
{
  for(i=0;i<100;i++)
  {
    if(i<stick.power/10)
    {
      var r=i*4
      var g=9000/i
      ctx.strokeStyle="rgb("+r+","+g+",0)"
    }
    draw_line(410+(3*i),1090,410+(3*i),1090-(i*80/100))
    ctx.strokeStyle="white"
  }
}

function draw_tgt(x,y)
{
  ctx.lineWidth=2
  draw_line(x-5,y,x+5,y)
  draw_line(x,y+5,x,y-5)
  ctx.lineWidth=1
}

function draw_point(x,y)
{
  ctx.lineWidth=3
  ctx.strokeRect(x-2,y-2,4,4)
  ctx.lineWidth=1
}

function draw_ball()
{
  fill_circle(ball.pos.x,ball.pos.y,5)
}

function draw_hole()
{
  draw_circle(lvdata.hole.x,lvdata.hole.y,10)
}

function draw_stick(x,y)
{
  fill_circle(x,y,5,"red")
  ctx.fillStyle="white"
}

function draw_ui()
{
  ctx.clearRect(0,0,1000,1100)

  ctx.lineWidth=2
  ctx.textAlign="center"
  ctx.font=("20px sans-serif")
  draw_line(0,1000,1000,1000)

  ctx.strokeRect(10,1010,80,80)

  if(stick.type==1){ctx.strokeStyle="green"}
  ctx.strokeRect(110,1010,80,80)
  ctx.strokeStyle="white"
  if(stick.type==-1){ctx.strokeStyle="green"}
  ctx.strokeRect(210,1010,80,80)
  ctx.strokeStyle="white"
  // if(stick.type==3){ctx.strokeStyle="green"}
  // ctx.strokeRect(310,1010,80,80)
  // ctx.strokeStyle="white"

  ctx.fillText("MENU",50,1055)
  ctx.fillText("p+",150,1055)
  ctx.fillText("e-",250,1055)
  // ctx.fillText("BIG",350,1050)
  // ctx.fillText("+++",350,1070)
  draw_power()

  ctx.strokeRect(910,1010,80,80)
  ctx.textAlign="center"
  ctx.fillText("Hole",950,1050)
  ctx.fillText("/",950,1070)
  ctx.textAlign="right"
  ctx.fillText(holes.current,945,1070)
  ctx.textAlign="left"
  ctx.fillText(holes.total,955,1070)
}



//
// {type:0, pos:{x:0,y:0}, size:{x:0,y:0}, charge:0, mfield:0, efield:0}
function draw_obstacle(obs)
{
  //e-, blue dot
  if(obs.type==0)
  {
    fill_circle(obs.pos.x,obs.pos.y,5,"blue")
  }
  //p+, yellow dot
  if(obs.type==1)
  {
    fill_circle(obs.pos.x,obs.pos.y,5,"yellow")
  }
  //electric field (right, up, left, down)
  if([2,3,4,5].includes(obs.type))
  {
    ctx.strokeStyle="yellow"

    if(obs.type%2==0)
    {
      draw_line(obs.pos.x+20,obs.pos.y+40,obs.pos.x+60,obs.pos.y+40)
      if(obs.type==2)
      {
        draw_line(obs.pos.x+60,obs.pos.y+40,obs.pos.x+40,obs.pos.y+20)
        draw_line(obs.pos.x+60,obs.pos.y+40,obs.pos.x+40,obs.pos.y+60)
      }
      else
      {
        draw_line(obs.pos.x+20,obs.pos.y+40,obs.pos.x+40,obs.pos.y+20)
        draw_line(obs.pos.x+20,obs.pos.y+40,obs.pos.x+40,obs.pos.y+60)
      }
    }
    else
    {
      draw_line(obs.pos.x+40,obs.pos.y+20,obs.pos.x+40,obs.pos.y+60)
      if(obs.type==3)
      {
        draw_line(obs.pos.x+40,obs.pos.y+60,obs.pos.x+20,obs.pos.y+40)
        draw_line(obs.pos.x+40,obs.pos.y+60,obs.pos.x+60,obs.pos.y+40)
      }
      else
      {
        draw_line(obs.pos.x+40,obs.pos.y+20,obs.pos.x+20,obs.pos.y+40)
        draw_line(obs.pos.x+40,obs.pos.y+20,obs.pos.x+60,obs.pos.y+40)
      }
    }
    ctx.strokeRect(obs.pos.x,obs.pos.y,obs.size.x,obs.size.y)
    ctx.strokeStyle="white"
  }
  //magnetic field (towards player, away from player)
  if([6,7].includes(obs.type))
  {
    ctx.strokeStyle="#9900ff"
    draw_circle(obs.pos.x+40,obs.pos.y+40,20,"#9900ff")
    if(obs.type==6)
    {
      draw_point(obs.pos.x+40,obs.pos.y+40)
    }
    else if(obs.type==7)
    {
      draw_line(obs.pos.x+30,obs.pos.y+30,obs.pos.x+50, obs.pos.y+50)
      draw_line(obs.pos.x+30,obs.pos.y+50,obs.pos.x+50, obs.pos.y+30)
    }
    ctx.strokeRect(obs.pos.x,obs.pos.y,obs.size.x,obs.size.y)
    ctx.strokeStyle="white"
  }
  //particle accelerator (right, up, left, down)
  if([8,9,10,11].includes(obs.type))
  {

  }
  //wall (?)
  if(obs.type==99)
  {

  }

}

function main_loop()
{
  draw_ui()
  for(var i=0; i<lvdata.obstacles.length; i++)
  {
    draw_obstacle(lvdata.obstacles[i])
  }
  draw_tgt(mouse_pos.x,mouse_pos.y)
  draw_ball()
  draw_hole()

  if(stick.start.x!=0 && shot==0)
  {
    draw_point(stick.start.x,stick.start.y)
  }
  if(stick.end.x!=0 && shot==0)
  {
    draw_point(stick.end.x,stick.end.y)
    draw_line(stick.start.x,stick.start.y,stick.end.x,stick.end.y)
  }
  if(shooting!=0 && shot==0)
  {
    stick.power+=((stick.power/4)+20)*shooting
    if(stick.power>1000){shooting=-1; stick.power=999}
    else if(stick.power<0){shooting=1; stick.power=1}
  }
  if(shot>0)
  {
    draw_line(stick.start.x,stick.start.y,stick.end.x,stick.end.y)
    draw_stick(stick.start.x+shot_deltax*shot,stick.start.y+shot_deltay*shot)
    stick.pos.x+=shot_deltax
    stick.pos.y+=shot_deltay
    shot+=1

    //Reset shot if stick on end position
    if
    (
      (Math.abs(stick.end.x-stick.pos.x)<5)
    ||(Math.abs(stick.end.y-stick.pos.y)<5)
    )
    {
      shot=0
      shooting=0
      stick.power=0
      stick.start={x:0, y:0}
      stick.end={x:0, y:0}
    }
    move_ball()
  }
  if(ball.spd.x!=0 || ball.spd.y!=0 && shot==0)
  {
    move_ball()
  }
}

//Listeners

function skip_to_menu(e,mute=0)
{
  if (mute==0){au.play("menu_select")}
  clearTimeout(ani);
  anistep=1
  ai=0
  ctx.canvas.addEventListener("click", main_menu_listener, false);
  document.getElementById('golf').style.cursor = "auto";
  ani=setInterval(menu, interval, 1)
  ctx.canvas.removeEventListener("click", skip_to_menu);
}

function update_menu_option()
{
       if(mouse_pos.y>320 && mouse_pos.y<370){menu_option=1;}
  else if(mouse_pos.y>420 && mouse_pos.y<470){menu_option=2;}
  else if(mouse_pos.y>520 && mouse_pos.y<570){menu_option=3;}
  else if(mouse_pos.y>620 && mouse_pos.y<670){menu_option=4;}
  else if(mouse_pos.y>720 && mouse_pos.y<770){menu_option=5;}
  else if(mouse_pos.y>820 && mouse_pos.y<870){menu_option=6;}
  else if(mouse_pos.y>920 && mouse_pos.y<970){menu_option=7;}
  else {menu_option=-1}
}

function update_click_coords()
{
  click_coords={
    x: Math.ceil(pixel_to_coord(mouse_pos.x)),
    y: Math.ceil(pixel_to_coord(mouse_pos.y))
  }
}

function main_menu_listener()
{  
  valid_options=[1,5,6]

  if (valid_options.includes(menu_option))
  {
    ctx.canvas.removeEventListener("click", main_menu_listener, false);
    anistep=1;
    clearTimeout(ani);
    if (menu_option==1) 
    {
      au.play("menu_select")
      loadlevel(holes.current)
      document.getElementById('golf').style.cursor = "none";
      ctx.canvas.addEventListener("mousemove", dragmove, false)
      ctx.canvas.addEventListener("mousedown", mousedown, false)
      ctx.canvas.addEventListener("mouseup", mouseup, false)
      ani=setInterval(main_loop, interval)
    }
    if (menu_option==2){
      au.play("menu_select")
      initialize_board();
      ai=1
      ctx.canvas.addEventListener("click", levels_listener, false);
      ani=setInterval(level_select, interval, false);
    }
      if (menu_option==3){
      au.play("menu_select")
      ctx.canvas.addEventListener("click", tutorial_listener, false);
      ani=setInterval(tutorial, interval, false);
    }
    if (menu_option==5)
    {
      au.play("menu_select")
      ani=setInterval(settings, interval, 1);
      ctx.canvas.addEventListener("click", settings_menu_listener, false);
    }
    if (menu_option==6)
    {
      au.play("menu_select")
      ani=setInterval(credits, interval, 1);
      ctx.canvas.addEventListener("click", credits_menu_listener, false);
    }
  }
}

function levels_listener()
{
  valid_options=[7]
  if (valid_options.includes(menu_option))
  {
    ctx.canvas.removeEventListener("click", main_menu_listener, false);
    anistep=1;
    clearTimeout(ani);
  }
  if (menu_option==6)
  {
    au.play("menu_back")
    ctx.canvas.removeEventListener("click", levels_listener, false);
    skip_to_menu(1,1)
  } 
}

function settings_menu_listener()
{
  valid_options=[2,5]
  if (valid_options.includes(menu_option))
  {
    if (menu_option==2)
    {
      au.play("menu_option")
      sfx^=1
    }
    else if (menu_option==5)
    {
      au.play("menu_back")
      ctx.canvas.removeEventListener("click", settings_menu_listener, false);
      skip_to_menu(1,1)
    } 
  }
}

function credits_menu_listener()
{
  valid_options=[1,2,3,7]
  {
    if (menu_option==1)
    {
      au.play("menu_option")
      window.open('https://github.com/achifaifa')
    }
    if (menu_option==2)
    {
      au.play("menu_option")
      window.open('https://freesound.org/people/broumbroum/')
    }
    if (menu_option==3)
    {
      au.play("menu_option")
      window.open('http://www.studiotypo.com/')//https://fonts.webtoolhub.com/font-n29145-space-age.aspx?lic=1
    }    
    if (menu_option==4)
    {
      au.play("menu_option")
      window.open('https://www.wfonts.com/font/proton')
    }    
    if (menu_option==7)
    {
      au.play("menu_back")
      ctx.canvas.removeEventListener("click", credits_menu_listener, false);
      skip_to_menu(1,1)
    }
  }
}

function skip_listener()
{
  ctx.canvas.removeEventListener("click", skip_listener);
  skip_to_menu();
}

//Always-on listeners

function mouse_position(c, e) {
  var rect=c.getBoundingClientRect();
  scalex=ctx.canvas.width/rect.width;  
  scaley=ctx.canvas.height/rect.height;  
  return {
    x: (e.clientX-rect.left)*scalex,
    y: (e.clientY-rect.top)*scaley
  };
}

function mousedown(e)
{
  //left click
  if(e.buttons==1)
  {
    if(mouse_coords.y==10)
    {
      if(mouse_coords.x==0)
      {
        ctx.canvas.removeEventListener("mousemove", dragmove)
        ctx.canvas.removeEventListener("mousedown", mousedown)
        ctx.canvas.removeEventListener("mouseup", mouseup)
        skip_to_menu()
      }
      if(mouse_coords.x==1)
      {
        stick.type=1
      }
      if(mouse_coords.x==2)
      {
        stick.type=-1
      }
      if(mouse_coords.x==9)
      {
        if(holes.current<holes.total)
        {
          loadlevel(holes.current+1)
          holes.current+=1
          window.localStorage.setItem('clevel', holes.current)
        }
      }
    }
    else if(mouse_coords.y<10 && ball.spd.x==0 && ball.spd.y==0)
    {
      if(stick.start.x==0)
      {
        stick.start.x=mouse_pos.x
        stick.start.y=mouse_pos.y
      }
      else if(stick.end.x==0)
      {
        stick.end.x=mouse_pos.x
        stick.end.y=mouse_pos.y
        shooting=1
      }
      else if(shooting!=0 && shot==0)
      {
        shot=1
        stick.pos={x:stick.start.x, y:stick.start.y}
        shot_dis=distance(stick.start,stick.end)
        power_mov_mod=(1100-stick.power)/30
        shot_deltax=(stick.end.x-stick.start.x)/power_mov_mod
        shot_deltay=(stick.end.y-stick.start.y)/power_mov_mod
        move_ball()
      }
    }
  }
  //right click
  else if(e.buttons==2)
  {
    if (mouse_coords.y<10 && shot==0)
    {
      if(stick.end.x!=0)
      {
        stick.end={x:0, y:0}
        shooting=0
        stick.power=0
      }
      else
      {
        stick.start={x:0, y:0}
      }
    }
    if(mouse_coords.y==10)
    {
      if(mouse_coords.x==9)
      {
        if(holes.current>1)
        {
          loadlevel(holes.current-1)
          holes.current-=1
          window.localStorage.setItem('clevel', holes.current)
        }
      }
    }
  }
  //middle click
  else if(e.buttons==4)
  {

  }
}

function mouseup(e)
{

}

function dragmove(e)
{

}

ctx.canvas.addEventListener("click", update_menu_option);
ctx.canvas.addEventListener('mousemove', function(e){
  mouse_pos=mouse_position(ctx.canvas, e);
  mouse_coords={x: pixel_to_coord(mouse_pos.x), y: pixel_to_coord(mouse_pos.y)}
}, false);

//Main listener

ctx.canvas.addEventListener("click", skip_to_menu);
loader()
ani=setInterval(logo_animation, interval, 1);

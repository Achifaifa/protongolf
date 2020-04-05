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

friction=0
ball={x:500, y:500, dir:0, spd:0}
stick={start:{x:0,y:0}, end:{x:0,y:0}, power:0, type:1, dir:0}
shooting=0
holes={current:1,total:18}
score=Array(18).fill(0)

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

// var storedlevel=window.localStorage.getItem('maxlevel', levels_completed);
// if(storedlevel==null)
// {
//   window.localStorage.setItem('maxlevel', levels_completed)
//   window.localStorage.setItem('score', JSON.stringify(score))
// }
// else
// {
//   levels_completed=storedlevel
//   score=JSON.parse(window.localStorage.getItem('score'))
// }

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
  pa=ctx.globalAlpha;
  if (colour!="black"){ctx.globalAlpha=alpha;}
  ctx.strokeStyle=colour;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2*Math.PI, true);
  ctx.stroke();
  ctx.globalAlpha=pa;
}

function fill_circle(x,y,size,colour="white",alpha=1)
{
  pa=ctx.globalAlpha;
  if (colour!="black"){ctx.globalAlpha=alpha;}
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2*Math.PI, true);
  ctx.fillStyle=colour;
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha=pa;
  ctx.fillStyle="white"
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
  ctx.font="100px spaceage";
  ctx.fillStyle="rgba(255,255,255,"+(anistep/80)+")";
  ctx.textAlign="center"
  ctx.fillText("Laserworks",500,500);
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
  ctx.font="100px spaceage";
  ctx.fillText("Golf!",500,160);

  ctx.font="bold 50px quizma";
  ctx.fillStyle="rgba(255,255,255,"+(30*malpha/menu_alpha(350))+")";
  if(levels_completed==0)
  {
    ctx.fillText("New game",500,360);
  }
  else
  {
    ctx.fillText("Continue",500,360)
  }
  ctx.fillStyle="rgba(255,255,255,"+(30*malpha/menu_alpha(450))+")";
  ctx.fillText("Scores",500,460);
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
  ctx.font="100px spaceage";
  ctx.fillText("laserworks",500,160);
  ctx.textAlign="end"
  ctx.font="60px quizma";
  ctx.fillText("Credits",950,200);

  
  ctx.font="bold 50px quizma";
  ctx.fillText("Code",350,360);
  //ctx.fillText("Music",800,360);
  ctx.fillText("SFX",750,460);
  ctx.fillText("Fonts",350,560);
  


  ctx.textAlign="center"
  ctx.fillText("Special Thanks",500,760)
  ctx.fillStyle="rgba(255,255,255,"+(30*calpha/menu_alpha(950))+")";
  ctx.fillText("Back",500,960);

  ctx.fillStyle="white"
  ctx.font="20px quizma"
  ctx.fillText("❤",400,860)
  ctx.fillText("❤",600,860)
  ctx.font="45px quizma";
  
  ctx.fillText("Lea",500,860)
  ctx.textAlign="start"
  ctx.fillText("q3muyq3",650,860)
  ctx.textAlign="end"
  ctx.fillText("Klon",350,860)
  ctx.textAlign="center"

  ctx.fillStyle="rgba(255,255,255,"+(30*calpha/menu_alpha(350))+")";
  ctx.fillText("Achifaifa",500,360);
  ctx.fillStyle="rgba(255,255,255,"+(30*calpha/menu_alpha(450))+")";
  ctx.fillText("broumbroum",500,460);
  ctx.fillStyle="rgba(255,255,255,"+(50*calpha/menu_alpha(550))+")";
  ctx.fillText("Studio Typo",500,560);
  ctx.fillStyle="rgba(255,255,255,"+(50*calpha/menu_alpha(650))+")";
  ctx.fillText("Justin Callaghan",500,660);
  

  if (anistep<30){anistep++}
}

function settings()
{
  ctx.clearRect(0,0,1000,1000)

  salpha=anistep/30

  ctx.fillStyle="rgba(255,255,255,"+salpha+")";
  ctx.textAlign="center";
  ctx.font="100px spaceage";
  ctx.fillText("laserworks",500,160);
  ctx.textAlign="end"
  ctx.font="60px quizma";
  ctx.fillText("Settings",950,200);

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
  var r=stick.type*2
  draw_circle(x+7,y-7,r)
}

function draw_point(x,y)
{
  ctx.lineWidth=3
  ctx.strokeRect(x-2,y-2,4,4)
  ctx.lineWidth=1
}

function draw_ball()
{
  fill_circle(ball.x,ball.y,5)
}

function draw_hole()
{
  draw_circle(hole.x,hole.y,10)
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
  if(stick.type==2){ctx.strokeStyle="green"}
  ctx.strokeRect(210,1010,80,80)
  ctx.strokeStyle="white"
  if(stick.type==3){ctx.strokeStyle="green"}
  ctx.strokeRect(310,1010,80,80)
  ctx.strokeStyle="white"

  ctx.fillText("NORM",250,1055)
  ctx.fillText("MENU",50,1055)
  ctx.fillText("SMOL",150,1055)
  ctx.fillText("BIG",350,1055)

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

function main_loop()
{
  draw_ui()
  draw_tgt(mouse_pos.x,mouse_pos.y)
  draw_ball()
  draw_hole()

  if(stick.start.x!=0)
  {
    draw_point(stick.start.x,stick.start.y)
  }
  if(stick.end.x!=0)
  {
    draw_point(stick.end.x,stick.end.y)
    draw_line(stick.start.x,stick.start.y,stick.end.x,stick.end.y)
  }

  if(shooting!=0)
  {
    stick.power+=((stick.power/4)+20)*shooting
    if(stick.power>1000){shooting=-1; stick.power=999}
    else if(stick.power<0){shooting=1; stick.power=1}
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
  valid_options=[1,2,5,6]

  if (valid_options.includes(menu_option))
  {
    ctx.canvas.removeEventListener("click", main_menu_listener, false);
    anistep=1;
    clearTimeout(ani);
    if (menu_option==1) 
    {
      var inilevel=0
      if(levels_completed>0)
      {
        inilevel=levels_completed
        if(inilevel>=total_levels)
        {
          inilevel=total_levels-1
        }
      }
      load_level(inilevel)
      au.play("menu_select")
      //ctx.canvas.addEventListener("click", main_game_listener, false);
      ctx.canvas.addEventListener("mousedown", mousedown);
      ctx.canvas.addEventListener("mouseup", mouseup);
      ctx.canvas.addEventListener("mousemove", dragmove);
      ani=setInterval(main_loop, interval, false);
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
      window.open('https://fonts.webtoolhub.com/font-n29145-space-age.aspx?lic=1')
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
        console.log("menu")
      }
      if(mouse_coords.x>0 && mouse_coords.x<4)
      {
        stick.type=mouse_coords.x
      }
    }
    else if(mouse_coords.y<10)
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
      else if(shooting!=0)
      {
        shooting=0
        console.log("bam!",parseInt(stick.power),"/1000")
      }
    }
  }
  //right click
  else if(e.buttons==2)
  {
    if (mouse_coords.y<10)
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

//ctx.canvas.addEventListener("click", skip_to_menu);
//loader()
//ani=setInterval(logo_animation, interval, 1);

document.getElementById('golf').style.cursor = "none";
ctx.canvas.addEventListener("mousemove", dragmove, false)
ctx.canvas.addEventListener("mousedown", mousedown, false)
ctx.canvas.addEventListener("mouseup", mouseup, false)

hole={x:700, y:300}

ani=setInterval(main_loop, interval)
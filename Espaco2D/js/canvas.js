window.Renderizador = (() => {
  let canvas, ctx, app, area;

  const cores = {
    parede: "#c7aa82",
    drywall: "#d9c7a7",
    janela: "#77c9df",
    porta: "#b88355",
    pia_cozinha: "#c9bca5",
    pia_banheiro: "#d8d8d2",
    armario_cozinha: "#a9794d",
    armario_banheiro: "#b7a38d",
    armario_embutido: "#9f805f",
    geladeira: "#b8c1c7",
    fogao: "#777f84",
    banheiro: "#dfe8ec",
    movel: "#c7b99d",
    vidro: "#72c7dc",
    generico: "#c7ced3"
  };

  function init(a) {
    app = a;
    canvas = document.getElementById("plantCanvas");
    ctx = canvas.getContext("2d");
    area = document.getElementById("drawingArea");
    resize();
    new ResizeObserver(resize).observe(area);
    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", up);
    canvas.addEventListener("mouseleave", () => { if(drag) drag.guias=[]; });
    canvas.addEventListener("wheel", wheel, {passive:false});
  }

  function resize() {
    // O canvas ocupa 2x a área visível. O bitmap interno precisa ter
    // exatamente o mesmo tamanho da área CSS do canvas; caso contrário
    // o navegador escala o desenho e as coordenadas do mouse deixam de
    // coincidir com os componentes, quebrando a seleção.
    const larguraCss = Math.max(area.clientWidth * 2, area.clientWidth);
    const alturaCss  = Math.max(area.clientHeight * 2, area.clientHeight);
    const d = devicePixelRatio || 1;
    canvas.width = Math.round(larguraCss * d);
    canvas.height = Math.round(alturaCss * d);
    canvas.style.width = larguraCss + 'px';
    canvas.style.height = alturaCss + 'px';
    ctx.setTransform(d,0,0,d,0,0);
    draw();
  }

  function world(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x:(e.clientX-r.left-app.panX)/app.scale,
      y:(e.clientY-r.top-app.panY)/app.scale
    };
  }

  let drag = null;

  function down(e) {
    if(e.button !== 0) return;
    const p = world(e), c = Selecao.encontrar(app.componentes,p.x,p.y);
    if(c) {
      app.select(c);
      drag = {c, dx:p.x-c.x, dy:p.y-c.y, moved:false, guias:[]};
    } else {
      app.select(null);
    }
  }

  function move(e) {
    const p = world(e);
    document.getElementById("cursorPosition").textContent =
      `X: ${p.x.toFixed(2)} m | Y: ${p.y.toFixed(2)} m`;

    if(drag) {
      let nx=p.x-drag.dx, ny=p.y-drag.dy;
      const s=Grade.pontoSnap(nx,ny);
      if(s.encaixou) { nx=s.x; ny=s.y; }
      const a=Ajuste.aplicar(drag.c,nx,ny,app.componentes);
      nx=a.x; ny=a.y;
      if(nx!==drag.c.x || ny!==drag.c.y){
        if(!drag.moved){ app.snapshot(); drag.moved=true; }
        drag.c.x=nx; drag.c.y=ny;
      }
      drag.guias=a.guias;
      app.render(false);
    }
  }

  function up() {
    if(drag) { drag=null; app.render(false); }
  }

  function wheel(e) {
    e.preventDefault();
    const old=app.scale, f=e.deltaY<0?1.1:.9, mouse=world(e);
    const nova=Math.max(20,Math.min(320,old*f));
    app.scale=nova;
    app.panX=app.panX + mouse.x*(old-nova);
    app.panY=app.panY + mouse.y*(old-nova);
    app.render(false);
  }

  // Dimensão ocupada no plano. Altura física não participa da geometria 2D.
  function footprint(c) {
    if(c.tipo === "janela") return {w:c.comprimento||1, h:.10};
    if(c.tipo === "porta" || c.tipo === "porta_correr") return {w:c.comprimento||.8, h:.10};
    if(c.tipo === "parede_tijolo" || c.tipo === "parede_drywall") return {w:c.comprimento||1, h:c.largura||.10};
    if(c.tipo === "pilar") return {w:c.comprimento||.20, h:c.largura||.20};
    return {w:c.comprimento||c.largura||.8, h:c.largura||c.comprimento||.8};
  }

  function draw() {
    if(!ctx) return;
    const w=canvas.clientWidth,h=canvas.clientHeight;
    ctx.clearRect(0,0,w,h);
    ctx.save();
    ctx.translate(app.panX,app.panY);
    ctx.scale(app.scale,app.scale);

    const left=-app.panX/app.scale, top=-app.panY/app.scale;
    const right=left+w/app.scale, bottom=top+h/app.scale;
    ctx.fillStyle="#f4f6f7";
    ctx.fillRect(left,top,right-left,bottom-top);
    drawGrid(left,top,right,bottom);
    if(drag && drag.guias && drag.guias.length) drawGuides(drag.guias,top,bottom,left,right);
    app.componentes.forEach(c=>drawComponent(c,c===app.selecionado));
    ctx.restore();
  }


  function drawGuides(guias,top,bottom,left,right){
    ctx.save();
    ctx.strokeStyle="#e34b32"; ctx.lineWidth=.012; ctx.setLineDash([.08,.06]);
    for(const g of guias){
      ctx.beginPath();
      if(g.tipo==="x"){ctx.moveTo(g.valor,top);ctx.lineTo(g.valor,bottom)}
      else {ctx.moveTo(left,g.valor);ctx.lineTo(right,g.valor)}
      ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
  }
  function drawGrid(l,t,r,b) {
    const s=Grade.espacamento;
    ctx.strokeStyle="#d8dee2"; ctx.lineWidth=.008; ctx.beginPath();
    for(let x=Math.floor(l/s)*s;x<=r;x+=s){ctx.moveTo(x,t);ctx.lineTo(x,b)}
    for(let y=Math.floor(t/s)*s;y<=b;y+=s){ctx.moveTo(l,y);ctx.lineTo(r,y)}
    ctx.stroke();
    ctx.fillStyle="#8a979f";
    for(let x=Math.floor(l/s)*s;x<=r;x+=s)
      for(let y=Math.floor(t/s)*s;y<=b;y+=s){ctx.beginPath();ctx.arc(x,y,.025,0,Math.PI*2);ctx.fill()}
  }

  function drawComponent(c,sel) {
    const fp=footprint(c);
    ctx.save();
    ctx.translate(c.x+fp.w/2,c.y+fp.h/2);
    ctx.rotate(c.rotacao*Math.PI/180);

    if(c.tipo === "janela") drawWindow(c,fp,sel);
    else if(c.tipo === "porta" || c.tipo === "porta_correr") drawDoor(c,fp,sel);
    else if(c.tipo === "pia_cozinha" || c.tipo === "pia_banheiro") drawSink(c,fp,sel);
    else if(c.tipo === "armario_cozinha") drawKitchenCabinet(c,fp,sel);
    else if(c.tipo === "geladeira") drawFridge(c,fp,sel);
    else if(c.tipo === "fogao") drawStove(c,fp,sel);
    else if(c.tipo === "privada") drawToilet(c,fp,sel);
    else if(c.tipo === "chuveiro") drawShower(c,fp,sel);
    else if(c.tipo === "box") drawBox(c,fp,sel);
    else if(c.tipo === "criado_mudo") drawNightstand(c,fp,sel);
    else if(c.tipo === "parede_tijolo" || c.tipo === "parede_drywall") drawWall(c,fp,sel);
    else drawGeneric(c,fp,sel);

    if(sel) selectionBox(fp);
    ctx.restore();
  }

  function strokeFill(fp,fill,stroke="#455a64",width=.025){
    ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=width;
    ctx.fillRect(-fp.w/2,-fp.h/2,fp.w,fp.h);
    ctx.strokeRect(-fp.w/2,-fp.h/2,fp.w,fp.h);
  }

  function text(txt,y=0,size=.15){
    ctx.fillStyle="#263238";
    ctx.font=`bold ${size}px Arial`;
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(txt,0,y);
  }

  function drawWall(c,fp,sel){
    strokeFill(fp,c.tipo==="parede_tijolo"?cores.parede:cores.drywall,sel?"#e34b32":"#455a64",sel?.05:.025);
    ctx.strokeStyle="#876b4b";ctx.lineWidth=.012;
    if(c.tipo==="parede_tijolo"){
      const brick=.38, rows=Math.max(1,Math.round(fp.h/.10));
      for(let row=0;row<rows;row++){
        const y=-fp.h/2+(row+.5)*fp.h/rows;
        ctx.beginPath();ctx.moveTo(-fp.w/2,y);ctx.lineTo(fp.w/2,y);ctx.stroke();
      }
    } else {
      ctx.strokeStyle="#a38f72";ctx.lineWidth=.01;ctx.setLineDash([.08,.05]);
      ctx.strokeRect(-fp.w/2+.03,-fp.h/2+.02,fp.w-.06,fp.h-.04);ctx.setLineDash([]);
    }
  }

  // Vista de planta: janela = duas linhas paralelas de vidro dentro da espessura da parede.
  function drawWindow(c,fp,sel){
    ctx.fillStyle=sel?"#91dced":cores.janela;
    ctx.strokeStyle=sel?"#e34b32":"#2f7484";ctx.lineWidth=sel?.045:.022;
    ctx.fillRect(-fp.w/2,-fp.h/2,fp.w,fp.h);
    ctx.strokeRect(-fp.w/2,-fp.h/2,fp.w,fp.h);
    ctx.strokeStyle="#eafcff";ctx.lineWidth=.025;
    ctx.beginPath();ctx.moveTo(-fp.w/2,.015);ctx.lineTo(fp.w/2,.015);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-fp.w/2,-.015);ctx.lineTo(fp.w/2,-.015);ctx.stroke();
    if(fp.w>.65) text("JANELA",-.17,.13);
  }

  // Vista de planta: porta mostra a folha e o arco de abertura.
  function drawDoor(c,fp,sel){
    const col=sel?"#e34b32":cores.porta;
    ctx.strokeStyle=col;ctx.lineWidth=sel?.05:.035;
    ctx.beginPath();ctx.moveTo(-fp.w/2,-fp.h/2);ctx.lineTo(fp.w/2,-fp.h/2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-fp.w/2,-fp.h/2);ctx.lineTo(-fp.w/2,fp.w*.92-fp.h/2);ctx.stroke();
    ctx.strokeStyle=sel?"#ef765f":"#8e6548";ctx.lineWidth=.018;
    ctx.beginPath();
    ctx.arc(-fp.w/2,-fp.h/2,fp.w,0,Math.PI/2);
    ctx.stroke();
    if(c.tipo==="porta_correr"){
      ctx.strokeStyle="#5b6b73";ctx.lineWidth=.018;
      ctx.beginPath();ctx.moveTo(-fp.w/2,-.035);ctx.lineTo(fp.w/2,-.035);ctx.moveTo(-fp.w/2,.035);ctx.lineTo(fp.w/2,.035);ctx.stroke();
    }
    if(fp.w>.65) text(c.tipo==="porta_correr"?"CORRER":"PORTA",-.18,.12);
  }

  // Pia: bancada retangular + bojo claramente desenhado por cima, em vista superior.
  function drawSink(c,fp,sel){
    const base= c.tipo==="pia_cozinha"?cores.pia_cozinha:cores.pia_banheiro;
    strokeFill(fp,base,sel?"#e34b32":"#60666a",sel?.05:.025);
    const bw=Math.min(fp.w*.62,Math.max(.28,fp.w-.20));
    const bh=Math.min(fp.h*.65,Math.max(.25,fp.h-.12));
    ctx.fillStyle="#f5f7f7";ctx.strokeStyle="#58656b";ctx.lineWidth=.018;
    ctx.beginPath();ctx.ellipse(0,.02,bw/2,bh/2,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle="#849198";ctx.lineWidth=.012;
    ctx.beginPath();ctx.arc(0,.02,Math.min(bw,bh)*.20,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(0,-bh*.72,.055,0,Math.PI*2);ctx.stroke();
    text(c.tipo==="pia_cozinha"?"PIA":"LAVATÓRIO",fp.h/2+.16,.115);
  }

  function drawKitchenCabinet(c,fp,sel){
    strokeFill(fp,cores.armario_cozinha,sel?"#e34b32":"#62462f",sel?.05:.025);
    ctx.strokeStyle="#e5c5a4";ctx.lineWidth=.018;
    ctx.beginPath();ctx.moveTo(0,-fp.h/2);ctx.lineTo(0,fp.h/2);ctx.stroke();
    ctx.fillStyle="#5f4737";ctx.beginPath();ctx.arc(-fp.w*.12,0,.025,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(fp.w*.12,0,.025,0,Math.PI*2);ctx.fill();
    text(c.tipoArmarioCozinha==="Superior"?"ARM. SUP.":"ARM. INF.",0,.105);
  }

  function drawFridge(c,fp,sel){
    strokeFill(fp,cores.geladeira,sel?"#e34b32":"#56636b",sel?.05:.025);
    ctx.strokeStyle="#737f85";ctx.lineWidth=.018;
    ctx.beginPath();ctx.moveTo(-fp.w/2,0);ctx.lineTo(fp.w/2,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(fp.w*.30,-fp.h*.22);ctx.lineTo(fp.w*.30,-fp.h*.05);ctx.moveTo(fp.w*.30,fp.h*.05);ctx.lineTo(fp.w*.30,fp.h*.22);ctx.stroke();
    text("GELADEIRA",0,.10);
  }

  function drawStove(c,fp,sel){
    strokeFill(fp,cores.fogao,sel?"#e34b32":"#3e464a",sel?.05:.025);
    ctx.strokeStyle="#dfe5e7";ctx.lineWidth=.018;
    const r=Math.min(fp.w,fp.h)*.22;
    [[-.25,-.22],[.25,-.22],[-.25,.22],[.25,.22]].forEach(p=>{ctx.beginPath();ctx.arc(p[0]*fp.w,p[1]*fp.h,r,0,Math.PI*2);ctx.stroke()});
    text("FOGÃO",0,.10);
  }

  function drawToilet(c,fp,sel){
    strokeFill(fp,cores.banheiro,sel?"#e34b32":"#6b7a81",sel?.05:.025);
    ctx.fillStyle="#fff";ctx.strokeStyle="#65747a";ctx.lineWidth=.018;
    ctx.beginPath();ctx.ellipse(0,fp.h*.10,fp.w*.32,fp.h*.30,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeRect(-fp.w*.30,-fp.h*.40,fp.w*.60,fp.h*.18);
    text("WC",fp.h*.38,.105);
  }

  function drawShower(c,fp,sel){
    strokeFill(fp,cores.banheiro,sel?"#e34b32":"#6b7a81",sel?.05:.025);
    ctx.strokeStyle="#4f8c9d";ctx.lineWidth=.018;
    ctx.beginPath();ctx.arc(0,0,Math.min(fp.w,fp.h)*.32,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-fp.h*.40);ctx.lineTo(0,-fp.h*.20);ctx.stroke();
    text("CHUVEIRO",fp.h*.37,.09);
  }

  function drawBox(c,fp,sel){
    ctx.strokeStyle=sel?"#e34b32":"#4c8998";ctx.lineWidth=sel?.045:.022;ctx.setLineDash([.08,.04]);
    ctx.strokeRect(-fp.w/2,-fp.h/2,fp.w,fp.h);ctx.setLineDash([]);text("BOX",0,.12);
  }

  function drawNightstand(c,fp,sel){
    strokeFill(fp,"#b58d69",sel?"#e34b32":"#654936",sel?.05:.025);
    ctx.strokeStyle="#e5c3a4";ctx.lineWidth=.018;
    ctx.strokeRect(-fp.w*.38,-fp.h*.34,fp.w*.76,fp.h*.24);
    ctx.strokeRect(-fp.w*.38,fp.h*.10,fp.w*.76,fp.h*.24);
    ctx.fillStyle="#5b4030";
    ctx.beginPath();ctx.arc(0,-fp.h*.22,.022,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(0,fp.h*.22,.022,0,Math.PI*2);ctx.fill();
    text("CRIADO-MUDO",fp.h*.62,.09);
  }

  function drawGeneric(c,fp,sel){
    strokeFill(fp,cores.generico,sel?"#e34b32":"#59666d",sel?.05:.025);
    const nome=c.nomePersonalizado||Componentes.tipos[c.tipo].nome;
    let label=nome.toUpperCase(); if(label.length>13) label=label.slice(0,12)+"…";
    text(label,0,.11);
  }

  function selectionBox(fp){
    ctx.strokeStyle="#e34b32";ctx.setLineDash([.08,.05]);ctx.lineWidth=.025;
    ctx.strokeRect(-fp.w/2-.05,-fp.h/2-.05,fp.w+.10,fp.h+.10);ctx.setLineDash([]);
  }

  function zoom(delta){app.scale=Math.max(20,Math.min(320,app.scale*delta));draw()}

  function fit(){
    if(!app.componentes.length){app.panX=app.panY=0;app.scale=80;draw();return}
    let xs=[],ys=[];
    app.componentes.forEach(c=>{const f=footprint(c);xs.push(c.x,c.x+f.w);ys.push(c.y,c.y+f.h)});
    const minx=Math.min(...xs),maxx=Math.max(...xs),miny=Math.min(...ys),maxy=Math.max(...ys);
    const w=canvas.clientWidth,h=canvas.clientHeight;
    app.scale=Math.max(20,Math.min(320,Math.min(w/(maxx-minx+2),h/(maxy-miny+2))));
    app.panX=w/2-((minx+maxx)/2)*app.scale;
    app.panY=h/2-((miny+maxy)/2)*app.scale;
    draw();
  }

  return {init,draw,zoom,fit,footprint};
})();

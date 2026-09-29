window.App = (() => {
  const app={componentes:[],selecionado:null,scale:80,panX:0,panY:0,undo:[],redo:[]};
  let nextId=1;
  function snapshot(){app.undo.push(JSON.stringify(app.componentes));if(app.undo.length>50)app.undo.shift();app.redo=[]}
  function render(keep=true){Renderizador.draw();document.getElementById("zoomLabel").textContent=Math.round(app.scale/80*100)+"%";document.getElementById("selectionStatus").textContent=app.selecionado?`Selecionado: ${app.selecionado.nomePersonalizado||Componentes.tipos[app.selecionado.tipo].nome}`:"Nenhum componente selecionado";if(app.selecionado)Propriedades.render(app.selecionado,document.getElementById("propertiesPanel"),change,del,rotate,position);else document.getElementById("propertiesPanel").innerHTML='<div class="empty">Selecione um componente para editar suas características.</div>'}
  function select(c){app.selecionado=c;render()}
  function add(tipo){snapshot();const c=Componentes.novo(tipo,nextId++);c.x=1+(app.componentes.length%5)*1.5;c.y=1+Math.floor(app.componentes.length/5)*1.5;const s=Grade.pontoSnap(c.x,c.y);c.x=s.x;c.y=s.y;app.componentes.push(c);select(c)}
  function change(k,v){snapshot();app.selecionado[k]=v;render()}
  function del(){if(!app.selecionado)return;snapshot();app.componentes=app.componentes.filter(c=>c!==app.selecionado);app.selecionado=null;render()}
  function rotate(){if(!app.selecionado)return;snapshot();app.selecionado.rotacao=Geometria.normalizarAngulo(app.selecionado.rotacao+90);render()}
  function position(chave,valor,dy){
    if(!app.selecionado)return;
    snapshot();
    if(chave===null){app.selecionado.x+=valor;app.selecionado.y+=dy;}
    else app.selecionado[chave]=Math.max(0,valor);
    render();
  }
  function undo(){if(!app.undo.length)return;app.redo.push(JSON.stringify(app.componentes));app.componentes=JSON.parse(app.undo.pop());app.selecionado=null;render()}
  function redo(){if(!app.redo.length)return;app.undo.push(JSON.stringify(app.componentes));app.componentes=JSON.parse(app.redo.pop());app.selecionado=null;render()}
  function novo(){snapshot();app.componentes=[];app.selecionado=null;app.scale=80;app.panX=0;app.panY=0;render()}
  function menu(){
    const box=document.getElementById("componentMenu"),groups={};
    Object.entries(Componentes.tipos).forEach(([id,t])=>(groups[t.grupo]??=[]).push([id,t]));
    Object.entries(groups).forEach(([g,arr])=>{const div=document.createElement("div");div.className="menu-group";div.innerHTML=`<div class="menu-title">${g}</div>`;arr.forEach(([id,t])=>{const b=document.createElement("button");b.className="component-btn";b.draggable=true;b.innerHTML=`<span class="component-icon">${t.icone}</span>${t.nome}`;b.onclick=()=>add(id);b.ondragstart=e=>e.dataTransfer.setData("tipo",id);div.appendChild(b)});box.appendChild(div)});
    const da=document.getElementById("drawingArea");da.ondragover=e=>e.preventDefault();da.ondrop=e=>{e.preventDefault();const tipo=e.dataTransfer.getData("tipo");if(!tipo)return;const rect=document.getElementById("plantCanvas").getBoundingClientRect();const x=(e.clientX-rect.left-app.panX)/app.scale,y=(e.clientY-rect.top-app.panY)/app.scale;const c=Componentes.novo(tipo,nextId++),s=Grade.pontoSnap(x,y);c.x=s.encaixou?s.x:x;c.y=s.encaixou?s.y:y;snapshot();app.componentes.push(c);select(c)}
  }
  function actions(){
    document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==="new")novo();if(a==="open")document.getElementById("fileInput").click();if(a==="save")ArquivoPlanta.salvar(app);if(a==="undo")undo();if(a==="redo")redo();if(a==="zoomIn"){app.scale=Math.min(320,app.scale*1.15);render()}if(a==="zoomOut"){app.scale=Math.max(20,app.scale/1.15);render()}if(a==="fit")Renderizador.fit();if(a==="export")exportar()});
    document.getElementById("fileInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{snapshot();ArquivoPlanta.abrirTexto(app,r.result)}catch(err){alert("Não foi possível abrir: "+err.message)}};r.readAsText(f);e.target.value=""};
    document.addEventListener("keydown",e=>{
      const alvo=e.target, digitando=["INPUT","SELECT","TEXTAREA"].includes(alvo.tagName);
      if(e.key==="Delete" && !digitando){e.preventDefault();del();return}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undo();return}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="y"){e.preventDefault();redo();return}
      if(!digitando && app.selecionado && ["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
        e.preventDefault();
        const passo=(e.ctrlKey||e.metaKey)?0.001:(e.shiftKey?0.10:0.01);
        let dx=0,dy=0;
        if(e.key==="ArrowLeft")dx=-passo;
        if(e.key==="ArrowRight")dx=passo;
        if(e.key==="ArrowUp")dy=-passo;
        if(e.key==="ArrowDown")dy=passo;
        snapshot();
        Ajuste.moverPorTecla(app.selecionado,dx,dy);
        render();
      }
    });
  }
  function exportar(){const c=document.getElementById("plantCanvas"),a=document.createElement("a");a.download="planta_baixa.png";a.href=c.toDataURL("image/png");a.click()}
  function start(){menu();actions();Renderizador.init(app);render();}
  app.snapshot=snapshot;app.render=render;app.select=select;app.componentes=app.componentes;window.PlantaApp=app;return {start};
})();
window.addEventListener("load",App.start);
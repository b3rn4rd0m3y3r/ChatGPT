window.Selecao = (() => {
  function footprint(comp){
    if(comp.tipo === "janela") return {w:comp.comprimento||1,h:.10};
    if(comp.tipo === "porta" || comp.tipo === "porta_correr") return {w:comp.comprimento||.8,h:.10};
    if(comp.tipo === "parede_tijolo" || comp.tipo === "parede_drywall") return {w:comp.comprimento||1,h:comp.largura||.10};
    if(comp.tipo === "pilar") return {w:comp.comprimento||.20,h:comp.largura||.20};
    return {w:comp.comprimento||comp.largura||.8,h:comp.largura||comp.comprimento||.8};
  }
  function hitTest(comp,x,y){
    const f=footprint(comp),cx=comp.x+f.w/2,cy=comp.y+f.h/2;
    const a=-comp.rotacao*Math.PI/180,dx=x-cx,dy=y-cy;
    const lx=dx*Math.cos(a)-dy*Math.sin(a)+f.w/2;
    const ly=dx*Math.sin(a)+dy*Math.cos(a)+f.h/2;
    return lx>=0&&lx<=f.w&&ly>=0&&ly<=f.h;
  }
  function encontrar(lista,x,y){
    for(let i=lista.length-1;i>=0;i--) if(hitTest(lista[i],x,y)) return lista[i];
    return null;
  }
  return {hitTest,encontrar};
})();

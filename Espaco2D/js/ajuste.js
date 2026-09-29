window.Ajuste = (() => {
  const tolerancia = 0.05; // 5 cm
  const vazio = {x:null,y:null,guias:[]};

  function aabb(c, x=c.x, y=c.y) {
    const fp = Renderizador.footprint(c);
    const cx=x+fp.w/2, cy=y+fp.h/2;
    const a=(c.rotacao||0)*Math.PI/180;
    const pts=[[-fp.w/2,-fp.h/2],[fp.w/2,-fp.h/2],[fp.w/2,fp.h/2],[-fp.w/2,fp.h/2]];
    const xs=[],ys=[];
    for(const [px,py] of pts){
      xs.push(cx+px*Math.cos(a)-py*Math.sin(a));
      ys.push(cy+px*Math.sin(a)+py*Math.cos(a));
    }
    return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
  }

  function aplicar(c,x,y,componentes,opcoes={}) {
    let nx=x, ny=y;
    const guias=[];
    const mover=aabb(c,nx,ny);
    let melhorX=null, melhorY=null;
    const tol=opcoes.tolerancia ?? tolerancia;

    for(const outro of componentes){
      if(outro===c) continue;
      const alvo=aabb(outro);
      const xCandidatos=[
        {d:alvo.left-mover.right, valor:alvo.left-mover.right, gx:alvo.left, tipo:"encostar"},
        {d:alvo.right-mover.left, valor:alvo.right-mover.left, gx:alvo.right, tipo:"encostar"}
      ];
      const yCandidatos=[
        {d:alvo.top-mover.bottom, valor:alvo.top-mover.bottom, gy:alvo.top, tipo:"encostar"},
        {d:alvo.bottom-mover.top, valor:alvo.bottom-mover.top, gy:alvo.bottom, tipo:"encostar"}
      ];
      for(const q of xCandidatos) if(Math.abs(q.d)<=tol && (!melhorX || Math.abs(q.d)<Math.abs(melhorX.d))) melhorX={d:q.d,valor:q.valor,guia:q.gx};
      for(const q of yCandidatos) if(Math.abs(q.d)<=tol && (!melhorY || Math.abs(q.d)<Math.abs(melhorY.d))) melhorY={d:q.d,valor:q.valor,guia:q.gy};

      // Alinhamento de bordas: esquerda-esquerda, direita-direita.
      const ax=[
        {d:alvo.left-mover.left,valor:alvo.left-mover.left,guia:alvo.left},
        {d:alvo.right-mover.right,valor:alvo.right-mover.right,guia:alvo.right}
      ];
      const ay=[
        {d:alvo.top-mover.top,valor:alvo.top-mover.top,guia:alvo.top},
        {d:alvo.bottom-mover.bottom,valor:alvo.bottom-mover.bottom,guia:alvo.bottom}
      ];
      for(const q of ax) if(Math.abs(q.d)<=tol && (!melhorX || Math.abs(q.d)<Math.abs(melhorX.d))) melhorX=q;
      for(const q of ay) if(Math.abs(q.d)<=tol && (!melhorY || Math.abs(q.d)<Math.abs(melhorY.d))) melhorY=q;
    }

    // Recalcula o deslocamento depois do primeiro eixo para manter a geometria consistente.
    if(melhorX){ nx += melhorX.valor; guias.push({tipo:"x",valor:melhorX.guia}); }
    if(melhorY){ ny += melhorY.valor; guias.push({tipo:"y",valor:melhorY.guia}); }
    return {x:nx,y:ny,guias};
  }

  function moverPorTecla(c,dx,dy){
    c.x += dx; c.y += dy;
    return {x:c.x,y:c.y,guias:[]};
  }
  return {tolerancia,aabb,aplicar,moverPorTecla};
})();

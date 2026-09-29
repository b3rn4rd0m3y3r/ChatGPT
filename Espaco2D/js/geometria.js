window.Geometria = {
  distancia(a,b){return Math.hypot(b.x-a.x,b.y-a.y)},
  clamp(v,min,max){return Math.max(min,Math.min(max,v))},
  rotacaoPonto(p,c,graus){
    const r=graus*Math.PI/180, dx=p.x-c.x, dy=p.y-c.y;
    return {x:c.x+dx*Math.cos(r)-dy*Math.sin(r),y:c.y+dx*Math.sin(r)+dy*Math.cos(r)};
  },
  pontoDentroRetangulo(p,r){
    return p.x>=r.x && p.x<=r.x+r.largura && p.y>=r.y && p.y<=r.y+r.altura;
  },
  normalizarAngulo(a){return ((a%360)+360)%360},
  arredondar(v,c=2){const m=10**c;return Math.round(v*m)/m}
};
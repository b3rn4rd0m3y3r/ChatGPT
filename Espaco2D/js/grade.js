window.Grade = (() => {
  const espacamento=.20, tolerancia=.12;
  function snap(v){return Math.round(v/espacamento)*espacamento}
  function pontoSnap(x,y){
    const sx=snap(x),sy=snap(y);
    return {x:sx,y:sy,distancia:Math.hypot(x-sx,y-sy),encaixou:Math.hypot(x-sx,y-sy)<=tolerancia};
  }
  return {espacamento,tolerancia,snap,pontoSnap};
})();
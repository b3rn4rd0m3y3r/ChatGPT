window.Propriedades = (() => {
  const labels={comprimento:"Comprimento (m)",largura:"Largura (m)",altura:"Altura (m)",
    tipoTijolo:"Tipo de tijolo",tipoJanela:"Tipo",tipoPorta:"Tipo",tipoPia:"Tipo de tampo",
    tipoArmarioCozinha:"Tipo",tipoArmarioEmbutido:"Tipo",nomePersonalizado:"Nome"};
  function options(campo){
    if(campo==="tipoTijolo") return [["ceramico_9x19x19","Cerâmico 9 × 19 × 19 cm"],["ceramico_14x19x29","Cerâmico 14 × 19 × 29 cm"],["concreto_9x19x39","Concreto 9 × 19 × 39 cm"]];
    if(campo==="tipoPia") return [["Em tampo de mármore","Em tampo de mármore"],["Em tampo de cerâmica","Em tampo de cerâmica"]];
    if(campo==="tipoArmarioCozinha") return [["Inferior","Inferior"],["Superior","Superior"],["Outros","Outros"]];
    if(campo==="tipoArmarioEmbutido") return [["4 portas","4 portas"],["6 portas","6 portas"],["Outros","Outros"]];
    if(campo==="tipoJanela") return [["Alumínio","Alumínio"],["Madeira","Madeira"],["PVC","PVC"],["Vidro temperado","Vidro temperado"]];
    if(campo==="tipoPorta") return [["Porta simples","Porta simples"],["Porta dupla","Porta dupla"],["Porta de banheiro","Porta de banheiro"]];
    return null;
  }
  function render(comp,container,onChange,onDelete,onRotate,onPosition){
    container.innerHTML="";
    const title=document.createElement("div");title.className="selected-title";
    title.textContent=comp.nomePersonalizado||Componentes.tipos[comp.tipo].nome;container.appendChild(title);
    const g=document.createElement("div");g.className="property-group";
    for(const campo of Componentes.tipos[comp.tipo].campos){
      const f=document.createElement("div");f.className="field";
      const lab=document.createElement("label");lab.textContent=labels[campo]||campo;f.appendChild(lab);
      const opts=options(campo);
      let input;
      if(opts){input=document.createElement("select");opts.forEach(o=>{const op=document.createElement("option");op.value=o[0];op.textContent=o[1];if(String(comp[campo])===o[0])op.selected=true;input.appendChild(op)});}
      else {input=document.createElement("input");input.type=campo==="nomePersonalizado"?"text":"number";if(input.type==="number"){input.step=".01";input.min="0"}input.value=comp[campo]??"";}
      input.addEventListener("change",()=>{let v=input.value;if(input.type==="number")v=parseFloat(v)||0;onChange(campo,v)});
      f.appendChild(input);g.appendChild(f);
    }
    container.appendChild(g);

    const pos=document.createElement("div");pos.className="property-group";
    const pt=document.createElement("div");pt.className="property-title";pt.textContent="Posição";pos.appendChild(pt);
    const row=document.createElement("div");row.className="row";
    [["X", "x"],["Y", "y"]].forEach(([rotulo,chave])=>{
      const f=document.createElement("div");f.className="field";
      const lab=document.createElement("label");lab.textContent=rotulo+" (m)";f.appendChild(lab);
      const input=document.createElement("input");input.type="number";input.step=".001";input.value=Number(comp[chave]).toFixed(3);
      input.addEventListener("change",()=>onPosition(chave,parseFloat(input.value)||0));f.appendChild(input);row.appendChild(f);
    });
    pos.appendChild(row);
    const nudge=document.createElement("div");nudge.className="nudge-grid";
    [["↖",-.01,-.01],["↑",0,-.01],["↗",.01,-.01],["←",-.01,0],["•",0,0],["→",.01,0],["↙",-.01,.01],["↓",0,.01],["↘",.01,.01]].forEach(([txt,dx,dy])=>{
      const b=document.createElement("button");b.textContent=txt;b.title="Mover 1 cm";b.disabled=txt==="•";
      b.onclick=()=>onPosition(null,dx,dy);nudge.appendChild(b);
    });
    pos.appendChild(nudge);
    const hint=document.createElement("div");hint.className="mini-help";hint.textContent="Setas: 1 cm  |  Shift: 10 cm  |  Ctrl: 1 mm";pos.appendChild(hint);
    container.appendChild(pos);

    const info=document.createElement("div");info.className="info-box";
    info.innerHTML=`Posição: ${comp.x.toFixed(2)} m × ${comp.y.toFixed(2)} m<br>Rotação: ${comp.rotacao}°`;
    if(comp.tipo==="parede_tijolo"){const n=calcularTijolos(comp);info.innerHTML+=`<br><b>Estimativa: ${n} tijolos</b>`}
    container.appendChild(info);
    const r=document.createElement("button");r.textContent="↻ Rotacionar 90°";r.className="primary";r.style.width="100%";r.onclick=onRotate;container.appendChild(r);
    const del=document.createElement("button");del.textContent="Excluir componente";del.className="danger";del.style.width="100%";del.style.marginTop="7px";del.onclick=onDelete;container.appendChild(del);
  }
  function calcularTijolos(c){
    const mapas={ceramico_9x19x19:[.09,.19,.19],ceramico_14x19x29:[.14,.19,.29],concreto_9x19x39:[.09,.19,.39]};
    const d=mapas[c.tipoTijolo]||mapas.ceramico_9x19x19;
    const area=c.comprimento*c.altura, face=d[1]*d[2], perda=.10;
    return Math.ceil(area/face*(1+perda));
  }
  return {render,calcularTijolos};
})();
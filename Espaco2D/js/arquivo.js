window.ArquivoPlanta = (() => {
  function estado(app){return JSON.parse(JSON.stringify({versao:1,unidade:"m",grade:{espacamento:Grade.espacamento,snap:true},componentes:app.componentes}))}
  function baixar(nome,texto,tipo){const blob=new Blob([texto],{type:tipo}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nome;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function salvar(app){baixar("planta_baixa.json",JSON.stringify(estado(app),null,2),"application/json")}
  function abrirTexto(app,texto){const d=JSON.parse(texto);if(!d.componentes)throw Error("Arquivo sem componentes.");app.componentes=d.componentes;app.selecionado=null;app.render();}
  return {salvar,abrirTexto,estado};
})();
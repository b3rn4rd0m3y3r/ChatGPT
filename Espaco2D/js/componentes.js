window.Componentes = (() => {
  const tipos = {
    parede_tijolo:{nome:"Parede de tijolo",grupo:"Estruturais",icone:"🧱",campos:["tipoTijolo","comprimento","largura","altura"]},
    parede_drywall:{nome:"Parede de drywall",grupo:"Estruturais",icone:"▤",campos:["comprimento","largura","altura"]},
    pilar:{nome:"Pilar / coluna",grupo:"Estruturais",icone:"▥",campos:["comprimento","largura","altura"]},
    janela:{nome:"Janela / vidraça",grupo:"Esquadrias",icone:"▣",campos:["tipoJanela","comprimento","altura"]},
    porta:{nome:"Porta",grupo:"Esquadrias",icone:"🚪",campos:["tipoPorta","comprimento","altura"]},
    porta_correr:{nome:"Porta de correr",grupo:"Esquadrias",icone:"⇆",campos:["comprimento","altura"]},
    pia_cozinha:{nome:"Pia de cozinha",grupo:"Cozinha",icone:"🚰",campos:["tipoPia","comprimento","largura"]},
    armario_cozinha:{nome:"Armário de cozinha",grupo:"Cozinha",icone:"▤",campos:["tipoArmarioCozinha","comprimento","largura"]},
    geladeira:{nome:"Geladeira",grupo:"Cozinha",icone:"▥",campos:["comprimento","largura"]},
    fogao:{nome:"Fogão / cooktop",grupo:"Cozinha",icone:"▦",campos:["comprimento","largura"]},
    pia_banheiro:{nome:"Pia de banheiro",grupo:"Banheiro",icone:"🚰",campos:["tipoPia","comprimento","largura"]},
    chuveiro:{nome:"Chuveiro",grupo:"Banheiro",icone:"🚿",campos:["comprimento","largura"]},
    privada:{nome:"Privada",grupo:"Banheiro",icone:"🚽",campos:["comprimento","largura"]},
    armario_banheiro:{nome:"Armário de banheiro",grupo:"Banheiro",icone:"🗄",campos:["comprimento","largura"]},
    box:{nome:"Box de banheiro",grupo:"Banheiro",icone:"▢",campos:["comprimento","largura","altura"]},
    armario_embutido:{nome:"Armário embutido",grupo:"Mobiliário",icone:"▤",campos:["tipoArmarioEmbutido","comprimento","largura"]},
    cristaleira:{nome:"Cristaleira",grupo:"Mobiliário",icone:"▥",campos:["comprimento","largura","altura"]},
    cama:{nome:"Cama",grupo:"Mobiliário",icone:"▱",campos:["comprimento","largura"]},
    sofa:{nome:"Sofá",grupo:"Mobiliário",icone:"▰",campos:["comprimento","largura"]},
    mesa:{nome:"Mesa",grupo:"Mobiliário",icone:"○",campos:["comprimento","largura"]},
    estante:{nome:"Estante",grupo:"Mobiliário",icone:"▤",campos:["comprimento","largura"]},
    criado_mudo:{nome:"Criado-mudo",grupo:"Mobiliário",icone:"▥",campos:["comprimento","largura"]},
    escada:{nome:"Escada",grupo:"Outros",icone:"≋",campos:["comprimento","largura"]},
    lavadora:{nome:"Máquina de lavar",grupo:"Outros",icone:"◉",campos:["comprimento","largura"]},
    tanque:{nome:"Tanque",grupo:"Outros",icone:"▱",campos:["comprimento","largura"]},
    generico:{nome:"Componente genérico",grupo:"Outros",icone:"◇",campos:["nomePersonalizado","comprimento","largura","altura"]}
  };
  const defaults = {
    parede_tijolo:{comprimento:3,largura:.15,altura:2.8,tipoTijolo:"ceramico_9x19x19"},
    parede_drywall:{comprimento:3,largura:.10,altura:2.8},
    pilar:{comprimento:.20,largura:.20,altura:2.8},
    janela:{comprimento:1.2,altura:1,tipoJanela:"Alumínio"},
    porta:{comprimento:.80,altura:2.10,tipoPorta:"Porta simples"},
    porta_correr:{comprimento:1.8,altura:2.1},
    pia_cozinha:{comprimento:1.2,largura:.55,tipoPia:"Em tampo de mármore"},
    armario_cozinha:{comprimento:1.2,largura:.60,tipoArmarioCozinha:"Inferior"},
    geladeira:{comprimento:.70,largura:.70},fogao:{comprimento:.60,largura:.60},
    pia_banheiro:{comprimento:.60,largura:.50,tipoPia:"Em tampo de mármore"},
    chuveiro:{comprimento:.90,largura:.90},privada:{comprimento:.40,largura:.70},
    armario_banheiro:{comprimento:.80,largura:.45},box:{comprimento:.90,largura:.90,altura:2.1},
    armario_embutido:{comprimento:2.4,largura:.65,tipoArmarioEmbutido:"4 portas"},
    cristaleira:{comprimento:1.2,largura:.45,altura:2},
    cama:{comprimento:1.9,largura:1.4},sofa:{comprimento:2,largura:.85},
    mesa:{comprimento:1.2,largura:.80},estante:{comprimento:1.2,largura:.35},
    criado_mudo:{comprimento:.50,largura:.45},
    escada:{comprimento:2.8,largura:1},lavadora:{comprimento:.60,largura:.60},
    tanque:{comprimento:.60,largura:.55},generico:{nomePersonalizado:"Componente",comprimento:1,largura:1,altura:1}
  };
  function novo(tipo,id){
    const d=JSON.parse(JSON.stringify(defaults[tipo]||defaults.generico));
    return {id,tipo,x:1,y:1,rotacao:0, ...d};
  }
  return {tipos,defaults,novo};
})();
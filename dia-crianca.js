/*************************************************
 * VanBerto's — O Dia da Criança 🎈
 * Professora: Vanda Várzea
 *
 * Jogo educativo sobre os Direitos das Crianças
 * e o Dia da Criança — 1 de Junho.
 *
 * 10 níveis · 3 opções por pergunta · Segunda tentativa
 * VanBerto's: mascote colorida com fato de festa
 *************************************************/

window.addEventListener("DOMContentLoaded", () => {

  // ===== DOM =====
  const startOverlay   = document.getElementById("startOverlay");
  const howOverlay     = document.getElementById("howOverlay");
  const quizOverlay    = document.getElementById("quizOverlay");
  const historyOverlay = document.getElementById("historyOverlay");
  const historyText    = document.getElementById("historyText");
  const btnHistory     = document.getElementById("btnHistory");
  const quizQuestion   = document.getElementById("quizQuestion");
  const quizAnswers    = document.getElementById("quizAnswers");
  const quizFeedback   = document.getElementById("quizFeedback");
  const quizExplanation= document.getElementById("quizExplanation");
  const btnCloseQuiz   = document.getElementById("btnCloseQuiz");
  const btnStart       = document.getElementById("btnStart");
  const btnHow         = document.getElementById("btnHow");
  const btnCloseHow    = document.getElementById("btnCloseHow");
  const btnMute        = document.getElementById("btnMute");
  const btnPause       = document.getElementById("btnPause");
  const btnRestart     = document.getElementById("btnRestartLevel");
  const btnRestartGame = document.getElementById("btnRestartGame");
  const playerNameInput= document.getElementById("playerName");
  const gameOverOverlay= document.getElementById("gameOverOverlay");
  const winOverlay     = document.getElementById("winOverlay");

  const hitFlash   = document.createElement("div"); hitFlash.id = "hitFlash";   document.body.appendChild(hitFlash);
  const bonusStars = document.createElement("div"); bonusStars.id = "bonusStars"; document.body.appendChild(bonusStars);

  let playerName = "";

  // ===== Áudio =====
  let audioCtx = null, muted = false;

  function ensureAudio() {
    if (muted) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep({ freq=440, dur=0.08, type="square", vol=0.06, slideTo=null }) {
    if (muted || !audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  const SFX = {
    jump()    { beep({ freq:560, dur:0.08, type:"square",   vol:0.06,  slideTo:720  }); },
    coin()    { beep({ freq:960, dur:0.06, type:"square",   vol:0.055, slideTo:1500 }); },
    hit()     { beep({ freq:220, dur:0.10, type:"sawtooth", vol:0.055, slideTo:160  }); setTimeout(() => beep({ freq:140, dur:0.14, type:"square", vol:0.05, slideTo:110 }), 120); },
    door()    { beep({ freq:700, dur:0.10, type:"triangle", vol:0.055, slideTo:1050 }); },
    doorOpen() {
      beep({ freq:300, dur:0.07, type:"square",   vol:0.05,  slideTo:360 });
      setTimeout(() => beep({ freq:480, dur:0.09, type:"triangle", vol:0.055, slideTo:720  }), 90);
      setTimeout(() => beep({ freq:560, dur:0.12, type:"triangle", vol:0.055, slideTo:840  }), 200);
      setTimeout(() => beep({ freq:840, dur:0.14, type:"triangle", vol:0.055, slideTo:1120 }), 340);
      setTimeout(() => beep({ freq:1120,dur:0.18, type:"triangle", vol:0.055, slideTo:1400 }), 490);
    },
    power()   { beep({ freq:360, dur:0.10, type:"square",   vol:0.055, slideTo:960  }); },
    life()    { beep({ freq:800, dur:0.07, type:"triangle", vol:0.055, slideTo:1100 }); },
    win() {
      beep({ freq:560, dur:0.07, type:"square", vol:0.055, slideTo:700 });
      setTimeout(() => beep({ freq:700, dur:0.07, type:"square", vol:0.055, slideTo:840  }), 90);
      setTimeout(() => beep({ freq:840, dur:0.10, type:"square", vol:0.055, slideTo:1120 }), 180);
    },
    gameOver() {
      [330,262,196].forEach((n,i) => setTimeout(() => beep({ freq:n, dur:0.18, type:"square", vol:0.055, slideTo:n*0.75 }), i*220));
    },
    finalWin() {
      const seq=[560,700,840,1120,1050,840,1120,1400,1260,1400,1680,1400,1680,1900,1680,1900];
      seq.forEach((n,i) => setTimeout(() =>
        beep({ freq:n, dur:i<4?0.08:i<8?0.10:0.13, type:i<8?"square":"triangle", vol:0.06, slideTo:n*1.12 }), i*95));
      setTimeout(() => beep({ freq:1900, dur:0.28, type:"triangle", vol:0.06, slideTo:2200 }), seq.length*95+80);
      // Segunda vaga — acorde final
      setTimeout(() => {
        [560,840,1120].forEach((n,i)=>setTimeout(()=>beep({freq:n,dur:0.35,type:"triangle",vol:0.05,slideTo:n*1.05}),i*60));
      }, seq.length*95+500);
    }
  };

  // ===== Guardar =====
  const SAVE_KEY = "vanbertos_dia_crianca_v1";
  function saveGame() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ muted, currentLevel, score, lives })); } catch {}
  }
  function loadGame() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      if (typeof d.muted === "boolean") muted = d.muted;
    } catch {}
  }

  // ===== Elogios =====
  const PRAISE = ["🌟 Excelente!", "🎈 Muito bem!", "🧸 Boa resposta!", "🎊 Fantástico!", "✨ Brilhante!", "🎁 Continua assim!"];
  function pickPraise() { return PRAISE[Math.floor(Math.random() * PRAISE.length)]; }

  function showFloat(scene, x, y, msg, color="#ff6b35") {
    const t = scene.add.text(x, y, msg, { fontSize:"24px", fontStyle:"900", color, stroke:"#fff8e0", strokeThickness:5 }).setOrigin(0.5).setDepth(999);
    scene.tweens.add({ targets:t, y:y-44, alpha:0, duration:640, ease:"Sine.easeOut", onComplete:()=>t.destroy() });
  }

  // ===== Quiz stats =====
  const quizStats = { total:0, correct:0, everWrong:false, errors:[] };
  const usedQuizByLevel = {};
  let lastQuizTheme = "historia";

  function resetQuizStats() { quizStats.total=0; quizStats.correct=0; quizStats.everWrong=false; quizStats.errors=[]; }

  function pickQuizForLevel(levelIdx, theme) {
    const pool = QUIZ_BY_THEME[theme] || QUIZ_BY_THEME["historia"];
    if (!usedQuizByLevel[levelIdx]) usedQuizByLevel[levelIdx] = new Set();
    const used = usedQuizByLevel[levelIdx];
    if (used.size >= pool.length) used.clear();
    let pick = Math.floor(Math.random() * pool.length), g = 0;
    while (used.has(pick) && g < 50) { pick = Math.floor(Math.random() * pool.length); g++; }
    used.add(pick);
    return pool[pick];
  }

  // ===== "Sabias que…?" — 10 curiosidades sobre o Dia da Criança =====
  const HISTORY = [
    {
      title: "🎈 O Dia da Criança — 1 de Junho",
      text: "O Dia Internacional da Criança celebra-se a 1 de junho em Portugal e em muitos países do mundo. Esta data foi escolhida em 1950 pela Federação Internacional das Mulheres Democráticas, numa conferência em Moscovo. O objetivo era chamar a atenção do mundo para os direitos e o bem-estar das crianças. Em Portugal, o dia é celebrado com festas, prendas e atividades especiais nas escolas."
    },
    {
      title: "📜 A Declaração dos Direitos da Criança — 1959",
      text: "Em 1959, as Nações Unidas aprovaram a Declaração dos Direitos da Criança, com 10 princípios fundamentais. Esta declaração reconhecia que todas as crianças têm direito à proteção, à educação, a um nome e a uma nacionalidade. Foi o primeiro documento internacional dedicado exclusivamente aos direitos das crianças — um passo enorme na história da humanidade!"
    },
    {
      title: "🌍 A Convenção dos Direitos da Criança — 1989",
      text: "A 20 de novembro de 1989, as Nações Unidas aprovaram a Convenção sobre os Direitos da Criança. É o tratado de direitos humanos mais ratificado da história — quase todos os países do mundo o assinaram! Portugal ratificou-o em 1990. A convenção tem 54 artigos e estabelece que todas as crianças têm direito à sobrevivência, ao desenvolvimento, à proteção e à participação."
    },
    {
      title: "⚽ O Direito ao Brincar",
      text: "O artigo 31.º da Convenção dos Direitos da Criança garante o direito ao descanso, ao lazer, ao brincar e às atividades recreativas. Brincar não é só divertimento — é essencial para o desenvolvimento do cérebro, da criatividade e das competências sociais das crianças. Estudos mostram que as crianças que brincam livremente são mais criativas, mais resilientes e têm melhor saúde mental."
    },
    {
      title: "📚 O Direito à Educação",
      text: "O artigo 28.º da Convenção garante o direito de todas as crianças à educação. Em Portugal, o ensino é obrigatório e gratuito até aos 18 anos. No mundo, ainda há 244 milhões de crianças fora da escola — muitas por causa da pobreza, de conflitos armados ou de discriminação. A UNICEF trabalha todos os dias para garantir que todas as crianças do mundo possam estudar."
    },
    {
      title: "💊 O Direito à Saúde",
      text: "O artigo 24.º da Convenção garante o direito de todas as crianças ao mais alto nível de saúde possível. Em Portugal, todas as crianças têm acesso ao Serviço Nacional de Saúde, ao Plano Nacional de Vacinação e ao médico de família. No mundo, morrem ainda por ano milhões de crianças de doenças que se podem prevenir. A UNICEF distribui vacinas, alimentos terapêuticos e água potável em todo o mundo."
    },
    {
      title: "🛡️ O Direito à Proteção",
      text: "Os artigos 19.º e 37.º da Convenção protegem as crianças contra todas as formas de violência, abuso e exploração. Nenhuma criança deve ser maltratada, trabalhar em condições perigosas ou ser privada da sua liberdade. Em Portugal, a CPCJ (Comissão de Proteção de Crianças e Jovens) trabalha para proteger as crianças em risco. Se uma criança estiver em perigo, pode ligar para a linha SOS Criança: 116 111."
    },
    {
      title: "🗣️ O Direito a Ser Ouvido",
      text: "O artigo 12.º da Convenção garante às crianças o direito de expressar a sua opinião em todas as decisões que as afetam. As crianças têm o direito de ser ouvidas nas escolas, nas famílias e pelos governos! Em Portugal, existem parlamentos jovens e conselhos municipais de jovens onde as crianças e adolescentes podem participar ativamente na vida democrática do país."
    },
    {
      title: "🌱 O Futuro das Crianças — Os ODS",
      text: "Em 2015, as Nações Unidas aprovaram os 17 Objetivos de Desenvolvimento Sustentável (ODS), a cumprir até 2030. Vários deles estão diretamente ligados ao bem-estar das crianças: erradicar a pobreza (ODS 1), acabar com a fome (ODS 2), garantir saúde (ODS 3), educação de qualidade (ODS 4) e reduzir as desigualdades (ODS 10). As crianças de hoje são os agentes de mudança do futuro!"
    },
    {
      title: "🌟 A UNICEF — A Guardiã dos Direitos",
      text: "A UNICEF (Fundo das Nações Unidas para a Infância) foi criada em 1946, após a Segunda Guerra Mundial, para ajudar as crianças afetadas pelo conflito. Hoje trabalha em mais de 190 países e territórios. Em Portugal, o Comité Português da UNICEF sensibiliza para os direitos das crianças e angaria fundos para programas em todo o mundo. Cada criança conta — e cada direito importa!"
    },
    {
      title: "🪪 O Direito à Identidade",
      text: "O artigo 7.º da Convenção garante que toda a criança tem direito a ser registada logo após o nascimento e a ter um nome e uma nacionalidade. Sem registo, uma criança não existe legalmente — não pode aceder à escola, à saúde ou a um passaporte. A UNICEF estima que 237 milhões de crianças no mundo não têm registo de nascimento. O teu nome é o primeiro direito que recebes!"
    },
    {
      title: "👨‍👩‍👧 O Direito à Família",
      text: "O artigo 9.º da Convenção garante que a criança não deve ser separada dos seus pais, exceto para a sua própria proteção. O artigo 10.º garante a reunificação familiar quando pais e filhos vivem em países diferentes. A família é o primeiro lugar onde a criança aprende amor, segurança e valores. Quando a família não pode cuidar da criança, o Estado tem obrigação de garantir cuidados alternativos adequados."
    },
    {
      title: "✈️ O Direito das Crianças Refugiadas",
      text: "Mais de 43 milhões de crianças estão deslocadas no mundo, fugindo de guerras, violência e perseguição. O artigo 22.º da Convenção garante que as crianças refugiadas têm exatamente os mesmos direitos que todas as outras. A UNICEF e o ACNUR trabalham em conjunto para proteger estas crianças, garantindo-lhes acesso à educação, à saúde e a um lugar seguro. Ser refugiado não apaga os teus direitos!"
    },
    {
      title: "🚫 O Direito a Não Trabalhar em Condições Perigosas",
      text: "O artigo 32.º da Convenção proíbe o trabalho infantil que prejudique a saúde, a segurança ou a educação da criança. Ainda há cerca de 160 milhões de crianças em situação de trabalho infantil no mundo — muitas em condições perigosas, como minas, fábricas ou campos agrícolas. Em Portugal, a idade mínima para trabalhar é 16 anos. As crianças têm direito a ser crianças!"
    },
    {
      title: "🗣️ O Direito à Liberdade de Expressão",
      text: "O artigo 13.º da Convenção garante que as crianças têm o direito de procurar, receber e partilhar informação e ideias — através de palavras, arte, escrita ou qualquer outro meio. Este direito inclui a liberdade de pensar de forma diferente e de partilhar essas ideias. É a base da criatividade, do pensamento crítico e da participação democrática. A tua voz importa!"
    },
    {
      title: "🔒 O Direito à Privacidade",
      text: "O artigo 16.º da Convenção protege a vida privada, a família, o domicílio e a correspondência das crianças. Na era digital, este direito é mais importante do que nunca: as tuas mensagens, fotos e dados pessoais merecem proteção. Em Portugal, o RGPD dá proteção especial aos dados de crianças menores de 13 anos. Cuida da tua privacidade online — e pede ajuda a um adulto se algo te preocupar!"
    },
    {
      title: "🌍 O Direito à Cultura e à Língua",
      text: "O artigo 30.º da Convenção garante que as crianças de minorias étnicas, religiosas ou linguísticas têm o direito de viver segundo a sua cultura, praticar a sua religião e usar a sua língua. No mundo existem cerca de 7 000 línguas vivas — cada uma é um tesouro único da humanidade! Em Portugal, o Mirandês é a única língua regional reconhecida oficialmente. A diversidade cultural enriquece a todos!"
    },
    {
      title: "♿ O Direito à Inclusão",
      text: "O artigo 23.º da Convenção garante que as crianças com deficiência têm direito a uma vida plena e digna, com acesso à educação, à saúde e à participação social. A educação inclusiva — em que todas as crianças aprendem juntas — é um direito e um benefício para todos. As tecnologias de apoio, como software de leitura de ecrã e comunicadores, ajudam as crianças com deficiência a participar plenamente. Cada criança tem o seu talento único!"
    },
    {
      title: "🌱 O Direito a um Ambiente Saudável",
      text: "As crianças têm direito a crescer num ambiente limpo e saudável. As alterações climáticas ameaçam este direito: mais de 1 bilião de crianças vive em zonas de risco climático extremo. Os ODS 13 (Ação Climática), 14 (Vida Marinha) e 15 (Vida Terrestre) protegem o futuro das crianças. Jovens como Greta Thunberg mostraram que a voz das crianças pode mudar o mundo. O planeta precisa de ti!"
    },
    {
      title: "💻 Os Direitos Digitais das Crianças",
      text: "Em 2021, as Nações Unidas confirmaram que todos os direitos da Convenção se aplicam também ao mundo online. Isto inclui o direito à privacidade, à proteção contra o ciberbullying, à educação digital e à expressão livre. A idade mínima para a maioria das redes sociais é 13 anos. Em Portugal, a Linha Internet Segura (1800 21 22 23) apoia crianças com problemas online. Sê um cidadão digital responsável!"
    }
  ];

  let pausedByTeacher = false;

  function showHistory(levelIndex, onDone) {
    const entry = HISTORY[levelIndex] || null;
    if (!entry) { onDone?.(); return; }
    awaitingStory = true;
    historyText.innerHTML = `<strong class="history-title">${entry.title}</strong>\n${entry.text}`;
    historyOverlay.classList.remove("hidden");
    if (sceneRef) sceneRef.physics.pause();
    btnHistory.onclick = () => {
      historyOverlay.classList.add("hidden");
      awaitingStory = false;
      if (sceneRef && !pausedByTeacher && !awaitingQuiz && startOverlay.classList.contains("hidden"))
        sceneRef.physics.resume();
      onDone?.();
    };
  }

  // ===== Dicas =====
  const QUIZ_TIPS = {
    historia:     "O Dia da Criança celebra-se a 1 de junho. A Convenção dos Direitos da Criança foi aprovada em 1989.",
    declaracao:   "A Declaração dos Direitos da Criança foi aprovada pelas Nações Unidas em 1959, com 10 princípios.",
    convencao:    "A Convenção sobre os Direitos da Criança de 1989 tem 54 artigos e foi ratificada por quase todos os países.",
    brincar:      "O artigo 31.º da Convenção garante o direito ao brincar, ao descanso e ao lazer.",
    educacao:     "O artigo 28.º garante o direito à educação. Em Portugal é obrigatória até aos 18 anos.",
    saude:        "O artigo 24.º garante o direito à saúde. A UNICEF distribui vacinas e cuidados básicos no mundo.",
    protecao:     "Os artigos 19.º e 37.º protegem as crianças contra violência e exploração. SOS Criança: 116 111.",
    participacao: "O artigo 12.º garante às crianças o direito de serem ouvidas nas decisões que as afetam.",
    futuro:       "Os 17 ODS das Nações Unidas, aprovados em 2015, incluem metas para acabar com a pobreza e garantir educação.",
    unicef:       "A UNICEF foi criada em 1946 e trabalha em mais de 190 países para defender os direitos das crianças.",
    identidade:   "O artigo 7.º garante o direito a um nome e a uma nacionalidade desde o nascimento.",
    familia:      "O artigo 9.º garante que a criança não seja separada dos pais, exceto em situações de proteção.",
    refugiados:   "O artigo 22.º protege as crianças refugiadas com os mesmos direitos das outras crianças.",
    trabalho:     "O artigo 32.º proíbe o trabalho infantil perigoso e prejudicial ao desenvolvimento da criança.",
    expressao:    "O artigo 13.º garante a liberdade de expressão — as crianças podem procurar e partilhar informação.",
    privacidade:  "O artigo 16.º protege a privacidade das crianças — a sua vida pessoal e correspondência.",
    cultura:      "O artigo 30.º garante às crianças de minorias o direito à sua língua, cultura e religião.",
    deficiencia:  "O artigo 23.º garante que as crianças com deficiência têm direito a apoio especial e plena inclusão.",
    ambiente:     "As crianças têm direito a crescer num ambiente saudável — base dos ODS 13, 14 e 15.",
    digital:      "Os direitos digitais das crianças aplicam os artigos da Convenção ao mundo online e às redes sociais."
  };

  // ===== Perguntas — 3 opções, 1 certa + explicação =====
  const QUIZ_BY_THEME = {
    historia: [
      { q:"Em que data se celebra o Dia da Criança em Portugal?", a:[{t:"1 de junho",ok:true},{t:"1 de maio",ok:false},{t:"20 de novembro",ok:false}], exp:"O Dia Internacional da Criança celebra-se a 1 de junho. Esta data foi escolhida em 1950. O 20 de novembro é o Dia Universal da Criança, data em que foi aprovada a Convenção dos Direitos da Criança." },
      { q:"Quem escolheu o 1 de junho como Dia da Criança, em 1949?", a:[{t:"A Federação Democrática Internacional das Mulheres",ok:true},{t:"As Nações Unidas",ok:false},{t:"A UNICEF",ok:false}], exp:"A 4 de novembro de 1949, em Moscovo, a Federação Democrática Internacional das Mulheres estabeleceu o 1 de junho como Dia Internacional de Proteção das Crianças. A data começou a ser celebrada a partir de 1950." },
      { q:"Qual é o objetivo do Dia da Criança?", a:[{t:"Celebrar e defender os direitos e o bem-estar das crianças",ok:true},{t:"Assinalar o fim do ano letivo",ok:false},{t:"Comemorar o início do verão",ok:false}], exp:"O Dia da Criança serve para lembrar que todas as crianças têm direitos — à educação, à saúde, ao brincar e à proteção — e que é responsabilidade de todos garantir esses direitos." },
      { q:"Em que ano surgiu o primeiro Dia da Criança?", a:[{t:"1950",ok:true},{t:"1989",ok:false},{t:"1945",ok:false}], exp:"O Dia Internacional da Criança surgiu em 1950, cinco anos após o fim da Segunda Guerra Mundial, num período em que o mundo tentava reconstruir-se e proteger as gerações mais novas." },
      { q:"Em Portugal, o Dia da Criança é celebrado com que tipo de atividades?", a:[{t:"Festas, prendas e atividades especiais nas escolas",ok:true},{t:"Apenas com um feriado nacional",ok:false},{t:"Com uma cerimónia oficial no Parlamento",ok:false}], exp:"Em Portugal, o 1 de junho é celebrado com grande alegria: festas nas escolas, prendas, atividades ao ar livre e ações de sensibilização para os direitos das crianças." }
    ],
    declaracao: [
      { q:"Em que ano foi aprovada a Declaração dos Direitos da Criança?", a:[{t:"1959",ok:true},{t:"1989",ok:false},{t:"1950",ok:false}], exp:"A Declaração dos Direitos da Criança foi aprovada pela Assembleia Geral das Nações Unidas a 20 de novembro de 1959. Trinta anos depois, em 1989, surgiu a Convenção — com força legal obrigatória." },
      { q:"Quantos princípios tinha a Declaração dos Direitos da Criança de 1959?", a:[{t:"10 princípios",ok:true},{t:"54 artigos",ok:false},{t:"7 capítulos",ok:false}], exp:"A Declaração de 1959 tinha 10 princípios fundamentais. Não era juridicamente vinculativa — era uma declaração de intenções. Foi a primeira vez que a comunidade internacional dedicou um documento exclusivamente aos direitos das crianças." },
      { q:"O que reconhecia a Declaração dos Direitos da Criança de 1959?", a:[{t:"Que todas as crianças têm direito à proteção, educação, nome e nacionalidade",ok:true},{t:"Que as crianças devem trabalhar para ajudar as famílias",ok:false},{t:"Que só as crianças de países ricos têm direito à educação",ok:false}], exp:"A Declaração afirmava que todas as crianças, sem discriminação, têm direito à proteção especial, a um nome, a uma nacionalidade, a cuidados de saúde e à educação gratuita." },
      { q:"Qual foi a importância histórica da Declaração de 1959?", a:[{t:"Foi o primeiro documento da ONU dedicado exclusivamente aos direitos das crianças",ok:true},{t:"Foi a primeira lei obrigatória sobre crianças do mundo",ok:false},{t:"Criou a UNICEF",ok:false}], exp:"Antes de 1959, já existia a Declaração de Genebra de 1924 (Liga das Nações), mas a Declaração de 1959 foi o primeiro documento aprovado pelas Nações Unidas exclusivamente sobre direitos da criança, com 10 princípios. Abriu caminho para a Convenção de 1989, com força legal obrigatória." }
    ],
    convencao: [
      { q:"Em que data foi aprovada a Convenção sobre os Direitos da Criança?", a:[{t:"20 de novembro de 1989",ok:true},{t:"1 de junho de 1989",ok:false},{t:"20 de novembro de 1959",ok:false}], exp:"A Convenção foi aprovada pela Assembleia Geral da ONU a 20 de novembro de 1989. Por isso, o 20 de novembro é celebrado como o Dia Universal da Criança em todo o mundo." },
      { q:"Em que ano Portugal ratificou a Convenção dos Direitos da Criança?", a:[{t:"1990",ok:true},{t:"1989",ok:false},{t:"1995",ok:false}], exp:"Portugal ratificou a Convenção a 21 de setembro de 1990, apenas alguns meses após a sua aprovação pelas Nações Unidas — um dos primeiros países a fazê-lo." },
      { q:"Quantos artigos tem a Convenção dos Direitos da Criança?", a:[{t:"54 artigos",ok:true},{t:"10 artigos",ok:false},{t:"100 artigos",ok:false}], exp:"A Convenção tem 54 artigos organizados em torno de 4 pilares: sobrevivência, desenvolvimento, proteção e participação. É o tratado de direitos humanos mais ratificado da história." },
      { q:"Quais são os 4 pilares principais da Convenção dos Direitos da Criança?", a:[{t:"Sobrevivência, desenvolvimento, proteção e participação",ok:true},{t:"Educação, saúde, habitação e alimentação",ok:false},{t:"Paz, liberdade, igualdade e fraternidade",ok:false}], exp:"A Convenção organiza-se em torno de 4 princípios fundamentais: o direito à sobrevivência, ao desenvolvimento pleno, à proteção contra abusos e à participação na vida familiar e social." },
      { q:"A Convenção dos Direitos da Criança é o tratado de direitos humanos com mais países a assiná-lo?", a:[{t:"Sim, quase todos os países do mundo a ratificaram",ok:true},{t:"Não, a Declaração Universal dos Direitos Humanos tem mais assinaturas",ok:false},{t:"Não, apenas metade dos países a assinou",ok:false}], exp:"Com 196 países signatários, a Convenção dos Direitos da Criança é o tratado de direitos humanos mais ratificado da história das Nações Unidas." }
    ],
    brincar: [
      { q:"Qual é o artigo da Convenção que garante o direito ao brincar?", a:[{t:"Artigo 31.º",ok:true},{t:"Artigo 24.º",ok:false},{t:"Artigo 12.º",ok:false}], exp:"O artigo 31.º garante o direito de todas as crianças ao descanso, ao lazer, ao brincar e às atividades recreativas adequadas à sua idade." },
      { q:"Por que é que brincar é considerado um direito e não apenas diversão?", a:[{t:"Porque é essencial para o desenvolvimento do cérebro e das competências sociais",ok:true},{t:"Porque as crianças ficam mais calmas",ok:false},{t:"Porque é obrigatório por lei brincar todos os dias",ok:false}], exp:"Brincar é fundamental para o desenvolvimento cognitivo, emocional e social das crianças. Através do jogo, aprendem a comunicar, a resolver problemas, a colaborar e a lidar com as emoções." },
      { q:"O que mostram os estudos sobre crianças que brincam livremente?", a:[{t:"São mais criativas, resilientes e têm melhor saúde mental",ok:true},{t:"Têm piores resultados académicos",ok:false},{t:"São mais difíceis de controlar na escola",ok:false}], exp:"A investigação científica mostra claramente que o brincar livre — sem instruções de adultos — desenvolve a criatividade, a autonomia e a capacidade de gerir emoções e conflitos." },
      { q:"O que mais inclui o direito ao brincar, além do jogo?", a:[{t:"Descanso, lazer e atividades recreativas e culturais",ok:true},{t:"Apenas jogar videojogos",ok:false},{t:"Só atividades desportivas organizadas",ok:false}], exp:"O artigo 31.º é abrangente: inclui o direito ao repouso, às férias escolares, à participação em atividades artísticas e culturais, e ao acesso a espaços de recreio seguros." }
    ],
    educacao: [
      { q:"Qual é o artigo da Convenção que garante o direito à educação?", a:[{t:"Artigo 28.º",ok:true},{t:"Artigo 31.º",ok:false},{t:"Artigo 19.º",ok:false}], exp:"O artigo 28.º da Convenção garante o direito de todas as crianças à educação. O ensino primário deve ser obrigatório e gratuito, e os países devem promover o acesso ao ensino secundário e superior." },
      { q:"Até que idade é o ensino obrigatório em Portugal?", a:[{t:"Até aos 18 anos",ok:true},{t:"Até aos 15 anos",ok:false},{t:"Até aos 12 anos",ok:false}], exp:"Em Portugal, desde 2009, a escolaridade obrigatória foi alargada para 12 anos, o que significa que todas as crianças são obrigadas a estudar até completarem o ensino secundário ou 18 anos." },
      { q:"Quantas crianças ainda estão fora da escola em todo o mundo?", a:[{t:"244 milhões de crianças",ok:true},{t:"10 milhões de crianças",ok:false},{t:"50 milhões de crianças",ok:false}], exp:"Segundo dados da UNICEF, 244 milhões de crianças em idade escolar não frequentam a escola. As principais causas são a pobreza, os conflitos armados, a discriminação e a distância das escolas." },
      { q:"O que faz a UNICEF em relação ao direito à educação?", a:[{t:"Trabalha para garantir que todas as crianças do mundo possam estudar",ok:true},{t:"Constrói escolas apenas na Europa",ok:false},{t:"Distribui apenas livros escolares",ok:false}], exp:"A UNICEF trabalha em todo o mundo para garantir acesso à educação, especialmente em zonas de conflito e países em desenvolvimento. Financia escolas, forma professores e apoia programas de inclusão." }
    ],
    saude: [
      { q:"Qual é o artigo da Convenção que garante o direito à saúde?", a:[{t:"Artigo 24.º",ok:true},{t:"Artigo 31.º",ok:false},{t:"Artigo 28.º",ok:false}], exp:"O artigo 24.º garante que todas as crianças têm direito ao mais alto nível possível de saúde e a serviços médicos. Os países devem combater a mortalidade infantil e garantir cuidados de saúde básicos." },
      { q:"A que serviços de saúde têm acesso as crianças em Portugal?", a:[{t:"Serviço Nacional de Saúde, vacinas e médico de família",ok:true},{t:"Apenas a urgências hospitalares",ok:false},{t:"Só as que têm seguro de saúde privado",ok:false}], exp:"Em Portugal, todas as crianças têm acesso gratuito ao SNS, ao Plano Nacional de Vacinação (que previne doenças como o sarampo e a poliomielite) e a um médico de família no centro de saúde." },
      { q:"O que distribui a UNICEF para ajudar a saúde das crianças no mundo?", a:[{t:"Vacinas, alimentos terapêuticos e água potável",ok:true},{t:"Apenas medicamentos caros",ok:false},{t:"Só equipamento hospitalar sofisticado",ok:false}], exp:"A UNICEF fornece vacinas a metade das crianças do mundo. Também distribui alimentos terapêuticos para crianças com desnutrição severa e apoia sistemas de abastecimento de água potável." },
      { q:"O que é o Plano Nacional de Vacinação (PNV) em Portugal?", a:[{t:"Um programa gratuito de vacinação para todas as crianças portuguesas",ok:true},{t:"Um plano pago apenas para famílias ricas",ok:false},{t:"Um programa só para adultos",ok:false}], exp:"O PNV é gratuito e universal — cobre todas as crianças portuguesas. Previne doenças graves como a tosse convulsa, o sarampo, a hepatite B e a meningite." }
    ],
    protecao: [
      { q:"Quais são os artigos da Convenção que protegem as crianças contra violência e abuso?", a:[{t:"Artigos 19.º e 37.º",ok:true},{t:"Artigos 24.º e 28.º",ok:false},{t:"Artigos 12.º e 31.º",ok:false}], exp:"O artigo 19.º protege as crianças contra todas as formas de violência física e psicológica. O artigo 37.º proíbe a tortura, os tratamentos degradantes e a privação ilegal de liberdade." },
      { q:"Qual é o número da linha de apoio SOS Criança em Portugal?", a:[{t:"116 111",ok:true},{t:"112",ok:false},{t:"800 202 202",ok:false}], exp:"O 116 111 é a linha dedicada às crianças e jovens em perigo em Portugal. Funciona 24 horas por dia, é gratuita e confidencial. Qualquer pessoa pode ligar se souber de uma criança em risco." },
      { q:"O que é a CPCJ?", a:[{t:"Comissão de Proteção de Crianças e Jovens",ok:true},{t:"Centro de Promoção Cultural Juvenil",ok:false},{t:"Comité Português da UNICEF",ok:false}], exp:"A CPCJ é uma instituição oficial portuguesa que intervém para proteger crianças e jovens em risco ou perigo. Existem comissões em todo o país, que trabalham com famílias, escolas e serviços sociais." },
      { q:"O que proibem os artigos de proteção da Convenção dos Direitos da Criança?", a:[{t:"Toda a forma de violência, trabalho perigoso e privação de liberdade",ok:true},{t:"Apenas a violência física",ok:false},{t:"Só o trabalho infantil em fábricas",ok:false}], exp:"A Convenção proíbe todas as formas de maus-tratos (físicos, psicológicos, sexuais), o trabalho infantil perigoso, o tráfico de crianças e qualquer privação ilegal da liberdade." }
    ],
    participacao: [
      { q:"Qual é o artigo da Convenção que garante às crianças o direito a ser ouvidas?", a:[{t:"Artigo 12.º",ok:true},{t:"Artigo 24.º",ok:false},{t:"Artigo 37.º",ok:false}], exp:"O artigo 12.º afirma que as crianças têm o direito de expressar livremente a sua opinião em todas as questões que as afetam. A sua opinião deve ser considerada, tendo em conta a sua idade e maturidade." },
      { q:"Em que espaços podem as crianças em Portugal exercer o direito à participação?", a:[{t:"Nos parlamentos jovens e conselhos municipais de jovens",ok:true},{t:"Apenas no conselho de turma",ok:false},{t:"Só depois dos 18 anos",ok:false}], exp:"Em Portugal, existem parlamentos jovens (assembleias de jovens a nível nacional e regional) e conselhos municipais de jovens, onde crianças e adolescentes podem debater e apresentar propostas." },
      { q:"O direito à participação aplica-se em que contextos?", a:[{t:"Nas escolas, nas famílias e nos governos",ok:true},{t:"Apenas em assembleias internacionais",ok:false},{t:"Só em atividades extracurriculares",ok:false}], exp:"O direito à participação aplica-se em todos os contextos onde se tomam decisões que afetam as crianças: em casa, na escola, nos tribunais, nos serviços sociais e a nível local e nacional." },
      { q:"Por que é importante ouvir a opinião das crianças?", a:[{t:"Porque as decisões que as afetam ficam mais justas e adequadas",ok:true},{t:"Porque as crianças sabem sempre melhor que os adultos",ok:false},{t:"Porque é obrigatório por lei que sejam elas a decidir tudo",ok:false}], exp:"Ouvir as crianças não significa que elas decidem tudo — significa que a sua perspetiva é considerada. Assim, as decisões são mais informadas, mais justas e mais adaptadas às necessidades reais das crianças." }
    ],
    futuro: [
      { q:"Quantos Objetivos de Desenvolvimento Sustentável (ODS) existem?", a:[{t:"17 objetivos",ok:true},{t:"10 objetivos",ok:false},{t:"27 objetivos",ok:false}], exp:"Em setembro de 2015, os 193 países membros da ONU aprovaram a Agenda 2030 com 17 ODS. Estes objetivos visam erradicar a pobreza, proteger o planeta e garantir prosperidade para todos até 2030." },
      { q:"Em que ano foram aprovados os Objetivos de Desenvolvimento Sustentável?", a:[{t:"2015",ok:true},{t:"2000",ok:false},{t:"2020",ok:false}], exp:"Os 17 ODS foram aprovados na Cimeira das Nações Unidas de setembro de 2015. São para ser atingidos até 2030 e envolvem governos, empresas, organizações e cidadãos de todo o mundo." },
      { q:"Qual ODS se refere diretamente à educação de qualidade?", a:[{t:"ODS 4 — Educação de Qualidade",ok:true},{t:"ODS 1 — Erradicar a Pobreza",ok:false},{t:"ODS 3 — Saúde de Qualidade",ok:false}], exp:"O ODS 4 estabelece o objetivo de garantir educação inclusiva, equitativa e de qualidade para todos até 2030, incluindo o acesso ao ensino pré-escolar e a aprendizagem ao longo da vida." },
      { q:"Por que são as crianças de hoje importantes para o futuro sustentável?", a:[{t:"Porque serão os agentes de mudança que implementarão soluções para os problemas globais",ok:true},{t:"Porque os adultos já não conseguem resolver os problemas do planeta",ok:false},{t:"Porque só as crianças votam nos ODS",ok:false}], exp:"As crianças de hoje crescerão num mundo em transformação e serão os líderes, cientistas, professores e cidadãos que implementarão soluções para as alterações climáticas, a pobreza e a desigualdade." }
    ],
    unicef: [
      { q:"Em que ano foi criada a UNICEF?", a:[{t:"1946",ok:true},{t:"1959",ok:false},{t:"1989",ok:false}], exp:"A UNICEF foi criada a 11 de dezembro de 1946, pela Assembleia Geral das Nações Unidas, para ajudar as crianças afetadas pela Segunda Guerra Mundial. 'UNICEF' vem de 'United Nations International Children's Emergency Fund'." },
      { q:"Em quantos países trabalha a UNICEF?", a:[{t:"Mais de 190 países e territórios",ok:true},{t:"Apenas 50 países",ok:false},{t:"Só nos países mais ricos",ok:false}], exp:"A UNICEF está presente em mais de 190 países e territórios — ou seja, praticamente em todo o mundo. A sua presença é especialmente importante em zonas de conflito e em países com muita pobreza." },
      { q:"O que significa a sigla UNICEF?", a:[{t:"Fundo Internacional de Emergência das Nações Unidas para as Crianças",ok:true},{t:"União Internacional de Crianças e Famílias",ok:false},{t:"Unidade Nacional de Cuidados de Emergência para a Família",ok:false}], exp:"UNICEF vem do inglês 'United Nations International Children's Emergency Fund'. Foi criada como fundo de emergência e hoje é a principal organização mundial dedicada aos direitos e ao bem-estar das crianças." },
      { q:"O que faz o Comité Português da UNICEF?", a:[{t:"Sensibiliza para os direitos das crianças e angaria fundos para programas no mundo",ok:true},{t:"Gere hospitais pediátricos em Portugal",ok:false},{t:"Substitui o Estado na proteção das crianças portuguesas",ok:false}], exp:"O Comité Português da UNICEF é uma organização não governamental que trabalha em Portugal para consciencializar a sociedade sobre os direitos das crianças e para angariar donativos que financiam programas da UNICEF em todo o mundo." }
    ],
    identidade: [
      { q:"Qual é o artigo da Convenção que garante o direito a um nome e a uma nacionalidade?", a:[{t:"Artigo 7.º",ok:true},{t:"Artigo 12.º",ok:false},{t:"Artigo 24.º",ok:false}], exp:"O artigo 7.º estipula que toda a criança tem direito a ser registada logo após o nascimento, a ter um nome e a adquirir uma nacionalidade. O registo de nascimento é o primeiro passo para garantir todos os outros direitos." },
      { q:"O que é o registo de nascimento e por que é importante?", a:[{t:"É o documento que prova a existência legal da criança e garante os seus direitos",ok:true},{t:"É apenas uma formalidade sem consequências práticas",ok:false},{t:"Só é obrigatório nos países ricos",ok:false}], exp:"Sem registo de nascimento, uma criança não existe legalmente. Não pode ir à escola, aceder a cuidados de saúde ou ter passaporte. A UNICEF estima que 237 milhões de crianças no mundo não estão registadas." },
      { q:"Qual artigo protege a identidade da criança (nome, nacionalidade e relações familiares)?", a:[{t:"Artigo 8.º",ok:true},{t:"Artigo 3.º",ok:false},{t:"Artigo 19.º",ok:false}], exp:"O artigo 8.º obriga os Estados a respeitar e preservar a identidade da criança — o seu nome, nacionalidade e vínculos familiares — e a ajudá-la a recuperar esses elementos se forem ilegalmente retirados." },
      { q:"Quantas crianças no mundo nascem sem registo?", a:[{t:"Cerca de 237 milhões",ok:true},{t:"Menos de 1 milhão",ok:false},{t:"Cerca de 50 milhões",ok:false}], exp:"Segundo a UNICEF, cerca de 237 milhões de crianças menores de 5 anos não têm registo de nascimento, sobretudo na África Subsariana e na Ásia do Sul. Sem registo, ficam invisíveis para o Estado e sem acesso aos seus direitos." }
    ],
    familia: [
      { q:"Qual é o artigo da Convenção que garante que a criança não seja separada dos pais?", a:[{t:"Artigo 9.º",ok:true},{t:"Artigo 7.º",ok:false},{t:"Artigo 31.º",ok:false}], exp:"O artigo 9.º estabelece que a criança não deve ser separada dos pais contra a sua vontade, exceto quando essa separação for necessária para o seu bem-estar — por exemplo, em casos de abuso ou negligência graves." },
      { q:"O que garante o artigo 10.º da Convenção?", a:[{t:"O direito à reunificação familiar quando pais e filhos vivem em países diferentes",ok:true},{t:"O direito a ter sempre dois pais",ok:false},{t:"O direito a escolher com qual dos pais viver",ok:false}], exp:"O artigo 10.º garante que os pedidos de reunificação familiar — quando a criança e os seus pais vivem em países diferentes — sejam tratados de forma positiva, rápida e com humanidade pelos governos." },
      { q:"O que diz o artigo 18.º sobre o papel dos pais?", a:[{t:"Os pais têm responsabilidade conjunta pela criação e desenvolvimento da criança",ok:true},{t:"Só o pai é responsável pela criança",ok:false},{t:"O Estado é o principal responsável pela criação das crianças",ok:false}], exp:"O artigo 18.º reconhece que ambos os pais têm responsabilidades comuns na criação da criança. O Estado deve apoiar os pais nessa tarefa, por exemplo através de serviços de apoio à família e creches." },
      { q:"O que acontece quando a criança não pode viver com a sua família?", a:[{t:"O Estado deve garantir cuidados alternativos adequados, como famílias de acolhimento",ok:true},{t:"A criança fica automaticamente a cargo do Estado sem alternativas",ok:false},{t:"A criança perde os seus direitos enquanto não tiver família",ok:false}], exp:"O artigo 20.º garante que as crianças privadas do ambiente familiar têm direito a proteção e cuidados especiais. As alternativas incluem famílias de acolhimento, kafala (adoção islâmica) ou, em último recurso, instituições adequadas." }
    ],
    refugiados: [
      { q:"Qual artigo da Convenção protege especificamente as crianças refugiadas?", a:[{t:"Artigo 22.º",ok:true},{t:"Artigo 9.º",ok:false},{t:"Artigo 37.º",ok:false}], exp:"O artigo 22.º estabelece que as crianças que peçam o estatuto de refugiada ou sejam reconhecidas como tal têm direito a proteção especial e ao apoio dos Estados. Têm os mesmos direitos que todas as outras crianças." },
      { q:"Quantas crianças estão deslocadas no mundo devido a conflitos e perseguições?", a:[{t:"Mais de 43 milhões",ok:true},{t:"Menos de 1 milhão",ok:false},{t:"Cerca de 5 milhões",ok:false}], exp:"Segundo dados recentes da UNICEF e ACNUR, mais de 43 milhões de crianças estão deslocadas em todo o mundo — fugindo de guerras, violência, perseguição ou catástrofes naturais. É a maior crise de deslocamento desde a Segunda Guerra Mundial." },
      { q:"O que é o ACNUR?", a:[{t:"A agência das Nações Unidas para os refugiados",ok:true},{t:"Uma organização de países europeus para controlo de fronteiras",ok:false},{t:"Um programa de apoio alimentar da ONU",ok:false}], exp:"O ACNUR (Alto Comissariado das Nações Unidas para os Refugiados) é a agência da ONU responsável por proteger refugiados, apátridas e pessoas deslocadas. Trabalha em mais de 130 países e em parceria com a UNICEF para proteger crianças." },
      { q:"Uma criança refugiada tem os mesmos direitos que as outras crianças?", a:[{t:"Sim, a Convenção aplica-se a todas as crianças sem discriminação",ok:true},{t:"Não, os refugiados têm direitos reduzidos",ok:false},{t:"Só se tiverem documentos de identidade válidos",ok:false}], exp:"O artigo 2.º da Convenção afirma que todos os direitos se aplicam a todas as crianças, sem qualquer discriminação. Ser refugiado, apátrida ou migrante não reduz os direitos de uma criança — pelo contrário, justifica proteção adicional." }
    ],
    trabalho: [
      { q:"Qual é o artigo da Convenção que proíbe o trabalho infantil perigoso?", a:[{t:"Artigo 32.º",ok:true},{t:"Artigo 28.º",ok:false},{t:"Artigo 19.º",ok:false}], exp:"O artigo 32.º protege as crianças contra a exploração económica e contra qualquer trabalho perigoso, que prejudique a sua saúde ou interfira com a sua educação. Os Estados devem fixar idades mínimas de trabalho." },
      { q:"Quantas crianças trabalham em condições de exploração no mundo?", a:[{t:"Cerca de 160 milhões",ok:true},{t:"Menos de 10 milhões",ok:false},{t:"Cerca de 500 milhões",ok:false}], exp:"Segundo a OIT (Organização Internacional do Trabalho), cerca de 160 milhões de crianças estão em situação de trabalho infantil — quase metade em formas perigosas. A maioria está na África Subsariana e na Ásia." },
      { q:"Qual é a idade mínima geral para trabalhar em Portugal?", a:[{t:"16 anos",ok:true},{t:"14 anos",ok:false},{t:"18 anos",ok:false}], exp:"Em Portugal, a idade mínima geral para trabalhar é 16 anos. Menores de 16 anos só podem trabalhar em situações muito específicas (como participar em espetáculos culturais) e com autorização dos pais e autoridades." },
      { q:"O que distingue o trabalho infantil perigoso de uma pequena ajuda em casa?", a:[{t:"O trabalho perigoso prejudica a saúde, a educação e o desenvolvimento da criança",ok:true},{t:"Qualquer trabalho feito por uma criança é automaticamente exploração",ok:false},{t:"Só é ilegal se a criança não receber salário",ok:false}], exp:"A OIT distingue entre trabalho aceitável (pequenas tarefas que não prejudicam o desenvolvimento) e trabalho infantil (que priva a criança da infância, interfere com a escola ou é perigoso para a saúde). O contexto e o impacto são decisivos." }
    ],
    expressao: [
      { q:"Qual é o artigo da Convenção que garante a liberdade de expressão?", a:[{t:"Artigo 13.º",ok:true},{t:"Artigo 12.º",ok:false},{t:"Artigo 17.º",ok:false}], exp:"O artigo 13.º garante às crianças o direito de procurar, receber e transmitir informações e ideias — oralmente, por escrito, através da arte ou de qualquer outro meio — desde que não prejudiquem os outros." },
      { q:"O artigo 17.º da Convenção trata de que direito?", a:[{t:"O acesso a informação e meios de comunicação adequados",ok:true},{t:"O direito a ter um telemóvel",ok:false},{t:"O direito a publicar um jornal escolar",ok:false}], exp:"O artigo 17.º reconhece o papel importante dos meios de comunicação e encoraja os Estados a garantir que as crianças tenham acesso a informação de fontes diversas, especialmente material que promova o seu bem-estar social, espiritual e moral." },
      { q:"O direito à liberdade de expressão tem limites?", a:[{t:"Sim, não pode ser usado para prejudicar os direitos e a reputação dos outros",ok:true},{t:"Não, é um direito absoluto sem qualquer restrição",ok:false},{t:"Sim, as crianças só podem expressar-se com autorização dos pais",ok:false}], exp:"O artigo 13.º reconhece que a liberdade de expressão pode ser limitada para respeitar os direitos dos outros ou para proteger a segurança nacional, a ordem pública, a saúde ou a moral. Direitos com responsabilidades." },
      { q:"O que é o bullying e como se relaciona com os direitos das crianças?", a:[{t:"É uma violação dos direitos da criança — prejudica a dignidade, a saúde e a educação",ok:true},{t:"É um problema menor que as crianças devem resolver sozinhas",ok:false},{t:"Só é relevante para os direitos se causar danos físicos",ok:false}], exp:"O bullying — seja físico, verbal ou online (ciberbullying) — viola vários artigos da Convenção: o direito à dignidade (art. 16.º), à proteção (art. 19.º) e à saúde (art. 24.º). As escolas e os Estados têm obrigação de prevenir e combater o bullying." }
    ],
    privacidade: [
      { q:"Qual é o artigo da Convenção que protege a privacidade das crianças?", a:[{t:"Artigo 16.º",ok:true},{t:"Artigo 8.º",ok:false},{t:"Artigo 13.º",ok:false}], exp:"O artigo 16.º garante que nenhuma criança seja sujeita a interferências arbitrárias na sua vida privada, família, domicílio ou correspondência, nem a ataques à sua honra e reputação. As crianças têm direito à proteção da lei contra tais ataques." },
      { q:"O que é o RGPD e como protege as crianças?", a:[{t:"É o regulamento europeu de proteção de dados, que dá proteção especial aos dados de crianças",ok:true},{t:"É uma lei apenas para adultos",ok:false},{t:"É um sistema de controlo parental obrigatório",ok:false}], exp:"O Regulamento Geral de Proteção de Dados (RGPD) da União Europeia, em vigor desde 2018, dá proteção especial aos dados pessoais das crianças. Em Portugal, o consentimento para usar dados de menores de 13 anos deve ser dado pelos pais." },
      { q:"As fotografias de crianças partilhadas sem autorização nas redes sociais violam algum direito?", a:[{t:"Sim, violam o direito à privacidade e à imagem da criança",ok:true},{t:"Não, qualquer pessoa pode partilhar fotos de crianças livremente",ok:false},{t:"Só é ilegal se a foto for em ambiente escolar",ok:false}], exp:"Partilhar fotos de crianças sem consentimento — mesmo de familiares — pode violar o direito à privacidade (art. 16.º) e à proteção da imagem. Em Portugal, a publicação de imagens de menores sem autorização pode ser ilegal, especialmente em contextos que os identifiquem." },
      { q:"O que devem as crianças fazer se sentirem que a sua privacidade está a ser violada online?", a:[{t:"Falar com um adulto de confiança e denunciar às plataformas ou autoridades",ok:true},{t:"Ignorar porque a internet não tem regras",ok:false},{t:"Responder ao agressor diretamente",ok:false}], exp:"As crianças devem falar com um adulto de confiança (pais, professor, psicólogo) e denunciar às plataformas digitais. Em Portugal, a Linha Internet Segura (1800 21 22 23) apoia crianças vítimas de violações de privacidade e outros problemas online." }
    ],
    cultura: [
      { q:"Qual artigo garante às crianças de minorias o direito à sua língua e cultura?", a:[{t:"Artigo 30.º",ok:true},{t:"Artigo 17.º",ok:false},{t:"Artigo 28.º",ok:false}], exp:"O artigo 30.º estabelece que as crianças pertencentes a minorias étnicas, religiosas ou linguísticas não podem ser privadas do direito de ter a sua própria vida cultural, de professar e praticar a sua religião ou de usar a sua língua." },
      { q:"O que é a diversidade cultural e por que é importante respeitar?", a:[{t:"É a variedade de culturas, línguas e tradições no mundo — enriquece a humanidade",ok:true},{t:"É um problema que dificulta a convivência entre povos",ok:false},{t:"Só é relevante fora de Portugal",ok:false}], exp:"A diversidade cultural é uma riqueza da humanidade. A UNESCO defende que todas as culturas têm o mesmo valor e merecem proteção. Em Portugal, vivem pessoas de mais de 180 nacionalidades, tornando o país culturalmente muito diverso." },
      { q:"Quantas línguas são faladas no mundo atualmente?", a:[{t:"Cerca de 7 000 línguas",ok:true},{t:"Cerca de 200 línguas",ok:false},{t:"Cerca de 1 000 línguas",ok:false}], exp:"Estima-se que existam cerca de 7 000 línguas vivas no mundo. Muitas estão em risco de extinção — quando uma língua morre, perde-se também uma forma única de ver e descrever o mundo. Preservar as línguas minoritárias é proteger a diversidade cultural." },
      { q:"Em Portugal, que língua além do Português tem estatuto oficial de língua regional?", a:[{t:"O Mirandês, falado em Miranda do Douro",ok:true},{t:"O Galego, falado no Norte",ok:false},{t:"O Crioulo, falado em Lisboa",ok:false}], exp:"O Mirandês é a única língua regional com reconhecimento oficial em Portugal, falada em Miranda do Douro e arredores. Tem raízes na antiga língua asturo-leonesa e é património linguístico único. A sua proteção é um exemplo do artigo 30.º em ação." }
    ],
    deficiencia: [
      { q:"Qual artigo da Convenção protege as crianças com deficiência?", a:[{t:"Artigo 23.º",ok:true},{t:"Artigo 24.º",ok:false},{t:"Artigo 28.º",ok:false}], exp:"O artigo 23.º reconhece que as crianças com deficiência têm direito a uma vida plena e digna, em condições que garantam a sua participação ativa na sociedade. Os Estados devem assegurar apoio especial e inclusão." },
      { q:"O que é a educação inclusiva?", a:[{t:"Um sistema em que todas as crianças, com ou sem deficiência, aprendem juntas",ok:true},{t:"Um sistema de escolas separadas para crianças com necessidades especiais",ok:false},{t:"Aulas online para crianças com mobilidade reduzida",ok:false}], exp:"A educação inclusiva pressupõe que todas as crianças aprendam juntas, com as adaptações necessárias para cada uma. Portugal tem avançado neste modelo, integrando alunos com necessidades educativas especiais nas escolas regulares com apoio especializado." },
      { q:"Qual a percentagem estimada de crianças no mundo com algum tipo de deficiência?", a:[{t:"Cerca de 15%",ok:true},{t:"Menos de 1%",ok:false},{t:"Mais de 50%",ok:false}], exp:"A OMS estima que cerca de 15% da população mundial vive com alguma forma de deficiência. No caso das crianças, estima-se que entre 93 e 150 milhões enfrentam alguma deficiência. Muitas enfrentam barreiras no acesso à educação, saúde e participação social." },
      { q:"O que são tecnologias de apoio e como ajudam as crianças com deficiência?", a:[{t:"São ferramentas que compensam limitações e aumentam a autonomia e participação",ok:true},{t:"São medicamentos especiais para crianças com deficiência",ok:false},{t:"São apenas cadeiras de rodas e bengalas",ok:false}], exp:"Tecnologias de apoio incluem software de leitura de ecrã, comunicadores alternativos, impressoras Braille, aplicações de comunicação aumentativa e muitas outras ferramentas. Permitem que crianças com deficiências físicas, sensoriais ou cognitivas participem plenamente na escola e na sociedade." }
    ],
    ambiente: [
      { q:"Existe um artigo específico sobre o direito ao ambiente na Convenção de 1989?", a:[{t:"Não diretamente, mas os ODS e comentários gerais reconhecem este direito",ok:true},{t:"Sim, é o artigo 29.º",ok:false},{t:"Sim, foi acrescentado em 2010",ok:false}], exp:"A Convenção de 1989 não tem um artigo específico sobre ambiente, mas o Comité dos Direitos da Criança reconhece nos seus comentários gerais que as alterações climáticas e a degradação ambiental ameaçam todos os direitos das crianças. Os ODS 13, 14 e 15 abordam estes temas." },
      { q:"Como afetam as alterações climáticas os direitos das crianças?", a:[{t:"Ameaçam o direito à saúde, à alimentação, à água e a um futuro seguro",ok:true},{t:"Não afetam significativamente as crianças",ok:false},{t:"Só afetam crianças que vivem em zonas costeiras",ok:false}], exp:"As alterações climáticas afetam desproporcionalmente as crianças: aumentam doenças respiratórias, reduzem o acesso a água potável e alimentos, causam deslocamentos forçados e comprometem o seu direito a um futuro seguro. A UNICEF alerta que 1 bilião de crianças vive em zonas de risco extremo." },
      { q:"O que pode cada criança fazer para ajudar o ambiente?", a:[{t:"Reduzir desperdícios, poupar energia, plantar árvores e sensibilizar outros",ok:true},{t:"Nada — só os governos e empresas podem fazer diferença",ok:false},{t:"Deixar de ir à escola para protestar",ok:false}], exp:"Cada criança pode contribuir: separar o lixo, poupar água e energia, escolher produtos sustentáveis, plantar plantas, comer menos carne e sensibilizar família e amigos. As pequenas ações individuais, multiplicadas por milhões, fazem diferença — e a voz das crianças tem cada vez mais impacto político." }
    ],
    digital: [
      { q:"Os direitos das crianças aplicam-se também ao mundo online?", a:[{t:"Sim, todos os direitos da Convenção se aplicam ao espaço digital",ok:true},{t:"Não, a internet é um espaço sem regras para crianças",ok:false},{t:"Só a partir dos 16 anos os direitos digitais são reconhecidos",ok:false}], exp:"Em 2021, o Comité dos Direitos da Criança das Nações Unidas publicou o Comentário Geral n.º 25, confirmando que todos os direitos da Convenção se aplicam ao ambiente digital. Isto inclui privacidade, proteção, expressão, educação e participação online." },
      { q:"O que é o ciberbullying e como se combate?", a:[{t:"É assédio ou intimidação online — combate-se com educação, denúncia e apoio",ok:true},{t:"É um jogo de computador perigoso",ok:false},{t:"Só acontece em redes sociais e não é muito grave",ok:false}], exp:"O ciberbullying é o assédio, humilhação ou ameaça através de meios digitais — mensagens, redes sociais, jogos online. Pode causar ansiedade, depressão e isolamento. Em Portugal, a Linha Internet Segura (1800 21 22 23) apoia vítimas e é possível denunciar às plataformas e às autoridades." },
      { q:"Que cuidados deve ter uma criança ao usar redes sociais?", a:[{t:"Não partilhar dados pessoais, ter perfil privado e contar a um adulto se algo correr mal",ok:true},{t:"Aceitar todos os pedidos de amizade para ter mais seguidores",ok:false},{t:"Partilhar a localização para que os amigos saibam onde está",ok:false}], exp:"A segurança online começa com boas práticas: perfil privado, não partilhar morada ou escola, não aceitar pedidos de estranhos, não responder a mensagens que causem desconforto e contar sempre a um adulto de confiança se algo parecer errado. A UNICEF tem guias gratuitos de literacia digital para crianças." },
      { q:"Qual é a idade mínima para criar conta nas principais redes sociais?", a:[{t:"13 anos na maioria das plataformas (Instagram, TikTok, YouTube)",ok:true},{t:"10 anos, com autorização dos pais",ok:false},{t:"18 anos em todas as plataformas",ok:false}], exp:"A maioria das grandes plataformas (Instagram, TikTok, YouTube, Snapchat) exige 13 anos de idade mínima, com base na lei norte-americana COPPA. Na UE, o RGPD fixa os 16 anos como regra geral, mas os países podem baixar para 13. Portugal fixou os 13 anos." }
    ]
  };

  // ===== TEMAS visuais — colorido e alegre =====
  const THEMES = [
    { skyTop:0x87ceeb, skyBot:0xb0e8f8, hillColor:0x48c774, grassTop:0x5ae080 }, // céu azul claro
    { skyTop:0xe8dcc8, skyBot:0xf5ede0, hillColor:0x7a9650, grassTop:0x8fb060 }, // pergaminho/sépia
    { skyTop:0xa0e8ff, skyBot:0xc8f5ff, hillColor:0x32b8a0, grassTop:0x40d4b8 }, // aqua
    { skyTop:0xffc8e0, skyBot:0xffe0f0, hillColor:0xe066a0, grassTop:0xf080b8 }, // rosa
    { skyTop:0xc8a0ff, skyBot:0xe8d0ff, hillColor:0x8040c8, grassTop:0xa060e0 }, // lilás
    { skyTop:0xa0ffb0, skyBot:0xc8ffd0, hillColor:0x30a850, grassTop:0x40c060 }, // verde brilhante
    { skyTop:0xffb880, skyBot:0xffd8b0, hillColor:0xe06820, grassTop:0xf08030 }, // laranja
    { skyTop:0x80d0ff, skyBot:0xb0e8ff, hillColor:0x1880c0, grassTop:0x2898e0 }, // azul vivo
    { skyTop:0xffa0c8, skyBot:0xffc8de, hillColor:0xc03080, grassTop:0xd84098 }, // magenta
    { skyTop:0xb0ff80, skyBot:0xd0ffb0, hillColor:0x208040, grassTop:0x30a050 }, // verde lima
  ];

  // ===== Níveis (10) =====
  const LEVELS = [
    {
      name: "Nível 1 — O Dia da Criança",
      theme:0, quizTheme:"historia", worldW:2600,
      spawn:{x:480,y:460}, doorX:2100,
      platforms:[
        {x:450,y:520,w:900,h:28},{x:1040,y:450,w:300,h:22},{x:1380,y:380,w:270,h:22},
        {x:1700,y:310,w:240,h:22},{x:2050,y:520,w:900,h:28}
      ],
      items:[{x:1040,y:400,kind:"estrela"},{x:1380,y:330,kind:"medalha"},{x:1700,y:260,kind:"brinquedo"}],
      malwares:[{x:1240,y:480,vx:0,pattern:"mini"},{x:1960,y:480,vx:-150,pattern:"patrol"}]
    },
    {
      name: "Nível 2 — A Declaração de 1959",
      theme:1, quizTheme:"declaracao", worldW:2800,
      spawn:{x:480,y:460}, doorX:2350,
      platforms:[
        {x:520,y:520,w:980,h:28},{x:900,y:450,w:240,h:22},{x:1180,y:380,w:240,h:22},
        {x:1460,y:310,w:240,h:22},{x:1740,y:380,w:240,h:22},{x:2020,y:450,w:240,h:22},
        {x:2380,y:520,w:980,h:28}
      ],
      items:[{x:900,y:400,kind:"balao"},{x:1460,y:260,kind:"medalha"},{x:2020,y:400,kind:"estrela"}],
      malwares:[{x:1320,y:480,vx:0,pattern:"mini"},{x:2140,y:480,vx:-155,pattern:"patrol"}]
    },
    {
      name: "Nível 3 — A Convenção de 1989",
      theme:2, quizTheme:"convencao", worldW:2900,
      spawn:{x:480,y:460}, doorX:2500,
      platforms:[
        {x:520,y:520,w:1040,h:28},{x:840,y:460,w:240,h:22},{x:1180,y:390,w:240,h:22},
        {x:1520,y:320,w:240,h:22},{x:1860,y:390,w:240,h:22},{x:2200,y:460,w:240,h:22},
        {x:2480,y:520,w:1040,h:28}
      ],
      items:[{x:840,y:410,kind:"brinquedo"},{x:1520,y:270,kind:"medalha"},{x:2200,y:410,kind:"estrela"},{x:560,y:470,kind:"heart"}],
      malwares:[{x:1000,y:480,vx:0,pattern:"mini"},{x:1700,y:480,vx:-160,pattern:"patrol"},{x:2350,y:480,vx:155,pattern:"patrol"}]
    },
    {
      name: "Nível 4 — O Direito ao Brincar",
      theme:3, quizTheme:"brincar", worldW:3000,
      spawn:{x:480,y:460}, doorX:2600,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:860,y:455,w:230,h:22},{x:1160,y:385,w:230,h:22},
        {x:1460,y:315,w:230,h:22},{x:1760,y:385,w:230,h:22},{x:2060,y:455,w:230,h:22},
        {x:2360,y:385,w:230,h:22},{x:2640,y:520,w:1000,h:28}
      ],
      items:[{x:860,y:405,kind:"brinquedo"},{x:1460,y:265,kind:"medalha"},{x:2060,y:405,kind:"balao"},{x:560,y:470,kind:"heart"}],
      malwares:[{x:1010,y:480,vx:160},{x:1610,y:480,vx:-165},{x:2210,y:480,vx:160}]
    },
    {
      name: "Nível 5 — O Direito à Educação",
      theme:4, quizTheme:"educacao", worldW:3100,
      spawn:{x:480,y:460}, doorX:2700,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:880,y:450,w:220,h:22},{x:1160,y:380,w:220,h:22},
        {x:1460,y:310,w:220,h:22},{x:1760,y:380,w:220,h:22},{x:2060,y:450,w:220,h:22},
        {x:2360,y:380,w:220,h:22},{x:2660,y:520,w:1000,h:28}
      ],
      items:[{x:880,y:400,kind:"estrela"},{x:1460,y:260,kind:"brinquedo"},{x:2060,y:400,kind:"balao"},{x:2360,y:330,kind:"medalha"}],
      malwares:[{x:1020,y:480,vx:165},{x:1620,y:480,vx:-170},{x:2220,y:480,vx:165},{x:2820,y:480,vx:-160}]
    },
    {
      name: "Nível 6 — O Direito à Saúde",
      theme:5, quizTheme:"saude", worldW:3100,
      spawn:{x:480,y:460}, doorX:2700,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:860,y:450,w:210,h:22},{x:1140,y:375,w:210,h:22},
        {x:1420,y:305,w:210,h:22},{x:1700,y:375,w:210,h:22},{x:1980,y:450,w:210,h:22},
        {x:2260,y:375,w:210,h:22},{x:2680,y:520,w:1000,h:28}
      ],
      items:[{x:860,y:400,kind:"medalha"},{x:1420,y:255,kind:"estrela"},{x:1980,y:400,kind:"brinquedo"},{x:560,y:470,kind:"heart"}],
      malwares:[{x:1010,y:480,vx:170},{x:1610,y:480,vx:-175},{x:2210,y:480,vx:170},{x:2760,y:480,vx:-165}]
    },
    {
      name: "Nível 7 — O Direito à Proteção",
      theme:6, quizTheme:"protecao", worldW:3200,
      spawn:{x:480,y:460}, doorX:2800,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:880,y:448,w:200,h:22},{x:1160,y:374,w:200,h:22},
        {x:1440,y:304,w:200,h:22},{x:1720,y:374,w:200,h:22},{x:2000,y:448,w:200,h:22},
        {x:2280,y:374,w:200,h:22},{x:2560,y:448,w:200,h:22},{x:2840,y:520,w:1000,h:28}
      ],
      items:[{x:880,y:398,kind:"estrela"},{x:1440,y:254,kind:"medalha"},{x:2000,y:398,kind:"balao"},{x:2560,y:398,kind:"brinquedo"}],
      malwares:[{x:1020,y:480,vx:175,pattern:"patrol"},{x:1620,y:480,vx:-180,pattern:"patrol"},{x:2220,y:480,vx:175,pattern:"jumper"},{x:2820,y:480,vx:-170,pattern:"jumper"}]
    },
    {
      name: "Nível 8 — O Direito à Participação",
      theme:7, quizTheme:"participacao", worldW:3300,
      spawn:{x:480,y:460}, doorX:2900,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:880,y:446,w:195,h:22},{x:1160,y:372,w:195,h:22},
        {x:1440,y:302,w:195,h:22},{x:1720,y:372,w:195,h:22},{x:2000,y:446,w:195,h:22},
        {x:2280,y:372,w:195,h:22},{x:2560,y:446,w:195,h:22},{x:2900,y:520,w:1000,h:28}
      ],
      items:[{x:880,y:396,kind:"brinquedo"},{x:1440,y:252,kind:"balao"},{x:2000,y:396,kind:"estrela"},{x:560,y:470,kind:"heart"},{x:2560,y:396,kind:"medalha"}],
      malwares:[{x:1020,y:480,vx:180,pattern:"patrol"},{x:1620,y:480,vx:-185,pattern:"jumper"},{x:2220,y:480,vx:180,pattern:"jumper"},{x:2820,y:480,vx:-175,pattern:"jumper"}]
    },
    {
      name: "Nível 9 — O Futuro Sustentável",
      theme:8, quizTheme:"futuro", worldW:3400,
      spawn:{x:480,y:460}, doorX:3000,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:900,y:444,w:190,h:22},{x:1180,y:370,w:190,h:22},
        {x:1460,y:300,w:190,h:22},{x:1740,y:370,w:190,h:22},{x:2020,y:444,w:190,h:22},
        {x:2300,y:370,w:190,h:22},{x:2580,y:444,w:190,h:22},{x:2860,y:370,w:190,h:22},
        {x:3000,y:520,w:1100,h:28}
      ],
      items:[{x:900,y:394,kind:"estrela"},{x:1460,y:250,kind:"balao"},{x:2020,y:394,kind:"brinquedo"},{x:2580,y:394,kind:"medalha"}],
      malwares:[{x:1050,y:480,vx:185,pattern:"jumper"},{x:1650,y:480,vx:-190,pattern:"jumper"},{x:2250,y:480,vx:185,pattern:"jumper"},{x:2850,y:480,vx:-180,pattern:"jumper"}]
    },
    {
      name: "Nível 10 — A UNICEF e os Direitos",
      theme:9, quizTheme:"unicef", worldW:3500,
      spawn:{x:480,y:460}, doorX:3100,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:920,y:442,w:185,h:22},{x:1200,y:368,w:185,h:22},
        {x:1480,y:298,w:185,h:22},{x:1760,y:368,w:185,h:22},{x:2040,y:442,w:185,h:22},
        {x:2320,y:368,w:185,h:22},{x:2600,y:442,w:185,h:22},{x:2880,y:368,w:185,h:22},
        {x:3150,y:520,w:1100,h:28}
      ],
      items:[{x:920,y:392,kind:"balao"},{x:1480,y:248,kind:"medalha"},{x:2040,y:392,kind:"estrela"},{x:2600,y:392,kind:"brinquedo"},{x:560,y:470,kind:"heart"}],
      malwares:[{x:1060,y:480,vx:190,pattern:"jumper"},{x:1660,y:480,vx:-195,pattern:"jumper"},{x:2260,y:480,vx:190,pattern:"jumper"},{x:2860,y:480,vx:-185,pattern:"jumper"},{x:3200,y:480,vx:188,pattern:"jumper"}]
    },
    {
      name: "Nível 11 — O Direito à Identidade",
      theme:0, quizTheme:"identidade", worldW:3600,
      spawn:{x:480,y:460}, doorX:3200,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:940,y:440,w:180,h:22},{x:1220,y:365,w:180,h:22},
        {x:1500,y:295,w:180,h:22},{x:1780,y:365,w:180,h:22},{x:2060,y:440,w:180,h:22},
        {x:2340,y:365,w:180,h:22},{x:2620,y:295,w:180,h:22},{x:2900,y:365,w:180,h:22},
        {x:3250,y:520,w:1100,h:28}
      ],
      items:[{x:940,y:390,kind:"estrela"},{x:1500,y:245,kind:"medalha"},{x:2060,y:390,kind:"balao"},{x:2620,y:245,kind:"brinquedo"},{x:560,y:470,kind:"heart"}],
      malwares:[{x:1080,y:480,vx:192,pattern:"jumper"},{x:1680,y:480,vx:-197,pattern:"jumper"},{x:2280,y:480,vx:192,pattern:"jumper"},{x:2880,y:480,vx:-188,pattern:"jumper"},{x:3100,y:480,vx:190,pattern:"jumper"}]
    },
    {
      name: "Nível 12 — O Direito à Família",
      theme:1, quizTheme:"familia", worldW:3650,
      spawn:{x:480,y:460}, doorX:3340,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:950,y:438,w:175,h:22},{x:1230,y:362,w:175,h:22},
        {x:1510,y:290,w:175,h:22},{x:1790,y:362,w:175,h:22},{x:2070,y:438,w:175,h:22},
        {x:2350,y:362,w:175,h:22},{x:2630,y:290,w:175,h:22},{x:2910,y:362,w:175,h:22},
        {x:3190,y:438,w:175,h:22},{x:3300,y:520,w:1100,h:28}
      ],
      items:[{x:950,y:388,kind:"balao"},{x:1510,y:240,kind:"estrela"},{x:2070,y:388,kind:"brinquedo"},{x:2630,y:240,kind:"medalha"},{x:560,y:470,kind:"heart"}],
      malwares:[{x:1100,y:480,vx:194,pattern:"jumper"},{x:1700,y:480,vx:-199,pattern:"jumper"},{x:2300,y:480,vx:194,pattern:"jumper"},{x:2900,y:480,vx:-190,pattern:"jumper"},{x:3150,y:480,vx:192,pattern:"jumper"}]
    },
    {
      name: "Nível 13 — Os Direitos dos Refugiados",
      theme:2, quizTheme:"refugiados", worldW:3700,
      spawn:{x:480,y:460}, doorX:3300,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:960,y:436,w:170,h:22},{x:1240,y:358,w:170,h:22},
        {x:1520,y:286,w:170,h:22},{x:1800,y:358,w:170,h:22},{x:2080,y:436,w:170,h:22},
        {x:2360,y:358,w:170,h:22},{x:2640,y:280,w:170,h:22},{x:2920,y:358,w:170,h:22},
        {x:3200,y:436,w:170,h:22},{x:3360,y:520,w:1100,h:28}
      ],
      items:[{x:960,y:386,kind:"estrela"},{x:1520,y:236,kind:"balao"},{x:2080,y:386,kind:"brinquedo"},{x:2640,y:230,kind:"medalha"},{x:3200,y:386,kind:"estrela"}],
      malwares:[{x:1110,y:480,vx:196,pattern:"patrol"},{x:1720,y:480,vx:-200,pattern:"jumper"},{x:2320,y:480,vx:196,pattern:"patrol"},{x:2920,y:480,vx:-192,pattern:"jumper"},{x:3180,y:480,vx:194,pattern:"patrol"}]
    },
    {
      name: "Nível 14 — Contra o Trabalho Infantil",
      theme:3, quizTheme:"trabalho", worldW:3750,
      spawn:{x:480,y:460}, doorX:3350,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:970,y:434,w:165,h:22},{x:1250,y:354,w:165,h:22},
        {x:1530,y:280,w:165,h:22},{x:1810,y:354,w:165,h:22},{x:2090,y:434,w:165,h:22},
        {x:2370,y:354,w:165,h:22},{x:2650,y:275,w:165,h:22},{x:2930,y:354,w:165,h:22},
        {x:3210,y:434,w:165,h:22},{x:3420,y:520,w:1100,h:28}
      ],
      items:[{x:970,y:384,kind:"balao"},{x:1530,y:230,kind:"estrela"},{x:2090,y:384,kind:"medalha"},{x:2650,y:225,kind:"brinquedo"},{x:560,y:470,kind:"heart"}],
      malwares:[{x:1120,y:480,vx:198,pattern:"patrol"},{x:1740,y:480,vx:-202,pattern:"jumper"},{x:2340,y:480,vx:198,pattern:"patrol"},{x:2940,y:480,vx:-194,pattern:"jumper"},{x:3350,y:480,vx:-196,pattern:"patrol"}]
    },
    {
      name: "Nível 15 — O Direito à Expressão",
      theme:4, quizTheme:"expressao", worldW:3800,
      spawn:{x:480,y:460}, doorX:3400,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:980,y:432,w:160,h:22},{x:1260,y:350,w:160,h:22},
        {x:1540,y:274,w:160,h:22},{x:1820,y:350,w:160,h:22},{x:2100,y:432,w:160,h:22},
        {x:2380,y:350,w:160,h:22},{x:2660,y:270,w:160,h:22},{x:2940,y:350,w:160,h:22},
        {x:3220,y:432,w:160,h:22},{x:3480,y:520,w:1100,h:28}
      ],
      items:[{x:980,y:382,kind:"estrela"},{x:1540,y:224,kind:"balao"},{x:2100,y:382,kind:"brinquedo"},{x:2660,y:220,kind:"medalha"},{x:3220,y:382,kind:"estrela"}],
      malwares:[{x:1130,y:480,vx:200,pattern:"patrol"},{x:1760,y:480,vx:-204,pattern:"jumper"},{x:2360,y:480,vx:200,pattern:"patrol"},{x:2960,y:480,vx:-196,pattern:"jumper"},{x:3380,y:480,vx:-198,pattern:"patrol"}]
    },
    {
      name: "Nível 16 — O Direito à Privacidade",
      theme:5, quizTheme:"privacidade", worldW:3850,
      spawn:{x:480,y:460}, doorX:3450,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:990,y:430,w:158,h:22},{x:1270,y:348,w:158,h:22},
        {x:1550,y:268,w:158,h:22},{x:1830,y:348,w:158,h:22},{x:2110,y:430,w:158,h:22},
        {x:2390,y:348,w:158,h:22},{x:2670,y:265,w:158,h:22},{x:2950,y:348,w:158,h:22},
        {x:3230,y:430,w:158,h:22},{x:3510,y:520,w:1100,h:28}
      ],
      items:[{x:990,y:380,kind:"balao"},{x:1550,y:218,kind:"estrela"},{x:2110,y:380,kind:"medalha"},{x:2670,y:215,kind:"brinquedo"},{x:560,y:470,kind:"heart"},{x:3230,y:380,kind:"estrela"}],
      malwares:[{x:1140,y:480,vx:202,pattern:"patrol"},{x:1980,y:480,vx:-206,pattern:"jumper"},{x:2780,y:480,vx:202,pattern:"patrol"},{x:3400,y:480,vx:-200,pattern:"jumper"}]
    },
    {
      name: "Nível 17 — O Direito à Cultura",
      theme:6, quizTheme:"cultura", worldW:3900,
      spawn:{x:480,y:460}, doorX:3500,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:1000,y:428,w:155,h:22},{x:1280,y:346,w:155,h:22},
        {x:1560,y:264,w:155,h:22},{x:1840,y:346,w:155,h:22},{x:2120,y:428,w:155,h:22},
        {x:2400,y:346,w:155,h:22},{x:2680,y:260,w:155,h:22},{x:2960,y:346,w:155,h:22},
        {x:3240,y:428,w:155,h:22},{x:3540,y:520,w:1100,h:28}
      ],
      items:[{x:1000,y:378,kind:"estrela"},{x:1560,y:214,kind:"balao"},{x:2120,y:378,kind:"brinquedo"},{x:2680,y:210,kind:"medalha"},{x:3240,y:378,kind:"estrela"}],
      malwares:[{x:1150,y:480,vx:204,pattern:"patrol"},{x:1800,y:480,vx:-208,pattern:"jumper"},{x:2400,y:480,vx:204,pattern:"patrol"},{x:3000,y:480,vx:-200,pattern:"jumper"},{x:3430,y:480,vx:-202,pattern:"patrol"}]
    },
    {
      name: "Nível 18 — O Direito à Inclusão",
      theme:7, quizTheme:"deficiencia", worldW:3950,
      spawn:{x:480,y:460}, doorX:3550,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:1010,y:426,w:152,h:22},{x:1290,y:344,w:152,h:22},
        {x:1570,y:260,w:152,h:22},{x:1850,y:344,w:152,h:22},{x:2130,y:426,w:152,h:22},
        {x:2410,y:344,w:152,h:22},{x:2690,y:255,w:152,h:22},{x:2970,y:344,w:152,h:22},
        {x:3250,y:426,w:152,h:22},{x:3570,y:520,w:1100,h:28}
      ],
      items:[{x:1010,y:376,kind:"balao"},{x:1570,y:210,kind:"estrela"},{x:2130,y:376,kind:"medalha"},{x:2690,y:205,kind:"brinquedo"},{x:560,y:470,kind:"heart"},{x:3250,y:376,kind:"balao"}],
      malwares:[{x:1160,y:480,vx:206,pattern:"patrol"},{x:1820,y:480,vx:-210,pattern:"jumper"},{x:2420,y:480,vx:206,pattern:"patrol"},{x:3020,y:480,vx:-202,pattern:"jumper"},{x:3450,y:480,vx:-204,pattern:"patrol"}]
    },
    {
      name: "Nível 19 — O Direito ao Ambiente",
      theme:8, quizTheme:"ambiente", worldW:4000,
      spawn:{x:480,y:460}, doorX:3600,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:1020,y:424,w:150,h:22},{x:1300,y:342,w:150,h:22},
        {x:1580,y:256,w:150,h:22},{x:1860,y:342,w:150,h:22},{x:2140,y:424,w:150,h:22},
        {x:2420,y:342,w:150,h:22},{x:2700,y:250,w:150,h:22},{x:2980,y:342,w:150,h:22},
        {x:3260,y:424,w:150,h:22},{x:3600,y:520,w:1100,h:28}
      ],
      items:[{x:1020,y:374,kind:"estrela"},{x:1580,y:206,kind:"balao"},{x:2140,y:374,kind:"brinquedo"},{x:2700,y:200,kind:"medalha"},{x:3260,y:374,kind:"estrela"},{x:560,y:470,kind:"heart"}],
      malwares:[{x:1170,y:480,vx:208,pattern:"patrol"},{x:1840,y:480,vx:-212,pattern:"jumper"},{x:2440,y:480,vx:208,pattern:"patrol"},{x:3040,y:480,vx:-204,pattern:"jumper"},{x:3500,y:480,vx:-206,pattern:"patrol"}]
    },
    {
      name: "Nível 20 — Os Direitos Digitais",
      theme:9, quizTheme:"digital", worldW:4100,
      spawn:{x:480,y:460}, doorX:3700,
      platforms:[
        {x:520,y:520,w:1000,h:28},{x:1030,y:422,w:148,h:22},{x:1310,y:340,w:148,h:22},
        {x:1590,y:252,w:148,h:22},{x:1870,y:340,w:148,h:22},{x:2150,y:422,w:148,h:22},
        {x:2430,y:340,w:148,h:22},{x:2710,y:245,w:148,h:22},{x:2990,y:340,w:148,h:22},
        {x:3270,y:422,w:148,h:22},{x:3630,y:520,w:1200,h:28}
      ],
      items:[{x:1030,y:372,kind:"balao"},{x:1590,y:202,kind:"medalha"},{x:2150,y:372,kind:"estrela"},{x:2710,y:195,kind:"brinquedo"},{x:3270,y:372,kind:"balao"},{x:560,y:470,kind:"heart"}],
      malwares:[{x:1180,y:480,vx:210,pattern:"patrol"},{x:1960,y:480,vx:-214,pattern:"jumper"},{x:2760,y:480,vx:210,pattern:"patrol"},{x:3520,y:480,vx:-208,pattern:"jumper"}]
    },
  ];

  // ===== Phaser =====
  let sceneRef=null, currentLevel=0;
  let bgGraphics, hillsGraphics, groundGraphics, decorGraphics, shadowGfx;
  let sunGraphics, starGraphics, doorGlowGfx, powerHaloGfx;
  let farGraphics;           // 4ª camada parallax (montanhas/edifícios)
  let moonGraphics;          // lua para temas noturnos
  let platDecorGfx;          // decorações animadas nas plataformas
  let bgConfetti = [];       // confetes de fundo nos últimos níveis
  let platDecorData = [];    // dados das flores/borboletas nas plataformas
  let sunAngle = 0;
  let trailSprites = [];
  let footStepTimer = 0;
  let balloons=[], critters=[], enemyTimers=[];
  let player, platforms, itemsGroup, malwareGroup, door, doorOverlap=null;
  let cursors, keySpace;
  let hudText, scoreText, heartsGfx, tipText, itemCountText;
  let progressBg, progressFill, powerIndicator, playerNameHUD;
  let pauseOverlayGfx, pauseVanImg, pauseLabel;
  let transitionGfx, transitionLabel;
  let score=0, lives=3, livesLostThisLevel=0;
  const MAX_LIVES=5;
  let itemsCollected=0, itemsTotal=0;
  let collectedItemIndices=new Set(); // índices dos itens já apanhados neste nível
  let touch={left:false,right:false,jump:false};
  let awaitingQuiz=false, awaitingStory=false;
  let powered=false, poweredTimer=null, powerCountdown=null, invuln=false;
  let currentLevelTip = "⭐ Apanha estrelas e chega à porta 🎊!";
  const GRAVITY=1100;

  const config = {
    type: Phaser.AUTO,
    width: 960, height: 540,
    parent: "game",
    backgroundColor: "#000000",
    transparent: true,
    physics: { default:"arcade", arcade:{ gravity:{y:GRAVITY}, debug:false, overlapBias:12, tileBias:32 } },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 960, height: 540
    },
    scene: { create, update }
  };

  function initPhaser() {
    if (window.__dc_game) return;
    const game = new Phaser.Game(config);
    window.__dc_game = game;
  }

  function create() {
    sceneRef = this;
    cursors  = this.input.keyboard.createCursorKeys();
    keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.physics.world.setBounds(0, 0, 2600, 514);
    this.cameras.main.setBounds(0, 0, 2600, 540);

    makeTextures(this);
    initBackground(this);

    shadowGfx = this.add.graphics().setDepth(1);
    powerHaloGfx = this.add.graphics().setDepth(2);

    // HUD
    hudText      = this.add.text(14, 10, "", { fontSize:"16px", fontStyle:"900", color:"#fff5e0", stroke:"#200040", strokeThickness:4 }).setScrollFactor(0).setDepth(100);
    scoreText    = this.add.text(14, 32, "", { fontSize:"14px", fontStyle:"900", color:"#ffd700", stroke:"#200040", strokeThickness:3 }).setScrollFactor(0).setDepth(100);
    // Nome do jogador — ao lado dos pontos
    playerNameHUD = this.add.text(175, 32, "", {
      fontSize:"14px", fontStyle:"900", color:"#ff80c0", stroke:"#200040", strokeThickness:3
    }).setScrollFactor(0).setDepth(103).setOrigin(0,0);
    heartsGfx    = this.add.graphics().setScrollFactor(0).setDepth(100);
    tipText      = this.add.text(14, 74, "", { fontSize:"13px", fontStyle:"800", color:"#ff6b35", stroke:"#fff5e0", strokeThickness:3 }).setScrollFactor(0).setDepth(100);
    itemCountText= this.add.text(14, 92, "", { fontSize:"12px", fontStyle:"800", color:"#fff5e0", stroke:"#200040", strokeThickness:2 }).setScrollFactor(0).setDepth(100);

    progressBg   = this.add.graphics().setScrollFactor(0).setDepth(100);
    progressFill = this.add.graphics().setScrollFactor(0).setDepth(100);
    progressBg.fillStyle(0x000000, 0.20);
    progressBg.fillRoundedRect(8, 110, 230, 10, 5);

    powerIndicator = this.add.text(960-14, 52, "", { fontSize:"14px", fontStyle:"900", color:"#ffd700", stroke:"#200040", strokeThickness:4 }).setScrollFactor(0).setDepth(102).setOrigin(1,0);

    // Assinatura da professora — dentro da faixa castanha do chão, muito subtil
    this.add.text(960-8, 536, "Professora Vanda Várzea", {
      fontSize:"8px", fontStyle:"italic", color:"#f5d9a8",
      stroke:"#3a1a00", strokeThickness:1
    }).setScrollFactor(0).setDepth(100).setOrigin(1,1).setAlpha(0.55);

    pauseOverlayGfx = this.add.graphics().setScrollFactor(0).setDepth(500);
    pauseVanImg  = this.add.image(480, 240, "vanberto_open").setScrollFactor(0).setDepth(501).setScale(3).setAlpha(0);
    pauseLabel   = this.add.text(480, 370, "⏸ PAUSA", { fontSize:"44px", fontStyle:"900", color:"#ffd700", stroke:"#200040", strokeThickness:7 }).setOrigin(0.5).setScrollFactor(0).setDepth(501).setAlpha(0);

    transitionGfx   = this.add.graphics().setScrollFactor(0).setDepth(800).setAlpha(0);
    transitionLabel = this.add.text(480, 270, "", { fontSize:"32px", fontStyle:"900", color:"#ffd700", stroke:"#200040", strokeThickness:8, align:"center" }).setOrigin(0.5).setScrollFactor(0).setDepth(801).setAlpha(0);

    platforms    = this.physics.add.staticGroup();
    itemsGroup   = this.physics.add.group({ allowGravity:false });
    malwareGroup = this.physics.add.group();

    player = this.physics.add.sprite(480, 460, "vanberto_open");
    player.setCollideWorldBounds(true);
    player.body.setSize(44, 48);
    player.body.setOffset(26, 40);

    this.physics.add.collider(player, platforms);
    this.physics.add.overlap(player, itemsGroup, onCollectItem, null, this);
    this.physics.add.collider(malwareGroup, platforms);
    this.physics.add.collider(player, malwareGroup, onHitMalware, null, this);

    // Lerp 1.0 = snap instantâneo; loadLevel repõe 0.08 após posicionar
    this.cameras.main.startFollow(player, true, 1.0, 1.0);
    this.cameras.main.setDeadzone(140, 90);

    createTouchInput(this);
    loadGame();
    btnMute.textContent = muted ? "🔇 Som: OFF" : "🔊 Som: ON";
    // Level loaded by btnStart

    if (btnPause && btnRestart) {
      btnPause.onclick = () => {
        if (!sceneRef) return;
        pausedByTeacher = !pausedByTeacher;
        if (pausedByTeacher) {
          sceneRef.physics.pause(); btnPause.textContent = "▶ Continuar"; showPauseScreen(true);
        } else {
          if (!awaitingQuiz && startOverlay.classList.contains("hidden") && historyOverlay.classList.contains("hidden"))
            sceneRef.physics.resume();
          btnPause.textContent = "⏸ Pausa"; showPauseScreen(false);
        }
      };
      btnRestart.onclick = () => {
        if (!sceneRef) return;
        const lvlName = LEVELS[currentLevel]?.name || `Nível ${currentLevel+1}`;
        if (!confirm(`⚠️ Reiniciar o ${lvlName}?\nO progresso neste nível perde-se.`)) return;
        pausedByTeacher=false; btnPause.textContent="⏸ Pausa"; showPauseScreen(false);
        quizOverlay.classList.add("hidden"); btnCloseQuiz.classList.add("hidden");
        awaitingQuiz=false; historyOverlay.classList.add("hidden");
        touch.left=touch.right=touch.jump=false;
        sceneRef.physics.resume(); loadLevel(sceneRef,currentLevel); saveGame();
      };
    }

    if (btnRestartGame) {
      btnRestartGame.onclick = () => {
        if (!sceneRef) return;
        pausedByTeacher=false; btnPause.textContent="⏸ Pausa"; showPauseScreen(false);
        quizOverlay.classList.add("hidden"); btnCloseQuiz.classList.add("hidden");
        historyOverlay.classList.add("hidden"); awaitingQuiz=false;
        touch.left=touch.right=touch.jump=false;
        score=0; lives=3; livesLostThisLevel=0;
        resetQuizStats(); Object.keys(usedQuizByLevel).forEach(k=>usedQuizByLevel[k].clear());
        scoreText.setText(`🌟 Pontos: ${score}`); updateHearts();
        sceneRef.physics.resume(); loadLevel(sceneRef,0); saveGame();
      };
    }


    // Botão hamburger mobile — abre/fecha painel suspenso
    const btnTeacherMenu = document.getElementById("btnTeacherMenu");
    const teacherMenuPanel = document.getElementById("teacherMenuPanel");
    if (btnTeacherMenu && teacherMenuPanel) {
      btnTeacherMenu.onclick = (e) => {
        e.stopPropagation();
        teacherMenuPanel.classList.toggle("open");
      };
      // Fechar ao clicar fora
      document.addEventListener("click", (e) => {
        if (!teacherMenuPanel.contains(e.target) && e.target !== btnTeacherMenu) {
          teacherMenuPanel.classList.remove("open");
        }
      });
      // Ligar botões do painel aos originais
      const mirror = (mId, origId) => {
        const m = document.getElementById(mId);
        const o = document.getElementById(origId);
        if (m && o) m.onclick = () => { o.click(); teacherMenuPanel.classList.remove("open"); };
      };
      mirror("mBtnFullscreen", "btnFullscreenGame");
      mirror("mBtnTouch",      "btnTouchToggle");
      mirror("mBtnPause",      "btnPause");
      mirror("mBtnLevel",      "btnRestartLevel");
      mirror("mBtnRestart",    "btnRestartGame");
    }
  }

  function showPauseScreen(on) {
    if (!pauseOverlayGfx) return;
    if (on) {
      pauseOverlayGfx.clear(); pauseOverlayGfx.fillStyle(0x000000,0.6); pauseOverlayGfx.fillRect(0,0,960,540);
      pauseVanImg.setAlpha(1);
      sceneRef.tweens.add({targets:pauseVanImg,angle:{from:-6,to:6},duration:900,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});
      pauseLabel.setAlpha(1);
    } else {
      pauseOverlayGfx.clear(); pauseVanImg.setAlpha(0); pauseLabel.setAlpha(0);
      sceneRef.tweens.killTweensOf(pauseVanImg); pauseVanImg.setAngle(0);
    }
  }

  // ===== UPDATE =====
  function updateCritters() {
    if(player){
      const px=player.x, py=player.y;
      const now=sceneRef.time.now*0.001;
      critters.forEach(c=>{
        if(c.collected||!c.sprite||!c.sprite.active) return;

        // Garantir velocidade mínima robusta — nunca ficam paradas
        if(Math.abs(c.speedX) < 0.7) c.speedX = (c.speedX >= 0 ? 1 : -1) * 0.7;
        if(Math.abs(c.speedY) < 0.5) c.speedY = (c.speedY >= 0 ? 1 : -1) * 0.5;
        // Acumular angulo proprio por critter
        if(c.angle === undefined) c.angle = c.phase;
        c.angle += c.isBee ? 0.06 : 0.04;
        c.x += c.speedX;
        c.y += c.speedY * Math.sin(c.angle);
        // Rebater nas bordas
        if(c.x < 40) { c.x=40; c.speedX=Math.abs(c.speedX); }
        if(c.x > c.worldW-40) { c.x=c.worldW-40; c.speedX=-Math.abs(c.speedX); }
        if(c.y < 30)  { c.y=30;  c.speedY= Math.abs(c.speedY); }
        if(c.y > 310) { c.y=310; c.speedY=-Math.abs(c.speedY); }
        const sc=c.isBee?0.75:0.80;
        // Batimento de asas — scaleY oscilante
        const wingFlap=1+Math.sin(now*(c.isBee?18:9)+c.wingPhase)*(c.isBee?0.18:0.12);
        c.sprite.setFlipX(c.speedX < 0);
        c.sprite.setScale(sc, sc*wingFlap);
        c.sprite.setPosition(c.x, c.y);
        // Colisao com o jogador — hitbox ligeiramente maior para facilitar apanhar
        const pb=player.body;
        if(pb.right>c.x-32&&pb.left<c.x+32&&pb.bottom>c.y-26&&pb.top<c.y+26){
          c.collected=true; c.sprite.destroy(); c.sprite=null;
          const pts=c.isBee?15:10;
          score+=pts; scoreText.setText(`🌟 Pontos: ${score}`);
          showFloat(sceneRef,px,py-68,c.isBee?`🐝 Abelha +${pts}`:`🦋 Borboleta +${pts}`,c.isBee?"#ffd700":"#ff80c0");
          if(Math.random()<0.4) showFloat(sceneRef,px,py-100,pickPraise(),"#ffd700");
          ensureAudio(); SFX.coin();
          const tint=c.isBee?[0xffd700,0xff9500,0xffffff]:[0xff80c0,0xd0a0ff,0x80d0ff,0xffffff];
          const pt=sceneRef.add.particles(0,0,"spark_item",{x:px,y:py,speed:{min:50,max:170},lifespan:380,quantity:c.isBee?14:12,scale:{start:0.9,end:0},gravityY:280,tint});
          sceneRef.time.delayedCall(280,()=>pt.destroy());
          saveGame();
          // Respawnar após 5-9 segundos — usar session para ignorar se o nível mudou
          const wW=LEVELS[currentLevel]?.worldW||2600;
          const mySession = c.session;
          sceneRef.time.delayedCall(5000+Math.random()*4000,()=>{
            // Ignorar se o nível foi reiniciado ou mudou (nova session)
            if(mySession !== _critterSession) return;
            if(!c.collected) return;
            c.collected=false;
            c.x=120+Math.random()*(wW-240); c.y=60+Math.random()*260;
            // Garantir velocidade mínima robusta no respawn
            const dir = Math.random() < 0.5 ? 1 : -1;
            c.speedX = dir * (0.7 + Math.random() * 0.6);
            c.speedY = (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5);
            c.angle = Math.random() * Math.PI * 2;
            c.sprite=sceneRef.add.image(c.x,c.y,c.key).setDepth(2).setScale(c.isBee?0.75:0.80).setAlpha(0.92);
          });
        }
      });
    }
  }

  function update() {
    updateCritters();
    if (awaitingQuiz||!startOverlay.classList.contains("hidden")||!historyOverlay.classList.contains("hidden")) {
      player.setVelocityX(0); applyVanBertoTexture(sceneRef); updateShadow(); return;
    }
    const speed=powered?320:280;
    const leftDown=cursors.left.isDown||touch.left;
    const rightDown=cursors.right.isDown||touch.right;
    const jumpDown=cursors.up.isDown||keySpace.isDown||touch.jump;

    if (leftDown&&!rightDown) { player.setVelocityX(-speed); player.setFlipX(true);  player.setAngle(-2); }
    else if (rightDown&&!leftDown) { player.setVelocityX(speed); player.setFlipX(false); player.setAngle(2); }
    else { player.setVelocityX(0); player.setAngle(0); }
    // Só aplica escala se não estiver a piscar (invuln) para não interromper o tween de alpha
    if(!invuln) player.setScale(powered?1.18:1.0);

    if (jumpDown&&player.body.blocked.down) {
      player.setVelocityY(powered?-680:-650); ensureAudio(); SFX.jump(); touch.jump=false;
      sceneRef.tweens.add({targets:player,scaleY:powered?1.26:1.11,scaleX:powered?1.11:0.95,duration:120,yoyo:true});
    }

    applyVanBertoTexture(sceneRef);
    updatePowerHalo(sceneRef);
    updateShadow();

    if (progressFill&&LEVELS[currentLevel]) updateHUD(LEVELS[currentLevel]);

    // Animar sol (rotação lenta dos raios)
    sunAngle += 0.004;
    drawSun(sunAngle);

    // Animar estrelas noturnas (piscar)
    if(LEVELS[currentLevel]&&LEVELS[currentLevel].theme>=4)
      drawStars(LEVELS[currentLevel].theme, LEVELS[currentLevel].worldW||2600);

    // Animar nuvens
    clouds.forEach(c=>{
      c.x += c.speed;
      if(c.x > c.worldW+120) c.x=-120;
      drawCloud(c.gfx,c.x,c.y,c.scale,c.alpha,c.type||"cumulo");
    });

    // Trail de movimento (super modo ou no ar)
    updateTrail(sceneRef);

    // Partículas de passo quando corre no chão
    updateFootsteps(sceneRef);

    // Halo da porta quando o player está perto
    updateDoorGlow(sceneRef);

    // Decorações animadas nas plataformas
    updatePlatformDecor(sceneRef);

    // Confetes de fundo — deriva suave
    bgConfetti.forEach(c=>{
      if(!c.gfx||!c.gfx.active) return;
      c.gfx.y = c.baseY + Math.sin(sceneRef.time.now*0.0008+c.phase)*18;
    });

    // Itens sem rotação — apenas flutuam

    // Animar e verificar colisão dos balões flutuantes apanháveis
    if(player){
      const px=player.x, py=player.y;
      balloons.forEach(b=>{
        if(b.collected||!b.sprite) return;
        // Movimento flutuante — sobem pelo ar com deriva lateral
        b.y -= 0.45 + b.speed * 0.12;
        b.x += Math.sin(b.y * 0.018 + b.phase) * 0.6;
        if(b.y < -50){ b.y=560; b.x=80+Math.random()*((LEVELS[currentLevel]?.worldW||2600)-160); }
        b.sprite.setPosition(b.x, b.y);
        b.sprite.setAngle(0);
        // Oscilação suave de alpha
        b.sprite.setAlpha(0.82+Math.sin(Date.now()*0.003+b.phase)*0.12);
        // Colisão com jogador
        const pb=player.body;
        const bLeft=b.x-20, bRight=b.x+20, bTop=b.y-28, bBot=b.y+10;
        if(pb.right>bLeft&&pb.left<bRight&&pb.bottom>bTop&&pb.top<bBot){
          b.collected=true;
          b.sprite.destroy(); b.sprite=null;
          score+=10; scoreText.setText(`🌟 Pontos: ${score}`);
          showFloat(sceneRef,px,py-68,"🎈 Balão +10","#ff6b35");
          if(Math.random()<0.35) showFloat(sceneRef,px,py-100,pickPraise(),"#ffd700");
          ensureAudio(); SFX.coin();
          const tint=[0xff6b35,0xffd700,0xff80c0,0x80d0ff];
          const p=sceneRef.add.particles(0,0,"spark_item",{x:px,y:py,speed:{min:60,max:160},lifespan:340,quantity:12,scale:{start:0.9,end:0},gravityY:300,tint});
          sceneRef.time.delayedCall(240,()=>p.destroy());
          saveGame();
          // Respawnar lá em baixo após 4-7 segundos
          const worldW=LEVELS[currentLevel]?.worldW||2600;
          sceneRef.time.delayedCall(4000+Math.random()*3000,()=>{
            if(!b.collected) return;
            b.collected=false;
            b.x=80+Math.random()*(worldW-160); b.y=560;
            const newKey="item_balao_"+Math.floor(Math.random()*6);
            b.sprite=sceneRef.add.image(b.x,b.y,newKey).setDepth(1).setScale(0.85).setAlpha(0.92);
          });
        }
      });
    }

    // Animar borboletas e abelhas apanháveis
    malwareGroup.getChildren().forEach(m=>{
      if (!m.active || !m.body) return;
      const pat = m.getData("pattern") || "patrol";
      const spd = m.getData("speed") || 120;
      const dir = m.getData("dir") || 1;  // direcao guardada

      if (pat === "mini") {
        const minL = m.getData("minLeft")  ?? (m.x - 120);
        const minR = m.getData("minRight") ?? (m.x + 120);
        if (m.x <= minL || m.body.blocked.left)  { m.setVelocityX(spd);  m.setData("dir", 1); }
        if (m.x >= minR || m.body.blocked.right) { m.setVelocityX(-spd); m.setData("dir", -1); }
        if (Math.abs(m.body.velocity.x) < 8) { m.setVelocityX(spd * dir); }
        m.rotation += 0.012;
      } else {
        if (m.body.blocked.left)  { m.setVelocityX(spd);  m.setData("dir", 1); }
        if (m.body.blocked.right) { m.setVelocityX(-spd); m.setData("dir", -1); }
        if (door && m.x > door.x - 220 && m.body.velocity.x > 0) { m.setVelocityX(-spd); m.setData("dir", -1); }
        // Watchdog robusto: se parou, usar direção guardada
        if (Math.abs(m.body.velocity.x) < 8) { m.setVelocityX(spd * (m.getData("dir") || 1)); }
        m.rotation += pat === "jumper" ? 0.038 : 0.022;
      }
      if (m.body.velocity.x < -2) m.setFlipX(true);
      else if (m.body.velocity.x > 2) m.setFlipX(false);
    });
  }

  function updateShadow() {
    if (!shadowGfx||!player) return;
    shadowGfx.clear();
    if (awaitingQuiz) return;
    const px=player.x,py=player.y; let groundY=520;
    platforms.getChildren().forEach(p=>{
      if(!p.body) return;
      if(px>=p.body.left&&px<=p.body.right&&p.body.top>py&&p.body.top<groundY) groundY=p.body.top;
    });
    const dist=Math.max(0,groundY-py), alpha=Math.max(0,0.28-dist*0.001), sc=Math.max(0.3,1-dist*0.003);
    shadowGfx.fillStyle(0x000000,alpha); shadowGfx.fillEllipse(player.x,groundY+2,44*sc,10*sc);
  }

  function updatePowerHalo(scene) {
    if (!powerHaloGfx||!player) return;
    powerHaloGfx.clear();
    // Esconder halo durante animação da porta ou quiz
    if (!powered || awaitingQuiz) return;
    const t = scene.time.now * 0.004;
    const pulse = 0.55 + Math.sin(t) * 0.45;
    // Halo exterior — dourado
    powerHaloGfx.lineStyle(4, 0xffd700, 0.55 * pulse);
    powerHaloGfx.strokeCircle(player.x, player.y, 34 + pulse * 6);
    // Halo interior — laranja
    powerHaloGfx.lineStyle(2.5, 0xff6b35, 0.7 * pulse);
    powerHaloGfx.strokeCircle(player.x, player.y, 26 + pulse * 4);
    // Barra de tempo por baixo do robô
    const barW = 46, barH = 6;
    const bx = player.x - barW/2, by = player.y + 32;
    const pct = Math.max(0, poweredCountdownVal / 8);
    // Fundo da barra
    powerHaloGfx.fillStyle(0x000000, 0.45);
    powerHaloGfx.fillRoundedRect(bx-1, by-1, barW+2, barH+2, 4);
    // Preenchimento — muda de cor: verde→amarelo→laranja conforme acaba
    const barColor = pct > 0.5 ? 0x44dd44 : pct > 0.25 ? 0xffd700 : 0xff4400;
    powerHaloGfx.fillStyle(barColor, 0.92);
    powerHaloGfx.fillRoundedRect(bx, by, Math.max(3, barW * pct), barH, 3);
    // Brilho no topo da barra
    powerHaloGfx.fillStyle(0xffffff, 0.30);
    powerHaloGfx.fillRoundedRect(bx, by, Math.max(3, barW * pct), barH/2, 3);
  }

  // ===== Balões flutuantes apanháveis =====
  function spawnBalloons(scene,worldW) {
    balloons.forEach(b=>{ if(b.sprite) b.sprite.destroy(); if(b.gfx) b.gfx.destroy(); });
    balloons=[];
    const count=6+(currentLevel%4);
    for(let i=0;i<count;i++){
      const x=80+Math.random()*(worldW-160);
      const y=80+Math.random()*380; // espalhados pelo ar
      const bKey="item_balao_"+(i%6);
      const sprite=scene.add.image(x,y,bKey).setDepth(1).setScale(0.85).setAlpha(0.92);
      balloons.push({
        sprite, x, y,
        colorKey:bKey, speed:0.4+Math.random()*0.7,
        phase:Math.random()*Math.PI*2,
        collected:false
      });
    }
  }
  function drawBalloon() {} // mantida para compatibilidade

  // ===== Borboletas e Abelhas apanháveis =====
  // Calcula posições das flores do chão para poder enviar borboletas até lá
  function getFlowerPositions(worldW) {
    const flowers = [];
    for(let fi=0; fi<Math.floor(worldW/38); fi++){
      flowers.push({ x: 18+fi*38+(fi%4)*5, y: 507+(fi%2)*2 });
    }
    return flowers;
  }

  let _critterSession = 0; // incrementado a cada loadLevel para invalidar respawns pendentes

  function spawnCritters(scene, worldW){
    _critterSession++; // invalidar todos os delayedCall de respawn anteriores
    critters.forEach(c=>{ if(c.sprite&&c.sprite.active) c.sprite.destroy(); });
    critters=[];
    const count = 3 + Math.floor(currentLevel / 2); // 3 no nível 1, até ~12 nos últimos
    const session = _critterSession;
    for(let i=0; i<count; i++){
      // Alternar: metade são borboletas, metade são abelhas
      const isBee = (i % 2 === 0);
      const colorIdx = i % 5;
      const key = isBee ? "item_abelha" : "item_borboleta_"+colorIdx;
      const x = 120 + Math.random() * (worldW - 240);
      const y = 60 + Math.random() * 260;
      const sprite = scene.add.image(x, y, key)
        .setDepth(2).setScale(isBee ? 0.75 : 0.80).setAlpha(0.92);
      critters.push({
        sprite, x, y, isBee, key,
        speedX: (Math.random() < 0.5 ? 1 : -1) * (0.7 + Math.random() * 0.6),
        speedY: (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5),
        phase: Math.random() * Math.PI * 2,
        wingPhase: Math.random() * Math.PI * 2,
        collected: false, worldW,
        session // identificador de sessão para cancelar respawns obsoletos
      });
    }
  }

  // ===== Escudos extra distribuídos pelo nível =====
  // Cria 2-3 escudos adicionais espalhados pelo mapa (além do que já está em L.items),
  // posicionados acima das plataformas existentes para ficarem acessíveis.
  // Os escudos ficam no itemsGroup normal e são tratados como "medalha".
  function spawnShields(scene, L) {
    // Todos os níveis já têm 1 medalha em L.items (a meio do mapa).
    // Níveis 1-3: total 1 escudo  → spawnShields não adiciona nada.
    // Nível 4+:   total 2 escudos → spawnShields adiciona 1 extra perto do início,
    //             escolhendo a plataforma mais à esquerda que não tenha nenhum
    //             item de L.items a menos de 100px (evita sobrepor sprites).
    if (currentLevel < 3) return;

    const plats = L.platforms.filter(p => p.w < 600); // só plataformas intermédias (não o chão)
    if (!plats.length) return;

    const MIN_SAME_PLAT = 100; // distância mínima para não sobrepor um item existente

    // Ordenar da esquerda para a direita — queremos o escudo perto do início
    const sorted = [...plats].sort((a, b) => a.x - b.x);

    // Primeira plataforma cujo centro esteja a mais de 100px de qualquer item já existente
    const p = sorted.find(pl =>
      L.items.every(it => Math.abs(pl.x - it.x) >= MIN_SAME_PLAT)
    );
    if (!p) return;

    const sx = p.x;
    const sy = p.y - 52;
    const obj = itemsGroup.create(sx, sy, "item_medalha");
    obj.setDepth(2);
    scene.tweens.add({ targets: obj, y: sy - 8, duration: 940, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    obj.setData("kind", "medalha");
    obj.setData("itemIdx", -1); // -1 = escudo extra, não entra no collectedItemIndices
  }
  function difficultyFactor(idx) {
    let f = 1 + idx * 0.02;
    if (idx >= 8)  f += (idx - 8)  * 0.015;
    if (idx >= 14) f += (idx - 14) * 0.02;
    return Math.min(1.35, f); // cap mais baixo — 1.35 em vez de 1.85
  }

  // ===== Carregar nível =====
  function loadLevel(scene,idx) {
    currentLevel=idx;
    const L=LEVELS[currentLevel];
    const T=THEMES[L.theme%THEMES.length];

    scene.physics.world.setBounds(0,0,L.worldW,514);
    scene.cameras.main.setBounds(0,0,L.worldW,540);

    enemyTimers.forEach(t=>{ try{t.remove(false);}catch{} }); enemyTimers=[];
    platforms.clear(true,true); itemsGroup.clear(true,true);
    malwareGroup.clear(true,true);
    if(door) door.destroy();

    awaitingQuiz=false; invuln=false; clearPower(scene); livesLostThisLevel=0; _doorAnimRunning=false;
    if(!pausedByTeacher) scene.physics.resume();
    // Garantir que halo e sombra estão visíveis no início do nível
    if(powerHaloGfx) powerHaloGfx.setVisible(true);
    if(shadowGfx)    shadowGfx.setVisible(true);
    itemsCollected=0; itemsTotal=L.items.filter(it=>it.kind!=="heart").length;
    collectedItemIndices=new Set();
    updateHUD(L); applyBackground(scene,L.theme%THEMES.length,L.worldW);

    L.platforms.forEach(p=>{
      const themeIdx = L.theme % THEMES.length;
      const platKey = "platform_t"+themeIdx;
      if(!scene.textures.exists(platKey)) makePlatformTextureThemed(scene, platKey, themeIdx);
      const plat=platforms.create(p.x,p.y,platKey);
      plat.displayWidth=p.w; plat.displayHeight=p.h; plat.refreshBody();
      if(plat.body){plat.body.checkCollision.left=false;plat.body.checkCollision.right=false;}
    });

    door=scene.physics.add.staticSprite(L.doorX,425,"door_party").setDisplaySize(80,100);
    door.clearTint();
    // Guardar referência ao collider para o poder destruir no momento do toque (evita re-disparo no móvel)
    if(doorOverlap) { try{ scene.physics.world.removeCollider(doorOverlap); }catch{} doorOverlap=null; }
    let _doorTriggered=false; // guarda local — evita disparo duplo no mesmo frame
    doorOverlap = scene.physics.add.overlap(player,door,()=>{
      if(awaitingQuiz||_doorTriggered) return;
      _doorTriggered=true;
      try{ scene.physics.world.removeCollider(doorOverlap); doorOverlap=null; }catch{}
      tryOpenDoor(scene);
    },null,scene);
    scene.tweens.add({targets:door,alpha:{from:1,to:0.82},duration:900,yoyo:true,repeat:-1});

    // Decorações animadas nas plataformas
    spawnPlatformDecor(scene, platforms);

    const keyMap={
      estrela:"item_estrela",
      balao:"item_chupachupa",
      brinquedo:"item_brinquedo",medalha:"item_medalha",heart:"item_heart"
    };
    // Velocidade de rotação por tipo de item — removida (itens ficam fixos)
    const rotSpeeds={};
    L.items.forEach((it,idx)=>{
      const _km=keyMap[it.kind]; const _key=typeof _km==="function"?_km():(_km||"item_estrela");
      const obj=itemsGroup.create(it.x,it.y,_key);
      obj.setDepth(2);
      scene.tweens.add({targets:obj,y:obj.y-8,duration:940,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});
      obj.setData("kind",it.kind);
      obj.setData("itemIdx",idx);
    });

    // Halo da porta (criado aqui, atualizado no update)
    if(doorGlowGfx) doorGlowGfx.destroy();
    doorGlowGfx = scene.add.graphics().setDepth(1);
    doorGlowGfx._hintShown = false;

    const df=difficultyFactor(currentLevel);
    L.malwares.forEach(m=>spawnVilao(scene,m.x,480,m.vx,df,m.pattern||"patrol"));

    // Garantir que os 3 tipos de vilao aparecem SEMPRE em todos os niveis
    if(L.platforms.length>=5) {
      const mid  = L.platforms[Math.floor(L.platforms.length/2)];
      const q1   = L.platforms[Math.floor(L.platforms.length/4)];
      const q3   = L.platforms[Math.floor(L.platforms.length*3/4)];

      // Tipo 1 - vilao_round (mini/redondo): sempre presente, zona central
      spawnVilao(scene, mid.x, 480, (currentLevel%2===0)?120:-120, df, "mini");

      // Tipo 2 - vilao_spike (patrol): sempre presente no 1/4 do nivel
      spawnVilao(scene, q1.x, 480, (currentLevel%2===0)?-170:170, df, "patrol");

      // Tipo 3 - vilao_bug (jumper): sempre presente no 3/4 do nivel (a partir do nivel 2)
      if(currentLevel>=2){
        spawnVilao(scene, q3.x, 480, (currentLevel%2===0)?190:-190, df, "jumper");
      }
      // Segundo jumper extra a partir do nivel 4
      if(currentLevel>=4){
        const qEx = L.platforms[Math.floor(L.platforms.length*2/3)];
        spawnVilao(scene, qEx.x, 480, (currentLevel%2===0)?-200:200, df, "jumper");
      }
      // Terceiro jumper e patrol extra nos ultimos 6 niveis (14-20)
      if(currentLevel>=14){
        const qLate = L.platforms[Math.floor(L.platforms.length*5/6)] || q3;
        spawnVilao(scene, qLate.x, 480, (currentLevel%2===0)?210:-210, df, "jumper");
        spawnVilao(scene, q1.x+200, 480, (currentLevel%2===0)?-160:160, df, "patrol");
      }
      // Ultimo nivel — viloes em todos os quartos
      if(currentLevel>=19){
        spawnVilao(scene, mid.x+300, 480, (currentLevel%2===0)?220:-220, df, "jumper");
        spawnVilao(scene, mid.x-300, 480, (currentLevel%2===0)?-180:180, df, "patrol");
      }
    }

    spawnBalloons(scene,L.worldW);
    spawnCritters(scene,L.worldW);
    spawnShields(scene,L);

    player.setAlpha(0); player.setScale(0.6); player.setAngle(0); player.setFlipX(false); player.setOrigin(0.5,0.5); player.setDepth(3);
    player.setPosition(L.spawn.x, L.spawn.y); player.setVelocity(0, 0);
    // Snap instantâneo da câmara para o spawn, depois repor lerp suave para o jogo
    scene.cameras.main.startFollow(player, true, 1.0, 1.0);
    scene.cameras.main.centerOn(L.spawn.x, 270);
    scene.time.delayedCall(50, () => scene.cameras.main.startFollow(player, true, 0.08, 0.08));
    touch.left=touch.right=touch.jump=false;
    // Robot aparece com fade-in e pequeno "pop" no início do nível seguinte
    scene.time.delayedCall(80,()=>{
      snapPlayerToGround();
      scene.tweens.add({
        targets: player,
        alpha: { from: 0, to: 1 },
        scaleX: { from: 0.6, to: 1 },
        scaleY: { from: 1.3, to: 1 },
        duration: 320, ease: "Back.easeOut",
        onComplete: () => { player.setVelocityY(-160); }
      });
    });

    const TIPS = [
      "🌟 Apanha estrelas e chega à porta 🎊!",
      "🎈 Apanha balões no ar e chupa-chupas nas plataformas!",
      "🧸 A Convenção de 1989 protege todas as crianças!",
      "⭐ O direito ao brincar está no artigo 31.º!",
      "📚 Apanha itens e chega à porta da escola!",
      "💊 Todas as crianças têm direito à saúde!",
      "🛡️ Evita os vilões e protege os teus direitos!",
      "🗣️ A tua opinião conta! Chega à porta!",
      "🌱 O futuro sustentável depende de ti!",
      "🌍 A UNICEF defende todas as crianças do mundo!",
      "🪪 Toda a criança tem direito a um nome e identidade!",
      "👨‍👩‍👧 A família é o primeiro lugar de amor e segurança!",
      "✈️ Crianças refugiadas têm os mesmos direitos que todas!",
      "🚫 Nenhuma criança deve trabalhar em condições perigosas!",
      "🗣️ A tua voz importa — tens direito à expressão!",
      "🔒 A tua privacidade online é um direito — protege-a!",
      "🌍 Cada língua e cultura é um tesouro único!",
      "♿ Todas as crianças merecem inclusão e apoio!",
      "🌱 O planeta precisa de ti — cuida do ambiente!",
      "💻 Os teus direitos existem também no mundo digital!"
    ];
    currentLevelTip = (TIPS[currentLevel] || TIPS[0]) + (currentLevel >= 6 ? " ⚠️ Cuidado!" : "");
    tipText.setText(currentLevelTip);
    ensureAudio(); SFX.door(); saveGame();
  }

  /*
   * spawnVilao — 3 padrões de comportamento:
   *   "mini"    → patrulha zona pequena (±120px), devagar, sem saltar (mais fácil, níveis 1-3)
   *   "patrol"  → patrulha horizontal normal (médio, níveis 1-8)
   *   "jumper"  → patrulha E salta frequentemente (difícil, níveis 7-10)
   */
  function spawnVilao(scene, x, y, vx, df, pattern="patrol") {
    const keyMap = { mini:"vilao_round", patrol:"vilao_spike", jumper:"vilao_bug" };
    const keys = ["vilao_round","vilao_spike","vilao_bug"];
    const key = keyMap[pattern] || keys[Math.floor(Math.random()*keys.length)];

    const v = malwareGroup.create(x, y, key);
    v.setCollideWorldBounds(true);
    v.setBounce(0);
    v.body.setSize(52, 52, true);
    v.setDepth(2);
    v.setData("pattern", pattern);

    if (pattern === "mini") {
      const miniSpeed = 60 + Math.random() * 40;
      v.setVelocityX(miniSpeed);
      v.setData("speed", miniSpeed);
      v.setData("dir", 1);
      v.setData("minLeft",  x - 120);
      v.setData("minRight", x + 120);
    } else if (pattern === "jumper") {
      const spd = Math.round(Math.abs(vx) * df * 0.60) || 120;
      v.setVelocityX(vx >= 0 ? spd : -spd);
      v.setData("speed", spd);
      v.setData("dir", vx >= 0 ? 1 : -1);
    } else {
      const spd = Math.round(Math.abs(vx) * df) || 120;
      v.setVelocityX(vx >= 0 ? spd : -spd);
      v.setData("speed", spd);
      v.setData("dir", vx >= 0 ? 1 : -1);
    }

    // Saltos periódicos — só patrol e jumper
    if (pattern === "patrol" || pattern === "jumper") {
      const jumpInterval = pattern === "jumper"
        ? 1400 + Math.random() * 700
        : 2200 + Math.random() * 1400;

      const outerTimer = scene.time.addEvent({
        delay: 400 + Math.random() * 1000,
        callback: () => {
          const innerTimer = scene.time.addEvent({
            delay: jumpInterval, loop: true,
            callback: () => {
              if (!v.active || !v.body) return;
              if (!v.body.blocked.down) return;
              if (pattern === "jumper" && player) {
                // Salto inteligente: força proporcional à altura do jogador
                const dy = v.y - player.y; // positivo se jogador está acima
                const targetForce = dy > 30
                  ? -Math.min(780, Math.sqrt(2 * 1100 * (dy + 30)) + 60)
                  : -380;
                // Virar na direção do jogador ao saltar
                const dirX = player.x > v.x ? 1 : -1;
                const spd2 = v.getData("speed") || 150;
                v.setVelocityX(dirX * spd2);
                v.setVelocityY(targetForce);
              } else {
                v.setVelocityY(-420 - Math.random() * 80);
              }
            }
          });
          enemyTimers.push(innerTimer);
        }
      });
      enemyTimers.push(outerTimer);
    }

    // Timer anti-stuck: verifica posição real a cada 600ms
    let lastX = v.x;
    const stuckTimer = scene.time.addEvent({
      delay: 600, loop: true,
      callback: () => {
        if (!v.active || !v.body) return;
        const moved = Math.abs(v.x - lastX);
        if (moved < 4) {
          // Verdadeiramente parado — forçar velocidade na direção guardada
          const d = v.getData("dir") || 1;
          const s = v.getData("speed") || 120;
          v.setVelocityX(s * d);
        } else {
          // Atualizar dir com base no movimento real
          if (v.x > lastX) v.setData("dir", 1);
          else v.setData("dir", -1);
        }
        lastX = v.x;
      }
    });
    enemyTimers.push(stuckTimer);

    // Animações visuais
    if (pattern === "mini") {
      // Rotação lenta + pulsação suave — menos ameaçador
      scene.tweens.add({targets:v, angle:{from:-8,to:8},
        duration:1100+Math.random()*400, yoyo:true, repeat:-1, ease:"Sine.easeInOut"});
      scene.tweens.add({targets:v, scaleX:{from:0.92,to:1.08}, scaleY:{from:1.08,to:0.92},
        duration:900+Math.random()*300, yoyo:true, repeat:-1, ease:"Sine.easeInOut"});

    } else if (pattern === "patrol") {
      scene.tweens.add({targets:v, angle:{from:-6,to:6},
        duration:700+Math.random()*300, yoyo:true, repeat:-1, ease:"Sine.easeInOut"});
      scene.tweens.add({targets:v, scaleX:{from:1.0,to:1.15}, scaleY:{from:1.0,to:1.15},
        duration:500+Math.random()*200, yoyo:true, repeat:-1, ease:"Sine.easeInOut"});

    } else if (pattern === "jumper") {
      scene.tweens.add({targets:v, angle:{from:-12,to:12},
        duration:320+Math.random()*160, yoyo:true, repeat:-1, ease:"Sine.easeInOut"});
      scene.tweens.add({targets:v, scaleX:{from:0.95,to:1.20}, scaleY:{from:1.20,to:0.95},
        duration:380+Math.random()*120, yoyo:true, repeat:-1, ease:"Sine.easeInOut"});

    }
  }

  function updateHUD(L) {
    hudText.setText(`${L.name}  (${currentLevel+1}/${LEVELS.length})`);
    scoreText.setText(`🌟 Pontos: ${score}`);
    updateHearts();
    itemCountText.setText(`⭐ Itens: ${itemsCollected}/${itemsTotal}`);
    if(powerIndicator&&!powered) powerIndicator.setText("");

    if(progressFill){
      progressFill.clear();
      const BAR_X=8,BAR_Y=110,BAR_W=230,BAR_H=10;
      const levelPct=currentLevel/LEVELS.length;
      const levelNextPct=(currentLevel+1)/LEVELS.length;
      progressFill.fillStyle(0x200040,0.55);
      progressFill.fillRoundedRect(BAR_X,BAR_Y,Math.max(4,Math.round(BAR_W*levelPct)),BAR_H,5);
      if(player&&L){
        const worldW=L.worldW||2600,doorX=L.doorX||worldW-200,spawnX=L.spawn?.x||120;
        const px=Math.max(spawnX,Math.min(player.x,doorX));
        const inLevelPct=(px-spawnX)/Math.max(1,doorX-spawnX);
        const segStart=BAR_X+Math.round(BAR_W*levelPct);
        const segEnd=BAR_X+Math.round(BAR_W*levelNextPct);
        const segW=segEnd-segStart;
        progressFill.fillStyle(0xff6b35,0.9);
        progressFill.fillRoundedRect(segStart,BAR_Y,Math.max(3,Math.round(segW*inLevelPct)),BAR_H,5);
        const markerX=segStart+Math.round(segW*inLevelPct);
        progressFill.fillStyle(0x200040,1); progressFill.fillCircle(markerX,BAR_Y+BAR_H/2,6);
        progressFill.fillStyle(0xffd700,1); progressFill.fillCircle(markerX,BAR_Y+BAR_H/2,3);
        progressFill.fillStyle(0xff6b35,1); progressFill.fillRect(segEnd-5,BAR_Y+1,8,BAR_H-2);
      }
    }
  }

  function updateHearts(){
    if(!heartsGfx) return;
    heartsGfx.clear();
    const startX=14,y=56,size=12,gap=17;
    for(let i=0;i<MAX_LIVES;i++){
      const x=startX+i*gap, full=i<lives;
      const r=size*0.52;
      heartsGfx.fillStyle(full?0xe84d10:0xffc0a0,full?1:0.4);
      heartsGfx.fillCircle(x-r*0.55,y-r*0.18,r); heartsGfx.fillCircle(x+r*0.55,y-r*0.18,r);
      heartsGfx.fillTriangle(x-size,y-r*0.1,x+size,y-r*0.1,x,y+size*1.05);
      if(full){heartsGfx.fillStyle(0xffffff,0.3);heartsGfx.fillCircle(x-r*0.3,y-r*0.5,r*0.3);}
    }
  }

  function snapPlayerToGround(){
    if(!player?.body||!platforms) return;
    player.body.updateFromGameObject();
    const pb=player.body; let best=null,bestTop=Infinity;
    platforms.getChildren().forEach(p=>{
      if(!p.body) return;
      if(pb.right>p.body.left&&pb.left<p.body.right){
        const top=p.body.top;
        if(top>=pb.bottom-2&&top<bestTop){bestTop=top;best=p;}
      }
    });
    if(best){const dy=pb.bottom-(best.body.top-1);player.setVelocity(0,0);player.y-=dy;player.body.updateFromGameObject();}
  }

  // ===== Porta + Quiz =====
  function tryOpenDoor(scene){
    if(awaitingQuiz) return;
    awaitingQuiz=true;
    // Remover overlap da porta imediatamente — antes de qualquer resume() da física
    if(doorOverlap){ try{ scene.physics.world.removeCollider(doorOverlap); }catch{} doorOverlap=null; }
    // Esconder halo e sombra imediatamente — não redesenhar durante animação
    if(powerHaloGfx) { powerHaloGfx.clear(); powerHaloGfx.setVisible(false); }
    if(shadowGfx)    { shadowGfx.clear();    shadowGfx.setVisible(false); }
    player.setVelocityX(0);
    player.setFlipX(false);
    touch.left=touch.right=touch.jump=false;
    const doorOrigX = door.x;
    // Garantir que a física está ativa para o body.blocked atualizar corretamente
    scene.physics.resume();
    let waited = 0;
    let _animStarted = false; // guarda — impede startDoorAnimation de ser chamado duas vezes
    const landingCheck = scene.time.addEvent({
      delay: 16, loop: true,
      callback: () => {
        if(_animStarted) return;
        waited += 16;
        const onGround = player.body && player.body.blocked.down;
        // No móvel o body.blocked pode não atualizar — forçar após 200ms
        if (onGround || waited >= 200) {
          _animStarted = true;
          landingCheck.remove();
          player.setVelocity(0, 0);
          snapPlayerToGround();
          scene.physics.pause();
          ensureAudio(); SFX.doorOpen();
          startDoorAnimation(scene, doorOrigX);
        }
      }
    });
    // Timeout de segurança: se ao fim de 4s o quiz ainda não apareceu, desbloquear
    // (a animação da porta demora ~2s; 4s garante que não há conflito com o quiz)
    scene.time.delayedCall(4000, () => {
      if (!awaitingQuiz) return; // já resolveu normalmente
      const quizVisible = !quizOverlay.classList.contains("hidden");
      if (!quizVisible) {
        // Quiz não apareceu — desbloquear o jogo
        awaitingQuiz = false;
        _doorAnimRunning = false;
        if(powerHaloGfx) powerHaloGfx.setVisible(true);
        if(shadowGfx)    shadowGfx.setVisible(true);
        scene.physics.resume();
        // Recriar o overlap da porta para nova tentativa
        if(doorOverlap) { try{ scene.physics.world.removeCollider(doorOverlap); }catch{} }
        doorOverlap = scene.physics.add.overlap(player, door, () => {
          if(awaitingQuiz) return;
          try{ scene.physics.world.removeCollider(doorOverlap); doorOverlap=null; }catch{}
          tryOpenDoor(scene);
        }, null, scene);
      }
    });
  }

  let _doorAnimRunning = false;
  function startDoorAnimation(scene, doorOrigX){
    // Impedir execução dupla — só pode correr uma vez por abertura de porta
    if(_doorAnimRunning) return;
    _doorAnimRunning = true;
    door.setOrigin(0.5, 0.5);
    door.x = doorOrigX;

    // FASE 1 — porta treme para indicar que está a abrir
    scene.tweens.add({
      targets: door,
      x: { from: doorOrigX - 3, to: doorOrigX + 3 },
      duration: 55, yoyo: true, repeat: 4,
      ease: "Sine.easeInOut",
      onComplete: () => {
        door.x = doorOrigX;

        // Brilho dourado no chão à frente da porta
        const glow = scene.add.graphics().setDepth(10);
        glow.fillStyle(0xffd700, 0.7);
        glow.fillEllipse(doorOrigX, door.y + 36, 90, 20);
        scene.tweens.add({ targets: glow, alpha: { from: 0.7, to: 0 }, duration: 600,
          onComplete: () => glow.destroy() });

        // FASE 2 — porta abre (scaleX → 0, a partir da margem esquerda)
        door.setOrigin(0, 0.5);
        door.x = doorOrigX - 32;
        scene.tweens.add({
          targets: door,
          scaleX: { from: 1, to: 0 },
          duration: 320, ease: "Sine.easeIn",
          onComplete: () => {

            // FASE 3 — robot caminha para dentro da porta
            player.setDepth(2);
            player.setFlipX(false); // vira para a direita (para a porta)

            // Pequenas partículas da porta ao abrir
            const burst = scene.add.particles(0, 0, "spark_item", {
              x: doorOrigX, y: door.y - 10,
              speed: { min: 30, max: 120 },
              lifespan: 400, quantity: 14,
              scale: { start: 0.8, end: 0 },
              gravityY: 260,
              angle: { min: 200, max: 340 },
              tint: [0xffd700, 0xff80c0, 0xffffff, 0x80d0ff]
            });
            scene.time.delayedCall(320, () => burst.destroy());

            // Robot desloca-se até à porta
            scene.tweens.add({
              targets: player,
              x: doorOrigX - 4,
              duration: 260, ease: "Sine.easeIn",
              onComplete: () => {

                // FASE 4 — robot "entra" pela porta: encolhe e desaparece para dentro
                scene.tweens.add({
                  targets: player,
                  scaleX: { from: player.scaleX, to: 0.15 },
                  scaleY: { from: player.scaleY, to: 0.10 },
                  alpha: { from: 1, to: 0 },
                  duration: 280, ease: "Sine.easeIn",
                  onComplete: () => {
                    // Robot está completamente dentro da porta — reset discreto
                    player.setOrigin(0.5, 0.5);
                    player.setScale(1);
                    player.setDepth(3);
                    // Porta "fecha-se" (volta a mostrar-se brevemente antes do quiz)
                    door.setOrigin(0.5, 0.5);
                    door.x = doorOrigX;
                    door.setScale(1);
                    door.setAlpha(0.6);

                    // Label "Responde!"
                    const label = scene.add.text(doorOrigX, door.y - 60, "🎊 Responde!", {
                      fontSize: "20px", fontStyle: "900",
                      color: "#ffd700", stroke: "#200040", strokeThickness: 5
                    }).setOrigin(0.5).setDepth(20).setAlpha(0);
                    scene.tweens.add({
                      targets: label, alpha: 1, y: door.y - 88,
                      duration: 240, ease: "Back.easeOut",
                      onComplete: () => scene.time.delayedCall(280, () => {
                        scene.tweens.add({ targets: label, alpha: 0, duration: 160,
                          onComplete: () => label.destroy() });
                      })
                    });

                    // FASE 5 — mostrar quiz
                    scene.time.delayedCall(560, () => {
                      if(!awaitingQuiz) return; // segurança: só mostrar se ainda estamos à espera
                      _doorAnimRunning = false; // reset para próxima porta
                      lastQuizTheme = LEVELS[currentLevel].quizTheme;
                      showQuiz(pickQuizForLevel(currentLevel, LEVELS[currentLevel].quizTheme), (ok) => {
                        if(ok){
                          ensureAudio();
                          if(currentLevel===LEVELS.length-1) SFX.finalWin(); else SFX.win();
                          nextLevel(scene);
                        } else {
                          // Resposta errada — restaurar tudo e devolver ao início do nível
                          door.setOrigin(0.5, 0.5);
                          door.x = doorOrigX;
                          door.setScale(1);
                          door.setAlpha(1);
                          player.setAlpha(1); player.setScale(1);
                          const L = LEVELS[currentLevel];
                          player.setPosition(L.spawn.x, L.spawn.y);
                          snapPlayerToGround();
                          if(powerHaloGfx) powerHaloGfx.setVisible(true);
                          if(shadowGfx)    shadowGfx.setVisible(true);
                          if(doorOverlap) { try{ scene.physics.world.removeCollider(doorOverlap); }catch{} doorOverlap=null; }
                          _doorAnimRunning = false; // reset para nova tentativa
                          awaitingQuiz = false;
                          scene.physics.resume();
                          let _doorTriggered2=false;
                          doorOverlap = scene.physics.add.overlap(player, door, () => {
                            if(awaitingQuiz||_doorTriggered2) return;
                            _doorTriggered2=true;
                            try{ scene.physics.world.removeCollider(doorOverlap); doorOverlap=null; }catch{}
                            tryOpenDoor(scene);
                          }, null, scene);
                        }
                      });
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  function playLevelTransition(scene,nextIdx,onMidpoint){
    if(!transitionGfx||!transitionLabel){onMidpoint?.();return;}
    const nextL=LEVELS[nextIdx];
    const label=nextL?`🎈 ${nextIdx+1}/${LEVELS.length}\n${nextL.name.replace(/^Nível \d+ — /,"")}` : "🏆 Missão Concluída!";
    transitionGfx.clear(); transitionGfx.fillStyle(0x0a0020,1); transitionGfx.fillRect(0,0,960,540);
    transitionLabel.setText(label);
    scene.tweens.add({targets:[transitionGfx,transitionLabel],alpha:1,duration:320,ease:"Sine.easeIn",onComplete:()=>{
      onMidpoint?.();
      scene.time.delayedCall(520,()=>{
        scene.tweens.add({targets:[transitionGfx,transitionLabel],alpha:0,duration:380,ease:"Sine.easeOut"});
      });
    }});
  }

  function nextLevel(scene){
    const next=currentLevel+1;
    quizOverlay.classList.add("hidden"); btnCloseQuiz.classList.add("hidden"); awaitingQuiz=false;
    scene.physics.pause(); player.setVelocity(0,0);
    player.setAlpha(0);
    if(door) door.setAlpha(0);

    if(livesLostThisLevel===0){
      score+=50; bonusStars.textContent="⭐⭐⭐\n+50 Nível Perfeito!";
      bonusStars.classList.add("show"); setTimeout(()=>bonusStars.classList.remove("show"),2000);
    }
    livesLostThisLevel=0;

    setTimeout(()=>{
      if(next>=LEVELS.length){scene.physics.resume();showVictoryScreen(scene);return;}
      score+=100; scoreText.setText(`🌟 Pontos: ${score}`);
      showFloat(scene,player.x,player.y-80,"+100 🎊","#ffd700");
      playLevelTransition(scene,next,()=>{
        loadLevel(scene,next);
        showHistory(next,()=>{
          if(!pausedByTeacher) scene.physics.resume();
        });
      });
      saveGame();
    },750);
  }

  function showGameOver(){
    try{sceneRef.physics.pause();}catch{}
    awaitingQuiz=true; touch.left=touch.right=touch.jump=false;
    try{player.setVelocity(0,0);}catch{}
    ensureAudio(); SFX.gameOver();
    document.getElementById("gameOverOverlay").classList.remove("hidden");
  }

  function robotDance(scene,done){
    if(!player||!scene){done?.();return;}
    const camX=scene.cameras.main.scrollX;
    player.setPosition(camX + scene.scale.width / 2, 455);
    player.setVelocity(0,0);
    player.setFlipX(false); player.setAngle(0); player.setScale(1);
    // Danca mais energica — rotacao rapida + saltos + crescer
    const t1=scene.tweens.add({targets:player,angle:{from:-22,to:22},duration:80,yoyo:true,repeat:70});
    const t2=scene.tweens.add({targets:player,y:{from:455,to:410},duration:130,yoyo:true,repeat:46});
    const t3=scene.tweens.add({targets:player,scaleX:{from:1,to:1.35},scaleY:{from:1,to:1.35},duration:600,yoyo:true,repeat:5,ease:"Sine.easeInOut"});
    // Fogos de artificio Phaser — rafagas periodicas
    function burst(){
      if(!scene||!scene.add) return;
      const bx=(camX+Math.random()*scene.scale.width);
      const by=60+Math.random()*300;
      const colors=[0xffd700,0xff6b35,0xff80c0,0x80d0ff,0xa0ff80,0xffffff,0xd0a0ff];
      const p=scene.add.particles(0,0,"spark_item",{
        x:bx,y:by,speed:{min:80,max:260},lifespan:600,quantity:28,
        scale:{start:1.3,end:0},gravityY:-40,
        angle:{min:0,max:360},tint:colors
      });
      scene.time.delayedCall(500,()=>p.destroy());
    }
    // Disparar fogos a cada 400ms durante toda a danca
    const fireInterval=scene.time.addEvent({delay:400,loop:true,callback:burst});
    burst(); // primeiro imediatamente
    scene.time.delayedCall(9500,()=>{
      try{t1.stop();t2.stop();t3.stop();fireInterval.remove();}catch{}
      player.setAngle(0);player.setScale(1);player.y=455;done?.();
    });
  }

  function startConfetti(durationMs=5000){
    const el=document.getElementById("confetti"); if(!el) return;
    el.classList.remove("hidden"); el.innerHTML="";
    const emojis=["🎈","✨","⭐","🌟","🧸","🎁","🎊","🎉","🏆","🎀","🌈","💫","🥳","🎆","🎇","🪅","🏅","🎵","🎶","❤️","🌺","🦋","🐝"];
    const vw=Math.max(320,window.innerWidth||800);
    // Muito mais confetis na vitoria final
    const isMobile=window.matchMedia("(max-width:768px)").matches;
    const confettiCount=isMobile?180:400;
    for(let i=0;i<confettiCount;i++){
      const s=document.createElement("span");
      s.textContent=emojis[i%emojis.length];
      s.style.left=(Math.random()*vw)+"px";
      // Tamanhos variados para profundidade visual
      const sz=12+Math.floor(Math.random()*20);
      s.style.fontSize=sz+"px";
      s.style.animationDuration=(1.8+Math.random()*4.5)+"s";
      s.style.animationDelay=(Math.random()*3.5)+"s";
      s.style.opacity=(0.75+Math.random()*0.25).toFixed(2);
      el.appendChild(s);
    }
    setTimeout(()=>{el.classList.add("hidden");el.innerHTML="";},durationMs);
  }

  function showVictoryScreen(scene){
    try{scene.physics.pause();}catch{}
    awaitingQuiz=true;
    touch.left=touch.right=touch.jump=false;
    ensureAudio(); SFX.finalWin(); startConfetti(28000);
    robotDance(scene,()=>{
      const pct=quizStats.total?Math.round((quizStats.correct/quizStats.total)*100):0;
      let medal="🥉 Bronze — missão concluída!";
      if(pct>=70) medal="🥈 Prata — muito bem!";
      if(pct>=90) medal="🥇 Ouro — excelente!";
      const master=(!quizStats.everWrong&&quizStats.total>0)?" 🌟 Defensor Perfeito dos Direitos!":"";
      document.getElementById("winPlayerName").textContent=playerName||"Herói das Crianças";
      document.getElementById("winScore").textContent=score;
      document.getElementById("winPct").textContent=`${quizStats.correct}/${quizStats.total} (${pct}%)`;
      document.getElementById("winMedal").textContent=medal+master;

      const winErrors=document.getElementById("winErrors");
      const winErrorList=document.getElementById("winErrorList");
      if(winErrors&&winErrorList){
        if(quizStats.errors&&quizStats.errors.length>0){
          winErrors.style.display="block"; winErrorList.innerHTML="";
          quizStats.errors.forEach(e=>{
            const li=document.createElement("li");
            li.innerHTML=`<strong>${e.level}:</strong> ${e.q} <span style="color:#ff8050">→ "${e.wrong}"</span>`;
            winErrorList.appendChild(li);
          });
        } else { winErrors.style.display="none"; }
      }
      document.getElementById("winOverlay").classList.remove("hidden");
    });
  }

  function showQuiz(quiz,done,isRetry){
    quizOverlay.classList.remove("hidden");
    quizQuestion.textContent=(isRetry?"🔄 Segunda tentativa! ":"")+quiz.q;
    quizAnswers.innerHTML=""; quizFeedback.textContent=""; quizFeedback.style.color="#ff6b35";
    quizExplanation.textContent=""; quizExplanation.classList.add("hidden");
    // Limpar sempre o btnCloseQuiz ao abrir nova pergunta — evita cliques acidentais
    btnCloseQuiz.classList.add("hidden"); btnCloseQuiz.onclick=null;

    const correct=quiz.a.filter(x=>x.ok), wrong=quiz.a.filter(x=>!x.ok);
    for(let i=wrong.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[wrong[i],wrong[j]]=[wrong[j],wrong[i]];}
    const opts=[...correct.slice(0,1),...wrong.slice(0,2)];
    for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]];}

    let answered=false;
    opts.forEach(ans=>{
      const b=document.createElement("button");
      b.className="btn"; b.textContent=ans.t;
      b.setAttribute("aria-label",`Resposta: ${ans.t}`);
      b.onclick=()=>{
        if(answered) return; answered=true;
        ensureAudio(); quizStats.total+=1;

        quizAnswers.querySelectorAll(".btn").forEach(btn=>{
          btn.disabled=true;
          if(btn.textContent===correct[0].t){
            btn.style.background="rgba(20,80,20,0.75)";
            btn.style.borderColor="#4caf50";
            btn.style.color="#b8ffb8";
          } else if(btn===b&&!ans.ok){
            btn.style.background="rgba(100,20,20,0.75)";
            btn.style.borderColor="#c0392b";
            btn.style.color="#ffb8b8";
          } else { btn.style.opacity="0.35"; }
        });

        if(ans.ok){
          quizStats.correct+=1;
          // Esconder e desligar imediatamente o btnCloseQuiz para evitar nova pergunta acidental
          btnCloseQuiz.classList.add("hidden"); btnCloseQuiz.onclick=null;
          quizFeedback.textContent=isRetry?"✅ Conseguiste na segunda tentativa! 💪":"✅ Muito bem!";
          quizFeedback.style.color="#208050";
          if(quiz.exp){quizExplanation.textContent="💡 "+quiz.exp;quizExplanation.classList.remove("hidden");}
          if(sceneRef&&player) showFloat(sceneRef,player.x,player.y-90,pickPraise(),"#ff6b35");
          SFX.coin();
          setTimeout(()=>{quizOverlay.classList.add("hidden");done(true);},quiz.exp?1800:900);
        } else {
          quizStats.everWrong=true; SFX.hit();
          if(sceneRef&&player){sceneRef.tweens.add({targets:player,angle:{from:-10,to:10},duration:80,yoyo:true,repeat:4,ease:"Sine.easeInOut",onComplete:()=>{if(player)player.setAngle(0);}});}

          quizStats.errors=quizStats.errors||[];
          if(!isRetry) quizStats.errors.push({level:LEVELS[currentLevel]?.name||`Nível ${currentLevel+1}`,q:quiz.q,wrong:ans.t,correct:correct[0].t});
          if(quiz.exp){quizExplanation.textContent="💡 "+quiz.exp;quizExplanation.classList.remove("hidden");}
          const tip=QUIZ_TIPS[LEVELS[currentLevel]?.quizTheme]||"";
          quizFeedback.textContent="❌ Quase! A resposta certa era: "+correct[0].t+"\nTenta outra pergunta!";
          if(tip) quizFeedback.textContent+=`\n💡 Lembra-te: ${tip}`;
          quizFeedback.style.color="#e84d10";
          btnCloseQuiz.classList.remove("hidden"); btnCloseQuiz.textContent="🔄 Tentar outra pergunta";
          btnCloseQuiz.onclick=()=>{
            btnCloseQuiz.classList.add("hidden");
            showQuiz(pickQuizForLevel(currentLevel,LEVELS[currentLevel].quizTheme),done,true);
          };
        }
      };
      quizAnswers.appendChild(b);
    });
  }

  // ===== Itens =====
  const ITEM_LABELS={
    estrela:  {label:"🌟 Estrela +10",   color:"#ffd700"},
    balao:    {label:"🍭 Chupa-chupa +10", color:"#e0209a"},
    brinquedo:{label:"🧸 Brinquedo +10", color:"#a050ff"},
    medalha:  {label:"🛡️ Escudo! PROTEGIDO",color:"#ffd700"},
    heart:    {label:"❤️ +1 Vida!",       color:"#e84d10"}
  };

  // Cores das partículas por tipo de item
  const ITEM_TINTS={
    estrela:  [0xffd700, 0xffe980, 0xffffff, 0xff6b35],
    balao:    [0xe0209a, 0xff80c0, 0xffd700, 0x9030e0],
    brinquedo:[0xa050ff, 0xff80c0, 0xffd700, 0xffffff],
    medalha:  [0xffd700, 0xffe980, 0xffffff, 0xff9500],
    heart:    [0xff2040, 0xff6080, 0xffffff, 0xe84d10]
  };

  function onCollectItem(playerObj,itemObj){
    const kind=itemObj.getData("kind");
    const idx=itemObj.getData("itemIdx");
    if(idx !== undefined && idx >= 0) collectedItemIndices.add(idx); // escudos extra (idx=-1) não entram
    itemObj.destroy();
    score+=10; scoreText.setText(`🌟 Pontos: ${score}`);
    if(kind!=="heart"&&kind!=="medalha"){ itemsCollected=Math.min(itemsCollected+1,itemsTotal); itemCountText.setText(`⭐ Itens: ${itemsCollected}/${itemsTotal}`); }
    const lbl=ITEM_LABELS[kind]||{label:"+10 ⭐",color:"#ff6b35"};
    showFloat(sceneRef,playerObj.x,playerObj.y-68,lbl.label,lbl.color);
    if(Math.random()<0.35) showFloat(sceneRef,playerObj.x,playerObj.y-100,pickPraise(),"#ffd700");
    ensureAudio(); SFX.coin();
    // Burst de partículas com cores específicas por tipo
    const tint = ITEM_TINTS[kind] || [0xffd700,0xff6b35,0xffffff,0xa0ff80];
    const qty  = kind==="medalha" ? 22 : kind==="heart" ? 18 : 14;
    const p=sceneRef.add.particles(0,0,"spark_item",{x:playerObj.x,y:playerObj.y,speed:{min:60,max:190},lifespan:420,quantity:qty,scale:{start:1.1,end:0},gravityY:380,tint});
    sceneRef.time.delayedCall(300,()=>p.destroy());
    if(kind==="medalha"){givePower(sceneRef);tipText.setText("🛡️ ESCUDO ATIVO: VanBerto's está protegido e aumentado!");}
    if(kind==="heart"){
      if(lives<MAX_LIVES){
        lives+=1; updateHearts(); ensureAudio(); SFX.life();
        tipText.setText("❤️ Ganhaste uma vida extra!");
        if(heartsGfx&&sceneRef) sceneRef.tweens.add({targets:heartsGfx,scaleX:{from:1,to:1.25},scaleY:{from:1,to:1.25},duration:140,yoyo:true,repeat:1,ease:"Back.easeOut"});
      } else { showFloat(sceneRef,playerObj.x,playerObj.y-100,"❤️ MÁXIMO!","#e84d10"); }
    }
    saveGame();
  }

  function onHitMalware(){
    if(invuln) return;
    ensureAudio(); SFX.hit();
    hitFlash.classList.add("active"); setTimeout(()=>hitFlash.classList.remove("active"),200);
    if(powered){clearPower(sceneRef);setInvuln(sceneRef,800);tipText.setText("🛡️ Escudo usado! Cuidado.");return;}
    lives-=1; updateHearts(); livesLostThisLevel++;
    sceneRef.cameras.main.shake(120,0.006);
    if(heartsGfx&&sceneRef) sceneRef.tweens.add({targets:heartsGfx,x:{from:-4,to:4},duration:60,yoyo:true,repeat:3,ease:"Sine.easeInOut",onComplete:()=>{if(heartsGfx)heartsGfx.x=0;}});
    setInvuln(sceneRef,1200);
    const L=LEVELS[currentLevel];
    touch.left=touch.right=touch.jump=false;
    player.setVelocity(0,0); player.setPosition(L.spawn.x,L.spawn.y); snapPlayerToGround();
    if(lives<=0){showGameOver();return;}
    // Recriar apenas os itens que ainda não foram apanhados
    const keyMap={
      estrela:"item_estrela",
      balao:"item_chupachupa",
      brinquedo:"item_brinquedo",medalha:"item_medalha",heart:"item_heart"
    };
    L.items.forEach((it,idx)=>{
      if(collectedItemIndices.has(idx)) return; // já foi apanhado — não recriar
      // só recriar se não estiver já no grupo
      const exists=itemsGroup.getChildren().some(o=>o.getData("itemIdx")===idx);
      if(exists) return;
      const _km=keyMap[it.kind]; const _key=typeof _km==="function"?_km():(_km||"item_estrela");
      const obj=itemsGroup.create(it.x,it.y,_key);
      obj.setDepth(2);
      sceneRef.tweens.add({targets:obj,y:obj.y-8,duration:940,yoyo:true,repeat:-1,ease:"Sine.easeInOut"});
      obj.setData("kind",it.kind);
      obj.setData("itemIdx",idx);
    });
    saveGame();
  }

  let invulnBlinkEvent=null, invulnEndEvent=null;

  function setInvuln(scene,ms){
    // Cancelar timers anteriores para evitar conflito de alpha
    if(invulnBlinkEvent){ invulnBlinkEvent.remove(false); invulnBlinkEvent=null; }
    if(invulnEndEvent){   invulnEndEvent.remove(false);   invulnEndEvent=null; }

    invuln=true;
    player.setAlpha(1);
    const blinks=Math.floor(ms/160);
    let blinkCount=0;
    invulnBlinkEvent=scene.time.addEvent({
      delay:80,
      repeat:blinks*2,
      callback:()=>{
        blinkCount++;
        // Só pisca se invuln ainda estiver ativo (evita sobrepor o reset final)
        if(!invuln) return;
        if(blinkCount%2===1) player.setAlpha(0.25);
        else player.setAlpha(1);
      }
    });
    invulnEndEvent=scene.time.delayedCall(ms,()=>{
      // Cancelar o blink event primeiro, para garantir que não dispara mais
      if(invulnBlinkEvent){ invulnBlinkEvent.remove(false); invulnBlinkEvent=null; }
      invuln=false;
      player.setAlpha(1);
      player.setScale(powered?1.18:1.0);
      player.clearTint();
      invulnEndEvent=null;
    });
  }

  let poweredCountdownVal=0;
  function givePower(scene){
    powered=true; SFX.power();
    player.clearTint();
    if(powerIndicator) powerIndicator.setText("🛡️ ESCUDO 8s");
    if(poweredTimer) poweredTimer.remove(false);
    if(powerCountdown) powerCountdown.remove(false);
    poweredCountdownVal=8;
    powerCountdown=scene.time.addEvent({delay:1000,loop:true,callback:()=>{
      poweredCountdownVal--;
      if(powerIndicator) powerIndicator.setText(`🛡️ ESCUDO ${poweredCountdownVal}s`);
      if(poweredCountdownVal<=0){clearPower(scene);}
    }});
    poweredTimer=scene.time.delayedCall(8000,()=>clearPower(scene));
  }
  function clearPower(scene){
    powered=false;
    if(poweredTimer){poweredTimer.remove(false);poweredTimer=null;}
    if(powerCountdown){powerCountdown.remove(false);powerCountdown=null;}
    if(player){
      // Matar tweens ativos do player para evitar que um tween de salto/crescimento
      // continue a correr após o super modo acabar e deixe o alpha/scale errado
      if(scene&&scene.tweens) scene.tweens.killTweensOf(player);
      player.clearTint();
      // Só repõe escala e alpha se não estiver em invuln (o invuln trata disso)
      if(!invuln){ player.setScale(1.0); player.setAlpha(1); }
    }
    if(powerIndicator) powerIndicator.setText("");
    if(tipText) tipText.setText(currentLevelTip);
  }

  // ===== Touch =====
  function createTouchInput(scene){
    let downAt=0, anyTouchBtnActive=false; const TAP_MS=190;
    scene.input.on("pointerdown",(p)=>{ensureAudio();if(anyTouchBtnActive)return;downAt=scene.time.now;touch.left=p.x<scene.scale.width/2;touch.right=!touch.left;});
    scene.input.on("pointerup",()=>{if(anyTouchBtnActive)return;const held=scene.time.now-downAt;touch.left=false;touch.right=false;if(held<=TAP_MS)touch.jump=true;});
    scene.input.on("pointerout",()=>{touch.left=false;touch.right=false;touch.jump=false;});
    const btnL=document.getElementById("btnLeft"),btnR=document.getElementById("btnRight"),btnJ=document.getElementById("btnJump");
    if(btnL&&btnR&&btnJ){
      const activeBtns=new Set(), updateActive=()=>{anyTouchBtnActive=activeBtns.size>0;};
      const press=(btn,action,val)=>{
        const start=(e)=>{e.preventDefault();ensureAudio();touch[action]=val;btn.classList.add("pressed");activeBtns.add(btn.id);updateActive();};
        const end=(e)=>{e.preventDefault();touch[action]=false;btn.classList.remove("pressed");activeBtns.delete(btn.id);updateActive();};
        btn.addEventListener("touchstart",start,{passive:false});btn.addEventListener("touchend",end,{passive:false});btn.addEventListener("touchcancel",end,{passive:false});
        btn.addEventListener("mousedown",start);btn.addEventListener("mouseup",end);btn.addEventListener("mouseleave",end);
      };
      press(btnL,"left",true); press(btnR,"right",true);
      const jumpStart=(e)=>{e.preventDefault();ensureAudio();touch.jump=true;btnJ.classList.add("pressed");activeBtns.add(btnJ.id);updateActive();};
      const jumpEnd=(e)=>{e.preventDefault();touch.jump=false;btnJ.classList.remove("pressed");activeBtns.delete(btnJ.id);updateActive()};
      btnJ.addEventListener("touchstart",jumpStart,{passive:false});btnJ.addEventListener("touchend",jumpEnd,{passive:false});btnJ.addEventListener("touchcancel",jumpEnd,{passive:false});
      btnJ.addEventListener("mousedown",jumpStart);btnJ.addEventListener("mouseup",jumpEnd);btnJ.addEventListener("mouseleave",jumpEnd);
    }
  }

  // ===== Animação VanBerto =====
  function scheduleBlink(scene){
    const blinkOnce=()=>{
      if(!player) return;
      player.setTexture("vanberto_blink");
      scene.time.delayedCall(120,()=>{if(player)applyVanBertoTexture(scene);});
      scene.time.delayedCall(2200+Math.floor(Math.random()*2600),blinkOnce);
    };
    scene.time.delayedCall(1800,blinkOnce);
  }

  function applyVanBertoTexture(scene){
    if(!player||!player.body) return;
    if(awaitingQuiz||!startOverlay.classList.contains("hidden")||!historyOverlay.classList.contains("hidden")){
      if(player.texture.key!=="vanberto_open") player.setTexture("vanberto_open"); return;
    }
    const onGround=!!player.body.blocked.down, moving=Math.abs(player.body.velocity.x)>5;
    if(onGround&&moving){
      const step=Math.floor(scene.time.now/140)%2;
      const tex=step===0?"vanberto_walk1":"vanberto_walk2";
      if(player.texture.key!==tex) player.setTexture(tex);
    } else { if(player.texture.key!=="vanberto_open") player.setTexture("vanberto_open"); }
  }

  // ===== TEXTURAS =====

  function rrPath(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y); ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
  }
  function makeTextures(scene){
    makePlatformTexture(scene);
    makeDoorTexture(scene);
    makeVilaosTextures(scene);
    makeSparkTexture(scene);
    makeItemTextures(scene);
    makeVanBertoTexture(scene,"vanberto_open",false,-1);
    makeVanBertoTexture(scene,"vanberto_blink",true,-1);
    makeVanBertoTexture(scene,"vanberto_walk1",false,0);
    makeVanBertoTexture(scene,"vanberto_walk2",false,1);
  }

  // Plataforma colorida estilo cartoon
  function makePlatformTexture(scene){
    if(scene.textures.exists("platform_grass")) return;
    makePlatformTextureThemed(scene,"platform_grass",0);
  }

  // Gera uma textura de plataforma para cada tema
  const PLAT_COLORS=[
    [0x1a3a7a,0x2a52a8,0x80b0ff], // tema0 azul
    [0x7a4a00,0xb87820,0xffe080], // tema1 dourado
    [0x006a5a,0x10a898,0x80ffe0], // tema2 aqua
    [0x801050,0xc04080,0xffb0d0], // tema3 rosa
    [0x3a0870,0x6020b0,0xd0a0ff], // tema4 lilás
    [0x206030,0x30a050,0xa0ffb0], // tema5 verde
    [0x7a2800,0xc05010,0xffa060], // tema6 laranja
    [0x003a7a,0x1060c0,0x80d0ff], // tema7 azul vivo
    [0x6a0040,0xb01070,0xffa0c8], // tema8 magenta
    [0x205010,0x388020,0xb0ff80], // tema9 verde lima
  ];
  function makePlatformTextureThemed(scene, key, themeIdx){
    if(scene.textures.exists(key)) return;
    const [dark, mid, light] = PLAT_COLORS[themeIdx % PLAT_COLORS.length];
    const g=scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x000000,0.28); g.fillRoundedRect(3,23,100,6,3);
    g.fillStyle(dark,1);        g.fillRoundedRect(0,6,100,18,5);
    g.fillStyle(mid,1);         g.fillRoundedRect(0,0,100,10,5);
    g.lineStyle(2,light,0.55);  g.beginPath(); g.moveTo(4,2); g.lineTo(96,2); g.strokePath();
    g.fillStyle(dark,1);        g.fillRoundedRect(0,20,100,4,{bl:5,br:5,tl:0,tr:0});
    g.lineStyle(2,dark,1);      g.strokeRoundedRect(0,0,100,24,5);
    g.generateTexture(key,100,28); g.destroy();
  }

  // Porta — estilo festa/balões
  function makeDoorTexture(scene){
    if(scene.textures.exists("door_party")) return;
    const w=72,h=90, tex=scene.textures.createCanvas("door_party",w,h), ctx=tex.getContext();
    // === Porta — estilo festa festiva ===
    // Moldura exterior (arco-íris, borda dupla)
    ctx.shadowColor="rgba(255,215,0,0.5)"; ctx.shadowBlur=10;
    const borderGrad=ctx.createLinearGradient(0,0,0,h);
    borderGrad.addColorStop(0,"#ff6b35"); borderGrad.addColorStop(0.25,"#ffd700");
    borderGrad.addColorStop(0.5,"#80ff80"); borderGrad.addColorStop(0.75,"#80d0ff");
    borderGrad.addColorStop(1,"#c080ff");
    ctx.fillStyle=borderGrad; rrPath(ctx,0,0,w,h,12); ctx.fill();
    ctx.shadowBlur=0;
    // Borda interna dourada
    ctx.fillStyle="#ffd700"; rrPath(ctx,3,3,w-6,h-6,10); ctx.fill();
    // Painel principal da porta (azul escuro rico)
    const doorBg=ctx.createLinearGradient(0,8,0,h-4);
    doorBg.addColorStop(0,"#1a0850"); doorBg.addColorStop(1,"#0a0330");
    ctx.fillStyle=doorBg; rrPath(ctx,6,6,w-12,h-12,8); ctx.fill();
    // Brilho de vidro no topo
    const glassGr=ctx.createLinearGradient(8,8,8,32);
    glassGr.addColorStop(0,"rgba(255,255,255,0.28)"); glassGr.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=glassGr; rrPath(ctx,8,8,w-16,26,6); ctx.fill();
    // === Arco de balões no topo ===
    const bColors=["#ff6b35","#ffd700","#ff80c0","#80d0ff","#a0ff80"];
    const bPositions=[[14,22],[22,14],[36,10],[50,14],[58,22]];
    bPositions.forEach(([bx,by],i)=>{
      // Fio
      ctx.strokeStyle="rgba(255,255,255,0.35)"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bx,by+9); ctx.quadraticCurveTo(bx+2,by+20,36,42); ctx.stroke();
      // Balão
      const bg=ctx.createRadialGradient(bx-2,by-2,1,bx,by,8);
      bg.addColorStop(0,"rgba(255,255,255,0.5)"); bg.addColorStop(0.3,bColors[i]); bg.addColorStop(1,bColors[i]+"aa");
      ctx.fillStyle=bg; ctx.beginPath(); ctx.ellipse(bx,by,7,9,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="rgba(0,0,0,0.15)"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.ellipse(bx,by,7,9,0,0,Math.PI*2); ctx.stroke();
      // Brilho
      ctx.fillStyle="rgba(255,255,255,0.5)";
      ctx.beginPath(); ctx.ellipse(bx-2,by-3,2.5,3,Math.PI/4,0,Math.PI*2); ctx.fill();
    });
    // === Estrela grande central ===
    ctx.save(); ctx.translate(36,52);
    ctx.shadowColor="#ffd700"; ctx.shadowBlur=12;
    const starGr=ctx.createRadialGradient(0,0,1,0,0,14);
    starGr.addColorStop(0,"#fffbe0"); starGr.addColorStop(0.5,"#ffd700"); starGr.addColorStop(1,"#ff9500");
    ctx.fillStyle=starGr;
    ctx.beginPath();
    for(let j=0;j<5;j++){
      const o=Math.PI*2*j/5-Math.PI/2, inn=o+Math.PI/5;
      j===0?ctx.moveTo(Math.cos(o)*14,Math.sin(o)*14):ctx.lineTo(Math.cos(o)*14,Math.sin(o)*14);
      ctx.lineTo(Math.cos(inn)*6,Math.sin(inn)*6);
    }
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
    // Texto "🎊" — mini confetti
    ctx.font="12px sans-serif"; ctx.textAlign="center";
    ctx.fillText("🎊",36,75);
    // === Maçaneta elegante ===
    // Placa
    ctx.fillStyle="#ffd700";
    ctx.beginPath(); ctx.roundRect(44,62,14,8,3); ctx.fill();
    ctx.strokeStyle="#c07000"; ctx.lineWidth=1.2; ctx.stroke();
    // Maçaneta
    const kGr=ctx.createRadialGradient(49,64,1,51,66,5);
    kGr.addColorStop(0,"#fffbe0"); kGr.addColorStop(1,"#c89000");
    ctx.fillStyle=kGr; ctx.beginPath(); ctx.arc(51,66,4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="#a07000"; ctx.lineWidth=1.2; ctx.stroke();
    // Parafusos decorativos nos cantos
    [[9,9],[63,9],[9,81],[63,81]].forEach(([sx,sy])=>{
      ctx.fillStyle="rgba(255,215,0,0.5)";
      ctx.beginPath(); ctx.arc(sx,sy,2.5,0,Math.PI*2); ctx.fill();
    });
    tex.refresh();
  }

  // Vilões — coloridos mas assustadores
  function makeVilaosTextures(scene){

    // helper: olhos malvados com sobrancelhas
    function evilEyes(ctx,cx,cy,eyeColor){
      // Sobrancelhas malvadas (inclinadas para dentro)
      ctx.strokeStyle="#000"; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(cx-12,cy-9); ctx.lineTo(cx-5,cy-5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+12,cy-9); ctx.lineTo(cx+5,cy-5); ctx.stroke();
      // Brancos dos olhos
      ctx.fillStyle="#fff";
      ctx.beginPath(); ctx.ellipse(cx-6,cy,5,6,Math.PI*0.1,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+6,cy,5,6,-Math.PI*0.1,0,Math.PI*2); ctx.fill();
      // Pupilas
      ctx.fillStyle=eyeColor;
      ctx.beginPath(); ctx.ellipse(cx-6,cy+1,3,4,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+6,cy+1,3,4,0,0,Math.PI*2); ctx.fill();
      // Brilho pupila
      ctx.fillStyle="rgba(255,255,255,0.6)";
      ctx.beginPath(); ctx.arc(cx-7,cy-1,1.2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+5,cy-1,1.2,0,Math.PI*2); ctx.fill();
    }

    // helper: boca malvada com dentes
    function evilMouth(ctx,cx,cy,color){
      ctx.fillStyle="#1a0000";
      ctx.beginPath(); ctx.arc(cx,cy,9,0,Math.PI); ctx.fill();
      // Dentes
      ctx.fillStyle="#ffffff";
      for(let d=0;d<4;d++) ctx.fillRect(cx-8+d*4,cy,3,5);
      ctx.strokeStyle=color; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(cx,cy,9,0,Math.PI); ctx.stroke();
    }

    // ── Vilão Redondo (lilás) ─────────────────────────────────────
    if(!scene.textures.exists("vilao_round")){
      const tex=scene.textures.createCanvas("vilao_round",64,64), ctx=tex.getContext();
      const cx=32,cy=32;
      // Aura pulsante
      ctx.fillStyle="rgba(160,0,255,0.14)"; ctx.beginPath(); ctx.arc(cx,cy,30,0,Math.PI*2); ctx.fill();
      // Corpo com gradiente radial
      const gr=ctx.createRadialGradient(cx-7,cy-7,3,cx,cy,23);
      gr.addColorStop(0,"#e090ff"); gr.addColorStop(0.5,"#9020e0"); gr.addColorStop(1,"#4a0080");
      ctx.beginPath(); ctx.arc(cx,cy,23,0,Math.PI*2); ctx.fillStyle=gr; ctx.fill();
      // Tentáculos
      for(let i=0;i<8;i++){
        const a=Math.PI*2*i/8;
        const grt=ctx.createLinearGradient(
          cx+Math.cos(a)*23,cy+Math.sin(a)*23,
          cx+Math.cos(a)*34,cy+Math.sin(a)*34);
        grt.addColorStop(0,"#c060ff"); grt.addColorStop(1,"rgba(160,0,255,0)");
        ctx.strokeStyle=grt; ctx.lineWidth=4;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(a)*22,cy+Math.sin(a)*22);
        ctx.quadraticCurveTo(
          cx+Math.cos(a+0.3)*28+Math.cos(a+Math.PI/2)*4,
          cy+Math.sin(a+0.3)*28+Math.sin(a+Math.PI/2)*4,
          cx+Math.cos(a)*34,cy+Math.sin(a)*34);
        ctx.stroke();
        ctx.fillStyle="#e090ff";
        ctx.beginPath(); ctx.arc(cx+Math.cos(a)*34,cy+Math.sin(a)*34,3.5,0,Math.PI*2); ctx.fill();
      }
      // Brilho corpo
      ctx.fillStyle="rgba(255,255,255,0.18)";
      ctx.beginPath(); ctx.ellipse(cx-8,cy-8,10,14,Math.PI*0.3,0,Math.PI*2); ctx.fill();
      // Contorno
      ctx.strokeStyle="#2a005a"; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(cx,cy,23,0,Math.PI*2); ctx.stroke();
      // Cara
      evilEyes(ctx,cx,cy-2,"#cc00ff");
      evilMouth(ctx,cx,cy+9,"#7000c0");
      tex.refresh();
    }

    // ── Vilão Espinhoso (laranja-vermelho) ───────────────────────
    if(!scene.textures.exists("vilao_spike")){
      const tex=scene.textures.createCanvas("vilao_spike",64,64), ctx=tex.getContext();
      const cx=32,cy=34;
      // Aura
      ctx.fillStyle="rgba(220,80,0,0.14)"; ctx.beginPath(); ctx.arc(cx,cy,30,0,Math.PI*2); ctx.fill();
      // Corpo
      const gr=ctx.createRadialGradient(cx-5,cy-5,2,cx,cy,21);
      gr.addColorStop(0,"#ffc060"); gr.addColorStop(0.5,"#e05010"); gr.addColorStop(1,"#7a1800");
      ctx.beginPath(); ctx.arc(cx,cy,21,0,Math.PI*2); ctx.fillStyle=gr; ctx.fill();
      // Espinhos com gradiente
      for(let i=0;i<7;i++){
        const a=Math.PI*2*i/7-Math.PI/7;
        ctx.save(); ctx.translate(cx+Math.cos(a)*21,cy+Math.sin(a)*21); ctx.rotate(a+Math.PI/2);
        const grs=ctx.createLinearGradient(0,0,0,16);
        grs.addColorStop(0,"#ff8040"); grs.addColorStop(1,"#cc2000");
        ctx.fillStyle=grs;
        ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(6,0); ctx.lineTo(0,-16); ctx.closePath(); ctx.fill();
        ctx.strokeStyle="#8a1000"; ctx.lineWidth=1; ctx.stroke();
        ctx.restore();
      }
      // Brilho
      ctx.fillStyle="rgba(255,220,150,0.22)";
      ctx.beginPath(); ctx.ellipse(cx-7,cy-7,9,12,Math.PI*0.3,0,Math.PI*2); ctx.fill();
      // Contorno
      ctx.strokeStyle="#5a1000"; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(cx,cy,21,0,Math.PI*2); ctx.stroke();
      // Cara
      evilEyes(ctx,cx,cy-3,"#cc2000");
      evilMouth(ctx,cx,cy+8,"#8a1000");
      tex.refresh();
    }

    // ── Vilão Bug (verde ácido) ───────────────────────────────────
    if(!scene.textures.exists("vilao_bug")){
      const tex=scene.textures.createCanvas("vilao_bug",64,64), ctx=tex.getContext();
      const cx=32,cy=32;
      // Aura
      ctx.fillStyle="rgba(0,180,0,0.12)"; ctx.beginPath(); ctx.arc(cx,cy,30,0,Math.PI*2); ctx.fill();
      // Corpo
      const gr=ctx.createRadialGradient(cx-5,cy-5,3,cx,cy,21);
      gr.addColorStop(0,"#90ff50"); gr.addColorStop(0.5,"#30b020"); gr.addColorStop(1,"#0a5000");
      ctx.beginPath(); ctx.arc(cx,cy,21,0,Math.PI*2); ctx.fillStyle=gr; ctx.fill();
      // Patas laterais (3 de cada lado)
      ctx.strokeStyle="#1a6010"; ctx.lineWidth=2.5;
      [[-1,0],[0,0],[1,0]].forEach(([_,__],pi)=>{
        const py=cy-6+pi*7;
        ctx.beginPath(); ctx.moveTo(cx-21,py); ctx.quadraticCurveTo(cx-28,py-4,cx-33,py+3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+21,py); ctx.quadraticCurveTo(cx+28,py-4,cx+33,py+3); ctx.stroke();
        // Garras
        ctx.fillStyle="#0a5000";
        ctx.beginPath(); ctx.arc(cx-33,py+3,3,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+33,py+3,3,0,Math.PI*2); ctx.fill();
      });
      // Antenas curvas
      ctx.strokeStyle="#0a5000"; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(cx-6,cy-19); ctx.quadraticCurveTo(cx-16,cy-34,cx-10,cy-42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+6,cy-19); ctx.quadraticCurveTo(cx+16,cy-34,cx+10,cy-42); ctx.stroke();
      // Pontas antenas
      ctx.fillStyle="#ff6b35";
      ctx.beginPath(); ctx.arc(cx-10,cy-42,5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+10,cy-42,5,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="#c04000"; ctx.lineWidth=1; ctx.stroke();
      // Brilho corpo
      ctx.fillStyle="rgba(200,255,150,0.22)";
      ctx.beginPath(); ctx.ellipse(cx-7,cy-7,9,12,Math.PI*0.3,0,Math.PI*2); ctx.fill();
      // Segmento ventral
      ctx.strokeStyle="rgba(0,60,0,0.4)"; ctx.lineWidth=1.5;
      for(let s=0;s<3;s++){
        ctx.beginPath(); ctx.ellipse(cx,cy-4+s*8,15,3,0,0,Math.PI); ctx.stroke();
      }
      // Contorno
      ctx.strokeStyle="#064a00"; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(cx,cy,21,0,Math.PI*2); ctx.stroke();
      // Cara
      evilEyes(ctx,cx,cy-2,"#005000");
      evilMouth(ctx,cx,cy+9,"#0a5000");
      tex.refresh();
    }
  }

  function makeSparkTexture(scene){
    if(scene.textures.exists("spark_item")) return;
    const g=scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xffd700,1);
    g.beginPath();
    for(let _i=0;_i<5;_i++){
      const _o=Math.PI*2*_i/5-Math.PI/2, _in=_o+Math.PI/5;
      _i===0?g.moveTo(8+Math.cos(_o)*8,8+Math.sin(_o)*8):g.lineTo(8+Math.cos(_o)*8,8+Math.sin(_o)*8);
      g.lineTo(8+Math.cos(_in)*3,8+Math.sin(_in)*3);
    }
    g.closePath(); g.fillPath();
    g.generateTexture("spark_item",16,16); g.destroy();
  }

  function makeItemTextures(scene){
    // Estrela
    if(!scene.textures.exists("item_estrela")){
      const tex=scene.textures.createCanvas("item_estrela",36,36), ctx=tex.getContext();
      ctx.fillStyle="#ffd700"; ctx.shadowColor="#ff6b35"; ctx.shadowBlur=8;
      ctx.save(); ctx.translate(18,18);
      ctx.beginPath();
      for(let j=0;j<5;j++){
        const o=Math.PI*2*j/5-Math.PI/2, i=o+Math.PI/5;
        j===0?ctx.moveTo(Math.cos(o)*16,Math.sin(o)*16):ctx.lineTo(Math.cos(o)*16,Math.sin(o)*16);
        ctx.lineTo(Math.cos(i)*7,Math.sin(i)*7);
      }
      ctx.closePath(); ctx.fill(); ctx.restore(); ctx.shadowBlur=0;
      ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(13,11,4,0,Math.PI*2); ctx.fill();
      tex.refresh();
    }
    // Balões 🎈 flutuantes — 6 cores
    const BALAO_COLORS=[
      {hi:"#ff9080", lo:"#e84d10", stroke:"#b03000"}, // laranja-vermelho
      {hi:"#ffe080", lo:"#ffd700", stroke:"#b09000"}, // amarelo
      {hi:"#ff90d0", lo:"#e0209a", stroke:"#900060"}, // rosa
      {hi:"#90d0ff", lo:"#1a90e0", stroke:"#005090"}, // azul
      {hi:"#90ffb0", lo:"#20c060", stroke:"#008030"}, // verde
      {hi:"#d0a0ff", lo:"#9030e0", stroke:"#500090"}, // lilás
    ];
    BALAO_COLORS.forEach((bc,ci)=>{
      const key="item_balao_"+ci;
      if(scene.textures.exists(key)) return;
      const tex=scene.textures.createCanvas(key,32,46), ctx=tex.getContext();
      // Corpo do balão
      const gr=ctx.createRadialGradient(10,11,2,16,16,14);
      gr.addColorStop(0,bc.hi); gr.addColorStop(1,bc.lo);
      ctx.fillStyle=gr;
      ctx.beginPath(); ctx.ellipse(16,16,13,15,0,0,Math.PI*2); ctx.fill();
      // Contorno
      ctx.strokeStyle=bc.stroke; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.ellipse(16,16,13,15,0,0,Math.PI*2); ctx.stroke();
      // Brilho oval
      ctx.fillStyle="rgba(255,255,255,0.55)";
      ctx.beginPath(); ctx.ellipse(10,9,4,6,Math.PI/4,0,Math.PI*2); ctx.fill();
      // Brilho pequeno secundário
      ctx.fillStyle="rgba(255,255,255,0.25)";
      ctx.beginPath(); ctx.ellipse(20,11,2.5,3.5,Math.PI/5,0,Math.PI*2); ctx.fill();
      // Nozinho na base
      ctx.fillStyle=bc.lo;
      ctx.beginPath(); ctx.arc(16,31,3,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=bc.stroke; ctx.lineWidth=1; ctx.stroke();
      // Fio
      ctx.strokeStyle=bc.stroke; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(16,31);
      ctx.quadraticCurveTo(18,38,16,44); ctx.stroke();
      tex.refresh();
    });
    // Chupa-chupa 🍭 — item fixo nas plataformas
    if(!scene.textures.exists("item_chupachupa")){
      const tex=scene.textures.createCanvas("item_chupachupa",48,48), ctx=tex.getContext();
      ctx.font="40px serif";
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      ctx.fillText("🍭", 24, 26);
      tex.refresh();
    }
    // Brinquedo — ursinho de peluche 🧸 completo (com pernas)
    if(!scene.textures.exists("item_brinquedo")){
      const tex=scene.textures.createCanvas("item_brinquedo",44,48), ctx=tex.getContext();
      const C="#c07030", CL="#e8a860", CI="#e8905a", CD="#8b4a00";

      // --- PERNAS (atrás do corpo) ---
      ctx.fillStyle=C;
      ctx.beginPath(); ctx.ellipse(14,41,5,6,Math.PI*0.08,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(30,41,5,6,-Math.PI*0.08,0,Math.PI*2); ctx.fill();
      // Patinhas
      ctx.fillStyle=CI;
      ctx.beginPath(); ctx.ellipse(14,46,5,3,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(30,46,5,3,0,0,Math.PI*2); ctx.fill();

      // --- CORPO ---
      const bodyGr=ctx.createRadialGradient(19,28,2,22,28,14);
      bodyGr.addColorStop(0,CL); bodyGr.addColorStop(1,C);
      ctx.beginPath(); ctx.ellipse(22,29,13,12,0,0,Math.PI*2); ctx.fillStyle=bodyGr; ctx.fill();
      // Barriga clara
      ctx.beginPath(); ctx.ellipse(22,31,7,6,0,0,Math.PI*2); ctx.fillStyle="rgba(255,220,160,0.75)"; ctx.fill();

      // --- BRAÇOS ---
      ctx.fillStyle=C;
      ctx.beginPath(); ctx.ellipse(10,27,4,6,Math.PI*0.2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(34,27,4,6,-Math.PI*0.2,0,Math.PI*2); ctx.fill();
      // Mãozinhas
      ctx.fillStyle=CI;
      ctx.beginPath(); ctx.arc(8,31,3.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(36,31,3.5,0,Math.PI*2); ctx.fill();

      // --- CABEÇA ---
      const headGr=ctx.createRadialGradient(19,15,2,22,16,11);
      headGr.addColorStop(0,CL); headGr.addColorStop(1,C);
      ctx.beginPath(); ctx.arc(22,16,11,0,Math.PI*2); ctx.fillStyle=headGr; ctx.fill();

      // Orelhas
      ctx.fillStyle=C;
      ctx.beginPath(); ctx.arc(13,8,5.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(31,8,5.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=CI;
      ctx.beginPath(); ctx.arc(13,8,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(31,8,3,0,Math.PI*2); ctx.fill();

      // Focinho
      ctx.beginPath(); ctx.ellipse(22,20,5.5,4,0,0,Math.PI*2); ctx.fillStyle="#d08050"; ctx.fill();
      // Nariz
      ctx.beginPath(); ctx.arc(22,17.5,2.5,0,Math.PI*2); ctx.fillStyle="#2a1000"; ctx.fill();
      // Boca
      ctx.strokeStyle="#2a1000"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(19,21); ctx.quadraticCurveTo(22,24,25,21); ctx.stroke();

      // Olhos brilhantes
      ctx.fillStyle="#2a1000";
      ctx.beginPath(); ctx.arc(17,14,2.8,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(27,14,2.8,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ffffff";
      ctx.beginPath(); ctx.arc(18,13,1.1,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(28,13,1.1,0,Math.PI*2); ctx.fill();

      // Contornos suaves
      ctx.strokeStyle=CD; ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.arc(22,16,11,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(22,29,13,12,0,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(14,41,5,6,Math.PI*0.08,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(30,41,5,6,-Math.PI*0.08,0,Math.PI*2); ctx.stroke();
      tex.refresh();
    }
    // Escudo — canvas 52×58, forma classica de escudo heraldico
    if(!scene.textures.exists("item_medalha")){
      const tex=scene.textures.createCanvas("item_medalha",52,58), ctx=tex.getContext();
      const cx=26, cy=26;

      // Funcao auxiliar para desenhar a forma do escudo
      function shieldPath(ctx, x, y, w, h){
        const r=w*0.18;
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.lineTo(x+w-r, y);
        ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h*0.55);
        // Curva inferior que forma a ponta do escudo
        ctx.quadraticCurveTo(x+w, y+h*0.82, x+w/2, y+h);
        ctx.quadraticCurveTo(x, y+h*0.82, x, y+h*0.55);
        ctx.lineTo(x, y+r);
        ctx.quadraticCurveTo(x, y, x+r, y);
        ctx.closePath();
      }

      // Sombra exterior
      ctx.shadowColor="rgba(255,215,0,0.55)"; ctx.shadowBlur=8;
      // Borda exterior dourada
      const borderGr=ctx.createLinearGradient(0,0,0,54);
      borderGr.addColorStop(0,"#ffe060"); borderGr.addColorStop(1,"#c07000");
      ctx.fillStyle=borderGr; shieldPath(ctx,1,1,50,54); ctx.fill();
      ctx.shadowBlur=0;

      // Corpo do escudo — gradiente azul real
      const bodyGr=ctx.createLinearGradient(4,4,4,50);
      bodyGr.addColorStop(0,"#4a90e8"); bodyGr.addColorStop(0.5,"#1a50b8"); bodyGr.addColorStop(1,"#0a2878");
      ctx.fillStyle=bodyGr; shieldPath(ctx,4,4,44,50); ctx.fill();

      // Reflexo de luz no topo esquerdo
      ctx.fillStyle="rgba(255,255,255,0.28)";
      ctx.beginPath(); ctx.ellipse(16,14,9,13,Math.PI*0.15,0,Math.PI*2); ctx.fill();

      // Divisao central horizontal (cruz do escudo — faixa horizontal)
      ctx.fillStyle="rgba(255,215,0,0.22)";
      ctx.fillRect(4,24,44,6);
      // Divisao central vertical
      ctx.fillRect(23,4,6,50);

      // Estrela dourada no centro
      ctx.save(); ctx.translate(cx, cy+4);
      ctx.shadowColor="#ffd700"; ctx.shadowBlur=6;
      const sg=ctx.createRadialGradient(-1,-2,1,0,0,10);
      sg.addColorStop(0,"#ffffff"); sg.addColorStop(0.35,"#ffe060"); sg.addColorStop(1,"#ffa000");
      ctx.fillStyle=sg;
      ctx.beginPath();
      for(let j=0;j<5;j++){
        const o=Math.PI*2*j/5-Math.PI/2, inn=o+Math.PI/5;
        j===0?ctx.moveTo(Math.cos(o)*11,Math.sin(o)*11):ctx.lineTo(Math.cos(o)*11,Math.sin(o)*11);
        ctx.lineTo(Math.cos(inn)*5,Math.sin(inn)*5);
      }
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur=0;
      ctx.restore();

      // Contorno exterior dourado
      ctx.strokeStyle="#ffd700"; ctx.lineWidth=2.5;
      shieldPath(ctx,4,4,44,50); ctx.stroke();
      // Linha de brilho interior
      ctx.strokeStyle="rgba(255,255,255,0.35)"; ctx.lineWidth=1.2;
      shieldPath(ctx,7,7,38,44); ctx.stroke();

      tex.refresh();
    }
    // Borboleta — 48×40, asas coloridas com padrão
    const BUTTERFLY_COLORS=[
      {top:"#ff80c0",bot:"#e0209a",pat:"#ffd700",stroke:"#800040"}, // rosa
      {top:"#80d0ff",bot:"#1a90e0",pat:"#ffffff",stroke:"#004090"}, // azul
      {top:"#a0ff80",bot:"#20c060",pat:"#ffd700",stroke:"#006030"}, // verde
      {top:"#ffd700",bot:"#ff9500",pat:"#ffffff",stroke:"#804000"}, // laranja-dourado
      {top:"#d0a0ff",bot:"#9030e0",pat:"#ffe080",stroke:"#400080"}, // lilás
    ];
    BUTTERFLY_COLORS.forEach((bc,ci)=>{
      const key="item_borboleta_"+ci;
      if(scene.textures.exists(key)) return;
      const tex=scene.textures.createCanvas(key,48,40), ctx=tex.getContext();
      // Asa superior esquerda
      const grTL=ctx.createRadialGradient(14,14,2,12,16,14);
      grTL.addColorStop(0,bc.top); grTL.addColorStop(1,bc.bot);
      ctx.fillStyle=grTL;
      ctx.beginPath(); ctx.moveTo(24,20);
      ctx.bezierCurveTo(20,8,2,4,2,16);
      ctx.bezierCurveTo(2,24,14,26,24,20);
      ctx.fill();
      // Asa superior direita
      const grTR=ctx.createRadialGradient(34,14,2,36,16,14);
      grTR.addColorStop(0,bc.top); grTR.addColorStop(1,bc.bot);
      ctx.fillStyle=grTR;
      ctx.beginPath(); ctx.moveTo(24,20);
      ctx.bezierCurveTo(28,8,46,4,46,16);
      ctx.bezierCurveTo(46,24,34,26,24,20);
      ctx.fill();
      // Asa inferior esquerda
      ctx.fillStyle=bc.bot;
      ctx.beginPath(); ctx.moveTo(24,20);
      ctx.bezierCurveTo(18,24,4,28,6,36);
      ctx.bezierCurveTo(8,40,20,36,24,20);
      ctx.fill();
      // Asa inferior direita
      ctx.beginPath(); ctx.moveTo(24,20);
      ctx.bezierCurveTo(30,24,44,28,42,36);
      ctx.bezierCurveTo(40,40,28,36,24,20);
      ctx.fill();
      // Padrões nas asas (círculos)
      ctx.fillStyle=bc.pat; ctx.globalAlpha=0.6;
      ctx.beginPath(); ctx.arc(13,14,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(35,14,4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(11,28,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(37,28,3,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      // Contornos das asas
      ctx.strokeStyle=bc.stroke; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(24,20);
      ctx.bezierCurveTo(20,8,2,4,2,16);
      ctx.bezierCurveTo(2,24,14,26,24,20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24,20);
      ctx.bezierCurveTo(28,8,46,4,46,16);
      ctx.bezierCurveTo(46,24,34,26,24,20); ctx.stroke();
      // Corpo (abdómen)
      ctx.fillStyle="#1a1a1a";
      ctx.beginPath(); ctx.ellipse(24,20,3,10,0,0,Math.PI*2); ctx.fill();
      // Cabeça
      ctx.fillStyle="#2a2a2a";
      ctx.beginPath(); ctx.arc(24,11,3,0,Math.PI*2); ctx.fill();
      // Antenas
      ctx.strokeStyle="#1a1a1a"; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.moveTo(24,9); ctx.quadraticCurveTo(18,2,14,1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24,9); ctx.quadraticCurveTo(30,2,34,1); ctx.stroke();
      ctx.fillStyle=bc.pat;
      ctx.beginPath(); ctx.arc(14,1,2.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(34,1,2.5,0,Math.PI*2); ctx.fill();
      tex.refresh();
    });

    // Abelha — 44×40, listras amarelas e pretas, asas transparentes
    if(!scene.textures.exists("item_abelha")){
      // Abelha desenhada na horizontal (como emoji 🐝): cabeça à direita, ferrão à esquerda
      // Canvas 56×36
      const tex=scene.textures.createCanvas("item_abelha",56,36), ctx=tex.getContext();
      const bx=28, by=18; // centro

      // --- ASAS (em cima do corpo, semi-transparentes) ---
      ctx.fillStyle="rgba(210,245,255,0.80)";
      ctx.strokeStyle="rgba(80,160,220,0.85)"; ctx.lineWidth=1;
      // Asa superior esquerda (maior)
      ctx.beginPath(); ctx.ellipse(bx-2, by-11, 11, 6, Math.PI*0.15, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      // Asa superior direita (maior)
      ctx.beginPath(); ctx.ellipse(bx+10, by-11, 11, 6, -Math.PI*0.15, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      // Asa inferior esquerda (menor)
      ctx.beginPath(); ctx.ellipse(bx-3, by-4, 7, 4, Math.PI*0.2, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      // Asa inferior direita (menor)
      ctx.beginPath(); ctx.ellipse(bx+9, by-4, 7, 4, -Math.PI*0.2, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();

      // --- ABDÓMEN (oval horizontal, listras) ---
      const abdGr=ctx.createRadialGradient(bx-6,by-2,2,bx-4,by,12);
      abdGr.addColorStop(0,"#ffe566"); abdGr.addColorStop(1,"#d49000");
      ctx.fillStyle=abdGr;
      ctx.beginPath(); ctx.ellipse(bx-6, by, 13, 9, 0, 0, Math.PI*2); ctx.fill();
      // Listras pretas horizontais (clip ao abdómen)
      ctx.save();
      ctx.beginPath(); ctx.ellipse(bx-6, by, 13, 9, 0, 0, Math.PI*2); ctx.clip();
      ctx.fillStyle="rgba(15,15,15,0.80)";
      [-4, 1, 6].forEach(dx=>{
        ctx.fillRect(bx-6+dx-1, by-9, 3, 18);
      });
      ctx.restore();
      // Contorno abdómen
      ctx.strokeStyle="#8a5500"; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.ellipse(bx-6, by, 13, 9, 0, 0, Math.PI*2); ctx.stroke();

      // --- FERRÃO (ponta à esquerda) ---
      ctx.fillStyle="#b07800";
      ctx.beginPath();
      ctx.moveTo(bx-19, by);
      ctx.lineTo(bx-14, by-3);
      ctx.lineTo(bx-14, by+3);
      ctx.closePath(); ctx.fill();

      // --- TÓRAX (peludo, ligação entre abdómen e cabeça) ---
      const torGr=ctx.createRadialGradient(bx+7,by-2,1,bx+8,by,7);
      torGr.addColorStop(0,"#a07020"); torGr.addColorStop(1,"#4a2800");
      ctx.fillStyle=torGr;
      ctx.beginPath(); ctx.ellipse(bx+8, by, 7, 8, 0, 0, Math.PI*2); ctx.fill();
      // Pelos do tórax
      ctx.strokeStyle="rgba(220,180,0,0.55)"; ctx.lineWidth=0.9;
      for(let pi=0;pi<6;pi++){
        const pa=Math.PI*2*pi/6;
        ctx.beginPath();
        ctx.moveTo(bx+8+Math.cos(pa)*5, by+Math.sin(pa)*6);
        ctx.lineTo(bx+8+Math.cos(pa)*8, by+Math.sin(pa)*9);
        ctx.stroke();
      }

      // --- CABEÇA (à direita, amarela) ---
      const headGr=ctx.createRadialGradient(bx+17,by-2,1,bx+18,by,7);
      headGr.addColorStop(0,"#fff0a0"); headGr.addColorStop(1,"#e8a800");
      ctx.fillStyle=headGr;
      ctx.beginPath(); ctx.arc(bx+18, by, 7, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle="#8a5500"; ctx.lineWidth=1.1; ctx.stroke();

      // Olho (único, virado para a direita)
      ctx.fillStyle="#1a1000";
      ctx.beginPath(); ctx.arc(bx+21, by-1, 2.8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.75)";
      ctx.beginPath(); ctx.arc(bx+22, by-2, 1.1, 0, Math.PI*2); ctx.fill();

      // Antena (saindo da cabeça para a direita/cima)
      ctx.strokeStyle="#5a3000"; ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.moveTo(bx+22, by-6);
      ctx.quadraticCurveTo(bx+26, by-14, bx+28, by-16); ctx.stroke();
      ctx.fillStyle="#ffd700";
      ctx.beginPath(); ctx.arc(bx+28, by-16, 2.5, 0, Math.PI*2); ctx.fill();

      tex.refresh();
    }

    // Coração — vermelho vivo, grande, com brilho e gradiente
    if(!scene.textures.exists("item_heart")){
      const tex=scene.textures.createCanvas("item_heart",44,40), ctx=tex.getContext();
      const cx=22, cy=20;

      // Função para desenhar o coração centrado
      function heartPath(){
        ctx.beginPath();
        ctx.moveTo(cx, cy+12);
        // Lado esquerdo
        ctx.bezierCurveTo(cx-2, cy+10, cx-14, cy+4, cx-14, cy-4);
        ctx.bezierCurveTo(cx-14, cy-13, cx-6, cy-15, cx, cy-8);
        // Lado direito
        ctx.bezierCurveTo(cx+6, cy-15, cx+14, cy-13, cx+14, cy-4);
        ctx.bezierCurveTo(cx+14, cy+4, cx+2, cy+10, cx, cy+12);
        ctx.closePath();
      }

      // Sombra exterior rosada
      ctx.shadowColor="rgba(255,80,80,0.55)"; ctx.shadowBlur=10;
      const hg=ctx.createRadialGradient(cx-3,cy-5,2,cx,cy,16);
      hg.addColorStop(0,"#ff6080");
      hg.addColorStop(0.4,"#ff2040");
      hg.addColorStop(0.8,"#cc0020");
      hg.addColorStop(1,"#990010");
      ctx.fillStyle=hg;
      heartPath(); ctx.fill();
      ctx.shadowBlur=0;

      // Contorno fino
      ctx.strokeStyle="rgba(140,0,20,0.5)"; ctx.lineWidth=1.2;
      heartPath(); ctx.stroke();

      // Brilho principal (oval branco no canto superior esquerdo)
      ctx.fillStyle="rgba(255,255,255,0.55)";
      ctx.beginPath(); ctx.ellipse(cx-5,cy-6,5,7,Math.PI*0.35,0,Math.PI*2); ctx.fill();

      // Brilho secundário (pequeno)
      ctx.fillStyle="rgba(255,255,255,0.30)";
      ctx.beginPath(); ctx.ellipse(cx+4,cy-3,3,4,Math.PI*0.2,0,Math.PI*2); ctx.fill();

      tex.refresh();
    }
  }

  // ===== VanBerto — robozinho 100% original do jogo da UE =====
  function rrVan(ctx,x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }
  function cVan(ctx,x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function cfVan(ctx,x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  function lVan(ctx,x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}

  function makeVanBertoTexture(scene,key,blink,step){
    if(scene.textures.exists(key)) return;
    const w=96,h=96, tex=scene.textures.createCanvas(key,w,h), ctx=tex.getContext();
    ctx.clearRect(0,0,w,h);
    const bodyGrad=ctx.createLinearGradient(0,38,0,88); bodyGrad.addColorStop(0,"#e5f2ff"); bodyGrad.addColorStop(1,"#bfdbfe");
    const headGrad=ctx.createLinearGradient(0,14,0,48); headGrad.addColorStop(0,"#e5f2ff"); headGrad.addColorStop(1,"#bfdbfe");
    rrVan(ctx,26,14,44,34,18); ctx.fillStyle=headGrad; ctx.fill();
    const visorGrad=ctx.createLinearGradient(30,20,66,38); visorGrad.addColorStop(0,"#22d3ee"); visorGrad.addColorStop(1,"#38bdf8");
    rrVan(ctx,32,22,32,18,10); ctx.fillStyle=visorGrad; ctx.fill();
    if(blink){ctx.globalAlpha=0.85;rrVan(ctx,32,22,32,18,10);ctx.fillStyle="#e5f2ff";ctx.fill();ctx.globalAlpha=1;}
    ctx.fillStyle="#0f172a";
    if(!blink){cVan(ctx,41,31,3);cVan(ctx,55,31,3);}
    else{ctx.lineWidth=3;ctx.strokeStyle="#0f172a";lVan(ctx,38,31,44,31);lVan(ctx,52,31,58,31);}
    ctx.lineWidth=3; ctx.strokeStyle="#38bdf8"; ctx.beginPath(); ctx.moveTo(48,14); ctx.lineTo(48,7); ctx.stroke();
    cfVan(ctx,48,7,5,"#38bdf8");
    rrVan(ctx,22,44,52,40,20); ctx.fillStyle=bodyGrad; ctx.fill();
    cfVan(ctx,48,66,8,"#9ca3af");
    rrVan(ctx,14,52,8,24,6); ctx.fillStyle="#e5e7eb"; ctx.fill();
    rrVan(ctx,74,52,8,24,6); ctx.fill();
    const baseY=78, stepAmt=3; let leftY=baseY, rightY=baseY;
    if(step===0){leftY=baseY-stepAmt;rightY=baseY+stepAmt;}
    else if(step===1){leftY=baseY+stepAmt;rightY=baseY-stepAmt;}
    rrVan(ctx,30,leftY,14,10,4); ctx.fillStyle="#1f2937"; ctx.fill();
    rrVan(ctx,52,rightY,14,10,4); ctx.fill();
    ctx.lineWidth=3; ctx.strokeStyle="#0f172a";
    rrVan(ctx,26,14,44,34,18); ctx.stroke();
    rrVan(ctx,22,44,52,40,20); ctx.stroke();
    tex.refresh();
  }

  // ===== Fundo =====
  // Nuvens animadas
  let clouds=[];
  function initBackground(scene){
    bgGraphics    =scene.add.graphics().setDepth(-60).setScrollFactor(0.0);
    farGraphics   =scene.add.graphics().setDepth(-57).setScrollFactor(0.06); // nova camada parallax profunda
    hillsGraphics =scene.add.graphics().setDepth(-50).setScrollFactor(0.25);
    groundGraphics=scene.add.graphics().setDepth(-10).setScrollFactor(1.0);
    decorGraphics =scene.add.graphics().setDepth(-8).setScrollFactor(1.0);
    platDecorGfx  =scene.add.graphics().setDepth(-6).setScrollFactor(1.0);
    sunGraphics   =scene.add.graphics().setDepth(-55).setScrollFactor(0.05);
    moonGraphics  =scene.add.graphics().setDepth(-55).setScrollFactor(0.05);
    starGraphics  =scene.add.graphics().setDepth(-59).setScrollFactor(0.02);
    applyBackground(scene,0,2600);
    drawSun(0);
    spawnClouds(scene,2600);
  }

  function spawnClouds(scene,worldW){
    clouds.forEach(c=>{if(c.gfx)c.gfx.destroy();});
    clouds=[];
    const count=10+Math.floor(worldW/300);
    const types=["cumulo","cumulo","cumulo","cirro","cirro","coracao","estrela"]; // mais cúmulos
    for(let i=0;i<count;i++){
      const layer=Math.floor(Math.random()*3);
      const scale=[0.35,0.65,1.05][layer]+Math.random()*[0.25,0.35,0.55][layer];
      const alpha=[0.18,0.45,0.75][layer]+Math.random()*[0.18,0.20,0.18][layer];
      const speed=[0.05,0.14,0.28][layer]+Math.random()*[0.08,0.10,0.16][layer];
      const y=[15,25,30][layer]+Math.random()*[60,90,120][layer];
      const sf=[0.12,0.30,0.55][layer];
      const type=types[Math.floor(Math.random()*types.length)];
      const gfx=scene.add.graphics().setDepth(-47+layer).setScrollFactor(sf);
      clouds.push({ gfx, x:Math.random()*worldW, y, speed, scale, alpha, worldW, type });
    }
  }

  function drawCloud(gfx,x,y,sc,alpha,type){
    gfx.clear();
    if(type==="cirro"){
      // Cirro — fino, alongado, rápido
      gfx.fillStyle(0xffffff,alpha*0.65);
      gfx.fillEllipse(x,y,90*sc,12*sc);
      gfx.fillEllipse(x+20*sc,y-4*sc,60*sc,8*sc);
      gfx.fillEllipse(x-15*sc,y+3*sc,50*sc,7*sc);
    } else if(type==="coracao"){
      // Nuvem em forma de coração — temática
      gfx.fillStyle(0xffffff,alpha*0.75);
      gfx.fillCircle(x-14*sc,y,16*sc);
      gfx.fillCircle(x+14*sc,y,16*sc);
      // Base triangular do coração
      const cx=x, cy=y;
      gfx.fillTriangle(cx-28*sc,cy+4*sc, cx+28*sc,cy+4*sc, cx,cy+28*sc);
      // Brilho
      gfx.fillStyle(0xffffff,alpha*0.4);
      gfx.fillCircle(x-10*sc,y-6*sc,7*sc);
    } else if(type==="estrela"){
      // Nuvem redondinha com pontinhas tipo estrela
      gfx.fillStyle(0xffffff,alpha*0.70);
      for(let p=0;p<6;p++){
        const a=Math.PI*2*p/6;
        gfx.fillCircle(x+Math.cos(a)*18*sc, y+Math.sin(a)*14*sc, 14*sc);
      }
      gfx.fillCircle(x,y,20*sc); // centro
      gfx.fillStyle(0xffffff,alpha*0.35);
      gfx.fillCircle(x-6*sc,y-6*sc,8*sc);
    } else {
      // Cúmulo — clássico mas variado
      gfx.fillStyle(0x8090c0,alpha*0.15);
      gfx.fillEllipse(x+4*sc,y+9*sc,80*sc,20*sc); // sombra
      gfx.fillStyle(0xffffff,alpha);
      gfx.fillEllipse(x,y,54*sc,32*sc);
      gfx.fillEllipse(x+22*sc,y-13*sc,44*sc,30*sc);
      gfx.fillEllipse(x-18*sc,y-4*sc,38*sc,26*sc);
      gfx.fillEllipse(x+42*sc,y-2*sc,34*sc,22*sc);
      gfx.fillEllipse(x-2*sc,y-18*sc,28*sc,20*sc); // pico extra
      gfx.fillStyle(0xffffff,alpha*0.55);
      gfx.fillEllipse(x+10*sc,y-16*sc,22*sc,12*sc);
    }
  }

  // ── Trail de movimento — removido ────────────────────────────
  function updateTrail(scene){}

  // ── Partículas de passo ───────────────────────────────────────
  function updateFootsteps(scene){
    if(!player||!player.body) return;
    const onGround=player.body.blocked.down;
    const moving=Math.abs(player.body.velocity.x)>60;
    if(onGround&&moving){
      footStepTimer++;
      if(footStepTimer>=14){
        footStepTimer=0;
        const px=player.x+(player.flipX?12:-12), py=player.y+24;
        const tint=powered?[0xffd700,0xffa040,0xffffff]:[0xa0ff80,0xffffff,0x80d0ff];
        const p=scene.add.particles(0,0,"spark_item",{
          x:px, y:py,
          speed:{min:20,max:60},
          angle:{min:220,max:320},
          lifespan:200,quantity:3,
          scale:{start:0.35,end:0},
          gravityY:200,
          tint
        });
        scene.time.delayedCall(120,()=>p.destroy());
      }
    } else { footStepTimer=0; }
  }

  // ── Halo pulsante da porta ────────────────────────────────────
  function updateDoorGlow(scene){
    if(!doorGlowGfx||!door||!player) return;
    doorGlowGfx.clear();
    const dist=Math.abs(player.x-door.x);
    if(dist>400) return;
    const proximity=1-dist/400; // 0→1 conforme se aproxima
    const t=scene.time.now*0.003;
    const pulse=0.5+Math.sin(t)*0.5;
    const alpha=proximity*pulse*0.55;
    const radius=55+pulse*20;
    // Halo colorido arco-íris suave
    doorGlowGfx.fillStyle(0xffd700,alpha*0.6);
    doorGlowGfx.fillCircle(door.x,door.y-20,radius);
    doorGlowGfx.fillStyle(0xff6b35,alpha*0.4);
    doorGlowGfx.fillCircle(door.x,door.y-20,radius*0.7);
    doorGlowGfx.fillStyle(0xffffff,alpha*0.25);
    doorGlowGfx.fillCircle(door.x,door.y-20,radius*0.4);
    // Texto flutuante "Vai à porta! 🎊" quando entra na zona pela primeira vez
    if(dist<320 && !doorGlowGfx._hintShown){
      doorGlowGfx._hintShown=true;
      const hint=scene.add.text(door.x, door.y-90, "Vai à porta! 🎊", {
        fontSize:"18px", fontStyle:"900", color:"#ffd700",
        stroke:"#200040", strokeThickness:5
      }).setOrigin(0.5).setDepth(20);
      scene.tweens.add({targets:hint, y:door.y-130, alpha:{from:1,to:0},
        duration:1800, ease:"Sine.easeOut", onComplete:()=>hint.destroy()});
    }
  }

  function drawCloud(gfx, x, y, sc, alpha, type) {
    gfx.clear();
    if (!type || type === "cumulo") {
      // Nuvem cúmulo clássica — volumosa, com sombra e brilho
      gfx.fillStyle(0x8090b0, alpha * 0.15);
      gfx.fillEllipse(x + 5*sc, y + 9*sc, 84*sc, 22*sc); // sombra
      // Corpo branco-azulado (ligeiramente azul para dar profundidade)
      gfx.fillStyle(0xddeeff, alpha * 0.6);
      gfx.fillEllipse(x,       y,      56*sc, 34*sc);
      gfx.fillEllipse(x+22*sc, y-13*sc,46*sc, 32*sc);
      gfx.fillEllipse(x-19*sc, y-5*sc, 38*sc, 26*sc);
      gfx.fillEllipse(x+42*sc, y-3*sc, 36*sc, 24*sc);
      // Camada branca por cima
      gfx.fillStyle(0xffffff, alpha);
      gfx.fillEllipse(x+2*sc,   y-2*sc, 50*sc, 29*sc);
      gfx.fillEllipse(x+22*sc,  y-15*sc,40*sc, 27*sc);
      gfx.fillEllipse(x-17*sc,  y-6*sc, 32*sc, 22*sc);
      gfx.fillEllipse(x+42*sc,  y-4*sc, 30*sc, 20*sc);
      // Brilho topo
      gfx.fillStyle(0xffffff, alpha * 0.65);
      gfx.fillEllipse(x+8*sc, y-16*sc, 24*sc, 13*sc);
      // Franja escura na base
      gfx.fillStyle(0xc0d0e8, alpha * 0.35);
      gfx.fillEllipse(x+10*sc, y+10*sc, 50*sc, 14*sc);

    } else if (type === "cirro") {
      // Nuvem cirro — fina, alongada, semi-transparente (altitude alta)
      gfx.fillStyle(0xffffff, alpha * 0.45);
      gfx.fillEllipse(x,       y,      90*sc, 12*sc);
      gfx.fillEllipse(x+20*sc, y-4*sc, 60*sc, 8*sc);
      gfx.fillEllipse(x-20*sc, y+2*sc, 50*sc, 7*sc);
      // Filamentos
      gfx.fillStyle(0xffffff, alpha * 0.25);
      gfx.fillEllipse(x+50*sc, y+1*sc, 40*sc, 5*sc);
      gfx.fillEllipse(x-35*sc, y+3*sc, 30*sc, 4*sc);

    } else if (type === "coracao") {
      // Nuvem em forma de coração 🩷 — decorativa
      const cx = x, cy = y;
      const r = 13 * sc;
      gfx.fillStyle(0xffb0c8, alpha * 0.7);
      gfx.fillCircle(cx - r*0.55, cy - r*0.2, r);
      gfx.fillCircle(cx + r*0.55, cy - r*0.2, r);
      // Triângulo base do coração
      gfx.fillTriangle(
        cx - r*1.4, cy - r*0.1,
        cx + r*1.4, cy - r*0.1,
        cx,         cy + r*1.3
      );
      // Brilho
      gfx.fillStyle(0xffd8e8, alpha * 0.55);
      gfx.fillCircle(cx - r*0.3, cy - r*0.5, r * 0.5);

    } else if (type === "estrela") {
      // Nuvem em forma de estrela ⭐ — decorativa
      const cx = x, cy = y;
      const ro = 18 * sc, ri = 8 * sc;
      const pts = 5;
      gfx.fillStyle(0xfff0a0, alpha * 0.80);
      // Desenhar estrela de 5 pontas
      const starPts = [];
      for (let pi = 0; pi < pts * 2; pi++) {
        const angle = (Math.PI / pts) * pi - Math.PI / 2;
        const r = pi % 2 === 0 ? ro : ri;
        starPts.push(cx + Math.cos(angle) * r);
        starPts.push(cy + Math.sin(angle) * r);
      }
      // Phaser Graphics não tem fillPoints nativo fácil; usar fillTriangle a partir do centro
      for (let pi = 0; pi < pts * 2; pi++) {
        const i0 = pi * 2, i1 = ((pi + 1) % (pts * 2)) * 2;
        gfx.fillTriangle(cx, cy, starPts[i0], starPts[i0+1], starPts[i1], starPts[i1+1]);
      }
      // Brilho central
      gfx.fillStyle(0xffffff, alpha * 0.55);
      gfx.fillCircle(cx - ro*0.15, cy - ro*0.18, ro * 0.30);
    }
  }

  // ── Sol animado ────────────────────────────────────────────────
  const SUN_X=160, SUN_Y=72, SUN_R=38;
  function drawSun(angle){
    if(!sunGraphics) return;
    sunGraphics.clear();
    // Halo exterior suave
    sunGraphics.fillStyle(0xffe080,0.10); sunGraphics.fillCircle(SUN_X,SUN_Y,SUN_R+30);
    sunGraphics.fillStyle(0xffe080,0.18); sunGraphics.fillCircle(SUN_X,SUN_Y,SUN_R+22);
    sunGraphics.fillStyle(0xffd700,0.26); sunGraphics.fillCircle(SUN_X,SUN_Y,SUN_R+13);
    // Raios longos (12)
    sunGraphics.lineStyle(3,0xffd700,0.55);
    for(let ri=0;ri<12;ri++){
      const a=angle+Math.PI*2*ri/12;
      sunGraphics.beginPath();
      sunGraphics.moveTo(SUN_X+Math.cos(a)*(SUN_R+15),SUN_Y+Math.sin(a)*(SUN_R+15));
      sunGraphics.lineTo(SUN_X+Math.cos(a)*(SUN_R+30),SUN_Y+Math.sin(a)*(SUN_R+30));
      sunGraphics.strokePath();
    }
    // Raios curtos intercalados
    sunGraphics.lineStyle(2,0xffd700,0.30);
    for(let ri=0;ri<12;ri++){
      const a=angle+Math.PI*2*ri/12+Math.PI/12;
      sunGraphics.beginPath();
      sunGraphics.moveTo(SUN_X+Math.cos(a)*(SUN_R+15),SUN_Y+Math.sin(a)*(SUN_R+15));
      sunGraphics.lineTo(SUN_X+Math.cos(a)*(SUN_R+22),SUN_Y+Math.sin(a)*(SUN_R+22));
      sunGraphics.strokePath();
    }
    // Disco principal
    sunGraphics.fillStyle(0xfff8b0,1); sunGraphics.fillCircle(SUN_X,SUN_Y,SUN_R);
    sunGraphics.fillStyle(0xffd700,1); sunGraphics.fillCircle(SUN_X,SUN_Y,SUN_R-6);
    // Brilho superior esquerdo
    sunGraphics.fillStyle(0xffe040,0.55); sunGraphics.fillCircle(SUN_X-11,SUN_Y-11,SUN_R*0.42);
    sunGraphics.fillStyle(0xffffff,0.22); sunGraphics.fillCircle(SUN_X-14,SUN_Y-14,SUN_R*0.22);
    // ── Face fofa do sol ────────────────────────────────────────
    // Olhos
    sunGraphics.fillStyle(0x7a4000,1);
    sunGraphics.fillCircle(SUN_X-10, SUN_Y-5, 4.5);
    sunGraphics.fillCircle(SUN_X+10, SUN_Y-5, 4.5);
    // Brilho nos olhos
    sunGraphics.fillStyle(0xffffff,0.8);
    sunGraphics.fillCircle(SUN_X-8,  SUN_Y-7, 1.8);
    sunGraphics.fillCircle(SUN_X+12, SUN_Y-7, 1.8);
    // Sorriso (arco)
    sunGraphics.lineStyle(3, 0x7a4000, 1);
    sunGraphics.beginPath();
    sunGraphics.arc(SUN_X, SUN_Y+2, 11, 0.25, Math.PI-0.25);
    sunGraphics.strokePath();
    // Bochechas coradas
    sunGraphics.fillStyle(0xff8060, 0.28);
    sunGraphics.fillCircle(SUN_X-16, SUN_Y+4, 7);
    sunGraphics.fillCircle(SUN_X+16, SUN_Y+4, 7);
  }

  // ── Estrelas noturnas (temas 4+) ───────────────────────────────
  let starSeed = [];
  function drawStars(themeIdx, worldW){
    if(!starGraphics) return;
    starGraphics.clear();
    if(themeIdx < 4) return; // só em temas escuros/noturnos
    // Gerar seed consistente por worldW
    if(starSeed.length===0||starSeed._w!==worldW){
      starSeed=[]; starSeed._w=worldW;
      const count=80+Math.floor(worldW/40);
      for(let i=0;i<count;i++)
        starSeed.push({ x:Math.random()*worldW, y:10+Math.random()*280,
                        r:0.8+Math.random()*1.8, phase:Math.random()*Math.PI*2 });
    }
    const t=Date.now()*0.0008;
    starSeed.forEach(s=>{
      const a=0.4+Math.sin(t+s.phase)*0.35;
      starGraphics.fillStyle(0xffffff,a);
      starGraphics.fillCircle(s.x,s.y,s.r);
    });
  }

  // ── Lua (temas noturnos 4+) ────────────────────────────────────
  function drawMoon(themeIdx){
    if(!moonGraphics) return;
    moonGraphics.clear();
    if(themeIdx < 4) return;
    const mx=820, my=70, mr=30;
    // Halo duplo suave
    moonGraphics.fillStyle(0xfffbe0,0.07); moonGraphics.fillCircle(mx,my,mr+26);
    moonGraphics.fillStyle(0xfffbe0,0.14); moonGraphics.fillCircle(mx,my,mr+14);
    moonGraphics.fillStyle(0xfffbe0,0.22); moonGraphics.fillCircle(mx,my,mr+6);
    // Disco cheio da lua
    moonGraphics.fillStyle(0xfff8d0,1); moonGraphics.fillCircle(mx,my,mr);
    // Sombra crescente — círculo deslocado mais escuro por cima
    moonGraphics.fillStyle(0x1a0840,1); moonGraphics.fillCircle(mx+mr*0.55, my-mr*0.10, mr*0.88);
    // Rebordo brilhante do crescente
    moonGraphics.fillStyle(0xfff0b0,0.30); moonGraphics.fillCircle(mx,my,mr);
    moonGraphics.fillStyle(0x1a0840,1); moonGraphics.fillCircle(mx+mr*0.60, my-mr*0.08, mr*0.88);
    // Crateras na parte visível (esquerda/baixo)
    [[mx-10,my+6,4.5],[mx-18,my-4,3],[mx-6,my+16,2.5]].forEach(([cx,cy,cr])=>{
      moonGraphics.fillStyle(0xe8d898,0.50); moonGraphics.fillCircle(cx,cy,cr);
      moonGraphics.fillStyle(0xc0a848,0.28); moonGraphics.fillCircle(cx+1,cy+1,cr-1);
    });
    // Brilho topo-esquerdo
    moonGraphics.fillStyle(0xffffff,0.45); moonGraphics.fillEllipse(mx-12,my-12,10,7);
    // Pequenas estrelas decorativas à volta da lua
    [[mx+46,my-18,2.2],[mx+38,my+26,1.6],[mx-36,my-22,1.4],[mx+58,my+8,1.8]].forEach(([sx,sy,sr])=>{
      moonGraphics.fillStyle(0xffffff,0.70); moonGraphics.fillCircle(sx,sy,sr);
      moonGraphics.fillStyle(0xffffff,0.35); moonGraphics.fillCircle(sx,sy,sr+2);
    });
  }

  // ── Camada parallax profunda: edifícios em todos os níveis ──────
  function drawFarLayer(themeIdx, worldW){
    if(!farGraphics) return;
    farGraphics.clear();
    // Paletas de cor dos edifícios por tema
    const BUILD_PALETTES = [
      { walls:[0x1a3060,0x0a2050,0x162848,0x0e1e3a], wins:[0xffd700,0x80d0ff,0xffe880,0xff8040] }, // tema0 azul
      { walls:[0x5a2800,0x3a1800,0x6a3010,0x2e1200], wins:[0xffd700,0xffe880,0xff8040,0xffc060] }, // tema1 dourado
      { walls:[0x005040,0x003830,0x006858,0x002e28], wins:[0x80ffe0,0x40d4b8,0xffd700,0xb0fff0] }, // tema2 aqua
      { walls:[0x5a1030,0x3e0820,0x6e1840,0x2e0818], wins:[0xff80c0,0xffd700,0xffb0d0,0xff6090] }, // tema3 rosa
      { walls:[0x1a0840,0x0a1a40,0x200830,0x0a2040], wins:[0xffd700,0xffe880,0x80d0ff,0xff8040] }, // tema4 lilás
      { walls:[0x103820,0x082810,0x185030,0x062010], wins:[0xa0ffb0,0x40c060,0xffd700,0x80ff90] }, // tema5 verde
      { walls:[0x5a1800,0x401000,0x682000,0x300c00], wins:[0xffa060,0xffd700,0xff8040,0xffb880] }, // tema6 laranja
      { walls:[0x083060,0x042048,0x0c3870,0x021838], wins:[0x80d0ff,0x2898e0,0xffd700,0xb0e8ff] }, // tema7 azul vivo
      { walls:[0x500828,0x380518,0x601030,0x280410], wins:[0xffa0c8,0xffd700,0xff80c0,0xffc8de] }, // tema8 magenta
      { walls:[0x104020,0x082e10,0x185028,0x061c08], wins:[0xb0ff80,0x30a050,0xffd700,0xd0ffb0] }, // tema9 verde lima
    ];
    const palette = BUILD_PALETTES[themeIdx % BUILD_PALETTES.length];
    const buildColors = palette.walls;
    const winColors   = palette.wins;
    const step=90;
    const groundBase=520;
    for(let i=0;i<Math.ceil(worldW/step)+2;i++){
      const bx=i*step+(i%3)*18;
      const bh=60+((i*37)%80);
      const bw=44+((i*23)%30);
      farGraphics.fillStyle(buildColors[i%buildColors.length],0.75);
      farGraphics.fillRect(bx,groundBase-bh,bw,bh);
      // Janelas iluminadas
      const wc=winColors[i%winColors.length];
      for(let wy=groundBase-bh+8;wy<groundBase-8;wy+=14){
        for(let wx=bx+6;wx<bx+bw-8;wx+=12){
          if(Math.abs(Math.sin(i*7+wy+wx))>0.3){
            farGraphics.fillStyle(wc,0.50+Math.abs(Math.sin(i+wy*0.1))*0.35);
            farGraphics.fillRect(wx,wy,7,8);
          }
        }
      }
      // Contorno topo
      farGraphics.fillStyle(0xffffff,0.07);
      farGraphics.fillRect(bx,groundBase-bh,bw,2);
    }
  }

  // ── Confetes de fundo nos últimos níveis (7+) ─────────────────
  function spawnBgConfetti(scene, themeIdx, worldW){
    bgConfetti.forEach(c=>{if(c.gfx)c.gfx.destroy();});
    bgConfetti=[];
    if(themeIdx < 7) return; // só nos últimos 3 níveis
    const emojis=["🎈","🌟","✨","🎊","⭐"];
    const count=18+Math.floor(worldW/200);
    for(let i=0;i<count;i++){
      const gfx=scene.add.text(
        Math.random()*worldW,
        50+Math.random()*380,
        emojis[i%emojis.length],
        {fontSize:"16px"}
      ).setDepth(-45).setScrollFactor(0.08).setAlpha(0.18+Math.random()*0.14);
      bgConfetti.push({gfx, baseY:parseFloat(gfx.y), speed:0.15+Math.random()*0.25, phase:Math.random()*Math.PI*2});
    }
  }

  // ── Decorações animadas nas plataformas ───────────────────────
  function spawnPlatformDecor(scene, platforms){
    platDecorData.forEach(d=>{if(d.gfx&&d.gfx.active)d.gfx.destroy();});
    platDecorData=[];
    if(!platDecorGfx) return;
    const flowerColors=[0xff6b35,0xffd700,0xff80c0,0x80d0ff,0xa0ff80,0xffffff,0xc080ff];
    platforms.getChildren().forEach((plat,pi)=>{
      if(!plat.body) return;
      const pw=plat.displayWidth, px=plat.body.left, py=plat.body.top;
      // Flores: 1 por cada 80px de plataforma
      const numFlowers=Math.max(1,Math.floor(pw/80));
      for(let fi=0;fi<numFlowers;fi++){
        const fx=px+30+fi*(pw-60)/Math.max(1,numFlowers-1);
        const fc=flowerColors[(pi*3+fi)%flowerColors.length];
        platDecorData.push({type:"flower", x:fx, y:py-4, color:fc, phase:Math.random()*Math.PI*2, gfx:null});
      }
      // Borboleta: 1 por cada 3 plataformas
      if(pi%3===0 && pw>100){
        const bx=px+pw*0.6;
        platDecorData.push({type:"butterfly", x:bx, y:py-12, color:flowerColors[pi%flowerColors.length], phase:Math.random()*Math.PI*2, gfx:null});
      }
    });
  }

  function updatePlatformDecor(scene){
    if(!platDecorGfx||platDecorData.length===0) return;
    platDecorGfx.clear();
    const t=scene.time.now*0.001;
    platDecorData.forEach(d=>{
      const sway=Math.sin(t*1.4+d.phase)*2.5; // balanço suave
      if(d.type==="flower"){
        const fy=d.y+sway*0.3;
        // Caule
        platDecorGfx.lineStyle(1.2,0x228830,0.70);
        platDecorGfx.beginPath(); platDecorGfx.moveTo(d.x,fy+6); platDecorGfx.lineTo(d.x+sway*0.5,fy-2); platDecorGfx.strokePath();
        // Pétalas
        platDecorGfx.fillStyle(d.color,0.75);
        platDecorGfx.fillCircle(d.x+sway*0.5,fy-5,3.5);
        platDecorGfx.fillCircle(d.x+sway*0.5+3,fy-2,3.5);
        platDecorGfx.fillCircle(d.x+sway*0.5-3,fy-2,3.5);
        platDecorGfx.fillCircle(d.x+sway*0.5,fy+1,3.5);
        // Centro
        platDecorGfx.fillStyle(0xffd700,0.9);
        platDecorGfx.fillCircle(d.x+sway*0.5,fy-2,2);
      } else if(d.type==="butterfly"){
        const flutter=Math.sin(t*6+d.phase)*0.5; // bater de asas rápido
        const bx=d.x+Math.sin(t*0.8+d.phase)*18; // deriva horizontal
        const by=d.y+Math.sin(t*0.5+d.phase)*8;
        const wOpen=5+Math.abs(flutter)*4;
        // Asas
        platDecorGfx.fillStyle(d.color,0.65);
        platDecorGfx.fillEllipse(bx-wOpen,by,wOpen*2,6);
        platDecorGfx.fillEllipse(bx+wOpen,by,wOpen*2,6);
        platDecorGfx.fillEllipse(bx-wOpen*0.7,by+4,wOpen*1.4,5);
        platDecorGfx.fillEllipse(bx+wOpen*0.7,by+4,wOpen*1.4,5);
        // Corpo
        platDecorGfx.fillStyle(0x1a1a1a,0.55);
        platDecorGfx.fillEllipse(bx,by+1,3,10);
      }
    });
  }

  function applyBackground(scene,themeIdx,worldW){
    const T=THEMES[themeIdx]||THEMES[0];
    const isNight = themeIdx >= 4;

    // ── CÉU com gradiente triplo mais rico ────────────────────────
    bgGraphics.clear();
    // Camada base — gradiente superior/inferior
    bgGraphics.fillGradientStyle(T.skyTop,T.skyTop,T.skyBot,T.skyBot,1);
    bgGraphics.fillRect(0,0,worldW,540);

    // Faixa de horizonte — tom mais quente/suave no meio
    const horizColor = isNight ? 0x1a0840 : 0xfff0c8;
    bgGraphics.fillStyle(horizColor, isNight ? 0.18 : 0.22);
    bgGraphics.fillRect(0, 320, worldW, 120);

    if (!isNight) {
      // ── RAIOS DE LUZ (god rays) — só temas diurnos ──────────────
      const rayColors = [0xffffff, 0xffe8a0, 0xffd070];
      const numRays = 7;
      for (let ri = 0; ri < numRays; ri++) {
        const rx = SUN_X + (ri - numRays/2) * 38;
        const spread = 180 + ri * 40;
        bgGraphics.fillStyle(rayColors[ri % rayColors.length], 0.025 + (ri%3)*0.010);
        // Triângulo fino do sol até ao chão
        bgGraphics.fillTriangle(SUN_X, SUN_Y, rx - spread*0.5, 540, rx + spread*0.5, 540);
      }
      // Reflexo de luz no chão (halo laranja-amarelo)
      bgGraphics.fillStyle(0xffd070, 0.08);
      bgGraphics.fillEllipse(SUN_X, 490, 400, 80);
    } else {
      // ── AURORA BOREAL — temas noturnos ───────────────────────────
      const auroraColors = [
        [0x00ff80, 0x0080ff],  // verde-azul (tema 4 lilás)
        [0x00ffcc, 0x8000ff],  // ciano-violeta (tema 5 verde)
        [0xff8000, 0xff0080],  // laranja-magenta (tema 6)
        [0x00c8ff, 0x0040ff],  // azul vivo (tema 7)
        [0xff40c0, 0x8000ff],  // rosa-violeta (tema 8)
        [0x40ff80, 0x00c0ff],  // verde-ciano (tema 9)
      ];
      const ac = auroraColors[(themeIdx - 4) % auroraColors.length];
      const auroraCount = 5;
      for (let ai = 0; ai < auroraCount; ai++) {
        const ax = worldW * (0.1 + ai * 0.18);
        const aw = 120 + ai * 60;
        const ah = 80 + ai * 30;
        const alpha = 0.06 + (ai % 3) * 0.03;
        // Faixa vertical ondulada (simulada com elipses inclinadas)
        bgGraphics.fillStyle(ac[ai % 2], alpha);
        bgGraphics.fillEllipse(ax, 180 + ai * 20, aw * 0.35, ah);
        bgGraphics.fillStyle(ac[(ai+1) % 2], alpha * 0.6);
        bgGraphics.fillEllipse(ax + aw * 0.15, 160 + ai * 15, aw * 0.25, ah * 0.7);
      }
    }

    // ── CAMADA PARALLAX PROFUNDA (montanhas/edifícios) ────────────
    drawFarLayer(themeIdx, worldW);

    // ── LUA (temas noturnos) ──────────────────────────────────────
    drawMoon(themeIdx);

    // ── SOL — desenhado em sunGraphics (animado no update) ────────
    // Esconder o sol em temas noturnos
    if(sunGraphics) sunGraphics.setAlpha(themeIdx>=4 ? 0 : 1);

    // ── ESTRELAS (temas noturnos, redesenhadas no update) ─────────
    starSeed=[]; // forçar reseed
    drawStars(themeIdx, worldW);

    // ── COLINAS ────────────────────────────────────────────────────
    hillsGraphics.clear();
    // Colinas traseiras — scrollFactor lento (paralaxe)
    hillsGraphics.fillStyle(0x5aaa60,0.28);
    for(let i=0;i<Math.ceil(worldW/340)+1;i++)
      hillsGraphics.fillEllipse(i*340+170+(i%2)*40,445,400,200);
    // Colinas da frente — scrollFactor médio
    hillsGraphics.fillStyle(T.hillColor,0.42);
    for(let i=0;i<Math.ceil(worldW/260)+1;i++)
      hillsGraphics.fillEllipse(i*260+130+(i%3)*30,462,320,170);

    // ── ÁRVORES ────────────────────────────────────────────────────
    // Posições alternadas com as casas para não sobrepor
    const treeColors=[0x2d8a40,0x3aaa50,0x228830,0x44cc55];
    // Árvores nos intervalos entre casas: 160, 500, 820, 1220, 1580, 1940, 2280, 2620…
    const treePositions=[];
    for(let i=0;i<Math.ceil(worldW/220);i++)
      treePositions.push(160+i*220+(i%2)*30);

    treePositions.filter(tx=>tx<worldW-40).forEach((tx,ti)=>{
      const tc  = treeColors[ti%treeColors.length];
      const tcL = treeColors[(ti+1)%treeColors.length]; // camada mais clara
      const base= 510;          // Y do chão
      const th  = 60+((ti*41)%30); // altura total 60-90 px
      const tw  = 24+((ti*17)%10); // meia-largura base 24-34

      // 1. Tronco — desenhado primeiro (fica atrás da copa)
      const trunkW=8, trunkH=Math.round(th*0.28);
      hillsGraphics.fillStyle(0x7a4a20,1);
      hillsGraphics.fillRect(tx-trunkW/2, base-trunkH, trunkW, trunkH);
      // Sombra lateral do tronco
      hillsGraphics.fillStyle(0x4a2a08,0.5);
      hillsGraphics.fillRect(tx+trunkW/2-3, base-trunkH, 3, trunkH);

      // Base do tronco onde encontra o chão
      hillsGraphics.fillStyle(0x5a3010,0.6);
      hillsGraphics.fillEllipse(tx, base, trunkW+6, 5);

      // 2. Copa — 3 triângulos sobrepostos, de baixo para cima
      // Camada 1 — base (mais larga, mais escura)
      const y1b = base - trunkH + 4;  // topo desta camada
      const y1t = base - trunkH - Math.round(th*0.28);
      hillsGraphics.fillStyle(tc, 0.9);
      hillsGraphics.fillTriangle(tx-tw, y1b, tx+tw, y1b, tx, y1t);

      // Camada 2 — meio (média largura)
      const y2b = y1t + Math.round(th*0.10);
      const y2t = y2b - Math.round(th*0.28);
      hillsGraphics.fillStyle(tcL, 0.85);
      hillsGraphics.fillTriangle(tx-tw*0.78, y2b, tx+tw*0.78, y2b, tx, y2t);

      // Camada 3 — topo (mais estreita, mais clara)
      const y3b = y2t + Math.round(th*0.10);
      const y3t = y3b - Math.round(th*0.26);
      hillsGraphics.fillStyle(0x44dd66, 0.9);
      hillsGraphics.fillTriangle(tx-tw*0.52, y3b, tx+tw*0.52, y3b, tx, y3t);

      // Brilho no topo da copa
      hillsGraphics.fillStyle(0xaaffaa, 0.30);
      hillsGraphics.fillEllipse(tx-4, y3t+6, 12, 8);
    });

    // ── CASINHAS ──────────────────────────────────────────────────
    const houseColors=[0xf4a090,0x90c0f0,0xf5d080,0xa8d8a0,0xd0a8f0];
    const roofColors =[0xb02020,0x1a6ab0,0xc07800,0x2a8040,0x7020b0];
    const houseX=[340,680,1050,1420,1780,2120,2460];
    houseX.filter(hx=>hx<worldW-80).forEach((hx,hi)=>{
      const hc  = houseColors[hi%houseColors.length];
      const rc  = roofColors[hi%roofColors.length];
      const hw  = 48;           // largura parede
      const hh  = 36;           // altura parede
      const base= 510;          // Y do chão
      const hy  = base - hh;    // Y topo da parede
      const cx  = hx + hw/2;    // centro horizontal

      // --- Sombra no chão ---
      hillsGraphics.fillStyle(0x000000,0.10);
      hillsGraphics.fillEllipse(cx, base+2, hw+8, 6);

      // --- CHAMINÉ — desenhada ANTES do telhado para ficar por baixo ---
      const chimX = cx + 10;
      const chimTop = hy - 22;   // topo visível da chaminé (acima do telhado)
      const chimBot = hy - 4;    // base (enterrada no telhado)
      hillsGraphics.fillStyle(0x9a7055,1);
      hillsGraphics.fillRect(chimX-4, chimTop, 9, chimBot-chimTop);
      // Topo da chaminé (chapéu)
      hillsGraphics.fillStyle(0x6a4a28,1);
      hillsGraphics.fillRect(chimX-6, chimTop-3, 13, 4);

      // --- TELHADO (triângulo) ---
      const roofPeak = hy - 22;  // pico do telhado, mesmo nível do topo visível da chaminé
      hillsGraphics.fillStyle(rc, 1);
      hillsGraphics.fillTriangle(hx-4, hy, hx+hw+4, hy, cx, roofPeak);
      // Face escura (sombra lado esquerdo)
      hillsGraphics.fillStyle(0x000000,0.18);
      hillsGraphics.fillTriangle(cx, roofPeak, hx-4, hy, cx, hy);
      // Beirado (linha branca fina no fundo do telhado)
      hillsGraphics.fillStyle(0xffffff,0.25);
      hillsGraphics.fillRect(hx-4, hy-2, hw+8, 3);

      // --- PAREDE ---
      hillsGraphics.fillStyle(hc, 1);
      hillsGraphics.fillRect(hx, hy, hw, hh);
      // Sombra lateral direita
      hillsGraphics.fillStyle(0x000000,0.08);
      hillsGraphics.fillRect(hx+hw-5, hy, 5, hh);

      // --- JANELAS (2) ---
      const winY = hy + 7;
      [[hx+6, winY],[hx+hw-17, winY]].forEach(([wx,wy])=>{
        // Moldura
        hillsGraphics.fillStyle(0xffffff,0.6);
        hillsGraphics.fillRect(wx-1,wy-1,13,12);
        // Vidro
        hillsGraphics.fillStyle(0xc8eaff,0.9);
        hillsGraphics.fillRect(wx,wy,12,11);
        // Cruz da janela
        hillsGraphics.fillStyle(0xffffff,0.7);
        hillsGraphics.fillRect(wx,wy+4,12,2);
        hillsGraphics.fillRect(wx+5,wy,2,11);
        // Reflexo
        hillsGraphics.fillStyle(0xffffff,0.35);
        hillsGraphics.fillRect(wx+1,wy+1,4,4);
      });

      // --- PORTA ---
      const doorW=12, doorH=18;
      const doorX=cx-doorW/2, doorY=base-doorH;
      // Moldura
      hillsGraphics.fillStyle(0x5a3010,1);
      hillsGraphics.fillRect(doorX-1,doorY-1,doorW+2,doorH+1);
      // Porta
      hillsGraphics.fillStyle(0x8b5a2a,1);
      hillsGraphics.fillRect(doorX,doorY,doorW,doorH);
      // Arco
      hillsGraphics.fillStyle(0x8b5a2a,1);
      hillsGraphics.fillEllipse(cx,doorY,doorW,8);
      hillsGraphics.fillStyle(0x5a3010,0.4);
      hillsGraphics.fillEllipse(cx,doorY,doorW+2,8);
      // Maçaneta
      hillsGraphics.fillStyle(0xffd700,1);
      hillsGraphics.fillCircle(doorX+doorW-3,doorY+doorH/2,2);
    });

    // ── CHÃO com relva temática ────────────────────────────────────
    groundGraphics.clear();
    // Cor da relva adaptada ao tema
    const grassMain = T.grassTop || 0x3aaa50;
    const grassLight = Phaser.Display.Color.IntegerToColor(grassMain);
    // Camada de terra
    groundGraphics.fillStyle(isNight ? 0x180830 : 0x6b3a1f, 1);
    groundGraphics.fillRect(0,518,worldW,22);
    // Faixa de relva
    groundGraphics.fillStyle(grassMain, 1);
    groundGraphics.fillRect(0,510,worldW,12);
    // Relva detalhada — tufos triangulares na cor do tema
    const grassHighlight = Phaser.Display.Color.IntegerToColor(grassMain);
    groundGraphics.fillStyle(
      Phaser.Display.Color.GetColor(
        Math.min(255, grassHighlight.r + 30),
        Math.min(255, grassHighlight.g + 30),
        Math.min(255, grassHighlight.b + 20)
      ), 0.85
    );
    for(let gi=0;gi<Math.floor(worldW/14);gi++){
      const gx=gi*14+(gi%3)*2;
      groundGraphics.fillTriangle(gx,510, gx+7,510, gx+3,500);
      if(gi%2===0) groundGraphics.fillTriangle(gx+4,510,gx+10,510,gx+7,503);
    }
    // Linha de brilho topo relva
    groundGraphics.fillStyle(isNight ? 0x8080ff : 0x80ff90, isNight ? 0.18 : 0.32);
    groundGraphics.fillRect(0,510,worldW,3);
    // Linha sombra base
    groundGraphics.fillStyle(0x000000,0.14);
    groundGraphics.fillRect(0,536,worldW,4);

    // ── FLORES no chão ─────────────────────────────────────────────
    decorGraphics.clear();
    const fc=[0xff6b35,0xffd700,0xff80c0,0x80d0ff,0xa0ff80,0xffffff];
    for(let fi=0;fi<Math.floor(worldW/38);fi++){
      const fx=18+fi*38+(fi%4)*5, fy=507+(fi%2)*2;
      const cc=fc[fi%fc.length];
      // Pétalas
      decorGraphics.fillStyle(cc,0.85);
      decorGraphics.fillCircle(fx,fy-3,4);
      decorGraphics.fillCircle(fx+3,fy,4);
      decorGraphics.fillCircle(fx-3,fy,4);
      decorGraphics.fillCircle(fx,fy+3,4);
      // Centro amarelo
      decorGraphics.fillStyle(0xffd700,1);
      decorGraphics.fillCircle(fx,fy,2.5);
    }

    // Respawnar nuvens com nova worldW
    if(clouds.length>0) spawnClouds(scene,worldW);

    // Confetes de fundo (últimos níveis)
    spawnBgConfetti(scene, themeIdx, worldW);
  }

  // ===== Botões UI =====
  btnMute.onclick=()=>{muted=!muted;btnMute.textContent=muted?"🔇 Som: OFF":"🔊 Som: ON";if(!muted){ensureAudio();SFX.coin();}saveGame();};

  // Botão 📱 Botões — disponível antes e durante o jogo
  (()=>{
    const btn = document.getElementById("btnTouchToggle");
    if (!btn) return;
    let touchState = "auto";
    btn.onclick = () => {
      const tc = document.getElementById("touchControls");
      const autoVisible = tc && getComputedStyle(tc).display !== "none";
      if (touchState === "auto") { touchState = autoVisible ? "off" : "on"; }
      else if (touchState === "on") { touchState = "off"; }
      else { touchState = "auto"; }
      document.body.classList.toggle("force-touch", touchState === "on");
      document.body.classList.toggle("hide-touch",  touchState === "off");
      const lbl =
        touchState === "on"  ? "📱 Botões: ON"  :
        touchState === "off" ? "📱 Botões: OFF" : "📱 Botões: AUTO";
      btn.textContent = lbl;
      const mBtn = document.getElementById("mBtnTouch");
      if (mBtn) mBtn.textContent = lbl;
    };
  })();
  btnHow.onclick=()=>howOverlay.classList.remove("hidden");
  btnCloseHow.onclick=()=>howOverlay.classList.add("hidden");

  // ===== Ecrã todo =====
  const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent);

  function toggleFullscreen(){
    if(isIOS){ alert("No iPhone/iPad usa 'Partilhar' → 'Adicionar ao ecrã de início'."); return; }
    if(!document.fullscreenElement&&!document.webkitFullscreenElement){
      const el=document.documentElement;
      if(el.requestFullscreen) el.requestFullscreen();
      else if(el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if(document.exitFullscreen) document.exitFullscreen();
      else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  }
  function updateFsButtons(full){
    const lbl=full?"✕ Ecrã normal":"⛶ Ecrã todo";
    const b1=document.getElementById("btnFullscreen");
    const b2=document.getElementById("btnFullscreenGame");
    if(b1) b1.textContent=lbl;
    if(b2) b2.textContent=lbl;
  }
  document.addEventListener("fullscreenchange",()=>updateFsButtons(!!document.fullscreenElement));
  document.addEventListener("webkitfullscreenchange",()=>updateFsButtons(!!document.webkitFullscreenElement));
  const btnFs=document.getElementById("btnFullscreen");
  const btnFsGame=document.getElementById("btnFullscreenGame");
  if(btnFs) btnFs.onclick=toggleFullscreen;
  if(btnFsGame) btnFsGame.onclick=toggleFullscreen;
  window.addEventListener("keydown",e=>{ if(e.key?.toLowerCase()==="f"&&!e.target.matches("input")) toggleFullscreen(); });

  btnStart.onclick=()=>{
    ensureAudio();SFX.coin();
    playerName=(playerNameInput?.value||"").trim();
    currentLevel=0;score=0;lives=3;livesLostThisLevel=0;
    quizStats.total=0;quizStats.correct=0;quizStats.everWrong=false;quizStats.errors=[];
    try{localStorage.removeItem(SAVE_KEY);}catch{}
    startOverlay.classList.add("hidden");
    document.body.classList.add("game-started");
    if (!window.__dc_game) {
      initPhaser();
      // Wait for Phaser scene to be ready
      const waitScene = setInterval(() => {
        if (sceneRef) {
          clearInterval(waitScene);
          // Phaser já criou playerNameHUD — agora é seguro fazer setText
          if(playerNameHUD) playerNameHUD.setText(playerName ? `👤 ${playerName}` : "");
          playLevelTransition(sceneRef, 0, () => { loadLevel(sceneRef, 0); showHistory(0, ()=>{}); saveGame(); });
        }
      }, 50);
    } else if (sceneRef) {
      playLevelTransition(sceneRef, 0, () => { loadLevel(sceneRef, 0); showHistory(0, ()=>{}); saveGame(); });
    }
  };

  const btnRetry=document.getElementById("btnRetry"), btnExit=document.getElementById("btnExit");
  if(btnRetry) btnRetry.onclick=()=>{
    gameOverOverlay.classList.add("hidden");
    lives=3;score=0;resetQuizStats();livesLostThisLevel=0;
    Object.keys(usedQuizByLevel).forEach(k=>usedQuizByLevel[k].clear());
    scoreText.setText(`🌟 Pontos: ${score}`);updateHearts();
    awaitingQuiz=false;sceneRef.physics.resume();loadLevel(sceneRef,0);saveGame();
  };
  if(btnExit) btnExit.onclick=()=>{
    gameOverOverlay.classList.add("hidden");try{sceneRef.physics.pause();}catch{}
    lives=3;score=0;resetQuizStats();livesLostThisLevel=0;
    startOverlay.classList.remove("hidden");
  };

  const btnWinRestart=document.getElementById("btnWinRestart");
  if(btnWinRestart) btnWinRestart.onclick=()=>{
    winOverlay.classList.add("hidden");
    document.getElementById("confetti")?.classList.add("hidden");
    lives=3;score=0;currentLevel=0;resetQuizStats();livesLostThisLevel=0;
    Object.keys(usedQuizByLevel).forEach(k=>usedQuizByLevel[k].clear());
    awaitingQuiz=false;
    try{sceneRef.physics.pause();}catch{}
    startOverlay.classList.remove("hidden");
    document.body.classList.remove("game-started");
    saveGame();
  };
});

// Resize
window.addEventListener("resize",()=>{try{if(window.__dc_game?.scale)window.__dc_game.scale.refresh();}catch{}});

// Pausa automática ao mudar de separador
document.addEventListener("visibilitychange",()=>{
  try{
    const game=window.__dc_game; if(!game) return;
    const scene=game.scene.scenes[0]; if(!scene) return;
    if(document.hidden){scene.physics.pause();}
    else{
      const overlays=["startOverlay","quizOverlay","historyOverlay","gameOverOverlay","winOverlay"];
      const anyOpen=overlays.some(id=>{const el=document.getElementById(id);return el&&!el.classList.contains("hidden");});
      const isPaused=!!(document.getElementById("btnPause")?.textContent?.includes("Continuar"));
      if(!anyOpen&&!isPaused) scene.physics.resume();
    }
  }catch{}
});

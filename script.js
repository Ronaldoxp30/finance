// ============================
// SUPABASE
// ============================

const SUPABASE_URL = "https://gdomsniafobyhlodcmnf.supabase.co";

const SUPABASE_KEY =
"sb_publishable_Dp8HKAN8AguzAVVhiWrpRw_BXbbk4by";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ============================
// VARIÁVEIS
// ============================

let tipoAtual = "entrada";
let usuarioAtual = null;

// ============================
// ELEMENTOS
// ============================

const btnLoginTab =
document.getElementById("btnLoginTab");

const btnCadastroTab =
document.getElementById("btnCadastroTab");

const loginBox =
document.getElementById("loginBox");

const cadastroBox =
document.getElementById("cadastroBox");

// ============================
// TROCA DE TELA
// ============================

btnLoginTab.onclick = () => {

  loginBox.classList.remove("hidden");
  cadastroBox.classList.add("hidden");

  btnLoginTab.classList.add("active");
  btnCadastroTab.classList.remove("active");
};

btnCadastroTab.onclick = () => {

  cadastroBox.classList.remove("hidden");
  loginBox.classList.add("hidden");

  btnCadastroTab.classList.add("active");
  btnLoginTab.classList.remove("active");
};

// ============================
// CADASTRO
// ============================

async function fazerCadastro(){

  const nome =
  document.getElementById("cadastroNome").value;

  const telefone =
  document.getElementById("cadastroTelefone").value;

  const senha =
  document.getElementById("cadastroSenha").value;

  if(senha.length !== 6){

    alert("A senha deve ter 6 dígitos");
    return;
  }

  const { error } = await supabaseClient
  .from("usuarios")
  .insert([
    {
      nome,
      telefone,
      senha
    }
  ]);

  if(error){

    alert(error.message);
    return;
  }

  alert("Cadastro realizado!");

  cadastroBox.classList.add("hidden");
  loginBox.classList.remove("hidden");

  btnCadastroTab.classList.remove("active");
  btnLoginTab.classList.add("active");
}

// ============================
// LOGIN
// ============================

async function fazerLogin(){

  const telefone =
  document.getElementById("loginTelefone").value;

  const senha =
  document.getElementById("loginSenha").value;

  const { data, error } = await supabaseClient
  .from("usuarios")
  .select("*")
  .eq("telefone", telefone)
  .eq("senha", senha)
  .single();

  if(error || !data){

  alert("Login inválido");
  return;
}

// ============================
// VERIFICAR MENSALIDADE
// ============================

const hoje = new Date();

const vencimento = new Date(
  data.vencimento
);

if(hoje > vencimento){

  alert(
    "Mensalidade vencida"
  );

  return;
}

if(data.ativo === false){

  alert(
    "Conta bloqueada"
  );

  return;
}

usuarioAtual = data;

  localStorage.setItem(
    "usuario",
    JSON.stringify(data)
  );

  abrirSistema();
}

// ============================
// ABRIR SISTEMA
// ============================

function abrirSistema(){

  document
    .getElementById("authContainer")
    .classList.add("hidden");

  document
    .getElementById("appContainer")
    .classList.remove("hidden");

  document
    .getElementById("tituloPainel")
    .innerText =
    `Painel Financeiro de ${usuarioAtual.nome}`;

  carregarMovimentacoes();
}

// ============================
// LOGOUT
// ============================

function logout(){

  localStorage.removeItem("usuario");

  location.reload();
}

// ============================
// MODAL
// ============================

function abrirModal(tipo){

  tipoAtual = tipo;

  document
  .getElementById("modal")
  .classList.remove("hidden");

  document
  .getElementById("tituloModal")
  .innerText =
  tipo === "entrada"
  ? "Nova Entrada"
  : "Nova Saída";
}

function fecharModal(){

  document
  .getElementById("modal")
  .classList.add("hidden");
}

// ============================
// SALVAR MOVIMENTAÇÃO
// ============================

async function salvarMovimentacao(){

  const valor = Number(
    document.getElementById("valor").value
  );

  const descricao =
  document.getElementById("descricao").value;

  if(!valor || !descricao){

    alert("Preencha todos os campos");
    return;
  }

  const { error } = await supabaseClient
  .from("movimentacoes")
  .insert([
    {
      usuario_id: usuarioAtual.id,
      tipo: tipoAtual,
      valor,
      descricao
    }
  ]);

  if(error){

    alert(error.message);
    return;
  }

  fecharModal();

  document.getElementById("valor").value = "";
  document.getElementById("descricao").value = "";

  carregarMovimentacoes();
}

// ============================
// CARREGAR MOVIMENTAÇÕES
// ============================

async function carregarMovimentacoes(){

  const filtro =
  document.getElementById("filtroTipo").value;

  let query = supabaseClient
  .from("movimentacoes")
  .select("*")
  .eq("usuario_id", usuarioAtual.id)
  .order("id", { ascending:false });

  if(filtro !== "todos"){

    query = query.eq("tipo", filtro);
  }

  const { data, error } = await query;

  if(error){

    alert(error.message);
    return;
  }

  let entradas = 0;
  let saidas = 0;

  const lista =
  document.getElementById("listaMovimentacoes");

  lista.innerHTML = "";

  data.forEach(item => {

    if(item.tipo === "entrada"){

      entradas += Number(item.valor);

    } else {

      saidas += Number(item.valor);
    }

    lista.innerHTML += `
      <div class="item">

        <div>
          <h4>${item.descricao}</h4>
          <small>${item.tipo}</small>
        </div>

        <div class="acoes-item">

          <strong>
            R$ ${Number(item.valor).toFixed(2)}
          </strong>

          <button
            class="editar"
            onclick="editarMovimentacao(${item.id})"
          >
            ✏️
          </button>

          <button
            class="excluir"
            onclick="excluirMovimentacao(${item.id})"
          >
            🗑️
          </button>

        </div>

      </div>
    `;
  });

  document.getElementById("totalEntradas")
  .innerText =
  `R$ ${entradas.toFixed(2)}`;

  document.getElementById("totalSaidas")
  .innerText =
  `R$ ${saidas.toFixed(2)}`;

  document.getElementById("saldoTotal")
.innerText =
`R$ ${(entradas - saidas).toFixed(2)}`;

atualizarGrafico(
  entradas,
  saidas
);
}

// ============================
// EXCLUIR
// ============================

async function excluirMovimentacao(id){

  const senha = prompt(
    "Digite sua senha para excluir:"
  );

  if(senha !== usuarioAtual.senha){

    alert("Senha incorreta");
    return;
  }

  const { error } = await supabaseClient
  .from("movimentacoes")
  .delete()
  .eq("id", id);

  if(error){

    alert(error.message);
    return;
  }

  carregarMovimentacoes();
}

// ============================
// EDITAR
// ============================

async function editarMovimentacao(id){

  const senha = prompt(
    "Digite sua senha para editar:"
  );

  if(senha !== usuarioAtual.senha){

    alert("Senha incorreta");
    return;
  }

  const novoValor = prompt(
    "Novo valor:"
  );

  const novaDescricao = prompt(
    "Nova descrição:"
  );

  if(!novoValor || !novaDescricao){

    alert("Preencha tudo");
    return;
  }

  const { error } = await supabaseClient
  .from("movimentacoes")
  .update({
    valor: novoValor,
    descricao: novaDescricao
  })
  .eq("id", id);

  if(error){

    alert(error.message);
    return;
  }

  carregarMovimentacoes();
}

// ============================
// INICIAR
// ============================

window.onload = () => {

  fecharModal();

  const usuario =
  localStorage.getItem("usuario");

  if(usuario){

    usuarioAtual = JSON.parse(usuario);

    abrirSistema();
  }
};
// ============================
// GRÁFICO
// ============================

let grafico = null;

function atualizarGrafico(entradas, saidas){

  const ctx =
  document.getElementById("graficoFinanceiro");

  if(grafico){

    grafico.destroy();
  }

  grafico = new Chart(ctx, {

    type: "doughnut",

    data: {

      labels: [
        "Entradas",
        "Saídas"
      ],

      datasets: [{

        data: [
          entradas,
          saidas
        ],

        backgroundColor: [
          "#10b981",
          "#ef4444"
        ]

      }]
    }
  });
}

// ============================
// EXPORTAR HISTÓRICO
// ============================

async function exportarHistorico(){

  const senha = prompt(
    "Digite sua senha para exportar:"
  );

  if(senha !== usuarioAtual.senha){

    alert("Senha incorreta");
    return;
  }

  const tipo =
  document.getElementById("tipoExportacao").value;

  let query = supabaseClient
  .from("movimentacoes")
  .select("*")
  .eq("usuario_id", usuarioAtual.id);

  if(tipo !== "todos"){

    query = query.eq("tipo", tipo);
  }

  const { data, error } = await query;

  if(error){

    alert(error.message);
    return;
  }

  let texto = "HISTÓRICO FINANCEIRO\n\n";

  data.forEach(item => {

    texto += `
Descrição: ${item.descricao}
Tipo: ${item.tipo}
Valor: R$ ${item.valor}

--------------------------
`;
  });

  const blob = new Blob(
    [texto],
    { type:"text/plain" }
  );

  const link =
  document.createElement("a");

  link.href =
  URL.createObjectURL(blob);

  link.download =
  "historico.txt";

  link.click();
}
// ============================
// FINALIZAR MÊS
// ============================

async function finalizarMes(){

  const senha = prompt(
    "Digite sua senha:"
  );

  if(senha !== usuarioAtual.senha){

    alert("Senha incorreta");
    return;
  }

  // ============================
  // BUSCAR MOVIMENTAÇÕES
  // ============================

  const { data, error } =
  await supabaseClient
  .from("movimentacoes")
  .select("*")
  .eq("usuario_id", usuarioAtual.id);

  if(error){

    alert(error.message);
    return;
  }

  if(data.length === 0){

    alert(
      "Não há movimentações"
    );

    return;
  }

  // ============================
  // CALCULAR
  // ============================

  let entradas = 0;
  let saidas = 0;

  data.forEach(item => {

    if(item.tipo === "entrada"){

      entradas += Number(item.valor);

    } else {

      saidas += Number(item.valor);
    }
  });

  const saldo =
  entradas - saidas;

  // ============================
  // MÊS
  // ============================

  const agora =
  new Date();

  const mes =
  `${agora.getMonth()+1}/${agora.getFullYear()}`;

  // ============================
  // SALVAR HISTÓRICO
  // ============================

  const {
    error:erroHistorico
  } = await supabaseClient

  .from("historico_mensal")

  .insert([{

    usuario_id:usuarioAtual.id,

    mes,

    entradas,

    saidas,

    saldo,

    dados:data
  }]);

  if(erroHistorico){

    alert(
      erroHistorico.message
    );

    return;
  }

  // ============================
  // LIMPAR DASHBOARD
  // ============================

  const {
    error:erroDelete
  } = await supabaseClient

  .from("movimentacoes")

  .delete()

  .eq(
    "usuario_id",
    usuarioAtual.id
  );

  if(erroDelete){

    alert(
      erroDelete.message
    );

    return;
  }

  // ============================
  // ATUALIZAR TELA
  // ============================

  carregarMovimentacoes();

  alert(
    "Mês finalizado com sucesso!"
  );
}
  const { data, error } =
  await supabaseClient
  .from("movimentacoes")
  .select("*")
  .eq("usuario_id", usuarioAtual.id);

  if(error){

    alert(error.message);
    return;
  }

  let entradas = 0;
  let saidas = 0;

  data.forEach(item => {

    if(item.tipo === "entrada"){

      entradas += Number(item.valor);

    } else {

      saidas += Number(item.valor);
    }
  });

  const saldo =
  entradas - saidas;

  const agora =
  new Date();

  const mes =
  `${agora.getMonth()+1}/${agora.getFullYear()}`;

  const { error: erroHistorico } =
  await supabaseClient
  .from("historico_mensal")
  .insert([{

    usuario_id: usuarioAtual.id,

    mes,

    entradas,

    saidas,

    saldo,

    dados:data
  }]);

  if(erroHistorico){

    alert(erroHistorico.message);
    return;
  }

  alert(
    "Mês finalizado com sucesso!"
  );
}

// ============================
// ABRIR HISTÓRICO
// ============================

async function abrirHistoricoMensal(){

  document
  .getElementById("historicoModal")
  .classList.remove("hidden");

  carregarHistoricoMensal();
}

function fecharHistorico(){

  document
  .getElementById("historicoModal")
  .classList.add("hidden");
}

// ============================
// CARREGAR HISTÓRICO
// ============================

async function carregarHistoricoMensal(){

  const { data, error } =
  await supabaseClient
  .from("historico_mensal")
  .select("*")
  .eq("usuario_id", usuarioAtual.id)
  .order("id", { ascending:false });

  if(error){

    alert(error.message);
    return;
  }

  const lista =
  document.getElementById(
    "listaHistorico"
  );

  lista.innerHTML = "";

  data.forEach(item => {

    lista.innerHTML += `

      <div class="item">

        <div>

          <h3>
            ${item.mes}
          </h3>

          <small>

            Entradas:
            R$ ${item.entradas}

          </small>

          <br>

          <small>

            Saídas:
            R$ ${item.saidas}

          </small>

          <br>

          <small>

            Saldo:
            R$ ${item.saldo}

          </small>

        </div>

        <button
          onclick="exportarPDFHistorico(${item.id})"
        >

          Exportar PDF

        </button>

      </div>

    `;
  });
}

// ============================
// EXPORTAR PDF HISTÓRICO
// ============================

async function exportarPDFHistorico(id){

  const { data, error } =
  await supabaseClient
  .from("historico_mensal")
  .select("*")
  .eq("id", id)
  .single();

  if(error){

    alert(error.message);
    return;
  }

  const { jsPDF } =
  window.jspdf;

  const doc =
  new jsPDF();

  doc.setFontSize(22);

  doc.text(
    "Histórico Financeiro",
    20,
    20
  );

  doc.setFontSize(14);

  doc.text(
    `Mês: ${data.mes}`,
    20,
    40
  );

  doc.text(
    `Entradas: R$ ${data.entradas}`,
    20,
    55
  );

  doc.text(
    `Saídas: R$ ${data.saidas}`,
    20,
    70
  );

  doc.text(
    `Saldo: R$ ${data.saldo}`,
    20,
    85
  );

  let y = 110;

  data.dados.forEach(item => {

    doc.text(

      `${item.descricao}
${item.tipo}
R$ ${item.valor}`,

      20,
      y
    );

    y += 20;
  });

  doc.save(
    `historico-${data.mes}.pdf`
  );
}
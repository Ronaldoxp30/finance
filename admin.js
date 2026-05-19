const SUPABASE_URL =
"https://gdomsniafobyhlodcmnf.supabase.co";

const SUPABASE_KEY =
"sb_publishable_Dp8HKAN8AguzAVVhiWrpRw_BXbbk4by";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function carregarClientes(){

  const { data, error } =
  await supabaseClient
  .from("usuarios")
  .select("*");

  if(error){

    alert(error.message);
    return;
  }

  const clientes =
  document.getElementById("clientes");

  clientes.innerHTML = "";

  data.forEach(cliente => {

    const hoje =
    new Date();

    const vencimento =
    new Date(cliente.vencimento);

    const atrasado =
    hoje > vencimento;

    clientes.innerHTML += `

      <div class="cliente">

        <div>

          <h3>
            ${cliente.nome}
          </h3>

          <small>
            ${cliente.telefone}
          </small>

          <br><br>

          <small>

            Vencimento:
            ${cliente.vencimento}

          </small>

          <br><br>

          ${
            atrasado
            ? `
            <span class="atrasado">

              MENSALIDADE ATRASADA

            </span>
            `
            : `
            <span>

              Em dia

            </span>
            `
          }

        </div>

        <div>

          <button
            class="bloquear"
            onclick="bloquear(${cliente.id})"
          >

            Bloquear

          </button>

          <button
            class="liberar"
            onclick="liberar(${cliente.id})"
          >

            Liberar

          </button>

        </div>

      </div>

    `;
  });
}

async function bloquear(id){

  await supabaseClient
  .from("usuarios")
  .update({
    ativo:false
  })
  .eq("id", id);

  carregarClientes();
}

async function liberar(id){

  const novaData =
  new Date();

  novaData.setDate(
    novaData.getDate() + 30
  );

  await supabaseClient
  .from("usuarios")
  .update({

    ativo:true,

    vencimento:novaData

  })
  .eq("id", id);

  carregarClientes();
}

carregarClientes();
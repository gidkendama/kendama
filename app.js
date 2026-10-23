
const SUPABASE_URL = "https://rsqaoqbabgsnjmujyqvi.supabase.co";
const SUPABASE_KEY = "sb_publishable_l5_FlyPCOACpjOzHclgrNg_4wIl0sAK";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let products = [];
  
const $ = id => document.getElementById(id);
const money = amount => "$" + amount.toFixed(2);

function renderCatalog(query = "") {
  const filtered = products.filter(p =>
    `${p.name} ${p.brand} ${p.type}`.toLowerCase().includes(query.toLowerCase())
  );

  $("products").innerHTML = filtered.map(p => `
    <article class="product-card">
    <div class="product-art" style="--paint:${p.color}">
  ${p.image
    ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;">`
    : `<div class="ball"></div>`}
</div>
      <div class="product-info">
        <p>${p.brand} · ${p.type.toUpperCase()}</p>
        <h3>${p.name}</h3>
        <p>${money(p.price)}</p>
        <button data-select="${p.id}">Use in builder ↗</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll("[data-select]").forEach(button => {
    button.addEventListener("click", () => {
    const product = products.find(p => p.id === button.dataset.select);
     if (!product) return;
      $(product.type).value = String(product.id);
      updatePreview();
      $("builder").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function fillSelect(id, type) {
  $(id).innerHTML = products
    .filter(p => p.type === type)
    .map(p => `<option value="${p.id}">${p.brand} — ${p.name} (${money(p.price)})</option>`)
    .join("");
}


function updatePreview() {
  const ken = products.find(p => p.id === $("ken").value);
  const tama = products.find(p => p.id === $("tama").value);

  if (!ken || !tama) return;

  // Show the actual product photos.
  $("ken-preview").src = ken.image || "";
  $("tama-preview").src = tama.image || "";

  // Show the selected product names.
  $("ken-preview-name").textContent = ken.name;
  $("tama-preview-name").textContent = tama.name;

  // Keep the string color preview.
  $("string-preview").style.background = $("string").value.toLowerCase();

  // Update build information.
  $("build-name").textContent = `${ken.brand} Ken + ${tama.brand} Tama`;
  $("build-details").textContent =
    `${ken.name} + ${tama.name} · ${$("string").value} string`; 

  // Explain the selected combination using saved product descriptions.
  const kenDescription = ken.description || "";
  const tamaDescription = tama.description || "";

  $("combo-strengths").textContent =
    kenDescription || tamaDescription
      ? `Ken: ${kenDescription || "No description added yet."} Tama: ${tamaDescription || "No description added yet."}`
      : "Add official product descriptions to learn more about this combination.";

  $("combo-considerations").textContent =
    "Compatibility depends on the tama size, product specifications, and your personal playing style.";


  const total = ken.price + tama.price;
  $("build-price").textContent = money(total);
}

$("search").addEventListener("input", e => renderCatalog(e.target.value));
["ken", "tama", "string"].forEach(id =>
  $(id).addEventListener("change", updatePreview)
);

$("add-build").addEventListener("click", () => {
  const count = Number($("cart-count").textContent) + 1;
  $("cart-count").textContent = count;
  $("add-build").textContent = "BUILD SAVED ✓";
  setTimeout(() => $("add-build").textContent = "SAVE MY BUILD", 1500);
});

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Could not load products:", error);
    $("products").textContent = "Could not load products. Check the browser console.";
    return;
  }

  products = data.map(p => ({
    id: p.id,
    name: p.name,

    name: p.name,
    description: p.description || "",
    brand: p.brand,

    brand: p.brand,
    type: p.product_type === "full_kendama" ? "ken" : p.product_type,
    price: Number(p.price || 0),
    color: "#c6a16e",
    image: p.image_url
  }));

  fillSelect("ken", "ken");
  fillSelect("tama", "tama");
  renderCatalog();
  updatePreview();
}

loadProducts();
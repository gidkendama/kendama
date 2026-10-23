
const SUPABASE_URL = "https://rsqaoqbabgsnjmujyqvi.supabase.co";
const SUPABASE_KEY = "sb_publishable_l5_FlyPCOACpjOzHclgrNg_4wIl0sAK";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let products = [];

const $ = id => document.getElementById(id);

const money = amount =>
  "$" + Number(amount || 0).toFixed(2);


// ------------------------------
// PRODUCT CATALOG
// ------------------------------

function renderCatalog(query = "") {
  const filtered = products.filter(p =>
    `${p.name} ${p.brand} ${p.type}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  $("products").innerHTML = filtered.map(p => `
    <article class="product-card">
      <div class="product-art" style="--paint:${p.color}">
        ${
          p.image
            ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:contain;">`
            : `<div class="ball"></div>`
        }
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
      const product = products.find(
        p => String(p.id) === button.dataset.select
      );

      if (!product) return;

      const selectType = product.type === "ken" || product.type === "tama"
        ? product.type
        : null;

      if (!selectType) {
        $("builder").scrollIntoView({ behavior: "smooth" });
        return;
      }

      $(selectType).value = String(product.id);
      updatePreview();

      $("builder").scrollIntoView({ behavior: "smooth" });
    });
  });
}


// ------------------------------
// BUILDER DROPDOWNS
// ------------------------------

function fillSelect(id, type) {
  const select = $(id);

  if (!select) return;

  select.innerHTML = products
    .filter(p => p.type === type)
    .map(p =>
      `<option value="${p.id}">${p.brand} — ${p.name} (${money(p.price)})</option>`
    )
    .join("");
}


// ------------------------------
// PRICE + BUILD PREVIEW
// ------------------------------

function updatePreview() {
  const kenSelect = $("ken");
  const tamaSelect = $("tama");

  if (!kenSelect || !tamaSelect) return;

  const ken = products.find(
    p => String(p.id) === String(kenSelect.value)
  );

  const tama = products.find(
    p => String(p.id) === String(tamaSelect.value)
  );

  if (!ken || !tama) return;

  // Product images.
  $("ken-preview").src = ken.image || "";
  $("tama-preview").src = tama.image || "";

  // Product names.
  $("ken-preview-name").textContent = ken.name;
  $("tama-preview-name").textContent = tama.name;

  // String color.
  $("string-preview").style.background =
    $("string").value.toLowerCase();

  // Build title and details.
  $("build-name").textContent =
    `${ken.brand} Ken + ${tama.brand} Tama`;

  $("build-details").textContent =
    `${ken.name} + ${tama.name} · ${$("string").value} string`;
  analyzeCombo(ken, tama);

  // Product descriptions.
  const kenDescription = ken.description || "";
  const tamaDescription = tama.description || "";

  if ($("combo-ken-description")) {
    $("combo-ken-description").textContent =
      kenDescription ||
      "No official description has been added for this ken yet.";
  }

  if ($("combo-tama-description")) {
    $("combo-tama-description").textContent =
      tamaDescription ||
      "No official description has been added for this tama yet.";
  }

  // Compatibility information.
  const kenText = kenDescription.toLowerCase();
  const tamaText = tamaDescription.toLowerCase();

  const kenRecommends62mm =
    kenText.includes("62mm") || kenText.includes("62 mm");

  const tamaIs62mm =
    /62\s*mm/i.test(tamaText);

  if ($("combo-compatibility")) {
    $("combo-compatibility").textContent =
      kenRecommends62mm && tamaIs62mm
        ? "Size match: the ken recommends a 62 mm tama, and the selected tama is listed as 62 mm."
        : "Check the official product specifications to confirm the recommended tama size.";
  }

  // Things to consider.
  if ($("combo-considerations")) {
    $("combo-considerations").textContent =
      "Check the official specifications for size and weight. Personal playing feel can vary.";
  }


  // Calculate the total as numbers.
  const total =
    Number(ken.price || 0) + Number(tama.price || 0);

  $("build-price").textContent = money(total);
}


// ------------------------------
// SEARCH + BUILDER EVENTS
// ------------------------------

if ($("search")) {
  $("search").addEventListener("input", e => {
    renderCatalog(e.target.value);
  });
}

["ken", "tama", "string"].forEach(id => {
  if ($(id)) {
    $(id).addEventListener("change", updatePreview);
  }
});


// ------------------------------
// SAVE BUILD BUTTON
// ------------------------------

if ($("add-build")) {
  $("add-build").addEventListener("click", () => {
    const cartCount = $("cart-count");

    if (!cartCount) return;

    const count = Number(cartCount.textContent) + 1;
    cartCount.textContent = count;

    $("add-build").textContent = "BUILD SAVED ✓";

    setTimeout(() => {
      $("add-build").textContent = "SAVE MY BUILD";
    }, 1500);
  });
}


// ------------------------------
// LOAD PRODUCTS FROM SUPABASE
// ------------------------------

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("Could not load products:", error);

    if ($("products")) {
      $("products").textContent =
        "Could not load products. Check the browser console.";
    }

    return;
  }

  products = (data || []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || "",
    brand: p.brand,
    type: p.product_type === "full_kendama"
      ? "ken"
      : p.product_type,
    price: Number(p.price || 0),
    color: "#c6a16e",
    image: p.image_url || ""
  }));

  fillSelect("ken", "ken");
  fillSelect("tama", "tama");

  renderCatalog();
  updatePreview();
}


// Start the website.
loadProducts();


// ------------------------------
// FREE KENDAMA COMBO ANALYZER
// ------------------------------

function analyzeCombo(ken, tama) {
  const result = $("combo-ai-result");
  if (!result) return;

  const kenDescription = ken.description || "";
  const tamaDescription = tama.description || "";

  const kenText = kenDescription.toLowerCase();
  const tamaText = tamaDescription.toLowerCase();

  const insights = [];

  // Check whether both descriptions mention 62 mm.
  const kenMentions62 = /62\s*mm/i.test(kenDescription);
  const tamaMentions62 = /62\s*mm/i.test(tamaDescription);

  if (kenMentions62 && tamaMentions62) {
    insights.push(
      "Size: both product descriptions mention 62 mm, which is a promising size match."
    );
  } else {
    insights.push(
      "Size: the available descriptions don't confirm a matching recommended tama size. Check the manufacturers' specifications."
    );
  }

  // Summarize the information actually available.
  insights.push(
    kenDescription
      ? `Ken details: ${kenDescription}`
      : "Ken details: no product description is available yet."
  );

  insights.push(
    tamaDescription
      ? `Tama details: ${tamaDescription}`
      : "Tama details: no product description is available yet."
  );

  // Look for coating information without guessing how it plays.
  if (
    tamaText.includes("rhino clear") ||
    tamaText.includes("sticky") ||
    tamaText.includes("silk")
  ) {
    insights.push(
      "Tama finish: the description mentions a finish or coating. Its playing feel can depend on the specific product and condition."
    );
  }

  result.textContent =
    "Here's your combo breakdown:\n\n" + insights.join("\n\n");
}

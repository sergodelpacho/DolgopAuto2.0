// app.js — весь функционал (каталог, карточка, корзина, отправка в TG/почту)
const SITE = {
  phoneDisplay: "8 (977) 936-29-53",
  phoneLink: "tel:+79779362953",
  email: "dolgopauto@mail.ru",

  telegramChat: "https://t.me/avantekru",
  maxLink: "https://max.ru/u/f9LHodD0cOKj3dtP8OrowftL4OglmMfxSO4WeATngrdyDcu9j8BsUteLcBk",
  vkLink: "https://m.vk.com/dolgopauto",
};

function money(n){
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}
function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return [...root.querySelectorAll(sel)]; }

function getCart(){
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
}
function setCart(items){
  localStorage.setItem("cart", JSON.stringify(items));
  renderCartCount();
}
function addToCart(id, qty=1){
  const cart = getCart();
  const x = cart.find(i => i.id === id);
  if(x) x.qty += qty;
  else cart.push({id, qty});
  setCart(cart);
}
function removeFromCart(id){
  setCart(getCart().filter(i => i.id !== id));
}
function updateQty(id, qty){
  const cart = getCart();
  const x = cart.find(i => i.id === id);
  if(!x) return;
  x.qty = Math.max(1, Number(qty) || 1);
  setCart(cart);
}
function cartCount(){
  return getCart().reduce((s,i)=>s+i.qty,0);
}
function renderCartCount(){
  qsa("[data-cart-count]").forEach(el => el.textContent = String(cartCount()));
}

function productById(id){
  return (window.PRODUCTS||[]).find(p => p.id === id);
}

/* ===== Featured on main ===== */
function renderFeatured(){
  const wrap = qs("[data-featured]");
  if(!wrap) return;

  const items = (window.PRODUCTS||[]).slice(0,4);
  wrap.innerHTML = items.map(p => 
    <div class="card pcard">
      <div class="pimg" style="background-image:url('${p.image}')"></div>
      <div class="pbody">
        <p class="pname">${p.name}</p>
        <p class="pmeta">${p.short}</p>
        <div class="rowBetween">
          <span class="price">${money(p.price)}</span>
          <a class="btn btn--primary" href="product.html?id=${encodeURIComponent(p.id)}">Подробнее</a>
        </div>
      </div>
    </div>
  ).join("");
}

/* ===== Catalog ===== */
function renderCatalog(){
  const list = qs("[data-catalog]");
  if(!list) return;

  const search = qs("#q");
  const catSel = qs("#cat");

  const categories = ["Все", ...new Set((window.PRODUCTS||[]).map(p=>p.category))];
  if(catSel){
    catSel.innerHTML = categories.map(c=><option value="${c}">${c}</option>).join("");
  }

  function apply(){
    const q = (search?.value || "").trim().toLowerCase();
    const c = (catSel?.value || "Все");

    const filtered = (window.PRODUCTS||[]).filter(p=>{
      const okQ = !q  (p.name.toLowerCase().includes(q)  p.short.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
      const okC = (c==="Все") || (p.category===c);
      return okQ && okC;
    });

    list.innerHTML = filtered.map(p => 
      <div class="card pcard">
        <div class="pimg" style="background-image:url('${p.image}')"></div>
        <div class="pbody">
          <p class="pname">${p.name}</p>
          <p class="pmeta">${p.category} • ${p.short}</p>
          <div class="rowBetween">
            <span class="price">${money(p.price)}</span>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn btn--solid" type="button" data-add="${p.id}">В корзину</button>
              <a class="btn btn--primary" href="product.html?id=${encodeURIComponent(p.id)}">Открыть</a>
            </div>
          </div>
        </div>
      </div>
    ).join("");

    qsa("[data-add]", list).forEach(btn=>{
      btn.addEventListener("click", ()=>{
        addToCart(btn.getAttribute("data-add"), 1);
      });
    });
  }

  search?.addEventListener("input", apply);
  catSel?.addEventListener("change", apply);
  apply();
}

/* ===== Product page ===== */
function renderProductPage(){
  const root = qs("[data-product]");
  if(!root) return;
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const p = productById(id);

  if(!p){
    root.innerHTML = 
      <section class="card card--pad">
        <h2 class="h2">Товар не найден</h2>
        <p class="muted">Вернитесь в каталог.</p>
        <a class="btn btn--solid" href="catalog.html">В каталог</a>
      </section>
    ;
    return;
  }

  root.innerHTML = 
    <section class="card productPage">
      <div class="productHero">
        <div class="productImg" style="background-image:url('${p.image}')"></div>
        <div class="productInfo">
          <h1>${p.name}</h1>
          <div class="muted">${p.category} • ${p.brand}</div>

          <div class="divider"></div>

          <div class="rowBetween">
            <div class="muted">Цена (пример витрины):</div>
            <div class="price" style="font-size:22px;">${money(p.price)}</div>
          </div>

          <p class="muted" style="margin-top:12px; line-height:1.6;">${p.description}</p>

          <div class="productActions">
            <button class="btn btn--solid" type="button" id="addThis">Добавить в корзину</button>
            <a class="btn btn--primary" href="cart.html">Перейти в корзину</a>
            <a class="btn btn--ghost" href="catalog.html">← Назад</a>
          </div>

          <div class="notice" style="margin-top:14px;">
            Для точного подбора лучше VIN — напишите в Telegram/MAX/VK или оставьте заявку на странице контактов.
          </div>
        </div>
      </div>
    </section>
  ;

  qs("#addThis")?.addEventListener("click", ()=> addToCart(p.id, 1));
}

/* ===== Cart page ===== */
function renderCartPage(){
  const root = qs("[data-cart]");
  if(!root) return;

  const cart = getCart().map(i => ({...i, p: productById(i.id)})).filter(x=>x.p);
  const sum = cart.reduce((s,x)=>s + x.p.price * x.qty, 0);

  if(cart.length === 0){
    root.innerHTML = 
      <section class="card card--pad">
        <h2 class="h2">Корзина пуста</h2>
        <p class="muted">Добавьте товары из каталога или оформите подбор по VIN.</p>
        <div class="cta" style="margin-top:12px;">
          <a class="btn btn--solid" href="catalog.html">В каталог</a>
          <a class="btn btn--primary" href="contacts.html">Подбор по VIN</a>
        </div>
      </section>
    ;
    return;
  }

  root.innerHTML = 
    <section class="card card--pad">
      <h2 class="h2">Корзина</h2>
      <p class="muted">Проверьте количество и отправьте заказ в Telegram или на почту.</p>

      <div style="margin-top:14px; display:grid; gap:12px;">
        ${cart.map(x=>
          <div class="cartItem">
            <div class="cartThumb" style="background-image:url('${x.p.image}')"></div>
            <div>
              <div style="font-weight:900;">${x.p.name}</div>
              <div class="muted" style="font-size:13px; margin-top:4px;">${money(x.p.price)} • ${x.p.category}</div>
            </div>
            <div style="text-align:right;">
              <div style="display:flex; gap:10px; align-items:center; justify-content:flex-end; flex-wrap:wrap;">
                <input class="input qty" type="number" min="1" value="${x.qty}" data-qty="${x.id}">
                <button class="btn btn--ghost" type="button" data-del="${x.id}">Удалить</button>
              </div>
              <div style="margin-top:6px; font-weight:900;">${money(x.p.price * x.qty)}</div>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="divider"></div>

      <div class="rowBetween">
        <div class="muted">Итого:</div>
        <div class="price" style="font-size:22px;">${money(sum)}</div>
      </div>

      <div class="divider"></div>

      <div class="formGrid">
        <input class="input" id="cust_name" placeholder="Имя">
        <input class="input" id="cust_contact" placeholder="Контакт (+7… или @username Telegram)">
      </div>

      <div style="height:12px"></div>
      <textarea class="input" id="cust_comment" placeholder="Комментарий к заказу (необязательно)"></textarea>
      <div class="cta" style="margin-top:12px;">
        <button class="btn btn--solid" type="button" id="sendOrderTg">Отправить в Telegram</button>
        <button class="btn btn--primary" type="button" id="sendOrderMail">Отправить на почту</button>
        <button class="btn btn--ghost" type="button" id="clearCart">Очистить корзину</button>
      </div>

      <div class="notice" style="margin-top:12px;">
        Отправка без сервера: откроется Telegram или почтовый клиент (подходит для GitHub Pages).
      </div>
    </section>
  ;

  qsa("[data-qty]").forEach(inp=>{
    inp.addEventListener("change", ()=> updateQty(inp.getAttribute("data-qty"), inp.value));
  });
  qsa("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=> {
      removeFromCart(btn.getAttribute("data-del"));
      renderCartPage();
    });
  });

  qs("#clearCart")?.addEventListener("click", ()=>{
    setCart([]);
    renderCartPage();
  });

  function buildOrderText(){
    const name = (qs("#cust_name")?.value||"").trim();
    const contact = (qs("#cust_contact")?.value||"").trim();
    const comment = (qs("#cust_comment")?.value||"").trim();

    const lines = [];
    lines.push("Заказ с сайта DolgopAuto");
    lines.push("");
    lines.push(Имя: ${name||"-"});
    lines.push(Контакт: ${contact||"-"});
    lines.push("");
    lines.push("Состав заказа:");
    cart.forEach(x=>{
      lines.push(• ${x.p.name} — ${x.qty} шт × ${money(x.p.price)} = ${money(x.p.price*x.qty)});
    });
    lines.push("");
    lines.push(Итого: ${money(sum)});
    if(comment){
      lines.push("");
      lines.push("Комментарий:");
      lines.push(comment);
    }
    return lines.join("\n");
  }

  qs("#sendOrderTg")?.addEventListener("click", ()=>{
    const text = buildOrderText();
    const url = "https://t.me/share/url?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
  });

  qs("#sendOrderMail")?.addEventListener("click", ()=>{
    const text = buildOrderText();
    const url = mailto:${SITE.email}?subject=${encodeURIComponent("Заказ DolgopAuto")}&body=${encodeURIComponent(text)};
    window.location.href = url;
  });
}

/* ===== Contacts form buttons ===== */
function contactsForm(){
  const btnTg = qs("#send_tg");
  const btnMail = qs("#send_mail");
  if(!btnTg && !btnMail) return;

  function val(id){ return (qs("#"+id)?.value || "").trim(); }
  function buildText(){
    return [
      "Заявка с сайта DolgopAuto",
      "",
      Имя: ${val("name") || "-"},
      Контакт: ${val("contact") || "-"},
      Тема: ${val("topic") || "-"},
      "",
      "Сообщение:",
      val("message") || "-"
    ].join("\n");
  }

  btnTg?.addEventListener("click", ()=>{
    const url = "https://t.me/share/url?text=" + encodeURIComponent(buildText());
    window.open(url, "_blank");
  });

  btnMail?.addEventListener("click", ()=>{
    const url = mailto:${SITE.email}?subject=${encodeURIComponent("Заявка DolgopAuto")}&body=${encodeURIComponent(buildText())}`;
    window.location.href = url;
  });
}

/* ===== boot ===== */
document.addEventListener("DOMContentLoaded", ()=>{
  renderCartCount();
  renderFeatured();
  renderCatalog();
  renderProductPage();
  renderCartPage();
  contactsForm();
});

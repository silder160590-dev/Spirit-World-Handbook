/* Craft Calculator Logic */
(function () {
  'use strict';

  var profSelect = document.getElementById('craft-profession');
  var recipeSelect = document.getElementById('craft-recipe');
  var levelSelect = document.getElementById('craft-level');
  var qtyInput = document.getElementById('craft-qty');
  var qtyMinus = document.getElementById('craft-qty-minus');
  var qtyPlus = document.getElementById('craft-qty-plus');
  var craftOutput = document.getElementById('craft-output');
  var rowCraft = document.getElementById('row-craft');
  var copyBtn = document.getElementById('craft-copy');
  var clearBtn = document.getElementById('craft-clear');

  /* Уровни рецептов: шаг 5, после 40 сразу 50 — как в игре */
  var RECIPE_LEVELS = [1, 5, 10, 15, 20, 25, 30, 35, 40, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  var MAX_RECIPE_LEVEL = RECIPE_LEVELS[RECIPE_LEVELS.length - 1];

  var PROFESSION_LABELS = {
    alchemist: 'Зельевар',
    enchanter: 'Заклинатель',
    cook: 'Кулинар',
    jeweler: 'Ювелир',
  };

  function fmtInt(v) {
    var s = Math.round(v).toString(10);
    var out = '', c = 0;
    for (var i = s.length - 1; i >= 0; i--) {
      out = s[i] + out;
      c++;
      if (c % 3 === 0 && i > 0) out = '\u00A0' + out;
    }
    return out;
  }

  function clampInt(v, min, max, fallback) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return fallback;
    if (n < min) return min;
    if (n > max) return max;
    return n;
  }

  /* Индекс уровня в RECIPE_LEVELS определяет множитель: 1 ур. = ×1, 5 ур. = ×2, ... 100 ур. = ×20 */
  function levelStep(level) {
    var idx = RECIPE_LEVELS.indexOf(level);
    return idx === -1 ? 1 : idx + 1;
  }

  /* Ингредиенты рецепта на выбранном уровне: колонка [имя, фактор, от, до]
     входит, если от <= уровень <= до; одинаковые имена суммируются. */
  function ingredientsFor(recipe, level) {
    var map = {};   // имя -> количество на 1 предмет
    var order = []; // порядок первого появления
    var cols = recipe.columns || [];
    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      var name = col[0];
      var factor = col[1];
      var from = col.length > 2 ? col[2] : RECIPE_LEVELS[0];
      var to = col.length > 3 ? col[3] : MAX_RECIPE_LEVEL;
      if (level < from || level > to) continue;
      if (!(name in map)) {
        map[name] = 0;
        order.push(name);
      }
      map[name] += factor * levelStep(level);
    }
    var out = [];
    for (var j = 0; j < order.length; j++) {
      out.push([order[j], map[order[j]]]);
    }
    return out;
  }

  function effectFor(recipe, level) {
    var effect = PRESET_RECIPE_EFFECTS[recipe.name];
    if (!effect) return '';
    var best = null;
    for (var i = 0; i < RECIPE_LEVELS.length; i++) {
      var current = RECIPE_LEVELS[i];
      if (current > level) break;
      if (effect[current] !== undefined) best = effect[current];
    }
    return best || '';
  }

  function outputFor(recipe) {
    return recipe.name;
  }

  function craftText(recipe, level, qty, ings) {
    var output = outputFor(recipe);
    var effect = effectFor(recipe, level);
    var text = '- производство = ' + qty + ' ' + output.toLowerCase();
    if (effect) text += ' (' + effect + ')';
    text += '\n';
    for (var i = 0; i < ings.length; i++) {
      text += (i === 0 ? '- ' : '') + fmtInt(ings[i][1] * qty) + ' ' + ings[i][0].toLowerCase() + '\n';
    }
    return text;
  }

  var selectedRecipe = null;

  function fillRecipes() {
    var prof = profSelect.value;
    recipeSelect.innerHTML = '';
    var placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = prof ? '— выберите рецепт —' : '— сначала выберите профессию —';
    recipeSelect.appendChild(placeholderOpt);

    var count = 0;
    for (var i = 0; i < PRESET_RECIPES.length; i++) {
      var r = PRESET_RECIPES[i];
      if (prof && r.profession !== prof) continue;
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = r.name + (prof ? '' : ' — ' + (PROFESSION_LABELS[r.profession] || r.profession));
      recipeSelect.appendChild(opt);
      count++;
    }
    recipeSelect.disabled = !prof || count === 0;
    if (count === 0) {
      placeholderOpt.textContent = '— нет рецептов —';
    }
    selectedRecipe = null;
    levelSelect.disabled = true;
    recalc();
  }

  function onRecipeChange() {
    var idx = parseInt(recipeSelect.value, 10);
    selectedRecipe = (!isNaN(idx) && PRESET_RECIPES[idx]) ? PRESET_RECIPES[idx] : null;
    levelSelect.disabled = !selectedRecipe;
    recalc();
  }

  function recalc() {
    var qty = clampInt(qtyInput.value, 1, 999, 1);
    qtyInput.value = String(qty);

    if (!selectedRecipe) {
      rowCraft.hidden = true;
      return;
    }

    var level = clampInt(levelSelect.value, 1, 100, 1);
    var ings = ingredientsFor(selectedRecipe, level);

    rowCraft.hidden = false;

    craftOutput.querySelector('.r-value-text').textContent = craftText(selectedRecipe, level, qty, ings);
  }

  profSelect.addEventListener('change', fillRecipes);
  profSelect.addEventListener('input', fillRecipes);
  recipeSelect.addEventListener('change', onRecipeChange);
  levelSelect.addEventListener('change', recalc);
  qtyInput.addEventListener('input', recalc);

  qtyMinus.addEventListener('click', function () {
    qtyInput.value = String(clampInt(qtyInput.value, 1, 999, 1) - 1);
    recalc();
  });

  qtyPlus.addEventListener('click', function () {
    qtyInput.value = String(clampInt(qtyInput.value, 1, 999, 1) + 1);
    recalc();
  });

  function resetResults() {
    rowCraft.hidden = true;
  }

  copyBtn.addEventListener('click', function () {
    if (!selectedRecipe || rowCraft.hidden || !craftOutput.querySelector('.r-value-text').textContent) return;
    var text = craftOutput.querySelector('.r-value-text').textContent;
    var textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    copyBtn.textContent = 'Скопировано!';
    copyBtn.classList.add('copied');
    setTimeout(function () {
      copyBtn.textContent = '📋 Копировать';
      copyBtn.classList.remove('copied');
    }, 2000);
  });

  clearBtn.addEventListener('click', function () {
    profSelect.value = '';
    fillRecipes();
    levelSelect.value = '1';
    qtyInput.value = '1';
    resetResults();
    profSelect.focus();
  });

  /* ——— Покупка/Продажа калькулятор ——— */
  var buySellInput = document.getElementById('item-input');
  var buySellList = document.getElementById('item-list');
  var modeSwitch = document.getElementById('mode-switch');
  var modeButtons = modeSwitch ? modeSwitch.querySelectorAll('.switch-btn') : [];
  var itemsList = document.getElementById('items-list');
  var totalValue = document.getElementById('total-value');
  var ITEMS = window.ITEMS || [];

  var MAX_LIST_ITEMS = 12;   // длина подсказок, как в комбобоксе монстров
  var pickedIdx = -1;        // подсвеченный пункт подсказок
  var itemRows = {};         // имя предмета -> количество (порядок задаёт DOM)
  var mode = 'buy';          // текущий режим: 'buy' (покупка) или 'sell' (продажа)

  /* Цена предмета в текущем режиме; '-' означает, что операция недоступна */
  function priceFor(item, mode) {
    var raw = mode === 'buy' ? item.buy : item.sell;
    return typeof raw === 'number' ? raw : null;
  }

  function currentMode() {
    return mode;
  }

  /* Переключатель покупка/продажа: активная кнопка и пересчёт цен */
  function setMode(next) {
    mode = next === 'sell' ? 'sell' : 'buy';
    for (var i = 0; i < modeButtons.length; i++) {
      var isActive = modeButtons[i].getAttribute('data-mode') === mode;
      modeButtons[i].classList.toggle('active', isActive);
      modeButtons[i].setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
    renderRows();
    if (buySellList.classList.contains('open')) renderItemList();
  }

  for (var mb = 0; mb < modeButtons.length; mb++) {
    (function (btn) {
      btn.addEventListener('click', function () { setMode(btn.getAttribute('data-mode')); });
    })(modeButtons[mb]);
  }

  /* Поиск по названию: сначала «начинается с», затем «содержит» */
  function searchItems(q) {
    var nq = norm(q.trim());
    if (!nq) return [];
    var starts = [], incl = [];
    for (var i = 0; i < ITEMS.length; i++) {
      var nn = norm(ITEMS[i].n);
      if (nn.indexOf(nq) === 0) starts.push(i);
      else if (nn.indexOf(nq) !== -1) incl.push(i);
    }
    return starts.concat(incl).slice(0, MAX_LIST_ITEMS);
  }

  function closeItemList() {
    buySellList.classList.remove('open');
    pickedIdx = -1;
  }

  function renderItemList() {
    var q = buySellInput.value;
    var hits = searchItems(q);
    pickedIdx = -1;

    if (!q.trim()) { buySellList.innerHTML = ''; closeItemList(); return; }

    if (hits.length === 0) {
      buySellList.innerHTML = '<div class="combo-empty">Ничего не найдено</div>';
      buySellList.classList.add('open');
      return;
    }

    var mode = currentMode();
    var html = '';
    for (var k = 0; k < hits.length; k++) {
      var it = ITEMS[hits[k]];
      var price = priceFor(it, mode);
      html += '<div class="combo-item" data-i="' + hits[k] + '" role="option">' +
        '<span>' + markMatch(it.n, q) + '</span>' +
        '<span class="price">' + (price === null ? '—' : fmtInt(price)) + '</span></div>';
    }
    buySellList.innerHTML = html;
    buySellList.classList.add('open');
  }

  /* Добавление позиции: повторный выбор предмета увеличивает количество */
  function addItem(name) {
    var item = null;
    for (var i = 0; i < ITEMS.length; i++) {
      if (ITEMS[i].n === name) { item = ITEMS[i]; break; }
    }
    if (!item) return;

    if (itemRows[name] !== undefined) {
      setRowQty(name, itemRows[name] + 1);
      return;
    }

    var row = document.createElement('div');
    row.className = 'item-row';
    row.setAttribute('data-name', name);
    row.innerHTML =
      '<span class="item-name">' + escapeHtml(name) + '</span>' +
      '<span class="item-amount" data-amount>0</span>' +
      '<span class="stepper">' +
        '<button type="button" data-minus aria-label="Уменьшить количество">−</button>' +
        '<input type="number" data-qty inputmode="numeric" min="1" step="1" value="1" aria-label="Количество">' +
        '<button type="button" data-plus aria-label="Увеличить количество">+</button>' +
      '</span>';

    itemsList.appendChild(row);
    itemRows[name] = 1;

    row.querySelector('[data-plus]').addEventListener('click', function () {
      setRowQty(name, itemRows[name] + 1);
    });
    row.querySelector('[data-minus]').addEventListener('click', function () {
      setRowQty(name, Math.max(1, itemRows[name] - 1));
    });
    row.querySelector('[data-qty]').addEventListener('input', function () {
      setRowQty(name, clampInt(this.value, 1, 999, 1));
    });

    renderRows();
  }

  function setRowQty(name, qty) {
    if (itemRows[name] === undefined) return;
    itemRows[name] = qty;
    var row = itemsList.querySelector('.item-row[data-name="' + cssEscape(name) + '"]');
    if (row) row.querySelector('[data-qty]').value = String(qty);
    renderRows();
  }

  /* Пересчёт сумм в списке и итога; вызывается и при смене режима */
  function renderRows() {
    var mode = currentMode();
    var total = 0;
    var rows = itemsList.querySelectorAll('.item-row');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var name = row.getAttribute('data-name');
      var item = null;
      for (var j = 0; j < ITEMS.length; j++) {
        if (ITEMS[j].n === name) { item = ITEMS[j]; break; }
      }
      var qty = itemRows[name] || 1;
      var price = item ? priceFor(item, mode) : null;
      var amount = row.querySelector('[data-amount]');
      amount.textContent = price === null ? '—' : fmtInt(price * qty);
      if (price !== null) total += price * qty;
    }
    totalValue.textContent = fmtInt(total);
  }

  /* Экранирование имени для селектора атрибута */
  function cssEscape(s) {
    return s.replace(/["\\]/g, '\\$&');
  }

  buySellInput.addEventListener('input', renderItemList);
  buySellInput.addEventListener('focus', renderItemList);

  buySellInput.addEventListener('keydown', function (e) {
    var opts = buySellList.querySelectorAll('.combo-item');
    if (!buySellList.classList.contains('open') || opts.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      pickedIdx = (pickedIdx + 1) % opts.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      pickedIdx = (pickedIdx - 1 + opts.length) % opts.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pickItem(parseInt(opts[pickedIdx >= 0 ? pickedIdx : 0].getAttribute('data-i'), 10));
      return;
    } else if (e.key === 'Escape') {
      closeItemList();
      return;
    } else {
      return;
    }
    for (var i = 0; i < opts.length; i++) opts[i].classList.toggle('active', i === pickedIdx);
    opts[pickedIdx].scrollIntoView({ block: 'nearest' });
  });

  buySellList.addEventListener('mousedown', function (e) {
    var opt = e.target.closest('.combo-item');
    if (opt) {
      e.preventDefault();
      pickItem(parseInt(opt.getAttribute('data-i'), 10));
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.combo')) closeItemList();
  });

  function pickItem(i) {
    var item = ITEMS[i];
    if (!item) return;
    addItem(item.n);
    buySellInput.value = '';
    closeItemList();
    buySellInput.focus();
  }

  fillRecipes();
})();

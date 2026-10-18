/* Craft Calculator Logic */
(function () {
  'use strict';

  var profSelect = document.getElementById('craft-profession');
  var recipeSelect = document.getElementById('craft-recipe');
  var levelSelect = document.getElementById('craft-level');
  var qtyInput = document.getElementById('craft-qty');
  var qtyMinus = document.getElementById('craft-qty-minus');
  var qtyPlus = document.getElementById('craft-qty-plus');
  var placeholder = document.getElementById('craft-placeholder');
  var craftTable = document.getElementById('craft-table');
  var craftTbody = document.getElementById('craft-tbody');
  var rowTotal = document.getElementById('row-craft-total');
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
      placeholder.hidden = false;
      craftTable.hidden = true;
      rowTotal.hidden = true;
      return;
    }

    var level = clampInt(levelSelect.value, 1, 100, 1);
    var ings = ingredientsFor(selectedRecipe, level);

    placeholder.hidden = true;
    craftTable.hidden = false;
    rowTotal.hidden = false;

    var rowsHtml = '';
    for (var i = 0; i < ings.length; i++) {
      var name = ings[i][0];
      var perOne = ings[i][1];
      var all = perOne * qty;
      rowsHtml += '<tr><td class="ing-name">' + name + '</td>' +
        '<td class="ing-qty">' + fmtInt(perOne) + '</td>' +
        '<td class="ing-qty">' + fmtInt(all) + '</td></tr>';
    }
    craftTbody.innerHTML = rowsHtml;
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
    placeholder.hidden = false;
    craftTable.hidden = true;
    rowTotal.hidden = true;
  }

  copyBtn.addEventListener('click', function () {
    if (!selectedRecipe || !craftTbody.innerHTML) return;
    var qty = clampInt(qtyInput.value, 1, 999, 1);
    var level = clampInt(levelSelect.value, 1, 100, 1);
    var output = outputFor(selectedRecipe);
    var effect = effectFor(selectedRecipe, level);
    var text = '- производство = ' + qty + ' ' + output.toLowerCase();
    if (effect) text += ' (' + effect + ')';
    text += '\n';
    var rows = craftTbody.querySelectorAll('tr');
    var copiedIngredients = 0;
    for (var i = 0; i < rows.length; i++) {
      if (i < 2) continue;
      var cells = rows[i].querySelectorAll('td');
      if (cells.length >= 3) {
        text += (copiedIngredients === 0 ? '- ' : '') + cells[2].textContent.trim() + ' ' + cells[0].textContent.trim().toLowerCase() + '\n';
        copiedIngredients++;
      }
    }
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

  fillRecipes();
})();

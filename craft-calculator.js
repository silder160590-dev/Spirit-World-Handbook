    /* Craft Calculator Logic */
    (function() {
      var recipeSelect = document.getElementById('recipe-select');
      var recipeClear = document.getElementById('recipe-clear');
      var recipeQty = document.getElementById('recipe-qty');
      var recipeQtyMinus = document.getElementById('recipe-qty-minus');
      var recipeQtyPlus = document.getElementById('recipe-qty-plus');
      var recipeResults = document.getElementById('recipe-results');
      var recipeValue = document.getElementById('recipe-value');
      var recipeFormula = document.getElementById('recipe-formula');
      var copyBtn = document.getElementById('copy-btn');
      var craftTable = document.getElementById('craft-table');
      var craftTbody = document.getElementById('craft-tbody');

      var selectedRecipe = null;

      function clampInt(v, min, max, fallback) {
        var n = parseInt(v, 10);
        if (isNaN(n)) n = fallback;
        return Math.max(min, Math.min(max, n));
      }

      function fmtInt(v) {
        return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      }

      function renderRecipeSelect() {
        recipeSelect.innerHTML = '<option value="">-- Select a recipe --</option>';
        for (var i = 0; i < PRESET_RECIPES.length; i++) {
          var opt = document.createElement('option');
          opt.value = PRESET_RECIPES[i].result;
          opt.textContent = PRESET_RECIPES[i].name || PRESET_RECIPES[i].result;
          recipeSelect.appendChild(opt);
        }
      }

      function getRecipeByName(name) {
        for (var i = 0; i < PRESET_RECIPES.length; i++) {
          if (PRESET_RECIPES[i].result === name) return PRESET_RECIPES[i];
        }
        return null;
      }

      function recalc3() {
        var qty = clampInt(recipeQty.value, 1, 999, 1);
        recipeQty.value = String(qty);

        if (!selectedRecipe || !selectedRecipe.ingredients || selectedRecipe.ingredients.length === 0) {
          craftTable.hidden = true;
          recipeResults.hidden = true;
          return;
        }

        var ingredientsHtml = '';
        for (var i = 0; i < selectedRecipe.ingredients.length; i++) {
          var ing = selectedRecipe.ingredients[i];
          var ingName = ing[0];
          var ingQty = ing[1] * qty;
          ingredientsHtml += '<tr><td class="ing-name">' + ingName + '</td><td class="ing-qty">' + fmtInt(ingQty) + '</td></tr>';
        }
        craftTbody.innerHTML = ingredientsHtml;
        craftTable.hidden = false;

        recipeValue.textContent = selectedRecipe.result + ' x' + qty;
        recipeFormula.textContent = selectedRecipe.name || selectedRecipe.result;
        recipeResults.hidden = false;
      }

      function updateRecipeSelect() {
        var val = recipeSelect.value;
        selectedRecipe = null;
        if (val) {
          selectedRecipe = getRecipeByName(val);
        }
        recalc3();
      }

      recipeSelect.addEventListener('change', updateRecipeSelect);
      recipeQty.addEventListener('input', recalc3);

      recipeQtyMinus.addEventListener('click', function () {
        recipeQty.value = String(clampInt(recipeQty.value, 1, 999, 1) - 1);
        recalc3();
      });

      recipeQtyPlus.addEventListener('click', function () {
        recipeQty.value = String(clampInt(recipeQty.value, 1, 999, 1) + 1);
        recalc3();
      });

      recipeClear.addEventListener('click', function () {
        recipeSelect.selectedIndex = 0;
        selectedRecipe = null;
        recipeQty.value = '1';
        craftTable.hidden = true;
        recipeResults.hidden = true;
        recipeSelect.focus();
      });

      copyBtn.addEventListener('click', function () {
        if (!selectedRecipe || !craftTbody.innerHTML) return;
        var text = '';
        var rows = craftTbody.querySelectorAll('tr');
        for (var i = 0; i < rows.length; i++) {
          var cells = rows[i].querySelectorAll('td');
          if (cells.length >= 2) {
            text += cells[0].textContent.trim() + ': ' + cells[1].textContent.trim() + '\n';
          }
        }
        var textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(function () {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      });

      renderRecipeSelect();
    })();